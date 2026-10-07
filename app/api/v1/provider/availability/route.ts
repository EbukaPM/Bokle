import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { providerAvailabilitySchema } from "@/lib/validations/users";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return apiSuccess({ availability: [] });

    const availability = await prisma.providerAvailability.findMany({ where: { providerId: profile.id } });
    return apiSuccess({ availability });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const slots = providerAvailabilitySchema.parse(body);

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    await prisma.providerAvailability.deleteMany({ where: { providerId: profile.id } });
    await prisma.providerAvailability.createMany({
      data: slots.map((s) => ({ providerId: profile.id, ...s })),
    });

    const availability = await prisma.providerAvailability.findMany({ where: { providerId: profile.id } });
    return apiSuccess({ availability });
  } catch (err) {
    return handleApiError(err);
  }
}
