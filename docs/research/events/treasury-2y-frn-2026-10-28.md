# 2-Year Floating Rate Note auction (quarterly new issue) — treasury-2y-frn-2026-10-28

**Kind:** rates · **Date:** 2026-10-28 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer re-extracted direct 2026-09-05 — the `2-Year FRN` row carries NO `R` marker, i.e. new issue; stays `estimate` because a tentative schedule is tentative and this lane may not self-confirm) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["advance-economic-indicators-2026-10-28","boj-decision-2026-10-30","chicago-pmi-2026-10-30","consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","ism-manufacturing-2026-11-02","pce-2026-10-29","sloos-2026-11-02","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This is the only one of October's four coupon sales whose result is durable, and it prices
2.5 hours before the Fed speaks — both facts are new to this calendar and both were sourced this
session.** A 2-Year FRN new issue's high discount margin **becomes** the note's coupon spread, and every
reopening of that CUSIP inherits it: **51/51 and 103/103 across the full 154-auction series since 2014,
no exceptions**. So 10-28 stamps a spread that ~**$86B** of paper carries to 2028 — this $30B plus the
$28B reopenings Treasury's own schedule puts on **2026-11-24** and **2026-12-23**. The auction closes
**11:30 ET**; the FOMC statement is **14:00 ET** (confirmed, FED); and the FRN's index rate is locked by
the **2026-10-26** 13-week bill auction, two days *before* the decision. That is the mechanical reason
[the parent's measured non-concession](treasury-coupon-announcement-2026-10-22.md) holds — the decision
touches the index, the pricing and the settlement at no point. The one thing this session tried to
confirm and **could not**: `sb0590`'s bill-demand story for the four-year-low margin is **not visible in
the auction's own bidder composition** — the five tightest new issues since 2021 averaged **60.3%**
indirect, the five widest **73.0%**. Date is `estimate`, `symbols: []`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-53) | **Stand aside** | High | Saturday — no session, Labor Day Monday, next print 09-08. `symbols: []`, date `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed, and the size is already published (`sb0590` Oct-26 FRN column `30`). | Treasury publishing an off-cycle **FRN** size change or a coupon CMB before **2026-10-22** — `sb0590` binds FRNs and nominals in one sentence, so an FRN action fires this as surely as a note one |
| This week | **Stand aside; the auction time is now sourced — retire the "unsourced ~11:30 ET" caveat** | High | `closing_time_comp` is a published fiscaldata field: **11:30 AM** on **137 of 154** auctions, and every exception is a holiday/short week (Thanksgiving, late December). 2026-10-28 is an ordinary Wednesday. | The **2026-09-23** reopening printing a closing time other than **11:30 AM ET** on an ordinary week — the field is not the reliable schedule read this doc treats it as |
| This month | **Watch exactly one dated check — the 2026-09-23 FRN reopening — and hold nothing through it** | Medium | It is the only FRN auction between today and 10-28, the free read on whether **5.0/5.5bp** is a level or a moment, and it is proposed to the calendar in this PR. | The **2026-09-23** reopening printing a high discount margin **above 10.0bp** — the compressed-regime premise dies five weeks before the auction it was written for (this is the parent's kill switch, inherited verbatim) |
| This quarter | **Read 10-28 for the spread it stamps, not for an FOMC reaction — and do not expect the bill-demand story to be confirmed by it** | Medium | The spread governs $86B to 2028 and is the auction's only durable output; the demand mechanism failed every auction-side test run here (corr(indirect%, HDM) = **+0.20** since 2021, **+0.01** since 2025 — near-zero and the wrong sign). | The **2026-10-28** new issue printing indirect above **76.4%** of competitive accepted at a record-tight margin — the first auction-side evidence FOR the mechanism, and the registered test's own kill |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, date `estimate`, no house playbook is rates-keyed. Zero
  capital is at stake in anything below.
- **The structural finding, new to this calendar:** a new issue's high discount margin **is** the
  note's spread (**51/51** since 2014) and its reopenings inherit it (**103/103**). A reopening's margin
  is a market mark; a **new issue's is a two-year contract**.
- **What 10-28 stamps:** $30B now + **$28B on 2026-11-24** + **$28B on 2026-12-23** ≈ **$86B** to 2028,
  all three rows read direct from Treasury's schedule PDF this session.
- **The timing chain, fully sourced:** index locked **2026-10-26** (13-week bill auction) → auction
  closes **11:30 ET 10-28** → FOMC statement **14:00 ET 10-28** → settles **2026-11-02**. The decision
  lands after the index and after the price.
- **Recalibration of the parent's "four-year low":** 5.0bp is the **22nd percentile** of all 154
  auctions since 2014, not an extreme. **Eight** auctions have printed **≤ 0bp**; the minimum is
  **−7.5bp** (2022-04-27). There is a great deal of room below here historically.
- **The mechanism test, and it failed:** the five tightest new issues since 2021 averaged **60.3%**
  indirect vs **73.0%** for the five widest. The record-tight **2026-07-29** printed **63.2%** indirect
  (below the 65.1% mean) with dealers at **36.8%** (above the 33.1% mean).
- **The index-level story fails locally too:** corr(index rate, HDM) is **0.830** since 2021 but only
  **0.302** since 2025 — a ZIRP-era artifact. Across the compression window the 13-week index rose
  **3.678 → 3.859** and 13-week supply rose **$89B → $92B**; both moved the wrong way.
- **The fixed-rate contrast worth holding:** the 2Y note on **10-26** carries real duration into the same
  decision; the FRN does not. A surprise hike at 14:00 *raises* this buyer's future coupons.
- **Watch (dated):** FRN reopening **09-23** (announced 09-17) · FOMC **09-16** · CPI **10-14** · FOMC
  blackout opens **10-17** · this announcement **10-22** · 2Y note + index determination **10-26** · 5Y
  **10-27** · **this auction + FOMC 10-28** · 7Y + GDP **10-29** · settlement + borrowing estimates
  **11-02** · refunding **11-04** · reopenings **11-24** and **12-23** · next new issue **2027-01-27**,
  which draws an FOMC decision day again.

## Initial research

### The question, plainly

This event was created by the [`treasury-coupon-announcement-2026-10-22`](treasury-coupon-announcement-2026-10-22.md)
initial research (2026-09-05), which found the 2-Year FRN was the only one of that announcement's four
coupon sales with no calendar row, examined it for the first time in this calendar, and measured the
headline result: **selling on an FOMC decision day extracts no concession**, within-CUSIP controlled at
n=8. That parent also left an explicit instruction in this event's calendar file — *"This event does NOT
re-register the prediction… inherit it rather than duplicating one observation."*

So the question here could not be "does the FOMC day cost anything," which is answered. It was the
narrower one: **what does the auction itself do that the announcement does not, and can the one
mechanism the parent named but did not measure actually be measured?**

**One-line verdict:** the auction does something no other October coupon sale does — it **stamps a
two-year spread on ~$86B of paper** — and it does so 2.5 hours before the Fed speaks and two days after
its own index is locked, which turns the parent's *measured* non-concession into a *mechanical* one;
meanwhile the bill-demand mechanism behind the four-year-low margin is **absent from the auction's own
bidder composition**, which is the honest negative worth registering.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no symbol-keyed
instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the mandated cache
bust has nothing to bust (recorded rather than skipped silently). Every number below was **fetched from a
primary this session (2026-09-05)** and re-derived from scratch, including numbers the parent publishes:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**; PDF streams inflated and the text layer rebuilt from per-glyph Td/Tm
  coordinates so rows read as rows. All six FRN rows extracted, not just this one.
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590` (2026-08-05 refunding statement),
  HTTP 200, **75,578 bytes**, tag-stripped; the anticipated-size table and the governing sentence read
  verbatim rather than inherited.
- **The auction record** — `api.fiscaldata.treasury.gov` `auctions_query`, `floating_rate: Yes`, HTTP
  200, **532,321 bytes**, **154 auctions** (2014-01-29 → 2026-08-26) — the complete 2-Year FRN series.
  Plus every `13-Week` bill row since 2026-05-01 (19 auctions).
- **The tape** — Treasury's own 2026 daily par yield-curve CSV (HTTP 200, 13,961 bytes) and Yahoo
  `^VIX` daily closes.

### Conviction legs, tested

**1. A new issue's high discount margin IS the note's coupon spread, and reopenings inherit it —
SUPPORTED, 51/51 and 103/103, zero exceptions in twelve years.** `auctions_query` publishes a `spread`
field alongside `high_discnt_margin`. Across the entire 154-auction series:

| Claim | Result |
|---|---|
| New issue: `spread` equals its own `high_discnt_margin` | **51 of 51** — no exception since 2014-01-29 |
| Reopening: `spread` equals its own new issue's `spread` | **103 of 103** |

Concretely: the **2026-07-29** new issue printed a **5.0bp** margin and stamped `spread = 0.0500` on
series **BF-2028**; the **2026-08-26** reopening printed a **5.5bp** margin — a market mark — and still
carries `spread = 0.0500`. This is the distinction the parent's 28/30 finding implies from the size side
and never states from the price side, and it is why a new issue is a different *kind* of event from a
reopening rather than a bigger one. **It is also new to this calendar** — `grep -ril "discount margin"
docs/research/` returns only the parent doc and its forward-test fragment.

**2. What 10-28 actually stamps is ~$86B, not $30B — SUPPORTED, read from Treasury's own schedule.**
All six FRN rows in the tentative schedule, extracted this session:

| Announcement | Auction | Settlement | `R`? |
|---|---|---|---|
| Thursday, August 20, 2026 | Wednesday, August 26, 2026 | Friday, August 28, 2026 | **R** |
| Thursday, September 17, 2026 | **Wednesday, September 23, 2026** | Friday, September 25, 2026 | **R** |
| Thursday, October 22, 2026 | **Wednesday, October 28, 2026** | Monday, November 02, 2026 | — (new issue) |
| Thursday, November 19, 2026 | **Tuesday, November 24, 2026** | Friday, November 27, 2026 | **R** |
| Thursday, December 17, 2026 | Wednesday, December 23, 2026 | Monday, December 28, 2026 | **R** |
| Thursday, January 21, 2027 | Wednesday, January 27, 2027 | Monday, February 01, 2027 | — (new issue) |

The two reopenings between this event and the next new issue — **11-24** (a *Tuesday*, Thanksgiving
week) and **12-23** — carry this auction's stamped spread by the 103/103 rule. At the $28B reopening
grid that is **$30B + $28B + $28B ≈ $86B** priced off one 11:30 ET print. Note also that **2027-01-27 is
the next new issue and it draws an FOMC decision day again** ([`fomc-2027-01-27`](fomc-2027-01-27.md)),
so whatever is learned on 10-28 has a second observation three months later.

**3. The auction prices 2.5 hours before the statement, and its index is locked two days before it —
SUPPORTED, and this converts the parent's measured non-concession into a mechanical one.**
`auctions_query` publishes `closing_time_comp` and `frn_index_determination_date`:

- **Closing time:** `11:30 AM` on **137 of 154** auctions. The 16 `01:00 PM` exceptions are holiday and
  short weeks (Thanksgiving-week and late-December auctions — 2025-11-25, 2025-12-23, 2024-11-26,
  2023-12-27), plus one `11:00 AM`. **2026-10-28 is an ordinary Wednesday.** This *sources* the ~11:30
  ET slot the calendar entry currently carries as explicitly unsourced and omits.
- **Index determination:** the Monday of auction week on **8 of the last 10** (2026-08-24 for the 08-26
  auction, 2026-07-27 for 07-29, and so on); the other two were set a week earlier. For a 2026-10-28
  auction the modal date is **2026-10-26** — the same Monday the 13-week bill and the 2Y note sell.
- **FOMC statement:** **14:00 ET**, `confirmed` on FED primary per [`fomc-2026-10-28`](fomc-2026-10-28.md).

So the chain is: **index fixed 10-26 → auction priced and awarded 11:30 ET 10-28 → statement 14:00 ET
10-28 → settlement 11-02.** The decision touches none of the three. The parent's reading — *"the index
resets weekly and absorbs the decision"* — is right about the note's life and slightly wrong about this
auction: for *this* print the index is not resetting at all, it is already set. What the buyer receives
is every *future* weekly reset, which is why a hawkish surprise at 14:00 is a mild positive for someone
who bought at 11:30, not a concession they should have demanded. **This is a mechanism, not a new
measurement** — the n=8 within-CUSIP result stays the parent's and is inherited unchanged.

**4. The bill-demand mechanism is NOT visible in the auction's bidder composition — REFUTED as an
auction-side story, and this is the session's substantive negative.** `sb0590` states verbatim that
Treasury *"is monitoring SOMA purchases of Treasury bills and growing demand for Treasury bills from the
private sector"*; the parent named that as the obvious candidate for the compressing margin and
explicitly did not measure it. It is measurable from the auction side, and it fails:

| Test (2-Year FRN, competitive accepted basis) | Result |
|---|---|
| corr(indirect share, high discount margin), 2021+ | **+0.201** (n=69) |
| same, 2023+ / 2024+ / 2025+ | **+0.177** / **+0.187** / **+0.011** |
| Five *tightest* new issues since 2021 — mean indirect | **60.3%** |
| Five *widest* new issues since 2021 — mean indirect | **73.0%** |
| The record-tight **2026-07-29** new issue | indirect **63.2%** (mean 65.1%), dealers **36.8%** (mean 33.1%) |

The sign is **positive** — more indirect demand goes with a *wider* margin, not a tighter one — and the
magnitude collapses to nothing in the recent window. The tightest auction in four years was taken down
with *below*-average indirect participation and *above*-average dealer takedown. Whatever is compressing
the FRN's margin, **it does not show up as more bidders of the type the bill-demand story predicts.**
The honest statement is the narrow one: this refutes the mechanism *as read from auction composition*,
not the underlying bill-richness story, which lives in secondary-market bill pricing this session did not
touch.

**5. The index-level explanation fails too, and for the same composition reason the parent caught in the
raw FOMC comparison — SUPPORTED.** corr(index determination rate, high discount margin) is **0.830**
since 2021, which looks like a complete explanation. It is a ZIRP artifact: the same correlation is
**0.541** on 2023+, **0.567** on 2024+ and **0.302** on 2025+. Locally it inverts outright. Across the
compression window **2026-05-27 → 2026-08-26**, margin fell **8.9bp → 5.5bp** while:

- the 13-week index rate **rose** 3.678 → 3.859 (investment-rate basis, 19 auctions pulled), and
- 13-week bill supply **rose** $89B → **$92B**, pinned there for 11 consecutive auctions since the
  2026-06-29 quarter-turn step.

Both moved the direction that should have *widened* the margin. Bid-to-cover adds nothing either
(corr −0.005 on 2025+). **Three auction-internal candidates, three failures** — recorded so the next
session does not spend itself re-deriving them, and so the compression stays an open question rather
than a story that got adopted because it was the only one offered.

**6. "Four-year low" is true but "extreme" is not — a RECALIBRATION of the parent's framing.** Walking
the full 154-auction series: **5.0bp sits at the 22nd percentile** and 5.5bp at the 26th. The median is
**10.3bp**, the maximum **33.0bp**, and the minimum **−7.5bp** (2022-04-27). **Eight auctions have
printed at or below zero**, and four of the five tightest *new issues* since 2021 are 2021-2022 prints.
Nothing in the parent is wrong — the last sub-5.0bp print really was 2022-07-27 — but "four-year low"
invites a mean-reversion read the full distribution does not support: there is a long, well-populated
tail below here, and the 2022 episode reached it in a bill-scarcity regime that is precisely the
mechanism nobody has yet ruled in or out.

**7. The size is published and the grid is intact — SUPPORTED, re-read verbatim.** `sb0590`'s
anticipated-size table, header `2-Year 3-Year 5-Year 7-Year 10-Year 20-Year 30-Year FRN`, introduced by
*"the anticipated auction sizes for the August to October 2026 quarter"*:

```
Sep-26  69 58 70 44 39 13 22 28
Oct-26  69 58 70 44 39 13 22 30
```

**Oct-26 FRN = $30B**, matching the new-issue grid at **10/10 since 2024-04-24**; Sep-26 = $28B, matching
the reopening grid at **20/20 since 2024-05-29**. The governing sentence, verbatim: *"Based on current
projected borrowing needs, Treasury anticipates maintaining nominal coupon **and FRN** auction sizes for
at least the next several quarters."* Registered nowhere here —
[`FT-treasury-coupon-announcement-2026-10-22-1`](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
already owns the four sizes including this $30B.

**8. Two demand-side contrasts with the fixed-rate siblings — recorded, not traded.** The 2Y note
ledgers in this calendar run indirect at **57–66%** of competitive accepted with dealers near **12%**;
the FRN runs indirect **65.1%** with dealers at **33.1%** on new issues. Dealer takedown three times the
2Y note's is a structural feature of the instrument, not a weak auction, so the "dealers stuffed → buyers'
strike" tell the note ledgers use **does not port to FRNs at the same thresholds** and should not be read
across. The second contrast is the one that matters on the day: the **2Y note selling 10-26** carries
genuine duration into the 14:00 decision two sessions later; the FRN selling 10-28 does not carry it at
all. Same corridor, same Treasury, opposite exposure — worth stating because a reader who tracks all
four October coupon sales as "supply into the FOMC" gets the FRN exactly backwards.

**9. No tracked name is exposed — SUPPORTED, inherited.** `symbols: []`. The duration channel that hit
CRWV −12.1% and SOX −5% on 2026-08-18 was a long-end move; a 2-year floater indexed to the 13-week bill
sits at the opposite end of the curve from it and transmits nothing into it.

**10. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve **2026-09-04** (the freshest close; 2026-09-05 is a **Saturday**, 09-07 is Labor Day,
next session 09-08): 3-Mo **3.91** (the FRN's index tenor, +2bp on the day) · 2Y **4.37** · 5Y **4.54** ·
7Y **4.65** · 10Y **4.78** · 20Y **5.25** · 30Y **5.24**. **VIX 14.53** (09-04 close, Yahoo `^VIX`;
the week ran 14.51 · 14.43 · 14.92 · 16.34 · 15.20 · 14.32 · 14.53 — one spike on 09-01 and back).
13-week bill investment rate **3.859%** at the 2026-08-31 auction, $92B.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event, and the
answer this doc would give even if the date were confirmed, because no house playbook is rates-keyed.
What the conditions support is three things.

**Read this auction as a spread-setting event, not a supply event.** The 2Y/5Y/7Y notes each price one
tranche and are done. This one writes a coupon formula that ~$86B of paper carries until 2028, and the
number it writes is observable at ~11:35 ET on 10-28 in one field. That is the highest information-per-
observation moment in the whole October rates corridor, and it costs nothing to watch.

**Stop attributing the compression until something explains it.** Three auction-internal candidates —
bidder composition, index level, cover — were tested this session and all three failed. The named
mechanism (bill demand) is not refuted, but it is now known *not* to be visible where it would most
obviously show up. A ledger that keeps repeating "bill demand is compressing the margin" is repeating
`sb0590`'s framing, not a finding, and this doc says so on the record.

**Sequence the two dated checks and read each for one thing.** **2026-09-23** (the reopening, proposed to
the calendar in this PR) — read it for the discount margin only, against the >10.0bp kill switch. Then
**2026-10-28** — read it for the stamped spread and the indirect share, in that order.

### Honest limits

**The auction has not happened; every number about it is a document read.** **The date is `estimate`** —
a tentative schedule is tentative and the confirming primary is the 2026-10-22 announcement itself.
**The $86B figure assumes the two reopenings occur at the $28B grid** on their scheduled dates; the
grid is 20/20 and `sb0590` covers only through October, so November and December sizes are an
extrapolation past the guidance window, not a published number. **The index determination date of
2026-10-26 is modal, not published** — 8 of the last 10, with two counterexamples set a week earlier.
**The mechanism refutation is auction-side only:** bidder-category shares are a coarse proxy, the
categories are Treasury's own reporting buckets rather than economic actors, and a bill-richness story
can be entirely true in the secondary market while invisible in primary allotments. This session did not
price bills against OIS, which is where that story would actually be tested. **`spread` is a published
field taken at face value** — 51/51 and 103/103 are exact identities in Treasury's own data, but the
inference that the field *governs* the coupon rests on how the security works, not on an independent
read of an offering circular. **The percentile recalibration mixes regimes** — the 2014-2016 and
2021-2022 sub-zero prints come from a different bill market than today's, so "the 22nd percentile" is a
distributional fact, not a forecast that the margin can or will go there. **The `closing_time_comp`
field describes past auctions**, and its exceptions are inferred as holiday-week shifts from their dates
rather than from a Treasury statement of policy.

## Stance & kill switches

**Stance (date `estimate`; the schedule row, the size, the timing fields and the full auction record all
primary-sourced 2026-09-05).** This is a **scheduled, unhedgeable, zero-position event whose one durable
output is a number**: the high discount margin printed at ~11:35 ET on 2026-10-28 becomes the coupon
spread on ~**$86B** of 2-Year FRN paper through 2028. No position is or should be taken, and the FOMC
statement 2.5 hours later is **not** a risk to it — the index was locked on 10-26 and the award is
complete before the Committee speaks.

**Three durable outputs beyond the parent's.** (a) **The spread-inheritance identity** — 51/51 and
103/103 — which is what makes a new issue categorically different from a reopening and is new to this
calendar. (b) **The mechanical account of the non-concession**, sourced from the auction's own
`closing_time_comp` and `frn_index_determination_date` fields, which also *sources* the ~11:30 ET slot
this event's calendar entry currently carries as unsourced. (c) **A failed mechanism hunt, reported as a
failure** — indirect share, index level and cover all fail to explain the compression, and the indirect
correlation carries the wrong sign.

**Inherited, not re-registered.** [`FT-treasury-coupon-announcement-2026-10-22-2`](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
already owns the discount-margin prediction for this exact auction and scores 2026-10-29; its kill
switch (>2.0bp above the 09-23 reopening) is adopted here verbatim rather than restated as a second row
against one observation. [`-1`](../forward-tests/treasury-coupon-announcement-2026-10-22.md) owns the
$30B size. The n=8 within-CUSIP FOMC-day result is the parent's measurement and is not re-derived.

**Forward test `FT-treasury-2y-frn-2026-10-28-1` registered**, scoreable **2026-10-29**: the 2026-10-28
new issue's **indirect-bidder share comes in at or below 76.4%** of competitive accepted (the 2021+
new-issue mean 65.1% + 1sd). Base rate **21/23 = 91%**, disclosed — the pass is nearly uninformative and
the test exists **entirely for its fail**: indirect breaking that band at what is likely another
record-tight margin would be the first auction-side evidence *for* the bill-demand mechanism this
session could not find, and would reopen a question this doc otherwise closes.

**Kill switches:**

- **The 2026-09-23 reopening printing a high discount margin above 10.0bp** — the compressed-regime
  premise breaks five weeks early and the four-year-low reading becomes a moment rather than a level.
  Inherited verbatim from the parent.
- **The 2026-10-28 new issue printing indirect above 76.4% of competitive accepted** — the registered
  test's own kill; the mechanism hunt was looking in the right place after all and leg 4 gets re-derived
  rather than patched, before 2027-01-27 draws the same slot.
- **A 2026-10-28 `spread` that does not equal that auction's own `high_discnt_margin`, or an 11-24
  reopening whose `spread` differs from 10-28's** — the 51/51 / 103/103 identity that the whole
  "$86B stamped for two years" frame rests on is not an identity, and legs 1 and 2 fall together.
- **The auction closing at a time other than 11:30 ET on an ordinary week** — the timing chain in leg 3
  is wrong, and with it the mechanical account of why there is no concession.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at or before the
  2026-11-04 refunding, or any off-cycle FRN size action — that sentence binds FRNs and nominal coupons
  together, so it fires on an FRN-only change; the $86B figure and the 11-24/12-23 reopening sizes go
  with it. [`FT-39`](../forward-tests/legacy.md) already measures that channel.
- **The 2026-10-22 announcement not carrying a 2-Year FRN at $30B, or carrying it as a reopening** —
  the event's own premise (a *new issue* on an FOMC day) is wrong and this doc is rebuilt, not amended.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-53 | **Initial research.** **Structural finding, new to this calendar: a new issue's high discount margin IS the note's coupon spread, and its reopenings inherit it — 51/51 and 103/103 across the complete 154-auction series (2014-01-29 → 2026-08-26, `auctions_query` `floating_rate:Yes`, HTTP 200, 532,321 bytes).** 2026-07-29 printed 5.0bp and stamped `spread=0.0500` on BF-2028; the 08-26 reopening printed 5.5bp and still carries 0.0500. So **10-28 stamps a two-year spread on ~$86B** — $30B plus the $28B reopenings the schedule PDF (re-extracted direct, 17,195 bytes, all six FRN rows) puts on **2026-11-24** (a Tuesday, Thanksgiving week) and **2026-12-23**; next new issue **2027-01-27**, which draws an FOMC decision day again. **Timing chain now fully sourced, and it sources the slot this event's calendar entry calls unsourced:** `closing_time_comp` = **11:30 AM** on **137/154** auctions (all 16 `01:00 PM` exceptions are holiday/short weeks); `frn_index_determination_date` = the Monday of auction week on 8 of the last 10 → **2026-10-26** for this one; FOMC statement **14:00 ET** (confirmed, FED). **Index locked D-2, award complete 2.5h before the decision, settlement 11-02** — the parent's measured non-concession (n=8, within-CUSIP, inherited unchanged) is therefore *mechanical*, and a hawkish 14:00 surprise is a mild positive for an 11:30 buyer. **Mechanism hunt — three candidates, three failures.** `sb0590`'s bill-demand story is **not visible in bidder composition**: corr(indirect%, HDM) = **+0.201** (2021+, n=69) → **+0.011** (2025+) — near-zero and the **wrong sign**; five tightest new issues since 2021 average **60.3%** indirect vs **73.0%** for the five widest; the record-tight 07-29 took **63.2%** indirect (mean 65.1%) with dealers at **36.8%** (mean 33.1%). Index level fails too — corr(idx, HDM) **0.830** (2021+) is a ZIRP artifact, **0.302** on 2025+, and across the 05-27 → 08-26 compression (8.9 → 5.5bp) the 13-week index **rose** 3.678 → 3.859 and 13-week supply **rose** $89B → $92B (both wrong-way). Cover adds nothing (**−0.005**, 2025+). **Recalibration:** 5.0bp is the **22nd percentile** of 154 auctions, not an extreme — median 10.3bp, min **−7.5bp** (2022-04-27), **8** prints ≤0bp. "Four-year low" stands; "extreme" does not. **Sizes re-read verbatim from `sb0590`** (75,578 bytes): Sep-26 FRN **28**, Oct-26 FRN **30**, inside *"maintaining nominal coupon **and FRN** auction sizes for at least the next several quarters"* — not re-registered, `FT-…-10-22-1` owns it. **Cross-security note:** FRN dealer takedown **33.1%** vs the 2Y note's ~12%, so the note ledgers' buyers'-strike thresholds do **not** port; and the 10-26 2Y note carries real duration into 10-28 while this FRN carries none — opposite exposure, same corridor. **One test registered, `-1`:** indirect ≤ **76.4%** of competitive accepted, scores 2026-10-29; base rate **21/23 = 91%** disclosed, it exists for the fail. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** payrolls **+162K vs ~55K** (09-04) reversed Waller's 09-03 dovish turn; the 10-28 FOMC is hold-modal (~15–20% conditional hike, cut odds ~0%). **Rates (Treasury par, primary, 09-04 close):** 3-Mo **3.91** · 2Y **4.37** · 5Y **4.54** · 7Y **4.65** · 10Y **4.78** · 20Y 5.25 · 30Y **5.24**. **VIX 14.53** (09-04; week 14.51/14.43/14.92/**16.34**/15.20/14.32/14.53 — 2026-09-05 is a **Saturday**, 09-07 Labor Day, next session 09-08). **Policy:** funding closed through 12-11 (PL 119-103); `sb0607` (08-19) acted on buybacks without touching auction sizes. **Adjacency — 19 tracked entries in the ±5-day corridor; ONE dated event PROPOSED** as `estimate` in this PR: **`treasury-2y-frn-2026-09-23`**, the reopening the parent named and deliberately left unfiled — the only FRN auction between now and this one and the free read on the >10.0bp kill switch. **Discovered and deliberately NOT filed**, named so a later sweep can: the **11-24** and **12-23** reopenings (downstream of this auction; their `spread` is deterministic at 103/103, so a ledger each would re-tread) and the **2027-01-27** new issue (the next decision-day collision, outside every current window). | **Stance set** — zero-position, unhedgeable; the registrable content is the spread-stamping identity and a failed mechanism hunt, not the margin, which the parent's `-2` already owns | 2026-09-26 (medium; D-53 sits in the 31+/21d band → 09-26, one day before days-out crosses 31 on 09-27 and the band tightens to 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`) in the same PR. Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory.
