import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      include: { categories: true },
    });
    if (!profile || profile.verificationStatus !== "approved") {
      return apiSuccess({ jobs: [] });
    }

    const categoryIds = profile.categories.map((c) => c.categoryId);

    const jobs = await prisma.serviceRequest.findMany({
      where: {
        status: "open",
        categoryId: { in: categoryIds },
        ...(profile.acceptsCheckAm ? {} : { requestType: "general" }),
      },
      include: { category: true, client: { select: { fullName: true, state: true, lga: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ jobs });
  } catch (err) {
    return handleApiError(err);
  }
}
