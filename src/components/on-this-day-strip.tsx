"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { mediaUrl } from "@/lib/media-url";
import type { MemoryWithRelations } from "@/lib/queries";

export function OnThisDayStrip() {
  const [items, setItems] = useState<MemoryWithRelations[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/on-this-day")
      .then(
        (r) =>
          r.json() as Promise<{ items: MemoryWithRelations[] }>,
      )
      .then((j) => setItems(j.items ?? []))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass mb-6 overflow-hidden rounded-3xl p-5 shadow-soft sm:p-6"
    >
      <header className="flex items-start justify-between gap-3 pb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400 sm:text-xs">
            di hari yang sama
          </div>
          <h2 className="mt-0.5 font-display text-xl italic leading-tight text-ink-900 sm:text-2xl">
            {items.length === 1
              ? "Sebuah kenangan kembali."
              : "Beberapa kenangan kembali."}
          </h2>
        </div>
        <Link
          href="/on-this-day"
          className="shrink-0 self-center whitespace-nowrap rounded-full bg-cream-50/60 px-3 py-1.5 text-xs text-ink-700 backdrop-blur transition hover:bg-cream-50/90"
        >
          Lihat semua
        </Link>
      </header>

      <div className="hide-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        <AnimatePresence>
          {items.slice(0, 8).map((it) => {
            const first = it.media[0];
            const date = new Date(it.memory.memoryDate);
            const year = date.getUTCFullYear();
            return (
              <motion.div
                key={it.memory.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="shrink-0"
              >
                <Link
                  href={`/memory/${it.memory.id}`}
                  className="block w-36 sm:w-44"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl placeholder frame-soft">
                    {first ? (
                      first.kind === "video" ? (
                        <video
                          src={mediaUrl(first.r2Key)}
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(first.r2Key)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <div className="grid h-full w-full place-items-center text-3xl">
                        🌙
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent p-3">
                      <div className="text-xs font-medium text-cream-50">
                        {year}
                      </div>
                      {it.memory.caption ? (
                        <div className="line-clamp-2 text-xs text-cream-50/85">
                          {it.memory.caption}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
