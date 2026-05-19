import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums, comments, media, memories, notes, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { mediaUrl } from "@/lib/r2";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/avatar";
import { BackButton } from "@/components/back-button";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const lower = username.toLowerCase();

  const d = db();
  const [profile] = await d
    .select()
    .from(users)
    .where(eq(users.username, lower))
    .limit(1);
  if (!profile) notFound();

  const currentUser = await getCurrentUser();
  const isSelf = currentUser?.id === profile.id;

  // Counts in parallel
  const [memoryCountRow, albumCountRow, notesCountRow] = await Promise.all([
    d
      .select({ count: sql<number>`count(*)` })
      .from(memories)
      .where(eq(memories.authorId, profile.id)),
    d
      .select({ count: sql<number>`count(distinct ${memories.albumId})` })
      .from(memories)
      .where(eq(memories.authorId, profile.id)),
    d
      .select({ count: sql<number>`count(*)` })
      .from(notes)
      .where(eq(notes.authorId, profile.id)),
  ]);
  const memoryCount = Number(memoryCountRow[0]?.count ?? 0);
  const albumCount = Number(albumCountRow[0]?.count ?? 0);
  const notesCount = Number(notesCountRow[0]?.count ?? 0);

  // Recent memories (paginate later if needed)
  const memoryRows = await d
    .select()
    .from(memories)
    .where(eq(memories.authorId, profile.id))
    .orderBy(desc(memories.memoryDate))
    .limit(60);

  let firstMediaByMemory = new Map<string, { r2Key: string; kind: string }>();
  if (memoryRows.length > 0) {
    const ids = memoryRows.map((m) => m.id);
    const mediaRows = await d
      .select()
      .from(media)
      .where(inArray(media.memoryId, ids))
      .orderBy(media.position);
    for (const m of mediaRows) {
      if (!firstMediaByMemory.has(m.memoryId)) {
        firstMediaByMemory.set(m.memoryId, { r2Key: m.r2Key, kind: m.kind });
      }
    }
  }

  return (
    <>
      <div className="pt-2">
        <BackButton label="Kembali" />
      </div>

      <section className="glass mt-3 rounded-3xl p-5 shadow-soft sm:p-7">
        <div className="flex items-start gap-4 sm:gap-6">
          <Avatar
            src={profile.avatarUrl}
            name={profile.displayName}
            size={88}
            className="shadow-card"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h1 className="font-display text-2xl italic leading-tight text-ink-900 sm:text-3xl">
                  {profile.displayName}
                </h1>
                <div className="text-xs text-ink-400">@{profile.username}</div>
              </div>
              {isSelf ? (
                <Link
                  href="/settings"
                  className="rounded-full bg-cream-50/60 px-3 py-1.5 text-xs text-ink-700 backdrop-blur hover:bg-cream-50/90"
                >
                  Ubah profil
                </Link>
              ) : null}
            </div>

            {profile.bio ? (
              <p className="mt-3 font-serif text-[15.5px] leading-relaxed text-ink-700">
                {profile.bio}
              </p>
            ) : isSelf ? (
              <Link
                href="/settings"
                className="mt-3 inline-block text-xs italic text-ink-400 hover:text-ink-700"
              >
                Tuliskan bio singkat terpuitis kamu di sini…
              </Link>
            ) : null}

            <div className="mt-4 flex gap-5 text-sm">
              <Stat label="kenangan" count={memoryCount} />
              <Stat label="album" count={albumCount} />
              <Stat label="catatan" count={notesCount} />
            </div>
          </div>
        </div>
      </section>

      <div className="mb-3 mt-6 flex items-baseline justify-between">
        <h2 className="font-display text-lg italic text-ink-700">
          Kenangan {isSelf ? "kamu" : profile.displayName.split(" ")[0]}
        </h2>
        <span className="text-xs text-ink-400">{memoryCount} total</span>
      </div>

      {memoryRows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-ink-900/10 px-6 py-12 text-center text-sm text-ink-400">
          {isSelf
            ? "Belum ada kenangan yang kamu simpan."
            : "Belum ada kenangan dari sini."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          {memoryRows.map((m) => {
            const cover = firstMediaByMemory.get(m.id);
            return (
              <Link
                key={m.id}
                href={`/memory/${m.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl placeholder transition hover:opacity-95"
              >
                {cover ? (
                  cover.kind === "video" ? (
                    <>
                      <video
                        src={mediaUrl(cover.r2Key)}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink-900/55 text-cream-50 backdrop-blur">
                        <PlayIcon className="h-2.5 w-2.5" />
                      </div>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(cover.r2Key)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  )
                ) : (
                  <div className="grid h-full w-full place-items-center text-3xl">
                    🌸
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-xl italic text-ink-900 tabular-nums">
        {count}
      </span>
      <span className="text-xs text-ink-500">{label}</span>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
