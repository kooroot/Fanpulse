import { describe, expect, it } from "vitest";
import { derivePulseCards } from "@/lib/pulse/pulse-card-engine";
import { getDemoReplayMatch } from "@/lib/replay/sample-data";

describe("pulse-card-engine", () => {
  const replay = getDemoReplayMatch();
  const cards = derivePulseCards({
    fixture: replay.fixture,
    scoreUpdates: replay.scoreUpdates,
    oddsUpdates: replay.oddsUpdates,
  });

  it("detects goal pulse when score increases", () => {
    expect(cards.some((card) => card.type === "GOAL")).toBe(true);
  });

  it("detects odds shock when implied probability delta >= 0.06", () => {
    expect(cards.some((card) => card.type === "ODDS_SHOCK")).toBe(true);
  });

  it("detects discipline shift for yellow/red card stat keys", () => {
    expect(cards.some((card) => card.type === "DISCIPLINE_SHIFT")).toBe(true);
  });

  it("detects corner pressure for corner stat keys", () => {
    expect(cards.some((card) => card.type === "CORNER_PRESSURE")).toBe(true);
  });

  it("detects final whistle for phase 5/10/13", () => {
    expect(cards.some((card) => card.type === "FINAL_WHISTLE")).toBe(true);
  });
});
