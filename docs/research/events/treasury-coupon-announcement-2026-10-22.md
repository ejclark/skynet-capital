# Treasury coupon announcement (month-end 2Y / 5Y / 7Y note + 2Y FRN sizes, plus four bills) — treasury-coupon-announcement-2026-10-22

**Kind:** rates · **Date:** 2026-10-22 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — EIGHT rows announce that day, four coupon and four bill; stays `estimate` because a tentative schedule is tentative and this lane may not self-confirm) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fomc-blackout-start-2026-10-17","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The four coupon sizes are already in writing; the unexamined security is the floating-rate
note, and this calendar has never looked at one.** Treasury's own schedule (fetched direct 2026-09-05)
puts **eight** securities on this announcement, not the four the calendar named — 2Y/5Y/7Y notes and the
quarterly **2-Year FRN new issue**, plus 13-week, 26-week, 6-week and **52-week** bills. `sb0590`'s
Oct-26 row, re-read verbatim, publishes every coupon size: **2Y $69B · 5Y $70B · 7Y $44B · FRN $30B** —
**$213B**, the largest coupon block of the October cycle and the **last** one the expiring guidance
covers (10-15 is not the last; 10-22 is). So the sizes are a document read. The FRN is not: no ledger
here has ever recorded a floating-rate note or a discount margin, its auction lands **on the 10-28 FOMC
decision day**, and it is the only one of these four sales with no calendar entry — proposed in this PR.
Two things measured from primaries this session: the FOMC-day slot costs Treasury **nothing**
(within-CUSIP controlled, n=8), and the FRN's discount margin sits at a **four-year low**. Date is
`estimate`, `symbols: []`, and nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-47) | Stand aside | High | Saturday — no session; Labor Day Monday, next print Tuesday 09-08. `symbols: []`, no house playbook is rates-keyed, and all four coupon numbers are already in writing. | Treasury publishing an off-cycle **coupon or FRN** size change, or a coupon CMB, before **2026-10-22** — `sb0590` names FRNs in the same "maintaining… for at least the next several quarters" sentence as nominals, so an FRN action fires this as surely as a note one |
| This week | Stand aside; let the **2026-09-17** announcement be the free out-of-sample check | High | It announces this exact block one month early — 2Y/5Y/7Y plus the FRN *reopening* — off the same table (Sep-26 row `69 58 70 44 39 13 22 28`). It costs nothing and tests the premise 35 days ahead. | Any of **2Y $69B · 5Y $70B · 7Y $44B · FRN $28B** printing off-grid on **2026-09-17** — three 29-auction grids and the FRN column's 28/30 rule break together, a month before this event reads them |
| This month | Watch **one** dated intermediate check — the **2026-09-23 FRN reopening** — and hold nothing through it | Medium | It is the only FRN auction between today and 10-28, and the free read on whether the four-year discount-margin low is a level or a moment. | The **2026-09-23** reopening printing a high discount margin **above 10.0bp** — the compression premise behind this doc's registered FRN test dies five weeks before the auction it was written for |
| This quarter | The deductive channel expires **2026-11-12**, and **do not** treat the 10-28 FOMC as a supply risk to the FRN | Medium | Measured here: FRN new issues have sold on an FOMC decision day **8 times since 2021** and pay no concession (within-CUSIP delta +0.43bp on-FOMC vs +0.70bp off). | Treasury dropping or qualifying *"for at least the next several quarters"* at the **2026-11-04** refunding — the whole scheduled-nil frame is conditional on that sentence, and [`FT-39`](../forward-tests/legacy.md) already measures that channel |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, date is `estimate`, no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed.
- **The four coupon numbers, primary-sourced and quotable today:** 2Y **$69B** · 5Y **$70B** · 7Y
  **$44B** · 2-Year FRN new issue **$30B** (`sb0590` Oct-26 row `69 58 70 44 39 13 22 30`, verbatim).
- **Four more securities the calendar never named:** 13-week and 26-week bills (auction 10-26), 6-week
  and **52-week** bills (auction 10-27) — the bill leg is the only genuinely unknown number here.
