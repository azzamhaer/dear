"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface GridItem {
  id: string;
  caption: string;
  cover: { url: string; kind: "image" | "video" } | null;
}

export function AlbumGrid({ items }: { items: GridItem[] }) {
  const router = useRouter();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function bulkDelete() {
    setBusy(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`/api/memories/${id}`, { method: "DELETE" }).catch(() => null),
        ),
      );
      exitSelect();
      setConfirmBulk(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const selCount = selected.size;

  return (
    <>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {selectMode ? (
          <>
            <button
              onClick={exitSelect}
              className="rounded-full bg-cream-50/60 px-3 py-1.5 text-xs text-ink-500 backdrop-blur hover:bg-cream-50/90"
            >
              Batal
            </button>
            <div className="text-xs text-ink-500">
              {selCount === 0
                ? "Ketuk kenangan untuk memilih"
                : `${selCount} dipilih`}
            </div>
          </>
        ) : (
          <button
            onClick={() => setSelectMode(true)}
            className="rounded-full bg-cream-50/60 px-3 py-1.5 text-xs text-ink-700 backdrop-blur hover:bg-cream-50/90"
          >
            Pilih kenangan
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {items.map((m) => {
          const isSelected = selected.has(m.id);
          const inner = (
            <div className="relative h-full w-full">
              {m.cover ? (
                m.cover.kind === "video" ? (
                  <>
                    <video
                      src={m.cover.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink-900/55 text-cream-50 backdrop-blur">
                      <PlayIcon className="h-2.5 w-2.5" />
                    </div>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.cover.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                )
              ) : (
                <div className="grid h-full w-full place-items-center text-3xl">
                  🌸
                </div>
              )}
              {m.caption ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <p className="line-clamp-2 text-[11px] leading-tight text-cream-50">
                    {m.caption}
                  </p>
                </div>
              ) : null}
              {selectMode ? (
                <div
                  className={`pointer-events-none absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full border-2 transition ${
                    isSelected
                      ? "border-cream-50 bg-rose-dusty text-cream-50"
                      : "border-cream-50/80 bg-ink-900/30 text-transparent backdrop-blur"
                  }`}
                >
                  {isSelected ? <CheckIcon className="h-3 w-3" /> : null}
                </div>
              ) : null}
              {selectMode && isSelected ? (
                <div className="pointer-events-none absolute inset-0 rounded-xl ring-4 ring-rose-dusty/80" />
              ) : null}
            </div>
          );

          const cls = `group relative aspect-square overflow-hidden rounded-xl placeholder transition`;

          if (selectMode) {
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={`${cls} ${
                  isSelected ? "scale-[0.97]" : "hover:opacity-95"
                }`}
              >
                {inner}
              </button>
            );
          }
          return (
            <Link
              key={m.id}
              href={`/memory/${m.id}`}
              className={`${cls} hover:opacity-95`}
            >
              {inner}
            </Link>
          );
        })}
      </div>

      {/* Floating action bar when selecting */}
      <AnimatePresence>
        {selectMode && selCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 md:bottom-8"
          >
            <div className="glass-strong flex items-center gap-2 rounded-full px-2.5 py-2 shadow-glow">
              <span className="px-3 text-sm text-ink-700">
                {selCount} dipilih
              </span>
              <button
                onClick={() => setConfirmBulk(true)}
                className="rounded-full bg-rose-dustier px-4 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-rose-dusty"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmBulk}
        title={`Hapus ${selCount} kenangan?`}
        description="Yang dihapus tidak akan kembali."
        confirmLabel={`Hapus ${selCount}`}
        busy={busy}
        onConfirm={bulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />
    </>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5v14l11-7z" />
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
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
