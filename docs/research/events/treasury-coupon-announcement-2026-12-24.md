# Treasury coupon announcement (2Y + 5Y + 7Y notes, 13/26/6-week bills) — treasury-coupon-announcement-2026-12-24

**Kind:** rates · **Date:** 2026-12-24 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — six rows carry announce date `Thursday, December 24, 2026`; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-minutes-2026-12-23","boj-summary-of-opinions-2026-12-28","christmas-eve-half-day-2026-12-24","christmas-market-closure-2026-12-25","consumer-confidence-2026-12-22","consumer-confidence-2026-12-29","durable-goods-2026-12-23","fhfa-hpi-2026-12-29","gdp-q3-2026-third-2026-12-23","japan-cpi-tokyo-flash-2026-12-25","new-home-sales-2026-12-23","pce-2026-12-23","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28","sp-quarterly-rebalance-effective-2026-12-21","treasury-2y-note-2026-12-28","treasury-5y-note-2026-12-28","treasury-7y-note-2026-12-29"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This is the leanest and the most compressed month-end block Treasury publishes, and the
compression is the first thing this series has measured that is not a null.** The content is the
easiest call it has ever made — six securities, no FRN, no 52-week bill, and three note legs sitting
in `sb0590`'s invariant columns at **2Y $69B · 5Y $70B · 7Y $44B** on a 28-month freeze. What is
genuinely different is the *shape*: the **2-Year and the 5-Year auction in the SAME session**
(Monday 2026-12-28), the 7-Year the next day, all six legs settling Thursday **2026-12-31** — the
only **2-session** block among the six in the schedule's window. Scored at the block level across
**125 blocks since 2015**, compressed blocks' 2Y/5Y pair runs **z −0.237 vs +0.062** (t **−1.42**,
*not* significant full-sample; **t −2.67 from 2020-05 onward**), and **the placebo passes** — the
7-Year, the one leg that keeps its own session, shows **nothing** in any window (t −0.17). The drag
sits on exactly the legs the mechanism names. It is registered as a forward test, **not** as a call:
the sign flips pre-2020 (n=4), the current regime has n=7, and 2020-05 was one of five windows
tested. A separate, durable method finding: the naive **leg-pooled** version of the same test reads
**t −2.92**, roughly twice the clustered statistic — measured within-block leg correlation is
**ρ 0.239** — so a leg-pooled t-statistic anywhere in this series overstates its confidence. Date is
`estimate`; `symbols: []`; nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-106) | Stand aside | High | Nothing dated between now and **2026-11-04** can reach this event's numbers, and that refunding is the first document that will name December-2026. `symbols: []`, date `estimate`, no rates-keyed house playbook, and Treasury's press index (re-read this session, HTTP 200, 71,183 bytes) has published nothing issuance-related since the 08-05 refunding — its ten newest items, newest **2026-09-08**, are Iran sanctions, a tax-exempt item, a G20 statement and readouts. | Treasury changing a nominal coupon size or running an off-cycle coupon action **before 2026-11-04** — 2026 has seen exactly **one** CMB (2026-05-21, 27-day, $25B) and no coupon change at all |
| This week | Stand aside — this event has no channel open | High | The **09-10** and **09-17** releases in this corridor belong to the September cycle `sb0590` already publishes by name. Nothing published anywhere today names a December-2026 size; the next document that does is **56 days** out. | The **2026-09-17** announcement printing off `sb0590`'s published Sep-26 row (`69 58 70 44 39 13 22 28`) — the grid would break 98 days before this event reads it, and this doc's note legs would be re-derived rather than patched |
| This month | Watch **2026-10-22**, don't act | Medium | 10-22 is the **last** announcement `sb0590`'s table covers, and it reads all three of this event's note legs four weeks early and for free. It is a weaker twin than 11-19 (it carries an FRN and a 52-week this event does not) but it is the last one inside published guidance. | The 10-22 announcement printing any of 2Y **69** / 5Y **70** / 7Y **44** differently — the first nominal coupon size change since April 2024 |
| This quarter | Read **2026-12-24** as **a scheduled nil on content and a live experiment on structure**: treat all three legs as settled (**$69B · $70B · $44B**) and spend the attention on whether the doubled 12-28 session costs the 2Y and 5Y anything. Still no position. | Medium | The note legs sit in `sb0590`'s **invariant** columns — flat in all six published months — and no nominal coupon size has changed since **April 2024** (28 months, nine refundings). December is the **second** cell of an unwritten refunding table, and unlike the January sibling this event HAS a dress rehearsal: **11-19** reads all three legs five weeks early. | The **2026-11-04** refunding publishing a Dec-26 **2Y / 5Y / 7Y** cell other than 69 / 70 / 44 — registered as [`FT-…-2026-12-24-1`](../forward-tests/treasury-coupon-announcement-2026-12-24.md), scores **2026-12-25** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed.
- **This block is the only 2-session block in the schedule's window, and that is the whole story.**
  `2-Year  NOTE` and `5-Year  NOTE` both auction **Monday 2026-12-28**; `7-Year  NOTE` **Tuesday
  2026-12-29**. Every other month-end block in the window (08-20, 09-17, 10-22, 11-19, 2027-01-21)
  spreads the three legs across three separate sessions.
- **Compression measures as a real but not-established drag, and the placebo is what makes it worth
  registering.** Block level, 125 blocks since 2015, mean z of the 2Y+5Y pair: compressed **−0.237**
  (n=25) vs **+0.062** (n=100), diff −0.299, se 0.210, **t −1.42**. From **2020-05**: **−0.551**
  (n=19) vs **−0.148** (n=54), **t −2.67**. Current size regime (2024-05+): **t −1.75**, n=7.
  Pre-2020: **+0.351**, n=4. The **7-Year placebo** — same blocks, same weeks, own session —
  is **t −0.17** everywhere.
