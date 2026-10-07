import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const schema = z.object({ suspended: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const { suspended } = schema.parse(body);

    const profile = await prisma.providerProfile.findUnique({ where: { id: params.id } });
    if (!profile) return apiError("Provider not found", 404);

    await prisma.user.update({ where: { id: profile.userId }, data: { isSuspended: suspended } });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: suspended ? "provider_suspended" : "provider_reactivated",
        targetType: "user",
        targetId: profile.userId,
      },
    });

    return apiSuccess({ suspended });
  } catch (err) {
    return handleApiError(err);
  }
}
