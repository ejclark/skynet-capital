# Treasury coupon announcement (2Y + 5Y + 7Y notes, 2Y FRN new issue, 13/26/6-week bills) — treasury-coupon-announcement-2027-01-21

**Kind:** rates · **Date:** 2027-01-21 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — seven rows carry announce date `Thursday, January 21, 2027`; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-01-22","consumer-confidence-2027-01-26","fhfa-hpi-2027-01-26","fomc-blackout-start-2027-01-16","japan-cpi-2027-01-22","mlk-market-closure-2027-01-18","norway-gpfg-bond-expert-group-2027-01-25","tic-monthly-2027-01-19","treasury-10y-tips-2027-01-21","treasury-2y-note-2027-01-25","treasury-5y-note-2027-01-26","vix-expiration-2027-01-20","wef-davos-annual-meeting-2027-01-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This release is the cleanest month-end coupon announcement in Treasury's published
schedule, and the auctions it sizes are the only ones that straddle an FOMC meeting.** Two
corrections to the proposal this ledger replaces, both read verbatim off Treasury's own PDF against
its own legend (`R --denotes reopening`): the **2Y FRN is a NEW ISSUE at $30B**, not the $28B
reopening the November sibling documented — a lane inheriting that line is wrong by $2B — and there
is **no 52-week bill here at all**, because the 52-week runs a strict 28-day cycle (140 of 152 gaps
since 2015 are exactly 28 days) that puts its January turn on the **01-14** announcement instead. Strip
those and nothing open remains: three routine weekly bills, three notes in `sb0590`'s invariant
columns, and an FRN whose size is published in shape. The distinctive question is therefore not
*what will it say* but *what happens to the paper it sells*: 2Y Monday 01-25, 5Y Tuesday 01-26 (FOMC
day one), **FRN Wednesday 01-27 — bidding closing 11:30 a.m. ET against a 2:00 p.m. statement** —
and 7Y Thursday 01-28, the day after. Measured across **103 FOMC decision dates and 404 block
auctions since 2015, the straddle is a null** (mean z **+0.31** for straddling auctions vs **-0.04**
for the rest, t = **+1.84**, not significant) — and the sign is the *opposite* of the intuitive
story. The honest counterweight: January-27 sits **three months past the last cell `sb0590`
publishes**, the weakest published-guidance position any month-end block in this calendar has had.
Date is `estimate`; nothing here is a trade, and `symbols: []`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-134) | Stand aside | High | Nothing dated between now and **2026-11-04** can reach this event's numbers, and that refunding is the first document that will even name January-2027. `symbols: []`, date `estimate`, no rates-keyed house playbook, and Treasury's press index (re-read this session, HTTP 200, 71,184 bytes) has published nothing issuance-related since the 08-05 refunding — its ten newest items, newest **2026-09-08**, are Iran sanctions, a tax-exempt item, a G20 statement and readouts. | Treasury changing a nominal coupon or FRN size, or running an off-cycle coupon action, **before 2026-11-04** — 2026 has seen exactly **one** CMB (2026-05-21, 27-day, $25B) and no coupon change at all |
| This week | Stand aside — this event has no channel open | High | The **09-10** and **09-17** releases in this corridor belong to the September cycle `sb0590` already publishes by name. Nothing published anywhere today names a January-2027 size; the next document that does is **56 days** out. | The **2026-09-17** announcement printing off `sb0590`'s published Sep-26 row (`69 58 70 44 39 13 22 28`) — the grid would break 125 days before this event reads it, and this doc's note legs would be re-derived rather than patched |
| This month | Watch **2026-10-22**, don't act | Medium | 10-22 is the **last** announcement `sb0590`'s table covers, *and* it is the closest structural twin this event has: it is the only other release in the schedule's window that pairs the three notes with an **FRN NEW ISSUE** (`2-Year  FRN`, no `R`, auction 10-28). It reads three of this event's four coupon legs and the FRN's new-issue size four weeks early and for free. | The 10-22 announcement printing any of 2Y **69** / 5Y **70** / 7Y **44** / FRN **30** differently — the first nominal coupon or FRN size change since April 2024 |
| This quarter | Read **2027-01-21** as a **scheduled nil on content and a live question on demand**: treat all four legs as settled (**$69B · $70B · $44B · $30B new issue**) and spend the attention on whether the FOMC straddle costs the block anything. Still no position. | Medium | The note legs sit in `sb0590`'s **invariant** columns — flat in all six published months — and no nominal coupon or FRN size has changed anywhere since **April 2024** (28 months, nine refundings). Confidence is capped at medium, not raised to high, purely because January is the **furthest-out** month of a refunding table that does not exist yet. | The **2026-11-04** refunding publishing a Jan-27 **2Y / 5Y / 7Y / FRN** cell other than 69 / 70 / 44 / 30 — registered as [`FT-…-2027-01-21-1`](../forward-tests/treasury-coupon-announcement-2027-01-21.md), scores **2027-01-22** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed.
- **The FRN leg is a NEW ISSUE at $30B — this is the correction that matters most downstream.** The
  schedule row reads `2-Year  FRN` with no trailing `R`, against the PDF's own legend `R --denotes
  reopening`; the 11-19 and 12-17 sibling rows both read `2-Year  FRN R`. Every new issue since
  **2024-04-24 printed $30B (10 of 10)**, and `sb0590`'s FRN column reads **30** in new-issue months
  and **28** in reopening months. Anyone inheriting the 2026-11-19 ledger's "$28B FRN reopening" line
  lands $2B wrong.
- **The FRN new issue lands on FOMC decision day BY CONSTRUCTION, not by coincidence.** Across 142 FRN
  auctions since 2015 joined to 103 decision dates: **15 of 47 new issues (32%)** sold on a decision
  day and **24 of 47 (51%)** within a day, against **1 of 95 reopenings**. The reason is calendar
  arithmetic — the FRN new issue is the last Wednesday of Jan/Apr/Jul/Oct (12/12/12/11 of the 47), and
  those are the months whose FOMC also meets in the final week.
- **The straddle does not degrade demand — measured, and it is a null with the opposite sign to the
  story.** Block legs auctioning within one day of a decision (n=**43**) average **z +0.31** against
  **-0.04** for the other 361; t = **+1.84**, not significant at 95%. Indirect share **57.6%** vs
  **55.2%**. Leg by leg at this event's exact offsets: 2Y at D-2 **2.652** vs pool 2.686; 5Y at D-1
  **2.414** vs 2.425; 7Y at D+1 **2.480** vs 2.487. Three nulls.
- **No 52-week bill is on this release, and the mechanism is a 28-day cycle.** The 52-week auctions
  every 28 days (**140 of 152 gaps since 2015 are exactly 28**; the other 12 are 27 or 29, holiday
  rolls) while the block is monthly, so they coincide only two or three times a year — Oct-22 and
  Nov-19 in this window, and not January. The 2026-11-19 sibling's "the only genuinely open number is
  the 52-week" **does not transfer to this event**.
- **The 7-Year's close here is 1:00 p.m. ET, not the 11:30 a.m. its November sibling sourced.**
  Thursday is the 7-Year's ordinary slot (4 of 6 months in the schedule's window), so the holiday
  artifact the 2026-11-25 ledger measured does not apply. `closing_time_comp` reads `01:00 PM` on
  **133 of 140** 7-Year auctions. The **FRN's** 11:30 a.m. close, by contrast, *is* sourced —
  43 of 47 new issues.
- **This is January's largest coupon release and the month has no refunding to distract from it.**
  2Y $69B + 5Y $70B + 7Y $44B = **$183B**, plus the $30B FRN = **$213B** off one 11:00 ET press
  release, against a deduced **$119B** at the 01-07 release (3Y $58B + 10Y and 30Y *reopenings* at
  39 + 22) and **$13B** at 01-14 (20Y reopening) — **1.54x** and **~58%** of January's nominal coupon
  dollars. The 01-07 and 01-14 numbers are deductions from `sb0590`'s alternating columns, not
  quotations, and are labelled as such.
- **No reaction to this announcement will ever be measurable** — its own session also carries the
  **10-Year TIPS NEW ISSUE auction at 1:00 p.m. ET** (`10-Year  TIPS T`, no `R`, announced 01-14),
  two hours after the 11:00 release, plus the 4-week and 8-week bill auctions and the settlement of
  the bills announced 01-14. The honest measurable is the sizes.
- **Watch (dated):** announcements **09-17** · **10-15** · **10-22 (the FRN-new-issue twin — the real
  pre-read)** · bills-only **10-29** · borrowing estimates **11-02** · midterms **11-03** ·
  **refunding 11-04 (the first document that names Jan-27)** · **11-19 (the invariant-column dress
  rehearsal)** · **12-24 block** · borrowing estimates **2027-02-01** · **fomc-blackout-start
  2027-01-16** · **MLK closure 2027-01-18** · 20Y **01-20** · **this announcement + 10Y TIPS 01-21**
  · 2Y **01-25** · 5Y **01-26** · **FRN 01-27 (FOMC decision day)** · **7Y 01-28** · settlement
  **2027-02-01**.

## Initial research

### The question, plainly

The [2026-11-19 sibling](treasury-coupon-announcement-2026-11-19.md) established what a month-end
block *is*: the biggest and least-watched coupon release of its month, whose three note legs sit in
`sb0590`'s invariant columns and are therefore the easiest call in the series. Repeating that would
be waste. Three things are genuinely different about the January instance, and they set the question:

1. **Its auctions straddle an FOMC meeting** — the first time this calendar has researched a block
   with that property. *Does a coupon auction into, on, or just after a decision cost demand?*
2. **Its FRN leg is a new issue, not a reopening**, and its 52-week leg is absent entirely. *Does the
   sibling's composition read transfer, or does inheriting it produce a wrong number?*
3. **It is the furthest-out month of a refunding table that has not been written yet.** November was
   the *first* month of its refunding's window; January is the *third*. *Does that change the call, or
   only the confidence?*

**One-line verdict:** the straddle is a **measured null** (and mildly the other way), the sibling's
composition read **does not transfer** and inheriting it costs $2B on the FRN, and the guidance
distance changes **only the confidence** — the call itself is the same scheduled nil, held at medium
rather than high.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the
mandated cache bust has nothing to bust (recorded rather than skipped silently). This event existed
only as `proposals/treasury-coupon-announcement-2027-01-21.from-treasury-10y-tips-2027-01-21.json`
(2026-09-09); that proposal was read in full first, and this session writes the canonical
`src/domain/market-events/treasury-coupon-announcement-2027-01-21.json` itself. Everything
quantitative below is **primary and fetched this session (2026-09-09)**, never from memory and never
from the proposing sweep:

- **The dates and composition** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`,
  plain curl (HTTP 200, 17,195 bytes), text layer decompressed stream-by-stream and re-tokenised into
  **213** `(security, announce, auction, settle)` rows spanning 2026-08-05 → 2027-02-04, plus the
  document's own legend read verbatim: `T --denotes TIPS`, `R --denotes reopening`.
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590`, fetched direct (HTTP 200, 75,578
  bytes), tag-stripped and read in full, column by column.
- **The FOMC dates** — `federalreserve.gov/monetarypolicy/fomccalendars.htm` (HTTP 200, 164,831
  bytes) plus the six `fomchistorical<year>.htm` pages for 2015–2020 (HTTP 200 each), parsed to
  **103** scheduled decision dates 2015-01-28 → 2027-12-08, eight per year except 2020 (seven
  scheduled plus three unscheduled, correctly separated).
- **The base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, every auction since 2015-01-01:
  **4,369** rows (`total-count` verified), re-pulled a second time with `inflation_index_security` and
  `reopening` after the first pull's term fields proved unreliable (see leg 5).
- **The tape** — Treasury's own 2026 daily par-yield-curve CSV (HTTP 200, **172** rows) and Yahoo `^VIX`.
- **The press check** — `home.treasury.gov/news/press-releases` index (HTTP 200, 71,184 bytes).

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).

### Conviction legs, tested

**1. The event fires 2027-01-21 with SEVEN securities — SUPPORTED, and the proposal's composition
needed TWO corrections.** Re-derived independently from the PDF:

| Security | Auction | Settlement | FOMC offset |
|---|---|---|---|
| `13-Week BILL` | Monday, January 25, 2027 | Thursday, January 28, 2027 | -2 |
| `26-Week BILL` | Monday, January 25, 2027 | Thursday, January 28, 2027 | -2 |
| `2-Year NOTE` | Monday, January 25, 2027 | Monday, February 01, 2027 | **-2** |
| `6-Week BILL` | Tuesday, January 26, 2027 | Thursday, January 28, 2027 | -1 |
| `5-Year NOTE` | Tuesday, January 26, 2027 | Monday, February 01, 2027 | **-1 (FOMC day one)** |
| `2-Year FRN` — **no `R`, a NEW ISSUE** | Wednesday, January 27, 2027 | Monday, February 01, 2027 | **0 (decision day)** |
| `7-Year NOTE` | Thursday, January 28, 2027 | Monday, February 01, 2027 | **+1** |

The proposal carried "2Y FRN" without the new-issue reading and listed the block generically. Both
corrections are read off Treasury's own document rather than inferred, which is the standard this
series has been holding: the legend says `R --denotes reopening`, and the sibling rows for 2026-11-19
and 2026-12-17 both read `2-Year  FRN R` while 2026-10-22 and this one read `2-Year  FRN` bare.

**2. The FRN leg is a $30B new issue, and this is the single most consequential number in the doc —
SUPPORTED on four independent counts.** (a) The schedule's missing `R`, above. (b) `sb0590`'s FRN
column, read across its six published rows: **28 · 28 · 30 · 28 · 28 · 30** for May → Oct-26, i.e. 30
in the new-issue months (Jul-26, Oct-26) and 28 in the reopening months. (c) The tape: filtering
fiscaldata on `reopening: No`, all **47** FRN new issues since 2015 fall in **January (12), April
(12), July (12), October (11)**, and every one since **2024-04-24 printed $30B — 10 of 10**. (d) The
quarterly cycle is verifiable forward from the schedule itself: new issue 2026-10-28 → reopening
2026-11-24 → reopening 2026-12-23 → **new issue 2027-01-27**. The practical consequence is stated
bluntly because a downstream lane will otherwise inherit it: the 2026-11-19 ledger's "$28B FRN
reopening" is correct *for November* and **wrong by $2B for January**.

**3. The FRN new issue lands on FOMC decision day by construction — SUPPORTED, and it is this doc's
own structural finding.** Joining 142 FRN auctions to 103 decision dates:

| Set | n | On a decision day | Within ±1 day |
|---|---|---|---|
| FRN **new issues** | 47 | **15 (32%)** | **24 (51%)** |
| FRN **reopenings** | 95 | **1 (1%)** | — |

That gap is not a demand story, it is a calendar identity: the FRN new issue is the last Wednesday of
January, April, July and October, and the FOMC's Jan/Apr/Jul/Oct meetings decide in those same final
weeks. The exceptions are exactly the years the meeting moved — 2024-10-29's new issue sat at offset
-9 because that November's meeting was pushed past the election. **2026-01-28 is the row-for-row
one-year analog** of this event's configuration (2Y 01-26 at D-2, 5Y 01-27 at D-1, FRN 01-28 at D0,
7Y 01-29 at D+1) and printed **2.75 / 2.34 / 3.16 / 2.45** against pool means 2.686 / 2.425 / 3.181 /
2.487 — two above, two below, all inside noise.

**4. The straddle does not degrade demand — SUPPORTED AS A NULL, and this doc's own measurement.** The
intuitive story is strong: selling $213B of front-end and belly paper across the four sessions
bracketing a policy decision, with the FRN's bidding closing two and a half hours before the statement
itself. It is not in the tape. Every 2Y / 5Y / 7Y month-end auction since 2015 (n=**404** on the
robust filter of leg 5), z-normalised **within its own leg** so the three tenors are comparable:

| Set | n | Mean z | Median z | Indirect share |
|---|---|---|---|---|
| **Straddling** (within ±1 day of a decision) | 43 | **+0.310** | +0.142 | **57.6%** |
| All other | 361 | -0.037 | -0.140 | 55.2% |

Difference **+0.347**, se 0.188, **t = +1.84 — not significant at 95%**, and pointing the *wrong way
for the story*. It survives a regime control: restricted to 2024-05 onward (after the last size
change), straddling auctions run **+0.337** (n=7) vs **-0.157** (n=75). By exact offset: D-2 **-0.175**
(n=30), D-1 **+0.230** (n=23), D0 **+0.862** (n=6), D+1 **-0.041** (n=15). And at this event's own
three offsets the point estimates are all *slightly negative and all trivially so* — 2Y at D-2 **z
-0.14**, 5Y at D-1 **z -0.10**, 7Y at D+1 **z -0.06**. The FRN tells the same story from its own
series: new issues on a decision day average b/c **3.363** (n=15) against **3.096** off it (n=32).
**Recorded as a null, never as an edge** — the point of registering it is to stop a future pulse
re-deriving an FOMC-liquidity effect that is not there.

**5. Neither Treasury term field is reliable alone — SUPPORTED, and it is a NEW data trap this
calendar had not recorded.** The 2026-11-19 sibling documented the FRN trap (`floating_rate` must
split the 2-Year series, or 15 FRN rows at $30B manufacture spurious size changes). Two more surfaced
this session, and each changes the answer to "when did this leg last change size?":

| Filter used | 5-Year "last size change" | Why it is wrong |
|---|---|---|
| `security_term == '5-Year'`, non-FRN | 2026-04-27, 26 → 70 | **43 rows of 5-Year TIPS** file as `security_type: Note`, `security_term: 5-Year`; the $26B is the TIPS size. `inflation_index_security: No` separates them |
| `original_security_term == '5-Year'` | 2026-01-27, 69 → 70 | admits seasoned reopenings (`4-Year 10-Month` etc.), **and the field is itself mislabelled on 16 note rows** — e.g. 2025-02-25's $70B 5-Year new issue is tagged `original_security_term: 7-Year` |
| **intersection** + non-FRN + non-TIPS | **2024-04-24, 67 → 70** | the true answer |

On the robust filter the freeze is clean and consistent across all three legs: **2Y $69B since
2024-04-23** (27 auctions), **5Y $70B since 2024-04-24** (27), **7Y $44B since 2024-04-25** (28) —
**28 months and nine refundings** with no nominal coupon or FRN size change anywhere.

**6. The 52-week bill is not on this release, and the mechanism is a 28-day cycle — SUPPORTED, and it
retires the sibling's headline for this instance.** The 2026-11-19 ledger called the 52-week "the only
genuinely open number" in a month-end block. It is not in this one. The schedule's 52-week rows run
**2026-08-27 · 09-24 · 10-22 · 11-19 · 12-17 · 2027-01-14** — every gap exactly 28 days — while the
month-end announcements run **08-20 · 09-17 · 10-22 · 11-19 · 12-24 · 2027-01-21**. The two cycles
coincide only when the arithmetic happens to line up (October and November here) and separate
otherwise. The tape confirms the cycle is a rule, not a coincidence in the window: of **152**
consecutive 52-week gaps since 2015, **140 are exactly 28 days** and the remaining 12 are 27 or 29
(holiday rolls). So this event's bill legs are the three routine weekly benchmarks and nothing else —
currently 13-week **$92B**, 26-week **$79B**, 6-week **$75B**, the last being mid-reduction from $95B
through $85B (09-01) to $75B (09-08), exactly the September shorter-dated cut `sb0590` pre-announced.

**7. Composition across the schedule's window, recorded because it is what makes this release
clean.** Every month-end announcement that carries the 2-Year note:

| Announcement | Securities | Composition |
|---|---|---|
| 2026-08-20 | 7 | 3 bills · 3 notes · FRN **R** |
| 2026-09-17 | 7 | 3 bills · 3 notes · FRN **R** |
| 2026-10-22 | 8 | 3 bills · **52-week** · 3 notes · FRN **new** |
| 2026-11-19 | 8 | 3 bills · **52-week** · 3 notes · FRN **R** |
| 2026-12-24 | 6 | 3 bills · 3 notes · **no FRN** |
| **2027-01-21** | **7** | **3 bills · 3 notes · FRN new issue** |

Only **2026-10-22** shares this event's exact coupon shape — three notes plus an FRN new issue — which
is why it is named as the pre-read in the horizon table rather than the nearer 11-19 sibling.

**8. January is the FURTHEST-OUT month of a refunding table that does not exist yet — SUPPORTED, and
it is the honest counterweight to legs 2–6.** `sb0590` (2026-08-05) publishes actual sizes for
May → Jul-26 and anticipated sizes for **Aug → Oct-26**, and states its successor date in its own
words: *"The next quarterly refunding announcement will take place on Wednesday, November 4, 2026."*
That statement will publish **Nov / Dec / Jan-27** — so January is its **third** cell, whereas the
2026-11-19 sibling was researching the **first**. The consequence is precise: that sibling could point
at a published Nov-26 row and at a dress rehearsal (11-12) seven days before its own event; this doc
can point at **neither**, and every size in it is a deduction from the 28-month freeze plus the
sentence `sb0590` carries verbatim — *"Treasury anticipates maintaining nominal coupon and FRN auction
sizes for at least the next several quarters."* That is exactly why the quarter-horizon confidence is
**medium**, not high.

**9. This is January's dominant coupon release and there is no refunding to compete with it —
SUPPORTED, with its deductions labelled.** January's three coupon-bearing announcements:

| Release | Securities | Nominal coupon $ |
|---|---|---|
| **2027-01-07** | 3Y $58B · 10Y **reopening** · 30Y **reopening** | **$119B** *(10Y/30Y deduced at 39/22 from `sb0590`'s alternating columns — February is the refunding month, so January reopens)* |
| **2027-01-14** | 20Y **reopening** | **$13B** *(deduced)* |
| **2027-01-21** | **2Y $69B · 5Y $70B · 7Y $44B** | **$183B** |

Add the $30B FRN and one release carries **$213B** — **1.54x** the mid-month release and **~58%** of
the month's nominal coupon dollars. The November sibling's framing was "1.46x the refunding it is
never compared to"; January's is sharper and simpler, because **January has no refunding at all**.
The 01-07 and 01-14 figures are deductions and are labelled as such; the 01-21 figures are deductions
too, and only the ratio's *order of magnitude* survives if the grid moves.

**10. The grid does not respond to the tape — SUPPORTED, inherited and re-checked at a new extreme
that is stronger than the sibling's.** The 11-19 ledger noted the 10-Year at its 2026 high of 4.80 and
observed the grid did not move. This session's read of the same CSV (172 rows to **09/08**) adds the
sharper version: **2Y 4.39 · 5Y 4.57 · 7Y 4.68 are ALL SIMULTANEOUSLY AT THEIR 2026 HIGHS** — and
those are precisely the three tenors this event sizes. 2026 ranges: 2Y **3.38 → 4.39**, 5Y **3.51 →
4.57**, 7Y **3.72 → 4.68**, 10Y **3.97 → 4.80**, 30Y **4.64 → 5.31** (latest 5.25). The grid moved at
neither end of a 97–101bp span, and `sb0590` names the shock absorber in its own words: variations are
met *"through changes in regular bill auction sizes and/or CMBs."* 2026 has run exactly **one** CMB
(2026-05-21, 27-day, $25B). A rates selloff cannot reach the note legs; it can reach the bill legs,
which is the same sentence read the other way and is why the 6-week is already mid-cut.

**11. The announcement week is MLK-shortened, and the schedule proves the closure mechanically.** The
01-14 announcement's bills — 6-week, 13-week, 26-week and 52-week — all auction **Tuesday, January 19,
2027** rather than the usual Monday, and the 17/4/8-week block announced 01-19 auctions Wednesday and
Thursday. Treasury moved a whole Monday slate a day because the market is shut, which independently
corroborates `mlk-market-closure-2027-01-18` from a document that never mentions the holiday — the same
trick the `labor-day-market-closure-2026-09-07` entry used. It does **not** touch this event: the
announcement itself is the Thursday, and its own auctions run a normal Mon–Thu the following week.

**12. Kill-switch check on off-cycle issuance — clear as of 2026-09-09.** Treasury's press index (HTTP
200, 71,184 bytes) has published nothing issuance-related since the 08-05 refunding; its ten newest
items, newest dated **2026-09-08**, are Iran sanctions actions, a tax-exempt-status item, a G20 chair's
statement, a portfolio-holdings report and readouts.

**13. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
**VIX 15.72**, the **2026-09-08 close** (Yahoo `^VIX`, `regularMarketTime` 2026-09-08T20:15Z) — **the
feed had not posted a 2026-09-09 bar at fetch time and that is stated rather than glossed**; the
trailing week reads 16.34 · 15.20 · 14.32 · 14.53 · 15.30 · 15.72. Par curve as in leg 10. At D-134
none of this is information about January; it is the reference block's starting point.

**14. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`. An
announcement of auction sizes has no equity transmission path; the duration channel that reaches this
calendar's names is the long-end *yield*, which the 01-20 20-Year and 01-21 TIPS **auctions** inform
and this announcement does not.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What the
conditions support is **three corrections and one re-pointing of where a pulse should spend itself.**
First, **do not inherit the November sibling's composition read**: its FRN is a $28B reopening and this
one is a $30B new issue, its 52-week is the open number and this one has no 52-week at all — an
inherited line is wrong on both counts, and both are readable off Treasury's own legend. Second,
**spend the pre-read on 2026-10-22, not on 2026-11-19**: 10-22 is the only other release in the
published window with this event's exact coupon shape (three notes plus an FRN new issue), so it tests
all four legs four weeks early and for free. Third, **do not re-open the FOMC-liquidity question**: it
is measured here as a null across 43 straddling auctions and 103 decision dates, with the point
estimate pointing the wrong way for the story, and the next pulse should inherit that rather than
re-derive it. Fourth, and the reason confidence stops at medium: **the first document that can settle
any of this is the 2026-11-04 refunding**, 56 days out, and until it prints, every number here is a
deduction from a 28-month freeze.

