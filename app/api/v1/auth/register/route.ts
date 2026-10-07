import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyOtp, signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import { registerSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);
    const identifier = data.email || data.phone!;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: data.email || undefined }, { phone: data.phone || undefined }] },
    });
    if (existing) return apiError("An account with this email/phone already exists.", 409);

    const otpResult = await verifyOtp(identifier, "register", data.otpCode);
    if (!otpResult.ok) return apiError(otpResult.reason || "Invalid verification code", 400);

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash,
        state: data.state,
        lga: data.lga,
        isEmailVerified: !!data.email,
        isPhoneVerified: !!data.phone,
      },
    });

    await prisma.wallet.create({ data: { userId: user.id } });

    const accessToken = await signAccessToken({ sub: user.id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin });
    const refreshToken = await signRefreshToken(user.id);
    await setAuthCookies(accessToken, refreshToken);

    await sendNotification({
      userId: user.id,
      type: "welcome",
      title: "Welcome to Bokle!",
      body: "Your account is ready. Complete your profile to get started.",
      priority: "low",
    });

    return apiSuccess({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        membershipTier: user.membershipTier,
      },
    }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
