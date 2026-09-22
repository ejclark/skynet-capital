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

## The call

One row per pattern the three inventories and the Robinhood ledger surfaced. **Call** = borrow / adapt /
skip for a paper school; **confidence drives size** (a low-confidence borrow is a seed, not a slice); every
row carries the dated observation that proves it wrong. **Provenance** grades where the row came from —
`frame` (seen in a redacted frame) · `vendor-quote` (the mechanic in the vendor's own words, linked) ·
`doc-inferred` (assembled from docs; capped at low) · `not shown`. A lo-fi shape may borrow only `frame`
and `vendor-quote` rows. Context line (teardown step 5): Robinhood is a real-money app for self-declared
retail traders with a revenue-per-order model; Fidelity a full-service broker with approval tiers;
thinkorswim a pro platform whose paper mode is the same UI one switch away. **We** are a paper school
with an earned ladder and no per-order revenue — that difference is what turns several of Robinhood's
"harms" into honest borrows and several of its "features" into skips.

| # | Pattern | From | Prov. | Call | Conf. | Why | Proves it wrong |
|---|---|---|---|---|---|---|---|
| 1 | **Working-orders view on the trade surface, with cancel and replace** | All three (tos Working Orders · Fidelity Orders/Attempt-to-Cancel · RH Pending + drag-to-replace) | vendor-quote | **borrow** | high | Every reference has it; ours offers a Limit "that can sit open indefinitely" with no screen to see or cancel it (§3.1). #674 already decided it lives on the Trade page. | A member survey by 2026-11 rates open orders as not needed on Trade — then #674's placement was wrong, not the feature. |
| 2 | **Honest cancel semantics** — "Attempt to cancel" → "Verified canceled"; an exhaustive status vocabulary (Working · Replacing · Canceling · TLTC…) | Fidelity, thinkorswim | vendor-quote | **borrow** | high | Alpaca already journals `new` / `canceled` / `replaced`; the domain collapses them to `filled \| rejected`. Truthful states are the honesty rule applied to orders. | A state the UI shows that Alpaca never emits (check against `trade-updates-stream-events.ts`) — then the vocabulary is invented, not borrowed. |
| 3 | **Confirm step is where the warnings live; skipping it is an explicit risk acceptance** | thinkorswim Confirm-and-Send; Fidelity Preview + skip-by-agreement; RH Auto-send warning text | vendor-quote | **borrow** | high | Our review already renders refusals and warnings verbatim; the borrow is the *frame*: one dialog, edit / send / save, cost lines, and no skip for humans on paper. | If members abandon at review > 20% (instrument: `order.reviewed` vs `order.submitted`, §4 P1) the step is a wall, not a lesson — redesign the review, never remove it. |
| 4 | **Review as a sentence + three context rows + a plain-language warning above** | Fidelity (frame 19) | frame | **borrow** | high | Already seeded (PATTERNS row); the research confirms it is the review's spine on every reference. | — |
| 5 | **Quote header + as-of stamp above the form; as-of under it** | Fidelity (frames 1, 9); RH trade-entry screens show consolidated NBBO | frame / vendor-quote | **borrow** | high | Shipped in part (#2057, no as-of); the stamp is the SIM honesty line. | — |
| 6 | **Straddle chain with strike as the spine, greeks scroll out, tap bid = sell / ask = buy** | Fidelity (frames 11–14); RH "select the Bid column to sell, the Ask to buy"; tos click ask/bid | frame / vendor-quote | **borrow** (placed) | high | Shipped (#1481, #2094); confirmed by all three as the industry grammar. Placement of the chain is what the shapes revisit, not the grammar. | — |
| 7 | **Breakeven + chance of profit on the chain row; greeks + probability on the order screen; expected value beside PoP** | RH default row and tap-a-strike; tos Probability ITM/OTM columns; Fidelity multi-select PoP | vendor-quote | **borrow** | high | Reading a chain is a stated learning outcome; ours shows greeks only as scroll-out columns and never on the ticket (§3.1). Pair PoP with EV so 72%-to-win-$1 vs 28%-to-lose-$5 is legible (ledger #20). | > 30% of members read "chance of profit" as "chance I make money overall" in a 2026 survey → the EV pairing is insufficient; add the payoff diagram inline. |
| 8 | **Outlook → strategy grammar with max loss unavoidable on screen** | RH Strategy Builder (bullish / bearish / volatility / neutral → cards with a P/L thumbnail → one strategy price); tos right-click → Analyze; Fidelity Strategy Builder | vendor-quote | **borrow** | high | Our recommender already ranks structures by outlook (`src/options/recommend.ts`, `outlook.ts`); the borrow is the *surface*: a belief becomes a named structure with its max loss. Ledger #19: the one Robinhood mechanic with no harm finding and a documented learning value. | A multi-leg can be submitted from the builder without max loss on screen (screenshot check every PR) → the safeguard was lost. |
| 9 | **Simulate with the same gesture as the trade; Risk Profile = expiration curve + today curve + price slices with probability** | tos Add Simulated Trades / Risk Profile; RH Simulated Returns (price dial + time slider); Fidelity P/L calculator | vendor-quote | **adapt** | med | `src/options/payoff-surface.ts` already computes P/L at any date (blue) — unwired. Adapt: one payoff panel reachable from the chain and the position, with a date slider; not thinkorswim's full Analyze tab. | If the payoff panel is opened in < 10% of option reviews (instrument: a `payoff.opened` event, P2) it is decoration; fold it into the review sentence instead. |
| 10 | **Position Statement vocabulary — P/L Open · P/L Day · Days · an ITM badge · live greeks per option position** | thinkorswim; Fidelity Option Summary; RH options hub buckets | vendor-quote | **borrow** | high | Option positions today are a humanized OCC symbol (§3.1); `aggregateGreeks` is built and unwired. Schwab's own beginner guide says watch "P/L Open" and "Days". | — |
| 11 | **Roll as one ticket (close + open, 1:1), reachable from the position row** | Fidelity Roll ticket; RH Trade → Roll position; tos right-click roll + Strategy Roller | vendor-quote | **adapt** — landed (P3 slice 3, `roll-row.tsx`) | med | Roll… on the option positions card: next expiration + strike from the chain, one `mleg`; the Strategy Roller automation stays declined. | A roll that fills one leg without the other by 2026-12-31 → the `mleg` atomicity claim is false, revert to the two-ticket door. |
| 12 | **Create Opposite / Create Duplicate on an order or position row** | Fidelity, thinkorswim | vendor-quote | **borrow** | med | Staging the exit is one click; it is the "review step between intent and execution" applied to closing. | — |
| 13 | **Time in force as a shown control — Day + GTC only** | Fidelity sheet (5 options + learn link); RH GFD/GTC; tos DAY/GTC/EXT… | frame / vendor-quote | **borrow** | high | Ours hard-codes TIF server-side and never says so (§3.1). Two options only; the flat eight-type inventory stays declined (PATTERNS). | Members ask for extended-hours or IOC by name → build it, then list it. |
| 14 | **Session-aware default order type with the preset shown at review** (market in RTH, limit ± 2% outside; OTC always limit) | RH | vendor-quote | **adapt** | high | This is #3299's limit-at-mid question with a mechanism attached: the *default* follows the session and the preset is visible before submit. Rendered as an A/B on the lo-fi frames; the taste call erodes into the lo-fi review. | Eric picks market-first on the frames — then the default is market and the preset line still shows. |
| 15 | **Dollars \| Shares unit toggle (dollar path = the newcomer's on-ramp)** | Fidelity (frame 3); RH dollars by default | frame / vendor-quote | **adapt** | med | Seeded already; blocked on notional orders (backend "none"). Adapt on paper: a dollar amount that resolves to whole shares with the remainder shown. | Alpaca paper rejects notional on this account type and whole-share rounding confuses the ladder's "one fill earns it" rule → keep shares only. |
| 16 | **Contextual fields; pickers as bottom sheets with one "Learn about…" link; header gloss at the point of choice** | Fidelity (frames 4, 7, 15); tos "i" on studies | frame | **borrow** | high | Seeded; the research confirms the learn-link-in-the-picker is the cheapest R3 ("celebration pairs with explanation") move on a control. | — |
| 17 | **Counted, named, opt-in interstitials before an irreversible threshold** (legacy PDT Protection 2nd/3rd/4th warn; 0DTE opt-in; IPO flip penalty) | RH (ledger #29, #31, #32) | vendor-quote | **borrow** | high | Textbook FOG-OF-WAR (visible · named · disabled · counted); our zero-DTE gate (501) and rung locks already are this shape — borrow the *counter* and the interstitial copy. | Members report the interstitial as noise in a 2026 survey → shorten, never remove. |
| 18 | **Milestone celebration re-triggered on plan adherence, never on trade count; the receipt screen as the explanation slot** | RH post-2021 (ledger #1, #2, #7); MA order §VIII.C.d | vendor-quote | **adapt** | high | BRAND's rule already cites this; the adapt is the *trigger variable*: first disciplined entry, first profit-take at plan, first bot deployed — never "first trade". The MA order's line ("not tied to frequency of trading") is the boundary. | > 20% of celebration events fire on an event with no plan-adherence predicate (celebration log, 2027-03) → drifted back to Robinhood's trigger. |
| 19 | **Order-status push / fill notice carrying the plan line** | RH "Order status" push; Fidelity "notifications for all of your orders"; tos "Working orders filling" | vendor-quote | **borrow** | high | The fill is the natural moment for "why I took this"; `src/alerts` is a substrate with no delivery (#586). Delivery keys are Eric's one credentialed step (P4). | Fill pushes top the "makes me open the app" list in a 2026 survey → in-app only. |
| 20 | **Plan-derived alerts (my stop / my target), never default-on % moves** | RH (ledger #11); Fidelity four alert types; tos alerts on any value | vendor-quote | **adapt** | high | FCA 2024: default-on pushes +11% trades, +8% risky. Alerts generated from the member's own plan fields reward planning; % movers reward reacting. | Plan-derived alerts produce more unplanned orders within 5 minutes than the no-alert group (2026 telemetry) → the distinction is not protective. |
| 21 | **Top Movers / Most Popular / "people also own" as a buy list** | RH (ledger #15, #16) | vendor-quote | **skip** — adapt only as a taught exhibit with the −4.7% number printed on it, no buy affordance | high | The only mechanic with a *return* finding (Barber–Huang–Odean–Schwarz 2022); the MA order bans the pushes. Our in-group "Also trading NVDA" row already pairs popularity with a thesis. | A paper cohort that sees the exhibit herds *more* than one that doesn't (2027 study) → it is a list with a caption; remove it. |
| 22 | **Live-ticking portfolio value and whole-screen P/L colour** | RH (ledger #4, #26) | vendor-quote | **skip** | high | Fails the colourblind rule outright (hue alone; `tests/ui/contrast.spec.ts`), and SEC/FCA name it as a DEP. Ticker roll on the *quote* (already borrowed, `src/ui/ticker.ts`) stays; the home-screen jiggle does not. | — |
| 23 | **Swipe-up / one-motion submit; Auto-send** | RH (ledger #5, #6) | vendor-quote | **skip** for humans on paper; swipe only if gated on filled plan fields | high | `trading-desk-ux.md:68-69` already skipped one-tap ("the review step is the lesson"); Robinhood's own help text calls Auto-send an accidental-trade risk. | Members complete plan fields with placeholder text > 30% of the time (2026 logs) → the gate is theatre; drop the gesture entirely. |
| 24 | **Scratch-off / lottery rewards, referral capital, cash-for-learning, waitlist tapping, emoji in transaction messages** | RH (ledger #8, #9, #10, #14, #25) | vendor-quote | **skip** | high | Banned or bounded by the MA order; FOG-OF-WAR anti-patterns ("a fog that money lifts is a paywall"); the honesty rule keeps the transaction voice plain. Lore reveals for *study* milestones are the only defensible cousin. | A randomized in-app study shows variable rewards on *lessons* raise trade frequency (2027) → even the lore variant goes. |
| 25 | **24 Hour Market** | RH (ledger #18) | vendor-quote | **skip** until the backend can honour it (extended hours: none) | med | A 24h label on a paper account that cannot fill is a `SIM` honesty stop; when built, limit-only + widened spread is the safeguard worth copying. | Paper overnight fills simulated at last price rather than a widened spread → the lesson is fake. |
| 26 | **Self-declared instant options approval** | RH (ledger #30; FINRA AWC) | vendor-quote | **skip** — keep the *rung* structure, earned by fills | high | Our ladder is the inverse by design (`progression.ts`: "the order id IS the evidence"). | Any member reaches multi-leg without N logged single-leg fills → the gate became self-report in disguise. |
| 27 | **paperMoney: practice is the same UI one switch away; reset-and-refund is a first-class control; the fiction is stated** | thinkorswim | vendor-quote | **borrow** | high | Our whole app is paper; the borrows are the *reset* control (a blown-up book becomes a fresh scenario) and the disclosure discipline ("executions are simulations"). | A reset erases the ladder's evidence (fills) → reset must keep earned rungs; if it can't, it stays a support action. |
| 28 | **Widget / tool linking (a symbol picked in one drives the rest); ticket beside the chart on desktop** | RH Legend linking; tos colour clipboard; Fidelity link groups | vendor-quote | **adapt** | med | Mobile-first: the phone has one symbol in the URL already (#2017); desktop "adds room" — the chart beside the ticket is the room. Never a widget shell. | A shape that needs more than one symbol on screen at 390px → it is a desktop reference misread. |
| 29 | **Drag an order pill on the chart / ladder to replace; direction-vs-plan annotated** | RH Legend; tos ladder; Fidelity Trade Armor | vendor-quote | **adapt** (desktop only, after replace exists) | low | Requires replace (none today) and a chart with orders drawn on it. Moving a stop is the disciplined act; moving a limit to chase is not — log which. | Drag-amends on paper skew > 60% toward loosening stops (2026 logs) → add a friction step. |
| 30 | **A real desk's flat order-type and TIF inventory; three buying powers; margin** | Fidelity (frames 5, 20); tos advanced-order menu | frame / vendor-quote | **skip** (declined here — PATTERNS) | high | Paper, one desk, one number; vapor options disabled "coming soon" are a trap. Brackets (OTOCO) are the one advanced order worth a later look because it *is* the plan (target + stop). | Members ask for brackets by name → build OTOCO, then list it. |
| 31 | **Cortex-style digest with sources and a falsifier, no buy affordance; a daily dispatch about the universe** | RH (ledger #34, #35) | vendor-quote | **adapt** | med | Our companion and the research doctrine already carry "the call · why · falsifier"; the adapt is placement on the symbol view with no order affordance on the card. | Orders within 2 minutes of reading a digest exceed baseline (2026) → it is a recommendation surface. |
| 32 | **Leaderboard on process, theses visible, no trade-from-feed** | RH Social beta (ledger #28); our observatory | vendor-quote | **adapt** | med | Verified P&L + thesis is education; verified P&L + one-tap follow is herding. THE-GAME's renown ledger is the process metric — unbuilt. | Followers of top-P&L profiles underperform in Robinhood Social's 2026–27 data → the P&L-leaderboard shape is confirmed harmful. |

**Reading the sheet:** rows 1–3 and 10 are the tier that *blocks execution or trust* today and are pure
borrows — every reference agrees and the backend already journals the states. Rows 7–9 and 16–18 are where
the paper school can be *better* than the references (probability with expected value, plan-triggered
celebration, a learn link in every picker). Rows 21–26 are the Robinhood mechanics the transfer rule
skips outright; the ledger's hinge ("safe iff the reward variable is not trade count") is the sentence to
keep.

---

## 1. Journey inventory — Robinhood · Fidelity · thinkorswim

One row per feature, per reference, grouped by journey stage. Confidence maps to provenance: *high* on a vendor page = `vendor-quote`; a row marked "in-house frames" = `frame`; *medium* = `doc-inferred`; *low* / "not shown" = `not shown`.

### 1.1 Robinhood — mobile app + Legend (desktop/web), read 2026-09-21

Primary sources: Robinhood US help center, newsroom, Learn. Source IDs `[R#]` resolve in the Sources
list. Confidence: **high** = read on Robinhood's own page; **medium** = secondary or a snippet;
**low** = inferred. "Not shown" rows say where we looked.

**Three findings that reshape the brief:**
1. **Pattern-day-trade rules no longer exist at Robinhood.** From 2026-06-04 FINRA's intraday-margin
   standard replaced PDT; flags were removed [R50][R51]. The legacy "PDT Protection" page [R52]
   documents the *pattern* worth studying — count-and-warn before an irreversible threshold.
2. **There is no Level 1.** Level 2 = long calls/puts, covered calls, cash-secured puts; Level 3 adds
   spreads, straddles/strangles, condors, butterflies; cash accounts cannot get Level 3 [R30][R31][R33].
3. **Celebration is milestone-based, not per-order.** Confetti retired 2021-03-31, replaced by
   "dynamic visual experiences" on milestones (first trade, first deposit, Gold, referral) [R56].

#### Discover

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Search bar | Finds stocks, ETFs, indexes; the options flow starts from the name → Trade → Trade options. | Both | [R34][R47] | high |
| Recent searches | Not shown — not documented in [R34][R15][R71]. | — | [R71] | low |
| Custom watchlists | Investing → Lists → Create watchlist; add via "+" on a detail page; drag to reorder. | Both | [R22] | high |
| Pending-order badge on watchlist | "A + or − icon will show on the stocks in your watchlist that have pending orders." | Phone | [R21] | high |
| Curated lists (100 Most Popular, Daily Movers, Upcoming Earnings, sectors) | Most-held by customers; the 20 biggest daily swings; earnings in 7 days. Reached via Related lists. | Both | [R22][R21] | high |
| 24 Hour Market list | Eligible overnight names live in a dedicated list. | Both | [R7] | high |
| Cards above the watchlist | Feature, account (transfers, orders, dividends), market ("Top movers… following market close"), news; swipe to page. | Phone | [R21] | high |
| Stock screeners | Custom or preset filters (price, 52-wk, volume, cap, P/E, yield, IV, rating, sector, earnings date, % change), saved with a name and emoji. | Both (not Legend) | [R23] | high |
| "People also own" | Detail-page section from customers' portfolios, labelled not a recommendation. | Both | [R15] | high |
| News, analyst ratings, trading trends on the detail page | Latest articles; buy/hold/sell split with count; activity of customers, hedge funds, insiders. | Both | [R15] | high |
| Cortex Digests | Plain-language "what may be driving the price" on the most-viewed names; Portfolio Digests vs SPY and BTC. | Both | [R28] | high |
| First-trade recommendations | Pre-first-trade, a 4-ETF portfolio from a questionnaire, $20 minimum, one time. | Phone | [R29] | high |
| Notifications inbox | Bell icon; per-holding threads; critical ones carry a red dot; actions from the thread. | Phone | [R26] | high |
| Push categories | Stock / options / crypto price moves, investor updates, **order status**, bank. | Phone | [R27] | high |
| Price alerts | 5% (default) / 10% moves on holdings; 52-week high/low; custom above/below; indicator alerts; set from the chart via a bell. | Both | [R24] | high |
| Legend Scanner / Snapshot widgets | 60+ filters refreshing every 5 min; real-time quote + headlines + fundamentals + next earnings. | Desktop | [R59] | high |

#### Quote & chart

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Quote header price source | Detail page = last trade (Nasdaq Last Sale), may be 15-min delayed in extended hours; the *trade-entry* screens show consolidated real-time last/bid/ask (NBBO). | Both | [R16] | high |
| Bid/ask labelling | Price, size and exchange, labelled "Nasdaq Bid and Ask, or QBBO". | Both | [R16] | high |
| Chart ranges, line vs candle | 1D→MAX; 1D/1W include extended and overnight; gear → Line/Candlestick; green close>open. | Both | [R17] | high |
| Advanced chart on mobile | "Advanced" inside the chart; indicators (7 documented, "over 80" per the 2025 launch post — help center lags); custom intervals. | Phone | [R18][R19][R67] | high (conflict noted) |
| Trade from the mobile chart | Buy/Sell MKT buttons; long-press to scrub, "+" on the price axis places a limit/stop; **drag the order to modify**, X to cancel. | Phone | [R18] | high |
| Auto-send | Skips confirmation screens; disclosures re-acknowledged periodically; warns it "may increase your risk of placing accidental trades". | Phone / Legend | [R57][R63] | high |
| Level II | Nasdaq TotalView depth from the detail page. | Both | [R20] | high |
| Chart beside the ticket | Not shown on the mobile ticket; on Legend the chart widget *populates* the order form. | Legend | [R63] | low (mobile) / high (Legend) |
| Legend chart widget | Tick→year intervals; 10 chart types; drawing tools; up to 8 charts per window; 100+ indicators, savable sets. | Desktop | [R59][R61][R66] | high |

#### Stock ticket

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Entry point | Detail page → Trade → Buy / Sell (just "Buy" if not owned). | Both | [R9][R10] | high |
| Dollars vs shares | **Dollars by default**; select Dollars to switch to Shares or another order type; web has a "Buy In" selector. | Both | [R9][R74] | high |
| Order-type menu | Sell flow: "choose your order type at top right". | Both | [R10][R9] | high |
| Order types | Market, limit, stop, stop-limit, trailing stop; no bracket, no MOO/MOC. | Both | [R1] | high |
| Time in force | Market = good-for-day; others GFD or GTC (90 days). | Both | [R1][R6] | high |
| **Default order type by session** | Market in RTH; in extended hours a limit preset "2% above (buy) / 2% below (sell)" the last trade, "review the preset limit price on the order review summary"; OTC always limit. | Both | [R2][R3] | high |
| Session selector | Limit orders choose Market / Extended / 24 Hour Market (8 PM–8 PM ET). | Both | [R6][R7] | high |
| 24 Hour Market constraints | Whole-share limit orders only; GFD expires 8 PM; GTC up to 90 days. | Both | [R7] | high |
| Market orders outside RTH | Queued for the open with 5% extra buying power reserved. | Both | [R3][R6] | high |
| Stop / trailing stop outside RTH | Don't execute; queue for the regular open. | Both | [R6] | high |
| Trailing stop fields | Trail in %; buys reserve 5–10% extra buying power. | Both | [R5] | high |
| Stop-limit fields | Stop price + limit price; buy stop above / sell stop below. | Both | [R4] | high |
| Fractional constraints | Dollar sells max 95% of the position; no fractional overnight. | Both | [R3][R6] | high |
| Estimated-cost line | Not shown as a named field in [R9][R2][R3]. | — | — | low |
| Review screen | "Review your order… or select Edit"; web: Review order → Buy/Sell. | Both | [R9][R10] | high |
| **Swipe up to submit** | Stocks, options, crypto, replace flows. | Phone | [R9][R34][R13] | high |
| Post-submit | Replace flow ends "Done or View order". | Phone | [R13] | medium |

#### Options

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Enabling options | Account → Options trading → confirm investor profile → Options Agreement → notified of level. | Both | [R30] | high |
| Approval levels | Level 2 (long, covered call, CSP), Level 3 (spreads…); cash accounts no Level 3; no Level 1. | Both | [R31][R30][R33] | high |
| Level 3 onboarding | "A new onboarding experience" teaching spreads before upgrading (2020). | Both | [R54] | high |
| Expiration navigation | Below the strategy; scroll right for further dates; LEAPS present per a secondary source. | Both | [R34] | high / medium (LEAPS) |
| Strike windowing | Strikes high→low, scroll up/down. | Phone | [R34] | high |
| **Focused vs side-by-side** | Gear: Focused = one side, simplified; Side-by-side = calls and puts together for multi-leg; select a heading to hide the other side and see more metrics. | Both | [R35] | high |
| **Bid = sell, Ask = buy** | Select the Bid column to sell, the Ask column to buy (mobile and Legend). | Both | [R35][R63] | high |
| **Default chain row** | Premium and % change; breakeven price and %; **chance of profit** at the mark. | Phone | [R34] | high |
| Configurable chain metrics | Gear → price (bid/ask/mark/last/net), volume (sizes/volume/OI), IV / breakeven / chance of profit, Greeks (Δ Γ Θ V ρ); two metrics at a time on mobile (secondary). | Both | [R36][R71] | high / medium |
| Natural vs mark pricing | Default "natural" (bid to sell, ask to buy); switch to mark via the pencil. | Both | [R34] | high |
| Tap-a-strike detail | Per-contract metrics [R36]; pre-trade "Simulate my returns" from the chain. | Phone | [R36][R38] | high |
| **Options Strategy Builder** | Categories single-leg, verticals, straddles/strangles, calendars; **outlook filter** bullish (green) / bearish (red) / volatility (purple) / neutral (grey); each card carries a P/L chart (dotted breakeven, green dot buy leg, red dot sell leg); browse by width or first-leg strike; select a **strategy price** → quantity + limit → review. | Phone | [R37] | high |
| **Simulated Returns** | P/L chart with a price dial and a time slider; $ vs %; pre-trade on chain/watchlist (mobile), post-trade on positions, on Legend since 2025; Bjerksund-Stensland / Black-Scholes. | Both | [R38][R68] | high |
| P/L chart at expiration | Breakeven includes premium; max profit/loss called out; adjusts as you change contracts. | Both | [R40] | high |
| Options Analyzer | Tick positions in/out; price chart + date slider; unrealized P&L pinned; aggregated Δ Γ Θ V; launch Open / Close / Roll. | Both | [R39] | high |
| Multi-leg orders | Single-order multi-leg since 2018; Legend: bid/ask clicks add legs, ≤4, per-leg mark, ratio editing. | Both | [R69][R33][R63] | high |
| Options order types | Limit default; market single-leg only 9:35–4, blocked on low OI/halts; stop-limit via the gear. | Both | [R45][R46][R64] | high |
| Options TIF / hours | GTC 90 days; 9:30–4 ET; 0DTE opens until 3:30 PM, then Robinhood "will attempt to close out any expiring, at-risk positions". | Both | [R34][R43] | high |
| **Position gestures** | Swipe right to buy/open, left to sell/close; pending: right = cancel, left = replace. | Phone | [R34] | high |
| Close / roll / exercise | Roll via Trade → Roll position (not for cash accounts); Exercise from the position with a pre-exercise "reasons not to exercise" review; auto-exercise ≥ $0.01 ITM; last-30-minute sale of at-risk contracts. | Both | [R41][R42][R54] | high |
| Assignment notifications | In-app + email + a "resolution flow" for early assignment. | Both | [R42][R54] | high |
| **Options alerts** | ITM/OTM crossings, contract ±20/50/100% today, total return marks, **early-assignment risk on dividends**, expiration reminders at 1 month / 1 week / today. | Phone | [R25] | high |
| Collateral display | Collateral shown on the underlying's detail page, held from pending. | Both | [R48] | high |
| Options holdings hub | Net performance chart; sorts; open positions bucketed (calls, puts, covered calls, CSPs, spreads) vs closed (closed / expired OTM / exercised / assigned). | Phone | [R49] | high |
| Position Greeks | Netted Δ Γ Θ V ρ per combined position. | Both | [R36] | medium |

#### Review / confirm

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Review contents | Order details with Edit; preset limit visible in extended hours; an "order sentence" is not documented. | Both | [R9][R2] | high (partial) |
| Disclosures on confirmation | Fees, info labels ("elevated volatility", "leveraged"), stop-order and queued-order disclosures, NBBO — inferred from what Auto-send skips. | Phone | [R57] | high |
| Submit gesture | Swipe up (mobile); button (web); hotkey / Auto-send (Legend). | Both | [R9][R63] | high |
| **Post-submit animation** | Confetti retired 2021-03-31; milestone-only "dynamic visual experiences"; CNBC: floating geometric shapes on a first trade. | Phone | [R56][R73] | high / medium |
| Haptics | Secondary only: vibration in sync with animation; gentle taps while an order processes. | Phone | [R72][R75] | medium / low |

#### Order status

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Where pending orders live | Account → Menu → History → **Pending**. | Phone | [R13] | high |
| Cancel / replace | Select order → Cancel or Replace → edit → Review → swipe up → Done / View order; only stop and limit replaceable, same type; blackout 9:25–9:30. | Both | [R13] | high |
| Status vocabulary | pending · partially filled · queued · filled. | Both | [R13][R14][R44] | medium |
| Fill notification | "Order status" push category; per-holding threads. | Phone | [R27][R26] | high |
| Watchlist pending badge | +/− icon on rows with pending orders. | Phone | [R21] | high |
| Legend Recent Orders widget | Open + last-24h closed; hover → Cancel; filters. | Desktop | [R59] | high |
| **Drag the pill on the chart / ladder** | Dragging LMT/STP "cancels the existing order and replaces it". | Legend + mobile chart | [R63][R18] | high |

#### Positions

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Stock position card | Shares, market value, average cost, portfolio diversity, today's return, total return. | Both | [R15] | high |
| Average cost | FIFO default; "don't use for tax reporting". | Both | [R12] | high |
| **Tax-lot selling** | Sell ticket → Tax lots → choose lots (date, S/L badge, cost, shares, est. gain/loss). | Phone | [R11][R10] | high |
| Holdings sorts | Last, % change, equity, today's return, total return, symbol, time to expiration. | Phone | [R49] | high |
| Legend Positions / Account Summary | Customizable columns; inline close / set stop / set limit / increase / exercise; portfolio value, buying power, P&L. | Desktop | [R59] | high |

#### Guardrails & education

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Options questionnaire | Investor profile: experience, objectives, income. | Both | [R53][R54] | high |
| PDT (abolished 2026-06-04); legacy PDT Protection | Warned on the 2nd/3rd day trade, required disabling on the 4th. | Both | [R50][R51][R52] | high |
| Buying-power deficit messaging | Shows the deficit and the actions to resolve it. | Both | [R54] | high |
| Risk labels on the ticket | "Elevated volatility", "leveraged", stop and queued-order disclosures. | Phone | [R57] | high |
| Market-order blocks (options) | Timing, unavailable pricing, low OI, halts; buying-power buffer. | Both | [R45] | high |
| Auto-send friction | Periodic disclosure re-acknowledgment; explicit accidental-trade warning. | Both | [R57][R63] | high |
| Expiration safety | 3:30 PM 0DTE close-out; last-30-minute sale; DNE cutoff 5 PM. | Both | [R43][R42] | high |
| Inline definitions | Not shown in-product; definitions live in the help center. | — | [R36][R69] | low |

#### Legend (desktop) specifics

| Feature | How it works | Source | Conf. |
|---|---|---|---|
| Layouts | Up to 9; drag/resize widgets; auto-save; open in a new tab. | [R60] | high |
| Widget roster | Chart, Scanner, Ladder, Snapshot, Watchlist, Positions, Recent Orders, Options Chain, Account Summary. | [R59] | high |
| **Widget linking** | Colour groups; the first watchlist, chain and chart are auto-linked; a symbol picked in one broadcasts. | [R62] | high |
| Hotkeys | Shift+B/S market; Shift+Opt+B/S limit at ask/bid; Shift+Opt+F flatten; Shift+Q quantity. | [R63] | high |
| Default order settings | Equities limit-or-market, qty 1, GFD, at natural; options limit, 1 contract, GFD. | [R64] | high |
| Chart-based order entry | Buy/Sell in the chart; "+" on the axis or right-click for conditional; drag pills; click an order to cancel/replace. | [R63] | high |
| Ladder widget | Equities/futures; rows = prices; open + daily P&L; L2; phone can remote-drive it. | [R59][R68] | high |
| Auras | Background keyed to session, portfolio up/down, BTC, or Focus. | [R65] | high |
| Gaps (secondary) | No bracket/OCO, no backtesting. | [R71] | medium |

**What a beginner-facing options paper school should study (Robinhood):** focused view by default,
side-by-side on demand · breakeven + chance of profit on every chain row · outlook-first strategy
picking with a P/L thumbnail and one strategy price · Simulated Returns wherever the contract appears ·
Bid = sell / Ask = buy as the multi-leg grammar (≤4 legs) · session-aware defaults with the preset shown
at review · directional gestures (open/close, cancel/replace, swipe up) · count-and-warn before an
irreversible threshold (legacy PDT Protection; 0DTE 3:30 close-out) · alerts that teach mechanics ·
celebrate milestones, never fills.

**Vocabulary (Robinhood):** *focused view* · *strategy price* · *natural price* · *session selector* ·
*widget linking* · *auto-send*.

### 1.2 Fidelity — mobile app, Fidelity.com, Active Trader Pro / Trader+ (read 2026-09-21)

Primary sources: Fidelity help pages, FAQs, the Trader+ Desktop User Guide (PDF 1116040.6.0), the
Oct-2025 "Introducing Fidelity Trader+" webinar transcript, ATP transcripts, and the in-house study of 15
redacted mobile frames (2026-09-05, "in-house frames" — treated as primary). Source IDs `[F#]`. Since
2025-09-25 **Fidelity Trader+** (desktop, web, and a Trader+ Mobile mode) is the active-trader platform;
ATP survives as "Classic". Login-gated tools could not be fetched; "not shown" says where we looked.

#### Discover

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| **Search sheet with recents** | One input, shortcut chips, recents with logo + price + change. | Phone | in-house frames (10) | high |
| Recent quote history | Synchronized list of recent quotes across devices. | Phone | [F5] | high |
| Watch lists | Multiple lists; Manage to edit; desktop lists sync across platforms, import from Excel, export CSV. | Both | [F27][F38] | high |
| Watchlist → linked tools | Double-click a symbol to send it to all linked tools. | Desktop | [F38] | high |
| Discover / Markets tabs | Research and ideas; Trader+ Mobile adds Markets (movers, sectors, yields). | Phone | [F27][F6] | high / medium |
| Scanner / Filters | Market, technical, options criteria; streaming; Bid/Ask from a filter row pre-fills a ticket. | Desktop | [F38][F11] | high |
| Price alerts | Four types: $ move, % since close, 52-week high/low, 20/50/200-day EMA cross; push / text / email; "notifications for all of your Fidelity orders and price triggers". | Both | [F38][F36][F37][F5] | high |
| Alert Manager | Active vs Triggered tabs; alerts and layouts sync across devices. | Desktop | [F38] | high |
| Heatmap | Watchlist or positions tiles by % change; position size weights tile size. | Desktop | [F38] | high |

#### Quote & chart

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| **Quote header above the ticket** | Ticker, name, last, change, bid/ask, as-of stamp; every field below depends on it. | Phone | in-house frames (1) | high |
| **As-of line under the form** | "As of 10:04:20 AM ET" under the last field, stock and option tickets alike. | Phone | in-house frames (9) | high |
| Quote tool seeds the ticket | "Click the Bid for sell orders and the Ask for buy orders"; day-range bar; "As of date will display if not today". | Desktop | [F38] | high |
| Streaming quote under the ticket | Expand/collapse below the ATP ticket. | Desktop | [F9] | high |
| Chart beside ticket, linked | Tools snap/dock in workspaces; up to 8 link groups; Level 2 depth. | Desktop | [F38] | high |
| Right-click the chart to trade | "Right-click anywhere on the chart to initiate orders"; a pricing line for limit/stop; open orders and average cost drawn on the chart. | Desktop / web | [F33][F38] | high |
| Chart templates sync to mobile | Drawings, indicators, timeframe reopen on the phone. | Both | [F38][F42] | high |
| Mobile quote page | Basic and advanced charting, volatility stats, Greek data. | Phone | [F27] | high |
| Trader+ Mobile mode | Toggle in settings: advanced charting, compact views, "fewer steps to trade". | Phone | [F6][F42] | high |

#### Stock ticket

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Ticket at rest | One column: quote → Buy/Sell → amount → order type → time in force; label above field. | Phone | in-house frames | high |
| **Buy / Sell segmented control** | Filled grey with a check; colour reserved for the CTA. Short / cover in a desktop dropdown, margin only. | Both | in-house frames (2); [F38] | high |
| **Shares \| Dollars unit toggle** | Picked in a sheet; desktop: shares to 3 decimals, dollars ≥ $1, dollar orders market or limit only. | Both | in-house frames (3); [F29][F38] | high |
| Order types | Market, Limit, Stop Loss, Stop Limit, Trailing Stop Loss ($/%), Trailing Stop Limit ($/%); the mobile sheet lists 8; options trailing stops $ only. | Both | [F46][F1][F3]; frames (5) | high |
| Limit-price sanity rule | A limit "cannot be more than 30% away from last trade price". | Both | [F3] | high |
| Conditional / bracket orders | Contingent (8 triggers), Multi-Contingent, OTO, OCO, OTOCO; Trader+ Action menu: Sell bracket (OCO), Buy with sell bracket (OTOCO). Mobile: not shown. | Desktop / web | [F4][F13][F38] | high |
| **Time in force** | Day (default; custom expiry to the half hour), GTC (180 days), FOK, IOC, On the Open, On the Close; the mobile sheet lists 5 with a "Learn about…" link; Trader+ adds **Day+** (regular + extended). | Both | [F1][F46]; frames (6); [F38] | high |
| Extended hours | 7:00–9:28 and 4:00–8:00 ET; limit only; no GTC. | Both | [F20][F47] | high |
| **Contextual fields** | Limit price and Conditions appear only when Limit is chosen; the ATP ticket "displays all relevant fields based on the security and order type". | Both | frames (7); [F9] | high |
| Follow bid / follow ask | A limit price can follow the streaming bid or ask until Preview, then freezes. | Desktop | [F29][F38] | high |
| **Estimated value sticky footer** | Live as you type, above a full-width Preview. | Phone | frames (8) | high |
| Preview → Place; skip-preview by agreement | Always a verification page; skip only after signing an agreement, with a caution. | Both | [F46][F9][F38] | high |
| Saved orders | Save on the ticket; saved orders sync; mobile Activity › Orders sends a saved order to the ticket. | Both | [F38][F42][F17] | high |
| **"Learn about…" in every picker** | Each picker sheet ends with one learn link. | Phone | frames (4) | high |
| Default order type | Not shown on mobile; configurable on ATP (Trade Settings). | Desktop | [F43] | medium |

#### Options

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Approval levels | Help page: L1 covered calls → L5 uncovered index; current FAQ tiers: Tier 1 (buy-writes, covered calls, rolling, long calls/puts, cash-covered puts, long straddles), Tier 2 (+ spreads ≤4 legs), Tier 3 (+ uncovered). | — | [F2][F12] | high |
| **Straddle view** | One expiration; strike down the centre, calls left, puts right; "Current price" divider; **orange rail on the ITM side**; base = strike + call bid/ask + put bid/ask. | Phone | frames (11) | high |
| **Expiration chips with (W) and days-to-expiry** | Chips above the chain, "(W)" weekly, "Expires in 4 days"; desktop Expiration Bar with W/Q marks and weekly/monthly/quarterly/all filters. LEAPS label: not shown. | Both | frames (12); [F25][F42] | high |
| Strike filters ±N | Desktop: 5 / 10 / 20 around the money or a custom range; multi-leg views filter ATM/ITM/OTM. Mobile ±N: not shown. | Desktop | [F25][F32][F42] | high |
| **Scroll-out columns** | Strike pinned; scrolling left grows the call side: last, volume, OI, IV, time/intrinsic value, then Δ Γ Θ V ρ; right mirrors for puts. | Phone | frames (13, 15) | high |
| Greeks / IV columns (desktop) | Gear → Columns; volume/OI histograms; ex-dividend and earnings icons. Probability column on the chain: not shown (only in multi-select analytics). | Desktop | [F38][F25][F11] | high |
| **Tap-to-trade from the chain** | Bid = Sell to Open, Ask = Buy to Open at that price; the ticket opens on that contract. | Both | frames (14); [F38][F9] | high |
| **Multi-select builder** | Click Ask (green B) / Bid (red S) up to four legs (L1–L4); the chain shows breakeven, max profit, max loss, **probability of profit** and per-leg greeks; Trade opens the prefilled multi-leg ticket. | Desktop | [F38][F42] | high |
| Options ticket (mobile) | Strategy row (Calls / Puts), one **leg card** (Action, Quantity, Expiration, Strike, Call \| Put) + "Add leg"; **Bid · Mid · Ask chips**; price prefilled from the ask on a buy; Type: Margin; three buying powers. | Phone | frames (16, 17, 20) | high |
| **Action vocabulary** | Buy to Open / Buy to Close / Sell to Open / Sell to Close on every options ticket. | Both | [F2][F9] | high |
| Options order types / TIF | Market, Limit, Stop Loss, Trailing Stop ($); Day, GTC, FOK, IOC; stops trigger off bid (buy) / ask (sell). | Both | [F2][F1] | high |
| Multi-leg ticket (desktop) | Up to 4 legs on a net basis; Strategy dropdown: Buy Write, Spread, Straddle, Strangle, **Roll**, Custom; net Bid/Mid/Ask row; net price can follow bid/mid/ask; at-expiration profit, loss, breakeven. | Desktop | [F29][F38][F9] | high |
| Strategy templates on the chain | Calls, Puts, Calls & Puts, Butterfly, Buy Write, Calendar, Collar, Combo, Condor, Diagonal, Iron Condor, Ratio, Straddle, Strangle, Vertical. | Desktop | [F25][F32] | high |
| **Live estimate ×100** | The footer turns "$6.40" into "$640.65" before Preview. | Phone | frames (18) | high |
| Trade Analyzer (Trader+ web) | Estimated max gain, max loss, probability of profit before placing. | Web | [F32] | high |
| P/L calculator and payoff diagram | Legs from the chain; crosshair graph; breakeven line; adjust price, volatility, days to expiry; greeks table; trade from the calculator. | Desktop | [F39][F40][F38][F34] | high |
| Probability calculator | Above / below / between on a date; 1–3 SD. | Desktop | [F40][F11] | high |
| Strategy Evaluator / Strategy Builder | Compare a single-leg vs up to two multi-leg strategies; a step-by-step builder (Beginner \| Intermediate). | Desktop | [F51][F16][F34][F7] | high / medium |
| **Roll ticket** | Close an existing option and open a new one "using the same trade ticket", 1:1; 1-click roll for singles and 2-leg spreads; mobile "ability to roll options". | Both | [F9][F7][F38] | high |
| Exercise | Auto-exercise ≥ $0.01 ITM; manual exercise and do-not-exercise by phone before 4:15 PM; no online exercise shown. | — | [F26][F12] | high |
| Close from the position | Sell to close / buy to close; Option Summary Bid/Ask prefills the closing ticket. | Both | [F52][F38] | high |

#### Review / confirm

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| **Review as a sentence** | "Buy to open 1 $230 NVDA call · Sep 16, 2026"; a plain-language warning banner above; Last / Bid / Ask rows; as-of; Place order. | Phone | frames (19) | high |
| Preview lets you edit / cancel | Edit or cancel before submitting. | Both | [F20] | high |
| Confirmation | Order number + details; printable; trade confirmations next business day. | Both | [F20][F21][F46] | high |
| Warnings / disclosures | Options risk statement on every options page; conditional/trailing orders carry a "not held" statement. Market-order-on-options copy: not shown. | Both | [F13][F12] | medium |
| Skip preview caution | "you will not be given the opportunity to review the order again". | Desktop | [F9] | high |

#### Order status

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Where orders live | Fidelity.com Portfolio › Activity & Orders; mobile Portfolio › **Activity › Orders** (saved orders alongside); Trader+ Tools › Orders. | Both | [F20][F42][F17][F33] | high |
| Statuses | open, filled, canceled, pending; ATP filters **Verified Canceled, Open, Filled, Partially Filled**. Expired / Rejected labels: not shown. | Both | [F18][F19][F43] | high |
| **Attempt to Cancel** | A cancellation order number that "does not necessarily mean the order has been cancelled"; Trader+ one-click C with no confirm prompt. | Both | [F18][F38] | high |
| **Change order = Attempt to Cancel and Replace** | Change quantity, type, price, TIF, conditions; extended hours: quantity only; Trader+ R button. | Both | [F20][F18][F38] | high |
| Cancel-not-guaranteed warnings | "Fidelity cannot be responsible for any executed orders that you fail to cancel." | Both | [F20][F1][F21] | high |
| Fill details / price improvement | Expand a row for executions, lots, a "$" price-improvement icon; a subgrid when an order fills over lots. | Desktop | [F19][F42] | high |
| **Create Duplicate / Create Opposite** | Right-click an order to duplicate or flip buy↔sell to stage the exit. | Desktop | [F38][F42] | high |
| Notifications on fill | "Receive notifications for all of your Fidelity orders and price triggers"; cancellations too. | Phone | [F5][F20] | high |
| GTC expiry alert | ATP alerts on GTC orders nearing expiration. | Desktop | [F19] | medium |
| Order history depth | Nearly five years; Closed Positions to ten. | Desktop | [F10][F30] | high |

#### Positions

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Positions columns | Symbol, quantity, price, changes, cost basis; change since close / since purchase; table vs chart views; **Save View**. | Web | [F23] | high |
| Customizable columns | Add / remove / reorder; pin; wash-sale "W"; export CSV; Today's G/L, Total G/L. | Desktop | [F30][F38][F45] | high |
| Row Action menu | Trade, Research, **View lots**, Edit your cost, Find news. | Both | [F23][F45] | high |
| Sell from the row | Ask on a row prefills a buy, bid a sell, "click in the Amount field" to sell all. | Desktop | [F38] | high |
| Tax lots / specific shares | Choose Specific Shares (≤200 lots), FIFO default sort or term × cost; Trader+ Lots button with a checkbox per lot. | Both | [F22][F38][F24] | high |
| **Option Summary** | Group by expiration, strategy or underlying; strategy, quantity, expiration & strike, margin requirement, values; Trader+ adds net greeks, an orange ITM line, leg expand. | Both | [F15][F38] | high |
| Close / roll from a position | Right-click, action menu, or Bid/Ask on the strategy row "to easily close, trade, or roll a strategy". | Both | [F38][F7] | high / medium (mobile) |
| Positions on the chart | Open orders and average cost drawn on the chart; tax-lot opens/closes as diamonds. | Desktop | [F38][F10] | high |

#### Guardrails & education

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Options agreement gate | Approval level on file per trade; strategies shown "depend on the account's option approval level". | Both | [F2][F9] | high |
| **Learn links inside pickers**; "i" on indicators | Explanation at the point of choice. | Both | frames (4); [F33][F38] | high |
| Warning banner on review | Plain-language banner above the order sentence. | Phone | frames (19) | high |
| Buying-power context | Three buying powers and Type: Margin on the options ticket; Day Trade Buying Power on Balances. | Both | frames (20); [F38] | high |
| Day-trade counter | Web Balances only per a secondary source (page unreachable). | Web | [F57] | low |
| Skip-preview requires an agreement | Prompted to complete an agreement first. | Desktop | [F38] | high |

#### Active Trader Pro / Trader+ specifics

| Feature | How it works | Source | Conf. |
|---|---|---|---|
| Directed Trade ticket | One ticket + depth of book + time and sales; routes; Day+ and IOC for extended hours. | [F10][F8][F50] | high |
| Options Trade Builder / multi-leg ticket | Predefined strategy tickets, Custom ≤4 legs, streaming quotes, at-expiration P/L. | [F10][F9][F38] | high |
| **Trade Armor** | Chart-centric ticket: position as "$" at average cost, open orders as flags; **drag a flag to cancel/replace**; brackets (OTOCO); live estimated G/L. | [F10][F11][F43][F44] | high |
| Multi-Trade ticket | Up to 50 staged orders, submit 20 at once. | [F9][F10] | high |
| Orders tool | C / R buttons, multi-select cancel, saved orders tab, execution subgrid. | [F19][F38] | high |
| Workspaces | ≤4 per layout, ≤5 layouts, multi-monitor, autosave; 8 link groups. | [F38][F8][F10] | high |
| Trade shortcuts | "Sell at Market", "Buy Limit at Bid", options "Sell to Open Limit at Mid". | [F38] | high |
| Cross-device continuity | Start a trade on one device, complete on another; saved orders, layouts, alerts sync. | [F6][F48] | high |
| Not in ATP (secondary) | No paper-trading simulator. | [F14] | low |

**What a beginner-facing options paper school should study (Fidelity):** price before form (quote header
+ as-of) · strike is the spine (centred, mirrored, ITM rail, greeks scroll out) · the chain is the door
(Bid = Sell, Ask = Buy opens a prefilled ticket) · say the intent (Buy to Open / Sell to Close) · teach ×100
before Preview · review as a sentence with three context rows and a warning above · explain at the point of
choice · days-to-expiry in words · analytics before the order (breakeven, max P/L, probability of profit
as legs are picked) · honest cancel semantics ("Attempt to Cancel", "Verified Canceled") and one-click
Create Opposite.

**Vocabulary (Fidelity):** *straddle view* · *time in force* · *OTOCO* · *Verified Canceled* · *roll*.

### 1.3 Schwab thinkorswim — desktop, web, mobile (read 2026-09-21)

Primary sources: the thinkorswim Learning Center manual and FAQ (`toslc.thinkorswim.com`) and Schwab.com
product and learn pages. Source IDs `[T#]`. **Where the public record is thin:** release notes render by
JavaScript (no text); most Schwab "thinkorswim tutorials" are video-only; there is no text manual for
mobile or web, so those rows lean on product pages and search-indexed text (medium/low). Read, per the
red-team amendment, for what #2017 and `docs/research/trading-desk-ux.md` did not already cover:
**paperMoney**, the **Analyze** tab, and **roll**; cockpit rows are kept short.

#### Discover

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Symbol selector per tab | Every tab (Trade, Charts, Analyze, Alerts) has its own selector; the Charts one browses categories. | Desktop | [T-GS][T-CH] | high |
| Eight-tab IA | Trade · Analyze · Monitor · Scan · MarketWatch · Charts · Tools · Education, each with subtabs. | Desktop | [T-GS] | high |
| Left sidebar "command center" | Balances and buying power live; gadgets (watchlist, chart, Level II, Trade Flash, Account Info). | Desktop | [T-GS][T-FAQN] | high |
| Watchlists | Public lists ("Lovers and losers", "Top 10", industry), a portfolio watchlist; custom columns via thinkScript; sync to web/mobile. | All | [T-Q][T-WLG][T-WEBGS][T-MOB] | high |
| **Watchlist linking (colour clipboard)** | A colour links a list to other components so clicking through drives the chart, Level II, Dashboard. | Desktop | [T-Q][T-L2] | high |
| Dynamic (scan-driven) watchlists | Save a Stock Hacker scan as a watchlist; alert when results change. | Desktop | [T-Q][T-SH] | high |
| Stock / Option / Spread Hacker | Up to 25 filters (stock, option, fundamental, thinkScript study); Spread Hacker scans verticals, butterflies, condors, calendars, diagonals. | Desktop | [T-SH][T-OH][T-SCAN] | high |
| Alerts | Click a value (e.g. Bid) → Condition · Notify with · Options; sound, email, SMS, push; expiry, reminders, "reverse crossover alerts"; study and drawing alerts. | Desktop → mobile | [T-AL][T-SETUP][T-CHT] | high |
| Today's Options Statistics | IV/HV with 52-week percentile, Sizzle Index (volume vs 5-day average), put/call ratio, below the chain. | Desktop / web | [T-STATS][T-AP][T-WEB] | high |

#### Quote & chart

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Underlying quote header | Last, net change, bid/ask with exchange letter, sizes, volume, O/H/L; expands to yield, P/E, beta, put/call ratios; click ask to buy, bid to sell. | Desktop | [T-AP] | high |
| Level II gadget | Best bid/ask by exchange; click a bid to add a sell, an ask to add a buy. | Desktop (web per secondary) | [T-L2][T-BRWEB] | high / medium |
| Charts | 400+ studies, strategies with back-test reports, thinkScript, drawing sets (sync to mobile), grid layouts. | Desktop / mobile | [T-CH][T-ST][T-CHT][T-DESK][T-MOB] | high |
| **Orders, positions and trades drawn on the chart** | "Show orders"; position pills (size, avg price; options: size, strike, C/P) clickable for P/L Open, BP Effect; "Show trades". | Desktop | [T-CHG] | high |
| Order entry from the chart | Right-click a price → buy / sell / buy custom / sell custom; drag an unfilled order to a new level. | Desktop | [T-AOT][T-CHG] (search-indexed) | medium |
| **Probability cone** | `ProbabilityOfExpiringCone` study, 68% default (1 SD), 95/99 selectable; future earnings/dividend dates in the expansion area. | Desktop | [T-CHT] | high |
| **Active Trader ladder** | Price ladder with Buy Orders / Bid Size / Price / Ask Size / Sell Orders; hover shows "BUY +1 STOP"; click above market = stop, at/below = limit; working orders as draggable bubbles; × cancels; study values marked in the price column. | Desktop | [T-ATO][T-ATL][T-ATE] | high |
| Big Buttons | Buy/Sell Market, Cancel (All / Buy / Sell), Reverse, **Flatten**; quantity presets; templates (Single, OCO, Trigger with 1–3 brackets); Auto send. | Desktop | [T-ATO] | high |
| Active Trader safeguards | Rate-limit order submission, auto-centre, submit on down-click, reset template after an order. | Desktop | [T-SETUP] | high |
| Active Trader on mobile | Not shown on any Schwab page. | Mobile | — | low |

#### Stock ticket (Order Entry)

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Opening the ticket | Bottom of the screen on BUY / SELL / a bid or ask; defaults 100 shares / 10 contracts (changeable). | Desktop | [T-OET][T-FAQN][T-SETUP] | high |
| Ticket fields | Side, Qty, Symbol, Price, Order (type dropdown swaps the template), TIF, **Order Rules** gear; Saved Orders tab. | Desktop | [T-OET][T-AOT] | high |
| **Price lock** | Price follows the mark until locked; +/− steps. | Desktop | [T-OET] | high |
| Order types | Market (DAY only), Limit, Stop, Stop-limit (trigger basis trade / mark / bid), Trailing stop and trailing stop-limit ($ / % / tick, linked to LAST/BID/ASK/MARK…), MOC / LOC (before 3:45), **Walk Limit** (options: start → end price stepping every 2–60 s). | Desktop | [T-OET][T-OT][T-TSL][T-WL][T-WLA] | high |
| Time in force | DAY, GTC, EXT, GTC_EXT, AM (7:00–9:25), PM (4:05–8:00), EXTO / GTC_EXTO (overnight, eligible symbols, ≤6 months). | Desktop | [T-OET][T-OT] | high |
| **Advanced orders** | Single · OCO · 1st Triggers Sequence · 1st Triggers All · 1st Triggers OCO / 2 OCO / 3 OCO · Blast All · Pair; "Buy custom … with OCO Bracket" preloads a bracket. | Desktop | [T-OT][T-ATE] | high |
| **Create duplicate / create opposite** | Right-click an order; Working Orders shows trigger (key) and OCO (link) icons with bracket lines. | Desktop | [T-ATE] | high |
| **Order Rules** | Submit and cancel rules by date/time, underlying price, or a thinkScript study condition; a description box summarizes; tax-lot method (FIFO, LIFO, high/low cost, best tax, specified lot). | Desktop | [T-OET][T-COND] | high |
| Order defaults | Per asset class: default type, stop basis, quantity, increment, TIF. | Desktop | [T-SETUP] | high |
| Autosend | Shift-click or the Active Trader toggle skips the confirmation — "you will not see any warnings, cost disclosures, or informational messages". | Desktop | [T-SETUP][T-ATO] | high |
| Web ticket | Buy/Sell → a trade table at the bottom with quantity, type, expiration, contingencies, advanced orders, **beside a P/L graph**; Review → Send. | Web | [T-WEBGS][T-WEB][T-POT][T-BRWEB] | high / medium |
| Mobile ticket | "Advanced order creation with conditions"; tax-lot orders; tap ask → editor → Review (underlying quote, option quote, details) → Send. | Mobile | [T-APPSTORE]; search-indexed | medium |

#### Options

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Option chain layout | Collapsible expiration headers with days to expiration and multiplier; calls left, puts right, strikes down the middle; ITM rows shaded. | Desktop | [T-AP][T-FAQN] | high |
| **Strikes selector** | Default 4; modes: number of strikes · strike percentage · **standard deviation** (IV-based). | Desktop | [T-AP] | high |
| **Layout column presets** | Predefined sets or custom; Δ Γ Θ V set; "Mark, Probability OTM, Delta"; Probability ITM via the header menu. Full preset list: not shown. | Desktop | [T-FAQN][T-CCS][T-DP] | high / low |
| Expiration filters | Weekly / quarterly / mini availability toggles; a LEAPS filter: not shown. | Desktop | [T-SETUP] | medium |
| Click bid/ask to trade; right-click → Analyze | Ask = buy, bid = sell into Order Entry; right-click a strike → buy/sell or "Analyze buy trade / Analyze sell trade". | Desktop | [T-AP][T-VS][T-EXIT] | high |
| Spread entry | Right-click → a spread menu (Vertical…); Position Statement groups by strategy; exact dropdown list not shown; mobile Spread box Single / Vertical. | Desktop / mobile | [T-VS][T-PS][T-SCAN]; search-indexed | medium |
| **Analyze › Add Simulated Trades** | The chain layout reused: click "Ask X" / "Bid X" to simulate; rows land in Positions and Simulated Trades and Price Slices; a date picker ages the position. | Desktop | [T-AN] | high |
| **Analyze › Risk Profile** | X = price, Y = P/L; expiration curve + "today" curve (IV-based); price slices with probability; date and volatility steppers. | Desktop (web: side-by-side risk profile and chart) | [T-AN][T-VS][T-WEB] | high |
| **Analyze › Probability Analysis** | Y = price, X = days; 68.27% default range; slices with expiry probabilities. | Desktop | [T-AN] | high |
| Analyze › thinkBack / Earnings | Rebuild a chain on a past date and back-trade; eight quarters of earnings moves with IV/HV and the ATM straddle. | Desktop | [T-AN] | high |
| Rolling | Right-click a position and drag over the legs to close/analyze/roll; a condor can close as verticals, strangle, combo or legs. | Desktop | [T-PS] | medium |
| **Strategy Roller** | Automates covered-call rolls: strike by offset or delta, target expiration, days-before-expiry trigger, limit at mid; events in Today's Trade Activity; push/email on roll events. | Desktop | [T-SR][T-TTA][T-SETUP] | high |
| Exercise / do-not-exercise | Auto-exercise ≥ $0.01 ITM; DNE is a support request; in-platform Exercise menu: not shown. | All | [T-EXA] | high (policy) / low (UI) |
| **Position greeks + ITM badge** | Δ Γ Θ V live per option position, a days-to-expiration reminder, an "ITM" icon. | Desktop | [T-PS][T-SETUP] | high |
| **Beta weighting** | Checkbox + benchmark symbol converts deltas to the benchmark. | Desktop | [T-BW][T-A&P] | high |
| Spread margin rule | "Spread trading must be done in a margin account"; IRA restrictions. | All | [T-AP][T-ACCT][T-SA] | high |

#### Review / confirm

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| **Confirm and Send → Order Confirmation Dialog** | Edit, delete, send or save; the dialog is where warnings, cost disclosures and informational messages appear. | Desktop | [T-OET][T-SETUP][T-FAQN] | high |
| BP Effect | "Impact of the position on the account's available trading capital"; dialog rows not enumerated verbatim. | Desktop | [T-PS] | medium |
| Order description | Order Rules window summarizes the order in a sentence; expected price shown never / single orders / always. | Desktop | [T-OET][T-SETUP] | high |
| Show / skip confirmation | Toggles; Autosend skips it with an explicit risk note. | Desktop | [T-SETUP][T-ATO] | high |
| Buying-power validation | The greater of intraday margin and stock buying power decides; paperMoney "may not reflect all intraday margin features". | Desktop | [T-FAQG] | high |
| Web / mobile review | Web "Review, then Send"; mobile Review shows underlying quote, option quote, details, then Send. | Web / mobile | [T-POT]; search-indexed | high / medium |
| Drag-to-modify re-confirms | Dragging a ladder bubble reopens the confirmation unless Auto send. | Desktop | [T-ATE] | high |

#### Order status

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| **Today's Trade Activity sections** | Working Orders · Filled Orders · Canceled Orders · Rolling Strategies, each with a count; sticky headers. | Desktop | [T-TTA][T-A&P] | high |
| Columns | Time, Order ID, Description, Status; "More fields" adds exec time, price, type. | Desktop | [T-TTA] | high |
| Cancel | Right-click → Cancel; batch: all working / DAY / GTC / buying / selling / one underlying; ladder ×; Big Buttons Cancel All. | Desktop | [T-TTA][T-ATE][T-ATO] | high |
| **Cancel / replace** | Right-click → "Cancel/replace order…" reopens Order Entry; drag on the ladder; statuses Replacing / Replaced. | Desktop | [T-TTA][T-ATE][T-OS] | high |
| **Status vocabulary** | Submitting · Wait trg · Wait cond · Wait stop · Wait rev · Queued · Accepted · Pending · Working · Filled · Rejected · Expired · Not sent · Replacing · Replaced · Canceling · Canceled · Done · TLTC ("too late to cancel") · U R OUT. | Desktop | [T-OS] | high |
| Partial fills | Multi-fill orders collapse into one row with an expand arrow; "show average fill prices". | Desktop | [T-TTA] | high |
| Fill notifications | Email or push for "Working orders filling", alert triggers, rolling events. | Desktop → mobile | [T-SETUP] | high |
| Order history | Monitor › Account Statement; mobile Account History (Sep 2025). | Desktop / mobile | [T-MON][T-FAQN][T-APPSTORE] | high / medium |

#### Positions

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| **Position Statement columns** | Instrument, Qty, Days, Trade Price, Mark, Mark change, P/L %, **P/L Open, P/L Day, P/L YTD**, Margin Req, BP Effect (+ greeks). | Desktop | [T-PS] | high |
| P/L definitions | P/L Open = since inception; P/L Day = vs previous close; P/L % = open ÷ execution price; P/L YTD per underlying. | Desktop | [T-PS] | high |
| Trade Price vs Cost | FIFO average vs tax-lot average incl. wash-sale adjustments; after exercise/assignment Trade Price = strike, Cost = strike ± premium. | Desktop | [T-FAQG] | high |
| Grouping | By type / industry / capitalization / account, or by option strategy; merge similar groups. | Desktop | [T-PS] | high |
| Close from a position | Right-click → closing order, analyze the close, tax lots; partial close of a complex by dragging over legs. | Desktop | [T-PS][T-EXIT] | high |
| Account Info gadget | Cash, option buying power, net liq, day trades; privacy switch masks digits. | Desktop | [T-AI][T-FAQA][T-TOS] | high |
| Web Positions panel | Account Summary with a **Live / paperMoney toggle**, buying power, cash, daily P/L; Activity and Positions; watchlist. | Web | [T-WEBGS] | high |
| Mobile positions | Multi-account; percent-change columns. | Mobile | [T-MOB][T-APPSTORE] | medium |

#### Guardrails & education

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| **Options approval as a visible grid** | Account Features shows options status Full / Covered Calls / Long / Spreads / None with green/red indicators and a link to apply. | All | [T-ACCT][T-SA] | high / medium |
| Applying / upgrading | Schwab.com profile → Margin & Options → Apply for a level; decision within three business days. | Web | [T-APPLY] | high |
| **paperMoney — what it is** | "Practice trading on thinkorswim using real-time market data" with $100,000 virtual buying power; equities, options, futures, forex; "market activity, trade executions, transaction costs … are simulations only". | All | [T-PT][T-TOS] | high |
| **paperMoney — one switch** | Desktop login "flip the switch from Live Trading to paperMoney"; web toggle in Account Summary; mobile built in; accounts begin "D-". | All | [T-TOT][T-WEBGS][T-APPSTORE][T-FAQA] | high |
| **paperMoney — reset / adjust** | Position Statement › Adjust Account → Set Account Cash to · **Reset All Balances and Positions** · Account Margin Type. | Desktop | [T-FAQA] | high |
| paperMoney — limitations, stated | "May not reflect all intraday margin features"; synchronized watchlists live-only; a data delay is claimed by third parties, not stated by Schwab. | All | [T-FAQG][T-SETUP][T-PT] | high / low |
| **paperMoney as the first options step** | Schwab's own guide: buy a call in paperMoney on web, then monitor "P/L Open" and "Days", with exit heuristics (+100% / −50%). | Web | [T-POT] | high |
| Guest Pass | 30 days without an account. | All | [T-TOS] | high |
| Learning Center, in-app courses, coaching webcasts | thinkManual, thinkScript, glossary, FAQ; Education › Options › Courses. | Desktop / web | [T-GS][T-POT][T-DESK] | high |
| Risk warnings in-flow | Confirmation carries warnings and cost disclosures; Autosend requires accepting their loss; stop pages carry "no guarantee". | Desktop | [T-OET][T-ATE] | high |
| Day-trading guardrail | Margin + $25,000 equity; Day Trade Buying Power shown. | All | [T-TOS][T-FAQG] | high |

#### Web and mobile specifics

| Feature | How it works | Platform | Source | Conf. |
|---|---|---|---|---|
| Web IA | Four-item nav: Positions · Trade · Charts · Scans; Account Summary + watchlists in the middle; "tabless" — ticket and P/L graph in one window. | Web | [T-WEBGS][T-WEB][T-BRWEB] | high |
| Web option chain | Expand an expiration, calls left, pick a strike, select the Ask → Order Entry at the bottom; preconfigured strategies "in a click". | Web | [T-POT][T-WEB] | high |
| Mobile option chain | Choose spread, number of strikes, exchange; gear → Columns Editor (greeks, theoretical pricing); tap ask to buy. | Mobile | search-indexed | medium |
| Mobile "Quick Trade" | "Buy or sell in a few quick taps." | Mobile | search-indexed | medium |
| Mobile sync | Watchlists, scans, drawings, settings. | Mobile | [T-MOB] | high |
| What desktop keeps to itself | Analyze suite, Order Rules, Strategy Roller, Active Trader, Walk Limit, Spread Hacker are desktop-only in the record. | — | [T-AN][T-SR][T-ATO][T-WEB][T-TOS] | medium |

**What a beginner-facing options paper school should study (thinkorswim):** paperMoney is the same UI one
switch away · reset and re-fund is a first-class control · paperMoney is honest about its own fiction ·
Risk Profile = two curves and price slices · simulate with the same gesture as the trade (Ask X / Bid X)
· probability lives in the chain · Confirm-and-Send is where the warnings live and skipping it is an
explicit risk acceptance · Position Statement teaches P/L vocabulary (P/L Open vs Day, Days, ITM badge)
· the order-status vocabulary is exhaustive and visible · gated capability with a visible door
(Full / Covered Calls / Long / Spreads / None).

**Vocabulary (thinkorswim):** *BP Effect* · *mark* · *price slice* · *1st Triggers OCO* · *Strategy Roller*.

---

## 2. Robinhood engagement mechanics — the interrogation

**Transfer rule (added after the red-team pass, 2026-09-21):** a mechanic whose doctrine check fails R5 — it trains a habit the real-money endgame must unlearn (Anginer–Piza–Ray–Xu, *Trading Simulations and Real Money Outcomes*, J. Behav. Finance 25(4): the most active, most risk-taking simulator users open real accounts, trade more, and underperform; Barber–Huang–Odean–Schwarz 2022: Top-Movers herding → −4.7% 20-day abnormal returns) — is **skip regardless of its paper-learning value**. The paper school is a rehearsal for real capital, not a place where bad habits are cheap. Corollary for the Friday recap and renown: surface **portfolio-level** performance ahead of best-trade highlights — "best trade" fanfare is the stock-level over-inference that paper simulators were measured to teach.

**Scope note.** Primary sources read in full text (PDFs extracted locally): the Massachusetts Securities Division complaint (Dec 16 2020, E-2020-0047), the MA consent order (Jan 18 2024), FINRA's AWC (June 30 2021), and the SEC's DEP Request for Information (Aug 27 2021, Rel. 34-92766); plus Tierney's *Investment Games* draft (AALS 2022), Langvardt & Tierney *On "Confetti Regulation"* (131 Yale L.J.F. 717), Barber–Huang–Odean–Schwarz (J. Fin. 2022) via abstract + Berkeley Haas Q&A, the FCA's 2022 and 2024 gamification research, and Robinhood's own newsroom/help-center pages for every feature named. UX teardowns (GoodUX/Appcues, Built for Mars, IXD@Pratt, Google Design) are **secondary** and labelled so. CNBC, NYT, Axios, Medium and Wiley pages returned 403/451; where I cite them the content comes from search summaries or from documents that quote them, and I say so. "Not located" means I could not find a source, not that it doesn't exist.

**Doctrine keys used in the ledger:** R1 fun-is-the-engine · R2 positive-over-negative · R3 celebration-pairs-with-explanation · R4 fog-of-war test (does misuse cost capital or shape gambling-like behaviour?) · R5 honest transfer to real money · A11y hue-never-alone.

**One framing finding before the table.** Every regulator and academic source converges on the same distinction, stated cleanly by Tierney: the design features are not objectionable because they are "digital, flashy, or appeal to children"; they are objectionable **when they shift the client's baseline propensity to trade** ("a call to action") — the harm is the extra trade, not the confetti (Tierney-IG §II; YLJ). The Massachusetts order enforces exactly that line: confetti is banned only as "celebratory imagery **directly tied to frequency of trading**" (MA-O §VIII.C.d). That is the hinge for a paper school: any mechanic here is safe iff its reward variable is *not* trade count.

---

## Mechanics ledger

| # | Mechanic | Surface | Psychological lever | Real-money harm (finding) | Paper-learning value | Doctrine check | Call | Conf. | Falsifier (dated, observable) | Sources |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **First-trade confetti** (2016 → Mar 31 2021) — confetti rained after first trade; MA alleged "each time a customer makes a trade" | Post-order screen | Variable-reward *completion* celebration; operant reinforcement of the *act* of trading regardless of outcome | MA complaint ¶41 ("instilling a sense of celebration and accomplishment as a result of simply buying or selling"); MA-O ¶31(vi) and §VIII.C.d bans "confetti… or other celebratory imagery directly tied to frequency of trading"; SEC-RFI names "celebrations for trading"; FCA-22 lists "celebratory messages and falling confetti." No isolated causal study of confetti alone located — Tierney: the harm is the propensity-to-trade shift, not the animation. | If the trigger is re-pointed: celebrate *first disciplined entry* (defined stop, sized position), *first profit-take at plan*, *first bot deployed*, *first chain read* — never "first trade." | R1 pass; R2 pass; **R3 fail as shipped** (no adjacent explanation); **R4 fail if tied to trade count**; R5 fail (habit = trade = reward). | **Adapt**: keep the fanfare, change the *trigger variable* from order-count to plan-adherence; always with a one-line "what just happened." | High | If, by 2027-03, the app's celebration log shows >20% of fanfares fired on events with no plan-adherence predicate, the adaptation has drifted back to Robinhood's trigger. | MA-C ¶41; MA-O ¶31, §VIII.C; SEC-RFI p.6–7; Tierney-IG; YLJ; FCA-22 |
| 2 | **Post-confetti milestone animations** (Mar 31 2021 →): "rotating golden circle / neon lightning bolt," per-milestone visuals for first investment, deposit, Gold sign-up, cash mgmt, referral; Bessel: "moments of pause, moments of understanding" | Milestone screens | Same completion reward, lower arousal; "measured in pace" | No finding on the replacements. MA 2024 order still bars imagery "tied to frequency of trading" for MA accounts; YLJ calls the swap the "whack-a-mole" proof that feature bans fail. | Model of what a *calmer* celebration looks like; the "pause/understanding" framing is literally R3 in Robinhood's own words. | R1 pass; R3 **pass in intent** (Robinhood says "understanding") but no explanatory text confirmed; R4 pass if not trade-count-triggered. | **Borrow** the register ("pause + understanding"), pair with copy. | Med | If Robinhood re-adds high-arousal per-trade fanfare before 2027 without regulator action, the "calm" register was cosmetic, not a durable norm. | RH-Celebrate; AP/Spokesman Mar 31 2021; CNBC Mar 31 2021 (search summary); YLJ |
| 3 | **Haptic feedback** synced to animation (rocket for Fractional Shares announcement; haptic tap on trade confirm) | Announcements; order submit | Multisensory salience; surprise/delight; embodied confirmation | No regulator finding names haptics. Tierney/SEC-RFI/MA silent on haptics (grep confirmed). *Secondary*: GoodUX says delight came from being "unnecessary for functionality." | Haptic as *confirmation of a deliberate action* (order filled, stop placed) is fine; haptic on *price ticks* would be a slot-machine cue. | R1 pass; R3 n/a (needs adjacent text anyway); R4 pass if event-level, fail if tick-level. | **Borrow** for discrete events; **skip** for continuous price motion. | Med | If a 2027 user study shows members checking the app more often after enabling haptics on non-order events, the "event-only" line was too permissive. | GoodUX/Appcues (secondary); search summary re confirm tap |
| 4 | **Live-updating numbers / odometer roll** ("jiggle"; NYT: "click into place like slot machine images") | Home portfolio value, quote page | Salience + intermittent reinforcement; anchoring on P/L in motion | SEC-RFI "visual cues"; FCA-22/24 "flashing prices" raise riskiness more for low-financial-literacy users; NYT slot-machine framing (via Fool/BU quoting Popper). *Secondary*: Pratt 2025 praises the "odometer effect" for situational awareness. | Almost none for learning; live P/L is the thing every trading coach says to hide. The learning surface is the *chain* and the *plan*, not the ticking number. | **R4 fail** (shapes checking behaviour); R5 fail (real-money version is the classic tilt trigger). | **Skip** on the home screen; allow an explicit "watch live" mode in the ticket only. | High | If, by 2027, members with live-ticking portfolio value show *lower* trade frequency than those without, the lever isn't doing what the FCA found. | SEC-RFI; FCA-22; FCA-24; Fool (Oct 2020, quoting NYT/Alphacution); Pratt-25 (secondary) |
| 5 | **Swipe-up to submit** | Order ticket | Frictionless commit disguised as friction: a gesture that *feels* deliberate but is one motion | No regulator finding. Tierney argues for *transactional frictions* (cool-offs, speed bumps) as the underused remedy. *Secondary*: teardowns call it "deliberate friction." | A physical commit that could be *gated on a checklist* (stop set? size ≤ risk cap? thesis typed?) turns the gesture into the school's ritual. | R1 pass; R3 pass if the swipe surface carries the plan summary; R4 pass. | **Adapt**: swipe only becomes enabled once the plan fields are filled. | Med | If members complete the plan fields with placeholder text >30% of the time in 2026 logs, the gate is theatre. | Tierney-IG §III (frictions); AppleVis thread; teardown search summaries (secondary) |
| 6 | **Auto-send / lightning bolt** on Legend — skips order confirmations; help page: "increases accidental trade risk… can't view applicable fees" | Legend charts | Frictionless commit (pure) | Robinhood's own help text is the finding. No regulator action located. | Only as an *earned* rung for bots, never for humans on paper; teaches exactly the wrong habit for R5. | **R4 fail**; R5 fail. | **Skip** for humans; permit for bot execution paths only. | High | If Robinhood's 2026-27 disclosures ever show auto-send with a per-order risk cap, a safer variant exists to reconsider. | RH-Legend help ("Trading with Robinhood Legend"); "Auto-send" help |
| 7 | **Order receipt / "you're all set"-style confirmation** | Post-submit | Closure; completion | Exact "you're all set" copy **not located** in any primary source; Google Design (secondary) describes card/receipt patterns. | The receipt is the best place in the flow for R3 text: what filled, at what, what it costs to be wrong, what the exit plan is. | R3 is *only* satisfiable here — pass if used. | **Borrow** the slot, rewrite the content. | Med | If our receipt screen ever ships with animation and no explanation line, R3 is violated (checkable per PR screenshot). | Google Design (secondary); not located for copy |
| 8 | **Scratch-off free-stock reward** (ceased Apr 5 2021) + lottery odds ("Microsoft, Visa or Apple" headline; reality ≈99% get $5, 0.1% get $200) | Onboarding; referral reward | Variable-ratio reward; near-miss; lottery framing ("jackpot") | MA-O ¶31(vii) (scratch-off; "low probability of receiving shares of those companies"); §VIII.C.f bans "features that mimic games of chance"; SEC-RFI "games… virtual scratch-off"; FCA-24: points/prize draws +12% trades, +6% risky trades; Tierney: "encouraging people to equate stock… as having the potential to be 'jackpots.'" | Negative learning value: teaches outcome = luck. The only defensible variant is *loot for learning* (reveal a lore card for completing a lesson), with no market outcome attached. | **R4 fail** (canonical gambling shape); R5 fail. | **Skip** for anything market-linked. Lore reveals for study milestones only. | High | If by 2027 a randomized in-app study shows variable rewards on *lessons* raise trade frequency, even the lore variant goes. | MA-O ¶31(vii), §VIII.C.f; Tierney-IG Fig.1; SEC-RFI; FCA-24; RH referral odds page |
| 9 | **Referral cards** (2020: up to $500/yr free stock; 2026: tiered $50→$10,000, cap $15,000/yr, 60-day claim window) | Rewards tab | Social proof + reciprocity + deadline scarcity | MA-O ¶31(vii) names the referral promise alongside the scratch-off; no separate finding. Built for Mars (secondary) frames the odd $7.08 amount as variable-reward psychology. | Referral = "bring a friend into the school" is fine in a friends-and-family invite gate; the reward should be cosmetic/lore, not capital. | R4 pass if non-capital; the *invite gate* already exists. | **Adapt**: invitations as lore, no capital reward. | Med | If invited members churn faster than organic ones in 2026 cohorts, the referral loop is recruiting the wrong motive. | RH Tiered Referrals help; RH referrals page; MA-O; BFM (secondary) |
| 10 | **Cash-management waitlist tapping** (2019): tap a fake debit card up to 1,000×/day to move up; "out of taps today! Come back tomorrow if you're feeling tappy" | Waitlist card | Engagement-for-its-own-sake; loss aversion (position falls if you skip a day); casino tap loop | MA-C ¶43–45; MA-O ¶31(viii), §VIII.C.c permanently bans "any waitlist tapping feature"; Tierney: "design features often seen in casino gaming machines." | None. | **R1 fail** (wrapper, not engine); R4 fail. | **Skip.** | High | None needed; a regulator has already banned it for MA accounts. If Robinhood re-ships a tap-to-advance loop nationally without action by 2027, the ban's reach is narrower than assumed. | MA-C ¶43–45; MA-O |
| 11 | **Price-movement push** (5% default ON for holdings; 10% option; watchlist OFF by default) + option up/down 20% default, ITM/OTM flips | Push | Salience + loss aversion; "check now" prompt | FCA-24 experiment: push notifications +11% trades, +8% risky trades; SEC-RFI: "notifications indicating a certain stock is up or down"; MA-O ¶31(iii) lists value-change pushes among unsupervised DEPs. | Alerts *you defined in the plan* ("price hit my stop / my target") are the good version — they reward planning. Default-on % moves reward reacting. | R4 fail as default-on; pass as plan-derived alerts. | **Adapt**: no default % alerts; alerts are generated from the member's own plan fields. | High | If 2026 telemetry shows plan-derived alerts producing more unplanned orders within 5 minutes than the no-alert group, the distinction is not protective. | RH price alerts help; RH options alerts help; FCA-24; SEC-RFI; MA-O ¶31(iii) |
| 12 | **"Order filled" / order-status push** (toggle per holding) | Push | Closure; completion | No adverse finding; SEC-RFI treats fill notices as informational. | Positive: fills are the natural moment to log "why I took this" and to start the *hold discipline* clock. | R3 pass if the fill notice carries the plan line. | **Borrow.** | High | If members report fill pushes as the top "makes me open the app" trigger in a 2026 survey, downgrade to in-app only. | RH price alerts help (order status); SEC-RFI |
| 13 | **List-linked pushes**: "Top Movers: Choosing stocks is hard. [💪] Get started by checking which stock prices are changing the most" / "Popular Stocks: Can't decide…? [🤔]" (ceased Jan 2022) | Post-funding push | Default effect + social proof + choice-overload relief | MA-C ¶50–52; MA-O ¶31(iv–v), §VIII.C.e permanently bans "generalized push notifications highlighting specific lists"; Tierney: lists "increase salience… attention-induced noise trading." | Inverse it: "Choosing is hard — here's the *chain-reading lesson*," never "here's what moved." | R4 fail; R5 fail. | **Skip** the list-push; **borrow** the plain-language "choosing is hard" empathy for a *lesson* push. | High | If the school ever sends a push whose deep link lands on a ranked-by-move list, that's the banned shape. | MA-C ¶50–52; MA-O ¶31, §VIII.C.e |
| 14 | **Emojis in the transaction life-cycle** | Push/email | Tone lowering; playfulness attached to money decisions | MA-O §VIII.C.b: "Remove all emojis from the life-cycle of a transaction"; consultant must attest removal. | Lore/persona voice belongs in the *observatory*, not in the fill/margin/assignment messages. | R2 pass in spirit, but honesty rule says the transaction voice stays plain. | **Adapt**: lore voice outside the transaction life-cycle only. | Med | If a member misreads a transaction message in 2026 QA because of persona tone, tighten further. | MA-O §VIII.C.b |
| 15 | **Top Movers list** (20 biggest % gainers *and losers*) | Discover/Popular Lists | Salience; attention-induced trading; loss-side "buy the dip" bait | BHOS (J. Fin. 2022): Robinhood users buy both extreme gainers *and losers* off Top Movers, unlike other retail; intense buying forecasts **−4.7% 20-day abnormal returns**; extreme herding ≈ −9% after 20 days; outage natural experiment shows the app's design (not just user selection) drives it. MA-C ¶34–39 (lists "no different from a broker-dealer agent handing a list… pretending to be surprised"). MA-O §VIII.C.a requires disclosure that lists are Robinhood-data-based. | Reframe as a *classroom exhibit*: "here are today's movers — here's why chasing them lost 4.7% on average," with the paper P/L of a hypothetical chaser shown alongside. | R4 fail as a shopping list; pass as a taught exhibit with the number attached. | **Adapt** into an exhibit with the BHOS number printed on it. | High | If a paper-cohort study in 2027 shows exhibit viewers herd *more* than non-viewers, the exhibit is a list with a caption. | BHOS abstract (EconPapers); Haas Q&A; MA-C; MA-O |
| 16 | **100 Most Popular / "First List" / Popular Lists** (30 categories incl. Cannabis, 2019 IPOs) + popularity data (public API cut off Aug 2020) | Home screen (first thing a new customer sees) | Social proof; default effect | MA-C ¶34–38 ("provided… by default… no suitability analysis"); BHOS herding; Tierney cites Stein: entry into the 100 Most Popular leaderboard "predictive of a spike" then reversal. | In a consensual shared universe, "what the cohort holds" is a legitimate *observatory* view — if it's framed as *what the bots/persons hold and why*, with their thesis attached, not a buy list. | R4 borderline: pass only with thesis attached and no one-tap buy from the list. | **Adapt**: cohort holdings with attached theses; no buy affordance on the list. | Med | If click-to-order from the cohort view exceeds click-to-thesis by 2026-Q4, the affordance is a buy list. | MA-C ¶34–39; Tierney-IG n.38, n.142; BHOS |
| 17 | **Simplified information display** (5 chart indicators vs TD Ameritrade's 489; "cognitive ease… rely more on intuition and less on critical thinking") | Whole app | Cognitive ease; fluency bias | BHOS/Odean Q&A attribute part of the herding to the *thinness* of information; MA-O requires consultant review of "accuracy of educational materials." | Mobile-first curation is our doctrine too — but the *curated set must be the decision-relevant set* (greeks, breakeven, PoP), not the salient set (price, % move). | Passes mobile-first; R5 pass only if the curated set is the pro's set. | **Adapt**: curate for decision inputs, not for salience. | High | If the phone-width ticket ships without max loss and breakeven above the fold, the curation went Robinhood's way. | Haas Q&A; evidenceinvestor summary; BHOS |
| 18 | **24 Hour Market** (May 2023; limit orders, whole shares, curated list; price bands; disclosed "lower liquidity, higher volatility, wider spreads"; 25% of some days' volume overnight) | Order ticket session selector | Availability → more occasions to act; FOMO on overnight news | No regulator finding located. Robinhood's own disclosure lists the risks; limit-only is its safeguard. | Paper value is real: overnight fills teach *spread cost* and *liquidity* viscerally. Bots need a session model anyway. | R4 pass with limit-only + spread shown; R5 pass (habit transfers honestly). | **Borrow** with the same safeguards (limit-only, whole shares, spread displayed). | Med | If paper overnight fills are simulated at last price rather than a widened spread by 2026, the lesson is fake. | RH 24 Hour Market help; Traders Magazine May 12 2023; RH newsroom Mar 6 2024 ($10B) |
| 19 | **Options Strategy Builder** (outlook filter: bullish/bearish/volatility/neutral → strategy menu; max gain/loss, breakeven, Greeks; P/L chart) + **Trade Builder** in Cortex ("translate your beliefs about a stock into a specific options trade") | Options entry | Default effect (strategy menu); plain-English goal → structure | No finding on the builder. FINRA found spread-mechanics misrepresentations elsewhere (AWC §3). Q1 2023 call: builder helped drive contract volume +16%. | High: this *is* "strategy-accurate underlyings" and lore-on-mechanics. The outlook→structure map is exactly how a school should teach spreads. | R1 pass; R3 pass (risk shown); R4 pass if max-loss is unavoidable on screen; R5 pass. | **Borrow** the outlook→strategy grammar; add "why this structure" text and lore names mapped 1:1 to real structures. | High | If members can submit a multi-leg from the builder without seeing max loss (screenshot check, every PR), the borrow lost its safeguard. | RH Strategy Builder help; RH Cortex newsroom (Mar 2025); Barchart Q1-2023 transcript summary |
| 20 | **Greeks + Chance of Profit / Prob. ITM / Prob. of touching on the tap-a-strike screen** ("theoretical estimates") | Chain & order screen | Numeracy scaffold; also *false precision* risk (a 72% "chance of profit" reads like a promise) | No regulator finding. Robinhood labels every metric "theoretical." | Very high — reading a chain is a named learning outcome. Pair PoP with the *payoff asymmetry* so 72%-to-win-$1 vs 28%-to-lose-$5 is legible. | R3 pass (definitions in-line); R4 pass; A11y: PoP must not be colour-only. | **Borrow**, with expected-value shown next to PoP. | High | If a 2026 member survey shows >30% interpret "chance of profit" as "chance I make money on the trade overall," the label needs the EV pairing. | RH Options chain metrics help |
| 21 | **Legend: drag order pill to replace pending orders**; context-sensitive "+" (buy-stop above, sell-limit above…); "can't switch order types by dragging" | Desktop charts | Direct manipulation; frictionless amend | No finding located. Help text warns dragging past market price may execute/reject. | Good for learning *stop management* — moving a stop is the disciplined act; moving a limit to chase is the undisciplined one. Log which. | R4 pass with "you moved your stop *against* your plan" text. | **Adapt**: drag allowed; direction-vs-plan is annotated. | Med | If drag-amends on paper skew >60% toward loosening stops in 2026 logs, add a friction step. | RH "Trading with Robinhood Legend" help; RH Legend newsroom Oct 16 2024 |
| 22 | **Robinhood Gold upsell** ($5/mo; 30-day free trial; first $1,000 margin interest-free; 3% IRA match; Cortex gated to Gold; 4.2M subs Q4 2025) | Persistent upsell cards | Free-trial default; endowment; tier status | SEC-RFI names "subscriptions and membership tiers… free subscription trials" as a DEP; FINRA: inaccurate balances shown to Gold/Instant customers; no finding on the upsell itself. | Tier status as *earned rung* (fog-of-war) is the school's pattern — never as a purchase. | R4 pass if earned, fail if bought/defaulted. | **Adapt**: rungs earned, not sold; no margin-as-perk. | High | If any capability in the app is unlocked by anything other than demonstrated behaviour by 2027, the pattern drifted. | RH Gold overview help; RH Q4 2025 results; SEC-RFI; FINRA AWC |
| 23 | **Recurring investments** (Oct 2020; daily/weekly/biweekly/monthly; $ amounts → fractional; "make investing part of your routine"; pause/end anytime) | Setup flow | Default effect *for* the user; commitment device; habit | No adverse finding. | Directly rewards reinvestment discipline; the mechanic *is* dollar-cost averaging. | R1/R2/R4/R5 all pass. | **Borrow.** | High | If recurring-investment users in the paper cohort show *higher* discretionary trade counts than non-users in 2026, it's being used as a funding pump rather than discipline. | RH newsroom Oct 6 2020; RH recurring investments help |
| 24 | **Round-ups** (Cash Card; $100/wk cap; Gold bonus; **discontinued Dec 8 2025**) | Spending card | Painless saving; micro-commitment | No finding; Robinhood retired it. | Marginal for a paper school; no spending surface. | n/a | **Skip** (no surface). | High | If a member-facing "paper allowance" ever exists, revisit. | RH Round-ups help (search snippet); Benzinga Mar 2022 |
| 25 | **Robinhood Learn / in-app definitions / Learn the Basics** (Apr 2021) + **Learn & Earn** (crypto; prediction-market module → cash reward) | Learn tab; contextual definitions | Fluency; *paid-to-learn* is an extrinsic reward | No adverse finding. Tierney warns superficial gamified education (badges/points) "tend[s] to dissipate once the extrinsic rewards are taken away" and can backfire; MA-O consultant must review "accuracy of educational materials." | Core. In-line definitions on the ticket are R3 made structural. Learn & Earn is the one *paid* mechanic; cash-for-quiz is a pump into trading. | Definitions: pass all. Learn & Earn: R4 fail (cash reward funds the next trade). | **Borrow** definitions; **skip** cash-for-learning; lore/capability unlocks for learning instead. | High | If lesson completion has no measurable effect on plan-field quality by 2027, the definitions are decoration. | RH newsroom Apr 6 2021; RH Prediction Market Learn & Earn help; Tierney-IG §V |
| 26 | **Green/red screen tint + after-hours grey/dark mode** ("glimpse the health… without reading a single word") | Global chrome | Affect priming; loss aversion via colour | SEC-RFI: "user interfaces shift the coloration of the entire screen between green and red based on an investor's portfolio performance"; FCA-22 "flashing red/green." Pratt-25 (secondary) praises dynamic Buy-button colour. | After-hours mode is a *state* cue worth keeping (market closed → different verbs). Whole-screen P/L colour fails our colourblind rule outright. | **A11y fail** (hue alone); R2 fail (whole-screen red is punishing spectacle). | **Skip** P/L tint; **borrow** the closed-market state change with a shape/word, not a hue. | High | contrast.spec fails on any P/L-driven chrome colour — mechanically enforced today. | SEC-RFI p.7; Google Design (secondary); FCA-22; Pratt-25 (secondary) |
| 27 | **Streaks / badges** | — | Habit loop; loss aversion (don't break the chain) | **No Robinhood streak/badge mechanic located.** SEC-RFI names "streaks" and "points, badges, and leaderboards" as DEP types; FCA-24: points/prize draws +12% trades; FCA-22 lists badges "for making trades." | Streaks on *study* or *journal entries* are the school's version; streaks on trades are the casino's. | R4 pass if the streak variable is journaling, fail if trading. | **Adapt**: streaks only on non-market actions. | Med | If a member's journal streak correlates with rising trade count in 2026 data, the streak is leaking into trading. | SEC-RFI; FCA-22; FCA-24 |
| 28 | **Social — Robinhood Social** (announced Sep 10 2025; beta Mar 18 2026: KYC-verified profiles, live verified trades, 1-yr/daily P&L, profit rate, follow politicians/insiders/hedge funds via filings; post/like; manual "trade from feed"; no auto copy-trading) | Feed | Social proof; status; leaderboard-by-P&L | No enforcement finding (too new). SEC-RFI flags social tools and copy trading ("may raise… broker-dealer and investment adviser status issues"). | This is the closest analogue to our observatory. Verified P&L + *thesis* is education; verified P&L + one-tap follow is herding. | R4 borderline; passes if the leaderboard ranks *process* (plan adherence, drawdown control) and not raw P&L. | **Adapt**: leaderboard on process metrics; theses visible; no trade-from-feed. | Med | If Robinhood Social's 2026-27 data shows followers of top-P&L profiles underperform (as BHOS predicts for herding), the P&L-leaderboard shape is confirmed harmful. | RH HOOD Summit newsroom; RH Social beta newsroom; SEC-RFI |
| 29 | **IPO Access** (random allocation; "flipping" within 30 days → 60-day exclusion) | IPO flow | Scarcity; lottery; *anti*-flip penalty is a friction | No finding; MA complaint listed IPO participation among "aggressive tactics" but no specific IPO finding. | Small; the *hold-30-days-or-lose-access* rule is a rare Robinhood **friction** worth copying as a pattern (capability withheld for behaviour). | R4 pass (it withholds capability, not information — fog-of-war textbook). | **Borrow the penalty shape**, not the IPO lottery. | Med | If the paper school adds any allocation-by-luck mechanic, it violates its own lottery ban. | RH IPO Access help; MA-C §II |
| 30 | **Options approval "instant" questionnaire** ("option account approval bots"; approve/deny in seconds; re-apply with changed answers; 20-yr-old approved for Level 3 **13 seconds** after flipping "N/A"→"3 years"; >1,190 under-21s with "3+ years"; MA: 68% of 71,744 approved had limited/no experience, 680 failed criteria, 340 approved with zero trades) | Options onboarding | Frictionless commit into the highest-stakes product; self-report gaming | FINRA AWC §1 (thousands approved who "did not satisfy… eligibility criteria"; part of $70M); MA-C ¶82–85; MA-O ¶38–42. Robinhood's response: new Level-3 requirements + spread onboarding (May 2021). | The *inverse* is the school's whole point: options rungs are **earned by demonstrated behaviour** on paper, not self-declared. | R4 pass only as earned rungs. | **Skip** self-report; **borrow** the *rung* structure (L2/L3) with behavioural gates. | High | If any paper member reaches multi-leg without N logged single-leg trades with plan fields, the gate is self-report in disguise. | FINRA AWC pp.3, 15–17; MA-C ¶19, ¶82–85; MA-O ¶40–42; RH newsroom May 13 2021 |
| 31 | **Pattern Day Trade Protection** (alerts on 2nd/3rd/4th day trade in 5 days; offers cash-account switch; toggleable) — note: Robinhood help now says FINRA intraday margin standards replace PDT **June 4 2026** | Ticket interstitial | Friction + informed consent | No adverse finding; it is a safeguard. | Model interstitial for R3: it explains *what a day trade is* at the moment it matters. Also the pattern for "counted door" fog-of-war (visible · named · counted). | Pass all; the counting is the teachable bit. | **Borrow** the counted-interstitial shape (even though PDT itself is going away). | High | If FINRA's June 2026 change removes the regulatory hook, the school keeps the *counter* as pedagogy; falsified only if members report it as noise in 2026 surveys. | RH PDT Protection help (search snippet + current page) |
| 32 | **Same-day-expiration (0DTE) trading until 3 PM with "warning prompts and opt-in"** (May 2021) | Ticket | Informed-consent friction on the riskiest instrument | Introduced as remediation; no finding on the prompt. | Exact fog-of-war shape: capability withheld behind a named, counted, opt-in door. | Pass. | **Borrow.** | Med | If 0DTE paper trades rise after the opt-in is granted with no journal entries, the door is a formality. | RH newsroom May 13 2021 |
| 33 | **Buying power / cash-balance display** (FINRA: negative balances shown *doubled* to 135,000 customers Dec 2019–Jun 2020; wrong "negative buying power" to ~4.2M customers 2016–2020; Customer A shown −$730,165.72 vs actual −$365,530.60 the day before he died; $5.73M restitution) | Account screen | Salience of a wrong number | FINRA AWC §2 (Rules 2010, 2210); Robinhood Jun 19 2020 commitments to change buying-power display. | The single most important "domain accuracy & honesty" case study in retail fintech: a *flourish-free* number was still catastrophically misleading. Paper P/L, margin, and assignment states must be exact and explained. | R3/R5: the number needs its explanation *next to it* (what is buying power vs cash). | **Borrow the lesson**, not the screen. | High | If any paper account can show a figure the member cannot decompose in one tap by 2026, we have the same defect. | FINRA AWC pp.9–10; RH newsroom Jun 19 2020; CNN Jun 19 2020 (search summary) |
| 34 | **Cortex** (Mar 2025): Stock Digests ("why it's moving, in plain English"; 95% of surveyed "love" it), Trade Builder, custom indicators/scans by natural language; Gold-gated; "not placing trades for you" | Quote page; builder | Authority/fluency; AI-summary as implicit recommendation | No finding. Disclaimers: "not investment research… no guarantee AI will improve performance." Tierney/YLJ: the Reg BI question is whether a DEP is a "recommendation." | Digests are a *reading-the-tape* teacher if they show their sources; a summary that lands on a Buy button is a recommendation. Our bots' "recommend" step must carry the reasoning and the falsifier (research doctrine). | R3 pass (plain English); R4 pass only if no buy affordance on the digest. | **Adapt**: digest with sources + falsifier; no order affordance on the digest card. | Med | If members' orders within 2 minutes of reading a digest exceed baseline by 2026, the digest is a recommendation surface. | RH Cortex newsroom (Mar 2025); RH Cortex Digests UK (Aug 19 2025); SEC-RFI §Reg BI |
| 35 | **Robinhood Snacks** (acquired MarketSnacks 2019; ~40M subscribers by 2022 per Axios search summary; podcast spun out Apr 2022; Sherwood Media Jan 17 2023; "tens of millions… weekly") | Email/podcast | Daily touch; habit; parasocial | No finding. SEC-RFI counts newsletters under membership perks. | A daily *observatory dispatch* (what the bots did, what the cohort learned) is high-value and fits the secretary/digest discipline. | Pass. | **Borrow** the cadence and voice; content = what happened in the universe, not what to buy. | Med | If open rate correlates with same-day trade count in 2026, the dispatch is a call to action. | RH Sherwood newsroom; RH Snacks preferences help; Axios Apr 25 2022 (search summary) |
| 36 | **Payment for order flow economics** (context row) — "commission-free" while PFOF-driven inferior prices cost customers $34.1M (2015–2018) | Business model | Hidden cost; the incentive behind every engagement lever | SEC Dec 17 2020, $65M; Tierney/YLJ: frame gamification as "behavioral churning" because revenue scales with flow. | The school has *no* revenue-per-trade incentive — that is the structural reason its gamification can be honest. State it in the doctrine. | Pass by construction; must stay true. | **Borrow the contrast** as a stated design constraint. | High | If the app ever earns per-order (real or in-lore), every "adapt" call above must be re-run. | SEC PR 2020-321; YLJ; Tierney-IG |

---

## 1. Mechanics that reward the behaviour a paper-trading school wants (ranked)

1. **Options Strategy Builder's outlook→structure grammar + P/L chart** (#19) — plain-English belief becomes a named structure with max loss on screen. It is lore-on-accurate-mechanics already; add the "why this structure" line. No harm finding; volume rose *and* NPS rose when Robinhood shipped it (Q1-2023 call).
2. **Greeks / chance-of-profit on the strike tap** (#20) — reading a chain is a stated outcome; pair PoP with EV so the number teaches asymmetry rather than promising.
3. **Recurring investments** (#23) — the mechanic *is* reinvestment discipline; zero adverse findings.
4. **Counted, named, opt-in interstitials** (PDT Protection #31, 0DTE opt-in #32, IPO flipping penalty #29) — Robinhood's *frictions* are the shapes the FOG-OF-WAR tree describes: capability withheld, door visible and counted. These are the Robinhood pieces nobody talks about and the ones worth stealing.
5. **Order-status push + the receipt screen as the R3 slot** (#12, #7) — the only points in the flow where "what just happened" can sit next to the event.
6. **Milestone celebrations re-triggered on plan adherence** (#1/#2) — keep the fanfare budget, move the trigger to *disciplined entry / profit-take at plan / bot deployed*. This is the "positive reinforcement over negative" rule with the MA order's line ("not tied to frequency of trading") as the boundary.
7. **Legend drag-to-amend with direction-vs-plan annotation** (#21) — moving a stop is the disciplined act; the log can tell tightening from chasing.
8. **24 Hour Market with limit-only + widened spread** (#18) — viscerally teaches liquidity cost; bots need the session model anyway.
9. **Cortex-style digest with sources and a falsifier** (#34) — plain-English "why it moved" is tape-reading pedagogy if it shows its work and has no buy button.
10. **Daily dispatch cadence** (#35) — Snacks' habit loop pointed at "what the universe did," not "what to buy."

## 2. Mechanics that train habits a real-money endgame must unlearn (ranked, with evidence)

1. **Ranked-by-move lists (Top Movers / 100 Most Popular) with a buy affordance** (#15, #16) — the only mechanic with a *return* finding: Robinhood herding into Top Movers (both gainers and losers) forecasts −4.7% 20-day abnormal returns, ≈−9% for extreme events; the outage experiment isolates the app's design as a cause (BHOS J. Fin. 2022; Haas). MA banned the pushes and required list disclosures.
2. **Self-declared, instant options approval** (#30) — FINRA: bots approved thousands who failed criteria; a 20-year-old went from denied to Level 3 in 13 seconds by editing two answers; MA: 68% of approved had limited/no experience. The real-money endgame is precisely where "declare yourself ready" fails.
3. **Default-on % price pushes** (#11) — the FCA's 9,000-person experiment: +11% trades, +8% risky trades, larger effects on low-literacy, younger and female participants (FCA 2024). Real-money version of "check now" is the tilt loop.
4. **Lottery-shaped rewards** (scratch-off, prize odds, 99%-get-$5 headline of "Microsoft, Visa or Apple") (#8) — banned for MA accounts as "features that mimic games of chance"; FCA: prize draws +12% trades; Tierney: teaches "jackpot" equivalence. Trains outcome-as-luck.
5. **Per-trade celebration** (#1) — MA ¶41: celebration "as a result of simply buying or selling"; the trade itself becomes the reward. Tierney's brick-and-mortar thought experiment: the objection is the raised propensity to trade, "without regard to the actual security… and without regard to direction."
6. **Live-ticking portfolio value / whole-screen P/L colour** (#4, #26) — SEC-RFI names full-screen green/red as a DEP; FCA-22/24 "flashing prices" move low-literacy users most; NYT's slot-machine framing. Also fails our colourblind rule outright.
7. **Auto-send / one-motion submit without a plan gate** (#6, #5) — Robinhood's own help text: "increases accidental trade risk… can't view applicable fees." The paper habit to unlearn is "submit is free."
8. **Waitlist tapping and any engagement-for-its-own-sake loop** (#10) — permanently banned for MA; pure wrapper.
9. **Cash-for-learning** (#25 Learn & Earn) — funds the next trade; Tierney: extrinsic-reward education dissipates when rewards stop.
10. **Emoji-toned transaction messages** (#14) — MA required removal from the transaction life-cycle; the honesty rule says the fill/assignment/margin voice stays plain even in a lore-rich app.

**Trading-frequency evidence underlying all of the above (MA consent order ¶33–37, findings Robinhood consented to):** >200 customers with *no* self-reported experience averaged ≥5 trades/day; 25 of them made **125,790 trades** in the period; several averaged **58–92 trades/day**. NYT/Alphacution (Q1 2020, via Fool/BU): Robinhood users traded **40× the shares and 88× the options contracts** per dollar vs Schwab customers (secondary quoting a paywalled primary).

## 3. What Robinhood itself changed after 2021, and why — dated timeline

| Date | Change | Stated / documented reason |
|---|---|---|
| **2020-06-19** | Commits to Level-3 eligibility/education review, more options education, Options Education Specialist hire, buying-power display changes; $250k to AFSP | Death of Alex Kearns (Jun 12 2020) after seeing a −$730k balance; FINRA later found the figure was *double* the true −$365,530.60 (AWC §2) |
| **2020-08-10** | Turns off public popularity data (Robintrack API) | Reported by Fortune (cited in Tierney n.38); reason not stated by Robinhood — "not located" |
| **2020-12-16** | MA Securities Division complaint: gamification, lists, outages, options approval, fiduciary breach | — |
| **2020-12-17** | SEC $65M settlement: PFOF disclosure + best execution ($34.1M inferior prices) | — |
| **2021-03-31** | **Confetti retired**; per-milestone "dynamic visual experiences" (golden circle, lightning bolt); Bessel: "moments of pause, moments of understanding"; Muthukumar: "we just took out the distraction" | Regulatory scrutiny + pending IPO; Robinhood maintained confetti was legal and a first trade "an important milestone to celebrate" (AP) |
| **2021-04-05** | Scratch-off reveal for free-stock rewards ceased (MA-O ¶32(ii)) | MA complaint pressure |
| **2021-04-06** | Robinhood Learn "Learn the Basics" modules; milestone recognition; phone support for options | Positioning as education |
| **2021-05-13** | New financial + experience requirements for Level 3; spread onboarding before L2→L3; P/L chart; in-app exercise/early-assignment cover; 0DTE trading only until 3 PM with warning prompts and opt-in; live phone support | Post-Kearns remediation; FINRA settlement imminent |
| **2021-06-30** | FINRA AWC: $57M fine + ~$12.6M restitution (record); findings on approval bots, doubled negative balances, March 2020 outages, unreported complaints; third-party consultant | — |
| **2021-08-27** | SEC Request for Comment on Digital Engagement Practices (defines celebrations, streaks, badges, leaderboards, notifications, full-screen colour cues, order-placement "ideas," subscriptions, chatbots) | Gensler's May 2021 meme-stock testimony |
| **2022-01** | Push notifications deep-linking to Top Movers / 100 Most Popular ceased (MA-O ¶32(iv)) | MA litigation |
| **2022-03** | MA Superior Court strikes down the state fiduciary rule (Robinhood wins round 1) | — |
| **2022-11-21** | FCA "Gaming trading" research (UK): confetti, badges, leaderboards, flashing prices, high defaults; 1-in-27 app users show problem-gambling behaviour | — |
| **2023-01-17** | Sherwood Media formed around Snacks | Media/engagement diversification |
| **2023-05-12/16** | 24 Hour Market (43 symbols, limit-only, whole shares) | "Invest when they want"; limit-only as the safeguard |
| **2023-07-26** | SEC proposes Predictive Data Analytics conflicts rule (would have covered DEPs) | — |
| **2023-08-25** | MA SJC (5–0) revives the fiduciary rule; Reg BI is a floor, not a ceiling | — |
| **2024-01-18** | **MA consent order, $7.5M**: for MA accounts, permanently cease confetti/"celebratory imagery directly tied to frequency of trading," list-linked pushes, games-of-chance features, waitlist tapping; remove emojis from transaction life-cycle; add "based on Robinhood data" disclosures to lists; independent compliance consultant to attest and review DEPs for inexperienced customers. Robinhood: settlement "concerns historical practices… we reject the premise that any part of our app, past or present, is 'gamified'" | Three years of litigation |
| **2024-06-20** | FCA experiment (9,000 users): push +11% trades/+8% risky; points & prize draws +12%/+6% | Consumer Duty enforcement posture |
| **2024-10-16** | Robinhood Legend (trade on charts, drag orders, auto-send), futures, index options | Active-trader push ("reimagine… active trading platform") |
| **2025-03** | Cortex (Digests, Trade Builder) for Gold; Strategies; Banking | AI + subscription tier (Gold 4.2M by Q4 2025) |
| **2025-06-12** | SEC withdraws the 2023 PDA/DEP conflicts proposal | Change of administration |
| **2025-09-10** | HOOD Summit: Robinhood Social announced (verified trades, P&L, follow insiders/politicians), custom AI indicators/scans, short selling, ladder | — |
| **2025-12-08** | Round-ups discontinued | Not stated |
| **2026-03-18** | Robinhood Social beta (1,000 → +10,000 users); manual trade-from-feed, no auto-copy | "Trying not to upset regulators" (Finance Magnates, secondary) |
| **2026-06-04** | Robinhood help: FINRA intraday margin standards replace PDT; "no more day trade restrictions or day trade calls" | FINRA rule change |

**Reading of the arc:** the *visible* casino furniture (confetti, scratch-off, tap-to-advance, emoji pushes) was removed 2021–22 under state pressure and ahead of the IPO, and the 2024 order made the removals permanent for MA accounts only. The *structural* levers — lists, default-on alerts, instant approvals, and now a P&L-ranked social feed and Gold-gated AI — were kept, re-skinned, and in Social's case expanded. That is exactly the "whack-a-mole" Langvardt & Tierney predicted, and it is why the ledger's calls key on the *trigger variable* (trade count vs plan adherence) rather than on the animation.

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
| See *all* expirations | built (P2 slice 1) — `page_token` walked up to 3 × 10,000 contracts with one 429 retry; LEAPS reachable | `src/alpaca/alpaca-options-client.ts` (`getExpirations`, `EXPIRATION_PAGE_BUDGET`) |
| Greeks on every strike | partial — vendor-only; the chain now says how many strikes the feed quoted and an as-of (P2 slice 1); a per-greek reason is still absent | `alpaca-options-client.ts` (`quoteSource`), `option-chain-route.ts` (`quotes`), `straddle-view.tsx` (`coverageLine`) |
| `$0.00` bid shown honestly | built (P2 slice 1) — a zero bid is a real quote; the mid survives | `alpaca-options-client.ts` (`price0`) |
| Implied volatility / probability on the chain | missing on the desk (IV is solved only in the research recommender) | `src/options/pricing.ts`, `src/adapters/alpaca-recommend-chain.ts` |
| Tap a chain cell to fill the ticket | exists — row = strike + mid-seeded limit; call/put cell also switches side when the rung is unlocked | `app/src/shell/option-gate.tsx:189-213` |
| Type a strike by hand | exists — number input with a `<datalist>` of chain strikes | `app/src/shell/option-fields.tsx:108-150` |
| Trade a single option leg (201/202/301/302) | exists — limit / market | `option-gate.tsx`, `src/trading/option-ticket.ts` |
| Greeks / probability on the order being placed | missing — chain-only, never on the ticket or preview | `app/src/live/options.ts:76-98` |
| Max profit / max loss / breakeven | exists (single leg and spread preview) | `app/src/shell/option-preview.tsx:32-52`, `draft-order-builder.tsx:78-102` |
| Payoff diagram | **built** (multi-leg review and the single-leg ticket) — the server samples the at-expiration curve through every strike (a covered call carries its shares); the review draws it with the loss side hatched, breakevens ticked, extremes in words, and says when the loss keeps going past the window; the single-leg ticket adds today and halfway model lines at the reviewed IV | `src/trading/draft-order-preview.ts` `payoffCurve` / `datedCurves`, `option-ticket.ts` `curveFor`, `app/src/shell/payoff-chart.tsx` |
| Review then confirm, disarm on edit | exists, both tickets; the server re-checks the live account at submit | `trade-gate.tsx:35-41,190-195`, `option-preview.tsx:15-21` |
| Build a vertical / multi-leg spread | **built** (P3 slices 2, 4) — legs off the chain, each leg's premium editable in its row, a running net while drafting, validates, previews payoff | `app/src/shell/draft-order-builder.tsx`, `draft-leg-form.tsx`, `draft-leg-row.tsx` |
| **Submit** a multi-leg spread | **built** (P3 slice 1) — one `mleg` order through `draft-trade-service.ts`; the headline is the broker's echo; the wiring into the protected gate is its own held PR | `src/server/draft-trade-service.ts`, `src/server/draft-order-route.ts` |
| Strategy templates (vertical, condor…) | missing — copy says "a vertical spread is two, an iron condor is four" | `draft-order-builder.tsx:213` |
| **See open / pending orders** | API built (P1 slice 1) — `GET /api/trade/orders` → working + recent lists; no shell surface yet (the #674 fork decides where) | `src/server/trade-orders-routes.ts`, `src/server/desk-orders-view.ts`, `app/src/live/orders.ts` |
| **Cancel an order** | API built (P1 slice 1) — `POST /api/trade/cancel` with an audit line; no shell button yet | `src/server/trade-orders-routes.ts` |
| **Modify / replace an order** | **built** (P1 1b) — Modify on a working limit or stop opens a drawer (shares, price, Day/GTC); only the changed fields go to `POST /api/trade/replace`, which PATCHes the broker, audits the NEW id with `replaces`, and the row reads "changed from" / "Replaced · now" | `src/server/trade-orders-routes.ts`, `app/src/shell/working-order-modify.tsx` |
| Pending state in the domain | missing — `OrderStatus` is `filled \| rejected`; the adapter treats *accepted* as filled | `src/domain/types.ts`, `src/adapters/alpaca-broker-adapter.ts` |
| Order history / fills | exists — durable JSONL ledger, keyset-paginated; broker window 15 | `app/src/shell/activity-table.tsx`, `recent-orders-strip.tsx`, `src/observatory/activity-store.ts` |
| Live order-status updates | **built** (P4 slice 1) — `/api/trade/events` streams the desk's own fills, submits and cancels off the activity bus; Working orders, the desk snapshot and the positions statement re-read on each frame (60 s poll as the fallback); quotes still poll 15 s, chain never | `src/server/desk-events-route.ts`, `app/src/live/desk-events.ts` |
| Order status column on a phone | missing — `col-detail`, hidden below 1100px | `activity-table.tsx:33`, `app/src/styles/desk.css:294-299` |
| View positions with tax lots | exists — FIFO lots, conservatively gated | `positions-table.tsx`, `blotter-row.tsx:167-209`, `src/trading/round-trips.ts` |
| Close a position / one lot | exists — inline panel, review → confirm | `blotter-row.tsx:156-224, 286-439` |
| Close on a limit | missing — stock close passes no `orderType`; option close hard-codes market | `blotter-row.tsx:321-327`, `src/trading/option-ticket.ts:243` |
| Roll an option | **built** (P3 slice 3) — Roll… on the option positions card: next expiration + strike from the chain, close + open as one `mleg` through the draft route; the legacy blotter's door points there | `app/src/shell/roll-row.tsx`, `src/trading/roll-legs.ts` |
| Exercise / assignment / expiry UI | missing — ingested server-side only | `src/trading/option-lifecycle.ts` |
| Option positions with strike / expiry / greeks | built (P2 slice 3) — DTE, ITM/OTM word, per-position greeks, book greeks with coverage; `aggregateGreeks` wired | `src/server/option-positions-view.ts`, `option-positions-route.ts`, `app/src/shell/option-positions.tsx` |
| Buying power / margin / day-trade count | missing — cash-account model; `AlpacaAccount` reads cash, equity, options level only | `src/alpaca/alpaca-trading-client.ts` |
| Watchlist | missing | — |
| Price / fill alerts, push notifications | **partial** (P4 slice 1) — position-watch alerts derived from the member's own option positions (expiry a month / a week / today out, assignment risk on a short in the money, a long expiring worthless), an Alerts strip on Trade with one-tap Dismiss by fingerprint; delivery (push / email) still absent — Eric's credentialed step | `src/alerts/position-watch.ts`, `src/server/desk-alerts-route.ts`, `app/src/shell/desk-alerts.tsx` |
| Social intel ("Also trading NVDA", recent orders) | exists on the ticket | `app/src/shell/wire-row.tsx`, `recent-orders-strip.tsx` |
| Milestone ladder 101→501 with locked-disabled-explained | exists | `milestone-strip.tsx`, `locked-panel.tsx`, `src/domain/progression.ts` |
| Pre-trade gate with explained refusals and warnings | exists — four independent layers (identity, ticket rules, options level + collateral, ladder / zero-DTE) | `src/trading/order-ticket.ts:216-276`, `option-ticket.ts`, `src/server/*-api-routes.ts` |
| Inline education at the point of choice | partial — course copy on the ticket head, order-type notes; no per-column gloss, no "learn about…" sheets | `app/src/live/ticket.ts:79-103` |

### 3.2 Friction observed in the code (the photographed defects, with causes)

1. **Short inputs stretched full width** — *fixed, P0 (#3407):* `.gate-fields` is now
   `repeat(auto-fill, minmax(150px, 1fr))` with the symbol spanning two; the `.tkt-fields` override is gone.
   As found: `.tkt-fields { grid-template-columns: repeat(3, 1fr) }`
   (`app/src/styles/ticket.css`) overrides `.gate-fields`' `2fr 1fr 1fr`, so Strike (4 chars),
   Contracts (1 char) and Order each get a third of an 1180px panel; Symbol gets the same third with an
   in-flow autocomplete listbox wrapping inside it.
2. **Ragged estimate grid** — *fixed, P0:* `.gate-est` is a two-column definition list at every width.
   As found: `.gate-est` was `repeat(4, auto)` (`gate.css:106`); the options preview emits
   up to seven items (`option-preview.tsx:32-52`) → a 4 + 3 layout with no intermediate breakpoint.
3. **No spacing or type scale** — *fixed, P0:* `--space-1..5` and `--text-xs..lg` in `theme.css`,
   documented in `docs/BRAND.md` → *Spacing & type scale*, used across the ticket's CSS.
   As found: `docs/BRAND.md` documented colour tokens and two font stacks; spacing,
   radii and sizes live ad hoc per CSS file — which is why sections read jagged against each other.
4. **The chain's in-the-money rail is off-screen by default** — *fixed, P0:* the rail rides the strike
   cell's edges, the one column always in view. As found: it painted on the outermost cells while the
   table opened pre-scrolled 264px in (`straddle-view.tsx:26,104-108`).
5. **A chain with no spot renders every strike** — *fixed, P0:* windowed around the middle of the
   chain with the button saying so; "Show all" folds back. As found: no ±8 window, no divider, no
   "Show all" (`app/src/live/straddle.ts:55`), and "Show all N strikes" was one-way.
6. **The default options ticket fails its own review** — *fixed, P0:* Review is withheld and explained
   while a limit has no premium, and a strike that arrives before the chain seeds its premium from the
   mid once the chain resolves. As found: `orderType` defaulted to `limit` with an empty price, Review
   was enabled, the server refused (`option-gate.tsx:118-119,257`).
7. **"Confirmed" for an order that was never sent** — *fixed, P0:* the headline is the server's
   `executed` word; a submit the deployment refused reads "Reviewed — not sent" (multi-leg,
   `draft-order-builder.tsx` `gateStatus`).
8. **Two positions blotters** — *fixed, P0:* one `positions-blotter.tsx` (tabs, filter bar, table,
   the New-trade card) rendered by both routes. As found: `/app/accounts?section=overview` and
   `/app/u/$id` each carried their own chip/filter definitions.
9. **The wide tokens are inert on the ticket's children** — *fixed, P0:* `.wr-panel` no longer carries
   a max-width. As found: `RecentOrdersStrip` and `WireRow` rendered inside `.gate-panel` (capped at
   `--col-read`) while carrying `--col-wide`.
10. **Quantity inputs carry `min` but no `max`** except the close panel.
11. **Spread legs get dropdowns where single legs get a chain** — `draft-leg-form.tsx:117-162` fetches
    its own chain and never reuses `StraddleView`.
12. **The quote header and the chain fetch the same spot separately** (#3299, `option-gate.tsx:264`).
13. **No end-to-end test walks symbol → chain → strike → review → submit**; `e2e/trade.spec.ts` asserts
    one heading.

### 3.3 Backend capability matrix (what a design can lean on today)

| Capability | Support | Where |
|---|---|---|
| Equity market / limit / stop | full — TIF (day / gtc) chosen by the member, previewed and echoed back (P1 slice 1) | `src/trading/order-ticket.ts` → `src/server/trade-service.ts` → `src/alpaca/alpaca-trading-client.ts` |
| Stop-limit, trailing, bracket / OCO / OTO, notional, fractional, short, extended hours | none | not modelled at any layer |
| Single-leg option open (4 plays) and close | full | `src/trading/option-ticket.ts`, `src/server/option-trade-service.ts` |
| Multi-leg (`mleg`) | model + review + **execution seam** (P3 slice 1); live until the gate wiring PR merges | `src/trading/draft-order.ts`, `src/server/draft-trade-service.ts` |
| Roll | none (stated reason) | `ROLL_UNAVAILABLE_REASON`, `order-ticket.ts` |
| Open-orders list | route + view (P1 slice 1), no shell surface | `src/server/trade-orders-routes.ts`, `desk-orders-view.ts` |
| Cancel | route + audit line (P1 slice 1), no shell surface | `src/server/trade-orders-routes.ts` |
| Replace | `PATCH /v2/orders/{id}` via `replaceOrder` — quantity, price, time in force; type and side never | `src/alpaca/alpaca-trading-client.ts` |
| Pending statuses in the ledger | journaled (`new` / `canceled` / `rejected` lines) but never surfaced as open | `src/alpaca/trade-updates-stream-events.ts:88`, `src/observatory/activity-store.ts` |
| Option chain (bid / ask / OI / vol / greeks) | full for every listed expiration (P2 slice 1); one 429 retry per read; no cache — every review and submit still re-fetches | `alpaca-options-client.ts`, `src/server/option-chain-route.ts` |
| IV, probability | research path only | `src/options/pricing.ts`, `src/adapters/alpaca-recommend-chain.ts` |
| Portfolio greeks | wired for the option book on the positions card (P2 slice 3); beta-weighting still unused | `src/options/greeks-aggregator.ts`, `src/server/option-positions-view.ts` |
| Real-time quotes / fills to the browser | none — polling; the hub already has both event streams server-side | `src/server/observatory-hub.ts`, `board-patch-routes.ts` |
| Account detail (buying power, margin, PDT) | none | `AlpacaAccount` subset |
| Options-level, collateral, ladder and zero-DTE gates | full | `option-economics.ts`, `src/domain/progression.ts`, both API routes |
| Multi-account per member | full | `src/server/dashboard-identity.ts`, `account-switcher.tsx` |
| Bots trading options | none — `OrderIntent.type` is the literal `"market"` | `src/domain/types.ts`, `src/ports` |
| Paper-trading mode | the whole app — every account is an Alpaca paper account | `src/participants/participant.ts` |

Envelope note (verified 2026-09-21 with `node scripts/envelope-scan.mjs --check`): the whole
desk-execution seam and both broker clients (`alpaca-trading-client.ts`, `alpaca-options-client.ts`,
`trade-service.ts`, `option-trade-service.ts`, `order-ticket.ts`, `draft-order-route.ts`,
`board-patch-routes.ts`) scan `protected: false` — opened on purpose by #928 (`envelope.json`
`$openOnPurpose`). Order-lifecycle plumbing is ordinary in-envelope work that auto-merges; the only
protected file in the cluster is `src/server/account-identity-gate.ts`. The earlier "protected →
platter" reading came from #674's brief (2026-08-27, pre-#928) and was wrong.

### 3.4 Prior decisions on record — inputs to the designs, not bounds

| Decision | Where | What it settled | Status for this study |
|---|---|---|---|
| Rail = preset, never drive; locked = visible · disabled · explained; a sell is never locked | #1461 | the milestone ↔ feature boundary | reference — a shape may move the rail off the ticket |
| The chain is the entry instrument; greeks additive; absent never zero | #1481 | the straddle view | reference — the chain's *placement* is open |
| No tab strip; kind / section / sub-view | #1740 | the shell's navigation words | reference — a shape may need a fourth word |
| `/trade` stays one page; symbol in the URL; intel inline; chart is a section | #2017 | the cockpit | reference — the one-page premise is on the table |
| "Reaffirm, don't redesign the ticket's IA" | #3299 | declined a from-scratch ticket for lack of new evidence | superseded by Eric's brief and screenshots of 2026-09-21 — the evidence #3299 said it lacked |
| Limit-at-mid as the educational default | #3299 `needs-eric` | open taste call since 2026-08-13 | erodes into the lo-fi review — rendered as an A/B on the frames (call sheet row 14); #3299 closes into the plan issue |
| Open Orders live on the Trade page, not a separate view | #674 (Eric's own issue, 2026-08-27) | placement of pending orders | Eric-authored — a shape that moves them off the Trade page renders the contradiction as an A/B, flagged |
| No one-tap trading; "the review step is the lesson" | `docs/research/trading-desk-ux.md:68-69` | a written skip of swipe/one-tap submit | Claude-derived — overturnable only with a plan-field gate (call sheet row 23) |
| Four named shapes for `/accounts`: Eric chose "The Cockpit" over The Ledger · The Card Stack · The Drawer | #2953 (2026-09-11) | the cockpit name and its rejections | the trade shapes must not reuse those names; #2953's four are seeded as PATTERNS rows |

---

## 4. Cross-examination — feature × {Robinhood, Fidelity, thinkorswim} × Skynet today

`have` · `partial` · `missing` · `built-unwired` (code exists, no surface) · `skip by design`. Tiered by
effect on *executing a trade*. Each row names the backend prerequisite; envelope status is from
`envelope-scan --check` (all order-path files open, #928) — no row needs the platter. Three audit rows were
corrected by the blue pass: alerts, the payoff diagram and strategy templates are **built-unwired**, not
missing. Two prior decisions were added to §3.4: #674 (open orders live on the Trade page) and
`trading-desk-ux.md:68-69` (no one-tap trading; the review step is the lesson).

### Tier 1 — blocks execution

| Feature | Robinhood | Fidelity | thinkorswim | Skynet today (file) | Call | Prerequisite |
|---|---|---|---|---|---|---|
| See open / pending orders | Pending list + watchlist badge [R13][R21] | Orders page, statuses [F18][F19] | Working Orders with counts [T-TTA] | **partial** — API landed (P1 slice 1, `src/server/trade-orders-routes.ts`); shell surface waits on the #674 fork | build (P1) | done: `GET /api/trade/orders` over `listOrders` |
| Cancel an order | Cancel/Replace flow, swipe gestures [R13][R34] | Attempt to Cancel → Verified Canceled [F18] | Right-click cancel, batch cancel [T-TTA] | **partial** — `POST /api/trade/cancel` landed with an audit line (P1 slice 1); no shell button yet | build (P1) | done: own-account client + `intent: "cancel"` audit line |
| Modify / replace an order | Replace (limit/stop, same type); drag pill [R13][R63] | Change order = cancel-and-replace [F20] | Cancel/replace reopens the ticket; drag on the ladder [T-TTA][T-ATE] | **built** (P1 1b) — a Modify drawer on the row; the broker's new id is audited with `replaces`, the old row reads `Replaced · now <id>` | done | the lineage lives in the order audit ledger (`order-audit-log.ts`), not `activity-store.ts` — a fill on the new id still names the order the member placed |
| Pending state in the domain | pending · partially filled · queued [R13] | open · pending · partially filled [F19] | 20-state vocabulary [T-OS] | `OrderStatus = filled \| rejected` (`src/domain/types.ts`); adapter treats accepted as filled | build (P1) | widen the union; unwind `AlpacaBrokerAdapter`'s optimism |
| Submit a multi-leg spread | Multi-leg since 2018; ≤4 legs on Legend [R69][R63] | ≤4 legs net basis [F29][F38] | Spread menu; Analyze → send [T-VS] | **have** (P3 slice 1) — `mleg`, one net limit in Alpaca's sign, live re-check, level-3 gate, Day/GTC (`draft-trade-service.ts`) | done — gate wiring on a held PR | — |
| Close on a limit | Sell ticket = full ticket [R10] | Sell from the row prefills a limit at bid [F38] | Closing order via Order Entry [T-PS] | **missing** — closes are market-only (`blotter-row.tsx:321-327`, `option-ticket.ts:243`) | build (P1) | pass `orderType` through the close path |

### Tier 2 — erodes trust

| Feature | Robinhood | Fidelity | thinkorswim | Skynet today | Call | Prerequisite |
|---|---|---|---|---|---|---|
| "Confirmed" shown for an order never sent | — | — | — | `draft-order-builder.tsx:162` headline on `executed:false` | fix (P0, one line) | none |
| Time in force shown | GFD / GTC visible [R1][R6] | Sheet with 5 options + learn link [F1] | TIF dropdown [T-OET] | **partial** — preview and submit carry `timeInForce` end to end (P1 slice 1, `order-ticket.ts`); the ticket control is a layout slice | build (P1) | done: Day / GTC accepted, previewed, echoed |
| Greeks / bid absent with no reason | Every metric labelled "theoretical" [R36] | — | — | **partial** — coverage line under the chain (source · n of m quoted · as-of) and `$0.00` bids kept (P2 slice 1) | fix (P2) | done at chain level; a per-greek reason stays open |
| Order status on a phone | Pending list is phone-first [R13] | Activity › Orders [F42] | mobile Account History [T-APPSTORE] | **fixed** (P0) — Status is a core column at every width; only P/L and Return fold | fix (P0) | done |
| As-of stamp | NBBO on trade-entry screens [R16] | "As of 10:04:20 AM ET" [F-frames 9] | — | quote header makes no freshness claim (`quote-header.tsx:16-19`) | build (P0) | the quote response already carries a timestamp |
| Honest cancel/status vocabulary | pending · partially filled · queued | Attempt to cancel · Verified canceled | Working · Replacing · TLTC · U R OUT | none surfaced | build (P1) | map Alpaca statuses; never invent one |

### Tier 3 — density and layout (the photographed defects)

| Defect | Reference that solves it | Skynet today | Call |
|---|---|---|---|
| Short inputs stretched full width | Fidelity one-column ticket at 390, label above field [F-frames]; tos ticket fields sized to content [T-OET] | **fixed** (P0) — content-sized tracks, symbol spans two; spacing/type scale in `docs/BRAND.md` | fix (P0) | done |
| Ragged estimate grid (7 items in 4 columns) | Fidelity's sticky footer carries one number; tos confirmation lists rows [T-OET] | **fixed** (P0) — a two-column definition list at every width | fix (P0) | the estimate in the footer is a layout-slice call |
| Jagged sections, no rhythm | All three use one panel grammar per page (Legend widgets, Trader+ workspaces, tos gadgets) | no spacing scale; per-file CSS | fix (P0): tokens for space, radius, size |
| Chain's ITM rail off-screen by default | Fidelity's orange ITM rail sits beside the strike [F-frames 11]; tos shades ITM rows [T-AP] | rail painted on the outermost cells (`straddle-view.tsx:26,104-108`) | fix (P2): shade the row or move the rail to the strike cell |
| No-spot symbol renders every strike | RH windows the chain and scrolls [R34]; tos strikes selector 4 / 8 / SD [T-AP] | `windowRows` bails without a divider (`straddle.ts:55`) | fix (P2): window around the last known mark; a strike-count control |
| Two positions blotters | one Positions surface per reference | `/app/accounts?section=overview` and `/app/u/$id` duplicate | fix (P0): one component, one route |
| Spread legs via dropdowns; single legs via the chain | tos Analyze reuses the chain layout for simulated legs [T-AN]; Fidelity multi-select on the chain [F38] | **built** (P3 slice 2) — the builder renders the same straddle view; Bid = sell, Ask = buy, the tapped price is the limit, held strikes outlined (`draft-leg-form.tsx`) | done |

### Tier 4 — parity nice-to-have

| Feature | Robinhood | Fidelity | thinkorswim | Skynet today | Call | Prerequisite |
|---|---|---|---|---|---|---|
| Watchlist | lists + pending badge [R22][R21] | multiple lists, sync [F27][F38] | linked, dynamic [T-Q] | missing | build (P4) | persisted member state |
| Alerts / notifications | price, options, order-status push [R24][R25][R27] | four alert types, push/text/email [F38] | any value, push/email/SMS [T-AL] | **partial** (P4 slice 1) — `position-watch.ts` is the first member-facing producer on the #586 substrate, surfaced as an Alerts strip on Trade with dismissals by fingerprint, durable on the volume (`jsonl-alert-dismissals.ts`); no delivery | delivery keys are Eric's step | push/email credentials (irreversible class) |
| Greeks / probability on the order screen | tap-a-strike shows greeks + chance of profit [R36] | multi-select shows PoP, max P/L [F38] | Probability ITM/OTM columns [T-DP] | **built** (P2 slice 2) — greeks, IV from the mid, chance of profit beside expected value on the review (`src/options/single-leg-odds.ts`, `option-preview.tsx`) | build (P2) | done; the payoff diagram inline is the falsifier's next move |
| Payoff diagram | Simulated Returns, P/L chart [R38][R40] | P/L calculator [F39] | Risk Profile [T-AN] | **built** on the multi-leg review and the single-leg ticket (`payoff-chart.tsx`); the single-leg ticket also draws today and halfway from `payoff-surface.ts` at the reviewed IV (dotted / dashed, named in the caption) | per-leg IV for the multi-leg builder's dated lines: next-slice | presentation only |
| Strategy templates / builder | Strategy Builder [R37] | strategy dropdown, Strategy Builder [F25][F34] | spread menu, Spread Hacker [T-VS][T-SCAN] | **built-unwired** — `rankStructures` + `outlook.ts` (#587, #2170) | build (P3) | presentation over the ranked list |
| All expirations / LEAPS | scroll right [R34] | weekly/monthly/quarterly/all filters [F25] | weekly/quarterly toggles [T-SETUP] | **built** (P2 slice 1) — paginated with a 3-page budget and one 429 retry (`getExpirations`) | fix (P2) | done; weekly / monthly filters are a layout slice |
| IV on the chain | IV metric [R36] | IV column [F-frames 13] | Impl Vol, SD strikes [T-AP] | missing on the desk | build (P2) | solve from mid via `pricing.ts` |
| Roll | Roll position [R41] | Roll ticket [F9] | right-click roll; Strategy Roller [T-PS][T-SR] | **built** (P3 slice 3) — one ticket from the position row, 1:1, net shown as computed (`roll-row.tsx`) | done | Strategy Roller automation stays declined |
| Exercise / assignment UI | Exercise button; resolution flow [R42] | phone only [F26] | support request [T-EXA] | missing (ingested server-side) | build (P3) | render `option-lifecycle.ts` events |
| Option positions with strike / expiry / greeks | netted greeks [R36] | Option Summary + net greeks [F15][F38] | Position Statement greeks + ITM badge [T-PS] | **built** (P2 slice 3) — `GET /api/trade/option-positions`; the card shows DTE · ITM/OTM · greeks and the netted book with coverage | build (P2) | done; beta-weighting to SPY is the next rung |
| Live fills / quotes | push on fill; sub-second on Legend [R27][R66] | streaming under the ticket [F9] | real-time everywhere | **fills built** (P4 slices 1–2) — per-desk SSE off the activity bus, which the `trade_updates` stream already feeds; the ticket's done head reads its own fill from the stream (`fill-headline.ts`); quotes still poll 15 s | quotes: build (P4) | a quote stream per symbol; the fill stream's `Last-Event-ID` is honoured by re-reading, not replay |
| Buying power / account detail | Account Summary [R59] | three buying powers [F-frames 20] | BP Effect, Account Info [T-AI] | missing (cash only) | **skip by design** for now — paper, one number (PATTERNS) | — |
| Dollar-based orders | dollars by default [R9] | Shares \| Dollars [F-frames 3] | — | refused (`validateQuantity`) | adapt (P2) — whole-share resolution | notional support or rounding |
| Chart beside the ticket | Legend chart populates the form [R63] | Trader+ linked tools [F38] | ticket at the bottom of every tab [T-OET] | chart is a section that *replaces* the ticket | shape question — the lo-fi decides | none |
| 24-hour session, extended hours | 24 Hour Market [R7] | 7:00–8:00 ET limit only [F20] | EXT / EXTO TIFs [T-OT] | missing | skip until the backend can honour it | `extended_hours` on the order |
| Bracket / OCO / OTOCO | none [R1] | OTO / OCO / OTOCO [F4] | 1st Triggers OCO [T-OT] | none | later — the one advanced order that *is* the plan | `order_class` on the wire |
| paperMoney-style reset | — | — | Reset All Balances and Positions [T-FAQA] | none (a support action) | adapt (P4) — must keep earned rungs | account reset that preserves progression evidence |

---

## 5. Vocabulary — the words to ask with

Five per reference, plus the two that bind the whole study.

- **Working order** — an order the broker holds that has not filled, cancelled or expired; the thing the trade surface must show (tos; Fidelity "open").
- **Attempt to cancel → Verified canceled** — the request is not the outcome; the UI says which one it is (Fidelity).
- **Focused view / side-by-side** — one side of the chain simplified, or both sides for multi-leg (Robinhood).
- **Strategy price** — the single net debit or credit a multi-leg is priced at; tapping it opens quantity + limit (Robinhood).
- **Natural price vs mark** — bid-to-sell / ask-to-buy versus the midpoint; the anchor a limit aims at (Robinhood, tos "mark").
- **Session selector** — Market / Extended / 24-hour, which changes allowed order types and expiry (Robinhood).
- **Straddle view** — strike down the centre, calls left, puts right (Fidelity; distinct from the straddle *strategy*).
- **Time in force** — Day / GTC and the rest; shown, never silent (Fidelity, tos).
- **OTOCO / 1st Triggers OCO** — an entry that, once filled, releases a target and a stop as a pair; the one advanced order that *is* a plan (Fidelity, tos).
- **Roll** — one order that closes a leg and opens its replacement, 1:1 (Fidelity, tos).
- **BP Effect** — what the position does to available capital, shown per position and at confirm (tos).
- **Price slice** — a hypothetical underlying price at which P/L and probability are computed (tos).
- **Risk Profile** — the expiration curve and the today curve on one payoff chart (tos).
- **paperMoney** — practice as the same UI one switch away, with a reset control and a stated fiction (tos).
- **Trigger variable** — what a reward mechanic actually rewards; safe iff it is not trade count (the ledger's hinge, from Tierney and the Massachusetts order).
- **Transfer** — whether a habit learned on paper survives contact with real capital: builds · neutral · must-unlearn ⇒ skip.

---

## 6. Scenario navigator — the study as a queryable model

Eric, 2026-09-21: "I'd expect the research to be able to answer questions / navigate a multiple of
combination/permutations of mock scenarios." A flat inventory answers *does X exist*; a designer
drawing a frame needs *what happens when* — per reference, per our code — for any combination. So
the study is compiled into a dimension model (`docs/design/scenario-navigator/scenarios.json`) and a
page that composes an answer for any permutation (`docs/design/scenario-navigator/index.html`;
published as the private artifact *Trading Scenario Navigator*,
https://claude.ai/artifact/96z65tUsjuyhrQgpDbLofZ). Every fact in the model cites a row
of §1–§4 or reads `not-shown`; nothing is invented, and a combination the study cannot answer says so.

### The dimensions

| Dimension | Values | Notes |
|---|---|---|
| instrument | stock · call · put · vertical spread · iron condor | 5 |
| action | buy / open long · sell to open (cash-secured put, covered call) · sell / close · buy to close · roll · exercise · assignment | 7; stock × roll / exercise / assignment are not real scenarios |
| order type | market · limit · stop · stop-limit · trailing stop · bracket / OCO | 6 |
| time in force | day · GTC · IOC / FOK · extended session (AM / PM / 24 h) | 4 |
| lifecycle stage | draft · review · submitted / accepted · working · partially filled · filled · modify / replace · cancel · rejected · expired · assigned / exercised | 11 |
| device | phone · desktop | 2 |
| ladder | rung unlocked · rung locked | ours; references map to approval levels |

7 dimensions → **36,960 permutations, 33,408 real scenarios**. Each dimension value carries a fact per
reference (Robinhood · Fidelity · thinkorswim) and for Skynet today (with a `file:line` and a status);
**65 override rules** replace the default where a combination breaks it (Robinhood: trailing stops on
stocks only, market on options single-leg 9:35–4 only, replace only for limit/stop of the same type,
no brackets; Fidelity: options trailing stops in $ only, no on-the-close for options, extended hours
limit-only with no GTC; thinkorswim: market is DAY only, MOC/LOC before 3:45, Walk Limit options only,
overnight TIFs ≤ 6 months, spreads need margin; Skynet: TIF forced market→day and limit/stop→GTC,
closes market-only, no replace, no pending state, multi-leg `executed:false`, zero-DTE gated by 501,
the sell side never locked, ≤ 20 expirations, `$0.00` bids dropped, no extended hours, no fractional).

### Coverage — what the research can answer today

| Reference | Scenarios answered with no `not-shown` line | Where it is thin |
|---|---|---|
| Robinhood | 25,056 / 33,408 (75.0%) | IOC / FOK on stocks and options; "buy to close" wording; partial-fill vocabulary; a condor in the Strategy Builder; the short-selling ticket (announced only) |
| Fidelity | 16,608 (49.7%) | how an assignment surfaces; Rejected / Expired labels; how an exercised position renders; brackets on mobile and for options; which five TIFs the mobile sheet lists; the phone roll ticket (claimed, not framed) |
| thinkorswim | 13,792 (41.3%) | mobile working orders / cancel / replace / partial fills (no text manual); mobile roll; options in the extended session; IOC / FOK; the exact spread menu; an in-platform exercise menu |
| Skynet today | 33,408 (100%) — the audit read code | worst status per scenario: **missing 98.4%** · partial 1.4% · skip-by-design 0.2%; the stage and TIF dimensions dominate (working, cancel, modify, partial, expired, extended, IOC are all missing) |

The thin cells are the research follow-ups; Eric's redacted frames of Robinhood or thinkorswim would
upgrade the largest ones (mobile order management, brackets, assignment surfacing) from `doc-inferred`
or `not-shown` to `frame` in one pass.

### Worked scenarios (five of the ten hard cases the page was verified against)

| Scenario | Robinhood | Fidelity | thinkorswim | Skynet today | Rendered in |
|---|---|---|---|---|---|
| Phone · rung locked · **working limit order to roll an iron condor**, GTC | Level 3 needed, cash accounts can't; roll not offered on cash accounts [R31][R33][R41] | GTC 180 d; Tier 2 for spreads; mobile "can roll" but the phone roll ticket was not framed [F1][F12][F7] | Spreads permission red with an apply link; margin account; mobile order management and roll **not shown** [T-ACCT][T-SR] | no such stage — submit is dead (`executed:false`) under a "Confirmed" headline; 401 gates the builder (missing) | not a rendered flow — roll is a disabled, explained door on Register 6 and 10 ("after P3"); the working-spread row exists on Register 10 |
| Desktop · **modify a working trailing stop** to buy a stock, extended session | not replaceable (only limit/stop, same type); stops don't execute outside RTH [R13][R6] | not allowed — extended hours are limit only; replace is quantity-only after hours [F20][F47] | trailing by $ / % / tick; EXT / AM / PM TIFs; cancel/replace reopens the ticket [T-OET][T-TSL][T-OT] | trailing stop not modelled; no extended hours; no replace (missing) | journey 7 |
| Phone · **assigned on a short put** | exercise from the position with a "reasons not to exercise" review; auto-exercise ≥ $0.01; closed bucket "assigned" [R42][R49] | by phone before 4:15 PM; how the assigned position renders **not shown** [F26] | DNE is a support request; Trade Price = strike, Cost = strike ± premium [T-EXA][T-FAQG] | OPASN ingested server-side, nothing renders it (missing; `option-lifecycle.ts`) | **not rendered by any journey** — an honest gap in the lo-fi; a "closed by assignment" row is the candidate |
| Phone · **submit a market order to buy a call, GTC** | market on a single-leg option only 9:35–4, blocked on low OI [R45] | Market in the sheet; GTC 180 d | not allowed — market is DAY only [T-OET] | cannot be chosen — market is always sent as day and the TIF never shown; accepted is treated as filled (missing / partial) | journey 9, branch B — after the red pass, step 9 is the #3299 A/B itself (limit review vs market review → accepted → filled) |
| Phone · rung unlocked · **cancel a working IOC limit to sell a stock short** | IOC / FOK **not shown**; short selling announced 2025-09-10, ticket undocumented [R1][R68] | short / cover is a desktop dropdown, margin only; phone **not shown** [F38] | mobile order management, shorting rules and IOC / FOK all **not shown** | TIF forced; "this desk never shorts" (skip by design; `progression.ts:14`) | journey 6 |

### What the model changed in the study

- Two cited lines had drifted on this branch and are corrected above: `draft-order-route.ts:263`
  (`executed: false`) and `alpaca-options-client.ts:106-109` (`num()` requires `> 0`).
- Three facts the brief hinted at are **not** in §1 and were left out of the model on the never-invent
  rule (Fidelity "GTC not for shorts" and "a dollar-limit is valid one day"; Robinhood "fractional
  orders cancel-only"); if they belong they get a §1 row first.
- After the red pass on the shapes (2026-09-21): partially filled, rejected and expired rows render on journey 6; the market-order submit renders on journey 9's B branch; roll is a disabled door; assignment renders nowhere yet.
- The Skynet headline status (`missing` for 98.4% of scenarios) is honest but blunt: the per-line
  statuses in the card are the useful read, and the number is what the parity plan's P1 (stage and
  TIF) is for.

---

## Sources

Frames: the *Fidelity Ticket Study* (private artifact, 15 redacted phone frames, 2026-09-05) — never in
the repo. This document is the inventory of record (no separate inventory artifact — a page that can be
lost adds nothing a repo file lacks; the tiger pass, 2026-09-21). The lo-fi shapes are committed as
`docs/design/lofi/trading-journeys.html` and published from it as the private artifact **Trading Journeys
— Lo-fi**, https://claude.ai/artifact/H8zbzDxvn2Nw4HW1nPt1C3 (v1 after the red/tiger pass, 2026-09-21). The scenario navigator (§6) is the private artifact
*Trading Scenario Navigator*, https://claude.ai/artifact/96z65tUsjuyhrQgpDbLofZ (v1, 2026-09-21).

### Robinhood `[R#]` (help center, newsroom; secondary marked)
R1 order-types · R2 limit-order · R3 market-order-update · R4 stop-limit-order · R5 trailing-stop-order · R6 extendedhours-trading · R7 24hour-market · R9 buying-a-stock · R10 selling-a-stock · R11 tax-lots · R12 average-cost · R13 cancel-a-pending-order · R14 why-hasnt-my-order-been-filled · R15 viewing-stock-detail-pages · R16 using-market-data · R17 using-charts · R18 using-advanced-charts · R19 viewing-indicators · R20 level-ii-market-data · R21 watchlist-and-cards · R22 lists · R23 stock-screeners · R24 price-alerts · R25 options-alerts · R26 notifications-and-messages · R27 updating-your-notification-settings · R28 cortex-digests-methodology · R29 where-can-i-access-first-trade-recommendations · R30 options-investing · R31 options-knowledge-center · R33 advanced-options-strategies · R34 placing-an-options-trade · R35 options-chain · R36 options-chain-metrics · R37 about-the-options-strategy-builder · R38 simulated-returns · R39 options-analyzer · R40 profit-loss-chart · R41 options-rolling · R42 expiration-exercise-and-assignment · R43 options-trading-hours · R44 options-trading-faq · R45 market-order-options · R46 newsroom/options-stop-limit-orders-are-here · R47 index-options · R48 options collateral (articles/360001227606) · R49 investing-tools · R50 pattern-day-trading · R51 day-trading · R52 pattern-day-trade-protection · R53 why-am-i-prompted-to-update-my-investment-profile · R54 newsroom/an-update-on-robinhoods-options-offering · R56 newsroom/a-new-way-to-celebrate-with-robinhood · R57 auto-send · R58 get-started-with-robinhood-legend · R59 widgets-in-robinhood-legend · R60 layouts-on-legend · R61 chart-indicators-on-legend · R62 widget-linking-on-legend · R63 trading-with-robinhood-legend · R64 legend-behaviors-and-settings · R65 auras-on-legend · R66 newsroom/the-legend-awakens · R67 newsroom/introducing-robinhood-legend-charts-on-mobile · R68 newsroom/hood-summit-2025-news · R69 newsroom/introducing-multi-leg-options-strategies · R70 futures-orders · R71 stockbrokers.com/review/robinhood (secondary) · R72 goodux.appcues.com robinhood-haptic (secondary) · R73 CNBC 2021-03-31 confetti (secondary) · R74 recurring-investments (snippet) · R75 applevis swipe-submit (secondary) · R77 ios-widgets (snippet). All `robinhood.com/us/en/support/articles/<slug>` or `robinhood.com/us/en/newsroom/<slug>` unless a domain is shown.

### Robinhood engagement record (§2)
Massachusetts Securities Division complaint E-2020-0047 (2020-12-16) and consent order (2024-01-18) — `sec.state.ma.us/divisions/securities/download/`; FINRA AWC 2020066971201 (2021-06-30) — `finra.org/sites/default/files/2021-06/robinhood-financial-awc-063021.pdf`; SEC PR 2020-321 (2020-12-17); SEC Release 34-92766 DEP request for information (2021-08-27); FCA "Gaming trading" (2022-11-21) and press release (2024-06-20); Tierney, *Investment Games* (Duke L.J. 72; AALS draft); Langvardt & Tierney, *On "Confetti Regulation"*, 131 Yale L.J.F. 717; Barber, Huang, Odean & Schwarz, *Attention-Induced Trading and Returns*, J. Finance 77(6) 3141–3190 (2022) + Berkeley Haas Q&A; Anginer, Piza, Ray & Xu, *Trading Simulations and Real Money Outcomes*, J. Behav. Finance 25(4); Robinhood newsroom posts 2020-06-19, 2020-10-06, 2021-03-31, 2021-04-06, 2021-05-13, 2023-01-17, 2024-03-06, 2024-10-16, 2025-03, 2025-08-19, 2025-09-10, 2026-03-18; secondary: AP via Spokesman-Review 2021-03-31, InvestmentNews on FINRA, WealthManagement and Vinson & Elkins on the MA settlement, Traders Magazine 2023-05-12, Motley Fool and BU RBFL quoting NYT (Popper 2020-07-08), GoodUX/Appcues, Built for Mars, IXD@Pratt 2021/2025, Google Design, Barchart Q1-2023 transcript. Not located: the "you're all set" copy; any Robinhood streak/badge; a design post on haptics or the number roll.

### Fidelity `[F#]` (fidelity.com; secondary marked)
F1 trading/faqs-order-types · F2 help/learn_trading_options.shtml (18.04) · F3 help/learn_order_types_conditions.shtml · F4 help/learn_trading_conditional.shtml · F5 trading/mobile-trading · F6 investing/trading-platforms · F7 options-trading/platforms · F8 active-trader-pro/faqs · F9 products/atbt/help/ActiveTraderTools_Trade_Help.html · F10 ActiveTraderProUserGuide.pdf · F11 ATP_10_New_Features.pdf · F12 options-trading/faqs · F13 Conditional_Orders.pdf · F14 wealthvieu.com Fidelity mobile review (secondary) · F15 help/learn_option_summary.shtml · F16 help/researching_options.shtml · F17 trader-desktop-user-guide/orders · F18 help/learn_orders.shtml · F19 ActiveTraderTools_Orders_Help.html · F20 trading/faqs-placing-orders · F21 accounts/services/content/cancelorder.shtml · F22 help/learn_trading_specific_shares.shtml · F23 help/learn_open_positions.shtml · F24 help/learn_viewing_lots.shtml · F25 ActiveTraderTools_Option_Chain_Help.html · F26 options-trading/options-auto-exercise-rules · F27 mobile/fidelity-investments-app · F28 stockbrokers.com/review/fidelityinvestments (secondary) · F29 trader-desktop-user-guide/trading-support · F30 trader-desktop-user-guide/positions · F32 learning-center …/how-to-trade-options-trader-plus-web · F33 …/how-to-use-trader-plus-web · F34 options-trading/tools · F36 ActiveTraderTools_Alert_Help.html · F37 viewpoints/active-investor/4-ways-to-use-alerts · F38 Fidelity Trader+ Desktop User Guide (PDF 1116040.6.0) · F39 Profit_Loss_Calculator_User_Guide.pdf · F40 ActiveTraderTools_Option_Analytics_Help.html · F42 "Introducing Fidelity Trader+" webinar transcript (2025-10) · F43 ATP "Placing trades and monitoring orders" transcript · F44 ATP "Trading the way you want" transcript · F45 ActiveTraderTools_Watch_List_Help.html · F46 help/learn_trading_stocks.shtml (+ learn_balances) · F47 viewpoints/active-investor/extended-hours-trading (2026-08-20) · F48 Yahoo Finance / BusinessWire Trader+ launch (secondary) · F49 usefidelity.com exercise guide (secondary) · F50 "Trading after hours" transcript · F51 strategyEvaluatorHowTo.pdf · F52 Options Trade Management deck · F53 learning-center rolling-covered-calls · F57 wheremybank.com day-trade counter (secondary, unreachable) · F58 brokerage-review.com Fidelity extended hours (secondary, unreachable). "In-house frames" = the Fidelity Ticket Study artifact, patterns 1–20.

### thinkorswim `[T-…]` (toslc.thinkorswim.com manual; schwab.com; secondary marked)
Manual (`toslc.thinkorswim.com/center/howToTos/thinkManual/…`): T-OET Trade/Order-Entry-Tools · T-OT …/Order-Types · T-OS …/Order-Statuses · T-TSL …/Trailing-Stop-Links · T-WL …/Walk-Limit · T-COND …/thinkScript-in-Conditional-Orders · T-AP Trade/All-Products · T-ATO, T-ATL, T-ATE Trade/Active-Trader/{AT-Overview-Layout, AT-Ladder, AT-Entering-Orders} · T-AN Analyze · T-MON Monitor · T-A&P Monitor/Activity-and-Positions · T-PS …/Position-Statement · T-TTA …/Today-s-Trade-Activity · T-BW …/Beta-Weighting · T-SR Monitor/Strategy-Roller · T-GS Getting-Started · T-TOT …/Trading-on-thinkorswim · T-ACCT …/Account-Features · T-SETUP …/thinkorswim-Setup · T-Q MarketWatch/Quotes · T-AL MarketWatch/Alerts · T-WLG Left-Sidebar/Watch-Lists · T-L2 Left-Sidebar/Level-II · T-AI Left-Sidebar/Account-Info · T-CH charts · T-CHG charts/Chart-Style-Settings/general · T-ST charts/Using-Studies-and-Strategies · T-SCAN Scan · T-SH Scan/Stock-Hacker · T-OH Scan/Option-Hacker · T-CCS Miscellaneous/Custom-Column-Sets · T-FAQA, T-FAQG `center/faq/{Accounts, General}`. Schwab.com: T-TOS trading/thinkorswim · T-DESK …/desktop · T-WEB …/web · T-MOB …/mobile-app · T-PT …/paper-trading · T-POT learn/story/practice-options-trading-on-thinkorswim-platform · T-FAQN …/thinkorswim-trading-tools-faqs-new-traders · T-WEBGS …/getting-started-with-thinkorswim-web · T-VS …/analyze-vertical-spreads-with-risk-profile-tool · T-DP …/options-delta-probability-and-other-risk-analytics · T-STATS …/3-stock-options-trading-stats-on-thinkorswim · T-AOT …/how-to-use-advanced-stock-order-types · T-EXIT …/three-types-options-exit-strategies · T-EXA …/options-exercise-assignment-and-more-beginners-guide · T-WLA …/how-to-use-walk-limit-orders-options-trading · T-CHT …/5-thinkorswim-charting-tools-tips · T-APPLY content/how-to-apply-options-trading. Secondary: T-APPSTORE apps.apple.com id299366785 · T-SA smartasset.com options-permissions-schwab · T-BRWEB brokerage-review.com thinkorswim-web-version. Release notes are JavaScript-rendered and were not cited; most Schwab mobile tutorials are video-only.

### Repo
`envelope.json` (`$openOnPurpose`, #928) · `scripts/envelope-scan.mjs` · `.claude/skills/teardown/SKILL.md` · `docs/PATTERNS.md` · `docs/FOG-OF-WAR.md` · `docs/THE-GAME.md` · `docs/LIVING-UNIVERSE.md` · `docs/BRAND.md` · `docs/research/trading-desk-ux.md` · `docs/research/observatory-consolidation-study.md` · `docs/grind/interrogate.instructions.md` · `docs/research-teams/PLAYBOOK.md` · issues #674, #1461, #1481, #1740, #2017, #2953, #3299; PR #3406 (the interrogation call sheet).
