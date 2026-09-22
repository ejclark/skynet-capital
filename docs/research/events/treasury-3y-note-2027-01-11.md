# 3-Year Treasury Note auction — the leg that holds cycle position constant, and breaks it — treasury-3y-note-2027-01-11

**Kind:** rates · **Date:** 2027-01-11 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — row reads `3-Year NOTE / Thursday, January 07, 2027 / Monday, January 11, 2027 / Friday, January 15, 2027`, no `R` against the legend `R --denotes reopening`) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["eia-steo-2027-01-12","fomc-blackout-start-2027-01-16","ism-services-2027-01-07","opex-2027-01-15","treasury-10y-note-2027-01-12","treasury-30y-bond-2027-01-13","treasury-coupon-announcement-2027-01-07","treasury-coupon-announcement-2027-01-14"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/news_release/cpi.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/schedule/news_release/empsit.htm","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **This leg is a controlled experiment, and it kills the variable the family has been
reasoning with.** The 3-Year has been a **new issue on 212 of 212 auctions since 2009-01-07** —
`reopening` reads `No` every time — so *cycle position never varies for this security*. Its SOMA
add-on varies anyway: **$0.00B to $32.39B, with 27 outright zeros in 104 prints since 2018.** A
constant cannot explain that. The **confound is measurable**: 10-Year new issues occur only in
Feb/May/Aug/Nov, which are exactly the refunding-month settlements, and splitting *this* security
the same way gives **34/34 positive at a $16.35B mean** on those months against **43/70 at $2.61B**
everywhere else — with cycle position identical in all 104. The January sibling was right that the
add-on is arithmetic; two of its details are wrong and this document fixes both. **The
denominator is not "the block's three legs"** — it is *every coupon leg settling that day*, which
on **35 of 67** validated settlements was more than three; across **272 legs** the add-on share
matches the offering share to **0.0002 percentage points**. **And the query key is the security's
maturity date, not the settlement date** — settlement-date keying returns **$0.00B** for 2026-08-17
where the true pool is **$31.62B**, a 100% error, because Treasury rolls a weekend 15th to the next
business day. That correction has a **dated discriminator 64 days out**: SOMA holds **nothing**
maturing Monday **2026-11-16** but **$25.36B** maturing Sunday **2026-11-15**, so the two methods
predict **$0.00B and ~$25.4B** for the same November block. For January itself: only three coupon
legs settle **2027-01-15**, so this leg takes **48.74%** of a **$26.21B** TIPS pool — **~$12.9B on
~$70.9B total accepted**, the largest non-competitive award in the market. It still is not demand:
bid-to-cover is computed net of it on both sides (**10 of 10**, where total/total reads **2.278**
against a published **2.650**), and **corr(add-on, b/c) = −0.143** across the 30-auction $58B run —
a null measured on the one security whose add-on reaches **29% of its own offering**. Date is
`estimate`, `symbols: []`, and nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-124) | **Stand aside** | High | Nothing dated between now and **2027-01-07** publishes this auction's size, CUSIP or coupon, and the security does not exist until that announcement. `symbols: []`, date `estimate`, no rates-keyed house playbook. | Treasury running an off-cycle issuance action or a mid-quarter coupon-size change **before 2027-01-07** — the nominal coupon grid has not moved since **2024-04-09** |
| This week | **Stand aside — read the 2026-09-10 30-Year for a $0.00B add-on, nothing else** | High | SOMA holds **nothing** maturing **2026-09-15**, so every leg settling that day should take exactly zero. It is a free read on the mechanism this document rests on, four months before the event. | The **2026-09-10** print carrying **any** non-zero SOMA add-on — the pool reading fails on its own settlement date and legs 3–6 fall with it |
| This month | **Watch 2026-10-01 and 2026-10-06, don't act** | Medium | **10-01** announces the October block and **10-06** is the first *positive* out-of-sample test this family has had: the pool is a single TIPS (91282CDC2, **$2.82B**) and the arithmetic says the 3-Year takes **$1.376B** — a small non-zero, which fails both against $0.00B and against anything large. | The **2026-10-06** 3-Year printing an add-on of **$0.00B** or outside **$1.30–1.45B** — the level arithmetic is wrong at the one magnitude where the month-pattern story and this document disagree |
| This quarter | **Treat 2026-11-04 as the grid and 2026-11-09→11-12 as the method's trial; no directional view on any of it** | Medium | The refunding fixes the offering sizes the split divides by, and the November block is the **dated discriminator between two query keys**: SOMA holds **$0.00B** maturing 2026-11-16 and **$25.36B** maturing 2026-11-15. One method says zero, the other says ~$25.4B combined. | The three November legs taking a **combined $0.00B** — the maturity-date key this document introduces is wrong, and the January level is re-cut rather than patched |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an auction.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. Nothing here licenses an entry.
- **Cycle position is dead as an explanatory variable, and this leg is what kills it.** 212 of 212
  3-Year auctions since 2009 are new issues; the add-on still ranges **$0.00B–$32.39B**. What
  survives is the settlement calendar: refunding-month settlements **34/34 at $16.35B**, everything
  else **43/70 at $2.61B**.
- **The split law, correctly stated.** The coupon pool is allocated pro-rata by offering amount
  across **every coupon leg settling that day** — TIPS, 20-Years and FRNs included, not just the
  block's three. **67 settlements, 272 legs, max deviation 0.0002pp**, and **35 of the 67** had more
  than three legs. Registered as **FT-treasury-3y-note-2027-01-11-3**.
- **The query key is the maturity date.** Treasury settles a weekend 15th on the next business day;
  keying on the settlement date reads **$0.00B** for 2026-08-17 against a true **$31.62B**.
  Maturity-date keying validates on five settlements (**−0.17% / 0.00% / −0.01% / −0.00% /
  +0.02%**), three of them rolled.
- **The expected number is ~$12.9B on ~$70.9B total accepted** — **$26.21B** of two TIPS
  (912810PS1, 912828V49) maturing **2027-01-15** × **48.74%**, plus ~4.4 months of accretion.
  Registered as a **band** (**FT-…-2027-01-11-4**).
- **The biggest add-on in the market is still not demand.** Bid-to-cover matches
  `(tendered − SOMA) ÷ (accepted − SOMA)` on **10 of 10** recent prints where `total ÷ total` reads
  **2.278** against a published **2.650**; **corr(add-on, b/c) = −0.143** over the 30-auction $58B
  run, and splitting at $8B gives **2.575** (n=19) vs **2.572** (n=21). Registered as
  **FT-…-2027-01-11-5**.
