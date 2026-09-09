# Empire State Manufacturing Survey (Sep 2026 data) — empire-state-mfg-2026-09-15

**Kind:** macro-print · **Date:** 2026-09-15 (estimate, EST: newyorkfed.org/survey/empire/empiresurvey_overview — the New York Fed's own overview page, re-fetched direct 2026-09-09 HTTP 200 at 131,466 bytes, whose 2026 grid reads "SEP 15" above the note "Released at or shortly after 8:30 a.m.") · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:0+","adjacentIds":["boe-decision-2026-09-17","boj-decision-2026-09-18","bund-30y-auction-2026-09-16","buyback-blackout-start-2026-09-12","cpi-2026-09-11","ecb-decision-2026-09-10","eurostat-hicp-final-2026-09-17","existing-home-sales-2026-09-10","fomc-2026-09-16","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","google-adtech-opinion-unseal-2026-09-16","housing-starts-2026-09-17","iea-omr-2026-09-11","import-export-prices-2026-09-16","industrial-production-2026-09-18","jgb-20y-auction-2026-09-15","missouri-uocava-ballot-mailing-2026-09-19","mts-august-2026-09-11","nahb-hmi-2026-09-16","opec-momr-2026-09-10","opex-2026-09-18","pending-home-sales-2026-09-17","philly-fed-mfg-2026-09-17","ppi-2026-09-10","retail-sales-2026-09-16","sp-rebalance-proforma-capped-2026-09-11","tic-monthly-2026-09-16","treasury-10y-tips-2026-09-17","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10","treasury-buyback-10y20y-2026-09-10","treasury-buyback-7y10y-2026-09-17","treasury-buyback-tips-10y30y-2026-09-15","treasury-coupon-announcement-2026-09-10","treasury-coupon-announcement-2026-09-17","umich-sentiment-prelim-2026-09-11","unsc-iran-panel-mandate-vote-2026-09-17","vix-expiration-2026-09-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Two sibling ledgers have been calling 09-17 the print that settles their convergence
bets. The measurement says 09-15 does — because the Empire side supplies roughly nine tenths of the
closing, and it is Empire that reports first.** Regressing each bank's next-month prices-paid change
on the current Empire−Philly gap across the **302 months the two surveys share** (2001-07 → 2026-08),
Empire's slope is **−0.428** (t = **−10.10**) and Philly's is **+0.120** (t = **2.22**) — 3.6× the
magnitude and five times better determined. In the **17** prior instances of a gap at or above today's
**17.7**, the Empire side supplied **181.2** of the **198.6** total points of closing against Philly's
**17.4**; in the **16** carrying today's sign, Empire's prices paid fell the next month **13/16**
(median **−12.0**) while Philly's median change was **+1.0**. **And it is not a noise artifact** —
Empire's prices-paid index is the *less* volatile of the pair on the common window (sd of monthly
change **7.76** vs **8.61**), so the reverting side is the steadier one. **The same test on the
headline is symmetric** (Empire −0.394, Philly +0.316), which is why this is a prices-paid finding and
not a general property of the pair. **The disagreement itself is crossed and nearly unprecedented:**
Empire's headline sits **26.8 points BELOW** Philly's (the **2.0th** percentile of the signed gap)
while its prices paid sits **17.7 ABOVE** (the **94.4th**) — both gaps at these magnitudes with
opposite signs has happened in **2 of 302 months**, this one and **2020-04**. **One structural fact
separates the two prints:** the bank's own August note says responses "were collected between August 3
and August 10" for an August 17 release, putting September's window at ≈**Sep 1–8** — closing **three
days before the 09-11 CPI**, where Philly's inferred Sep 7–14 window spans it. Empire is the pair's
**pre-CPI, pre-FOMC** half. Date is **`estimate`**; `symbols: []`; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-6) | **Stand aside** | High | `low` impact, `estimate` date, `symbols: []`, no September consensus published, and no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. A qualitative diffusion index over ~100 New York State firms cannot confirm or refute a price level. | The New York Fed re-dating the September survey off **2026-09-15** on the overview page re-fetched here, which voids every dated leg below and forces the document to be re-derived rather than pulsed |
| This week | **Stand aside — and read 09-15 as the decisive half of the pair, not 09-17** | Medium | Empire supplies **181.2 of 198.6** points of historical gap-closing (n=17) and its gap coefficient is **−0.428 (t = −10.10)** against Philly's +0.120. So `FT-philly-fed-mfg-2026-09-17-2` most likely resolves on Empire's own number **two days before** Philly reports. Confidence is Medium, not High, because a gap is a two-sided object and one print cannot *prove* which side moved. | **Empire's September prices paid printing at or above 58.6** on 2026-09-15 — the side the measurement says does the reverting failing to revert, which kills `FT-empire-state-mfg-2026-09-15-1`, leaves the whole closure to Philly on 09-17, and makes the asymmetry a historical artifact rather than a live mechanism |
| This month | **Watch prices paid; refuse the headline outright** | Medium | Two independent reasons the Empire headline is not readable, and the second is new. Its lag-1 autocorrelation is **0.721** full-sample but **0.321** since 2024, giving a one-step band of **−0.9 to 34.3** (a **31%** uncertainty cut). And the two models *disagree*: univariate AR(1) says **16.7**, the gap-conditioned regression says **≈30.8** — a **14-point** spread on a series whose own band is ±17.6. Prices paid cuts uncertainty **63%** by contrast. | **The Empire−Philly prices-paid gap printing at or above 17.7 on the 09-15/09-17 pair** — the configuration falls outside the 94% one-month convergence base rate, the divergence becomes a regime feature, and the sibling ledgers' "October adjudicates" framing becomes the better read after all |
| This quarter | **Stand aside — and watch 2026-12-15, the first Fed-funded manufacturing read after the 12-11 funding cliff** | Low | Empire's December edition prints **four days past** `government-funding-deadline-2026-12-11` and **two days before** Philly's, sharing 8:30 with `ppi-2026-12-15` — precisely the release a lapse suspends. **Proposed to the calendar in this PR**; it was tracked nowhere. Low confidence because the branch may simply close. | A full-year FY2027 appropriations package enacted before **2026-12-11**, which closes the December branch exactly as **P.L. 119-103** (signed 2026-09-02) closed it for October, and returns the 12-15 print to ordinary context |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade this print.** `low` impact, `symbols: []`, `estimate` date, no macro-keyed house
  playbook exists, and no release-hour test is run or claimed.
