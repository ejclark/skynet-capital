# Philadelphia Fed Q4 2026 Price and Inflation Expectations Survey (PIES) — philly-fed-price-inflation-expectations-q4-2026-11-25

**Kind:** macro-print · **Date:** 2026-11-25 (estimate, EST: philadelphiafed.org/surveys-and-data/regional-economic-analysis/price-and-inflation-expectations-survey — the survey's OWN landing page, fetched direct 2026-09-09 HTTP 200 at 141,301 bytes, whose Release Calendar panel reads "Nov 25 2026 | Fourth Quarter 2026 Price and Inflation Expectations Survey | 10:00 a.m.") · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":16.18,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-11-27","aruoba-inflation-term-structure-2026-11-20","aws-reinvent-2026","beige-book-2026-11-25","chicago-pmi-2026-11-30","consumer-confidence-2026-11-24","cyber-monday-2026-11-30","dallas-fed-mfg-2026-11-30","durable-goods-2026-11-25","fhfa-hpi-2026-11-24","fomc-blackout-start-2026-11-28","gdp-q3-2026-second-2026-11-25","japan-cpi-2026-11-20","japan-cpi-tokyo-flash-2026-11-27","jgb-40y-auction-2026-11-25","jgb-liquidity-enhancement-1-5y-2026-11-20","jgb-liquidity-enhancement-5-11y-2026-11-27","jpx-market-closure-2026-11-23","new-home-sales-2026-11-25","ofgem-price-cap-announcement-2026-11-25","opex-2026-11-20","pce-2026-11-25","russell-recon-lockdown-2026-11-30","russell-style-month-end-capping-effective-2026-11-30","sifma-bond-early-close-2026-11-27","thanksgiving-half-day-2026-11-27","thanksgiving-market-closure-2026-11-26","treasury-2y-frn-2026-11-24","treasury-2y-note-2026-11-23","treasury-5y-note-2026-11-24","treasury-7y-note-2026-11-25","uk-public-sector-finances-2026-11-20"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv?id=CPIAUCSL","status":"EGRESS_BLOCKED","at":"2026-09-09"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX","status":"429","at":"2026-09-09"},{"url":"https://stooq.com/q/d/l/?s=%5Evix&i=d","status":"JS_CHALLENGE","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **This event was proposed as the instrument that would beat the Philadelphia Fed's
monthly manufacturing survey at seeing price pressure coming. It does not, and the measurement is
the reason this document exists.** Scored on the publisher's own file — `pies-data.xlsx`, 44
quarters, 2015Q4 → 2026Q3 — against realized Third District own-price change at PIES's *own*
four-quarter horizon, leave-one-out cross-validated over **n = 29**: PIES's expectation used raw
**MAE 1.103**, the MBOS prices-paid diffusion index fitted **1.107**, PIES fitted **1.202**,
persistence **1.559**. **A dead heat.** Worse for the proposal's framing, PIES's own expectation
correlates best with realized prices at **lead 1 (r = 0.949)** and decays to **0.596** at the lead
it asks about — while the MBOS's *current-conditions* prices-paid index reads **0.700** at that
same lead. **The expectations survey is a nowcast wearing a forecast's clothes.** What it uniquely
supplies is the **ruler, not the lead**: it is the only Third District price series denominated in
percent, and a diffusion index only becomes a percent by regressing it on PIES history nobody would
have without PIES. **It also answers the corridor's standing pass-through question, in the
negative and with a sector split.** Against gasoline **+28.1% y/y**, Third District firms reported
own prices up **2.4%** over the past four quarters — manufacturing **3.1%**, nonmanufacturing
**1.9%** — and expect **2.4%** over the next four, the **36th percentile** of the survey's history.
The MBOS paid-minus-received spread in Aug-26 was **23.2 points, the 73.7th percentile of 700
months**: input costs elevated, output prices not following. **The shock is being absorbed in
margins, on the goods side only.** **The one thing worth carrying to 11-25 is a reading rule, not a
trade.** The survey's 10-year US inflation **mean** has been **≥ 5.4% for 23 consecutive quarters**
(2021Q1 → 2026Q3, latest **7.3%**) while its **median has never once left 3.0–4.0** (latest
**3.0%**). The mean is a fat-right-tail artifact and a headline built on it would be false in
effect — **90 minutes after PCE prints on the same morning.** **And that morning is why the print
is unreadable.** 2026-11-25 08:30 ET already carries **PCE** (`high`, confirmed) and **GDP Q3
second** (`high`, confirmed), with durable goods (`medium`) alongside and the Beige Book
(`medium`, confirmed) at 14:30 — the exact inverse of [`philly-fed-mfg-2026-12-17`](philly-fed-mfg-2026-12-17.md),
where this bank's survey stands alone. Date is **`estimate`**; `symbols: []`; nothing here licenses
an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-77) | **Stand aside** | High | `low` impact, `estimate` date, `symbols: []`, 77 days out, no consensus exists for a Third District quarterly survey at D-77, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed — all are symbol/earnings-keyed. The survey is a **sub-state** quarterly instrument whose own publisher describes it as covering Delaware, southern New Jersey and eastern/central Pennsylvania. | The Philadelphia Fed re-dating the Q4 release off **2026-11-25** on the landing page re-fetched here, which voids every dated leg below and forces this document to be re-derived rather than pulsed |
| This week | **Stand aside — and do not treat this as an upgrade on the MBOS** | High | The proposal's premise is refuted by measurement, not by opinion: LOO-CV **MAE 1.103 (PIES raw) vs 1.107 (MBOS fitted)** at a four-quarter horizon, n=29, and PIES's peak correlation is at **lead 1**, not lead 4. Anyone building on "PIES sees further than the MBOS" is building on a number that does not exist. | A later edition's realized series revising such that PIES's four-quarter MAE separates from the MBOS's by more than **0.2** in either direction, which would mean the dead heat was a sample artifact rather than a finding |
| This month | **Stand aside; the collection is already done before anything this quarter could move it** | High | PIES is compiled from responses collected inside the **November MBOS and NBOS**, whose own published rule closes MBOS's window **Mon 2026-11-16** for a 11-19 release, with NBOS publishing **2026-11-24**. So the Q4 content is fixed by roughly **11-23**, before the release and **16 days before** `cr-expiry-2026-12-11` (`high`, `estimate`). Nothing between now and 11-25 can enter this print except through those windows. | The Philadelphia Fed publishing a Q4 collection note naming a window that extends past **2026-11-24**, which would put post-NBOS information into the print and reopen the month |
| This quarter | **Read the median, never the mean, and read it as the last quarterly Third District price expectation before the cliff — never as a tradeable inflation signal** | Medium | The 10-year **mean** has been ≥ 5.4% for **23 straight quarters** while the **median** stayed inside 3.0–4.0; latest **7.3 vs 3.0**. The next edition after this one is **late February 2027**, so Q4 is the only quarterly read spanning the midterms-to-cliff window. But the release lands under two `high` confirmed prints on a pre-Thanksgiving session — no identifiable tape, and no release-hour test is run or claimed here. | **The Q4 2026 print showing the 10-year mean back below 5.0%** — the fat right tail closes, the 23-quarter regime ends, the reading rule stops being load-bearing, and `FT-philly-fed-price-inflation-expectations-q4-2026-11-25-2` dies. Settled by the release itself on **2026-11-25** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade this print.** `low` impact, `symbols: []`, `estimate` date, no macro-keyed house
  playbook exists, and no release-hour test is run or claimed here.
