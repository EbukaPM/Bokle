"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { VerifiedBadge } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";
import type { ProviderProfile, User, ProviderCategory, ServiceCategory } from "@prisma/client";

type ProviderWithUser = ProviderProfile & {
  user: Pick<User, "id" | "fullName" | "avatarUrl" | "state" | "lga" | "bio">;
  categories: (ProviderCategory & { category: ServiceCategory })[];
};

export default function ProvidersPage() {
  const [categoryId, setCategoryId] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories", "general"],
    queryFn: () => api.get<{ categories: ServiceCategory[] }>("/api/v1/categories/general").then((d) => d.categories),
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ["providers", categoryId],
    queryFn: () =>
      api
        .get<{ providers: ProviderWithUser[] }>(`/api/v1/providers${categoryId ? `?categoryId=${categoryId}` : ""}`)
        .then((d) => d.providers),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Browse providers</h1>

      <Select
        label="Filter by category"
        placeholder="All categories"
        options={(categories || []).map((c) => ({ value: c.id, label: c.name }))}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      />

      {isLoading && <p className="text-text-secondary">Loading…</p>}
      {!isLoading && !providers?.length && <p className="text-text-secondary">No providers found.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {providers?.map((p) => (
          <Link key={p.id} href={`/providers/${p.id}`}>
            <Card className="h-full hover:border-primary transition-colors">
              <CardContent className="flex gap-3">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
                  {p.user.fullName[0]}
                </span>
                <div>
                  <p className="font-medium text-text-primary">{p.user.fullName}</p>
                  <VerifiedBadge />
                  {p.totalJobs >= 5 && (
                    <p className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                      <Star className="h-3.5 w-3.5 fill-premium text-premium" /> {p.avgRating.toString()} (
                      {p.totalReviews})
                    </p>
                  )}
                  <p className="text-sm text-text-muted mt-1">
                    {p.categories.map((c) => c.category.name).join(", ")}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {p.user.lga}, {p.user.state}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
