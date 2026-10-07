import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const schema = z.object({ endpoint: z.string().url() });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { endpoint } = schema.parse(body);

    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });

    return apiSuccess({ unsubscribed: true });
  } catch (err) {
    return handleApiError(err);
  }
}
