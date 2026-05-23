"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { type ShareTheme, type ShareOptions } from "@/lib/share-themes";
import { formatWibDisplay } from "@/lib/wib";
import { formatRelative } from "@/lib/utils";
import { EmojiBackdrop } from "@/components/emoji-backdrop";
import { MediaImage } from "@/components/media-image";

interface SharedMemory {
  type: "memory";
  memory: {
    id: string;
    caption: string;
    memoryDate: number | string | Date;
    location: string | null;
  };
  media: Array<{ id: string; r2Key: string; kind: string }>;
  author: { displayName: string; avatarUrl: string | null } | null;
  comments: Array<{
    id: string;
    body: string;
    createdAt: number | string | Date;
    authorName: string;
    authorAvatar: string | null;
  }>;
}

interface SharedNote {
  type: "note";
  note: { id: string; title: string; body: string; updatedAt: number | string | Date };
  author: { displayName: string } | null;
}

interface SharedAlbum {
  type: "album";
  album: { id: string; name: string; description: string | null };
  memories: Array<{ id: string; caption: string; coverKey: string | null }>;
}

interface SharedLetter {
  type: "letter";
  letter: { id: string; title: string; body: string };
  locked: boolean;
  unlocksAt: number;
  author: { displayName: string } | null;
}

type SharedContent =
  | SharedMemory
  | SharedNote
  | SharedAlbum
  | SharedLetter;

interface Props {
  theme: ShareTheme;
  kind: string;
  shareId: string;
  options: ShareOptions;
  children: SharedContent;
}

export function ShareView({ theme, shareId, options, children }: Props) {
  const emojis = options.emojis && options.emojis.length > 0
    ? options.emojis
    : theme.emoji;
  const pattern = options.pattern ?? "scattered";

  return (
    <div
      className={`relative min-h-dvh ${theme.wrapperClass}`}
      style={{ background: theme.bg }}
    >
      {/* Floating decorative emojis — dense pattern */}
      <EmojiBackdrop emojis={emojis} pattern={pattern} />

      <div className="relative mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Top brand — minimal, no "dibagikan" badge */}
        <header className="mb-6 flex items-center justify-center">
          <Link
            href="/"
            className="font-display text-2xl italic"
            style={{
              color: theme.textClass.includes("cream") ? "#FBF7F1" : "#1F1A17",
            }}
          >
            Dear<span style={{ color: theme.accent }}>.</span>
          </Link>
        </header>

        {/* Content */}
        {children.type === "memory" ? (
          <MemoryView data={children} theme={theme} shareId={shareId} />
        ) : children.type === "note" ? (
          <NoteView data={children} theme={theme} />
        ) : children.type === "album" ? (
          <AlbumView data={children} theme={theme} shareId={shareId} />
        ) : (
          <LetterView data={children} theme={theme} />
        )}
      </div>
    </div>
  );
}

/** Rewrite a privately-served avatar URL to the public avatar proxy
 *  so anonymous viewers don't get 401'd. */
function publicAvatar(src: string | null): string | null {
  if (!src) return src;
  if (src.startsWith("/api/media/")) {
    return "/api/avatar/" + src.slice("/api/media/".length);
  }
  return src;
}

/* ============================ memory ============================ */

