# Japan 20-Year JGB auction (¥700bn anticipated, issue 198 expected new) — jgb-20y-auction-2026-10-20

**Kind:** rates · **Date:** 2026-10-20 (estimate, EST: mof.go.jp October calendar `2610e.htm` re-fetched direct 2026-09-09, byte-identical to the 09-08 fetch; the size is **not yet announced** — no October row carries an announcement link, and MOF announces "about one week prior") · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["ecb-quiet-period-start-2026-10-21","empire-state-mfg-2026-10-15","fomc-blackout-start-2026-10-17","g20-fmcbg-bangkok-2026-10-15","housing-starts-2026-10-20","import-export-prices-2026-10-16","industrial-production-2026-10-16","mtis-2026-10-15","nahb-hmi-2026-10-19","norway-gpfg-ethics-committee-2026-10-15","opex-2026-10-16","pending-home-sales-2026-10-20","philly-fed-mfg-2026-10-15","ppi-2026-10-15","retail-sales-2026-10-15","tic-monthly-2026-10-16","treasury-20y-bond-2026-10-21","treasury-buyback-10y20y-2026-10-15","treasury-buyback-tips-1y10y-2026-10-21","treasury-coupon-announcement-2026-10-15","treasury-coupon-announcement-2026-10-22","treasury-primary-dealer-agenda-2026-10-16","treasury-5y-tips-2026-10-22"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** Japan sells its 20-year bond on **2026-10-20** — an anticipated ¥700bn, terms due around
10-13. **Nothing here is ours to trade**, and this entry exists because the
[`jgb-30y-auction-2026-10-08`](jgb-30y-auction-2026-10-08.md) ledger nominated it as the falsifier for
its own headline mechanism: the BoJ tapered its **10–25y** purchase bucket **−55%** while leaving
**25y+** flat, so the 20-year "is the tenor where auction demand should deteriorate first." **It did
not.** Month-matched against the 30-year across the window where the two buckets diverged, the
20-year's tail gap **narrowed** (+0.45bp → +0.04bp; difference-in-differences **−0.41bp, t = −0.77**),
and the tenor that actually deteriorated is the one the mechanism says kept its buyer — the 30-year's
mean tail went **0.90 → 1.64bp (t = +2.66)** against the 20-year's **1.35 → 1.66bp (t = +0.55)**. Two
primaries explain the miss. **(1) The bucket is not a tenor.** Summing MOF's own workbook by remaining
maturity, the tapered bucket is only **52.2%** 20-year paper — **45.8%** of it is *seasoned 30-year*
paper, and **66%** of all 30-year bonds outstanding sit inside the tapered bucket. **(2) The sibling's
window starts where the 25y+ taper stopped**: reading the BoJ files back to 2023 shows 25y+ was cut
**−50%** too (¥301.6bn → ¥150.4bn), against 10–25y's −75%. **Where the boundary *is* visible is the
curve, and at 25 years, not 30**: the 25Y par yield is now **above** the 30Y, with 20s25s at the
**94.1st** percentile and 25s30s at the **1.0th**. Date and size both **estimate**; they widen caution
and license nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/9, D-41) | **Stand aside** — nothing on this calendar is exposed to it | High | `symbols: []`, no house playbook is rates- or FX-keyed, and the auction's own size is not announced (no October row on MOF's `2610e.htm` carried an announcement link on 2026-09-09) | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-09 → 2026-10-20** that the tape attributes to a JGB or yen headline — the "no price channel" premise would be wrong |
| This week | **Do not carry the 30-year ledger's "the 20-year breaks first" prediction forward — it is measured and it failed** | High | DiD tail gap **−0.41bp, t = −0.77** (sign reversed), cover gap +0.05, t = +0.29; continuous corr(BoJ 10–25y purchases, 20Y−30Y tail gap) **+0.073, t = +0.47**, n=44 month-matched pairs. The test's floor is ~1.5bp, so this is "no evidence," not "no effect" | The **2026-10-20** result showing a tail **≥ 2.0bp** *and* a cover **below 3.0x** — the joint deterioration the bucket mechanism predicts, and the first observation worth reopening the null (**FT-jgb-20y-auction-2026-10-20-2**) |
| This month | **Judge the print against the 20-year's own calibration, and ignore the new-issue penalty — it is a pre-2015 artifact** | High | Across **344** auctions the 20Y tail runs mean **0.99bp**, median 0.60, p90 **2.00**, p95 2.70, **10.5%** reach 2bp; cover median **3.32**, p10 2.17, p90 4.23. New-issue-vs-reopening looks real on the full history (tail **+0.32bp, t = +2.24**; cover **−0.37, t = −4.58**) and vanishes from 2015 (**t = −0.66** and **+0.25**) | MOF's ~**2026-10-13** announcement naming anything other than a **new issue 198, about ¥700bn, maturing 2046-09-20** — the three-auction Jan/Apr/Jul/Oct rhythm this calibration assumes would have broken (**FT-jgb-20y-auction-2026-10-20-1**) |
| This quarter | **Watch the 25-year point, not the 30-year — that is where the BoJ's boundary shows up** | Medium | 20s25s **+25.7bp = 94.1st percentile** of 5,501 sessions (median +13.7) against 25s30s **−1.3bp = 1.0th** (median +8.5); the 25Y has printed above the 30Y in **63 sessions since 2026-05-27**, out of **83** in the whole history. 20s30s reads only the 66.3rd percentile because it spans the boundary | 25s30s back **at or above its +8.5bp median on 2026-12-31** while 20s25s sits **below its +13.7bp median** — the kink would have left the bucket boundary (**FT-jgb-20y-auction-2026-10-20-4**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to this auction or to the 2026-10-20 session.
- **The prediction this entry was created to test, and its verdict** — "the 20-year deteriorates
  first" is **refuted at the auction level**, DiD **−0.41bp at t = −0.77**, sign reversed.
