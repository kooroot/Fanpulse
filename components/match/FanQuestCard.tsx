import { MessageCircleQuestion } from "lucide-react";
import type { FanQuest } from "@/lib/pulse/types";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";

type FanQuestCardProps = {
  quest?: FanQuest;
  selectedOption?: string;
  onSelect: (option: string) => void;
};

export function FanQuestCard({
  quest,
  selectedOption,
  onSelect,
}: FanQuestCardProps) {
  if (!quest) {
    return (
      <EmptyState title="Fan Quest loading">
        A new free quest appears as the match pulse unfolds.
      </EmptyState>
    );
  }

  const resolved = quest.status === "RESOLVED";

  return (
    <section className="rounded-lg border border-[#cbdaf8] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[#3157d5]">
            <MessageCircleQuestion aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[#3157d5]">
              Fan Quest
            </p>
            <h2 className="mt-1 text-xl font-black text-[#10261c]">
              {quest.question}
            </h2>
          </div>
        </div>
        <Badge tone={resolved ? "green" : "blue"}>
          {resolved ? "Resolved" : `+${quest.xpReward} XP`}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {quest.options.map((option) => {
          const selected = selectedOption === option;
          const correct = resolved && quest.resolvedOption === option;
          return (
            <button
              key={option}
              type="button"
              disabled={resolved}
              onClick={() => onSelect(option)}
              className={`min-h-12 rounded-lg border px-3 py-2 text-sm font-bold transition ${
                correct
                  ? "border-[#15b56d] bg-[#eaf8ef] text-[#10261c]"
                  : selected
                    ? "border-[#3157d5] bg-[#eef3ff] text-[#10261c]"
                    : "border-[#dce8d8] bg-[#f8fbf6] text-[#395047] hover:border-[#3157d5]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {resolved ? (
        <p className="mt-3 text-sm font-semibold text-[#52685d]">
          Result: {quest.resolvedOption}
        </p>
      ) : (
        <p className="mt-3 text-sm text-[#5d7167]">
          Free local quest. No account, wallet, prize, or payment.
        </p>
      )}
    </section>
  );
}
