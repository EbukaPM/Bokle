"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge } from "@/components/ui/Badge";
import { api, ApiError } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import type { Dispute, ServiceRequest, ServiceCategory, User } from "@prisma/client";

type DisputeDetail = Dispute & {
  request: ServiceRequest & { category: ServiceCategory; client: Pick<User, "fullName"> };
  raisedByUser: Pick<User, "fullName" | "email">;
};

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [refundPortion, setRefundPortion] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: disputes } = useQuery({
    queryKey: ["admin", "disputes"],
    queryFn: () => api.get<{ disputes: DisputeDetail[] }>("/api/v1/admin/disputes?status=open").then((d) => d.disputes),
  });

  async function resolve(id: string) {
    setActingId(id);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/disputes/${id}/resolve`, {
        resolution: resolution[id] || "closed",
        resolutionNotes: notes[id] || "Resolved by admin",
        refundPortion: refundPortion[id] || "none",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Disputes</h1>

      {!disputes?.length && <p className="text-text-secondary">No open disputes.</p>}

      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <div className="space-y-4">
        {disputes?.map((d) => (
          <Card key={d.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-text-primary">{d.request.category.name}</h2>
                <p className="text-sm text-text-secondary">
                  Raised by {d.raisedByUser.fullName} · {formatDate(d.createdAt)}
                </p>
              </div>
              <StatusBadge status={d.status} />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text-primary">{d.reason}</p>
              <p className="text-sm text-text-muted">Job amount: {formatNaira(d.request.quotedPrice?.toString() || "0")}</p>

              <Select
                label="Resolution"
                options={[
                  { value: "resolved_for_client", label: "Resolve for client (refund)" },
                  { value: "resolved_for_provider", label: "Resolve for provider (release payment)" },
                  { value: "closed", label: "Close without action" },
                ]}
                value={resolution[d.id] || ""}
                onChange={(e) => setResolution((r) => ({ ...r, [d.id]: e.target.value }))}
                placeholder="Select resolution"
              />

              {resolution[d.id] === "resolved_for_client" && (
                <Select
                  label="Refund"
                  options={[
                    { value: "full", label: "Full refund" },
                    { value: "partial", label: "Partial refund" },
                  ]}
                  value={refundPortion[d.id] || ""}
                  onChange={(e) => setRefundPortion((r) => ({ ...r, [d.id]: e.target.value }))}
                  placeholder="Select refund type"
                />
              )}

              <Textarea
                label="Resolution notes"
                value={notes[d.id] || ""}
                onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
              />

              <Button onClick={() => resolve(d.id)} isLoading={actingId === d.id} disabled={!resolution[d.id]}>
                Resolve dispute
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
