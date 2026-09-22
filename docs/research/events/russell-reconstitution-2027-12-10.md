# FTSE Russell US indexes — the December 2027 semi-annual reconstitution — russell-reconstitution-2027-12-10

**Kind:** sector · **Date:** 2027-12-10 (estimate — EST: rule-derived from FTSE Russell's own ground rules, re-fetched and re-extracted this session. *Russell US Equity Indexes* construction and methodology, **v7.2, August 2026** (HTTP 200, **746,491 bytes**, 77 content streams inflated in-session — **byte-identical** to the `russell-reconstitution-2026-12-11` lane's 2026-09-06 fetch, so no revision has landed). §4.2.3: *"Reconstitution occurs on the fourth Friday in June and the **second Friday in December**."* §9.3.1 restates it; Appendix F's schedule table gives *"Implementation | 4th Friday of June | **2nd Friday of December**"* and defines implementation as *"the day changes are made after the close of the market and become effective at the open on the Monday following"*. December 2027's Fridays are 12-03 / **12-10** / 12-17 / 12-24 / 12-31. Stays `estimate` because this calendar's confirmed-tier prefixes have no member for an index owner's own schedule, and because **no 2027 calendar exists yet — verified mechanically this session**: the 2027 FAQ path returns HTTP 404 where the 2026 edition returns HTTP 200 / 198,134 bytes, and §4.2.3 says the full calendar *"is published each spring"*) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.36,"daysBand":"medium:31+","adjacentIds":["fomc-2027-12-08","ndx-annual-reconstitution-announcement-2027-12-10","sp-rebalance-reference-close-2027-12-10","vix-expiration-2027-12-15"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — this event is 457 days away, has no milestone of its own for 415 of them,
and nothing about it is tradeable.** What this session bought instead is calibration, and three
findings are load-bearing. **First, the anchor everyone has been reasoning from is now measured
rather than modelled.** The sibling lanes size this family off the owner's turnover paper — *"12.8%
of base market value across **252 stocks**, 2004–2026"* — without reading its footnote. The footnote
says the count is **the greater of additions and deletions**, not their sum. FTSE Russell's own June
2026 summary publishes that quarter's figures directly: **244 additions and 160 deletions to the
Russell 2000**, so max = **244 against the 252 annual average — 3.2% below it.** June 2026 behaved
exactly like an annual reconstitution, which is the empirical confirmation of the sibling's
arithmetic correction (it carried twelve months of drift because no December 2025 leg existed).
**Second, 2027 is the first calendar year in which BOTH Russell legs are six-month legs**, so it is
the first year that can discriminate the two models the sibling laid out and could not test:
linear accumulation (each leg ≈126, sum ≈252) against √t dispersion (each ≈179, sum ≈358). The sum
is the discriminator, and this ledger registers it. **Third, 2027-12-10 is a three-owner index date
by permanent rule** — Russell implements, the S&P Select Sector Quarterly Qualification Date is *"the
second Friday of any calendar quarter-end month"*, and the Nasdaq-100 annual reconstitution
announcement lands on the second Friday in **all thirteen years 2020–2032** by weekday arithmetic —
**but only Russell trades that day.** The other two price and announce on that close and their flow
prints into the **2027-12-17** triple witching. Measured on 21 years of clean control (2005–2025, no
Russell December leg): the second Friday is an ordinary session in **all three** ETFs (IWM 0.99×,
SPY 1.02×, QQQ 1.03× of trailing-60d median volume) while the third Friday runs IWM 1.37× / SPY
1.79× / QQQ 1.23×. That **strengthens** the sibling's baseline rather than contaminating it, and it
kills the obvious mechanism probe: QQQ, the instrument that should be most sensitive to the NDX leg,
is the *least* lifted of the three. Date `estimate` and un-upgradeable before spring 2027; no house
playbook is index-flow-keyed; nothing here licenses a position on any horizon.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-457, `symbols: []`, no index-flow playbook exists, and this event's own first milestone — rank day **2027-10-29** — is 415 days out; the constituent list is not merely unpublished, it is undetermined | A house index-flow or closing-auction instrument being built and back-tested before **2027-12-10** — "nothing to size this with" stops being a grep result and this sheet is rebuilt on measured data |
| This week | **Stand aside** | High | No 2027 milestone falls in it, and the nearest dated link in the whole Russell chain is the **December 2026** leg's rank day, 2026-10-30, 51 days out | FTSE Russell publishing a ground-rules revision past v7.2 before **2026-09-16** — the byte-identical re-fetch this session is the check, and §4.2.3, §9.3.3 and Appendix F carry the entire derivation |
| This month | **Stand aside** | High | Nothing between now and **2026-10-09** publishes anything about December 2027; the 2027 calendar is a *spring 2027* publication by the owner's own §4.2.3, confirmed by a 404 on the 2027 FAQ path this session | The FTSE Russell 2027 reconstitution calendar appearing before **2026-10-09** — far ahead of the stated spring cadence, which would mean the schedule moved and the whole rule-derived chain is re-read from the published table |
| This quarter | **Watch the December 2026 leg, take no position** | Medium | This event has no milestone in the quarter, but its calibration does: **2026-11-13** publishes the first-ever December preliminary counts and **2026-12-11** is the dress rehearsal for the same corridor — that is where the halving model is first tested | The **2026-11-13** preliminary lists showing a Russell 2000 max(adds, deletes) **at or above 244** — June 2026's measured print. December is not a reduced-scope leg at all, the halving model behind this whole sheet is wrong, and both 2027 legs need re-pricing upward |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` and **cannot be upgraded before spring 2027** (§4.2.3: the calendar *"is published each spring"*; the 2027 FAQ path 404s today). It widens caution about the 2027-12-10 close and the 2027-12-13 open and licenses **no** date-keyed action.
- **Never trade the reconstitution.** No house playbook is index-flow- or calendar-keyed (re-grepped this session: zero hits), and the one measured index-effect shape has a short leg blocked house-wide.
- **The size anchor is `max(adds, deletes)`, not `adds + deletes`** — the owner's own footnote. June 2026 printed **244 / 160**, so max = 244 against the 252 annual average. Any future comparison to "252" must use the same statistic.
- **2027 is the discriminating year.** First calendar year with two six-month legs; sum of the two maxes separates linear accumulation (≈252) from √t dispersion (≈358). Registered as `FT-russell-reconstitution-2027-12-10-2`.
- **2027-12-10 is a three-owner index date, and only one owner trades on it.** Russell implements; S&P's Quarterly Qualification Date prices the capping trade; Nasdaq announces the NDX annual reconstitution after the close. The latter two print into **2027-12-17**.
- **The heavy Friday is 2027-12-17, not 2027-12-10** — on 21 clean control years the third Friday runs SPY 1.79× / IWM 1.37× / QQQ 1.23× against a second Friday that is ordinary in all three. Execution hygiene covers both dates.
- **The NDX-leg mechanism is not visible on the tape** — QQQ is the *least* lifted of the three on the third Friday (1.20× vs SPY's 1.75×). Expiration dominates; whole-day ETF volume cannot decompose index flow.
- Dated watch list: **2026-11-13** December-2026 prelims (the halving model's first test) → **2026-12-11** the dress rehearsal → **spring 2027** the published 2027 calendar → **2027-06-25** June 2027 implementation and its published counts → **2027-10-29** rank day → **2027-11-12** preliminary lists → **2027-11-15→11-26** query period → **2027-11-29** lock-down opens → **2027-12-10 implementation after the close** → effective at the open **2027-12-13** → **2027-12-17** triple witching + NDX recon + S&P quarterly rebalance.

## Initial research

### The question

`russell-reconstitution-2027-12-10` reached this calendar as a single proposal from the
[`russell-style-quarter-end-capping-effective-2027-12-31`](russell-style-quarter-end-capping-effective-2027-12-31.md)
initial research, which filed it because the December 2027 leg *is* that event's reset: the capping
factors its 2027-12-28 test reads were last set by a review whose effective open is the Monday after
this implementation Friday. The proposal was read in full before anything below was written, and it
asked the taking lane to do two things rather than copy: re-enumerate the corridor, and leave the
upstream milestone chain to a lane that would research it properly.

Two questions follow, and neither is the proposal's. **The two sibling ledgers size this family off
one number — the owner's "252 stocks" — that neither of them read the definition of. Is the number
what they think it is?** And **what is actually on 2027-12-10 besides Russell?**

**One-line verdict:** the "252" is `max(adds, deletes)` and June 2026 printed 244 against it — the
halving model survives its first contact with owner-published data — and 2027-12-10 is a permanent
three-owner index date on which only one owner trades, which moves the flow question to
**2027-12-17** and leaves 12-10 information-dense and flow-light.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry
carries `symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no
index-flow instrument. Nothing below is taken from a sibling on faith; every primary was re-fetched.

- **FTSE Russell ground rules** — *Russell US Equity Indexes*, **v7.2, August 2026** (HTTP 200,
  **746,491 bytes**), fetched via `research.ftserussell.com/products/downloads/Russell-US-indexes.pdf`
  (301 → the lseg.com dam path) and text-extracted in-session by inflating **77** content streams.
  §4.2.2, §4.2.3, §5.15.2, §9.3.1–9.3.3 and **Appendix F's two tables** read in full. Version string
  re-read from the extracted text, not assumed.
- **FTSE Russell June 2026 reconstitution summary** — *2026 Russell US Indexes reconstitution: summary
  of changes* (HTTP 200, **449,809 bytes**), fetched and extracted this session. **This document is in
  neither sibling's method**, and it is the source of the only hard add/delete counts in this file.
- **FTSE Russell turnover paper** — *The Impacts of the Russell US Reconstitution* (HTTP 200,
  **444,549 bytes**). Read for the **footnote** defining its own "number of stocks", which is the
  session's first finding.
- **FTSE Russell published constituent lists** — `ru3000-additions/deletions-20260626.pdf` and
  `rmicro-additions/deletions-20260626.pdf` (HTTP 200, 976,799 / 1,010,529 / 980,580 / 970,159 bytes),
  extracted and counted as an independent cross-check on the summary's arithmetic.
- **FTSE Russell FAQ path probe** — the 2026 edition at
  `…/policy-documents/ftse-faq-document-russell-us-equity-2026.pdf` returns **HTTP 200 / 198,134 bytes**
  (matching the sibling's byte count exactly); the same path with `2027` returns **HTTP 404**. The
  reconstitution page (HTTP 200, **228,333 bytes**) links only the 2026 FAQ and the June 2026 lists.
- **Yahoo daily bars** — IWM, SPY, QQQ, IWB, `^VIX`, 2004-01-02 → 2026-09-08 (5,706 bars each),
  fetched this session. Volume ratios computed against each symbol's own trailing-60-session median.
- **This repo** — the proposal file read in full first; both sibling ledgers and both forward-test
  fragments read in full; `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped for
  `rebalanc|index effect|reconstitution|russell|closing auction` → **zero hits**; the corridor computed
  with `computeAdjacentIds` from `scripts/event-material-decide.mjs` rather than by eye.

### Conviction legs, tested

1. **The date is right, and the rule is unchanged since the sibling read it — SUPPORTED.** §4.2.3
   verbatim: *"Reconstitution occurs on the fourth Friday in June and the second Friday in December."*
   §9.3.1 restates it inside the quarterly schedule; Appendix F's schedule table gives implementation
   as *"2nd Friday of December"* and defines it as *"the day changes are made after the close of the
   market and become effective at the open on the Monday following"*. December 2027's Fridays are
   12-03 / **12-10** / 12-17 / 12-24 / 12-31 → second Friday **2027-12-10**, Monday following
   **2027-12-13**. The rule reproduces the tracked 2026 instance (12-11 → 12-14) which the 2026 FAQ
   publishes independently. **The version check is the useful part:** the PDF came back at
   **746,491 bytes, byte-identical** to the 2026-12-11 lane's fetch three days earlier, and the
   extracted version string still reads *"v7.2, August 2026"*. That sibling's third kill switch — a
   ground-rules revision past v7.2 — is **not tripped** as of 2026-09-09.

2. **No 2027 calendar exists, and the date cannot be upgraded before spring 2027 — SUPPORTED, and it
   sets the watch date.** §4.2.3's own sentence continues: *"A full calendar for reconstitution is
   published each spring, although the guidelines that define the schedule are available in Appendix
   F."* Probed rather than assumed: the 2026 FAQ at
   `…/policy-documents/ftse-faq-document-russell-us-equity-2026.pdf` returns **HTTP 200 / 198,134
   bytes**; the identical path with `2027` returns **HTTP 404**; and the reconstitution page's own
   document list carries only the 2026 FAQ, the 2026 summary and the **June 2026** add/delete lists.
   So this entry's `estimate` label is not a formality awaiting a better source — **there is no better
   source until spring 2027**, and no pulse before then can change it.

3. **The "252 stocks" anchor is `max(adds, deletes)`, and both siblings use it without the definition
   — SUPPORTED, and this is the session's central correction.** The turnover paper's table gives
   *"Turnover percentage 32.0 / 12.8"* and *"Number of stocks 534 / 252"* for 1996–2003 and 2004–2026.
   Its footnote, read this session:

   > *"Turnover percentage is calculated by dividing the greater of the aggregate market value of index
   > additions and the aggregate market value of index deletions by the index's base market value.
   > **Number of stocks represents the greater of the number of additions and the number of
   > deletions.**"*

   **The greater of, not the sum.** `FT-russell-reconstitution-2026-12-11-1` registers its kill at *"a
   Russell 2000 add/delete count above 252"* — the phrasing reads as a combined count, which would be
   the wrong statistic against this anchor and would make the threshold roughly twice as hard to trip
   as intended. Flagged for that lane rather than edited from here; a ledger's rows are another lane's
   to write.

4. **June 2026 printed 244 against that 252, which measures the sibling's arithmetic correction —
   SUPPORTED, and it is the first hard number this family has.** The June 2026 summary states the
   Russell 2000 figures directly: *"Of the **244 additions**, 88 companies are classified as Health
   Care, 36 as Technology…"* and *"**160 companies are departing the Russell 2000 Index**: 42 companies
   are moving to the Russell 1000 Index …, 84 companies are moving to the Russell Microcap Index, and
   another 34 companies are leaving the Russell US Indexes universe"* (42 + 84 + 34 = 160, internally
   consistent). So **max(244, 160) = 244**, against the 2004–2026 annual average of **252 — 3.2%
   below it**. The 2026-12-11 lane argued from calendar logic that June 2026 *could not* have been
   diluted, because dilution needs a preceding December leg and there was none; its window ran from
   the June 2025 reconstitution, a full twelve months. **That argument is now measured, not just
   reasoned: a twelve-month June printed an annual-average count.** The same document also gives
   the R1000 side (*"61 companies are being added to the Russell 1000 Index, with 42 of the additions
   moving up from the Russell 2000"*, of which *"Fourteen companies are joining … as new additions to
   the Russell US Indexes universe"*) and the IPO leg (*"Seventeen companies are joining the Russell
   2000 Index as IPOs"*).

5. **The published constituent lists are countable, and they cross-check the extraction without
   reproducing the summary's scopes — MIXED, stated rather than smoothed.** Counting ICB industry
   labels (mixed-case, so company names in caps cannot collide) across the four published PDFs gives
   **R3000E additions 224 / deletions 166** and **Microcap additions 252 / deletions 154**. These are
   the right order of magnitude and the method is sound, but they are **not** the summary's R2000
   figures and do not reconcile to them by simple arithmetic: R2000 additions include names migrating
   up from Microcap and down from R1000, which are internal to R3000E and therefore absent from an
   R3000E additions list. **The summary's stated numbers are what leg 4 and the forward tests use**;
   the list counts are recorded as evidence the documents are machine-countable at all, which is what
   makes the December 2027 test scoreable, and nothing more is claimed from them.

6. **2027-12-10 is a three-owner index date, and the collision is permanent rule, not 2027 accident —
   SUPPORTED, and it is the session's structural finding.** Three owners' published rules independently
   name the second Friday of December:

   | Owner | Rule, as this calendar's entries quote it | 2027 date |
   |---|---|---|
   | FTSE Russell | §4.2.3: reconstitution implemented after the close on *"the second Friday in December"* | **2027-12-10** |
   | S&P DJI (Select Sector) | SEC Form 497: the Quarterly Qualification Date is *"the second Friday of any calendar quarter-end month"* | **2027-12-10** |
   | Nasdaq | NDX methodology: annual reconstitution announced *"after the close on the sixth trading day prior to"* an effective date of *"the first trading day following the third Friday in December"* | **2027-12-10** |

   The Nasdaq leg looks incidental and is not. Effective = the Monday after the third Friday; counting
   six trading days back from it gives F3, F3−1, F3−2, F3−3, F3−4, then F3−7 — **the second Friday**,
   since second and third Fridays are always exactly seven days apart and December carries no holiday
   before the third Friday. Enumerated **2020–2032: 13 of 13 land on the second Friday, 0 exceptions.**

7. **But only Russell trades that day — SUPPORTED, and it relocates the flow question.** The other two
   events are a **reference close** and an **announcement**. S&P's Quarterly Qualification Date prices
   the capping trade that implements at the third-Friday close; Nasdaq's announcement lands *after* the
   2027-12-10 close, with the NDX reconstitution effective at the 2027-12-20 open and implemented into
   the 2027-12-17 close. So a date that sounds like a three-owner pile-up is, in trading terms,
   **information-dense and flow-light** — one implementation, two disclosures — and the flow those two
   disclosures create prints a week later, on top of December quad-witching.

8. **The tape confirms the shape and refuses the decomposition — MIXED, and the refusal is the
   finding.** Whole-day volume ratio to each symbol's own trailing-60-session median, across
   **21 December pairs 2005–2025** (every one a clean control: the semi-annual regime began in 2026,
   so none carries a Russell December leg):

   | | 2nd Friday mean | 2nd Friday **median** | 3rd Friday mean | 3rd Friday **median** | median lift |
   |---|---|---|---|---|---|
   | IWM | 1.045 | **0.986** | 1.381 | **1.373** | **1.39×** |
   | SPY | 1.094 | **1.022** | 1.639 | **1.789** | **1.75×** |
   | QQQ | 1.018 | **1.027** | 1.264 | **1.233** | **1.20×** |

   Two readings, and they point opposite ways. **The one that helps:** the December second Friday is an
   ordinary session in *all three* ETFs, in every one of 21 years, **despite carrying the NDX
   announcement and the S&P Quarterly Qualification Date every single time**. The 2026-12-11 lane
   calibrated its relative test against exactly this window and did not know those two events were in
   it; leg 6 could have contaminated that baseline and **does not** — reference and announcement events
   generate no measurable same-day volume, so the control stands. That *strengthens* the sibling's
   calibration. **The one that hurts:** if leg 7's mechanism were visible, QQQ should carry the NDX
   leg's fingerprint on the third Friday. It is the **least** lifted of the three (1.20× against SPY's
   1.75×). Expiration dominates, and whole-day ETF volume cannot separate an index leg from a witching
   — the same instrument limit the 2026-12-11 lane found from the other direction.

9. **The corridor is four events, against the 2026 leg's twenty-two — SUPPORTED.** Computed with
   `computeAdjacentIds`: `fomc-2027-12-08` (high), `ndx-annual-reconstitution-announcement-2027-12-10`
   (low), `sp-rebalance-reference-close-2027-12-10` (low), `vix-expiration-2027-12-15` (low). **The
   confound has changed character entirely.** For 2026-12-11 it was macro and severe — a government
   funding deadline and a CR expiry on the day, CPI the day before, FOMC two days before — which is
   precisely what the sibling's IWM ÷ SPY relative instrument was built to divide out. For 2027-12-10
   the corridor is *index-structural*, and a relative instrument cannot divide that out because the
   denominator is exactly where the other owners' flow lives. **The honest caveat: the 2027 corridor is
   thin partly because 2027 is under-populated in this calendar** — no CPI, PPI or jobs entry for
   December 2027 exists yet, and they will. It should be re-enumerated at every pulse and is expected
   to grow.

10. **The milestone chain is derived, not published, and one link is honestly missing — SUPPORTED.**
    Appendix F, read this session: *"Rank Day … Last business day of October"* for December;
    *"Preliminary Information Released … Four weeks prior to implementation"*; *"Query Period … For two
    weeks following preliminary announcement"*; *"Lock down … Two weeks after query period ends"*. §4.2.2
    adds that on rank day *"all eligible securities are ranked by their total market capitalization"*,
    and the December style row limits re-scoring to *"new additions and migrations only (current members
    moving between R1000, R2000, RMicro only), not on the entire universe of securities"*. Applied:

    | Milestone | December 2027 | Check |
    |---|---|---|
    | Rank day (+ style characteristics) | **2027-10-29** | last business day of October 2027, a Friday |
    | Preliminary lists + REIR | **2027-11-12** | implementation − 28 days; §4.2.3's *"announced … four weeks prior to implementation for the December review"* |
    | Query period | **2027-11-15 → 2027-11-26** | two weeks following; its final week is Thanksgiving week (`thanksgiving-market-closure-2027-11-25`, `thanksgiving-half-day-2027-11-26`) |
    | Lock-down opens | **2027-11-29** | the Monday after query close, two weeks to implementation — reproduces 2026's published 11-30 |
    | Implementation | **2027-12-10** | after the close |
    | Effective | **2027-12-13** | at the open |
    | Style capping cut-off | **not derived** | the 2026 FAQ published it as a dated cell (2026-12-02) with no rule behind it; the proposer's own sheet assumes 2027-12-01 |

    **The last row is the honest one.** Every other link falls out of a stated rule; the capping cut-off
    does not, and this session declines to reverse-engineer a rule from one instance. **Nothing upstream
    is proposed as a calendar entry**, per the proposal's own request and the 2026-12-11 precedent that
    rank day is determined-but-undisclosed — and because `russell-recon-preliminary-*` is an established
    class whose 2027-12 instance belongs to a lane that researches it properly, not to this one.

11. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` re-grepped this session for
    `rebalanc|index effect|reconstitution|russell|closing auction`: **zero hits**. The only contact
    point is execution hygiene across the 2027-12-10 close, the 2027-12-13 open, and — per legs 7 and 8
    — the materially heavier **2027-12-17**.

### What the conditions support

Nothing directional, on any horizon. Five outputs, in rough order of what they change: **a size anchor
whose definition was finally read** (`max(adds, deletes)`, not the sum — which makes a sibling's
registered kill threshold roughly twice as hard to trip as its wording implies); **the family's first
hard count** (June 2026: 244 additions, 160 deletions to the Russell 2000, max 244 against the 252
annual average, confirming by measurement the sibling's calendar-logic correction); **a discriminating
year named and registered** (2027 is the first with two six-month legs, so the *sum* of the two maxes
separates linear accumulation from √t dispersion — a fork both siblings stated and neither could test);
**a permanent three-owner collision derived from three owners' rules and enumerated across 13 years**,
with the load-bearing qualifier that only one of them trades on the day; and **a 21-year control
measurement that strengthens a sibling's calibration and kills this session's own mechanism probe** —
the second Friday is ordinary in all three ETFs despite always carrying two other index events, and QQQ
is the least lifted on the third Friday, so the NDX leg is invisible to the instrument that should see
it best.

### Honest limits

**Leg 4's 244 is one observation of one leg of one regime**, and it is a *June* observation used to
calibrate a *December* expectation — the entire halving model still rests on arithmetic, not on a
December print. The first December count does not exist until 2026-11-13. **The linear-vs-√t fork in
leg 3's framing is a false dichotomy sharpened for testability**: real breakpoint migration is neither,
because a market-wide advance moves the R1000/R2000 breakpoint itself and forces crossings that no
dispersion model captures. In a strongly trending 2027 the sum could exceed 358 for reasons unrelated
to which model is right, and `FT-…-2` would score a kill that means "the tape trended", not "dispersion
wins". That is stated at registration rather than discovered at scoring. **`max(adds, deletes)` is not
additive**, so summing two legs' maxes is a defensible statistic only while each leg's adds exceed its
deletes as June 2026's did (244 > 160); if a December leg inverts that, the sum changes meaning and the
test must be re-read, not re-scored. **Leg 5's list counts do not reconcile to leg 4's summary
figures** and are used for nothing beyond proving the documents are countable. **Every volume figure in
leg 8 is whole-day consolidated ETF volume**, which is the wrong instrument for a closing auction —
the owner's own June 2025 figure is *"$217.2 billion traded across US stock exchanges at the close"*,
and nothing in this repo measures auction notional or MOC imbalance. Leg 8 therefore constrains what our
instruments can see, not what trades. **IWM is an ETF tracking the Russell 2000, not the
reconstitution**; the flow is in the underlying names migrating, and an index proxy sees the net of
two-sided flow that largely cancels. **Leg 8's 21 pairs are not independent of the 2026-12-11 lane's 20**
— it is the same instrument on an overlapping window, extended by one year and two symbols; agreement
between them is a consistency check, not corroboration by a second measurement. **The corridor in leg 9
will grow**, and a thin corridor today is a fact about this calendar's 2027 coverage as much as about
December 2027. **Nothing here forecasts which names are added or deleted**; membership is not determined
until 2027-10-29 and not public until 2027-11-12. **And the date itself is `estimate` for a reason no
amount of research fixes before spring 2027** (leg 2).

**One process observation, banked rather than acted on, and it is now the fourth recording.** Every
Russell entry in this calendar carries a date the owner publishes on its own site *and* in a versioned
PDF *and* reproduces from a stated rule, and every one sits at `estimate` because the confirmed-tier
prefixes (`IR:`/`BLS:`/`FED:`) have no member for an index owner's own published schedule. Leg 6 shows
the gap is wider than Russell: the same downgrade applies to Nasdaq's NDX methodology and — but for its
SEC filing — to S&P's Select Sector rules. That is a prefix gap, not a source weakness, it recurs by
construction, and each lane re-explains it from scratch. Named here so a governance PR can add the
prefix once; this lane's ceiling is a PR and it did not self-widen the tier.

Every trading-adjacent statement above carries this entry's `estimate` label; shorting is blocked
house-wide and no house playbook is index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived and un-upgradeable before spring 2027).** Treat
2027-12-10 as a **certain, mechanically forced, entirely unactionable flow date whose size is not yet
knowable, whose date cannot be improved for another six months, and whose own tape will not reveal
either** — and treat the **December 2026 leg as its calibration**. Four legs. **(a) The anchor everyone
reasons from is `max(adds, deletes)`, and it is now measured.** The turnover paper's footnote defines
its "252 stocks" as the greater of the two counts, not their sum; FTSE Russell's June 2026 summary
publishes **244 additions and 160 deletions** to the Russell 2000, so a twelve-month June printed
**244 against a 252 annual average**. The 2026-12-11 lane's arithmetic correction — that June 2026
could not have been diluted — is confirmed by measurement rather than by reasoning alone.
**(b) 2027 is the first year that can settle the halving question**, because it is the first calendar
year in which both Russell legs carry six-month drift windows; the *sum* of the two legs' maxes
separates linear accumulation (≈252) from √t dispersion (≈358), a fork both siblings named and neither
could test. **(c) 2027-12-10 is a permanent three-owner index date on which only one owner trades.**
Russell implements; S&P's Quarterly Qualification Date prices; Nasdaq announces after the close — the
last two print into the **2027-12-17** witching, which on 21 control years runs SPY 1.79× / IWM 1.37× /
QQQ 1.23× against a second Friday that is ordinary in all three. **(d) That control window strengthens
a sibling's calibration and kills this session's own probe.** It always contained the NDX announcement
and the S&P reference close, and still printed ordinary — so reference/announcement events leave no
same-day volume trace and the 2026-12-11 baseline is clean; but by the same token QQQ, the instrument
that should carry the NDX fingerprint, is the least lifted of the three, so whole-day ETF volume cannot
decompose index flow in either direction. Carry forward one correction that outlives this event: **the
Russell size anchor is `max(adds, deletes)` and its measured June 2026 value is 244; the December
question is settled on published counts, never on the implementation-day tape.**

**Kill switches:**

- **The 2026-11-13 December-2026 preliminary lists show a Russell 2000 `max(adds, deletes)` at or above
  244** — June 2026's measured print. December is not a reduced-scope leg, the halving model behind this
  entire sheet is wrong, and both 2027 legs need re-pricing upward. This is the earliest date on which
  this stance can be falsified, and it belongs to a sibling's event, not this one.
- **The December 2027 leg's own `max(adds, deletes)` prints at or above 244** — same conclusion, second
  observation, on this ledger's own date. Registered as `FT-russell-reconstitution-2027-12-10-1`.
- **The two 2027 legs' maxes sum to 305 or more** — semi-annual reconstitution *generates* turnover
  rather than splitting it, December is a heavier flow event than this sheet prices, and the 2028 legs
  need re-pricing. Registered as `FT-russell-reconstitution-2027-12-10-2`.
- **The 2027 calendar, published in spring 2027, names any December implementation date other than
  2027-12-10** — legs 1, 2 and 10 all rest on rule-derivation from v7.2, and the whole milestone chain
  is recomputed from the published table instead. Registered as `FT-russell-reconstitution-2027-12-10-3`.
- **FTSE Russell publishes a ground-rules revision past v7.2 touching §4.2.3, §9.3.1, §9.3.3 or Appendix
  F** — the byte-identical re-fetch is this session's check and it passed; re-check the byte count and
  the version string at every pulse.
- **Nasdaq or S&P DJI revises the rule that puts its December event on the second Friday** — leg 6's
  13-of-13 enumeration is arithmetic on top of two published rules, and a change to either dissolves the
  three-owner framing.
- **An auction-level instrument (closing-auction notional or MOC imbalance) gets built** — leg 8 measures
  the wrong quantity by admission, and this sheet is rebuilt on data that can see the flow.
- **A house index-flow playbook gets built** — leg 11's "zero hits" stops being a grep result.

**Registered forward tests.** `FT-russell-reconstitution-2027-12-10-1`, `-2` and `-3` — see
[`forward-tests/russell-reconstitution-2027-12-10.md`](../forward-tests/russell-reconstitution-2027-12-10.md).
Leg 3's correction to `FT-russell-reconstitution-2026-12-11-1`'s threshold wording is deliberately **not**
registered here: it is a sibling's row to score and a sibling's stance to amend, and it is flagged on
that lane rather than edited from this one. Observations, never templates.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-457 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-russell-style-quarter-end-capping-effective-2027-12-31.json`, read in full first). probe-ref baseline set (no symbols by design, **VIX 16.36**, band `medium:31+`, **4 adjacents** via `computeAdjacentIds`, no blocked fetches). **Date re-derived from a re-fetched primary**, not inherited: ground rules **v7.2 August 2026**, **746,491 bytes — byte-identical** to the 2026-12-11 lane's fetch, 77 streams inflated, §4.2.3 / §9.3.1 / Appendix F all re-read; the 2026-12-11 lane's v7.2 kill switch is **not tripped**. **No 2027 calendar exists** — 2027 FAQ path **HTTP 404** vs the 2026 edition's **HTTP 200 / 198,134 bytes**; §4.2.3 says the calendar publishes *"each spring"*, so the `estimate` label is un-upgradeable before spring 2027. **HEADLINE 1 — the "252 stocks" anchor is `max(adds, deletes)`, not their sum:** the turnover paper's own footnote reads *"Number of stocks represents the greater of the number of additions and the number of deletions"*; `FT-russell-reconstitution-2026-12-11-1`'s *"add/delete count above 252"* wording reads as a combined count and is roughly 2× harder to trip than intended — flagged for that lane, not edited. **HEADLINE 2 — the family's first hard count**, from the June 2026 summary (449,809 bytes, in neither sibling's method): **244 additions / 160 deletions** to the R2000 (deletions reconcile 42→R1000 + 84→Micro + 34 exits), so **max = 244 vs the 252 annual average, −3.2%** — a twelve-month June printed an annual-average count, measuring the 2026-12-11 lane's calendar-logic correction. **HEADLINE 3 — 2027-12-10 is a permanent THREE-OWNER index date:** Russell implements (§4.2.3), S&P's Quarterly Qualification Date is *"the second Friday of any calendar quarter-end month"*, and NDX's *"sixth trading day prior to"* announcement rule lands on the second Friday in **13 of 13 years 2020-2032** — **but only Russell trades that day**; the other two price/announce and print into **2027-12-17**. **Tape, 21 clean control pairs 2005-2025** (median vol ÷ trailing-60d median): 2nd Friday IWM **0.986** / SPY **1.022** / QQQ **1.027**, 3rd Friday IWM **1.373** / SPY **1.789** / QQQ **1.233**. Cuts both ways — the 2026-12-11 baseline **always contained** the NDX + S&P events and still printed ordinary, so that calibration is **clean** (announcements leave no same-day trace); but QQQ is the **least** lifted on the 3rd Friday, so the NDX mechanism is **invisible** to the instrument that should see it best and whole-day ETF volume cannot decompose index flow. **Milestone chain derived from Appendix F:** rank **2027-10-29**, prelims **2027-11-12**, query **11-15→11-26** (final week = Thanksgiving week), lock-down opens **2027-11-29**, effective **2027-12-13**; **style capping cut-off deliberately NOT derived** (2026's was a published cell with no rule). **No upstream entry proposed** — per the proposal's own request and the rank-day precedent. **Adjacency — peers:** none (`symbols: []`). **Macro:** `fomc-2027-12-08` (high) is the only macro adjacent; the 2027 corridor is thin because this calendar's 2027 coverage is thin, and will grow. **Vol:** baseline, no prior; VIX 16.36, IWM 294.67, SPY 765.96, QQQ 718.36, IWB 419.05 (2026-09-08 closes). **Geopolitical:** nothing touching index methodology. **Event tape:** playbooks + sweep re-grepped → **zero hits**. Registered **FT-…-1** (Dec-2027 max(adds,deletes) ≤180, kill ≥244), **FT-…-2** (2027 two-leg sum <305, kill ≥305), **FT-…-3** (the spring-2027 calendar names 2027-12-10). | — (stance set: stand aside on Today/week/month, **watch the December 2026 leg** this quarter; the refusal rests on D-457 with no own-milestone for 415 days, an `estimate` label no research can lift before spring 2027, zero playbook fit, and a demonstrated instrument blindness in both directions — with one open question now testable, whether the two 2027 legs sum to the annual figure or exceed it) | 2026-09-30 (medium, ≥31d band: every 21d). Close-out by 2027-12-16 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-russell-reconstitution-2027-12-10.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
