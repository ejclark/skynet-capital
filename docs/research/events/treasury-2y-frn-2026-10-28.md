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
| 2026-09-28 | D-30 | **Pulse check — the one dated intermediate check has closed, and the kill switch did not fire.** The **2026-09-23** FRN reopening — this doc's own named free read — closed out 2026-09-24 (`docs/research/events/treasury-2y-frn-2026-09-23.md`) at high discount margin **4.0bp**, a fresh series low below 07-29's 5.0bp and 08-26's 5.5bp, `spread` still **0.0500**. Re-verified independently this session, not read from the sibling's memory: `api.fiscaldata.treasury.gov` `auctions_query` (`floating_rate:eq:Yes`, fetched direct today) returns CUSIP 91282CRD5, auction-date 2026-09-23, `high_discnt_margin` **0.040000**, `spread` **0.0500**, `offering_amt` **$28,000,000,000**, `reopening` **Yes**, closing time **11:30 AM** — exact match, no divergence. The **>10.0bp kill switch is comfortably unfired** (4.0bp is 40% of the ceiling), and the 104/104 spread-inheritance identity (leg 1) extends by one more observation. **The schedule is unchanged:** `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf` re-fetched direct today is **byte-identical, 17,195 bytes**, and its 2-Year FRN row for this event still reads `Thursday, October 22, 2026 / Wednesday, October 28, 2026 / Monday, November 02, 2026` with **no `R` marker** — the new-issue premise holds. **Macro since 09-05 — the FOMC leg resolved, and the *next* one now leans the way this doc's mechanism does not depend on:** the Sep 15–16 FOMC hiked 25bp to 3.75–4.00%, unanimous 12-0 (`federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm`, per the sibling [`fomc-2026-09-16`](fomc-2026-09-16.md) close-out); as of **2026-09-27** the *this* event's own FOMC day (Oct 27–28) has its first meeting-scoped market read this calendar has found — Polymarket **65% hike / 34% hold** on a $14.9M book, corroborated by centralbank.watch (CME FedWatch aggregator) at **61.6% hike**, a climb from 54.2% (09-23) → 61.6% (09-25) → 65% (09-27), per the sibling [`fomc-2026-10-28`](fomc-2026-10-28.md) D-31 row. **This raises the odds the 14:00 ET statement is itself a hike, not just a live coin flip — and it changes nothing about this event's mechanism**: the index is determined 10-26, the auction closes 11:30 ET 10-28, both fixed before the Committee speaks regardless of what it decides, so a hike-modal readout sharpens the "mild positive for the 11:30 buyer" framing (leg 3) rather than testing it. **Rates/vol, cross-verified against three same-week sibling primaries** (this session's own Yahoo VIX fetch returned known-stale cached 2025-05 data — the identical failure mode the `fomc-2026-10-28` and `treasury-coupon-announcement-2026-10-01` ledgers already recorded — and a Treasury par-curve CSV fetch returned a truncated January slice rather than the requested tail; both logged below rather than substituted silently): VIX **14.87** (2026-09-25 close), 10-year **5.16–5.20%** (09-25, a fresh multi-week high), Brent **$104.32** (09-25, retesting the $107.63 09-10 cycle peak) — all read from the `fomc-2026-10-28` D-31 row, which itself cross-checked three independent same-week ledgers. No VIX 3-point regime move since the 09-05 baseline (14.53 → 14.87, **+0.34**). **Adjacency sweep, this event's own ±5-day corridor re-pulled today** (`event-scan.mjs --on-date` for every date 10-23 → 11-02): **47 ids now tracked** (up from 19 on 09-05 — calendar densification, not a finding), zero requiring proposal — every one is already a canonical `<id>.json`. `adjacentStrongIds` (confirmed, high/critical, within 5 days): `fomc-2026-10-28`, `gdp-q3-2026-advance-2026-10-29`, `pce-2026-10-29`, `eci-q3-2026-10-30`, `ism-manufacturing-2026-11-02` — unchanged in kind from the sibling FOMC ledger's own read of the same window. Two new **critical**-impact adjacents appeared since 09-05, both still `estimate` and so outside the confirmed-only filter: `goog-2026-10-28-print` and `meta-2026-10-28-print`, same-day mega-cap prints that add nothing to a `symbols: []` rates doc but are named per the sweep's own convention. **No new dated event to propose** — the corridor's growth is entirely entries already on the calendar. **Kill switches, all five checked, none fired:** the 09-23 print (above), the schedule byte-match (above), and no Treasury press release 2026-09-05 → 2026-09-28 touching debt issuance, buybacks, or coupon/FRN sizes (nothing found narrowing or qualifying `sb0590`'s "next several quarters" sentence). The indirect-share and spread-identity switches are not yet scoreable (10-28 has not occurred). | No change — the one dated intermediate check passed clean and the schedule is unchanged; the FOMC's own odds moving to hike-modal sharpens rather than tests the mechanical non-concession read | 2026-10-05 (medium; D-30 sits in the 8-30/7d band) |
| 2026-10-05 | D-23 | **Deterministic screen (no Claude session).** Readings — VIX 15.3 (+0.4pt since last), band unchanged (medium:8+), 48 adjacent event(s) tracked, new in corridor since last pulse: `fomc-2026-10-28` (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-12 |
| 2026-10-12 | D-16 | **Deterministic screen (no Claude session).** Readings — VIX 14.8 (-0.5pt since last), band unchanged (medium:8+), 50 adjacent event(s) tracked, new in corridor since last pulse: `boe-dmp-2026-10-30`, `umich-sentiment-final-2026-10-23` (recorded, not assessed). Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-19 |
| 2026-10-19 | D-9 | **Pulse check (full session; `interval-elapsed`; the screen was material on `vix-regime-change:+5.1pt`, three new strong adjacent events and the staleness ceiling).** **Event tape — nothing moved, and no kill switch has fired.** Tentative Auction Schedule re-fetched direct (home.treasury.gov, HTTP 200): **17,195 bytes, sha256 3b83706a… — byte-identical** to every fetch since 09-05; the `2-Year FRN` row still reads announce 10-22 / auction **10-28** / settle 11-02 with no `R` (new issue), so the entry stays **`estimate`** (tentative schedule; this lane may not self-confirm). fiscaldata `auctions_query` (`floating_rate:eq:Yes`, fetched direct, HTTP 200) returns the same three post-July rows as the 09-28 row: 07-29 new issue **5.0bp** / $30B, 08-26 reopening **5.5bp**, 09-23 reopening **4.0bp**, `spread` **0.0500** on all three (inheritance identity intact: 104/104 reopenings), closing time **11:30 AM**, index determined two days before each auction. No FRN auction has occurred since 09-23, so the indirect-share and identity switches are not scoreable, and the 10-22 announcement (which confirms the $30B and new-issue status) has not happened. **Volatility regime — this is the change.** VIX **19.99** (10-16 close, Yahoo `^VIX`, fetched direct today; 15.41 → 14.84 → 15.21 → 15.27 → 16.87 → 16.46 → 19.99 over 10-08…10-16; 10-16 range 15.72–22.31) vs **14.87** at the 09-28 full row: **+5.1pt**, past the 3-point line; no 10-19 close exists yet. Cause per sibling ledgers (AI-financing credit scare; S&P −1.09%, Nasdaq −2.14% on 10-16): recorded, not re-verified here. **It does not reach this event's mechanism** — an FRN prices as a spread over a locked 13-week bill index, no options are involved, and `symbols: []`. **Rates (home.treasury.gov par CSV, fetched direct today, last print 10-16):** 3-month **4.26** (the index tenor), 2Y **4.74** (4.77 on 10-15), 10Y 5.09, 2s10s 35bp; the front end rallied on the risk-off day rather than selling off; no 10-19 print yet. **Macro surprise:** Sept CPI (10-14) core +0.3% m/m / 2.6% y/y vs ~0.2% / 2.5% expected, headline +0.6% / 3.7%, and PPI final demand +1.3% m/m (via the sibling [`fomc-2026-10-28`](fomc-2026-10-28.md) 10-15 and 10-18 rows; not re-fetched here). **FOMC pricing (Kalshi exchange API `KXFEDDECISION-26OCT`, fetched direct today):** Hold **0.86/0.87**, Hike-25 **0.12/0.13**, cut and >25bp ≤0.01 each — **~86.5% hold**, versus the 65% hike side the 09-28 row cited on 09-27; `-26DEC` Hike-25 **0.72/0.73**, Hold 0.23/0.26. So the 14:00 ET statement is now a lopsided hold with December priced. The mechanism is unchanged (index locked 10-26, award complete by ~11:35 ET before the Committee speaks), and the 09-28 row's hike-modal framing is superseded, not contradicted. **Peers:** `symbols: []`, none. **Geopolitical / policy:** Brent about $110 on 10-16 (sibling ledgers, press-relayed, unverified here); no Treasury issuance, buyback or FRN-sizing action found since 09-28 touching `sb0590`'s "next several quarters" sentence (the 11-04 refunding is not yet announced). **Adjacency sweep:** `event-scan.mjs --on-date=2026-10-28` lists 7 entries (advance economic indicators, FOMC, GOOG print, housing vacancies, MSFT print, this event, UK Autumn Budget) and `--on-date=2026-10-22` lists 5, all already canonical or derived — **nothing to propose**. The screen's three new corridor ids (`msft-2026-10-27-print`, `amzn-2026-10-29-print`, `ism-manufacturing-2026-11-02`) join the strong set (now seven with `eci-q3-2026-10-30`, `fomc-2026-10-28`, `gdp-q3-2026-advance-2026-10-29`, `pce-2026-10-29`); they are same-week equity/macro prints that add nothing to a rates-spread doc. Nothing dated seen beyond the horizon. **Kill switches, all six re-read, none fired** (09-23 print 4.0bp vs the 10.0bp ceiling; spread identity intact on the available rows; 11:30 AM closing time intact; schedule byte-identical; no issuance-guidance change; the 10-22 announcement not yet out). No new forward test: `FT-treasury-2y-frn-2026-10-28-1` (indirect ≤76.4%, score 10-29) stands and the discount-margin call stays with `FT-treasury-coupon-announcement-2026-10-22-2`. | **No change** — a volatility move that bypasses the mechanism, an FOMC swung from hike-modal to hold-modal, and an unchanged schedule and FRN record. Stand aside; the number to watch is still the 10-28 high discount margin against the 4.0bp prior | 2026-10-21 (medium:0+ band, 2d; the 10-22 announcement confirms size and new-issue status) |
| 2026-10-26 | D-2 | **Pulse check (full session; `interval-elapsed`; the screen was material on `days-band-transition:medium:8+->medium:0+` and a new strong adjacent, `goog-2026-10-28-print`).** **Event tape (primary) — the announcement landed and discharges the open premise.** Treasury's offering-announcement record (treasurydirect.gov `TA_WS/securities/announced?type=FRN`, fetched direct today, HTTP 200, 1,063,685 bytes; newest row updated 2026-10-22 11:04 ET): **2-Year FRN, new issue (`reopening: No`), CUSIP 91282CRS2, offering $30,000,000,000**, announced 2026-10-22, issue **2026-11-02**, maturity **2028-10-31**, `spread` blank — as it must be before the auction stamps it. FiscalData `upcoming_auctions` (HTTP 200) agrees: auction **2026-10-28**, issue 11-02, CUSIP 91282CRS2, `Reopening: No`. The structured record leaves the competitive-close field null and I could not read text out of the announcement PDFs, so the ~11:30 ET close still rests on `closing_time_comp` (137/154), not on this announcement. **Kill switch 'announcement not carrying a 2-Year FRN at $30B, or carrying it as a reopening' is discharged (not fired); the $30B size and new-issue status are now primary-confirmed.** The entry flips `estimate` → `confirmed` (`TSY:`) in this PR on that primary — the flip this doc said the announcement would earn, the same one `treasury-2y-note-2026-10-26` took on the same release. Tentative Auction Schedule re-fetched direct, HTTP 200: **17,195 bytes, sha256 3b83706a… — byte-identical** to every read since 09-05. fiscaldata `auctions_query` (`floating_rate:eq:Yes`, direct, HTTP 200): the last three rows are unchanged — 07-29 new issue **5.0bp** / $30B, 08-26 reopening **5.5bp**, 09-23 reopening **4.0bp**, `spread` **0.0500** on all three (identity intact, 104/104), closing time **11:30 AM**, index determined two days before each; indirect share of competitive accepted on those three is **63.2% / 66.6% / 59.1%** (derived from `indirect_bidder_accepted`/`comp_accepted`), all under the 76.4% line of FT-treasury-2y-frn-2026-10-28-1. No FRN auction since 09-23, so no registered test is scoreable yet. **The index is set today:** the 13-week bill auction is on the 10-26 calendar (`upcoming_auctions`), and the Monday-of-auction-week determination date held on 8 of the last 10 FRN auctions, so the rate this note floats off locks two days before the sale; today's 13-week result was not yet out when this row was written, so the index level is not recorded. **Volatility regime:** VIX closes (Yahoo `^VIX`, direct) 19.99 (10-16) → 18.44 → 17.31 → 16.68 → **19.03 (10-22) → 19.45 (10-23)**, **18.23** intraday ~10:16 ET today (screen reading 18.22) vs 19.99 at the last row, **−1.76pt**, inside the 3-point line; it does not reach this event's mechanism (a spread over a locked bill index, no options, `symbols: []`). **Rates (home.treasury.gov par CSV, direct, HTTP 200, last print 10-23), 10-19 → 10-23:** 3-Month **4.27 → 4.22** (the FRN's index tenor) · 2Y **4.77 → 4.69** · 10Y **5.15 → 5.00** · 2s10s 38bp → 31bp; the front end rallied through the 10-22 risk-off session (10Y −17bp that day) rather than sold off, and no 10-26 print exists yet. At the 09-23 fit's own beta (−11bp of margin per 100bp of 2Y–3M slope, `DM = 10.43 − 11.02 × slope`) the 10-23 slope of +47bp implies **~5.2bp**, near the 09-23 print's 4.0bp, so the slope readout does not call a regime break; this is arithmetic on the registered model, not a new test. **Macro / FOMC pricing (Kalshi exchange API `KXFEDDECISION`, direct today):** `-26OCT` Hold **0.93/0.94**, Hike-25 **0.06/0.07**, cut and >25bp hike ≤0.01 each — **~93.5% hold**, versus ~86.5% at the 10-19 row; `-26DEC` Hike-25 **0.74/0.75**, Hold 0.23/0.24 (0.72/0.73 on 10-19). The 14:00 ET statement on 10-28 is a near-certain hold and the mechanism is unchanged: index locked before, award complete ~11:35 ET, FOMC afterwards. No CPI/jobs print since the last row; PCE and Q3 GDP follow on 10-29, after this sale. **Peers:** `symbols: []`, none. **Geopolitical / policy:** no Treasury issuance, buyback or FRN-sizing action found; the `sb0590` 'next several quarters' sentence was not re-read in full this pass, and the 11-04 refunding is still ahead (`treasury-refunding-2026-11-04`, on the calendar). Oil and AI-financing headlines are in the sibling FOMC ledger's 10-22 row (press, not re-verified here). **Adjacency sweep:** `event-scan.mjs --on-date=2026-10-28` lists 7 entries and `--on-date=2026-11-04` lists 6, all already on the calendar — **nothing to propose**; nothing dated seen beyond the horizon. The new strong adjacent `goog-2026-10-28-print` (after the close) and the corridor's MSFT, AMZN, ISM and PCE/GDP rows are same-week equity and macro prints that add nothing to a rates-spread doc. **Kill switches, all re-read, none fired** (09-23 print 4.0bp vs the 10.0bp ceiling; the spread identity intact on the available rows; 11:30 AM closing time intact; schedule byte-identical; no issuance-guidance change found; the announcement carries a 2-Year FRN at $30B as a new issue). No new forward test: `FT-treasury-2y-frn-2026-10-28-1` (indirect ≤76.4%, scores 10-29) stands and the discount-margin call stays with `FT-treasury-coupon-announcement-2026-10-22-2`. | **No change to the stance; the date flips to `confirmed`** — the premise this doc was built on (a $30B new issue on 10-28) is now Treasury's own announced fact. Stand aside; the number to watch is still the 10-28 high discount margin against the 4.0bp prior, and the `spread` it stamps | 2026-10-27 (medium:0+ band, 2d; the auction itself is 10-28 ~11:30 ET) |
| 2026-10-30 | D+2 | **Close-out — the auction printed and is scored in full in `## Outcome`.** Treasury's own result record (treasurydirect.gov `TA_WS/securities/auctioned`, CUSIP 91282CRS2, updated 2026-10-28 11:32:59 ET, HTTP 200): **high discount margin 3.8bp, `spread` 0.038 (identity holds), indirect 71.38% of competitive accepted (registered ≤ 76.4% — `FT-treasury-2y-frn-2026-10-28-1` PASSES), closing 11:30 AM, index 4.050% locked 10-26.** FOMC held 3.75–4.00% at 14:00 ET, 10–2 (Cook, Hammack for a hike) — after the award, as the timing chain said. Not yet scoreable: the 11-24 reopening's spread inheritance (kill switch stays armed) and the fiscaldata `auctions_query` row (not yet published; settles 11-02). No conviction proposals open for this event. | — (close-out; no assessment made beyond the scoring) | — (closed) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`) in the same PR. Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory.

**Last assessed:** 2026-09-28
<!-- probe-ref: {"symbols":{},"vix":14.87,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","ism-manufacturing-2026-11-02","japan-cpi-2026-10-23","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","meta-2026-10-28-print","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23"],"adjacentStrongIds":["fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","eci-q3-2026-10-30","ism-manufacturing-2026-11-02"],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX","status":"stale-cache-2025-05","at":"2026-09-28"},{"url":"https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all","status":"truncated-wrong-slice","at":"2026-09-28"}]} -->

**Last assessed:** 2026-10-05
<!-- probe-ref: {"symbols":{},"vix":15.31,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","ism-manufacturing-2026-11-02","japan-cpi-2026-10-23","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","meta-2026-10-28-print","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23"],"adjacentStrongIds":["eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29"],"screenStreak":1} -->

**Last assessed:** 2026-10-12
<!-- probe-ref: {"symbols":{},"vix":14.84,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","ism-manufacturing-2026-11-02","japan-cpi-2026-10-23","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","meta-2026-10-28-print","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29"],"screenStreak":2} -->

**Last assessed:** 2026-10-19
<!-- probe-ref: {"symbols":{},"vix":19.99,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","dhi-q4-fy2026-2026-10-29","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","ism-manufacturing-2026-11-02","japan-cpi-2026-10-23","japan-cpi-tokyo-flash-2026-10-30","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","tic-shca-annual-final-2026-10-30","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-gilt-auction-short-2026-10-27","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["amzn-2026-10-29-print","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","ism-manufacturing-2026-11-02","msft-2026-10-27-print","pce-2026-10-29"],"screenStreak":0} -->


**Last assessed:** 2026-10-26
<!-- probe-ref: {"symbols":{},"vix":18.22,"daysBand":"medium:0+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","dhi-q4-fy2026-2026-10-29","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","intc-fq3-2026-results-2026-10-29","ism-manufacturing-2026-11-02","japan-cpi-2026-10-23","japan-cpi-tokyo-flash-2026-10-30","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","sp-global-manufacturing-pmi-2026-11-02","sp-global-pmi-commodity-price-supply-2026-11-02","tic-shca-annual-final-2026-10-30","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-gilt-auction-short-2026-10-27","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["amzn-2026-10-29-print","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","ism-manufacturing-2026-11-02","msft-2026-10-27-print","pce-2026-10-29"],"screenStreak":0,"blocked":[]} -->

## Outcome

**Close-out (2026-10-30, D+2 — inside the `closeOutWithinDays: 6` deadline).** Rates mode runs no
`earnings-cycle`/`intraday-edges` instrument (`symbols: []`); the cache was busted anyway per the lane's
standing instruction, though nothing here reads it. "Re-run instrument data" means the executed auction
record, fetched this session: Treasury's result record for CUSIP **91282CRS2**
(`treasurydirect.gov/TA_WS/securities/auctioned?type=FRN`, HTTP 200, row updated 2026-10-28 11:32:59 ET,
results press release `R_20261028_1`), the complete 156-auction series from fiscaldata `auctions_query`
(`floating_rate:eq:Yes`, HTTP 200) for the base rates, Treasury's daily par yield-curve CSV, Yahoo `^VIX`,
and the Fed's own 2026-10-28 statement. **fiscaldata's `auctions_query` did not yet carry the 10-28 row**
(newest row 2026-09-23; its rows land around settlement, 2026-11-02), so the print is read from
TreasuryDirect and the series statistics below append it by hand.

**What printed.**

| Field | 2026-10-28 | Prediction / prior | Result |
|---|---|---|---|
| Offering / reopening flag | **$30,000,000,000 / No** | $30B new issue (announcement 10-22) | **Matches** |
| `high_discnt_margin` | **3.8bp** | 09-23 reopening 4.0bp; 07-29 new issue 5.0bp | **Tightest FRN print since 2022-07-27 (3.7bp); 7th-tightest of 24 new issues since 2021** |
| `spread` (the stamp) | **0.038 (= 3.8bp)** | Must equal the auction's own `high_discnt_margin` | **Identity holds for the new issue (51/51 in fiscaldata's series, plus this print); the reopenings' side is untested until 11-24** |
| Closing time | **11:30 AM ET** | Modal (137/154) | **Matches** |
| Index determination | **2026-10-26 at 4.050%** | Timing chain named this Monday | **Matches; +3.5bp vs the 09-21 reading (4.015%)** |
| Bid-to-cover | **3.05** | 3.37 (07-29 new issue) | recorded, not tested |
| Indirect share (of comp. accepted) | **71.38%** ($21.392B of $29.969B) | ≤ 76.4% (`-1`) | **Inside the band — PASS** |
| Dealer / direct share | **27.95% / 0.67%** | — | recorded; the three sum to 100.0% |
| SOMA add-on (outside the offering) | **$3.334B** | New-issue rollover pattern (11/11 since 2024) | **Holds — 12/12 with this print** |
| FOMC, same day | **Held 3.75–4.00%, 14:00 ET, 10–2 (Cook, Hammack for +25bp)** | Statement after the 11:30 award, 2.5h later | **Timing chain held; the dissents leaned hawkish after the book closed** |

Bidder shares are computed from raw awarded dollars over competitive awarded inside the offering
($29,969,027,100): indirect $21,391,972,100 / dealer $8,377,055,000 / direct $200,000,000. Counting the
$23.6M of indirect noncompetitive awards over total inside-offering awards gives 71.39%, so the
definition does not move the score.

**Scoring the registered forward test — PASS**, scored in full in
[`forward-tests/treasury-2y-frn-2026-10-28.md`](../forward-tests/treasury-2y-frn-2026-10-28.md).
`FT-treasury-2y-frn-2026-10-28-1` predicted indirect would come in at or below 76.4%; it printed
71.38%, **5.0pp inside**. The registration disclosed a 21/23 = 91% base rate, so the pass is
near-uninformative and this test existed for its fail, which did not come.

**What the print adds, honestly stated.** The ledger closed the bill-demand story as *not visible in
bidder composition*. This print does not reopen it, but it is the strongest single point *toward* it that
the series has produced since 2021: a margin 1.2bp tighter than the registration's record-tight 07-29 print
with indirect at **71.4%**, 8.2pp above 07-29's 63.2% and 0.54sd above the 2021+ new-issue mean (9th-highest of
24). Appending it to the same series, corr(indirect%, HDM) since 2021 moves **+0.141 → +0.131** (n=71)
and since 2025 **−0.014 → −0.083** (n=22) on this session's method (the registration's +0.201 / +0.011
used a slightly different sample, so only the before/after pair here is comparable). Still near-zero, still
the wrong sign for the mechanism. One observation does not move a correlation, and the 3.8bp print is
the 7th-tightest new issue, outside the top five, so the five-tightest vs five-widest comparison is
unchanged at **60.3% vs 73.0%** indirect.

**Kill switches, closed out one by one.**

- *2026-09-23 reopening above 10.0bp* — **did not fire** (4.0bp; scored at the 09-28 pulse).
- *2026-10-28 indirect above 76.4%* — **did not fire** (71.38%).
- *10-28 `spread` ≠ that auction's `high_discnt_margin`* — **did not fire** for the first half (0.038 = 3.8bp);
  the second half (the **2026-11-24** reopening inheriting 0.038) cannot be scored before that date and stays
  armed. Its owner is the 11-24 reopening's own ledger once it is on the calendar, not this closed one.
- *Closing time other than 11:30 ET* — **did not fire.**
- *Treasury dropping or qualifying "for at least the next several quarters"* — the **11-04 refunding** is
  still ahead; not scoreable here.
- *Announcement not carrying a $30B 2-Year FRN new issue* — **discharged on 10-26**, and the print confirms it.

**What this changes about the call.** Nothing was actionable and nothing is. The stamped spread of
**3.8bp now governs ~$86B** (this $30B plus the two $28B reopenings Treasury's schedule puts on 2026-11-24
and 2026-12-23) — the same size the ledger wrote, at a spread 1.2bp tighter than the 5.0bp stamp it
had been assuming. Next new issue **2027-01-27** draws an FOMC decision day again; the next
dated checks are the 11-04 refunding, the 11-24 reopening's `spread`, and the 11-02 fiscaldata row.
Market context for the day, recorded not assessed: VIX closed **16.91** on 10-28 and **17.20** on 10-29;
the 2Y par yield was **4.67%** on 10-28 and **4.61%** on 10-29.

**Honest limits.** One auction is n=1 against a series. The 71.38% indirect share is computed from
TreasuryDirect's result record before fiscaldata republishes it; a later restatement is the one thing
that could move the score, and the margin of 5.0pp makes that unlikely to matter.

**Loop census (sense · decide · act · verify · remember).** Scoring was fully mechanical (one API row, one
ratio, one threshold), but **sense** needed a person's pick of source because fiscaldata lags settlement by
five days and the lane's checklist names only that source. A close-out dispatched on D+2 should read
TreasuryDirect's `TA_WS/securities/auctioned` record first. Noted here; no code change made.

**Last assessed:** 2026-10-30 (close-out — the scanner goes quiet on this event from here)
<!-- probe-ref: {"symbols":{},"vix":17.2,"daysBand":"medium:0+","adjacentIds":["aapl-2026-10-29-print","aapl-iphone-duo-launch-2026-10-23","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boe-dmp-2026-10-30","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-trimmed-mean-2026-10-29","dallas-fed-tssos-2026-10-27","dhi-q4-fy2026-2026-10-29","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","intc-fq3-2026-results-2026-10-29","ism-manufacturing-2026-11-02","japan-cpi-2026-10-23","japan-cpi-tokyo-flash-2026-10-30","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","sp-global-manufacturing-pmi-2026-11-02","sp-global-pmi-commodity-price-supply-2026-11-02","tic-shca-annual-final-2026-10-30","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-consumer-confidence-2026-10-23","uk-gilt-auction-short-2026-10-27","uk-pink-book-2026-10-30","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23"],"adjacentStrongIds":["amzn-2026-10-29-print","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","ism-manufacturing-2026-11-02","msft-2026-10-27-print","pce-2026-10-29"],"screenStreak":0} -->
