# Treasury January coupon announcement (3-Year new issue + 10-Year and 30-Year reopenings + three bills) — treasury-coupon-announcement-2027-01-07

**Kind:** rates · **Date:** 2027-01-07 (estimate, EST: treasury.gov Tentative Schedule of Treasury Auctions PDF, re-fetched by plain curl 2026-09-09, HTTP 200, 17,195 bytes, four FlateDecode streams inflated per page and rows rebuilt independently from `Tm` coordinates — SIX page-3 rows carry announce date `Thursday, January 07, 2027`; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.14,"daysBand":"medium:31+","adjacentIds":["eia-steo-2027-01-12","ism-manufacturing-2027-01-05","ism-services-2027-01-07","jobs-2027-01-08","treasury-10y-note-2027-01-12","treasury-3y-note-2027-01-11"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/news_release/2027_sched.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/schedule/news_release/empsit.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/schedule/news_release/cpi.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/bls/news-release/empsit.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/news.release/archives/empsit_01082021.pdf","status":"403","at":"2026-09-09"},{"url":"https://markets.newyorkfed.org/api/soma/tsy/get/all/asof/latest.json","status":"400","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **The coupon sizes here are a read-back — the two siblings already said so, and repeating
them would waste the session. The number nobody has measured is the SOMA rollover add-on, and it is
worth $26.2B.** On 2027-01-07 Treasury publishes a field called `SOMA Holdings Maturing on Issue
Date`, and the Fed re-invests it straight back into the block. That is why the January 2026 3-Year
"printed $74.88B" against a **$58B** offering — a reader who knows only the offering size sees a
29% overshoot and concludes the grid broke. It did not. Two mechanical rules, both measured this
session and neither previously in this corpus, generate that number exactly: the add-on **splits
strictly pro-rata by offering amount** (exact to under $1.5M on **34 of 34** non-zero blocks since
2022-12), and since **2026-01 the Fed rolls 100% of it, 7 blocks for 7** — QT-era partial roll-off
is over, which Treasury's own August statement corroborates when it says it is *"monitoring SOMA
purchases of Treasury bills."* Applying both to NY Fed's holdings maturing **2027-01-15** —
`912810PS1` and `912828V49`, two TIPS, **$17.85B par + $8.36B inflation compensation = $26.21B** —
gives add-ons of **~$12.8B / ~$8.6B / ~$4.8B** and total accepteds near **$70.8B / $47.6B /
$26.9B**. Date is `estimate`, `symbols: []`, no house playbook is rates-keyed. **Nothing here is a
trade** — it is a decoder for a field that otherwise reads as a broken grid.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-120) | **Stand aside** | High | Nothing dated between now and **2026-11-04** can reach any number this event publishes. `sb0590` (re-read this session, HTTP 200, 75,580 bytes) ends its size table at **Oct-26** and states in writing *"The next quarterly refunding announcement will take place on Wednesday, November 4, 2026"* — that statement sets the January coupon sizes **64 days** before 01-07 publishes them. Treasury's press index (HTTP 200) carries nothing issuance-related since 08-05; its newest item, **2026-09-08**, is an Iran sanctions action. | Treasury running an off-cycle coupon-size change or a CMB **before 2026-11-04** — 2026 has seen exactly **one** CMB (2026-05-21, 27-Day, $25B) and no coupon change at all |
| This week | **Stand aside — this event has no channel open** | High | The corridor's live announcements sit inside `sb0590`'s already-published Sep-26 row (`69 58 70 44 39 13 22 28`); none of them carries January information. The next document that does is 56 days out. | Any September or October announcement printing a coupon size off `sb0590`'s published rows — the grid would be broken 120 days before this event reads it |
| This month | **Watch the SOMA channel, not the coupon channel — don't act** | Medium | The one input to this document's headline number that is still moving is NY Fed's own holdings file. `912810PS1`/`912828V49` accrete inflation compensation until the **2027-01-15** reference CPI is fixed (from the **Oct-2026** CPI, published mid-November), and any SOMA sale, swap or reserve-management purchase re-bases the $26.21B. It is a weekly-published number and it is free to re-read. | NY Fed's weekly SOMA file showing par in `912810PS1` + `912828V49` moving off **$17.847B** — the pro-rata arithmetic gets re-derived rather than patched |
| This quarter | **Read 01-07 as a scheduled nil on the coupons and a live number on the 6-week — and correct any doc reading total-accepted as an offering-size breach** | High on the coupons, medium on the SOMA level, low on the 6-week | Three coupon legs are pinned by base rates with zero deviations (3Y $58B ×30 since 2024-04-09; 10Y `R` $39B and 30Y `R` $22B ×21 each since 2024-03-12/13, mid-quarter months pooled). The SOMA add-on's *mechanism* is 34/34 exact; only its *level* moves. The **6-week** is the one genuinely open leg, and the January bill ramp has historically landed AFTER this announcement (1 of 2). | The **2026-11-04** refunding publishing a Jan-27 **10-Year cell other than 39 or 30-Year cell other than 22** — the first nominal coupon size change since April 2024, killing [`FT-…-01-07-1`](../forward-tests/treasury-coupon-announcement-2027-01-07.md) 64 days before the announcement it predicts |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, date `estimate`, no rates-keyed house playbook.
- **The decoder, quotable:** total accepted ≠ offering amount on this block. Expect **~$70.8B / ~$47.6B / ~$26.9B** against offerings of **$58B / $39B / $22B** — the gap is the SOMA rollover, not a size change.
- **The pro-rata rule is exact, 34/34** — add-on per leg = total SOMA maturing × (that leg's offering ÷ $119B block total), to under $1.5M.
- **The 100%-reinvestment regime is 7/7 since 2026-01** and is the single assumption doing the most work here. Before 2026 the share ran 0–94% and was **not** predictable.
- **The SOMA maturing figure is derivable, validated 4/4** — non-bill SOMA par maturing on the issue date, plus TIPS inflation compensation. Bills maturing the same day are excluded.
- **The January reopenings print as `9-Year 10-Month` / `29-Year 10-Month`**, not December's `11-Month` labels — and the 10-Month rows must have `inflation_index_security` filtered out or 10-Year TIPS reopenings contaminate the series.
- **The block's Mon/Tue/Wed shape is restored in 2027 and was not there in 2026** — 2026 compressed to two days (3-Year and 10-Year both auctioned 2026-01-12) because New Year's Day fell on a Thursday.
- **13-week and 26-week are 0 for 2** at a January mid-quarter announcement; the **6-week is 1 for 2** and is the only leg that has ever moved at one.
- **Watch (dated):** borrowing estimates **11-02** · **refunding 11-04 (the Jan-27 row appears here)** · Nov announcements **11-12** / **11-19** · Dec announcements **12-03** / **12-24** · **this announcement 01-07** · derived jobs print **01-08** · 3Y **01-11** · 10Y **01-12** · 30Y **01-13** · settlement **01-15** · next refunding **2027-02-03**.

## Initial research

### The question, plainly

This event reached the calendar as **two** proposals, written by two different sibling lanes on the
same day, and — unusually for this series — both are right. The December sibling's session had to
spend itself correcting a proposal that named new-issue sizes for a reopening month; the 01-14
sibling's had to correct a proposal that called its own date the TIPS decision date. Neither
correction is available here: an independent re-extraction of the same PDF reproduces the
composition, the `R` flags and the Mon/Tue/Wed shape exactly.

That is a problem, not a relief. If the sizes are a read-back of the 2026-11-04 refunding — and
they are, for the same reason the two siblings gave — then a third document restating "the coupons
are settled, the bills are open" adds nothing this corpus does not already hold twice. So the
question this session actually has to answer is: **is there a number on this announcement that no
sibling has measured?**

**One-line verdict:** yes, one — the **`SOMA Holdings Maturing on Issue Date`** field, worth about
**$26.2B** here, which is the difference between the offering sizes everyone quotes and the total
accepteds that actually print, and whose two generating rules turn out to be mechanically exact
rather than approximate.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). This event
existed only as two proposals, `proposals/treasury-coupon-announcement-2027-01-07.from-treasury-10y-note-2027-01-12.json`
and `...from-treasury-30y-bond-2027-01-13.json`; both were read in full first, and this session
writes the canonical `src/domain/market-events/treasury-coupon-announcement-2027-01-07.json`
itself. Everything quantitative below is **primary and fetched this session (2026-09-09)**:

- **The dates and composition** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`,
  plain curl (HTTP 200, 17,195 bytes). Four FlateDecode streams inflated, text re-tokenised into
  `(type, announce, auction, settle)` rows by `Tm` coordinate.
- **The base rates and the SOMA fields** — `api.fiscaldata.treasury.gov` `auctions_query`: all
  Note/Bond rows since 2022-12 (408) and a second nominal-only pull since 2023-01 (355 after
  filtering `inflation_index_security`); all Bill rows since 2024-10 (648).
- **The SOMA holdings** — `markets.newyorkfed.org/api/soma/tsy/get/asof/<date>.json` at five
  as-of dates (2026-09-02, 2026-08-05, 2026-05-06, 2026-04-01, 2026-01-07), plus
  `/api/soma/asofdates/latest.json` to establish that **2026-09-02** is the current file.
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590`, fetched direct (HTTP 200,
  75,580 bytes), tag-stripped and read in full.
- **The tape** — Treasury's own 2026 daily par-yield CSV (HTTP 200) and Yahoo `^VIX`.
- **The press check** — `home.treasury.gov/news/press-releases` index (HTTP 200, 71,182 bytes).

**Blocked this session, recorded rather than substituted** (`probe-ref.blocked`): every bls.gov path
tried returned **HTTP 403** to curl under a browser user-agent — the documented GitHub-Actions blind
spot — and NY Fed's `/api/soma/tsy/get/all/asof/latest.json` returns **HTTP 400** (the working form
names an explicit as-of date). Where a BLS fact is used below it is derived and labelled `EST:`,
never presented as published.

