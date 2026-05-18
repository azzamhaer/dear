// Pure, client-safe URL helper for R2-backed media.
// Lives apart from r2.ts (which imports Cloudflare bindings) so it can be
// imported from "use client" components.

export function mediaUrl(key: string): string {
  return `/api/media/${encodeURI(key)}`;
}
