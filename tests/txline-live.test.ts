import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTxLineHeaders, TxLineClient } from "@/lib/txline/client";
import {
  isNumericFixtureId,
  txLineApiUrl,
} from "@/lib/txline/network";
import { normalizeFixture } from "@/lib/txline/normalize";

describe("txline live integration", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("builds ProofMarket-compatible mainnet API URLs", () => {
    expect(
      txLineApiUrl(
        "/api/fixtures/snapshot?startEpochDay=20640&competitionId=72",
        "mainnet",
      ),
    ).toBe(
      "https://txline.txodds.com/api/fixtures/snapshot?startEpochDay=20640&competitionId=72",
    );
  });

  it("keeps TxLINE credentials in server request headers", () => {
    expect(buildTxLineHeaders("jwt-value", "api-token")).toEqual({
      "Accept-Encoding": "gzip",
      Authorization: "Bearer jwt-value",
      "X-Api-Token": "api-token",
    });
  });

  it("rejects non-numeric live fixture ids before TxLINE snapshot calls", () => {
    expect(isNumericFixtureId("123456")).toBe(true);
    expect(isNumericFixtureId("demo-usa-belgium")).toBe(false);
    expect(isNumericFixtureId("123/../../secret")).toBe(false);
  });

  it("normalizes numeric TxLINE StartTime values to ISO strings", () => {
    const fixture = normalizeFixture({
      FixtureId: 99,
      Participant1: "USA",
      Participant2: "Belgium",
      CompetitionId: 72,
      Competition: "World Cup",
      StartTime: 1_785_600_000_000,
    });

    expect(fixture?.fixtureId).toBe("99");
    expect(fixture?.competition).toBe("World Cup");
    expect(fixture?.startTime).toBe(new Date(1_785_600_000_000).toISOString());
  });

  it("requests fixture snapshots with startEpochDay and competitionId", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json([
        {
          FixtureId: 123,
          Participant1: "USA",
          Participant2: "Belgium",
          StartTime: 1_785_600_000_000,
        },
      ]),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const fixtures = await new TxLineClient({
      jwt: "jwt-value",
      apiToken: "api-token",
      network: "mainnet",
    }).getFixturesSnapshot({
      startEpochDay: 20640,
      competitionId: 72,
      upcomingOnly: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://txline.txodds.com/api/fixtures/snapshot?startEpochDay=20640&competitionId=72",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
          "X-Api-Token": "api-token",
        }),
      }),
    );
    expect(fixtures).toHaveLength(1);
    expect(fixtures[0].source).toBe("txline");
  });
});