### Conviction legs, tested

**1. The event fires 2027-01-07 and publishes SIX securities — SUPPORTED, and both proposals are
confirmed rather than corrected.** The page-3 rows carrying announce date `Thursday, January 07,
2027`, from this session's own extraction:

| Security | Auction | Settlement |
|---|---|---|
| `13-Week BILL` | Monday, January 11, 2027 | Thursday, January 14, 2027 |
| `26-Week BILL` | Monday, January 11, 2027 | Thursday, January 14, 2027 |
| `6-Week BILL` | Tuesday, January 12, 2027 | Thursday, January 14, 2027 |
| `3-Year NOTE` — **no `R`, a new issue** | Monday, January 11, 2027 | Friday, January 15, 2027 |
| `10-Year NOTE / R` — **reopening** | Tuesday, January 12, 2027 | Friday, January 15, 2027 |
| `30-Year BOND / R` — **reopening** | Wednesday, January 13, 2027 | Friday, January 15, 2027 |

The 4-Week, 8-Week and 17-Week bills that auction or settle in the same corridor are announced
**2027-01-05**, not on this date, and are not this event's. Recording the *absence* of a correction
is the point: three consecutive sibling ledgers opened on one, and a reader is entitled to know that
this one did not have to.

**2. The coupon sizes are a read-back of the 2026-11-04 refunding — SUPPORTED, and deliberately NOT
this document's headline.** `sb0590`'s size table ends at **Oct-26** (`69 58 70 44 39 13 22 30`)
and its closing line names the next refunding in writing. The November refunding covers November,
December **and January**, so by 01-07 these numbers will have been public for **64 days**. Base
rates, nominal only:

