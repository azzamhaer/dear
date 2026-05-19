"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface LightboxImage {
  url: string;
  kind: "image" | "video";
}

interface Props {
  open: boolean;
  images: LightboxImage[];
  startIndex?: number;
  onClose: () => void;
}

export function Lightbox({ open, images, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, next, prev, onClose]);

  if (!mounted || !images.length) return null;
  const current = images[Math.max(0, Math.min(index, images.length - 1))];

  const content = (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink-900/92 backdrop-blur-lg"
          onClick={onClose}
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-cream-50/15 text-cream-50 backdrop-blur transition hover:bg-cream-50/25"
          >
            <XIcon className="h-4 w-4" />
          </button>

          {/* Counter */}
          {images.length > 1 ? (
            <div className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-cream-50/15 px-3 py-1 text-xs text-cream-50/90 backdrop-blur">
              {index + 1} / {images.length}
            </div>
          ) : null}

          {/* Prev / Next */}
          {images.length > 1 ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Sebelumnya"
                className="absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-cream-50/15 text-cream-50 backdrop-blur transition hover:bg-cream-50/25 sm:left-6"
              >
                <ChevIcon className="h-4 w-4 -scale-x-100" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Berikutnya"
                className="absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-cream-50/15 text-cream-50 backdrop-blur transition hover:bg-cream-50/25 sm:right-6"
              >
                <ChevIcon className="h-4 w-4" />
              </button>
            </>
          ) : null}

          {/* Media */}
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[88vh] max-w-[92vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {current.kind === "video" ? (
              <video
                src={current.url}
                controls
                autoPlay
                playsInline
                className="max-h-[88vh] max-w-[92vw] rounded-xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.url}
                alt=""
                className="max-h-[88vh] max-w-[92vw] rounded-xl object-contain"
              />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function ChevIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
