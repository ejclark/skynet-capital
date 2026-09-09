# 2-Year Floating Rate Note auction (second and final reopening of the October new issue) — treasury-2y-frn-2026-12-23

**Kind:** rates · **Date:** 2026-12-23 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer inflated and re-tokenised direct 2026-09-09 — the row reads `2-Year FRN R / Thursday, December 17, 2026 / Wednesday, December 23, 2026 / Monday, December 28, 2026`; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-decision-2026-12-18","boj-minutes-2026-12-23","boj-summary-of-opinions-2026-12-28","christmas-eve-half-day-2026-12-24","christmas-market-closure-2026-12-25","consumer-confidence-2026-12-22","durable-goods-2026-12-23","gdp-q3-2026-third-2026-12-23","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","japan-cpi-tokyo-flash-2026-12-25","new-home-sales-2026-12-23","opex-2026-12-18","pce-2026-12-23","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28","sp-quarterly-rebalance-effective-2026-12-21","treasury-20y-bond-2026-12-23","treasury-5y-tips-2026-12-22","treasury-coupon-announcement-2026-12-24"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This event was proposed as a discriminating test and it is not one — the question it was
meant to settle was already settled by the tape, and finding that out is the session's most valuable
output.** The parent ledger put 2026-12-23 forward as the date where a same-day *congestion* rule
(11:30 a.m.) and a *holiday* rule (1:00 p.m.) disagree. But **December 23 is itself the natural
experiment**: four prior FRN auctions have landed on that exact date with the holiday held constant, and
the closing time tracks the same-day **bill count** 4 of 4 — 2014 (one bill → 11:30), 2015 (zero →
11:30), 2020 (two CMBs → 1:00 p.m.), 2025 (two bills → 1:00 p.m.). The holiday reading is **2 of 4 on
its own best date**. What replaces it is sharper than the parent's rule: across **2,227 auction days and
4,639 auctions since 2014**, Treasury's 11:30 a.m. competitive window has **never held more than two
securities** — the per-day distribution is exactly **{0: 264, 1: 626, 2: 1337, 3+: zero}**. The FRN's
slot follows deterministically: two other securities already in that window → 1:00 p.m. (**16/16**);
fewer → the morning (**138/138**). **154/154, no exceptions**, where the parent's auction-count rule is
148/154. This date carries three auctions but only **one bill**, so → **11:30 a.m.** Its index is
**2026-12-21**, forced by two settlement dates and, unlike 11-24, set *after* its own announcement.
Date is `estimate`, `symbols: []`, nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-105) | **Stand aside** | High | `symbols: []`, the date is `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed, and the $28B size is already published (`sb0590`'s FRN column; 12 consecutive reopenings at exactly $28.00B since 2025-03-26). Nothing dated before the **2026-10-28** new issue can reach this auction. | Treasury revising the 12-17 / 12-23 / 12-28 schedule row, or running an off-cycle FRN action, **before 2026-12-17** — the event's shape, not its stance, is what would have changed |
| This week | **Stand aside — and retire the "12-23 is a discriminating test" framing the parent registered** | High | The holiday rule needs no forward auction to kill it: the four prior 12-23 FRN auctions vary in closing time exactly with the same-day bill count while the holiday is fixed. The 12-23 print is now a **confirmation**, not a discriminator, and should be sized as one. | A **primary Treasury document** stating a closing-time rule keyed to holidays or short weeks — the window-capacity reading is a description of published times, not a policy Treasury has ever stated |
| This month | **Watch 2026-10-28 for the number this auction inherits, not for anything about this auction** | Medium-high | 31 CFR 356 (read this session) makes spread inheritance a **definition**, not a base rate: *"the spread will be equal to the high discount margin at the time a new floating rate note is auctioned."* 10-28 stamps the spread this reopening and 11-24 both carry — the last ~$28B of the ~$86B block. | A **2026-10-28 `spread` that does not equal that auction's own `high_discnt_margin`** — the regulation is not being applied as written and the whole inheritance frame is rebuilt, not patched |
| This quarter | **Read this print for its closing time and its margin band; expect no Christmas concession, but a band twice as wide as the sibling's** | Medium | The concession is a **leg** effect, not a calendar one: paired within-CUSIP, a second reopening clears **+1.31bp** wider than the first (n=50, **t = 3.14**) — but the effect **vanishes since 2021-06** (+0.36bp, t = 0.80). December second reopenings are a mean-null vs other second reopenings (t = 0.76) with **~4× the variance** (sd 7.14 vs 3.64). | The margin landing more than **8.0bp** from the spread 2026-10-28 stamps — the leg-2 dispersion this ledger measures is understated and the band is re-derived before 2027's block |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, no house playbook is rates-keyed.
  Zero capital is at stake in anything below.
- **The headline correction: 2026-12-23 is not a discriminating observation.** The four prior 12-23 FRN
  auctions settle the congestion-vs-holiday question **4 of 4** with the holiday held constant. The
  parent registered this date as a live test; this ledger demotes it to a confirmation, on the record.
- **The mechanism is window capacity, not auction count.** The 11:30 a.m. window has never held more
  than two securities in **2,227 auction days** — `{0: 264, 1: 626, 2: 1337, 3+: zero}`. Two others in
  it → the FRN takes 1:00 p.m. (**16/16**); fewer → morning (**138/138**). **154/154.**
- **It absorbs every exception the parent had to name.** 2014-04-29, 2020-12-23, 2021-01-27 and
  2022-07-14 are all two-bill days; 2020-05-27's 10:00 a.m. CMBs left one security at 11:30;
  2019-12-06 (11:00 AM) is a one-auction day the parent's 149/154 tally silently dropped (its own
  cross-tab shows it — the honest count for that rule is **148/154**).
- **So the forward input is the same-day BILL count, not the auction count.** Coupons close 1:00 p.m.
  (Bonds **260/261**, Notes 838/1,039); bills close 11:30 (**3,102/3,339**).
- **This date: three auctions, one bill → 11:30 a.m.** Slate is `2-Year FRN R · 20-Year BOND R ·
  17-Week BILL`. Two independent corroborations: an FRN sharing a day with any Bond is **5/5 at 11:30**
  (twice with a 20-Year), and an FRN sharing with a 17-Week bill is **36/37**.
- **The index is 2026-12-21, and this time it is the ordinary ordering.** The Monday 12-21 bill settles
  12-24, four days before this FRN's 12-28 settlement; the next bill (12-28) settles 12-31, after.
  Unlike 11-24, the index is set **after** the 12-17 announcement.
- **31 CFR 356 is now read, closing two standing limits.** Spread inheritance is a **definition**
  (51/51 and 103/103 are the regulation being obeyed); the settlement-precedence rule's mechanism is the
  **two-business-day lockout** in Appendix B §I.C, not a fitted regularity.
- **A fit correction:** the parent's index rule as literally written scores **151/154** here, not
  152/154 — the extra miss (2019-12-18) used a bill auctioned *five days after* the FRN. Requiring the
  index bill to be auctioned no later than the FRN restores **152/154** and the parent's own two misses.
  **The 11-24 answer is unchanged.**
- **The demand result is about the leg, not Christmas.** Leg 1 **+0.23bp** (sd 2.80) vs leg 2
  **+1.54bp** (sd 4.68); paired within-CUSIP **+1.31bp, t = 3.14**, positive in 32 of 50 cycles —
  **and gone since 2021-06** (t = 0.80). Recorded, not traded.
- **The band that follows:** the sibling's ±4.0bp holds only **5 of 12** December second reopenings.
  **±8.0bp** holds 9/12, and 20/21 on leg 2 since 2021-06.
- **The day's macro block does not reach this security.** PCE (confirmed, high), GDP Q3 third, durable
  goods and new home sales all print 08:30–10:00 ET, but the index is fixed on 12-21 and a two-year
  floater has no duration channel. The duration-sensitive leg is the 20-Year, at 1:00 p.m., **after**
  this one.
- **The data trap, reproduced:** a second reopening files as `1-Year 10-Month`, never `2-Year`; a
  `2-Year` filter drops **103 of the 154** auctions in the series.
- **Watch (dated):** FRN reopening **09-23** · FOMC **09-16** · FRN **new issue 10-28** (stamps this
  auction's spread) · FOMC **10-28** · refunding **11-04** · first reopening **11-24** · FOMC **12-09**
  · **announcement 12-17** · 5Y TIPS R **12-22** (proposed here) · **index determination 12-21** ·
  **this auction + 20Y BOND R + 17-week bill 12-23** (20Y proposed here) · macro block **12-23** ·
  Christmas Eve half-day **12-24** · **settlement 12-28** · next new issue **2027-01-27**.

## Initial research

### The question, plainly

This event reached the calendar as
`proposals/treasury-2y-frn-2026-12-23.from-treasury-2y-frn-2026-11-24.json`, read in full before
anything else per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md); its canonical file is written
by this session. The proposer is explicit about why it filed the date:

> *"the schedule PDF puts THREE auctions on 2026-12-23 … so the congestion rule predicts 11:30 AM while
> the holiday reading predicts 1:00 PM … One of the two rules is wrong on 11-24 and the other is wrong
> on 12-23; together they settle it four weeks apart."*

So the question this session had to answer was not "what will happen" but **"is that framing right — is
this auction actually a discriminating observation?"** Everything else about the date is inherited: the
size from `sb0590`, the spread from the [10-28 new issue](treasury-2y-frn-2026-10-28.md), the
Thanksgiving null from the [11-24 first reopening](treasury-2y-frn-2026-11-24.md).

**One-line verdict:** **no** — the holiday rule was already dead, killed by four prior December-23
auctions rather than by anything this one will do; and the rule that replaces it is not the parent's
auction-count rule either, but a **window-capacity** rule that is 154/154 where the count rule is
148/154.

### Method

Rates mode. `symbols: []`, so no symbol-keyed instrument applies — `earnings-cycle.mjs` and
`intraday-edges.mjs` have no target and the mandated cache bust has nothing to bust; recorded rather
than skipped silently. Every number below was fetched from a primary **this session (2026-09-09)** and
derived from scratch, including numbers the sibling ledgers already publish:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**; the four content streams inflated, text rebuilt from Td/Tm coordinates
  into **232 visual rows**, then re-tokenised into **213 auction records** — the same 213 the parent
  reached, reproduced independently rather than copied.
- **The FRN record** — `api.fiscaldata.treasury.gov` `auctions_query`, `floating_rate:Yes`, HTTP 200,
  **79,979 bytes** on the 18 fields this study needs, **154 auctions** (2014-01-29 → 2026-08-26).
- **The same-day census** — every Treasury auction of every tenor since 2014-01-01, HTTP 200,
  **726,093 bytes**, **4,639 rows across 2,227 auction days**, carrying `closing_time_comp` — which is
  what makes the *window* readable rather than just the count.
- **The 13-week bill series** — HTTP 200, **153,492 bytes**, **675 auctions** since 2013-10.
- **31 CFR Part 356**, the governing regulation — eCFR renderer API, HTTP 200, **394,009 bytes**. This
  calendar had never read it; two sibling ledgers name it as an open limit.
- **The tape** — Treasury's 2026 daily par yield-curve CSV (HTTP 200, 14,042 bytes, running to 09/08)
  and Yahoo `^VIX` daily closes.

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).

### Conviction legs, tested

**1. The holiday rule is already dead, and December 23 is the natural experiment that killed it —
REFUTED (the holiday rule), and this is the session's headline.** The parent proposed this date because
last year's 12-23 carried four auctions and printed 1:00 p.m., so a holiday reading predicts 1:00 p.m.
here too. But the holiday is not a variable that needs a forward test: **four FRN auctions have already
landed on 23 December**, with the holiday identical every time:

| Date | Same-day slate | Bills at 11:30 | Close | Holiday rule says | Bill-count rule says |
|---|---|---|---|---|---|
| 2014-12-23 | 5Y Note · **4-week bill** · FRN | 1 | **11:30 AM** | 01:00 PM ✗ | 11:30 ✓ |
| 2015-12-23 | FRN alone | 0 | **11:30 AM** | 01:00 PM ✗ | 11:30 ✓ |
| 2020-12-23 | **105-day CMB** · FRN · **154-day CMB** | 2 | **01:00 PM** | 01:00 PM ✓ | 01:00 PM ✓ |
| 2025-12-23 | FRN · **6-week bill** · 5Y Note · **52-week bill** | 2 | **01:00 PM** | 01:00 PM ✓ | 01:00 PM ✓ |

**4 of 4 for the bill count; 2 of 4 for the holiday, on its own best date.** A rule that cannot explain
why the same calendar day printed 11:30 twice and 1:00 p.m. twice is not a rule about the calendar day.

**2. The mechanism is the capacity of the 11:30 a.m. window, not the auction count — SUPPORTED,
154/154, and it is strictly better than the rule this ledger inherits.** Counting, for every one of the
2,227 auction days in the census, how many securities closed at `11:30 AM`:

| Securities in the 11:30 window | Days |
|---|---|
| 0 | 264 |
| 1 | 626 |
| 2 | **1,337** |
| 3 or more | **0** |

**In twelve years the window has never held a third security.** Given that, the FRN's slot is not a
correlation but a consequence — count the *other* same-day securities that land at 11:30:

| Other securities at 11:30 | FRN closes 11:30 | FRN closes 01:00 PM |
|---|---|---|
| 0 | 65 (+1 at 11:00 AM) | 0 |
| 1 | 72 | 0 |
| **2** | **0** | **16** |

**16/16 and 138/138 — 154 of 154, zero exceptions.** The parent's raw auction-count rule scores
**148/154** on the same data, and every one of its exceptions is absorbed here rather than named:
2014-04-29, 2020-12-23, 2021-01-27 and 2022-07-14 are three-auction days that carry **two bills**;
2020-05-27 is a five-auction day whose 10:00 a.m. COVID-era CMBs left only **one** security at 11:30;
and **2019-12-06** — a one-auction day that printed `11:00 AM`, visible in the parent's own cross-tab
but absent from its 149/154 tally — makes the honest count for that rule 148, not 149.

Because coupons close at 1:00 p.m. (**Bonds 260/261**, Notes 838/1,039) and bills at 11:30
(**3,102/3,339**), the forward-readable input is the **same-day bill count**, which is what the auction
count was proxying for. On a day with a coupon and a bill, the two rules can disagree — and this is
such a day.

**3. This auction closes 11:30 a.m., on three independent readings — SUPPORTED.** The slate from the
schedule PDF's own same-day grouping is `2-Year FRN R · 20-Year BOND R · 17-Week BILL`.

- **Window capacity:** the 20-Year takes the 1:00 p.m. coupon slot (20-Year auctions are **26 of 26** at
  `01:00 PM` since the tenor's 2020 revival), leaving **one** security — the 17-week bill — in the
  11:30 window. Room remains → **11:30 a.m.**
- **The Bond precedent directly:** an FRN has shared a day with a Bond five times (2016-06-22,
  2022-03-23, 2022-06-22, 2023-08-23, 2024-02-21) and closed **11:30 a.m. all five**, twice against a
  20-Year specifically. 2026-12-23 would be the sixth.
- **The 17-week bill precedent:** FRN days carrying a 17-week bill are **36 of 37** at 11:30.

The parent's auction-count rule reaches the same answer (three auctions → 11:30), which is why this
date was never going to separate the two *good* rules — only the bad one.

**4. The index rate is 2026-12-21, and it is the ordinary ordering, not 11-24's inverted one —
SUPPORTED, and forced by the schedule rather than by a base rate.** Two settlement dates in Treasury's
own PDF decide it:

- `13-Week BILL / Thursday, December 17, 2026 / **Monday, December 21, 2026** / Thursday, December 24,
  2026` — settles **12-24**, four days before this FRN's 12-28 settlement. **This is the index.**
- `13-Week BILL / Thursday, December 24, 2026 / **Monday, December 28, 2026** / Thursday, December 31,
  2026` — settles after the FRN. Excluded.

Two things follow that matter to a lane reading this next. **The ordering is ordinary here:**
announcement 12-17 → index 12-21 → auction 12-23 → settlement 12-28. The 11-24 sibling's headline trap
— an index locked *three days before its own announcement* — **does not apply to this date**, and a lane
carrying that framing across will look for an inversion that is not there. And **the one failure mode
that has ever broken this rule is absent:** the 2024-12-24 anomaly (and the 2019-12-18 one) both had a
candidate bill settling **exactly one business day** before the FRN; here the gap is four days.

**5. 31 CFR 356 says what two sibling ledgers said they could not source — SUPPORTED, and it closes
both limits.** Fetched from the eCFR renderer this session (HTTP 200, 394,009 bytes):

- **Spread inheritance is a definition, not a regularity.** *"Spread means the fixed amount over the
  life of a floating rate note that is added to the index rate in order to determine the interest rate
  of the floating rate note… the spread will be equal to the high discount margin at the time a new
  floating rate note is auctioned."* [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md)
  established 51/51 and 103/103 empirically and called it a structural finding; it is **the regulation
  being obeyed**. Reproduced here anyway from raw: **51/51** CUSIPs carry one constant spread across all
  three legs, and **51/51** new issues have `high_discnt_margin` exactly equal to `spread`.
- **The index rule's mechanism is a published two-business-day lockout.** Appendix B §I.C: accrued
  interest uses *"the index rate from the most recent auction of 13-week bills that took place before
  the accrual day… However, the rate determined in a 13-week bill auction that takes place in the
  two-business-day period prior to a settlement date or interest payment date will not be used,"* with
  the worked example naming *"the two-business-day lockout period."* That is the reason a bill settling
  on or beside the FRN's own settlement date cannot be its index — which is exactly the
  settlement-precedence rule the 11-24 ledger fitted at 152/154 and recorded as *"inferred… not read
  from 31 CFR 356."* It is read now.

**6. A fit correction to the sibling, which does not change its answer — MIXED.** Re-fitting the
settlement-precedence rule against the same 675-auction bill series gives **151/154**, not 152/154. The
extra miss is **2019-12-18**, where the "most recent Monday 13-week bill settling before the FRN
settles" was itself auctioned on **2019-12-23 — five days after the FRN**, i.e. a physically impossible
index that the rule as literally written does not exclude. Adding the obvious constraint (the index bill
must be auctioned no later than the FRN) restores **152/154** with the parent's own two misses
(**2019-01-29**, whose bill slate was shutdown-shifted to a Tuesday; **2024-12-24**, genuine and still
unexplained under every variant tested here, including three business-day-lockout formulations). **The
11-24 prediction of 2026-11-16 is unaffected** — it is forced by two settlement dates, not by the base
rate. This is a statement of the rule, not a change to it.

**7. The concession is a LEG effect, not a calendar effect — SUPPORTED over twelve years, ABSENT in the
current regime, and this is the variable the calendar has been pooling away.** The sibling ledgers
compare a holiday-week pool against "all other reopenings," which mixes first and second reopenings.
Splitting by leg instead (within-CUSIP, high discount margin minus the spread the CUSIP's own new issue
stamped):

| Pool | n | Mean HDM − stamped spread | sd |
|---|---|---|---|
| First reopening (`1-Year 11-Month`) | 51 | **+0.23bp** | 2.80 |
| Second reopening (`1-Year 10-Month`) | 50 | **+1.54bp** | 4.68 |
| Paired, same CUSIP (leg 2 − leg 1) | 50 | **+1.31bp**, **t = 3.14** | 2.95 |

The paired test is the clean one — it removes every CUSIP-level shock — and it is significant, positive
in **32 of 50** cycles. **The honest half: on 2021-06+ it collapses to +0.36bp (n=21, t = 0.80).**
Significant across the whole record, **not present in the current regime**. Recorded as a measured
structure, never as an edge, and it is why the call above is a stand-aside rather than a small bet.

**8. Christmas adds no concession, but it roughly quadruples the variance — MIXED, and it sets this
event's band.** Within the second-reopening pool, December versus everything else:

| Second reopenings | n | Mean | sd | Welch t | Variance ratio |
|---|---|---|---|---|---|
| December | 12 | +2.78bp | **7.14** | 0.76 | — |
| All others | 38 | +1.15bp | **3.64** | | **F = 3.86** |

The mean is a null, as the 11-24 sibling found for Thanksgiving. The **dispersion is not**: December
second reopenings run from **−6.5bp (2024-12-24)** to **+16.2bp (2015-12-23)**, and excluding that ZIRP
outlier still leaves F = 2.76. The practical consequence is a band, not a direction: the sibling's
**±4.0bp** (calibrated on a leg-1-dominated Thanksgiving pool, and correct for *its* event) holds only
**5 of 12** here. **±8.0bp** holds **9/12** on December second reopenings and **20/21** on all second
reopenings since 2021-06. Bid-to-cover shows nothing at all — December second reopenings 3.353 vs
3.329 (t = 0.14), and cover by leg is flat (3.284 / 3.219 / 3.335).

**9. The day's macro block is loud and does not reach this security — SUPPORTED.** 2026-12-23 carries
the pre-holiday compression of month-end data: [`pce-2026-12-23`](pce-2026-12-23.md) (confirmed, high
impact), [`gdp-q3-2026-third-2026-12-23`](gdp-q3-2026-third-2026-12-23.md),
[`durable-goods-2026-12-23`](durable-goods-2026-12-23.md) and
[`new-home-sales-2026-12-23`](new-home-sales-2026-12-23.md), all 08:30–10:00 ET and therefore all before
an 11:30 auction. Three reasons it does not transmit: the **index is already fixed** on 12-21, so no
print can move it; a two-year floater's price is a margin over a 13-week bill, with essentially **no
duration channel** for a growth or inflation surprise to act through; and the only duration-sensitive
security on the day, the **20-Year reopening, bids at 1:00 p.m. — after this one**. The day's sequencing
is 08:30 macro → 11:30 FRN → 13:00 20-Year, which also means the day's close-to-close long-end move is a
joint observation and cannot be attributed to either auction.

**10. No Fed channel — SUPPORTED.** FOMC lands **2026-12-09**, two weeks before; the index date, the
auction and the 12-28 settlement all sit after it, with the next meeting in 2027. The decision-day
pairing that dominates the [10-28 sibling](treasury-2y-frn-2026-10-28.md) has no analogue here and is
not claimed.

**11. The `security_term` trap, reproduced from raw — SUPPORTED.** The series files as `2-Year` (51),
`1-Year 11-Month` (52) and `1-Year 10-Month` (51). **This auction will file as `1-Year 10-Month`**, so a
`security_term: 2-Year` filter drops it silently — along with **103 of the 154** auctions in the series.

**12. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve **2026-09-08** (the freshest close in the 2026 CSV): 3-Mo **3.94** (the FRN's index
tenor) · 2Y **4.39** · 5Y **4.57** · 10Y **4.80** · 20Y **5.26** · 30Y **5.25**. **VIX 15.72**
(2026-09-08 close; no 09-09 bar had posted at fetch time and 09-07 was Labor Day). The most recent FRN
leg on record is **2026-08-26**, which cleared **+0.5bp** against its own stamped spread (HDM 0.055 vs
spread 0.050) on a 3.14 cover — an ordinary print in the compressed regime the 10-28 sibling describes.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event, and the
answer this doc would give even if the date were confirmed, because no house playbook is rates-keyed.
Three things it does support:

**Stop treating 2026-12-23 as a test and start treating 2026-11-24 as the only one.** The parent
registered two discriminating observations four weeks apart. Only the first is discriminating: 11-24 is
a **two-bill** day where the window rule and the count rule both say 1:00 p.m. against a holiday reading
that says 11:30, so it separates the surviving rules from the dead one in the direction that costs
something to be wrong about. 12-23 separates nothing that four historical prints have not separated
already. Read it, score it, do not weight it.

**Carry the leg, not the holiday, into the next FRN ledger.** The next four FRN events on this calendar
are 2026-10-28 (new issue), 11-24 (leg 1), this one (leg 2) and 2027-01-27 (new issue). The pooled
"reopening" comparison the siblings use mixes two populations whose means differ by 1.3bp and whose
variances differ by 2.8×. Every future band on this security should be cut by leg first and by calendar
second — including the ±4.0bp the 11-24 sibling registered, which is right for its own leg-1 event and
wrong if carried here.

**Read the regulation before fitting the next rule.** Two of this calendar's standing FRN limits closed
this session for the cost of one HTTP fetch that no prior lane had made. The spread identity and the
index lockout were both *published* the whole time; 154 rows of tape were being used to infer what
Appendix B states outright.

### Honest limits

**The auction has not happened; every number about it is a document read.** **The date is `estimate`** —
a tentative schedule is tentative and the confirming primary is the 2026-12-17 announcement itself; the
`TSY:` prefix that a reader may think licenses `confirmed` is deliberately not taken, on the standing
rule that this lane does not self-confirm an event it discovered in-sweep. **The window-capacity rule is
a description of Treasury's published closing times, not a policy Treasury has stated** — this session
read 31 CFR 356 in full and found **no provision fixing auction closing times at all**, so a
`{0,1,2,3+: …, 0}` distribution over 2,227 days is a very strong regularity and still not a rule
Treasury has committed to. It is also **partly definitional**: given capacity 2, "two others already
there → the FRN is elsewhere" is arithmetic, and the forward content sits entirely in predicting which
securities occupy the window — which is why the 20-Year's 1:00 p.m. slot (26/26) and the 17-week bill's
11:30 (200/204) are stated separately rather than assumed. **The 17-week bill is the soft spot in that
chain**: four of its 204 auctions have printed 1:00 p.m., and one added bill on 12-23 — a CMB, which
Treasury ran in December in three of the last five years — fills the window and inverts the call. **The
index-date rule remains 152/154 with 2024-12-24 unexplained**, and this session tested and rejected
three business-day-lockout formulations of it; the specific 12-21 answer rests on two published
settlement dates rather than on the rule, but inherits its exposure if the settlement-precedence reading
is simply wrong. **The leg effect is n=50 paired and does not survive the regime split** — +1.31bp at
t = 3.14 all-time, +0.36bp at t = 0.80 since 2021-06; treating the twelve-year number as live would be
reading a pre-2021 rate regime into a 2026 auction. **The December dispersion result is n=12** and
leans on one ZIRP-era observation; F = 3.86 falls to 2.76 without it. **`closing_time_comp`,
`frn_index_determination_date` and `spread` are taken at face value** as Treasury's record of what
happened, which they are — but they describe past auctions, and no field in this dataset states a
forward rule.

## Stance & kill switches

**Stance (date `estimate`; the schedule row, the same-day slates, the full auction record, the bill
series and 31 CFR 356 all primary-sourced 2026-09-09).** This is a **scheduled, unhedgeable,
zero-position event**, and its most useful output is a **demotion of its own billing**: the parent
proposed it as the second discriminating observation between a congestion rule and a holiday rule, and
it is not one — four prior 23-December FRN auctions settled that question with the holiday held
constant, **4 of 4 for the bill count and 2 of 4 for the holiday**. No position is or should be taken.
The live claims are: this auction **closes 11:30 a.m. ET** (one bill on the slate; the window rule is
154/154 and three independent precedents agree), its index rate is fixed on **2026-12-21** by the bill
that settles 12-24 (the *ordinary* ordering, after its own announcement — not 11-24's inversion), and
its clearing margin lands within **±8.0bp** of the spread 2026-10-28 stamps, a band twice the sibling's
because the **leg**, not the holiday, is what widens it.

**Three durable outputs beyond the siblings'.** (a) **The window-capacity rule** — the 11:30 a.m.
competitive window has never held more than two securities in 2,227 auction days, which makes the FRN's
slot deterministic at **154/154** where the parent's auction-count rule is **148/154**, absorbs all five
exceptions the parent had to name plus a sixth its tally dropped, and relocates the forward input from
*auction count* to *bill count*. (b) **Two regulatory closures** — 31 CFR 356 makes spread inheritance a
**definition** (upgrading the 10-28 ledger's 51/51 from a base rate to law) and names the
**two-business-day lockout** that is the mechanism behind the 11-24 ledger's fitted index rule, closing
that ledger's explicit *"not read from 31 CFR 356"* limit; a fit correction comes with it (151/154 as
written, 152/154 once the index bill is required to precede the FRN), leaving the 11-24 answer intact.
(c) **The leg decomposition** — second reopenings clear **+1.31bp** wider than first reopenings of the
same CUSIP (paired, n=50, t = 3.14) and carry **2.8×** the variance, with December adding dispersion
(F = 3.86) and no mean; the calendar's pooled "reopening" comparisons mix two populations.

**Inherited, not re-registered.** The $28B size belongs to `sb0590` and the announcement ledgers; the
spread-inheritance identity belongs to [`treasury-2y-frn-2026-10-28`](treasury-2y-frn-2026-10-28.md)
(here upgraded to a regulatory citation, not re-derived); the Thanksgiving null and the closing-time
question belong to [`treasury-2y-frn-2026-11-24`](treasury-2y-frn-2026-11-24.md), whose three forward
tests score 2026-11-25 and are not duplicated here.

**Three forward tests registered** in [this event's own fragment](../forward-tests/treasury-2y-frn-2026-12-23.md),
all scoreable **2026-12-24**, all zero-capital: **`-1`** the closing time reads `11:30 AM` (registrable
despite a 138/138 base rate because the rival it discriminates against — the holiday reading — is
written into a sibling ledger *and* named live for this date by the parent); **`-2`**
`frn_index_determination_date` reads **2026-12-21**; **`-3`** the clearing margin lands within
**±8.0bp** of the spread 2026-10-28 stamps, base rate **9/12** disclosed.

**Kill switches:**

- **This auction printing `01:00 PM`** — `-1`'s own kill. The window rule goes to 16/17 and 138/139, the
  holiday reading this ledger demotes was the better read after all, and legs 1–3 are rebuilt rather
  than patched.
- **A bill being added to the 2026-12-23 slate** — a CMB announcement (Treasury ran December CMBs in
  three of the last five years) fills the 11:30 window and inverts `-1` **before the auction**, without
  the rule being wrong. This is the most likely way the call fails and it is watchable from the
  announcement.
- **The 20-Year reopening on 2026-12-23 closing at anything other than `01:00 PM`** — the coupon slot is
  26/26 for the tenor and 260/261 for Bonds; if it takes the 11:30 window instead, the FRN is bumped and
  `-1` fails for a reason that has nothing to do with Christmas.
- **`frn_index_determination_date` reading anything other than 2026-12-21** — `-2`'s kill; the
  settlement-precedence rule and the two-business-day lockout that explains it are both wrong for a case
  where the schedule was supposed to force the answer.
- **The margin landing more than 8.0bp from the spread 2026-10-28 stamps** — the leg-2 dispersion
  measured here is understated, and the band must be re-cut before 2027's block rather than widened
  after the fact.
- **A 2026-10-28 `spread` that does not equal that auction's own `high_discnt_margin`** — 31 CFR 356 is
  not being applied as written; the whole inheritance frame, and `-3`'s reference point, go with it.
- **The 2026-12-17 announcement not carrying a 2-Year FRN reopening at $28B, or Treasury revising the
  12-17 / 12-23 / 12-28 row** — the event's premise is wrong and this doc is rebuilt, not amended.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-105 | **Initial research. Canonical file written by this session** — the event existed only as `proposals/treasury-2y-frn-2026-12-23.from-treasury-2y-frn-2026-11-24.json`, read in full first per EVENT-RESEARCH.md; schedule row re-derived independently and **confirmed unchanged** (`2-Year FRN R / Thu Dec 17 / Wed Dec 23 / Mon Dec 28`, PDF plain curl HTTP 200 17,195 bytes, re-tokenised into **213 auction records**, the same count the parent reached). **HEADLINE — THIS EVENT IS NOT THE DISCRIMINATING TEST IT WAS PROPOSED AS, AND THAT IS THE FINDING.** December 23 is its own natural experiment: **four** prior FRN auctions have landed on that exact date with the holiday constant, and the closing time tracks the same-day BILL count **4 of 4** (2014 one bill → 11:30 · 2015 zero → 11:30 · 2020 two CMBs → 1 p.m. · 2025 two bills → 1 p.m.) where the holiday reading is **2 of 4 on its own best date**. **THE MECHANISM IS WINDOW CAPACITY, NOT AUCTION COUNT — 154/154 vs the parent's 148/154.** Across the **4,639-row / 2,227-day** census (HTTP 200, 726,093 bytes), the 11:30 a.m. window has **never held a third security**: `{0: 264 days, 1: 626, 2: 1337, 3+: ZERO}`. Two other securities in it → the FRN takes `01:00 PM` **16/16**; fewer → morning **138/138**. It **absorbs every exception the parent had to name** (2014-04-29 · 2020-12-23 · 2021-01-27 · 2022-07-14 are all two-bill days; 2020-05-27's 10 a.m. CMBs left one at 11:30) plus **2019-12-06** (`11:00 AM`, in the parent's own cross-tab but absent from its 149/154 tally — the honest count for that rule is **148/154**). Coupons close 1 p.m. (Bonds **260/261**), bills 11:30 (**3,102/3,339**), so the forward input is the **bill count**. **THIS DATE: three auctions, ONE bill (`FRN R · 20-Year BOND R · 17-week`) → 11:30 a.m.**, corroborated twice more — FRN-with-a-Bond is **5/5 at 11:30** (twice a 20-Year) and FRN-with-a-17-week is **36/37**. **SECOND — 31 CFR 356 READ FOR THE FIRST TIME IN THIS CALENDAR** (eCFR renderer, HTTP 200, 394,009 bytes), closing two standing limits: spread inheritance is a **DEFINITION** (*"the spread will be equal to the high discount margin at the time a new floating rate note is auctioned"*), upgrading the 10-28 ledger's 51/51 · 103/103 from base rate to law (reproduced from raw at 51/51 and 51/51); and the index rule's mechanism is the published **two-business-day lockout** (Appendix B §I.C), closing the 11-24 ledger's *"inferred… not read from 31 CFR 356."* **FIT CORRECTION:** that rule as literally written scores **151/154** here, not 152 — the extra miss **2019-12-18** used a bill auctioned **five days AFTER** the FRN; requiring the index bill to precede the FRN restores **152/154** with the parent's own two misses (2019-01-29 shutdown-shifted, 2024-12-24 genuine). **11-24's answer is unchanged.** **INDEX = 2026-12-21**, forced by the schedule (Mon 12-21 bill settles 12-24, four days before this FRN's 12-28; the 12-28 bill settles 12-31, after) — and **unlike 11-24 it is set AFTER the 12-17 announcement**, the ordinary ordering, with the 1-business-day-gap failure mode that broke 2024-12-24 and 2019-12-18 **absent**. **THIRD — THE CONCESSION IS A LEG EFFECT, NOT A CALENDAR ONE.** Paired within-CUSIP, leg 2 clears **+1.31bp** wider than leg 1 (n=50, **t = 3.14**, positive 32/50); unpaired leg 1 **+0.23bp** (sd 2.80) vs leg 2 **+1.54bp** (sd 4.68). **Honest half: on 2021-06+ it collapses to +0.36bp (n=21, t = 0.80)** — recorded, never traded. December leg 2 vs other leg 2 is a **mean null** (+2.78 vs +1.15, t = 0.76) with **~4× the variance** (sd 7.14 vs 3.64, **F = 3.86**; 2.76 ex-2015 outlier), so the sibling's **±4.0bp holds only 5/12** here and **±8.0bp** holds 9/12 (20/21 leg 2 since 2021-06). Cover shows nothing (3.353 vs 3.329, t = 0.14). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** the day itself carries the pre-holiday block — **PCE (confirmed/high)**, GDP Q3 third, durable goods, new home sales, all 08:30–10:00 ET — and **none reaches this security**: the index is fixed 12-21, a 2-year floater has no duration channel, and the day's duration-sensitive leg (the 20-Year) bids at 1 p.m. **after** it. **Volatility: VIX 15.72**, the **2026-09-08** close (no 09-09 bar at fetch time; 09-07 Labor Day). **Rates (par CSV, 09/08):** 3-Mo **3.94** · 2Y 4.39 · 5Y 4.57 · 10Y 4.80 · 20Y 5.26 · 30Y 5.25. Latest FRN leg **2026-08-26** cleared **+0.5bp** vs its stamped spread on 3.14 cover. **No Fed channel** — FOMC 12-09 sits two weeks before the whole chain. **Corridor: 18 tracked entries within ±5 days**, plus the existing unshadowed `treasury-coupon-announcement-2026-12-24` proposal. **TWO dated adjacent events PROPOSED as `estimate` in this PR:** **`treasury-20y-bond-2026-12-23`** — untracked, same day, and the **direct input** to this ledger's own closing-time call (if it were a bill instead of a coupon the call inverts) — and **`treasury-5y-tips-2026-12-22`**, untracked at D-1, whose $24B read is **already written in prose** in `treasury-5y-tips-2026-10-22` with no event to score it against. **Deliberately NOT proposed:** `treasury-coupon-announcement-2026-12-24` (already proposed by a sibling lane) and the four bill legs (this calendar tracks no bill auction of any tenor; inventing that class in-sweep would be a scope decision, not a discovery). **`FT-…-12-23-1`** (closing time `11:30 AM`), **`-2`** (index 2026-12-21) and **`-3`** (margin within ±8.0bp of the 10-28 stamp) registered, all scoring 2026-12-24. **All sources HTTP 200; nothing blocked.** | **Stance set — and it demotes the event's own premise.** Zero-position. The congestion-vs-holiday question the parent filed this date to settle was **already settled by four prior 23-December auctions**, so this print is a confirmation, not a discriminator, and 11-24 is the only real test of the pair. Registrable content is three results: a **window-capacity rule** (154/154, replacing the parent's 148/154 count rule), **two regulatory closures** from 31 CFR 356, and a **leg decomposition** that shows the calendar has been pooling two different populations | 2026-09-30 (medium; D-105 sits in the 31+/21d band, and days-out does not cross 31 until 2026-11-22) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to the
next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-2y-frn-2026-12-23.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