- **Read the median on the 10-year question; the mean is broken.** Mean ≥ 5.4% for **23
  consecutive quarters** (2021Q1 → 2026Q3); median has **never** left 3.0–4.0 across all 44. Latest
  **7.3 vs 3.0**. Before 2021Q1 the mean ran 2.6–4.0 — the break is dated, not structural to the
  question.
- **The proposal's forward-information claim is refuted, on the publisher's own data.** LOO-CV MAE
  at PIES's own four-quarter horizon, n=29: **PIES raw 1.103 · MBOS prices-paid fitted 1.107 · PIES
  fitted 1.202 · persistence 1.559**. Lead-4 correlation: **PIES 0.596 · MBOS prices-paid 0.700**.
- **PIES's contribution is units, and that is genuinely worth something.** It is the only Third
  District price series in percent. Both survive; neither replaces the other.
- **Pass-through is being absorbed, goods-side only.** Realized own prices **+2.4%** all firms
  (mfg **3.1%**, nonmfg **1.9%**) against gasoline **+28.1% y/y**; MBOS paid-minus-received spread
  **23.2** in Aug-26, **73.7th percentile of 700 months**.
- **Firms expect their own prices to rise slower than the country's.** Own **2.4%** vs expected US
  inflation **3.4%**, a **−1.0pp** gap against a 44-quarter mean of **−0.65pp** — a
  margin-compression expectation, not a disinflation call.
- **The date is a construction rule, not a guess — 4 for 4.** PIES is built from MBOS + NBOS
  responses and publishes the **calendar day after that quarter's NBOS**: Feb 24→25, May 26→27,
  Aug 25→26, **Nov 24→25**, every one at 10:00 a.m. ET.
- **The `?release=` filter on the bank's calendar is client-side** — the MBOS-filtered and
  PIES-filtered URLs return **byte-identical 131,096-byte** bodies carrying all 237 rows of 2026.
  A sibling citing "the filtered calendar" cited the whole calendar.
- **The morning inverts 12-17's finding.** 08:30 carries **PCE** (`high`, confirmed) and **GDP Q3
  second** (`high`, confirmed) plus durable goods (`medium`); 10:00 adds new home sales; 14:30 the
  Beige Book. Then **Thanksgiving** closes 11-26 and 11-27 is a half day.
