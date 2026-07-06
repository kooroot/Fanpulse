import type { PulseCard as PulseCardType } from "@/lib/pulse/types";
import { PulseCard } from "@/components/match/PulseCard";
import { EmptyState } from "@/components/common/EmptyState";

type PulseTimelineProps = {
  cards: PulseCardType[];
};

export function PulseTimeline({ cards }: PulseTimelineProps) {
  if (cards.length === 0) {
    return (
      <EmptyState title="Pulse timeline waiting">
        Start Match Pulse to watch the story build.
      </EmptyState>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black text-[#10261c]">Pulse Timeline</h2>
      <div className="space-y-3">
        {cards.map((card) => (
          <PulseCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}
