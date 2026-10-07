import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { verifyTransaction, paystackMode } from "@/lib/paystack";
import { creditTopUp } from "@/lib/wallet";

const verifySchema = z.object({
  reference: z.string().min(1),
  // Only trusted in dev-mock mode (no live gateway to report the real
  // amount back); in live mode the amount always comes from Paystack.
  amount: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { reference, amount: devAmount } = verifySchema.parse(body);

    const result = await verifyTransaction(reference);
    if (result.data.status !== "success") {
      return apiError("Payment was not successful", 400);
    }

    const amount = paystackMode === "live" ? result.data.amount / 100 : devAmount;
    if (!amount) return apiError("Could not determine payment amount", 400);

    const { wallet, duplicate } = await creditTopUp(user.id, amount, reference);

    return apiSuccess({ wallet, duplicate });
  } catch (err) {
    return handleApiError(err);
  }
}
