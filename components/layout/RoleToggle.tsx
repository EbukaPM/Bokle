"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/fetcher";
import { useRouter } from "next/navigation";

export function RoleToggle() {
  const activeRole = useAuthStore((s) => s.activeRole);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function switchTo(role: "client" | "provider") {
    setError(null);
    if (role === "client") {
      setActiveRole("client");
      router.push("/dashboard");
      return;
    }
    try {
      await api.patch("/api/v1/users/role", { role });
      setActiveRole("provider");
      router.push("/jobs");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const missing = (err.details as { missing?: string[] })?.missing;
        setError(
          missing?.length
            ? `Complete your provider profile first: ${missing.join(", ")}.`
            : "Complete your provider profile to go live."
        );
        router.push("/profile/provider");
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong");
      }
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Switch between client and provider mode"
        className="inline-flex rounded-full border border-border bg-surface-raised p-1"
      >
        <button
          role="tab"
          aria-selected={activeRole === "client"}
          onClick={() => switchTo("client")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            activeRole === "client" ? "bg-primary text-white" : "text-text-secondary"
          )}
        >
          I need help
        </button>
        <button
          role="tab"
          aria-selected={activeRole === "provider"}
          onClick={() => switchTo("provider")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            activeRole === "provider" ? "bg-primary text-white" : "text-text-secondary"
          )}
        >
          I offer help
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
