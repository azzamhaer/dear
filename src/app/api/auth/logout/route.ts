import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export const runtime = "edge";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