### Honest limits

**No Treasury document names any of this event's sizes**, and it is a weaker position than the
sibling's, not an equal one — January is the third cell of a table that will not exist until
2026-11-04, and there is no dress rehearsal seven days before this event the way 11-12 was for 11-19.
**The straddle null is n=43 and t=+1.84.** That is not significant, and the honest claim is "no
degradation detected," never "no degradation exists"; at D0 specifically the coupon sample is **n=6**,
which cannot exclude anything. **The straddle set spans four rate regimes** (2015–18 lift-off, 2019,
2020–21 ZIRP, 2022–26 tightening/normalisation), so pooling assumes the effect is regime-independent —
asserted, not tested; the 2024-05+ control has n=7 on the straddle side, which is a direction, not a
measurement. **The z-normalisation is within-leg but not within-era**, so a leg whose whole series
drifted will contribute drift as signal. **The FRN new-issue/FOMC alignment is a calendar identity, not
a finding about behaviour** — it explains *why* the overlap recurs and says nothing about whether it
matters. **The `sb0590` column reading is a claim about a six-row window**, not a law: those columns
have been invariant *inside published guidance*, and 2023–24 shows they moved monthly when the increase
cycle was live. **The January dollar arithmetic in leg 9 rests on two deduced cells** (10Y/30Y and 20Y
reopening sizes) and would move if the November refunding changes the rotation. **The tentative schedule
is tentative** — Treasury's own label — and this lane may not self-confirm it. **The ~11:00 ET
announcement time is unsourced convention**, inherited from the sibling ledgers; only the *auction*
closing times are sourced, and only for the FRN (11:30 a.m., 43 of 47) and the 7-Year (1:00 p.m., 133
of 140). **The bill-leg call is deliberately not a number** — the 6-week is mid-adjustment and October
increases are pre-announced across the curve, so all three weekly benchmarks will have moved by January.