- **The trap in the calibration** — the new-issue tail penalty is significant on the full history
  (t = +2.24) and gone from 2015 (t = −0.66). Do not handicap 10-20 for being a new issue.
- **Weak print, calibrated to this tenor** — cover below **3.0x** (near the 2.17 p10 only in stress)
  *or* a tail at or above **2.00bp** (p90). The last print, **2026-08-20**, tailed **1.5bp** at 3.98x.
- **Strong print** — cover at or above **4.2x** (p90) with a tail under **0.6bp** (the median), i.e. a
  repeat of 2026-07-14 (4.52x, **0.0bp**).
- **Recent 20-year prints (cover · tail)** — 3.192 · 2.1 (01-20) · 3.077 · 1.1 · 3.247 · 0.5 ·
  **4.820 · 0.2** (04-14, first ¥700bn) · 4.011 · 0.4 · 2.967 · 2.2 (06-25) · **4.522 · 0.0** (07-14) ·
  3.982 · 1.5 (08-20).
- **Do not read a strong cover as demand recovery.** MOF cut this auction **−30%** since June 2025
  (¥1,000bn → ¥800bn → **¥700bn**). A 4x cover on ¥700bn absorbs the same yen as 2.8x on ¥1,000bn.
- **The size is not announced.** MOF's October page was **byte-identical** on 09-08 and 09-09 (24,853
  bytes) with **no announcement href on any October row**. Expect terms **~2026-10-13**.
- **The sequencing fact this entry buys, and it is better than 09-15's** — the US 20-year is
  [`treasury-20y-bond-2026-10-21`](treasury-20y-bond-2026-10-21.md), **D+1**, not the same day. Japan's
  result publishes inside the Tokyo session roughly **18 hours** before the US 1:00pm ET stop, so the
  read is complete rather than concurrent.
- **The level that says the September high is being retested** — the 20Y closing back above **3.864%**
  (MOF par, 2026-09-02, highest since 1996-07-18); it closed **3.717%** on 09-08.
- **Watch (dated)** — **this tenor's own 09-15 auction** (est) · **FOMC Sep 16** · **BoJ Sep 18** (est) ·
  40Y JGB **Sep 29** (est) · 30Y JGB **Oct 8** (est) · **CPI Oct 14** · MOF 10-20 terms **~Oct 13**
  (est) · TIC monthly **Oct 16** · **FOMC blackout Oct 17** · **this auction Oct 20** (est) · **US 20Y
  Oct 21** (est) · JGB Liquidity Enhancement 11–39y **Oct 27** (est) · **FOMC Oct 28** · **BoJ Oct 30**
  (est) · 30Y JGB **Nov 10** (est) · **20Y JGB Nov 18** (est, proposed in this PR) · **40Y JGB Nov 25**
  (est, proposed in this PR).

## Initial research

### The question, plainly

This entry was created with a job already attached. The
[`jgb-30y-auction-2026-10-08`](jgb-30y-auction-2026-10-08.md) ledger closed a gap two earlier siblings
had flagged — it found, in the BoJ's own monthly operation files, that the taper had fallen on the
**"More than 10 years and up to 25 years"** bucket (¥450bn → ¥200bn, **−55%**) while **"More than 25
years"** sat flat at ¥150bn — and offered that as the mechanism behind Japan's kinked super-long curve.
It was honest that this was association plus mechanism with no counterfactual, and it named the
falsifier: *"`jgb-20y-auction-2026-10-20` is proposed in this PR because the tapered bucket is where
demand should deteriorate first if the mechanism is real."*

So the question is not "will the auction go well." It is: **does the BoJ's bucket taper show up in
20-year auction demand — and if it does not, where does it show up instead?**

**One-line verdict:** it does **not** show up in auction demand — a month-matched
difference-in-differences against the 30-year returns **−0.41bp at t = −0.77 with the sign reversed** —
because the bucket is a *remaining-maturity* band and not a tenor, and **66% of outstanding 30-year
paper sits inside the "tapered" bucket**; where the boundary *is* visible is the par curve, whose
maximum has moved to **exactly 25 years**.

### Method

Sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode — no price
instruments, `symbols: []`. Every number below is from a primary fetched direct on **2026-09-09**
unless labelled otherwise:

