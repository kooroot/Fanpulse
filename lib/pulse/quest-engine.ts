import type { NormalizedFixture, NormalizedScoreUpdate } from "@/lib/txline/types";
import type { FanQuest, FanQuestState, PulseCard } from "@/lib/pulse/types";

export const FAN_QUEST_STORAGE_KEY = "fanpulse.questState";
export const FAN_QUEST_REQUIRES_ACCOUNT = false;
export const FAN_QUEST_REWARD_KIND = "local_xp";

export const EMPTY_FAN_QUEST_STATE: FanQuestState = {
  totalXp: 0,
  streak: 0,
  answered: {},
  resolved: {},
};

export function buildReplayQuestQueue(fixture: NormalizedFixture): FanQuest[] {
  return [
    {
      id: `${fixture.fixtureId}-quest-opening`,
      fixtureId: fixture.fixtureId,
      question: "What happens next?",
      options: ["Goal", "Card", "Corner", "Momentum Swing"],
      status: "OPEN",
      xpReward: 20,
      createdAt: 3,
    },
    {
      id: `${fixture.fixtureId}-quest-next-10`,
      fixtureId: fixture.fixtureId,
      question: "Next 10 minutes?",
      options: ["Goal", "No Goal", "Pressure Wave", "Chaos Spike"],
      status: "OPEN",
      xpReward: 25,
      createdAt: 32,
    },
    {
      id: `${fixture.fixtureId}-quest-next-pulse`,
      fixtureId: fixture.fixtureId,
      question: "Who owns the next pulse?",
      options: [fixture.participant1, fixture.participant2, "Balanced"],
      status: "OPEN",
      xpReward: 30,
      createdAt: 55,
    },
  ];
}

export function getActiveQuest(
  quests: FanQuest[],
  nowTs: number,
  questState: FanQuestState,
): FanQuest | undefined {
  return quests.find(
    (quest) => quest.createdAt <= nowTs && !questState.resolved[quest.id],
  );
}

export function selectQuestOption(
  state: FanQuestState,
  quest: FanQuest,
  selectedOption: string,
): FanQuestState {
  if (!quest.options.includes(selectedOption)) return state;

  return {
    ...state,
    answered: {
      ...state.answered,
      [quest.id]: selectedOption,
    },
  };
}

export function resolveFanQuest(args: {
  quest: FanQuest;
  fixture: NormalizedFixture;
  scoreUpdates: NormalizedScoreUpdate[];
  pulseCards: PulseCard[];
  nowTs: number;
}): FanQuest {
  const { quest } = args;
  const resolvedOption = resolveOption(args);

  return {
    ...quest,
    status: "RESOLVED",
    resolvedOption,
    resolvedAt: args.nowTs,
  };
}

export function applyResolvedQuest(
  state: FanQuestState,
  quest: FanQuest,
): FanQuestState {
  if (
    quest.status !== "RESOLVED" ||
    !quest.resolvedOption ||
    state.resolved[quest.id]
  ) {
    return state;
  }

  const selected = state.answered[quest.id];
  const xpEarned = selected
    ? selected === quest.resolvedOption
      ? quest.xpReward
      : 5
    : 0;

  return {
    totalXp: state.totalXp + xpEarned,
    streak:
      selected && selected === quest.resolvedOption ? state.streak + 1 : 0,
    answered: state.answered,
    resolved: {
      ...state.resolved,
      [quest.id]: true,
    },
  };
}

export function loadFanQuestState(): FanQuestState {
  if (typeof window === "undefined") return EMPTY_FAN_QUEST_STATE;

  try {
    const raw = window.localStorage.getItem(FAN_QUEST_STORAGE_KEY);
    if (!raw) return EMPTY_FAN_QUEST_STATE;
    const parsed = JSON.parse(raw) as Partial<FanQuestState>;

    return {
      totalXp: Number(parsed.totalXp ?? 0),
      streak: Number(parsed.streak ?? 0),
      answered: parsed.answered ?? {},
      resolved: parsed.resolved ?? {},
    };
  } catch {
    return EMPTY_FAN_QUEST_STATE;
  }
}

export function saveFanQuestState(state: FanQuestState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAN_QUEST_STORAGE_KEY, JSON.stringify(state));
}

export function resetFanQuestState(): FanQuestState {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(FAN_QUEST_STORAGE_KEY);
  }

  return EMPTY_FAN_QUEST_STATE;
}

function resolveOption(args: {
  quest: FanQuest;
  fixture: NormalizedFixture;
  scoreUpdates: NormalizedScoreUpdate[];
  pulseCards: PulseCard[];
}): string {
  const { quest, fixture, scoreUpdates, pulseCards } = args;
  const futureScores = scoreUpdates.filter((update) => update.ts > quest.createdAt);
  const futureCards = pulseCards.filter((card) => card.ts > quest.createdAt);

  if (quest.id.endsWith("quest-opening")) {
    const firstCard = futureCards.find((card) =>
      ["GOAL", "DISCIPLINE_SHIFT", "CORNER_PRESSURE", "MOMENTUM_SHIFT"].includes(
        card.type,
      ),
    );

    if (firstCard?.type === "GOAL") return "Goal";
    if (firstCard?.type === "DISCIPLINE_SHIFT") return "Card";
    if (firstCard?.type === "CORNER_PRESSURE") return "Corner";
    return "Momentum Swing";
  }

  if (quest.id.endsWith("quest-next-10")) {
    const windowEnd = quest.createdAt + 18;
    const cardsInWindow = futureCards.filter((card) => card.ts <= windowEnd);
    if (cardsInWindow.some((card) => card.type === "GOAL")) return "Goal";
    if (cardsInWindow.some((card) => card.type === "CHAOS_SPIKE")) {
      return "Chaos Spike";
    }
    if (cardsInWindow.some((card) => card.type === "CORNER_PRESSURE")) {
      return "Pressure Wave";
    }
    return "No Goal";
  }

  if (quest.id.endsWith("quest-next-pulse")) {
    const nextTeamCard = futureCards.find((card) =>
      ["P1", "P2", "DRAW", "NEUTRAL"].includes(card.teamFocus ?? "NEUTRAL"),
    );
    if (nextTeamCard?.teamFocus === "P1") return fixture.participant1;
    if (nextTeamCard?.teamFocus === "P2") return fixture.participant2;
    return "Balanced";
  }

  const nextGoal = detectNextGoal(futureScores);
  if (nextGoal === "P1") return fixture.participant1;
  if (nextGoal === "P2") return fixture.participant2;
  return "Balanced";
}

function detectNextGoal(
  scoreUpdates: NormalizedScoreUpdate[],
): "P1" | "P2" | undefined {
  for (let index = 1; index < scoreUpdates.length; index += 1) {
    const previous = scoreUpdates[index - 1];
    const current = scoreUpdates[index];
    if ((current.participant1Score ?? 0) > (previous.participant1Score ?? 0)) {
      return "P1";
    }
    if ((current.participant2Score ?? 0) > (previous.participant2Score ?? 0)) {
      return "P2";
    }
  }

  return undefined;
}
