import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums } from "@/db/schema";
import { requireUser } from "@/lib/session";

export const runtime = "edge";

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
    | { name?: string; description?: string; coverMediaId?: string | null }
    | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (body.description !== undefined)
    updates.description = body.description?.trim() || null;
  if (body.coverMediaId !== undefined)
    updates.coverMediaId = body.coverMediaId || null;
  await db().update(albums).set(updates).where(eq(albums.id, id));
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
  await db().delete(albums).where(eq(albums.id, id));
  return NextResponse.json({ ok: true });
}
