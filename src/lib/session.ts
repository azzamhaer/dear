import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, env } from "./cloudflare";
import { users, type User } from "@/db/schema";
import { b64urlDecode, b64urlEncode, constantTimeEqual, hmac } from "./crypto";

const COOKIE = "dear_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

interface SessionPayload {
  uid: string;
  iat: number; // issued-at, unix seconds
  exp: number; // expires-at
}

async function sign(payload: SessionPayload, secret: string): Promise<string> {
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = await hmac(body, secret);
  return `${body}.${sig}`;
}

async function verify(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await hmac(body, secret);
  if (!constantTimeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body)) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    uid: userId,
    iat: now,
    exp: now + MAX_AGE,
  };
  const token = await sign(payload, env().SESSION_SECRET);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  let secret: string;
  try {
    secret = env().SESSION_SECRET;
  } catch {
    return null;
  }
  if (!secret) return null;
  const payload = await verify(token, secret);
  if (!payload) return null;
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.id, payload.uid))
    .limit(1);
  return user ?? null;
}

/** Returns the current user or throws a 401 Response. */
export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) {
    throw new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return u;
}
