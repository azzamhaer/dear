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
      .then((r) => r.json())
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
      <div className="flex items-end justify-between pb-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-ink-400">
            on this day
          </div>
          <div className="font-display text-2xl italic">
            {items.length === 1 ? "a memory returns." : "memories return."}
          </div>
        </div>
        <Link
          href="/on-this-day"
          className="text-xs text-ink-500 hover:text-ink-900"
        >
          See all →
        </Link>
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        <AnimatePresence>
          {items.slice(0, 8).map((it) => {
            const first = it.media[0];
            const date =
              it.memory.memoryDate instanceof Date
                ? it.memory.memoryDate
                : new Date((it.memory.memoryDate as unknown as number) * 1000);
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
                  className="block w-40 sm:w-44"
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
