import { NextRequest } from "next/server";
import { getMedia } from "@/lib/r2";
import { getCurrentUser } from "@/lib/session";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  // Private app — require auth to view media too.
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { key: segments } = await params;
  const key = segments.map(decodeURIComponent).join("/");
  const obj = await getMedia(key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "private, max-age=31536000, immutable");

  // Support conditional requests
  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === obj.httpEtag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(obj.body, { headers });
}
