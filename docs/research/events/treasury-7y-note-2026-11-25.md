# 7-Year Treasury Note auction (November new issue, 11:30am ET close) — treasury-7y-note-2026-11-25

**Kind:** rates · **Date:** 2026-11-25 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — `7-Year NOTE / Thursday, November 19, 2026 / Wednesday, November 25, 2026 / Monday, November 30, 2026`, no `R`; the 11:30am ET close is sourced from `closing_time_comp`, not assumed) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["advance-economic-indicators-2026-11-27","aws-reinvent-2026","beige-book-2026-11-25","chicago-pmi-2026-11-30","consumer-confidence-2026-11-24","cyber-monday-2026-11-30","dallas-fed-mfg-2026-11-30","durable-goods-2026-11-25","fhfa-hpi-2026-11-24","fomc-blackout-start-2026-11-28","gdp-q3-2026-second-2026-11-25","japan-cpi-2026-11-20","japan-cpi-tokyo-flash-2026-11-27","jgb-40y-auction-2026-11-25","new-home-sales-2026-11-25","opex-2026-11-20","pce-2026-11-25","russell-recon-lockdown-2026-11-30","russell-style-month-end-capping-effective-2026-11-30","sifma-bond-early-close-2026-11-27","thanksgiving-half-day-2026-11-27","thanksgiving-market-closure-2026-11-26","treasury-2y-frn-2026-11-24","treasury-2y-note-2026-11-23","treasury-5y-note-2026-11-24"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The 7-year auction's "measured signature" is not a constant, and this session's job was to
find that out before three more ledgers inherited it.** The
[10-29 sibling](treasury-7y-note-2026-10-29.md) established that the 7Y richens **−0.95bp against the
10Y** on its own auction day (t = −5.04, sign test p = 0.000034) and handed that forward as the prior for
the November and December auctions. Re-measured this session on the same two Treasury primaries but over
**thirteen years instead of four** (152 auctions since 2014, 3,172 par-curve sessions), that number
reproduces **exactly** on its own 2023-onward window — and **reverses sign out of sample**: 2014–2021
prints **+0.479bp, t = +3.98**, with a flat last-8-business-day calendar control on *both* sides (0.000bp
and +0.050bp). Pooled over the full record the effect is **−0.079bp, t = −0.66 — nothing**, and the
sign test is 52 negative / 53 positive. **It is not noise and it is not a constant: it is a linear
function of how much paper the primary dealers have to eat.** `7s10s = −1.894 + 0.090 × dealer%`, slope
**t = 7.83**, surviving a linear time-trend control (**partial corr +0.349, t = 4.55**) and year-demeaning
(**slope +0.082, t = 3.83**, 11 of 13 within-year correlations positive). Dealer takedown halved from
**35.4%** (2014) to **10.4%** (2025); the model's fitted value at 2026's mean dealer share is **−0.84bp**,
which is where the sibling's −0.95bp came from. **Second finding, and it kills the story this auction was
filed for:** the 11:30am close is **not its own effect** — the nine early-close auctions residual
**+0.267bp, t = 0.92** off the same model, against −0.017bp for the ordinary 143. The pre-holiday session
is an ordinary auction with the clock moved. Size **$44B**. `symbols: []`, date `estimate`, nothing here
is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-77) | **Stand aside** | High | Size, CUSIP and when-issued do not exist until the **2026-11-19** announcement, `symbols: []` leaves nothing to express a view in, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. | Nothing dated today reaches this event; its terms are 71 days away |
| This week | **Stand aside** | High | Nothing this week is this tenor's own data. The next 7Y-specific fact of any kind is the **2026-09-24** predecessor auction. | The **2026-09-11** CPI — which moves the policy path this auction prices, not the auction |
| This month | **Retire the "−0.95bp auction-day signature" as a portable constant; carry the dealer-takedown model instead** | Medium-high | The same test on 108 pre-2022 auctions prints **+0.479bp, t = +3.98** — significant the other way, against a flat calendar control. What survives both halves is the slope on dealer share (**t = 7.83**, partial-corr **t = 4.55**, year-demeaned **t = 3.83**). | The **2026-09-24** and **2026-10-29** prints landing 7s10s more than **2bp** off `−1.894 + 0.090 × dealer%` — the model failing out of sample twice running, where only **9.2%** of the 152-auction history does |
| This quarter | **Do not attribute anything on 2026-11-25 to the auction, and do not expect the early close to add a concession** | Medium | The corridor is the most saturated this calendar carries — **26** tracked events within five days, **five sharing the date** (PCE + GDP 2nd at 08:30, durable goods, new home sales, Beige Book 14:00). Against that, a fitted **−0.8bp** is unrecoverable at daily resolution; and the half-day residual is **+0.267bp, t = 0.92**, so thinness adds nothing. | The 2026-11-25 print's 7s10s landing **≤ −1.5bp below** its dealer-fitted value — the early-close-amplifies-concession story finally showing up (registered as **FT-treasury-7y-note-2026-11-25-1**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date `estimate`, no rates-keyed house playbook.
  Read-it-don't-trade-it.
