import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createOtp } from "@/lib/auth";
import { sendOtpSms } from "@/lib/termii";
import { sendOtpEmail } from "@/lib/resend";
import { sendOtpSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError, rateLimit } from "@/lib/api";

const isEmail = (s: string) => s.includes("@");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, purpose } = sendOtpSchema.parse(body);

    if (!rateLimit(`send-otp:${identifier}`, 3, 10 * 60 * 1000)) {
      return apiError("Too many OTP requests. Please try again in a few minutes.", 429);
    }

    if (purpose === "register") {
      const existing = await prisma.user.findFirst({
        where: isEmail(identifier) ? { email: identifier } : { phone: identifier },
      });
      if (existing) return apiError("An account with this email/phone already exists.", 409);
    }

    if (purpose === "login" || purpose === "password_reset") {
      const existing = await prisma.user.findFirst({
        where: isEmail(identifier) ? { email: identifier } : { phone: identifier },
      });
      if (!existing) return apiError("No account found with this email/phone.", 404);
    }

    const code = await createOtp(identifier, purpose);

    if (isEmail(identifier)) {
      await sendOtpEmail(identifier, code);
    } else {
      await sendOtpSms(identifier, code);
    }

    return apiSuccess({ sent: true });
  } catch (err) {
    return handleApiError(err);
  }
}
