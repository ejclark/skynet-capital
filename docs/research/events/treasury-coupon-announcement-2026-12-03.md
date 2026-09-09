# Treasury December coupon announcement (3-Year new issue + 10-Year and 30-Year reopenings + three bills) — treasury-coupon-announcement-2026-12-03

**Kind:** rates · **Date:** 2026-12-03 (estimate, EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, re-fetched by plain curl 2026-09-09, HTTP 200, 17,195 bytes, `CreationDate` 2026-08-04, text layer inflated per page and rows rebuilt from `Tm` coordinates — SIX page-3 rows carry announce date `Thursday, December 03, 2026`; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["adp-employment-2026-12-02","aws-reinvent-2026","chicago-pmi-2026-11-30","construction-spending-2026-12-01","cyber-monday-2026-11-30","dallas-fed-mfg-2026-11-30","dallas-fed-tssos-2026-12-01","eia-steo-2026-12-08","fomc-blackout-start-2026-11-28","georgia-senate-runoff-2026-12-01","intl-trade-full-report-2026-12-08","ism-manufacturing-2026-12-01","ism-services-2026-12-03","japan-balance-of-payments-2026-12-08","jobs-2026-12-04","jolts-2026-12-01","m3-full-report-2026-12-03","msft-annual-meeting-2026-12-08","pjm-reliability-backstop-results-2026-12-02","productivity-costs-q3-revised-2026-12-08","russell-recon-lockdown-2026-11-30","russell-style-month-end-capping-effective-2026-11-30","sp-rebalance-proforma-2026-12-04","treasury-10y-note-2026-12-08","treasury-3y-note-2026-12-07"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The proposal that created this event named the wrong sizes, and fixing that is this
document's job.** It wrote *"Expect $58B/$42B/$25B"* — those are the **new-issue** sizes. The
tentative schedule flags the December 10-Year and 30-Year with **`R`**: they are **reopenings**, and
in the modern grid a reopening runs below its own new issue, **$39B for 21 consecutive 10-Year
reopenings since 2024-03-12** and **$22B for 21 consecutive 30-Year reopenings since 2024-03-13**,
zero deviations in either (`auctions_query`, pulled this session). The correct expectation is
**$58B / $39B / $22B**, and Treasury's own August refunding table displays that split twice. Second
correction: **six securities, not three** — the 13-Week, 26-Week and 6-Week bills carry the same
`Thursday, December 03, 2026` announce date. What that leaves is the calendar's **most
information-free coupon announcement**, and it is measured rather than asserted: the two prior
Decembers (**2024-12-05** and **2025-12-04**) are exact six-security twins, and the 2025 one printed
**every single number unchanged** from the week before it. The **only** leg that has ever moved at a
December announcement is the **6-week bill** — cut $5B in 2024, unmoved in 2025, so **1 of 2**. Date
is `estimate`, `symbols: []`, no house playbook is rates-keyed. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-85) | **Stand aside** | High | Nothing dated between now and **2026-11-04** can reach any number this event publishes. `sb0590` (re-read this session, HTTP 200) ends its size table at **Oct-26** and states in writing *"The next quarterly refunding announcement will take place on Wednesday, November 4, 2026"* — that statement sets the December sizes **29 days** before 12-03 publishes them. Treasury's press index carries nothing issuance-related since 08-05; its newest item, **2026-09-08**, is an Iran sanctions action. | Treasury running an off-cycle coupon-size change or a CMB **before 2026-11-04** — 2026 has seen exactly **one** CMB in 301 auctions (2026-05-21, 27-Day, $25B) and no coupon change at all |
| This week | **Stand aside — this event has no channel open** | High | The **09-10** announcement in this corridor sits inside `sb0590`'s published Sep-26 row (`69 58 70 44 39 13 22 28`); it carries no December information. The next document that does is 56 days out. | The **2026-09-10** or **2026-09-17** announcement printing a size off `sb0590`'s published rows — the grid would be broken 84 days before this event reads it |
| This month | **Watch the October bill ramp, and the 10-15 / 10-22 announcements — don't act** | Medium | `sb0590` pre-announces *"In October, Treasury anticipates increasing auction sizes across the bill curve"*, and the December short-bill taper starts from wherever that ramp ends. 10-15 and 10-22 are the **last two** announcements `sb0590` covers, so a deviation there is the earliest dated tell the coupon path is turning. | Either October announcement printing a coupon size off `sb0590`'s Oct-26 row (`69 58 70 44 39 13 22 30`) — this doc's coupon calls get re-derived, not patched |
| This quarter | **Read 12-03 as a scheduled nil on five of six legs — and correct any doc still carrying $42B/$25B for December** | High on the coupons, low on the 6-week | Five legs are pinned by base rates with no deviation (3Y $58B ×30, 10Y R $39B ×21, 30Y R $22B ×21, 13-week and 26-week flat through **both** prior Decembers). The **6-week** is the one live number and its base rate is a coin flip. | The **2026-11-04** refunding publishing a Dec-26 **10-Year cell other than 39 or 30-Year cell other than 22** — the first nominal coupon size change since April 2024, and it kills [`FT-…-12-03-1`](../forward-tests/treasury-coupon-announcement-2026-12-03.md) 29 days before the announcement it predicts |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, date `estimate`, no rates-keyed house playbook.
- **The correction, quotable with its base rate:** December's 10-Year and 30-Year are **reopenings** —
  **$39B** (21/21 since 2024-03-12) and **$22B** (21/21 since 2024-03-13), not $42B/$25B.
- **The 3-Year is the only genuinely new CUSIP.** It is a new issue every month (`reopening: "No"` on
  all 45 rows since 2023); the 10-Year and 30-Year reopen the **November refunding's own** securities.
- **The 6-week bill is the only number that can carry information**, and its direction is down into the
  **December 15 corporate tax date**: 2024 ran 80 → 75 → 70 → 65 across the December announcements;
  2025 cut 95 → 85 → 75 in late November and then held flat through 12-30.
- **13-week and 26-week are pinned, 2 of 2 prior Decembers** — $81B/$72B flat through December 2024,
  $86B/$77B flat for twelve straight auctions through 2025-12-29. Currently $92B/$79B since 2026-06-29.
- **The FOMC straddle is structurally rare and measurably inert.** Only **3 of 45** coupon blocks since
  2023-01 were straddled by an FOMC decision (2 of them SEP meetings); the three 30-Year legs that
  auctioned the day after scored **+1.45σ, −0.88σ, −1.78σ** on bid-to-cover. No signal — see leg 6.
- **2026-11-04 is the whole risk, and it is one date.** Borrowing estimates **11-02**, refunding **11-04**.
- **Watch (dated):** announcements **09-10** · **10-15** · **10-22** · bills-only **10-29** · borrowing
  estimates **11-02** · **refunding 11-04 (the Dec-26 row appears here)** · Nov announcements **11-12**
  and **11-19** · Thanksgiving-shifted bill announcement **11-25** · **this announcement 12-03** ·
  3Y **12-07** · 10Y **12-08** · **FOMC + SEP 12-09** · 30Y **12-10** · **CR expiry 12-11**.

## Initial research

### The question, plainly

This event reached the calendar as a proposal written by another lane, and that proposal ends with a
number: *"Expect $58B/$42B/$25B."* The same paragraph correctly records that the schedule marks the
10-Year and 30-Year with `R`. Those two facts contradict each other, because a reopening and a new
issue have never been the same size in the modern grid. So the question this document has to answer
first is not *what will 12-03 say* but **which of the proposal's two halves is right** — and then, once
that is settled, the question the series actually cares about: *given that the 2026-11-04 refunding
publishes these numbers 29 days early, is anything left in this release at all?*

**One-line verdict:** the `R` flags are right and the numbers are wrong — **$58B / $39B / $22B** —
and once corrected, 12-03 is the **most information-free announcement in the series**, with exactly
one live number in it (the 6-week bill) and exactly one genuinely-unknowable field (the 3-Year CUSIP).

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the
mandated cache bust has nothing to bust (recorded rather than skipped silently). This event existed
only as `proposals/treasury-coupon-announcement-2026-12-03.from-treasury-3y-note-2026-12-07.json`
(2026-09-09); that single proposal was read in full first, and this session writes the canonical
`src/domain/market-events/treasury-coupon-announcement-2026-12-03.json` itself. Everything
quantitative below is **primary and fetched this session (2026-09-09)**, never from memory and never
from a sibling ledger's summary:

- **The dates and composition** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`,
  plain curl (HTTP 200, 17,195 bytes). Four FlateDecode streams inflated, text re-tokenised into
  `(type, announce, auction, settle)` rows by `Tm` coordinate, 236 rows recovered.
- **The base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, six pulls: all Note/Bond rows
  since 2023-01-01 (399); all 2026 bills (226); Oct-2024→Feb-2026 bills (115) and Jun→Dec-2025 bills;
  everything announced 2025-12-01→06 (10 rows); and every auction under $500M since 2012 (12).
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590`, fetched direct (HTTP 200, 75,575
  bytes), tag-stripped and read in full, specifically to establish what it does **not** cover.
- **The FOMC dates** — `federalreserve.gov/monetarypolicy/fomccalendars.htm` (HTTP 200, 164,831 bytes),
  tag-stripped; meeting dates and SEP asterisks read for 2023 through 2027.
- **The tape** — Treasury's own 2026 daily par-yield CSV (HTTP 200, 172 rows) and Yahoo `^VIX`.
- **The press check** — `home.treasury.gov/news/press-releases` index (HTTP 200, 71,184 bytes).

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).

