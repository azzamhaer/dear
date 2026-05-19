"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadZone, type UploadedItem } from "@/components/upload-zone";
import { MoodPicker } from "@/components/mood-picker";
import { nowWibLocal, wibLocalToIso } from "@/lib/wib";

interface Props {
  albums: Array<{ id: string; name: string }>;
}

export function UploadForm({ albums }: Props) {
  const router = useRouter();
  const [media, setMedia] = useState<UploadedItem[]>([]);
  const [caption, setCaption] = useState("");
  const [useNow, setUseNow] = useState(true);
  const [customDt, setCustomDt] = useState(nowWibLocal());
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [albumId, setAlbumId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (media.length === 0 && !caption.trim()) {
      setError("Tambahkan foto, atau setidaknya beberapa kata.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const memoryDate = useNow
        ? new Date().toISOString()
        : wibLocalToIso(customDt);

      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          caption,
          memoryDate,
          location: location || undefined,
          mood: mood || undefined,
          albumId: albumId || null,
          media: media.map((m) => ({
            r2Key: m.r2Key,
            kind: m.kind,
            mimeType: m.mimeType,
            bytes: m.bytes,
          })),
        }),
      });
      if (!res.ok) throw new Error("Belum bisa disimpan.");
      const j = (await res.json()) as { id: string };
      router.push(`/memory/${j.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ada yang tidak beres.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-5 shadow-soft sm:p-6">
        <UploadZone value={media} onChange={setMedia} />
      </section>

      <section className="glass space-y-5 rounded-3xl p-5 shadow-soft sm:p-6">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
            Cerita kecil
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            placeholder="Apa yang ingin kita kenang dari momen ini?"
            className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 font-serif text-[17px] leading-relaxed outline-none transition focus:border-rose-dusty/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
            Kapan
          </label>
          <label className="mb-2 flex cursor-pointer select-none items-center gap-2.5 rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3">
            <input
              type="checkbox"
              checked={useNow}
              onChange={(e) => setUseNow(e.target.checked)}
              className="h-4 w-4 accent-rose-dusty"
            />
            <span className="text-sm">
              Pakai waktu sekarang (WIB){" "}
              {useNow ? (
                <span className="text-ink-400">— saat ini juga</span>
              ) : null}
            </span>
          </label>
          {!useNow ? (
            <input
              type="datetime-local"
              value={customDt}
              onChange={(e) => setCustomDt(e.target.value)}
              className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
            />
          ) : null}
        </div>

        <Field label="Tempat (opsional)">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Dimana kenangan ini tercipta?"
            className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
          />
        </Field>

        <Field label="Suasana hati (opsional)">
          <MoodPicker value={mood} onChange={setMood} />
        </Field>

        {albums.length > 0 ? (
          <Field label="Album (opsional)">
            <select
              value={albumId}
              onChange={(e) => setAlbumId(e.target.value)}
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
          {saving ? "Menyimpan…" : "Simpan kenangan"}
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
