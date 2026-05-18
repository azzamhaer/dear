import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DB = DrizzleD1Database<typeof schema>;

/** Build a Drizzle client from a D1Database binding. */
export function makeDb(d1: D1Database): DB {
  return drizzle(d1, { schema });
}

export { schema };
