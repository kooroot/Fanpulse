# FanPulse

FanPulse is a mobile-first football companion that turns verified match data into live momentum, fan quests, pulse cards, and shareable match stories.

## Track Fit

Superteam / TxODDS World Cup Hackathon - Track 3: Consumer and Fan Experiences.

FanPulse is built for casual football fans who want to understand a match quickly, react with friends, play lightweight free match moments, and share a recap.

## Separate From Other Submissions

- ProofMarket settles prediction markets.
- EdgeKeeper analyzes trading-agent decisions.
- FanPulse creates a consumer fan experience.

FanPulse is not a betting app, prediction market, settlement protocol, trading tool, raw data dashboard, wallet app, or official tournament app.

## Features

- Replay-first judge demo that works without TxLINE credentials.
- Match lobby with demo fixture first.
- Pulse Meter for fan-facing momentum, pressure, and chaos.
- Pulse Cards for kickoff, goals, mood swings, comeback windows, discipline shifts, corner pressure, chaos, and final whistle.
- Fan Quests with local XP and streak only.
- Match in 7 Pulses story.
- Share card with final score, biggest pulse, momentum winner, and chaos level.
- TxLINE live mode through server-side API routes, with Replay Mode fallback.

## Official TxLINE Integration

Live mode reuses the same TxLINE access pattern used by ProofMarket, but the
FanPulse UI only renders fan-facing momentum, pulse cards, and stories.
Replay Mode is still the default and complete judge path.

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

1. Click `Open Demo Match`.
2. Click `Start Match Pulse`.
3. Answer a Fan Quest.
4. Watch Pulse Cards and the Pulse Meter update.
5. Open `Match in 7 Pulses` after the final whistle.
6. Copy the recap from the Share Card.

The demo fixture is `Team Alpha vs Team Beta` and finishes in about 76 seconds at 1x.

## Environment Variables

Create `.env.local` from `.env.example` when using live mode.

```bash
TXLINE_API_ORIGIN=https://txline.txodds.com
TXLINE_NETWORK=mainnet
TXLINE_COMPETITION_ID=72
TXLINE_JWT=
TXLINE_API_TOKEN=
NEXT_PUBLIC_DEFAULT_MODE=replay
```

If credentials are missing or live mode fails, FanPulse stays fully usable in Replay Mode.

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
- `0:15` Open demo match.
- `0:30` Start Match Pulse.
- `1:00` Pulse Cards and Pulse Meter.
- `1:30` Fan Quest.
- `2:00` Match Story.
- `2:30` Share Card.
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
  txline/
  pulse/
  replay/
  utils/
data/replay/
tests/
```

## Implementation Notes

Replay Mode uses local seeded data only. Pulse Cards, Pulse Meter, Fan Quests, and Match Story are derived from normalized match updates. Safe JSON preview exists as a disabled developer-only component and is not part of the normal product surface.
