# 2-Year Floating Rate Note auction (reopening, series BF-2028) — treasury-2y-frn-2026-09-23

**Kind:** rates · **Date:** 2026-09-23 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer independently re-extracted direct 2026-09-05 — the `2-Year FRN` row at y=226 carries the `R` reopening marker and reads Announcement Thursday September 17 2026 / Auction Wednesday September 23 2026 / Settlement Friday September 25 2026; stays `estimate` because a tentative schedule is tentative and the confirming primary is the 2026-09-17 announcement itself) · **Impact:** low
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.54,"daysBand":"low:0+","adjacentIds":["boj-decision-2026-09-18","bowman-stress-testing-2026-09-18","census-benchmark-revision-nsa-2026-09-28","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","industrial-production-2026-09-18","japan-cpi-2026-09-18","jgb-liquidity-enhancement-5-11y-2026-09-25","jpx-market-closure-2026-09-21","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","new-home-sales-2026-09-24","opex-2026-09-18","retail-benchmark-revision-2026-09-28","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-global-flash-eurozone-pmi-2026-09-23","sp-global-flash-france-pmi-2026-09-23","sp-global-flash-germany-pmi-2026-09-23","sp-global-flash-us-pmi-2026-09-23","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","trump-xi-summit-2026-09-24","uk-public-sector-finances-2026-09-22","uk-retail-sales-2026-09-18","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26"],"adjacentStrongIds":["opex-2026-09-18"],"screenStreak":0} -->

## At a glance

