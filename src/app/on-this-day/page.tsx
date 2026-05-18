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
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();

  const rows = await db()
    .select()
    .from(memories)
    .where(
      sql`cast(strftime('%m', ${memories.memoryDate}, 'unixepoch') as integer) = ${month}
       AND cast(strftime('%d', ${memories.memoryDate}, 'unixepoch') as integer) = ${day}`,
    )
    .orderBy(sql`${memories.memoryDate} desc`);

  const [user, items] = await Promise.all([
    getCurrentUser(),
    hydrateForRoute(rows),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="on this day"
        title="What today used to be."
        subtitle="Memories from past years on this exact date."
      />
      <MemoryFeed
        initial={items}
        currentUserId={user?.id}
        emptyTitle="No echoes for today."
        emptyDescription="Come back next year — there will be something here."
      />
    </>
  );
}
