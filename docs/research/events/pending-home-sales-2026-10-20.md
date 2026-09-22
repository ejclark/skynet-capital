# Pending Home Sales Index (NAR, September 2026 data) — pending-home-sales-2026-10-20

**Kind:** macro-print · **Date:** 2026-10-20 (**confirmed**, `IR:` NAR's own 2026 Statistical News Release Schedule — nar.realtor/press-releases/nar-statistical-news-release-schedule and its .docx twin published 2025-11, both fetched direct 2026-09-08, "Tue., Oct. 20 | September Pending Home Sales Index"; promoted this session from the `EST:` proposal) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.6,"daysBand":"low:15+","adjacentIds":["ecb-quiet-period-start-2026-10-21","empire-state-mfg-2026-10-15","fomc-blackout-start-2026-10-17","g20-fmcbg-bangkok-2026-10-15","housing-starts-2026-10-20","import-export-prices-2026-10-16","industrial-production-2026-10-16","mtis-2026-10-15","nahb-hmi-2026-10-19","norway-gpfg-ethics-committee-2026-10-15","opex-2026-10-16","ppi-2026-10-15","retail-sales-2026-10-15","tic-monthly-2026-10-16","treasury-20y-bond-2026-10-21","treasury-5y-tips-2026-10-22","treasury-buyback-10y20y-2026-10-15","treasury-buyback-tips-1y10y-2026-10-21","treasury-coupon-announcement-2026-10-15","treasury-coupon-announcement-2026-10-22","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0,"blocked":[{"url":"https://www.spglobal.com/spdji/en/index-announcements/","status":"403","at":"2026-09-08"},{"url":"https://www.spglobal.com/spdji/en/indices/indicators/sp-corelogic-case-shiller-us-national-home-price-nsa-index/","status":"403","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside on every horizon — and the most valuable thing this session did was catch
itself running the exact statistical error this ledger exists to prevent.** The date promotes to
**`confirmed`**: NAR's forward schedule and its .docx twin both read "Tue., Oct. 20 | September Pending
Home Sales Index", and the 2026 execution record — re-derived independently this session from NAR's own
sitemap and `<time>` elements rather than inherited — is **2 for 2 to the exact day and hour**. This
edition **inverts** its August sibling on both axes that matter. PHSI counts contracts *signed*, so where
the 09-17 print's August data predated the 2026-09-16 decision entirely, **September is the first
reference month that sits wholly after it** — the first edition that *can* carry a policy reaction. And
where 09-17 was FOMC+1 on a witching eve, 10-20 sits **inside the October blackout** (decision 10-28, six
sessions out) and two sessions after opex — close to the quietest Fed window a print can occupy. Then the
correction. Testing ITB's session range at the pre-decision lag 10-20 actually occupies returns
**2.074% vs 1.836%, p=0.019** — a publishable-looking "blackout widening." It is **not there**: that is 2
of 12 nominal hits across lags −1…−12 where 0.6 is expected, it dies under Bonferroni (0.0042), the two
hits are **non-adjacent** with lag −5 null between them, **XHB produces zero hits across all twelve**, and
SPY's two hits sit at different lags in the *opposite* direction. The honest aggregate is the window
itself: the blackout slot (−5…−8) reads **1.844% vs 1.830%, p=0.684 — null**. Two other inheritances also
fail to transfer: the builder-earnings collision is **historically strongest on this exact slot** (NVR
filed within ±1 day of Oct 20 in **7 of 14** years) but has **drifted off it since 2022**, with NVR's
FY2026 lag pointing at ~10-22/23; and the "post-peak mortgage rate" story that would make this a recovery
print is **false on Freddie Mac's own tape** — September opened at **6.71%**, the highest weekly reading of
2026, above the July average NAR itself called the year's peak. `confirmed` licenses nothing:
`symbols: []`, and no house playbook is macro- or housing-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-42) | **Stand aside** | High | `symbols: []` and no instrument attaches. A re-run grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing-keyed hits today, and the 12-17 lane's direct test of this release class found the print's own 10:00–11:00 hour indistinguishable from an ordinary hour on ITB (**33.9% vs 35.3%** of session range, 723 sessions, p=**0.79**). | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-10-20** — none exists today |
| This week | **Stand aside — nothing about this event is live at D-42** | High | The print is six weeks out, `symbols: []`, and the corridor this week belongs to other ledgers entirely. The next scheduled look is **2026-10-08** on the `low:15+` band. | NAR moving the September-data release off 10-20 on its own schedule page before **2026-09-15**, which would make the date live rather than settled |
| This month | **Do not price a "blackout widening" into 10-20 — the effect that appears at its exact lag is a multiple-comparisons artifact** | High | ITB lag −6 reads 2.074% vs 1.836% (p=**0.019**) but it is 2 of 12 nominal hits (0.6 expected), fails Bonferroni **0.0042**, is **non-adjacent** to the other hit with lag −5 null between, and **XHB replicates none of it** (0/12, min p=0.089). The aggregate window is null: −5…−8 reads **1.844% vs 1.830%, p=0.684**, n=404. | A re-run of this lag family after **2026-10-20** in which the blackout window (−5…−8), not a single lag, clears p<0.05 on **both** ITB and XHB — which would mean the aggregate effect is real and this call refused a true signal |
| This quarter | **Do not read the September number as the market's verdict on the September cut — the rate the buyer faced went up, not down** | Medium | Freddie Mac's PMMS 30-year averaged **6.542%** in July (the month NAR's chief economist called "the highest mortgage rates of the year"), **6.667%** in August, and printed **6.71% on 2026-09-03** — 2026's high. Medium, not high, because only one September print exists at registration and a post-decision fall could still pull the month's average down. Registered as `-3`. | A September 2026 PMMS 30-year monthly average printing **at or below 6.542%**, scored 2026-10-02 |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []`, no instrument attaches, and no
  macro- or housing-keyed house playbook exists. Research is not action.
- **The tape leg produced nothing registrable, and that is the finding.** The exact 2026-10-20 shape
  (October opex+2 *and* inside the blackout, n=8) ran **6 of 8** under ITB's baseline p75 — which *is*
  the 75% base rate. There is no edge here to bet on in either direction.
- **Attribute nothing on 10-20 to this print.** NAHB HMI lands **10-19**, and **housing starts at 08:30
  on 10-20**, ninety minutes ahead of it — the same 08:30-before-10:00 pairing 09-17 carried.
- **Do not import the 09-17 ledger's FOMC+1 framing.** That is a decision*-plus-one* result; 10-20 is
  six sessions *before* a decision, inside the blackout, and the blackout window measures null.
- **Watch for the builder cluster landing after, not on, the print** — NVR and PHM ~**10-22/23**, DHI's
  fiscal-year report ~**10-28**. An NVR filing on 10-19/10-20 would mean the collision fired (`-2`).
- **Do not read "confirmed" as licence.** The date is the publisher's own; the call is unchanged.
- **Watch (dated)** — August-data PHSI **09-17** (scores the sibling's date test, and this entry's
  label with it) · existing-home sales **10-13** · CPI **10-14** · opex **10-16** · blackout start
  **10-17** · NAHB HMI **10-19** · **10-20 08:30 housing starts, 10:00 PHSI** · NVR/PHM Q3
  ~**10-22/23** · FOMC decision **10-28** · Case-Shiller **10-27** (proposed this session) · October
  data **11-18** · November data **12-17**.

## Initial research

### The question, plainly

This event reached the calendar as an `EST:` proposal filed 2026-09-08 by the
[`pending-home-sales-2026-09-17`](pending-home-sales-2026-09-17.md) initial-research sweep, in the same
NAR fetch that promoted *that* event to `confirmed`. It is the next edition of a series with two sibling
ledgers already on the shelf, and it arrives carrying their conclusions as inheritances. **Does NAR's own
calendar carry 2026-10-20; and which of the sibling findings — a session-shape effect, a builder-earnings
collision, a mortgage-rate narrative — actually apply to *this* edition rather than to the one that
measured them?**

**One-line verdict:** the date is the publisher's own and promotes to `confirmed`; this edition inverts
its sibling on both the reference month (September signings are the first wholly post-decision) and the
session shape (blackout, not FOMC+1); **none of the three inheritances survives**, and the session-shape
leg failed in the most instructive way — the effect that shows up at 10-20's exact lag is a
multiple-comparisons artifact this ledger caught only by testing the whole family.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies to the event itself; the instrument caches were
busted anyway (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because the
builder-earnings leg uses `market-data.mjs`'s SEC EDGAR path and the tape legs re-fetch daily bars. Six
inputs, all fetched direct on 2026-09-08:

1. **NAR's 2026 Statistical News Release Schedule** — `/press-releases/…` (HTTP 200, **483,177 bytes**)
   and its `.docx` twin published 2025-11 (HTTP 200, **55,384 bytes**), parsed row by row.
2. **NAR's Pending Home Sales statistics page** — HTTP 200, **565,623 bytes**.
3. **NAR's own newsroom releases**, harvested from `sitemap.xml` (six paged sitemaps, all HTTP 200) and
   read for their `<time>` elements — the execution record, re-derived rather than inherited.
4. **SEC EDGAR 8-K Item 2.02 filing dates** for DHI, NVR, PHM, LEN, KBH and TOL via `market-data.mjs`.
5. **Freddie Mac PMMS history** — `freddiemac.com/pmms/docs/PMMS_history.csv`, HTTP 200, **97,376 bytes**.
6. **Daily OHLC bars** for ITB, XHB, SPY and `^VIX` (Yahoo), 2014-01-01 → 2026-09-08, against **103**
   FOMC decision dates parsed from the Board's own `fomccalendars.htm` and `fomchistorical<year>.htm`
   pages. Permutation p at 20,000 iterations throughout.

Two cited sources failed and are recorded rather than substituted: S&P DJI's own index-announcement
schedule and its Case-Shiller indicator page both returned **HTTP 403** from this runner, so Leg 5's
adjacency proposal rests on the publisher's press room instead, and the downgrade is stated where it is
used (`probe-ref.blocked`).

### Leg 1 — does NAR's own calendar carry 2026-10-20? **SUPPORTED**

The schedule and the `.docx` agree on every remaining 2026 row, and on the October block in particular:

| Schedule row (both surfaces) | Series |
|---|---|
| Tue., Oct. 13 | September **Existing**-Home Sales |
| **Tue., Oct. 20** | September **Pending** Home Sales Index |
| Thu., Oct. 29 | Third Quarter Metro Home Prices |

…under the `.docx`'s standing note *"All releases are distributed at 10 a.m. Eastern Time."*

**The execution record was re-derived this session rather than inherited from the sibling.** NAR's sitemap
carries exactly two 2026 PHSI releases, and both score exact against their scheduled rows, to the hour,
read from the releases' own `<time>` elements:

| Reference month | Scheduled row | NAR newsroom `<time>` | Match |
|---|---|---|---|
| June 2026 (−5.4% m/m) | Thu., July 16 | `2026-07-16T09:00:00-05:00` (10:00 ET) | ✅ |
| July 2026 (−2.3% m/m) | Tue., Aug. 18 | `2026-08-18T09:01:00-05:00` (10:01 ET) | ✅ |

**2 for 2, to the exact day and the exact hour.** Two is the ceiling this surface offers — older releases
have rotated out of the sitemap — and that limit is stated rather than dressed up.

**The one conflicting NAR surface does not touch this edition.** The statistics page still carries a stale
next-release note naming the **August** edition on "Thursday, September 10, 2026" — the sibling series'
date under this series' name, which the 09-17 lane established is a series-labelling error rather than a
rival schedule. It names **no October date at all**. Its byte size differs by 30 from the 09-17 lane's
citation (565,623 vs 565,653); the drift is elsewhere in the page and **the note itself is
character-identical and still uncorrected** at D-42.

On that basis the entry promotes from `EST:`/`estimate` to `IR:`/`confirmed`, on the precedent
`pending-home-sales-2026-09-17`, `pending-home-sales-2026-12-17` and `existing-home-sales-2026-11-12`
already set: NAR *produces* this series rather than reporting someone else's, so its forward calendar is a
primary source. Registered as `FT-pending-home-sales-2026-10-20-1`.

**One honesty note on that registration.** It is the third sibling of one question, not a third
confirmation of it. `FT-pending-home-sales-2026-09-17-1` and `FT-pending-home-sales-2026-12-17-1` ask the
same governing-surface question; a reader counting evidence should count it **once**. What this
registration adds is *timing*, not weight — the 09-17 sibling scores **33 days before this print**, so a
fail there reverts this entry's label with a month of warning rather than on the morning itself.

### Leg 2 — is this the wide session its exact lag suggests? **REFUTED — and this is the correction**

2026-10-20 sits **six sessions before** the 2026-10-28 decision (per the Board's own calendar), which puts
it inside the October blackout that `fomc-blackout-start-2026-10-17` already tracks. Test ITB's session
range at that exact lag, against 103 FOMC decisions, 2014+:

> **ITB, lag −6: 2.074% vs a 1.836% baseline, n=101, p=0.019.**

Taken alone that is a publishable "the blackout widens homebuilders" finding, and it is the finding this
lane would have shipped had it tested only the lag its own event occupies. **Testing the whole family
kills it.** Every pre-decision lag −1 … −12, same metric, same baseline (n=1,977, excluding all twelve):

| Instrument | Nominal hits at p<0.05 (0.6 expected) | Where | Direction | min p | Survives Bonferroni 0.0042? |
|---|---|---|---|---|---|
| **ITB** | **2 / 12** | −4 (p=0.025), −6 (p=0.019) | wider | 0.0194 | **No** |
| **XHB** | **0 / 12** | — | — | 0.0890 | **No** |
| **SPY** | **2 / 12** | −2 (p=0.032), −10 (p=0.045) | **narrower** | 0.0318 | **No** |

Four things say noise, and they say it independently. The hit count is at chance. Nothing survives
correction. ITB's two hits are **non-adjacent**, with lag −5 null between them (p=0.252) — no real window
effect skips a day. And the nearest possible replication instrument, **XHB, produces zero hits across all
twelve**, while SPY's hits sit at different lags in the *opposite* direction.

**The honest aggregate is the window, not a lag.** Pooling the blackout slot the event actually occupies:

| Instrument | Blackout (−5…−8), n=404 | Baseline | p | median \|open→close\| | p |
|---|---|---|---|---|---|
| ITB | 1.844% | 1.830% | **0.684** | 0.913% vs 0.819% | 0.079 |
| XHB | 1.682% | 1.610% | 0.115 | 0.750% vs 0.701% | 0.266 |
| SPY | 0.881% | 0.873% | 0.844 | 0.381% vs 0.379% | 0.945 |

**Null on all three.** The pre-decision window is an ordinary window.

**And the exact 2026 shape adds nothing either.** 2026-10-20 is two sessions after October opex *and*
inside the blackout — a configuration that has occurred eight times since 2014 (2014-10-21, 2015-10-20,
2016-10-25, 2017-10-24, 2019-10-22, 2022-10-25, 2023-10-24, 2025-10-21):

| Instrument | Exact-shape median range (n=8) | Baseline | p | Under baseline p75 |
|---|---|---|---|---|
| ITB | 2.108% | 1.830% | 0.390 | **6 / 8** (p75 = 2.488%) |
| XHB | 1.976% | 1.610% | 0.234 | **6 / 8** (p75 = 2.227%) |
| SPY | 0.649% | 0.873% | 0.293 | **6 / 8** (p75 = 1.317%) |

Per-session ITB ranges: **2.03 / 2.18 / 2.30 / 1.01 / 1.48 / 4.88 / 1.56 / 4.31%**. Note what 6 of 8
means: the baseline p75 threshold has a **75% base rate by construction**, and the cohort hit exactly
that. **So this ledger registers no tape forward test** — unlike its August sibling, whose exact-shape
cohort ran 5 for 5, there is nothing here that beats the base rate in either direction, and registering it
anyway would manufacture a prediction out of a coin flip.

### Leg 3 — does the builder-earnings collision fire on this edition? **MIXED — strongest here, and drifting off**

`FT-pending-home-sales-2026-12-17-3` proposed a mechanism: NAR's PHSI slot sits at **day 16–21** of the
month, *inside* the homebuilder reporting window. The 09-17 lane tested it on September and refuted it.
**October is the strongest case the mechanism has** — and it is decaying. Re-run EDGAR, caches busted:

| Filer | October filings (2012+) | Within ±1 day of Oct 20 | FY2026 lag from quarter end | Implied filing |
|---|---|---|---|---|
| **NVR** | **14 of 14 years** | **7** — 2013-10-21, 2014-10-20, 2015-10-20, 2016-10-20, 2017-10-19, 2020-10-20, 2021-10-21 | Q1 **+22d** (04-22), Q2 **+23d** (07-23) | ~**10-22 / 10-23** |
| **PHM** | 14 of 14 years | 2 — 2016-10-20, 2025-10-21 | Q1 **+23d** (04-23), Q2 **+22d** (07-22) | ~**10-22 / 10-23** |
| **DHI** | 3 (its **fiscal-year** report; FY ends 09-30) | 0 | Q4 lag **+29d** (2024-10-29), **+28d** (2025-10-28) | ~**10-28** |
| LEN · KBH · TOL | September / December filers | 0 | — | not October |

So the historical collision on this slot is real and it is **NVR's**, not the December lane's LEN — but
NVR's filing has moved later in each of the last four years (**2022-10-25, 2023-10-24, 2024-10-22,
2025-10-22**) and its FY2026 lag points past the print. All three October filers now land **2 to 6
sessions after** 10-20. Registered as `FT-pending-home-sales-2026-10-20-2`, and deliberately **not**
proposed as calendar events: none of the three has published a Q3/Q4 FY2026 date, and a lag pattern is not
a source — the same limit the 09-17 lane recorded for LEN.

**A correction worth stating, because it nearly went the other way.** DHI's October filing is its
**fiscal-year** report, not a quarterly one. Projecting it from DHI's *quarterly* lag (+20/+21d) puts it at
**10-20/10-21 — on the print**. Using its own Q4 lag (+29/+28d) puts it at **10-28**, eight days later.
The quarterly projection would have manufactured a collision that the filer's own history rules out.

### Leg 4 — what does the September reference month actually contain? **SUPPORTED, and it inverts the sibling**

This is the axis on which this edition differs most from 09-17, and it cuts in two directions at once.

**PHSI counts contracts signed.** The 09-17 print's August data predated the 2026-09-16 decision entirely
— which is why that ledger's standing advice is an attribution warning. **September is the first reference
month that sits wholly after that decision**, so the 10-20 edition is the first that *can* carry a
reaction to it. That makes it the edition most likely to be *narrated* as the market's answer to the
September cut.

**And the rate path says that narrative is already wrong.** NAR's own chief economist attributed July's
−2.3% to *"the highest mortgage rates of the year… right in the middle of summer"* (release,
`2026-08-18T09:01:00-05:00`). Freddie Mac's PMMS says that framing was stale when it was written:

| Month (2026) | PMMS 30-year weekly average |
|---|---|
| July | **6.542%** ← the month NAR called the peak |
| August | **6.667%** |
| September (first print, 09-03) | **6.71%** ← the highest weekly reading of 2026 |

For scale, 2026's low was **5.98%** on 2026-02-26. September signings — this print's reference month —
faced a **higher** rate than the month NAR itself called the year's peak, not a recovery from it. Any
easing from the 09-16 decision reaches the primary mortgage market only *after* it, and cannot be read in
this data yet. Registered as `FT-pending-home-sales-2026-10-20-3`.

**This ledger still declines to forecast the index.** The 09-17 lane called that "narrative dressed as
analysis" and refused; that refusal holds here. The claim registered is about the *input* — a rate path
this repo can recompute — not the number.

### Leg 5 — adjacency: what else is in the corridor, and what is missing from it? **ONE GAP FOUND**

The ±5-day corridor around 10-20 already carries **21** tracked events, and the attribution stack is
denser than 09-17's: **NAHB HMI 10-19**, **housing starts 10-20 at 08:30** (ninety minutes before this
print), the blackout start **10-17**, opex **10-16**, and a 20-year bond auction **10-21**. Existing-home
sales lands **10-13** and FHFA HPI **10-27**.

**The gap is Case-Shiller.** This calendar tracks six housing series — NAHB HMI, housing starts,
existing / pending / new home sales, FHFA HPI and NAR metro prices — and carries **no Case-Shiller entry
at all**, despite it being the repeat-sales price benchmark the others are read against. The publisher's
own release states the schedule rule verbatim — *"Indices are published on the last Tuesday of each month
at 9:00 am ET"* (press.spglobal.com, 2026-08-25 release, HTTP 200, 90,693 bytes) — and its news archive
shows **nine consecutive releases on that month's last Tuesday**. The last Tuesday of October 2026 is
**10-27**, which puts it on the same morning as the already-tracked `fhfa-hpi-2026-10-27`: two repeat-sales
price reads at once. Proposed as
`src/domain/market-events/proposals/case-shiller-hpi-2026-10-27.from-pending-home-sales-2026-10-20.json`,
`status: "estimate"`, on three stated counts: the publisher's own **forward** schedule page returned
**HTTP 403** from this runner (recorded in `probe-ref.blocked`, not silently substituted); the cadence has
**slipped once inside the sample** — there is no March 2026 release and the January-data report published
2026-04-28 alongside February's; and this lane does not self-confirm an event it discovered in-sweep.

### Honest limits

- **The tape leg registers nothing, by design.** The exact-shape cohort is n=8 and hit its threshold's own
  base rate exactly. Stating that plainly is the result; there is no edge to carry forward.
- **A null is not proof of absence.** The blackout window measures null at n=404, which is a real sample,
  but the exact 2026 configuration is n=8 — a calendar cohort that cannot be enlarged without waiting
  years.
- **The execution record is n=2**, the ceiling NAR's sitemap offers. This session's n=2 and the 09-17
  lane's n=2 are **the same two releases**, not independent evidence.
- **The NVR, PHM and DHI Q3/Q4 FY2026 dates are unpublished.** Leg 3 is an inference from a two-quarter
  lag, registered as a forward test precisely because it is not a source.
- **Two cited sources failed** (S&P DJI, HTTP 403 twice) and are recorded; the Case-Shiller proposal rests
  on the publisher's press room and its own stated rule, not on a published forward date.
- **Every tape figure is daily OHLC**, not intraday. The 12-17 lane's hour-level test on this release class
  (ITB 10:00–11:00 share, p=0.79) is cited, not reproduced.
- **103 FOMC decisions** were parsed from the Board's own pages, including the two unscheduled 2020
  meetings and excluding the cancelled one. A handful of cross-month meetings ("Jan/Feb 31-1") required
  special handling and were verified year by year; an undetected parse gap would shift lag cohorts by one
  session each.

## Stance & kill switches

**Stand aside on every horizon.** The date is `confirmed` and confirms nothing tradeable: `symbols: []`,
no instrument attaches, and no house playbook is macro- or housing-keyed. The standing value of this
document is that it **refuses three inheritances and one of its own findings**, and it says four things.

1. **There is no blackout widening to price into 10-20.** The p=0.019 that appears at this event's exact
   lag is 1 of 2 nominal hits in a 12-lag family where 0.6 is expected, fails Bonferroni, is non-adjacent
   to its partner, and is **not replicated on XHB at all**. *Killed by* a re-run of the family after
   2026-10-20 in which the aggregate window (−5…−8) — not a single lag — clears p<0.05 on **both** ITB and
   XHB.
2. **The builder collision is real on this slot historically and has drifted off it.** NVR filed within
   ±1 day of Oct 20 in 7 of 14 years but has moved later in each of the last four. *Killed by* an NVR Q3
   FY2026 8-K Item 2.02 dated 2026-10-20 or earlier — `FT-pending-home-sales-2026-10-20-2`.
3. **The September number cannot be read as a recovery on rates.** September signings faced 2026's highest
   weekly mortgage rate. *Killed by* a September 2026 PMMS 30-year monthly average at or below July's
   6.542% — `FT-pending-home-sales-2026-10-20-3`.
4. **Whatever the session does, it is not this print.** NAHB HMI lands 10-19 and housing starts at 08:30 on
   10-20, ninety minutes ahead. *Killed by* a measured 10:00–11:00 ET signature on this release class —
   which the 12-17 lane's own test (p=0.79) currently rules out.

**The date claim itself is live until the print, but it is pre-adjudicated.**
`FT-pending-home-sales-2026-09-17-1` scores the same governing-surface question on **2026-09-17**, 33 days
before this print; a fail there reverts this entry to `estimate` with a month of warning —
`FT-pending-home-sales-2026-10-20-1`.

**What would change the stance:** a macro- or housing-keyed playbook landing in `trade-playbooks.md` (none
today), or a measured hour-level signature on this release class replacing the 12-17 lane's null. Neither
is expected before the print.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-42 | **Initial research.** Date promoted `estimate` → **`confirmed`** (`IR:` NAR schedule + .docx, "Tue., Oct. 20 \| September Pending Home Sales Index"); execution record **re-derived, not inherited** — NAR sitemap + `<time>`, **2/2** exact (June data 07-16T09:00-05:00, −5.4% m/m; July data 08-18T09:01-05:00, −2.3%). Statistics page still stale, names **no** October date, note character-identical at D-42. **Two inversions vs the 09-17 sibling:** September is the **first reference month wholly after** the 09-16 decision, and 10-20 sits **inside the October blackout** (decision **10-28** per federalreserve.gov, six sessions out) + opex+2, not FOMC+1. **The tape leg self-corrected:** ITB lag −6 reads 2.074% vs 1.836% (p=**0.019**) but that is 2/12 nominal hits (0.6 expected), fails Bonferroni 0.0042, is **non-adjacent** (−5 null, p=0.252), **XHB replicates 0/12** (min p=0.089) and SPY's 2 hits are at other lags in the **opposite** direction. Aggregate window (−5…−8, n=404) **null** — ITB p=**0.684**, XHB p=0.115, SPY p=0.844. Exact shape (Oct opex+2 **and** blackout, n=8) null, **6/8** under p75 = the 75% base rate, so **no tape test registered**. **Builder collision:** strongest here of any slot — NVR within ±1d of Oct 20 in **7 of 14** years — but drifted since 2022; FY2026 lags put NVR/PHM ~**10-22/23**, DHI's **fiscal-year** report ~**10-28** (its quarterly lag would have falsely projected 10-20/21). **Rates:** PMMS 30y July avg **6.542%**, Aug **6.667%**, 09-03 print **6.71%** — 2026's high, above the month NAR called the peak. **Adjacency sweep:** peers — none, `symbols: []`; macro — CPI 10-14, decision 10-28; VIX **15.60** (09-08); geopolitics — none touching housing; tape — two consecutive PHSI declines. **One dated event discovered and proposed: Case-Shiller 10-27** (publisher's own "last Tuesday, 9:00 am ET" rule + 9 realized dates). Blocked: S&P DJI index-announcement + indicator pages, **HTTP 403** ×2. | **Initial stance set: stand aside on every horizon.** `-1` (date), `-2` (NVR ≥ 10-21), `-3` (Sept PMMS > 6.542%) registered; **no tape test registered** — the exact-shape cohort matched its own base rate | 2026-10-08 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay, and a stance *change* earns its sentence in the Stance section with the row
as its receipt.
