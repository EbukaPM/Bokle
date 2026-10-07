import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { sendSms } from "./termii";
import { sendEmail } from "./resend";
import { triggerEvent, userChannel } from "./pusher";
import { sendPushToUser } from "./push";

// Delivery priority per PRD Section 14.
export type NotificationPriority = "high" | "medium" | "low";

const PRIORITY_CHANNELS: Record<NotificationPriority, ("in_app" | "sms" | "email" | "push")[]> = {
  high: ["in_app", "sms", "push"],
  medium: ["in_app", "email", "push"],
  low: ["in_app"],
};

export interface SendNotificationParams {
  userId: string;
  type: string;
  title: string;
  body?: string;
  priority: NotificationPriority;
  data?: Record<string, unknown>;
}

export async function sendNotification(params: SendNotificationParams) {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) return;

  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data as Prisma.InputJsonValue,
    },
  });

  await triggerEvent(userChannel(params.userId), "notification", notification);

  const channels = PRIORITY_CHANNELS[params.priority];
  if (channels.includes("sms") && user.phone) {
    await sendSms(user.phone, `${params.title}${params.body ? " — " + params.body : ""}`);
  }
  if (channels.includes("email") && user.email) {
    await sendEmail(user.email, params.title, `<p>${params.body ?? ""}</p>`);
  }
  if (channels.includes("push")) {
    await sendPushToUser(params.userId, { title: params.title, body: params.body, url: "/notifications" });
  }

  return notification;
}
