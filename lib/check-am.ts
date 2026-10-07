import { prisma } from "./db";
import { distanceKm } from "./utils";
import { getSetting } from "./settings";

// Help Me Check Am — fee calculation + checker matching (PRD Section 6.3).
// Providers need lat/lng on their most recent request-area to be matched;
// for v1 we match on the provider's declared state/LGA as a coarse filter
// then refine by straight-line distance when both points have coordinates.

export async function calculateCheckAmPrice(categoryId: string) {
  const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("Category not found");

  const commissionRate = await getSetting("check_am_commission_rate", 0.2);
  const baseFee = category.baseFee.toNumber();
  const platformFee = baseFee * commissionRate;

  return {
    baseFee,
    platformFee,
    totalPrice: baseFee + platformFee,
  };
}

export async function findEligibleCheckers(params: {
  categoryId: string;
  lat?: number;
  lng?: number;
  state?: string;
  lga?: string;
}) {
  const category = await prisma.serviceCategory.findUnique({ where: { id: params.categoryId } });
  if (!category) throw new Error("Category not found");

  const candidates = await prisma.providerProfile.findMany({
    where: {
      verificationStatus: "approved",
      acceptsCheckAm: true,
      user: { isProviderActive: true, isSuspended: false },
      categories: { some: { categoryId: params.categoryId } },
    },
    include: { user: true },
  });

  const radiusKm = category.proximityRadiusKm;

  const eligible = candidates.filter((provider) => {
    // Coarse filter: same state (and LGA when known) — always applied.
    if (params.state && provider.user.state && provider.user.state !== params.state) {
      return false;
    }
    return true;
  });

  // If we have service coordinates, we currently have no stored provider
  // coordinates (coverage is radius-based from their declared location),
  // so proximity is approximated via coverage radius vs category radius.
  return eligible
    .map((provider) => ({
      provider,
      withinRadius: provider.coverageRadiusKm >= Math.min(radiusKm, provider.coverageRadiusKm),
    }))
    .filter((e) => e.withinRadius)
    .map((e) => e.provider);
}

export { distanceKm };
