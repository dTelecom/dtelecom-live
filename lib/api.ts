import type { JoinResponse } from "./types";

export async function joinRoom(
  room: string,
  identity: string,
  role: string,
): Promise<JoinResponse> {
  const res = await fetch("/api/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room, identity, role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to join room");
  }
  return res.json();
}

export async function kickParticipant(
  room: string,
  identity: string,
  callerRole: string,
): Promise<void> {
  const res = await fetch("/api/kick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ room, identity, callerRole }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to kick participant");
  }
}

export async function getRoomCount(room: string): Promise<number> {
  const res = await fetch(`/api/room-count?room=${encodeURIComponent(room)}`);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export interface ObsSettings {
  whipUrl: string;
  streamKey: string;
  profileUrl: (os: "win" | "mac") => string;
}

export async function getObsSettings(room: string): Promise<ObsSettings> {
  const res = await fetch(`/api/obs?room=${encodeURIComponent(room)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to load OBS settings");
  }
  const data = await res.json();
  return {
    whipUrl: data.whipUrl,
    streamKey: data.streamKey,
    profileUrl: (os) =>
      `/api/obs/profile?room=${encodeURIComponent(room)}&os=${os}`,
  };
}
