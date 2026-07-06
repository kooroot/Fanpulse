import type { PulseCard } from "@/lib/pulse/types";
import type {
  FanExperienceInput,
  HiLoChallenge,
  HiLoPick,
  PunditMoment,
  PunditMomentTone,
  SweepstakePlayer,
} from "@/lib/experience/types";

const HI_LO_OPTIONS: HiLoPick[] = ["Higher", "Lower", "Same"];
const SWEEPSTAKE_NAMES = ["Mina", "Jae", "Alex", "Sam"] as const;

export function buildPunditMoments(input: FanExperienceInput): PunditMoment[] {
  const moments = input.pulseCards
    .slice(-5)
    .reverse()
    .map((card) => punditFromPulseCard(input, card));

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

export function createHiLoChallenge(
  input: FanExperienceInput,
  createdAt = Date.now(),
): HiLoChallenge {
  const pressure = buildPressureIndex(input);
  const minute = input.score?.minute;
  const minuteText = minute === undefined ? "live refresh" : `${minute}'`;

  return {
    id: `${input.fixture.fixtureId}-pressure-${input.pulseCards.length}-${input.pulseMeter.ts}-${pressure}`,
    fixtureId: input.fixture.fixtureId,
    label: "Pressure Index",
    baseline: pressure,
    current: pressure,
    question: `Next ${minuteText}: does pressure go higher, lower, or stay close?`,
    options: HI_LO_OPTIONS,
    status: "OPEN",
    xpReward: 15,
    createdAt,
  };
}

export function resolveHiLoChallenge(
  challenge: HiLoChallenge,
  currentPressure: number,
  resolvedAt = Date.now(),
): HiLoChallenge {
  const delta = currentPressure - challenge.baseline;
  const resolvedOption: HiLoPick =
    Math.abs(delta) <= 3 ? "Same" : delta > 0 ? "Higher" : "Lower";

  return {
    ...challenge,
    current: currentPressure,
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
