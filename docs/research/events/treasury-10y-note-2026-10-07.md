# 10-Year Treasury Note auction (second reopening) — treasury-10y-note-2026-10-07

**Kind:** rates · **Date:** 2026-10-07 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — `10-Year NOTE R` announce 10-01, auction 10-07, settle 10-15; 1:00pm ET by convention, not separately sourced) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["ecb-account-2026-10-08","fomc-minutes-2026-10-07","imf-world-bank-annual-meetings-2026-10-12","ism-services-2026-10-05","jobs-2026-10-02","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","treasury-30y-bond-2026-10-08","treasury-3y-note-2026-10-06","treasury-buyback-20y30y-2026-10-08","treasury-buyback-2y3y-2026-10-06"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The second reopening is the 10-Year auction that sells one hour before the FOMC minutes,
and that is not a coincidence — it is a calendar alignment with no exceptions.** Measured this session
from Treasury's own `auctions_query` against the Fed's own meeting calendar: of 44 nominal 10-Year
auctions since 2023-01, **9 shared their day with a minutes release and every one of the 9 was a
second reopening** (9 of 15 in that slot; **0 of 29** at new issues and first reopenings). 2026-10-07
is the next one — auction 1:00pm ET, minutes **2:00pm ET**, both primary-sourced today. The useful
part is what the collision is *not*: those 9 days were **not** more volatile in any way this data can
show. Excluding a single +19bp outlier the collision average is **4.25bp** of 10-Year movement against
**4.00bp** on the other 35 auction days, and moves larger than 4bp occur on 56% / 54% / 52% of
collision / non-collision / all 919 sessions. So the hazard is **attribution, not variance**: on
10-07 the close-to-close tape has two dated causes an hour apart and can grade neither, which means
this sale gets graded on its auction statistics or not at all. Two supporting measurements. First,
**the 20-Year sibling's population correction does not port here** — the
[10-21 ledger](treasury-20y-bond-2026-10-21.md) found 20Y new issues and reopenings to be
near-disjoint bid-to-cover populations; at the 10-Year the same three tests come back **null**
(new 2.32–2.66 vs reopenings 2.34–2.70, and paired against its own CUSIP the reopening won only
**19 of 28**, t = 1.68), exactly as that doc's own size-artifact mechanism predicts, because the
10-Year's step is **−7%** ($42B→$39B) where the 20-Year's is −19%. The pooled yardstick the
[09-09 sibling](treasury-10y-note-2026-09-09.md) uses is therefore honest and this doc keeps it.
Second, the statistic that actually tracks the tape is **not** bid-to-cover (corr −0.214, t = −1.42,
not significant) but the **dealer takedown** (corr **+0.327**, t = **2.24**) — reported as a
hypothesis, not a result, because four correlations were tested on one 44-row dataset. Date is
`estimate`, `symbols: []`, size and CUSIP are already owned by another forward test, and nothing
here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-32) | Stand aside | High | Saturday, no session; **09-07 is Labor Day**. This auction's own terms do not exist until the **2026-10-01** announcement, and `symbols: []` leaves nothing to express a view in. | Nothing dated today for this event; its terms are 26 days away |
| This week | Watch the **2026-09-09** first reopening — it is the only diagnostic predecessor, and the 09-08 3Y is not one | Medium | 09-09 reopens **this exact security** (CUSIP 91282CRF0, $39B, announced 09-03) one slot earlier in the same cycle. The 3Y on 09-08 is a different tenor, a new issue, and a different bidder base. | The **2026-09-09** print landing below bid-to-cover **2.32** — the 44-auction floor for any nominal 10-Year since 2023 — which would say demand is breaking now, not that a yardstick needs fixing |
| This month | Do **not** port the 20Y ledger's population correction to this tenor; grade a 10-Year print on the pooled distribution | Medium | Three tests (unpaired slot ranges, size-controlled slots, paired within CUSIP) all come back null at the 10-Year, and the 20Y doc's own denominator mechanism explains why: the size step here is −7%, not −19%. | The **2026-09-09** and **2026-10-07** prints both landing outside **2.32–2.70** in the same direction — two out-of-sample points saying the reopening slot does behave as its own population after all |
| This quarter | Read the **2026-10-07** auction off its own statistics; treat that session's yield move as unattributable | High | Auction 1:00pm ET, **FOMC minutes 2:00pm ET** (federalreserve.gov October calendar, fetched 2026-09-05), one hour apart on the last policy signal before the 10-17 blackout — with the 3Y on 10-06 and the 30Y plus a 20-30Y buyback on 10-08 around it. | A **>13bp** single-session 10-Year move on **2026-10-07** — outside all but one of the nine prior collision days — which would say the pairing *is* a variance event and the calm reading was an artifact of a small sample |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date is `estimate`, no house playbook (S1/S2/E1/S3/S4 +
  G1) is rates-keyed. Read-it-don't-trade-it.
