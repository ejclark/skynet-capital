# 2-Year Treasury Note auction — treasury-2y-note-2026-09-22

**Kind:** rates · **Date:** 2026-09-22 (confirmed, TSY: home.treasury.gov Tentative-Auction-Schedule.pdf — announcement Thu 2026-09-17, auction Tue 2026-09-22, settlement Wed 2026-09-30, 1:00pm ET; PDF re-fetched and text-extracted direct 2026-09-02) · **Impact:** medium
**Last assessed:** 2026-09-17
<!-- probe-ref: {"symbols":{},"vix":15.94,"daysBand":"medium:0+","adjacentIds":["bea-international-transactions-q2-2026-09-24","boe-decision-2026-09-17","boj-decision-2026-09-18","bowman-stress-testing-2026-09-18","costco-q4-fy2026-2026-09-24","dmo-pilot-switch-auction-test-2026-09-24","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","eia-weekly-petroleum-status-2026-09-23","eurostat-hicp-final-2026-09-17","housing-starts-2026-09-17","industrial-production-2026-09-18","intl-transactions-q2-2026-09-24","japan-cpi-2026-09-18","jgb-liquidity-enhancement-5-11y-2026-09-25","jpx-market-closure-2026-09-21","jpx-market-closure-2026-09-22","jpx-market-closure-2026-09-23","kb-home-q3-fy2026-2026-09-22","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","new-home-sales-2026-09-24","opex-2026-09-18","pending-home-sales-2026-09-17","philly-fed-mfg-2026-09-17","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-global-flash-eurozone-pmi-2026-09-23","sp-global-flash-france-pmi-2026-09-23","sp-global-flash-germany-pmi-2026-09-23","sp-global-flash-us-pmi-2026-09-23","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","treasury-10y-tips-2026-09-17","treasury-2y-frn-2026-09-23","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","treasury-buyback-7y10y-2026-09-17","treasury-coupon-announcement-2026-09-17","trump-xi-summit-2026-09-24","uk-consumer-confidence-2026-09-25","uk-public-sector-finances-2026-09-22","uk-retail-sales-2026-09-18","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26","unsc-iran-panel-mandate-vote-2026-09-17","us-iip-q2-2026-2026-09-24"],"adjacentStrongIds":["opex-2026-09-18"],"screenStreak":1} -->

## At a glance

**TL;DR.** **Watch, no play** — and as of **2026-09-15 (D-7) the two things this doc said last week
both broke, in opposite directions.** The repricing did **not** stop: August CPI printed core
**+0.3%** on 9/11 and the 2Y ran **4.39 → 4.65** in four sessions (+26bp), taking out the 4.39%
"touched three times, never exceeded" 2026 high by **26bp**; 2s10s **41 → 32bp**, so the
bear-flattening resumed rather than stalled. The hike is now **near-consensus, not contested** —
Kalshi's own exchange API reads hike-25 at **0.86/0.87** (~**87%** total hike, ~1% cut) against
~**56%** a week ago, the furthest this doc has ever been from its ~40% kill line. **And the
"composition gradient" this doc registered last week is refuted out-of-sample.** The 9/9 10Y and
9/10 30Y reopenings — the first two auctions after that claim — printed indirect **79.2%**
(**+2.7pp** vs their own prior-4 mean) and **79.5%** (**+16.8pp**), with dealers at **4.3%** and
**2.2%**. Read across six tenors the shape is a **belly dip, not a gradient**: +8.9 (52W) · +8.9
(2Y) · −2.7 (3Y) · −2.6 (5Y) · **+2.7 (10Y)** · **+16.8 (30Y)**. What *survived and strengthened*
is the load-bearing half: **dealer takedown is below its own norm at all six tenors**, at the 30Y a
five-print low of 2.2% — underwriters are absorbing nothing anywhere, so this is still a repricing
being **absorbed**, not a funding stress. New this pass: the 9/22 auction now carries a CUSIP
(**91282CRP8**) with size still unannounced until **9/17**, and the sweep found **Tokyo dark on the
auction day itself** — whose effect on indirect share is a **measured null** (see below), not an
excuse. Date/announcement/settlement **confirmed**; no tracked tickers — nothing here licenses a
position in any name.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/15) | **Stand aside** | High | 7 days out, `symbols: []`, size unannounced until **2026-09-17**, and the 9/16 FOMC sits between here and there — there is nothing to act on. | Nothing at D-7; a symbol-less front-end supply event licenses no action on any horizon |
| This week | **Stand aside — and hold nothing through 9/16** | High | The **9/16** FOMC and the **9/17** size announcement both land before the auction; at ~87/13 the favored branch pays ~1.15:1 into a 14:00 statement carrying an SEP. | The **2026-09-16** decision itself — a hold at these odds, or a hike above 25bp, rebuilds the premise rather than patching it |
| This month | **Watch** — a real read, not background | Medium | First nominal coupon auction after the FOMC; with dealers below norm at six straight tenors, its *composition* is the cleanest test of whether that holds once the decision is known rather than priced. | Dealer takedown **above 12.1%** on **2026-09-22** (**FT-treasury-2y-note-2026-09-22-1**) — the absorbed-not-stressed reading is then withdrawn, not patched |
| This quarter | **Watch** | Medium | Six tenors clearing with underwriters below norm — the 30Y at **2.2%** — is a real counterweight to the standing duration caution; a buyers' strike looks nothing like this. | Indirect **below 57.2%** on **2026-09-22** (**FT-47**) *with* dealers above norm — and, per the measurement below, **not** excusable by the Tokyo blackout |

**Signals & conditions** — the buy/sell/hold triggers:

- **Benign tell (the base case):** dealers ≤ **12.1%** of competitive accepted on 9/22 → the front
  end is absorbing the policy repricing willingly; the duration caution on long-duration tech stays
  a *belly/long-end* story, not a systemic funding one.
- **Bearish-for-duration tell:** dealers above ~13% **and** end users (indirect + direct) below
  ~87% → the repricing has stopped clearing to real money; raise caution one notch on
  long-duration names, still never a directional trade.
- **Composition tell, narrowed 2026-09-15:** indirect below **57.2%** *while* dealers stay ≤ 12.1%
  is a rotation, not a demand failure — but the "gradient with maturity" story behind it is dead
  (10Y +2.7pp, 30Y +16.8pp against their own means), so read it as a **belly-local** dip and do not
  escalate the guard on the indirect line alone.
- **Tokyo tell — pre-registered so it cannot be used as an excuse:** JPX is shut **9/21–9/23**, the
  auction day included (five consecutive dark sessions with the weekend). Measured on 1,108 coupon
  auctions since 2016, a Tokyo holiday moves indirect share the **wrong way** (63.35% dark vs
  61.89% open, Welch t=+0.850; 2Y-only 55.22% vs 55.44%, t=−0.050). **A weak 9/22 indirect print
  may not be discounted as a holiday artifact.**
- **Curve tell:** 2s10s **32bp** (9/14) from 41bp (9/8) — bear-flattening resumed, and the
  repricing's epicentre moved from the 2Y to the **3Y** (+29bp vs +26bp, 9/8→9/14); a
  bear-steepening from here says the driver rotated to the long end.
