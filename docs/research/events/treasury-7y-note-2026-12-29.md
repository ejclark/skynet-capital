# 7-Year Treasury Note auction (December new issue, announced Christmas Eve, settling on the last business day of 2026) — treasury-7y-note-2026-12-29

**Kind:** rates · **Date:** 2026-12-29 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — `7-Year NOTE / Thursday, December 24, 2026 / Tuesday, December 29, 2026 / Thursday, December 31, 2026`, no `R`) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","china-retaliation-suspension-expiry-2026-12-31","christmas-eve-half-day-2026-12-24","christmas-market-closure-2026-12-25","consumer-confidence-2026-12-29","fhfa-hpi-2026-12-29","fomc-minutes-2026-12-30","georgia-psc-data-center-cost-shift-2026-12-31","japan-cpi-tokyo-flash-2026-12-25","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","new-years-day-market-closure-2027-01-01","russell-style-quarter-end-capping-effective-2026-12-31","sifma-bond-early-close-2026-12-31","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28","sifma-uk-bond-market-closure-2027-01-01","sp-select-sector-secondary-reweight-2026-12-31","treasury-2y-note-2026-12-28","treasury-5y-note-2026-12-28","treasury-coupon-announcement-2026-12-24"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This auction has an exact calendar twin, and the two things that make it look unusual both
measure as nulls.** Late December 2026 has the same weekdays as late December 2020 — Dec 24 Thursday,
Dec 25 Friday holiday, Dec 28 Monday, Dec 29 Tuesday, Dec 31 Thursday — and Treasury schedules the block
identically: announce **12-24**, auction **12-29**, settle **12-31**. That makes 2026-12-29 the second
7-Year in the record with a **two-business-day when-issued window**; **2020-12-29 is the only other one**,
out of 152 auctions since 2014 (modal window 5 days, n=80). Tested this session, **compression does not
degrade the auction**: the 29 auctions with a window of ≤3 business days residual **−0.019bp** off the
dealer-takedown model against **+0.004bp** for the other 123 (t = **−0.10**), with bid-to-cover 2.460 vs
2.501 (t = −1.42) and dealer share 18.29% vs 20.75% (t = −1.55) — directionally weaker, neither
significant. And the intuitive year-end story — dealers warehousing more paper into a balance-sheet date —
is **refuted, not left open**: paired against each year's own Jan–Nov mean, the December 7-Year takes
**+0.11 percentage points** more dealer share, **t = 0.08**, 6 of 12 positive, mean **+0.04** same-year
standard deviations. Settlement on the last business day of the year is likewise the **December norm**
(8 of 12), not this auction's distinction. The [11-25 sibling's](treasury-7y-note-2026-11-25.md) model
`7s10s = −1.894 + 0.090 × dealer%` reproduced **to three decimals** on an independent pull (slope
t = 7.83, residual sd 1.244bp); 12-29 is its **second out-of-sample print**. Size **$44B**. `symbols: []`,
date `estimate`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-111) | **Stand aside** | High | Size, CUSIP and when-issued do not exist until the **2026-12-24** announcement, `symbols: []` leaves nothing to express a view in, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. | Nothing dated today reaches this event; its terms are 106 days away |
| This week | **Stand aside** | High | Nothing this week is this tenor's own data. The next 7Y-specific fact of any kind is the **2026-09-24** predecessor auction. | The **2026-09-11** CPI and the **2026-09-16** FOMC — which move the policy path this auction prices, not the auction |
| This month | **Do not price a concession into the compressed when-issued window — it is a measured null** | Medium-high | Announced 12-24 for a 12-29 auction, this is a **2-business-day** window against a modal 5. Across 152 auctions the ≤3-day group residuals **−0.019bp** vs **+0.004bp** (t = −0.10) off the dealer model, b/c 2.460 vs 2.501 (t = −1.42). | The **2026-09-24** predecessor print landing 7s10s more than **2bp** off `−1.894 + 0.090 × dealer%` — the model failing out of sample, which would strip the yardstick this null was measured against (only **9.9%** of 152 residuals miss by that much) |
| This quarter | **Grade 12-29 on dealer takedown, not on the turn of the year — and expect an ordinary print** | Medium | December's 7-Year is statistically an ordinary 7-Year: paired dealer share **+0.11pt (t = 0.08)**, b/c **−0.039 (t = −1.39)**, residual **+0.240 (t = 0.65)** vs the same year's Jan–Nov mean. Settling 12-31 is the December norm (8/12), not a distinction. | The **2026-12-29** print taking dealer share more than **3 percentage points** (≈ **+1 same-year sd**) above 2026's Jan–Nov mean — the year-end balance-sheet story finally appearing (registered as **FT-treasury-7y-note-2026-12-29-1**; null pass rate **75%**, 9 of 12 Decembers) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date `estimate`, no rates-keyed house playbook.
  Read-it-don't-trade-it.
