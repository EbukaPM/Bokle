"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, BellOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/fetcher";
import { formatDateTime, cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { Notification } from "@prisma/client";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const push = usePushNotifications();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ notifications: Notification[]; unreadCount: number }>("/api/v1/notifications"),
  });

  async function markAllRead() {
    await api.patch("/api/v1/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function markRead(id: string) {
    await api.patch(`/api/v1/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        {!!data?.unreadCount && (
          <button onClick={markAllRead} className="text-sm text-primary-dark font-medium">
            Mark all as read
          </button>
        )}
      </div>

      {push.status !== "unsupported" && push.status !== "unconfigured" && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {push.status === "subscribed" ? (
                <BellRing className="h-5 w-5 text-primary-dark flex-shrink-0" />
              ) : (
                <BellOff className="h-5 w-5 text-text-muted flex-shrink-0" />
              )}
              <div>
                <p className="font-medium text-text-primary">Browser push notifications</p>
                <p className="text-sm text-text-secondary">
                  {push.status === "subscribed"
                    ? "Enabled on this device."
                    : push.status === "denied"
                      ? "Blocked — enable notifications for this site in your browser settings."
                      : "Get notified instantly, even when Bokle isn't open."}
                </p>
              </div>
            </div>
            {push.status !== "denied" && (
              <Button
                size="sm"
                variant={push.status === "subscribed" ? "ghost" : "secondary"}
                onClick={push.status === "subscribed" ? push.unsubscribe : push.subscribe}
                isLoading={push.isLoading}
              >
                {push.status === "subscribed" ? "Disable" : "Enable"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!data?.notifications.length && (
        <Card>
          <CardContent className="text-center py-10 flex flex-col items-center gap-2">
            <Bell className="h-6 w-6 text-text-muted" />
            <p className="text-text-secondary">You&apos;re all caught up.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {data?.notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={cn(
              "w-full text-left rounded-xl border border-border p-4",
              n.isRead ? "bg-surface" : "bg-primary-light/40"
            )}
          >
            <p className="font-medium text-text-primary">{n.title}</p>
            {n.body && <p className="text-sm text-text-secondary mt-1">{n.body}</p>}
            <p className="text-xs text-text-muted mt-2">{formatDateTime(n.createdAt)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