**TL;DR.** *(Rewritten 2026-09-15 at D-8.)* **The policy straddle this doc flagged on 09-05 is no longer
hypothetical — and this session measured what it costs the read, which is close to nothing.** September's
decision went from contested to near-settled: **91.4% hike** futures-derived, 86.2% venue VWAP, per
[`fomc-2026-09-16`](fomc-2026-09-16.md) as of 09-14, against the ~50–65% this doc quoted on 09-05. And the
FRN's own index basis has already moved without waiting for it: the 13-week bill printed **3.970%**
discount on **2026-09-14** against **3.800%** on 09-08 — **+17.0bp, the largest one-week move in two
years** and only the second ≥17bp week since 2024-01-01 (the other, **−21.0bp on 2024-09-23**, is its
mirror image after that September's FOMC). Versus the R1 determination (**3.715**, 08-24) the index is
already **+25.5bp** before 09-21 is even auctioned. **The new measurement: a rising index is close to
margin-neutral.** In first differences corr(Δindex, Δmargin) is **−0.087** (n=153) and **+0.076** on
2021+ (n=69); conditioned on Δindex ≥ +10bp (n=31) the mean Δmargin is **+0.37bp**, wider in only
**14/31**. On this event's exact setup — R2, R1 ≤ 6bp, index up ≥ 10bp — **n=4**, R2−R1 in
**[−0.3, +3.3]bp**, mean **+0.83bp**. Applied to R1 = 5.5bp that centres 09-23 near **6.3bp** over
**5.2–8.8bp**: `-2`'s registered **3.5–8.5bp** band survives, tilted into its upper half, with the
largest analogue clearing the ceiling by **0.3bp**. **And no funding-stress alibi is standing by:** SOFR
*eased* to **3.62%** (09-14) from 3.65% (09-04) while the index rose 17bp, 99th-percentile tail **8bp**,
volume **~$2.86T** — policy repricing, not a squeeze. The schedule PDF re-fetched today is
**byte-identical at 17,195 bytes**, so the date holds. Still `estimate`, still `symbols: []`, still zero
capital.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-15, D-8) | **Stand aside — unchanged, and the straddle is now measured rather than merely flagged** | High | `symbols: []`, date `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. The FOMC input leg 6 named is now ~decided (**91.4%** hike) *and* near margin-neutral: Δindex ≥ +10bp → mean Δmargin **+0.37bp**, wider in 14/31 (n=31). A reopening's margin still changes no contract — `spread` stays **0.0500** by 103/103. | Treasury announcing this FRN off the **$28B** reopening grid on **2026-09-17**, or without the `R` marker — the event stops being a reopening and this whole doc is rebuilt rather than amended |
| This week | **Watch the 2026-09-21 13-week bill for the index STEP, and expect the margin not to follow it** | Medium | The index already ran **+25.5bp** off R1's 08-24 determination (3.715 → 3.970) and a 09-16 hike lands in the 09-21 print on top of that. But first differences say the margin does not track the index: corr **−0.087** all-history, **+0.076** on 2021+ — the level correlation of +0.824 the parent carried is a ZIRP artifact, and this is its first-difference test. | `frn_index_determination_date` printing a date other than **2026-09-21** when 09-23 publishes, or the 09-21 13-week bill not occurring — leg 6's chain is wrong and the post-decision framing goes with it |
| This month | **Centre the 09-23 margin near 6.3bp rather than 5.5bp — the rising-index conditional tilts into the band's upper half** | Medium | Exact setup (R2 · R1 ≤ 6bp · Δindex ≥ +10bp), **n=4** — 2017-12-27 (3.5→3.5), 2018-03-28 (1.6→4.9), 2018-09-25 (4.7→5.0), 2022-06-22 (0.0→−0.3) — mean R2−R1 **+0.83bp**, range **[−0.3, +3.3]**. On R1 = 5.5bp that is **5.2–8.8bp**, so `-2`'s 3.5–8.5bp band holds but its top analogue clears the ceiling by 0.3bp. | The **2026-09-23** print landing **below 5.2bp** — the rising-index tilt is absent and the conditional collapses back to the unconditional [−2.0, +3.0] window `-2` was built from, on n=4 that was too thin to carry it |
| This quarter | **A >10.0bp print would now have NO funding alibi — read it as FRN-specific, not as 2018 again** | Medium | The switch's one precedent (**2018-12-26**, 5.0 → 15.0bp) was a funding squeeze, and as of **2026-09-14** there is no squeeze to point at: SOFR **eased** 3bp to **3.62%** while the bill index rose 17bp, p99 tail **8bp**, volume **$2.86T**, bill supply flat at **$92B** for 12 consecutive auctions. Base rate on the matching setup unchanged at **1 of 16**. | SOFR's 99th-percentile tail widening past **~15bp** (it is 8bp on 09-14), or SOFR rising by more than the 09-16 decision's own step size, on any day **2026-09-21 → 2026-09-23** — funding stress arrives after all and the 2018 reading is back on the table |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date `estimate`, no house playbook is rates-keyed. Zero
  capital is at stake in anything below.
- **The index has already moved, and it is the biggest move in two years:** 13-week discount
  **3.800 → 3.970** (09-08 → 09-14), **+17.0bp**; **+25.5bp** versus R1's 08-24 determination.
- **The straddle is now priced, not speculative:** **91.4%** hike (futures-derived, 09-14) vs the
  ~50–65% quoted on 09-05 — but measured as **near margin-neutral**, so it re-prices the index, not `-2`.
- **What this print can and cannot say:** it re-marks BF-2028 at market; it cannot change BF-2028's
  `spread`, which stays **0.0500** by the 103/103 identity.
- **The band, refined not replaced:** `-2`'s **3.5–8.5bp** stands; the conditional centre moves to
  **~6.3bp** with an analogue span of **5.2–8.8bp**. Not re-registered — `-2` already scores this print.
- **The 10-28 adjustment is unchanged:** subtract **~1.5bp** from whatever 09-23 prints before carrying
  it across. Nothing this session found touches that bias.
- **Funding is quiet:** SOFR **3.62%** and *falling*, p99 **3.70%**, volume **$2.86T** (09-14, NY Fed).
  A >10.0bp print into that tape would be about the FRN, not about repo.
- **The corridor more than doubled:** **34** tracked events within ±5 days, up from 15 on 09-05; one
  confirmed high/critical among them (**opex-2026-09-18**). VIX **17.54** vs 14.53 (**+3.01**).
- **Watch (dated):** **FOMC 09-16** · announcement **09-17** (the confirming primary — now a tracked
  calendar row, [`treasury-coupon-announcement-2026-09-17`](treasury-coupon-announcement-2026-09-17.md))
  · triple witching **09-18** · **13-week bill / index determination 09-21** · 2Y note **09-22** ·
  **this auction + 5Y note 09-23** · 7Y note + Trump–Xi summit **09-24** · settlement **09-25** ·
  quarter-end **09-30** · next FRN **10-28**.

## Initial research

### The question, plainly

This event exists because two other ledgers named it and neither researched it. The
[`treasury-coupon-announcement-2026-10-22`](treasury-coupon-announcement-2026-10-22.md) initial
research (2026-09-05) named the 09-23 reopening as a "free intermediate check, five weeks early" on its
`FT-…-10-22-2` prediction. The [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md) initial
research the same day filed it to the calendar and adopted its >10.0bp kill switch verbatim, calling it
"the free read on whether **5.0/5.5bp** is a level or a moment."

Both treat this auction as an instrument for reading a *different* auction. So the question here is the
one neither could ask: **does the free read actually carry the information it is being asked for, and at
what price?**

**One-line verdict:** it carries more information than anyone claimed — a second reopening is the
sharpest available forecaster of the next new issue's stamped spread (corr **0.928**, mean error
**2.55bp**, beating the prior new issue's 0.716 / 4.42bp) — but it is **biased 1.50bp wide**, and this
particular one prices on the far side of a hike-modal FOMC whose decision its index will already
contain, which is a boundary the 50-cycle base rate was not measured across.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no symbol-keyed
instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the mandated cache
bust has nothing to bust (recorded rather than skipped silently). Every primary was re-fetched and every
number re-derived from scratch this session (2026-09-05), including numbers the two parent docs publish:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes** (byte-identical to the parents' read); PDF streams inflated and the text
  layer rebuilt from per-glyph `Td`/`Tm` coordinates, **909 glyph runs**, rows reassembled by y-position.
  The FRN row and the 13-week bill row were both read directly rather than inherited.
- **The auction record** — `api.fiscaldata.treasury.gov` `auctions_query`, `floating_rate: Yes`, HTTP
  200, **532,321 bytes**, **154 auctions** (2014-01-29 → 2026-08-26), the complete 2-Year FRN series;
  plus the `13-Week` series since 2026-05-01 (**19 rows**, HTTP 200, 76,304 bytes).
- **The tape** — Treasury's 2026 daily par yield-curve CSV (HTTP 200, **13,961 bytes**) and Yahoo `^VIX`
  daily closes.
- **The calendar** — all 15 tracked events in the ±5-day corridor, read from `src/domain/market-events/`.

Every cycle in the FRN series was tagged by **position within its CUSIP** (new issue = 0, first
reopening = 1, second reopening = 2), which is the analytical move the parents did not make and which
most of what follows depends on. 2026-09-23 is **position 2** of series **91282CRD5 / BF-2028**.

### Conviction legs, tested

**1. A second reopening is the sharpest available forecaster of the next new issue's stamped spread —
SUPPORTED, and this is the first measurement of the claim the calendar has been asserting.** Both parent
docs assert 09-23 is "the free read" on 10-28 without measuring whether a reopening predicts a new
issue at all. Across all **50** complete cycles in the series:

| Anchor for the next new issue's high discount margin | Correlation | Mean absolute error |
|---|---|---|
| **The second reopening (this event's position)** | **0.928** | **2.55bp** |
| The first reopening | 0.857 | — |
| The prior new issue itself | 0.716 | 4.42bp |

The ordering is monotone in recency, which is the unsurprising part; the useful part is the **size of
the gap**. Anchoring on the immediately preceding new issue — the obvious naive choice, and the one the
`spread`-inheritance frame invites — carries **73% more error** than anchoring on this auction. So the
"free read" framing is correct and, until now, unquantified.

**2. But the read is systematically WIDE by 1.50bp — MIXED, and this is the correction the two parent
docs both need.** The same 50 cycles, signed:

| Measure of (next new issue's margin − this R2's margin) | Result |
|---|---|
| Mean | **−1.50bp** |
| Next new issue printed tighter | **37 of 50** |
| 2021+ subset (n=22) | mean **−0.90bp**, tighter in **16 of 22** |

Recent cycles show it plainly: 2026-06-24 R2 at 7.9bp → 2026-07-29 new issue at **5.0bp**; 2026-03-25 R2
at 11.5bp → 04-28 at **10.3bp**; 2025-12-23 R2 at 13.9bp → 2026-01-28 at **9.9bp**. A new issue reprices
tighter than the reopening that preceded it more often than not, and the within-cycle drift explains
why: **R2 runs +1.51bp wider than its own new issue** (n=50, sd 4.72, wider in 28/50) while **R1 runs
+0.23bp** (n=51, sd 2.80). Margins drift out across a CUSIP's life and reset at the new issue. **The
operational consequence: whatever 09-23 prints, subtract ~1.5bp before carrying it to 10-28.** Neither
parent applies this adjustment, and `FT-…-10-22-2`'s +2.0bp band is measured off the raw number.

**3. The inherited >10.0bp kill switch is a ~6% tail, and firing it would be a funding signal rather
than a supply signal — SUPPORTED, base rate computed for the first time.** Both parents adopt the
threshold; neither states how often it fires. Three nested base rates:

| Population | Prints > 10.0bp on the next auction |
|---|---|
| Any auction following one at ≤ 8.0bp | **2 of 64** (2014-12-23, 2018-12-26) |
| Any move into a reopening of ≥ +4.5bp | 11 of 103 |
| **This event's exact setup — an R2 whose R1 printed ≤ 6.0bp** | **1 of 16** |

The single precedent in the matching population is **2018-12-26: 5.0 → 15.0bp**, a +10.0bp jump into the
December-2018 funding squeeze — the largest low-base dislocation in the series. The other fifteen R2s
off a ≤6bp R1 landed between **−5.5bp and +8.0bp**, and the tightest-clustered of them is the analogue
worth naming: **2020-09-23**, the same calendar slot, also an R2, also R1 = **5.5bp**, printed **5.8bp**.
So the switch is well-placed — it is a real tail rather than a threshold that fires on noise — but its
*meaning* on firing is narrow: at a 1-in-16 conditional rate with the one precedent being a repo event,
a >10.0bp print on 09-23 is far more likely to be telling us about funding than about FRN demand. The
calendar should read a fire that way, and this doc says so before the fact.

**4. A fourth mechanism candidate for the compression — SOMA add-ons — looks strong and then FAILS for
exactly the reason the parent's third candidate failed. REFUTED.** [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md)
tested three auction-internal candidates (indirect share, index level, bid-to-cover) and all three
failed. `sb0590`'s sentence names *"SOMA purchases of Treasury bills"* specifically, and the auction
record publishes `soma_accepted`, which nobody has tested:

| Test (2-Year FRN new issues) | Result |
|---|---|
| corr(SOMA add-on, high discount margin), 2021+ (n=23) | **−0.720** |
| same, 2024+ (n=11) | **−0.740** |
| **First differences, corr(Δ SOMA, Δ margin), 2021+ (n=22)** | **−0.266** |
| corr(SOMA add-on, index determination rate), 2021+ | **−0.760** |
| corr(index rate, margin), 2021+ | **+0.824** |

The level correlation is the right sign and large — bigger Fed rollover, tighter margin — and it is the
first candidate in this calendar to point the right way. It is also **not real**: SOMA add-ons were large
under ZIRP (2021: $2.7–5.4B at 3–5bp margins) and went to **exactly zero** through the 2022–2024 QT
window (2022-10-26 through 2024-01-24, margins 14–24.5bp), so `soma` and the index rate are nearly
collinear at **−0.760** and the margin correlation is the same ZIRP artifact leg 5 of the parent already
caught. **In first differences it collapses to −0.266 on n=22.** Add-ons are also non-competitive by
construction: they cannot set the price they are filled at. **Four candidates, four failures** — recorded
so no later session re-derives it, and so the compression stays an open question rather than a story
adopted for lack of an alternative.

**5. A structural asymmetry that separates this print from 10-28 — SUPPORTED, and it is new.** The same
`soma_accepted` field yields a clean fact independent of the failed correlation:

| Population | Auctions carrying a SOMA add-on |
|---|---|
| New issues, full series | **38 of 51** |
| Reopenings, full series | **10 of 103** |
| New issues, 2024+ | **10 of 10** |
| Reopenings, 2024+ | **1 of 10** |

The Fed rolls into new issues, essentially never into reopenings. **This auction will almost certainly
print `soma_accepted = 0`** — it is a pure private-demand take-down of $28B — while 10-28 will carry a
rollover on top of its $30B, and 2026's three add-ons are historically large: **$2.11B** (01-28),
**$3.78B** (04-28, 5th largest of 154) and **$3.32B** (07-29, 7th). Two consequences worth stating: the
09-23 margin is a cleaner private-demand mark than 10-28's will be, and any composition comparison
across the two must exclude the add-on, which is non-competitive and would otherwise flatter 10-28.

**6. The timing chain runs the OPPOSITE way from 10-28's, and this is the session's most
decision-relevant finding — SUPPORTED, sourced from the schedule PDF directly.** The parent's leg 3
established that 10-28's index is locked on **2026-10-26**, two days *before* the FOMC decision it
shares a date with. For this auction the same chain inverts. Read from the same PDF at y=256, the
September column: `13-Week BILL / Announcement Thursday, September 17, 2026 / Auction Monday, September
21, 2026 / Settlement Thursday, September 24, 2026`. That is the last 13-week bill before 09-23, and the
modal `frn_index_determination_date` is the Monday of auction week (8 of the last 10). So:

**FOMC statement 14:00 ET 2026-09-16 → announcement 09-17 → index fixed 09-21 → auction 11:30 ET 09-23 →
settlement 09-25.**

The index absorbs the September decision **before** this auction prices. On 10-28 it cannot. And the
September decision is not a formality as of this session:
[`fomc-2026-09-16`](fomc-2026-09-16.md) has it **hike-modal and contested** — CME ~**65%**, Kalshi
**51.5%**, Polymarket **49.0%**, cut odds **0%**, with the blackout running 09-05 → 09-17 so CPI (09-11)
lands with no official interpretation. **The consequence for the free read:** if the Committee hikes on
09-16, the 09-21 index steps up and 09-23's margin is measured against a repriced base, while 10-28's
margin is measured against a pre-decision one. The 50-cycle R2→new-issue base rate in leg 1 was measured
across cycles that mostly did not straddle a live policy boundary. **This does not invalidate the read —
it prices it.** The margin is a spread *over* the index, so a level shift in the index is not mechanically
a shift in the margin; but the parents' clean "5.0 / 5.5 / 09-23 → 10-28" sequence quietly assumes four
prints from one regime, and as of today there is a ~50–65% chance the last two are not.

**7. The `spread` identity holds, and this auction is its earliest available test — SUPPORTED,
independently re-derived.** Checking every reopening against its own new issue's `spread` field:
**103 of 103**, no exception since 2014. BF-2028 was stamped **0.0500** by the 2026-07-29 new issue and
the 2026-08-26 reopening printed a 5.5bp market margin while still carrying `spread = 0.0500`. The
parent's entire "$86B stamped for two years" frame rests on this identity; **09-23 tests it five weeks
before 10-28 does**, at no cost, which is a use for this auction neither parent noticed. Registered as
`-1` below.

**8. The size is on the reopening grid and the announcement is the confirming primary — SUPPORTED.** The
$28B reopening grid holds **20 of 20** since 2024-05-29, and `sb0590`'s Sep-26 FRN column reads **28**.
Nothing is re-registered here: [`FT-treasury-coupon-announcement-2026-10-22-1`](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
already names the 2026-09-17 announcement as its own free out-of-sample pre-check on this exact block.
What is *missing* is the calendar row for that announcement — the confirming primary for this event's
own date — which is the one dated event this sweep proposes.

**9. The closing-time field's exception set is NOT "holiday weeks only" — a correction to the parent's
leg 3 that leaves its conclusion standing.** The parent characterised the 17 non-`11:30 AM` prints as
"holiday and short weeks … plus one `11:00 AM`", naming four. Enumerated in full this session, they fall
into three groups: a **2014 program-launch pair** (04-29, 05-28); a **contiguous COVID-operations block
of seven** running **2020-06-24 → 2021-01-27**, which includes **2020-09-23 — an ordinary Wednesday in
an ordinary week**; and genuine holiday/short-week shifts (2023-12-27, 2024-11-26, 2025-11-25,
2025-12-23), plus 2022-07-14, 2024-10-29 and the single 11:00 AM (2019-12-06). So only about four of
seventeen are cleanly holiday-driven. **The conclusion survives** — 11:30 AM is 137/154 overall and
**11 of 12** September auctions, the sole exception being 2020-09-23 inside the COVID block — but the
parent's "This week" falsifier, *"the 2026-09-23 reopening printing a closing time other than 11:30 AM
ET on an ordinary week"*, is mis-specified: it would fire on a regime-operations shift that says nothing
about whether `closing_time_comp` is a reliable schedule read. Recorded here rather than edited there;
ledger rows are append-only and this event is the one being used as the falsifier.

**10. An index-basis precision note.** `frn_index_determination_rate` is the 13-week bill's **discount**
rate, not its investment rate: for the 2026-08-24 determination the FRN field reads **3.715** while the
same bill's `high_investment_rate` reads **3.803**. The parent's compression-window path (3.678 → 3.859)
is on the investment-rate basis and is therefore not directly comparable to the FRN's own field. On the
FRN's own basis the path across the same window is **3.600** (05-18) → **3.815** (07-27) → **3.715**
(08-24) — still up over the window, so **the parent's directional conclusion is unaffected**; only the
numbers should not be quoted interchangeably. Bill supply is pinned at **$92B** for 12 consecutive
13-week auctions, including the announced 09-08 row.

**11. No tracked name is exposed — SUPPORTED, inherited.** `symbols: []`. A 2-year floater indexed to
the 13-week bill sits at the opposite end of the curve from the long-end duration channel that hit CRWV
−12.1% and SOX −5% on 2026-08-18, and transmits nothing into it.

**12. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve **2026-09-04** (freshest close; 2026-09-05 is a **Saturday**, 09-07 is Labor Day,
next session 09-08): 3-Mo **3.91** · 2Y **4.37** · 5Y **4.54** · 7Y **4.65** · 10Y **4.78** · 20Y
**5.25** · 30Y **5.24**. **VIX 14.53** (09-04 close, Yahoo `^VIX`; the week ran 14.51 · 14.43 · 14.92 ·
16.34 · 15.20 · 14.32 · 14.53). 13-week bill investment rate **3.859%** at the 2026-08-31 auction, $92B.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event, and the
answer this doc would give even if the date were confirmed, because no house playbook is rates-keyed.
Three things follow instead.

**Read the print for two fields and apply one adjustment.** `spread` (expect **0.0500**; a different
number breaks a 103/103 identity and matters more than anything else on the page) and
`high_discnt_margin`. Then subtract **~1.5bp** from the margin before carrying it to 10-28 — the measured
bias in leg 2, which is the operational output of this session.

**Price the free read rather than assuming it.** The read is good — corr 0.928 is the best anchor
available for the number that stamps ~$86B — and it is not clean: it crosses a hike-modal FOMC whose
outcome its index will contain and 10-28's will not. A session in October that carries the 09-23 number
across without noting which side of 09-16 it sits on is doing the arithmetic and skipping the regime.

**Treat a kill-switch fire as a funding signal until shown otherwise.** At 1-in-16 with the single
precedent being December 2018, >10.0bp on 09-23 should send the next session to bill supply, repo and
the 13-week take-down before it sends anyone to a story about FRN demand.

### Honest limits

**The auction has not happened; every number about it is a document read, and the date is `estimate`** —
a tentative schedule is tentative and the confirming primary is the 2026-09-17 announcement. **The
2026-09-21 index determination is modal plus one scheduled bill auction, not a published field for a
future auction** — 8 of the last 10 determinations fell on the Monday of auction week, and the schedule
PDF puts a 13-week bill on Monday 09-21; the field itself only exists after the fact. **The R2→new-issue
statistics are 50 overlapping cycles from one instrument** — corr 0.928 rides a large common level trend
across 2014-2026, so the honest claim is *relative* (R2 beats R1 beats the prior new issue) rather than a
claim that 0.928 is forecasting skill; the mean-absolute-error comparison (2.55 vs 4.42bp) is the more
defensible half. **The −1.50bp bias is a full-sample mean and it shrinks to −0.90bp on 2021+**, with
sd large enough that it is a tilt, not a rule; 13 of 50 cycles went the other way. **The 1-in-16 kill
base rate is 16 observations**, and its one hit is a regime this doc cannot rule in or out for
September. **The SOMA refutation is auction-side and level-based** — first differences on n=22 is thin,
and a bill-richness story can be entirely true in secondary-market pricing while invisible in primary
allotments; this session did not price bills against OIS. **The FOMC probabilities are quoted from
[`fomc-2026-09-16`](fomc-2026-09-16.md) as of 2026-09-05**, are venue-disagreeing by ~15 points, and are
estimates that widen caution and license nothing. **The closing-time exception grouping infers "COVID
operations" from a contiguous date block**, not from a Treasury statement of policy — the same class of
inference this doc criticises in leg 9, and labelled as such.

## Stance & kill switches

**Stance (date `estimate`; the schedule row, the 13-week bill row, the full 154-auction record and the
tape all primary-sourced 2026-09-05).** This is a **zero-position, unhedgeable read-only event** whose
value is entirely instrumental: it is the last observable input before the 2026-10-28 new issue stamps a
two-year coupon spread on ~$86B. This session's contribution is to make that instrument honest — it is
the **best available anchor** (corr 0.928, mean\|err\| 2.55bp, beating the prior new issue's 0.716 /
4.42bp), it is **biased 1.50bp wide** and must be adjusted down before use, its inherited kill switch is
a **1-in-16 tail whose one precedent is a funding squeeze**, and it prices on the **far side of a
hike-modal FOMC** whose decision its index will already contain while 10-28's will not. Expect
`spread = 0.0500`, `soma_accepted = 0`, a close at 11:30 ET and a margin in **3.5–8.5bp**.

**Refinement (2026-09-15 pulse, D-8; receipt is that row).** The stance is unchanged in kind — still
zero-position, read-only — and sharper in two places. **First, the straddle got priced.** The 09-16
decision ran to **91.4%** hike (futures-derived, 09-14) from the ~50–65% quoted above, and the index
basis moved with it *before* its determination: 13-week discount **3.800 → 3.970** (+**17.0bp**, the
largest weekly move in two years), already **+25.5bp** versus R1's. That makes leg 6's boundary real —
and this pulse measured what crossing it costs, which the initial research could not: **in first
differences a rising index is close to margin-neutral** (corr **−0.087** all-history, **+0.076** on
2021+; Δindex ≥ +10bp → mean Δmargin **+0.37bp**, wider 14/31). On the exact setup (R2 · R1 ≤ 6bp ·
Δindex ≥ +10bp, **n=4**) the mean R2−R1 is **+0.83bp** over **[−0.3, +3.3]**, so the expected centre
moves from **5.5** to **~6.3bp** with an analogue span of **5.2–8.8bp** — inside `-2`'s registered
**3.5–8.5bp** band, tilted to its upper half, top analogue **0.3bp** past the ceiling. Not re-registered:
`-2` already scores this observation, and stacking a second row on one outcome is the practice this doc
declined for the −1.50bp bias. **Second, the >10.0bp switch lost its alibi.** SOFR **eased** to **3.62%**
(09-14) with an 8bp p99 tail on **$2.86T** while the index rose 17bp, and bill supply is flat at **$92B**
for 12 consecutive auctions — so neither of the two stories the switch could tell (funding squeeze,
supply) has support in the tape today, and a fire on 09-23 should be read as FRN-specific.

**Three durable outputs.** (a) **The free read is measured, not assumed** — the R2 position is the
sharpest forecaster of the next stamped spread, with a stated error and a stated bias. (b) **The
timing asymmetry** — index post-decision here, pre-decision on 10-28 — which is the first statement in
this calendar that the two FRN prints are not drawn from the same regime. (c) **A fourth failed
mechanism candidate (SOMA add-ons) and one structural fact that survives it** — the Fed rolls into new
issues, not reopenings, 10/10 vs 1/10 since 2024.

**Inherited, not re-registered.** [`FT-treasury-coupon-announcement-2026-10-22-2`](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
owns the 10-28-vs-09-23 margin band and names this auction as its own free intermediate check; its
>10.0bp switch is adopted here verbatim. [`FT-treasury-2y-frn-2026-10-28-1`](../forward-tests/treasury-2y-frn-2026-10-28.md)
owns 10-28's indirect share. [`FT-treasury-coupon-announcement-2026-10-22-1`](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
owns the 09-17 announcement's size block. **The −1.50bp tightening bias is deliberately NOT registered
as a third prediction against the 2026-10-28 print** — `-2` already scores that one observation, and the
parent's own precedent is to inherit rather than stack a second row on one outcome. It is stated here as
a measurement and as an adjustment the October session should apply.

**Two forward tests registered**, both scoring at this event's own close-out (**2026-09-24**) so this
fragment stays self-contained:

- **`FT-treasury-2y-frn-2026-09-23-1`** — the 09-23 reopening prints `spread = 0.0500`, inheriting
  BF-2028's stamp. Base rate **103/103 = 100%**, disclosed: the pass is uninformative and the test
  exists **entirely for its fail**, which would break the identity the whole "$86B stamped for two
  years" frame rests on, five weeks before 10-28 could.
- **`FT-treasury-2y-frn-2026-09-23-2`** — the margin lands in **3.5–8.5bp**. Base rate **36/50 = 72%**
  (18/22 since 2021), disclosed. This is the distributional claim the >10.0bp switch does not make: it
  fails on a *tightening* surprise too, which no existing test in this calendar can detect.

**Kill switches:**

- **A high discount margin above 10.0bp on 2026-09-23** — the compressed-regime premise breaks and
  10-28's anchor is measured off a level nobody predicted. Inherited verbatim from both parents; the
  contribution here is its base rate (**1 of 16** on the matching setup) and its likely meaning (funding,
  not FRN supply).
- **A margin outside 3.5–8.5bp in either direction** — `-2`'s own kill. A print below 3.5bp is as
  informative as one above 10.0bp and currently has no detector anywhere in this calendar.
- **`spread` printing anything other than 0.0500 on 2026-09-23** — `-1`'s kill; the 103/103 identity is
  not an identity and legs 1, 2 and 7 fall with it, along with the parent's $86B frame.
- **`frn_index_determination_date` printing anything other than 2026-09-21** — leg 6's timing chain is
  wrong, the post-decision framing goes with it, and the asymmetry against 10-28 is not real.
- **The 2026-09-17 announcement not carrying a 2-Year FRN reopening at $28B**, or carrying it without
  the `R` marker — the event's premise is wrong and this doc is rebuilt, not amended. This also kills
  the calendar-proposal filed in this PR.
- **The 2026-10-28 new issue printing more than 2.55bp ABOVE the 09-23 reopening** — the measured
  tightening bias reverses at the one observation it exists for, and leg 2's adjustment is retracted
  rather than patched, before 2027-01-27 draws the next new issue.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-18 | **Initial research.** Series re-tagged by **position within CUSIP** (new issue / R1 / R2) — the move neither parent made; this event is **R2 of 91282CRD5 (BF-2028)**. **Leg 1, the calendar's "free read" measured for the first time: R2 is the sharpest anchor for the next new issue's stamped spread — corr 0.928, mean\|err\| 2.55bp (n=50), vs R1 0.857 and the prior new issue 0.716 / 4.42bp.** **Leg 2, the correction both parents need: it runs 1.50bp WIDE** — next new issue printed tighter in **37/50** (2021+: −0.90bp, 16/22); R2 sits **+1.51bp** above its own new issue vs R1's **+0.23bp**, i.e. margins drift out across a CUSIP's life and reset at the new issue. **Subtract ~1.5bp from the 09-23 print before carrying it to 10-28** — `FT-…-10-22-2`'s +2.0bp band is measured off the raw number. **Leg 3, the inherited >10.0bp switch given a base rate for the first time: 1 of 16** on the matching setup (R2 with R1 ≤ 6bp); the one precedent is **2018-12-26, 5.0 → 15.0bp**, the December-2018 funding squeeze — so a fire should be read as a **funding** signal, not an FRN-supply one. Nearest analogue is uncanny: **2020-09-23**, same slot, also R2, also R1 **5.5bp**, printed **5.8bp**. **Leg 6, the session's most decision-relevant finding: the timing chain runs OPPOSITE to 10-28's.** Schedule PDF (re-fetched direct, HTTP 200, **17,195 bytes**, 909 glyph runs, rows rebuilt by y-position) y=256 reads `13-Week BILL / Ann Thursday, September 17, 2026 / Auction Monday, September 21, 2026 / Settlement Thursday, September 24, 2026` — so **index fixed 09-21, five days AFTER the 09-16 FOMC**, vs 10-28's index locked **two days BEFORE** its decision. `fomc-2026-09-16` is currently **hike-modal and contested** (CME ~65% · Kalshi 51.5% · Polymarket 49.0%; cut 0%; blackout 09-05→09-17). The 50-cycle base rate in leg 1 was not measured across a live policy boundary — the read is priced, not invalidated. **Leg 4, fourth mechanism candidate tested and REFUTED:** SOMA add-ons look strong at corr(soma, HDM) **−0.720** (2021+, n=23) / **−0.740** (2024+) — first candidate with the right sign — but collapse to **−0.266** in first differences and are collinear with the index at **−0.760**, the same ZIRP artifact the parent's leg 5 caught. **Four candidates, four failures.** **Leg 5, structural and new:** SOMA rolls into **new issues, not reopenings** — 38/51 vs 10/103 full-series, **10/10 vs 1/10 since 2024**; so 09-23 is a pure private-demand $28B print while 10-28 carries a rollover (2026's: $2.11B · **$3.78B**, 5th largest of 154 · **$3.32B**, 7th). **Leg 7:** `spread` identity independently re-derived at **103/103**; BF-2028 stamped **0.0500** on 07-29 — this auction is its **earliest test**, five weeks before 10-28. **Leg 9, a correction to the parent's leg 3 that leaves its conclusion standing:** the 17 non-11:30 closing times are NOT all holiday weeks — a 2014 launch pair, a **contiguous COVID block of 7 (2020-06-24 → 2021-01-27) including 2020-09-23, an ordinary Wednesday**, and only ~4 clean holiday shifts. 11:30 is still **137/154** and **11/12** Septembers, so the parent's "This week" falsifier is mis-specified but its call survives. **Leg 10:** `frn_index_determination_rate` is the bill's **discount** rate (08-24: **3.715**) not its investment rate (**3.803**) — the parent's 3.678→3.859 path is a different basis; on the FRN's own basis 3.600 → 3.815 → 3.715, direction unchanged. 13-week supply pinned **$92B**, 12 consecutive. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** payrolls **+162K vs ~55K** (09-04) with +55K of upward revisions flipped September hike-modal; CPI **09-11** lands mid-blackout. **Rates (Treasury par, primary, 09-04 close):** 3-Mo **3.91** · 2Y **4.37** · 5Y **4.54** · 7Y **4.65** · 10Y **4.78** · 20Y 5.25 · 30Y **5.24**. **VIX 14.53** (09-04; week 14.51/14.43/14.92/**16.34**/15.20/14.32/14.53 — 2026-09-05 is a **Saturday**, 09-07 Labor Day, next session 09-08). **Geopolitical:** **Trump–Xi summit 09-24** (high, `estimate`) sits one day after this auction; UNSC Iran panel mandate votes 09-17 / expires 09-26. **Adjacency — 15 tracked entries in the ±5-day corridor; ONE dated event PROPOSED** as `estimate` in this PR: **`treasury-coupon-announcement-2026-09-17`**, the announcement that sizes and confirms THIS auction and has no calendar row despite five sibling announcement events (09-03, 09-10, 10-01, 10-15, 10-22) already being tracked — it is this event's own confirming primary and `FT-…-10-22-1`'s named free pre-check. **Discovered and deliberately NOT filed:** the **09-21** 13-week bill (a weekly bill, not a tracked-event class here — named so leg 6 is checkable) and the **11-24 / 12-23** reopenings (already named and declined by the 10-28 parent). **Two tests registered, both scoring 2026-09-24:** `-1` `spread` = 0.0500 (base rate 103/103, for its fail) and `-2` margin in **3.5–8.5bp** (base rate 36/50 = 72%, 18/22 since 2021 — the only detector in this calendar that also fails on a *tightening* surprise). | **Stance set** — zero-position, read-only; the registrable content is that the free read is now measured (corr 0.928), biased (−1.50bp), and regime-straddling (index post-FOMC), none of which was previously stated | 2026-09-12 (low; D-18 sits in the 15+/30d band, but days-out crosses below 15 on 2026-09-09 and the band tightens to 7d, making 09-12 the first date the 7-day interval since 09-05 is satisfied) |

| 2026-09-15 | D-8 | **Pulse check. The 09-05 straddle resolved, and the session's contribution is to price it in first differences.** **(a) The straddle is near-settled:** [`fomc-2026-09-16`](fomc-2026-09-16.md) now reads **91.4% hike** (futures-derived, *"data as of September 14"*) / **86.2%** venue VWAP / **0% cut**, vs the CME ~65% · Kalshi 51.5% · Polymarket 49.0% this doc quoted on 09-05 — leg 6's asymmetry will almost certainly be realised, not merely risked. **(b) The index has already stepped, before its determination:** 13-week bill discount **3.800 (09-08) → 3.970 (09-14)**, **+17.0bp** — the **largest one-week move in two years** and only the **second ≥17bp week since 2024-01-01** (fiscaldata `auctions_query`, `security_term:13-Week`, HTTP 200, 38,885 bytes, 246 rows since 2022; the other is **2024-09-23 at −21.0bp**, the mirror after that September's FOMC; 10 of 245 weeks ≥17bp = **4.1%** since 2022). Versus R1's **08-24** determination of **3.715** the index is already **+25.5bp** with 09-21 still to come — so the Δindex ≥ +10bp condition below is **live, not hypothetical**. **(c) NEW MEASUREMENT — a rising index is close to margin-neutral, which is the number leg 6 could not supply.** Full 154-auction series re-pulled (HTTP 200, 59,082 bytes, 2014-01-29 → 2026-08-26, no new rows since 08-26) and differenced: corr(Δindex, Δmargin) = **−0.087** (n=153) all-history, **+0.076** on 2021+ (n=69) — the parent's level corr of **+0.824** is a ZIRP artifact and this is its first-difference test. Conditioned on **Δindex ≥ +10bp** (n=31): mean Δmargin **+0.37bp**, wider in **14/31**, range [−10.6, +11.4]. At ≥+20bp (n=11): mean **+0.01bp**, wider 4/11. **(d) On this event's EXACT setup — R2 · R1 ≤ 6bp · Δindex ≥ +10bp — n=4:** 2017-12-27 (3.5→**3.5**), 2018-03-28 (1.6→**4.9**), 2018-09-25 (4.7→**5.0**), 2022-06-22 (0.0→**−0.3**); mean R2−R1 **+0.83bp**, range **[−0.3, +3.3]**. On R1 = **5.5bp** that centres 09-23 at **~6.3bp** spanning **5.2–8.8bp** — **`-2`'s 3.5–8.5bp band survives, tilted into its upper half, with the top analogue clearing the ceiling by 0.3bp.** Recorded as a refinement; **deliberately NOT registered as a third test**, since `-2` already scores this one observation (the doc's own stated no-stacking precedent). **(e) The kill switch loses its alibi:** SOFR **3.62%** on 09-14, *down* 3bp from **3.65%** (09-04), p99 **3.70%** (an 8bp tail), volume **$2.86T** (NY Fed `markets.newyorkfed.org`, HTTP 200) — the index rose 17bp while overnight secured funding **eased**, which separates policy repricing from a squeeze. The one >10.0bp precedent (2018-12-26) was a squeeze; with none visible, a fire on 09-23 would be **FRN-specific**, not 2018 again. Base rate unchanged at **1 of 16**. **(f) Date integrity:** schedule PDF re-fetched today, **byte-identical at 17,195 bytes** (md5 `a079d72f…`) — the 09-23 row has not moved; still `estimate`, confirming primary is the **09-17** announcement, now itself a tracked calendar row (last pulse's proposal landed as canonical `treasury-coupon-announcement-2026-09-17`, medium, with its own initial research). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** PPI 09-10 headline **+0.4%** in line, core **+0.2%** *below* consensus, but y/y **5.4% vs 5.3%**; CPI 09-11 core **+0.3%** (unrounded 0.29%) against a book that had priced 0.2% at 65% — both per the sibling ledgers. **Rates (Treasury par, primary, 09-14 close vs 09-04):** 3-Mo **4.11** (+20bp) · 2Y **4.65** (+28) · 5Y **4.80** (+26) · 7Y **4.88** (+23) · 10Y **4.97** (+19) · 20Y **5.37** · 30Y **5.34** (+10) — a bear flattener, 2s30s 87→69bp; a policy-path repricing, which is exactly the channel the index sits in. **VIX 17.54** (09-15) vs **14.53** (09-04) = **+3.01**, past the 3-point regime threshold and out of the 14–17 range the CPI ledger measured as 28 sessions long. **Geopolitical:** Brent above **$108** and WTI **$104.71** (09-14, per `fomc-2026-09-16`) — an energy-led inflation impulse feeding the hike book; **Trump–Xi summit 09-24** (high, `estimate`) still one day after; UNSC Iran panel mandate expiry **09-26**. **Event tape:** 13-week supply pinned at **$92B** for **12 consecutive** auctions through 09-14 — the switch's "supply" reading has nothing behind it either; no new FRN auction since 08-26, so `-1` and `-2` remain unscoreable until the print. **Adjacency — corridor 15 → 34** tracked entries within ±5 days, one confirmed high/critical (**opex-2026-09-18**). **NO new dated event proposed.** The one candidate this sweep surfaced is the **2026-09-21 13-week bill** — now materially more load-bearing than on 09-05, since it is the auction that fixes the index — and it is declined again for the same reason, verified this session rather than inherited: **the calendar tracks zero bill auctions of any tenor** (`ls src/domain/market-events/` matches no `*-bill-*`/`4-week`/`13-week`/`52-week` id), so filing it opens a ~150-events-a-year recurring class rather than adding an event. Leg 6 stays checkable through `frn_index_determination_date` on the 09-23 print itself. | **Stance refined, not changed** — still zero-position and read-only; the refinement is that the policy straddle is now measured at **near margin-neutral in first differences**, the expected centre moves **5.5 → ~6.3bp** inside an unchanged registered band, and a >10.0bp fire would now be FRN-specific rather than a funding echo | 2026-09-22 (low; D-8 is inside the 0+/7d band, and 7 days from today is 09-22 — D-1, the last pulse before the print) |
| 2026-09-22 | D-1 | **Deterministic screen (no Claude session).** Readings — VIX 14.9 (-2.7pt since last), band unchanged (low:0+), 46 adjacent event(s) tracked, new in corridor since last pulse: `apple-dma-gatekeeper-cjeu-appeal-deadline-2026-09-18`, `bea-international-transactions-q2-2026-09-24`, `costco-q4-fy2026-2026-09-24`, `dmo-pilot-switch-auction-test-2026-09-24`, `eia-weekly-petroleum-status-2026-09-23`, `intl-transactions-q2-2026-09-24` +6 more (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-09-29 |
| 2026-09-24 | D+1 | **Close-out — the auction printed and is scored in full below.** Instrument cache busted per protocol; `symbols: []`, so neither symbol-keyed instrument applies and the scoring source is Treasury's own auction record, re-fetched this session (`fiscaldata.treasury.gov` `auctions_query`, CUSIP **91282CRD5**), never memory. **Result:** `spread` **0.0500** (identity holds, `-1` PASSES on its uninformative side), `high_discnt_margin` **4.0bp** (inside the registered **3.5–8.5bp** band, `-2` PASSES), `avg_med_discnt_margin` **1.0bp**, `soma_accepted` **0** (leg 5's new-issue-only rollover pattern extends to 11/11 since 2024), `frn_index_determination_date` **2026-09-21** exactly as leg 6's chain named, `frn_index_determination_rate` **4.015%** (+30.0bp vs R1's 3.715%, +4.5bp beyond the 09-15 pulse's 3.970% reading), closing time **11:30 AM**, offering **$28,000,000,000** as a **Yes**-flagged reopening — every inherited kill switch (>10.0bp margin, margin outside 3.5–8.5bp, `spread` ≠ 0.0500, index date ≠ 09-21, announcement not a $28B `R`-marked reopening) checked and none fired. **But the 09-15 refinement's point estimate missed:** R2−R1 printed **−1.5bp** (5.5→4.0bp), a compression, against that pulse's **~6.3bp** centre (span 5.2–8.8bp) built from the exact-setup n=4 analogue; the coarser Δindex ≥ +20bp bucket (n=11, mean **+0.01bp**, tighter in 7/11) — a closer match to this cycle's realized +30.0bp move than the ≤10bp-conditioned n=4 set — called the direction right where the finer analogue didn't. Recorded as a model-selection lesson, not a kill: neither registered test's threshold depended on the refined centre. **Demand softened on conventional measures while the margin tightened:** bid-to-cover **2.63**, down from 3.14 (08-26) and 3.37 (07-29); indirect share (of competitive accepted) **59.09%**, down from 66.56% (08-26); dealer share **40.92%**, up from 33.08% — a dissociation between weaker headline demand and a tighter margin that no registered test here measures. **Rates:** Treasury's par curve 09-14→09-23 continued repricing higher across the curve (3-Mo 4.11→4.19, 2Y 4.65→4.85, 10Y 4.97→5.11); **VIX 15.18** (09-23 close) vs 14.87 (09-21) — inside the 3-point regime bar. Both forward tests scored in [`forward-tests/treasury-2y-frn-2026-09-23.md`](../forward-tests/treasury-2y-frn-2026-09-23.md). `## Outcome` written below. | Both registered forward tests PASS; the stance's core content — a measured, biased, regime-straddling "free read" for 10-28 — stands, refined by one honest miss (the exact-setup analogue's centering) that a coarser, better-matched bucket would have called correctly | — (closed; scanner goes quiet on this event) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`) in the same PR. Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory.

