"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Wallet, Menu } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/fetcher";
import { formatNaira } from "@/lib/utils";
import { PremiumBadge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { usePusherChannel } from "@/hooks/usePusherChannel";
import type { Wallet as WalletType } from "@prisma/client";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.get<{ wallet: WalletType }>("/api/v1/wallet").then((d) => d.wallet),
    enabled: !!user,
  });

  const { data: notifData } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => api.get<{ unreadCount: number }>("/api/v1/notifications"),
    enabled: !!user,
    // 30s fallback per PRD Section 14 — usePusherChannel below refreshes
    // sooner whenever Pusher is configured with live keys.
    refetchInterval: 30_000,
  });

  usePusherChannel(user ? `private-user-${user.id}` : null, "notification", () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  });

  async function handleLogout() {
    await api.post("/api/v1/auth/logout");
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Main navigation">
        <Link href="/dashboard" className="text-xl font-bold text-primary-dark">
          Bokle
        </Link>

        <div className="flex items-center gap-3">
          {user?.membershipTier === "premium" && <PremiumBadge className="hidden sm:inline-flex" />}

          <ThemeToggle />

          <Link
            href="/wallet"
            className="flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-sm font-medium text-primary-dark"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            {wallet ? formatNaira(wallet.availableBalance.toString()) : "₦0.00"}
          </Link>

          <Link href="/notifications" className="relative rounded-full p-2 hover:bg-surface-raised" aria-label="Notifications">
            <Bell className="h-5 w-5 text-text-secondary" />
            {!!notifData?.unreadCount && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] text-white">
                {notifData.unreadCount}
              </span>
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full p-1 hover:bg-surface-raised"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                {user?.fullName?.[0]?.toUpperCase() || "?"}
              </span>
              <Menu className="h-4 w-4 text-text-secondary sm:hidden" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-surface shadow-lg py-1"
              >
                <Link href="/profile" role="menuitem" className="block px-4 py-2 text-sm hover:bg-surface-raised">
                  Profile
                </Link>
                {user?.isAdmin && (
                  <Link href="/admin" role="menuitem" className="block px-4 py-2 text-sm hover:bg-surface-raised">
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-raised"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
