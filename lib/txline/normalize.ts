import { z } from "zod";
import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";

const passthroughRecord = z.object({}).passthrough();

export function normalizeFixture(input: unknown): NormalizedFixture | undefined {
  const parsed = passthroughRecord.safeParse(input);
  if (!parsed.success) return undefined;

  const value = parsed.data;
  const fixtureId = stringFrom(value, [
    "fixtureId",
    "FixtureId",
    "fixtureID",
    "FixtureID",
    "id",
    "Id",
  ]);
  if (!fixtureId) return undefined;

  return {
    fixtureId,
    participant1:
      stringFrom(value, [
        "participant1",
        "Participant1",
        "participant1Name",
        "Participant1Name",
        "home",
        "Home",
        "homeTeam",
        "HomeTeam",
      ]) ?? "Home side",
    participant2:
      stringFrom(value, [
        "participant2",
        "Participant2",
        "participant2Name",
        "Participant2Name",
        "away",
        "Away",
        "awayTeam",
        "AwayTeam",
      ]) ?? "Away side",
    participant1IsHome: booleanFrom(value, [
      "participant1IsHome",
      "Participant1IsHome",
      "isHome",
      "IsHome",
    ]),
    startTime: dateStringFrom(value, ["startTime", "StartTime", "start", "Start"]),
    status: stringFrom(value, [
      "status",
      "Status",
      "statusText",
      "StatusText",
      "phase",
      "Phase",
      "phaseShort",
      "PhaseShort",
    ]),
    competitionId: stringOrNumberFrom(value, [
      "competitionId",
      "CompetitionId",
      "competitionID",
      "CompetitionID",
    ]),
    competition: stringFrom(value, [
      "competition",
      "Competition",
      "competitionName",
      "CompetitionName",
    ]),
    source: "txline",
  };
}

export function normalizeScoreUpdate(
  input: unknown,
  fixtureIdFallback?: string,
): NormalizedScoreUpdate | undefined {
  const parsed = passthroughRecord.safeParse(input);
  if (!parsed.success) return undefined;

  const value = parsed.data;
  const fixtureId =
    stringFrom(value, [
      "fixtureId",
      "FixtureId",
      "fixtureID",
      "FixtureID",
      "id",
      "Id",
    ]) ??
    fixtureIdFallback;
  if (!fixtureId) return undefined;

  const stats = normalizeStats(
    value.stats ??
      value.Stats ??
      value.stat ??
      value.Stat ??
      value.fullGameStats ??
      value.FullGameStats,
  );

  const phaseId = numberFrom(value, ["phaseId", "PhaseId", "phase", "Phase"]);
  const minute = numberFrom(value, ["minute", "Minute", "matchMinute", "MatchMinute"]);
  const participant1Score =
    numberFrom(value, [
      "participant1Score",
      "Participant1Score",
      "p1Score",
      "P1Score",
      "homeScore",
      "HomeScore",
    ]) ?? stats["1"];
  const participant2Score =
    numberFrom(value, [
      "participant2Score",
      "Participant2Score",
      "p2Score",
      "P2Score",
      "awayScore",
      "AwayScore",
    ]) ?? stats["2"];
  const seq = numberFrom(value, ["seq", "Seq", "sequence", "Sequence"]);

  if (
    phaseId === undefined &&
    minute === undefined &&
    participant1Score === undefined &&
    participant2Score === undefined &&
    seq === undefined &&
    Object.keys(stats).length === 0
  ) {
    return undefined;
  }

  return {
    fixtureId,
    ts: timestampFrom(value, ["ts", "Ts", "timestamp", "Timestamp"]) ?? Date.now(),
    seq,
    phaseId,
    minute,
    participant1Score,
    participant2Score,
    stats,
    source: "txline",
  };
}

