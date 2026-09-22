# Philadelphia Fed Aruoba Term Structure of Inflation Expectations (ATSIX), November 2026 — aruoba-inflation-term-structure-2026-11-20

**Kind:** macro-print · **Date:** 2026-11-20 (estimate, EST: philadelphiafed.org/calendar-of-events re-fetched direct 2026-09-09 HTTP 200 at 131,096 bytes and parsed as data — 12 ATSIX rows, all 2:00 p.m., verbatim "Aruoba Term Structure of Inflation Expectations | Nov 20 2026 | 2:00 p.m.") · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.07,"daysBand":"low:15+","adjacentIds":["advance-services-q3-2026-11-19","apec-leaders-shenzhen-2026-11-18","beige-book-2026-11-25","case-shiller-hpi-2026-11-24","consumer-confidence-2026-11-24","durable-goods-2026-11-25","fhfa-hpi-2026-11-24","fomc-minutes-2026-11-18","gdp-q3-2026-second-2026-11-25","housing-starts-2026-11-18","import-export-prices-2026-11-17","industrial-production-2026-11-17","japan-cpi-2026-11-20","jgb-20y-auction-2026-11-18","jgb-40y-auction-2026-11-25","jgb-liquidity-enhancement-1-5y-2026-11-20","jpx-market-closure-2026-11-23","msft-ignite-2026-11-17","mtis-2026-11-17","nahb-hmi-2026-11-17","new-home-sales-2026-11-25","ofgem-price-cap-announcement-2026-11-25","opex-2026-11-20","pce-2026-11-25","pending-home-sales-2026-11-18","philly-fed-price-inflation-expectations-q4-2026-11-25","retail-ecommerce-q3-2026-11-19","retail-sales-2026-11-17","survey-of-professional-forecasters-q4-2026-11-16","tic-monthly-2026-11-18","treasury-10y-tips-2026-11-19","treasury-20y-bond-2026-11-18","treasury-2y-frn-2026-11-24","treasury-2y-note-2026-11-23","treasury-5y-note-2026-11-24","treasury-7y-note-2026-11-25","treasury-coupon-announcement-2026-11-19","uk-cpi-2026-11-18","uk-labour-market-2026-11-17","uk-ppi-2026-11-18","uk-public-sector-finances-2026-11-20","vix-expiration-2026-11-18"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL","status":"000","at":"2026-09-09"},{"url":"https://download.bls.gov/pub/time.series/cu/cu.data.1.AllItems","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **This event was proposed as the instrument that turns "is the energy shock passing
through to expected inflation?" from a one-horizon question into a question about which part of
the curve moved. The curve does not have parts.** The Philadelphia Fed publishes 118 horizon
columns, 3 to 120 months. Regressing each of them on `[1, level, slope, curvature]` across all
**344 vintages** returns **R² ≥ 0.99924 at every single horizon** (worst is the 10-year; mean
0.99964), and the publisher's own technical-note equation with τ₁ = 0 reproduces all **40,592**
published points at **RMSE 0.0024pp, max error 0.042pp**. **"Which part moved" has exactly three
answers, not 118** — and one of the three, the 5y5y forward, *is* the level factor (2.258% against
L = 2.258 on the Aug-26 vintage). **The proposal's second task is now settled too: ATSIX is model
output, not a survey** — the publisher's words are "created by using a factor model to optimally
combine major surveys," namely the SPF and the two Blue Chip titles, forecasting **CPI** as a
continuously compounded annualized rate. **The third task was a decline candidate and it declines,
on measurement.** The long end updates **four months a year, not twelve**: mean |m/m| in the
10-year point is **0.0599pp in Mar/Jun/Oct/Dec versus 0.0319pp in the other eight** (ratio **1.88**,
Welch **t = 5.86**, n = 343), and **0.0698 vs 0.0293** on the level factor itself (ratio **2.38**,
**t = 7.60**), surviving the post-2016 model-change subsample. **November is not one of the four.**
Across **28 Novembers** the 10-year point's median absolute move is **0.0293pp — about three basis
points** — and only 2022 ever exceeded 0.10pp. **And the instrument is a smoother, not a detector,
which is fatal for the question it was filed to answer.** Scored against realized BLS CPI over
real-time vintages from Aug-2016, ATSIX beats a trailing-12-month random walk at every horizon
(MAE ratio **0.73 at two years**) — but split by target window at h = 12 it runs **bias +0.34, MAE
0.50** on pre-2021 targets, **bias −2.99, MAE 3.08** on 2021–23 targets, and **bias −0.32, MAE
0.37** on 2024-onward targets. **Accurate in a quiet regime, three percentage points wrong at the
regime break.** So when ATSIX shows the 3-month expected-CPI point *falling* **3.40% → 2.55%**
(Jul-25 → Aug-26) and the 10-year moving **+0.01pp** to 2.27% against re-fetched gasoline at
**$4.157/gal, +30.2% y/y** — that silence is what this instrument does at a turn, and it **cannot
be read as an answer**. **The release hour finishes it.** 14:00 ET on **2026-11-20, the third
Friday — November opex** (`opex-2026-11-20`, `medium`, confirmed), with **42 tracked events inside
five days**; the instrument's own stated use, "pricing securities whose returns are linked to
inflation expectations at arbitrary horizons," is served continuously and for free by the breakeven
curve, which `treasury-10y-tips-2026-11-19` prices with real money **the day before**. Date is
**`estimate`** — and the November row is the one row of twelve that **no rule derives**, because
the proposal's Thanksgiving explanation does not survive (2026-11-27 is not a federal holiday).
`symbols: []`; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-72) | **Stand aside** | High | `low` impact, `estimate` date, `symbols: []`, 72 days out. No consensus exists for a model-fitted research curve, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed, and the published product is three free numbers re-expressed as 118 columns (R² ≥ 0.99924 per horizon on 344 vintages). | The Philadelphia Fed re-dating the November release off **2026-11-20** on the calendar endpoint re-fetched here, which voids every dated leg and forces this document to be re-derived rather than pulsed |
| This week | **Stand aside — and do not reach for ATSIX to answer the corridor's pass-through question** | High | Measured, this instrument under-responds at exactly the moment a pass-through question is being asked: h = 12 bias **−2.99pp**, MAE **3.08** on targets inside 2021-01…2023-12, against **MAE 0.50** pre-2021 and **0.37** from 2024. Its flat reading against gasoline **+30.2% y/y** (EIA, week ending **2026-09-07**, re-fetched) is a property of the smoother, not evidence about prices. | A later vintage showing the 3-month point moving more than **1.0pp inside a single month** while realized CPI has not yet turned — which would mean ATSIX does lead at a break and this leg's bias table was a sample artifact. Settled by any monthly vintage through **2027-06-30** |
| This month | **Stand aside; November is measured to be one of the quiet months for this series' long end** | High | Across **28 Novembers** the 10-year point's median |Δ| is **0.0293pp** and its mean **0.0371pp**, ranking **7th of 12 months**; only **1 of 28** (2022, +0.15pp) exceeded 0.10pp. The four live months are **Mar/Jun/Oct/Dec** (mean 0.0599 vs 0.0319, Welch **t = 5.86**). Nothing between now and 11-20 changes which month it is. | **The Nov-2026 vintage published 2026-11-20 moving the 10-year point by ≥ 0.10pp** versus the Oct-2026 vintage — `FT-aruoba-inflation-term-structure-2026-11-20-1` dies and November stops being a quiet month |
| This quarter | **Decline the family — keep this one researched row and do not add the other eleven 2027 ATSIX dates** | Medium | Twelve calendar rows a year for a series whose long end moves in four of them, whose 118 horizons are three numbers, and whose stated use is already priced continuously by breakevens, is eleven non-events a year. Confidence is **medium**, not high, because the Mar/Jun/Oct/Dec explanation (semiannual Blue Chip long-range issues) is **unverified** — the seasonal is measured, its cause is a hypothesis. | The **Dec-2026 vintage (published 2026-12-29)** moving the 10-year by **less** than the Nov-2026 vintage did — the out-of-sample instance of the seasonal fails, `FT-…-2` dies, and the decline rests on a pattern that did not hold |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade this print.** `low` impact, `symbols: []`, `estimate` date, no macro-keyed house
  playbook, and no release-hour test is run or claimed here.
