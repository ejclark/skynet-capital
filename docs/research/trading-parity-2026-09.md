# Research: trading-experience parity — Robinhood · Fidelity · thinkorswim vs Skynet Capital

**Question:** members find the trading surface cobbled together and the journey combinatorics
(stock / option / spread × buy / sell × market / limit / stop × pending / cancel / modify × close / roll)
full of gaps that stop a trade being executed. What do Robinhood, Fidelity and Schwab thinkorswim offer
across the whole trading journey, what do we have and not have, and — because Robinhood's engagement
design overlaps our own "fun is the flywheel" intent — which of its mechanics belong on a *paper*
school and which train habits a real-money endgame must unlearn?

**Date:** 2026-09-21 · **For:** the trading-parity plan issue (Step 3 of this study) and the four lo-fi
shapes it commissions · **Method:** competitive usability inventory, expert-review form
(`.claude/skills/teardown/SKILL.md`; NN/g's 2–4-reference width). Robinhood and thinkorswim rows are
doc-sourced (help centers, product pages, newsroom, regulators, academic record); Fidelity reuses the
in-house redacted frames of 2026-09-05. Frames never enter this repo; the private artifacts hold them.
"Ours today" is read from the code at the commit named, never remembered.

**Eric's framing (2026-09-21):** "Think about ideal designs, don't constrain/limit designs based off the
current design." and "Robinhood gamifies their app with a casino-like experience, which overlaps with
our intended experience. This is bad for real money, but good for learning on a paper-trade platform…
it's worth interrogating their designs in great detail." Section 3 (the audit) therefore *costs* the
plan; it does not bound the designs.

---

## 0. Call sheet

_Filled after §1–§2 — see below._

---

## 1. Journey inventory — Robinhood · Fidelity · thinkorswim

_Filled from the research pass — see below._

---

## 2. Robinhood engagement mechanics — the interrogation

_Filled from the research pass — see below._

---

## 3. Skynet Capital today — the audit (read at `origin/main` f9cb695, 2026-09-21)

The audit is the "ours today" column the cross-examination needs. It is the *cost* side of the parity
plan, not a constraint on the designs.

### 3.1 The journeys, as the code stands

| Journey | Status | Where |
|---|---|---|
| Pick an account to trade | exists (hidden with one account) | `app/src/routes/trade.tsx` `AccountField` |
| Search a symbol with autocomplete | exists — 2 tiers, debounced, in-flow listbox | `app/src/shell/symbol-field.tsx` |
| See a quote before ordering | exists — last / Δ / Δ%, 15 s stale, no as-of stamp | `app/src/shell/quote-header.tsx` |
| See a chart while ticketing | partial — the chart is a *section* that replaces the ticket | `trade.tsx` `?section=chart`, `app/src/shell/chart-section.tsx` |
| Buy / sell stock at market | exists | `app/src/shell/trade-gate.tsx` |
| Buy / sell stock at a limit or stop | exists | `app/src/live/ticket.ts:12`, `trade-gate.tsx:268-298` |
| Stop-limit / trailing stop / bracket (OCO, OTO) | missing | `TicketOrderType` is `market \| limit \| stop` |
| Choose time in force | missing — server hard-codes market→day, limit/stop→gtc and never says so | `src/alpaca/alpaca-trading-client.ts:221` |
| Extended hours / 24-hour session | missing | no `extended_hours` anywhere |
| Dollar-based (notional) or fractional orders | missing — refused ("Whole shares only") | `src/trading/order-ticket.ts` `validateQuantity` |
| Read an options chain | exists — straddle: calls · strike · puts; OI / Vol / Δ Γ Θ Vega scroll out | `app/src/shell/straddle-view.tsx` |
| See *all* expirations | partial — ≤20, from one unpaginated 1000-contract page; LEAPS unreachable on busy names | `src/alpaca/alpaca-options-client.ts:177-186` (`limit = 20`) |
| Greeks on every strike | partial — vendor-only; silently absent when the snapshot call fails, the strike has no snapshot, or a greek isn't finite; no per-row reason reaches the client | `alpaca-options-client.ts` `mergeQuotes` / `greeksOf` |
| `$0.00` bid shown honestly | missing — a zero bid is dropped (`num()` requires `> 0`), the row loses its mid | `alpaca-options-client.ts:101-104` |
| Implied volatility / probability on the chain | missing on the desk (IV is solved only in the research recommender) | `src/options/pricing.ts`, `src/adapters/alpaca-recommend-chain.ts` |
| Tap a chain cell to fill the ticket | exists — row = strike + mid-seeded limit; call/put cell also switches side when the rung is unlocked | `app/src/shell/option-gate.tsx:189-213` |
| Type a strike by hand | exists — number input with a `<datalist>` of chain strikes | `app/src/shell/option-fields.tsx:108-150` |
| Trade a single option leg (201/202/301/302) | exists — limit / market | `option-gate.tsx`, `src/trading/option-ticket.ts` |
| Greeks / probability on the order being placed | missing — chain-only, never on the ticket or preview | `app/src/live/options.ts:76-98` |
| Max profit / max loss / breakeven | exists (single leg and spread preview) | `app/src/shell/option-preview.tsx:32-52`, `draft-order-builder.tsx:78-102` |
| Payoff diagram | missing | — |
| Review then confirm, disarm on edit | exists, both tickets; the server re-checks the live account at submit | `trade-gate.tsx:35-41,190-195`, `option-preview.tsx:15-21` |
| Build a vertical / multi-leg spread | partial — legs via `<select>`s, validates, previews payoff | `app/src/shell/draft-order-builder.tsx`, `draft-leg-form.tsx` |
| **Submit** a multi-leg spread | missing — server returns `executed:false`; the UI headline still says "Confirmed" | `src/server/draft-order-route.ts:281-285`, `draft-order-builder.tsx:162` |
| Strategy templates (vertical, condor…) | missing — copy says "a vertical spread is two, an iron condor is four" | `draft-order-builder.tsx:213` |
| **See open / pending orders** | missing in the shell — #674's panel (PR #696) targets the legacy observatory and is dead code | `src/observatory/open-orders-view.ts` (only its spec imports it) |
| **Cancel an order** | missing — `cancelOrder` exists with zero callers; no route | `src/alpaca/alpaca-trading-client.ts:182` |
| **Modify / replace an order** | missing everywhere — no client method, no domain state, no route | — |
| Pending state in the domain | missing — `OrderStatus` is `filled \| rejected`; the adapter treats *accepted* as filled | `src/domain/types.ts`, `src/adapters/alpaca-broker-adapter.ts` |
| Order history / fills | exists — durable JSONL ledger, keyset-paginated; broker window 15 | `app/src/shell/activity-table.tsx`, `recent-orders-strip.tsx`, `src/observatory/activity-store.ts` |
| Live order-status updates | missing — the only SSE channel is the leaderboard; quotes poll 15 s, strips 30 s, chain never | `app/src/live/channel.ts`, `src/server/board-patch-routes.ts` |
| Order status column on a phone | missing — `col-detail`, hidden below 1100px | `activity-table.tsx:33`, `app/src/styles/desk.css:294-299` |
| View positions with tax lots | exists — FIFO lots, conservatively gated | `positions-table.tsx`, `blotter-row.tsx:167-209`, `src/trading/round-trips.ts` |
| Close a position / one lot | exists — inline panel, review → confirm | `blotter-row.tsx:156-224, 286-439` |
| Close on a limit | missing — stock close passes no `orderType`; option close hard-codes market | `blotter-row.tsx:321-327`, `src/trading/option-ticket.ts:243` |
| Roll an option | missing — honestly disabled with a reason | `blotter-row.tsx:195-205`, `order-ticket.ts:291-299` |
| Exercise / assignment / expiry UI | missing — ingested server-side only | `src/trading/option-lifecycle.ts` |
| Option positions with strike / expiry / greeks | missing — OCC symbol humanized only; `aggregateGreeks` built, unwired | `app/src/shell/option-positions.tsx`, `src/options/greeks-aggregator.ts` |
| Buying power / margin / day-trade count | missing — cash-account model; `AlpacaAccount` reads cash, equity, options level only | `src/alpaca/alpaca-trading-client.ts` |
| Watchlist | missing | — |
| Price / fill alerts, push notifications | missing | — |
| Social intel ("Also trading NVDA", recent orders) | exists on the ticket | `app/src/shell/wire-row.tsx`, `recent-orders-strip.tsx` |
| Milestone ladder 101→501 with locked-disabled-explained | exists | `milestone-strip.tsx`, `locked-panel.tsx`, `src/domain/progression.ts` |
| Pre-trade gate with explained refusals and warnings | exists — four independent layers (identity, ticket rules, options level + collateral, ladder / zero-DTE) | `src/trading/order-ticket.ts:216-276`, `option-ticket.ts`, `src/server/*-api-routes.ts` |
| Inline education at the point of choice | partial — course copy on the ticket head, order-type notes; no per-column gloss, no "learn about…" sheets | `app/src/live/ticket.ts:79-103` |

### 3.2 Friction observed in the code (the photographed defects, with causes)

1. **Short inputs stretched full width.** `.tkt-fields { grid-template-columns: repeat(3, 1fr) }`
   (`app/src/styles/ticket.css`) overrides `.gate-fields`' `2fr 1fr 1fr`, so Strike (4 chars),
   Contracts (1 char) and Order each get a third of an 1180px panel; Symbol gets the same third with an
   in-flow autocomplete listbox wrapping inside it.
2. **Ragged estimate grid.** `.gate-est` is `repeat(4, auto)` (`gate.css:106`); the options preview emits
   up to seven items (`option-preview.tsx:32-52`) → a 4 + 3 layout with no intermediate breakpoint.
3. **No spacing or type scale.** `docs/BRAND.md` documents colour tokens and two font stacks; spacing,
   radii and sizes live ad hoc per CSS file — which is why sections read jagged against each other.
4. **The chain's in-the-money rail is off-screen by default.** The rail paints on the outermost cells,
   but the table opens pre-scrolled 264px in so the base five columns fit 390px
   (`straddle-view.tsx:26,104-108`); the header comment still promises the rail.
5. **A chain with no spot renders every strike** — no ±8 window, no divider, no "Show all"
   (`app/src/live/straddle.ts:55`); "Show all N strikes" is one-way once expanded.
6. **The default options ticket fails its own review** — `orderType` defaults to `limit` with an empty
   price, Review is enabled, the server refuses (`option-gate.tsx:118-119,257`).
7. **"Confirmed" for an order that was never sent** (multi-leg, `draft-order-builder.tsx:162`).
8. **Two positions blotters** — `/app/accounts?section=overview` and `/app/u/$id` render the same table
   with duplicated chip/filter definitions.
9. **The wide tokens are inert on the ticket's children** — `RecentOrdersStrip` and `WireRow` render
   inside `.gate-panel` (capped at `--col-read`) while carrying `--col-wide`.
10. **Quantity inputs carry `min` but no `max`** except the close panel.
11. **Spread legs get dropdowns where single legs get a chain** — `draft-leg-form.tsx:117-162` fetches
    its own chain and never reuses `StraddleView`.
12. **The quote header and the chain fetch the same spot separately** (#3299, `option-gate.tsx:264`).
13. **No end-to-end test walks symbol → chain → strike → review → submit**; `e2e/trade.spec.ts` asserts
    one heading.

### 3.3 Backend capability matrix (what a design can lean on today)

| Capability | Support | Where |
|---|---|---|
| Equity market / limit / stop | full (TIF forced) | `src/trading/order-ticket.ts` → `src/server/trade-service.ts` → `src/alpaca/alpaca-trading-client.ts` |
| Stop-limit, trailing, bracket / OCO / OTO, notional, fractional, short, extended hours | none | not modelled at any layer |
| Single-leg option open (4 plays) and close | full | `src/trading/option-ticket.ts`, `src/server/option-trade-service.ts` |
| Multi-leg (`mleg`) | model + review only; submit deliberately dead | `src/trading/draft-order.ts`, `src/server/draft-order-route.ts:264` |
| Roll | none (stated reason) | `ROLL_UNAVAILABLE_REASON`, `order-ticket.ts` |
| Open-orders list | client method exists (`listOrders({status:"open"})`), no route, no caller | `alpaca-trading-client.ts` |
| Cancel | client method, zero callers, no route | `alpaca-trading-client.ts:182` |
| Replace | none | — |
| Pending statuses in the ledger | journaled (`new` / `canceled` / `rejected` lines) but never surfaced as open | `src/alpaca/trade-updates-stream-events.ts:88`, `src/observatory/activity-store.ts` |
| Option chain (bid / ask / OI / vol / greeks) | full for ≤20 nearest expirations; no cache; every review and submit re-fetches; no 429 handling | `alpaca-options-client.ts`, `src/server/option-chain-route.ts` |
| IV, probability | research path only | `src/options/pricing.ts`, `src/adapters/alpaca-recommend-chain.ts` |
| Portfolio greeks | built, unwired | `src/options/greeks-aggregator.ts` |
| Real-time quotes / fills to the browser | none — polling; the hub already has both event streams server-side | `src/server/observatory-hub.ts`, `board-patch-routes.ts` |
| Account detail (buying power, margin, PDT) | none | `AlpacaAccount` subset |
| Options-level, collateral, ladder and zero-DTE gates | full | `option-economics.ts`, `src/domain/progression.ts`, both API routes |
| Multi-account per member | full | `src/server/dashboard-identity.ts`, `account-switcher.tsx` |
| Bots trading options | none — `OrderIntent.type` is the literal `"market"` | `src/domain/types.ts`, `src/ports` |
| Paper-trading mode | the whole app — every account is an Alpaca paper account | `src/participants/participant.ts` |

Envelope note: `alpaca-trading-client.ts`, `trade-service.ts`, `order-ticket.ts` are protected
(`envelope.json`); order-lifecycle plumbing boards the platter, never auto-merges.

### 3.4 Prior decisions on record — inputs to the designs, not bounds

| Decision | Where | What it settled | Status for this study |
|---|---|---|---|
| Rail = preset, never drive; locked = visible · disabled · explained; a sell is never locked | #1461 | the milestone ↔ feature boundary | reference — a shape may move the rail off the ticket |
| The chain is the entry instrument; greeks additive; absent never zero | #1481 | the straddle view | reference — the chain's *placement* is open |
| No tab strip; kind / section / sub-view | #1740 | the shell's navigation words | reference — a shape may need a fourth word |
| `/trade` stays one page; symbol in the URL; intel inline; chart is a section | #2017 | the cockpit | reference — the one-page premise is on the table |
| "Reaffirm, don't redesign the ticket's IA" | #3299 | declined a from-scratch ticket for lack of new evidence | superseded by Eric's brief and screenshots of 2026-09-21 — the evidence #3299 said it lacked |
| Limit-at-mid as the educational default | #3299 `needs-eric` | open taste call since 2026-08-13 | folded into the parity plan; stays the one decision for Eric |

---

## 4. Cross-examination

_Filled after §1–§3 — see below._

---

## 5. Vocabulary

_Filled after §1–§2 — see below._

---

## Sources

_Compiled from the research pass — see below._
