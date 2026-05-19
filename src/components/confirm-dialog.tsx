"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, hapus",
  cancelLabel = "Batal",
  destructive = true,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, busy, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-ink-900/30 p-4 backdrop-blur-sm"
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-sm rounded-3xl p-6 shadow-soft"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-rose-mist/70 text-xl">
              {destructive ? "🥺" : "💭"}
            </div>
            <h3
              id="confirm-title"
              className="text-center font-display text-2xl italic text-ink-900"
            >
              {title}
            </h3>
            {description ? (
              <p className="mx-auto mt-2 max-w-xs text-center text-sm text-ink-500">
                {description}
              </p>
            ) : null}
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={onCancel}
                disabled={busy}
                className="rounded-full bg-ink-900/[0.05] px-5 py-2.5 text-sm text-ink-700 transition hover:bg-ink-900/10 disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={
                  destructive
                    ? "rounded-full bg-rose-dustier px-5 py-2.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-rose-dusty disabled:opacity-50"
                    : "rounded-full bg-ink-900 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-50"
                }
              >
                {busy ? "Sebentar…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
