import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AnchorProvider, Program, Wallet, type Idl } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import nacl from "tweetnacl";
import {
  currentEpochDay,
  getDefaultCompetitionId,
  getTxLineNetworkConfig,
  normalizeTxLineNetwork,
  txLineApiUrl,
  txLineExplorerAddress,
  txLineExplorerTx,
  type TxLineNetwork,
} from "../lib/txline/network";

type PricingMatrix = {
  rows: Array<{
    rowId: number;
    pricePerWeekToken: { toString(): string } | number;
    samplingIntervalSec: number;
    leagueBundleId: number;
    marketBundleId: number;
  }>;
};

type SubscribeAccountNamespace = {
  pricingMatrix?: {
    fetch(pubkey: PublicKey): Promise<PricingMatrix>;
  };
};

type SubscribeMethods = {
  subscribe(
    serviceLevelId: number,
    durationWeeks: number,
  ): {
    accounts(accounts: Record<string, PublicKey>): {
      rpc(): Promise<string>;
    };
  };
};

type BootstrapResult = {
  jwt: string;
  apiToken: string;
  txSig: string;
};

const PRICING_MATRIX_SEED = "pricing_matrix";
const TOKEN_TREASURY_SEED = "token_treasury_v2";
const DEFAULT_KEYPAIR_PATH = "keys/fanpulse-txline-devnet.json";
const DEFAULT_IDL_PATH = "txline/idl/txoracle.json";

const command = process.argv[2] ?? "help";

void main(command).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main(cmd: string): Promise<void> {
  switch (cmd) {
    case "keypair":
      printKeypair();
      return;
    case "status":
      await printStatus();
      return;
    case "bootstrap":
      await bootstrapDevnetAccess();
      return;
    case "check-data":
      await checkDataAccess();
      return;
    case "help":
    default:
      printHelp();
  }
}

function printHelp(): void {
  console.log(`FanPulse TxLINE access helper

Commands:
  bun scripts/txline-access.ts keypair     Create/print the local TxLINE wallet address
  bun scripts/txline-access.ts status      Show wallet balance and TxLINE program status
  bun scripts/txline-access.ts bootstrap   Subscribe + activate + write .env.local
  bun scripts/txline-access.ts check-data  Test authenticated fixture snapshot access

Default wallet: ${DEFAULT_KEYPAIR_PATH}`);
}

function printKeypair(): void {
  const wallet = loadOrCreateWallet();
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`Mainnet: ${txLineExplorerAddress(wallet.publicKey.toBase58(), "mainnet")}`);
  console.log(`Devnet: ${txLineExplorerAddress(wallet.publicKey.toBase58(), "devnet")}`);
  console.log(`Keypair file: ${walletPath()}`);
}

async function printStatus(): Promise<void> {
  const network = selectedNetwork();
  const config = getTxLineNetworkConfig(network);
  const connection = new Connection(rpcUrl(), "confirmed");
  const wallet = loadOrCreateWallet();
  const balance = await connection.getBalance(wallet.publicKey);
  const program = await connection.getAccountInfo(new PublicKey(config.programId));

  console.log(`Network: ${network}`);
  console.log(`RPC: ${rpcUrl()}`);
  console.log(`API: ${config.apiOrigin}`);
  console.log(`Wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`);
  console.log(`TxLINE program executable: ${Boolean(program?.executable)}`);
  console.log(`Explorer: ${txLineExplorerAddress(wallet.publicKey.toBase58(), network)}`);
}

async function bootstrapDevnetAccess(): Promise<void> {
  const network = selectedNetwork();
  const config = getTxLineNetworkConfig(network);
  const connection = new Connection(rpcUrl(), "confirmed");
  const wallet = loadOrCreateWallet();
  const balance = await connection.getBalance(wallet.publicKey);
  if (balance < 10_000_000) {
    throw new Error(
      `Wallet has ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL on ${network}. Fund ${wallet.publicKey.toBase58()} first.`,
    );
  }

  const jwt = await getGuestJwt(config.apiOrigin);
  console.log("Guest JWT received.");
  const txSig = await subscribe(connection, wallet, network);
  const apiToken = await activateToken(config.apiOrigin, txSig, jwt, wallet.secretKey);
  writeEnvLocal(network, { jwt, apiToken, txSig });

  console.log(`Subscribe tx: ${txSig}`);
  console.log(`Explorer: ${txLineExplorerTx(txSig, network)}`);
  console.log(
    network === "mainnet"
      ? ".env.local updated with primary TXLINE_JWT and TXLINE_API_TOKEN."
      : ".env.local updated with fallback TXLINE_FALLBACK_JWT and TXLINE_FALLBACK_API_TOKEN.",
  );
  console.log("Run `bun run txline:check:data` to verify authenticated fixture data.");
}