### Conviction legs, tested

**1. The event fires 2026-12-03 and publishes SIX securities, not three — SUPPORTED, and this is the
first correction to the proposal that created it.** The page-3 rows carrying announce date
`Thursday, December 03, 2026`:

| Security | Auction | Settlement |
|---|---|---|
| `13-Week BILL` | Monday, December 07, 2026 | Thursday, December 10, 2026 |
| `26-Week BILL` | Monday, December 07, 2026 | Thursday, December 10, 2026 |
| `6-Week BILL` | Tuesday, December 08, 2026 | Thursday, December 10, 2026 |
| `3-Year NOTE` — **no `R`, a new issue** | Monday, December 07, 2026 | Tuesday, December 15, 2026 |
| `10-Year NOTE / R` — **reopening** | Tuesday, December 08, 2026 | Tuesday, December 15, 2026 |
| `30-Year BOND / R` — **reopening** | Thursday, December 10, 2026 | Tuesday, December 15, 2026 |

Same class of correction the [11-12 sibling](treasury-coupon-announcement-2026-11-12.md) made
(*"FIVE securities, not two"*) and the [10-22 sibling](treasury-coupon-announcement-2026-10-22.md)
before it. It is load-bearing here for a different reason than there: it is what makes leg 4's
"every number is a repeat" claim checkable across the whole release rather than half of it.

