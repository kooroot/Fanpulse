# FanPulse Technical Documentation

FanPulse is a mobile-first football companion built for the Superteam / TxODDS
World Cup Hackathon, Track 3: Consumer and Fan Experiences.

It converts TxLINE football match data into fan-facing momentum, Pulse Cards,
free Fan Quests, Auto Pundit commentary, Hi-Lo stat games, group sweepstakes,
and shareable match stories.

Live demo: https://fanpulse-seven.vercel.app  
Repository: https://github.com/kooroot/Fanpulse

## 1. Product Scope

### 1.1 One-line summary

FanPulse turns TxLINE World Cup football data into live momentum, fan quests,
pulse cards, and shareable match stories.

### 1.2 Track fit

FanPulse directly targets the Consumer and Fan Experiences track:

- Fans watch a match with a phone in hand.
- TxLINE provides live scores, odds, and match events.
- FanPulse transforms that data into an accessible, social, and replayable
  companion experience rather than a raw feed or operator tool.

### 1.3 Explicit non-goals

FanPulse is not:

- A betting app.
- A sportsbook.
- A prediction market.
- A trading terminal.
- A wallet app.
- A settlement or payout system.
- A raw TxODDS data explorer.
- An official FIFA or official tournament app.

The UI contains no real-money entry, no wallet connection, no token rewards,
no trading positions, no PnL, and no official team crests or tournament marks.

## 2. High-Level Architecture

FanPulse is a Next.js App Router application using Bun, TypeScript, Tailwind,
Zod, and Vitest.

```text
Browser
  |
  | Fan-facing pages and components
  v
Next.js App Router
  |
  | Internal API routes only
  v
FanPulse server routes
  |
  | Server-side credentials
  v
TxLINE API snapshots / optional streams

Local replay data
  |
  | No credentials required
  v
Replay engine -> Pulse engine -> Fan experience UI
```

The browser never calls TxLINE directly. Client components call FanPulse API
routes, and those routes perform server-side TxLINE calls when credentials are
available.

## 3. Repository Structure

```text
app/
  page.tsx                         Landing page
  matches/page.tsx                 Match lobby
  match/[fixtureId]/page.tsx       Live or replay match room
  story/[fixtureId]/page.tsx       Match in 7 Pulses story
  api/
    fixtures/route.ts              Fixture list API
    match/[fixtureId]/route.ts     Live/replay match snapshot API
    replay/[fixtureId]/route.ts    Replay timeline API
    share/[fixtureId]/route.ts     Share-card summary API

components/
  landing/                         Hero and track-fit sections
  match/                           Score, pulse, quest, story, share UI
  common/                          Badges, bottom nav, empty state

lib/
  txline/                          Server-side TxLINE client and normalizers
  pulse/                           Pulse Cards, Pulse Meter, story, quests
  experience/                      Auto Pundit, Hi-Lo, sweepstake logic
  replay/                          Local replay data engine
  utils/                           Formatting, hashing, stable JSON, time

data/replay/                       Seeded no-credential demo match
tests/                             Vitest coverage for core logic
scripts/                           TxLINE access helper scripts
docs/                              Submission documentation
```

## 4. Runtime Modes

### 4.1 Live Mode

Live Mode is used when server-side TxLINE credentials are configured.

Required environment variables:

```bash
TXLINE_API_ORIGIN=https://txline.txodds.com
TXLINE_NETWORK=mainnet
TXLINE_COMPETITION_ID=72
TXLINE_JWT=
TXLINE_API_TOKEN=
NEXT_PUBLIC_DEFAULT_MODE=live
```

Optional fallback credential set:

```bash
TXLINE_FALLBACK_API_ORIGIN=
TXLINE_FALLBACK_NETWORK=devnet
TXLINE_FALLBACK_JWT=
TXLINE_FALLBACK_API_TOKEN=
```

FanPulse attempts configured credential sets in order:

1. Primary credentials, normally mainnet.
2. Fallback credentials, normally devnet.
3. Replay fallback if live data is unavailable.

### 4.2 Replay Mode

