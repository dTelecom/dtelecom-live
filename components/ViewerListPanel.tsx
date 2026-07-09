"use client";

import {
  useParticipants,
  useLocalParticipant,
} from "@dtelecom/components-react";
import type { ParticipantMeta } from "@/lib/types";
import { kickParticipant } from "@/lib/api";

interface Props {
  roomName: string;
  onClose: () => void;
}

const isObs = (identity: string) =>
  identity.startsWith("obs-") || identity.startsWith("obs_");

function roleOf(metadata: string | undefined): string {
  try {
    return (JSON.parse(metadata || "{}") as ParticipantMeta).role ?? "viewer";
  } catch {
    return "viewer";
  }
}

export default function ViewerListPanel({ roomName, onClose }: Props) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  // Everyone who isn't the OBS ingest and isn't a host is a viewer.
  const viewers = participants.filter(
    (p) => !isObs(p.identity) && roleOf(p.metadata) === "viewer",
  );

  async function handleKick(identity: string) {
    if (!confirm(`Remove ${identity} from the stream?`)) return;
    try {
      await kickParticipant(roomName, identity, "host");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to remove viewer");
    }
  }

  return (
    <div className="flex w-72 flex-col border-l border-white/10 bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">
          Viewers ({viewers.length})
        </h2>
        <button
          onClick={onClose}
          className="text-sm text-neutral-400 hover:text-white"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {viewers.length === 0 && (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No viewers yet. Share the invite link to bring people in.
          </p>
        )}
        {viewers.map((p) => {
          const isLocal = p.identity === localParticipant.identity;
          return (
            <div
              key={p.identity}
              className="flex items-center justify-between border-b border-white/5 px-4 py-2.5"
            >
              <span className="truncate text-sm text-white">
                {p.name || p.identity}
                {isLocal && (
                  <span className="ml-2 text-xs text-neutral-500">(You)</span>
                )}
              </span>
              {!isLocal && (
                <button
                  onClick={() => handleKick(p.identity)}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  title="Remove"
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