- **Read Empire on 09-15 as the pair's answer, not its question.** Empire's gap coefficient is
  **−0.428 (t = −10.10)**; Philly's is **+0.120 (t = 2.22)**. At today's gap the fitted next-month
  moves are **Empire −5.9, Philly +1.9** → implied gap **9.9**.
- **Expect Empire prices paid down but still hot.** AR(1) one-step from 58.6 → **56.8** (90% band
  **44.3–69.4**, a 63% uncertainty cut); the gap-conditioned fit says **52.7**; the sign-matched event
  study says **−12.0** median. The three disagree on magnitude and agree on direction.
- **Expect the gap to narrow without flipping.** In **16/16** prior positive-gap instances the
  following month's gap stayed positive. Convergence is regression, not vindication — it says nothing
  about which survey was right.
- **Do not import Philly's forward block into Empire's.** Philly's future capex at **48.2** is its
  **99.7th** percentile ("its highest reading in 53 years"); Empire's is **16.5**, the **41.7th**, and
  the bank's own words are "Capital spending plans remained modest." The percentile gap of **−58.0**
  is the **6.3rd** percentile of 302 months — and **8 of the 20** months that negative fall in the last
  16, so it is a standing regime, not an August event.
- **Empire's September respondents saw neither CPI nor the Fed.** Collection ≈ **Sep 1–8** (inferred
  from the bank's stated Aug 3–10 window and an Aug 17 release); the **09-11 CPI** and the **09-16
  FOMC** both fall outside it. Philly's window spans the CPI. Part of September's pair gap is an
  information-set difference, not a regional one.
- **September carries no seasonal tilt** — Aug→Sep headline mean change **+0.61** vs **+0.07** for all
  other month-pairs (Welch **t = 0.30**); prices paid **−0.90** vs **+0.33** (**t = −0.73**), n=25.
  An honest null, and on prices paid its direction mildly *favours* the call.
- **Watch (dated):** CPI **09-11** · **this print 09-15** (FOMC day one; 20-year bond auction 13:00) ·
  FOMC + SEP + dot plot **09-16** · Philly **09-17** · triple witching **09-18** · Empire **10-15** +
  Philly **10-15** · FOMC **10-28** · Empire **11-16** · Philly's clean morning **11-19** · CR expiry
  **12-11** · **Empire 12-15** (proposed in this PR) · Philly **12-17**.

## Initial research

### The question, plainly

What should we expect from the September Empire State Manufacturing Survey on 2026-09-15, and — the
question this ledger exists to answer rather than to inherit — are the two sibling ledgers right that
**2026-09-17** is where the Empire−Philly convergence gets adjudicated, when Empire reports two days
earlier and nothing has ever measured *which side of the pair actually moves*?

**One-line verdict:** they have the right convergence and the wrong date — the closing is
overwhelmingly an Empire-side event on prices paid (coefficient **−0.428**, t **−10.10**, against
Philly's **+0.120**, t **2.22**), so the **09-15** print is where three registered forward tests most
likely settle; and separately, the pair's August disagreement is *crossed* in a way that has occurred
twice in 302 months, which caps how much any of this should be trusted.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies as written and the cache-busting rule
has no target. This event existed only as
`proposals/empire-state-mfg-2026-09-15.from-philly-fed-mfg-2026-09-17.json`, so per the mode contract
that proposal was read first — it explicitly assigns date re-verification to whoever writes the
canonical file — and `src/domain/market-events/empire-state-mfg-2026-09-15.json` was written in this
PR. Four inputs:

1. **Primary-source web research, re-fetched independently of the proposing sweep.** The New York
   Fed's Empire overview page returned **HTTP 200 at 131,466 bytes** on 2026-09-09. It carries three
   things this document uses beyond the date: the full 2026 release grid, the August release
   narration verbatim, and — the finding that turned into leg 8 — the August **collection window**.
2. **An original measurement, run from scratch for this document.** Both banks' own published series
   as CSV from FRED: Empire `GACDISA066MSFRBNY` headline, `PPCDISA066MSFRBNY` / `PRCDISA066MSFRBNY`
   prices paid and received, `NOCDISA066MSFRBNY` new orders, `SHCDISA066MSFRBNY` shipments,
   `NECDISA066MSFRBNY` employment, `GAFDISA066MSFRBNY` / `PPFDISA066MSFRBNY` / `CEFDISA066MSFRBNY`
   the forward block; Philly `GACDFSA066MSFRBPHI`, `PPCDFSA066MSFRBPHI`, `GAFDFSA066MSFRBPHI`,
   `CEFDFSA066MSFRBPHI`. Empire runs **302 monthly observations, 2001-07 → 2026-08**, which is also
   the pair's common window; Philly runs 700 from 1968-05.
3. **The calendar itself, read as data.** The 09-15 morning census and the December-cliff argument in
   leg 9 are `src/domain/market-events/` queried directly through its own loader, not recalled.
4. **Inherited context, cited rather than re-derived.** The Philly-side numbers, the energy tape and
   the funding cliff come from [`philly-fed-mfg-2026-09-17`](philly-fed-mfg-2026-09-17.md),
   [`empire-state-mfg-2026-10-15`](empire-state-mfg-2026-10-15.md),
   [`philly-fed-mfg-2026-10-15`](philly-fed-mfg-2026-10-15.md) and
   [`cpi-2026-10-14`](cpi-2026-10-14.md). VIX **15.72**, SPY **765.96**, QQQ **718.36**, 10y **4.806%**
   are this doc's own Yahoo pull (2026-09-08 close, read 2026-09-09). The date is **`estimate`**, and
   that label rides on every trading-adjacent line below.

### Conviction legs, tested

1. **The date and time are right, all twelve 2026 observations are enumerated from the primary, and it
   still stays `estimate` — SUPPORTED.** The overview page's 2026 grid reads, verbatim: *"JAN FEB MAR
   APR — 15 report · 17 report · 16 report · 15 report; MAY JUN JUL AUG — 15 report · 15 report · 15
   report · 17 report; SEP OCT NOV DEC — 15 · 15 · 16 · 15,"* above *"Released at or shortly after
   8:30 a.m."* The published rule reproduces every observation: the 15th of the month, rolled forward
   off weekends — Feb 15 2026 was a Sunday (grid: 17), Aug 15 was a Saturday (grid: 17), and
   2026-09-15 is a **Tuesday**, so no roll applies. The entry stays `estimate` on two grounds, neither
   being doubt about the date: `market-events-data.ts`'s confirmed-prefix taxonomy has **no member for
   a regional Reserve Bank's own survey schedule** (`FED:` covers the federalreserve.gov FOMC calendar
   only), and this lane does not self-confirm. **The page also documents its own release-time risk**:
   *"Publication of the April 2023 survey results was delayed due to technical difficulties. The
   report posted at 9:13 a.m. ET on April 17, 2023."* One precedent for a ~43-minute slip, from the
   primary itself.

