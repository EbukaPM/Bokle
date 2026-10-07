import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateRequestStatusSchema } from "@/lib/validations/requests";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { sendNotification } from "@/lib/notifications";

const VALID_TRANSITIONS: Record<string, string[]> = {
  accepted: ["en_route"],
  en_route: ["on_site"],
  on_site: ["completed"],
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return apiError("Provider profile not found", 404);

    const body = await req.json();
    const { status } = updateRequestStatusSchema.parse(body);

    const job = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
    if (!job || job.assignedProviderId !== profile.id) return apiError("Job not found", 404);

    const allowedNext = VALID_TRANSITIONS[job.status] || [];
    if (!allowedNext.includes(status)) {
      return apiError(`Cannot move from ${job.status} to ${status}`, 400);
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: {
        status,
        ...(status === "completed" ? { completedAt: new Date() } : {}),
      },
    });

    await sendNotification({
      userId: job.clientId,
      type: "job_status_update",
      title: "Job update",
      body: `Your provider's status is now: ${status.replace("_", " ")}`,
      priority: "medium",
    });

    return apiSuccess({ job: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
