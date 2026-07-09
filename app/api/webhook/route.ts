import { WebhookReceiver } from "@dtelecom/server-sdk-js";
import { NextRequest, NextResponse } from "next/server";
import {
  incrementRoom,
  decrementRoom,
  clearRoom,
} from "@/lib/participant-count";

const receiver = new WebhookReceiver(
  process.env.API_KEY!,
  process.env.API_SECRET!,
);

// The pre-join count is "people watching", so only viewers count — not the
// host and not the OBS ingest (`obs-<room>`, metadata role "host").
function isViewer(identity: string | undefined, metadata: string | undefined): boolean {
  if (identity && (identity.startsWith("obs-") || identity.startsWith("obs_"))) {
    return false;
  }
  try {
    return JSON.parse(metadata || "{}").role === "viewer";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const authToken = req.headers.get("Authorization") ?? "";
    const event = await receiver.receive(body, authToken);

    const roomName = event.room?.name;
    if (!roomName) {
      return NextResponse.json({ ok: true });
    }

    switch (event.event) {
      case "participant_joined":
        if (isViewer(event.participant?.identity, event.participant?.metadata)) {
          incrementRoom(roomName);
          console.log("[webhook] viewer_joined in", roomName);
        }
        break;
      case "participant_left":
        if (isViewer(event.participant?.identity, event.participant?.metadata)) {
          decrementRoom(roomName);
          console.log("[webhook] viewer_left in", roomName);
        }
        break;
      case "room_finished":
        clearRoom(roomName);
        console.log("[webhook] room_finished:", roomName);
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[webhook] ERROR:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid webhook" },
      { status: 400 },
    );
  }
}
