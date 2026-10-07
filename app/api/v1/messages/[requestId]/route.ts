import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { triggerEvent, requestChannel } from "@/lib/pusher";
import { sendNotification } from "@/lib/notifications";
import { z } from "zod";

async function assertParticipant(requestId: string, userId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { assignedProvider: true },
  });
  if (!request) return null;
  const isClient = request.clientId === userId;
  const isProvider = request.assignedProvider?.userId === userId;
  if (!isClient && !isProvider) return null;
  return request;
}

export async function GET(_req: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const request = await assertParticipant(params.requestId, user.id);
    if (!request) return apiError("Not found", 404);

    const messages = await prisma.message.findMany({
      where: { requestId: params.requestId },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { sentAt: "asc" },
    });

    return apiSuccess({ messages });
  } catch (err) {
    return handleApiError(err);
  }
}

const sendMessageSchema = z.object({ content: z.string().min(1).max(2000) });

export async function POST(req: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const request = await assertParticipant(params.requestId, user.id);
    if (!request) return apiError("Not found", 404);

    // Check Am follow-up window: once a report is delivered, the client
    // may only message for 24h after submission (PRD 6.3 step 5 / 6.8).
    if (request.requestType === "check_am" && request.status !== "open" && request.status !== "accepted") {
      const report = await prisma.report.findFirst({ where: { requestId: params.requestId } });
      if (report) {
        const windowEnd = new Date(report.submittedAt.getTime() + 24 * 60 * 60 * 1000);
        if (new Date() > windowEnd) {
          return apiError("The follow-up window for this report has closed.", 400);
        }
      }
    }

    const body = await req.json();
    const { content } = sendMessageSchema.parse(body);

    const message = await prisma.message.create({
      data: { requestId: params.requestId, senderId: user.id, content },
      include: { sender: { select: { id: true, fullName: true, avatarUrl: true } } },
    });

    await triggerEvent(requestChannel(params.requestId), "message", message);

    const recipientId = request.clientId === user.id ? request.assignedProvider?.userId : request.clientId;
    if (recipientId) {
      await sendNotification({
        userId: recipientId,
        type: "new_message",
        title: "New message",
        body: content.slice(0, 100),
        priority: "medium",
      });
    }

    return apiSuccess({ message }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
