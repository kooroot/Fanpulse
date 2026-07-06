import type { NormalizedFixture, NormalizedScoreUpdate } from "@/lib/txline/types";
import type { MatchStory, PulseCard, PulseMeterState } from "@/lib/pulse/types";

type StoryInput = {
  fixture: NormalizedFixture;
  score?: NormalizedScoreUpdate;
  pulseCards: PulseCard[];
  pulseMeter: PulseMeterState;
};

const CHAPTERS = [
  "Opening Rhythm",
  "First Breakthrough",
  "Market Mood Swing",
  "Pressure Wave",
  "Comeback Window",
  "Final Push",
  "Full-Time Story",
] as const;

export function buildMatchStory(input: StoryInput): MatchStory {
  const finalScore = `${input.score?.participant1Score ?? 0}-${input.score?.participant2Score ?? 0}`;
  const biggestPulse = getBiggestPulse(input.pulseCards);
  const biggestSummary = stripTrailingPunctuation(
    biggestPulse?.summary ?? input.pulseMeter.label,
  );
  const chapterCards = assignCardsToChapters(input.pulseCards);

  return {
    fixtureId: input.fixture.fixtureId,
    title: "Match in 7 Pulses",
    subtitle: "A fan-readable recap generated from match momentum.",
    chapters: CHAPTERS.map((title, index) => ({
      id: `chapter-${index + 1}`,
      title,
      summary: chapterSummary(title, input, chapterCards[index] ?? []),
      pulseCardIds: (chapterCards[index] ?? []).map((card) => card.id),
    })),
    finalShareText: `${input.fixture.participant1} vs ${input.fixture.participant2} ended ${finalScore}. The biggest pulse was ${biggestPulse?.fanLabel.toLowerCase() ?? "the final push"}: ${biggestSummary}. FanPulse called it: pressure, chaos, and a final push.`,
  };
}

export function getBiggestPulse(cards: PulseCard[]): PulseCard | undefined {
  return [...cards]
    .filter((card) => card.type !== "FINAL_WHISTLE")
    .sort((a, b) => b.intensity - a.intensity || a.ts - b.ts)[0];
}

function assignCardsToChapters(cards: PulseCard[]): PulseCard[][] {
  const groups: PulseCard[][] = Array.from({ length: CHAPTERS.length }, () => []);

  for (const card of cards) {
    if (card.type === "KICKOFF") groups[0].push(card);
    else if (card.type === "GOAL" && groups[1].length === 0) groups[1].push(card);
    else if (card.type === "ODDS_SHOCK" || card.type === "MOMENTUM_SHIFT") {
      groups[2].push(card);
    } else if (card.type === "CORNER_PRESSURE" || card.type === "DISCIPLINE_SHIFT") {
      groups[3].push(card);
    } else if (card.type === "COMEBACK_WINDOW") groups[4].push(card);
    else if (card.type === "GOAL" || card.type === "CHAOS_SPIKE") groups[5].push(card);
    else if (card.type === "FINAL_WHISTLE") groups[6].push(card);
  }

  return groups.map((group, index) => {
    if (group.length > 0) return group.slice(0, 3);
    const fallback = cards[Math.min(index, Math.max(cards.length - 1, 0))];
    return fallback ? [fallback] : [];
  });
}

function chapterSummary(
  title: (typeof CHAPTERS)[number],
  input: StoryInput,
  cards: PulseCard[],
): string {
  const teams = `${input.fixture.participant1} vs ${input.fixture.participant2}`;
  const leadCard = cards[0];

  switch (title) {
    case "Opening Rhythm":
      return leadCard
        ? `${teams} started with ${leadCard.fanLabel.toLowerCase()} and a match pulse ready to build.`
        : `${teams} opened with a clean first rhythm.`;
    case "First Breakthrough":
      return leadCard
        ? leadCard.summary
        : "The first big swing set the emotional direction of the match.";
    case "Market Mood Swing":
      return leadCard
        ? leadCard.summary
        : "The data-backed match mood shifted as the game found its shape.";
    case "Pressure Wave":
      return leadCard
        ? `${leadCard.title}. ${leadCard.summary}`
        : "Pressure arrived through corners, cards, and crowd energy.";
    case "Comeback Window":
      return leadCard
        ? leadCard.summary
        : "A comeback window kept the match from feeling settled.";
    case "Final Push":
      return leadCard
        ? `${leadCard.title}. ${leadCard.summary}`
        : input.pulseMeter.label;
    case "Full-Time Story":
      return leadCard
        ? leadCard.summary
        : `${teams} ended ${input.score?.participant1Score ?? 0}-${input.score?.participant2Score ?? 0}.`;
  }
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.!?]+$/u, "");
}