**2. The proposal's sizes are wrong, and the `R` flags say so — SUPPORTED, n=21 and n=21, zero
deviations.** `auctions_query`, all Note/Bond rows since 2023-01-01 (399), grouped by `security_term`
and `reopening`:

| Leg | December 2026 status | Size | Consecutive | Last change |
|---|---|---|---|---|
| 3-Year | new issue (monthly) | **$58B** | **30** since 2024-04-09 | 2024-03-11 at $56B |
| 10-Year | **reopening** (`9-Year 11-Month`) | **$39B** | **21** since 2024-03-12 | 2024-01-10 at $37B |
| 30-Year | **reopening** (`29-Year 11-Month`) | **$22B** | **21** since 2024-03-13 | 2024-01-11 at $21B |

The proposal's $42B and $25B are the **new-issue** sizes — correct for a February/May/August/November
refunding month, wrong for December. `sb0590`'s own table shows the split twice: its refunding rows
read `... 42 16 25 ...` (May-26, Aug-26) and its mid-quarter rows `... 39 13 22 ...` (Jun-26, Jul-26,
Sep-26, Oct-26). **This is the correction most likely to propagate**, because "the December block is
3Y/10Y/30Y" is true and invites the refunding-month numbers by association.

**3. December's reopening CUSIPs are already determined; only the 3-Year's is unknowable — SUPPORTED,
and it narrows the proposal's claim rather than repeating it.** The proposal said the CUSIP *"does not
exist until this morning"*, true of the 3-Year and only the 3-Year: all 45 3-Year rows since 2023 carry
`reopening: "No"`, a fresh CUSIP every month. The other two reopen the **November refunding's own
securities** — the pattern is exact in every prior year (`91282CPJ4` sold new in November 2025, then
reopened 2025-12-09 and 2026-01-12; `912810UP1` likewise, 2025-12-11 and 2026-01-13). So of the six
CUSIPs this announcement publishes, five are mechanically derivable from the November block and the
weekly bill cycle, and one is not.