## Outcome

**Close-out (2026-09-24, D+1 — inside the `closeOutWithinDays: 6` deadline).** Rates mode runs no
`earnings-cycle`/`intraday-edges` instrument (`symbols: []`, unchanged since initial research); the
cache was busted anyway per the lane's standing instruction, though nothing here reads it. "Re-run
instrument data" means the executed auction record itself, re-fetched this session, never a prior
row's document read: `api.fiscaldata.treasury.gov`'s `auctions_query` for CUSIP **91282CRD5**
(fields `high_discnt_margin`, `avg_med_discnt_margin`, `spread`, `soma_accepted`,
`frn_index_determination_date/rate`, `closing_time_comp`, `reopening`, `offering_amt`,
`bid_to_cover_ratio`, and the raw bidder-accepted/tendered fields), Treasury's daily par
yield-curve CSV for 09-14→09-23, and Cboe's VIX daily series (Yahoo `^VIX`). Every fetch resolved
this session.

**What printed.**

| Field | 2026-09-23 | Prediction / prior | Result |
|---|---|---|---|
| `spread` | **0.0500** | Must equal 0.0500 (`-1`) | **Identity holds — 104/104 since 2014** |
| `high_discnt_margin` | **4.0bp** | 3.5–8.5bp (`-2`); 09-15 pulse centred ~6.3bp (5.2–8.8bp) | **Inside the registered band; below the refined centre** |
| `avg_med_discnt_margin` | 1.0bp | — | recorded, not tested |
| `soma_accepted` | **0** | Leg 5: reopenings almost never carry one | **Holds — new-issue-only rollover now 11/11 since 2024** |
| `frn_index_determination_date` | **2026-09-21** | Leg 6's chain named this exact date | **Matches** |
| `frn_index_determination_rate` | **4.015%** | R1 (08-24) 3.715% \| 09-15 pulse reading 3.970% | **+30.0bp vs R1, +4.5bp beyond the last pulse** |
| Closing time | **11:30 AM** | Modal | **Matches** |
| Offering / reopening flag | **$28,000,000,000 / Yes** | $28B grid, `R` marker | **Matches — 21 of 21 since 2024-05-29** |
| Bid-to-cover | **2.63** | 3.14 (08-26), 3.37 (07-29) | **Weaker, third straight decline** |
| Indirect share (of comp. accepted) | **59.09%** | 66.56% (08-26) | **Down 7.5pp** |
| Dealer share | **40.92%** | 33.08% (08-26) | **Up 7.8pp** |

