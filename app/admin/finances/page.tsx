"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/fetcher";
import { formatDate, formatNaira } from "@/lib/utils";
import type { WithdrawalRequest, User, BankAccount } from "@prisma/client";

type WithdrawalDetail = WithdrawalRequest & { user: Pick<User, "fullName" | "email">; bankAccount: BankAccount };

export default function AdminFinancesPage() {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: withdrawals } = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: () =>
      api.get<{ withdrawals: WithdrawalDetail[] }>("/api/v1/admin/withdrawals?status=pending").then((d) => d.withdrawals),
  });

  async function process(id: string, action: "approve" | "reject") {
    setActingId(id);
    setError(null);
    try {
      await api.patch(`/api/v1/admin/withdrawals/${id}/process`, { action });
      queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Finances</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/finances/transactions"
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised"
          >
            Transaction Log
          </Link>
          <a
            href="/api/v1/admin/reports/export"
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-3">Pending withdrawals</h2>
        {!withdrawals?.length && <p className="text-text-secondary">No pending withdrawals.</p>}
        <div className="space-y-2">
          {withdrawals?.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-text-primary">{w.user.fullName}</p>
                  <p className="text-sm text-text-secondary">
                    {w.bankAccount.bankName} · {w.bankAccount.accountNumber}
                  </p>
                  <p className="text-sm text-text-muted">
                    {formatNaira(w.netAmount.toString())} · requested {formatDate(w.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => process(w.id, "approve")} isLoading={actingId === w.id}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => process(w.id, "reject")} isLoading={actingId === w.id}>
                    Reject
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
