"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [streamName, setStreamName] = useState("");
  const [identity, setIdentity] = useState("");

  function goLive() {
    if (!streamName.trim() || !identity.trim()) return;
    const params = new URLSearchParams({
      room: streamName.trim(),
      identity: identity.trim(),
      role: "host",
    });
    router.push(`/prejoin?${params}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-white">dTelecom Live</h1>
        <p className="mb-8 text-sm text-neutral-400">
          Start a livestream — broadcast from your browser or OBS, and invite
          viewers to watch.
        </p>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Stream name"
            value={streamName}
            onChange={(e) => setStreamName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goLive()}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Your name"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goLive()}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={goLive}
          disabled={!streamName.trim() || !identity.trim()}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Go Live
        </button>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Viewers join through the invite link you share once you&apos;re live.
        </p>
      </div>
    </main>
  );
}
