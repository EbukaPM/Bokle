// SMS wrapper (Termii — Nigerian-first SMS provider).
// Falls back to console logging in dev when TERMII_API_KEY is not set,
// so OTP/notification flows remain testable without a live account.

const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || "Bokle";
const TERMII_BASE_URL = "https://api.ng.termii.com/api/sms/send";

export async function sendSms(to: string, message: string): Promise<{ success: boolean }> {
  if (!TERMII_API_KEY) {
    console.log(`[SMS:DEV] to=${to} message="${message}"`);
    return { success: true };
  }

  try {
    const res = await fetch(TERMII_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        from: TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: TERMII_API_KEY,
      }),
    });
    if (!res.ok) {
      console.error("[SMS] Termii send failed", await res.text());
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error("[SMS] Termii send error", err);
    return { success: false };
  }
}

export async function sendOtpSms(to: string, code: string) {
  return sendSms(to, `Your Bokle verification code is ${code}. It expires in 5 minutes. Do not share this code.`);
}
