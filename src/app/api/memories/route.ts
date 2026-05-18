import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/cloudflare";
import { media, memories } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { newId } from "@/lib/crypto";
import { listMemories } from "@/lib/queries";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 30));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const albumId = searchParams.get("albumId") ?? undefined;
  const items = await listMemories({ limit, offset, albumId });
  return NextResponse.json({ items });
}

interface CreateBody {
  caption?: string;
  memoryDate: string; // ISO
  location?: string;
  mood?: string;
  albumId?: string | null;
  media: Array<{
    r2Key: string;
    kind: "image" | "video";
    mimeType: string;
    bytes?: number;
    width?: number;
    height?: number;
  }>;
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body || !body.memoryDate || !Array.isArray(body.media)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const id = newId();
  const memoryDate = new Date(body.memoryDate);
  if (Number.isNaN(memoryDate.getTime())) {
    return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  }

  const d = db();
  await d.insert(memories).values({
    id,
    authorId: user.id,
    caption: body.caption?.trim() ?? "",
    memoryDate,
    location: body.location?.trim() || null,
    mood: body.mood || null,
    albumId: body.albumId || null,
  });

  if (body.media.length > 0) {
    await d.insert(media).values(
      body.media.map((m, i) => ({
        id: newId(),
        memoryId: id,
        kind: m.kind,
        r2Key: m.r2Key,
        mimeType: m.mimeType,
        bytes: m.bytes ?? null,
        width: m.width ?? null,
        height: m.height ?? null,
        position: i,
      })),
    );
  }

  return NextResponse.json({ id });
}
