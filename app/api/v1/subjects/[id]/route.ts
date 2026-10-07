import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { savedSubjectSchema } from "@/lib/validations/subjects";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

async function assertOwnership(id: string, userId: string) {
  const subject = await prisma.savedSubject.findUnique({ where: { id } });
  if (!subject || subject.clientId !== userId) return null;
  return subject;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const existing = await assertOwnership(params.id, user.id);
    if (!existing) return apiError("Not found", 404);

    const body = await req.json();
    const data = savedSubjectSchema.partial().parse(body);

    const subject = await prisma.savedSubject.update({ where: { id: params.id }, data });
    return apiSuccess({ subject });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const existing = await assertOwnership(params.id, user.id);
    if (!existing) return apiError("Not found", 404);

    await prisma.savedSubject.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
