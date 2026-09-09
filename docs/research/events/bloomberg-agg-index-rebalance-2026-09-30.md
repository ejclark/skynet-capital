# Bloomberg US Aggregate Index rebalance — the booking date for a change already fixed on 09-03 — bloomberg-agg-index-rebalance-2026-09-30

**Kind:** sector · **Date:** 2026-09-30 (estimate — **EST: owner-published, from two Bloomberg documents fetched direct and text-extracted this session.** The *US Aggregate Index* factsheet, **June 12 2024** (`US-Aggregate-Index.pdf`, HTTP 200, **141,886 bytes**, 16 content streams inflated), whose index-parameters block reads **"Rebalance Date — The last business day of each month."**; and the *Bloomberg Fixed Income Index Methodology*, **October 15 2024** (`Fixed-Income-Index-Methodology.pdf`, HTTP 200, **1,795,685 bytes**, 456 streams inflated) — the governing document the factsheet says it "is intended to be read in conjunction with" — which states the same rule as a standing mechanic: *"At the close of the last business day of each month, the Bloomberg Indices are reset and bonds formally enter and exit the index."* The last business day of September 2026 is **Wednesday 2026-09-30**, reproduced by weekday arithmetic against the tracked `labor-day-market-closure-2026-09-07` entry and cross-checked against home.treasury.gov's daily yield-curve series. Stays `estimate` **only** because this calendar's confirmed-tier prefixes have no member for an index owner's own methodology) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","case-shiller-hpi-2026-09-29","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","construction-spending-2026-10-01","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","fhfa-hpi-2026-09-29","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","google-adtech-final-judgment-2026-10-02","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","ism-services-2026-10-05","jgb-40y-auction-2026-09-29","jobs-2026-10-02","jolts-2026-09-29","m3-full-report-2026-10-02","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","pce-2026-09-30","pjm-reliability-backstop-procurement-2026-09-30","retail-benchmark-revision-2026-09-28","russell-style-quarter-end-capping-effective-2026-09-30","sp-select-sector-secondary-reweight-2026-09-30","treasury-buyback-10y20y-2026-10-01","treasury-buyback-tips-1y10y-2026-09-29","treasury-coupon-announcement-2026-10-01","umich-sentiment-final-2026-09-25","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0,"blocked":[{"url":"https://www.ishares.com/us/products/239458/","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — and the reason is that this date carries no information, not that the flow is small.** The proposal that filed this id built its case on settlement: the 2Y/5Y/7Y auctioned 09-22/23/24 settle **2026-09-30**, the same session as the rebalance, *"so the new issue enters the index universe at the rebalance."* The owner's own methodology refutes that in one sentence — *"Qualifying securities issued but **not necessarily settled** on or before the month-end rebalancing date will qualify for inclusion in the following month's index"* — and, for Treasuries specifically, *"US Treasuries are added to the Projected Universes of the US Aggregate and US Treasury Indices with an assumed coupon **on the announcement date**, if auctioned in the same month."* Settlement is explicitly irrelevant; those notes would enter this rebalance settling in October. **The September composition change was already public on 2026-09-03**, when Treasury announced the refunding block — **$119bn** of index-eligible coupon supply (3Y **$58bn**, 10Y reopening **$39bn**, 30Y reopening **$22bn**, all settling 09-15), read this session from treasury.gov's own `auctions_query`. Two securities the proposal counted are not eligible at all: the factsheet's Excluded list names *"Inflation-linked bonds, floating-rate issues"*, so the **2Y FRN (09-23)** and the **10Y TIPS (09-17)** never enter. And the tape does not support the size claim either: across **3,920** sessions of 10Y yields (2011-01-03 → 2026-09-04) the last business day of the month averages **−0.88bp** (t=−2.62) and the last three sessions **−2.29bp** (t=−4.11) — real but tiny — while **quarter-end** month-ends average **+0.11bp** (t=0.23, no effect at all), September month-ends **+0.87bp** with only **5 of 15** lower, and the run-in decays to **−1.60bp** (t=−1.54) in 2021-2026. The proposal's *"September is a quarter-end, which is when the extension is customarily largest"* is not visible anywhere in the data. Date `estimate`, `symbols: []`, **zero** house-playbook hits, and the one number that would make this tradeable — the projected duration extension — is published only on a Bloomberg Terminal we do not have. Nothing here licenses a position on any horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-21, `symbols: []`, and the composition change this rebalance books entered the Projected Universe on **2026-09-03** — six days before this sheet was written. There is no information left in the date | Bloomberg publishing an index notice before **2026-09-15** that moves the September rebalance off the last business day, or a methodology revision past the October 15 2024 edition changing the announcement-date inclusion rule |
| This week | **Stand aside** | High | The only index-relevant milestone before **2026-09-17** is the 20Y auction on **09-15**, whose supply already entered the Projected Universe at its **09-10** announcement. Nothing publishes and no index-driven shares move | Treasury's `auctions_query` showing an `announcemt_date` on or after **2026-09-18** for the 20Y bond auctioned 2026-09-15 — announcement would then trail the auction and the "information enters at announcement" leg would need re-checking |
| This month | **Watch two dates, take no position** | Medium | The dates that carry anything are **2026-09-17** (the coupon announcement puts the 2Y/5Y/7Y into the Projected Universe, 13 days *before* the rebalance) and **Friday 2026-09-25**, the factsheet's **T-3** cut-off after which SOMA float adjustments are held constant. Both are data events with no publication and no forced trade | The **09-25 → 09-30** cumulative 10Y move coming in at **−6.5bp or lower** — twice the strongest era's month-end run-in mean, which would say the extension bid is larger in 2026 than in any window measured here |
| This quarter | **Do not carry "quarter-end means a bigger extension" forward** | Medium | Measured and refuted: **62** quarter-end month-ends average **+0.11bp** in 10Y yield against **−1.37bp** (t=−3.17) for the **126** non-quarter-end ones. Whatever the extension does, the quarter-end tape does not show it | The **2026-12-31** rebalance printing a month-end 10Y fall of **5bp or more** with no competing macro catalyst on the session — the year-end instance would then be the exception the September data cannot see |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published but prefix-gapped**. It widens caution about the 09-29/09-30 closes and licenses **no** date-keyed action.
- **The rebalance date is a booking date.** Treasuries enter the Projected Universe **on the auction announcement date**; settlement is explicitly not a criterion. Trade nothing off a settlement/rebalance coincidence.
- **September's block was announced 2026-09-03** — $58bn 3Y + $39bn 10Y reopening + $22bn 30Y reopening = **$119bn**, all settling **09-15**, all already in the forward universe.
- **The 2Y FRN and the 10Y TIPS are not in the US Aggregate** — *"Inflation-linked bonds, floating-rate issues"* are on the Excluded list. Any sizing that counts them is wrong.
- **T-3 = Friday 2026-09-25** is the SOMA float-adjustment freeze; **2026-09-17** is when the 2Y/5Y/7Y enter the forward universe.
- **The month-end bid is ~2bp in the run-in and decaying** — −2.29bp over the last three sessions (t=−4.11) across 2011-2026, but −3.25bp in 2016-20 and only **−1.60bp (t=−1.54)** in 2021-26.
- **Quarter-end is where the effect vanishes**, not where it peaks: +0.11bp (t=0.23) on 62 quarter-end month-ends.
- **The number that would size this is Terminal-gated** — BISL publishes duration-extension forecasts only via `INP<GO>`. No free source read this session carries it.
- **The 09-30 session is unattributable anyway** — `pce-2026-09-30` and `government-funding-deadline-2026-09-30` are both **high** impact on the same day.

## Initial research

### The question

This id reached the calendar as a single proposal from the
[`treasury-5y-note-2026-09-23`](treasury-5y-note-2026-09-23.md) pulse-check adjacency sweep (2026-09-09), filed on
the observation that this calendar tracks equity index flow in detail and carries **no fixed-income index event at
all**. That premise is correct and the entry earns its place. But the proposal attached a mechanism to it:

> the 5-year note auctioned Wednesday 2026-09-23 **SETTLES** Wednesday 2026-09-30 … which is the same session as
> this rebalance — so the new issue **enters the index universe at the rebalance** … index-tracking accounts
> mechanically buying duration into the month-end close are a sponsorship channel for exactly this supply.
> … The same geometry covers the 2Y (09-22), the 2Y FRN (09-23) and the 7Y (09-24), all of which settle 09-30.
> **SEPTEMBER IS A QUARTER-END**, which is when the extension is customarily largest.

The same claim is already written into the 5-year ledger's own text (*"settles 09-30 and enters the index at that
rebalance"*), so it has propagated once.

**So: is settlement the mechanism, is September's extension larger for being a quarter-end, and is any of it
tradeable?**

**One-line verdict:** all three legs fail — settlement is explicitly *not* an index criterion, the quarter-end
premium is not merely absent but measures to zero, and the one number that could size the flow is behind a
Bloomberg Terminal — yet the stand-aside is *sharper* for it, because the reason is now "this date carries no
information" rather than "the flow is probably small."

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow instrument.
Nothing was taken from the proposal on faith.

- **The proposal was read in full first**
  (`proposals/bloomberg-agg-index-rebalance-2026-09-30.from-treasury-5y-note-2026-09-23.json`), per the "your own
  event was proposed by others" rule — then the canonical
  `src/domain/market-events/bloomberg-agg-index-rebalance-2026-09-30.json` was written by this session.
- **Bloomberg US Aggregate Index factsheet** — the document the proposal cited, re-fetched (HTTP 200,
  **141,886 bytes**) and text-extracted by inflating its **16** content streams.
- **Bloomberg Fixed Income Index Methodology, October 15 2024** — **the document the proposal did not read**, and
  the source of everything new here. Fetched direct (HTTP 200, **1,795,685 bytes**), **456** streams inflated. The
  factsheet's own first line names it as the other half of the methodology, so reading one without the other was
  the proposal's structural gap, not an oversight about a peripheral document.
- **treasury.gov** — `api.fiscaldata.treasury.gov` `auctions_query`, filtered 2026-09-01 → 2026-10-05, for every
  September auction's announcement, auction and issue date from the issuer's own record.
- **FRED** — `DGS10`, `DGS2`, `DGS30` daily constant-maturity yields from 2011-01-03 (**3,921** observations each,
  **188** month-ends) for the base-rate work, and `VIXCLS` for the volatility reading.
- **home.treasury.gov** daily yield curve, 2026 — used as an independent business-day calendar.
- **This repo** — the 36-event corridor computed from the calendar files rather than by eye;
  `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped for
  `rebalanc|index.flow|duration extension|aggregate index|AGG|BND` → **zero** substantive hits.
- **One cited source failed** and is recorded in `probe-ref.blocked`: `ishares.com/us/products/239458/` returned
  **403**, and its `.ajax` endpoint returned HTTP 200 with a JavaScript-rendered shell carrying no AUM figure — so
  **AGG's tracked assets are not sized in this sheet**. A first attempt at the methodology PDF under a guessed
  filename also 403'd; the correct filename succeeded and no fallback was substituted.

### Conviction legs, tested

1. **The date rule is the owner's own and reproduces — SUPPORTED.** Both documents agree, and they are independent
   in form: the factsheet states a *parameter* (*"Rebalance Date — The last business day of each month."*), the
   methodology states a *mechanic* (*"At the close of the last business day of each month, the Bloomberg Indices
   are reset and bonds formally enter and exit the index, while cash that has accumulated in the Returns Universe
   during the month is removed."*). September 2026's last business day is **Wednesday 2026-09-30**: `2026-09-07`
   is the only US market holiday in the month (the tracked Labor Day entry), and home.treasury.gov's own daily
   yield-curve series — which publishes exactly one row per bond-market session — carries **09-04 then 09-08**,
   skipping 09-07 and nothing else. What remains `estimate` is the **prefix**, not the fact.

2. **HEADLINE — the proposal's settlement mechanism is REFUTED, verbatim, by the owner.** The methodology's
   *Timing of New Issues* section reads:

   > *"Qualifying securities issued but **not necessarily settled** on or before the month-end rebalancing date
   > will qualify for inclusion in the following month's index, provided the required security's reference
   > information and pricing are readily available."*

   And immediately below, under *Inclusion of When Issued US Treasuries*:

   > *"US Treasuries are added to the Projected Universes of the US Aggregate and US Treasury Indices with an
   > assumed coupon **on the announcement date**, if auctioned in the same month. The coupon is then updated on the
   > auction date. If US Treasuries are not auctioned in the same month as when they are announced, they are added
   > to the Projected Universe of the indices in the month they are auctioned."*

   So a September-auctioned note enters the September rebalance whether it settles on 09-30, on 10-01, or later —
   and it enters the *forward* universe weeks earlier, at announcement. The 09-30 settlement/rebalance alignment
   the proposal built on is a **calendar coincidence with no index content**. It is worth naming why the mistake is
   natural: in the equity index world a settlement or reference date really is the information date, which is the
   analogy the proposal imported. Fixed income runs a two-universe design instead — a static **Returns Universe**
   (the *"backwards"* universe, *"held constant throughout the month"* so *"fund managers avoid having to hit a
   moving target"*) and a dynamic **Projected Universe** (*"an up-to-date projection of the next month's Returns
   Universe"*) — and every change is visible in the forward universe from the day it is knowable.

3. **HEADLINE — the September change was public on 2026-09-03, and it is sized — SUPPORTED, from the issuer's own
   record.** `auctions_query` (fetched 2026-09-09) returns the September refunding block:

   | Security | Offering | Announced | Auctioned | Issued | Coupon | CUSIP |
   |---|---|---|---|---|---|---|
   | Note 3-Year | **$58bn** | **2026-09-03** | 2026-09-08 | 2026-09-15 | 4.375% | 91282CRL7 |
   | Note 9Y-11M (10Y reopening) | **$39bn** | **2026-09-03** | 2026-09-09 | 2026-09-15 | 4.625% | 91282CRF0 |
   | Bond 29Y-11M (30Y reopening) | **$22bn** | **2026-09-03** | 2026-09-10 | 2026-09-15 | 5.125% | 912810UW6 |
   | | **$119bn** | | | | | |

   All three are fixed-rate, above the factsheet's **USD 300mn** Treasury minimum, and past its *"at least one year
   until final maturity"* test — index-eligible on every published criterion. All three entered the Projected
   Universe on **2026-09-03**, and all three settle **2026-09-15**, a fortnight before the rebalance. The single
   largest duration contributor on the month, the **$22bn** 30-year reopening, is therefore not connected to the
   month-end date in any way at all.

4. **Two of the securities the proposal counted are not index-eligible — SUPPORTED, and this is a rules error, not
   a judgment call.** The factsheet's **Excluded** list names *"Inflation-linked bonds, floating-rate issues"*
   among the things the US Aggregate does not hold. So the **2Y FRN** auctioned 2026-09-23 is out by construction,
   and the **10Y TIPS** auctioned 2026-09-17 — which the proposal put in its *"heaviest coupon slate"* — never
   enters either. Nor does `treasury-buyback-tips-1y10y-2026-09-29`, whose whole subject matter sits outside the
   index. The proposal's *"the same geometry covers the 2Y, the 2Y FRN and the 7Y"* is wrong on one of its three.

5. **The dates that DO carry information are earlier than the rebalance — SUPPORTED, and there are exactly two
   left this month.** First, **2026-09-17**: `treasury-coupon-announcement-2026-09-17` is already on this calendar,
   and under leg 2's rule it is the session on which the 2Y (09-22), 5Y (09-23) and 7Y (09-24) enter the Projected
   Universe with assumed coupons — **13 days before** the rebalance they were said to be "entering at." Second,
   **Friday 2026-09-25**: the factsheet's footnote states *"All float adjustment updates to the US Treasury amount
   outstanding in the Projected Universe are made on or prior to **T-3** (3 business days before month-[end])"*,
   and the methodology gives the same freeze for other markets — *"except during the last three days of the month
   when they are held constant."* Counting back from Wednesday 09-30: T-1 = Tue 09-29, T-2 = Mon 09-28, **T-3 = Fri
   09-25** — which is also the *"typically on Fridays"* cadence the same footnote gives for weekly SOMA updates, so
   the last float update and the freeze land on one session. What is being frozen matters and is worth recording
   for the next lane: the Aggregate is **SOMA float-adjusted** — *"US Treasuries held in the Federal Reserve SOMA
   account (both purchases at issuance and net secondary market transactions) are deducted from the total amount
   outstanding. New issuance bought at auction by the Federal Reserve does not enter the index."* Neither date is a
   publication and neither forces a share to move; they are data cut-offs, which is the class this calendar has
   repeatedly declined to file as events.

6. **HEADLINE — the month-end duration bid is real, small, and NOT larger at quarter-ends — SUPPORTED, and this is
   the measured contribution.** The proposal's tradeable claim was that index accounts *"mechanically buying
   duration into the month-end close"* are a sponsorship channel, and that September is when the extension is
   *"customarily largest."* Tested on FRED `DGS10` daily constant-maturity yields, **2011-01-03 → 2026-09-04**,
   **3,920** daily changes and **188** month-ends (the last business day identified from the series' own gaps, so
   the holiday calendar is the data's, not an assumption):

   | Bucket | n | Mean 10Y change | t vs 0 | Sessions lower in yield |
   |---|---|---|---|---|
   | All sessions | 3,920 | **+0.04bp** | 0.43 | 46.9% |
   | **Last business day of month** | 188 | **−0.88bp** | **−2.62** | 51.6% |
   | **…of a quarter-end month** | 62 | **+0.11bp** | **0.23** | 41.9% |
   | …of a non-quarter-end month | 126 | **−1.37bp** | **−3.17** | 56.3% |
   | …of a **September** | 15 | **+0.87bp** | — | **33.3%** |

   The effect exists — a **1bp** rally on the month-end session against a flat baseline, and it reproduces on the
   2-year (**−0.91bp**) and 30-year (**−0.75bp**) too, so it is a curve-wide phenomenon rather than one tenor's
   artifact. It is also entirely absorbed by the non-quarter-end months. **The proposal's premise runs backwards:
   quarter-end month-ends are exactly where the measured bid disappears.**

7. **The bid is in the run-in, not at the close — and it is decaying — SUPPORTED, and it is the one part of the
   proposal's intuition that survives.** Extending the window to the last three sessions of each month, against
   every 3-session window in the sample as the baseline:

   | Window | n | Mean cumulative 10Y change | t vs 0 |
   |---|---|---|---|
   | Every 3-session window (baseline) | 3,918 | +0.11bp | 0.74 |
   | **Last 3 sessions of the month** | 188 | **−2.29bp** | **−4.11** |
   | …2011-2015 | 60 | −2.12bp | −2.21 |
   | …2016-2020 | 60 | **−3.25bp** | **−3.74** |
   | …**2021-2026** | 68 | **−1.60bp** | **−1.54** |
   | …**Septembers only** | 15 | −1.60bp | −0.98 |

   Three things fall out. The **run-in is stronger than the close** (t=−4.11 vs −2.62), which is what a real
   extension trade should look like — portfolios buy duration *ahead of* the reset, not into it. The effect is
   **fading**: strongest in 2016-2020, and in the current era no longer distinguishable from noise at conventional
   thresholds. And **September is a coin flip** — 7 of 15 lower, mean −1.60bp, driven mostly by 2022's −14bp, a
   month whose last week was an FOMC and a gilt crisis rather than a rebalance. Every individual September
   month-end last-3 move, for the record: **−8, −5, +1, 0, −11, +4, +9, −5, −5, +3, +4, −14, +3, +2, −2** bp.

8. **The number that would size this is Terminal-gated — SUPPORTED, and it is the honest reason this sheet cannot
   go further.** The methodology is explicit that the extension *is* knowable both before and after the fact:
   *"At month-end, the extension is known with certainty and easily derived by comparing the duration of the two
   published universes"*, and *"Prior to month-end, BISL publishes periodic index duration extension estimates
   using forecasted turnover and cash estimates. These projections appear in Summary of Index Duration Changes and
   in Benchmark Index Duration Extension & Rebalancing Forecast reports available on **INP&lt;GO&gt;** (the Index
   Publications page on the Bloomberg Terminal)."* We have no Terminal, and no free source read this session
   republishes those figures. So the direction is documented — *"There is usually a lengthening of an index's
   duration each month due to cash and bonds that are being dropped from the index often having lower durations
   than the bonds that remain in or enter an index"* — and the **magnitude for September 2026 is unmeasured here**.
   That is a hard limit on this event, not a gap a later pulse can close from public data.

9. **The corridor swamps the session — SUPPORTED.** **36** tracked events sit within five days, computed from the
   calendar rather than by eye, and the **09-30** session alone carries `pce-2026-09-30` **and**
   `government-funding-deadline-2026-09-30`, both **high** impact, plus `gdp-q2-2026-third`, `adp-employment`,
   `chicago-pmi` and `advance-economic-indicators`; `jobs-2026-10-02` (**high**) lands two days later. It is also
   the same session as two already-researched equity index-flow events,
   [`russell-style-quarter-end-capping-effective-2026-09-30`](russell-style-quarter-end-capping-effective-2026-09-30.md)
   and [`sp-select-sector-secondary-reweight-2026-09-30`](sp-select-sector-secondary-reweight-2026-09-30.md).
   Whatever the 09-30 close prints will be attributable to none of them.

10. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` re-grepped this session for
    `rebalanc|index.flow|duration extension|aggregate index|AGG|BND`: the only hit is a case-insensitive substring
    inside an unrelated word, and no line in either file is keyed to index flow, to fixed income, or to a
    month-end effect. S1/G1 are earnings-dated run-ups, S2 the never-hold-the-print guard, S3 an earnings
    reaction-day fade, S4 an overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open execution rule.
    This is also a paper options app with no Treasury surface, so even a confirmed 2bp curve effect has no
    instrument here.

### What the conditions support

Nothing directional, on any horizon. Four outputs, and the first two correct claims already written down elsewhere
in this repo. **A mechanism correction** — index inclusion for Treasuries keys off the **announcement date**, not
settlement; the proposal's central claim and the sentence already sitting in
[`treasury-5y-note-2026-09-23`](treasury-5y-note-2026-09-23.md)'s text (*"settles 09-30 and enters the index at
that rebalance"*) are both wrong, and September's $119bn block was in the forward universe from **2026-09-03**.
**An eligibility correction** — the **2Y FRN** and the **10Y TIPS** are on the owner's Excluded list; any future
sizing that counts them overstates the flow. **A measured refutation of the quarter-end premium** — 62 quarter-end
month-ends average **+0.11bp** against **−1.37bp** for the 126 others, so "quarter-end means a bigger extension"
should not be carried forward by any lane. **And two dates worth knowing without being events** — the
**2026-09-17** coupon announcement and the **T-3 float freeze on Friday 2026-09-25**.

**No adjacent event was proposed, and the declines are recorded so a later lane does not re-litigate them.**
**DECLINED — the monthly instances** (`…-2026-10-30`, `…-2026-11-30`, and so on): this rebalance recurs twelve
times a year, and filing the series would add twelve low-impact entries a year for a mechanism this sheet measures
at roughly zero. That is the precedent
[`russell-style-quarter-end-capping-effective-2026-09-30`](russell-style-quarter-end-capping-effective-2026-09-30.md)
set when it declined further instances of a measured null — and unlike that ledger's own 12-31 exception, nothing
here argues the next instance is materially different. **DECLINED — the 2026-12-31 year-end rebalance**, despite
being the instance folklore calls the largest: proposing it would contradict leg 6, which measures the quarter-end
premium at zero, and the honest move is to let the falsifier in the *This quarter* row adjudicate it instead of
filing an entry on a hunch this session's own data refutes. **DECLINED — the 2026-09-25 T-3 float freeze and the
2026-09-17 announcement as separate entries**: the first is a data cut-off with no publication and no forced trade
(the class `russell-recon-preliminary-2026-11-13` declined), and the second is already on this calendar as
`treasury-coupon-announcement-2026-09-17`.

### Honest limits

**The magnitude is unmeasured and cannot be measured from here** (leg 8). Everything above establishes that the
rebalance date carries no *information*; it does not establish how large September 2026's extension is, because the
forecast lives on a Terminal. If the extension were unusually large this month, this sheet would not know — though
note that the finding stands anyway, since a large extension known since 09-03 is still not news on 09-30.
**The base rate is a yield proxy, not an index measurement.** `DGS10` is a constant-maturity yield at a 3:30pm
snap; the actual extension trade is a duration purchase across the whole Agg, including MBS, corporates and
securitized product, and a 10-year yield move is a coarse read on it. The direction of the test is right and the
sample is large, but a null on 10Y yields is not the same as a null on index-tracking flow. **The month-end
sessions are contaminated by everything else that happens on them**, and this cuts both ways: month-ends
disproportionately carry macro prints, quarter-end funding pressures and pension rebalancing, so both the −0.88bp
and the +0.11bp readings mix the extension with flows that have nothing to do with it. The quarter-end null in
particular may be a real bid offset by real quarter-end selling rather than an absent bid — the honest statement is
that **the net is zero**, not that nothing happens. **n=15 for September** is small enough that the +0.87bp mean
carries no weight on its own; it is cited as *failing to support* the proposal's claim, not as evidence against it.
**AGG's tracked assets are not sized** — the iShares fetch 403'd (recorded in `probe-ref.blocked`), so this sheet
never establishes how much money mechanically follows the index, which is the one figure that would let a reader
judge the flow's absolute scale. **The methodology read is October 15 2024** and the factsheet June 12 2024; a
newer edition may exist that no fetch this session found. **The date is `estimate`** and every trading-adjacent
statement above carries that label; `symbols` is empty by design and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` owner-published in two Bloomberg documents fetched this session, prefix-gapped
rather than unpublished).** Treat 2026-09-30 as **a booking date for a composition change that was already public
on 2026-09-03, attached to a month-end effect that measures to roughly zero in exactly the month this event
falls.** Four legs. **(a) Settlement is not the mechanism.** The owner's own words — *"issued but not necessarily
settled"*, and Treasuries added *"on the announcement date"* — mean the 09-30 settlement/rebalance alignment the
proposal built on carries no index content at all. **(b) The information is already out.** September's $119bn
index-eligible block (3Y $58bn, 10Y reopening $39bn, 30Y reopening $22bn) was announced **2026-09-03** and settles
**09-15**; the 2Y/5Y/7Y join the forward universe at the **09-17** announcement. **(c) Two of the securities cited
are not in the index** — the 2Y FRN and the 10Y TIPS are on the Excluded list. **(d) The tape refuses the size
claim.** Month-end 10Y: **−0.88bp** (t=−2.62, n=188); quarter-end month-ends: **+0.11bp** (t=0.23, n=62);
Septembers: **+0.87bp**, 5 of 15 lower; the run-in decays from −3.25bp (2016-20) to −1.60bp (t=−1.54) in 2021-26.
Carry forward one thing that outlives this event: **before pricing an index event's effective date, find where the
index's own methodology puts the information — a two-universe fixed-income index publishes every change in its
forward universe the day it becomes knowable, so its "effective date" is the one date on which nothing is learned.**

**Kill switches:**

- **The 2026-09-30 10Y yield falls 3bp or more** — the rebalance session behaves like a duration-bid session
  against a base rate of 2 in 15 Septembers, and leg 6's null needs re-examining (though attribution would still
  be impossible against PCE and the funding deadline on the same day). Registered as
  `FT-bloomberg-agg-index-rebalance-2026-09-30-1`.
- **Treasury's `auctions_query` shows an `announcemt_date` other than 2026-09-17 for the 2Y/5Y/7Y notes** — leg 5's
  "the information enters on 09-17" would be wrong on its date, and the announcement-date rule's application here
  needs re-deriving. Registered as `FT-bloomberg-agg-index-rebalance-2026-09-30-2`.
- **A dated source published between 2026-09-30 and 2026-10-06 attributes the 09-30 Treasury session to the index
  rebalance** — the "unattributable corridor" leg is wrong and the market does read this date as an event.
  Registered as `FT-bloomberg-agg-index-rebalance-2026-09-30-3`.
- **A Bloomberg methodology revision past the October 15 2024 edition changes the announcement-date inclusion
  rule, the Excluded list, or the T-3 float freeze** — legs 2, 4 and 5 rest entirely on that document. Re-check
  the publication date every pulse.
- **The 09-25 → 09-30 cumulative 10Y move comes in at −6.5bp or lower** — twice the strongest era's month-end
  run-in mean, which would say the 2026 extension bid is larger than anything in the 2011-2026 sample and leg 7's
  decay finding is wrong.
- **Any free source is found republishing BISL's duration-extension forecast** — leg 8's hard limit closes, and
  this event becomes measurable rather than merely mechanical for the first time.

**Registered forward tests.** `FT-bloomberg-agg-index-rebalance-2026-09-30-1`, `-2` and `-3` — see
[`forward-tests/bloomberg-agg-index-rebalance-2026-09-30.md`](../forward-tests/bloomberg-agg-index-rebalance-2026-09-30.md).
Observations, never templates. All three score inside the close-out window, which is this event's one evidentiary
advantage: it is 21 days out, so the sheet is adjudicated in weeks.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-21 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-treasury-5y-note-2026-09-23.json`, read in full first). probe-ref baseline set (no symbols by design, **VIX 14.53** at the 2026-09-04 close, band `low:15+`, **36** adjacents, 1 blocked fetch). **DATE RULE VERIFIED FROM TWO OWNER DOCUMENTS:** the *US Aggregate* factsheet (**141,886 bytes**, 16 streams) — *"Rebalance Date — The last business day of each month"* — and the **Fixed Income Index Methodology, October 15 2024** (**1,795,685 bytes**, 456 streams, the document the proposal did not read) — *"At the close of the last business day of each month, the Bloomberg Indices are reset."* Sept 2026's last business day is **Wed 09-30**, cross-checked against home.treasury.gov's daily curve (09-04 → 09-08, skipping only Labor Day). Status stays `estimate` on the **prefix gap** alone. **HEADLINE 1 — THE PROPOSAL'S SETTLEMENT MECHANISM IS REFUTED VERBATIM:** *"Qualifying securities issued but NOT NECESSARILY SETTLED on or before the month-end rebalancing date will qualify for inclusion in the following month's index"*, and *"US Treasuries are added to the Projected Universes … with an assumed coupon ON THE ANNOUNCEMENT DATE, if auctioned in the same month."* The 09-30 settlement/rebalance alignment carries **zero index content**; the notes would enter settling in October. Fixed income runs a two-universe design (static **Returns**, dynamic **Projected**) so every change is visible in the forward universe from the day it is knowable. **HEADLINE 2 — SEPTEMBER'S CHANGE WAS PUBLIC ON 09-03, AND IT IS SIZED:** treasury.gov `auctions_query` (fetched 2026-09-09) gives the refunding block — 3Y **$58bn** (91282CRL7, 4.375%), 10Y reopening **$39bn** (91282CRF0, 4.625%), 30Y reopening **$22bn** (912810UW6, 5.125%) = **$119bn** index-eligible, ALL announced **2026-09-03**, ALL settling **09-15**. The month's largest duration contributor is unconnected to the month-end date. **ELIGIBILITY CORRECTION:** the factsheet Excludes *"Inflation-linked bonds, floating-rate issues"* — the **2Y FRN (09-23)** and **10Y TIPS (09-17)** the proposal counted are **not in the US Aggregate at all**. **THE TWO DATES THAT DO CARRY INFORMATION:** **2026-09-17** (already-tracked coupon announcement; the 2Y/5Y/7Y enter the Projected Universe there, **13 days before** the rebalance) and **Fri 2026-09-25 = T-3**, the factsheet's SOMA float-adjustment freeze (*"made on or prior to T-3"*; the index is SOMA float-adjusted — *"New issuance bought at auction by the Federal Reserve does not enter the index"*). Both are data cut-offs, not filed. **HEADLINE 3 — THE QUARTER-END PREMIUM IS REFUTED, MEASURED:** FRED `DGS10` 2011-01-03→2026-09-04, **3,920** daily changes, **188** month-ends. Last business day of month **−0.88bp (t=−2.62)** vs all sessions **+0.04bp**; reproduces on 2Y (−0.91bp) and 30Y (−0.75bp). But **quarter-end month-ends: +0.11bp (t=0.23, n=62)** against **non-quarter-end −1.37bp (t=−3.17, n=126)**, and **Septembers +0.87bp with 5 of 15 lower**. The proposal's *"September is a quarter-end, which is when the extension is customarily largest"* is not visible anywhere. **THE BID IS IN THE RUN-IN AND DECAYING:** last-3-session cumulative **−2.29bp (t=−4.11)** vs a **+0.11bp** all-window baseline — stronger than the close, as a real extension trade should be — but **2016-20 −3.25bp (t=−3.74)** → **2021-26 −1.60bp (t=−1.54)**, no longer distinguishable. Septembers −1.60bp, 7/15 lower, driven by 2022's −14bp (FOMC + gilt crisis, not a rebalance). **HARD LIMIT NAMED:** BISL publishes the duration-extension forecast only via **INP&lt;GO&gt;** on a Bloomberg Terminal — the magnitude for Sept 2026 is **unmeasured here and unmeasurable from public data**. **Adjacency — peers:** none (`symbols: []`). **Macro:** **36** tracked events within 5d; the **09-30** session alone carries `pce-2026-09-30` + `government-funding-deadline-2026-09-30` (both **high**) plus GDP-third/ADP/Chicago-PMI, and `jobs-2026-10-02` (**high**) at T+2 — plus the two already-researched equity index-flow events on the same date. **Vol:** baseline, no prior; VIX **14.53** (2026-09-04 close). **DATA ARTIFACT:** FRED `VIXCLS` carries a **15.30** value for **2026-09-07**, a full US market holiday, while home.treasury.gov's curve skips 09-07 entirely — the 09-07 VIX reading was NOT used, and the Treasury gap independently corroborates `labor-day-market-closure-2026-09-07` from a primary source. **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped for `rebalanc\|index.flow\|duration extension\|aggregate index\|AGG\|BND` → zero substantive hits; this is a paper options app with no Treasury surface, so even a confirmed 2bp curve effect has no instrument. **BLOCKED:** `ishares.com/us/products/239458/` **403** (its `.ajax` endpoint served a JS shell with no figure) — **AGG's tracked AUM is not sized in this sheet**, which is why the flow's absolute scale is absent. **NO ADJACENTS PROPOSED, THREE DECLINES RECORDED:** the **monthly instances** (12/yr for a mechanism measured at ~zero — the decline-further-instances-of-a-null precedent); the **2026-12-31 year-end rebalance** (filing it would contradict this session's own quarter-end null; the *This quarter* falsifier adjudicates it instead); and the **09-25 T-3 freeze / 09-17 announcement** as separate entries (a data cut-off, and an event already on the calendar). **CROSS-LEDGER CORRECTION:** `treasury-5y-note-2026-09-23`'s text carries the same refuted claim (*"settles 09-30 and enters the index at that rebalance"*) — recorded here, not edited there, since that ledger's rows are append-only and its own next pulse owns the fix. Registered **FT-…-1** (09-30 10Y does not fall ≥3bp), **FT-…-2** (2Y/5Y/7Y `announcemt_date` = 2026-09-17), **FT-…-3** (no dated source attributes the 09-30 session to the rebalance) — all scoring inside the close-out window. | — (stance set: **stand aside** Today/week, **watch two dates, take no position** this month, and **do not carry "quarter-end means a bigger extension" forward** this quarter; the refusal rests on an owner-published but prefix-gapped date whose information content entered the forward universe on 2026-09-03, a settlement mechanism refuted verbatim by the owner, two counted securities that are not index-eligible, a quarter-end premium measured at +0.11bp with t=0.23, and a magnitude that is Terminal-gated and cannot be established from public data) | 2026-09-16 (band tightens to `low:0+`, every 7d, as it crosses inside 15 days). Close-out by 2026-10-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-bloomberg-agg-index-rebalance-2026-09-30.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
