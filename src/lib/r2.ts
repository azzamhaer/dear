import { bucket } from "./cloudflare";
import { newId } from "./crypto";

const IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp|avif|heic|heif)$/i;
const VIDEO_MIME = /^video\/(mp4|quicktime|webm|x-matroska)$/i;

export function detectKind(mimeType: string): "image" | "video" | null {
  if (IMAGE_MIME.test(mimeType)) return "image";
  return null;
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/gif": "gif",
    "image/heic": "heic",
    "image/heif": "heif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/webm": "webm",
    "video/x-matroska": "mkv",
  };
  return map[mime.toLowerCase()] ?? "bin";
}

/** Build a stable R2 key for an upload. */
export function makeKey(mimeType: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `media/${yyyy}/${mm}/${newId()}.${extFromMime(mimeType)}`;
}

export interface UploadResult {
  key: string;
  size: number;
  mimeType: string;
}

export async function putMedia(
  file: File | Blob,
  mimeType: string,
): Promise<UploadResult> {
  const key = makeKey(mimeType);
  const body = await file.arrayBuffer();
  await bucket().put(key, body, {
    httpMetadata: {
      contentType: mimeType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  return { key, size: body.byteLength, mimeType };
}

export async function deleteMedia(key: string): Promise<void> {
  await bucket().delete(key);
}

export async function getMedia(key: string): Promise<R2ObjectBody | null> {
  const obj = await bucket().get(key);
  return obj;
}

// Re-export so existing server-side imports keep working.
export { mediaUrl } from "./media-url";
