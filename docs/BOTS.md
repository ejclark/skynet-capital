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

## Roadmap from here

- **Run loop** — schedule decision cycles per bot and persist each `CycleReport`.
- **Dashboard (Claude design)** — a centralized view of every bot's account: portfolio,
  positions, transactions. Humans can later link their own accounts into the same view.
