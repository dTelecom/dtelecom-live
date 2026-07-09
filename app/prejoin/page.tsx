"use client";

import { PreJoin } from "@dtelecom/components-react";
import type { LocalUserChoices } from "@dtelecom/components-react";
import "@dtelecom/components-styles";
import { useRouter, useSearchParams } from "next/navigation";
import { joinRoom, getRoomCount } from "@/lib/api";
import { useState, useEffect, Suspense } from "react";

function ViewerCount({ count }: { count: number | null }) {
  if (count === null) return null;
  return (
    <p className="mt-1 text-sm text-neutral-400">
      {count
        ? `${count} ${count === 1 ? "person" : "people"} watching`
        : "Be the first to watch"}
    </p>
  );
}

function storeSession(
  room: string,
  data: { token: string; wsUrl: string; audioEnabled: boolean; videoEnabled: boolean; role: string },
) {
  sessionStorage.setItem(`room:${room}`, JSON.stringify(data));
}

/** Host: preview camera/mic, then go live. */
function HostPreJoin({ room, identity }: { room: string; identity: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(choices: LocalUserChoices) {
    setError("");
    setLoading(true);
    try {
      const name = choices.username || identity;
      if (!name) {
        setError("Please enter your name");
        setLoading(false);
        return;
      }
      const { token, wsUrl } = await joinRoom(room, name, "host");
      storeSession(room, {
        token,
        wsUrl,
        audioEnabled: choices.audioEnabled,
        videoEnabled: choices.videoEnabled,
        role: "host",
      });
      router.push(`/room/${encodeURIComponent(room)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start stream");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a]">
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold text-white">Going live: {room}</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Preview your camera and microphone before you start
        </p>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      <div data-lk-theme="default">
        <PreJoin
          onSubmit={handleSubmit}
          onError={(err) => setError(err.message)}
          defaults={{
            username: identity,
            videoEnabled: true,
            audioEnabled: true,
          }}
          joinLabel={loading ? "Starting..." : "Go Live"}
        />
      </div>
    </div>
  );
}

/** Viewer: name-only, no device preview. */
function ViewerJoin({ room, identity }: { room: string; identity: string }) {
  const router = useRouter();
  const [name, setName] = useState(identity);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!room) return;
    getRoomCount(room).then(setCount);
    const interval = setInterval(() => {
      getRoomCount(room).then(setCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [room]);

  async function watch() {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { token, wsUrl } = await joinRoom(room, name.trim(), "viewer");
      storeSession(room, {
        token,
        wsUrl,
        audioEnabled: false,
        videoEnabled: false,
        role: "viewer",
      });
      router.push(`/room/${encodeURIComponent(room)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join stream");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/15 px-3 py-1 text-xs font-medium text-red-400">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            LIVE
          </span>
          <h1 className="mt-3 text-xl font-bold text-white">{room}</h1>
          <ViewerCount count={count} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && watch()}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
        />
        <button
          onClick={watch}
          disabled={!name.trim() || loading}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Joining..." : "Watch stream"}
        </button>
      </div>
    </div>
  );
}

function PreJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "";
  const identity = searchParams.get("identity") || "";
  const role = searchParams.get("role") || "viewer";

  if (!room) {
    router.push("/");
    return null;
  }

  return role === "host" ? (
    <HostPreJoin room={room} identity={identity} />
  ) : (
    <ViewerJoin room={room} identity={identity} />
  );
}

export default function PreJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
          Loading...
        </div>
      }
    >
      <PreJoinContent />
    </Suspense>
  );
}
