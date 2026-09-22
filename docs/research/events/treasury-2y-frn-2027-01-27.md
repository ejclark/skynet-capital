# 2-Year Floating Rate Note auction (new issue) — treasury-2y-frn-2027-01-27

**Kind:** rates · **Date:** 2027-01-27 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer inflated and re-tokenised direct 2026-09-09 — the row reads `2-Year FRN / Thursday, January 21, 2027 / Wednesday, January 27, 2027 / Monday, February 01, 2027`, with **no** trailing `R`, which the PDF's own legend defines as the reopening marker; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-01-22","boj-summary-of-opinions-2027-02-01","consumer-confidence-2027-01-26","fhfa-hpi-2027-01-26","fomc-2027-01-27","ism-manufacturing-2027-02-01","japan-cpi-2027-01-22","japan-cpi-tokyo-flash-2027-01-29","norway-gpfg-bond-expert-group-2027-01-25","treasury-2y-note-2027-01-25","treasury-5y-note-2027-01-26","treasury-7y-note-2027-01-28"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This event's own proposal registered a decision-day demand premium that does not survive
controlling for the year, and killing it is the most useful thing this ledger does.** The proposer
measured FRN new issues selling on an FOMC decision day at **bid-to-cover 3.363 vs 3.096** — "higher,
not lower." Re-derived from scratch this session the pooled gap is *bigger* (**3.543 on n=18 vs 3.143
on n=33, Welch t = +2.32**, still +2.23 after dropping the 5.67 outlier) — and **year-demeaned it
collapses to t = +0.63**, with the tail gap going from t = −1.57 to **t = −1.02**. Both are nulls. The
cause is composition, not policy: **2014–15 put 7 of 8 new issues on decision days at covers of 4.50 and
3.64, while 2018–20 and 2024 put 0 of 16 on one at 3.29 / 2.72 / 3.19 / 3.29.** Pooling those eras is
Simpson's paradox. What *is* real is structural. **The collision is a weekday artifact and it is total:
all 18 decision-day new issues were Wednesdays; none of the 10 Tuesday new issues was, and 9 of those 10
sold exactly one day BEFORE a decision; only 1 of 103 reopenings ever collided at all** — so 27 of 51
new issues (53%) sit on the decision day or its eve, decided purely by which weekday Treasury assigns
inside the month-end note week. And the fact worth more than the FOMC framing: **this is the
spread-stamping auction** — at a new issue the clearing margin *is* the spread (identical on all 51),
and **103 of 103 reopenings inherit their own new issue's spread**, so whatever clears here is the
coupon both 2027 reopenings carry for the life of the note. Mechanically: slate of **two** → **11:30
a.m. ET**; index **2027-01-25**; size **$30B**. Date is `estimate`, `symbols: []`, nothing here is a
trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-140) | **Stand aside** | High | Nothing dated between today and the **2026-10-28** new issue can reach a January 2027 auction. `symbols: []`, the date is `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed, and the size is already implied by `sb0590`'s FRN column at $30B in new-issue months. | Treasury revising the tentative schedule's `2027-01-21 / 01-27 / 02-01` row, or adding an `R` to it — the event's shape, not its stance, would be what changed |
| This week | **Watch nothing here; the next FRN datapoint is 2026-09-23 and it belongs to a sibling** | High | The 09-23 reopening is a three-auction day that predicts 11:30 a.m. under every rule on the shelf and inherits the 08-26 spread; it cannot inform this new issue's spread, cover or close. Reading it as a pre-read for January would be borrowing a reopening's answer for a new issue's question. | The **2026-09-23** reopening printing a spread different from the one its own new issue stamped — the 103/103 inheritance identity this ledger's whole spread-stamping leg rests on breaks nine weeks early, for free |
| This month | **Watch one dated thing — the 2026-10-28 new issue — as the only true pre-read this event has** | Medium-high | 10-28 is the *same security class on the same slot*: a two-auction day, a new issue, one quarter earlier. It is the free test of every mechanical claim below (11:30 a.m. close on a two-auction day, 27/27; $30B; a tail inside the recent envelope) before January makes any of them expensive to be wrong about. | The **2026-10-28** new issue printing `01:00 PM` on a two-auction day, or an offering amount other than **$30B** — either kills a leg here four weeks after it was written and three months before it is scored |
| This quarter | **Read 2027-01-27 for the spread it STAMPS, not for the FOMC decision two and a half hours later — the decision-day effect is measured and it is a null** | Medium-high | The spread that clears is inherited unchanged by both 2027 reopenings (103/103), which is a durable fact about the next nine months of this security; the decision-day premium is a year-composition artifact (t = +2.32 pooled → **+0.63 year-demeaned**, positive in 3 of 8 years). An FRN's coupon resets weekly to the 13-week bill, so a policy decision after the close changes the index path the coupon already tracks — which is the mechanism the null is consistent with. | The **2027-01-27** print landing outside the last-twelve-new-issue envelope on tail (**> 0.030**) or cover (**< 2.69**) — the decision-day null would not hold in the current regime and the proposal's premium would deserve re-derivation rather than the correction filed here |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, no house playbook is rates-keyed.
  Zero capital is at stake in anything below.
- **The correction, and this ledger's headline: the decision-day demand premium is a Simpson's-paradox
  artifact.** Pooled **3.543 (n=18) vs 3.143 (n=33), t = +2.32**; **year-demeaned t = +0.63**. Tail:
  pooled t = −1.57 → **year-demeaned t = −1.02**. Within-year the cover difference is positive in **3 of
  8** years, mean +0.098.
- **The composition that produces it, stated so nobody re-derives the mistake:** 2014 **3/4** and 2015
  **4/4** of new issues on decision days at mean covers **4.50** and **3.64**; 2018 / 2019 / 2020 / 2024
  **0/4 each** at **3.29 / 2.72 / 3.19 / 3.29**.
- **The collision is a weekday artifact, total in both directions.** **18 of 18** decision-day new issues
  are Wednesdays (18 of 40 Wednesdays, 45%); **0 of 10** Tuesdays, and **9 of those 10** sold exactly one
  day before a decision (2024-10-29 the lone exception, +9d). **1 of 103** reopenings ever collided.
- **Why the calendar does that:** all **51** new issues fall in January / April / July / October
  (13/13/13/12), inside the month-end 2Y–5Y–7Y note week — the same last week the FOMC uses for its
  Jan/Apr/Jul/Oct meeting. In 2027 the note ladder is 2Y Mon **01-25** · 5Y Tue **01-26** · **FRN Wed
  01-27** · 7Y Thu **01-28**.
- **The structural fact worth more than the FOMC framing: this is the SPREAD-STAMPING auction.** At a new
  issue `high_discnt_margin` **is** `spread` (identical on all 51), and **103 of 103** reopenings carry
  their own new issue's spread. Both 2027 reopenings inherit whatever clears here.
- **Closing time: `11:30 AM` predicted** — two-auction slate (this FRN + a 17-week bill, from the PDF's
  own rows). Two-auction new issues are **27/27** at 11:30; all FRN two-auction days **68/68**. A
  decision day does not move it either: **18 of the 19** decision-day FRN auctions closed 11:30 a.m.
- **Index rate: 2027-01-25**, the Monday 13-week bill that settles 01-28, before this FRN's 02-01.
  Settlement-precedence rule **152/154** overall and **125/125 on Wednesday auctions** — both misses are
  Tuesday auctions.
- **The ordering is the ORDINARY one, and that is the trap here.** Index **01-25** falls *after* the
  **01-21** announcement. A lane inheriting
  [`treasury-2y-frn-2026-11-24`](treasury-2y-frn-2026-11-24.md)'s "index locked before the announcement"
  framing has it backwards for this date.
- **MLK is a trap that isn't.** The 2027-01-18 holiday shifts that week's bill slate to Tuesday 01-19,
  but 01-25 is a later Monday, so the index is untouched. Worth stating because both historical misses
  of the index rule are holiday/shutdown-shifted Tuesdays.
- **Size $30B**, 10 of the last 10 since 2024-04-24. Inheriting the 2026-11-19 sibling's **$28B**
  reopening figure would be wrong by $2B.
- **Settlement is 2027-02-01, five days out**, with the month-end note block rather than at T+2 — the
  modal January gap (5 days in 2015, 2016, 2021, 2022, 2026).
- **The one-year analog, row for row:** **2026-01-28** — Wednesday, decision day, two-auction slate,
  `11:30 AM`, spread **0.099**, cover **3.16**, tail **0.014**, indirect **61.4%**.
- **Watch (dated):** FRN reopening **2026-09-23** · FOMC **2026-09-16** · **FRN new issue 2026-10-28**
  (the only true pre-read) · FOMC **2026-10-28** · reopening **2026-11-24** (the sibling's four-auction
  discriminator) · reopening **2026-12-23** · FOMC **2026-12-09** — the meeting that confirms the 2027
  FOMC calendar · **announcement 2027-01-21** · **index determination 2027-01-25** · 2Y note
  **2027-01-25** · 5Y note **2027-01-26** · **this auction + FOMC decision 2027-01-27** · 7Y note
  **2027-01-28** · **settlement 2027-02-01**.

## Initial research

### The question, plainly

This event reached the calendar as
`proposals/treasury-2y-frn-2027-01-27.from-treasury-coupon-announcement-2027-01-21.json`, read in full
before anything else per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), and its canonical file
is written by this session. Unusually for a proposal, it does not merely give the auction a calendar
row — it **registers a finding**: that FRN new issues land on an FOMC decision day 15 times in 47 while
only 1 of 95 reopenings ever has, and that *"the 15 that sold on a decision day averaged [bid-to-cover]
3.363 against 3.096 for the other 32 — higher, not lower."*

So the question was the one the proposal itself put on the table: **does selling a floating-rate new
issue two and a half hours before a policy decision actually do anything to the auction — and is the
demand premium the proposer measured real?**

**One-line verdict:** the collision is real, structural and fully explained by the auction weekday, but
the demand premium is **not** — it is a composition artifact of the auction calendar's own eras, and
year-demeaning kills it (t = +2.32 → **+0.63**); the durable content of this auction is that it **stamps
the spread** both 2027 reopenings inherit.

### Method

Rates mode. `symbols: []`, so no symbol-keyed instrument applies — `earnings-cycle.mjs` and
`intraday-edges.mjs` have no target and the mandated cache bust has nothing to bust; recorded rather
than skipped silently. Every number below was fetched from a primary **this session (2026-09-09)** and
derived from scratch, including numbers the proposal and the sibling ledgers already publish:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**; 4 streams inflated, the text layer rebuilt from Tm/Td coordinates and
  re-tokenised into **213 auction records** with the reopening flag preserved as a distinct token, which
  is what makes the missing `R` checkable rather than quoted.
- **The FRN record** — `api.fiscaldata.treasury.gov` `auctions_query`, `floating_rate:Yes`, HTTP 200,
  **532,321 bytes**, **154 auctions** (2014-01-29 → 2026-08-26): **51 new issues, 103 reopenings**.
- **The same-day census** — every Treasury auction of every tenor since 2014-01-01, HTTP 200,
  **1,004,514 bytes**, **4,639 rows** (2014-01-06 → 2026-09-10), grouped by `auction_date`.
- **The 13-week bill series** — HTTP 200, **502,593 bytes**, 2,437 auctions, used to fit and test the
  index-determination rule.
- **The FOMC record** — `federalreserve.gov/monetarypolicy/fomccalendars.htm` (HTTP 200, 164,831 bytes,
  page last updated 2026-08-19) plus `fomchistorical2014` … `fomchistorical2020` (all HTTP 200), parsed
  by the `monetaryYYYYMMDDa.htm` statement-release URLs into **107 decision dates** (2014-01-29 →
  2026-07-29, including the five unscheduled 2020 actions, none of which coincides with an FRN auction).
  The same page publishes the 2027 calendar this event depends on.
- **The tape** — Treasury's 2026 daily par yield-curve CSV (HTTP 200, 14,042 bytes, running to 09/08)
  and Yahoo `^VIX` daily closes.

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).

### Conviction legs, tested

**1. The proposal's decision-day demand premium is REFUTED once the year is controlled — this is the
session's headline.** Splitting the 51 new issues on whether `auction_date` is one of the 107 decision
dates reproduces the proposer's direction and then some:

| Metric | Decision day (n=18) | Other (n=33) | Welch t |
|---|---|---|---|
| Bid-to-cover | **3.543** | 3.143 | **+2.32** |
| Tail (`high_discnt_margin` − `avg_med_discnt_margin`) | **0.0111** | 0.0152 | −1.57 |
| Indirect share | 53.6% | 52.3% | +0.39 |
| Primary-dealer share | 39.8% | 38.8% | +0.33 |

Dropping the one obvious outlier (2014-01-29, cover **5.67**, the security's very first auction) barely
moves it: **3.418 vs 3.143, t = +2.23**. On its face that is a real effect at conventional significance.

**It is not.** Demeaning each auction by its own year's new-issue mean — the minimum control for a series
whose covers fall from 4.50 in 2014 to ~3.0 today:

| Metric | Decision day | Other | Welch t (year-demeaned) |
|---|---|---|---|
| Bid-to-cover | +0.047 | −0.026 | **+0.63** |
| Tail | −0.0013 | +0.0007 | **−1.02** |

Within-year, the cover difference is **positive in only 3 of the 8 years that contain both kinds** (mean
+0.098): 2016 +0.285, 2022 +0.655, 2025 +0.793 against 2014 −0.193, 2017 −0.037, 2021 −0.020, 2023
−0.443, 2026 −0.255. The tail difference is negative in 4 of 8.

**The composition that manufactures the pooled result, named rather than smoothed:**

| Year | New issues on a decision day | Mean cover that year |
|---|---|---|
| 2014 | **3 / 4** | **4.495** |
| 2015 | **4 / 4** | **3.640** |
| 2016 | 2 / 4 | 3.603 |
| 2017 | 1 / 4 | 3.348 |
| 2018 | **0 / 4** | 3.285 |
| 2019 | **0 / 4** | 2.720 |
| 2020 | **0 / 4** | 3.190 |
| 2021 | 2 / 4 | 2.940 |
| 2022 | 2 / 4 | 2.908 |
| 2023 | 1 / 4 | 2.913 |
| 2024 | **0 / 4** | 3.285 |
| 2025 | 1 / 4 | 3.035 |
| 2026 | 2 / 3 | 3.350 |

The two highest-cover years put **7 of 8** new issues on decision days; the four years that put **none**
of their sixteen there include the two lowest-cover years in the series. The pooled statistic is reading
the auction calendar's history, not the Committee's.

**2. The collision is a WEEKDAY artifact, and it is total in both directions — SUPPORTED, 18/18 and
0/10.** Every one of the 18 decision-day new issues fell on a **Wednesday**; that is 18 of the 40
Wednesday new issues (45%). **None** of the 10 Tuesday new issues fell on one — and **9 of those 10 sold
exactly one day before a decision**:

| Tuesday new issue | Nearest FOMC decision |
|---|---|
| 2014-04-29 | 2014-04-30 (+1d) |
| 2019-01-29 | 2019-01-30 (+1d) |
| 2020-01-28 | 2020-01-29 (+1d) |
| 2020-04-28 | 2020-04-29 (+1d) |
| 2020-07-28 | 2020-07-29 (+1d) |
| 2021-04-27 | 2021-04-28 (+1d) |
| **2024-10-29** | **2024-11-07 (+9d)** |
| 2025-01-28 | 2025-01-29 (+1d) |
| 2025-07-29 | 2025-07-30 (+1d) |
| 2026-04-28 | 2026-04-29 (+1d) |

So **27 of 51 new issues (53%)** sell on the decision day or its eve, and the split is decided entirely
by the weekday. The reopening side corroborates the mechanism by its absence: **1 of 103** reopenings
ever landed on a decision day, because reopenings sit in the *other* months.

**Why the calendar produces it.** All **51** new issues fall in January, April, July and October
(13 / 13 / 13 / 12) — the quarterly cycle — inside the month-end 2Y–5Y–7Y note week, which is the same
last week the FOMC uses for its January, April, July and October meetings. For 2027 the PDF's own rows
give the ladder: **2Y Mon 01-25 · 5Y Tue 01-26 · FRN Wed 01-27 · 7Y Thu 01-28**, with 2027-01-27 the
only day of the four carrying just two auctions.

**Forward observation, recorded but NOT registrable.** Read against federalreserve.gov's 2027 calendar
(Jan 26-27, Mar 16-17\*, Apr 27-28, Jun 8-9\*, Jul 27-28, Sep 14-15\*, Oct 26-27, Dec 7-8\*), a Wednesday
FRN new issue in each quarter would land on **all four** decision days — Jan 27, Apr 28, Jul 28, Oct 27.
Only January is in the published tentative schedule; the rest is arithmetic on two calendars, and the
Fed's own page states every 2027 date is *"tentative until confirmed at the meeting immediately
preceding it."*

**3. This is the SPREAD-STAMPING auction, and that is the durable content — SUPPORTED, 103/103 and
51/51.** At a new issue `high_discnt_margin` and `spread` are the **same number on all 51 auctions**: the
auction *is* the spread-setting event. And matching every reopening to its own new issue by
`original_issue_date`, the reopening carries that stamped spread on **103 of 103**. So whatever clears on
2027-01-27 is the coupon spread both 2027 reopenings of this CUSIP pay for the life of the note. This
reproduces from raw the inheritance identity
[`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md) owns, and it is the reason this auction —
not the reopenings around it — is the one worth reading closely.

