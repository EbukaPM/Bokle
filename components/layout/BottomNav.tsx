"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Sparkles, Wallet, User, Briefcase, FileText, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n/translations";

const CLIENT_ITEMS: { href: string; key: TranslationKey; icon: typeof Home }[] = [
  { href: "/dashboard", key: "nav_home", icon: Home },
  { href: "/requests", key: "nav_requests", icon: ClipboardList },
  { href: "/check-am", key: "nav_check_am", icon: Sparkles },
  { href: "/wallet", key: "nav_wallet", icon: Wallet },
  { href: "/profile", key: "nav_profile", icon: User },
];

const PROVIDER_ITEMS: { href: string; key: TranslationKey; icon: typeof Home }[] = [
  { href: "/dashboard", key: "nav_dashboard", icon: Home },
  { href: "/jobs", key: "nav_jobs", icon: Briefcase },
  { href: "/jobs?tab=reports", key: "nav_reports", icon: FileText },
  { href: "/wallet", key: "nav_earnings", icon: TrendingUp },
  { href: "/profile", key: "nav_profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const activeRole = useAuthStore((s) => s.activeRole);
  const { t } = useTranslation();
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
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[44px]",
              isActive ? "text-primary-dark" : "text-text-muted"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px]">{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
