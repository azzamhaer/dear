"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ShareButton } from "@/components/share-button";
import { toast } from "@/lib/toast";

interface Props {
  id: string;
  body: string;
  locked: boolean;
  unlocksAt: number;
  authorName: string;
}

export function LetterView({
  id,
  body,
  locked,
  unlocksAt,
  authorName,
}: Props) {
  const router = useRouter();
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(() => buildCountdown(unlocksAt));

  useEffect(() => {
    if (!locked) return;
    const t = window.setInterval(() => {
      setRemaining(buildCountdown(unlocksAt));
    }, 1000);
    return () => window.clearInterval(t);
  }, [locked, unlocksAt]);

  async function onDelete() {
    setBusy(true);
    try {
      await fetch(`/api/letters/${id}`, { method: "DELETE" });
      toast.info("Suratnya dihapus.");
      router.push("/letters");
      router.refresh();
    } finally {
      setBusy(false);
      setConfirmDel(false);
    }
  }

  return (
    <div className="space-y-4">
      {locked ? (
        <section className="glass overflow-hidden rounded-3xl p-8 text-center shadow-soft sm:p-10">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-mist/70 text-3xl">
            🔒
          </div>
          <h2 className="font-display text-2xl italic text-ink-900">
            Belum waktunya.
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-ink-500">
            Suratnya akan membuka diri sendirinya pada harinya. Sampai saat itu,
            biarkan dia menunggu.
          </p>

          <div className="mx-auto mt-6 grid max-w-xs grid-cols-4 gap-2">
            <CountdownCell value={remaining.days} label="hari" />
            <CountdownCell value={remaining.hours} label="jam" />
            <CountdownCell value={remaining.minutes} label="menit" />
            <CountdownCell value={remaining.seconds} label="detik" />
          </div>
        </section>
      ) : (
        <section className="glass rounded-3xl p-6 shadow-soft sm:p-8">
          <p className="whitespace-pre-wrap font-serif text-[17px] leading-relaxed text-ink-700 sm:text-[18px]">
            {body || (
              <span className="italic text-ink-400">
                Suratnya kosong — tapi mungkin justru itu pesannya.
              </span>
            )}
          </p>
          <div className="mt-6 border-t border-ink-900/5 pt-4 text-right">
            <p className="font-display text-base italic text-ink-700">
              — {authorName}
            </p>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between pb-4">
        <ShareButton kind="letter" refId={id} label="Bagikan" />
        <button
          onClick={() => setConfirmDel(true)}
          disabled={busy}
          className="rounded-full bg-rose-mist/40 px-4 py-2 text-sm text-rose-dustier hover:bg-rose-mist disabled:opacity-60"
        >
          Hapus surat
        </button>
      </div>

      <ConfirmDialog
        open={confirmDel}
        title="Hapus surat ini?"
        description={
          locked
            ? "Surat ini belum sempat dibuka. Yakin mau menghapusnya?"
            : "Surat yang sudah kalian baca ini akan hilang."
        }
        confirmLabel="Hapus"
        busy={busy}
        onConfirm={onDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-cream-100/70 px-2 py-3 text-center">
      <div className="font-display text-2xl italic tabular-nums text-ink-900">
        {String(Math.max(0, value)).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400">
        {label}
      </div>
    </div>
  );
}

function buildCountdown(unlocksAt: number) {
  const ms = Math.max(0, unlocksAt - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds };
}