2. **What August actually said, in the bank's own words — SUPPORTED.** From the same page: *"Business
   activity grew strongly in New York State in August… The headline general business conditions index
   rose five points to 20.6, its highest reading in more than four years… The pace of input price
   increases picked up, and selling price increases remained elevated but eased for a second
   consecutive month."* The detail: *"The prices paid index rose six points to 58.6, pointing to a
   pickup in input price increases, and the prices received index dipped five points to 22.7"*;
   unfilled orders *"rose eleven points to 15.5"*; delivery times *"rose eight points to 20.6"*; the
   supply-availability index *"dipped three points to −13.4"*; employment 9.3, workweek 6.9. And the
   line that matters most for leg 7: *"Capital spending plans remained modest."* Two structural facts
   from the same source govern everything below. The survey covers **New York State only** — a
   single-state footprint narrower than Philly's three-state Third District — and it is a
   **qualitative diffusion index** over roughly 100 respondents reporting direction of change, not a
   price or output level, so it can corroborate the direction of a cost story and can never confirm or
   refute a CPI or PPI print.

3. **Where August's Empire print sits in its own record — MEASURED.** Percentiles against all 302
   months: headline **20.6 = 82.8th**, prices paid **58.6 = 90.4th**, prices received **22.7 = 86.4th**,
   new orders **17.3 = 76.2nd**, employment **9.3 = 63.6th**, future prices paid **57.7 = 82.1st**,
   future general activity **32.1 = 39.4th**, future capital expenditures **16.5 = 41.7th**. The
   **paid-minus-received spread of 35.9** is the **92.4nd** percentile — margin compression is the one
   Empire reading that is genuinely near an extreme, and it is the reading nobody has been quoting.
   **Note the shape:** Empire's *current* block is hot and its *forward* block is ordinary. That is the
   opposite of Philly's August, and leg 7 makes it the correction it deserves to be.

4. **The convergence is an Empire-side event, and only on prices paid — MEASURED, and this is the
   document's central finding.** Two independent instruments agree. **(a) Regression, all 302 months,
   no conditioning:** next-month change in each bank's prices paid on the current Empire−Philly gap —

   | | intercept | slope on gap | t |
   |---|---|---|---|
   | Δ Empire prices paid | +1.65 | **−0.428** | **−10.10** |
   | Δ Philly prices paid | −0.25 | **+0.120** | **+2.22** |

   Empire's response is **3.6× larger in magnitude and roughly five times better determined**. At
   today's gap of 17.7 the fitted moves are **Empire −5.9, Philly +1.9**, implying a next gap of
   **9.9**. **(b) Event study, the 17 prior instances of |gap| ≥ 17.7:** decomposing each closure into
   the points contributed by each side, **Empire supplied 181.2 of 198.6 total points (91%)** against
   Philly's **17.4**; median contribution **11.9** vs **2.4**; Empire contributed more in **13/17**.
   Restricting to the **16** instances with today's sign (Empire above Philly), Empire's prices paid
   fell the next month in **13/16**, median **−12.0**, against a median Philly change of **+1.0**, and
   the gap narrowed **15/16**. **The obvious objection is that Empire is simply the noisier survey and
   noise reverts. It fails on the data:** over the common window Empire's prices-paid index has the
   **lower** month-over-month volatility of the two (sd of change **7.76** vs Philly's **8.61**; mean
   absolute change **5.96** vs **6.59**). The reverting side is the steadier side. **And the asymmetry
   does not generalise:** the identical regression on the headline gives **Empire −0.394 (t = −8.12)**
   against **Philly +0.316 (t = +6.18)** — near-symmetric, both sides sharing the work. So this is a
   prices-paid property of the pair specifically, which is exactly the series the three registered
   forward tests turn on.

5. **The pair's August disagreement is CROSSED, and that configuration is nearly unprecedented —
   MEASURED, and it is the honest cap on leg 4.** The two gaps point in *opposite directions*:
   headline **Empire 20.6 − Philly 47.4 = −26.8**, the **2.0th percentile** of the signed gap over 302
   months, while prices paid is **58.6 − 40.9 = +17.7**, the **94.4th**. Empire says *activity far
   weaker than Philly, input costs far hotter*. Opposite signs at these magnitudes (|headline| ≥ 20 and
   |prices| ≥ 15) has occurred in exactly **2 of 302 months** — **2026-08** and **2020-04**, and the
   April-2020 precedent is unusable for anything. The *monthly moves* were equally divergent: Empire's
   prices paid rose **+6.3** in the same month Philly's fell **−13.0**, a change-divergence of **19.3**
   at the **97.7th percentile** (median 5.2). Only **3** months in the record pair a rise ≥ +6 on
   Empire with a fall ≤ −13 on Philly: **2005-10, 2012-03, 2026-08** — and the two precedents closed
   from **opposite sides** (2005-10 from Philly, +30.5; 2012-03 from Empire, −13.5), a 1–1 split. **So
   leg 4's base rates are computed on |gap| alone, and the two closest analogues by *shape* do not
   agree with them.** That is why the This-week call is Medium and not High.

