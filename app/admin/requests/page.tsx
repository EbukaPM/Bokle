"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge, CheckAmTag } from "@/components/ui/Badge";
import { api, ApiError } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import type { ServiceRequest, ServiceCategory, User, ProviderProfile } from "@prisma/client";

type AdminRequest = ServiceRequest & {
  category: ServiceCategory;
  client: Pick<User, "fullName" | "email" | "phone">;
  assignedProvider: (ProviderProfile & { user: Pick<User, "fullName"> }) | null;
};

interface Candidate {
  provider: ProviderProfile & { user: Pick<User, "id" | "fullName" | "state" | "lga"> };
  score: number;
  breakdown: { rating: number; responseRate: number; experience: number; location: number };
}

export default function AdminRequestsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [candidatesFor, setCandidatesFor] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: requests } = useQuery({
    queryKey: ["admin", "requests", status, type],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      return api.get<{ requests: AdminRequest[] }>(`/api/v1/admin/requests?${params}`).then((d) => d.requests);
    },
  });

  const { data: candidates, isLoading: isLoadingCandidates } = useQuery({
    queryKey: ["admin", "eligible-providers", candidatesFor],
    queryFn: () =>
      api
        .get<{ candidates: Candidate[] }>(`/api/v1/admin/requests/${candidatesFor}/eligible-providers`)
        .then((d) => d.candidates),
    enabled: !!candidatesFor,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin", "requests"] });
  }

  async function autoMatch(id: string) {
    setActingId(id);
    setError(null);
    try {
      await api.post(`/api/v1/admin/requests/${id}/auto-match`);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  async function manualMatch(requestId: string, providerId: string) {
    setActingId(requestId);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/requests/${requestId}/match`, { providerId });
      setCandidatesFor(null);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">All Requests</h1>

      <div className="flex gap-3">
        <Select
          placeholder="All statuses"
          options={[
            "open", "matched", "accepted", "en_route", "on_site", "completed",
            "report_submitted", "confirmed", "disputed", "cancelled", "refunded",
          ].map((s) => ({ value: s, label: s }))}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Select
          placeholder="All types"
          options={[{ value: "general", label: "General" }, { value: "check_am", label: "Check Am" }]}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
      </div>

      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <div className="space-y-2">
        {requests?.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-text-primary">{r.category.name}</p>
                  {r.requestType === "check_am" && <CheckAmTag />}
                </div>
                <p className="text-sm text-text-secondary">
                  {r.client.fullName} → {r.assignedProvider?.user.fullName || "Unassigned"}
                </p>
                <p className="text-sm text-text-muted">
                  {formatDate(r.createdAt)} · {formatNaira(r.quotedPrice?.toString() || "0")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {r.status === "open" && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => setCandidatesFor(r.id)}>
                      <Users className="h-4 w-4" /> Candidates
                    </Button>
                    <Button size="sm" onClick={() => autoMatch(r.id)} isLoading={actingId === r.id}>
                      <Sparkles className="h-4 w-4" /> Auto-match
                    </Button>
                  </>
                )}
                <StatusBadge status={r.status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={!!candidatesFor} onClose={() => setCandidatesFor(null)} title="Eligible providers, ranked">
        {isLoadingCandidates && <p className="text-sm text-text-secondary">Loading…</p>}
        {!isLoadingCandidates && !candidates?.length && (
          <p className="text-sm text-text-secondary">No eligible providers found for this request.</p>
        )}
        <div className="space-y-3">
          {candidates?.map((c, i) => (
            <div key={c.provider.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
              <div>
                <p className="font-medium text-text-primary">
                  {i === 0 && "🏆 "}
                  {c.provider.user.fullName}
                </p>
                <p className="text-xs text-text-muted">
                  Score {c.score} · {c.provider.user.lga}, {c.provider.user.state} · {c.provider.totalJobs} jobs
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => candidatesFor && manualMatch(candidatesFor, c.provider.id)}
                isLoading={actingId === candidatesFor}
              >
                Match
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
