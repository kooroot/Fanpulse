import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import type { NormalizedFixture } from "@/lib/txline/types";
import {
  formatTeamName,
  getFixtureDisplayStatus,
  type FixtureDisplayKind,
} from "@/lib/utils/format";

type FixtureCardProps = {
  fixture: NormalizedFixture;
};

export function FixtureCard({ fixture }: FixtureCardProps) {
  const displayStatus = getFixtureDisplayStatus(fixture);

  return (
    <article className="flex h-full flex-col rounded-lg border border-[#dce8d8] bg-white p-4 shadow-sm">
      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={fixtureTone(displayStatus.kind)}>
              {displayStatus.label}
            </Badge>
            <Badge tone="light">
              {fixture.source === "txline" ? "TxLINE fixture" : "Fallback"}
            </Badge>
            <Badge tone="light">{displayStatus.detail}</Badge>
          </div>
          <h2 className="mt-4 text-xl font-black text-[#10261c]">
            {formatTeamName(fixture.participant1)} vs{" "}
            {formatTeamName(fixture.participant2)}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#5d7167]">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {formatFixtureTime(fixture.startTime)}
          </p>
        </div>
      </div>
      <Link
        href={`/match/${fixture.fixtureId}`}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#10261c] px-4 text-sm font-bold text-white transition hover:bg-[#1f3a2d]"
      >
        Open Match
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}

function fixtureTone(kind: FixtureDisplayKind) {
  if (kind === "live" || kind === "live-window") return "blue";
  if (kind === "upcoming" || kind === "starting-soon") return "orange";
  if (kind === "replay") return "green";
  return "light";
}

function formatFixtureTime(startTime?: string): string {
  if (!startTime) return "Match time pending";

  const parsed = Date.parse(startTime);
  if (!Number.isFinite(parsed)) return "Match time pending";

  return new Date(parsed).toLocaleString();
}
