"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { api, ApiError } from "@/lib/fetcher";
import { formatNaira } from "@/lib/utils";
import type { ServiceCategory } from "@prisma/client";

const DEADLINE_OPTIONS = [
  { value: "12", label: "Within 12 hours" },
  { value: "24", label: "Within 24 hours" },
  { value: "48", label: "Within 48 hours" },
  { value: "72", label: "Within 72 hours" },
];

export default function NewCheckAmRequestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);
  const [preferredDate, setPreferredDate] = useState("");
  const [reportDeadlineHours, setReportDeadlineHours] = useState("24");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories", "check_am"],
    queryFn: () => api.get<{ categories: ServiceCategory[] }>("/api/v1/categories/check-am").then((d) => d.categories),
  });

  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const totalSteps = 4;

  function updateQuestion(i: number, value: string) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? value : q)));
  }

  async function onSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const { request } = await api.post<{ request: { id: string } }>("/api/v1/requests", {
        requestType: "check_am",
        categoryId,
        serviceAddress,
        subjectDescription,
        clientQuestions: questions.filter((q) => q.trim().length > 0),
        preferredDate,
        reportDeadlineHours: parseInt(reportDeadlineHours, 10),
        specialInstructions: specialInstructions || undefined,
        referenceFileUrls: [],
      });
      router.push(`/check-am/${request.id}`);
    } catch (err) {
      if (err instanceof ApiError && (err.details as { upgradeRequired?: boolean })?.upgradeRequired) {
        router.push("/check-am/upgrade");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-premium-dark mb-1">Help Me Check Am</h1>
      <p className="text-text-secondary mb-6">Step {step} of {totalSteps}</p>

      <Card className="border-l-4 border-premium">
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <Select
                label="What do you need checked?"
                placeholder="Select a check type"
                options={(categories || []).map((c) => ({ value: c.id, label: c.name }))}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              />
              <Textarea
                label="Describe what/who is being checked"
                value={subjectDescription}
                onChange={(e) => setSubjectDescription(e.target.value)}
                maxLength={1000}
                placeholder="e.g. 2015 Toyota Camry listed on Jiji, seller in Lekki"
              />
              <Textarea
                label="Location of what is to be checked"
                value={serviceAddress}
                onChange={(e) => setServiceAddress(e.target.value)}
                placeholder="Full address or landmark"
              />
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm font-medium text-text-primary">
                What should the checker answer? (up to 10 questions)
              </p>
              {questions.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={q}
                    onChange={(e) => updateQuestion(i, e.target.value)}
                    placeholder={`Question ${i + 1}`}
                    className="flex-1"
                  />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                      aria-label="Remove question"
                      className="p-2 text-text-muted hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {questions.length < 10 && (
                <button
                  type="button"
                  onClick={() => setQuestions((qs) => [...qs, ""])}
                  className="flex items-center gap-1 text-sm text-premium-dark font-medium"
                >
                  <Plus className="h-4 w-4" /> Add question
                </button>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Input
                type="date"
                label="Preferred visit date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
              <Select
                label="Report deadline"
                options={DEADLINE_OPTIONS}
                value={reportDeadlineHours}
                onChange={(e) => setReportDeadlineHours(e.target.value)}
              />
              <Textarea
                label="Anything else the checker should know? (optional)"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                maxLength={500}
              />
            </>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-text-primary">Review & confirm</h2>
              <SummaryRow label="Check type" value={selectedCategory?.name || "—"} />
              <SummaryRow label="Location" value={serviceAddress || "—"} />
              <SummaryRow label="Questions" value={`${questions.filter((q) => q.trim()).length} question(s)`} />
              <SummaryRow label="Deadline" value={`Within ${reportDeadlineHours}h`} />
              {selectedCategory && (
                <div className="rounded-lg bg-premium-light p-3 text-sm">
                  <span className="text-text-secondary">Base fee: </span>
                  <span className="font-semibold text-premium-dark">
                    {formatNaira(selectedCategory.baseFee.toString())}
                  </span>
                  <span className="text-text-muted"> (platform fee added at checkout)</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                variant="premium"
                className="flex-1"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && (!categoryId || !serviceAddress)}
              >
                Continue
              </Button>
            ) : (
              <Button variant="premium" className="flex-1" onClick={onSubmit} isLoading={isSubmitting}>
                Confirm and pay from wallet
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
}
