"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PremiumBadge } from "@/components/ui/Badge";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { NG_STATES } from "@/lib/data/ng-states";
import { api, ApiError } from "@/lib/fetcher";
import { useAuthStore } from "@/store/authStore";
import { formatDate } from "@/lib/utils";
import type { BankAccount } from "@prisma/client";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankError, setBankError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setBio("");
      setState("");
      setLga("");
      setAvatarUrl(user.avatarUrl ? [user.avatarUrl] : []);
    }
  }, [user]);

  const { data: bankAccounts } = useQuery({
    queryKey: ["wallet", "bank-accounts"],
    queryFn: () => api.get<{ accounts: BankAccount[] }>("/api/v1/wallet/bank-accounts").then((d) => d.accounts),
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const { user: updated } = await api.patch<{ user: typeof user }>("/api/v1/users/profile", {
        fullName,
        bio: bio || undefined,
        state: state || undefined,
        lga: lga || undefined,
        avatarUrl: avatarUrl[0] || undefined,
      });
      if (updated) setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddBank(e: React.FormEvent) {
    e.preventDefault();
    setBankError(null);
    try {
      await api.post("/api/v1/wallet/bank-accounts", { bankName, bankCode, accountNumber });
      setBankName("");
      setBankCode("");
      setAccountNumber("");
      queryClient.invalidateQueries({ queryKey: ["wallet", "bank-accounts"] });
    } catch (err) {
      setBankError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
        {user?.membershipTier === "premium" ? (
          <PremiumBadge />
        ) : (
          <Link href="/check-am/upgrade" className="text-sm text-premium-dark font-medium">
            Upgrade to Premium
          </Link>
        )}
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <PhotoUpload photos={avatarUrl} onChange={(p) => setAvatarUrl(p.slice(-1))} min={0} max={1} />
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Textarea label="Bio" maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} />
            <Select label="State" placeholder="Select state" options={NG_STATES} value={state} onChange={(e) => setState(e.target.value)} />
            <Input label="LGA" value={lga} onChange={(e) => setLga(e.target.value)} />
            {error && <p role="alert" className="text-sm text-error">{error}</p>}
            <Button type="submit" isLoading={isSaving}>
              {saved ? "Saved!" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Bank accounts</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {bankAccounts?.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
              <div>
                <p className="font-medium text-text-primary">{a.bankName}</p>
                <p className="text-text-secondary">
                  {a.accountNumber} · {a.accountName}
                </p>
              </div>
            </div>
          ))}
          <form onSubmit={handleAddBank} className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm font-medium text-text-primary">Add a bank account</p>
            <Input label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
            <Input label="Bank code" value={bankCode} onChange={(e) => setBankCode(e.target.value)} required />
            <Input
              label="Account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              maxLength={10}
              required
            />
            {bankError && <p role="alert" className="text-sm text-error">{bankError}</p>}
            <Button type="submit" variant="secondary" size="sm">
              Add account
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link href="/profile/provider" className="block text-primary-dark font-medium">
        Manage provider profile →
      </Link>

      {user?.premiumExpiresAt && (
        <p className="text-sm text-text-muted">Premium active until {formatDate(user.premiumExpiresAt)}</p>
      )}
    </div>
  );
}
