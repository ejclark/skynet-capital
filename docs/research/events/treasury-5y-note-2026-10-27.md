# 5-Year Treasury Note auction (new issue) — treasury-5y-note-2026-10-27

**Kind:** rates · **Date:** 2026-10-27 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — `5-Year NOTE` announce 10-22, auction 10-27, settle 11-02; 1:00pm ET by convention, not separately sourced) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","treasury-2y-note-2026-10-26","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The 5-Year auction does not move the 5-Year — it bends the curve at one point — and
the yardstick this doc built to grade the print (dealer takedown, not indirect share) just took a
body blow from the very next auction it was built to grade.** Core finding, unchanged since
initial research (43 nominal 5Y auctions since 2023-01, 920 sessions): on a 5Y auction day the 5Y
CMT closes **−0.77bp**, t = **−1.07** — statistically nothing — while the 5Y **relative to the
average of the 3Y and 7Y** moves **−1.69bp**, t = **−9.84**, against **+0.09bp** on non-auction
sessions, substantially mechanical (bid-to-cover explains none of the day, corr −0.038) and firing
on every nominal tenor (2Y −4.14 · 3Y −3.09 · 5Y −1.69 · 7Y −1.09 · 10Y −1.60 · 20Y −2.00 ·
30Y −0.87). **New this pulse (2026-09-27): the 09-23 predecessor — the auction immediately before
this one — closed out** (re-verified direct this session from fiscaldata `auctions_query`, CUSIP
91282CRN3: high yield 5.033%, bid-to-cover 2.210, matching that ledger's close-out field-for-field)
as the weakest 5Y print of this doc's life on every leg: tail **+3.1bp**, bid-to-cover **2.21**
(below the entire $70B-era 2.28–2.43 range — **this doc's own kill switch fires**), indirect
**54.31%** (a new 12-print low), and dealer takedown **15.77%** — not just above the 13.2% p75
line this doc uses to call a print "weak," but above the *entire* prior 12-print range
(8.84–15.61%) — **the second registered kill switch also fires**. Both of that sibling's own
forward tests (dealer, indirect) scored **KILLED**. The 09-22 2Y sibling missed its own
dealer-takedown threshold too (13.19% vs 12.1%) — two consecutive tenors, two consecutive
auctions, both breaking on the capacity leg, which its own close-out now reads as a **curve-wide
capacity problem**, not composition noise. **Practical consequence:** the $70B-era bands this doc
built to grade 2026-10-27's own print (dealer p25 11.0%/median 12.3%/p75 13.2%, bid-to-cover
2.28–2.43) are now stale on their own most recent input; `FT-treasury-5y-note-2026-10-27-2` is
registered this pulse to test whether the weakness repeats on this auction itself. Separately: the
2026-10-28 FOMC one day after this sale has itself repriced from hold-modal to hike-modal
(~62–66%, Polymarket/CME, fetched today by the sibling ledger) — reinforcing, not softening, this
doc's D−1 finding that 2026-10-27 will be a loud tape, not a muted one (the pin the 2Y sibling
measured is a D−2 property and vanishes at D−1, where the 5Y's mean absolute move is 4.86bp
against 4.85bp on ordinary far-from-FOMC sessions). VIX **14.87** (09-25 close), +0.34pt since
initial research — no regime shift. Brent has round-tripped from the mid-September Saudi
East-West-pipeline spike (~$130.80 FRED / ~$108 press, 09-15/16) back to **$97.44** (09-25) after
the pipeline resumed pumping 09-22 — the acute geopolitical leg is cooling, not confirmed dead.
This auction's own terms remain unconfirmed: no 2026-10-22 announcement yet, size still $70B by
guidance only. `symbols: []`, date `estimate`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-27, D-30) | **Stand aside** | High | Terms and size remain unconfirmed until the **2026-10-22** announcement, and `symbols: []` leaves nothing to express a view in regardless. | Nothing dated today for this event; its terms are 25 days away |
| This week | **Stand aside** | High | No development this event's own terms depend on lands this week; the corridor's binding print (jobs 10-02) sits just outside this ledger's remit. | A 2026-10-22-dated size or schedule change surfacing early — not seen on any primary checked this session |
| This month | **Watch demand, not the FOMC-eve story — the grading yardstick just broke on its own most recent test** | Medium | The 09-23 predecessor fired both of this doc's registered kill switches (dealer 15.77% > 13.2%, bid-to-cover 2.21 outside 2.28–2.43); the 09-22 2Y missed its own threshold too — two tenors, two auctions, the same capacity break. | This auction's own 2026-10-27 print landing back inside every $70B-era band (dealer ≤13.2%, BTC 2.28–2.43) — registered as `FT-treasury-5y-note-2026-10-27-2` |
| This quarter | **Expect a loud tape, and now a live demand question too** | Medium | The FOMC-eve pin is a D−2 property that does not reach this D−1 sale (unchanged); the October FOMC has now repriced to hike-modal (~62–66%), reinforcing a loud session — and two straight belly/front auctions have missed their own demand bands, so the print itself is no longer a formality either. | A 5Y CMT mean absolute move ≤3.0bp on 2026-10-27 (the original D−1 falsifier), or a print back inside every $70B-era band (the new one) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, and no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed. This is a read-it-don't-trade-it event.
- **The measured effect, so it stops being assumed either way:** the 5Y *level* does **nothing**
  on its own auction day (−0.77bp, t = −1.07, n=43). The 5Y *relative to its neighbours* moves
  **−1.69bp** (t = −9.84) against +0.09bp on 876 non-auction sessions, entirely at D+0.
- **The base case for 2026-10-27** is therefore: no outright expectation at all, and a
  ~1.5–2bp local dip at the 5Y point of the curve. **P(relative ≤ −1.0bp) is 79% on auction days
  versus 11% on ordinary sessions.**
