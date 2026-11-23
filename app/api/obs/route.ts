import { NextRequest, NextResponse } from "next/server";
import { signStreamKey, appOrigin } from "@/lib/obs-key";
import { verifyHostKey } from "@/lib/host-key";

/**
 * Returns the OBS WHIP settings for the host: the server URL and the stream key OBS sends as its
 * Bearer token. Only the host (a valid host key for the room) gets them, so knowing the room name
 * is not enough to publish into the stream.
 */
export async function POST(req: NextRequest) {
  const { room, hostKey } = await req.json().catch(() => ({}));
  if (!room) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }
  if (!verifyHostKey(room, hostKey)) {
    return NextResponse.json({ error: "Only the host can get the OBS settings" }, { status: 403 });
  }

  return NextResponse.json({
    whipUrl: `${appOrigin(req)}/api/whip`,
    streamKey: signStreamKey(room),
  });
}