Replay Mode is fully functional without TxLINE credentials, wallet, account,
tokens, or payment. It uses seeded local data under `data/replay`.

The demo fixture is:

```text
fixtureId: demo-usa-belgium
teams: USA vs Belgium
source: replay
```

Replay Mode supports:

- Start / pause / reset.
- Speed multipliers: 1x, 5x, 20x.
- A complete timeline containing kickoff, pressure, goals, cards, corners,
  comeback window, chaos spike, late goal, final whistle, story, and share card.

## 5. TxLINE Integration

### 5.1 Client implementation

The server-side TxLINE client lives in:

```text
lib/txline/client.ts
```

Implemented methods:

```ts
getFixturesSnapshot()
getOddsSnapshot(fixtureId: string)
getScoresSnapshot(fixtureId: string)
getHistoricalScores(fixtureId: string)
streamOdds()
streamScores()
```

The client attaches credentials only from server-side environment variables:

```http
Authorization: Bearer ${TXLINE_JWT}
X-Api-Token: ${TXLINE_API_TOKEN}
Accept-Encoding: gzip
```

No JWT or API token is exposed to the browser.

### 5.2 Endpoint mapping

FanPulse uses the following TxLINE API paths:

```text
GET /api/fixtures/snapshot?startEpochDay={epochDay}&competitionId=72
GET /api/odds/snapshot/{fixtureId}
GET /api/scores/snapshot/{fixtureId}
GET /api/scores/historical/{fixtureId}
GET /api/odds/stream   Accept: text/event-stream
GET /api/scores/stream Accept: text/event-stream
```

The default World Cup competition id is `72`, configured in
`lib/txline/network.ts`.

### 5.3 Network support

`lib/txline/network.ts` defines network configuration for:

- `mainnet`
- `devnet`

It includes:

- TxLINE API origin.
- Solana RPC URL.
- TxLINE program id.
- TXL token mint.
- Default fixture competition id.
- Free service-level metadata.

TxLINE clarification, July 9, 2026: TxODDS announced that obsolete IDL metadata
incorrectly pointed to a `60s` delay / sampling period for odds streams. The
actual odds stream sampling period is `0s`. FanPulse therefore does not infer
odds-stream freshness from the obsolete IDL/PricingMatrix `samplingIntervalSec`
field.

Service-level labels and odds-stream sampling are tracked separately:

| Network | Service level | Bundle | Free-tier label | Odds stream sampling |
| --- | --- | --- | --- | --- |
| mainnet | `1` | World Cup & Int Friendlies | documented delayed tier | `0s` |
| mainnet | `12` | World Cup & Int Friendlies | real-time tier | `0s` |
| devnet | `1` | World Cup & Int Friendlies | real-time/dev tier | `0s` |

The local `.env.local` used during development has mainnet service level `1`
as the primary credential set and devnet service level `1` as the fallback
credential set.

Mainnet endpoint examples used by FanPulse:

```ts
const apiOrigin = "https://txline.txodds.com";
const apiBaseUrl = `${apiOrigin}/api`;

await fetch(`${apiBaseUrl}/fixtures/snapshot?startEpochDay=${epochDay}&competitionId=72`, {
  headers: {
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": apiToken,
  },
});

await fetch(`${apiBaseUrl}/odds/stream`, {
  headers: {
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": apiToken,
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
  },
});

await fetch(`${apiBaseUrl}/scores/stream`, {
  headers: {
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": apiToken,
    Accept: "text/event-stream",
    "Cache-Control": "no-cache",
  },
});
```

### 5.4 Fixture id guard

Live match snapshot endpoints reject non-numeric TxLINE fixture ids before
calling TxLINE snapshot endpoints.

This prevents local replay ids such as `demo-usa-belgium` or path-like input
from being forwarded to TxLINE.

Covered by:

```text
tests/txline-live.test.ts
```

### 5.5 Live vs upcoming classification

FanPulse separates "TxLINE fixture exists" from "match is actually live."

Implementation:

```text
lib/utils/format.ts -> getFixtureDisplayStatus()
```

Display states:

- `Live`
- `Live window`
- `Starting soon`
- `Upcoming`
- `Final`
- `Recent`
- `Replay`
- `TxLINE`

This prevents future fixtures from being mislabeled as live.

Covered by:

```text
tests/fixture-display.test.ts
```

## 6. Normalized Data Model

TxLINE responses may vary in casing and nesting. FanPulse normalizes data into
stable internal types before any product logic runs.

Normalizers live in:

```text
lib/txline/normalize.ts
```

They use Zod passthrough objects so unknown fields do not break the app:

```ts
const passthroughRecord = z.object({}).passthrough();
```

Supported key styles include camelCase and PascalCase, for example:

- `fixtureId`, `FixtureId`, `FixtureID`
- `participant1`, `Participant1`, `Participant1Name`
- `startTime`, `StartTime`
- `phaseId`, `PhaseId`
- `decimalOdds`, `DecimalOdds`

### 6.1 NormalizedFixture

```ts
type NormalizedFixture = {
  fixtureId: string;
  participant1: string;
  participant2: string;
  participant1IsHome?: boolean;
  startTime?: string;
  status?: string;
  competitionId?: number | string;
  competition?: string;
  source: "txline" | "replay";
};
```

### 6.2 NormalizedScoreUpdate

```ts
type NormalizedScoreUpdate = {
  fixtureId: string;
  ts: number;
  seq?: number;
  phaseId?: number;
  minute?: number;
  participant1Score?: number;
  participant2Score?: number;
  stats?: Record<string, number>;
  source: "txline" | "replay";
};
```

### 6.3 NormalizedOddsUpdate

```ts
type NormalizedOddsUpdate = {
  fixtureId: string;
  ts: number;
  seq?: number;
  market: "1X2" | "MATCH_WINNER" | "UNKNOWN";
  selection: "P1" | "DRAW" | "P2" | string;
  decimalOdds?: number;
  impliedProbability?: number;
  suspended?: boolean;
  source: "txline" | "replay";
};
```

## 7. Soccer Feed Constants

Implemented in:

```text
lib/txline/types.ts
```

### 7.1 Phase ids

```text
1  NS    not started
2  H1    first half
3  HT    halftime
4  H2    second half
5  FT    finished
6  WET   waiting for extra time
7  ET1   extra time first half
8  HTET  extra time halftime
9  ET2   extra time second half
10 FET   ended after extra time
11 WPE   waiting for penalty shootout
12 PE    penalty shootout
13 FPE   ended after penalties
14 INT   interrupted
15 ABD   abandoned
16 CAN   cancelled
17 CC    coverage cancelled
18 CS    coverage suspended
19 PP    postponed
```

Final phases are:

```ts
new Set([5, 10, 13])
```

### 7.2 Full-game stat keys

```text
1 Participant 1 Total Goals
2 Participant 2 Total Goals
3 Participant 1 Total Yellow Cards
4 Participant 2 Total Yellow Cards
5 Participant 1 Total Red Cards
6 Participant 2 Total Red Cards
7 Participant 1 Total Corners
8 Participant 2 Total Corners
```

## 8. Internal API Routes

### 8.1 `GET /api/fixtures`

Returns:

- Demo fixture.
- TxLINE fixtures when credentials exist.
- `txlineAvailable`.
- `liveAvailable`.
- network/source metadata.
- fixture query metadata.

It never returns JWTs or API tokens.

### 8.2 `GET /api/match/[fixtureId]`

Returns a normalized match snapshot.

For demo fixture or missing credentials:

```json
{
  "mode": "replay",
  "snapshot": {}
}
```

For live fixture:

```json
{
  "mode": "live",
  "liveNetwork": "mainnet",
  "liveSource": "TxLINE mainnet World Cup feed",
  "credentialLabel": "primary",
  "warnings": [],
  "snapshot": {}
}
```

If live mode fails, the route gracefully returns replay fallback with
`liveError`.

### 8.3 `GET /api/replay/[fixtureId]`

Returns the local replay timeline for `demo-usa-belgium`.

