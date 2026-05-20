"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "./avatar";
import { ConfirmDialog } from "./confirm-dialog";
import { formatRelative } from "@/lib/utils";
import { spawnHeartsFromElement } from "@/lib/hearts";
import { toast } from "@/lib/toast";

interface CommentItem {
  id: string;
  body: string;
  createdAt: number | string | Date;
  authorId: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
}

interface Props {
  memoryId: string;
  initialCount: number;
  currentUserId?: string;
  /** When true, fetch and show all comments. Otherwise show last 2 + count. */
  expanded?: boolean;
}

export function CommentsInline({
  memoryId,
  initialCount,
  currentUserId,
  expanded = false,
}: Props) {
  const [items, setItems] = useState<CommentItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState<CommentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAll, setShowAll] = useState(expanded);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memories/${memoryId}/comments`);
      const j = (await res.json()) as { items: CommentItem[] };
      setItems(j.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [memoryId]);

  // Auto-load if expanded or if there are existing comments
  useEffect(() => {
    if (expanded || initialCount > 0) load();
  }, [expanded, initialCount, load]);

  const sendBtnRef = useRef<HTMLButtonElement>(null);

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
        if (sendBtnRef.current) spawnHeartsFromElement(sendBtnRef.current, 5);
      }
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await fetch(`/api/comments/${toDelete.id}`, { method: "DELETE" });
      setItems((prev) => prev?.filter((c) => c.id !== toDelete.id) ?? null);
      setToDelete(null);
      toast.success("Pesan dihapus.");
    } finally {
      setDeleting(false);
    }
  }

  const visible = items
    ? showAll
      ? items
      : items.slice(-2)
    : null;
  const hiddenCount =
    items && !showAll && items.length > 2 ? items.length - 2 : 0;

  return (
    <div className="space-y-3">
      {visible && visible.length > 0 ? (
        <>
          {hiddenCount > 0 ? (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-ink-400 hover:text-ink-700"
            >
              Lihat {hiddenCount} pesan lainnya
            </button>
          ) : null}
          <ul className="space-y-2">
            <AnimatePresence>
              {visible.map((c) => {
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
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="flex items-start gap-2.5"
                  >
                    <Avatar
                      src={c.author.avatarUrl}
                      name={c.author.displayName}
                      size={28}
                    />
                    <div className="flex-1">
                      <div className="rounded-2xl bg-cream-100/70 px-3.5 py-2">
                        <div className="mb-0.5 flex items-baseline justify-between gap-2">
                          <span className="text-xs font-medium text-ink-900">
                            {c.author.displayName}
                          </span>
                          <span className="text-[10px] text-ink-400">
                            {formatRelative(dt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap font-serif text-[14.5px] leading-snug text-ink-700">
                          {c.body}
                        </p>
                      </div>
                      {mine ? (
                        <button
                          onClick={() => setToDelete(c)}
                          className="ml-1 mt-0.5 text-[10px] text-ink-400 hover:text-rose-dustier"
                        >
                          Hapus
                        </button>
                      ) : null}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </>
      ) : items && items.length === 0 && !loading ? (
        <p className="text-xs text-ink-400">
          Belum ada apa-apa di sini. Mulai dari kamu.
        </p>
      ) : !items && initialCount > 0 ? (
        <p className="text-xs text-ink-400">Memuat pesan…</p>
      ) : null}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={1}
          placeholder="Bisikkan sesuatu…"
          onKeyDown={(e) => {
            if (!e.shiftKey && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          className="min-h-[40px] flex-1 resize-none rounded-2xl border border-ink-900/10 bg-cream-50 px-3.5 py-2 font-serif text-[14.5px] leading-snug outline-none transition focus:border-rose-dusty/40"
        />
        <button
          ref={sendBtnRef}
          onClick={send}
          disabled={sending || !draft.trim()}
          className="rounded-2xl bg-ink-900 px-3.5 py-2 text-xs font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 active:scale-[0.96] disabled:opacity-50"
        >
          {sending ? "…" : "Kirim"}
        </button>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus pesan ini?"
        description="Yang sudah ditulis tidak bisa kembali."
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
