import { BadgeCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  matched: "bg-indigo-100 text-indigo-700",
  accepted: "bg-primary-light text-primary-dark",
  en_route: "bg-yellow-100 text-yellow-700",
  on_site: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  report_submitted: "bg-teal-100 text-teal-700",
  confirmed: "bg-green-200 text-green-800",
  disputed: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
  refunded: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  matched: "Matched",
  accepted: "Accepted",
  en_route: "En Route",
  on_site: "On Site",
  completed: "Completed",
  report_submitted: "Report Submitted",
  confirmed: "Confirmed",
  disputed: "Disputed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STATUS_STYLES[status] || "bg-gray-100 text-gray-600",
        className
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-premium px-2.5 py-1 text-xs font-medium text-white",
        className
      )}
      aria-label="Premium Member"
    >
      <Star className="h-3 w-3" aria-hidden="true" /> Premium
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-primary-dark text-xs font-medium", className)}
      aria-label="Verified Provider"
    >
      <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Verified
    </span>
  );
}

export function CheckAmTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-premium-light px-2 py-0.5 text-xs font-semibold text-premium-dark",
        className
      )}
    >
      ✦ Check Am
    </span>
  );
}