This is seeded FanPulse demo data, not raw TxODDS feed redistribution.

### 8.4 `GET /api/share/[fixtureId]`

Returns a share-card JSON summary once a story exists:

```json
{
  "title": "🇺🇸 USA vs 🇧🇪 Belgium",
  "finalScore": "2-1",
  "biggestPulse": "The pulse flips",
  "momentumWinner": "🇺🇸 USA",
  "chaosLevel": 47,
  "label": "Unofficial fan recap",
  "shareText": "..."
}
```

## 9. Live Match Snapshot Pipeline

Implemented in:

```text
lib/txline/live-snapshot.ts
```

For a live fixture, FanPulse fetches in parallel:

```ts
client.getFixturesSnapshot({ upcomingOnly: false, limit: 24 })
client.getScoresSnapshot(fixtureId)
client.getHistoricalScores(fixtureId)
client.getOddsSnapshot(fixtureId)
```

Then it:

1. Finds the matching fixture.
2. Falls back to a generic fixture if only score/odds data exists.
3. Deduplicates score updates.
4. Deduplicates odds updates.
5. Derives Pulse Cards.
6. Computes Pulse Meter.
7. Builds story only if the latest score phase is final.
8. Returns warnings for partially unavailable data.

The product can still render useful fan context if only scores are available,
or if odds snapshots are temporarily unavailable.

## 10. Pulse Card Engine

Implemented in:

```text
lib/pulse/pulse-card-engine.ts
```

Pulse Cards are derived event summaries. They are fan-facing interpretations,
not recommendations.

### 10.1 Detectors

| Detector | Trigger | Output |
| --- | --- | --- |
| Kickoff | phase changes to H1 | `KICKOFF` |
| Goal | score or stat keys 1/2 increase | `GOAL` |
| Odds shock | implied probability moves by at least 0.06 | `ODDS_SHOCK` |
| Comeback window | losing side narrows gap or gains probability | `COMEBACK_WINDOW` |
| Discipline shift | stat keys 3/4/5/6 increase | `DISCIPLINE_SHIFT` |
| Corner pressure | stat keys 7/8 increase, throttled by time window | `CORNER_PRESSURE` |
| Momentum shift | odds and match context indicate a sharp swing | `MOMENTUM_SHIFT` |
| Chaos spike | multiple high-impact events close together | `CHAOS_SPIKE` |
| Final whistle | phase 5, 10, or 13 | `FINAL_WHISTLE` |

### 10.2 Input hash

Each card includes `derivedFrom.inputHash`, generated from the underlying
score/odds/stat input. This supports traceability without exposing raw feed
dumps in the UI.

### 10.3 Data badge

Cards are labeled based on source:

- `TxLINE Verified Data`
- `Replay Data`
- `Data-backed Signal`

## 11. Pulse Meter

Implemented in:

```text
lib/pulse/pulse-meter.ts
```

Pulse Meter outputs:

```ts
type PulseMeterState = {
  fixtureId: string;
  ts: number;
  p1: number;
  p2: number;
  chaos: number;
  leader: "P1" | "P2" | "NEUTRAL";
  label: string;
  reasons: string[];
};
```

The values are normalized so:

```text
p1 + p2 + chaos = 100
```

Signals used:

- Current score.
- Recent goals.
- Implied probability movement.
- Corner pressure.
- Yellow/red cards.
- Late close-score context.
- Recent Pulse Card density.

Examples of fan-facing labels:

- `USA is taking over`
- `Belgium is pushing back`
- `Chaos is rising`
- `Late drama mode`
- `The match is balanced`

## 12. Fan Experience Engine

Implemented in:

```text
lib/experience/fan-experience-engine.ts
```

This module creates the LoLDosa-inspired consumer layer adapted for football.

### 12.1 Auto Pundit

Auto Pundit converts Pulse Cards and odds-derived movement into short,
copyable commentary.

Examples:

- Market mood waiting for odds.
- Market mood swings toward a team.
- A Pulse Card becomes a short pundit explanation.

Auto Pundit never exposes raw odds tables as the primary surface.