- **Correction to the channel's stated expiry:** **10-22, not 10-15, is the last coupon announcement
  `sb0590`'s Oct-26 row covers.** First uncovered coupon announcement is still 2026-11-12.
- **The grids, re-derived this session:** 2Y $69B **29/29** since 2024-04-23, 5Y $70B **29/29** since
  2024-04-24, 7Y $44B **29/29** since 2024-04-25, zero deviations in any.
- **The FRN, new to this calendar:** quarterly new issue **$30B ×10** since 2024-04-24, reopenings
  **$28B ×20** since 2024-05-29 — that is what the Oct-26 column's `30` means.
- **The FOMC-day auction is not a risk, and that is measured, not assumed:** 8 of 23 FRN new issues
  since 2021 sold on a decision day; the concession vs the prior auction is **−1.23bp**, not positive.
- **Discount margin at a four-year low:** **5.0bp** (2026-07-29 new issue), **5.5bp** (2026-08-26
  reopening) — last print below 5.0bp was **2022-07-27**. Named mechanism, unmeasured: bill demand.
- **Data trap, named:** fiscaldata's `original_security_term` mis-tags rows (a 2026-01-26 2-Year note
  carries `5-Year`). Filter these base rates on `security_term`.
- **Watch (dated):** announcements **09-10 · 09-17 · 10-01 · 10-15 · this one 10-22** · FRN reopening
  **09-23** · FOMC blackout opens **10-17** · 20Y **10-21** · 5Y TIPS **10-22** · 2Y **10-26** · 5Y
  **10-27** · **FOMC + FRN new issue 10-28** · 7Y + GDP **10-29** · settlement + borrowing estimates
  **11-02** · refunding **11-04** · first unpublished announcement **11-12**.

## Initial research

### The question, plainly

This event was created by the [`treasury-5y-tips-2026-10-22`](treasury-5y-tips-2026-10-22.md)
initial-research adjacency sweep (2026-09-05) as the largest coupon announcement of the October cycle
with no calendar row of its own. It arrives already carrying its answer — four sizes published in
`sb0590` — which is the trap the [`10-15` sibling](treasury-coupon-announcement-2026-10-15.md) named:
a ledger that says only "the grid continued" duplicates registered predictions and adds nothing. So the
question asked here was the narrower one: **which of this release's securities has nobody in this
calendar actually looked at, and does anything about it carry information the base rates would not?**

**One-line verdict:** it publishes **eight** securities rather than the four the calendar named, and the
one nobody has ever examined — the quarterly **2-Year FRN**, auctioning on an FOMC decision day at a
four-year-low discount margin — turns out to carry a measurable *negative*: the FOMC-day slot costs
Treasury nothing, which is the finding worth registering here rather than the sizes.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the
mandated cache bust has nothing to bust (recorded rather than skipped silently). Everything
quantitative below was **fetched from a primary this session (2026-09-05)** and re-derived rather than
inherited, including numbers the siblings already publish:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**, PDF streams inflated and the text layer reconstructed from per-glyph
  Td/Tm coordinates so rows read as rows (a naive string dump detaches a security type from its dates).
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590` (2026-08-05 quarterly refunding
  statement), HTTP 200, **75,579 bytes**, tag-stripped and read in full.
- **The base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, three pulls: every
  `floating_rate: Yes` row since 2014-01-01 (**154 auctions**, the complete 2-Year FRN series); every
  `Note` row since 2023-06-01 (**169** after filtering); every `Bill` row since 2025-01-01 (**559**).
- **The FOMC dates** — `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, 164,831 bytes,
  decision dates parsed per year segment (2021-2026 complete at 8/8 except 2023 — see limits).
- **The tape** — Treasury's own daily par yield-curve CSV (2026 full-year file) and Yahoo `^VIX` daily
  closes.

### Conviction legs, tested

**1. The announcement carries EIGHT securities, and the calendar named four — SUPPORTED, and this is
the structural finding.** The coordinate-reconstructed schedule puts exactly these rows on
**Thursday, October 22, 2026**:

