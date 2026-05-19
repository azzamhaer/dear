"use client";

import { useEffect, useRef, useState } from "react";

export interface CarouselMedia {
  url: string;
  kind: "image" | "video";
}

interface Props {
  media: CarouselMedia[];
  /** Click callback: receives the index of the clicked media. */
  onOpen?: (index: number) => void;
  /** Tailwind aspect class, e.g. "aspect-[4/5]" */
  aspect?: string;
  /** When true, fill the available height (used in detail page). */
  contain?: boolean;
}

/**
 * Horizontal scroll-snap carousel for memory media.
 * - Native swipe on mobile, scroll on desktop
 * - Dots indicator + counter for multi-media
 * - Click any tile to trigger onOpen with that index (for lightbox)
 */
export function MediaCarousel({
  media,
  onOpen,
  aspect = "aspect-[4/5]",
  contain = false,
}: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = el.clientWidth;
        if (w === 0) return;
        const i = Math.round(el.scrollLeft / w);
        setIndex((prev) => (prev === i ? prev : i));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  function goTo(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  const count = media.length;
  const single = count === 1;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`hide-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain ${
          contain ? "" : "rounded-2xl"
        }`}
      >
        {media.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onOpen?.(i)}
            className={`block w-full shrink-0 snap-center ${
              onOpen ? "cursor-zoom-in" : "cursor-default"
            }`}
          >
            <MediaTile m={m} aspect={aspect} contain={contain} />
          </button>
        ))}
      </div>

      {/* Counter top-right */}
      {!single ? (
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-ink-900/55 px-2 py-0.5 text-[11px] font-medium text-cream-50 backdrop-blur">
          {index + 1}/{count}
        </div>
      ) : null}

      {/* Desktop chevron arrows */}
      {!single ? (
        <>
          {index > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index - 1);
              }}
              className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-cream-50/70 text-ink-700 shadow-soft backdrop-blur transition hover:bg-cream-50 md:grid"
              aria-label="Sebelumnya"
            >
              <ChevIcon className="h-4 w-4 -scale-x-100" />
            </button>
          ) : null}
          {index < count - 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index + 1);
              }}
              className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-cream-50/70 text-ink-700 shadow-soft backdrop-blur transition hover:bg-cream-50 md:grid"
              aria-label="Berikutnya"
            >
              <ChevIcon className="h-4 w-4" />
            </button>
          ) : null}
        </>
      ) : null}

      {/* Dots */}
      {!single ? (
        <div className="flex items-center justify-center gap-1.5 pt-2.5">
          {media.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Pergi ke foto ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-5 bg-ink-900/80"
                  : "w-1.5 bg-ink-900/20 hover:bg-ink-900/40"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MediaTile({
  m,
  aspect,
  contain,
}: {
  m: CarouselMedia;
  aspect: string;
  contain: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`relative overflow-hidden ${contain ? "" : `${aspect} rounded-2xl placeholder frame-soft`}`}
    >
      {m.kind === "video" ? (
        <video
          src={m.url}
          className={`h-full w-full ${contain ? "object-contain" : "object-cover"}`}
          muted
          playsInline
          controls={contain}
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.url}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full transition-opacity duration-700 ${
            contain ? "object-contain" : "object-cover"
          } ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {m.kind === "video" && !contain && (
        <div className="absolute right-3 bottom-3 grid h-7 w-7 place-items-center rounded-full bg-ink-900/55 text-cream-50 backdrop-blur">
          <PlayIcon className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ChevIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
