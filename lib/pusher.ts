// Real-time events (Pusher Channels). Falls back to a no-op in dev when
// Pusher keys are not configured — clients should treat real-time as an
// enhancement and poll on a 30s fallback per PRD Section 14.

import PusherServer from "pusher";

const configured = Boolean(
  process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET && process.env.NEXT_PUBLIC_PUSHER_KEY
);

const server = configured
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      useTLS: true,
    })
  : null;

export async function triggerEvent(channel: string, event: string, data: unknown) {
  if (!server) {
    console.log(`[PUSHER:DEV] channel=${channel} event=${event}`, data);
    return;
  }
  await server.trigger(channel, event, data);
}

export function userChannel(userId: string) {
  return `private-user-${userId}`;
}

export function requestChannel(requestId: string) {
  return `private-request-${requestId}`;
}

// Signs a private-channel subscription for the client. The caller
// (app/api/v1/pusher/auth) is responsible for checking the requesting user
// is actually allowed on `channel` before calling this.
export function authorizeChannel(socketId: string, channel: string) {
  if (!server) throw new Error("Pusher is not configured");
  return server.authorizeChannel(socketId, channel);
}

export const pusherMode = configured ? "live" : "dev-mock";
