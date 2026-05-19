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
          <div className="flex items-center gap-3">
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
          </div>
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

        {/* Media */}
        {media.length > 0 && (
          <div className="mt-4 px-3 sm:px-4">
            <MediaCollage
              media={lightboxImages}
              onOpen={(i) => setLightboxIndex(i)}
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

interface CollageMedia {
  url: string;
  kind: "image" | "video";
}

function MediaCollage({
  media,
  onOpen,
}: {
  media: CollageMedia[];
  onOpen: (index: number) => void;
}) {
  const count = media.length;

  if (count === 1) {
    return (
      <button
        onClick={() => onOpen(0)}
        className="block w-full"
      >
        <MediaTile m={media[0]} className="aspect-[4/5] sm:aspect-[3/4]" />
      </button>
    );
  }
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {media.map((m, i) => (
          <button key={i} onClick={() => onOpen(i)}>
            <MediaTile m={m} className="aspect-[3/4]" />
          </button>
        ))}
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={() => onOpen(0)} className="row-span-2">
          <MediaTile m={media[0]} className="h-full aspect-[3/4]" />
        </button>
        <button onClick={() => onOpen(1)}>
          <MediaTile m={media[1]} className="aspect-square" />
        </button>
        <button onClick={() => onOpen(2)}>
          <MediaTile m={media[2]} className="aspect-square" />
        </button>
      </div>
    );
  }
  // 4+
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {media.slice(0, 4).map((m, i) => (
        <button key={i} onClick={() => onOpen(i)} className="relative">
          <MediaTile m={m} className="aspect-square" />
          {i === 3 && count > 4 ? (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink-900/40 text-2xl font-light text-cream-50 backdrop-blur-sm">
              +{count - 4}
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function MediaTile({
  m,
  className,
}: {
  m: CollageMedia;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl placeholder frame-soft ${className ?? ""}`}
    >
      {m.kind === "video" ? (
        <video
          src={m.url}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={m.url}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
      {m.kind === "video" && (
        <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-ink-900/55 text-cream-50 backdrop-blur">
          <PlayIcon className="h-3 w-3" />
        </div>
      )}
    </div>
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

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
