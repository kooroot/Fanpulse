import type { PulseCard } from "@/lib/pulse/types";
import type {
  FanExperienceInput,
  HiLoChallenge,
  HiLoPick,
  HiLoStatReading,
  PunditMoment,
  PunditMomentTone,
  SweepstakePlayer,
} from "@/lib/experience/types";
import type { NormalizedOddsUpdate } from "@/lib/txline/types";

const HI_LO_OPTIONS: HiLoPick[] = ["Higher", "Lower", "Same"];
const SWEEPSTAKE_NAMES = ["Mina", "Jae", "Alex", "Sam"] as const;
const HI_LO_SAME_THRESHOLD = 2;

export function buildPunditMoments(input: FanExperienceInput): PunditMoment[] {
  const pulseMoments = input.pulseCards
    .slice(-5)
    .reverse()
    .map((card) => punditFromPulseCard(input, card));
  const marketMood = buildMarketMoodMoment(input);
  const moments = marketMood
    ? [marketMood, ...pulseMoments].slice(0, 5)
    : pulseMoments;

  if (moments.length > 0) return moments;

  return [
    {
      id: `pundit-meter-${input.fixture.fixtureId}-${input.pulseMeter.ts}`,
      fixtureId: input.fixture.fixtureId,
      ts: input.pulseMeter.ts,
      title: "Pundit feed warming up",
      body:
        input.score === undefined
          ? `${input.fixture.participant1} vs ${input.fixture.participant2} is live-ready. FanPulse will call out the first meaningful swing as TxLINE updates arrive.`
          : `${input.pulseMeter.label}. The match is balanced enough that the next event can change the whole feel.`,
      tone: input.pulseMeter.chaos >= 40 ? "chaos" : "calm",
      priority: input.pulseMeter.chaos >= 40 ? 4 : 2,
      source: "meter",
      shareLine: `${input.fixture.participant1} vs ${input.fixture.participant2}: ${input.pulseMeter.label}.`,
    },
  ];
}

export function buildPressureIndex(input: FanExperienceInput): number {
  const stats = input.score?.stats ?? {};
  const corners = Number(stats["7"] ?? 0) + Number(stats["8"] ?? 0);
  const cards =
    Number(stats["3"] ?? 0) +
    Number(stats["4"] ?? 0) +
    Number(stats["5"] ?? 0) * 2 +
    Number(stats["6"] ?? 0) * 2;
  const goals =
    (input.score?.participant1Score ?? 0) + (input.score?.participant2Score ?? 0);
  const latestIntensity = input.pulseCards.at(-1)?.intensity ?? 1;

  return Math.round(
    input.pulseMeter.chaos +
      corners * 8 +
      cards * 7 +
      goals * 10 +
      latestIntensity * 4,
  );
}

export function buildHiLoStatReading(input: FanExperienceInput): HiLoStatReading {
  const stats = input.score?.stats ?? {};
  const minute = Math.max(1, input.score?.minute ?? 1);
  const corners = stat(stats, 7) + stat(stats, 8);
  const discipline =
    stat(stats, 3) + stat(stats, 4) + stat(stats, 5) * 2 + stat(stats, 6) * 2;
  const statGoals = stat(stats, 1) + stat(stats, 2);
  const scoreGoals =
    (input.score?.participant1Score ?? 0) + (input.score?.participant2Score ?? 0);
  const goals = statGoals || scoreGoals;

  if (corners > 0 || hasAnyStat(stats, [7, 8])) {
    return paceReading({
      key: "corners",
      label: "Corner pace",
      sourceLabel: "TxLINE stat keys 7+8",
      statKeys: [7, 8],
      rawCount: corners,
      minute,
    });
  }

  if (discipline > 0 || hasAnyStat(stats, [3, 4, 5, 6])) {
    return paceReading({
      key: "discipline",
      label: "Card heat",
      sourceLabel: "TxLINE stat keys 3-6",
      statKeys: [3, 4, 5, 6],
      rawCount: discipline,
      minute,
    });
  }

  return paceReading({
    key: "goals",
    label: "Goal pace",
    sourceLabel: "TxLINE score feed + stat keys 1+2",
    statKeys: [1, 2],
    rawCount: goals,
    minute,
  });
}

