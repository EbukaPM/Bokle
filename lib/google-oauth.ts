// Google OAuth 2.0 (Authorization Code flow) for "Sign in with Google"
// (PRD P2). Unlike the dev-mode integrations elsewhere in lib/, there is
// no meaningful mock for a redirect to a real external identity provider —
// when GOOGLE_CLIENT_ID/SECRET aren't set, the UI hides the button
// entirely (see isGoogleOAuthConfigured) rather than showing a button
// that would error out.

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleOAuthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

function redirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/auth/google/callback`;
}

export function buildGoogleAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID || "",
      client_secret: GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("Failed to exchange authorization code with Google");
  }
  const tokens = await tokenRes.json();

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error("Failed to fetch Google profile");
  }
  return profileRes.json();
}