Recent stamps, for scale: 2025-01-28 **0.098** · 2025-04-23 **0.160** · 2025-07-29 **0.159** ·
2025-10-29 **0.190** · 2026-01-28 **0.099** · 2026-04-28 **0.103** · 2026-07-29 **0.050**.

**4. Closing time: `11:30 AM` predicted, and an FOMC day does not change it — SUPPORTED.** The
congestion rule inherited from [`treasury-2y-frn-2026-11-24`](treasury-2y-frn-2026-11-24.md) reproduces
on the new-issue subset, and 2027-01-27's slate is read from the PDF, not assumed:

| Same-day auctions | `11:30 AM` | `01:00 PM` |
|---|---|---|
| 1 | 2 | 0 |
| **2** | **27** | **0** |
| 3 | 17 | 2 |
| 4 | 0 | 3 |

**2027-01-27 carries two auctions** — this FRN and a 17-week bill. Two-auction new issues are **27/27** at
11:30 a.m.; across all 154 FRN auctions two-auction days are **68/68**. The decision day is orthogonal:
crossing closing time against decision day over all 154 gives **18 of 19** decision-day auctions at
`11:30 AM` (the exception is 2021-01-27, a *three*-auction day, i.e. explained by the congestion rule
rather than by the Fed).

**5. The index rate derives to 2027-01-25, and the ordering is the ordinary one — SUPPORTED, 152/154
overall and 125/125 on Wednesdays.** Refitting the settlement-precedence rule from scratch against the
full bill series — *the index is the most recent **Monday** 13-week bill auctioned before the FRN whose
**settlement precedes** the FRN's own settlement* — gives **152 of 154**, with both misses named and both
of them **Tuesday** auctions (2019-01-29, whose bill slate was shutdown-shifted; 2024-12-24, unexplained).
By FRN auction weekday: **Wed 125/125 · Tue 23/25 · Thu 3/3 · Fri 1/1.**

