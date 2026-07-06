import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";
import type { PulseCard, PulseMeterState } from "@/lib/pulse/types";
import { clamp } from "@/lib/utils/format";

type PulseMeterInput = {
  fixture: NormalizedFixture;
  scoreUpdates: NormalizedScoreUpdate[];
  oddsUpdates: NormalizedOddsUpdate[];
  pulseCards: PulseCard[];
};

export function computePulseMeter(input: PulseMeterInput): PulseMeterState {
  const currentScore = input.scoreUpdates.at(-1);
  const previousScore = input.scoreUpdates.at(-2);
  const latestOdds = latestOddsBySelection(input.oddsUpdates);
  const firstRecentOdds = earliestRecentOddsBySelection(input.oddsUpdates, 20);
  const reasons: string[] = [];
  let p1 = 32;
  let p2 = 32;
  let chaos = 36;

  const p1Score = currentScore?.participant1Score ?? 0;
  const p2Score = currentScore?.participant2Score ?? 0;
  const scoreGap = Math.abs(p1Score - p2Score);

  if (p1Score > p2Score) {
    p1 += 15;
    p2 -= 5;
    reasons.push(`${input.fixture.participant1} leads the score`);
  } else if (p2Score > p1Score) {
    p2 += 15;
    p1 -= 5;
    reasons.push(`${input.fixture.participant2} leads the score`);
  } else {
    chaos += 8;
    reasons.push("The score is balanced");
  }

  const scoringSide = recentGoalSide(previousScore, currentScore);
  if (scoringSide === "P1") {
    p1 += 15;
    chaos += 3;
    reasons.push(`${input.fixture.participant1} just scored`);
  } else if (scoringSide === "P2") {
    p2 += 15;
    chaos += 3;
    reasons.push(`${input.fixture.participant2} just scored`);
  }

  for (const [selection, odds] of latestOdds.entries()) {
    const baseline = firstRecentOdds.get(selection);
    if (!baseline || odds.impliedProbability === undefined) continue;

    const delta =
      odds.impliedProbability - (baseline.impliedProbability ?? 0);
    const strength = clamp(Math.abs(delta) * 180, 0, 25);
    if (strength < 3) continue;

    if (selection === "P1") {
      if (delta > 0) p1 += strength;
      else p2 += strength / 2;
      reasons.push(`${input.fixture.participant1} mood moved`);
    } else if (selection === "P2") {
      if (delta > 0) p2 += strength;
      else p1 += strength / 2;
      reasons.push(`${input.fixture.participant2} mood moved`);
    } else if (selection === "DRAW" && delta > 0) {
      chaos += strength;
      reasons.push("Balance pressure rose");
    }
  }

  const p1Corners = statValue(currentScore, 7);
  const p2Corners = statValue(currentScore, 8);
  if (p1Corners > p2Corners) {
    p1 += clamp((p1Corners - p2Corners) * 3, 0, 10);
    reasons.push(`${input.fixture.participant1} corner pressure`);
  } else if (p2Corners > p1Corners) {
    p2 += clamp((p2Corners - p1Corners) * 3, 0, 10);
    reasons.push(`${input.fixture.participant2} corner pressure`);
  }

  const p1Yellows = statValue(currentScore, 3);
  const p2Yellows = statValue(currentScore, 4);
  const p1Reds = statValue(currentScore, 5);
  const p2Reds = statValue(currentScore, 6);
  p1 -= p1Yellows * 2 + p1Reds * 10;
  p2 += p1Reds * 10;
  p2 -= p2Yellows * 2 + p2Reds * 10;
  p1 += p2Reds * 10;
  if (p1Yellows + p2Yellows + p1Reds + p2Reds > 0) {
    chaos += 4;
    reasons.push("Cards changed the rhythm");
  }

  const minute = currentScore?.minute ?? 0;
  if (minute >= 75 && scoreGap <= 1) {
    chaos += 34;
    reasons.push("Late close-score drama");
  }

  const recentCards = input.pulseCards.filter((card) => {
    const cardMinute = card.minute ?? card.ts;
    return minute - cardMinute <= 5;
  });
  if (recentCards.length >= 2) {
    chaos += 10;
    reasons.push("Multiple pulses landed close together");
  }

  p1 = Math.max(4, p1);
  p2 = Math.max(4, p2);
  chaos = Math.max(8, chaos);

  const normalized = normalizeHundred({ p1, p2, chaos });
  const leader = normalized.p1 > normalized.p2 + 6
    ? "P1"
    : normalized.p2 > normalized.p1 + 6
      ? "P2"
      : "NEUTRAL";

  return {
    fixtureId: input.fixture.fixtureId,
    ts: currentScore?.ts ?? input.oddsUpdates.at(-1)?.ts ?? 0,
    p1: normalized.p1,
    p2: normalized.p2,
    chaos: normalized.chaos,
    leader,
    label: meterLabel(input.fixture, normalized, leader, minute, scoreGap),
    reasons: reasons.slice(-4),
  };
}

function latestOddsBySelection(
  oddsUpdates: NormalizedOddsUpdate[],
): Map<string, NormalizedOddsUpdate> {
  const map = new Map<string, NormalizedOddsUpdate>();
  for (const update of oddsUpdates) {
    map.set(update.selection, update);
  }
  return map;
}

function earliestRecentOddsBySelection(
  oddsUpdates: NormalizedOddsUpdate[],
  windowSeconds: number,
): Map<string, NormalizedOddsUpdate> {
  const latestTs = oddsUpdates.at(-1)?.ts ?? 0;
  const map = new Map<string, NormalizedOddsUpdate>();

  for (const update of oddsUpdates) {
    if (latestTs - update.ts <= windowSeconds && !map.has(update.selection)) {
      map.set(update.selection, update);
    }
  }

  return map;
}

function recentGoalSide(
  previous: NormalizedScoreUpdate | undefined,
  current: NormalizedScoreUpdate | undefined,
): "P1" | "P2" | undefined {
  if (!previous || !current) return undefined;
  if ((current.participant1Score ?? 0) > (previous.participant1Score ?? 0)) {
    return "P1";
  }
  if ((current.participant2Score ?? 0) > (previous.participant2Score ?? 0)) {
    return "P2";
  }
  return undefined;
}

function statValue(
  update: NormalizedScoreUpdate | undefined,
  key: number,
): number {
  return Number(update?.stats?.[String(key)] ?? 0);
}

function normalizeHundred(values: {
  p1: number;
  p2: number;
  chaos: number;
}): { p1: number; p2: number; chaos: number } {
  const total = values.p1 + values.p2 + values.chaos;
  const p1 = Math.round((values.p1 / total) * 100);
  const p2 = Math.round((values.p2 / total) * 100);
  const chaos = 100 - p1 - p2;
  return { p1, p2, chaos };
}

function meterLabel(
  fixture: NormalizedFixture,
  values: { p1: number; p2: number; chaos: number },
  leader: PulseMeterState["leader"],
  minute: number,
  scoreGap: number,
): string {
  if (minute >= 75 && scoreGap <= 1) return "Late drama mode";
  if (values.chaos >= 40) return "Chaos is rising";
  if (leader === "P1") return `${fixture.participant1} is taking over`;
  if (leader === "P2") return `${fixture.participant2} is pushing back`;
  if (scoreGap === 1) return "Comeback energy is building";
  return "The match is balanced";
}
