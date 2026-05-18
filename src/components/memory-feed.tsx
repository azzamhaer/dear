"use client";

import { useEffect, useState } from "react";
import { MemoryCard } from "./memory-card";
import { EmptyState } from "./empty-state";
import type { MemoryWithRelations } from "@/lib/queries";

interface Props {
  initial: MemoryWithRelations[];
  currentUserId?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCta?: { href: string; label: string };
}

export function MemoryFeed({
  initial,
  currentUserId,
  emptyTitle = "Nothing here yet",
  emptyDescription = "When you add a memory, it'll bloom right here.",
  emptyCta = { href: "/upload", label: "Add your first memory" },
}: Props) {
  const [items, setItems] = useState(initial);

  // Keep state in sync if a parent revalidation occurs.
  useEffect(() => {
    setItems(initial);
  }, [initial]);

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
    </div>
  );
}
