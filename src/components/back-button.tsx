"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  /** If provided, link to this href. Otherwise router.back(). */
  href?: string;
  label?: string;
  className?: string;
}

/**
 * iOS-style back affordance — left chevron + label, glass-pill,
 * sits inline at top-left of a page.
 */
export function BackButton({ href, label = "Kembali", className = "" }: Props) {
  const router = useRouter();

  const inner = (
    <span className="inline-flex items-center gap-1 leading-none">
      <ChevronLeft className="h-4 w-4" />
      <span className="text-sm font-medium tracking-tight">{label}</span>
    </span>
  );

  const classes = `inline-flex items-center rounded-full bg-cream-50/55 px-2.5 py-1.5 text-ink-700 backdrop-blur-md border border-white/50 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_14px_-8px_rgba(31,26,23,0.18)] transition active:scale-[0.97] hover:bg-cream-50/75 ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={() => router.back()} className={classes}>
      {inner}
    </button>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
