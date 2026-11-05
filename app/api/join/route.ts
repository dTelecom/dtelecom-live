import { NextRequest, NextResponse } from "next/server";
import { getCloud, clientIp } from "@/lib/cloud";

function getWebhookUrl(): string | undefined {
  if (process.env.WEBHOOK_URL) return process.env.WEBHOOK_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/webhook`;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { room, identity, role = "viewer" } = await req.json();

    if (!room || !identity) {
      return NextResponse.json(
        { error: "room and identity are required" },
        { status: 400 },
      );
    }

    const isHost = role === "host";
    const metadata = JSON.stringify({ role: isHost ? "host" : "viewer" });
    const webhookUrl = getWebhookUrl();

    // The host publishes media; viewers are watch-only. The SFU enforces
    // canPublish server-side, so a viewer cannot send audio/video even with a
    // tampered client. Both can publish data (chat) and subscribe (watch).
    const { token, wsUrl } = await getCloud().createToken({
      room,
      identity,
      name: identity,
      metadata,
      clientIp: clientIp(req.headers),
      webhookUrls: webhookUrl ? [webhookUrl] : undefined,
      grants: { canPublish: isHost, roomAdmin: isHost },
    });

    return NextResponse.json({ token, wsUrl });
  } catch (e: unknown) {
    console.error("[join] ERROR:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}