Bidder shares computed here from raw accepted dollars over `comp_accepted` ($27,989,762,500):
indirect $16,537,912,500 / dealer $11,451,850,000 / direct $0, summing to 100.0%.

**Scoring the two forward tests — both PASS**, scored in full in
[`forward-tests/treasury-2y-frn-2026-09-23.md`](../forward-tests/treasury-2y-frn-2026-09-23.md).

**`FT-treasury-2y-frn-2026-09-23-1` — PASSES**, as its 103/103 (now 104/104) base rate said it
almost certainly would. The pass is uninformative by the test's own registration; its value was
always in the fail it did not have. BF-2028's `spread = 0.0500` stamp is still intact five weeks
before the 2026-10-28 new issue tests it independently.

**`FT-treasury-2y-frn-2026-09-23-2` — PASSES.** 4.0bp sits inside the registered 3.5–8.5bp band
(base rate 72% all-history / 82% since 2021, disclosed as moderately informative). But the print
lands **below** R1 (5.5bp), not above it, and **below** the 09-15 pulse's own refined centre of
~6.3bp — the pass is real on the letter of the registered test, and the refinement layered on top
of it missed the direction its own math implied.

**The mechanism: the 09-15 refinement's exact-setup analogue (n=4) was thinner and worse-matched
than a coarser bucket already sitting in the same pulse.** That session conditioned on the precise
historical setup (R2 · R1 ≤ 6bp · Δindex ≥ +10bp, n=4: mean R2−R1 **+0.83bp**) to centre this
print at ~6.3bp. But this cycle's realized index move was **+30.0bp** off R1 — well past the
+10bp threshold that n=4 sample used, and squarely inside the **Δindex ≥ +20bp** bucket the same
pulse also computed (n=11, mean **+0.01bp**, tighter in **7 of 11**) — the bucket whose magnitude
actually matches what happened. That coarser bucket called the sign right; the finer, headline
number the pulse foregrounded did not. Recorded as a model-selection lesson for the next FRN in
this series: when a live cycle's Δindex exceeds the exact-setup sample's own range, the wider
bucket at the matching magnitude is the better read, not the thinner one nearest the labels.
Neither registered test's threshold depended on this centre, so nothing here is a kill — `-2`
passed exactly as written.

