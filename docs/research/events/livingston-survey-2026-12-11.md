# Philadelphia Fed December 2026 Livingston Survey — livingston-survey-2026-12-11

**Kind:** macro-print · **Date:** 2026-12-11 (estimate, EST: philadelphiafed.org/calendar-of-events — the bank's own release calendar, re-fetched direct 2026-09-09 HTTP 200 at 131,096 bytes, whose embedded structured data carries the row verbatim as `"title":"December Livingston Survey" … "day":"11" … "time":"10:00 a.m."`; the feed's accuracy for this release is corroborated from two Livingston-specific primaries that pin the June 2026 edition to 2026-06-24 10:00 a.m. exactly, but neither publishes a forward December date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.06,"daysBand":"low:15+","adjacentIds":["boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ecb-quiet-period-start-2026-12-09","eia-steo-2026-12-08","empire-state-mfg-2026-12-15","ercot-data-center-audit-filing-2026-12-10","existing-home-sales-2026-12-09","fomc-2026-12-09","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","industrial-production-2026-12-16","intl-trade-full-report-2026-12-08","japan-balance-of-payments-2026-12-08","japan-cgpi-2026-12-10","msft-annual-meeting-2026-12-08","mtis-2026-12-16","mts-november-2026-12-10","nahb-hmi-2026-12-16","ndx-annual-reconstitution-announcement-2026-12-11","pjm-capacity-auction-2026-12","ppi-2026-12-15","productivity-costs-q3-revised-2026-12-08","qss-q3-2026-12-10","retail-sales-2026-12-16","russell-reconstitution-2026-12-11","sp-rebalance-reference-close-2026-12-11","tic-monthly-2026-12-15","treasury-10y-note-2026-12-08","treasury-30y-bond-2026-12-10","treasury-3y-note-2026-12-07","uk-cpi-2026-12-16","uk-labour-market-2026-12-15","wholesale-trade-2026-12-09"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=SP500","status":"000_HTTP2_INTERNAL_ERROR","at":"2026-09-09"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC","status":"429","at":"2026-09-09"},{"url":"https://stooq.com/q/d/l/?s=%5Espx&i=m","status":"JS_CHALLENGE","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **The proposal filed this event on a date collision. The collision is the weakest thing
about it — and the entry survives anyway, on something the proposal did not know the survey
contains.** The date first: 2026-12-11 is exactly what *"the Friday two days after the December
FOMC decision"* predicts (`fomc-2026-12-09`, `high`, **confirmed**), a rule that reproduced this
release for **15 of 16 consecutive editions from June 2017 through December 2024** — and has then
**missed all three most recent ones** (Jun-25 actual **Tue 06-24** vs rule 06-20; Dec-25 actual
**Fri 12-19** vs rule 12-12; Jun-26 actual **Wed 06-24** vs rule 06-19). So the date that puts this
print on the cliff is a return to a rule currently **0-for-3**, and the recent habit — the **3rd**
December Friday, which in 2026 is **12-18** — would take it off the cliff entirely. **Then the
finding.** The Livingston Survey publishes **SPIF**: a live median **S&P 500 level** forecast at
6-month, 12-month and year-end horizons, the only scoreable professional-forecaster index target
anywhere on this calendar. This session scored **84** of them from the publisher's own
`medians.xlsx`, June-2004 surveys forward, with realized year-ends read out of the same file's `BY`
column. **MAE 13.90%** against a random walk's **18.27%** — but a **dead heat** with
random-walk-plus-drift (**14.13%**). Implied forecast growth **+9.26%** (sd **5.54**) against
realized **+15.16%** (sd **20.71**). **81 of 84 forecasts pointed up while the index fell 14 times,
and at the 12M/1Y/2Y horizons the panel is 62-for-62 — it has never once called a down year.** The
measured content of this instrument is **a drift constant of ~+6-7%/yr with 13-17% error bars**,
and that is a base rate worth carrying against any forecaster index target this app ever renders.
**A live demonstration, today.** June-26's medians put end-2026 at **7560**, end-June-2027 at
**7563.80** and end-2027 at **7679.86**; SPX printed **7651.21** on **2026-09-09** — already
**+1.2%** past the panel's *sixteen-month* view. Date is **`estimate`**; `symbols: []`; nothing
here licenses an entry, on any horizon, ever.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-93) | **Stand aside** | High | `low` impact, `estimate` date, `symbols: []`, 93 days out, no consensus exists for a semiannual forecaster survey at D-93, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed — all are symbol/earnings-keyed. The June-26 edition had **17 participants**; this is a panel poll, not a datum. | The Philadelphia Fed re-dating the December release off **2026-12-11** on the calendar re-fetched here, which voids the collision framing below and forces this document to be re-derived rather than pulsed |
| This week | **Stand aside — and do not price the 12-11 collision, because the date is the fragile leg** | Medium | The rule that produces 12-11 is **0-for-3** on the last three editions, all of which landed **later** than it predicted and two of which landed on the **24th**. The modal December slot 2017-2025 is the **3rd Friday** (8 of 9); 2026-12-11 is the **2nd**. Every "this survey lands on the cliff" claim inherits that fragility. | The bank publishing its 2027 calendar, or updating `livingston-release-dates.xlsx`, with a December-2026 row **on 2026-12-11** — which would settle the date from a Livingston-specific primary and retire this caution. Watchable from **2026-12-12** at the latest |
| This month | **Stand aside; the print's information set is already closing, and nothing after October enters it** | High | The publisher's own documentation (April 4, 2022) states the rule: *"The questionnaire for a June survey is mailed in May, and the December questionnaire is mailed in November"*, with the December base at the **last day of October** for daily variables and **October** for monthly. So the December content is fixed to a **2026-10-31** anchor — formed **before** the 12-09 FOMC, **before** the 12-10 CPI and **before** the cliff resolves. It cannot be the cliff's read. | The Philadelphia Fed publishing a December-2026 collection note naming a base period **later than October 2026**, which would put post-cliff information into the print and reopen the month |
| This quarter | **Read the December print as a drift constant, never as a forecast — and read the 2Y number, which is December-only and the worst one it makes** | Medium | Scored on the publisher's own file, n=84 since June-2004: **MAE 13.90% vs 14.13% for random-walk-plus-drift** — no edge over a constant. December's unique **two-years-ahead** year-end forecast is the weakest horizon of the four (**MAE 16.72%**, bias **−3.25%**, implied **+6.18%/yr** against realized **+8.90%/yr**). The in-sample correlation looks real (Dec 12M **r = 0.498**, permutation **p = 0.017**) but the **real-time** version is a coin flip: expanding-median split gives **+17.41%** vs **+9.42%**/yr, **Welch t = 1.37**, and it has **never** flagged a down year. | The December 2026 median 12M forecast coming in **at or below** its own 2026-10-31 base — a first in 21 December editions — which would mean the panel is no longer a pure drift constant and this whole read needs re-deriving. Settled by the release itself on **2026-12-11** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade this print.** `low` impact, `symbols: []`, `estimate` date, semiannual, no macro-keyed
  house playbook exists, and no release-hour test is run or claimed here.
- **The standing base rate, and the reason this entry exists.** Against any professional-forecaster
  S&P 500 target: n=84 since June-2004, **MAE 13.90%**, **RW 18.27%**, **RW+drift 14.13%**. Forecast
  return **+9.26%** (sd **5.54**) vs realized **+15.16%** (sd **20.71**). **62-for-62 up** at
  12M/1Y/2Y.
- **It has never seen a drawdown coming.** Dec-2007's 12M median was **1619.10** against a realized
  **903.25** — a **+79.3%** error, from an implied **+3.77%/yr** into 2008. The three down-forecasts
  in 84 are all the shortest horizon and all trivial: **−0.35%** (Jun-12), **−1.56%** (Jun-19),
  **−0.05%** (Jun-22).
- **It is already stale against the tape.** SPX **7651.21** (2026-09-09) sits **+1.21%** above the
  June-26 panel's end-**2026** median (**7560**), **+1.16%** above its end-**June-2027** median
  (**7563.80**) and just **−0.37%** below its end-**2027** median (**7679.86**); against Dec-25's
  end-2026 median of **6990** it is **+9.46%** with a quarter to run.
- **The date is the leg to watch, not the content.** Rule `FOMC-decision + 2 days` matched **15/16**
  editions Jun-17 → Dec-24, then **0/3**: Jun-25 **06-24**, Dec-25 **12-19**, Jun-26 **06-24**.
  2026-12-11 is a return to the lapsed rule.
- **The PIES mean/median hazard does NOT exist here — the sibling's reading rule does not transfer.**
  Livingston's 10-year CPI **median 2.33** and **mean 2.32** (Jun-26) are within **0.01pp**; across the
  last twelve editions the median has stayed in **2.23-2.50**. [PIES](philly-fed-price-inflation-expectations-q4-2026-11-25.md)
  measured its own 10-year mean at **7.3** against a median of **3.0**. Different panels — economists
  vs Third District firms — and only one of them has the fat right tail.
- **June-2026 edition, for the record (the base any December delta is measured from):** 17
  participants · real GDP **+2.0%** annualized H1 and H2 2026, **+1.8%** H1 2027 · 10-year CPI
  **2.33%** · 10-year real GDP **2.0%** · unemployment **4.5%** at 6M · 10-year Treasury **4.30%** at
  6M against a **4.40%** base.
- **Three data paths were blocked and none was silently substituted.** FRED's CSV endpoint returned
  an HTTP/2 `INTERNAL_ERROR` (status `000`), Yahoo's chart API returned **429**, stooq served a
  JavaScript challenge — the same three the PIES sibling hit on the same day. SPX **7651.21** and
  VIX **16.06** are CBOE's own delayed feed, timestamped **2026-09-09 15:08:30** (prev closes
  **7673.52** / **15.72**). All three failures are in `probe-ref.blocked`; **no external market data
  was needed for the scoring**, which runs entirely on the publisher's own file.
