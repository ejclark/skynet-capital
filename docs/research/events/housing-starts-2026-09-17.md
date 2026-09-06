# New Residential Construction (Building Permits, Housing Starts, Completions — August 2026 data) — housing-starts-2026-09-17

**Kind:** macro-print · **Date:** 2026-09-17 (**confirmed**, `CENSUS:` four independent census.gov primaries — `economic-indicators/calendar-listview.html` row `A202609170830`/`A202608`, `construction/soc/schedule.html`'s row "August 2026 | September 17, 2026 | September 24, 2026", `construction/xls/historic_release_dates.xls`'s reference-2026-08 row, and release **CB26-127**'s own "Next Release: September 17, 2026"; all fetched direct 2026-09-06, promoted this session from the `EST:` proposal) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:0+","adjacentIds":["boj-decision-2026-09-18","buyback-blackout-start-2026-09-12","fomc-2026-09-16","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","import-export-prices-2026-09-16","missouri-uocava-ballot-mailing-2026-09-19","nahb-hmi-2026-09-16","opex-2026-09-18","retail-sales-2026-09-16","treasury-10y-tips-2026-09-17","treasury-20y-bond-2026-09-15","treasury-2y-note-2026-09-22","treasury-coupon-announcement-2026-09-17","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-vote-2026-09-17","vix-expiration-2026-09-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Two sibling lanes wrote this edition off — one as "not distinguishable," the other as
"dirty" — and both calls survive only in their conclusions, not in their reasons.** The
[10-20 ledger](housing-starts-2026-10-20.md) found that a starts vintage's GDPNow footprint depends on
where it sits in the nowcast quarter (in-quarter **0.0869pp** vs post-quarter **0.0250pp**, **3.48×**,
p=0.0001) and offered a mechanism it explicitly declined to test — *the third month lands in a quarter
already mostly observed*. That mechanism predicts a **gradient**, not a step, and the gradient is here:
starts vintages land at exactly **three** positions per nowcast quarter and the median move falls
monotonically across them — **0.1020pp → 0.0726pp → 0.0250pp** (n=48/47/48, p=0.038 and p<0.0001).
Both natural controls show a **hump** instead (pooled non-starts 0.0056/0.0105/0.0049; construction
spending 0.0369/0.0776/0.0632), so the decline is this release's own. **2026-09-17 is the middle rung**
— the last in-quarter starts vintage of 2026:Q3, **solo** on the Atlanta Fed's schedule — so the figure
to carry is **0.0726pp**, or **0.0650pp** on the tightest matching cut, both *above* the corridor's
unconditional 0.0609pp. That is the opposite direction from the 10-20 finding, and this print is the
**first out-of-sample instance of the whole gradient**, scoring **33 days before** the 10-20 lane's own
test. On the tape, "dirty" is measured and its stated reason fails: on the **10** release days in twenty
years that followed an FOMC decision, ITB's overnight gap is **flat** (0.539% vs 0.576%, p=0.875); opex
eve is null (p=0.94); September release days are *quieter* (p=0.21). What survives is a **calibration**
problem — the exact 2026 configuration has occurred **7 times** and cleared the corridor's 1.579%
threshold **2 of 7**, with only **n=3** in the era that set it — so this date's gap is uninformative in
both directions and **must not be scored as a kill-switch observation**. And the content side, untouched
by either sibling: July printed **−12.4% (±9.5%)**, after which the next month is up **15 of 17**
post-2010 (median **+8.35%**, implying ~**1,342K**) — but the mirror case is down **26 of 30** and the
lag-1 autocorrelation is **−0.406**, so it is mechanical reversion in a noisy survey, reliable and
economically meaningless. Date `confirmed`; nothing here licenses an entry, and there is no instrument
to enter.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-11) | **Stand aside** | High | `symbols: []` is a measurement re-run this session, not inherited. On Census's own **514** release dates the **overnight gap** — the metric that isolates an **08:30** print — is null on **ITB (2021–26: 0.543% vs 0.486%, p=0.45, n=65; 2016–20: 0.381% vs 0.340%, p=0.50)**, XHB (p=0.82, 0.68), SPY and QQQ across **124** post-2015 release days. It was real through 2015 (ITB p=0.031, then p=0.0027) and decayed. No macro- or housing-keyed house playbook exists — `housing` re-grepped **2026-09-06** across `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** hits. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-09-17** — none exists today |
| This week | **Stand aside; the first new information is 2026-09-16, not this print** | High | The standing edition is **CB26-127** (July data, 08-18) and nothing between now and **09-16** touches it. That session then stacks retail sales + import/export prices (08:30), the **September NAHB HMI** and MTIS (10:00), the VIX expiration, and the **FOMC decision + presser** (14:00/14:30) — and its close is the denominator of this print's overnight gap. | Census re-dating, merging or marking `Suspended` the **2026-09-17** row on `economic-indicators/calendar-listview.html` — today it carries `A202609170830`/`A202608` and the page's only four `Suspended` rows are Steel Imports and the AEIR |
| This month | **Read the 08:30 GDPNow vintage at the R2 rung (≈0.0726pp), expect a mechanical rebound print (≈1,342K), and do NOT score this morning's ITB gap** | Medium | Three separate reads, each registered: the ladder's first out-of-sample test (`-1`, `-2`), the mean-reversion base rate (`-4`), and an explicitly *uninformative* tape observation (`-3`). Medium rather than high because `-1` tests a post-hoc positional split on its first instance, and because the corridor's 1.579% bar cannot be calibrated for this date's configuration at **n=3** in-era. | The 2026-09-17 08:30 vintage moving \|Δ residential\| **below 0.0250pp** — the post-quarter rung's median — which would put an R2 vintage in the R3 band and force the ladder to be re-derived |
| This quarter | **Stand aside, and stop carrying one number for this release** | High | The corridor's **0.0609pp** is the blend of three rungs that differ from each other at p=0.038 and p<0.0001, so it describes no actual vintage. The ladder survives three controls: the pooled-vintage and construction-spending ladders both hump rather than decline, and starts beat every other release at **every** rung. 09-17 is 2026:Q3's last in-quarter starts vintage; the final Q3 nowcast is 10-28 and Q4 opens 10-29. | The pooled non-starts ladder turning monotone-decreasing on a longer archive, which would make the shape a property of the nowcast calendar rather than of this release |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** The homebuilder open-gap edge is measured dead
  since 2016 on **124** release days, and no housing-keyed playbook exists. Research is not action.
- **Size the expected nowcast move to the rung, not the release: 0.0726pp, not 0.0609pp.** Registered as
  `-1`, on the side that would reveal the ladder is wrong.
