"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { TOAST_EVENT, type ToastPayload } from "@/lib/toast";

const ICONS: Record<string, string> = {
  success: "✨",
  info: "💗",
  error: "🥺",
};

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onEvent = (e: Event) => {
      const ce = e as CustomEvent<ToastPayload>;
      const t = ce.detail;
      setToasts((prev) => [...prev, t]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration ?? 2400);
    };
    window.addEventListener(TOAST_EVENT, onEvent as EventListener);
    return () => {
      window.removeEventListener(TOAST_EVENT, onEvent as EventListener);
    };
  }, []);

  if (!mounted) return null;

  const content = (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[10001] flex flex-col items-center gap-2 px-4 sm:top-auto sm:bottom-6"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm text-ink-700 shadow-soft"
          >
            <span className="text-base leading-none">
              {ICONS[t.kind] ?? "💗"}
            </span>
            <span className="font-medium">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return createPortal(content, document.body);
}
