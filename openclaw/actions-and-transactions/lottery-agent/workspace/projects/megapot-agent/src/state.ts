import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { getAddress, isAddress, type Address } from "viem";
import { DEFAULT_REFERRER } from "./contracts.js";

export type Ticket = {
  normals: number[];
  bonusball: number;
};

export type LotteryState = {
  version: 1;
  setupComplete: boolean;
  paused: boolean;
  ticketCount?: number;
  mode?: "random" | "manual";
  manualTickets?: Ticket[];
  walletAddress?: Address;
  referrer: Address;
  lastAttemptDate?: string;
  lastSuccessDate?: string;
  lastSuccessTxHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseRecord = {
  type: "purchase";
  mode: "random" | "manual";
  dateKey: string;
  drawingId?: string;
  ticketCount: number;
  ticketIds: string[];
  spentUsdc: string;
  txHash: string;
  timestamp: string;
};

export type ClaimRecord = {
  type: "claim";
  ticketIds: string[];
  txHash: string;
  timestamp: string;
};

export type ResultRecord = {
  type: "result";
  drawingId: string;
  drawingTime: string;
  winningTicket: string;
  jackpotLock: boolean;
  timestamp: string;
};

export function dataDir() {
  return process.env.LOTTERY_AGENT_DATA_DIR
    ? path.resolve(process.env.LOTTERY_AGENT_DATA_DIR)
    : path.resolve(process.cwd(), "../../data");
}

export function statePath() {
  return path.join(dataDir(), "state.json");
}

export function purchasesPath() {
  return path.join(dataDir(), "purchases.jsonl");
}

export function claimsPath() {
  return path.join(dataDir(), "claims.jsonl");
}

export function resultsPath() {
  return path.join(dataDir(), "results.jsonl");
}

export async function ensureDataDir() {
  await mkdir(dataDir(), { recursive: true });
}

export function defaultState(referrer: Address = DEFAULT_REFERRER): LotteryState {
  const now = new Date().toISOString();
  return {
    version: 1,
    setupComplete: false,
    paused: true,
    referrer,
    createdAt: now,
    updatedAt: now
  };
}

export async function readState(referrer: Address = DEFAULT_REFERRER): Promise<LotteryState> {
  await ensureDataDir();
  try {
    const raw = await readFile(statePath(), "utf8");
    const parsed = JSON.parse(raw) as LotteryState;
    return {
      ...defaultState(referrer),
      ...parsed,
      referrer: isAddress(parsed.referrer) ? getAddress(parsed.referrer) : referrer
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultState(referrer);
    }
    throw error;
  }
}

export async function writeState(state: LotteryState) {
  await ensureDataDir();
  await writeFile(
    statePath(),
    `${JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2)}\n`
  );
}

export async function appendJsonl(filePath: string, value: unknown) {
  await ensureDataDir();
  await appendFile(filePath, `${safeStringify(value)}\n`);
}

export async function readJsonl<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function safeStringify(value: unknown) {
  return JSON.stringify(
    value,
    (_key, innerValue) => (typeof innerValue === "bigint" ? innerValue.toString() : innerValue),
    2
  );
}

export function denverDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}
