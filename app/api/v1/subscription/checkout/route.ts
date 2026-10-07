import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscribeSchema } from "@/lib/validations/wallet";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { getPlanPrice, purchasePremiumFromWallet } from "@/lib/subscription";
import { initializeTransaction } from "@/lib/paystack";
import { generateReference } from "@/lib/utils";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { plan, paymentMethod } = subscribeSchema.parse(body);

    const price = await getPlanPrice(plan);

    if (paymentMethod === "wallet") {
      const subscription = await purchasePremiumFromWallet(user.id, plan, price);

      await sendNotification({
        userId: user.id,
        type: "premium_activated",
        title: "Welcome to Premium!",
        body: "Help Me Check Am is now unlocked on your account.",
        priority: "high",
      });

      return apiSuccess({ subscription, activated: true });
    }

    // Paystack checkout
    if (!user.email) return apiError("Add an email to your profile before paying by card", 400);
    const reference = generateReference("SUBCHK");
    const result = await initializeTransaction({
      email: user.email,
      amountKobo: Math.round(price * 100),
      reference,
      metadata: { userId: user.id, purpose: "premium_subscription", plan },
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/check-am/upgrade?ref=${reference}`,
    });

    return apiSuccess({
      authorizationUrl: result.data.authorization_url,
      reference: result.data.reference,
      activated: false,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
