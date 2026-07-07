import { BottomNav } from "@/components/common/BottomNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrackFit } from "@/components/landing/TrackFit";
import { getDemoFixture } from "@/lib/replay/sample-data";
import { hasTxLineCredentials } from "@/lib/txline/client";
import { getLiveFixtures } from "@/lib/txline/live-snapshot";
import { getFixtureDisplayStatus } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const liveFixtures = hasTxLineCredentials()
    ? await getLiveFixtures().catch(() => [])
    : [];
  const featuredFixture =
    liveFixtures.find((fixture) => getFixtureDisplayStatus(fixture).isLive) ??
    liveFixtures[0] ??
    getDemoFixture();

  return (
    <div className="min-h-screen bg-[#f7faf5] pb-20">
      <Hero
        featuredFixture={featuredFixture}
        txlineAvailable={liveFixtures.length > 0}
      />
      <HowItWorks />
      <TrackFit />
      <footer className="px-5 py-8 text-center text-xs font-semibold text-[#5d7167]">
        Unofficial fan experience. No betting. No official tournament
        affiliation.
      </footer>
      <BottomNav />
    </div>
  );
}
