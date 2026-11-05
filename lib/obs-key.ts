import crypto from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Stateless WHIP stream key: `<b64url(room)>.<b64url(HMAC-SHA256(secret, room))>`.
 *
 * The room is embedded in the key and the whole thing is signed with DTELECOM_API_SECRET,
 * so `/api/whip` can verify it and recover the room with zero storage — no DB,
 * no KV, nothing to provision on Vercel. The key is stable per room (reusable
 * across sessions) and can't be forged offline without the secret.
 *
 * ⚠️ This is example-grade. The HMAC prevents *offline* forgery, but the key is a
 * pure function of the (public) room name and `/api/obs` hands it out without
 * auth — so knowing the room name is enough to get a working key and publish as
 * `obs-<room>`. It also isn't revocable per-room. See the security notice in
 * `app/api/obs/route.ts` and the README for how to harden this for production.
 */

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function hmac(room: string): Buffer {
  const secret = process.env.DTELECOM_API_SECRET;
  if (!secret) throw new Error("DTELECOM_API_SECRET is not set");
  return crypto.createHmac("sha256", secret).update(room).digest();
}

export function signStreamKey(room: string): string {
  return `${b64url(Buffer.from(room, "utf8"))}.${b64url(hmac(room))}`;
}

export function verifyStreamKey(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 2) return null;
  let room: string;
  try {
    room = Buffer.from(parts[0], "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = b64url(hmac(room));
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return crypto.timingSafeEqual(a, b) ? room : null;
}

/** Public origin of this deployment, derived from the request (no config). */
export function appOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL || "localhost:3000");
  return `${proto}://${host}`;
}

/** Turn a `wss://node` SFU URL into its `https://node/whip` WHIP endpoint. */
export function nodeWhipUrl(wsUrl: string): string {
  const httpBase = wsUrl
    .replace(/^wss:\/\//, "https://")
    .replace(/^ws:\/\//, "http://")
    .replace(/\/+$/, "");
  return `${httpBase}/whip`;
}
