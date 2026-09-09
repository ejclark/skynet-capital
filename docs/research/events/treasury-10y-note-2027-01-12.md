# 10-Year Treasury Note auction — the January reopening where the SOMA add-on stops being a statistic — treasury-10y-note-2027-01-12

**Kind:** rates · **Date:** 2027-01-12 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-09, HTTP 200, 17,195 bytes — row reads `10-Year NOTE / R / Thursday, January 07, 2027 / Tuesday, January 12, 2027 / Friday, January 15, 2027`, legend `R --denotes reopening`) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["eia-steo-2027-01-12","fomc-blackout-start-2027-01-16","ism-services-2027-01-07","opex-2027-01-15","treasury-30y-bond-2027-01-13","treasury-3y-note-2027-01-11","treasury-coupon-announcement-2027-01-07","treasury-coupon-announcement-2027-01-14"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/news_release/cpi.htm","status":"403","at":"2026-09-09"},{"url":"https://www.bls.gov/schedule/news_release/empsit.htm","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **The proposal filed this auction as the "cycle-position control" for the December leg's
SOMA finding. It is better than a control: the number both ledgers were estimating is *arithmetic*,
and both of its inputs are already published.** `auctions_query` carries a field the sibling ledgers
never opened — **`soma_holdings`**, the Fed's holdings maturing on an auction's **settlement** date —
and three laws verified against primaries this session make it decisive. The block splits that pool
**exactly pro-rata by offering amount** (10-Year = **39/119 = 32.77%**, reproduced to three decimals
on 2026-01-15, 2026-07-15 and 2024-10-15, the last on a *partial* roll). The **roll ratio is now
100.0%**, and it is dated: 0–64% through 2024, 61–93% through 2025, then **exactly 100.0% on all 16
non-zero coupon settlements since 2025-12-31**. And the maturing pool is public four months early —
NY Fed SOMA holdings (as of 2026-09-02) show **two TIPS totalling $26.21B** maturing **2027-01-15**.
So this auction's expected add-on is **~$8.6B** on a **~$47.6B** total accepted, not the **$2.70B** a
"second reopening" average would hand you. **October falsifies the cycle-position reading outright** —
also a second reopening, add-on mean **$0.64B**, because SOMA held almost nothing maturing on those
dates. **The mechanism gets a free test 35 days early:** SOMA holds **no coupon** maturing 2026-12-15,
so the December sibling's add-on should print **exactly $0.00B** against its registered ≤$1.26B
ceiling. What does *not* transfer is December's FOMC question: the January 10-Year has been **≥14 days
from the nearest decision in 18 of 18 years**, and 2027-01-12 sits **D-15** from a meeting with **no
dot plot**. Its corridor is **7 tracked entries against December's 28**, and its settlement window is
**3 calendar days**, the tightest in the family. Date is `estimate`, `symbols: []`, and nothing here
is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-125) | **Stand aside** | High | Nothing dated between now and **2027-01-07** publishes this auction's size, CUSIP or coupon, and the security it reopens does not exist until **2026-11-10**. `symbols: []`, date `estimate`, no rates-keyed house playbook. | Treasury running an off-cycle issuance action or a mid-quarter coupon-size change **before 2027-01-07** — the nominal coupon grid has not moved in ~29 months |
| This week | **Stand aside — read today's 2026-09-09 reopening at 1:01pm ET for the demand band only, and expect a $0.00B add-on** | High | Today's **$39B** reopening is the 21st consecutive one, and SOMA holds **nothing** maturing **2026-09-15**, so its add-on is a live read on the mechanism this document rests on before anything else here can be tested. | The **2026-09-09** print carrying **any** non-zero SOMA add-on, or clearing bid-to-cover **outside 2.34–2.70** — either breaks a leg this ledger chains to, on day one |
| This month | **Watch 2026-10-01 and 2026-11-04, don't act** | Medium | **10-01** announces the October reopening and **11-04** is the quarterly refunding that fixes both the November new issue this auction reopens *and* the offering sizes the pro-rata split divides by. A match is near-uninformative; a miss re-cuts the arithmetic. | The **2026-11-04** refunding statement moving the 10-Year off **$42B** new / **$39B** reopening, or moving the 3-Year off **$58B** or the 30-Year off **$22B** — the **32.77%** share is a ratio of those three numbers |
| This quarter | **Treat 2026-12-08 as the mechanism's test and 2027-01-07 as the event; no directional view on either auction** | Medium | The December sibling's add-on is the cheapest out-of-sample test of the settlement-date law available (predicted **$0.00B**, 35 days before this event), and **2027-01-07** publishes this auction's size and its own `SOMA Holdings Maturing on Issue Date` line. | The **2026-12-08** print carrying a **materially non-zero** SOMA add-on despite no coupon maturing 2026-12-15 — the settlement-date law is wrong and every number in this document's central finding is re-cut before the January pulse |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an auction.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed. Nothing here licenses an entry.
- **The add-on is arithmetic, not an average — this is the document.** Add-on = (SOMA coupons
  maturing at settlement) × (this leg's offering ÷ the block's offering), and the split held to
  three decimals on three dates including a partial roll. Registered as
  **FT-treasury-10y-note-2027-01-12-3**.
- **The expected number is ~$8.6B on a ~$47.6B total accepted** — from **$26.21B** of TIPS
  (912810PS1, 912828V49) maturing **2027-01-15** × **32.77%**. Registered as a **band**
  (**FT-…-2027-01-12-4**), deliberately the opposite shape from the December sibling's ceiling.
- **A large add-on is not a demand signal, and cannot be read as one.** Bid-to-cover is computed on
  tenders and awards **net of** the SOMA award — verified to three decimals on the last eight
  prints — and across the 20-auction $39B reopening era **corr(add-on, bid-to-cover) = 0.020**.
  Registered as **FT-…-2027-01-12-5**.
- **Cycle position is a proxy that October breaks.** Second reopenings since 2018: January **$3.44B**,
  April **$3.35B**, July **$3.14B**, **October $0.64B** (4/8 positive). Position tracks the maturity
  calendar and nothing else.
- **The free early test is 2026-12-08.** SOMA holds no coupon maturing 2026-12-15 — only bill
  912797WF0 (**$11.88B**), and maturing bills roll into bills. Predicted add-on **$0.00B**, total
  accepted **exactly $39B**. Registered as **FT-…-2027-01-12-7**.
