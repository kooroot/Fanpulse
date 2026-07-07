import type { NormalizedFixture } from "@/lib/txline/types";
import type { PulseMeterState } from "@/lib/pulse/types";
import { formatTeamName } from "@/lib/utils/format";

type PulseMeterProps = {
  fixture: NormalizedFixture;
  meter: PulseMeterState;
};

export function PulseMeter({ fixture, meter }: PulseMeterProps) {
  return (
    <section className="rounded-lg border border-[#dce8d8] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-[#789085]">
            Live Pulse
          </p>
          <h2 className="mt-1 text-xl font-black text-[#10261c]">
            {meter.label}
          </h2>
        </div>
        <div className="rounded-full bg-[#eef7ec] px-3 py-1 text-sm font-black text-[#10261c]">
          {meter.chaos}% chaos
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-full bg-[#eef2ed]">
        <div className="flex h-5">
          <div
            className="bg-[#15b56d] transition-all duration-500"
            style={{ width: `${meter.p1}%` }}
          />
          <div
            className="bg-[#3157d5] transition-all duration-500"
            style={{ width: `${meter.p2}%` }}
          />
          <div
            className="bg-[#ff7a45] transition-all duration-500"
            style={{ width: `${meter.chaos}%` }}
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-bold text-[#52685d]">
        <span className="truncate">{formatTeamName(fixture.participant1)} {meter.p1}%</span>
        <span className="truncate text-center">
          {formatTeamName(fixture.participant2)} {meter.p2}%
        </span>
        <span className="truncate text-right">Chaos {meter.chaos}%</span>
      </div>
      {meter.reasons.length > 0 ? (
        <p className="mt-4 text-sm leading-6 text-[#5d7167]">
          {meter.reasons.join(" · ")}
        </p>
      ) : null}
    </section>
  );
}
