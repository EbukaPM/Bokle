import { apiSuccess } from "@/lib/api";
import { isGoogleOAuthConfigured } from "@/lib/google-oauth";

export async function GET() {
  return apiSuccess({ configured: isGoogleOAuthConfigured });
}
