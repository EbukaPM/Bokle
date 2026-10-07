import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { authorizeChannel } from "@/lib/pusher";
import { apiError } from "@/lib/api";

// Pusher private-channel auth. pusher-js POSTs here (form-encoded) with
// socket_id + channel_name before it will subscribe to a private-* channel.
// We verify the logged-in user actually owns/participates in that channel
// before signing it — never trust the channel name on its own.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError("Not authenticated", 401);

  const body = await req.formData();
  const socketId = body.get("socket_id") as string | null;
  const channelName = body.get("channel_name") as string | null;
  if (!socketId || !channelName) return apiError("Missing socket_id or channel_name", 400);

  const allowed = await isChannelAllowed(channelName, user.id);
  if (!allowed) return apiError("Forbidden", 403);

  try {
    const authResponse = authorizeChannel(socketId, channelName);
    return Response.json(authResponse);
  } catch {
    return apiError("Pusher is not configured", 500);
  }
}

async function isChannelAllowed(channelName: string, userId: string): Promise<boolean> {
  const userMatch = channelName.match(/^private-user-(.+)$/);
  if (userMatch) return userMatch[1] === userId;

  const requestMatch = channelName.match(/^private-request-(.+)$/);
  if (requestMatch) {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestMatch[1] },
      include: { assignedProvider: true },
    });
    if (!request) return false;
    return request.clientId === userId || request.assignedProvider?.userId === userId;
  }

  return false;
}
