import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { rankEligibleProviders } from "@/lib/matching";
import { sendNotification } from "@/lib/notifications";

// Automatically assigns the top-ranked eligible provider to an open
// request (PRD P2: "AI-powered provider matching"). Falls back to a clear
// error when no eligible provider is found, rather than guessing.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const request = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
    if (!request || request.status !== "open") return apiError("Request is not open for matching", 400);

    const ranked = await rankEligibleProviders({
      categoryId: request.categoryId,
      requestType: request.requestType,
      state: request.serviceState,
      lga: request.serviceLga,
    });

    const best = ranked[0];
    if (!best) return apiError("No eligible provider found for this request", 404);

    const updated = await prisma.serviceRequest.update({
      where: { id: params.id },
      data: { status: "matched", assignedProviderId: best.provider.id, matchedAt: new Date() },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "auto_match",
        targetType: "service_request",
        targetId: params.id,
        newValue: { providerId: best.provider.id, score: best.score },
      },
    });

    await sendNotification({
      userId: best.provider.userId,
      type: "job_matched",
      title: "You've been matched to a job",
      body: "You were automatically matched based on your rating, experience, and location. Review and accept it.",
      priority: "high",
    });

    return apiSuccess({ request: updated, matchedProvider: best });
  } catch (err) {
    return handleApiError(err);
  }
}
