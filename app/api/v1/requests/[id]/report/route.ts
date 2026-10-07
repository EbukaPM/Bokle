import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const request = await prisma.serviceRequest.findUnique({
      where: { id: params.id },
      include: { assignedProvider: true },
    });
    if (!request) return apiError("Request not found", 404);
    const isClient = request.clientId === user.id;
    const isProvider = request.assignedProvider?.userId === user.id;
    if (!isClient && !isProvider) return apiError("Request not found", 404);

    const report = await prisma.report.findFirst({
      where: { requestId: params.id },
      include: { provider: { include: { user: { select: { fullName: true } } } } },
      orderBy: { submittedAt: "desc" },
    });

    if (!report) return apiError("Report not yet submitted", 404);
    return apiSuccess({ report });
  } catch (err) {
    return handleApiError(err);
  }
}
