# 2-Year Floating Rate Note auction (reopening, series BF-2028) — treasury-2y-frn-2026-09-23

**Kind:** rates · **Date:** 2026-09-23 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer independently re-extracted direct 2026-09-05 — the `2-Year FRN` row at y=226 carries the `R` reopening marker and reads Announcement Thursday September 17 2026 / Auction Wednesday September 23 2026 / Settlement Friday September 25 2026; stays `estimate` because a tentative schedule is tentative and the confirming primary is the 2026-09-17 announcement itself) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-decision-2026-09-18","dallas-fed-mfg-2026-09-28","durable-goods-2026-09-25","meta-connect-2026-09-23","missouri-uocava-ballot-mailing-2026-09-19","opex-2026-09-18","scoos-2026-09-24","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","trump-xi-summit-2026-09-24","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This auction is the calendar's designated "free read" on the 2-Year FRN's four-year-low
discount margin — and this session found that it is not free of the Fed.** Its index rate is set by the
**2026-09-21** 13-week bill auction, which is **five days AFTER the 2026-09-16 FOMC decision**; the
10-28 new issue's index is locked **two days BEFORE** its decision. So the two prints sit on opposite
sides of a policy boundary, and September's decision is currently **hike-modal** (CME ~65%, Kalshi
51.5%, Polymarket 49.0%). The good news is that the read is worth having anyway: measured here for the
first time, a **second reopening is the sharpest single predictor of the next new issue's stamped
spread — corr 0.928, mean error 2.55bp, against 0.716 / 4.42bp for the prior new issue itself** — but it
runs **1.50bp too wide** on average (the next new issue printed tighter in 37 of 50 cycles). And the
inherited kill switch it carries (>10.0bp) is a genuine tail, not a coin flip: conditioned on this exact
setup — a second reopening whose first printed ≤6bp — it has fired **once in sixteen**, in the
December-2018 funding-stress episode. Date is `estimate`, `symbols: []`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-18) | **Stand aside** | High | Saturday, Labor Day Monday, next session 09-08. `symbols: []`, date `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed, and a reopening's margin is a market mark that changes no contract — `spread` on BF-2028 was fixed at **0.0500** on 2026-07-29 and 103/103 reopenings inherit their new issue's stamp. | Treasury announcing this FRN off the **$28B** reopening grid on **2026-09-17**, or without the `R` marker — the event stops being a reopening and this whole doc is rebuilt rather than amended |
| This week | **Watch the 09-16 FOMC as an input to THIS auction, not as background** | Medium | New this session and unstated anywhere in the calendar: the index is fixed by the **2026-09-21** 13-week bill auction (schedule PDF, y=256: announced 09-17, auctioned Monday 09-21, settling 09-24), i.e. **after** the decision. A 09-16 hike lands in the index, not in the margin — the mirror of 10-28, where it cannot land in either. | The **2026-09-21** 13-week bill auction not occurring, or `frn_index_determination_date` printing a date other than 2026-09-21 on 09-23 — the post-decision framing is wrong and the two prints are comparable after all |
| This month | **Read the print for exactly two fields — `high_discnt_margin` and `spread` — and adjust the first down ~1.5bp before carrying it to 10-28** | Medium | The R2→next-new-issue relationship measured here (corr **0.928**, mean\|err\| **2.55bp**, n=50) beats every other anchor available, but carries a **−1.50bp** tightening bias (37/50 tighter). Reading 09-23 across to 10-28 unadjusted is systematically wide. | The **2026-10-28** new issue printing **more than 2.55bp above** the 09-23 reopening — the bias reverses at the one observation the estimate exists for, and the R2-forecaster leg is re-derived rather than patched |
| This quarter | **Do not treat a >10.0bp print as noise if it comes — but do not expect one** | Medium | Base rate computed this session for the inherited kill switch, on the matching setup (R2 with R1 ≤ 6bp): **1 of 16**, the single precedent being **2018-12-26 (5.0 → 15.0bp)** in the December-2018 funding squeeze. A fire is therefore ~94% likely to be a funding-regime signal, not an FRN-supply one. | A >10.0bp print on **2026-09-23** with 13-week bill supply unchanged at **$92B** and no repo/funding dislocation in the same week — the one clean read of the switch as a supply signal rather than a stress signal |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date `estimate`, no house playbook is rates-keyed. Zero
  capital is at stake in anything below.
- **The timing asymmetry, new and sourced:** index locked **2026-09-21** (post-FOMC) here vs
  **2026-10-26** (pre-FOMC) on 10-28. The two margins are measured against indices on opposite sides of
  a decision that is currently hike-modal.
- **What this print can and cannot say:** it re-marks BF-2028 at market; it cannot change BF-2028's
  `spread`, which stays **0.0500** by the 103/103 identity re-derived independently this session.
- **The forecast, with its bias stated:** R2 margin **−1.50bp** ≈ the next new issue's margin. On the
  09-23 print, subtract ~1.5bp before carrying it to 10-28.
- **The band this auction is expected in:** **3.5–8.5bp**, from R1 = 5.5bp plus the empirical R2−R1
  window of [−2.0, +3.0] (36/50 all-history, 18/22 since 2021). Registered as `-2`.
- **The closest historical analogue is uncannily close:** **2020-09-23** — same calendar slot, also a
  second reopening, also R1 = **5.5bp** — printed **5.8bp**. It is also the counterexample to the
  "exceptions are holiday weeks only" reading of the closing-time field (see leg 5).
- **Structural, and it separates this print from 10-28:** Fed **SOMA add-ons land on new issues, not
  reopenings** — 38/51 vs 10/103, and since 2024 it is 10/10 vs 1/10. This auction is a pure
  private-demand print; 10-28 will carry a ~$2–4B rollover on top of its $30B.
- **Watch (dated):** CPI **09-11** · 20Y reopening **09-15** · **FOMC 09-16** · announcement **09-17**
  (the confirming primary; proposed to the calendar in this PR) · triple witching **09-18** · 2Y note
  **09-22** · **13-week bill / index determination 09-21** · **this auction + 5Y note 09-23** · 7Y note
  + 20-30Y buyback + Trump–Xi summit **09-24** · settlement **09-25** · next FRN **10-28**.

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

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`) in the same PR. Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory.
