import type { MatchSnapshot } from "@/lib/pulse/types";
import { derivePulseCards } from "@/lib/pulse/pulse-card-engine";
import { computePulseMeter } from "@/lib/pulse/pulse-meter";
import { buildMatchStory } from "@/lib/pulse/story-builder";
import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";
import { FINAL_PHASE_IDS } from "@/lib/txline/types";
import {
  TxLineClient,
  createTxLineClientForSet,
  getTxLineCredentialSets,
  hasTxLineCredentials,
  type TxLineCredentialSet,
} from "@/lib/txline/client";
import { getTxLineNetworkConfig } from "@/lib/txline/network";

export type LiveSnapshotResult = {
  snapshot: MatchSnapshot;
  warnings: string[];
  credentialLabel?: "primary" | "fallback";
  liveNetwork?: "devnet" | "mainnet";
  liveSource?: string;
};

export async function getLiveFixtures(
  client?: TxLineClient,
): Promise<NormalizedFixture[]> {
  if (client) return client.getFixturesSnapshot({ limit: 12 });

  for (const credentials of getTxLineCredentialSets()) {
    try {
      const fixtures = await createTxLineClientForSet(
        credentials,
      ).getFixturesSnapshot({ limit: 12 });
      if (fixtures.length > 0) return fixtures;
    } catch {
      // Try the next configured credential set.
    }
  }

  return [];
}

export async function buildLiveMatchSnapshot(
  fixtureId: string,
  client?: TxLineClient,
): Promise<LiveSnapshotResult> {
  if (!hasTxLineCredentials()) {
    throw new Error("missing TxLINE credentials");
  }

  if (client) return buildLiveMatchSnapshotWithClient(fixtureId, client);

  const errors: string[] = [];
  for (const credentials of getTxLineCredentialSets()) {
    try {
      return await buildLiveMatchSnapshotWithClient(
        fixtureId,
        createTxLineClientForSet(credentials),
        credentials,
      );
    } catch (error) {
      errors.push(
        `${credentials.label} ${credentials.network}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  throw new Error(errors.join(" | ") || "TxLINE live snapshot failed");
}

async function buildLiveMatchSnapshotWithClient(
  fixtureId: string,
  client: TxLineClient,
  credentials?: TxLineCredentialSet,
): Promise<LiveSnapshotResult> {
  const [fixturesResult, scoresResult, historicalScoresResult, oddsResult] =
    await Promise.allSettled([
      client.getFixturesSnapshot({ upcomingOnly: false, limit: 24 }),
      client.getScoresSnapshot(fixtureId),
      client.getHistoricalScores(fixtureId),
      client.getOddsSnapshot(fixtureId),
    ]);

  const warnings: string[] = [];
  const fixtures = settledValue(fixturesResult, "fixtures", warnings) ?? [];
  const scores = settledValue(scoresResult, "scores snapshot", warnings) ?? [];
  const historicalScores =
    settledValue(historicalScoresResult, "historical scores", warnings) ?? [];
  const odds = settledValue(oddsResult, "odds snapshot", warnings) ?? [];
  const fixture =
    fixtures.find((item) => item.fixtureId === fixtureId) ??
    fallbackFixture(fixtureId, scores, odds);
  const scoreUpdates = dedupeScoreUpdates([...historicalScores, ...scores]);
  const oddsUpdates = dedupeOddsUpdates(odds);
  const pulseCards = derivePulseCards({
    fixture,
    scoreUpdates,
    oddsUpdates,
  });
  const pulseMeter = computePulseMeter({
    fixture,
    scoreUpdates,
    oddsUpdates,
    pulseCards,
  });
  const score = scoreUpdates.at(-1);
  const story =
    score?.phaseId && FINAL_PHASE_IDS.has(score.phaseId)
      ? buildMatchStory({ fixture, score, pulseCards, pulseMeter })
      : undefined;

  if (
    fixtures.length === 0 &&
    scoreUpdates.length === 0 &&
    oddsUpdates.length === 0
  ) {
    throw new Error("TxLINE live snapshot returned no usable match data");
  }

  const config = getTxLineNetworkConfig(credentials?.network);
  return {
    snapshot: {
      fixture,
      score,
      odds: oddsUpdates,
      pulseCards,
      pulseMeter,
      story,
    },
    warnings,
    credentialLabel: credentials?.label,
    liveNetwork: credentials?.network,
    liveSource: config.sourceLabel,
  };
}

function settledValue<T>(
  result: PromiseSettledResult<T>,
  label: string,
  warnings: string[],
): T | undefined {
  if (result.status === "fulfilled") return result.value;
  warnings.push(`${label} unavailable`);
  return undefined;
}

function fallbackFixture(
  fixtureId: string,
  scores: NormalizedScoreUpdate[],
  odds: NormalizedOddsUpdate[],
): NormalizedFixture {
  return {
    fixtureId,
    participant1: "Home side",
    participant2: "Away side",
    status: scores.length > 0 || odds.length > 0 ? "Live Mode" : "TxLINE",
    source: "txline",
  };
}

function dedupeScoreUpdates(
  updates: NormalizedScoreUpdate[],
): NormalizedScoreUpdate[] {
  const seen = new Set<string>();
  return [...updates]
    .sort((a, b) => a.ts - b.ts || (a.seq ?? 0) - (b.seq ?? 0))
    .filter((update) => {
      const key = `${update.seq ?? "no-seq"}-${update.ts}-${update.phaseId ?? "no-phase"}-${update.participant1Score ?? "x"}-${update.participant2Score ?? "x"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function dedupeOddsUpdates(
  updates: NormalizedOddsUpdate[],
): NormalizedOddsUpdate[] {
  const seen = new Set<string>();
  return [...updates]
    .sort((a, b) => a.ts - b.ts || (a.seq ?? 0) - (b.seq ?? 0))
    .filter((update) => {
      const key = `${update.seq ?? "no-seq"}-${update.ts}-${update.market}-${update.selection}-${update.decimalOdds ?? "x"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
