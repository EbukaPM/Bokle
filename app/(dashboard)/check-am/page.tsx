"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Lock, Plus, Sparkles, Download } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ServiceRequest, ServiceCategory } from "@prisma/client";

type RequestWithReport = ServiceRequest & {
  category: ServiceCategory;
  reports: { id: string; submittedAt: string; overallAssessment: string | null }[];
};

type View = "all" | "reports";

export default function CheckAmPage() {
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.membershipTier === "premium";
  const { t } = useTranslation();
  const [view, setView] = useState<View>("all");
  const [categoryId, setCategoryId] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["requests", "check_am"],
    queryFn: () =>
      api.get<{ requests: RequestWithReport[] }>("/api/v1/requests?type=check_am").then((d) => d.requests),
    enabled: isPremium,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories", "check_am"],
    queryFn: () => api.get<{ categories: ServiceCategory[] }>("/api/v1/categories/check-am").then((d) => d.categories),
    enabled: isPremium,
  });

  const filtered = useMemo(() => {
    let list = requests || [];
    if (view === "reports") list = list.filter((r) => r.reports.length > 0);
    if (categoryId) list = list.filter((r) => r.categoryId === categoryId);
    return list;
  }, [requests, view, categoryId]);

  if (!isPremium) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="inline-flex rounded-full bg-premium-light p-4 mb-4">
          <Lock className="h-8 w-8 text-premium-dark" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{t("check_am_premium_notice")}</h1>
        <p className="text-text-secondary mt-2">
          Dispatch a verified local Bokle user to physically check a car, property, person, or site anywhere in
          Nigeria — and get a structured, photo-backed report back. Upgrade to unlock it.
        </p>
        <Link
          href="/check-am/upgrade"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-premium px-6 py-3 font-medium text-white hover:bg-premium-dark"
        >
          <Sparkles className="h-4 w-4" /> Upgrade to Premium
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-premium-dark">{t("check_am_title")}</h1>
        <Link
          href="/check-am/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-premium px-4 py-2 text-sm font-medium text-white hover:bg-premium-dark"
        >
          <Plus className="h-4 w-4" /> New check
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" className="inline-flex rounded-full border border-border bg-surface-raised p-1">
          {(["all", "reports"] as View[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                view === v ? "bg-premium text-white" : "text-text-secondary"
              }`}
            >
              {v === "all" ? "All requests" : "Reports archive"}
            </button>
          ))}
        </div>
        <Select
          placeholder="All check types"
          options={(categories || []).map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading && <p className="text-text-secondary">Loading…</p>}

      {!isLoading && !filtered.length && (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-text-secondary mb-4">
              {view === "reports" ? "No reports delivered yet." : "No Check Am requests yet."}
            </p>
            <Link href="/check-am/new" className="text-premium-dark font-medium">
              Post your first check
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border-l-4 border-premium bg-premium-light/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <Link href={`/check-am/${r.id}`} className="flex-1 hover:opacity-90">
                <p className="font-medium text-text-primary">{r.category.name}</p>
                <p className="text-sm text-text-secondary">{r.serviceAddress}</p>
                <p className="text-sm text-text-muted mt-1">
                  {formatDate(r.createdAt)} · {formatNaira(r.quotedPrice?.toString() || "0")}
                  {r.reports[0] && ` · Report: ${r.reports[0].overallAssessment || "Delivered"}`}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                {r.reports.length > 0 && (
                  <a
                    href={`/api/v1/requests/${r.id}/report/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download report PDF"
                    className="rounded-full p-2 text-premium-dark hover:bg-premium/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
                <StatusBadge status={r.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
