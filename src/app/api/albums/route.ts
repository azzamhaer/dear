import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { albums } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { newId } from "@/lib/crypto";
import { slugify } from "@/lib/utils";

export const runtime = "edge";

export async function GET() {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const items = await db()
    .select()
    .from(albums)
    .orderBy(desc(albums.updatedAt));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const body = (await req.json().catch(() => null)) as
    | { name?: string; description?: string }
    | null;
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "missing_name" }, { status: 400 });
  }

  const id = newId();
  const slug = `${slugify(body.name)}-${id.slice(0, 4)}`;
  await db().insert(albums).values({
    id,
    name: body.name.trim(),
    slug,
    description: body.description?.trim() || null,
  });
  return NextResponse.json({ id, slug });
}
