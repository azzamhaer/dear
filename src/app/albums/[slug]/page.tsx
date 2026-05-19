import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums, media, memories } from "@/db/schema";
import { mediaUrl } from "@/lib/r2";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const d = db();
  const [album] = await d
    .select()
    .from(albums)
    .where(eq(albums.slug, slug))
    .limit(1);
  if (!album) notFound();

  // Fetch memories in album
  const memoryRows = await d
    .select()
    .from(memories)
    .where(eq(memories.albumId, album.id))
    .orderBy(desc(memories.memoryDate));

  if (memoryRows.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="album"
          title={album.name}
          subtitle={album.description ?? undefined}
        />
        <EmptyState
          title="Album ini masih kosong."
          description="Tambahkan kenangan dan masukkan ke album ini."
          cta={{ href: "/upload", label: "Buat kenangan" }}
        />
      </>
    );
  }

  // Fetch first media per memory (for thumbnails)
  const memoryIds = memoryRows.map((m) => m.id);
  const mediaRows = await d
    .select()
    .from(media)
    .where(inArray(media.memoryId, memoryIds))
    .orderBy(media.position);

  const firstMediaByMemory = new Map<string, { r2Key: string; kind: string }>();
  for (const m of mediaRows) {
    if (!firstMediaByMemory.has(m.memoryId)) {
      firstMediaByMemory.set(m.memoryId, { r2Key: m.r2Key, kind: m.kind });
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="album"
        title={album.name}
        subtitle={
          album.description ??
          `${memoryRows.length} kenangan tersimpan di sini`
        }
      />

      <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
        {memoryRows.map((m) => {
          const cover = firstMediaByMemory.get(m.id);
          return (
            <Link
              key={m.id}
              href={`/memory/${m.id}`}
              className="group relative aspect-square overflow-hidden rounded-xl placeholder transition hover:opacity-95"
              aria-label={m.caption || "kenangan"}
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
              {m.caption ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <p className="line-clamp-2 text-[11px] leading-tight text-cream-50">
                    {m.caption}
                  </p>
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
