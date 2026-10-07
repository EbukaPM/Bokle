"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Plus, Minus, Landmark, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { api, ApiError } from "@/lib/fetcher";
import { formatNaira, formatDateTime } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { Wallet, WalletTransaction, BankAccount } from "@prisma/client";

const TX_LABELS: Record<string, string> = {
  topup: "Wallet top-up",
  subscription: "Premium subscription",
  payment: "Payment",
  escrow_hold: "Held in escrow",
  escrow_release: "Escrow released",
  commission: "Platform commission",
  payout: "Withdrawal",
  refund: "Refund",
  earned: "Earnings",
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [bankTransferOpen, setBankTransferOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.get<{ wallet: Wallet }>("/api/v1/wallet").then((d) => d.wallet),
  });

  const { data: transactions } = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () =>
      api.get<{ transactions: WalletTransaction[] }>("/api/v1/wallet/transactions").then((d) => d.transactions),
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["wallet", "bank-accounts"],
    queryFn: () => api.get<{ accounts: BankAccount[] }>("/api/v1/wallet/bank-accounts").then((d) => d.accounts),
  });

  const {
    data: virtualAccount,
    isLoading: isLoadingVirtualAccount,
    error: virtualAccountError,
  } = useQuery({
    queryKey: ["wallet", "virtual-account"],
    queryFn: () =>
      api.get<{ accountNumber: string; bankName: string; accountName: string }>("/api/v1/wallet/virtual-account"),
    enabled: bankTransferOpen,
    retry: false,
  });

  function copyAccountNumber() {
    if (!virtualAccount) return;
    navigator.clipboard.writeText(virtualAccount.accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await api.post<{ authorizationUrl: string; reference: string; amount: number }>(
        "/api/v1/wallet/topup/init",
        { amount: parseFloat(amount) }
      );
      // Dev-mock mode: immediately verify instead of redirecting to a real gateway.
      if (result.authorizationUrl.includes("/mock-checkout")) {
        await api.post("/api/v1/wallet/topup/verify", { reference: result.reference, amount: result.amount });
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        setTopUpOpen(false);
        setAmount("");
      } else {
        window.location.href = result.authorizationUrl;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post("/api/v1/wallet/withdraw", { bankAccountId, amount: parseFloat(amount) });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      setWithdrawOpen(false);
      setAmount("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-text-primary">Wallet</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary">{t("available_balance")}</p>
            <p className="text-3xl font-bold text-primary-dark mt-1">
              {wallet ? formatNaira(wallet.availableBalance.toString()) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-text-secondary" title="Funds held for active jobs">
              In escrow
            </p>
            <p className="text-3xl font-bold text-text-primary mt-1">
              {wallet ? formatNaira(wallet.escrowBalance.toString()) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => setTopUpOpen(true)} className="flex-1">
          <Plus className="h-4 w-4" /> {t("top_up")}
        </Button>
        <Button variant="secondary" onClick={() => setWithdrawOpen(true)} className="flex-1">
          <Minus className="h-4 w-4" /> {t("withdraw")}
        </Button>
        <Button variant="ghost" onClick={() => setBankTransferOpen(true)} className="flex-1">
          <Landmark className="h-4 w-4" /> Bank Transfer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Transaction history</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {!transactions?.length && <p className="text-sm text-text-secondary">No transactions yet.</p>}
          {transactions?.map((t) => {
            const isCredit = parseFloat(t.amount.toString()) >= 0;
            return (
              <div key={t.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full p-2 ${isCredit ? "bg-primary-light" : "bg-surface-raised"}`}>
                    {isCredit ? (
                      <ArrowDownLeft className="h-4 w-4 text-primary-dark" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-text-secondary" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{TX_LABELS[t.type] || t.type}</p>
                    <p className="text-xs text-text-muted">{formatDateTime(t.createdAt)}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${isCredit ? "text-success" : "text-text-primary"}`}>
                  {isCredit ? "+" : ""}
                  {formatNaira(t.amount.toString())}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Modal open={topUpOpen} onClose={() => setTopUpOpen(false)} title="Top up wallet">
        <form onSubmit={handleTopUp} className="space-y-4">
          <Input
            type="number"
            label="Amount (₦)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={100}
            required
          />
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Continue to pay
          </Button>
        </form>
      </Modal>

      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw to bank">
        <form onSubmit={handleWithdraw} className="space-y-4">
          {!bankAccounts?.length ? (
            <p className="text-sm text-text-secondary">
              Add a bank account from your profile before withdrawing.
            </p>
          ) : (
            <>
              <Select
                label="Bank account"
                options={bankAccounts.map((a) => ({ value: a.id, label: `${a.bankName} — ${a.accountNumber}` }))}
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                placeholder="Select account"
              />
              <Input
                type="number"
                label="Amount (₦)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {error && <p role="alert" className="text-sm text-error">{error}</p>}
              <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!bankAccountId}>
                Request withdrawal
              </Button>
            </>
          )}
        </form>
      </Modal>

      <Modal open={bankTransferOpen} onClose={() => setBankTransferOpen(false)} title="Bank transfer top-up">
        {isLoadingVirtualAccount && <p className="text-sm text-text-secondary">Setting up your account…</p>}
        {virtualAccountError && (
          <p role="alert" className="text-sm text-error">
            {virtualAccountError instanceof ApiError ? virtualAccountError.message : "Something went wrong"}
          </p>
        )}
        {virtualAccount && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Transfer any amount to this account and it lands in your wallet automatically — no need to come back
              and confirm.
            </p>
            <div className="rounded-lg bg-surface-raised p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Account number</span>
                <button
                  onClick={copyAccountNumber}
                  className="flex items-center gap-1 text-sm font-semibold text-primary-dark"
                  aria-label="Copy account number"
                >
                  {virtualAccount.accountNumber}
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Bank</span>
                <span className="text-sm font-medium text-text-primary">{virtualAccount.bankName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Account name</span>
                <span className="text-sm font-medium text-text-primary">{virtualAccount.accountName}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
