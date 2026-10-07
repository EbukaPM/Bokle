import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { sendNotification } from "@/lib/notifications";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile || profile.verificationStatus !== "approved") {
      return apiError("Only verified providers can accept jobs", 403);
    }

    const job = await prisma.$transaction(async (tx) => {
      const existing = await tx.serviceRequest.findUnique({ where: { id: params.id } });
      if (!existing) throw new Error("This job is no longer available");

      const isOpenForAnyone = existing.status === "open";
      const isMatchedToMe = existing.status === "matched" && existing.assignedProviderId === profile.id;
      if (!isOpenForAnyone && !isMatchedToMe) {
        throw new Error("This job is no longer available");
      }

      return tx.serviceRequest.update({
        where: { id: params.id },
        data: {
          status: "accepted",
          assignedProviderId: profile.id,
          matchedAt: existing.matchedAt ?? new Date(),
          acceptedAt: new Date(),
        },
      });
    });

    await sendNotification({
      userId: job.clientId,
      type: "job_accepted",
      title: "Your request was accepted",
      body: "A verified provider has accepted your request and will be in touch.",
      priority: "high",
    });

    return apiSuccess({ job });
  } catch (err) {
    return handleApiError(err);
  }
}
