import { Flame, Star } from "lucide-react";
import type { FanQuestState } from "@/lib/pulse/types";

type LocalXpBadgeProps = {
  state: FanQuestState;
};

export function LocalXpBadge({ state }: LocalXpBadgeProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-[#dce8d8] bg-white p-3">
        <Star aria-hidden="true" className="h-5 w-5 text-[#ff7a45]" />
        <div>
          <p className="text-xs font-bold text-[#789085]">Local XP</p>
          <p className="text-lg font-black text-[#10261c]">{state.totalXp}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-[#dce8d8] bg-white p-3">
        <Flame aria-hidden="true" className="h-5 w-5 text-[#15b56d]" />
        <div>
          <p className="text-xs font-bold text-[#789085]">Streak</p>
          <p className="text-lg font-black text-[#10261c]">{state.streak}</p>
        </div>
      </div>
    </div>
  );
}
