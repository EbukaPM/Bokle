import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { releaseEscrow } from "@/lib/wallet";
import { sendNotification } from "@/lib/notifications";
import { spawnNextRecurrence } from "@/lib/recurring";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const request = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: { assignedProvider: true },
    });
    if (!request || request.clientId !== user.id) return apiError("Request not found", 404);
    if (request.status !== "report_submitted" && request.status !== "completed") {
      return apiError("This request cannot be confirmed yet", 400);
    }

    await releaseEscrow(request.id);

    if (request.isRecurring) {
      await spawnNextRecurrence(request.id);
    }

    if (request.assignedProvider) {
      await sendNotification({
        userId: request.assignedProvider.userId,
        type: "job_confirmed",
        title: "Payment released",
        body: "The client confirmed your job and your earnings have been released to your wallet.",
        priority: "high",
      });
    }

    return apiSuccess({ confirmed: true });
  } catch (err) {
    return handleApiError(err);
  }
}
