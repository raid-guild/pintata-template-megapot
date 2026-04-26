# HEARTBEAT.md — Daily Lottery Workflow

The daily scheduled task runs at `15:00 UTC`, intended to buy in the morning before the Megapot drawing around 11:00 to 11:10 AM MDT.

When the heartbeat runs:

1. Run `npm run cli -- status`.
2. If setup is incomplete, tell the user what is missing.
3. If daily buys are paused, report that no purchase was made.
4. If today's buy already ran, report the previous tx hash.
5. If active and funded, run `npm run cli -- buy-daily`.
6. Run `npm run cli -- results`.
7. Run `npm run cli -- history`.
8. Notify the user if there is a win, a claimable amount, low gas, low USDC, or missing allowance.

Never run approval or claim transactions from the heartbeat.
