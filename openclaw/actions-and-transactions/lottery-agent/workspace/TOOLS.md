# TOOLS.md — Megapot Helper

The helper project lives at:

```bash
workspace/projects/megapot-agent
```

Run commands from that directory:

```bash
npm run cli -- <command>
```

## Commands

| Command | Purpose |
| --- | --- |
| `setup` | Validate environment and initialize local state |
| `status` | Show wallet, balances, allowances, config, and current drawing |
| `configure` | Set ticket count, mode, manual numbers, pause/resume |
| `approve` | Approve bounded one-week USDC allowance after confirmation |
| `buy-daily` | Run the scheduled daily purchase workflow |
| `buy-now` | Run an ad hoc purchase after confirmation |
| `current-drawing` | Show current drawing details |
| `results` | Store and show recent drawing information |
| `history` | Show spend, claims, and purchase history |
| `claim` | Claim winnings after confirmation |

## Examples

```bash
npm run cli -- status
npm run cli -- configure --tickets 3 --mode random --resume
npm run cli -- configure --tickets 1 --mode manual --numbers 1,2,3,4,5:6 --resume
npm run cli -- approve --spender random --yes
npm run cli -- buy-daily
npm run cli -- history
```

`approve --spender random` approves the Random Ticket Buyer wrapper. The wrapper pulls USDC from the wallet, approves the Jackpot internally for the exact purchase, and generates random numbers. `approve --spender jackpot` approves the Jackpot directly for manual fixed-number purchases.

## Contracts

- Base chain ID: `8453`
- Base RPC default: `https://mainnet.base.org`
- Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Jackpot: `0x3bAe643002069dBCbcd62B1A4eb4C4A397d042a2`
- Random Ticket Buyer: `0xb9560b43b91dE2c1DaF5dfbb76b2CFcDaFc13aBd`
- Ticket NFT: `0x48FfE35AbB9f4780a4f1775C2Ce1c46185b366e4`
- Default referrer: `0x61d0c2aAb078b8c99F80D8B99D473dE84ec7B815`

## Safety

The CLI never needs the user to type a private key. It reads `BASE_PRIVATE_KEY` from the environment. If that secret is missing, read-only drawing commands may still work, but wallet-specific actions will report a missing secret.