- **Watch (dated):** midterms **11-03** · Philly MBOS **11-19** · SPF Q4 **11-16** · ATSIX **11-20**
  · PIES **11-25** · FOMC **12-09** · CPI **12-10** · **this print 12-11 alongside the cliff** ·
  the rival date **12-18** (3rd Friday) · Philly MBOS **12-17** · ATSIX **12-29** (proposed in this
  PR) · next Livingston **~June 2027**.

## Initial research

### The question, plainly

`proposals/livingston-survey-2026-12-11.from-philly-fed-price-inflation-expectations-q4-2026-11-25.json`
filed this id on **one** substantive claim and handed the canonical file **two** tasks plus an
explicit escape hatch. The claim: *"Filed for the date collision, which is the whole of its
interest"* — 2026-12-11 already carries `cr-expiry-2026-12-11` (`high`),
`government-funding-deadline-2026-12-11` (`high`), `russell-reconstitution-2026-12-11` (`medium`),
`ndx-annual-reconstitution-announcement-2026-12-11` (`low`) and
`sp-rebalance-reference-close-2026-12-11` (`low`), and this drops a Federal Reserve Bank
publication into the middle of it. The tasks: **(a)** re-verify the date and time against a
Livingston-specific release page rather than the shared calendar row, and **(b)** decide *"whether
a survey whose only claim is a shared date earns an entry at all — a DECLINE with the reasoning
recorded would be a perfectly good outcome and is explicitly on the table."*

