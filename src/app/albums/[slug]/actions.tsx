"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function AlbumActions({
  albumId,
  albumName,
}: {
  albumId: string;
  albumName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

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
    setBusy(true);
    try {
      await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
      router.push("/albums");
      router.refresh();
    } finally {
      setBusy(false);
      setConfirmDel(false);
    }
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-cream-50/60 px-3 py-1.5 text-xs text-ink-700 backdrop-blur transition hover:bg-cream-50/90"
          aria-label="Pilihan album"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          Pilihan
        </button>
        {open ? (
          <div
            role="menu"
            className="glass-strong absolute right-0 top-[calc(100%+8px)] z-30 w-52 rounded-2xl p-1.5 shadow-soft animate-fade-in"
          >
            <button
              onClick={() => {
                setOpen(false);
                setConfirmDel(true);
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-rose-dustier hover:bg-rose-mist/40"
            >
              Hapus album
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDel}
        title={`Hapus album "${albumName}"?`}
        description="Kenangan di dalamnya tidak ikut hilang — hanya keluar dari album ini."
        confirmLabel="Hapus album"
        busy={busy}
        onConfirm={onDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </>
  );
}
