import { and, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db } from "./cloudflare";
import {
  albums,
  comments,
  media,
  memories,
  reactions,
  users,
  type Album,
  type Media,
  type Memory,
  type Reaction,
  type User,
} from "@/db/schema";

export interface MemoryWithRelations {
  memory: Memory;
  author: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  media: Media[];
  reactions: Reaction[];
  album: Pick<Album, "id" | "name" | "slug"> | null;
  commentCount: number;
}

/**
 * Fetch a page of memories with all relations.
 * Done in 4 queries (memories + authors + media + reactions) to keep things
 * fast on D1 — no N+1.
 */
export async function listMemories(opts: {
  limit?: number;
  offset?: number;
  albumId?: string;
  monthDay?: { month: number; day: number }; // for On This Day
  yearRange?: { startUnix: number; endUnix: number };
} = {}): Promise<MemoryWithRelations[]> {
  const d = db();
  const limit = opts.limit ?? 30;
  const offset = opts.offset ?? 0;

  const wheres: SQL[] = [];
  if (opts.albumId) wheres.push(eq(memories.albumId, opts.albumId));
  if (opts.yearRange) {
    wheres.push(
      gte(memories.memoryDate, new Date(opts.yearRange.startUnix * 1000)),
    );
    wheres.push(
      lte(memories.memoryDate, new Date(opts.yearRange.endUnix * 1000)),
    );
  }

  const rows = await d
    .select()
    .from(memories)
    .where(wheres.length ? and(...wheres) : undefined)
    .orderBy(desc(memories.memoryDate), desc(memories.createdAt))
    .limit(limit)
    .offset(offset);

  let filtered = rows;
  if (opts.monthDay) {
    const { month, day } = opts.monthDay;
    filtered = rows.filter((m) => {
      const dt = m.memoryDate as unknown as Date;
      return dt.getUTCMonth() + 1 === month && dt.getUTCDate() === day;
    });
  }

  return hydrateMemories(filtered);
}

export async function getMemory(
  id: string,
): Promise<MemoryWithRelations | null> {
  const [row] = await db()
    .select()
    .from(memories)
    .where(eq(memories.id, id))
    .limit(1);
  if (!row) return null;
  const [full] = await hydrateMemories([row]);
  return full ?? null;
}

async function hydrateMemories(
  rows: Memory[],
): Promise<MemoryWithRelations[]> {
  if (rows.length === 0) return [];
  const d = db();
  const ids = rows.map((m) => m.id);
  const authorIds = Array.from(new Set(rows.map((m) => m.authorId)));
  const albumIds = Array.from(
    new Set(rows.map((m) => m.albumId).filter((x): x is string => !!x)),
  );

  const [mediaRows, reactRows, authorRows, albumRows, commentCountRows] =
    await Promise.all([
      ids.length
        ? d.select().from(media).where(inArray(media.memoryId, ids))
        : Promise.resolve([] as Media[]),
      ids.length
        ? d.select().from(reactions).where(inArray(reactions.memoryId, ids))
        : Promise.resolve([] as Reaction[]),
      authorIds.length
        ? d.select().from(users).where(inArray(users.id, authorIds))
        : Promise.resolve([] as User[]),
      albumIds.length
        ? d.select().from(albums).where(inArray(albums.id, albumIds))
        : Promise.resolve([] as Album[]),
      ids.length
        ? d
            .select({
              memoryId: comments.memoryId,
              count: sql<number>`count(*)`.as("count"),
            })
            .from(comments)
            .where(inArray(comments.memoryId, ids))
            .groupBy(comments.memoryId)
        : Promise.resolve([] as Array<{ memoryId: string; count: number }>),
    ]);

  const commentCountByMemory = new Map<string, number>();
  for (const r of commentCountRows) {
    commentCountByMemory.set(r.memoryId, Number(r.count));
  }

  const mediaByMemory = new Map<string, Media[]>();
  for (const m of mediaRows) {
    const arr = mediaByMemory.get(m.memoryId) ?? [];
    arr.push(m);
    mediaByMemory.set(m.memoryId, arr);
  }
  for (const arr of mediaByMemory.values()) {
    arr.sort((a, b) => a.position - b.position);
  }

  const reactsByMemory = new Map<string, Reaction[]>();
  for (const r of reactRows) {
    const arr = reactsByMemory.get(r.memoryId) ?? [];
    arr.push(r);
    reactsByMemory.set(r.memoryId, arr);
  }

  const authorsById = new Map<string, User>();
  for (const a of authorRows) authorsById.set(a.id, a);

  const albumsById = new Map<string, Album>();
  for (const a of albumRows) albumsById.set(a.id, a);

  return rows.map((m) => ({
    memory: m,
    media: mediaByMemory.get(m.id) ?? [],
    reactions: reactsByMemory.get(m.id) ?? [],
    commentCount: commentCountByMemory.get(m.id) ?? 0,
    author: (() => {
      const a = authorsById.get(m.authorId);
      return a
        ? {
            id: a.id,
            displayName: a.displayName,
            username: a.username,
            avatarUrl: a.avatarUrl ?? null,
          }
        : {
            id: m.authorId,
            displayName: "—",
            username: "—",
            avatarUrl: null,
          };
    })(),
    album: m.albumId
      ? (() => {
          const a = albumsById.get(m.albumId!);
          return a ? { id: a.id, name: a.name, slug: a.slug } : null;
        })()
      : null,
  }));
}

/** Used by calendar view: count memories per day (WIB) in a month (WIB). */
export async function memoriesCountByDay(
  year: number,
  month: number, // 1-12
): Promise<Record<string, number>> {
  // Month boundaries in WIB, converted to UTC for the SQL range.
  const wibStart = Date.UTC(year, month - 1, 1, 0, 0, 0) - 7 * 3600 * 1000;
  const wibEnd =
    Date.UTC(year, month, 0, 23, 59, 59) - 7 * 3600 * 1000;
  const rows = await db()
    .select({
      day: sql<string>`strftime('%Y-%m-%d', ${memories.memoryDate}, 'unixepoch', '+7 hours')`,
      count: sql<number>`count(*)`,
    })
    .from(memories)
    .where(
      and(
        gte(memories.memoryDate, new Date(wibStart)),
        lte(memories.memoryDate, new Date(wibEnd)),
      ),
    )
    .groupBy(sql`day`);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.day] = Number(r.count);
  return out;
}
