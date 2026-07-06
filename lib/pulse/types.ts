import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";

export type TeamFocus = "P1" | "P2" | "DRAW" | "NEUTRAL";

export type PulseCardType =
  | "KICKOFF"
  | "GOAL"
  | "ODDS_SHOCK"
  | "COMEBACK_WINDOW"
  | "DISCIPLINE_SHIFT"
  | "CORNER_PRESSURE"
  | "MOMENTUM_SHIFT"
  | "CHAOS_SPIKE"
  | "FINAL_WHISTLE";

export type PulseCard = {
  id: string;
  fixtureId: string;
  ts: number;
  minute?: number;
  type: PulseCardType;
  title: string;
  summary: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  teamFocus?: TeamFocus;
  fanLabel: string;
  dataBadge: "Replay Data" | "TxLINE Verified Data" | "Data-backed Signal";
  derivedFrom: {
    scoreSeq?: number;
    oddsSeq?: number;
    statKeys?: number[];
    inputHash: string;
  };
};

export type PulseMeterState = {
  fixtureId: string;
  ts: number;
  p1: number;
  p2: number;
  chaos: number;
  leader: "P1" | "P2" | "NEUTRAL";
  label: string;
  reasons: string[];
};

export type FanQuest = {
  id: string;
  fixtureId: string;
  question: string;
  options: string[];
  selectedOption?: string;
  resolvedOption?: string;
  status: "OPEN" | "RESOLVED";
  xpReward: number;
  createdAt: number;
  resolvedAt?: number;
};

export type FanQuestState = {
  totalXp: number;
  streak: number;
  answered: Record<string, string>;
  resolved: Record<string, boolean>;
};

export type MatchStory = {
  fixtureId: string;
  title: string;
  subtitle: string;
  chapters: {
    id: string;
    title: string;
    summary: string;
    pulseCardIds: string[];
  }[];
  finalShareText: string;
};

export type ReplayEvent =
  | {
      id: string;
      kind: "score";
      offsetMs: number;
      score: NormalizedScoreUpdate;
    }
  | {
      id: string;
      kind: "odds";
      offsetMs: number;
      odds: NormalizedOddsUpdate;
    };

export type ReplayMatch = {
  fixture: NormalizedFixture;
  durationMs: number;
  scoreUpdates: NormalizedScoreUpdate[];
  oddsUpdates: NormalizedOddsUpdate[];
  timeline: ReplayEvent[];
};

export type MatchSnapshot = {
  fixture: NormalizedFixture;
  score?: NormalizedScoreUpdate;
  odds: NormalizedOddsUpdate[];
  pulseCards: PulseCard[];
  pulseMeter: PulseMeterState;
  story?: MatchStory;
};
