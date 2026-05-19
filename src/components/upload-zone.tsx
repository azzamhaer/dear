"use client";

import { useCallback, useRef, useState } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";

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

interface UploadResponse {
  uploaded: Array<{
    r2Key: string;
    kind: "image" | "video";
    mimeType: string;
    bytes: number;
    name: string;
  }>;
}

function uploadWithProgress(
  formData: FormData,
  onProgress: (pct: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total) * 100);
      }
    });
    xhr.addEventListener("load", () => {
      try {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText) as UploadResponse);
        } else {
          let msg = `Unggahan gagal (${xhr.status})`;
          try {
            const j = JSON.parse(xhr.responseText) as { error?: string };
            if (j.error) msg = j.error;
          } catch {}
          reject(new Error(msg));
        }
      } catch (e) {
        reject(e instanceof Error ? e : new Error("Gagal parse respons"));
      }
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Tidak bisa tersambung")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Dibatalkan")));
    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

export function UploadZone({ value, onChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      setError(null);

      // Validation
      const MAX_BYTES = 50 * 1024 * 1024;
      for (const f of arr) {
        if (!f.type.startsWith("image/")) {
          setError(`File "${f.name}" bukan foto. Hanya file foto yang diperbolehkan.`);
          return;
        }
        if (f.size > MAX_BYTES) {
          setError(`File "${f.name}" terlalu besar (maksimal 50MB).`);
          return;
        }
      }

      setUploading(true);
      setProgress(0);
      setPhase(
        arr.length === 1
          ? `Mengunggah ${arr[0].name}`
          : `Mengunggah ${arr.length} berkas`,
      );

      // Local previews for instant feedback
      const previews = arr.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
      }));

      try {
        const form = new FormData();
        for (const f of arr) form.append("files", f);
        const j = await uploadWithProgress(form, (pct) => {
          setProgress(pct);
          if (pct >= 99) setPhase("Menyelesaikan…");
        });
        const newItems = j.uploaded.map((u, i) => ({
          ...u,
          previewUrl: previews[i]?.url ?? "",
        }));
        onChange([...value, ...newItems]);
        setProgress(100);
      } catch (e) {
        let errMsg = "Ada yang tidak beres saat unggah.";
        if (e instanceof Error) {
          if (e.message.includes("413") || e.message.includes("file_too_large")) errMsg = "Ada berkas yang terlalu besar (maks. 50MB).";
          else if (e.message.includes("415") || e.message.includes("unsupported_type")) errMsg = "Format berkas tidak didukung, pastikan hanya mengunggah foto.";
          else errMsg = e.message;
        }
        setError(errMsg);
        for (const p of previews) URL.revokeObjectURL(p.url);
      } finally {
        // Brief delay so the 100% state is visible
        setTimeout(() => {
          setUploading(false);
          setProgress(0);
          setPhase("");
        }, 400);
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
          accept="image/*"
          className="sr-only"
          onChange={(e) =>
            e.target.files && handleFiles(e.target.files)
          }
        />
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-cream-50 shadow-soft">
          <UploadIcon className="h-5 w-5 text-ink-400" />
        </div>
        <div className="font-display text-lg text-ink-700">
          Letakkan foto di sini
        </div>
        <div className="mt-1 text-sm text-ink-400">
          atau ketuk untuk memilih dari galeri
        </div>
      </label>

      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="glass overflow-hidden rounded-2xl px-4 py-3"
          >
            <div className="flex items-baseline justify-between gap-3 pb-2">
              <span className="truncate text-sm text-ink-700">{phase}</span>
              <span className="text-xs tabular-nums text-ink-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-ink-900/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-blush via-rose-dusty to-rose-dustier shadow-[0_0_10px_rgba(212,165,165,0.5)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <div className="rounded-2xl border border-rose-dusty/30 bg-rose-mist/40 px-4 py-3 text-sm text-ink-700">
          {error}
        </div>
      ) : null}

      {value.length > 0 && (
        <Reorder.Group
          axis="y"
          values={value}
          onReorder={onChange}
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          <AnimatePresence>
            {value.map((it, i) => (
              <Reorder.Item
                key={it.r2Key}
                value={it}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className="relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
              >
                <div className="aspect-square w-full placeholder pointer-events-none">
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
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => removeAt(i)}
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-900/60 text-cream-50 backdrop-blur transition hover:bg-ink-900/80"
                  aria-label="Hapus"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
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
