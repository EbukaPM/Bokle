# Bokle

Community services & verification marketplace for Nigeria, including the premium
**Help Me Check Am** remote-verification feature. Built against the Bokle PRD v2.0.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL · Zustand ·
TanStack Query · React Hook Form + Zod · Paystack · Termii · Resend · Cloudinary · Pusher ·
web-push · Google OAuth

## Getting started

```bash
npm install
cp .env.example .env.local    # then fill in real values when you have them
cp .env.local .env            # Prisma CLI reads .env, not .env.local
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000.

## Deploying (e.g. Netlify/Vercel)

Every value in `.env.example` needs to be set in your host's environment variable settings —
a `.env.local` file never leaves your machine. Two deserve special attention:

- **`NEXT_PUBLIC_APP_URL`** must be your real production URL (e.g. `https://bokle.netlify.app`).
  It's used to build the Google OAuth redirect URI and links in outgoing emails/SMS — if it's
  still `http://localhost:3000` in production, those will be broken even though the rest of the
  app works fine.
- **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`** — the "Continue with Google" button is hidden
  automatically when these are empty (see `lib/google-oauth.ts`), which is why it doesn't appear
  on `/login` or `/register` in dev. To enable it: create an OAuth Client ID in the
  [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add
  `https://<your-domain>/api/v1/auth/google/callback` as an authorized redirect URI (must match
  `NEXT_PUBLIC_APP_URL` exactly, including the domain), then set both env vars on your host and
  redeploy. The button will appear with no code changes needed.

A Postgres database reachable from your host (e.g. Neon, Supabase, Railway) is required — Netlify
and Vercel don't provide one. Run `npx prisma migrate deploy` against it once as part of your
deploy step.

**Seeded accounts:**
- Super-admin: `admin@bokle.ng` / `Admin#12345`
- Everyone else registers through the normal signup flow (email/phone OTP).

## What's real vs. mocked

Every integration has a **dev mode** that activates automatically when its API keys are
absent from `.env.local`, so the entire app — including payments, escrow, and the
Premium upgrade flow — runs and is testable end-to-end with zero external accounts.

| Service | Dev mode (no keys) | Live mode (keys set) |
|---|---|---|
| **Paystack** (`lib/paystack.ts`) | Mock checkout URL, instant "success" verification | Real card charges, transfers, bank resolution, Dedicated Virtual Accounts |
| **Termii / Resend** (SMS/email) | OTPs and notifications logged to the server console | Real SMS/email delivery |
| **Cloudinary** (`lib/cloudinary.ts`) | Uploaded images stored as base64 data URLs in Postgres | Real CDN hosting, signed private URLs for ID docs |
| **Pusher** (`lib/pusher.ts`) | Real-time events logged, not pushed | Live WebSocket notifications (notifications bell, chat) |
| **Web Push** (`lib/push.ts`) | N/A — VAPID keys are self-generated, not a third-party account | Already live by default once `npx web-push generate-vapid-keys` output is in `.env.local` |
| **Google OAuth** (`lib/google-oauth.ts`) | "Continue with Google" button hidden entirely | Button appears once `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set |

Everything else — auth, the wallet double-entry ledger, escrow hold/release, commission
splits, premium gating, provider verification, admin settings, disputes, recurring
bookings, the provider-matching algorithm, enterprise bulk booking — is fully
implemented against the real database, not stubbed.

## Feature coverage (PRD Section 19 MoSCoW)

- **P0 (Must Have)** — complete.
- **P1 (Should Have)** — complete: recurring bookings, real-time Pusher wiring, provider
  availability calendar, earnings analytics, admin subscriber management, transaction
  log + CSV export, Paystack Dedicated Virtual Accounts.
- **P2 (Could Have)** — complete: composite-score provider matching + auto-match
  (`lib/matching.ts`), Google OAuth, English/Pidgin language toggle (`lib/i18n/`),
  Web Push PWA notifications, enterprise bulk-booking tier, provider training/
  upskilling modules, admin bulk broadcast messaging.
- **P3** — explicitly out of scope per the PRD itself (native apps, video, USSD,
  international payments, AI-generated summaries, multi-country).

## What's deliberately out of scope for this pass

- **Escrow auto-release scheduling**: the logic exists (`lib/auto-release.ts`) and runs
  correctly when triggered, but nothing calls it on a timer yet — wire it to a cron
  (e.g. `POST /api/v1/admin/jobs/auto-release` from an external scheduler, or a BullMQ
  repeatable job) before relying on it in production.
- **Premium auto-renewal**: subscriptions expire and downgrade correctly
  (`expirePremiumUsers` in `lib/subscription.ts`), but nothing calls it on a schedule yet.
- Direct "book this specific provider" flow — the provider profile page is
  informational; booking always goes through the open-request + accept/match flow.
- The Pidgin translation dictionary (`lib/i18n/translations.ts`) covers primary
  navigation and common actions, not every string in the app — add keys as more
  surfaces get translated.
- PWA push notifications are fully implemented server-side and client-side, but
  Service Worker registration couldn't be exercised in this build environment's
  sandboxed browser (it blocks `serviceWorker.register` by policy) — verify in a real
  browser; the server-side subscribe/send pipeline is tested and works.

## Database schema

`prisma/schema.prisma` mirrors PRD Section 9 table-for-table, plus P1/P2 additions:
`recurringParentId` (booking chains), `PushSubscription`, `TrainingModule` +
`ProviderTrainingProgress`, and `User.isEnterprise` / `User.googleId` /
`User.dvaAccountNumber` etc. `prisma/seed.ts` seeds general + Check Am categories
(with their checklist templates), platform settings (commission rates, fees, premium
pricing), the super-admin account, and a system wallet that holds platform commission.

## Project structure

Matches PRD Section 20: `app/(auth)`, `app/(dashboard)`, `app/admin`, `app/api/v1/*`,
`components/`, `lib/` (one file per module — `wallet.ts`, `paystack.ts`, `matching.ts`,
`recurring.ts`, `push.ts`, `google-oauth.ts`, `subscription.ts`, `pdf.ts`, etc.), `prisma/`.
