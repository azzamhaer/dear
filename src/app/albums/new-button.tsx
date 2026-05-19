"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function NewAlbumButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        const j = (await res.json()) as { slug: string };
        router.push(`/albums/${j.slug}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700"
      >
        + Album baru
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 grid place-items-center bg-ink-900/30 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-md rounded-3xl p-6 shadow-soft"
            >
              <div className="font-display text-xl italic">Album baru.</div>
              <div className="mt-4 space-y-3">
                <input
                  autoFocus
                  placeholder="Nama (misal: Hari Minggu)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
                />
                <textarea
                  placeholder="Sedikit penjelasan (opsional)"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
                />
              </div>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2 text-sm text-ink-500 hover:text-ink-900"
                >
                  Batal
                </button>
                <button
                  onClick={save}
                  disabled={saving || !name.trim()}
                  className="rounded-full bg-ink-900 px-5 py-2 text-sm font-medium text-cream-50 disabled:opacity-60"
                >
                  {saving ? "Membuat…" : "Buat"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
