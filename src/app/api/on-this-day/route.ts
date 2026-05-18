import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { memories } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { hydrateForRoute } from "@/lib/hydrate-helper";

export const runtime = "edge";

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();

  // Find memories from any year that match today's month/day.
  const rows = await db()
    .select()
    .from(memories)
    .where(
      sql`cast(strftime('%m', ${memories.memoryDate}, 'unixepoch') as integer) = ${month}
       AND cast(strftime('%d', ${memories.memoryDate}, 'unixepoch') as integer) = ${day}`,
    )
    .orderBy(sql`${memories.memoryDate} desc`);

  const items = await hydrateForRoute(rows);
  return NextResponse.json({ items, month, day });
}
