export type TxLineNetwork = "devnet" | "mainnet";

export type TxLineNetworkConfig = {
  network: TxLineNetwork;
  rpcUrl: string;
  apiOrigin: string;
  apiBaseUrl: string;
  programId: string;
  txlTokenMint: string;
  fixtureCompetitionId: number;
  sourceLabel: string;
  explorerCluster?: "devnet";
  freeServiceLevels: readonly {
    id: number;
    label: string;
    latency: "60-second delay" | "real-time";
  }[];
};

const NETWORKS: Record<TxLineNetwork, TxLineNetworkConfig> = {
  devnet: {
    network: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    apiOrigin: "https://txline-dev.txodds.com",
    apiBaseUrl: "https://txline-dev.txodds.com/api",
    programId: "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
    txlTokenMint: "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG",
    fixtureCompetitionId: 72,
    sourceLabel: "TxLINE devnet",
    explorerCluster: "devnet",
    freeServiceLevels: [
      {
        id: 1,
        label: "World Cup & Int Friendlies",
        latency: "60-second delay",
      },
    ],
  },
  mainnet: {
    network: "mainnet",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    apiOrigin: "https://txline.txodds.com",
    apiBaseUrl: "https://txline.txodds.com/api",
    programId: "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA",
    txlTokenMint: "Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL",
    fixtureCompetitionId: 72,
    sourceLabel: "TxLINE mainnet World Cup feed",
    freeServiceLevels: [
      {
        id: 1,
        label: "World Cup & Int Friendlies",
        latency: "60-second delay",
      },
      {
        id: 12,
        label: "World Cup & Int Friendlies",
        latency: "real-time",
      },
    ],
  },
};

export function normalizeTxLineNetwork(
  value?: string | null,
): TxLineNetwork {
  if (!value) return "mainnet";
  if (value === "devnet" || value === "mainnet") return value;
  throw new Error(`Unsupported TXLINE_NETWORK: ${value}`);
}

export function getTxLineNetworkConfig(
  network?: string | null,
): TxLineNetworkConfig {
  return NETWORKS[normalizeTxLineNetwork(network)];
}

export function getTxLineDataNetworkConfig(): TxLineNetworkConfig {
  return getTxLineNetworkConfig(process.env.TXLINE_NETWORK);
}

export function txLineApiUrl(
  path: string,
  network?: string | null,
  originOverride?: string,
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (originOverride) {
    return `${originOverride}${normalizedPath}`;
  }

  const config = getTxLineNetworkConfig(network);
  if (normalizedPath === "/api" || normalizedPath.startsWith("/api/")) {
    return `${config.apiOrigin}${normalizedPath}`;
  }

  return `${config.apiBaseUrl}${normalizedPath}`;
}

export function getDefaultCompetitionId(network?: string | null): string {
  return String(
    process.env.TXLINE_COMPETITION_ID ??
      getTxLineNetworkConfig(network).fixtureCompetitionId,
  );
}

export function currentEpochDay(): number {
  return Math.floor(Date.now() / 86_400_000);
}

export function isNumericFixtureId(value: string): boolean {
  return /^\d+$/.test(value);
}

export function txLineExplorerTx(
  signature: string,
  network?: string | null,
): string {
  const config = getTxLineNetworkConfig(network);
  const suffix = config.explorerCluster
    ? `?cluster=${config.explorerCluster}`
    : "";
  return `https://explorer.solana.com/tx/${signature}${suffix}`;
}

export function txLineExplorerAddress(
  address: string,
  network?: string | null,
): string {
  const config = getTxLineNetworkConfig(network);
  const suffix = config.explorerCluster
    ? `?cluster=${config.explorerCluster}`
    : "";
  return `https://explorer.solana.com/address/${address}${suffix}`;
}
