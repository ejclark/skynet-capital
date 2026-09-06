# New Residential Construction (Building Permits, Housing Starts, Completions — November 2026 data) — housing-starts-2026-12-17

**Kind:** macro-print · **Date:** 2026-12-17 (**confirmed**, `CENSUS:` two independent census.gov primaries — `economic-indicators/calendar-listview.html` row `A202612170830`/`A202611` and `construction/soc/schedule.html`'s terminal row "November 2026 | December 17, 2026", both fetched direct 2026-09-06; promoted this session from the `EST:` proposals) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-decision-2026-12-18","boj-tankan-2026-12-14","ecb-decision-2026-12-17","g20-miami-2026-12-14","import-export-prices-2026-12-17","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","mtis-2026-12-16","opex-2026-12-18","pending-home-sales-2026-12-17","pjm-capacity-auction-2026-12","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","retail-sales-2026-12-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This is the corridor's one residential print with a real, attributable nowcast line — and
the only one whose publication on the day is genuinely in doubt.** Both proposals guessed the mechanism
wrong and the conclusion right. `SplicedNewHousingConstruction`, the ticker two sibling ledgers attribute
to this print, is GDPNow's label for **construction spending** (its own column reads `"Real" private new
housing construction (VPIP)`, and the nonresidential twin reads `(C30)`); housing starts enters instead
through the **activity factor**, supplying **nine** model series. But measured against GDPNow's own
archive the print is the *louder* leaf anyway: **143** starts vintages move the residential contribution
a median **0.0609pp** against **0.0058pp** baseline (p<0.0001) — **1.62×** the existing-home leaf's
0.0376pp — and on the **100** solo vintages residential is the **largest** component move **96.0%** of the
time against a **20.7%** base rate. The tape says stand aside, and now says *when it changed*: on **515**
real release dates from Census's own file, ITB's overnight gap beat baseline through **2015**
(2006–09 p=**0.032**, 2010–15 p=**0.0017**) and has been null for eleven years (2016–20 p=**0.50**,
2021–26 p=**0.46**). The load-bearing finding is the cliff. **9 of 514 releases since 1984 slipped out of
the month after their reference month, and all 9 belong to a federal funding lapse.** This series does not
do what the corridor's inherited rule says — it neither cancels nor prints on time; it **defers and
merges**: after 2025-10-01 it went **114 days dark**, then published September *and* October 2025
together on 2026-01-09, November+December on 2026-02-18, February+March 2026 on 2026-04-29, and did not
run a normal month until **2026-05-21**. `cr-expiry-2026-12-11` is `estimate`; in all three precedents the
first scheduled release after a lapse began slipped, at lags of 16–26 days, and this one is **6 days**
out.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-102) | **Stand aside** | High | `symbols: []` is a measurement with a date attached, not a placeholder. On **515** Census-published release dates, the overnight gap — the metric that isolates an **08:30** print — is null on **ITB (2021–26: 0.543% vs 0.486%, p=0.46; 2016–20: 0.381% vs 0.340%, p=0.50)**, XHB (p=0.82, 0.69) and SPY (p=0.80, 0.36) across **124** post-2015 release days. It was real before that and decayed. No macro- or housing-keyed house playbook exists — a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returns **0** housing hits today. | A macro- or housing-keyed playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-01** — none exists today |
| This week | **Stand aside, and read the print's own error bars before believing any month of it** | High | Census's own footnote: *"\* The 90 percent confidence interval includes zero… insufficient statistical evidence to conclude that the actual change is different from zero."* **Three of the six** headline changes in the current (July 2026) edition carry that asterisk. Measured against the series: `HOUST`'s median \|m/m\| over ten years is **4.87%** (n=126) — *smaller* than the ±9.5% sampling error Census attached to the last headline. Most months this print says nothing that survives its own interval. | Census publishing an edition through **2026-12-17** in which the headline starts m/m change exceeds its stated interval by more than the series p90 (**14.41%**) — a genuine signal rather than a sampled one |
| This month | **Do not carry the corridor's `SplicedNewHousingConstruction` claim forward — it names a different release** | High | GDPNow's `Residential!E9` ticker sits beside a label column reading `"Real" private new housing construction (VPIP)`; its `NonresStructures!F9` twin reads `"Real" private nonresidential construction put-in-place (C30)`. Same release, both leaves: **construction spending**, not starts. The data agrees — **124** construction-spending vintages move residential **0.0625pp** *and* structures **0.0610pp** (both p<0.0001), while **143** starts vintages move residential **0.0609pp** and leave structures at **0.0006pp** (p=0.23). | Any Atlanta Fed documentation or workbook revision through **2026-12-23** routing a housing-starts series into `FRSPX_USNAqtr` — today the sheet routes VPIP there and lists starts only in `FactorAugARCoeffs`/`MonthlyLevels` |
| This quarter | **Treat publication itself as the open question, and do not read a missing print as a signal** | Medium | `cr-expiry-2026-12-11` is `estimate`, six days ahead. **All 9** of this series' 514 out-of-month slips since 1984 are lapse-driven, and in each of the three lapses the first scheduled release after onset slipped — **16 days** (2013), **26 days** (2018), **16 days** (2025). Medium, not high, because the lapse is a forecast about Congress and this session did not verify FY2027 appropriations status. If it does bite, the merge pattern says the November data eventually publishes alongside December's, not that it disappears. | The **2026-12-17** release publishing on schedule with no lapse having occurred — the base case, and `-1` is registered on exactly that |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** The homebuilder-ETF open effect is measured dead
  since 2016 across 124 release days, and no macro- or housing-keyed playbook exists. Research is not action.
- **The one thing worth reading is the GDPNow residential line** — but on **12-17** specifically it is a
  coin flip, not a clean read: the vintage is shared with BLS import/export prices, and on the **10**
  historical starts+import/export vintages residential is the largest move only **5/10** (net exports takes
  it 3 times), against **96.0%** on solo vintages. Registered as `-2`.
- **A wide 12-17 in homebuilders is December opex eve, not this print.** ITB's Dec-opex-eve *overnight gap*
  runs **0.782%** against **0.398%** (n=12, p=**0.021**) — this session's extension of the
  [PHSI sibling's](pending-home-sales-2026-12-17.md) session-range finding to the open. Registered as `-3`.
- **Do not read "confirmed" as licence.** The date is now Census's own on two primaries; the call is unchanged.
- **If the cliff bites, expect deferral-and-merge, not deletion.** Census's calendar carries exactly **4**
  `Suspended` rows today and none is this series. Registered as `-1`.
- **Watch (dated)** — August data **09-17** · September data **10-20** · **October data 11-18** (the last
  edition before the cliff, and the clean instance for the tape kill switch) · **CR expiry 12-11** ·
  retail sales + MTIS **12-16** · **12-17 08:30 this print + import/export prices, 08:30 GDPNow vintage,
  10:00 PHSI** · **opex 12-18** · **new residential sales 12-23** (proposed this PR) and the GDPNow
  vintage the same morning · December data ~**2027-01-20** (2027 schedule unpublished).

## Initial research

### The question, plainly

This id reached the calendar as two independent `EST:` proposals — one from
[`existing-home-sales-2026-12-09`](existing-home-sales-2026-12-09.md)'s sweep, one from
[`mtis-2026-12-16`](mtis-2026-12-16.md)'s — and between them they left three questions open. The first
asked for the **construction leaf** to be measured: *"nothing in this session measured the construction
leaf, and the initial research should."* It also asked whether the homebuilder ETFs, *"measured inert on
the neighbouring EHS release days,"* are inert **on a starts/permits print** — *"an open question this lane
did not test."* And both leaned on the corridor's inherited rule that *"Census cancels previews and keeps
reports,"* calling this print *"a fourth test of that rule on a series none of them measured."*

**Does Census's own calendar carry the date; what does this print actually move in GDPNow; does it move
the homebuilders; and does the funding cliff reach it?**

**One-line verdict:** the date is Census's own on two primaries and promotes to `confirmed`; the proposals'
*mechanism* is wrong and their *conclusion* is right and understated — this is the loudest residential
nowcast input on the calendar, through the activity factor rather than a named leaf; the homebuilder
effect was real and **died in 2015**; and the inherited cliff rule is wrong for this series, which
**defers and merges** rather than cancelling or keeping.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so neither
`earnings-cycle.mjs` nor `intraday-edges.mjs` applies to the event; the caches were busted anyway
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because the tape work
below uses `market-data.mjs`'s Yahoo path. Eight inputs, all fetched direct on 2026-09-06:

1. **`census.gov/economic-indicators/calendar-listview.html`** (HTTP 200, 91,396 bytes, **179** table rows
   parsed) — every 2026 Census release with its release code, reference month and any `Suspended` marker.
2. **`census.gov/construction/soc/schedule.html`** (HTTP 200, 59,625 bytes) — the Survey of Construction
   Release Schedule, the *program's* own calendar rather than the bureau-wide one.
3. **`census.gov/construction/xls/historic_release_dates.xls`** (HTTP 200, 55,808 bytes) — **515 rows,
   1984-01 → 2026-11**, every New Residential Construction and New Residential Sales press-release date
   Census has ever published. This is the file the whole session rests on.
4. **`census.gov/construction/nrc/index.html`** (HTTP 200, 566,266 bytes) and
   **`/construction/nrc/announcements.html`** (HTTP 200, 104,645 bytes) — the current edition and the
   bureau's own notes on the merged releases.
5. **`census.gov/construction/nrc/pdf/newresconst.pdf`** (HTTP 200, 322,067 bytes) — the July-2026 release
   itself, read for its content and for the confidence-interval footnote.
6. **`GDPTrackingModelDataAndForecasts.xlsx`** (**10,875,424 bytes**) — `Residential`, `NonresStructures`
   and `FactorAugARCoeffs` for the variable wiring; `ContribArchives` for **1,871 vintages 2014-05-01 →
   2026-07-28** = **1,822** same-quarter deltas. **`GDPNowcastDataReleaseDates.xlsx`** (**16,944 bytes**) —
   `PostedUpdates`, 83 rows.
7. **Yahoo daily bars** for SPY (n=8,458 to 2026-09-04), QQQ, ITB, XHB and `^VIX`, with 20,000-iteration
   permutation tests on medians.
8. **FRED CSV** — `HOUST`, `PERMIT`, `MORTGAGE30US`.

**One collection note, and it is a trap worth recording.** The Atlanta Fed's workbooks were first fetched
at `atlantafed.org/-/media/documents/cqer/…`, which returned **HTTP 200 with 48,299 bytes of a 404 HTML
page**. Nothing failed loudly; the byte count was the only tell. The real path is
`/-/media/Project/Atlanta/FRBA/Documents/cqer/researchcq/gdpnow/…`, and re-fetching there returned
**10,875,424** and **16,944** bytes — matching the sibling ledgers exactly. `probe-ref.blocked` is empty
because nothing was actually blocked; a 200-with-wrong-body is a different failure and is recorded here
instead. Daily closes reproduce both sibling ledgers exactly — SPY **770.19**, QQQ **718.96**, VIX
**14.53**, ITB **93.91**, XHB **103.25** on 2026-09-04 — and FRED's `MORTGAGE30US` **6.71%** (2026-09-03)
reproduces theirs too: the cross-check that three ledgers read one tape.

### Leg 1 — the date · **SUPPORTED**, and promoted to `confirmed`

Two independent census.gov primaries, and neither is the one the proposals cited alone.

The bureau-wide calendar carries the row with its machine codes:

> New Residential Construction (Building Permits, Housing Starts, and Housing Completions) | **December 17,
> 2026** | 8:30 AM | **November 2026** | `A202612170830` | `A202611`

The *program's* own schedule carries it independently:

> **November 2026** | **December 17, 2026** | December 23, 2026

under the column heads **"(12th Workday) New Residential Construction - 8:30 a.m."** and **"(17th Workday)
Revised Building Permits - 8:00 a.m. / New Residential Sales - 10:00 a.m."**, with the standing note that
these series *"are usually (but not always) released on the workday indicated."*

**Status promoted `estimate` → `confirmed`, prefix `EST:` → `CENSUS:`,** on the two-primary precedent this
calendar already carries for `durable-goods-2026-11-25` and `m3-full-report-2026-12-03`. Per the lane's
hard limits a flip requires a primary source and these are two; per the date policy it licenses nothing.

**Two corroborations beyond the promotion.** Census's own `historic_release_dates.xls` — the 515-row file
Leg 4 rests on — carries the same date in its terminal row (reference 2026-11 → NRC **2026-12-17**, NRS
2026-12-23). And a non-Census source agrees: the Atlanta Fed's `PostedUpdates` sheet schedules a GDPNow
vintage at **2026-12-17 08:30** reading *"Housing starts, Import and export prices"*.

**One arithmetic note, recorded because it looks like a discrepancy and is not.** The 12th workday of
December 2026 is **Dec 16**, not Dec 17. That is ordinary rather than suspicious: across the 505
on-schedule releases in Census's file, the release lands on the 12th workday **362** times and on the
**13th 105 times (20.4%)**, with the 14th another 25. Dec 16 is also already **retail sales + MTIS** day.
The 17th-workday twin computes to **Dec 23** and matches exactly.

### Leg 2 — the nowcast channel · **MIXED**: the mechanism the corridor recorded is wrong, the conclusion is right and understated

This is the leg the first proposal explicitly commissioned, and it splits.

**The mechanism, corrected.** Two sibling ledgers state that `SplicedNewHousingConstruction` feeds
`FRSPX_USNAqtr` ("Permanent-site") and that this print therefore moves it. The ticker is real; the
attribution is a read of the ticker's *name*. `Residential` row 9 puts that ticker in column E and its own
description in column F:

> `SplicedNewHousingConstruction` — **`"Real" private new housing construction (VPIP)`**

**VPIP is value of construction put in place** — Census's **Construction Spending** release, tracked here
as `construction-spending-2026-12-01`. The reading is settled by the sheet next door: `NonresStructures`
row 9 has the identical shape and reads **`"Real" private nonresidential construction put-in-place (C30)`**
— `C30` being Census's own code for that release. One release, two leaves, residential and nonresidential.

**Where housing starts actually enters: the activity factor.** A census of the workbook puts every
starts/permits series in `FactorAugARCoeffs`, `MonthlyLevels` and `TransformedMonthlySeries` — the dynamic
factor model (the sheet's own header calls it the *"Activity Factor [analog of Chicago Fed National
Activity Index]"*) — and in **no** expenditure leaf:

| Series from this release | Ticker | Where it lives |
|---|---|---|
| Housing Starts (SAAR, Thous.Units) | `HST@USECON` | `FactorAugARCoeffs` row 38 |
| New Pvt Housing Units Authorized by Building Permit | `HPT@USECON` | row 39 |
| Housing Starts: West / South / Midwest / Northeast | `HSTW` / `HSTS` / `HSTMW` / `HSTNE@USECON` | rows 40–43 |
| Housing Starts: 1 Unit | `HST1@USECON` | row 107 |
| Housing Starts: Total Multifamily | `HSTM@USECON` | row 110 |
| (derived) NomSingleStarts | `NomSingleStarts` | row 108 |

**Nine series from one release.** For contrast, existing-home sales contributes one (`valExHomeSales`).

**And the conclusion the proposals drew survives the correction, larger than they claimed.** `ContribArchives`
gives **1,871 vintages 2014-05-01 → 2026-07-28 = 1,822 same-quarter deltas**. Classifying each vintage by
its own `Data releases` free text:

| Vintage class | n | Δ residential (pp) | vs others | p | Δ structures (pp) | Δ headline (pp) |
|---|---|---|---|---|---|---|
| **Housing starts (all)** | **143** | **0.0609** | 0.0058 | **<0.0001** | 0.0006 (p=0.23) | 0.0687 |
| **Housing starts (solo)** | **100** | **0.0533** | 0.0063 | **<0.0001** | 0.0004 | **0.0568** (p=0.034) |
| Construction spending | 124 | 0.0625 | 0.0060 | <0.0001 | **0.0610** (p<0.0001) | **0.3281** (p<0.0001) |
| Existing-home sales | 140 | 0.0376 | 0.0057 | <0.0001 | 0.0001 | 0.0445 |

Three things fall out. **This print is the loudest residential input on the calendar** — 0.0609pp is
**1.62×** the existing-home leaf's 0.0376pp, and the 0.0376 figure reproduces the
[EHS ledger's](existing-home-sales-2026-12-09.md) exactly, which is the cross-check that this session read
the same archive correctly. **It is residential-*specific***: structures stays at baseline (p=0.23).
**And the wiring correction is visible in the data, not just the labels** — construction spending is the
one class that moves residential *and* structures together, which is precisely the fingerprint of a single
VPIP/C30 input feeding both sheets.

**Attribution is excellent in general.** On the 100 solo starts vintages, residential is the **largest** of
the eight component moves **96.0%** of the time, against a **20.7%** unconditional base rate — a cleaner
signature than the EHS lane's 92.9%. A starts vintage is also a *quiet* one overall: the headline moves
**0.0568pp** against **0.0959pp** for everything else (p=0.034), the same "quieter than average" shape the
EHS lane found. Construction spending, by contrast, moves the headline **0.3281pp** — 4× baseline.

**But attribution on 12-17 specifically is a coin flip, and that has to be said plainly.** The 12-17
vintage is shared with BLS import/export prices. Across the **10** historical vintages naming both:

| Date | Δ residential | Δ net exports | Largest component |
|---|---|---|---|
| 2017-09-19 | 0.0043 | 0.0472 | net exports |
| 2018-02-16 | 0.0890 | 0.0055 | **residential** |
| 2021-02-18 | 0.0067 | 0.0044 | PCE |
| 2021-06-16 | 0.1575 | 0.0529 | **residential** |
| 2023-03-16 | 0.0861 | 0.1697 | net exports |
| 2024-05-16 | 0.0155 | 0.0294 | inventories |
| 2025-03-18 | 0.1620 | 0.0464 | **residential** |
| 2025-05-16 | 0.1422 | 0.0272 | **residential** |
| 2026-06-16 | 0.1117 | 0.0584 | **residential** |
| 2026-07-17 | 0.0128 | 0.0443 | net exports |

**5 of 10** — still 2.4× the unconditional base rate, and nothing like the 96% a solo vintage gives.
Registered as `-2`.

### Leg 3 — the homebuilder tape · **REFUTED for today**, and the finding is *when* it stopped

The first proposal left this open in the right words: the ETFs were *"measured inert on the neighbouring
EHS release days"*, but *"whether they are inert on a STARTS/PERMITS print is an open question."* Census's
own file makes it answerable on **515** real dates rather than a derived cadence.

**The pre-specified metric.** This print lands at **08:30**, an hour before the open, so the metric that
isolates it is the **overnight gap** — |open ÷ prior close − 1| — not the session range and not the 10:00
hour the two NAR siblings used.

**Full history first, because it is the result that would have been reported had the session stopped there:**

| | Release days | Baseline | p |
|---|---|---|---|
| **ITB** (2006-05-08 →) | **0.575%** (n=239) | 0.447% (n=4,876) | **0.0020** |
| **XHB** (2006-02-07 →) | **0.544%** (n=242) | 0.441% (n=4,935) | **0.0069** |
| SPY (1993-02-01 →) | 0.268% (n=396) | 0.276% (n=8,061) | 0.64 |

The sector moves and the index does not — exactly the shape a real housing-specific effect takes. **It is
a real effect. It is also over.** Splitting by era:

| | 2006–09 | 2010–15 | **2016–20** | **2021–26** |
|---|---|---|---|---|
| **ITB** release / base | **1.104% / 0.766%** | **0.615% / 0.400%** | 0.381% / 0.340% | 0.543% / 0.486% |
| p | **0.032** (n=44) | **0.0017** (n=71) | **0.50** (n=59) | **0.46** (n=65) |
| **XHB** p | **0.024** | **0.0017** | 0.69 | 0.82 |
| SPY p | 0.85 | 0.41 | 0.36 | 0.79 |

**Two consecutive eras of null on both sector ETFs, n=124 combined.** The honest statement is not "this
print never mattered" — it mattered a great deal when housing was the macro story — but *"the open-gap edge
decayed after 2015 and has not returned in eleven years."* That is what `symbols: []` means here, and it
comes with the observation that would reverse it.

**What will actually move ITB on 12-17.** December opex eve, and this session extends the
[PHSI sibling's](pending-home-sales-2026-12-17.md) session-range result to the metric that matters here:
ITB's **overnight gap** on the 12 December-opex eves since 2014 runs **0.782%** against a **0.398%**
baseline (p=**0.021**); XHB 0.660% vs 0.393% (p=0.055); SPY 0.452% vs 0.280% (p=0.086). Expect a wide open
in homebuilders on 12-17 and attribute none of it to this print. Registered as `-3`.

### Leg 4 — the funding cliff · the load-bearing finding, and the corridor's inherited rule is **REFUTED** for this series

The proposals framed 12-17 as *"the corridor's cleanest read on whether the cliff bites"* and expected a
fourth confirmation of *"Census cancels previews and keeps reports."* Census's own 515-row release-date
file answers it directly, and the answer is a third category.

**The base rate.** Of **514** releases with a computable schedule since 1984, **505** landed in the month
after their reference month. The **9** that did not:

| Reference month | Actually released | Lapse |
|---|---|---|
| 2013-09 | 2013-11-26 | Oct 2013 |
| 2018-12 | 2019-02-26 | Dec 2018 – Jan 2019 |
| 2019-01 | 2019-03-08 | ″ |
| **2025-09** | **2026-01-09** | **2025–26** |
| **2025-10** | **2026-01-09** | ″ |
| **2025-11** | **2026-02-18** | ″ |
| **2025-12** | **2026-02-18** | ″ |
| **2026-01** | **2026-03-12** | ″ |
| **2026-02** | **2026-04-29** | ″ |

**Every one of the nine belongs to a federal funding lapse. There are no other slips in forty-two years.**
A funding lapse is not one risk among many to this series' schedule — it is the *only* thing that has ever
moved it.

**And the response is deferral-and-merge, not deletion.** The corridor's rule was built on the Advance
Economic Indicators Report, whose own [ledger](advance-economic-indicators-2026-10-28.md) found it *deletes*
editions. Census's calendar carries exactly **four** `Suspended` rows today, and this series is not among
them — they are Preliminary Steel Imports (Dec-2025, Jan-2026) and the AEIR (Jan-2026, Feb-2026). New
Residential Construction instead appears **five times with a duplicated release date**: Sep *and* Oct 2025
both on `A202601090830`, Nov *and* Dec 2025 both on `A202602180830`, Feb *and* Mar 2026 both on
`A202604290830`. Census's own announcements page says so in plain language — *"The October New Residential
Construction release also contains initial estimates for the month of September"* (1/9/26), and twice more.

**The 2025–26 episode, measured.** Last on-time release **2025-09-17** (August data). Then **114 days
dark**. Then three merged releases. Normal cadence did not resume until **2026-05-21**, with April data —
**eight months** from lapse onset to an ordinary print. Every reference month was eventually published;
none was deleted.

**Applied to 12-17.** `cr-expiry-2026-12-11` and `government-funding-deadline-2026-12-11` are both
`estimate` / `high`, sourced `NEWS:` on the 2026-09-01 CR vote (presidential signature unverified at the
time of those entries). In all three precedents the **first scheduled release after onset slipped**, at
lags of **16 days** (lapse 2013-10-01, release due 2013-10-17), **26 days** (2018-12-22 → 2019-01-17) and
**16 days** (2025-10-01 → 2025-10-17). This print is **6 days** out — inside every one of them. Registered
as `-1`.

**One limit stated rather than assumed:** whether a lapse actually reaches Commerce and Census depends on
which FY2027 appropriations have passed by 12-11, and partial lapses have historically funded some
statistical agencies and not others. This session did not verify FY2027 bill status and does not claim to.

### Primary content read — what the last published edition says, and how much of it is noise

The current edition is **July 2026 data, released 2026-08-18**:

- **Housing starts 1,239,000** SAAR — **−12.4% (±9.5%)** from a revised June 1,415,000, **−13.5% (±11.0%)**
  y/y. Single-family **808,000**, −9.9% (±10.4%)\*. Five-plus units **421,000**.
- **Building permits 1,443,000** — **+5.0%** m/m from a revised 1,374,000, +3.1% y/y. Single-family 894,000.
- **Housing completions 1,212,000** — −9.1% (±10.2%)\* m/m, −16.8% (±13.7%) y/y.

**The asterisk is the point.** Census's own footnote: *"\* The 90 percent confidence interval includes zero.
In such cases, there is insufficient statistical evidence to conclude that the actual change is different
from zero."* **Three of the six** headline changes in that edition carry it. The bureau also states that
preliminary seasonally adjusted estimates *"are revised 2.9 percent or less"* on average.

**Quantified against the series rather than left as a caveat.** `HOUST` monthly changes over the last ten
years (n=126): median **|m/m| 4.87%**, p75 **9.85%**, p90 **14.41%**, max 26.07%. Permits are markedly
quieter (median 3.21%, p90 8.24%) because permits are a census of permit-issuing places rather than a
sample. **So the typical month's headline starts change is smaller than the ±9.5% interval Census attached
to the last one.** The last twelve prints bear it out: 1,385 → 1,346 → 1,522 → 1,414 → 1,182 → 1,415 →
1,239 is a series oscillating by 15–20% with no trend a single month can establish. Context from FRED,
fetched today: `MORTGAGE30US` **6.71%** (2026-09-03, up from 6.65% and 6.66% the two prior weeks) — the
same reading both sibling ledgers carry.

**A corridor note that follows.** The 12-17 morning now carries three residential reads: this print
(November starts, 08:30), the GDPNow vintage that ingests it (08:30) and NAR's Pending Home Sales Index
(November contracts, 10:00). They describe three different things — units broken ground on, the nowcast's
response, and contracts signed — and only the first is federal.

### The adjacency sweep

- **Peer prints** — n/a for the event, `symbols: []`. ITB **93.91** and XHB **103.25** (2026-09-04 closes)
  were read as a *class* and as the subject of Leg 3, never as holdings; neither is tracked by this calendar.
- **Macro surprises** — none since the last row; there is no last row. The 12-17 morning's other 08:30
  print, `import-export-prices-2026-12-17`, shares this print's GDPNow vintage and is the confound Leg 2
  measured. `retail-sales-2026-12-16` and `mtis-2026-12-16` land the prior morning; the December FOMC is
  **12-09**, eight days before, so this session carries no decision.
- **Volatility regime** — VIX **14.53**, SPY **770.19**, QQQ **718.96**, ITB **93.91**, XHB **103.25**
  (2026-09-04 closes). Baseline; nothing to diff against yet.
- **Geopolitical / policy** — PL 119-103 funds through **2026-12-11**, carried from the corridor's own
  ledgers rather than re-derived. Leg 4 is the full treatment and it is this event's central question.
- **Event tape** — no November consensus exists at D-102 and none will before the **11-18** October edition
  sets the base. Every November-content statement above is a base rate, never a forecast.
- **One dated event PROPOSED in this PR** (own file, `estimate`): **`new-home-sales-2026-12-23`** — the
  17th-workday twin from the same Survey of Construction schedule, 10:00 ET, with its own GDPNow vintage.
  It is not a routine edition of a tracked series; it is a **series this calendar tracks nowhere**, and it
  is the only one of the four residential series without an entry. It feeds a *named* leaf this print does
  not — `valNewHomeSales` is the other half of `valTotalHomeSales` → `FRSBKX_USNAqtr`, the brokerage-commissions
  line the EHS lane measured — and the Atlanta Fed's workbook names new-home sales in **42** distinct shared
  strings, more than housing starts' 34 and nearly double existing-home's 22. It also sits **twelve** days
  past the cliff, the corridor's deepest exposure.
- **Two classes considered and DECLINED, on the record.** *(a)* The routine monthly editions on Census's
  own 2026 calendar — **09-17, 10-20, 11-18** — declined on the criterion the EHS and PHSI lanes both set
  and this lane inherits: an edition earns a row only when it is *distinguishable*, and these are not. The
  **11-18** edition is the tempting one, being the last before the cliff and the clean instance Leg 3's kill
  switch needs; it is handled as a dated kill switch instead, which is cheaper than an event. *(b)* The
  **2027-01-20** December-data edition — declined because Census's schedule stops at November 2026 data and
  a derived date is not a source.
- **No blocked sources.** `probe-ref.blocked` is empty. The Atlanta Fed 404-served-as-200 incident is
  recorded in *Method* instead, because a wrong body at HTTP 200 is not a blocked fetch and recording it as
  one would corrupt the field's meaning.

### Honest limits

- **Leg 3's era split was not pre-specified.** The pre-specified test was the gap on all release days,
  which came back **significant** on the full history (ITB p=0.0020). The era decomposition that turned it
  into a null-for-today was run *after* seeing the 2016+ subsample disagree. It is reported as the finding
  because two consecutive independent eras (n=59, n=65) both read null on two ETFs, but a reader should
  weight it as an explanation of a result rather than a clean out-of-sample test.
- **ITB and XHB are near-duplicates**, not two independent confirmations. Their agreement across all four
  eras is one observation reported twice.
- **`-1` is a prediction about Congress, not about Census.** Its base rate is 3 lapses out of 3, which is
  100% of a sample of three, and the conditioning event has not happened. This session did not verify
  FY2027 appropriations status and cannot say whether the 12-11 cliff will bite at all.
- **The 12-17 co-release sample is n=10.** Leg 2's "5 of 10" is a small-sample statement about one exact
  pairing; the 96% solo figure (n=100) is the well-powered one, and the two are not interchangeable.
- **The workday arithmetic used a reconstructed federal-holiday set**, not Census's own. It matched 505 of
  505 on-schedule releases to a 12th/13th/14th-workday band, so the reconstruction is sound, but the Dec-16
  vs Dec-17 note in Leg 1 rests on it.
- **The GDPNow vintage archive ends 2026-07-28.** Every contribution measurement stops there; the four
  vintages between then and today are not in the workbook this session read.
- **`symbols: []` is doing real work.** Even were Leg 2 twice as strong, this event has no instrument
  attached and no house playbook keyed to it. The nowcast line is a *reading*, not a position.

## Stance & kill switches

**Stance (date is `confirmed`, promoted this session on two Census primaries).** Stand aside on 2026-12-17
and on every edition of this report. Hold four frames. **On the date:** it is Census's own on the bureau
calendar (`A202612170830`, reference `A202611`) and on the Survey of Construction's program schedule, with
Census's 42-year release-date file and the Atlanta Fed's vintage calendar corroborating; the 13th-workday
placement is ordinary (105 of 505 historical releases). **On the nowcast:** the corridor's
`SplicedNewHousingConstruction` attribution is **wrong** — that ticker is construction spending's (VPIP /
C30, feeding both the Residential and NonresStructures sheets) — but the conclusion it supported is right
and **understated**: housing starts supplies **nine** activity-factor series and its **143** vintages move
the residential contribution **0.0609pp** against **0.0058pp** (p<0.0001), **1.62×** the existing-home leaf,
with residential the largest component move **96.0%** of the time on solo vintages against a **20.7%** base
rate. On 12-17 itself the vintage is shared with import/export prices and that drops to **5 of 10**.
**On the tape:** the homebuilder open-gap edge was real (2006–09 p=0.032; 2010–15 p=0.0017) and has been
**null for eleven years** (2016–20 p=0.50; 2021–26 p=0.46, n=124), so `symbols: []` is a measurement with a
date rather than an assumption; what will move ITB that morning is **December opex eve**, whose own gap runs
**0.782%** vs **0.398%** (p=0.021). **On the cliff:** this is the load-bearing frame. **All 9** of this
series' 514 out-of-month slips since 1984 are funding-lapse slips, and the response is **deferral and
merge**, not the deletion the corridor's inherited rule predicted — the 2025–26 lapse cost **114 dark days**
and **eight months** to normal cadence, with three pairs of reference months merged into single releases and
none deleted. Six days past a cliff, in a series whose only historical failure mode is exactly that, the
honest position is that **publication itself is the open question** — and that a missing print is a funding
event, never a housing signal. Nothing here licenses an entry, and there is no instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The 2026-12-17 release does not publish on 2026-12-17.** The cliff bit, and Leg 4's deferral-and-merge
  expectation becomes the live scenario: watch for the November reference month reappearing alongside
  December's on a single later date rather than being marked `Suspended`. If it is instead marked
  `Suspended` on Census's calendar, this series has changed its lapse behaviour and Leg 4 needs rewriting.
- **ITB's overnight gap on any New Residential Construction release day between now and 12-17 exceeds
  1.579%** (the 2021–26 release-day p90) **with no FOMC, CPI or jobs print that morning and no December-opex
  proximity.** Leg 3's post-2015 null is then falsified on a clean instance and `symbols: []` is back in
  question. The dated chances to observe it: **09-17**, **10-20**, **11-18**.
- **The Atlanta Fed routes a housing-starts series into a named residential expenditure leaf.** Today
  `FRSPX_USNAqtr` reads VPIP and every starts series lives in `FactorAugARCoeffs`/`MonthlyLevels`. A
  workbook revision or documentation change through **2026-12-23** would make this print's nowcast line
  directly attributable rather than factor-mediated, which is a materially stronger read than the one
  above.
- **Census moves, merges or restructures the 2026-12-17 release on either of its own schedules.** The
  `confirmed` label reverts to `estimate`; `economic-indicators/calendar-listview.html` and
  `construction/soc/schedule.html` are the two places that would show it.
- **A macro- or housing-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-12-01.**
  The stand-aside is partly an absence-of-instrument argument; a housing-keyed playbook makes it a live
  question rather than a settled one.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory):

- `FT-housing-starts-2026-12-17-1` — the November-2026 New Residential Construction release **publishes on
  2026-12-17**, not deferred by a funding lapse. Score by 2026-12-18.
- `FT-housing-starts-2026-12-17-2` — on the GDPNow vintage posted **2026-12-17 08:30**, |Δ residential
  contribution| is the **largest** of the eight component moves. Score by 2026-12-18.
- `FT-housing-starts-2026-12-17-3` — **ITB's 2026-12-17 overnight gap is below 1.579%** (the 2021–26
  release-day p90) — the operational form of "the print does not own the open." Score by 2026-12-17.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-102 | **Initial research on an id that existed only as two proposals. The date promotes to `confirmed` on two Census primaries; the corridor's nowcast wiring is CORRECTED while its conclusion survives larger; the homebuilder tape is dated to the year it died; and the inherited cliff rule is REFUTED for this series.** Canonical `src/domain/market-events/housing-starts-2026-12-17.json` written this session after reading both proposals (`from-existing-home-sales-2026-12-09`, `from-mtis-2026-12-16`), now shadowed. **Leg 1 — the date:** `census.gov/economic-indicators/calendar-listview.html` (HTTP 200, 91,396 bytes, 179 rows) row "New Residential Construction … \| December 17, 2026 \| 8:30 AM \| November 2026", code `A202612170830`/`A202611`; independently `census.gov/construction/soc/schedule.html` (HTTP 200, 59,625 bytes) terminal row "November 2026 \| December 17, 2026 \| December 23, 2026" under "(12th Workday) New Residential Construction - 8:30 a.m."; `estimate`→**`confirmed`**, `EST:`→**`CENSUS:`** on the two-primary `durable-goods-2026-11-25` / `m3-full-report-2026-12-03` precedent. Corroborated twice more: Census's own `historic_release_dates.xls` (515 rows 1984-01→2026-11) terminal row, and the Atlanta Fed's `PostedUpdates` 2026-12-17 08:30 "Housing starts, Import and export prices". Dec-17 is the **13th** workday, not the 12th — ordinary (105 of 505 on-schedule releases land on the 13th), and 12-16 is already retail-sales+MTIS day. **Leg 2 — the nowcast, MIXED (mechanism wrong, conclusion understated):** `SplicedNewHousingConstruction` is **NOT this print** — it is `Residential!E9`'s ticker beside a label reading `"Real" private new housing construction (VPIP)`, i.e. CONSTRUCTION SPENDING, settled by the identical `NonresStructures!F9` reading `"Real" private nonresidential construction put-in-place (C30)`. Housing starts enters via the ACTIVITY FACTOR with **nine** series (`HST`, `HPT`, `HSTW/HSTS/HSTMW/HSTNE`, `HST1`, `HSTM`, derived `NomSingleStarts`) in `FactorAugARCoeffs`/`MonthlyLevels`/`TransformedMonthlySeries`, and **no** expenditure leaf. Empirically the conclusion is *stronger* than the proposals claimed: across **1,822 same-quarter deltas** (1,871 vintages 2014-05-01→2026-07-28) the **143** starts vintages move residential a median **0.0609pp vs 0.0058pp** (p<0.0001) — **1.62×** the existing-home leaf's **0.0376pp**, which this session **reproduced exactly** (140 vintages, 0.0376 vs 0.0057) as a cross-check — while leaving structures at **0.0006 vs 0.0008 (p=0.23)**. On **100 SOLO** starts vintages residential is the **largest** component move **96.0%** of the time vs a **20.7%** base rate, and the headline is *quieter* than average (**0.0568 vs 0.0959pp, p=0.034**). The wiring correction is visible in the data: **124 construction-spending vintages move residential 0.0625 AND structures 0.0610 (both p<0.0001)** and the headline **0.3281 vs 0.0833** — the VPIP/C30 fingerprint feeding both sheets. **But 12-17's own vintage is SHARED with import/export prices**, and on the 10 historical starts+import/export vintages residential is largest only **5/10** (net exports takes it 3×) — registered as `-2`. **Leg 3 — the tape, REFUTED for today with a DATE:** Census's own file gives **515** real release dates, so the pre-specified 08:30 metric (overnight gap) runs on n=239 rather than a derived cadence. Full history is **significant** — ITB **0.575% vs 0.447% (p=0.0020)**, XHB 0.544% vs 0.441% (p=0.0069), SPY null (p=0.64) — and the era split shows why: **2006-09 ITB 1.104/0.766 (p=0.032)**, **2010-15 0.615/0.400 (p=0.0017)**, **2016-20 0.381/0.340 (p=0.50)**, **2021-26 0.543/0.486 (p=0.46)**; XHB identical shape (0.024, 0.0017, 0.69, 0.82). **The edge was real and died in 2015** — two consecutive null eras, n=124. What moves ITB on 12-17 is **December opex eve**, extended here from the PHSI sibling's session-range result to the OPEN: ITB gap **0.782% vs 0.398% (n=12, p=0.021)**, XHB 0.660/0.393 (p=0.055), SPY 0.452/0.280 (p=0.086) — registered as `-3`. **Leg 4 — the cliff, and the corridor's rule REFUTED for this series:** of **514** releases since 1984, **505** landed in the month after their reference month and **all 9 slips belong to a federal funding lapse** — 2013-09 data→2013-11-26; 2018-12→2019-02-26 and 2019-01→2019-03-08; and the 2025-26 lapse taking **2025-09 and 2025-10 both→2026-01-09**, **2025-11 and 2025-12 both→2026-02-18**, 2026-01→2026-03-12, **2026-02 and 2026-03 both→2026-04-29**. A lapse is the ONLY thing that has ever moved this schedule. And the response is **DEFERRAL-AND-MERGE, not deletion**: Census's calendar carries exactly **4 `Suspended` rows** today (Steel Imports ×2, Advance Economic Indicators ×2 — the sibling series that *does* delete) and **none is this one**; NRC instead shows five rows sharing three release codes, and Census's announcements page says so verbatim ("The October New Residential Construction release also contains initial estimates for the month of September", 1/9/26). The 2025-26 episode cost **114 dark days** (last on-time 2025-09-17 → 2026-01-09) and **eight months** to normal cadence (2026-05-21). In all three lapses the FIRST scheduled release after onset slipped, at **16 / 26 / 16** days; **12-17 is 6 days** past `cr-expiry-2026-12-11` — inside every precedent. Registered as `-1`. FY2027 appropriations status NOT verified. **Primary content (July 2026 data, released 08-18):** starts **1,239,000** SAAR, **−12.4% (±9.5%)** m/m from a revised 1,415,000, −13.5% (±11.0%) y/y; permits **1,443,000, +5.0%**; completions 1,212,000, −9.1% (±10.2%)\*. Census's own footnote — "\* The 90 percent confidence interval includes zero… insufficient statistical evidence to conclude that the actual change is different from zero" — applies to **3 of the 6** headline changes, and the bureau states preliminary SA estimates are "revised 2.9 percent or less" on average. Quantified: `HOUST` median \|m/m\| over 10y is **4.87%** (n=126, p75 9.85%, p90 14.41%) — **smaller than the ±9.5% interval on the last print**, so most months say nothing that survives their own error bars; permits are quieter (3.21%, p90 8.24%) being a census not a sample. `MORTGAGE30US` **6.71%** (2026-09-03), matching both sibling ledgers. **Adjacency sweep — peers:** n/a, `symbols: []`; ITB **93.91** / XHB **103.25** read as a class and as Leg 3's subject. **Macro:** the December FOMC is 12-09, eight days before, so no decision on this session; `retail-sales-2026-12-16` + `mtis-2026-12-16` land the prior morning; `import-export-prices-2026-12-17` shares this print's 08:30 slot AND its GDPNow vintage — the confound Leg 2 measured. **Volatility:** VIX **14.53**, SPY 770.19, QQQ 718.96 (2026-09-04 closes) — baseline, nothing to diff yet. **Geopolitical:** PL 119-103 through 12-11 — Leg 4 is the full treatment and this event's central question. **Event tape:** no November consensus at D-102; the 11-18 October edition sets the base. **ONE dated event PROPOSED:** `new-home-sales-2026-12-23` (`EST:`, the same Survey of Construction schedule's 17th-workday column, 10:00 ET, with its own GDPNow vintage) — not a routine edition but a **series this calendar tracks nowhere**, the fourth residential series and the only one absent; it feeds the *named* `valNewHomeSales`→`FRSBKX_USNAqtr` leaf this print does not, is named in **42** workbook strings (vs starts' 34, existing-home's 22), and sits **twelve** days past the cliff. **Two classes DECLINED on the record:** the routine 09-17/10-20/11-18 editions (not distinguishable — 11-18 is handled as a dated kill switch, cheaper than an event) and the ~2027-01-20 December-data edition (Census's schedule stops at November 2026 data; a derived date is not a source). **Fetch note, recorded in Method rather than `probe-ref.blocked`:** the Atlanta Fed workbooks first returned **HTTP 200 with 48,299 bytes of a 404 HTML page** at `/-/media/documents/cqer/…`; the real path is `/-/media/Project/Atlanta/FRBA/Documents/cqer/…` and re-fetching gave **10,875,424** / **16,944** bytes, matching the siblings. A wrong body at 200 is not a blocked fetch, so `blocked` stays empty. **Three forward tests registered:** `-1` (the release publishes 12-17), `-2` (residential is the largest move on the 12-17 vintage), `-3` (ITB's 12-17 gap below the 1.579% release-day p90). | **Initial stance set: stand aside on every horizon; date promoted to `confirmed` on two Census primaries, the corridor's `SplicedNewHousingConstruction` wiring CORRECTED to construction spending while the nowcast conclusion survives 1.62× larger than claimed, the homebuilder open-gap edge dated as real through 2015 and null for eleven years since, and the inherited "Census cancels previews and keeps reports" rule REFUTED for this series — which defers and merges, has never slipped for any reason but a funding lapse, and lands six days past one.** | 2026-10-06 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-housing-starts-2026-12-17.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
