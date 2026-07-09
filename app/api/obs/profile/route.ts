import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { signStreamKey, appOrigin } from "@/lib/obs-key";

/**
 * Generates an OBS profile (basic.ini + service.json + encoders) as a zip, with
 * the WHIP server URL and stream key already filled in. The host imports it
 * (OBS → Profile → Import) and clicks Start Streaming — no manual key entry.
 */
export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const os = req.nextUrl.searchParams.get("os") === "mac" ? "mac" : "win";
  if (!room) {
    return NextResponse.json({ error: "room is required" }, { status: 400 });
  }

  const server = `${appOrigin(req)}/api/whip`;
  const streamKey = signStreamKey(room);
  const folder = "dTelecom Live";

  // WHIP needs H.264 video + Opus audio. x264 works on every platform; macOS
  // gets Apple's hardware encoder for lower CPU.
  const videoEncoder =
    os === "mac"
      ? "com.apple.videotoolbox.videoencoder.ave.avc"
      : "obs_x264";

  const basicIni = `[General]
Name=${folder}

[Output]
Mode=Advanced

[AdvOut]
ApplyServiceSettings=true
Encoder=${videoEncoder}
AudioEncoder=ffmpeg_opus
TrackIndex=1

[Video]
BaseCX=1280
BaseCY=720
OutputCX=1280
OutputCY=720
FPSType=0
FPSCommon=30

[Audio]
SampleRate=48000
ChannelSetup=Stereo
`;

  const serviceJson = JSON.stringify({
    type: "whip_custom",
    settings: {
      server,
      service: "WHIP",
      bearer_token: streamKey,
      use_auth: false,
      bwtest: false,
    },
  });

  const streamEncoderJson = JSON.stringify({
    profile: "baseline",
    bitrate: 2500,
    keyint_sec: 2,
  });
  const recordEncoderJson = JSON.stringify({ bitrate: 5000 });

  const zip = new JSZip();
  const dir = zip.folder(folder)!;
  dir.file("basic.ini", basicIni);
  dir.file("service.json", serviceJson);
  dir.file("streamEncoder.json", streamEncoderJson);
  dir.file("recordEncoder.json", recordEncoderJson);

  const bytes = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="dtelecom-live-obs-${os}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
