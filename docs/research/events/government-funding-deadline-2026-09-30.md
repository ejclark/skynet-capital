# FY2027 federal funding deadline — shutdown begins 2026-10-01 absent a CR — government-funding-deadline-2026-09-30

**Kind:** geopolitical · **Date:** 2026-09-30 (estimate, NEWS: the *date* is statutory — FY2026 appropriations lapse at end of fiscal year — but the *event* is conditional and neither passed CR is enacted; Senate H.R. 6500 to Dec 11 passed 08-08 90–6, House H.R. 9770 to Dec 4 passed 07-21 220–205, checked 2026-08-29) · **Impact:** high
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.51,"daysBand":"high:21+","adjacentIds":["chicago-pmi-2026-09-30","consumer-confidence-2026-09-29","ism-manufacturing-2026-10-01","jobs-2026-10-02","jolts-2026-09-29","mu-2026-09-29-print"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The base case is that this is averted, and the thing to prepare for is not a shutdown —
it is a data blackout.** Both chambers have already *passed* a continuing resolution; the entire
remaining gap is a **one-week difference in the expiry date** (House Dec 4 vs Senate Dec 11), not a
policy fight, and the Senate's version cleared **90–6** on a Collins–Murray deal whose stated purpose
was to fund past the **November 2026 midterms** so neither party owns a pre-election shutdown.
Mechanism and incentive point the same way. Two honest counterweights: nothing is signed, and
**2026 already produced a lapse from pure calendar mechanics** — the Jan 30–Feb 3 weekend partial
shutdown happened *despite* Senate passage, because the House hadn't reconvened. On the market
question, the measured answer is dull: across 22 funding gaps since 1976 the S&P's median return
**during** a shutdown is **0.0%** (+3.1% since 2010). So the exposure worth managing is
**informational**. A lapse from 10-01 deletes **jobs 10-02** and **CPI 10-14** from this calendar —
2025 proved they do not come back — and sends the Fed into the **10-28 FOMC, which carries no SEP**,
under a chair who **formally abandoned forward guidance on 08-28**. No guidance, no dots, no data,
into a live hike debate. Date/status is **estimate**; nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-32) | Stand aside | High | `symbols: []`, a conditional event 32 days out, and the resolving vote hasn't been scheduled. There is nothing to act on. | Nothing dated today; the House vote has no announced date and no bill has been signed |
| This week | Watch the **House floor**, nothing else | High | The House returned **08-31** to take up the Senate's CR; that vote — not any datapoint — resolves this event, and it is expected in the first week of September. | The House passing the Senate CR **and** the president signing it, which retires this event entirely and closes this doc early |
| This month | Prepare for the **blackout**, not the shutdown | Medium | If no CR is signed by 09-30, the loss is **jobs 10-02 + CPI 10-14**, permanently — not a drawdown. The equity base rate through shutdowns is ~0%; the data loss is the durable effect. | A CR signed before **2026-09-30**, which kills the blackout branch and drops this to a footnote |
| This quarter | Do not trade the headline; **do** re-read the Fed as flying blind | Medium | Three blindfolds compound into the **10-28 FOMC**: no forward guidance (Warsh, 08-28), no SEP (October meeting), and — in the lapse branch — no October payrolls or CPI. | The **2026-10-28** FOMC arriving with a full data set (CR signed) or with Warsh restoring an explicit reaction function, either of which removes the compounding |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade the shutdown headline.** The measured during-shutdown S&P median is **0.0%** across
  22 funding gaps since 1976. No house playbook is macro-keyed; `symbols: []`.
- **A signed CR before 2026-09-30** → this event retires; the 10-02 payrolls and 10-14 CPI print
  normally and the corridor reads as ordinary.
- **No CR by 2026-09-30** → the risk to manage is the **vacuum**, not the tape: expect the market to
  over-weight the surviving *private* surveys (ISM 10-01, ADP) in a federal-data blackout.
- **TIPS carry a documented plumbing exposure** — in the 2025 lapse Treasury invoked the index
  contingency provisions because October CPI did not exist. The 09-17 10Y TIPS auction sits upstream.
- **Treasury supply is unaffected** — auctions continued through 2025's lapse; the five tracked
  Treasury events survive it, only the BLS ones die.
- **Watch (dated):** House CR vote **first week of Sep** (unscheduled) · **FOMC 09-16** · consumer
  confidence + JOLTS + MU **09-29** · Chicago PMI **09-30** · **this deadline 09-30** (estimate) ·
  ISM **10-01** (estimate) · **jobs 10-02** · **CPI 10-14** · **FOMC 10-28** (no SEP) ·
  **midterms 11-03** (estimate, proposed in this PR) · CR expiry **Dec 4 or Dec 11**.

