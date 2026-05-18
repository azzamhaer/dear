import { getRequestContext } from "@cloudflare/next-on-pages";
import { makeDb, type DB } from "@/db";

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  SESSION_SECRET: string;
}

/**
 * Get the Cloudflare bindings for the current request.
 * Works in both edge runtime production and `next dev` with wrangler.
 */
export function env(): Env {
  const ctx = getRequestContext();
  return ctx.env as unknown as Env;
}

export function db(): DB {
  return makeDb(env().DB);
}

export function bucket(): R2Bucket {
  return env().MEDIA;
}
