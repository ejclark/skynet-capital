# 5-Year TIPS auction (new issue) — treasury-5y-tips-2026-10-22

**Kind:** rates · **Date:** 2026-10-22 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — row reads `5-Year TIPS T / Thursday, October 15, 2026 / Thursday, October 22, 2026 / Friday, October 30, 2026`; 1:00pm ET is standing convention and is NOT separately sourced) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-quiet-period-start-2026-10-21","fomc-blackout-start-2026-10-17","treasury-20y-bond-2026-10-21"],"screenStreak":0} -->

## At a glance

**TL;DR.** The size of this auction is already spoken for — `sb0590` guides **$26B** and
[`FT-treasury-coupon-announcement-2026-10-15-1`](../forward-tests.md) already scores it on 10-16. So
the question this doc actually answers is the one nobody has asked: **what the auction itself reads.**
Two things, both measured this session from primaries. First, **the stop is trackable today, for
free** — the 5-Year TIPS auction high yield has landed within **±4.1bp of the same-day 5-Year CMT
real yield in 14 of 14 auctions since 2023** (mean +0.2bp), and that series currently sits at
**2.17% (09-04), the 93rd percentile of its 2026 range and 5bp off the year's high**. Priced there,
this new issue stops at the **highest 5-Year TIPS real yield since April 2024** and carries a
**2.125% coupon**. Second, **the flat guidance is not a demand retreat, and reading it as one would
be the error.** The last four 5-Year TIPS auctions covered **2.51 / 2.62 / 2.57 / 2.61** with
**record direct-bidder participation (26.7% and 27.9%)** and record tendered volume (**$70.1B**,
2026-04) — the deepest bid the series has recorded, at exactly the tenor Treasury chose to stop
growing. The 10-Year point is going the other way (July 2026 new issue covered **2.30**, the softest
in the 2023+ sample), so 2026 TIPS demand is **tenor-split**, not uniformly firm. Date is
`estimate`, `symbols: []`, no house playbook is rates-keyed: **read it, do not trade it.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-47) | **Stand aside** | High | Saturday — no session; 09-07 is Labor Day and the next print is 09-08. This auction's own terms do not exist until the **2026-10-15** announcement, and its size is already owned by a registered test. | Treasury moving the 5-Year TIPS off **2026-10-22**, or pre-announcing a TIPS size change before then — either voids the deductive frame this doc inherits |
| This week | **Watch the 5-year real yield, not this auction** | High | The stop tracks the 5Y CMT real yield (±4.1bp, 14/14) and that series is 5bp off its 2026 high; nothing between now and 10-15 changes the auction, only its indicated level. | The 5Y CMT real yield falling below **1.875%** on any session through **2026-09-11** — a 30bp drop happens in 14.8% of 33-session windows (2023-2026) and would wipe out the "highest since April 2024" framing seven weeks early |
| This month | **Watch the tenor split, not the TIPS complex** | Medium | 5-Year demand is at record depth while the 10-Year point softened to a 2.30 cover in July 2026 — a divergence a "TIPS demand" headline would flatten. | The **2026-09-17** 10-Year TIPS reopening covering **at or above 2.51** (the 5Y slot's own October-2025 level) — that would make the split noise rather than a tenor story |
| This quarter | **Real-rate story, still — and this is the cleanest place to test it** | Medium | The 5-year point's 2026 move decomposes **+80bp nominal = +71bp real + 9bp breakeven** (89% real), and the breakeven sits at only the **37th percentile** of its own 2026 range. | The 5-year breakeven printing above **2.72%** (its 2026 high, set 2026-05-04) on any session through **2026-10-22** — inflation expectations, not term premium, would then own the move |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date is `estimate`, and no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed.
- **The stop tracker, quotable today:** 5Y TIPS stop ≈ same-day 5Y CMT real yield, **±4.1bp, 14/14 since 2023-04** (mean +0.2bp). At **2.17%** the indicated coupon is **2.125%** (`floor(stop / 0.125)`, exact on **13 of 13** new issues since 2018).
- **The demand tell (the distinctive one):** direct-bidder share. It ran **17-18%** for six straight years, then **24.3 / 21.9 / 26.7 / 27.9%** across the last four 5-Year TIPS auctions. Below **20%** on 10-22 says that was an episode, not a level.
- **The weak-demand tell:** a cover below **2.36**, the softest of the seven October new issues (2023). The full new-issue floor since 2018 is **2.28** (2025-04).
- **Checked and NOT a finding:** 10-22 also carries a **~$213B** nominal announcement (2Y $69B · 5Y $70B · 7Y $44B · 2Y FRN $30B, `sb0590` Oct-26 row) at ~11:00 ET, two hours before this auction — including a same-tenor 5-Year note. That pairing is **7 for 7** since 2019 and is already inside the 2.36-2.75 cover band. Structural, not a risk.
- **What this doc cannot score, said up front:** fiscaldata publishes no when-issued yield, so **whether the auction tails is not measurable** from the primary used here. Only the level and the demand shares are.
- **Watch (dated):** CPI **10-14** · announcement **10-15** · dealer agenda + opex **10-16** · FOMC blackout opens **10-17** · 20Y reopening **10-21** · **this auction + the $213B nominal announcement 10-22** · FOMC **10-28** · settlement **10-30** · borrowing estimates **11-02** · refunding **11-04**.

## Initial research

### The question, plainly

This event was created 2026-09-05 by the
[`10-15 coupon-announcement`](treasury-coupon-announcement-2026-10-15.md) initial research, which
found a **5-Year TIPS new issue** sharing that announcement — a security no doc in this calendar had
noticed. That session took the interesting half of the story with it: the **size**, guided flat at
$26B against a five-year annual ratchet, is registered as
`FT-treasury-coupon-announcement-2026-10-15-1` and scores 2026-10-16, six days before this auction
happens.

Which sets the trap. If this doc is "the auction sells $26B, as already written," it duplicates a
registered prediction and adds nothing — the same trap the 10-15 session named for itself. So the
question here is the one the announcement doc structurally could not ask: **the announcement settles
the supply; what does the auction settle?** Concretely: what is this security indicated to price at,
is that knowable in advance, and does the demand record support or undercut the reading that TIPS
issuance growth stopped in 2026?

**One-line verdict:** two things, both new to this calendar. The stop is **trackable in real time
from a free daily Treasury series** (±4.1bp, 14/14 since 2023), and it currently indicates the
highest 5-Year TIPS real yield since April 2024 — while the demand record shows the **deepest bid
the 5-Year TIPS series has ever recorded**, which means the flat guidance is a supply-management
choice and not a retreat from a soft bid. The 10-Year point is softening at the same time, so the
honest shape is a **tenor split**, not a complex-wide verdict.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). Everything
quantitative below was fetched from a primary **this session (2026-09-05)** and re-derived rather
than inherited, including the numbers the parent already published:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain
  curl, HTTP 200, **17,195 bytes**, PDF streams inflated and text operators read in document order.
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590` (2026-08-05 quarterly refunding
  statement), HTTP 200, **75,576 bytes**, tag-stripped and read in full.
- **The auction record** — `api.fiscaldata.treasury.gov` `auctions_query`, two server-side-filtered
  pulls: all `inflation_index_security: Yes` since 2018-01-01 (**105 rows**), and all nominal
  `original_security_term: 5-Year` notes since 2018-01-01, used to date the month-end announcements.
- **The tape** — Treasury's own daily par and daily **real** yield-curve CSVs, full-year files for
  2023, 2024, 2025 and 2026 (**920 sessions**), and Yahoo `^VIX` daily closes.

### Conviction legs, tested

**1. The date, security type and new-issue reading are right — SUPPORTED, re-derived from the
primary rather than inherited.** The Tentative Auction Schedule's own text, in document order:
`5-Year TIPS T / Thursday, October 15, 2026 / Thursday, October 22, 2026 / Friday, October 30,
2026`. The `T` is the TIPS marker; there is no `R`, so it is a new issue. The neighbouring row reads
`20-Year BOND R / Thursday, October 15, 2026 / Wednesday, October 21, 2026 / Friday, October 23,
2026`, matching the calendar's `treasury-20y-bond-2026-10-21` entry. Independent corroboration on
the new-issue reading: in `fiscaldata`, the October 5-Year TIPS slot is a **new issue in all seven
years it has existed** (2019-2025), with the reopening landing each December. Two supports, neither
of them the schedule's legend — which was not fetched, and is disclosed in the limits.

**2. The auction stop is knowable in advance from a free public series — SUPPORTED, 14/14, and this
is the finding.** Every 5-Year TIPS auction since 2023 against Treasury's own daily 5-Year CMT real
yield published for the same date:

| Auction | Type | Stop | 5Y CMT real, same day | Basis |
|---|---|---|---|---|
| 2023-04-20 | new | 1.320 | 1.35 | −3.0bp |
| 2023-06-22 | reopen | 1.832 | 1.85 | −1.8bp |
| 2023-10-19 | new | 2.440 | 2.43 | +1.0bp |
| 2023-12-21 | reopen | 1.710 | 1.69 | +2.0bp |
| 2024-04-18 | new | 2.242 | 2.24 | +0.2bp |
| 2024-06-20 | reopen | 2.050 | 2.05 | 0.0bp |
| 2024-10-24 | new | 1.670 | 1.70 | −3.0bp |
| 2024-12-19 | reopen | 2.121 | 2.08 | **+4.1bp** |
| 2025-04-17 | new | 1.702 | 1.69 | +1.2bp |
| 2025-06-17 | reopen | 1.650 | 1.64 | +1.0bp |
| 2025-10-23 | new | 1.182 | 1.19 | −0.8bp |
| 2025-12-18 | reopen | 1.433 | 1.40 | +3.3bp |
| 2026-04-23 | new | 1.367 | 1.38 | −1.3bp |
| 2026-06-18 | reopen | 1.955 | 1.96 | −0.5bp |

**Mean +0.2bp, range −3.0 to +4.1bp, 14 of 14 inside ±4.1bp.** This is not surprising — the CMT
curve is built from the same market the auction clears into — but it had not been measured here, and
it converts a daily public file into a live indication of where this auction prices. It is what lets
every horizon call above be stated in levels rather than in adjectives.

**3. Priced at today's tape, this is the highest 5-Year TIPS stop since April 2024 — SUPPORTED as an
indication, not a forecast.** The 5-Year CMT real yield closed **2.17% on 2026-09-04**. Against the
2026 file (171 sessions): the year's high is **2.22% (07-27)**, the low **1.11% (02-27)**, and 2.17
sits at the **93rd percentile** with only **8 sessions all year** within 5bp of the high. Stops above
2.17 since 2023 number exactly two — 2023-10-19 (2.440) and 2024-04-18 (2.242) — so an auction there
would be the highest 5-Year TIPS clearing real yield in **two and a half years**. The coupon follows
mechanically: TIPS coupons are set at the largest ⅛% increment not above the stop, which reproduces
**13 of 13** new issues since 2018 exactly (the 10 apparent misses in the raw data are all
reopenings, which inherit their own CUSIP's coupon — a distinction worth stating because ignoring it
makes the rule look 23/33). At 2.17% that gives **2.125%**, tying April 2024 for the highest 5-Year
TIPS coupon since October 2023's 2.375%. **This is an indication and nothing more:** the CMT is an
interpolated constant-maturity series, the CUSIP's own when-issued yield does not exist until the
10-15 announcement, and 47 calendar days is roughly 33 sessions of drift.

**4. The move that got the 5-year point here is real-rate, not inflation — SUPPORTED, and stated on
the un-cherry-picked window.** Year to date (2026-01-02 → 2026-09-04), the 5-year point:

| | 01-02 | 09-04 | Δ |
|---|---|---|---|
| Nominal 5Y (par) | 3.74 | **4.54** | **+80bp** |
| Real 5Y | 1.46 | **2.17** | **+71bp** |
| Breakeven (derived) | 2.28 | **2.37** | **+9bp** |

**89% of the 2026 nominal move is real-rate.** The trough-anchored version is starker and is
disclosed as trough-anchored rather than led with: from 2026-03-17 the nominal is +75bp against real
**+100bp** and breakeven **−25bp** — i.e. inflation expectations *fell* while nominals rose. Either
window gives the same read, and the breakeven's own position corroborates it: **2.37% is the 37th
percentile** of a 2026 range of **2.16 (07-28) to 2.72 (05-04)**. This is the same framing the
[10-Year TIPS sibling](treasury-10y-tips-2026-09-17.md) carries at its own tenor, re-derived here
independently at five years rather than inherited.

**5. The flat guidance is NOT a demand retreat — SUPPORTED, and this is the leg that inverts the
naive read.** The parent doc established that `sb0590` guides the October 5-Year TIPS flat at $26B
against a five-year ratchet, and that the July 10-Year TIPS new issue also held flat — "a
complex-wide halt in TIPS issuance growth in 2026." The obvious inference is that Treasury backed
off because the bid was soft. The auction record says the opposite at this tenor:

| Auction | Size | Cover | Direct | Indirect | Dealers | Tendered |
|---|---|---|---|---|---|---|
| 2024-10-24 (new) | $24B | 2.40 | 17.3% | 74.5% | 7.9% | $57.9B |
| 2025-04-17 (new) | $25B | **2.28** | 17.6% | 63.7% | **17.9%** | $58.7B |
| 2025-10-23 (new) | $26B | 2.51 | 24.3% | 61.8% | 13.4% | $66.6B |
| 2025-12-18 (reopen) | $24B | 2.62 | 21.9% | 72.4% | 5.4% | $65.4B |
| 2026-04-23 (new) | $26B | 2.57 | **26.7%** | 64.1% | 8.4% | **$70.1B** |
| 2026-06-18 (reopen) | $24B | 2.61 | **27.9%** | 68.3% | **3.4%** | $66.2B |

Direct-bidder share sat in a **17-18% band for six straight years** (2021-04 through 2025-04, every
new issue) and then stepped to **24.3 / 21.9 / 26.7 / 27.9%** across the last four auctions —
**26.7% is a record for a 5-Year TIPS new issue** in the 2018+ pull, and $70.1B tendered is a record
outright. Dealer takedown, the residual that measures what nobody else wanted, fell to **8.4% and
3.4%** from the 17.9% stress print of April 2025. So Treasury stopped growing this tenor into the
deepest bid it has ever drawn there, which makes "maintain TIPS auction sizes at current levels" a
statement about overall financing and portfolio composition, not a concession to weak demand.

**6. But the TIPS complex is tenor-split, and calling it uniformly strong would be wrong — MIXED,
and this is the honest correction to leg 5.** Same pull, the 10-Year point: the **July 2026 new
issue covered 2.30**, the softest of the eight 10-Year TIPS new issues since 2023 (2.79, 2.51, 2.62,
2.38, 2.48, 2.41, 2.38, **2.30**), and the [10-Year sibling](treasury-10y-tips-2026-09-17.md)
records that same auction stopping at **2.438% real — a 17-year high — with a ~2.8bp tail.** The
30-Year point cuts the other way again: the 2026-08-20 reopening covered **2.82** with a **2.1%**
dealer takedown, the strongest cover and the lowest dealer residual in that series since 2023. So
the shape of 2026 TIPS demand is **strong at 5 years, softening at 10, strong at 30** — three
different stories. Anything that says "TIPS demand is X" without a tenor is flattening this.

**7. The same-day $213B nominal announcement is structural, not a risk — REFUTED as a finding, and
recorded because it looked like one.** The schedule puts the entire month-end nominal block on this
auction's own date: `2-Year NOTE` (auction 10-26), `5-Year NOTE` (10-27), `2-Year FRN` (10-28) and
`7-Year NOTE` (10-29) all announce **Thursday, October 22, 2026**. Sized off `sb0590`'s Oct-26 row
(`69 58 70 44 39 13 22 30`, re-read verbatim this session), that is **$69B + $70B + $44B + $30B =
~$213 billion** announced at ~11:00 ET — including a **same-tenor 5-Year nominal note at $70B** —
two hours before a $26B real-yield auction prices. That reads like a tenor-matched supply headwind
landing inside the bid window. It is not new: testing every October 5-Year TIPS new issue against
the nominal 5-Year note's own `announcemt_date` in `fiscaldata` gives **7 for 7** — 2019, 2020,
2021, 2022, 2023, 2024 and 2025 all sold the TIPS on the day the month-end block was announced. The
pairing is Treasury's standing calendar structure, it is already inside the **2.36-2.75** cover band
those seven auctions produced, and the same-day nominal 5-Year has grown from $41B (2019) to $70B
(2024 onward) across that record without the TIPS cover deteriorating. Discarded as a signal;
recorded so the next session does not rediscover it as one.

**8. The auction sells inside the FOMC blackout, which makes it a cleaner read than its September
sibling — SUPPORTED as a structural fact.** The Fed's blackout for the Oct 27-28 meeting runs
**2026-10-17 → 2026-10-29** (`fomc-blackout-start-2026-10-17`, `FED:`-sourced), so 10-22 falls
squarely inside it: **no Fed speaker can move the front end in the days before this stop.** That is
the mirror image of the [09-17 10-Year TIPS](treasury-10y-tips-2026-09-17.md), which sold the day
*after* an FOMC and had to be read through a fresh policy signal. Here the stop is a market-set real
yield with no official communication in the window, six sessions ahead of a meeting that
[`fomc-2026-10-28`](fomc-2026-10-28.md) grades a **genuine coin flip** on a hike. That ledger's own
measured finding sharpens why this matters: on this chair, hawkish surprises price into the **front
end of the curve, not equity volatility** (2026-08-28: 2y **+8bp**, S&P −0.13% to −0.25%, VIX
closing at the 2026 low). A 5-year real-yield auction is close to the purest instrument this
calendar has for that channel.

**9. No tracked name is exposed through this event — SUPPORTED, inherited.** `symbols: []`. The
duration channel that hit CRWV −12.1% and SOX −5% on 2026-08-18 is a real-rate transmission and this
auction is a *reading* of that rate, not a driver of it. Sensitivity tiering, if a pulse ever needs
it, is unchanged from the 10-Year sibling: CRWV highest, then NVDA/AVGO/MRVL, then mega-cap, least
AAPL/AMZN. Nothing here licenses a position in any of them.

**10. Current tape, recorded as the baseline the next pulse diffs against.** Treasury par curve
**09-04**: 2Y **4.37** · 5Y **4.54** · 10Y **4.78** · 20Y **5.25** · 30Y **5.24**. Real curve, same
publisher and date: 5Y **2.17** · 10Y **2.43** · 30Y **2.96**. Derived breakevens: 5Y **2.37**, 10Y
**2.35**. **VIX 14.53** (09-04 close; 3-month range 14.25-22.22). **2026-09-05 is a Saturday**,
09-07 is Labor Day and the next session is 09-08, so 09-04 is the freshest close available and
nothing here is stale by neglect. Carried from the parent and not re-derived: the 5Y breakeven
sitting above the 10Y is the **norm** (146 of 171 2026 sessions), so it carries nothing.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What
they do support is three things.

**Quote a level, not an adjective.** Leg 2 means this calendar's rates ledgers can state where a
5-Year TIPS auction is indicated to price, from a file anyone can fetch, any day, at ±4bp — and can
say *today* that 10-22 is indicated at **~2.17% real / 2.125% coupon**, the highest since April
2024. The same tool works on 2026-12 (the reopening) and 2027-04 without new research.

**Stop saying "TIPS demand" without a tenor.** Legs 5 and 6 give three different answers at three
points on the curve in the same calendar year. The 5-Year record is the strongest in the series'
history; the 10-Year is the softest since 2023. A ledger that carries one of those as "TIPS demand"
will be wrong about the other two thirds of the complex.

**Read this auction as a pre-FOMC front-end probe.** Leg 8 is the reason to bother at all: a
market-set 5-year real yield, struck inside a communications blackout, six sessions before a
coin-flip meeting whose transmission channel this repo has already measured as *the front end*.
That is a conditioning input on the rate read the equity book carries into 10-27/10-29 — and it is
an input, never a trigger.

### Honest limits

**Nothing about this auction has happened**; every number is a document read or an indication. **The
size question is not this doc's** — `FT-treasury-coupon-announcement-2026-10-15-1` owns it and
scores 10-16, and re-registering it here would double-count one observation. **The stop tracker is
measured in one policy regime** (Fed on hold at 3.50-3.75% across the 14-auction window); an auction
struck into a live hiking repricing is out of sample for it, which is exactly the condition
`fomc-2026-10-28` says is ~50% likely. **The CMT is interpolated constant-maturity**, not CUSIP
912828-series when-issued, and no when-issued yield exists until the 10-15 announcement. **The
breakevens are curve-derived** (par nominal less par real), not traded instruments. **The tail is
not measurable here** — `fiscaldata` publishes no when-issued yield, so this doc can score the
auction's level and its bidder shares but not whether it stopped through or tailed, and it does not
pretend otherwise. **Bidder-class shares are Treasury's own classifications**; whether the
direct-bidder step-up reflects genuinely new investors or dealers routing through a different bid
channel was not investigated, and that alternative would weaken leg 5 without touching leg 6.
**Leg 8's blackout dates are inherited** from `fomc-blackout-start-2026-10-17`, and the ~1:00pm ET
auction time is unsourced standing convention, as the calendar entry discloses. **The date is
`estimate`** and this lane may not self-confirm it; the confirming primary is the 2026-10-15
announcement.

## Stance & kill switches

**Stance (date `estimate`; security type, dates and both guided sizes primary-sourced from
Treasury's own schedule and `sb0590`, all fetched 2026-09-05).** Watch-only, no standalone play, no
position — `symbols: []` and no house playbook is rates-keyed. This auction's **supply is settled in
writing and owned by another test**; its content is the **stop and the bidder shares**. Read it as
two things: a **live 5-year real-yield reading** that is trackable in advance to ±4bp from Treasury's
own daily file and currently indicates the highest 5-Year TIPS clearing yield since April 2024, and
a **demand check on the tenor where TIPS issuance growth stopped** — where the record shows the
deepest bid the series has ever drawn, not a soft one. The complex is **tenor-split**: strong at 5
years, softening at 10, strong at 30. Nothing here licenses an entry, and no duration-sensitive
position should be opened into the 1:00pm ET release.

**Two forward tests registered** in [`forward-tests.md`](../forward-tests.md), both scoreable
**2026-10-23**, deliberately split so that a method and a claim about the world are not scored as
one observation:

- **`FT-treasury-5y-tips-2026-10-22-1`** — the stop lands within **±5bp** of the 5-Year CMT real
  yield Treasury publishes for 2026-10-22. Base rate 14/14 at ±4.1bp; **a pass is near-uninformative
  and is disclosed as such**, and it is registered for its fail leg — the first out-of-sample point
  before other ledgers lean on the tracker.
- **`FT-treasury-5y-tips-2026-10-22-2`** — the new issue's **direct-bidder share is ≥20%** of the
  offering. Four consecutive auctions clear it; six prior years of new issues do not. This is the
  registrable half: it tests whether the demand step-up is a level or a twelve-month episode, and it
  is the leg the "flat guidance is not a demand retreat" reading rests on.

**Kill switches:**

- **Direct-bidder share below 20% on 2026-10-22** — the distinctive one. The step-up was an episode,
  the deepest-bid-ever framing loses its load-bearing evidence, and "Treasury stopped growing this
  tenor into a strong bid" gets re-derived rather than patched.
- **A cover below 2.36** — softer than any of the seven October new issues, at the largest size the
  slot has ever carried. Combined with the leg above it would flip the read to a genuine demand
  problem at the 5-year point.
- **The stop missing the same-day 5Y CMT real yield by more than 5bp** — the tracker breaks, every
  level quoted in this doc's calls becomes an adjective again, and the 12-2026 and 04-2027 auctions
  lose their free indication.
- **The 5-year breakeven above 2.72%** (its 2026 high, 05-04) at or before the auction — the
  real-rate decomposition in leg 4 stops holding at this tenor, and the framing needs reassessment,
  not a number update.
- **A 5-Year TIPS size other than $26B announced 2026-10-15** — owned and scored by
  `FT-treasury-coupon-announcement-2026-10-15-1` six days earlier; listed here because it kills this
  doc's premise too, and because it is the earliest dated tell available.
- **Treasury moving the auction off 2026-10-22, or a pre-announced TIPS size change** — voids rather
  than kills; announced-in-advance is a different question than announced-here.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-47 | **Initial research.** Event created 2026-09-05 by the [10-15 announcement sibling](treasury-coupon-announcement-2026-10-15.md), whose registered test already owns the **$26B** size — so this doc deliberately asks what the *auction* reads, not what it sells. **Finding 1 — the stop is knowable in advance, for free.** Every 5-Year TIPS auction since 2023 (n=**14**, `fiscaldata auctions_query`, server-filtered on `inflation_index_security`) landed within **±4.1bp** of Treasury's own same-day 5-Year CMT real yield, mean **+0.2bp**, worst miss +4.1bp (2024-12-19). That series closed **2.17% (09-04)** — **93rd percentile** of its 2026 range (high 2.22 on 07-27, low 1.11 on 02-27; only 8 sessions all year within 5bp of the high). Priced there the auction stops **higher than any 5-Year TIPS since 2024-04-18 (2.242%)** and carries a **2.125%** coupon — `floor(stop/0.125)`, exact on **13 of 13 new issues** since 2018 (the 10 raw-data misses are all reopenings inheriting their CUSIP's coupon). Indication, not forecast: CMT is interpolated, no when-issued exists until 10-15. **Finding 2 — the flat guidance is not a demand retreat, at this tenor.** Last four 5-Year TIPS auctions covered **2.51 / 2.62 / 2.57 / 2.61** with direct-bidder share **24.3 / 21.9 / 26.7 / 27.9%** after six straight years in a 17-18% band; **26.7% and $70.1B tendered (2026-04) are records** for the series, and dealer takedown fell to **8.4% / 3.4%** from April 2025's 17.9% stress print. **Finding 3 — but the complex is tenor-split, which corrects finding 2 rather than extending it:** the July 2026 **10-Year** TIPS new issue covered **2.30**, softest of eight since 2023 (sibling records a 2.438% 17-year-high stop, ~2.8bp tail), while the 2026-08-20 **30-Year** reopening covered **2.82** with a **2.1%** dealer residual, its strongest since 2023. Strong at 5, soft at 10, strong at 30. **Primary re-derivation (not inherited):** schedule PDF direct, HTTP 200, 17,195 bytes — `5-Year TIPS T / Thursday, October 15, 2026 / Thursday, October 22, 2026 / Friday, October 30, 2026`, no `R`; `sb0590` direct, HTTP 200, 75,576 bytes — TIPS FINANCING sentence and Oct-26 row `69 58 70 44 39 13 22 30` both verbatim. **Checked and DISCARDED as a non-finding:** 10-22 also carries the whole month-end nominal announcement — 2Y $69B · 5Y $70B · 7Y $44B · 2Y FRN $30B ≈ **$213B** at ~11:00 ET, including a same-tenor 5-Year note, two hours before this stop. Looked like a tenor-matched headwind; it is **7 for 7** since 2019 (every October 5Y TIPS new issue has sold on the month-end block's announcement date, `announcemt_date` matched in fiscaldata), already inside the 2.36-2.75 cover band, and the same-day nominal 5Y grew $41B→$70B across that record without cover deteriorating. Structural. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** the auction sells **inside the FOMC blackout** (10-17 → 10-29), so no Fed speaker can move the front end into the stop — the mirror of the [09-17 10Y TIPS](treasury-10y-tips-2026-09-17.md), which sold D+1 to a meeting; [`fomc-2026-10-28`](fomc-2026-10-28.md) grades 10-28 a coin flip on a hike and has measured this chair's hawkish surprises pricing into the **front end** (08-28: 2y +8bp, S&P −0.13% to −0.25%, VIX at the 2026 low). **Rates:** par 09-04 2Y **4.37** · 5Y **4.54** · 10Y **4.78** · 20Y **5.25** · 30Y **5.24**; real 5Y **2.17** · 10Y **2.43** · 30Y **2.96**; derived breakevens 5Y **2.37** (37th pct of a 2.16-2.72 2026 range), 10Y **2.35**. 2026 decomposition at the 5-year point: nominal **+80bp = real +71bp + breakeven +9bp**, i.e. **89% real-rate**; trough-anchored from 03-17 it is +75bp nominal on **+100bp real / −25bp breakeven**. **Volatility:** VIX **14.53** (09-04 close, 3-month range 14.25-22.22) — calm, no regime shift. **Geopolitical:** nothing new touching this channel this session; the `sb0607` doubled long-end buyback caps (≥$4B through 11-04) sit at 10-20Y/20-30Y and do not reach the 5-year TIPS point. **2026-09-05 is a Saturday** (Labor Day 09-07, next session 09-08), so 09-04 is the freshest close. **Adjacency — five tracked entries already inside the ±5-day corridor** (`fomc-blackout-start-2026-10-17`, `ecb-quiet-period-start-2026-10-21`, `treasury-20y-bond-2026-10-21`, `consumer-confidence-2026-10-27`, `durable-goods-2026-10-27`); **one genuinely new dated event PROPOSED** as `estimate` in this PR: **`treasury-coupon-announcement-2026-10-22`** — the ~$213B month-end nominal announcement that shares this auction's own date and had no calendar row, despite four sibling coupon-announcement entries already being tracked. **Two forward tests registered** — `FT-treasury-5y-tips-2026-10-22-1` (stop within ±5bp of the same-day 5Y CMT real yield; base rate 14/14, pass disclosed as near-uninformative) and `FT-treasury-5y-tips-2026-10-22-2` (direct-bidder share ≥20%; 4-of-4 recently, 3-of-16 historically — the registrable one). Both score **2026-10-23**. **Not registered, and why:** the ~2.125% coupon indication would be a rate view, not an observation about a convention, on an event carrying `symbols: []` and no rates-keyed playbook. | **Stance set** — watch-only; supply owned elsewhere, the content is the stop and the bidder shares; TIPS demand is tenor-split, not uniformly firm | 2026-09-22 (medium; D-47 sits in the 31+/21d band → 09-26, but the band tightens to 7d the moment days-out crosses 30 on 2026-09-22, which makes 09-22 the real first due date) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found
gets proposed to `market-events.ts` as an `estimate` in the same PR. Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory.
