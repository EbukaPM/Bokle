"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/fetcher";
import { useAuthStore, SessionUser } from "@/store/authStore";

export function useSession() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const data = await api.get<{ user: SessionUser }>("/api/v1/auth/me");
        return data.user;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    setLoading(query.isLoading);
    if (!query.isLoading) {
      setUser(query.data ?? null);
    }
  }, [query.data, query.isLoading, setUser, setLoading]);

  return { user, isLoading: query.isLoading, refetch: query.refetch };
}
