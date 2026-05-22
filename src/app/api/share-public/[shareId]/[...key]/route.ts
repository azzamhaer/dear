import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { bucket, db } from "@/lib/cloudflare";
import { media, memories, shares } from "@/db/schema";

export const runtime = "edge";

/**
 * Public, share-token-gated media proxy.
 * Validates that the share exists, is not expired, and that the requested
 * R2 key actually belongs to the shared resource (memory or album).
 * Then streams the R2 object back. No session required.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string; key: string[] }> },
) {
  const { shareId, key: segments } = await params;
  const r2Key = segments.map(decodeURIComponent).join("/");

  const d = db();
  const [share] = await d
    .select()
    .from(shares)
    .where(eq(shares.id, shareId))
    .limit(1);
  if (!share) return new Response("Not found", { status: 404 });

  // Expiry check
  if (share.expiresAt) {
    const exp =
      share.expiresAt instanceof Date
        ? share.expiresAt.getTime()
        : (share.expiresAt as unknown as number) * 1000;
    if (exp < Date.now()) {
      return new Response("Expired", { status: 410 });
    }
  }

  // Verify the media key belongs to this share's content.
  let allowed = false;
  if (share.kind === "memory") {
    const [m] = await d
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.memoryId, share.refId), eq(media.r2Key, r2Key)))
      .limit(1);
    allowed = !!m;
  } else if (share.kind === "album") {
    const [m] = await d
      .select({ id: media.id })
      .from(media)
      .innerJoin(memories, eq(memories.id, media.memoryId))
      .where(and(eq(memories.albumId, share.refId), eq(media.r2Key, r2Key)))
      .limit(1);
    allowed = !!m;
  }

  if (!allowed) return new Response("Forbidden", { status: 403 });

  const obj = await bucket().get(r2Key);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("etag", obj.httpEtag);
  headers.set("cache-control", "public, max-age=86400");

  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === obj.httpEtag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(obj.body, { headers });
}
