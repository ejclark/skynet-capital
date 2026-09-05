# Treasury coupon announcement (month-end 2Y / 5Y / 7Y note + 2Y FRN reopening sizes, plus three bills) — treasury-coupon-announcement-2026-09-17

**Kind:** rates · **Date:** 2026-09-17 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed and rebuilt per-page from Td/Tm glyph coordinates direct 2026-09-05 — seven rows announce that day; corroborated by the auction record, where all four 2026 month-end announcements carried exactly this seven-security shape; stays `estimate` because a tentative schedule is tentative and this lane may not self-confirm) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:8+","adjacentIds":["boj-decision-2026-09-18","buyback-blackout-start-2026-09-12","fomc-2026-09-16","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","import-export-prices-2026-09-16","missouri-uocava-ballot-mailing-2026-09-19","opex-2026-09-18","retail-sales-2026-09-16","treasury-10y-tips-2026-09-17","treasury-20y-bond-2026-09-15","treasury-2y-note-2026-09-22","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-vote-2026-09-17","vix-expiration-2026-09-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The four coupon numbers are already in writing and the FRN has its own ledger — so the only
live number here is the bill leg, and the obvious read of it is wrong.** `sb0590` states verbatim that
Treasury *"expects to implement reductions to shorter-dated bill auction sizes during the month of
September"*, which reads like a cut on 09-17. Measured from the auction record this session: **the cut
already happened** — 6-week 95 → 85 → **75**, 4-week 110 → 100 → **90**, 8-week 100 → 90 → **85**, all
executed across 2026-08-27 → 09-08, before this announcement exists. And in each of the last three
Septembers the benchmark 13-/26-week bills held **flat through every mid-September announcement** and
stepped **up** only at month-end or in early October. So the honest call for 09-17 is a **hold, not a
further cut**. The composition is also sharper than the calendar entry claimed: **seven** securities,
not "four coupons plus unattributable bills" — 13-week, 26-week and 6-week bills, and **no 52-week**
(that one is announced 09-24). Date is `estimate`, `symbols: []`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-12) | Stand aside | High | Saturday — no session; Labor Day Monday, next print Tuesday 09-08. `symbols: []`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed, and all four coupon sizes are already published in `sb0590`'s Sep-26 row. | Treasury publishing an off-cycle **coupon or FRN** size change, or a coupon CMB, before **2026-09-17** — `sb0590` binds nominals and FRNs in one sentence, so either fires this |
| This week | Watch **two free intermediate reads**, hold nothing through either | High | The **2026-09-10** announcement (20Y + 10Y TIPS, already owned by its own ledger) and the **2026-09-15** 6-week bill auction — announced 09-10 — which says whether the September short-bill cut is spent or still running, two days before this event's own bill leg. | The **2026-09-15** 6-week printing **below $75B** — the reduction is still running and this doc's "the cut is already spent" premise dies two days early |
| This month | Expect a **hold** on the bill leg — 13-week **$92B**, 26-week **$79B**, 6-week **no higher than $75B** | Medium | Benchmarks unmoved at every mid-September announcement in **2023, 2024 and 2025** (first step-up 10-02, 09-30, 10-06 respectively), and 2026's shorter-dated reductions were fully executed by 09-08. | Either benchmark printing off **$92B / $79B** on **2026-09-17**, or the 6-week printing **above $75B** — the seasonal pattern and the "cut already spent" reading break together, one announcement before October is supposed to reverse them |
| This quarter | The deductive coupon channel runs to **2026-11-12**; expect October to **reverse** into bill increases | Medium | `sb0590` verbatim: *"In October, Treasury anticipates increasing auction sizes across the bill curve based on expected seasonal fiscal outflows"*, with the TGA projected to peak at **$1.05T** in late October. | Treasury dropping or qualifying *"for at least the next several quarters"* at the **2026-11-04** refunding — the scheduled-nil frame is conditional on that sentence, and [`FT-39`](../forward-tests/legacy.md) already measures it |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, date is `estimate`, no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed.
- **Seven securities, verified two ways:** 13-week + 26-week bills (auction 09-21), 6-week bill (09-22),
  2Y note (09-22), 2-Year FRN **reopening** (09-23), 5Y note (09-23), 7Y note (09-24). **No 52-week.**
