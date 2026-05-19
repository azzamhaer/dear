import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { UploadForm } from "./form";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";

export const runtime = "edge";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/upload");

  const allAlbums = await db()
    .select({ id: albums.id, name: albums.name })
    .from(albums)
    .orderBy(desc(albums.updatedAt));

  return (
    <>
      <div className="pt-2">
        <BackButton label="Kembali" />
      </div>
      <PageHeader
        eyebrow="baru"
        title="Satu kenangan."
        subtitle="Sebuah foto, beberapa kata."
      />
      <UploadForm albums={allAlbums} />
    </>
  );
}