For this date the schedule forces the answer rather than the base rate:

- `13-Week BILL / Thursday, January 21, 2027 / **Monday, January 25, 2027** / **Thursday, January 28,
  2027**` — settles before this FRN's **2027-02-01**. **This is the index.**
- `13-Week BILL / Thursday, January 28, 2027 / Monday, February 01, 2027 / Thursday, February 04, 2027`
  — auctions on the FRN's settlement day and settles after it. Excluded.

**Two traps follow, and they point opposite ways.** First, the ordering here is the **ordinary** one:
index **01-25** falls *after* the **01-21** announcement, so the "index locked three days before the
announcement" result that
[`treasury-2y-frn-2026-11-24`](treasury-2y-frn-2026-11-24.md) established for Thanksgiving week is a
*Thanksgiving-specific* inversion, not a property of the security — a lane that generalises it gets
January backwards. Second, **MLK is a trap that isn't**: the 2027-01-18 holiday pushes that week's bill
slate to Tuesday 01-19, and a reader applying "most recent Monday bill" might flinch, but 01-25 is a
later Monday and the shift never touches the index. Both of the rule's historical misses are
holiday- or shutdown-shifted Tuesdays, which is exactly why this was checked rather than assumed.

**6. Size is $30B, and the reopening figure is the wrong one to inherit — SUPPORTED.** Offering amounts
on the last twelve new issues: **$26B, $28B, then $30B ten times in a row** (every new issue since
2024-04-24). `sb0590`'s anticipated-size table reads 30 in new-issue months and 28 in reopening months,
which is why a lane carrying the 2026-11-19 sibling's **$28B** across to January would be wrong by $2B.
This is **inherited from the proposal, not re-registered** — the announcement on 2027-01-21 is what
settles it, and it belongs to
[`treasury-coupon-announcement-2027-01-21`](treasury-coupon-announcement-2027-01-21.md).

