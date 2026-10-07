# Bokle

Community services & verification marketplace for Nigeria, including the premium
**Help Me Check Am** remote-verification feature. Built against the Bokle PRD v2.0.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL · Zustand ·
TanStack Query · React Hook Form + Zod · Paystack · Termii · Resend · Cloudinary · Pusher

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

**Seeded accounts:**
- Super-admin: `admin@bokle.ng` / `Admin#12345`
- Everyone else registers through the normal signup flow (email/phone OTP).

## What's real vs. mocked

Every integration has a **dev mode** that activates automatically when its API keys are
absent from `.env.local`, so the entire app — including payments, escrow, and the
Premium upgrade flow — runs and is testable end-to-end with zero external accounts.

| Service | Dev mode (no keys) | Live mode (keys set) |
|---|---|---|
| **Paystack** (`lib/paystack.ts`) | Mock checkout URL, instant "success" verification | Real card charges, transfers, bank resolution via Paystack API |
| **Termii / Resend** (SMS/email) | OTPs and notifications logged to the server console | Real SMS/email delivery |
| **Cloudinary** (`lib/cloudinary.ts`) | Uploaded images stored as base64 data URLs in Postgres | Real CDN hosting, signed private URLs for ID docs |
| **Pusher** (`lib/pusher.ts`) | Real-time events logged, not pushed | Live WebSocket notifications |

Everything else — auth, the wallet double-entry ledger, escrow hold/release, commission
splits, premium gating, provider verification, admin settings, disputes — is fully
implemented against the real database, not stubbed.

## What's deliberately out of scope for this pass

- **Escrow auto-release scheduling**: the logic exists (`lib/auto-release.ts`) and runs
  correctly when triggered, but nothing calls it on a timer yet — wire it to a cron
  (e.g. `POST /api/v1/admin/jobs/auto-release` from an external scheduler, or a BullMQ
  repeatable job) before relying on it in production.
- **Premium auto-renewal**: subscriptions expire and downgrade correctly
  (`expirePremiumUsers` in `lib/subscription.ts`), but nothing calls it on a schedule yet.
- **P1/P2/P3 features** from the PRD's MoSCoW list (recurring-booking automation, email
  notifications beyond the dev-log stub, Google OAuth, multi-language, PWA push, AI
  matching, native apps) — not started.
- Direct "book this specific provider" flow — the provider profile page is
  informational; booking always goes through the open-request + accept/match flow.

## Database schema

`prisma/schema.prisma` mirrors PRD Section 9 table-for-table. `prisma/seed.ts` seeds
general + Check Am categories (with their checklist templates), platform settings
(commission rates, fees, premium pricing), the super-admin account, and a system wallet
that holds platform commission.

## Project structure

Matches PRD Section 20: `app/(auth)`, `app/(dashboard)`, `app/admin`, `app/api/v1/*`,
`components/`, `lib/` (one file per PRD-described module — `wallet.ts`, `paystack.ts`,
`check-am.ts`, `subscription.ts`, `pdf.ts`, etc.), `prisma/`.