- **The naive statistic is roughly twice the honest one.** Pooling the 2Y and 5Y legs as independent
  observations reads **t −2.92**. Measured within-block leg correlation is **ρ 0.239** (375 pairs),
  a design effect of 1.24 — so clustering explains ~1.11x of the 2.06x gap and leg-averaging the
  rest. **The block is the unit**; a leg-pooled t anywhere in this series is inflated.
- **Two prior December-24 announcements exist, and both blocks underperformed.** 2015 (block
  **z −0.546**, 25th of 125) and 2020 (**z −0.883**, 14th of 125). **2020 is a row-for-row calendar
  twin** — Thursday 12-24 announcement, 2Y+5Y both Monday 12-28, 7Y Tuesday 12-29, all settling
  12-31 — and printed **2.45 / 2.39 / 2.31** against pools 2.686 / 2.425 / 2.487. n=2; named as a
  precedent, not as evidence.
- **A third weak negative points the same way: December is the calendar's worst month for blocks.**
  Block z **−0.305** (n=10) vs **+0.032** (n=115), **t −1.44**. Not significant, near-independent of
  the compression variable (only 1 of 25 compressed blocks is a December), same sign.
- **No FOMC straddle here — this is what separates it from the January sibling.** The December
  meeting is **2026-12-09**, nineteen days before the first auction. The 2027-01-21 ledger's
  straddle machinery does not apply.
- **The 7-Year on a Tuesday is not exceptional.** 24 of 140 7-Year auctions since 2015 were
  Tuesdays, mean **z −0.047** vs +0.010, **t −0.25**. And all six legs settling 12-31 is normal for a
  December block — seven prior years did it.
- **Whether the ~11:00 ET announcement moves on the half-day cannot be sourced — recorded as a
  negative result.** `treasurydirect.gov`'s TA_WS feed (HTTP 200, 894,225 bytes) publishes
  `closingTimeCompetitive`/`closingTimeNoncompetitive` and **no announcement-time field**; no
  Treasury dataset carries one. What *is* sourced: every Christmas-Eve bill auction in the record
  closed at **10:00 AM** against the standard 11:30 (2018 · 2019 · 2020 · 2025). The 4- and 8-week
  bills auction ON 12-24, so the session runs 10:00 close → ~11:00 release → SIFMA 2:00 p.m. bond
  close. That is an inference about the announcement, **not** a source.
- **Watch (dated):** announcements **09-17** · **10-15** · **10-22 (last release inside published
  guidance)** · bills-only **10-29** · borrowing estimates **11-02** · midterms **11-03** ·
  **refunding 11-04 (the first document that names Dec-26)** · **11-19 (the dress rehearsal — all
  three legs)** · **FOMC 12-09** · **12-17 (FRN R + 20Y R + 52-week — the legs this event does NOT
  carry)** · **PCE 12-23** · **this announcement + christmas-eve-half-day 12-24** · **2Y and 5Y
  12-28** · **7Y 12-29** · **FOMC minutes 12-30** · settlement + sifma-bond-early-close **12-31**.

## Initial research

### The question, plainly

Two siblings have already established what a month-end block *is*. The
[2026-11-19 ledger](treasury-coupon-announcement-2026-11-19.md) found it is the biggest and
least-watched coupon release of its month, with three note legs in `sb0590`'s invariant columns; the
[2027-01-21 ledger](treasury-coupon-announcement-2027-01-21.md) added the composition corrections
(FRN new-issue vs reopening, the 52-week's 28-day cycle) and measured the FOMC straddle as a null.
Repeating either would be waste. Three things are genuinely different about the December instance:

1. **It is the leanest block in the schedule** — six securities, no FRN, no 52-week, no TIPS.
   *Does the absence change anything, or only the dollar total?*
2. **It is the only 2-session block in the window** — the 2-Year and the 5-Year auction on the
   *same day*. *Does compressing two coupon legs into one session cost demand?* No sibling has
   asked this, and it is the first structural question in the series with a plausible mechanism.
3. **It is announced on Christmas Eve, into a 2:00 p.m. bond close** — and the proposal that filed
   it named one untested thing explicitly: *does Treasury shift the announcement time the way it
   shifts auction times?*

**One-line verdict:** the content is the easiest call in the series and needs no correction; the
compression is a **real but not-established drag** with a clean placebo, registered as a forward
test rather than promoted to a call; and the announcement-time question is **unsourceable** — a
negative result worth recording so no future pulse spends itself re-asking.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). This event
existed only as `proposals/treasury-coupon-announcement-2026-12-24.from-treasury-7y-note-2026-11-25.json`
(2026-09-09); that proposal was read in full first, and this session writes the canonical
`src/domain/market-events/treasury-coupon-announcement-2026-12-24.json` itself. Everything
quantitative below is **primary and fetched this session (2026-09-09)**, never from memory and never
from the proposing sweep:

- **The dates and composition** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`,
  plain curl (HTTP 200, 17,195 bytes), text layer decompressed stream-by-stream and re-tokenised into
  **213** `(security, announce, auction, settle)` rows spanning 2026-08-05 → 2027-01-28, plus the
  document's own legend read verbatim: `T --denotes TIPS`, `R --denotes reopening`. The 213 matches
  both siblings' independent counts, which is the parse's cross-check.
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590`, fetched direct (HTTP 200,
  75,577 bytes), tag-stripped and read column by column.
- **The base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, every auction since
  2015-01-01: **4,369** rows (`total-count` verified).