- **This vintage is solo, so attribution is high but not perfect** — R2-solo puts residential largest
  **33/35 = 94.3%** against a **20.7%** base rate, below R3-solo's 35/35. Registered as `-2`.
- **Treat this morning's ITB gap as unreadable, in both directions.** Registered as `-3` with its
  exceedance rates stated up front precisely so a breach cannot be mistaken for a kill.
- **Expect the headline to rebound, and do not read anything economic into it** — after a ≤−10% month,
  post-2010 starts are up **15 of 17**; after a ≥+10% month they are down **26 of 30**. Registered as `-4`.
- **The cliff does not reach this print.** PL 119-103 funds through **2026-12-11**, **85 days** out; all
  **9** of 514 out-of-month slips since 1984 are lapse slips.
- **Watch (dated)** — CPI **09-11** · buyback blackout opens **09-12** · 20y bond **09-15** ·
  **09-16: retail sales + import/export prices 08:30, NAHB HMI + MTIS 10:00, VIX expiration, FOMC
  decision 14:00** · **09-17 08:30 this print + its solo GDPNow vintage** · BOJ + opex **09-18** ·
  revised permits + new-home sales **09-24** · M3 advance **09-25** · Q2 third estimate + AEIR **09-30** ·
  construction spending **10-01** · September data **10-20** (the clean tape instance) ·
  final Q3 nowcast **10-28** · CR expiry **12-11**.

## Initial research

### The question, plainly

This id reached the calendar as a single `EST:` proposal from
[`construction-spending-2026-10-01`](construction-spending-2026-10-01.md)'s sweep, which argued that the
series is nearly untracked in this corridor and that "the September edition — the one closest to today at
D-11 — is nothing at all."

Two sibling lanes have already dismissed it, on the record and for different reasons. The
[12-17 lane](housing-starts-2026-12-17.md) declined all three routine 2026 editions — "an edition earns a
row only when it is *distinguishable*, and these are not." The [10-20 lane](housing-starts-2026-10-20.md)
then named 09-17 as one of three dated chances to fire its tape kill switch and immediately disqualified
it: "09-17 sits the morning after the **09-16 FOMC** and is dirty by that lane's own wording."

**Is this edition distinguishable after all; does the corridor's positional nowcast finding place it
where the 10-20 lane implied; and is "dirty" a measurement or an assumption?**

**One-line verdict:** distinguishable on both counts — the positional finding is a **three-rung ladder**
rather than a two-state step, and this print sits on the rung that is **louder** than the number the
corridor carries; and "dirty" is an assumption that does not survive measurement, though the conclusion
it supported does, for a different and better reason.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies to the event; the caches were busted anyway
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because the tape work
below runs through `market-data.mjs`'s Yahoo path. Every source fetched direct on **2026-09-06**:

1. **`census.gov/economic-indicators/calendar-listview.html`** (HTTP 200, 91,396 bytes, **179** rows
   parsed) — every 2026 Census release with its code, reference month and any `Suspended` marker.
2. **`census.gov/construction/soc/schedule.html`** (HTTP 200, 59,625 bytes) — the Survey of
   Construction's own program calendar.
3. **`census.gov/construction/xls/historic_release_dates.xls`** (HTTP 200, 55,808 bytes) — **514
   reference months, 1984-01 → 2026-11**.
4. **`census.gov/construction/nrc/pdf/newresconst.pdf`** (HTTP 200, 322,067 bytes) — release
   **CB26-127**, read from its own decompressed text rather than from a sibling's summary — and
   **`/construction/nrc/announcements.html`** (HTTP 200, 104,645 bytes).
5. **`GDPTrackingModelDataAndForecasts.xlsx`** (**10,875,424 bytes**) — `ContribArchives`, **1,871
   vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas**. **`GDPNowcastDataReleaseDates.xlsx`**
   (**16,944 bytes**) — `PostedUpdates`, **82** dated rows.
6. **`federalreserve.gov/monetarypolicy/fomchistorical{2006…2020}.htm`** (fifteen pages, all HTTP 200)
   and **`/fomccalendars.htm`** (HTTP 200, 164,831 bytes) — **167** scheduled FOMC decision days
   2006–2026. This source is new to the corridor.
7. **`nahb.org/…/nahb-wells-fargo-housing-market-index-release-dates`** (HTTP 200, 46,943 bytes) — the
   publisher's 2026 HMI schedule, for the adjacency sweep's one proposal.
8. **Yahoo daily bars** for ITB, XHB, SPY, QQQ and `^VIX`, with 20,000-iteration permutation tests on
   medians. **FRED CSV** — `HOUST`, `PERMIT`, `MORTGAGE30US`.

**Cross-checks that this session read the same tape and the same archives as its siblings.** Daily closes
on **2026-09-04**: SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB **103.25**, VIX **14.53**, and FRED
`MORTGAGE30US` **6.71%** (2026-09-03) — matching the 10-20 and 12-17 ledgers exactly. From
`ContribArchives`, the starts figure **0.0609pp vs 0.0058pp** (n=143), the solo **96/100**, the **20.7%**
base rate, in-quarter **0.0869pp** (n=95) and post-quarter **0.0250pp** (n=48) at **3.48×**, the pooled
control **1.42×** (0.0084 vs 0.0059, p=0.057) and construction spending's flat **p=0.867** all reproduce
the 10-20 ledger. From Census's release-date file, **514** reference months and **9** out-of-month slips
reproduce it too. On the tape, ITB **0.575% / 0.447%** (n=239), XHB **0.544% / 0.441%**, SPY p=0.63,
QQQ p=0.93, and the full era table (ITB 1.104/0.766 p=0.031 · 0.615/0.400 p=0.0027 · 0.381/0.340 p=0.50 ·
0.543/0.486 p=0.45) match to the digit on an independent permutation seed.

**Three differences from sibling numbers, recorded rather than silently differed.**

- **The 1.579% threshold is a percentile convention, not a different distribution.** This session's
  2021–26 ITB release-day quantiles are **p50 0.543%, p75 0.834%, max 2.801%, n=65** — identical — but
  **p90 reads 1.397%** under a floor-index convention and **1.579%** under nearest-rank (index 58 of 65;
  the sorted tail runs …1.351, 1.397, **1.579**, 1.613, 1.850…). Both siblings state 1.579%, so this
  session **adopts 1.579%** as the corridor's threshold and records the convention so the next lane does
  not rediscover the gap.
- **Existing-home sales.** The 10-20 ledger reports n=140 with a median of 0.0376pp and an in/post split
  of 0.0308 vs 0.0543. Matching `Data releases` on the literal string `Existing-home sales` — the only
  spelling that occurs — this session finds **n=124**, median **0.0343pp**, in-quarter **0.0391pp**
  (n=79) vs post-quarter **0.0308pp** (n=45), **p=0.178**. Nothing downstream in either ledger depends on
  it; it is flagged because a sibling's control has moved and the direction of its split reverses.
