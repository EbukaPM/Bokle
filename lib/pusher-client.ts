"use client";

import Pusher from "pusher-js";

let client: Pusher | null = null;
let initAttempted = false;

// Lazily creates the client-side Pusher connection. Returns null when
// Pusher isn't configured (NEXT_PUBLIC_PUSHER_KEY unset) — callers should
// treat that as "no live updates, rely on polling" rather than an error.
export function getPusherClient(): Pusher | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  if (!key) return null;

  if (!initAttempted) {
    initAttempted = true;
    client = new Pusher(key, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      authEndpoint: "/api/v1/pusher/auth",
    });
  }
  return client;
}