- **December's FOMC finding does not transfer, and saying so is the honest half of "control."** The
  January 10-Year has sat **≥14 days** from the nearest scheduled decision in **18 of 18** years
  (D-14 to D+21); **2027-01-12 is D-15** from **2027-01-26/27**, which carries no asterisk on the
  Fed's own calendar and therefore **no dot plot**. This leg belongs to December's own **n=191**
  control cohort.
- **December's corridor finding inverts here.** **7** tracked entries within ±5 days against
  December's **28**; **one** `high` (ISM Services **2027-01-07**) and it lands *before* the auction;
  settlement window **3 calendar days** against December's 7. Tape agrees: January's
  auction-to-settlement **|10-Year move| 6.3bp** (n=18) vs December **9.5bp** (n=17), all-auction
  **8.3bp** (n=214), ordinary five-session base rate **9.0bp**.
- **The size is $39B and it is inferred until 2027-01-07** — the 24th consecutive $39B reopening
  since 2024-03-12. Registered as **FT-…-2027-01-12-1**.
- **No CUSIP is predicted.** The January reopening always reopens the **November new issue**, whose
  CUSIP does not exist until 2026-11-10. Its shape is registered (**FT-…-2027-01-12-6**), its
  identifier is not.
- **Watch (dated):** reopening **2026-09-09** · announcement **10-01**, reopening **10-07** ·
  **refunding 11-04 — fixes both the security and the three offering sizes the split divides by** ·
  new issue **11-10** · **the December reopening 12-08 — the mechanism's out-of-sample test** ·
  **coupon announcement 2027-01-07 — the size and the SOMA line become published** · 3-Year
  **01-11** · **this auction 1:00pm ET, 01-12** · 30-Year **01-13** · settlement **Friday 01-15**.

## Initial research

### The question, plainly

The proposal that discovered this event gave it one job: be the **cycle-position control** for the
December sibling's SOMA finding. That sibling had established, correctly, that a *new issue* takes a
large non-competitive add-on from the Fed (35/35 since 2018, mean **$12.35B**) while a *first*
reopening takes almost none (16/35, mean **$0.85B**), and it warned a reader not to carry the
November number into December. January is the *second* reopening of the same security at the same
size four weeks later — so, the argument went, December and January isolate the add-on effect from
everything else.

That is a good instinct and it produces a real number: second reopenings run **27/35 positive, mean
$2.70B**, and on the $39B era **10/10 positive, mean $5.03B**. This document does not dispute any of
it. It reports that the split is a **proxy**, that the thing it proxies is exact, and that both
inputs to the exact version are already published four months before the auction.

**The question this document actually asks: is the SOMA add-on estimable, or is it computable?**

Three readings follow, and all three are testable today:

1. The add-on is a property of **cycle position** — new / first reopening / second reopening.
2. The add-on is a property of the **settlement date**, and cycle position only correlates with it.
3. Whatever it is, a big add-on is a **demand signal** — total accepted of $50B on a $39B offering
   says something about who wanted the paper.

**One-line verdict.** Reading 1 is **refuted by October**, reading 2 is **supported and reduces to
arithmetic**, and reading 3 is **refuted structurally** — the add-on is excluded from bid-to-cover on
both sides of the ratio, so it cannot be read as demand even in principle. What remains is an
ordinary $39B reopening whose only genuinely unpublished number arrives **2027-01-07**, sitting in
the emptiest corridor and the shortest settlement window its family has.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the
mandated cache bust has nothing to bust (recorded, not silently skipped). Everything quantitative
below was fetched **this session (2026-09-09)** and derived here:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**; the four content streams inflated page by page and rows rebuilt from
  `Tm` coordinates, independently of the proposal that discovered this event.
- **Auction history** — `api.fiscaldata.treasury.gov` `auctions_query`. Two pulls: the 10-Year series
  (`original_security_term:eq:10-Year, security_type:eq:Note, auction_date:gte:2009-01-01`) returning
  **318** rows, **103** of them 10-Year TIPS, leaving **215 nominal** (**214** cleared); and an
  all-security pull on `issue_date:gte:2024-01-01`, **1,192** rows, used for the settlement-date work.
- **SOMA holdings** — `markets.newyorkfed.org/api/soma/tsy/get/all/asof/<date>.json`, HTTP 200, three
  as-of dates (**2026-09-02**, **2026-07-01**, **2026-01-07**), 433 lines on the current one.
- **FOMC decision dates** — `federalreserve.gov`, `fomchistorical<YEAR>.htm` for 2009–2020 and
  `fomccalendars.htm` for 2021–2027, both HTTP 200.
- **The tape** — `home.treasury.gov` daily par yield curve CSVs, one file per year **2009–2026** (18
  files, **4,423 sessions**); **VIX** from `cdn.cboe.com`'s own `VIX_History.csv` (CBOE primary,
  HTTP 200).

**Four source-reliability notes, all recorded rather than papered over.**

*TIPS contamination.* `auctions_query`'s `security_type` does **not** separate 10-Year TIPS from
nominal notes — both return as `Note`. Filtering on a non-null `ref_cpi_on_issue_date` separates them;
every nominal statistic below is nominal-only. Reproduced independently here rather than inherited
from the four sibling ledgers that recorded it.

*The FOMC date list is a derivation, not a published table.* Harvested from statement URLs
(`monetary/<YYYYMMDD>a.htm` on the 2009–2010 pages, `monetary<YYYYMMDD>a1.htm` thereafter) with the
same seven non-scheduled statements excluded by name that the December sibling excluded —
**2010-05-09**, **2019-10-11**, **2020-03-03**, **2020-03-23**, **2020-03-31**, **2020-08-27** and
**2025-08-22**; **2020-03-15 is kept**, because it replaced the scheduled 3/17–18 meeting. The check
was run before any statistic and returns **exactly 8 decisions in every one of the 18 years**.

*Two fetches were blocked and are recorded, not substituted.* `bls.gov/schedule/news_release/cpi.htm`
and `.../empsit.htm` both returned **403** to this runner even with a browser user-agent — the known
blind spot [`ppi-2026-11-13.md`](ppi-2026-11-13.md) documents. So **no January 2027 CPI or jobs date
is proposed in this PR**, even though both almost certainly fall inside this event's ±5-day corridor.
Absence is stated; it is not guessed. Both entries are in `probe-ref.blocked` above.

