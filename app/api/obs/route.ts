import { NextRequest, NextResponse } from "next/server";
import { signStreamKey, appOrigin } from "@/lib/obs-key";

/**
 * Returns the OBS WHIP credentials the host pastes (or downloads) into OBS.
 *
 * ⚠️ SECURITY — example-grade, not production.
 * This endpoint is UNAUTHENTICATED and the stream key is derived only from the
 * (public, guessable) room name. So anyone who knows the room name can call this
 * and obtain a working key to publish into that room as `obs-<room>` — i.e. they
 * could hijack or spoof the stream. The HMAC only stops *offline* forgery; it
 * does nothing once the key is handed out freely here. The key also can't be
 * revoked per-room without rotating `DTELECOM_API_SECRET` (which invalidates every room).
 *
 * To harden for production:
 *   1. Authenticate this request and confirm the caller owns the room (e.g.
 *      verify their host JWT / session before issuing a key).
 *   2. Bind the key to a per-room random secret you store and can rotate/revoke
 *      (KV/DB), instead of deriving it from the room name.
 *   3. Add an expiry to the key.
 */
export function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  if (!room) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  return NextResponse.json({
    whipUrl: `${appOrigin(req)}/api/whip`,
    streamKey: signStreamKey(room),
  });
}
