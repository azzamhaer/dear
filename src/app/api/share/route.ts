import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { shares } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { randomHex } from "@/lib/crypto";

export const runtime = "edge";

const VALID_KINDS = new Set(["memory", "note", "album", "letter"]);

function slug(): string {
  // 8 hex chars (~32-bit) — good enough for non-guessable, plus URL-friendly
  return randomHex(5).slice(0, 10);
}

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const rows = await db()
    .select()
    .from(shares)
    .where(eq(shares.createdBy, user.id))
    .orderBy(desc(shares.createdAt));
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const body = (await req.json().catch(() => null)) as
    | {
        kind?: string;
        refId?: string;
        anonymous?: boolean;
        includeComments?: boolean;
        theme?: string;
        expiresInDays?: number;
      }
    | null;

  if (!body || !body.kind || !body.refId) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!VALID_KINDS.has(body.kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  // Reuse existing share if same ref + creator (to prevent spam links)
  const existing = await db()
    .select()
    .from(shares)
    .where(eq(shares.refId, body.refId))
    .limit(1);

  const options = JSON.stringify({
    anonymous: !!body.anonymous,
    includeComments: !!body.includeComments,
    theme: body.theme ?? "rose",
  });

  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 24 * 3600 * 1000)
    : null;

  if (existing[0] && existing[0].createdBy === user.id) {
    // Update options for existing share
    await db()
      .update(shares)
      .set({ options, expiresAt })
      .where(eq(shares.id, existing[0].id));
    return NextResponse.json({ id: existing[0].id, reused: true });
  }

  const id = slug();
  await db().insert(shares).values({
    id,
    kind: body.kind,
    refId: body.refId,
    options,
    expiresAt,
    createdBy: user.id,
  });
  return NextResponse.json({ id });
}
