# 30-Year Treasury Bond auction — the January reopening — treasury-30y-bond-2027-01-13

**Kind:** rates · **Date:** 2027-01-13 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — row reads `30-Year  BOND / R / Thursday, January 07, 2027 / Wednesday, January 13, 2027 / Friday, January 15, 2027`, the `R` marking a REOPENING) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["eia-steo-2027-01-12","fomc-blackout-start-2027-01-16","mlk-market-closure-2027-01-18","opex-2027-01-15","treasury-coupon-announcement-2027-01-14","wef-davos-annual-meeting-2027-01-18"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/news_release/2027_sched.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/schedule/news_release/cpi.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/schedule/home.htm","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **The anomaly the proposal handed forward is not an anomaly, and the risk it did not
name is the real one.** The 2027-01-13 Wednesday slot is settlement arithmetic, not a signal:
settlement is Friday 2027-01-15, and **since 2017 not one of 117 nominal 30-Year auctions has
settled fewer than two business days after pricing** — so Wednesday is the only day the schedule
can put it, and the block runs a *contiguous* Mon/Tue/Wed, which is tidier than the December block
it follows. Everything else about this auction is over-determined: **January is the second and
final reopening 17 of 17 times since 2009**, the size null is **$22B** (20 consecutive reopenings),
and the exact structural precedent — **2021-01-13**, same weekday, same day of month, same second
reopening of a November bond, same Friday-the-15th settlement — cleared **2.47**. One statistic
this ledger *decomposes* rather than corrects: the December sibling's pooled add-on of **$1.51B**
is a mixture, and splitting the same 20 auctions by cycle position gives **$0.19B at a first
reopening and $2.83B at a second** — this is a second, so the null total accepted is **~$24.8B**.
**The live risk is that the corridor looks empty and is actually unmapped.** Six tracked entries
sit within ±5 days and none is `high` — but this calendar holds **no 2027 CPI, PPI, jobs or
retail-sales entry at all**, and the December-data CPI print landed in the January 30-Year's own
session in **4 of the last 6 years**. BLS has not published a 2027 schedule, so nothing dates it
today. Date is `estimate`, `symbols: []`, and nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-126) | Stand aside | High | Nothing dated between now and **2026-11-04** can reach this auction's size, security or CUSIP. The size belongs to the November refunding statement, the bond being reopened does not exist until the **2026-11-12** new issue is sold, and **2027-01-07** merely publishes both. `symbols: []`, date `estimate`, no rates-keyed house playbook. | Treasury running an off-cycle issuance action or moving a nominal coupon size **before 2026-11-04** — no nominal coupon or FRN size has moved anywhere since April 2024 |
| This week | Stand aside — read **tomorrow's 30-Year reopening (2026-09-10)** and stop there | High | The 09-10 reopening is already announced at **$22B**, the 21st straight, and it is a *first* reopening — so it also reads the R1 add-on null (**$0.19B**) this ledger contrasts its own R2 null (**$2.83B**) against, 125 days early and at zero cost. | The **2026-09-10** reopening clearing bid-to-cover **outside 2.30–2.52**, the $22B-era band (n=20, mean 2.409, σ 0.056) every demand claim here chains to |
| This month | Watch **2026-10-08**, don't act | Medium | The October reopening is a **second** reopening — the same cycle position as this event — and the last one before the November refunding resets the grid. Its accepted-minus-offering line is the cheapest live read of the R2 add-on claim that is this ledger's distinctive finding. | The **2026-10-08** reopening printing an offering size other than **$22B**, or clearing total accepted **at or below** its offering — the 10-of-10-positive R2 add-on record breaks 97 days before this auction reads it |
| This quarter | Treat **2026-11-04** and **2026-11-12** as this event's real decision dates, and go get BLS's 2027 schedule the week it publishes | Medium | The refunding fixes the size and the new issue creates the CUSIP; the 2027-01-07 announcement only reads them back. The one genuinely open question — whether the December-2026 CPI print shares this auction's session, as it did in **2021, 2023, 2024 and 2026** — is answerable the moment BLS publishes, and is not answerable now. | The **2026-11-04** refunding dropping *"maintain nominal coupon and FRN auction sizes for at least the next several quarters"*, or **BLS dating December-2026 CPI outside 2027-01-08…2027-01-15** — either one re-cuts a premise rather than merely ageing it |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an auction.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. This is a read, not a trade.
- **The Wednesday is arithmetic, and the rule is dated.** Since **2017-01-01, 0 of 117** nominal
  30-Years settled fewer than **two business days** after pricing; the last 1-day gap was
  **2016-04-14** (17 such, all 2010–2016). Settlement Friday **2027-01-15** pins the auction to
  Wednesday **01-13**. Registered as **FT-treasury-30y-bond-2027-01-13-2**.
- **Wednesday is not even unusual** — **23 of 211** nominal 30-Years since 2009, and January runs
  13 Thursdays, **3 Wednesdays** (2015-01-14, 2021-01-13, 2025-01-08) and 1 Tuesday (2026-01-13).
- **January is always the second and final reopening — 17 of 17** since 2009. November is the
  refunding new issue, December the first reopening, January the second. A calendar identity.
- **The size null is $22B**: **20** consecutive completed reopenings 2024-03-13 → 2026-07-09, with
  2026-09-10 announced at $22B as the 21st. The **$25B** figure is the separate *new-issue* grid.
  Registered as **FT-treasury-30y-bond-2027-01-13-1**.
