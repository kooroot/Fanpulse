import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";
import { FINAL_PHASE_IDS } from "@/lib/txline/types";
import type { PulseCard, PulseCardType, TeamFocus } from "@/lib/pulse/types";
import { hashInput } from "@/lib/utils/hash";

type PulseCardEngineInput = {
  fixture: NormalizedFixture;
  scoreUpdates: NormalizedScoreUpdate[];
  oddsUpdates: NormalizedOddsUpdate[];
};

type EngineEvent =
  | { kind: "score"; ts: number; update: NormalizedScoreUpdate }
  | { kind: "odds"; ts: number; update: NormalizedOddsUpdate };

const SCORE_GOAL_KEYS = [1, 2] as const;
const DISCIPLINE_KEYS = [3, 4, 5, 6] as const;
const CORNER_KEYS = [7, 8] as const;

export function derivePulseCards(input: PulseCardEngineInput): PulseCard[] {
  const cards: PulseCard[] = [];
  const oddsBySelection = new Map<string, NormalizedOddsUpdate>();
  const processedOddsShockBuckets = new Set<number>();
  const processedFinalPhases = new Set<number>();
  let previousScore: NormalizedScoreUpdate | undefined;
  let lastCornerMinute = -Infinity;
  let lastChaosMinute = -Infinity;
  let lastMomentumMinute = -Infinity;

  for (const event of toSortedEvents(input)) {
    if (event.kind === "score") {
      const update = event.update;

      if (
        update.phaseId === 2 &&
        (!previousScore || previousScore.phaseId !== 2)
      ) {
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "KICKOFF",
            title: "The match is live",
            summary:
              "The first pulse is on. Watch the match momentum build from here.",
            intensity: 1,
            teamFocus: "NEUTRAL",
            fanLabel: "Kickoff",
          }),
        );
      }

      const goalSide = detectGoalSide(previousScore, update);
      if (goalSide) {
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "GOAL",
            title: titleForGoal(input.fixture, goalSide, previousScore, update),
            summary: summaryForGoal(input.fixture, goalSide, previousScore, update),
            intensity: update.minute && update.minute >= 75 ? 5 : 4,
            teamFocus: goalSide,
            fanLabel: "Goal pulse",
            statKeys: SCORE_GOAL_KEYS.filter((key) =>
              statIncreased(previousScore, update, key),
            ),
          }),
        );

        if (scoreGapNarrowed(previousScore, update)) {
          cards.push(
            makeCard({
              fixture: input.fixture,
              update,
              type: "COMEBACK_WINDOW",
              title: "The comeback window opens",
              summary: "This is no longer one-way traffic.",
              intensity: 4,
              teamFocus: goalSide,
              fanLabel: "Comeback energy",
              statKeys: SCORE_GOAL_KEYS.filter((key) =>
                statIncreased(previousScore, update, key),
              ),
            }),
          );
        }
      }

      const disciplineKeys = DISCIPLINE_KEYS.filter((key) =>
        statIncreased(previousScore, update, key),
      );
      if (disciplineKeys.length > 0) {
        const teamFocus = disciplineKeys.some((key) => key === 3 || key === 5)
          ? "P1"
          : "P2";
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "DISCIPLINE_SHIFT",
            title: "Discipline changes the rhythm",
            summary: "A card tilts the pressure and changes how the match feels.",
            intensity: disciplineKeys.some((key) => key === 5 || key === 6)
              ? 4
              : 3,
            teamFocus,
            fanLabel: "Card pressure",
            statKeys: disciplineKeys,
          }),
        );
      }

      const cornerKeys = CORNER_KEYS.filter((key) =>
        statIncreased(previousScore, update, key),
      );
      const minute = update.minute ?? update.ts;
      if (cornerKeys.length > 0 && minute - lastCornerMinute >= 8) {
        lastCornerMinute = minute;
        const teamFocus = cornerKeys.some((key) => key === 7) ? "P1" : "P2";
        const teamName = teamLabel(input.fixture, teamFocus);
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "CORNER_PRESSURE",
            title: "Pressure is stacking up",
            summary: `${teamName} is forcing the issue and making the stadium feel it.`,
            intensity: 3,
            teamFocus,
            fanLabel: "Pressure wave",
            statKeys: cornerKeys,
          }),
        );
      }

      if (
        FINAL_PHASE_IDS.has(update.phaseId ?? 0) &&
        !processedFinalPhases.has(update.phaseId ?? 0)
      ) {
        processedFinalPhases.add(update.phaseId ?? 0);
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "FINAL_WHISTLE",
            title: "Full-time story locked",
            summary: finalSummary(input.fixture, cards, update),
            intensity: 3,
            teamFocus: winningSide(update),
            fanLabel: "Final pulse",
          }),
        );
      }

      const newCards = cards.filter((card) => card.ts === update.ts);
      if (shouldAddChaosSpike(newCards, cards, update.minute, lastChaosMinute)) {
        lastChaosMinute = update.minute ?? update.ts;
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "CHAOS_SPIKE",
            title: "Chaos spike",
            summary: "The match just got wild.",
            intensity: 5,
            teamFocus: "NEUTRAL",
            fanLabel: "Wild moment",
          }),
        );
      }

      previousScore = update;
      continue;
    }

    const update = event.update;
    const previousOdds = oddsBySelection.get(update.selection);
    oddsBySelection.set(update.selection, update);

    if (!previousOdds || update.impliedProbability === undefined) {
      continue;
    }

    const delta =
      update.impliedProbability - (previousOdds.impliedProbability ?? 0);
    const bucket = Math.round(update.ts);
    const currentScore = previousScore;

    if (
      Math.abs(delta) >= 0.06 &&
      !processedOddsShockBuckets.has(bucket)
    ) {
      processedOddsShockBuckets.add(bucket);
      const focus = focusFromOddsMove(update.selection, delta);
      cards.push(
        makeCard({
          fixture: input.fixture,
          update,
          type: "ODDS_SHOCK",
          title: "The match mood flipped fast",
          summary: oddsShockSummary(input.fixture, focus),
          intensity: Math.abs(delta) >= 0.12 ? 5 : 4,
          teamFocus: focus,
          fanLabel: "Mood swing",
        }),
      );

      const oddsMinute = currentScore?.minute ?? update.ts;
      if (oddsMinute - lastMomentumMinute >= 10) {
        lastMomentumMinute = oddsMinute;
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "MOMENTUM_SHIFT",
            title: "The pulse flips",
            summary: "Momentum moved sharply and the match feels different now.",
            intensity: 4,
            teamFocus: focus,
            fanLabel: "Momentum swing",
          }),
        );
      }

      if (isLosingSide(currentScore, update.selection) && delta >= 0.06) {
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "COMEBACK_WINDOW",
            title: "This is no longer one-way traffic",
            summary: `${teamLabel(
              input.fixture,
              update.selection,
            )} is making the match feel alive again.`,
            intensity: 4,
            teamFocus: focus,
            fanLabel: "Comeback energy",
          }),
        );
      }

      if (shouldAddChaosSpike(cards.slice(-3), cards, oddsMinute, lastChaosMinute)) {
        lastChaosMinute = oddsMinute;
        cards.push(
          makeCard({
            fixture: input.fixture,
            update,
            type: "CHAOS_SPIKE",
            title: "The match just got wild",
            summary: "A sharp swing landed right on top of live match drama.",
            intensity: 5,
            teamFocus: "NEUTRAL",
            fanLabel: "Chaos spike",
          }),
        );
      }
    }
  }

  return dedupeCards(cards).sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id));
}

