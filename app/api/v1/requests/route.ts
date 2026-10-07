import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createGeneralRequestSchema, createCheckAmRequestSchema } from "@/lib/validations/requests";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { isPremiumActive } from "@/lib/subscription";
import { calculateCheckAmPrice } from "@/lib/check-am";
import { holdEscrow } from "@/lib/wallet";
import { getSetting } from "@/lib/settings";
import { sendNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const type = req.nextUrl.searchParams.get("type"); // general | check_am
    const status = req.nextUrl.searchParams.get("status");

    const requests = await prisma.serviceRequest.findMany({
      where: {
        clientId: user.id,
        ...(type ? { requestType: type as "general" | "check_am" } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: {
        category: true,
        assignedProvider: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
        subject: true,
        reports: { select: { id: true, submittedAt: true, overallAssessment: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ requests });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const requestType: "general" | "check_am" = body.requestType === "check_am" ? "check_am" : "general";

    const category = await prisma.serviceCategory.findUnique({ where: { id: body.categoryId } });
    if (!category || category.type !== requestType || !category.isActive) {
      return apiError("Invalid category for this request type", 400);
    }

    let quotedPrice: number;
    let reportDeadline: Date | undefined;
    let clientQuestions: string[] = [];

    if (requestType === "check_am") {
      const premium = await isPremiumActive(user.id);
      if (!premium) {
        return apiError("Help Me Check Am is a Premium feature. Upgrade to post this request.", 403, {
          upgradeRequired: true,
        });
      }

      const data = createCheckAmRequestSchema.parse(body);
      const { totalPrice } = await calculateCheckAmPrice(category.id);
      quotedPrice = totalPrice;
      reportDeadline = new Date(Date.now() + data.reportDeadlineHours * 60 * 60 * 1000);
      clientQuestions = data.clientQuestions;

      const request = await createRequest(user.id, requestType, category.id, data, quotedPrice, {
        reportDeadline,
        clientQuestions,
        referenceFileUrls: data.referenceFileUrls,
      });
      return apiSuccess({ request }, 201);
    } else {
      const data = createGeneralRequestSchema.parse(body);
      const minBooking = await getSetting("min_booking_amount", 1000);
      quotedPrice = Math.max(category.baseFee.toNumber(), minBooking);

      const request = await createRequest(user.id, requestType, category.id, data, quotedPrice, {});
      return apiSuccess({ request }, 201);
    }
  } catch (err) {
    return handleApiError(err);
  }
}

async function createRequest(
  clientId: string,
  requestType: "general" | "check_am",
  categoryId: string,
  data: {
    subjectId?: string;
    subjectDescription?: string;
    serviceAddress: string;
    serviceState?: string;
    serviceLga?: string;
    lat?: number;
    lng?: number;
    preferredDate: string;
    preferredTime?: string;
    isRecurring?: boolean;
    recurrencePattern?: "daily" | "weekly" | "monthly";
    specialInstructions?: string;
  },
  quotedPrice: number,
  extra: { reportDeadline?: Date; clientQuestions?: string[]; referenceFileUrls?: string[] }
) {
  const request = await prisma.serviceRequest.create({
    data: {
      clientId,
      categoryId,
      requestType,
      subjectId: data.subjectId,
      subjectDescription: data.subjectDescription,
      clientQuestions: extra.clientQuestions ?? [],
      serviceAddress: data.serviceAddress,
      serviceState: data.serviceState,
      serviceLga: data.serviceLga,
      lat: data.lat,
      lng: data.lng,
      preferredDate: new Date(data.preferredDate),
      preferredTime: data.preferredTime,
      reportDeadline: extra.reportDeadline,
      isRecurring: data.isRecurring ?? false,
      recurrencePattern: data.recurrencePattern,
      specialInstructions: data.specialInstructions,
      referenceFileUrls: extra.referenceFileUrls ?? [],
      quotedPrice,
      status: "open",
    },
  });

  try {
    await holdEscrow(clientId, request.id, quotedPrice);
  } catch (err) {
    await prisma.serviceRequest.delete({ where: { id: request.id } });
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      throw new Error("Insufficient wallet balance. Please top up and try again.");
    }
    throw err;
  }

  await sendNotification({
    userId: clientId,
    type: "request_created",
    title: requestType === "check_am" ? "Check Am request posted" : "Request posted",
    body: "We're matching you with a verified provider nearby.",
    priority: "medium",
  });

  return request;
}
