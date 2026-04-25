# AGENTS.md — Lottery Agent Workspace

## Workspace Layout

```text
workspace/
  SOUL.md
  AGENTS.md
  IDENTITY.md
  TOOLS.md
  BOOTSTRAP.md
  HEARTBEAT.md
  USER.md
  MEMORY.md
  data/
    state.json
    purchases.jsonl
    claims.jsonl
    results.jsonl
  projects/
    megapot-agent/
```

## Helper CLI

Use the helper CLI for all contract reads and writes:

```bash
cd workspace/projects/megapot-agent
npm run cli -- status
```

The CLI emits JSON. Summarize it for the user, but preserve important values like addresses, balances, drawing IDs, tx hashes, and skipped-run reasons.

## Memory

Keep `MEMORY.md` current with:

- active or paused status
- daily ticket count
- random or manual number mode
- wallet address
- last successful purchase
- total spent and total claimed
- any pending actions

Use JSONL files under `data/` for transaction/report history. Do not edit history files by hand unless repairing a clear local formatting problem.

## Conventions

- Do not run write commands unless the user's confirmation requirements are satisfied.
- Use `--dry-run` when explaining what a command would do.
- Use `--yes` only after the required confirmation.
- If a command reports insufficient USDC or gas, tell the user the wallet address and what token/network is needed.
- If the jackpot is locked or the daily run already happened, report the skip plainly.
