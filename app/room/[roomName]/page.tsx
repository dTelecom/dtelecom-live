"use client";

import { LiveKitRoom } from "@dtelecom/components-react";
import "@dtelecom/components-styles";
import { useRouter } from "next/navigation";
import StreamRoom from "@/components/StreamRoom";
import type { Role } from "@/lib/types";
import { Suspense, use, useState, useEffect } from "react";

interface RoomSession {
  token: string;
  wsUrl: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  role: Role;
}

function RoomContent({ roomName }: { roomName: string }) {
  const router = useRouter();
  const [session, setSession] = useState<RoomSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(`room:${roomName}`);
    if (stored) {
      setSession(JSON.parse(stored));
      sessionStorage.removeItem(`room:${roomName}`);
    }
    setChecked(true);
  }, [roomName]);

  if (!checked) return null;

  if (!session) {
    router.push("/");
    return null;
  }

  return (
    <LiveKitRoom
      token={session.token}
      serverUrl={session.wsUrl}
      connect={true}
      audio={session.audioEnabled}
      video={session.videoEnabled}
      onDisconnected={() => router.push("/")}
      onError={(err) => console.error("Room error:", err)}
      onMediaDeviceFailure={(failure) => {
        console.error("Media device failure:", failure);
        alert(
          "Could not access camera or microphone. Please check your browser permissions.",
        );
      }}
    >
      <StreamRoom roomName={roomName} role={session.role} />
    </LiveKitRoom>
  );
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomName: string }>;
}) {
  const { roomName } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
          Connecting...
        </div>
      }
    >
      <RoomContent roomName={decodeURIComponent(roomName)} />
    </Suspense>
  );
}
