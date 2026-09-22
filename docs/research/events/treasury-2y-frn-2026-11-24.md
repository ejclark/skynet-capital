# 2-Year Floating Rate Note auction (first reopening of the October new issue) — treasury-2y-frn-2026-11-24

**Kind:** rates · **Date:** 2026-11-24 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed and re-tokenised direct 2026-09-09 — the row reads `2-Year FRN R / Thursday, November 19, 2026 / Tuesday, November 24, 2026 / Friday, November 27, 2026`; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["advance-economic-indicators-2026-11-27","advance-services-q3-2026-11-19","beige-book-2026-11-25","consumer-confidence-2026-11-24","durable-goods-2026-11-25","fhfa-hpi-2026-11-24","fomc-blackout-start-2026-11-28","gdp-q3-2026-second-2026-11-25","japan-cpi-2026-11-20","japan-cpi-tokyo-flash-2026-11-27","new-home-sales-2026-11-25","opex-2026-11-20","pce-2026-11-25","thanksgiving-half-day-2026-11-27","thanksgiving-market-closure-2026-11-26","treasury-10y-tips-2026-11-19","treasury-2y-note-2026-11-23","treasury-coupon-announcement-2026-11-19"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The Thanksgiving framing in this event's own title is the least interesting thing about
it, and two of the three things a lane would guess about it are wrong.** Selling an FRN reopening on
the Tuesday before Thanksgiving is a **twelve-year institution**, not an anomaly — 11 of the 12
Novembers since 2014 did exactly this, and 11 of 12 settled it on the day after Thanksgiving. The
compression **costs nothing**: the clearing margin lands **+0.39bp** from its own stamped spread here
versus **+0.93bp** at the other 92 reopenings (Welch **t = −0.43**), a second independent null on top of
the 7-Year one [the parent announcement measured](treasury-coupon-announcement-2026-11-19.md). What
*is* new, and what this ledger is for, are two mechanical results. **First: the FRN's auction closing
time is a same-day congestion rule, not a holiday rule** — across all 154 FRN auctions, every one of
the **12 days carrying four auctions closed at 1:00 p.m. ET (12/12)** and 137 of the 141 days carrying
three or fewer closed at 11:30 a.m. That explains all 11 Thanksgiving weeks with **zero exceptions**,
where the holiday story gets 3 of 12, and it corrects the sibling ledger's claim that every 1:00 p.m.
print is a holiday week. **2026-11-24 is the only four-auction FRN day the published schedule still has
ahead of it** → **1:00 p.m. ET predicted**, with two free pre-reads (09-23 and 10-28) that predict
11:30. **Second: the index rate is locked 2026-11-16 — three days BEFORE the 11-19 announcement — and
the Monday 11-23 bill that sells the day before this auction does NOT set it**, because Treasury's own
schedule settles that bill on 11-27, the same day as the FRN. Date is `estimate`, `symbols: []`,
nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-76) | **Stand aside** | High | Nothing dated between today and the **2026-09-23** reopening can reach this event. `symbols: []`, the date is `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed, and the $28B reopening size is already published in `sb0590`'s FRN column. | Treasury running an off-cycle FRN action, or revising the tentative schedule's 11-19/11-24/11-27 row, **before 2026-11-19** — the event's shape, not its stance, would be what changed |
| This week | **Watch one dated thing — the 2026-09-23 reopening — as the first free test of the congestion rule** | Medium-high | 09-23 carries **three** auctions (FRN + 5-Year note + 17-week bill), so the rule predicts **11:30 a.m. ET**; the naive holiday rule predicts the same, so a *pass* separates nothing and a *fail* kills the rule 9 weeks early for free. | The **2026-09-23** auction printing `01:00 PM` on a three-auction day — the count rule is dead before this event ever reads it |
| This month | **Watch 2026-10-28 as the second free pre-read; still no position** | Medium-high | 10-28 carries only **two** auctions (FRN + 17-week bill), the sparsest slate in the schedule, and it is also where the sibling ledger's own spread-stamping test resolves. Two auctions has printed 11:30 a.m. **68 of 68 times** since 2014. | The **2026-10-28** new issue printing `01:00 PM` on a two-auction day — 68/68 breaks and the operational half of this ledger is rebuilt, not patched |
| This quarter | **Read 2026-11-24 for its closing time and its index date, NOT for a Thanksgiving concession — the concession is measured and it is a null** | Medium-high | It is the **only four-auction FRN day** in the whole published schedule (09-23 has 3, 10-28 has 2, 12-23 has 3, 2027-01-27 has 2), which makes it the single discriminating observation between the congestion rule (12/12) and the holiday rule (3/12). The demand side is already answered: cover runs lighter in Thanksgiving weeks (**3.045 vs 3.304**, t = −1.66) and it **does not transmit to price**. | The **2026-11-24** auction printing `11:30 AM`, or `frn_index_determination_date` reading **2026-11-23** rather than **2026-11-16** — either kills one of this ledger's two mechanical results outright |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, no house playbook is rates-keyed.
  Zero capital is at stake in anything below.
- **The headline, new to this calendar: the FRN closing time is set by same-day auction COUNT.** Across
  all 154 FRN auctions, four same-day auctions → **`01:00 PM` on 12 of 12**; three or fewer → 11:30 a.m.
  on **137 of 141**. Post-2021-06 the rule is **63 of 64**.
- **It explains the Thanksgiving record exactly, where the holiday story does not.** 2020, 2024 and 2025
  carried four auctions and printed 1:00 p.m.; the other eight Thanksgiving weeks carried two or three
  and printed 11:30 a.m. **11 of 11, no exceptions.** Holiday-week alone gets **3 of 12**.
- **It corrects the sibling ledger on the record.** [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md)
  states every one of the 16 `01:00 PM` prints falls in a holiday or short week. **2024-10-29** is an
  ordinary October Tuesday with four auctions, and **eight** of the sixteen are the 2020-06 → 2021-01
  COVID bill-congestion block. That ledger's 10-28 call (11:30 a.m., ordinary week) survives anyway — the
  reasoning was wrong, the answer right, because two auctions is also the sparse case.
- **The forward calendar the rule writes, all from one PDF:** 09-23 → 3 auctions → **11:30**; 10-28 → 2 →
  **11:30**; **11-24 → 4 → `01:00 PM`**; 12-23 → 3 → **11:30**; 2027-01-27 → 2 → **11:30**.
- **The index is locked 2026-11-16, three days BEFORE the announcement.** Treasury's schedule settles the
  Monday **11-23** 13-week bill on **Friday 11-27** — the same day as this FRN — so it cannot be the
  index; the **11-16** bill (settles 11-19) is. Every one of the 11 Thanksgiving-week FRN auctions has an
  index date exactly **8 days out**, all of them pre-announcement.
- **The trap that follows from it:** a lane reading "the 13-week bill that sold the day before" gets the
  wrong number on 2026-11-24. The bill that matters sold a **week earlier**.
- **The compression is a measured null, twice over.** Margin-minus-stamped-spread **+0.39bp** (n=11, sd
  3.89) vs **+0.93bp** (n=92), Welch **t = −0.43**; on 2021+ it is +1.12bp vs +0.85bp. The parent
  announcement found the same null independently on the 7-Year (b/c 2.572 vs 2.490, n=6).
- **The one non-null, and it does not pay:** bid-to-cover runs **3.045 vs 3.304** all-time and **2.796 vs
  3.170** on 2021+ — fewer bids, same clearing price. Grade the print on the margin, not the cover.
- **Nothing about the Fed is in this corridor.** FOMC lands **10-28** and **12-09**; the index date
  (11-16) and the auction (11-24) both sit between meetings, and the blackout opens **11-28**, after
  settlement. The decision-day story that dominates the 10-28 sibling has no analogue here.
- **The data trap, reproduced:** all 12 November reopenings file as `1-Year 11-Month`, never `2-Year`.
  A `security_term: 2-Year` filter drops this auction silently.
- **Watch (dated):** FRN reopening **09-23** (pre-read #1) · FOMC **09-16** · FOMC **10-28** · FRN new
  issue **10-28** (pre-read #2, stamps the spread this one inherits) · borrowing estimates **11-02** ·
  refunding **11-04** · **index determination 11-16** · **announcement 11-19** · 2Y note **11-23** ·
  **this auction + 5Y note + 52-week + 6-week 11-24** · 7Y note **11-25** · Thanksgiving **11-26** ·
  **settlement + bond early close 11-27** · FOMC blackout **11-28** · second reopening **12-23**
  (proposed to the calendar in this PR) · FOMC **12-09** · next new issue **2027-01-27**.

## Initial research

### The question, plainly

This event reached the calendar as `proposals/treasury-2y-frn-2026-11-24.from-treasury-coupon-announcement-2026-11-19.json`,
read in full before anything else per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), and its
canonical file is written by this session. The proposer's own note is unusually explicit that it
expects to be uninteresting: *"DELIBERATELY REGISTERS NOTHING OF ITS OWN… this proposal exists to give
the auction a calendar row, not to re-litigate a measured question."* The spread-stamping identity
belongs to [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md); the FOMC-concession result
belongs to [`treasury-coupon-announcement-2026-10-22`](treasury-coupon-announcement-2026-10-22.md); the
sizes belong to [`treasury-coupon-announcement-2026-11-19`](treasury-coupon-announcement-2026-11-19.md).

So the question was the narrow one left over: **the title says this auction "settles into the
Thanksgiving early close" — is that a fact about this auction, or is it just what November looks like?
And is anything about the compressed week actually predictable?**

**One-line verdict:** the Thanksgiving framing is the *norm* and the concession it implies is a
**measured null**, but the week does change two mechanical things that ARE predictable from published
documents — the auction's **closing time** (a same-day congestion rule, 12/12, that corrects a sibling
ledger's stated reason) and its **index determination date** (2026-11-16, three days before the
announcement, forced by Treasury's own settlement calendar).

### Method

Rates mode. `symbols: []`, so no symbol-keyed instrument applies — `earnings-cycle.mjs` and
`intraday-edges.mjs` have no target and the mandated cache bust has nothing to bust; recorded rather
than skipped silently. Every number below was fetched from a primary **this session (2026-09-09)** and
derived from scratch, including numbers a sibling ledger already publishes:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**; streams inflated and the text layer rebuilt from Td/Tm coordinates into
  78 visual rows, then re-tokenised into **213 auction records** (security · announcement · auction ·
  settlement), which is what makes a *same-day slate* readable rather than just a single row.
- **The FRN record** — `api.fiscaldata.treasury.gov` `auctions_query`, `floating_rate:Yes`, HTTP 200,
  **532,321 bytes**, **154 auctions** (2014-01-29 → 2026-08-26) — the complete series.
- **The same-day census, which is the new instrument here** — every Treasury auction of every tenor
  since 2014-01-01 in one call, HTTP 200, **691,864 bytes**, **4,639 rows** (2014-01-06 → 2026-09-10),
  grouped by `auction_date`. Nothing in this calendar had joined the FRN series against its own
  auction-day neighbours before.
- **The 13-week bill series** — HTTP 200, **78,244 bytes**, **675 auctions** since 2013-10, used to test
  the index-determination rule and to read the settlement dates that force it.
- **The settlement census** — every security issued 2025-11-20 → 2025-12-05, HTTP 200, to size the
  day-after-Thanksgiving settlement block.
- **The tape** — Treasury's 2026 daily par yield-curve CSV (HTTP 200, 14,042 bytes, running to 09/08)
  and Yahoo `^VIX` daily closes.

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).

### Conviction legs, tested

**1. The FRN's auction closing time is a same-day CONGESTION rule, not a holiday rule — SUPPORTED,
12/12 with zero exceptions, and this is the session's headline.** Joining all 154 FRN auctions against
the 4,639-row same-day census:

| Auctions that day | `11:30 AM` | `01:00 PM` |
|---|---|---|
| 1 | 7 (+1 at `11:00 AM`) | 0 |
| 2 | **68** | 0 |
| 3 | 61 | 4 |
| **4** | **0** | **12** |
| 5 | 1 | 0 |

**Every four-auction day closed the FRN at 1:00 p.m. — 12 of 12, no exception in twelve years.** The
count rule is right on **149 of 154** overall and **63 of 64** since 2021-06. The five exceptions are
named rather than smoothed: four three-auction days that still went 1:00 p.m. (**2014-04-29**,
**2020-12-23**, **2021-01-27**, **2022-07-14**) and one five-auction day that stayed 11:30 a.m.
(**2020-05-27**, whose slate included two 10:00 a.m. COVID-era CMBs).

Why this matters more than a scheduling curiosity: it is the *only* rule that explains the Thanksgiving
record. The eleven Thanksgiving-week FRN reopenings split **9 at 11:30 a.m. / 3 at 1:00 p.m.** — which
is inexplicable if the holiday is the cause, and exact if the count is:

| Year | Auctions that day | Slate | Close |
|---|---|---|---|
| 2014-11-25 | 3 | 5Y · FRN · 4-week | 11:30 AM |
| 2015-11-24 | 3 | 5Y · FRN · 4-week | 11:30 AM |
| 2016-11-22 | 3 | 5Y · FRN · 4-week | 11:30 AM |
| 2017-11-21 | 2 | FRN · 4-week | 11:30 AM |
| 2019-11-26 | 2 | 5Y · FRN | 11:30 AM |
| **2020-11-24** | **4** | 7Y · FRN · 41-day · 118-day | **01:00 PM** |
| 2021-11-23 | 3 | 7Y · FRN · 35-day | 11:30 AM |
| 2022-11-22 | 2 | 7Y · FRN | 11:30 AM |
| 2023-11-21 | 3 | 10Y TIPS R · FRN · 41-day | 11:30 AM |
| **2024-11-26** | **4** | 5Y · FRN · 52-week · 41-day | **01:00 PM** |
| **2025-11-25** | **4** | 5Y · FRN · 52-week · 6-week | **01:00 PM** |

**11 of 11.** And the rival hypothesis a reader reaches for first — "two notes on one day push the FRN
to the afternoon slot" — is refuted here: 2014, 2015, 2016 and 2019 all put the 5-Year note on the same
day at 1:00 p.m. and the FRN still closed at 11:30 a.m.

**This corrects a sibling ledger's stated reason on the record.**
[`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md) says *"every one of the 16 `01:00 PM`
exceptions falling in a holiday or short week."* **2024-10-29** is an ordinary October Tuesday with
four auctions (2Y · 7Y · 52-week · 42-day), and **eight** of the sixteen are the consecutive 2020-06 →
2021-01 block, when Treasury was running 105-day and 154-day CMBs alongside everything else. The 10-28
call itself survives — a two-auction day is the sparse case under either rule — but the *reason*
published there does not, and the reason is what a future lane would generalise from.

