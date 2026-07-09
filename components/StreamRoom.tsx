"use client";

import {
  useTracks,
  useParticipants,
  ParticipantTile,
  RoomAudioRenderer,
} from "@dtelecom/components-react";
import { Track } from "@dtelecom/livekit-client";
import { useState } from "react";
import type { Role, ParticipantMeta } from "@/lib/types";
import CustomControlBar from "./CustomControlBar";
import ViewerListPanel from "./ViewerListPanel";
import ChatPanel from "./ChatPanel";
import ObsPanel from "./ObsPanel";
import ConnectionStateOverlay from "./ConnectionStateOverlay";

type SidebarTab = "none" | "viewers" | "chat" | "obs";

/** The WHIP/OBS ingest joins as a separate participant `obs-<room>`. */
const isObs = (identity: string) =>
  identity.startsWith("obs-") || identity.startsWith("obs_");

function roleOf(metadata: string | undefined): Role {
  try {
    return (JSON.parse(metadata || "{}") as ParticipantMeta).role ?? "viewer";
  } catch {
    return "viewer";
  }
}

export default function StreamRoom({
  roomName,
  role,
}: {
  roomName: string;
  role: Role;
}) {
  const isHost = role === "host";
  const [sidebar, setSidebar] = useState<SidebarTab>("none");

  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // Stage priority: OBS feed > screen share > host camera. The host camera
  // becomes a picture-in-picture whenever it isn't the main track.
  const obsTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && isObs(t.participant.identity),
  );
  const screenTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare,
  );
  const hostCamTrack = tracks.find(
    (t) => t.source === Track.Source.Camera && !isObs(t.participant.identity),
  );
  const main = obsTrack ?? screenTrack ?? hostCamTrack ?? null;
  const pip = hostCamTrack && hostCamTrack !== main ? hostCamTrack : null;

  const participants = useParticipants();
  const viewerCount = participants.filter(
    (p) => !isObs(p.identity) && roleOf(p.metadata) === "viewer",
  ).length;

  const live = !!main;

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      <div className="relative flex flex-1 flex-col">
        <ConnectionStateOverlay />

        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <div className="flex items-center gap-2">
            {live ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/15 px-2.5 py-1 text-xs font-medium text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                LIVE
              </span>
            ) : (
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-400">
                Offline
              </span>
            )}
            <span className="truncate text-sm font-medium text-white">
              {roomName}
            </span>
          </div>
          <span className="text-xs text-neutral-400">
            {viewerCount} watching
          </span>
        </div>

        <div
          className="relative flex-1 overflow-hidden p-2"
          data-lk-theme="default"
        >
          {main ? (
            <>
              <ParticipantTile
                {...main}
                focusToggleDisabled
                className="h-full w-full overflow-hidden rounded-lg"
              />
              {pip && (
                <div className="absolute bottom-4 right-4 aspect-video w-40 overflow-hidden rounded-lg border border-white/20 shadow-lg sm:w-56">
                  <ParticipantTile
                    {...pip}
                    focusToggleDisabled
                    disableSpeakingIndicator
                    className="h-full w-full"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-lg font-medium text-white">
                {isHost ? "You're live" : "Waiting for the host"}
              </p>
              <p className="mt-1 max-w-xs text-sm text-neutral-400">
                {isHost
                  ? "Turn on your camera, share your screen, or connect OBS to start broadcasting."
                  : "The stream hasn't started yet. Hang tight — it'll appear here."}
              </p>
            </div>
          )}
        </div>

        <RoomAudioRenderer />

        <CustomControlBar
          role={role}
          roomName={roomName}
          onToggleViewers={() =>
            setSidebar((s) => (s === "viewers" ? "none" : "viewers"))
          }
          onToggleChat={() =>
            setSidebar((s) => (s === "chat" ? "none" : "chat"))
          }
          onToggleObs={() =>
            setSidebar((s) => (s === "obs" ? "none" : "obs"))
          }
          viewersOpen={sidebar === "viewers"}
          chatOpen={sidebar === "chat"}
          obsOpen={sidebar === "obs"}
        />
      </div>

      {sidebar === "viewers" && isHost && (
        <ViewerListPanel
          roomName={roomName}
          onClose={() => setSidebar("none")}
        />
      )}
      {sidebar === "obs" && isHost && (
        <ObsPanel roomName={roomName} onClose={() => setSidebar("none")} />
      )}
      {sidebar === "chat" && <ChatPanel onClose={() => setSidebar("none")} />}
    </div>
  );
}
