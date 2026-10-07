"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/fetcher";
import { formatNaira, cn } from "@/lib/utils";

const FEATURES = [
  "Unlock Help Me Check Am — dispatch a verified checker anywhere in Nigeria",
  "Priority provider matching where available",
  "Enhanced report format with more photos",
  "Dedicated support priority",
  "Premium badge on your profile",
];

type Plan = "monthly" | "quarterly" | "annual";

export default function UpgradePage() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.get<{ prices: Record<Plan, number> }>("/api/v1/subscription"),
  });

  async function handleSubscribe(paymentMethod: "wallet" | "paystack") {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.post<{ activated: boolean; authorizationUrl?: string }>(
        "/api/v1/subscription/checkout",
        { plan, paymentMethod }
      );
      if (result.activated) {
        router.push("/check-am");
      } else if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const prices = subscription?.prices;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1 rounded-full bg-premium px-3 py-1 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5" /> Premium
        </span>
        <h1 className="text-2xl font-bold text-text-primary mt-3">Upgrade to unlock Help Me Check Am</h1>
      </div>

      <ul className="space-y-2 mb-8">
        {FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="h-4 w-4 text-premium flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        {(["monthly", "quarterly", "annual"] as Plan[]).map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              plan === p ? "border-premium bg-premium-light/40" : "border-border bg-surface"
            )}
            aria-pressed={plan === p}
          >
            <p className="text-sm font-medium capitalize text-text-primary">{p}</p>
            <p className="text-lg font-bold text-premium-dark mt-1">
              {prices ? formatNaira(prices[p]) : "—"}
            </p>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-error mb-4">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="premium" className="flex-1" isLoading={isSubmitting} onClick={() => handleSubscribe("wallet")}>
          Pay from wallet
        </Button>
        <Button variant="ghost" className="flex-1" isLoading={isSubmitting} onClick={() => handleSubscribe("paystack")}>
          Pay with card
        </Button>
      </div>
    </div>
  );
}