## Initial research

### The question, plainly

Does the federal government shut down on 2026-10-01, how likely is that, and — the part the calendar
actually needs — what does either branch do to a paper book holding long-duration tech (NVDA MRVL
AVGO CRWV MSFT GOOG META AAPL AMZN) and to the seventeen other dated events this calendar tracks in
the same quarter?

**One-line verdict:** aversion is the base case because the mechanism is nearly done (two passed CRs
separated by a one-week date) and the incentive is aligned (a deal explicitly built to fund past the
midterms), the equity channel is a measured near-non-event (median 0.0% during shutdowns), and the
real exposure is **informational** — a lapse permanently deletes the October payrolls and CPI and
sends a guidance-free Fed into a no-SEP meeting with nothing to read.

### Method

Macro/geopolitical mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`,
so no symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run, and
the cache-busting rule has no target. Sourced web research: the FY2027 legislative status from a
funding tracker (fedtools, last updated **2026-08-24**), an appropriations-advocacy update
(afterschoolalliance, 2026-08-10) and the House Appropriations Committee's own releases for the bill
numbers and vote margins, cross-read against the Conference Board / CRFB sourcing already banked in
the [`ISM 10-01`](ism-manufacturing-2026-10-01.md) sibling (both 2026-08-12); the Collins–Murray deal
and its midterm rationale from contemporaneous coverage (NBC/CBS/PBS/WaPo/The Hill/Fiscal Times, all
early August 2026 — reached via search summaries because NBC and CNBC both returned **403** on direct
fetch). The 2025 shutdown's data effects come from the Richmond Fed's own "Phantom Figures" macro
note and the Friends-of-BLS FAQ (2025-11-12); the TIPS contingency finding is Treasury's **own press
release sb0324**. The January 2026 weekend lapse comes from the Conference Board's alert dated
**2026-02-03**, fetched directly today. Market base rates are press/JPM-sourced and are corrected in
leg 5 for a confound the sources do not address. Volatility is the repo's own `event-material-scan`
probe (VIX **14.51**). The Fed-path reads are carried from [`jackson-hole`](jackson-hole-2026-08-28.md)
and [`fomc-2026-09-16`](fomc-2026-09-16.md), not re-derived.

### Conviction legs, tested

1. **The date is certain and the event is not — SUPPORTED, and it is an unusual labeling case worth
   naming.** Every other `estimate` on this calendar means *we are not sure when this happens*. This
   one is the inverse: **2026-09-30 is statutory** — FY2026 appropriations lapse at the end of the
   fiscal year, and no source disputes it — while **whether the thing the entry describes actually
   occurs is genuinely open**. The `estimate` label is still correct and still does its job (it
   widens caution and forbids date-keyed action), but a future session should not read it as date
   doubt. Promoting it is also forbidden here regardless: this lane may not self-confirm, and the
   conditional half could not be confirmed by any source anyway.

2. **The legislative mechanism is closer to done than a normal August — SUPPORTED, and this is the
   load-bearing fact.** **Both chambers have already passed a CR.** The House passed **H.R. 9770**,
   a clean CR at FY2026 levels running to **December 4**, on **2026-07-21** by **220–205**. The
   Senate passed **H.R. 6500** (Continuing Appropriations and Extensions Act, 2027) at FY2026 levels
   running to **December 11**, on **2026-08-08** by **90–6**. What remains is reconciling a
   **one-week difference in the expiry date**, plus the Senate's added material (surface-transportation
   extensions and a block on an OMB grant-approval rule), and a signature. That is a materially
   different posture from a fight over *levels* or *riders*, which is what produces shutdowns.
   Corroborating context on the underlying appropriations: House Appropriations has advanced all
   twelve FY2027 bills but only **2 of 12** have passed the full House and the **Senate has advanced
   none** — so a full-year deal was never happening by 09-30 and a CR was always the path.

3. **The incentive points the same direction as the mechanism — SUPPORTED, and it is why this is not
   a coin flip.** The Senate deal was struck by **Collins (R) and Murray (D)**, the Appropriations
   leaders, and the reporting is explicit that its purpose was to fund the government **past the
   November 2026 midterms** — deferring the real fight to a lame-duck session when the election
   result shapes the full-year package. Neither party wants to own a shutdown weeks before an
   election, and the memory is fresh: the **2025 lapse ran ~43 days (2025-10-01 → 2025-11-12), the
   longest in US history**. A 90–6 Senate margin is the strongest bipartisan funding signal in years.
   **Honest limit on this leg:** it is a *political-incentive* argument, and this doc has no
   instrument that measures political incentives. It is stated as reasoning, not as a probability.

4. **It still isn't done, and 2026 has already shown a lapse can happen without a disagreement —
   MIXED, and this is the leg that keeps the tail alive.** The Conference Board's alert dated
   **2026-02-03** records a **partial shutdown over the weekend of Jan 30 – Feb 3, 2026**: the Senate
   passed funding on Friday **01-30**, and a lapse happened anyway **because the House did not
   reconvene until 02-02**. That is a shutdown caused by chamber scheduling, not by disagreement —
   precisely the failure mode available when two chambers have passed near-identical bills and one
   simply hasn't voted on the other's. **The specific mitigant:** 2026-09-30 is a **Wednesday**, so
   the January mechanism (a recess-weekend gap) does not repeat. The residual risks are the House's
   thin **220–205** margin, the fact that the Senate's version carries material the House has never
   voted on, and the tracker's own caution (fedtools, 2026-08-24) that a shutdown looks "less likely
   than it did in July" but "nothing is signed" and CRs have historically failed late.

5. **The equity reaction function is close to nil — MIXED (the during-shutdown figure is usable; the
   after figure is confounded and this doc corrects it).** Across **22 funding gaps since 1976**,
   more than half of the prior 21 produced **positive** S&P returns during the shutdown; the **median
   return during a shutdown is 0.0% since 1977 and +3.1% since 2010**, average +0.2% since 1976
   (JPM/CNBC/Yahoo compilations, 2025-10 to 2025-11). The sources go on to report a **median +18.9%**
   S&P return in the twelve months following a shutdown of ten days or more. **That second figure
   should not be used.** None of the sources compares it to the unconditional twelve-month equity
   drift, which is itself strongly positive; with n in the single digits for 10-day-plus shutdowns,
   and shutdowns clustering inside expansions, "+18.9% after" is very close to "equities go up."
   **The defensible claim is the during-shutdown one**: markets have historically treated a lapse as
   a non-event, and this doc leans on that and nothing further.

6. **The real channel is informational, and it is specific to this calendar — SUPPORTED, and it is
   why this event is filed `high` impact despite leg 5.** ISM is a private survey and publishes
   through a lapse; **BLS does not**. In the 2025 lapse the **October CPI was cancelled outright**,
   and October household-survey data for the Current Population Survey **was never collected and
   cannot be collected retroactively** — October 2025's unemployment rate will never be known
   (Richmond Fed "Phantom Figures"; Friends of BLS FAQ, 2025-11-12). Applied concretely to this
   calendar's own rows, a lapse beginning **2026-10-01** takes out **jobs 2026-10-02** and **CPI
   2026-10-14**, both BLS. It does **not** take out `consumer-confidence-2026-09-29` (private, and
   before the lapse anyway), `chicago-pmi-2026-09-30` (private, before), `jolts-2026-09-29` (federal
   but before), or `ism-manufacturing-2026-10-01` (private). **The compounding is the finding:** those
   two deletions feed the **2026-10-28 FOMC, which carries no SEP or dot plot**, under a chair who on
   **2026-08-28** formally abandoned forward guidance — "a discipline, not a decision" — while the
   market prices a live September hike at 46–59%. **No guidance, no dots, no data.** That is a
   condition this calendar has never had to read, and it is the reason to care about 09-30 at all.

7. **A plumbing channel nobody has banked: TIPS — SUPPORTED, primary-sourced.** Because the October
   2025 CPI did not exist, **Treasury invoked the index contingency provisions for Treasury
   Inflation-Protected Securities**, publishing a contingency index number of **325.604** for October
   2025 to compute payment obligations that reference it (treasury.gov press release **sb0324**).
   This is not a narrative effect — it is the reference index that TIPS principal accretes on being
   produced by a fallback formula instead of a survey. This calendar tracks a **10-Year TIPS auction
   on 2026-09-17** (and a 30Y TIPS sibling), both upstream of the deadline; a lapse would put their
   subsequent accrual under that regime. Flagged for the TIPS ledgers, not resolved here.

8. **Treasury supply is unaffected — SUPPORTED, and it bounds the damage.** Debt-management
   operations continued through the 2025 lapse; auctions are not appropriations-funded activity.
   The five tracked Treasury events in the surrounding quarter therefore survive a shutdown intact.
   The asymmetry is clean and worth stating plainly: **in a lapse, this calendar loses its federal
   statistics and keeps its private surveys and its Treasury supply.**

9. **Tracked-name exposure is indirect and thin — SUPPORTED, inherited.** `symbols: []`, and none of
   the nine tracked names is a federal contractor of consequence to its thesis; there is no direct
   revenue channel. Transmission is entirely via leg 6 — the rate path, through a Fed reading a
   sparser dataset. Ranking unchanged and not re-derived: **CRWV** most exposed (debt-financed
   buildout — policy uncertainty hits its cost of capital), then **NVDA / AVGO / MRVL**, then **MSFT
   / GOOG / META**, least **AAPL / AMZN**. The caution from 08-28 applies with force here: a Fed
   shock that session moved the 2-year **+8bp** while the S&P moved **−0.13% to −0.25%** and VIX
   *closed at a YTD low*. If this event transmits at all, it transmits in rates.

### What the conditions support

Nothing directional, and unusually clearly so: leg 5 says the tape has historically ignored exactly
this event, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, and `symbols: []`. What the
conditions support is a **preparation, not a position**: (a) treat the House floor vote in the first
week of September as the single resolving observation and stop watching everything else about this
event until it happens; (b) if 09-30 passes without a signature, switch the question from "what does
the shutdown do to prices" to "**what do we no longer know, and what will the market over-read
instead**" — the answer being the surviving private surveys; and (c) carry the leg-6 compounding into
the [`fomc-2026-10-28`](fomc-2026-10-28.md) read now, because that doc's premises change materially
in the lapse branch and it should not learn that on 10-27.

### Honest limits

**This doc cannot put a number on the probability**, and does not pretend to: leg 3 is a
political-incentive argument with no instrument behind it, and leg 4 is a live counterexample from
seven months ago. Congress's own primary sources were not fetched — the bill numbers, vote counts and
dates come from a funding tracker (last updated **2026-08-24**), an advocacy newsletter and House
committee press releases, cross-read against the sibling's Conference Board/CRFB sourcing from
**2026-08-12**; congress.gov itself was surfaced in search but not fetched, so H.R. 6500 / H.R. 9770
status is **press-grade, not primary**. Several key outlets (NBC, CNBC, Washington Post) returned
**403** on direct fetch, so their content reaches this doc through search summaries — a weaker
citation than a fetched page. The 2025 shutdown length is press-reported as **43 days** while
2025-10-01 → 2025-11-12 counts as 42 calendar days depending on inclusive counting; the discrepancy
is left on the record and nothing rests on it. Leg 5's base rates are compilations, the sample of
long shutdowns is tiny, and the correction applied there is this doc's reasoning rather than a
measurement — no instrument here can compute an unconditional-drift control. The **fastest-moving
fact in this document is the House schedule**, which may already have resolved before the next pulse
reads this line. Finally, leg 7's TIPS finding is sourced to a Treasury release about the 2025
episode; whether the same contingency mechanics would apply identically in 2026 is inferred from that
precedent, not confirmed for this cycle.

## Stance & kill switches

**Stance (date statutory, event conditional, entry filed `estimate` — legislative status press-grade
as of 2026-08-29).** Take **no position, no hedge and no sizing change** off this event. Base case
(**Medium** confidence, reasoning not measurement): the CR is enacted before 2026-09-30, because both
chambers have passed one and the remaining gap is a one-week expiry date rather than a policy
dispute, and because the deal was explicitly built to carry funding past the November midterms. The
tail is real and this doc refuses to call it dead: nothing is signed, the House margin is 220–205,
and 2026 already produced a lapse purely from a chamber's calendar. **The stance's actual content is
about the branch, not the odds:** if a lapse happens, the exposure to manage is the **loss of the
October payrolls and CPI** — permanent, per 2025 — feeding a **10-28 FOMC with no SEP** under a chair
who abandoned forward guidance on 08-28. That combination is what makes this `high` impact; the
equity tape through shutdowns is a measured non-event (median 0.0%) and is explicitly **not** the
reason to watch it.

**Kill switches:**

- **A CR signed before 2026-09-30** — this event retires; legs 4, 6, 7 collapse to a footnote, the
  10-02 and 10-14 prints read normally, and this doc closes out early rather than waiting for 09-30.
- **The House amends rather than concurs** — sending the CR back to the Senate late in September
  turns a scheduling question into a live one and re-opens leg 4 at the worst point in the calendar.
- **A lapse actually begins on 2026-10-01** — the base case is wrong; switch every downstream doc's
  premise from "the data prints" to "the data is gone," starting with
  [`jobs-2026-10-02`](jobs-2026-10-02.md), [`cpi-2026-10-14`](cpi-2026-10-14.md) and
  [`fomc-2026-10-28`](fomc-2026-10-28.md).
- **Warsh restores an explicit reaction function before 10-28** — removes one of the three blindfolds
  in leg 6, and the compounding argument (not the shutdown argument) loses most of its force.
- **The S&P moves >2% on a shutdown headline** — leg 5's "markets treat it as a non-event" base rate
  breaks in-sample, and the equity channel becomes worth measuring instead of dismissing.
- **BLS publishes a contingency plan that preserves October collection** — the permanence in leg 6 is
  what makes the blackout matter; a preserved survey would make a lapse a delay rather than a
  deletion, and would materially downgrade this event.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-32 | Initial research banked (above). **Status:** stays `estimate`, but for an unusual reason recorded here so a later session does not misread it — the **date is statutory** (FY2026 funds lapse at fiscal-year end) while the **event is conditional**; this is date-certainty with occurrence-doubt, the inverse of the calendar's usual estimate case, and it cannot be promoted from this lane regardless. **Legislative state (press-grade):** both chambers have already passed a CR — House **H.R. 9770**, clean, to **Dec 4**, 2026-07-21, **220–205**; Senate **H.R. 6500** to **Dec 11**, 2026-08-08, **90–6** (Collins–Murray deal, FY2026 levels, plus surface-transport extensions and an OMB grant-rule block). The remaining gap is a **one-week expiry date**, not a levels/riders fight. Underlying approps: all 12 FY27 bills out of House committee, **2 of 12** passed the full House, **Senate has advanced none** — a CR was always the only path. **The incentive is aligned with the mechanism:** the deal's stated purpose is funding past the **November 2026 midterms**, deferring the real fight to a lame duck. **The counterweight, and it is a 2026 datapoint not a historical one:** the Conference Board's **2026-02-03** alert records a **partial shutdown over Jan 30–Feb 3, 2026** that happened *despite* Senate passage, purely because the House had not reconvened — a lapse from scheduling, not disagreement. Mitigant: 09-30 is a **Wednesday**, so that specific mechanism does not repeat. Adjacency sweep — **peers:** n/a, `symbols: []`; MU's 09-29 print is the only tracked print in the corridor and carries no federal channel. **Macro surprises:** Warsh's 08-28 keynote abandoned forward guidance and drove September hike odds 35% → 46–59% (carried from the [`jackson-hole`](jackson-hole-2026-08-28.md) close-out, not re-derived) — it matters here because it is the **first** of the three blindfolds in leg 6. **Volatility regime:** VIX **14.51** (`event-material-scan` probe) — baseline set, nothing to diff against yet. **Event tape / base rates:** across **22 funding gaps since 1976**, more than half of the prior 21 saw positive S&P returns during the lapse; **median during-shutdown return 0.0% since 1977, +3.1% since 2010** (JPM/CNBC/Yahoo compilations). The widely-quoted **+18.9% median 12-month return after 10-day-plus shutdowns is NOT used** — no source controls it against unconditional equity drift and n is tiny; recorded as a rejected statistic, not a supporting one. **The material finding — what a lapse actually costs this calendar:** BLS data does not come back. In 2025 the **October CPI was cancelled outright** and October CPS household data **was never collected and cannot be retroactively** (Richmond Fed "Phantom Figures"; Friends of BLS FAQ 2025-11-12). So a lapse from 10-01 deletes **jobs 10-02** and **CPI 10-14** while `consumer-confidence-2026-09-29`, `chicago-pmi-2026-09-30`, `jolts-2026-09-29` (all pre-lapse) and `ism-manufacturing-2026-10-01` (private) survive — feeding a **10-28 FOMC with no SEP**. **New primary finding not previously on this calendar:** because October 2025 CPI did not exist, **Treasury invoked TIPS index contingency provisions**, publishing a contingency index of **325.604** (treasury.gov **sb0324**) — a plumbing exposure for the tracked **10Y TIPS 09-17** and its 30Y sibling, flagged to those ledgers. **Also established:** Treasury auctions continued through the 2025 lapse, so the five tracked Treasury events survive it — in a lapse this calendar loses its federal statistics and keeps its private surveys and its supply. **New dated adjacency found → proposed in this PR:** the **2026-11-03 midterm elections** are not on the calendar at all despite being the explicit reason the CR runs to December; added as `midterm-elections-2026-11-03`, `status: estimate` (`NEWS:`). Also noted, not proposed: the CR's own expiry is a second dated checkpoint at **Dec 4 or Dec 11** — un-proposable until the chambers reconcile which. | — (stance set) | 2026-09-05 (high, ≥21d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
