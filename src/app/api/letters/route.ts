import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { letters } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { newId } from "@/lib/crypto";

export const runtime = "edge";

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const items = await db()
    .select()
    .from(letters)
    .orderBy(asc(letters.unlocksAt));

  const now = Date.now();
  // Strip body for locked letters so it's never sent to the client.
  const safe = items.map((l) => {
    const unlockMs =
      l.unlocksAt instanceof Date
        ? l.unlocksAt.getTime()
        : (l.unlocksAt as unknown as number) * 1000;
    const locked = unlockMs > now;
    return {
      id: l.id,
      authorId: l.authorId,
      title: l.title,
      body: locked ? "" : l.body,
      unlocksAt: unlockMs,
      openedAt: l.openedAt
        ? l.openedAt instanceof Date
          ? l.openedAt.getTime()
          : (l.openedAt as unknown as number) * 1000
        : null,
      locked,
      createdAt:
        l.createdAt instanceof Date
          ? l.createdAt.getTime()
          : (l.createdAt as unknown as number) * 1000,
    };
  });
  return NextResponse.json({ items: safe });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const body = (await req.json().catch(() => null)) as
    | { title?: string; body?: string; unlocksAt?: string }
    | null;
  if (!body?.unlocksAt) {
    return NextResponse.json({ error: "missing_date" }, { status: 400 });
  }
  const unlockDate = new Date(body.unlocksAt);
  if (Number.isNaN(unlockDate.getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }
  if (unlockDate.getTime() <= Date.now()) {
    return NextResponse.json({ error: "date_in_past" }, { status: 400 });
  }
  const id = newId();
  await db().insert(letters).values({
    id,
    authorId: user.id,
    title: body.title?.trim() ?? "",
    body: body.body ?? "",
    unlocksAt: unlockDate,
  });
  return NextResponse.json({ id });
}