function MemoryView({
  data,
  theme,
  shareId,
}: {
  data: SharedMemory;
  theme: ShareTheme;
  shareId: string;
}) {
  const date =
    data.memory.memoryDate instanceof Date
      ? data.memory.memoryDate
      : new Date(
          typeof data.memory.memoryDate === "number"
            ? data.memory.memoryDate * 1000
            : data.memory.memoryDate,
        );

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl pb-5 shadow-xl sm:pb-6"
      style={{ background: theme.cardBg, backdropFilter: "blur(20px)" }}
    >
      {/* Author + date strip (compact, like Instagram) */}
      <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        {data.author ? (
          <>
            <AvatarOrInitial
              src={publicAvatar(data.author.avatarUrl)}
              name={data.author.displayName}
              accent={theme.accent}
            />
            <div className="leading-tight">
              <div className="text-sm font-medium">{data.author.displayName}</div>
              <div className="text-xs opacity-60">{formatWibDisplay(date)}</div>
            </div>
          </>
        ) : (
          <>
            <div
              className="grid h-9 w-9 place-items-center rounded-full text-base"
              style={{ background: theme.accent + "30", color: theme.accent }}
            >
              🤍
            </div>
            <div className="leading-tight">
              <div className="text-sm font-medium">Anonim</div>
              <div className="text-xs opacity-60">{formatWibDisplay(date)}</div>
            </div>
          </>
        )}
      </header>

      {/* Caption as the headline — big italic serif sitting ABOVE the photo */}
      {data.memory.caption ? (
        <h1 className="px-5 pt-4 font-display text-[26px] italic leading-[1.15] sm:px-6 sm:text-[32px]">
          {data.memory.caption}
        </h1>
      ) : null}
      {data.memory.location ? (
        <p className="px-5 pt-2 text-xs opacity-60 sm:px-6">
          <span style={{ color: theme.accent }}>◆</span> {data.memory.location}
        </p>
      ) : null}

      {data.media.length > 0 ? (
        <div className="mt-5 px-3 sm:px-4">
          <div className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl">
            {data.media.map((m, i) => (
              <div key={m.id} className="w-full shrink-0 snap-center">
                {m.kind === "video" ? (
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                    <video
                      src={`/api/share-public/${shareId}/${m.r2Key}`}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <MediaImage
                    src={`/api/share-public/${shareId}/${m.r2Key}`}
                    aspect="aspect-[4/5]"
                    className="rounded-2xl"
                    eager={i <= 1}
                  />
                )}
              </div>
            ))}
          </div>
          {data.media.length > 1 ? (
            <div className="mt-2 text-center text-xs opacity-60">
              ← geser untuk melihat semua ({data.media.length}) →
            </div>
          ) : null}
        </div>
      ) : null}

      {data.comments.length > 0 ? (
        <div className="mt-5 border-t border-current/10 px-5 pt-4 sm:px-6">
          <h3 className="mb-3 text-xs uppercase tracking-wider opacity-60">
            Percakapan
          </h3>
          <ul className="space-y-2.5">
            {data.comments.map((c) => {
              const dt =
                c.createdAt instanceof Date
                  ? c.createdAt
                  : new Date(
                      typeof c.createdAt === "number"
                        ? c.createdAt * 1000
                        : c.createdAt,
                    );
              return (
                <li key={c.id} className="flex items-start gap-2.5">
                  <AvatarOrInitial
                    src={publicAvatar(c.authorAvatar)}
                    name={c.authorName}
                    accent={theme.accent}
                    size={28}
                  />
                  <div
                    className="flex-1 rounded-2xl px-3.5 py-2"
                    style={{
                      background:
                        theme.wrapperClass.includes("cream")
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(31,26,23,0.05)",
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] opacity-50">
                        {formatRelative(dt)}
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap font-serif text-[14.5px] leading-snug opacity-90">
                      {c.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </motion.article>
  );
}

/* ============================ note ============================ */

function NoteView({ data, theme }: { data: SharedNote; theme: ShareTheme }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8"
      style={{ background: theme.cardBg, backdropFilter: "blur(20px)" }}
    >
      {data.note.title ? (
        <h1 className="font-display text-3xl italic leading-tight sm:text-4xl">
          {data.note.title}
        </h1>
      ) : null}
      <p className="mt-4 whitespace-pre-wrap font-serif text-[17px] leading-relaxed sm:text-[18px]">
        {data.note.body || (
          <span className="italic opacity-50">Catatan ini kosong.</span>
        )}
      </p>
      <p className="mt-6 border-t border-current/10 pt-4 text-right text-sm italic opacity-70">
        — {data.author?.displayName ?? "Anonim"}
      </p>
    </motion.article>
  );
}

/* ============================ album ============================ */

function AlbumView({
  data,
  theme,
  shareId,
}: {
  data: SharedAlbum;
  theme: ShareTheme;
  shareId: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl p-5 shadow-xl sm:p-6"
      style={{ background: theme.cardBg, backdropFilter: "blur(20px)" }}
    >
      <header className="pb-4 text-center">
        <h1 className="font-display text-3xl italic leading-tight sm:text-4xl">
          {data.album.name}
        </h1>
        {data.album.description ? (
          <p className="mt-2 text-sm opacity-70">{data.album.description}</p>
        ) : null}
        <p className="mt-1 text-xs opacity-50">
          {data.memories.length} kenangan
        </p>
      </header>

      {data.memories.length > 0 ? (
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {data.memories.map((m, i) =>
            m.coverKey ? (
              <MediaImage
                key={m.id}
                src={`/api/share-public/${shareId}/${m.coverKey}`}
                aspect="aspect-square"
                className="rounded-xl"
                eager={i < 6}
              />
            ) : (
              <div
                key={m.id}
                className="grid aspect-square place-items-center rounded-xl text-2xl"
                style={{ background: theme.accent + "20" }}
              >
                🌸
              </div>
            ),
          )}
        </div>
      ) : (
        <p className="text-center text-sm opacity-60">Album masih kosong.</p>
      )}
    </motion.article>
  );
}

/* ============================ letter ============================ */

function LetterView({ data, theme }: { data: SharedLetter; theme: ShareTheme }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8"
      style={{ background: theme.cardBg, backdropFilter: "blur(20px)" }}
    >
      {data.locked ? (
        <div className="text-center">
          <div className="mb-4 text-5xl">🔒</div>
          <h1 className="font-display text-3xl italic">Surat ini masih tertutup.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm opacity-70">
            Akan terbuka pada {new Date(data.unlocksAt).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            . Sampai saat itu, biarkan dia menunggu.
          </p>
        </div>
      ) : (
        <>
          {data.letter.title ? (
            <h1 className="font-display text-3xl italic leading-tight sm:text-4xl">
              {data.letter.title}
            </h1>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap font-serif text-[17px] leading-relaxed sm:text-[18px]">
            {data.letter.body}
          </p>
          <p className="mt-6 border-t border-current/10 pt-4 text-right text-sm italic opacity-70">
            — {data.author?.displayName ?? "Anonim"}
          </p>
        </>
      )}
    </motion.article>
  );
}

/* ============================ helpers ============================ */

function AvatarOrInitial({
  src,
  name,
  accent,
  size = 36,
}: {
  src: string | null;
  name: string;
  accent: string;
  size?: number;
}) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <span style={style} className="block shrink-0 overflow-hidden rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <div
      style={{ ...style, background: accent }}
      className="grid shrink-0 place-items-center rounded-full text-cream-50"
    >
      <span style={{ fontSize: size * 0.4 }}>
        {(name || "—").charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

