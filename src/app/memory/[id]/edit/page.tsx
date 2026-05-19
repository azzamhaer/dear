import { notFound, redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums } from "@/db/schema";
import { getMemory } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { EditForm } from "./form";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { dateToWibLocal } from "@/lib/wib";

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
      <div className="pt-2">
        <BackButton href={`/memory/${id}`} label="Kenangan" />
      </div>
      <PageHeader eyebrow="ubah" title="Sentuh lagi kenangan ini." />
      <EditForm
        memoryId={item.memory.id}
        initial={{
          caption: item.memory.caption,
          memoryDateLocal: dateToWibLocal(date),
          location: item.memory.location ?? "",
          mood: item.memory.mood ?? null,
          albumId: item.memory.albumId ?? "",
          media: item.media.map(m => ({
            r2Key: m.r2Key,
            kind: m.kind as "image" | "video",
            mimeType: m.mimeType,
            bytes: m.bytes || 0,
            name: m.r2Key.split("/").pop() || "",
            previewUrl: `/api/media/${m.r2Key}`
          }))
        }}
        albums={allAlbums}
      />
    </>
  );
}
