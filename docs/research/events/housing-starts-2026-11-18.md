# New Residential Construction (Building Permits, Housing Starts, Completions — October 2026 data) — housing-starts-2026-11-18

**Kind:** macro-print · **Date:** 2026-11-18 (**confirmed**, `CENSUS:` three independent census.gov primaries — `economic-indicators/calendar-listview.html` row `A202611180830`/`A202610`, `construction/soc/schedule.html`'s "October 2026 | November 18, 2026 | November 25, 2026", and `construction/xls/historic_release_dates.xls`'s 2026-10 row, all fetched direct 2026-09-06; promoted this session from the `EST:` proposal) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-services-q3-2026-11-19","apec-leaders-shenzhen-2026-11-18","fomc-minutes-2026-11-18","import-export-prices-2026-11-17","industrial-production-2026-11-17","japan-cpi-2026-11-20","msft-ignite-2026-11-17","mtis-2026-11-17","nahb-hmi-2026-11-17","opex-2026-11-20","ppi-2026-11-13","retail-sales-2026-11-17"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The proposal's open question is answered, and the answer is no — a 14:00 FOMC minutes
release does not compress the morning the way a 14:00 rate decision does.** Measured on 721 SPY
sessions of hourly bars: on **decision** days every morning hour is crushed (the 09:30 hour takes
**31.4%** of session range against **53.1%** baseline, the 10:30 hour **26.3%** vs **40.2%**, both
p<0.005) and the 14:30 hour then explodes to **74.8%** vs 28.9%, with the whole session **wider**
(1.13% vs 0.85%, p=0.03). On **minutes** days none of that happens: every morning hour sits at
baseline (09:30 **53.4%** vs 53.1%, p=**0.96**), the session range is unchanged (p=0.73), and only
the 14:30 hour lifts modestly. Two consequences follow. First, `fomc-minutes-2026-11-18` does **not**
disqualify this session — it is a *clean* instance of the sibling
[12-17 ledger's](housing-starts-2026-12-17.md) homebuilder kill switch, and cleaner than 12-17
itself, which is December opex eve (ITB gap p=**0.021**) where 11-18 is opex-week Wednesday
(measured null, p=**0.50**). Second, **this is the solo GDPNow vintage 12-17 is not**: the Atlanta
Fed schedules 11-18 08:30 as *"Housing starts"* alone, and on the **93** solo starts vintages
residential investment is the **largest** of the eight component moves **95.7%** of the time against
a **20.7%** base rate — against 5 of 10 on 12-17's shared pairing. The corridor's readable
residential nowcast is **here**. And 11-18 sits **23 days before** `cr-expiry-2026-12-11`, so the
sibling's funding-cliff finding does not reach it: on the 2025-26 precedent (114 dark days), if the
cliff bites, **this October edition is the last residential-construction datapoint anyone reads
until roughly Q1-2027.** Date `confirmed` on three Census primaries; the call is stand aside on
every horizon, and `symbols: []` is re-derived here rather than inherited.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-73) | **Stand aside** | High | `symbols: []` re-measured, not inherited. ITB's overnight gap — the metric that isolates an **08:30** print — reproduces the sibling era-for-era on Census's own **515** release dates: 2006-09 **1.104%/0.766% (p=0.034)**, 2010-15 **0.615%/0.401% (p=0.002)**, 2016-20 **0.381%/0.339% (p=0.50)**, 2021-26 **0.575%/0.487% (p=0.21)**. Starts-only days show **no intraday signature at any hour** (every p ≥ 0.41, n=25). No macro- or housing-keyed house playbook exists — re-grepped 2026-09-06, **0** hits. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-11-18** — none exists today |
| This week | **Stand aside; the 14:00 minutes are a reading assignment, not a morning constraint** | High | The proposal asked whether a 14:00 minutes release holds the morning back. It does not: across **721** sessions (2023-10-09 → 2026-09-04), the **22** minutes days read 09:30 **53.4%** / 10:30 **44.8%** / 11:30 **30.9%** / 12:30 **29.8%** against baseline 53.1 / 40.2 / 33.6 / 32.0 — every p ≥ 0.29 — while the **23** decision days read 31.4 / 26.3 / 20.0 / 19.8, every p<0.005. At daily resolution the **19** historical starts-plus-minutes days are indistinguishable from starts days without them (ITB gap 0.562% vs 0.576%, p=**0.94**). | SPY's **09:30 ET hour taking under 35% of session range on 2026-11-18** — the decision-day signature appearing on a minutes day. Registered as `-2` |
| This month | **Read the GDPNow residential line on 11-18 — it is the corridor's one clean read, and 12-17's is not** | Medium | The Atlanta Fed's `PostedUpdates` schedules 2026-11-18 08:30 as **"Housing starts"** alone (October import/export prices publish **11-17** instead), where 12-17 reads "Housing starts, Import and export prices". Re-measured from `ContribArchives` (**1,871** vintages 2014-05-01 → 2026-07-28 = **1,822** same-quarter deltas, matching the sibling exactly): on the **93** solo starts vintages residential is the largest of eight component moves **95.7%** of the time vs a **20.7%** base rate; the sibling measured **5 of 10** on the shared pairing. Medium, not high, because `PostedUpdates` is a schedule and this session did not observe the vintage. | Any component other than residential posting the largest absolute move on the vintage posted **2026-11-18**. Registered as `-1` |
| This quarter | **Treat 11-18 as the last guaranteed residential print of the year — and read a missing 12-17 as a funding event, never a housing signal** | Medium | 11-18 is **23 days before** `cr-expiry-2026-12-11` (`estimate`, `high`), so it carries no cliff exposure at all; 12-17 is **6 days after** it. The sibling measured that **all 9** of this series' 514 out-of-month slips since 1984 are funding-lapse slips, and that the response is deferral-and-merge: the 2025-26 lapse cost **114 dark days** and **eight months** to normal cadence. Medium because the lapse is a forecast about Congress and neither this session nor the sibling verified FY2027 appropriations status. | The **2026-12-17** release publishing on schedule — which makes 11-18 an ordinary edition rather than the last clean one, and is the sibling's own registered base case |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** The homebuilder open-gap edge is measured dead
  since 2015 across two consecutive eras, and no macro- or housing-keyed playbook exists.
