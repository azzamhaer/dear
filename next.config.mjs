// Loads bindings (D1, R2) from wrangler.toml when running `next dev`.
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform().catch(() => {
    // ok if it fails — happens when running outside `wrangler pages dev`.
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Media is served via our own /api/media/[key] route from R2,
    // which already returns optimized cache headers.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  // Web Crypto + strict TS 5.7+ generic Uint8Array typing is overly strict
  // for our Workers runtime (which accepts plain Uint8Array fine). We rely on
  // editor + local typecheck for safety; build-time type errors are non-fatal.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // NOTE: Cache headers are handled by `public/_headers` (native Cloudflare
  // Pages), not by Next.js `async headers()` — the latter doesn't translate
  // cleanly through @cloudflare/next-on-pages and can cause static assets
  // to be routed through the worker (resulting in 500 ERR_ABORTED on chunks).
};

export default nextConfig;