**7. The settlement sits five days out, with the month-end note block — SUPPORTED.** This auction
settles **2027-02-01**, a Monday, not at the usual T+2. Across the 51 new issues the auction→settlement
gap is **5 days on 19**, and among the thirteen January new issues 5 days is modal (2015, 2016, 2021,
2022, 2026; the rest run 2–7). The 2Y and 5Y notes of the same week settle the same day. Recorded as
scale and as the input to leg 5's settlement-precedence test, not as a signal.

**8. The one-year analog is row-for-row, and it is the cleanest baseline this event has — SUPPORTED.**
**2026-01-28**: a Wednesday, an FOMC decision day, a two-auction slate, closed **`11:30 AM`**, stamped
spread **0.099**, cover **3.16**, tail **0.014**, indirect **61.4%**, index **2026-01-26** (a Monday, after
the announcement), $30B. Every mechanical prediction this ledger makes for 2027-01-27 was true of
2026-01-28, which is what makes those predictions cheap; the *interesting* claim is the null in leg 1,
where 2026-01-28's cover of 3.16 against that year's 3.35 mean is itself a small negative.

**9. No tracked name is exposed, and no house playbook applies — SUPPORTED, inherited.** `symbols: []`.
A two-year floater indexed to the 13-week bill sits at the opposite end of the curve from the long-end
duration channel this calendar's equity ledgers care about, and transmits nothing into it.