So: is the date right, is the collision real, and does this thing earn a row?

**One-line verdict:** the date is **read again from the calendar and corroborated only sideways**
(task (a) discharges **partially**, and honestly so); **the collision is the fragile leg, not the
strong one** — the scheduling rule that produces 2026-12-11 has missed the last three editions in a
row; and the entry is **KEPT and its justification RELOCATED**, because the survey turns out to
publish the only scoreable professional-forecaster **S&P 500 level** forecast on this calendar, of
which this session scored **84** and found a drift constant that has never called a down year.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies as written and the cache-busting rule
has no target. This event existed only as a proposal, so per the mode contract that one proposal
was read first and the canonical `src/domain/market-events/livingston-survey-2026-12-11.json` is
written in this PR, shadowing it.

Everything below is measured from primaries fetched direct on **2026-09-09**, all HTTP 200:

| Source | Bytes | What it settles |
|---|---|---|
| `philadelphiafed.org/calendar-of-events` | 131,096 | the 12-11 10:00 a.m. row, and the whole 2026 Philadelphia Fed release schedule |
| `…/real-time-data-research/livingston-survey` | 48,255 | the survey's own landing page — provenance, and "Last updated: June 24, 2026, 10:00 a.m. ET" |
| `…/livingston-survey/livingston-release-dates.xlsx` | 22,357 | **161** dated survey rows, **53** with an exact release date, 2000-06 → 2026-06 |
| `…/livingston-survey/livingston-documentation.pdf` (Apr 4, 2022) | 423,974 | 31 pages: the variable list, the mailing rule, the base-period table, the accuracy caveat |
| `…/historical-data/medians.xlsx` | 162,457 | 16 worksheets, 161 survey rows, 1946-06 → 2026-06 — the scoring data |
| `…/historical-data/means.xlsx` | 168,566 | the mean/median divergence test |
| `…/historical-data/livingston-stock-price-forecasts.pdf` (Dec 21, 2004) | 247,354 | the **discontinued** 1952-1990 stock series, and why it is not the one scored here |
| `…/real-time-data-research/livingston-2026-06` | 28,528 | the June-26 release write-up — 17 participants, the GDP numbers |
| `federalreserve.gov/monetarypolicy/fomccalendars.htm` + `fomchistorical{2013…2020}.htm` | ~95k each | December and June FOMC meeting dates, 2013-2026, for the construction-rule test |
| `cdn.cboe.com/api/global/delayed_quotes/quotes/{_SPX,_VIX}.json` | — | the live cross-check and the `probe-ref` readings |

### Conviction legs, tested

#### Leg 1 — "the date and time can be re-verified from a Livingston-specific page" · **MIXED**

The calendar row is real and re-read: the payload carries
`{"title":"December Livingston Survey","month":"december 2026","release":"livingston-survey","day":"11","displayMonth":"Dec","year":"2026","time":"10:00 a.m."}`,
and exactly two Livingston rows for 2026 (the other Jun 24, 10:00 a.m.), matching the published
semiannual cadence.

Two Livingston-**specific** primaries then confirm the feed is trustworthy *for this release* —
but only backwards. The survey's own landing page reads **"Last updated: June 24, 2026, 10:00 a.m.
ET"**, and `livingston-release-dates.xlsx` — the bank's dedicated "Dates of Previous Surveys" file,
columns `Survey | Livingston Survey Release Date (Exact) | (Not After)` — carries **2026-06 →
2026-06-24** as its last row. Calendar and dedicated record agree to the day and the minute on the
June edition.

