"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PremiumBadge } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";

interface AdminUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  membershipTier: string;
  isProviderActive: boolean;
  providerVerified: boolean;
  isSuspended: boolean;
  isAdmin: boolean;
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: users } = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => api.get<{ users: AdminUser[] }>(`/api/v1/admin/users${search ? `?search=${search}` : ""}`).then((d) => d.users),
  });

  async function toggleSuspend(id: string, isSuspended: boolean) {
    setActingId(id);
    try {
      await api.patch(`/api/v1/admin/users/${id}`, { isSuspended: !isSuspended });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } finally {
      setActingId(null);
    }
  }

  async function grantPremium(id: string) {
    setActingId(id);
    try {
      await api.patch(`/api/v1/admin/users/${id}`, { grantPremiumDays: 30 });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Users</h1>
      <Input placeholder="Search by name, email, or phone" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="space-y-2">
        {users?.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-primary">{u.fullName}</p>
                  {u.membershipTier === "premium" && <PremiumBadge />}
                  {u.isSuspended && <span className="text-xs text-error font-medium">Suspended</span>}
                </div>
                <p className="text-sm text-text-secondary">{u.email || u.phone}</p>
              </div>
              <div className="flex gap-2">
                {u.membershipTier !== "premium" && (
                  <Button size="sm" variant="secondary" onClick={() => grantPremium(u.id)} isLoading={actingId === u.id}>
                    Grant Premium
                  </Button>
                )}
                {!u.isAdmin && (
                  <Button
                    size="sm"
                    variant={u.isSuspended ? "secondary" : "ghost"}
                    onClick={() => toggleSuspend(u.id, u.isSuspended)}
                    isLoading={actingId === u.id}
                  >
                    {u.isSuspended ? "Reactivate" : "Suspend"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
