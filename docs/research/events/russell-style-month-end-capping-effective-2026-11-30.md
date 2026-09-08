# Russell US Style month-end recapping — the instance furthest from any unconditional reset — russell-style-month-end-capping-effective-2026-11-30

**Kind:** sector · **Date:** 2026-11-30 (estimate — **EST: owner-published, both documents re-fetched and re-inflated independently this session.** FTSE Russell, *Capping Methodology Guide*, **v5.4, September 2026** (`capping-methodology-guide.pdf`, HTTP 200, **652,008 bytes**, **62** content streams inflated in-session 2026-09-08 — byte and stream counts both reproduce the sibling ledgers'), whose section 4.8.6 table gives every **Russell US Style** row frequency **"Monthly"**, price date **"T-3"**, effective date **"Last business day of each month"**, trigger **"No company is greater than 24%, and all companies that have a weight greater than 4.8% in aggregate are no more than 48% of the index"**, scheme **"Rule 4.2/RIC 22.5/45"**; and whose **section 4.8.4** says verbatim **"If none of the applicable trigger thresholds are breached, no change is implemented as a result of the additional capping check"** — the clause this instance turns on. Corroborated and contradicted by FTSE Russell, *Frequently Asked Questions — Russell US Equity Indexes*, **July 2026** (`ftse-faq-document-russell-us-equity-2026.pdf`, HTTP 200, **198,134 bytes**, **19** streams), which still reads *"The review is conducted quarterly (March, June, September, and December)"*. Stays `estimate` because this calendar's confirmed-tier prefixes have no member for an index owner's methodology, because the date is arithmetic from a standing rule rather than read off a dated owner schedule, and because the two owner documents disagree on the check's own frequency) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["beige-book-2026-11-25","durable-goods-2026-11-25","gdp-q3-2026-second-2026-11-25","new-home-sales-2026-11-25","pce-2026-11-25","advance-economic-indicators-2026-11-27","japan-cpi-tokyo-flash-2026-11-27","thanksgiving-half-day-2026-11-27","fomc-blackout-start-2026-11-28","aws-reinvent-2026","chicago-pmi-2026-11-30","dallas-fed-mfg-2026-11-30","russell-recon-lockdown-2026-11-30","construction-spending-2026-12-01","dallas-fed-tssos-2026-12-01","georgia-senate-runoff-2026-12-01","ism-manufacturing-2026-12-01","jolts-2026-12-01","adp-employment-2026-12-02","pjm-reliability-backstop-results-2026-12-02","ism-services-2026-12-03","m3-full-report-2026-12-03","jobs-2026-12-04","sp-rebalance-proforma-2026-12-04"],"screenStreak":0,"blocked":[{"url":"https://www.ishares.com/us/products/239720/ishares-russell-top-200-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWY_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-08"},{"url":"https://www.ishares.com/us/products/239706/ishares-russell-1000-growth-etf/1467271812596.ajax?fileType=csv&fileName=IWF_holdings&dataType=fund","status":"200-html-not-csv","at":"2026-09-08"},{"url":"https://stockanalysis.com/api/symbol/e/IWY/holdings","status":"404","at":"2026-09-08"},{"url":"https://query1.finance.yahoo.com/v10/finance/quoteSummary/IWY?modules=topHoldings","status":"401","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside — but this is the most exposed instance in the family, not the throwaway its own proposal filed it as, and that inversion is this sheet's finding.** The proposal sized 2026-11-30 by a **20-session** drift window from the October month-end price date, calling it "in the same band" as the quarter-end instances. **Section 4.8.4 of the owner's own guide says otherwise**, verbatim: *"If none of the applicable trigger thresholds are breached, no change is implemented as a result of the additional capping check."* A month-end check that does not fire **does not reset the cohort** — so the October check is this instance's anchor only in the ~9% of paths where it actually fires. The last **unconditional** recap before 2026-11-30 is the quarterly Russell US Style capping review, cut-off **2026-09-09** and effective at the open **2026-09-21**, and from that cut-off to the **2026-11-24** price date is **54 trading sessions, not 20**. Re-run on this session's own five-year bar set, a path simulation that starts at a 45% reset on 09-09 and applies the conditional recaps at 09-25 and 10-27 leaves the 11-24 test breached in **223 of 1,206 paths — 18.49%** (IWY cohort), against **176 of 1,243 — 14.16%** for the December instance's 17-session leg measured identically. **November is the peak of the chain, because it sits furthest from the reset.** Two honest brakes on that. **The levels do not reconcile with the siblings':** re-implementing the formula they state, on freshly fetched bars, their 12-session September leg comes out **7.85%** where they published **3.95%/4.02%**, and their 17-session December leg **14.16%** where they published **7.76%** — a near-exact factor of two on both, surviving adjusted and unadjusted closes and both IWY and SPY benchmarks. The **ordering** across legs is what this sheet rests on; the levels are unsettled and registered as a forward test rather than smoothed away. **And none of it licenses a position:** the mechanism is unhedgeable, reads a cohort no member can observe intraday, has `symbols: []` and **zero** house-playbook hits; the single-name leg is dead (**NVDA 16.21%** in IWY against a 24% trigger); date is `estimate`; and a fired recap moves ~3pp of IWY's **$15.94B ≈ $478M** into a **24-event** corridor already carrying `pce-2026-11-25`, `jobs-2026-12-04` and the December reconstitution lock-down opening on the very same session.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-83, `symbols: []`, and every input to the 11-24 test is re-struck twice before it matters — by the **2026-09-09** quarterly capping cut-off and by the **2026-10-27** month-end check. Nothing observable today survives to the strike | FTSE Russell publishing an index notice before **2026-10-01** that restores quarterly wording for the Russell US Style rows in section 4.8.6 — the date stops existing rather than moving, and this entry is withdrawn |
| This week | **Stand aside** | High | Nothing in this family lands inside it. The nearest dated milestone is the **2026-09-09** Russell US Style capping cut-off — the reset this whole sheet anchors on, and a data cut-off that publishes nothing | Any dated report of a *Russell US Style* index being recapped between **2026-09-08** and **2026-09-14** — outside both the quarterly and the month-end frames, meaning neither owner document describes the whole rule |
| This month | **Watch the 09-21 reset land, take no position** | Medium | The one observable that decides this instance is whether the **09-21** review actually recaps IWY's cohort to 45%. Marked from 2026-08-27 holdings to the 09-08 close it reads **46.61%**, above the 45% cap, so it should — and if it does not, the 54-session path starts ~1.6pp closer to the trigger | IWY's over-4.8% company cohort reading **above 45.5%** in the first holdings file dated after **2026-09-21** — the review did not reset it, and every number below is anchored to the wrong level |
| This quarter | **Watch two numbers, take no position** | Medium | The live path is IWY's over-4.8% cohort vs 48% at the **2026-11-24** close, measured at **18.49%** of simulated paths — the highest in the family and still better than 4-to-1 against. The second number is the **2026-10-27** October check, whose firing would reset the window and roughly halve this instance | The **2026-10-30** month-end check firing — the monthly reading is confirmed from the tape, but this instance's 54-session anchor collapses to the proposal's 20-session one and **18.49%** reverts toward **16.45%** |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` — **owner-published but prefix-gapped**, derived from a standing rule, with the two owner documents in open conflict on cadence — and the trigger is **conditional**. It widens caution about the 11-24/11-30 closes and licenses **no** date-keyed action.
- **The anchor is 09-09, not 10-27, and section 4.8.4 is the receipt.** A non-firing month-end check implements no change, so it cannot be a reset. **54 sessions**, not 20.
- **November is the family's peak instance: 18.49%** path-simulated (IWY) vs **14.16%** for December's 17-session leg on the same estimator. It is the furthest point from an unconditional recap in the whole year.
- **The levels are not reproducible and this sheet says so.** This session's re-implementation runs ~**2×** the siblings' published rates on their own legs. Ordering is trusted; levels are registered as `FT-…-3`.
- **The reset is the thing to watch, not the test.** IWY's cohort marked to the **2026-09-08** close is **46.61%**, above the 45% cap, so the **09-21** review should recap it.
- **IWF is not reset at all.** At **44.44%** it is already *under* the 45% cap, so the quarterly review will not touch it; it drifts from there needing **+8.01%**, which clears **34.99%** of raw 54-session windows and **16.83%** of simulated paths.
- **The FAQ's table silence is not evidence, and that is new here.** Its schedule table has four **review-cycle** columns, not twelve month columns — it has no slot for a non-review month. The FAQ's *prose* still contradicts the guide; its *table* does not.
- **The single-name leg is dead everywhere** — NVDA is **16.21%** (IWY) / **15.79%** (IWF) against a 22.5% cap and a 24% trigger, re-derived this session.
- **Company lines combine** — Alphabet counts once at **11.04%** (IWY) / **10.66%** (IWF); GOOG standalone is **4.94%** / **4.77%**, so a security-level read drops its second line under the 4.8% line and understates the cohort by ~5pp.
- **The recap would trade into a 24-event corridor**, including `pce-2026-11-25` (**high**) one session after the strike and `russell-recon-lockdown-2026-11-30` opening the same session the recap implements. The guide never mentions lock-down; the interaction is unwritten, not resolved.
- Chain: quarterly capping cut-off **2026-09-09** → review effective open **2026-09-21** → conditional quarter-end check struck **2026-09-25** → conditional month-end check struck **2026-10-27** → **conditional month-end test struck 2026-11-24 (T-3)** → recap trades the **11-27** half session → **effective open 2026-11-30**.

## Initial research

### The question

This id reached the calendar as a single proposal from the
[`russell-style-quarter-end-capping-effective-2026-12-31`](russell-style-quarter-end-capping-effective-2026-12-31.md)
initial research, which filed it alongside its October sibling and travelled a verdict with it so nobody would size it
as tradable. That proposal also handed forward a specific measurement, stated as settled:

> the November instance's own drift window from the 2026-10-27 October T-3 is 20 sessions, in the same band

and it named the October sibling, not this one, as the interesting instance — *"the first month-end instance that is
not also a quarter-end, so it is the cleanest available test of whether the monthly reading is right."* This session's
job was the conflict the proposal named (does the guide still say monthly?) and, per the standing carry-forward the
December ledger itself banked — *"when a sibling instance hands you a base rate, re-derive its geometry before you
inherit its number"* — the 20-session claim.

**So: is 2026-10-27 actually this instance's anchor?**

**One-line verdict:** no — a month-end check that does not breach implements no change, so the anchor is the
**2026-09-09** quarterly capping cut-off, **54 sessions** out rather than 20, which makes 2026-11-30 the **most**
exposed instance in the family rather than a lesser cousin of the quarter-end ones; and while establishing that, this
session found it cannot reproduce either sibling's base-rate *levels*, which is recorded here rather than smoothed.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry carries
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow instrument. **Nothing
was taken from the proposal or from either sibling ledger on faith.** Every document was re-fetched and every number
re-derived; where a re-derivation disagreed with a sibling, the disagreement is reported rather than reconciled.

- **The proposal was read in full first**
  (`proposals/russell-style-month-end-capping-effective-2026-11-30.from-russell-style-quarter-end-capping-effective-2026-12-31.json`),
  per the "your own event was proposed by others" rule — then the canonical
  `src/domain/market-events/russell-style-month-end-capping-effective-2026-11-30.json` was written by this session. It
  was the only proposal carrying this id.
- **FTSE Russell Capping Methodology Guide, v5.4, September 2026** — re-fetched (HTTP 200, **652,008 bytes**), text
  recovered by inflating its **62** content streams in-session, and read at the *clause* level rather than the table
  level, which is where the headline came from.
- **FTSE Russell FAQ, July 2026** — re-fetched (HTTP 200, **198,134 bytes**, **19** streams). The URL the sibling
  chain cited (`research.ftserussell.com/products/downloads/…`) now returns **404**; the document is live at the
  `lseg.com` dam `policy-documents` path. Both are recorded in `probe-ref.blocked` / here.
- **iShares product screener** (`product-screener-v3.1.jsn`, HTTP 200, 1.90 MB) — AUM for all eight funds, read this
  session.
- **Vendor holdings — blocked again, and a second fallback has since died.** The iShares holdings endpoint returned an
  HTML product page under HTTP 200 for both IWY and IWF, exactly as the sibling recorded; the aggregator JSON route
  that sibling fell back to now returns **404**, and Yahoo's `topHoldings` module returns **401**. Holdings were taken
  from the same aggregator's rendered HTML instead, **as of 2026-08-27**. All four failures are in `probe-ref.blocked`.
- **Yahoo daily bars** — NVDA, AAPL, MSFT, GOOGL, GOOG, AVGO, IWY, IWF, SPY, `^VIX`; five years, **1,260** usable
  sessions (2021-08-31 → 2026-09-08), fetched in both adjusted and unadjusted form.
- **This repo** — the corridor computed from the calendar files rather than by eye; `trade-playbooks.md` and
  `multi-symbol-sweep.md` re-grepped for `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY` → **zero hits**.

### Conviction legs, tested

1. **HEADLINE — the proposal's 20-session anchor is wrong, and section 4.8.4 is the receipt — REFUTED.** The guide's
   own clause, quoted verbatim from the v5.4 text recovered this session:

   > **4.8.4** If none of the applicable trigger thresholds are breached, **no change is implemented as a result of
   > the additional capping check.** If the trigger thresholds are breached, the index is recapped using the standard
   > review capping methodology and target capping level specified in Appendix A.

   The FAQ says the same thing in plainer words — *"If no breach is identified, no changes are made."* So a month-end
   check is a **test, not a reset**: it re-anchors the cohort only in the paths where it fires. The proposal treated
   the 2026-10-27 price date as this instance's starting point, which is true only conditional on the October check
   breaching — measured below at **28.55%** of raw windows and rarer still once the September check is allowed to fire
   first. The **unconditional** recap is the quarterly Russell US Style capping review, which recaps to the RIC 22.5/45
   target whenever the cohort exceeds it, and the owner's own dated schedule puts its September instance at cut-off
   **9 September** and effective open **21 September**.

2. **The session arithmetic, computed rather than asserted — SUPPORTED.** NYSE sessions with 2026-09-07 (Labor Day),
   2026-11-26 (Thanksgiving) and 2026-12-25 (Christmas) removed:

   | Leg | Sessions |
   |---|---|
   | Q3 quarterly cut-off **09-09** → quarter-end test **09-25** | 12 |
   | Q3 cut-off **09-09** → October month-end test **10-27** | 34 |
   | **Q3 cut-off 09-09 → NOVEMBER test 11-24 (the live anchor)** | **54** |
   | October T-3 **10-27** → November test **11-24** (the proposal's anchor) | 20 |
   | Q4 quarterly cut-off **12-02** → year-end test **12-28** | 17 |

   The T-3 arithmetic holds independently: the last business day of November 2026 is **Mon 30 Nov**; T-1 **Fri 27 Nov**
   (the Thanksgiving half session, still a session), T-2 **Wed 25 Nov**, T-3 **Tue 24 Nov**, stepping over Thanksgiving.
   The same walk reproduces the owner's *published* quarter-end cut-offs at **25 September** and **28 December**, which
   is the cross-check that the calendar used here is the right one.

3. **HEADLINE — November is the family's peak instance, not its throwaway — SUPPORTED.** Cohort return is the
   fixed-weight portfolio return of the over-4.8% companies measured against the fund's own return; a cohort at `w0`
   breaches 48% when it beats its index by `48/w0`. The honest estimator is a **path** simulation rather than a single
   window, because the intervening checks *can* reset: start at a 45% reset on 09-09, apply a conditional recap to 45%
   at 09-25 and again at 10-27 if the cohort is above 48% there, and measure at 11-24. Over 1,206 paths:

   | Case | Estimator | Result |
   |---|---|---|
   | **NOVEMBER, IWY — the live case** | path sim, resets at 09-25 / 10-27 | **223 / 1,206 = 18.49%** |
   | NOVEMBER, IWF (starts 44.44%, not reset) | path sim | 203 / 1,206 = **16.83%** |
   | November, IWY, raw 54-session window from 45% | single window | 473 / 1,206 = 39.22% |
   | November, IWY, the proposal's 20-session anchor | single window | 204 / 1,240 = 16.45% |
   | December sibling's 17-session leg, re-measured here | single window | 176 / 1,243 = 14.16% |
   | September sibling's 12-session leg, re-measured here | single window | 98 / 1,248 = 7.85% |

   The path simulation is materially *lower* than the raw 54-session read (18.49% vs 39.22%) precisely because the
   intervening checks bleed off the extreme paths — which is the correct behaviour and the reason to run it. It is
   still the highest number in the family, and **higher than December's**, measured on one estimator and one bar set.

4. **HEADLINE — this session cannot reproduce either sibling's base-rate LEVEL, and says so — MIXED.** Re-implementing
   the formula both siblings state, the legs they published come out at almost exactly **twice** their values:

   | Leg | Published by the sibling | Re-measured here |
   |---|---|---|
   | September, 12 sessions, 45% start | **3.95%** / **4.02%** | **7.85%** |
   | December, 17 sessions, 45% start | **7.76%** | **14.16%** |

   The factor of two survives every variant tried: adjusted vs unadjusted closes (7.85% vs 8.01% at 12 sessions),
   benchmark IWY vs SPY (7.85% vs 12.98%), and the alternative reading in which the threshold is applied against the
   *rest* of the index rather than the whole of it (which lands at **0.96%**, further away in the other direction).
   The December ledger reported its 12-session line as reproducing the September one "to within one window", so the two
   siblings agree with each other and this session disagrees with both. **No claim is made here about which is right.**
   What this sheet rests on is the *ordering* — 54 sessions ≫ 20 ≫ 17 ≫ 12, all measured with one estimator on one bar
   set — which is invariant to whatever scaling explains the gap. The level is registered as a forward test.

5. **The reset this instance depends on should land, and is observable — SUPPORTED.** The 09-21 review recaps only a
   cohort above the 45% target. IWY's, marked from the 2026-08-27 holdings forward to the **2026-09-08 close** using
   this session's bars, reads **46.61%** (from 46.81%; the fund fell 0.35% over the stretch) — above the cap, one
   session before the 09-09 cut-off. **IWF's does not qualify**: at **44.44%** (from 44.47%) it is already *under* the
   cap, so the quarterly review will not touch it and it enters the 54-session stretch from its own level needing
   **+8.01%** rather than +6.67%. That is why IWF's path number (16.83%) sits below IWY's despite the longer effective
   drift — the trigger is further away.

6. **The FAQ's table silence is a layout artifact, and this narrows the conflict — SUPPORTED, and new to this chain.**
   Both siblings framed the FAQ as contradicting the guide. Its *prose* does, verbatim: *"The review is conducted
   quarterly (March, June, September, and December)."* Its *schedule table* does not, and cannot: read at source this
   session, that table's four columns are **review cycles** — "Quarterly IPO March 2026", "Semi-Annual Reconstitution
   June 2026", "Quarterly IPO September 2026", "Semi-Annual Reconstitution December 2026" — not months. It has no
   structural slot for October or November, so its silence about 2026-10-30 and 2026-11-30 is not evidence against
   them. One genuine counter-signal stands, and it is narrower than the December ledger read it: the guide's
   **footnote 3**, attached to every Russell US Style row, still says *"the quarter-end capping check will not be
   performed"* — but its scope is a **June-only** carve-out for a reconstitution effective on the first business day of
   July. It is stale vocabulary in a June exception, not a general statement of frequency. The December reconstitution
   is effective **mid-month (12-14)**, so footnote 3 does not reach this instance or the year-end one either way.

7. **Scope and cohort re-verified from source, not inherited — SUPPORTED.** The iShares product screener read this
   session returns the same eight funds and the same total: IWF **$126.03B**, IWD $84.06B, IWP $19.63B, IWY
   **$15.94B**, IWS $15.67B, IWO $14.70B, IWN $14.61B, IWX $3.98B = **$294.61B** (the siblings recorded $294.62B).
   Cohorts computed from holdings dated **2026-08-27**, company lines combined per the guide:

   | Fund | NVDA | AAPL | MSFT | Alphabet (both lines) | AVGO | **Cohort** |
   |---|---|---|---|---|---|---|
   | **IWY** | 16.21% | 7.79% | 6.20% | **11.04%** | 5.57% | **46.81%** |
   | **IWF** | 15.79% | 7.32% | 5.57% | **10.66%** | 5.13% | **44.47%** |

   Identical to the December sibling's read to the basis point. The combining rule is load-bearing exactly as both
   siblings said: **GOOG standalone is 4.94% (IWY) and 4.77% (IWF)**, so a security-level read drops Alphabet's second
   line under the 4.8% line and understates each cohort by about 5pp.

8. **The single-name leg is dead by a wide margin — SUPPORTED.** The trigger is **24%** for any one company. NVDA, the
   family's largest weight, is **16.21%** in IWY and **15.79%** in IWF against a 22.5% cap it is nowhere near. Nothing
   in this family is a single-name story on any horizon this sheet covers.

9. **The corridor is the densest of the three instances, and one adjacency is structural — SUPPORTED.** **24** tracked
   events sit within five days, computed from the calendar files, against **14** around the December instance and 29
   around the September one. Two matter. `pce-2026-11-25` (**high**) lands the session *after* the 11-24 strike, so the
   price date is struck clean but the recap would trade into its aftermath. And `russell-recon-lockdown-2026-11-30`
   opens the December reconstitution's lock-down period **at the open of 2026-11-30 — the exact session a fired recap
   would implement**. The capping guide never uses the words "lock-down" anywhere in its 35 pages; the interaction is
   **unwritten, not resolved**, and is recorded as a limit rather than guessed at.

10. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` re-grepped this session for
    `rebalanc|reconstitution|russell|capping|index.flow|IWF|IWY`: **zero hits** in both. Nothing in the house is keyed
    to index flow, and this event has no announcement to trade against.

11. **Even the fire case is small — SUPPORTED.** A breach recaps the cohort from just over 48% back to 45%: ~3pp of
    IWY's **$15.94B ≈ $478M**, spread across five mega caps, at one month-end close. Were IWF to breach as well, its
    3pp is ~**$3.78B**, still under a tenth of a day's volume in each name it touches — and IWF's breach requires the
    larger move, so the joint case is rarer than either alone.

### What the conditions support

Nothing directional, on any horizon. Three outputs. **The proposal's own geometry is corrected** — 2026-11-30 is
anchored **54 sessions** from the last unconditional recap, not 20, because a non-firing month-end check implements no
change; that makes it the family's **most** exposed instance (**18.49%** path-simulated) rather than its least
interesting, and a lane that had inherited the proposal's framing would have under-weighted this date and over-weighted
December. **The frequency conflict is narrowed but not settled** — the FAQ's *table* cannot contradict the guide
because it is laid out by review cycle rather than by month, and the guide's footnote 3 is a June-scoped carve-out
rather than a general frequency statement; the FAQ's *prose* remains a real contradiction and the entry stays
`estimate`. **And a discrepancy is banked rather than buried** — this session's base-rate levels run ~2× both siblings'
on their own legs, under every variant tried, which is registered as a forward test because two sessions producing
different numbers from the same stated formula is a fact about this repo's method, not a rounding difference.

**No new dated adjacent event was proposed, and the declines are recorded** so a later lane does not re-litigate them.
The FAQ's schedule table was read row by row: **Lock-Down Period (open of) 30 November 2026** is already tracked as
`russell-recon-lockdown-2026-11-30`; **Review Effective Date 21 September 2026** as
`russell-quarterly-ipo-review-effective-2026-09-21`; **Indicative Review Products circulated 13 November 2026** as
`russell-recon-preliminary-2026-11-13`. **DECLINED:** the **2026-09-09** and **2026-12-02** style capping cut-offs and
the **30 October 2026** index-rebalance market-cap cut-off (all data cut-offs — nothing publishes and no shares move,
the class `russell-recon-preliminary-2026-11-13` declined and the December lane declined again); the **Russell Monitor
List** deliveries of **4 November** and **9 November 2026** (subscriber file drops, delivered monthly by the FAQ's own
footnote 1, with no market event attached); and the **2027 month-ends** (no owner document published this session names
a 2027 date). The October sibling already exists as
`proposals/russell-style-month-end-capping-effective-2026-10-30.from-russell-style-quarter-end-capping-effective-2026-12-31.json`
and was **not** duplicated.

### Honest limits

**The base-rate levels are not settled and this sheet does not pretend they are** — see leg 4. Two sibling sessions
agree with each other and this one disagrees with both by a factor of two on their own legs; every call above is
therefore made on the *ordering*, which is invariant, and the level is registered as `FT-…-3` rather than asserted.
**The frequency conflict is unresolved.** The guide is newer, is the methodology of record, is what the FAQ itself
points readers to, and its footnote 3 turns out to be narrower than the December ledger read it — but no index notice
was found either confirming a monthly cadence or recording a month-end recap actually happening. **Nothing here
observed a capping check firing**, on any date, ever. **The holdings came from an aggregator, not the vendor**, and the
fallback chain is degrading: the iShares CSV endpoint returned HTML under HTTP 200 for both funds (as it did for the
sibling), the aggregator JSON route the sibling used now 404s, and Yahoo's holdings module 401s; all four are in
`probe-ref.blocked`. The figures reproduce the sibling's independent read to the basis point, which is the only reason
they are trusted here. **The base rate is a proxy with a frozen cohort** — it holds today's five cohort members at
today's proportions across five years of prices, so it measures whether a mega-cap growth cohort of roughly this shape
can move this far, not the index rule itself; and 54 sessions is long enough that real membership churn (the December
reconstitution's own cap-tier migration among them) would matter. **These are ETF weights, not index weights**, marked
forward from 2026-08-27 by price only. **The path simulation assumes the 09-21 reset lands** and that the only resets
in the window are the ones modelled; an off-cycle corporate action or an unscheduled recap would not be captured. **The
lock-down interaction is unwritten** — the capping guide never mentions lock-down, so whether a 11-30 recap and the
recon lock-down opening the same session interact is genuinely unknown rather than judged benign. **The date is
`estimate`** and every trading-adjacent statement above carries that label; the trigger is conditional and no primary
can pre-confirm it fires; `symbols` is empty by design and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` owner-published in the v5.4 September 2026 Capping Methodology Guide's standing rule,
prefix-gapped rather than unpublished, with the owner's July 2026 FAQ prose in open conflict about the check's
frequency; trigger conditional).** Treat 2026-11-30 as **the same untradeable mechanism both siblings refused, at the
highest probability any instance in the family carries — and refuse it for the same reasons.** Four legs. **(a) The
proposal's anchor is wrong and the guide's own clause says so.** Section 4.8.4 — *"If none of the applicable trigger
thresholds are breached, no change is implemented"* — makes a month-end check a test rather than a reset, so this
instance is anchored **54 sessions** from the 2026-09-09 quarterly cut-off, not 20 from the October price date.
**(b) That inverts the family's ranking.** Path-simulated with the conditional recaps at 09-25 and 10-27 in place, the
11-24 test breaches in **18.49%** of paths (IWY) and **16.83%** (IWF), against **14.16%** for December's 17-session leg
on the same estimator — November is the peak, because it sits furthest from an unconditional recap. **(c) The levels
are unreproducible across sessions and the sheet is built on ordering instead.** Re-implementing the siblings' stated
formula puts their own legs at ~2× their published values under every variant tried; that is banked as a forward test,
not reconciled by assertion. **(d) Nothing about being the peak makes it tradable.** 18.49% is better than 4-to-1
against on an unhedgeable conditional that reads a cohort no member can observe intraday; the single-name leg is dead
(NVDA 16.21% vs a 24% trigger); the fire case moves ~$478M across five mega caps into a 24-event corridor; `symbols`
is empty and the house playbooks return zero hits. Carry forward one thing that outlives this event: **a conditional
check is not a reset — before anchoring a drift window on a scheduled test, read whether the rule says anything happens
when the test passes.** The December lane banked "re-derive the geometry before inheriting the number"; this instance
is the case where the geometry itself was defined against the wrong event.

**Kill switches:**

- **The 2026-11-24 close leaves IWY's or IWF's cohort above 48%** — the test fires, and a sheet that called an 18.49%
  draw a stand-aside has to answer for the one instance in the family where it was closest to wrong. Registered as
  `FT-russell-style-month-end-capping-effective-2026-11-30-1`.
- **An index notice records a Russell US Style recap effective 2026-10-30** — the monthly reading is confirmed from the
  tape rather than a table, but this instance's 54-session anchor collapses to the proposal's 20-session one and leg 3
  reverts toward **16.45%**. A confirmation of the family and a demotion of this date, at once. Registered as
  `FT-russell-style-month-end-capping-effective-2026-11-30-2`.
- **A third session re-measuring the September 12-session leg lands near 3.95% rather than 7.85%** — this session's
  estimator is the outlier, every level above is roughly halved, and the ordering claim survives while the magnitudes
  do not. Registered as `FT-russell-style-month-end-capping-effective-2026-11-30-3`.
- **IWY's over-4.8% company cohort reads above 45.5% in holdings dated after the 2026-09-21 effective open** — the
  quarterly review did not reset it, the 54-session path starts ~1.6pp closer to the trigger, and every probability
  above is anchored to the wrong level.
- **FTSE Russell publishes a guide version past v5.4, an index notice, or an FAQ revision restoring quarterly wording
  for the Russell US Style rows in section 4.8.6** — this entry and its October sibling are withdrawn rather than
  researched, and the calendar's four-a-year model was right.
- **AVGO's IWY weight crosses 4.8% in either direction** — at **5.57%** it is the cohort's marginal name and its exit
  would drop the cohort ~5pp *away* from a breach in one step. Marginal names dominate a step function over a
  54-session window far more than over a 17-session one, which is a cost of the longer anchor, not a benefit.
- **A Russell US Style recap is announced effective 2026-11-30 while the reconstitution lock-down opens the same
  session** — the unwritten interaction resolves itself on the tape, and the guide's silence turns out to have been
  a gap rather than an irrelevance.

**Registered forward tests.** `FT-russell-style-month-end-capping-effective-2026-11-30-1`, `-2` and `-3` — see
[`forward-tests/russell-style-month-end-capping-effective-2026-11-30.md`](../forward-tests/russell-style-month-end-capping-effective-2026-11-30.md).
Observations, never templates. `-2` and `-3` both score **before** the event: the first because the October instance
adjudicates this one's anchor a month ahead of the strike, the second because a method discrepancy between sessions
should not wait on an outcome that cannot settle it.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-83 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-russell-style-quarter-end-capping-effective-2026-12-31.json`, read in full first). probe-ref baseline set (no symbols by design, **VIX 15.72** at the 2026-09-08 close — the `^VIX` 09-07 bar is a Labor-Day artifact with no equity twin and is excluded — band `low:15+`, **24** adjacents, **4** blocked fetches). **HEADLINE 1 — THE PROPOSAL'S OWN ANCHOR IS WRONG.** It sized this instance by a "20-session drift window from the 2026-10-27 October T-3". Guide **v5.4** re-fetched (**652,008 bytes**, 62 streams) and read at clause level gives **§4.8.4** verbatim: *"If none of the applicable trigger thresholds are breached, no change is implemented as a result of the additional capping check."* A month-end check is a **test, not a reset**. The last UNCONDITIONAL recap is the quarterly Russell US Style review (cut-off **09-09**, effective open **09-21**), so the live anchor is **54 sessions**, not 20. Session arithmetic computed with 09-07/11-26/12-25 removed: 09-09→09-25 **12**, 09-09→10-27 **34**, 09-09→11-24 **54**, 10-27→11-24 **20**, 12-02→12-28 **17**; the same walk reproduces the owner's published 09-25 and 12-28 cut-offs. T-3 from Mon 30 Nov steps over Thanksgiving to **Tue 24 Nov** (T-1 Fri 27, T-2 Wed 25). **HEADLINE 2 — THAT INVERTS THE FAMILY'S RANKING.** Path simulation (45% reset at 09-09; conditional recaps to 45% at 09-25 and 10-27; measured 11-24) over 1,206 paths on a 1,260-session bar set (2021-08-31 → 2026-09-08): **IWY 223/1,206 = 18.49%**, **IWF 203/1,206 = 16.83%** — against **176/1,243 = 14.16%** for December's 17-session leg on the same estimator. The raw un-simulated 54-session read is 39.22%; the sim is lower because the intervening checks bleed off extreme paths, which is the correct behaviour. **November is the peak instance, being furthest from an unconditional recap.** **HEADLINE 3 — THE SIBLINGS' LEVELS DO NOT REPRODUCE, AND IT IS BANKED NOT BURIED:** re-implementing their stated formula, the September 12-session leg comes out **7.85%** vs their published **3.95%/4.02%**, and December's 17-session leg **14.16%** vs **7.76%** — ~**2×** on both, surviving adjusted vs unadjusted close (7.85/8.01), bench IWY vs SPY (7.85/12.98) and the rest-leg threshold reading (0.96%, further off the other way). Every call here rests on **ordering** (54≫20≫17≫12, one estimator, one bar set), not level. **THE RESET IS OBSERVABLE AND SHOULD LAND:** IWY's cohort marked from 08-27 holdings to the 09-08 close reads **46.61%** (from 46.81%), above the 45% cap, one session before the 09-09 cut-off; **IWF's 44.44%** is already UNDER the cap, so the review will not touch it and it drifts needing **+8.01%**. **FREQUENCY CONFLICT NARROWED, NOT SETTLED:** the FAQ (re-fetched, **198,134 bytes**, 19 streams — its old `research.ftserussell.com` URL now **404s**; live at the lseg dam path) still reads *"conducted quarterly (March, June, September, and December)"*, but its schedule table is laid out in four **review-cycle** columns, not months, so it has **no slot** for Oct/Nov and its silence is a layout artifact rather than evidence. Guide **footnote 3** is narrower than the December ledger read it: a **June-only** carve-out for a recon effective on the July open, using stale "quarter-end" vocabulary; the December recon is mid-month (12-14) so it reaches neither instance. **SCOPE RE-VERIFIED:** screener → IWF $126.03B, IWD $84.06B, IWP $19.63B, IWY **$15.94B**, IWS $15.67B, IWO $14.70B, IWN $14.61B, IWX $3.98B = **$294.61B**; cohorts (holdings **2026-08-27**) **IWY 46.81%** / **IWF 44.47%**, matching the December sibling to the basis point; GOOG standalone **4.94%/4.77%** so a security-level read understates each ~5pp. **SINGLE-NAME LEG DEAD:** NVDA **16.21%/15.79%** vs a 22.5% cap and 24% trigger. **Adjacency — peers:** none (`symbols: []`). **Macro:** **24** tracked events within 5d (vs 14 around December), the densest of the three instances; `pce-2026-11-25` (**high**) lands one session after the strike, `jobs-2026-12-04` and `ism-manufacturing-2026-12-01` (both **high**) inside the corridor. **STRUCTURAL ADJACENCY, UNRESOLVED:** `russell-recon-lockdown-2026-11-30` opens the December recon lock-down at the open of **2026-11-30** — the exact session a fired recap implements; the capping guide never uses "lock-down" in 35 pages, so the interaction is **unwritten**, recorded as a limit not judged benign. **Vol:** baseline, no prior; VIX 15.72. **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped for `rebalanc\|reconstitution\|russell\|capping\|index.flow\|IWF\|IWY` → **zero hits**; no index notice recording any capping check firing was found. **BLOCKED FETCHES RECORDED, NOT SUBSTITUTED SILENTLY — THE FALLBACK CHAIN IS DEGRADING:** iShares holdings CSV returned HTML under HTTP 200 for both IWY and IWF (as for the sibling); the aggregator JSON route that sibling fell back to now **404s**; Yahoo `topHoldings` **401s**. Holdings taken from the same aggregator's rendered HTML instead; all four failures in `probe-ref.blocked`. **NO NEW ADJACENT PROPOSED, DECLINES RECORDED:** the FAQ schedule table's rows are already tracked (`russell-recon-lockdown-2026-11-30`, `russell-quarterly-ipo-review-effective-2026-09-21`, `russell-recon-preliminary-2026-11-13`); declined are the **09-09**/**12-02** capping cut-offs and the **10-30** market-cap cut-off (data cut-offs), the **11-04**/**11-09** Russell Monitor List drops (monthly subscriber files, no market event), and the **2027** month-ends (no owner document names a 2027 date). The October sibling already exists as a proposal and was **not** duplicated. Registered **FT-…-1** (11-24 cohorts at or below 48%), **FT-…-2** (no Russell US Style recap effective 2026-10-30 — scored a month before the strike because October adjudicates this instance's anchor), **FT-…-3** (the level discrepancy, scored on a third re-measurement rather than on an outcome that cannot settle it). | — (stance set: **stand aside** Today/week, **watch the 09-21 reset land** this month, **watch two numbers** this quarter; the refusal rests on an owner-published but prefix-gapped conditional date whose two source documents disagree on cadence, a path-simulated **18.49%** breach probability that is the family's highest and still better than 4-to-1 against, base-rate levels this session could not reconcile with either sibling, a dead single-name leg, and a ~$478M fire case landing in a 24-event corridor on the same session the December reconstitution lock-down opens) | 2026-10-08 (band `low:15+`, every 30d; tightens to `low:0+`, every 7d, on 2026-11-15). Close-out by 2026-12-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-russell-style-month-end-capping-effective-2026-11-30.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