- **Two dated tests before the event, both free.** **2026-10-06** (predicted **$1.376B**, a positive
  number, **FT-…-8**) and **2026-11-09→11-12** (predicted **$25.0–25.7B combined**, against the
  settlement-date key's **$0.00B**, **FT-…-7**).
- **The size is $58B and it is inferred until 2027-01-07** — the 34th consecutive $58B new issue
  since **2024-04-09** (30 completed through 2026-09-08). Registered as **FT-…-1**.
- **No CUSIP is predicted.** The shape is (new issue, dated 2027-01-15, maturing 2030-01-15, first
  coupon 2027-07-15) — **FT-…-6** — but the security does not exist until 2027-01-07.
- **The corridor is thin and the window is four days.** Eight tracked entries within ±5 days besides
  this one, **one** `high` (ISM Services **2027-01-07**) and it lands *before* the auction; FOMC
  **2027-01-26/27** carries **no SEP** and sits **D-16**; blackout starts **01-16**, after
  settlement. Tape: January 3-Year auction→settlement **6.0bp** (n=18) against **8.0bp** all-auction
  and a **6.7bp** ordinary four-session base rate.
- **Watch (dated):** 30-Year **2026-09-10 — expect $0.00B** · announcement **10-01**, **auction
  10-06 — the first positive test** · **refunding 11-04 — fixes the grid the split divides by** ·
  **the November block 11-09/11-10/11-12 — the method discriminator** · December block **12-07** ·
  **coupon announcement 2027-01-07 — size, CUSIP and the SOMA line all become published** · **this
  auction 1:00pm ET, Monday 01-11** · 10-Year **01-12** · 30-Year **01-13** · settlement **Friday
  01-15**.

## Initial research

### The question, plainly

Two sibling lanes proposed this event, and both framed it the same way: the 3-Year is the block's
biggest leg, it takes the biggest SOMA add-on, and someone should measure that. One of them went
further and named the thing worth measuring — *"the 3-Year's SOMA add-on is enormous and bimodal in
a way the long end's is not"* — and left it open on purpose.

The January 10-Year ledger, written the same day, had already established the machinery: the add-on
is not a cycle-position statistic to be averaged, it is `(SOMA coupons maturing at settlement) ×
(this leg's offering ÷ the block's offering)`. It refuted cycle position with **October**, whose
second reopenings average $0.64B where January's average $3.44B.

**The question this document asks is whether that refutation can be made airtight, and whether the
formula is stated correctly.** The 3-Year is the instrument for both, because it is the one security
in the family where **cycle position does not vary at all**.

Three readings follow:

1. Cycle position (new / first reopening / second reopening) **causes** the add-on.
2. The formula in the January 10-Year ledger — pool × (leg ÷ block) keyed on the **settlement
   date** — is right.
3. An add-on this large must leave *some* footprint on the demand metrics, even if bid-to-cover
   excludes it.

**One-line verdict.** Reading 1 is **refuted by construction, not by counter-example** — cycle
position is a constant here and the outcome ranges $0 to $32.39B. Reading 2 is **MIXED**: the
mechanism is right and the two operational details are both wrong, in ways that produce a 100% error
on a rolled settlement and an understated denominator on 35 of 67 settlements. Reading 3 is
**refuted on the hardest available case** — the largest add-ons in the market, up to 29% of an
offering, move bid-to-cover by nothing measurable.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded, not silently skipped). Everything below was
fetched **this session (2026-09-09)** and derived here:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain
  curl, HTTP 200, **17,195 bytes**; the four content streams inflated page by page and rows rebuilt
  from `Tm` coordinates, independently of both proposals.
- **Auction history** — `api.fiscaldata.treasury.gov` `auctions_query`. Two pulls: the 3-Year series
  (`original_security_term:eq:3-Year, security_type:eq:Note, auction_date:gte:2009-01-01`),
  **212 rows**; and an all-security pull on `issue_date:gte:2023-01-01`, **1,620 rows**, used for
  the split and roll work.
- **SOMA holdings** — `markets.newyorkfed.org/api/soma/tsy/get/all/asof/<date>.json`, HTTP 200, six
  as-of dates (**2026-09-02** — 433 rows — plus 2026-08-05, 2026-05-06, 2026-04-01, 2026-02-04 and
  2025-11-05 for the out-of-sample work).
