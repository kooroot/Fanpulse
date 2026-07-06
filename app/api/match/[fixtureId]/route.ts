import { NextResponse } from "next/server";
import { getDemoReplayMatch, DEMO_FIXTURE_ID } from "@/lib/replay/sample-data";
import { getReplaySnapshot } from "@/lib/replay/replay-engine";
import { hasTxLineCredentials } from "@/lib/txline/client";
import { buildLiveMatchSnapshot } from "@/lib/txline/live-snapshot";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ fixtureId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { fixtureId } = await context.params;

  if (fixtureId === DEMO_FIXTURE_ID || !hasTxLineCredentials()) {
    const replay = getDemoReplayMatch();
    return NextResponse.json({
      mode: "replay",
      snapshot: getReplaySnapshot(replay),
      fallback: fixtureId !== DEMO_FIXTURE_ID,
    });
  }

  try {
    const result = await buildLiveMatchSnapshot(fixtureId);

    return NextResponse.json({
      mode: "live",
      liveNetwork: result.liveNetwork,
      liveSource: result.liveSource,
      credentialLabel: result.credentialLabel,
      warnings: result.warnings,
      snapshot: result.snapshot,
    });
  } catch (error) {
    const replay = getDemoReplayMatch();
    return NextResponse.json({
      mode: "replay",
      snapshot: getReplaySnapshot(replay),
      fallback: true,
      liveError: error instanceof Error ? error.message : "live fetch failed",
    });
  }
}
