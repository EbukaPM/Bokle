import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { providerProfileSchema } from "@/lib/validations/users";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      include: { categories: { include: { category: true } }, availability: true },
    });

    return apiSuccess({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const data = providerProfileSchema.parse(body);
    const { categoryIds, ...profileData } = data;

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...profileData },
      update: profileData,
    });

    if (categoryIds) {
      await prisma.providerCategory.deleteMany({ where: { providerId: profile.id } });
      await prisma.providerCategory.createMany({
        data: categoryIds.map((categoryId) => ({ providerId: profile.id, categoryId })),
      });
    }

    const updated = await prisma.providerProfile.findUnique({
      where: { id: profile.id },
      include: { categories: { include: { category: true } } },
    });

    return apiSuccess({ profile: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