- **Size tell, on a better primary:** the **$69B** expectation is no longer only a twelve-auction
  constant — Treasury's own August refunding table (`sb0590`, Sep-26 row `69 58 70 44 39 13 22 28`,
  quoted by [`treasury-coupon-announcement-2026-09-17`](treasury-coupon-announcement-2026-09-17.md))
  names it, and that row already executed verbatim once (the 20Y at **$13B** on 9/10). Any deviation
  on **2026-09-17** still breaks the like-for-like series and voids both forward tests.
- **Never** — no directional bet, no new unhedged duration exposure into the 1:00pm ET release.
- **Watch (dated)** — **FOMC Sep 16** · TIC **Sep 16** · size announcement **Sep 17** · 10Y TIPS
  **Sep 17** · BoJ **Sep 18** · OpEx **Sep 18** · Tokyo dark **Sep 21–23** · this auction **Sep 22**
  · 5Y **Sep 23** · 7Y **Sep 24** · settlement **Sep 30**.

## Initial research

**The question, plainly:** the 2-year note is the shortest and most policy-path-sensitive coupon
tenor Treasury issues. What does its 2026-09-22 auction — the first nominal coupon supply after a
FOMC that is now hike-modal — say about who is willing to fund the front end at a repriced rate, and
does it change behavior around the long-duration names this calendar tracks?

**One-line verdict:** front-end demand is *strengthening* into the repricing, not weakening —
the opposite of the belly's story — which makes this a watch-worthy confirming read on an orderly
selloff, and still not a trade: no symbols, no directional edge, no position sized to it.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (rates
mode — no price instruments; the house instruments are symbol-keyed and this event has
`symbols: []`). Every auction figure below comes from **Treasury's own primary record**, fetched
today: the Fiscal Data auctions dataset (`auctions_query`) for the twelve-auction series, and the
2026-08-25 **TREASURY AUCTION RESULTS press release** (treasurydirect.gov `R_20260825_2.pdf`,
decompressed and read directly) for the allotment denominators. Rate levels are Treasury's own
daily par yield curve (`daily_treasury_yield_curve`, 2026 series, fetched today). Date/announcement
provenance is the tentative auction schedule PDF (home.treasury.gov), re-fetched and text-extracted
independently this session. FOMC pricing is carried from [`fomc-2026-09-16.md`](fomc-2026-09-16.md)
(assessed today) plus press-reported CME FedWatch with as-of dates. Each claim dated in line.

### Conviction legs, tested

**1. The date, announcement and settlement are right — SUPPORTED, and the entry is upgraded to
`confirmed` in this PR.** Treasury's tentative auction schedule carries the row verbatim:
`2-Year NOTE · Thursday, September 17, 2026 · Tuesday, September 22, 2026 · Wednesday, September 30,
2026` (announcement · auction · settlement). This calendar entry was filed `estimate` on 2026-09-02
by the 5Y sibling's adjacency sweep, on the *procedural* ground that a sweep should not self-confirm
an event it just discovered — not on any date doubt. That ground is discharged here: an independent
session re-fetched the same primary PDF, and `TSY:` (treasury.gov / treasurydirect.gov auction
schedule) is an authorized `confirmed` prefix in `market-events-data.ts`'s own source-prefix policy,
already carried by every sibling auction on the identical schedule (3Y 9/8, 10Y 9/9, 30Y 9/10, 20Y
9/15, TIPS 9/17, 5Y 9/23, 7Y 9/24). Leaving it `estimate` while the 5Y one PDF line below is
`confirmed` would imply a date doubt that does not exist. **Note what this does and does not
license:** `confirmed` covers the date; the stance below stays observational, and no date-keyed
action follows from it.

**2. The 2-year is leading the entire selloff — SUPPORTED, and it is sharper than the belly read.**
Treasury's daily par yield curve, 2026-08-25 (the last 2Y auction) → 2026-09-01:

| Tenor | 8/25 | 9/1 | Δ |
|---|---|---|---|
| 3M | 3.86 | 3.92 | +6bp |
| 1Y | 4.01 | 4.18 | +17bp |
| **2Y** | **4.17** | **4.39** | **+22bp** |
| 5Y | 4.35 | 4.55 | +20bp |
| 10Y | 4.64 | 4.79 | +15bp |
| 30Y | 5.17 | 5.27 | +10bp |

Monotone decay with maturity: this is a pure **policy-path** repricing, not a term-premium event.
The 5Y sibling's 2026-09-02 amendment called the move "belly-led" off Fed H.15 covering 8/25–8/31;
extending one session to 9/1 shows it is more precisely **front-end-led**, with the 2Y the single
most-affected tenor. 4.39% is the **2026 high** for the 2Y (2026 range 3.38–4.39, low 2026-02-27),
and 2s10s has flattened **47bp → 40bp**. At today's level this auction would clear roughly **19bp
above** August's 4.204% stop and above the twelve-auction series high of 4.315% (2026-07-27) — i.e.
the highest 2Y stop on the tracked record.

**3. The driver is a genuine base-case flip, and it is hike-modal but contested — SUPPORTED,
with the dispersion named.** Warsh's **2026-08-28** Jackson Hole keynote (PCE cited at 3.7%
12-month, 4.1% 6-month annualized) took September from hold-favored to hike-favored: CME FedWatch
**66%** hike on 8/31 (Forbes) and **~65–68%** on 9/1–9/2 (TechTimes), from ~36% pre-speech.
But the prediction venues disagree — the FOMC sibling records Kalshi/Polymarket at **~41–55%**,
"the widest cross-venue gap this ledger has recorded," and a cut at **0%** everywhere. Supporting
prints since: ISM Manufacturing Aug **54.6** with prices paid **71.1**; JOLTS Jul openings
**7.271M**, quits **1.9%** — cooling labor against sticky input costs, the combination that
sustains hike pricing. Target range has been 3.50–3.75% all year. **The 2Y is pricing the path
explicitly:** 4.39% against a 3.92% 3-month bill is ~**47bp** of expected tightening — roughly two
25bp hikes over the tenor's life. That is what makes this auction a policy read rather than a
supply read.

**4. Front-end demand is strong and *improving* — SUPPORTED, and it corrects a standing calendar
assumption.** Twelve consecutive 2-year note auctions, every one **$69B** (Treasury Fiscal Data,
fetched today; shares computed on **total competitive accepted**, the denominator Treasury's own
results release uses — $68.107B on 8/25):

