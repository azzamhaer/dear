"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function MemoryDetail({
  memoryId,
  canEdit,
}: {
  memoryId: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    <>
      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full p-1.5 text-ink-500 transition hover:bg-ink-900/5 hover:text-ink-900"
          aria-label="Pilihan kenangan"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <DotsIcon className="h-4 w-4" />
        </button>
        {open ? (
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 8,
              width: 180,
              zIndex: 50,
            }}
            className="glass-strong rounded-2xl p-1.5 shadow-soft animate-fade-in"
          >
            <Link
              href={`/memory/${memoryId}/edit`}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-900/5"
            >
              Ubah
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmDel(true);
              }}
              disabled={!canEdit}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-dustier hover:bg-rose-mist/40 disabled:opacity-40"
            >
              Hapus
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDel}
        title="Hapus kenangan ini?"
        description="Setelah dihapus, dia tidak akan kembali. Kita tidak bisa membaliknya."
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </>
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