**2. The rule writes the whole forward calendar, and this event is its only discriminating observation
— SUPPORTED, read from the schedule PDF's own same-day slates.**

| FRN auction | Same-day slate (from the PDF) | Count | Rule predicts | Holiday rule predicts |
|---|---|---|---|---|
| 2026-09-23 | FRN R · 5-Year NOTE · 17-week bill | 3 | 11:30 AM | 11:30 AM |
| 2026-10-28 | FRN · 17-week bill | 2 | 11:30 AM | 11:30 AM |
| **2026-11-24** | **6-week · 52-week · FRN R · 5-Year NOTE** | **4** | **01:00 PM** | 11:30 AM |
| 2026-12-23 | FRN R · 20-Year BOND R · 17-week bill | 3 | 11:30 AM | 01:00 PM |
| 2027-01-27 | FRN · 17-week bill | 2 | 11:30 AM | 11:30 AM |

Two things fall out. **2026-11-24 is the only four-auction FRN day left in the published schedule** — the
single date where the two rules disagree in the direction the congestion rule claims. And **2026-12-23
is where they disagree the other way**: last year's 12-23 carried four auctions and printed 1:00 p.m.,
this year's carries three, so a holiday reading says 1:00 p.m. and the count rule says 11:30 a.m. That
is a second discriminating observation four weeks later, which is why that auction is proposed to the
calendar in this PR rather than left for a later sweep.