| Security | Auction | Settle | Reopening? |
|---|---|---|---|
| `13-Week BILL` | Monday, October 26, 2026 | Thursday, October 29, 2026 | n/a |
| `26-Week BILL` | Monday, October 26, 2026 | Thursday, October 29, 2026 | n/a |
| `6-Week BILL` | Tuesday, October 27, 2026 | Thursday, October 29, 2026 | n/a |
| `52-Week BILL` | Tuesday, October 27, 2026 | Thursday, October 29, 2026 | n/a |
| `2-Year NOTE` | Monday, October 26, 2026 | Monday, November 02, 2026 | No |
| `5-Year NOTE` | Tuesday, October 27, 2026 | Monday, November 02, 2026 | No |
| `2-Year FRN` | **Wednesday, October 28, 2026** | Monday, November 02, 2026 | **No** — no `R` marker |
| `7-Year NOTE` | Thursday, October 29, 2026 | Monday, November 02, 2026 | No |

Same shape as the 10-15 sibling's "two securities, not one" finding, one layer down: the bill leg is
invisible to every doc downstream of this entry, and the **52-week** bill in particular is announced
only once a month and is tracked nowhere in this calendar. The `R` reading is checkable rather than
assumed — the 08-20, 09-17, 11-19 and 12-17 FRN rows in the same PDF all read `2-Year FRNR`, and only
this one and the 2027-01-21 row drop the marker, which is exactly the quarterly new-issue cadence.

**2. All four coupon sizes are published in advance, by month and by security — SUPPORTED, re-read
verbatim rather than inherited.** `sb0590`'s anticipated-size table, headers
`2-Year · 3-Year · 5-Year · 7-Year · 10-Year · 20-Year · 30-Year · FRN`:

```
May-26  69 58 70 44 42 16 25 28
Jun-26  69 58 70 44 39 13 22 28
Jul-26  69 58 70 44 39 13 22 30
Aug-26  69 58 70 44 42 16 25 28
Sep-26  69 58 70 44 39 13 22 28
Oct-26  69 58 70 44 39 13 22 30
```

**Oct-26 → 2-Year 69 · 5-Year 70 · 7-Year 44 · FRN 30 = $213B**, against the 10-01 block's $119B and
the 10-15 block's $39B. The governing sentence, verbatim: *"Based on current projected borrowing needs,
Treasury anticipates maintaining nominal coupon **and FRN** auction sizes for at least the next several
quarters."* The FRN is inside that commitment, not adjacent to it — which is why an off-grid FRN print
falsifies this doc as squarely as an off-grid note print.

**3. 10-22, not 10-15, is the last coupon announcement the expiring guidance covers — a REFINEMENT to a
live sibling, recorded because the channel's expiry is a dated claim.**
[`FT-treasury-coupon-announcement-2026-09-10-1`](../forward-tests/treasury-coupon-announcement-2026-09-10.md)
reads *"the October announcement is the **last** one the published guidance covers"*, pointing at
10-15. `sb0590`'s table stops at **Oct-26**, the month — and this announcement is seven days later,
inside the same month, sizing $213B against that one's $39B. Nothing about that test's number changes
and its row is untouched; what changes is the precision of the expiry statement. The corrected chain:
**last covered coupon announcement 2026-10-22 → 2026-10-29 announces bills only → 2026-11-04 refunding
sets the new grid → 2026-11-12 is the first coupon announcement no current Treasury primary sizes.**
The 10-15 ledger's own "channel's expiry stands at 2026-11-12" was already right; only the
intermediate step was mis-stated.

**4. The three nominal grids are deterministic and therefore carry no information — SUPPORTED, n=29
each, re-derived.** From `auctions_query`, filtered on `security_term` and with FRNs and TIPS removed:

| Tenor | Size | Consecutive on-grid auctions | First deviation walking back |
|---|---|---|---|
| 2-Year note | $69B | **29** (2024-04-23 → 2026-08-25) | 2024-03-25 at $66B |
| 5-Year note | $70B | **29** (2024-04-24 → 2026-08-26) | 2024-03-26 at $67B |
| 7-Year note | $44B | **29** (2024-04-25 → 2026-08-27) | 2024-03-27 at $43B |

