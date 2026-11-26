# dTelecom Live

Open-source **livestreaming** app built on [dTelecom Cloud](https://cloud.dtelecom.org)
with [`@dtelecom/server-sdk-js`](https://www.npmjs.com/package/@dtelecom/server-sdk-js) 4.x.

One **host** broadcasts camera, mic, screen share, or an **OBS** feed (via WHIP)
and invites viewers. **Viewers** can only watch, listen, and chat — they cannot
publish audio or video. The host/viewer split is enforced by the SFU through
signed access tokens, not just the UI.

Think Twitch/YouTube Live, but decentralized and self-hostable. Sibling project
to [dtelecom-meet](https://github.com/dTelecom/dtelecom-meet).

**[Live Demo](https://dtelecom-live.vercel.app/)** | **[Documentation](https://docs.dtelecom.org)** | **[LLM Resources](https://docs.dtelecom.org/llm-resources)**

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FdTelecom%2Fdtelecom-live&env=DTELECOM_API_KEY,DTELECOM_API_SECRET,DTELECOM_CLOUD_URL&envDescription=Get%20your%20API%20keys%20from%20cloud.dtelecom.org&envLink=https%3A%2F%2Fcloud.dtelecom.org&project-name=dtelecom-live&repository-name=dtelecom-live)

You only need three environment variables:

| Variable | Description |
|---|---|
| `DTELECOM_API_KEY` | Your dTelecom API key from [cloud.dtelecom.org](https://cloud.dtelecom.org) |
| `DTELECOM_API_SECRET` | Your dTelecom API secret |
| `DTELECOM_CLOUD_URL` | `https://cloud.dtelecom.org` |

Node selection is handled by the cloud, and the host link and OBS stream key are signed
values, so there is no database or extra service to provision.

## Features

- **Host broadcast** — camera, microphone, and screen sharing from the browser
- **OBS streaming (WHIP)** — stream from OBS instead of screen share; download a
  ready-to-use OBS profile with the server URL and stream key pre-filled
- **Watch-only viewers** — viewers subscribe and chat, but the SFU blocks them
  from publishing any media (`canPublish: false`)
- **Name-only join** — viewers enter via an invite link, no device setup
- **Live viewer count** — read from the room's participants on the nodes
- **In-stream chat** — real-time text messaging via data channels
- **Host link** — the server decides who is host; see [Host link](#host-link)
- **Host controls** — remove viewers from the stream
- **Decentralized** — no single point of failure, the cloud routes each participant to the nearest SFU node

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
DTELECOM_API_KEY=<your-api-key>
DTELECOM_API_SECRET=<your-api-secret>
DTELECOM_CLOUD_URL=https://cloud.dtelecom.org
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Webhooks (optional)

`app/api/webhook/route.ts` is an example receiver: it verifies each node event and logs it.
Nothing depends on it; the viewer count asks the nodes directly. On Vercel the URL is set
automatically. Locally, nodes can't reach `localhost`, so if you want to see events use
[cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/):

```bash
brew install cloudflared
npm run tunnel
```

Set the printed URL as `WEBHOOK_URL` in `.env.local` and restart the dev server. A webhook URL
must be public `https`.

## Host link

The browser never says "I am the host"; the server decides, without a database:

1. **Go Live** calls `/api/create-room`. The server picks an unguessable room name (a prefix from
   your title plus 12 random characters) and returns a **host key**:
   `HMAC-SHA256(secret, "host:" + room + ":" + expiry)` with a 24-hour expiry, where the secret
   is derived from `DTELECOM_API_SECRET` (`lib/host-key.ts`).
2. The tab keeps the key in `sessionStorage`. `/api/join` checks it (constant-time) and only then
   issues a token that can publish and administer the room; everyone else gets a watch-only token.
3. Removing a viewer, the OBS settings and the OBS profile need the same key.
4. **Host link** (in the OBS panel) is `/prejoin?room=<room>#host=<key>`: open it on another
   device to host from there. The key is after `#`, which browsers never send to a server; the
   page moves it into `sessionStorage` and clears it from the address bar. **Invite** shows the
   viewer QR code and **Copy link**. In the host’s OBS panel, **Show host QR** displays the signed
   host link as a QR code. Share that code only with the intended host.

Server-generated room names matter: rooms exist from the first join, so if the browser could pick
the name, anyone could get a host key for a room someone else is using.

Limits: anyone with the host link is a host until it expires; a single link can't be revoked
(rotating `DTELECOM_API_SECRET` invalidates all of them). Token lifetimes are hard limits: the
host's token lasts 12 hours, a viewer's 6, OBS 12; extend them with `extendToken` for longer
streams.

## Streaming from OBS

The host can broadcast from [OBS Studio](https://obsproject.com) instead of the
browser, using **WHIP**. In the host controls, switch the source to **OBS** to
get a downloadable OBS profile (server URL + stream key baked in) plus copyable
credentials.

Under the hood, OBS publishes to `/api/whip`, which verifies the stream key and
**redirects** the WHIP request to the nearest SFU node — the same redirect
pattern used in production livestreaming apps on dTelecom. The stream key is a
signed value (`<room>.<HMAC>`), so no database is required.

Only the host gets the stream key: `/api/obs` and `/api/obs/profile` require the room's host key.
The stream key itself has no expiry and can't be revoked per room; rotating `DTELECOM_API_SECRET`
invalidates every stream key. For production, bind keys to a stored per-room secret you can
revoke.

## Project Structure

```
app/
  page.tsx                        # Home — start a stream (host)
  prejoin/page.tsx                # Host camera/mic preview, viewer name entry
  room/[roomName]/page.tsx        # The livestream stage
  api/
    create-room/route.ts          # New room name + host key
    join/route.ts                 # Token: host (valid host key) or watch-only viewer
    kick/route.ts                 # Remove a viewer (host key required)
    whip/route.ts                 # OBS WHIP ingest -> redirect to the node
    obs/route.ts                  # Server URL + stream key (host key required)
    obs/profile/route.ts          # Downloadable OBS profile (host key required)
    room-count/route.ts           # Viewers, from the room's participants
    webhook/route.ts              # Example receiver for node events (logs them)
components/
  StreamRoom.tsx                  # Focused stage + sidebar panels
  CustomControlBar.tsx            # Host controls / viewer controls
  ObsPanel.tsx                    # OBS setup and the host link
  ViewerListPanel.tsx             # Viewer list with host actions
  ChatPanel.tsx                   # In-stream chat
lib/
  host-key.ts                     # Room names and signed host keys (server)
  host-session.ts                 # Host key in this tab, host and invite links (browser)
  obs-key.ts                      # Signed WHIP stream key (HMAC, no storage)
  api.ts                          # Client-side fetch helpers
  types.ts                        # Shared types (Role, metadata)
  cloud.ts                        # Server-side dTelecom Cloud client
```

## License

MIT