- **Read the relative move as partly mechanical.** Bid-to-cover explains none of the same-day move
  (corr −0.038, t = −0.19) and a 10Y reopening shows a third of a new issue's effect — consistent
  with Treasury's par curve re-anchoring on a fresh on-the-run. Do not call it "the auction rallied
  the belly."
- **The correct yardstick for the print itself — dealer takedown, and it just broke.** $70B era
  through 09-23, n=29: min **8.8%** · p25 **11.0%** · median **12.3%** · p75 **13.2%** · **new max
  15.77% (09-23)**, above the prior max of 15.61%. **Weak print** = dealer above **13.2%** — the
  09-23 print is now the worst of the era on this metric.
- **The wrong yardstick, named so it stops being reused** — indirect share against a "~65.7%
  norm". The live mean is **63.4%** (43 auctions), indirect and direct are substitutes
  (corr −0.871); 08-26's 61.5% sat alongside the 7th-lowest dealer takedown of 43, but 09-23's
  54.31% (a new 12-print low) landed *with* the era's worst dealer print, not against it — the two
  metrics failed together this time, not in the offsetting pattern the correction relied on.
- **Percentages are on the competitive base** (indirect + direct + dealer), never `total_accepted`
  — SOMA add-ons ran **$0.3–10.5B** across the $70B era, so the wrong denominator shifts every
  share by up to 13 points.
- **Bid-to-cover band, $70B era** (29 auctions, 2024-04-24 → 2026-09-23): the prior 2.28–2.43 range
  (28 auctions through 08-26) is now **2.21–2.43** — 09-23 printed a new low, **outside** the
  range this doc used to grade it, per the registered kill switch (fired, see Stance §).
- **Kill switches fired this pulse (2026-09-27):** the 09-23 predecessor's dealer takedown
  (15.77%) and bid-to-cover (2.21) both breached this doc's own registered thresholds.
  `FT-treasury-5y-note-2026-10-27-2` is registered to test whether 2026-10-27 repeats the miss —
  see Stance § for the amendment.
- **Size is settled before it opens — $70B**, verbatim from `sb0590` (2026-08-05), read direct this
  session; a deviation at the **2026-10-22** announcement voids every like-for-like claim above.
- **Data hygiene, load-bearing:** the fiscaldata row for **2026-01-26** carries
  `original_security_term: 5-Year` and must be **excluded** from any 5Y series, or it injects a
  $69B two-year auction into a $70B five-year one. See leg 6.
- **Watch (dated)** — ~~CPI 09-11~~ · ~~FOMC 09-16~~ (hiked 25bp to 3.75–4.00%) ·
  ~~the predecessor 5Y 09-23~~ (weak, closed out — see Stance §) · CPI **10-14** ·
  20Y **10-21** · 5Y TIPS **10-22** · this announcement **10-22** · 2Y **10-26** · this auction
  **10-27** · the 20-30Y buyback the same afternoon **10-27** · FOMC **10-28** (now hike-modal,
  ~62–66%) · GDP/PCE **10-29** · 7Y **10-29** · ECI **10-30** · settlement **11-02**.

## Initial research

**The question, plainly:** the 2Y sibling measured a large, robust front-end rally on 2Y auction
days and asked whether it survives selling into an FOMC. This sale is the same week, one tenor out,
and one day closer to the meeting. Does that effect exist at the belly at all — and if it does,
what does 2026-10-27's D−1 slot do to it?

**One-line verdict:** the effect does **not** exist at the 5Y as a level move, it exists as a
sharp and highly significant *curve* move that fires on every nominal tenor and looks substantially
mechanical, and the FOMC-eve pin the 2Y sibling relied on is a D−2 property that does not reach
2026-10-27 — so the practical output is three corrections to how this calendar reads auction days,
and no position.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode
— the house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure below is computed this
session from two Treasury primaries fetched today: the Fiscal Data `auctions_query` dataset (302
Note records and 141 Bond records since 2023-01-01; TIPS excluded on the dataset's own
`index_ratio_on_issue_date` field, FRNs on `floating_rate`) and the daily par yield curve CSVs for
2023–2026 (920 sessions, 2023-01-03 → 2026-09-04). Schedule provenance is the Tentative Auction
Schedule PDF (home.treasury.gov, HTTP 200, 17,195 bytes, text layer decompressed direct). Size
provenance is press release `sb0590` (2026-08-05), fetched and read as text this session. Buyback
provenance is the Tentative Schedule of Treasury Buyback Operations PDF (HTTP 200, 125,547 bytes,
TJ-array text layer decompressed direct). FOMC meeting dates are the published calendar; policy
pricing is carried from [`fomc-2026-10-28.md`](fomc-2026-10-28.md). VIX is the 2026-09-04 close.
Each claim dated in line.

### Conviction legs, tested

**1. The date and terms are right, and the entry stays `estimate` on purpose — SUPPORTED.** The
tentative schedule carries the row verbatim: `5-Year NOTE · Thursday, October 22, 2026 · Tuesday,
October 27, 2026 · Monday, November 02, 2026` (announcement · auction · settlement). The absence of
an `R` marks a new issue. Worth recording because it is the reason this doc exists in the shape it
does: **the 5Y normally sells on a Wednesday** — 20 of the 43 auctions on record do — and here it
sells Tuesday, because the 2-Year FRN takes Wednesday 10-28, which is FOMC decision day. The whole
October block shifts a day early (2Y Mon 10-26, 5Y Tue 10-27, FRN Wed 10-28, 7Y Thu 10-29), and
that shift is what puts this sale at **D−1** to the statement rather than the D−2 its 2Y sibling
occupies. The entry stays `estimate` for the same two reasons the four other October siblings off
this identical PDF chose it — a tentative schedule is tentative, and this lane may not self-confirm
an event it discovered in-sweep. The confirming primary is the 2026-10-22 announcement.

