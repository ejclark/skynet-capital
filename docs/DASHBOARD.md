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

## The player desk — three tabs on one account

`/u/:id` is a member's desk. A `?tab=` param picks the view (plain links, no JS, shareable):

| Tab | URL | Question it answers | Goes blank when |
|---|---|---|---|
| Overview | `/u/:id` | who is this, at a glance | — |
| Active | `?tab=positions` | what am I in right now? | flat |
| Performance | `?tab=performance` | how am I doing? | see below — each section answers separately |

Performance folds what used to be three separate tabs (History, Analysis, Metrics) into one page,
but keeps them **honestly separate underneath**: closed round trips, trade-behavior stats, and the
equity curve are three different inputs that go blank for three different reasons, so each section
renders its own empty state from its own data — never one blended gate that hides a real equity
curve just because nothing's closed yet, or vice versa. Round trips are fills matched
first-in-first-out by `src/trading/round-trips.ts`; the raw order ledger folds away beneath the
round-trips table as receipts. Design rationale and the platform research behind it:
[`docs/research/trading-desk-ux.md`](research/trading-desk-ux.md).

### Acting on a position (owner-linked accounts only)

The Active tab carries a per-row **Sell** (partial or full) and a **New trade** ticket. Both POST to
`/trade`, which renders a **review screen** — estimated cost/proceeds, cash after, position after —
and sends nothing until an explicit confirm. The confirm re-reads the live account and re-runs the
same rules server-side before submitting, so a position that moved between review and confirm is
refused rather than sent.

Member-initiated trading needs no switch — it's on the moment OAuth is configured (Eric's ruling,
2026-08-21, #466: no separate kill switch). Without a signed-in identity there is no account to
match an order to, so orders are refused; once a member's account carries an owner link
(`Participant.ownerEmail`, stamped from their session at `/add`), they may trade it.

Rolling renders as a disabled control with its real reason: this account path trades shares, so there
is no options leg to roll (see the plan for what enabling it would take).

Eyeball the whole desk without a server or a broker:

```sh
node scripts/shoot-desk.mjs [outdir]   # renders the five surfaces + screenshots them
```

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