Two and a half years, zero deviations, and all three stepped onto their current size in the same week
of April 2024. **A data trap found and named:** fiscaldata's `original_security_term` field mis-tags at
least two rows in this window — the **2026-01-26 2-Year note** carries `original_security_term:
5-Year`, and the **2025-02-25 5-Year note** carries `7-Year` — so a base rate filtered on that field
silently drops a month and gains a phantom. Filtering on `security_term` reproduces the grid cleanly.
It is recorded because a silently mis-filtered base rate is exactly how the next one gets believed.

**5. The FRN column's 28/30 alternation IS the reopening/new-issue distinction — SUPPORTED, and it
resolves the 10-15 sibling's inference from the security side.** That ledger deduced the pattern from
the table alone ("months one and two carry reopenings at $28B, month three the new issue at $30B").
The auction record confirms it independently: **10 consecutive quarterly new issues at $30B** since
2024-04-24 and **20 consecutive reopenings at $28B** since 2024-05-29, with the sole $30B reopening
being 2024-04-24's own cycle before the split settled. So `Oct-26 FRN = 30` is not merely a number, it
is the table stating that October carries the *new issue* — which the schedule's missing `R` says
independently. Two primaries, one answer.

**6. The FRN new issue sells ON an FOMC decision day, and that is structural rather than an anomaly —
SUPPORTED.** Crossing all 69 FRN auctions from 2021-01-01 to 2026-09-04 against the Fed's own published
decision dates: **9 landed on a decision day, and 8 of the 9 were quarterly new issues** — 2021-01-27,
2021-07-28, 2022-01-26, 2022-07-27, 2023-07-26, 2025-10-29, 2026-01-28, 2026-07-29 (the ninth,
2021-09-22, a reopening). That is **8 of 23 new issues, ~35%**, and the mechanism is calendrical rather
than deliberate: Treasury's FRN new-issue slot sits in the last week of January, April, July and
October, and the FOMC's first-quarter-and-mid-quarter meetings end in that same week. **2026-10-28 is
the ninth new issue to draw the slot** — and 2026 is the first year in which *three* of four have
(01-28 and 07-29 on the decision, 04-28 the day before). Recorded because the pairing looks like a
supply-into-an-event risk and the next leg shows it is not.

**7. The FOMC-day slot costs Treasury nothing — SUPPORTED, within-CUSIP controlled, and this is the
substantive finding.** The raw comparison looks like a large effect and is an artifact: new issues
selling on a decision day average a **7.05bp** high discount margin against **13.17bp** off it. That
gap is composition, not FOMC — the on-FOMC dates cluster in 2021-2022, when the whole series printed
near zero, and in 2026, when it is compressing again. Two controls remove the level:

| Control | New issue ON an FOMC decision day | New issue OFF it |
|---|---|---|
| DM(first reopening) − DM(its own new issue), same CUSIP | **+0.43bp** (n=8) | **+0.70bp** (n=15) |
| DM(new issue) − DM(immediately preceding auction) | **−1.23bp** (n=8, sd 2.87) | **−0.70bp** (n=15, sd 3.22) |

Both point the same way and neither is a concession: the FRN new issue prints *tighter* than the
auction before it whether or not the Committee decides that afternoon, and the same CUSIP's first
reopening four weeks later reprices by well under a basis point either way. The honest reading is that
an FRN indexed to the 13-week bill is nearly indifferent to the policy decision it sells into, because
the index resets weekly and absorbs whatever the FOMC does. Bid-to-cover agrees and adds nothing (3.13
on-FOMC vs 3.02 off, n=8/15). This is the leg the forward test registers.

**8. The FRN's discount margin is at a four-year low, and nothing in this calendar had recorded one —
SUPPORTED.** The 2026-07-29 new issue printed **5.0bp** and the 2026-08-26 reopening **5.5bp**; walking
the full 154-auction series back, the last print below 5.0bp was **2022-07-27** (3.7bp), and before that
a run of negative margins through the 2022 bill-scarcity episode. The trailing four auctions read 8.9
(2026-05-27) · 7.9 (06-24) · **5.0** (07-29) · 5.5 (08-26) — a monotone compression across a full
quarter. `grep -ri "discount margin" docs/research/` returns **nothing**, so this is the first
floating-rate price metric in the calendar. **A mechanism is named and explicitly NOT measured:**
`sb0590` states verbatim that *"Treasury is monitoring SOMA purchases of Treasury bills and growing
demand for Treasury bills from the private sector"* — a bill-demand story is the obvious candidate for
a compressing FRN margin, and this session established no causal link, only the level.