*No when-issued data exists.* The sharper demand metric is the **tail** — the stop against the
when-issued quote — and Treasury publishes neither. Every demand statement below is bid-to-cover and
bidder composition, and this ledger makes **no tail claim**.

**Bidder shares are competitive-only.** Every indirect/direct/dealer percentage is a share of
**competitive** awards, with SOMA add-ons excluded from the denominator.

### Conviction legs, tested

**1. The date, security and settlement are what the calendar says — SUPPORTED, primary.** The row
reads verbatim `10-Year NOTE / R / Thursday, January 07, 2027 / Tuesday, January 12, 2027 / Friday,
January 15, 2027`, against the page legend `R --denotes reopening`. Announcement is the **2027-01-07**
coupon announcement. 1:00pm ET is Treasury's standing convention and is **not** separately sourced.
Status correctly stays `estimate`: a tentative schedule is tentative by construction.

**2. `soma_holdings` is a settlement-date field, and it is the whole mechanism — SUPPORTED, primary,
and this is the leg the document is built on.** `auctions_query` carries a field the four sibling
10-Year ledgers never used. On any given settlement date it is **identical across every coupon leg
settling that day** and **different from the bill block's**, which is exactly what "the Fed's holdings
maturing on the issue date" would look like:

| Settlement | `soma_holdings` (coupon legs) | `soma_holdings` (bill legs) |
|---|---|---|
| 2026-01-15 | **$34.64B** — 3-Year, 10-Year, 30-Year all read the same | **$7.79B** — 26-week, 6-week, 13-week all read the same |
| 2026-07-15 | **$12.38B** on all three coupon legs | no bill settled that day |
| 2026-09-15 | **$0.00B** on all three coupon legs | **$19.37B** on the three bill legs |

Maturing bills roll into bills and maturing coupons roll into coupons. The 2026-09-15 row is the
cleanest proof: a $19.37B bill maturity sits beside a **zero** coupon pool, and today's 09-09
reopening therefore takes **no** add-on at all.

**3. The split is exactly pro-rata by offering amount, and it does not depend on the roll ratio —
SUPPORTED, three independent dates.**

| Settlement | Pool | 3-Year | 10-Year | 30-Year | Offering shares (58 / 39 / 22 of 119) |
|---|---|---|---|---|---|
| 2026-01-15 (100% rolled) | $34.64B | $16.88B = **48.75%** | $11.35B = **32.77%** | $6.40B = **18.48%** | **48.74% / 32.77% / 18.49%** |
| 2026-07-15 (100% rolled) | $12.38B | $6.03B = 48.7% | $4.06B = **32.79%** | $2.29B = 18.5% | same |
| 2024-10-15 (**19% rolled**) | $8.61B | $0.80B = 48.8% | $0.54B = **32.9%** | $0.30B = 18.3% | same |

The third row is the one that matters: even when the Fed rolled less than a fifth of the pool, the
**split** was unchanged. So the ratio is a property of the offering sizes and the total rolled is a
separate variable — which means the two can be predicted separately, and only one of them is
uncertain.

**4. The roll ratio is now 100.0%, and the date it got there is in the data — SUPPORTED.** Rolled ÷
maturing, every coupon settlement since 2024-01, from the all-security pull:

| Window | Roll ratio |
|---|---|
| 2024 (n=14 non-zero) | **0% – 64%**, mean ~26% |
| 2025 through 2025-12-01 (n=13 non-zero) | **61% – 93%** |
| **2025-12-31 onward (n=16 non-zero)** | **100.0% on every one** — 2025-12-31, 2026-01-15, 02-02, 02-17, 03-02, 03-16, 03-31, 04-15, 04-30, 05-15, 06-01, 06-30, 07-15, 07-31, 08-17, 08-31 |

This is a *measurement*, not a policy reading: this session did not fetch an implementation note, and
the ledger does not claim to know what the Committee decided or when. What it claims is that the
observed ratio has been exactly 1.000 for sixteen consecutive coupon settlements over eight months,
and that a return to partial redemption is a named kill switch below.

**5. The pool maturing 2027-01-15 is already published, and the method validates out of sample —
SUPPORTED, primary.** NY Fed SOMA holdings, as of **2026-09-02**, list exactly **two** securities
maturing **2027-01-15**, both TIPS:

| CUSIP | Type | Par | Inflation compensation | Total |
|---|---|---|---|---|
| 912810PS1 | TIPS | $5.61B | $3.68B | $9.29B |
| 912828V49 | TIPS | $12.24B | $4.68B | $16.92B |
| **Total** | | **$17.85B** | **$8.36B** | **$26.21B** |

The out-of-sample check is the point. Running the same query on the **2026-07-01** file for maturities
on **2026-07-15** gives **$12.34B**; Treasury's own `soma_holdings` for that settlement reads
**$12.38B** — a **0.3%** gap, which is inflation accretion between the as-of date and settlement. The
**2026-01-07** file gives **$42.47B** maturing 2026-01-15, of which **$7.80B** is a bill; the coupon
remainder is **$34.67B** against Treasury's **$34.64B**. So: **par + inflation compensation, coupons
only, and expect a few tenths of a percent of accretion drift.**

**So the January arithmetic is:** ~**$26.4B** at settlement (adding ~4.4 months of accretion on
$17.85B of par at recent inflation rates) × **32.77%** = **~$8.6B**, on a total accepted of
**~$47.6B**. The 3-Year's share would be ~**$12.8B** and the 30-Year's ~**$4.9B**. One residual is
named rather than assumed: SOMA holds no *bill* maturing 2027-01-15 today and could acquire one, but
2027-01-15 is a **Friday** and this calendar's bill maturities cluster on Tuesdays and Thursdays —
and in any case a maturing bill funds the **bill** block, as 2026-01-15 proved.

**6. Cycle position is a proxy, and October falsifies it — REFUTED as the causal reading.** Splitting
second reopenings by month since 2018 breaks the category apart:

| Second-reopening month | n | Positive add-on | Mean | Max |
|---|---|---|---|---|
| January | 9 | 6/9 | **$3.44B** | $11.35B |
| April | 9 | 9/9 | $3.35B | $8.11B |
| July | 9 | 8/9 | $3.14B | $6.34B |
| **October** | **8** | **4/8** | **$0.64B** | $2.86B |

