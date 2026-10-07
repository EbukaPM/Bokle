import { clearAuthCookies } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api";

export async function POST() {
  try {
    await clearAuthCookies();
    return apiSuccess({ loggedOut: true });
  } catch (err) {
    return handleApiError(err);
  }
}
