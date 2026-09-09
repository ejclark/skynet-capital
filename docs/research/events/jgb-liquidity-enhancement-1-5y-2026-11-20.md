# Japan Liquidity Enhancement Auction, remaining maturities 1–5 years (¥700bn anticipated) — jgb-liquidity-enhancement-1-5y-2026-11-20

**Kind:** rates · **Date:** 2026-11-20 (estimate, EST: mof.go.jp November calendar `2611e.htm` re-fetched direct 2026-09-09; the size is **not yet announced** — the November row carries no announcement link, and MOF announces "about one week prior") · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["import-export-prices-2026-11-17","industrial-production-2026-11-17","msft-ignite-2026-11-17","mtis-2026-11-17","nahb-hmi-2026-11-17","retail-sales-2026-11-17","apec-leaders-shenzhen-2026-11-18","fomc-minutes-2026-11-18","housing-starts-2026-11-18","jgb-20y-auction-2026-11-18","jpx-market-closure-2026-11-23","pending-home-sales-2026-11-18","tic-monthly-2026-11-18","treasury-20y-bond-2026-11-18","vix-expiration-2026-11-18","advance-services-q3-2026-11-19","retail-ecommerce-q3-2026-11-19","treasury-10y-tips-2026-11-19","treasury-coupon-announcement-2026-11-19","japan-cpi-2026-11-20","opex-2026-11-20","treasury-2y-note-2026-11-23","consumer-confidence-2026-11-24","fhfa-hpi-2026-11-24","treasury-2y-frn-2026-11-24","treasury-5y-note-2026-11-24","beige-book-2026-11-25","durable-goods-2026-11-25","gdp-q3-2026-second-2026-11-25","jgb-40y-auction-2026-11-25","new-home-sales-2026-11-25","pce-2026-11-25","treasury-7y-note-2026-11-25"],"screenStreak":0,"blocked":[{"url":"https://www.mof.go.jp/english/policy/jgbs/auction/calendar/2612e.htm","status":"404","at":"2026-09-09"},{"url":"https://www.mof.go.jp/english/policy/jgbs/auction/calendar/2701e.htm","status":"404","at":"2026-09-09"},{"url":"https://www.mof.go.jp/english/policy/jgbs/reference/interest_rate/data/jgbcm_all.csv","status":"404","at":"2026-09-09"},{"url":"https://www.mof.go.jp/jgbs/reference/interest_rate/data/jgbcm.csv","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** Japan runs the **1–5 year** slot of its Liquidity Enhancement Auction on **2026-11-20** — an
anticipated **¥700bn** reopening of *existing* bonds with one to five years left. **Nothing here is ours
to trade** and this ledger does not pretend otherwise. Its job is the one the 5–11y sibling wrote down
and could not run: *"The 1-5y zone is untracked entirely… the coupon ordering predicts it should show
the same monotonicity; that is an untested prediction."* **Sixteen prints answer it: half right, and the
half that is wrong matters more.** The coupon effect is **real** — paper at or above a **1.0%** coupon is
overweight the sub-1% menu by **+1.170×** (t = +3.34, **14 of 16** auctions). But it is a **step, not a
gradient**: inside the sub-1% menu, which is **80.7% of eligible stock here**, coupon orders **nothing**
(quintile overweights 0.67× / 1.14× / 0.96× / 0.88×), and the sibling's sector ordering **inverts** where
this zone can test it — at matched remaining maturity the **5-Year (0.296% coupon) runs 0.62× against the
10-Year's (0.118%) 1.39×**, paired **−0.766×, t = −2.73, 5-Year ahead in only 4 of 16**. The reason is
that **Japan's yield path is U-shaped**, so coupon proxies issue age with **opposite sign either side of
2012**: float-weighted `corr(coupon, age)` is **+0.681** across the whole menu and **−0.492** inside the
post-2012 cohort. **And neither variable is a law at the extreme** — the oldest, highest-coupon paper on
the menu, **30Y No.1-5 (1999–2000, 2.507%)**, has taken **¥16.5bn in total across 8 auctions**, 0.37×
against the 20-Year's 1.05× at matched maturity. What actually reads is a **pre-2012 20-year pocket**, and
**it is decaying as MOF grows the auction**: **+1.626×** across the ten ¥500bn prints, **+0.410×** across
the six at ¥600–700bn, and **negative (−0.88×) on the last one**. Date and size are both **estimate**; they
widen caution and license nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/9, D-72) | **Stand aside** — nothing on this calendar is exposed to it | High | `symbols: []`, no house playbook is rates- or FX-keyed, and this auction's size and issue list do not exist yet (the November row carries no announcement href on 2026-09-09) | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-09 → 2026-11-20** that the tape attributes to a JGB or yen headline — the "no price channel" premise would be wrong |
| This week | **Score the family's coupon ordering against tomorrow's print, not November's — the terms are already public** | High | The **2026-09-10** auction in this same zone is announced: **¥700bn**, eligible 2Y No.476-488 · 5Y No.154-185 · 10Y No.348-363 · 20Y No.97-129 · 30Y No.1-5, stock shares **10.71 / 35.68 / 37.59 / 15.55 / 0.47%** at coupons **1.229 / 0.720 / 0.100 / 2.055 / 2.507%**. A strict coupon ordering predicts **30Y > 20Y > 2Y > 5Y > 10Y**; this zone's 16 prints predict 10-Year beats 5-Year and 30-Year takes nothing | The **2026-09-10** "Issues Re-opened" page showing **5-Year overweight ≥ 10-Year overweight** — the strict ordering would survive its first out-of-sample test and this ledger's correction would be the error (**FT-jgb-liquidity-enhancement-1-5y-2026-11-20-1**) |
| This month | **Read the family's coupon finding as a threshold at ~1%, and as size-conditional — both are new** | Medium | Across 16 prints, ≥1% coupon beats <1% by **+1.170× (t = +3.34)** while coupon has no ordering power *inside* the sub-1% menu (80.7% of stock). And the pocket shrinks as the auction grows: **+1.626× at ¥500bn (n=10)** vs **+0.410× at ¥600–700bn (n=6)**, difference-of-means **t = 2.13**, with issues reopened rising **22.6 → 38.5** (`corr` with offering **+0.588, t = +2.72**) | A **2026-09-10** print whose ≥1%-coupon overweight exceeds the sub-1% menu by **more than +1.626×** — larger than the ¥500bn-era mean at a ¥700bn size. The dilution mechanism would be refuted by its own best case (**FT-…-3**) |
| This quarter | **Do not carry ANY cover rule between the three JGB liquidity zones — all three disagree** | High | Gross bids track offering size here (**r = +0.649, t = +3.19**), the super-long's signature (+0.734) and the opposite of the mid zone's insignificant **+0.149**. Excess bids are **rising** here (**+0.486, t = +2.08**) where the super-long's were falling. Three zones, three size trajectories (**¥500→¥700bn** here, **¥500→¥650bn flat since 2024-08** at the mid, **¥450→¥250bn** at the super-long) | MOF's **~2026-11-13** announcement naming an offering other than about **¥700bn**, or a band other than **1-5 years** — the size series that drives this reading would have moved again and every correlation above needs recomputing before it is quoted (**FT-…-5**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to this auction or to the 2026-11-20 session.
- **The one comparison to read on the day** — on the "Issues Re-opened" page, **10-Year overweight vs
  5-Year overweight**. If the lower-coupon 10-Year wins again, "monotone in coupon" is dead as a family
  law and the surviving claim is a **≥1% threshold**, not a gradient.
- **Calibrated on n=16, this zone only** — cover **mean 3.781**, sd 0.496, p10 **3.224**, median 3.822,
  p90 **4.475** (min 2.776 on 2026-01-22, max 4.702 on 2025-05-02); excess bids **mean ¥1,561bn**, p10
  **¥1,267bn**, p90 **¥2,006bn**; issues reopened **mean 28.6** (min 6, max 48).
- **Do NOT read the spread tail here — it has four distinguishable values.** Mean **0.24bp**, sd 0.13,
  range **0.00–0.40bp** across all 16 prints, against the mid zone's mean 4.4bp and max 21.0bp. MOF
  reports spreads to 0.1bp, so this zone's tail is at the reporting floor and carries no information.
- **Calibrated weak print** — excess bids below **¥1,267bn** (p10) *or* cover below **3.224** (p10).
  A weak print here is a bid-volume statement; the tail will not tell you.
- **Last print, for reference (2026-07-16)** — bids ¥2,679.3bn, accepted **¥699.0bn**, cover **3.833**,
  excess **¥1,980.3bn**, tail **0.3bp**, **34** issues; 2Y **2.9%** / 5Y **22.2%** / 10Y **60.4%** /
  20Y **14.5%** / 30Y **0.0%** — and the coupon pocket printed **negative (−0.88×)**, its first since
  2025-05.
- **The pocket to watch, and its size condition** — pre-2012 paper (age ≥ 12y) is the strongest single
  split at **+1.571×, t = +4.24, 14/16**, stronger than any coupon cut. It has run
  **+1.21 / +0.65 / +0.56 / +0.09 / −0.88** across the last five prints as the offering went ¥600 → ¥700bn.
- **The size is not announced.** Expect terms **~2026-11-13**; MOF's seven-day lead is confirmed on this
  zone's own next print (announced 2026-09-03 for 2026-09-10).
- **The corridor** — **`jgb-20y-auction-2026-11-18`** two days before, **`jgb-40y-auction-2026-11-25`**
  five days after, and **`japan-cpi-2026-11-20`** plus **`opex-2026-11-20`** on the same date. This is the
  only JGB entry on this calendar whose **own domestic inflation print lands the same morning**.
- **Watch (dated)** — **this zone's own next print Sep 10** (announced, ¥700bn, proposed in this PR) ·
  20Y JGB **Sep 15** (est) · **FOMC Sep 16** · **BoJ Sep 18** (est) · 5-11y LEA **Sep 25** (est) ·
  40Y JGB **Sep 29** (est) · 30Y JGB **Oct 8** (est) · 20Y JGB **Oct 20** (est) · 5-11y LEA **Oct 22**
  (est) · 11-39y LEA **Oct 27** (est) · **BoJ Oct 30** (est) · 30Y JGB **Nov 10** (est) · MOF terms for
  this auction **~Nov 13** (est) · 20Y JGB **Nov 18** (est) · **this auction Nov 20** (est) ·
  Tokyo closed **Nov 23** (est) · 40Y JGB **Nov 25** (est) · 5-11y LEA **Nov 27** (est).

## Initial research

### The question, plainly

This entry was proposed on 2026-09-09 by the
[`jgb-20y-auction-2026-11-18`](jgb-20y-auction-2026-11-18.md) adjacency sweep, on the claim that its
1–5y band sits **outside both BoJ purchase buckets** and so is the nearest thing to a same-week placebo
for a demand story keyed to them. That is true and it is minor. The reason this entry earns a session is
a different sentence, written in this instrument's other sibling —
[`jgb-liquidity-enhancement-5-11y-2026-10-22`](jgb-liquidity-enhancement-5-11y-2026-10-22.md), under
*Honest limits*:

> *"**The 1-5y zone is untracked entirely.** It runs 17 of 35 months on MOF's calendars and this family
> has never read one. The coupon ordering predicts it should show the same monotonicity; **that is an
> untested prediction**, deliberately not proposed here rather than filed as calendar padding."*

So this ledger has one job, and it is not about 2026-11-20:

**does the family's headline coupon ordering survive its first out-of-sample zone?**

**One-line verdict:** **half of it does, and the half that fails is the half the family has been
quoting.** The *existence* of a coupon effect is confirmed on 16 fresh prints — ≥1%-coupon paper beats
the sub-1% menu by **+1.170×, t = +3.34, in 14 of 16 auctions**. The *monotonicity* is refuted: inside
the sub-1% menu (**80.7% of this zone's eligible stock**) coupon orders nothing, the 5-Year/10-Year pair
**inverts** at matched maturity (t = −2.73), and the highest-coupon paper on the whole menu is the paper
nobody buys. The mechanism is that **coupon is a U-shaped proxy for issue age** in Japan; the ordering
holds only across the pre-2012 divide, and this zone is where 80% of the menu sits on one side of it.
Two further corrections fall out: the pocket is **size-conditional** and decaying as MOF grows the
auction, and **no cover rule in this family transfers** between its three zones.

### Method

Sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode — no price
instruments, `symbols: []`. Every number below is computed this session from a primary fetched direct on
**2026-09-09** unless labelled otherwise:

- **MOF auction calendars** — **36** monthly slates, `2401e`–`2611e` (35 × HTTP 200) plus `2612e` and
  `2701e` (both 404 — December 2026 and January 2027 are not published yet, recorded in
  `probe-ref.blocked`, which is why no 2027 date is proposed). Parsed row by row for the zone label, the
  date and the announcement-link state.
- **MOF Liquidity Enhancement result pages** — `eresul/eresul<date>.htm` and its **"Issues Re-opened"**
  companion `eresul<date>a.htm` for **all 16 printed 1–5y auctions 2024-01-05 → 2026-07-16** (32 pages,
  all HTTP 200), parsed cell by cell into bids, accepted, both spreads, and every reopened issue number
  and amount — **1,448 issue-auction observations** in total.
- **MOF auction announcements** — `announcement/auct<date>e.htm` for **all 16** printed auctions **plus
  `auct20260903e`**, the already-published terms for this zone's next print on 2026-09-10 (17 × HTTP 200),
  read for the offering amount and the eligible issue-number ranges.
- **MOF Auction Results for JGBs workbook** (`auction/past_auction_results/Auction_Results_for_JGBs.xls`,
  492,032 bytes, last saved 2026-08-13) — the **2-, 5-, 10-, 20- and 30-year** sheets read for
  **issue number → first issue date → maturity date → nominal coupon → cumulative issued amount**, which
  is what turns a list of reopened issue numbers into coupons, ages, remaining maturities and
  eligible-stock shares. (The sibling ledgers read three sheets; this zone's menu needs five.)
- **MOF JGB par yield curve** — `jgbs/reference/interest_rate/data/jgbcm_all.csv` merged with the
  current-month `jgbs/reference/interest_rate/jgbcm.csv`, **13,296 sessions through 2026-09-08**, of
  which **6,784** fall in the 1999-onward (30-year-bond era) subsample used for the percentiles quoted
  here. Two paths 404 and are recorded in `probe-ref.blocked` — the `/english/` copy of `jgbcm_all.csv`
  and the `data/jgbcm.csv` the siblings cite; both are served by another MOF path, so the source stays
  MOF primary and no prefix downgrade applies.
- **Yahoo Finance** for VIX. Labelled secondary wherever cited.

### Conviction legs, tested

**1. The cadence is every odd month, unbroken, and this is the ONE band MOF has never redefined —
SUPPORTED, and it is what makes the zone a clean control.** Across MOF's 35 published monthly slates
2024-01 → 2026-11:

| Zone | Months present | Pattern | Label change |
|---|---|---|---|
| **1-5y** | **18 of 18 odd months, 0 of 17 even** | **every odd month, no exception** | **none — "1-5 years" throughout** |
| 5-11y (was 5-15.5y) | 35 of 35 | every month | relabelled on the 2026-04 slate |
| 11-39y (was 15.5-39y) | 17 of 17 even months | even months only | relabelled on the 2026-04 slate |

The April 2026 redefinition that reshaped the other two zones **did not touch this one**. That matters
beyond housekeeping: the sibling's controlled experiment exists *because* MOF moved a boundary, and its
finding is therefore conditional on the bonds that moved. This zone's 16 prints run on a **constant
definition**, which is the cleaner test of the same claim.

**2. The coupon effect is REAL in this zone — SUPPORTED, and it confirms the sibling's direction.**
Splitting each auction's own menu by coupon and comparing takeup share with eligible-stock share, then
taking the difference auction by auction:

| Split | Mean overweight difference | t | Auctions positive |
|---|---|---|---|
| coupon ≥ 0.3% vs < 0.3% | +0.520× | +2.04 | 9 / 16 |
| **coupon ≥ 1.0% vs < 1.0%** | **+1.170×** | **+3.34** | **14 / 16** |
| coupon ≥ 2.0% vs < 2.0% | +1.083× | +3.92 | 14 / 16 |
| **issue age ≥ 12y vs < 12y** | **+1.571×** | **+4.24** | **14 / 16** |

High-coupon paper *is* preferred here. The sibling was not wrong that the effect exists. Note already
that the **vintage split beats every coupon split** — that is leg 5.

**3. But it is a STEP, not a gradient — REFUTED as monotonicity, and this is the finding.** Restricting
to the sub-1% menu, which is **80.7% of all eligible stock in this zone** (835 of 1,448 issue-auction
rows), and cutting it into coupon quintiles:

| Quintile | Coupon | Share of sub-1% stock | Share of sub-1% takeup | Overweight |
|---|---|---|---|---|
| 1 | 0.005% | 14.9% | 9.9% | **0.67×** |
| 3 | 0.100% | 55.1% | 62.7% | **1.14×** |
| 4 | 0.200–0.300% | 11.6% | 11.1% | **0.96×** |
| 5 | 0.400–0.900% | 18.4% | 16.2% | **0.88×** |

*(Quintile 2 collapses into 1 and 3 — the coupon distribution is heavily tied at 0.005% and 0.100%.)*
Non-monotone, and the **highest** sub-1% bucket is not the most-bought. Whatever the auction is selecting
on, it is not "more coupon is better" inside the range where four-fifths of the paper lives.

**4. THE SECTOR ORDERING INVERTS AT MATCHED MATURITY — REFUTED, and it is the sibling's own claim
failing.** The sibling's headline was a cross-sector ordering at matched remaining maturity. This zone
has **five** securities to run it on instead of three. For each auction, restricting to the remaining-
maturity window where both sectors have eligible stock, then pairing across auctions:

| Pair (higher-coupon first) | Coupons | Mean overweight | Paired diff | t | Ahead in |
|---|---|---|---|---|---|
| 20-Year vs 5-Year | 2.124% vs 0.296% | 2.34× vs 0.53× | **+1.807×** | **+5.64** | **15 / 16** |
| 20-Year vs 10-Year | 2.116% vs 0.117% | 1.79× vs 0.71× | **+1.081×** | **+3.83** | **13 / 16** |
| **5-Year vs 10-Year** | **0.296% vs 0.118%** | **0.62× vs 1.39×** | **−0.766×** | **−2.73** | **4 / 16** |
| 2-Year vs 5-Year | 0.537% vs 0.076% | 0.76× vs 1.19× | −0.431× | −0.95 | 5 / 12 |
| **30-Year vs 20-Year** | **2.522% vs 2.064%** | **0.37× vs 1.05×** | **−0.678×** | **−1.74** | **1 / 8** |

Read the table as a whole: the ordering holds across the **one large coupon gap** (≈2pp, the 20-Year
against everything younger) and **fails or reverses at every small gap**, including significantly at the
5-Year/10-Year pair and directionally at the top of the menu. Pooled across all 16 auctions the sector
overweights are **2Y 0.77× · 5Y 0.48× · 10Y 1.07× · 20Y 2.37× · 30Y 0.93×** — against coupons of
0.504 / 0.295 / 0.117 / 2.114 / 2.527%. Registered as `FT-jgb-liquidity-enhancement-1-5y-2026-11-20-1`
and `-2`.

**5. The mechanism: Japan's yield path is U-shaped, so coupon proxies issue age with OPPOSITE SIGN
either side of 2012 — SUPPORTED, and it explains exactly where the ordering dies.** Float-weighted
correlation between nominal coupon and years since first issue, over the same 1,448 observations:

| Cohort | Rows | corr(coupon, age) |
|---|---|---|
| Whole menu | 1,448 | **+0.681** |
| Post-2012 (age < 12y) | 910 | **−0.492** |
| Pre-2012 (age ≥ 12y) | 538 | +0.423 |

Inside the post-2012 cohort a **higher** coupon means a **younger**, more on-the-run bond — because JGB
yields collapsed under QQE and have only re-risen since 2024. A liquidity-enhancement auction exists to
reopen paper that has gone **off-the-run**, so "prefer high coupon" and "prefer seasoned paper" point the
**same** way across the 2012 divide and **opposite** ways within the recent cohort. That is precisely the
5-Year/10-Year inversion in leg 4: at matched maturity the 10-Year is the older bond and the 5-Year is
the higher-coupon one, and the auction takes the older one, 12 times in 16.

**6. Neither coupon nor age is a law at the extreme — the highest-coupon paper on the menu is the paper
nobody buys. SUPPORTED, with its small denominator stated.** MOF's own workbook on **30Y No.1-5**, the
oldest and highest-coupon issues eligible anywhere in this zone:

| Issue | Coupon | Matures | Issued |
|---|---|---|---|
| 30-Year No.1 | 2.8% | 2029-09-20 | ¥199.6bn |
| 30-Year No.2 | 2.4% | 2030-02-20 | ¥299.8bn |
| 30-Year No.3 | 2.3% | 2030-05-20 | ¥349.8bn |
| 30-Year No.4 | 2.9% | 2030-11-20 | ¥349.9bn |
| 30-Year No.5 | 2.2% | 2031-05-20 | ¥299.9bn |

Eligible since 2025-05-02, they have appeared on the menu in **28 issue-auction rows across 8 auctions**
and been taken **four times, for ¥16.5bn in total** — ¥16.0bn of it a single take of No.4 on 2026-03-26.
**Six of the eight auctions took none at all.** A monotone-in-coupon law predicts these are the most
wanted bonds in the zone; they are the least. Registered as `FT-…-4`.

**The obvious confound, and why it does not rescue the story.** These are also the **smallest-float**
issues on the menu (mean **¥291bn** each, against 20-Year **¥1,381bn**, 2-Year **¥2,827bn**, 5-Year
**¥4,161bn**, 10-Year **¥7,510bn**), so "nobody buys them because they are thin" is available. But the
issue-level regression in leg 7 puts the float coefficient at **−0.42 (t = −1.54)** — *smaller* float is
weakly associated with *more* overweight, the direction that would make the 30-Year the most wanted, not
the least. Float does not explain it either. What is left is a **pre-2012 20-year pocket** specifically,
not a coupon rule and not an age rule.

**7. At the issue level, with maturity entering continuously, the only robust variable is remaining
maturity — MIXED, and it is the honest bound on everything above.** Weighted least squares over all
1,448 issue-auction observations, dependent = takeup share ÷ eligible-stock share, weights = stock share,
**auction fixed effects** (so no auction's size or date can drive it), n = 1,448, dof = 1,429:

| Regressor | Coefficient | t |
|---|---|---|
| Nominal coupon (%) | +0.210 | **+0.83** |
| Remaining maturity (years) | **+0.556** | **+5.66** |
| log(float) | −0.420 | −1.54 |

Once remaining maturity enters as a continuous variable, **coupon adds nothing significant**. The auction
reliably prefers the **long end of its own 1–5y band** (+0.56× per extra year, t = +5.66) and that is the
one effect that survives every specification. **R² is 0.033** — takeup is lumpy and mostly unexplained,
which is why the sector-level and threshold results above are reported as the robust claims and this
regression as the bound on them, not the reverse.

**8. The pocket is SIZE-CONDITIONAL and decaying — SUPPORTED for the fact, MIXED for the cause.** MOF has
raised this auction twice in twelve months, and the coupon pocket has faded across exactly that window:

| Offering regime | Auctions | Mean ≥1%-coupon pocket | Mean issues reopened |
|---|---|---|---|
| ¥500bn (2024-01-05 → 2025-07-25) | 10 | **+1.626×** | 22.6 |
| ¥600–700bn (2025-09-08 → 2026-07-16) | 6 | **+0.410×** | 38.5 |
| *difference of means* | — | **t = 2.13** | — |

Per print across the last five: **+1.21 / +0.65 / +0.56 / +0.09 / −0.88**. The mechanism is mechanical
and measurable — a bigger auction has to reach deeper into the menu, and issues reopened track the
offering at **r = +0.588, t = +2.72**. **Why MIXED:** size and time are collinear here (the ramp is
recent), and while size fits better than sequence (`corr(pocket, offering) = −0.441, t = −1.84` vs
`corr(pocket, sequence) = −0.242, t = −0.93`), neither is significant on its own and the two cannot be
separated at n = 16. Registered as `FT-…-3`.

**Worth flagging to the family: both zones' most recent prints went the same way.** This zone's
2026-07-16 print broke ranks (−0.88×) and the mid zone's 2026-08-26 print broke ranks the same direction
six weeks later. Two zones, two consecutive reversals, different menus. That is either the coupon/vintage
preference ending across the whole instrument or two coincidences; the next print in each zone
(**2026-09-10 here**, 2026-09-25 there) settles it, which is why this ledger proposes the September date
rather than waiting for its own.

**9. No cover rule in this family transfers — SUPPORTED, and it kills a second inherited reading.** The
mid-zone ledger concluded *"cover is readable at this auction in a way it is not at the super-long,"*
resting on a size that had not moved in 25 prints. That premise is **false here**:

| Statistic | **1-5y (n=16)** | 5-11y (n=32, sibling) | 11-39y (n=12, sibling) |
|---|---|---|---|
| Offering trajectory | **¥500 → ¥600 → ¥700bn (still moving)** | ¥500 → ¥650bn, flat 25 prints | ¥450 → ¥250bn |
| corr(gross bids, offering) | **+0.649, t = +3.19** | +0.149, t = +0.83 | +0.734 |
| corr(excess bids, sequence) | **+0.486, t = +2.08** (rising) | −0.128, t = −0.71 (flat) | −0.624, t = −2.52 (falling) |
| corr(cover, offering) | −0.395, t = −1.61 | −0.438, t = −2.67 | −0.648, t = −2.69 |
| corr(spread tail, cover) | −0.560, t = −2.53 | −0.626, t = −4.40 | −0.786, t = −4.02 |

Gross bids scale with the offering here — the **super-long's** signature, not the mid zone's — but in the
**benign** direction: this auction is *growing* and excess bids are *rising*. So cover here is neither
"readable" (mid zone) nor "a trap" (super-long); it is **contaminated by a ramp that is still in
progress**. Three zones, three size trajectories, three different answers. The portable rule is that
there is no portable rule.

**10. This zone's own curve segment is at a modern extreme, which is the opposite of the mid zone's
finding — SUPPORTED, and the two do not conflict.** On MOF's par curve merged through 2026-09-08:

| Measure | 2026-09-08 | Median | Percentile | Sample |
|---|---|---|---|---|
| **1-year par** | **1.557%** | — | **99.9th** | 6,784 sessions since 1999 |
| **2-year par** | **1.848%** | — | **99.9th** | 6,784 |
| **5-year par** | **2.258%** | — | **99.9th** | 6,784 |
| 1s5s | +70.1bp | +29.7bp | 87.7th | 6,784 |
| 2s5s | +41.0bp | +23.4bp | 72.7th | 6,784 |
| *(5s10s, the mid zone's measure)* | *+63.8bp* | *+52.4bp* | *62.4th* | *9,935* |

Only **3, 3 and 4** sessions since 1999 have carried a higher 1-, 2- and 5-year par yield, and every one
of them is inside the last two weeks (maxima 1.564% on 2026-09-07, 1.854% and 2.332% on 2026-09-02). The
mid-zone ledger called its own segment *"unremarkable"* and located the family's dislocation past 20
years — that was a statement about curve **shape**, and it stands. This is a statement about front-end
**level**, and the front end has never in the 30-year-bond era been here. Both are true; say which one
you are citing. *(On the full history back to 1974 the same readings are ordinary — 1s5s 76.7th of
12,648, the 5-year level 56.3rd of 13,296 — because the pre-1999 sample contains the high-rate decades.
The 1999-onward window is the one quoted above and is stated with its n every time.)*

**11. Volatility context — SUPPORTED (Yahoo, secondary).** VIX **15.72** on the 2026-09-08 close against
15.30 on 09-07, ten-session range **14.32–16.34**. No regime change. `symbols: []`, so no peer or
underlying tape applies.

### What plays the conditions support

**None.** No tracked symbol has yen-rates exposure and no house playbook is rates-keyed. The refusal is
inherited rather than re-tested — the 30-year sibling ran the JGB→US-long-end spillover test in its
cleanest available form and it died under control, and a **front-end** reopening auction has a weaker
claim on that channel than any of them.

What this entry is *for* is that it is the family's **first out-of-sample test of its own headline**, and
it returns three corrections the siblings could not make from their own zones: the coupon effect is a
**threshold at ~1%** rather than a gradient, it is a proxy for **vintage** that inverts inside the
post-2012 cohort, and it is **decaying as MOF grows the auction**.

### Honest limits

- **The strongest single result is a fixed-effects regression with R² = 0.033.** Takeup at this auction
  is lumpy — one large bidder can own a print — and nothing here explains most of the variance. The
  sector- and threshold-level results are reported because they survive pairing across 16 auctions, not
  because the underlying process is well-modelled.
- **Coupon, issue age and original tenor are collinear by construction in a maturity-bucketed zone.** A
  10-Year at 3 years remaining is 7 years old; a 5-Year at 3 years remaining is 2 years old. Leg 5 shows
  the *sign* of the coupon–age relationship flipping across 2012, which is what makes the inversion
  interpretable, but this ledger cannot say whether the auction is selecting on age, on off-the-run
  illiquidity, on repo specialness, or on holder composition. It can say it is **not** selecting on
  coupon monotonically, and **not** on float.
- **Repo specialness is unmeasured and is the most likely omitted variable.** The instrument exists to
  reopen paper that is hard to source; a bond's specialness is exactly what would drive that, and no
  primary source in this session carries it.
- **The 30-Year denominator is 0.47% of the menu and n = 8.** The direction (essentially never taken) is
  consistent across all eight, but the magnitude should never be quoted without that.
- **The size/time confound in leg 8 is not resolved.** Both raises fall in the last twelve months, so
  "bigger auctions dilute the pocket" and "the preference is fading over time" fit the same 16 points.
  The forward test is written to be scored on the *level*, which is the part both stories agree on.
- **Eligible stock is computed from the workbook's cumulative issued amounts**, which stop at the
  2026-07 auctions, and it counts **face issued**, not float — it ignores BoJ holdings, buy-backs and
  anything else out of the tradeable stock. BoJ ownership is heaviest in the 10-Year sector, so the bias
  runs toward **understating** the 10-Year overweight — the direction that would make leg 4's inversion
  *stronger*, not weaker.
- **The November eligible-issue list does not exist.** Every share and coupon quoted for 2026-11-20 uses
  the **2026-09-10** announced ranges as the prior; MOF's ~2026-11-13 announcement will move them as
  bonds roll out of the band, and the denominators are recomputed before anything is scored.
- **The spread tail is uninformative here and the distribution is not transferable.** Sixteen prints
  spanning 0.00–0.40bp at 0.1bp reporting granularity is four distinguishable values. The mid zone's
  n=32 tail distribution (mean 4.4bp, max 21.0bp) describes a different instrument and neither transfers
  to the other.
- **The auction result does not exist**, and neither does its size or its issue list. Everything here is
  prior.
- **VIX is Yahoo, i.e. secondary**, and is a US reading with no mechanical bearing on a JGB auction; it
  is carried because the probe-ref contract asks for it.
- **The date and the size are both `estimate`.** MOF is a primary and the date is not in doubt; the
  label reflects an unannounced size, an unpublished issue list, and a gap in `market-events-data.ts`'s
  prefix taxonomy, which has no slot for a non-US sovereign debt office. Estimates widen caution and
  license nothing.

## Stance & kill switches

**Stance (2026-09-09, D-72; date and size both `estimate`).** **Stand aside, permanently.** No entry,
exit or hedge is keyed to the 2026-11-20 auction or to the 11-20 session. The entry is kept for four
diagnostic jobs, in descending order of value:

1. **It runs the family's headline out of sample and returns a threshold, not a gradient.** ≥1%-coupon
   paper beats the sub-1% menu by **+1.170× (t = +3.34, 14/16)** — the sibling's direction, confirmed.
   Inside the sub-1% menu, **80.7% of eligible stock here**, coupon orders nothing (0.67× / 1.14× /
   0.96× / 0.88×). Quote the threshold; never quote the gradient again.
2. **It supplies the mechanism, and the mechanism predicts where the ordering will keep failing.**
   Japan's yield path is U-shaped, so `corr(coupon, age)` is **+0.681** across the whole menu and
   **−0.492** inside the post-2012 cohort. Wherever a menu is dominated by post-2012 paper, coupon and
   seasonedness point opposite ways and the ordering inverts — which is exactly the 5-Year/10-Year pair
   here (**−0.766×, t = −2.73, 4/16**).
3. **It kills a second inherited reading: no cover rule transfers between the three zones.** Gross bids
   track size here (**+0.649, t = +3.19**) as at the super-long and unlike the mid zone (+0.149), but
   the auction is *growing* and excess bids are *rising* (**+0.486, t = +2.08**). Three size
   trajectories, three answers.
4. **It dates the decay.** The pocket ran **+1.626×** across the ten ¥500bn prints and **+0.410×**
   across the six at ¥600–700bn (difference of means **t = 2.13**), and printed **negative** on
   2026-07-16 — six weeks before the mid zone's own reversal on 2026-08-26.

Three reading rules attach to the day itself:

- **The comparison that matters is 10-Year vs 5-Year, not the headline.** It is the pair where coupon
  and vintage disagree, and it is the only cell in this family that can distinguish them.
- **Read the "Issues Re-opened" page, not the headline row** — as at both siblings, the headline is
  nearly uninformative, and here the tail is uninformative too.
- **Score against 2026-09-10, not against this event.** This zone's next print is already announced
  (¥700bn, eligible list published 2026-09-03), so the ordering question is settled seventy-one days
  before this auction. Waiting is a choice to learn later.

**Kill switches.**

1. **The no-price-channel premise breaks** — a tracked name (NVDA/AVGO/MRVL/CRWV) moves **>2%** on a
   session between **2026-09-09** and **2026-11-20** that the tape attributes to a JGB or yen headline.
   This document is rebuilt, not patched.
2. **The strict coupon ordering survives after all** — the **2026-09-10** "Issues Re-opened" page shows
   the **5-Year overweight at or above the 10-Year's**, reversing a 12-of-16 record. Legs 3–5 and the
   whole "threshold, not gradient" reading go with it (`FT-…-1`).
3. **The correction fails to replicate at this event** — the **2026-11-20** page shows the same
   5-Year ≥ 10-Year reversal. One print is noise; two consecutive is the reading dying (`FT-…-2`).
4. **The dilution mechanism is refuted by its own best case** — the **2026-09-10** ≥1%-coupon pocket
   prints **above +1.626×**, larger than the ¥500bn-era mean at a ¥700bn size. Leg 8 does not survive
   that (`FT-…-3`).
5. **The 30-Year exception closes** — **30Y No.1-5** takes **5% or more** of accepted on either
   2026-09-10 or 2026-11-20, after ¥16.5bn total across eight auctions. Leg 6's "neither coupon nor age
   is a law at the extreme" would be a small-sample artefact (`FT-…-4`).
6. **The instrument is redefined or resized** — MOF's **~2026-11-13** announcement names a band other
   than **1-5 years**, or an offering that does not round to **¥700bn**, ending a five-print run. Every
   size-conditioned statistic in legs 8 and 9 is recomputed before it is quoted again (`FT-…-5`).
7. **The cadence breaks** — MOF's **January 2027** calendar (`2701e.htm`, currently 404) publishes
   without a 1-5y row, ending an 18-of-18 odd-month run. Leg 1's "the one band MOF never touched" would
   be wrong and every n-based calibration would need re-dating.
8. **The eligible-stock benchmark moves under the ratios** — MOF's ~2026-11-13 announcement names issue
   ranges that shift any security's share of eligible stock by more than **5pp** from the 2026-09-10
   basis (2Y 10.71% · 5Y 35.68% · 10Y 37.59% · 20Y 15.55% · 30Y 0.47%). The overweight denominators are
   recomputed before any ordering is read.

Five predictions carry score-by dates and are registered in
[`forward-tests/jgb-liquidity-enhancement-1-5y-2026-11-20.md`](../forward-tests/jgb-liquidity-enhancement-1-5y-2026-11-20.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-72 | Initial research banked (above); canonical `src/domain/market-events/jgb-liquidity-enhancement-1-5y-2026-11-20.json` written from the 20-year lane's proposal, which is now shadowed. **THE FAMILY'S COUPON ORDERING RUN OUT OF SAMPLE FOR THE FIRST TIME — HALF SURVIVES.** The 5-11y ledger named this zone as its untested prediction; 16 prints (2024-01-05 → 2026-07-16, 1,448 issue-auction observations, MOF result + "Issues Re-opened" + announcement pages, all HTTP 200) say the effect is **real but a STEP, not a gradient**: ≥1%-coupon paper beats the sub-1% menu by **+1.170×, t = +3.34, 14/16**, while **inside** the sub-1% menu — **80.7% of eligible stock here** — coupon orders nothing (quintiles **0.67× / 1.14× / 0.96× / 0.88×**, non-monotone). **THE SECTOR ORDERING INVERTS AT MATCHED MATURITY:** paired across 16 auctions, **20Y beats 5Y +1.807× (t = +5.64, 15/16)** and **20Y beats 10Y +1.081× (t = +3.83, 13/16)**, but **5Y (0.296% coupon) LOSES to 10Y (0.118%) by −0.766× (t = −2.73, ahead in only 4/16)** and **30Y (2.522%) loses to 20Y (2.064%) by −0.678× (1/8)**. Pooled sector overweights **2Y 0.77× · 5Y 0.48× · 10Y 1.07× · 20Y 2.37× · 30Y 0.93×**. **MECHANISM — JAPAN'S YIELD PATH IS U-SHAPED, SO COUPON PROXIES ISSUE AGE WITH OPPOSITE SIGN EITHER SIDE OF 2012:** float-weighted `corr(coupon, age)` **+0.681** whole menu, **−0.492** post-2012 cohort (910 rows), **+0.423** pre-2012 (538). The vintage split is the strongest cut tested (**age ≥12y: +1.571×, t = +4.24, 14/16**) (`FT-1`, `FT-2`). **NEITHER IS A LAW AT THE EXTREME:** 30Y No.1-5 (issued 1999-2000, coupons 2.2-2.9%, ¥1.50tn) have been on the menu in **28 issue-auction rows across 8 auctions** and taken **¥16.5bn ever**, none at all in **6 of 8**; the float confound cuts the wrong way (regression `log(float)` **−0.42, t = −1.54**, i.e. smaller float → *more* overweight) (`FT-4`). **HONEST BOUND:** issue-level WLS with auction fixed effects (n=1,448) leaves **coupon insignificant (+0.210, t = +0.83)** and only **remaining maturity significant (+0.556/yr, t = +5.66)**; **R² = 0.033**. **THE POCKET IS SIZE-CONDITIONAL AND DECAYING:** **+1.626× across the ten ¥500bn prints** vs **+0.410× across the six at ¥600-700bn** (difference of means **t = 2.13**), last five **+1.21 / +0.65 / +0.56 / +0.09 / −0.88**, with issues reopened rising **22.6 → 38.5** (`corr` with offering **+0.588, t = +2.72**) — a bigger auction reaches deeper and dilutes any pocket; filed **MIXED** because size and sequence are collinear (`FT-3`). **FLAG TO THE FAMILY:** this zone broke ranks on 2026-07-16 and the mid zone broke ranks the same direction on 2026-08-26 — two zones, two consecutive reversals. **NO COVER RULE TRANSFERS:** gross bids track offering here (**+0.649, t = +3.19**, the super-long's signature) against the mid zone's insignificant +0.149, but excess bids are **rising** (**+0.486, t = +2.08**) where the super-long's fell — three zones, three size trajectories (**¥500→¥600→¥700bn** here, **¥500→¥650bn flat 25 prints**, **¥450→¥250bn**), three answers. **FIRST DISTRIBUTION FOR THIS ZONE (n=16):** cover mean **3.781** (sd 0.496, p10 3.224, p90 4.475, min 2.776 on 2026-01-22, max 4.702 on 2025-05-02), excess bids mean **¥1,561bn** (p10 ¥1,267bn, p90 ¥2,006bn), issues reopened mean **28.6** (6-48); **the spread tail is at the reporting floor** — mean **0.24bp**, full range **0.00-0.40bp** at 0.1bp granularity, against the mid zone's mean 4.4bp / max 21.0bp — **do not read it here**. **CADENCE, AND THE ONE BAND MOF NEVER REDEFINED:** a 1-5y row appears in **18 of 18 odd months** and **0 of 17 even** across slates 2401e → 2611e, label unchanged throughout, while both siblings were relabelled on the 2026-04 slate. **CURVE, AND IT DOES NOT CONTRADICT THE MID ZONE:** 1y/2y/5y par **1.557 / 1.848 / 2.258%**, each at the **99.9th percentile of 6,784 sessions since 1999** with only 3/3/4 higher ever, all inside the last two weeks; 1s5s **+70.1bp = 87.7th**, 2s5s **+41.0bp = 72.7th**. The mid zone's "unremarkable" was about curve **shape** (5s10s 62.4th); this is front-end **level**. **Process:** the November row carries **no announcement href** — **¥700bn is anticipated, not announced**, terms due **~2026-11-13** (MOF's seven-day lead confirmed by auct20260903e for the 2026-09-10 print); **2612e.htm and 2701e.htm both 404** (not published, which is why no 2027 date is proposed) and two `jgbcm` paths 404 (another MOF path serves the same primary, no prefix downgrade) — all four in `probe-ref.blocked`. **Volatility (Yahoo, secondary):** VIX **15.72** (09-08 close, ten-session range 14.32-16.34, no regime change). **Peers:** n/a, `symbols: []`. **Adjacency:** 33 tracked ids in the ±5d corridor — **`jgb-20y-auction-2026-11-18`** at D-2, **`jgb-40y-auction-2026-11-25`** at D+5, **`japan-cpi-2026-11-20`** and **`opex-2026-11-20`** same-date (the only JGB entry here whose own domestic inflation print lands the same morning), plus `retail-sales-2026-11-17`, `fomc-minutes-2026-11-18`, `treasury-20y-bond-2026-11-18` and `pce-2026-11-25`/`gdp-q3-2026-second-2026-11-25` at D+5. **One new dated event PROPOSED (`estimate`), off MOF's own calendar:** `jgb-liquidity-enhancement-1-5y-2026-09-10` — this zone's immediately preceding print, **already announced** (¥700bn; eligible 2Y No.476-488 · 5Y No.154-185 · 10Y No.348-363 · 20Y No.97-129 · 30Y No.1-5, stock shares 10.71 / 35.68 / 37.59 / 15.55 / 0.47% at coupons 1.229 / 0.720 / 0.100 / 2.055 / 2.507%), which makes it the **scoring instrument** for `FT-1` and `FT-3` seventy-one days before this auction rather than calendar padding. No 2027 date proposed — MOF has not published one. | Initial stance set — **stand aside permanently**; the entry is the family's first out-of-sample test of its own headline, and it returns three corrections: threshold not gradient, vintage not coupon, and no portable cover rule | 2026-10-09 (low band; interval tightens from 30d to 7d once inside 15 days of the event) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jgb-liquidity-enhancement-1-5y-2026-11-20.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
