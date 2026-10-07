"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/fetcher";
import { useAuthStore } from "@/store/authStore";
import { formatDateTime, cn } from "@/lib/utils";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { Message, User } from "@prisma/client";

type MessageWithSender = Message & { sender: Pick<User, "id" | "fullName" | "avatarUrl"> };

export default function MessagesPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["messages", requestId],
    queryFn: () =>
      api.get<{ messages: MessageWithSender[] }>(`/api/v1/messages/${requestId}`).then((d) => d.messages),
    // 10s fallback per PRD Section 14 — usePusherChannel below refreshes
    // immediately whenever Pusher is configured with live keys.
    refetchInterval: 10_000,
  });

  usePusherChannel(requestId ? `private-request-${requestId}` : null, "message", () => {
    queryClient.invalidateQueries({ queryKey: ["messages", requestId] });
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    api.patch(`/api/v1/messages/${requestId}/read`).catch(() => {});
  }, [requestId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setIsSending(true);
    try {
      await api.post(`/api/v1/messages/${requestId}`, { content });
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["messages", requestId] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] max-w-2xl flex-col">
      <h1 className="text-xl font-bold text-text-primary mb-4">Conversation</h1>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1" aria-live="polite">
        {!messages?.length && <p className="text-sm text-text-secondary">No messages yet. Say hello!</p>}
        {messages?.map((m) => {
          const isOwn = m.senderId === currentUser?.id;
          return (
            <div key={m.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-xl px-3 py-2",
                  isOwn ? "bg-primary text-white" : "bg-surface-raised text-text-primary"
                )}
              >
                <p className="text-sm">{m.content}</p>
                <p className={cn("text-[10px] mt-1", isOwn ? "text-primary-light" : "text-text-muted")}>
                  {formatDateTime(m.sentAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-error mt-2">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <label htmlFor="message-input" className="sr-only">
          Type a message
        </label>
        <input
          id="message-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 h-11 rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <Button type="submit" isLoading={isSending} aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
