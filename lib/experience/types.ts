import type { PulseCard, PulseMeterState } from "@/lib/pulse/types";
import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";

export type PunditMomentTone = "calm" | "pressure" | "swing" | "chaos" | "final";

export type PunditMoment = {
  id: string;
  fixtureId: string;
  ts: number;
  title: string;
  body: string;
  tone: PunditMomentTone;
  priority: 1 | 2 | 3 | 4 | 5;
  source: "pulse-card" | "meter" | "score" | "odds";
  shareLine: string;
};

export type HiLoPick = "Higher" | "Lower" | "Same";

export type HiLoStatKey = "corners" | "discipline" | "goals";

export type HiLoStatReading = {
  key: HiLoStatKey;
  label: string;
  sourceLabel: string;
  statKeys: number[];
  value: number;
  unit: "per15";
  rawCount: number;
  minute?: number;
};

export type HiLoChallenge = {
  id: string;
  fixtureId: string;
  statKey: HiLoStatKey;
  label: string;
  sourceLabel: string;
  statKeys: number[];
  unit: "per15";
  baseline: number;
  current: number;
  question: string;
  options: HiLoPick[];
  selectedOption?: HiLoPick;
  resolvedOption?: HiLoPick;
  status: "OPEN" | "RESOLVED";
  xpReward: number;
  createdAt: number;
  resolvedAt?: number;
};

export type HiLoLocalState = {
  totalXp: number;
  streak: number;
  challenge?: HiLoChallenge;
};

export type SweepstakePlayer = {
  name: string;
  team: string;
  side: "P1" | "P2";
  points: number;
  note: string;
  leader: boolean;
};

export type FanExperienceInput = {
  fixture: NormalizedFixture;
  score?: NormalizedScoreUpdate;
  odds?: NormalizedOddsUpdate[];
  pulseMeter: PulseMeterState;
  pulseCards: PulseCard[];
};