- **The published "term structure" is three free numbers.** Each of the 118 horizon columns
  regressed on `[1, level, slope, curvature]` over 344 vintages: **R² ≥ 0.99924** at every horizon,
  mean **0.99964**. The technical note's own equation at τ₁ = 0 reproduces all **40,592** points at
  **RMSE 0.0024pp**, max **0.042pp**. The **5y5y forward is the level factor** (2.258 vs L = 2.258).
- **ATSIX is model output, not a survey** — a factor model over the SPF and the two Blue Chip
  titles, forecasting **CPI**, continuously compounded, annualized, horizons 3–120 months.
- **It is a smoother, not a detector.** h = 12 vs realized BLS CPI, real-time vintages Aug-2016+:
  targets ≤ 2020-12 **bias +0.34 / MAE 0.50** (n=41) · targets 2021-01…2023-12 **bias −2.99 / MAE
  3.08** (n=36) · targets ≥ 2024-01 **bias −0.32 / MAE 0.37** (n=30).
- **It does beat a naive rule in a quiet regime** — MAE ratio vs a trailing-12-month random walk:
  **0.96 / 0.92 / 0.81 / 0.73 / 0.71 / 0.90** at h = 3/6/12/24/36/60. That is a real property and
  it is not a licence to act; it is why the instrument is worth reading, not worth a calendar row.
- **The long end lives four months a year.** 10-year |m/m| **0.0599 (Mar/Jun/Oct/Dec) vs 0.0319
  (other eight)**, ratio **1.88**, Welch **t = 5.86**, n = 343; level factor **0.0698 vs 0.0293**,
  ratio **2.38**, **t = 7.60**. Post-2016-model-change subsample: **1.42 (t = 2.00)** and **1.74
  (t = 3.11)**, n = 116.
- **The SPF quarters show nothing at the long end.** Feb/May/Aug/Nov 10-year |Δ| **0.0376** vs
  **0.0430** for the other eight — slightly *lower*. So "five days after SPF Q4 (`2026-11-16`,
  proposed, `estimate`)" carries no information either.
- **Zero measured pass-through, and it does not count as evidence.** EIA re-fetched **2026-09-09**:
  US regular gasoline **$4.157/gal** week ending **2026-09-07**, **+30.2% y/y** (all grades
  **$4.295**, +29.4%), running **+20.6% to +29.4%** all year. Over the same window ATSIX's 3-month
  point fell **3.40% → 2.55%** and the 10-year moved **+0.01pp** to **2.274%**, the **23.8th
  percentile** of 344 vintages.
