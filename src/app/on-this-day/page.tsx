import { sql } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { memories } from "@/db/schema";
import { hydrateForRoute } from "@/lib/hydrate-helper";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { MemoryFeed } from "@/components/memory-feed";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function OnThisDayPage() {
  const wibNow = new Date(Date.now() + 7 * 3600 * 1000);
  const month = wibNow.getUTCMonth() + 1;
  const day = wibNow.getUTCDate();

  const rows = await db()
    .select()
    .from(memories)
    .where(
      sql`cast(strftime('%m', ${memories.memoryDate}, 'unixepoch', '+7 hours') as integer) = ${month}
       AND cast(strftime('%d', ${memories.memoryDate}, 'unixepoch', '+7 hours') as integer) = ${day}`,
    )
    .orderBy(sql`${memories.memoryDate} desc`);

  const [user, items] = await Promise.all([
    getCurrentUser(),
    hydrateForRoute(rows),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="di hari yang sama"
        title="Hari ini, di waktu yang lain."
        subtitle="Kenangan dari tahun-tahun lalu di tanggal yang sama."
      />
      <MemoryFeed
        initial={items}
        currentUserId={user?.id}
        paginate={false}
        emptyTitle="Belum ada gema dari masa lalu."
        emptyDescription="Kembali tahun depan — pasti ada sesuatu yang menunggu."
      />
    </>
  );
}
