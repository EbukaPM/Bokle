import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });

    const modules = await prisma.trainingModule.findMany({
      where: { isPublished: true },
      include: {
        category: true,
        progress: profile ? { where: { providerId: profile.id } } : false,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return apiSuccess({ modules });
  } catch (err) {
    return handleApiError(err);
  }
}
