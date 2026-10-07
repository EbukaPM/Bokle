"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/fetcher";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)));
}

export type PushStatus = "unsupported" | "unconfigured" | "default" | "denied" | "subscribed" | "not-subscribed";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("default");
  const [isLoading, setIsLoading] = useState(false);

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const checkStatus = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (!vapidKey) {
      setStatus("unconfigured");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    const existing = await registration?.pushManager.getSubscription();
    setStatus(existing ? "subscribed" : "not-subscribed");
  }, [vapidKey]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  async function subscribe() {
    if (!vapidKey) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      await api.post("/api/v1/push/subscribe", {
        endpoint: json.endpoint,
        keys: json.keys,
      });

      setStatus("subscribed");
    } finally {
      setIsLoading(false);
    }
  }

  async function unsubscribe() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await api.post("/api/v1/push/unsubscribe", { endpoint: subscription.endpoint });
        await subscription.unsubscribe();
      }
      setStatus("not-subscribed");
    } finally {
      setIsLoading(false);
    }
  }

  return { status, isLoading, subscribe, unsubscribe };
}
