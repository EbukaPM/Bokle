import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const subscriptions = await prisma.subscription.findMany({
      include: { user: { select: { fullName: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return apiSuccess({ subscriptions });
  } catch (err) {
    return handleApiError(err);
  }
}
