import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api";
import { scoreProvider } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const categoryId = searchParams.get("categoryId");
    const state = searchParams.get("state");

    const providers = await prisma.providerProfile.findMany({
      where: {
        verificationStatus: "approved",
        user: {
          isProviderActive: true,
          isSuspended: false,
          ...(state ? { state } : {}),
        },
        ...(categoryId ? { categories: { some: { categoryId } } } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true, state: true, lga: true, bio: true } },
        categories: { include: { category: true } },
      },
      orderBy: { avgRating: "desc" },
    });

    // When browsing within a specific category, surface the best overall
    // match first (rating + response rate + experience + location) rather
    // than rating alone.
    if (categoryId) {
      providers.sort((a, b) => scoreProvider(b, { state }).total - scoreProvider(a, { state }).total);
    }

    return apiSuccess({ providers });
  } catch (err) {
    return handleApiError(err);
  }
}