| Leg | January 2027 status | Size | Consecutive (pooled mid-quarter) | Last change |
|---|---|---|---|---|
| 3-Year | new issue (monthly) | **$58B** | **30** since 2024-04-09 | 2024-03-11 at $56B |
| 10-Year | **reopening** (`9-Year 10-Month`) | **$39B** | **21** since 2024-03-12 | 2024-01-10 at $37B |
| 30-Year | **reopening** (`29-Year 10-Month`) | **$22B** | **21** since 2024-03-13 | 2024-01-11 at $21B |

This reproduces the [12-03 sibling](treasury-coupon-announcement-2026-12-03.md)'s 21/21 counts
exactly, which is a useful cross-check on both sessions and **not a new finding**. The
[01-14 sibling](treasury-coupon-announcement-2027-01-14.md) makes the same read-back argument for
its own block. Two documents already own this ground; leg 3 is where this one earns its keep.

**3. The SOMA rollover add-on is the field nobody has measured, and its split rule is exact —
SUPPORTED, 34 of 34 blocks, zero deviations.** Every coupon announcement publishes
`SOMA Holdings Maturing on Issue Date`; the Fed tenders a non-competitive bid for some or all of it,
and the accepted amount lands **on top of** the offering size. Grouping all 3Y/10Y/30Y blocks since
2022-12 by announcement date and testing whether each leg's `soma_accepted` equals the block total
times that leg's share of the block's offering:

| Blocks with a non-zero add-on | Pro-rata split exact (< $1.5M) |
|---|---|
| **34** | **34** |

Worked, on the most recent January (announce 2026-01-08, block total $119B):

| Leg | Offering | Share | Predicted add-on | Actual `soma_accepted` |
|---|---|---|---|---|
| 3-Year | $58B | 58/119 | $16.882B | **$16.882B** |
| 10-Year `R` | $39B | 39/119 | $11.352B | **$11.352B** |
| 30-Year `R` | $22B | 22/119 | $6.404B | **$6.404B** |

This is arithmetic, not a tendency, and it is why the January 2026 3-Year shows **$74.882B total
accepted** against a $58B offering. **A reader who quotes only the offering size mis-states this
block by 22%**, and that is the concrete failure this document exists to prevent.

**4. The Fed's roll-off share went to zero, and the regime break is dated — SUPPORTED, 7 of 7 since
2026-01, and it is the assumption doing the most work.** The same grouping, as a share of SOMA
maturing:

| Era | Blocks | Share re-invested |
|---|---|---|
| 2022-12 → 2023-12 | 12 | **0%–54%**, six of them exactly zero |
| 2024 | 10 | **5%–64%** |
| 2025 (through 11-05) | 10 | **25%–94%**, rising monotonically in trend |
| **2026-01-08 onward** | **7** | **100.0%, every one** |

