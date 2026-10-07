import { prisma } from "./db";
import { getSetting } from "./settings";

export type PlanType = "monthly" | "quarterly" | "annual";

const PLAN_DURATION_DAYS: Record<PlanType, number> = {
  monthly: 30,
  quarterly: 90,
  annual: 365,
};

const PLAN_SETTING_KEY: Record<PlanType, string> = {
  monthly: "premium_price_monthly",
  quarterly: "premium_price_quarterly",
  annual: "premium_price_annual",
};

const PLAN_FALLBACK_PRICE: Record<PlanType, number> = {
  monthly: 2500,
  quarterly: 6500,
  annual: 24000,
};

export async function getPlanPrice(plan: PlanType) {
  return getSetting(PLAN_SETTING_KEY[plan], PLAN_FALLBACK_PRICE[plan]);
}

export async function getAllPlanPrices() {
  return {
    monthly: await getPlanPrice("monthly"),
    quarterly: await getPlanPrice("quarterly"),
    annual: await getPlanPrice("annual"),
  };
}

export async function activatePremium(
  userId: string,
  plan: PlanType,
  amountPaid: number,
  paystackRef?: string
) {
  const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS[plan] * 24 * 60 * 60 * 1000);

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planType: plan,
      amountPaid,
      status: "active",
      expiresAt,
      paystackRef,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { membershipTier: "premium", premiumExpiresAt: expiresAt },
  });

  return subscription;
}

// Atomic wallet-funded purchase: creates the Subscription row, debits the
// wallet, and upgrades the user's tier in a single transaction so a
// balance check failure never grants premium, and a successful debit
// never leaves the user un-upgraded.
export async function purchasePremiumFromWallet(userId: string, plan: PlanType, price: number) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error("Wallet not found");
    if (wallet.availableBalance.lessThan(price)) throw new Error("INSUFFICIENT_BALANCE");

    const expiresAt = new Date(Date.now() + PLAN_DURATION_DAYS[plan] * 24 * 60 * 60 * 1000);

    const subscription = await tx.subscription.create({
      data: { userId, planType: plan, amountPaid: price, status: "active", expiresAt },
    });

    const balanceBefore = wallet.availableBalance;
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { availableBalance: balanceBefore.minus(price) },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "subscription",
        amount: -price,
        balanceBefore,
        balanceAfter: updatedWallet.availableBalance,
        reference: `SUB_${subscription.id}`,
        description: "Premium subscription payment",
        subscriptionId: subscription.id,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { membershipTier: "premium", premiumExpiresAt: expiresAt },
    });

    return subscription;
  });
}

export async function cancelSubscription(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  if (!sub) throw new Error("No active subscription found");

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  // Premium access continues until end of current billing period (PRD 5).
  return sub;
}

export async function isPremiumActive(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (user.membershipTier !== "premium") return false;
  if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) return false;
  return true;
}

// Should run on a schedule (BullMQ cron) to downgrade expired premium users.
export async function expirePremiumUsers() {
  const expiredUsers = await prisma.user.findMany({
    where: { membershipTier: "premium", premiumExpiresAt: { lt: new Date() } },
  });

  for (const user of expiredUsers) {
    await prisma.user.update({ where: { id: user.id }, data: { membershipTier: "free" } });
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: "active" },
      data: { status: "expired" },
    });
  }

  return expiredUsers.length;
}
