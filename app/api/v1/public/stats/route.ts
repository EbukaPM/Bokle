import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api";
import { getAllPlanPrices } from "@/lib/subscription";

// Public, unauthenticated — powers the landing page's stats and pricing
// teaser with real numbers rather than hardcoded marketing copy.
export async function GET() {
  try {
    const [verifiedProviders, completedJobs, cities, prices] = await Promise.all([
      prisma.providerProfile.count({ where: { verificationStatus: "approved" } }),
      prisma.serviceRequest.count({ where: { status: "confirmed" } }),
      prisma.user
        .findMany({ where: { isProviderActive: true, state: { not: null } }, select: { state: true }, distinct: ["state"] })
        .then((rows) => rows.length),
      getAllPlanPrices(),
    ]);

    return apiSuccess({ verifiedProviders, completedJobs, cities, prices });
  } catch (err) {
    return handleApiError(err);
  }
}
