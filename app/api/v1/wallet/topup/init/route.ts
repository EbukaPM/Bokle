import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { topUpSchema } from "@/lib/validations/wallet";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { initializeTransaction } from "@/lib/paystack";
import { getSetting } from "@/lib/settings";
import { generateReference } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);
    if (!user.email) return apiError("Add an email to your profile before topping up", 400);

    const body = await req.json();
    const { amount } = topUpSchema.parse(body);

    const minTopUp = await getSetting("min_wallet_topup", 500);
    if (amount < minTopUp) return apiError(`Minimum top-up is ₦${minTopUp}`, 400);

    const reference = generateReference("TOPUP");
    const result = await initializeTransaction({
      email: user.email,
      amountKobo: Math.round(amount * 100),
      reference,
      metadata: { userId: user.id, purpose: "wallet_topup", amount },
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?ref=${reference}`,
    });

    return apiSuccess({
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      amount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
