import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { buildGoogleAuthUrl, isGoogleOAuthConfigured } from "@/lib/google-oauth";

export async function GET() {
  if (!isGoogleOAuthConfigured) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=google_not_configured`
    );
  }

  const state = nanoid();
  const cookieStore = await cookies();
  cookieStore.set("bokle_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax", // needs to survive the cross-site redirect back from Google
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
