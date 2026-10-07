import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";
import { getSignedPrivateUrl } from "@/lib/cloudinary";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return apiError("Forbidden", 403);

    const providers = await prisma.providerProfile.findMany({
      where: { verificationStatus: "pending" },
      include: { user: { select: { id: true, fullName: true, email: true, phone: true, state: true, lga: true } } },
      orderBy: { createdAt: "asc" },
    });

    const withSignedUrls = providers.map((p) => ({
      ...p,
      idDocumentUrl: p.idDocumentUrl ? getSignedPrivateUrl(p.idDocumentUrl) : null,
      selfieUrl: p.selfieUrl ? getSignedPrivateUrl(p.selfieUrl) : null,
    }));

    return apiSuccess({ providers: withSignedUrls });
  } catch (err) {
    return handleApiError(err);
  }
}
