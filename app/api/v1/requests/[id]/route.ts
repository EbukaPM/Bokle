import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { refundEscrow } from "@/lib/wallet";

async function loadAccessible(id: string, userId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      category: true,
      subject: true,
      assignedProvider: { include: { user: { select: { id: true, fullName: true, avatarUrl: true, phone: false } } } },
      reports: true,
      reviews: true,
      recurringChildren: { select: { id: true, preferredDate: true, status: true } },
    },
  });
  if (!request) return null;
  const isClient = request.clientId === userId;
  const isAssignedProvider = request.assignedProvider?.userId === userId;
  if (!isClient && !isAssignedProvider) return null;
  return request;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const request = await loadAccessible(params.id, user.id);
    if (!request) return apiError("Request not found", 404);

    return apiSuccess({ request });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const request = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
    if (!request || request.clientId !== user.id) return apiError("Request not found", 404);
    if (request.status !== "open") {
      return apiError("Only requests that haven't been matched yet can be cancelled", 400);
    }

    await refundEscrow(request.id, "full");
    await prisma.serviceRequest.update({ where: { id: request.id }, data: { status: "cancelled" } });

    return apiSuccess({ cancelled: true });
  } catch (err) {
    return handleApiError(err);
  }
}
