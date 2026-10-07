import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
    const pageSize = 20;

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const unreadCount = await prisma.notification.count({ where: { userId: user.id, isRead: false } });

    return apiSuccess({ notifications, unreadCount });
  } catch (err) {
    return handleApiError(err);
  }
}