October is a second reopening by every definition the proposal used, and it behaves like a first one.
The settlement-date reading explains it without adjustment: SOMA held **$8.61B** maturing 2024-10-15
and **$2.87B** maturing 2025-10-15, against **$34.64B** on 2026-01-15. The first-reopening months tell
the same story from the other side — mid-month March, June, September and December carry near-nothing
SOMA holds, and **2025-09-15, 2025-12-15, 2026-06-15 and 2026-09-15 all read exactly $0.00B**. The
proposal's **$2.70B** second-reopening mean is an average over a variable that has a formula.

**7. A large add-on is not a demand signal and cannot be read as one — REFUTED structurally, not just
empirically.** Reconstructing the published bid-to-cover four ways on the last eight nominal 10-Year
prints, only one definition matches:

| Definition | Matches published b/c? |
|---|---|
| (total tendered − SOMA) ÷ (total accepted − SOMA) | **yes, to ±0.005 on 8 of 8** |
| competitive tendered ÷ competitive accepted | yes, to ±0.006 |
| total tendered ÷ total accepted | **no** — reads 2.203 where 2.550 was published (2026-01-12) |

The add-on is excluded from **both** sides of the ratio, so it is arithmetically incapable of moving
it. The empirical check agrees and adds nothing: across the 20-auction $39B reopening era
**corr(add-on, bid-to-cover) = 0.020**; splitting at $4B gives **2.566** (n=7) against **2.550**
(n=13), with indirect shares **71.3%** and **71.9%**. A reader who sees `$50.35B accepted on a $39B
offering` and calls it strong demand has read the Fed's rollover, not the market.

**8. The free out-of-sample test lands 35 days before this event — SUPPORTED, and it is registered.**
SOMA's current book contains **no coupon security maturing 2026-12-15**. The only holding maturing
that day is bill **912797WF0**, **$11.88B**, which funds the bill block. So the December sibling's
auction should take an add-on of **exactly $0.00B** and print a total accepted of **exactly $39B**.
That sibling registered its own add-on as a **ceiling** of **$1.26B** (`FT-…-12-08-4`), which is
correct and which this prediction sits comfortably inside — the difference is that a ceiling passes on
any value below it, while this one fails on any value above zero. If it prints non-zero, the
settlement-date law is wrong and this document's central finding is re-cut before the January pulse.

**9. The January 10-Year is structurally far from the FOMC, in every year on record — SUPPORTED, and
it is the honest deflation of "control."** Signed days from each January 10-Year auction to the
nearest scheduled decision, 2009–2026: **−20, −14, −14, −14, −21, +21, −15, −14, −21, −21, +21, −21,
−15, −14, −21, −21, +20, −16**. The minimum absolute distance in **18 of 18** years is **14 days**.
**2027-01-12 sits D-15** from the **2027-01-26/27** meeting, which carries **no asterisk** on
`federalreserve.gov/monetarypolicy/fomccalendars.htm` and therefore **no Summary of Economic
Projections**. The tracked `fomc-blackout-start-2027-01-16` falls *after* the auction.

So this leg cannot test December's FOMC-proximity question — it is a member of that ledger's own
**n=191** "≥5 days from any decision" cohort by construction. It is the **baseline**, which is a
weaker and more useful thing than a control, and saying so is more honest than letting the proposal's
framing stand.

**10. December's corridor finding inverts here, and that is the useful transfer — SUPPORTED.** The
December ledger's most actionable leg was that the risk is not the auction but the three sessions
after it. Counting this calendar's own entries within ±5 days:

| | December 2026 leg | **January 2027 leg** |
|---|---|---|
| Tracked entries within ±5 days | **28** | **7** |
| Of those, `high` impact | **6** | **1** (ISM Services 2027-01-07, *before* the auction) |
| Inside the settlement window | FOMC 12-09, CPI 12-10, funding deadline 12-11 — all `high` | 30-Year 01-13, coupon announcement 01-14, opex 01-15 — all `medium` |
| Auction → settlement | **7 calendar days** | **3 calendar days** (Tue → Fri) |

The tape agrees, on 4,423 sessions of par-curve data:

| Cohort | n | Mean absolute 10-Year move, auction close → settlement close |
|---|---|---|
| **January 10-Year auctions** | 18 | **6.3 bp** |
| December 10-Year auctions | 17 | 9.5 bp |
| All nominal 10-Year auctions | 214 | 8.3 bp |
| Ordinary five-session roll | 4,418 | 9.0 bp |

The January auction *day* is quieter too — **2.9 bp** mean absolute against **4.0 bp** across all 214
auctions and **4.2 bp** for an ordinary session. Two confounds are named rather than argued away:
n=18 is small, and early January is seasonally quiet for reasons that have nothing to do with this
auction. The claim is therefore the weak one — **there is no precedent for this leg's settlement
window being the dangerous part** — not that January windows are structurally safe.

**11. The size is $39B and it is inferred until 2027-01-07 — SUPPORTED.** The reopening grid has
printed **$39B twenty-one consecutive times** from **2024-03-12** through today's **2026-09-09**, of
which **20 have cleared**: bid-to-cover mean **2.555**, σ **0.089**, range **2.34 – 2.70**, across
clearing yields **3.648% → 4.680%**; competitive shares indirect **71.7%** (61.4 – 87.9%), direct
**17.0%**, dealer **11.3%**. **2027-01-12 would be the 24th** — 09-09 is the 21st, 10-07 the 22nd and
12-08 the 23rd. The second-reopening subset (n=10) reads b/c mean **2.526**, range 2.34 – 2.67,
indirect **70.5%**. The two January prints in the era: **2025-01-07** cleared **2.530** (indirect
61.4%, dealer 15.6%, add-on $8.57B) and **2026-01-12** cleared **2.550** (indirect 69.6%, dealer
5.8%, add-on $11.35B). The number is **not published today** and becomes published **2027-01-07**.

**12. What this reopens is predictable in shape and not in identity — SUPPORTED.** All **18** January
10-Year auctions since 2009 were reopenings (**18/18**), every one carried the term **`9-Year
10-Month`**, and every one matured on **11-15** — the November new issue of the prior year, twice
reopened. So 2027-01-12 will reopen the **2026-11-10** new issue: dated **2026-11-15**, maturing
**2036-11-15**, first coupon **2027-05-15**, term **`9-Year 10-Month`**. Note the one-month difference
from the December sibling's **`9-Year 11-Month`** — same security, one month further into its life.
**No CUSIP is predicted**: that security does not exist until 2026-11-10.

