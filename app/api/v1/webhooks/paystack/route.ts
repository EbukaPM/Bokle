import { NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { creditTopUp } from "@/lib/wallet";
import { activatePremium, type PlanType } from "@/lib/subscription";
import { prisma } from "@/lib/db";

// Paystack calls this directly — no cookie session, auth is via HMAC-SHA512
// signature verification against the raw body (PRD Section 12).
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { metadata, reference, amount, channel, customer } = event.data;

    if (metadata?.purpose === "wallet_topup") {
      await creditTopUp(metadata.userId, amount / 100, reference);
    } else if (metadata?.purpose === "premium_subscription") {
      const existing = await prisma.subscription.findFirst({ where: { paystackRef: reference } });
      if (!existing) {
        await activatePremium(metadata.userId, metadata.plan as PlanType, amount / 100, reference);
      }
    } else if (channel === "dedicated_nuban") {
      // Direct bank transfer into a user's Dedicated Virtual Account — not
      // initiated through our checkout, so there's no metadata.userId.
      // Match on the Paystack customer code we stored when the DVA was created.
      const user = await prisma.user.findFirst({
        where: { paystackCustomerCode: customer?.customer_code },
      });
      if (user) {
        await creditTopUp(user.id, amount / 100, reference);
      }
    }
  }

  return new Response("OK", { status: 200 });
}
