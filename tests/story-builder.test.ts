import { describe, expect, it } from "vitest";
import { getBiggestPulse } from "@/lib/pulse/story-builder";
import { getDemoReplayMatch } from "@/lib/replay/sample-data";
import { getReplaySnapshot } from "@/lib/replay/replay-engine";

describe("story-builder", () => {
  const snapshot = getReplaySnapshot(getDemoReplayMatch());

  it('builds "Match in 7 Pulses"', () => {
    expect(snapshot.story?.title).toBe("Match in 7 Pulses");
    expect(snapshot.story?.chapters).toHaveLength(7);
  });

  it("includes final score", () => {
    expect(snapshot.story?.finalShareText).toContain("2-1");
  });

  it("includes biggest pulse", () => {
    expect(getBiggestPulse(snapshot.pulseCards)).toBeDefined();
  });

  it("creates shareable recap text", () => {
    expect(snapshot.story?.finalShareText).toContain("FanPulse called it");
  });
});
