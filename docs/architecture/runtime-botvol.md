# Bots volume

**Technology:** Fly volume skynet_bots_data at /data; node:sqlite DatabaseSync (bots-state.db current-state tables + a sibling append-only decision journal via decisionDbPathFrom), JSONL audit, health.json

**Responsibility:** What must survive a bots redeploy: momentum and sentiment windows, per-persona cooldown clocks, the beta scout's day state, the decision journal (one row per raw intent, retrospectives, funnel), the JSONL audit backstop under SKYNET_AUDIT_DIR, and the process's own health stamp (running GIT_SHA, bridge verdict, last controls poll).

**Code roots:** `src/autonomous/bots-state-db.ts` · `src/autonomous/decision-db.ts` · `src/autonomous/decision-db-rows.ts` · `src/autonomous/decision-db-migration.ts` · `src/autonomous/jsonl-audit-store.ts` · `src/autonomous/bots-health-file.ts`

**Entrypoints:** `fly.bots.toml [env] SKYNET_BOTS_DB_PATH=/data/bots-state.db, SKYNET_AUDIT_DIR=/data/audit, SKYNET_BOTS_HEALTH_PATH=/data/health.json` · `fly.bots.toml [mounts] skynet_bots_data → /data`

**Grounding:** src/scripts/autonomous-live-wiring.ts seedBotsState/seedDecisionDb (best-effort open), src/scripts/autonomous-sinks.ts auditStore/decisionSink; scripts/smoke-bots.sh reads /data/health.json over flyctl machine exec.

**Refuter's verdict:** grounded — Name the files explicitly: /data/bots-state.db (current-state upsert tables: momentum, sentiment, cooldowns, scout_state) and /data/decisions.db (append-only journal: decisions, intents, playbook_verdicts, market_signals

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| bots | botvol | Persists momentum/sentiment/cooldowns/scout state, decision journal, JSONL audit, health stamp | node:sqlite DatabaseSync, node:fs | grounded — Optional detail for the diagram label: the volume at /data holds bots-state.db (momentum/sentiment/cooldowns/scout_state), decisions.db (decision journal, a sibling path taken from SKYNET_BOTS_DB_PATH), audit/*.jsonl (tu |
