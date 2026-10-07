import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me");
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 7;
const REFRESH_TOKEN_TTL_DAYS_REMEMBER = 30;

export interface AccessTokenPayload {
  sub: string; // user id
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(userId: string, rememberMe = false) {
  const days = rememberMe ? REFRESH_TOKEN_TTL_DAYS_REMEMBER : REFRESH_TOKEN_TTL_DAYS;
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

export async function setAuthCookies(accessToken: string, refreshToken: string, rememberMe = false) {
  const cookieStore = await cookies();
  const days = rememberMe ? REFRESH_TOKEN_TTL_DAYS_REMEMBER : REFRESH_TOKEN_TTL_DAYS;

  cookieStore.set("bokle_access", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });
  cookieStore.set("bokle_refresh", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("bokle_access");
  cookieStore.delete("bokle_refresh");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("bokle_access")?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.isSuspended) return null;
  return user;
}

// ─── OTP ───────────────────────────────────────────

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 3;

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(identifier: string, purpose: "register" | "login" | "password_reset") {
  const code = generateOtp();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { identifier, codeHash, purpose, expiresAt },
  });

  return code;
}

export async function verifyOtp(
  identifier: string,
  purpose: "register" | "login" | "password_reset",
  code: string
): Promise<{ ok: boolean; reason?: string }> {
  const otp = await prisma.otpCode.findFirst({
    where: { identifier, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, reason: "No OTP found. Please request a new code." };
  if (otp.expiresAt < new Date()) return { ok: false, reason: "OTP has expired." };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "Too many attempts. Please request a new code." };

  const valid = await bcrypt.compare(code, otp.codeHash);
  if (!valid) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, reason: "Incorrect code." };
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return { ok: true };
}

// ─── Login lockout (5 failed attempts -> 15 min lock) ───────────
// In-memory for v1 single-instance dev; move to Redis for multi-instance prod.

const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();

export function isLockedOut(identifier: string) {
  const entry = loginAttempts.get(identifier);
  if (!entry?.lockedUntil) return false;
  if (Date.now() > entry.lockedUntil) {
    loginAttempts.delete(identifier);
    return false;
  }
  return true;
}

export function recordFailedLogin(identifier: string) {
  const entry = loginAttempts.get(identifier) ?? { count: 0 };
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockedUntil = Date.now() + 15 * 60 * 1000;
  }
  loginAttempts.set(identifier, entry);
}

export function clearLoginAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}
