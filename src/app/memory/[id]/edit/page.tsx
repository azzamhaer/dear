import { notFound, redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums } from "@/db/schema";
import { getMemory } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { EditForm } from "./form";
import { PageHeader } from "@/components/page-header";

export const runtime = "edge";

export default async function EditPage({
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
  if (!user) redirect("/login");

  const allAlbums = await db()
    .select({ id: albums.id, name: albums.name })
    .from(albums)
    .orderBy(desc(albums.updatedAt));

  const date =
    item.memory.memoryDate instanceof Date
      ? item.memory.memoryDate
      : new Date((item.memory.memoryDate as unknown as number) * 1000);

  return (
    <>
      <PageHeader eyebrow="edit" title="Refine the memory." />
      <EditForm
        memoryId={item.memory.id}
        initial={{
          caption: item.memory.caption,
          memoryDate: date.toISOString().slice(0, 10),
          location: item.memory.location ?? "",
          mood: item.memory.mood ?? null,
          albumId: item.memory.albumId ?? "",
        }}
        albums={allAlbums}
      />
    </>
  );
}