- **The announcement-time probe** — `treasurydirect.gov/TA_WS/securities/auctioned` (HTTP 200,
  894,225 bytes), field list enumerated in full.
- **The tape** — Treasury's own 2026 daily par-yield-curve CSV (HTTP 200, **172** rows to 09/08) and
  Yahoo `^VIX`.
- **The press check** — `home.treasury.gov/news/press-releases` index (HTTP 200, 71,183 bytes).

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).

### Conviction legs, tested

**1. The event fires 2026-12-24 with SIX securities — SUPPORTED, and the proposal needed NO
correction.** Re-derived independently from the PDF:

| Security | Auction | Settlement |
|---|---|---|
| `13-Week BILL` | Monday, December 28, 2026 | Thursday, December 31, 2026 |
| `26-Week BILL` | Monday, December 28, 2026 | Thursday, December 31, 2026 |
| `2-Year NOTE` | **Monday, December 28, 2026** | Thursday, December 31, 2026 |
| `5-Year NOTE` | **Monday, December 28, 2026** | Thursday, December 31, 2026 |
| `6-Week BILL` | Tuesday, December 29, 2026 | Thursday, December 31, 2026 |
| `7-Year NOTE` | Tuesday, December 29, 2026 | Thursday, December 31, 2026 |

No trailing `R` on any note row, so all three are new issues. This is the second time in the series
a proposal has survived an independent re-read intact — worth recording, because the January sibling
needed two corrections and the pattern in this series has been that proposals drift on composition.

**2. It is the leanest block in the window, and both absences have named mechanisms — SUPPORTED.**
Composition across every month-end announcement the schedule covers:

| Announcement | Securities | Composition | Nominal coupon $ |
|---|---|---|---|
| 2026-08-20 | 7 | 3 bills · 3 notes · FRN **R** | $183B + $28B FRN |
| 2026-09-17 | 7 | 3 bills · 3 notes · FRN **R** | $183B + $28B FRN |
| 2026-10-22 | 8 | 3 bills · **52-week** · 3 notes · FRN **new** | $183B + $30B FRN |
| 2026-11-19 | 8 | 3 bills · **52-week** · 3 notes · FRN **R** | $183B + $28B FRN |
| **2026-12-24** | **6** | **3 bills · 3 notes · no FRN · no 52-week** | **$183B, nothing else** |
| 2027-01-21 | 7 | 3 bills · 3 notes · FRN **new** | $183B + $30B FRN |

