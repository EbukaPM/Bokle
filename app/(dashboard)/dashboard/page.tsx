"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Sparkles, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { RoleToggle } from "@/components/layout/RoleToggle";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ServiceRequest, ServiceCategory } from "@prisma/client";

type RequestWithCategory = ServiceRequest & { category: ServiceCategory };

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const activeRole = useAuthStore((s) => s.activeRole);
  const { t } = useTranslation();

  const { data: requests } = useQuery({
    queryKey: ["requests", "active"],
    queryFn: () => api.get<{ requests: RequestWithCategory[] }>("/api/v1/requests").then((d) => d.requests),
    enabled: activeRole === "client",
  });

  const { data: availableJobs } = useQuery({
    queryKey: ["jobs", "available"],
    queryFn: () => api.get<{ jobs: unknown[] }>("/api/v1/jobs/available").then((d) => d.jobs),
    enabled: activeRole === "provider",
  });

  const activeRequests = requests?.filter((r) => !["confirmed", "cancelled", "refunded"].includes(r.status));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t("dashboard_welcome")}, {user?.fullName?.split(" ")[0]}
            </h1>
            <p className="text-text-secondary mt-1">{t("dashboard_subtitle")}</p>
          </div>
          <RoleToggle />
        </CardContent>
      </Card>

      {activeRole === "client" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/requests/new">
              <Card className="h-full hover:border-primary transition-colors">
                <CardContent className="flex items-center gap-3">
                  <div className="rounded-full bg-primary-light p-3">
                    <Plus className="h-5 w-5 text-primary-dark" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{t("post_request")}</p>
                    <p className="text-sm text-text-secondary">{t("post_request_desc")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/check-am">
              <div className="h-full rounded-xl border-l-4 border-premium bg-premium-light/30 p-4 hover:opacity-90 transition-opacity">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-premium p-3">
                    <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-premium-dark">{t("check_am_title")}</p>
                    <p className="text-sm text-text-secondary">Dispatch a verified checker anywhere in Nigeria</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text-primary">{t("active_requests")}</h2>
              <Link href="/requests" className="text-sm text-primary-dark font-medium flex items-center gap-1">
                {t("view_all")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {!activeRequests?.length ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-text-secondary">{t("no_active_requests")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeRequests.slice(0, 5).map((r) => (
                  <Link key={r.id} href={r.requestType === "check_am" ? `/check-am/${r.id}` : `/requests/${r.id}`}>
                    <Card className="hover:border-primary transition-colors">
                      <CardContent className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">{r.category.name}</p>
                          <p className="text-sm text-text-secondary">{formatDate(r.createdAt)} · {formatNaira(r.quotedPrice?.toString() || "0")}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/jobs">
            <Card className="h-full hover:border-primary transition-colors">
              <CardContent>
                <p className="text-3xl font-bold text-primary-dark">{availableJobs?.length ?? "—"}</p>
                <p className="text-sm text-text-secondary mt-1">{t("jobs_available_near_you")}</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/profile/provider">
            <Card className="h-full hover:border-primary transition-colors">
              <CardContent>
                <p className="font-semibold text-text-primary">{t("manage_provider_profile")}</p>
                <p className="text-sm text-text-secondary mt-1">Categories, coverage area & verification</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {!user?.providerVerified && activeRole === "provider" && (
        <Card className="border-warning">
          <CardContent>
            <p className="font-medium text-warning">Verification pending</p>
            <p className="text-sm text-text-secondary mt-1">
              Submit your ID and selfie to start appearing in job searches.
            </p>
            <Link
              href="/profile/provider"
              className="mt-3 inline-flex h-8 items-center rounded-lg border border-primary-muted bg-primary-light px-3 text-sm font-medium text-primary-dark hover:bg-primary-muted/40"
            >
              Complete verification
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
