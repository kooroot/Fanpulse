"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, ScrollText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/common/Badge";
import { BottomNav } from "@/components/common/BottomNav";
import { EmptyState } from "@/components/common/EmptyState";
import { FanExperiencePanel } from "@/components/match/FanExperiencePanel";
import { PulseCard } from "@/components/match/PulseCard";
import { PulseMeter } from "@/components/match/PulseMeter";
import { PulseTimeline } from "@/components/match/PulseTimeline";
import { ScoreHeader } from "@/components/match/ScoreHeader";
import { ShareCard } from "@/components/match/ShareCard";
import { getBiggestPulse } from "@/lib/pulse/story-builder";
import type { MatchSnapshot } from "@/lib/pulse/types";

type LiveMatchShellProps = {
  snapshot: MatchSnapshot;
  liveSource: string;
  warnings?: string[];
};

export function LiveMatchShell({
  snapshot,
  liveSource,
  warnings = [],
}: LiveMatchShellProps) {
  const [currentSnapshot, setCurrentSnapshot] = useState(snapshot);
  const [currentWarnings, setCurrentWarnings] = useState(warnings);
  const [lastRefresh, setLastRefresh] = useState<Date>(() => new Date());
  const latestPulse = currentSnapshot.pulseCards.at(-1);
  const biggestPulse = getBiggestPulse(currentSnapshot.pulseCards);
  const refreshLabel = useMemo(
    () =>
      lastRefresh.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [lastRefresh],
  );

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(
          `/api/match/${currentSnapshot.fixture.fixtureId}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const payload = (await response.json()) as {
          mode?: string;
          snapshot?: MatchSnapshot;
          warnings?: string[];
        };
        if (cancelled || payload.mode !== "live" || !payload.snapshot) return;
        setCurrentSnapshot(payload.snapshot);
        setCurrentWarnings(payload.warnings ?? []);
        setLastRefresh(new Date());
      } catch {
        // Keep the last verified snapshot visible.
      }
    }

    const timer = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentSnapshot.fixture.fixtureId]);

  return (
    <div className="min-h-screen bg-[#f7faf5] pb-24">
      <ScoreHeader fixture={currentSnapshot.fixture} score={currentSnapshot.score} />
      <main className="mx-auto max-w-md space-y-4 px-4 py-5">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">Live Mode</Badge>
            <Badge tone="green">TxLINE</Badge>
            <Badge tone="light">{liveSource}</Badge>
            <Badge tone="light">Updated {refreshLabel}</Badge>
          </div>
          <p className="text-sm font-semibold leading-6 text-[#52685d]">
            Real match data is converted into fan-readable pulse, momentum, and
            recap signals from the current TxLINE fixture.
          </p>
        </div>

        <PulseMeter
          fixture={currentSnapshot.fixture}
          meter={currentSnapshot.pulseMeter}
        />

        <FanExperiencePanel
          fixture={currentSnapshot.fixture}
          score={currentSnapshot.score}
          pulseMeter={currentSnapshot.pulseMeter}
          pulseCards={currentSnapshot.pulseCards}
          mode="live"
        />

        {latestPulse ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#10261c]">
              Latest Pulse Card
            </h2>
            <PulseCard card={latestPulse} featured />
          </section>
        ) : (
          <EmptyState title="Live pulse waiting">
            TxLINE returned the fixture, but there are not enough match events
            yet to create Pulse Cards.
          </EmptyState>
        )}

        {currentSnapshot.pulseCards.length > 0 ? (
          <PulseTimeline cards={currentSnapshot.pulseCards} />
        ) : null}

        {currentSnapshot.story ? (
          <>
            <Link
              href={`/story/${currentSnapshot.fixture.fixtureId}`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#10261c] px-4 text-sm font-black text-white transition hover:bg-[#1f3a2d]"
            >
              <ScrollText aria-hidden="true" className="h-4 w-4" />
              View Match Story
            </Link>
            <ShareCard
              fixture={currentSnapshot.fixture}
              score={currentSnapshot.score}
              biggestPulse={biggestPulse?.title ?? "Final push"}
              meter={currentSnapshot.pulseMeter}
              story={currentSnapshot.story}
            />
          </>
        ) : null}

        {currentWarnings.length > 0 ? (
          <EmptyState title="Partial live data">
            {currentWarnings.join(" · ")}. FanPulse is showing every verified
            signal currently available.
          </EmptyState>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/matches"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dce8d8] bg-white px-4 text-sm font-black text-[#10261c] transition hover:bg-[#eef7ec]"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Match Lobby
          </Link>
          <Link
            href={`/match/${currentSnapshot.fixture.fixtureId}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ff7a45] px-4 text-sm font-black text-white transition hover:bg-[#d95e2f]"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Refresh Pulse
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