## Stance & kill switches

**Stance (date `estimate`; every size DEDUCED, not published).** Treat 2027-01-21 as **a scheduled nil
on content and a live question on demand**. Expect **2Y $69B · 5Y $70B · 7Y $44B · 2Y FRN NEW ISSUE
$30B** announced ~11:00 ET, on the strength of `sb0590`'s three invariant columns, its FRN column's
published new-issue/reopening alternation, and a 28-month, nine-refunding freeze in the tape; expect the
three weekly bill legs to carry whatever the October increase and the September reduction leave them at,
and treat them as genuinely unknown. No position is or should be taken on any of it. The doc's durable
outputs are five: (a) **the FRN is a $30B new issue, not a $28B reopening** — Treasury's own `R` legend,
`sb0590`'s alternating column, and 10 of 10 new issues since 2024-04-24, and a lane inheriting the
sibling's line is wrong by $2B; (b) **there is no 52-week bill here**, because the 52-week runs a strict
28-day cycle (140 of 152 gaps) that the monthly block only intersects two or three times a year — the
sibling's headline does not transfer; (c) **the FOMC straddle is a measured null** across 43 straddling
auctions, 103 decision dates and 404 block auctions, with the point estimate pointing the *opposite* way
to the intuitive story, recorded so no future pulse re-derives it; (d) **the FRN-new-issue/decision-day
overlap is a calendar identity** — 15 of 47 new issues against 1 of 95 reopenings — which explains the
recurrence and forecasts it forward; and (e) **two new fiscaldata term-field traps**, the 5-Year TIPS
contamination and the mislabelled `original_security_term`, either of which alone reports a false
"last size change" date.

