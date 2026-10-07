import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { trainingModuleSchema } from "@/lib/validations/training";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const data = trainingModuleSchema.partial().parse(body);

    const module_ = await prisma.trainingModule.update({ where: { id: params.id }, data });
    return apiSuccess({ module: module_ });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    await prisma.trainingModule.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