The 2026 blocks — announce dates 01-08, 02-04, 03-05, 04-02, 05-06, 07-02, 08-05 — roll **every
dollar** back in (03-05 does so on a $0.03B stub, which is a real observation and a thin one). Three
2026 blocks had literally nothing maturing (06-04, 09-03, and 2025's 09-04 and 12-04) and are
excluded rather than counted as zeros. **Independent corroboration from a Treasury primary, not from
the same dataset:** `sb0590` says Treasury's sizes leave it well positioned for changes *"to the
size and composition of the SOMA portfolio,"* and — decisively — that *"Treasury is monitoring SOMA
purchases of Treasury bills."* A portfolio that is *purchasing* is not a portfolio running off.

**5. The SOMA-maturing figure is derivable before the announcement, not merely read off it —
SUPPORTED, 4 of 4 settled blocks.** Testing the hypothesis that the published field equals
**non-bill SOMA par maturing on the issue date, plus TIPS inflation compensation**:

| Issue date | Derived from NY Fed holdings | Treasury published | Note |
|---|---|---|---|
| 2026-08-17 | $31.618B | **$31.62B** | three nominal notes, no TIPS |
| 2026-05-15 | $29.681B | **$29.68B** | two nominal notes |
| 2026-04-15 | $21.065B | **$21.10B** | one note + one TIPS; par alone gives $17.483B and **fails** |
| 2026-01-15 | $34.673B (as of 01-07) | **$34.638B** | two TIPS; the $0.035B gap is eight days of accretion |

Two things this test settles that a single case could not. **Inflation compensation is included** —
the 04-15 block is only reproducible with it, and par alone is off by 21%. **Bills are excluded** —
the 2026-01-15 date also had `912797RJ8`, a $7.795B bill, in SOMA, and including it overshoots.

**6. Applied to 2027-01-15, the 10-Year proposal's arithmetic is confirmed and now has a derivation
— SUPPORTED.** NY Fed's current file (as of **2026-09-02**, confirmed current via
`/api/soma/asofdates/latest.json`) shows exactly two non-bill holdings maturing **2027-01-15**, both
TIPS:

| CUSIP | Type | Par | Inflation compensation | Total |
|---|---|---|---|---|
| `912810PS1` | TIPS (2.375%) | $5.609B | $3.680B | $9.289B |
| `912828V49` | TIPS (0.375%) | $12.238B | $4.681B | $16.919B |
| | | **$17.847B** | **$8.361B** | **$26.208B** |

At a $58B/$39B/$22B block and 100% reinvestment, pro-rata gives **$12.77B / $8.59B / $4.85B**, for
total accepteds near **$70.77B / $47.59B / $26.85B** — each **+22.0%** on its offering. The
10-Year proposal asserted *"~$8.6B against a ~$47.6B total accepted"* and lands exactly here; what
it did not have, and this document supplies, is legs 3, 4 and 5 underneath it.

**7. The January block's Mon/Tue/Wed shape is restored in 2027, and the 2026 compression has a
mechanism — SUPPORTED.** The January block always settles **January 15**; the announcement rides
the Thursday bill cycle; New Year's Day decides how much room is left between them:

| Year | New Year's Day | Announce | Auctions | Settle | Shape |
|---|---|---|---|---|---|
| 2025 | Wed 01-01 | Thu 01-02 | Mon 01-06 / Tue 01-07 / Wed 01-08 | Wed 01-15 | three days |
| 2026 | **Thu 01-01** | Thu **01-08** | **Mon 01-12 / Mon 01-12** / Tue 01-13 | Thu 01-15 | **two days** |
| 2027 | Fri 01-01 | Thu 01-07 | Mon 01-11 / Tue 01-12 / Wed 01-13 | Fri 01-15 | three days |

In 2026 the holiday consumed the first Thursday, pushing the announcement to 01-08 and leaving only
Monday and Tuesday before a Thursday settlement — so the 3-Year and 10-Year **doubled up on
2026-01-12**, confirmed in Treasury's own rows (`91282CPT2` and `91282CPJ4`, same auction date).
2027's Friday New Year's Day restores the canonical shape. This matters to the auction ledgers
downstream, which assume one auction per day.

