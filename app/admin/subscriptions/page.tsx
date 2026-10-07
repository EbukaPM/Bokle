"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { api, ApiError } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import type { Subscription, User } from "@prisma/client";

type SubWithUser = Subscription & { user: Pick<User, "fullName" | "email" | "phone"> };
interface AdminUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  membershipTier: string;
}

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: subscriptions } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => api.get<{ subscriptions: SubWithUser[] }>("/api/v1/admin/subscriptions").then((d) => d.subscriptions),
  });

  const { data: searchResults } = useQuery({
    queryKey: ["admin", "users", "search", search],
    queryFn: () => api.get<{ users: AdminUser[] }>(`/api/v1/admin/users?search=${search}`).then((d) => d.users),
    enabled: search.length >= 3,
  });

  async function revoke(userId: string) {
    setActingId(userId);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { revokePremium: true });
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  async function grant(userId: string) {
    setActingId(userId);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/users/${userId}`, { grantPremiumDays: 30 });
      queryClient.invalidateQueries({ queryKey: ["admin", "subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "search"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Premium Subscriptions</h1>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Manually grant premium</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search users by name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          {search.length >= 3 && (
            <div className="space-y-2">
              {!searchResults?.length && <p className="text-sm text-text-secondary">No matches.</p>}
              {searchResults?.map((u) => (
                <div key={u.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-text-primary">{u.fullName}</p>
                    <p className="text-text-secondary">{u.email || u.phone}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={u.membershipTier === "premium"}
                    onClick={() => grant(u.id)}
                    isLoading={actingId === u.id}
                  >
                    {u.membershipTier === "premium" ? "Already premium" : "Grant 30 days"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-3">All subscriptions</h2>
        <div className="space-y-2">
          {subscriptions?.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-text-primary">{s.user.fullName}</p>
                  <p className="text-sm text-text-secondary">{s.user.email || s.user.phone}</p>
                  <p className="text-sm text-text-muted">
                    {s.planType} · {formatNaira(s.amountPaid.toString())} · expires {formatDate(s.expiresAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={s.status} />
                  {s.status === "active" && (
                    <Button size="sm" variant="ghost" onClick={() => revoke(s.userId)} isLoading={actingId === s.userId}>
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