**3. The index rate is locked 2026-11-16, three days BEFORE the announcement, and it is derivable rather
than modal — SUPPORTED, and this upgrades a sibling's honest limit.** Testing rules against the full
154-auction record joined to the 675-auction 13-week bill series, the one that fits is: **the index is
the most recent MONDAY 13-week bill auction whose SETTLEMENT date precedes the FRN's own settlement
date** — **152 of 154**, with both misses named (**2019-01-29**, whose bill slate was shutdown-shifted
to a Tuesday, and **2024-12-24**, a genuine counterexample).

For this auction the rule does not have to be trusted on its base rate, because Treasury's own schedule
forces the answer:

- `13-Week BILL / Thursday, November 19, 2026 / **Monday, November 23, 2026** / **Friday, November 27,
  2026**` — settles the **same day** as the FRN, so it is excluded.
- `13-Week BILL / Thursday, November 12, 2026 / **Monday, November 16, 2026** / Thursday, November 19,
  2026` — settles 11-19, before 11-27. **This is the index.**

The tape agrees independently: all **11** Thanksgiving-week FRN auctions carry an index date exactly
**8 days** before the auction, and **all 11** precede their own announcement date. So the ordering here
is inverted relative to an ordinary month: index **11-16** → announcement **11-19** → auction **11-24**
→ settlement **11-27**. On an ordinary Wednesday auction the index is set *after* the announcement
(2026-08-26: announced 08-20, index 08-24).

