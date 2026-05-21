"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SHARE_THEMES } from "@/lib/share-themes";
import { toast } from "@/lib/toast";

interface Props {
  kind: "memory" | "note" | "album" | "letter";
  refId: string;
  /** Show "include comments" toggle? Only relevant for memory. */
  allowComments?: boolean;
  /** Show "Instagram Story" button? Only relevant for memory/album/note (not letter). */
  allowStory?: boolean;
  label?: string;
  className?: string;
}

export function ShareButton({
  kind,
  refId,
  allowComments = false,
  allowStory = false,
  label = "Bagikan",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-full bg-cream-50/60 px-3 py-1.5 text-xs text-ink-700 backdrop-blur transition hover:bg-cream-50/90"
        }
        aria-label="Bagikan"
      >
        <ShareIcon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </button>
      <ShareModal
        open={open}
        onClose={() => setOpen(false)}
        kind={kind}
        refId={refId}
        allowComments={allowComments}
        allowStory={allowStory}
      />
    </>
  );
}

/* ============================ modal ============================ */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  kind: Props["kind"];
  refId: string;
  allowComments: boolean;
  allowStory: boolean;
}

function ShareModal({
  open,
  onClose,
  kind,
  refId,
  allowComments,
  allowStory,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [includeComments, setIncludeComments] = useState(true);
  const [themeId, setThemeId] = useState("rose");
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setLink(null);
      setCreating(false);
    }
  }, [open]);

  async function generate() {
    setCreating(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          refId,
          anonymous,
          includeComments: allowComments ? includeComments : false,
          theme: themeId,
        }),
      });
      if (!res.ok) throw new Error("create_failed");
      const j = (await res.json()) as { id: string };
      const url = `${window.location.origin}/share/${j.id}`;
      setLink(url);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link tersalin.");
      } catch {
        toast.info("Link siap dipakai.");
      }
    } catch {
      toast.error("Belum bisa bikin link. Coba lagi.");
    } finally {
      setCreating(false);
    }
  }

  async function copyAgain() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Disalin lagi.");
    } catch {}
  }

  function openStory() {
    const params = new URLSearchParams({
      theme: themeId,
      anonymous: anonymous ? "1" : "0",
    });
    window.open(`/api/story/${kind}/${refId}?${params}`, "_blank");
  }

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9998] grid place-items-end bg-ink-900/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-md overflow-hidden rounded-t-3xl shadow-soft sm:rounded-3xl"
          >
            <header className="flex items-center justify-between border-b border-ink-900/5 px-5 py-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-400">
                  bagikan
                </div>
                <div className="font-display text-xl italic">
                  Buat link tampilan.
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="grid h-8 w-8 place-items-center rounded-full text-ink-400 hover:bg-ink-900/5 hover:text-ink-700"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </header>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
              {/* Anonymous toggle */}
              <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-ink-900">
                    Sembunyikan nama
                  </div>
                  <div className="text-xs text-ink-500">
                    Tampil sebagai &ldquo;Anonim&rdquo; di tampilan publik.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-rose-dusty"
                />
              </label>

              {/* Include comments (memory only) */}
              {allowComments ? (
                <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-ink-900">
                      Sertakan komentar
                    </div>
                    <div className="text-xs text-ink-500">
                      Tampilkan percakapan kalian di link publik.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeComments}
                    onChange={(e) => setIncludeComments(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-rose-dusty"
                  />
                </label>
              ) : null}

              {/* Theme picker */}
              <div>
                <div className="mb-2 text-xs uppercase tracking-wider text-ink-400">
                  Tema tampilan
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SHARE_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      className={`relative overflow-hidden rounded-2xl border p-3 text-left text-xs transition ${
                        themeId === t.id
                          ? "border-rose-dusty shadow-soft scale-[1.02]"
                          : "border-transparent opacity-80 hover:opacity-100"
                      }`}
                      style={{ background: t.bg }}
                    >
                      <span
                        className="block font-medium"
                        style={{
                          color: t.wrapperClass.includes("cream")
                            ? "#FBF7F1"
                            : "#1F1A17",
                        }}
                      >
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link result */}
              {link ? (
                <div className="space-y-2 rounded-2xl bg-rose-mist/40 px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-ink-700">
                    Linknya siap
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={link}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-xs text-ink-700"
                    />
                    <button
                      onClick={copyAgain}
                      className="rounded-xl bg-ink-900 px-3 py-2 text-xs font-medium text-cream-50"
                    >
                      Salin
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-500">
                    Bisa dibuka tanpa login. Anda bisa hapus link ini kapan saja.
                  </p>
                </div>
              ) : null}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-900/5 px-5 py-4 sm:px-6">
              {allowStory ? (
                <button
                  onClick={openStory}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cream-50/60 px-3 py-2 text-xs text-ink-700 backdrop-blur transition hover:bg-cream-50/90"
                >
                  <span>📸</span>
                  IG Story
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm text-ink-500 hover:text-ink-900"
                >
                  Tutup
                </button>
                <button
                  onClick={generate}
                  disabled={creating}
                  className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
                >
                  {creating ? "Membuat…" : link ? "Perbarui link" : "Buat link"}
                </button>
              </div>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5l7 7-7 7v-4c-5 0-8 2-10 5 0-7 5-10 10-10z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
