import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      requestsToday,
      requestsWeek,
      requestsMonth,
      activeProviders,
      pendingVerifications,
      completedJobs,
      pendingJobs,
      disputedJobs,
      premiumSubscribers,
      flaggedReports,
      commissionAgg,
      premiumRevenueAgg,
    ] = await Promise.all([
      prisma.serviceRequest.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.serviceRequest.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.serviceRequest.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { isProviderActive: true, isSuspended: false } }),
      prisma.providerProfile.count({ where: { verificationStatus: "pending" } }),
      prisma.serviceRequest.count({ where: { status: "confirmed" } }),
      prisma.serviceRequest.count({ where: { status: { in: ["open", "matched", "accepted", "en_route", "on_site"] } } }),
      prisma.serviceRequest.count({ where: { status: "disputed" } }),
      prisma.user.count({ where: { membershipTier: "premium" } }),
      prisma.report.count({ where: { isConcernFlagged: true } }),
      prisma.walletTransaction.aggregate({ where: { type: "commission" }, _sum: { amount: true } }),
      prisma.subscription.aggregate({ where: { status: "active" }, _sum: { amountPaid: true } }),
    ]);

    const generalVsCheckAm = await prisma.serviceRequest.groupBy({
      by: ["requestType"],
      _count: true,
      where: { createdAt: { gte: startOfMonth } },
    });

    return apiSuccess({
      requests: { today: requestsToday, week: requestsWeek, month: requestsMonth, byType: generalVsCheckAm },
      providers: { active: activeProviders, pendingVerifications },
      jobs: { completed: completedJobs, pending: pendingJobs, disputed: disputedJobs },
      premium: { subscribers: premiumSubscribers, revenue: premiumRevenueAgg._sum.amountPaid ?? 0 },
      flaggedReports,
      commissionEarned: commissionAgg._sum.amount ?? 0,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
