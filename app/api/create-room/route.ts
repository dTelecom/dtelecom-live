import { NextRequest, NextResponse } from "next/server";
import { newRoomName, signHostKey } from "@/lib/host-key";

/**
 * Starts a stream: the server picks an unguessable room name and returns the host key for it.
 * The browser keeps the key (sessionStorage, or the #host= part of the host link); /api/join
 * gives host rights only to a request that carries a valid key for that room.
 */
export async function POST(req: NextRequest) {
  const { title } = await req.json().catch(() => ({}));
  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const room = newRoomName(title.trim());
  return NextResponse.json({ room, hostKey: signHostKey(room) });
}
