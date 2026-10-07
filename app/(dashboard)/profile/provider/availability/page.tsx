"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/fetcher";
import type { ProviderAvailability } from "@prisma/client";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

interface DaySlot {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_SLOT: DaySlot = { enabled: false, startTime: "09:00", endTime: "17:00" };

export default function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<Record<number, DaySlot>>(() =>
    Object.fromEntries(DAYS.map((d) => [d.value, { ...DEFAULT_SLOT }]))
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: availability } = useQuery({
    queryKey: ["provider", "availability"],
    queryFn: () =>
      api.get<{ availability: ProviderAvailability[] }>("/api/v1/provider/availability").then((d) => d.availability),
  });

  useEffect(() => {
    if (availability) {
      setSlots((prev) => {
        const next = { ...prev };
        for (const day of DAYS) {
          const match = availability.find((a) => a.dayOfWeek === day.value);
          next[day.value] = match
            ? { enabled: true, startTime: match.startTime, endTime: match.endTime }
            : { ...DEFAULT_SLOT };
        }
        return next;
      });
    }
  }, [availability]);

  function updateSlot(day: number, patch: Partial<DaySlot>) {
    setSlots((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const payload = DAYS.filter((d) => slots[d.value].enabled).map((d) => ({
        dayOfWeek: d.value,
        startTime: slots[d.value].startTime,
        endTime: slots[d.value].endTime,
      }));
      await api.put("/api/v1/provider/availability", payload);
      queryClient.invalidateQueries({ queryKey: ["provider", "availability"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <Link href="/profile/provider" className="flex items-center gap-1 text-sm text-text-secondary">
        <ArrowLeft className="h-4 w-4" /> Back to provider profile
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Availability</h1>
      <p className="text-sm text-text-secondary">
        Set the days and hours you&apos;re available. Clients and the job matcher use this to know when to reach you.
      </p>

      <Card>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const slot = slots[day.value];
            return (
              <div key={day.value} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <label className="flex items-center gap-2 w-32 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={(e) => updateSlot(day.value, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className="text-sm font-medium text-text-primary">{day.label}</span>
                </label>
                {slot.enabled && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(day.value, { startTime: e.target.value })}
                      className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
                      aria-label={`${day.label} start time`}
                    />
                    <span className="text-text-muted text-sm">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(day.value, { endTime: e.target.value })}
                      className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
                      aria-label={`${day.label} end time`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      <Button onClick={handleSave} isLoading={isSaving}>
        {saved ? "Saved!" : "Save availability"}
      </Button>
    </div>
  );
}
