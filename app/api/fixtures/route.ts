import { NextResponse } from "next/server";
import { getDemoFixture } from "@/lib/replay/sample-data";
import { getTxLineCredentialSets, hasTxLineCredentials } from "@/lib/txline/client";
import { getLiveFixtures } from "@/lib/txline/live-snapshot";
import {
  currentEpochDay,
  getDefaultCompetitionId,
  getTxLineDataNetworkConfig,
} from "@/lib/txline/network";

export const dynamic = "force-dynamic";

export async function GET() {
  const demoFixture = getDemoFixture();
  const fixtures = [demoFixture];
  let liveAvailable = false;
  let liveError: string | undefined;
  const network = getTxLineDataNetworkConfig();
  const startEpochDay = currentEpochDay();
  const competitionId = getDefaultCompetitionId(network.network);
  const credentialSets = getTxLineCredentialSets();

  if (hasTxLineCredentials()) {
    try {
      const liveFixtures = await getLiveFixtures();
      fixtures.push(...liveFixtures);
      liveAvailable = liveFixtures.length > 0;
    } catch (error) {
      liveAvailable = false;
      liveError = error instanceof Error ? error.message : "live fetch failed";
    }
  } else {
    liveError = "missing TxLINE credentials";
  }

  return NextResponse.json({
    defaultMode: process.env.NEXT_PUBLIC_DEFAULT_MODE ?? "replay",
    liveAvailable,
    liveNetwork: network.network,
    liveSource: network.sourceLabel,
    credentialSets: credentialSets.map((set) => ({
      label: set.label,
      network: set.network,
    })),
    fixtureQuery: {
      startEpochDay,
      competitionId,
    },
    liveError,
    fixtures,
  });
}
