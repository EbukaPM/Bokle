import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { switchRoleSchema } from "@/lib/validations/users";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

// Role is mostly a client-side UI toggle (PRD 4: "switching roles does not
// log out or restart the session"). This endpoint only matters when
// switching INTO provider mode, where it enforces profile completion
// before letting the provider go live/searchable.
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { role } = switchRoleSchema.parse(body);

    if (role === "client") {
      return apiSuccess({ role: "client" });
    }

    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: user.id },
      include: { categories: true },
    });

    const missing: string[] = [];
    if (!user.avatarUrl) missing.push("profile photo");
    if (!user.bio) missing.push("bio");
    if (!providerProfile || providerProfile.categories.length === 0) missing.push("service category");
    if (!providerProfile) missing.push("coverage area");

    if (missing.length > 0) {
      return apiError("Complete your provider profile to go live.", 409, { missing });
    }

    await prisma.user.update({ where: { id: user.id }, data: { isProviderActive: true } });
    return apiSuccess({ role: "provider" });
  } catch (err) {
    return handleApiError(err);
  }
}
