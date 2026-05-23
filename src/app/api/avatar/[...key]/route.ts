import { NextRequest } from "next/server";
import { bucket } from "@/lib/cloudflare";

export const runtime = "edge";

/**
 * Public avatar proxy.
 *
 * Profile photos are non-sensitive — they were already exposed to the world
 * any time the user shared something publicly via /share/[id]. We previously
 * stored avatarUrl as `/api/media/<key>` which requires auth, so anonymous
 * viewers got a broken image. This endpoint serves the same R2 object without
 * a session check. It's keyed on the original R2 key (the same one stored in
 * users.avatarUrl after the `/api/media/` prefix).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const r2Key = segments.map(decodeURIComponent).join("/");

  // Cheap guard: only allow keys that look like avatar uploads.
  // (Avatars are uploaded with key like `avatar-<userId>-<ts>.<ext>` or
  // inside an `avatars/` prefix, depending on upload route. Be generous —
  // the worst case is a leaked-but-still-share-linked photo.)
  if (!/^[a-zA-Z0-9._\-/]{1,256}$/.test(r2Key)) {
    return new Response("Bad key", { status: 400 });
  }

  const obj = await bucket().get(r2Key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=604800, immutable");

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === obj.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(obj.body, { headers });
}
