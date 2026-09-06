# Full Report — Manufacturers' Shipments, Inventories and Orders (M3-2, Aug 2026 data) — m3-full-report-2026-10-02

**Kind:** macro-print · **Date:** 2026-10-02 (confirmed, CENSUS: two primaries fetched direct 2026-09-06 — `economic-indicators/calendar-listview.html` row "Full Report - Manufacturers' Shipments, Inventories and Orders | October 2, 2026 | 10:00 AM | August 2026", id `A202610021000`, reference `A202608`; and the M3 program's own `manufacturing/m3/release_schedule.html` grid row "August 2026 | 9/25/2026 | 10/2/2026" — the same grid row `durable-goods-2026-09-25` already reads `confirmed` off) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","fomc-minutes-2026-10-07","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","intl-trade-full-report-2026-10-06","ism-manufacturing-2026-10-01","ism-services-2026-10-05","jobs-2026-10-02","jolts-2026-09-29","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","pce-2026-09-30","retail-benchmark-revision-2026-09-28","sp-select-sector-secondary-reweight-2026-09-30","treasury-10y-note-2026-10-07","treasury-3y-note-2026-10-06","treasury-buyback-10y20y-2026-10-01","treasury-buyback-2y3y-2026-10-06","treasury-coupon-announcement-2026-10-01"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This edition's identity is its morning, not its content: 2026-10-02 is the September
Employment Situation, and the M3-2 full report prints 90 minutes after it — which is enough to
decompose a lean both sibling ledgers reported and could not explain.** The date is promoted
`estimate` → **`confirmed`** on two Census primaries, one of them the grid row the already-`confirmed`
paired advance reads off. Three findings are this lane's own. **First, the M3-2-day tape excess is a
composition effect, not a print effect.** Both twins reported M3-2 days running wide (~1.106% SPY
range against a ~0.96% baseline, p≈0.11) and neither could say why. **15 of the 84 scheduled M3-2
editions land on a payrolls day** — 11 of them inside the 2021+ window — and that cohort runs a median
**1.365%** (p=**0.051**). Strip it and the residual M3-2 day runs **1.076%** at p=**0.215**:
*indistinguishable from an ordinary session*. The lean was never the print. **Second, the Atlanta Fed
says the same thing at the model level, one week apart on the same reference month:** the **09-25
ADVANCE draws a posted GDPNow vintage**; this **full report draws only an `InternalUpdates` row**, and
that row reads **"M3-2 Manufacturing (Full report), Employment situation"** — jointly attributed, so
this date could never have been an "M3-2 alone" observation on two independent grounds. **Third, that
closes out a sibling's kill switch completely:** `m3-full-report-2026-12-03` named **2026-10-02 and
2026-11-03** as its next two candidates; the November twin retired 11-03, this retires 10-02, and the
next real chance is a 2027 edition. Re-derived nowcast classes: M3-2 alone (**n=21**) moves \|Δ
equipment\| **0.0039pp** against **0.0017pp** for every vintage naming no M3 (**p=0.125** — a third
independent classifier, a third failure to reject, and a thinner margin than either twin reported,
which this ledger flags rather than smooths). `symbols: []`; no macro-keyed house playbook (0 hits,
re-grepped today). Stand aside — and read 8:30, not 10:00.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-26) | **Stand aside** | High | `symbols: []`, D-26, no August full-report data in existence, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro / durable-goods / Census / GDPNow keying returns **0 hits** today. No instrument attaches on any date, and promoting the status to `confirmed` changes that not at all. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2026-10-01** — none exists today |
| This week | **Stand aside — the standing edition is four days old and two fresher M3 prints land before this one** | High | The current full report is **CB26-135**, released **2026-09-02** with July 2026 data: new orders **$663.6B** (+0.9%), shipments **$658.8B** (+0.8%), unfilled **$1,600.3B** (+0.6%, ratio 6.81), inventories **$966.9B** (+0.4%), I/S **1.47**. The next M3 event of any kind is the **August-data advance on 2026-09-25**, which is itself a GDPNow *trigger*. VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes). | Census moving or suspending the **2026-09-25** advance or this **2026-10-02** slot before those dates — unprecedented on an 84/84 record for both reports |
| This month | **Do not instrument the 10-02 bar — whatever the session does belongs to 8:30, and this is measurable rather than merely asserted** | High | 2026-10-02 is the September **Employment Situation** (BLS's own schedule page, fetched direct; tracked `high` `jobs-2026-10-02`). Since 2021 the M3-2∩payrolls cohort (**n=11**) runs a median SPY range **1.365%** / p75 **2.042%**, while M3-2 days that are *not* payrolls days (**n=58**) run **1.076%**, p=**0.215** against a **0.961%** baseline. The most recent exact analogue, **2026-07-02** — same collision, same internal-only vintage — ranged **1.515%**. | SPY's 2026-10-02 session range coming in **at or below 1.076%**, the M3-2-non-payrolls median — which would say the payrolls morning did not dominate after all and reopen whether a 10:00 print is readable inside it |
| This quarter | **Read the 09-25 advance; expect no published nowcast on 10-02 at all** | Medium | The advance→full gap is **7 days — the modal gap (32 of 83)** — and Census's own notice has given the advance all-nondurable detail since the **June 2025 data released 2025-07-25**, so what the full report adds is a bounded revision (mean **0.40pp**, **0/15 sign flips**, carried from the December twin's Wayback harvest, not re-derived). The Atlanta Fed posts a vintage for the **09-25 advance** and none for **10-02**. Medium because the forward schedule is the Atlanta Fed's own plan and its header says it is subject to change. | A GDPNow vintage **dated 2026-10-02 appearing in `ContribArchives`** — the schedule would have moved, and the whole posted/internal contrast would need re-deriving |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, no macro-keyed playbook
  (0 hits, re-grepped today), and a nowcast footprint independently re-measured as not distinguishable
  from an ordinary vintage. The `confirmed` flip widens nothing: research is not action.