- **The calendar twin, and it is exact.** 2026's late-December weekdays are identical to 2020's, and
  Treasury's block matches row for row: **announce Thu 12-24 · auction Tue 12-29 · settle Thu 12-31**.
  **2020-12-29** is the only prior 7-Year with this structure — and the only other December in the record
  where the **2Y and 5Y shared an auction date** (2020-12-28; 2026-12-28 will be the second).
- **The when-issued window is 2 business days** — announcement to auction, counted on Treasury's own
  par-curve calendar. Distribution across 152: **5bd n=80 · 4bd n=42 · 3bd n=28 · 2bd n=1 · 6bd n=1**.
- **Compression is a null.** ≤3bd (n=29) vs ≥4bd (n=123): model residual **−0.019 vs +0.004bp**
  (t = **−0.10**) · b/c **2.460 vs 2.501** (t = −1.42) · dealer share **18.29% vs 20.75%** (t = −1.55).
- **The year-end balance-sheet story is refuted.** December minus the same year's Jan–Nov mean, n=12:
  dealer share **+0.11pt, t = 0.08** (6/12 positive, mean z **+0.04**) · residual **+0.240bp, t = 0.65**
  (7/12 positive). Unpaired, December vs the other 140: b/c t = −0.92, dealer% t = +0.22, indirect%
  t = +0.15, 7s10s t = +0.53. **Nothing about December is different at this tenor.**
- **The one directionally consistent December fact, stated as the weak thing it is:** bid-to-cover runs
  **0.039 below** the same year's mean, **8 of 12** below, **t = −1.39** — not significant, and the
  calendar twin (2020, **−0.160**) is the largest miss of the twelve.
- **Settling on the last business day of the year is the December norm** — 8 of 12 December 7-Years
  settled on 12-31; the other 4 settled in January (2016, 2017, 2022, 2023), and the two groups'
  residuals differ by **t = 1.11**. The auction→settlement gap of **2 business days** is the modal one
  (92 of 152).
- **The model, quoted as a model and never as a constant:** **`7s10s(bp) = −1.894 + 0.090 × dealer%`**
  on the competitive base, n=152, slope **t = 7.83**, residual sd **1.244bp**. Fitted **−0.84bp** at
  2026's 11.72% mean dealer share. Reproduced this session to three decimals from an independent pull.
- **Grade the print on dealer takedown**, $44B era (n=31): min **4.06** · p25 **9.34** · median
  **11.64** · p75 **12.97** · max **19.26**. 2026's eight prints ran a remarkably tight
  **10.42–12.97%** (sd **1.03**, the tightest year in the record).
- **Bid-to-cover band, $44B era** (31 auctions, 2020-07-28 → 2026-08-27): min **2.40** · p25 **2.46** ·
  median **2.51** · p75 **2.63** · max **2.79**.
- **Percentages are on the competitive base** (indirect + direct + dealer), never `total_accepted` —
  SOMA add-ons ran **$4.55–6.59B** across 2026's eight auctions, 7–15% of the offering.
- **Size is $44B** — 31 consecutive auctions at that number; the December cell is set at the
  **2026-11-04** refunding.
- **Watch (dated)** — CPI **09-11** · FOMC **09-16** · predecessor 7Y **09-24** · CPI **10-14** ·
  7Y **10-29** · refunding **11-04** · 7Y **11-25** · 3Y/10Y/30Y refunding auctions **12-07/08/10** ·
  **this announcement 12-24** (a half day) · 2Y + 5Y **12-28** · **this auction 12-29** · FOMC minutes
  **12-30** · settlement **12-31** (a half day) · the control 7Y **2027-01-28**.

## Initial research

