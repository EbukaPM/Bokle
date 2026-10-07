import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const search = req.nextUrl.searchParams.get("search");

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {},
      select: {
        id: true, fullName: true, email: true, phone: true, membershipTier: true,
        isProviderActive: true, providerVerified: true, isSuspended: true, isAdmin: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return apiSuccess({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
