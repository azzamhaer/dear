/**
 * Seed two users into your local or remote D1 database.
 *
 * Usage:
 *   # Local (against `wrangler dev` / `--local` D1):
 *   tsx scripts/seed-users.ts --local
 *
 *   # Remote (against deployed D1):
 *   tsx scripts/seed-users.ts --remote
 *
 * Reads credentials from env vars (.env or .dev.vars):
 *   SEED_USER_1_USERNAME, SEED_USER_1_DISPLAY_NAME, SEED_USER_1_PASSWORD
 *   SEED_USER_2_USERNAME, SEED_USER_2_DISPLAY_NAME, SEED_USER_2_PASSWORD
 *
 * Under the hood this prints SQL INSERT statements that you pipe into
 * `wrangler d1 execute`. It uses Web Crypto for hashing so the script
 * doesn't depend on Node-only crypto.
 */
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = new Set(process.argv.slice(2));
const isRemote = args.has("--remote");
const isLocal = args.has("--local");
if (!isRemote && !isLocal) {
  console.error("Pass --local or --remote");
  process.exit(1);
}

function envRequired(key: string): string {
  const v = process.env[key];
  if (!v) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
  return v;
}

function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function hash(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations: 100_000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return bytesToHex(bits);
}

function randHex(n: number): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return bytesToHex(a);
}

async function buildInsert(slot: 1 | 2): Promise<string> {
  const username = envRequired(`SEED_USER_${slot}_USERNAME`);
  const displayName = envRequired(`SEED_USER_${slot}_DISPLAY_NAME`);
  const password = envRequired(`SEED_USER_${slot}_PASSWORD`);
  const salt = randHex(16);
  const hashHex = await hash(password, salt);
  const id = randHex(12);
  return `INSERT OR REPLACE INTO users (id, username, display_name, password_hash, password_salt)
VALUES ('${id}', '${username.replace(/'/g, "''")}', '${displayName.replace(/'/g, "''")}', '${hashHex}', '${salt}');`;
}

async function main() {
  const sql = [await buildInsert(1), await buildInsert(2)].join("\n\n");
  const dir = mkdtempSync(join(tmpdir(), "dear-seed-"));
  const file = join(dir, "seed-users.sql");
  writeFileSync(file, sql, "utf8");

  const flag = isRemote ? "--remote" : "--local";
  console.log(`Running wrangler d1 execute dear-db ${flag} --file=${file}`);
  try {
    execSync(
      `npx wrangler d1 execute dear-db ${flag} --file=${file}`,
      { stdio: "inherit" },
    );
    console.log("\n✓ Seeded users.");
  } finally {
    try { unlinkSync(file); } catch { /* ignore */ }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