**4. Both prior Decembers are exact six-security twins, and the 2025 one printed nothing new —
SUPPORTED, and it is this document's central finding.** Pulling everything announced 2025-12-01→06
(`auctions_query`, 10 rows) gives the 2025-12-04 announcement in full:

| Security | Size | Auction |
|---|---|---|
| 3-Year | $58B | 2025-12-08 |
| 13-Week | $86B | 2025-12-08 |
| 26-Week | $77B | 2025-12-08 |
| 10-Year `R` (91282CPJ4) | $39B | 2025-12-09 |
| 6-Week | $75B | 2025-12-09 |
| 30-Year `R` (912810UP1) | $22B | 2025-12-11 |

**Every one of those six equalled its immediately preceding comparable print.** 13-week had been $86B
since 2025-10-14 and stayed $86B through 2025-12-29; 26-week $77B over the identical span; the 6-week
had already been cut to $75B at the 12-02 auction, so the 12-09 print was a repeat; the three coupons
were on their multi-year runs. The 2024-12-05 announcement is the same shape — 3-Year $58B (12-10),
13-Week $81B, 26-Week $72B, 10-Year `R` $39B (12-11), 30-Year `R` $22B (12-12) — with **one**
exception, which leg 5 owns.

**5. The 6-week is the only leg that has ever moved at a December announcement — SUPPORTED, and it is
1 of 2, stated as the coin flip it is.** The 2024-12-05 announcement sized the 42-Day (the 6-week's
label at the time — a method caveat, not a different security) at **$70B**, down from $75B the prior
week, on a taper that ran **80 (11-19) → 75 (12-03) → 70 (12-10) → 65 (12-17)** before rebounding to
$85B by 2025-01-07. 2025 did the same taper **earlier**: 95 (11-18) → 85 (11-25) → 75 (12-02), then
flat through 12-30, so its December announcement carried no change at all. The 4-week and 8-week take
the same December cut in both years (2025: 110 → 100 → 90 → 85 → 80; 2024: 95 → 85 → 80 → 75) but are
**not on this announcement** — the schedule announces them on Tuesdays, and the 12-03 pair was
announced 12-01. **2026's taper is already running ~2.5 months early** (6-week 95 → 85 → 75 across
08-25/09-01/09-08, exactly the September reduction `sb0590` pre-announced), and `sb0590` then promises
an October increase, so where the 6-week sits by December is genuinely open. That is the whole honest
unknown in this release, and it is one number.

**6. The FOMC straddle is structurally rare and measurably does nothing — MIXED (rare: yes; effect:
REFUTED), and it is registered here as a null rather than a story.** Grouping every 3Y/10Y/30Y block
since 2023-01 by announcement date gives **45 complete blocks**. Checking each against the Fed's own
meeting calendar (fetched this session; decision dates are the second day of each two-day meeting):
only **3** blocks had an FOMC decision fall strictly between the first and last auction —
**2024-06-12** (SEP), **2025-05-07**, **2025-12-10** (SEP). December 2026 will be the **fourth**, and
the **third** with a Summary of Economic Projections. The tempting story is that the 30-Year, which
auctions the day *after* the decision, pays for the uncertainty. It does not:

| Straddled block | 30Y leg | Bid-to-cover | z vs the $22B-era series |
|---|---|---|---|
| 2024-06-12 (SEP) | 2024-06-13 | 2.49 | **+1.45** |
| 2025-05-07 | 2025-05-08 | 2.31 | **−1.78** |
| 2025-12-10 (SEP) | 2025-12-11 | 2.36 | −0.88 |

