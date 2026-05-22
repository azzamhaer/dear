"use client";

import { useState } from "react";

interface Props {
  src: string;
  alt?: string;
  className?: string;
  eager?: boolean;
  /** Aspect ratio class applied to the wrapper (e.g. "aspect-square") */
  aspect?: string;
  onClick?: () => void;
}

/**
 * Image with shimmer skeleton while loading and graceful fallback if it
 * fails to load (e.g. transient auth race / network blip). Tap to retry.
 */
export function MediaImage({
  src,
  alt = "",
  className = "",
  eager = false,
  aspect,
  onClick,
}: Props) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const effectiveSrc = attempt > 0 ? `${src}${src.includes("?") ? "&" : "?"}_r=${attempt}` : src;

  function retry() {
    setState("loading");
    setAttempt((a) => a + 1);
  }

  return (
    <div
      className={`relative overflow-hidden ${aspect ?? ""} ${className}`}
      onClick={onClick}
    >
      {/* Shimmer skeleton while loading */}
      {state === "loading" ? (
        <div className="absolute inset-0 animate-pulse">
          <div className="placeholder h-full w-full" />
          <div className="shimmer-overlay absolute inset-0" />
        </div>
      ) : null}

      {/* Error fallback */}
      {state === "error" ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            retry();
          }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-cream-100/70 text-ink-400"
          aria-label="Coba muat ulang"
        >
          <RefreshIcon className="h-5 w-5" />
          <span className="text-[10px] uppercase tracking-wider">
            ketuk untuk coba lagi
          </span>
        </button>
      ) : null}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={effectiveSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={`block h-full w-full object-cover transition-opacity duration-500 ${
          state === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3.4-7" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}
