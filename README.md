# FanPulse

FanPulse is a mobile-first football companion that turns verified match data into live momentum, fan quests, pulse cards, and shareable match stories.

Live demo: https://fanpulse-seven.vercel.app

Public repo: https://github.com/kooroot/Fanpulse

Technical documentation: [docs/TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md)

Submission status: live-first mainnet TxLINE demo, replay fallback, responsive desktop/mobile UI, and custom FanPulse app icons are deployed.

## Track Fit

Superteam / TxODDS World Cup Hackathon - Track 3: Consumer and Fan Experiences.

FanPulse is built for casual football fans who want to understand a match quickly, react with friends, play lightweight free match moments, and share a recap.

The latest version benchmarks the successful real-time companion pattern from
LoLDosa, then adapts it for World Cup football and the TxLINE consumer track:
automatic event interpretation, watch-party loops, and replayable fan games
without wagering, wallets, or trading actions.

## Separate From Other Submissions

- ProofMarket settles prediction markets.
- EdgeKeeper analyzes trading-agent decisions.
- FanPulse creates a consumer fan experience.

FanPulse is not a betting app, prediction market, settlement protocol, trading tool, raw data dashboard, wallet app, or official tournament app.

## Features

- Live-first TxLINE judge demo with replay fallback when credentials are absent.
- Match lobby with real TxLINE fixtures first.
- Responsive mobile and desktop layouts for lobby, live match rooms, and stories.
- Custom FanPulse favicon, app icon, and apple-touch icon for the deployed product.
- Pulse Meter for fan-facing momentum, pressure, and chaos.
- Pulse Cards for kickoff, goals, mood swings, comeback windows, discipline shifts, corner pressure, chaos, and final whistle.
- Fan Quests with local XP and streak only.
- Auto Pundit feed with copyable and speakable commentary, including odds-derived market mood.
- Hi-Lo Stats game driven by TxLINE score/stat readings such as goals, cards, and corners.
- Group Sweepstake board for a small watch party.
- Match in 7 Pulses story.
- Share card with final score, biggest pulse, momentum winner, and chaos level.
- TxLINE live mode through server-side API routes, with local replay fallback.

## What Judges Should Notice

- FanPulse starts from real TxLINE live fixtures instead of a mock-only demo.
- The first screen is understandable in seconds: live match, score, pulse meter,
  fan games, and recap path.
- TxLINE data is translated into consumer language: momentum, pressure, chaos,
  market mood, stat Hi-Lo, and stories.
- The fallback replay exists for review timing, but the product path remains
  live-first.
- The experience is social and fan-facing, not a sportsbook, market, wallet, or
  terminal.

## Track Criteria Response

- Fan accessibility and UX: mobile-first match companion with plain-language
  momentum, short commentary, and tap-based games.
- Real-time responsiveness: live match pages poll FanPulse server APIs every 5
  seconds and refresh Pulse Meter, Auto Pundit, stat Hi-Lo, and sweepstake state.
- Originality and value creation: TxLINE scores, odds movement, and match
  events become social watch-party loops rather than a raw feed.
- Commercial path: a creator, streamer, club, or fan-group watch-party kit with
  branded rooms and share cards.
- Completeness: landing, live lobby, live match view, replay fallback, story,
  share card, local XP, and deployment are end to end.

## Official TxLINE Integration

Live mode reuses the same TxLINE access pattern used by ProofMarket, but the
FanPulse UI only renders fan-facing momentum, pulse cards, and stories.
With credentials configured, FanPulse opens real TxLINE fixtures first. Local
replay remains available only as a no-credential fallback path.
Live match pages use TxLINE as an active input: scores, odds, and stat
snapshots are normalized server-side, refreshed in the match UI, and converted
into Pulse Cards, market mood commentary, stat Hi-Lo prompts, and shareable
recaps.

Implemented server-side methods:

- `getFixturesSnapshot()` -> `GET /api/fixtures/snapshot?startEpochDay={epochDay}&competitionId=72`
- `getOddsSnapshot(fixtureId)` -> `GET /api/odds/snapshot/{fixtureId}`
- `getScoresSnapshot(fixtureId)` -> `GET /api/scores/snapshot/{fixtureId}`
- `getHistoricalScores(fixtureId)` -> `GET /api/scores/historical/{fixtureId}`
- `streamOdds()` -> `GET /api/odds/stream` with `Accept: text/event-stream`
- `streamScores()` -> `GET /api/scores/stream` with `Accept: text/event-stream`

The client supports `TXLINE_NETWORK=mainnet` and `TXLINE_NETWORK=devnet`.
For World Cup data, the default live query uses mainnet competition `72` and
the current `startEpochDay`.

The normalizers use Zod passthrough objects and support camelCase/PascalCase response keys. Soccer phase and full-game stat encodings are mirrored in `lib/txline/types.ts`.

Official references:

- https://superteam.fun/earn/hackathon/world-cup/
- https://superteam.fun/earn/listing/consumer-and-fan-experiences/
- https://txline-docs.txodds.com/documentation/quickstart
- https://txline-docs.txodds.com/documentation/worldcup
- https://txline-docs.txodds.com/documentation/examples/fetching-snapshots
- https://txline-docs.txodds.com/documentation/examples/streaming-data
- https://txline-docs.txodds.com/documentation/scores/soccer-feed
- https://txline-docs.txodds.com/documentation/odds/overview
- https://txline-docs.txodds.com/documentation/legal/hackathon-terms

## Judge Demo Flow

```bash
bun install
bun dev
```

Open http://localhost:3000.

Production judge path:

1. Open https://fanpulse-seven.vercel.app.
2. Click `Open Live Match`.
3. Review the TxLINE fixture, live score, Pulse Meter, odds-derived Auto Pundit,
   stat Hi-Lo, and Group Sweepstake.
4. Open `Match Lobby` to see the real fixture list from competition `72`.
5. Open `Match in 7 Pulses` through the fallback story path if live fixtures are
   not finished during review.

Local judge path:

1. Click `Open Live Match`.
2. Review the TxLINE fixture, Pulse Meter, odds-derived Auto Pundit, stat Hi-Lo,
   and Group Sweepstake.
3. Open `Match Lobby` to see the real fixture list from competition `72`.
4. If live data is unavailable, open the fallback match and click `Start Match Pulse`.
5. Answer a Fan Quest.
6. Open `Match in 7 Pulses` after the fallback final whistle.

The fallback replay fixture is labelled `USA vs Belgium` and finishes in about
76 seconds at 1x. It is not the primary product surface when TxLINE live data is
available.

## Environment Variables

Create `.env.local` from `.env.example` when using live mode.

```bash
TXLINE_API_ORIGIN=https://txline.txodds.com
TXLINE_NETWORK=mainnet
TXLINE_COMPETITION_ID=72
TXLINE_JWT=
TXLINE_API_TOKEN=
NEXT_PUBLIC_DEFAULT_MODE=live
```

If credentials are missing or live mode fails, FanPulse stays fully usable
through the local replay fallback.

## TxLINE Devnet Activation

FanPulse includes a local helper for the TxLINE guest JWT -> on-chain subscribe
-> token activation flow. The private key stays in `keys/`, which is gitignored.

```bash
bun run txline:keypair
bun run txline:status
```

Send devnet SOL to the printed wallet address, then run:

```bash
bun run txline:bootstrap:devnet
bun run txline:check:data
```

`txline:bootstrap:devnet` writes `TXLINE_JWT` and `TXLINE_API_TOKEN` into
`.env.local` without printing them. The default free service level is `1`
for World Cup & International Friendlies with a 60-second delay.

## Safety And Compliance

- No betting.
- No automated wagering.
- No real money.
- No wallet required.
- No token rewards.
- No official FIFA or tournament affiliation.
- No official logos, marks, team crests, or tournament marks.
- No raw TxODDS data redistribution.
- No raw feed dumps in the normal UI.
- TxLINE credentials stay server-side.
- Browser code calls FanPulse API routes, never TxLINE directly.

Footer disclaimer used in the app:

> Unofficial fan experience. No betting. No official tournament affiliation.

## Commands

```bash
bun install
bun dev
bun run build
bun test
bun run txline:keypair
bun run txline:status
bun run txline:bootstrap:devnet
bun run txline:check:data
```

## Demo Video Script

- `0:00` FanPulse intro.
- `0:15` Open live TxLINE match.
- `0:30` Show live-source badges, mainnet TxLINE, real score, and the 5-second
  refresh indicator.
- `0:45` Show Pulse Meter and Pulse Cards.
- `1:05` Show Auto Pundit market mood or the graceful odds waiting state.
- `1:25` Show TxLINE stat Hi-Lo and Group Sweepstake.
- `1:45` Show real fixture lobby.
- `2:05` Show fallback replay only as review insurance.
- `2:30` Show Match in 7 Pulses and Share Card.
- `3:00` Track fit summary.

## Project Structure

```text
app/
  page.tsx
  matches/page.tsx
  match/[fixtureId]/page.tsx
  story/[fixtureId]/page.tsx
  api/
components/
  landing/
  match/
  common/
lib/
  experience/
  txline/
  pulse/
  replay/
  utils/
data/replay/
tests/
```

## Branding

FanPulse ships with a custom lightweight icon set:

- `app/favicon.ico`
- `app/icon.svg`
- `public/fanpulse-icon.svg`
- `public/apple-icon.svg`

The icon uses FanPulse colors, pulse bars, and a football-like signal mark
without official logos, team crests, or tournament marks.

## Implementation Notes

Live mode uses server-side TxLINE snapshots and never exposes credentials to
browser code. The local replay fallback uses seeded normalized updates only.
Safe JSON preview exists as a disabled developer-only component and is not part
of the normal product surface.

`lib/experience` contains the LoLDosa-inspired fan layer: Auto Pundit moments,
TxLINE stat Hi-Lo scoring, and local sweepstake scoring. It intentionally does
not contain order execution, wallet connection, automated wagering, or money
flows.
