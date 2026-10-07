import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { bulkMessageSchema } from "@/lib/validations/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { sendSms } from "@/lib/termii";
import { sendEmail } from "@/lib/resend";
import { sendNotification } from "@/lib/notifications";
import { Prisma } from "@prisma/client";

const MAX_RECIPIENTS = 5000;

function segmentWhere(segment: string, state?: string): Prisma.UserWhereInput {
  switch (segment) {
    case "clients":
      return { isSuspended: false };
    case "providers":
      return { isProviderActive: true, isSuspended: false };
    case "premium":
      return { membershipTier: "premium", isSuspended: false };
    case "unverified_providers":
      return { isProviderActive: true, providerVerified: false, isSuspended: false };
    case "state":
      return { state: state || undefined, isSuspended: false };
    case "all":
    default:
      return { isSuspended: false };
  }
}

// Returns how many users a segment currently matches, without sending
// anything — used by the admin UI to show a recipient count before the
// admin commits to a send.
export async function GET(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return apiError("Forbidden — super-admin only", 403);

    const segment = req.nextUrl.searchParams.get("segment") || "all";
    const state = req.nextUrl.searchParams.get("state") || undefined;

    const count = await prisma.user.count({ where: segmentWhere(segment, state) });
    return apiSuccess({ count });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return apiError("Forbidden — super-admin only", 403);

    const body = await req.json();
    const { segment, state, channel, subject, message } = bulkMessageSchema.parse(body);

    if (segment === "state" && !state) return apiError("State is required for the 'state' segment", 400);

    const recipients = await prisma.user.findMany({
      where: segmentWhere(segment, state),
      select: { id: true, email: true, phone: true },
      take: MAX_RECIPIENTS,
    });

    let smsSent = 0;
    let emailSent = 0;

    for (const recipient of recipients) {
      await sendNotification({
        userId: recipient.id,
        type: "admin_broadcast",
        title: subject || "Message from Bokle",
        body: message,
        priority: "low", // we send SMS/email explicitly below, not via priority routing
      });

      if ((channel === "sms" || channel === "both") && recipient.phone) {
        await sendSms(recipient.phone, message);
        smsSent += 1;
      }
      if ((channel === "email" || channel === "both") && recipient.email) {
        await sendEmail(recipient.email, subject || "Message from Bokle", `<p>${message}</p>`);
        emailSent += 1;
      }
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: "bulk_broadcast",
        targetType: "user_segment",
        targetId: segment,
        newValue: { segment, state, channel, recipientCount: recipients.length },
      },
    });

    return apiSuccess({ recipientCount: recipients.length, smsSent, emailSent });
  } catch (err) {
    return handleApiError(err);
  }
}
