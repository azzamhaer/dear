import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { notes } from "@/db/schema";
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
    .from(notes)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const body = (await req.json().catch(() => null)) as
    | { title?: string; body?: string }
    | null;
  const id = newId();
  await db().insert(notes).values({
    id,
    authorId: user.id,
    title: body?.title?.trim() ?? "",
    body: body?.body ?? "",
    pinned: false,
  });
  return NextResponse.json({ id });
}
