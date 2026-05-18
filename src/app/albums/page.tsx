import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
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
  const rows = await d
    .select({
      id: albums.id,
      name: albums.name,
      slug: albums.slug,
      description: albums.description,
      count: sql<number>`(SELECT count(*) FROM ${memories} WHERE ${memories.albumId} = ${albums.id})`,
      coverKey: sql<string | null>`(
        SELECT ${media.r2Key} FROM ${media}
        INNER JOIN ${memories} ON ${memories.id} = ${media.memoryId}
        WHERE ${memories.albumId} = ${albums.id}
        ORDER BY ${memories.memoryDate} DESC
        LIMIT 1
      )`,
    })
    .from(albums)
    .orderBy(desc(albums.updatedAt));

  return (
    <>
      <PageHeader
        eyebrow="collections"
        title="Albums."
        subtitle="Group memories that belong together."
        right={<NewAlbumButton />}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No albums yet."
          description="Albums help you keep weekends, trips, or seasons of your life together in one place."
          icon="📔"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {rows.map((a) => (
            <li key={a.id}>
              <Link
                href={`/albums/${a.slug}`}
                className="group block overflow-hidden rounded-3xl glass shadow-soft transition hover:shadow-glow"
              >
                <div className="relative aspect-[4/5] placeholder">
                  {a.coverKey ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(a.coverKey)}
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
                      {a.count} memor{Number(a.count) === 1 ? "y" : "ies"}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
