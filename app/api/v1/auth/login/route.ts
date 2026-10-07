import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  isLockedOut,
  recordFailedLogin,
  clearLoginAttempts,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, rememberMe } = loginSchema.parse(body);

    if (isLockedOut(identifier)) {
      return apiError("Account locked due to too many failed attempts. Try again in 15 minutes.", 423);
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    if (!user || !user.passwordHash) {
      recordFailedLogin(identifier);
      return apiError("Invalid email/phone or password.", 401);
    }

    if (user.isSuspended) {
      return apiError("This account has been suspended. Contact support.", 403);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      recordFailedLogin(identifier);
      return apiError("Invalid email/phone or password.", 401);
    }

    clearLoginAttempts(identifier);

    const accessToken = await signAccessToken({ sub: user.id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin });
    const refreshToken = await signRefreshToken(user.id, rememberMe);
    await setAuthCookies(accessToken, refreshToken, rememberMe);

    return apiSuccess({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        membershipTier: user.membershipTier,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
