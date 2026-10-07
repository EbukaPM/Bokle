"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuthStore } from "@/store/authStore";
import { api, ApiError } from "@/lib/fetcher";
import { formatNaira } from "@/lib/utils";
import type { ServiceCategory, SavedSubject } from "@prisma/client";

interface Row {
  categoryId: string;
  subjectId: string;
  serviceAddress: string;
  preferredDate: string;
}

const EMPTY_ROW: Row = { categoryId: "", subjectId: "", serviceAddress: "", preferredDate: "" };

export default function BulkBookingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<Row[]>([{ ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories", "general"],
    queryFn: () => api.get<{ categories: ServiceCategory[] }>("/api/v1/categories/general").then((d) => d.categories),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => api.get<{ subjects: SavedSubject[] }>("/api/v1/subjects").then((d) => d.subjects),
  });

  const priceByCategory = (categoryId: string) => categories?.find((c) => c.id === categoryId)?.baseFee.toString();
  const estimatedTotal = rows.reduce((sum, r) => {
    const price = parseFloat(priceByCategory(r.categoryId) || "0");
    return sum + price;
  }, 0);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  if (!user?.isEnterprise) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <h1 className="text-xl font-bold text-text-primary">Enterprise feature</h1>
        <p className="text-text-secondary mt-2">
          Bulk booking is available to Enterprise accounts. Contact Bokle support to upgrade your account.
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const items = rows.map((r) => ({
        categoryId: r.categoryId,
        subjectId: r.subjectId || undefined,
        serviceAddress: r.serviceAddress,
        preferredDate: r.preferredDate,
      }));
      await api.post("/api/v1/requests/bulk", { items });
      router.push("/requests");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = rows.every((r) => r.categoryId && r.serviceAddress && r.preferredDate);

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/requests" className="flex items-center gap-1 text-sm text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to requests
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Bulk booking</h1>
      <p className="text-sm text-text-secondary">
        Book multiple visits at once — across locations, recipients, or dates.
      </p>

      <div className="space-y-4">
        {rows.map((row, i) => (
          <Card key={i}>
            <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-start">
              <Select
                label="Category"
                placeholder="Select"
                options={(categories || []).map((c) => ({ value: c.id, label: c.name }))}
                value={row.categoryId}
                onChange={(e) => updateRow(i, { categoryId: e.target.value })}
              />
              {!!subjects?.length && (
                <Select
                  label="For (optional)"
                  placeholder="Myself"
                  options={subjects.map((s) => ({ value: s.id, label: s.label || s.name || s.subjectType }))}
                  value={row.subjectId}
                  onChange={(e) => updateRow(i, { subjectId: e.target.value })}
                />
              )}
              <Input
                label="Address"
                value={row.serviceAddress}
                onChange={(e) => updateRow(i, { serviceAddress: e.target.value })}
              />
              <Input
                type="date"
                label="Date"
                value={row.preferredDate}
                onChange={(e) => updateRow(i, { preferredDate: e.target.value })}
              />
              {rows.length > 2 && (
                <button
                  type="button"
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  aria-label={`Remove row ${i + 1}`}
                  className="self-end p-2 text-text-muted hover:text-error"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((rs) => [...rs, { ...EMPTY_ROW }])}
        className="flex items-center gap-1 text-sm text-primary-dark font-medium"
      >
        <Plus className="h-4 w-4" /> Add another booking
      </button>

      <div className="rounded-lg bg-surface-raised p-3 text-sm">
        <span className="text-text-secondary">Estimated total: </span>
        <span className="font-semibold text-text-primary">{formatNaira(estimatedTotal)}</span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      <Button onClick={handleSubmit} isLoading={isSubmitting} disabled={!canSubmit}>
        Confirm all {rows.length} bookings
      </Button>
    </div>
  );
}