6. **Empire's own September expectation: prices forecastable, headline not — MEASURED, and the
   headline case is stronger than the sibling's version of it.** Full-sample AR(1) on prices paid
   (slope **0.926**, intercept 2.55, residual sd **7.62**, unconditional sd **20.82**; lag-1
   autocorrelation **0.930**): one step from 58.6 gives September **56.8**, a **63%** uncertainty cut,
   90% band **44.3–69.4**. On the headline (slope **0.720**, residual sd **10.71**, unconditional
   **15.43**): September **16.7**, only a **31%** cut, band **−0.9 to 34.3**, against a mean absolute
   monthly change of **8.6**. Autocorrelation is **0.721** full-sample, **0.567** since 2021 and
   **0.321** since 2024. **The new argument is that the two models disagree about the headline and
   agree about prices.** The gap-conditioned regression of leg 4 fits a next-month Empire headline
   change of **+10.2** from a −26.8 gap, i.e. **≈30.8** — while the univariate AR(1) says **16.7**. A
   **14-point** disagreement on a series whose own one-step band is ±17.6 is not a forecast; it is two
   models telling you the series is unforecastable. On prices paid the same two instruments land at
   **56.8** and **52.7** — a 4-point spread inside a ±12.5 band, i.e. agreement. **Read prices, refuse
   the headline** is therefore measured twice over, and for a reason the sibling's autocorrelation
   argument alone did not supply.

