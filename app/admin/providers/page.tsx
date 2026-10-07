"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";
import type { ProviderProfile, User } from "@prisma/client";

type PendingProvider = ProviderProfile & {
  user: Pick<User, "id" | "fullName" | "email" | "phone" | "state" | "lga">;
};

type AllProvider = ProviderProfile & {
  user: Pick<User, "id" | "fullName" | "email" | "phone" | "isSuspended" | "isProviderActive">;
};

export default function AdminProvidersPage() {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const { data: pending } = useQuery({
    queryKey: ["admin", "providers", "pending"],
    queryFn: () => api.get<{ providers: PendingProvider[] }>("/api/v1/admin/providers/pending").then((d) => d.providers),
  });

  const { data: all } = useQuery({
    queryKey: ["admin", "providers", "all"],
    queryFn: () => api.get<{ providers: AllProvider[] }>("/api/v1/admin/providers").then((d) => d.providers),
  });

  async function decide(id: string, decision: "approved" | "rejected") {
    setActingId(id);
    try {
      await api.patch(`/api/v1/admin/providers/${id}/verify`, { decision, adminNotes: notes[id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
    } finally {
      setActingId(null);
    }
  }

  async function toggleSuspend(id: string, suspended: boolean) {
    setActingId(id);
    try {
      await api.patch(`/api/v1/admin/providers/${id}/suspend`, { suspended });
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-4">Pending verifications</h1>
        {!pending?.length && <p className="text-text-secondary">No pending verifications.</p>}
        <div className="space-y-4">
          {pending?.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <h2 className="font-semibold text-text-primary">{p.user.fullName}</h2>
                <p className="text-sm text-text-secondary">
                  {p.user.email || p.user.phone} · {p.user.lga}, {p.user.state}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  {p.idDocumentUrl && (
                    <a href={p.idDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-dark font-medium">
                      View ID document
                    </a>
                  )}
                  {p.selfieUrl && (
                    <a href={p.selfieUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-dark font-medium">
                      View selfie
                    </a>
                  )}
                </div>
                <Textarea
                  label="Admin notes (shown to provider if rejected)"
                  value={notes[p.id] || ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value }))}
                />
                <div className="flex gap-3">
                  <Button onClick={() => decide(p.id, "approved")} isLoading={actingId === p.id}>
                    Approve
                  </Button>
                  <Button variant="danger" onClick={() => decide(p.id, "rejected")} isLoading={actingId === p.id}>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">All providers</h2>
        <div className="space-y-2">
          {all?.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{p.user.fullName}</p>
                  <p className="text-sm text-text-secondary">{p.user.email || p.user.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.verificationStatus} />
                  <Button
                    size="sm"
                    variant={p.user.isSuspended ? "secondary" : "ghost"}
                    onClick={() => toggleSuspend(p.id, !p.user.isSuspended)}
                    isLoading={actingId === p.id}
                  >
                    {p.user.isSuspended ? "Reactivate" : "Suspend"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
