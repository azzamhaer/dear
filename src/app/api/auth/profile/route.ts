import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";

export const runtime = "edge";

export async function PATCH(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const body = (await req.json().catch(() => null)) as
    | { displayName?: string; avatarKey?: string | null; bio?: string | null }
    | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const updates: Record<string, unknown> = {};
  if (typeof body.displayName === "string") {
    const dn = body.displayName.trim();
    if (!dn) {
      return NextResponse.json({ error: "empty_name" }, { status: 400 });
    }
    if (dn.length > 60) {
      return NextResponse.json({ error: "name_too_long" }, { status: 400 });
    }
    updates.displayName = dn;
  }
  if (body.avatarKey !== undefined) {
    updates.avatarUrl = body.avatarKey
      ? `/api/media/${encodeURI(body.avatarKey)}`
      : null;
  }
  if (body.bio !== undefined) {
    const b = (body.bio ?? "").toString().trim();
    if (b.length > 300) {
      return NextResponse.json({ error: "bio_too_long" }, { status: 400 });
    }
    updates.bio = b || null;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }
  await db().update(users).set(updates).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