- **The grading rule for 10-07: auction statistics only.** The minutes land 60 minutes after the
  auction, so the close-to-close move cannot be attributed to either event.
- **The honest yardstick** — all 44 nominal 10-Year auctions since 2023-01 (slot is inert here):
  floor **2.32** · median **2.53** · max **2.70** · mean 2.514. Second-reopening slot alone: 2.34 /
  2.53 / 2.67, statistically indistinguishable.
- **Weak print** = bid-to-cover below **2.45** (cleared in 34 of 44) *or* dealer takedown above
  **15%** (only 1 reading above 15% since 2025-01-07).
- **Strong print** = bid-to-cover at or above **2.53** with dealer takedown in single digits — the
  shape the 2026-08-12 predecessor printed (2.53 / **8.60%** dealer / 76.73% indirect).
- **Watch the dealer share, not the cover ratio.** corr(dealer%, same-day 10Y move) = **+0.327**
  (t = 2.24, n=44); corr(bid-to-cover, move) = −0.214 (t = −1.42, **not significant**).
- **Composition is on the competitive base** (indirect + direct + dealer), which is what press
  reports; dividing by `total_accepted` includes SOMA add-ons and gives different numbers.
- **Supply and CUSIP are settled and are not this doc's to test** — $39B, CUSIP 91282CRF0, owned by
  [`FT-treasury-coupon-announcement-2026-10-01-1`](../forward-tests.md). Deliberately not re-registered.
- **New dated adjacencies added this pass:** `treasury-buyback-2y3y-2026-10-06` and
  `treasury-buyback-20y30y-2026-10-08` — two unlisted buyback operations inside the corridor.
- **Watch (dated):** jobs **10-02** · OPEC+ JMMC **10-04** · ISM services **10-05** · 3Y note +
  2-3Y buyback **10-06** · **this auction + FOMC minutes 10-07** · 30Y bond + 20-30Y buyback + ECB
  account **10-08** · IMF/World Bank **10-12** · CPI **10-14** · PPI + retail sales + 10-20Y buyback
  **10-15** · dealer agenda + opex **10-16** · **FOMC blackout opens 10-17** · 20Y **10-21** ·
  5Y TIPS **10-22** · 2Y note **10-26** · **FOMC 10-28**.

## Initial research

### The question, plainly

This event arrived on the calendar on 2026-09-05 with almost everything already settled by the
sweep that created it: the schedule row, the $39B size from `sb0590`, and a CUSIP prediction
(91282CRF0, `9-Year 10-Month`) that is already registered as a forward test on the 10-01
announcement. Its own `notes` say so. The [09-09 sibling](treasury-10y-note-2026-09-09.md) has, over
five assessments, also already done the market-context work — the term-premium story, the Fed path,
the oil shock, the name-level transmission that turned out not to fire. Re-writing any of that here
would be duplication.

So the question this session actually asked was the narrow one left over: **on 2026-10-07, what will
actually be readable — and against what?**

**One-line verdict:** less than the calendar implies, for one structural reason nobody here had
noticed. The second reopening of a 10-Year cycle systematically shares its day with the FOMC minutes
— 9 of 15 since 2023, and never once at any other slot — so the session's yield move is
unattributable by construction. What *is* readable is the auction's own statistics, and there the
grading tool this calendar reaches for (bid-to-cover) is the one that does not track the tape, while
the one it buries (dealer takedown) does.

### Method

