import { prisma } from "./db";
import { holdEscrow } from "./wallet";
import { sendNotification } from "./notifications";

export interface CreateRequestData {
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
}

export interface CreateRequestExtra {
  reportDeadline?: Date;
  clientQuestions?: string[];
  referenceFileUrls?: string[];
}

// Shared by single-request creation (app/api/v1/requests) and bulk/
// enterprise booking (app/api/v1/requests/bulk): creates the
// ServiceRequest row then immediately holds escrow for it, rolling the
// row back if the client's wallet can't cover it.
export async function createRequest(
  clientId: string,
  requestType: "general" | "check_am",
  categoryId: string,
  data: CreateRequestData,
  quotedPrice: number,
  extra: CreateRequestExtra = {}
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