| Auction | High yield | Median | B/C | Indirect | Direct | Dealer |
|---|---|---|---|---|---|---|
| 2026-08-25 | 4.204% | 4.157% | 2.60 | **66.0%** | 23.1% | **10.9%** |
| 2026-07-27 | 4.315% | 4.270% | 2.66 | 56.6% | 34.1% | 9.4% |
| 2026-06-23 | 4.189% | 4.138% | 2.64 | 55.5% | 34.3% | 10.2% |
| 2026-05-26 | 4.071% | 4.015% | 2.64 | 57.6% | 30.1% | 12.3% |
| 2026-04-27 | 3.812% | 3.750% | 2.65 | 56.5% | 31.6% | 11.9% |
| 2026-03-24 | 3.936% | 3.865% | 2.44 | 59.4% | 16.5% | 24.1% |
| 2026-02-24 | 3.455% | 3.403% | 2.63 | 55.9% | 34.3% | 9.8% |
| 2026-01-26 | 3.580% | 3.540% | 2.75 | 64.4% | 28.3% | 7.3% |
| 2025-12-22 | 3.499% | 3.445% | 2.54 | 53.2% | 34.1% | 12.7% |
| 2025-11-24 | 3.489% | 3.434% | 2.68 | 58.1% | 30.7% | 11.2% |
| 2025-10-27 | 3.504% | 3.453% | 2.59 | 53.7% | 34.8% | 11.6% |
| 2025-09-23 | 3.571% | 3.520% | 2.51 | 57.7% | 30.8% | 11.5% |

Prior-11 means: indirect **57.2%**, dealer **12.0%**, bid-to-cover **2.61**. The 2026-08-25 auction
therefore printed the **series-high indirect share** with **below-average dealer takedown** — the
two legs that together mean end users, not underwriters, cleared the paper. Treasury's own results
release adds `Allotted at High 85.68%` and a median of 4.157% (4.7bp inside the stop); against a
press-reported when-issued of **4.208%** (cryptobriefing, 2026-08-25 — *secondary, not primary*;
flagged as such), the stop is a **−0.4bp stop-through**. **The correction this forces:** the 5Y
ledger's live finding is soft *foreign* demand (indirect 61.5% vs a ~65.7% norm), and the calendar
has been carrying that as the durable weak leg of Treasury demand generally. On the 2Y it is not
merely absent — it is inverted. The honest reading is that indirect appetite is **tenor-selective**:
at 4.2%+ with hikes priced, the 2Y offers carry with minimal duration risk, which is precisely the
reserve-manager parking tenor. Weak belly demand and strong front-end demand are consistent, not
contradictory.

**5. Bid-to-cover is inelastic to the repricing — SUPPORTED, and it corroborates FT-20 on a
second tenor.** Across a **+86bp** climb in the clearing yield (3.455% Feb → 4.315% Jul), 2Y
bid-to-cover ran **2.44–2.75**, mean 2.61 — no trend against yield. That is the same claim
[`forward-tests.md`](../forward-tests.md) FT-20 registered for the 3Y (2.54–2.71, σ 0.055, across
+68bp), measured independently here on a different tenor and a longer series. The single outlier is
2026-03-24 (B/C 2.44, dealers 24.1%, directs 16.5%) — one dealer-absorbed auction inside an
otherwise flat band, not a trend.

**6. The sequencing makes this the read-through, not the echo — SUPPORTED.** 9/22 lands **6 days
after** the 9/16 FOMC and **4 after** the 9/18 quarterly OpEx. The 9/17 10Y TIPS reopening is the
only auction between them, and it reads real yields and breakevens, not nominal front-end demand.
So 9/22 is the **first nominal coupon auction to price the post-decision policy path**, and the
9/23 5Y and 9/24 7Y — both `confirmed`, both announced the same 9/17 — inherit whatever it
establishes. The calendar entry's own `notes` field claims exactly this role; this leg is its
evidence.

**7. No-symbol, medium-impact conditioning event — SUPPORTED.** `symbols: []`; the house playbooks
(S1/S2/E1/S3/S4/G1) are symbol-keyed and none applies. Its role is a conditioning input on the
rate-sensitivity read for long-duration names. Sensitivity tier unchanged from the sibling rates
ledgers: CRWV highest, then NVDA/AVGO/MRVL, then mega-cap MSFT/GOOG/META, least direct AAPL/AMZN.

**What plays the conditions support:** none directional, none symbol-keyed — the guard-shaped house
answer. The one thing this event *does* change is the **character** of the standing duration
caution. A selloff whose front end clears with record indirect participation and below-average
dealer takedown is a repricing being **absorbed**, not a funding stress. That distinction argues
against escalating the duration guard on rate levels alone, and it is worth a sentence, not a
position.

**Honest limits.** This auction's size, CUSIP and demand **do not exist yet** — the announcement is
2026-09-17, and the $69B baseline is a primary-sourced twelve-auction constant, not a fact about
this auction. The when-issued 4.208% behind the "stop-through" characterization is **press-sourced,
not primary**; every other figure in leg 4 is Treasury's own. FOMC odds are point-in-time, drift
daily, and the venues disagree by 10–25 points — the cross-venue band, not a single number, is the
honest input. The `+22bp` front-end lead is measured over five sessions (8/25→9/1); one week is a
short window to call a regime. n=12 auctions is a thin series for any distributional claim, and
the indirect share is a noisy allotment statistic, not a demand curve. No symbols, medium impact:
nothing here licenses a trade in any name.

## Stance & kill switches

**Stance (confirmed-date event; no standalone play):** watch-only. Do not size or time any position
off this auction's expected or actual result, in isolation or otherwise. Its actionable role is a
**conditioning input** on the front-end/policy-path side of the long-duration-tech rate read, and
its specific contribution is a *correction*: the soft-foreign-demand concern this calendar carries
is a **belly** phenomenon (5Y indirect 61.5% vs a ~65.7% norm), not a front-end one — the 2Y's last
auction drew the strongest indirect share of its twelve-auction series (66.0% vs a 57.2% prior-11
mean) with below-average dealer takedown, while the 2Y simultaneously led every other tenor in the
repricing (+22bp, 8/25→9/1). Read 9/22 as the first nominal-coupon verdict on post-FOMC front-end
demand, which the 9/23 5Y and 9/24 7Y then inherit. Nothing here is directional.

