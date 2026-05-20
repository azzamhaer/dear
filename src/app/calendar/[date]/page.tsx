import { notFound } from "next/navigation";
import { listMemories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { MemoryFeed } from "@/components/memory-feed";
import { BackButton } from "@/components/back-button";
import { CalendarEmpty } from "@/components/illustrations";
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
  // Date is WIB; convert to UTC range for the query.
  const start = Math.floor(
    (Date.UTC(year, month - 1, day, 0, 0, 0) - 7 * 3600 * 1000) / 1000,
  );
  const end = start + 24 * 3600 - 1;

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
      <div className="pt-2">
        <BackButton href="/calendar" label="Kalender" />
      </div>
      <PageHeader eyebrow="hari itu" title={formatLongDate(dateObj)} />
      <MemoryFeed
        initial={items}
        currentUserId={user?.id}
        paginate={false}
        emptyTitle="Belum ada apa-apa untuk tanggal ini."
        emptyDescription="Masih ada waktu untuk membuatnya."
      />
    </>
  );
}
