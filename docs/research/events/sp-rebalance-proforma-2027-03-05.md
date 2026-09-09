# S&P DJI March 2027 quarterly rebalance announcement — the index effect is real, enormous, and lands in a print nobody reading the release can transact — sp-rebalance-proforma-2027-03-05

**Kind:** sector · **Date:** 2027-03-05 (estimate — **EST: forward derivation from the owner's own release archive, reconstructed and re-parsed by this session, not inherited.** Nine newsroom index pages fetched direct (`press.spglobal.com/index.php?s=2429&l=100` plus offsets `o=100..800`, HTTP 200 each) → **899** unique dated releases, 2022-05-06 → 2026-09-04. Of the **18** quarterly cycles in that window, **17** produced a constituent announcement and **all 17 landed on the first Friday two weeks before that month's third Friday**; **March is 4 for 4** (2023-03-03, 2024-03-01, 2025-03-07, 2026-03-06). Each of the 17 was then fetched individually and parsed to **700** constituent rows. March 2027's Fridays are the 5th, 12th, **19th** and 26th, so the first Friday is **2027-03-05** and the third Friday **2027-03-19** is already tracked as [`opex-2027-03-19`](opex-2027-03-19.md). Stays `estimate` on three counts, none of them date doubt: the 2027 document does not exist yet, this calendar's confirmed-tier prefixes have no member for an index owner, and a lane may not self-confirm) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fomc-blackout-start-2027-03-06","nerc-computational-load-phase-ii-workplan-2027-03-01"],"screenStreak":0,"blocked":[{"url":"https://www.spglobal.com/spdji/en/documents/methodologies/methodology-sp-us-indices.pdf","status":"403","at":"2026-09-09"},{"url":"https://press.spglobal.com/2026-03-06-Vertiv-Holdings,-Lumentum-Holdings,-Coherent,-and-EchoStar-Set-to-Join-S-P-500-and-S-P-100-Others-to-Join-S-P-MidCap-400-and-S-P-SmallCap-600","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on every horizon — and this time the refusal is not a caution, a capability gap, or a null. It is a measured structural fact: the index effect this family has been circling for three ledgers is real, it is enormous, and 89% of it prints in the opening auction of the reaction session, where nobody reading the release can transact it.** The date itself is the best-sourced thing here: S&P DJI's own newsroom archive, reconstructed independently this session to **899 releases**, puts **17 of 17** quarterly constituent announcements on the first Friday two weeks before that month's third Friday, **March 4 for 4** — so `estimate` is a missing source prefix and an unpublished 2027 document, not missing evidence. **The measurement.** All 17 releases were parsed to **700** constituent rows, of which **318** are clean (non-migration) name-cycles with usable bars. Signed by the direction each name's index action predicts, as excess over its own tier's ETF, the reaction session runs **+4.21% mean / +3.86% median, 278 of 318 correctly signed (p<0.001%)**. Split it at the opening print and the whole thing separates: the **gap** (prior close → open) is **+3.65% / +3.44%, 291 of 318, p<0.001%** — **89% of the median total** — and the **open-to-close remainder** is **+0.58% / +0.33%, 176 of 318, p=6.4%**, not significant. **At the honest unit of independence it is starker.** Names inside one release share one tape, so the cycle is the observation: the gap is positive in **16 of 17 cycles (p=0.03%, median-of-medians +4.50%)** and the intraday remainder in **8 of 17 (p=100%, median-of-medians −0.03%)** — a perfect coin flip. **The only trade this house could place** — long-only, since shorting is blocked house-wide: buy the announced additions equal-weighted at the reaction open, sell at that close — wins **8 of 17 cycles, mean +0.29%, median −0.14%, t=0.53, worst −4.30%**, against the **+4.95% mean per-cycle gap that was positive in 17 of 17** and is unavailable to it. Holding two more weeks to the effective close is **8 of 16, mean +0.05%, t=0.05**, on triple the variance. **This amends a sibling's stance with numbers.** [`sp-rebalance-proforma-2026-12-04`](sp-rebalance-proforma-2026-12-04.md) framed its refusal as a capability statement that *"expires the moment the capability does"* and made a small-cap execution instrument its kill switch. **It would not help** — the effect is not in the session an instrument could trade. **The one durable output is turnover.** Named constituents print **4.08× mean / 3.41× median** their own trailing-60 median volume on the reaction session, **246 of 310 above 2×**, cycle medians **1.91×–6.17×**, **16 of 16** above 1.5×. That is an execution hazard, never a direction.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | The event is **177 days out**, `symbols` is empty by design because the March 2027 roster does not exist until this release publishes, and no house playbook is index-flow-keyed — `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `rebalanc\|index effect\|reconstitut\|deletion\|witching\|closing auction\|opening auction` → **zero hits** in both | A house playbook keyed to index flow or an opening auction landing in `trade-playbooks.md` before **2026-10-09**, this event's next scheduled pulse — there would then be a mechanism to point at this date |
| This week | **Stand aside** | High | Nothing about this event publishes for six months, and the corridor is thin: **2** tracked ids within five days ([`nerc-computational-load-phase-ii-workplan-2027-03-01`](nerc-computational-load-phase-ii-workplan-2027-03-01.md), [`fomc-blackout-start-2027-03-06`](fomc-blackout-start-2027-03-06.md)), neither touching index mechanics | S&P DJI publishing a methodology or schedule change before **2026-10-09** that moves the announcement off the first Friday — 17 of 17 would have its first exception and this entry would need re-dating |
| This month | **Do not build the announcement trade — and the reason is now structural, not a tooling gap** | High | 89% of the effect is in the opening gap (**16 of 17 cycles**); the tradeable remainder is **8 of 17, median −0.03%**. A small-cap execution instrument does not recover it, because the effect is not in the session such an instrument would trade — which corrects the December sibling's kill switch, not just its size | The **2026-12-07** reaction session printing its clean addition cohort at **≥ +2%** equal-weight open-to-close excess vs its tier ETF — the intraday null would have an exception in the very next out-of-sample cycle. Registered as `FT-…-1` |
| This quarter | **Treat the reaction session (2027-03-08 on this convention) as a turnover event on named constituents, and as nothing else** | Medium | Reaction-session volume runs **3.41× median** a name's own trailing-60 median, above 1.5× in **16 of 16** measurable cycles and above 2× for **246 of 310** names. That is an E1-class execution rule for anyone holding a named constituent, and it carries no direction whatsoever | The **2027-03-08** reaction session printing a median relative volume **below 1.5×** across the named constituents — 16 of 16 cycles cleared it, and the one execution statement this ledger hands forward would be overbuilt. Registered as `FT-…-2` |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — a **forward derivation verified 17/17 against the owner's own archive**, not a reading of a published 2027 document. It widens caution and licenses **no** date-keyed action.
- **The announcement effect is not a null and never was** — +4.21% mean signed excess, 278 of 318. What is null is the part you could trade.
- **Nothing accrues after the opening print.** Open-to-close remainder: 8 of 17 cycles, median-of-medians −0.03%. Holding to the effective close: 8 of 16, t=0.05.
- **Do not answer this refusal with an instrument.** The December sibling's kill switch (*"a house instrument for single-name small-cap execution"*) is measured here as insufficient — wrong session, not wrong tooling.
- **The extended-hours window is the one thing untested.** The release lands ~19:15 ET, ~45 minutes before after-hours closes; whether any gap is transactable there for a SmallCap 600 name is **unmeasurable from daily bars** and is stated as a gap, not as a claim either way.
- **The transferable method rule: in this family, cluster by cycle.** March's intraday remainder looks alive by name (**57 of 84, p=0.140%**) and dies by cycle (**3 of 4, p=62.5%**) — 84 names inside four sessions are four observations.
- **Turnover is the one durable output** — 3.41× median, 16 of 16 cycles above 1.5×. An execution hazard, never a direction.
- **The effective date is the first TRADING day after the third Friday, not "the Monday"** — the 2022-06-03 release's own column reads *June 21, 2022*, a Tuesday, because Monday 2022-06-20 was the first NYSE-observed Juneteenth. 2027 is unaffected; four sibling entries state the rule as "Monday".
- **One cycle in 18 publishes no cohort at all** — June 2025 produced no quarterly constituent announcement. Registered as `FT-…-3`.
- Chain: announcement + pro-forma **2027-03-05** → reaction session **2027-03-08** → Select Sector reference close [`2027-03-12`](sp-rebalance-reference-close-2027-03-12.md) → implementation at the [`2027-03-19`](opex-2027-03-19.md) close → [effective open **2027-03-22**](sp-quarterly-rebalance-effective-2027-03-22.md) → secondary reweight **2027-03-30/31**.

