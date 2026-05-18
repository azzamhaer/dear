import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { reactions } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { newId } from "@/lib/crypto";
import { REACTION_EMOJIS } from "@/lib/utils";

export const runtime = "edge";

export async function POST(
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
    | { emoji?: string }
    | null;
  if (!body?.emoji || !(REACTION_EMOJIS as readonly string[]).includes(body.emoji)) {
    return NextResponse.json({ error: "invalid_emoji" }, { status: 400 });
  }

  const d = db();
  const existing = await d
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.memoryId, id),
        eq(reactions.userId, user.id),
        eq(reactions.emoji, body.emoji),
      ),
    )
    .limit(1);

  if (existing[0]) {
    // toggle off
    await d.delete(reactions).where(eq(reactions.id, existing[0].id));
    return NextResponse.json({ toggled: "off" });
  }

  await d.insert(reactions).values({
    id: newId(),
    memoryId: id,
    userId: user.id,
    emoji: body.emoji,
  });
  return NextResponse.json({ toggled: "on" });
}
