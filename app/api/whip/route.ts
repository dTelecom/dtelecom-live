import { NextRequest, NextResponse } from "next/server";
import { getCloud, clientIp } from "@/lib/cloud";
import { verifyStreamKey, nodeWhipUrl } from "@/lib/obs-key";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * OBS WHIP ingest, Frogy-style. OBS POSTs its SDP here with
 * `Authorization: Bearer <stream key>`. We verify the key, mint a fresh
 * publish token for the `obs-<room>` participant, resolve the nearest SFU node,
 * and 307-redirect to that node's native `/whip` endpoint. We redirect *before*
 * reading the body, so OBS re-sends its SDP (and Bearer) straight to the node —
 * the node uses the Bearer value as its session key, exactly like Frogy.
 */
async function handle(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const streamKey = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!streamKey) {
    return NextResponse.json(
      { error: "missing stream key" },
      { status: 401, headers: CORS },
    );
  }

  const room = verifyStreamKey(streamKey);
  if (!room) {
    return NextResponse.json(
      { error: "invalid stream key" },
      { status: 401, headers: CORS },
    );
  }

  // Publish-only token for the OBS ingest. The cloud picks the nearest node.
  const { token, wsUrl } = await getCloud().createToken({
    room,
    identity: `obs-${room}`,
    name: "OBS",
    // role: host so the OBS ingest isn't counted as a viewer.
    metadata: JSON.stringify({ role: "host" }),
    ttl: "12h",
    clientIp: clientIp(req.headers),
    grants: { canSubscribe: false },
  });
  const target = `${nodeWhipUrl(wsUrl)}?access_token=${encodeURIComponent(token)}`;

  // 307 preserves method + body; OBS re-sends its SDP to the node.
  return NextResponse.redirect(target, { status: 307, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e: unknown) {
    console.error("[whip] ERROR:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "WHIP error" },
      { status: 500, headers: CORS },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e: unknown) {
    console.error("[whip] DELETE ERROR:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "WHIP error" },
      { status: 500, headers: CORS },
    );
  }
}
