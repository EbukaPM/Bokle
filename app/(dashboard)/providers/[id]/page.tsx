"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { VerifiedBadge } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";
import { formatDate } from "@/lib/utils";
import type { ProviderProfile, User, ProviderCategory, ServiceCategory, Review } from "@prisma/client";

type ProviderDetail = ProviderProfile & {
  user: Pick<User, "id" | "fullName" | "avatarUrl" | "state" | "lga" | "bio">;
  categories: (ProviderCategory & { category: ServiceCategory })[];
};

type ReviewWithReviewer = Review & { reviewer: Pick<User, "fullName" | "avatarUrl"> };

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["provider", id],
    queryFn: () =>
      api.get<{ provider: ProviderDetail; reviews: ReviewWithReviewer[] }>(`/api/v1/providers/${id}`),
  });

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;
  if (!data) return <p className="text-error">Provider not found.</p>;

  const { provider, reviews } = data;
  const ratingVisible = provider.totalJobs >= 5;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-white">
          {provider.user.fullName[0]}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{provider.user.fullName}</h1>
          <VerifiedBadge />
          <p className="text-sm text-text-secondary mt-1">
            {provider.user.lga}, {provider.user.state}
          </p>
        </div>
      </div>

      {provider.user.bio && <p className="text-text-secondary">{provider.user.bio}</p>}

      <div className="flex gap-6 text-sm">
        <div>
          <p className="font-semibold text-text-primary">{provider.totalJobs}</p>
          <p className="text-text-muted">Jobs completed</p>
        </div>
        {ratingVisible && (
          <div>
            <p className="font-semibold text-text-primary flex items-center gap-1">
              <Star className="h-4 w-4 fill-premium text-premium" /> {provider.avgRating.toString()}
            </p>
            <p className="text-text-muted">{provider.totalReviews} reviews</p>
          </div>
        )}
        <div>
          <p className="font-semibold text-text-primary">{provider.responseRate.toString()}%</p>
          <p className="text-text-muted">Response rate</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Services offered</h2>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {provider.categories.map((c) => (
            <span key={c.categoryId} className="rounded-full bg-primary-light px-3 py-1 text-xs text-primary-dark">
              {c.category.name}
            </span>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Reviews</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {!reviews.length && <p className="text-sm text-text-secondary">No public reviews yet.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-text-primary text-sm">{r.reviewer.fullName}</p>
                <p className="text-xs text-text-muted">{formatDate(r.createdAt)}</p>
              </div>
              <p className="flex items-center gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < r.rating ? "fill-premium text-premium" : "text-border"}`}
                  />
                ))}
              </p>
              {r.comment && <p className="text-sm text-text-secondary mt-1">{r.comment}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Link
        href="/requests/new"
        className="block w-full rounded-lg bg-primary px-4 py-3 text-center font-medium text-white hover:bg-primary-dark"
      >
        Post a request — we&apos;ll match you with the best available provider
      </Link>
    </div>
  );
}