## Initial research

### The question

This id reached the calendar as a single proposal from the
[`sp-quarterly-rebalance-effective-2027-03-22`](sp-quarterly-rebalance-effective-2027-03-22.md) initial
research, filed 2026-09-09, which argued the right thing for the right reason: the March 2027 announcement
is a **hole in a series this calendar already tracks** for two other quarters. It rested its date on a
seven-instance induction.

Three siblings have researched this family and converged on one refusal with three different reasons.
[`sp-rebalance-proforma-2026-09-04`](sp-rebalance-proforma-2026-09-04.md) refused on Greenwood & Sammon's
*disappearing index effect* — the announced-addition trade is a published null.
[`sp-quarterly-rebalance-effective-2026-09-21`](sp-quarterly-rebalance-effective-2026-09-21.md) refuted that
one tier down: on the live 2026-09-08 session, **28 of 32** named companies moved as their index action
predicts and the SmallCap 600 cohort was **12 of 12**, so the effect had *migrated*, not died — but it
measured intraday at ~13:53 ET on one cycle and refused on *"no house instrument."*
[`sp-rebalance-proforma-2026-12-04`](sp-rebalance-proforma-2026-12-04.md) built the panel — 700 rows, 549
measurable close-to-close — and confirmed a large, standing effect decaying with **time**, not tier. It too
refused on capability, and wrote its refusal an expiry date: *"a capability statement, not a view, and it
expires the moment the capability does."*