7. **The sibling's 1973 analogue rests on Philly's forward block, and Empire's says the opposite —
   MEASURED, and this is a correction to a live ledger.**
   [`philly-fed-mfg-2026-09-17`](philly-fed-mfg-2026-09-17.md) leg 10 raises the 1972-73 analogue
   "from a coincidence of one series to a property of the survey's whole forward block," on Philly
   future capex at **48.2** = its **99.7th percentile**, with **1973-03** the only prior peer. Run the
   same month through Empire: future capital expenditures **16.5** = the **41.7th percentile**, future
   general activity **32.1** = the **39.4th** (against Philly's 73.6 = 93.7th) — and the New York Fed's
   own August words are *"Capital spending plans remained modest."* The **percentile gap on future
   capex is −58.0**, the **6.3rd percentile** of 302 common months. **The finding is not that the gap
   is unique — it is that it is not new:** **20** months are at least that negative, and **8 of those
   20 fall in the last 16 months** (2025-05, 2025-08, 2025-10, 2025-12, 2026-01, 2026-04, 2026-06,
   2026-08). New York district capex expectations have been running persistently far below the Third
   District's for over a year. **So the sibling's "n=1 twice over" is honestly a Third-District-only
   reading**, and the second axis it adds is one the pair's other half contradicts in the same month.
   The analogue is not refuted — it is *narrowed to Philly*, and it should not be carried into an
   Empire call.

8. **The two prints cover different information sets this month — MEASURED from the primary, and it is
   new to this pair's research.** The overview page states plainly: *"Note: Survey responses were
   collected between August 3 and August 10."* Against a release of **2026-08-17**, that is an
   **8-day collection window closing 7 days before publication**. Applying the same geometry to a
   **2026-09-15** release puts September's collection at roughly **September 1–8**. Two consequences.
   **(a)** Empire's September respondents answered **before the 09-11 CPI** and **eight days before
   the 09-16 FOMC** — where the sibling's inferred Philly window (Sep 7–14) *spans* the CPI. The
   pair's two-day publication gap is a **CPI-straddling gap in respondent information** this month,
   which is not true every month, so some part of any September convergence is an information-set
   artifact rather than a regional one. **(b)** It settles what the 09-15 print can be read as: a
   **pre-CPI, pre-FOMC snapshot published on FOMC day one**. It cannot describe the decision, and it
   cannot describe the CPI either — which is one more thing than the same statement about Philly.
   *(Graded as an inference from one observed release; the historical report pages that would raise
   n are not reachable — see* Honest limits.*)*

9. **The 09-15 morning is the cleanest of the pair's three 2026 mornings — MEASURED from the calendar,
   and it still is not a licence to measure anything.** Querying the calendar's own loader, what sits
   around 2026-09-15:

   | | Date | What |
   |---|---|---|
   | D−4 | 2026-09-11 | **CPI** (`high`, confirmed) · UMich prelim · MTS |
   | **D0** | **2026-09-15** | **This print, 8:30 ET, alone in its slot** · FOMC **day one** of two · 20-year bond auction (`high`, confirmed, 13:00) · TIPS 10y/30y buyback · JGB 20-year auction (Tokyo, overnight) |
   | D+1 | 2026-09-16 | **FOMC decision, SEP and dot plot** (`high`, confirmed, 14:00) · retail sales (`high`) · VIX September settlement |
   | D+2 | 2026-09-17 | **Philly Fed MBOS** · housing starts · jobless claims · 10y TIPS |
   | D+3 | 2026-09-18 | **Triple witching** (`high`, confirmed) · industrial production · BoJ |

   **Nothing else prints at 8:30 on 09-15** — the only other tracked items are auctions and a
   buyback, all intraday or overnight. Set against Philly's 09-17 (FOMC+1 into witching eve) and the
   pair's 10-15 (three-way co-release with retail sales and PPI), this is by a wide margin the least
   contaminated slot of the three. **And it changes nothing operationally.** The tape on FOMC day one
   is in a pre-decision holding pattern with the Fed in blackout, which *suppresses* reaction rather
   than confounding it; combined with `symbols: []` and `low` impact, no release-hour test is run and
   none is claimed. The honest statement is narrower than the sibling's and in the same spirit: on
   09-15 the survey is cleanly *observable* and still not *tradeable*.

10. **A base rate on Empire prices paid at 58.6, with its own sample problem stated — MEASURED.** A
    print **≥ 58.6** has occurred **28** times in 302 months, followed by a lower month **19/28**,
    median change **−1.7**. **That 28 is not 28 independent draws:** the trigger months fall in only
    **7 runs**, and **17 of the 28 are one unbroken block, 2021-03 → 2022-07**. Taking one observation
    per run — the month each run ended — gives **7/7 lower**, median **−8.7**: 61→56.4 (2004-10),
    65.8→53.4 (2004-12), 63.6→55.8 (2005-11), 67.4→46.1 (2008-08), 66.2→55.5 (2011-05), 65.7→58.1
    (2022-07), 61→52.3 (2026-06). **And that 7/7 is partly definitional** — a run ends precisely
    *because* the next print fell below 58.6 — so the non-circular content is the **magnitude**, not
    the direction, and the clean instrument for direction remains leg 4's regression (t = −10.10). The
    joint condition that actually matches today (level ≥ 58.6 **and** gap ≥ 17.7) has **n = 1**:
    2005-10, where prices paid *rose* 59.6 → 63.6 while the gap closed 36.0 → 9.5 entirely from
    Philly's side. **One counterexample, and it is the only exact-shape precedent there is.**

11. **September carries no seasonal tilt on the seasonally adjusted series — MEASURED, an honest
    null.** Aug→Sep changes on Empire's headline average **+0.61** (sd 8.42, n=25) against **+0.07**
    for all other month-pairs (n=276); Welch **t = 0.30**. On prices paid: **−0.90** vs **+0.33**,
    Welch **t = −0.73**. Positive in 12/25 on both. Not significant either way; the prices-paid
    direction mildly *favours* the call and the headline direction mildly opposes it, which is exactly
    why both are stated rather than the convenient one.

12. **National representativeness and tracked-name sensitivity cap everything above — SUPPORTED.**
    `symbols: []`, and none of the nine tracked names (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN)
    carries a New York State manufacturing channel. The sibling measures the *Philly* headline against
    national manufacturing industrial production at R² **0.388** (1972+), **0.266** (2001+), **0.197**
    (2015+); Empire's footprint is narrower still — one state against three — so its national
    explanatory power is bounded above by that, and no equivalent figure is computed here rather than
    borrowed. The only transmission channel to anything tracked is the rate path, and legs 8 and 9
    each weaken it independently: the print's content predates both the CPI and the decision it lands
    beside, and its morning is quiet by construction rather than by informativeness.

### What the conditions support

Nothing directional. What the conditions support is a **redirection of attention within the pair**,
three dated expectations registered as forward tests, and one correction to a live sibling.

The redirection: two ledgers have been treating **09-17** as the date their convergence bets settle.
The measurement says the closing is **≈91% an Empire-side event on prices paid**, so the *content* of
those bets is most likely determined by the **09-15** print and merely *confirmed* two days later.
That is a claim about which number to read first, not about a trade — `symbols: []` on both events and
neither is tradeable.

The expectations: **Empire prices paid below 58.6** (three instruments agreeing on direction and
disagreeing on magnitude — AR(1) 56.8, gap-conditioned 52.7, sign-matched event study −12.0); **the
Empire side supplying more of the September closure than the Philly side** (12/16 on the sign-matched
subset, and the regression's whole point); and **the gap narrowing without flipping sign** (16/16).

The correction: the sibling's 1973 analogue is a **Philadelphia** finding, and Empire's forward block
says the opposite in the same month — during a stretch where it has said the opposite for over a year.

The refusals are three. **Do not forecast the Empire headline** — two models disagree by 14 points on
a ±17.6 band. **Do not read convergence as vindication** — a gap closing says nothing about which
survey was right, only that the disagreement was transient. **Do not treat the clean 09-15 slot as a
measurable one** — a quiet pre-FOMC tape suppresses reaction; it does not license inference from it.

### Honest limits

The measurement is of the **published series and the bank's own release text**, not of the tape — no
release-hour test is run, because leg 9 shows the 09-15 tape is in a pre-FOMC holding pattern and an
unidentifiable null reported as a null is worse than no test. So the claim "this release does not move
the market" is **not made here**.

**Leg 4's asymmetry is the load-bearing finding and it carries three caveats.** It is unconditional on
*why* a gap opened — nothing tests whether an energy-driven divergence closes differently from a
demand-driven one. Its regression is a bivariate OLS on overlapping monthly data with no correction
for serial correlation, so the t-statistics are optimistic in level even though the **ratio** between
the two sides (−10.10 vs +2.22) is the part the argument actually uses. And leg 5 shows the two
closest analogues *by shape* split 1–1 on which side closed, against a base rate computed on |gap|
alone.

**Leg 8's collection geometry is an inference from n=1** — the August window (Aug 3–10 → Aug 17) is the
only one the overview page publishes, and the rule is not stated as a rule. The historical report
pages that would raise n are **not reachable**: `…/medialibrary/media/survey/empire/empire2026/
esms_2026_08.pdf` and `…/survey/empire/empire_reports` both **302 to a 404 page**. These are *guessed*
URLs, not cited primaries, so `blocked` stays empty per the honesty rule — but the limit is real, and
if September's window ran later than Sep 8 it could catch the 09-11 CPI and half of leg 8 withdraws.

**The base rates are computed on the current data vintage, not on what a contemporaneous observer
saw.** The overview page states: *"Data have undergone an annual benchmark revision. Some historical
data have been revised to reflect new seasonal factors."* Every percentile, autocorrelation and
conditional count above is therefore a property of the revised series.

Leg 10's trigger set is **28 observations in 7 runs**, and its de-duplicated 7/7 is partly
definitional; its exact-shape subset is **n=1** and is a counterexample. Leg 5's crossed-sign
configuration is **n=2** with one unusable precedent. Leg 6's AR(1) bands assume a linear Gaussian
process on a **bounded** diffusion index, so true bands are tighter at the extremes than −0.9/34.3
suggests; they are model output, not history. Leg 12's representativeness figures are **cited from the
sibling and never recomputed for Empire**, and are used only as an upper bound.

**Two numbers do not replicate to the decimal from the sibling ledgers**, and it is recorded rather
than smoothed: [`empire-state-mfg-2026-10-15`](empire-state-mfg-2026-10-15.md) reports Empire headline
lag-1 autocorrelation of **0.269 since 2024** and **0.558 since 2021**, and prices paid at **0.936**;
this session's pull gives **0.321**, **0.567** and **0.930** (full-sample 0.721 and 0.930). The window
definitions are not published there, and the differences are small enough to be a start-month
convention. **The qualitative ordering — headline near-unforecastable, prices paid highly persistent —
replicates robustly and is what any claim above rests on**; the exact coefficients are not.

Finally, **no September consensus is published at D-6** and, on this series' pattern, none will be
before release week. Everything above describes a **single-state qualitative diffusion survey** over
roughly 100 respondents, whose date is `estimate`.

## Stance & kill switches

**Stance (date `estimate`, the New York Fed's own overview page re-fetched direct 2026-09-09 HTTP 200
at 131,466 bytes, full 2026 grid re-enumerated, August narration and collection window quoted).**
Treat 2026-09-15 08:30 ET as a **low-impact reading exercise and never an event**: no position is
opened, closed or sized off it, and no house playbook targets it. **What this document changes is not
the refusal but the reading order of the pair.** Two sibling ledgers name 2026-09-17 as the date their
convergence bets settle. Measured here for the first time, the Empire−Philly prices-paid convergence
is **≈91% an Empire-side event** — Empire's next-month change loads on the gap at **−0.428 (t =
−10.10)** against Philly's **+0.120 (t = 2.22)**, and across the 17 prior instances of a gap ≥ 17.7
the Empire side supplied **181.2 of 198.6** points of closing. Empire reports **two days first**, so
`FT-philly-fed-mfg-2026-09-17-2` and the sibling's October convergence test most likely have their
content determined on **09-15** and merely confirmed on **09-17**. The same test on the headline is
symmetric, so this is a prices-paid finding only. **Three registrations follow**, all zero-capital:
`FT-empire-state-mfg-2026-09-15-1` (Empire's September prices paid prints below 58.6),
`FT-empire-state-mfg-2026-09-15-2` (the Empire side contributes more of the September gap closure than
the Philly side), and `FT-empire-state-mfg-2026-09-15-3` (the gap narrows without flipping sign).
**Two standing instructions are negative.** The Empire **headline** is not to be forecast — the
univariate AR(1) (16.7) and the gap-conditioned fit (≈30.8) disagree by 14 points on a series whose
one-step band is ±17.6, which is two models agreeing that it cannot be forecast. And the sibling's
**1973 forward-block analogue is not to be carried into an Empire call**: Philly's future capex at
48.2 is its 99.7th percentile while Empire's 16.5 is the 41.7th, a −58.0 percentile gap that is the
6.3rd percentile of 302 months and, more tellingly, one of **8 such months in the last 16** — a
standing regime, not an August coincidence. **The honest cap on all of it** is leg 5: the pair's
August disagreement is *crossed* — Empire's headline 26.8 below Philly's at the 2.0th percentile while
its prices paid is 17.7 above at the 94.4th — a configuration seen in **2 of 302 months**, whose only
peer is 2020-04, and whose two closest by-shape precedents split 1–1 on which side closed.
**`empire-state-mfg-2026-12-15` is proposed to the calendar in this PR** as the first Fed-funded
manufacturing read after the 12-11 funding cliff, two days ahead of Philly's.

**Kill switches:**

- **Empire's September prices paid prints at or above 58.6** — the side the measurement says does the
  reverting fails to revert on the one instance that matters, `FT-empire-state-mfg-2026-09-15-1` is
  killed, the whole closure is left to Philly on 09-17, and leg 4's asymmetry has to be re-derived as
  a regime-conditional effect rather than patched. **Settled on 09-15 by the print itself.**
- **The Philly side supplies more of the September closure than the Empire side** — a bigger absolute
  move toward the gap from Philly between 08-17 and 09-17 than from Empire kills
  `FT-empire-state-mfg-2026-09-15-2` and makes the 91% historical share an artifact of which regimes
  happened to open large gaps. The 2005-10 precedent in leg 10 is exactly this outcome.
- **The Empire−Philly prices-paid gap flips sign on the 09-15/09-17 pair** — Empire printing *below*
  Philly kills `FT-empire-state-mfg-2026-09-15-3` against a 16/16 base rate, and would mean the
  convergence overshot rather than closed, which is a different mechanism from the one measured here.
- **The gap widens instead — at or above 17.7 on the pair** — the configuration falls outside the 94%
  one-month convergence base rate entirely, `FT-philly-fed-mfg-2026-09-17-2` dies with it, and the
  divergence becomes a regime feature. This is the shared kill switch with the sibling.
- **The September collection window turns out to close on or after 2026-09-11** — leg 8's inferred
  Sep 1–8 geometry is wrong, the print *can* carry post-CPI responses, and the "pre-CPI, pre-FOMC
  half of the pair" framing withdraws. Settled by the September report's own collection note on
  release day.
- **The New York Fed re-dates or suspends the September release** — every dated leg voids and the
  document is re-derived rather than pulsed. The page's own April-2023 precedent (posted 9:13 a.m.)
  is a timing slip, not this switch.
- **Empire's forward block turns hot while Philly's stays hot** — future capex climbing out of its
  40th-percentile range would close leg 7's divergence, restore the sibling's "property of the whole
  forward block" reading, and make the 1973 analogue a pair-wide shape rather than a Third District
  one.
- **The series is re-benchmarked or re-seasonally-adjusted before the score-by dates** — the page
  already warns this happens annually; a revision makes every comparison above unmeasurable rather
  than wrong, and voids rather than kills all three registrations.
- **A full-year FY2027 appropriations package before 2026-12-11** — the December branch closes exactly
  as **P.L. 119-103** (signed 2026-09-02) closed it for October, and the proposed
  `empire-state-mfg-2026-12-15` becomes ordinary context rather than a possible last-data-standing
  print.
- **A `FED:`-class prefix is added for regional Reserve Bank survey schedules** — the date can be
  promoted out of `estimate` by whoever owns that change (`market-events-data.ts`), which would also
  promote both October regional entries, the September Philly entry, and the December Empire entry
  proposed here. Recorded, as the sibling records it, as the one-time governance fix that would stop
  this taxonomy gap recurring across every regional-survey ledger — not as an ask.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-6 | Initial research banked (above). **Canonical entry written this PR** — this id existed only as `proposals/empire-state-mfg-2026-09-15.from-philly-fed-mfg-2026-09-17.json`; per EVENT-RESEARCH's proposal rule that file was read first (it explicitly assigns date re-verification to the canonical author), then the New York Fed's overview page re-fetched independently of the proposing sweep: **HTTP 200, 131,466 bytes, 2026-09-09**. 2026 grid re-enumerated verbatim — JAN 15 · FEB 17 · MAR 16 · APR 15 · MAY 15 · JUN 15 · JUL 15 · AUG 17 · **SEP 15** · OCT 15 · NOV 16 · DEC 15, *"Released at or shortly after 8:30 a.m."* — and reproduced by the published rule (15th, rolled off weekends; 09-15 is a Tuesday). Stays `estimate` (no confirmed-prefix member for a regional Reserve Bank survey schedule; no self-confirm). Page documents its own release-time risk: April 2023 posted **9:13 a.m.** after technical difficulties. **MEASUREMENT #1 — the convergence is an EMPIRE-side event, and only on prices paid.** Independent FRED pull of both banks, **302 common months 2001-07→2026-08**. Regressing next-month prices-paid change on the current Empire−Philly gap: **Empire slope −0.428 (t = −10.10)**, **Philly +0.120 (t = +2.22)** — 3.6× the magnitude, ~5× the determination; at gap 17.7 the fitted moves are **Empire −5.9 / Philly +1.9**, implied next gap **9.9**. Event study on the **17** prior instances of |gap| ≥ 17.7: **Empire supplied 181.2 of 198.6 points of closing (91%)** vs Philly's **17.4**, median contribution **11.9** vs **2.4**, Empire contributed more in **13/17**. On the **16** with today's sign, Empire's prices paid fell next month **13/16** (median **−12.0**) vs Philly median **+1.0**; gap narrowed **15/16**. **Noise-artifact objection FAILS:** Empire prices paid is the *less* volatile side (sd of monthly change **7.76** vs **8.61**, MAD **5.96** vs **6.59**). **And it does not generalise:** the same regression on the headline is near-symmetric (**Empire −0.394 t=−8.12 / Philly +0.316 t=+6.18**). **Operational consequence — a timing correction to two siblings:** `FT-philly-fed-mfg-2026-09-17-2` and `FT-philly-fed-mfg-2026-10-15-2` most likely have their content set by **Empire's 09-15 print**, two days before Philly reports. **MEASUREMENT #2 — the disagreement is CROSSED and near-unprecedented.** Headline gap **−26.8** = **2.0th** percentile of the *signed* gap; prices gap **+17.7** = **94.4th**. Both at these magnitudes with opposite signs: **2 of 302 months** — 2026-08 and **2020-04** (unusable). The monthly *moves* diverged **19.3** points (Empire **+6.3** while Philly **−13.0**) = **97.7th** percentile, median 5.2; only **3** months pair dE ≥ +6 with dP ≤ −13 (2005-10, 2012-03, 2026-08) and those two closed from **opposite sides**, a 1–1 split. This is the cap on Measurement #1 and why the This-week call is Medium. **MEASUREMENT #3 — prices forecastable, headline not, and for a NEW reason.** AR(1) prices paid (slope 0.926, resid sd 7.62, uncond 20.82, lag-1 **0.930**): Sep **56.8**, **63%** uncertainty cut, band **44.3–69.4**. Headline (slope 0.720, resid sd 10.71, uncond 15.43): Sep **16.7**, only **31%**, band **−0.9 to 34.3**, MAD m/m **8.6**; lag-1 **0.721** full / **0.567** since 2021 / **0.321** since 2024. **The new argument:** the gap-conditioned fit puts the September headline at **≈30.8** against AR(1)'s **16.7** — a **14-point** model disagreement on a ±17.6 band — while on prices paid the same two land at **56.8** and **52.7**. Two models agreeing the headline is unforecastable. **MEASUREMENT #4 — CORRECTION to `philly-fed-mfg-2026-09-17` leg 10: the 1973 forward-block analogue is Philly-only.** Philly future capex **48.2 = 99.7th** pct ("highest in 53 years"); **Empire future capex 16.5 = 41.7th**, future GA **32.1 = 39.4th** vs Philly's 73.6 = 93.7th, and the NY Fed's own words are *"Capital spending plans remained modest."* Percentile gap **−58.0** = **6.3rd** pct of 302 months — but **20** months are at least that negative and **8 of the 20 fall in the last 16** (2025-05, 2025-08, 2025-10, 2025-12, 2026-01, 2026-04, 2026-06, 2026-08). A standing regime, not an August event; the sibling's "n=1 twice over" narrows to the Third District. **MEASUREMENT #5 — August in Empire's own record.** Percentiles of 302: headline **20.6 = 82.8th**, prices paid **58.6 = 90.4th**, received **22.7 = 86.4th**, new orders 76.2nd, employment 63.6th, future PP 82.1st. **The paid-minus-received spread of 35.9 is the 92.4th percentile** — margin compression is Empire's one near-extreme reading and nobody has been quoting it. **MEASUREMENT #6 — the ≥58.6 base rate, with its sample problem stated.** n=**28**, next lower **19/28**, median **−1.7** — but the 28 sit in only **7 runs** and **17 are one block, 2021-03→2022-07**. Per-run terminal months: **7/7 lower**, median **−8.7** (61→56.4 · 65.8→53.4 · 63.6→55.8 · 67.4→46.1 · 66.2→55.5 · 65.7→58.1 · 61→52.3) — **partly definitional** (a run ends because the next print fell below 58.6), so direction rests on Measurement #1's regression, not on this. Exact-shape subset (level ≥58.6 AND gap ≥17.7) is **n=1**: 2005-10, where prices paid **rose** 59.6→63.6 and the gap closed entirely from **Philly's** side. **MEASUREMENT #7 — seasonality is a null.** Aug→Sep headline mean **+0.61** vs **+0.07** elsewhere (Welch **t=0.30**, n=25); prices paid **−0.90** vs **+0.33** (**t=−0.73**). Direction favours the call on prices and opposes it on the headline; both stated. **STRUCTURAL FINDING — the two prints cover different information sets.** The bank's own note: *"Survey responses were collected between August 3 and August 10"* against an **08-17** release — an 8-day window closing 7 days before publication. Applied to **09-15**: September's collection ≈ **Sep 1–8**, closing **three days before the 09-11 CPI** and eight before the FOMC, where the sibling's inferred Philly window (Sep 7–14) **spans** the CPI. Empire is the pair's **pre-CPI, pre-FOMC** half; part of any September convergence is an information-set artifact. Graded as an n=1 inference — the historical report pages that would raise n **302 to a 404** (`…/empire2026/esms_2026_08.pdf`, `…/survey/empire/empire_reports`); guessed URLs, not cited primaries, so `blocked` stays empty. **THE MORNING — cleanest of the pair's three 2026 mornings, and still not measurable.** Calendar queried through its own loader: **nothing else prints at 8:30 on 09-15**; the only tracked co-residents are the 20-year bond auction (`high`, confirmed, 13:00), a TIPS 10y/30y buyback and the overnight JGB 20-year. It is **FOMC day one of two** (decision 09-16), so the tape is in a pre-decision holding pattern with the Fed in blackout — reaction suppressed, not confounded. Against Philly's 09-17 (FOMC+1 into witching eve) and the pair's 10-15 (retail sales + PPI co-release) this is by far the least contaminated slot; with `symbols: []` and `low` impact, no release-hour test is run or claimed. **Adjacency sweep.** *Peers:* `symbols: []`, so the peer is the twin survey — Philly **09-17**, tracked, freshly researched by the sibling the same day. *Macro:* **CPI 09-11** (outside this survey's collection window, inside Philly's) · **FOMC 09-16** decision+SEP+dot plot · retail sales 09-16 · triple witching 09-18. *Volatility regime:* **VIX 15.72**, SPY **765.96**, QQQ **718.36**, 10y **4.806%** (2026-09-08 close, own Yahoo pull 2026-09-09) — baseline established, nothing to diff against yet. *Geopolitical/energy:* gasoline **$4.071/gal** wk-end 08-31 vs **$3.177** y/y (**+28.1%**), Brent **$97.29** after the 09-07 Jazan strike — carried from `cpi-2026-10-14`, and the input the prices-paid line measures. *Event tape:* **no September consensus published at D-6**. **Adjacency proposal filed (1):** `proposals/empire-state-mfg-2026-12-15.from-empire-state-mfg-2026-09-15.json`, `estimate`, `low` — Empire's December edition prints **four days past** `government-funding-deadline-2026-12-11` / `cr-expiry-2026-12-11` (both `high`) and **two days before** Philly's 12-17, sharing 8:30 with `ppi-2026-12-15` (the release a lapse suspends). The sibling already named 12-11 as "the one branch on which a Fed-funded regional survey becomes the important number of its morning"; this is that branch, earlier. **Considered and declined (2):** (a) **`empire-state-mfg-2026-11-16`** — enumerated from the same primary and landing on a morning with **nothing tracked at all**, i.e. genuinely the readable edition; declined on the identical grounds the sibling declined `philly-fed-mfg-2026-11-19`, that readability is not materiality. Kept consistent deliberately. (b) The NY Fed's **Business Leaders (services) Survey** — declined on the same second-order-survey grounds the two October ledgers used for Philly Nonmanufacturing. **Vintage caveat recorded:** the page states *"Data have undergone an annual benchmark revision. Some historical data have been revised to reflect new seasonal factors"* — every percentile and coefficient above is a property of the revised series. **Replication note:** the sibling `empire-state-mfg-2026-10-15` reports headline lag-1 autocorrelation **0.269** since 2024 / **0.558** since 2021 and prices paid **0.936**; this pull gives **0.321** / **0.567** / **0.930**. Window definitions are unpublished there; the qualitative ordering replicates robustly, the decimals do not. **Registered:** `FT-empire-state-mfg-2026-09-15-1` (prices paid prints below 58.6, score 09-15), `-2` (the Empire side contributes more of the September closure than Philly's, score 09-17), `-3` (the gap narrows without flipping sign, score 09-17). | — (stance set) | Close-out after the 2026-09-15 print, within `closeOutWithinDays: 6` — it must run **on or after 2026-09-17** so all three registrations can be scored from the pair, and it scores `-1` from the Empire print alone |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay, and a stance *change* earns its sentence in the Stance section with
the row as its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found
gets proposed as a new `src/domain/market-events/proposals/<id>.from-empire-state-mfg-2026-09-15.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
