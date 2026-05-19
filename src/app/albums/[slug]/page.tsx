import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums, media, memories } from "@/db/schema";
import { mediaUrl } from "@/lib/r2";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BackButton } from "@/components/back-button";
import { AlbumGrid } from "./grid";

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

  const memoryRows = await d
    .select()
    .from(memories)
    .where(eq(memories.albumId, album.id))
    .orderBy(desc(memories.memoryDate));

  let firstMediaByMemory = new Map<string, { r2Key: string; kind: string }>();
  if (memoryRows.length > 0) {
    const memoryIds = memoryRows.map((m) => m.id);
    const mediaRows = await d
      .select()
      .from(media)
      .where(inArray(media.memoryId, memoryIds))
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
        <BackButton href="/albums" label="Album" />
      </div>

      <PageHeader
        eyebrow="album"
        title={album.name}
        subtitle={
          album.description ??
          (memoryRows.length > 0
            ? `${memoryRows.length} kenangan tersimpan di sini`
            : undefined)
        }
      />

      {memoryRows.length === 0 ? (
        <EmptyState
          title="Album ini masih kosong."
          description="Tambahkan kenangan dan masukkan ke album ini."
          cta={{ href: "/upload", label: "Buat kenangan" }}
        />
      ) : (
        <AlbumGrid
          albumId={album.id}
          albumName={album.name}
          items={memoryRows.map((m) => {
            const cov = firstMediaByMemory.get(m.id);
            return {
              id: m.id,
              caption: m.caption,
              cover: cov
                ? { url: mediaUrl(cov.r2Key), kind: cov.kind as "image" | "video" }
                : null,
            };
          })}
        />
      )}
    </>
  );
}
