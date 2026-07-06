import {
  currentEpochDay,
  getDefaultCompetitionId,
  getTxLineNetworkConfig,
  isNumericFixtureId,
  normalizeTxLineNetwork,
  txLineApiUrl,
  type TxLineNetwork,
} from "@/lib/txline/network";
import {
  extractArray,
  normalizeFixture,
  normalizeOddsUpdate,
  normalizeScoreUpdate,
} from "@/lib/txline/normalize";
import type {
  NormalizedFixture,
  NormalizedOddsUpdate,
  NormalizedScoreUpdate,
} from "@/lib/txline/types";

type TxLineClientOptions = {
  origin?: string;
  jwt?: string;
  apiToken?: string;
  network?: TxLineNetwork;
};

export type TxLineCredentialSet = {
  label: "primary" | "fallback";
  origin?: string;
  jwt: string;
  apiToken: string;
  network: TxLineNetwork;
};

export function hasTxLineCredentials(): boolean {
  return getTxLineCredentialSets().length > 0;
}

export function getTxLineCredentialSets(): TxLineCredentialSet[] {
  const sets: TxLineCredentialSet[] = [];
  if (process.env.TXLINE_JWT && process.env.TXLINE_API_TOKEN) {
    sets.push({
      label: "primary",
      origin: process.env.TXLINE_API_ORIGIN,
      jwt: process.env.TXLINE_JWT,
      apiToken: process.env.TXLINE_API_TOKEN,
      network: normalizeTxLineNetwork(process.env.TXLINE_NETWORK ?? "mainnet"),
    });
  }

  if (
    process.env.TXLINE_FALLBACK_JWT &&
    process.env.TXLINE_FALLBACK_API_TOKEN
  ) {
    sets.push({
      label: "fallback",
      origin: process.env.TXLINE_FALLBACK_API_ORIGIN,
      jwt: process.env.TXLINE_FALLBACK_JWT,
      apiToken: process.env.TXLINE_FALLBACK_API_TOKEN,
      network: normalizeTxLineNetwork(
        process.env.TXLINE_FALLBACK_NETWORK ?? "devnet",
      ),
    });
  }

  return sets;
}

export function createTxLineClientForSet(
  credentials: TxLineCredentialSet,
): TxLineClient {
  return new TxLineClient({
    origin: credentials.origin,
    jwt: credentials.jwt,
    apiToken: credentials.apiToken,
    network: credentials.network,
  });
}

export function buildTxLineHeaders(
  jwt?: string,
  apiToken?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Accept-Encoding": "gzip",
  };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  if (apiToken) headers["X-Api-Token"] = apiToken;
  return headers;
}

export class TxLineClient {
  private readonly origin?: string;
  private readonly jwt?: string;
  private readonly apiToken?: string;
  private readonly network: TxLineNetwork;

  constructor(options: TxLineClientOptions = {}) {
    this.origin = options.origin ?? process.env.TXLINE_API_ORIGIN;
    this.jwt = options.jwt ?? process.env.TXLINE_JWT;
    this.apiToken = options.apiToken ?? process.env.TXLINE_API_TOKEN;
    this.network = options.network ?? normalizeTxLineNetwork(process.env.TXLINE_NETWORK);
  }

  get config() {
    return getTxLineNetworkConfig(this.network);
  }

  async getFixturesSnapshot(
    options: {
      startEpochDay?: number;
      competitionId?: number | string;
      upcomingOnly?: boolean;
      limit?: number;
    } = {},
  ): Promise<NormalizedFixture[]> {
    const params = new URLSearchParams();
    params.set("startEpochDay", String(options.startEpochDay ?? currentEpochDay()));
    params.set(
      "competitionId",
      String(options.competitionId ?? getDefaultCompetitionId(this.network)),
    );

    const payload = await this.getJson(`/api/fixtures/snapshot?${params}`);
    const fixtures = itemsFromPayload(payload)
      .map((item) => normalizeFixture(item))
      .filter((fixture): fixture is NormalizedFixture => Boolean(fixture));

    const upcomingFiltered =
      options.upcomingOnly === false
        ? fixtures
        : fixtures.filter((fixture) => isUpcomingOrLiveFixture(fixture));

    return upcomingFiltered.slice(0, options.limit ?? 12);
  }

  async getOddsSnapshot(fixtureId: string): Promise<NormalizedOddsUpdate[]> {
    assertNumericFixtureId(fixtureId);
    const payload = await this.getJson(`/api/odds/snapshot/${fixtureId}`);
    return itemsFromPayload(payload)
      .map((item) => normalizeOddsUpdate(item, fixtureId))
      .filter((update): update is NormalizedOddsUpdate => Boolean(update));
  }

  async getScoresSnapshot(fixtureId: string): Promise<NormalizedScoreUpdate[]> {
    assertNumericFixtureId(fixtureId);
    const payload = await this.getJson(`/api/scores/snapshot/${fixtureId}`);
    return itemsFromPayload(payload)
      .map((item) => normalizeScoreUpdate(item, fixtureId))
      .filter((update): update is NormalizedScoreUpdate => Boolean(update));
  }

  async getHistoricalScores(
    fixtureId: string,
  ): Promise<NormalizedScoreUpdate[]> {
    assertNumericFixtureId(fixtureId);
    const payload = await this.getJson(`/api/scores/historical/${fixtureId}`);
    return itemsFromPayload(payload)
      .map((item) => normalizeScoreUpdate(item, fixtureId))
      .filter((update): update is NormalizedScoreUpdate => Boolean(update));
  }

  streamOdds(): Promise<Response> {
    return this.stream("/api/odds/stream");
  }

  streamScores(): Promise<Response> {
    return this.stream("/api/scores/stream");
  }

  private async getJson(path: string): Promise<unknown> {
    const response = await fetch(this.url(path), {
      headers: this.headers(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`TxLINE request failed: ${response.status}`);
    }

    return response.json() as Promise<unknown>;
  }

  private async stream(path: string): Promise<Response> {
    const response = await fetch(this.url(path), {
      headers: {
        ...this.headers(),
        Accept: "text/event-stream",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`TxLINE stream failed: ${response.status}`);
    }

    return response;
  }

  private headers(): HeadersInit {
    return buildTxLineHeaders(this.jwt, this.apiToken);
  }

  private url(path: string): string {
    return txLineApiUrl(path, this.network, this.origin);
  }
}

function assertNumericFixtureId(fixtureId: string): void {
  if (!isNumericFixtureId(fixtureId)) {
    throw new Error("TxLINE fixture id must be numeric");
  }
}

function isUpcomingOrLiveFixture(fixture: NormalizedFixture): boolean {
  if (!fixture.startTime) return true;

  const startMs = Date.parse(fixture.startTime);
  if (!Number.isFinite(startMs)) return true;

  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  return startMs >= sixHoursAgo;
}

function itemsFromPayload(payload: unknown): unknown[] {
  const extracted = extractArray(payload);
  if (extracted.length > 0) return extracted;
  return payload && typeof payload === "object" ? [payload] : [];
}
