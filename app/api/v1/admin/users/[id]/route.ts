import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin, requireSuperAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const schema = z.object({
  isSuspended: z.boolean().optional(),
  grantPremiumDays: z.number().int().positive().optional(),
  revokePremium: z.boolean().optional(),
  isEnterprise: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const { isSuspended, grantPremiumDays, revokePremium, isEnterprise } = schema.parse(body);

    if ((grantPremiumDays || revokePremium) && !(await requireSuperAdmin())) {
      return apiError("Granting/revoking premium requires super-admin", 403);
    }

    const data: Prisma.UserUpdateInput = {};
    const logSummary: Record<string, string | boolean> = {};
    if (isSuspended !== undefined) {
      data.isSuspended = isSuspended;
      logSummary.isSuspended = isSuspended;
    }
    if (grantPremiumDays) {
      const premiumExpiresAt = new Date(Date.now() + grantPremiumDays * 24 * 60 * 60 * 1000);
      data.membershipTier = "premium";
      data.premiumExpiresAt = premiumExpiresAt;
      logSummary.grantedPremiumUntil = premiumExpiresAt.toISOString();
    }
    if (revokePremium) {
      data.membershipTier = "free";
      data.premiumExpiresAt = null;
      logSummary.revokedPremium = true;
    }
    if (isEnterprise !== undefined) {
      data.isEnterprise = isEnterprise;
      logSummary.isEnterprise = isEnterprise;
    }

    const user = await prisma.user.update({ where: { id: params.id }, data });

    await prisma.adminAuditLog.create({
      data: { adminId: admin.id, action: "user_updated", targetType: "user", targetId: params.id, newValue: logSummary },
    });

    return apiSuccess({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