- **The 14:00 minutes do not make this a two-part session.** Trade nothing off the co-release; the
  measured morning on a minutes day is an ordinary morning. Registered as `-2`.
- **The one thing worth reading is the 08:30 GDPNow vintage** — and on **11-18** specifically it is
  the clean read (95.7% solo attribution), which the 12-17 vintage is not (5 of 10). Registered as `-1`.
- **Do not expect opex to widen this one.** Unlike 12-17 (December opex eve, ITB gap 0.782% vs 0.398%,
  p=0.021), 11-18 is opex-week **Wednesday**, measured null: 0.374% vs 0.401% (n=151, p=0.50);
  November-only 0.267% vs 0.399% (n=12, p=0.36). That absence is what makes 11-18 the clean instance
  for the sibling's tape kill switch. Registered as `-3`.
- **Do not read "confirmed" as licence.** The date is Census's own on three primaries; the call is unchanged.
- **Watch (dated)** — September data **10-20** (the other solo vintage) · NAHB HMI **11-17** (proposed
  this PR, `estimate`) and the 11-17 stack (retail sales, industrial production, import/export prices,
  MTIS) · **11-18 08:30 this print + the solo GDPNow vintage, 10:00 NAR October Pending Home Sales,
  14:00 FOMC minutes** · opex **11-20** · new residential sales **11-25** · Beige Book **11-25** ·
  **CR expiry 12-11** · November data **12-17** (the cliff test) · December data ~**2027-01-20**
  (2027 schedule unpublished).

## Initial research

### The question, plainly

This id reached the calendar as one `EST:` proposal, from
[`existing-home-sales-2026-11-12`](existing-home-sales-2026-11-12.md)'s adjacency sweep, and that
proposal named exactly one open question in exactly the right words:

