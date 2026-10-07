import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { sendNotification } from "@/lib/notifications";

const verifySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  adminNotes: z.string().max(500).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const { decision, adminNotes } = verifySchema.parse(body);

    const profile = await prisma.providerProfile.update({
      where: { id: params.id },
      data: {
        verificationStatus: decision,
        adminNotes,
        verifiedAt: decision === "approved" ? new Date() : null,
      },
      include: { user: true },
    });

    if (decision === "approved") {
      await prisma.user.update({ where: { id: profile.userId }, data: { providerVerified: true } });
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: `provider_${decision}`,
        targetType: "provider_profile",
        targetId: profile.id,
        newValue: { decision, adminNotes },
      },
    });

    await sendNotification({
      userId: profile.userId,
      type: "verification_update",
      title: decision === "approved" ? "You're verified!" : "Verification update",
      body:
        decision === "approved"
          ? "Your provider profile has been approved. You can now appear in search and accept jobs."
          : `Your verification was not approved. ${adminNotes || ""}`,
      priority: "high",
    });

    return apiSuccess({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}
