import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { BottomNav } from "@/components/common/BottomNav";
import { EmptyState } from "@/components/common/EmptyState";
import { MatchStoryChapter } from "@/components/match/MatchStoryChapter";
import { ShareCard } from "@/components/match/ShareCard";
import { getBiggestPulse } from "@/lib/pulse/story-builder";
import { DEMO_FIXTURE_ID, getDemoReplayMatch } from "@/lib/replay/sample-data";
import { getReplaySnapshot } from "@/lib/replay/replay-engine";
import { hasTxLineCredentials } from "@/lib/txline/client";
import { buildLiveMatchSnapshot } from "@/lib/txline/live-snapshot";

type StoryPageProps = {
  params: Promise<{ fixtureId: string }>;
};

export default async function StoryPage({ params }: StoryPageProps) {
  const { fixtureId } = await params;
  const demoSnapshot = getReplaySnapshot(getDemoReplayMatch());
  const liveSnapshot =
    fixtureId !== DEMO_FIXTURE_ID && hasTxLineCredentials()
      ? await buildLiveSnapshotOrUndefined(fixtureId)
      : undefined;
  const snapshot =
    fixtureId === DEMO_FIXTURE_ID ? demoSnapshot : liveSnapshot;
  const story = snapshot?.story;
  const biggestPulse = snapshot ? getBiggestPulse(snapshot.pulseCards) : undefined;

  return (
    <div className="min-h-screen bg-[#f7faf5] pb-24">
      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        <div>
          <h1 className="text-4xl font-black text-[#10261c]">
            {story?.title ?? "Match in 7 Pulses"}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#52685d]">
            {story?.subtitle ??
              "A fan-readable recap appears when the final whistle lands."}
          </p>
        </div>

        {story && snapshot ? (
          <>
            <div className="space-y-3">
              {story.chapters.map((chapter, index) => (
                <MatchStoryChapter
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                />
              ))}
            </div>

            <ShareCard
              fixture={snapshot.fixture}
              score={snapshot.score}
              biggestPulse={biggestPulse?.title ?? "Final push"}
              meter={snapshot.pulseMeter}
              story={story}
            />
          </>
        ) : (
          <EmptyState title="Story waiting">
            This match does not have a final whistle yet, so FanPulse is keeping
            the recap open.
          </EmptyState>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/match/${snapshot?.fixture.fixtureId ?? fixtureId}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dce8d8] bg-white px-4 text-sm font-black text-[#10261c] transition hover:bg-[#eef7ec]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Match
          </Link>
          <Link
            href={`/match/${DEMO_FIXTURE_ID}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#10261c] px-4 text-sm font-black text-white transition hover:bg-[#1f3a2d]"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Replay Demo
          </Link>
        </div>
      </main>
      <footer className="px-4 pb-5 text-center text-xs font-semibold text-[#5d7167]">
        Unofficial fan experience. No betting. No official tournament
        affiliation.
      </footer>
      <BottomNav />
    </div>
  );
}

async function buildLiveSnapshotOrUndefined(fixtureId: string) {
  try {
    return (await buildLiveMatchSnapshot(fixtureId)).snapshot;
  } catch {
    return undefined;
  }
}
