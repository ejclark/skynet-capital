# The Observatory Dashboard

A single, shared, read-only view of every participant's account — bots and humans side by
side. Equity, cash, and per-position unrealized P/L, with failed reads degrading to a
visible error state rather than blanking the page.

## Generate it from live accounts

```sh
set -a && source .env && set +a       # load participant credentials
npm run export:dashboard              # writes dist/dashboard.html
```

The output is a self-contained HTML file (no external assets). To make it the shared
dashboard "visible to all parties," publish `dist/dashboard.html` as a Claude Artifact.

## How it stays fresh ("auto-updating")

A browser artifact can't reach Alpaca directly (CSP + no keys in the browser, by design),
so freshness comes from re-generating and re-publishing:

1. A scheduled job reads the accounts (`export:dashboard`).
2. The same job re-publishes `dist/dashboard.html` to the **same** artifact URL.

Once the bots trade autonomously on that schedule, each run refreshes the dashboard — so
you watch it update as positions change. Nothing on the page is live-fetched; the page is
always a freshly-rendered snapshot.

## Realtime live server (no polling)

For a view that updates *itself* as accounts change, run the live server instead of
re-exporting:

```sh
set -a && source .env && set +a
npm run serve:dashboard
# open http://localhost:8787   (add ?key=<password> if SKYNET_DASHBOARD_PASSWORD is set)
```

How it works — everything meets at an in-memory `ObservatoryHub`:

```
Alpaca market-data stream (price ticks) ─┐
Engine fills (once trading is on) ────────┼─▶ ObservatoryHub.apply(event)
                                          │      └─ reduceObservatory (pure)
                                          │            │ on change
   browsers ◀── SSE (/events) ◀───────────┴────────────┘  re-render + push
```

- The hub folds each event through the pure reducer and pushes a freshly-rendered page
  body to every connected browser over SSE. The page swaps it in — sub-second, no polling.
- **Access:** localhost by default. Set `SKYNET_DASHBOARD_PASSWORD` and every request needs
  `?key=<password>`. Keys never reach the browser — only computed numbers do. Put it behind
  HTTPS (a tunnel or a deployed host) before sharing beyond your machine.
- **Realtime sources:** every account's Alpaca `trade_updates` stream pushes fills the
  instant they execute (manual or bot), and the market-data stream pushes price ticks for
  held symbols. Both flow through the same hub → SSE path.

## Design

The renderer (`observatory/render-dashboard.ts`) is a pure `DashboardData → HTML` function,
so the exact layout is unit-tested and reproducible. Trading-terminal treatment: dark-first
and theme-aware, monospace tabular figures, semantic green/red for P/L kept separate from
the teal brand accent, BOT·persona vs HUMAN chips, live/error status dots.

## Data flow

```
loadParticipants(env)  →  buildDashboardData (reads each Alpaca account, in parallel)
                            →  renderDashboardDocument  →  dist/dashboard.html  →  Artifact
```
