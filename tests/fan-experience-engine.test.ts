import { describe, expect, it } from "vitest";
import {
  buildPressureIndex,
  buildPunditMoments,
  buildSweepstakeBoard,
  createHiLoChallenge,
  resolveHiLoChallenge,
  scoreHiLoPick,
} from "@/lib/experience/fan-experience-engine";
import { getReplaySnapshot } from "@/lib/replay/replay-engine";
import { getDemoReplayMatch } from "@/lib/replay/sample-data";

describe("fan-experience-engine", () => {
  const replay = getDemoReplayMatch();
  const snapshot = getReplaySnapshot(replay);
  const input = {
    fixture: snapshot.fixture,
    score: snapshot.score,
    pulseMeter: snapshot.pulseMeter,
    pulseCards: snapshot.pulseCards,
  };

  it("creates auto pundit moments from pulse cards", () => {
    const moments = buildPunditMoments(input);

    expect(moments.length).toBeGreaterThan(0);
    expect(moments[0].shareLine).toContain("USA vs Belgium");
  });

  it("builds and resolves a free Hi-Lo stats challenge", () => {
    const challenge = {
      ...createHiLoChallenge(input, 1000),
      selectedOption: "Higher" as const,
    };
    const resolved = resolveHiLoChallenge(challenge, challenge.baseline + 10, 2000);
    const scored = scoreHiLoPick(resolved);

    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedOption).toBe("Higher");
    expect(scored.xp).toBe(challenge.xpReward);
  });

  it("uses only local fan points for sweepstakes", () => {
    const board = buildSweepstakeBoard(input);

    expect(board).toHaveLength(4);
    expect(board.some((row) => row.leader)).toBe(true);
    expect(JSON.stringify(board).toLowerCase()).not.toContain("wallet");
    expect(JSON.stringify(board).toLowerCase()).not.toContain("bet");
  });

  it("pressure index moves with match state", () => {
    const early = getReplaySnapshot(replay, 2_000);
    const late = getReplaySnapshot(replay);

    expect(
      buildPressureIndex({
        fixture: early.fixture,
        score: early.score,
        pulseMeter: early.pulseMeter,
        pulseCards: early.pulseCards,
      }),
    ).toBeLessThan(
      buildPressureIndex({
        fixture: late.fixture,
        score: late.score,
        pulseMeter: late.pulseMeter,
        pulseCards: late.pulseCards,
      }),
    );
  });
});
