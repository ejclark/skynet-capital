# Observatory volume

**Technology:** Fly volume skynet_data mounted at /data; JSON files (src/storage/json-file-store.ts), JSONL per-key stores (src/storage/jsonl-store.ts), AES-256-GCM envelopes keyed by SKYNET_STORE_SECRET (src/storage/secure-envelope.ts), one node:sqlite decisions.db

**Responsibility:** Every durable member-facing record: participants.json (credentials, encrypted), allowlist.json, bot-controls.json, activity/ (trade activity ledger), feedback-log/, companion-message-log/, order-audit/, alert-dismissals/, owner-links.json, progression.json, ladder-progress/, playbook-subscriptions.json, history/ (equity samples), insights/ (insight JSONL + the app-side replicated decisions.db).

**Code roots:** `src/storage` · `src/participants/participant-store.ts` · `src/server/auth/allowlist-store.ts` · `src/server/bot-controls-store.ts` · `src/server/subscription-store.ts` · `src/server/council-store.ts` · `src/server/feedback-log.ts` · `src/server/companion-message-log.ts` · `src/server/order-audit-log.ts` · `src/server/owner-link-store.ts` · `src/server/progression-store.ts` · `src/server/ladder-progress-log.ts` · `src/observatory/activity-store.ts` · `src/observatory/history-store.ts` · `src/adapters/jsonl-alert-dismissals.ts` · `src/autonomous/jsonl-insight-store.ts` · `src/runtime/volume-guard.ts`

**Entrypoints:** `fly.toml [env] SKYNET_*_STORE/_DIR/_FILE → /data/…` · `fly.toml [mounts] skynet_data → /data`

**Grounding:** fly.toml pins every store path; src/runtime/volume-guard.ts lists PERSISTED_STORES; tests/arch/volume-persistence.spec.ts fails CI if a new `data/…` default is not pinned (EPHEMERAL exception: SKYNET_COMMUNITY_PROGRESSION_FILE); src/scripts/dashboard-insights-bridge.ts opens join(SKYNET_INSIGHTS_DIR, 'decisions.db').

**Refuter's verdict:** grounded — Keep the element as drawn and add three things. First, council.json: a sibling of bot-controls.json, derived by councilFilePathFrom, with no env var. Second, iv-history/: SKYNET_IV_HISTORY_DIR, which has no default, so t

## Where it sits

| From | To | What | How | Refuter |
|---|---|---|---|---|
| api | appvol | Reads and writes every durable store | node:fs JSON/JSONL, AES-256-GCM envelope, node:sqlite | grounded — Relabel the edge as: "Reads/writes all volume-pinned stores (JSON/JSONL files plus SQLite decisions.db under /data; bots-app writes arrive via the :8788 insight bridge)." Add a note that community-progression claim-state |