- **FOMC dates** — `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, read directly
  rather than derived.
- **The tape** — `home.treasury.gov` daily par yield curve CSVs, one file per year **2009–2026**
  (18 files, **4,423 sessions**); **VIX** from `cdn.cboe.com`'s own `VIX_History.csv`.

**Three source notes, recorded rather than papered over.**

*TIPS separation.* `auctions_query`'s `security_type` returns TIPS as `Note`. A non-null
`ref_cpi_on_issue_date` separates them; every nominal statistic below is nominal-only, and where
TIPS legs are *deliberately included* (the split-law denominator) it is stated.

*Two fetches were blocked and are recorded, not substituted.*
`bls.gov/schedule/news_release/cpi.htm` and `.../empsit.htm` both returned **403** to this runner
even with a browser user-agent — the known blind spot
[`ppi-2026-11-13.md`](ppi-2026-11-13.md) documents, reproduced independently here. So **no January
2027 CPI or jobs date is proposed in this PR**, even though both plausibly fall inside this event's
±5-day corridor. Absence is stated, not guessed. Both are in `probe-ref.blocked`.

*No when-issued data exists.* Treasury publishes no tail. Every demand statement below is
bid-to-cover and bidder composition, and this ledger makes **no tail claim**. Bidder shares are
shares of **competitive** awards, with SOMA excluded from the denominator.

### Conviction legs, tested

**1. The date, security and settlement are what the calendar says — SUPPORTED, primary.** The
page-3 row reads verbatim `3-Year NOTE / Thursday, January 07, 2027 / Monday, January 11, 2027 /
Friday, January 15, 2027`, carrying **no `R`** against the page legend `R --denotes reopening` and
no `T` against `T --denotes TIPS`. Announcement is the **2027-01-07** coupon announcement. 1:00pm ET
is Treasury's standing convention and is **not** separately sourced. Status correctly stays
`estimate`: a tentative schedule is tentative by construction.

**2. Cycle position is a constant for this security, across eighteen years — SUPPORTED, and it is
what makes this leg an experiment rather than another data point.** `auctions_query` returns **212**
3-Year auctions from **2009-01-07** to **2026-09-08**, and `reopening` reads **`No` on all 212**.
Every `security_term` is `3-Year`; there is no `2-Year 10-Month` row anywhere in the series. One
proposal cited "zero of the 45 auctions since 2023-01-01" — the true series is 212 and the claim
holds across all of it.

**3. The add-on varies enormously anyway, so cycle position cannot be causal — REFUTED, by
construction.** Since 2018, across **104** prints with cycle position identical in every one:

| | Value |
|---|---|
| Positive add-on | **77 / 104** — so **27 outright zeros** |
| Mean (all) | **$7.10B** |
| Mean (positive only) | $9.59B |
| Maximum | **$32.39B** |

A variable that never moves cannot explain an outcome with that range. The January 10-Year ledger
refuted the cycle-position reading with a *counter-example* (October); this refutes it with a
*control*, which is the stronger form. What that ledger reported as `NEW issue 35/35 positive, mean
$12.35B` is therefore not a fact about newness.

**4. The confound is the settlement calendar, and it is measurable on this security — SUPPORTED.**
10-Year new issues occur **only** in February, May, August and November — the four refunding-month
settlements. Splitting this security's 104 prints on exactly that line, with cycle position held
constant:

| Settlement months | n | Positive | Mean add-on |
|---|---|---|---|
| **Feb / May / Aug / Nov (refunding)** | 34 | **34 / 34** | **$16.35B** |
| Everything else | 70 | 43 / 70 | **$2.61B** |

So "new issue" and "refunding-month settlement" are the same fact wearing two labels in the 10-Year
data, and only one of them survives when the labels are pulled apart. By settlement month the
pattern is orderly rather than bimodal — Feb **$14.92B**, May **$17.48B**, Aug **$19.05B**, Nov
**$13.26B**, against Mar **$1.41B**, Jun **$1.27B**, Sep **$0.98B**, Oct **$0.96B**, Dec **$1.35B**
and Jan **$5.09B**.

**5. The split law is real, far better validated than the family knew, and its denominator was
stated too narrowly — SUPPORTED with a correction.** The January 10-Year ledger validated
`leg ÷ block` on **three** settlement dates. Running it across **every** coupon settlement since
2023-01-01, with the denominator taken as *every coupon leg settling that day*:

| | Value |
|---|---|
| Coupon settlement dates with a non-zero award | **67** |
| Legs inside them | **272** |
| Of those dates, ones with **more than three** legs | **35** |
| **Max \|add-on share − offering share\|** | **0.0002 percentage points** |

The correction matters because 35 of 67 settlements are not three-leg blocks. **2026-08-31** is the
clean illustration: five coupon legs settled that day — 2-Year $69B, 5-Year $70B, 7-Year $44B,
20-Year $16B and a **30-Year TIPS** at $8B — and the $26.61B pool split **33.33 / 33.82 / 21.26 /
7.73 / 3.86%**, matching each leg's share of the $207B total to four decimals. A reader applying
"the block's offering" there would have divided by $183B and overstated every leg by 13%. **Bills
are a separate class with their own pool**: on 2026-06-30 `soma_holdings` reads **$30.99B** on the
coupon legs and **$16.79B** on the three 17-Week bill legs, which split their own pool the same way.
One honest exception is recorded: on the bill side a leg announced in a *prior* cycle can be
excluded (2023-01-19, a 52-Week reopening announced 01-10 took $0.00B while its 01-12 sibling took
$6.46B). No coupon-side instance of that appears in the 67.

**For 2027-01-15 the narrow and the correct denominators coincide** — only the 3-Year, 10-Year and
30-Year settle that day. The January 20-Year (auctioned 01-20) settles 01-22 and the 10-Year TIPS
(01-21) settles 01-29. So the divisor is **$119B** and this leg's share is **58 ÷ 119 = 48.74%**.

**6. The pool query key is the security's MATURITY date, not the settlement date — SUPPORTED, and
this is a correction with a 100% error behind it.** The January 10-Year ledger reads NY Fed SOMA for
"holdings maturing on the **settlement** date." That works only when the 15th is a business day.
When it is not, Treasury settles on the next business day and the holdings still mature on the 15th:

| SOMA as-of | Settlement | Securities mature | Pool by maturity-date key | Treasury `soma_holdings` | Error | Rolled? |
|---|---|---|---|---|---|---|
| 2026-04-01 | 2026-04-15 | 2026-04-15 | $21.07B | $21.10B | **−0.17%** | no |
| 2026-05-06 | 2026-05-15 | 2026-05-15 | $29.68B | $29.68B | **0.00%** | no |
| 2026-08-05 | **2026-08-17** | **2026-08-15** (Sat) | $31.62B | $31.62B | **−0.01%** | **yes** |
| 2026-02-04 | **2026-02-17** | **2026-02-15** (Sun) | $35.42B | $35.42B | **−0.00%** | **yes** |
| 2025-11-05 | **2025-11-17** | **2025-11-15** (Sat) | $21.77B | $21.77B | **+0.02%** | **yes** |

On the three rolled rows the settlement-date key returns **$0.00B** — SOMA lists **nothing**
maturing 2026-08-17, 2026-02-17 or 2025-11-17 — against true pools of $31.62B, $35.42B and $21.77B.
A ledger using it would have predicted zero and been wrong by the entire quantity. The residual
error on the two unrolled rows is TIPS accretion between the as-of date and maturity; the rolled
rows are nominal notes and carry none, which is why they match to the cent.

**2027-01-15 is a Friday**, so January is unaffected. What changes is the method every future pulse
in this family runs — and it has a dated trial, in leg 8.

**7. The January pool is published four months early, and it is coupons only — SUPPORTED,
primary.** NY Fed SOMA holdings as of **2026-09-02** list exactly **two** securities maturing
**2027-01-15**:

| CUSIP | Type | Par | Inflation compensation | Total |
|---|---|---|---|---|
| 912810PS1 | TIPS | $5.61B | $3.68B | $9.29B |
| 912828V49 | TIPS | $12.24B | $4.68B | $16.92B |
| **Total** | | **$17.85B** | **$8.36B** | **$26.21B** |

Two structural details the sibling could not see from its own leg. First, **no bill matures
2027-01-15** — SOMA's nearest is $3.20B maturing **2027-01-14**, which is precisely where the
schedule settles the 13-/26-week bills auctioned the same Monday as this note. So the two blocks are
separated by a day on the calendar, unlike 2026-01-15 where a $7.79B bill pool settled alongside the
$34.64B coupon pool. Second, a **$52B 3-Year note (91282CJT9, auctioned 2024-01-09) matures
2027-01-15 and SOMA holds none of it** — a QT-composition fact, and the reason the pool is TIPS-only.

Adding ~4.4 months of accretion on **$17.85B** of par gives a pool of **~$26.3–26.4B** across a
2–3% inflation range, so this leg's expected add-on is **~$12.85B** on a total accepted of
**~$70.85B**. The 10-Year's would be ~$8.6B and the 30-Year's ~$4.9B.

**8. The roll ratio is 100.0%, and the method correction has a dated trial 64 days out —
SUPPORTED.** Coupon-side rolled ÷ maturing has been **exactly 100.0% on all 16 non-zero coupon
settlements since 2025-12-31**, reproduced here independently of the sibling: 61–93% through
2025-12-01, then 100.0% on 12-31, 2026-01-15, 02-02, 02-17, 03-02, 03-16, 03-31, 04-15, 04-30,
05-15, 06-01, 06-30, 07-15, 07-31, 08-17 and 08-31. This is a **measurement**, not a policy reading;
no implementation note was fetched.

That makes November decisive. **2026-11-15 is a Sunday**, so the refunding block (3-Year 11-09,
10-Year 11-10, 30-Year 11-12) settles **Monday 2026-11-16**, and SOMA's book splits cleanly:

| Maturity date | What SOMA holds |
|---|---|
| 2026-11-15 (Sun) | **$25.36B** — three nominal notes (912810EY0, 912828U24, 91282CJK8) |
| 2026-11-16 (Mon, the settlement) | **nothing** |

The settlement-date key predicts a **$0.00B** combined add-on; the maturity-date key predicts
**~$25.4B**. The block-total prediction is **grid-independent** — it does not need the 2026-11-04
refunding to fix the sizes — which is why it is registered that way (**FT-…-7**). The per-leg
number does depend on the grid: at the standing 58/42/25 refunding shape the 3-Year's own share is
**46.40%**, or **~$11.8B**.

**9. October is the nearer test, and it is the first positive one this family has registered —
SUPPORTED.** Every free test the siblings have registered so far predicts **zero** (2026-09-15,
2026-12-15), which a "mid-quarter months are quiet" story also predicts. October separates them.
SOMA holds one coupon maturing **2026-10-15**: TIPS **91282CDC2**, $2.3096B par + $0.5130B
inflation compensation = **$2.8226B**, beside a $10.35B bill that funds the bill block. At 48.74%
the 2026-10-06 3-Year should take **$1.376B** on a total accepted of **$59.376B** — a *small
non-zero*, which fails against $0.00B and against anything large. Registered as **FT-…-8**, scoring
**27 days** from now.

**10. The largest add-on in the market is still not demand — REFUTED, on the hardest case
available.** Reconstructing the published bid-to-cover on the last ten 3-Year prints, only one
definition matches:

| Definition | Matches published b/c? |
|---|---|
| (total tendered − SOMA) ÷ (total accepted − SOMA) | **yes, to ±0.005 on 10 of 10** |
| competitive tendered ÷ competitive accepted | yes, to ±0.020 |
| total tendered ÷ total accepted | **no** — reads **2.278** where **2.650** was published (2026-01-12) |

The empirical check is what makes this leg the decisive one rather than a repetition. Across the
**30-auction $58B run**, **corr(add-on, bid-to-cover) = −0.143**; splitting at $8B gives b/c
**2.575** (n=19) against **2.572** (n=21), with indirect shares **61.3%** and **61.4%**. That null
is measured where an artefact would be easiest to find: this security's add-on reaches **$16.88B on
a $58B offering — 29% of the auction** — a ratio no other leg in the family approaches. If a
non-competitive award could flatter a headline demand metric anywhere, it would show up here.

**11. The size is $58B and it is inferred until 2027-01-07 — SUPPORTED.** The grid has printed
**$58B on 30 consecutive auctions** from **2024-04-09** through **2026-09-08** (the auction before
it was $56B, and the ramp steps 40-42-44-46-48-50-52-54-56 from 2023-07-11). With 10-06, 11-09 and
12-07 in between, **2027-01-11 would be the 34th**. Run statistics: bid-to-cover mean **2.612**,
σ **0.097**, range **2.43–2.85**, across clearing yields **3.440% → 4.659%**; competitive indirect
**64.6%** (54.0–78.2%), direct **21.0%**, dealer **14.4%**. The size is decided at the **2026-11-04**
quarterly refunding and merely *published* on 2027-01-07. This corroborates the December sibling's
"30 consecutive" count and confirms that one proposal's "16 consecutive from 2025-06-10" understates
the run.

**12. The security's shape is predictable, its identity is not — SUPPORTED.** All 24 most recent
3-Year notes mature on the **15th**, and the January lineage is unbroken: 2024-01-09 → matures
2027-01-15, 2025-01-06 → 2028-01-15, 2026-01-12 → 2029-01-15. So 2027-01-11 creates a **new**
3-Year dated **2027-01-15**, maturing **2030-01-15**, first coupon **2027-07-15**, term `3-Year`.
**No CUSIP is predicted** — it is assigned at the 2027-01-07 announcement.

**13. The Monday slot and the four-day window have exactly one precedent — SUPPORTED.** Of 212
3-Year auctions since 2009, **162 are Tuesdays**, 45 Mondays and 5 Wednesdays; of the 18 Januaries,
**13 are Tuesdays** and **4 Mondays** (2015, 2021, 2025, 2026), so 2027 would be the fifth and the
third consecutive. The auction-to-settlement gap is the rarer feature: January gaps run 3, 7, 8 or 9
calendar days, and **2027's four-day Monday→Friday shape has occurred once, in 2021-01-11** — also
a $58B offering, which cleared **2.520** with a **52.2%** indirect share, a **33.2%** dealer take and
an add-on of **$5.83B** at a 0.234% yield. The rate regime makes that a structural analogue and not
a demand comparable, and it is cited only as the former. The bracket is the PDF's own:
`Holiday - Friday, January 01, 2027 - New Year's Day` and `Holiday - Monday, January 18, 2027 -
Birthday of Martin Luther King, Jr.`

**14. The corridor is thin, and the FOMC is not in it — SUPPORTED.** Eight tracked entries sit
within ±5 days besides this event: **ISM Services 2027-01-07** (estimate, `high`), the **coupon
announcement 01-07**, **EIA STEO 01-12** (`low`), the **10-Year 01-12**, the **30-Year 01-13**, the
**coupon announcement 01-14** (which announces the *next* block — the 20-Year and 10-Year TIPS — not
this one), **opex 01-15** and **FOMC blackout start 01-16**. Only one is `high` and it lands
*before* the auction. `federalreserve.gov/monetarypolicy/fomccalendars.htm` (HTTP 200, last updated
2026-08-19) lists 2027's meetings as **January 26-27**, March 16-17\*, April 27-28, June 8-9\*, July
27-28, September 14-15\*, October 26-27 and December 7-8\*, with the asterisk marking a Summary of
Economic Projections — **January carries none**, and this auction sits **D-16** from the decision.

**15. The tape says the window is not the dangerous part, and the claim is the weak one —
SUPPORTED.** On 4,423 sessions of 3-Year par-curve data, 2009–2026:

| Cohort | n | Mean absolute 3-Year move |
|---|---|---|
| January 3-Year auctions, auction close → settlement close | 18 | **6.0 bp** |
| All 3-Year auctions, same window | 211 | 8.0 bp |
| Ordinary four-session roll | 4,419 | 6.7 bp |
| January 3-Year **auction day** | 18 | **2.4 bp** |
| All 3-Year auction days | 212 | 3.4 bp |
| Ordinary session | 4,422 | 3.5 bp |

Two confounds are named rather than argued away: n=18 is small, and early January is seasonally
quiet for reasons unrelated to this auction. The claim is therefore **an absence of precedent for
this window being dangerous**, not an effect. It corroborates the 10-Year sibling's parallel finding
on its own leg rather than adding to it.

**16. The tape going in is calm, and 124 days stale by construction — SUPPORTED, primary.** Par
curve at the **2026-09-08** close: 2Y **4.39** · **3Y 4.44** · 5Y **4.57** · 10Y **4.80** · 20Y
**5.26** · 30Y **5.25**. **VIX 15.72** at the 09-08 close (CBOE's own history file) against
**14.53** on 09-04; the **09-07 bar (15.30) is a Labor Day closure artifact and is not adopted** —
the same flag the November, December and January siblings raised, reproduced independently here.
None of this forecasts 2027-01-11; it is the baseline the next pulse diffs against, recorded
mechanically in the probe-ref line above.

### What plays the conditions support

None directional. `symbols: []`, the date is `estimate`, and no house playbook is rates-keyed. As
with the January 10-Year, there is no corridor guard either — eight `medium`/`low` neighbours, one
`high` landing before the auction, a four-day settlement window and a **6.0bp** January tape against
a **6.7bp** base rate leave nothing here to be flat *through*.

What this document produces instead is a **reading, and a repair**. When the 2027-01-07 announcement
lands and the 2027-01-11 auction prints a total accepted near **$70.9B** on a **$58B** offering,
roughly **$12.9B** of that is the Federal Reserve rolling two maturing TIPS, allocated by a ratio
that has held to four decimals on 272 legs. That is the largest such award in the market and the
easiest number in this family to misread as demand — and it cannot be demand, because the metric it
would flatter excludes it on both sides.

The repair is worth more than the reading, because it survives this event. Anyone in this family
who reasons from *cycle position* is reasoning from a variable that is constant on the security
where it is easiest to check; anyone who queries SOMA on the *settlement* date will read **$0.00B**
on three of the last six blocks and be wrong by the whole quantity. Both errors are cheap to fix
now, and both get a dated trial before this event runs.

### Honest limits

The **2027-01-07** coupon announcement, this auction's when-issued yield, its CUSIP and its coupon
**do not exist yet**; the size is a grid inference until then and the grid itself is set at the
**2026-11-04** refunding. The split law is validated on **272 legs across 67 settlements** but
entirely within the post-2023 window this session pulled, and it has one recorded exception on the
**bill** side (2023-01-19) whose coupon-side analogue has not been observed — the law is therefore
stated as "no coupon-side instance in 67," not "impossible." The **100.0% roll ratio is an
observation over 16 settlements**, not a policy document this session read; a return to partial
redemption breaks the *level* while leaving the *split* intact, which is why they are registered
separately. The accretion adjustment from a 2026-09-02 as-of date to a 2027-01-15 settlement is an
**estimate**, which is why FT-4 is banded at ±$1B rather than pointed, and SOMA's book can change
between now and then — the pool is re-read from the NY Fed file on every pulse, never assumed
constant. The maturity-date correction is validated on **five** settlements, three of them rolled;
it is a rule inferred from Treasury's behaviour, not from a published Treasury statement about how
`soma_holdings` is computed. Leg 15's January quiet is **n=18** and confounded with early-January
seasonality. Bid-to-cover is a demand proxy; Treasury publishes no when-issued quote, so this ledger
makes **no tail claim**. The par-curve measurements are close-to-close constant-maturity yields, not
the on-the-run note and not intraday marks around 1:00pm, so they measure the *session*. Two fetches
were **blocked** (bls.gov, 403 ×2) and are recorded in `probe-ref.blocked`; no January CPI or jobs
date is proposed as a result. Nothing here forecasts a clearing yield or a policy outcome — every
claim is about **structure, size and the mechanics of a non-competitive award**.

## Stance & kill switches

**Stance (date `estimate`; size, CUSIP, coupon and block confirmation all `estimate`/inference until
2027-01-07).** No position, and no corridor guard. This leg's value to the family is that it is a
**control**: the 3-Year has been a new issue on **212 of 212** auctions since 2009, so cycle position
cannot explain an add-on that ranges **$0.00B to $32.39B** with **27 zeros in 104** prints. What the
data does explain it with is the settlement calendar — refunding-month settlements **34/34 at
$16.35B** against **43/70 at $2.61B** elsewhere, with cycle position identical throughout — which
means the sibling's `NEW issue 35/35, mean $12.35B` was a statement about Feb/May/Aug/Nov dates
wearing a cycle-position label.

The mechanism the January 10-Year ledger identified is **right and is corrected twice here**. The
coupon pool is allocated pro-rata by offering amount across **every coupon leg settling that day** —
not the block's three, which understates the denominator on **35 of 67** validated settlements —
holding to **0.0002 percentage points** across **272 legs**. And the pool is queried on the
security's **maturity date**, not the settlement date: Treasury rolls a weekend 15th to the next
business day, so settlement-date keying reads **$0.00B** for 2026-08-17, 2026-02-17 and 2025-11-17
against true pools of **$31.62B**, **$35.42B** and **$21.77B**.

For January itself the two denominators coincide — only the 3-Year, 10-Year and 30-Year settle
**2027-01-15** — so this leg takes **48.74%** of a **$26.21B** two-TIPS pool: **~$12.85B on a
~$70.85B total accepted**, the largest non-competitive award in the market, on a Friday settlement
one day after the bill block's. It is still not demand: bid-to-cover matches
`(tendered − SOMA) ÷ (accepted − SOMA)` on **10 of 10** prints where `total ÷ total` reads **2.278**
against a published **2.650**, and **corr(add-on, b/c) = −0.143** across the 30-auction $58B run —
a null measured where the add-on reaches **29% of the offering**.

Two dated trials land before the event and both are free: **2026-10-06** (a *positive* prediction,
**$1.376B**, which no month-pattern story produces) and **2026-11-09→11-12**, where the two query
keys predict **$0.00B** and **~$25.4B** for the same block. `symbols: []`: no symbol-keyed action
exists to take.

**Predictions registered with a score-by date** (per the TEMPLATE rule, these also register in
[`forward-tests/treasury-3y-note-2027-01-11.md`](../forward-tests/treasury-3y-note-2027-01-11.md)):

- **FT-treasury-3y-note-2027-01-11-1** — the 2027-01-07 coupon announcement announces the 3-Year at
  **$58 billion**, the 34th consecutive $58B new issue since 2024-04-09.
- **FT-treasury-3y-note-2027-01-11-2** — the announced block holds its predicted shape: 3-Year
  **Monday 01-11**, 10-Year **Tuesday 01-12**, 30-Year **Wednesday 01-13**, all settling **Friday
  2027-01-15**.
- **FT-treasury-3y-note-2027-01-11-3** — **the split law, with the corrected denominator.** The
  3-Year's add-on is **48.4%–49.1%** of the total SOMA award across *every* coupon leg settling
  2027-01-15, matching its offering share of that same set.
- **FT-treasury-3y-note-2027-01-11-4** — **the level.** Total accepted on 2027-01-11 is
  **$69.85B–$71.85B** (add-on **$11.85B–$13.85B**). A band: it fails high *and* low.
- **FT-treasury-3y-note-2027-01-11-5** — **the demand null on the hardest case.** Despite an ~$12.9B
  add-on — ~22% of the offering — the auction clears bid-to-cover **inside 2.43–2.85** *and* an
  indirect share **at or above 54.0%** (the $58B-run floor).
- **FT-treasury-3y-note-2027-01-11-6** — the security created is a **new issue**: term `3-Year`,
  dated **2027-01-15**, maturing **2030-01-15**, first coupon **2027-07-15**. No CUSIP is predicted.
- **FT-treasury-3y-note-2027-01-11-7** — **the method discriminator, 64 days early and
  grid-independent.** The three November legs (11-09, 11-10, 11-12) settling **2026-11-16** take a
  **combined** SOMA add-on of **$25.0B–$25.7B**, from three notes maturing **Sunday 2026-11-15** —
  not the **$0.00B** a settlement-date key returns.
- **FT-treasury-3y-note-2027-01-11-8** — **the first positive near-term test, 27 days early.** The
  2026-10-06 3-Year takes an add-on of **$1.30B–$1.45B** on a total accepted of **$59.30B–$59.45B**,
  from TIPS 91282CDC2 ($2.8226B) × 48.74%. It fails at **$0.00B**, which is what a "mid-quarter
  months are quiet" reading predicts.

**Kill switches:**

- **The November block (2026-11-09/11-10/11-12) taking a combined $0.00B add-on** — the
  maturity-date key is wrong, leg 6 falls, FT-7 dies, and every level number in this document is
  re-cut. This is the single observation most likely to invalidate the correction, and it lands
  **64 days** before the event.
- **The 2026-10-06 3-Year printing $0.00B, or an add-on materially outside $1.30–1.45B** — the pool
  arithmetic fails at the one magnitude where it and the month-pattern story disagree; FT-8 dies and
  FT-4's band is re-cut rather than patched.
- **Any coupon leg being added to the 2027-01-15 settlement** — a 20-Year, a TIPS or an FRN moved
  into that date enlarges the denominator and cuts this leg's **48.74%** share directly. Leg 5 is
  why this is a named switch rather than a footnote: 35 of 67 validated settlements carried more
  than three legs.
- **The 2026-11-04 refunding statement moving the 3-Year off $58B, the 10-Year off $39B or the
  30-Year off $22B**, or dropping *"maintain nominal coupon and FRN auction sizes for at least the
  next several quarters"* — FT-1 dies and FT-3, FT-4 and FT-7's per-leg reading are re-cut.
- **A coupon settlement between now and 2027-01-15 rolling at less than 100%** — the next chances
  are **2026-09-30**, **2026-10-15** and **2026-10-31**. This kills FT-4's level while leaving FT-3's
  split law standing, which is why they are registered separately.
- **SOMA selling, restructuring or adding to its 2027-01-15 holdings** — an outright sale, a change
  in reinvestment allocation away from a maturity-matched roll, or a security acquired into that
  date. The pool is re-read from the NY Fed file on every pulse, not assumed constant.
- **The 2027-01-07 announcement moving the 3-Year off Monday 2027-01-11, or breaking the Friday
  01-15 settlement** — leg 13's shape dissolves and FT-2 dies; a different settlement date changes
  the maturing pool entirely and voids FT-3, FT-4 and FT-5 with it.
- **A 3-Year auction printing `reopening: "Yes"`** — the 212/212 control that legs 2 and 3 rest on
  breaks, and this document stops being an experiment and becomes another data point.
- **The 2026-10-06, 2026-11-09 or 2026-12-07 auction clearing outside 2.43–2.85** — the 30-auction
  $58B demand band FT-5 chains to breaks and is re-cut before the next pulse.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-124 | **Initial research banked** (doc above). **Canonical file written by this session** — the event existed only as `proposals/treasury-3y-note-2027-01-11.from-treasury-10y-note-2027-01-12.json` and `...from-treasury-30y-bond-2027-01-13.json`, both read in full first per EVENT-RESEARCH.md and both left in place. **Schedule primary-verified independently of both:** the Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, four streams inflated per page, rows rebuilt from `Tm` coordinates) reads `3-Year NOTE / Thursday, January 07, 2027 / Monday, January 11, 2027 / Friday, January 15, 2027`, no `R`, no `T`; announced by the **2027-01-07 coupon announcement**; status stays `estimate`; **no CUSIP predicted**. **FINDING 1 — THIS LEG IS A CONTROL, AND THE CONTROL KILLS CYCLE POSITION (legs 2–4).** `auctions_query` returns **212** 3-Year auctions from 2009-01-07 to 2026-09-08 and `reopening` reads **`No` on 212 of 212** — one proposal's "45 since 2023" understates the series. So cycle position is a CONSTANT here, yet the add-on since 2018 runs **$0.00B–$32.39B, 77/104 positive, 27 outright zeros, mean $7.10B**. A variable that never moves cannot explain that range; the January 10-Year ledger refuted cycle position with a counter-example (October), this refutes it with a control. **THE CONFOUND IS NAMED AND MEASURED:** 10-Year new issues occur only in Feb/May/Aug/Nov — the refunding-month settlements — and splitting THIS security on the same line gives **34/34 positive at $16.35B** against **43/70 at $2.61B**, cycle position identical in all 104. By settlement month: Feb $14.92B, May $17.48B, Aug $19.05B, Nov $13.26B vs Mar $1.41B, Jun $1.27B, Sep $0.98B, Oct $0.96B, Dec $1.35B, Jan $5.09B. So the sibling's `NEW issue 35/35 positive, mean $12.35B` is a fact about DATES wearing a cycle-position label. **FINDING 2 — THE SPLIT LAW'S DENOMINATOR WAS STATED TOO NARROWLY, AND THE LAW IS FAR BETTER VALIDATED THAN THREE DATES (leg 5).** The pool is allocated pro-rata across **every coupon leg settling that day**, not the block's three: **67 coupon settlements since 2023-01-01, 272 legs, MAX deviation 0.0002 percentage points**, and **35 of the 67 carried MORE than three legs**. 2026-08-31 is the illustration — five legs (2Y $69B, 5Y $70B, 7Y $44B, 20Y $16B, **30Y TIPS $8B**) split a $26.61B pool 33.33/33.82/21.26/7.73/3.86%, matching shares of $207B; dividing by the three-leg $183B would overstate every leg by 13%. **Bills are a separate class with their own pool** (2026-06-30: `soma_holdings` $30.99B on coupon legs, $16.79B on three 17-Week bill legs, each splitting its own). One honest exception recorded, bill-side only: 2023-01-19, a 52-Week reopening announced 01-10 took $0.00B while its 01-12 sibling took $6.46B — no coupon-side analogue in the 67. **For 2027-01-15 the narrow and correct denominators coincide** (the 20-Year settles 01-22, the 10-Year TIPS 01-29), so the divisor is $119B and this leg's share is **58/119 = 48.74%**. **FINDING 3 — THE POOL QUERY KEY IS THE MATURITY DATE, NOT THE SETTLEMENT DATE, AND THE SIBLING'S IS WRONG BY 100% ON A ROLLED SETTLEMENT (leg 6).** Treasury settles a weekend 15th on the next business day; the holdings still mature on the 15th. Maturity-date keying validates on five out-of-sample settlements — 2026-04-15 **−0.17%**, 2026-05-15 **0.00%**, **2026-08-17 −0.01%**, **2026-02-17 −0.00%**, **2025-11-17 +0.02%** — three of them rolled, where the settlement-date key returns **$0.00B** against true pools of **$31.62B / $35.42B / $21.77B**. 2027-01-15 is a Friday so January is unaffected; what changes is the METHOD every future pulse in this family runs. **FINDING 4 — THE JANUARY POOL IS PUBLISHED, COUPONS ONLY, AND STRUCTURALLY CLEANER THAN 2026's (leg 7).** NY Fed SOMA as of **2026-09-02** (HTTP 200, 433 rows) lists exactly two securities maturing **2027-01-15**, both TIPS — **912810PS1** ($5.61B par + $3.68B infl) and **912828V49** ($12.24B + $4.68B) — **$26.21B** together. **No bill matures that day**; SOMA's nearest is $3.20B on **2027-01-14**, exactly where the schedule settles the 13-/26-week bills auctioned the same Monday — so the two blocks are separated by a calendar day, unlike 2026-01-15's $7.79B bill pool settling alongside. And a **$52B 3-Year note (91282CJT9, auctioned 2024-01-09) matures 2027-01-15 with SOMA holding NONE of it** — the QT-composition fact that makes the pool TIPS-only. With ~4.4 months of accretion on $17.85B par the pool is **~$26.3–26.4B**, so **this leg's add-on is ~$12.85B on a ~$70.85B total accepted** (10-Year ~$8.6B, 30-Year ~$4.9B). **FINDING 5 — THE ROLL RATIO IS 100.0% AND NOVEMBER IS THE METHOD'S DATED TRIAL (leg 8).** Coupon-side rolled ÷ maturing is **exactly 100.0% on all 16 non-zero coupon settlements since 2025-12-31** (12-31, 01-15, 02-02, 02-17, 03-02, 03-16, 03-31, 04-15, 04-30, 05-15, 06-01, 06-30, 07-15, 07-31, 08-17, 08-31), reproduced independently of the sibling and recorded as a measurement, not a policy reading. **2026-11-15 is a SUNDAY**, so the refunding block settles **Monday 2026-11-16**, and SOMA holds **NOTHING** maturing 11-16 against **$25.36B** maturing 11-15 (three nominal notes 912810EY0, 912828U24, 91282CJK8). The two query keys therefore predict **$0.00B** and **~$25.4B** for the same block — grid-independent at the block level, ~$11.8B for the 3-Year at the standing 58/42/25 refunding shape. **FINDING 6 — OCTOBER IS THE FIRST *POSITIVE* FREE TEST THIS FAMILY HAS REGISTERED (leg 9).** Every prior free test predicts zero (2026-09-15, 2026-12-15), which a "mid-quarter months are quiet" story also predicts. SOMA holds one coupon maturing **2026-10-15** — TIPS **91282CDC2**, $2.3096B par + $0.5130B infl = **$2.8226B** — beside a $10.35B bill funding the bill block, so at 48.74% the **2026-10-06** 3-Year should take **$1.376B** on a **$59.376B** total accepted. Fails at $0.00B and fails large. **FINDING 7 — THE BIGGEST ADD-ON IN THE MARKET IS STILL NOT DEMAND, AND THIS IS THE HARDEST CASE THERE IS (leg 10).** On the last ten 3-Year prints only **(total tendered − SOMA) ÷ (total accepted − SOMA)** matches published b/c (±0.005 on 10/10); `total ÷ total` reads **2.278** where **2.650** was published on 2026-01-12. Across the **30-auction $58B run corr(add-on, b/c) = −0.143**; splitting at $8B gives **2.575** (n=19) vs **2.572** (n=21), indirect **61.3%** vs **61.4%**. The null is measured where the add-on reaches **$16.88B on a $58B offering — 29% of the auction**, a ratio no other leg approaches. **SIZE (leg 11): $58B, the 34th consecutive since 2024-04-09** — 30 completed through 2026-09-08 (the prior auction was $56B; the ramp steps 40→56 from 2023-07-11), with 10-06, 11-09 and 12-07 in between. Run stats: b/c mean **2.612**, σ **0.097**, range **2.43–2.85**, yields **3.440–4.659%**, competitive indirect **64.6%** (54.0–78.2%), direct **21.0%**, dealer **14.4%**. This corroborates the December sibling's "30 consecutive" and confirms one proposal's "16 consecutive from 2025-06-10" understates the run. **SECURITY SHAPE (leg 12):** all 24 recent 3-Years mature on the 15th and the January lineage is unbroken (2024-01-09 → matures 2027-01-15, 2025-01-06 → 2028-01-15, 2026-01-12 → 2029-01-15), so this creates a NEW 3-Year dated **2027-01-15**, maturing **2030-01-15**, first coupon **2027-07-15**. **STRUCTURE (leg 13):** of 212 auctions **162 are Tuesdays**, 45 Mondays, 5 Wednesdays; of 18 Januaries **13 Tuesdays, 4 Mondays** (2015, 2021, 2025, 2026) — 2027 would be the fifth and third consecutive. The four-day Monday→Friday gap has **one precedent, 2021-01-11** (also $58B; cleared 2.520, indirect 52.2%, dealer 33.2%, add-on $5.83B at 0.234% — a structural analogue, NOT a demand comparable, and cited only as the former). Bracketed by the PDF's own `Holiday - Friday, January 01, 2027 - New Year's Day` and `Holiday - Monday, January 18, 2027 - Birthday of Martin Luther King, Jr.`; 13-/26-week bills share the Monday but settle **01-14**. **Adjacency sweep — peers:** n/a (`symbols: []`). **Macro/corridor:** **eight** tracked entries within ±5 days besides this one — ISM Services **01-07** (estimate, `high`, and it lands BEFORE the auction), coupon announcement **01-07**, EIA STEO **01-12** (`low`), 10-Year **01-12**, 30-Year **01-13**, coupon announcement **01-14** (which announces the NEXT block, the 20-Year and 10-Year TIPS, not this one), opex **01-15**, FOMC blackout start **01-16**. **NO untracked dated adjacency was found in the corridor, so this PR proposes no new event file** — `treasury-coupon-announcement-2027-01-07` already exists as the 10-Year sibling's proposal and is deliberately not duplicated (#1717's competing-proposal warning). **FOMC read directly rather than derived:** `fomccalendars.htm` (HTTP 200, last updated 2026-08-19) lists 2027 as Jan 26-27, Mar 16-17\*, Apr 27-28, Jun 8-9\*, Jul 27-28, Sep 14-15\*, Oct 26-27, Dec 7-8\* — **January carries no asterisk and therefore no SEP**, and this auction sits **D-16**. **CROSS-FAMILY SWEEP OBSERVATION, no proposal (all three ids tracked):** SOMA holds **$20.39B** of coupons maturing **2026-12-31** (91282CDQ1 $7.74B, 912828YX2 $11.97B, 91282CME8 $0.68B), which is the settlement date of the year-end 2-/5-/7-Year block auctioned 12-28 and 12-29 — and per Finding 2 the denominator there also includes the **5-Year TIPS auctioned 12-22**, which settles 12-31. Those ledgers should not read that block as quiet. **Volatility:** **VIX 15.72** (09-08 close, CBOE's own `VIX_History.csv`, HTTP 200) vs **14.53** on 09-04; the **09-07 bar (15.30) is a Labor Day closure artifact, flagged and not adopted**. **Rates:** par curve **09-08** — 2Y **4.39** · **3Y 4.44** · 5Y **4.57** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**. **Tape (leg 15), 4,423 sessions 2009–2026:** January 3-Year auction→settlement mean absolute 3-Year move **6.0bp** (n=18) vs **8.0bp** all auctions (n=211) and a **6.7bp** ordinary four-session base rate; auction day **2.4bp** (Jan) vs **3.4bp** (all) and **3.5bp** (ordinary). Confounds named: n=18 and early-January seasonality — stated as an **absence of precedent**, not an effect. **Geopolitical:** nothing new touching this event. **BLOCKED SOURCES, recorded not substituted:** `bls.gov/schedule/news_release/cpi.htm` and `.../empsit.htm` both **403** to this runner even with a browser user-agent (the known blind spot `ppi-2026-11-13.md` documents, reproduced independently), so **no January 2027 CPI or jobs date is proposed** — both entries are in `probe-ref.blocked`. Every other fetch this session returned HTTP 200. **FT-…-2027-01-11-1** ($58B, scores 2027-01-07), **-2** (block shape, 2027-01-07), **-3** (the split law with the CORRECTED denominator — 48.4–49.1% of the award across every coupon leg settling 01-15, scores 2027-01-13), **-4** (the level: total accepted $69.85–71.85B, a band, scores 2027-01-11), **-5** (b/c inside 2.43–2.85 AND indirect ≥54.0%, scores 2027-01-11), **-6** (new issue dated 2027-01-15, matures 2030-01-15, first coupon 2027-07-15, scores 2027-01-07), **-7** (**the method discriminator**: the November block takes $25.0–25.7B combined, not $0.00B, scores 2026-11-12) and **-8** (**the first positive near-term test**: 2026-10-06 takes $1.30–1.45B, scores 2026-10-06) **registered**. | **Stance set** — no position and no corridor guard, and what the leg contributes is a *repair* rather than a reading. Cycle position is dead as an explanatory variable: this security has been a new issue 212 times out of 212 and its add-on still ranges $0.00B to $32.39B, so the family's `NEW issue 35/35, mean $12.35B` was a statement about Feb/May/Aug/Nov settlement dates all along (34/34 at $16.35B here, against 43/70 at $2.61B elsewhere, with cycle position constant). The sibling's mechanism is right and both of its operational details are wrong — the denominator is every coupon leg settling that day (35 of 67 settlements carried more than three; 272 legs match to 0.0002pp) and the query key is the maturity date, not the settlement date (a 100% error on three of the last six blocks). For January the corrections leave the answer intact: **48.74% of a $26.21B TIPS pool, ~$12.9B on ~$70.9B**, the market's largest non-competitive award and still not demand (corr = −0.143 where the add-on reaches 29% of the offering). Both corrections get a dated trial before the event — **2026-10-06** and **2026-11-09→11-12** — which is the point of registering them. `symbols: []`, so no symbol-keyed action exists | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-3y-note-2027-01-11.json` (`status:
"estimate"`) in the same PR — your own file, never another event's canonical one (#1717). Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory — after
which this doc goes quiet.