- **Read the publisher's prose with suspicion — two pieces of it are stale.** The landing page says
  ATSIX "is updated around the 20th of the month after the source data are released"; the 2026
  schedule is the **last Friday** in ten of twelve months. The technical note says the model is
  re-estimated "roughly once every year, usually in February"; **λ has changed exactly once in 344
  vintages** — at **2019-08** (0.11987689 → 0.12088537) — which is the note's own stated tell.
- **The November date is the one row of twelve that no rule derives.** Ten of twelve are the last
  Friday; **December 29 is a Tuesday because 2026-12-25 is Christmas Day** (airtight). **November
  20 is the third Friday**, a full week early, and **2026-11-27 is not a federal holiday** — only
  Thanksgiving Day (11-26) is, and the Reserve Banks are open on 11-27. The proposal's holiday
  explanation is **refuted**; the date rests on the calendar row alone and stays `estimate`.
- **The hour is November opex.** 14:00 ET on the **third Friday** (`opex-2026-11-20`, `medium`,
  confirmed), with **42 tracked events inside five days** — retail sales (`high`) 11-17, FOMC
  minutes + VIX expiration 11-18, **10y TIPS auction 11-19**, PCE + GDP-2nd (both `high`) 11-25.
- **Watch (dated):** SPF Q4 **11-16** (proposed, `estimate`) · retail sales **11-17** · FOMC minutes
  **11-18** · 10y TIPS **11-19** · **this release 11-20, on opex** · PIES **11-25** · PCE + GDP-2nd
  **11-25** · Thanksgiving **11-26** · FOMC **12-09** · CPI **12-10** · CR expiry **12-11**
  (`estimate`) · **Dec ATSIX 12-29** (a live long-end month, and deliberately not proposed).

## Initial research

### The question, plainly

`proposals/aruoba-inflation-term-structure-2026-11-20.from-philly-fed-price-inflation-expectations-q4-2026-11-25.json`
filed this event on one substantive claim and three named tasks. The claim: PIES answers the
corridor's energy pass-through question "at a single fixed horizon," whereas ATSIX is *"a different
shape of answer: a monthly TERM STRUCTURE of expected inflation from one month out to ten years, so
a pass-through question that PIES can only answer at a single fixed horizon becomes a question about
which part of the curve moved."* The tasks, assigned to whoever wrote the canonical file: **(a)**
re-verify the date and the 2:00 p.m. time against an ATSIX-specific release page rather than the
shared calendar row; **(b)** establish whether ATSIX is a **survey or a model output**, *"which
would change what a move in it means and is NOT settled by the calendar row"*; **(c)** decide
*"whether a monthly research series earns twelve calendar rows a year or none, which is a genuine
DECLINE candidate."*

**One-line verdict:** **(b)** settles from the primary — it is model output — **(c)** declines on
measurement, and **(a)** discharges only partially, with the proposal's holiday explanation
refuted; the substantive claim is **REFUTED twice over**, because the curve has **three** free
parameters rather than 118 horizons, and because the instrument is measured to under-respond by
**three percentage points** at exactly the regime break a pass-through question is asking about.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies as written and the cache-busting rule
has no target. This event existed only as one proposal file, so per the mode contract that proposal
was read first and the canonical
`src/domain/market-events/aruoba-inflation-term-structure-2026-11-20.json` written in this PR. Five
inputs, all fetched direct **2026-09-09**:

1. **The Philadelphia Fed calendar endpoint** (`/calendar-of-events`, HTTP 200, **131,096 bytes**),
   parsed as data rather than read: the embedded payload holds **237** release rows across **18**
   families, of which exactly **12** are ATSIX. The `?release=` filter is client-side, as the
   [PIES sibling](philly-fed-price-inflation-expectations-q4-2026-11-25.md) established — the
   filtered URL returns the same body, so this is the whole calendar and the filtered one is a view.
2. **The ATSIX landing page** (`/surveys-and-data/real-time-data-research/atsix`, HTTP 200,
   **36,815 bytes**) — the ATSIX-specific surface task (a) asked for, and the source of the
   model-vs-survey answer.
3. **The technical note** (`/-/media/frbp/assets/surveys-and-data/atsix/atsix-technical-document.pdf`,
   HTTP 200, **61,282 bytes**), decompressed and text-extracted locally this session — the source
   of the model equation, the CPI definition, the release-timing constraint and the re-estimation
   claim.
4. **The published data, from the publisher's own workbook, not a mirror.** `ATSIX_Vintages.xlsx`
   (HTTP 200, **1,095,255 bytes**) unzipped and its three sheets parsed directly: `InfExp` and
   `Real` carry **344 monthly vintages, 1998-01 → 2026-08**, at **118 horizons** (3–120 months);
   `Factors` carries `level`, `slope`, `curvature`, `lambda` per vintage. Every ATSIX figure below
   comes from that file.
5. **Realized CPI and the energy tape, both re-fetched.** BLS CPI-U all items, seasonally adjusted
   (`CUSR0000SA0`) via `api.bls.gov/publicAPI/v2`, HTTP 200 — **126 monthly observations,
   2016-01 → 2026-07**, one gap at **2025-10** (BLS's own footnoted missing value). EIA retail
   gasoline via `api.eia.gov/v2`, HTTP 200, both regular and all-grades series. **FRED and
   `download.bls.gov` both failed** and neither was silently substituted — see *Honest limits* and
   `probe-ref.blocked`. VIX **16.07** is CBOE's own delayed feed at 2026-09-09 10:41:16 ET (prev-day
   close **15.72**). The event's date is **`estimate`**, and that label rides on every
   trading-adjacent line below.