**The question, plainly:** the [11-25 sibling](treasury-7y-note-2026-11-25.md) filed this event as its own
successor, on the stated ground that its dealer-takedown model needs out-of-sample prints and 12-29 is the
second of them. It also handed forward two December-specific hooks it had not tested: the auction settles
on the **last business day of 2026**, and it is **bracketed by two SIFMA early closes** — its announcement
(12-24) and its settlement (12-31). So the honest first job was to ask what, if anything, is actually
different about the December slot, before a ledger asserts that a balance-sheet date changes an auction.

**One-line verdict:** the December slot has **one genuinely unusual structural feature and it is not the one
the proposal named** — a **two-business-day when-issued window**, the second in 152 auctions and an exact
repeat of **2020-12-29** — and tested against the model, **both** that compression and the year-end
balance-sheet story are **nulls**; December's 7-Year is an ordinary 7-Year graded on dealer takedown.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode. The
house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure below is computed this session
from two Treasury primaries fetched today: the Fiscal Data `auctions_query` dataset filtered on
`security_term` (**259 rows, zero reopenings**, of which **152** auction on or after 2014-01-01, pulled
with the full field set so `announcemt_date` is available — the field the 11-25 session did not use), and
the daily par yield curve CSVs for **2014–2026** (**3,172** close-to-close sessions, 2014-01-02 →
2026-09-08, thirteen files fetched individually). The 2Y and 5Y `auctions_query` series (202 and 172 rows
since 2014) were pulled for the corridor leg. Schedule provenance is the Tentative Auction Schedule PDF
(home.treasury.gov, HTTP 200, 17,195 bytes), decompressed stream-by-stream and re-read here as an
independent second pass after the proposal. **Business-day counts use Treasury's own par-curve calendar as
the trading calendar** — a rate is published on every business day, so no holiday table is assumed. VIX is
the **2026-09-08** close (15.72) from the same Yahoo daily endpoint `scripts/event-material-scan.mjs` uses.
This event was `never-assessed` and existed only as one sibling proposal, which was read in full before
`src/domain/market-events/treasury-7y-note-2026-12-29.json` was written this session. Each claim dated in
line.

### Conviction legs, tested

