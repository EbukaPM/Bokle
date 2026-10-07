import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const notification = await prisma.notification.findUnique({ where: { id: params.id } });
    if (!notification || notification.userId !== user.id) return apiError("Not found", 404);

    await prisma.notification.update({ where: { id: params.id }, data: { isRead: true } });
    return apiSuccess({ marked: true });
  } catch (err) {
    return handleApiError(err);
  }
}