**2. The size is $70B — SUPPORTED, primary-read.** `sb0590`'s anticipated-size table header is
`2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN` and its **Oct-26 row is
`69 58 70 44 39 13 22 30`**; the 5-Year is column 3. The release also states verbatim that
"Treasury anticipates maintaining nominal coupon and FRN auction sizes for at least the next
several quarters." That is consistent with **28 consecutive $70B 5-Year auctions** on the dataset
(2024-04-24 → 2026-08-26), which is the like-for-like population every band in this doc is computed
over.

**3. The 5Y auction day does NOT move the 5Y — REFUTED, and this is the finding.** Close-to-close
5Y CMT moves over all 920 sessions:

| Population | n | Mean move | Mean \|move\| | t |
|---|---|---|---|---|
| All sessions | 919 | +0.07bp | 4.98bp | +0.30 |
| **5Y auction days** | 43 | **−0.77bp** | 3.56bp | **−1.07** |
| Auction days, >7d from any FOMC | 20 | **−1.10bp** | 3.80bp | **−0.99** |
| Non-auction days, >7d from any FOMC | 586 | +0.05bp | 4.89bp | +0.19 |

Neither auction population is distinguishable from zero. The 2Y sibling's −4.70bp (t = −4.60) has
no counterpart one tenor out. Auction days are also *quieter* here (|move| 3.56bp vs 4.98bp),
the opposite of the 2Y, where they were louder. **A calendar-level consequence:** the sibling's
finding is correct as measured but should not be generalized as "auction days rally the tenor
being sold" — at the 5Y that statement is false.

**4. What the auction actually does is bend the curve at one point — SUPPORTED, and it fires on
every tenor.** Take the 5Y move minus the average of the 3Y and 7Y moves on the same session:

| Population | n | Mean | t |
|---|---|---|---|
| **5Y auction days** | 43 | **−1.69bp** | **−9.84** |
| Non-auction sessions | 876 | +0.09bp | +3.11 |

It is confined to the session itself — on the 5s10s version of the same measure, D−3 −0.42,
D−2 +0.19, D−1 +0.28, **D+0 −1.60 (t = −5.23)**, D+1 +0.30, D+2 +0.12 — and survives every control
this session could build on the 33 auctions the 2Y does *not* share (−1.76bp, t = −4.93): both
sample halves (−2.13 / −1.41), 2025-onward alone (−1.43, t = −2.92), weekday (non-auction Tue/Wed
+0.12bp, n=344) and month-position (non-auction last-8-business-days +0.01bp, n=313). Run the same
own-tenor-minus-neighbours test across the whole nominal coupon strip and **every tenor fires**:

| Tenor | n | Own outright | t | Own minus neighbours | t | Non-auction control |
|---|---|---|---|---|---|---|
| 2-Year | 43 | −4.72bp | −4.51 | **−4.14bp** | −13.14 | +0.17bp |
| 3-Year | 44 | −2.84bp | −4.32 | **−3.09bp** | −15.61 | +0.15bp |
| **5-Year** | 43 | −0.77bp | −1.07 | **−1.69bp** | −9.84 | +0.09bp |
| 7-Year | 44 | −1.43bp | −1.61 | **−1.09bp** | −8.87 | +0.05bp |
| 10-Year (new issue) | 15 | −1.47bp | −1.09 | **−1.60bp** | −8.70 | +0.03bp |
| 20-Year | 15 | −2.53bp | −1.62 | **−2.00bp** | −7.48 | +0.03bp |
| 30-Year | 15 | +1.40bp | +0.71 | **−0.87bp** | −3.39 | +0.03bp |

Seven tenors, seven negative signs, t from −3.4 to −15.6, and the non-auction control is ~0
everywhere. Only the 2Y and 3Y also show it in the outright — which is why the sibling found what
it found.

**5. A large part of that is mechanical, not demand — SUPPORTED on two independent tests.**
Treasury's par yield curve is fitted to the most recently auctioned securities, so an auction day
is also the day the curve's input at that knot can change. Two things separate the mechanics from
the flow:

- **The auction's own demand explains none of the day.** Over the 28-auction $70B era,
  corr(bid-to-cover, same-day 5Y move) = **−0.038** (t = −0.19); corr(dealer takedown, same-day
  move) = **+0.106** (t = 0.54); corr(bid-to-cover, same-day 5s10s) = **−0.070** (t = −0.36).
  All three are nil. Contrast the 2Y sibling, which measured a **significant** −0.388 (t = −2.73)
  on the same relationship — a real asymmetry between the two tenors, not a restatement.
- **Reopenings show a third of the effect.** A reopening re-taps the security that is *already*
  the on-the-run, so it creates no new curve input. At the 10-Year, new issues print **−1.60bp**
  (t = −8.70, n=15) on the relative measure and reopenings **−0.52bp** (t = −4.30, n=29). The gap
  is the size of the roll; the surviving −0.52bp is what is left over.

**Read narrowly.** This does not say the whole effect is an artifact — a third of it survives at
reopenings, and new issues versus reopenings also differ by calendar slot (10Y new issues fall in
refunding months), so this is a decomposition with a confound, not a proof. It says the honest
description is "the curve re-anchors at the auctioned point," not "the auction rallies the tenor."