**The epistemic position is weaker than the sibling's and that is disclosed, not hidden.** The
2026-11-19 ledger could lean on a published Nov-26 row and on a dress rehearsal seven days before its
own event. This one has neither: January-27 is the third cell of the 2026-11-04 refunding's window and
nothing published today names it. That is why the quarter call is graded **medium** while the sibling's
was medium-high, and why `FT-…-2027-01-21-1` scores as one observation rather than as a confirmation of
anything.

**Forward tests registered** in
[`forward-tests/treasury-coupon-announcement-2027-01-21.md`](../forward-tests/treasury-coupon-announcement-2027-01-21.md):

- **`FT-treasury-coupon-announcement-2027-01-21-1`**, scoreable **2027-01-22** — the 2027-01-21
  announcement publishes **2Y $69B · 5Y $70B · 7Y $44B · 2Y FRN $30B**, the FRN as a new issue. The
  four-leg version of the grid-holds question, at the furthest-out cell of an unwritten table.
- **`FT-treasury-coupon-announcement-2027-01-21-2`**, scoreable **2027-01-29** — none of the four
  auctions the block sells (2Y 01-25, 5Y 01-26, FRN 01-27, 7Y 01-28) prints a bid-to-cover below its own
  2024-05-onward observed floor (**2.41 · 2.28 · 2.69 · 2.40**). The FOMC-straddle null, registered as a
  null; uncorrelated with the first because it is about bidder behaviour rather than Treasury arithmetic.