Mean −0.40σ across a 3.2σ spread, n=3 — the two SEP cases sit on **opposite** sides of the mean. The
10-Year legs, which auction the day *before*, are equally silent (+1.29, +0.50, −0.06). The
configuration is rare; the consequence is not measurable, and no forward test is registered on it,
because n=3 with an inverted sign is not an effect waiting for confirmation. (The
[3-Year sibling](treasury-3y-note-2026-12-07.md) tests a **different** question on the same corridor —
concession rather than cover, on the 3-Year rather than the 30-Year, with n=213. This doc defers to it
and does not restate it.)

**7. A Thursday announce date is the mid-quarter tell, with one explainable exception — SUPPORTED,
n=45.** Classifying every 3-Year announcement since 2023 by whether the same date also announced a
10-Year *new issue*: **refunding announcements are Wednesday, 15 of 15**; **mid-quarter announcements
are Thursday, 29 of 30**. The single exception is **2024-07-03**, a Wednesday, displaced by the
Independence Day holiday. So the proposal's structural note is right and now has its number and its
exception attached. 2026-12-03 is a Thursday.

**8. Nothing has moved the guidance, and the press channel is clear — SUPPORTED, checked this session.**
`sb0590`'s NOMINAL COUPON AND FRN FINANCING paragraph still reads *"Treasury anticipates maintaining
nominal coupon and FRN auction sizes for at least the next several quarters,"* its size table still
ends at **Oct-26** (final row `Oct-26 69 58 70 44 39 13 22 30`), and its closing line names the next
refunding in writing: *"The next quarterly refunding announcement will take place on Wednesday,
November 4, 2026."* That last sentence is an independent **`TSY:`-grade primary** for
`treasury-refunding-2026-11-04`, currently tracked as `estimate` on a different lane's file — recorded
here as corroboration, not edited, per the one-file-per-owner rule. Treasury's press index (HTTP 200)
lists nothing issuance-related since the 08-05 refunding; its newest item, **2026-09-08**, is *"Treasury
Grounds Iranian Airlines with Sweeping Sanctions Action."*

**9. The grid does not respond to the tape — SUPPORTED, re-derived.** All **75** nominal coupon and FRN
auctions of 2026 in the pull took one of eight fixed sizes with zero deviations, across a 2026 10-Year
par-yield range that runs to **4.80** as of 09/08. `sb0590` names the shock absorber in its own words —
variations are met *"through changes in regular bill auction sizes and/or CMBs"* — and 2026 has run
**exactly one CMB** (2026-05-21, 27-Day, $25B) in 301 auctions. A rates selloff between now and
December cannot reach the coupon legs; it can reach the 6-week, which is the same sentence read the
other way.

**10. Checked and discarded as a non-finding — the $25M "extra" auction.** Both prior December
announcements carry a same-day curiosity: a **$25M 4-Day bill** announced and auctioned 2024-12-05, and
a **$25M 2-Day bill** announced and auctioned 2025-12-04. Two for two on a December announcement date
looks like a rule. It is not. Widening the query to every auction under $500M since 2012 returns
**exactly 12 rows**, all $25M, all announced and auctioned the same day, spread across Bills, Notes and
Bonds and across the calendar — 2016-08-17, 2017-04-07, 2018-01-19, 2019-06-21, 2019-12-06, 2020-07-10,
2020-12-17, 2021-12-02, 2022-07-14, 2023-08-17, plus the two above. Roughly annual, irregular in date
and type, **5 of 12 in December**, and no Treasury primary read this session names a mechanism. So it
is recorded as an artifact to expect-or-not, never as a prediction. Stating it is the point: the
2-for-2 version of this finding would have been wrong and would have looked rigorous.

**11. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury's 2026 par CSV (172 rows) ends **09/08**: 2Y **4.39** · 3Y **4.44** · 10Y **4.80** · 20Y
**5.26** · 30Y **5.25**. **VIX 15.72**, the 2026-09-08 close (fetched 2026-09-09 at 05:27 UTC, before
the US open, so no 09-09 print exists yet — stated rather than glossed), against **14.53** on 09-04:
**+1.19**, inside the 3-point threshold. The feed's **15.30** bar dated **09-07** is a Labor Day closure
artifact; **flagged and not adopted**, same as the siblings. At D-85 none of this is information about
December.

