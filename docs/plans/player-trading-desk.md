# Plan: the player trading desk — see your standing, then act on it

**Status:** executing <!-- draft | ready | executing | review | done — only Eric flips draft→ready -->
**Author:** Claude (proposing) · **Date:** 2026-08-13

## Intent & end-state

Eric's directive: *"individual players need more views to observe their standings — active trades,
trade history, trade analysis, metrics board, the ability to sell/roll/close positions, the ability to
execute trades. Research financial platforms to find an ergonomic and delightful experience… we will
feed this through Claude design once we have a running head start."*

End-state: a member opens their profile and finds a **desk** — five tabs over one account — that
answers the four different questions a trader actually has, and lets them act on what they see without
leaving the page. The head start is deliberately *real*: working views over live data with the honesty
seams already in place, so the design pass is a taste pass on something running, not a redesign of a
mock.

The research this is built on: [`docs/research/trading-desk-ux.md`](../research/trading-desk-ux.md).

## Acceptance criteria (EARS)

**Slice 1 — the data spine (pure, shipped)**
- [x] WHEN given a participant's fills, the system shall reconstruct closed trades by FIFO lot
      matching, reporting realized $, return %, and hold time per trip. — *verify: spec*
- [x] IF a sell has no visible opening lot, THEN the trip shall be dropped and the ledger flagged
      `truncated` — never matched against an unrelated later buy. — *verify: spec*
- [x] IF a fill carries no recorded price, THEN it shall be excluded and counted, never treated as a
      $0 fill. — *verify: spec*
- [x] WHEN stats are computed over closed trips, unmeasurable measures shall be `null`, never 0 —
      no trades is not a 0% win rate, and no losses is not a profit factor of zero. — *verify: spec*

**Slice 2 — the four views (shipped)**
- [x] WHEN a member opens `/u/:id?tab=positions`, the desk shall render every open position with
      quantity, average entry, mark, market value, unrealized $ and %, and portfolio weight.
      — *verify: spec + screenshot*
- [x] WHEN a member opens `?tab=history`, the desk shall render closed round trips (not the raw order
      log), with the fills folded away beneath as receipts. — *verify: spec + screenshot*
- [x] WHEN a member opens `?tab=analysis` with no closed trades, it shall say analysis needs closed
      trades rather than estimating from open positions. — *verify: spec*
- [x] WHEN a member opens `?tab=metrics` with fewer than two samples, it shall say history is still
      accruing rather than drawing a flat line. — *verify: spec + screenshot*
- [x] WHEN any windowed change is measured against history younger than the window, it shall be
      labelled "since first sample". — *verify: spec (inherited from `history-metrics.ts`)*

**Slice 3 — the action layer (shipped, gated off)**
- [x] WHEN a member submits the ticket or a row's Sell, the system shall render a **review screen**
      restating the order with estimated notional, cash-after and position-after, and shall send
      nothing until a second explicit confirm. — *verify: spec asserting no submit on first POST*
- [x] WHEN an order is confirmed, the service shall re-read the live account and re-run the ticket
      rules against fresh numbers before submitting. — *verify: spec — a position that shrank between
      review and confirm is refused*
- [x] IF the requester's resolved identity is not the target account, THEN the order shall be refused.
      — *verify: spec*
- [x] IF desk trading is not switched on for the deployment, THEN every order shall be refused and the
      ticket shall render visibly disabled with the reason. — *verify: spec*
- [x] WHEN `/trade` is requested by GET, the system shall answer 405 — an order is never a link.
      — *verify: spec*
- [x] WHEN rolling is offered, it shall render disabled with its real reason (this desk trades shares;
      there is no options leg to roll). — *verify: spec*

**Not yet met (named, not hidden)**
- [ ] WHEN a member wants to roll, the system shall close one options contract and open another in a
      single order. — *blocked: no options order path. See "What roll actually needs" below.*
- [ ] WHEN the desk shows history, it shall cover more than the broker's most recent orders.
      — *blocked: `getRecentOrders(limit=15)` is the whole window today; see slice 4.*

## Constraints & non-goals

- **Paper only**, and labelled as such on the review screen, every time.
- **No shorting, no fractional shares, no margin** from the desk — the ticket refuses all three,
  matching `engine/guards.ts` so members and bots obey the same limits.
- **No day-P/L column** and no Greeks: neither can be computed honestly from one account read.
- **Not the metrics layer.** [`metrics-layer.md`](metrics-layer.md) owns the multi-axis ladders and
  achievement events; this plan renders per-participant surfaces and does not build ceremonies.
- **Not the insight loop.** [`trade-insights-loop.md`](trade-insights-loop.md) owns retrospectives on
  close; the round-trip ledger here is a *view-side* reconstruction, not a durable insight record.

## Pre-settled forks

- **Tabs on the profile, not new top-level nav** → the desk is one subject seen five ways; `?tab=`
  keeps every view shareable and back/forward-friendly with no JS.
- **Analysis and Metrics stay separate** → they take different inputs and go blank for different
  reasons; merging makes one empty state lie about the other.
- **Roll rendered disabled with its reason** → not hidden (members would ask), not faked (forbidden).
- **Trading is off by default and requires OAuth** → placing broker orders from a browser session is
  the irreversible class; the mechanism ships, the authorization is Eric's. With no OAuth there is no
  identity to match an order to, so the desk refuses rather than guessing.
- **Prices to the cent, totals to the dollar** → `formatCurrency` rounding is right for equity and
  wrong for a fill price.

## Autonomy envelope

- Default merge policy applies; this PR waits for Eric (feature + visual work).
- **Never widenable:** switching desk trading on in any deployed environment. That is one env var
  (`SKYNET_DESK_TRADING=on`) and it is Eric's to set, on a host that already has OAuth configured.

## What "roll" actually needs (sizing the blocked criterion)

1. Options contracts in the order path — `PlaceOrderParams` carries `{symbol, qty, side}` only; an
   options order needs an OCC symbol or a multi-leg order class.
2. A positions read that returns option legs (expiry, strike, right) and renders them as a position,
   not a ticker.
3. Multi-leg order support so a roll is one atomic order rather than a close and a hopeful re-open.
4. Ticket rules for defined-risk structures (max profit/loss), which the payoff-anatomy work in
   `docs/BRAND.md`'s playbook anchor already has the vocabulary for.

Until 1–3 exist, the honest surface is the disabled affordance now shipped.

## Open questions (Q&A queue)

1. **Localhost trading.** Desk trading currently requires OAuth, so a password-only/localhost run can
   never place an order from the UI. Want a documented local escape hatch, or is `smoke:trade` enough?
2. **Deeper fill history.** Pulling ~200 orders instead of 15 makes History and Analysis real, at the
   cost of a bigger read per snapshot. Pull deeper on the desk tabs only, or raise it board-wide?
3. **Limit orders.** The ticket is market-only today. Teaching limit orders is arguably the more
   *educational* default — worth the extra field?

## Decision log

- Round trips reconstructed FIFO rather than reading a broker-provided realized figure — brokers report
  tax-adjusted realized P/L, which is a different number from the trade's economics.
- `PositionView` extracted into `broker-positions.ts` so the blotter and the order service convert the
  broker payload identically; a ticket reviewed against different numbers than the screen showed is the
  exact failure the review step exists to prevent.
- `serve-dashboard.ts` budget raised 175 → 186 (composition-root wiring for the new feature), while
  `participant-snapshot.ts` ratcheted down via the extraction above.
