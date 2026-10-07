"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Wallet,
  FileCheck2,
  Sparkles,
  Home as HomeIcon,
  Baby,
  ShoppingCart,
  Car,
  Plane,
  Building2,
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { api } from "@/lib/fetcher";
import { formatNaira } from "@/lib/utils";

const HOW_IT_WORKS = [
  { title: "Tell us what you need", body: "Post a request or a Help Me Check Am job in minutes." },
  { title: "We match you with a verified local", body: "Browse profiles or let us match you to a nearby, verified Bokle user." },
  { title: "Get it done & documented", body: "Receive a structured report with photos, then pay securely from escrow." },
];

const CATEGORY_TILES = [
  { icon: HomeIcon, label: "Domestic Help" },
  { icon: Baby, label: "Caregiving & Welfare" },
  { icon: ShoppingCart, label: "Errands & Tasks" },
  { icon: Car, label: "Vehicle Checks" },
];

interface PublicStats {
  verifiedProviders: number;
  completedJobs: number;
  cities: number;
  prices: { monthly: number; quarterly: number; annual: number };
}

export default function LandingPage() {
  const { data: stats } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: () => api.get<PublicStats>("/api/v1/public/stats"),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold text-primary-dark">Bokle</span>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary px-2">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-balance text-3xl font-bold text-text-primary sm:text-4xl">
            Trusted help, right where you need it — even when you can&apos;t be there.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-text-secondary">
            Bokle connects you with verified local providers for everyday help, and lets Premium members dispatch a
            verified checker anywhere in Nigeria with <strong>Help Me Check Am</strong>.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="w-full max-w-xs rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:bg-primary-dark sm:w-auto"
            >
              Get Help
            </Link>
            <Link
              href="/register"
              className="w-full max-w-xs rounded-lg border border-primary-muted bg-primary-light px-6 py-3 text-center font-medium text-primary-dark hover:bg-primary-muted/40 sm:w-auto"
            >
              Offer Help
            </Link>
          </div>
        </section>

        {/* Platform stats */}
        {!!stats && (stats.verifiedProviders > 0 || stats.completedJobs > 0) && (
          <section className="mx-auto max-w-6xl px-4 pb-12">
            <div className="grid grid-cols-3 gap-4 rounded-2xl border border-border bg-surface p-6 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-dark">{stats.verifiedProviders}+</p>
                <p className="text-sm text-text-secondary mt-1">Verified providers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-dark">{stats.completedJobs}+</p>
                <p className="text-sm text-text-secondary mt-1">Jobs completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-dark">{stats.cities || 1}+</p>
                <p className="text-sm text-text-secondary mt-1">Cities covered</p>
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-text-primary mb-8">How Bokle works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="rounded-xl border border-border bg-surface p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-text-primary">{step.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-text-primary mb-8">What you can get help with</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {CATEGORY_TILES.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl border border-border bg-surface p-5 text-center">
                <Icon className="mx-auto h-6 w-6 text-primary-dark" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-text-primary">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Help Me Check Am spotlight */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl border-l-4 border-premium bg-premium-light/40 p-8 sm:p-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-premium px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Premium Feature
            </span>
            <h2 className="mt-4 text-2xl font-bold text-premium-dark">Help Me Check Am</h2>
            <p className="mt-2 max-w-2xl text-text-secondary">
              Buying a car in Lagos from Abuja? Checking on your mother in Enugu? Verifying a property before you
              send money? Dispatch a verified local Bokle user to physically check it and send you a structured,
              photo-backed report — wherever you are.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex rounded-lg bg-premium px-5 py-2.5 text-sm font-medium text-white hover:bg-premium-dark"
            >
              See how it works
            </Link>
          </div>
        </section>

        {/* Diaspora / remote care */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl border border-border bg-surface p-8 sm:p-10 flex flex-col sm:flex-row gap-6 items-start">
            <div className="rounded-full bg-primary-light p-3 flex-shrink-0">
              <Plane className="h-6 w-6 text-primary-dark" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Living abroad? Still show up for family back home.</h2>
              <p className="mt-2 max-w-2xl text-text-secondary">
                From London, Lagos never felt so close. Book a recurring welfare visit for a parent, verify a
                property before you wire money, or get a car checked before a relative buys it — all from wherever
                you are, with a documented report waiting in your inbox.
              </p>
            </div>
          </div>
        </section>

        {/* Trust signals */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-primary-dark flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-text-primary">Verified providers</p>
                <p className="text-sm text-text-secondary">ID + selfie checked before anyone goes live.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="h-6 w-6 text-primary-dark flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-text-primary">Escrow-protected payments</p>
                <p className="text-sm text-text-secondary">Funds release only after you confirm the job is done.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileCheck2 className="h-6 w-6 text-primary-dark flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-text-primary">Documented reports</p>
                <p className="text-sm text-text-secondary">Every job ends with a photo-backed, downloadable report.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Premium pricing teaser */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-center text-2xl font-semibold text-text-primary mb-2">Unlock Help Me Check Am</h2>
          <p className="text-center text-text-secondary mb-8">Simple Premium pricing. Cancel anytime.</p>
          <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
            {(["monthly", "quarterly", "annual"] as const).map((plan) => (
              <div key={plan} className="rounded-xl border border-border bg-surface p-6 text-center">
                <p className="text-sm font-medium capitalize text-text-secondary">{plan}</p>
                <p className="text-2xl font-bold text-premium-dark mt-1">
                  {stats ? formatNaira(stats.prices[plan]) : "—"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="rounded-2xl border border-border bg-surface-raised p-8 sm:p-10 flex flex-col sm:flex-row gap-6 items-start">
            <div className="rounded-full bg-primary-light p-3 flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary-dark" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-text-primary">Running a business? Book at scale.</h2>
              <p className="mt-2 max-w-2xl text-text-secondary">
                Enterprise accounts can book cleaning, maintenance, or care visits across multiple sites or
                recipients in one submission — with the same escrow protection and documented reports.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" /> Bulk-book up to 50 visits at once
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" /> One wallet, one invoice
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-text-primary">Ready to get started?</h2>
          <Link
            href="/register"
            className="mt-5 inline-flex rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-dark"
          >
            Create your free account
          </Link>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-text-muted">
          © {new Date().getFullYear()} Bokle. Built for Nigeria.
        </div>
      </footer>
    </div>
  );
}