### 12.2 Hi-Lo Stats

Hi-Lo is a free local stat game driven by normalized match stats.

Supported readings:

- Corner pace from stat keys 7/8.
- Card heat from stat keys 3/4/5/6.
- Goal pace from score feed and stat keys 1/2.

Options:

```text
Higher
Lower
Same
```

Rewards are local XP only.

### 12.3 Group Sweepstake

The group sweepstake assigns local watch-party players to fixture sides and
scores them with:

- Goals.
- Pulse Meter side strength.
- Chaos bonus.

No account, payment, wallet, token, or prize flow exists.

## 13. Fan Quest Engine

Implemented in:

```text
lib/pulse/quest-engine.ts
```

Fan Quests are local, free match interactions.

They support:

- Open and resolved states.
- Local XP.
- Local streak.
- Replay-based resolution.

Explicit constants:

```ts
FAN_QUEST_REWARD_KIND = "local_xp"
FAN_QUEST_REQUIRES_ACCOUNT = false
```

Browser persistence uses local state/localStorage patterns in the match UI.
There is no backend account system or leaderboard requiring login.

## 14. Match Story Builder

Implemented in:

```text
lib/pulse/story-builder.ts
```

When a match reaches a final phase, FanPulse builds:

```text
Match in 7 Pulses
```

Chapters:

1. Opening Rhythm
2. First Breakthrough
3. Market Mood Swing
4. Pressure Wave
5. Comeback Window
6. Final Push
7. Full-Time Story

The story includes:

- Associated Pulse Card ids.
- Final score.
- Biggest pulse.
- Momentum winner.
- Final share text.

## 15. Replay Engine

Implemented in:

```text
lib/replay/replay-engine.ts
lib/replay/sample-data.ts
data/replay/*.json
```

Replay state:

```ts
type ReplayState = {
  status: "idle" | "running" | "paused" | "finished";
  elapsedMs: number;
  speed: 1 | 5 | 20;
  nextIndex: number;
  emittedEvents: ReplayEvent[];
};
```

Core functions:

- `createReplayState`
- `startReplay`
- `pauseReplay`
- `resetReplay`
- `setReplaySpeed`
- `advanceReplay`
- `getReplaySnapshot`

Replay snapshots reuse the exact same downstream engines as live snapshots:

```text
score/odds timeline -> Pulse Cards -> Pulse Meter -> Story
```

## 16. UI Implementation

### 16.1 Responsive layout

The app is mobile-first but supports desktop layouts:

- Landing uses responsive hero grid.
- Match lobby uses responsive fixture cards.
- Match room uses a two-column desktop layout and compact mobile stacking.
- Story page keeps the share card visible and readable.

### 16.2 Country flags

Country names are formatted with flag emoji when known:

```text
lib/utils/format.ts -> formatTeamName()
```

Unknown team names fall back to plain text.

### 16.3 Safe display model

The UI shows:

- Pulse Cards.
- Pulse Meter.
- Auto Pundit.
- Fan Quests.
- Hi-Lo.
- Sweepstake board.
- Match Story.
- Share Card.

The UI does not show raw TxODDS feed dumps or downloadable raw JSON.

## 17. Security and Compliance

### 17.1 Credential boundary

TxLINE credentials are read only on the server:

```text
TXLINE_JWT
TXLINE_API_TOKEN
TXLINE_FALLBACK_JWT
TXLINE_FALLBACK_API_TOKEN
```

The browser receives:

- normalized fixture data,
- derived match state,
- warnings,
- fan-facing summaries.

It never receives TxLINE secrets.

### 17.2 Local keypair boundary

TxLINE activation helper scripts can create a local Solana keypair under:

```text
keys/
```

This folder is gitignored. It is used only for developer-side TxLINE access
activation, not for FanPulse users.

FanPulse users do not connect a wallet.

### 17.3 Raw data boundary

FanPulse does not expose a raw TxODDS feed dump in the normal UI and does not
provide raw TxODDS download endpoints.

The replay endpoint returns seeded FanPulse replay data, not third-party raw
feed redistribution.

