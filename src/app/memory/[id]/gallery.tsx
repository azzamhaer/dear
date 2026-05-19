"use client";

import { useState } from "react";
import { Lightbox } from "@/components/lightbox";

interface MediaItem {
  url: string;
  kind: "image" | "video";
}

export function MemoryMediaGallery({ media }: { media: MediaItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="space-y-4">
        {media.map((m, i) => (
          <figure
            key={i}
            className="cursor-zoom-in overflow-hidden rounded-3xl placeholder frame-soft"
            onClick={() => setOpenIndex(i)}
          >
            {m.kind === "video" ? (
              <video
                src={m.url}
                controls
                playsInline
                className="h-auto w-full"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.url}
                alt=""
                className="h-auto w-full"
                loading="lazy"
              />
            )}
          </figure>
        ))}
      </div>

      <Lightbox
        open={openIndex !== null}
        images={media}
        startIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