**10. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve **2026-09-08** (the freshest close in the 2026 CSV): 3-Mo **3.94** (the FRN's index
tenor) · 2Y **4.39** · 5Y **4.57** · 7Y **4.68** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**. **VIX
15.72** (2026-09-08 close; no 09-09 bar had posted at fetch time and 09-07 was Labor Day). The most
recent 13-week bill auctioned **2026-09-08** at a **3.800%** high discount rate / 3.890% investment rate
on **$99.1B**, up from 3.770% on 08-31 and 3.715% on 08-24 — the index tenor is drifting up, sixteen
months of drift away from anything this event will price.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event, and the
answer this doc would give even if the date were confirmed, because no house playbook is rates-keyed.
Three things it does support:

**Stop treating "sells on FOMC decision day" as information about this auction.** It is the calendar's
arithmetic, not the Committee's influence: the weekday decides it, 27 of 51 new issues sit on the day or
its eve, and neither price nor demand moves once the year is controlled. The mechanism that makes the
null unsurprising is worth stating even though this session did not test it directly — an FRN's coupon
resets weekly to the 13-week bill's high rate, so the security absorbs a policy path automatically and
what is bid at auction is a *discount margin*, not a level.

**Read this auction for the spread it stamps.** That number is inherited unchanged by both 2027
reopenings (103/103), which makes it the single most consequential field this security produces all
quarter — more consequential than any of the mechanical predictions registered below.

**Take the 2026-10-28 pre-read seriously and the 2026-09-23 one not at all.** 10-28 is the same class of
event on the same kind of slate one quarter earlier: a two-auction new issue that tests the closing-time
rule, the $30B size and the tail envelope for free, four weeks from now. 09-23 is a three-auction
reopening whose spread is already determined by its own new issue; it can confirm the inheritance
identity and nothing else about January.

### Honest limits

