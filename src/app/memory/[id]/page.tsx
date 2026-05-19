import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemory } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { moodEmoji, moodLabel } from "@/lib/utils";
import { formatWibDisplay } from "@/lib/wib";
import { mediaUrl } from "@/lib/r2";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";
import { MemoryDetail } from "./detail";
import { MemoryMediaGallery } from "./gallery";
import { MemoryDetailComments } from "./detail-comments";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function MemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, user] = await Promise.all([
    getMemory(id),
    getCurrentUser(),
  ]);
  if (!item) notFound();

  const date = new Date(item.memory.memoryDate);

  return (
    <article className="space-y-6 pt-2">
      <header className="flex items-start justify-between gap-3">
        <BackButton label="Kembali" />
        <MemoryDetail
          memoryId={item.memory.id}
          canEdit={user?.id === item.memory.authorId}
        />
      </header>

      <div className="text-center">
        <Link
          href={`/profile/${item.author.username}`}
          className="mb-3 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900"
        >
          <Avatar src={item.author.avatarUrl} name={item.author.displayName} size={28} />
          <span>{item.author.displayName}</span>
        </Link>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">
          {formatWibDisplay(date)}
        </div>
        <h1 className="mt-2 font-display text-3xl italic leading-tight sm:text-4xl">
          {item.memory.caption || "momen tanpa judul"}
        </h1>
        <div className="mt-2 text-sm text-ink-500">
          {item.memory.location ? item.memory.location : null}
          {item.memory.mood
            ? `${item.memory.location ? " · " : ""}${moodEmoji(item.memory.mood)} ${moodLabel(item.memory.mood)}`
            : ""}
        </div>
      </div>

      {item.media.length > 0 ? (
        <MemoryMediaGallery
          media={item.media.map((m) => ({
            url: mediaUrl(m.r2Key),
            kind: m.kind as "image" | "video",
          }))}
        />
      ) : null}

      {item.album ? (
        <div className="text-center text-xs text-ink-400">
          tersimpan di{" "}
          <Link
            href={`/albums/${item.album.slug}`}
            className="text-ink-700 hover:underline"
          >
            {item.album.name}
          </Link>
        </div>
      ) : null}

      <section className="glass rounded-3xl p-5 shadow-soft sm:p-6">
        <h2 className="mb-4 font-display text-xl italic">Percakapan kita</h2>
        <MemoryDetailComments
          memoryId={item.memory.id}
          initialCount={item.commentCount}
          currentUserId={user?.id}
        />
      </section>
    </article>
  );
}

