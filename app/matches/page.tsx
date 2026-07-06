import { BottomNav } from "@/components/common/BottomNav";
import { Badge } from "@/components/common/Badge";
import { FixtureCard } from "@/components/match/FixtureCard";
import { getDemoFixture } from "@/lib/replay/sample-data";
import { hasTxLineCredentials } from "@/lib/txline/client";
import { getLiveFixtures } from "@/lib/txline/live-snapshot";
import { getTxLineDataNetworkConfig } from "@/lib/txline/network";
import type { NormalizedFixture } from "@/lib/txline/types";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  let fixtures: NormalizedFixture[] = [];
  let liveAvailable = false;
  const liveSource = getTxLineDataNetworkConfig().sourceLabel;

  if (hasTxLineCredentials()) {
    try {
      const liveFixtures = await getLiveFixtures();
      fixtures = liveFixtures;
      liveAvailable = liveFixtures.length > 0;
    } catch {
      liveAvailable = false;
    }
  }

  fixtures = liveAvailable ? [...fixtures, getDemoFixture()] : [getDemoFixture()];

  return (
    <div className="min-h-screen bg-[#f7faf5] pb-24">
      <main className="mx-auto max-w-md space-y-5 px-4 py-6">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={liveAvailable ? "blue" : "green"}>
              {liveAvailable ? "Live data first" : "Replay fallback"}
            </Badge>
            <Badge tone={liveAvailable ? "blue" : "light"}>
              {liveAvailable ? "TxLINE fixtures ready" : "Live data unavailable"}
            </Badge>
            <Badge tone="light">{liveSource}</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-black text-[#10261c]">
            Match Lobby
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#52685d]">
            Choose a real fixture and start the pulse. If TxLINE data is
            unavailable, FanPulse keeps a local replay fallback for review.
          </p>
        </div>
        <div className="space-y-3">
          {fixtures.map((fixture) => (
            <FixtureCard key={fixture.fixtureId} fixture={fixture} />
          ))}
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
