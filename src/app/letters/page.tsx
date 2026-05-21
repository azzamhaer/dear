import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { letters, users } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { LetterEmpty } from "@/components/illustrations";
import { BackButton } from "@/components/back-button";
import { formatLongDate } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function LettersPage() {
  const d = db();
  const rows = await d
    .select()
    .from(letters)
    .orderBy(asc(letters.unlocksAt));

  const authorRows = await d
    .select({ id: users.id, displayName: users.displayName })
    .from(users);
  const authorsById = new Map(authorRows.map((u) => [u.id, u]));
  const now = Date.now();

  return (
    <>
      <div className="pt-2">
        <BackButton href="/notes" label="Catatan" />
      </div>

      <PageHeader
        eyebrow="surat untuk masa depan"
        title="Amplop yang menunggu."
        subtitle="Tulis sekarang, biarkan dia tertutup sampai harinya tiba."
        right={
          <Link
            href="/letters/new"
            className="rounded-full bg-ink-900 px-4 py-2 text-sm font-medium text-cream-50 shadow-soft transition hover:bg-ink-700"
          >
            + Surat baru
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada surat."
          description="Tulis sepucuk harapan diri kita di masa depan — sebuah pengingat, sebuah doa, atau sekadar bisikan kecil."
          illustration={<LetterEmpty />}
          cta={{ href: "/letters/new", label: "Tulis suratmu" }}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((l) => {
            const unlockMs =
              l.unlocksAt instanceof Date
                ? l.unlocksAt.getTime()
                : (l.unlocksAt as unknown as number) * 1000;
            const locked = unlockMs > now;
            const author = authorsById.get(l.authorId);
            const daysLeft = Math.max(
              0,
              Math.ceil((unlockMs - now) / (24 * 3600 * 1000)),
            );
            return (
              <li key={l.id}>
                <Link
                  href={`/letters/${l.id}`}
                  className={`glass relative block h-full overflow-hidden rounded-3xl p-5 shadow-soft transition hover:shadow-glow ${
                    locked ? "" : "bg-gradient-to-br from-cream-50 to-rose-mist/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-2xl">{locked ? "🔒" : "💌"}</div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        locked
                          ? "bg-ink-900/[0.06] text-ink-500"
                          : "bg-rose-mist/70 text-ink-700"
                      }`}
                    >
                      {locked
                        ? daysLeft === 0
                          ? "hari ini"
                          : daysLeft === 1
                            ? "besok"
                            : `${daysLeft} hari lagi`
                        : "terbuka"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg italic leading-snug text-ink-900">
                    {l.title || (locked ? "Sebuah surat tersembunyi" : "Tanpa judul")}
                  </h3>
                  <p className="mt-2 text-xs text-ink-400">
                    {locked
                      ? `Akan terbuka ${formatLongDate(new Date(unlockMs))}`
                      : `Terbuka sejak ${formatLongDate(new Date(unlockMs))}`}
                  </p>
                  <p className="mt-1 text-xs italic text-ink-500">
                    dari {author?.displayName ?? "—"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
