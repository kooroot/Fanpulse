import { LiveMatchShell } from "@/components/match/LiveMatchShell";
import { MobileMatchShell } from "@/components/match/MobileMatchShell";
import { DEMO_FIXTURE_ID, getDemoReplayMatch } from "@/lib/replay/sample-data";
import { hasTxLineCredentials } from "@/lib/txline/client";
import { buildLiveMatchSnapshot } from "@/lib/txline/live-snapshot";

type MatchPageProps = {
  params: Promise<{ fixtureId: string }>;
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { fixtureId } = await params;
  let liveResult: Awaited<ReturnType<typeof buildLiveMatchSnapshot>> | undefined;

  if (fixtureId !== DEMO_FIXTURE_ID && hasTxLineCredentials()) {
    try {
      liveResult = await buildLiveMatchSnapshot(fixtureId);
    } catch {
      // Replay Mode is the required judge path when live credentials or data fail.
    }
  }

  if (liveResult) {
    return (
      <LiveMatchShell
        snapshot={liveResult.snapshot}
        liveSource={liveResult.liveSource ?? "TxLINE match feed"}
        warnings={liveResult.warnings}
      />
    );
  }

  const replay = getDemoReplayMatch();
  return <MobileMatchShell replay={replay} />;
}