- **The corrected statement of the auction-day effect**, stated so it stops being quoted as a constant:
  **`7s10s(bp) = −1.894 + 0.090 × dealer%`** on the competitive base, n=152, slope t = **7.83**,
  residual sd **1.244bp**. Fitted **−0.84bp** at 2026's 11.72% mean dealer share; **+0.35bp** at the
  pre-2022 mean of 25.05%.
- **The conditional base rate that replaces the unconditional one.** Of auctions taking dealer share
  **below 13%** (n=38), 7s10s is negative on **25 of 28 non-zero days = 89.3%**; above 21% (n=63) it is
  negative only **12.7%** of the time. Unconditionally it is **49.5%** of non-zero — a coin flip. Any
  "the 7Y richens on auction day" claim is a claim about dealer share.
- **The early close is a half-day phenomenon, not a Thanksgiving one** — `closing_time_comp` reads
  **11:30 AM** on 9 of 152 auctions: six pre-Thanksgiving, **two Christmas-Eve** (2014-12-24,
  2025-12-24), one unexplained (2016-02-26, a Friday with no holiday). Treasury moves the auction
  forward by the same 90 minutes SIFMA moves the 2:00pm close, so the post-auction window is **2.5
  hours either way**.
- **Demand does not degrade on the half day** — b/c **2.541** (n=8 holiday half-days) vs **2.490**
  (n=144), t = 1.19; the 11-19 announcement ledger's null replicates at n=8 across two holidays.
- **Grade the print on dealer takedown**, $44B era (n=29): p25 **9.34%** · median **11.64%** ·
  p75 **12.75%** · max **17.00%**. 2026's eight prints ran **10.42–12.97%**.
- **Bid-to-cover band, $44B era** (29 auctions, 2024-04-25 → 2026-08-27): min **2.40** · p25 2.49 ·
  median 2.51 · p75 2.64 · max **2.79**. Outside that range is the first in the era.
- **Percentages are on the competitive base** (indirect + direct + dealer), never `total_accepted` —
  SOMA add-ons ran **$4.55–6.59B** across 2026's eight auctions, 10–15% of the offering.
- **Size is $44B** — identical in all six monthly rows `sb0590` publishes and unchanged since
  2024-04-25; the November cell is set at the **2026-11-04** refunding.
- **Watch (dated)** — CPI **09-11** · FOMC **09-16** · predecessor 7Y **09-24** · CPI **10-14** ·
  7Y **10-29** · refunding **11-04** · CPI **11-10** · this announcement **11-19** · 2Y **11-23** ·
  5Y + FRN **11-24** · **this auction 11-25** · Thanksgiving **11-26** · settlement **11-30** ·
  the next 7Y **12-29**, announced on Christmas Eve.

## Initial research

**The question, plainly:** this is the first 7-year auction after
[10-29](treasury-7y-note-2026-10-29.md), whose ledger measured a **−0.95bp** 7Y-minus-10Y auction-day
signature, placebo-controlled it, bootstrapped it, and named it explicitly as "the base rate this doc
hands the November and December 7Ys." November is where that prior gets used. So the honest first job
was not to describe 11-25 — it was to test whether the prior is portable, before three more ledgers
quote it. The event's own hook, inherited from both proposals, was a second question: does the
**11:30am ET early close** — a slot only nine auctions in the record have ever occupied — do anything
of its own?

**One-line verdict:** the prior is **not portable and the effect is not a constant** — extended from
four years to thirteen it reverses sign, and what survives every control is a **slope on primary-dealer
takedown**, which reproduces the sibling's number as the model's output at today's dealer share rather
than as a property of auctions; the early close, tested against that model, is **a null**.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode. The
house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure below is computed this session
from two Treasury primaries fetched today: the Fiscal Data `auctions_query` dataset filtered on
`security_term` (the correction the 10-29 sibling banked — **259 rows, zero reopenings**, of which
**152** auction on or after 2014-01-01), and the daily par yield curve CSVs for **2014–2026**
(**3,172** close-to-close observations, 2014-01-02 → 2026-09-08, thirteen files fetched individually).
Schedule provenance is the Tentative Auction Schedule PDF (home.treasury.gov, HTTP 200, 17,195 bytes),
decompressed stream-by-stream and re-read here as an independent third pass after the two proposals.
VIX is the **2026-09-08** close (15.72) from the same Yahoo daily endpoint
`scripts/event-material-scan.mjs` uses. This event was `never-assessed` and existed only as two
sibling proposals; both were read in full before the canonical
`src/domain/market-events/treasury-7y-note-2026-11-25.json` was written this session. Each claim dated
in line.

