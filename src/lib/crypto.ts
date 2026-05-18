// Web Crypto helpers — work in Cloudflare Workers and Node runtimes.
// No external deps.

const textEncoder = new TextEncoder();

function bytesToHex(buf: ArrayBuffer | Uint8Array): string {
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * Build a Uint8Array backed by a concrete ArrayBuffer so it satisfies
 * Web Crypto's BufferSource type under strict TS (TS 5.7+ distinguishes
 * Uint8Array<ArrayBuffer> from Uint8Array<ArrayBufferLike>).
 */
function hexToBytes(hex: string): Uint8Array {
  const buf = new ArrayBuffer(hex.length / 2);
  const out = new Uint8Array(buf);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

/** Encode UTF-8 into a Uint8Array<ArrayBuffer> (BufferSource-safe). */
function utf8(s: string): Uint8Array {
  const bytes = textEncoder.encode(s);
  // Copy into a fresh ArrayBuffer-backed view to satisfy strict typings.
  const buf = new ArrayBuffer(bytes.byteLength);
  const view = new Uint8Array(buf);
  view.set(bytes);
  return view;
}

/** Random hex string of N bytes. */
export function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return bytesToHex(arr);
}

/** Cryptographically random id (cuid-ish, 24 chars). */
export function newId(): string {
  return randomHex(12);
}

/** PBKDF2-SHA256 password hash. Returns hex string. */
export async function hashPassword(
  password: string,
  saltHex: string,
  iterations = 100_000,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return bytesToHex(bits);
}

/** Constant-time hex string comparison. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** HMAC-SHA256 over `data` with `secret`. Returns hex. */
export async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    utf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, utf8(data));
  return bytesToHex(sig);
}

/** Base64url-encode a UTF-8 string. */
export function b64urlEncode(str: string): string {
  const bytes = textEncoder.encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(str: string): string {
  const pad = str.length % 4 === 0 ? 0 : 4 - (str.length % 4);
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
