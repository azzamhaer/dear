import { sql, desc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { memories, users } from "@/db/schema";
import { daysBetween, todayWibIso } from "@/lib/wib";

/**
 * Server component shown at the top of the home page.
 * Renders two small pills: "Bersama X hari" + "X hari berturut-turut menyimpan".
 * Renders nothing if there's nothing meaningful to show.
 */
export async function AffectionStrip() {
  const d = db();

  // 1. Pull coupleStartDate (use first non-null)
  let coupleStartDate: string | null = null;
  try {
    const rows = await d
      .select({ coupleStartDate: users.coupleStartDate })
      .from(users);
    for (const r of rows) {
      if (r.coupleStartDate) {
        coupleStartDate = r.coupleStartDate;
        break;
      }
    }
  } catch {
    /* schema not migrated yet — ignore */
  }

  // 2. Streak — count consecutive WIB days back from today with at least 1 memory.
  let streak = 0;
  try {
    const recent = await d
      .select({
        day: sql<string>`strftime('%Y-%m-%d', ${memories.memoryDate}, 'unixepoch', '+7 hours')`,
      })
      .from(memories)
      .orderBy(desc(memories.memoryDate))
      .limit(120);
    const set = new Set<string>(recent.map((r) => r.day));
    const today = todayWibIso();
    let cursor = today;
    while (set.has(cursor)) {
      streak += 1;
      cursor = stepBack(cursor);
    }
  } catch {
    streak = 0;
  }

  const togetherDays =
    coupleStartDate ? Math.max(0, daysBetween(coupleStartDate, todayWibIso())) : 0;

  if (togetherDays === 0 && streak < 2) return null;

  return (
    <div className="-mt-3 mb-6 flex flex-wrap items-center gap-2 text-xs">
      {togetherDays > 0 ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-mist/70 px-3 py-1.5 text-ink-700">
          <span aria-hidden>💗</span>
          <span>
            Bersama{" "}
            <strong className="font-display italic">
              {togetherDays.toLocaleString("id-ID")}
            </strong>{" "}
            hari
          </span>
        </span>
      ) : null}
      {streak >= 2 ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-100/80 px-3 py-1.5 text-ink-700">
          <span aria-hidden>🔥</span>
          <span>
            <strong className="font-display italic">{streak}</strong> hari
            berturut-turut menyimpan kenangan
          </span>
        </span>
      ) : null}
    </div>
  );
}

function stepBack(ymd: string): string {
  const d = new Date(ymd + "T00:00:00+07:00");
  d.setUTCDate(d.getUTCDate() - 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
