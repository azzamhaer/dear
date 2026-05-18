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

  // "Today" in WIB
  const wibNow = new Date(Date.now() + 7 * 3600 * 1000);
  const month = wibNow.getUTCMonth() + 1;
  const day = wibNow.getUTCDate();

  // Find memories from any year that match today's WIB month/day.
  const rows = await db()
    .select()
    .from(memories)
    .where(
      sql`cast(strftime('%m', ${memories.memoryDate}, 'unixepoch', '+7 hours') as integer) = ${month}
       AND cast(strftime('%d', ${memories.memoryDate}, 'unixepoch', '+7 hours') as integer) = ${day}`,
    )
    .orderBy(sql`${memories.memoryDate} desc`);

  const items = await hydrateForRoute(rows);
  return NextResponse.json({ items, month, day });
}
