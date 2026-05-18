"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface UploadedItem {
  r2Key: string;
  kind: "image" | "video";
  mimeType: string;
  bytes: number;
  name: string;
  previewUrl: string;
}

interface Props {
  value: UploadedItem[];
  onChange: (items: UploadedItem[]) => void;
}

export function UploadZone({ value, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      setError(null);
      setUploading(true);

      // Build local previews immediately for instant feedback
      const previews = arr.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      }));

      try {
        const form = new FormData();
        for (const f of arr) form.append("files", f);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? `Upload failed (${res.status})`);
        }
        const j = (await res.json()) as {
          uploaded: Array<{
            r2Key: string;
            kind: "image" | "video";
            mimeType: string;
            bytes: number;
            name: string;
          }>;
        };
        const newItems = j.uploaded.map((u, i) => ({
          ...u,
          previewUrl: previews[i]?.url ?? "",
        }));
        onChange([...value, ...newItems]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Something went wrong uploading.",
        );
        for (const p of previews) URL.revokeObjectURL(p.url);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange],
  );

  function removeAt(i: number) {
    const next = [...value];
    const [removed] = next.splice(i, 1);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={`relative block cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-rose-dusty bg-rose-mist/40"
            : "border-ink-900/10 bg-cream-100/50 hover:bg-cream-100/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) =>
            e.target.files && handleFiles(e.target.files)
          }
        />
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-cream-50 shadow-soft">
          <UploadIcon className="h-5 w-5 text-ink-400" />
        </div>
        <div className="font-display text-lg text-ink-700">
          Drop photos or videos here
        </div>
        <div className="mt-1 text-sm text-ink-400">
          or tap to choose from your library
        </div>
      </label>

      {error ? (
        <div className="rounded-2xl border border-rose-dusty/30 bg-rose-mist/40 px-4 py-3 text-sm text-ink-700">
          {error}
        </div>
      ) : null}

      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl bg-cream-100/60 px-4 py-3 text-sm text-ink-500"
          >
            Uploading…
          </motion.div>
        )}
      </AnimatePresence>

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <AnimatePresence>
            {value.map((it, i) => (
              <motion.li
                key={it.r2Key}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="relative overflow-hidden rounded-2xl"
              >
                <div className="aspect-square w-full placeholder">
                  {it.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={it.previewUrl}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-900/60 text-cream-50 backdrop-blur transition hover:bg-ink-900/80"
                  aria-label="Remove"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 5v12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
