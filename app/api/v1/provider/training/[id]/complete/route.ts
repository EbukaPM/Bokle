import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return apiError("Provider profile not found", 404);

    const module_ = await prisma.trainingModule.findUnique({ where: { id: params.id } });
    if (!module_ || !module_.isPublished) return apiError("Module not found", 404);

    const progress = await prisma.providerTrainingProgress.upsert({
      where: { providerId_moduleId: { providerId: profile.id, moduleId: params.id } },
      create: { providerId: profile.id, moduleId: params.id },
      update: {},
    });

    return apiSuccess({ progress });
  } catch (err) {
    return handleApiError(err);
  }
}
