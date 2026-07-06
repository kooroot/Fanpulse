import Link from "next/link";
import { ArrowRight, Play, Radio } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import type { NormalizedFixture } from "@/lib/txline/types";

type HeroProps = {
  featuredFixture: NormalizedFixture;
  liveAvailable: boolean;
};

export function Hero({ featuredFixture, liveAvailable }: HeroProps) {
  const primaryHref = `/match/${featuredFixture.fixtureId}`;
  const primaryLabel = liveAvailable ? "Open Live Match" : "Open Match Pulse";
  const statusLabel = liveAvailable ? "TxLINE Live Fixture" : "Replay Fallback";
  const fixtureStatus = liveAvailable
    ? featuredFixture.status ?? "Live data ready"
    : "Fallback ready";

  return (
    <section className="pulse-grid relative overflow-hidden bg-[#f7faf5] px-5 py-8 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_0.9fr] md:items-center">
        <div className="min-w-0">
          <Badge tone={liveAvailable ? "blue" : "green"}>
            {liveAvailable ? "Real match data ready" : "Data-backed fallback"}
          </Badge>
          <h1 className="mt-5 text-5xl font-black tracking-normal text-[#10261c] sm:text-6xl">
            FanPulse
          </h1>
          <p className="mt-4 max-w-xl text-lg font-semibold leading-8 text-[#395047]">
            Feel the match through live momentum, fan quests, and shareable
            football stories.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="blue">TxLINE live input</Badge>
            <Badge tone="light">5s pulse refresh</Badge>
            <Badge tone="light">Stat Hi-Lo</Badge>
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#10261c] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1f3a2d]"
            >
              <Play aria-hidden="true" className="h-4 w-4" />
              {primaryLabel}
            </Link>
            <Link
              href="/matches"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#bdd5b5] bg-white px-5 text-sm font-bold text-[#10261c] transition hover:bg-[#eef7ec]"
            >
              View Match Lobby
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-[#dce8d8] bg-white p-4 shadow-[0_24px_80px_rgba(16,38,28,0.12)]">
          <div className="rounded-lg bg-[#10261c] p-4 text-white">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-normal text-[#9ce7bd]">
              <span>{statusLabel}</span>
              <Radio aria-hidden="true" className="h-4 w-4" />
            </div>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-[#9ce7bd]">
                  Fixture side
                </p>
                <p className="mt-1 truncate text-2xl font-black">
                  {featuredFixture.participant1}
                </p>
              </div>
              <div className="rounded-full bg-white/12 px-3 py-1 text-sm font-bold">
                vs
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-[#a9bbff]">
                  Fixture side
                </p>
                <p className="mt-1 truncate text-2xl font-black">
                  {featuredFixture.participant2}
                </p>
              </div>
            </div>
            <p className="mt-4 truncate rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-[#dff7e8]">
              {fixtureStatus}
            </p>
            <div className="mt-6 overflow-hidden rounded-full bg-white/15">
              <div className="flex h-4">
                <div className="w-[46%] bg-[#15b56d]" />
                <div className="w-[24%] bg-[#3157d5]" />
                <div className="w-[30%] bg-[#ff7a45]" />
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-white p-4 text-[#10261c]">
              <p className="text-xs font-bold uppercase tracking-normal text-[#ff7a45]">
                Pulse Card
              </p>
              <h2 className="mt-1 text-xl font-black">The pulse flips</h2>
              <p className="mt-2 text-sm leading-6 text-[#52685d]">
                Momentum moved sharply and the match feels different now.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
