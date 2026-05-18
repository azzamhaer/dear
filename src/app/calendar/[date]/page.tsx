import { notFound } from "next/navigation";
import Link from "next/link";
import { listMemories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { MemoryFeed } from "@/components/memory-feed";
import { formatLongDate } from "@/lib/utils";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function CalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  // date is YYYY-MM-DD
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) notFound();
  const [, ys, ms, ds] = m;
  const year = Number(ys);
  const month = Number(ms);
  const day = Number(ds);
  const start = Math.floor(Date.UTC(year, month - 1, day, 0, 0, 0) / 1000);
  const end = Math.floor(Date.UTC(year, month - 1, day, 23, 59, 59) / 1000);

  const [user, items] = await Promise.all([
    getCurrentUser(),
    listMemories({
      yearRange: { startUnix: start, endUnix: end },
      limit: 200,
    }),
  ]);

  const dateObj = new Date(Date.UTC(year, month - 1, day));

  return (
    <>
      <PageHeader
        eyebrow="that day"
        title={formatLongDate(dateObj)}
        right={
          <Link
            href="/calendar"
            className="rounded-full px-3 py-1.5 text-sm text-ink-500 hover:bg-ink-900/5 hover:text-ink-900"
          >
            ← Calendar
          </Link>
        }
      />
      <MemoryFeed
        initial={items}
        currentUserId={user?.id}
        emptyTitle="Nothing kept for this day."
        emptyDescription="There's still time."
      />
    </>
  );
}
