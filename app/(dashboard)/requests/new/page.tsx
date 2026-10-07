"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { api, ApiError } from "@/lib/fetcher";
import { formatNaira } from "@/lib/utils";
import type { ServiceCategory, SavedSubject } from "@prisma/client";

export default function NewRequestPage() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("weekly");
  const [specialInstructions, setSpecialInstructions] = useState("");
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

  const selectedCategory = categories?.find((c) => c.id === categoryId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { request } = await api.post<{ request: { id: string } }>("/api/v1/requests", {
        requestType: "general",
        categoryId,
        subjectId: subjectId || undefined,
        serviceAddress,
        preferredDate,
        preferredTime: preferredTime || undefined,
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        specialInstructions: specialInstructions || undefined,
      });
      router.push(`/requests/${request.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Post a service request</h1>

      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Select
              label="What do you need help with?"
              placeholder="Select a category"
              options={(categories || []).map((c) => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            />

            {!!subjects?.length && (
              <Select
                label="Who / what is this for? (optional)"
                placeholder="Myself"
                options={subjects.map((s) => ({ value: s.id, label: s.label || s.name || s.subjectType }))}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              />
            )}

            <Textarea
              label="Service address"
              value={serviceAddress}
              onChange={(e) => setServiceAddress(e.target.value)}
              placeholder="Full address or landmark"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="Preferred date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
              />
              <Input
                type="time"
                label="Preferred time (optional)"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Make this a recurring booking
            </label>

            {isRecurring && (
              <Select
                label="Recurrence"
                options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ]}
                value={recurrencePattern}
                onChange={(e) => setRecurrencePattern(e.target.value)}
              />
            )}

            <Textarea
              label="Special instructions (optional)"
              maxLength={500}
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
            />

            {selectedCategory && (
              <div className="rounded-lg bg-surface-raised p-3 text-sm">
                <span className="text-text-secondary">Estimated price: </span>
                <span className="font-semibold text-text-primary">
                  {formatNaira(selectedCategory.baseFee.toString())}
                </span>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!categoryId || !serviceAddress || !preferredDate}>
              Confirm and pay from wallet
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
