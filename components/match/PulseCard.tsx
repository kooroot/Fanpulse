import { Zap } from "lucide-react";
import type { PulseCard as PulseCardType } from "@/lib/pulse/types";
import { Badge } from "@/components/common/Badge";
import { formatMinute } from "@/lib/utils/format";

type PulseCardProps = {
  card: PulseCardType;
  featured?: boolean;
};

export function PulseCard({ card, featured = false }: PulseCardProps) {
  return (
    <article
      className={`rounded-lg border p-4 shadow-sm ${
        featured
          ? "border-[#ffb48f] bg-[#fff7f1]"
          : "border-[#dce8d8] bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#10261c] text-white">
            <Zap aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-[#ff7a45]">
              {card.fanLabel}
            </p>
            <h3 className="mt-1 text-lg font-black text-[#10261c]">
              {card.title}
            </h3>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge tone={card.dataBadge === "Replay Data" ? "green" : "blue"}>
            {card.dataBadge}
          </Badge>
          <span className="text-xs font-bold text-[#789085]">
            {formatMinute(card.minute ?? card.ts)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#52685d]">{card.summary}</p>
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={`h-2 flex-1 rounded-full ${
              index < card.intensity ? "bg-[#ff7a45]" : "bg-[#e8eee5]"
            }`}
          />
        ))}
      </div>
    </article>
  );
}
