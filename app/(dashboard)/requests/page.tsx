"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { ServiceRequest, ServiceCategory } from "@prisma/client";

type RequestWithCategory = ServiceRequest & { category: ServiceCategory };

export default function RequestsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: requests, isLoading } = useQuery({
    queryKey: ["requests", "general"],
    queryFn: () =>
      api.get<{ requests: RequestWithCategory[] }>("/api/v1/requests?type=general").then((d) => d.requests),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">My Requests</h1>
        <div className="flex gap-2">
          {user?.isEnterprise && (
            <Link
              href="/requests/bulk"
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-muted bg-primary-light px-4 py-2 text-sm font-medium text-primary-dark hover:bg-primary-muted/40"
            >
              <Layers className="h-4 w-4" aria-hidden="true" /> Bulk booking
            </Link>
          )}
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New request
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-text-secondary">Loading…</p>}

      {!isLoading && !requests?.length && (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-text-secondary mb-4">You haven&apos;t posted any requests yet.</p>
            <Link href="/requests/new" className="text-primary-dark font-medium">
              Post your first request
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {requests?.map((r) => (
          <Link key={r.id} href={`/requests/${r.id}`}>
            <Card className="hover:border-primary transition-colors">
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-text-primary">{r.category.name}</p>
                  <p className="text-sm text-text-secondary">{r.serviceAddress}</p>
                  <p className="text-sm text-text-muted mt-1">
                    {formatDate(r.createdAt)} · {formatNaira(r.quotedPrice?.toString() || "0")}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
