import type { NormalizedFixture, NormalizedScoreUpdate } from "@/lib/txline/types";
import { PhaseBadge } from "@/components/match/PhaseBadge";

type ScoreHeaderProps = {
  fixture: NormalizedFixture;
  score?: NormalizedScoreUpdate;
};

export function ScoreHeader({ fixture, score }: ScoreHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dce8d8] bg-[#f7faf5]/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#15b56d]">
            {fixture.participant1}
          </p>
          <p className="mt-1 text-3xl font-black text-[#10261c]">
            {score?.participant1Score ?? 0}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          <PhaseBadge phaseId={score?.phaseId} fallback={fixture.status} />
          <span className="text-xs font-bold uppercase tracking-normal text-[#789085]">
            Pulse
          </span>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-sm font-bold text-[#3157d5]">
            {fixture.participant2}
          </p>
          <p className="mt-1 text-3xl font-black text-[#10261c]">
            {score?.participant2Score ?? 0}
          </p>
        </div>
      </div>
    </header>
  );
}
