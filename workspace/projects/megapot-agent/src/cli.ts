#!/usr/bin/env node

import { isAddress } from "viem";
import { loadConfig } from "./config.js";
import {
  approve,
  buyDaily,
  buyNow,
  claim,
  configureState,
  currentDrawing,
  history,
  repairState,
  results,
  setup,
  status,
  type Spender
} from "./megapot.js";
import { json, fail } from "./reporting.js";
import type { Ticket } from "./state.js";

type Flags = Record<string, string | boolean>;

async function main() {
  const [command = "help", ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  const config = loadConfig();

  switch (command) {
    case "setup":
      json(await setup(config));
      return;
    case "status":
      json(await status(config));
      return;
    case "configure":
      json(
        await configureState(config, {
          ticketCount: getOptionalInt(flags, "tickets"),
          mode: getOptionalMode(flags),
          manualTickets: getOptionalTickets(flags),
          paused: getPauseState(flags)
        })
      );
      return;
    case "approve":
      json(
        await approve(config, getSpender(flags), {
          dryRun: Boolean(flags["dry-run"]),
          yes: Boolean(flags.yes)
        })
      );
      return;
    case "buy-daily":
      json(await buyDaily(config));
      return;
    case "buy-now":
      json(
        await buyNow(config, {
          dryRun: Boolean(flags["dry-run"]),
          yes: Boolean(flags.yes)
        })
      );
      return;
    case "current-drawing":
      json(await currentDrawing(config));
      return;
    case "results":
      json(await results(config));
      return;
    case "history":
      json(await history());
      return;
    case "repair-state":
      json(await repairState(config, {
        clearLastSuccess: Boolean(flags["clear-last-success"])
      }));
      return;
    case "claim":
      json(
        await claim(config, getTicketIds(flags), {
          dryRun: Boolean(flags["dry-run"]),
          yes: Boolean(flags.yes)
        })
      );
      return;
    case "help":
    default:
      json(help());
      return;
  }
}

function parseFlags(args: string[]): Flags {
  const flags: Flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const next = args[index + 1];
    if (!next || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      index += 1;
    }
  }
  return flags;
}

function getOptionalInt(flags: Flags, key: string) {
  if (flags[key] === undefined || typeof flags[key] === "boolean") {
    return undefined;
  }
  const value = Number(flags[key]);
  if (!Number.isInteger(value)) {
    throw new Error(`--${key} must be an integer`);
  }
  return value;
}

function getOptionalMode(flags: Flags) {
  if (flags.mode === undefined || typeof flags.mode === "boolean") {
    return undefined;
  }
  if (flags.mode !== "random" && flags.mode !== "manual") {
    throw new Error("--mode must be random or manual");
  }
  return flags.mode;
}

function getPauseState(flags: Flags) {
  if (flags.pause && flags.resume) {
    throw new Error("Use only one of --pause or --resume");
  }
  if (flags.pause) {
    return true;
  }
  if (flags.resume) {
    return false;
  }
  return undefined;
}

function getOptionalTickets(flags: Flags): Ticket[] | undefined {
  if (flags.numbers === undefined || typeof flags.numbers === "boolean") {
    return undefined;
  }
  return flags.numbers.split(";").map((rawTicket) => {
    const [normalsRaw, bonusRaw] = rawTicket.split(":");
    if (!normalsRaw || !bonusRaw) {
      throw new Error("--numbers must look like 1,2,3,4,5:6 or multiple tickets separated by semicolons");
    }
    return {
      normals: normalsRaw.split(",").map(parsePositiveInteger),
      bonusball: parsePositiveInteger(bonusRaw)
    };
  });
}

function parsePositiveInteger(raw: string) {
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid positive integer: ${raw}`);
  }
  return value;
}

function getSpender(flags: Flags): Spender {
  const spender = flags.spender;
  if (spender === "random" || spender === "jackpot") {
    return spender;
  }
  throw new Error("--spender must be random or jackpot");
}

function getTicketIds(flags: Flags) {
  const raw = flags["ticket-ids"];
  if (raw === undefined || typeof raw === "boolean") {
    return [];
  }
  return raw.split(",").map((value) => {
    if (!/^\d+$/.test(value.trim())) {
      throw new Error(`Invalid ticket ID: ${value}`);
    }
    return BigInt(value.trim());
  });
}

function help() {
  return {
    ok: true,
    commands: [
      "setup",
      "status",
      "configure --tickets 3 --mode random --resume",
      "configure --tickets 1 --mode manual --numbers 1,2,3,4,5:6 --resume",
      "approve --spender random --dry-run",
      "approve --spender random --yes",
      "buy-daily",
      "buy-now --dry-run",
      "buy-now --yes",
      "current-drawing",
      "results",
      "history",
      "repair-state --clear-last-success",
      "claim --ticket-ids 1,2,3 --dry-run",
      "claim --ticket-ids 1,2,3 --yes"
    ],
    notes: [
      "Private keys are read only from BASE_PRIVATE_KEY.",
      "Write commands that are not scheduled daily buys require --yes after user confirmation.",
      "Use a dedicated Base wallet funded only with USDC the user is comfortable spending."
    ]
  };
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Unknown error", error);
});
