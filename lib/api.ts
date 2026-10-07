import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    return apiError("Validation failed", 422, err.issues);
  }
  if (err instanceof Error) {
    if (err.message === "INSUFFICIENT_BALANCE") {
      return apiError("Insufficient wallet balance", 402);
    }
    console.error("[API ERROR]", err);
    return apiError(err.message, 400);
  }
  console.error("[API ERROR]", err);
  return apiError("Something went wrong", 500);
}

// Lightweight in-memory rate limiter. Production should move this to
// Redis (Upstash) so limits are shared across serverless instances —
// tracked as a known v1 limitation (PRD Section 12 calls for per-IP +
// per-user limits via Redis).
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
