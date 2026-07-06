import type { PulseCard, PulseMeterState } from "@/lib/pulse/types";
import type { NormalizedFixture, NormalizedScoreUpdate } from "@/lib/txline/types";

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

export type HiLoChallenge = {
  id: string;
  fixtureId: string;
  label: string;
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
  pulseMeter: PulseMeterState;
  pulseCards: PulseCard[];
};
