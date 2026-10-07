import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { userId: user.id },
      include: { bankAccount: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ withdrawals });
  } catch (err) {
    return handleApiError(err);
  }
}
