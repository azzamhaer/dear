"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REACTION_DISPLAY, REACTION_EMOJIS } from "@/lib/utils";
import type { Reaction } from "@/db/schema";

interface Props {
  memoryId: string;
  initial: Reaction[];
  currentUserId?: string;
}

export function Reactions({ memoryId, initial, currentUserId }: Props) {
  const [reacts, setReacts] = useState<Reaction[]>(initial);
  const [, startTransition] = useTransition();
  const [popped, setPopped] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of reacts) c[r.emoji] = (c[r.emoji] ?? 0) + 1;
    return c;
  }, [reacts]);

  const mineByEmoji = useMemo(() => {
    const m: Record<string, string | null> = {};
    if (!currentUserId) return m;
    for (const r of reacts) {
      if (r.userId === currentUserId) m[r.emoji] = r.id;
    }
    return m;
  }, [reacts, currentUserId]);

  async function toggle(emoji: string) {
    if (!currentUserId) return;
    const mine = mineByEmoji[emoji];

    // optimistic
    setPopped(emoji);
    setTimeout(() => setPopped(null), 400);
    if (mine) {
      setReacts((prev) => prev.filter((r) => r.id !== mine));
    } else {
      const tempId = `temp-${Math.random().toString(36).slice(2)}`;
      setReacts((prev) => [
        ...prev,
        {
          id: tempId,
          memoryId,
          userId: currentUserId,
          emoji,
          createdAt: new Date(),
        } as unknown as Reaction,
      ]);
    }

    startTransition(async () => {
      try {
        await fetch(`/api/memories/${memoryId}/reactions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
      } catch {
        /* keep optimistic state — will reconcile on refresh */
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {REACTION_EMOJIS.map((e) => {
        const count = counts[e] ?? 0;
        const active = !!mineByEmoji[e];
        return (
          <button
            key={e}
            onClick={() => toggle(e)}
            className={`group relative inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition ${
              active
                ? "bg-rose-mist/70 text-ink-900 shadow-soft"
                : "bg-ink-900/[0.04] text-ink-500 hover:bg-rose-mist/40 hover:text-ink-900"
            }`}
            aria-label={`React with ${e}`}
            aria-pressed={active}
          >
            <span className="text-base leading-none">
              {REACTION_DISPLAY[e]}
            </span>
            {count > 0 ? (
              <span className="text-xs tabular-nums">{count}</span>
            ) : null}
            <AnimatePresence>
              {popped === e && (
                <motion.span
                  initial={{ opacity: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: 1, y: -18, scale: 1.2 }}
                  exit={{ opacity: 0, y: -28 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-lg"
                >
                  {REACTION_DISPLAY[e]}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
