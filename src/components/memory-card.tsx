"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import type { MemoryWithRelations } from "@/lib/queries";
import { moodEmoji, moodLabel } from "@/lib/utils";
import { formatWibDisplay } from "@/lib/wib";
import { mediaUrl } from "@/lib/media-url";
import { Avatar } from "./avatar";
import { Lightbox } from "./lightbox";
import { CommentsInline } from "./comments-inline";
import { MediaCarousel } from "./media-carousel";

interface Props {
  item: MemoryWithRelations;
  index?: number;
  currentUserId?: string;
}

export function MemoryCard({ item, index = 0, currentUserId }: Props) {
  const { memory, media, author, album, commentCount } = item;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const date =
    memory.memoryDate instanceof Date
      ? memory.memoryDate
      : new Date((memory.memoryDate as unknown as number) * 1000);

  const lightboxImages = media.map((m) => ({
    url: mediaUrl(m.r2Key),
    kind: m.kind as "image" | "video",
  }));

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.22, 1, 0.36, 1],
          delay: Math.min(index, 6) * 0.05,
        }}
        className="glass overflow-hidden rounded-3xl shadow-card"
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
          <Link
            href={`/profile/${author.username}`}
            className="flex items-center gap-3 -m-1 rounded-full p-1 transition hover:bg-ink-900/[0.03]"
          >
            <Avatar src={author.avatarUrl} name={author.displayName} size={36} />
            <div className="leading-tight">
              <div className="text-sm font-medium text-ink-900">
                {author.displayName}
              </div>
              <div className="text-xs text-ink-400">
                {formatWibDisplay(date)}
                {memory.location ? (
                  <>
                    <span className="mx-1.5">·</span>
                    <span>{memory.location}</span>
                  </>
                ) : null}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {memory.mood ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-mist/60 px-2.5 py-1 text-xs text-ink-700">
                <span>{moodEmoji(memory.mood)}</span>
                <span>{moodLabel(memory.mood)}</span>
              </span>
            ) : null}
            <Link
              href={`/memory/${memory.id}`}
              className="rounded-full p-1.5 text-ink-400 hover:bg-ink-900/5 hover:text-ink-900"
              aria-label="Buka kenangan"
            >
              <DotsIcon className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Media — swipeable carousel */}
        {media.length > 0 && (
          <div className="mt-4 px-3 sm:px-4">
            <MediaCarousel
              media={lightboxImages}
              onOpen={(i) => setLightboxIndex(i)}
              aspect="aspect-[4/5] sm:aspect-[3/4]"
            />
          </div>
        )}

        {/* Caption */}
        {memory.caption ? (
          <p className="px-5 pt-4 font-serif text-[17px] leading-relaxed text-ink-700 sm:px-6 sm:text-[18px]">
            {memory.caption}
          </p>
        ) : null}

        {/* Album tag */}
        {album ? (
          <div className="px-5 pt-3 text-xs text-ink-400 sm:px-6">
            tersimpan di{" "}
            <Link
              href={`/albums/${album.slug}`}
              className="text-ink-700 hover:underline"
            >
              {album.name}
            </Link>
          </div>
        ) : null}

        {/* Comments inline */}
        <div className="border-t border-ink-900/5 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <CommentsInline
            memoryId={memory.id}
            initialCount={commentCount}
            currentUserId={currentUserId}
          />
        </div>
      </motion.article>

      <Lightbox
        open={lightboxIndex !== null}
        images={lightboxImages}
        startIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
