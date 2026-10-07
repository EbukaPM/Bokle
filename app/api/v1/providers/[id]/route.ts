import { prisma } from "@/lib/db";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, state: true, lga: true, bio: true } },
        categories: { include: { category: true } },
        availability: true,
      },
    });

    if (!provider || provider.verificationStatus !== "approved") {
      return apiError("Provider not found", 404);
    }

    const reviews = await prisma.review.findMany({
      where: { revieweeId: provider.userId, isPublic: true, reviewerRole: "client" },
      include: { reviewer: { select: { fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return apiSuccess({ provider, reviews });
  } catch (err) {
    return handleApiError(err);
  }
}