### Conviction legs, tested

1. **What ATSIX is — SETTLED, and it is MODEL OUTPUT. This discharges task (b).** The landing page,
   verbatim:

   > "The ATSIX is created by using a factor model to optimally combine major surveys — the Survey
   > of Professional Forecasters published by the Federal Reserve Bank of Philadelphia and the Blue
   > Chip Economic Indicators and Blue Chip Financial Forecasts published by Wolters Kluwer Law &
   > Business — using a methodology in Aruoba (2016)."

   And it is a *smoothing* device by design, in the publisher's own framing of the problem:
   *"because surveys ask respondents to forecast inflation rates for noncontiguous time horizons,
   the resulting data points are widely spaced."* ATSIX interpolates between them. The technical
   note fixes the rest: the target is **CPI**, continuously compounded and annualized —
   `π(t→t+s) ≡ 100 × (12/s)·[log P(t+s) − log P(t)]` — and *"the shortest horizon of survey
   forecasts used in the computation of ATSIX is three months and the longest is (approximately) ten
   years, and as a result we report ATSIX for horizons from 3 to 120 months."*

   **This matters exactly as the proposal predicted it would.** A move in a survey is respondents
   changing their minds. A move in ATSIX is a four-parameter fit re-estimating over survey inputs
   that are themselves monthly-to-semiannual. Nothing in ATSIX is fresh information; it is a
   re-expression of information the SPF and Blue Chip already published.

2. **The curve does not have parts — the 118 horizons are three free numbers. The proposal's central
   claim is REFUTED, and this is the leg the event turns on.** Two independent demonstrations,
   both run this session on the publisher's own file.

   *Analytically*, from the technical note's own equation (1), which for expectations from `t` over
   `τ₂` months (τ₁ = 0) reduces to `π = L − a·S + (a − e^{−λτ₂})·C` with `a = (1 − e^{−λτ₂})/(λτ₂)`.
   Applied to every vintage's own `Factors` row and compared with every published `InfExp` cell:

   | Points compared | RMSE | Max abs error |
   |---|---|---|
   | **40,592** (344 vintages × 118 horizons) | **0.0024pp** | **0.042pp** |

   *Empirically*, without assuming any functional form — each of the 118 horizon columns regressed
   on `[1, level, slope, curvature]` across the 344 vintages:

   | Horizon (months) | 3 | 12 | 24 | 60 | 120 |
   |---|---|---|---|---|---|
   | R² | 0.99999 | 0.99999 | 0.99999 | 0.99964 | **0.99924** |
   | RMSE (pp) | 0.0019 | 0.0006 | 0.0006 | 0.0023 | 0.0033 |

   **Worst of all 118 horizons: R² = 0.99924. Mean: 0.99964.** The residual is a third of a basis
   point, which is filtering noise, not information.

   **So "which part of the curve moved" has exactly three answers** — level, slope, curvature — and
   the proposal filed this event for a resolution the instrument does not possess. One corollary
   makes the point concrete: the 5y5y forward, computed from the note's equation at τ₁ = 60,
   τ₂ = 120 on the Aug-26 vintage, is **2.258%**, and the level factor on that vintage is **2.258**.
   The far forward *is* the level factor, to three decimals, by construction.

