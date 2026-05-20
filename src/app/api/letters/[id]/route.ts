import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { letters } from "@/db/schema";
import { requireUser } from "@/lib/session";

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
  const [l] = await d.select().from(letters).where(eq(letters.id, id)).limit(1);
  if (!l) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const unlockMs =
    l.unlocksAt instanceof Date
      ? l.unlocksAt.getTime()
      : (l.unlocksAt as unknown as number) * 1000;
  const locked = unlockMs > Date.now();

  // Mark openedAt when first opened post-unlock
  if (!locked && !l.openedAt) {
    await d
      .update(letters)
      .set({ openedAt: new Date() })
      .where(eq(letters.id, id));
  }

  return NextResponse.json({
    item: {
      id: l.id,
      authorId: l.authorId,
      title: l.title,
      body: locked ? "" : l.body,
      unlocksAt: unlockMs,
      locked,
      createdAt:
        l.createdAt instanceof Date
          ? l.createdAt.getTime()
          : (l.createdAt as unknown as number) * 1000,
    },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await db()
    .delete(letters)
    .where(and(eq(letters.id, id), eq(letters.authorId, user.id)));
  return NextResponse.json({ ok: true });
}
