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
  let txlineAvailable = false;
  const liveSource = getTxLineDataNetworkConfig().sourceLabel;

  if (hasTxLineCredentials()) {
    try {
      const liveFixtures = await getLiveFixtures();
      fixtures = liveFixtures;
      txlineAvailable = liveFixtures.length > 0;
    } catch {
      txlineAvailable = false;
    }
  }

  fixtures = txlineAvailable ? [...fixtures, getDemoFixture()] : [getDemoFixture()];

  return (
    <div className="min-h-screen bg-[#f7faf5] pb-24">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={txlineAvailable ? "blue" : "green"}>
              {txlineAvailable ? "TxLINE fixtures first" : "Replay fallback"}
            </Badge>
            <Badge tone={txlineAvailable ? "blue" : "light"}>
              {txlineAvailable
                ? "Live and upcoming schedule"
                : "TxLINE unavailable"}
            </Badge>
            <Badge tone="light">{liveSource}</Badge>
            <Badge tone="light">5s refresh in match rooms</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-black text-[#10261c]">
            Match Lobby
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#52685d]">
            Choose a TxLINE fixture and start the pulse. Upcoming matches stay
            clearly marked until the match window opens, while active match
            rooms refresh scores, odds, and stat updates through server routes.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