**8. The security-term label changes in January, and the naive query returns the wrong series —
SUPPORTED, and it is a trap this corpus has not yet named.** December's reopenings are the *first*
reopening of the November refunding security and print as `9-Year 11-Month` / `29-Year 11-Month`;
January's are the *second* and print as `9-Year 10-Month` / `29-Year 10-Month`. Worse, the
10-Month rows are contaminated: 10-Year **TIPS** reopenings carry the same `security_term`, so an
unfiltered pull returns `2023-03:$15B, 2023-09:$15B, 2024-03:$16B, …` interleaved with the nominals.
Filtering `inflation_index_security` gives the clean January-label series — **$39B for 10
consecutive since 2024-04-10** and **$22B for 10 consecutive since 2024-04-11**. The pooled
mid-quarter count (21/21) is the right base rate for the *size* question, because Treasury sets one
reopening size per quarter across both months; the label distinction is for anyone re-running the
query.

**9. The January bill ramp is real and lands AFTER this announcement — MIXED, 1 of 2.** The
6-week/42-Day is the only leg that has ever moved at a January mid-quarter announcement, and the
two observations disagree on timing:

- **2025-01-02** (the mid-quarter announcement): 42-Day **$75B → $85B**; 13-week $84B and 26-week
  $72B unchanged, then flat all January.
- **2026-01-08** (the mid-quarter announcement): 6-week $75B, 13-week $86B, 26-week $77B — **all
  three unchanged**. The ramp arrived at the **next two** announcements: 01-15 took 13-week to $89B
  and 6-week to $85B, and 01-22 took 6-week to $90B.

So **13-week and 26-week are 0 for 2** at a January mid-quarter announcement, and the 6-week is
**1 for 2**. Stated as the coin flip it is. Current levels (announced 2026-09-03): 13-week **$92B**,
26-week **$79B**, 6-week **$75B** — the latter mid-taper, having run 95 → 85 → 75 across
08-20/08-27/09-03, exactly the September reduction `sb0590` pre-announced before promising an
October increase.

**10. No debt-limit constraint is flagged in the governing guidance — SUPPORTED as a checked
absence.** `sb0590` was read in full for it; the phrase appears nowhere in the statement body (the
apparent hits are site navigation chrome). Treasury instead assumes a **$950B** end-September cash
balance and a TGA peaking near **$1.05T ±$50B** in late October. A debt-limit episode is the one
thing that has historically forced Treasury off a published coupon schedule, so its *absence* from
the August statement is worth recording as of today, and re-checking at 11-04.

**11. The grid does not respond to the tape — SUPPORTED, inherited and re-derived.** 2026 has run
**exactly one CMB** (2026-05-21, 27-Day, $25B) and no coupon-size change, across a year whose
10-Year par yield reached **4.80** on 09/08. `sb0590` names the shock absorber in its own words:
variations are met *"through changes in regular bill auction sizes and/or CMBs."*

**12. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury's 2026 par CSV ends **09/08**: 2Y **4.39** · 3Y **4.44** · 10Y **4.80** · 20Y **5.26** ·
30Y **5.25**. **VIX 16.14**, a live intraday print at 13:47 UTC on 2026-09-09 (stated rather than
glossed; the prior close was 15.72), against **14.53** on 09-04 — **+1.61**, inside the 3-point
threshold. The **15.30** bar dated **09-07** is a Labor Day closure artifact, **flagged and not
adopted**, same as the siblings. At D-120 none of this is information about January.

