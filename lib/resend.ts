// Email wrapper (Resend). Falls back to console logging in dev when
// RESEND_API_KEY is not set.

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "hello@bokle.ng";

const client = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean }> {
  if (!client) {
    console.log(`[EMAIL:DEV] to=${to} subject="${subject}"\n${html}`);
    return { success: true };
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to, subject, html });
    return { success: true };
  } catch (err) {
    console.error("[EMAIL] Resend send error", err);
    return { success: false };
  }
}

export async function sendOtpEmail(to: string, code: string) {
  return sendEmail(
    to,
    "Your Bokle verification code",
    `<p>Your Bokle verification code is <strong>${code}</strong>. It expires in 5 minutes.</p>`
  );
}
