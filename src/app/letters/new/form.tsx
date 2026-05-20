"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/lib/toast";
import { wibLocalToIso } from "@/lib/wib";

function tomorrowLocal(): string {
  const d = new Date(Date.now() + 24 * 3600 * 1000 + 7 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

export function NewLetterForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [unlocksAt, setUnlocksAt] = useState(tomorrowLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!body.trim() && !title.trim()) {
      setError("Suratnya masih kosong, sayang.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const iso = wibLocalToIso(unlocksAt);
      if (new Date(iso).getTime() <= Date.now()) {
        setError("Pilih tanggal di masa depan.");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, unlocksAt: iso }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Belum bisa disimpan.");
      }
      toast.success("Suratmu sudah terkunci. Sampai jumpa di hari itu.");
      router.push("/letters");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ada yang tidak beres.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="glass overflow-hidden rounded-3xl shadow-soft">
        <div className="border-b border-ink-900/5 px-5 py-3 sm:px-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul surat (opsional)"
            className="w-full bg-transparent font-display text-2xl italic text-ink-900 outline-none placeholder:text-ink-400/60"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Untuk kita yang sedang membaca ini di masa depan…"
          rows={14}
          className="w-full resize-none bg-transparent px-5 py-5 font-serif text-[17px] leading-relaxed text-ink-700 outline-none placeholder:text-ink-400/60 sm:px-6"
        />
      </section>

      <section className="glass space-y-3 rounded-3xl p-5 shadow-soft sm:p-6">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-ink-400">
            Boleh dibuka kapan?
          </label>
          <input
            type="datetime-local"
            value={unlocksAt}
            onChange={(e) => setUnlocksAt(e.target.value)}
            className="w-full rounded-2xl border border-ink-900/10 bg-cream-50 px-4 py-3 outline-none transition focus:border-rose-dusty/40"
          />
          <p className="mt-1.5 text-xs text-ink-400">
            Pilih tanggal di masa depan. Sebelum tanggal itu, surat tetap
            terkunci untuk siapapun yang membuka — termasuk kamu sendiri.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-dusty/30 bg-rose-mist/40 px-4 py-3 text-sm text-ink-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 pb-4">
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
          {saving ? "Mengunci surat…" : "Kunci dan simpan"}
        </button>
      </div>
    </div>
  );
}
