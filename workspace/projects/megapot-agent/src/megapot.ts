import {
  createWalletClient,
  formatUnits,
  http,
  isAddress,
  type Address,
  type Hex
} from "viem";
import { base } from "viem/chains";
import {
  BASE_USDC,
  DEFAULT_REFERRER,
  JACKPOT,
  JACKPOT_RANDOM_TICKET_BUYER,
  SOURCE,
  erc20Abi,
  jackpotAbi,
  randomTicketBuyerAbi
} from "./contracts.js";
import { createBasePublicClient, getWalletAccount, type RuntimeConfig } from "./config.js";
import {
  appendJsonl,
  claimsPath,
  denverDateKey,
  purchasesPath,
  readJsonl,
  readState,
  resultsPath,
  writeState,
  type ClaimRecord,
  type LotteryState,
  type PurchaseRecord,
  type ResultRecord,
  type Ticket
} from "./state.js";
import { eth, usdc } from "./reporting.js";

type DrawingState = {
  prizePool: bigint;
  ticketPrice: bigint;
  edgePerTicket: bigint;
  referralWinShare: bigint;
  referralFee: bigint;
  globalTicketsBought: bigint;
  lpEarnings: bigint;
  drawingTime: bigint;
  winningTicket: bigint;
  ballMax: number;
  bonusballMax: number;
  payoutCalculator: Address;
  jackpotLock: boolean;
};

export type Spender = "random" | "jackpot";

export function spenderAddress(spender: Spender) {
  return spender === "random" ? JACKPOT_RANDOM_TICKET_BUYER : JACKPOT;
}

export async function setup(config: RuntimeConfig) {
  const account = getWalletAccount(config);
  const state = await readState(config.referrer);
  await writeState({
    ...state,
    walletAddress: account?.address,
    referrer: config.referrer,
    setupComplete: Boolean(account && state.ticketCount && state.mode)
  });

  return {
    ok: true,
    command: "setup",
    walletAddress: account?.address,
    privateKeyConfigured: Boolean(account),
    statePathInitialized: true,
    nextSteps: account
      ? ["Run status", "Configure ticket count and mode", "Approve the bounded weekly allowance after confirmation"]
      : ["Add BASE_PRIVATE_KEY through Pinata Secrets, then run setup again"]
  };
}

export async function status(config: RuntimeConfig) {
  const publicClient = createBasePublicClient(config);
  const account = getWalletAccount(config);
  const state = await readState(config.referrer);
  const currentDrawing = await getCurrentDrawing(config);

  const wallet = account
    ? {
        address: account.address,
        baseEth: eth(await publicClient.getBalance({ address: account.address })),
        usdc: usdc(await readUsdcBalance(config, account.address)),
        allowances: {
          jackpot: usdc(await readAllowance(config, account.address, JACKPOT)),
          randomTicketBuyer: usdc(await readAllowance(config, account.address, JACKPOT_RANDOM_TICKET_BUYER))
        }
      }
    : {
        address: undefined,
        missingSecret: "BASE_PRIVATE_KEY"
      };

  return {
    ok: true,
    command: "status",
    wallet,
    config: state,
    contracts: {
      usdc: BASE_USDC,
      jackpot: JACKPOT,
      randomTicketBuyer: JACKPOT_RANDOM_TICKET_BUYER,
      referrer: config.referrer || DEFAULT_REFERRER
    },
    currentDrawing
  };
}

export async function configureState(
  config: RuntimeConfig,
  updates: {
    ticketCount?: number;
    mode?: "random" | "manual";
    manualTickets?: Ticket[];
    paused?: boolean;
  }
) {
  const account = getWalletAccount(config);
  const current = await getCurrentDrawing(config);
  const state = await readState(config.referrer);

  if (updates.ticketCount !== undefined && (!Number.isInteger(updates.ticketCount) || updates.ticketCount < 1 || updates.ticketCount > 10)) {
    throw new Error("Ticket count must be an integer from 1 to 10");
  }

  if (updates.mode === "manual" || updates.manualTickets) {
    const tickets = updates.manualTickets || state.manualTickets;
    if (!tickets || tickets.length === 0) {
      throw new Error("Manual mode requires --numbers like 1,2,3,4,5:6");
    }
    for (const ticket of tickets) {
      validateTicket(ticket, current.raw);
    }
  }

  const next: LotteryState = {
    ...state,
    walletAddress: account?.address || state.walletAddress,
    referrer: config.referrer,
    ticketCount: updates.ticketCount ?? state.ticketCount,
    mode: updates.mode ?? state.mode,
    manualTickets: updates.manualTickets ?? state.manualTickets,
    paused: updates.paused ?? state.paused
  };

  if (next.mode === "manual" && next.manualTickets && next.ticketCount && next.manualTickets.length !== next.ticketCount) {
    throw new Error("Manual ticket count must match the number of configured manual tickets");
  }

  next.setupComplete = Boolean(account && next.ticketCount && next.mode);
  await writeState(next);

  return {
    ok: true,
    command: "configure",
    config: next,
    currentDrawing: current
  };
}

