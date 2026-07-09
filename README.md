# dTelecom Live

Open-source **livestreaming** app built on [dTelecom](https://dtelecom.org) — a
decentralized WebRTC platform with Solana-based node discovery.

One **host** broadcasts camera, mic, screen share, or an **OBS** feed (via WHIP)
and invites viewers. **Viewers** can only watch, listen, and chat — they cannot
publish audio or video. The host/viewer split is enforced by the SFU through
signed access tokens, not just the UI.

Think Twitch/YouTube Live, but decentralized and self-hostable. Sibling project
to [dtelecom-meet](https://github.com/dTelecom/dtelecom-meet).

**[Live Demo](https://dtelecom-live.vercel.app/)** | **[Documentation](https://docs.dtelecom.org)** | **[LLM Resources](https://docs.dtelecom.org/llm-resources)**

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FdTelecom%2Fdtelecom-live&env=API_KEY,API_SECRET&envDescription=Get%20your%20API%20keys%20from%20cloud.dtelecom.org&envLink=https%3A%2F%2Fcloud.dtelecom.org&project-name=dtelecom-live&repository-name=dtelecom-live)

You only need two environment variables:

| Variable | Description |
|---|---|
| `API_KEY` | Your dTelecom API key from [cloud.dtelecom.org](https://cloud.dtelecom.org) |
| `API_SECRET` | Your dTelecom API secret |

Webhook URL, WHIP/OBS ingest, and Solana network settings are configured
automatically — no database or extra services to provision.

## Features

- **Host broadcast** — camera, microphone, and screen sharing from the browser
- **OBS streaming (WHIP)** — stream from OBS instead of screen share; download a
  ready-to-use OBS profile with the server URL and stream key pre-filled
- **Watch-only viewers** — viewers subscribe and chat, but the SFU blocks them
  from publishing any media (`canPublish: false`)
- **Name-only join** — viewers enter via an invite link, no device setup
- **Live viewer count** — see how many people are watching
- **In-stream chat** — real-time text messaging via data channels
- **Host controls** — remove viewers from the stream
- **Decentralized** — no single point of failure, SFU nodes discovered via Solana

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [@dtelecom/components-react](https://www.npmjs.com/package/@dtelecom/components-react)
- [@dtelecom/server-sdk-js](https://www.npmjs.com/package/@dtelecom/server-sdk-js) — tokens, room service, webhook verification
- [Tailwind CSS](https://tailwindcss.com) 4

## Local Development

### 1. Get API keys

Sign up at [cloud.dtelecom.org](https://cloud.dtelecom.org) and grab your
**API Key** and **API Secret**.

### 2. Clone and install

```bash
git clone https://github.com/dTelecom/dtelecom-live.git
cd dtelecom-live
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
API_KEY=<your-api-key>
API_SECRET=<your-api-secret>
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Webhooks locally

Webhooks enable live viewer counts. On Vercel this works automatically. For local
development, dTelecom SFU nodes can't reach `localhost`, so use
[cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/)
to create a tunnel:

```bash
brew install cloudflared
npm run tunnel
```

Set the printed URL as `WEBHOOK_URL` in `.env.local` and restart the dev server.

## Streaming from OBS

The host can broadcast from [OBS Studio](https://obsproject.com) instead of the
browser, using **WHIP**. In the host controls, switch the source to **OBS** to
get a downloadable OBS profile (server URL + stream key baked in) plus copyable
credentials.

Under the hood, OBS publishes to `/api/whip`, which verifies the stream key and
**redirects** the WHIP request to the nearest SFU node — the same redirect
pattern used in production livestreaming apps on dTelecom. The stream key is a
signed value (`<room>.<HMAC>`), so no database is required.

> ⚠️ **Security note — the stream key is example-grade, not production-ready.**
> The key is derived only from the (public, guessable) room name, and `/api/obs`
> issues it without authentication. The HMAC prevents *offline* forgery, but
> since anyone who knows the room name can just ask `/api/obs` for a valid key,
> **knowing the room name is effectively enough to publish into that room** as
> the `obs-<room>` participant (i.e. hijack/spoof the stream). The key also can't
> be revoked per-room without rotating `API_SECRET` (which invalidates every
> room). This keeps the demo zero-setup and stateless.
>
> To harden for production: (1) authenticate `/api/obs` and confirm the caller
> owns the room before issuing a key; (2) bind the key to a per-room random
> secret you store and can rotate/revoke (KV/DB) instead of deriving it from the
> room name; (3) add an expiry. See `app/api/obs/route.ts` for details.

## Project Structure

```
app/
  page.tsx                        # Home — start a stream (host)
  prejoin/page.tsx                # Host camera/mic preview
  room/[roomName]/page.tsx        # The livestream stage
  api/
    join/route.ts                 # Create token (host = publish, viewer = watch)
    whip/route.ts                 # OBS WHIP ingest -> redirect to SFU node
    obs/route.ts                  # Server URL + stream key for the host
    obs/profile/route.ts          # Downloadable OBS profile (params baked in)
    webhook/route.ts              # Receive events from SFU nodes
    room-count/route.ts           # GET viewer count for a room
    create-room/route.ts          # Create room (host)
    kick/route.ts                 # Remove viewer (host)
components/
  StreamRoom.tsx                  # Focused stage + sidebar panels
  CustomControlBar.tsx            # Host controls / viewer controls
  ObsPanel.tsx                    # OBS setup (download profile + credentials)
  ViewerListPanel.tsx             # Viewer list with host actions
  ChatPanel.tsx                   # In-stream chat
lib/
  obs-key.ts                      # Signed WHIP stream key (HMAC, no storage)
  api.ts                          # Client-side fetch helpers
  types.ts                        # Shared types (Role, metadata)
  room-service.ts                 # Server-side RoomServiceClient
  participant-count.ts            # In-memory webhook counter
```

## License

MIT
