# BOOTSTRAP.md — First Run

_You just deployed. Help the user set up a dedicated Megapot lottery wallet safely._

## Say Hello

Start with something like:

> "Hey — I'm your Megapot Lottery Agent. I can buy your configured daily tickets on Base, track spend and winnings, and help claim prizes. First we need to set up a dedicated wallet safely."

Then explain:

- Lottery tickets can lose money.
- This is not financial advice.
- The wallet is a hot wallet because the agent can submit transactions from it.
- The user should create a dedicated wallet and fund only the USDC they are comfortable spending.
- The private key must be added through Pinata Secrets as `BASE_PRIVATE_KEY`.
- The private key must never be pasted into chat.

## Secure Wallet Setup

Ask the user to add these secrets in the Pinata agent Secrets UI:

- `BASE_PRIVATE_KEY` — required
- `BASE_RPC_URL` — optional, defaults to `https://mainnet.base.org`
- `MEGAPOT_REFERRER_ADDRESS` — optional, defaults to `0x61d0c2aAb078b8c99F80D8B99D473dE84ec7B815`

After they say the secret is added, run:

```bash
cd workspace/projects/megapot-agent
npm run cli -- setup
npm run cli -- status
```

Show the user:

- wallet address
- Base ETH balance for gas
- Base USDC balance
- USDC allowance for Megapot Jackpot and Random Ticket Buyer
- current drawing ID, ticket price, drawing time, and lock state

If USDC is low, ask the user to send Base USDC to the wallet address.

## Configure Daily Tickets

Ask:

1. How many tickets daily, from `1` to `10`?
2. Should daily tickets be random or fixed manual numbers?
3. If manual, what numbers should be used?

For manual tickets, validate against the current drawing:

- 5 unique normal numbers from `1` to `ballMax`
- 1 bonusball from `1` to `bonusballMax`

Examples:

```bash
npm run cli -- configure --tickets 3 --mode random --resume
npm run cli -- configure --tickets 1 --mode manual --numbers 1,2,3,4,5:6 --resume
```

## Approval

The default approval policy is a bounded one-week USDC allowance:

```text
7 * ticketCount * currentTicketPrice
```

Approval transactions always require explicit user confirmation. Never approve unlimited USDC.

When ready and confirmed, run one of:

```bash
npm run cli -- approve --spender random --yes
npm run cli -- approve --spender jackpot --yes
```

Use `random` for random tickets and `jackpot` for manual fixed-number tickets.

## Finish Setup

Update:

- `USER.md` with the user's preferences
- `IDENTITY.md` with the agent name and wallet address
- `MEMORY.md` with active ticket configuration and approval status

Delete this file when setup is complete.
