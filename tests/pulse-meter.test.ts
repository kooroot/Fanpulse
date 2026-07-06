import { describe, expect, it } from "vitest";
import { derivePulseCards } from "@/lib/pulse/pulse-card-engine";
import { computePulseMeter } from "@/lib/pulse/pulse-meter";
import { getDemoReplayMatch } from "@/lib/replay/sample-data";

describe("pulse-meter", () => {
  const replay = getDemoReplayMatch();

  it("normalizes p1+p2+chaos to 100", () => {
    const cards = derivePulseCards(replay);
    const meter = computePulseMeter({
      fixture: replay.fixture,
      scoreUpdates: replay.scoreUpdates,
      oddsUpdates: replay.oddsUpdates,
      pulseCards: cards,
    });

    expect(meter.p1 + meter.p2 + meter.chaos).toBe(100);
  });

  it("leading team gets stronger pulse", () => {
    const scoreUpdates = replay.scoreUpdates.slice(0, 5);
    const oddsUpdates = replay.oddsUpdates.slice(0, 6);
    const cards = derivePulseCards({
      fixture: replay.fixture,
      scoreUpdates,
      oddsUpdates,
    });
    const meter = computePulseMeter({
      fixture: replay.fixture,
      scoreUpdates,
      oddsUpdates,
      pulseCards: cards,
    });

    expect(meter.p1).toBeGreaterThan(meter.p2);
  });

  it("late close match increases chaos", () => {
    const earlyScoreUpdates = replay.scoreUpdates.slice(0, 8);
    const lateScoreUpdates = replay.scoreUpdates.slice(0, 10);
    const earlyCards = derivePulseCards({
      fixture: replay.fixture,
      scoreUpdates: earlyScoreUpdates,
      oddsUpdates: replay.oddsUpdates,
    });
    const lateCards = derivePulseCards({
      fixture: replay.fixture,
      scoreUpdates: lateScoreUpdates,
      oddsUpdates: replay.oddsUpdates,
    });
    const early = computePulseMeter({
      fixture: replay.fixture,
      scoreUpdates: earlyScoreUpdates,
      oddsUpdates: replay.oddsUpdates,
      pulseCards: earlyCards,
    });
    const late = computePulseMeter({
      fixture: replay.fixture,
      scoreUpdates: lateScoreUpdates,
      oddsUpdates: replay.oddsUpdates,
      pulseCards: lateCards,
    });

    expect(late.chaos).toBeGreaterThan(early.chaos);
  });

  it("recent goal increases scoring team pulse", () => {
    const before = replay.scoreUpdates.slice(0, 3);
    const after = replay.scoreUpdates.slice(0, 4);
    const beforeMeter = computePulseMeter({
      fixture: replay.fixture,
      scoreUpdates: before,
      oddsUpdates: replay.oddsUpdates.slice(0, 3),
      pulseCards: [],
    });
    const afterMeter = computePulseMeter({
      fixture: replay.fixture,
      scoreUpdates: after,
      oddsUpdates: replay.oddsUpdates.slice(0, 6),
      pulseCards: [],
    });

    expect(afterMeter.p1).toBeGreaterThan(beforeMeter.p1);
  });
});