async function checkDataAccess(): Promise<void> {
  loadEnvLocal();
  const network = selectedNetwork();
  const jwt =
    network === "devnet"
      ? process.env.TXLINE_FALLBACK_JWT ?? process.env.TXLINE_JWT
      : process.env.TXLINE_JWT;
  const apiToken =
    network === "devnet"
      ? process.env.TXLINE_FALLBACK_API_TOKEN ?? process.env.TXLINE_API_TOKEN
      : process.env.TXLINE_API_TOKEN;
  if (!jwt || !apiToken) {
    throw new Error("Missing TXLINE_JWT or TXLINE_API_TOKEN. Run bootstrap first.");
  }

  const startEpochDay = currentEpochDay();
  const competitionId = getDefaultCompetitionId(network);
  const originOverride =
    network === "devnet"
      ? process.env.TXLINE_FALLBACK_API_ORIGIN
      : process.env.TXLINE_API_ORIGIN;
  const url = txLineApiUrl(
    `/api/fixtures/snapshot?startEpochDay=${startEpochDay}&competitionId=${competitionId}`,
    network,
    originOverride,
  );
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "X-Api-Token": apiToken,
      "Accept-Encoding": "gzip",
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Fixture snapshot failed: ${response.status} ${text}`);
  }

  const parsed = JSON.parse(text) as unknown;
  const count = Array.isArray(parsed) ? parsed.length : 1;
  console.log(`Authenticated fixture snapshot OK: ${count} item(s)`);
  console.log(`URL: ${url}`);
}

async function subscribe(
  connection: Connection,
  wallet: Keypair,
  network: TxLineNetwork,
): Promise<string> {
  const config = getTxLineNetworkConfig(network);
  const idl = loadIdl(config.programId);
  const provider = new AnchorProvider(connection, new Wallet(wallet), {
    commitment: "confirmed",
  });
  const program = new Program(idl, provider);
  const mint = new PublicKey(config.txlTokenMint);
  const programId = program.programId;
  const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(PRICING_MATRIX_SEED)],
    programId,
  );
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(TOKEN_TREASURY_SEED)],
    programId,
  );
  const tokenTreasuryVault = getAssociatedTokenAddressSync(
    mint,
    tokenTreasuryPda,
    true,
    TOKEN_2022_PROGRAM_ID,
  );
  const userAta = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey,
    false,
    "confirmed",
    undefined,
    TOKEN_2022_PROGRAM_ID,
  );

  await logServiceLevels(program, pricingMatrixPda);

  const serviceLevelId = numberEnv(
    "TXLINE_SERVICE_LEVEL_ID",
    config.freeServiceLevels[0].id,
  );
  const durationWeeks = numberEnv("TXLINE_DURATION_WEEKS", 4);
  console.log(`Subscribing: service_level_id=${serviceLevelId}, weeks=${durationWeeks}`);

  return (program.methods as unknown as SubscribeMethods)
    .subscribe(serviceLevelId, durationWeeks)
    .accounts({
      user: wallet.publicKey,
      pricingMatrix: pricingMatrixPda,
      tokenMint: mint,
      userTokenAccount: userAta.address,
      tokenTreasuryVault,
      tokenTreasuryPda,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

async function logServiceLevels(
  program: Program<Idl>,
  pricingMatrixPda: PublicKey,
): Promise<void> {
  try {
    const namespace = program.account as unknown as SubscribeAccountNamespace;
    const matrix = await namespace.pricingMatrix?.fetch(pricingMatrixPda);
    if (!matrix) return;

    console.log("Service levels:");
    for (const row of matrix.rows) {
      const tokensPerWeek =
        Number(row.pricePerWeekToken.toString()) / 1_000_000;
      console.log(
        `  ${row.rowId}: ${tokensPerWeek} TxL/week, ${row.samplingIntervalSec}s sampling`,
      );
    }
  } catch (error) {
    console.warn(
      `Could not read PricingMatrix: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function getGuestJwt(base: string): Promise<string> {
  const response = await fetch(`${base}/auth/guest/start`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`/auth/guest/start failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error("guest/start returned no token");
  return body.token;
}

async function activateToken(
  base: string,
  txSig: string,
  jwt: string,
  secretKey: Uint8Array,
): Promise<string> {
  const leagues = leagueIds();
  const messageString = `${txSig}:${leagues.join(",")}:${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(message, secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");
  const response = await fetch(`${base}/api/token/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ txSig, walletSignature, leagues }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`/api/token/activate failed: ${response.status} ${text}`);
  }

  try {
    const parsed = JSON.parse(text) as { token?: string };
    if (parsed.token) return parsed.token;
  } catch {
    // Official examples return text/plain.
  }

  const token = text.trim();
  if (!token) throw new Error("activate returned an empty API token");
  return token;
}

function loadIdl(programId: string): Idl & { address?: string } {
  const idlPath = path.resolve(idlPathEnv());
  if (!existsSync(idlPath)) {
    throw new Error(
      `TxLINE IDL not found at ${idlPath}. Run: anchor idl fetch ${programId} --provider.cluster devnet -o ${idlPath}`,
    );
  }

  const idl = JSON.parse(readFileSync(idlPath, "utf8")) as Idl & {
    address?: string;
  };
  idl.address = programId;
  return idl;
}

function loadOrCreateWallet(): Keypair {
  const filePath = path.resolve(walletPath());
  if (existsSync(filePath)) return loadWallet(filePath);

  mkdirSync(path.dirname(filePath), { recursive: true });
  const wallet = Keypair.generate();
  writeFileSync(filePath, JSON.stringify(Array.from(wallet.secretKey)));
  chmodSync(filePath, 0o600);
  return wallet;
}

function loadWallet(filePath: string): Keypair {
  const secret = JSON.parse(readFileSync(filePath, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

function writeEnvLocal(
  network: TxLineNetwork,
  result: BootstrapResult,
): void {
  const config = getTxLineNetworkConfig(network);
  const serviceLevel = String(
    numberEnv("TXLINE_SERVICE_LEVEL_ID", config.freeServiceLevels[0].id),
  );
  const durationWeeks = String(numberEnv("TXLINE_DURATION_WEEKS", 4));
  const commonEntries: Record<string, string> = {
    TXLINE_WALLET_KEYPAIR: walletPath(),
    NEXT_PUBLIC_DEFAULT_MODE: process.env.NEXT_PUBLIC_DEFAULT_MODE ?? "replay",
  };
  const networkEntries: Record<string, string> =
    network === "mainnet"
      ? {
          TXLINE_API_ORIGIN: config.apiOrigin,
          TXLINE_NETWORK: network,
          TXLINE_COMPETITION_ID: getDefaultCompetitionId(network),
          TXLINE_SERVICE_LEVEL_ID: serviceLevel,
          TXLINE_DURATION_WEEKS: durationWeeks,
          TXLINE_SUBSCRIBE_TX: result.txSig,
          TXLINE_JWT: result.jwt,
          TXLINE_API_TOKEN: result.apiToken,
        }
      : {
          TXLINE_FALLBACK_API_ORIGIN: config.apiOrigin,
          TXLINE_FALLBACK_NETWORK: network,
          TXLINE_FALLBACK_COMPETITION_ID: getDefaultCompetitionId(network),
          TXLINE_FALLBACK_SERVICE_LEVEL_ID: serviceLevel,
          TXLINE_FALLBACK_DURATION_WEEKS: durationWeeks,
          TXLINE_FALLBACK_SUBSCRIBE_TX: result.txSig,
          TXLINE_FALLBACK_JWT: result.jwt,
          TXLINE_FALLBACK_API_TOKEN: result.apiToken,
        };
  const entries: Record<string, string> = {
    ...commonEntries,
    ...networkEntries,
  };

  if (network === "devnet") {
    entries.TXLINE_NETWORK = "mainnet";
  }

  if (network === "mainnet") {
    entries.TXLINE_FALLBACK_NETWORK =
      process.env.TXLINE_FALLBACK_NETWORK ?? "devnet";
  }

  const legacyKeys =
    network === "mainnet"
      ? {
          TXLINE_SERVICE_LEVEL_ID: String(
            numberEnv("TXLINE_SERVICE_LEVEL_ID", config.freeServiceLevels[0].id),
          ),
          TXLINE_DURATION_WEEKS: String(numberEnv("TXLINE_DURATION_WEEKS", 4)),
        }
      : {};
  Object.assign(entries, legacyKeys);

  const envPath = ".env.local";
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8").split("\n") : [];
  const used = new Set<string>();
  const lines = existing.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match || !(match[1] in entries)) return line;
    used.add(match[1]);
    return `${match[1]}=${entries[match[1]]}`;
  });

  for (const [key, value] of Object.entries(entries)) {
    if (!used.has(key)) lines.push(`${key}=${value}`);
  }

  writeFileSync(envPath, `${lines.filter(Boolean).join("\n")}\n`);
}

function loadEnvLocal(): void {
  const envPath = ".env.local";
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] ??= value;
  }
}

function selectedNetwork(): TxLineNetwork {
  return normalizeTxLineNetwork(process.env.TXLINE_NETWORK ?? "devnet");
}

function rpcUrl(): string {
  return process.env.TXLINE_RPC_URL ?? getTxLineNetworkConfig(selectedNetwork()).rpcUrl;
}

function walletPath(): string {
  return process.env.TXLINE_WALLET_KEYPAIR ?? DEFAULT_KEYPAIR_PATH;
}

function idlPathEnv(): string {
  return process.env.TXLINE_IDL_PATH ?? DEFAULT_IDL_PATH;
}

function numberEnv(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${key} must be a number`);
  return parsed;
}

function leagueIds(): number[] {
  const raw = process.env.TXLINE_LEAGUES;
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const parsed = Number(item);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid TXLINE_LEAGUES item: ${item}`);
      }
      return parsed;
    });
}
