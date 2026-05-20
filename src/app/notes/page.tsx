import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { notes, users } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { NoteEmpty } from "@/components/illustrations";
import { NewNoteButton } from "./new-button";
import { formatRelative } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const d = db();
  const rows = await d
    .select()
    .from(notes)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));

  if (rows.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="buku kita"
          title="Catatan."
          subtitle="Apa pun yang ada di kepala, tuangkan saja di sini."
          right={<NewNoteButton />}
        />
        <EmptyState
          title="Belum ada yang ditulis."
          description="Tulis yang pertama. Sepotong pesan kecil untuk dibaca nanti."
          illustration={<NoteEmpty />}
          cta={{ href: "/notes/new", label: "Tulis sesuatu" }}
        />
      </>
    );
  }

  const authorRows = await d
    .select({ id: users.id, displayName: users.displayName })
    .from(users);
  const authorsById = new Map(authorRows.map((u) => [u.id, u]));

  return (
    <>
      <PageHeader
        eyebrow="buku kita"
        title="Catatan."
        subtitle="Apa pun yang ada di kepala, tuangkan saja di sini."
        right={<NewNoteButton />}
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((n) => {
          const updated =
            n.updatedAt instanceof Date
              ? n.updatedAt
              : new Date((n.updatedAt as unknown as number) * 1000);
          const author = authorsById.get(n.authorId);
          const preview = (n.body || "").slice(0, 200).trim();
          return (
            <li key={n.id}>
              <Link
                href={`/notes/${n.id}`}
                className="glass block h-full overflow-hidden rounded-3xl p-5 shadow-soft transition hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-lg italic leading-snug text-ink-900">
                    {n.title || (
                      <span className="text-ink-400">Tanpa judul</span>
                    )}
                  </div>
                  {n.pinned ? (
                    <span className="rounded-full bg-rose-mist/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-700">
                      Pinned
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-ink-700">
                  {preview || (
                    <span className="text-ink-400">Masih kosong.</span>
                  )}
                </p>
                <div className="mt-4 flex items-baseline justify-between text-xs text-ink-400">
                  <span>{author?.displayName ?? "—"}</span>
                  <span>{formatRelative(updated)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