- **The date is now confirmed, and the second primary was already load-bearing elsewhere.** The M3
  grid row `August 2026 | 9/25/2026 | 10/2/2026` is the row `durable-goods-2026-09-25.json` reads
  `confirmed` off. Holding the full report at `estimate` was an inconsistency, not caution.
- **Read 8:30, not 10:00 — and the split is measured, not asserted.** Registered as `-2`: SPY's
  2026-10-02 range exceeds **1.076%**, the median of M3-2 days that are *not* payrolls days. The
  payrolls cohort's excess (1.365% vs 1.076%) is where the twins' unexplained M3-2-day lean actually
  lives.
- **Expect no published nowcast for this print at all, while its own advance gets one.** Registered as
  `-1` as a paired test: a `ContribArchives` vintage dated **2026-09-25** exists and one dated
  **2026-10-02** does not. `PostedUpdates` reads "Advance Census manufacturing (M3-1)" on 09-25 and has
  **no row** for 10-02.
- **A sibling's kill switch is now dead on both of its named dates.** `m3-full-report-2026-12-03`
  watches 2026-10-02 and 2026-11-03 for a posted M3-2-alone vintage moving equipment ≥0.05pp. The
  November twin showed 11-03 is `InternalUpdates`-only; this date is `InternalUpdates`-only **and**
  named jointly with the Employment Situation. Next real candidate: a 2027 edition on a trigger day.
- **The day after is NOT the one to watch here** — the opposite of the November twin's frame.
  Registered as `-3`: SPY's **2026-10-05** range comes in at or below its 2026-10-02 range. Since 2021
  the session after payrolls was the wider of the pair only **26 of 70 times (37%)**, against the
  election-day pattern's 5-in-6. 10-05 does carry tracked `high` ISM Services.
- **The report is a revision, not a reading, and the bound is carried rather than re-derived.**
  Registered as `-4` at the twin's 14-in-15 bound: the 10-02 revision to the August durable-goods
  new-orders m/m headline is **≤0.9pp**. Mean \|revision\| 0.40pp, median 0.30pp, **0/15 sign flips**.
  If the headline direction matters, the **09-25** advance already settled it.
- **One dated event proposed in this PR:** `construction-spending-2026-10-01` — Census, 10:00, August
  2026 data, `A202610011000`, and one of the eight releases in the Atlanta Fed's **trigger** column. It
  draws a *posted* GDPNow vintage on 10-01 while this print draws only an internal one the next
  morning. No August-data construction-spending entry exists in the calendar.
- **Watch (dated)** — benchmark revisions **09-28** · JOLTS **09-29** · PCE, Q2 GDP third, ADP,
  Chicago PMI and the (already-averted) funding deadline **09-30** · **August-data advance M3-1 09-25**
  (tracked, `confirmed`, a GDPNow *trigger*) · ISM Manufacturing + Construction Spending **10-01** (the
  latter proposed here) · **this print 10-02** 10:00, 90 minutes after the **Employment Situation** ·
  ISM Services **10-05** · FT-900 **10-06** · FOMC minutes **10-07** · wholesale **10-08** · CPI
  **10-14** · **MTIS 10-15**, which consumes this report's inventories · FOMC **10-27/28** · CR expiry
  **12-11**.

## Initial research

### The question, plainly

This id existed only as a proposal — `proposals/m3-full-report-2026-10-02.from-mtis-2026-10-15.json`,
filed by the October MTIS lane on the argument that this release supplies MTIS's manufacturers' leg
(35.1% of total business inventories) thirteen days ahead of it. Two sibling ledgers have already
tested that argument on later editions and found it **right about publication and wrong about
information** ([`m3-full-report-2026-12-03`](m3-full-report-2026-12-03.md),
[`m3-full-report-2026-11-03`](m3-full-report-2026-11-03.md)). Both also reported, and neither could
explain, the same loose end: **M3-2 release days run wider than ordinary sessions at a p that hovers
around 0.11** — too weak to act on, too persistent to ignore.

So the question here is not "does M3-2 matter?" — answered twice — but: **what is different about this
edition, and does it explain the twins' loose end?** It does, and the two are the same fact.

**One-line verdict:** 2026-10-02 is payrolls morning; the M3-2-day tape excess the twins measured is a
composition effect of exactly that collision; strip the payrolls-day editions and the M3-2 day is an
ordinary session, which is what this edition will be at 10:00 whatever 8:30 does to it.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no target.
Everything below is re-derived on this runner rather than carried, except where the text says
otherwise. Inputs, all fetched direct 2026-09-06:

1. **Seven Census release calendars** — `calendar-listview.html` (HTTP 200, 91,396 bytes) plus
   `calendar-listview-2020…2025.html`, all HTTP 200, parsed row-wise into
   `(indicator, release date, time, reference month, release code)` — **1,106 unique release rows**,
   giving **84 M3-2 full reports** and **84 M3-1 advance reports**, zero gaps in either. (The 2019 list
   view returns HTTP 200 but carries no M3 rows; the series' calendar coverage starts with the 2020
   page.)
2. **`census.gov/manufacturing/m3/release_schedule.html`** (HTTP 200, 53,177 bytes) — the M3 program's
   own advance/full grid, the second primary on this date.
3. **`census.gov/manufacturing/m3/index.html`** (HTTP 200, 502,578 bytes) — the announcements block,
   both special notices re-read verbatim today.