### Conviction legs, tested

**1. The date and terms are right, and the entry stays `estimate` on purpose — SUPPORTED.** The
tentative schedule carries the row verbatim: `7-Year NOTE · Thursday, November 19, 2026 · Wednesday,
November 25, 2026 · Monday, November 30, 2026`. The flag column *is* populated in the same November
block — `10-Year TIPS R T`, `2-Year FRN R` and `20-Year BOND R` all sit within twenty rows — so the
absence of an `R` is a positive signal of a new issue, not a missing field. The same PDF carries
`Holiday - Thursday, November 26, 2026 - Thanksgiving Day` in its own holiday line, which is the
displacement's proximate cause: the 7Y's four other months in the Aug-2026→Jan-2027 window all auction
on a **Thursday** (08-27, 09-24, 10-29, 2027-01-28); November and December are the two exceptions, and
December's is year-end, not a holiday. The entry stays `estimate` for the two reasons both proposals
recorded and this session does not overturn — a tentative schedule is tentative by construction, and
this lane may not self-confirm an event it discovered in-sweep. The confirming primary is the
**2026-11-19** announcement.

**2. Size is $44B — SUPPORTED, inherited and corroborated.** `sb0590` (2026-08-05) publishes anticipated
coupon sizes through Oct-26 only, with the 7-Year column reading **44** in all six monthly rows; the
November cell arrives at the **2026-11-04** refunding. The dataset corroborates independently:
**29 consecutive $44B 7-year auctions**, 2024-04-25 → 2026-08-27, with the offering amount taking
exactly one distinct value across that span. This leg is carried from the
[10-29 sibling](treasury-7y-note-2026-10-29.md) and the
[11-19 announcement ledger](treasury-coupon-announcement-2026-11-19.md), which read `sb0590` as text;
this session did not re-fetch it and says so.

**3. THE FINDING — the −0.95bp auction-day signature reverses sign out of sample, and the pooled effect
is zero — SUPPORTED.** The 10-29 sibling's window is 2023-01-onward. Extending the identical measurement
backward to 2014 (same primaries, same close-to-close definition, same 7Y-minus-10Y construction):

