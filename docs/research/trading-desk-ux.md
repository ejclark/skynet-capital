# Research: what makes a player's trading desk ergonomic (and delightful)

**Question:** individual players need more ways to see where they stand — active trades, trade history,
trade analysis, a metrics board, and the ability to act on a position. What do the platforms that do
this well actually do, what should we steal, and what should we deliberately not copy?

**Date:** 2026-08-13 · **For:** `docs/plans/player-trading-desk.md` (the design this feeds)

## The four surfaces every serious platform converges on

Across retail brokerages (Robinhood, tastytrade, thinkorswim, Webull, IBKR) and the journal/analytics
tools that sit beside them (TradeZella, Tradervue), the same four surfaces recur — and crucially, they
are **four, not one**, because each answers a different question and goes blank for a different reason.

| Surface | Question it answers | Input it needs | Blank when |
|---|---|---|---|
| **Positions / blotter** | "what am I in right now?" | live account | flat |
| **History** | "what did I actually do?" | fills | no fills recorded |
| **Analysis** | "am I any good at this?" | **closed** round trips | nothing sold yet |
| **Metrics** | "how is the account doing?" | equity samples over time | no history recorded |

Merging Analysis into Metrics is the tempting simplification and it is wrong: a new member with three
open positions and no exits has a full metrics board and an *empty* analysis board, and one empty state
must not be papered over by the other's numbers.

## What we took

**1. The blotter row is the unit of interaction.** tastytrade's Positions tab puts quantity, cost,
mark, day P/L and open P/L on one line and hangs the closing actions off the same row — no drill-down,
no hidden overflow menu. Their published column glossary is effectively the industry's shared
vocabulary for what belongs on that row. We ship the honest subset our equity account can actually
back: symbol, quantity, average entry, mark, market value, unrealized $ and %, plus a weight bar so
concentration reads without arithmetic.

**2. A review step between intent and execution.** Robinhood's own closing flow is: pick the position →
choose quantity → **review and confirm** → sent. Baymard's checkout-usability research (the closest
well-studied analogue to an order ticket) finds the review step is where users catch their own mistakes
— and that sending them *backwards* through the flow to edit is the single most common way to ruin it.
So: our review restates the whole order, shows cash-after and position-after, and its Cancel returns to
the blotter with the ticket intact rather than to a dead end.

**3. Round trips, not fills — reconstructed FIFO.** This is the load-bearing one. Journals (Tradervue,
TradeZella, and the Sierra/NinjaTrader-class tools) all reconstruct closed trades from raw fills using
**FIFO lot matching**, because scale-ins and partial closes otherwise make "win rate" meaningless. FIFO
is also the IRS default, so a number computed this way reconciles with a brokerage statement instead of
quietly disagreeing with it. Implemented in `src/trading/round-trips.ts`.

**4. The four measures, together.** Every analytics dashboard in the category surfaces win rate, profit
factor, expectancy, and (usually) R-multiple/payoff. The reason to show all four is pedagogical: win
rate alone is a trap, and payoff ratio is what makes a 40%-win strategy defensible. We show win rate,
profit factor, expectancy, payoff ratio, net realized, and average hold — each with a plain-English
gloss, because "profit factor 3.2×" teaches nobody anything on its own.

**5. Calendar-shaped P/L.** TradeZella's calendar P/L view is the most-copied piece of delight in the
category: a month of trading readable at a glance before a single number is parsed. Our day strip is
the compact version — one square per day with a close, green/red by realized P/L.

## What we deliberately did not take

- **Day P/L on the blotter.** Every platform has it; we can't compute it honestly from a single
  account read (no prior close per position). An unhonest "day change" column is worse than none.
- **Greeks, beta-weighted delta, buying-power reduction.** tastytrade's power columns are options
  concepts. We trade shares; rendering an options column set would imply a capability we lack.
- **A single "score".** Compressing the four measures into one number is what makes journals feel like
  a game and stop teaching. The measures stay separate and named.
- **Gamified loss spectacle.** Red days are rendered honestly and quietly (`docs/BRAND.md`: the
  fanfare budget goes to what goes right).
- **One-tap trading.** TradingView-style one-tap order modes exist and are explicitly *not* what an
  educational paper desk should teach. The review step is the lesson.

## The hard constraint the research surfaced

**Rolling cannot be shipped as asked.** A roll closes one options contract and opens another in a
single order. This account path is equity-only (`AlpacaTradingClient.placeOrder` submits share orders;
`engine/guards.ts` clamps every sell to what's held, so it can't even short). There is no leg to roll.
The honest options were: hide it, fake it, or render it disabled with the real reason — we render it
disabled and say why, and the reason string lives in one place
(`ROLL_UNAVAILABLE_REASON`) so every surface tells the same story. Enabling it for real is an
options-order-path project, sized in the plan.

## Sources

- [tastytrade — Positions & Watchlist column glossary](https://support.tastytrade.com/support/s/solutions/articles/43000471741)
- [tastytrade — closing order types available on the Positions tab](https://support.tastytrade.com/support/s/solutions/articles/43000435414)
- [Robinhood — options rolling (what a roll actually is)](https://robinhood.com/us/en/support/articles/options-rolling)
- [Closing an options position on Robinhood — the review-and-confirm flow](https://www.ultraalgo.com/post/closing-options-on-robinhood-a-step-by-step-guide)
- [Baymard Institute — "Review Order" step design benchmark](https://baymard.com/checkout-usability/benchmark/step-type/order-review)
- [TradeZella vs Tradervue — what a journal dashboard surfaces](https://www.tradezella.com/blog/tradezella-vs-tradervue)
- [How to analyze your trading performance — win rate, profit factor, expectancy](https://www.tradezella.com/blog/analyze-trading-performance)
- [FIFO lot matching for round-trip reconstruction from fills](https://www.scstudies.com/trading-journal)
- [IBKR — realized vs unrealized performance reporting](https://www.ibkrguides.com/reportingreference/reportguide/realized_unrealizedperformancesummary_default.htm)