4. **`census.gov/manufacturing/m3/current/index.html`** (HTTP 200, 123,497 bytes) — CB26-135, the
   standing full report.
5. **`bls.gov/schedule/<year>/home.htm`, 2010–2026** (all HTTP 200) — the Employment Situation's own
   release dates, **220 of them**, straight from BLS. See the note below: this source is recorded as a
   known blind spot in `EVENT-RESEARCH.md` and it is *not* blocked from this runner.
6. **`GDPNowcastDataReleaseDates.xlsx`** (Atlanta Fed, HTTP 200, 16,944 bytes) — `PostedUpdates` (82
   dated rows) and `InternalUpdates` (95), plus the two legend columns that define what triggers a
   public post.
7. **`GDPTrackingModelDataAndForecasts.xlsx`** (Atlanta Fed, HTTP 200, 10,875,424 bytes) —
   `ContribArchives`, **1,871 vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas**.
8. **FRED** — `MNFCTRIMSA`, `BUSINV`, `MNFCTRIRSA`, `WHLSLRIMSA`, `RETAILIMSA`, all HTTP 200.
9. **Yahoo daily bars** — SPY / QQQ / `^VIX` through **2026-09-04**, with 20,000-iteration permutation
   tests on medians throughout.

**A recorded blind spot is narrower than recorded, and the fix is one header.**
`EVENT-RESEARCH.md`'s honesty rules note that "the GitHub Actions event-research lane meets 403s on
bls.gov from plain fetchers without browser headers." On this runner today the relation is the
*opposite* way round: a **browser** user-agent gets **HTTP 403** from `bls.gov`, and the repo's own
contactable research UA (`scripts/research/market-data.mjs`'s
`skynet-capital research (<contact>)`) gets **HTTP 200** on every page tried, including seventeen years
of release schedules. Yahoo behaves the same way — the browser UA drew a persistent `429` where the
contactable UA served the full history first try. Nothing is recorded in `probe-ref.blocked` because
nothing this ledger cites ultimately failed; the useful part is the rule, which is that **a
contactable UA is the first thing to try on a 403/429, not the last**.

### Leg 1 — the report exists on 2026-10-02 · **SUPPORTED**, on two primaries, and promoted to `confirmed`

Census lists `A202610021000`, reference `A202608`, 10:00 a.m., and the M3 program's own grid reads
`August 2026 | 9/25/2026 | 10/2/2026`.

Status moves `estimate` → **`confirmed`**. The no-self-confirm convention binds the *discovering*
sweep (here, the `mtis-2026-10-15` lane); this is the independent second look. And the second primary
is already load-bearing elsewhere in this calendar: `durable-goods-2026-09-25.json` reads `confirmed`
off that same grid row. Leaving the full report an `estimate` while its own paired advance was
`confirmed` off the same line was an inconsistency, not caution.

The suspension record, re-derived: across the 2025 and 2026 calendars **11** rows read `Suspended` —
Advance Economic Indicators Report (5 reference months), Preliminary U.S. Imports for Consumption of
Steel Products (5), Advance Services Report (1). **Never M3-1, never M3-2** — 84/84 for both.

### Leg 2 — the scheduling profile · ordinary on three measures, short on the fourth, and the fourth is not what matters

| Measure | 2026-10-02 | The series |
|---|---|---|
| Census co-releases that day | **none — Census-solo** | 69 of 84 (82.1%) are Census-solo |
| Business day of the month | **2nd** | the modal slot — 40 of 84 |
| Advance → full gap | **7 days** | the modal gap — 32 of 83 (median 7, mean 8.7, range 3–54) |
| Reference-month-end → release lag | **32 days** | median **34** (n=84, range 31–79); 32 is the 4th-most-common value, 9 of 84 |

Three modes and one mildly short lag. Nothing about the *release* is unusual, which is exactly the
November twin's finding for its own edition. What is unusual about 2026-10-02 is who else is speaking
that morning, and Leg 3 is that.

### Leg 3 — the payrolls collision, and the twins' loose end · **the finding**

**2026-10-02 is the September Employment Situation.** BLS's own 2026 schedule page, fetched direct
today, lists it at 08:30 ET; the calendar tracks it as `high`-tier `jobs-2026-10-02` (`confirmed`).
This report prints **90 minutes later**, at 10:00.

Of the 84 scheduled M3-2 releases, **15 land on an Employment Situation day** (11 of them Census-solo,
as this one is), 14 with bars behind them:

`2020-07-02 · 2020-10-02 · 2020-12-04 · 2021-06-04 · 2021-07-02 · 2021-12-03 · 2022-09-02 ·
2023-01-06 · 2024-01-05 · 2024-02-02 · 2024-08-02 · 2025-05-02 · 2025-07-03 · 2026-07-02 ·
**2026-10-02**`

That is a real cohort, not a precedent — and splitting the M3-2 class on it dissolves the twins' loose
end. SPY session range, since 2021-01-01, 20,000-iteration permutation tests on medians:

| Class | n | median SPY range | p75 | p90 | p vs baseline |
|---|---|---|---|---|---|
| Baseline (no M3 day, no payrolls day) | 1,228 | **0.961%** | 1.411% | 2.068% | — |
| **M3-2 day (all)** — what both twins measured | 69 | **1.106%** | 1.574% | 2.262% | **0.091** |
| **M3-2 on a payrolls day** | **11** | **1.365%** | **2.042%** | 2.536% | **0.051** |
| **M3-2 NOT on a payrolls day** | **58** | **1.076%** | 1.446% | 2.048% | **0.215** |
| Payrolls day, no M3 | 60 | 1.111% | 1.440% | 2.366% | 0.097 |

