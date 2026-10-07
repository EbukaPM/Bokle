"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { StatusBadge, CheckAmTag } from "@/components/ui/Badge";
import { PhotoUpload } from "@/components/common/PhotoUpload";
import { api, ApiError } from "@/lib/fetcher";
import { formatDateTime, formatNaira } from "@/lib/utils";
import type { ServiceRequest, ServiceCategory, User } from "@prisma/client";

type JobDetail = ServiceRequest & { category: ServiceCategory; client: Pick<User, "fullName" | "phone"> };

const NEXT_STATUS: Record<string, { label: string; next: string } | undefined> = {
  accepted: { label: "Mark as en route", next: "en_route" },
  en_route: { label: "Mark as on site", next: "on_site" },
  on_site: { label: "Mark as completed", next: "completed" },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report form state
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [overallAssessment, setOverallAssessment] = useState("");
  const [isConcernFlagged, setIsConcernFlagged] = useState(false);
  const [concernNotes, setConcernNotes] = useState("");

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => api.get<{ request: JobDetail }>(`/api/v1/requests/${id}`).then((d) => d.request),
  });

  const checklistItems = (job?.category.checklistTemplate as { items?: string[] } | null)?.items || [];
  const assessmentOptions =
    (job?.category.checklistTemplate as { overallAssessmentOptions?: string[] } | null)?.overallAssessmentOptions ||
    [];

  async function advanceStatus(next: string) {
    setIsActing(true);
    setError(null);
    try {
      await api.patch(`/api/v1/jobs/${id}/status`, { status: next });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsActing(false);
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setIsActing(true);
    setError(null);
    try {
      await api.post(`/api/v1/jobs/${id}/report`, {
        checklistData: checklist,
        clientQuestionsAnswers: job?.clientQuestions.map((q) => ({ question: q, answer: answers[q] || "" })),
        notes: notes || undefined,
        photoUrls: photos,
        isConcernFlagged,
        concernNotes: isConcernFlagged ? concernNotes : undefined,
        overallAssessment: overallAssessment || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["job", id] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;
  if (!job) return <p className="text-error">Job not found.</p>;

  const nextAction = NEXT_STATUS[job.status];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          {job.requestType === "check_am" && <CheckAmTag className="mb-2" />}
          <h1 className="text-2xl font-bold text-text-primary">{job.category.name}</h1>
          <p className="text-text-secondary">{job.client.fullName}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <Card>
        <CardContent className="space-y-2">
          <Row label="Address" value={job.serviceAddress} />
          <Row label="Date" value={formatDateTime(job.preferredDate)} />
          <Row label="Payout" value={formatNaira(job.providerPayout?.toString() || job.quotedPrice?.toString() || "0")} />
          {job.subjectDescription && <Row label="Details" value={job.subjectDescription} />}
        </CardContent>
      </Card>

      {job.clientQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">Client&apos;s questions</h2>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-text-secondary">
              {job.clientQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Link href={`/messages/${id}`} className="flex items-center gap-1 text-sm text-primary-dark font-medium">
        <MessageCircle className="h-4 w-4" /> Message client
      </Link>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      {nextAction && (
        <Button onClick={() => advanceStatus(nextAction.next)} isLoading={isActing}>
          {nextAction.label}
        </Button>
      )}

      {job.status === "completed" && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">Submit visit report</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitReport} className="space-y-4">
              {checklistItems.map((item: string) => (
                <Textarea
                  key={item}
                  label={item}
                  value={checklist[item] || ""}
                  onChange={(e) => setChecklist((c) => ({ ...c, [item]: e.target.value }))}
                />
              ))}

              {job.clientQuestions.map((q) => (
                <Textarea
                  key={q}
                  label={q}
                  value={answers[q] || ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q]: e.target.value }))}
                />
              ))}

              {assessmentOptions.length > 0 && (
                <Select
                  label="Overall assessment"
                  placeholder="Select an assessment"
                  options={assessmentOptions.map((o: string) => ({ value: o, label: o }))}
                  value={overallAssessment}
                  onChange={(e) => setOverallAssessment(e.target.value)}
                />
              )}

              <Textarea label="Observations" maxLength={1500} value={notes} onChange={(e) => setNotes(e.target.value)} />

              <PhotoUpload photos={photos} onChange={setPhotos} min={job.category.minPhotosRequired} max={job.requestType === "check_am" ? 10 : 5} />

              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={isConcernFlagged}
                  onChange={(e) => setIsConcernFlagged(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Flag a concern on this visit
              </label>
              {isConcernFlagged && (
                <Textarea
                  label="Describe the concern"
                  value={concernNotes}
                  onChange={(e) => setConcernNotes(e.target.value)}
                  required
                />
              )}

              <p className="text-xs text-text-muted">Once submitted, the report is sent to the client immediately.</p>

              <Button
                type="submit"
                className="w-full"
                isLoading={isActing}
                disabled={photos.length < job.category.minPhotosRequired}
              >
                Submit report
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
}