**6. The 2026-01-26 fiscaldata row is corrupted, and its mechanism is now named — SUPPORTED.** The
[2Y sibling](treasury-2y-note-2026-10-26.md) flagged this row as carrying "inconsistent reopening
metadata" and could only say the fields looked like a five-year note's. From this side the source
is visible: the row's **`cusip` is 91282CGH8**, which is byte-identical to the CUSIP of the
**2023-01-25 five-year note**, along with that note's `series U-2028`, `int_rate 3.500000` and
`maturity_date 2028-01-31` — while its `offering_amt` is **$69B** (the 2Y size), its
`bid_to_cover_ratio` 2.75, and its `original_cusip` **91282CPV7**, a CUSIP that appears nowhere
else in the record. So the January-2026 two-year auction record inherited its security-identity
fields from a five-year note issued three years earlier; a genuine reopening would carry
`cusip === original_cusip`, and this one does not. **The practical consequence is this doc's, not
the sibling's:** any 5Y series keyed on `original_security_term` picks this row up and injects a
$69B two-year auction into it. Every figure above filters on `security_term === "5-Year" &&
original_security_term === "5-Year"`, which excludes exactly one row, this one.

**7. The 09-23 sibling's "soft foreign demand" verdict does not survive — REFUTED.** That ledger's
live claim is that indirect demand at **61.5%** on 2026-08-26 against a "~65.7% norm" is "the one
genuinely weak leg" inside an otherwise solid auction. Three things break it, and they are the same
three the 2Y sibling found at its own tenor:

| Regime | n | Indirect | Direct | Dealer | End-user (ind+dir) |
|---|---|---|---|---|---|
| 2023-01 … 2025-03 | 26 | **68.2%** | 18.1% | 13.7% | 86.3% |
| 2025-04 … 2026-08 | 17 | **64.0%** | **24.6%** | **11.4%** | **88.6%** |

All shares are on the competitive base (indirect + direct + dealer), so each row sums to 100%.

First, the benchmark is stale: the **live 12-auction mean indirect is 63.4%**, so 61.5% is 1.9pp
light, not the 4.2pp the "~65.7%" figure implies. Second, indirect and direct are near-perfect
substitutes — corr(indirect%, direct%) = **−0.871**, t = **−11.38**, n=43 (and **−0.936**,
t = −13.56 inside the $70B era) — so the split measures submission channel, not buyers. Third,
their sum is half as noisy (sd **2.76pt** vs sd(indirect) **5.29pt**) and **rose** 86.3% → 88.6%
across exactly the break where indirect fell. What is left is **dealer takedown**, the residual
underwriters are obliged to absorb, and on 2026-08-26 dealers took **10.05% — the 7th lowest of
43 auctions on record**, well inside the strong half of the $70B-era band (p25 11.0%). Read on the
metric that is not a reclassification, that was one of the better 5-year auctions of the era. **This
does not accuse the sibling of a bad read** — it says its yardstick cannot support the verdict, and
that this tenor's "2026's weakest coupon" framing, which the 09-23 ledger had already narrowed once
to "foreign demand alone," should now be retired rather than narrowed again.

**8. 2026-10-27 is not a quiet FOMC-eve session — REFUTED, and this is the sharpest practical
correction.** The 2Y sibling's stance rests on FOMC-eve pinning the front end regardless of supply,
measured on **D−2** non-auction sessions. Extend that measurement to D−1 and to this tenor
(non-auction sessions only, mean absolute move):

| Tenor | D−1 (n=29) | D−2 (n=29) | Far from FOMC (n=606) |
|---|---|---|---|
| 2-Year | **5.14bp** | **2.76bp** | 4.66bp |
| **5-Year** | **4.86bp** | **3.59bp** | 4.85bp |
| 10-Year | 4.76bp | 3.66bp | 4.44bp |

The pin is real and it is **specific to D−2** — the Monday of a Wednesday-decision week, which is
usually an empty data day. **D−1 is the Tuesday**, and it is fully live at every tenor; the 5Y's
4.86bp is indistinguishable from its ordinary 4.85bp. That is not a coincidence of this sample:
Tuesday of FOMC week is when the data lands, and the corridor confirms it for this date
specifically — **consumer confidence, durable goods, the euro-area bank lending survey and
euro-area monetary developments all print on 2026-10-27**, and a 20-30Y buyback operates at
1:40pm ET, 40 minutes after this auction closes. **So do not carry the 2Y ledger's "expect a muted
tape" prior into 10-27.** The 5Y's own pre-FOMC record agrees: the seven D−1/D−2 auctions moved
−1.43bp on average (t = −0.83) with a 2.86bp mean absolute move, and their relative measure held at
**−1.36bp** (t = −4.48, 5 of 7 at or beyond −1.0bp) — the curve effect survives the FOMC slot even
though the level effect never existed. Only two auctions on record sold at **exactly D−1**
(2023-07-25 and 2026-01-27, moves +2bp and −1bp), which is too thin to be a base rate and is stated
as such.

**9. The corridor is the densest on the Q4 calendar, and it is why the auction is not the risk —
SUPPORTED.** Twelve tracked events sit within five days of 2026-10-27:
[5Y TIPS](treasury-5y-tips-2026-10-22.md) on 10-22; [2Y](treasury-2y-note-2026-10-26.md) on 10-26;
[consumer confidence](consumer-confidence-2026-10-27.md),
[durable goods](durable-goods-2026-10-27.md), the
[euro-area bank lending survey](ecb-bank-lending-survey-2026-10-27.md),
[euro-area monetary developments](ecb-monetary-developments-2026-10-27.md) and the new
20-30Y buyback all on 10-27; [`fomc-2026-10-28`](fomc-2026-10-28.md); then
[GDP](gdp-q3-2026-advance-2026-10-29.md), [PCE](pce-2026-10-29.md), the
[ECB decision](ecb-decision-2026-10-29.md) and the [7Y](treasury-7y-note-2026-10-29.md) on 10-29.
The FOMC ledger prices 10-28 at roughly a **coin flip** with **no SEP and no forward guidance**
(abolished 2026-08-28), and its own research adds five estimate-dated mega-cap prints across
10-27 → 10-29 — MSFT prints on this auction's own date. Against a 5Y auction whose measured level
effect is zero, the attribution problem runs entirely one way: **any outright 5Y move on 10-27
belongs to the data, the meeting, or the equity tape, and essentially none of it to $70B of
five-year paper.**

