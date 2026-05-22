"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  PATTERNS,
  SHARE_THEMES,
  generateEmojiPlacements,
  type EmojiPattern,
  type ShareTheme,
} from "@/lib/share-themes";
import { toast } from "@/lib/toast";

interface Props {
  kind: "memory" | "note" | "album" | "letter";
  refId: string;
  allowComments?: boolean;
  allowStory?: boolean;
  label?: string;
  className?: string;
}

type Mode = "pick" | "url" | "story";

const EMOJI_SUGGESTIONS = [
  "💗", "🩷", "🤍", "💜", "💛", "💚", "💙",
  "🌸", "🌷", "🌻", "🌼", "🌺", "🪻",
  "🐻", "🐰", "🐱", "🐶", "🦋", "🕊️",
  "✨", "⭐", "🌟", "🌙", "☁️", "🌈",
  "🧸", "🍯", "🍪", "🧁", "🍰", "🍓",
  "☕", "🍵", "🩰", "📸", "📖", "🕯️",
];

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
  const [themeId, setThemeId] = useState<string>("dove-rose");
  const [pattern, setPattern] = useState<EmojiPattern>("dense");
  const [customEmojis, setCustomEmojis] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const theme = SHARE_THEMES.find((t) => t.id === themeId) ?? SHARE_THEMES[0];
  const effectiveEmojis =
    customEmojis.length > 0 ? customEmojis : theme.emoji;

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
      setMode("pick");
      setLink(null);
      setBusy(false);
      setAnonymous(false);
      setIncludeComments(true);
      setThemeId("dove-rose");
      setPattern("dense");
      setCustomEmojis([]);
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
          emojis: customEmojis.length > 0 ? customEmojis : undefined,
          pattern,
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
        pattern,
      });
      if (customEmojis.length > 0) {
        params.set("emojis", customEmojis.join(""));
      }
      const url = `/api/story/${kind}/${refId}?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`story_failed_${res.status}`);
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("empty_blob");
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `dear-${kind}-${refId.slice(0, 6)}-${themeId}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("Gambar tersimpan. Unggah ke story Instagram-mu.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      toast.error(`Gambar belum bisa dibuat (${msg}).`);
    } finally {
      setBusy(false);
    }
  }

  function toggleEmoji(emoji: string) {
    setCustomEmojis((prev) => {
      if (prev.includes(emoji)) return prev.filter((e) => e !== emoji);
      if (prev.length >= 6) return prev;
      return [...prev, emoji];
    });
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

            <div className="max-h-[72vh] overflow-y-auto">
              {mode === "pick" ? (
                <ModePicker
                  allowStory={allowStory}
                  onPickUrl={() => setMode("url")}
                  onPickStory={() => setMode("story")}
                />
              ) : (
                <Configurator
                  mode={mode}
                  allowComments={allowComments}
                  anonymous={anonymous}
                  onAnonymous={setAnonymous}
                  includeComments={includeComments}
                  onIncludeComments={setIncludeComments}
                  theme={theme}
                  themeId={themeId}
                  onTheme={setThemeId}
                  pattern={pattern}
                  onPattern={setPattern}
                  customEmojis={customEmojis}
                  onToggleEmoji={toggleEmoji}
                  onClearEmojis={() => setCustomEmojis([])}
                  effectiveEmojis={effectiveEmojis}
                  link={link}
                  onCopy={copyAgain}
                />
              )}
            </div>

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
                    <>
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>{link ? "Perbarui link" : "Buat link"}</span>
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-3.5 w-3.5" />
                      <span>Unduh gambar</span>
                    </>
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
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-blush to-rose-dusty text-cream-50 shadow-soft">
          <LinkIcon className="h-5 w-5" />
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
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sand-200 to-rose-blush text-ink-900 shadow-soft">
            <CameraIcon className="h-5 w-5" />
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

function Configurator({
  mode,
  allowComments,
  anonymous,
  onAnonymous,
  includeComments,
  onIncludeComments,
  theme,
  themeId,
  onTheme,
  pattern,
  onPattern,
  customEmojis,
  onToggleEmoji,
  onClearEmojis,
  effectiveEmojis,
  link,
  onCopy,
}: {
  mode: "url" | "story";
  allowComments: boolean;
  anonymous: boolean;
  onAnonymous: (v: boolean) => void;
  includeComments: boolean;
  onIncludeComments: (v: boolean) => void;
  theme: ShareTheme;
  themeId: string;
  onTheme: (id: string) => void;
  pattern: EmojiPattern;
  onPattern: (p: EmojiPattern) => void;
  customEmojis: string[];
  onToggleEmoji: (emoji: string) => void;
  onClearEmojis: () => void;
  effectiveEmojis: string[];
  link: string | null;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <ThemePreview
        theme={theme}
        emojis={effectiveEmojis}
        pattern={pattern}
        aspectRatio={mode === "story" ? "9 / 16" : "16 / 10"}
      />

      <ToggleRow
        label="Sembunyikan nama"
        sublabel={
          mode === "url"
            ? "Tampil sebagai “Anonim” di halaman publik."
            : "Footer gambar pakai “seseorang yang sayang”."
        }
        checked={anonymous}
        onChange={onAnonymous}
      />
      {mode === "url" && allowComments ? (
        <ToggleRow
          label="Sertakan komentar"
          sublabel="Tampilkan percakapan kalian di halaman publik."
          checked={includeComments}
          onChange={onIncludeComments}
        />
      ) : null}

      <Section title="Tema warna">
        <div className="grid grid-cols-4 gap-2">
          {SHARE_THEMES.map((t) => (
            <ThemeChip
              key={t.id}
              theme={t}
              selected={t.id === themeId}
              onClick={() => onTheme(t.id)}
            />
          ))}
        </div>
      </Section>

      <Section title="Pola taburan emoji">
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => (
            <PatternChip
              key={p.id}
              pattern={p.id}
              label={p.label}
              selected={p.id === pattern}
              onClick={() => onPattern(p.id)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Emoji custom"
        right={
          customEmojis.length > 0 ? (
            <button
              onClick={onClearEmojis}
              className="text-[11px] text-ink-400 underline hover:text-ink-700"
            >
              Pakai bawaan tema
            </button>
          ) : (
            <span className="text-[11px] text-ink-400">
              Opsional — pilih 1-6
            </span>
          )
        }
      >
        <div className="rounded-2xl border border-ink-900/10 bg-cream-50 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] text-ink-400">
            <span>
              {customEmojis.length === 0 ? "Pakai bawaan tema:" : "Pilihanmu:"}
            </span>
            <span>{customEmojis.length}/6</span>
          </div>
          <div className="mb-3 flex min-h-[28px] flex-wrap gap-1.5">
            {(customEmojis.length > 0 ? customEmojis : theme.emoji).map(
              (e, i) => (
                <span
                  key={i}
                  className="rounded-full bg-cream-100/80 px-2 py-0.5 text-base"
                >
                  {e}
                </span>
              ),
            )}
          </div>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_SUGGESTIONS.map((emoji) => {
              const selected = customEmojis.includes(emoji);
              const disabled = !selected && customEmojis.length >= 6;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleEmoji(emoji)}
                  disabled={disabled}
                  className={`grid aspect-square place-items-center rounded-lg text-base transition ${
                    selected
                      ? "bg-rose-dusty/50 ring-2 ring-rose-dusty"
                      : disabled
                        ? "opacity-30"
                        : "hover:bg-rose-mist/40"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {mode === "url" && link ? (
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
              className="rounded-xl bg-ink-900 p-2 text-cream-50"
              aria-label="Salin"
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {mode === "story" ? (
        <p className="rounded-2xl bg-cream-100/80 px-4 py-3 text-xs text-ink-500">
          Gambar akan diunduh sebagai PNG 1080×1920. Buka Instagram → Story
          baru → pilih dari galeri.
        </p>
      ) : null}
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wider text-ink-400">
          {title}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

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

function ThemeChip({
  theme,
  selected,
  onClick,
}: {
  theme: ShareTheme;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={theme.label}
      aria-pressed={selected}
      title={theme.label}
      className={`relative overflow-hidden rounded-2xl transition ${
        selected
          ? "ring-2 ring-rose-dusty shadow-soft scale-[1.04]"
          : "ring-1 ring-ink-900/5 opacity-90 hover:opacity-100 hover:scale-[1.02]"
      }`}
      style={{
        background: theme.bg,
        aspectRatio: "1 / 1",
      }}
    >
      {selected ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/35 to-transparent py-1 text-center text-[9px] uppercase tracking-wider text-cream-50">
          ✓
        </span>
      ) : null}
    </button>
  );
}

function PatternChip({
  pattern,
  label,
  selected,
  onClick,
}: {
  pattern: EmojiPattern;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const dots = useMemo(
    () =>
      generateEmojiPlacements(["•", "•", "•", "•"], pattern, 2).slice(0, 22),
    [pattern],
  );
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`relative overflow-hidden rounded-2xl border bg-cream-50 p-2 text-left transition ${
        selected
          ? "border-rose-dusty shadow-soft"
          : "border-ink-900/10 hover:bg-cream-100/80"
      }`}
    >
      <div className="relative h-14 overflow-hidden rounded-xl bg-rose-mist/30">
        {dots.map((d, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${d.x}%`,
              top: `${d.y}%`,
              fontSize: 8 + d.size * 0.3,
              opacity: d.opacity,
              color: "#D4A5A5",
              transform: "translate(-50%, -50%)",
            }}
          >
            ●
          </span>
        ))}
      </div>
      <div className="mt-1 text-center text-[11px] font-medium text-ink-700">
        {label}
      </div>
    </button>
  );
}

function ThemePreview({
  theme,
  emojis,
  pattern,
  aspectRatio,
}: {
  theme: ShareTheme;
  emojis: string[];
  pattern: EmojiPattern;
  aspectRatio: string;
}) {
  const placements = useMemo(
    () => generateEmojiPlacements(emojis, pattern, 3),
    [emojis, pattern],
  );
  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl ring-1 ring-ink-900/5"
      style={{ background: theme.bg, aspectRatio }}
    >
      <div className="pointer-events-none absolute inset-0">
        {placements.map((p, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: p.size * 0.6,
              opacity: p.opacity,
              transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
      <div className="absolute inset-0 grid place-items-center p-6">
        <div
          className="rounded-2xl px-4 py-3 backdrop-blur-md"
          style={{ background: theme.cardBg, color: theme.storyText }}
        >
          <div className="font-display text-base italic">
            Dear<span style={{ color: theme.accent }}>.</span>
          </div>
          <div className="text-[10px] opacity-70">preview</div>
        </div>
      </div>
    </div>
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

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07L11 6" />
      <path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07L13 18" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h2l2-3h6l2 3h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 20h16" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
