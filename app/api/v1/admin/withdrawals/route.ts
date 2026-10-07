import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const status = req.nextUrl.searchParams.get("status") || "pending";

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { status: status as never },
      include: { user: { select: { fullName: true, email: true, phone: true } }, bankAccount: true },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({ withdrawals });
  } catch (err) {
    return handleApiError(err);
  }
}
