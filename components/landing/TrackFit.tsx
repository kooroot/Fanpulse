import { Badge } from "@/components/common/Badge";

export function TrackFit() {
  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl rounded-lg border border-[#dce8d8] bg-white p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">World Cup football</Badge>
          <Badge tone="orange">TxLINE live</Badge>
          <Badge tone="light">5s refresh</Badge>
          <Badge tone="light">Stat Hi-Lo</Badge>
          <Badge tone="green">No wallet</Badge>
          <Badge tone="light">Watch party ready</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#395047]">
          FanPulse turns football match data into live momentum, free Fan
          Quests, odds-derived Auto Pundit moments, TxLINE stat Hi-Lo, group
          sweepstakes, and a recap fans can share with friends.
        </p>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-[#5d7167]">
          The product path is a creator and watch-party companion: clubs,
          streamers, and fan groups can run branded match rooms without wallets,
          stakes, or official marks.
        </p>
      </div>
    </section>
  );
}
