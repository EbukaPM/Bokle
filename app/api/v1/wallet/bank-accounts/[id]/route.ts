import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const account = await prisma.bankAccount.findUnique({ where: { id: params.id } });
    if (!account || account.userId !== user.id) return apiError("Not found", 404);

    await prisma.bankAccount.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