**A dissociation the registered tests do not measure.** Demand softened by two conventional
gauges — bid-to-cover **2.63** (down from 3.14, 3.37) and indirect share **59.09%** (down from
66.56%) — while the margin itself tightened rather than widened. Dealers absorbed the difference
(40.92%, up from 33.08%). This is context, not a scored claim: no forward test in this fragment or
its parents keys on bidder composition for this event, and the calendar's own composition genre
(the 2Y **note** ledgers) tests that question on a different security.

**Rates — the tape kept repricing through the print, unremarkably for this instrument.** Treasury's
par curve, fetched direct: 3-Mo **4.11 (09-14) → 4.19 (09-23)**, 2Y **4.65 → 4.85**, 10Y **4.97 →
5.11** — continued post-FOMC drift, not a reaction to this auction specifically (`symbols: []`, no
transmission channel exists). VIX **15.18** (09-23 close) vs **14.87** (09-21) — inside the
3-point regime bar this doc has used throughout.

**What this closes and what it hands to 2026-10-28.** The three durable outputs the 09-05 initial
research and 09-15 pulse built — the measured/biased free read, the timing asymmetry, and the
SOMA-rollover asymmetry — all stand: this print is the earliest test of the `spread` identity
(passed), confirms the index-post-FOMC timing chain exactly as scheduled, and confirms
`soma_accepted = 0` as a pure private-demand print. The **−1.50bp tightening bias** measured at
initial research remains unregistered against 10-28 (owned instead by
[`FT-treasury-coupon-announcement-2026-10-22-2`](../forward-tests/treasury-coupon-announcement-2026-10-22.md)),
and this print adds one more data point to that population once 10-28 prices: R2 (4.0bp) vs
whatever the new issue stamps.

