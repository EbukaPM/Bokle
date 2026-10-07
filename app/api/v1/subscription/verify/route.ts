import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { verifyTransaction } from "@/lib/paystack";
import { activatePremium, getPlanPrice, type PlanType } from "@/lib/subscription";
import { prisma } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

const verifySchema = z.object({
  reference: z.string().min(1),
  plan: z.enum(["monthly", "quarterly", "annual"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { reference, plan } = verifySchema.parse(body);

    const existing = await prisma.subscription.findFirst({ where: { paystackRef: reference } });
    if (existing) return apiSuccess({ subscription: existing, duplicate: true });

    const result = await verifyTransaction(reference);
    if (result.data.status !== "success") return apiError("Payment was not successful", 400);

    const price = await getPlanPrice(plan as PlanType);
    const subscription = await activatePremium(user.id, plan as PlanType, price, reference);

    await sendNotification({
      userId: user.id,
      type: "premium_activated",
      title: "Welcome to Premium!",
      body: "Help Me Check Am is now unlocked on your account.",
      priority: "high",
    });

    return apiSuccess({ subscription, duplicate: false });
  } catch (err) {
    return handleApiError(err);
  }
}