- **MOF auction calendars** `policy/jgbs/auction/calendar/2610e.htm` (HTTP 200, **24,853 bytes** —
  byte-for-byte identical to the 30-year lane's 09-08 fetch) and `2611e.htm` (HTTP 200, 25,188 bytes).
  `2612e.htm` returns **404**: December is not published yet.
- **MOF auction results**, two forms: the *Auction Results for JGBs* workbook
  (`past_auction_results/Auction_Results_for_JGBs.xls`, 492,032 bytes, last saved 2026-08-13, parsed
  with `xlrd` — 343 twenty-year, 225 thirty-year and 95 forty-year auctions) and the three result
  pages the workbook does not yet carry: `eresul/eresul20260820.htm` (the 08-20 20Y),
  `eresul20260806.htm` and `eresul20260903.htm` (the two most recent 30Y).
- **Bank of Japan monthly market-operation releases**
  `statistics/boj/fm/ope/m_release/<year>/ope<yymm>.xlsx` — **44 workbooks, 2023-01 → 2026-08**, every
  one downloaded and parsed. The 30-year lane read 16 of these covering 2024-01 → 2026-08; this session
  read the same set plus the twelve months of 2023 that precede it, which is what leg 4 turns on.
- **MOF JGB par yield curve** `jgbs/reference/interest_rate/data/jgbcm_all.csv` (13,290 rows,
  1974-09-24 → 2026-08-31) plus the September file `jgbcm.csv` (through **2026-09-08**), both CP932.
  The `english/` path 404s; the Japanese path is what was used, as the 09-15 sibling recorded.
- **US Treasury daily par yield curve** `home.treasury.gov/.../daily-treasury-rates.csv`, **2003–2026**,
  5,925 daily 20Y CMT observations — the US side of the spillover test.
- **Yahoo Finance** for VIX and USD/JPY. Labelled as secondary wherever cited.

No fetch failed except the expected `2612e.htm` 404, which is a calendar that does not exist yet rather
than a blocked source; `probe-ref.blocked` is empty.

### Conviction legs, tested

**1. The date is MOF's, the size is not yet announced, and the issue is predictable — SUPPORTED.**
MOF's October calendar row reads `Oct. 20, 2026 | 20-year`. The page was **byte-identical** across the
09-08 and 09-09 fetches and **no October row carries an announcement href**, against a September page
whose 09-15 row already linked `auct20260908e.htm` — so terms land around **2026-10-13**, one week
prior per MOF's own note.

The size is anticipated at **¥700bn** from the workbook — MOF cut the 20-year ¥1,000bn → ¥800bn
(2025-07-10) → **¥700bn** (2026-04-14) and has held it there for five auctions — and the most recent
print corroborates it from a page the workbook does not carry: 08-20 accepted **¥532.1bn** competitive
plus **¥167.4bn** non-price-competitive I, summing to **¥699.5bn**.

The *identity* is a prediction rather than a fact, and it is worth stating because the calibration in
leg 7 depends on it. MOF has run this tenor on a rigid **three-auction issue rhythm** — a new issue in
**January, April, July and October**, reopened twice — for at least three years: 187 (Jan/Feb/Mar 2024),
188, 189, 190, 191, 192, 193, 194, 195, 196 and 197 (Jul/Aug/Sep 2026, whose second and final reopening
is the 09-15 auction the sibling ledger owns). On that rhythm **2026-10-20 opens issue 198, a new
issue**, and the maturity series steps a quarter each time (195 → 2045-12-20, 196 → 2046-03-20,
197 → 2046-06-20), putting 198 at **2046-09-20**. Registered as `FT-jgb-20y-auction-2026-10-20-1`.

**2. The BoJ bucket taper does NOT show up in 20-year auction demand — REFUTED, and this is the leg
the event was created for.** The 30-year ledger's prediction is directional and testable: if the
−55% cut to the 10–25y bucket removed the 20-year's buyer, 20-year auction quality should have
deteriorated **relative to** the 30-year, whose bucket was untouched. The 30-year is the right control
on its face — same super-long market, same macro, and MOF cut its size by a similar −33% over the same
window, so the supply shock is roughly matched while the BoJ shock is not.

Windows are keyed to the BoJ series itself rather than to calendar years: **period A = 2024-01 →
2025-03**, where both buckets sat flat (¥450bn and ¥150bn), and **period B = 2025-04 → 2026-09**, over
which 10–25y fell to ¥200bn and 25y+ did not move. Auctions are matched by month; both tenors are
monthly, so the pairing is one-to-one.

| Measure | Period A | Period B | Change | t |
|---|---|---|---|---|
| **20Y tail** | 1.353bp (n=15) | 1.659bp (n=17) | +0.305 | **+0.55** |
| **30Y tail** | 0.900bp (n=15) | 1.644bp (n=18) | +0.744 | **+2.66** |
| **20Y cover** | 3.393 (n=15) | 3.503 (n=17) | +0.111 | +0.65 |
| **30Y cover** | 3.364 (n=15) | 3.446 (n=18) | +0.082 | +0.68 |
| **DiD, tail gap (20−30)** | **+0.453bp** (n=15) | **+0.041bp** (n=17) | **−0.412** | **−0.77** |
| **DiD, cover gap (20−30)** | +0.029 | +0.077 | +0.049 | +0.29 |

Read it plainly. The predicted direction was a *widening* 20-minus-30 tail gap; the measured DiD is
**negative**. The continuous version agrees and is no kinder: across **44** month-matched pairs
2023-01 → 2026-08, corr(BoJ 10–25y monthly purchases, 20Y−30Y tail gap) = **+0.073 (t = +0.47)** and
corr with the cover gap = **−0.062 (t = −0.40)**. The one specification that gets anywhere is the
bucket *ratio* (10–25y ÷ 25y+) against the tail gap, **+0.234 at t = +1.56** — still short, and the
sign again says the gap was *wider* when the BoJ was buying *more*.

**Two things stop this being read as more than it is.** First, power: the tail-gap DiD carries a
standard error of **0.54bp**, so the test only reliably detects an effect above roughly **1.5bp**. This
is *no evidence of an effect*, not *evidence of no effect*. Second, the negative sign is fragile in
exactly the way that should make nobody comfortable — dropping the single largest observation
(2025-05, a +6.7bp gap on the 8.7bp tail that was the worst 20-year print of the sample) moves the DiD
to **−0.83bp at t = −2.42**, i.e. "significant" in the direction *opposite* the hypothesis. A result
that becomes significant backwards when one point is removed is a statement about the sample size, not
a finding, and it is reported here as such. Registered as `FT-jgb-20y-auction-2026-10-20-2`.

The residual that does *not* wash out is the row above it: **the 30-year's tail deterioration is the
only significant movement in the table** (t = +2.66), and it belongs to the tenor the mechanism says
was protected. That is not a small anomaly; leg 3 is the reason for it.

*(No contradiction with the 30-year ledger's own "2026 is not a deterioration year," mean tail 1.36bp
vs 2025's 1.56bp at t = −0.49. That split is by calendar year; this one is keyed to the BoJ series and
puts the whole of 2025-04 onward on one side. Both can hold, and they do.)*

**3. The bucket is a remaining-maturity band, not a tenor, and that is why the tenor-label mapping
failed — SUPPORTED, from MOF's own workbook.** The 30-year ledger's mapping was stated cleanly: *"a
newly issued 20-year is in the tapered bucket, a 30- and a 40-year are in the untapered one."* That is
true **only at issue**. A 30-year sold in 2010 has fifteen years to run in 2026 and sits squarely in
the tapered bucket. Summing every outstanding coupon issue in the workbook by remaining maturity as of
the auction date, **2026-10-20** (gross issuance, competitive plus non-price-competitive; this does not
net out the BoJ's own holdings — see limits):

| Bucket | Size | 20-year paper | 30-year paper | 40-year paper |
|---|---|---|---|---|
| **10–25y** (tapered −55%) | **¥244.8trn** | ¥127.8trn — **52.2%** | **¥112.1trn — 45.8%** | ¥4.9trn — 2.0% |
| **>25y** (flat ¥150bn) | **¥91.4trn** | — | ¥48.8trn — 53.4% | ¥42.6trn — 46.6% |

And read by tenor rather than by bucket, the mapping inverts for the very bond the mechanism treats as
protected:

| Tenor | Outstanding | in the **tapered** bucket | in the untapered bucket |
|---|---|---|---|
| 20-year | ¥264.8trn | ¥127.8trn (**48.3%**; the rest has under 10y to run) | 0 |
| **30-year** | **¥171.0trn** | **¥112.1trn — 65.5%** | ¥48.8trn — 28.5% |
| 40-year | ¥47.5trn | ¥4.9trn — 10.4% | **¥42.6trn — 89.6%** |

**Two-thirds of Japan's 30-year paper is in the bucket the BoJ tapered**, and the 40-year is the only
tenor that is nearly clean on either side. That is a coherent explanation for both halves of leg 2: the
20-year has no relative advantage to lose against a control that is itself two-thirds exposed, and the
30-year — the tenor whose float carries the most tapered-bucket exposure in absolute yen after the
20-year — is exactly where the tail deterioration turned up.

The same correction applies to the intensity of the shock. The 30-year ledger normalised BoJ purchases
on **new supply**; the economically right denominator for "who lost their buyer" is the **eligible
float**, which is 2.7× larger in the tapered bucket:

| | BoJ 2024-01 | as % of bucket float | BoJ 2026-08 | as % of bucket float |
|---|---|---|---|---|
| 10–25y | ¥450.6bn/mo | **0.184%/mo** | ¥200.8bn/mo | **0.082%/mo** |
| >25y | ¥150.7bn/mo | **0.165%/mo** | ¥150.4bn/mo | **0.165%/mo** |
| **Ratio** | | **1.12×** | | **0.50×** |

The asymmetry is real — the tapered bucket went from marginally better supported to half as supported —
but it is **roughly a factor of two, not −55% against zero**.

**4. The 25y+ bucket was tapered too; the sibling's window begins where that taper stopped —
SUPPORTED, and it is the same window-start artifact that ledger corrected in *its* siblings.** Reading
the BoJ operation files back through 2023 reproduces the 30-year ledger's 2024-01 → 2026-08 table
exactly, month for month, and then keeps going:

| Month | **25y+** | ops | **10–25y** | ops |
|---|---|---|---|---|
| 2023-06 | **301.6** | 3 | **801.5** | 4 |
| 2023-09 | 300.3 | 3 | 802.5 | 4 |
| 2023-12 | 225.5 | 3 | 601.1 | 4 |
| **2024-01** | **150.7** | 2 | **450.6** | 3 |
| 2025-03 | 150.4 | 2 | 450.9 | 3 |
| 2026-08 | **150.4** | 2 | **200.8** | 2 |

The "**thirty-two consecutive months at ¥150bn**" is accurate and it is also the whole of the post-cut
plateau: the 25y+ bucket was **halved in the 2023-12 → 2024-01 step**, from ¥301.6bn to ¥150.7bn, at
the same time the 10–25y bucket fell from ¥801.5bn to ¥450.6bn. Measured from a **2023-06** baseline
the two tapers are **−50% (25y+)** and **−75% (10–25y)** — an asymmetry, and a much smaller one than
"−55% versus exactly zero." That framing is an artifact of a window that opens on 2024-01, precisely
the month the 25y+ cut completed. The 30-year ledger caught the identical error in two siblings'
issuance tables (*"both sibling windows begin mid-taper"*); this is the mirror image of it in its own
BoJ table, and it is a refinement of a real finding rather than a demolition of one.

**5. Where the bucket boundary *is* visible is the par curve — and it sits at 25 years, not at the
30-year — SUPPORTED as an association with a sourced mechanism.** The 30-year ledger measured
20s30s at the 73.7th percentile against 30s40s at the 1.7th and concluded *"the 30-year is the pivot."*
Splitting 20s30s at the boundary itself relocates the kink one point to the left, onto the BoJ's own
line. On MOF's par curve at **2026-09-08**:

| Spread | Level | Median | **Percentile** | n |
|---|---|---|---|---|
| **20s25s** | **+25.7bp** | +13.7 | **94.1st** | 5,501 |
| **25s30s** | **−1.3bp** | +8.5 | **1.0th** | 5,501 |
| 20s30s | +24.4bp | +21.3 | 66.3rd | 4,607 |
| 30s40s | +0.4bp | +11.2 | 1.7th | 4,607 |

The curve's **maximum is at 25 years**: 3.974% against 3.961% at the 30-year. That inversion has
occurred in **83 of 5,501 sessions since 1999**, and **63 of those 83 have come since 2026-05-27**. The
collapse is recent and near-monotone, in quarterly readings of the monthly mean of 25s30s: **+16.7bp**
(2025-01) · +13.4 (2025-04) · +17.3 (2025-07) · +12.0 (2025-10) · **+3.5** (2026-01) · +3.2 (2026-04) ·
**−3.3** (2026-07) · **−1.9** (2026-09). The sign change falls in **2026-06** (−0.6), the first negative
monthly mean in the series.

20s30s reads mid-range because it **spans the boundary** and averages a 94th-percentile segment with a
1st-percentile one. That is the honest reconciliation of the two ledgers: the kink both measured is
real, it is one point further in than either supposed, and it lands on the BoJ's bucket line.

**This is association plus a plausible mechanism, offered as exactly that, and it carries a specific
caveat the 20s30s framing does not.** MOF's 25-year par point is **fitted**, not a traded on-the-run
issue — there is no benchmark 25-year JGB — so a maximum at exactly 25 years cannot be fully separated
from the curve-fitting method. What the fitting cannot manufacture is the *move*: the same method
produced +16.7bp in January 2025 and −1.9bp now. Registered as `FT-jgb-20y-auction-2026-10-20-4`.

**6. The spillover null is upgraded from n=44 to n=275, and at this tenor it never even looks
significant — SUPPORTED, method borrowed from the 30-year sibling.** The 09-15 ledger tested JGB
20-year auction softness against the same-date US 20Y CMT on **44** auctions from 2023 and found
**t = +0.80**, noting the sample was thin. The 30-year ledger then showed the naive form of this test is
confounded by the auction day's own JGB move and must be run as a partial correlation. Applying that
method to the full matched history — **275** auctions, **2003-10-21 → 2026-08-20**:

| | n | Mean same-date US 20Y change |
|---|---|---|
| Soft JGB auction (tail ≥ 2.0bp) | 20 | **+1.55bp** |
| Firm JGB auction (tail < 2.0bp) | 255 | **−0.21bp** |
| Difference | | **+1.76bp**, **t = +1.24** |

- corr(tail, same-date US 20Y move) = **+0.092** (t = +1.52)
- corr(tail, same-date **JGB 20Y** par move) = **+0.417** (t = **+7.57**) — the tail is mostly a symptom
  of that day's own Tokyo selloff, exactly as at the 30-year
- corr(JGB move, US move) = **+0.161** (t = +2.70)
- **partial corr(tail, US | JGB) = +0.027, t = +0.45**; **D+1 = +0.042, t = +0.69**; US 20Y daily sd on
  auction dates **5.57bp**

Two things are worth saying about this. First, it **reproduces the sibling's 2023+ subsample to the
decimal** (n=44, +1.43 vs −0.10, diff +1.53, t = +0.80), which is the check that two independently
built pipelines agree. Second, and unlike the 30-year, **the raw test at this tenor is not even
nominally significant** — so the 30-year ledger's standing warning ("the naive version will read
significant; do not report it") does not need repeating here. The 20-year's null is simply a null, six
times better powered than the sibling recorded. Registered as `FT-jgb-20y-auction-2026-10-20-3`.

**7. The 20-year's own calibration, and the one trap in it — SUPPORTED.** Judging the 10-20 print needs
this tenor's numbers, and the 30-year ledger established that transplanting a sibling's thresholds is
how calibration goes wrong. Across all **344** twenty-year auctions in the workbook (all multiple-price;
this tenor has never been converted, unlike the 30-year, which MOF converted in 2007):

| Metric | Mean | Median | sd | p10 | p90 | p95 | ≥ 2bp |
|---|---|---|---|---|---|---|---|
| **Tail (bp)** | 0.99 | 0.60 | 1.38 | — | **2.00** | 2.70 | **10.5%** |
| **Cover** | 3.25 | 3.32 | — | **2.17** | **4.23** | — | — |

The 10.5%-reach-2bp figure is the same number the 30-year ledger cited as its cross-tenor comparison,
independently recomputed here, which is a second pipeline agreement.

**The trap is the new-issue penalty.** 10-20 is expected to be a *new* issue (leg 1), and on the full
history new issues do look worse: mean tail **1.131bp** (n=193) against **0.810bp** for reopenings
(n=151), difference **+0.321bp, t = +2.24**, with cover **3.093 vs 3.460**, difference **−0.367,
t = −4.58**. Both dissolve on the modern sample. From **2015** onward: tail **0.800** (n=46) vs
**0.922** (n=94), **t = −0.66**; cover **3.609** vs **3.582**, **t = +0.25**. The full-history split is
a composition artifact — the pre-2015 20-year ran a different issuance rhythm with far more new issues
(193 vs 151 overall; 46 vs 94 since 2015) in a different rate regime. **Do not handicap the 10-20
result for being a new issue.**

**8. The adjacency that matters is that the US 20-year is D+1, not same-day — SUPPORTED, and it makes
this the better of the two sequencing instruments.** On 2026-09-15 Japan and the United States sold
20-year duration on the same date, which the sibling ledger correctly called a free same-day read. On
2026-10-20 the pair is **one session apart**: [`treasury-20y-bond-2026-10-21`](treasury-20y-bond-2026-10-21.md)
is announced on 10-15 and auctioned on 10-21, so MOF's result is fully in the tape roughly **18 hours**
before the US 1:00pm ET stop — complete rather than concurrent, and the only configuration in which the
D+1 spillover coefficient in leg 6 (**+0.042, t = +0.69**) is the directly applicable number rather
than an approximation.

The rest of the ±5-day corridor holds **23** tracked ids, all already known, and none of them changes
the stance: **`retail-sales-2026-10-15` (high)** and `ppi-2026-10-15` five days before,
`opex-2026-10-16` and `tic-monthly-2026-10-16` — TIC being where the 09-15 sibling's repatriation
question gets its independent read — `fomc-blackout-start-2026-10-17` at D−3, and `housing-starts` and
`pending-home-sales` on the day itself. Just outside it, `cpi-2026-10-14` is D−6,
`jgb-30y-auction-2026-10-08` is **D−12** (so this auction is the first 20-year to price *after* that
sibling's result, the sequence the 30-year ledger noted the calendar could not previously test),
`jgb-liquidity-enhancement-11-39y-2026-10-27` is D+7, `fomc-2026-10-28` is D+8 and
`boj-decision-2026-10-30` is **D+10**.

### What plays the conditions support

**None.** The refusal is the correct call four times over: no tracked symbol carries yen-rates
exposure, no house playbook is rates-keyed, the auction-to-US-long-end channel is a null at
**t = +0.45** on 275 observations, and the one mechanism that might have made this auction *interesting*
— the BoJ bucket story — failed its own auction-level test in leg 2. The event's value is entirely
diagnostic: it stops a 10-21 US long-end move being automatically attributed to the US auction, and it
is the calendar's cleanest sequencing instrument at this tenor.

### Honest limits

- **The DiD is underpowered and its control is contaminated.** The tail-gap standard error is 0.54bp,
  so effects under ~1.5bp are invisible; and by leg 3's own float arithmetic the 30-year control is
  itself 65.5% tapered-bucket, which biases the test *toward* a null. `jgb-40y-auction-2026-11-25` is
  proposed in this PR because the 40-year is the only near-clean control — at the cost that it is
  single-price and prints no tail, leaving cover as the sole series.
- **The negative DiD sign is one observation deep.** Dropping 2025-05 flips it to t = −2.42 in the
  wrong direction. Nothing is claimed from the sign; only the absence of the predicted effect.
- **The float arithmetic is gross, not free float.** It sums issuance of still-outstanding bonds from
  MOF's workbook and does **not** net out the BoJ's own holdings, which are large and concentrated. The
  bucket *composition* percentages are robust to that; the "% of float purchased per month" figures are
  lower bounds on the true intensity in both buckets, and the *ratio* between them is what leg 3 leans
  on rather than either level.
- **The 25-year par point is fitted.** There is no benchmark 25-year JGB, so a curve maximum at exactly
  25 years cannot be separated from MOF's fitting method with the data used here. The dated *move* in
  25s30s is the falsifiable part; the exact location of the peak is not.
- **Leg 5 has no counterfactual, same as the sibling's.** The bucket boundary and the curve's peak
  coincide and the direction is what the mechanism predicts, but a demand-side story (lifer duration
  targeting around a 25-year liability point) lands in the same place.
- **The auction result does not exist**, the size is not announced, and the issue identity in leg 1 is
  an inference from a three-year rhythm rather than a fact. MOF's own calendar note allows changes
  "in light of changes in circumstances."
- **VIX and USD/JPY are Yahoo, i.e. secondary**, and the 09-09 readings are intraday rather than settles.
  The MOF par curve stops at **2026-09-08**; the 09-09 Tokyo session had not published at write time.
- **The date is `estimate`.** MOF is a primary source and the date is not in doubt; the label reflects a
  gap in `market-events-data.ts`'s prefix taxonomy, which has no slot for a non-US sovereign debt
  office. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-09, D-41; date and size both `estimate`).** **Stand aside, permanently.** No entry,
exit or hedge is keyed to the 2026-10-20 auction or to the 10-20 or 10-21 sessions. The entry's three
jobs are all diagnostic, and the first of them is now discharged:

- **It was created as a falsifier, and it falsified.** The 30-year ledger's "the 20-year is where
  demand deteriorates first" is refuted at the auction level (DiD **−0.41bp, t = −0.77**, sign
  reversed), and legs 3–4 supply the reason: the bucket is a remaining-maturity band, **66%** of
  30-year paper sits inside it, and the 25y+ bucket was itself cut **−50%** before the sibling's window
  opened. The mechanism is downgraded from "the taper fell entirely on the 20-year" to "the taper was
  asymmetric by roughly a factor of two on a float basis, and it is visible in the curve rather than in
  auction results." That is a smaller claim, and it is the one the data supports.
- **Sequencing** — Japan's result is complete roughly 18 hours before the US 20-year's 10-21 stop, the
  cleanest configuration this pair has had.
- **Attribution** — a long-end move on 10-20 or 10-21 is not automatically the US auction's.

Three reading rules attach to the day itself:

- **Do not handicap the print for being a new issue.** The penalty is a pre-2015 artifact (leg 7).
- **A strong cover is not demand recovery.** MOF cut this auction 30% in fifteen months; restate any
  cover against ¥1,000bn before comparing it to 2025.
- **Judge the tail against this tenor's p90 of 2.00bp**, not the 30-year's 1.69 or the 40-year's
  clearing-gap rule.

**Kill switches.**

1. **The no-price-channel premise breaks** — a tracked name (NVDA/AVGO/MRVL/CRWV) moves **>2%** on a
   session between **2026-09-09** and **2026-10-20** that the tape attributes to a JGB or yen headline.
   This document is rebuilt, not patched.
2. **The bucket-mechanism refutation breaks** — the **2026-10-20** result tails **≥ 2.0bp** *and* covers
   **below 3.0x**. One joint deterioration is not proof against a t = −0.77 null on n=32, but it is the
   first observation of the pattern the mechanism predicts and it reopens the test
   (`FT-jgb-20y-auction-2026-10-20-2`).
3. **The issuance rhythm breaks** — MOF's ~10-13 announcement names other than a new **issue 198**, about
   **¥700bn**, maturing **2046-09-20**. Leg 7's calibration and leg 1's "supply-managed" reading both
   assume that rhythm (`FT-jgb-20y-auction-2026-10-20-1`).
4. **The spillover null breaks** — a **2026-10-20** JGB tail **≥ 2.0bp** followed by a US 20Y CMT rise
   **≥ 5bp on 2026-10-21**. That is the next-session effect transmission would leave and the
   common-factor reading rules out, on the calendar's cleanest same-tenor sequencing date
   (`FT-jgb-20y-auction-2026-10-20-3`).
5. **The curve kink leaves the bucket boundary** — 25s30s back **at or above its +8.5bp median** on
   **2026-12-31** while 20s25s sits **below its +13.7bp median**. The BoJ-bucket reading of the curve
   would no longer describe it (`FT-jgb-20y-auction-2026-10-20-4`).
6. **MOF changes the terms** — any revision to the 10-20 date, or an announced size other than ¥700bn.

The 25y+ bucket's own flat line is **not** re-registered here: it is
[`FT-jgb-30y-auction-2026-10-08-3`](../forward-tests/jgb-30y-auction-2026-10-08.md), scores by
2027-01-15, and leg 4 amends the *framing* of that test's baseline without touching its prediction,
which is about Oct–Dec 2026 actuals and is unaffected.

Four predictions carry score-by dates and are registered in
[`forward-tests/jgb-20y-auction-2026-10-20.md`](../forward-tests/jgb-20y-auction-2026-10-20.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-41 | Initial research banked (above); canonical `src/domain/market-events/jgb-20y-auction-2026-10-20.json` written from the 30-year lane's proposal, now shadowed. **The event was created as a falsifier and it falsified.** `jgb-30y-auction-2026-10-08` predicted the 20-year is "where demand should deteriorate first" under the BoJ's −55% cut to the 10–25y bucket. Month-matched DiD against the 30-year, windows keyed to the BoJ series (**A** 2024-01→2025-03, both buckets flat; **B** 2025-04→2026-09, 10–25y ¥450bn→¥200bn): the 20−30 tail gap **narrowed**, +0.453bp → +0.041bp, **DiD −0.412bp, t = −0.77**; cover gap +0.029 → +0.077, t = +0.29; continuous corr(BoJ 10–25y ¥bn, tail gap) **+0.073, t = +0.47** (n=44 pairs). The only significant move in the table belongs to the tenor the mechanism protects — **30Y tail 0.900 → 1.644bp, t = +2.66**, against 20Y **1.353 → 1.659, t = +0.55**. Power is 0.54bp SE (≈1.5bp detectable) and the negative sign is one point deep (drop 2025-05 → t = −2.42 backwards), so this is *no evidence of the predicted effect*, not evidence of none (`FT-2`). **Two primaries say why the tenor-label mapping failed.** *(a) The bucket is a remaining-maturity band:* summing MOF's workbook by remaining maturity at 2026-10-20, the tapered 10–25y bucket is **¥244.8trn — 52.2% 20-year, 45.8% seasoned 30-year, 2.0% 40-year** — and **¥112.1trn of the ¥171.0trn of 30-year paper (65.5%) sits INSIDE it**, against 89.6% of 40-year paper in the untapered bucket. On the float denominator the BoJ took **0.184%/mo of 10–25y vs 0.165% of 25y+ in 2024-01 (1.12×)** and **0.082% vs 0.165% in 2026-08 (0.50×)** — a factor-of-two asymmetry, not −55% vs zero. *(b) The sibling's window opens where the 25y+ taper ended:* re-reading **44** BoJ monthly files back to **2023-01** reproduces its 2024-01→2026-08 table exactly and then shows 25y+ **¥301.6bn (2023-06) → ¥150.4bn (2026-08), −50%**, against 10–25y's −75%; both halved in the 2023-12→2024-01 step. Same window-start artifact that ledger corrected in *its* siblings. **The boundary IS visible in the curve — at 25 years, not 30.** MOF par 2026-09-08: **25Y 3.974% ABOVE 30Y 3.961%**; **20s25s +25.7bp = 94.1st pctile** of 5,501 (median +13.7) vs **25s30s −1.3bp = 1.0th** (median +8.5); the 25Y has printed above the 30Y in **63 sessions since 2026-05-27 out of 83 ever**; monthly 25s30s +16.7 (2025-01) → −1.9 (2026-09). 20s30s reads only 66.3rd because it **spans** the boundary (`FT-4`; association + mechanism, and MOF's 25Y point is *fitted* — spline artifact not excluded). **Spillover null upgraded n=44 → 275** (2003-10-21→2026-08-20): raw soft (n=20) +1.55bp vs firm −0.21bp, diff +1.76, **t = +1.24** — unlike the 30-year, not even nominally significant before control; corr(tail, same-date JGB move) **+0.417, t = +7.57**; **partial corr(tail, US\|JGB) +0.027, t = +0.45**; D+1 +0.042, t = +0.69; US 20Y sd 5.57bp. Reproduces the sibling's 2023+ cell to the decimal (t = +0.80) — two pipelines agree (`FT-3`). **Calibration + its trap:** across **344** auctions tail mean **0.99bp**, median 0.60, p90 **2.00**, p95 2.70, **10.5% ≥2bp**; cover median 3.32, p10 2.17, p90 4.23. New-issue penalty is real on full history (tail +0.32bp **t = +2.24**; cover −0.37 **t = −4.58**) and **gone from 2015** (−0.12bp t = −0.66; +0.03 t = +0.25) — a pre-2015 composition artifact; do not handicap 10-20 for being new. **Terms:** MOF `2610e.htm` re-fetched **byte-identical** (24,853 B) with **no announcement href on any October row** — ¥700bn anticipated, terms **~2026-10-13**; the 08-20 print corroborates the size (¥532.1bn competitive + ¥167.4bn NPC-I = **¥699.5bn**). On MOF's Jan/Apr/Jul/Oct three-auction rhythm 10-20 opens **new issue 198**, maturity **2046-09-20** (`FT-1`). **Rates (MOF par, primary):** 20Y **3.717%** on 09-08, down from **3.864% on 09-02** (highest since 1996-07-18). **Volatility / FX (Yahoo, secondary):** VIX **15.72** (09-08 close; 1-month range 14.25–16.34, no regime change); USD/JPY **153.81** (09-09 live) from **160.20 on 09-01**, −4.0%. **Peers:** n/a, `symbols: []`. **Adjacency:** 23 tracked ids in the ±5d corridor, all known, headed by **`treasury-20y-bond-2026-10-21` at D+1 — not same-day, unlike 09-15**, which makes this the cleaner sequencing instrument and makes leg 6's D+1 coefficient the directly applicable one; plus `retail-sales-2026-10-15` (high), `tic-monthly-2026-10-16`, `opex-2026-10-16`, `fomc-blackout-start-2026-10-17`. Outside it: `cpi-2026-10-14` D−6, **`jgb-30y-auction-2026-10-08` D−12** (the first 20-year to price after that sibling's result), `jgb-liquidity-enhancement-11-39y-2026-10-27` D+7, `fomc-2026-10-28` D+8, `boj-decision-2026-10-30` D+10. **Two new dated events PROPOSED (`estimate`), both off MOF's November calendar `2611e.htm` fetched direct today (HTTP 200, 25,188 B):** `jgb-20y-auction-2026-11-18` (the second observation this DiD's power needs) and `jgb-40y-auction-2026-11-25` (the only near-clean untapered control, 89.6% of its float in the 25y+ bucket). `2612e.htm` **404s** — December is not published; not a blocked source, `probe-ref.blocked` empty. | Initial stance set — **stand aside permanently**; the entry is a falsifier (discharged), a sequencing instrument and an attribution check, never a signal | 2026-10-09 (low band, 15+ days out: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jgb-20y-auction-2026-10-20.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