function toSortedEvents(input: PulseCardEngineInput): EngineEvent[] {
  return [
    ...input.scoreUpdates.map((update) => ({
      kind: "score" as const,
      ts: update.ts,
      update,
    })),
    ...input.oddsUpdates.map((update) => ({
      kind: "odds" as const,
      ts: update.ts,
      update,
    })),
  ].sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    if (a.kind === b.kind) return 0;
    return a.kind === "score" ? -1 : 1;
  });
}

function makeCard(args: {
  fixture: NormalizedFixture;
  update: NormalizedScoreUpdate | NormalizedOddsUpdate;
  type: PulseCardType;
  title: string;
  summary: string;
  intensity: PulseCard["intensity"];
  teamFocus?: TeamFocus | string;
  fanLabel: string;
  statKeys?: readonly number[];
}): PulseCard {
  const scoreUpdate =
    "participant1Score" in args.update ? args.update : undefined;
  const oddsUpdate = "selection" in args.update ? args.update : undefined;
  const teamFocus = normalizeFocus(args.teamFocus);
  const hash = hashInput({
    fixtureId: args.fixture.fixtureId,
    type: args.type,
    update: args.update,
    statKeys: args.statKeys,
  });

  return {
    id: `${args.type.toLowerCase()}-${args.update.ts}-${hash}`,
    fixtureId: args.fixture.fixtureId,
    ts: args.update.ts,
    minute: scoreUpdate?.minute,
    type: args.type,
    title: args.title,
    summary: args.summary,
    intensity: args.intensity,
    teamFocus,
    fanLabel: args.fanLabel,
    dataBadge:
      args.update.source === "txline" ? "TxLINE Verified Data" : "Replay Data",
    derivedFrom: {
      scoreSeq: scoreUpdate?.seq,
      oddsSeq: oddsUpdate?.seq,
      statKeys: args.statKeys ? [...args.statKeys] : undefined,
      inputHash: hash,
    },
  };
}

