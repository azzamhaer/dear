"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoodPicker } from "@/components/mood-picker";
import { wibLocalToIso } from "@/lib/wib";

interface Initial {
  caption: string;
  memoryDateLocal: string; // already formatted as WIB datetime-local
  location: string;
  mood: string | null;
  albumId: string;
}

export function EditForm({
  memoryId,
  initial,
  albums,
}: {
  memoryId: string;
  initial: Initial;
  albums: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/memories/${memoryId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caption: v.caption,
          memoryDate: wibLocalToIso(v.memoryDateLocal),
          location: v.location || null,
          mood: v.mood || null,
          albumId: v.albumId || null,
        }),
      });
      if (!res.ok) throw new Error("Belum bisa disimpan.");
      router.push(`/memory/${memoryId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ada yang tidak beres.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass space-y-5 rounded-3xl p-5 shadow-soft sm:p-6">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
            Cerita kecil
          </label>
          <textarea
            value={v.caption}
            onChange={(e) => setV({ ...v, caption: e.target.value })}
            rows={4}
            className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 font-serif text-[17px] leading-relaxed outline-none transition focus:border-rose-dusty/40"
          />
        </div>

        <Field label="Kapan (WIB)">
          <input
            type="datetime-local"
            value={v.memoryDateLocal}
            onChange={(e) => setV({ ...v, memoryDateLocal: e.target.value })}
            className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
          />
        </Field>

        <Field label="Tempat">
          <input
            type="text"
            value={v.location}
            onChange={(e) => setV({ ...v, location: e.target.value })}
            className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
          />
        </Field>

        <Field label="Suasana hati">
          <MoodPicker value={v.mood} onChange={(mood) => setV({ ...v, mood })} />
        </Field>

        {albums.length > 0 ? (
          <Field label="Album">
            <select
              value={v.albumId}
              onChange={(e) => setV({ ...v, albumId: e.target.value })}
              className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
            >
              <option value="">— belum dimasukkan —</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-dusty/30 bg-rose-mist/40 px-4 py-3 text-sm text-ink-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full px-5 py-2.5 text-sm text-ink-500 hover:text-ink-900"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-full bg-ink-900 px-6 py-2.5 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
        {label}
      </label>
      {children}
    </div>
  );
}