Sourced primary research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (rates mode: no
price instruments apply, `symbols: []`). Every auction statistic is computed this session from
Treasury's **`auctions_query`** (fiscaldata API, `original_security_term:eq:10-Year`,
`auction_date >= 2023-01-01`, HTTP 200, 240,970 bytes; 67 rows, of which **44 completed nominal
notes** after excluding TIPS by the dataset's own `inflation_index_security` flag and the one
announced-but-unpriced 09-09 row). Yield moves are computed from Treasury's **daily par yield curve
(CMT)** CSVs for 2023–2026 (four fetches, HTTP 200), **919 sessions** of close-to-close change in the
10-Year. Existence, date and settlement are read from the **Tentative Auction Schedule PDF**
(home.treasury.gov, fetched direct 2026-09-05, HTTP 200, 17,195 bytes, text layer decompressed).
FOMC meeting dates come from **federalreserve.gov/monetarypolicy/fomccalendars.htm** (fetched direct
2026-09-05, HTTP 200), with publication dates derived by that page's own stated rule; the 10-07
publication is separately confirmed on the Fed's **October 2026 page**. Buyback rows come from the
**Tentative Buyback Schedule PDF** (fetched direct 2026-09-05, HTTP 200, 125,547 bytes). VIX is the
2026-09-04 close.

### Conviction legs, tested

**1. The date, time and `estimate` status are right — SUPPORTED.** The schedule PDF carries the row
verbatim: `10-Year NOTE R · Announcement Thursday, October 01, 2026 · Auction Wednesday, October 07,
2026 · Settlement Thursday, October 15, 2026`. That matches the checked-in entry exactly, including
settlement. The 1:00pm ET time is Treasury's standing convention and is **not** separately sourced —
the entry says so and this doc does not upgrade it. `estimate` is correct on both stated counts.

**2. The second reopening is the slot that collides with the FOMC minutes — SUPPORTED, with no
exceptions in the sample. This is the finding.** The Fed's calendar page states the rule verbatim:
*"The minutes of regularly scheduled meetings are released three weeks after the date of the policy
decision."* Applying +21 days to every meeting on that page and intersecting with the 44 completed
auctions:

| Slot | Auctions since 2023-01 | Shared the day with FOMC minutes |
|---|---|---|
| New issue ($42B) | 15 | **0** |
| 1st reopening, 9Y11M ($39B) | 14 | **0** |
| 2nd reopening, 9Y10M ($39B) | 15 | **9** |

The nine: 2023-04-12, 2023-10-11, 2024-04-10, 2024-10-09, 2025-04-09, 2025-07-09, 2025-10-08,
2026-04-08, 2026-07-08. The mechanism is plain once seen — quarterly refunding puts the second
reopening in the month after next, the Fed meets eight times a year, minutes publish on a Wednesday
three weeks later, and 10-Year auctions price on Wednesdays. 2026-10-07 is the next instance: the
Fed's own October 2026 page reads `2:00 p.m. — FOMC Minutes — Meeting of September 15-16 — 7`, and
+21 days from the 09-16 decision reproduces that date exactly.

**3. …but the collision is an attribution hazard, not a variance event — SUPPORTED as a null, and it
is the honest half of leg 2.** Across the same 44 auctions, measuring the 10-Year CMT from prior
close to auction-day close:

| Sample | n | Mean move | Mean absolute move | Share of moves > 4bp |
|---|---|---|---|---|
| Auction + minutes | 9 | +0.78bp | 5.89bp (**4.25bp** ex one outlier) | 56% |
| Auction, no minutes | 35 | −0.97bp | 4.00bp | 54% |
| All sessions 2023–2026 | 919 | +0.11bp | 4.56bp | 52% |

The 5.89bp figure is carried by a single **+19bp** session (2024-04-10) that dominates the mean of
nine; the other eight collision days moved −2, −8, +2, +8, −8, −1, −4, +1bp. A Welch test on
absolute moves gives **t = 0.95** — nothing. And the auction *statistics* are indistinguishable too
(bid-to-cover 2.496 vs 2.518, t = −0.56; dealer share 13.67% vs 12.50%, t = 0.62), which is the
useful asymmetry: **the collision contaminates the tape and leaves the auction record clean**, so the
correct response is to grade the print and ignore the close, not to widen the risk estimate for the day.

**4. The 20-Year sibling's population correction does not port to the 10-Year — REFUTED here, in all
three tests.** The [10-21 ledger](treasury-20y-bond-2026-10-21.md) found 20Y new issues and
reopenings to be near-disjoint bid-to-cover populations. At the 10-Year:

