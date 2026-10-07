import { prisma } from "./db";
import { releaseEscrow } from "./wallet";
import { getSetting } from "./settings";
import { sendNotification } from "./notifications";
import { spawnNextRecurrence } from "./recurring";

// Escrow auto-release (PRD Section 13-D): if a client never explicitly
// confirms a submitted report within the admin-configured window, the
// job auto-confirms and escrow releases to the provider.
//
// This should run on a schedule (BullMQ repeatable job in production).
// In this environment there's no standing worker process, so it's
// exposed as a callable function an admin route (or an external cron
// hitting that route) can trigger.
export async function runAutoReleaseSweep() {
  const windowHours = await getSetting("escrow_auto_release_hours", 24);
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const eligible = await prisma.serviceRequest.findMany({
    where: { status: "report_submitted", updatedAt: { lt: cutoff } },
    include: { assignedProvider: true },
  });

  const results: { requestId: string; released: boolean; error?: string }[] = [];

  for (const request of eligible) {
    try {
      await releaseEscrow(request.id);
      if (request.isRecurring) {
        await spawnNextRecurrence(request.id);
      }
      if (request.assignedProvider) {
        await sendNotification({
          userId: request.assignedProvider.userId,
          type: "job_auto_confirmed",
          title: "Payment auto-released",
          body: "The client didn't respond in time, so your earnings were released automatically.",
          priority: "high",
        });
      }
      results.push({ requestId: request.id, released: true });
    } catch (err) {
      results.push({ requestId: request.id, released: false, error: (err as Error).message });
    }
  }

  return results;
}