Neither publishes a **forward** December date: the xlsx lists only surveys already released, and
the landing page carries only the most recent one. Task (a) therefore discharges **partially**, and
the entry stays `estimate` for three independent reasons — no confirmed-prefix taxonomy member
exists for a regional Reserve Bank's own survey schedule (`FED:` covers the federalreserve.gov FOMC
calendar only), this lane never self-confirms an event it discovered in-sweep, and **no
Livingston-specific page names 2026-12-11**.

#### Leg 2 — "the date is independently reproducible by a construction rule" · **REFUTED as a live rule**

This is the leg that changes the event's meaning, so it is measured rather than asserted. Testing
*"the release is the Friday two days after that month's FOMC decision"* against the bank's own
release-date file and the Fed's own meeting calendars:

| Year | Dec FOMC ends | Rule (Fri +2) | Livingston actual | | Jun FOMC ends | Rule | Actual | |
|---|---|---|---|---|---|---|---|---|
| 2013 | 12-18 | 12-20 | **12-12** | miss | 06-19 | 06-21 | **06-06** | miss |
| 2014 | 12-17 | 12-19 | **12-12** | miss | 06-18 | 06-20 | **06-04** | miss |
| 2015 | 12-16 | 12-18 | **12-10** | miss | 06-17 | 06-19 | **06-10** | miss |
| 2016 | 12-14 | 12-16 | **12-09** | miss | 06-15 | 06-17 | **06-08** | miss |
| 2017 | 12-13 | 12-15 | **12-15** | ✔ | 06-14 | 06-16 | **06-16** | ✔ |
| 2018 | 12-19 | 12-21 | **12-21** | ✔ | 06-13 | 06-15 | **06-15** | ✔ |
| 2019 | 12-11 | 12-13 | **12-13** | ✔ | 06-19 | 06-21 | **06-07** | miss |
| 2020 | 12-16 | 12-18 | **12-18** | ✔ | 06-10 | 06-12 | **06-12** | ✔ |
| 2021 | 12-15 | 12-17 | **12-17** | ✔ | 06-16 | 06-18 | **06-18** | ✔ |
| 2022 | 12-14 | 12-16 | **12-16** | ✔ | 06-15 | 06-17 | **06-17** | ✔ |
| 2023 | 12-13 | 12-15 | **12-15** | ✔ | 06-14 | 06-16 | **06-16** | ✔ |
| 2024 | 12-18 | 12-20 | **12-20** | ✔ | 06-12 | 06-14 | **06-14** | ✔ |
| 2025 | 12-10 | 12-12 | **12-19** | **miss** | 06-18 | 06-20 | **06-24** | **miss** |
| 2026 | **12-09** | **12-11** | *calendar says 12-11* | — | 06-17 | 06-19 | **06-24** | **miss** |

**15 of 16 consecutive editions from June 2017 through December 2024** (the only miss: June 2019).
Then **0 of 3**. All three recent misses land **later** than the rule, and two of them land on the
**24th**. The modal December slot across 2017-2025 is the **3rd Friday** — 8 of 9 — and 2026-12-11
is the **2nd**; the 3rd Friday of December 2026 is **12-18**.

Two honest qualifications, both against my own finding. The rule is **nowhere published** by the
Philadelphia Fed; two mid-month schedules co-moving for eight years is exactly the shape a
coincidence takes, so this is corroboration at best and never a source. And the 2025 exception has
no established cause here — a plausible one (the 2025 data disruptions that moved the October CPI
this survey uses as its base) is *not* verified by anything fetched today and is recorded as an
open question, not a finding.

**What the leg establishes is the direction of the risk, and it is the opposite of what the
proposal assumed:** 2026-12-11 is not a rule-corroborated date, it is a *return* to a rule that has
just failed three times running, and the alternative it would move to (**12-18**) takes this print
off the cliff entirely.

#### Leg 3 — "the collision with the funding cliff is what makes this event interesting" · **REFUTED**

Three things sink it, in ascending order of force.

**The date is fragile** (leg 2) — every collision claim inherits that.

**The print cannot see the cliff.** The publisher's documentation states the mailing rule
verbatim: *"The questionnaire for a June survey is mailed in May, and the December questionnaire is
mailed in November."* The base-period table for surveys from June 2004 forward puts a December
survey's base at the **last day of October** (daily variables), **October** (monthly) and **Q3**
(quarterly). So the December 2026 content is anchored at **2026-10-31** and collected in November —
formed **before** `fomc-2026-12-09` (`high`, confirmed), **before** `cpi-2026-12-10` (`high`,
confirmed), and **before** the cliff resolves. Whatever happens on 12-11, this document is not a
read on it. This is the same structure the PIES sibling found on its own print, from a different
rule and a different publisher.

**The collision is not even unique to this row.** The same calendar payload puts **three**
Philadelphia Fed items on 2026-12-11 — this survey plus *Early Benchmark Revisions of State Payroll
Employment* and the *Fujita, Moscarini, and Postel-Vinay Employer-to-Employer Transition
Probability* (neither with a published time). A shared date is a scheduling fact, not a market
mechanism.

#### Leg 4 — "the survey carries forward information a trader could use" · **REFUTED, and measured**

This is the leg that earns the entry by failing usefully.

