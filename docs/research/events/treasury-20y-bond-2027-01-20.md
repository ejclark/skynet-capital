# 20-Year Treasury Bond auction (January second reopening) — treasury-20y-bond-2027-01-20

**Kind:** rates · **Date:** 2027-01-20 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09 — `20-Year  BONDR` announce 01-14, auction 01-20, settle 01-22; 1:00pm ET from fiscaldata `closing_time_comp`, not from the schedule) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-01-22","fomc-blackout-start-2027-01-16","japan-cpi-2027-01-22","mlk-market-closure-2027-01-18","norway-gpfg-bond-expert-group-2027-01-25","opex-2027-01-15","tic-monthly-2027-01-19","treasury-10y-tips-2027-01-21","treasury-2y-note-2027-01-25","treasury-coupon-announcement-2027-01-21","vix-expiration-2027-01-20","wef-davos-annual-meeting-2027-01-18"],"screenStreak":0,"blocked":[{"url":"https://stooq.com/q/d/l/?s=%5Evix&i=d","status":"JS_CHALLENGE","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **This calendar grades a 20-Year auction on four numbers, and three of them are the same
number.** Measured this session across all **24** 20-Year reopenings sold at a constant **$13B**
(Treasury's own `auctions_query`, 2023-09-19 onward), bid-to-cover moves with gross competitive
**tendered dollars** at r = **0.999** (arithmetic — the offering never varies), with **primary-dealer
take** at r = **−0.849** (t = −7.53), and with the **high-minus-median yield dispersion** at
r = **−0.769** (t = −5.64). Only the **indirect/direct split** is close to orthogonal: r = **+0.337**
(t = 1.68) and **+0.384** (t = 1.95), neither significant. So the [10-21 sibling's](treasury-20y-bond-2026-10-21.md)
rule *"composition beats the ratio"* is right about **direct share** and wrong about **dealer take**,
which shares 72% of its variance with the ratio it is meant to independently check. Grade this print
on **two** numbers. Three tempting stories were tested and **killed**: the sibling's own n=15 band
pools three $12B auctions with twelve $13B ones — the same size-pooling error one level down — but
correcting it moves the floor 2.53→2.53 and the median 2.68→2.68, so its thresholds survive; there is
**no January or MLK-shortened-week effect** once 2023-01-18's −16bp outlier is dropped; and the
December→January "year-turn lift" is **3 up, 4 down** across seven paired cycles. The one thing that
*is* unusual about this cycle is its predecessor: the first reopening auctions **2026-12-23**, later
than any December 20-Year on record, into Christmas week — a bad baseline, proposed to the calendar
in this PR. Date is `estimate`, `symbols: []`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-133) | Stand aside | High | The sale's own terms do not exist until the **2027-01-14** announcement, its size is not published until the **2026-11-04** refunding, and `symbols: []` means there is nothing here to express a view in. | Nothing dated today for this event; the first fact about it lands **2026-11-04** |
| This week | Stand aside — and do not treat the **2026-09-15** reopening as this sale's read-across | Medium | 09-15 is a *first* reopening of a different CUSIP (912810UX4) two quarters back. The only diagnostic predecessors for 2027-01-20 are the **2026-11-18** new issue and the **2026-12-23** first reopening, neither of which has happened. | The **2026-09-15** print landing below **2.50** — the 44-auction reopening floor — which would say the reopening population is breaking now, four cycles early, and this doc's constant-size band is stale on arrival |
| This month | Grade every 20-Year print on **two** statistics, not four — and stop reading dealer take as a second opinion | High | r(bid-to-cover, dealer take) = **−0.849** across the 24 constant-size reopenings. Checking both is checking one thing twice; the second genuinely independent read is the **indirect/direct** split. | Any 2026-Q4 20-Year print where bid-to-cover and dealer take land on the **same** side of their medians (2.705 / 10.2%) — the 4-of-24 minority case — recurring twice in a row |
| This quarter | Watch **2026-11-04**, not 2027-01-14 — and discount the **2026-12-23** predecessor before it prints | Medium | The refunding statement publishes this auction's $13B eleven weeks before the announcement "reveals" it, and the December leg sells later than any December 20-Year on record, beside `pce-2026-12-23` and a half-day. | The 2026-11-04 refunding naming the January 20-Year at a size other than **$13B** — 24 consecutive reopenings at that number would break, and every band in this doc would be re-derived rather than patched |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed. This is a read-it-don't-trade-it event.
- **The yardstick for 2027-01-20** — second-reopening slot at constant **$13B** only, n=12:
  floor **2.53** · p25 **2.62** · median **2.68** · p75 **2.76** · ceiling **2.86**.
- **The second dimension, and the only one that is actually second** — direct share on the
  **competitive** base: floor **12.3%** · p25 **16.0%** · median **18.9%** · p75 **22.1%** ·
  ceiling **29.1%** (same n=12).
- **Statistics that add nothing once you have bid-to-cover** — gross tendered dollars (r = 0.999),
  dealer take (r = −0.849), high-minus-median dispersion (r = −0.769). Report them; do not count them
  as confirmation.
- **Weak print** = bid-to-cover below **2.62** (slot p25; the slot clears it 9 of 12) *with* direct
  share below **16.0%**. Either alone is one number, not two.
- **Strong print** = bid-to-cover at or above **2.76** (slot p75) *with* direct share at or above
  **22.1%**.
- **The `low_yield` trap, named so it stops being used** — fiscaldata's `low_yield` on 20-Year
  auctions parks at 2.880 or 3.880 in 16 of the 24 constant-size reopenings. It is a floor-bid
  artifact, not the auction's low. High-minus-**median** is the honest internal-dispersion statistic;
  the apparent 196.6bp "range" at 2026-01-21 is not a tail.
- **Supply is settled before the announcement** — **$13B** expected on a 24-of-24 reopening base rate,
  published 2026-11-04 and read back 2027-01-14. Owned by the coupon-announcement lane; deliberately
  **not** re-registered here.
- **New dated adjacency added this pass:** `treasury-20y-bond-2026-12-23` — this CUSIP's own first
  reopening, missing from the calendar and the latest December 20-Year on record.
- **Watch (dated):** 2026-11-04 refunding (the size prints) · 2026-11-18 new issue · **2026-12-23
  first reopening** · 2027-01-14 announcement · opex **01-15** · FOMC blackout opens **01-16** · MLK
  closure **01-18** · four-legged bill slate + TIC **01-19** · **this auction 01-20** · 10Y TIPS
  **01-21** · BoJ **01-22** · 2Y note **01-25** · 5Y note **01-26** · **FOMC 01-27**.

## Initial research

### The question, plainly

This event arrived on 2026-09-09 as a proposal from the
[`treasury-coupon-announcement-2027-01-14`](treasury-coupon-announcement-2027-01-14.md) sweep, and
that proposal did the obvious work already: it fixed the date from the schedule PDF, established the
$13B size on a 24-of-24 base rate, and named where the number becomes public (the 2026-11-04
refunding). Its own notes close the door on a supply doc — *"THE NUMBER IS NOT A GUESS AND WILL NOT
BE ONE."* At D-133 with `symbols: []`, there is also no tape to have a view on.

So the question this session asked was the only one left that pays: **when this print lands, the
grader will have four demand statistics in front of them — bid-to-cover, tendered dollars, dealer
take and yield dispersion. How many of those are actually independent?**

**One-line verdict:** one and a half. Three of the four are the same measurement wearing different
units, and the [10-21 sibling's](treasury-20y-bond-2026-10-21.md) advice to check composition
alongside the ratio is only half right — it is right about the indirect/direct split and wrong about
dealer take, which is the ratio in a mirror.

### Method

Sourced primary research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (rates mode: no
price instruments apply, `symbols: []`). Auction statistics are computed this session from Treasury's
own **`auctions_query`** (fiscaldata API, `original_security_term:eq:20-Year`, `auction_date` from
2020-01-01 — **77 auctions**, the full history since the 20-Year's 2020-05 reintroduction, HTTP 200,
275,209 bytes). That is a deliberately **wider** pull than the 44-auction, 2023-onward window every
prior 20-Year ledger here used, so that the seasonal and year-turn claims below get tested on more
than one issuance regime. Yield reactions are computed from Treasury's **daily par yield curve (CMT)**
CSVs for 2021–2026 (six fetches, all HTTP 200), **1,420 sessions**. Existence, date, settlement and
the reopening marker are read from the **Tentative Auction Schedule PDF** (home.treasury.gov, fetched
direct 2026-09-09, HTTP 200, 17,195 bytes, text layer decompressed stream-by-stream and glyph tokens
reassembled) — an independent second read of the primary the proposing sweep used. VIX is the
2026-09-08 close from Yahoo's chart API; a first attempt at stooq returned a JavaScript challenge
rather than data and is recorded in `probe-ref.blocked` rather than silently replaced.

All percentages below are on the **competitive** base (indirect + direct + dealer), which is what the
press reports; dividing by `total_accepted` folds in SOMA add-ons and gives materially different
numbers.

### Conviction legs, tested

**1. The date, the reopening marker and the `estimate` status are right — SUPPORTED.** The schedule
PDF carries the row verbatim: `20-Year  BONDR · Thursday, January 14, 2027 · Wednesday, January 20,
2027 · Friday, January 22, 2027`, with `Holiday - Monday, January 18, 2027 - Birthday of Martin
Luther King, Jr.` four lines below. The same fetch shows the whole cycle — `20-Year  BOND` (no `R`)
on 2026-11-18, `20-Year  BONDR` on 2026-12-23 and again here — which is what fixes this sale as the
**second** reopening of the November CUSIP rather than the first. The 1:00pm ET deadline comes from
`closing_time_comp`, which reads `01:00 PM` on all 77 auctions in the pull, and the entry says so.
`estimate` is correct on both stated counts.

**2. Bid-to-cover and gross tendered dollars are the same number — SUPPORTED, and it is arithmetic
rather than a finding.** Across the 24 reopenings sold at $13B, r(bid-to-cover, competitive tendered)
= **0.999** (t = 121). The offering has not moved since 2023-09-19, so bid-to-cover *is* tendered
dollars divided by a constant. Stated first because the two are routinely reported side by side as if
a reader gets two looks at demand.

**3. Dealer take is not an independent check either — SUPPORTED, and this is the finding.**
r(bid-to-cover, primary-dealer share of the competitive base) = **−0.849** (t = −7.53, n = 24) —
about **72%** shared variance. The mechanism is not subtle: dealers are the residual buyer, so when
investor bids show up the ratio rises and the dealer take falls, by construction of the auction rather
than by coincidence. The [10-21 ledger](treasury-20y-bond-2026-10-21.md) wrote *"composition beats the
ratio"* and listed dealer take among the composition numbers; a grader following that advice believes
they have cross-checked a weak ratio when they have re-read it.

**4. Yield dispersion is a third view of the same thing — SUPPORTED.** The high-minus-**median**
award yield (the closest thing to a tail computable from this primary) runs **4.0–6.9bp** across the
24 and correlates with bid-to-cover at **−0.769** (t = −5.64) and with dealer take at **+0.609**
(t = 3.60). It is orthogonal to indirect share (r = −0.078) and to the allocation percentage
(r = −0.128), so it is not *useless* — it is simply not independent of the ratio.

**5. The indirect/direct split is the genuinely second dimension — SUPPORTED, weakly, and the
weakness is the point.** r(bid-to-cover, indirect share) = **+0.337** (t = 1.68) and
r(bid-to-cover, direct share) = **+0.384** (t = 1.95); neither clears significance, and the two split
against each other (r = −0.640, t = −3.91). Directionally: a print can cover well on foreign demand or
on domestic direct demand, and the ratio does not tell you which. This is the half of the sibling's
rule that survives, and it is consistent with
[`FT-treasury-20y-bond-2026-11-18-2`](../forward-tests/treasury-20y-bond-2026-11-18.md), which
registered direct share as the clean cut at the new-issue slot — that test and this leg point the same
way from different slots.

**6. The sibling's corrected yardstick repeats the size-pooling error one level down — SUPPORTED as a
fact, REFUTED as a problem.** The 10-21 ledger's "second-reopening slot, n=15" window starts
2023-01-01 and therefore pools **2023-01-18, 2023-04-19 and 2023-07-19 at $12B** with twelve auctions
at $13B — exactly the error it had just diagnosed between new issues and reopenings. Constraining to
constant size (n=12):

| Band | n | min | p25 | median | p75 | max |
|---|---|---|---|---|---|---|
| 10-21 ledger's, mixed $12B/$13B | 15 | 2.53 | 2.63 | 2.68 | 2.77 | 2.86 |
| Constant $13B, this doc's | 12 | 2.53 | 2.62 | 2.68 | 2.76 | 2.86 |

The floor, median and ceiling are identical and the quartiles move by a point in the second decimal.
**Its thresholds survive intact** — reported as a null because the tempting move was to announce a
second correction, and the data does not support one. What changes is the *practice*: state the size
the band was measured on, so the next reader does not have to check.

**7. There is no January effect and no MLK-shortened-week effect — REFUTED.** The tempting story is
that this slot is special because it always sells in a four-session week: MLK is the third Monday of
January, and all six January 20-Year auctions since 2021 landed in that week. Measured against
1,420 CMT sessions:

| Sample | n | mean 20Y change | mean absolute |
|---|---|---|---|
| All sessions, 2021–2026 | 1,420 | +0.27bp | 4.31bp |
| 20-Year auction days | 69 | −1.43bp | 4.30bp |
| **January** 20-Year auction days | 6 | **−4.00bp** | 4.67bp |
| January, dropping 2023-01-18 | 5 | **−1.60bp** | 2.40bp |
| All MLK-week sessions | 24 | +0.29bp | **4.13bp** |

The January mean is one observation: **2023-01-18's −16bp**, which the 10-21 ledger already
identified as the largest 20-Year auction-day move in its sample and which arrived on a *strong* 2.83
print. Remove it and January is −1.60bp against −1.19bp for every other month. MLK-week sessions as a
class are indistinguishable from any other week, and marginally **calmer**. The structural compression
is real — the schedule PDF shows the 6, 13, 26 and 52-week bills, which normally split across Monday
and Tuesday, all auctioning together on **Tuesday 2027-01-19**, with this sale the next day — but it
does not show up in the tape.

**8. The December→January "year-turn lift" is not a base rate — REFUTED.** Pairing each December
first reopening with the following January second reopening on the same CUSIP cycle gives seven pairs:
−0.11, −0.44, −0.11, +0.15, −0.02, +0.25, +0.19. **Three up, four down.** The last three are all
positive (+0.25, +0.19 after −0.02), which is what a session looking only at the $13B era would find
and mistake for a pattern; the wider pull kills it. December's dealer take likewise *looks* elevated
(mean 27.5% against 12–16% in every other month) until the anomalous **2021-12-02** record is
dropped — it reports $0.1B tendered and 100% dealer take, which is not a real auction result — after
which December is 15.4% and unremarkable.

**9. The predecessor print is unusually badly placed, and that is this cycle's one genuine oddity —
SUPPORTED.** The schedule puts this CUSIP's first reopening on **2026-12-23**. Every December
20-Year auction on record fell between the 17th and the 21st (2020-12-21, 2021-12-21, 2022-12-21,
2023-12-20, 2024-12-17, 2025-12-17); 12-23 is later than all of them, the day before
`christmas-eve-half-day-2026-12-24`, in the thinnest dealer-balance-sheet week of the year, and
sharing its 8:30 ET slot with `pce-2026-12-23` (high), `gdp-q3-2026-third-2026-12-23` and
`durable-goods-2026-12-23`. It was **not on this calendar** and is proposed in this PR. The
consequence for grading 2027-01-20 is direct: the reflex of comparing a reopening to the cycle's prior
print is unusually unreliable here, and the honest baseline is the slot distribution in leg 6, not the
December sale.

**10. The adjacency corridor is structural, not tape — SUPPORTED, and it justifies `medium` rather
than `high`.** Within five days: opex (01-15), the FOMC blackout opening (01-16), the MLK closure and
Davos (01-18), the four-legged bill slate and TIC (01-19), `vix-expiration-2027-01-20` settling the
same morning, the 10-Year TIPS new issue and the next coupon announcement (01-21), the BoJ decision
and Japan CPI (01-22), and the 2-Year note (01-25) — with `fomc-2027-01-27` seven days out and
already inside blackout. None of that is a same-session Fed release: unlike its
[11-18 sibling](treasury-20y-bond-2026-11-18.md), which bids one hour before FOMC minutes, this sale
owns its own session. `medium` is right.

**11. Current conditions are logged and are close to worthless at D-133 — stated so rather than
dressed up.** CMT at the 2026-09-08 close: 2Y **4.39** · 5Y **4.57** · 10Y **4.80** · 20Y **5.26** ·
30Y **5.25**; **20s30s +1bp**, unchanged in character from the 10-21 ledger's 09-04 reading. VIX
**15.72**, up **1.19** from the 14.53 that ledger recorded on 09-04 — inside the 3-point screen
threshold, no regime change. This is the baseline the next pulse diffs against, not information about
2027-01-20; everything between here and there resolves through at least three FOMC meetings.

### What plays the conditions support

None. `symbols: []`, the date is `estimate`, no house playbook is rates-keyed, and legs 7–8 say the
event's own session is statistically ordinary. What this doc adds is a **measuring instrument** — two
independent statistics instead of four correlated ones — not a position.

### Honest limits

- **n = 24, and the correlations are not causal.** Legs 2–4 measure redundancy inside one issuance
  regime at one offering size. The dealer-take relationship in particular is close to mechanical, and
  a regime that changed offering size would need the whole thing re-measured rather than carried.
- **This session ran many correlations on one dataset** and applied no multiple-comparison
  correction. The r = −0.849 result is large enough to survive any reasonable one; the r = +0.337 and
  +0.384 orthogonality readings are not, and are reported as non-significant rather than as evidence
  of independence.
- **No tail and no when-issued yield.** `auctions_query` publishes high, median and low award yields
  but not the WI level, so the single most diagnostic auction statistic still cannot be computed from
  the primary. High-minus-median is a **proxy** for internal dispersion, not the tail; every tail
  figure this calendar carries remains press-sourced.
- **`low_yield` is contaminated** — it sits at exactly 2.880 or 3.880 in 16 of the 24 constant-size
  reopenings, a floor-bid artifact, so high-minus-low ranges (up to 196.6bp) are not auction
  dispersion. Named because it is the obvious statistic a later session would reach for.
- **Legs 7–8 rest on six and seven observations.** They are reported as *refutations of a story*, not
  as proof of absence; a January effect smaller than a few basis points would be invisible at this n.
- **CMT is a 3pm close against a 1:00pm auction**, so leg 7's auction-day measures capture whole
  sessions and over-attribute macro to the auction — which cuts against the "auctions are quiet"
  reading rather than for it.
- **The 2027-01-20 size is not yet published anywhere.** $13B is a base rate, not a source, until the
  2026-11-04 refunding statement; every band here assumes it.
- **The 2026-12-23 predecessor is a schedule row, not a result.** Leg 9 is about placement; the print
  itself does not exist and nothing here forecasts it.

## Stance & kill switches

**Stance (date `estimate`; size `$13B` expected on a base rate and not yet published).** No position,
no directional bet, no exposure sized off this event — `symbols: []` and the date is an `estimate`,
which widens caution and licenses nothing. The substantive stance is a **grading rule, narrowed from
the 10-21 sibling's**: when the 2027-01-20 print lands it is judged on **two** statistics — bid-to-cover
against the constant-$13B second-reopening slot (n=12, floor 2.53, p25 2.62, median 2.68, p75 2.76)
and **direct share** on the competitive base (floor 12.3%, p25 16.0%, median 18.9%, p75 22.1%) — and
**not** on dealer take or dispersion, which are the ratio restated. The December 2026 predecessor is
explicitly discounted as a baseline (leg 9). Two expectations are registered in
[this event's fragment](../forward-tests/treasury-20y-bond-2027-01-20.md):
`FT-treasury-20y-bond-2027-01-20-1` (the redundancy claim, tested out of sample) and
`FT-treasury-20y-bond-2027-01-20-2` (the print clears p25).

**Kill switches:**

- **Bid-to-cover and dealer take landing on the same side of their medians on 2027-01-20** (2.705 and
  10.2% on the 24-auction sample) — the 4-of-24 minority case. Legs 3–4 would have failed on the one
  observation they were written for, and dealer take would go back to being a real second opinion.
- **Bid-to-cover below 2.53 on 2027-01-20** — the constant-size slot's floor breaks. The band in leg 6
  fails out of sample and the next session re-derives it rather than patching it.
- **The 2026-11-04 refunding naming the January 20-Year at anything other than $13B** — 24
  consecutive reopenings at one size end, and every distribution in this doc is measured on a security
  that is no longer the one being sold. Owned and scored by the coupon-announcement lane; listed here
  because it invalidates this doc too.
- **A >10bp single-session move in the 20Y on 2027-01-20** — outside all but one auction-day move
  since 2021. Leg 7's "January and MLK weeks are ordinary" would be refuted in the one observation it
  was written for.
- **The 2026-12-23 first reopening printing below 2.50** — the reopening population's floor across the
  full 77-auction history, breaking one cycle early on this exact CUSIP. Leg 9's "discount the
  predecessor" would stop being a methodological caution and become live information, and the stance
  here would be rewritten before this auction's own announcement.
- **Treasury moving 2027-01-20 off its date at the 2027-01-14 announcement** — voids rather than kills
  everything above; the tentative schedule is tentative and this event is `estimate` for that reason.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-133 | Initial research banked (doc above). This id existed only as `proposals/treasury-20y-bond-2027-01-20.from-treasury-coupon-announcement-2027-01-14.json`, read in full first; the canonical `src/domain/market-events/treasury-20y-bond-2027-01-20.json` is written in this PR per EVENT-RESEARCH.md. **Event tape — the finding, computed this session from Treasury primaries, not carried.** `auctions_query` pulled to the 20-Year's **full history** (2020-05 onward, n=77, HTTP 200) rather than the 44-auction 2023+ window every prior 20Y ledger used. Across the **24** reopenings at a constant **$13B** (2023-09-19 onward): r(bid-to-cover, competitive tendered) = **0.999** (arithmetic — offering is constant); r(bid-to-cover, dealer share) = **−0.849** (t = −7.53); r(bid-to-cover, high-minus-median yield dispersion) = **−0.769** (t = −5.64); r(bid-to-cover, indirect) = **+0.337** (t = 1.68) and r(bid-to-cover, direct) = **+0.384** (t = 1.95), with indirect vs direct at **−0.640**. So three of this calendar's four demand statistics are one statistic, and the [10-21 ledger's](treasury-20y-bond-2026-10-21.md) *"composition beats the ratio"* is right about the indirect/direct split and wrong about dealer take. **Three hypotheses killed, recorded so no later session re-runs them:** (a) the 10-21 band (n=15, from 2023-01-01) pools three **$12B** auctions with twelve $13B — the same size-pooling error one level down — but constant-size (n=12) gives floor **2.53** · p25 2.62 · median **2.68** · p75 2.76 · max 2.86 against its 2.53/2.63/2.68/2.77/2.86, so **its thresholds survive**; (b) **no January or MLK-week effect** — January 20Y auction days average −4.00bp on the 20Y, but that is entirely 2023-01-18's −16bp, and dropping it gives −1.60bp against −1.19bp for all other months, while all 24 MLK-week sessions average **4.13bp** absolute against **4.31bp** across 1,420 sessions (CMT 2021–2026, six fetches, HTTP 200); (c) the **December→January lift is 3 up, 4 down** across seven paired cycles (−0.11, −0.44, −0.11, +0.15, −0.02, +0.25, +0.19) — the last-three-years run is what a $13B-only window would have mistaken for a pattern. December's apparent 27.5% dealer take collapses to 15.4% once the anomalous 2021-12-02 record ($0.1B tendered, 100% dealer) is dropped. **Data trap named:** `low_yield` sits at exactly 2.880/3.880 in 16 of 24 rows — a floor-bid artifact, so high-minus-low "ranges" (196.6bp at 2026-01-21) are not tails; high-minus-median is the honest dispersion proxy. **Primary verification:** Tentative Auction Schedule PDF re-fetched direct today (HTTP 200, 17,195 bytes, text layer decompressed) carries `20-Year  BONDR / Thursday, January 14, 2027 / Wednesday, January 20, 2027 / Friday, January 22, 2027` and `Holiday - Monday, January 18, 2027`; the same fetch shows the 6/13/26/52-week bills all auctioning **Tuesday 2027-01-19** (they normally split Monday/Tuesday) and `20-Year  BOND` without the `R` on 2026-11-18, fixing this as the **second** reopening. Size $13B stays with the coupon-announcement lane and is deliberately not re-registered. **Macro:** none new this session bearing on 2027-01-20; the 09-04 payroll surprise the sibling ledgers carry resolves through three FOMCs before this sale. **Rates levels (CMT 09-08):** 2Y **4.39** · 5Y 4.57 · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**; **20s30s +1bp**, unchanged in character from the 10-21 ledger's 09-04 reading. **Volatility:** VIX **15.72** (09-08 close, Yahoo chart API) vs **14.53** on 09-04 — **+1.19**, inside the 3-point screen threshold, no regime change. A first VIX fetch at stooq returned a JavaScript challenge and is recorded in `probe-ref.blocked`, not silently substituted. **Geopolitical / policy:** nothing dated in the corridor beyond the tracked BoJ decision (01-22) and Davos (01-18). **Peers:** n/a — `symbols: []`. **New dated adjacency found → proposed in this PR:** **`treasury-20y-bond-2026-12-23`**, this CUSIP's own first reopening and this event's direct predecessor, absent from the calendar — and **later than any December 20-Year auction on record** (all six prior fell 12-17 to 12-21), bidding the day before the 12-24 half day beside `pce-2026-12-23`. Recorded consequence: it is a **poor baseline** for 2027-01-20 and the slot distribution is the honest one. The 2026-11-18 new issue is already tracked; the 2027-02 new issue sits outside the corridor this sweep governs and is named here for whoever owns it. **Forward tests registered:** `FT-treasury-20y-bond-2027-01-20-1` (bid-to-cover and dealer take again land on opposite sides of their medians — the redundancy claim, base rate **20/24** disclosed) and `FT-treasury-20y-bond-2027-01-20-2` (the print clears **2.62**, base rate **9/12** disclosed); both score 2027-01-21. | — (stance set: read-don't-trade, plus a grading rule narrowed from four statistics to two) | 2026-09-30 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-20y-bond-2027-01-20.json` (`status:
"estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache
busted first), never from memory — after which this doc goes quiet.
