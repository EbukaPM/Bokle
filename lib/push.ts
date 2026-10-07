// Browser push notifications via the Web Push protocol (PRD P2: "Browser
// push notifications — PWA service worker"). Unlike the other third-party
// integrations in lib/, this needs no external account — VAPID keys are a
// self-generated keypair (`npx web-push generate-vapid-keys`), so this
// runs for real in any environment that has them set.

import webpush from "web-push";
import { prisma } from "./db";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@bokle.ng";

const configured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (configured) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
}

export const pushMode = configured ? "live" : "unconfigured";

export async function sendPushToUser(userId: string, payload: { title: string; body?: string; url?: string }) {
  if (!configured) {
    console.log("[PUSH:UNCONFIGURED] would send to", userId, payload);
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Subscription expired or was revoked by the browser — clean it up.
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error("[PUSH] send error", err);
      }
    }
  }
}