function detectGoalSide(
  previous: NormalizedScoreUpdate | undefined,
  current: NormalizedScoreUpdate,
): "P1" | "P2" | undefined {
  const previousP1 = previous?.participant1Score ?? statValue(previous, 1);
  const previousP2 = previous?.participant2Score ?? statValue(previous, 2);
  const currentP1 = current.participant1Score ?? statValue(current, 1);
  const currentP2 = current.participant2Score ?? statValue(current, 2);

  if ((currentP1 ?? 0) > (previousP1 ?? 0) || statIncreased(previous, current, 1)) {
    return "P1";
  }

  if ((currentP2 ?? 0) > (previousP2 ?? 0) || statIncreased(previous, current, 2)) {
    return "P2";
  }

  return undefined;
}

function statIncreased(
  previous: NormalizedScoreUpdate | undefined,
  current: NormalizedScoreUpdate,
  key: number,
): boolean {
  return statValue(current, key) > statValue(previous, key);
}

function statValue(
  update: NormalizedScoreUpdate | undefined,
  key: number,
): number {
  return Number(update?.stats?.[String(key)] ?? 0);
}

function scoreGapNarrowed(
  previous: NormalizedScoreUpdate | undefined,
  current: NormalizedScoreUpdate,
): boolean {
  if (!previous) return false;
  const previousGap = Math.abs(
    (previous.participant1Score ?? 0) - (previous.participant2Score ?? 0),
  );
  const currentGap = Math.abs(
    (current.participant1Score ?? 0) - (current.participant2Score ?? 0),
  );
  return previousGap > currentGap;
}

function titleForGoal(
  fixture: NormalizedFixture,
  side: "P1" | "P2",
  previous: NormalizedScoreUpdate | undefined,
  current: NormalizedScoreUpdate,
): string {
  const teamName = teamLabel(fixture, side);
  if (scoreGapNarrowed(previous, current)) return `${teamName} pulls it back`;
  return `${teamName} takes control`;
}

function summaryForGoal(
  fixture: NormalizedFixture,
  side: "P1" | "P2",
  previous: NormalizedScoreUpdate | undefined,
  current: NormalizedScoreUpdate,
): string {
  const teamName = teamLabel(fixture, side);
  if (scoreGapNarrowed(previous, current)) {
    return `${teamName} brings the match back to life. The pulse is louder now.`;
  }

  if ((current.minute ?? 0) >= 75) {
    return `${teamName} lands a late swing and the final push gets serious.`;
  }

  return "Goal changes the match. The crowd would feel this shift immediately.";
}