[`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md) records as an honest limit that *"the
index determination date … is modal, not published — 8 of the last 10."* For **this** event it is
neither modal nor unpublished: it is implied by two settlement dates Treasury has already printed.

**The trap that follows is the practical output.** A lane that reasons "the FRN's index is the 13-week
bill that sold most recently" will read the **Monday 2026-11-23** auction, one day before this one, and
be wrong by a week. That bill's rate never touches this security.

**4. Selling this reopening into Thanksgiving week is a twelve-year institution, not an anomaly —
SUPPORTED.** Every November since 2014 has an FRN reopening; **11 of the 12** sold on the **Tuesday two
days before Thanksgiving**, and the same 11 settled on the **Friday after Thanksgiving**. The single
exception is **2018-11-28**, a Wednesday, when Thanksgiving fell on the earliest possible date (11-22)
and the month-end block ran the following week. So the calendar title's *"settles into the Thanksgiving
early close"* is true and is also simply what this security does every year — it describes the base
case, not a hazard, and no stance should be built as though the pairing were novel.

**5. The compression extracts no price concession — a measured NULL, and the second one on this week
from a different security.** Controlling within-CUSIP the way the sibling ledgers do (the reopening's
high discount margin minus the spread its own new issue stamped):

| Pool | n | Mean HDM − stamped spread | sd | Bid-to-cover | Indirect |
|---|---|---|---|---|---|
| Thanksgiving-week reopenings | 11 | **+0.39bp** | 3.89 | **3.045** | 53.5% |
| All other reopenings | 92 | **+0.93bp** | 3.96 | **3.304** | 51.8% |
| Welch t | | **−0.43** | | **−1.66** | |

On the 2021+ window it flips sign and stays a null (+1.12bp on n=5 vs +0.85bp on n=41). The parent
announcement reached the same conclusion **independently, on a different instrument** — pre-Thanksgiving
7-Year auctions at b/c 2.572 vs 2.490 (n=6). Two nulls, two securities, one week: recorded as a null so
no future pulse re-derives it, and never as an edge.

**The one thing that is not a null does not pay.** Cover runs consistently lighter in Thanksgiving weeks
(3.045 vs 3.304 all-time; 2.796 vs 3.170 on 2021+, t = −1.66, short of conventional significance at
n=11) while the clearing margin does not move at all. Fewer bids, same price — which is the honest
refinement of the sibling's *"grade a print on composition, never on level"*: here composition moves and
level does not, so a composition-only read of this auction will manufacture a concession that the price
denies.

**6. The settlement day is the fortnight's largest, and that too is routine — SUPPORTED, measured.**
Every security issued around last year's Thanksgiving:

| Settlement | Securities | Total accepted |
|---|---|---|
| 2025-11-20 (Thu) | 3 | $270.5B |
| 2025-11-25 (Tue) | 3 | $274.7B |
| **2025-11-28 (Fri, bond early close)** | **6** | **$358.8B** |
| 2025-12-01 (Mon) | 4 | $221.8B |
| 2025-12-04 (Thu) | 3 | $244.4B |

The day-after-Thanksgiving half-day carried **$358.8B across six securities**, ~31% more than the
next-largest day in the surrounding fortnight — and the FRN reopening was one of them, filed as
`1-Year 11-Month R` at $28B. For 2026 the schedule puts **five** securities on 11-27: 13-week, 26-week,
6-week and 52-week bills plus this FRN. The three note legs of the same announcement settle Monday
11-30 instead. Recorded as scale, not as a signal — an operational concentration on a
[SIFMA-recommended 2:00 p.m. ET bond close](thanksgiving-half-day-2026-11-27.md) that has recurred
annually for a decade with no measurable price consequence in leg 5.

**7. No Fed channel exists in this corridor at all — SUPPORTED.** FOMC meetings land **2026-10-28** and
**2026-12-09** ([`fomc-2026-10-28`](fomc-2026-10-28.md), [`fomc-2026-12-09`](fomc-2026-12-09.md)); the
index date, the announcement, the auction and the settlement all fall between them, and the blackout
opens **2026-11-28**, after settlement. The decision-day pairing that dominates the 10-28 sibling — and
the FOMC-concession result the 10-22 parent measured at n=8 — simply has no analogue here, and this
ledger claims neither.

**8. The `security_term` trap, reproduced independently — SUPPORTED.** All **12** November FRN
reopenings file under `security_term: 1-Year 11-Month`, never `2-Year`; a second reopening files as
`1-Year 10-Month`. A `2-Year` filter drops **46 of the 154** auctions in the series silently. The
proposal carried this inherited from the 10-28 ledger; it is confirmed here from the raw record.

**9. No tracked name is exposed — SUPPORTED, inherited.** `symbols: []`. A two-year floater indexed to
the 13-week bill sits at the opposite end of the curve from the long-end duration channel this
calendar's equity ledgers care about, and transmits nothing into it.

**10. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve **2026-09-08** (the freshest close in the 2026 CSV): 3-Mo **3.94** (the FRN's index
tenor, +3bp vs the 09-04 close) · 2Y **4.39** · 5Y **4.57** · 7Y **4.68** · 10Y **4.80** (the 2026 high)
· 20Y **5.26** · 30Y **5.25**. **VIX 15.72** (2026-09-08 close; the feed had posted no 09-09 bar at
fetch time, and 09-07 was Labor Day). The 13-week bill auctioned **2026-09-08** (a Tuesday, shifted by
Labor Day) at a **3.800%** high discount rate / 3.890% investment rate on **$92B**, up from 3.770% on
08-31 — the index tenor is drifting *up* into this event, which is the direction that historically
widens rather than compresses the margin.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event, and the
answer this doc would give even if the date were confirmed, because no house playbook is rates-keyed.
Three things it does support:

**Read this auction as the calendar's one test of a rule, not as a Thanksgiving story.** The demand
question is answered twice over and is a null. The open question is whether the FRN's closing time is
governed by congestion or by the holiday, the two rules disagree only here, and the observation costs
nothing to make: one field, published at ~1:05 p.m. ET on 2026-11-24.

**Take the two free pre-reads before spending anything on this event.** 2026-09-23 (three auctions) and
2026-10-28 (two auctions) both predict 11:30 a.m. under either rule, so neither can confirm the
congestion rule — but either printing 1:00 p.m. kills it outright, nine and four weeks early
respectively. That asymmetry is the whole reason they are worth watching.

**Fix the index date in the calendar's head now, before the announcement makes it confusing.** On
2026-11-19 Treasury will announce an auction whose index rate was already set three days earlier, and
on 2026-11-23 it will sell a 13-week bill that looks like the index and is not. Both are cheap mistakes
to avoid once written down and expensive to notice live.

### Honest limits

**The auction has not happened; every number about it is a document read.** **The date is `estimate`** —
a tentative schedule is tentative and the confirming primary is the 2026-11-19 announcement itself. The
prefix taxonomy in `market-events-data.ts` does carry a `TSY:` slot for *"treasury.gov /
treasurydirect.gov auction schedule"*, which a reader may reasonably think licenses `confirmed`; it is
deliberately not taken, on the standing rule that this lane does not self-confirm an event it discovered
in-sweep, and because the source is the *tentative* schedule rather than an announcement. **The
congestion rule is a correlation over Treasury's published closing times, not a policy Treasury has
stated** — no Treasury document naming a four-auction threshold was read this session, the five
exceptions are unexplained rather than accounted for, and 12 four-auction days is a small n even at
12/12. It is also not causal: auction count may be a proxy for something else (settlement load, staffing
around holidays) that happens to move together with it. **The index-determination rule is inferred from
152/154, not read from 31 CFR 356** — the 2024-12-24 counterexample is a real miss with no story, and
this session did not read the FRN offering circular that governs the field. The **specific** prediction
for 2026-11-24 rests on firmer ground than the rule (two settlement dates in Treasury's own PDF), but
it inherits the rule's exposure if the settlement-precedence reading is simply wrong. **The concession
null is n=11 in the Thanksgiving pool and n=5 since 2021** — an effect smaller than ~3bp would not be
detectable at that sample, so "no concession" means "none large enough to see," not "exactly zero."
**The cover gap is reported at t = −1.66 and is not significant**; it is recorded because it is
consistent across both windows, not because it is established. **The $358.8B settlement figure is
2025's**, used as the measured precedent for a 2026 slate read from a tentative schedule. **The
`closing_time_comp` and `frn_index_determination_date` fields are taken at face value** as Treasury's
own record of what happened, which they are, but they describe past auctions and no field in this
dataset states a forward rule.

## Stance & kill switches

**Stance (date `estimate`; the schedule row, the same-day slates, the full auction record, the bill
series and the settlement census all primary-sourced 2026-09-09).** This is a **scheduled, unhedgeable,
zero-position event** whose Thanksgiving framing is the routine part and whose interesting content is
mechanical. No position is or should be taken. The demand question the title implies is **answered and
is a null** — twice, on two securities. The two live claims are: the auction will close at **1:00 p.m.
ET** (four-auction day; 12/12 base rate; the only date in the schedule where the congestion and holiday
rules disagree in this direction), and its index rate is fixed on **2026-11-16**, three days before its
own announcement, by the 13-week bill that settles 11-19 rather than the one that sells 11-23.

**Two durable outputs beyond the siblings'.** (a) **The congestion rule** — four same-day auctions →
1:00 p.m., 12/12 — which is new to this calendar, explains all 11 Thanksgiving weeks where the holiday
story explains 3, writes a forward closing-time calendar from one PDF, and **corrects the reason
published in [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md)** (that ledger's 10-28
answer stands; its stated cause does not). (b) **The index-date derivation** — the settlement-precedence
rule at 152/154, and for this event forced outright by two dates in Treasury's own schedule, which
upgrades that same sibling's *"modal, not published"* limit for this date and names the
sells-the-day-before trap that follows.

**Inherited, not re-registered.** The spread-inheritance identity (51/51 and 103/103) and the
discount-margin curve-slope model belong to
[`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md); the $28B size belongs to
[`FT-treasury-coupon-announcement-2026-11-19-1`](../forward-tests/treasury-coupon-announcement-2026-11-19.md)
and `sb0590`'s published FRN column; the FOMC-day non-concession belongs to
[`treasury-coupon-announcement-2026-10-22`](treasury-coupon-announcement-2026-10-22.md) at n=8. None is
re-derived here and none is re-registered.

