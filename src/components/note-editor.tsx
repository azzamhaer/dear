"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "./confirm-dialog";

interface Note {
  id?: string;
  title: string;
  body: string;
  pinned: boolean;
}

export function NoteEditor({ initial }: { initial?: Note }) {
  const router = useRouter();
  const [note, setNote] = useState<Note>(
    initial ?? { title: "", body: "", pinned: false },
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const lastSaved = useRef(JSON.stringify(initial ?? {}));

  const persist = useCallback(async () => {
    if (!note.id) return;
    const snapshot = JSON.stringify(note);
    if (snapshot === lastSaved.current) return;
    setSaveState("saving");
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          body: note.body,
          pinned: note.pinned,
        }),
      });
      lastSaved.current = snapshot;
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    } catch {
      setSaveState("idle");
    }
  }, [note]);

  useEffect(() => {
    if (!note.id) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(persist, 700);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [note.title, note.body, note.pinned, note.id, persist]);

  async function createNew() {
    setSaveState("saving");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: note.title, body: note.body }),
      });
      const j = (await res.json()) as { id: string };
      router.push(`/notes/${j.id}`);
      router.refresh();
    } catch {
      setSaveState("idle");
    }
  }

  async function remove() {
    if (!note.id) return;
    setDeleting(true);
    try {
      await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      router.push("/notes");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const isNew = !note.id;

  return (
    <div className="space-y-4">
      <section className="glass overflow-hidden rounded-3xl shadow-soft">
        <div className="border-b border-ink-900/5 px-5 py-3 sm:px-6">
          <input
            value={note.title}
            onChange={(e) => setNote({ ...note, title: e.target.value })}
            placeholder="Judul"
            className="w-full bg-transparent font-display text-2xl italic text-ink-900 outline-none placeholder:text-ink-400/60"
          />
        </div>
        <textarea
          value={note.body}
          onChange={(e) => setNote({ ...note, body: e.target.value })}
          placeholder="Tuangkan di sini, sebebas yang kamu mau…"
          rows={18}
          className="w-full resize-none bg-transparent px-5 py-5 font-serif text-[17px] leading-relaxed text-ink-700 outline-none placeholder:text-ink-400/60 sm:px-6"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
        <div className="flex items-center gap-3 text-sm">
          {!isNew ? (
            <>
              <label className="flex cursor-pointer select-none items-center gap-1.5 text-ink-500">
                <input
                  type="checkbox"
                  checked={note.pinned}
                  onChange={(e) =>
                    setNote({ ...note, pinned: e.target.checked })
                  }
                  className="h-4 w-4 accent-rose-dusty"
                />
                <span>Tempel di atas</span>
              </label>
              <span className="text-xs text-ink-400">
                {saveState === "saving"
                  ? "Menyimpan…"
                  : saveState === "saved"
                    ? "Tersimpan"
                    : ""}
              </span>
            </>
          ) : (
            <span className="text-xs text-ink-400">Belum tersimpan</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notes"
            className="rounded-full px-4 py-2 text-sm text-ink-500 hover:text-ink-900"
          >
            ← Kembali
          </Link>
          {isNew ? (
            <button
              onClick={createNew}
              disabled={!note.title.trim() && !note.body.trim()}
              className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
            >
              Simpan catatan
            </button>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              disabled={deleting}
              className="rounded-full bg-rose-mist/40 px-4 py-2 text-sm text-rose-dustier hover:bg-rose-mist disabled:opacity-60"
            >
              Hapus
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDel}
        title="Hapus catatan ini?"
        description="Yang tertulis di sini akan ikut hilang."
        confirmLabel="Hapus"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDel(false)}
      />
    </div>
  );
}
