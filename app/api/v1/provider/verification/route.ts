import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { providerVerificationSchema } from "@/lib/validations/users";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    const body = await req.json();
    const { idDocumentUrl, selfieUrl } = providerVerificationSchema.parse(body);

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, idDocumentUrl, selfieUrl, verificationStatus: "pending" },
      update: { idDocumentUrl, selfieUrl, verificationStatus: "pending", adminNotes: null },
    });

    return apiSuccess({ profile });
  } catch (err) {
    return handleApiError(err);
  }
}
