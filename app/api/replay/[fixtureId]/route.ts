import { NextResponse } from "next/server";
import { DEMO_FIXTURE_ID, getDemoReplayMatch } from "@/lib/replay/sample-data";

type RouteContext = {
  params: Promise<{ fixtureId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { fixtureId } = await context.params;

  if (fixtureId !== DEMO_FIXTURE_ID) {
    return NextResponse.json(
      { error: "Replay fixture not found", fixtureId },
      { status: 404 },
    );
  }

  const replay = getDemoReplayMatch();
  return NextResponse.json({
    mode: "replay",
    fixture: replay.fixture,
    durationMs: replay.durationMs,
    timeline: replay.timeline,
  });
}
