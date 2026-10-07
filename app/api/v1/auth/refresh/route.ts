import { prisma } from "@/lib/db";
import { verifyRefreshToken, signAccessToken, setAuthCookies } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("bokle_refresh")?.value;
    if (!refreshToken) return apiError("Not authenticated", 401);

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) return apiError("Session expired. Please log in again.", 401);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.isSuspended) return apiError("Account unavailable", 403);

    const accessToken = await signAccessToken({ sub: user.id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin });
    await setAuthCookies(accessToken, refreshToken);

    return apiSuccess({ refreshed: true });
  } catch (err) {
    return handleApiError(err);
  }
}
