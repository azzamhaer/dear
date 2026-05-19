"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MemoryCard } from "./memory-card";
import { EmptyState } from "./empty-state";
import type { MemoryWithRelations } from "@/lib/queries";

interface Props {
  initial: MemoryWithRelations[];
  currentUserId?: string;
  pageSize?: number;
  /** Optional album scope */
  albumId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCta?: { href: string; label: string };
  /** Disable pagination (used for fixed lists like on-this-day) */
  paginate?: boolean;
}

export function MemoryFeed({
  initial,
  currentUserId,
  pageSize = 10,
  albumId,
  emptyTitle = "Belum ada apa-apa.",
  emptyDescription = "Saat kamu menyimpan satu kenangan, dia akan muncul di sini.",
  emptyCta = { href: "/upload", label: "Tambah yang pertama" },
  paginate = true,
}: Props) {
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(
    paginate && initial.length >= pageSize,
  );
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Track ids we've already added to avoid duplicates from refresh + scroll race
  const knownIds = useRef(new Set(initial.map((i) => i.memory.id)));

  // Keep state in sync if parent revalidates
  useEffect(() => {
    setItems(initial);
    knownIds.current = new Set(initial.map((i) => i.memory.id));
    setHasMore(paginate && initial.length >= pageSize);
  }, [initial, paginate, pageSize]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String(items.length),
      });
      if (albumId) params.set("albumId", albumId);
      const res = await fetch(`/api/memories?${params}`);
      if (!res.ok) {
        setHasMore(false);
        return;
      }
      const j = (await res.json()) as { items: MemoryWithRelations[] };
      const fresh = (j.items ?? []).filter(
        (it) => !knownIds.current.has(it.memory.id),
      );
      for (const it of fresh) knownIds.current.add(it.memory.id);
      setItems((prev) => [...prev, ...fresh]);
      if (!j.items || j.items.length < pageSize) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [albumId, hasMore, items.length, loading, pageSize]);

  // IntersectionObserver on sentinel
  useEffect(() => {
    if (!paginate || !hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px 600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, paginate]);

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        cta={emptyCta}
      />
    );
  }

  return (
    <div className="space-y-5">
      {items.map((it, i) => (
        <MemoryCard
          key={it.memory.id}
          item={it}
          index={i}
          currentUserId={currentUserId}
        />
      ))}

      {paginate && hasMore ? (
        <div ref={sentinelRef} className="py-6 text-center">
          {loading ? (
            <div className="inline-flex items-center gap-2 text-sm text-ink-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-dusty" />
              <span>memuat kenangan…</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="rounded-full bg-ink-900/[0.05] px-4 py-2 text-xs text-ink-500 hover:bg-ink-900/[0.08]"
            >
              muat lebih banyak
            </button>
          )}
        </div>
      ) : items.length > 6 && paginate ? (
        <p className="py-6 text-center text-xs text-ink-400">
          sampai di sini dulu, sayang.
        </p>
      ) : null}
    </div>
  );
}