**What is being scored, and what is not.** The bank publishes a *Documentation for the Discontinued
Stock Price Forecasts* (Dec 21, 2004) covering **June 1952 → June 1990** — Livingston's own
"S&P 365/420/425 Industrials" series, whose **base year changes over time**, which the bank warns
must never be compared against a common-base historical series. That is **not** what is scored
here. The modern `SPIF` worksheet inside `medians.xlsx` is live and current: the June-2026 survey
carries base **7209.01**, ZM **7500**, 6M **7560**, 12M **7563.80**, 1Y **7679.86**.

**The realized series comes out of the same file**, which is why no blocked market-data source
mattered. Per the documentation, for daily variables `X_BY` is *"the last day of that year"* for
the year preceding the survey — a **realized** year-end close. It reproduces the S&P 500's actual
year-end prints exactly (2018 **2506.85** · 2019 **3230.78** · 2020 **3756.07** · 2021 **4766.18** ·
2022 **3839.50** · 2023 **4769.83** · 2024 **5881.63** · 2025 **6845.50**), and `X_BP` likewise
reproduces the April-30 / October-31 closes (June-25 **5569.06**, Dec-24 **5705.45**). Scoring is
restricted to surveys from **June 2004** forward, the point from which the bank states the base
values *"are accurate for all variables."*

**Which forecast maps to which realization** falls out of the documentation without ambiguity:
a June survey's `6M` is its own **year-end**, its `1Y` the **next** year-end; a December survey's
`12M` is the **next** year-end, its `2Y` the one **after** (`ZY`/`1Y` are blank on December rows
precisely because `ZM`/`12M` already answer them). The cross-check that pins it: June-2024's `6M`
(**5440**) and `1Y` (**5824.63**) differ, so they cannot both target end-2024.

**84 scored forecasts, June-2004 → June-2026 surveys:**

| Horizon | n | MAE | Bias | Random walk | RW + drift | Forecast up | Market up | corr(f,r) |
|---|---|---|---|---|---|---|---|---|
| Jun `6M` → year-end y | 22 | **10.23%** | −0.96% | 11.85% | **10.18%** | 19/22 | 16/22 | 0.350 |
| Jun `1Y` → year-end y+1 | 21 | **16.02%** | −1.74% | 19.76% | **16.29%** | 21/21 | 18/21 | 0.212 |
| Dec `12M` → year-end y+1 | 21 | **12.96%** | −0.78% | 17.69% | **13.78%** | 21/21 | 18/21 | 0.518 |
| Dec `2Y` → year-end y+2 | 20 | **16.72%** | −3.25% | 24.39% | **16.29%** | 20/20 | 18/20 | 0.246 |
| **All** | **84** | **13.90%** | **−1.66%** | **18.27%** | **14.13%** | **81/84** | **70/84** | 0.407 |

**It beats a random walk and ties a constant.** Adding *"the index drifts up"* to a random walk
erases the entire margin — 14.13% against the panel's 13.90%. Their implied annualized growth is
**+7.40%/yr** (Dec 12M, sd **2.74**) and **+6.18%/yr** (Dec 2Y, sd **1.59**) against realized
**+9.54%** and **+8.90%**; the forecast return distribution is **+9.26%** with sd **5.54** against
a realized **+15.16%** with sd **20.71**. That is a panel writing down a number close to the
long-run drift and varying it about a quarter as much as the world varies.

**It has never called a down year.** Three of 84 forecasts implied a decline — **−0.35%**
(Jun-2012 6M), **−1.56%** (Jun-2019 6M), **−0.05%** (Jun-2022 6M) — all at the shortest horizon and
all inside a rounding error. At **12M, 1Y and 2Y the panel is 62-for-62** forecasting a higher
index, over a stretch in which the index fell in **14** of the 84 realized windows. The single
largest miss is the one that mattered most: **Dec-2007's 12M median of 1619.10 against a realized
903.25**, a **+79.3%** error from an implied **+3.77%/yr** into 2008.

**The one result that looks like skill does not survive being made real-time.** Dec-`12M` implied
growth correlates with realized at **r = 0.498** (n=21, two-sided permutation **p = 0.017**; 0.444
excluding 2007-08, 0.468 from 2010). But a *full-sample* tercile split uses a distribution nobody
had at the time. The implementable version — split each year against the **expanding median of the
panel's own prior forecasts** — gives **+17.41%/yr** realized above the median (n=7) against
**+9.42%/yr** at or below (n=9): a **7.99pp** spread on **Welch t = 1.37**. And it never warned:
2017 was *above* median and realized **−2.31%**; 2021 was below and realized **−15.59%**; 2007 was
below and realized **−46.25%** while the panel still forecast up. A tilt this weak, available once
a year, from a print whose information set closed six weeks earlier, is not a signal.

**The live cross-check, dated today.** SPX **7651.21** at 2026-09-09 sits **+1.21%** above the
June-26 panel's end-**2026** median (7560), **+1.16%** above its end-**June-2027** median (7563.80),
and **−0.37%** below its end-**2027** median (7679.86) — the market has spent the panel's entire
sixteen-month view in under four months. Against Dec-25's end-2026 median of **6990** it is
**+9.46%** with a quarter left to run.

