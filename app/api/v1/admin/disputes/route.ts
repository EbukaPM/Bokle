import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const status = req.nextUrl.searchParams.get("status");

    const disputes = await prisma.dispute.findMany({
      where: status ? { status: status as never } : {},
      include: {
        request: { include: { category: true, client: { select: { fullName: true } } } },
        raisedByUser: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ disputes });
  } catch (err) {
    return handleApiError(err);
  }
}
