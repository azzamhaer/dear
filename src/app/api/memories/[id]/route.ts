import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { media, memories } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { getMemory } from "@/lib/queries";
import { deleteMedia } from "@/lib/r2";

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
  const item = await getMemory(id);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ item });
}

interface PatchBody {
  caption?: string;
  memoryDate?: string;
  location?: string | null;
  mood?: string | null;
  albumId?: string | null;
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
  const body = (await req.json().catch(() => null)) as PatchBody | null;
  if (!body) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.caption === "string") updates.caption = body.caption.trim();
  if (typeof body.memoryDate === "string") {
    const dt = new Date(body.memoryDate);
    if (Number.isNaN(dt.getTime())) {
      return NextResponse.json({ error: "invalid_date" }, { status: 400 });
    }
    updates.memoryDate = dt;
  }
  if (body.location !== undefined)
    updates.location = body.location?.toString().trim() || null;
  if (body.mood !== undefined) updates.mood = body.mood || null;
  if (body.albumId !== undefined) updates.albumId = body.albumId || null;

  await db().update(memories).set(updates).where(eq(memories.id, id));
  const updated = await getMemory(id);
  return NextResponse.json({ item: updated });
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
  const d = db();
  // Get media to delete from R2 first
  const mediaRows = await d
    .select()
    .from(media)
    .where(eq(media.memoryId, id));

  await d.delete(memories).where(eq(memories.id, id));
  // Media rows cascade. R2 needs explicit deletes.
  await Promise.all(mediaRows.map((m) => deleteMedia(m.r2Key).catch(() => {})));
  return NextResponse.json({ ok: true });
}