Every one of those three measurements is **close-to-close or intraday-versus-prior-close**. None asks the
only question that decides whether the refusal is temporary: the release lands after the close on a Friday,
so the first price a reader of it can transact is **Monday's open**. **How much of the effect is already in
that opening print?**

**One-line verdict:** essentially all of it — **89% of the median effect is the opening gap, positive in 16
of 17 cycles; the open-to-close remainder is a coin flip at 8 of 17** — so the refusal is structural, the
December sibling's expiry clause does not apply, and the only thing this event durably hands forward is a
turnover number.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no symbol-keyed
instrument applies (`symbols: []`) and `scripts/research/` carries no index-flow instrument, so the panel
was built in-session and every step is reproducible from the sources named below.

1. **Archive.** `press.spglobal.com/index.php?s=2429&l=100` plus offsets `o=100..800`, nine plain-curl
   requests, HTTP 200 each, ~117KB each → **899** unique dated releases, 2022-05-06 → 2026-09-04.
2. **Cycle identification.** Filtered to releases dated on the first Friday of a rebalance month whose
   headline names constituent joins → **17**.
3. **Row extraction.** Each of the 17 fetched individually (HTTP 200, 55KB–99KB) and parsed to
   `(effective date, index, action, company, ticker)`. The effective-date cell is **blank on continuation
   rows** and must be forward-filled — a first pass that required it per row silently recovered 632 of 700.
   Final: **700 rows**, the same count the December sibling reported, reached by an independent parser.
4. **Bars.** Yahoo `query1` daily OHLCV, one request per ticker over 2022-05-01 → 2026-09-10, **459 of 512**
   symbols returned data. Split-adjusted, not dividend-adjusted (see limits).
5. **Measurement.** Reaction session = first trading day strictly after the announcement Friday. Per row,
   excess over its own tier's ETF (S&P 500 and 100 → SPY, MidCap 400 → IJH, SmallCap 600 → IJR), signed by
   the direction the index action predicts, decomposed as
   **gap** = (open/prior close) − ETF, **intraday** = (close/open) − ETF, **total** = the sum.
   Relative volume = reaction-session volume ÷ that name's trailing-60-session median.