3. **The series is a smoother, not a detector — and that is fatal for the question it was filed to
   answer.** Scored against realized BLS CPI on the note's own continuously compounded definition,
   using only real-time vintages (**Aug-2016 onward**, the note's own real-time cutoff — item 6:
   *"Results from August 2016 and later are truly 'real time' since no information that is realized
   after the month is used"*). The benchmark is a random walk: trailing 12-month realized inflation
   known at the vintage date.

   | Horizon | n | ATSIX MAE | Random-walk MAE | Ratio | ATSIX bias |
   |---|---|---|---|---|---|
   | 3 mo | 110 | 1.911 | 1.983 | 0.964 | −0.817 |
   | 6 mo | 107 | 1.549 | 1.687 | 0.919 | −0.900 |
   | 12 mo | 102 | 1.384 | 1.720 | **0.805** | −1.023 |
   | 24 mo | 90 | 1.455 | 1.988 | **0.732** | −1.212 |
   | 36 mo | 78 | 1.573 | 2.230 | **0.705** | −1.407 |
   | 60 mo | 54 | 1.791 | 1.981 | 0.904 | −1.791 |

   **ATSIX beats the naive rule at every horizon.** That is a genuine property and it is stated
   plainly here because the honest version of a decline says what the thing is good at. But the
   errors are not evenly distributed, and splitting h = 12 by the window the forecast is *about*
   shows the whole story:

   | Target window | n | Bias | MAE |
   |---|---|---|---|
   | ends ≤ 2020-12 | 41 | **+0.34** | **0.50** |
   | ends 2021-01 … 2023-12 | 36 | **−2.99** | **3.08** |
   | ends ≥ 2024-01 | 30 | **−0.32** | **0.37** |

   **Half a point of error in a quiet regime; three points of error through the break.** An
   instrument that is accurate precisely when nothing is happening and three percentage points wrong
   when something is, is a smoother. It is the wrong tool for a pass-through question by
   construction, and the proposal reached for it for exactly that purpose.

4. **The corridor's pass-through question — ATSIX reads flat, and leg 3 says that reading is not
   evidence.** The standing question across all four Philadelphia Fed ledgers on this shelf is
   whether the energy shock is reaching prices. Re-fetched from EIA this session rather than
   inherited (the PIES sibling carried `$4.071` for the week ending 2026-08-31, which reconciles
   exactly to **regular grade** — that citation was right, and this session extends it):

   | EIA weekly retail gasoline, US | 2026-09-07 | y/y |
   |---|---|---|
   | Regular grade | **$4.157** | **+30.2%** |
   | All grades | **$4.295** | **+29.4%** |

   The shock is not new and it has not faded: all-grades y/y ran **+25.5% (Mar-30)**, **+20.6%
   (Jun-29)**, **+27.4% (Aug-31)**, **+29.4% (Sep-07)**. Against that, the ATSIX curve:

   | Vintage | h = 3 | h = 12 | h = 60 | h = 120 |
   |---|---|---|---|---|
   | 2025-07 | 3.40 | 2.91 | 2.36 | 2.27 |
   | 2026-08 (latest) | **2.55** | **2.41** | **2.29** | **2.274** |

   The most energy-sensitive point on the curve **fell 0.86pp** over a year in which gasoline rose
   30%, and the 10-year moved **+0.01pp**, sitting at the **23.8th percentile** of all 344 vintages
   (range 2.10–2.71) while the 3-month sits at the **82.3rd** (range 0.99–4.27).

   **Read naively this is a clean "no pass-through, expectations anchored" finding, and it agrees
   with the PIES sibling's district-level answer.** It is reported here because it is what the data
   says. But leg 3 forbids leaning on it: this is the instrument that was **−2.99pp** at the last
   regime break. Its flat long end is the model's prior, not the market's verdict, and any future
   session that cites ATSIX as evidence that a shock is *not* passing through should read leg 3
   first.

5. **Task (c) — the family DECLINES, and the reason is a measured seasonal.** Does a monthly
   research series earn twelve calendar rows a year? Mean absolute month-over-month change in the
   10-year point, by calendar month, over the full 344-vintage history:

   | Rank | Month | Mean |Δ| | Median |Δ| |
   |---|---|---|---|
   | 1 | **March** | 0.0684 | 0.0644 |
   | 2 | **December** | 0.0665 | 0.0547 |
   | 3 | **June** | 0.0556 | 0.0578 |
   | 4 | **October** | 0.0490 | 0.0391 |
   | … | … | … | … |
   | 7 | **November** | **0.0371** | **0.0293** |
   | 12 | September | 0.0197 | 0.0190 |

   Grouped and tested:

   | Group | 10-yr mean |Δ| | Level-factor mean |Δ| |
   |---|---|---|
   | **Mar / Jun / Oct / Dec** (n = 114) | **0.0599** | **0.0698** |
   | The other eight months (n = 229) | 0.0319 | 0.0293 |
   | Ratio · Welch *t* | **1.88** · **t = 5.86** | **2.38** · **t = 7.60** |

   It is not an artifact of the deep history: restricted to vintages from 2017 onward (n = 116,
   after the October-2016 model rewrite), the ratios are **1.42 (t = 2.00)** on the 10-year and
   **1.74 (t = 3.11)** on the level factor — smaller, same sign, still significant.

   **Eight months of the year, the long end of this curve does not move.** Only **30%** of all 343
   month-over-month changes exceed **0.05pp** and only **8.5%** exceed **0.10pp**; exactly **one**
   in 344 vintages exceeded 0.20pp. **Twelve calendar rows a year would be eight to eleven
   non-events.** The verdict: **keep the one researched row — this document, which retires the
   family on the record — and do not propose the other eleven.**

   **The likely cause is named and explicitly NOT verified.** The four live months are precisely
   the months in which the two Blue Chip titles are widely described as carrying their semiannual
   *long-range* consensus forecasts (Blue Chip Economic Indicators in March and October, Blue Chip
   Financial Forecasts in June and December) — which would explain why the *long* end updates on
   that rhythm while the near end does not (h = 3 shows **no** such pattern: 0.0856 vs 0.0930, ratio
   0.92). This session could not reach a primary Wolters Kluwer schedule to confirm it, so it is
   recorded as a **hypothesis with a falsifier**, and the decline does not depend on it: the
   seasonal is measured whatever causes it.

6. **The SPF quarters do not move the long end either, so "five days before its quarterly cousin" is
   empty.** The proposal placed this event beside PIES (11-25) and a sibling proposed SPF Q4 for
   **2026-11-16** — four days before this release. If SPF were the thing that moves ATSIX, the SPF
   months would show it. They do not:

   | Group | 10-yr mean |Δ| | 12-mo mean |Δ| |
   |---|---|---|
   | Feb / May / Aug / Nov (SPF quarters) | **0.0376** | 0.0690 |
   | The other eight months | **0.0430** | 0.0603 |

   The long end moves *slightly less* in SPF months. Whatever the SPF contributes to the fit, it
   does not surface as a long-end move in the month it publishes — so the adjacency the proposal
   built on (SPF 11-16 → ATSIX 11-20 → PIES 11-25 as a three-instrument corridor) is a calendar
   coincidence, not an information chain.

7. **Task (a) — PARTIALLY discharged, and the proposal's holiday explanation is REFUTED.** Weekday
   arithmetic reproduced this session, not recalled:

   | | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | **Nov** | **Dec** |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Row | 30 | 27 | 27 | 24 | 29 | 26 | 31 | 28 | 25 | 30 | **20** | **29** |
   | Weekday | Fri | Fri | Fri | Fri | Fri | Fri | Fri | Fri | Fri | Fri | **Fri** | **Tue** |
   | Last Friday of month | 30 | 27 | 27 | 24 | 29 | 26 | 31 | 28 | 25 | 30 | **27** | **25** |
   | Matches rule? | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **✗** | **✗** |

   **December is airtight:** its last Friday is **2026-12-25**, Christmas Day, a federal holiday on
   which the Reserve Banks are closed, so the release moves to Tuesday **12-29**.
   **November is not.** 2026-11-20 is the **third Friday**, a full week before the last Friday
   (11-27). The proposal explained this as Thanksgiving-driven, but **2026-11-27 is not a federal
   holiday** — Thanksgiving Day 2026 is **11-26** (the fourth Thursday, verified this session), the
   equity half-day on 11-27 is an exchange convention, and Federal Reserve Bank offices are open. A
   half-day equity session does not explain moving a 2:00 p.m. research release a week early, and no
   rule in the publisher's own material derives 11-20.

   **What ATSIX-specific corroboration does exist.** The landing page carries its own
   last-updated stamp, **"28 Aug '26"**, which matches the calendar's own August row (**Aug 28**)
   and the workbook's last vintage (**2026-08**) exactly — an ATSIX-specific surface agreeing with
   the shared calendar on the one date both carry. The technical note independently constrains the
   timing: *"we publish the ATSIX monthly (after the 15-day average nominal yield curve is available
   but before we can compute a 30-day average),"* which 11-20 satisfies. But **no ATSIX-specific
   page carries a forward date** — the landing page says only *"View a complete list of upcoming
   release dates on the Economic Release Calendar."* Task (a) is therefore **partially** discharged,
   the entry stays **`estimate`**, and the date carries a dated falsifier rather than a derivation.