**The auction has not happened; every number about it is a document read.** **The date is `estimate`** —
a tentative schedule is tentative, the confirming primary is the 2027-01-21 announcement, and the
`TSY:` prefix is deliberately not taken on this lane's no-self-confirm rule. **The FOMC date is itself an
estimate**: federalreserve.gov states every 2027 meeting date is *"tentative until confirmed at the
meeting immediately preceding it"*, so the 2026-12-09 meeting is what fixes it — the collision this
ledger analyses could simply be scheduled away, which would make legs 1 and 2 unscoreable rather than
wrong. **The null is a null, not a proof of zero.** At n=18 versus 33 with a tail sd of 0.0093, an effect
smaller than roughly **0.7bp** of tail or **0.3** of cover would not be detectable; "no decision-day
effect" means "none large enough to see at this sample," and the correction filed against the proposal
is that its evidence does not support the effect, not that the effect is impossible. **Year-demeaning is
the minimum control, not the best one** — it removes a level trend but not within-year regime shifts, and
a proper specification would control for issue size, the level of the index rate and the shape of the
front end together; that was not run this session. **The 2021+ subsample is n=8 versus 15** and nulls
everything, which is consistent with the correction but too small to be independent evidence for it.
**The congestion rule is a correlation over Treasury's published closing times, not a stated policy** —
inherited from the 11-24 sibling, reproduced here on the new-issue subset, with the same five unexplained
exceptions. **The index-determination rule is inferred from 152/154, not read from 31 CFR 356**; the
2024-12-24 counterexample still has no story, and the FRN offering circular was not read this session.
The specific 2027-01-25 prediction rests on firmer ground than the rule (two settlement dates in
Treasury's own PDF) but inherits its exposure if the settlement-precedence reading is simply wrong.
**The "an FRN absorbs policy through its coupon" mechanism is an interpretation, not a measurement** — no
secondary-market or post-decision pricing data was pulled, so it is offered as the reason the null is
unsurprising, never as evidence for it. **The four-decision-day-collisions-in-2027 observation is
arithmetic on two tentative calendars**, three of whose auction dates do not yet exist in any Treasury
document. **`closing_time_comp`, `spread` and `frn_index_determination_date` are taken at face value** as
Treasury's record of what happened, which they are, but they describe past auctions and no field in this
dataset states a forward rule.

## Stance & kill switches

**Stance (date `estimate`; the schedule row, the same-day slates, the full FRN record, the bill series
and the FOMC calendars all primary-sourced 2026-09-09).** This is a **scheduled, unhedgeable,
zero-position event** whose FOMC-decision-day framing is the part that does *not* matter and whose
spread-stamping role is the part that does. No position is or should be taken.

**The registrable correction.** The proposal that created this entry measured a decision-day demand
premium (cover 3.363 vs 3.096) and read it as structural. Re-derived from scratch the pooled gap is
larger still (**3.543 vs 3.143, t = +2.32**, +2.23 without the 2014 outlier) and **it does not survive
year-demeaning (t = +0.63)**; the tail gap goes the same way (−1.57 → **−1.02**). Within-year it is
positive in 3 of 8 years. The pooled number is Simpson's paradox over an auction calendar that put 7 of
8 new issues on decision days in its two highest-cover years and none of sixteen there across 2018–20
and 2024. **The stance is therefore a null on both price and demand**, and the proposal's premium is
corrected on the record rather than carried forward.

**Two durable outputs beyond the siblings'.** (a) **The collision is a weekday artifact** — 18/18
decision-day new issues are Wednesdays, 0/10 Tuesdays are (9 of them sell the day *before*), 1/103
reopenings ever collided, and all 51 new issues sit in the month-end note week of Jan/Apr/Jul/Oct. That
explains the whole phenomenon from the calendar, with no appeal to policy. (b) **The spread-stamping
identity read forward** — `high_discnt_margin` **is** `spread` on all 51 new issues and 103/103
reopenings inherit it, so this auction fixes the coupon both 2027 reopenings pay; the reopenings are
therefore the *derivative* events and this one is where the information is.

**Inherited, not re-registered.** The congestion rule for closing time belongs to
[`treasury-2y-frn-2026-11-24`](treasury-2y-frn-2026-11-24.md) (reproduced here on the new-issue subset);
the settlement-precedence index rule belongs there too (refit here, 152/154, and sharpened to 125/125 on
Wednesday auctions); the discount-margin curve-slope model belongs to
[`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md); the **$30B** size belongs to
[`treasury-coupon-announcement-2027-01-21`](treasury-coupon-announcement-2027-01-21.md) and `sb0590`'s
FRN column. None is re-registered as a forward test here.

**Three forward tests registered** in
[this event's own fragment](../forward-tests/treasury-2y-frn-2027-01-27.md), all scoreable
**2027-01-28**, all zero-capital: **`-1`** the closing time reads `11:30 AM` (two-auction slate; base
rate 27/27 disclosed); **`-2`** `frn_index_determination_date` reads **2027-01-25**, not 2027-02-01 and
not a pre-announcement date (125/125 on Wednesday auctions disclosed); **`-3`** the decision-day null
holds — the print lands inside the last-twelve-new-issue envelope on **both** tail (≤ 0.030) and cover
(≥ 2.69).

**Kill switches:**

- **The 2027-01-27 print landing outside the tail (> 0.030) or cover (< 2.69) envelope** — `-3`'s own
  kill; the decision-day null does not hold in the current regime and the proposal's premium deserves
  re-derivation rather than the correction filed here.
- **The 2026-10-28 new issue printing `01:00 PM` on a two-auction day, or an offering amount other than
  $30B** — the free pre-read four weeks out; the closing-time leg and the size line are rebuilt, not
  patched, three months before January.
- **The 2026-09-23 reopening printing a spread different from its own new issue's** — the 103/103
  inheritance identity that makes this auction the consequential one breaks, and leg 3 goes with it.
- **`frn_index_determination_date` on 2027-01-27 reading anything other than 2027-01-25** — the
  settlement-precedence rule is wrong on a Wednesday auction, where it is currently 125/125, and the
  "ordinary ordering" correction against the Thanksgiving sibling loses its receipt.
- **The 2026-12-09 FOMC moving the 2027-01-26/27 meeting when it confirms the 2027 calendar** — legs 1
  and 2 become unscoreable rather than wrong, and this event reverts to an ordinary quarterly new issue.
- **Treasury revising the 2027-01-21 / 01-27 / 02-01 row, adding an `R` to it, moving the 17-week bill
  off 01-27, or shifting the auction to a Tuesday** — the slate and the weekday are the inputs to every
  mechanical call above, so any of those invalidates them before the auction happens.
- **The 2027-01-21 announcement not carrying a 2-Year FRN new issue** — the event's premise is wrong and
  this doc is rebuilt, not amended.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-140 | **Initial research. Canonical file written by this session** — the event existed only as `proposals/treasury-2y-frn-2027-01-27.from-treasury-coupon-announcement-2027-01-21.json`, read in full first per EVENT-RESEARCH.md. Schedule row re-derived independently and **confirmed unchanged** (`2-Year FRN / Thu Jan 21 / Wed Jan 27 / Mon Feb 01`, PDF plain curl HTTP 200 17,195 bytes, 4 streams inflated, re-tokenised into **213 records**); the **NEW-ISSUE marker verified at the token level**, not quoted — the 08-26, 09-23, 11-24 and 12-17 FRN rows each carry a standalone `R` token, the 10-22 and 01-21 rows do not, and the PDF legend reads `R --denotes reopening`. **HEADLINE — THE PROPOSAL THAT CREATED THIS ENTRY IS CORRECTED ON THE RECORD.** It registered that FRN new issues selling on an FOMC decision day see better demand (b/c 3.363 vs 3.096, "higher, not lower"). Re-derived from the full **154**-auction FRN series (HTTP 200, 532,321 bytes — **51 new issues / 103 reopenings**) joined to **107** FOMC statement dates parsed from federalreserve.gov's own `monetaryYYYYMMDDa.htm` release URLs (fomccalendars.htm HTTP 200 164,831 bytes + fomchistorical2014–2020, all HTTP 200), the pooled gap is *larger*: **3.543 (n=18) vs 3.143 (n=33), Welch t = +2.32**, and **+2.23** after dropping the 2014-01-29 outlier (cover 5.67). **IT DOES NOT SURVIVE THE YEAR CONTROL: year-demeaned t = +0.63** on cover and **−1.02** on tail (pooled −1.57); within-year the cover difference is **positive in 3 of the 8** years carrying both kinds, mean +0.098. **Cause named, not smoothed — Simpson's paradox over the auction calendar's eras:** 2014 **3/4** and 2015 **4/4** of new issues on decision days at covers **4.495** and **3.640**, against 2018/2019/2020/2024 at **0/4 each** and covers 3.285/2.720/3.190/3.285. **Stance is a NULL on both price and demand.** **SECOND — THE COLLISION IS A WEEKDAY ARTIFACT, TOTAL BOTH WAYS: 18 of 18** decision-day new issues are **Wednesdays** (18 of 40 Wednesdays, 45%); **0 of 10** Tuesdays, and **9 of those 10 sold exactly one day BEFORE** a decision (2024-10-29 alone at +9d). **1 of 103 reopenings** ever collided. So **27 of 51 (53%)** sit on the day or its eve, decided purely by weekday. Why: **all 51** new issues fall in Jan/Apr/Jul/Oct (13/13/13/12), inside the month-end note week the FOMC also uses — 2027's ladder from the PDF is 2Y Mon **01-25** · 5Y Tue **01-26** · **FRN Wed 01-27** · 7Y Thu **01-28**. **THIRD — THE DURABLE CONTENT: this is the SPREAD-STAMPING auction.** `high_discnt_margin` **is** `spread` on **51/51** new issues, and **103/103** reopenings carry their own new issue's spread (matched by `original_issue_date`) — so whatever clears here is the coupon both 2027 reopenings pay for the life of the note; the reopenings are derivative, this is where the information is. Recent stamps 0.098 · 0.160 · 0.159 · 0.190 · 0.099 · 0.103 · 0.050. **FOURTH — MECHANICAL, from the PDF's own same-day rows: slate = TWO** (this FRN + a 17-week bill) → congestion rule predicts **`11:30 AM`**; two-auction new issues **27/27**, all FRN two-auction days 68/68. A decision day does not move the close: **18 of 19** decision-day FRN auctions closed 11:30 (the exception, 2021-01-27, is a *three*-auction day, i.e. the congestion rule's, not the Fed's). **FIFTH — index derives to 2027-01-25.** Settlement-precedence rule refit from the full 13-week series (HTTP 200, 502,593 bytes): **152/154**, and **by weekday Wed 125/125 · Tue 23/25 · Thu 3/3 · Fri 1/1** — BOTH misses are Tuesday auctions, this is a Wednesday. Forced by the PDF: the Mon **01-25** bill settles **01-28**, before this FRN's **02-01**; the 02-01 bill settles 02-04 and is excluded. **TWO TRAPS, POINTING OPPOSITE WAYS:** the ordering here is the ORDINARY one (index 01-25 AFTER the 01-21 announcement), so a lane generalising [`treasury-2y-frn-2026-11-24`](treasury-2y-frn-2026-11-24.md)'s "index locked before the announcement" gets January backwards; and **MLK 2027-01-18 is a trap that isn't** — it shifts that week's bill slate to Tue 01-19 but 01-25 is a later Monday, checked because both historical misses are holiday/shutdown-shifted Tuesdays. **SIXTH — size $30B** (26, 28, then **30 ten times running** since 2024-04-24); inheriting the 11-19 sibling's $28B reopening figure is wrong by $2B. Inherited from the proposal, **not re-registered** — it belongs to the 01-21 announcement. **SEVENTH — settles 2027-02-01, five days out**, with the month-end note block (5d is modal for January: 2015, 2016, 2021, 2022, 2026), which is the input to the index test. **ONE-YEAR ANALOG, row for row: 2026-01-28** — Wed, decision day, two-auction slate, `11:30 AM`, spread **0.099**, cover **3.16**, tail **0.014**, indirect **61.4%**, index 2026-01-26 (Monday, post-announcement), $30B. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** nothing in the 09-09 corridor (30Y auction 09-10, CPI 09-11, FOMC 09-16) reaches a January 2027 auction; the dates that do are the **2026-10-28** new issue (the only true pre-read), **FOMC 2026-12-09** (confirms the 2027 FOMC calendar) and the **2027-01-21** announcement. **Volatility: VIX 15.72**, the **2026-09-08** close — no 09-09 bar posted at fetch time and 09-07 was Labor Day. **Rates (Treasury par CSV, 09/08):** 3-Mo **3.94** · 2Y 4.39 · 5Y 4.57 · 7Y 4.68 · 10Y 4.80 · 20Y 5.26 · 30Y 5.25; the 13-week bill auctioned **2026-09-08** at **3.800%** high discount on $99.1B (3.770% on 08-31, 3.715% on 08-24). **Corridor: 12 calendar entries within ±5 days** (fomc-2027-01-27, boj-decision-2027-01-22, japan-cpi-2027-01-22, norway-gpfg-bond-expert-group-2027-01-25, consumer-confidence-2027-01-26, fhfa-hpi-2027-01-26, japan-cpi-tokyo-flash-2027-01-29, boj-summary-of-opinions-2027-02-01, ism-manufacturing-2027-02-01, plus the sibling-proposed 2Y/5Y/7Y note legs). **NO adjacent event proposed this session, and the reason is recorded rather than left silent:** the corridor is already fully covered — the three January note legs (2Y 01-25, 5Y 01-26, 7Y 01-28) are already proposed by `from-treasury-coupon-announcement-2027-01-21`, the announcement and the 20Y/TIPS legs are tracked or proposed, and the four bill legs are not filed at all because this calendar tracks no bill auction of any tenor. Two candidates were **hunted and failed on sourcing**: BEA's news-release schedule (bea.gov/news/schedule, HTTP 200, 75,122 bytes) publishes nothing past "Personal Income and Outlays, November 2026", so the Q4-2026 advance GDP date that would fall in this corridor is not sourceable today; Treasury's quarterly-refunding page (HTTP 200, 73,580 bytes) carries no 2027 date, so the February refunding block is not sourceable either. Both are worth re-probing on the next pulse. **`FT-…-2027-01-27-1`** (closing time `11:30 AM`), **`-2`** (index date 2027-01-25) and **`-3`** (the decision-day null: tail ≤ 0.030 AND cover ≥ 2.69) registered, all scoring 2027-01-28. **All sources HTTP 200; nothing blocked.** | **Stance set** — zero-position; the FOMC-decision-day framing in this event's own title is the part that does not matter (**the proposal's demand premium is a year-composition artifact: t = +2.32 pooled → +0.63 year-demeaned**) and the collision itself is a weekday artifact (18/18 Wednesdays, 0/10 Tuesdays, 1/103 reopenings), while the durable content is that this auction **stamps the spread** both 2027 reopenings inherit (103/103) | 2026-09-30 (medium; D-140 sits in the 31+/21d band, which holds until 2026-12-27) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-2y-frn-2027-01-27.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
