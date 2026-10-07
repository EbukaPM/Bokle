import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const requests = await prisma.serviceRequest.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(type ? { requestType: type as never } : {}),
      },
      include: {
        client: { select: { fullName: true, email: true, phone: true } },
        category: true,
        assignedProvider: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return apiSuccess({ requests });
  } catch (err) {
    return handleApiError(err);
  }
}