8. **Two pieces of the publisher's own prose are stale — a caution for every future session that
   reads this bank's pages.** Both were caught by checking prose against the published data:

   - The landing page states ATSIX *"is updated around the 20th of the month after the source data
     are released."* The **2026 schedule is the last Friday** in ten of twelve months — the 24th to
     the 31st. Only November's row is near the 20th, and it is the row nothing explains.
   - The technical note states: *"We reestimated the model on August 29, 2019. Subsequently we plan
     on reestimating the model roughly once every year, usually in February,"* and names its own
     tell: *"a month where reestimation is done can be identified by the changing value of 'lambda'
     in the 'Factors' tab."* **λ has changed exactly once in all 344 vintages** — at **2019-08**,
     from `0.11987689` to `0.12088537` — and has not moved in the **84 monthly vintages since**.
     Seven Februaries have passed. The plan was not executed, and the note still describes it in the
     future tense.

   Neither is a defect in the data. Both mean the **prose on these pages is not a reliable contract**
   and the published file is; that is a transferable finding for the three sibling Philadelphia Fed
   ledgers on this shelf.

9. **The release hour, and why there is nothing to read even if there were something to say.**
   Querying `src/domain/market-events/` directly, **42 tracked events** fall within five days of
   2026-11-20. The load-bearing ones:

   | Date | ET | Event | Impact | Status |
   |---|---|---|---|---|
   | 11-16 | 10:00 | `survey-of-professional-forecasters-q4-2026-11-16` (proposal only) | low | estimate |
   | 11-17 | 08:30 | `retail-sales-2026-11-17` | **high** | confirmed |
   | 11-18 | 14:00 | `fomc-minutes-2026-11-18` | medium | confirmed |
   | 11-18 | — | `vix-expiration-2026-11-18` | low | confirmed |
   | **11-19** | 13:00 | **`treasury-10y-tips-2026-11-19`** | medium | estimate |
   | **11-20** | **14:00** | **this release** | **low** | **estimate** |
   | 11-20 | close | **`opex-2026-11-20`** | medium | **confirmed** |
   | 11-25 | 08:30 | `pce-2026-11-25`, `gdp-q3-2026-second-2026-11-25` | **high** | confirmed |

   Two things finish the case. First, **the slot is November opex** — a `low`-impact model-fitted
   research curve published at 14:00 into the single most flow-dominated afternoon of the month has
   no identifiable tape, and none is claimed here in either direction. Second, and more
   substantively: the landing page's own claim for the instrument is that it is *"useful to market
   participants for pricing securities whose returns are linked to inflation expectations at
   arbitrary horizons."* **The breakeven curve already does that, continuously, for free** — and
   `treasury-10y-tips-2026-11-19` prices the ten-year point of it with real money **the day
   before**. A monthly, four-parameter, survey-smoothing estimate published the next afternoon
   cannot inform a market that has already voted.

### What plays the conditions support

**None.** Explicitly, and for reasons measured here rather than assumed:

- `symbols: []` — no tracked name carries an expected-inflation-curve channel, so there is nothing
  to express a view in.
- No house playbook (**S1/S2/E1/S3/S4 + G1**) is macro-keyed; all are symbol- or earnings-keyed, and
  the kill list in [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) has no entry this could
  revive.
- The date is **`estimate`**, and per the date policy
  ([`trade-playbooks.md`](../../plans/trade-playbooks.md) decision log) date-keyed *action* requires
  `confirmed`. An estimate widens caution and licenses nothing — and this one is weaker than most,
  because leg 7 shows no rule derives it.
- Leg 9 removes even a hypothetical identification: the slot is opex, and the same information is
  priced by breakevens a day earlier.

The output of this session is a **refutation** (legs 2 and 3), a **settled question** (leg 1), a
**decline with its measurement** (leg 5), a **methodological caution about the publisher's prose**
(leg 8), and a **corrected date story** (leg 7) — not a position.

