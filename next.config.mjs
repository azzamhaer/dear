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
};

export default nextConfig;
