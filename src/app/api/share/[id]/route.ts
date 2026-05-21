import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/cloudflare";
import { shares } from "@/db/schema";
import { requireUser } from "@/lib/session";

export const runtime = "edge";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { id } = await params;
  await db()
    .delete(shares)
    .where(and(eq(shares.id, id), eq(shares.createdBy, user.id)));
  return NextResponse.json({ ok: true });
}
