"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Reactions } from "./reactions";
import type { MemoryWithRelations } from "@/lib/queries";
import { moodEmoji, moodLabel } from "@/lib/utils";
import { formatWibDisplay } from "@/lib/wib";
import { mediaUrl } from "@/lib/media-url";

interface Props {
  item: MemoryWithRelations;
  index?: number;
  currentUserId?: string;
}

export function MemoryCard({ item, index = 0, currentUserId }: Props) {
  const { memory, media, author, album } = item;
  const date =
    memory.memoryDate instanceof Date
      ? memory.memoryDate
      : new Date((memory.memoryDate as unknown as number) * 1000);

  return (
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
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-rose-blush to-rose-dusty text-xs font-semibold text-cream-50">
            {author.displayName.charAt(0).toUpperCase()}
          </div>
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
            aria-label="Open memory"
          >
            <DotsIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Media */}
      {media.length > 0 && (
        <div className="mt-4 px-3 sm:px-4">
          <MediaCollage
            media={media.map((m) => ({
              id: m.id,
              kind: m.kind as "image" | "video",
              url: mediaUrl(m.r2Key),
              width: m.width ?? undefined,
              height: m.height ?? undefined,
            }))}
            href={`/memory/${memory.id}`}
          />
        </div>
      )}

      {/* Caption */}
      {memory.caption ? (
        <p className="px-5 pt-4 font-serif text-[17px] leading-relaxed text-ink-700 sm:px-6 sm:text-[18px]">
          {memory.caption}
        </p>
      ) : null}

      {/* Footer */}
      <footer className="flex items-center justify-between gap-3 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <Reactions
          memoryId={memory.id}
          initial={item.reactions}
          currentUserId={currentUserId}
        />
        {album ? (
          <Link
            href={`/albums/${album.slug}`}
            className="text-xs text-ink-400 hover:text-ink-900"
          >
            in {album.name}
          </Link>
        ) : null}
      </footer>
    </motion.article>
  );
}

interface CollageMedia {
  id: string;
  kind: "image" | "video";
  url: string;
  width?: number;
  height?: number;
}

function MediaCollage({
  media,
  href,
}: {
  media: CollageMedia[];
  href: string;
}) {
  const count = media.length;

  if (count === 1) {
    return (
      <Link href={href} className="block">
        <MediaTile m={media[0]} className="aspect-[4/5] sm:aspect-[3/4]" />
      </Link>
    );
  }
  if (count === 2) {
    return (
      <Link href={href} className="grid grid-cols-2 gap-1.5">
        <MediaTile m={media[0]} className="aspect-[3/4]" />
        <MediaTile m={media[1]} className="aspect-[3/4]" />
      </Link>
    );
  }
  if (count === 3) {
    return (
      <Link href={href} className="grid grid-cols-2 gap-1.5">
        <MediaTile m={media[0]} className="row-span-2 aspect-[3/4]" />
        <MediaTile m={media[1]} className="aspect-square" />
        <MediaTile m={media[2]} className="aspect-square" />
      </Link>
    );
  }
  // 4+
  return (
    <Link href={href} className="grid grid-cols-2 gap-1.5">
      {media.slice(0, 4).map((m, i) => (
        <div key={m.id} className="relative">
          <MediaTile m={m} className="aspect-square" />
          {i === 3 && count > 4 ? (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink-900/40 text-2xl font-light text-cream-50 backdrop-blur-sm">
              +{count - 4}
            </div>
          ) : null}
        </div>
      ))}
    </Link>
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
