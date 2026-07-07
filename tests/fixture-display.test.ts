import { describe, expect, it } from "vitest";
import { getFixtureDisplayStatus } from "@/lib/utils/format";
import type { NormalizedFixture, NormalizedScoreUpdate } from "@/lib/txline/types";

const baseFixture: NormalizedFixture = {
  fixtureId: "18209181",
  participant1: "France",
  participant2: "Morocco",
  source: "txline",
};

describe("fixture display status", () => {
  it("does not label future TxLINE fixtures as live", () => {
    const status = getFixtureDisplayStatus(
      {
        ...baseFixture,
        startTime: "2026-07-09T20:00:00.000Z",
      },
      undefined,
      new Date("2026-07-07T17:00:00.000Z"),
    );

    expect(status.kind).toBe("upcoming");
    expect(status.label).toBe("Upcoming");
    expect(status.isLive).toBe(false);
  });

  it("marks recently started fixtures as a live window", () => {
    const status = getFixtureDisplayStatus(
      {
        ...baseFixture,
        startTime: "2026-07-07T16:00:00.000Z",
      },
      undefined,
      new Date("2026-07-07T17:00:00.000Z"),
    );

    expect(status.kind).toBe("live-window");
    expect(status.isLive).toBe(true);
  });

  it("uses score phase when TxLINE confirms the match is live", () => {
    const score: NormalizedScoreUpdate = {
      fixtureId: baseFixture.fixtureId,
      ts: Date.parse("2026-07-07T17:00:00.000Z"),
      phaseId: 4,
      source: "txline",
    };

    const status = getFixtureDisplayStatus(baseFixture, score);

    expect(status.kind).toBe("live");
    expect(status.label).toBe("Live");
    expect(status.detail).toBe("second half");
  });

  it("uses final phase when the match is finished", () => {
    const score: NormalizedScoreUpdate = {
      fixtureId: baseFixture.fixtureId,
      ts: Date.parse("2026-07-07T18:00:00.000Z"),
      phaseId: 5,
      source: "txline",
    };

    const status = getFixtureDisplayStatus(baseFixture, score);

    expect(status.kind).toBe("final");
    expect(status.label).toBe("Final");
    expect(status.isLive).toBe(false);
  });
});
