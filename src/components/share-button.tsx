"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  /** @deprecated Story sharing is currently disabled — prop kept for API
   *  compatibility with existing call sites; ignored at runtime. */
  allowStory?: boolean;
  label?: string;
  className?: string;
}

const EMOJI_SUGGESTIONS = [
  "💗", "🩷", "🤍", "💜", "💛", "💚", "💙",
  "🌸", "🌷", "🌻", "🌼", "🌺", "🪻", "🌹",
  "🐻", "🐰", "🐱", "🐶", "🦋", "🕊️", "🐾",
  "✨", "⭐", "🌟", "🌙", "☁️", "🌈", "💫",
  "🧸", "🍯", "🍪", "🧁", "🍰", "🍓", "🍒",
  "☕", "🍵", "🩰", "📸", "📖", "🕯️", "💌",
];

export function ShareButton({
  kind,
  refId,
  allowComments = false,
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
}

function ShareModal({ open, onClose, kind, refId, allowComments }: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [includeComments, setIncludeComments] = useState(true);
  const [themeId, setThemeId] = useState<string>("dove-rose");
  const [pattern, setPattern] = useState<EmojiPattern>("dense");
  const [customEmojis, setCustomEmojis] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [showLinkSheet, setShowLinkSheet] = useState(false);

  // Track whether configuration changed since last link was made.
  const lastConfigRef = useRef<string>("");
  const configKey = useMemo(
    () =>
      JSON.stringify({
        anonymous,
        includeComments: allowComments ? includeComments : false,
        themeId,
        pattern,
        customEmojis,
      }),
    [anonymous, includeComments, themeId, pattern, customEmojis, allowComments],
  );
  const dirty = !!link && configKey !== lastConfigRef.current;

  const theme = SHARE_THEMES.find((t) => t.id === themeId) ?? SHARE_THEMES[0];
  const effectiveEmojis = customEmojis.length > 0 ? customEmojis : theme.emoji;

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
      setShowLinkSheet(false);
      setBusy(false);
      setAnonymous(false);
      setIncludeComments(true);
      setThemeId("dove-rose");
      setPattern("dense");
      setCustomEmojis([]);
      lastConfigRef.current = "";
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
      lastConfigRef.current = configKey;
      setShowLinkSheet(true);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link tersalin ✨");
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
      toast.success("Link tersalin ✨");
    } catch {
      // Fallback: select the input so user can ⌘C
      toast.info("Tekan Ctrl/⌘ + C untuk menyalin.");
    }
  }

  function nativeShare() {
    if (!link) return;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      navigator
        .share({ url: link, title: "Dear" })
        .catch(() => {});
    } else {
      window.open(link, "_blank", "noopener,noreferrer");
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
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl shadow-soft sm:max-h-[88vh] sm:rounded-3xl"
            style={{ maxHeight: "92dvh" }}
          >
            {/* Drag handle (iOS) */}
            <div className="grid place-items-center pt-2 sm:hidden">
              <span className="h-1 w-9 rounded-full bg-ink-900/15" />
            </div>

            <header className="flex items-center justify-between px-5 pb-3 pt-2 sm:pt-5">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-400">
                  bagikan link
                </div>
                <div className="font-display text-xl italic leading-tight">
                  Atur halamannya.
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup"
                className="grid h-9 w-9 place-items-center rounded-full bg-ink-900/5 text-ink-500 transition hover:bg-ink-900/10 hover:text-ink-900"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <Configurator
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
              />
            </div>

            {/* Sticky primary action — always visible */}
            <footer className="sticky bottom-0 border-t border-ink-900/5 bg-cream-50/85 px-5 py-3 backdrop-blur-md">
              {link && !dirty ? (
                <LinkBar
                  link={link}
                  onCopy={copyAgain}
                  onShare={nativeShare}
                  onOpen={() => setShowLinkSheet(true)}
                />
              ) : (
                <button
                  onClick={generateLink}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3.5 text-sm font-semibold text-cream-50 shadow-soft transition active:scale-[0.98] disabled:opacity-60"
                >
                  {busy ? (
                    <>
                      <SpinnerIcon className="h-4 w-4 animate-spin" />
                      <span>Sebentar…</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-4 w-4" />
                      <span>{dirty ? "Perbarui link" : "Buat link"}</span>
                    </>
                  )}
                </button>
              )}
            </footer>
          </motion.div>

          {/* Link-ready sheet — bigger CTA, prominent copy, toast feedback */}
          <AnimatePresence>
            {link && showLinkSheet ? (
              <LinkReadySheet
                link={link}
                onClose={() => setShowLinkSheet(false)}
                onCopy={copyAgain}
                onShare={nativeShare}
              />
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

function Configurator({
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
}: {
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
}) {
  return (
    <div className="space-y-5 py-2">
      <ThemePreview theme={theme} emojis={effectiveEmojis} pattern={pattern} />

      <div className="space-y-2">
        <ToggleRow
          label="Sembunyikan nama"
          sublabel="Tampil sebagai “Anonim” di halaman publik."
          checked={anonymous}
          onChange={onAnonymous}
        />
        {allowComments ? (
          <ToggleRow
            label="Sertakan komentar"
            sublabel="Tampilkan percakapan kalian."
            checked={includeComments}
            onChange={onIncludeComments}
          />
        ) : null}
      </div>

      <Section title="Tema warna">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
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
        title="Emoji"
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
              Pilih 1–6 · opsional
            </span>
          )
        }
      >
        <EmojiPicker
          customEmojis={customEmojis}
          themeEmojis={theme.emoji}
          onToggle={onToggleEmoji}
        />
      </Section>
    </div>
  );
}

function EmojiPicker({
  customEmojis,
  themeEmojis,
  onToggle,
}: {
  customEmojis: string[];
  themeEmojis: string[];
  onToggle: (e: string) => void;
}) {
  const displayedSelection = customEmojis.length > 0 ? customEmojis : themeEmojis;
  return (
    <div className="rounded-3xl bg-ink-900/[0.035] p-3">
      {/* Selection chip strip — iOS variation tray feel */}
      <div className="mb-3 flex items-center gap-2 px-1 text-[11px] text-ink-500">
        <span className="opacity-70">
          {customEmojis.length === 0 ? "Bawaan tema" : "Pilihanmu"}
        </span>
        <span className="ml-auto tabular-nums opacity-50">
          {customEmojis.length}/6
        </span>
      </div>
      <div className="mb-3 flex min-h-[36px] flex-wrap items-center gap-1.5 rounded-2xl bg-cream-50/80 px-2 py-2">
        {displayedSelection.length === 0 ? (
          <span className="px-2 text-xs italic text-ink-400">
            Belum ada emoji terpilih
          </span>
        ) : (
          displayedSelection.map((e, i) => (
            <span
              key={`${e}-${i}`}
              className="text-[20px] leading-none"
              style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.04))" }}
            >
              {e}
            </span>
          ))
        )}
      </div>

      {/* Picker grid — 7 cols, larger tap targets, rounded selection bubble */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {EMOJI_SUGGESTIONS.map((emoji) => {
          const selected = customEmojis.includes(emoji);
          const disabled = !selected && customEmojis.length >= 6;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onToggle(emoji)}
              disabled={disabled}
              aria-pressed={selected}
              className={[
                "relative grid aspect-square place-items-center rounded-full text-[22px] leading-none transition",
                "active:scale-95",
                selected
                  ? "bg-rose-dusty/35 ring-2 ring-rose-dusty"
                  : disabled
                    ? "opacity-25"
                    : "hover:bg-ink-900/5",
              ].join(" ")}
            >
              <span>{emoji}</span>
            </button>
          );
        })}
      </div>
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
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-2xl bg-ink-900/[0.035] px-4 py-3 transition hover:bg-ink-900/[0.06]">
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
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-rose-dusty" : "bg-ink-900/15"
        }`}
      >
        <span
          className="absolute top-0.5 h-6 w-6 rounded-full bg-cream-50 shadow-soft transition-all duration-200"
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
      className={`relative aspect-square overflow-hidden rounded-2xl transition active:scale-95 ${
        selected
          ? "ring-2 ring-rose-dusty shadow-soft scale-[1.04]"
          : "ring-1 ring-ink-900/5 opacity-90 hover:opacity-100"
      }`}
      style={{ background: theme.bg }}
    >
      {selected ? (
        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-cream-50 text-[11px] text-ink-900 shadow-soft">
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
  // Render every placement at a small scale — no slicing — so the shape of
  // the pattern (frame, rain columns, diagonal lines, spiral, etc.) is
  // recognizable and matches the larger live preview.
  const dots = useMemo(
    () => generateEmojiPlacements(["•"], pattern, 3),
    [pattern],
  );
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`relative overflow-hidden rounded-2xl border bg-cream-50 p-2 text-left transition active:scale-95 ${
        selected
          ? "border-rose-dusty shadow-soft"
          : "border-ink-900/10 hover:bg-cream-100/80"
      }`}
    >
      <div className="relative h-16 overflow-hidden rounded-xl bg-gradient-to-br from-rose-mist/40 to-cream-100/60">
        {dots.map((d, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-rose-dusty"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              // Map source size (14-36) → 2.5-5px so the proportions look
              // like the actual rendered emoji backdrop but tiny.
              width: `${Math.max(2.5, d.size * 0.13)}px`,
              height: `${Math.max(2.5, d.size * 0.13)}px`,
              opacity: d.opacity * 0.95,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 text-center text-[11px] font-medium text-ink-700">
        {label}
      </div>
    </button>
  );
}

function ThemePreview({
  theme,
  emojis,
  pattern,
}: {
  theme: ShareTheme;
  emojis: string[];
  pattern: EmojiPattern;
}) {
  const placements = useMemo(
    () => generateEmojiPlacements(emojis, pattern, 3),
    [emojis, pattern],
  );
  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl ring-1 ring-ink-900/5"
      style={{ background: theme.bg, aspectRatio: "16 / 10" }}
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
          <div className="text-[10px] opacity-70">pratinjau</div>
        </div>
      </div>
    </div>
  );
}

/* ============================ link bar + sheet ============================ */

function LinkBar({
  link,
  onCopy,
  onShare,
  onOpen,
}: {
  link: string;
  onCopy: () => void;
  onShare: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-cream-50 p-1.5 ring-1 ring-ink-900/10">
      <button
        onClick={onOpen}
        className="flex-1 truncate rounded-xl px-3 py-2 text-left text-xs text-ink-700 hover:bg-ink-900/[0.04]"
        title={link}
      >
        {link.replace(/^https?:\/\//, "")}
      </button>
      <button
        onClick={onCopy}
        className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900/[0.05] text-ink-700 transition hover:bg-ink-900/[0.1] active:scale-95"
        aria-label="Salin link"
      >
        <CopyIcon className="h-4 w-4" />
      </button>
      <button
        onClick={onShare}
        className="grid h-9 w-9 place-items-center rounded-xl bg-ink-900 text-cream-50 transition hover:bg-ink-700 active:scale-95"
        aria-label="Bagikan"
      >
        <ShareIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function LinkReadySheet({
  link,
  onClose,
  onCopy,
  onShare,
}: {
  link: string;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
}) {
  // Strip protocol so the displayed URL is short enough to fit in narrow
  // mobile viewports without colliding with the copy button.
  const displayLink = link.replace(/^https?:\/\//, "");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] grid place-items-end bg-ink-900/40 backdrop-blur-sm sm:place-items-center sm:p-4"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative w-full overflow-hidden rounded-t-3xl px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-soft sm:max-w-sm sm:rounded-3xl sm:px-5 sm:pb-6 sm:pt-5"
      >
        {/* Drag handle */}
        <div className="mb-3 grid place-items-center sm:hidden">
          <span className="h-1 w-10 rounded-full bg-ink-900/15" />
        </div>

        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.05,
            }}
            className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-rose-blush to-rose-dusty text-cream-50 shadow-soft sm:h-14 sm:w-14"
          >
            <CheckIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          </motion.div>
          <div className="mt-2.5 text-[10px] uppercase tracking-wider text-ink-400">
            link siap
          </div>
          <h2 className="font-display text-xl italic leading-tight text-ink-900 sm:text-2xl">
            Sudah tersalin.
          </h2>
          <p className="mt-1 max-w-[280px] text-[11.5px] leading-snug text-ink-500 sm:text-xs">
            Tempel di mana saja — siapapun yang punya link bisa buka.
          </p>
        </div>

        {/* URL row — flex with min-w-0 so the link text can truncate without
            pushing the copy button off-screen. Display only the host+path. */}
        <div className="mt-4 flex w-full items-center gap-2 rounded-2xl bg-cream-50 p-1.5 ring-1 ring-ink-900/10">
          <div
            className="flex min-w-0 flex-1 items-center rounded-xl px-3 py-2"
            title={link}
          >
            <span className="block truncate text-[12px] text-ink-700">
              {displayLink}
            </span>
          </div>
          <button
            onClick={onCopy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-900/[0.06] text-ink-700 transition hover:bg-ink-900/[0.12] active:scale-95"
            aria-label="Salin link"
          >
            <CopyIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onCopy}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-ink-900/[0.05] px-3 py-2.5 text-[13px] font-medium text-ink-900 transition hover:bg-ink-900/[0.1] active:scale-[0.98] sm:py-3 sm:text-sm"
          >
            <CopyIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">Salin lagi</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-ink-900 px-3 py-2.5 text-[13px] font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 active:scale-[0.98] sm:py-3 sm:text-sm"
          >
            <ShareIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">Bagikan</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-2.5 w-full rounded-2xl px-4 py-2 text-center text-xs text-ink-500 hover:text-ink-900"
        >
          Tutup
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ============================ icons ============================ */

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 3a9 9 0 0 1 9 9" opacity="0.9" />
      <path d="M12 3a9 9 0 0 0 0 18" opacity="0.25" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07L11 6" />
      <path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07L13 18" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L20 6" />
    </svg>
  );
}

      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07L11 6" />
      <path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07L13 18" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L20 6" />
    </svg>
  );
}