6. **Cohort.** The **clean** set excludes tier migrations (a name deleted from one index and added to
   another in the same release), whose net flow is the difference of two trackers rather than one — the
   correction the September sibling made and the reason 318 of 618 measurable rows are used for the
   headline. Both cohorts are reported.
7. **Significance.** Exact two-sided binomial sign tests. Reported at **both** the name level and the
   **cycle** level, because names inside one release are not independent observations.

### Conviction legs, tested

1. **The 2027-03-05 date — SUPPORTED, and independently reproduced rather than inherited.** All 17
   announcements in the archive land on the first Friday two weeks before that month's third Friday:
   2022-06-03, 2022-09-02, 2022-12-02, 2023-03-03, 2023-06-02, 2023-09-01, 2023-12-01, 2024-03-01,
   2024-06-07, 2024-09-06, 2024-12-06, 2025-03-07, 2025-09-05, 2025-12-05, 2026-03-06, 2026-06-05,
   2026-09-04. **March alone is 4 for 4.** March 2027's first Friday is **2027-03-05**. This reproduces the
   December sibling's 17/17 from a separate fetch and a separate parser, which is worth more than agreeing
   with it.

2. **THE HEADLINE — the effect is real and enormous, and 89% of it is the opening gap — SUPPORTED, and it
   is the finding.** On **318** clean name-cycles across all 17 releases, signed by predicted direction,
   excess over own-tier ETF:

   | | mean | median | correctly signed | exact p |
   |---|---|---|---|---|
   | **Total** (prior close → close) | **+4.21%** | **+3.86%** | 278 / 318 | **<0.001%** |
   | **Gap** (prior close → open) | **+3.65%** | **+3.44%** | 291 / 318 | **<0.001%** |
   | **Intraday** (open → close) | +0.58% | +0.33% | 176 / 318 | **6.4%** |

   The gap is **89.1%** of the median total. By tier the split is the same story everywhere it can be
   measured: S&P 500 additions **+6.83% total / +6.26% gap / +0.54% intraday (23 of 23 gap-positive)**;
   SmallCap 600 additions **+6.20% / +5.13% / +1.06%**; SmallCap 600 deletions **+3.39% / +2.89% / +0.53%**
   signed; MidCap 400 additions **+4.09% / +4.25% / −0.12%** — the mid-cap intraday half is *negative*.

3. **At the cycle level the remainder is a perfect null — SUPPORTED, and this is the leg that decides the
   stance.** Names inside one release all trade the same session, so 318 names across 17 releases is
   **17** observations, not 318. Taking each cycle's median:

   - **Gap**: positive in **16 of 17** cycles, exact **p=0.03%**, median-of-medians **+4.50%**. Only
     2025-03-07 was negative (−0.13%).
   - **Intraday**: positive in **8 of 17**, exact **p=100%**, median-of-medians **−0.03%**.
   - **Total**: 16 of 17, p=0.03%.

4. **The only trade this house could place is a coin flip — SUPPORTED.** Shorting is blocked house-wide, so
   the deletion leg does not exist and the strategy is: buy the announced additions, equal-weighted, at the
   reaction-session open; sell at that close. Per cycle, excess over tier ETF:

   ```
   2022-06 −2.13   2022-09 −0.76   2022-12 −2.04   2023-03 +1.32   2023-06 −0.14   2023-09 −0.31
   2023-12 −0.37   2024-03 +4.54   2024-06 +1.83   2024-09 +0.74   2024-12 −4.30   2025-03 −1.22
   2025-09 +3.48   2025-12 +0.62   2026-03 +3.26   2026-06 −0.63   2026-09 +1.02   (%)
   ```

   **8 of 17 winning cycles (p=100%), mean +0.29%, median −0.14%, sd 2.22%, t=0.53 on 16 df, worst −4.30%.**
   The same cohort's gap, in the print the strategy cannot have: **+4.95% mean per cycle, positive in 17 of
   17.** And the obvious rescue does not work — buying at the reaction open and **holding to the effective
   session's close**, roughly two weeks, gives **8 of 16, mean +0.05%, median +0.82%, t=0.05, sd 4.12%**:
   no mean, roughly double the variance. That corroborates the December sibling's separate finding that the
   pop does not round-trip, from the other side: it does not *continue* either.