**10. One dated adjacency proposed, one deliberately not — SUPPORTED.** The buyback schedule's row
block sells a **Liquidity Support operation in the 20-30Y nominal sector on 2026-10-27**, 1:40–2:00pm
ET — announce 10/26, settle 10/28, maturity range 10/28/2046 – 10/27/2056, published cap $2B —
inside this corridor and not on the calendar. It is proposed as an `estimate` entry in this PR, with
its cap flagged **superseded**: `sb0607` (2026-08-19) doubles the long-end minimum to at least $4B
per operation "for the remainder of this refunding quarter (through November 4, 2026)," which covers
it, and the schedule PDF fetched today is unrevised. **Not proposed, with the reason named:** the
**TIPS 1Y-10Y** operation on 2026-10-21, on the same schedule — it is six days out, outside the
five-day corridor, and [`treasury-buyback-10y20y-2026-10-15`](treasury-buyback-10y20y-2026-10-15.md)'s
notes already recorded it as deliberately unfiled for the same reason. Also not proposed, on the
09-22 sibling's standing rule: the **2-Year FRN on 2026-10-28**, off this same 10-22 announcement —
a floating-rate note carries no duration or policy-path read, and this doc does not overturn a
sibling's call without evidence.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house
answer for this event kind. The usable output is three **reading instructions** for the session that
pulls this ledger on auction day: expect nothing from the outright 5Y level; expect ~1.5–2bp of
local curve dip at the 5Y point and treat it as substantially mechanical; and do not attribute a
loud 10-27 tape to the auction, because that session was always going to be loud.

