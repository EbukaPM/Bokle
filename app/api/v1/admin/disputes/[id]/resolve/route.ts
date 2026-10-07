import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { releaseEscrow, refundEscrow } from "@/lib/wallet";
import { sendNotification } from "@/lib/notifications";

const schema = z.object({
  resolution: z.enum(["resolved_for_client", "resolved_for_provider", "closed"]),
  resolutionNotes: z.string().min(1),
  refundPortion: z.enum(["full", "partial", "none"]).default("none"),
  partialAmount: z.number().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const { resolution, resolutionNotes, refundPortion, partialAmount } = schema.parse(body);

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: { request: { include: { assignedProvider: true } } },
    });
    if (!dispute) return apiError("Dispute not found", 404);

    if (resolution === "resolved_for_client" && refundPortion !== "none") {
      await refundEscrow(dispute.requestId, refundPortion === "full" ? "full" : "partial", partialAmount);
    } else if (resolution === "resolved_for_provider") {
      await releaseEscrow(dispute.requestId);
    }

    const updated = await prisma.dispute.update({
      where: { id: params.id },
      data: { status: resolution, resolutionNotes, resolvedBy: admin.id, resolvedAt: new Date() },
    });

    await prisma.adminAuditLog.create({
      data: { adminId: admin.id, action: "dispute_resolved", targetType: "dispute", targetId: params.id, newValue: { resolution, resolutionNotes } },
    });

    await sendNotification({
      userId: dispute.raisedBy,
      type: "dispute_resolved",
      title: "Your dispute has been resolved",
      body: resolutionNotes,
      priority: "high",
    });

    return apiSuccess({ dispute: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
