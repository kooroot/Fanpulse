import { Badge } from "@/components/common/Badge";

export function TrackFit() {
  return (
    <section className="px-5 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl rounded-lg border border-[#dce8d8] bg-white p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">World Cup football</Badge>
          <Badge tone="orange">TxLINE-ready</Badge>
          <Badge tone="green">No wallet</Badge>
        </div>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#395047]">
          FanPulse turns football match data into live momentum, free Fan
          Quests, Pulse Cards, and a recap fans can share with friends.
        </p>
      </div>
    </section>
  );
}