**Honest limits.** The relative effect's decomposition into "roll" and "residual" leans on one
comparison (10Y new issues versus reopenings) that is confounded by calendar slot, and this session
did not verify from Treasury's published methodology **which date** the par curve's on-the-run input
actually switches — announcement, auction, or settlement. If it switches at settlement, the
mechanical story is wrong and the D+0 concentration needs another explanation; that is a live
weakness, not a hedge. All measurements are **daily close-to-close on a CMT series rounded to 1bp**,
so the relative measure is quantized to 0.5bp and nothing intraday — including any pre-auction
concession — is visible; the event window shows no measurable concession at D−1 to D−3, which is
evidence against the classic auction-cycle story but not proof of its absence at higher frequency.
Causation is not established anywhere: an auction is one of many things in a session. The D−1
pre-FOMC slot is **n=2** and is reported as unusable. The 2023-01 start is a data-availability
boundary, not a regime boundary, and the 2025-04 break in bidder shares is identified by inspection
rather than a structural-break test. This auction's own CUSIP and demand **do not exist yet** — the
announcement is 2026-10-22. FOMC odds drift daily. `symbols: []`, `medium` impact, date `estimate`:
nothing here licenses a position in any name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and the specific contribution is
**three corrections to how this calendar reads Treasury auction days**, plus a base rate this event
did not previously have. (a) The 5Y auction day carries **no** measurable level effect
(−0.77bp, t = −1.07) — the [2Y sibling's](treasury-2y-note-2026-10-26.md) −4.70bp does not
generalize, and only the 2Y and 3Y show it outright at all. (b) What every nominal tenor *does*
show is an own-tenor-versus-neighbours dip on its own auction session (5Y **−1.69bp**, t = −9.84,
against +0.09bp on non-auction days), which the demand data cannot explain (bid-to-cover corr
−0.038) and which reopenings show at a third the size — so it is substantially the par curve
re-anchoring on a fresh on-the-run, and should be described that way rather than as a rally. (c)
The FOMC-eve pin is a **D−2** property; **2026-10-27 sits at D−1**, where the 5Y's mean absolute
move is 4.86bp against 4.85bp on ordinary sessions, and where four data prints and a long-end
buyback share the session — so the base case is a **loud** tape whose content belongs to the
meeting and the data, not to the sale. Grade the print itself on **dealer takedown** ($70B era p25
11.0% / median 12.3% / p75 13.2%), not on indirect share, which is a substitute for direct share
(corr −0.871) and on which the [09-23 sibling's](treasury-5y-note-2026-09-23.md) "soft foreign
demand" verdict does not survive — dealers took the 7th-lowest share of 43 on that auction. Size is
$70B, primary-verified. Nothing here is directional and no house playbook applies.

**Amended 2026-09-27 (D-30 pulse).** Two of this stance's own registered kill switches fired on the
09-23 predecessor's close-out (re-verified direct from fiscaldata `auctions_query`, CUSIP
91282CRN3): dealer takedown printed **15.77%**, above the 13.2% $70B-era p75 line and above the
entire prior 12-print range; bid-to-cover printed **2.21**, below the era's 2.28–2.43 range. Per
this stance's own text, this is "the first evidence the residual metric this doc promotes is
itself deteriorating" and the $70B-era bands "die… with it the base rate this doc hands the
November and December 5Ys." Read narrowly: it means the bands built from 28 auctions through
2026-08-26 no longer describe the two most recent prints (the 09-22 2Y missed its own dealer
threshold too) — it does **not** touch the mechanical curve-effect finding (legs 3–5), which is
about relative moves on auction day, not bidder composition. **The call does not change** (still
watch-only, no play, no symbols), but confidence in "grade the print on dealer takedown, expect it
to look strong" softens from the 08-26-anchored read to an open question, tested directly by
`FT-treasury-5y-note-2026-10-27-2` (score by 2026-10-27) against this auction's own print.

**Kill switches (what would change this stance):**

- **The core one — the relative measure failing to fire on 2026-10-27.** If the 5Y CMT change minus
  the average of the 3Y and 7Y changes is **greater than −1.0bp** that day, the one robust thing
  this doc found did not survive its densest-corridor test, and the base rate stops being usable for
  the 2026-11-24 and 2026-12-22 5Ys. Registered as **FT-treasury-5y-note-2026-10-27-1** in
  [`forward-tests.md`](../forward-tests.md), score by 2026-10-28, with its null pass rate stated up
  front (11% on ordinary sessions, 79% on auction days).
- **A size change at the 2026-10-22 announcement.** $70B is written guidance in `sb0590` and 28
  consecutive auctions of precedent; any deviation breaks the like-for-like series, voids the
  bid-to-cover band and the dealer-takedown quantiles, and must be logged off-cadence regardless of
  when the next pulse is due.
- **Treasury's published par-curve methodology showing the on-the-run input switches at
  settlement rather than at auction.** That kills leg 5's mechanical reading outright and makes the
  D+0 concentration an unexplained flow effect — a much more interesting result, and the single
  cheapest thing the next pulse can check.
- **The 09-23 predecessor printing dealer takedown above 13.2%** (the $70B-era p75) — **FIRED
  2026-09-27**: 15.77%, above the entire prior 12-print range. See the Amendment above.
- **Bid-to-cover printing outside 2.28–2.43** on 09-23 or 10-27 — the $70B era's full range dies on
  either side, and with it the base rate this doc hands the November and December 5Ys —
  **FIRED 2026-09-27** on the 09-23 leg: 2.21. Still open for 10-27 itself.
- **The FOMC meeting moving off 2026-10-27/28**, or the auction moving off 10-27 at the
  announcement. The D−1 premise is the whole of leg 8; if the pairing breaks, this event reverts to
  an ordinary month-end belly sale graded on leg 4's far-auction prior, and the forward test still
  scores (it is a curve claim, not an FOMC claim) but leg 8's correction lapses.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution
  rather than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-52 | Initial research banked (doc above); `probe-ref` populated with real readings so this event's first `interval-elapsed` pulse is screenable rather than automatically material. **Event tape (primary).** Terms verified verbatim from home.treasury.gov's Tentative-Auction-Schedule.pdf (HTTP 200, 17,195 bytes, text layer decompressed direct today): announce **Thu 2026-10-22**, auction **Tue 2026-10-27**, settle **Mon 2026-11-02**, no `R` → new issue. Note the weekday: the 5Y sells Wednesday in 20 of its 43 auctions on record and Tuesday here, because the 2-Year FRN takes Wed 10-28 (FOMC decision day) — that one-day shift is what puts this sale at **D−1** to the statement rather than the 2Y's D−2. Entry stays **`estimate`**, consistent with the four other October siblings off the identical PDF. **Size primary-read: $70B.** `sb0590` (2026-08-05) read as text this session — header `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN`, **Oct-26 row `69 58 70 44 39 13 22 30`**, 5-Year is column 3; plus verbatim guidance that Treasury "anticipates maintaining nominal coupon and FRN auction sizes for at least the next several quarters." Corroborated by **28 consecutive $70B** 5Y auctions (2024-04-24 → 2026-08-26). **THE LOAD-BEARING FINDING — the 2Y sibling's auction-day effect does NOT generalize to this tenor, and what does generalize is a curve move, not a level move.** All 43 nominal 5Y auctions since 2023-01 (fiscaldata `auctions_query`; TIPS excluded on `index_ratio_on_issue_date`, FRNs on `floating_rate`) against 920 par-curve sessions (2023-01-03 → 2026-09-04, CSVs fetched today): the 5Y closes **−0.77bp** on its own auction day, **t = −1.07** — nothing — and **−1.10bp (t = −0.99)** away from FOMC weeks against +0.05bp on 586 comparable non-auction sessions. Auction days are *quieter* here (\|move\| 3.56 vs 4.98), the opposite of the 2Y's. **What is significant is the relative move:** 5Y minus the average of 3Y and 7Y prints **−1.69bp, t = −9.84**, against **+0.09bp** on 876 non-auction sessions; confined to D+0 (on the 5s10s version: D−1 +0.28, D+0 −1.60 t=−5.23, D+1 +0.30), and surviving every control on the 33 auctions the 2Y does not share (−1.76, t=−4.93; halves −2.13/−1.41; 2025+ −1.43 t=−2.92; non-auction Tue/Wed +0.12 n=344; non-auction last-8-biz-days +0.01 n=313). **It fires on EVERY nominal coupon tenor** (own minus neighbours, own auction day): 2Y **−4.14** (t=−13.14) · 3Y **−3.09** (−15.61) · 5Y **−1.69** (−9.84) · 7Y **−1.09** (−8.87) · 10Y new issue **−1.60** (−8.70) · 20Y **−2.00** (−7.48) · 30Y **−0.87** (−3.39), with non-auction controls +0.03 to +0.17 throughout. **And it is substantially mechanical.** (i) Demand explains none of the day: over the 28-auction $70B era corr(bid-to-cover, same-day 5Y move) **−0.038** (t=−0.19), corr(dealer, move) +0.106 (t=0.54), corr(b/c, 5s10s) −0.070 (t=−0.36) — where the 2Y sibling measured a *significant* −0.388 (t=−2.73), a real cross-tenor asymmetry. (ii) A 10Y **reopening**, which creates no new on-the-run for Treasury's fitted par curve to re-anchor on, shows **−0.52bp** (t=−4.30, n=29) against a new issue's −1.60bp (t=−8.70, n=15). Named as a decomposition with a confound (new issues fall in refunding months), not a proof; the honest description is "the curve re-anchors at the auctioned point," not "the auction rallied the belly." **SECOND FINDING — the 09-23 same-tenor sibling's "soft foreign demand" verdict is refuted.** Its live claim (indirect 61.5% on 2026-08-26 vs a "~65.7% norm" = "the one genuinely weak leg") fails three ways: the live 12-auction mean indirect is **63.4%**, not 65.7%; indirect and direct are near-perfect substitutes at this tenor too (**corr −0.871, t=−11.38, n=43**; −0.936 inside the $70B era), so the split measures submission channel; and their sum is half as noisy (sd **2.76pt** vs **5.29pt**) and **rose** 86.3% → 88.6% across the 2025-04 regime break where indirect fell 68.2% → 64.0% and direct rose 18.1% → 24.6%. On the residual that is not a reclassification, **dealers took 10.05% on 2026-08-26 — the 7th lowest of 43** and inside the strong half of the $70B-era band. That was a strong auction. **THIRD FINDING — the FOMC-eve pin does not reach this date.** The 2Y sibling's "expect a muted tape" prior is a **D−2** property; measured on non-auction sessions, mean \|move\|: 2Y D−1 **5.14** / D−2 **2.76** / far 4.66; 5Y D−1 **4.86** / D−2 3.59 / far **4.85**; 10Y D−1 4.76 / D−2 3.66 / far 4.44. D−1 is fully live at every tenor, and **2026-10-27 is D−1**. The corridor says why: consumer confidence, durable goods, the euro-area bank lending survey and euro-area monetary developments all print that day, MSFT prints that date per the FOMC ledger, and a 20-30Y buyback operates 1:40pm ET. The 5Y's own seven D−1/D−2 auctions moved −1.43bp (t=−0.83) but held the relative effect at −1.36bp (t=−4.48, 5 of 7 ≤ −1.0bp); the exact-D−1 slot is **n=2** (2023-07-25 +2bp, 2026-01-27 −1bp) and is unusable, stated as such. **Data-quality finding, mechanism now named:** the fiscaldata row for **2026-01-26** — which the 2Y sibling could only call "internally inconsistent" — carries `cusip` **91282CGH8**, byte-identical to the **2023-01-25 five-year note's** CUSIP, with that note's `series U-2028`, `int_rate 3.500000` and `maturity 2028-01-31`, while its `offering_amt` is $69B and its `original_cusip` is 91282CPV7 (which appears nowhere else). A genuine reopening would carry `cusip === original_cusip`. The 2026 two-year record inherited its identity fields from a five-year note; **any 5Y series keyed on `original_security_term` must exclude it** or it injects a $69B two-year auction. **Confound flagged for the 2Y sibling:** 10 of 43 2Y auction days are shared with a same-day 5Y sale, and its far-from-FOMC population splits **2Y-only −7.05bp (t=−5.09, n=22)** vs **2Y+5Y same day −1.80bp (t=−0.91, n=5)** — weaker when more supply lands, which is backwards for a concession story. n=5, suggestive only. Five of its seven pre-FOMC D−2 auctions are those same-day stacks; **2026-10-27 is not one** (2Y sells 10-26, 5Y 10-27). **Macro.** Par curve 2026-09-04: 2Y 4.37, 3Y 4.45, **5Y 4.54**, 7Y 4.65, 10Y 4.78, 30Y 5.24; 2s10s **41bp**, 5s30s 70bp. Since the 08-26 5Y auction: 2Y +18, 3Y +16, **5Y +17**, 7Y +14, 10Y +12, 30Y +6bp — front-and-belly-led. 2026 5Y range 3.51–4.55; the 09-04 close of 4.54 is **1bp off the year high**. **Volatility:** VIX **14.53** (09-04 close), a hair above the 14.43 2026 low struck 08-28 — a quiet tape into a coin-flip FOMC. **Peers:** `symbols: []`, none applicable. **Geopolitical:** nothing new touching this tenor beyond the oil-inflation channel the 09-23 sibling recorded. **Corridor:** twelve tracked events within 5 days; [`fomc-2026-10-28`](fomc-2026-10-28.md) prices ~50/50 with no SEP and no forward guidance, loading the news onto the statement. **New dated adjacency proposed (1):** `treasury-buyback-20y30y-2026-10-27` — Liquidity Support, Nominal Coupons 20Y to 30Y, announce 10/26, operate **10/27 1:40–2:00pm ET** (40 minutes after this auction closes), settle 10/28, range 10/28/2046 – 10/27/2056, published cap $2B **superseded** to ≥$4B by `sb0607` through 2026-11-04; buyback PDF fetched direct today (HTTP 200, 125,547 bytes) and still unrevised. **Deliberate non-proposals, recorded:** the **TIPS 1Y-10Y** buyback on 2026-10-21 (six days out, outside the corridor — exactly as `treasury-buyback-10y20y-2026-10-15`'s notes anticipated), and the **2-Year FRN on 2026-10-28** (the 09-22 sibling's rule: a floating-rate note carries no duration or policy-path read). **Forward test registered: FT-treasury-5y-note-2026-10-27-1** — the 5Y-minus-avg(3Y,7Y) move on 10-27 is ≤ −1.0bp; null pass rate stated up front at **97/876 ≈ 11%** on ordinary sessions against **34/43 ≈ 79%** on auction days and 5/7 in the pre-FOMC slot, so it is informative in either direction. | — (stance set) | 2026-09-26 (medium, 31+d band: every 21d) |

| 2026-09-27 | D-30 | **Full pulse (dispatched).** Cadence band transition: 8–30d medium band (7d interval), down from the initial 31+d band (21d) — itself a materiality trigger. **Peer print — the headline finding.** The 09-23 5Y predecessor closed out ([treasury-5y-note-2026-09-23.md](treasury-5y-note-2026-09-23.md); re-verified independently this session from fiscaldata `auctions_query` for CUSIP 91282CRN3, direct fetch: high yield 5.033%, bid-to-cover 2.210, matching that ledger's close-out field-for-field) as the weakest print of that doc's life on every leg: tail +3.1bp, indirect 54.31% (new 12-print low), dealer takedown 15.77% (new high, above the entire prior 8.84–15.61% range). **Two of this event's own registered kill switches fire:** dealer takedown above 13.2% (the $70B-era p75) — FIRED at 15.77%; bid-to-cover outside 2.28–2.43 — FIRED at 2.21. The 09-22 2Y sibling missed its own dealer threshold too (13.19% vs 12.1%), corroborating a curve-wide capacity break rather than a 5Y-specific one. Both of the 09-23 doc's own forward tests scored KILLED. Stance amended (see Stance §): call unchanged (watch-only, no play) but confidence in "grade the print on dealer takedown, expect strength" softens to an open question; **registered `FT-treasury-5y-note-2026-10-27-2`** — this auction's own 2026-10-27 print testing whether dealer takedown again exceeds 13.2% or bid-to-cover again falls outside 2.28–2.43, scored 2026-10-27. **Macro.** The 2026-09-16 FOMC hiked 25bp to 3.75–4.00% exactly as this doc's D-1 premise expected (confirmed from sibling close-outs, not re-fetched). The FY2027 funding cliff resolved via PL 119-103 (signed 09-02, funds through 12-11) — jobs 10-02 and CPI 10-14 print on schedule, per the [funding-deadline sibling's](government-funding-deadline-2026-09-30.md) own close-out. The October 28 FOMC has itself repriced from hold-modal to hike-modal (~62–66%, Polymarket 65%/CME 61.6%, both fetched direct today by the [fomc-2026-10-28](fomc-2026-10-28.md) sibling) — reinforcing, not softening, leg 8's "loud, not muted" D-1 call. **Rates.** Treasury's own par curve (fetched direct this session, home.treasury.gov daily CSV): 09-25 close 2Y 4.81 / 3Y 4.94 / 5Y 4.98 / 7Y 5.06 / 10Y 5.17 / 20Y 5.54 / 30Y 5.49 — the 5Y is +44bp since initial research's 4.54% (09-04), consistent with the hawkish September hike and October's fresh repricing. **Volatility:** VIX 14.87 (09-25 close, Yahoo `^VIX`, fetched direct) vs 14.53 at initial research — +0.34pt, inside the 3pt threshold, no regime shift. **Geopolitical:** Brent (Yahoo `BZ=F`, fetched direct) round-tripped from the mid-September Saudi East-West-pipeline spike (~$130.80 FRED / ~$108 press, 09-15/16, per the 5Y/2Y siblings) to $97.44 (09-25) after the pipeline resumed pumping 09-22 (per the [jobs-2026-10-02](jobs-2026-10-02.md) sibling) — the acute leg is cooling, not confirmed dead. **Adjacency.** `event-scan.mjs --on-date=2026-10-27` returns the same 12 same-date entries already tracked — nothing new to file. The ±5-day corridor densified sharply on calendar churn (12 ids at initial research → 43 today, cross-referenced directly against `src/domain/market-events/*.json`), and now carries **four confirmed high-impact entries**, none of which existed as confirmed-high at initial research: `fomc-2026-10-28` (D+1), `gdp-q3-2026-advance-2026-10-29` (D+2), `pce-2026-10-29` (D+2), `eci-q3-2026-10-30` (D+3) — corroborating leg 9's "any outright move belongs to the data or the meeting" read. **Own terms:** still unconfirmed — no 2026-10-22 announcement yet (25 days out from this pulse), size $70B by guidance only, unchanged. | **Amended** — call unchanged (watch-only, no play, no symbols); the dealer-takedown/bid-to-cover grading framework (leg 7's correction) softens from confident to an open question after the 09-23 predecessor missed both switches. See Stance §. | 2026-10-04 (medium, 8-30d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.

**Last assessed:** 2026-09-27
<!-- probe-ref: {"symbols":{},"vix":14.87,"daysBand":"medium:8+","adjacentIds":["jgb-liquidity-enhancement-5-11y-2026-10-22","msft-def14a-2026-10-22","treasury-5y-tips-2026-10-22","treasury-coupon-announcement-2026-10-22","aapl-iphone-duo-launch-2026-10-23","uk-retail-sales-2026-10-23","japan-cpi-2026-10-23","uk-consumer-confidence-2026-10-23","mwts-benchmark-revision-2026-10-26","treasury-2y-note-2026-10-26","dallas-fed-mfg-2026-10-26","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","fhfa-hpi-2026-10-27","jgb-liquidity-enhancement-11-39y-2026-10-27","msft-2026-10-27-print","new-home-sales-2026-10-27","treasury-buyback-20y30y-2026-10-27","advance-economic-indicators-2026-10-28","fomc-2026-10-28","housing-vacancies-q3-2026-10-28","treasury-2y-frn-2026-10-28","uk-autumn-budget-2026-10-28","dallas-fed-trimmed-mean-2026-10-29","ecb-decision-2026-10-29","gdp-q3-2026-advance-2026-10-29","jgb-2y-auction-2026-10-29","nar-metro-home-prices-2026-10-29","pce-2026-10-29","treasury-7y-note-2026-10-29","boj-decision-2026-10-30","chicago-pmi-2026-10-30","eci-q3-2026-10-30","ecb-spf-q4-2026-10-30","g20-foreign-ministers-atlanta-2026-10-30","russell-style-month-end-capping-effective-2026-10-30","uk-blue-book-2026-10-30","uk-pink-book-2026-10-30","opec-plus-meeting-2026-11-01"],"adjacentStrongIds":["fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","eci-q3-2026-10-30"],"screenStreak":0} -->