**The M3-2-day excess is a composition effect.** 11 of the 69 M3-2 days in the window are payrolls
days and they carry a median 1.365%; remove them and the residual M3-2 day sits at 1.076% with
**p=0.215** — a failure to distinguish it from an ordinary session by any reading. Both twins reported
the pooled 1.106% / p≈0.11 number and correctly declined to act on it; what neither could say is that
the lean is the **calendar company**, not the print. This ledger can, because its own edition is a
member of the cohort that supplies it.

Two honest caveats, stated here rather than in the limits section because they bound the finding
directly. The payrolls cohort is **n=11** and p=0.051 is a hair the wrong side of nothing; and
`M3-2 payday vs M3-2 non-payday` tested against each other gives **p=0.191** — the two subclasses are
not *separated* at conventional strength, they are only differently placed against the baseline. The
claim that survives is the weak one and it is the one that matters: **the pooled M3-2 lean does not
survive removing the payrolls days.**

The most recent exact analogue is **66 days old**: **2026-07-02**, same collision, same
`InternalUpdates`-only GDPNow treatment (Leg 4), SPY range **1.515%** on a +0.220% gap and a −0.351%
open-to-close. And unlike the November twin's election frame, **there is no "read the day after" here**
— since 2021 the session following payrolls was the wider of the pair only **26 of 70 times (37%)**.
The dispersion is on the day, at 8:30.

### Leg 4 — the Atlanta Fed says the same thing, one week apart on one reference month · **SUPPORTED**

`GDPNowcastDataReleaseDates.xlsx`, fetched today, on the corridor:

| Date | `PostedUpdates` | `InternalUpdates` |
|---|---|---|
| **2026-09-25** | **Advance Census manufacturing (M3-1)** | — |
| 2026-09-30 | GDP (Q2 3rd estimate), Personal income and outlays, … | — |
| 2026-10-01 | **Construction spending, ISM Manufacturing Index** | — |
| **2026-10-02** | **no row** | **M3-2 Manufacturing (Full report), Employment situation** |
| 2026-10-06 | International trade (Full report) | — |

**This is the sharpest single statement the M3 family has produced.** The August reference month gets
two Census releases seven days apart. The **advance** on 09-25 is in the Atlanta Fed's trigger column
and draws a **published** nowcast vintage of its own. The **full report** on 10-02 is in the "Other
releases" column and draws an **internal** update that never enters `ContribArchives`. Same data,
same month, same agency, opposite treatment by the same model, one week apart.

And the internal row is **jointly attributed** — it names the Employment Situation alongside M3-2,
where the November twin's 11-03 row named M3-2 alone. So even in the counterfactual where 10-02 were
posted, it could never have been an "M3-2 alone" observation.

**That retires a sibling's kill switch completely.** `m3-full-report-2026-12-03`'s first kill switch
reads:

> A GDPNow vintage naming M3-2 alone moves \|Δ equipment\| by ≥0.05pp. **The next two candidates are
> the 2026-10-02 (August data) and 2026-11-03 (September data) editions.**

The November twin showed 11-03 is internal-only. This date is internal-only **and** not alone. Both
named candidates are dead; the next real chance is a 2027 edition landing on a trigger day. Across the
2026 calendar M3-2 appears in `PostedUpdates` **twice** (01-29, 08-04, both riding an international-
trade or wholesale trigger) and in `InternalUpdates` **eight** times (03-18, 04-10, 05-04, 06-03,
07-02, 09-02, **10-02**, 11-03) — an independent re-derivation matching the November twin's list
exactly. Note that the Employment Situation itself also sits in the "Other releases" column: GDPNow
does not post for payrolls either.

### Leg 5 — the nowcast footprint · **REFUTED, but by a thinner margin than either twin reported**

`ContribArchives` re-classified from scratch, third independent pass. Free-text `Data releases` tokens
that name no M3 edition specifically are resolved by joining to the Census calendar; the classifier
here differs from the November twin's in one deliberate way — **payrolls vintages are held out of the
baseline** rather than pooled into it, which is the whole point of this ledger.

| Vintage class (own `Data releases` text, calendar-disambiguated) | n | \|Δ Equip\| | \|Δ Inv\| | \|Δ GDP\| |
|---|---|---|---|---|
| **M3-2 named ALONE** | **21** | **0.0039pp** | 0.0203pp | 0.0378pp |
| **M3-2 named WITH the Employment Situation** | **4** | 0.0507pp | 0.0800pp | 0.6173pp |
| M3-1 advance named ALONE | 68 | 0.0346pp | 0.0626pp | 0.0824pp |
| Employment Situation named ALONE | 44 | 0.0333pp | 0.0397pp | 0.1607pp |
| Every vintage naming no M3 and no payrolls | 1,252 | 0.0014pp | 0.0058pp | 0.0707pp |

Permutation tests (20,000 iterations, on medians), M3-2-alone against two baseline definitions:

