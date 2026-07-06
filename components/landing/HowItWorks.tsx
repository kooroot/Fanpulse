import { Activity, MessageCircleQuestion, Share2 } from "lucide-react";

const features = [
  {
    title: "Live Pulse",
    copy: "See who owns the match momentum.",
    icon: Activity,
    tone: "text-[#15b56d]",
  },
  {
    title: "Fan Quests",
    copy: "Play free, lightweight match moments.",
    icon: MessageCircleQuestion,
    tone: "text-[#3157d5]",
  },
  {
    title: "Match Story",
    copy: "Turn the game into a shareable recap.",
    icon: Share2,
    tone: "text-[#ff7a45]",
  },
];

export function HowItWorks() {
  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="rounded-lg border border-[#dce8d8] bg-white p-5 shadow-sm"
            >
              <Icon aria-hidden="true" className={`h-6 w-6 ${feature.tone}`} />
              <h2 className="mt-4 text-lg font-black text-[#10261c]">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5d7167]">
                {feature.copy}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
