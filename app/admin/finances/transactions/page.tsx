"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/fetcher";
import { formatDateTime, formatNaira } from "@/lib/utils";
import type { WalletTransaction, Wallet, User } from "@prisma/client";

type TxWithUser = WalletTransaction & { wallet: Wallet & { user: Pick<User, "fullName" | "email"> } };

const TYPES = [
  "topup", "subscription", "payment", "escrow_hold", "escrow_release",
  "commission", "payout", "refund", "earned",
];

export default function AdminTransactionLogPage() {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["admin", "transactions", type, page],
    queryFn: () =>
      api.get<{ transactions: TxWithUser[]; total: number; pageSize: number }>(
        `/api/v1/admin/transactions?${type ? `type=${type}&` : ""}page=${page}`
      ),
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-6">
      <Link href="/admin/finances" className="flex items-center gap-1 text-sm text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to finances
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Transaction Log</h1>
        <a
          href="/api/v1/admin/reports/export"
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <Select
        placeholder="All types"
        options={TYPES.map((t) => ({ value: t, label: t.replace("_", " ") }))}
        value={type}
        onChange={(e) => {
          setType(e.target.value);
          setPage(1);
        }}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted border-b border-border">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">User</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Reference</th>
            </tr>
          </thead>
          <tbody>
            {data?.transactions.map((t) => (
              <tr key={t.id} className="border-b border-border">
                <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                <td className="py-2 pr-4">{t.wallet.user.fullName}</td>
                <td className="py-2 pr-4 capitalize">{t.type.replace("_", " ")}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{formatNaira(t.amount.toString())}</td>
                <td className="py-2 pr-4 text-text-muted font-mono text-xs">{t.reference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!data?.transactions.length && (
        <Card>
          <CardContent className="text-center py-8 text-text-secondary">No transactions found.</CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
