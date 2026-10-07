import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const status = req.nextUrl.searchParams.get("status");

    const providers = await prisma.providerProfile.findMany({
      where: status ? { verificationStatus: status as never } : {},
      include: { user: { select: { id: true, fullName: true, email: true, phone: true, isSuspended: true, isProviderActive: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ providers });
  } catch (err) {
    return handleApiError(err);
  }
}
