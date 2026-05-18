"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function MemoryActions({
  memoryId,
  isAuthor,
}: {
  memoryId: string;
  isAuthor: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/memories/${memoryId}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-1.5 text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
        aria-label="Memory options"
      >
        <DotsIcon className="h-4 w-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpen(false);
            setConfirming(false);
          }}
        >
          <div
            className="glass absolute right-3 top-12 w-48 rounded-2xl p-1.5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/memory/${memoryId}/edit`}
              className="block rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-900/5"
            >
              Edit
            </Link>
            {confirming ? (
              <button
                disabled={deleting}
                onClick={onDelete}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-dustier hover:bg-rose-mist/40"
              >
                {deleting ? "Letting go…" : "Tap again to delete"}
              </button>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                disabled={!isAuthor}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-dustier hover:bg-rose-mist/40 disabled:opacity-40"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