#### Leg 5 — "the PIES mean/median reading hazard transfers to this survey" · **REFUTED**

The PIES sibling's headline reading rule is *read the median, never the mean* — its 10-year US
inflation mean has been **≥ 5.4% for 23 consecutive quarters** (latest **7.3%**) while its median
has **never** left 3.0-4.0 (latest **3.0%**). Testing the same hazard here, `medians.xlsx` against
`means.xlsx` on `CPI_10Y`: **Jun-26 2.33 / 2.32 · Dec-25 2.40 / 2.29 · Jun-25 2.26 / 2.30 · Dec-24
2.28 / 2.29** — gaps of **≤ 0.11pp**, in both directions, with no persistent skew. `SPIF_12M` for
June-26 is **7563.80** median against **7564.56** mean, **0.01%** apart.

**The rule does not transfer, and the reason is the panel.** Livingston polls professional
economists (17 in June-26) whose central tendency and mean coincide; PIES polls Third District
firms, among whom a fat right tail is a real feature of the population. Two Philadelphia Fed
surveys, nominally the same 10-year inflation question, medians **2.33** and **3.0** — a difference
in *who is asked*, not in who is wrong, and a caution against carrying either number as "the
Philadelphia Fed's inflation expectation."

#### Leg 6 — "the December edition carries something June does not" · **SUPPORTED, and it is the worst number**

Per the documentation, December surveys ask **three** annual-average forecasts (current year, next
year, the year after) where June asks two — so the **two-years-ahead** year-end index forecast
exists only in December. December 2026's will be the panel's **year-end 2028** S&P 500 level.

It is also the horizon the panel handles worst: **MAE 16.72%**, the largest bias of the four
(**−3.25%**), the tightest forecast dispersion (**sd 1.59%/yr**, against a realized **10.28**), and
**20-for-20** up. The genuinely December-specific content is the least informative thing the survey
publishes.

### What the conditions support

**Nothing directional, on any horizon, ever.** A `low`-impact `estimate`-dated semiannual forecaster
survey with `symbols: []`, whose content is fixed six weeks before it prints and whose measured
content is a drift constant, supports exactly one thing: a **standing base rate** for reading
anyone's index target — professional, published, or persona-generated — as **+6-7%/yr with 13-17%
error bars and no drawdown-detection whatsoever**.

Two dated watches follow from it and are registered as forward tests below: whether the release
actually lands on **2026-12-11** (leg 2 says treat that as genuinely open), and whether the December
median 12M forecast falls inside the historical band (leg 4 says it will, 21 times out of 21).

### Honest limits

- **The forward December date is not verified from a Livingston-specific primary.** Leg 1 is
  partial by construction — the bank publishes past release dates and the next release, nothing
  further ahead. The status stays `estimate`.
- **The construction rule is unpublished.** Leg 2 tests an alignment nobody at the Philadelphia Fed
  has ever stated; two mid-month schedules co-moving is a coincidence-shaped result. It is used
  only to argue the date is *fragile*, never to argue it is right.
- **The 2025 exception has no established cause here.** The plausible one — the 2025 statistical
  disruptions moving the October CPI base — is not verified by anything fetched today.
- **The scoring sample is small, annual and one-country.** n=84 total but only **21** December 12M
  observations, spanning 2004-2024: one crisis, one pandemic, one long bull market. The 0.498
  correlation's permutation p of 0.017 is a within-sample statement, and the real-time version's
  **t = 1.37** is the honest reading.
- **Realizations are the publisher's own `BY` column, not an independent price feed.** It matches
  the S&P 500's actual year-end prints at every spot-check made here, but FRED, Yahoo and stooq were
  all unreachable (recorded in `probe-ref.blocked`), so no third-party reconciliation of the full
  series was run.
- **Pre-June-2004 surveys are excluded** on the bank's own accuracy warning about base values, which
  costs roughly half a century of history and cannot be recovered from this file.
- **No release-hour test is run or claimed.** 10:00 a.m. ET on 2026-12-11 carries the cliff and two
  index events; nothing about a `symbols: []` survey is separable from that tape, and this document
  does not try.
- **The 12M/2Y horizon mapping is derived, not stated.** The documentation defines each column but
  never tabulates target dates for daily variables; the mapping used here is pinned by the
  June-2024 `6M`≠`1Y` cross-check and is internally consistent across all 84 rows, but it is an
  inference from the file's structure.

## Stance & kill switches

**Stand aside on every horizon, permanently.** The event is `estimate`-dated, `low`-impact,
`symbols: []`, semiannual, and its content is fixed at a **2026-10-31** base six weeks before it
prints — every trading-adjacent statement above carries that label, and none of them licenses an
entry.

**The entry is KEPT and its justification RELOCATED.** The proposal put a DECLINE explicitly on the
table for *"a survey whose only claim is a shared date."* That reading of the event is correct and
the claim does not hold: the collision rests on a scheduling rule that has missed its last three
editions, and the print cannot see the cliff it collides with. What the row is worth keeping for is
different and measured — this is the only instrument on this calendar that publishes a scoreable
professional-forecaster **S&P 500 level** target, and the 84-observation base rate derived from it
(**MAE 13.90% vs 14.13% for a drift constant · 62-for-62 up at 12M/1Y/2Y · never a down year**) is a
standing check on every index target this app renders, from any source.