export function formatHiLoValue(value: number): string {
  return `${(value / 10).toFixed(1)}/15m`;
}

export function createHiLoChallenge(
  input: FanExperienceInput,
  createdAt = Date.now(),
): HiLoChallenge {
  const reading = buildHiLoStatReading(input);
  const minute = input.score?.minute;
  const minuteText = minute === undefined ? "live refresh" : `${minute}'`;

  return {
    id: `${input.fixture.fixtureId}-${reading.key}-${input.pulseCards.length}-${input.pulseMeter.ts}-${reading.value}`,
    fixtureId: input.fixture.fixtureId,
    statKey: reading.key,
    label: reading.label,
    sourceLabel: reading.sourceLabel,
    statKeys: reading.statKeys,
    unit: reading.unit,
    baseline: reading.value,
    current: reading.value,
    question: `Next TxLINE stat update after ${minuteText}: higher, lower, or same pace?`,
    options: HI_LO_OPTIONS,
    status: "OPEN",
    xpReward: 15,
    createdAt,
  };
}

export function resolveHiLoChallenge(
  challenge: HiLoChallenge,
  currentValue: number,
  resolvedAt = Date.now(),
): HiLoChallenge {
  const delta = currentValue - challenge.baseline;
  const resolvedOption: HiLoPick =
    Math.abs(delta) <= HI_LO_SAME_THRESHOLD
      ? "Same"
      : delta > 0
        ? "Higher"
        : "Lower";

  return {
    ...challenge,
    current: currentValue,
    resolvedOption,
    status: "RESOLVED",
    resolvedAt,
  };
}

export function scoreHiLoPick(
  challenge: HiLoChallenge,
): { xp: number; streakDelta: 0 | 1; correct: boolean } {
  const correct =
    challenge.status === "RESOLVED" &&
    challenge.selectedOption !== undefined &&
    challenge.selectedOption === challenge.resolvedOption;

  return {
    xp: correct ? challenge.xpReward : challenge.selectedOption ? 3 : 0,
    streakDelta: correct ? 1 : 0,
    correct,
  };
}

