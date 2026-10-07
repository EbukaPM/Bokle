import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validations/reviews";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { requestId, rating, comment } = createReviewSchema.parse(body);

    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { assignedProvider: true },
    });
    if (!request || request.status !== "confirmed") {
      return apiError("You can only review completed, confirmed jobs", 400);
    }
    if (!request.assignedProvider) return apiError("No provider on this request", 400);

    const isClient = request.clientId === user.id;
    const isProvider = request.assignedProvider.userId === user.id;
    if (!isClient && !isProvider) return apiError("Request not found", 404);

    const revieweeId = isClient ? request.assignedProvider.userId : request.clientId;
    const reviewerRole = isClient ? "client" : "provider";

    const existing = await prisma.review.findFirst({ where: { requestId, reviewerId: user.id } });
    if (existing) return apiError("You already reviewed this job", 409);

    const review = await prisma.review.create({
      data: {
        requestId,
        reviewerId: user.id,
        revieweeId,
        reviewerRole,
        rating,
        comment,
        isPublic: reviewerRole === "client", // provider reviews of clients stay private
      },
    });

    if (reviewerRole === "client" && request.assignedProvider) {
      const providerReviews = await prisma.review.findMany({
        where: { revieweeId, reviewerRole: "client" },
      });
      const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;

      await prisma.providerProfile.update({
        where: { id: request.assignedProvider.id },
        data: { avgRating: avg, totalReviews: providerReviews.length },
      });
    }

    return apiSuccess({ review }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
