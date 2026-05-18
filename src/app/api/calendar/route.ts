import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { memoriesCountByDay } from "@/lib/queries";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year") ?? now.getUTCFullYear());
  const month = Number(searchParams.get("month") ?? now.getUTCMonth() + 1);
  const counts = await memoriesCountByDay(year, month);
  return NextResponse.json({ year, month, counts });
}
