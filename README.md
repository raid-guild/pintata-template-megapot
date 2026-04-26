# Lottery Agent

Lottery Agent is a Megapot assistant for Base. It helps a user configure a dedicated wallet, monitor Base ETH and USDC, buy daily Megapot tickets, track spend and winnings, answer drawing questions, and claim winnings after explicit confirmation.

## What It Does

- Securely guides the user to add a dedicated wallet private key through Pinata Secrets
- Checks Base ETH, Base USDC, and USDC allowance
- Configures daily ticket buys from 1 to 10 tickets
- Supports random tickets through `JackpotRandomTicketBuyer.buyTickets`
- Supports fixed manual numbers through `Jackpot.buyTickets`
- Tracks purchase history, total spend, claims, and skipped runs
- Pauses and resumes the daily purchase schedule on request
- Checks current and previous Megapot drawings
- Claims winnings only after explicit user confirmation

## Required Setup

Use a dedicated wallet. Do not use a primary wallet or a wallet holding unrelated funds.

Required secret:

- `BASE_PRIVATE_KEY`: private key for the dedicated Base wallet

Optional secrets:

- `BASE_RPC_URL`: Base mainnet RPC URL. Defaults to `https://mainnet.base.org`
- `MEGAPOT_REFERRER_ADDRESS`: referral address. Defaults to Raid Guild's configured Megapot referrer

Never paste a private key into chat. Add it only through Pinata Secrets.

## Example Prompts

> Set up my lottery wallet and show my Base USDC balance.

> Configure 3 random Megapot tickets daily.

> Pause daily ticket purchases.

> Show my purchase history and net spend.

> Check the current drawing.

> Claim my winnings.

## Contracts

- Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Megapot Jackpot: `0x3bAe643002069dBCbcd62B1A4eb4C4A397d042a2`
- Megapot Random Ticket Buyer: `0xb9560b43b91dE2c1DaF5dfbb76b2CFcDaFc13aBd`
- Megapot Ticket NFT: `0x48FfE35AbB9f4780a4f1775C2Ce1c46185b366e4`

Lottery Agent uses bounded one-week USDC approvals by default and never approves unlimited USDC.
