"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelative } from "@/lib/utils";

interface CommentItem {
  id: string;
  body: string;
  createdAt: number | string | Date;
  authorId: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
}

interface Props {
  memoryId: string;
  currentUserId?: string;
}

export function Comments({ memoryId, currentUserId }: Props) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/memories/${memoryId}/comments`);
      const j = (await res.json()) as { items: CommentItem[] };
      setItems(j.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [memoryId]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch(`/api/memories/${memoryId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setDraft("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    await fetch(`/api/comments/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <section className="glass rounded-3xl p-5 shadow-soft sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl italic">Conversation</h2>
        {!loading ? (
          <span className="text-xs text-ink-400">
            {items.length} {items.length === 1 ? "note" : "notes"}
          </span>
        ) : null}
      </div>

      <ul className="space-y-3">
        <AnimatePresence>
          {items.map((c) => {
            const dt =
              c.createdAt instanceof Date
                ? c.createdAt
                : new Date(
                    typeof c.createdAt === "number"
                      ? c.createdAt * 1000
                      : c.createdAt,
                  );
            const mine = currentUserId === c.authorId;
            return (
              <motion.li
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="flex gap-3"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-blush to-rose-dusty text-xs font-semibold text-cream-50">
                  {c.author.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="rounded-2xl bg-cream-100/60 px-4 py-3">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <div className="text-sm font-medium text-ink-900">
                        {c.author.displayName}
                      </div>
                      <div className="text-[11px] text-ink-400">
                        {formatRelative(dt)}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap font-serif text-[15.5px] leading-relaxed text-ink-700">
                      {c.body}
                    </p>
                  </div>
                  {mine ? (
                    <div className="mt-1 px-1 text-right">
                      <button
                        onClick={() => remove(c.id)}
                        className="text-[11px] text-ink-400 hover:text-rose-dustier"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      {items.length === 0 && !loading ? (
        <p className="py-3 text-center text-sm text-ink-400">
          No conversation yet — break the silence.
        </p>
      ) : null}

      <div className="mt-5 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Say something soft…"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") send();
          }}
          className="flex-1 resize-none rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 font-serif text-[15.5px] leading-relaxed outline-none transition focus:border-rose-dusty/40"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          className="rounded-2xl bg-ink-900 px-4 py-3 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </section>
  );
}
