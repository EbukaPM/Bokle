import { prisma } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const MIN_JOBS_FOR_PUBLIC_RATING = 5;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const provider = await prisma.providerProfile.findUnique({ where: { userId: params.id } });
    if (!provider) return apiError("Provider not found", 404);

    const reviews = await prisma.review.findMany({
      where: { revieweeId: params.id, isPublic: true, reviewerRole: "client" },
      include: { reviewer: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });

    const ratingVisible = provider.totalJobs >= MIN_JOBS_FOR_PUBLIC_RATING;

    return apiSuccess({
      reviews,
      avgRating: ratingVisible ? provider.avgRating : null,
      totalReviews: ratingVisible ? provider.totalReviews : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