**Three forward tests registered** in [this event's own fragment](../forward-tests/treasury-2y-frn-2026-11-24.md),
all scoreable **2026-11-25**, all zero-capital: **`-1`** the closing time reads `01:00 PM` (the
discriminating test — the congestion rule and the holiday rule make *opposite* predictions here, which
is why it is worth registering despite a 12/12 base rate); **`-2`** `frn_index_determination_date`
reads **2026-11-16**, not 2026-11-23; **`-3`** the clearing margin lands within **±4.0bp** of the
spread 2026-10-28 stamps — the Thanksgiving null, forward-scored, base rate **8/11** disclosed.

**Kill switches:**

- **The 2026-09-23 reopening printing `01:00 PM` on a three-auction day, or the 2026-10-28 new issue
  printing `01:00 PM` on a two-auction day** — the congestion rule dies nine or four weeks early, for
  free, and legs 1 and 2 are rebuilt rather than patched. `2 auctions → 11:30` is currently 68/68.
- **The 2026-11-24 auction printing `11:30 AM`** — `-1`'s own kill; four-auction days go to 12/13 wrong
  and the holiday framing this ledger demotes was the better read after all.
- **The 2026-12-23 reopening printing `01:00 PM` on a three-auction day** — the second discriminating
  observation, in the direction that would rescue the holiday story; it fires even if 11-24 passes.
- **`frn_index_determination_date` on 2026-11-24 reading anything other than 2026-11-16** — the
  settlement-precedence rule is wrong, and the "index is locked before the announcement" ordering that
  makes leg 3 interesting goes with it.
- **The 2026-11-24 margin landing more than 4.0bp from the spread 2026-10-28 stamps** — the
  Thanksgiving null is not a null in the current regime, and both this ledger's leg 5 and the parent's
  independent 7-Year null need re-derivation before 2027's block.
- **Treasury revising the 11-19 / 11-24 / 11-27 schedule row, moving the 5-Year note or either bill off
  2026-11-24, or running an off-cycle FRN action** — the same-day slate is the input to every call above,
  so a slate change of any kind invalidates the closing-time prediction before the auction happens.
- **The 2026-11-19 announcement not carrying a 2-Year FRN reopening at $28B** — the event's premise is
  wrong and this doc is rebuilt, not amended.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-76 | **Initial research. Canonical file written by this session** — the event existed only as `proposals/treasury-2y-frn-2026-11-24.from-treasury-coupon-announcement-2026-11-19.json`, read in full first per EVENT-RESEARCH.md; schedule row re-derived independently and **confirmed unchanged** (`2-Year FRN R / Thu Nov 19 / Tue Nov 24 / Fri Nov 27`, PDF plain curl HTTP 200 17,195 bytes, re-tokenised into **213 auction records** this session). **HEADLINE, NEW TO THIS CALENDAR: the FRN's auction closing time is a SAME-DAY CONGESTION rule, not a holiday rule.** Joining all **154** FRN auctions (`auctions_query floating_rate:Yes`, HTTP 200, 532,321 bytes) against a **4,639-row same-day census of every Treasury auction since 2014** (HTTP 200, 691,864 bytes — a join this calendar had never made): **4 same-day auctions → `01:00 PM` on 12 of 12, no exception**; ≤3 → 11:30 a.m. on **137 of 141**; overall **149/154**, and **63/64** post-2021-06. Exceptions named, not smoothed: 2014-04-29, 2020-12-23, 2021-01-27, 2022-07-14 (three-auction days at 1 p.m.) and 2020-05-27 (five-auction day at 11:30). **It explains all 11 Thanksgiving-week reopenings with ZERO exceptions** — 2020/2024/2025 carried four auctions and printed 1 p.m.; the other eight carried two or three and printed 11:30 — where the holiday story gets **3 of 12**. The "two notes push it late" rival is refuted: 2014/2015/2016/2019 all had the 5Y at 1 p.m. on the same day and the FRN still closed 11:30. **CORRECTS A SIBLING ON THE RECORD:** [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md) states all 16 `01:00 PM` prints fall in holiday/short weeks — **2024-10-29 is an ordinary October Tuesday with four auctions**, and **eight** of the sixteen are the 2020-06→2021-01 COVID CMB block; that ledger's 10-28 *answer* survives (two auctions is also sparse), its stated *cause* does not. **Forward calendar the rule writes, from the PDF's own same-day slates:** 09-23 → 3 → 11:30 · 10-28 → 2 → 11:30 · **11-24 → 4 → `01:00 PM`** · 12-23 → 3 → 11:30 · 2027-01-27 → 2 → 11:30. **11-24 is the ONLY four-auction FRN day left in the schedule**, i.e. the single date where the two rules disagree this way; **12-23 is where they disagree the other way** (2025-12-23 had four and printed 1 p.m.). **SECOND MECHANICAL RESULT — the index rate is locked 2026-11-16, THREE DAYS BEFORE the 11-19 announcement.** Rule fitted against the **675-auction** 13-week bill series (HTTP 200, 78,244 bytes): index = the most recent **Monday** 13-week bill whose **settlement precedes the FRN's settlement**, **152/154** (misses: 2019-01-29 shutdown-shifted, 2024-12-24 unexplained). Here it is forced by Treasury's own PDF rather than a base rate — the Mon **11-23** bill settles **Fri 11-27**, the *same day* as this FRN, so it is excluded; the **11-16** bill (settles 11-19) is the index. Tape agrees: **11 of 11** Thanksgiving-week FRN auctions carry an index date exactly **8 days** out and **all 11 precede their own announcement**. **This upgrades that sibling's "modal, not published" limit for this date, and names the trap: the 13-week bill selling the day before this auction does NOT set its index.** **THIRD — the Thanksgiving concession is a MEASURED NULL, the second on this week from a different security.** Within-CUSIP (HDM − own stamped spread): Thanksgiving reopenings **+0.39bp** (n=11, sd 3.89) vs **+0.93bp** (n=92), Welch **t = −0.43**; 2021+ **+1.12** (n=5) vs **+0.85** (n=41). Corroborates the parent announcement's independent 7Y null (b/c 2.572 vs 2.490, n=6). **The one non-null does not pay:** cover **3.045 vs 3.304** all-time and **2.796 vs 3.170** on 2021+ (t = −1.66) with the margin unmoved — fewer bids, same price, so a composition-only read manufactures a concession the price denies. **FOURTH — the slot is a 12-year institution, not an anomaly:** 11 of the 12 Novembers since 2014 sold this reopening on the Tuesday two days before Thanksgiving and settled it the Friday after (2018-11-28 the sole exception, Thanksgiving at its earliest 11-22). **Settlement scale measured:** 2025-11-28 carried **$358.8B across six securities** vs $274.7B next-largest in the surrounding fortnight; 2026-11-27 carries five (13-wk, 26-wk, 6-wk, 52-wk, this FRN) while the three note legs settle 11-30. **`security_term` trap reproduced from raw:** all 12 November reopenings file `1-Year 11-Month`; a `2-Year` filter drops **46 of 154**. **No Fed channel exists here** — FOMC 10-28 and 12-09 bracket the whole chain, blackout opens 11-28 after settlement; the 10-28 sibling's decision-day story has no analogue and is not claimed. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** nothing in the 09-09 corridor (30Y auction 09-10, CPI 09-11, FOMC 09-16) reaches a November auction; the dates that do are 10-22 → 11-02 borrowing estimates → 11-04 refunding → 11-19 announcement. **Volatility: VIX 15.72**, the **2026-09-08 close** — no 09-09 bar posted at fetch time, and 09-07 was Labor Day; +1.19 vs the 09-04 close 14.53, inside threshold. **Rates (Treasury par CSV, 09/08):** 3-Mo **3.94** · 2Y **4.39** · 5Y **4.57** · 7Y **4.68** · 10Y **4.80** (2026 high) · 20Y 5.26 · 30Y 5.25; the **2026-09-08** 13-week bill (Labor-Day-shifted to Tuesday) printed **3.800%** high discount on $92B, up from 3.770% on 08-31 — the index tenor drifting the direction that historically *widens* the margin. **Corridor: 18 tracked entries within ±5 days.** **ONE dated adjacent event PROPOSED as `estimate` in this PR: `treasury-2y-frn-2026-12-23`**, the second reopening of the same CUSIP, untracked and unproposed anywhere until now, and the second discriminating observation for the congestion rule (three auctions → predicts 11:30, against last year's four → 1 p.m.). **Deliberately NOT proposed:** `treasury-5y-note-2026-11-24`, `treasury-7y-note-2026-11-25` and `sifma-bond-early-close-2026-11-27` (already proposed by sibling lanes), and `treasury-2y-frn-2027-01-27` (outside every window, and the 10-28 ledger already named it). The four bill legs are not filed at all — this calendar tracks no bill auction of any tenor and inventing that class inside a sweep would be a scope decision, not a discovery. **`FT-…-11-24-1`** (closing time `01:00 PM`), **`-2`** (index date 2026-11-16) and **`-3`** (margin within ±4.0bp of the 10-28 stamp) registered, all scoring 2026-11-25. **All sources HTTP 200; nothing blocked.** | **Stance set** — zero-position; the Thanksgiving framing is the routine part and its concession is a null measured twice, while the registrable content is two mechanical results: a **congestion rule** for the closing time (12/12, correcting a sibling's stated cause) and a **derived index date of 2026-11-16** that precedes this event's own announcement | 2026-09-30 (medium; D-76 sits in the 31+/21d band, and days-out does not cross 31 until 2026-10-24) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-2y-frn-2026-11-24.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
