import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createOtp } from "@/lib/auth";
import { sendOtpSms } from "@/lib/termii";
import { sendOtpEmail } from "@/lib/resend";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { apiSuccess, handleApiError, rateLimit, apiError } from "@/lib/api";

const isEmail = (s: string) => s.includes("@");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier } = forgotPasswordSchema.parse(body);

    if (!rateLimit(`forgot-password:${identifier}`, 3, 10 * 60 * 1000)) {
      return apiError("Too many requests. Please try again in a few minutes.", 429);
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });

    // Always return success to avoid leaking account existence.
    if (!user) return apiSuccess({ sent: true });

    const code = await createOtp(identifier, "password_reset");
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
