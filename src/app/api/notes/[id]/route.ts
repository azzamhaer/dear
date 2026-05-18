import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { notes } from "@/db/schema";
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
  const [n] = await db().select().from(notes).where(eq(notes.id, id)).limit(1);
  if (!n) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ item: n });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as
    | { title?: string; body?: string; pinned?: boolean }
    | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.body === "string") updates.body = body.body;
  if (typeof body.pinned === "boolean") updates.pinned = body.pinned;
  await db().update(notes).set(updates).where(eq(notes.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await db().delete(notes).where(eq(notes.id, id));
  return NextResponse.json({ ok: true });
}
