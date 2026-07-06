import { describe, expect, it } from "vitest";
import {
  advanceReplay,
  createReplayState,
  pauseReplay,
  resetReplay,
  setReplaySpeed,
  startReplay,
} from "@/lib/replay/replay-engine";
import { getDemoReplayMatch } from "@/lib/replay/sample-data";

describe("replay-engine", () => {
  const replay = getDemoReplayMatch();

  it("replay advances events over time", () => {
    const started = startReplay(createReplayState());
    const advanced = advanceReplay(replay, started, 3000);

    expect(advanced.elapsedMs).toBe(3000);
    expect(advanced.emittedEvents.length).toBeGreaterThan(0);
  });

  it("start/pause/reset works", () => {
    const started = startReplay(createReplayState());
    const paused = pauseReplay(started);
    const advanced = advanceReplay(replay, paused, 3000);
    const reset = resetReplay(advanced);

    expect(paused.status).toBe("paused");
    expect(advanced.elapsedMs).toBe(0);
    expect(reset.elapsedMs).toBe(0);
  });

  it("speed multiplier works", () => {
    const fast = startReplay(setReplaySpeed(createReplayState(), 5));
    const advanced = advanceReplay(replay, fast, 1000);

    expect(advanced.elapsedMs).toBe(5000);
  });
});
