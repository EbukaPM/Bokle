import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export const metadata = {
  title: "Privacy Policy — Bokle",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo />
          <Link href="/" className="text-sm font-medium text-text-secondary hover:text-text-primary">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 prose-sm">
        <h1 className="text-2xl font-bold text-text-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-6 text-text-secondary">
          <section>
            <h2 className="text-lg font-semibold text-text-primary">What we collect</h2>
            <p className="mt-2">
              To create your account and connect you with providers, we collect your name, contact
              details (email or phone), state/LGA, and — for providers — identity verification
              documents and a selfie. Help Me Check Am jobs may include photos and notes submitted
              by the checker as part of the report you requested.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">How we use it</h2>
            <p className="mt-2">
              Your information is used to operate the marketplace: matching you with providers,
              processing payments through escrow, verifying provider identity, sending
              notifications about your requests, and improving the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">Payments</h2>
            <p className="mt-2">
              Payments are processed by Paystack. Bokle does not store your card details — funds
              are held in escrow and released according to the terms of each service request.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">Your choices</h2>
            <p className="mt-2">
              You can review and update your profile information at any time from your account
              settings, or contact us to request deletion of your account.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">Contact</h2>
            <p className="mt-2">
              Questions about this policy? Reach us at{" "}
              <a href="mailto:hello@bokle.ng" className="text-primary-dark font-medium">
                hello@bokle.ng
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
