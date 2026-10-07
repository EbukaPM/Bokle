import { prisma } from "./db";
import type { ProviderProfile, User } from "@prisma/client";

// Composite provider-matching score (PRD P2: "AI-powered provider
// matching"). v1 has no live GPS trail for providers, so "proximity" is
// approximated from state/LGA match rather than true distance — swap in
// real geo-distance once providers carry a live lat/lng.
//
// Weights sum to 100:
//   40  rating (only counts once a provider has enough reviews to be fair)
//   20  response rate
//   20  experience (completed jobs, log-scaled so one job doesn't dominate)
//   20  location match (same state / same LGA)
const MIN_REVIEWS_FOR_RATING = 5;

export interface ScoredProvider {
  provider: ProviderProfile & { user: Pick<User, "id" | "fullName" | "avatarUrl" | "state" | "lga"> };
  score: number;
  breakdown: { rating: number; responseRate: number; experience: number; location: number };
}

export function scoreProvider(
  provider: ProviderProfile & { user: Pick<User, "state" | "lga"> },
  target: { state?: string | null; lga?: string | null }
): ScoredProvider["breakdown"] & { total: number } {
  const ratingScore =
    provider.totalReviews >= MIN_REVIEWS_FOR_RATING ? (provider.avgRating.toNumber() / 5) * 40 : 20; // neutral mid-score when not enough reviews to judge

  const responseRateScore = (provider.responseRate.toNumber() / 100) * 20;

  const experienceScore = Math.min(20, Math.log2(provider.totalJobs + 1) * 5);

  let locationScore = 0;
  if (target.state && provider.user.state === target.state) {
    locationScore += 12;
    if (target.lga && provider.user.lga === target.lga) locationScore += 8;
  }

  const total = ratingScore + responseRateScore + experienceScore + locationScore;

  return { rating: ratingScore, responseRate: responseRateScore, experience: experienceScore, location: locationScore, total };
}

export async function rankEligibleProviders(params: {
  categoryId: string;
  requestType: "general" | "check_am";
  state?: string | null;
  lga?: string | null;
}): Promise<ScoredProvider[]> {
  const candidates = await prisma.providerProfile.findMany({
    where: {
      verificationStatus: "approved",
      user: { isProviderActive: true, isSuspended: false },
      categories: { some: { categoryId: params.categoryId } },
      ...(params.requestType === "check_am" ? { acceptsCheckAm: true } : {}),
    },
    include: { user: { select: { id: true, fullName: true, avatarUrl: true, state: true, lga: true } } },
  });

  const ranked = candidates.map((provider) => {
    const breakdown = scoreProvider(provider, params);
    return {
      provider,
      score: Math.round(breakdown.total * 10) / 10,
      breakdown: { rating: breakdown.rating, responseRate: breakdown.responseRate, experience: breakdown.experience, location: breakdown.location },
    };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}
