import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export const runtime = "edge";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  });
}
