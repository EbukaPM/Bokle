import Link from "next/link";
import { useId } from "react";

// A pin + checkmark mark: "verified help, anywhere" — the two ideas at the
// core of Bokle (local services + Help Me Check Am's physical verification).
function LogoMark({ size }: { size: number }) {
  const gradientId = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" role="img">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2FB38C" />
          <stop offset="100%" stopColor="#0F5C48" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
      <path
        d="M24 10c-5.5 0-10 4.3-10 9.7 0 7 10 16.3 10 16.3s10-9.3 10-16.3c0-5.4-4.5-9.7-10-9.7Z"
        fill="#ffffff"
      />
      <path
        d="M17.5 19.6l4.3 4.3 8.7-8.7"
        stroke="#0F5C48"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  href?: string | null;
  iconOnly?: boolean;
  size?: number;
  wordmarkClassName?: string;
  className?: string;
}

export function Logo({ href = "/", iconOnly = false, size = 32, wordmarkClassName = "", className = "" }: LogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {!iconOnly && (
        <span className={`text-xl font-bold text-text-primary ${wordmarkClassName}`}>Bokle</span>
      )}
    </span>
  );

  if (href === null) return content;

  return (
    <Link href={href} aria-label="Bokle home" className="inline-flex items-center">
      {content}
    </Link>
  );
}
