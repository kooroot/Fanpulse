import { NextResponse } from "next/server";
import { getBiggestPulse } from "@/lib/pulse/story-builder";
import { DEMO_FIXTURE_ID, getDemoReplayMatch } from "@/lib/replay/sample-data";
import { getReplaySnapshot } from "@/lib/replay/replay-engine";
import { hasTxLineCredentials } from "@/lib/txline/client";
import { buildLiveMatchSnapshot } from "@/lib/txline/live-snapshot";
import { formatTeamName } from "@/lib/utils/format";

type RouteContext = {
  params: Promise<{ fixtureId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { fixtureId } = await context.params;

  const snapshot =
    fixtureId === DEMO_FIXTURE_ID
      ? getReplaySnapshot(getDemoReplayMatch())
      : hasTxLineCredentials()
        ? await buildLiveSnapshotOrUndefined(fixtureId)
        : undefined;

  if (!snapshot?.story) {
    return NextResponse.json(
      { error: "Share card is available once a match story exists." },
      { status: 404 },
    );
  }

  const biggestPulse = getBiggestPulse(snapshot.pulseCards);

  return NextResponse.json({
    title: `${formatTeamName(snapshot.fixture.participant1)} vs ${formatTeamName(snapshot.fixture.participant2)}`,
    finalScore: `${snapshot.score?.participant1Score ?? 0}-${snapshot.score?.participant2Score ?? 0}`,
    biggestPulse: biggestPulse?.title ?? "Final push",
    momentumWinner:
      snapshot.pulseMeter.leader === "P1"
        ? formatTeamName(snapshot.fixture.participant1)
        : snapshot.pulseMeter.leader === "P2"
          ? formatTeamName(snapshot.fixture.participant2)
          : "Balanced",
    chaosLevel: snapshot.pulseMeter.chaos,
    label: "Unofficial fan recap",
    shareText: snapshot.story?.finalShareText,
  });
}

async function buildLiveSnapshotOrUndefined(fixtureId: string) {
  try {
    return (await buildLiveMatchSnapshot(fixtureId)).snapshot;
  } catch {
    return undefined;
  }
}