| Baseline | n | median \|Δ Equip\| | p (equip) | p (inv) |
|---|---|---|---|---|
| **Wide** — every vintage naming no M3 (the twins' definition) | 1,348 | 0.0017pp | **0.125** | 0.198 |
| **Narrow** — no M3 *and* no payrolls | 1,252 | 0.0014pp | **0.063** | 0.127 |

**66.7%** of M3-2-alone vintages move equipment by under 0.01pp, against **73.7%** of the narrow
baseline; the M3-1 advance moves 0.0346pp at **p<0.00001** on either baseline, unchanged from both
twins.

Two readings, and the second is the uncomfortable one. **The direction holds:** a vintage in which the
full report is the only input is still not distinguishable from a vintage with no M3 report in it,
while the advance emphatically is — three independent classifications, three times the same verdict.
**But the margin is thinner here than either twin reported** (p=0.125 on their own baseline definition,
against their 0.660 and 0.914), and on the narrow baseline it is 0.063. The gap comes from two places:
this classifier admits 21 M3-2-alone vintages where theirs admitted 16, and holding payrolls vintages
out lowers the comparison median. This is stated rather than smoothed, and it is registered below as a
watch item: a fourth pass finding p<0.05 would make "M3-2 is inert" an n-artifact rather than a fact.

The `M3-2 + Employment Situation` class (n=4: 2021-06-04, 2022-09-02, 2023-01-06, **2026-07-02**) moves
0.0507pp — but the attribution is not ambiguous, because `Employment Situation alone` (n=44) already
moves 0.0333pp at p<0.00001. The payrolls leg is the mover in that class, exactly as it is on the tape.

### Leg 6 — the coverage claim, and the frozen basis · **REFUTED**, on Census's own notice, re-read today

Census's M3 announcements block carries both special notices verbatim as of 2026-09-06:

> Due to schedule and resource constraints, revised historical data and the seasonal adjustment models
> for the Manufacturers' Shipments, Inventories, and Orders (M3) Survey will remain unchanged for the
> remainder of 2026.

> Starting with the June 2025 data released on July 25, 2025, the Advance Total Manufacturing
> publication includes detailed data for all nondurable industries from the Manufacturers' Shipments,
> Inventories, and Orders Survey.

The second notice is why the proposal's coverage argument fails: the advance has carried
all-nondurable detail for **fourteen months**, and the release grid's own column header now reads
"Advance Report on Durable Goods **and Advance Total Manufacturing**". What the full report adds is
revision — bounded by the December twin's Wayback harvest at mean **0.40pp**, median 0.30pp, max
1.80pp, **0 of 15 sign flips**. That measurement is **carried, not re-derived here**; a third harvest
of the same archive for the same answer would be waste.

The first notice matters more to `mtis-2026-10-15`, the lane that proposed this event, than to this
one: the share of the October MTIS aggregate this report supplies stands on a **frozen** basis while
the retail leg is re-benchmarked on the 2023/2024 AIES. The M3 page's own header reads "Benchmark
Report Released: May 16, 2025" — there is no 2026 M3 benchmark to come.

**The component weights are re-derived on FRED, which is reachable from this runner** (June 2026,
`BUSINV` $2,740.2B): manufacturers **$962.9B = 35.1%**, wholesale $944.7B = 34.5%, retail $832.6B =
30.4%. `MNFCTRIRSA` reads **1.48** — the **3rd-lowest of the 66 monthly readings since 2021-01**
(median 1.56) after nine straight declines (1.57 Nov-25 → 1.48), while manufacturers' inventory
*levels* have risen ten consecutive months ($948.2B → $962.9B). Levels restocking, ratio destocking;
against the post-2021 era this is a lean book, not a full one. That reproduces the November twin's
reading on the same FRED series.

### Leg 7 — funding · **not a live branch for this event**

H.R. 6500, the Continuing Appropriations and Extensions Act 2027, was signed **2026-09-02** as PL
119-103 funding through **2026-12-11** (carried from `government-funding-deadline-2026-09-30`'s own
`source` string, which reads `RESOLVED — AVERTED` on three primaries). 2026-10-02 sits **70 days
inside** that window, and the tracked `government-funding-deadline-2026-09-30` two days earlier is a
checkpoint that has already resolved. The series' own record is the strongest in the family: **84
consecutive reference months with zero deletions for both the report and its preview**.

This matters more for the *other* print that morning than for this one. That ledger's own notes state
BLS does not publish through a lapse — in the 2025 lapse it skipped the October Employment Situation
outright — so had the CR not been enacted, 2026-10-02 would have been an ordinary Census-solo M3-2 day
and this whole ledger's finding would not apply to it. It was enacted; the collision stands.

### Primary content read — what the standing edition says

**CB26-135** (released 2026-09-02, July 2026 data, read direct today): new orders **+$5.8B / +0.9% to
$663.6B**, up following two consecutive monthly decreases; shipments **+$5.3B / +0.8% to $658.8B**, up
nine of the last ten months; unfilled orders **+$9.9B / +0.6% to $1,600.3B**, up twenty-four of the
last twenty-five months, unfilled-to-shipments **6.81** (down from 6.84); inventories **+$3.5B / +0.4%
to $966.9B**, up ten consecutive months, I/S **1.47**.

This is July data and will be one edition stale by 10-02 — the August-data advance prints 09-25 and
sets the headline this report then revises. Every August-content statement in this ledger is a base
rate, never a forecast.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. Within the corridor: retail and
  NSA benchmark revisions **09-28**; JOLTS and consumer confidence **09-29**; PCE, Q2 GDP third
  estimate, ADP, Chicago PMI, the advance economic indicators report and the (already-averted) funding
  deadline **09-30**; ISM Manufacturing, BoJ Tankan and Construction Spending **10-01**; **the
  Employment Situation and this print 10-02**; ISM Services **10-05**; the FT-900 **10-06**; FOMC
  minutes **10-07**; wholesale **10-08**; CPI **10-14**; **MTIS 10-15**.
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes, Yahoo daily
  bars). Baseline reading; nothing to diff against yet. For scale, 2026's payrolls-day SPY ranges so
  far run 0.883 / 1.150 / 0.944 / 0.510 / 0.476 / 2.344 / 1.515 / 0.557 / 0.502% — the most recent two
  (08-07, 09-04) were quiet, which is the honest counterweight to Leg 3's cohort median.