- **The FOMC set is reconstructed, not published as a list.** **167** scheduled decisions 2006–2026,
  against 168 expected (21 × 8) less the cancelled March 2020 meeting = 167. The one cross-month meeting
  the historical pages abbreviate differently (2012-07-31 → 08-01) was added by hand after the parse
  found 166; it touches no release day.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed` on four primaries

One more primary than any promotion this corridor has made.

The bureau-wide calendar carries the row with its machine codes:

> New Residential Construction (Building Permits, Housing Starts, and Housing Completions) |
> **September 17, 2026** | 8:30 AM | **August 2026** | `A202609170830` | `A202608`

The *program's* schedule carries it independently, under the column heads "(12th Workday) New Residential
Construction - 8:30 a.m." and "(17th Workday) Revised Building Permits - 8:00 a.m. / New Residential
Sales - 10:00 a.m.":

> **August 2026** | **September 17, 2026** | **September 24, 2026**

Census's 42-year release-date file carries it a third time: reference **2026-08** → NRC **2026-09-17**,
NRS **2026-09-24**. And the fourth is the strongest kind — **the standing release names its own
successor**. CB26-127's front page reads, verbatim:

> Building Permits: 1,443,000 · Housing Starts: 1,239,000 · Housing Completions: 1,212,000 ·
> **Next Release: September 17, 2026**

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `CENSUS:`,** on the two-primary precedent this
calendar carries for `durable-goods-2026-11-25`, `m3-full-report-2026-12-03` and the 10-20 sibling. Per
the lane's hard limits a flip requires a primary source and these are four; per the date policy it
licenses nothing. A non-Census source corroborates: the Atlanta Fed's `PostedUpdates` schedules a GDPNow
vintage at **2026-09-17 08:30** reading **"Housing starts"** and nothing else.

**Two facts about the date that matter later.** It is the **12th** workday of September 2026 — the modal
landing (362 of 505 on-schedule releases; no September holiday pushes it, unlike October's Columbus Day).
And **2026-09-17 is the only Census release of any kind that day** on the 179-row calendar — the previous
day carries two (retail sales 08:30, MTIS 10:00).

### Leg 2 — the nowcast · **SUPPORTED and sharpened**: the step is a ladder, and this print is its middle rung

This is the leg that makes the edition distinguishable, and it is a *refinement* of the sibling's finding
rather than a contradiction of it.

**What is inherited.** The 12-17 ledger established that `SplicedNewHousingConstruction` is *construction
spending's* ticker and that housing starts enters GDPNow through the **activity factor**. The 10-20 ledger
established the positional split. Both reproduce here exactly (above). This session takes the wiring as
given and pushes on one loose end the 10-20 lane left in writing:

> "A post-quarter starts vintage delivers the quarter's *third* month into a nowcast that has already
> absorbed the first two; an in-quarter one reshapes a quarter still mostly unobserved. **This session did
> not test that explanation and does not claim it.**"

**That mechanism makes a testable prediction the binary split cannot: a gradient.** If the driver is *how
much of the quarter the nowcast has already absorbed*, then each successive vintage inside the quarter
should move residential less than the last — not merely less once the quarter closes.

**The archive has exactly the structure needed to test it.** Housing starts produces one vintage per
nowcast quarter at each of **three** positions and no others (`dq` = release date minus quarter end):

| Rung | `dq` range | Release months | n | median \|Δ residential\| | residential largest | solo n | solo median |
|---|---|---|---|---|---|---|---|
| **R1** — quarter's 2nd month | −45 … −19 | 02 / 05 / 08 / 11 | 48 | **0.1020pp** | 38/48 | 30 | 0.1167pp |
| **R2** — quarter's 3rd month | −15 … −5 | 03 / 06 / 09 / 12 | 47 | **0.0726pp** | 39/47 | 35 | 0.0650pp |
| **R3** — month after quarter end | +9 … +57 | 01 / 04 / 07 / 10 | 48 | **0.0250pp** | 37/48 | 35 | 0.0209pp |

**Monotone, and each step measures.** p(R1 vs R2) = **0.0377**; p(R2 vs R3) = **<0.0001**. Within the
in-quarter set alone the Spearman rank correlation between `dq` and \|Δ residential\| is **−0.272**
(n=95). The sibling's "in-quarter 0.0869pp" is a blend of two rungs that differ from each other at
p=0.038, and the corridor's unconditional **0.0609pp** describes no actual vintage at all — it is the
average of 0.1020, 0.0726 and 0.0250.

**Two controls, and both fail to reproduce the shape — which is the point.** A monotone decline across a
nowcast quarter could be a property of the *calendar* (later vintages are quieter because the quarter is
better known, for every release). It is not:

| Ladder | R1 | R2 | R3 | shape |
|---|---|---|---|---|
| **Housing starts** | **0.1020** (n=48) | **0.0726** (n=47) | **0.0250** (n=48) | **monotone decline** |
| All non-starts vintages | 0.0056 (n=850) | 0.0105 (n=247) | 0.0049 (n=582) | hump (p(R1vR2)=**0.011**) |
| Construction spending, own positions | 0.0369 (n=36) | 0.0776 (n=45) | 0.0632 (n=43) | hump (p=**0.013**, then p=0.247) |

Both controls *rise* into the quarter's last month and fall after it. Only starts declines throughout.
And starts beats every other release at **every** rung, so the ladder is not an artifact of which
releases happen to sit where.

**Where 2026-09-17 sits.** `PostedUpdates` gives the vintage as **2026-09-17 08:30, "Housing starts",
solo** — `dq = −13`, an **R2** vintage, and the **last in-quarter starts vintage of 2026:Q3** (the
remaining Q3 vintages are 09-25 M3-advance, 09-30 AEIR, then the post-quarter run to the final Q3 nowcast
on 10-28). The number to carry is **0.0726pp** pooled, or **0.0650pp** on the tightest matching cut
(R2 + solo, n=35) — **both above** the corridor's 0.0609pp, and roughly **2.9×** the figure the 10-20
lane derived for its own date.

**The seasonal cut agrees but does not sharpen.** All **12** September starts vintages in the archive
(2014–2025, every one at `dq` −9 to −13, so every one an R2) carry a median of **0.0448pp** with
residential largest **10 of 12** — quieter than the pooled R2 figure, but **p=0.139** against the other
R2 months, so it is not distinguishable and the pooled number is the honest one. The two September misses
are instructive: 2017-09-19 shared its slot with import/export prices (net exports led), and 2021-09-21
was **solo** and still led by PCE at a tiny 0.0031pp — the one clean counterexample to the attribution
claim, and the reason `-2` is registered at 94.3% rather than 100%.

**And this print is the ladder's first out-of-sample test.** The 10-20 lane registered
`FT-housing-starts-2026-10-20-1` as the positional split's first instance, scoring **2026-10-23**. This
vintage posts **2026-09-17** and scores **09-18** — **33 days earlier**, on the opposite rung. Whichever
way it lands, the corridor learns the direction first from here.

### Leg 3 — the tape · **REFUTED as an edge, and "dirty" refuted as a description** — but the exclusion stands

The 10-20 lane's kill-switch schedule turns on whether this morning is clean. It asserted, without
measurement, that it is not. Both halves of that deserved a number.

**The pre-specified metric** is the **overnight gap** — \|open ÷ prior close − 1\| — because the print
lands at **08:30**, an hour before the open. The base study reproduces the siblings exactly:
full-history ITB **0.575% vs 0.447%** (n=239, **p=0.0015**), XHB 0.544/0.441 (p=0.0055), SPY p=0.63,
QQQ p=0.93; by era ITB **2006–09 p=0.031**, **2010–15 p=0.0027**, **2016–20 p=0.50**, **2021–26 p=0.45**,
with XHB the same shape. **The edge was real and died in 2015**, n=124 across two null eras.

**Now the three conditions that make this morning supposedly dirty, each measured on release days:**

| Condition on a release day | n | ITB gap | other release days | p |
|---|---|---|---|---|
| **Session after a scheduled FOMC decision** | **10** | **0.539%** | 0.576% (n=229) | **0.875** |
| **Monthly opex eve** | **42** | **0.565%** | 0.575% (n=197) | **0.936** |
| **September** | **20** | **0.346%** | 0.576% (n=219) | **0.205** |

**None of them measures, and the September one points the wrong way.** XHB agrees: opex eve p=0.184,
September p=0.092 — again *quieter*. The within-September control agrees too (release vs non-release
September sessions: ITB p=0.326, XHB p=0.180). The 12-17 lane's one live tape finding — December opex
eve widening ITB (0.782% vs 0.398%, p=0.021) — does **not** generalise to opex eve as a class, which this
session tests directly rather than by proxy (the 10-20 lane tested days *after* opex, a different
condition, and also found null).

**The day-after-FOMC effect is real; it just is not there on release days.** Across all sessions, the
morning after a scheduled decision is genuinely wider — ITB **0.577% vs 0.451%**, XHB 0.610/0.440, SPY
0.390/0.274, QQQ 0.520/0.383 (n≈163). It simply does not show up in the ten-observation intersection with
release days, and n=10 is why.

**What actually disqualifies 09-17 is calibration, not width.** The corridor's kill switch is a
**threshold** (1.579%, the 2021–26 release-day p90), so what matters is the *exceedance rate* under this
date's configuration, and that is where the small samples bite:

- The exact 2026 shape — a release day that is **both** the session after an FOMC decision **and** opex
  eve — has occurred **7 times**: 2014-09-18 (0.00%), 2017-03-16 (0.34%), 2020-09-17 (1.66%),
  2020-12-17 (1.40%), 2021-12-16 (0.52%), 2022-03-17 (0.09%), 2022-06-16 (2.80%). Median **0.52%**;
  **2 of 7 (28.6%)** clear 1.579%.
- Across all **10** after-FOMC release days, **3 of 10 (30%)** clear it, against the **10%** a p90 implies
  by construction. Binomial p ≈ **0.07** at n=10 — suggestive, not established.
- Restricted to the **2021–26** era that *set* the threshold, the configuration has **n=3**
  (2021-12-16, 2022-03-17, 2022-06-16). There is no in-era calibration to be had.

**So the exclusion the 10-20 lane made is correct and its reason is not.** 09-17 is not measurably wider
than any other release day; it is a morning whose exceedance base rate cannot be pinned down in the era
that defined the bar. A gap above 1.579% here would be as consistent with the FOMC stack as with a live
housing effect, and a gap below it proves nothing the other 65 quiet days have not already proved. The
honest handling is to register the observation with its base rates stated in advance (`-3`) and to leave
**10-20 as the clean instance** — which is exactly where the sibling put it.

### Leg 4 — the content · **SUPPORTED, and immediately drained of meaning by its own control**

Neither sibling read this release for what it will *say*. At D-11 that becomes the most useful leg
available, and its answer is unusually clean.

**The standing edition, read from its own text.** CB26-127, July 2026 data, released 2026-08-18:

- **Building permits 1,443,000** SAAR — **+5.0%** from a revised June 1,374,000, **+3.1%** y/y.
  Single-family **894,000** (+2.5% from a revised 872,000); five-plus **490,000**.
- **Housing starts 1,239,000** — **−12.4% (±9.5%)** from a revised June 1,415,000, **−13.5% (±11.0%)**
  y/y. Single-family **808,000**, −9.9% (±10.4%)\*; five-plus **421,000**.
- **Housing completions 1,212,000** — −9.1% (±10.2%)\* from a revised June 1,333,000, −16.8% (±13.7%) y/y.
  Single-family 878,000, −5.8% (±8.7%)\*; five-plus 329,000.

The asterisk is Census's own: *"\* The 90 percent confidence interval includes zero. In such cases, there
is insufficient statistical evidence to conclude that the actual change is different from zero."* **Three
of the six** headline changes carry it.

**The conditional base rate.** FRED `HOUST` monthly changes over the last ten years (n=120): median
\|m/m\| **4.95%**, p75 **9.85%**, p90 **14.41%**, max 26.07% — so July's −12.44% sits near the 85th
percentile of monthly moves. Conditioning on exactly that:

| Condition | n | next month, median m/m | next month positive |
|---|---|---|---|
| **After a m/m drop ≤ −10%**, post-2010 | **17** | **+8.35%** | **15 / 17 = 88.2%** |
| After a m/m drop ≤ −10%, full history (from 1959) | 73 | +5.95% | 56 / 73 = 76.7% |
| Unconditional, post-2010 | 199 | +0.70% | 105 / 199 = 52.8% |

**+8.35% on 1,239,000 implies ≈1,342K.** Seventeen for seventeen would be a striking housing signal.

**The symmetric control says it is not a housing signal at all.** After a m/m **rise** of ≥+10%, post-2010
starts are **negative 26 of 30 (86.7%)** with a median of **−8.56%** — a mirror image. The lag-1
autocorrelation of post-2010 monthly changes is **−0.406** (n=199). Housing starts is a *sample* survey
whose own 90% interval on the last headline was **±9.5%**; a −12.4% print is substantially sampling noise,
and noise mean-reverts by construction. **The prediction is therefore reliable and economically
meaningless** — it is a statement about an estimator, and this ledger says so rather than dressing it up.
Registered as `-4` on exactly those terms.

**Permits are the quieter twin and are not part of the claim.** FRED `PERMIT` over the same ten years:
median \|m/m\| **3.20%**, p90 **8.24%** — a census of permit-issuing places rather than a sample. Its
last three months read −0.9%, −2.6%, +4.3%. `MORTGAGE30US` stands at **6.71%** (2026-09-03), up from 6.65%
and 6.66% the two prior weeks.

**One discrepancy inherited and confirmed, not re-explained.** FRED's `PERMIT` reads **1,433** for 2026-07
against the release's **1,443**, while June (1,374) matches exactly. The 10-20 lane attributed this to
Census's separate "(17th Workday) Revised Building Permits - 8:00 a.m." release and did not fetch it; this
session reproduces the discrepancy and likewise did not fetch it. **Operationally it means the August
permits number printed 09-17 is revised 09-24**, the same morning as new-home sales.

### Leg 5 — the funding cliff · **not a risk for this date**, and the arithmetic is trivial

Included because two sibling ledgers make it load-bearing and a reader arriving here needs to know it is
not, here.

The base rate re-verifies: of **514** reference months since 1984, **505** were released in the month
following, and **all 9** exceptions belong to a federal funding lapse (2013-09 → 2013-11-26; 2018-12 →
2019-02-26 and 2019-01 → 2019-03-08; and the 2025–26 lapse merging 2025-09 with 2025-10 on 2026-01-09,
2025-11 with 2025-12 on 2026-02-18, and 2026-02 with 2026-03 on 2026-04-29). The response is
**deferral-and-merge**, not deletion — Census's calendar carries exactly **four** `Suspended` rows today
and none is this series, and the announcements page states the merges verbatim ("The October New
Residential Construction release also contains initial estimates for the month of September", and two
more).

`government-funding-deadline-2026-09-30` is marked **RESOLVED — AVERTED** in this calendar on three
primaries, funding through **2026-12-11**. This print lands **D-11 from today and 85 days before the
successor cliff**, with no lapse possible in between absent a rescission. The exposure the 12-17 lane
carries belongs to that edition; here there is nothing to hold.

### The adjacency sweep

- **Peer prints** — n/a for the event, `symbols: []`. ITB **93.91** and XHB **103.25** (2026-09-04 closes)
  were read as a *class* and as Leg 3's subject, never as holdings; neither is tracked by this calendar.
- **Macro surprises** — none since the last row; there is no last row. Unlike the 10-20 edition, which sat
  in an empty corridor, this print is **buried inside the densest week the calendar tracks**: CPI 09-11,
  the buyback blackout opening 09-12, a 20y bond 09-15, then **09-16** carrying retail sales and
  import/export prices at 08:30, the NAHB HMI and MTIS at 10:00, the VIX expiration, and the **FOMC
  decision plus press conference** at 14:00/14:30 — followed by BOJ and September opex on 09-18. That
  09-16 close is the denominator of this print's overnight gap, which is the whole of Leg 3.
- **Volatility regime** — VIX **14.53**, SPY 770.19, QQQ 718.96, ITB 93.91, XHB 103.25 (2026-09-04
  closes). Baseline; nothing to diff against yet, and all five reproduce the sibling ledgers exactly.
- **Geopolitical / policy** — PL 119-103 funds through **2026-12-11**; Leg 5 is the treatment and the
  conclusion is that this date carries no cliff exposure at all.
- **Event tape** — no published consensus for August starts was sought or found from a primary; every
  content statement in Leg 4 is a **base rate conditioned on the last print**, never a forecast, and it is
  labelled as such. `estimate`-vs-`confirmed` does no work here: the date is `confirmed` and still
  licenses nothing.
- **One dated event PROPOSED:** `src/domain/market-events/proposals/nahb-hmi-2026-09-16.from-housing-starts-2026-09-17.json`
  — the **September 2026 NAHB/Wells Fargo Housing Market Index**, 10:00 ET on **2026-09-16**, from NAHB's
  own 2026 HMI Schedule ("Sept. 2026 | September 16, 2026"). The corridor tracks the October, November and
  December editions and has nothing for September — the only one inside the next eleven days. It is
  adjacent in the strongest available sense: the [11-17 HMI ledger](nahb-hmi-2026-11-17.md) measured that
  **71 of 78** HMI release days (91.0%) are the trading day immediately before New Residential
  Construction, and this is that pair for the August reference month. Filed `estimate` per the lane's
  no-self-confirm limit; its expected research outcome is a null, since that lane already measured the
  sentiment channel dead (ITB open→close 0.9559% vs 0.9627%, p=0.96; paired sign test p=1.00).
- **Nothing else proposed, on the record.** The 17th-workday twin (**2026-09-24**, revised permits 08:00 +
  New Residential Sales 10:00) is already `new-home-sales-2026-09-24`; 09-25's M3 advance is
  `durable-goods-2026-09-25`; 09-30's AEIR is `advance-economic-indicators-2026-09-30`; 10-01's is
  `construction-spending-2026-10-01`. The neighbouring editions 10-20, 11-18 and 12-17 all have ledgers.
  A duplicate would be noise, so the sweep's honest output beyond the HMI is a declination.
- **No blocked sources.** `probe-ref.blocked` is empty; every fetch above returned HTTP 200 with the byte
  count recorded in Method. Notably the Yahoo path that hard-429'd the `nahb-hmi-2026-11-17` and
  `existing-home-sales-2026-11-12` lanes served this runner normally — recorded so a future block is read
  as a change, not a constant.

### Honest limits

- **The ladder is a refinement of a post-hoc split, not an out-of-sample test.** The 10-20 lane chose its
  in/post cut *because* `PostedUpdates` showed where its date fell; this session subdivided the in-quarter
  arm of that same cut. It survives two controls that both fail to reproduce the shape, and the monotone
  ordering was not chosen after seeing which rung 09-17 landed on — but a reader should weight it as a
  well-controlled second slice of one archive. `-1` exists precisely so the next instance is
  out-of-sample, and it scores 33 days before the sibling's.
- **n=47 is the load-bearing sample**, and the September cut inside it is n=12. The p=0.038 separating R1
  from R2 is a single test that would not survive a multiple-comparison correction across the many cuts
  run here.
- **The mechanism is still not directly tested.** "How much of the quarter is already observed" now has
  the gradient it predicts, which is evidence for it, not a measurement of it.
- **n=10 and n=7 carry Leg 3's conclusion**, and n=3 carries its in-era version. The 30% and 28.6%
  exceedance rates are point estimates on samples too small to act on; the leg's conclusion is deliberately
  the *absence* of calibration rather than any of those numbers.
- **Mixing eras in Leg 3.** The 1.579% bar is a 2021–26 statistic; the 10 after-FOMC release days span
  2007–2022. That mismatch is stated rather than corrected, because correcting it leaves n=3.
- **The FOMC set is reconstructed from HTML headings**, not from a published machine-readable list, and
  one cross-month meeting was added by hand. It reproduces the expected 167 and touches no release day
  either way, but the tape leg rests on it.
- **Leg 4's base rate is computed on FRED's current revised vintage**, not on first prints. What lands
  09-17 is a *first* estimate of August alongside a revision to July, and the 1,443-vs-1,433 permits gap
  shows this series revises. `-4` is registered against the July figure **as published 2026-08-18** to keep
  it scoreable, and that choice is stated rather than assumed.
- **ITB and XHB are near-duplicates**, not two independent confirmations; their agreement is one
  observation reported twice.
- **The GDPNow vintage archive ends 2026-07-28.** Every contribution measurement stops there.
- **`symbols: []` is doing real work.** Even were Leg 2 twice as strong, this event has no instrument
  attached and no house playbook keyed to it. The nowcast line is a *reading*, not a position.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on four Census primaries).** Stand aside on
2026-09-17 and on every edition of this report. Hold four frames. **On the date:** it is Census's own on
the bureau calendar (`A202609170830`, reference `A202608`), on the Survey of Construction's program
schedule, in Census's 42-year release-date file, and in the standing release CB26-127's own "Next
Release" line, with the Atlanta Fed's vintage calendar corroborating; it is the modal 12th workday and
the only Census release that day. **On the nowcast:** the corridor's positional finding is real and
**finer than the corridor states it** — starts vintages occupy exactly three positions per nowcast quarter
and move the residential contribution **0.1020pp → 0.0726pp → 0.0250pp** (n=48/47/48; p=0.038 and
p<0.0001), monotone, where the pooled non-starts and construction-spending ladders both hump instead
(p=0.011, p=0.013). **2026-09-17 08:30 is an R2 vintage** — `dq = −13`, solo, the last in-quarter starts
vintage of 2026:Q3 — so the number to carry is **0.0726pp** (or **0.0650pp** on the R2-solo cut), *above*
the corridor's unconditional 0.0609pp and ~2.9× the figure derived for 10-20; the sibling's "in-quarter
0.0869pp" is itself a blend of two rungs that differ at p=0.038. Attribution is high but short of the
post-quarter rung's perfection: R2-solo puts residential largest **33/35 = 94.3%** against a 20.7% base
rate. **On the tape:** the homebuilder open-gap edge was real (2006–09 p=0.031; 2010–15 p=0.0027) and has
been **null for eleven years** (2016–20 p=0.50; 2021–26 p=0.45, n=124) on an independent re-run, so
`symbols: []` is a measurement with a date. The "dirty" label this edition carries is an assumption that
does not survive measurement — after-FOMC release days p=0.875, opex eve p=0.936, September p=0.205 and
*quieter* — but the exclusion it justified stands for a better reason: the exceedance rate against the
corridor's **1.579%** bar is **2 of 7** on this date's exact configuration and **3 of 10** on the
after-FOMC set against the 10% a p90 implies, with **n=3** in the era that set the bar. **This morning's
ITB gap is uninformative in both directions and is not a kill-switch observation**; 10-20 remains the clean
instance. **On the content:** July's **−12.4% (±9.5%)** sits near the 85th percentile of monthly moves,
and after a ≤−10% month post-2010 starts rebound **15 of 17** (median +8.35%, implying ≈1,342K) — but the
mirror case falls **26 of 30** (median −8.56%) and the lag-1 autocorrelation is **−0.406**, so this is
mechanical reversion in a survey whose own interval is ±9.5%: reliable, and empty of economic content.
The synthesis is that **this edition is distinguishable in exactly the way its siblings assumed it was
not**, and that the corridor should stop carrying one number for this release. Nothing here licenses an
entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The GDPNow vintage posted 2026-09-17 08:30 moves \|Δ residential\| below 0.0250pp.** An R2 vintage
  landing in the R3 band on the ladder's first out-of-sample instance falsifies Leg 2's central claim, and
  the corridor's unconditional 0.0609pp goes back to being the right number to carry for every edition.
- **Residential is not the largest of the eight component moves on that vintage.** R2-solo 33/35 becomes
  33/36, and the attribution half of the stance needs re-deriving — most likely because the vintage was
  not solo after all (2017-09-19 is the precedent, and 2021-09-21 is the solo counterexample).
- **The pooled non-starts ladder turns monotone-decreasing on a longer archive.** The shape would then be
  a property of the nowcast calendar rather than of this release, and Leg 2's control collapses.
- **ITB's overnight gap on 2026-09-17 exceeds 1.579%.** This does *not* fire the 12-17 lane's kill switch
  — Leg 3's whole finding is that it cannot, here — but it earns a row, because a breach on a morning
  measured null on all three of its confounds is the observation that would make the FOMC-stack
  explanation testable at 10-20 and 11-18.
- **The August 2026 headline starts number prints at or below 1,239,000.** Post-2010 that has happened
  2 of 17 times after a ≤−10% month; a third instance would mean the reversion base rate is weaker than
  measured, or that the July figure was revised up enough to swallow the rebound — either way Leg 4 is
  re-derived rather than patched.
- **Census moves, merges, re-dates or `Suspend`s the 2026-09-17 release on any of its four own sources.**
  The `confirmed` label reverts to `estimate`.
- **A funding lapse begins before 2026-09-17.** PL 119-103 runs through 12-11, so this requires a
  rescission or a superseding act; if it happens, Leg 5 is void and the deferral-and-merge precedent
  becomes live.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-09-17.**
  The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook makes it a live
  question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-housing-starts-2026-09-17-1` — the GDPNow vintage posted **2026-09-17 08:30** moves the residential
  contribution by **0.0250pp or more** in absolute value. Score by 2026-09-18.
