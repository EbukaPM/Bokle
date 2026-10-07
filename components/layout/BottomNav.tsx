"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Sparkles, Wallet, User, Briefcase, FileText, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const CLIENT_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/check-am", label: "Check Am", icon: Sparkles },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

const PROVIDER_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/jobs?tab=reports", label: "Reports", icon: FileText },
  { href: "/wallet", label: "Earnings", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const activeRole = useAuthStore((s) => s.activeRole);
  const items = activeRole === "provider" ? PROVIDER_ITEMS : CLIENT_ITEMS;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href.split("?")[0];
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[44px]",
              isActive ? "text-primary-dark" : "text-text-muted"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
