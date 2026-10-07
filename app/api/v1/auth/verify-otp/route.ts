import { NextRequest } from "next/server";
import { verifyOtp } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

// Standalone OTP check (used by the client to validate a code before
// final submission on a multi-step form). Does not consume the OTP.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, purpose, code } = verifyOtpSchema.parse(body);

    const result = await verifyOtp(identifier, purpose, code);
    if (!result.ok) return apiError(result.reason || "Invalid code", 400);

    return apiSuccess({ valid: true });
  } catch (err) {
    return handleApiError(err);
  }
}