5. **The December sibling's refusal has the wrong expiry clause — its own kill switch is answered here.**
   That ledger wrote: *"A house instrument for single-name small-cap execution landing before 2026-12-04 —
   the refusal is a capability statement, not a view, and it expires the moment the capability does."* On
   leg 3 and leg 4 it does not expire: an execution instrument trades sessions, and the effect is not in the
   session. This is an amendment to a sibling's reasoning made **with numbers on its own panel**, not a
   disagreement about size — and it is deliberately written here rather than into that ledger, which this
   lane does not own.

6. **The March-specific result is a trap, and the trap is the transferable lesson — REFUTED on its own
   control.** By name, March's intraday remainder looks alive and strong: **n=84, mean +1.62%, median
   +1.33%, 57 of 84 positive, p=0.140%**, against non-March's **119 of 234, p=84.5%**, and March's gap share
   of the median total is only **61%** versus non-March's **102%**. It dies the instant the cycle is the
   unit: the four March cycles' intraday medians are **+1.60%, +0.56%, −1.02%, +1.95%** — **3 of 4 positive,
   exact p=62.5%**. Eighty-four names inside four sessions are four observations. **Refused on power**, in
   the same words the effective-date sibling used to refuse its n=2 Good-Friday configuration. This is now
   the third finding this family has killed by the same mechanism (the December tier tilt, the March
   effective-open volume step, and this), which is enough instances to state it as a method rule rather than
   a caution: **cluster by cycle.**

7. **Turnover is the one durable output, and it is the strongest thing in the document after leg 3 —
   SUPPORTED.** Reaction-session volume against each name's own trailing-60 median: name level **4.08× mean
   / 3.41× median**, **246 of 310 above 2×**. Cycle medians run **1.91× (2026-09) to 6.17× (2022-09)** and
   are above 1.5× in **16 of 16** measurable cycles, with a visible decline over the sample (2022–2023
   cycles 4.2×–6.2×, 2025–2026 cycles 1.9×–3.5×) that tracks the December sibling's time-decay finding.
   This is an E1-class execution rule for anyone holding a named constituent into that session, and it says
   nothing whatever about direction.

8. **The panel reproduces the September sibling's live cross-section — SUPPORTED, and it is the validation
   this method needed.** That ledger measured the 2026-09-08 session by hand, intraday at ~13:53 ET, and
   published the clean SmallCap 600 cohort at **+6.47% additions / −2.97% deletions** vs IJR. This session's
   independent daily-bar panel reads the same names close-to-close at **+6.41% / −2.91%**. Two different
   methods, two different clocks, two different sessions of work, agreeing to six basis points.

9. **One mechanical correction to the family's own rule statement — SUPPORTED from a primary.** Four sibling
   entries state the effective date as *"the Monday following the third Friday."* The 2022-06-03 release's
   own effective-date column reads **June 21, 2022 — a Tuesday**, because Monday 2022-06-20 was the first
   NYSE-observed Juneteenth closure. The rule is **the first trading day after the third Friday**. 2027 is
   unaffected (Monday 2027-03-22 is an ordinary session), but the correction belongs on the record.

10. **The date is 17 for 17; the release *existing* is 17 of 18 — SUPPORTED.** **June 2025 produced no
    quarterly constituent announcement**: nothing on 2025-06-06, and nothing anywhere in the
    2025-05-15 → 2025-07-15 archive window beyond off-cycle singles (PEGA to MidCap 400 on 05-19, APi Group
    on 06-18, Ralliant to SmallCap 600 on 06-25). So roughly **1 cycle in 18** publishes a date and no
    cohort — the base rate behind the 2026-09-04 sibling's leg 5, now measured rather than cited.

