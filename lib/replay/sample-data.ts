import demoFixture from "@/data/replay/demo-fixture.json";
import demoOddsUpdates from "@/data/replay/demo-odds-updates.json";
import demoScoreUpdates from "@/data/replay/demo-score-updates.json";
import type { ReplayEvent, ReplayMatch } from "@/lib/pulse/types";
import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";

type ScoreSeed = NormalizedScoreUpdate & { offsetMs: number };
type OddsSeed = NormalizedOddsUpdate & { offsetMs: number };

export const DEMO_FIXTURE_ID = "demo-alpha-beta";

export function getDemoFixture(): NormalizedFixture {
  return demoFixture as NormalizedFixture;
}

export function getDemoScoreSeeds(): ScoreSeed[] {
  return demoScoreUpdates as ScoreSeed[];
}

export function getDemoOddsSeeds(): OddsSeed[] {
  return demoOddsUpdates as OddsSeed[];
}

export function getDemoScoreUpdates(): NormalizedScoreUpdate[] {
  return getDemoScoreSeeds().map((update) => withoutOffset(update));
}

export function getDemoOddsUpdates(): NormalizedOddsUpdate[] {
  return getDemoOddsSeeds().map((update) => withoutOffset(update));
}

export function getDemoTimeline(): ReplayEvent[] {
  const scoreEvents: ReplayEvent[] = getDemoScoreSeeds().map((score) => ({
    id: `score-${score.seq ?? score.ts}`,
    kind: "score",
    offsetMs: score.offsetMs,
    score: withoutOffset(score),
  }));

  const oddsEvents: ReplayEvent[] = getDemoOddsSeeds().map((odds) => ({
    id: `odds-${odds.seq ?? odds.ts}`,
    kind: "odds",
    offsetMs: odds.offsetMs,
    odds: withoutOffset(odds),
  }));

  return [...scoreEvents, ...oddsEvents].sort((a, b) => {
    if (a.offsetMs !== b.offsetMs) return a.offsetMs - b.offsetMs;
    return a.id.localeCompare(b.id);
  });
}

export function getDemoReplayMatch(): ReplayMatch {
  const timeline = getDemoTimeline();
  const durationMs = Math.max(...timeline.map((event) => event.offsetMs), 0);

  return {
    fixture: getDemoFixture(),
    durationMs,
    scoreUpdates: getDemoScoreUpdates(),
    oddsUpdates: getDemoOddsUpdates(),
    timeline,
  };
}

function withoutOffset<T extends { offsetMs: number }>(
  value: T,
): Omit<T, "offsetMs"> {
  const rest: Partial<T> = { ...value };
  delete rest.offsetMs;
  return rest as Omit<T, "offsetMs">;
}
