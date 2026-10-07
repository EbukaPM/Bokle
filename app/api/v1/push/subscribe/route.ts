import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { pushSubscriptionSchema } from "@/lib/validations/push";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { endpoint, keys } = pushSubscriptionSchema.parse(body);

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    });

    return apiSuccess({ subscribed: true });
  } catch (err) {
    return handleApiError(err);
  }
}
