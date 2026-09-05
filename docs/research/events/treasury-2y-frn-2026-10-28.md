# 2-Year Floating Rate Note auction (quarterly new issue, $30B) — treasury-2y-frn-2026-10-28

**Kind:** rates · **Date:** 2026-10-28 (estimate, EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, re-fetched direct 2026-09-05 — plain curl, HTTP 200, **17,195 bytes**, rows rebuilt from glyph coordinates; the `2-Year FRN` row carries **no `R` marker** while 08-20, 09-17, 11-19 and 12-17 all read `2-Year FRN | R`) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["advance-economic-indicators-2026-10-28","boj-decision-2026-10-30","chicago-pmi-2026-10-30","consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","ism-manufacturing-2026-11-02","pce-2026-10-29","sloos-2026-11-02","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The four-year-low discount margin is not an anomaly — it is the yield curve, and this
session measured how much of it.** The sibling that discovered this auction
([treasury-coupon-announcement-2026-10-22](treasury-coupon-announcement-2026-10-22.md)) recorded the
margin at a four-year low (**5.0bp** on 2026-07-29, **5.5bp** on 2026-08-26) with a *named but
unmeasured* mechanism — bill scarcity. Measured here for the first time: the FRN's high discount
margin regresses on the **2Y−3M par-curve slope** at **R² 0.76** across all 69 auctions since 2021,
**β ≈ −10bp of margin per 100bp of slope**. The curve went from **−45bp** (Sept 2025) to **+46bp**
(2026-09-04), and that alone accounts for roughly **10bp of the 15bp** compression. The remainder is
real but small: a model trained 2023–2025 and run genuinely out-of-sample on 2026 under-predicts the
compression by a mean **−2.19bp**, and by **−3.9bp / −3.8bp** on the two most recent prints. *That*
residual — **2 to 4bp, not 15** — is where `sb0590`'s bill-demand story actually lives, and it is the
first time this calendar has sized it. Second measured result, a clean null: **the FRN auction day
does nothing to the tape** (2Y CMT **+0.70bp**, t=**+1.07**, n=40 ex-FOMC), and the apparent "auction
days are quieter" effect is **Wednesday composition**, not the auction — it collapses from t=−4.19 to
t=−2.16 once the comparison group is Wednesdays only. Date is `estimate`, `symbols: []`, no house
playbook is rates-keyed, and nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-53) | Stand aside | High | Saturday, no session; Labor Day Monday, next print Tuesday 09-08. `symbols: []`, the date is `estimate`, and an FRN auction has no measured tape effect to trade in the first place. | Treasury publishing an off-cycle **FRN** size change or moving this sale off 2026-10-28 before the **2026-10-22** announcement — `sb0590` names FRNs inside the same "maintaining… for at least the next several quarters" sentence as nominals |
| This week | Stand aside; the only dated item is the **2026-09-17** announcement of the 09-23 reopening | High | Nothing FRN-specific prints this week, and the 09-17 announcement's FRN leg is a $28B reopening already published in `sb0590`'s Sep-26 row (`… 13 22 28`). | The **2026-09-17** announcement printing the FRN leg at anything other than **$28B**, or marking it a new issue — the 20-auction $28B reopening grid and the 10-auction $30B new-issue grid break together, five weeks before this auction |
| This month | Watch **one** dated observation — the **2026-09-23 FRN reopening** — and hold nothing into it | Medium | It is the only FRN auction between today and 10-28, and the out-of-sample test of the slope model registered here ([FT-treasury-2y-frn-2026-10-28-1](../forward-tests/treasury-2y-frn-2026-10-28.md)). Point estimate at 09-04's +46bp slope: **5.4bp**. | The **2026-09-23** print landing more than **3.0bp** off the model's fit for that day's actual 2Y−3M slope — the curve-slope framing is then not the explanation, and the four-year low goes back to being unexplained |
| This quarter | **Do not** treat the 10-28 FOMC decision as a supply risk to this auction, and do not read a low margin as strong demand | Medium | The concession question is measured and null (sibling's within-CUSIP controls, n=8), and demand composition does **not** corroborate the compression: 2026's indirect share is **61.3%**, *below* 2024's 66.5% when margins ran 15–19bp. | The **2026-10-28** print coming in more than **+2.0bp** above the 09-23 reopening — that is [FT-treasury-coupon-announcement-2026-10-22-2](../forward-tests/treasury-coupon-announcement-2026-10-22.md)'s kill switch, inherited here rather than re-registered |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a position.** `symbols: []`, the date is `estimate`, and no house playbook (S1/S2/E1/S3/S4
  + G1) is rates-keyed. Everything below is a reading instruction.
- **The model, quotable:** `DM_bp = 10.43 − 11.02 × (2Y − 3M, in percentage points)`, fit on the 20
  auctions 2025-01-28 → 2026-08-26; R² 0.692, residual sd **2.45bp**, in-sample |resid| ≤3bp on 15/20.
- **Read the curve before the auction, not the auction.** At a **+46bp** slope the model says **5.4bp**;
  at **+30bp** it says **7.1bp**; at **+60bp**, **3.6bp**. A print near the fit is a non-event.
- **The residual is the only genuinely new information.** 2026's prints run **−2.19bp** mean below a
  2023–2025-trained model (6 of 8 negative). Watch whether 09-23 extends that or closes it.
- **A low margin is not strong demand — grade the print on composition, not level.** 2026 indirect
  **61.3%** vs 2024 **66.5%**; direct has collapsed to **0.2%** (four 2026 auctions took *zero* direct).
  Bid-to-cover 2026 **3.18** is inside its own 2021–2025 range (3.03–3.22), i.e. unremarkable.
- **The auction day is a nothing-event, and that is measured:** ex-FOMC, n=40 since 2023, 3M CMT
  **+0.05bp** (t=+0.40), 2Y **+0.70bp** (t=+1.07), 10Y **+0.25bp** (t=+0.13).
- **Do not repeat the "quieter" claim without the Wednesday control** — |2Y move| 3.35bp vs 4.81bp all
  sessions (t=−4.19) looks like an effect and is **35/44 Wednesdays**; vs Wednesdays alone it is
  t=**−2.16**, and the 3M leg falls to t=−1.55.
- **Contrast that with the 2Y *note*:** its auction day moves the front end −4.70bp at t=−4.60
  ([treasury-2y-note-2026-10-26](treasury-2y-note-2026-10-26.md)). A note transfers duration; an FRN
  does not. Same week, same tenor label, opposite result.
- **Size is a document read, not a forecast:** **$30B**, `sb0590` Oct-26 row `69 58 70 44 39 13 22 30`,
  corroborated by 10 consecutive quarterly new issues at $30B since 2024-04-24.
- **Data traps, named:** fiscaldata's `high_discnt_margin` is in **percent** (`0.049000` = 4.9bp), and
  `security_term` reads `2-Year` on new issues but `1-Year 11-Month` / `1-Year 10-Month` on reopenings
  — filtering on `2-Year` silently drops every reopening.
- **Watch (dated):** announcement **09-17** · **FRN reopening 09-23** (the registered test) · FOMC
  **09-16** · announcement **10-22** · 2Y note **10-26** · 5Y note **10-27** · **FOMC + this auction
  10-28** · 7Y note **10-29** · settlement + borrowing estimates **11-02** · refunding **11-04**.

## Initial research

### The question, plainly

This event was created by the [`treasury-coupon-announcement-2026-10-22`](treasury-coupon-announcement-2026-10-22.md)
initial research (2026-09-05), which found that the announcement covers **eight** securities and that
the one nobody in this calendar had ever examined was the floating-rate note — `grep -ri "discount
margin" docs/research/` returned nothing before that session. It left two things on the table for
this ledger: a **four-year-low discount margin** with a mechanism it explicitly labelled *"named but
unmeasured"* (`sb0590`'s "SOMA purchases of Treasury bills and growing demand for Treasury bills from
the private sector"), and the auction itself, whose *tape* behaviour nobody had looked at.

So the question here is not the sizes — those are a document read, already owned by
[FT-treasury-coupon-announcement-2026-10-22-1](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
— and not the FOMC-day concession, which the same sibling measured and registered as its FT-2. The
question is: **what actually sets this security's price, and does the auction do anything at all?**

**One-line verdict:** the discount margin is a **curve-slope readout** — R² 0.76 on a single variable
across 69 auctions — so most of the "four-year low" is a four-year-high 2Y−3M slope rather than a
scarcity anomaly; the genuine scarcity residual is **2–4bp**, and the auction session itself has **no
detectable effect on the tape**.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the
mandated cache bust has nothing to bust (recorded, not silently skipped). Everything below was fetched
from a primary **this session (2026-09-05)** and re-derived rather than inherited from the sibling,
including the numbers the sibling already publishes:

- **The auction record** — `api.fiscaldata.treasury.gov` `auctions_query`, `floating_rate: eq: Yes`,
  `auction_date >= 2021-01-01`: **69 rows** (23 new issues, 46 reopenings), HTTP 200, with
  `high_discnt_margin`, `bid_to_cover_ratio` and the three bidder buckets. A second pull took **every**
  auction of any type since 2023-01-01 (**731 distinct auction days**) purely as a control group.
- **The tape** — Treasury's own daily par yield-curve CSVs, 2021 through 2026 (six files, all HTTP 200);
  **920 sessions** since 2023-01-01 for the auction-day tests, and every FRN auction date matched to its
  own day's curve (**69 of 69 matched**, no gaps).
- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**, PDF streams inflated and rows reconstructed from per-glyph `Tm`
  coordinates so a security type stays attached to its own dates.
- **The FOMC dates** — `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, **164,831
  bytes**, decision dates parsed per year segment; used to exclude FOMC days from the tape tests.
- **VIX** — `^VIX` daily closes; **14.53** at the 2026-09-04 close (2026-09-05 is a Saturday and
  2026-09-07 is Labor Day, so that is the live reading).

### Conviction legs, tested

**1. The 2026-10-28 sale is a $30B quarterly NEW ISSUE on an FOMC decision day — SUPPORTED, both legs
re-verified from primaries.** The coordinate-reconstructed schedule gives every FRN row it carries:

| Announcement | Auction | Settlement | `R`? |
|---|---|---|---|
| Thursday, August 20, 2026 | Wednesday, August 26, 2026 | Friday, August 28, 2026 | **R** |
| Thursday, September 17, 2026 | **Wednesday, September 23, 2026** | Friday, September 25, 2026 | **R** |
| Thursday, October 22, 2026 | **Wednesday, October 28, 2026** | Monday, November 02, 2026 | *(none)* |
| Thursday, November 19, 2026 | Tuesday, November 24, 2026 | Friday, November 27, 2026 | **R** |
| Thursday, December 17, 2026 | Wednesday, December 23, 2026 | Monday, December 28, 2026 | **R** |
| Thursday, January 21, 2027 | Wednesday, January 27, 2027 | Monday, February 01, 2027 | *(none)* |

Two rows in the whole table drop the `R`, and they sit a quarter apart — exactly the new-issue cadence.
The Fed's own calendar independently confirms **2026-10-28 is a decision day**. The $30B is `sb0590`'s
Oct-26 row (`69 58 70 44 39 13 22 30`, FRN in column 8), and the record agrees: **10 consecutive**
quarterly new issues at $30B since 2024-04-24, **20 consecutive** reopenings at $28B since 2024-05-29.

**The 09-23 reopening has no calendar row** and is the free dated read on everything below — proposed
in this PR as `src/domain/market-events/treasury-2y-frn-2026-09-23.json`, `status: "estimate"`.

**2. The discount margin is a curve-slope readout — SUPPORTED, and this is the finding.** Regressing
the high discount margin on the 2Y−3M par-curve slope observed on each auction's own date:

| Sample | n | Fit (`DM_bp = a + b × slope_pp`) | R² | Residual sd |
|---|---|---|---|---|
| All auctions 2021-01-27 → 2026-08-26 | 69 | `10.31 − 10.08 × slope` | **0.758** | 3.96bp |
| 2022+ (excludes the ZIRP regime) | 57 | `11.36 − 9.48 × slope` | **0.790** | 3.61bp |
| 2025+ (the registered model) | 20 | `10.43 − 11.02 × slope` | 0.692 | **2.45bp** |

Plain correlations, same 69 auctions: **corr(DM, 2Y−3M) = −0.871**, corr(DM, 3M level) = +0.833,
corr(DM, 1Y−3M) = −0.771. The mechanism is coherent rather than fitted: a floater's coupon resets to
the 13-week bill, so when the front end prices **cuts** (an inverted 2Y−3M) a buyer demands a wide
spread to hold one instead of a fixed 2-year note, and when the curve is **upward-sloping** the floater
is the attractive side and the spread compresses. The extreme tail fits too — 2022-04-27 sold at a
slope of **+191bp** and printed a **negative** margin (−7.5bp), against a fitted −8.9bp.

So the reframing: the slope moved from **−45bp** (2025-09-24, DM 20.0bp) to **+34bp** (2026-08-26, DM
5.5bp), and at β ≈ −10 that swing alone is worth about **10bp** of the observed ~15bp compression.

**3. …but slope does not explain all of it, and the remainder is where the bill-demand story lives —
MIXED, stated honestly.** A model trained **only** on 2023–2025 (n=36, `12.03 − 8.07 × slope`) and run
genuinely out-of-sample on 2026 under-predicts every recent print:

| Auction | 2Y−3M | Predicted | Actual | Error |
|---|---|---|---|---|
| 2026-01-28 | −12bp | 13.00 | 9.90 | **−3.10** |
| 2026-02-25 | −24bp | 13.97 | 9.90 | **−4.07** |
| 2026-03-25 | +11bp | 11.15 | 11.50 | +0.35 |
| 2026-04-28 | +16bp | 10.74 | 10.30 | −0.44 |
| 2026-05-27 | +32bp | 9.45 | 8.90 | −0.55 |
| 2026-06-24 | +26bp | 9.94 | 7.90 | −2.04 |
| 2026-07-29 | +39bp | 8.89 | 5.00 | **−3.89** |
| 2026-08-26 | +34bp | 9.29 | 5.50 | **−3.79** |

Mean error **−2.19bp**, mean |error| 2.28bp, **6 of 8 negative** and the two most recent the largest.
That is a real residual richness of roughly **2–4bp** — an order of magnitude smaller than the raw
15bp move the sibling flagged, and the honest size of what `sb0590`'s bill-demand mechanism can be
credited with. The claim registered below is about the *model*, not about the mechanism: nothing here
identifies bill demand as the cause, only bounds how much is left for it to explain.

**4. The compression is NOT corroborated by auction demand — REFUTES the intuitive reading.** If the
margin were collapsing because end investors were fighting for the paper, indirect share should be
rising. It is not:

| Year | n | Mean DM | Bid-to-cover | Indirect | Direct | Dealer |
|---|---|---|---|---|---|---|
| 2021 | 12 | 3.39bp | 3.08 | 60.3% | 2.1% | 32.7% |
| 2022 | 13 | 4.69bp | 3.22 | 57.0% | 3.1% | 37.1% |
| 2023 | 12 | 17.61bp | 3.03 | 62.9% | 0.5% | 35.7% |
| 2024 | 12 | 18.93bp | 3.08 | **66.5%** | 0.7% | 31.6% |
| 2025 | 12 | 15.04bp | 3.05 | 62.5% | 1.2% | 33.5% |
| 2026 | 8 | **8.61bp** | 3.18 | 61.3% | **0.2%** | 34.9% |

2026's indirect share is **below** 2024's, when margins were more than twice as wide; bid-to-cover
(3.18) sits inside its own five-year range; and direct bidders have effectively left (four 2026
auctions took **zero** direct). corr(DM, bid-to-cover) across all 69 is only **−0.21**. So the low
margin is a **price level set in the market**, not a demand event visible at the auction — which is
why the reading instruction above says grade composition, never level.

**5. The FRN auction day does nothing to the tape — SUPPORTED as a null, and the "quieter" version of
it is a control failure.** Across 920 sessions since 2023, excluding FOMC days, comparing the 40 FRN
auction days to everything else:

| Tenor | FRN-day mean move | Other sessions | t |
|---|---|---|---|
| 3 Mo | +0.05bp | −0.05bp | +0.40 |
| 2 Yr | +0.70bp | +0.01bp | +1.07 |
| 10 Yr | +0.25bp | +0.14bp | +0.13 |

No level effect anywhere. The *absolute* move looked like a real finding — |2Y move| **3.35bp** on FRN
days vs **4.81bp** otherwise, t=**−4.19**; |3M move| 0.85 vs 1.72, t=−4.71 — and it does not survive
its own control. FRN auctions are **35 of 44 Wednesdays**, and against Wednesday sessions only the 2Y
falls to t=**−2.16** and the 3M to t=**−1.55**:

| Control group | 3 Mo t | 2 Yr t | 10 Yr t |
|---|---|---|---|
| All non-FRN sessions | −4.71 | −4.19 | −1.03 |
| **Wednesdays only** | **−1.55** | **−2.16** | −1.02 |
| Other (non-FRN) auction days | −4.77 | −3.42 | −0.94 |
| No-auction sessions | −3.22 | −4.65 | −1.19 |

Same shape of error the sibling caught on the raw on-FOMC margin gap: a composition effect wearing an
effect's clothes. Recorded as **no FRN-specific tape effect detected**, not "FRN auction days are
calm." The contrast with the 2Y **note** is the useful part — its auction day moves the front end
−4.70bp at t=−4.60 ([`treasury-2y-note-2026-10-26`](treasury-2y-note-2026-10-26.md)), because a note
auction transfers duration to the market and a floater auction transfers essentially none.

**6. The FOMC-day pairing — INHERITED, not re-measured.** The sibling crossed all 69 FRN auctions
against the Fed's published decision dates: 9 sold on a decision day, 8 of them quarterly new issues
(~35% of new issues), because Treasury's new-issue slot and the FOMC's meeting both sit in the last
week of January/April/July/October. Its within-CUSIP controls found no concession. This session
re-confirmed only the two facts that pairing rests on — the 10-28 auction row and 2026-10-28 being a
decision day, both from primaries above — and deliberately does **not** re-register the prediction:
[FT-treasury-coupon-announcement-2026-10-22-2](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
owns it and scores 2026-10-29.

### What the conditions support

Nothing to trade, and that is the honest output rather than a hedge: `symbols: []`, the date is
`estimate`, no house playbook is rates-keyed, and leg 5 measured the auction session to be a
non-event even for someone who *could* express a front-end view. What the conditions support is a
**reading instruction and one registered test** — read the 2Y−3M slope before the auction, expect the
margin the slope implies, and treat only the residual as information.

### Honest limits

- **n is small where it matters.** 23 new issues since 2021, 8 of them on FOMC days, 8 2026 prints in
  the out-of-sample window. No significance is claimed for the residual-richness pattern in leg 3 —
  "6 of 8 negative" is an observation, not a test.
- **The slope model is a correlation with a plausible mechanism, not an identified one.** It does not
  distinguish "the curve prices cuts" from anything else that moves with the curve, and the 2021 ZIRP
  auctions fit badly (mean residual −4.43bp) — the fit is a 2022-onward regime statement.
- **The residual is not attributed.** Leg 3 bounds what bill demand *could* explain; it does not
  measure bill demand. Nothing here fetched bill supply, SOMA holdings, or repo.
- **The tape tests use daily CMT closes**, so an intraday auction-time reaction that reverses by the
  close is invisible to them. The ~11:30 ET FRN auction slot is also **not sourced** and is omitted
  everywhere, here and in the calendar entry.
- **The date is `estimate`.** A tentative schedule is tentative by construction, and this lane may not
  self-confirm an event it discovered in-sweep; the confirming primary is the **2026-10-22**
  announcement itself.

## Stance & kill switches

**Stance (2026-09-05, D-53): read-only, stand aside, and the read is "check the curve, not the
auction."** The `estimate`-dated 2026-10-28 auction is a $30B quarterly FRN new issue on an FOMC
decision day. Its price variable — the high discount margin — is explained to R² 0.76 by the 2Y−3M
slope, so the four-year low it will most likely print is the expected consequence of a four-year-high
slope and carries no information by itself. The auction session has no measured effect on the tape.
`symbols: []` and no house playbook is rates-keyed, so no position is available and none is sought.

**Kill switches:**

- **The 2026-09-23 reopening printing more than 3.0bp off the registered model's fit** for that day's
  actual 2Y−3M slope → the slope framing is not the explanation and the four-year low returns to
  unexplained. This is the registered test below.
- **The 2026-09-17 announcement printing the FRN leg off $28B, or marking it a new issue** → the
  issuance grid this entire ledger treats as settled has broken, five weeks early.
- **The 2026-10-22 announcement moving this auction off 10-28, off $30B, or marking it `FRNR`** →
  every FOMC-pairing statement here is void (not wrong) because the pairing is gone.
- **The 2026-10-28 print landing more than +2.0bp above the 09-23 reopening** → inherited from
  [FT-treasury-coupon-announcement-2026-10-22-2](../forward-tests/treasury-coupon-announcement-2026-10-22.md);
  it kills the no-concession reading, not this ledger's slope model.
- **Indirect share rising above ~70% while the margin compresses further** → leg 4's "not a demand
  event" reading is wrong and the composition instruction above needs re-deriving.

**Registered:** [`FT-treasury-2y-frn-2026-10-28-1`](../forward-tests/treasury-2y-frn-2026-10-28.md) —
the slope model, scored out-of-sample on the **2026-09-23** reopening, score-by **2026-09-24**. The
FOMC-concession prediction is deliberately **not** re-registered here.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 53 | **Initial research.** Auction row re-verified from the Tentative Auction Schedule PDF (HTTP 200, 17,195 bytes, glyph-coordinate rows): 2026-10-28 `2-Year FRN`, **no `R`** → $30B quarterly new issue, announced 10-22, settles 11-02; 2026-10-28 confirmed an FOMC decision day off the Fed's own calendar (164,831 bytes). **Measured:** discount margin regresses on the 2Y−3M par slope at **R² 0.758** over all 69 auctions since 2021 (β −10.08bp per 100bp; 2022+ R² 0.790), so ~10bp of the ~15bp compression to the four-year low is slope, not scarcity. A 2023–2025-trained model run out-of-sample on 2026 under-predicts by mean **−2.19bp** (−3.89 / −3.79 on the last two) — the residual richness is **2–4bp**, the honest size of the bill-demand channel. Demand does **not** corroborate: 2026 indirect **61.3%** < 2024's 66.5%, direct 0.2%, b/c 3.18 (in-range), corr(DM, b/c) −0.21. **Null:** FRN auction days move nothing (ex-FOMC n=40 — 3M +0.05bp t=+0.40, 2Y +0.70bp t=+1.07, 10Y +0.25bp t=+0.13); the "quieter" version fails its Wednesday control (2Y t=−4.19 → **−2.16**; 3M −4.71 → −1.55), so recorded as no effect detected, opposite the 2Y *note*'s −4.70bp/t=−4.60. **Adjacency sweep:** no peers (`symbols: []`); VIX **14.53** (09-04 close, 09-05 Saturday, 09-07 Labor Day); 19 tracked events within 5 days of 10-28, incl. fomc-2026-10-28 same-day and the 2Y/5Y/7Y notes 10-26/27/29; **the 2026-09-23 FRN reopening had no calendar row and is proposed in this PR** as `treasury-2y-frn-2026-09-23.json` (`estimate`). Registered FT-treasury-2y-frn-2026-10-28-1; FOMC-concession test inherited from the 10-22 sibling, not duplicated. | Opening stance: read-only, stand aside — `estimate` date, `symbols: []` | 2026-09-26 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory — after which this doc goes quiet.