**9. The bill leg is the only genuinely unknown number in the release — MIXED, and deliberately not
registered.** From the 559-row bill pull: **13-week $92B and 26-week $79B** have been pinned since the
2026-06-29 quarter-turn step, the **52-week** steps once a year in early July (48 → **50** on
2025-07-08 → **52** on 2026-07-07, three prints at $52B since), and the **6-week** is the live
adjustment lever, running 95 → 85 → 75 across 2026-08-25 / 09-01 / 09-08. `sb0590` names bills as that
lever verbatim. The October precedent is real and cuts against complacency: in 2025 the 13-week stepped
**84 → 86 mid-month** (10-06 → 10-14), so a late-October step is not unprecedented. Not registered here
because [`FT-treasury-coupon-announcement-2026-10-01-2`](../forward-tests/treasury-coupon-announcement-2026-10-01.md)
already owns the 13-/26-week floor test three weeks earlier and a second row would double-count it;
the 52-week is left as a named, dated gap for a later sweep rather than a thin registration.

**10. The security this announcement sizes has no calendar entry, while its three siblings do — a gap,
PROPOSED in this PR.** `treasury-2y-note-2026-10-26`, `treasury-5y-note-2026-10-27` and
`treasury-7y-note-2026-10-29` are all tracked; the **2-Year FRN new issue of 2026-10-28** is not, and
it is the only one of the four selling on an FOMC decision day. Filed as
`src/domain/market-events/treasury-2y-frn-2026-10-28.json`, `status: "estimate"`, `symbols: []`.

**11. Settlement piles onto a day that already carries a tracked event — recorded, not traded.** All
four coupons settle **Monday, 2026-11-02**, which is `treasury-borrowing-estimates-2026-11-02`. So
$213B of coupon settlement lands the same session Treasury publishes the borrowing estimates feeding
the 11-04 refunding. It is a scheduling coincidence with no measured price consequence, and is written
down so a later session does not rediscover it as a signal.

