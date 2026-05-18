import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { users } from "@/db/schema";
import { constantTimeEqual, hashPassword } from "@/lib/crypto";
import { createSession } from "@/lib/session";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { error: "missing_credentials" },
      { status: 400 },
    );
  }

  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.username, body.username.trim().toLowerCase()))
    .limit(1);

  if (!user) {
    // Dummy hash to keep response time stable
    await hashPassword(body.password, "00".repeat(16));
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const expected = await hashPassword(body.password, user.passwordSalt);
  if (!constantTimeEqual(expected, user.passwordHash)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
}