- **The add-on null is $2.83B, not $1.51B — this ledger's distinctive number.** Across the same 20
  auctions the December sibling pooled, a **first** reopening's SOMA add-on averages **$0.19B**
  (6/10 positive) and a **second** averages **$2.83B** (**10/10** positive). This is a second.
  Registered as **FT-treasury-30y-bond-2027-01-13-3**.
- **Demand does not fatigue by the third sale — REFUTED as a hypothesis.** Within-CUSIP, second
  reopening minus first: **−0.017 bid-to-cover** across **69** pairs (31/69 positive), a null. In
  the $22B era R1 clears **2.388** and R2 **2.407**, with indirect **64.6%** vs **66.5%**.
- **January is the calmest 30-Year session class in the series.** Auction-day 30-Year par-yield
  absolute move: **January 3.4bp** (n=17, >10bp on **1 of 17**) vs **4.6bp** across all 210 auction
  days and **4.1bp** across all 4,422 sessions. New issues are the lively ones (**5.1bp**);
  reopenings are not (**4.4bp** at either position).
- **The exact structural precedent is 2021-01-13** — Wednesday, the 13th, second reopening of a
  November bond, Friday-the-15th settlement, 2-business-day gap. Cleared **2.47** on a **6.0bp**
  session.
- **The corridor is unmapped, not empty, and that is the live risk.** Six tracked entries within
  ±5 days, none `high` — but the calendar carries **no 2027 CPI/PPI/jobs/retail-sales entry**
  (CPI coverage stops at 2026-12-10). December-data CPI shared the January 30-Year's session in
  **2021, 2023, 2024 and 2026** and sat ±1 day in **2018, 2019 and 2022**. Registered as
  **FT-treasury-30y-bond-2027-01-13-5**.
- **No 2027 CPI entry is proposed, deliberately.** BLS's own CPI schedule, read this session, stops
  at November-2026 data, and `2027_sched.htm` does not exist yet. A date this lane invented would
  be a guess another lane would then read as evidence.
- **No buyback question exists here** — the Tentative Buyback Schedule (re-fetched, HTTP 200,
  **125,547 bytes**, still mastheaded *"For Publication August 5, 2026"*) ends at the **11/06/2026**
  settlement. January 2027 has no published operation calendar at all.
- **Watch (dated):** reopenings **2026-09-10** (R1) and **2026-10-08** (R2, same cycle position) ·
  refunding **2026-11-04 — the size is decided** · new issue **2026-11-12 — the CUSIP is created** ·
  the December leg **2026-12-10** · **BLS's 2027 schedule, autumn 2026** · announcement
  **2027-01-07** · 3-Year **01-11** · 10-Year **01-12** · **this auction 01-13** · settlement +
  opex **01-15** · FOMC blackout **01-16** · MLK **01-18** · FOMC **2027-01-27**.

## Initial research

### The question, plainly

Four sibling ledgers already own most of what a 30-Year auction doc can say. The September one
([`treasury-30y-bond-2026-09-10.md`](treasury-30y-bond-2026-09-10.md)) argued the long-end
term-premium case; the October one
([`treasury-30y-bond-2026-10-08.md`](treasury-30y-bond-2026-10-08.md)) established demand mechanics
across a full sale cycle and the buyback eligibility rules; the November one
([`treasury-30y-bond-2026-11-12.md`](treasury-30y-bond-2026-11-12.md)) settled a holiday-broken
block to a null; and the December one
([`treasury-30y-bond-2026-12-10.md`](treasury-30y-bond-2026-12-10.md)) separated an unprecedented
information *arrangement* from an ordinary auction. Repeating any of them would be a non-question.

The December ledger handed this one an explicit open question, and it is worth quoting because the
answer turned out to reframe the event: *"this leg sits on a WEDNESDAY, where the December and
November legs sit on Thursdays; the January block runs 3-Year Monday 2027-01-11, 10-Year Tuesday
2027-01-12, 30-Year Wednesday 2027-01-13, all settling Friday 2027-01-15 — a compressed Mon/Tue/Wed
shape whose driver a `never-assessed` session on this id should establish rather than inherit."*

So this session asked four questions:

1. **What actually drives the Wednesday slot** — is it information, or is it arithmetic?
2. **What is different about the third and final sale of a bond**, as opposed to the first
   reopening every sibling has studied?
3. **Is the size null the same $22B**, and does the December sibling's add-on statistic transfer?
4. **Is this corridor genuinely quiet**, or does it only look quiet from inside our calendar?

**One-line verdict:** the Wednesday is **settlement arithmetic** and dissolves as a finding; the
second reopening is **indistinguishable from the first on demand but carries a ~15× larger SOMA
add-on**, which is the one number a reader is likely to have wrong; the size null holds at $22B;
and the corridor's quiet is **a coverage artifact of our own calendar**, not a property of the week
— which makes the one dated thing worth chasing BLS's 2027 release schedule, not anything about the
auction.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded, not silently skipped). Everything
quantitative below was fetched from a primary **this session (2026-09-09)** and derived here:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain
  curl, HTTP 200, **17,195 bytes**, `CreationDate D:20260804173209-04'00'`, FlateDecode streams
  inflated **per page** and rows rebuilt from `Tm` coordinates. Re-parsed independently of the
  proposal that discovered this event.
