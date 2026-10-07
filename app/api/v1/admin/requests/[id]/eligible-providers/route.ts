import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { rankEligibleProviders } from "@/lib/matching";

// Ranked candidate list for manually matching an open request — the
// matching score (rating, response rate, experience, location) is the
// same algorithm /auto-match uses, exposed here so an admin can see why
// a provider ranked where they did before picking one by hand.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const request = await prisma.serviceRequest.findUnique({ where: { id: params.id } });
    if (!request) return apiError("Request not found", 404);

    const ranked = await rankEligibleProviders({
      categoryId: request.categoryId,
      requestType: request.requestType,
      state: request.serviceState,
      lga: request.serviceLga,
    });

    return apiSuccess({ candidates: ranked });
  } catch (err) {
    return handleApiError(err);
  }
}