| Slot | n | min | p25 | median | p75 | max | mean | mean comp. tendered |
|---|---|---|---|---|---|---|---|---|
| New issue | 15 | 2.32 | 2.43 | 2.48 | 2.56 | 2.66 | 2.483 | $100.73B |
| 1st reopening (9Y11M) | 14 | 2.35 | 2.51 | 2.55 | 2.64 | 2.70 | 2.544 | $95.65B |
| 2nd reopening (9Y10M) | 15 | 2.34 | 2.48 | 2.53 | 2.58 | 2.67 | 2.516 | $93.56B |

Those three ranges are almost coextensive, not disjoint. The paired test is weaker still: comparing
each reopening to **its own CUSIP's** new issue, the reopening won **19 of 28** (mean +0.049,
t = 1.68) against the 20-Year's 24 of 28. And comparing the first reopening to the second *within the
same CUSIP* — the comparison a reader will actually reach for on 10-07, because 09-09 is the same
security — gives **6 of 14** wins, mean −0.029, **t = −0.98**: nothing.

**5. …and the reason is exactly the mechanism the 20-Year doc named, which makes this a validation of
it rather than a contradiction — SUPPORTED.** That doc's claim was that the 20-Year's apparent
reopening premium is a *denominator effect*: the offering shrinks faster than the bidding does. The
10-Year is the out-of-sample case where the size step is small. Offering falls **$42B → $39B
(−7.1%)** against the 20-Year's $16B → $13B (−19%); gross competitive tendered dollars fall in step
(−6.1% on slot means), and the residual cover lift is **+1.9%** against the 20-Year's +8%. Where
there is no size wedge, there is no population split. Both docs are consistent; only the conclusions
differ, and they differ for a measured reason.

**6. The tape-tracking statistic is the dealer takedown, not bid-to-cover — MIXED, and reported as a
hypothesis rather than a result.** Correlations of each auction statistic against the same-day
10-Year move (n=44):

| Statistic | corr | t | Reading |
|---|---|---|---|
| Primary-dealer share | **+0.327** | **2.24** | more paper stuck with dealers → yields up |
| Direct-bidder share | −0.310 | −2.11 | the compositional mirror of the above |
| Bid-to-cover | −0.214 | −1.42 | **not significant** |
| Indirect share | +0.024 | 0.16 | nothing |

Splitting on dealer share: takedown ≥15% (n=14) averages **+0.86bp**, ≤10% (n=11) averages
**−1.82bp**. The direction is the intuitive one — the dealer share is the residual after end users
are filled, so it measures the demand shortfall directly while the cover ratio measures gross
interest including bids nowhere near the clearing price. **Four correlations were tested on one
44-row dataset with no multiple-comparison correction**, so a t of 2.24 is worth roughly one
observation of confirmation, not a promotion. Recorded so 10-07 can test it out of sample.

**7. The predecessor record is favourable and primary-verified — SUPPORTED.** The August cycle's new
issue (2026-08-12, CUSIP 91282CRF0, $42B, 4.625% coupon) printed high yield **4.683%**, bid-to-cover
**2.53**, indirect **76.73%**, direct 14.67%, **dealer 8.60%** — all read this session from
`auctions_query`, and matching the figures the 09-09 sibling primary-verified on 2026-09-02. Dealer
takedown at 8.60% is in the strongest decile of the whole sample, and it sits inside a regime shift
the same data shows plainly: mean dealer share was **14.51%** across 2023–24 and is **10.62%** across
2025–26, with exactly one reading above 15% since 2025-01-07. On leg 6's own reading, end-user demand
for the benchmark has been improving for two years.

**8. The 10-Year auction day is not a bigger tape event than any other tenor's — SUPPORTED, and it
deflates a framing this calendar carries.** The 09-09 sibling argues a weak 10-Year print would be
"a materially bigger signal than a soft 20Y/30Y because the 10Y sets the whole curve." Measured on
the 10-Year CMT itself, by which tenor auctioned that day:

| Auction that day | n | Mean 10Y move | Mean absolute 10Y move |
|---|---|---|---|
| 3-Year | 44 | +0.30bp | 3.84bp |
| **10-Year** | 44 | **−0.61bp** (t = −0.70) | **4.39bp** |
| 20-Year | 44 | −0.52bp | 4.43bp |
| 30-Year | 44 | +0.34bp | 5.30bp |
| All sessions | 919 | +0.11bp | 4.56bp |

