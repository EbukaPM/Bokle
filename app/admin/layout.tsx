"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  AlertTriangle,
  Wallet,
  Settings,
  UserCog,
  Megaphone,
  GraduationCap,
} from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Logo } from "@/components/layout/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  { href: "/admin/providers", label: "Providers", icon: UserCog },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/finances", label: "Finances", icon: Wallet },
  { href: "/admin/training", label: "Training", icon: GraduationCap },
  { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useSession();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden md:block w-56 border-r border-border bg-surface p-4">
        <Link href="/admin" className="block mb-6">
          <Logo size={26} href={null} />
          <span className="block mt-1 text-xs font-semibold uppercase tracking-wide text-text-muted">Admin</span>
        </Link>
        <nav aria-label="Admin navigation" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium min-h-[44px]",
                  isActive ? "bg-primary-light text-primary-dark" : "text-text-secondary hover:bg-surface-raised"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/dashboard" className="mt-6 block text-sm text-text-muted">
          ← Back to app
        </Link>
        <div className="mt-2">
          <ThemeToggle />
        </div>
      </aside>

      <nav
        aria-label="Admin navigation"
        className="md:hidden flex overflow-x-auto border-b border-border bg-surface px-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex-shrink-0 px-3 py-3 text-sm font-medium whitespace-nowrap min-h-[44px]",
                isActive ? "text-primary-dark border-b-2 border-primary" : "text-text-secondary"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
