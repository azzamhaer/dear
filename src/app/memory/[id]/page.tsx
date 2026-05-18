import Link from "next/link";
import { notFound } from "next/navigation";
import { getMemory } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { mediaUrl } from "@/lib/r2";
import { moodEmoji, moodLabel } from "@/lib/utils";
import { formatWibDisplay } from "@/lib/wib";
import { Reactions } from "@/components/reactions";
import { Comments } from "@/components/comments";
import { MemoryActions } from "./actions";

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

  const date =
    item.memory.memoryDate instanceof Date
      ? item.memory.memoryDate
      : new Date((item.memory.memoryDate as unknown as number) * 1000);

  return (
    <article className="space-y-6 pt-4">
      <header className="flex items-start justify-between gap-3">
        <Link
          href="/"
          className="rounded-full px-3 py-1.5 text-sm text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
        >
          ← Back
        </Link>
        <MemoryActions
          memoryId={item.memory.id}
          isAuthor={user?.id === item.memory.authorId}
        />
      </header>

      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">
          {formatWibDisplay(date)}
        </div>
        <h1 className="mt-2 font-display text-3xl italic leading-tight sm:text-4xl">
          {item.memory.caption || "untitled moment"}
        </h1>
        <div className="mt-2 text-sm text-ink-500">
          by {item.author.displayName}
          {item.memory.location ? ` · ${item.memory.location}` : ""}
          {item.memory.mood
            ? ` · ${moodEmoji(item.memory.mood)} ${moodLabel(item.memory.mood)}`
            : ""}
        </div>
      </div>

      {item.media.length > 0 ? (
        <div className="space-y-4">
          {item.media.map((m) => (
            <figure
              key={m.id}
              className="overflow-hidden rounded-3xl placeholder frame-soft"
            >
              {m.kind === "video" ? (
                <video
                  src={mediaUrl(m.r2Key)}
                  controls
                  playsInline
                  className="h-auto w-full"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(m.r2Key)}
                  alt=""
                  className="h-auto w-full"
                  loading="lazy"
                />
              )}
            </figure>
          ))}
        </div>
      ) : null}

      <div className="glass rounded-3xl p-5 shadow-soft sm:p-6">
        <Reactions
          memoryId={item.memory.id}
          initial={item.reactions}
          currentUserId={user?.id}
        />
        {item.album ? (
          <div className="mt-3 text-xs text-ink-400">
            Filed under{" "}
            <Link
              href={`/albums/${item.album.slug}`}
              className="text-ink-700 hover:underline"
            >
              {item.album.name}
            </Link>
          </div>
        ) : null}
      </div>

      <Comments memoryId={item.memory.id} currentUserId={user?.id} />
    </article>
  );
}