**12. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`. An
announcement of auction sizes has no equity transmission path; the duration channel that reaches this
calendar's names is the long-end *yield*, which the 12-07/12-08/12-10 **auctions** inform and this
announcement does not.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What the
conditions support is a **correction and a downgrade**. The correction: any document in this corpus
that carries $42B or $25B for December is wrong, and the seeding proposal is the one known instance.
The downgrade: after the 11-12 sibling correctly framed November as *"not the scheduled nil its
September and October siblings were,"* the natural next inference is that the unpublished-numbers
problem persists into December. It does not. November's coupon sizes were genuinely unpublished at
research time; December's will have been in writing for **29 days** by the time 12-03 fires, because
the same 11-04 statement covers Nov, Dec and Jan. On the bill side the asymmetry runs the same
direction: November's 13-week and 26-week sat in the middle of `sb0590`'s pre-announced October ramp,
while December's have been flat through **both** prior Decembers. December is where this series goes
quiet, and saying so plainly is more useful than manufacturing a live question out of it.

### Honest limits

**Every coupon number here is a base rate, not a quotation** — no Treasury document names a December
size today, and legs 2 and 3 are structure, not a fetched field. **The tentative schedule is
tentative**, its PDF was created **2026-08-04**, three months before the refunding that can revise it,
and this lane may not self-confirm it. **The 6-week call is deliberately not a number**; n=2 on
December behaviour is two observations, and the 2026 taper is already running on a different clock
than either. **Leg 6's null is n=3** and is reported as an absence of evidence, not evidence of
absence — the honest claim is that the configuration is rare and that nobody should assume it costs
anything. **The base rates sit inside one policy regime** and one guidance sentence with a dated
review at 11-04. **The ~11:00 ET announcement time is unsourced convention**, inherited from the
sibling ledgers. **`original_security_term` is unreliable** — the 11-12 sibling's caveat holds and was
re-encountered here; December's reopenings must be identified by `security_term` + `reopening` + size,
never by label alone. **The `42-Day` → `6-Week` relabelling** between 2024 and 2025 is a naming change
in the same series and is treated as such, which is an interpretation the data does not itself assert.
**The `treasury-30y-bond-2026-12-10` event does not exist yet** except as another lane's proposal, so
leg 6's null has no owner to score it; it is recorded here and registered nowhere.

## Stance & kill switches

**Stance (date `estimate`; the coupon numbers are DEDUCED today and will be PUBLISHED 2026-11-04).**
This announcement is a **scheduled nil on five of its six legs**, and the correction it carries is
worth more than its forecast. Expect **3-Year new issue $58B**, **10-Year reopening $39B** and
**30-Year reopening $22B** — *not* the $58B/$42B/$25B the seeding proposal named, which mistook
reopening months for refunding months. Expect the **13-week and 26-week to print unchanged** from
their 2026-11-30 auctions, on a 2-of-2 December base rate and a 2026 run of eleven straight at
$92B/$79B. Expect the **6-week to be the only live number**, direction down into the December 15
corporate tax date, magnitude unpredictable because 2026's taper started in September rather than
late November. No position is or should be taken on any of it. The doc's durable outputs are three:
(a) **the size correction**, with `R` flags and two 21-length base rates behind it; (b) **the
information-content measurement** — the 2025-12-04 twin printed six numbers and every one was a
repeat, which is the strongest quantitative support this calendar has for calling any announcement a
nil; and (c) **two nulls reported as nulls** — the FOMC straddle (rare, n=3, no measurable demand
effect, inverted sign) and the $25M micro-auction (a 2-for-2 December pattern that dies at n=12).

**Forward tests registered** in
[`forward-tests/treasury-coupon-announcement-2026-12-03.md`](../forward-tests/treasury-coupon-announcement-2026-12-03.md):

- **`FT-treasury-coupon-announcement-2026-12-03-1`**, scoreable **2026-12-04** — the announcement
  publishes the **10-Year reopening at $39B and the 30-Year reopening at $22B**. This is the
  correction under test, not the grid-holds question the 11-12 sibling registered: that one asks
  whether a *new-issue* size survives the guidance boundary, this one asks whether the
  reopening/new-issue split itself is what December uses.
- **`FT-treasury-coupon-announcement-2026-12-03-2`**, scoreable **2026-12-04** — the **13-week and
  26-week print unchanged** from their 2026-11-30 auction sizes, and **if any of the six legs moves,
  it is the 6-week**. The weak leg is named in advance rather than discovered afterwards.

**Kill switches:**

- **The 2026-11-04 refunding publishing a Dec-26 10-Year cell other than 39, or 30-Year cell other
  than 22** — the first nominal coupon size change since April 2024. `FT-…-12-03-1` dies 29 days
  before the announcement it predicts, and every "December is settled" line here gets re-derived.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at 11-04 or before —
  the deducibility frame is conditional on that sentence. [`FT-39`](../forward-tests.md) owns the
  guidance-language channel; this doc defers to it and does not re-register it.
- **Either October announcement (10-15, 10-22) printing a size off `sb0590`'s Oct-26 row** — the
  earliest dated tell, inside the published window, that the path is turning.
- **A 13-week or 26-week size change at any announcement between 11-05 and 12-03** — the pinned-bill
  half of `FT-…-12-03-2` is a December regularity, not a law, and a November move would retire it
  before it scores.
- **Treasury revising the Tentative Auction Schedule at 11-04 so the December block no longer
  straddles the 12-09 FOMC, or moves off 12-03** — voids rather than kills; leg 6's rarity count and
  leg 7's Thursday rule both stop applying to this instance.
- **An off-cycle issuance action** — a CMB or a coupon size changed between refundings — making supply
  a live variable for the first time in 2026. `sb0590` explicitly reserves **bill**-size and CMB
  flexibility, so a bill action does **not** fire this; only a coupon one does.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-85 | **Initial research. Canonical file written by this session** — the event existed only as `proposals/treasury-coupon-announcement-2026-12-03.from-treasury-3y-note-2026-12-07.json`, read in full first per EVENT-RESEARCH.md. **TWO corrections to that proposal, both derived from primaries this session.** (1) **Composition: SIX securities, not three.** The Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, `CreationDate` 2026-08-04, four streams inflated and 236 rows rebuilt from `Tm` coordinates) carries on `Thursday, December 03, 2026`: `13-Week BILL` + `26-Week BILL` (auction Mon 12-07), `6-Week BILL` (auction Tue 12-08), `3-Year NOTE` — no `R` — (auction Mon 12-07, settle Tue 12-15), `10-Year NOTE / R` (auction Tue 12-08) and `30-Year BOND / R` (auction Thu 12-10). (2) **Sizes: the proposal's `$58B/$42B/$25B` is wrong.** $42B/$25B are new-issue sizes; the December 10-Year and 30-Year carry `R`. `auctions_query` (399 Note/Bond rows since 2023-01-01) gives **10-Year reopening $39B for 21 consecutive since 2024-03-12** (previous $37B, 2024-01-10) and **30-Year reopening $22B for 21 consecutive since 2024-03-13** (previous $21B, 2024-01-11), zero deviations; 3-Year new issue **$58B ×30 since 2024-04-09**. `sb0590`'s table shows the split twice (refunding rows `42 16 25`, mid-quarter rows `39 13 22`). **Central finding — December is the series' most information-free announcement, measured.** Everything announced 2025-12-01→06 (10 rows) gives the 2025-12-04 twin in full: 3Y $58B, 13-wk $86B, 26-wk $77B, 10Y `R` $39B (91282CPJ4), 6-wk $75B, 30Y `R` $22B (912810UP1) — **all six equalled their immediately preceding comparable print**. 2024-12-05 is the same six-security shape with one exception: its 42-Day leg printed **$70B, down from $75B**, on a taper 80→75→70→65 across December. So **13-week and 26-week are 2-for-2 flat through December** ($81/$72 in 2024, $86/$77 for twelve straight in 2025; currently $92B/$79B since 2026-06-29) and **the 6-week is 1-for-2 on carrying a change** — the release's only live number. 2026's taper already ran early (6-wk 95→85→75 across 08-25/09-01/09-08, the September reduction `sb0590` pre-announced), with an October increase promised. **CUSIP asymmetry narrowed:** only the 3-Year's is unknowable (all 45 rows `reopening: "No"`); the two reopenings reuse the November refunding's own securities, as `91282CPJ4`/`912810UP1` did in 2025. **FOMC straddle — rare, and REFUTED as an effect.** Grouping all 45 3Y/10Y/30Y blocks since 2023-01 against `federalreserve.gov`'s own calendar (HTTP 200, fetched this session; **2026-12-09 confirmed as a two-day meeting Dec 8–9 with an SEP asterisk**): only **3 of 45** were straddled — 2024-06-12 (SEP), 2025-05-07, 2025-12-10 (SEP) — making December 2026 the 4th and the 3rd SEP. Their 30-Year day-after legs scored **+1.45σ / −1.78σ / −0.88σ** on bid-to-cover against the $22B-era series (n=20, mean 2.409, σ 0.056); the 10-Year day-before legs +1.29 / +0.50 / −0.06. No signal, inverted sign, **no forward test registered on it**. **Announce-day rule quantified:** refunding announcements Wednesday **15/15**, mid-quarter Thursday **29/30**, the single exception 2024-07-03 displaced by Independence Day. **Checked and discarded as a non-finding:** both prior December announcements carry a same-day **$25M** micro-auction (4-Day 2024-12-05, 2-Day 2025-12-04) — but every auction under $500M since 2012 is **exactly 12 rows**, all $25M, all same-day announce-and-auction, across Bills/Notes/Bonds and across the calendar, 5 of 12 in December. Roughly annual and irregular, no primary naming a mechanism; recorded, not predicted. **Guidance re-read (HTTP 200, 75,575 bytes):** `sb0590` still ends at **Oct-26** (`69 58 70 44 39 13 22 30`), still carries *"for at least the next several quarters"*, and states in writing *"The next quarterly refunding announcement will take place on Wednesday, November 4, 2026"* — a **`TSY:`-grade primary corroborating `treasury-refunding-2026-11-04`**, recorded not edited (one file per owner). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** the 12-03 corridor is dense (25 tracked entries within ±5 days: ISM services 12-03, jobs 12-04, ISM manufacturing/JOLTS/Georgia runoff 12-01) but none of it reaches an announcement whose numbers were set 11-04; the only macro dates that do are **11-02 borrowing estimates → 11-04 refunding**. **Volatility:** **VIX 15.72**, the 09-08 close (fetched 05:27 UTC 09-09, pre-open, so no 09-09 print exists), vs **14.53** on 09-04 — **+1.19**, inside threshold; the **15.30** bar dated **09-07** is a Labor Day closure artifact, **flagged and not adopted**. **Rates:** Treasury's 2026 par CSV (172 rows) ends 09/08 — 2Y **4.39** · 3Y **4.44** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**. **Geopolitical:** Treasury's press index (HTTP 200, 71,184 bytes) has nothing issuance-related since 08-05; newest item **2026-09-08**, an Iran sanctions action. **Corroboration for a sibling:** the PDF carries its own line `Holiday - Thursday, November 26, 2026 - Thanksgiving Day`, a Treasury primary for `thanksgiving-market-closure-2026-11-26` (proposal-only today), and shows the 11-26 bill announcement displaced to **Wednesday 11-25**. **NO new dated adjacent event proposed** — every dated item this sweep surfaced (`treasury-3y-note-2026-12-07`, `treasury-10y-note-2026-12-08`, `treasury-30y-bond-2026-12-10`, `fomc-2026-12-09`, `cr-expiry-2026-12-11`, the Thanksgiving closure) is already canonical or already proposed by another lane; the only untracked rows in the corridor are the weekly 4-week/8-week bill auctions, which this calendar does not track individually. **`FT-…-12-03-1`** (10Y `R` $39B and 30Y `R` $22B, scores 2026-12-04) and **`FT-…-12-03-2`** (13-week and 26-week unchanged from their 11-30 prints; the 6-week named in advance as the leg most likely to move, scores 2026-12-04) **registered**. **All sources returned HTTP 200; nothing blocked this session.** | **Stance set** — a **scheduled nil on five of six legs**: **$58B / $39B / $22B**, correcting the seeding proposal's $42B/$25B; 13-week and 26-week pinned; the **6-week the only live number**. Two nulls reported as nulls (FOMC straddle, $25M micro-auction). Whole risk sits on **2026-11-04** | 2026-09-30 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-coupon-announcement-2026-12-03.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
