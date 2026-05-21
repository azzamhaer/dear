"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SHARE_THEMES, type ShareTheme } from "@/lib/share-themes";
import { toast } from "@/lib/toast";

interface Props {
  kind: "memory" | "note" | "album" | "letter";
  refId: string;
  /** Show "include comments" toggle? Only relevant for memory. */
  allowComments?: boolean;
  /** Show IG Story option? */
  allowStory?: boolean;
  label?: string;
  className?: string;
}

type Mode = "pick" | "url" | "story";

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
  const [mode, setMode] = useState<Mode>("pick");
  const [anonymous, setAnonymous] = useState(false);
  const [includeComments, setIncludeComments] = useState(true);
  const [themeId, setThemeId] = useState("rose");
  const [busy, setBusy] = useState(false);
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
      // reset state when closed
      setMode("pick");
      setLink(null);
      setBusy(false);
      setAnonymous(false);
      setIncludeComments(true);
      setThemeId("rose");
    }
  }, [open]);

  async function generateLink() {
    setBusy(true);
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
      setBusy(false);
    }
  }

  async function copyAgain() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Disalin lagi.");
    } catch {}
  }

  async function downloadStory() {
    setBusy(true);
    try {
      const params = new URLSearchParams({
        theme: themeId,
        anonymous: anonymous ? "1" : "0",
      });
      const url = `/api/story/${kind}/${refId}?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("story_failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `dear-${kind}-${refId.slice(0, 6)}-${themeId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Gambar tersimpan. Unggah ke story Instagram-mu.");
    } catch {
      toast.error("Gambar belum bisa dibuat. Coba lagi.");
    } finally {
      setBusy(false);
    }
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
          className="fixed inset-0 z-[9998] grid place-items-end bg-ink-900/40 p-0 backdrop-blur-md sm:place-items-center sm:p-4"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-md overflow-hidden rounded-t-3xl shadow-soft sm:rounded-3xl"
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-ink-900/5 px-5 py-4">
              <div className="flex items-center gap-2">
                {mode !== "pick" ? (
                  <button
                    onClick={() => {
                      setMode("pick");
                      setLink(null);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
                    aria-label="Kembali"
                  >
                    <ChevLeftIcon className="h-4 w-4" />
                  </button>
                ) : null}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-400">
                    bagikan
                  </div>
                  <div className="font-display text-xl italic">
                    {mode === "pick"
                      ? "Mau dibagikan ke mana?"
                      : mode === "url"
                        ? "Link publik."
                        : "Untuk Story."}
                  </div>
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

            {/* Body */}
            <div className="max-h-[72vh] overflow-y-auto">
              {mode === "pick" ? (
                <ModePicker
                  allowStory={allowStory}
                  onPickUrl={() => setMode("url")}
                  onPickStory={() => setMode("story")}
                />
              ) : mode === "url" ? (
                <UrlConfig
                  allowComments={allowComments}
                  anonymous={anonymous}
                  onAnonymous={setAnonymous}
                  includeComments={includeComments}
                  onIncludeComments={setIncludeComments}
                  themeId={themeId}
                  onTheme={setThemeId}
                  link={link}
                  onCopy={copyAgain}
                />
              ) : (
                <StoryConfig
                  anonymous={anonymous}
                  onAnonymous={setAnonymous}
                  themeId={themeId}
                  onTheme={setThemeId}
                />
              )}
            </div>

            {/* Footer actions */}
            {mode !== "pick" ? (
              <footer className="flex items-center justify-end gap-2 border-t border-ink-900/5 px-5 py-4 sm:px-6">
                <button
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm text-ink-500 hover:text-ink-900"
                >
                  Tutup
                </button>
                <button
                  onClick={mode === "url" ? generateLink : downloadStory}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                      <span>Sebentar…</span>
                    </>
                  ) : mode === "url" ? (
                    <span>{link ? "Perbarui link" : "Buat link"}</span>
                  ) : (
                    <span>Unduh gambar</span>
                  )}
                </button>
              </footer>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

/* ============================ step 1: mode picker ============================ */

function ModePicker({
  allowStory,
  onPickUrl,
  onPickStory,
}: {
  allowStory: boolean;
  onPickUrl: () => void;
  onPickStory: () => void;
}) {
  return (
    <div className="space-y-3 p-5 sm:p-6">
      <button
        onClick={onPickUrl}
        className="group flex w-full items-center gap-4 rounded-2xl border border-ink-900/10 bg-cream-50 p-4 text-left transition hover:bg-rose-mist/30"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-blush to-rose-dusty text-2xl shadow-soft">
          🔗
        </div>
        <div className="flex-1">
          <div className="font-display text-lg italic text-ink-900">
            Link publik
          </div>
          <div className="text-xs text-ink-500">
            Halaman bertema yang bisa dibuka siapapun lewat link.
          </div>
        </div>
        <ChevRightIcon className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
      </button>

      {allowStory ? (
        <button
          onClick={onPickStory}
          className="group flex w-full items-center gap-4 rounded-2xl border border-ink-900/10 bg-cream-50 p-4 text-left transition hover:bg-rose-mist/30"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sand-200 to-rose-blush text-2xl shadow-soft">
            📸
          </div>
          <div className="flex-1">
            <div className="font-display text-lg italic text-ink-900">
              Untuk Instagram Story
            </div>
            <div className="text-xs text-ink-500">
              Gambar vertikal 1080×1920 siap diunggah.
            </div>
          </div>
          <ChevRightIcon className="h-4 w-4 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-ink-700" />
        </button>
      ) : null}
    </div>
  );
}

/* ============================ step 2: url config ============================ */

function UrlConfig({
  allowComments,
  anonymous,
  onAnonymous,
  includeComments,
  onIncludeComments,
  themeId,
  onTheme,
  link,
  onCopy,
}: {
  allowComments: boolean;
  anonymous: boolean;
  onAnonymous: (v: boolean) => void;
  includeComments: boolean;
  onIncludeComments: (v: boolean) => void;
  themeId: string;
  onTheme: (id: string) => void;
  link: string | null;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <ToggleRow
        label="Sembunyikan nama"
        sublabel="Tampil sebagai “Anonim” di halaman publik."
        checked={anonymous}
        onChange={onAnonymous}
      />
      {allowComments ? (
        <ToggleRow
          label="Sertakan komentar"
          sublabel="Tampilkan percakapan kalian di halaman publik."
          checked={includeComments}
          onChange={onIncludeComments}
        />
      ) : null}

      <ThemePicker themeId={themeId} onTheme={onTheme} />

      {link ? (
        <div className="space-y-2 rounded-2xl bg-rose-mist/40 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-ink-700">
              Linknya siap
            </div>
            <span className="text-[10px] text-ink-500">tersalin otomatis</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2 text-xs text-ink-700"
            />
            <button
              onClick={onCopy}
              className="rounded-xl bg-ink-900 px-3 py-2 text-xs font-medium text-cream-50"
            >
              Salin
            </button>
          </div>
          <p className="text-[11px] text-ink-500">
            Bisa dibuka tanpa login. Anda bisa hapus link kapan saja.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ============================ step 2: story config ============================ */

function StoryConfig({
  anonymous,
  onAnonymous,
  themeId,
  onTheme,
}: {
  anonymous: boolean;
  onAnonymous: (v: boolean) => void;
  themeId: string;
  onTheme: (id: string) => void;
}) {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <ToggleRow
        label="Sembunyikan nama"
        sublabel="Footer gambar memakai “seseorang yang sayang”."
        checked={anonymous}
        onChange={onAnonymous}
      />
      <ThemePicker themeId={themeId} onTheme={onTheme} large />
      <p className="rounded-2xl bg-cream-100/80 px-4 py-3 text-xs text-ink-500">
        Gambar akan diunduh sebagai file PNG 1080×1920. Buka Instagram → buat
        Story baru → pilih dari galerimu.
      </p>
    </div>
  );
}

/* ============================ shared subcomponents ============================ */

function ToggleRow({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 transition hover:bg-cream-100/60">
      <div className="flex-1">
        <div className="text-sm font-medium text-ink-900">{label}</div>
        {sublabel ? (
          <div className="text-xs text-ink-500">{sublabel}</div>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-rose-dusty" : "bg-ink-900/15"
        }`}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-cream-50 shadow-soft transition-all duration-200"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </label>
  );
}

function ThemePicker({
  themeId,
  onTheme,
  large = false,
}: {
  themeId: string;
  onTheme: (id: string) => void;
  large?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wider text-ink-400">
          Tema tampilan
        </div>
        <div className="text-[10px] text-ink-400">
          {SHARE_THEMES.find((t) => t.id === themeId)?.label}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {SHARE_THEMES.map((t) => (
          <ThemeChip
            key={t.id}
            theme={t}
            selected={t.id === themeId}
            onClick={() => onTheme(t.id)}
            large={large}
          />
        ))}
      </div>
    </div>
  );
}

function ThemeChip({
  theme,
  selected,
  onClick,
  large,
}: {
  theme: ShareTheme;
  selected: boolean;
  onClick: () => void;
  large: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={theme.label}
      aria-pressed={selected}
      className={`relative overflow-hidden rounded-2xl transition ${
        selected
          ? "ring-2 ring-rose-dusty shadow-soft scale-[1.03]"
          : "ring-1 ring-ink-900/5 opacity-90 hover:opacity-100 hover:scale-[1.02]"
      }`}
      style={{
        background: theme.bg,
        aspectRatio: large ? "9 / 16" : "1 / 1",
      }}
    >
      {/* Decorative emoji preview */}
      <span
        className="absolute right-1 top-1 text-xs"
        style={{ opacity: 0.7 }}
      >
        {theme.emoji[0]}
      </span>
      <span
        className="absolute bottom-1 left-1 text-xs"
        style={{ opacity: 0.6 }}
      >
        {theme.emoji[1]}
      </span>
      {selected ? (
        <span
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/40 to-transparent py-1 text-center text-[9px] uppercase tracking-wider"
          style={{ color: theme.wrapperClass.includes("cream") ? "#FBF7F1" : "#FFFCF6" }}
        >
          dipilih
        </span>
      ) : null}
    </button>
  );
}

/* ============================ icons ============================ */

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

function ChevRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function ChevLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 3a9 9 0 0 1 9 9" opacity="0.9" />
      <path d="M12 3a9 9 0 0 0 0 18" opacity="0.25" />
    </svg>
  );
}
