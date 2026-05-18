import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { comments } from "@/db/schema";
import { requireUser } from "@/lib/session";

export const runtime = "edge";

export async function PATCH(
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
  await db()
    .update(comments)
    .set({ body: text, updatedAt: new Date() })
    .where(and(eq(comments.id, id), eq(comments.authorId, user.id)));
  return NextResponse.json({ ok: true });
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
    .delete(comments)
    .where(and(eq(comments.id, id), eq(comments.authorId, user.id)));
  return NextResponse.json({ ok: true });
}