- **The four coupon numbers, primary-sourced and quotable today:** 2Y **$69B** · 5Y **$70B** · 7Y
  **$44B** · 2-Year FRN reopening **$28B** (`sb0590` Sep-26 row `69 58 70 44 39 13 22 28`, verbatim).
- **The bill leg is the only unknown, and its direction is pre-stated by Treasury** — September
  reductions, October increases. Measured here: the September half is **already executed**.
- **The grids, re-derived this session:** 2Y $69B **29/29** since 2024-04-23, 5Y $70B **29/29** since
  2024-04-24, 7Y $44B **29/29** since 2024-04-25 — zero deviations in any.
- **Settlement stacks onto a loaded day:** the three notes ($183B) settle **Wednesday 2026-09-30** —
  quarter-end, `government-funding-deadline-2026-09-30`, PCE and the third Q2 GDP estimate.
- **TGA, and it is short of Treasury's own assumption:** **$903.9B** (2026-09-03 DTS close) against
  `sb0590`'s **$950B** end-September figure; 2025's mid-September tax date added **+$190B** in five
  sessions, which is the receipt this announcement is the first to see.
- **The FRN leg is not re-researched here** — [`treasury-2y-frn-2026-09-23`](treasury-2y-frn-2026-09-23.md)
  owns the discount margin, the index-determination timing and the >10.0bp kill switch.
- **Two data traps, both new:** fiscaldata files **TIPS under `security_type: Note`** (the 2026-04-23
  5-Year TIPS at $26B breaks a naive 5-Year grid count), and two full-size grid rows carry
  **`reopening: Yes`** (2026-01-26 2Y, 2025-02-25 5Y) — filter on neither field.
- **Watch (dated):** announcement **09-10** · 20Y **09-15** · **FOMC 09-16** · 10Y TIPS + **this
  announcement 09-17** · triple witching **09-18** · bills **09-21/09-22** · 2Y **09-22** · FRN
  reopening + 5Y **09-23** · 7Y **09-24** · settlement + funding deadline **09-30** · refunding
  **11-04** · first unpublished announcement **11-12**.

## Initial research

### The question, plainly

This event was created by the [`treasury-2y-frn-2026-09-23`](treasury-2y-frn-2026-09-23.md) initial
research (2026-09-05) as the confirming primary for an `estimate`-dated FRN reopening with nothing to
attach its confirmation to. It arrives with most of its answer already written down — four coupon sizes
in `sb0590`, the FRN examined in depth by its own ledger, and a sibling
([`treasury-coupon-announcement-2026-10-22`](treasury-coupon-announcement-2026-10-22.md)) that already
named this release as its own *"free out-of-sample check, 35 days early."* Reproducing any of that would
be a duplicate. So the question asked here was the narrower one: **which number in this release is
actually unknown on 2026-09-05, and does the published guidance predict it correctly?**

