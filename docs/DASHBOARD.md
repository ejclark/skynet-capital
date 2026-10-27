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

No workflow or routine runs that job (`.github/workflows/`, `docs/ROUTINES.md`); the view that
updates as positions change is the live server below. Nothing on the page is live-fetched; the
page is always a freshly-rendered snapshot.

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
Fills (every account's trade_updates) ────┼─▶ ObservatoryHub.apply(event)
                                          │      └─ reduceObservatory (pure)
                                          │            │ on change
   browsers ◀── SSE (/events) ◀───────────┴────────────┘  numbered patch + push
```

- The hub folds each event through the pure reducer and drives one server-wide, seq-numbered
  patch channel; each connected browser gets over SSE the ops its own view implies
  (`src/server/board-patch-routes.ts`) and applies them in place — sub-second, no polling. A gap
  in the seqs, or a change a patch cannot express, re-reads `/api/board`.
- **Access:** localhost by default. Set `SKYNET_DASHBOARD_PASSWORD` and every request needs
  `?key=<password>`. Keys never reach the browser — only computed numbers do. Put it behind
  HTTPS (a tunnel or a deployed host) before sharing beyond your machine.
- **Realtime sources:** every account's Alpaca `trade_updates` stream pushes fills the
  instant they execute (manual or bot), and the market-data stream pushes price ticks for
  held symbols. Both flow through the same hub → SSE path.

## The account page — one account, a section per route

`/u` (bare) redirects to Settings → Account (`/app/settings?section=account`,
`src/server/legacy-redirects.ts`), the list of the accounts the signed-in email owns
(`Participant.ownerEmail`).

`/u/:id` is the page for **any** account, bot or human — reached from the Leaderboard and Activity,
and never folded into the Profile page (Eric, #2321: "Profile verbiage is user-centric. Leaderboards
that include other users belong outside of profile"; #3345/#3350: Accounts is self-scoped). It is a
shell React route (`app/src/routes/u.$id.*.tsx`) with its own head (`app/src/shell/account-head.tsx`,
#3807 slice 2d): the account's name, its kind chip and the SIM pill, then a section switch — one
nested route per section:

| Section | URL | Question it answers | Shown for |
|---|---|---|---|
| Overview | `/u/:id` | who is this, at a glance — tiles, the character card, the blotter | every account |
| Ledger | `/u/:id/ledger` | what did it actually do? — every order, with its reasons | every account |
| Pulse | `/u/:id/pulse` | how is it doing over time? — equity curve, streaks, weekly P/L | every account |
| Playbooks | `/u/:id/playbooks` | is the bot checking the market, and what is each of its playbooks doing? | bots |
| Thesis | `/u/:id/thesis` | what is its standing call, and is it working? | bots |
| Settings | `/settings` | (the viewer's own account settings) | only your own account |

The Playbooks section reads what the Profile page's Playbooks reads, at an address named for it
(#3687, #5073); a saved `/u/:id/decisions` link redirects there with the check log open, and a saved
`/u/:id/activity` link lands on Ledger (#5281). The Playbook Store itself lives on R&D → Playbooks.
Old `?tab=` links redirect to their section (`src/server/legacy-redirects.ts`); the word "desk" is
retired from member-facing copy (#3345).

### Acting on a position (your own accounts only)

**Ownership decides the write controls** (#3807 slice 2d). Reads are public inside the invite gate
by design, but the server refuses any order on an account the requester does not own
(`src/server/account-identity-gate.ts`: "You can only trade your own account."). So on an account
the viewer does not own, the blotter renders no Close, Close this buy or Roll and no New trade card —
one plain line, "You can trade only your own accounts", sits beside the blotter; Guidance (a read)
stays. The check is the viewer's owned list (`app/src/live/settings.ts`, `ownsAccount`), never a
new server read. A `/trade?desk=<not yours>` link opens the viewer's own account with one line at
the top of the ticket: "Showing your account — <name> is not yours to trade".

On your own account, Close (partial or full) and the New trade ticket both review before sending —
estimated cost/proceeds, cash after, position after — and send nothing until an explicit confirm.
The confirm re-reads the live account and re-runs the same rules server-side, so a position that
moved between review and confirm is refused rather than sent.

Member-initiated trading needs no switch — it's on the moment OAuth is configured (Eric's ruling,
2026-08-21, #466: no separate kill switch). Without a signed-in identity there is no account to
match an order to, so orders are refused; once a member's account carries an owner link
(`Participant.ownerEmail`, stamped from their session by `POST /api/join`,
`src/server/join-api-routes.ts`), they may trade it.

Pictures: `npm run build --prefix app && npx tsx scripts/shoot/desk.mjs` (phone then desktop, as
another member).

## Design

The renderer (`src/observatory/standings-view.ts`) is a pure `DashboardData → HTML` function,
so the exact layout is unit-tested and reproducible. Trading-terminal treatment: dark-first
and theme-aware, monospace tabular figures, semantic green/red for P/L kept separate from
the teal brand accent, BOT·persona vs HUMAN chips, live/error status dots.

## Data flow

```
loadParticipants(env)  →  buildDashboardData (reads each Alpaca account, in parallel)
                            →  renderStandingsDocument  →  dist/dashboard.html  →  Artifact
```
