"use client";

import { useEffect, useRef, useState } from "react";

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
 *
 * Cached-image race: when the browser already has the image in HTTP cache,
 * the native `load` event fires synchronously during img parsing -- often
 * BEFORE React attaches the onLoad listener -- so the component would be
 * stuck at "loading" forever. We work around it with a ref + useEffect that
 * checks `complete` and `naturalWidth` on mount.
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
  const imgRef = useRef<HTMLImageElement | null>(null);
  const effectiveSrc =
    attempt > 0 ? `${src}${src.includes("?") ? "&" : "?"}_r=${attempt}` : src;

  // Reset state when src changes (e.g. retry, swap to a different image).
  useEffect(() => {
    setState("loading");
  }, [src]);

  // Handle cached images: the load event may have fired before we attached.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth > 0) {
        setState("loaded");
      } else {
        // complete + naturalWidth 0 => decode failed
        setState("error");
      }
    }
  }, [effectiveSrc]);

  function retry() {
    setState("loading");
    setAttempt((a) => a + 1);
  }

  return (
    <div
      className={`relative overflow-hidden ${aspect ?? ""} ${className}`}
      onClick={onClick}
    >
      {state === "loading" ? (
        <div className="absolute inset-0">
          <div className="placeholder absolute inset-0" />
          <div className="shimmer-overlay absolute inset-0" />
          <div className="absolute inset-0 grid place-items-center">
            <span
              className="text-2xl opacity-40"
              style={{ animation: "dear-pulse 1.4s ease-in-out infinite" }}
            >
              {"\u{1F90D}"}
            </span>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            retry();
          }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-cream-100/70 text-ink-400"
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
        ref={imgRef}
        src={effectiveSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={`relative block h-full w-full object-cover transition-opacity duration-500 ${
          state === "loaded" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-3.4-7" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}
