import { Pause, Play, RotateCcw } from "lucide-react";
import type { ReplayState } from "@/lib/replay/replay-engine";
import { secondsToClock } from "@/lib/utils/time";

type ReplayControlsProps = {
  state: ReplayState;
  durationMs: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: ReplayState["speed"]) => void;
};

const speeds: ReplayState["speed"][] = [1, 5, 20];

export function ReplayControls({
  state,
  durationMs,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
}: ReplayControlsProps) {
  const running = state.status === "running";
  const progress = durationMs > 0 ? (state.elapsedMs / durationMs) * 100 : 0;

  return (
    <section className="rounded-lg border border-[#dce8d8] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-[#789085]">
            Replay Mode
          </p>
          <p className="mt-1 text-lg font-black text-[#10261c]">
            {secondsToClock(state.elapsedMs / 1000)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={running ? onPause : onStart}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#10261c] px-4 text-sm font-bold text-white transition hover:bg-[#1f3a2d]"
          >
            {running ? (
              <Pause aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Play aria-hidden="true" className="h-4 w-4" />
            )}
            {running ? "Pause" : "Start Match Pulse"}
          </button>
          <button
            type="button"
            aria-label="Reset replay"
            onClick={onReset}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#dce8d8] bg-white text-[#10261c] transition hover:bg-[#eef7ec]"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-full bg-[#eef2ed]">
        <div
          className="h-2 rounded-full bg-[#15b56d] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {speeds.map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => onSpeedChange(speed)}
            className={`h-10 rounded-lg border text-sm font-black transition ${
              state.speed === speed
                ? "border-[#10261c] bg-[#10261c] text-white"
                : "border-[#dce8d8] bg-[#f8fbf6] text-[#395047] hover:border-[#10261c]"
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>
    </section>
  );
}
