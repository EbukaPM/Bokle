"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/fetcher";
import type { PlatformSetting } from "@prisma/client";

const FIELD_GROUPS = [
  {
    title: "General Marketplace",
    fields: [
      { key: "general_commission_rate", label: "Commission rate (0–1)", step: "0.01" },
      { key: "min_booking_amount", label: "Minimum booking amount (₦)" },
    ],
  },
  {
    title: "Help Me Check Am",
    fields: [
      { key: "check_am_commission_rate", label: "Commission rate (0–1)", step: "0.01" },
      { key: "report_deadline_options_hours", label: "Deadline options (comma-separated hours)" },
    ],
  },
  {
    title: "Premium Plans",
    fields: [
      { key: "premium_price_monthly", label: "Monthly price (₦)" },
      { key: "premium_price_quarterly", label: "Quarterly price (₦)" },
      { key: "premium_price_annual", label: "Annual price (₦)" },
    ],
  },
  {
    title: "Wallet & Payments",
    fields: [
      { key: "escrow_auto_release_hours", label: "Escrow auto-release window (hours)" },
      { key: "min_withdrawal_amount", label: "Minimum withdrawal amount (₦)" },
      { key: "withdrawal_fee", label: "Withdrawal fee (₦)" },
      { key: "min_wallet_topup", label: "Minimum wallet top-up (₦)" },
    ],
  },
];

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: PlatformSetting[] }>("/api/v1/admin/settings").then((d) => d.settings),
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;
      setValues(map);
    }
  }, [settings]);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const updates = Object.entries(values).map(([key, value]) => ({ key, value }));
      await api.patch("/api/v1/admin/settings", { updates });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Platform Settings</h1>
      <p className="text-sm text-text-secondary">Super-admin only. All changes are logged with your admin ID and timestamp.</p>

      {FIELD_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">{group.title}</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.fields.map((f) => (
              <Input
                key={f.key}
                label={f.label}
                type={f.step ? "number" : "text"}
                step={f.step}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {error && <p role="alert" className="text-sm text-error">{error}</p>}

      <Button onClick={handleSave} isLoading={isSaving}>
        {saved ? "Saved!" : "Save all settings"}
      </Button>
    </div>
  );
}