export async function approve(config: RuntimeConfig, spender: Spender, options: { dryRun: boolean; yes: boolean }) {
  const account = requireAccount(config);
  const publicClient = createBasePublicClient(config);
  const state = await readState(config.referrer);
  const current = await getCurrentDrawing(config);
  const ticketCount = requireTicketCount(state);
  const amount = current.raw.ticketPrice * BigInt(ticketCount) * 7n;
  const spenderAddr = spenderAddress(spender);

  if (!options.dryRun && !options.yes) {
    throw new Error("Approval requires --yes after explicit user confirmation");
  }

  if (options.dryRun) {
    return {
      ok: true,
      command: "approve",
      dryRun: true,
      spender,
      spenderAddress: spenderAddr,
      approvalUsdc: usdc(amount),
      policy: "7 * ticketCount * currentTicketPrice"
    };
  }

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(config.rpcUrl)
  });

  const { request } = await publicClient.simulateContract({
    account,
    address: BASE_USDC,
    abi: erc20Abi,
    functionName: "approve",
    args: [spenderAddr, amount]
  });
  const txHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  return {
    ok: true,
    command: "approve",
    spender,
    spenderAddress: spenderAddr,
    approvalUsdc: usdc(amount),
    txHash,
    status: receipt.status
  };
}

export async function buyDaily(config: RuntimeConfig) {
  const state = await readState(config.referrer);
  const dateKey = denverDateKey();
  const precheck = await purchasePrecheck(config, state, dateKey, false);
  if (!precheck.ok) {
    if ("updateAttempt" in precheck && precheck.updateAttempt) {
      await writeState({ ...state, lastAttemptDate: dateKey });
    }
    return precheck;
  }

  return executePurchase(config, state, dateKey, false);
}

export async function buyNow(config: RuntimeConfig, options: { dryRun: boolean; yes: boolean }) {
  if (!options.dryRun && !options.yes) {
    throw new Error("Ad hoc purchases require --yes after explicit user confirmation");
  }
  const state = await readState(config.referrer);
  const dateKey = denverDateKey();
  const precheck = await purchasePrecheck(config, state, dateKey, true);
  if (!precheck.ok) {
    return precheck;
  }
  if (options.dryRun) {
    return {
      ...precheck,
      ok: true,
      dryRun: true,
      wouldBuy: true
    };
  }
  return executePurchase(config, state, dateKey, true);
}

export async function currentDrawing(config: RuntimeConfig) {
  const drawing = await getCurrentDrawing(config);
  return {
    ok: true,
    command: "current-drawing",
    currentDrawing: drawing
  };
}

export async function results(config: RuntimeConfig) {
  const drawing = await getCurrentDrawing(config);
  const record: ResultRecord = {
    type: "result",
    drawingId: drawing.drawingId,
    drawingTime: drawing.drawingTimeIso,
    winningTicket: drawing.winningTicket,
    jackpotLock: drawing.jackpotLock,
    timestamp: new Date().toISOString()
  };
  await appendJsonl(resultsPath(), record);

  return {
    ok: true,
    command: "results",
    currentDrawing: drawing,
    recorded: record
  };
}

export async function history() {
  const purchases = await readJsonl<PurchaseRecord>(purchasesPath());
  const claims = await readJsonl<ClaimRecord>(claimsPath());
  const spent = purchases.reduce((total, purchase) => total + parseUsdcString(purchase.spentUsdc), 0);

  return {
    ok: true,
    command: "history",
    totals: {
      purchases: purchases.length,
      tickets: purchases.reduce((total, purchase) => total + purchase.ticketCount, 0),
      spentUsdc: spent.toFixed(6),
      claims: claims.length
    },
    recentPurchases: purchases.slice(-10),
    recentClaims: claims.slice(-10)
  };
}

