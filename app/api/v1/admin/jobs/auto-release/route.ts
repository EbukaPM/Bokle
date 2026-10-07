import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { runAutoReleaseSweep } from "@/lib/auto-release";

// Triggers the escrow auto-release sweep (PRD Section 13-D). In
// production this would be a BullMQ repeatable job; here an admin (or an
// external cron hitting this authenticated endpoint) runs it manually.
export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const results = await runAutoReleaseSweep();
    return apiSuccess({ results });
  } catch (err) {
    return handleApiError(err);
  }
}
