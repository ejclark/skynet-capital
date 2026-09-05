# Advance Economic Indicators Report (Aug 2026 data) — advance-economic-indicators-2026-09-30

**Kind:** macro-print · **Date:** 2026-09-30 (estimate, CENSUS: `economic-indicators/calendar-listview.html` row "Advance Economic Indicators Report (International Trade, Retail, & Wholesale) | September 30, 2026 | 8:30 AM | August 2026", fetched direct 2026-09-05; corroborated by the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx` 2026-09-30 08:30 row, and by the July edition itself — CB26-141, "The August 2026 Advance report is scheduled for release on September 30, 2026". Filed estimate per this lane's no-self-confirm limit) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:8+","adjacentIds":["adp-employment-2026-09-30","apple-eu-dma-terms-2026-10-01","chicago-pmi-2026-09-30","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","ism-services-2026-10-05","jobs-2026-10-02","jolts-2026-09-29","opec-jmmc-68th-2026-10-04","pce-2026-09-30","sp-select-sector-secondary-reweight-2026-09-30","treasury-coupon-announcement-2026-10-01","umich-sentiment-final-2026-09-25","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The sibling ledger [`advance-economic-indicators-2026-10-28`](advance-economic-indicators-2026-10-28.md)
put its central finding on trial here, and this session's job was to check the trial is fair. It is —
the verdict is readable on 09-30 despite the crowded slot, and the finding is very likely to survive.**
That ledger measured this report to be the Atlanta Fed's most composition-moving release and named one
dated kill switch: if the **2026-09-30** edition moves GDPNow's Q3 net-exports contribution by **less than
0.10pp**, the whole finding demotes to an ordinary macro print. The worry was contamination — GDPNow's own
posted schedule bundles four releases into that 08:30 vintage (Q2 GDP third estimate, personal income and
outlays, NIPA detail tables, and this report), so an observed move might not be *this* report's. Measured
against 1,822 vintage deltas: it is. The 61 historical vintages that carry **GDP + personal income but no
AEIR** move net exports by a median **0.031pp, and 72.1% of them land under the 0.10pp threshold** — the
co-releases are trade-line noise, not signal. The 13 vintages with the exact 09-30 shape move it **0.268pp**,
statistically indistinguishable from the 56 AEIR-alone vintages (0.249pp). So the kill switch fires on its
own merits or not at all, and the base rate says not: **75.3% of AEIR vintages clear 0.10pp**. One thing
does NOT transfer, and it is the correction this ledger contributes: the sibling's **down**-skew is an
AEIR-alone property. On the 09-30 shape the headline nowcast went **up** in 9 of 13 cases (median
**+0.193pp** against −0.178pp alone) — the GDP/personal-income half of the slot pushes back. Direction on
09-30 is a coin flip and we register no call on it. Date is **estimate**; `symbols: []`; nothing here
licenses an entry and there is no instrument to enter.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-25) | **Stand aside** | High | `symbols: []`, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, and no August-reference-month consensus exists at D-25. There is no instrument attached to this event. | A macro-keyed playbook appearing in `docs/plans/trade-playbooks.md` before **2026-09-25** — none exists today |
| This week | **Stand aside — nothing between now and 09-30 changes the read** | High | The next Q3-relevant inputs are wholesale trade 09-10, retail sales 09-16 and M3-1 09-25; none is a trade release, and the trade line is what this event owns. GDPNow Q3 sits at **4.749%** (09-03 vintage). | GDPNow posting an unscheduled Q3 trade-line revision before **2026-09-30**, which would mean a release outside the posted schedule moved the line this event is measured on |
| This month | **Read the 09-30 print for the net-exports move; the sibling kill switch almost certainly does not fire** | Medium | 75.3% of 81 AEIR vintages move net exports ≥0.10pp, and the co-release contamination is a median 0.031pp. Registered as `FT-advance-economic-indicators-2026-09-30-1`. | The **2026-09-30** GDPNow vintage moving the Q3 net-exports contribution by **<0.10pp** — which fires the sibling's kill switch and demotes both ledgers' central claim |
| This quarter | **The number lands 09-30; the meaning lands 10-06 — never trade either** | Medium | The advance report carries ~4× the trade information of the full FT-900 (median \|Δnet exports\| **0.265pp vs 0.062pp**), but only the full report names the end-use split, and in July that split *was* the story: capital-goods imports +$14.4B m/m = computers +$6.9B, accessories +$6.6B, semis +$1.2B. `intl-trade-full-report-2026-10-06` is proposed in this PR. | The **2026-10-06** FT-900 revising July's capital-goods import rise below **+$10B**, or attributing under half of it to computers/accessories/semiconductors — which would break the AI-hardware reading of this whole series |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never initiate on this print.** `symbols: []`, no macro-keyed playbook, and 2026-09-30 is a
  **quarter-end** session whose variance is measurably back-loaded: SPY's 09:30–12:00 window makes a median
  **55.5%** of the session range across 11 quarter-ends vs **80.1%** on 710 ordinary sessions, with 8 of 11
  under 65% against a 26.8% baseline rate. Registered as `FT-advance-economic-indicators-2026-09-30-3`.
- **The number to read first — the advance goods trade balance.** July printed **$118.8B** (exports $199.4B,
  imports $318.2B). The base case for August is a modest *narrowing*: after each of the 7 months since 2021
  where the goods deficit widened ≥$15B, the next month narrowed **5 of 7 times**, by a median **$4.3B** —
  a 19% giveback, not a reversal. Registered as `FT-advance-economic-indicators-2026-09-30-2`.
- **Do not expect a direction on the headline nowcast.** The sibling's 20-of-26 down-skew is measured on
  AEIR-*alone* vintages. On the 09-30 four-release shape the headline rose in 9 of 13. We register no
  directional call, and a low-confidence direction is a stand-aside, never a small bet.
- **Read the inventories lines second** — wholesale $959.1B (+1.3% m/m, +5.7% y/y) and retail $838.5B
  (+0.7% m/m, +3.8% y/y) in July. Inventories are the lowest-quality line in the advance GDP estimate the
  next quarter turns on, and this report sets them.
- **The existence risk is closed for this edition and still open for December.** H.R. 6500 (PL 119-103,
  signed 2026-09-02) funds through **2026-12-11**, so `government-funding-deadline-2026-09-30` is resolved-
  averted and no lapse touches 09-30. This series *deletes* editions rather than delaying them — the
  January- and February-2026 reference months read `Suspended` on the Census calendar to this day — which
  is what makes `advance-economic-indicators-2026-12-28` the exposed one, not this.
- **Watch (dated)** — wholesale trade **09-10** · retail sales + inventories **09-16** · advance durable
  goods **09-25** · **this print 09-30** 08:30, sharing the slot with Q2 GDP third estimate + PCE + ADP,
  then Chicago PMI 09:45 and the S&P select-sector reweight into the close · ISM mfg **10-01** ·
  jobs **10-02** · **full FT-900 10-06** (proposed here) · successor **10-28** · **CR expiry 12-11** ·
  exposed **12-28** edition.

## Initial research

### The question, plainly

Does the August-2026 Advance Economic Indicators Report exist on 2026-09-30, and — since a sibling ledger
has already staked its central claim on this exact edition — **is the test it set actually readable**, given
that GDPNow bundles this report with three other releases in one 08:30 vintage?

**One-line verdict:** the report exists on three primaries, the test is readable because the co-releases
move the trade line by a median 0.031pp against this report's 0.268pp, the kill switch is unlikely to fire
(75.3% base rate against it) — and the one thing that does *not* survive the transfer is the sibling's
directional skew, which is a property of AEIR-alone vintages and reverses on this one's shape.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target. Six inputs,
all fetched direct on 2026-09-05:

1. **`census.gov/economic-indicators/calendar-listview.html`** — the release grid, parsed row-wise for date,
   time, reference month and the `Suspended` rows.
2. **The July-2026 advance report itself** (`census.gov/econ/indicators/advance_report.pdf`, CB26-141), text
   layer extracted locally — including its own next-release line.
3. **The July-2026 full FT-900** (`census.gov/foreign-trade/Press-Release/current_press_release/ft900.pdf`,
   CB 26-142 / BEA 26-40, released 2026-09-03), text layer extracted locally — the end-use detail and the
   revision against the advance figure.
4. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed) — the posted schedule mapping every GDPNow update to
   the releases that trigger it. The 2026-09-30 08:30 row is the four-release bundle this ledger turns on.
5. **`GDPTrackingModelDataAndForecasts.xlsx`** (Atlanta Fed, 10.9MB) — `ContribArchives` gives **1,871 model
   vintages 2014-05-01 → 2026-07-28**, each stamped with the release that produced it, yielding **1,822
   same-quarter deltas**; `ContribHistory` gives the live Q3-2026 series through the 09-03 vintage. Every
   churn and delta number below is computed from those vintages, not quoted from the sibling ledger.
6. **Yahoo hourly bars, 721 sessions (2023-10-09 → 2026-09-04), SPY and QQQ**, bucketed to ET regular hours
   and split at 12:00 — plus FRED `BOPGTB` (Census-basis monthly goods balance, 1992-01 → 2026-07) for the
   month-over-month base rate.

### Leg 1 — the report exists on 2026-09-30 · **SUPPORTED**, on three primaries

Census lists the slot at 8:30 AM for August 2026 data (internal id `A202609300830`, reference period
`A202608`). The Atlanta Fed independently schedules a GDPNow posting for that morning naming it. And the
**July edition names its own successor**: CB26-141's closing paragraph reads "The August 2026 Advance report
is scheduled for release on September 30, 2026," and its summary box repeats "Next release: September 30,
2026." A release series naming its own next date is the strongest form this evidence takes.

The funding branch that shadows this whole series is **closed for this edition**. H.R. 6500 was signed
2026-09-02 as PL 119-103, funding through 2026-12-11 — `government-funding-deadline-2026-09-30` is a
resolved-averted entry, and its own D-25 pulse says so in terms. This matters because the failure mode here
is deletion, not delay: the January- and February-2026 reference months read `Suspended` on the Census
calendar and were never published. Nothing threatens 09-30; `advance-economic-indicators-2026-12-28` sits 17
days past the CR expiry and is the exposed edition.

Status stays **estimate** per this lane's no-self-confirm limit, despite three primaries. Understating the
label only widens caution.

### Leg 2 — the crowded 08:30 slot makes the sibling's kill switch unreadable · **REFUTED**

This is the leg the event was filed for. The Atlanta Fed's posted schedule row for 2026-09-30 08:30 reads,
verbatim: `GDP (Q2 3rd estimate), Personal income and outlays, NIPA underlying detail tables, Advance
Economic Indicators`. Four releases, one vintage — so a naive read cannot attribute the move. The archive
resolves it, because that co-release combination has 61 historical instances **without** an AEIR attached:

| Vintage class | n | Median churn | Median \|Δ net exports\| | Median \|Δ nowcast\| | P(\|Δ net exports\| < 0.10pp) |
|---|---|---|---|---|---|
| **Non-AEIR carrying GDP + personal income** (the contamination control) | 61 | 0.301pp | **0.031pp** | 0.308pp | **72.1%** |
| AEIR + GDP + personal income (**the exact 09-30 shape**) | 13 | 0.673pp | **0.268pp** | 0.561pp | 23.1% |
| AEIR with no GDP and no personal income | 56 | 0.556pp | 0.249pp | 0.359pp | 25.0% |
| All AEIR vintages | 81 | 0.584pp | 0.265pp | 0.366pp | 24.7% |
| Every other vintage | 1,741 | 0.048pp | 0.002pp | 0.086pp | — |

Churn = |Δequipment| + |Δnet exports| + |Δinventories| in contribution points, versus the immediately
preceding vintage of the same quarter. Read the first two rows together: the GDP-third-estimate and
personal-income releases **do** move the nowcast (median |Δ headline| 0.308pp — they are not inert), but
they move the **trade line** by a median 0.031pp, an order of magnitude below the AEIR's 0.268pp, and
they land under the 0.10pp kill-switch threshold nearly three times in four. The net-exports channel is
this report's alone; the co-releases arrive through consumption and the level base.

So the sibling ledger's kill switch is measurable on 09-30 as written. The residual is worth stating
precisely rather than waving away: an observed move of, say, 0.12pp carries roughly 0.03pp of co-release
noise, so a reading *just* over the threshold should be treated as ambiguous rather than as a pass.

**Note on a number that differs from the sibling ledger by construction, not by contradiction.** That doc
reports an "AEIR alone on the day" control of n=39; this one reports n=56 for "AEIR with no GDP and no
personal income." Different control definitions on the same archive — the stricter one excludes every
co-release (durable goods, M3-1, new-home sales), the looser one excludes only the two that could plausibly
touch the trade line. Both give the same answer to the question each was asked.

### Leg 3 — the sibling's downward skew transfers to this edition · **REFUTED**, and this is the correction

`FT-advance-economic-indicators-2026-10-28-1` predicts the 10-28 nowcast prints below its predecessor, on
20-of-26 among *final* AEIR vintages. Reproduced and extended here:

| Class | n | Nowcast revised down | Median Δ nowcast | One-sided binomial p |
|---|---|---|---|---|
| AEIR, final vintage of its quarter | 26 | 20 (77%) | −0.195pp | 0.0047 |
| AEIR, non-final vintage (**09-30's class**) | 55 | 37 (67%) | −0.145pp | 0.0072 |
| AEIR with no GDP and no personal income | 56 | 42 (75%) | −0.178pp | 0.0001 |
| **AEIR + GDP + personal income (the 09-30 shape)** | **13** | **4 (31%)** | **+0.193pp** | 0.954 |

The 26-vintage final-vintage figure reproduces the sibling's exactly, which is the internal validity check
on this whole re-derivation. But the skew is not a property of the *report* — it is a property of the report
arriving **alone**. Add the GDP third estimate and personal income to the same vintage and the sign flips:
9 of 13 went up, median +0.193pp. n=13 is small and 4/13 is not itself significant (two-sided p=0.267), so
the honest claim is the null one: **on this vintage shape, direction is a coin flip, and the sibling's
directional prediction must not be carried across to 09-30.** This ledger registers no directional test on
the headline — a low-confidence direction is a stand-aside, not a small bet.

The seven September editions in the archive (all non-final, all co-released) bear this out individually:
Δ net exports of +0.149, −0.484, +0.002, −0.243, +0.087, +1.027 and +0.387pp — two of seven under the
0.10pp threshold, and no consistent sign.

### Leg 4 — the advance report is the trade information; the full FT-900 is a rounding correction · **SUPPORTED**

The full report follows the advance by about a week. Across the archive it barely moves the line the advance
already moved:

| Release class | n | Median \|Δ net exports\| | Median \|Δ nowcast\| |
|---|---|---|---|
| Advance Economic Indicators | 81 | **0.265pp** | 0.366pp |
| International trade, full report (no AEIR) | 129 | **0.065pp** | 0.134pp |

Pairing each AEIR vintage with the next full-report vintage in the same quarter (n=45): the follow-up move
is a median **0.28×** the size of the advance move, and its **sign agrees only 51% of the time** — a coin
flip. The full report does not confirm or refute the advance; it nudges it.

The current quarter is a live instance. July advance (08-27) put the goods deficit at **$118.8B**; the full
FT-900 (09-03) put it at **$119.6B** — a $0.8B, 0.7% revision. On the model, the AEIR moved Q3 net exports
−0.142 → **−1.312pp** and the full report carried it to **−1.456pp**: same direction, a further 12%.

**What the full report adds is the attribution, and that is the part that matters to this book.** The
advance report carries no end-use split. The FT-900 does, and July's reads: capital-goods imports
**+$14.4B m/m**, of which **computers +$6.9B, computer accessories +$6.6B, semiconductors +$1.2B** — the
three named lines account for the entire rise. That is the AI-hardware buildout passing through customs,
itemized. It is why `intl-trade-full-report-2026-10-06` is proposed in this PR at `impact: low` — low
*market* impact, high information value, and the distinction is the finding.

### Leg 5 — the 09-30 session is a place to act on an 08:30 print · **REFUTED**

The sibling closed its tradeability question on FOMC decision-day back-loading. 09-30 is not a decision day,
so the argument has to be re-derived, and a different mechanism gives the same answer: 2026-09-30 is the
**last session of Q3**, and quarter-end sessions are back-loaded by rebalancing flow into the close.

| SPY (hourly bars, 721 sessions 2023-10-09 → 2026-09-04) | Morning share of session range | Full range | \|morning ret\| | \|afternoon ret\| | Final-hour share of range |
|---|---|---|---|---|---|
| Quarter-end (11) | **55.5%** (p25 43.1%) | 0.962% | 0.311% | **0.374%** | **35.6%** |
| All other sessions (710) | **80.1%** (p25 64.2%) | 0.856% | 0.296% | 0.215% | 27.6% |

QQQ reproduces the direction (68.1% vs 85.0%). **8 of 11 quarter-ends put SPY's morning share under 65%,
against a 26.8% base rate on ordinary sessions**, and the two September quarter-ends in the window are the
clearest cases (2024-09-30: 33%; 2025-09-30: 48%). Like decision day, quarter-end is a *wide* session whose
width is not in the morning — and 2026-09-30 adds `sp-select-sector-secondary-reweight-2026-09-30` to the
close. An 08:30 macro release is what that session waits through.

The slot itself compounds the point: at 08:30 the AEIR shares the tape with **PCE** (`impact: high`), the
Q2 GDP third estimate and ADP employment, with Chicago PMI at 09:45. On any reasonable ranking it is the
least market-relevant item in its own time slot.

### Leg 6 — August repeats July's import surge · **MIXED**, with a measured base case

There is no August consensus at D-25 and there will not be one before release week, so this is a base-rate
question rather than a forecast. FRED's Census-basis goods balance (`BOPGTB`, 1992-01 → 2026-07) has **7**
months where the deficit widened by ≥$15B in one month — all of them since 2021-11, which is itself a
statement about the tariff era. The next month **narrowed in 5 of 7**, by a median **$4.3B**, giving back a
median **19%** of the widening. July's widening was $17.6B. So the base case for the 09-30 print is a goods
deficit modestly narrower than $118.8B, not a mean-reversion to the spring's ~$85B and not a repeat surge.

Graded MIXED because the mechanism cuts the other way and is not measurable from here. The July surge was
not diffuse — it was computers and computer accessories, i.e. datacenter hardware on a multi-quarter
buildout, not a one-month inventory pull. A buildout does not mean-revert on schedule. The base rate and the
mechanism disagree, and this ledger reports both rather than picking the one it likes.

### What the conditions support

Nothing to open. The output is one discharged methodological question (the sibling's kill switch is
readable), one correction to a neighbouring ledger (its down-skew must not be carried across), three
registered predictions, and one calendar proposal.

### Honest limits

- **All of this measures a model, not a market.** Every churn number describes the Atlanta Fed's nowcast.
  This doc makes no claim about price and registers no price-based test except the quarter-end session shape,
  which is measured on SPY/QQQ directly and is a reason *not* to act.
- **n=13 on the headline-direction reversal.** It is enough to refuse the sibling's directional transfer and
  not enough to assert the opposite. That asymmetry is deliberate: refusing a call needs less evidence than
  making one.
- **n=11 on quarter-end sessions.** Two years of hourly data is all Yahoo serves. The 8-of-11 result is
  strong for its size and thin in absolute terms; it is a stand-aside argument, which is the direction in
  which a thin sample is safe.
- **The contamination control is a class average, not this vintage.** 0.031pp is the median co-release move
  across 61 instances; a particular Q2 third estimate carrying a large revision could exceed it. That is why
  a 09-30 reading just over 0.10pp is called ambiguous above rather than a pass.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it.

## Stance & kill switches

**Stance (date is `estimate`).** Stand aside on 2026-09-30 and on every edition of this report. Read the
09-30 print for one number — GDPNow's Q3 net-exports contribution move — because the sibling ledger's
central claim is on trial there and the trial is fair: the co-releases in that 08:30 vintage move the trade
line by a median 0.031pp against this report's 0.268pp. Expect the kill switch **not** to fire (75.3% base
rate). Expect **no** direction on the headline: the sibling's down-skew is an AEIR-alone property that
reverses on this vintage's shape. Read the goods deficit against a base case of a modest narrowing from
July's $118.8B, and wait for the **10-06** FT-900 for the end-use split that is the only part of this series
with a channel into the names this book holds. Treat the 08:30 slot as inert: quarter-end variance lives
after 12:00 and mostly in the final hour. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-09-30 vintage moves GDPNow's Q3 net-exports contribution by <0.10pp.** This is the sibling's
  own kill switch, inherited verbatim; firing it demotes both ledgers' central claim to an ordinary macro
  print and forces Leg 2 of `advance-economic-indicators-2026-10-28` to be re-derived rather than patched.
- **The 2026-09-30 vintage's non-trade lines (PCE, inventories, equipment) move more than the trade line.**
  That would say the four-release bundle, not this report, owns the vintage — refuting Leg 2's attribution
  and making every future September edition unreadable for this purpose.
- **The 2026-10-06 FT-900 revises July's capital-goods import rise below +$10B, or attributes under half of
  it to computers/accessories/semiconductors.** That breaks the AI-hardware reading of the series and with
  it the only reason this event touches the book's narrative at all.
- **Census moves or suspends the 2026-09-30 slot on its own calendar page.** Suspension, not delay, is this
  series' demonstrated failure mode — a `Suspended` row ends this ledger rather than rescheduling it.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-09-25.** The
  stand-aside is partly an absence-of-instrument argument; a macro-keyed playbook makes it a live question.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-advance-economic-indicators-2026-09-30-1` — the 2026-09-30 GDPNow vintage moves the Q3 net-exports
  contribution by **≥0.10pp**. Score by 2026-09-30.
- `FT-advance-economic-indicators-2026-09-30-2` — the August advance goods deficit prints **narrower** than
  the July figure carried in the same release. Score by 2026-09-30.
- `FT-advance-economic-indicators-2026-09-30-3` — SPY's 2026-09-30 09:30–12:00 ET range is **below 65%** of
  that session's full 09:30–16:00 range. Score by 2026-09-30.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-25 | **Initial research. The sibling ledger's kill switch was checked for readability on this date and found readable; its directional prediction was checked for transferability and found NOT transferable.** Date confirmed on three primaries fetched today: Census `calendar-listview.html` ("September 30, 2026 \| 8:30 AM \| August 2026", id `A202609300830`), the Atlanta Fed's `GDPNowcastDataReleaseDates.xlsx`, and the July release itself (CB26-141: "The August 2026 Advance report is scheduled for release on September 30, 2026"). Status stays `estimate` (no self-confirm). **The contamination question, settled:** GDPNow's 09-30 08:30 row bundles `GDP (Q2 3rd estimate), Personal income and outlays, NIPA underlying detail tables, Advance Economic Indicators`. From 1,822 vintage deltas (`ContribArchives`, 2014-05-01 → 2026-07-28, fetched direct), the 61 non-AEIR vintages carrying GDP + personal income move net exports a median **0.031pp** and land under 0.10pp **72.1%** of the time, against **0.268pp** for the 13 vintages of the exact 09-30 shape and 0.249pp for the 56 AEIR-alone ones. The co-releases move the headline (0.308pp) but not the trade line — the kill switch reads clean, with ~0.03pp of residual noise. **The correction:** the sibling's 20/26 down-skew reproduces exactly on final vintages (median −0.195pp, p=0.0047) and holds on non-final ones (37/55, p=0.0072), but **reverses on the 09-30 shape — 4 of 13 down, median +0.193pp**. Direction is a coin flip here; no directional test registered. **New leg — the advance report IS the trade information:** median \|Δ net exports\| **0.265pp (AEIR, n=81) vs 0.065pp (full FT-900, n=129)**, and across 45 AEIR→full-report pairs the follow-up is a median **0.28×** the size with **51%** sign agreement. Live instance: July advance goods deficit **$118.8B** (08-27) revised to **$119.6B** (09-03), +0.7%; on the model −0.142 → **−1.312** → **−1.456pp**. **What the full report adds is attribution:** FT-900 CB 26-142 gives July capital-goods imports **+$14.4B m/m** = computers **+$6.9B** + accessories **+$6.6B** + semis **+$1.2B**, the entire rise. **Session leg re-derived for a non-FOMC date:** 09-30 is quarter-end; across 11 quarter-ends in 721 hourly sessions SPY's morning share is **55.5% vs 80.1%** baseline with **8/11 under 65%** against a 26.8% base rate (QQQ 68.1% vs 85.0%), final-hour range share 35.6% vs 27.6% — back-loaded by rebalancing flow, and the slot also carries PCE, Q2 GDP third and ADP at 08:30 plus Chicago PMI at 09:45. **Content base case:** FRED `BOPGTB` 1992-01 → 2026-07 has 7 months with a ≥$15B one-month widening (all since 2021-11); the next month narrowed **5/7**, median **+$4.3B**, a 19% giveback — so a modestly narrower August deficit, against a mechanism (datacenter hardware, not inventory pull) that argues the other way. Graded MIXED. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** GDPNow Q3 **4.749%** (09-03 vintage, after full trade + ISM services); no CPI/FOMC/jobs print between today and 09-30 that touches the trade line. **Volatility:** VIX **14.53** (2026-09-04 close, range 13.80–14.58) — baseline reading, nothing to diff against yet. **Geopolitical:** `government-funding-deadline-2026-09-30` is resolved-averted (PL 119-103, signed 2026-09-02, funds through 12-11), so this edition carries no publication risk; the `Suspended` precedent (Jan/Feb 2026 reference months, never published) applies to `advance-economic-indicators-2026-12-28`, not here. **Event tape:** no August-reference consensus exists at D-25. **One dated event proposed in this PR:** `intl-trade-full-report-2026-10-06` (EST: the FT-900's own "Next release: Tuesday, October 6, 2026" + the Atlanta Fed schedule row). **Three forward tests registered:** `-1` (net-exports move ≥0.10pp), `-2` (August goods deficit narrows), `-3` (SPY morning range <65% of session), all score-by 2026-09-30. | **Initial stance set: stand aside; read the net-exports move as the sibling's trial, expect no direction, wait for 10-06 for attribution.** | 2026-09-12 (medium, 8+ band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