### Adjacency sweep, and why it proposes nothing

All five dimensions run, and the sweep's output this time is a deliberate **zero proposals**:

- **Peer prints / sibling instruments.** ATSIX's inputs are the SPF and the two Blue Chip titles.
  SPF Q4 (**2026-11-16**) is already on the shelf as a sibling's proposal; the Blue Chip titles are
  **paid, non-public** Wolters Kluwer publications with no citable release calendar this session
  could reach, so no dated event exists to propose. Leg 6 shows the SPF quarters do not move the
  long end anyway.
- **The one dated thing this sweep found is deliberately NOT proposed.** The 2026 calendar gives the
  December ATSIX as **2026-12-29, 2:00 p.m.**, and December is one of the four live long-end months
  — the single most defensible ATSIX row on the whole calendar. Filing it would contradict leg 5's
  own verdict two paragraphs after writing it. It is recorded here instead, and
  `FT-aruoba-inflation-term-structure-2026-11-20-2` scores against it without a calendar row. **A
  sweep that finds a dated event and declines to file it is a first-class outcome**, and this is the
  reasoning on the record.
- **Macro surprises.** The load-bearing dates before this release are the **11-03** midterms, retail
  sales **11-17**, FOMC minutes **11-18**, then FOMC **12-09** and CPI **12-10** — all already
  tracked. None reaches a monthly model fit whose survey inputs close before it.
- **Volatility regime.** VIX **16.07** (CBOE delayed feed, 2026-09-09 10:41:16 ET; prev-day close
  **15.72**). No options-shaped play is contemplated, so the regime is baseline only.
- **Geopolitical / policy.** The **12-11** funding cliff (`cr-expiry-2026-12-11`, `estimate`) is the
  corridor's live branch and lands **after** this release; the energy shock is leg 4 and it is
  measured, not narrated.
- **Event tape.** No consensus, whisper or implied move exists for a Federal Reserve Bank research
  series, and none is manufactured here.

### Honest limits

- **The forecast scoring spans one regime, and it dominates.** The real-time window starts Aug-2016,
  so every horizon beyond two years is scored almost entirely on targets containing the 2021–22
  surge. That is exactly why leg 3 reports the **split** rather than the pooled MAE; the pooled
  numbers alone would flatter an instrument that was 3pp wrong through the break.
- **n is small at the long horizons** — 54 observations at h = 60 and none at h = 120, because the
  ten-year point cannot be scored until 2036. **Nothing in this document tests the 10-year point's
  accuracy**; leg 5 tests only how much it *moves*, which is a different claim.
- **The Blue Chip long-range explanation is unverified.** The Mar/Jun/Oct/Dec seasonal is measured
  (t = 7.60 on the level factor). Its cause is a hypothesis this session could not confirm against a
  primary Wolters Kluwer schedule, and it is labelled as such in leg 5 and given a falsifier in
  `FT-…-2`.
- **The three-factor result is a fact about the published product, not a criticism of the model.**
  Aruoba (2016) is a term-structure model and a parsimonious factor representation is its design,
  not a flaw. The finding is about what a *reader* can extract: a session hoping to see the 18-month
  point move independently of the 24-month point will never see it, because they cannot.
- **The November date rests on one surface.** Leg 7 refutes the proposal's explanation but supplies
  no replacement rule; only the calendar row itself carries 11-20. If that row is wrong, this
  document's dated legs are wrong with it, which is the Today-horizon falsifier.
- **Two data paths failed and neither was substituted silently.** FRED returned a connection failure
  (`000` — HTTP/2 stream error) on `fredgraph.csv`, and `download.bls.gov`'s bulk CPI file returned
  **403** to a plain fetcher. Realized CPI comes from **`api.bls.gov/publicAPI/v2`** instead, stated
  as such; its 10-year window cap is why the series starts 2016-01, and its **2025-10** value is
  BLS's own footnoted missing observation, excluded rather than interpolated. Both failures are in
  `probe-ref.blocked`.
- **The technical note was text-extracted from a PDF locally**, not read in a viewer. The quoted
  passages reproduce cleanly, but the *equations* were reconstructed from a lossy extraction — which
  is precisely why leg 2 verifies the reconstruction numerically against 40,592 published values
  rather than trusting the transcription.
- **`low` impact and `symbols: []` are inherited from the proposal and not re-litigated** — but legs
  2, 3, 5 and 9 each independently support them, and nothing measured here argues for a re-tier.

## Stance & kill switches

**Permanent stand-aside on the `estimate`-dated 2026-11-20 release, and a decline on the rest of the
family.** Nothing about a `low`-impact, `symbols: []` model-fitted research curve published at 14:00
on November opex Friday supports a position, no house playbook is macro-keyed, and the instrument's
own stated use is served better and earlier by the breakeven curve (leg 9).

**The proposal's thesis is retired, on the record, on two independent grounds.** It filed this event
because a term structure would turn a pass-through question into *"a question about which part of
the curve moved."* First, **the curve has three parts, not 118** — R² ≥ 0.99924 per horizon on
`[1, L, S, C]` across 344 vintages, and the technical note's own equation reproduces all 40,592
published points at max error 0.042pp (leg 2). Second, **the instrument cannot answer a pass-through
question at all**, because it is measured to run **bias −2.99pp, MAE 3.08** on targets spanning the
last regime break against **MAE 0.37–0.50** in quiet windows (leg 3). Its current flat reading
against gasoline **+30.2% y/y** agrees in direction with the
[PIES sibling](philly-fed-price-inflation-expectations-q4-2026-11-25.md)'s district-level
"absorbed in margins" answer, and **adds no independent evidence to it** — a future session must not
cite leg 4 as confirmation without citing leg 3 in the same breath.