export async function claim(config: RuntimeConfig, ticketIds: bigint[], options: { dryRun: boolean; yes: boolean }) {
  const account = requireAccount(config);
  const publicClient = createBasePublicClient(config);

  if (ticketIds.length === 0) {
    throw new Error("Claim requires --ticket-ids with a comma-separated list");
  }
  if (!options.dryRun && !options.yes) {
    throw new Error("Claiming winnings requires --yes after explicit user confirmation");
  }

  if (options.dryRun) {
    return {
      ok: true,
      command: "claim",
      dryRun: true,
      ticketIds: ticketIds.map(String)
    };
  }

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(config.rpcUrl)
  });
  const { request } = await publicClient.simulateContract({
    account,
    address: JACKPOT,
    abi: jackpotAbi,
    functionName: "claimWinnings",
    args: [ticketIds]
  });
  const txHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const record: ClaimRecord = {
    type: "claim",
    ticketIds: ticketIds.map(String),
    txHash,
    timestamp: new Date().toISOString()
  };
  await appendJsonl(claimsPath(), record);

  return {
    ok: true,
    command: "claim",
    txHash,
    status: receipt.status,
    record
  };
}

async function executePurchase(config: RuntimeConfig, state: LotteryState, dateKey: string, adHoc: boolean) {
  const account = requireAccount(config);
  const publicClient = createBasePublicClient(config);
  const drawing = await getCurrentDrawing(config);
  const ticketCount = requireTicketCount(state);
  const spend = drawing.raw.ticketPrice * BigInt(ticketCount);
  const referrers = [state.referrer || config.referrer || DEFAULT_REFERRER];
  const referralSplit = [10_000n];
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(config.rpcUrl)
  });

  const simulation =
    state.mode === "manual"
      ? await publicClient.simulateContract({
          account,
          address: JACKPOT,
          abi: jackpotAbi,
          functionName: "buyTickets",
          args: [toContractTickets(state.manualTickets || []), account.address, referrers, referralSplit, SOURCE as Hex]
        })
      : await publicClient.simulateContract({
          account,
          address: JACKPOT_RANDOM_TICKET_BUYER,
          abi: randomTicketBuyerAbi,
          functionName: "buyTickets",
          args: [BigInt(ticketCount), account.address, referrers, referralSplit, SOURCE as Hex]
        });

  const txHash = await walletClient.writeContract(simulation.request as never);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  const ticketIds = (simulation.result as bigint[]).map(String);
  const record: PurchaseRecord = {
    type: "purchase",
    mode: state.mode || "random",
    dateKey,
    drawingId: drawing.drawingId,
    ticketCount,
    ticketIds,
    spentUsdc: usdc(spend),
    txHash,
    timestamp: new Date().toISOString()
  };
  await appendJsonl(purchasesPath(), record);
  await writeState({
    ...state,
    setupComplete: true,
    lastAttemptDate: dateKey,
    lastSuccessDate: adHoc ? state.lastSuccessDate : dateKey,
    lastSuccessTxHash: txHash
  });

  return {
    ok: true,
    command: adHoc ? "buy-now" : "buy-daily",
    txHash,
    status: receipt.status,
    purchase: record
  };
}

async function purchasePrecheck(config: RuntimeConfig, state: LotteryState, dateKey: string, adHoc: boolean) {
  const account = requireAccount(config);
  const publicClient = createBasePublicClient(config);
  const drawing = await getCurrentDrawing(config);
  const ticketCount = state.ticketCount || 0;
  const mode = state.mode;
  const spenderName: Spender = mode === "manual" ? "jackpot" : "random";
  const spender = spenderAddress(spenderName);
  const spend = drawing.raw.ticketPrice * BigInt(ticketCount || 0);

  if (!state.setupComplete || !ticketCount || !mode) {
    return skipped("setup-incomplete", "Daily purchase is not configured yet", { updateAttempt: false });
  }
  if (!adHoc && state.paused) {
    return skipped("paused", "Daily purchases are paused", { updateAttempt: false });
  }
  if (!adHoc && state.lastSuccessDate === dateKey) {
    return skipped("already-bought-today", "Daily purchase already succeeded for this Mountain-time date", {
      updateAttempt: false,
      txHash: state.lastSuccessTxHash
    });
  }
  if (drawing.raw.jackpotLock) {
    return skipped("jackpot-locked", "Megapot is currently locked for drawing", { updateAttempt: true });
  }
  if (Number(drawing.raw.drawingTime) <= Math.floor(Date.now() / 1000)) {
    return skipped("drawing-time-passed", "Current drawing time has already passed", { updateAttempt: true });
  }
  if (mode === "manual") {
    if (!state.manualTickets || state.manualTickets.length !== ticketCount) {
      return skipped("manual-ticket-mismatch", "Manual ticket count does not match configured tickets", { updateAttempt: true });
    }
    for (const ticket of state.manualTickets) {
      validateTicket(ticket, drawing.raw);
    }
  }

  const gas = await publicClient.getBalance({ address: account.address });
  const balance = await readUsdcBalance(config, account.address);
  const allowance = await readAllowance(config, account.address, spender);

  if (gas === 0n) {
    return skipped("insufficient-gas", "Wallet has no Base ETH for gas", { updateAttempt: true, walletAddress: account.address });
  }
  if (balance < spend) {
    return skipped("insufficient-usdc", "Wallet has insufficient Base USDC", {
      updateAttempt: true,
      walletAddress: account.address,
      requiredUsdc: usdc(spend),
      balanceUsdc: usdc(balance)
    });
  }
  if (allowance < spend) {
    return skipped("insufficient-allowance", "USDC allowance is too low for the configured purchase", {
      updateAttempt: true,
      spender: spenderName,
      spenderAddress: spender,
      requiredUsdc: usdc(spend),
      allowanceUsdc: usdc(allowance)
    });
  }

  return {
    ok: true,
    drawing,
    ticketCount,
    mode,
    spendUsdc: usdc(spend),
    walletAddress: account.address
  };
}

