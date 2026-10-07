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
  Camera,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
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
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <a href="#how-it-works" className="hover:text-text-primary">How it works</a>
            <a href="#check-am" className="hover:text-text-primary">Check Am</a>
            <a href="#pricing" className="hover:text-text-primary">Pricing</a>
            <a href="#enterprise" className="hover:text-text-primary">Enterprise</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary px-2">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              Get Started
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
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12 scroll-mt-20">
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
        <section id="check-am" className="mx-auto max-w-6xl px-4 py-12 scroll-mt-20">
          <div className="rounded-2xl border-l-4 border-premium bg-premium-light/40 p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-premium px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Premium Feature
                </span>
                <h2 className="mt-4 text-2xl font-bold text-premium-dark sm:text-3xl">
                  Physical verification, with proof — anywhere in Nigeria.
                </h2>
                <p className="mt-3 max-w-xl text-text-secondary">
                  Buying a car in Lagos from Abuja? Checking on your mother in Enugu? Verifying a property before
                  you send money? Dispatch a verified local Bokle user to go and look — in person — and send back a
                  structured, photo-backed report. Not a phone call and a promise.
                </p>
                <Link
                  href="/register"
                  className="mt-5 inline-flex rounded-lg bg-premium px-5 py-2.5 text-sm font-medium text-white hover:bg-premium-dark"
                >
                  See how it works
                </Link>
              </div>

              {/* Proof snippet — a real report's shape, not a fabricated quote */}
              <div className="rounded-xl border border-premium/30 bg-surface p-5 font-mono text-xs shadow-sm">
                <div className="flex items-center justify-between text-text-muted">
                  <span>check_am_report.json</span>
                  <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <div className="mt-3 space-y-1.5 text-text-primary">
                  <p>
                    <span className="text-premium-dark">type</span>: Vehicle Check
                  </p>
                  <p>
                    <span className="text-premium-dark">subject</span>: 2015 Toyota Camry · Ikeja, Lagos
                  </p>
                  <p>
                    <span className="text-premium-dark">checker</span>: Provider One (Verified)
                  </p>
                  <p>
                    <span className="text-premium-dark">photos</span>: 6 attached
                  </p>
                  <p>
                    <span className="text-premium-dark">assessment</span>: Recommended
                  </p>
                  <p>
                    <span className="text-premium-dark">delivered</span>: 6h after request
                  </p>
                </div>
              </div>
            </div>
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
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-12 scroll-mt-20">
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
        <section id="enterprise" className="mx-auto max-w-6xl px-4 py-12 scroll-mt-20">
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
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-text-secondary">
                Trusted help, right where you need it — verified providers and physical
                verification, anywhere in Nigeria.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary">Product</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li><a href="#how-it-works" className="hover:text-text-primary">How it works</a></li>
                <li><a href="#check-am" className="hover:text-text-primary">Help Me Check Am</a></li>
                <li><a href="#pricing" className="hover:text-text-primary">Pricing</a></li>
                <li><a href="#enterprise" className="hover:text-text-primary">Enterprise</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary">Account</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li><Link href="/register" className="hover:text-text-primary">Get Started</Link></li>
                <li><Link href="/login" className="hover:text-text-primary">Sign in</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                <li><Link href="/privacy" className="hover:text-text-primary">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-text-primary">Terms of Service</Link></li>
                <li><a href="mailto:hello@bokle.ng" className="hover:text-text-primary">hello@bokle.ng</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-center text-sm text-text-muted">
            © {new Date().getFullYear()} Bokle. Built for Nigeria.
          </div>
        </div>
      </footer>
    </div>
  );
}