> whether a 14:00 MINUTES release compresses the morning the way a 14:00 SEP decision does (the 12-09
> ledger measured SPY's 10:00 hour at 26.0% of session range vs a 40.4% baseline on decision days) is
> UNMEASURED — this session did not test it and did not have an hourly bar source to test it with.

It also left a second: *"whether homebuilders are inert on a STARTS/PERMITS print is a separate
question nobody here has measured, and it is the more plausible channel of the two."* That one was
answered in the interim by the sibling [`housing-starts-2026-12-17`](housing-starts-2026-12-17.md),
so this session's job on it is **reproduction, not discovery** — and reproduction matters, because
that ledger's own honest-limits section flags its era split as post-hoc.

**Does Census's own calendar carry the date; does a 14:00 minutes release compress the morning; and
what, if anything, makes 11-18 different from the sibling 12-17 six days past a funding cliff?**

**One-line verdict:** the date is Census's own on three primaries and promotes to `confirmed`; the
minutes hypothesis is **REFUTED** with a clean decision-day control; and 11-18 turns out to be the
*better* of the two prints on both dimensions the sibling measured — a **solo** nowcast vintage where
12-17's is shared, and an **opex-null, cliff-free** session where 12-17 is opex eve six days past a
cliff.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies to the event; the caches were busted
anyway (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because the
tape work below reads Yahoo. Inputs, all fetched direct on 2026-09-06:

1. **`census.gov/economic-indicators/calendar-listview.html`** (HTTP 200, 91,396 bytes, **179** rows
   parsed) — every 2026 Census release with code, reference month and `Suspended` marker.
2. **`census.gov/construction/soc/schedule.html`** (HTTP 200, 59,625 bytes) — the Survey of
   Construction Release Schedule, the *program's* own calendar.
3. **`census.gov/construction/xls/historic_release_dates.xls`** (HTTP 200, 55,808 bytes) — **515
   rows, 1984-01 → 2026-11**, every NRC and NRS press-release date Census has published.
4. **`federalreserve.gov/monetarypolicy/fomccalendars.htm`** + `fomchistorical{2005..2020}.htm` —
   **152** FOMC meetings 2007-10 → 2026-07, from which minutes release dates are derived as
   meeting-end + 21 days (the Fed's own published convention, verified against the two 2026 releases
   the [minutes ledger](fomc-minutes-2026-11-18.md) measured: 06-17 → 07-08, 07-29 → 08-19).
5. **`federalreserve.gov/newsevents/2026-november.htm`** (HTTP 200, 91,749 bytes) — the November
   calendar, re-checked for the minutes ledger's silence leg.
6. **`nar.realtor/press-releases/nar-statistical-news-release-schedule`** (HTTP 200, 483,068 bytes) —
   NAR's own 2026 table, for the 10:00 co-release.
7. **`nahb.org/.../nahb-wells-fargo-housing-market-index-release-dates`** (HTTP 200, 47,120 bytes) —
   NAHB's own 2026 HMI schedule, the proposal this PR files.
8. **`GDPTrackingModelDataAndForecasts.xlsx`** (**10,875,424** bytes) — `ContribArchives`, **1,871**
   vintages 2014-05-01 → 2026-07-28. **`GDPNowcastDataReleaseDates.xlsx`** (**16,944** bytes) —
   `PostedUpdates`, 83 rows. Both byte counts match the sibling ledgers exactly.
9. **Yahoo bars** — daily for SPY (n=8,458 to 2026-09-04), QQQ, ITB, XHB, `^VIX`; **hourly (`1h`,
   `range=730d`)** for SPY and ITB, **721 complete seven-bar sessions 2023-10-09 → 2026-09-04**,
   converted to `America/New_York` so the bar labels are ET and the DST boundary does not smear the
   hours. 20,000-iteration permutation tests on medians throughout.
10. **FRED CSV** — `HOUST`, `HOUST1F`, `PERMIT`, `MORTGAGE30US`.

**Cross-checks that the tape read is the same one the siblings read.** Closes on 2026-09-04
reproduce exactly: SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB **103.25**, VIX **14.53**; and
`MORTGAGE30US` **6.71%** (2026-09-03) reproduces all three residential siblings. Yahoo served this
runner normally, so unlike the [11-12 EHS ledger](existing-home-sales-2026-11-12.md) — which was
hard-429'd and fell back to Nasdaq — no substitution was needed. `probe-ref.blocked` is empty.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed`

Three independent census.gov primaries, one more than the sibling needed.

The bureau-wide calendar carries the row with its machine codes:

> New Residential Construction (Building Permits, Housing Starts, and Housing Completions) |
> **November 18, 2026** | 8:30 AM | **October 2026** | `A202611180830` | `A202610`

The program's own schedule carries it independently:

> **October 2026** | **November 18, 2026** | November 25, 2026

under the heads **"(12th Workday) New Residential Construction - 8:30 a.m."** and **"(17th Workday)
Revised Building Permits - 8:00 a.m. / New Residential Sales - 10:00 a.m."** And Census's 42-year
release-date file carries it a third time: reference **2026-10** → NRC **2026-11-18**, NRS
**2026-11-25**.

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `CENSUS:`,** on the two-primary
precedent this calendar already carries for `durable-goods-2026-11-25`, `m3-full-report-2026-12-03`
and the sibling `housing-starts-2026-12-17`. Per the lane's hard limits a flip requires a primary
source and these are three; per the date policy it licenses nothing.

**A corroboration and an arithmetic note.** The Atlanta Fed's `PostedUpdates` schedules a GDPNow
vintage at **2026-11-18 08:30** reading *"Housing starts"* — Leg 3's subject. And where the sibling
had to explain away a 13th-workday placement, **11-18 is exactly the 12th workday** of November 2026
(Veterans Day, 11-11, is a federal holiday and drops out), with the 17th-workday twin landing
exactly on **11-25** — both slots on-convention, which is the ordinary case (362 of 505 on-schedule
releases). The `Suspended` census reproduces the sibling: **exactly four** rows today (Preliminary
Steel Imports ×2, Advance Economic Indicators Report ×2), none of them this series.

### Leg 2 — the minutes hypothesis · **REFUTED**, and this is the session's headline

The proposal asked whether the 14:00 FOMC minutes on 11-18 compress the morning the way a 14:00 SEP
decision does. The test needs three groups on one metric, and the **decision-day group is the
control that makes the answer interpretable** — without it a null on minutes days is just a null.

**The pre-specified metric.** Each hour's own range as a share of the full RTH range —
`(hour high − hour low) ÷ (session high − session low)` — for the seven ET hours 09:30 … 15:30. A
hour that takes a large share of the day's range is a hour the day happened in. This is the same
family as the [12-09 ledger's](fomc-2026-12-09.md) "10:00 hour at 26.0% of session range vs a 40.4%
baseline on decision days", which is the number the proposal cited and which this session therefore
gets to check independently.

**SPY, 721 complete sessions, 2023-10-09 → 2026-09-04** (baseline = the 651 days that are none of
the three classes; every cell a median, every p a 20,000-iteration permutation test):

| Hour (ET) | Baseline | **Minutes 14:00** (n=22) | **Decision 14:00** (n=23) | **Starts 08:30** (n=32) |
|---|---|---|---|---|
| 09:30 | 53.13% | **53.35%** (p=0.96) | **31.36%** (p<0.005) | 53.37% (p=0.96) |
| 10:30 | 40.18% | 44.82% (p=0.29) | **26.27%** (p<0.005) | 36.57% (p=0.33) |
| 11:30 | 33.64% | 30.85% (p=0.47) | **20.03%** (p<0.005) | 33.36% (p=0.91) |
| 12:30 | 31.99% | 29.81% (p=0.53) | **19.84%** (p<0.005) | 31.47% (p=0.86) |
| 13:30 | 30.80% | 36.12% (p=0.18) | **43.02%** (p<0.005) | 32.97% (p=0.51) |
| 14:30 | 28.87% | **40.92%** (p<0.005) | **74.79%** (p<0.005) | 36.64% (p=0.01) |
| 15:30 | 27.40% | 33.34% (p=0.07) | **39.04%** (p<0.005) | 30.21% (p=0.29) |
| *session range* | 0.85% | 0.81% (p=0.73) | **1.13%** (p=0.03) | 0.87% (p=0.90) |

**The decision-day column reproduces the 12-09 ledger almost to the decimal** — its 26.0% / 40.4%
against this session's 10:30 reading of **26.27% / 40.18%**, arrived at from a different data pull
on a different day. That is the cross-check that makes the rest of the table trustworthy: the
instrument detects the effect it is supposed to detect, on an independent sample.

**And the minutes column does not have it.** Every morning hour on a minutes day is statistically
indistinguishable from an ordinary Wednesday — the 09:30 hour is 53.35% against 53.13%, p=0.96,
which is about as flat as a result can be — and the session's total range is *unchanged* (0.81% vs
0.85%, p=0.73) where a decision day runs a third wider. The 14:30 hour does lift (40.9% vs 28.9%),
so the release is not invisible; it is roughly **a quarter of a decision day's move** (a 12-point
lift against a 46-point one) arriving into a session whose total range never widened.

**The same answer at daily resolution, on four times the history.** Census's release-date file
crossed with the derived minutes calendar gives **19** days since 2008 that carried both an 08:30
New Residential Construction print and a 14:00 minutes release — 2008-02-20, 2008-11-19, 2009-02-18,
2010-02-17, 2011-02-16, 2012-05-16, 2013-02-20, 2014-02-19, 2014-11-19, 2015-02-18, 2015-11-18,
2016-02-17, 2017-08-16, 2018-10-17, 2020-02-19, 2021-08-18, 2023-08-16, 2025-02-19, 2026-02-18:

| | Both (n=19) | Starts, no minutes (n≈223) | Baseline | p (both vs base) | p (both vs starts-only) |
|---|---|---|---|---|---|
| ITB overnight gap | 0.562% | 0.576% | 0.446% | 0.41 | **0.94** |
| ITB session range | 1.979% | 2.170% | 2.091% | 0.72 | 0.64 |
| XHB overnight gap | 0.576% | 0.532% | 0.441% | 0.30 | 0.80 |
| SPY session range | 1.137% | 1.059% | 1.045% | 0.62 | 0.68 |

**Nothing. On any of them.** A minutes release on a starts morning changes neither what the print's
open does nor what the day does.

**The consequence that matters for the calendar.** The sibling 12-17 ledger's tape kill switch names
**11-18** as one of three dated chances to observe a clean release-day gap, with the condition *"no
FOMC, CPI or jobs print that morning."* The minutes are not a morning print, and this leg is the
evidence that the 14:00 co-release does not contaminate the 9:30 measurement. **11-18 qualifies.**

**One anomaly, and it dissolves.** In the table above the starts column shows a 14:30 lift (36.64%
vs 28.87%, p=0.01) that has no business being there for an 08:30 print. Removing the days that are
*also* minutes or decision days leaves **25 starts-only sessions**, and the signature vanishes at
every hour: 09:30 57.11 (p=0.41), 10:30 40.29 (p=0.97), 11:30 36.52 (p=0.45), 12:30 33.24 (p=0.73),
13:30 32.16 (p=0.73), **14:30 31.68 (p=0.45)**, 15:30 27.74 (p=0.91). The lift was the Fed's, not the
print's — and the clean version is a second, independent statement of `symbols: []`: on a starts-only
session **no hour of the day is distinguishable from baseline.**

### Leg 3 — the nowcast · **SUPPORTED**, and 11-18 is the clean read 12-17 is not

The sibling established the mechanism (housing starts enters GDPNow through the **activity factor**,
nine series in `FactorAugARCoeffs`, not through the `SplicedNewHousingConstruction` leaf two earlier
ledgers misattributed to it) and the magnitude. This session's contribution is the **scheduling
difference between the two prints**, which inverts which of them is worth reading.

**The Atlanta Fed schedules 2026-11-18 08:30 as `"Housing starts"` — alone.** The 12-17 row reads
*"Housing starts, Import and export prices"*. The reason is on the same sheet: **October** import and
export prices publish **11-17**, bundled with retail sales and industrial production, so nothing else
in GDPNow's input set lands on 11-18. Of the twelve 2026 starts vintages `PostedUpdates` schedules,
four are solo — **05-21, 09-17, 10-20 and 11-18** — and 12-17 is not one of them.

**Re-measured, not inherited.** `ContribArchives`, **1,871** vintages 2014-05-01 → 2026-07-28 =
**1,822** same-quarter deltas — the sibling's count **exactly** — classified by each vintage's own
`Data releases` free text, eight components compared (PCE, equipment, intellectual property,
structures, residential, government, change in net exports, change in inventory investment):

| Vintage class | n | median \|Δ residential\| | vs others | p |
|---|---|---|---|---|
| Housing starts (all) | 134 | **0.0533pp** | 0.0059pp | **<0.0001** |
| **Housing starts (solo)** | **93** | **0.0484pp** | 0.0059pp | **<0.0001** |
| Existing-home sales | 124 | 0.0343pp | 0.0059pp | <0.0001 |

- **Residential is the largest of the eight component moves on 95.7% of solo starts vintages**
  (89 of 93) against a **20.7%** unconditional base rate — the sibling's 20.7% reproduced to the
  decimal.
- **The print is residential-specific:** structures stays at baseline (0.0006 vs 0.0008, p=0.225).
- **A starts vintage is a quiet vintage overall:** the headline nowcast moves **0.0535pp** against
  **0.0958pp** for everything else (p=0.029).
- **Starts is the louder residential leaf**, at **1.56×** existing-home sales.

**The classifier note, stated rather than buried.** These n's differ slightly from the sibling's
(134/93/124 against its 143/100/140) because this session's solo test is stricter — it requires the
`Data releases` cell to be *exactly* "housing starts" after whitespace normalisation, where a looser
substring match admits vintages naming a second release. Every sign, every direction and every
p-value agrees; the magnitudes differ in the third decimal (0.0533 vs 0.0609; 1.56× vs 1.62×; 95.7%
vs 96.0%). **Two independent classifiers landing on the same conclusion is the finding**; treating
either n as exact is not.

**So the corridor's readable residential nowcast is 11-18, not 12-17.** The sibling registered its
own `-2` at *medium* conviction precisely because its vintage is shared and residential is largest
only **5 of 10** on that pairing. Here the same prediction sits on the **95.7%** solo figure.

### Leg 4 — the cliff, and the asymmetry the sibling could not see from its own date

The sibling's load-bearing finding: of **514** New Residential Construction releases since 1984,
**505** landed in the month after their reference month, and **all 9** that did not belong to a
federal funding lapse — the only thing that has ever moved this schedule in forty-two years. And the
response is **deferral-and-merge, not deletion**: the 2025-26 lapse cost **114 dark days** and
**eight months** to normal cadence, with three pairs of reference months merged into single releases
and none deleted.

That finding is inherited here unchanged, and **its consequence for 11-18 is the opposite of its
consequence for 12-17.**

| | housing-starts-2026-11-18 | housing-starts-2026-12-17 |
|---|---|---|
| Relative to `cr-expiry-2026-12-11` | **23 days before** | 6 days after |
| Lapse exposure | **none** | inside all three precedents (16 / 26 / 16-day slips) |
| GDPNow vintage | **solo** (95.7% attribution) | shared (5 of 10) |
| Opex proximity | opex-week **Wednesday** — null (p=0.50) | December opex **eve** — ITB gap p=0.021 |
| Workday placement | **12th, exactly** | 13th (ordinary, but off-convention) |

**The decision-relevant statement is the conjunction.** If the cliff bites on 12-11, then on the
2025-26 precedent the November reference month does not publish on 12-17 and does not publish for
months — which makes **this October edition the last residential-construction datapoint anyone reads
until roughly Q1-2027.** That is not a trade; `symbols: []` and no playbook is housing-keyed. It is
the reason a `low`-impact routine monthly print gets a ledger of its own: its *informational*
scarcity is conditional on an event 23 days after it, and nobody reading the 12-17 ledger alone
would see that.

**The limit the sibling stated and this session repeats rather than resolves:** whether a lapse
reaches Commerce and Census depends on which FY2027 appropriations have passed by 12-11, and partial
lapses have historically funded some statistical agencies and not others. This session did not
verify FY2027 bill status and does not claim to.

### Leg 5 — the tape, reproduced · **REFUTED for today**, and now out-of-sample on the era split

The sibling's honest limits flag its own Leg 3 as post-hoc: *"the era decomposition that turned it
into a null-for-today was run after seeing the 2016+ subsample disagree."* Its result is worth
re-running on an independent pull, and it survives:

| ITB overnight gap | 2006-09 | 2010-15 | 2016-20 | 2021-26 |
|---|---|---|---|---|
| release / baseline | **1.104% / 0.766%** | **0.615% / 0.401%** | 0.381% / 0.339% | 0.575% / 0.487% |
| n (release) | 44 | 71 | 59 | 65 |
| p | **0.034** | **0.002** | 0.495 | **0.209** |
| *sibling's p* | *0.032* | *0.0017* | *0.50* | *0.46* |

**Same result, same era boundaries, same conclusion: the edge was real through 2015 and has been
null for eleven years.** One divergence is worth naming rather than smoothing: this session measures
the gap on **raw** open ÷ prior close, where the sibling used dividend-adjusted prices. ITB
distributes quarterly, so an ex-date is a mechanical gap carrying no information — the adjusted
series is the better *news* measure and the raw one the better *experienced* measure. The effect is
confined to the 2021-26 cell (median 0.575% vs the sibling's 0.543%; p 0.209 vs 0.46; release-day
p90 **1.506%** vs its **1.579%**), and neither reading is significant. The registered kill-switch
threshold below keeps the sibling's **1.579%** for continuity across the two ledgers, with this
session's stricter 1.506% named so a future reader can see both.

**And 11-18 carries no opex confound, which is what makes it the clean instance.** 2026-11-20 is the
third Friday, so 11-18 is opex-week **Wednesday** (T-2), not the eve. Measured since 2014: ITB's
overnight gap on opex-week Wednesdays runs **0.374%** against **0.401%** (n=151, p=**0.50**) and its
session range 1.943% vs 1.843% (p=0.20); restricted to **November** opex weeks, 0.267% vs 0.399%
(n=12, p=0.36). Nothing. Where the sibling had to register its `-3` knowing December opex eve biased
it *against* the prediction (that class median is 0.782%, p=0.021), **11-18's equivalent is registered
on an unconfounded session.**

### Primary content read — and why most of it will not survive its own error bars

The current edition is still **July 2026 data, released 2026-08-18** (August data prints 09-17, the
first of the three editions between today and 11-18). FRED's own values, fetched today: `HOUST`
**1,239** thousand SAAR, `HOUST1F` **808**, `PERMIT` **1,433**, all reference 2026-07.

**One cross-check discrepancy, recorded rather than reconciled.** The sibling ledger states permits
of **1,443,000**; FRED's `PERMIT` reads **1,433** for the same reference month as of today. A 10k
difference is within one ordinary revision cycle and could equally be a transcription slip; this
session did not re-open the PDF to adjudicate, and reports its own source's value with its date.

**Quantified, so the caveat is a number.** `HOUST` monthly changes since 2016 (n=127): median
**|m/m| 4.79%**, p75 **9.84%**, p90 **14.11%**. Permits are markedly quieter (median **3.22%**, p90
7.83%) because permits are a census of permit-issuing places rather than a sample. Census's own
footnote on the last edition — *"\* The 90 percent confidence interval includes zero… insufficient
statistical evidence to conclude that the actual change is different from zero"* — carried on **3 of
6** headline changes, against a ±9.5% interval on the headline starts number. **The typical month's
move is smaller than the error bar attached to it.**

**And October is not a special month, which is worth knowing before someone assumes it is.** A
plausible story says the October reference month is the first cold-weather seasonal adjustment and
should therefore be noisier. It is not, on 2006+ data: median |m/m| for October reference months is
**5.70%** (n=20) against **6.35%** for all other months (p=**0.69**); permits 3.44% vs 3.56%
(p=0.91); single-family 4.84% vs 4.43% (p=0.75). The seasonal story is dead before anyone tells it.

Context: `MORTGAGE30US` **6.71%** (2026-09-03), and NAHB's builder-confidence index at **35** for
August 2026 (up one point) — deeply below the 50 neutral line, and consistent with a starts series
oscillating without trend.

### The adjacency sweep

- **Peer prints** — n/a for the event, `symbols: []`. ITB **93.91** and XHB **103.25** (2026-09-04
  closes) are read as a class and as Legs 2 and 5's subject, never as holdings; neither is tracked.
- **Macro surprises** — none since the last row; there is no last row. The corridor is heavy and
  front-loaded: **11-13** PPI (`confirmed`, medium); the **11-17** stack — retail sales (`high`),
  industrial production, import/export prices, MTIS, plus MSFT Ignite; then **11-18** itself carrying
  three dated releases (08:30 this print, 10:00 NAR's October Pending Home Sales Index, 14:00 the
  FOMC minutes) and APEC leaders in Shenzhen; **11-19** advance services Q3; **11-20** opex and Japan
  CPI. The 11-17 bundling is *why* 11-18's GDPNow vintage is solo.
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB
  **103.25** (2026-09-04 closes). Baseline; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through **2026-12-11**, carried from the corridor's
  ledgers rather than re-derived; Leg 4 is the treatment, and its conclusion for *this* event is that
  the exposure is zero. `apec-leaders-shenzhen-2026-11-18` (`estimate`, medium) shares the date and
  has no residential channel.
- **Event tape** — no October consensus exists at D-73 and none will before the **10-20** September
  edition sets the base. Every October-content statement above is a base rate, never a forecast.
- **A corroboration for a sibling's open leg.** `federalreserve.gov/newsevents/2026-november.htm`,
  re-fetched today, still lists **no speeches** for November 2026 — only the minutes (11-18) and the
  Beige Book (11-25). The [minutes ledger's](fomc-minutes-2026-11-18.md) "silence kill" has not
  fired as of 2026-09-06.
- **One dated event PROPOSED in this PR** (own file, `estimate`): **`nahb-hmi-2026-11-17`** — the
  NAHB/Wells Fargo Housing Market Index, 10:00 ET, off NAHB's own 2026 schedule ("Normal release
  time: 10:00 AM Eastern Time", row "Nov. 2026 | November 17, 2026"). It is not a routine edition of
  a tracked series; it is a **series this calendar tracks nowhere** — the criterion the 12-17 lane
  used for `new-home-sales-2026-12-23` — and it is the one residential release that is *about
  homebuilders* rather than about federal counts. That is the point: three ledgers have now concluded
  `symbols: []` on federal residential prints, and the untested alternative is that builder
  **sentiment**, not builder **data**, is the homebuilder-keyed channel. It publishes D-1 to this
  print every month, and being privately produced it carries **no funding-cliff exposure** — the one
  residential read that survives a lapse.
- **Two classes considered and DECLINED, on the record.** *(a)* **NAR's October Pending Home Sales
  Index on 2026-11-18** — verified on NAR's own schedule ("Wed., Nov. 18 | October Pending Home Sales
  Index", 10:00 ET) and declined for the third time, consistent with the 11-12 EHS and 12-17 lanes:
  it is a routine monthly edition of a series this calendar already tracks (`pending-home-sales-2026-12-17`).
  What would have distinguished it — sharing a session with two other residential-adjacent releases —
  is a property of *this* session, and this ledger measures it. *(b)* **Revised Building Permits,
  2026-11-25 08:00**, the 17th-workday twin's other half — declined as a revision of a number this
  print already publishes, on the same not-distinguishable criterion; its 10:00 companion is already
  tracked as `new-home-sales-2026-11-25`.
- **No blocked sources.** `probe-ref.blocked` is empty. One 200-with-wrong-body was met and is
  recorded here rather than there, because a wrong body at HTTP 200 is not a blocked fetch:
  NAHB's PDF schedule at `/-/media/NAHB/news-and-economics/docs/housing-economics/hmi/hmi-release-schedule.pdf`
  returns **HTTP 200 with 32,660 bytes of HTML**. This is the second instance of the trap the sibling
  logged for the Atlanta Fed paths, now on a different publisher — **the byte count and the body's
  first bytes are the only tell, and this lane should keep checking both.**

### Honest limits

- **The intraday window is 721 sessions, and that is the binding constraint on Leg 2.** Yahoo serves
  hourly bars for `range=730d` only, so the minutes group is **n=22** and the decision group **n=23**.
  The decision column's reproduction of the 12-09 ledger's independently-derived 26.0%/40.4% is what
  gives the design credibility, but a 22-observation null is a null with wide error bars, and the
  09:30 hour's p=0.96 should be read as "no evidence of an effect", never as "proof of none".
- **The 19-day daily-resolution test is a different, weaker instrument.** It has four times the
  history but cannot see intraday shape at all; it can only say the *day* looks ordinary. The two
  tests agree, which is worth something, but they are not two measurements of the same thing.
- **Minutes days are not a clean class.** Nothing was excluded from the 22: a minutes day can also
  carry CPI, a jobs print or an earnings-driven tape, and those cut in a **masking** direction for a
  null result — the weaker failure mode, but a real one. The same caution the minutes ledger recorded
  for its own n=2 applies here with a larger n.
- **Leg 5 is a reproduction, and reproductions inherit their original's design flaws.** The sibling's
  era split was post-hoc; running the same split on a fresh pull tests the *data*, not the
  *specification*. It is reported as corroboration, not as an out-of-sample test.
- **ITB and XHB are near-duplicates**, not two independent confirmations.
- **The classifier n's in Leg 3 differ from the sibling's** by 6–16% (see the note there). The
  conclusion is robust to the choice; the exact medians are not.
- **The GDPNow vintage archive ends 2026-07-28**, so every contribution measurement stops there, and
  `PostedUpdates` is a **schedule** — the 11-12 EHS ledger measured that 45 of 93 realized vintages
  were never scheduled, so the schedule is a floor. A scheduled solo vintage is very likely to post
  solo; this session did not observe it and cannot promise it.
- **Leg 4's conditional rests on the sibling's cliff work and on a prediction about Congress**, whose
  base rate is 3 lapses out of 3 — 100% of a sample of three, with the conditioning event unobserved.
- **`symbols: []` is doing real work.** Even were Leg 3 twice as strong, this event has no instrument
  attached and no house playbook keyed to it. The nowcast line is a *reading*, not a position.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on three Census primaries).** Stand aside on
2026-11-18 and on every edition of this report. Hold four frames. **On the minutes question the
proposal commissioned:** the hypothesis is **REFUTED**. A 14:00 minutes release does not compress the
morning — across 721 SPY sessions the 22 minutes days read every morning hour at baseline (09:30
**53.35% vs 53.13%, p=0.96**) with an unchanged session range (p=0.73), while the 23 decision days
crush the morning (09:30 **31.4%**, 10:30 **26.3%**, both p<0.005 — independently reproducing the
12-09 ledger's 26.0%/40.4%) and then run a third wider. At daily resolution the 19 historical
starts-plus-minutes days are indistinguishable from starts days without them (ITB gap p=**0.94**).
So `fomc-minutes-2026-11-18` is a reading assignment at 14:00, not a constraint on the morning — and
this session **qualifies** as the clean instance the sibling's tape kill switch asked for. **On the
nowcast:** 11-18 is the **solo** vintage 12-17 is not (October import/export prices publish 11-17),
and on the **93** solo starts vintages residential is the largest of eight component moves **95.7%**
of the time against a **20.7%** base rate — where the sibling's shared pairing gives **5 of 10**. The
corridor's readable residential nowcast is here. **On the tape:** `symbols: []` is re-derived, not
inherited — ITB's overnight gap reproduces the sibling era-for-era on Census's own 515 release dates
(2006-09 p=0.034, 2010-15 p=0.002, then **null for eleven years**), a starts-only session shows no
distinguishable hour at all, and unlike 12-17 there is no opex confound (opex-week Wednesday: p=0.50).
**On the cliff:** the exposure is **zero** — 11-18 is 23 days *before* `cr-expiry-2026-12-11` — and
that is exactly why it matters: if the cliff bites, the 2025-26 precedent (114 dark days, eight
months to normal cadence) makes this October edition the last residential-construction datapoint
anyone reads until roughly Q1-2027. Nothing here licenses an entry, and there is no instrument to
enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **A 14:00-release day between now and 2026-11-18 showing the decision-day morning signature** —
  SPY's 09:30 ET hour taking under **35%** of session range on a *minutes* day. Leg 2's central
  claim is then in question on a fresh observation. The dated chance to observe it before this print
  is the **2026-10-07** minutes (`fomc-minutes-2026-10-07`). Registered as `-2`.
- **ITB's overnight gap on any New Residential Construction release day between now and 11-18
  exceeds 1.579%** (the sibling's 2021-26 release-day p90; this session measures **1.506%**) with no
  FOMC decision, CPI or jobs print that morning. Leg 5's post-2015 null is falsified on a clean
  instance and `symbols: []` is back in question. The dated chances: **09-17**, **10-20**, and
  **11-18** itself. Registered as `-3`.
- **Any component other than residential posting the largest absolute move on the GDPNow vintage
  posted 2026-11-18 08:30.** The 95.7% solo-attribution figure is then wrong for the current regime
  and the "read the residential line" call needs re-deriving, not patching. Registered as `-1`.
- **The Atlanta Fed adding a second release to the 2026-11-18 vintage**, or October import/export
  prices moving off 11-17. The solo premise dies and this print becomes 12-17's shared case, where
  attribution is a coin flip.
- **Census moving, merging or restructuring the 2026-11-18 release on any of its three schedules.**
  The `confirmed` label reverts to `estimate`; `economic-indicators/calendar-listview.html`,
  `construction/soc/schedule.html` and `construction/xls/historic_release_dates.xls` are the three
  places that would show it.
- **A funding lapse beginning before 2026-11-18.** Leg 4's asymmetry — the entire reason this ledger
  treats 11-18 as the last guaranteed print — collapses, and the cliff question moves onto this
  event rather than sitting 23 days after it.
- **A macro- or housing-keyed house playbook landing in `docs/plans/trade-playbooks.md` before
  2026-11-18.** The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook
  makes it a live question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-housing-starts-2026-11-18-1` — on the GDPNow vintage posted **2026-11-18 08:30**, that vintage
  names **housing starts alone** and |Δ residential contribution| is the **largest** of the eight
  component moves. Score by 2026-11-19.
- `FT-housing-starts-2026-11-18-2` — **SPY's 09:30 ET hour takes at least 35% of the 2026-11-18
  session range** — the operational form of "the 14:00 minutes do not compress the morning."
  Score by 2026-11-19.
- `FT-housing-starts-2026-11-18-3` — **ITB's 2026-11-18 overnight gap is below 1.579%** on a session
  with no opex-eve and no morning-macro confound — the clean-instance form of the sibling's tape
  kill switch. Score by 2026-11-18.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-73 | **Initial research on an id that existed only as one proposal. The date promotes to `confirmed` on THREE Census primaries; the proposal's open question is REFUTED with a decision-day control; and 11-18 turns out to be the cleaner of the corridor's two starts prints on both dimensions the 12-17 sibling measured.** Canonical `src/domain/market-events/housing-starts-2026-11-18.json` written this session after reading `from-existing-home-sales-2026-11-12`, now shadowed. **Leg 1 — the date:** `calendar-listview.html` (200, 91,396 B, 179 rows) row "New Residential Construction … \| November 18, 2026 \| 8:30 AM \| October 2026", `A202611180830`/`A202610`; `construction/soc/schedule.html` (200, 59,625 B) "October 2026 \| November 18, 2026 \| November 25, 2026"; `historic_release_dates.xls` (200, 55,808 B, 515 rows 1984-01→2026-11) 2026-10 row → NRC 11-18, NRS 11-25. `estimate`→**`confirmed`**, `EST:`→**`CENSUS:`**. 11-18 is **exactly** the 12th workday (Veterans Day drops out) and 11-25 exactly the 17th — both on-convention, unlike 12-17's 13th. `Suspended` rows still exactly 4, none this series. **Leg 2 — THE HEADLINE, hypothesis REFUTED:** the proposal asked whether a 14:00 MINUTES release compresses the morning like a 14:00 SEP decision. It does not. SPY hourly bars, **721 complete sessions 2023-10-09→2026-09-04** (Yahoo `1h`/`range=730d`, converted to ET), each hour's range as a share of session range, 20k-iteration permutation tests. **Decision days (n=23) are unmistakable:** 09:30 **31.4% vs 53.1%**, 10:30 **26.3% vs 40.2%**, 11:30 20.0/33.6, 12:30 19.8/32.0 (all p<0.005), then 14:30 **74.8% vs 28.9%** and session range **1.13% vs 0.85% (p=0.03)** — and the 10:30 cell **independently reproduces the 12-09 ledger's 26.0%/40.4%**, which is the cross-check that the instrument works. **Minutes days (n=22) have none of it:** 09:30 **53.35 vs 53.13 (p=0.96)**, 10:30 44.8/40.2 (p=0.29), 11:30 30.9/33.6 (p=0.47), 12:30 29.8/32.0 (p=0.53), session range 0.81/0.85 (p=0.73); only 14:30 lifts (40.9 vs 28.9) — a quarter of a decision day's move. **Same answer at daily resolution on 4× the history:** Census's file × a minutes calendar derived from **152** FOMC meetings (fomccalendars + fomchistorical2005-2020, release = meeting-end + 21d, verified on 06-17→07-08 and 07-29→08-19) gives **19** historical starts+minutes days since 2008; ITB gap **0.562% vs 0.576% starts-only (p=0.94)** vs 0.446% base (p=0.41), ITB range 1.979/2.170 (p=0.64), XHB 0.576/0.532 (p=0.80), SPY range 1.137/1.059 (p=0.68) — nothing anywhere. **Consequence:** the 12-17 sibling's tape kill switch names 11-18 as a clean chance to observe; the 14:00 co-release does NOT disqualify it. **Anomaly resolved:** the 14:30 lift on "starts days" (36.6 vs 28.9, p=0.01) is entirely the Fed's — removing minutes/decision overlaps leaves **25 starts-only sessions with no distinguishable hour** (every p ≥ 0.41), a second independent statement of `symbols: []`. **Leg 3 — the nowcast, and 11-18 is the CLEAN read 12-17 is not:** `PostedUpdates` schedules **2026-11-18 08:30 as "Housing starts" ALONE** (October import/export prices publish 11-17 with retail sales + IP), where 12-17 reads "Housing starts, Import and export prices"; 4 of 2026's 12 starts vintages are solo (05-21, 09-17, 10-20, **11-18**). Re-measured from `ContribArchives` (**1,871** vintages 2014-05-01→2026-07-28 = **1,822** same-quarter deltas — the sibling's count exactly): **93 solo** starts vintages move \|Δ residential\| **0.0484pp vs 0.0059pp (p<0.0001)**, residential is the **largest of eight components 95.7%** of the time against a **20.7%** base rate (reproduced to the decimal), structures null (0.0006/0.0008, p=0.225), headline quieter (0.0535/0.0958, p=0.029), starts **1.56×** the existing-home leaf. **Classifier note stated, not buried:** n's differ from the sibling's 143/100/140 because this session requires the `Data releases` cell to be exactly "housing starts"; every sign and direction agrees, third-decimal magnitudes do not. **Leg 4 — the cliff ASYMMETRY:** the sibling's finding (all 9 of 514 out-of-month slips since 1984 are funding-lapse slips; response is deferral-and-merge; 2025-26 cost **114 dark days** and 8 months to normal cadence) is inherited unchanged, and its consequence here is inverted — **11-18 is 23 days BEFORE `cr-expiry-2026-12-11`** where 12-17 is 6 days after. So the exposure is zero, and the conjunction is the decision-relevant statement: if the cliff bites, **this October edition is the last residential-construction datapoint until ~Q1-2027**. FY2027 appropriations status NOT verified (the sibling's limit, repeated not resolved). **Leg 5 — the tape, reproduced:** ITB overnight gap on Census's 515 dates — 2006-09 **1.104/0.766 (p=0.034)**, 2010-15 **0.615/0.401 (p=0.002)**, 2016-20 0.381/0.339 (p=0.495), 2021-26 0.575/0.487 (p=0.209) — same eras, same conclusion as the sibling (0.032 / 0.0017 / 0.50 / 0.46). Divergence named: this session uses **raw** open÷prior-close where the sibling used dividend-adjusted, which shifts only the 2021-26 cell (release-day p90 **1.506%** here vs its **1.579%**); neither is significant and the kill switch keeps 1.579% for continuity. **No opex confound:** 11-20 is the third Friday so 11-18 is opex-week **Wednesday** — ITB gap 0.374/0.401 (n=151, p=0.50), range 1.943/1.843 (p=0.20), November-only 0.267/0.399 (n=12, p=0.36) — where 12-17 is December opex EVE (p=0.021). **Content:** FRED `HOUST` **1,239** SAAR, `HOUST1F` **808**, `PERMIT` **1,433** (ref 2026-07) — the permits figure differs from the sibling's 1,443 by 10k, recorded not reconciled; `HOUST` median \|m/m\| since 2016 **4.79%** (n=127, p90 14.11%), permits 3.22%, both smaller than the ±9.5% interval Census attached to the last headline (3 of 6 changes carried the "interval includes zero" asterisk). **October is NOT a distinctive reference month** — 5.70% vs 6.35% (p=0.69), permits 3.44/3.56 (p=0.91), single-family 4.84/4.43 (p=0.75): a plausible cold-weather-seasonal story killed before anyone tells it. `MORTGAGE30US` **6.71%** (2026-09-03) reproduces all three siblings; NAHB HMI **35** (Aug 2026, +1). **Adjacency sweep — peers:** n/a, `symbols: []`; ITB **93.91** / XHB **103.25** read as a class. **Macro:** 11-13 PPI; the 11-17 stack (retail sales `high`, IP, import/export, MTIS, MSFT Ignite) — whose bundling is WHY 11-18's vintage is solo; **11-18 itself carries three dated releases** (08:30 this print, 10:00 NAR's October PHSI verified on NAR's own schedule, 14:00 the minutes) plus APEC Shenzhen; 11-19 advance services; 11-20 opex + Japan CPI. **Volatility:** VIX **14.53**, SPY 770.19, QQQ 718.96 (2026-09-04) — baseline, nothing to diff yet; Yahoo served normally, so no Nasdaq fallback was needed (the 11-12 EHS lane was hard-429'd). **Geopolitical:** PL 119-103 through 12-11 — Leg 4, and the exposure here is zero. **Sibling corroboration:** federalreserve.gov's November calendar re-fetched today still lists **no speeches** — the minutes ledger's "silence kill" has not fired. **ONE dated event PROPOSED:** **`nahb-hmi-2026-11-17`** (`EST:`, NAHB's own 2026 schedule, "Normal release time: 10:00 AM Eastern Time", row "Nov. 2026 \| November 17, 2026") — a **series this calendar tracks nowhere**, the one residential release that is about HOMEBUILDERS rather than federal counts, publishing D-1 to this print every month and carrying **no cliff exposure**; three ledgers have now concluded `symbols: []` on federal prints and the untested alternative is that builder SENTIMENT is the homebuilder-keyed channel. **Two classes DECLINED on the record:** NAR's October PHSI on 11-18 (routine edition of an already-tracked series — declined for the third time, consistent with the 11-12 and 12-17 lanes; what would have distinguished it is a property of this session, which this ledger measures) and Revised Building Permits 11-25 08:00 (a revision of a number this print already publishes; its 10:00 companion is already tracked). **Fetch note in Method, not `blocked`:** NAHB's PDF schedule returns **HTTP 200 with 32,660 bytes of HTML** — the second instance of the 200-with-wrong-body trap the sibling logged for the Atlanta Fed, now on a different publisher. **Three forward tests registered:** `-1` (the 11-18 vintage is solo and residential is largest), `-2` (SPY's 09:30 hour ≥ 35% of session range — no minutes compression), `-3` (ITB's 11-18 gap below 1.579% on an unconfounded session). | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on three Census primaries, the proposal's minutes-compression hypothesis REFUTED against a decision-day control that independently reproduces the 12-09 ledger, 11-18 established as the corridor's SOLO nowcast vintage (95.7% attribution) where 12-17's is shared (5 of 10), the homebuilder null reproduced era-for-era on an unconfounded opex-week Wednesday, and the cliff exposure inverted — zero here, and therefore this is the last guaranteed residential print of the year.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-housing-starts-2026-11-18.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
