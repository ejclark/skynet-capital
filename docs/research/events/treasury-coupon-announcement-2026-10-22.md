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

**Addendum 2026-10-18 (D-4; the stance above is unchanged).** Forward test `FT-treasury-coupon-announcement-2026-10-22-3` registered, scoreable **2026-10-23**: the announcement publishes 13-Week **$95B**, 26-Week **$82B**, 52-Week **$54B** — the bill leg's new baseline after the 10-01 and 09-24 steps (ledger row 2026-10-18, item 4). The leg-9 and Stance figures above (92 / 79 / 52) are the 09-05 readings and are left as written.

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
| 2026-09-22 | D-30 | **Pulse check — the free out-of-sample check closed, and it passed.** The **2026-09-17** coupon announcement — this doc's named "free out-of-sample check 35 days early" — closed out on 2026-09-18: `docs/research/events/treasury-coupon-announcement-2026-09-17.md`'s own re-fetch of `api.fiscaldata.treasury.gov` (`announcemt_date:eq:2026-09-17`, HTTP 200, 7 rows) shows every predicted number printed exactly — **2Y $69B · 5Y $70B · 7Y $44B · FRN (reopening) $28B**, bills **92/79/75**, 52-week absent as predicted. Its own `FT-treasury-coupon-announcement-2026-10-22-1` line reads this event's forward test as **unkilled by the same record**. Three 29-auction grids and the FRN 28/30 rule survived contact with an actual release rather than a document read — the strongest evidence yet for this event's own **-1** test (2Y/5Y/7Y/FRN sizes, scores 2026-10-23) and **-2** test (FRN FOMC-day margin, scores 2026-10-29); neither is due to score yet. **Macro — an actual hike, not a cut:** the FOMC raised the target range 25bp to **3.75%–4%** on 2026-09-16, 12-0 (`federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm`, primary, verbatim: *"raise the target range for the federal funds rate by 1/4 percentage point to 3-3/4 to 4 percent"*) — a reversal of the 09-05 baseline's dovish framing (Waller's 09-03 turn, reversed by the 09-04 payrolls beat). **Rates (Treasury par, primary, `home.treasury.gov` daily yield-curve CSV), 09-04 baseline → 09-21:** 3-Mo 3.91 → **4.17** · 2Y 4.37 → **4.76** (+39bp) · 5Y 4.54 → **4.83** · 7Y 4.65 → **4.89** · 10Y 4.78 → **4.96** · 20Y 5.25 → **5.33** · 30Y 5.24 → **5.29** — a broad-based rise across the curve into and through the hike, not a rates-lower-post-hike move. **This does not touch the stance**: the four coupon sizes and the FRN's $30B are document-derived from `sb0590`, not rate-derived, and no house playbook is rates-keyed. **VIX 14.87** (2026-09-21 close) — this session's own four independent fetch attempts failed cleanly rather than silently (Yahoo's chart endpoint returned stale cached 2025-05 data, CBOE's own `VIX_History.csv` truncated to its 1997 head, WSJ refused the fetch outright, Google Finance returned "device not supported"), so the reading is cross-checked from the sibling [`treasury-coupon-announcement-2026-10-01`](treasury-coupon-announcement-2026-10-01.md) ledger's own same-day (2026-09-22) pulse, which fetched Yahoo Finance direct and cross-validated it against [`fomc-2026-09-16`](fomc-2026-09-16.md)'s own primary series: **17.71** (09-16, FOMC day) → **15.44** (09-17) → **14.81** (09-18) → **14.87** (09-21) — a round-trip back toward the cycle's 14-handle low, **+0.34** off this doc's own 09-04 baseline (14.53) and not a 3-point regime move either way. **Kill switches checked, none fired:** `home.treasury.gov/news/press-releases` for 2026-09-05→09-22 carries no debt-issuance, auction-size, buyback or coupon/FRN release — no off-cycle action. The 2026-09-23 FRN reopening (the dated discount-margin check) has not yet occurred as of this pulse. **Adjacency sweep — corridor (±5d of 10-22 and the 10-28 FRN sale) re-pulled via `event-scan.mjs --on-date`:** the two FRN-proposal siblings from initial research are both now canonical (`treasury-2y-frn-2026-10-28.json`, `treasury-2y-frn-2026-09-23.json` — nothing to re-propose). No new **confirmed** high/critical entry entered the corridor (`adjacentStrongIds` still empty) — the only new critical-impact name is `msft-2026-10-27-print`, still `estimate`, named here rather than assessed. Other new low/medium corridor entries since the 09-05 sweep (housing starts, UK CPI/retail/labour, JGB 20Y, dallas fed, case-shiller/FHFA, new/pending home sales, vix-expiration-2026-10-21, aapl iphone duo launch, japan CPI) are calendar churn, not adjacency findings — none touches this event's symbols (`[]`) or its rates-only content. **No new proposal filed this pulse** — nothing dated and material surfaced outside what initial research already proposed or the calendar already carries. | No change — the out-of-sample check strengthens the existing stance rather than revising it | 2026-09-29 (medium:8+ band, D-30) |
| 2026-09-29 | D-23 | **Deterministic screen (no Claude session).** Readings — VIX 16.1 (+1.2pt since last), band unchanged (medium:8+), 35 adjacent event(s) tracked, new in corridor since last pulse: `jgb-liquidity-enhancement-5-11y-2026-10-22`, `msft-def14a-2026-10-22`, `treasury-5y-tips-2026-10-22` (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-06 |
| 2026-10-06 | D-16 | **Deterministic screen (no Claude session).** Readings — VIX 15.5 (-0.6pt since last), band unchanged (medium:8+), 36 adjacent event(s) tracked, new in corridor since last pulse: `meta-nm-privacy-penalty-ruling-2026-10-20` (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-13 |
| 2026-10-13 | D-9 | **Pulse check (full session — the screen streak hit its 3rd-screen ceiling).** **Premise intact, nothing to re-register.** (1) **Schedule unchanged:** Treasury's Tentative Auction Schedule re-fetched direct, HTTP 200, **17,195 bytes — byte-identical to the 2026-09-05 read**; the same eight rows still announce Thursday 10-22 (2Y 10-26, 5Y 10-27, 2Y FRN 10-28, 7Y 10-29, all settling 11-02, plus 13/26/6/52-week bills). Date stays `estimate`. (2) **Kill switch not fired — and a new low:** the **2026-09-23 FRN reopening** (fiscaldata `auctions_query`, term `1-Year 10-Month`, $28B) printed a high discount margin of **4.0bp** vs the 10.0bp kill line, below the 5.0bp (07-29) and 5.5bp (08-26) readings the compression premise rested on. The registered **-2** test's pass line is therefore **≤ 6.0bp on 2026-10-28** (09-23's 4.0bp + the 2.0bp tolerance). (3) **Out-of-sample sizes held again:** 2Y $69B (09-22), 5Y $70B (09-23), 7Y $44B (09-24) printed on-grid, FRN reopening $28B; the 09-17 announcement is the record. The 10-01 announcement's 3Y $58B / 10Y reopening $39B / 30Y reopening $22B and 10-08 results confirm the same table (bid-to-cover 2.62 / 2.77 / 2.54); **FT -1 (2Y/5Y/7Y/FRN = $69B/$70B/$44B/$30B) is unkilled, scores 2026-10-23.** (4) **Rates regime moved hard, supply did not.** Treasury par (home.treasury.gov daily CSV, 10-09 vs 09-22): 2Y **4.80** (+9bp), 5Y **5.02** (+19), 7Y **5.13** (+24), 10Y **5.24** (+28), 30Y **5.60** (+31) — a bear steepening into an announcement whose sizes are already written. Secondary (Penn Mutual, 10-05): the 10-02 payrolls were **+29k vs ~84k expected**, unemployment 4.2%, Oct-hike odds fell to ~14% from ~70%, the 10Y touched 5.34% intra-week (highest since 2002 per that note). That is a demand/term-premium story for the 11-04 refunding, not evidence on 10-22. (5) **Guidance wording re-read:** `sb0590` still reads *"anticipates maintaining nominal coupon and FRN auction sizes for at least the next several quarters"* and *"continues to evaluate potential future changes"*; nothing found that changes it before 11-04 (dealer commentary expects increases Nov-26 to Feb-27 — consensus split, secondary and not read in full). (6) **Adjacency:** VIX **15.21** (10-12; 15.52 at the last row, -0.3pt), band unchanged `medium:8+`; CPI Sep data lands **10-14** (tracked, `cpi-2026-10-14`), FOMC 10-28 (tracked), FRN auction 10-28 (`treasury-2y-frn-2026-10-28`, tracked), refunding 11-04 and borrowing estimates 11-02 (tracked). `--on-date` run for 10-22/10-26/10-28/11-02/11-04: every adjacent release already on the calendar — **no proposal filed.** Not read this pass: the 10-07 FOMC minutes themselves (sibling `fomc-minutes-2026-10-07` owns them). | — (stance holds: scheduled nil on the four coupon sizes; the live variable is the 11-04 guidance sentence, not this announcement) | 2026-10-20 |
| 2026-10-18 | D-4 | **Pulse check (full session — VIX +4.8pt since the last row crossed the 3-point regime line).** **Premise intact; the announcement has not happened, and one thing the initial research called "pinned" has moved.** (1) **Schedule and guidance unchanged:** Tentative Auction Schedule re-fetched direct, HTTP 200, **17,195 bytes — same size as the 09-05 and 10-13 reads**; `sb0590` re-fetched direct, HTTP 200, 75,576 bytes (75,579 on 09-05 — markup jitter), the sentence *"for at least the next several quarters"* still present. Treasury press releases `sb0653`–`sb0662` (latest; `sb0663` is 404) carry no debt-issuance, auction-size, buyback or coupon/FRN item — Iran sanctions, IMF/World Bank statement, TIC August (not read) — so **no off-cycle coupon/FRN action; kill switches not fired**. (2) **Sizes this release is expected to publish are unchanged:** 2Y **$69B** · 5Y **$70B** · 7Y **$44B** · FRN new issue **$30B** off `sb0590`'s Oct-26 row; **FT -1 (scores 10-23) and -2 (pass line ≤ 6.0bp on 10-28) unchanged and open.** (3) **Correction to the bill leg of the 09-05 initial research (leg 9) — the bills did step, in the 09-24 announcement:** fiscaldata `auctions_query` (`announcemt_date:gte:2026-09-01`, HTTP 200) — **13-week 92 → 95** and **26-week 79 → 82** on 09-24, held 95 / 82 through 10-01, 10-08 and 10-15; **6-week 75 → 85 (09-24) → 95 (10-01)**, held 95 on 10-08 and 10-15; **52-week 52 → 54 on 09-24**, its only print since the September one. The 52-week is announced once every four weeks, so **this announcement is the next 52-week sizing** and $54B is the carry-forward number (descriptive, not a prediction — the 52-week stepped once a year in July before this, so the 09-24 move was off-pattern). `FT-treasury-coupon-announcement-2026-10-01-2` owns the 13-/26-week floor; not re-registered here. (4) **Volatility regime — material.** VIX **19.99** (10-16 close, Yahoo `^VIX` direct) vs **15.21** (10-12) at the last row: 15.27 (10-13) → 16.87 (10-14, hot-CPI day) → 16.46 (10-15) → **19.99** (10-16). Cause per the sibling [`treasury-2y-note-2026-10-26`](treasury-2y-note-2026-10-26.md) and [`fomc-2026-10-28`](fomc-2026-10-28.md) 10-17/10-18 rows (search-relayed, not re-verified here): AI-financing/credit equity selloff, S&P −1.09% and Nasdaq −2.14% on 10-16, Brent ~$110. No bearing on the sizes: they are document-derived from `sb0590`, not volatility-derived. (5) **Macro surprise (sibling-relayed, not re-fetched):** Sept CPI 10-14 headline +0.6% m/m, core +0.3% vs ~0.2% (hot by a tenth); PPI 10-15 final demand +1.3% m/m vs ~0.5%. October FOMC odds firmed to hold **~87%** / hike ~14% (Polymarket direct per the FOMC sibling, 10-18), December hike ~76–79%. **Rates (Treasury par CSV, direct, 10-09 → 10-16):** 3-Mo 4.25 → **4.26** (the FRN's index tenor) · 2Y 4.80 → **4.74** · 5Y 5.02 → **4.89** · 7Y 5.13 → **4.98** · 10Y 5.24 → **5.09** · 30Y 5.60 → **5.43** — a bull steepening of 6–17bp on the curve into the risk-off tape, the reverse of the 10-13 row's bear steepening. Supply is not the driver and none of it touches an announcement whose numbers are already in writing. (6) **Peers:** n/a, `symbols: []`. **Geopolitical:** Treasury's Iran-sanctions releases and Brent ~$110 recorded; no debt-management implication. (7) **Adjacency:** `event-scan.mjs --on-date` for 10-22, 10-26 and 10-28 — every adjacent release is already on the calendar. Corridor **38 ids**, **0 strong** (`adjacentStrongIds` empty); new since the 10-13 probe: `uk-ashe-earnings-2026-10-22` and `uk-gilt-auction-short-2026-10-27` (both low, recorded, not assessed); `msft-2026-10-27-print` has left the corridor on its re-date. **No proposal filed; nothing dated seen beyond the horizon.** Date stays `estimate`: the confirming primary is the 10-22 announcement itself. | — (stance holds: scheduled nil on the four coupon sizes; leg 9's bill description is superseded by the 09-24 steps above, no stance consequence) | 2026-10-20 (medium:0+ band, every 2d) |
| 2026-10-18 | D-4 | **Pulse check (full session — the VIX reading moved 4.8pt, past the 3pt screen line).** **Premise intact; one new fact on the bill leg, one VIX regime move, no kill switch fired.** (1) **Schedule unchanged, third read:** Tentative Auction Schedule re-fetched direct, HTTP 200, **17,195 bytes, md5 a079d72f…** — the same size as the 09-05 and 10-13 reads; the eight rows still announce Thursday 10-22 (2Y 10-26, 5Y 10-27, 2Y FRN 10-28, 7Y 10-29, settling 11-02, plus 13/26/6/52-week bills). Date stays `estimate`. (2) **Kill switches checked, none fired:** `home.treasury.gov/news/press-releases` index re-read (HTTP 200, 71,267 bytes), 10-08 → 10-16 — enforcement, sanctions, IRS, IMF-statement and TIC items only; **no debt-issuance, auction-size, buyback or coupon/FRN release** (newest is TIC for August, 10-16). The `sb0590` sentence was not re-read in full this pass; the 10-13 row's re-read stands. (3) **Out-of-cycle check, the 10-15 announcement** (fiscaldata `auctions_query`, `announcemt_date:eq:2026-10-15`, HTTP 200): 20Y reopening **$13B** (Oct-26 column `13`), 5Y TIPS new issue **$26B**, bills 13w **$95B** · 26w **$82B** · 6w **$95B** — the sizes `sb0590` names, again on-grid. **FT -1 (2Y/5Y/7Y/FRN = $69B/$70B/$44B/$30B) is unkilled, scores 2026-10-23.** FRN reopening 09-23 stays the last FRN datum: DM **4.0bp**, so FT -2's pass line is still **≤ 6.0bp on 2026-10-28**. (4) **Correction to this ledger's own bill baseline (append-only; the 09-05 row is not edited).** Initial research called 13w **$92B** / 26w **$79B** "pinned since 06-29" and the 52-week an annual early-July step. Both are stale: 13w/26w stepped to **$95B / $82B** with the 10-01 announcement (auctions 10-05, 10-13 and 10-19 all 95/82; 6-week 95 on 10-06, 10-13, 10-20), which `FT-…-10-01-2` registered and scored **pass** on 2026-10-02; and the **52-week stepped $52B → $54B** with the 09-24 announcement (auction 09-29) — a mid-year, 4-week-cadence move, not the early-July annual step. So the bill leg this announcement publishes starts from **95 / 82 / 54**, not 92 / 79 / 52. Registered below as `-3`. (5) **Volatility regime — the one material move.** **VIX 19.99 at the 10-16 close** (16.46 on 10-15, intraday high 22.31; 15.21 at the 10-13 row, **+4.8pt**) with SPX **−1.09%** (7,744.06 → 7,659.44) and ^TNX 5.10. Source is the sibling [`opex-2026-10-16`](opex-2026-10-16.md) close-out, which read Yahoo's chart API cold on 10-17; this session's own Yahoo read returned 429 and FRED/stooq/CBOE returned no data (recorded in `blocked`). That ledger found **no dated driver** for the 10-16 sell-off and none is asserted here. It changes what options-shaped plays cost, not this event: `symbols: []`. (6) **Rates (Treasury par, primary CSV, HTTP 200), 10-09 → 10-16:** 3-Mo 4.25 → **4.26** · 2Y 4.80 → **4.74** · 5Y 5.02 → **4.89** · 7Y 5.13 → **4.98** · 10Y 5.24 → **5.09** · 20Y 5.65 → **5.47** · 30Y 5.60 → **5.43**. The 10-13 row's bear steepening reversed: the long end rallied 13–18bp over the week with the 3-Mo (the FRN's index tenor) flat; the daily path was 5Y 5.00 (10-13, 10-14) → 4.91 (10-15) → 4.89 (10-16) and 30Y 5.56 (10-13) → 5.52 → 5.43 → 5.43. That is a term-premium retracement into an announcement whose sizes are already written, and it does not bear on 10-22. (7) **Guidance expectations (secondary, one web search, snippet-level, not read in full):** analysts now put the next nominal coupon increase at **February 2027** rather than the 11-04 refunding, "pushed back… in recent months" — consistent with the 10-13 row's split consensus, and it lowers the odds of the 11-04 kill switch firing. Weight: low; no primary moved. (8) **Adjacency sweep:** `--on-date` re-run for 10-26 and 10-29; **every adjacent release is already on the calendar** — `computeAdjacentIds` returns **39 ids, zero confirmed high/critical (`adjacentStrongIds` empty)**; newly in the corridor since 10-13: `uk-ashe-earnings-2026-10-22`, `uk-gilt-auction-short-2026-10-27` (calendar churn, recorded, not assessed). Peer prints: n/a (`symbols: []`). Macro: 10-14 CPI, 10-15 retail sales/PPI absorbed; the 10-28 FOMC (blackout 10-17 → 10-29) is the next policy event and FRN sale day. Nothing dated sits outside the horizon that is not already tracked. **No proposal filed this pulse.** | **No change to the call** — scheduled nil on the four coupon sizes. One registered addition (`-3`, the bill leg) because the baseline moved under the ledger; the VIX move is noted, not acted on | 2026-10-20 (medium:0+ band, D-4; the band tightened from 8+ at D-8) |
| 2026-10-20 | D-2 | **Pulse check (full session — the screen was material on one new strong adjacent: `meta-2026-10-28-print`).** **Premise intact; the announcement has not happened, and no kill switch has fired.** (1) **Schedule unchanged, fourth read:** Tentative Auction Schedule re-fetched direct, HTTP 200, **17,195 bytes, md5 a079d72f…** — identical to the 09-05, 10-13 and 10-18 reads; the eight rows still announce Thursday 10-22 (2Y 10-26, 5Y 10-27, 2Y FRN 10-28, 7Y 10-29, settling 11-02, plus 13/26/6/52-week bills). Date stays `estimate`: the confirming primary is the 10-22 announcement itself. (2) **Kill switches checked, none fired:** `home.treasury.gov/news/press-releases` re-read (HTTP 200, 72,430 bytes on `sb0663`'s page) — `sb0663`, new since the 10-18 row, is a Federal Student Aid fraud release; `sb0664`/`sb0665` do not exist. **No debt-issuance, auction-size, buyback or coupon/FRN item**, so no off-cycle coupon/FRN action. The `sb0590` sentence was not re-read in full this pass; the 10-13 row's re-read stands. (3) **Out-of-cycle sizes, on-grid:** fiscaldata `auctions_query` (`announcemt_date:gte:2026-10-15`, HTTP 200) — 5Y TIPS $26B (auction 10-22), 20Y reopening $13B (10-21), 13w **$95B** · 26w **$82B** · 6w **$95B** (10-19/10-20 auctions) — the 10-18 row's bill baseline **95 / 82 / 54** (FT -3) is untouched. **FT -1 (scores 10-23), -2 (10-29) and -3 (10-23) unchanged and open**; no FRN auction since the 09-23 reopening (DM 4.0bp), so -2's pass line stays ≤ 6.0bp on 10-28. (4) **Volatility regime:** VIX **18.44** (10-19 close, Yahoo `^VIX` direct) vs **19.99** (10-16) at the last row, **−1.55pt** — a partial retrace (14.84 → 15.21 → 15.27 → 16.87 → 16.46 → 19.99 → 18.44 over 10-09…10-19), under the 3pt line; it changes what options-shaped plays cost, not this event (`symbols: []`; sizes are document-derived from `sb0590`, not volatility-derived). (5) **Rates (Treasury par CSV, direct, HTTP 200), 10-16 → 10-19:** 3-Mo 4.26 → **4.27** (the FRN's index tenor) · 2Y 4.74 → **4.77** · 5Y 4.89 → **4.94** · 7Y 4.98 → **5.04** · 10Y 5.09 → **5.15** · 30Y 5.43 → **5.48** — a 3–6bp give-back of the 10-16 rally; supply is not the driver. (6) **Macro / peers / geopolitical:** nothing new printed since the 10-18 row beyond the 10-19 tape above; the sibling FOMC row (10-19, Kalshi direct) keeps the 10-28 meeting ~86.5% hold with a December hike still modal. Peers n/a (`symbols: []`). No new geopolitical item bearing on debt management read this pass. (7) **Adjacency:** `event-scan.mjs --on-date` re-run for 10-22, 10-26 and 10-28 — every adjacent release is already on the calendar. Corridor **40 ids**; the one strong adjacent new since the 10-18 probe is `meta-2026-10-28-print` (confirmed, critical; it re-dated into the 5-day window as `msft-2026-10-27-print` left — an earnings print, recorded, no bearing on Treasury supply sizes); also new: `apec-fmm-hong-kong-2026-10-20` (recorded, not assessed). **No proposal filed; nothing dated seen beyond the horizon.** | — (stance holds: scheduled nil on the four coupon sizes and the 95 / 82 / 54 bill baseline; screen reason was calendar churn, not information) | 2026-10-22 (medium:0+ band, every 2d; the announcement itself lands that day) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`) in the same PR. Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory.

**Last assessed:** 2026-09-22
<!-- probe-ref: {"symbols":{},"vix":14.87,"daysBand":"medium:8+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX","status":"stale-cache","at":"2026-09-22"},{"url":"https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv","status":"truncated","at":"2026-09-22"},{"url":"https://www.wsj.com/market-data/quotes/index/VIX","status":"fetch-refused","at":"2026-09-22"},{"url":"https://www.google.com/finance/quote/VIX:INDEXCBOE","status":"unsupported","at":"2026-09-22"}]} -->

**Last assessed:** 2026-09-29
<!-- probe-ref: {"symbols":{},"vix":16.07,"daysBand":"medium:8+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","msft-2026-10-27-print","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":1} -->

**Last assessed:** 2026-10-06
<!-- probe-ref: {"symbols":{},"vix":15.52,"daysBand":"medium:8+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-nm-privacy-penalty-ruling-2026-10-20","msft-2026-10-27-print","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":2} -->

**Last assessed:** 2026-10-13
<!-- probe-ref: {"symbols":{},"vix":15.21,"daysBand":"medium:8+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-nm-privacy-penalty-ruling-2026-10-20","msft-2026-10-27-print","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":0} -->

**Last assessed:** 2026-10-18
<!-- probe-ref: {"symbols":{},"vix":19.99,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-nm-privacy-penalty-ruling-2026-10-20","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-ashe-earnings-2026-10-22","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-gilt-auction-short-2026-10-27","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":0} -->

**Last assessed:** 2026-10-18
<!-- probe-ref: {"symbols":{},"vix":19.99,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-nm-privacy-penalty-ruling-2026-10-20","msft-2026-10-27-print","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-ashe-earnings-2026-10-22","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-gilt-auction-short-2026-10-27","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX","status":"429","at":"2026-10-18"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=VIXCLS","status":"no-response","at":"2026-10-18"},{"url":"https://stooq.com/q/d/l/?s=%5Evix&i=d","status":"no-response","at":"2026-10-18"},{"url":"https://cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv","status":"redirect-307","at":"2026-10-18"}]} -->

**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{},"vix":18.44,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","apec-fmm-hong-kong-2026-10-20","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-2026-10-28-print","meta-nm-privacy-penalty-ruling-2026-10-20","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-ashe-earnings-2026-10-22","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-gilt-auction-short-2026-10-27","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":["meta-2026-10-28-print"],"screenStreak":0} -->

## Outcome

**Assessed 2026-10-23 (D+1, inside the close-out window).** `rates` event, `symbols: []` — no
`earnings-cycle`/`intraday-edges` target applies, so the instrument cache bust
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) was run and had nothing
to clear (recorded, not skipped silently). Every number below is a fresh pull this session, never carried
from a prior row: treasurydirect `xml/A_20261022_1.xml`-`_8.xml` (HTTP 200; the `A_20261022_5-8.pdf` renderings also return 200 but were not text-parsed here),
`TA_WS/securities/upcoming` (HTTP 200), Treasury's daily par curve XML, Yahoo daily and 30-minute bars for
`^VIX`/`^TNX`/`^FVX`/`^TYX`. **One source did not have it yet:** fiscaldata `auctions_query`
(`announcemt_date:eq:2026-10-22`) returned `total-count` 0 and its newest `announcemt_date` was 2026-10-15 —
the dataset lags the announcement by at least a day, so the scoring below rests on the two Treasury primaries
that carry it, not on fiscaldata. The run-length anchors registered from fiscaldata on 2026-09-05 were not re-run.

### The announcement, re-pulled from the primary

| Security | CUSIP | Reopening? | Offering | Auction | Issue/settle |
|---|---|---|---|---|---|
| 2-Year NOTE | **91282CRU7** | No | **$69.000B** | 2026-10-26 | 2026-11-02 |
| 5-Year NOTE | **91282CRT0** | No | **$70.000B** | 2026-10-27 | 2026-11-02 |
| 2-Year FRN | **91282CRS2** | **No — new issue** (`CurrentlyOutstanding` 0) | **$30.000B** | 2026-10-28 | 2026-11-02 |
| 7-Year NOTE | **91282CRV5** | No | **$44.000B** | 2026-10-29 | 2026-11-02 |
| 13-Week BILL | 912797VU8 | Yes | $95.000B | 2026-10-26 | 2026-10-29 |
| 26-Week BILL | 912797WW3 | No | $82.000B | 2026-10-26 | 2026-10-29 |
| 6-Week BILL | 912797VG9 | Yes | $95.000B | 2026-10-27 | 2026-10-29 |
| 52-Week BILL | 912797WT0 | No | $54.000B | 2026-10-27 | 2026-10-29 |

All eight rows carry `AnnouncementDate` 2026-10-22 and `updatedTimestamp` **11:01:44-11:08:52 ET** (bills
11:01-11:03, FRN 11:04, 5Y 11:05, 7Y 11:06, 2Y 11:08). That reading closes the limit this entry's calendar
file disclosed: the ~11:00 ET slot was a convention, and the observed publication window is 11:01-11:09. The
composition (four coupon-type securities plus the four bills) is exactly what the Tentative Auction Schedule
named (17,195 bytes, unrevised across five reads from 2026-09-05 to 2026-10-20). The coupon block is
**$213B**, as registered. The FRN row is `Note` / `FloatingRate` Y / `Reopening` N in Treasury's feed and a new
issue by `CurrentlyOutstanding` 0 in the XML, the registered reading.

### Forward tests scored

- **`FT-treasury-coupon-announcement-2026-10-22-1`** — **PASS.** Predicted 2Y **$69B**, 5Y **$70B**, 7Y
  **$44B**, 2-Year FRN new issue **$30B**; printed **$69.000B / $70.000B / $44.000B / $30.000B**, the FRN as a
  new issue, on the scheduled date. Base rate was disclosed up front as near-uninformative, and it behaved
  that way: it extends the 2Y/5Y/7Y and FRN new-issue size grids by one more announcement (run lengths were
  not re-counted, since fiscaldata does not yet carry this release). What the pass
  does carry is the channel's terminal test: this was the **last** announcement `sb0590`'s table covers, and
  Treasury's written Oct-26 row (`69 58 70 44 39 13 22 30`) matched it on every leg that could be checked.
  Neither void condition fired: the announcement came on its scheduled date, and Treasury press releases
  `sb0653`-`sb0667` (`sb0668` is 404) carry no coupon or FRN size action. One observation about an issuance
  convention, never a price template or a rate view.
- **`FT-treasury-coupon-announcement-2026-10-22-3`** — **PASS.** Predicted 13-Week **$95B**, 26-Week **$82B**,
  52-Week **$54B**; printed **$95.000B / $82.000B / $54.000B**. The 6-Week (deliberately excluded) printed
  $95B, unchanged. The 52-week's 4-week cadence: $52B (07-07, 08-04, 09-01) -> $54B (09-29) -> **$54B**
  (this announcement), so the single step has now held for one cycle. That is one more observation consistent
  with the rolling reading and not a test of it — the disclosed weakness (four observations, one step) stands,
  with five now.
- **`FT-treasury-coupon-announcement-2026-10-22-2`** — **left `_open_` on purpose.** It scores the
  **2026-10-28** FRN new issue's high discount margin, which does not exist until that auction clears, and its
  registered `Score by` is **2026-10-29**. The scanner's `forwardTestsBeyondWindow` flag names it; per
  EVENT-RESEARCH.md's `forward-test-due` mode (#2884) the same lane is re-dispatched on 10-29 to score it
  from the auction result, which is a better record than an `unscoreable` verdict written seven days early
  about data that will exist. The pass line as re-anchored by the 10-13 row is **<= 6.0bp** (09-23 reopening
  4.0bp + the 2.0bp tolerance); `highDiscountMargin` is blank on the live announced row today, as expected.

### Kill switches, adjudicated against the close-out data

- **"Any of 2Y $69B · 5Y $70B · 7Y $44B · FRN $30B printing off-grid"** — does **not** fire (all four on size).
- **"The 2026-09-17 announcement printing off `69 58 70 44 39 13 22 28`"** — did not fire; adjudicated by
  that event's own close-out (ledger row 2026-09-22).
- **"The 2026-09-23 FRN reopening printing a discount margin above 10.0bp"** — did not fire (4.0bp; ledger row
  2026-10-13).
- **"The 2026-10-28 FRN new issue more than 2.0bp above the 09-23 reopening"** — **open**: the auction is
  five days out. It is `-2`'s own kill and is scored by that row, not here.
- **"Treasury dropping or qualifying *for at least the next several quarters*"** — still pending; it is
  `FT-39`'s question at **2026-11-04**, not this event's. Nothing in the 10-22 release qualifies it.
- **"An off-cycle coupon or FRN issuance action"** — does **not** fire. Treasury press releases `sb0664`-`sb0667`
  (new since the 10-20 row) read by title, fetched direct: an Iran sanctions release, a housing-affordability
  release, a Paraguay readout and an outbound-investment proposed rule — zero coupon-size, CMB, buyback or
  refunding items. The bill sizes are the lever `sb0590` reserves and do not fire it.

### Tape, for the record (no attribution claimed)

Treasury par, primary: 10-21 -> **10-22** — 3-Mo 4.25 -> **4.22** · 2Y 4.81 -> **4.65** · 5Y 4.95 -> **4.78**
· 7Y 5.03 -> **4.86** · 10Y 5.13 -> **4.96** · 30Y 5.42 -> **5.29**. Yahoo `^TNX` 5.146 -> **4.953**,
`^FVX` 4.972 -> **4.768**, `^TYX` 5.439 -> **5.287**. VIX **16.68 -> 19.03** (10-23 reads 19.70 on the day's
latest bar, an unfinished session). The whole curve rallied ~13-20bp on the day. **The announcement did not cause it, and the intraday bars show why:** `^TNX`
was already **5.040 at 08:20 ET** on 10-22 (about 10bp under the prior close) before any Treasury publication,
and across the window holding the 11:01-11:09 stamps it moved 5.011 (10:50) -> 4.996 (11:20), -1.5bp, inside
the session's ordinary drift. What drove the overnight gap was not identified this session — it was not
searched for, and the same-day print/geopolitical calendar (see `adjacentIds`) was not re-sourced. The
announcement restated four numbers already in writing since 2026-08-05, as leg 12 of the initial research
committed to before the fact: **no tape move is attributed to it**, and no position was or is keyed to it.

### What this closes

**Stand aside held for the whole life of this event, and it was correct — nothing was keyed to a scheduled,
pre-published announcement, and nothing is retrofitted now.** What the event resolved: the eight-security
composition (not the four the calendar named) was found at D-47 from Treasury's own schedule, every size was
registered against a written commitment, and the written word bound on every leg, on first contact with the
primary. The durable outputs stand as written at initial research: the FRN, examined for the first time in
this calendar and at a four-year-low discount margin; the bill leg's new baseline (95 / 82 / 54, held); and the
correction that 10-22, not 10-15, is the last coupon announcement `sb0590` covers. The calendar file keeps
`status: estimate`: this lane records the observed announcement from Treasury's documents and does not rewrite
a calendar entry's date status on a close-out. **What stays open: `-2` on 2026-10-29** (the FRN discount
margin at the 10-28 FOMC-day auction), then **11-04** (the quarterly refunding, where `FT-39` lives and the
grid itself can change). The scanner goes quiet on this event until 10-29.

**Last assessed:** 2026-10-23
<!-- probe-ref: {"symbols":{},"vix":19.03,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","apec-fmm-hong-kong-2026-10-20","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-nm-privacy-penalty-ruling-2026-10-20","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","spcx-lockup-release-2026-10-22","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-ashe-earnings-2026-10-22","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-gilt-auction-short-2026-10-27","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":0} -->

**Forward-test scoring, 2026-10-30 (`forward-test-due`, #2884).** `FT-treasury-coupon-announcement-2026-10-22-2`
scored **pass**: the 2026-10-28 2-Year FRN new issue (91282CRS2, $30B, not a reopening) cleared at a
**3.8bp** high discount margin against the 09-23 reopening's **4.0bp**, -0.2bp inside the +2.0bp band, on an
FOMC-day hold with two hawkish dissents. Source: treasurydirect `TA_WS/securities/auctioned` (fiscaldata
`auctions_query` had no row after 09-23). One expected observation (null pass rate 83%), no promotion, no
position. No other row in this event's fragment is open; the scanner goes quiet on this event. The outcome
above and the registered predictions are untouched.

**Last assessed:** 2026-10-30
<!-- probe-ref: {"symbols":{},"vix":21.13,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","apec-fmm-hong-kong-2026-10-20","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-nm-privacy-penalty-ruling-2026-10-20","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","spcx-lockup-release-2026-10-22","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","uk-ashe-earnings-2026-10-22","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-gilt-auction-short-2026-10-27","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":[],"screenStreak":0} -->