**Kill switches** — any one of these forces this document to be re-derived rather than pulsed:

1. **The Philadelphia Fed re-dating the December 2026 release off 2026-12-11** on the calendar
   re-fetched here — which voids the collision framing and the first forward test. Watchable
   continuously; settled by **2026-12-12**.
2. **A December 2026 release landing on 2026-12-18 or later** — the 2025-2026 regime confirmed as
   the new practice, leg 2's "return to a lapsed rule" reading vindicated, and the proposal's entire
   premise gone.
3. **The December 2026 median `SPIF_12M` printing at or below its own 2026-10-31 base** — a first in
   21 December editions; the drift-constant characterisation would no longer be safe and leg 4 needs
   re-deriving.
4. **The Philadelphia Fed publishing a December collection note naming a base period later than
   October 2026** — the print could then see the cliff, and leg 3's central argument fails.
5. **A Livingston-specific primary publishing the forward December date** — leg 1 discharges fully
   and the `estimate` label's third reason retires (the taxonomy gap and the no-self-confirm limit
   would still hold).

Two forward tests are registered in
[`forward-tests/livingston-survey-2026-12-11.md`](../forward-tests/livingston-survey-2026-12-11.md):
`FT-livingston-survey-2026-12-11-1` (the date) and `-2` (the content band).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-93 | **Initial research on an id that existed only as a proposal; canonical `src/domain/market-events/livingston-survey-2026-12-11.json` written this PR after reading `proposals/livingston-survey-2026-12-11.from-philly-fed-price-inflation-expectations-q4-2026-11-25.json`, now shadowed.** **Task (a) — PARTIAL, and stated as such.** The calendar row is re-read verbatim (`"December Livingston Survey" … "day":"11" … "10:00 a.m."`, 131,096 bytes). Two Livingston-SPECIFIC primaries corroborate the feed only backwards: the survey's landing page reads *"Last updated: June 24, 2026, 10:00 a.m. ET"* and `livingston-release-dates.xlsx` (161 survey rows, 53 with exact dates, 2000-06 → 2026-06) carries **2026-06 → 2026-06-24** as its last row — exact agreement on June, no forward December date anywhere. Stays `estimate` on three counts (no confirmed-prefix member for a regional Reserve Bank survey schedule; no self-confirm; no Livingston-specific page names 12-11). **Task (b) — KEEP, but the justification MOVES, and the proposal's own claim is REFUTED.** **Measurement #1, the date is the fragile leg.** Testing *"the Friday two days after the FOMC decision"* against the bank's release-date file and `federalreserve.gov`'s own calendars (2013-2026): **15 of 16 consecutive editions matched Jun-17 → Dec-24** (only miss Jun-19), then **0 of 3** — Jun-25 **Tue 06-24** vs rule 06-20, Dec-25 **Fri 12-19** vs rule 12-12, Jun-26 **Wed 06-24** vs rule 06-19. 2026-12-11 is exactly what the lapsed rule predicts (FOMC **12-09**, confirmed); the modal December slot 2017-2025 is the **3rd Friday** (8 of 9) and 12-11 is the **2nd**, with **12-18** the rival. The rule is **nowhere published** and is used only to argue fragility. **Measurement #2, the print cannot see the cliff.** The documentation (Apr 4 2022) states verbatim *"The questionnaire for a June survey is mailed in May, and the December questionnaire is mailed in November"*, with a December base at the **last day of October** (daily), **October** (monthly), **Q3** (quarterly) — content anchored **2026-10-31**, formed before FOMC 12-09, before CPI 12-10, before the cliff. Same structure the PIES sibling found by a different rule. The collision is also not unique: the same payload puts **three** Philadelphia Fed items on 12-11. **Measurement #3 — NEW INSTRUMENT, and what earns the row.** `SPIF` in `medians.xlsx` is a live median **S&P 500 level** forecast at 6M/12M/year-end horizons — the only scoreable professional-forecaster index target on this calendar (distinct from the bank's *discontinued* 1952-1990 Industrials series, whose base year drifts and which is explicitly NOT scored here). Realized year-ends are the same file's `BY` column, which reproduces the actual prints exactly (2018 **2506.85** … 2024 **5881.63**, 2025 **6845.50**); horizon mapping pinned by June-24's `6M`**5440** ≠ `1Y`**5824.63**; sample restricted to **June-2004 forward** per the bank's own accuracy caveat. **84 scored forecasts: MAE 13.90%, bias −1.66%, random walk 18.27%, random-walk-plus-drift 14.13% — a dead heat with a constant.** Forecast return **+9.26%** (sd **5.54**) vs realized **+15.16%** (sd **20.71**); **81/84 pointed up while the index fell 14 times**; at 12M/1Y/2Y the panel is **62-for-62** and has **never called a down year**; largest miss **Dec-2007's 1619.10 vs 903.25 (+79.3%)** from an implied **+3.77%/yr into 2008**. **Measurement #4 — the one skill-shaped result dies on contact with real time.** Dec-`12M` implied growth correlates with realized at **r = 0.498** (n=21, permutation **p = 0.017**; 0.444 ex-2007/08, 0.468 from 2010) — but the implementable expanding-median split gives **+17.41%/yr** above vs **+9.42%/yr** below, **Welch t = 1.37**, and flagged **none** of the three down years (2017 above-median → −2.31%; 2021 below → −15.59%; 2007 below → −46.25%). **Measurement #5 — the PIES reading rule does NOT transfer.** `CPI_10Y` median vs mean: Jun-26 **2.33/2.32** · Dec-25 **2.40/2.29** · Jun-25 **2.26/2.30** · Dec-24 **2.28/2.29** — gaps ≤ **0.11pp**, both directions, no skew; PIES's own 10-year mean/median gap is **7.3 vs 3.0**. Different panels (17 economists vs Third District firms), and only one has the fat tail. **Measurement #6 — December's unique number is its worst.** The two-years-ahead year-end forecast is December-only (three annual questions vs June's two) and scores **MAE 16.72%**, bias **−3.25%**, forecast sd **1.59%/yr** against realized **10.28**, **20-for-20** up. **Live cross-check.** SPX **7651.21** / VIX **16.06** (CBOE delayed feed, 2026-09-09 15:08:30; prev closes **7673.52** / **15.72**) — spot is already **+1.21%** past the June-26 panel's end-2026 median (**7560**), **+1.16%** past its end-June-2027 median (**7563.80**), **−0.37%** from its end-2027 median (**7679.86**), and **+9.46%** past Dec-25's end-2026 median (**6990**). **Adjacency sweep.** *Peers:* `symbols: []`; the peers are the bank's other instruments — [PIES 11-25](philly-fed-price-inflation-expectations-q4-2026-11-25.md) (whose mean/median rule is tested and found not to transfer) and [MBOS 12-17](philly-fed-mfg-2026-12-17.md). *Macro:* **FOMC 12-09** and **CPI 12-10** both land BEFORE this print and both are invisible to it by the mailing rule. *Volatility regime:* **VIX 16.06** vs prev close **15.72**; baseline established, nothing to diff against yet. *Geopolitical/policy:* the **12-11 cliff** is the proposal's premise and is refuted above as this event's subject; `cr-expiry-2026-12-11` remains the day's actual event. *Event tape:* no consensus exists for a semiannual forecaster survey at D-93 and none will; the June-26 edition (**17 participants**, real GDP **+2.0%** H1/H2-26 and **+1.8%** H1-27) is the base any December delta is measured from. **Adjacency proposal filed (1):** `proposals/aruoba-inflation-term-structure-2026-12-29.from-livingston-survey-2026-12-11.json`, `estimate`, `low` — ATSIX 12-29 2:00 p.m., the next edition of an instrument the PIES lane already proposed for 11-20 (whose date this payload independently reproduces, an internal check on the parse), and the first curve read AFTER the FOMC, the CPI and the cliff all resolve. **Considered and DECLINED (5), all from the same primary:** (a) `philly-fed-nbos-2026-12-22` — **two** sibling ledgers already declined it on second-order-survey grounds; kept consistent deliberately rather than re-litigated. (b) The other two 12-11 Philadelphia Fed rows (Early Benchmark Revisions of State Payroll Employment; Fujita-Moscarini-Postel-Vinay E-to-E Transition Probability) — sub-state research datasets, no published time. (c) The ~9 December ADS Business Conditions Index updates — a high-frequency index refresh, not an event. (d) GDPplus 12-23 and State Coincident Indexes 12-23. (e) The **June 2027** Livingston edition — genuinely the next one, but **no date is published** and a derived date is not a source. **Blocked (3), none silently substituted:** FRED's `fredgraph.csv` (HTTP/2 `INTERNAL_ERROR`, status `000`), Yahoo's chart API (**429**), stooq (JS challenge) — all in `probe-ref.blocked`. **No external market data was needed**: the scoring runs entirely on the publisher's own file. **Two forward tests registered:** `FT-livingston-survey-2026-12-11-1` (releases on 12-11) and `-2` (the December 12M median lands above its own base, inside the historical growth band). | **Initial stance set: stand aside on every horizon, permanently. The proposal's collision premise is REFUTED — the date rests on a rule that has missed its last three editions and the print's content is fixed at a 2026-10-31 base that cannot see the cliff — and the entry is KEPT on different grounds: this is the calendar's only scoreable professional-forecaster S&P 500 target, and 84 scored forecasts make it a drift constant (MAE 13.90% vs 14.13% for a constant) that has never once called a down year.** | 2026-10-09 per the `low:15+` band (every 30d) — but the leg worth re-reading first is the **date**, not the content: any Philadelphia Fed calendar refresh that moves the December row off **12-11** (or toward **12-18**) settles kill switches 1 and 2 and the first forward test in one observation |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-livingston-survey-2026-12-11.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