| Window | n | 7Y−10Y on auction days | t | sign (neg/pos/zero) | non-auction last-8-biz-day control |
|---|---|---|---|---|---|
| 2023-01 → now (**the sibling's**) | 44 | **−0.955bp** | **−5.04** | 27 / 4 / 13 | +0.032bp (t = 0.52) |
| 2022-01 → now | 56 | **−1.036bp** | **−5.34** | 35 / 6 / 15 | +0.050bp (t = 0.87) |
| **2014-01 → 2021-12** | **96** | **+0.479bp** | **+3.98** | 17 / 47 / 32 | **0.000bp (t = 0.00)** |
| **FULL 2014 → now** | **152** | **−0.079bp** | **−0.66** | **52 / 53 / 47** | +0.019bp (t = 0.57) |

The first row reproduces the sibling **to three decimals** (−0.955 vs its −0.95, t = −5.038 vs −5.04,
sign test 27/4/13 identical), which is what validates this session's pipeline against theirs — nothing
below is a disagreement about arithmetic. The third row is the problem: the same test on **more than
twice as many observations** is significant in the **opposite direction**, against a calendar control
that is flat to three decimals. Pooled, the effect is indistinguishable from zero and the sign test is a
coin flip. **Every leg of the sibling's construction flips with it**: its placebo (5Y−10Y) is +0.273
(t = 0.96) in 2023+ but **−0.491 (t = −2.98)** in 2014–2021, so "only the auctioned tenor outperforms" is
not a general property; 7Y−5Y is −1.227 (t = −6.59) in 2023+ and **+0.769 (t = +5.39)** before; the D+2
reversal it read as "the mechanism's own prediction" is +0.545 (t = 3.46) in 2023+ and **−0.204
(t = −2.24)** before. Year by year the sign is monotone in time, not random: **2014 +1.08 · 2015 +0.67 ·
2016 +0.42 · 2017 0.00 · 2018 +0.42 · 2019 +0.42 · 2020 +0.17 · 2021 +0.67 · 2022 −1.33 · 2023 −1.17 ·
2024 −1.17 · 2025 −0.92 · 2026 −0.38.**

**4. What survives both halves is a slope on dealer takedown, not a constant — SUPPORTED, and this is the
replacement.** The auction day *is* reliably different from an ordinary last-week-of-month session in
both sub-periods (difference vs control: **+0.479bp, t = +3.79** pre-2022; **−1.086bp, t = −5.37**
after) — so there is a real auction-specific effect whose sign moved. The variable that moves with it is
**primary-dealer takedown on the competitive base**, which halved over the same span:

| Year | 2014 | 2016 | 2018 | 2020 | 2022 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|
| dealer % | 35.4 | 24.0 | 22.3 | 22.2 | 13.3 | 12.0 | 10.4 | 11.7 |
| 7Y−10Y (bp) | +1.08 | +0.42 | +0.42 | +0.17 | −1.33 | −1.17 | −0.92 | −0.38 |

OLS on all 152: **`7s10s = −1.894 + 0.090 × dealer%`**, slope **t = 7.83**, residual sd **1.244bp**.
Three controls, because a variable that trends can always mimic a variable that matters:

- **Linear time-trend control.** Residualising *both* series on a time index leaves partial
  **corr = +0.349, t = 4.55** — the relationship is not the trend.
- **Year-demeaning** (the trend removed by construction, only within-year variation left): pooled
  **corr = +0.298, t = 3.83**, slope **+0.082bp per dealer-share point** — statistically
  indistinguishable from the pooled 0.090, which is the strongest corroboration available here: the
  cross-sectional and time-series slopes agree. **11 of 13** within-year correlations are positive.
- **The fitted values reproduce both halves.** At 2026's mean dealer share (**11.72%**) the model says
  **−0.84bp**; the sibling measured −0.955 over 2023+. At the pre-2022 mean (**25.05%**) it says
  **+0.35bp**; 2014–2021 printed +0.479. One equation, both regimes.

Conditional base rates make the same point in the form a forward test can use: of the **38** auctions
taking dealer share below 13%, 7s10s is negative on **25 of 28 non-zero days (89.3%)**, mean −1.105bp;
of the **63** above 21%, negative only **12.7%** of the time, mean +0.746bp. The zero crossing is at
**21.0%** dealer share.

**5. The mechanism is not SOMA, and the SOMA hypothesis is REFUTED rather than left open.** The obvious
candidate for a 2022 break is QT — the Fed ceasing to roll maturing holdings into auctions as
price-insensitive non-competitive add-ons, leaving more paper for the market. The data says no: SOMA
add-ons averaged **8.43%** of the offering pre-2022 and **7.48%** after, non-zero in 72 of 96 and 44 of
56 auctions respectively, and 2026's eight prints carry the **largest** add-ons of the record
($4.55–6.59B, 10–15%). `corr(SOMA%, 7s10s)` is +0.063 (t = 0.61) pre-2022. This leg is reported because
it was the first hypothesis tested and it failed; the dealer-share result is not "the variable that was
left," it is the one that survives the controls in leg 4. What *caused* dealer share to halve is not
established here and this doc does not guess.

**6. THE EARLY CLOSE IS NOT ITS OWN EFFECT — SUPPORTED as a null, which retires this event's own
headline.** Both proposals filed 11-25 partly because a 7-year selling into a thin pre-holiday session
with an 11:30am close *looks* like it should carry a bigger concession. Tested as a residual against the
leg-4 model, it does not:

| Auction | 7s10s | dealer % | fitted | residual |
|---|---|---|---|---|
| 2014-11-26 | +1.0 | 37.13 | +1.43 | −0.43 |
| 2014-12-24 | +2.0 | 37.58 | +1.47 | +0.53 |
| 2015-11-25 | +1.0 | 30.53 | +0.84 | +0.16 |
| 2016-02-26 | +3.0 | 32.32 | +1.00 | +2.00 |
| 2016-11-23 | 0.0 | 17.99 | −0.28 | +0.28 |
| 2019-11-27 | 0.0 | 20.31 | −0.08 | +0.08 |
| 2024-11-27 | −2.0 | 9.99 | −1.00 | −1.00 |
| 2025-11-26 | −1.0 | 13.07 | −0.72 | −0.28 |
| 2025-12-24 | 0.0 | 9.34 | −1.06 | +1.06 |

Mean residual **+0.267bp, t = 0.92, n = 9**, against **−0.017bp** for the ordinary 143 — the wrong sign
for the amplification story and nowhere near significance either way. Demand tells the same story: b/c
**2.541** on the eight holiday half-days vs **2.490** on the other 144 (t = 1.19), which replicates the
[11-19 ledger's](treasury-coupon-announcement-2026-11-19.md) n=6 Thanksgiving null at n=8 across two
different holidays. **The correction this session makes to its own proposals:** both filed the 11:30am
close as a *Thanksgiving* fact. It is a **half-day** fact — `closing_time_comp` reads 11:30 AM on
2014-12-24 and 2025-12-24 too, and the driver is SIFMA's recommended **2:00pm** bond close, not the
holiday's identity. That reframing is what makes the day measurable at all: Treasury moves the auction
forward by **90 minutes** and SIFMA moves the close forward by **90 minutes**, so the post-auction
observation window is **2.5 hours in both cases** (13:00→15:30 ordinarily, 11:30→14:00 on a half day).
The concession-and-snapback window is preserved, not compressed. **One anomaly stated rather than
smoothed:** 2016-02-26 is a Friday with no holiday and an 11:30 AM close, and this session could not
explain it; it is the single largest residual in the table (+2.00bp) and is retained in every figure
above rather than dropped.

**7. The corridor is the most saturated this calendar carries, and that is the practical output —
SUPPORTED.** **Twenty-six** tracked entries sit within five days of 2026-11-25 (against fourteen for the
10-29 sibling), and **five share the date**: [PCE](pce-2026-11-25.md) and
[GDP Q3 second](gdp-q3-2026-second-2026-11-25.md) at 08:30 ET (both `confirmed`),
[durable goods](durable-goods-2026-11-25.md) and [new home sales](new-home-sales-2026-11-25.md), and the
[Beige Book](beige-book-2026-11-25.md) at 14:00 — after the 14:00 bond close, so it lands into a market
that has already shut. The cause is mechanical: Thanksgiving (11-26, a full closure) and the 11-27 half
day pull Thursday's and Friday's slate onto the Wednesday. The 4-week, 8-week and 17-week bill auctions
and the 13/26-week announcement are displaced onto the same session by the same PDF. Against a stack
that size, a fitted **−0.8bp** is not recoverable at daily resolution and no honest reading of 11-25's
tape can assign a move to $44B of seven-year paper. The auction also settles **11-30** alongside the 2Y,
5Y, 20Y bond and 10Y TIPS — five coupon settlements on one month-end Monday, which is a
supply-concentration fact about 11-30, not about 11-25.

**8. No new adjacency inside the corridor; two dated events found OUTSIDE it and proposed —
SUPPORTED.** The five-day corridor is fully tracked (26 of 26, counting the two sibling proposals for
`treasury-2y-frn-2026-11-24` and `treasury-5y-note-2026-11-24` that the loader stands in). Reading the
tentative schedule's December block for this event's successor surfaced two genuine gaps, both dated,
both proposed in this PR as files this event owns: **`treasury-coupon-announcement-2026-12-24`** — the
December month-end coupon block (2Y, 5Y, **7Y**, 13-week, 26-week, 6-week) announced **on Christmas
Eve**, a session `christmas-eve-half-day-2026-12-24` already tracks as an early close, and the direct
twin of the tracked-and-researched [11-19 announcement](treasury-coupon-announcement-2026-11-19.md);
and **`treasury-7y-note-2026-12-29`** — this event's own successor, auctioning Tuesday 12-29 and
settling 12-31. Both sit outside the five-day corridor, which is why the 10-29 sibling declined to file
them; they are filed here because leg 4's model needs out-of-sample prints to be scored against and
12-29 is the second of them, and because an announcement landing on a half day is exactly the structure
leg 6 just measured.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house answer
for this event kind. The usable outputs are two **reading instructions**. For the session that pulls
this ledger on 2026-11-25: expect an ordinary auction with the clock moved 90 minutes, expect roughly
**−0.8bp** of 7s10s conditional on a dealer takedown near 11–12%, and report neither as the day's news
against a five-release stack. For any session quoting the 10-29 sibling's −0.95bp: quote the **model**,
not the constant.

**Honest limits.** This is a **daily close-to-close** measurement on a fitted CMT par curve **rounded to
1bp**; 47 of 152 auction-day observations are literally zero, which is what that rounding looks like,
and adjacent-tenor spreads on a smoothed curve are exactly where fitting artifacts would hide. The
dealer-share result is a **correlation with controls, not an identified mechanism** — the controls rule
out a linear time trend and within-year confounding, they do not establish that dealer takedown
*causes* the spread move rather than both responding to a third variable (the obvious candidate,
SOMA, is refuted in leg 5, but "refuted one candidate" is not "identified the cause"). Dealer share is
measured *after* the auction, so the model is explanatory, not predictive, until the takedown prints —
a forward test on it can only be scored post-hoc, which
[FT-treasury-7y-note-2026-11-25-1](../forward-tests/treasury-7y-note-2026-11-25.md) states up front. The
2022 break is identified by inspection of the year-by-year table, **not** by a structural-break test,
and the 2014-01 start is a data-availability boundary. The early-close null rests on **n = 9** with one
member (2016-02-26) unexplained; a null at that sample size is a failure to detect, not a demonstration
of absence. The half-day residual and the pre-2022 placebo reversal are each one cell of a small scan
with **no multiple-comparison correction**. This auction's own size, CUSIP, when-issued level and demand
**do not exist yet** — the announcement is 2026-11-19 and the size cell is set at the 2026-11-04
refunding. `symbols: []`, `medium` impact, date `estimate`: nothing here licenses a position in any name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and this session's specific
contribution is a **correction to an inherited prior, plus a null on this event's own headline**. The
7-year auction's day is genuinely different from an ordinary last-week-of-month session — but its
**sign is not fixed**: **+0.479bp (t = +3.98)** over 96 auctions to 2021 and **−1.036bp (t = −5.34)**
over 56 since, against a calendar control flat in both halves, pooling to **−0.079bp (t = −0.66)** over
all 152. So the [10-29 sibling's](treasury-7y-note-2026-10-29.md) **−0.95bp**, which this session
reproduces exactly on its own window, must not be carried forward to 11-25, 12-29 or 2027-01-28 as a
constant. What is portable is the model **`7s10s = −1.894 + 0.090 × dealer%`** (slope t = 7.83; partial
corr controlling for time **+0.349, t = 4.55**; year-demeaned slope **+0.082, t = 3.83**), whose fitted
value at 2026's **11.72%** mean dealer share is **−0.84bp** — i.e. the sibling's number is this model's
output at today's dealer share, not a property of auctions. **And the reason this event was filed is a
null:** the 11:30am ET close is a **half-day** artifact (nine occurrences, six pre-Thanksgiving and two
Christmas-Eve), it preserves rather than compresses the post-auction window (2.5 hours either way), and
tested as a residual it adds **+0.267bp, t = 0.92, n = 9** — the wrong sign for the
thin-session-bigger-concession story. Demand is likewise unimpaired (b/c **2.541** vs **2.490**,
t = 1.19). On **2026-11-25** itself the correct output is *do not attribute*: **26** tracked events sit
within five days and **five share the date**, so a fitted 0.8bp is unrecoverable. Grade the print on
**dealer takedown** ($44B era p25 **9.34** / median **11.64** / p75 **12.75**), never on indirect share
(the [10-29 sibling's](treasury-7y-note-2026-10-29.md) substitution correction stands and is not
re-litigated here). Size **$44B**, subject to the 2026-11-04 refunding. Nothing here is directional and
no house playbook applies.

**Kill switches (what would change this stance):**

- **The core one — the 2026-11-25 print landing 7s10s ≥ 1.5bp BELOW its dealer-fitted value.** That is
  the early-close-amplifies-concession story finally appearing, and it would reinstate this event's
  original headline. Registered as **FT-treasury-7y-note-2026-11-25-1** in
  [`forward-tests/treasury-7y-note-2026-11-25.md`](../forward-tests/treasury-7y-note-2026-11-25.md),
  score by **2026-11-30**, with its null pass rate stated up front (**89.5%** in-sample: only 16 of 152
  residuals reach −1.5bp) — a weak test by construction, and it is registered as a weak one rather than
  dressed up.
- **The model itself failing out of sample — 7s10s more than 2bp off fitted on 09-24 or 10-29.** Only
  **9.2%** of the 152-auction history misses by that much; two consecutive misses would say the slope is
  a within-sample artifact and this doc's central correction is wrong, which would leave the lane with
  *neither* the sibling's constant nor a replacement.
- **A size change at the 2026-11-04 refunding or the 2026-11-19 announcement.** $44B is 29 consecutive
  auctions of precedent and `sb0590`'s written guidance; any deviation breaks the like-for-like series,
  voids the bid-to-cover band and the dealer-share quantiles, and must be logged off-cadence.
- **Dealer takedown printing outside 9.34–17.00%** (the $44B era's full range) on 09-24, 10-29 or 11-25 —
  the variable the whole leg-4 model is keyed to moving outside its observed support, which would put
  every fitted value in this doc into extrapolation.
- **Bid-to-cover outside 2.40–2.79** — the $44B era's full range dies on either side, and with it the
  base rate handed to December.
- **The auction moving off 2026-11-25 at the 11-19 announcement**, or Thanksgiving's closure changing —
  the whole half-day frame is leg 6, and without it this reverts to an ordinary month-end belly sale
  graded on leg 4 alone.
- **A published explanation for 2016-02-26's 11:30am close** — the one unexplained member of the
  early-close set and the largest residual in it; whatever explains it may be a category this doc has
  mis-pooled.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution
  rather than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-77 | Initial research banked (doc above); canonical `src/domain/market-events/treasury-7y-note-2026-11-25.json` written this session after reading BOTH prior proposals (`.from-treasury-2y-note-2026-11-23`, `.from-treasury-coupon-announcement-2026-11-19`), which are now shadowed and inert; `probe-ref` populated with real readings so the first `interval-elapsed` pulse is screenable. **Event tape (primary).** Terms verified independently from home.treasury.gov's Tentative-Auction-Schedule.pdf (HTTP 200, 17,195 bytes, text layer decompressed today — a third read of the same primary): announce **Thu 2026-11-19**, auction **Wed 2026-11-25**, settle **Mon 2026-11-30**, no `R` → new issue (the flag column IS populated nearby — `10-Year TIPS R T`, `2-Year FRN R`, `20-Year BOND R` — so the blank is a signal); the PDF's own holiday line reads `Holiday - Thursday, November 26, 2026 - Thanksgiving Day`. Entry stays **`estimate`** on both proposals' stated grounds. Size **$44B** carried from `sb0590` via the [10-29](treasury-7y-note-2026-10-29.md) and [11-19](treasury-coupon-announcement-2026-11-19.md) ledgers (not re-fetched today, said so), corroborated by **29 consecutive $44B 7Ys** in today's pull. **THE LOAD-BEARING FINDING — the 10-29 sibling's −0.95bp auction-day signature is NOT a portable constant; extended out of sample it REVERSES SIGN.** Same primaries, same construction, 13 years instead of 4: **152** 7Y auctions since 2014 (fiscaldata `auctions_query` on `security_term`, 259 rows, zero reopenings) against **3,172** par-curve sessions (2014-01-02 → 2026-09-08, thirteen CSVs fetched today). 2023-01+ reproduces the sibling **exactly** (−0.955bp, t = −5.038, sign 27n/4p/13z — validating this pipeline against theirs), but **2014-01 → 2021-12 prints +0.479bp, t = +3.98** (17n/47p/32z) against a non-auction last-8-business-day control of **0.000bp (t = 0.00)**; the 2022+ half is −1.036 (t = −5.34) against a control of +0.050. **Pooled over all 152: −0.079bp, t = −0.66, sign 52n/53p/47z — a coin flip.** Every supporting leg flips too: the 5Y−10Y placebo is +0.273 (t = 0.96) in 2023+ but **−0.491 (t = −2.98)** before; 7Y−5Y is −1.227 (t = −6.59) vs **+0.769 (t = +5.39)**; the D+2 "snapback" is +0.545 (t = 3.46) vs **−0.204 (t = −2.24)**. Year-by-year the sign is monotone in time: 2014 +1.08 · 2015 +0.67 · 2016 +0.42 · 2017 0.00 · 2018 +0.42 · 2019 +0.42 · 2020 +0.17 · 2021 +0.67 · 2022 −1.33 · 2023 −1.17 · 2024 −1.17 · 2025 −0.92 · 2026 −0.38. **THE REPLACEMENT — it is a slope on DEALER TAKEDOWN, not a constant.** The auction day IS reliably different from its calendar control in both halves (**+0.479bp, t = +3.79** pre-2022; **−1.086bp, t = −5.37** after), and dealer share on the competitive base halved across the same span (35.4% in 2014 → 10.4% in 2025 → 11.7% in 2026). OLS on all 152: **`7s10s = −1.894 + 0.090 × dealer%`, slope t = 7.83**, residual sd **1.244bp**. Survives a **linear time-trend control** (residualise both series on a time index → partial **corr +0.349, t = 4.55**) and **year-demeaning** (within-year only → **corr +0.298, t = 3.83**, slope **+0.082 bp/point**, indistinguishable from the pooled 0.090; **11 of 13** within-year correlations positive). Fitted **−0.84bp** at 2026's 11.72% mean dealer share vs the sibling's measured −0.955; fitted **+0.35bp** at the pre-2022 mean of 25.05% vs the +0.479 actually printed — **one equation reproduces both regimes**. Conditional base rates: dealer% **< 13%** (n=38) → 7s10s negative on **25 of 28 non-zero = 89.3%**, mean −1.105bp; dealer% **≥ 21%** (n=63) → negative only **12.7%**, mean +0.746bp; unconditional **49.5%** of non-zero. **This is also the correct null for the sibling's own FT-treasury-7y-note-2026-10-29-1**, which stated 61.4% from its window's unconditional rate — conditioned on today's dealer share the right null is ~89%, so a pass on that test is close to uninformative. Flagged for whoever pulls 10-29 next; not edited here (append-only, one file per owner). **SOMA REFUTED as the mechanism**: add-ons averaged **8.43%** of offering pre-2022 vs **7.48%** after (non-zero 72/96 and 44/56), and 2026's eight prints carry the largest of the record ($4.55–6.59B); corr(SOMA%, 7s10s) = +0.063 (t = 0.61) pre-2022. What caused dealer share to halve is NOT established and this doc does not guess. **SECOND FINDING — this event's own headline is a NULL, and the framing in both proposals was wrong.** The 11:30am ET close is a **half-day** artifact, not a Thanksgiving one: `closing_time_comp` reads `11:30 AM` on **9 of 152** — six pre-Thanksgiving (2014-11-26, 2015-11-25, 2016-11-23, 2019-11-27, 2024-11-27, 2025-11-26), **two Christmas-Eve (2014-12-24, 2025-12-24)**, and one unexplained (**2016-02-26**, a Friday with no holiday, retained not dropped) — against `01:00 PM` on 143. The driver is SIFMA's recommended **2:00pm** bond close, and Treasury moves the auction forward by the same **90 minutes**, so the post-auction observation window is **2.5 hours either way** (13:00→15:30 vs 11:30→14:00) — preserved, not compressed, which is why the day is readable at all. Tested as residuals against the leg-4 model the nine early closes mean **+0.267bp, t = 0.92** against **−0.017bp** for the ordinary 143 — the WRONG SIGN for thin-session-bigger-concession. Demand agrees: b/c **2.541** (n=8 holiday half-days) vs **2.490** (n=144), t = 1.19, replicating the [11-19 ledger's](treasury-coupon-announcement-2026-11-19.md) n=6 Thanksgiving null at n=8 across two different holidays; dealer% 21.99 vs 20.18 (t = 0.43). **Macro.** Par curve 2026-09-08: 2Y **4.39**, 3Y 4.44, 5Y **4.57**, 7Y **4.68**, 10Y **4.80**, 20Y 5.26, 30Y **5.25**; 2s10s **41bp**, **7s10s −12bp**. Since the 08-27 auction (7Y 4.52 / 10Y 4.67, cleared 4.512%): 2Y +19, 5Y +19, **7Y +16**, 10Y +13, 30Y +6 — front-end-led, 7Y at the year's high and **16bp cheap** to where August's 7Y actually cleared. **Volatility:** VIX **15.72** (2026-09-08 close) vs 14.53 on 09-04 and the 14.43 2026 low of 08-28 — quiet, +1.19 inside the 3-point screen threshold. **Peers:** `symbols: []`, none applicable. **Geopolitical:** nothing new touching this tenor beyond the oil→inflation→Fed-path channel the September siblings recorded. **Corridor — the most saturated this calendar carries: 26 tracked entries within five days** (vs 14 for 10-29), **five sharing the date** — [PCE](pce-2026-11-25.md) + [GDP Q3 2nd](gdp-q3-2026-second-2026-11-25.md) 08:30 (both `confirmed`), [durable goods](durable-goods-2026-11-25.md), [new home sales](new-home-sales-2026-11-25.md), [Beige Book](beige-book-2026-11-25.md) 14:00 (**after** the 14:00 bond close) — because Thanksgiving 11-26 and the 11-27 half day pull Thursday/Friday's slate onto the Wednesday; the 4/8/17-week bill auctions and the 13/26-week announcement are displaced onto the same session by the same PDF. Settlement **11-30** carries the 2Y, 5Y, 20Y bond and 10Y TIPS too — five coupon settlements on one month-end Monday. **Adjacency sweep:** corridor fully tracked (26/26, counting the loader's stand-in for the `treasury-2y-frn-2026-11-24` and `treasury-5y-note-2026-11-24` proposals) — **no new corridor event**. Two dated gaps found OUTSIDE it while reading the schedule's December block for this event's successor, both proposed in this PR as files this event owns: **`treasury-coupon-announcement-2026-12-24`** (the December month-end block — 2Y, 5Y, **7Y**, 13/26/6-week — announced **on Christmas Eve**, a session `christmas-eve-half-day-2026-12-24` already tracks as an early close; the direct twin of the tracked 11-19 announcement) and **`treasury-7y-note-2026-12-29`** (this event's successor, auction Tue 12-29, settle 12-31). The 10-29 sibling declined both as out-of-corridor; filed here because leg 4's model needs out-of-sample prints and 12-29 is the second, and because an announcement landing on a half day is the exact structure leg 6 measured. **Forward test registered: FT-treasury-7y-note-2026-11-25-1** — the 11-25 residual from `−1.894 + 0.090 × dealer%` will not reach −1.5bp; null pass rate stated up front at **89.5%** (only 16 of 152 residuals get there), so it is registered as a WEAK test rather than dressed up as a strong one, and it can only be scored after the takedown prints. | — (stance set; the inherited −0.95bp prior is retired as a constant and replaced by the dealer-takedown model) | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-7y-note-2026-11-25.json` (`status: "estimate"`)
in the same PR — this event's own file, never another lane's canonical one. Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc goes
quiet.
