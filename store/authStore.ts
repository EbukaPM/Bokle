import { create } from "zustand";

export type ActiveRole = "client" | "provider";

export interface SessionUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  membershipTier: "free" | "premium";
  premiumExpiresAt: string | null;
  isProviderActive: boolean;
  providerVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

interface AuthState {
  user: SessionUser | null;
  activeRole: ActiveRole;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  setActiveRole: (role: ActiveRole) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeRole: "client",
  isLoading: true,
  setUser: (user) => set({ user }),
  setActiveRole: (role) => set({ activeRole: role }),
  setLoading: (isLoading) => set({ isLoading }),
}));
