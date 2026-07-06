export type DataSource = "txline" | "replay";

export type NormalizedFixture = {
  fixtureId: string;
  participant1: string;
  participant2: string;
  participant1IsHome?: boolean;
  startTime?: string;
  status?: string;
  competitionId?: number | string;
  competition?: string;
  source: DataSource;
};

export type NormalizedScoreUpdate = {
  fixtureId: string;
  ts: number;
  seq?: number;
  phaseId?: number;
  minute?: number;
  participant1Score?: number;
  participant2Score?: number;
  stats?: Record<string, number>;
  source: DataSource;
};

export type NormalizedOddsUpdate = {
  fixtureId: string;
  ts: number;
  seq?: number;
  market: "1X2" | "MATCH_WINNER" | "UNKNOWN";
  selection: "P1" | "DRAW" | "P2" | string;
  decimalOdds?: number;
  impliedProbability?: number;
  suspended?: boolean;
  source: DataSource;
};

export const PHASES: Record<number, { short: string; label: string }> = {
  1: { short: "NS", label: "not started" },
  2: { short: "H1", label: "first half" },
  3: { short: "HT", label: "halftime" },
  4: { short: "H2", label: "second half" },
  5: { short: "FT", label: "finished" },
  6: { short: "WET", label: "waiting for extra time" },
  7: { short: "ET1", label: "extra time first half" },
  8: { short: "HTET", label: "extra time halftime" },
  9: { short: "ET2", label: "extra time second half" },
  10: { short: "FET", label: "ended after extra time" },
  11: { short: "WPE", label: "waiting for penalty shootout" },
  12: { short: "PE", label: "penalty shootout" },
  13: { short: "FPE", label: "ended after penalties" },
  14: { short: "INT", label: "interrupted" },
  15: { short: "ABD", label: "abandoned" },
  16: { short: "CAN", label: "cancelled" },
  17: { short: "CC", label: "coverage cancelled" },
  18: { short: "CS", label: "coverage suspended" },
  19: { short: "PP", label: "postponed" },
};

export const SOCCER_STAT_KEYS: Record<number, string> = {
  1: "Participant 1 Total Goals",
  2: "Participant 2 Total Goals",
  3: "Participant 1 Total Yellow Cards",
  4: "Participant 2 Total Yellow Cards",
  5: "Participant 1 Total Red Cards",
  6: "Participant 2 Total Red Cards",
  7: "Participant 1 Total Corners",
  8: "Participant 2 Total Corners",
};

export const FINAL_PHASE_IDS = new Set([5, 10, 13]);