11. **No house playbook fits — SUPPORTED, unchanged.** `trade-playbooks.md` and `multi-symbol-sweep.md`
    re-grepped this session for `rebalanc|index effect|reconstitut|deletion|witching|closing auction|opening
    auction` → **zero hits** in both. S1/S2/E1/S3/S4/G1 remain earnings- and execution-keyed; the sweep's
    kill list carries no rebalance hypothesis. The only contact point is E1-class execution hygiene, which
    leg 7 supplies.

12. **Adjacency — the corridor is thin and nothing in it touches index mechanics — SUPPORTED.** Two tracked
    ids within five days: `nerc-computational-load-phase-ii-workplan-2027-03-01` (low) at T−4 and
    `fomc-blackout-start-2027-03-06` (medium) at T+1. **Peers:** none — `symbols: []`, and the constituent
    cohort does not exist until the release publishes. **Macro:** the March 2027 FOMC blackout opens the day
    after this release; [`fomc-2027-03-17`](fomc-2027-03-17.md) (high) is the corridor's heaviest item but
    sits twelve days out. **Volatility:** baseline for this event — **VIX 15.72** at the 2026-09-08 close
    (15.20 prior), with SPY 765.96, IJH 75.36, IJR 144.25. **Geopolitical:** nothing touching index
    methodology or the owner's schedule. **Event tape:** no 2027 S&P DJI document exists to drift.

**What the conditions support.** Nothing to buy or sell, and for once the refusal is load-bearing rather
than cautious. Two outputs survive: a **structural refusal** — the announcement effect is enormous and
unreachable, so no instrument, cohort or tier changes the answer — and one **execution number**, the
3.41×-median turnover step on the reaction session, which is a timing guard for anyone already holding a
named constituent. Paper-only and educational throughout.

**Honest limits.** **Survivorship is real and it is asymmetric.** 53 of 512 tickers returned HTTP 404 from
Yahoo (delisted or acquired), costing **70 of 700 rows, skewed to deletions — 44 deletions against 26
additions**. Deleted names that were subsequently acquired are exactly the ones missing, so the deletion
cohort is biased; the **addition** cohort, which carries the entire long-only conclusion in legs 3 and 4,
loses only 26 rows. **Bars are split-adjusted but not dividend-adjusted**, so a name going ex-dividend on
its reaction session has its gap understated by the dividend — unbiased across additions and deletions and
small against a 3.44% median gap, but stated. **618 of 700 rows were measurable**; the headline uses the
**318** clean rows because migrations net two trackers against each other. **The extended-hours window is
untested and untestable from daily bars** — the release lands ~19:15 ET, roughly 45 minutes before
after-hours closes, and whether any part of the gap is transactable there for a SmallCap 600 name on a
Friday evening is not something this panel can answer; it is named as a gap, not resolved in either
direction. **The March sample is four cycles** — every March-specific statement here is refused on power
rather than asserted. The methodology PDF returned **403** again this session and nothing was substituted
for it. The proposal's direct link to the 2026-03-06 release **404'd** this session (the newsroom's slug
differs from the one the proposer recorded); the release was located through the archive index instead and
both facts are in `probe-ref.blocked`. Every trading-adjacent statement above carries the `estimate` label.

## Stance & kill switches

