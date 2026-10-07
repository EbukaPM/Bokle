import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError("Not authenticated", 401);

    return apiSuccess({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        state: user.state,
        lga: user.lga,
        membershipTier: user.membershipTier,
        premiumExpiresAt: user.premiumExpiresAt,
        isProviderActive: user.isProviderActive,
        providerVerified: user.providerVerified,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        isEnterprise: user.isEnterprise,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
