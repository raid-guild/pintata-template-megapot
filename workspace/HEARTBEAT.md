# HEARTBEAT.md — Daily Lottery Workflow

The daily scheduled task runs at `15:00 UTC`, intended to buy in the morning before the Megapot drawing around 11:00 to 11:10 AM MDT.

When the heartbeat runs, use the helper's single heartbeat command:

```bash
cd workspace/projects/megapot-agent
npm run cli -- heartbeat
```

The heartbeat command runs status, buy-daily, results, and history once. It writes issue-dedupe state to `workspace/data/heartbeat-state.json`.

If the command returns `HEARTBEAT_OK`, do not message the user and do not rerun subcommands. If it returns `HEARTBEAT_ATTENTION`, summarize only the `notifications` array. Do not repeat `suppressedIssues`.

The heartbeat command only alerts if an issue is new, severity changes, details change, or the reminder cooldown has elapsed. It also prevents repeated same-day buy attempts after a failed daily purchase.

Never run approval or claim transactions from the heartbeat.