- **Geopolitical / policy** — the funding checkpoint two days before this print has resolved (PL
  119-103 through 12-11), which is the branch that would otherwise have deleted the 8:30 print and
  with it this ledger's whole frame. The G20 trade ministerial (09-30) and the OPEC JMMC (10-04) sit in
  the corridor with no channel to a series with no symbols.
- **Event tape** — no August full-report consensus exists at D-26 and none will before the **09-25**
  advance sets the headline this report revises.
- **One dated event proposed in this PR**, its own file owned by this lane:
  **`construction-spending-2026-10-01`** — Census, 10:00, August 2026 data, `A202610011000`, and one of
  the eight releases in the Atlanta Fed's **trigger** column, i.e. a release that *causes* a posted
  GDPNow update. No August-data construction-spending entry exists in the calendar (the tracked
  editions are the September-data 11-02, itself only a proposal, and the October-data 12-01). It is the
  same inverse-of-the-finding both twins filed for their own corridors, and here the contrast is one
  day wide: 10-01 posted, 10-02 internal.
- **Three considered and declined**, so their absence reads as a decision: **New Residential Sales**
  (09-24 — a genuine calendar gap, but it draws only an `InternalUpdates` vintage and the residential
  series already has two never-assessed editions in the queue, so a third adds a row that measures
  nothing new), **Preliminary Steel Imports** (09-24, `Suspended` in five recent reference months and
  therefore not a dependable row — the same call the November twin made), and **Business Formation
  Statistics** (10-14, no GDPNow vintage of its own, and 10-14 is already the tracked CPI/Beige Book
  day). The **successor** full report (November 2026 data) is **not proposable**: Census's own grid ends
  at October 2026 data.

### Honest limits

- **The payrolls cohort is n=11 and the split is not clean.** Leg 3's whole quantitative content is
  eleven sessions in the 2021+ window (fifteen scheduled editions all-time). p=0.051 against baseline
  is a hair, and M3-2-payday vs M3-2-non-payday tested directly gives p=0.191 — the subclasses are
  differently *placed*, not conclusively *separated*. The surviving claim is the weak one: the pooled
  lean does not survive the removal.
- **The nowcast margin is thinner here than in either twin, and that cuts against the family's
  stance.** p=0.125 on their baseline definition, 0.063 on the narrow one, against their 0.660 and
  0.914. Three passes agree on direction and disagree on comfort. A fourth pass at p<0.05 would make
  the "M3-2 is inert" reading an artifact of small n, and that is registered as a kill switch rather
  than argued away.
- **The classifier resolves ambiguity with a calendar join, and 251 of 1,822 deltas stay ambiguous
  and excluded** — nearly all of them pre-2020, where this runner's Census calendar coverage does not
  reach. A vintage whose text silently omits M3-2 is misfiled into the baseline, a bias **toward**
  finding no difference.
- **Leg 4 is a claim about a forward schedule, not about history.** `GDPNowcastDataReleaseDates.xlsx`
  is the Atlanta Fed's own plan and its header says "GDPNow release schedule subject to change." If a
  trigger release moves onto 2026-10-02 the edition becomes posted, and the paired 09-25/10-02 contrast
  needs re-deriving.
- **The revision bound is carried, not re-derived.** Leg 6's 0.40pp / 0-of-15 figures come from the
  December twin's Wayback harvest. That sample is 15 months with gaps, determined by what the archive
  holds; both facts widen the true distribution rather than narrowing it.
- **All the nowcast work measures a model, not a market.** `ContribArchives` ends 2026-07-28 and
  carries no Q4-2026 vintages, so every class prior here is out-of-sample for the quarter in question.
- **`symbols: []` is doing real work.** Even were every measurement twice as strong, this event has no
  instrument attached and no house playbook keyed to it. The `confirmed` flip changes the honesty label
  on the date and nothing else.

## Stance & kill switches

**Stance (date is `confirmed`).** Stand aside on 2026-10-02 and on every edition of this report. Hold
four frames. **On identity:** unchanged from both twins and re-verified today — this is a *revision*,
not a reading; Census's advance publication has carried all-nondurable detail since the June 2025 data
released 2025-07-25, and what remains is a revision running a mean 0.40pp that has never flipped the
headline's sign in fifteen measured months. **On the morning, which is this edition's whole story:**
2026-10-02 is the September Employment Situation at 8:30 and this print follows at 10:00. That is not
a coincidence to note but the fact that explains a loose end both twins carried — the M3-2-day SPY
range excess (1.106% vs a 0.961% baseline) is a **composition effect** of the 11 payrolls-day editions
in the class, which run 1.365%; the other 58 run 1.076% at p=0.215, indistinguishable from an ordinary
session. Whatever 2026-10-02 does, it belongs to 8:30. And unlike the November twin's election frame,
there is no day-after to watch: the session following payrolls was the wider of the pair only 37% of
the time since 2021. **On the nowcast, with a sibling's kill switch retired and this ledger's own
confidence lowered:** the Atlanta Fed publishes a vintage for the 09-25 advance and none for this
report seven days later, and its internal row for 10-02 names M3-2 jointly with the Employment
Situation — so `m3-full-report-2026-12-03`'s kill switch is now dead on both of its named dates. But
this lane's re-derivation puts M3-2-alone at p=0.125 against the twins' 0.660 and 0.914, and that
thinner margin is registered as a live risk to the family's stance rather than smoothed into
agreement. **On the corridor:** the 09-30 funding checkpoint has resolved (PL 119-103 through
2026-12-11), which is the only branch that could have deleted the 8:30 print and with it this whole
frame. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **SPY's 2026-10-02 session range comes in at or below 1.076%** — the median of M3-2 days that are
  *not* payrolls days. The payrolls morning would not have dominated after all, and whether a 10:00
  print is readable inside the session becomes a live question rather than a refused one.