- **The buyback schedule** — `home.treasury.gov/system/files/221/Tentative-Buyback-Schedule.pdf`,
  plain curl, HTTP 200, **125,547 bytes**, three pages, every operation row read (a hex-string
  decoder was needed here that the auction PDF did not require).
- **Auction history** — `api.fiscaldata.treasury.gov` `auctions_query`,
  `original_security_term:eq:30-Year, security_type:eq:Bond, auction_date:gte:2009-01-01` — **253
  rows**, of which **42 are 30-Year TIPS** (dropped on a non-null `ref_cpi_on_issue_date`), leaving
  **211 nominal**, **210** with published results. Plus the 3-Year series, 2023+, **45 rows**.
- **FOMC 2027 dates** — `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, 164,831
  bytes; the 2027 panel reads *"January 26-27"*.
- **CPI release dates** — BLS's own release schedule and news-release archive, read through the
  harness's fetcher (see the source note below).
- **The tape** — `home.treasury.gov` daily par yield curve CSVs, one file per year **2009–2026**
  (18 files, **4,423 sessions**); **VIX** daily closes from `cdn.cboe.com`'s own `VIX_History.csv`.

**Three source-reliability notes, recorded rather than papered over.**

*TIPS contamination.* `auctions_query`'s `security_type` does **not** separate 30-Year TIPS from
nominal bonds — both return `Bond`. Filtering on a non-null `ref_cpi_on_issue_date` separates them;
every statistic below is nominal-only. Reproduced here independently, not inherited.

*bls.gov 403s this runner, and its 2027 schedule does not exist yet.* Plain `curl` returned **403**
on `schedule/news_release/2027_sched.htm` and `schedule/news_release/cpi.htm`, with and without
browser headers — the documented blind spot [`ppi-2026-11-13.md`](ppi-2026-11-13.md) carries for
this lane, recorded in `probe-ref.blocked`. Read through the harness's fetcher, which is not
subject to that block, `cpi.htm` returns a schedule that **ends at November-2026 data (Dec. 10,
2026)** and `2027_sched.htm` returns **404** — i.e. the 2027 schedule is unpublished, not
withheld. The historical December-data release dates below came from BLS's own news-release archive
through the same fetcher: a **BLS primary via a second-hand renderer**, named as such. It
cross-checks against the separately `BLS:`-sourced `cpi-2026-12-10` calendar entry and against the
`cpi.htm` schedule row for the same month.

*VIX came from Cboe.* Cboe publishes the index it owns, so this is the primary, not a fallback.

**Bidder shares are competitive-only.** Every indirect/direct/dealer percentage is a share of
**competitive** awards (`comp_accepted`), SOMA add-ons excluded from the denominator.

**Cycle vocabulary.** A nominal 30-Year is sold three times — a **NEW** issue in the refunding month
(February, May, August, November), then **reopened** in each of the two following months. **This is
the SECOND and final reopening** of the bond the 2026-11-12 new issue creates and the 2026-12-10
reopening continues. Below, *cycle position 0/1/2* means new issue / first reopening / second
reopening, assigned by CUSIP order in the primary record.

### Conviction legs, tested

**1. The date, security, block and settlement are what the calendar says — SUPPORTED, primary.**
The tentative schedule's page-3 rows read verbatim:

| Security | R | Announcement | Auction | Settlement |
|---|---|---|---|---|
| `3-Year  NOTE` | — | Thursday, January 07, 2027 | **Monday, January 11, 2027** | Friday, January 15, 2027 |
| `10-Year  NOTE` | `R` | Thursday, January 07, 2027 | **Tuesday, January 12, 2027** | Friday, January 15, 2027 |
| `30-Year  BOND` | `R` | Thursday, January 07, 2027 | **Wednesday, January 13, 2027** | Friday, January 15, 2027 |

The PDF's own legend confirms `R --denotes reopening`, so the 3-Year is a **new issue** and the
other two are reopenings. All three settle Friday 2027-01-15 together. 1:00pm ET is Treasury's
standing coupon convention and is **not** separately sourced. Status correctly stays `estimate`: a
tentative schedule is tentative by construction, and the 2027-01-07 coupon announcement fixes it.

**2. The Wednesday slot is settlement arithmetic — SUPPORTED, and it dissolves the proposal's open
question rather than answering it in kind.** Business days between auction and settlement, all 211
nominal 30-Years:

| Window | Auctions with a **<2 business-day** gap |
|---|---|
| 2009 → 2016 | **17** (last: **2016-04-14**) |
| **2017-01-01 → 2026-09-10** | **0 of 117** |

The gap distribution since 2017 is 2 days ×57, 3 ×30, 4 ×17, 5 ×8, 6 ×4, 7 ×1 — a hard floor of
two. Settlement here is **Friday 2027-01-15**, the 15th and itself a business day; two business
days back is **Wednesday 01-13**. A Thursday 01-14 auction would be a one-day gap the modern
convention has not produced in ten years and 117 auctions. The block therefore runs backwards from
Wednesday as a **contiguous Mon/Tue/Wed** — which is *more* conventional than the December block it
follows, where the three legs are Monday, Tuesday and **Thursday** with Wednesday 12-09 skipped.
The proposal read the compression as the anomaly; on the record the December gap is the anomaly and
January is the tidy one.

**3. Wednesday 30-Years are not rare anyway — REFUTED as a rarity claim.** Day-of-week across the
211 nominal auctions: **Thursday 175 · Wednesday 23 · Tuesday 13**. Within January specifically:
**13 Thursdays, 3 Wednesdays** (2015-01-14, 2021-01-13, 2025-01-08) and **1 Tuesday**
(2026-01-13). January is in fact the *least* Thursday-locked month in the series.

**4. January is always the second and final reopening — SUPPORTED, 17/17.** Every January nominal
30-Year since 2009 carries `reopening: "Yes"` **at cycle position 2**. This is a calendar identity
rather than a behavioural regularity: the refunding months are February, May, August and November,
so a January 30-Year can only be the second reopening of the November bond. The schedule's `R`
agrees.

**5. The size null is $22B, on the same grid the December sibling established — SUPPORTED.** Two
grids run side by side and have never been equal:

| Grid | What it sizes | Streak | Window |
|---|---|---|---|
| **$25B** | refunding-month **new issues** | 15 consecutive | 2024-02-08 → 2026-08-13 |
| **$22B** | the two monthly **reopenings** | **20 consecutive completed** | 2024-03-13 → 2026-07-09 |

2026-09-10 is already announced at $22B as the 21st. The last reopening at any other size was
**2024-01-11 at $21B**. The size *decision* is not in this window at all: it belongs to the
**2026-11-04** quarterly refunding statement, 70 days before this auction, and **2027-01-07** merely
publishes it. Registered as **FT-treasury-30y-bond-2027-01-13-1**.

**6. The December sibling's add-on statistic does NOT transfer, and the reason is cycle position —
SUPPORTED, and it is the finding a reader is most likely to have wrong.** That ledger reported, for
the 20-auction $22B streak, *"total accepted − offering: mean $1.51B, positive at 16 of 20."* That
reproduces here **exactly** — it is not an error. But it is a **mixture of two populations**:

| Cycle position | n | Add-on mean | Positive |
|---|---|---|---|
| **First** reopening (the December leg) | 10 | **$0.19B** | 6/10 |
| **Second** reopening (**this** leg) | 10 | **$2.83B** | **10/10** |
| pooled (what the sibling reported) | 20 | $1.51B | 16/20 |

The per-auction record makes the split unmistakable: every first reopening in the streak came in at
$0.00–0.71B, while the second reopenings run 0.30, 0.36, 0.41, 2.29, 2.60, 3.57, 3.67, 3.90, 4.83
and **6.40B**. So the honest null for **2027-01-13** is a total accepted of roughly **$24.8B**
against a **$22B** headline — not the ~$23.5B a pooled read implies. Registered as
**FT-treasury-30y-bond-2027-01-13-3**. Two honest limits sit on it: the add-on is the SOMA
rollover, which is a Fed reinvestment decision rather than private demand, and it is *why* the
number must never be read as a demand signal; and n=10 is small, though 10/10 positive with a wide
margin is the more consistent reading than the mean alone.

**7. Demand does not fatigue by the third sale — REFUTED as a hypothesis, on a within-CUSIP
control.** The intuition worth testing on a *final* reopening is dealer indigestion: by the third
sale the same bond has been sold twice already. Measured the only way that controls for regime —
each bond's second reopening against **its own** first reopening:

| Measure | n pairs | Mean, 2nd minus 1st |
|---|---|---|
| Bid-to-cover | 69 | **−0.017** (31/69 positive) |
| Indirect share (competitive) | 69 | **+0.16pp** |
| Offering size | 69 | **+$0.01B** |

Inside the $22B era the two populations are effectively the same auction: R1 clears bid-to-cover
**2.388** (σ 0.071, range 2.22–2.49), R2 **2.407** (σ 0.061, range 2.30–2.52); indirect **64.6%**
vs **66.5%**; dealer take similar. The usable claim is only that **there is no third-sale penalty**
— which is the same shape of answer the December sibling reached about CPI-day auctions, reached
here on a different control and a different question.

**8. The demand band to judge the print against — SUPPORTED.** The **20** completed $22B reopenings
(2024-03-13 → 2026-07-09): bid-to-cover **mean 2.398, σ 0.067, range 2.22–2.52**; indirect
**65.6%**, direct **21.0%**, dealer **13.4%** on a competitive denominator. Restricting to the
**11** all-time $22B *second* reopenings: **mean 2.407, σ 0.061, range 2.30–2.52**. The band this
ledger tests against is **2.30–2.52**, drawn from the second-reopening population specifically.
Registered as **FT-treasury-30y-bond-2027-01-13-4**.

**9. January is the calmest 30-Year session class in the series — SUPPORTED, and it is the
counterweight to any corridor worry.** The 30-Year's own close-to-close absolute par-yield move on
the auction day, 18 annual Treasury CSVs, 4,423 sessions:

| Session class | n | Mean absolute move | Share > 10bp |
|---|---|---|---|
| **January 30-Year auction days** | 17 | **3.4 bp** | **1/17** |
| New issue (cycle position 0) | 71 | 5.1 bp | 10/71 |
| First reopening | 70 | 4.4 bp | 7/70 |
| **Second reopening** | 69 | **4.4 bp** | 5/69 |
| All 30-Year auction days | 210 | 4.6 bp | 22/210 |
| Every session 2009–2026 | 4,422 | **4.1 bp** | 6.6% |

The only January above 10bp is **2023-01-12** at 11bp; the last two (**2025-01-08**, **2026-01-13**)
each printed **0.0bp**. Two readings are available and only one is defensible: the mechanical one,
that new issues carry the volatility and reopenings do not, is consistent across n=71/70/69; the
January-specific 3.4bp at **n=17** is suggestive and **not** claimed as an effect.

**10. The exact structural precedent is 2021-01-13 — SUPPORTED, n=1 and named as such.** Filtering
the record for a Wednesday second reopening settling Friday the 15th at a 2-business-day gap returns
**2021-01-13**: same weekday, same day of month, same second reopening of a November bond, same
settlement shape. It cleared **bid-to-cover 2.47** on a **6.0bp** session — and its session *also*
carried the December-2020 CPI print. The nearest recent analogue is **2026-01-13**, one year before
this event: $22B second reopening, cleared **2.42**, indirect **66.8%**, dealer **12.0%**, SOMA
add-on **$6.40B** (the largest in the streak), on a **0.0bp** session, likewise sharing its session
with CPI. One observation is not a base rate; two consistent ones are the best this study has.

**11. The corridor is unmapped, not empty — SUPPORTED, and it is this event's live risk.** Only
**six** tracked entries sit within ±5 days and **none is `high`**:

| Date | Impact | Entry |
|---|---|---|
| 2027-01-12 | low | `eia-steo-2027-01-12` |
| **2027-01-14** | medium | `treasury-coupon-announcement-2027-01-14` |
| **2027-01-15** | medium | `opex-2027-01-15` — the settlement date is also monthly options expiry |
| 2027-01-16 | medium | `fomc-blackout-start-2027-01-16` — three days after the auction |
| 2027-01-18 | low | `mlk-market-closure-2027-01-18` · `wef-davos-annual-meeting-2027-01-18` |

Against the December leg's **26** entries and three `high`, that is a startling contrast — and it is
mostly an artifact. This calendar's CPI coverage **stops at `cpi-2026-12-10`**; there is no 2027
CPI, PPI, jobs or retail-sales entry of any date in 543 tracked events. The FOMC is genuinely far:
the Fed's own 2027 calendar reads *"January 26-27"*, so the auction is **D−13** from the decision
and **D−3** from the blackout — the cleanest FOMC separation any 30-Year leg in this family has.

**12. The one adjacency that matters is undated by any primary today — SUPPORTED, and stated as an
absence rather than filled in.** December-data CPI vs the January 30-Year auction, from BLS's own
news-release archive:

| Auction | December-data CPI | Offset |
|---|---|---|
| **2021-01-13 · 2023-01-12 · 2024-01-11 · 2026-01-13** | 01-13 · 01-12 · 01-11 · 01-13 | **same session (4)** |
| 2018-01-11 · 2019-01-10 · 2022-01-13 | 01-12 · 01-11 · 01-12 | ±1 day (3) |
| 2020-01-09 · 2025-01-08 | 01-14 · 01-15 | +5, +7 days (2) |
| 2015-01-14 · 2016-01-14 · 2017-01-12 | 01-16 · 01-20 · 01-18 | +2 to +6 days (3) |

**4 of the last 6** and **4 of 9 since 2018** shared the session — the same mid-month clustering the
December sibling identified, where BLS's 10th–14th window and Treasury's coupon block occupy the
same days. But BLS's published CPI schedule **ends at November-2026 data**, and `2027_sched.htm`
does not exist. So this ledger **proposes no 2027 CPI entry**: a date invented here would be read as
evidence by the next lane. It is registered as a forward test instead
(**FT-treasury-30y-bond-2027-01-13-5**) and named as the single thing worth going to get.

**13. There is no buyback question answerable today — SUPPORTED, and the reason is coverage.** The
published Tentative Buyback Schedule, fetched this session (HTTP 200, **125,547 bytes**, three
pages, still mastheaded *"For Publication August 5, 2026"*, `CreationDate D:20260804`), ends at the
**11/6/2026** settlement — its last two rows are a 20Y–30Y liquidity-support operation announced
11/3/2026 and a 1Mo–2Y operation announced 11/4/2026. January 2027 has **no published operation
calendar at all**; the 2026-11-04 refunding publishes the next quarter's. Any buyback claim about
this auction today would be invention, and this doc makes none. Confirming the December sibling's
correction from the same read: the long-end (**20Y–30Y**) liquidity-support maximum is **$2 billion**
per operation, not $4 billion — $4B is the 1Mo–2Y, 3Y–5Y, 5Y–7Y and 7Y–10Y buckets, and TIPS run
$500–750 million.

**14. The tape going in is calm, and 126 days stale by construction — SUPPORTED, primary.** Par
curve at the **2026-09-08** close (the most recent published; 09-09's posts after this session): 2Y
**4.39** · 3Y **4.44** · 5Y **4.57** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**, 2s30s at
**86bp**. **VIX 15.72** (09-08 close, Cboe's own series, vs 15.30 on 09-07 and 14.53 on 09-04; the
09-07 bar is a Labor Day closure artifact and is flagged, not adopted). None of this forecasts
2027-01-13; it is the baseline the next pulse diffs against, recorded mechanically in the probe-ref
line above.

### What plays the conditions support

None directional, and the *absence* of a guard is itself this ledger's finding rather than a
default. Where the December leg earned a be-flat-for-one-afternoon stance from a measurably livelier
session, this one earns nothing of the kind: January 30-Year auction days run **3.4bp** against a
**4.1bp** all-session baseline, the FOMC is 13 days away, and the auction is the third sale of a
bond the market has already priced twice. `symbols: []`, the date is `estimate`, and the two
intuitions that would motivate a position — that a compressed Wednesday block signals something, and
that a final reopening should meet dealer indigestion — are the two this session refuted against
primaries. The things worth *doing* are all free and all earlier: read **2026-09-10** for the R1
add-on null, **2026-10-08** for the R2 one, **2026-11-04** for the size, **2026-11-12** for the
CUSIP, and **BLS's 2027 schedule** the week it publishes.

### Honest limits

The 2026-11-04 refunding statement, the 2026-11-12 new issue, the 2027-01-07 coupon announcement,
the when-issued yield and this auction's CUSIP and coupon **do not exist yet**; this doc is written
**126 days out** and says so — the longest horizon any ledger in this family has been written at,
and the reason every call above is a stand-aside or a watch. The structural legs rest on small
samples where it matters most: **n=10** for the second-reopening add-on split, **n=11** for the $22B
second-reopening band, **n=17** for the January session class, **n=1** for the exact structural
precedent. Leg 9's January calm is explicitly *not* claimed as an effect; the cycle-position result
(n≈70 per cell) is the sturdier half of that table. The add-on finding in leg 6 is about **SOMA
rollover**, a Fed reinvestment mechanic, and must never be read as private demand — it is registered
precisely so a reader does not mistake a large total accepted for a strong auction. Bid-to-cover is
a demand proxy; the tail (stop vs. when-issued) is sharper and is **not** in the primary dataset, so
this ledger makes no tail claim. Par-curve measurements use close-to-close constant-maturity yields,
not the on-the-run bond and not intraday marks around 1:00pm, so they measure the *session*, not the
auction. CPI release dates were read through a second-hand renderer because bls.gov 403s this
runner — cross-checked two ways and recorded in `probe-ref.blocked`, not laundered — and the 2027
schedule is simply unpublished, which is why leg 12 ends in an absence rather than a date. Nothing
here forecasts a clearing yield.

## Stance & kill switches

**Stance (date `estimate`; size, CUSIP, coupon and block confirmation all `estimate`/inference until
2027-01-07).** No action, and — unlike the December leg — **no session guard either**. The research
value is in three separations. First, **the Wednesday is arithmetic**: settlement on Friday the 15th
plus a two-business-day floor that has held for 117 consecutive auctions since 2017 leaves exactly
one legal auction day, and the proposal's "compressed block" is the *conventional* shape, not the
odd one. Second, **the second reopening differs from the first in exactly one measurable way, and it
is not demand**: within-CUSIP the third sale clears **−0.017** bid-to-cover against the second
(31/69 positive, a null), while its SOMA add-on runs **$2.83B against $0.19B** — so the number to
carry into 2027-01-13 is a total accepted near **$24.8B** on a **$22B** headline, and it is a Fed
rollover mechanic, never a demand signal. Third, **this corridor's quiet is our calendar's, not the
market's**: six tracked entries, none `high`, but no 2027 CPI entry exists anywhere in 543 events,
and the December-data print shared this auction's session in four of the last six years. `symbols:
[]`: no symbol-keyed action exists to take.

**Predictions registered with a score-by date** (per the TEMPLATE rule, these also register in
[`forward-tests/treasury-30y-bond-2027-01-13.md`](../forward-tests/treasury-30y-bond-2027-01-13.md)):

- **FT-treasury-30y-bond-2027-01-13-1** — the 2027-01-07 coupon announcement sizes the 30-Year
  reopening at **$22 billion**.
- **FT-treasury-30y-bond-2027-01-13-2** — the block is announced in its scheduled shape: 3-Year
  **Monday 01-11**, 10-Year **Tuesday 01-12**, 30-Year **Wednesday 01-13**, all settling **Friday
  01-15** — i.e. the Wednesday is the settlement floor's output, not a schedule change.
- **FT-treasury-30y-bond-2027-01-13-3** — total accepted exceeds the offering by **at least $1.0B**,
  the second-reopening add-on signature ($2.83B mean, 10/10 positive) rather than the first's.
- **FT-treasury-30y-bond-2027-01-13-4** — the auction clears bid-to-cover **inside 2.30–2.52**, the
  $22B second-reopening band; the third sale carries no demand penalty.
- **FT-treasury-30y-bond-2027-01-13-5** — BLS's 2027 release schedule, when it publishes, dates the
  December-2026 CPI print **within 2027-01-08 … 2027-01-15**.

**Kill switches:**

- **The 2027-01-07 coupon announcement fixing the 30-Year off $22B** — the reopening grid every size
  claim chains to breaks, FT-1 dies, and FT-4's band (drawn from the $22B second-reopening
  population specifically) is **voided** rather than merely missed.
- **The 2026-11-04 refunding statement dropping *"maintain nominal coupon and FRN auction sizes for
  at least the next several quarters"*** — the ~29-month flat-grid premise fires ten weeks before the
  announcement that would confirm it, and both size legs get re-cut rather than patched.
- **Either the 2026-09-10 or the 2026-10-08 reopening clearing outside 2.30–2.52** — the $22B-era
  demand band breaks 125 or 97 days early, and legs 7 and 8 get re-derived before the next pulse.
- **The 2026-10-08 second reopening clearing total accepted at or below its $22B offering** — the
  10-of-10-positive R2 add-on record, which is this ledger's distinctive finding, breaks on the last
  observation before the grid resets. This is the single cheapest test of leg 6.
- **The auction moving off Wednesday 2027-01-13, or settlement moving off Friday 2027-01-15** — the
  two-business-day arithmetic that dissolves the proposal's open question would no longer describe
  this auction, and FT-2 dies. A move to **Thursday 01-14** specifically would be the sharper
  finding: a 1-business-day gap for the first time since 2016-04-14.
- **BLS dating December-2026 CPI outside 2027-01-08 … 2027-01-15** — FT-5 dies and leg 11's
  corridor reading changes character: a print well clear of the auction week would make this the
  genuinely quiet window it currently only looks like.
- **BLS dating December-2026 CPI ON 2027-01-13** — not a kill but a **stance amendment**: this
  becomes the same doubled-session shape the December sibling analysed, and its measured answer
  (no demand penalty, +0.039 bid-to-cover on a matched control) is what should be inherited, along
  with a be-flat-through-the-session guard this stance currently does not carry.
- **A confirmed-weak print** — bid-to-cover below **2.30** (under the $22B-era floor), or indirect
  share below the high 50s — elevates this from "over-determined and quiet" to a demand question the
  cycle-position control did not anticipate.
- **A published buyback calendar for the week of 2027-01-11 containing a 20Y–30Y operation whose
  eligible-CUSIP list includes the reopened bond** — the TreasuryDirect on-the-run and first-coupon
  exclusions the October sibling measured at 20/20 would not be applied as written, and leg 13's
  "no question exists" reading dies rather than merely ageing out.
- **An appropriations lapse before 2027-01-13** — the 2025 precedent is real (October-2025 CPI was
  never published), and it would remove the one adjacency this ledger is actually watching.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-126 | **Initial research banked** (doc above). **Canonical file written by this session** — the event existed only as `proposals/treasury-30y-bond-2027-01-13.from-treasury-30y-bond-2026-12-10.json`, read in full first per EVENT-RESEARCH.md. **Schedule primary-verified independently of that proposal:** the Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, `CreationDate D:20260804173209-04'00'`, streams inflated per page and rows rebuilt from Tm coordinates this session) reads `30-Year  BOND / R / Thursday, January 07, 2027 / Wednesday, January 13, 2027 / Friday, January 15, 2027` — **`R`, a REOPENING** — with the sibling legs `3-Year  NOTE` (**no `R`, a NEW issue**) Monday 01-11 and `10-Year  NOTE / R` Tuesday 01-12, all three settling Friday 01-15; status stays `estimate`. **Finding 1 — the proposal's one open question dissolves (leg 2).** It asked what drives the Wednesday slot. The answer is settlement arithmetic and it is dated: **since 2017-01-01, 0 of 117** nominal 30-Years have settled fewer than **two business days** after pricing (17 such gaps exist, all 2010–2016, last **2016-04-14**; the post-2017 distribution has a hard floor of 2). Settlement Friday **2027-01-15** leaves Wednesday **01-13** as the only legal day, and the block runs backwards as a **contiguous Mon/Tue/Wed** — *more* conventional than the December block, which skips Wednesday 12-09. **Finding 2 — Wednesday is not rare either (leg 3):** **23 of 211** nominal 30-Years since 2009, and January runs **13 Thu / 3 Wed / 1 Tue**, the least Thursday-locked month in the series. **Finding 3 — January is the SECOND and final reopening, 17/17 since 2009 (leg 4)**, a calendar identity: refunding months are Feb/May/Aug/Nov, so a January 30-Year can only be cycle position 2. **Finding 4 — the size null is $22B (leg 5),** unchanged from the December sibling's grid: **20 consecutive completed reopenings** 2024-03-13 → 2026-07-09, 2026-09-10 announced at $22B as the 21st, last non-$22B reopening 2024-01-11 at $21B; the **$25B** streak is the separate *new-issue* grid. Decided at the **2026-11-04** refunding, published 2027-01-07. **Finding 5 — the December sibling's add-on statistic does not transfer, and this is the number a reader is most likely to have wrong (leg 6).** Its pooled `accepted−offering mean $1.51B, positive 16/20` **reproduces exactly** — it is a mixture, not an error. Split by cycle position across the same 20: **first** reopening **$0.19B** (6/10 positive, every print $0.00–0.71B); **second** reopening **$2.83B** (**10/10** positive, prints 0.30–6.40B). This leg is a second, so the null total accepted is **~$24.8B** on a $22B headline — and it is **SOMA rollover, a Fed reinvestment mechanic, never a demand signal**. **Finding 6 — no third-sale fatigue (leg 7), on a within-CUSIP control:** second reopening minus its own first, **−0.017 bid-to-cover** across **69** pairs (31/69 positive), **+0.16pp** indirect, **+$0.01B** size. In the $22B era R1 clears **2.388** (σ0.071) and R2 **2.407** (σ0.061); indirect 64.6% vs 66.5%. **Demand band (leg 8):** the 11 all-time $22B *second* reopenings cleared **2.407, σ 0.061, range 2.30–2.52**; the full 20-auction $22B set **2.398, σ 0.067**, indirect 65.6%, direct 21.0%, dealer 13.4% (competitive denominator). **Finding 7 — January is the calmest 30-Year session class (leg 9):** auction-day 30Y par-yield absolute move, 18 annual Treasury CSVs / 4,423 sessions — **January 3.4bp** (n=17, >10bp on **1/17**, only 2023-01-12 at 11bp; 2025-01-08 and 2026-01-13 each 0.0bp) · new issue **5.1bp** (n=71) · first reopening **4.4bp** (n=70) · **second reopening 4.4bp** (n=69) · all auction days 4.6bp · all sessions **4.1bp**. The cycle-position split (n≈70/cell) is claimed; the January figure at n=17 is **not** claimed as an effect. **Finding 8 — the exact structural precedent is 2021-01-13 (leg 10):** Wednesday, the 13th, second reopening of a November bond, Friday-the-15th settlement, 2-business-day gap — cleared **2.47** on a **6.0bp** session, CPI in its session too. Nearest recent analogue **2026-01-13**: $22B R2, **2.42**, indirect 66.8%, dealer 12.0%, SOMA add-on **$6.40B** (largest in the streak), **0.0bp** session, also a CPI session. **Adjacency sweep — peers:** n/a (`symbols: []`). **Macro:** the corridor is **unmapped, not empty (leg 11)** — only **6** tracked entries within ±5 days and **none `high`** (`eia-steo-2027-01-12`, `treasury-coupon-announcement-2027-01-14`, `opex-2027-01-15` sharing the settlement date, `fomc-blackout-start-2027-01-16`, `mlk-market-closure-2027-01-18`, `wef-davos-annual-meeting-2027-01-18`), against the December leg's 26 and three `high` — but this calendar carries **no 2027 CPI, PPI, jobs or retail-sales entry among 543 events** (CPI coverage stops at `cpi-2026-12-10`). **FOMC verified from the Fed's own 2027 calendar** (federalreserve.gov, HTTP 200, 164,831 bytes): *"January 26-27"*, so the auction is **D−13** from the decision and **D−3** from the blackout — the cleanest FOMC separation of any leg in this family. **Finding 9 — the one adjacency that matters is undated by any primary today (leg 12):** December-data CPI shared the January 30-Year's session in **2021-01-13, 2023-01-12, 2024-01-11 and 2026-01-13** (4 of the last 6, 4 of 9 since 2018) and sat ±1 day in 2018, 2019 and 2022. BLS's own CPI schedule read this session **ends at November-2026 data (Dec. 10, 2026)** and `2027_sched.htm` returns **404** — unpublished, not withheld — so **no 2027 CPI entry is proposed**, deliberately: an invented date would be read as evidence by the next lane. **No buyback question exists (leg 13):** the Tentative Buyback Schedule (fetched, HTTP 200, **125,547 bytes**, 3 pages, `CreationDate D:20260804`, still mastheaded "For Publication August 5, 2026") ends at the **11/6/2026** settlement; January 2027 has no published operation calendar. Confirming the December sibling: the **20Y–30Y** liquidity-support maximum is **$2B/op**, not $4B. **Volatility:** **VIX 15.72** (09-08 close, Cboe's own `VIX_History.csv`) vs 15.30 on 09-07 and 14.53 on 09-04 — the 09-07 bar is a Labor Day closure artifact, flagged and not adopted. **Rates:** par curve **09-08** — 2Y **4.39** · 3Y **4.44** · 5Y **4.57** · 10Y **4.80** · 20Y **5.26** · **30Y 5.25**, 2s30s **86bp**. **Geopolitical:** nothing dated touching this event beyond the tracked Davos meeting 01-18. **TWO dated adjacencies PROPOSED as `estimate` in this PR,** both read verbatim from the same schedule page: `treasury-coupon-announcement-2027-01-07` (this event's own **confirming primary**, and the announcement for all six securities dated `Thursday, January 07, 2027`) and `treasury-3y-note-2027-01-11` (the block's **NEW-issue** leg, no `R`; 0 of 45 3-Year auctions since 2023 are reopenings, size null **$58B** flat for 16 months, and its SOMA add-on is bimodal — $0.00B five times against $16.88B on 2026-01-12). Deliberately NOT proposed: `treasury-10y-note-2027-01-12` (already owned by `proposals/…from-treasury-10y-note-2026-12-08.json` — a duplicate would be a competing proposal, #1717) and any 2027 CPI entry (no primary dates it). **Source failures recorded, not papered over:** `bls.gov` schedule pages **403** to plain curl with and without browser headers, so CPI dates were read through the harness's fetcher — a **BLS primary via a second-hand renderer**, cross-checked against the `BLS:`-sourced `cpi-2026-12-10` entry; `bls.gov/schedule/home.htm` **404**. Both in `probe-ref.blocked`. **FT-…-2027-01-13-1** ($22B, scores 2027-01-07), **-2** (block shape / the Wednesday floor, scores 2027-01-07), **-3** (add-on ≥ $1.0B, the R2 signature, scores 2027-01-14), **-4** (b/c inside 2.30–2.52, scores 2027-01-14) and **-5** (BLS dates Dec-2026 CPI in 01-08…01-15, scores 2026-12-31) **registered**. | **Stance set** — stand aside, and **no session guard**, which is the departure from the December sibling: January auction days run **3.4bp** vs a **4.1bp** baseline and the FOMC is 13 days away. Three separations carry it: the Wednesday is **arithmetic** (0 of 117 under 2 business days since 2017); the third sale differs from the second only in its **SOMA add-on** ($2.83B vs $0.19B), never in demand (−0.017 b/c, n=69); and the corridor's quiet is **our calendar's**, not the market's | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-30y-bond-2027-01-13.json` (`status:
"estimate"`) in the same PR — your own file, never another event's canonical one (#1717). Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory — after
which this doc goes quiet.
