# Bots — Personas on Paper Accounts

A **bot** is a persona bound to the Alpaca paper account it trades. Each bot gets its own
account (created under your existing Alpaca login) so their portfolios, positions, and
transactions stay cleanly separated — which is exactly what the dashboard will read from.

## Setup

1. In the Alpaca dashboard, create one **paper** account per bot and copy each account's
   API key/secret.
2. `cp .env.example .env` and paste the keys. Each persona maps to a pair of env vars by
   convention — persona `news-fader` → `SKYNET_BOT_NEWS_FADER_KEY` / `_SECRET`. `.env` is gitignored.

## How a bot trades

The layering keeps everything testable and swappable:

```
Persona.decide()  →  TradingEngine  →  BrokerPort
                                          ├── InMemoryBroker        (tests, local sim)
                                          └── AlpacaBrokerAdapter    (live paper account)
```

- `bots/bot-registry.ts` — `loadBots(personas, env)` builds a bot for every persona whose
  credentials are present and reports the rest as `missing`. Pure over its `env` argument.
- `bots/bot-broker.ts` — `createBotBroker(bot)` assembles transport → client → adapter and
  returns a live `BrokerPort` the engine can drive.
- `alpaca/trading-transport.ts` — the network seam (key/secret header auth); fake it in tests.
- `alpaca/alpaca-trading-client.ts` — typed `GET /v2/account`, `GET /v2/positions`,
  `POST /v2/orders`.
- `adapters/alpaca-broker-adapter.ts` — maps Alpaca's string-typed payloads to the domain
  `Portfolio` and submits market orders.

Because the engine depends only on `BrokerPort`, the exact same engine, personas, and risk
guards run against the in-memory simulator or a live paper account with no code change.

## Where this stands (updated 2026-09-22 — the roadmap below was stale)

Both items this section used to list as future work are shipped:

- **Run loop** — `src/scripts/run-autonomous.ts` schedules decision cycles per bot and persists
  each `CycleReport`.
- **Dashboard** — `src/scripts/serve-dashboard.ts` and the `/u/:id` per-account views (activity,
  decisions, pulse) are a centralized read on every bot's account.

Doctrine — a persona's own coded rules, graded honestly against the code and the tape — lives in a
top-level `docs/BOTS-<PERSONA>.md` dossier per bot (see `docs/BOTS-SAURON.md` for the first one),
scanned by `scripts/doctrine-scan.mjs` (issue #2287, PR 8) for stale, unresolved doctrine.
