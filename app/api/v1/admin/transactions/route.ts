import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const type = req.nextUrl.searchParams.get("type");
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = 50;

    const transactions = await prisma.walletTransaction.findMany({
      where: type ? { type: type as never } : {},
      include: { wallet: { include: { user: { select: { fullName: true, email: true } } } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.walletTransaction.count({ where: type ? { type: type as never } : {} });

    return apiSuccess({ transactions, total, page, pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}