- `FT-housing-starts-2026-09-17-2` — on that vintage, \|Δ residential\| is the **largest** of the eight
  component moves. Score by 2026-09-18.
- `FT-housing-starts-2026-09-17-3` — **ITB's 2026-09-17 overnight gap is below 1.579%**, registered as an
  explicitly *uninformative* observation with its exceedance base rates stated in advance. Score by
  2026-09-18.
- `FT-housing-starts-2026-09-17-4` — the **August 2026 headline housing-starts SAAR published 2026-09-17
  exceeds 1,239,000**, the July figure as published 2026-08-18. Score by 2026-09-18.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-11 | **Initial research on an id that existed only as one proposal, and on an edition TWO siblings wrote off — the 12-17 lane as "not distinguishable", the 10-20 lane as "dirty". Both conclusions survive only partly, and the nowcast finding runs OPPOSITE to 10-20's: this print sits on a LOUDER rung than the number the corridor carries.** Canonical `src/domain/market-events/housing-starts-2026-09-17.json` written this session after reading the sole proposal (`from-construction-spending-2026-10-01`), now shadowed. **Leg 1 — the date, SUPPORTED and PROMOTED on FOUR census.gov primaries** (one more than any promotion this corridor has made): `economic-indicators/calendar-listview.html` (HTTP 200, 91,396 bytes, 179 rows) row "New Residential Construction … \| September 17, 2026 \| 8:30 AM \| August 2026", `A202609170830`/`A202608`; `construction/soc/schedule.html` (59,625 bytes) row "August 2026 \| September 17, 2026 \| September 24, 2026"; `construction/xls/historic_release_dates.xls` (55,808 bytes, 514 reference months 1984-01→2026-11) reference 2026-08 → NRC 2026-09-17; and **the standing release itself**, CB26-127 (`newresconst.pdf`, 322,067 bytes), whose front page reads "Next Release: September 17, 2026". `estimate`→**`confirmed`**, `EST:`→**`CENSUS:`** on the `durable-goods-2026-11-25` / `m3-full-report-2026-12-03` / `housing-starts-2026-10-20` precedent; corroborated by the Atlanta Fed `PostedUpdates` 2026-09-17 08:30 row reading "Housing starts" alone. It is the **12th** workday (the modal landing, 362 of 505) and **the only Census release that day**; 09-16 carries two. **Leg 2 — the nowcast, the sibling's STEP is a three-rung LADDER and this print is the middle rung.** The 10-20 lane offered a mechanism it explicitly refused to claim — "a post-quarter starts vintage delivers the quarter's third month into a nowcast that has already absorbed the first two … this session did not test that explanation". That mechanism predicts a gradient, and the archive has the structure to test it: starts vintages occupy exactly **three** positions per nowcast quarter and nothing else — **R1** (`dq` −45..−19, release months 02/05/08/11) n=**48** at **0.1020pp**, **R2** (`dq` −15..−5, months 03/06/09/12) n=**47** at **0.0726pp**, **R3** (`dq` +9..+57, months 01/04/07/10) n=**48** at **0.0250pp** — **monotone**, with p(R1 vs R2)=**0.0377** and p(R2 vs R3)**<0.0001** on 20,000-iteration permutations, and a within-in-quarter Spearman of **−0.272** (n=95). **Two controls both fail to reproduce the shape, which is the finding:** all non-starts vintages hump (0.0056 n=850 / 0.0105 n=247 / 0.0049 n=582, p(R1vR2)=**0.011**) and construction spending on its own three positions humps too (0.0369 n=36 / 0.0776 n=45 / 0.0632 n=43, p=**0.013** then p=0.247) — only starts declines throughout, and starts beats every other release at **every** rung. **`PostedUpdates` (16,944 bytes, 82 dated rows) places 2026-09-17 08:30 as a SOLO R2 vintage at `dq`=−13** — the LAST in-quarter starts vintage of 2026:Q3 — so the number to carry is **0.0726pp** pooled or **0.0650pp** on the tightest cut (R2+solo, n=35), **ABOVE** the corridor's unconditional 0.0609pp and ~**2.9×** the 10-20 figure; the sibling's "in-quarter 0.0869pp" is itself a blend of two rungs separated at p=0.038. Attribution is high but not perfect — R2-solo puts residential largest **33/35 = 94.3%** vs R3-solo's 35/35 and a **20.7%** base rate; the two misses are 2017-09-19 (shared with import/export prices) and **2021-09-21, solo and still led by PCE**. The **12** September starts vintages (2014-2025, every one an R2 at `dq` −9..−13) read a quieter **0.0448pp** with residential largest 10/12 but are **not distinguishable** from other R2 months (**p=0.139**), so the pooled figure is the honest one. **And this is the ladder's FIRST out-of-sample instance, scoring 2026-09-18 — 33 days before `FT-housing-starts-2026-10-20-1`.** Everything inherited reproduces exactly: 1,871 vintages 2014-05-01→2026-07-28 = **1,822** same-quarter deltas, starts n=**143** at **0.0609 vs 0.0058pp**, solo 96/100, base rate 20.7%, in/post 0.0869/0.0250 at 3.48×, pooled control 1.42× (p=0.057), construction spending flat (p=0.867). **Leg 3 — the tape, the edge REFUTED (reproduced) and "dirty" REFUTED as a description, though the exclusion stands for a better reason.** Base study reproduces the siblings to the digit from Census's own 514 dates: full-history ITB **0.575% vs 0.447%** (n=239, **p=0.0015**), XHB 0.544/0.441 (p=0.0055), SPY p=0.63, QQQ p=0.93; eras ITB **2006-09 1.104/0.766 (p=0.031)**, **2010-15 0.615/0.400 (p=0.0027)**, **2016-20 0.381/0.340 (p=0.50)**, **2021-26 0.543/0.486 (p=0.45)**, XHB the same shape — dead since 2015, n=124. **NEW SOURCE: 167 scheduled FOMC decision days 2006-2026 reconstructed from federalreserve.gov's own fifteen historical calendars plus `fomccalendars.htm`** (164,831 bytes). Each of this date's three supposed confounds, measured on release days: **session after an FOMC decision n=10, ITB 0.539% vs 0.576%, p=0.875**; **opex eve n=42, 0.565% vs 0.575%, p=0.936** (XHB p=0.184) — so the 12-17 lane's December-opex-eve finding does NOT generalise to opex eve as a class, tested directly rather than by the 10-20 lane's post-opex proxy; **September release days n=20, 0.346% vs 0.576%, p=0.205** and XHB 0.303/0.554 p=0.092 — *quieter*, with the within-September control agreeing (ITB p=0.326, XHB p=0.180). The day-after-FOMC widening IS real across all sessions (ITB 0.577 vs 0.451, XHB 0.610/0.440, SPY 0.390/0.274, QQQ 0.520/0.383, n≈163); it simply is not there in the ten-observation intersection. **What disqualifies 09-17 is CALIBRATION, not width:** the exact 2026 configuration (after-FOMC AND opex-eve) has occurred **7 times** — 2014-09-18 (0.00%), 2017-03-16 (0.34%), 2020-09-17 (1.66%), 2020-12-17 (1.40%), 2021-12-16 (0.52%), 2022-03-17 (0.09%), 2022-06-16 (2.80%), median 0.52% — clearing the corridor's **1.579%** bar **2 of 7 (28.6%)**, while the after-FOMC release set clears it **3 of 10 (30%)** against the **10%** a p90 implies (binomial **p≈0.07**), and the **2021-26** era that set the bar contributes **n=3**. So this morning's gap is uninformative in BOTH directions, is not a kill-switch observation, and **10-20 remains the clean instance** — the sibling's placement is right, its reason is not. Registered as `-3` with those base rates stated in advance. **Leg 4 — the CONTENT, the first leg in this corridor about what the print will SAY, and its own control drains it of meaning.** CB26-127 read from its own decompressed text: permits **1,443,000 (+5.0%** from revised June 1,374,000, +3.1% y/y), starts **1,239,000, −12.4% (±9.5%)** m/m and −13.5% (±11.0%) y/y, completions 1,212,000 (−9.1% (±10.2%)\* from revised June 1,333,000); Census's own footnote — "\* The 90 percent confidence interval includes zero" — applies to **3 of the 6** headline changes. FRED `HOUST` \|m/m\| over 10y (n=120) median **4.95%**, p75 9.85%, p90 **14.41%**, so July's −12.44% sits near the **85th percentile**. **Conditional base rate: after a m/m drop ≤ −10%, post-2010 starts are positive 15 of 17 (88.2%), median +8.35% — implying ≈1,342K — and 56 of 73 (76.7%) full-history, against 105/199 = 52.8% unconditional.** **The symmetric control kills the economic reading:** after a ≥+10% rise, post-2010 is negative **26 of 30 (86.7%)**, median **−8.56%**, and the lag-1 autocorrelation of m/m is **−0.406** (n=199) — mechanical reversion in a sample survey whose own interval is ±9.5%, reliable and economically empty. Registered as `-4` on exactly those terms, against the July figure **as published 2026-08-18** because FRED's series is the revised vintage. `PERMIT` is the quieter twin (median 3.20%, p90 8.24%) at −0.9%/−2.6%/+4.3% the last three months; `MORTGAGE30US` **6.71%** (2026-09-03). The 1,443-vs-FRED-1,433 permits discrepancy is reproduced and, as with the 10-20 lane, NOT fetched and NOT claimed — operationally, August's permits number printed 09-17 is revised **09-24**. **Leg 5 — the cliff, NOT a risk here:** 505 of 514 released the following month, **all 9** slips lapse-driven, deferral-and-merge not deletion (4 `Suspended` rows today, none this series); `government-funding-deadline-2026-09-30` is **AVERTED** (PL 119-103 through **2026-12-11**), putting this print **85 days** ahead of the successor cliff. **Adjacency sweep — peers:** n/a, `symbols: []`; ITB **93.91** / XHB **103.25** read as a class and as Leg 3's subject. **Macro:** unlike 10-20's empty corridor, this print is buried in the densest week tracked — CPI 09-11, buyback blackout 09-12, 20y bond 09-15, then **09-16** carrying retail sales + import/export prices 08:30, NAHB HMI + MTIS 10:00, the VIX expiration and the **FOMC decision + presser 14:00/14:30**, then BOJ + opex 09-18. That 09-16 close is the denominator of this print's overnight gap, which is the whole of Leg 3. **Volatility:** VIX **14.53**, SPY 770.19, QQQ 718.96 (2026-09-04 closes) — baseline, and all five reproduce the sibling ledgers exactly. **ONE dated event PROPOSED:** `proposals/nahb-hmi-2026-09-16.from-housing-starts-2026-09-17.json` — the **September 2026 NAHB/Wells Fargo HMI**, 10:00 ET **2026-09-16**, from NAHB's own 2026 schedule ("Sept. 2026 \| September 16, 2026", nahb.org HTTP 200, 46,943 bytes). The corridor tracks the Oct/Nov/Dec editions and has **nothing** for September, the only one inside eleven days; the `nahb-hmi-2026-11-17` ledger measured that **71 of 78** HMI days (91.0%) are the trading day immediately before New Residential Construction, and this is that pair for the August reference month. Filed `estimate` per the no-self-confirm limit; its expected outcome is a null, since that lane already measured the sentiment channel dead (ITB open→close 0.9559 vs 0.9627, p=0.96; paired sign test p=1.00). **Nothing else proposed, on the record:** the 17th-workday twin 09-24 is `new-home-sales-2026-09-24`, 09-25 is `durable-goods-2026-09-25`, 09-30 is `advance-economic-indicators-2026-09-30`, 10-01 is `construction-spending-2026-10-01`, and 10-20/11-18/12-17 all have ledgers. **Three differences from sibling numbers, recorded not silently differed:** (1) the **1.579%** kill-switch bar is a percentile CONVENTION — this session's 2021-26 ITB release-day p50/p75/max (0.543/0.834/2.801, n=65) match exactly while p90 reads **1.397%** floor-index and **1.579%** nearest-rank (index 58 of 65; tail …1.351, 1.397, **1.579**, 1.613…), and this session **adopts 1.579%**; (2) **existing-home sales** — the 10-20 ledger reports n=140/0.0376pp with an in/post split of 0.0308 vs 0.0543, while matching the only spelling that occurs (`Existing-home sales`) gives **n=124**, median **0.0343pp**, in **0.0391** (n=79) vs post **0.0308** (n=45), **p=0.178**, a reversed split, nothing downstream depending on it; (3) the **FOMC set is reconstructed**, 167 against 168 expected less the cancelled March-2020 meeting, with 2012-07-31→08-01 added by hand after the parse found 166 — it touches no release day. **No blocked sources**; every fetch returned HTTP 200 at the byte counts recorded, and the Yahoo path that hard-429'd the `nahb-hmi-2026-11-17` and `existing-home-sales-2026-11-12` lanes served this runner normally. **Four forward tests registered:** `-1` (\|Δ residential\| **at or above** 0.0250pp — the ladder's first out-of-sample instance), `-2` (residential is the largest move), `-3` (ITB's gap below 1.579%, registered as explicitly uninformative), `-4` (the August headline prints above 1,239,000). | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on four Census primaries, the corridor's positional nowcast finding SHARPENED from a two-state step into a three-rung monotone ladder (0.1020 → 0.0726 → 0.0250pp, p=0.038 and p<0.0001, with both natural controls humping instead) that places this print on a rung LOUDER than the 0.0609pp the corridor carries and makes it the ladder's first out-of-sample test 33 days early, the "dirty" label REFUTED as a description (after-FOMC p=0.875, opex eve p=0.936, September p=0.205 and quieter) while the exclusion it justified is UPHELD on calibration instead (2 of 7 and 3 of 10 exceedances, n=3 in-era) so that this morning's ITB gap is not a kill-switch observation, and a content leg added that neither sibling attempted — an 88.2% post-2010 rebound base rate that its own symmetric control (26 of 30 the other way, lag-1 −0.406) shows to be mechanical rather than economic.** | 2026-09-13 (low, 0+ band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-housing-starts-2026-09-17.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