- **`FT-treasury-coupon-announcement-2027-01-21-3`**, scoreable **2027-01-22** — the announcement carries
  exactly **seven** securities and **no 52-week bill**. The 28-day-cycle claim, and the cheapest test in
  the fragment.

**Kill switches:**

- **The 2026-11-04 refunding publishing a Jan-27 2Y / 5Y / 7Y / FRN cell other than 69 / 70 / 44 / 30** —
  the first nominal coupon or FRN size change since April 2024. `FT-…-2027-01-21-1` dies **78 days**
  before the announcement it predicts, and every "supply is settled in writing" line in this calendar's
  rates ledgers gets re-derived, not patched.
- **The 2026-10-22 announcement printing any of 69 / 70 / 44 / 30 differently** — the last release inside
  `sb0590`'s published window *and* the only other one in the schedule with this event's exact coupon
  shape. A deviation there is the earliest dated tell available, 91 days out.
- **The 2026-11-19 announcement printing off the Nov-26 table** — the invariant-column dress rehearsal
  failing. It does not name January, but it kills the column argument this doc leans on.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at 11-04 or before — the
  whole deducibility frame is conditional on that sentence, which is doing MORE work here than in the
  sibling because January sits outside every published table. [`FT-39`](../forward-tests.md) owns the
  guidance-language channel; this doc defers to it and does not re-register it.