**13. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`. An
announcement of auction sizes has no equity transmission path; the duration channel that reaches
this calendar's names is the long-end *yield*, which the 01-11/01-12/01-13 **auctions** inform and
this announcement does not.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What
the conditions support is a **decoder**. The three coupon numbers everyone will quote are offering
sizes, and the three numbers that will actually print as `total_accepted` are 22% larger, for a
reason that is arithmetic rather than news. This corpus already contains at least one place where
that gap could be misread — the 12-03 sibling's central finding is that "every one of those six
equalled its immediately preceding comparable print," which is true of *offering sizes* and false of
*total accepteds* on any block with a live SOMA add-on. That is not an error in the sibling, which
was answering a different question; it is exactly the ambiguity a decoder resolves.

The honest scope of the forecast is narrow and worth stating as such. The **mechanism** (legs 3, 4,
5) is as close to certain as anything in this corpus — 34/34 and 4/4 with exact arithmetic. The
**level** ($26.21B) is a live input that moves weekly and is free to re-read. Those two deserve
different confidences and get them.

### Honest limits

**Every coupon number here is a base rate, not a quotation** — no Treasury document names a January
size today. **The tentative schedule is tentative**, its PDF was created **2026-08-04**, three
months before the refunding that can revise it, and this lane may not self-confirm it. **The
100%-reinvestment regime is 7 blocks and eight months old**; it is the newest of this document's
load-bearing facts and the one most likely to break, and a pre-2026 reader applying the same rules
would have been wrong most of the time. **The $26.208B is an as-of-2026-09-02 reading** and will
accrete — roughly **$0.13B–$0.20B** more over four-and-a-half months at 2–3% CPI, and its reference
CPI is not fixed until the **Oct-2026** print lands in mid-November; the honest range is
**$26.2B–$26.5B**, not a point. **It also assumes no SOMA transaction** in `912810PS1` or
`912828V49` before January. **Leg 5's method is validated on four blocks, three of them 2026** — it
is not tested against a block where SOMA held a maturing FRN or a stripped security. **Leg 9's bill
call is n=2**, which is two observations and not a base rate. **The BLS date in the adjacency sweep
is derived, not published** — bls.gov 403s this runner entirely and no 2027 schedule exists yet.
**The ~11:00 ET announcement time is unsourced convention**, inherited from the sibling ledgers.
**`original_security_term` is unreliable** — the 11-12 sibling's caveat holds; identify these
securities by `security_term` + `reopening` + `inflation_index_security`, never by label alone.

## Stance & kill switches

**Stance (date `estimate`; the coupon numbers are DEDUCED today and will be PUBLISHED 2026-11-04).**
This announcement is a **scheduled nil on its three coupon legs** — **3-Year new issue $58B**,
**10-Year reopening $39B**, **30-Year reopening $22B** — and this document deliberately does not
make that its contribution, because two siblings already own it. Its contribution is the **SOMA
rollover decoder**: the block will report roughly **$26.2B–$26.5B** of `SOMA Holdings Maturing on
Issue Date`, the Fed will take **all of it** on the 2026-onward base rate, and it will split
**strictly pro-rata by offering amount** into add-ons near **$12.8B / $8.6B / $4.8B**, so the
`total_accepted` figures should print near **$70.8B / $47.6B / $26.9B** — each **22% above its
offering size, and none of that a size change**. Confidence is deliberately split: **high** on the
mechanism (34/34 pro-rata, 4/4 on the derivation), **medium** on the level (a weekly-moving input
with four months of accretion to come), **low** on the 6-week bill (n=2, and 2026's taper is on a
different clock). Expect the **13-week and 26-week to print unchanged**, 0-for-2 against a January
mid-quarter announcement carrying a benchmark-bill change. No position is or should be taken on any
of it. The document's durable outputs are four: (a) **the decoder**, with two exact rules behind it;
(b) **the dated QT regime break** — reinvestment 0–94% before 2026-01, 100% on all seven blocks
since, corroborated by Treasury's own *"SOMA purchases of Treasury bills"* line; (c) **the
`9-Year 10-Month` label trap**, including the TIPS contamination that breaks a naive query; and
(d) **the block-shape mechanism** that explains 2026's two-day compression and predicts 2027's
restoration.

**Forward tests registered** in
[`forward-tests/treasury-coupon-announcement-2027-01-07.md`](../forward-tests/treasury-coupon-announcement-2027-01-07.md):

- **`FT-treasury-coupon-announcement-2027-01-07-1`**, scoreable **2027-01-08** — the announcement
  publishes the **3-Year new issue at $58B, the 10-Year reopening at $39B and the 30-Year reopening
  at $22B**. The read-back leg, registered so this document's own base rates are on the hook and not
  merely borrowed from the siblings.
- **`FT-treasury-coupon-announcement-2027-01-07-2`**, scoreable **2027-01-08** — the announcement's
  **`SOMA Holdings Maturing on Issue Date` prints between $26.0B and $26.7B**. The level test, with
  its range stated in advance rather than a point, because accretion is a known unmodelled input.
- **`FT-treasury-coupon-announcement-2027-01-07-3`**, scoreable **2027-01-14** — the three legs'
  **`soma_accepted` split pro-rata by offering amount to within $5M**, and each leg's
  **`total_accepted` exceeds its offering** — i.e. the Fed rolls a non-zero amount. The mechanism
  test, which is the one this document actually stands on and the one that dies first if QT resumes.

**Kill switches:**

- **The 2026-11-04 refunding publishing a Jan-27 10-Year cell other than 39, or 30-Year cell other
  than 22** — the first nominal coupon size change since April 2024. `FT-…-01-07-1` dies 64 days
  before the announcement it predicts.
- **Any 2026 block from 11-04 onward re-investing less than 100% of a non-zero SOMA maturing
  amount** — QT, or partial roll-off, has resumed. This is the cheapest and earliest test of leg 4,
  it is checkable at every intervening announcement (11-12, 11-19, 12-03, 12-24), and it retires
  `FT-…-01-07-3`'s headline claim without touching the pro-rata rule underneath it.
- **Any block, ever, splitting `soma_accepted` other than pro-rata by offering amount** — 34/34 is a
  mechanical rule and one deviation makes it a tendency. This kills the decoder outright.
- **NY Fed's weekly SOMA file showing par in `912810PS1` + `912828V49` moving off $17.847B**, or
  either CUSIP leaving the portfolio — the $26.21B level gets re-derived rather than patched.
  `FT-…-01-07-2` is the leg exposed.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at 11-04 or before
  — the deducibility frame is conditional on that sentence. [`FT-39`](../forward-tests.md) owns the
  guidance-language channel; this doc defers to it and does not re-register it.
- **A debt-limit episode reappearing in Treasury's guidance** — leg 10 records its absence as of
  2026-08-05, and it is the one event class that has historically forced Treasury off a published
  coupon schedule outright.
- **Treasury revising the Tentative Auction Schedule at 11-04 so the January block moves off 01-07
  or changes shape** — voids rather than kills; leg 7's mechanism stops applying to this instance.
- **An off-cycle issuance action** — a CMB or a coupon size changed between refundings. `sb0590`
  explicitly reserves **bill**-size and CMB flexibility, so a bill action does **not** fire this;
  only a coupon one does.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-120 | **Initial research. Canonical file written by this session** — the event existed only as TWO proposals (`...from-treasury-10y-note-2027-01-12.json`, `...from-treasury-30y-bond-2027-01-13.json`), both read in full first per EVENT-RESEARCH.md. **BOTH PROPOSALS CONFIRMED, NEITHER CORRECTED** — unusual for this series, and recorded as such: an independent re-extraction of the Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, four streams inflated, rows rebuilt from `Tm` coordinates) reproduces six securities on `Thursday, January 07, 2027` — `13-Week`+`26-Week BILL` (auction Mon 01-11), `6-Week BILL` (Tue 01-12), `3-Year NOTE` no `R` (Mon 01-11, settle Fri 01-15), `10-Year NOTE / R` (Tue 01-12) and `30-Year BOND / R` (Wed 01-13) — plus the legend `R --denotes reopening` / `T --denotes TIPS`. The 4-/8-/17-Week bills in the corridor are announced 01-05 and are not this event's. **CENTRAL FINDING — the SOMA rollover add-on, which no sibling ledger has measured.** Every coupon announcement publishes `SOMA Holdings Maturing on Issue Date`; the Fed's accepted amount lands ON TOP of the offering size. Two rules, both measured this session from `auctions_query` (408 Note/Bond rows since 2022-12): **(a) the split is strictly pro-rata by offering amount, exact to <$1.5M on 34 of 34 non-zero blocks** — Jan-2026 worked: $34.638B × 58/39/22 of $119B = $16.882B/$11.352B/$6.404B, matching `soma_accepted` exactly; **(b) the re-invested share went to 100% and stayed** — 0–54% across 2022-12→2023, 5–64% in 2024, 25–94% in 2025, then **100.0% on all seven 2026 blocks** (01-08, 02-04, 03-05, 04-02, 05-06, 07-02, 08-05); four blocks with nothing maturing excluded rather than counted as zeros. **Corroborated from a Treasury primary, not the same dataset:** `sb0590` (HTTP 200, 75,580 bytes, read in full) says sizes leave Treasury positioned for changes *"to the size and composition of the SOMA portfolio"* and that *"Treasury is monitoring SOMA purchases of Treasury bills."* **The maturing figure is derivable pre-announcement, validated 4/4** against NY Fed's own holdings API (`/api/soma/tsy/get/asof/<date>.json` at five as-of dates; `/all/asof/latest.json` returns HTTP 400 and is recorded blocked): published field = NON-BILL SOMA par maturing on the issue date PLUS TIPS inflation compensation — 2026-08-17 $31.618B vs $31.62B, 2026-05-15 $29.681B vs $29.68B, 2026-04-15 $21.065B vs $21.10B (**par alone gives $17.483B and fails**), 2026-01-15 $34.673B vs $34.638B (gap = eight days of accretion). Bills excluded: 2026-01-15 also had `912797RJ8`, $7.795B, in SOMA. **Applied to 2027-01-15** (NY Fed file as of **2026-09-02**, confirmed current): exactly two non-bill holdings, both TIPS — `912810PS1` par $5.609B + comp $3.680B, `912828V49` par $12.238B + comp $4.681B = **$26.208B**. Pro-rata at 100% gives add-ons **$12.77B/$8.59B/$4.85B** and total accepteds **~$70.77B/$47.59B/$26.85B**, each **+22.0%** on offering. **The 10-Year proposal's `~$8.6B against ~$47.6B` is confirmed and now has its derivation.** **Coupon sizes are a read-back and deliberately not the headline** — `sb0590` ends at Oct-26, names the 2026-11-04 refunding in writing, and that refunding covers Nov/Dec/**Jan**, so the numbers are public 64 days early; base rates (nominal only) 3Y **$58B ×30** since 2024-04-09, 10Y `R` **$39B ×21** and 30Y `R` **$22B ×21** since 2024-03-12/13 pooled, reproducing the 12-03 sibling exactly as a cross-check. **LABEL TRAP NAMED:** January's reopenings are the SECOND reopening and print `9-Year 10-Month`/`29-Year 10-Month`, not December's `11-Month`; and the 10-Month rows are contaminated by 10-Year TIPS reopenings unless `inflation_index_security` is filtered (clean January-label series: $39B and $22B, 10 consecutive each since 2024-04-10/11). **BLOCK-SHAPE MECHANISM:** the block always settles Jan 15 and the announcement rides the Thursday bill cycle, so New Year's Day sets the room — 2025 (NYD Wed) announce 01-02, three-day Mon/Tue/Wed; **2026 (NYD Thu) announce 01-08, and only two auction days fit, so the 3-Year and 10-Year DOUBLED UP on 2026-01-12** (`91282CPT2` and `91282CPJ4`, same auction date, confirmed in Treasury's rows); **2027 (NYD Fri) announce 01-07 restores Mon/Tue/Wed**. Matters to the downstream auction ledgers, which assume one auction per day. **Bills — the only open legs, 1 of 2:** at a January mid-quarter announcement 13-week and 26-week are **0 for 2** (2025-01-02 and 2026-01-08 both unchanged) and the 6-week is **1 for 2** ($75B→$85B at 2025-01-02; unchanged at 2026-01-08, with the ramp arriving at the NEXT two announcements — 01-15 took 13-week to $89B and 6-week to $85B, 01-22 took 6-week to $90B). Current (announced 2026-09-03): 13-week $92B, 26-week $79B, 6-week $75B mid-taper (95→85→75 across 08-20/08-27/09-03). **Checked absence:** no debt-limit language anywhere in `sb0590`'s body; Treasury assumes a $950B end-September cash balance and a TGA peak near $1.05T ±$50B in late October. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** the corridor holds `ism-manufacturing-2027-01-05` and `ism-services-2027-01-07` (both high, the latter same-day), `treasury-3y-note-2027-01-11` (proposed), `treasury-10y-note-2027-01-12`, `eia-steo-2027-01-12`; none reaches numbers set on 2026-11-04, though all reach the yield the block clears at. **Volatility:** **VIX 16.14**, a live intraday print at 13:47 UTC (prior close 15.72), vs **14.53** on 09-04 — **+1.61**, inside threshold; the **15.30** bar dated **09-07** is a Labor Day closure artifact, **flagged and not adopted**. **Rates:** Treasury's 2026 par CSV ends 09/08 — 2Y **4.39** · 3Y **4.44** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**. **Geopolitical:** Treasury's press index (HTTP 200, 71,182 bytes) has nothing issuance-related since 08-05; newest item **2026-09-08**, an Iran sanctions action. **NEW DATED ADJACENT EVENT PROPOSED — `jobs-2027-01-08`**, a genuine calendar GAP rather than a near-miss: tracked `jobs-*` entries run through 2026-12-04 then jump to 2027-05-07, leaving January–April 2027 untracked. Derived from the BLS rule the `jobs-2027-07-02` lane established (third Friday after the reference week containing the 12th), **re-implemented and re-validated 5/5** here — but for December 2026 the rule outputs **2027-01-01, New Year's Day**. Every structural twin since 1998 (Dec 12 on a Saturday) slipped **exactly one week to January 8**, **3 for 3**, evidenced by BLS's own archive filenames `empsit_01082010.pdf`, `empsit_01082016.pdf`, `empsit_01082021.pdf` (surfaced by web search; the PDFs themselves 403). Filed `EST:`, high impact, and it lands the morning AFTER this announcement and the Friday BEFORE the block auctions. Everything else in the corridor (`treasury-3y-note-2027-01-11`, `treasury-refunding-2027-02-03`) is already canonical or already proposed by another lane. **BLOCKED, recorded not substituted:** all five bls.gov paths tried returned **HTTP 403** to curl under a browser user-agent (the documented Actions blind spot; no 2027 BLS schedule exists yet) and NY Fed's `/all/asof/latest.json` returned **HTTP 400**. Every other source returned HTTP 200. **`FT-…-01-07-1`** (coupons print $58B/$39B/$22B, scores 2027-01-08), **`FT-…-01-07-2`** (SOMA maturing prints $26.0B–$26.7B, a range not a point because accretion is unmodelled, scores 2027-01-08) and **`FT-…-01-07-3`** (the three legs split pro-rata to within $5M and each total accepted exceeds its offering, scores 2027-01-14) **registered**. | **Stance set** — coupons a **scheduled nil** ($58B/$39B/$22B) but deliberately NOT the headline, since two siblings own it. The contribution is the **SOMA rollover decoder**: ~**$26.2B–$26.5B** maturing, **all** of it taken, split **pro-rata**, total accepteds **22% above offering** and none of it a size change. Confidence split **high/medium/low** across mechanism / level / 6-week bill | 2026-09-30 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-coupon-announcement-2027-01-07.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
