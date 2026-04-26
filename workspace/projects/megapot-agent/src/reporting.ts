import { formatUnits } from "viem";
import { safeStringify } from "./state.js";

export function usdc(amount: bigint) {
  return formatUnits(amount, 6);
}

export function eth(amount: bigint) {
  return formatUnits(amount, 18);
}

export function json(value: unknown) {
  process.stdout.write(`${safeStringify(value)}\n`);
}

export function fail(message: string, details?: unknown): never {
  json({
    ok: false,
    error: message,
    details
  });
  process.exit(1);
}
