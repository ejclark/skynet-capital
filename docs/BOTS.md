# Bots — Personas on Paper Accounts

A **bot** is a persona bound to the Alpaca paper account it trades. Each bot gets its own
account (created under your existing Alpaca login) so their portfolios, positions, and
transactions stay cleanly separated — which is exactly what the dashboard reads from.

## Setup

1. In the Alpaca dashboard, create one **paper** account per bot and copy each account's
   API key/secret.
2. `cp .env.example .env` and paste the keys. Each persona maps to a pair of env vars by
   convention — persona `news-fader` → `SKYNET_BOT_NEWS_FADER_KEY` / `_SECRET`. `.env` is gitignored.
   A persona with no pair of its own borrows the shared `SKYNET_BOT_KEY` / `SKYNET_BOT_SECRET`
   (the warm-up shortcut) — one seat only; if several would borrow it, none do.

## How a bot trades

The layering keeps everything testable and swappable:

```
Persona.decide()  →  TradingEngine  →  BrokerPort
                                          ├── InMemoryBroker        (tests, local sim)
                                          └── AlpacaBrokerAdapter    (live paper account)
```

- `bots/bot-registry.ts` — `loadBots(personas, env)` builds a bot for every persona whose
  credentials are present, seats at most one persona on the shared pair (`sharedAccount`), and
  reports the rest as `missing`. Pure over its `env` argument.
- `bots/bot-broker.ts` — `createBotBroker(bot)` assembles transport → client → adapter and
  returns a live `BrokerPort` the engine can drive.
- `alpaca/trading-transport.ts` — the network seam (key/secret header auth); fake it in tests.
- `alpaca/alpaca-trading-client.ts` — typed `GET /v2/account`, `GET /v2/positions`,
  `POST /v2/orders`.
- `adapters/alpaca-broker-adapter.ts` — maps Alpaca's string-typed payloads to the domain
  `Portfolio` and submits market orders. A result is `filled` only on a fill the broker
  confirmed; an order it took but never confirmed (queued after hours, or slower than the
  sub-second poll) reads `working` (#4655).

Because the engine depends only on `BrokerPort`, the exact same engine, personas, and risk
guards run against the in-memory simulator or a live paper account with no code change.

## Run loop and dashboard

- **Run loop** — `src/scripts/run-autonomous.ts` schedules decision cycles per bot and persists
  each `CycleReport`.
- **Dashboard** — `src/scripts/serve-dashboard.ts` and the `/u/:id` per-account views (activity,
  decisions, pulse) are a centralized read on every bot's account.

Doctrine — a persona's own coded rules, graded honestly against the code and the tape — lives in a
top-level `docs/BOTS-<PERSONA>.md` dossier per bot (see `docs/BOTS-SAURON.md` for the first one),
scanned by `scripts/doctrine-scan.mjs` (issue #2287, PR 8) for stale, unresolved doctrine.
