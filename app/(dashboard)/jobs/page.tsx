"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, CheckAmTag } from "@/components/ui/Badge";
import { api, ApiError } from "@/lib/fetcher";
import { formatDate, formatNaira, cn } from "@/lib/utils";
import type { ServiceRequest, ServiceCategory, User } from "@prisma/client";

type JobWithDetails = ServiceRequest & { category: ServiceCategory; client: Pick<User, "fullName" | "state" | "lga"> };

type Tab = "available" | "active" | "reports";

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsPageInner />
    </Suspense>
  );
}

function JobsPageInner() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "available";
  const [tab, setTab] = useState<Tab>(initialTab);
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: available } = useQuery({
    queryKey: ["jobs", "available"],
    queryFn: () => api.get<{ jobs: JobWithDetails[] }>("/api/v1/jobs/available").then((d) => d.jobs),
    enabled: tab === "available",
  });

  const { data: active } = useQuery({
    queryKey: ["jobs", "mine", "active"],
    queryFn: () => api.get<{ jobs: JobWithDetails[] }>("/api/v1/jobs/mine").then((d) => d.jobs),
    enabled: tab === "active" || tab === "reports",
  });

  const activeJobs = active?.filter((j) => !["confirmed", "report_submitted"].includes(j.status));
  const reportJobs = active?.filter((j) => ["confirmed", "report_submitted"].includes(j.status));

  async function handleAccept(jobId: string) {
    setActingId(jobId);
    try {
      await api.post(`/api/v1/jobs/${jobId}/accept`);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setTab("active");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(jobId: string) {
    const reason = prompt("Why are you declining this job?");
    if (!reason) return;
    setActingId(jobId);
    try {
      await api.post(`/api/v1/jobs/${jobId}/decline`, { reason });
      queryClient.invalidateQueries({ queryKey: ["jobs", "available"] });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Jobs</h1>

      <div role="tablist" className="inline-flex rounded-full border border-border bg-surface-raised p-1">
        {(["available", "active", "reports"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize",
              tab === t ? "bg-primary text-white" : "text-text-secondary"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "available" && (
        <div className="space-y-3">
          {!available?.length && <p className="text-text-secondary">No jobs available right now.</p>}
          {available?.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">{job.category.name}</p>
                    {job.requestType === "check_am" && <CheckAmTag />}
                  </div>
                  <p className="text-sm text-text-secondary">{job.serviceAddress}</p>
                  <p className="text-sm text-text-muted mt-1">
                    {formatDate(job.createdAt)} · {formatNaira(job.quotedPrice?.toString() || "0")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(job.id)} isLoading={actingId === job.id}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDecline(job.id)}>
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "active" && (
        <div className="space-y-3">
          {!activeJobs?.length && <p className="text-text-secondary">No active jobs.</p>}
          {activeJobs?.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:border-primary transition-colors">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{job.category.name}</p>
                    <p className="text-sm text-text-secondary">{job.client.fullName}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {!reportJobs?.length && <p className="text-text-secondary">No submitted reports yet.</p>}
          {reportJobs?.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="hover:border-primary transition-colors">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{job.category.name}</p>
                    <p className="text-sm text-text-secondary">{job.client.fullName}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
