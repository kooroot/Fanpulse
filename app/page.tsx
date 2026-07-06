import { BottomNav } from "@/components/common/BottomNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TrackFit } from "@/components/landing/TrackFit";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7faf5] pb-20">
      <Hero />
      <HowItWorks />
      <TrackFit />
      <footer className="px-5 py-8 text-center text-xs font-semibold text-[#5d7167]">
        Unofficial fan experience. No betting. No official tournament
        affiliation.
      </footer>
      <BottomNav />
    </div>
  );
}
