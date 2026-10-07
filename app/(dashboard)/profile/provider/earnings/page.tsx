"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { api } from "@/lib/fetcher";
import { formatNaira } from "@/lib/utils";

interface EarningsData {
  hasProfile: boolean;
  totalEarned: number;
  earnedToday: number;
  earnedThisWeek: number;
  earnedThisMonth: number;
  weeklySeries: { weekStart: string; amount: number }[];
  stats: { totalJobs: number; avgRating: number | null; totalReviews: number; responseRate: number };
}

export default function ProviderEarningsPage() {
  const { data } = useQuery({
    queryKey: ["provider", "earnings"],
    queryFn: () => api.get<EarningsData>("/api/v1/provider/earnings"),
  });

  const chartData = data?.weeklySeries.map((w) => ({
    week: new Date(w.weekStart).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
    amount: w.amount,
  }));

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/profile/provider" className="flex items-center gap-1 text-sm text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to provider profile
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Earnings & Stats</h1>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Stat label="Today" value={data ? formatNaira(data.earnedToday) : "—"} />
        <Stat label="This week" value={data ? formatNaira(data.earnedThisWeek) : "—"} />
        <Stat label="This month" value={data ? formatNaira(data.earnedThisMonth) : "—"} />
        <Stat label="All time" value={data ? formatNaira(data.totalEarned) : "—"} emphasize />
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Weekly earnings (last 12 weeks)</h2>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} interval={1} />
                <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => `₦${v}`} />
                <Tooltip formatter={(value) => formatNaira(typeof value === "number" ? value : 0)} />
                <Bar dataKey="amount" fill="#1A8C6F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Performance</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-text-primary">{data?.stats.totalJobs ?? "—"}</p>
            <p className="text-sm text-text-muted">Jobs completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary flex items-center gap-1">
              {data?.stats.avgRating ? (
                <>
                  <Star className="h-5 w-5 fill-premium text-premium" /> {data.stats.avgRating.toString()}
                </>
              ) : (
                "—"
              )}
            </p>
            <p className="text-sm text-text-muted">
              {data?.stats.avgRating ? `${data.stats.totalReviews} reviews` : "Needs 5+ jobs to show"}
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-text-primary">{data?.stats.responseRate.toString() ?? "—"}%</p>
            <p className="text-sm text-text-muted">Response rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <Card>
      <CardContent>
        <p className={`text-lg font-bold ${emphasize ? "text-primary-dark" : "text-text-primary"}`}>{value}</p>
        <p className="text-xs text-text-muted mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
