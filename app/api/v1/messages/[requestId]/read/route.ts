import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function PATCH(_req: Request, { params }: { params: { requestId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    await prisma.message.updateMany({
      where: { requestId: params.requestId, senderId: { not: user.id }, isRead: false },
      data: { isRead: true },
    });

    return apiSuccess({ marked: true });
  } catch (err) {
    return handleApiError(err);
  }
}
