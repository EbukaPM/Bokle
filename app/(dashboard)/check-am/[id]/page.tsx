"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MessageCircle, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { StatusBadge, VerifiedBadge, CheckAmTag } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { api, ApiError } from "@/lib/fetcher";
import { formatDateTime, formatNaira } from "@/lib/utils";
import type { ServiceRequest, ServiceCategory, ProviderProfile, User, Report } from "@prisma/client";

type RequestDetail = ServiceRequest & {
  category: ServiceCategory;
  assignedProvider: (ProviderProfile & { user: Pick<User, "id" | "fullName" | "avatarUrl"> }) | null;
  reports: Report[];
};

export default function CheckAmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: () => api.get<{ request: RequestDetail }>(`/api/v1/requests/${id}`).then((d) => d.request),
  });

  async function handleConfirm() {
    setIsActing(true);
    setActionError(null);
    try {
      await api.post(`/api/v1/requests/${id}/confirm`);
      queryClient.invalidateQueries({ queryKey: ["request", id] });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancel() {
    setIsActing(true);
    try {
      await api.delete(`/api/v1/requests/${id}`);
      router.push("/check-am");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong");
      setIsActing(false);
    }
  }

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    setIsActing(true);
    try {
      await api.post(`/api/v1/requests/${id}/dispute`, { reason: disputeReason });
      setDisputeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["request", id] });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading) return <p className="text-text-secondary">Loading…</p>;
  if (!request) return <p className="text-error">Request not found.</p>;

  const report = request.reports?.[0];
  const answers = (report?.clientQuestionsAnswers as { question: string; answer: string }[] | null) || [];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <CheckAmTag className="mb-2" />
          <h1 className="text-2xl font-bold text-text-primary">{request.category.name}</h1>
          <p className="text-text-secondary">{request.serviceAddress}</p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <Card className="border-l-4 border-premium">
        <CardContent className="space-y-2">
          <Row label="Visit date" value={formatDateTime(request.preferredDate)} />
          {request.reportDeadline && <Row label="Report deadline" value={formatDateTime(request.reportDeadline)} />}
          <Row label="Price" value={formatNaira(request.quotedPrice?.toString() || "0")} />
          {request.subjectDescription && <Row label="Description" value={request.subjectDescription} />}
        </CardContent>
      </Card>

      {request.clientQuestions.length > 0 && !report && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-text-primary">Your questions for the checker</h2>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
              {request.clientQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {request.assignedProvider && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Your checker</h2>
            <Link href={`/messages/${id}`} className="flex items-center gap-1 text-sm text-primary-dark font-medium">
              <MessageCircle className="h-4 w-4" /> Message
            </Link>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
              {request.assignedProvider.user.fullName[0]}
            </span>
            <div>
              <p className="font-medium text-text-primary">{request.assignedProvider.user.fullName}</p>
              <VerifiedBadge />
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <Card className="border-l-4 border-premium">
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-premium-dark">Check Am report</h2>
            <a
              href={`/api/v1/requests/${id}/report/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-premium-dark font-medium"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.overallAssessment && <Row label="Overall assessment" value={report.overallAssessment} />}

            {answers.length > 0 && (
              <div className="space-y-2">
                {answers.map((qa, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-text-primary">{qa.question}</p>
                    <p className="text-sm text-text-secondary">{qa.answer}</p>
                  </div>
                ))}
              </div>
            )}

            {report.notes && <p className="text-sm text-text-secondary">{report.notes}</p>}

            {report.isConcernFlagged && (
              <p className="text-sm font-medium text-error">⚠ The checker flagged a concern on this visit.</p>
            )}

            <p className="text-sm text-text-muted">{report.photoUrls.length} photo(s) attached</p>
          </CardContent>
        </Card>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-error">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {(request.status === "report_submitted" || request.status === "completed") && (
          <Button variant="premium" onClick={handleConfirm} isLoading={isActing}>
            Confirm & release payment
          </Button>
        )}
        {request.status === "open" && (
          <Button variant="ghost" onClick={handleCancel} isLoading={isActing}>
            Cancel request
          </Button>
        )}
        {!["cancelled", "refunded", "disputed"].includes(request.status) && (
          <Button variant="danger" onClick={() => setDisputeOpen(true)}>
            Raise a dispute
          </Button>
        )}
      </div>

      <Modal open={disputeOpen} onClose={() => setDisputeOpen(false)} title="Raise a dispute">
        <form onSubmit={handleDispute} className="space-y-4">
          <Textarea label="What went wrong?" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} required />
          <Button type="submit" className="w-full" isLoading={isActing}>
            Submit dispute
          </Button>
        </form>
      </Modal>
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
