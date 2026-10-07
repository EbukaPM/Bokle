import { getCurrentUser } from "@/lib/auth";
import { getOrCreateWallet } from "@/lib/wallet";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const wallet = await getOrCreateWallet(user.id);
    return apiSuccess({ wallet });
  } catch (err) {
    return handleApiError(err);
  }
}