function oddsShockSummary(
  fixture: NormalizedFixture,
  focus?: TeamFocus,
): string {
  if (focus === "DRAW") return "The crowd would feel this swing toward balance.";
  if (focus === "P1" || focus === "P2") {
    return `Momentum moved sharply toward ${teamLabel(fixture, focus)}.`;
  }

  return "The crowd would feel this swing.";
}

function finalSummary(
  fixture: NormalizedFixture,
  cards: PulseCard[],
  update: NormalizedScoreUpdate,
): string {
  const winner = winningSide(update);
  const biggest = cards
    .filter((card) => card.type !== "FINAL_WHISTLE")
    .sort((a, b) => b.intensity - a.intensity)[0];

  if (winner === "NEUTRAL") {
    return `The final pulse ends level. ${biggest?.title ?? "The biggest swing"} shaped the story.`;
  }

  return `${teamLabel(fixture, winner)} controlled the final score after ${biggest?.fanLabel.toLowerCase() ?? "a major pulse"} and late drama.`;
}

function winningSide(update: NormalizedScoreUpdate): TeamFocus {
  const p1 = update.participant1Score ?? 0;
  const p2 = update.participant2Score ?? 0;
  if (p1 > p2) return "P1";
  if (p2 > p1) return "P2";
  return "NEUTRAL";
}

function focusFromOddsMove(selection: string, delta: number): TeamFocus {
  const normalized = normalizeFocus(selection);
  if (normalized === "DRAW") return "DRAW";
  if (normalized === "P1" || normalized === "P2") {
    return delta >= 0 ? normalized : normalized === "P1" ? "P2" : "P1";
  }
  return "NEUTRAL";
}

function normalizeFocus(focus?: string): TeamFocus | undefined {
  if (focus === "P1" || focus === "P2" || focus === "DRAW" || focus === "NEUTRAL") {
    return focus;
  }

  return undefined;
}

function isLosingSide(
  score: NormalizedScoreUpdate | undefined,
  selection: string,
): boolean {
  if (!score) return false;
  if (selection === "P1") {
    return (score.participant1Score ?? 0) < (score.participant2Score ?? 0);
  }
  if (selection === "P2") {
    return (score.participant2Score ?? 0) < (score.participant1Score ?? 0);
  }
  return false;
}

function shouldAddChaosSpike(
  newCards: PulseCard[],
  allCards: PulseCard[],
  minute?: number,
  lastChaosMinute = -Infinity,
): boolean {
  const currentMinute = minute ?? newCards.at(-1)?.minute ?? newCards.at(-1)?.ts ?? 0;
  if (currentMinute - lastChaosMinute < 10) return false;

  const recentTypes = new Set(
    [...allCards, ...newCards]
      .filter((card) => {
        const cardMinute = card.minute ?? card.ts;
        return currentMinute - cardMinute <= 5 && card.type !== "CHAOS_SPIKE";
      })
      .map((card) => card.type),
  );

  const hasGoal = recentTypes.has("GOAL");
  const hasSwing =
    recentTypes.has("ODDS_SHOCK") || recentTypes.has("MOMENTUM_SHIFT");
  const hasCard = recentTypes.has("DISCIPLINE_SHIFT");
  const hasLatePressure =
    currentMinute >= 75 &&
    (recentTypes.has("CORNER_PRESSURE") || recentTypes.has("COMEBACK_WINDOW"));

  return (hasGoal && (hasSwing || hasCard)) || hasLatePressure;
}

function dedupeCards(cards: PulseCard[]): PulseCard[] {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = `${card.type}-${card.ts}-${card.derivedFrom.inputHash}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function teamLabel(
  fixture: NormalizedFixture,
  focus?: string,
): string {
  if (focus === "P1") return fixture.participant1;
  if (focus === "P2") return fixture.participant2;
  if (focus === "DRAW") return "the balanced match state";
  return "the match";
}
