import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { raiseDisputeSchema } from "@/lib/validations/requests";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await req.json();
    const { reason, evidenceUrls } = raiseDisputeSchema.parse(body);

    const dispute = await prisma.dispute.create({
      data: { requestId: request.id, raisedBy: user.id, reason, evidenceUrls },
    });

    await prisma.serviceRequest.update({ where: { id: request.id }, data: { status: "disputed" } });

    return apiSuccess({ dispute }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
