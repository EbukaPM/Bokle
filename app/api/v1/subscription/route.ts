import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { getAllPlanPrices, isPremiumActive } from "@/lib/subscription";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    const isPremium = await isPremiumActive(user.id);
    const prices = await getAllPlanPrices();

    return apiSuccess({
      isPremium,
      membershipTier: user.membershipTier,
      premiumExpiresAt: user.premiumExpiresAt,
      activeSubscription,
      prices,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
