import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums, media, memories } from "@/db/schema";
import { mediaUrl } from "@/lib/r2";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NewAlbumButton } from "./new-button";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const d = db();

  const allAlbums = await d
    .select()
    .from(albums)
    .orderBy(desc(albums.updatedAt));

  if (allAlbums.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="koleksi"
          title="Album."
          subtitle="Untuk kenangan yang terlalu mirip rasanya untuk dipisahkan, maka satukanlah."
          right={<NewAlbumButton />}
        />
        <EmptyState
          title="Belum ada album."
          description="Album menjaga akhir pekan, perjalanan, atau musim-musim hidup kita tetap rapi di satu tempat."
          icon="📔"
        />
      </>
    );
  }

  const albumIds = allAlbums.map((a) => a.id);

  const countRows = await d
    .select({
      albumId: memories.albumId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(memories)
    .where(inArray(memories.albumId, albumIds))
    .groupBy(memories.albumId);

  const countByAlbum = new Map<string, number>();
  for (const r of countRows) {
    if (r.albumId) countByAlbum.set(r.albumId, Number(r.count));
  }

  const coverRows = await d
    .select({
      albumId: memories.albumId,
      r2Key: media.r2Key,
      memoryDate: memories.memoryDate,
    })
    .from(memories)
    .innerJoin(media, eq(media.memoryId, memories.id))
    .where(inArray(memories.albumId, albumIds))
    .orderBy(desc(memories.memoryDate));

  const coverByAlbum = new Map<string, string>();
  for (const r of coverRows) {
    if (r.albumId && !coverByAlbum.has(r.albumId)) {
      coverByAlbum.set(r.albumId, r.r2Key);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="koleksi"
        title="Album."
        subtitle="Untuk kenangan yang terlalu mirip rasanya untuk dipisahkan, maka satukanlah."
        right={<NewAlbumButton />}
      />

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {allAlbums.map((a) => {
          const count = countByAlbum.get(a.id) ?? 0;
          const coverKey = coverByAlbum.get(a.id);
          return (
            <li key={a.id}>
              <Link
                href={`/albums/${a.slug}`}
                className="group block overflow-hidden rounded-3xl glass shadow-soft transition hover:shadow-glow"
              >
                <div className="relative aspect-[4/5] placeholder">
                  {coverKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(coverKey)}
                      alt=""
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-3xl">
                      🌸
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/75 to-transparent p-4">
                    <div className="font-display text-lg italic text-cream-50">
                      {a.name}
                    </div>
                    <div className="text-xs text-cream-50/80">
                      {count} kenangan
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