### 17.4 Consumer safety boundaries

FanPulse has:

- No betting.
- No automated wagering.
- No real-money entry.
- No token rewards.
- No wallet requirement.
- No official tournament affiliation.
- No official logos, marks, team crests, or tournament marks.

Footer disclaimer:

```text
Unofficial fan experience. No betting. No official tournament affiliation.
```

## 18. Testing

Test command:

```bash
bun test
```

Current test coverage includes:

```text
tests/pulse-card-engine.test.ts
tests/pulse-meter.test.ts
tests/quest-engine.test.ts
tests/story-builder.test.ts
tests/replay-engine.test.ts
tests/fan-experience-engine.test.ts
tests/txline-live.test.ts
tests/fixture-display.test.ts
```

Coverage highlights:

- Goal Pulse detection.
- Odds shock detection at `>= 0.06` implied probability movement.
- Discipline shift detection.
- Corner pressure detection.
- Final whistle detection.
- Pulse Meter normalization to 100.
- Leading side pulse increase.
- Late close-match chaos increase.
- Recent goal pulse increase.
- Free Fan Quest creation and resolution.
- XP-only quest rewards.
- No account/wallet requirement for quests.
- Match in 7 Pulses story generation.
- Replay start/pause/reset/speed behavior.
- TxLINE URL/header construction.
- Numeric fixture id guard.
- TxLINE StartTime normalization.
- Upcoming fixtures not mislabeled as live.

Latest verified result:

```text
35 pass
0 fail
```

## 19. Build and Deployment

Required commands:

```bash
bun install
bun dev
bun run lint
bun test
bun run build
```

Deployment target:

```text
Vercel
```

Production URL:

```text
https://fanpulse-seven.vercel.app
```

The app uses dynamic server routes for live data:

```ts
export const dynamic = "force-dynamic";
```

This prevents stale live fixture and match snapshots from being served as
static content.

## 20. Demo Video Assets

Local demo video artifacts are intentionally ignored by Git:

```text
fanpulse.mov
fanpulse_subtitles.srt
fanpulse_youtube_subtitled.mp4
fanpulse_youtube_subtitled_audio.mp4
tmp/
```

The YouTube-ready file is:

```text
fanpulse_youtube_subtitled.mp4
```

Verified properties:

```text
codec: H.264 video + AAC audio
resolution: 1920x1080
duration: 122.374692 seconds
captions: burned in from fanpulse_subtitles.srt
```

## 21. Known Constraints

- Live updates currently use 5-second polling from the match UI. The TxLINE
  client includes stream methods, but the main shipped UI path uses snapshots
  for reliability in the demo environment.
- The app has no database. Local fan interactions are local-only.
- If TxLINE odds snapshots are unavailable for a fixture, Auto Pundit displays
  a graceful "market mood waiting" state while score-driven features continue.
- If live data fails entirely, FanPulse falls back to Replay Mode.

## 22. Future Improvements

Potential next steps after the hackathon:

- Add a room code system for private watch parties.
- Add creator-branded share cards.
- Add optional server-side room persistence.
- Upgrade from polling to SSE when live stream stability is confirmed.
- Add localization for non-English fans.
- Add richer stat games as TxLINE event coverage expands.

## 23. Submission Checklist Mapping

| Requirement | FanPulse implementation |
| --- | --- |
| Uses TxLINE live input | Server-side TxLINE snapshots for fixtures, scores, odds, historical scores |
| Functional without credentials | Replay Mode |
| Consumer fan UX | Pulse Meter, Pulse Cards, Fan Quests, Auto Pundit, Hi-Lo, Story |
| Real-time responsiveness | Match room refreshes every 5 seconds |
| No betting | No money, no wallet, no token rewards, no wagering flow |
| No official branding | No official logos, crests, or tournament marks |
| Public repo | https://github.com/kooroot/Fanpulse |
| Live deployment | https://fanpulse-seven.vercel.app |
| Demo video | `fanpulse_youtube_subtitled.mp4` local upload artifact |
| Tests | Vitest suite with 35 passing tests |
