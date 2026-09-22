# 5-Year TIPS auction (December reopening, terminal sale of the October CUSIP) — treasury-5y-tips-2026-12-22

**Kind:** rates · **Date:** 2026-12-22 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer inflated direct 2026-09-09 — `5-Year TIPS R T` announce 12-17, auction **Tuesday** 12-22, settle 12-31; the 1:00pm ET close is inferred, not printed on the schedule) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.48,"daysBand":"medium:31+","adjacentIds":["boe-decision-2026-12-17","ecb-decision-2026-12-17","housing-starts-2026-12-17","import-export-prices-2026-12-17","pending-home-sales-2026-12-17","philly-fed-mfg-2026-12-17","puct-batch-zero-report-open-meeting-2026-12-17","treasury-coupon-announcement-2026-12-17","boj-decision-2026-12-18","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","opex-2026-12-18","sp-quarterly-rebalance-effective-2026-12-21","consumer-confidence-2026-12-22","boj-minutes-2026-12-23","durable-goods-2026-12-23","gdp-q3-2026-third-2026-12-23","new-home-sales-2026-12-23","pce-2026-12-23","treasury-20y-bond-2026-12-23","treasury-2y-frn-2026-12-23","christmas-eve-half-day-2026-12-24","treasury-coupon-announcement-2026-12-24","christmas-market-closure-2026-12-25","japan-cpi-tokyo-flash-2026-12-25"],"screenStreak":0,"blocked":[{"url":"https://stooq.com/q/d/l/?s=%5Evix&i=d","status":"JS_CHALLENGE","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Indirect bidders skip this auction, every year, and bid-to-cover never shows it.** Measured
this session from Treasury's own auction record: in each of the seven years since the modern 5-Year TIPS
cycle began in 2019, the **December** reopening drew a lower indirect share than the **June** reopening of
the same year — **7 of 7, mean −13.12 points, t = −3.89** — while bid-to-cover moved **−0.07 (t = −0.87)**,
i.e. nothing. The shortfall is absorbed by dealers (+6.65) and directs (+6.47), neither significant alone;
the reliable statistic is **indirect share**. It is not a December effect in Treasuries generally: over the
identical seven Decembers the nominal **5-Year note prints +1.70 (t = 0.78)**, the 7-Year −0.56, the 2-Year
−6.18 and the 10-Year −1.09 — all null. **What causes it is NOT settled, and this doc says so rather than
guessing.** The October-*dated* new issue also runs low (−5.30, t = −1.44), the difference-in-differences
that would separate date from security is **−7.82 with t = −1.41 at n = 7**, and the obvious mechanism —
every December reopening since 2011 settles on the **last business day of the year, 15/15** — is **refuted**
by the one within-CUSIP test available: pre-2019, when August and December reopened the *same* April CUSIP,
December's indirect share ran **higher, +6.92, 7/8, t = +2.85**. The usable output is a **grading rule**, not
a position: score 12-22 on indirect share against the **December** band, never June's and never a pooled one.
Separately, the [October sibling's](treasury-5y-tips-2026-10-22.md) breakeven knot artifact **does not fire
here** — 7 of 7 modern December reopenings landed inside ±3bp — and that sibling's control number is amended
below. Size reads **$24B**. `symbols: []`, date `estimate`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-104) | **Stand aside** | High | `symbols: []`, the date is `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. This auction's CUSIP does not exist until the **2026-10-22** new issue creates it, and its size and terms not until the **2026-12-17** announcement. | Treasury revising the 12-17 / 12-22 / 12-31 schedule row **before 2026-12-17** — that changes the event's shape, not its stance |
| This week | **Stand aside — and stop pricing this print off the June reopening's book** | High | The two reopenings of a year are not one population. December's indirect share came in below June's in **7 of 7** years since 2019, mean **−13.12pt (t = −3.89)**, so a June-anchored or pooled band marks an ordinary December print ~13 points "weak" before anyone reads the tape. | Any 5Y TIPS **December** reopening printing indirect share **above its own June sibling's** — one exception makes the 7/7 a 7/8 and the paired t drops below 3 |
| This month | **Watch 2026-10-22 for the two numbers this auction inherits, not for anything about this auction** | Medium-high | The October new issue stamps the CUSIP and the size this reopening re-taps. Reopenings print exactly **$2B** below their own new issue in **31 of 31** scheduled cases since 2011-08 (**15/15** on the December leg), so `sb0590`'s $26B reads **$24B** here. | A **2026-10-22 size other than $26B**, or an October print that is marked `RT` rather than `T` — either voids the like-for-like December band and the $24B arithmetic together |
| This quarter | **Read 12-22 on indirect share; expect the knot artifact to be ABSENT and the breakeven to be readable that day** | Medium | Independently re-derived here from 3,422 paired curve sessions: modern December reopenings move the 5Y-minus-10Y breakeven **+0.43bp (t = 0.66), every one inside ±3bp**, against **+11.00bp (t = 14.55, 7/7)** at October new issues. A reopening does not swap the security under Treasury's 5-year knot. | A **2026-12-22** 5-year-minus-10-year breakeven change of **≥ +5bp** — the knot mechanism would then not be new-issue-only and the October sibling's whole leg 3 needs rebuilding. Registered as **FT-treasury-5y-tips-2026-12-22-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, no house playbook is rates-keyed.
  Zero capital is at stake in anything below; this is a reading-and-grading document.
- **The yardstick, stated once so it is not re-derived:** grade this print on **indirect share**, not
  bid-to-cover. Cover is blind to the one thing that reliably differs about this date (−0.07, t = −0.87).
- **The December band (2019+, n = 7, competitive base):** indirect min **51.4** · p25 **64.2** · med
  **71.2** · p75 **74.1** · max **75.7**. Dealer min 5.4 · p25 8.1 · med 13.1 · p75 25.4 · max 27.1.
  Bid-to-cover min 2.10 · med 2.55 · max 2.86. **June's dealer band is a different animal** — p25 3.9,
  med 6.6, p75 6.8 — which is exactly why pooling them mis-grades both.
- **The paired benchmark, which is sharper than any band:** the **2026-06-18** reopening printed indirect
  **68.59%**. The 7/7 rule says 12-22 comes in below it; the paired mean says ≈ **55.5%**. Registered as
  **FT-treasury-5y-tips-2026-12-22-1**.
- **Percentages are on the competitive base** (dealer + indirect + direct), never `total_accepted` — SOMA
  add-ons ran **$0.0–2.6B** across the modern December series and would otherwise distort every share.
- **What this doc does NOT claim:** that the year-end settlement causes it. That story is refuted below,
  and ~40% of the effect may be the October-*dated* security rather than the December date.
- **Size: $24B**, on 31/31 and 15/15 — stated, not registered. The live uncertainty is upstream at the
  2026-10-22 new issue's $26B, already owned by
  [`FT-treasury-coupon-announcement-2026-10-15-1`](../forward-tests/treasury-coupon-announcement-2026-10-15.md).
- **The session runs 1:00 p.m. ET**, inferred and corroborated twice: **53 of 59** 5-Year TIPS auctions
  since 2009 closed at 1:00 p.m., and the 12-22 slate puts **two bills** in the 11:30 a.m. window while the
  afternoon window is uncontested (the 20Y bond and 2Y FRN auction 12-23). The named exception is
  **2013-12-19**, this same slot, moved to 11:30 a.m. when a 7-Year note took the afternoon.
- **It is a Tuesday and the when-issued window is short.** 13 of 15 prior December reopenings were
  Thursdays on a 5-business-day window; this one runs **3 business days** (announce Thu 12-17 → auction Tue
  12-22), matched only by **2020-12-22**. That single precedent printed the modern series' *highest* dealer
  takedown (27.1%) and its *second-smallest* indirect shortfall — n = 1, pointing both ways, lean on neither.
- **Watch (dated)** — FOMC **12-09** · CPI **12-10** · the announcement that confirms this event **12-17**
  (proposed as its own row in this PR) · ECB **12-17** · BoJ **12-18** · December opex **12-18** · **this
  auction 12-22** · PCE, the 20Y bond and the 2Y FRN **12-23** · half day **12-24** · settlement **12-31**.

## Initial research

**The question, plainly:** the [October sibling](treasury-5y-tips-2026-10-22.md) established what a 5-Year
TIPS *new issue* does to Treasury's published curve, and named this December reopening as its own natural
successor because it re-taps the very CUSIP October creates. So: is this auction merely the October event
minus its artifact, or does the December slot carry something of its own?

**One-line verdict:** it carries something of its own, and it is in the demand data rather than the curve —
the December reopening is the auction indirect bidders systematically skip, seven years running, in a
statistic bid-to-cover cannot see; what this doc could *not* establish is why, and the most attractive
explanation is refuted below rather than asserted.

**Method:** sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode — the
house instruments are symbol-keyed and this event has `symbols: []`, so no `earnings-cycle` /
`intraday-edges` run applies and no cache bust was required. Every figure is computed this session from
Treasury primaries fetched today: the Fiscal Data `auctions_query` dataset (`inflation_index_security: Yes`,
**206 records** back to 2009, of which **59 are 5-Year TIPS**; plus **all nominal Notes since 2018-06** for
the control), and the daily **par yield curve** and **par real yield curve** CSVs for 2013–2026 (**3,422
sessions carrying both**, 2013-01-02 → 2026-09-08). Schedule provenance is the Tentative Auction Schedule
PDF (HTTP 200, 17,195 bytes, text layer inflated stream-by-stream and re-tokenised into 909 tokens). VIX is
the Yahoo chart endpoint `scripts/research/market-data.mjs` already uses; stooq's CSV endpoint returned a
JavaScript challenge rather than data and is recorded in `probe-ref.blocked`. Bidder percentages are on the
**competitive base** (primary dealer + indirect + direct) throughout. Each claim dated in line.

### Conviction legs, tested

**1. The row, the marker and the calendar are right, and the entry stays `estimate` on purpose —
SUPPORTED.** The schedule carries it verbatim: `5-Year TIPS R T · Thursday, December 17, 2026 · Tuesday,
December 22, 2026 · Thursday, December 31, 2026`, with the page's own legend reading `T --denotes TIPS` and
`R --denotes reopening`. **R present** makes this a reopening of the 2026-10-22 new issue, which is the whole
reason leg 5 predicts the *absence* of the October sibling's artifact. The **canonical file was written by
this session**: the id existed only as `proposals/treasury-5y-tips-2026-12-22.from-treasury-2y-frn-2026-12-23.json`,
read in full first per EVENT-RESEARCH.md, and its base rates re-derived from a wider pull rather than
inherited. The entry stays `estimate` on the two standing limits — a tentative schedule is tentative, and
this lane may not self-confirm an event it discovered in-sweep. The confirming primary is the **2026-12-17**
announcement, which this PR proposes as its own calendar row.

**2. THE FINDING — the December reopening is the auction indirect bidders skip, 7 of 7, and bid-to-cover
records none of it.** Within each year 2019–2025 the 5-Year TIPS complex sells four times: an April new
issue reopened in June, and an October new issue reopened in December. Comparing the two *reopenings* of the
same year — same tenor, same leg position, same two-month seasoning, one market year:

| Year | June reopening indirect % | December reopening indirect % | Dec − Jun |
|---|---|---|---|
| 2019 | 75.73 | 55.09 | **−20.64** |
| 2020 | 70.27 | 64.20 | **−6.07** |
| 2021 | 87.32 | 71.19 | **−16.13** |
| 2022 | 83.89 | 74.07 | **−9.83** |
| 2023 | 85.10 | 75.66 | **−9.44** |
| 2024 | 79.14 | 51.43 | **−27.71** |
| 2025 | 74.62 | 72.63 | **−2.00** |
| **Paired** | | | **−13.12, sd 8.91, t = −3.89, 7/7 negative** |

Under a coin flip 7/7 in one direction is **1 in 128**. The shortfall goes to dealers (**+6.65**, t = 2.00,
5/7) and directs (**+6.47**, t = 2.14, 6/7) — neither leg significant on its own, which is the point:
**indirect share is the statistic that carries the signal, and end-user share (indirect + direct) is
−6.65**. Bid-to-cover over the same pairs is **−0.07 (t = −0.87)**, so the standard "was it a good auction"
number is blind to it.

**3. It is TIPS-specific, not a December calendar effect — the nominal control is empty at every tenor
tested.** Running the identical within-year December-minus-June design on nominal notes over the same seven
years (Fiscal Data, `Note`, inflation-indexed excluded):

| Population | n | Mean Δ indirect % | t | Negative |
|---|---|---|---|---|
| **5-Year TIPS reopening** | 7 | **−13.12** | **−3.89** | **7/7** |
| 5-Year nominal note | 7 | +1.70 | +0.78 | 3/7 |
| 7-Year nominal note | 7 | −0.56 | −0.13 | 4/7 |
| 2-Year nominal note | 7 | −6.18 | −0.79 | 5/7 |
| 10-Year nominal note | 7 | −1.09 | −0.55 | 4/7 |

Nothing in the nominal complex reaches even 5/7 in a consistent direction with a usable t. Whatever this is,
it belongs to the inflation-linked security, not to the month.

**4. The attribution FAILS its decisive test, and is reported as failed rather than smoothed over.** The
December reopening differs from the June one in two ways at once — it is auctioned in December, *and* it
re-taps an **October-dated** security rather than an April-dated one. The clean separator is a
difference-in-differences: the new-issue leg (October NI minus April NI) isolates the security's dating,
since both are new issues at symmetric points in the cycle.

| Contrast | What it isolates | n | Mean | t | Direction |
|---|---|---|---|---|---|
| **A. Dec reopening − Jun reopening** | the combined effect | 7 | **−13.12** | **−3.89** | **7/7** |
| **B. Oct new issue − Apr new issue** | the October-dated security alone | 7 | −5.30 | −1.44 | 5/7 |
| **C. A − B** | the December-date-specific increment | 7 | −7.82 | −1.41 | 4/7 |

Row B is the same sign and about **40%** of the headline; row C, the number that would prove the December
*date* is doing the work, is **not significant and only 4/7 in direction**. At n = 7 this design cannot
separate them. So the regularity in leg 2 is solid and its cause is not: some of it is the October-dated
CUSIP, some is the December session, and this session's data cannot say how much.

**5. The obvious mechanism is REFUTED by the one controlled test available.** Every December 5-Year TIPS
reopening since 2011 settles on the **last business day of the calendar year — 15 of 15** (12-29, 12-30 or
12-31, whichever the calendar makes last), which invites the standard year-end-turn story: a buyer taking
down a new position across the turn faces balance-sheet cost and demands a concession, so end users step
back and dealers absorb. That story makes a testable prediction, and the pre-2019 cycle tests it exactly:
back then a single April new issue was reopened **twice**, in August and December, so the two reopenings
share a CUSIP, a leg population and a dated month, and differ chiefly in whether settlement crosses the
year-end.

| Pre-2019 within-CUSIP, Dec reopening − Aug reopening | n | Mean | t | Direction |
|---|---|---|---|---|
| Indirect % | 8 | **+6.92** | **+2.85** | **7/8 POSITIVE** |
| Dealer % | 8 | −6.24 | −2.62 | 6/8 negative |
| Bid-to-cover | 8 | +0.11 | +0.92 | — |

The sign is **backwards**: in the one era where the same security was sold both across the year-end turn and
away from it, the year-end sale drew **more** indirect demand, not less, and dealers took **less**. The
year-end-settlement mechanism does not survive its own best test and is not claimed here. (Honest caveat in
the other direction: August and December differ in **seasoning** too — 4 months versus 8 — so the pre-2019
contrast is not a pure settlement test either. The correct reading is that neither era's design identifies a
mechanism, and only leg 2's regularity is established.)

**6. The October sibling's knot artifact is ABSENT here — negative control, independently re-derived — and
its recorded control numbers are amended.** Treasury's par real yield curve reads its 5-year point off "the
most recently auctioned TIPS" (primary, quoted verbatim in the
[October ledger](treasury-5y-tips-2026-10-22.md)), so a *new issue* swaps the security under the knot and a
*reopening* does not. Recomputed this session over 3,422 paired sessions rather than inherited, on the
5-year-minus-10-year breakeven change, close-to-close:

| Population | n | Mean rel. breakeven | t | Individual prints |
|---|---|---|---|---|
| **October new issue, 2019+** | 7 | **+11.00bp** | **+14.55** | +15, +10, +10, +10, +12, +11, +9 |
| April new issue, 2019+ | 8 | −5.38bp | −3.56 | — |
| **December reopening, 2019+** | 7 | **+0.43bp** | **+0.66** | **−1, +3, −2, +1, +2, 0, 0** |
| June reopening, 2019+ | 8 | 0.00bp | 0.00 | — |
| Control, non-TIPS-auction sessions | 3,256 | −0.04bp | −0.96 | sd 2.17bp |

The October and April new-issue rows **reproduce the sibling exactly** (+11.00 / t = 14.55 and −5.38 /
t = −3.56 against its recorded +11.0 / t = 14.55 and −5.4 / t = −3.56), which is this pipeline's own
cross-check. **Two amendments, both recorded rather than quietly adopted.** First, the sibling records the
December control as **−0.71bp (t = −1.00, n = 7)**; this session's independent re-derivation of the same
population gets **+0.43bp (t = 0.66)** — its June figure reproduces to the digit (0.00, t = 0.00, n = 8), so
the disagreement is confined to the December leg. Both are statistically indistinguishable from zero and
neither moves any conclusion; the discrepancy is left **unreconciled and on the record** rather than
resolved by assertion. Second, and more materially: **the "reopenings show nothing" reading is true of the
modern era and NOT of the pooled history.** Pooled back to 2013 the December leg reads **+2.23bp (t = 1.95,
n = 13)**, because **3 of the 13** prints — 2013 (+10bp), 2016 (+8bp), 2017 (+9bp) — are at or past the
+8bp level only **0.49%** of control sessions reach. All three sit in the pre-2019 cycle. Anyone quoting a
pooled December reopening base rate is quoting two different auction types; the clean claim is the modern
one, **7/7 inside ±3bp**.

**7. The 2019 cycle change is why pooled base rates on this slot mix two animals — SUPPORTED, mechanically.**
Reading every 5-Year TIPS CUSIP's full auction history: from 2011 to 2018 each April new issue was reopened
**twice** (August and December); from 2019 the series runs **two** new issues a year (April and October),
each reopened **exactly once** (June and December). So the December auction changed from *the second
reopening of an 8-month-seasoned April CUSIP* to *the sole reopening of a 2-month-old October CUSIP*, and
the June reopening did not exist before 2019. Two facts survive the change intact: December is the CUSIP's
**terminal sale** in both eras, and it settles on the year's last business day in both. Two more facts,
verified this session and specific to 2026: **2026-12-22 is the last TIPS auction of the year** — the
schedule's next TIPS row is `10-Year TIPS T`, a new issue, auctioned 2027-01-21 — and the **size rule** is
tighter than any sibling records. Reopenings print exactly **$2B** below their own CUSIP's new issue in
**31 of 31** scheduled cases since 2011-08 and **15 of 15** on the December leg; the only two non-$2B rows
in the whole record are 2009 and 2010 at −$1B, before the rule settled, and the $25M off-cycle add-on of
2020-07-10 that the [10-15 announcement ledger](treasury-coupon-announcement-2026-10-15.md) already
discloses. Against `sb0590`'s **$26B** for 2026-10-22 that reads **$24B** — the same arithmetic 2025 ran
($26B → $24B) and 2026's April/June leg ran ($26B → $24B).

**8. The session is displaced and its when-issued window is the second-shortest ever on this slot —
SUPPORTED, and its consequence is honestly nil.** 13 of the 15 December reopenings since 2011 were
**Thursdays** announced the prior Thursday, a **5-business-day** when-issued window. 2026 auctions on a
**Tuesday** on a **3-business-day** window, because the Thursday of that week is Christmas Eve (a half day,
tracked as `christmas-eve-half-day-2026-12-24`) and Christmas Day is the Friday. The only precedent is
**2020-12-22**, also 3 business days, also a Christmas-Friday year; **2021-12-22** ran 4. What the precedent
says: 2020 printed the modern series' **highest** dealer takedown (27.11%) and its **second-smallest**
indirect shortfall (−6.07). **n = 1, pointing in two directions at once — it is named here so the next
session does not rediscover it and mistake it for evidence.** On the clock, the schedule prints no time; the
1:00 p.m. inference is corroborated by **53 of 59** 5-Year TIPS auctions closing 1:00 p.m. and by applying
the [FRN sibling's](treasury-2y-frn-2026-12-23.md) window-capacity rule — two bills sit in the 11:30 a.m.
window on 12-22 while the afternoon window is uncontested, since the 20-Year bond and the 2-Year FRN auction
12-23. The one 5-Year TIPS ever moved to 11:30 a.m. on this slot, **2013-12-19**, shared its session with a
7-Year note that took the afternoon — so the afternoon window has capacity limits too, which extends the FRN
sibling's finding rather than contradicting it.

**9. The corridor is dense, carries no Fed input, and holds exactly one untracked dated event —
SUPPORTED.** Twenty-four tracked entries sit within five days of 2026-12-22 (counting proposals the loader
stands in): the [ECB](ecb-decision-2026-12-17.md) and [BoE](../../../src/domain/market-events/proposals/boe-decision-2026-12-17.from-boe-decision-2026-11-05.json)
decisions plus four US prints on 12-17; the [BoJ](boj-decision-2026-12-18.md), Japan CPI and December
[opex](opex-2026-12-18.md) on 12-18; the [S&P quarterly rebalance](sp-quarterly-rebalance-effective-2026-12-21.md)
on 12-21; [consumer confidence](consumer-confidence-2026-12-22.md) sharing this date; then
[PCE](pce-2026-12-23.md), [durable goods](durable-goods-2026-12-23.md), Q3 GDP third, new home sales, the
[20-Year bond](treasury-20y-bond-2026-12-23.md) and the [2-Year FRN](treasury-2y-frn-2026-12-23.md) on
12-23; the half day and the [12-24 announcement](treasury-coupon-announcement-2026-12-24.md); the closure and
Tokyo CPI on 12-25. **No FOMC and no US CPI in the corridor** — `fomc-2026-12-09` is 13 days before and
`cpi-2026-12-10` is 12, both already printed, which makes this the policy-clean end of the December block.
**One dated adjacent event PROPOSED in this PR: `treasury-coupon-announcement-2026-12-17`**, previously
tracked nowhere — not as a canonical file and not as any lane's proposal — while its 12-24 sibling was
already carried and researched. It is this event's own confirming primary and simultaneously that of
`treasury-2y-frn-2026-12-23` and `treasury-20y-bond-2026-12-23`. **Deliberately not filed, with the reason
recorded:** the four bill legs in the same block (13/26-week 12-21, 6/52-week 12-22), because this calendar
tracks no bill auction of any tenor and creating that class inside an adjacency sweep would be a scope
decision rather than a discovery — the same line the 12-24 sibling drew.

**What plays the conditions support:** none directional, none symbol-keyed — the standing house answer for
this event kind. The usable output is a **grading rule**: score this print on indirect share against the
December band, and read the breakeven normally on the day, which the October sibling's date does not allow.

**Honest limits.** The headline is **n = 7 paired observations of one calendar slot** — 7/7 with t = −3.89
is strong for its size and is still seven years, not a law. The **cause is unidentified**: leg 4's
difference-in-differences cannot separate the December date from the October-dated security at this n, and
leg 5's year-end mechanism is refuted by a control that is itself confounded by seasoning. The nominal
control in leg 3 rules out a *general* December effect; it does not rule out something specific to
inflation-linked demand that this session did not name — no bidder-identity data exists in the public record
beyond the three-way dealer/direct/indirect split, and "indirect" is a bidding channel (bids routed through
FRBNY), **not** a synonym for foreign official demand. All curve measurements are daily close-to-close on
CMT series **rounded to 1bp**, so the ±3bp claim in leg 6 is quantized and nothing intraday is visible. The
sibling-reproduction check in leg 6 passes on three of four populations and leaves one small unreconciled
disagreement. The 2013 start is a data-availability boundary, not a regime boundary; the 2019 split in leg 7
*is* a regime boundary and is used as one. This auction's CUSIP does not exist yet (the 2026-10-22 new issue
creates it) and its size and terms do not exist until 2026-12-17. `symbols: []`, `medium` impact, date
`estimate`: nothing here licenses a position in any name.

## Stance & kill switches

**Stance (estimate-dated event; no standalone play):** watch-only, and the specific contribution is a
**measured demand regularity in a number this calendar has not been reading, sitting beside a number it has
been reading instead**. In each of the seven years since the modern 5-Year TIPS cycle began in 2019, the
December reopening drew a lower indirect share than the June reopening of the same year — **7/7, mean
−13.12 points, t = −3.89** — while bid-to-cover moved **−0.07 (t = −0.87)** and the nominal 5/7/2/10-Year
notes showed nothing over the identical Decembers (+1.70, −0.56, −6.18, −1.09; all |t| < 0.8). So the effect
is real, TIPS-specific, and invisible to the yardstick most readers would reach for. **Its cause is
explicitly unsettled** and this stance does not assert one: the October-dated new issue carries about 40% of
the same sign (−5.30, t = −1.44), the difference-in-differences that would isolate the December date is
−7.82 at t = −1.41, and the year-end-settlement story — attractive because all 15 December reopenings since
2011 settle on the year's last business day — is **refuted** by the pre-2019 within-CUSIP control, where
December's indirect share ran **higher** by +6.92 (7/8, t = +2.85). The practical output is therefore a
**grading rule and not a forecast of the market**: on 2026-12-22 score indirect share against the December
band (min 51.4 / p25 64.2 / med 71.2 / p75 74.1 / max 75.7) or, better, against the 2026-06-18 reopening's
own **68.59%**; do not grade it on bid-to-cover, and do not import June's or a pooled band. Separately, the
[October sibling's](treasury-5y-tips-2026-10-22.md) knot artifact is **absent** here — modern December
reopenings move the 5Y-minus-10Y breakeven **+0.43bp, every print inside ±3bp** — so unlike 10-22, the
published 5-year breakeven **is** readable on this date; that sibling's pooled-history reading is amended in
leg 6 rather than inherited. Size reads **$24B** on 31/31 and 15/15, stated and not re-registered. Nothing
here is directional and no house playbook applies.

**Kill switches (what would change this stance):**

- **The core one — the indirect shortfall failing on 2026-12-22.** If indirect share on the competitive base
  prints **at or above 68.59%** (the 2026-06-18 reopening's own figure), the 7/7 becomes 7/8, the paired t
  falls below 3, and the grading rule must be withdrawn before the June 2027 reopening. Registered as
  **FT-treasury-5y-tips-2026-12-22-1**, score by **2026-12-23**.
- **The knot artifact firing where it should not.** A 5-year-minus-10-year breakeven change of **≥ +5bp** on
  2026-12-22 would say the mechanism is not new-issue-only and the October sibling's leg 3 needs rebuilding.
  Registered as **FT-treasury-5y-tips-2026-12-22-2**, score by **2026-12-23**, with its asymmetry stated up
  front: 98.4% of control sessions pass, so a **pass carries little information and a failure is decisive**.
  The prior of failure is not negligible — 3 of the 13 December reopenings since 2013 printed ≥ +8bp, all
  pre-2019.
- **A 2026-10-22 size other than $26B, or that auction printing as a reopening (`RT`).** Either breaks the
  like-for-like series, voids the December bands above and the $24B arithmetic together, and must be logged
  off-cadence regardless of when the next pulse is due. The prediction itself belongs to
  [`FT-treasury-coupon-announcement-2026-10-15-1`](../forward-tests/treasury-coupon-announcement-2026-10-15.md),
  not to this doc.
- **The 2026-12-17 announcement moving the date, the size or the leg.** It is this event's confirming primary
  and the one observation that flips the entry to `confirmed`; a `12-22` that becomes anything else stops
  being the December slot this doc measured.
- **A future December reopening printing indirect above its own June sibling.** One exception is survivable
  at 7/8; two would put the whole regularity back in question and the grading rule with it.
- **Treasury changing its real-curve knot-point rule or its reopening-size convention.** The methodology page
  reserves the first right explicitly (last revised 2025-02-18); the second has held 31/31 since 2011-08,
  which is exactly how long a convention can hold before it stops being one.
- **Nothing here licenses date-keyed *action*.** The date is `estimate`; observations widen caution rather
  than licensing entries, and `symbols: []` means there is no instrument to express one in.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-104 | **Initial research.** **Canonical file written by this session** — the id existed only as `proposals/treasury-5y-tips-2026-12-22.from-treasury-2y-frn-2026-12-23.json`, read in full first per EVENT-RESEARCH.md, with its base rates **re-derived from a wider pull rather than inherited**; `probe-ref` populated with real readings so the first `interval-elapsed` pulse is screenable. **Event tape (primary).** Row verified verbatim from home.treasury.gov's Tentative-Auction-Schedule.pdf (plain curl, HTTP 200, **17,195 bytes**, text layer inflated stream-by-stream and re-tokenised into 909 tokens this session): `5-Year TIPS R T / Thursday, December 17, 2026 / Tuesday, December 22, 2026 / Thursday, December 31, 2026`. Legend on the same page: `T --denotes TIPS`, `R --denotes reopening` — **R present, so a reopening**, which is what leg 5 turns on. Entry stays **`estimate`** on the two standing limits. **FINDING 1, THE LOAD-BEARING ONE — the December 5Y TIPS reopening is the auction indirect bidders skip, and bid-to-cover cannot see it.** From fiscaldata `auctions_query` (`inflation_index_security: Yes`, **206 records** back to 2009, **59** of them 5-Year), percentages on the **competitive base** (dealer+indirect+direct; SOMA add-ons ran $0.0–2.6B across the December series and would distort `total_accepted`). Within-year December-minus-June indirect share, 2019–2025: **−20.64, −6.07, −16.13, −9.83, −9.44, −27.71, −2.00 → mean −13.12, sd 8.91, t = −3.89, 7/7 negative** (1-in-128 under a coin flip). The shortfall goes to dealers **+6.65** (t = 2.00, 5/7) and directs **+6.47** (t = 2.14, 6/7) — neither significant alone, so **indirect share is the statistic, not dealer takedown**. **Bid-to-cover over the same pairs: −0.07, t = −0.87 — nothing.** **FINDING 2 — the nominal control is empty at every tenor**, same seven Decembers, same within-year design: 5Y note **+1.70** (t = 0.78, 3/7), 7Y **−0.56** (t = −0.13), 2Y **−6.18** (t = −0.79), 10Y **−1.09** (t = −0.55). TIPS-specific, not a December calendar effect. **FINDING 3 — the attribution FAILS and is reported as failed.** Difference-in-differences to separate the December date from the October-*dated* security: (A) Dec−Jun reopenings **−13.12, t = −3.89, 7/7**; (B) Oct−Apr new issues, which isolate the security's dating, **−5.30, t = −1.44, 5/7**; (C) A−B, the December-date-specific increment, **−7.82, t = −1.41, 4/7**. At n=7 the design cannot separate them; ~40% of the headline may be the CUSIP's dated month. **FINDING 4 — the obvious mechanism is REFUTED by the one controlled test available.** All **15 of 15** December reopenings since 2011 settle on the year's **last business day**, which invites a year-end-turn story. Pre-2019 the cycle reopened one April CUSIP **twice** (August and December), so the two share a CUSIP and differ chiefly in crossing the turn: indirect **+6.92, t = +2.85, 7/8 POSITIVE**; dealer −6.24 (t = −2.62); b/c +0.11 (t = 0.92). **The sign is backwards** — the year-end sale drew MORE end-user demand. Not claimed. (Caveat recorded: August vs December also differ in seasoning, 4 vs 8 months, so neither era identifies a mechanism.) **FINDING 5 — the knot artifact is ABSENT here, independently re-derived, and the sibling's control numbers are AMENDED.** Recomputed over **3,422** paired par/par-real sessions (2013-01-02 → 2026-09-08; control = the 3,256 carrying no TIPS auction of any tenor, sd 2.17bp), on the 5Y-minus-10Y breakeven change: **October new issue 2019+ +11.00bp (t = 14.55, 7/7)** and **April +5.38bp negative (t = −3.56)** — both **reproducing [the October sibling](treasury-5y-tips-2026-10-22.md) to the digit**, this pipeline's own cross-check; **December reopening 2019+ +0.43bp (t = 0.66), individual prints −1, +3, −2, +1, +2, 0, 0 — every one inside ±3bp**; June 0.00bp (t = 0.00, n=8), also reproducing exactly. **Amendment (a):** the sibling records December as −0.71bp (t = −1.00, n=7); this independent re-derivation gets **+0.43bp (t = 0.66)** on the same population while June reproduces to the digit. Both are indistinguishable from zero and neither moves a conclusion; the discrepancy is left **unreconciled and on the record**. **Amendment (b), the material one:** "reopenings show nothing" is true of the **modern** era and NOT pooled — back to 2013 the December leg reads **+2.23bp (t = 1.95, n=13)** because **3 of 13** prints (2013 **+10bp**, 2016 **+8bp**, 2017 **+9bp**, all pre-2019) reach a level only **0.49%** of control sessions do. Pooled December base rates mix two auction types. **FINDING 6 — the 2019 cycle change, which is why.** Every 5Y TIPS CUSIP's full history: 2011–2018 one April new issue reopened **twice** (Aug + Dec); 2019+ **two** new issues (Apr, Oct) each reopened **once** (Jun, Dec). December went from the 2nd reopening of an 8-month-seasoned April CUSIP to the sole reopening of a 2-month-old October CUSIP. Invariant across both: December is the CUSIP's **terminal sale**, and it settles year-end. **2026-12-22 is also the last TIPS auction of 2026** — the schedule's next TIPS row is `10-Year TIPS T` (new issue) on 2027-01-21. **FINDING 7 — the size rule is tighter than any sibling records: 31 of 31** scheduled reopenings at exactly **−$2B** since 2011-08, **15/15** on the December leg; the only non-$2B rows are 2009 and 2010 at −$1B, before the rule settled (the 2020-07-10 $25M add-on is excluded as off-cycle, as the 10-15 announcement ledger discloses). `sb0590`'s **$26B** for 2026-10-22 reads **$24B** here — the same arithmetic 2025 and 2026-Apr/Jun both ran. **Stated, deliberately NOT re-registered**: the live uncertainty is upstream in [`FT-treasury-coupon-announcement-2026-10-15-1`](../forward-tests/treasury-coupon-announcement-2026-10-15.md). **FINDING 8 — session mechanics.** **13 of 15** prior December reopenings were **Thursdays** on a **5-business-day** when-issued window; 2026 is a **Tuesday** on **3 business days** (Christmas Eve is that Thursday, Christmas Day the Friday), matched only by **2020-12-22** (2021 ran 4). That n=1 precedent printed the modern series' **highest** dealer takedown (27.11%) and its **second-smallest** indirect shortfall (−6.07) — **pointing both ways; named so it is not mistaken for evidence.** Clock: the schedule prints no time; 1:00 p.m. ET is corroborated by **53 of 59** 5Y TIPS auctions closing 1:00 p.m. and by the [FRN sibling's](treasury-2y-frn-2026-12-23.md) window-capacity rule (two bills in the 11:30 window on 12-22; the afternoon uncontested, since the 20Y bond and 2Y FRN auction **12-23**). The one 5Y TIPS ever moved to 11:30 on this slot, **2013-12-19**, shared its session with a 7-Year note that took the afternoon — the afternoon window has capacity limits too, **extending** the FRN sibling's finding. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro / current tape** (Treasury CSVs fetched today, latest published session **2026-09-08**): nominal 5Y **4.57**, 10Y **4.80**; real 5Y **2.17**, 10Y **2.43**; **5-year breakeven 2.40**, 10-year **2.37**, the 5Y-minus-10Y spread **+0.03**, the **32nd percentile of 2026** (2026 range −0.04 to +0.26). 2026 breakeven range 2.16–2.72; 2026 real 5Y range 1.11–2.22, today 5bp off the high. **Volatility: VIX 16.48** live 2026-09-09 (Yahoo chart meta stamp 12:11Z, pre-open) against the **15.72** close of 09-08 and **14.53** on 09-04; the 09-07 bar is a Labor Day closure artifact, **flagged and not adopted**, same as the siblings. **Geopolitical:** nothing new touching this tenor beyond the oil-inflation channel the TIPS siblings already carry. **Corridor: 24 tracked entries within ±5 days** (counting proposals the loader stands in), with **no FOMC and no US CPI** — `fomc-2026-12-09` is 13 days before and `cpi-2026-12-10` is 12, both already printed, making this the policy-clean end of the December block; the dense side is 12-23, carrying [PCE](pce-2026-12-23.md), the [20Y bond](treasury-20y-bond-2026-12-23.md) and the [2Y FRN](treasury-2y-frn-2026-12-23.md). **ONE dated adjacent event PROPOSED in this PR: `treasury-coupon-announcement-2026-12-17`** — tracked nowhere, canonical or proposal, while its 12-24 sibling was already researched; it is the confirming primary for **three** tracked auctions at once (this one, the FRN and the 20Y). **Deliberately NOT filed, reason recorded:** the four bill legs of the same block (13/26-week 12-21, 6/52-week 12-22) — this calendar tracks no bill auction of any tenor and creating that class in a sweep is a scope decision, the same line the 12-24 sibling drew. **Sources:** all Treasury primaries returned HTTP 200; **stooq's VIX CSV endpoint returned a JavaScript challenge instead of data** and is recorded in `probe-ref.blocked` — VIX taken from the Yahoo chart endpoint `scripts/research/market-data.mjs` already uses. **Forward tests registered: FT-treasury-5y-tips-2026-12-22-1** (indirect share on 12-22 below the 2026-06-18 reopening's own 68.59%; base rate 7/7, paired mean −13.12pt) and **FT-treasury-5y-tips-2026-12-22-2** (the knot artifact does not fire: 5Y-minus-10Y breakeven change < +5bp; **asymmetry stated up front — 98.4% of control sessions pass, so only a failure is informative**, and 3 of 13 December reopenings since 2013 did print ≥ +8bp, all pre-2019). | **Stance set** — watch-only. Grade this print on **indirect share** against the December band, never bid-to-cover and never June's; the breakeven **is** readable on 12-22, unlike 10-22; cause of the shortfall **unidentified and the year-end story refuted** | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay, and a stance *change* earns its sentence in the Stance section with the row as
its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime · geopolitical · event tape;
see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-5y-tips-2026-12-22.json` (`status: "estimate"`) in
the same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc goes quiet.
