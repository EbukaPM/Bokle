import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { z } from "zod";

const declineSchema = z.object({ reason: z.string().min(1, "A reason is required") });

// Declining just removes the job from this provider's feed on the client
// side — it does not mutate the request, which stays open for other
// eligible providers to accept.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    declineSchema.parse(body);

    return apiSuccess({ declined: true, jobId: params.id });
  } catch (err) {
    return handleApiError(err);
  }
}
