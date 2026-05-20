import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { letters, users } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { formatLongDate } from "@/lib/utils";
import { LetterView } from "./view";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = db();
  const [l] = await d.select().from(letters).where(eq(letters.id, id)).limit(1);
  if (!l) notFound();

  const [author] = await d
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, l.authorId))
    .limit(1);

  const unlockMs =
    l.unlocksAt instanceof Date
      ? l.unlocksAt.getTime()
      : (l.unlocksAt as unknown as number) * 1000;
  const locked = unlockMs > Date.now();

  return (
    <>
      <div className="pt-2">
        <BackButton href="/letters" label="Surat" />
      </div>
      <PageHeader
        eyebrow={
          locked
            ? `terkunci · akan terbuka ${formatLongDate(new Date(unlockMs))}`
            : `dibuka · ${formatLongDate(new Date(unlockMs))}`
        }
        title={l.title || (locked ? "Sebuah surat tersembunyi" : "Surat")}
      />
      <LetterView
        id={l.id}
        body={locked ? "" : l.body}
        locked={locked}
        unlocksAt={unlockMs}
        authorName={author?.displayName ?? "—"}
      />
    </>
  );
}
