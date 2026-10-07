import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { getOrCreateWallet } from "@/lib/wallet";

// Weekly earnings for the last 12 weeks, for the provider earnings chart
// (PRD P1: "Provider earnings analytics (weekly/monthly chart)").
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return apiSuccess({ hasProfile: false });

    const wallet = await getOrCreateWallet(user.id);

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);

    const earnedTransactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id, type: "earned", createdAt: { gte: twelveWeeksAgo } },
      orderBy: { createdAt: "asc" },
    });

    const [totalAgg, todayAgg, weekAgg, monthAgg] = await Promise.all([
      prisma.walletTransaction.aggregate({ where: { walletId: wallet.id, type: "earned" }, _sum: { amount: true } }),
      prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: "earned", createdAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: "earned", createdAt: { gte: startOfWeek } },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { walletId: wallet.id, type: "earned", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    // Bucket into 12 weekly buckets for the chart.
    const buckets: { weekStart: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const bucketEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const amount = earnedTransactions
        .filter((t) => t.createdAt >= bucketStart && t.createdAt < bucketEnd)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);
      buckets.push({ weekStart: bucketStart.toISOString().slice(0, 10), amount });
    }

    return apiSuccess({
      hasProfile: true,
      totalEarned: totalAgg._sum.amount ?? 0,
      earnedToday: todayAgg._sum.amount ?? 0,
      earnedThisWeek: weekAgg._sum.amount ?? 0,
      earnedThisMonth: monthAgg._sum.amount ?? 0,
      weeklySeries: buckets,
      stats: {
        totalJobs: profile.totalJobs,
        avgRating: profile.totalJobs >= 5 ? profile.avgRating : null,
        totalReviews: profile.totalReviews,
        responseRate: profile.responseRate,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
