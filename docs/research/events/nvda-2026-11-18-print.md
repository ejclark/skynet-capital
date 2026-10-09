# NVDA earnings print — nvda-2026-11-18-print

**Kind:** earnings · **Date:** 2026-11-18 (estimate, EST: EDGAR Item 2.02 Q3 cadence; no IR call notice yet) · **Impact:** critical
**Last assessed:** 2026-10-05
<!-- probe-ref: {"symbols":{"NVDA":238.90},"vix":15.52,"daysBand":"critical:21+","adjacentIds":["advance-services-q3-2026-11-19","apec-leaders-shenzhen-2026-11-18","aruoba-inflation-term-structure-2026-11-20","fomc-minutes-2026-11-18","housing-starts-2026-11-18","import-export-prices-2026-11-17","industrial-production-2026-11-17","japan-cpi-2026-11-20","jgb-10y-inflation-indexed-auction-2026-11-16","jgb-20y-auction-2026-11-18","jgb-liquidity-enhancement-1-5y-2026-11-20","jpx-market-closure-2026-11-23","msft-ignite-2026-11-17","mtis-2026-11-17","nahb-hmi-2026-11-17","opex-2026-11-20","pending-home-sales-2026-11-18","philly-fed-mfg-2026-11-19","ppi-2026-11-13","retail-ecommerce-q3-2026-11-19","retail-sales-2026-11-17","russell-recon-preliminary-2026-11-13","survey-of-professional-forecasters-q4-2026-11-16","tic-monthly-2026-11-18","treasury-10y-tips-2026-11-19","treasury-20y-bond-2026-11-18","treasury-2y-note-2026-11-23","treasury-coupon-announcement-2026-11-19","uk-cpi-2026-11-18","uk-labour-market-2026-11-17","uk-ppi-2026-11-18","uk-public-sector-finances-2026-11-20","uk-retail-sales-2026-11-20","umich-sentiment-final-2026-11-20","vix-expiration-2026-11-18"],"adjacentStrongIds":["retail-sales-2026-11-17"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** There is no trade to open today, and the reason is the date: NVIDIA has **not** posted
its call notice (newsroom checked 2026-10-05), so the **2026-11-18** print is an **estimate** and
the house date policy forbids date-keyed entries off an estimate. The notice is due ~**2026-10-28**
(last year: 21 days ahead) — *after* the historical D-20 entry (~Oct 21) — so the classic
positioning bid (S1) cannot open on schedule this cycle. The **August print broke two of the
research's four post-print findings** (reaction-day open→close was +2.30%, not a fade; the week
after was flat, not a bleed), so "don't buy the pop" is downgraded from rule to lean. What still
holds: the 20-day run-up is 15 for 15 (p=0.0032), the last week before the print is dead money
(D-5→D −0.96%, 47% win, p10 −6.46%), and the overnight gap is large but not safe (mean +5.41%, 67% up).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no print-keyed entry | High | The date is an `estimate` (no IR notice as of 2026-10-05); estimates only widen caution, never license an entry | NVIDIA's IR call notice posted **before 2026-10-21** with a confirmed date — that would reopen S1's D-20 entry |
| This week | **Watch — don't chase** the 60-day closing high | Medium | NVDA closed $238.90 on 2026-10-05, its highest close in 60 sessions, with the D-20 window not yet open; a bid arriving this early borrows from the run-up | NVDA closes ≥ **$251** (+5%) by **2026-10-16** — the bid is front-running D-20 and the anchor is wrong |
| This month | **Watch the notice, not the stock** | Medium | The call notice (~2026-10-28 by last year's lead) is the one fact that unlocks anything; hyperscaler capex prints (10-27→10-29) and AMD (~11-03) are the real inputs and all land before D-14 | No notice by **2026-11-06**, or one naming a date outside Nov 17–25 — the cadence read is broken |
| This quarter | **Flat by D-1 (S2); no buying the pop — a lean, not a rule** | Medium | The last week into the print is a coin flip (D-5→D 47%, p10 −6.46%); the reaction-day fade is now 11 red of 15 and the last one was green, so it is weaker evidence than it was | Reaction-day (D+1, est. **2026-11-19**) open→close is green again: two straight greens retires the fade |

**Signals & conditions** — the buy/sell/hold triggers:

- **Buy signal:** no — the date is an estimate, and S1's D-20 entry (~2026-10-21) lands before the notice (~10-28) could confirm it.
- **Never** — open a date-keyed position off the estimated 2026-11-18; the window is honestly **Nov 17–25**.
- **Never** — hold unhedged shares through the print for the gap (S2, flat by D-1).
- **Lean, not rule** — don't buy the post-print pop; Aug's reaction day was +2.30% open→close, so this is a prior, not a law.
- **Watch (dated)** — IR call notice ~**2026-10-28** · MRVL Investor Day **10-06** · FOMC minutes **10-07** · CPI **10-14** · MSFT/GOOG/META/AMZN/AAPL prints **10-27→10-29** (all `estimate`) · AMD ~**11-03** (aggregator-sourced) · midterms **11-03** · opex **11-20**.

## Initial research

### The question, and where this sits

What does the Q3 FY27 print (est. 2026-11-18, after the close) call for — and does anything in the
**August print** change the August playbook ([`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md),
[`nvda-2026-08-26-print.md`](nvda-2026-08-26-print.md))? Verdict: the playbook's *guards* survive;
its *post-print* legs took a hit; its *entry* leg has a structural timing problem this cycle.

### Method

Both instruments re-run with the cache busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`):
`earnings-cycle.mjs NVDA --bench QQQ --peers AMD,AVGO,MRVL` (88 prints, 2004-10-27 → 2026-08-26,
prices through the 2026-10-05 close) and `intraday-edges.mjs NVDA`. Read against the house
playbooks S1/S2/E1/S3/S4 and the kill list in [`multi-symbol-sweep.md`](../multi-symbol-sweep.md);
nothing killed is re-proposed. The 2026-08-26 print is now inside the sample (modern era n=14 → 15).

### Leg 1 — the date: ESTIMATE, modal 2026-11-18, window Nov 17–25

- **Cadence.** Q3 has filed 2023-11-21, 2024-11-20, 2025-11-19 (EDGAR Item 2.02, per the calendar's
  source). FY27 Q2 ended 2026-07-26, so Q3 ends **2026-10-25** (13 weeks on; inferred, not read from
  a filing). The three prior Q3 lags were 23, 24 and 24 days → **Tue 11-17 / Wed 11-18**; the
  later Nov 25 aggregator date would be a 31-day lag, which only NVIDIA's *Q2* has run.
- **Not announced.** nvidianews.nvidia.com's latest releases run through 2026-09-28 and carry no
  "Sets Conference Call for Third-Quarter" notice (checked 2026-10-05). Last year's notice came
  2025-10-29 for 2025-11-19, i.e. **21 days ahead** — so expect ~**2026-10-28**. Aggregators
  repeating "Nov 17" (trendandticker, blockchain.news) cite no NVIDIA source; one said so outright.
- **Consequence.** The notice lands ~D-14 trading days, after S1's D-20 entry (~2026-10-21).
  By the date policy S1 cannot open on schedule; what remains after confirmation is the D-15→D-5
  slice, which the instruments have never tested on its own.

### Leg 2 — the run-up: SUPPORTED (survives its controls)

Modern era n=15: the 20 days into a print average **+9.16%, 15 of 15 positive** against a 68%
base rate (**P = 0.0032**, SURVIVES). Inside it: D-20→D-10 +7.07% (93%), D-10→D-5 +3.17% (73%),
**D-5→D −0.96% (47%)**. Peers over NVDA's *own* windows: AMD 53%, AVGO 47%, MRVL 67% — the bid is
NVDA-specific, not sector seasonal. Caveat from the original study stands: ~15 windows were
examined and P=0.0032 sits at the Bonferroni line; treat as a strong prior, not a fact.

### Leg 3 — the reaction-day fade: MIXED (weakened by the August print)

Reaction day open D+1 → close D+1, modern era: mean **−2.16%, win 27%** (4 green of 15), down from
−2.48% / 21%. The August print is one of the four greens: gap **+6.30%**, open→close **+2.30%**,
close-to-close **+8.74%** (close $209.66 → $227.98). One green in 15 doesn't end a regime, and the
original study's own F5 says the pattern ends *when the crowding does* — but it moves "don't buy
the pop" from rule to lean. The gap itself is large and mostly up (mean +5.41%, 67% up).

### Leg 4 — the post-print week: MIXED, and the August print contradicts the registered test

Close D+1→D+6, modern era: **−2.03%, 40% win** (excess −2.96%) — still negative on average. But
the August print's own D+1→D+6 was **+0.21%** ($227.98 on 08-27 → $228.45 on 09-03: flat), not
the bleed [FT-7](../forward-tests/legacy.md) registered. Scoring FT-7/FT-8/FT-10 belongs to the
August event's own lane; this ledger records only that the tape data exists and reads against them
(FT-8: realized 8.74% vs the ~7.0% implied it priced).

### Leg 5 — the tape into the print (as of 2026-10-05)

- **Price:** NVDA $238.90 (10-05 close), +14.0% from the Aug-26 pre-print close, +4.8% above the
  post-print close; up 6 of the last 9 sessions; at its 60-session closing high.
- **Fundamentals:** Q2 revenue $96.2B; Q3 guide **$108B ± 2%**, gross margin ~74% ± 50 bps, no
  China data-center sales assumed; consensus ~**$108.9B** (aggregator figure — the street sits
  ~0.8% above the guide midpoint, a thin bar). Vera Rubin began production shipments in August,
  guided ~20% of Q3 data-center revenue. **Sep 28: a $150B buyback authorization increase**
  (NVIDIA newsroom) — new since the August ledger.
- **Options:** aggregator pages quote ~**7%** implied for the November print against ~5.4% average
  realized over two years — **low quality** (undated, the print date is itself unannounced); no
  NVDA-specific Nov chain was readable. Treat as a prior only; the pulse nearest the notice should
  replace it.
- **Vol regime:** VIX **15.52** (10-05), 15.31 (10-02), 16.39 (10-01) — 15th percentile, calm.
- **Policy:** H200-to-China is licensed (25% duty) but Beijing is blocking entry; H200 was <1% of
  Q2 data-center revenue — consistent with the guide assuming none. No new action found this week.
- **Intraday (instrument 2):** unchanged read — every intraday strategy trails buy-and-hold net of
  5 bps/side (Sharpe 1.46); overnight-hold is the only near-peer (1.39, still below). E1 stands.

### Leg 6 — adjacency corridor (dated, from the calendar)

- **Upstream inputs, all before D-14:** hyperscaler prints MSFT 10-27, GOOG/META 10-28, AMZN/AAPL
  10-29 (all `estimate`, 8-K cadence) — capex guidance is the demand read-through; AMD ~**11-03**
  AMC (aggregator-sourced, not on this calendar); midterm elections **11-03**; CRWV est. 11-10.
- **Print week:** retail sales **11-17** (high, confirmed), FOMC minutes **11-18** 2pm ET (before
  the after-close print), opex **11-20** (D+2 — weekly gamma on a ~7% implied), Thanksgiving
  11-26; PCE and Q3 GDP-second **11-25**.
- Nothing new proposed: every dated event in the horizon is already on the calendar
  (`event-scan.mjs --on-date` run for 10-27/28/29, 11-03/04/05, 11-13, 11-17→11-20, 11-25).

### What plays the conditions support

1. **Guards (P0):** S2 flat-by-D-1 on unhedged shares; no entry inside the dead zone (D-5).
2. **The one thing that would change the stance:** a **confirmed** date posted early enough that
   the D-20→D-10 leg is still ahead — that is FT-6's first scoreable window.
3. **Don't:** buy the pop on the reaction day (a lean now), hold the print for the gap, or trade
   any of it off the estimated date.

### Honest limits

- The date is an estimate; every date-keyed number above shifts one trading day if the print is
  Tue 11-17, and by a week if it is Wed 11-25 (unlikely on cadence, not excluded).
- Modern-era n=15 on four statistics, one of which was just contradicted; multiple-testing caveat
  from the original study applies (P=0.0032 on the run-up is at the Bonferroni line).
- The implied-move and consensus figures are aggregator-sourced and undated; no primary source
  (IR/SEC) exists yet for anything about this print itself.
- Research is not action; paper-only.

## Stance & kill switches

**Stance (date `estimate`; estimates widen caution, never trigger action):** stand aside until a
confirmed date exists; guards only (S2 flat-by-D-1, dead-zone entry ban). The run-up edge is real
but this cycle's confirmation timing puts its first leg out of reach under the date policy. The
post-print legs are downgraded after August: don't-buy-the-pop is a lean (Medium), the post-print
bleed (S4) stays blocked regardless.

**Kill switches:**
- IR call notice **before 2026-10-21** confirming the date → S1's D-20 entry reopens (re-assess).
- NVDA **≥ $251 close by 2026-10-16** → the bid is front-running the window; the D-20 anchor is wrong.
- Notice naming a date **outside Nov 17–25**, or none by **2026-11-06** → the cadence read is broken.
- Reaction-day open→close green on this print → two straight greens retire the fade (lean → dead).

**Forward tests.** [FT-6](../forward-tests/legacy.md) (S1-tight, D-20→D-10 sub-window) is already
registered and this print is its first scoreable window — not re-registered. New, in this event's own
fragment [`forward-tests/nvda-2026-11-18-print.md`](../forward-tests/nvda-2026-11-18-print.md):
FT-nvda-2026-11-18-print-1 (the date) · -2 (reaction-day open→close) · -3 (the 16th run-up) · -4 (realized vs ~7% implied).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-10-05 | D-44 | Initial research banked (above); both instruments re-run clean, cache busted (prices through 10-05). Run-up 15/15 (p=0.0032) survives; reaction-day fade weakened to 4 green of 15 by the Aug print (+2.30% open→close, +8.74% close-to-close, gap +6.30%); Aug's D+1→D+6 +0.21%. Date still an **estimate** — no call notice on the NVIDIA newsroom (latest 09-28; new: $150B buyback increase); notice expected ~10-28. NVDA $238.90 (60-session closing high); VIX 15.52 (calm); consensus ~$108.9B vs $108B ± 2% guide. Adjacency: MRVL Investor Day 10-06 · hyperscaler prints 10-27→10-29 · AMD ~11-03 (aggregator, not on calendar) · midterms 11-03; no macro surprise; H200 China entry still blocked, <1% of Q2 data-center revenue. Nothing proposed — all dated events in horizon already on the calendar. | — (stance set) | 2026-10-08 (critical, 21–60d band: every 3d) |
| 2026-10-09 | D-40 | **Deterministic screen (no Claude session).** Readings — NVDA $230.48 (-3.5% since last), VIX 15.4 (-0.1pt since last), band unchanged (critical:21+), 35 adjacent event(s) tracked. Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-12 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found **inside the research horizon**
(`assessment-cadence.json`'s `horizon`: nothing past `maxDaysOut`, and past `allImpactsWithinDays`
only critical/high) gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). One past the horizon is named
in the row instead (#2946): it can never become due, so a calendar file for it is clutter, while
prose in a ledger is free. Close-out fills `## Outcome` below from re-run instrument data (cache busted
first), never from memory. After that the assessment is closed; the doc reopens only to score a
registered forward test whose `Score by` has arrived (`forward-test-due`).

**Last assessed:** 2026-10-09
<!-- probe-ref: {"symbols":{"NVDA":230.48},"vix":15.41,"daysBand":"critical:21+","adjacentIds":["advance-services-q3-2026-11-19","apec-leaders-shenzhen-2026-11-18","aruoba-inflation-term-structure-2026-11-20","fomc-minutes-2026-11-18","housing-starts-2026-11-18","import-export-prices-2026-11-17","industrial-production-2026-11-17","japan-cpi-2026-11-20","jgb-10y-inflation-indexed-auction-2026-11-16","jgb-20y-auction-2026-11-18","jgb-liquidity-enhancement-1-5y-2026-11-20","jpx-market-closure-2026-11-23","msft-ignite-2026-11-17","mtis-2026-11-17","nahb-hmi-2026-11-17","opex-2026-11-20","pending-home-sales-2026-11-18","philly-fed-mfg-2026-11-19","ppi-2026-11-13","retail-ecommerce-q3-2026-11-19","retail-sales-2026-11-17","russell-recon-preliminary-2026-11-13","survey-of-professional-forecasters-q4-2026-11-16","tic-monthly-2026-11-18","treasury-10y-tips-2026-11-19","treasury-20y-bond-2026-11-18","treasury-2y-note-2026-11-23","treasury-coupon-announcement-2026-11-19","uk-cpi-2026-11-18","uk-labour-market-2026-11-17","uk-ppi-2026-11-18","uk-public-sector-finances-2026-11-20","uk-retail-sales-2026-11-20","umich-sentiment-final-2026-11-20","vix-expiration-2026-11-18"],"adjacentStrongIds":["retail-sales-2026-11-17"],"screenStreak":1} -->
