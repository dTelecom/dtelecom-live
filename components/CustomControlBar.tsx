"use client";

import { ControlBar, DisconnectButton } from "@dtelecom/components-react";
import type { Role } from "@/lib/types";
import ShareInviteButton from "./ShareInviteButton";

interface Props {
  role: Role;
  roomName: string;
  onToggleViewers: () => void;
  onToggleChat: () => void;
  onToggleObs: () => void;
  viewersOpen: boolean;
  chatOpen: boolean;
  obsOpen: boolean;
}

export default function CustomControlBar({
  role,
  roomName,
  onToggleViewers,
  onToggleChat,
  onToggleObs,
  viewersOpen,
  chatOpen,
  obsOpen,
}: Props) {
  const isHost = role === "host";

  return (
    <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-[#141414] px-4 py-2">
      {isHost ? (
        <>
          <ControlBar variation="minimal" />
          <div className="mx-2 h-6 w-px bg-white/10" />
          <button
            onClick={onToggleObs}
            className={`lk-button ${obsOpen ? "lk-button-active" : ""}`}
            title="Stream from OBS"
          >
            OBS
          </button>
          <button
            onClick={onToggleViewers}
            className={`lk-button ${viewersOpen ? "lk-button-active" : ""}`}
            title="Viewers"
          >
            Viewers
          </button>
          <button
            onClick={onToggleChat}
            className={`lk-button ${chatOpen ? "lk-button-active" : ""}`}
            title="Chat"
          >
            Chat
          </button>
          <ShareInviteButton roomName={roomName} />
        </>
      ) : (
        <>
          <button
            onClick={onToggleChat}
            className={`lk-button ${chatOpen ? "lk-button-active" : ""}`}
            title="Chat"
          >
            Chat
          </button>
          <DisconnectButton className="lk-button">Leave</DisconnectButton>
        </>
      )}
    </div>
  );
}
