import { getCurrentUser } from "@/lib/auth";
import { cancelSubscription } from "@/lib/subscription";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const subscription = await cancelSubscription(user.id);
    return apiSuccess({ subscription });
  } catch (err) {
    return handleApiError(err);
  }
}
