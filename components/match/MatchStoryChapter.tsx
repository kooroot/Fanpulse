import type { MatchStory } from "@/lib/pulse/types";

type MatchStoryChapterProps = {
  chapter: MatchStory["chapters"][number];
  index: number;
};

export function MatchStoryChapter({ chapter, index }: MatchStoryChapterProps) {
  return (
    <article className="rounded-lg border border-[#dce8d8] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10261c] text-sm font-black text-white">
          {index + 1}
        </span>
        <div>
          <h2 className="text-lg font-black text-[#10261c]">{chapter.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#52685d]">
            {chapter.summary}
          </p>
        </div>
      </div>
    </article>
  );
}
