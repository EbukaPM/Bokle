import { NextRequest } from "next/server";
import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

const ACTIVE_STATUSES: RequestStatus[] = [
  "accepted",
  "en_route",
  "on_site",
  "completed",
  "report_submitted",
  "confirmed",
  "disputed",
];

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const profile = await prisma.providerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return apiSuccess({ jobs: [] });

    const status = req.nextUrl.searchParams.get("status");

    const jobs = await prisma.serviceRequest.findMany({
      where: {
        assignedProviderId: profile.id,
        status: status ? (status as RequestStatus) : { in: ACTIVE_STATUSES },
      },
      include: { category: true, client: { select: { fullName: true, state: true, lga: true } } },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ jobs });
  } catch (err) {
    return handleApiError(err);
  }
}