**One-line verdict:** the only unknown is the **bill leg**, Treasury has pre-announced its direction in
writing — and the measured answer is that the guidance's September half is **already spent**, so the
naive reading ("`sb0590` says cuts in September, therefore 09-17 cuts") is wrong and the honest call is
a hold.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no symbol-keyed
instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the mandated cache
bust has nothing to bust (recorded rather than skipped silently). Everything quantitative below was
fetched from a primary **this session (2026-09-05)** and re-derived rather than inherited:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**, streams inflated and the text layer reconstructed **per page** from
  Td/Tm glyph coordinates. The per-page step matters: the three month-blocks share y-coordinates
  across pages, so a whole-document y-grouping interleaves three calendars into one row and makes bill
  attribution unreadable — which is exactly the limitation this event's own calendar entry disclosed.
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590` (2026-08-05 quarterly refunding
  statement), HTTP 200, **75,579 bytes**, tag-stripped and read in full.
- **The auction record** — `api.fiscaldata.treasury.gov` `auctions_query`, five pulls: every
  `floating_rate: Yes` row since 2014-01-01 (**154** auctions), `Note` rows since 2023-06-01,
  `Bill` rows since 2026-05-01 (**117**) and for 2023-08→2025-10, and one `announcemt_date`-keyed pull
  per 2026 month-end announcement date.
- **The cash position** — `api.fiscaldata.treasury.gov` `dts/operating_cash_balance`, the Daily
  Treasury Statement's own TGA closing series, for 2026-08-14 → 2026-09-03 and for September 2025.
- **The tape** — Treasury's daily par yield-curve CSV (2026 full-year file) and Yahoo `^VIX` closes.

### Conviction legs, tested

**1. Seven securities announce here — not "four coupons plus unattributable bills" — SUPPORTED, and
this resolves a limitation this event's own calendar entry disclosed.** The per-page reconstruction puts
exactly these rows on **Thursday, September 17, 2026**:

| Security | Auction | Settle | Reopening? |
|---|---|---|---|
| `13-Week BILL` | Monday, September 21, 2026 | Thursday, September 24, 2026 | n/a |
| `26-Week BILL` | Monday, September 21, 2026 | Thursday, September 24, 2026 | n/a |
| `6-Week BILL` | Tuesday, September 22, 2026 | Thursday, September 24, 2026 | n/a |
| `2-Year FRN` | Wednesday, September 23, 2026 | Friday, September 25, 2026 | **Yes** — `R` marker |
| `2-Year NOTE` | Tuesday, September 22, 2026 | **Wednesday, September 30, 2026** | No |
| `5-Year NOTE` | Wednesday, September 23, 2026 | Wednesday, September 30, 2026 | No |
| `7-Year NOTE` | Thursday, September 24, 2026 | Wednesday, September 30, 2026 | No |

The entry's own source note said *"the PDF's three-month column interleave makes per-tenor bill
attribution unreliable at this extraction quality, and no claim is made about which bill tenors land on
this release."* That was a property of the extraction, not of the document: grouping glyphs by y across
the whole file merges three month-blocks that share coordinates on different pages, and grouping **per
page first** separates them cleanly. **The 52-week bill is not on this release** — it is announced
2026-09-24 (auction 09-29), which the same PDF states directly. Corrected in the calendar file here.

**2. The seven-security shape is confirmed independently by the auction record — SUPPORTED, 4 of 4.**
Rather than trust one PDF read, every 2026 month-end coupon announcement was pulled by its
`announcemt_date` and counted:

| Announcement | n | Securities |
|---|---|---|
| 2026-05-21 | **7** | 13w $89B · 26w $77B · 6w $85B · 2Y $69B · 5Y $70B · 7Y $44B · FRN $28B |
| 2026-06-18 | **7** | 13w $89B · 26w $77B · 6w $65B · 2Y $69B · 5Y $70B · 7Y $44B · FRN $28B |
| 2026-07-23 | **7** | 13w $92B · 26w $79B · 6w $95B · 2Y $69B · 5Y $70B · 7Y $44B · FRN $30B |
| 2026-08-20 | **7** | 13w $92B · 26w $79B · 6w $95B · 2Y $69B · 5Y $70B · 7Y $44B · FRN $28B |

Four for four, same three bill tenors, same day-offsets (13-/26-week auction the following Monday,
6-week the Tuesday), no 52-week in any of them. The **2026-08-20** row is the exact structural analogue
of this event — a month-end block with an FRN *reopening* — and it is an observed release, not a
schedule. **A data trap surfaced here:** the FRN reopening files under `security_term` **`1-Year
11-Month`** (or `1-Year 10-Month`), its *remaining* term, while a new issue files as `2-Year`. Anyone
counting "2-Year" securities on an announcement date will double-count in a new-issue month and miss the
FRN entirely in a reopening month.

**3. All four coupon sizes are published in advance — SUPPORTED, re-read verbatim rather than
inherited.** `sb0590`'s anticipated-size table, headers `2-Year · 3-Year · 5-Year · 7-Year · 10-Year ·
20-Year · 30-Year · FRN`:

```
Aug-26  69 58 70 44 42 16 25 28
Sep-26  69 58 70 44 39 13 22 28
Oct-26  69 58 70 44 39 13 22 30
```

**Sep-26 → 2-Year 69 · 5-Year 70 · 7-Year 44 · FRN 28 = $211B.** The governing sentence, verbatim:
*"Based on current projected borrowing needs, Treasury anticipates maintaining nominal coupon **and FRN**
auction sizes for at least the next several quarters."* The FRN sits inside that commitment, so an
off-grid FRN print falsifies this doc as squarely as an off-grid note print.

**4. The three nominal grids are deterministic and carry no information — SUPPORTED, n=29 each,
re-derived.** From `auctions_query`, with TIPS removed:

| Tenor | Size | Consecutive on-grid auctions | First deviation walking back |
|---|---|---|---|
| 2-Year note | $69B | **29** (2024-04-23 → 2026-08-25) | 2024-03-25 at $66B |
| 5-Year note | $70B | **29** (2024-04-24 → 2026-08-26) | 2024-03-26 at $67B |
| 7-Year note | $44B | **29** (2024-04-25 → 2026-08-27) | 2024-03-27 at $43B |

Agrees exactly with the 10-22 sibling's independent derivation. **Two filtering traps, both new and
both recorded because a silently mis-filtered base rate is how the next one gets believed.** (a)
fiscaldata files **TIPS under `security_type: Note`**, so `security_type:Note` + `security_term:5-Year`
ingests the **2026-04-23 5-Year TIPS at $26B** and collapses the 5-Year grid count from 29 to 5; exclude
rows carrying `index_ratio_on_issue_date` / `ref_cpi_on_issue_date`. (b) Two full-grid-size rows in the
window carry **`reopening: Yes`** — the **2026-01-26** 2-Year ($69B, `original_security_term: 5-Year`,
`original_issue_date: 2023-01-31`) and the **2025-02-25** 5-Year ($70B, `original_security_term:
7-Year`, `original_issue_date: 2023-02-28`) — so filtering on `reopening:No` returns 28, not 29. The
10-22 sibling named these two rows as `original_security_term` mis-tags; this session finds the field
that actually breaks a count is **`reopening`**, and notes that the rows' `original_cusip` /
`original_issue_date` are self-consistent enough that "mis-tag" is **not established** — the safe
instruction is to filter on `security_term` plus size and touch neither field.

**5. The bill leg is the only unknown number in this release, and Treasury pre-announced its direction —
SUPPORTED, verbatim.** `sb0590`'s BILL ISSUANCE paragraph: *"Given projections for receipts associated
with the mid-September corporate and non-withheld tax date, Treasury expects to implement **reductions
to shorter-dated bill auction sizes during the month of September**. In October, Treasury anticipates
**increasing** auction sizes across the bill curve based on expected seasonal fiscal outflows."* It also
states it *"expects to maintain current auction sizes in benchmark bills"*. That splits this
announcement's three bills into two classes: **13-week and 26-week are benchmarks** (hold), and the
**6-week is a shorter-dated size** (the live lever). This is the one paragraph in the guidance that
makes a dated, directional, falsifiable claim about a number nobody has published.

**6. The September reduction is already spent — SUPPORTED, and this is the substantive finding.** From
the 117-row 2026 bill pull, the shorter-dated tenors across the last six weeks:

| Tenor | 08-18 | 08-25 | 09-01 | 09-08 | Change |
|---|---|---|---|---|---|
| 6-Week | $95B | $95B | **$85B** | **$75B** | **−$20B** |
| 4-Week | $110B | $110B (08-20) | **$100B** (08-27) | **$90B** (09-03) | **−$20B** |
| 8-Week | $100B | $100B (08-20) | **$90B** (08-27) | **$85B** (09-03) | **−$15B** |
| 13-Week | $92B | $92B | $92B | $92B | unchanged since 06-29 |
| 26-Week | $79B | $79B | $79B | $79B | unchanged since 06-29 |

Treasury said it would cut shorter-dated bills in September; it cut them **$55B across three tenors in
two announcement cycles**, finishing 2026-09-08 — nine days before this event. The guidance sentence
that looks like a forecast for 09-17 is in fact a description of something already done.

**7. Mid-September is the flat part of the seasonal pattern, not the cutting part — SUPPORTED, 3 of 3
years.** Benchmark bill sizes across the same window in the three prior years:

| Year | 13-week through mid-Sept | First step-up | 26-week | First step-up |
|---|---|---|---|---|
| 2023 | $69B flat 08-21 → 09-25 | **$71B on 10-02** | $62B flat | **$64B on 10-02** |
| 2024 | $76B flat 08-19 → 09-23 | **$79B on 09-30** | $70B flat | **$72B on 09-30** |
| 2025 | $82B flat 08-18 → 09-29 | **$84B on 10-06** | $73B flat | **$75B on 10-06** |

In every year the benchmarks were unmoved at every mid-September announcement and turned **up** at
month-end or in early October — the same reversal `sb0590` describes in advance for 2026. The
shorter-dated tenors behave the same way: 2024's 4-week cut 95 → 85 → 80 across 08-29/09-05 and then
held flat until 09-26; 2025's 6-week never moved from $85B all September and stepped to $90B on 10-07.
**2026's shape matches 2024's**, with the cut front-loaded and the mid-September window flat.

**8. The TGA is running short of Treasury's own end-September assumption, and this announcement is the
first to see the tax receipts — SUPPORTED, and it is the two-sided risk to leg 6.** From the Daily
Treasury Statement: TGA closing balance **$903.9B on 2026-09-03**, after $1,023.6B on 08-31 (month-end)
and a $942.8B / $944.4B start to September. `sb0590` states Treasury *"is assuming a $950 billion cash
balance at the end of September"* and projects the TGA peaking at **$1.05T (±$50B) in late October**.
The gap is closed by the **2026-09-15** corporate and non-withheld tax date — the same event
`sb0590` names — and the precedent is large: in 2025 the TGA went **$667.6B (09-10) → $857.7B (09-15)**,
**+$190B in five sessions**. So 09-17 is the first announcement written with those receipts in hand.
Both tails are live and are stated rather than resolved: strong receipts argue Treasury can keep
short-bill sizes down (a hold, or one more trim); weak receipts against a $950B target argue for turning
the bill curve up a week earlier than the guidance implies. The base rate (leg 7) and the executed cut
(leg 6) both favour a hold, which is why the call is a hold at **medium**, not high.

**9. The FRN leg is owned elsewhere and is deliberately not re-researched here — recorded, not
duplicated.** [`treasury-2y-frn-2026-09-23`](treasury-2y-frn-2026-09-23.md) (2026-09-05) covers the
security this announcement sizes: its four-year-low discount margin, the index-determination timing that
puts its index rate on the **post-FOMC** side of the 09-16 decision, the R2-vs-R1 base rate, and the
>10.0bp kill switch it inherits from the 10-22 ledger. This doc's only claims about it are the two the
announcement itself makes: it is a **reopening** (the `R` marker, and the 28/30 column rule) at
**$28B**. Confirming that is precisely what makes this event the FRN ledger's dated primary.

**10. Settlement lands on a heavily loaded day — recorded, not traded.** The three notes settle
**Wednesday 2026-09-30**: quarter-end, the tracked `government-funding-deadline-2026-09-30`, plus PCE,
the third Q2 GDP estimate, ADP, Chicago PMI and the S&P select-sector secondary reweight. The 10-Year
TIPS auctioned **on 09-17 itself** also settles 09-30. So **$183B of note settlement** plus a TIPS
settlement clears on a session that already carries a fiscal deadline and a month-end index event. It is
a scheduling coincidence with no measured price consequence, written down so a later session does not
rediscover it as a signal.

**11. This announcement's own tape effect will not be measurable, and that is stated now rather than
attempted at close-out — SUPPORTED.** 2026-09-17 carries the **10-Year TIPS reopening auction at 1:00pm
ET**, roughly two hours after the ~11:00 ET announcement; the **FOMC decision was the previous
afternoon**; **09-17 is the final day of the communications blackout** (`fomc-blackout-start-2026-09-05`,
through 09-17); and **triple witching is the next session**. No intraday attribution to an announcement
of four pre-published numbers is defensible in that stack, and none will be attempted. The honest
measurables are the composition and the bill sizes.

**12. The policy decision the day before does not touch this document — SUPPORTED, by construction.**
An auction announcement publishes **sizes**, not rates. The 2026-09-16 FOMC decision transmits into what
the 09-21/09-22 bills and the 09-22/09-23/09-24 coupons *yield*, and into the 13-week index rate the FRN
reopening resets against — none of which is a number this release chooses. Recorded because "announcement
the day after the Fed" reads like an event and is not one.

**13. No tracked name is exposed through this channel — SUPPORTED, inherited, not re-derived.**
`symbols: []`. The duration channel that hit CRWV −12.1% and SOX −5% on 2026-08-18 was a long-end yield
move; an announcement publishing numbers already published cannot transmit into it.

**14. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve, 09-03 → **09-04**: 3-Mo 3.89 → **3.91** · 2Y 4.34 → **4.37** · 5Y 4.52 → **4.54** ·
7Y 4.63 → **4.65** · 10Y 4.77 → **4.78** · 20Y 5.25 → **5.25** · 30Y 5.25 → **5.24**. **VIX 14.53**
(09-04 close). **Today is a Saturday** — 2026-09-05 has no session, Labor Day is Monday 09-07 and the
next print is Tuesday 09-08, so 09-04 is the freshest close available and nothing here is stale by
neglect.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What the
conditions do support is three things.

**Retire "which securities does 09-17 announce" as an open question.** Seven, named, with auction and
settlement dates, verified against a PDF and against four observed 2026 releases. Any rates ledger in
the September corridor can stop hedging the bill attribution, and the 52-week's absence is now a fact
rather than a silence.

**Spend the attention on the bill leg, and read the guidance as a description, not a forecast.** The
three note grids are documents agreeing with 29-auction base rates and the FRN has its own ledger. The
bill leg is the only number nobody has published, Treasury pre-stated its direction, and the measured
finding is that the September half of that direction was executed by 09-08. That is the claim worth
registering, because a reader who takes `sb0590` at face value predicts the wrong thing.

**Sequence the dated checks and read each for one thing.** The order is: **09-10** (announcement, owned
by its own ledger) → **09-15** (the 6-week auction announced 09-10 — the free read on whether the cut is
spent, two days before this event) → **09-16** (FOMC; an input to yields, not to this release) →
**09-17** (this event: composition and the bill leg) → **09-21/09-22** (the bills it sizes) →
**09-22/09-23/09-24** (2Y, FRN reopening + 5Y, 7Y) → **09-30** (settlement, quarter-end, funding
deadline) → **11-04** refunding, where the grid can change and where [`FT-39`](../forward-tests/legacy.md)
lives → **11-12**, the first coupon announcement no current Treasury primary sizes.

### Honest limits

**No Treasury press release for the 2026-09-17 announcement exists yet** — it has not happened; every
coupon size here is a document read, not an observation. **`sb0590`'s table is explicitly *anticipated*
sizes** and its verbs are "anticipates" and "plans to". **The seasonal base rate is n=3 years** — 2023,
2024 and 2025 all show flat benchmarks through mid-September, but three observations inside three
different fiscal regimes is a pattern, not a law, and no significance is claimed. **The 6-week bill has
existed only since 2025**, so its own seasonal history is one year deep and the leg-7 argument for it
leans on the 4-/8-week analogues. **The TGA leg establishes a level and a precedent, not a
prediction** — this session did not model Treasury's cash needs, receipts or the debt-limit constraint,
and the +$190B 2025 tax-date figure is one year's observation. **The ~11:00 ET announcement time is
unsourced convention**, inherited from the sibling chain; the calendar entry discloses it. **Base rates
sit inside one policy regime** (the 2024-2026 grid window is a single guidance era), so "the grid is
deterministic" is a within-guidance claim with a dated expiry. **The `reopening: Yes` rows in leg 4 are
reported as observed** — this session did not establish whether they are a tagging artifact or a genuine
off-the-run reopening, only that filtering on the field breaks the count.

## Stance & kill switches

**Stance (date `estimate`; the seven-security composition primary-sourced from Treasury's own tentative
schedule and corroborated by four observed 2026 releases, all four coupon sizes primary-sourced from
`sb0590`, the bill history and TGA from fiscaldata, all fetched 2026-09-05).** This is a **scheduled nil
whose coupon content is already published** — expect **2Y $69B · 5Y $70B · 7Y $44B · 2-Year FRN
reopening $28B** on 2026-09-17 at ~11:00 ET, $211B in total, alongside 13-week, 26-week and 6-week
bills and **no 52-week**. No position is or should be taken on it. The doc's durable outputs are three:
(a) **the composition, resolved** — seven securities with named tenors and dates, closing the "bill
attribution unreliable" gap this event's own calendar entry disclosed, and adding the FRN-reopening
`security_term` trap (`1-Year 11-Month`, not `2-Year`); (b) **the bill-leg call, against the naive read
of the guidance** — `sb0590`'s September reductions were executed 08-27 → 09-08 (6w −$20B, 4w −$20B, 8w
−$15B) and mid-September is the flat part of the seasonal pattern in 3 of 3 prior years, so 09-17 is a
hold; and (c) **two filtering traps** — TIPS filed under `security_type: Note`, and full-size grid rows
carrying `reopening: Yes`.

**No sibling test is touched, and the coupon sizes are deliberately registered only once.**
[`FT-treasury-coupon-announcement-2026-10-22-1`](../forward-tests/treasury-coupon-announcement-2026-10-22.md)
already names this release as its own free out-of-sample pre-check on the same grid; that row is
untouched and this doc does not restate its number as an independent test. The 2Y/5Y/7Y/FRN sizes appear
below only as one component of a **composition** test whose informative half is which securities
announce, and the coupon half's pass rate is disclosed as near-uninformative.

**Forward test `FT-treasury-coupon-announcement-2026-09-17-1` registered**, scoreable **2026-09-18**:
the announcement publishes exactly seven securities — 13-week, 26-week and 6-week bills, 2Y note $69B,
5Y note $70B, 7Y note $44B, and the 2-Year FRN as a **reopening** at $28B — with **no 52-week bill**.

**Forward test `FT-treasury-coupon-announcement-2026-09-17-2` registered**, scoreable **2026-09-18**:
the bill leg **holds** — 13-week $92B and 26-week $79B unchanged, and the 6-week no higher than $75B.
This is the leg where a measurement, not a document, does the work, and it is the one prediction here
that contradicts a plain reading of Treasury's own published guidance.

**Kill switches:**

- **Any of 2Y $69B · 5Y $70B · 7Y $44B · FRN $28B printing off-grid on 2026-09-17** — Treasury
  contradicting a named, month-specific written commitment inside its own guidance quarter, with three
  29-auction grids and the FRN's 28/30 reopening rule breaking together. Coupon announcements stop being
  a scheduled nil and supply returns as a live variable ahead of the 11-04 refunding — and it kills the
  10-22 sibling five weeks before its own event.
- **The 2026-09-17 release carrying a security not in the seven, or omitting one of them** — most
  concretely a **52-week bill** (which this session places on the 09-24 announcement) or the FRN
  arriving without its `R` marker. The composition finding, verified two ways, was wrong, and the
  four-for-four 2026 base rate is not the stable convention it looks like.
- **The 2026-09-15 6-week bill printing below $75B** — the September reduction is still running rather
  than spent, the leg-6 finding is a snapshot mistaken for a completion, and the hold call is wrong two
  days before this event tests it.
- **Either benchmark printing off $92B / $79B on 2026-09-17** — three years of flat mid-September
  benchmarks break, and `sb0590`'s "maintain current auction sizes in benchmark bills" becomes a
  sentence that does not bind. This would also make the TGA shortfall (leg 8) the live driver rather
  than the seasonal pattern, which is the reading this doc explicitly did not take.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at or before the
  2026-11-04 refunding — the whole scheduled-nil frame is conditional on that sentence, and it binds
  **FRNs and nominal coupons together**, so an FRN-only change fires this too.
- **An off-cycle coupon or FRN issuance action** — a size changed between refundings, or a coupon CMB.
  `sb0590` explicitly reserves bill-size and CMB flexibility, so a *bill* action does not fire this;
  `sb0607` (2026-08-19) shows Treasury acting on the **buyback** lever without touching auction sizes,
  which is the non-firing case made concrete.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-12 | **Initial research.** **Composition resolved — SEVEN securities, and the calendar entry's own "bill attribution unreliable" caveat is retired.** Treasury's Tentative Auction Schedule (direct, HTTP 200, 17,195 bytes, rows rebuilt **per page** from Td/Tm glyph coordinates — the per-page step is what separates three month-blocks that share y-coordinates) puts on 09-17: `13-Week` and `26-Week BILL` (auction 09-21, settle 09-24), `6-Week BILL` (09-22, settle 09-24), **`2-Year FRN` WITH the `R` marker → reopening** (09-23, settle 09-25), `2-Year NOTE` (09-22), `5-Year NOTE` (09-23) and `7-Year NOTE` (09-24) — the three notes all settling **09-30**. **No 52-week** (that is announced 09-24). **Corroborated independently from the auction record:** all four 2026 month-end announcements carried exactly this seven-security shape — 05-21, 06-18, 07-23, 08-20 — same three bill tenors, same offsets, no 52-week in any. Title and source corrected in this event's calendar file. **Coupon sizes published:** `sb0590` Sep-26 row verbatim `69 58 70 44 39 13 22 28` → 2Y **$69B** · 5Y **$70B** · 7Y **$44B** · FRN reopening **$28B** = **$211B**. **Grids re-derived:** 2Y $69B **29/29** since 2024-04-23, 5Y $70B **29/29** since 2024-04-24, 7Y $44B **29/29** since 2024-04-25 — matches the 10-22 sibling's independent count. **Three data traps named, all new:** (a) fiscaldata files **TIPS under `security_type: Note`** — the 2026-04-23 5-Year TIPS at $26B collapses a naive 5-Year grid count from 29 to 5; (b) two full-grid-size rows carry **`reopening: Yes`** (2026-01-26 2Y $69B, 2025-02-25 5Y $70B), so a `reopening:No` filter returns 28 — the 10-22 sibling attributed these to `original_security_term`, but the field that actually breaks a count is `reopening`, and their `original_cusip`/`original_issue_date` are self-consistent enough that "mis-tag" is **not established**; (c) an FRN **reopening** files as `security_term: 1-Year 11-Month`, a new issue as `2-Year`. **THE FINDING — the bill leg's pre-announced September cut is already spent.** `sb0590` verbatim: *"Treasury expects to implement reductions to shorter-dated bill auction sizes during the month of September"* and *"In October, Treasury anticipates increasing auction sizes across the bill curve"*, while *"expects to maintain current auction sizes in benchmark bills."* Measured (117-row 2026 bill pull): **6-week 95 → 85 (09-01) → 75 (09-08)**, **4-week 110 → 100 (08-27) → 90 (09-03)**, **8-week 100 → 90 → 85** — **−$55B across three tenors, complete nine days before this event**; 13-week **$92B** and 26-week **$79B** unchanged since the 06-29 quarter-turn. **Seasonal base rate, 3 of 3 years:** benchmarks flat through every mid-September announcement and stepping UP only at month-end/early October — 2023 13w 69 → 71 on **10-02**, 2024 76 → 79 on **09-30**, 2025 82 → 84 on **10-06**; 26w identical. 2026 matches 2024's front-loaded-cut-then-flat shape. **The two-sided risk, stated not resolved:** TGA closed **$903.9B on 09-03** (DTS) against `sb0590`'s **$950B** end-September assumption and a projected **$1.05T** late-October peak; the **09-15** corporate tax date closes the gap and added **+$190B in five sessions** in 2025 (667.6 → 857.7). **Two forward tests registered:** `-1` the seven-security composition + four sizes (composition informative, coupon half disclosed near-uninformative and NOT a restatement of `FT-…-10-22-1`, whose row is untouched), `-2` the bill leg holds at 92/79/≤75 — the one prediction here that contradicts a plain reading of the guidance. **The FRN leg is deliberately NOT re-researched** — `treasury-2y-frn-2026-09-23` (same day) owns its margin, index timing and kill switch; this doc claims only `R` + $28B, which is what makes this event that ledger's dated primary. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** payrolls **+162K vs ~53K** (09-04) reversed Waller's 09-03 dovish turn; FOMC blackout live 09-05 → **09-17**, this event landing on its final day, one day after the **09-16 decision** and one day before **triple witching**. An announcement publishes sizes, not rates — the decision does not touch it. **Rates (Treasury par, primary), 09-03 → 09-04:** 3-Mo 3.89 → **3.91** · 2Y 4.34 → **4.37** · 5Y 4.52 → **4.54** · 7Y 4.63 → **4.65** · 10Y 4.77 → **4.78** · 20Y 5.25 · 30Y 5.25 → **5.24**. **VIX 14.53** (09-04 close; 2026-09-05 is a **Saturday**, 09-07 Labor Day, next session 09-08). **Settlement:** the three notes ($183B) plus the 09-17 10Y TIPS all settle **Wed 09-30** — quarter-end, `government-funding-deadline-2026-09-30`, PCE, GDP-Q2-third. Recorded, not traded. **Policy:** `sb0607` (2026-08-19) doubled 10-20Y/20-30Y buyback caps through 11-04 without touching auction sizes. **Adjacency — 15 tracked entries already inside the ±5-day corridor; NO new dated event proposed.** All four securities this release sizes are already tracked (`treasury-2y-note-2026-09-22`, `treasury-5y-note-2026-09-23`, `treasury-7y-note-2026-09-24`, `treasury-2y-frn-2026-09-23`). The only untracked dated items in the corridor are the **09-21 13-/26-week and 09-22 6-week bill auctions**; the calendar does not track bill auctions, the 10-22 and 09-23 ledgers each declined to file one, and this session follows that precedent deliberately rather than by oversight — noted here so a later sweep can revisit it as a policy question, not rediscover it as a gap. | **Stance set** — scheduled nil, coupon sizes published; expect 69/70/44/28 plus a bill-leg **hold** at 92/79/≤75. The registrable content is the bill call, not the coupon sizes | 2026-09-12 (medium; D-12 sits in the 8+/7d band) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`) in the same PR. Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory.