**13. The block is compressed Mon/Tue/Wed and settles inside its own week — SUPPORTED.** Reading the
schedule's January block by column: **Monday 01-11** carries the 3-Year (a **new issue**, no `R`) plus
13- and 26-week bills; **Tuesday 01-12** carries this auction **and a 6-Week bill auction**, plus
17-/4-/8-week bill *announcements*; **Wednesday 01-13** carries the 30-Year reopening. All three
coupon legs settle **Friday 2027-01-15**. That is a tighter shape than December's Mon/Tue/Thu, and the
PDF's own holiday lines explain the bracket — `Holiday - Friday, January 01, 2027 - New Year's Day`
and `Holiday - Monday, January 18, 2027 - Birthday of Martin Luther King, Jr.` So, as in December and
unlike November, this is **not** the session's sole supply event.

**14. One correction to a sibling, small and non-load-bearing — SUPPORTED.** The December ledger
describes 2025-12-09 as clearing with "an indirect share of 70.2% and a dealer take of 8.8%, the
*lowest* dealer share in the era." The two shares are right; the superlative is not. Across the 20
cleared $39B reopenings the four lowest dealer takes are **2025-09-10 at 4.2%**, **2026-01-12 at
5.8%**, **2026-07-08 at 7.8%** and then 2025-12-09 at 8.8% — fourth of twenty. Its conclusion (that
the FOMC-eve position left no demand footprint) is untouched by this and is not in dispute; the number
is corrected here because two January prints sit in that list and this ledger cites them.

**15. The corridor is thin and two dated adjacencies are proposed — SUPPORTED.** Seven tracked entries
sit within ±5 days: **ISM Services 2027-01-07** (estimate, high), **EIA STEO 01-12** (low), the
**30-Year 01-13** (a proposal), the **coupon announcement 01-14** (which announces the *next* block —
the 20-Year and the 10-Year TIPS — not this one), **opex 01-15** and **FOMC blackout start 01-16**.
Two dated events in that window are **not** tracked at all and are proposed in this PR as this event's
own files: **`treasury-coupon-announcement-2027-01-07`**, the primary that publishes this auction's
size and its `SOMA Holdings Maturing on Issue Date` line, and **`treasury-3y-note-2027-01-11`**, the
block's largest leg. Both were named and deliberately left unfiled by the December sibling for a
sibling lane to own; this is that lane. The January CPI and jobs prints almost certainly fall in this
window too and are **not** proposed, because bls.gov 403s this runner — see the Method note.

**16. The tape going in is calm, and 125 days stale by construction — SUPPORTED, primary.** Par curve
at the **2026-09-08** close: 2Y **4.39** · 3Y **4.44** · 5Y **4.57** · 10Y **4.80** · 20Y **5.26** ·
30Y **5.25**, with 2s10s at **41bp**. **VIX 15.72** at the 09-08 close (CBOE's own history file), vs
**14.53** on 09-04. The 09-07 VIX bar is a Labor Day closure artifact and is not adopted — the same
flag the November and December siblings raised, reproduced independently here. **Today's own event is
the 09-09 10-Year reopening**, the 21st consecutive $39B and — per leg 2 — the first live test of this
document's mechanism, since SOMA holds nothing maturing 2026-09-15. At the time of writing it has not
printed, and this ledger claims nothing about it. None of this forecasts 2027-01-12; it is the
baseline the next pulse diffs against, and the probe-ref line above records it mechanically.

### What plays the conditions support

None directional, and the guard is *narrower* than the December sibling's rather than wider, which is
itself the finding. `symbols: []`, the date is `estimate`, and the two readings that would motivate a
position around this auction have both been refuted: that the add-on says something about demand (it
is excluded from the demand metric by construction), and that the corridor around it carries the risk
(seven `medium`-and-`low` entries in a three-day settlement window, against December's three `high`
resolutions in seven days).

What is left is a **reading**, and it is worth more than a guard. When the 2027-01-07 announcement
publishes a total accepted near **$47.6B** on a **$39B** offering, roughly **$8.6B** of that is the
Federal Reserve rolling two maturing TIPS, allocated by a ratio that has held to three decimals on
every date tested. Anyone who reads that headline as demand — or who carries the December sibling's
correct "no ~$11B add-on here" warning across the cycle boundary without re-checking the maturity
calendar — will be wrong by about $8B in the opposite direction. That is the whole value of this
ledger, and it costs nothing to hold.

### Honest limits

The **2027-01-07** coupon announcement, this auction's when-issued yield, and the CUSIP and coupon of
the security it reopens **do not exist yet** — the November new issue that supplies them has not been
sold. This doc is written 125 days out and says so. The central mechanism rests on **three** validated
settlement dates for the pro-rata split and **one** genuine out-of-sample validation of the SOMA
maturity method (**2026-07-15**, 0.3% error); it has not been tested across a change in the offering
grid, which is why the **2026-11-04** refunding is a named kill switch rather than a footnote. The
100.0% roll ratio is an **observation over 16 settlements**, not a policy document this session read —
a return to partial redemption breaks the level prediction while leaving the split law intact, and the
two are registered as separate forward tests for exactly that reason. The accretion adjustment from
the 2026-09-02 as-of date to 2027-01-15 settlement is an **estimate**, which is why FT-4 is banded at
±$1B rather than pointed. The FOMC decision-date series is a **derivation** from statement URLs with
seven exclusions listed by name; its check is that it returns exactly 8 decisions in each of 18 years.
Leg 10's January quiet is **n=18** and confounded with early-January seasonality, and is stated as an
absence of precedent rather than an effect. Bid-to-cover is a demand proxy; Treasury publishes no
when-issued quote, so this ledger makes **no tail claim**. The par-curve measurements use close-to-close
constant-maturity yields, not the on-the-run note and not intraday marks around 1:00pm, so they
measure the *session*, not the auction. Two fetches were **blocked** (bls.gov, 403 ×2) and are
recorded in `probe-ref.blocked`; no January CPI or jobs date is proposed as a result. Nothing here
forecasts a clearing yield or a policy outcome; every claim is about **structure, size and the
mechanics of a non-competitive award**, which are the parts the primary record can settle.

## Stance & kill switches

**Stance (date `estimate`; size, CUSIP, coupon and block confirmation all `estimate`/inference until
2027-01-07).** No position, and — unlike the December sibling — **no corridor guard either**, because
the corridor is thin: **7** tracked entries within ±5 days against December's **28**, **one** `high`
and it lands before the auction, and a **3-day** settlement window against December's 7, with a
January auction-to-settlement tape reading **6.3bp** against a **9.0bp** ordinary base rate. What
replaces the guard is a **correction to how this family's headline number is read**. The SOMA add-on
is not a cycle-position statistic to be averaged; it is **(SOMA coupons maturing at settlement) ×
(this leg's offering ÷ the block's offering)**, a split that held to three decimals on 2026-01-15,
2026-07-15 and — critically, on a *partial* roll — 2024-10-15. The roll ratio has been exactly
**100.0%** on all 16 non-zero coupon settlements since 2025-12-31, and the January pool is already
published: **$26.21B** of two TIPS maturing **2027-01-15**. So the expected add-on is **~$8.6B** on a
**~$47.6B** total accepted, against the **$2.70B** a second-reopening average implies — and the
category itself is refuted by **October**, whose second reopenings average **$0.64B** because SOMA held
almost nothing maturing on those dates. A large add-on is **not** demand: bid-to-cover is computed net
of it on both sides, verified on 8 of 8 recent prints, and **corr(add-on, b/c) = 0.020** across the
era. The live variables are the **2026-11-04** refunding (which fixes both the security and the three
offering sizes the split divides by) and the **2027-01-07** announcement (which publishes the size and
the SOMA line). The mechanism gets a free test at **2026-12-08**, where it predicts **exactly zero**.
`symbols: []`: no symbol-keyed action exists to take.

**Predictions registered with a score-by date** (per the TEMPLATE rule, these also register in
[`forward-tests/treasury-10y-note-2027-01-12.md`](../forward-tests/treasury-10y-note-2027-01-12.md)):

- **FT-treasury-10y-note-2027-01-12-1** — the 2027-01-07 coupon announcement announces the 10-Year
  reopening at **$39 billion**, the 24th consecutive $39B reopening.
- **FT-treasury-10y-note-2027-01-12-2** — the announced block holds its predicted shape: 3-Year
  **Monday 01-11**, 10-Year **Tuesday 01-12**, 30-Year **Wednesday 01-13**, all settling **Friday
  2027-01-15**.
- **FT-treasury-10y-note-2027-01-12-3** — **the split law.** The 10-Year's SOMA add-on is
  **32.4%–33.2%** of the January block's total SOMA award, matching its offering share
  (39 ÷ 119 = 32.77%), *whatever* the pool and *whatever* the roll ratio.
- **FT-treasury-10y-note-2027-01-12-4** — **the level.** Total accepted on 2027-01-12 is
  **$46.6B–$48.6B** (add-on **$7.6B–$9.6B**). Registered as a **band**, deliberately the opposite
  shape from the December sibling's ceiling: a band fails high *and* low.
- **FT-treasury-10y-note-2027-01-12-5** — an **$8–9B** non-competitive add-on leaves **no** footprint
  on the competitive metrics: bid-to-cover **inside 2.34–2.70** *and* indirect share **at or above
  61.4%** (the era floor, itself set by a January print).
- **FT-treasury-10y-note-2027-01-12-6** — the reopened security is the **2026-11-10 new issue**:
  term **`9-Year 10-Month`**, dated **2026-11-15**, maturing **2036-11-15**, first coupon
  **2027-05-15**. No CUSIP is predicted.
- **FT-treasury-10y-note-2027-01-12-7** — **the free early test, 35 days ahead.** The 2026-12-08
  first reopening takes an add-on of **exactly $0.00B** and a total accepted of **exactly $39.00B**,
  because SOMA holds no coupon maturing 2026-12-15 (only bill 912797WF0, $11.88B, which funds the
  bill block). Sharper than the December sibling's own **≤$1.26B** ceiling, and it fails on any
  non-zero print.

**Kill switches:**

- **The 2026-12-08 reopening printing a materially non-zero SOMA add-on** — the settlement-date law
  is wrong, legs 2, 3, 5, 6 and 8 all fall, and FT-3, FT-4 and FT-7 die together. This is the single
  observation most likely to invalidate the document, and it lands **35 days before** the event.
- **The 2026-11-04 refunding statement moving the 10-Year off $42B new / $39B reopening, the 3-Year
  off $58B or the 30-Year off $22B**, or dropping *"maintain nominal coupon and FRN auction sizes for
  at least the next several quarters"* — the **32.77%** share is a ratio of those three numbers, so
  FT-1 dies and FT-3 and FT-4 are re-cut rather than patched.
- **A coupon settlement between now and 2027-01-15 rolling at less than 100%** — the next chances are
  **2026-09-30**, **2026-10-15** and **2026-10-31**. This kills FT-4's level while leaving FT-3's split
  law standing, which is exactly why they are registered separately.
- **SOMA acquiring, selling or having its 2027-01-15 TIPS holdings restructured** — an outright sale,
  a change in reinvestment allocation away from a maturity-matched roll, or a bill purchased into
  2027-01-15 that Treasury allocates to the coupon block rather than the bill block. The pool is
  re-read on every pulse from the NY Fed file, not assumed constant.
- **The 2027-01-07 announcement moving the 10-Year off Tuesday 2027-01-12, or breaking the Friday
  01-15 settlement** — leg 13's block shape dissolves and FT-2 dies; a settlement date other than
  01-15 changes the maturing pool entirely and voids FT-3, FT-4 and FT-5 with it.
- **The 2026-09-09, 2026-10-07 or 2026-12-08 reopening clearing outside 2.34–2.70** — the 20-auction
  $39B demand band that legs 7 and 11 chain to breaks, and FT-5's band gets re-cut before the next
  pulse rather than patched.
- **The January FOMC moving into the 2027-01-07 → 2027-01-15 window** — an intermeeting action or a
  rescheduled decision would put this leg into the December sibling's D-1/D-2 cohort and make leg 9's
  "18 of 18 at ≥14 days" a live question rather than a settled one.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-125 | **Initial research banked** (doc above). **Canonical file written by this session** — the event existed only as `proposals/treasury-10y-note-2027-01-12.from-treasury-10y-note-2026-12-08.json`, read in full first per EVENT-RESEARCH.md. **Schedule primary-verified independently of that proposal:** the Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, four streams inflated per page, rows rebuilt from `Tm` coordinates) reads `10-Year NOTE / R / Thursday, January 07, 2027 / Tuesday, January 12, 2027 / Friday, January 15, 2027`, legend `R --denotes reopening`; announced by the **2027-01-07 coupon announcement**; all three January legs settle **Friday 01-15**; status stays `estimate`; **no CUSIP predicted**. **THE PROPOSAL'S FRAME IS REPLACED, NOT REFINED (legs 2–6).** It filed this event as the `cycle-position control` for the December leg's SOMA add-on split (NEW 35/35 mean $12.35B / FIRST reopening 16/35 mean $0.85B / SECOND reopening 27/35 mean $2.70B). That split is a **proxy** for an exact quantity. `auctions_query` carries a field the four sibling 10-Year ledgers never opened — **`soma_holdings`**, the Fed's holdings maturing on the **settlement** date — identical across every coupon leg settling the same day and different from the bill block's (2026-01-15: **$34.64B** on all three coupon legs, **$7.79B** on all three bill legs; 2026-09-15: **$0.00B** coupons beside **$19.37B** bills). **Finding 1 — the split is EXACTLY pro-rata by offering amount and is independent of the roll ratio (leg 3):** 2026-01-15 pool $34.64B → 3-Year $16.88B / 10-Year $11.35B / 30-Year $6.40B = **48.75 / 32.77 / 18.48%** against offering shares 58/39/22 of 119 = **48.74 / 32.77 / 18.49%**; 2026-07-15 reproduces it (32.79%); and **2024-10-15 reproduces it on a 19% partial roll** (32.9%), which is the observation that separates the split from the level. **Finding 2 — the roll ratio is now 100.0% and the date is in the data (leg 4):** rolled ÷ maturing ran **0–64%** across 2024, **61–93%** through 2025-12-01, and has been **exactly 100.0% on all 16 non-zero coupon settlements since 2025-12-31** (2025-12-31, 2026-01-15, 02-02, 02-17, 03-02, 03-16, 03-31, 04-15, 04-30, 05-15, 06-01, 06-30, 07-15, 07-31, 08-17, 08-31). Recorded as a **measurement**, not a policy reading — no implementation note was fetched. **Finding 3 — the January pool is already published, and the method validates out of sample (leg 5):** NY Fed SOMA holdings (`markets.newyorkfed.org`, as of **2026-09-02**, HTTP 200, 433 lines) show exactly two securities maturing **2027-01-15**, both TIPS — **912810PS1** ($5.61B par + $3.68B infl) and **912828V49** ($12.24B + $4.68B) — totalling **$26.21B**. Validation: the same file as of **2026-07-01** gives **$12.34B** maturing 2026-07-15 against Treasury's own **$12.38B** (**0.3%**, accretion drift); as of **2026-01-07** it gives **$42.47B** maturing 2026-01-15 of which **$7.80B** is a bill, leaving **$34.67B** against Treasury's **$34.64B**. **So the expected add-on is ~$8.6B on a ~$47.6B total accepted** (3-Year ~$12.8B, 30-Year ~$4.9B), against the **$2.70B** a second-reopening average implies. **Finding 4 — OCTOBER FALSIFIES THE CYCLE-POSITION READING (leg 6):** second reopenings since 2018 split by month — January **$3.44B** (6/9 positive), April **$3.35B** (9/9), July **$3.14B** (8/9), **October $0.64B (4/8)** — because SOMA held **$8.61B** and **$2.87B** maturing on 2024-10-15 and 2025-10-15. The first-reopening months read the same way from the other side: **2025-09-15, 2025-12-15, 2026-06-15 and 2026-09-15 all $0.00B**. **Finding 5 — a large add-on is not demand, structurally (leg 7):** reconstructing the published bid-to-cover four ways on the last eight prints, only **(total tendered − SOMA) ÷ (total accepted − SOMA)** matches (±0.005 on 8/8); `total ÷ total` reads **2.203** where **2.550** was published on 2026-01-12. The add-on is excluded from both sides and cannot move the ratio. Empirically, **corr(add-on, b/c) = 0.020** over the 20-auction $39B reopening era; splitting at $4B gives b/c **2.566** (n=7) vs **2.550** (n=13), indirect **71.3%** vs **71.9%**. **Finding 6 — the free out-of-sample test lands 35 days early (leg 8):** SOMA holds **no coupon** maturing **2026-12-15** — only bill **912797WF0**, **$11.88B**, and maturing bills fund the bill block (proved on 2026-01-15). So the December sibling's add-on should print **exactly $0.00B** on a **$39.00B** total accepted; registered as **FT-…-2027-01-12-7**, which is sharper than that ledger's own **≤$1.26B** ceiling and fails on any non-zero print. **Finding 7 — the FOMC question does NOT transfer, and that is the honest deflation of `control` (leg 9):** signed days from each January 10-Year auction to the nearest scheduled decision, 2009–2026, are **−20, −14, −14, −14, −21, +21, −15, −14, −21, −21, +21, −21, −15, −14, −21, −21, +20, −16** — minimum absolute distance **14 days in 18 of 18 years**. **2027-01-12 sits D-15** from **2027-01-26/27**, which carries **no asterisk** on `fomccalendars.htm` and therefore **no SEP**; `fomc-blackout-start-2027-01-16` falls after the auction. This leg is a member of the December ledger's own **n=191** `≥5 days from any decision` cohort — it anchors that comparison rather than testing it. **Finding 8 — December's corridor finding INVERTS here (leg 10):** **7** tracked entries within ±5 days against December's **28**; **one** `high` (ISM Services **2027-01-07**) and it lands *before* the auction; settlement window **3 calendar days** (Tue → Fri) against December's **7**. Tape, on **4,423** sessions of par-curve data 2009–2026: auction close → settlement close mean absolute 10-Year move **6.3bp** for January (n=18) vs **9.5bp** December (n=17), **8.3bp** all auctions (n=214) and a **9.0bp** ordinary five-session base rate; the January auction *day* runs **2.9bp** vs **4.0bp** all-auction and **4.2bp** ordinary. Confounds named: n=18, and early-January seasonality — stated as an **absence of precedent**, not an effect. **Finding 9 — 18/18 January reopenings, one term, one maturity (leg 12):** every January 10-Year since 2009 was a reopening, every one carried the term **`9-Year 10-Month`** and every one matured **11-15** — so 2027-01-12 reopens the **2026-11-10** new issue, dated **2026-11-15**, maturing **2036-11-15**, first coupon **2027-05-15**. Note the one-month difference from December's **`9-Year 11-Month`**. **Finding 10 — the block is compressed Mon/Tue/Wed and settles inside its own week (leg 13):** 3-Year **01-11** (a NEW issue, no `R`) + 13-/26-week bills, this leg **01-12** **plus a 6-Week bill auction** and 17-/4-/8-week announcements, 30-Year **01-13** — bracketed by the PDF's own `Holiday - Friday, January 01, 2027 - New Year's Day` and `Holiday - Monday, January 18, 2027 - Birthday of Martin Luther King, Jr.` So this is not the session's sole supply event. **Size (leg 11): $39B expected, the 24th consecutive $39B reopening** since **2024-03-12** — 21 offered, **20 cleared** at b/c mean **2.555**, σ **0.089**, range **2.34–2.70**, yields **3.648% → 4.680%**, competitive indirect **71.7%** (61.4–87.9%) / direct **17.0%** / dealer **11.3%**; the second-reopening subset (n=10) b/c mean **2.526**, indirect **70.5%**. The two January prints in the era: **2025-01-07** b/c **2.530**, indirect 61.4%, dealer 15.6%, add-on **$8.57B**; **2026-01-12** b/c **2.550**, indirect 69.6%, dealer **5.8%**, add-on **$11.35B**. **ONE CORRECTION TO A SIBLING, non-load-bearing (leg 14):** the December ledger calls 2025-12-09's **8.8%** dealer take *"the lowest dealer share in the era"*; it is the **fourth** lowest of 20 — **2025-09-10 4.2%**, **2026-01-12 5.8%**, **2026-07-08 7.8%**, then 8.8%. Its conclusion is untouched; the number is corrected here because two January prints sit in that list. **Adjacency sweep — peers:** n/a (`symbols: []`). **Macro/corridor:** ISM Services **2027-01-07** (estimate, high) before the auction; EIA STEO **01-12**, the 30-Year **01-13**, the coupon announcement **01-14** (which announces the NEXT block — the 20-Year and 10-Year TIPS — not this one), opex **01-15** and FOMC blackout start **01-16** after it, all `medium` or `low`. **TWO dated adjacencies discovered that the calendar does not carry, both PROPOSED in this PR as this event's own files:** `proposals/treasury-coupon-announcement-2027-01-07.from-treasury-10y-note-2027-01-12.json` (the primary that publishes this auction's size and its own `SOMA Holdings Maturing on Issue Date` line, and settles four of this ledger's forward tests) and `proposals/treasury-3y-note-2027-01-11.from-treasury-10y-note-2027-01-12.json` (the block's largest leg at $58B, taking **48.7%** of the same pool). Both were named-and-not-filed by the December sibling for a sibling lane to own; this is that lane. The January 30-Year 01-13 already exists as a proposal. **Volatility:** **VIX 15.72** (09-08 close, CBOE's own `VIX_History.csv`, HTTP 200) vs **14.53** on 09-04; the 09-07 bar is a Labor Day closure artifact, flagged and not adopted. **Rates:** par curve **09-08** — 2Y **4.39** · 3Y **4.44** · 5Y **4.57** · **10Y 4.80** · 20Y **5.26** · 30Y **5.25**, 2s10s **41bp**. **Today's 09-09 reopening (the 21st consecutive $39B, and per Finding 1 the first live read on this mechanism since SOMA holds nothing maturing 2026-09-15) had not printed at the time of writing and this ledger claims nothing about it.** **Geopolitical:** nothing new touching this event. **BLOCKED SOURCES, recorded not substituted:** `bls.gov/schedule/news_release/cpi.htm` and `.../empsit.htm` both **403** to this runner even with a browser user-agent (the known blind spot `ppi-2026-11-13.md` documents), so **no January 2027 CPI or jobs date is proposed** despite both almost certainly falling inside this corridor — both entries are in `probe-ref.blocked`. Every other fetch this session returned HTTP 200. **The FOMC decision series is a DERIVATION from statement URLs (`monetary/<YYYYMMDD>a.htm` on the 2009–2010 pages, `monetary<YYYYMMDD>a1.htm` thereafter) with seven non-scheduled statements excluded by name (2010-05-09, 2019-10-11, 2020-03-03, 2020-03-23, 2020-03-31, 2020-08-27, 2025-08-22; 2020-03-15 kept as the replacement for the cancelled 3/17–18 meeting), checked by its own output — exactly 8 decisions in each of 18 years.** **FT-…-2027-01-12-1** ($39B, scores 2027-01-07), **-2** (block shape holds, scores 2027-01-07), **-3** (the split law: 32.4–33.2% of the block's SOMA award, scores 2027-01-13), **-4** (the level: total accepted $46.6–48.6B — a **band**, deliberately the opposite shape from FT-…-12-08-4's ceiling, scores 2027-01-12), **-5** (b/c inside 2.34–2.70 AND indirect ≥ 61.4%, scores 2027-01-12), **-6** (reopens the 2026-11-10 issue: term `9-Year 10-Month`, dated 2026-11-15, matures 2036-11-15, first coupon 2027-05-15, scores 2027-01-07) and **-7** (the free early test: 2026-12-08 takes exactly $0.00B, scores 2026-12-08) **registered**. | **Stance set** — and it is the *absence* of the December sibling's guard that carries the information: the corridor is thin (7 entries vs 28, one `high` and it lands before the auction, a 3-day settlement window vs 7, a 6.3bp January window vs a 9.0bp base rate), so there is nothing here to be flat *through*. What replaces the guard is a correction to how the family's headline number is read: the SOMA add-on is **arithmetic**, not an average — pool × offering share — and the expected print is **~$8.6B on ~$47.6B**, against the **$2.70B** the proposal's cycle-position framing implies. A reader carrying the December sibling's correct "no ~$11B add-on here" across the cycle boundary without re-checking the maturity calendar will be wrong by about $8B the other way. `symbols: []`, so no symbol-keyed action exists | 2026-09-30 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-10y-note-2027-01-12.json` (`status:
"estimate"`) in the same PR — your own file, never another event's canonical one (#1717). Close-out
fills `## Outcome` below from re-run instrument data (cache busted first), never from memory — after
which this doc goes quiet.
