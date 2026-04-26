import { parseAbi, type Address } from "viem";

export const BASE_CHAIN_ID = 8453;
export const DEFAULT_BASE_RPC_URL = "https://mainnet.base.org";

export const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const satisfies Address;
export const JACKPOT = "0x3bAe643002069dBCbcd62B1A4eb4C4A397d042a2" as const satisfies Address;
export const JACKPOT_RANDOM_TICKET_BUYER = "0xb9560b43b91dE2c1DaF5dfbb76b2CFcDaFc13aBd" as const satisfies Address;
export const JACKPOT_TICKET_NFT = "0x48FfE35AbB9f4780a4f1775C2Ce1c46185b366e4" as const satisfies Address;
export const DEFAULT_REFERRER = "0x61d0c2aAb078b8c99F80D8B99D473dE84ec7B815" as const satisfies Address;
export const SOURCE = "0x726169646775696c642d6c6f74746572792d6167656e74000000000000000000" as const;

export const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
]);

export const jackpotAbi = parseAbi([
  "function buyTickets((uint8[] normals,uint8 bonusball)[] tickets, address recipient, address[] referrers, uint256[] referralSplit, bytes32 source) returns (uint256[] ticketIds)",
  "function claimWinnings(uint256[] userTicketIds)",
  "function currentDrawingId() view returns (uint256)",
  "function getDrawingState(uint256 drawingId) view returns ((uint256 prizePool,uint256 ticketPrice,uint256 edgePerTicket,uint256 referralWinShare,uint256 referralFee,uint256 globalTicketsBought,uint256 lpEarnings,uint256 drawingTime,uint256 winningTicket,uint8 ballMax,uint8 bonusballMax,address payoutCalculator,bool jackpotLock))",
  "function referralFee() view returns (uint256)",
  "function referralFees(address referrer) view returns (uint256)",
  "function referralWinShare() view returns (uint256)",
  "function ticketPrice() view returns (uint256)"
]);

export const randomTicketBuyerAbi = parseAbi([
  "function buyTickets(uint256 count, address recipient, address[] referrers, uint256[] referralSplitBps, bytes32 source) returns (uint256[] ticketIds)",
  "function jackpot() view returns (address)",
  "function nonce() view returns (uint256)",
  "function usdc() view returns (address)"
]);
