import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export const metadata = {
  title: "Terms of Service — Bokle",
};

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold text-text-primary">Terms of Service</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-6 text-text-secondary">
          <section>
            <h2 className="text-lg font-semibold text-text-primary">The service</h2>
            <p className="mt-2">
              Bokle connects clients with independent local providers for everyday services and,
              for Premium members, remote physical verification through Help Me Check Am. Bokle
              facilitates these connections and payments but providers are independent and not
              Bokle employees.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">Escrow &amp; payments</h2>
            <p className="mt-2">
              Funds for a service request are held in escrow when the request is created and
              released to the provider once the client confirms the job is complete, minus
              Bokle&apos;s commission. Disputed jobs are reviewed by Bokle before funds are released
              or refunded.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">Provider verification</h2>
            <p className="mt-2">
              Providers must submit valid identification and pass Bokle&apos;s verification process
              before accepting jobs. Bokle may suspend or remove any account that violates these
              terms or engages in fraudulent or unsafe conduct.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">Premium &amp; Help Me Check Am</h2>
            <p className="mt-2">
              Help Me Check Am is available to Premium subscribers. Subscriptions renew according
              to the plan selected and can be cancelled at any time; access continues until the
              end of the paid period.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-text-primary">Contact</h2>
            <p className="mt-2">
              Questions about these terms? Reach us at{" "}
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