Both absences land on **2026-12-17** instead, and neither is an anomaly: the FRN runs a quarterly
new-issue/reopening cycle whose December turn is the `2-Year  FRN R` auctioning 12-23, and the
52-week runs the strict 28-day cycle the January sibling measured (**140 of 152 gaps since 2015 are
exactly 28 days**) whose December turn auctions 12-22. So the note legs are identical to every
sibling's and only the wrapper is thinner. In December's own arithmetic this release is still
dominant: **$183B** against a deduced **$119B** on 12-03 (3Y $58B + 10Y and 30Y *reopenings* at
39 + 22, deduced from `sb0590`'s alternating columns since November is the refunding month) and
**$13B** on 12-17 (20Y reopening, deduced) — **1.54x** the mid-quarter release and **~58%** of
December's nominal coupon dollars.

**3. It is the ONLY 2-session block in the window — SUPPORTED, and this is the event's distinguishing
structural fact.** Auction-session layout of the three note legs:

| Block | 2Y | 5Y | 7Y | Sessions |
|---|---|---|---|---|
| 2026-08-20 | Tue 08-25 | Wed 08-26 | Thu 08-27 | 3 |
| 2026-09-17 | Tue 09-22 | Wed 09-23 | Thu 09-24 | 3 |
| 2026-10-22 | Mon 10-26 | Tue 10-27 | Thu 10-29 | 3 |
| 2026-11-19 | Mon 11-23 | Tue 11-24 | Wed 11-25 | 3 |
| **2026-12-24** | **Mon 12-28** | **Mon 12-28** | Tue 12-29 | **2** |
| 2027-01-21 | Mon 01-25 | Tue 01-26 | Thu 01-28 | 3 |

**4. Compression is NOT rare historically — SUPPORTED, and it kills the "unprecedented" framing
before it can be written.** Across **125** complete 2Y/5Y/7Y blocks since 2015, **25** span two
sessions rather than three, spread across eleven of the twelve months. It happens roughly twice a
year and is a calendar artifact, not a policy signal. This matters because it is what makes the
question *answerable*: a genuinely unprecedented shape would have n=0 to test against.

**5. Compression costs the compressed legs demand — SUPPORTED AS A DIRECTION, NOT AS A FACT, and it
is this series' first non-null.** The mechanism is specific and testable: two coupon auctions
clearing in one session compete for the same day's bidding capacity, so the drag should appear on
the **2-Year and 5-Year** and be **absent** on the 7-Year, which keeps its own session in the same
compressed week. Scored at the **block level** — one observation per block, because the legs of one
block face one market and are not independent draws — on the mean z of the 2Y and 5Y legs, each
z-normalised within its own leg:

| Window | Compressed | Other | Diff | t |
|---|---|---|---|---|
| All years 2015-2026 | **−0.237** (n=25) | +0.062 (n=100) | −0.299 | **−1.42** |
| Excluding 2020 | −0.286 (n=20) | +0.069 (n=93) | −0.355 | −1.65 |
| **2020-05 onward** | **−0.551** (n=19) | −0.148 (n=54) | **−0.403** | **−2.67** |
| 2024-05 onward (current size regime) | −0.602 (n=7) | −0.377 (n=19) | −0.225 | −1.75 |
| 2015-2019 | **+0.684** (n=4) | +0.333 (n=44) | **+0.351** | +0.57 |

**And the placebo passes, which is the reason this is registered at all.** The 7-Year, same blocks
and same weeks but its own session, shows nothing anywhere: **t −0.17** all years, **t −0.17** from
2020-05. A holiday or year-end confound would hit the 7-Year too. This one does not — the drag sits
on exactly the legs the mechanism names, and is absent from the leg it exempts. Indirect share moves
the same way and trivially: **52.9% vs 53.9%**, t −0.66.

**6. The naive version of the same test is roughly twice as confident as the honest one — SUPPORTED,
and this is a method finding the whole series should inherit.** Pooling the 2-Year and 5-Year legs as
**48 independent observations** reads **t −2.92**, comfortably "significant". The block-clustered
statistic on the same data is **−1.42**. The gap is 2.06x, and it decomposes:

- **Clustering** explains ~1.11x. Measured within-block leg correlation is **ρ 0.239** across
  **375** leg pairs — a design effect of 1 + ρ = **1.24** for a two-leg block, whose square root is
  1.11. Notably this is *smaller* than one would assume; clustering alone is not the whole story and
  saying so would be the easy overclaim.
- **Leg-averaging** explains the rest: averaging two correlated legs cuts n from 48 to 25 while
  shrinking treatment-group variance.

Either way the conclusion is the same and it is **not** specific to this event: **the block is the
unit of observation**, and a leg-pooled t-statistic anywhere in this calendar's rates ledgers
overstates its confidence. No published sibling conclusion changes — every effect measured so far
was near zero, so inflation could not manufacture a false positive out of it. This one nearly did.

**7. The two direct precedents both underperformed — SUPPORTED at n=2, and labelled as a precedent
rather than as evidence.** Exactly two prior coupon blocks were announced on a December 24:

| Year | Announce | 2Y | 5Y | 7Y | Sessions | Block z | Rank of 125 |
|---|---|---|---|---|---|---|---|
| 2015 | 2015-12-24 | 2.80 (z +0.47) | 2.32 (z −0.99) | 2.34 (z −1.12) | 3 | **−0.546** | 25th |
| **2020** | **2020-12-24** | **2.45 (z −0.97)** | **2.39 (z −0.33)** | **2.31 (z −1.35)** | **2** | **−0.883** | **14th** |

**2020 is a row-for-row calendar twin** — Thursday 12-24 announcement, 2Y and 5Y both auctioning
Monday 12-28, 7Y Tuesday 12-29, all settling 12-31 — because December 2020 and December 2026 share
a weekday layout. That makes it the single most relevant prior in the record, and it is one
observation from a year whose auction sizes were a COVID-era anomaly ($58/59/59B against today's
$69/70/44B). It informs; it does not establish.

**8. December is the calendar's worst month for blocks — SUPPORTED as a third weak negative.**
Block-level, **z −0.305** (n=10) vs **+0.032** (n=115), diff −0.337, **t −1.44**. Not significant,
and near-independent of the compression variable (only 1 of the 25 compressed blocks is a December),
but the same sign. Per year: 2015 −0.55 · 2016 +0.72 · 2018 −1.64 · 2019 −0.37 · 2020 −0.88 ·
2021 −0.94 · 2022 +0.05 · 2023 +0.26 · 2024 +0.67 · 2025 −0.38.

**9. No FOMC straddle — SUPPORTED, and it is what separates this event from the January sibling.**
The December meeting is **2026-12-09** (tracked as `fomc-2026-12-09`), **nineteen days** before this
block's first auction; the nearest FOMC artifact inside the corridor is the **minutes on 12-30**,
after every leg has cleared. The 2027-01-21 ledger's straddle apparatus — 103 decision dates, 404
block auctions, the FRN-new-issue calendar identity — is simply inapplicable here, and a pulse
should not re-run it.

**10. Two would-be anomalies check out as normal — SUPPORTED, and recorded so a pulse does not chase
them.** (a) The **7-Year on a Tuesday**: 24 of 140 7-Year auctions since 2015 were Tuesdays, mean
**z −0.047** vs +0.010, **t −0.25**. Thursday is merely the modal slot (91 of 140), not a rule.
(b) **All six legs settling 12-31**: normal for a December block — 2015, 2018, 2019, 2020, 2021,
2024 and 2025 all settled their notes on a 12-31.

**11. The content is settled in `sb0590`'s invariant columns — SUPPORTED, inherited and re-verified.**
The statement (2026-08-05, read as text direct this session, HTTP 200, 75,577 bytes) publishes six
monthly rows, `2Y 3Y 5Y 7Y 10Y 20Y 30Y FRN`:

```
May-26  69 58 70 44 42 16 25 28      Aug-26  69 58 70 44 42 16 25 28
Jun-26  69 58 70 44 39 13 22 28      Sep-26  69 58 70 44 39 13 22 28
Jul-26  69 58 70 44 39 13 22 30      Oct-26  69 58 70 44 39 13 22 30
```

The **2Y, 3Y, 5Y and 7Y columns are identical in all six**; only the refunding-cycle columns (10Y,
20Y, 30Y, FRN) vary. This event's three legs sit in the invariant set. The tape agrees on the robust
filter (intersection of `security_term` and `original_security_term`, plus `floating_rate: No` and
`inflation_index_security: No` — the January sibling's two traps): **2Y $69B since 2024-04-23** (28
auctions), **5Y $70B since 2024-04-24** (28), **7Y $44B since 2024-04-25** (29). Twenty-eight months,
nine refundings, no change. And `sb0590` says it in words: *"Treasury anticipates maintaining nominal
coupon and FRN auction sizes for at least the next several quarters."*

**12. December-26 is the SECOND cell of an unwritten refunding table, and unlike January it has a
dress rehearsal — SUPPORTED, and it is the honest calibration of confidence.** `sb0590` states its
successor in its own words: *"The next quarterly refunding announcement will take place on Wednesday,
November 4, 2026."* That statement will publish **Nov / Dec / Jan-27**, so this event sits **between**
its two siblings on guidance distance — weaker than 11-19's first cell, stronger than 2027-01-21's
third. It also has what January lacks: the **2026-11-19** announcement carries this event's three
legs *identically* (same tenors, same invariant columns) and prints **35 days early**. Quarter
confidence is **medium** on that basis, the same grade as January but for a better reason.

**13. The announcement-time question is UNSOURCEABLE — a NEGATIVE RESULT, and the proposal asked for
it by name.** The proposing sweep flagged this explicitly: Treasury demonstrably shifts *auction*
times on a half day, so does it shift the ~11:00 ET *announcement*? It cannot be answered from any
Treasury dataset. `treasurydirect.gov`'s `TA_WS/securities` feed (HTTP 200, 894,225 bytes) was
enumerated field by field this session: it publishes `closingTimeCompetitive` and
`closingTimeNoncompetitive` and **no announcement-time field at all**; `fiscaldata`'s
`auctions_query` carries the same closing-time pair and an `announcemt_date` with no time component.
What **is** sourced is the auction-clock compression, and it is unambiguous — every Christmas-Eve
auction in the record closes early:

| Date | Security | Close | vs standard |
|---|---|---|---|
| 2018-12-24 | 13-week, 26-week bills | **10:00 AM** | 11:30 AM |
| 2019-12-24 | 5-Year note | **10:00 AM** | 1:00 PM |
| 2020-12-24 | 4-week, 8-week bills | **10:00 AM** | 11:30 AM |
| 2025-12-24 | 4-week, 8-week bills | **10:00 AM** | 11:30 AM |

The 4- and 8-week bills auction **on** 2026-12-24 (announced 12-22), so the session reads: 10:00
bill close → ~11:00 announcement → SIFMA's recommended **2:00 p.m.** bond close. The presumption
that the announcement moves too is reasonable and is **explicitly an inference**. Recorded as
answered-in-the-negative so no future pulse spends itself re-asking.

**14. Kill-switch check on off-cycle issuance — clear as of 2026-09-09.** Treasury's press index
(HTTP 200, 71,183 bytes) has published nothing issuance-related since the 08-05 refunding; its ten
newest items, newest dated **2026-09-08**, are Iran sanctions actions, a tax-exempt-status item, a
G20 chair's statement, a portfolio-holdings report and readouts. 2026 has run exactly **one** CMB
(2026-05-21, 27-day, $25B).

**15. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
**VIX 15.72**, the **2026-09-08 close** (Yahoo `^VIX`, `regularMarketTime` 2026-09-08T20:15Z) — the
feed had not posted a 2026-09-09 bar at fetch time and that is stated rather than glossed; trailing
week 16.34 · 15.20 · 14.32 · 14.53 · 15.30 · 15.72. Par curve to **09/08** (172 rows): **2Y 4.39 ·
5Y 4.57 · 7Y 4.68 · 10Y 4.80 · 20Y 5.26 · 30Y 5.25**, with 2Y, 5Y and 7Y all simultaneously at their
2026 highs (ranges 3.38→4.39, 3.51→4.57, 3.72→4.68) — precisely the three tenors this event sizes,
and the grid moved at neither end of a ~100bp span. `sb0590` names the shock absorber itself:
variations are met *"through changes in regular bill auction sizes and/or CMBs."* Bill legs today:
13-week **$92B**, 26-week **$79B**, 6-week **$75B** and mid-cut from $95B via $85B (09-01) — the
September shorter-dated reduction `sb0590` pre-announced, with October increases still to come.

**16. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`. An
announcement of auction sizes has no equity transmission path; the duration channel that reaches
this calendar's names is the long-end *yield*, which the 12-23 20-Year reopening **auction** informs
and this announcement does not.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What
the conditions support is **one measurement to score and three things a pulse should not spend
itself on.** The measurement: **the doubled 12-28 session is the cleanest live test of the
compression drag available**, because the current-regime sample is n=7 and this event adds an
eighth with all three of its sizes already deducible — so the demand question is not confounded by a
size question. Register it, do not act on it. The three refusals: **do not re-run the FOMC straddle**
(the December meeting is nineteen days clear of the first auction); **do not chase the Tuesday
7-Year or the 12-31 settlement** (both measured as ordinary here); and **do not re-ask whether the
announcement clock moves** (no Treasury dataset carries the field, tested this session). And the
reason confidence stops at medium: the first document that can settle any size here is the
**2026-11-04** refunding, 56 days out, with the **11-19** dress rehearsal 15 days after that.

### Honest limits

**The compression finding is a direction, not a fact, and the sub-sample that carries it was one of
five windows tested.** Full-sample t is **−1.42**; the significant result is the **2020-05 onward**
window at t −2.67, and its p-value is uncorrected for having looked at five era splits. The five
windows were fixed before the numbers were read, which is why the result is reported at all, but
that is a weaker guarantee than pre-registration. **Pre-2020 the sign flips at n=4** — four blocks
cannot contradict anything, so this is honestly "no pre-2020 evidence" rather than "evidence
against". **The current-regime cell is n=7.** **The placebo is the strongest part of the argument
and it is still only a placebo**: it rules out a confound that hits all three legs equally (holiday
week, year-end, a December risk-appetite effect) and rules out nothing that would hit the front end
specifically. **The z-normalisation is within-leg but not within-era**, so a leg whose whole series
drifted contributes drift as signal. **The 2020 twin is one observation from a size regime that no
longer exists** ($58/59/59B vs $69/70/44B today). **No Treasury document names any of this event's
sizes** — December-26 is the second cell of a table that will not exist until 2026-11-04, and every
size here is a deduction from a 28-month freeze plus one sentence of guidance. **The December
dollar arithmetic rests on three deduced cells** (10Y, 30Y and 20Y reopening sizes) and would move
if the November refunding changes the rotation. **The tentative schedule is tentative** — Treasury's
own label — and this lane may not self-confirm it. **The ~11:00 ET announcement time is unsourced
convention**, and leg 13 establishes that it cannot be sourced, not that it is right. **The bill-leg
call is deliberately not a number**: the 6-week is mid-adjustment and October increases are
pre-announced across the curve, so all three weekly benchmarks will have moved by December.

## Stance & kill switches

**Stance (date `estimate`; every size DEDUCED, not published).** Treat 2026-12-24 as **a scheduled
nil on content and a live experiment on structure**. Expect **2Y $69B · 5Y $70B · 7Y $44B** announced
~11:00 ET (time unsourced), with **no FRN and no 52-week bill**, on the strength of `sb0590`'s
invariant columns and a 28-month, nine-refunding freeze in the tape; expect the three weekly bill
legs to carry whatever the October increase and the September reduction leave them at, and treat
them as genuinely unknown. No position is or should be taken on any of it. The doc's durable outputs
are four:

- **(a) Compression measures as a drag on the legs that share a session, and the placebo passes.**
  Block-level across 125 blocks, the 2Y/5Y pair in a 2-session block runs **z −0.237 vs +0.062**
  (t −1.42 full-sample, **t −2.67 from 2020-05**), while the 7-Year — same blocks, own session — is
  **t −0.17** in every window. It is registered as a forward test, not promoted to a call.
- **(b) The block is the unit of observation, and a leg-pooled t in this series is inflated.** The
  naive statistic here reads **t −2.92** against the clustered **−1.42**; measured within-block leg
  correlation is **ρ 0.239** (375 pairs, design effect 1.24), so clustering is ~1.11x of the 2.06x
  gap and leg-averaging is the rest. No sibling conclusion changes — every prior effect was near
  zero — but this one nearly manufactured a false positive.
- **(c) The announcement-clock question is answered in the negative and should be closed.** No
  Treasury dataset publishes an announcement time; the auction-clock compression (10:00 AM on 4 of 4
  Christmas-Eve auction dates) is real and sourced, and any read across to the announcement is an
  inference.
- **(d) Three would-be anomalies are ordinary here** — the Tuesday 7-Year (t −0.25), the 12-31
  same-day settlement (7 prior Decembers), and the FOMC (2026-12-09, nineteen days clear). A pulse
  that re-derives any of them has spent itself for nothing.

**The epistemic position sits between the two siblings, and that is stated rather than implied.**
The 11-19 ledger researched the *first* cell of its refunding's window and had a dress rehearsal
seven days out; the 2027-01-21 ledger had the *third* cell and no rehearsal at all. This event has
the **second** cell and a rehearsal **35 days** out. Quarter confidence is **medium** — the same
grade January carried, on materially better footing.

**Forward tests registered** in
[`forward-tests/treasury-coupon-announcement-2026-12-24.md`](../forward-tests/treasury-coupon-announcement-2026-12-24.md):

- **`FT-treasury-coupon-announcement-2026-12-24-1`**, scoreable **2026-12-25** — the 2026-12-24
  announcement publishes **2Y $69B · 5Y $70B · 7Y $44B**. The grid-holds question at the second cell
  of an unwritten table.
- **`FT-treasury-coupon-announcement-2026-12-24-2`**, scoreable **2026-12-25** — the announcement
  carries exactly **six** securities, with **no FRN** and **no 52-week bill**. The cycle-arithmetic
  test, and the cheapest row in the fragment.
- **`FT-treasury-coupon-announcement-2026-12-24-3`**, scoreable **2026-12-30** — **the compression
  test, stated directionally and with a placebo clause**: the mean bid-to-cover z of the 2-Year and
  5-Year (sharing 12-28) comes in **below** that of the 7-Year (own session, 12-29). This is the one
  genuinely out-of-sample observation the event produces, and it is deliberately a *relative*
  prediction — it cannot be satisfied by a generally weak or generally strong holiday week, which is
  exactly the confound leg 5's placebo was built to exclude.

**Kill switches:**

- **The 2026-11-04 refunding publishing a Dec-26 2Y / 5Y / 7Y cell other than 69 / 70 / 44** — the
  first nominal coupon size change since April 2024. `FT-…-2026-12-24-1` dies **50 days** before the
  announcement it predicts, and every "supply is settled in writing" line in this calendar's rates
  ledgers gets re-derived, not patched.
- **The 2026-10-22 announcement printing any of 69 / 70 / 44 differently** — the last release inside
  `sb0590`'s published window, and the earliest dated tell available at 63 days out.
- **The 2026-11-19 announcement printing off the Nov-26 table** — the dress rehearsal failing. It
  does not name December, but it kills the invariant-column argument this doc leans on, 35 days out.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at 11-04 or before —
  the whole deducibility frame is conditional on that sentence.
  [`FT-39`](../forward-tests.md) owns the guidance-language channel; this doc defers to it and does
  not re-register it.
- **The 2026-12-24 announcement carrying an FRN or a 52-week bill** — it would kill
  `FT-…-2026-12-24-2` and mean either the FRN's quarterly cycle or the 52-week's 28-day cycle was
  re-cut. It does not touch the note legs.
- **Treasury re-cutting the block so the 2-Year and 5-Year no longer share 12-28** — it **voids**
  `FT-…-2026-12-24-3` rather than killing it; the compression hypothesis needs a compressed block to
  be tested against, and this is the only one on the schedule.
- **The 7-Year printing a LOWER z than the 2Y/5Y mean on 12-29** — it kills
  `FT-…-2026-12-24-3` and, with it, the placebo that is the compression finding's main support. The
  honest consequence is that the 2020-05 result reverts to "one significant window out of five,"
  which is what an uncorrected p-value is worth.
- **An off-cycle coupon issuance action** — a coupon size changed between refundings — making supply
  a live variable for the first time in 2026. `sb0590` explicitly reserves **bill**-size and CMB
  flexibility, so a bill action or a CMB does **not** fire this; only a coupon one does.
- **Treasury moving the 11-04 refunding or the 12-24 announcement off those dates** — voids rather
  than kills; announced-elsewhere is a different question than announced-here.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-106 | **Initial research.** **Canonical file written by this session** — the event existed only as `proposals/treasury-coupon-announcement-2026-12-24.from-treasury-7y-note-2026-11-25.json`, read in full first per EVENT-RESEARCH.md. **Composition re-derived and CONFIRMED UNCHANGED — no correction needed**, the second time in this series a proposal has survived an independent re-read. The Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, text layer decompressed and re-tokenised into **213** rows this session — matching both siblings' counts) carries **SIX** securities on `Thursday, December 24, 2026`: `13-Week`+`26-Week BILL`+**`2-Year NOTE`**+**`5-Year NOTE`** (all four auctioning **Monday 12-28**), `6-Week BILL`+`7-Year NOTE` (**Tuesday 12-29**); **all six settle Thursday 12-31**. No `R` on any note row against the legend `R --denotes reopening`. **LEANEST BLOCK IN THE WINDOW: no FRN, no 52-week, no TIPS** — both absences have named mechanisms and land on **12-17** instead (FRN on its quarterly reopening cycle, `2-Year FRN R` auction 12-23; 52-week on the strict 28-day cycle the January sibling measured, auction 12-22). Six securities and **$183B** against 11-19's eight and $211B and 01-21's seven and $213B; still December's dominant release at **1.54x** the deduced $119B on 12-03 and ~58% of the month's nominal coupon dollars. **HEADLINE — THE ONLY 2-SESSION BLOCK IN THE SCHEDULE, and the compression is this series' FIRST NON-NULL.** Every other month-end block (08-20, 09-17, 10-22, 11-19, 2027-01-21) spreads 2Y/5Y/7Y across three sessions; this one puts **2Y and 5Y in the same session**. Not rare historically — **25 of 125** complete blocks since 2015 span two sessions, across eleven months — which is what makes it testable. Scored at the **BLOCK level** (one obs/block; legs of one block face one market and are not independent) on the mean z of the 2Y+5Y pair: compressed **−0.237 (n=25)** vs **+0.062 (n=100)**, diff −0.299, se 0.210, **t −1.42 — NOT significant full-sample**; excl. 2020 t −1.65; **2020-05 onward −0.551 (n=19) vs −0.148 (n=54), t −2.67**; 2024-05+ t −1.75 (n=7); **2015-2019 the sign FLIPS, +0.351 (n=4)**. **THE PLACEBO PASSES, and it is why this is registered at all: the 7-Year — same blocks, same weeks, its OWN session — is t −0.17 in every window.** A holiday/year-end confound would hit the 7Y too; this drag sits on exactly the legs the mechanism names. Indirect share 52.9% vs 53.9%, t −0.66. **SECOND, SEPARATE METHOD FINDING THE WHOLE SERIES SHOULD INHERIT: a leg-pooled t-statistic in this calendar is inflated.** The naive version of this same test — 2Y and 5Y as 48 independent observations — reads **t −2.92**, 2.06x the clustered −1.42. Measured within-block leg correlation **ρ 0.239 (375 pairs)**, design effect 1.24, so **clustering explains only ~1.11x** and leg-averaging the rest — stated that way rather than overclaiming clustering as the whole cause. **The block is the unit.** No published sibling conclusion changes (every prior effect was near zero, so inflation could not manufacture a false positive out of it); this one nearly did. **DIRECT PRECEDENT, n=2 and labelled as such:** exactly two prior blocks were announced on a Dec-24 — **2015** (block z **−0.546**, 25th of 125) and **2020** (block z **−0.883**, 14th of 125). **2020 is a ROW-FOR-ROW CALENDAR TWIN** (Thu 12-24 announce, 2Y+5Y both Mon 12-28, 7Y Tue 12-29, settle 12-31 — Dec-2020 and Dec-2026 share a weekday layout) and printed **2.45 / 2.39 / 2.31** vs pools 2.686 / 2.425 / 2.487; it is also one observation from a COVID size regime ($58/59/59B) that no longer exists. **THIRD WEAK NEGATIVE, same sign, near-independent:** December blocks as a class run **z −0.305 (n=10)** vs +0.032 (n=115), **t −1.44** (only 1 of the 25 compressed blocks is a December). **TWO WOULD-BE ANOMALIES CHECKED OUT AS ORDINARY, recorded so no pulse chases them:** the **Tuesday 7-Year** (24 of 140 since 2015 were Tuesdays, z −0.047 vs +0.010, **t −0.25**; Thursday is modal at 91/140, not a rule) and **all six legs settling 12-31** (normal — 2015, 2018, 2019, 2020, 2021, 2024, 2025 all did). **NO FOMC STRADDLE — the separator from the 2027-01-21 sibling:** the December meeting is **2026-12-09**, nineteen days before the first auction; the only FOMC artifact in the corridor is **minutes 12-30**, after every leg clears. The January ledger's straddle apparatus is inapplicable and must not be re-run. **THE PROPOSAL'S OPEN QUESTION, TESTED AND ANSWERED AS A NEGATIVE RESULT:** whether Treasury shifts the ~11:00 ET **announcement** on a half-day **cannot be sourced** — `treasurydirect.gov` TA_WS (HTTP 200, 894,225 bytes) was field-enumerated this session and publishes `closingTimeCompetitive`/`closingTimeNoncompetitive` and **no announcement-time field**; `fiscaldata` carries the same pair plus a date-only `announcemt_date`. What IS sourced is the **auction**-clock compression: **4 of 4 Christmas-Eve auction dates closed at 10:00 AM** against the standard 11:30 (2018-12-24 bills, 2019-12-24 5Y note, 2020-12-24 and 2025-12-24 4wk/8wk bills). The 4- and 8-week bills auction ON 12-24, so the session runs 10:00 close → ~11:00 release → SIFMA **2:00 p.m.** bond close. Read across to the announcement is an INFERENCE, stated as one. **CONTENT — the easiest part, re-verified:** `sb0590` (2026-08-05, read as text direct, HTTP 200, 75,577 bytes) publishes six monthly rows May-26→Oct-26 whose **2Y/3Y/5Y/7Y columns are identical in all six (69/58/70/44)**; robust-filter tape (intersection of both term fields + `floating_rate: No` + `inflation_index_security: No`) gives **2Y $69B since 2024-04-23** (28 auctions), **5Y $70B since 2024-04-24** (28), **7Y $44B since 2024-04-25** (29) — 28 months, nine refundings. **EPISTEMIC POSITION SITS BETWEEN THE SIBLINGS:** Dec-26 is the **SECOND** cell of the 2026-11-04 refunding's window (11-19 had the first, 2027-01-21 the third), and unlike January it **HAS a dress rehearsal** — **11-19 carries these three legs identically, 35 days early**. Quarter confidence **medium**, same grade as January on better footing. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** nothing dated before **2026-11-04** can reach this event's numbers; the sequence that can is 10-22 (last release inside published guidance) → 11-02 borrowing estimates → 11-03 midterms → **11-04 refunding** → **11-19 dress rehearsal**. Corridor: **PCE 12-23 (high, confirmed)**, GDP Q3 third + durable goods + new-home sales 12-23, **christmas-eve-half-day 12-24**, christmas-market-closure 12-25, S&P quarterly rebalance effective 12-21, BoJ minutes 12-23 / summary of opinions 12-28, consumer confidence 12-22 and 12-29, advance economic indicators 12-28, FHFA HPI 12-29, **fomc-minutes 12-30**, **sifma-bond-early-close 12-31** on settlement day. **Volatility:** **VIX 15.72**, the **2026-09-08 close** — the feed had posted no 09-09 bar at fetch time and that is stated, not glossed; trailing week 16.34 · 15.20 · 14.32 · 14.53 · 15.30 · 15.72. **Rates:** Treasury's 2026 par CSV to **09/08** (172 rows) — 2Y **4.39** · 5Y **4.57** · 7Y **4.68** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**, with **2Y, 5Y and 7Y all simultaneously at their 2026 highs** (3.38→4.39, 3.51→4.57, 3.72→4.68) — precisely the tenors this event sizes, and the grid moved at neither end. **Bill legs:** 13-week **$92B**, 26-week **$79B**, 6-week **$75B** and mid-cut from $95B via $85B (09-01). **Geopolitical / off-cycle kill switch checked and clear:** Treasury's press index (HTTP 200, 71,183 bytes) has published nothing issuance-related since 08-05; newest item **2026-09-08**, an Iran sanctions action. 2026 has run exactly **one** CMB (2026-05-21, 27-day, $25B). **Corridor: 16 tracked entries within ±5 days**, plus this session's own proposals. **TWO dated adjacent events PROPOSED as `estimate` in this PR:** `treasury-2y-note-2026-12-28` and `treasury-5y-note-2026-12-28`, both carrying the compression finding forward. **`treasury-7y-note-2026-12-29` was already proposed by `treasury-7y-note-2026-11-25` and is deliberately NOT duplicated.** The three bill legs are deliberately not filed: this calendar tracks no bill auction of any tenor, and inventing that class inside an adjacency sweep would be a scope decision, not a discovery. **`FT-…-2026-12-24-1`** (three sizes 69/70/44, scores 2026-12-25), **`FT-…-2026-12-24-2`** (six securities, no FRN, no 52-week, scores 2026-12-25) and **`FT-…-2026-12-24-3`** (**the compression test, stated RELATIVELY: 2Y/5Y mean z below the 7Y's** — deliberately immune to a generally weak holiday week, scores 2026-12-30) **registered**. **All sources returned HTTP 200; nothing blocked this session.** | **Stance set** — a **scheduled nil on content, a live experiment on structure**: three legs at **69 / 70 / 44**, **no FRN, no 52-week**, and the doubled 12-28 session registered as the calendar's **first non-null** (t −1.42 full-sample, t −2.67 from 2020-05, **placebo passes at t −0.17**) rather than promoted to a call. Method correction banked: **the block is the unit; leg-pooled t is inflated ~2x** (ρ 0.239). Announcement-clock question **closed as unsourceable**. Confidence **medium** — second cell of an unwritten table, but with a 35-day dress rehearsal | 2026-09-30 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-coupon-announcement-2026-12-24.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