**Stance (date `estimate`, forward-derived and verified 17/17 against the owner's own archive).** Treat
2027-03-05 as a **known-mechanism, low-impact market-structure release that supports no position of any
kind**, and treat the refusal as **structural rather than provisional**. The announcement effect is not a
null — it is +4.21% mean signed excess at 278 of 318 — but **89% of it prints in the opening auction of the
reaction session**, and the part a reader of the release could actually transact is a coin flip: 8 of 17
cycles, mean +0.29%, median −0.14%, t=0.53. Holding two weeks to the effective close does not rescue it
(8 of 16, t=0.05, double the variance). **This ledger therefore amends the December sibling's expiry
clause**: a single-name small-cap execution instrument would not make this tradeable, because the effect is
not in a session an instrument can trade. The one thing to carry forward is **turnover** — named
constituents run 3.41× their own trailing-60 median volume on the reaction session, above 1.5× in 16 of 16
cycles — which is an execution guard for anyone already holding one of those names on 2027-03-08 and is
never a direction. The March-specific intraday result is **recorded as refuted by its own control** so a
later pulse does not re-find it: it is significant by name (p=0.140%) and a coin flip by cycle (3 of 4,
p=62.5%).

**Kill switches:**

- **The 2026-12-07 reaction session prints its clean addition cohort at ≥ +2% equal-weight open-to-close
  excess vs its tier ETF** — the intraday null would have an exception in the very next out-of-sample cycle,
  and the structural half of this refusal would need re-arguing. Registered as
  `FT-sp-rebalance-proforma-2027-03-05-1`.
- **The 2027-03-08 reaction session prints median relative volume below 1.5× across the named
  constituents** — the one durable output of this ledger would be overbuilt. 16 of 16 measurable cycles
  cleared it. Registered as `FT-sp-rebalance-proforma-2027-03-05-2`.
- **2027-03-05 passes with no quarterly constituent announcement at all**, as 2025-06-06 did — voids the
  cohort-level tests and confirms the 17-of-18 base rate in leg 10. Registered as
  `FT-sp-rebalance-proforma-2027-03-05-3`.
- **S&P DJI moves the announcement off the first Friday** (a methodology or schedule change published before
  the March 2027 release) — 17 of 17 would have its first exception and this entry needs re-dating. This
  overlaps `FT-sp-quarterly-rebalance-effective-2027-03-22-3`, which the proposing lane already registered
  for the date itself; not duplicated here.
- **A house playbook keyed to index flow or an opening auction lands in `trade-playbooks.md`** — the
  zero-hits statement in leg 11 expires and the corridor gets a mechanism, though leg 3 says what that
  mechanism would still not reach.
- **An index-provider source prefix is added to `market-events-data.ts`** — this entry becomes promotable
  from `estimate` on a primary S&P DJI fetch. That file is the calendar owner's, not this lane's; noted, not
  self-authorized.

**Registered forward tests.** `FT-sp-rebalance-proforma-2027-03-05-1`, `-2` and `-3` — see
[`forward-tests/sp-rebalance-proforma-2027-03-05.md`](../forward-tests/sp-rebalance-proforma-2027-03-05.md).
Each is one observation; a pass corroborates a 17-cycle panel, it does not promote anything.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-177 | Initial research banked; canonical `src/domain/market-events/sp-rebalance-proforma-2027-03-05.json` written this session (the id existed only as `proposals/…from-sp-quarterly-rebalance-effective-2027-03-22.json`, read in full first). probe-ref baseline set (**VIX 15.72** at the 09-08 close, no symbols by design, band `low:15+`, **2** adjacents, **2** blocked fetches). **DATE RE-ESTABLISHED, NOT INHERITED:** S&P DJI newsroom archive re-fetched (9 index pages, HTTP 200 each) → **899** releases 2022-05-06→2026-09-04; **17 of 17** quarterly announcements on the first Friday two weeks before that month's third Friday, **March 4 for 4**; all 17 releases fetched individually and parsed to **700** constituent rows — the December sibling's count, reached by an independent parser. **HEADLINE — THE EFFECT IS ENORMOUS AND UNREACHABLE:** on **318** clean (non-migration) name-cycles, signed by predicted direction vs own-tier ETF, the reaction session runs **+4.21% mean / +3.86% median, 278/318, p<0.001%** — of which the **opening GAP is +3.65% / +3.44%, 291/318, p<0.001% (89% of the median total)** and the **open-to-close remainder is +0.58% / +0.33%, 176/318, p=6.4%**. **AT THE CYCLE LEVEL, THE ONLY HONEST UNIT:** gap positive in **16/17** cycles (p=0.03%, median-of-medians +4.50%), intraday in **8/17** (p=100%, **−0.03%**). **THE ONLY TRADE THIS HOUSE COULD PLACE** (long-only; shorting blocked) — buy additions equal-weight at the reaction open, sell at that close — **8/17 winning cycles, mean +0.29%, median −0.14%, sd 2.22%, t=0.53, worst −4.30%**, against the same cohort's **+4.95% mean per-cycle gap, positive 17/17**. Holding to the effective close: **8/16, mean +0.05%, t=0.05**, double the variance. **THIS AMENDS A SIBLING'S STANCE WITH NUMBERS:** `sp-rebalance-proforma-2026-12-04` made a small-cap execution instrument its kill switch and called its refusal *"a capability statement… it expires the moment the capability does"* — it does not expire; the effect is not in a session an instrument can trade. **THE MARCH RESULT IS A TRAP AND THE TRAP IS THE LESSON:** March intraday looks alive by name (**57/84, p=0.140%**, gap share only 61% vs non-March 102%) and dies by cycle (**3/4, p=62.5%**; cycle medians +1.60/+0.56/−1.02/+1.95%) — 84 names inside four sessions are four observations. Third kill by this mechanism in this family; stated as a method rule (**cluster by cycle**), not a caution. **THE DURABLE OUTPUT IS TURNOVER:** reaction-session volume **4.08× mean / 3.41× median** a name's own trailing-60 median, **246/310 above 2×**, cycle medians **1.91×–6.17×**, **16/16 above 1.5×**, declining across the sample in step with the December sibling's time decay. **METHOD VALIDATED AGAINST THE LIVE CROSS-SECTION:** the September sibling's hand-measured 2026-09-08 SmallCap 600 cohort (**+6.47% adds / −2.97% deletions**, intraday ~13:53 ET) reads **+6.41% / −2.91%** close-to-close on this independent daily-bar panel. **ONE MECHANICAL CORRECTION FROM A PRIMARY:** the effective date is the first **trading** day after the third Friday, not "the Monday" — the 2022-06-03 release's own column reads **June 21, 2022** (Tuesday) because 2022-06-20 was the first NYSE-observed Juneteenth; four sibling entries say "Monday". **ONE MEASURED BASE RATE:** the date is 17/17 but the release *existing* is **17 of 18** — June 2025 announced no cohort (nothing 2025-06-06; only off-cycle singles in the whole 05-15→07-15 window). **PARSER NOTE FOR THE NEXT LANE:** the effective-date cell is blank on continuation rows and must be forward-filled — requiring it per row silently recovers 632 of 700. **Adjacency — peers:** none (`symbols: []`); the cohort does not exist until publication. **Macro:** only **2** tracked ids within 5d — `nerc-computational-load-phase-ii-workplan-2027-03-01` (T−4) and `fomc-blackout-start-2027-03-06` (T+1); `fomc-2027-03-17` (high) is the corridor's heaviest item at T+12. **Vol:** baseline, no prior — VIX **15.72** (09-08 close, 15.20 prior); SPY 765.96, IJH 75.36, IJR 144.25. **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped incl. `index effect|opening auction|closing auction` → **zero hits**. **BLOCKED, NOT SUBSTITUTED:** the methodology PDF **403** again, and the proposal's direct 2026-03-06 release link **404** (slug differs; located via the archive index instead). **NO DATED ADJACENT PROPOSED, WITH REASONS:** the 5-day corridor is fully tracked; the 2027-03-08 reaction session is this event's consequence, not a separate publication; the share/IWF freeze is a data cut-off with no observable publication (declined by two siblings); and a 2027-03-12 capped pro-forma was already deliberately declined by the proposing sweep because that date carries `sp-rebalance-reference-close-2027-03-12`. Registered **FT-…-1** (the 2026-12-07 addition cohort's open→close excess stays under +2%), **FT-…-2** (2027-03-08 median relative volume ≥ 1.5×), **FT-…-3** (2027-03-05 announces a cohort at all). | — (stance set: **stand aside** on all four horizons, with the refusal upgraded from provisional to **structural** — 89% of the effect is in the opening print, the tradeable remainder is 8/17 cycles, and no instrument recovers it; the one durable output is a 3.41×-median turnover guard on the reaction session) | 2026-10-09 (band `low:15+`, every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/proposals/<id>.from-sp-rebalance-proforma-2027-03-05.json` (`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from memory — after which this doc goes quiet.
