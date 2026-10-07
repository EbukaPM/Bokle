import { prisma } from "./db";
import { holdEscrow } from "./wallet";
import { sendNotification } from "./notifications";

// Recurring general service bookings (PRD P1). When a recurring request is
// confirmed, the next occurrence in the chain is spawned automatically —
// same category/subject/address, dated one interval later. If the client
// doesn't have enough wallet balance to hold escrow for it, the chain just
// stops silently (rather than failing the confirm that triggered it) and
// the client is notified to top up and rebook manually.

const INTERVAL_DAYS: Record<"daily" | "weekly" | "monthly", number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export async function spawnNextRecurrence(requestId: string) {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request || !request.isRecurring || !request.recurrencePattern) return null;
  if (request.requestType !== "general") return null; // recurring is general-marketplace only (PRD 6.2)

  const alreadySpawned = await prisma.serviceRequest.findFirst({
    where: { recurringParentId: requestId },
  });
  if (alreadySpawned) return null;

  const intervalDays = INTERVAL_DAYS[request.recurrencePattern];
  const nextDate = new Date(request.preferredDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  if (!request.quotedPrice) return null;

  const next = await prisma.serviceRequest.create({
    data: {
      clientId: request.clientId,
      categoryId: request.categoryId,
      requestType: request.requestType,
      subjectId: request.subjectId,
      subjectDescription: request.subjectDescription,
      serviceAddress: request.serviceAddress,
      serviceState: request.serviceState,
      serviceLga: request.serviceLga,
      lat: request.lat,
      lng: request.lng,
      preferredDate: nextDate,
      preferredTime: request.preferredTime,
      isRecurring: true,
      recurrencePattern: request.recurrencePattern,
      recurringParentId: request.id,
      specialInstructions: request.specialInstructions,
      quotedPrice: request.quotedPrice,
      status: "open",
    },
  });

  try {
    await holdEscrow(request.clientId, next.id, request.quotedPrice.toNumber());
  } catch (err) {
    await prisma.serviceRequest.delete({ where: { id: next.id } });
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      await sendNotification({
        userId: request.clientId,
        type: "recurring_payment_failed",
        title: "Your recurring booking needs attention",
        body: "We couldn't book your next recurring visit because your wallet balance is too low. Top up and rebook.",
        priority: "medium",
      });
      return null;
    }
    throw err;
  }

  await sendNotification({
    userId: request.clientId,
    type: "recurring_booked",
    title: "Your next recurring visit is booked",
    body: `We've scheduled and paid for your next ${request.recurrencePattern} booking.`,
    priority: "low",
  });

  return next;
}