**1. The date and terms are right, and the entry stays `estimate` on purpose — SUPPORTED.** The tentative
schedule carries the row verbatim: `7-Year NOTE · Thursday, December 24, 2026 · Tuesday, December 29, 2026
· Thursday, December 31, 2026`. The flag column *is* populated in the same December block — `2-Year FRN R`,
`20-Year BOND R`, `5-Year TIPS R T` and `10-Year NOTE R` all sit within the same page — so the absence of
an `R` is a positive signal of a new issue, not a missing field; independently, every 7-Year in the record
is a new issue (259 rows, zero reopenings). The PDF's own holiday line reads `Holiday - Friday, December
25, 2026 - Christmas Day`, which is the displacement's proximate cause. The entry stays `estimate` for the
two reasons the proposal recorded and this session does not overturn — a tentative schedule is tentative by
construction, and this lane may not self-confirm an event it discovered in-sweep. The confirming primary is
the **2026-12-24** announcement.

**2. Size is $44B — SUPPORTED, inherited and corroborated.** `sb0590` (2026-08-05) publishes anticipated
coupon sizes through Oct-26 only, with the 7-Year column reading **44** in all six monthly rows; the
December cell arrives at the **2026-11-04** refunding. The dataset corroborates independently: **31
consecutive $44B 7-year auctions**, 2024-04-25 → 2026-08-27. This leg is carried from the
[10-29](treasury-7y-note-2026-10-29.md) and [11-25](treasury-7y-note-2026-11-25.md) siblings, which read
`sb0590` as text; this session did not re-fetch it and says so.

**3. THE STRUCTURAL FINDING — 2026-12-29 is an exact calendar twin of 2020-12-29, and that twin is the
only prior auction with this shape — SUPPORTED.** Late December 2026 and late December 2020 have identical
weekdays: **Dec 21 Mon · 22 Tue · 23 Wed · 24 Thu · 25 Fri · 28 Mon · 29 Tue · 30 Wed · 31 Thu** (Christmas
falls on a Friday in both years). Treasury schedules the block identically in both: announce Thursday
**12-24**, auction Tuesday **12-29**, settle Thursday **12-31**. Counting business days on Treasury's own
par-curve calendar, the **when-issued window** — announcement to auction — is therefore **2 business days**
(12-24 announce → 12-28 Mon → 12-29 Tue, with 12-25 a full closure). Across all 152 auctions since 2014:

| WI window (business days) | n | b/c | dealer % | 7s10s (bp) | model residual |
|---|---|---|---|---|---|
| 2 | **1** (2020-12-29) | 2.310 | 22.69 | +1.0 | +0.863 |
| 3 | 28 | 2.465 | 18.13 | −0.321 | −0.050 (t = −0.25) |
| 4 | 42 | 2.532 | 20.42 | −0.238 | −0.172 (t = −0.88) |
| 5 | **80** (modal) | 2.487 | 20.77 | +0.038 | +0.072 (t = 0.50) |
| 6 | 1 (2016-02-26) | 2.250 | 32.32 | +3.0 | +2.001 |

The window has never been shorter than 2 business days at this tenor, and 2020-12-29 is its only
occurrence. The corroborating detail: the **only two 7-Year auctions ever announced on December 24** are
2015-12-24 (→ 12-30, WI=3) and 2020-12-24 (→ 12-29, WI=2). 2026 will be the third and the second of the
WI=2 kind.

**4. COMPRESSION DOES NOT DEGRADE THE AUCTION — SUPPORTED as a null, which retires this event's most
plausible headline.** Grouping ≤3 business days (n=**29**) against ≥4 (n=**123**) and testing against the
[11-25 sibling's](treasury-7y-note-2026-11-25.md) model:

| Measure | ≤3bd (n=29) | ≥4bd (n=123) | t |
|---|---|---|---|
| model residual (bp) | **−0.019** | **+0.004** | **−0.10** |
| bid-to-cover | 2.460 | 2.501 | −1.42 |
| dealer share (%) | 18.29 | 20.75 | −1.55 |

The residual test is the load-bearing one and it is a flat zero. Both demand measures lean the *helpful*
way rather than the intuitive one — a shorter when-issued window comes with **lower** dealer takedown, not
higher — and neither reaches significance. The honest reading is that a compressed window is not visible in
this data at all. **The n=1 twin is reported and not leaned on:** 2020-12-29 printed b/c **2.31** (weak),
dealer share **22.69%**, 7s10s **+1.0bp** against a fitted **+0.14**, residual **+0.863** — an ordinary
auction on the model, on a **$59B** offering in a QE regime that has nothing to do with 2026's $44B. One
observation is a description, not evidence, and it is used here only to establish that the structure has
occurred before.

**5. THE YEAR-END BALANCE-SHEET STORY IS REFUTED, not left open — SUPPORTED.** The mechanistically obvious
December hypothesis is that dealers, shrinking balance sheets into a reporting date, bid worse and are left
holding more paper — which under leg 3's model would push 7s10s positive. It does not happen. Pairing each
December auction against its **own year's Jan–Nov mean** (which removes the entire dealer-share downtrend
that made the 11-25 session's correction necessary), n=12:

| Paired measure | mean | t | positive |
|---|---|---|---|
| dealer share (pts) | **+0.11** | **0.08** | 6/12 |
| bid-to-cover | −0.039 | −1.39 | 4/12 |
| model residual (bp) | +0.240 | 0.65 | 8/12 |

Dealer share in same-year standard-deviation units: **2014 +0.49 · 2015 +1.38 · 2016 −1.33 · 2017 +1.08 ·
2018 −0.84 · 2019 −0.78 · 2020 +0.15 · 2021 −0.08 · 2022 +0.63 · 2023 +1.09 · 2024 −0.96 · 2025 −0.32** —
mean **+0.042, t = 0.16**. Unpaired, December (n=12) against the other 140 agrees on every measure: b/c
2.458 vs 2.496 (t = −0.92), dealer 20.85% vs 20.23% (t = +0.22), indirect 62.76% vs 62.33% (t = +0.15),
7s10s +0.167 vs −0.100 (t = +0.53), residual +0.194 (t = 0.55). **The only measure that leans consistently
is bid-to-cover**, 8 of 12 below the year's mean at t = −1.39 — reported because it is the one directional
December fact in the scan, and reported as not significant.

**6. SETTLING ON THE LAST BUSINESS DAY OF THE YEAR IS THE DECEMBER NORM, NOT THIS AUCTION'S DISTINCTION —
SUPPORTED, and it is a correction to the proposal's framing.** The proposal filed 12-29 partly because "it
settles on the last business day of the year, which is a balance-sheet-date fact the November auction's
11-30 settlement is not." True, and unremarkable: **8 of 12** December 7-Years since 2014 settled on 12-31
(2014, 2015, 2018, 2019, 2020, 2021, 2024, 2025); the other **4** settled in early January (2016 → 01-03,
2017 → 01-02, 2022 → 01-03, 2023 → 01-02). Their model residuals are **+0.446** (in-year, n=8) vs
**−0.309** (next-year, n=4), **t = 1.11** — a null on n=12, and the sign is the *opposite* of a year-end
concession story. The auction-to-settlement gap of **2 business days** is likewise the modal one (92 of
152). What is genuinely distinct about 12-29 is the *front* of the schedule (leg 3), not the back.

**7. The corridor is compressed onto two sessions, and two of its coupon legs were untracked —
SUPPORTED.** **22** tracked entries sit within five days of 2026-12-29 (against 26 for the 11-25 sibling and
14 for 10-29), but the shape matters more than the count: **the entire December month-end coupon block is
squeezed onto two sessions**. The schedule reads `2-Year NOTE · Thursday, December 24 · Monday, December
28`, `5-Year NOTE · Thursday, December 24 · Monday, December 28` and this 7-Year on Tuesday 12-29 — **all
three announced together on Christmas Eve and all three settling 12-31**. A 2Y and 5Y sharing one auction
date is ordinary overall (**53** of the months since 2014) but rare in December: **2020-12-28 is the only
other one**, which is the calendar twin again. Neither 12-28 auction was tracked before this session; both
are proposed in this PR as files this event owns. Same date as the auction: `consumer-confidence-2026-12-29`
and `fhfa-hpi-2026-12-29`, both `low` — a far thinner stack than 11-25's five-release pile-up. The nearest
macro item of consequence is **`fomc-minutes-2026-12-30`**, the day *after*, which is a reason to read
12-30's tape as minutes rather than as auction digestion.

**8. Adjacency sweep — two dated events proposed, and the third candidate was already taken.** Inside the
corridor: **`treasury-2y-note-2026-12-28`** and **`treasury-5y-note-2026-12-28`** (leg 7), neither tracked
before this session, both proposed in this PR as files this event owns. The obvious out-of-corridor
candidate was this event's own successor **`treasury-7y-note-2027-01-28`** — the **control observation**,
because in the schedule's Aug-2026→Jan-2027 window the 7-Year auctions on a Thursday with a full
5-business-day window in four of six months (08-27, 09-24, 10-29, 2027-01-28) while November is displaced
to Wednesday by Thanksgiving with a 4-day window and December to Tuesday by year-end with a 2-day window,
so 2027-01-28 is the first ordinary calendar after both and the third out-of-sample print for the model.
**It was already proposed today** by a sibling lane, `proposals/treasury-7y-note-2027-01-28.from-treasury-
coupon-announcement-2027-01-21.json`, whose provenance is strictly better (its proposer is the announcement
that sizes it) and which caught a fact this sweep had not: 2027-01-28 is the first coupon auction *after*
the 2027-01-26/27 FOMC. This session filed no competing copy — the control-observation reasoning is
recorded here instead, where the 12-29 close-out will find it. The remaining December coupon legs (5Y TIPS
12-22, 2Y FRN and 20Y bond 12-23) fall **6–7 days** before 12-29, outside the corridor, and are recorded
here rather than proposed.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house answer for
this event kind. The usable output is a **reading instruction** for the session that pulls this ledger on
2026-12-29: this is an ordinary 7-year auction whose only unusual feature is a two-day when-issued window
that does not measure, on a date whose own macro stack is two `low` prints; expect roughly **−0.8bp** of
7s10s conditional on a dealer takedown near 11–12%, grade the print on takedown, and do not narrate the
turn of the year into it.

**Honest limits.** The when-issued result rests on a **coarse grouping** (≤3 vs ≥4 business days) because
the exact structure being asked about has **n = 1**; a null at n=29 for the group and n=1 for the cell is a
failure to detect, not a demonstration of absence, and the twin itself sits in a $59B QE-era regime with
little in common with 2026 beyond the calendar. The December scan is **n = 12** — one observation per year
by construction, which is the ceiling this question has — and the paired test, while it removes the
dealer-share trend, cannot remove a year-specific December shock. This is a **daily close-to-close**
measurement on a fitted CMT par curve **rounded to 1bp**; 33 of 152 auction-day observations are literally
zero, which is what that rounding looks like. The dealer-share model is inherited from the
[11-25 sibling](treasury-7y-note-2026-11-25.md) and this session **reproduces rather than re-validates**
it — its limits are that document's and travel with it, including that dealer share prints *with* the
auction, so the model is explanatory, not predictive. **No multiple-comparison correction** is applied to a
scan that ran roughly a dozen December and window comparisons; the two that are pre-registered below are
the two that were specified before the numbers were read, and the bid-to-cover lean in leg 5 was not. This
auction's own size, CUSIP, when-issued level and demand **do not exist yet** — the announcement is
2026-12-24 and the size cell is set at the 2026-11-04 refunding. `symbols: []`, `medium` impact, date
`estimate`: nothing here licenses a position in any name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and this session's contribution is
**two nulls on the two stories this event could have been filed on, plus the one structural fact that is
real**. The real fact: 2026-12-29 is an **exact calendar twin of 2020-12-29** — identical late-December
weekdays, identical Treasury block (announce 12-24 · auction 12-29 · settle 12-31) — and therefore the
**second 7-Year in 152 with a two-business-day when-issued window**, against a modal five. The first null:
**compression does not degrade the auction**. Across the ≤3-business-day group (n=29) the model residual is
**−0.019bp** against **+0.004bp** for the other 123, **t = −0.10**; bid-to-cover **2.460 vs 2.501**
(t = −1.42) and dealer share **18.29% vs 20.75%** (t = −1.55) both lean the helpful way and neither is
significant. The second null: **the year-end balance-sheet story does not appear**. Paired against each
year's own Jan–Nov mean, the December 7-Year takes **+0.11 percentage points** more dealer share
(**t = 0.08**, 6/12 positive, mean **+0.04** same-year sd), with residual **+0.240bp (t = 0.65)** and
bid-to-cover **−0.039 (t = −1.39)** — the last of which is the only directionally consistent December fact
in the scan and is not significant. A third framing from the proposal is **corrected**: settling on the
last business day of the year is the **December norm** (8 of 12), not this auction's distinction, and the
in-year/next-year residual difference is **t = 1.11**. What carries forward unchanged is the
[11-25 sibling's](treasury-7y-note-2026-11-25.md) model **`7s10s = −1.894 + 0.090 × dealer%`** (slope
t = 7.83, residual sd 1.244bp, n=152), reproduced here **to three decimals** from an independent pull —
12-29 is its **second out-of-sample print**, and it must be quoted as a model, never as a constant. On the
day itself, grade the print on **dealer takedown** ($44B era p25 **9.34** / median **11.64** / p75
**12.97**; 2026's eight prints ran a very tight **10.42–12.97%**, sd **1.03**) and read the corridor
honestly: the stack sharing 12-29 is two `low` prints, and the nearest consequential macro item is the
**12-30 FOMC minutes**, the day after. Size **$44B**, subject to the 2026-11-04 refunding. Nothing here is
directional and no house playbook applies.

**Kill switches (what would change this stance):**

- **The core one — 2026-12-29 taking dealer share more than 3 percentage points (≈ +1 same-year sd) above
  2026's Jan–Nov mean.** That is the year-end balance-sheet story finally appearing, and it would reinstate
  the framing leg 5 refutes. Registered as **FT-treasury-7y-note-2026-12-29-1** in
  [`forward-tests/treasury-7y-note-2026-12-29.md`](../forward-tests/treasury-7y-note-2026-12-29.md), score
  by **2026-12-31**, null pass rate stated up front at **75%** (9 of 12 Decembers).
- **Bid-to-cover landing more than 0.05 below 2026's Jan–Nov mean** — the compressed-window story appearing
  in demand rather than in price. Registered as **FT-treasury-7y-note-2026-12-29-2**, and it is the
  **stronger of the two tests**: its null pass rate is a genuine coin flip (**6 of 12**, 50%), and the
  calendar twin **2020 is itself a fail** (−0.160).
- **The model failing out of sample — 7s10s more than 2bp off fitted on 09-24, 10-29 or 11-25.** Only
  **9.9%** of the 152-auction history misses by that much; consecutive misses would say the slope is a
  within-sample artifact and would strip the yardstick both nulls above were measured against, leaving this
  lane with neither the 10-29 constant nor the 11-25 replacement.
- **A size change at the 2026-11-04 refunding or the 2026-12-24 announcement.** $44B is 31 consecutive
  auctions of precedent; any deviation breaks the like-for-like series, voids the bid-to-cover band and the
  dealer-share quantiles, and must be logged off-cadence.
- **Dealer takedown printing outside 4.06–19.26%** (the $44B era's full range) on 09-24, 10-29, 11-25 or
  12-29 — the variable the model is keyed to moving outside its observed support, which would put every
  fitted value in this doc into extrapolation. Note the tighter live band: 2026's own eight prints span
  only **10.42–12.97%**.
- **The auction moving off 2026-12-29 at the 12-24 announcement, or Christmas Day's closure changing** —
  the twin framing and the 2-business-day window are both leg 3, and without them this reverts to an
  ordinary month-end belly sale graded on the dealer model alone.
- **A published explanation for the WI=6 outlier 2016-02-26** — already the unexplained member of the
  11-25 sibling's early-close set, and here also the largest positive residual in the window table
  (+2.001bp); whatever explains it may be a category both documents have mis-pooled.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution rather
  than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-111 | Initial research banked (doc above); canonical `src/domain/market-events/treasury-7y-note-2026-12-29.json` written this session after reading the single prior proposal (`.from-treasury-7y-note-2026-11-25`), now shadowed and inert; `probe-ref` populated with real readings so the first `interval-elapsed` pulse is screenable. **Event tape (primary).** Terms verified independently from home.treasury.gov's Tentative-Auction-Schedule.pdf (HTTP 200, 17,195 bytes, text layer decompressed today): announce **Thu 2026-12-24**, auction **Tue 2026-12-29**, settle **Thu 2026-12-31**, no `R` → new issue (the flag column IS populated nearby — `2-Year FRN R`, `20-Year BOND R`, `5-Year TIPS R T` — so the blank is a signal); the PDF's holiday line reads `Holiday - Friday, December 25, 2026 - Christmas Day`. Entry stays **`estimate`** on the proposal's stated grounds. Size **$44B** carried from `sb0590` via the [10-29](treasury-7y-note-2026-10-29.md) and [11-25](treasury-7y-note-2026-11-25.md) ledgers (not re-fetched today, said so), corroborated by **31 consecutive $44B 7Ys** in today's pull. **THE STRUCTURAL FINDING — 2026-12-29 is an EXACT CALENDAR TWIN of 2020-12-29.** Late Dec 2026 and late Dec 2020 have identical weekdays (24 Thu · 25 Fri holiday · 28 Mon · 29 Tue · 31 Thu) and Treasury schedules the block identically. Counting business days on Treasury's own par-curve calendar, the **when-issued window is 2 business days** — and **2020-12-29 is the ONLY prior 7-Year with a 2-day window** in 152 since 2014 (WI distribution: 5bd n=80 · 4bd n=42 · 3bd n=28 · 2bd n=1 · 6bd n=1). The only two 7Ys ever announced on Dec 24 are 2015-12-24 (WI=3) and 2020-12-24 (WI=2). This used `announcemt_date`, a field the 11-25 session did not pull. **FIRST NULL — compression does not degrade the auction.** ≤3bd (n=29) vs ≥4bd (n=123) against the 11-25 model: residual **−0.019 vs +0.004bp, t = −0.10**; b/c **2.460 vs 2.501, t = −1.42**; dealer share **18.29% vs 20.75%, t = −1.55** — both demand measures lean the HELPFUL way (shorter window, *less* dealer takedown) and neither is significant. The n=1 twin printed b/c 2.31, dealer 22.69%, 7s10s +1.0 vs fitted +0.14 (resid +0.863) on a **$59B** QE-era offering — reported, not leaned on. **SECOND NULL — the year-end balance-sheet story is REFUTED.** Paired against each year's own Jan–Nov mean (which removes the dealer-share downtrend the 11-25 correction was about), n=12: dealer share **+0.11pt, t = 0.08** (6/12 positive; in same-year sd units mean **+0.042, t = 0.16**), residual **+0.240bp, t = 0.65** (7/12), b/c **−0.039, t = −1.39** (8/12 below). Unpaired vs the other 140: b/c t = −0.92, dealer t = +0.22, indirect t = +0.15, 7s10s t = +0.53. The b/c lean is the only directionally consistent December fact and it is not significant. **CORRECTION to the proposal's framing** — settling on the last business day of the year is the **December NORM (8 of 12)**, not this auction's distinction; the other 4 settled in January and the residual difference is **t = 1.11**, sign opposite to a concession story. The 2-business-day auction→settlement gap is the modal one (92/152). **Model reproduced, not re-derived:** `7s10s = −1.894 + 0.090 × dealer%`, slope **t = 7.83**, residual sd **1.244bp**, n=152 — identical to three decimals on an independent pull, which validates this pipeline against the 11-25 session's. 2023+ window −0.955 (t = −5.04), pooled −0.079 (t = −0.66), unchanged. 2026's eight residuals mean **+0.470, t = 1.26** — no out-of-sample failure yet. **Macro.** Par curve 2026-09-08: 2Y **4.39**, 3Y 4.44, 5Y **4.57**, 7Y **4.68**, 10Y **4.80**, 20Y 5.26, 30Y **5.25**; 2s10s **41bp**, **7s10s −12bp**. Since the 08-27 auction: 2Y +19, 5Y +19, **7Y +16**, 10Y +13, 30Y +6 — front-end-led. **Volatility:** VIX **15.72** (2026-09-08 close) vs the 14.43 2026 low of 08-28 — quiet. **Peers:** `symbols: []`, none applicable. **Geopolitical:** nothing new touching this tenor; note `china-retaliation-suspension-expiry-2026-12-31` sits two days after the auction and is a settlement-day, not an auction-day, item. **Corridor — 22 tracked entries within five days, but the SHAPE is the finding: the whole December month-end coupon block is compressed onto TWO sessions.** 2Y and 5Y both auction **Mon 12-28**, this 7Y **Tue 12-29**, all three announced together on Christmas Eve and all three settling 12-31. A 2Y/5Y shared date is ordinary overall (53 months since 2014) but **2020-12-28 is the only other December one** — the twin again. Sharing 12-29 itself: only `consumer-confidence-2026-12-29` and `fhfa-hpi-2026-12-29`, both `low`; the nearest consequential macro item is **`fomc-minutes-2026-12-30`**, the day AFTER. **Adjacency sweep — two dated events proposed, both previously untracked, both files this event owns:** `treasury-2y-note-2026-12-28` and `treasury-5y-note-2026-12-28`, inside the corridor. The out-of-corridor candidate — this event's successor `treasury-7y-note-2027-01-28`, the **CONTROL** observation (first undisplaced Thursday 7Y with a full 5-day window after two consecutive displaced months, and the third out-of-sample print for the model) — **was already proposed today by a sibling lane** with strictly better provenance (`.from-treasury-coupon-announcement-2027-01-21`, the announcement that sizes it, which also caught that it is the first coupon auction after the 2027-01-26/27 FOMC); no competing copy filed, reasoning recorded in leg 8 instead. The remaining December coupon legs (5Y TIPS 12-22, 2Y FRN and 20Y bond 12-23) fall 6–7 days out, outside the corridor, recorded not proposed. **Forward tests registered: FT-treasury-7y-note-2026-12-29-1** (dealer share will not exceed 2026's Jan–Nov mean by >3pt ≈ +1 same-year sd; null pass **75%**, 9/12) and **FT-treasury-7y-note-2026-12-29-2** (b/c will not land >0.05 below 2026's Jan–Nov mean; null pass **50%**, 6/12 — a genuine coin flip, and the calendar twin 2020 is itself a fail at −0.160). | — (stance set; the proposal's year-end-balance-sheet and last-business-day framings are both retired, replaced by the when-issued-compression structure, which itself measures as a null) | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-7y-note-2026-12-29.json` (`status: "estimate"`)
in the same PR — this event's own file, never another lane's canonical one. Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc goes
quiet.
