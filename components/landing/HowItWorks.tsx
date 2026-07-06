import {
  Activity,
  MessageCircleQuestion,
  Mic2,
  Share2,
  Users,
} from "lucide-react";

const features = [
  {
    title: "Live Pulse",
    copy: "See who owns the match momentum.",
    icon: Activity,
    tone: "text-[#15b56d]",
  },
  {
    title: "Fan Quests",
    copy: "Play free Hi-Lo match moments.",
    icon: MessageCircleQuestion,
    tone: "text-[#3157d5]",
  },
  {
    title: "Auto Pundit",
    copy: "Get short match explanations as moments land.",
    icon: Mic2,
    tone: "text-[#7c3aed]",
  },
  {
    title: "Sweepstake",
    copy: "Turn fixtures into a watch-party leaderboard.",
    icon: Users,
    tone: "text-[#0f9f6e]",
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
      <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
