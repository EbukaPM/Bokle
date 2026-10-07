import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { bulkGeneralRequestSchema } from "@/lib/validations/requests";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { getSetting } from "@/lib/settings";
import { createRequest } from "@/lib/requests";
import { refundEscrow } from "@/lib/wallet";
import { getOrCreateWallet } from "@/lib/wallet";

// Enterprise bulk booking (PRD P2): create many general-marketplace
// requests in one submission — e.g. an employer booking cleaning across
// several office locations, or a family booking care visits for several
// relatives at once. Premium/Check Am requests are out of scope here;
// bulk booking is a general-marketplace convenience, not a Check Am
// shortcut.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);
    if (!user.isEnterprise) return apiError("Bulk booking is available to Enterprise accounts only", 403);

    const body = await req.json();
    const { items } = bulkGeneralRequestSchema.parse(body);

    const categoryIds = Array.from(new Set(items.map((i) => i.categoryId)));
    const categories = await prisma.serviceCategory.findMany({ where: { id: { in: categoryIds } } });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const minBooking = await getSetting("min_booking_amount", 1000);

    for (const item of items) {
      const category = categoryMap.get(item.categoryId);
      if (!category || category.type !== "general" || !category.isActive) {
        return apiError(`Invalid category for one of the bookings: ${item.categoryId}`, 400);
      }
    }

    const prices = items.map((item) => {
      const category = categoryMap.get(item.categoryId)!;
      return Math.max(category.baseFee.toNumber(), minBooking);
    });
    const total = prices.reduce((sum, p) => sum + p, 0);

    const wallet = await getOrCreateWallet(user.id);
    if (wallet.availableBalance.lessThan(total)) {
      return apiError(
        `Insufficient wallet balance for this batch. Total needed: ₦${total}, available: ₦${wallet.availableBalance}.`,
        402
      );
    }

    const created = [];
    try {
      for (let i = 0; i < items.length; i++) {
        const request = await createRequest(user.id, "general", items[i].categoryId, items[i], prices[i]);
        created.push(request);
      }
    } catch (err) {
      // Pre-flight balance check passed but an individual hold still
      // failed (race condition) — unwind what we already created rather
      // than leaving a half-booked batch.
      for (const request of created) {
        await refundEscrow(request.id, "full").catch(() => {});
      }
      throw err;
    }

    return apiSuccess({ requests: created, total }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