function skipped(reason: string, message: string, extra: Record<string, unknown>) {
  return {
    ok: false,
    skipped: true,
    reason,
    message,
    ...extra
  };
}

export async function getCurrentDrawing(config: RuntimeConfig) {
  const publicClient = createBasePublicClient(config);
  const drawingId = (await publicClient.readContract({
    address: JACKPOT,
    abi: jackpotAbi,
    functionName: "currentDrawingId"
  })) as bigint;
  const raw = (await publicClient.readContract({
    address: JACKPOT,
    abi: jackpotAbi,
    functionName: "getDrawingState",
    args: [drawingId]
  })) as DrawingState;

  return {
    drawingId: drawingId.toString(),
    prizePoolUsdc: usdc(raw.prizePool),
    ticketPriceUsdc: usdc(raw.ticketPrice),
    globalTicketsBought: raw.globalTicketsBought.toString(),
    drawingTimeUnix: raw.drawingTime.toString(),
    drawingTimeIso: new Date(Number(raw.drawingTime) * 1000).toISOString(),
    winningTicket: raw.winningTicket.toString(),
    ballMax: raw.ballMax,
    bonusballMax: raw.bonusballMax,
    jackpotLock: raw.jackpotLock,
    raw
  };
}

export async function readUsdcBalance(config: RuntimeConfig, owner: Address) {
  const publicClient = createBasePublicClient(config);
  return (await publicClient.readContract({
    address: BASE_USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner]
  })) as bigint;
}

export async function readAllowance(config: RuntimeConfig, owner: Address, spender: Address) {
  const publicClient = createBasePublicClient(config);
  return (await publicClient.readContract({
    address: BASE_USDC,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, spender]
  })) as bigint;
}

function requireAccount(config: RuntimeConfig) {
  const account = getWalletAccount(config);
  if (!account) {
    throw new Error("BASE_PRIVATE_KEY is missing. Add it through Pinata Secrets; never paste it into chat.");
  }
  return account;
}

function requireTicketCount(state: LotteryState) {
  if (!state.ticketCount || state.ticketCount < 1 || state.ticketCount > 10) {
    throw new Error("Configure ticket count from 1 to 10 first");
  }
  return state.ticketCount;
}

function validateTicket(ticket: Ticket, drawing: DrawingState) {
  if (ticket.normals.length !== 5) {
    throw new Error("Manual tickets require exactly 5 normal numbers");
  }
  const unique = new Set(ticket.normals);
  if (unique.size !== 5) {
    throw new Error("Manual ticket normal numbers must be unique");
  }
  for (const normal of ticket.normals) {
    if (!Number.isInteger(normal) || normal < 1 || normal > drawing.ballMax) {
      throw new Error(`Normal number ${normal} is outside 1-${drawing.ballMax}`);
    }
  }
  if (!Number.isInteger(ticket.bonusball) || ticket.bonusball < 1 || ticket.bonusball > drawing.bonusballMax) {
    throw new Error(`Bonusball ${ticket.bonusball} is outside 1-${drawing.bonusballMax}`);
  }
}

function toContractTickets(tickets: Ticket[]) {
  return tickets.map((ticket) => ({
    normals: ticket.normals,
    bonusball: ticket.bonusball
  }));
}

function parseUsdcString(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