**What survives, and is worth carrying.** ATSIX *does* beat a trailing-12-month random walk at every
horizon (MAE ratio **0.73** at two years), and it is the only public source of an expected-CPI rate
at an *arbitrary* horizon — the note's equation lets any τ₁→τ₂ window be computed from four numbers,
including forwards. That is a **reference tool to reach for when a horizon is needed**, not an event
to watch. The distinction is the whole content of task (c)'s answer.

**What would change the stance:**

- **A re-tier to `medium` or above**, or a tracked name acquiring an expected-inflation channel,
  which would give the release something to be a call about. Neither is in view.
- **The Nov-2026 vintage moving the 10-year point by ≥ 0.10pp** on 2026-11-20 — only 1 of 28
  Novembers has ever done that, and it would mean the quiet-month finding does not hold where it
  matters. Registered as `FT-…-1`.
- **The Dec-2026 vintage (2026-12-29) moving the 10-year by less than the Nov vintage did**, which
  breaks the Mar/Jun/Oct/Dec seasonal out of sample and undercuts the decline in leg 5. Registered
  as `FT-…-2`.
- **λ changing in the Factors tab through the Feb-2027 vintage**, which would mean the technical
  note's annual-re-estimation plan resumed and leg 8's staleness finding expires. Registered as
  `FT-…-3`.
- **The Philadelphia Fed re-dating the November release off 2026-11-20**, which voids every dated
  leg and forces a re-derivation rather than a pulse — the sharpest risk on this document, because
  leg 7 shows the date is derived by no rule.
- **A later vintage showing the 3-month point moving > 1.0pp in a single month ahead of a realized
  CPI turn**, which would mean ATSIX does lead at a break and leg 3's bias table was a sample
  artifact rather than a property.

Three predictions with score-by dates are registered in
[`forward-tests/aruoba-inflation-term-structure-2026-11-20.md`](../forward-tests/aruoba-inflation-term-structure-2026-11-20.md).
All carry **zero capital** — this is an `estimate`-dated `low`-impact event with `symbols: []`, and
a registered prediction here is an accuracy record, never a position.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-72 | **Initial research.** Canonical entry written from the one proposal for this id; all three tasks it assigned answered. **(b) SETTLED — ATSIX is MODEL OUTPUT**, a factor model over the SPF + both Blue Chip titles, forecasting CPI, continuously compounded, 3–120 months. **(a) PARTIAL, and the proposal's holiday story is REFUTED:** 10 of 12 2026 rows are the month's last Friday; Dec 29 is airtight (last Friday = Christmas Day); **Nov 20 is the THIRD Friday** and **2026-11-27 is not a federal holiday** (only Thanksgiving, 11-26), so no rule derives it. ATSIX-specific corroboration exists only for the one shared date — the landing page stamps itself "28 Aug '26", matching the calendar's Aug 28 row and the workbook's last vintage. **THESIS REFUTED TWICE. (i) The curve has three parts, not 118:** each of the 118 horizon columns on `[1,L,S,C]` across 344 vintages gives **R² ≥ 0.99924** (mean 0.99964), and the technical note's own equation reproduces all **40,592** published points at **RMSE 0.0024pp / max 0.042pp**; the 5y5y forward *is* the level factor (2.258 vs L=2.258). **(ii) It is a smoother, not a detector:** vs realized BLS CPI, h=12 real-time, **bias +0.34 / MAE 0.50** pre-2021, **bias −2.99 / MAE 3.08** on 2021–23 targets, **−0.32 / 0.37** from 2024 — though it beats a random walk at every horizon (ratio 0.73 at h=24). **(c) FAMILY DECLINED on measurement:** the 10-yr point's mean |m/m| is **0.0599 in Mar/Jun/Oct/Dec vs 0.0319** elsewhere (**t=5.86**; level factor **0.0698 vs 0.0293, t=7.60**), holding post-2016 (1.42 / 1.74); **November ranks 7th of 12, median |Δ| 0.0293pp**, and only 1 of 28 Novembers exceeded 0.10pp. SPF quarters move the long end *less* (0.0376 vs 0.0430), so "5 days after SPF Q4" is empty. **Pass-through reads flat and does not count:** EIA re-fetched — regular gasoline **$4.157, +30.2% y/y** (2026-09-07) — while ATSIX h3 fell **3.40→2.55** and h120 moved **+0.01** to 2.274 (23.8th pct of 344); leg 3 forbids reading that as evidence. **Publisher's prose is stale twice:** "updated around the 20th" vs a last-Friday schedule, and "reestimated roughly once a year, usually in February" vs **λ changing exactly once in 344 vintages (2019-08)**. **Hour:** 14:00 ET on **November opex**, 42 tracked events within 5 days, and 10y TIPS prices the same question with real money the day before. **Zero proposals filed, deliberately** — the Dec ATSIX (12-29) is dated and declined by leg 5's own verdict. **Blocked, not substituted:** FRED `000`, download.bls.gov `403`; CPI from api.bls.gov v2, VIX **16.07** from CBOE's delayed feed. Three forward tests registered. | **Stance set: permanent stand-aside on this release, and a decline on the other eleven ATSIX rows.** The event's founding thesis is retired on the record | 2026-10-09 (`low` band, 30-day interval; ~D-42) |
