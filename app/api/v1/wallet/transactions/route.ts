import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const wallet = await getOrCreateWallet(user.id);
    const type = req.nextUrl.searchParams.get("type");
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = 20;

    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id, ...(type ? { type: type as never } : {}) },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const total = await prisma.walletTransaction.count({
      where: { walletId: wallet.id, ...(type ? { type: type as never } : {}) },
    });

    return apiSuccess({ transactions, total, page, pageSize });
  } catch (err) {
    return handleApiError(err);
  }
}