**Honest limits.** No when-issued level was sought or found for this CUSIP; the auction's own
distributional fields (high/median/low margin) are the reference. The −1.5bp Δmargin observed here
is one draw and does not itself revise the n=31/n=11 base rates the 09-15 pulse computed — those
stay as documented, with this print now available as one additional out-of-sample observation for
whichever later session next re-runs that regression. The bidder-composition dissociation noted
above was not tested against any prior norm computed specifically for FRN reopenings (only the
sibling 2Y **note** ledgers carry that machinery), so "weaker demand" here is a relative statement
against this CUSIP's own two prior prints, not a full-series base rate.

**Last assessed:** 2026-09-24 (close-out — the scanner goes quiet on this event from here)
<!-- probe-ref: {"symbols":{},"vix":15.18,"daysBand":"low:0+","adjacentIds":["apple-dma-gatekeeper-cjeu-appeal-deadline-2026-09-18","bea-international-transactions-q2-2026-09-24","boj-decision-2026-09-18","bowman-stress-testing-2026-09-18","census-benchmark-revision-nsa-2026-09-28","costco-q4-fy2026-2026-09-24","dallas-fed-mfg-2026-09-28","dmo-pilot-switch-auction-test-2026-09-24","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","eia-weekly-petroleum-status-2026-09-23","industrial-production-2026-09-18","intl-transactions-q2-2026-09-24","japan-cpi-2026-09-18","jgb-liquidity-enhancement-5-11y-2026-09-25","jpx-market-closure-2026-09-21","jpx-market-closure-2026-09-22","jpx-market-closure-2026-09-23","kb-home-q3-fy2026-2026-09-22","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","new-home-sales-2026-09-24","opex-2026-09-18","retail-benchmark-revision-2026-09-28","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-global-flash-eurozone-pmi-2026-09-23","sp-global-flash-france-pmi-2026-09-23","sp-global-flash-germany-pmi-2026-09-23","sp-global-flash-us-pmi-2026-09-23","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","trump-xi-summit-2026-09-24","uk-consumer-confidence-2026-09-25","uk-public-sector-finances-2026-09-22","uk-retail-sales-2026-09-18","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26","unsc-middle-east-2334-2026-09-28","us-iip-q2-2026-2026-09-24"],"adjacentStrongIds":["opex-2026-09-18"],"screenStreak":0} -->
