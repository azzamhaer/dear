import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { constantTimeEqual, hashPassword, randomHex } from "@/lib/crypto";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const body = (await req.json().catch(() => null)) as
    | { currentPassword?: string; newPassword?: string }
    | null;
  if (!body?.currentPassword || !body?.newPassword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (body.newPassword.length < 8) {
    return NextResponse.json({ error: "too_short" }, { status: 400 });
  }

  // Verify current password
  const expected = await hashPassword(body.currentPassword, user.passwordSalt);
  if (!constantTimeEqual(expected, user.passwordHash)) {
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  // Hash new password
  const newSalt = randomHex(16);
  const newHash = await hashPassword(body.newPassword, newSalt);

  await db()
    .update(users)
    .set({ passwordHash: newHash, passwordSalt: newSalt })
    .where(eq(users.id, user.id));

  return NextResponse.json({ ok: true });
}