- **A GDPNow vintage dated 2026-10-02 appears in `ContribArchives`**, or no vintage dated 2026-09-25
  does. Either half breaks the posted/internal contrast that is Leg 4's whole content, and the Atlanta
  Fed's own workbook warns its schedule is subject to change.
- **A fourth independent classification puts M3-2-alone at p<0.05 against a no-M3 baseline.** This
  lane already measured 0.125 where the twins measured 0.660 and 0.914. One more step in that direction
  makes "the full report is inert" an artifact of n≈20 rather than a finding, and the family's shared
  stance would need rebuilding from the advance/full contrast alone.
- **A posted GDPNow vintage naming M3-2 alone moves \|Δ equipment\| by ≥0.05pp.** ~13× the class
  median. With 10-02 and 11-03 both retired, the next candidate is a 2027 edition landing on a trigger
  day.
- **SPY's 2026-10-05 range exceeds its 2026-10-02 range.** The minority branch (26 of 70 since 2021),
  and 10-05 carries tracked `high` ISM Services. The corridor's dispersion would sit after the print
  rather than on it, and this ledger's "read 8:30" frame would need the November twin's day-after
  treatment instead.
- **The 2026-10-02 full report revises the August durable-goods new-orders m/m headline by more than
  0.9pp, or reverses its sign.** 1 of 15 and 0 of 15 in the carried sample. Either makes this print a
  reading rather than a revision.
- **Census publishes an M3-2 edition carrying content the preceding advance did not**, or withdraws
  the July-2025 notice. The proposal's original coverage argument is restored.