export function buildSweepstakeBoard(input: FanExperienceInput): SweepstakePlayer[] {
  const p1Score = input.score?.participant1Score ?? 0;
  const p2Score = input.score?.participant2Score ?? 0;
  const p1Pulse = input.pulseMeter.p1;
  const p2Pulse = input.pulseMeter.p2;
  const chaosBonus = Math.round(input.pulseMeter.chaos / 10);
  const sides = [
    {
      side: "P1" as const,
      team: input.fixture.participant1,
      score: p1Score,
      pulse: p1Pulse,
    },
    {
      side: "P2" as const,
      team: input.fixture.participant2,
      score: p2Score,
      pulse: p2Pulse,
    },
  ];

  const rows = SWEEPSTAKE_NAMES.map((name, index) => {
    const side = sides[index % sides.length];
    const points = side.score * 30 + Math.round(side.pulse / 2) + chaosBonus;

    return {
      name,
      team: side.team,
      side: side.side,
      points,
      note: side.score > 0 ? "score boost" : "momentum watch",
      leader: false,
    };
  });

  const maxPoints = Math.max(...rows.map((row) => row.points));
  return rows
    .map((row) => ({ ...row, leader: row.points === maxPoints }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function buildMarketMoodMoment(input: FanExperienceInput): PunditMoment | undefined {
  const odds = (input.odds ?? [])
    .filter((update) => update.impliedProbability !== undefined)
    .sort((a, b) => a.ts - b.ts || (a.seq ?? 0) - (b.seq ?? 0));
  if (odds.length === 0) {
    if (input.fixture.source !== "txline") return undefined;

    return {
      id: `pundit-market-waiting-${input.fixture.fixtureId}-${input.pulseMeter.ts}`,
      fixtureId: input.fixture.fixtureId,
      ts: input.pulseMeter.ts,
      title: "Market mood waiting for odds",
      body:
        "TxLINE live scores are connected. FanPulse will add odds-derived market mood as soon as an odds snapshot arrives for this fixture.",
      tone: "calm",
      priority: 2,
      source: "odds",
      shareLine: `${input.fixture.participant1} vs ${input.fixture.participant2}: live scores are connected and market mood is waiting for odds.`,
    };
  }

  const firstBySelection = new Map<string, NormalizedOddsUpdate>();
  const latestBySelection = new Map<string, NormalizedOddsUpdate>();

  for (const update of odds) {
    if (!firstBySelection.has(update.selection)) {
      firstBySelection.set(update.selection, update);
    }
    latestBySelection.set(update.selection, update);
  }

  const leader = [...latestBySelection.values()].sort(
    (a, b) => (b.impliedProbability ?? 0) - (a.impliedProbability ?? 0),
  )[0];
  if (!leader) return undefined;

  const baseline = firstBySelection.get(leader.selection);
  const delta =
    (leader.impliedProbability ?? 0) - (baseline?.impliedProbability ?? 0);
  const team = selectionLabel(input, leader.selection);
  const pct = Math.round((leader.impliedProbability ?? 0) * 100);
  const deltaPct = Math.round(Math.abs(delta) * 100);
  const isSwing = Math.abs(delta) >= 0.06;
  const movement =
    delta > 0.01 ? "stronger" : delta < -0.01 ? "softer" : "steady";
  const title = isSwing
    ? `Market mood swings toward ${team}`
    : `Market mood leans ${team}`;
  const body =
    leader.selection === "DRAW"
      ? `The odds-derived mood reads this as balanced at about ${pct}%. FanPulse turns that signal into watch-party context.`
      : `The odds-derived mood now leans toward ${team} at about ${pct}%, with the latest read ${movement}${deltaPct > 0 ? ` by ${deltaPct} points` : ""}.`;

  return {
    id: `pundit-market-${input.fixture.fixtureId}-${leader.selection}-${leader.ts}`,
    fixtureId: input.fixture.fixtureId,
    ts: leader.ts,
    title,
    body,
    tone: isSwing ? "swing" : "calm",
    priority: isSwing ? 4 : 2,
    source: "odds",
    shareLine: `${input.fixture.participant1} vs ${input.fixture.participant2}: ${title}. ${body}`,
  };
}

function punditFromPulseCard(
  input: FanExperienceInput,
  card: PulseCard,
): PunditMoment {
  const tone = toneForCard(card);
  const teamText =
    card.teamFocus === "P1"
      ? input.fixture.participant1
      : card.teamFocus === "P2"
        ? input.fixture.participant2
        : undefined;
  const body = teamText
    ? `${card.summary} ${teamText} is the name fans will notice on this pulse.`
    : card.summary;

  return {
    id: `pundit-${card.id}`,
    fixtureId: input.fixture.fixtureId,
    ts: card.ts,
    title: card.title,
    body,
    tone,
    priority: card.intensity,
    source: "pulse-card",
    shareLine: `${input.fixture.participant1} vs ${input.fixture.participant2}: ${card.title} - ${card.summary}`,
  };
}

function toneForCard(card: PulseCard): PunditMomentTone {
  if (card.type === "FINAL_WHISTLE") return "final";
  if (card.type === "CHAOS_SPIKE") return "chaos";
  if (
    card.type === "GOAL" ||
    card.type === "ODDS_SHOCK" ||
    card.type === "MOMENTUM_SHIFT" ||
    card.type === "COMEBACK_WINDOW"
  ) {
    return "swing";
  }
  if (card.type === "CORNER_PRESSURE" || card.type === "DISCIPLINE_SHIFT") {
    return "pressure";
  }
  return "calm";
}

function selectionLabel(input: FanExperienceInput, selection: string): string {
  if (selection === "P1") return input.fixture.participant1;
  if (selection === "P2") return input.fixture.participant2;
  if (selection === "DRAW") return "balanced";
  return selection;
}

function stat(stats: Record<string, number>, key: number): number {
  return Number(stats[String(key)] ?? 0);
}

function hasAnyStat(stats: Record<string, number>, keys: number[]): boolean {
  return keys.some((key) =>
    Object.prototype.hasOwnProperty.call(stats, String(key)),
  );
}

function paceReading(args: {
  key: HiLoStatReading["key"];
  label: string;
  sourceLabel: string;
  statKeys: number[];
  rawCount: number;
  minute: number;
}): HiLoStatReading {
  return {
    ...args,
    value: Math.round((args.rawCount / args.minute) * 150),
    unit: "per15",
  };
}