**12. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve, 09-03 → **09-04**: 3-Mo 3.89 → **3.91** (the FRN's own index tenor) · 2Y 4.34 →
**4.37** · 5Y 4.52 → **4.54** · 7Y 4.63 → **4.65** · 10Y 4.77 → **4.78** · 20Y 5.25 → **5.25** · 30Y
5.25 → **5.24**. **VIX 14.53** (09-04 close). **Today is a Saturday** — 2026-09-05 has no session,
Labor Day is Monday 09-07 and the next print is Tuesday 09-08, so 09-04 is the freshest close available
and nothing here is stale by neglect.

**13. No tracked name is exposed through this channel — SUPPORTED, inherited, not re-derived.**
`symbols: []`. The duration channel that hit CRWV −12.1% and SOX −5% on 2026-08-18 was a long-end yield
move; an announcement publishing numbers already published cannot transmit into it, and the FRN sits at
the opposite end of the curve from it.

**14. The announcement's own tape effect will not be measurable, and that is stated now rather than
attempted at close-out — SUPPORTED.** 2026-10-22 already carries the **5-Year TIPS auction at 1:00pm
ET**, roughly two hours after this ~11:00 ET announcement, with the **20-Year reopening the previous
day** and the whole session inside the **FOMC blackout (10-17 → 10-29)**. No intraday attribution to an
announcement of four pre-published numbers is defensible there, and none will be attempted. The honest
measurable is the sizes and the 10-28 discount margin — not any reaction.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What the
conditions do support is three things.

**Use the four numbers now, not on 10-22.** 2Y $69B · 5Y $70B · 7Y $44B · FRN new issue $30B, all
citable to `sb0590` today. Any rates ledger in the October corridor can retire "the size is unknown"
from its reasoning 47 days early, and the FRN number is new to this calendar entirely.

**Spend the attention on the FRN, not the notes.** The three note grids are documents agreeing with
29-auction base rates and carry no information. The FRN is the security nobody here has examined, at a
four-year-low margin, selling into an FOMC decision — and the measured answer is that the decision does
not cost it anything, which is worth knowing precisely because the opposite is the intuitive guess.
That measurement is what gets registered; the sizes are registered only because they are unowned and
this is the guidance's terminal announcement, and their pass rate is disclosed as near-uninformative.

**Sequence the dated checks and read each for one thing.** The order is: **09-10** and **09-17**
(announcements off the Sep-26 row — 09-17 announces this exact block a month early) → **09-23** (the
one FRN auction before this event; read it for the discount margin only) → **10-01** and **10-15** (the
other two October announcements, both already owned) → **10-22** (this event) → **10-26/27/28/29** (the
four sales) → **11-02** borrowing estimates and settlement → **11-04** refunding, where the grid can
change and where [`FT-39`](../forward-tests/legacy.md) lives → **11-12**, the first coupon announcement
no current Treasury primary sizes.

### Honest limits

**No Treasury press release for the 2026-10-22 announcement exists yet** — it has not happened; every
size here is a document read, not an observation. **`sb0590`'s table is explicitly *anticipated*
sizes** and its verbs are "anticipates" and "plans to". **The FOMC-day result rests on n=8** — the
within-CUSIP controls are the right controls and both point the same way, but no significance test is
claimed on eight observations and none should be read in; the honest statement is "no concession
detected", not "no concession exists". **The FOMC date extraction is complete for 2021-2022 and
2024-2026 (8 per year) but recovered only 6 of 8 for 2023**, missing the two cross-month meetings
(2023-02-01 and 2023-11-01); no FRN auction falls near either date, so the 9-of-69 count is unaffected,
but the denominator is disclosed rather than smoothed. **The discount-margin compression has a named
but unmeasured mechanism** — the bill-demand story is `sb0590`'s framing, not this session's finding.
**The ~11:00 ET announcement time is unsourced convention**, inherited from the sibling chain; the
calendar entry discloses it. **Base rates sit inside one policy regime** (the 2024-2026 grid window is
a single guidance era), so "the grid is deterministic" is a within-guidance claim with a dated expiry.
**The bill numbers in leg 9 are a description, not a prediction** — this session did not model
Treasury's cash needs, and the debt-limit constraint that FT-…-10-01-2 names as its own weakness is
equally unmeasured here.

## Stance & kill switches

**Stance (date `estimate`; the eight-security composition primary-sourced from Treasury's own tentative
schedule, all four coupon sizes primary-sourced from `sb0590`, all fetched 2026-09-05).** This is a
**scheduled nil whose coupon content is already published** — expect **2Y $69B · 5Y $70B · 7Y $44B ·
2-Year FRN new issue $30B** on 2026-10-22 at ~11:00 ET, $213B in total and the last block the expiring
guidance covers. No position is or should be taken on it. The doc's durable outputs are four: (a)
**four more securities** — 13-, 26-, 6- and 52-week bills share this announcement, and the bill leg
holds the only genuinely unknown numbers in it; (b) **the FRN, examined for the first time in this
calendar** — its 28/30 column meaning confirmed from the auction record, its $30B new-issue grid at
10/10, and its discount margin at a **four-year low**; (c) **the FOMC-day non-finding** — the FRN new
issue has drawn a decision day 8 times since 2021 and pays no concession, so 10-28 is not a supply risk
to it; and (d) **a correction to the channel's stated expiry** — 10-22, not 10-15, is the last coupon
announcement `sb0590` covers.

**No sibling test is touched, and the note sizes are deliberately registered only once.**
`FT-treasury-coupon-announcement-2026-09-10-1` (20Y, scores 10-16),
`-2026-10-01-1`/`-2` (3Y/10Y/30Y and the bill ladder, score 10-02) and `-2026-10-15-1` (5Y TIPS, scores
10-16) all remain as written; none of them covers the 2Y/5Y/7Y/FRN block, which is why it is registered
here rather than inherited.

**Forward test `FT-treasury-coupon-announcement-2026-10-22-1` registered**, scoreable **2026-10-23**:
the announcement publishes 2Y **$69B**, 5Y **$70B**, 7Y **$44B** and the 2-Year FRN new issue at
**$30B**. Its pass rate is disclosed as near-uninformative; it exists because the block is unowned and
this is the terminal announcement of `sb0590`'s table.

**Forward test `FT-treasury-coupon-announcement-2026-10-22-2` registered**, scoreable **2026-10-29**:
the 2026-10-28 FRN new issue's high discount margin comes in **no more than 2.0bp above** the
2026-09-23 reopening's — i.e. selling into an FOMC decision extracts no concession. This is the leg
where a measurement, not a document, does the work.

**Kill switches:**

- **Any of 2Y $69B · 5Y $70B · 7Y $44B · FRN $30B printing off-grid on 2026-10-22** — Treasury
  contradicting a named, month-specific written commitment inside its own guidance quarter, with three
  29-auction grids and a 10-auction FRN grid breaking together. Coupon announcements stop being a
  scheduled nil and supply returns as a live variable ahead of the 11-04 refunding.
- **The 2026-09-17 announcement printing off `69 58 70 44 39 13 22 28`** — the free out-of-sample check
  35 days early, off the same table's Sep-26 row. A miss there kills this doc before October begins.
- **The 2026-09-23 FRN reopening printing a discount margin above 10.0bp** — the compression premise
  behind the registered FRN test breaks five weeks before the auction, and the four-year-low reading
  becomes a moment rather than a level.
- **The 2026-10-28 FRN new issue printing more than 2.0bp above the 09-23 reopening** — the registered
  test's own kill: an FOMC-day concession exists after all, the within-CUSIP controls were measuring
  the wrong thing, and the "the index resets weekly so the decision does not matter" reading gets
  re-derived rather than patched before the 2027-01-27 new issue draws the same slot.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at or before the
  2026-11-04 refunding — the whole scheduled-nil frame is conditional on that sentence, and note it
  binds **FRNs and nominal coupons together**, so an FRN-only change fires this too.
- **An off-cycle coupon or FRN issuance action** — a size changed between refundings, or a coupon CMB.
  `sb0590` explicitly reserves bill-size and CMB flexibility, so a *bill* action does not fire this;
  `sb0607` (2026-08-19) shows Treasury acting on the **buyback** lever without touching auction sizes,
  which is the non-firing case made concrete.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-47 | **Initial research.** **Structural finding: EIGHT securities announce here, not the four the calendar named.** Treasury's Tentative Auction Schedule (direct, HTTP 200, 17,195 bytes, rows rebuilt from Td/Tm glyph coordinates) puts `2-Year NOTE` (auction 10-26), `5-Year NOTE` (10-27), **`2-Year FRN` with no `R` → new issue (10-28)** and `7-Year NOTE` (10-29) — all settling **11-02** — plus `13-Week`, `26-Week` (10-26), `6-Week` and **`52-Week`** bills (10-27). Title and notes corrected in this event's calendar file. **All four coupon sizes published:** `sb0590` Oct-26 row verbatim `69 58 70 44 39 13 22 30` → 2Y **$69B** · 5Y **$70B** · 7Y **$44B** · FRN **$30B** = **$213B**, vs $119B (10-01) and $39B (10-15). Governing sentence names FRNs *inside* the commitment: *"maintaining nominal coupon **and FRN** auction sizes for at least the next several quarters."* **Expiry correction to a live sibling:** `FT-…-09-10-1` reads "the October announcement is the last one the published guidance covers", pointing at 10-15 — **10-22 is later and equally covered**; that test's number is unaffected and its row untouched, but the corrected chain is 10-22 last covered → 10-29 bills only → 11-04 refunding → **11-12** first uncovered. **Grids re-derived** (`auctions_query`, filtered on `security_term`): 2Y $69B **29/29** since 2024-04-23, 5Y $70B **29/29** since 2024-04-24, 7Y $44B **29/29** since 2024-04-25, zero deviations; first deviations 2024-03-25/26/27. **Data trap named:** `original_security_term` mis-tags rows (2026-01-26 2Y note carries `5-Year`; 2025-02-25 5Y note carries `7-Year`) — filter on `security_term`. **The FRN, examined for the first time in this calendar** (`grep -ri "discount margin" docs/research/` returned nothing): quarterly new issue **$30B ×10** since 2024-04-24, reopenings **$28B ×20** since 2024-05-29 — confirming from the auction side the 10-15 sibling's table-side inference about the 28/30 column. **Its margin is at a four-year low** — 5.0bp (07-29 new issue), 5.5bp (08-26 reopening); last sub-5.0bp print was **2022-07-27**; trailing four 8.9 · 7.9 · 5.0 · 5.5. Mechanism named and NOT measured: `sb0590`'s own *"SOMA purchases of Treasury bills and growing demand for Treasury bills from the private sector."* **The FOMC-day leg, and it is a negative:** crossing all 69 FRN auctions 2021→2026-09-04 against the Fed's published decision dates, **9 sold on a decision day and 8 of those were new issues** (2021-01-27, 2021-07-28, 2022-01-26, 2022-07-27, 2023-07-26, 2025-10-29, 2026-01-28, 2026-07-29) — **8 of 23 new issues, ~35%**, calendrical not deliberate. Raw DM on-FOMC 7.05bp vs off 13.17bp is **composition, not effect**; within-CUSIP, DM(first reopening) − DM(own new issue) = **+0.43bp on vs +0.70bp off (n=8/15)**, and DM(new issue) − DM(prior auction) = **−1.23bp on vs −0.70bp off**. No concession either way; b/c 3.13 vs 3.02 adds nothing. **Two forward tests registered:** `-1` the four sizes (pass rate disclosed near-uninformative; registered because unowned and terminal), `-2` the 10-28 FRN margin no more than **+2.0bp** over the 09-23 reopening (null 19/23 all, 7/8 on-FOMC — informative on a fail). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** payrolls **+162K vs ~53K** (09-04) reversed Waller's 09-03 dovish turn; FOMC blackout live 09-05 → 09-17. **Rates (Treasury par, primary), 09-03 → 09-04:** 3-Mo 3.89 → **3.91** (the FRN's index tenor) · 2Y 4.34 → **4.37** · 5Y 4.52 → **4.54** · 7Y 4.63 → **4.65** · 10Y 4.77 → **4.78** · 20Y 5.25 · 30Y 5.25 → **5.24**. **VIX 14.53** (09-04 close; 2026-09-05 is a **Saturday**, 09-07 is Labor Day, next session 09-08). **Bills, 559 rows:** 13w **$92B** and 26w **$79B** pinned since the 06-29 quarter-turn step; 52w steps annually in early July (48 → 50 on 2025-07-08 → **52** on 2026-07-07); 6w is the live lever, 95 → 85 → **75** across 08-25/09-01/09-08. October precedent against complacency: 2025's 13w stepped **84 → 86 mid-month**. Not registered — `FT-…-10-01-2` owns the floor test three weeks earlier. **Policy:** `sb0607` (2026-08-19) doubled 10-20Y/20-30Y buyback caps to ≥$4B through 11-04 — an issuance action that pointedly did not touch coupon or FRN sizes. Funding channel closed: PL 119-103 funds through 12-11. **Adjacency — 11 tracked entries already inside the ±5-day corridor; ONE genuinely new dated event PROPOSED** as `estimate` in this PR: **`treasury-2y-frn-2026-10-28`** — the only one of this announcement's four coupon sales with no calendar row, and the only one selling on an FOMC decision day. **Discovered and deliberately NOT filed**, named so a later sweep can: the 2026-09-23 FRN reopening, the 10-26/10-27 bill auctions and the 2027-01-27 FRN new issue (the next decision-day collision) — all outside this event's corridor. | **Stance set** — scheduled nil, all four coupon sizes published; expect 69/70/44/30. The registrable content is the FRN's FOMC-day non-concession, not the sizes | 2026-09-22 (medium; D-47 sits in the 31+/21d band → 09-26, but the band tightens to 7d the moment days-out crosses 31 on 09-22, which makes 09-22 the real first due date) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`) in the same PR. Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory.
