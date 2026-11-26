"use client";

import ShareInviteButton from "./ShareInviteButton";

import { useEffect, useState } from "react";
import { getObsSettings, downloadObsProfile, type ObsSettings } from "@/lib/api";
import { getHostKey, hostLink } from "@/lib/host-session";

interface Props {
  roomName: string;
  onClose: () => void;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label className="text-xs font-medium text-neutral-400">{label}</label>
      <div className="mt-1 flex items-stretch gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded-md bg-white/10 px-2 py-1.5 text-xs text-white hover:bg-white/20"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function ObsPanel({ roomName, onClose }: Props) {
  const [obs, setObs] = useState<ObsSettings | null>(null);
  const [failure, setError] = useState("");
  const [hostKey] = useState(() => getHostKey(roomName));
  const error = hostKey ? failure : "Only the host can stream from OBS";

  useEffect(() => {
    if (!hostKey) return;
    getObsSettings(roomName, hostKey).then(setObs).catch((e) => setError(e.message));
  }, [roomName, hostKey]);

  function download(os: "win" | "mac") {
    if (!hostKey) return;
    downloadObsProfile(roomName, hostKey, os).catch((e) => setError(e.message));
  }

  return (
    <div className="flex w-80 flex-col border-l border-white/10 bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Stream from OBS</h2>
        <button
          onClick={onClose}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <p className="text-xs text-neutral-400">
          Broadcast from OBS instead of your browser. The fastest way is the
          ready-to-use profile — it has the server and stream key baked in.
        </p>

        {error && (
          <div className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Option A — download profile */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            1 · Import a profile
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => download("win")}
              disabled={!obs}
              className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
            >
              Windows profile
            </button>
            <button
              onClick={() => download("mac")}
              disabled={!obs}
              className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-center text-xs font-medium text-white hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
            >
              macOS profile
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Unzip, then in OBS: <span className="text-neutral-300">Profile →
            Import</span>, pick the folder, and switch to it.
          </p>
        </div>

        {/* Option B — manual */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            or · Enter manually
          </div>
          <p className="text-xs text-neutral-500">
            OBS: <span className="text-neutral-300">Settings → Stream</span>,
            Service = <span className="text-neutral-300">WHIP</span>, then paste:
          </p>
          <CopyRow label="Server" value={obs?.whipUrl ?? ""} />
          <CopyRow label="Bearer Token (Stream Key)" value={obs?.streamKey ?? ""} />
        </div>

        {/* Host link */}
        {hostKey && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Host link
            </div>
            <p className="text-xs text-neutral-500">
              Opens this stream as host on another device, for 24 hours. Anyone with
              it is a host: share the Invite link with viewers instead.
            </p>
            <CopyRow label="Host link" value={hostLink(roomName, hostKey)} />
            <ShareInviteButton roomName={roomName} hostKey={hostKey} />
          </div>
        )}

        {/* Go live */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            2 · Start Streaming
          </div>
          <p className="text-xs text-neutral-500">
            Click <span className="text-neutral-300">Start Streaming</span> in
            OBS. Your feed appears on the stage and viewers see it live.
          </p>
        </div>
      </div>
    </div>
  );
}
