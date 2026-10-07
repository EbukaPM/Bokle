"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { api } from "@/lib/fetcher";
import { formatNaira } from "@/lib/utils";

interface DashboardData {
  requests: { today: number; week: number; month: number; byType: { requestType: string; _count: number }[] };
  providers: { active: number; pendingVerifications: number };
  jobs: { completed: number; pending: number; disputed: number };
  premium: { subscribers: number; revenue: number };
  flaggedReports: number;
  commissionEarned: number;
}

export default function AdminOverviewPage() {
  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.get<DashboardData>("/api/v1/admin/dashboard"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Requests today" value={data?.requests.today} />
        <Stat label="Requests this week" value={data?.requests.week} />
        <Stat label="Requests this month" value={data?.requests.month} />
        <Stat label="Active providers" value={data?.providers.active} />
        <Stat label="Completed jobs" value={data?.jobs.completed} />
        <Stat label="Pending jobs" value={data?.jobs.pending} />
        <Stat label="Disputed jobs" value={data?.jobs.disputed} tone={data?.jobs.disputed ? "warning" : undefined} />
        <Stat label="Premium subscribers" value={data?.premium.subscribers} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary">Commission earned (all time)</p>
            <p className="text-2xl font-bold text-primary-dark mt-1">
              {data ? formatNaira(data.commissionEarned) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary">Active premium revenue</p>
            <p className="text-2xl font-bold text-premium-dark mt-1">
              {data ? formatNaira(data.premium.revenue) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/providers">
          <Card className="hover:border-primary transition-colors">
            <CardContent>
              <p className="font-semibold text-text-primary">{data?.providers.pendingVerifications ?? "—"} pending verifications</p>
              <p className="text-sm text-text-secondary mt-1">Review provider ID and selfie submissions</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/disputes">
          <Card className="hover:border-primary transition-colors">
            <CardContent>
              <p className="font-semibold text-text-primary">{data?.jobs.disputed ?? "—"} open disputes</p>
              <p className="text-sm text-text-secondary mt-1">Resolve client/provider disputes</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {!!data?.flaggedReports && (
        <Card className="border-error">
          <CardContent>
            <p className="font-medium text-error">{data.flaggedReports} report(s) flagged for concern</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value?: number; tone?: "warning" }) {
  return (
    <Card>
      <CardContent>
        <p className={`text-2xl font-bold ${tone === "warning" ? "text-warning" : "text-text-primary"}`}>
          {value ?? "—"}
        </p>
        <p className="text-sm text-text-secondary mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