- **No Q4 seasonal tilt.** Own-price expectation by quarter, n=11 each: **Q1 2.91 · Q2 2.92 ·
  Q3 2.87 · Q4 2.95**. Q3→Q4 change averages **+0.11**; all quarter-on-quarter mean |Δ| is
  **0.37**, sd **0.48**.
- **Two data paths were blocked and neither was silently substituted.** FRED returned a connection
  failure (`000`) on both its CSV and TXT endpoints; Yahoo's chart API returned **429** on five
  attempts across both hosts; stooq served a JavaScript challenge. VIX **16.18** is CBOE's own
  delayed feed at 2026-09-09 13:44:27 ET (prev-day close **15.72**). All three are in
  `probe-ref.blocked`.
- **Watch (dated):** midterms **11-03** · Philly MBOS **11-19** (window closes Mon **11-16**) ·
  SPF **11-16** (proposed in this PR) · Aruoba TSIE **11-20** (proposed in this PR) · NBOS
  **11-24** · **this print 11-25** alongside PCE + GDP + Beige Book · Thanksgiving **11-26** ·
  blackout **11-28** · **FOMC 12-09** · CPI **12-10** · Livingston Survey **12-11** (proposed in
  this PR) · **CR expiry 12-11** (`estimate`) · Philly MBOS **12-17** · next PIES **late Feb 2027**.

## Initial research

### The question, plainly

`proposals/philly-fed-price-inflation-expectations-q4-2026-11-25.from-philly-fed-mfg-2026-12-17.json`
filed this event on one substantive claim and two admitted gaps. The claim: the MBOS can only ever
answer the corridor's pass-through question *by direction-of-change diffusion*, measured by the
10-15 sibling as a **nowcast** (Philly prices paid vs core PPI peaking at lead 0, r = 0.637,
decaying to 0.178 by six months) — so *"a survey that asks firms directly for expected price
changes is the instrument that would carry forward information the MBOS structurally cannot."* The
gaps, stated by the proposal and assigned to whoever wrote the canonical file: **(a)** re-verify the
date and the 10:00 a.m. time against a release page for *this survey specifically* rather than the
shared calendar row, and **(b)** establish what the survey actually publishes — *"the calendar row
gives a title and a time and nothing about the series' content, history or availability."*

So: is the date right, what is this instrument, and — the only question that matters — does it
actually see further than the MBOS?

**One-line verdict:** (a) and (b) both discharge from the primary, the date is read from the
survey's own page and independently reproduced by a **construction rule that holds 4 for 4**, the
series is fully characterised — and **the substantive claim is refuted by measurement**: at PIES's
own four-quarter horizon it is a **dead heat** with the MBOS diffusion index (LOO-CV MAE **1.103**
vs **1.107**, n=29) and its correlation peaks at **lead 1**, so its real contribution is the
**ruler**, not the lead; what the session found *instead* is a 23-quarter break between the
survey's 10-year mean and median that makes the print a **reading-rule hazard** on the same morning
PCE lands.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies as written and the cache-busting rule
has no target. This event existed only as
`proposals/philly-fed-price-inflation-expectations-q4-2026-11-25.from-philly-fed-mfg-2026-12-17.json`,
so per the mode contract that one proposal was read first and the canonical
`src/domain/market-events/philly-fed-price-inflation-expectations-q4-2026-11-25.json` written in
this PR. Four inputs:

1. **Primary-source web research; five Philadelphia Fed primaries reachable, all fetched direct
   2026-09-09, all HTTP 200 with real bodies.** The PIES landing page (**141,301 bytes**), the
   bank's calendar endpoint (**131,096**), `pies-methodology` (**24,038**), `pies-faqs`
   (**39,311**), and the data workbook `/-/media/FRBP/Assets/Surveys-And-Data/PIES/pies-data.xlsx`
   (**25,050**). One incidental finding worth recording because a sibling ledger cites the filtered
   URL: **the `?release=` query string is client-side.** `?release=manufacturing-business-outlook-survey`
   and `?release=price-and-inflation-expectations-survey` return **byte-identical** 131,096-byte
   bodies containing all **237** 2026 rows across **19** release families. Nothing is wrong with
   the sibling's reading — the rows it quoted are in there — but the page is the whole calendar,
   not a filtered one.