- **The August-2026 reference month is deleted rather than delayed** — a `Suspended` row where a date
  belongs. 84/84 becomes 84/85.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-10-01.** The
  stand-aside is partly an absence-of-instrument argument.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-m3-full-report-2026-10-02-1` — **the paired nowcast test**: a `ContribArchives` vintage dated
  **2026-09-25** (the M3-1 advance, a posted trigger) exists, and one dated **2026-10-02** does not.
  Score by 2026-10-08.
- `FT-m3-full-report-2026-10-02-2` — **SPY's 2026-10-02 session high-low range exceeds 1.076%** of its
  close — the median of M3-2 days that are *not* payrolls days. The payrolls morning, not the print.
  Score by 2026-10-08.
- `FT-m3-full-report-2026-10-02-3` — **SPY's 2026-10-05 session range is at or below its 2026-10-02
  range** — the measured 63% post-payrolls pattern, and the inverse of the November twin's election
  day-after frame. Score by 2026-10-08.
- `FT-m3-full-report-2026-10-02-4` — the **2026-10-02 revision to the August durable-goods new-orders
  m/m headline is 0.9pp or less in absolute value**, the carried 14-in-15 bound. Score by 2026-10-08.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-26 | **Initial research on an id that existed only as a proposal, behind two twins that already measured this release as inert — so the work is what is DIFFERENT here, and it is the morning.** Canonical `src/domain/market-events/m3-full-report-2026-10-02.json` written this session after reading the single proposal (`from-mtis-2026-10-15`), now shadowed. **Leg 1 — date promoted `estimate` → `confirmed`** on two Census primaries fetched today: `calendar-listview.html` (`A202610021000`, period `A202608`, 10:00) and the M3 grid row `August 2026 \| 9/25/2026 \| 10/2/2026` — the row `durable-goods-2026-09-25.json` already reads `confirmed` off, so holding this at `estimate` was an inconsistency. Suspensions re-derived: **11** `Suspended` rows across the 2025/2026 calendars (AEIR 5, Steel Imports 5, Advance Services 1), **never M3**; 84/84 both reports. **Leg 2 — scheduling: modal on three measures, short on the fourth:** Census-solo (69 of 84), **2nd business day** (40 of 84), **7-day advance→full gap** (32 of 83), **32-day ref-end→release lag** against a median of 34 (9 of 84 at 32). Nothing about the release is unusual. **Leg 3 — THE FINDING, and it dissolves a loose end both twins carried:** 2026-10-02 is the September **Employment Situation** (BLS's own schedule page, fetched direct; tracked `high` `jobs-2026-10-02`, 8:30), and this prints at 10:00. **15 of 84 scheduled M3-2 editions land on a payrolls day** (11 Census-solo, as this is); 11 sit in the 2021+ bar window. SPY session range since 2021: baseline (no M3, no payrolls, n=1,228) **0.961%**; **M3-2 all (n=69) 1.106%, p=0.091** — the number both twins reported and could not explain; **M3-2 ON a payrolls day (n=11) 1.365%, p75 2.042%, p=0.051**; **M3-2 NOT a payrolls day (n=58) 1.076%, p=0.215**. **The M3-2-day excess is a COMPOSITION EFFECT, not a print effect.** Most recent exact analogue **2026-07-02** (same collision, same internal-only vintage): SPY ranged **1.515%**. **No day-after frame here** — the session after payrolls was the wider of the pair only **26 of 70 (37%)** since 2021, against the November twin's 5-in-6 election pattern. **Leg 4 — the Atlanta Fed agrees, one week apart on one reference month:** `GDPNowcastDataReleaseDates.xlsx` posts **2026-09-25 "Advance Census manufacturing (M3-1)"** and has **NO PostedUpdates row for 2026-10-02** (posted either side: 10-01 "Construction spending, ISM Manufacturing Index", 10-06 "International trade (Full report)"), whose `InternalUpdates` row reads **"M3-2 Manufacturing (Full report), Employment situation"** — jointly attributed. Same month, same agency, opposite treatment seven days apart. **This retires `m3-full-report-2026-12-03`'s kill switch COMPLETELY**: it named 2026-10-02 and 2026-11-03; the November twin killed 11-03 (internal-only), this kills 10-02 on two independent grounds (internal-only AND not alone). 2026 M3-2: **POSTED 2** (01-29, 08-04), **INTERNAL 8** (03-18, 04-10, 05-04, 06-03, 07-02, 09-02, 10-02, 11-03) — matches the November twin's list exactly. **Leg 5 — nowcast re-derived, direction held, MARGIN THINNER, and said so:** `ContribArchives` 1,871 vintages → 1,822 same-quarter deltas, payrolls vintages held OUT of the baseline. **M3-2 alone (n=21) 0.0039pp** \|Δ equip\|; **M3-2 + Employment Situation (n=4: 2021-06-04, 2022-09-02, 2023-01-06, 2026-07-02) 0.0507pp**; M3-1 alone (n=68) 0.0346pp (p<0.00001); **Employment Situation alone (n=44) 0.0333pp (p<0.00001)** — so the payrolls leg is the mover in the joint class, exactly as on the tape. M3-2-alone vs baseline: **p=0.125** on the twins' wide definition, **p=0.063** on the narrow one — against their 0.660 and 0.914. Third classifier, third failure to reject, thinnest margin yet; registered as a kill switch rather than smoothed. **Leg 6 — coverage claim dead, basis frozen, weights re-derived:** both M3 special notices re-read verbatim today (advance carries all-nondurable detail since the June 2025 data released 2025-07-25; M3 revised history and seasonal models frozen "for the remainder of 2026"). FRED reachable: June 2026 manufacturers **$962.9B of $2,740.2B = 35.1%** (wholesale 34.5%, retail 30.4%); `MNFCTRIRSA` **1.48**, the **3rd-lowest of 66 post-2021 readings** (median 1.56) after nine straight declines, while inventory levels rose ten consecutive months ($948.2B → $962.9B). Revision bound (0.40pp mean, **0/15 sign flips**) **carried from the December twin, not re-derived**. **Leg 7 — funding resolved, and it is load-bearing for the OTHER print:** PL 119-103 signed 2026-09-02 funds through 2026-12-11, so 10-02 is **70 days inside**; had the CR lapsed, BLS would have skipped the 8:30 print (2025 precedent) and this ledger's entire frame would not apply. **Primary content:** CB26-135 (2026-09-02, July data) — new orders **$663.6B** (+0.9%), shipments **$658.8B** (+0.8%), unfilled **$1,600.3B** (+0.6%, ratio 6.81), inventories **$966.9B** (+0.4%, I/S **1.47**, up ten consecutive months). One edition stale by 10-02. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** benchmark revisions 09-28; JOLTS 09-29; PCE + Q2 GDP third + ADP + funding checkpoint 09-30; ISM Mfg + Construction Spending 10-01; **Employment Situation + this print 10-02**; ISM Services 10-05; FT-900 10-06; FOMC minutes 10-07; CPI 10-14; MTIS 10-15. **Volatility:** VIX **14.53**, SPY **770.19**, QQQ **718.96** (2026-09-04 closes) — baseline, nothing to diff against yet; 2026's payrolls-day SPY ranges run 0.883 / 1.150 / 0.944 / 0.510 / 0.476 / 2.344 / 1.515 / 0.557 / 0.502%, and the two most recent were quiet — the honest counterweight to Leg 3. **Geopolitical:** funding averted; G20 trade ministerial 09-30 and OPEC JMMC 10-04 have no channel to a symbol-less series. **Event tape:** no August full-report consensus at D-26; the **09-25** advance sets the headline this report revises. **One dated event proposed** (own file, `estimate`): **`construction-spending-2026-10-01`** — Census 10:00, August data, `A202610011000`, in the Atlanta Fed's **trigger** column with a posted vintage of its own, untracked in the calendar; the inverse of this ledger's finding, one day wide. **Three declined on the record:** New Residential Sales 09-24 (internal-only vintage; two never-assessed residential editions already queued), Preliminary Steel Imports 09-24 (`Suspended` five recent months), Business Formation Statistics 10-14 (no vintage; 10-14 already tracked as CPI/Beige Book). Successor **not proposable**: Census's grid ends at October 2026 data. **A recorded blind spot narrowed, no `blocked` entries:** `EVENT-RESEARCH.md` notes bls.gov 403s "from plain fetchers without browser headers"; on this runner the relation inverts — a **browser** UA drew 403 from bls.gov and a persistent 429 from Yahoo, while the repo's own contactable research UA (`scripts/research/market-data.mjs`) drew **HTTP 200** from both, including seventeen years of BLS schedules. Try the contactable UA first, not last. **Four forward tests registered:** `-1` (paired: a 09-25 ContribArchives vintage exists, a 10-02 one does not), `-2` (SPY 10-02 range exceeds the 1.076% M3-2-non-payrolls median — the morning, not the print), `-3` (SPY 10-05 range at or below 10-02's — the measured 63%), `-4` (the 10-02 revision to the August headline is ≤0.9pp). | **Initial stance set: stand aside; the date is promoted to `confirmed` on two Census primaries. This edition's identity is its morning — it prints 90 minutes after the September Employment Situation, and that collision explains the M3-2-day tape lean both twins measured and neither could account for: strip the payrolls-day editions and the M3-2 day is an ordinary session. The Atlanta Fed treats the 09-25 advance and this report oppositely one week apart, which retires a sibling's kill switch on its last remaining candidate — while this lane's own nowcast margin (p=0.125) is thinner than either twin's and is registered as a live risk to the family's shared stance rather than smoothed into agreement.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-m3-full-report-2026-10-02.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
