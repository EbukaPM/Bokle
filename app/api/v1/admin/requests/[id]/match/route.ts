import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { sendNotification } from "@/lib/notifications";

const schema = z.object({ providerId: z.string().uuid() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const body = await req.json();
    const { providerId } = schema.parse(body);

    const request = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
    if (!request || request.status !== "open") return apiError("Request is not open for matching", 400);

    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } });
    if (!provider || provider.verificationStatus !== "approved") return apiError("Provider not eligible", 400);

    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: { status: "matched", assignedProviderId: providerId, matchedAt: new Date() },
    });

    await prisma.adminAuditLog.create({
      data: { adminId: admin.id, action: "manual_match", targetType: "service_request", targetId: params.id, newValue: { providerId } },
    });

    await sendNotification({
      userId: provider.userId,
      type: "job_matched",
      title: "You've been matched to a job",
      body: "An admin has matched you to a request. Review and accept it.",
      priority: "high",
    });

    return apiSuccess({ request: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