- **The 2027-01-21 announcement carrying a 52-week bill** — it would kill the 28-day-cycle reading and
  `FT-…-2027-01-21-3` with it, and would mean the schedule's own 52-week rows were re-cut. It does not
  touch the note legs.
- **The 2027-01-27 FRN announced as a reopening (an `R` appearing) or at $28B** — it would kill this
  doc's headline correction and hand the sibling's inherited line back its accuracy.
- **Any of the four block auctions printing below its 2024-05+ floor** — it would retire leg 4's null and
  put FOMC-proximity back on the list of things a pulse must check for every straddling block.
- **An off-cycle coupon issuance action** — a coupon size changed between refundings — making supply a
  live variable for the first time in 2026. `sb0590` explicitly reserves **bill**-size and CMB
  flexibility, so a bill action or a CMB does **not** fire this; only a coupon one does.
- **Treasury moving the 11-04 refunding or the 01-21 announcement off those dates** — voids rather than
  kills; announced-elsewhere is a different question than announced-here.
- **The FOMC moving the 2027-01-26/27 meeting** — voids `FT-…-2027-01-21-2` entirely, since the straddle
  is the whole premise. Each meeting date is tentative until confirmed at the preceding meeting, which
  the Fed's own calendar page states in writing.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-134 | **Initial research.** **Canonical file written by this session** — the event existed only as `proposals/treasury-coupon-announcement-2027-01-21.from-treasury-10y-tips-2027-01-21.json`, read in full first per EVENT-RESEARCH.md. **Composition re-derived and CORRECTED ON TWO COUNTS.** The Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, text layer decompressed and re-tokenised into 213 rows this session) carries **seven** securities on `Thursday, January 21, 2027`: `13-Week`+`26-Week BILL`+`2-Year NOTE` (auction Mon 01-25), `6-Week BILL`+`5-Year NOTE` (Tue 01-26), **`2-Year FRN` (Wed 01-27)**, `7-Year NOTE` (Thu 01-28); the four coupon/FRN legs settle Mon 2027-02-01. **CORRECTION 1 — the FRN is a NEW ISSUE, not a reopening.** The row has NO trailing `R`, and the PDF's own legend (read verbatim this session) says `R --denotes reopening`; the 11-19 and 12-17 sibling rows both read `2-Year FRN R`. Corroborated three more ways: `sb0590`'s FRN column reads **30** in new-issue months (Jul-26, Oct-26) and **28** in reopening months; fiscaldata `reopening: No` gives **47** FRN new issues since 2015, all in Jan/Apr/Jul/Oct (12/12/12/11), **10 of 10 at $30B since 2024-04-24**; and the forward cycle new 10-28 → R 11-24 → R 12-23 → **new 01-27** reads straight off the schedule. **A lane inheriting the 2026-11-19 ledger's "$28B FRN reopening" line is wrong by $2B here.** **CORRECTION 2 — there is NO 52-week bill on this release.** The 52-week runs a strict 28-day cycle — schedule rows 08-27 · 09-24 · 10-22 · 11-19 · 12-17 · **2027-01-14**, every gap 28 days; tape confirms **140 of 152 gaps since 2015 are exactly 28** (rest 27/29, holiday rolls) — while the block is monthly, so they intersect only 2-3x a year. **The sibling's headline ("the only genuinely open number is the 52-week") does not transfer to this event.** **HEADLINE — the four auctions STRADDLE THE FOMC, and the straddle is a MEASURED NULL.** The 2027-01-26/27 meeting is read direct from federalreserve.gov (HTTP 200, 164,831 bytes) plus the six `fomchistorical<year>` pages for 2015-2020, parsed to **103** scheduled decision dates 2015-01-28 → 2027-12-08. Offsets: 2Y **D-2**, 5Y **D-1 (FOMC day one)**, **FRN D0 (decision day, bidding closing 11:30am ET vs a 2:00pm statement)**, 7Y **D+1**. Measured across **404** month-end block auctions z-normalised within leg: straddling (±1 day) **n=43, mean z +0.310, median +0.142, indirect 57.6%** vs **n=361, -0.037, -0.140, 55.2%** — diff +0.347, se 0.188, **t=+1.84, NOT significant**, and pointing the *opposite* way to the intuitive story. Regime control (2024-05+): +0.337 (n=7) vs -0.157 (n=75). This event's own offsets are all trivially negative: 2Y@D-2 **z -0.14** (n=19), 5Y@D-1 **z -0.10** (n=9), 7Y@D+1 **z -0.06** (n=14). FRN same direction: new issues on a decision day b/c **3.363** (n=15) vs **3.096** (n=32). **Recorded as a null at t=1.84, never as an edge.** **STRUCTURAL FINDING — the FRN/FOMC overlap is a CALENDAR IDENTITY:** **15 of 47 (32%)** FRN new issues sold on a decision day and **24 of 47 (51%)** within a day, against **1 of 95** reopenings — because the new issue is the last Wednesday of Jan/Apr/Jul/Oct and those FOMCs meet in the same final week. **2026-01-28 is the row-for-row one-year analog** (2Y 01-26 D-2, 5Y 01-27 D-1, FRN 01-28 D0, 7Y 01-29 D+1) and printed 2.75 / 2.34 / 3.16 / 2.45 vs pools 2.686 / 2.425 / 3.181 / 2.487 — two above, two below. **NEW DATA TRAPS, two of them, extending the sibling's FRN trap:** (a) **5-Year TIPS file as `security_type: Note`, `security_term: 5-Year`** — 43 rows — so a naive filter reports the last 5-Year size change as 2026-04-27 (bogus 26→70); (b) **`original_security_term` is itself mislabelled on 16 note rows** (e.g. 2025-02-25's $70B 5-Year tagged `7-Year`), so it reports 2026-01-27. **The robust filter is the INTERSECTION of both term fields plus `floating_rate: No` and `inflation_index_security: No`**, which gives the true freeze: **2Y $69B since 2024-04-23** (27 auctions), **5Y $70B since 2024-04-24** (27), **7Y $44B since 2024-04-25** (28) — 28 months, nine refundings. **EPISTEMIC COUNTERWEIGHT, disclosed not hidden: January-27 is the THIRD and furthest-out cell of the 2026-11-04 refunding's window**, three months past `sb0590`'s last published row (Oct-26), whereas the 11-19 sibling was researching the FIRST cell and had an 11-12 dress rehearsal. This doc has neither — hence quarter confidence **medium**, not high. **SIZE RANKING:** 2Y 69 + 5Y 70 + 7Y 44 = **$183B**, + FRN $30B = **$213B** in one release, vs a deduced **$119B** on 01-07 (3Y 58 + 10Y/30Y *reopenings* 39+22) and **$13B** on 01-14 (20Y R) — **1.54x** and ~58% of January's nominal coupon dollars, and **January has no refunding at all** to compete with it (the 01-07/01-14 cells are deductions from `sb0590`'s alternating columns and are labelled as such). **Only 2026-10-22 shares this event's coupon shape** (3 notes + FRN new issue) across the whole schedule window, so it — not 11-19 — is the real pre-read. **7-Year close here is 1:00pm ET, NOT the 11:30am the pre-Thanksgiving sibling sourced:** Thursday is the ordinary slot (4 of 6 months in the window) and `closing_time_comp` reads `01:00 PM` on 133 of 140 7Y auctions; the **FRN's** 11:30am IS sourced (43 of 47 new issues). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** nothing dated before **2026-11-04** can reach this event's numbers; the sequence that can is 10-22 → 11-02 borrowing estimates → 11-03 midterms → **11-04 refunding** → 11-19. Same-session: the **10-Year TIPS NEW ISSUE auction at 1:00pm ET** (`10-Year TIPS T`, no `R`, announced 01-14) two hours after this release. Corridor: **fomc-blackout-start 01-16**, **MLK closure 01-18**, opex 01-15, TIC 01-19, VIX expiration 01-20, BoJ + Japan CPI 01-22, FOMC 01-27. **MLK corroborated MECHANICALLY from the schedule**, which never names the holiday: the 01-14 bills all auction **Tuesday 01-19** instead of Monday — the same trick the Labor Day entry used. **Volatility:** **VIX 15.72**, the **2026-09-08 close** — the feed had posted no 09-09 bar at fetch time and that is stated, not glossed; trailing week 16.34 · 15.20 · 14.32 · 14.53 · 15.30 · 15.72. **Rates:** Treasury's 2026 par CSV to **09/08** (172 rows) — 2Y **4.39** · 5Y **4.57** · 7Y **4.68** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**, and **2Y, 5Y and 7Y are ALL simultaneously at their 2026 highs** (ranges 3.38→4.39, 3.51→4.57, 3.72→4.68) — precisely the three tenors this event sizes, and the grid moved at neither end. **Bill legs:** 13-week **$92B**, 26-week **$79B**, 6-week **$75B** and mid-cut from $95B via $85B (09-01) — the September shorter-dated reduction `sb0590` pre-announced, with October increases across the curve still to come. **Geopolitical / off-cycle kill switch checked and clear:** Treasury's press index (HTTP 200, 71,184 bytes) has published nothing issuance-related since 08-05; newest item **2026-09-08**, an Iran sanctions action. 2026 has run exactly **one** CMB (2026-05-21, 27-day, $25B). **Corridor: 13 tracked entries within ±5 days**, including this session's own proposals. **FOUR dated adjacent events PROPOSED as `estimate` in this PR:** `treasury-2y-note-2027-01-25`, `treasury-5y-note-2027-01-26`, `treasury-2y-frn-2027-01-27` (carrying the new-issue reading and the 11:30am close) and `treasury-7y-note-2027-01-28`. **The three bill legs deliberately not filed:** this calendar tracks no bill auction of any tenor, and inventing that class inside an adjacency sweep would be a scope decision, not a discovery. **`FT-…-2027-01-21-1`** (four sizes 69/70/44/30, scores 2027-01-22), **`FT-…-2027-01-21-2`** (no leg below its 2024-05+ floor 2.41/2.28/2.69/2.40, scores 2027-01-29) and **`FT-…-2027-01-21-3`** (seven securities, no 52-week, scores 2027-01-22) **registered**. **All sources returned HTTP 200; nothing blocked this session.** | **Stance set** — a **scheduled nil on content, a live question on demand**: four legs at **69 / 70 / 44 / 30 (FRN NEW ISSUE)**, no 52-week, and the FOMC straddle measured as a **null** (t=+1.84, wrong sign for the story). Two sibling-inherited claims corrected. Confidence capped at **medium** because January is the furthest-out cell of a refunding table that will not exist until **2026-11-04** | 2026-09-30 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-coupon-announcement-2027-01-21.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
