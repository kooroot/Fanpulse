"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import type { MatchStory, PulseMeterState } from "@/lib/pulse/types";
import type { NormalizedFixture, NormalizedScoreUpdate } from "@/lib/txline/types";
import { formatTeamName } from "@/lib/utils/format";

type ShareCardProps = {
  fixture: NormalizedFixture;
  score?: NormalizedScoreUpdate;
  biggestPulse: string;
  meter: PulseMeterState;
  story: MatchStory;
};

export function ShareCard({
  fixture,
  score,
  biggestPulse,
  meter,
  story,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const finalScore = `${score?.participant1Score ?? 0}-${score?.participant2Score ?? 0}`;
  const momentumWinner =
    meter.leader === "P1"
      ? formatTeamName(fixture.participant1)
      : meter.leader === "P2"
        ? formatTeamName(fixture.participant2)
        : "Balanced";

  async function copyRecap() {
    await navigator.clipboard.writeText(story.finalShareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-lg border border-[#10261c] bg-[#10261c] p-4 text-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-[#9ce7bd]">
            Unofficial fan recap
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {formatTeamName(fixture.participant1)} vs{" "}
            {formatTeamName(fixture.participant2)}
          </h2>
        </div>
        <Share2 aria-hidden="true" className="h-5 w-5 text-[#ffb48f]" />
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Metric label="Final score" value={finalScore} />
        <Metric label="Momentum" value={momentumWinner} />
        <Metric label="Chaos" value={`${meter.chaos}%`} />
      </div>
      <div className="mt-5 rounded-lg bg-white p-4 text-[#10261c]">
        <p className="text-xs font-black uppercase tracking-normal text-[#ff7a45]">
          Biggest pulse
        </p>
        <p className="mt-1 text-lg font-black">{biggestPulse}</p>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#dff7e8]">
        {story.finalShareText}
      </p>
      <button
        type="button"
        onClick={copyRecap}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-black text-[#10261c] transition hover:bg-[#e8f4e6]"
      >
        {copied ? (
          <Check aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Copy aria-hidden="true" className="h-4 w-4" />
        )}
        {copied ? "Copied" : "Copy Recap"}
      </button>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-[11px] font-bold uppercase tracking-normal text-[#b7d8c4]">
        {label}
      </p>
      <p className="mt-1 break-words text-base font-black">{value}</p>
    </div>
  );
}
