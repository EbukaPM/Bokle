"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { StatusBadge, CheckAmTag } from "@/components/ui/Badge";
import { api } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import type { ServiceRequest, ServiceCategory, User, ProviderProfile } from "@prisma/client";

type AdminRequest = ServiceRequest & {
  category: ServiceCategory;
  client: Pick<User, "fullName" | "email" | "phone">;
  assignedProvider: (ProviderProfile & { user: Pick<User, "fullName"> }) | null;
};

export default function AdminRequestsPage() {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");

  const { data: requests } = useQuery({
    queryKey: ["admin", "requests", status, type],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (type) params.set("type", type);
      return api.get<{ requests: AdminRequest[] }>(`/api/v1/admin/requests?${params}`).then((d) => d.requests);
    },
  });

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
              <StatusBadge status={r.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
