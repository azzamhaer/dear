import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { notes, users } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { NoteEditor } from "@/components/note-editor";
import { formatRelative } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [n] = await db().select().from(notes).where(eq(notes.id, id)).limit(1);
  if (!n) notFound();

  const [author] = await db()
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, n.authorId))
    .limit(1);

  const updated =
    n.updatedAt instanceof Date
      ? n.updatedAt
      : new Date((n.updatedAt as unknown as number) * 1000);

  return (
    <>
      <PageHeader
        eyebrow={`by ${author?.displayName ?? "—"} · ${formatRelative(updated)}`}
        title="Note."
      />
      <NoteEditor
        initial={{
          id: n.id,
          title: n.title,
          body: n.body,
          pinned: !!n.pinned,
        }}
      />
    </>
  );
}