2. **An original measurement run against the publisher's own workbook, not a mirror.**
   `pies-data.xlsx` was unzipped and its sheets parsed directly. Notes sheet: *"Released: August 26,
   2026"*. Means and Medians sheets: **44 quarterly rows, 2015Q4 → 2026Q3**, fifteen columns each
   — five questions × (all firms / manufacturing / nonmanufacturing). Every PIES figure below comes
   from that file. Its embedded build path,
   `X:\RegionalSurveys\MonthlySurveys\monthly_processing\combined\pies\2026_08\webrelease\`, is
   itself evidence for leg 2's construction rule.
3. **The MBOS history, for the head-to-head.**
   `/-/media/FRBP/Assets/Surveys-And-Data/MBOS/Historical-Data/Data-Series/bos_history.csv` (HTTP
   200, **578,846 bytes, 700 rows, May-68 → Aug-26**) — the same file
   [`philly-fed-mfg-2026-12-17`](philly-fed-mfg-2026-12-17.md) used and cross-checked against FRED.
   Columns `ppcdfsa` / `prcdfsa` (current prices paid / received, seasonally adjusted diffusion) and
   `ppfdfsa` / `prfdfsa` (the six-month-ahead versions) were averaged to quarters to align with PIES.
4. **The calendar itself, read as data.** The 11-25 morning census in leg 6 is
   `src/domain/market-events/` queried directly, not recalled. VIX **16.18** is CBOE's own delayed
   feed at 2026-09-09 13:44:27 ET; FRED and Yahoo were both unreachable and are recorded in
   `probe-ref.blocked` rather than substituted (see *Honest limits*). The event's date is
   **`estimate`**, and that label rides on every trading-adjacent line below.

### Conviction legs, tested

1. **The date and time are now read from a page dedicated to this survey — SUPPORTED, and this
   discharges the proposal's task (a).** The proposal cited the shared calendar row and said so.
   The survey's **own landing page** carries a Release Calendar panel whose single row reads
   verbatim:

   > **Nov 25 2026** · Fourth Quarter 2026 Price and Inflation Expectations Survey · **10:00 a.m.**

   The calendar endpoint independently enumerates the full 2026 PIES schedule as four rows, all at
   10:00 a.m.:

   | Q1 | Q2 | Q3 | Q4 |
   |---|---|---|---|
   | Feb 25 | May 27 | Aug 26 | **Nov 25** |

   And the workbook's Notes sheet dates the last edition *"Released: August 26, 2026"*, matching the
   Q3 calendar row exactly. Three independent surfaces agree. The entry nonetheless stays
   **`estimate`** on two grounds, neither of which is doubt about the date: `market-events-data.ts`'s
   confirmed-prefix taxonomy has **no member for a regional Reserve Bank's own survey schedule**
   (`FED:` covers the federalreserve.gov FOMC calendar only), and this lane does not self-confirm.
   Same reasoning every sibling Third District entry records.

2. **The date is not merely enumerated, it is *derived* — PIES publishes the calendar day after its
   own quarter's NBOS, 4 for 4.** The landing page states the construction plainly:

   > *"We collect responses once a quarter in our monthly surveys — the Manufacturing Business
   > Outlook Survey and the Nonmanufacturing Business Outlook Survey."*

   PIES is therefore not a separate collection at all; it is a quarterly block of questions riding
   inside two monthly instruments this repo already tracks. Laying the 2026 NBOS schedule against
   the PIES schedule from the same payload:

   | Quarter | NBOS release | PIES release | Gap |
   |---|---|---|---|
   | Q1 | Tue 2026-02-24, 8:30 | Wed 2026-02-25, 10:00 | +1 day |
   | Q2 | Tue 2026-05-26, 8:30 | Wed 2026-05-27, 10:00 | +1 day |
   | Q3 | Tue 2026-08-25, 8:30 | Wed 2026-08-26, 10:00 | +1 day |
   | **Q4** | **Tue 2026-11-24, 8:30** | **Wed 2026-11-25, 10:00** | **+1 day** |

   Four for four, and the rule has a *mechanism* rather than a coincidence behind it: the second
   collection vehicle closes, the combined quarterly block is compiled, it publishes the next
   morning. The workbook's own build path — `monthly_processing\combined\pies\2026_08\` — names the
   same pipeline. This is a stronger derivation than "the last Wednesday of Feb/May/Aug/Nov", which
   the same four dates also satisfy but which explains nothing.

   **The operational consequence is the This-month call.** MBOS's published rule closes its window
   *"the Monday prior to publication"*, so November's is **Mon 2026-11-16** for the 11-19 release;
   NBOS publishes **11-24**. The Q4 PIES content is therefore fixed by roughly **11-23** — after the
   **11-03** midterms, **16 days before** `cr-expiry-2026-12-11` (`high`, `estimate`), and entirely
   before its own release date. Nothing that happens between today and 11-25 can enter this print
   except through those two windows.

3. **What the survey publishes — ESTABLISHED, and this discharges task (b).** From the landing page,
   the methodology page and the workbook together:

   - **Coverage:** firms in the Third Federal Reserve District — *"Delaware, southern New Jersey,
     and eastern and central Pennsylvania."* Sub-state, not national.
   - **Started:** *"Researchers at the Philadelphia Fed began collecting PIES data in late 2015."*
     The workbook confirms: first row **2015Q4**, last **2026Q3**, **44 quarters, no gaps**.
   - **Five questions, all point estimates** (not diffusion): expected change in the firm's **own
     prices** over the next four quarters · expected **compensation** per employee · expected **US
     inflation** over the next four quarters · expected **10-year average US inflation** · and,
     *"since mid-2019"*, the **realized** change in the firm's own prices over the **past** four
     quarters.
   - **Published statistics:** **mean and median** for each question, split **all firms /
     manufacturing / nonmanufacturing** — fifteen series per sheet.
   - **Availability:** one XLSX, replaced in place each quarter. There is **no vintage archive** —
     see *Honest limits*.

   The fifth question is what makes leg 4 possible: the survey publishes both a four-quarter-ahead
   forecast and, four quarters later, a realized number on the same scale from the same panel. It
   grades its own homework, and nobody had read the grades.

4. **The proposal's central claim — that PIES carries forward information the MBOS structurally
   cannot — is REFUTED. It is a dead heat, and PIES's own peak is at lead 1.** Target: realized
   Third District own-price change (`piesownpricespast_all`). Predictors lagged **four quarters**,
   PIES's own stated horizon. Leave-one-out cross-validated, **n = 29** (the realized series starts
   mid-2019):

   | Predictor, lagged 4 quarters | LOO MAE | LOO RMSE |
   |---|---|---|
   | **PIES own-price expectation, used RAW** (no fitting at all) | **1.103** | 1.486 |
   | MBOS prices-paid diffusion, LOO-fitted | **1.107** | **1.412** |
   | PIES own-price expectation, LOO-fitted | 1.202 | 1.567 |
   | Realized persistence, LOO-fitted | 1.559 | 1.928 |

   A **0.004** MAE difference on n=29 is a tie in every direction that matters. And the correlation
   profile says why the framing was wrong in the first place — correlation of each predictor with
   realized own-price change, by lead in quarters:

   | Predictor | L0 | L1 | L2 | L3 | **L4** | L5 | L6 |
   |---|---|---|---|---|---|---|---|
   | PIES own-price **expectation** | 0.863 | **0.949** | 0.906 | 0.804 | **0.596** | 0.349 | 0.085 |
   | MBOS prices **paid** (current) | 0.448 | 0.681 | 0.817 | **0.845** | **0.700** | 0.514 | 0.264 |
   | MBOS prices **received** (current) | 0.540 | 0.759 | **0.822** | 0.822 | 0.635 | 0.433 | 0.206 |
   | MBOS prices paid (**future**, 6-mo-ahead) | 0.045 | 0.252 | 0.432 | **0.518** | 0.492 | 0.405 | 0.202 |
   | MBOS prices received (**future**) | 0.127 | 0.349 | 0.556 | **0.572** | 0.521 | 0.413 | 0.227 |

   Three readings, none of them the proposal's:

   - **PIES's expectation is anchored on the present.** It correlates **0.863** with the *realized*
     figure reported in the *same* survey and peaks at **lead 1**. Firms are largely extrapolating
     what is already happening to them, which is what an honest expectations survey mostly is.
   - **At the horizon PIES asks about, the MBOS's current-conditions index beats it** — **0.700 vs
     0.596**. The instrument that was supposed to be the nowcast reads further ahead than the one
     that was supposed to be the forecast.
   - **Both MBOS *expectations* indices are worse than both MBOS *current* indices at every lead.**
     Asking Third District firms what they expect adds nothing over asking them what is happening;
     the finding is about surveys, not about which survey.

   **The correction that survives is real and narrower than the proposal's.** PIES does something
   the MBOS genuinely cannot: it reports **percent**. The MBOS row in the table above only becomes
   a percent by regressing it on 29 quarters of PIES — a mapping that does not exist without this
   survey, and one this ledger had to fit before it could compare them at all. **PIES is the ruler,
   not the lead.** That is a real contribution, and it is not the one the event was filed on.

5. **The corridor's standing pass-through question — ANSWERED, negative, with a sector split.** All
   three Philadelphia Fed ledgers on this shelf circle whether the energy shock (EIA regular
   gasoline **$4.071/gal** week-ending 2026-08-31, **+28.1% y/y**, per the proposal) is reaching
   producer prices. PIES answers it directly in percent, 2026Q3 (released 2026-08-26):

   | Series, 2026Q3, all firms | Mean | Manufacturing | Nonmanufacturing |
   |---|---|---|---|
   | Own prices, **realized** past 4 quarters | **2.4%** | 3.1% | 1.9% |
   | Own prices, **expected** next 4 quarters | **2.4%** | 3.2% | 1.8% |
   | Compensation per employee, expected | 3.4% | 3.5% | 3.3% |
   | US inflation, expected next 4 quarters | 3.4% | 3.2% | 3.6% |

   Against a **+28.1%** input shock, district firms report **+2.4%** on their own prices and expect
   the same again. That expectation sits at the **36.4th percentile** of the survey's 44-quarter
   range (min 1.5, max 5.9). The MBOS corroborates the mechanism: **paid-minus-received spread
   23.2 points in Aug-26, the 73.7th percentile of 700 months**, and 2026 has run **68th–93rd**
   percentile all year (Mar 23.5 · Apr 25.8 · May 21.6 · **Jun 32.9** · Jul 26.5 · Aug 23.2)
   against a 700-month mean of 17.3. Input costs elevated, output prices flat. **The shock is being
   absorbed in margins, and only the goods side is passing anything through at all** — a **1.2pp**
   manufacturing/nonmanufacturing spread on realized prices.

   One more measured detail with the same sign: firms expect their **own** prices to rise **1.0pp
   slower** than US inflation (2.4% vs 3.4%), against a 44-quarter mean gap of **−0.65pp** — the
   15th most negative of 44. That is a **margin-compression expectation**, not a disinflation call,
   and it is the honest way to read a district survey whose respondents are price-takers on energy.

6. **The morning inverts 12-17's finding, and that is why this print is unreadable.** Querying
   `src/domain/market-events/` for 2026-11-25 directly:

   | ET | Event | Impact | Status |
   |---|---|---|---|
   | 08:30 | `pce-2026-11-25` | **high** | confirmed |
   | 08:30 | `gdp-q3-2026-second-2026-11-25` | **high** | confirmed |
   | 08:30 | `durable-goods-2026-11-25` | medium | confirmed |
   | **10:00** | **this print** | **low** | **estimate** |
   | 10:00 | `new-home-sales-2026-11-25` | low | confirmed |
   | 13:00 | `treasury-7y-note-2026-11-25` | medium | estimate |
   | 14:30 | `beige-book-2026-11-25` | medium | confirmed |

   A sub-state quarterly survey releasing **90 minutes after the Fed's preferred inflation gauge**,
   on a session already carrying a second `high` print and a Beige Book, has no identifiable tape of
   its own — and the session itself is the day before `thanksgiving-market-closure-2026-11-26`, with
   `thanksgiving-half-day-2026-11-27` behind it. This is the precise mirror of the
   [12-17 sibling](philly-fed-mfg-2026-12-17.md), whose finding was that on the lapse branch the
   Philly survey is *the only 8:30 print of its morning*. Here it is the most-crowded morning in
   November. **No release-hour test is run or claimed in either direction.**

7. **The reading-rule hazard, and the only thing on this page worth carrying to 11-25.** The 10-year
   US inflation question has a **broken mean**, and the break is dated:

   | Era | 10-yr **mean** | 10-yr **median** |
   |---|---|---|
   | 2015Q4 – 2020Q4 (21 quarters) | 2.6 – 4.0 | 2.5 – 3.0 |
   | **2021Q1 – 2026Q3 (23 quarters)** | **5.4 – 9.3, never below 5.4** | **3.0 – 4.0, never outside** |
   | 2026Q3 (latest) | **7.3** | **3.0** |

   The mean has been **≥ 5.4% for 23 consecutive quarters** while the median has **never once** left
   3.0–4.0 in the survey's entire 44-quarter life. The mean-minus-median gap averages **1.68** over
   the full sample; 2026Q3's **4.3** is the **third widest** on record, behind 2025Q3 (**6.3**, mean
   9.3 against a median of 3.0) and 2026Q1 (**4.4**). This is a fat right tail of a handful of firms
   naming very large numbers, not a shift in what the typical Third District firm believes — and the
   one-year question shows no such break (2026Q3: mean **3.4**, median **3.0**).

   **The practical hazard is specific and dated.** A headline of the form *"Philly Fed: firms see
   7%+ inflation over ten years"* is arithmetically true and false in effect, and it would land at
   10:00 ET on **2026-11-25**, ninety minutes after PCE. **Read the median.** This is a defensive
   call — it protects against reacting to a number, not a licence to act on one.

8. **Forecastability of the Q4 level — measured, and deliberately not converted into a call.** The
   series has **no Q4 seasonal tilt**: own-price expectation by quarter, n=11 each, runs **Q1 2.91 ·
   Q2 2.92 · Q3 2.87 · Q4 2.95**, and the ten Q3→Q4 changes on record (+0.6, −0.1, 0.0, −0.2, +0.9,
   +1.3, 0.0, −1.1, +0.4, −0.7) average **+0.11**. All quarter-on-quarter changes have mean **+0.01**,
   sd **0.48**, mean |Δ| **0.37**. Mechanically that puts Q4 2026 near **2.5%** with a ±1-point
   90% band — which is registered as `FT--3` because a pre-registered number is how a survey's
   predictability gets adjudicated, and is **not** a call, because a `low`-impact `estimate`-dated
   sub-state survey with `symbols: []` has nothing to be a call *about*.

### What plays the conditions support

**None.** Explicitly, and for reasons this document measured rather than assumed:

- `symbols: []` — no tracked name carries a Third District channel, so there is nothing to express
  a view in.
- No house playbook (**S1/S2/E1/S3/S4 + G1**) is macro-keyed; all are symbol- or earnings-keyed. The
  kill list in [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) has no entry this could revive.
- The date is **`estimate`**, and per the date policy
  ([`trade-playbooks.md`](../../plans/trade-playbooks.md) decision log) date-keyed *action* requires
  `confirmed`. An estimate widens caution and licenses nothing.
- Leg 6 removes even a hypothetical identification: two `high` confirmed prints share the morning.

The output of this session is a **reading rule** (leg 7), a **refutation** (leg 4), an **answer to
the corridor's pass-through question** (leg 5), and three **proposals** — not a position.

### Adjacency sweep, and what it proposed

The calendar payload that dated this event enumerates **19** Philadelphia Fed release families, and
this repo tracks **none** of the bank's other expectations instruments. Three carry dates from the
primary and are proposed as new files in this PR, each `status: "estimate"`, each explicitly the
next lane's to accept or decline:

| Proposed id | Date | Why it was filed |
|---|---|---|
| `survey-of-professional-forecasters-q4-2026-11-16` | 2026-11-16, 10:00 | The **national** consensus this calendar cannot currently quote — running since 1968, the source FOMC-watchers cite for CPI/GDP paths. Nine days ahead of its proposer and the last professional consensus before `fomc-blackout-start-2026-11-28` |
| `aruoba-inflation-term-structure-2026-11-20` | 2026-11-20, 14:00 | The instrument leg 4 suggests the proposal actually wanted: a **monthly** full term structure of expected inflation, 1 month to 10 years, so the pass-through question becomes *which part of the curve moved* rather than a single fixed horizon |
| `livingston-survey-2026-12-11` | 2026-12-11, 10:00 | Filed for the **collision**: it drops a Fed-funded publication onto the calendar's most contested single day, alongside `cr-expiry-2026-12-11`, `government-funding-deadline-2026-12-11`, `russell-reconstitution-2026-12-11` and two index events |

Each proposal names the verification its canonical author owes, and each says plainly that a
**decline** with reasoning recorded is an acceptable outcome. The remaining sweep dimensions:
**peer prints** — the MBOS/NBOS pair *is* this survey's collection vehicle, covered in leg 2, and
the November editions (11-19, 11-24) are the last inputs before the print. **Macro surprises** — the
11-25 morning is itself the surprise surface (leg 6); the load-bearing macro dates before it are the
**11-03** midterms and the **12-09** FOMC, both already tracked. **Volatility regime** — VIX
**16.18** (CBOE delayed feed, 2026-09-09 13:44:27 ET; prev-day close 15.72); no options-shaped play
is contemplated here, so the regime is baseline only. **Geopolitical/policy** — the 12-11 funding
cliff is the corridor's live branch and it lands **after** this print's collection closes (leg 2),
which is the reason the This-month call is a stand-aside rather than a watch. **Event tape** — no
consensus, whisper or implied move exists for a Third District quarterly survey, and none is
manufactured here.

### Honest limits

- **n = 29 for the head-to-head, spanning one extreme regime.** The realized series starts mid-2019,
  so the entire comparison is dominated by the 2021–22 inflation surge and its unwind. PIES's raw
  errors in that window are large and one-signed (+3.8 at 2021Q1, +3.7 at 2020Q4, then −1.9 / −1.8
  through 2023–24): the survey **badly missed the regime break in both directions**. A dead heat on
  a sample like that is a weak claim, and it is registered as `FT--1` rather than asserted.
- **The two instruments are not independent.** PIES respondents *are* MBOS and NBOS respondents
  (leg 2). A head-to-head between two question blocks answered by the same firms in the same
  mailing is a comparison of question *design*, not of information sources, and it cannot say
  whether some third instrument would beat both.
- **No vintage archive was found.** The workbook is replaced in place each quarter and no
  release-archive link appears on the landing page, so every figure here is **as-published today**,
  and revisions to earlier quarters — if any occur — are invisible to this session. Score on
  as-published Q4 numbers.
- **The lead/lag table is contemporaneous-correlation arithmetic on 29 points**, not a forecasting
  competition with an out-of-sample design. The LOO-CV table is the honest version and it is the one
  the verdict rests on; the correlation table is included because it explains *why* the MAEs tie.
- **The gasoline figure is inherited, not re-fetched.** `+28.1% y/y` and `$4.071/gal` come from the
  proposal's citation of EIA data for the week ending 2026-08-31; this session did not re-pull EIA.
  Leg 5's conclusion depends on the *direction* of that shock, not its exact size.
- **Two data paths were blocked and neither was substituted silently.** FRED returned connection
  failures (`000`) on both `fredgraph.csv` and `/data/*.txt`, so no national CPI/PPI series could be
  fetched and PIES's *US inflation* questions could not be scored against realized national
  inflation — a test this document would otherwise have run. Yahoo's chart API returned **429** on
  five attempts across `query1` and `query2`; stooq served a JavaScript challenge. VIX therefore
  comes from CBOE's own delayed feed, stated as such. All three are recorded in
  `probe-ref.blocked`, and the two blocked-source facts are why leg 4's target is the *district's
  own* realized prices rather than national PPI.
- **The 10:00 a.m. time is read from three surfaces but no individual PIES report was opened** —
  the landing page's Release Calendar panel, the calendar endpoint's four 2026 rows, and the
  workbook's release date. A report-level masthead would be a fourth and stronger surface.
- **`low` impact and `symbols: []` are inherited from the proposal and not re-litigated** — but
  legs 5, 6 and 7 all independently support them, and nothing measured here argues for a re-tier.

## Stance & kill switches

**Permanent stand-aside on the `estimate`-dated 2026-11-25 print, with one carried reading rule.**
Nothing about a `low`-impact, `symbols: []`, sub-state quarterly survey releasing ninety minutes
after PCE on a pre-Thanksgiving session supports a position, and no house playbook is macro-keyed.
The stance is *not* "ignore the document" — it is that the document's value is **informational and
defensive**: read the **median** on the 10-year question and never the mean (leg 7), and treat the
Q4 edition as the **last quarterly Third District price read before the 12-11 cliff**, with the
next not until **late February 2027** (leg 2).

**The proposal's thesis is retired, on the record.** This event was filed because PIES *"is the
instrument that would carry forward information the MBOS structurally cannot."* Measured, it is
not: LOO-CV MAE **1.103** raw versus **1.107** for the MBOS diffusion index at PIES's own
four-quarter horizon, n=29, with PIES's correlation peaking at **lead 1** (leg 4). The surviving,
narrower claim — **PIES supplies the ruler, not the lead** — is what any future ledger should cite,
and a session that reaches for PIES expecting a longer lead than the MBOS should stop and read this
leg first.

**What would change the stance:**

- **A re-tier to `medium` or above**, or any tracked name acquiring a Third District channel, which
  would give the print something to be a call about. Neither is in view.
- **The 10-year mean printing below 5.0% on 2026-11-25**, ending the 23-quarter regime — the
  reading rule stops being load-bearing and leg 7 is retired rather than carried forward.
- **The Q4 realized own-price figure printing above 4.0%**, which would mean the energy shock did
  reach district output prices after all and leg 5's "absorbed in margins" answer is wrong. Note
  this cuts the *other* way from a stance change: it would make the corridor's pass-through question
  live again, not make this print tradeable.
- **The Philadelphia Fed re-dating the Q4 release off 2026-11-25**, which voids every dated leg and
  forces a re-derivation rather than a pulse.
- **A Q4 collection note naming a window extending past 2026-11-24**, which would break leg 2's
  construction rule and put post-NBOS information into the print.

Three predictions with score-by dates are registered in
[`forward-tests/philly-fed-price-inflation-expectations-q4-2026-11-25.md`](../forward-tests/philly-fed-price-inflation-expectations-q4-2026-11-25.md).
All carry **zero capital** — this is an `estimate`-dated `low`-impact event with `symbols: []`, and
a registered prediction here is an accuracy record, never a position.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-77 | **Initial research.** Canonical entry written from the one proposal that existed for this id; both tasks it assigned discharged. **(a)** Date + 10:00 ET read from the survey's OWN landing page (HTTP 200, 141,301 B) and independently derived: PIES publishes the calendar day after that quarter's NBOS, **4 for 4** (Feb 24→25, May 26→27, Aug 25→26, Nov 24→25), because it is collected *inside* the MBOS/NBOS. **(b)** Series characterised: 5 point-estimate questions, mean+median, all/mfg/nonmfg, **44 quarters 2015Q4→2026Q3**, one XLSX, no vintage archive. **The proposal's thesis is REFUTED** — LOO-CV vs realized district own-price change at PIES's own 4-quarter horizon, n=29: PIES raw **MAE 1.103**, MBOS prices-paid fitted **1.107**, PIES fitted 1.202, persistence 1.559; PIES correlation peaks at **lead 1 (0.949)** and reads **0.596** at lead 4 against the MBOS's **0.700**. Surviving claim: **PIES is the ruler, not the lead** — the only Third District price series in percent. **Pass-through answered, negative:** realized own prices **+2.4%** (mfg 3.1 / nonmfg 1.9) against gasoline +28.1% y/y; MBOS paid-minus-received spread **23.2**, 73.7th pct of 700 months. **Reading-rule hazard found:** 10-yr **mean ≥5.4% for 23 straight quarters** (latest 7.3) while the **median never left 3.0–4.0** (latest 3.0). **Morning inverts 12-17:** PCE + GDP-2nd (both `high`, confirmed) at 08:30, Beige Book 14:30, Thanksgiving next day. **Sweep proposed 3 new files** (SPF 11-16, Aruoba TSIE 11-20, Livingston 12-11) — the repo tracked none of this bank's other expectations instruments. **Blocked, not substituted:** FRED `000` (both endpoints), Yahoo `429` ×5, stooq JS challenge; VIX **16.18** from CBOE's delayed feed. Three forward tests registered. | **Stance set: permanent stand-aside, one carried reading rule (read the median).** The event's founding thesis is retired on the record | 2026-10-09 (`low` band, 30-day interval; ~D-47) |
