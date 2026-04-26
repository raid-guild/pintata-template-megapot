import { createPublicClient, http, getAddress, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { DEFAULT_BASE_RPC_URL, DEFAULT_REFERRER } from "./contracts.js";

export type RuntimeConfig = {
  rpcUrl: string;
  referrer: Address;
  privateKey?: `0x${string}`;
};

export function loadConfig(): RuntimeConfig {
  const rpcUrl = process.env.BASE_RPC_URL?.trim() || DEFAULT_BASE_RPC_URL;
  const referrerInput = process.env.MEGAPOT_REFERRER_ADDRESS?.trim() || DEFAULT_REFERRER;
  if (!isAddress(referrerInput)) {
    throw new Error("MEGAPOT_REFERRER_ADDRESS is not a valid EVM address");
  }

  const rawPrivateKey = process.env.BASE_PRIVATE_KEY?.trim();
  const privateKey = rawPrivateKey
    ? rawPrivateKey.startsWith("0x")
      ? rawPrivateKey
      : `0x${rawPrivateKey}`
    : undefined;

  if (privateKey && !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("BASE_PRIVATE_KEY must be a 32-byte hex private key");
  }

  return {
    rpcUrl,
    referrer: getAddress(referrerInput),
    privateKey: privateKey as `0x${string}` | undefined
  };
}

export function createBasePublicClient(config: RuntimeConfig) {
  return createPublicClient({
    chain: base,
    transport: http(config.rpcUrl)
  });
}

export function getWalletAccount(config: RuntimeConfig) {
  if (!config.privateKey) {
    return undefined;
  }
  return privateKeyToAccount(config.privateKey);
}