Every auction day is *quieter* than an average session on this measure, and the 10-Year's own is
quieter than the 30-Year's. The benchmark auction may well carry more *meaning* — that is leg 4 of
the 09-09 doc and this session does not dispute it — but it does not carry more *movement*, and the
drift the 20-Year doc found significant (−1.77bp, t = −2.28) is **not** significant here (−0.61bp,
t = −0.70). The guard around this event survives; the reason for it should be attribution and
compounding, not variance.

**9. The corridor is dense and two of its dated events were unlisted — SUPPORTED.** Within five days
of 10-07 the calendar already carries jobs (10-02), the OPEC+ JMMC (10-04), ISM services (10-05), the
MRVL investor day and the 3-Year note (10-06), the FOMC minutes (10-07), the ECB account and the
30-Year bond (10-08), and the IMF/World Bank meetings (10-12). Two liquidity-support **buyback
operations** on the same Treasury schedule were not: **2026-10-06, Nominal Coupons 2Y to 3Y**
(announce 10-05, 1:40–2:00pm ET, settle 10-07, maturity range 10/07/2028–10/06/2029, min $0, max $4
billion) and **2026-10-08, Nominal Coupons 20Y to 30Y** (announce 10-07, 1:40–2:00pm ET, settle
10-09, maturity range 10/09/2046–10/08/2056, min $0, max $2 billion). Both are proposed in this PR as
`estimate`. Note the second one's published cap is stale for the same reason the
[10-15 operation's](treasury-buyback-10y20y-2026-10-15.md) is: press release **sb0607** doubled the
10-20Y and 20-30Y sector caps to at least $4B effective 2026-09-09 through 2026-11-04, and the
schedule has not been republished. Neither operation touches the 10-Year sector, so neither is a
technical bid for this security — they matter as corridor traffic, and because the 10-08 announcement
lands the same afternoon as this auction.

**10. Current conditions are logged and are nearly worthless at D-32 — stated so rather than dressed
up.** As of the 2026-09-04 close: CMT 2Y **4.37** · 5Y 4.54 · 10Y **4.78** · 20Y 5.25 · 30Y **5.24**;
VIX **14.53**, still near the 2026 low. The week's macro was a large upside payroll surprise
(**+162,000** vs ~53,000 consensus) that moved September hike odds to the low-50s, and the Fed
communications blackout began 09-05. All of it resolves through the **09-16 FOMC, 21 days before this
auction**, and then again through the 10-14 CPI. Recorded as the baseline the next pulse diffs
against, not as information about 10-07.

### What plays the conditions support

None. `symbols: []`, the date is `estimate`, no house playbook is rates-keyed, and legs 3 and 8 put
this event's own price impact at a few basis points in a tenor nobody here trades. The supported
behaviour is a **read**, and what this doc adds to it is a reading rule and a better statistic.

### Honest limits

- **No tail and no when-issued yield.** `auctions_query` publishes high/low/median yield but not the
  WI level, so the single most diagnostic auction statistic cannot be computed from the primary. Every
  tail figure this calendar carries is press-sourced.
- **Leg 6 is four tests on one dataset.** No multiple-comparison correction was applied and none of
  the four was pre-registered. Treat +0.327 as a lead, not a finding.
- **Leg 3's null rests on n=9**, one of which is a 19bp outlier this session did **not** attribute to
  any cause. A t of 0.95 cannot distinguish "no effect" from "an effect too small for nine
  observations," and the honest statement is the second one.
- **Auction-day CMT is a 3pm-close measure against a 1:00pm auction and a 2:00pm minutes release**,
  so it captures the whole session. That cuts *for* leg 3's attribution point and *against* leg 8's
  calm reading, which over-attributes macro to auctions.
- **The minutes-collision count depends on a derived date.** The Fed's calendar page gives meeting
  dates and states the three-week rule; publication dates were computed from it rather than scraped
  per-release. The rule reproduced the independently-sourced 2026-10-07 date exactly, but a
  historical release that slipped off +21 days would not have been caught.
- **The direct predecessor has not happened.** 91282CRF0's first reopening is **2026-09-09**, four
  days from now; this doc is written before it, and its print is the single most load-bearing fact
  the next assessment carries.
- **Percentages are on the competitive base** (indirect + direct + dealer); dividing by
  `total_accepted` includes SOMA add-ons and gives materially different numbers.

## Stance & kill switches

**Stance (date `estimate`; size $39B and CUSIP 91282CRF0 primary-sourced and already owned by
[`FT-treasury-coupon-announcement-2026-10-01-1`](../forward-tests.md)).** No position, no directional
bet, no exposure sized off this event — `symbols: []` and an `estimate` date widen caution and license
nothing. The substantive stance is a **reading rule with two halves**. First, on 2026-10-07 the
close-to-close yield move is **not evidence about this auction**: the FOMC minutes publish 60 minutes
after it prices, the collision is structural rather than incidental (9 of 15 second reopenings, 0 of
29 other slots), and the nine prior instances show the auction record staying clean while the tape
does not. Second, the print is graded on the **pooled** 44-auction distribution — floor 2.32, median
2.53, max 2.70 — because every slot cut tested null at this tenor, and the leading indicator inside
that print is the **dealer takedown**, not the cover ratio. Two expectations are registered:
[`FT-treasury-10y-note-2026-10-07-1`](../forward-tests.md) (bid-to-cover clears 2.45) and
[`FT-treasury-10y-note-2026-10-07-2`](../forward-tests.md) (dealer takedown stays below 13%).

**Kill switches:**

- **A single-session 10-Year move greater than 13bp on 2026-10-07** — outside eight of the nine prior
  collision days. Leg 3's null would fail in the one observation it was written for, and the
  auction+minutes pairing would go back to being a variance event rather than an attribution problem.
- **Bid-to-cover below 2.32 on 2026-09-09 or 2026-10-07** — the 44-auction floor for any nominal
  10-Year since 2023. Demand deterioration would be live and this doc's yardstick work would be beside
  the point; the stance gets re-derived, not patched.
- **Dealer takedown above 15% on 2026-10-07** — one reading above that line since 2025-01-07. Under
  leg 6 that is the weak-print tell, and it would land on a day whose tape cannot corroborate it —
  precisely the case the reading rule exists for.
- **The 2026-10-01 announcement printing a size other than $39B or a CUSIP other than 91282CRF0** —
  every claim above treats issuance as settled. Owned and scored by
  `FT-treasury-coupon-announcement-2026-10-01-1`; listed here because it invalidates this doc too.
- **The 2026-09-09 first reopening printing outside 2.32–2.70** — the pooled range this doc adopts,
  broken by the immediately preceding sale of the same security. Would say leg 4's null was a
  historical artifact and the slot taxonomy deserves another look before 10-07.
- **A hawkish 09-16 FOMC or a hot 10-14 CPI re-opening the long end** — leg 10 is a baseline, not a
  forecast. Neither changes the reading rule, but both change what this sale sells into.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-32 | Initial research banked (doc above); the calendar entry is one day old, created by the 10-01 coupon-announcement sweep. Written Saturday, so all readings are the 09-04 close. **Event tape — the finding, computed this session from Treasury and Fed primaries, not carried.** Intersecting `auctions_query` (`original_security_term:eq:10-Year`, TIPS excluded via `inflation_index_security`, **44 completed nominal auctions** since 2023-01) with FOMC minutes publication dates derived from federalreserve.gov's own stated three-week rule: **9 auctions shared their day with a minutes release and all 9 were second reopenings** — 9/15 in that slot, **0/29** at new issues and first reopenings. **2026-10-07 is the next one**: auction 1:00pm ET, minutes **2:00pm ET** per the Fed's October 2026 page (fetched direct today), and +21d from the 09-16 decision reproduces that date exactly. **The collision is an attribution hazard, not a variance event** — collision days average 5.89bp of absolute 10Y movement, but **4.25bp excluding one +19bp outlier (2024-04-10)** against **4.00bp** on the other 35 auction days (Welch **t = 0.95**), and >4bp moves run 56% / 54% / 52% across collision / non-collision / all 919 sessions. The auction *statistics* are indistinguishable (b/c 2.496 vs 2.518, t = −0.56; dealer 13.67% vs 12.50%, t = 0.62), so the record stays clean while the tape does not. **Second measurement: the [20Y sibling](treasury-20y-bond-2026-10-21.md)'s population correction does NOT port** — 10Y new issues cover 2.32–2.66, 1st reopenings 2.35–2.70, 2nd reopenings 2.34–2.67 (near-coextensive); paired against its own CUSIP the reopening won **19/28** (t = 1.68), and r1→r2 within the same CUSIP **6/14** (t = −0.98). That doc's own denominator mechanism explains it: the 10Y size step is **$42B→$39B (−7.1%)** against the 20Y's −19%, tendered dollars fall −6.1% in step, residual cover lift **+1.9%** vs the 20Y's +8% — an out-of-sample validation of the mechanism, not a contradiction. **Third: the tape-tracking statistic is the dealer takedown, not bid-to-cover** — corr(dealer%, same-day 10Y move) **+0.327 (t = 2.24)**, direct% −0.310 (t = −2.11), **bid-to-cover −0.214 (t = −1.42, not significant)**, indirect% +0.024. Dealer ≥15% (n=14) averages +0.86bp, ≤10% (n=11) −1.82bp. Four correlations, one dataset, no correction — logged as a hypothesis. **Fourth: the benchmark auction is not the bigger tape event** — mean absolute 10Y move by auctioning tenor: 3Y 3.84bp · **10Y 4.39bp** · 20Y 4.43bp · 30Y 5.30bp · all sessions 4.56bp, and the 10Y's own drift (−0.61bp, t = −0.70) is **not** significant where the 20Y's was. **Primary verification:** Tentative Auction Schedule PDF (fetched direct today, HTTP 200, 17,195 bytes) carries `10-Year NOTE R / ann Thursday, October 01, 2026 / auc Wednesday, October 07, 2026 / set Thursday, October 15, 2026` verbatim — entry exact. Predecessor re-read from the primary: **2026-08-12, CUSIP 91282CRF0, $42B, 4.625% coupon, high yield 4.683%, b/c 2.53, indirect 76.73%, direct 14.67%, dealer 8.60%**; dealer share has regime-shifted from a 14.51% mean in 2023–24 to **10.62%** in 2025–26 with one reading above 15% since 2025-01-07. Size $39B and the CUSIP stay with `FT-treasury-coupon-announcement-2026-10-01-1` and are deliberately not re-registered. **Macro:** August payrolls **+162,000** vs ~53,000 consensus (09-04), September hike odds in the low 50s, Fed blackout live from 09-05 — all resolving at the **09-16 FOMC, 21 days before this auction**; logged as baseline, not signal. **Rates levels (CMT 09-04):** 2Y 4.37 · 5Y 4.54 · **10Y 4.78** · 20Y 5.25 · 30Y 5.24. **Volatility:** VIX **14.53** (09-04 close), near the 2026 low; no regime change. **Geopolitical / energy:** the Hormuz-driven Brent leg the sibling ledgers carry, unchanged in kind this pass. **Peers:** n/a — `symbols: []`. **New dated adjacencies found → proposed in this PR:** two unlisted liquidity-support buyback operations from the Tentative Buyback Schedule PDF (fetched direct today, HTTP 200, 125,547 bytes) — **2026-10-06 Nominal Coupons 2Y to 3Y** (ann 10-05, 1:40–2:00pm ET, settle 10-07, 10/07/2028–10/06/2029, $0–$4B) and **2026-10-08 Nominal Coupons 20Y to 30Y** (ann 10-07, 1:40–2:00pm ET, settle 10-09, 10/09/2046–10/08/2056, $0–$2B published, **superseded to ≥$4B by sb0607** through 11-04). Both `status: estimate` (`EST:`) per this lane's no-self-confirm limit; neither touches the 10Y sector, so neither is a technical bid for this security. Everything else dated in the 5-day corridor is already tracked. **Forward tests registered:** `FT-treasury-10y-note-2026-10-07-1` (bid-to-cover clears **2.45**, base rate 34/44 disclosed up front) and `FT-treasury-10y-note-2026-10-07-2` (dealer takedown below **13.0%**, base rate 23/44 all-sample but 11/12 in the recent regime), both scoring 2026-10-08. | — (stance set: read-don't-trade, plus a reading rule — grade the print, not the close — and a better grading statistic) | 2026-09-26 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
