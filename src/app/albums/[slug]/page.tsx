import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums } from "@/db/schema";
import { listMemories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { MemoryFeed } from "@/components/memory-feed";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [album] = await db()
    .select()
    .from(albums)
    .where(eq(albums.slug, slug))
    .limit(1);

  if (!album) notFound();

  const [user, items] = await Promise.all([
    getCurrentUser(),
    listMemories({ albumId: album.id, limit: 100 }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="album"
        title={album.name}
        subtitle={album.description ?? undefined}
      />
      <MemoryFeed
        initial={items}
        currentUserId={user?.id}
        emptyTitle="This album is empty."
        emptyDescription="Add a memory and assign it to this album."
        emptyCta={{ href: "/upload", label: "Add a memory" }}
      />
    </>
  );
}