export function normalizeOddsUpdate(
  input: unknown,
  fixtureIdFallback?: string,
): NormalizedOddsUpdate | undefined {
  const parsed = passthroughRecord.safeParse(input);
  if (!parsed.success) return undefined;

  const value = parsed.data;
  const fixtureId =
    stringFrom(value, [
      "fixtureId",
      "FixtureId",
      "fixtureID",
      "FixtureID",
      "id",
      "Id",
    ]) ??
    fixtureIdFallback;
  if (!fixtureId) return undefined;

  const rawMarket =
    stringFrom(value, [
      "market",
      "Market",
      "marketType",
      "MarketType",
      "marketName",
      "MarketName",
    ]) ??
    "UNKNOWN";
  const rawSelection =
    stringFrom(value, [
      "selection",
      "Selection",
      "outcome",
      "Outcome",
      "selectionName",
      "SelectionName",
      "participant",
      "Participant",
    ]) ??
    "UNKNOWN";
  const decimalOdds = numberFrom(value, [
    "decimalOdds",
    "DecimalOdds",
    "odds",
    "Odds",
    "price",
    "Price",
    "value",
    "Value",
  ]);
  const impliedProbability =
    numberFrom(value, [
      "impliedProbability",
      "ImpliedProbability",
      "probability",
      "Probability",
    ]) ?? (decimalOdds && decimalOdds > 0 ? 1 / decimalOdds : undefined);

  if (
    rawMarket === "UNKNOWN" &&
    rawSelection === "UNKNOWN" &&
    decimalOdds === undefined &&
    impliedProbability === undefined
  ) {
    return undefined;
  }

  return {
    fixtureId,
    ts: timestampFrom(value, ["ts", "Ts", "timestamp", "Timestamp"]) ?? Date.now(),
    seq: numberFrom(value, ["seq", "Seq", "sequence", "Sequence"]),
    market:
      rawMarket === "1X2" || rawMarket === "MATCH_WINNER"
        ? rawMarket
        : "UNKNOWN",
    selection: normalizeSelection(rawSelection),
    decimalOdds,
    impliedProbability,
    suspended: booleanFrom(value, ["suspended", "Suspended"]),
    source: "txline",
  };
}

export function extractArray(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== "object") return [];

  const record = input as Record<string, unknown>;
  for (const key of [
    "data",
    "Data",
    "items",
    "Items",
    "fixtures",
    "Fixtures",
    "scores",
    "Scores",
    "odds",
    "Odds",
    "updates",
    "Updates",
    "snapshots",
    "Snapshots",
    "results",
    "Results",
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }

  return [];
}

function normalizeStats(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object") return {};
  const record = input as Record<string, unknown>;
  const stats: Record<string, number> = {};

  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item || typeof item !== "object") continue;
      const itemRecord = item as Record<string, unknown>;
      const key = stringFrom(itemRecord, [
        "key",
        "Key",
        "statKey",
        "StatKey",
        "statID",
        "StatID",
        "id",
        "Id",
      ]);
      const value = numberFrom(itemRecord, [
        "value",
        "Value",
        "count",
        "Count",
        "total",
        "Total",
      ]);
      if (key && value !== undefined) stats[key] = value;
    }

    return stats;
  }

  for (const [key, value] of Object.entries(record)) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) stats[key] = numeric;
  }

  return stats;
}

function stringFrom(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  const value = primitiveFrom(record, keys);
  return value === undefined ? undefined : String(value);
}

function numberFrom(
  record: Record<string, unknown>,
  keys: string[],
): number | undefined {
  const value = primitiveFrom(record, keys);
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function dateStringFrom(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  const value = primitiveFrom(record, keys);
  if (value === undefined || typeof value === "boolean") return undefined;

  const raw = String(value);
  const numeric =
    typeof value === "number" || /^\d+$/.test(raw) ? Number(value) : undefined;
  if (numeric !== undefined && Number.isFinite(numeric)) {
    const millis = numeric > 10_000_000_000 ? numeric : numeric * 1000;
    return new Date(millis).toISOString();
  }

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : String(value);
}

function timestampFrom(
  record: Record<string, unknown>,
  keys: string[],
): number | undefined {
  const value = primitiveFrom(record, keys);
  if (value === undefined || typeof value === "boolean") return undefined;
  if (typeof value === "number") return value;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanFrom(
  record: Record<string, unknown>,
  keys: string[],
): boolean | undefined {
  const value = primitiveFrom(record, keys);
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function primitiveFrom(
  record: Record<string, unknown>,
  keys: string[],
): string | number | boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return value;
    }
  }

  return undefined;
}

function stringOrNumberFrom(
  record: Record<string, unknown>,
  keys: string[],
): string | number | undefined {
  const value = primitiveFrom(record, keys);
  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function normalizeSelection(selection: string): NormalizedOddsUpdate["selection"] {
  const upper = selection.toUpperCase();
  if (["P1", "PARTICIPANT1", "HOME", "1"].includes(upper)) return "P1";
  if (["P2", "PARTICIPANT2", "AWAY", "2"].includes(upper)) return "P2";
  if (["DRAW", "X"].includes(upper)) return "DRAW";
  return selection;
}
