"use client";

import { useState } from "react";
import { Lightbox } from "@/components/lightbox";
import { MediaCarousel } from "@/components/media-carousel";

interface MediaItem {
  url: string;
  kind: "image" | "video";
}

export function MemoryMediaGallery({ media }: { media: MediaItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <MediaCarousel
        media={media}
        onOpen={(i) => setOpenIndex(i)}
        aspect="aspect-[4/5]"
      />

      <Lightbox
        open={openIndex !== null}
        images={media}
        startIndex={openIndex ?? 0}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}
