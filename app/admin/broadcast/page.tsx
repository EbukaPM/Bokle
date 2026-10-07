"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { NG_STATES } from "@/lib/data/ng-states";
import { api, ApiError } from "@/lib/fetcher";

const SEGMENTS = [
  { value: "all", label: "Everyone" },
  { value: "clients", label: "All clients" },
  { value: "providers", label: "All active providers" },
  { value: "premium", label: "Premium members" },
  { value: "unverified_providers", label: "Providers pending verification" },
  { value: "state", label: "Users in a specific state" },
];

export default function AdminBroadcastPage() {
  const [segment, setSegment] = useState("all");
  const [state, setState] = useState("");
  const [channel, setChannel] = useState<"sms" | "email" | "both">("both");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ recipientCount: number; smsSent: number; emailSent: number } | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { data: countData } = useQuery({
    queryKey: ["admin", "broadcast", "count", segment, state],
    queryFn: () =>
      api.get<{ count: number }>(
        `/api/v1/admin/broadcast?segment=${segment}${segment === "state" && state ? `&state=${state}` : ""}`
      ),
    enabled: segment !== "state" || !!state,
  });

  async function handleSend() {
    if (!confirm(`Send this message to ${countData?.count ?? "all matching"} user(s)?`)) return;
    setError(null);
    setResult(null);
    setIsSending(true);
    try {
      const data = await api.post<{ recipientCount: number; smsSent: number; emailSent: number }>(
        "/api/v1/admin/broadcast",
        { segment, state: segment === "state" ? state : undefined, channel, subject: subject || undefined, message }
      );
      setResult(data);
      setMessage("");
      setSubject("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Broadcast Message</h1>
      <p className="text-sm text-text-secondary">Super-admin only. Sends an in-app notification plus SMS/email to everyone in the chosen segment.</p>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Audience</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select label="Segment" options={SEGMENTS} value={segment} onChange={(e) => setSegment(e.target.value)} />
          {segment === "state" && (
            <Select label="State" placeholder="Select state" options={NG_STATES} value={state} onChange={(e) => setState(e.target.value)} />
          )}
          <p className="text-sm text-text-muted">
            {countData ? `${countData.count} recipient(s) match this segment.` : "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-text-primary">Message</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            label="Send via"
            options={[
              { value: "both", label: "SMS + Email" },
              { value: "sms", label: "SMS only" },
              { value: "email", label: "Email only" },
            ]}
            value={channel}
            onChange={(e) => setChannel(e.target.value as "sms" | "email" | "both")}
          />
          {(channel === "email" || channel === "both") && (
            <Input label="Subject (email only)" value={subject} onChange={(e) => setSubject(e.target.value)} />
          )}
          <Textarea label="Message" maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </CardContent>
      </Card>

      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      {result && (
        <Card className="border-success">
          <CardContent className="text-sm text-text-primary">
            Sent to {result.recipientCount} recipient(s) — {result.smsSent} SMS, {result.emailSent} email(s).
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSend} isLoading={isSending} disabled={!message.trim()}>
        <Megaphone className="h-4 w-4" /> Send broadcast
      </Button>
    </div>
  );
}
