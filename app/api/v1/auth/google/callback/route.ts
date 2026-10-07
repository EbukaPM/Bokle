import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { exchangeCodeForProfile } from "@/lib/google-oauth";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("bokle_oauth_state")?.value;
  cookieStore.delete("bokle_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${APP_URL}/login?error=google_auth_failed`);
  }

  try {
    const profile = await exchangeCodeForProfile(code);

    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });

    if (!user) {
      // Link to an existing email/password account if one matches,
      // otherwise create a brand new account.
      const existingByEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { googleId: profile.sub, isEmailVerified: true },
        });
      } else {
        user = await prisma.user.create({
          data: {
            fullName: profile.name,
            email: profile.email,
            googleId: profile.sub,
            avatarUrl: profile.picture,
            isEmailVerified: true,
          },
        });
        await prisma.wallet.create({ data: { userId: user.id } });
      }
    }

    if (user.isSuspended) {
      return NextResponse.redirect(`${APP_URL}/login?error=account_suspended`);
    }

    const accessToken = await signAccessToken({ sub: user.id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin });
    const refreshToken = await signRefreshToken(user.id);
    await setAuthCookies(accessToken, refreshToken);

    return NextResponse.redirect(`${APP_URL}/dashboard`);
  } catch (err) {
    console.error("[Google OAuth] callback error", err);
    return NextResponse.redirect(`${APP_URL}/login?error=google_auth_failed`);
  }
}
