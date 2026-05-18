import { NextRequest, NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { comments, users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { newId } from "@/lib/crypto";

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const d = db();
  const rows = await d
    .select()
    .from(comments)
    .where(eq(comments.memoryId, id))
    .orderBy(asc(comments.createdAt));

  const authorIds = Array.from(new Set(rows.map((r) => r.authorId)));
  const authors = authorIds.length
    ? await d.select().from(users).where(inArray(users.id, authorIds))
    : [];
  const authorsById = new Map(authors.map((u) => [u.id, u]));

  const items = rows.map((c) => ({
    ...c,
    author: (() => {
      const u = authorsById.get(c.authorId);
      return u
        ? { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl }
        : { id: c.authorId, displayName: "—", avatarUrl: null };
    })(),
  }));

  return NextResponse.json({ items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { body?: string }
    | null;
  const text = body?.body?.trim();
  if (!text) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "too_long" }, { status: 400 });
  }
  const cid = newId();
  await db().insert(comments).values({
    id: cid,
    memoryId: id,
    authorId: user.id,
    body: text,
  });
  return NextResponse.json({ id: cid });
}
