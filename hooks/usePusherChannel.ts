"use client";

import { useEffect } from "react";
import { getPusherClient } from "@/lib/pusher-client";

// Subscribes to a private Pusher channel/event for the lifetime of the
// component. No-ops cleanly when Pusher isn't configured — callers are
// expected to also poll (TanStack Query refetchInterval) as the baseline,
// so this is purely a "refresh sooner" enhancement, never a hard dependency.
export function usePusherChannel(channelName: string | null, event: string, onEvent: (data: unknown) => void) {
  useEffect(() => {
    if (!channelName) return;
    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe(channelName);
    channel.bind(event, onEvent);

    return () => {
      channel.unbind(event, onEvent);
      client.unsubscribe(channelName);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, event]);
}