**Amendment 2026-09-09 (D-13) — the direction of the stance is unchanged; its evidence is
broader and its central claim is stated one level deeper.** Receipt: the ledger row of the same
date. Three changes, none of them a reversal. **(a) The tenor-selectivity finding survives and
generalises.** Measured this pass across four front-end tenors, each latest auction against its
own prior mean, from Treasury's own auction record: 52-week bill **+8.9pp**, 2Y **+8.9pp**, 3Y
**−2.7pp**, 5Y **−2.6pp**. The crossover is located **between the 2Y and the 3Y**, not between the
2Y and the 5Y, and everything from 3Y out is uniformly ~2.6–2.7pp soft rather than progressively
worse. **(b) The mechanism is a rotation, not a shortfall — and this is the sharper claim.**
Dealer takedown came in *below* its own norm at all four tenors (52W 21.4 vs 30.6, 2Y 10.9 vs
12.1, 3Y 10.9 vs 12.3, 5Y 10.0 vs 11.7), with directs rising almost exactly as much as indirects
fell at the 3Y and 5Y. Total end-user demand is intact across the whole front end; what changes
with maturity is *who* the end user is. The consequence for reading 9/22: **indirect share alone
is a partial proxy**, and the 2026-09-08 3Y demonstrated it — indirect fell to a since-March low
while cover printed the 2026 series high. FT-47 remains registered exactly as filed and is not
edited; a second test on the composition leg is registered alongside it
(`FT-treasury-2y-note-2026-09-22-1`). **(c) The rate premise weakened without breaking.** The
front-end lead was a bounded 8/25→9/1 fact: 2Y CMT is **4.39% on 9/8, unchanged from 9/1**,
through the cycle's largest upside payroll surprise. Hike pricing has drifted from ~66% (8/31) to
**~56%** (Kalshi's own API, fetched direct 9/8) — roughly a third of the way to this stance's
~40% kill line, which has **not** fired. Nothing in this amendment is directional and nothing
licenses a position in any name.

**Amendment 2026-09-15 (D-7) — the direction is unchanged; one leg of the D-13 amendment is
withdrawn on its first out-of-sample test, and the other is stronger than it was.** Receipt: the
ledger row of the same date. **(a) The composition *gradient* is refuted, and the withdrawal is
explicit rather than a re-framing.** D-13 located a crossover "between the 2Y and the 3Y" and said
composition rotates foreign → domestic "with maturity." The 9/9 10Y reopening and 9/10 30Y
reopening — the first two coupon auctions after that claim, both re-measured this session from
Treasury's own Fiscal Data record against their own like-for-like prior-4 means — printed indirect
**79.2% (+2.7pp)** and **79.5% (+16.8pp)**. A monotone gradient cannot produce that; the honest
shape across six tenors is **52W +8.9 · 2Y +8.9 · 3Y −2.7 · 5Y −2.6 · 10Y +2.7 · 30Y +16.8**, i.e.
a **belly-local dip** with strength on both sides of it. The 3Y/5Y softness is real and unchanged;
its generalization to "maturity" is withdrawn. **(b) The load-bearing half survived and widened.**
Dealer takedown is **below its own norm at all six tenors** (52W 21.4 vs 30.6 · 2Y 10.9 vs 12.1 ·
3Y 10.9 vs 12.3 · 5Y 10.0 vs 11.7 · 10Y 4.3 vs 8.8 · 30Y **2.2 vs 11.3**), the 30Y print being the
lowest of its own five-auction window. "Absorbed, not stressed" now rests on six observations
rather than four, and `FT-treasury-2y-note-2026-09-22-1` — which tests exactly this leg on the 2Y —
is the better-supported of this doc's two tests. **(c) The rate and policy premises both got
stronger, not weaker.** August CPI printed core **+0.3% m/m / 2.4% y/y** on 9/11 (the
[CPI ledger's](cpi-2026-09-11.md) own close-out, scored from two BLS primaries); the 2Y ran
**4.39 → 4.65** (+26bp) and set a new 2026 high, 2s10s flattened **41 → 32bp**, and Kalshi's own
exchange API reads total hike **~87%** against ~56% at D-13 — the ~40% kill line is further away
than at any point in this doc's life. One honest wrinkle inside that: the repricing's epicentre
moved from the 2Y to the **3Y** (+29bp vs +26bp over 9/8→9/14), which narrows leg 2's "the 2Y is
leading the entire selloff" to "the 2Y is inside the leading cluster." **(d) A new dated adjacency
with a measured null.** JPX is dark **2026-09-21 through 09-23** — the auction day itself — and the
tempting inference (thin Japanese bid → soft indirect → a mechanical FT-47 fire) is **wrong on the
base rate**: n=1,108 coupon auctions since 2016, Tokyo-dark days draw *higher* indirect (63.35% vs
61.89%, t=+0.850), and on 2Y notes alone the difference is −0.2pp (t=−0.050). Pre-registered here
so no later session can use it as an excuse. Three proposals filed in this PR. **No forward test is
registered this pass** — the one candidate worth testing (the 9/17 size printing $69B) is already
owned and adjudicated by
[`treasury-coupon-announcement-2026-09-17`](treasury-coupon-announcement-2026-09-17.md), and two
owners of one judgment is the thing this process exists to prevent. Nothing in this amendment is
directional and nothing licenses a position in any name.

**Kill switches (what would change this stance):**

- **The core one — indirect below 57.2% on 2026-09-22.** The tenor-selectivity read (leg 4) is what
  makes this doc more than a restatement of the 5Y's. If the front end's indirect share falls back
  to or below the prior-11 mean, foreign-demand weakness is **not** tenor-specific, the correction
  above is withdrawn, and the belly ledger's read generalizes. Registered as **FT-47** in
  [`forward-tests.md`](../forward-tests.md), score by 2026-09-23.
- **A size change at the 2026-09-17 announcement.** Twelve straight $69B auctions is a
  primary-sourced constant; any deviation breaks the like-for-like series, changes the absorption
  math, and must be logged off-cadence regardless of when the next pulse is due.
- **The FOMC resolving against the hike-modal base case** (a hold with hike odds falling back under
  ~40%, or any cut). The "2Y is pricing ~47bp of tightening" premise (leg 3) lapses and this reverts
  to routine month-end front-end supply — log the reversion rather than carrying the amendment
  forward on momentum.
- **Bid-to-cover printing outside 2.44–2.75.** The inelasticity read (leg 5) dies on either side,
  and with it FT-20's cross-tenor corroboration; the twelve-auction band stops being usable as a
  base rate for the October (10/26) and November (11/23) 2Ys.
- **An extreme result in either direction** — a stop-through with indirect at a new series high, or
  a material tail with indirect at series lows — landing into a hawkish FOMC aftermath escalates
  this from context to an explicit same-day caution note on long-duration names, worth a pulse
  off-cadence.
- **Nothing here licenses date-keyed *action*.** `confirmed` covers the date only; the stance stays
  observational, and observations widen caution rather than licensing entries.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-02 | D-20 | Initial research banked (doc above); `probe-ref` block populated with real readings this pass, so this event's first `interval-elapsed` pulse is screenable rather than automatically material. **Event tape (primary).** Date/announcement/settlement re-verified verbatim from home.treasury.gov's Tentative-Auction-Schedule.pdf (re-fetched and text-extracted independently today): announce **Thu 2026-09-17**, auction **Tue 2026-09-22**, settle **Wed 2026-09-30**. Entry upgraded `estimate` → **`confirmed`** (`TSY:`) in this PR — the original `estimate` was filed on the 5Y sweep's no-self-confirm rule, not on date doubt, and an independent session on an authorized prefix discharges it. This auction's own size/CUSIP/demand still do not exist (announcement 9/17); Treasury's `upcoming_auctions` API returns nothing for the window, consistent with pre-announcement. **The load-bearing finding — front-end demand is strong, and the calendar's "soft foreign demand" read is belly-specific.** Pulled the full twelve-auction 2Y series from Treasury's Fiscal Data auctions dataset plus the 2026-08-25 results press release (`R_20260825_2.pdf`, decompressed and read direct) for the competitive-accepted denominator: every auction **$69B** Sep-2025→Aug-2026 (a primary-sourced constant, not an assumption), bid-to-cover **2.44–2.75** (mean 2.61) across a **+86bp** climb in the clearing yield. The **2026-08-25** print drew **indirect 66.0%** — the **series high**, vs a 57.2% prior-11 mean — with dealers just **10.9%** (12.0% norm), median 4.157% and `Allotted at High 85.68%`; against a press-reported 4.208% WI (secondary, flagged) that is a **−0.4bp stop-through**. This **inverts** the read the 5Y ledger carries (indirect 61.5% vs a ~65.7% norm): indirect appetite is **tenor-selective**, strongest exactly where carry meets minimal duration risk. Leg 5 also corroborates **FT-20** (3Y bid-to-cover inelasticity) independently on a second tenor. **Macro — and a sharpening of the 5Y's "belly-led" call.** Treasury's own par yield curve 8/25→9/1: 2Y **4.17→4.39 (+22bp)**, 5Y +20, 10Y +15, 30Y +10, 3M +6 — monotone decay with maturity, so the move is **front-end-led**, not belly-led; 4.39% is the **2026 high** (range 3.38–4.39) and 2s10s flattened **47→40bp**. 2Y at 4.39 vs a 3.92% 3M bill prices ~**47bp** of tightening (~two hikes). Driver: Warsh's 8/28 Jackson Hole keynote (PCE 3.7% 12-mo / 4.1% 6-mo annualized) → CME FedWatch **66%** hike 8/31 (Forbes) and ~65–68% on 9/1–9/2 (TechTimes) from ~36% pre-speech; **contested** — the FOMC sibling records Kalshi/Polymarket at ~41–55%, cut 0% everywhere, so the honest input is the **band**, not a number. Prints since: ISM Mfg Aug **54.6**, prices paid **71.1**; JOLTS Jul openings **7.271M**, quits **1.9%**. **Peers:** `symbols: []`; NVDA's 8/26 beat and AVGO tonight are AI-demand tape and bear on rate-demand not at all. **Volatility:** VIX **16.34** (own probe, 9/1 close) — up from the 14.43 2026-low struck 8/28, so the FOMC ledger's cheap-convexity window has partly closed. **Geopolitical:** Brent ~$91 after the Hormuz/Larak escalation feeds the *inflation* leg that drives the hike pricing — for this tenor that is a direct transmission channel, not a long-end-only one. **Sequencing:** 9/22 is 6d after the FOMC, 4d after OpEx, and the **first nominal coupon auction** post-decision (the 9/17 10Y TIPS reads real yields, not nominal front-end demand); the 9/23 5Y and 9/24 7Y inherit its read. **New dated adjacencies — none proposed.** Everything the sweep surfaced is already tracked (TIPS 9/17, OpEx 9/18, 5Y 9/23, 7Y 9/24, SCOOS 9/24, Trump–Xi 9/24, durable goods 9/25). Two deliberate non-proposals, recorded: the **2-Year FRN reopening 2026-09-23** on the same PDF (a floating-rate reopening carries no duration or policy-path read — same call the 5Y sibling made) and the **October 2Y (announce 10/22, auction 10/26)**, which is 34 days from this event and not adjacent to it. **Forward test registered: FT-47** — indirect ≥ 57.2% on 9/22; null pass rate stated up front at **5/11 ≈ 45%** of prior auctions, so it is genuinely informative in either direction. | — (stance set) | 2026-09-09 (medium, 8–30d band: every 7d) |
| 2026-09-09 | D-13 | Pulse check; band unchanged (**medium:8+**). Session ran **2026-09-08 ~20:47 ET** (00:47Z on 09-09), so every close below is **09-08's** and neither the 09-09 10Y reopening nor the 09-09 1:40pm ET buyback had happened yet. Probe materiality reason was the **adjacency corridor**, which went from **7 tracked ids to 27** since D-20 — not a threshold crossing. **The load-bearing finding — the tenor-selectivity call survives, generalises, and the mechanism turns out to be a rotation, not a shortfall.** Pulled each front-end tenor's own auction series from Treasury Fiscal Data `auctions_query` (fetched direct today) and computed bidder shares over competitive accepted, latest print vs that tenor's own prior mean: **52-week bill 09-01 indirect 75.2% vs 66.4% (prior-3) = +8.9pp** · **2Y 08-25 66.0% vs 57.1% (prior-10) = +8.9pp** · **3Y 09-08 62.1% vs 64.9% (prior-12) = −2.7pp** · **5Y 08-26 61.5% vs 64.1% (prior-11) = −2.6pp**. So the crossover sits **between the 2Y and the 3Y**, not between the 2Y and the 5Y as D-20 framed it, and everything 3Y-and-out is uniformly ~2.6–2.7pp soft rather than progressively worse. **Two honest corrections to figures this doc carried:** the 5Y's shortfall is **−2.6pp against a recomputed 64.1% prior-11 norm**, not the "~65.7% norm" inherited from the 5Y sibling; and an independent recomputation of the 2Y prior mean on 10 like-for-like $69B auctions gives **57.07%** against the **57.2%** filed — FT-47's threshold is **not** restated and stays exactly as registered. **The mechanism, which D-20 could not see:** dealer takedown printed *below* its own norm at **all four** tenors (52W 21.4 vs 30.6 · 2Y 10.9 vs 12.1 · 3Y 10.9 vs 12.3 · 5Y 10.0 vs 11.7), with directs rising almost exactly as much as indirects fell further out (3Y direct 26.9 vs 22.8 · 5Y 28.4 vs 24.2). Underwriters are being forced to absorb nothing anywhere on the front end; total end-user demand is intact and only its *composition* rotates foreign → domestic with maturity. **The 09-08 3Y is the proof and the caution in one print** — cover **2.72**, the 2026 series high, struck at the year's highest yield, while indirect fell to its lowest since March. Independently recomputed here (indirect 62.1% / direct 26.9% / dealer 10.9%, b/c 2.72) and matching the [3Y sibling's](treasury-3y-note-2026-09-08.md) own primary close-out field-for-field. **Consequence for FT-47: indirect share alone is a partial proxy**, so a second test is registered on the composition leg (below) rather than editing a registered one. **Rates — the front-end repricing has STOPPED, and D-20's "+22bp lead" is now a bounded 8/25→09/01 fact.** Treasury par yield curve (primary XML, fetched direct today): 2Y **4.39 (09-01) · 4.39 (09-02) · 4.34 (09-03) · 4.37 (09-04) · 4.39 (09-08)** — **unchanged over the entire pulse window**, and 4.39% (the 2026 high) has now been touched **three times and never exceeded**. Over 09-01→09-08 the whole curve is inert: 3M +2bp, 1Y −3, **2Y 0**, 5Y +2, 10Y +1, 30Y −2; **2s10s 41bp** vs 40bp, i.e. the bear-flattening stalled. That the 2Y held flat through the **+162,000** August payroll print (vs ~55k consensus, the cycle's largest upside surprise — [`jobs-2026-09-04`](jobs-2026-09-04.md) owns the primary read) is the substantive rate news: the front end had already priced it. **Macro — the hike-modal premise weakened ~10 points without breaking, and the source improved.** Read **Kalshi's own exchange API direct** this session (`api.elections.kalshi.com`, event `KXFEDDECISION-26SEP`, 09-08 20:47 ET) rather than an aggregator: Hike-25 **0.54/0.55** (mid **54.5%**), Hike->25 0.01/0.02, Hold **0.45/0.46**, Cut-25 0.00/0.01, Cut->25 0.00/0.01 → **~56% total hike, ~1% cut**. This retires a source the [FOMC sibling](fomc-2026-09-16.md) had recorded as relay-only, and it reads **~2–3.5pts firmer** than the 52.5% that sibling logged from defirate at 09-08 04:47 PDT. centralbank.watch, fetched direct, still shows **57.4 / 42.7 / 0.0** — the identical triple that sibling saw stamped 09-04, so treat it as possibly stale and cite the band, not a number. Against D-20's **66%** that is a ~10-point drift toward — not through — this doc's ~40% kill line. `defirate.com/fed-rate-odds` **404** and CME's own FedWatch page **403** are recorded in `probe-ref.blocked`. **Event tape — supply still unannounced, date re-verified, and leg 6 survived an adversarial test.** `upcoming_auctions` (fetched direct) has a forward horizon ending **09-17** and carries **no 09-22 entry**, exactly as a 09-17 announcement implies — **$69B remains a twelve-auction baseline, not a fact about this auction**. The tentative schedule PDF was re-fetched and text-extracted independently today and still reads verbatim `2-Year NOTE · Thursday, September 17, 2026 · Tuesday, September 22, 2026 · Wednesday, September 30, 2026`; `confirmed` stands. **Leg 6 nearly broke on a data-typing trap and was rescued by primary:** `upcoming_auctions` types the 09-17 auction (CUSIP **91282CRE3**) as `security_type: "Note", security_term: "9-Year 10-Month"`, which reads as a *nominal* 10Y reopening and would make **it**, not 09-22, the first post-FOMC nominal coupon. `auctions_query` on that CUSIP settles it: `ref_cpi_on_dated_date` **333.969740**, `index_ratio_on_issue_date` **1.003250**, series **D-2036**, high yield **2.438%** (a real yield), maturity 2036-07-15 — inflation-indexed. **Leg 6 holds, now CUSIP-verified rather than schedule-labelled**; trap recorded for reuse — Fiscal Data types TIPS as `Note`, and the tells are the CPI fields plus a month-end issue date. **Supply-side finding — this auction clears in a front-end buyback gap.** `buybacks_operations` (fetched direct) shows only **two** announced operations from 09-01 forward, both **Cash Management / Nominal Coupons / 1Mo-to-2Y** at **$12.5B max par**, on **09-03** and **09-09** (settling 09-04 and 09-10). Nothing is announced after 09-09, and the calendar's next front-end op is `treasury-buyback-2y3y-2026-10-06` (`estimate`) — so **no announced front-end buyback support stands between 09-10 and 10-06**, i.e. across this auction. `treasurydirect.gov/TA_WS/securities/buybacks` **404**, recorded. **Volatility:** VIX **15.72** (09-08 close, Yahoo `^VIX`) vs **16.34** at D-20 — **−0.62**, well inside the 3-point bar; the FOMC sibling's caveat about a phantom `^VIX` bar stamped **09-07** (a full market closure) reproduces on this session's own pull and is not used. **Peers:** `symbols: []`; nothing in the AI-demand tape bears on front-end auction demand. **Geopolitical:** unchanged in kind from D-20 — the Hormuz/Brent channel feeds the inflation leg that drives hike pricing, and the corridor now also carries `unsc-iran-panel-mandate-vote-2026-09-17` and `unga-81-general-debate-2026-09-22`. **Adjacency — the corridor quadrupled; four entries change how 09-22 should be read.** New within ±5 days since D-20: **`treasury-coupon-announcement-2026-09-17`**, which is the event that *resolves this doc's size tell* and previously had no calendar row to attach to; **`boj-decision-2026-09-18`**, four days out, a policy meeting whose FX-hedged-return channel runs straight into the indirect bid FT-47 measures; **`sp-quarterly-rebalance-effective-2026-09-21`** and **`russell-quarterly-ipo-review-effective-2026-09-21`**, index flows the session before; and **`treasury-2y-frn-2026-09-23`** — the FRN reopening **this ledger deliberately declined to propose at D-20**, since tracked by another lane, which is recorded here rather than re-litigated. Also newly in-corridor: `treasury-buyback-7y10y-2026-09-17`, `treasury-buyback-20y30y-2026-09-24`, `housing-starts`/`pending-home-sales` 09-17, `eurostat-hicp-final-2026-09-17`, `industrial-production-2026-09-18`, `missouri-uocava-ballot-mailing-2026-09-19`, `meta-connect-2026-09-23`, `ecb-economic-bulletin`/`new-home-sales`/`steel-imports-preliminary` 09-24, `umich-sentiment-final-2026-09-25`, `unsc-iran-panel-mandate-expiry-2026-09-26`. **Out-of-corridor but on-thesis, flagged not proposed:** `tic-monthly-2026-09-16` sits 6 days out and is the *actual measurement* of foreign official Treasury holdings — the variable FT-47 only proxies — so its print is worth reading before 09-22 even though it falls outside the 5-day sweep. **New dated adjacencies — none proposed**, with two deliberate non-proposals recorded. **(1) The FOMC blackout end (~09-17/18).** Genuinely load-bearing here — Waller's 09-03 remarks alone moved the 2Y ~5bp, and the blackout lifting puts Fed speakers back on the tape in the four sessions before this auction — but federalreserve.gov's external-communications policy PDF yielded **no extractable text layer** this session and its HTML page served none of the policy language, so there is no primary citation; filing on a remembered rule is not acceptable, and `fomc-blackout-start-*` shows the genre's owner is the FOMC lane, not this one. **(2) The September 52-week bill**, cadence-derived at **2026-09-29** from a clean 4-week series (09-01, 08-04, 07-07, 06-09, 05-12 …): **7 days out, outside the 5-day corridor**, and not yet announced — the same not-adjacent reasoning D-20 applied to the October 2Y at 34 days. **Forward test registered: `FT-treasury-2y-note-2026-09-22-1`** — dealer takedown ≤ **12.1%** on 09-22, the composition leg FT-47 does not test; null pass rate stated up front at **7 of the prior 10 (70%)**, so a **fail** is where the signal is. | **No change in direction — watch-only stands.** Evidence broadened from a 2Y-vs-5Y contrast to a four-tenor gradient with the crossover located between 2Y and 3Y, and the central claim restated one level deeper: end-user demand is intact everywhere, only its composition rotates. Amendment written into the Stance section with this row as its receipt. | 2026-09-16 (medium, 8–30d band: every 7d) |
| 2026-09-15 | D-7 | Pulse check; **band transitioned `medium:8+` → `medium:0+`** (D-7 crosses the 8-day boundary, so the interval tightens 7d → 2d) — that transition, not a threshold crossing, is the probe's materiality reason. Session ran **2026-09-15 ~12:40 ET**, so every close below is **09-14's**; today's 1:00pm ET 20-Year reopening had **not** printed when this row was written (named as a gap, below). **The headline: both of D-13's central findings broke, in opposite directions.** **(1) THE COMPOSITION GRADIENT IS REFUTED OUT-OF-SAMPLE — and it is withdrawn, not re-framed.** D-13 measured four front-end tenors, found the crossover "between the 2Y and the 3Y", and generalised it as composition rotating foreign → domestic *with maturity*. The next two coupon auctions falsify the generalisation. Re-measured this session from Treasury Fiscal Data `auctions_query` (fetched direct, shares over competitive accepted, each print against its own like-for-like prior-4 same-slot reopenings): **09-09 10Y reopening** (9Y11M, **$39B**, CUSIP **91282CRF0**) stop **4.834%**, cover **2.71**, **indirect 79.2% / direct 16.5% / dealer 4.3%** vs a prior-4 mean of **76.5% / — / 8.8%** = **+2.7pp indirect, −4.5pp dealer**; **09-10 30Y reopening** (29Y11M, **$22B**, CUSIP **912810UW6**) stop **5.308%**, cover **2.61**, **indirect 79.5% / direct 18.3% / dealer 2.2%** vs a prior-4 mean of **62.7% / — / 11.3%** = **+16.8pp indirect, −9.1pp dealer**, both the extreme of their own five-print windows. The six-tenor shape is therefore **52W +8.9 · 2Y +8.9 · 3Y −2.7 · 5Y −2.6 · 10Y +2.7 · 30Y +16.8** — **a belly-local dip, not a gradient**. The 3Y/5Y softness stands exactly as measured; only its extension to "maturity" dies. **Limits stated up front:** each long-end prior is **n=4** (Fiscal Data splits reopenings by `security_term`, so the like-for-like slot is thin), and both auctions priced **before** the 09-11 CPI, i.e. they test demand at 4.83%/5.31% but not demand after the print. **(2) THE ABSORPTION LEG SURVIVED AND WIDENED — this is the half that carries the stance.** Dealer takedown is now below its own norm at **six consecutive tenors**: 52W 21.4 vs 30.6 · 2Y 10.9 vs 12.1 · 3Y 10.9 vs 12.3 · 5Y 10.0 vs 11.7 · **10Y 4.3 vs 8.8** · **30Y 2.2 vs 11.3**. Underwriters are absorbing nothing anywhere on the curve, at the highest yields on each series' record. `FT-treasury-2y-note-2026-09-22-1` (dealers ≤ 12.1% on 09-22) is the better-supported of this doc's two tests as a result; **FT-47 is untouched and not restated**. **Rates — the repricing resumed hard and the 2026 high is gone.** Treasury par yield curve, fetched direct today, **09-08 → 09-14**: 3M **3.94 → 4.11** (+17) · 1Y 4.15 → 4.37 (+22) · **2Y 4.39 → 4.65 (+26)** · **3Y 4.44 → 4.73 (+29)** · 5Y 4.57 → 4.80 (+23) · 7Y 4.68 → 4.88 (+20) · 10Y 4.80 → 4.97 (+17) · 20Y 5.26 → 5.37 (+11) · 30Y 5.25 → 5.34 (+9). **D-13's "the front-end repricing has STOPPED" is dead** — 4.39%, "touched three times and never exceeded", was exceeded by **26bp**, and the 2026 range is now **3.38–4.65**. **2s10s 41 → 32bp**, so the bear-flattening resumed rather than stalled, and the **epicentre moved out one tenor**: the 3Y (+29bp) now leads the 2Y (+26bp), which narrows leg 2's "the 2Y is leading the entire selloff" to "inside the leading cluster" — an honest weakening, recorded as such. 2Y at **4.65** vs a **4.11%** 3M bill prices **54bp** of tightening over the tenor, up from 45bp at D-13. At this level the auction would clear ~**45bp** above August's 4.204% stop and ~**34bp** above the twelve-auction series high. **Macro — the driver, and the hike premise is now near-consensus rather than contested.** August CPI printed **core +0.3% m/m / 2.4% y/y** (unrounded **+0.2898%**), headline **+0.4% / 3.4%**, gasoline **+3.9%**, shelter **+0.3%** — not carried from memory but read off the [CPI ledger's own close-out](cpi-2026-09-11.md), which scored it from two BLS primaries on 09-15. **Kalshi's own exchange API, fetched direct this session** (`api.elections.kalshi.com`, event `KXFEDDECISION-26SEP`, 09-15 12:39 ET): **Hike-25 0.86/0.87** (last 0.86, previous 0.83) · **Hold 0.13/0.14** (last 0.14, previous 0.17) · Hike>25 0.00/0.01 · Cut-25 0.00/0.01 · Cut>25 0.00/0.01 → **~87% total hike, ~1% cut**, against **~56%** at D-13 — a **+31-point** move in five sessions and the furthest this doc has ever stood from its **~40%** kill line. Corroborated without substitution from the [FOMC sibling](fomc-2026-09-16.md), assessed today: **91.4%** futures-derived (centralbank.watch, *"Data as of September 14"*) against a venue VWAP of **86.2%** — cite the band, not a number. That sibling also records the **year-end** book at **49.3% on two-or-more 2026 hikes**, which is the part that actually prices a 2-year tenor rather than one meeting. **No kill switch fired; the policy one moved decisively AWAY from firing.** **Event tape — the auction now exists as a security, and the size tell got a better primary from a sibling rather than from here.** `upcoming_auctions` (fetched direct) now carries **2026-09-22 · Note · 2-Year · CUSIP 91282CRP8 · announcement 2026-09-17 · `offering_amt` null** — new since D-13, where the forward horizon ended 09-17 and carried no 09-22 row at all. Its 09-17-announced siblings are CUSIP'd too (FRN 91282CRD5, 5Y 91282CRN3, 7Y 91282CRM5). **Size is still unannounced**, but the **$69B** expectation is no longer only this doc's twelve-auction constant: [`treasury-coupon-announcement-2026-09-17`](treasury-coupon-announcement-2026-09-17.md) quotes Treasury's own August refunding table **`sb0590`, Sep-26 row `69 58 70 44 39 13 22 28`** (2Y **$69B** · 5Y $70B · 7Y $44B · FRN $28B), and that row has now **executed observably once** — the 09-10 announcement printed the 20Y reopening at **$13B**, the row's `13`. The void probability on both forward tests drops accordingly, on a primary this ledger had not been citing. **Supply — D-13's front-end buyback gap survives one more announcement cycle.** `buybacks_operations` re-pulled direct: new since D-13 are **09-10 Liquidity Support, Nominal Coupons 10Y–20Y, cap $6.0B, $5.187B accepted off $10.489B offered** (the cap raised from the standing $2.0B — `treasury-buyback-increase-2026-09-09`'s mechanism, now observed executing) and **09-15 TIPS 10Y–30Y, $500M cap** (results pending). **Still no 1Mo–2Y or 2Y–3Y operation announced anywhere between 09-09 and 10-06**, so the finding that this auction clears in a front-end buyback gap holds, now on two cycles. **Volatility:** VIX **15.72 (09-08) → 16.46 → 17.84 (09-10) → 15.84 (09-11) → 17.10 (09-14) → 17.55** (own Yahoo `^VIX` pull, 09-15 12:39 ET) — it broke the 28-session 14–17 range on 09-10 and has not gone back. **+1.83 against the probe-ref reading, inside the 3-point bar**, so it is not what made this pulse material. The phantom **09-07** `^VIX` bar the D-13 row flagged (a full US market closure, Labor Day) **reproduces again** on this session's pull and is again not used. **Peers:** `symbols: []`; nothing in the equity tape bears on front-end auction demand. **Geopolitical:** unchanged in kind — the Brent channel (above $100 since 09-10) feeds the inflation leg that drives the hike pricing, and the corridor still carries `unsc-iran-panel-mandate-vote-2026-09-17`, `unga-81-general-debate-2026-09-22` and `trump-xi-summit-2026-09-24`. **Adjacency — corridor 27 → 36, and the sweep found a genuine hole in the calendar.** Nine new within ±5 days: `boe-decision-2026-09-17`, `philly-fed-mfg-2026-09-17`, `missouri-map-tro-expiry-2026-09-22`, `uk-public-sector-finances-2026-09-22`, the four `sp-global-flash-*-pmi-2026-09-23` entries, `jgb-liquidity-enhancement-5-11y-2026-09-25`. Only **one** is confirmed high/critical (`opex-2026-09-18`), which is now recorded as `adjacentStrongIds` — a field the D-13 probe-ref predated. **NEW DATED ADJACENCIES — THREE PROPOSED, and they land on this doc's own metric.** **Tokyo is dark 2026-09-21, 09-22 and 09-23 — the 2-Year's own auction day included** — and this calendar tracked none of the three despite already carrying the `jpx-market-closure` genre (2026-11-23, 2026-12-31, 2027-03-22). Sourced at two primaries this session: JPX's own Market Holidays page (`jpx.co.jp/english/corporate/about-jpx/calendar/`, HTTP 200, 33,103 bytes, the page's own *"Update : Feb. 06, 2026"*) reading verbatim *"Sep. 21 (Mon.) Respect for the Aged Day · Sep. 22 (Tue.) Holiday 2 · Sep. 23 (Wed.) Autumnal Equinox"* with footnote 2 *"September 22, 2026, is a holiday in accordance with Rule 3, Paragraph 3 of Act on National Holidays"*; corroborated by Japan's Cabinet Office holiday file (`www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv`, HTTP 200, 21,538 bytes, Shift-JIS) reading `2026/9/21 敬老の日`, `2026/9/22 休日`, `2026/9/23 秋分の日`. With the weekend that is **five consecutive dark sessions (09-19 → 09-23)**, the longest run in Japan's 2026 calendar. Filed as `proposals/jpx-market-closure-2026-09-{21,22,23}.from-treasury-2y-note-2026-09-22.json`, all `estimate`. **AND THE CONSEQUENCE WAS MEASURED, NOT ASSUMED — it is a null, which is the decision-relevant part.** The tempting inference is that a dark Tokyo thins the Japanese bid, softens indirect share, and fires **FT-47** for a mechanical rather than an economic reason. Across **1,108** Treasury note/bond auctions since 2016 (Fiscal Data, shares over competitive accepted, pulled direct this session), the **37** held on a Japanese national holiday drew mean indirect **63.35%** against **61.89%** on Tokyo-open days — **the wrong sign for the hunch**, Welch **t=+0.850**; dealer takedown **20.87% vs 23.52%**, t=−1.412, also the wrong sign for any forced-absorption story. On **2-Year notes alone (n=171)** it is nearly exact: dark **55.22%** (n=9) vs open **55.44%** (n=162), **t=−0.050**. Inside blackouts of three or more consecutive dark sessions (n=15 auctions) mean indirect is **60.57%** vs 61.89%, a subsample containing both tails (2018-09-24 at 40.0%, 2025-02-24 at 85.5%). The nearest precedent is exact: the **2025-09-23** 2-Year auction was itself held on Autumnal Equinox Day and printed **indirect 57.7% / dealer 11.5%**, both on this series' own norm. **Pre-registered as an interpretation guard in the Signals list: a weak 09-22 indirect print may NOT be discounted as a Tokyo-holiday artifact.** **Deliberate non-proposals, recorded.** **(1)** The FOMC blackout end (~09-17) — unchanged from D-13: the genre's owner is the FOMC lane (`fomc-blackout-start-*`) and federalreserve.gov's communications-policy PDF still has no extractable text layer, so there is no primary to file on. **(2)** The **09-29 52-week bill** — still 7 days out, outside the ±5-day corridor, and the coupon sibling's primary read of the 09-17 announcement confirms it carries **no 52-week**, so nothing about it is settled early either. **(3)** The routine bills auctioning inside the corridor (13W/26W on 09-21, **6W on 09-22 itself**) — this calendar tracks no routine bill auctions and one entry would be the first of hundreds; recorded as same-day front-end supply context instead. **(4)** The **October 2Y**, which D-13 declined at 34 days, is now tracked by another lane as `treasury-2y-note-2026-10-26` — recorded, not re-litigated. **Out-of-corridor but on-thesis, flagged not proposed:** `bloomberg-agg-index-rebalance-2026-09-30` (already proposed by the 5Y lane) sits on this auction's **settlement date**, which is when its paper enters the index and the extension bid becomes a real demand channel — worth reading at close-out even at D+8. **Named gap for the next pulse (09-17):** today's **20-Year reopening ($13B, 1:00pm ET)** had not posted results when this session ran at 12:40 ET; it is the seventh tenor for the dealer-takedown count and the first auction to price **after** the FOMC statement is known. **No forward test registered this pass**, deliberately: the one candidate worth testing — the 09-17 announcement printing 2Y at $69B — is already owned and adjudicated by the coupon-announcement ledger, and duplicating it would put two owners on one judgment. | **No change in direction — watch-only stands, and no kill switch fired.** But the D-13 amendment's *gradient* leg is **withdrawn** on its first out-of-sample test (10Y +2.7pp, 30Y +16.8pp against their own means make a monotone rotation impossible) and replaced by a **belly-local dip**; the *absorption* leg is **stronger**, now six tenors of below-norm dealer takedown; and the policy premise moved from contested (~56%) to near-consensus (~87%), away from the kill line rather than toward it. Amendment written into the Stance section with this row as its receipt. | 2026-09-17 (medium, 0–7d band: every 2d) |
| 2026-09-17 | D-5 | **Deterministic screen (no Claude session).** Readings — VIX 15.9 (-1.6pt since last), band unchanged (medium:0+), 50 adjacent event(s) tracked, new in corridor since last pulse: `bea-international-transactions-q2-2026-09-24`, `bowman-stress-testing-2026-09-18`, `costco-q4-fy2026-2026-09-24`, `dmo-pilot-switch-auction-test-2026-09-24`, `eia-weekly-petroleum-status-2026-09-23`, `intl-transactions-q2-2026-09-24` +8 more (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-09-19 |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
