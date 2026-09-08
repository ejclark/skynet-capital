# Empire State Manufacturing Survey (Oct 2026 data) — empire-state-mfg-2026-10-15

**Kind:** macro-print · **Date:** 2026-10-15 (estimate, EST: newyorkfed.org/survey/empire/empiresurvey_overview — the NY Fed's own overview page, fetched direct 2026-09-08 HTTP 200, "Released at or shortly after 8:30 a.m.") · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.26,"daysBand":"low:15+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","existing-home-sales-2026-10-13","fomc-blackout-start-2026-10-17","g20-fmcbg-bangkok-2026-10-15","housing-starts-2026-10-20","imf-world-bank-annual-meetings-2026-10-12","import-export-prices-2026-10-16","industrial-production-2026-10-16","mtis-2026-10-15","nahb-hmi-2026-10-19","norway-gpfg-ethics-committee-2026-10-15","opex-2026-10-16","pending-home-sales-2026-10-20","philly-fed-mfg-2026-10-15","ppi-2026-10-15","retail-sales-2026-10-15","sifma-bond-market-closure-2026-10-12","ssa-cola-2027-2026-10-14","tic-monthly-2026-10-16","treasury-buyback-10y20y-2026-10-15","treasury-coupon-announcement-2026-10-15","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This release is two different numbers wearing one headline, and only one of them
carries information.** Measured this session from the NY Fed's own series on FRED: the headline
general-business-conditions index has a **lag-1 autocorrelation of 0.269 since 2024** (0.558 since
2021) and a mean absolute month-over-month change of **11.5 points**, so an honest 90% band for the
October headline runs **−16 to +32** — a 48-point window *wider than the entire range the index has
occupied in 2026* (−0.2 … 20.6). Knowing August's number cuts October headline uncertainty by
**~5%**. The **prices-paid** index autocorrelates at **0.936** and the same arithmetic cuts its
uncertainty by **~52%**. So: read prices, ignore the headline — and that is now a measurement, not
a preference. **The second finding is the date.** 2026-10-15 is the worst morning of Empire's
visible 2026 schedule to read it: at **8:30 ET** it prints simultaneously with **retail sales**
(`high`, confirmed CENSUS:), **PPI** (`medium`, confirmed BLS:) and the **Philadelphia Fed's MBOS**
— which this research discovered on the Philly Fed's own primary and proposes to the calendar in
this PR. Of the four months this calendar has schedules for (Sep 15 · Oct 15 · Nov 16 · Dec 15),
October is the **only** one where Empire collides with both a BLS and a Census major; on Sep 15 and
Nov 16 it prints effectively alone. Any tape move that morning is unattributable to this survey by
construction. **What makes 10-15 worth a calendar row anyway is the pair.** Empire and Philly
prices-paid *levels* correlate at **r = 0.908 across 302 months** (0.934 since 2021) — but in
August 2026 they moved in opposite directions, Empire **+6.3 to 58.6** (the 91st percentile of its
own full history) against Philly **−13.0 to 40.9**. That **19.3-point** disagreement in one month's
change sits at the **96th percentile** of 301 months, against a median disagreement of 5.2. With
gasoline at **$4.071/gal** (+28.1% y/y, EIA primary) and the 10-28 FOMC anchored to inflation, the
two surveys are telling opposite stories about the pass-through question, and **10-15 at 8:30 is the
morning that adjudicates it — two days before blackout starts 10-17**. Date is **`estimate`**;
nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-37) | **Stand aside** | High | `low` impact, `estimate` date, `symbols: []`, 37 days out, no October consensus exists, and the print's own tape effect on this date is unattributable by construction — three stronger 8:30 ET releases share the minute. | Census or BLS re-dating **retail sales** or **PPI** off **2026-10-15** (both currently confirmed for 08:30 ET), which would leave Empire readable and reopen the attribution question this call closes |
| This week | **Stand aside — the week's forks are CPI 09-11 and FOMC 09-16; this event's own next datum is the September Empire print on 2026-09-15** | High | Nothing about 10-15 is decidable this week. The September print lands **23 days before this doc's next scheduled pulse** (2026-10-08 on the `low:15+` band), so it is the waypoint, not a scheduled check. | September Empire on **2026-09-15** printing **prices paid below ~45**, which breaks the 0.936-persistence leg the whole reading order rests on and forces the AR(1) band to be re-fit before 10-15 |
| This month | **Watch the pair, not either headline — Empire and Philly prices paid, 8:30 ET 2026-10-15** | Medium | Levels correlate r=0.908 over 302 months, yet August diverged **19.3 points** (96th percentile): Empire **58.6** vs Philly **40.9**. That is a live disagreement about input-cost pass-through into the one print the inflation-anchored 10-28 FOMC can still see before blackout. | Both surveys' **September** prices-paid prints (Empire **2026-09-15**, Philly **2026-09-17**) converging back inside ~5 points of each other, which retires the divergence before October can adjudicate it |
| This quarter | **Watch December, where this same print lands on a live funding cliff** | Low | Empire's **2026-12-15** edition prints the same morning as PPI (12-15), four days after the **2026-12-11** CR expiry. The Reserve Banks publish through an appropriations lapse; BLS and Census do not — the one branch on which a regional survey becomes the important number of its morning. | A full-year FY2027 appropriations package enacted before **2026-12-11**, which closes the branch exactly as **P.L. 119-103** (signed 2026-09-02) closed it for October |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never trade this print.** `low` impact, `symbols: []`, `estimate` date, no macro-keyed house
  playbook exists (S1/S2/E1/S3/S4 + G1 are all symbol/earnings-keyed), and on 10-15 attribution is
  impossible by construction — not merely weak.
- **Read prices paid first, the headline last.** Measured: lag-1 autocorrelation **0.936 vs 0.269**
  (2021+/2024+); August's number cuts October's prices-paid uncertainty **~52%**, its headline
  uncertainty **~5%**.
- **The October headline's honest 90% band is −16 to +32** — wider than the index's whole 2026
  range. Any point forecast quoted for it is a story, not a forecast.
- **The pair is the signal** — Empire **58.6** vs Philly **40.9** in August, a 96th-percentile
  disagreement against levels that correlate at r=0.908.
- **Base rate, with its limit stated** — after any Empire print ≥20 (n=**56** since 2001) the level
  two months later is below 20 in **30/56**, median **18.7**; but the **2026-09-15** print
  intervenes and resets the anchor, so this bears on September first, not October.
- **The shutdown branch is closed for October, live for December** — **P.L. 119-103** (signed
  2026-09-02) funds through **2026-12-11**.
- **Watch (dated):** CPI **09-11** · **September Empire 09-15** · FOMC **09-16** · **September
  Philly 09-17** · CPI + Beige Book **10-14** · **this print + retail sales + PPI + Philly MBOS
  10-15** · opex **10-16** · blackout **10-17** · FOMC **10-28** · CR expiry **12-11** · **December
  Empire + PPI 12-15**.

## Initial research

### The question, plainly

What is the Empire State Manufacturing Survey, what should we expect from the October reading on
2026-10-15, does it move the tape, and how should a paper-trading book holding long-duration tech
(NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) use a ~100-respondent New York State diffusion survey
that lands in the same minute as retail sales and PPI?

**One-line verdict:** the headline is close to unforecastable and, on this specific date,
unattributable — so the honest output is a permanent stand-aside plus a **reading order with a
measured basis**: prices paid autocorrelates at 0.936 where the headline autocorrelates at 0.269,
and the decision-relevant object is not this survey at all but the **Empire/Philly prices-paid
pair**, which diverged at the 96th percentile in August and gets adjudicated at 8:30 ET on 10-15.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies as written and the cache-busting rule
has no target. This event existed only as
`proposals/empire-state-mfg-2026-10-15.from-cpi-2026-10-14.json`, so per the mode contract that
proposal was read first and the canonical `src/domain/market-events/empire-state-mfg-2026-10-15.json`
written in this PR. Three inputs:

1. **Primary-source web research, and unusually for this lane the primary is reachable.** The NY
   Fed's own overview page (`newyorkfed.org/survey/empire/empiresurvey_overview`) returned **HTTP
   200** today — no `blocked` entry on this doc, in contrast to the `dallasfed.org` 403s the sibling
   [`dallas-fed-mfg`](dallas-fed-mfg-2026-09-28.md) doc records and the `bls.gov` 403s
   [`cpi-2026-10-14`](cpi-2026-10-14.md) records. The Philadelphia Fed's MBOS landing page likewise
   returned 200.
2. **An original measurement, run for this doc.** The NY Fed's own published series, pulled as CSV
   from FRED (`GACDISA066MSFRBNY` headline, `PPCDISA066MSFRBNY` prices paid,
   `PRCDISA066MSFRBNY` prices received, `NOCDISA066MSFRBNY` new orders; Philly's
   `GACDFSA066MSFRBPHI` / `PPCDFSA066MSFRBPHI`), **302 monthly observations, 2001-07 → 2026-08**.
   Autocorrelations, AR(1) fits with two-step-ahead prediction bands, conditional base rates, and
   the Empire-vs-Philly divergence distribution are all computed from that pull.
3. **The calendar itself, read as data.** The co-release census in leg 4 is `src/domain/market-events/`
   queried directly, not recalled.

Fed-path, energy and corridor context is carried from the sibling
[`cpi-2026-10-14`](cpi-2026-10-14.md), [`fomc-2026-10-28`](fomc-2026-10-28.md) and
[`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) ledgers rather
than re-derived. VIX **15.26** is this doc's own Yahoo pull (2026-09-08). The event's date is
**`estimate`**, and that label rides on every trading-adjacent line below.

### Conviction legs, tested

1. **The date and time are right, and they stay `estimate` — SUPPORTED, primary reachable.** The NY
   Fed's own overview page lists the full 2026 calendar (Jan 15 · Feb 17 · Mar 16 · Apr 15 · May 15 ·
   Jun 15 · Jul 15 · Aug 17 released; **Sep 15 · Oct 15 · Nov 16 · Dec 15** forward) and states the
   timing verbatim: *"Released at or shortly after 8:30 a.m."* The pattern is internally consistent —
   the 15th, rolled to the next business day when the 15th falls on a weekend (Feb 15 2026 was a
   Sunday → Feb 17; Aug 15 was a Saturday → Aug 17). **2026-10-15 is a Thursday, so no roll applies.**
   The entry nonetheless stays `estimate` on two compounding grounds, neither of which is doubt about
   the date: the confirmed-prefix taxonomy in `market-events-data.ts` has **no member for a regional
   Reserve Bank's own survey schedule** (`FED:` covers the federalreserve.gov FOMC calendar only), and
   this lane does not self-confirm an event it discovered in-sweep. Same reasoning as
   [`eurostat-hicp-final-2026-09-17`](eurostat-hicp-final-2026-09-17.md).

2. **What the survey is, and the scope limit that governs everything below — SUPPORTED.** The NY Fed
   sends it *"on the first day of each month to the same pool of about 200 manufacturing executives
   in New York State, typically the president or CEO,"* receives *"about 100 responses,"* and
   collects until mid-month: *"Most are completed by the tenth, although surveys are accepted until
   the fifteenth."* It is a **diffusion index** (share reporting increase − share reporting decrease)
   over general business conditions, new orders, shipments, unfilled orders, delivery times,
   inventories, supply availability, employment, average workweek, **prices paid** and **prices
   received**, each with a six-month-ahead expectation. Two structural facts do the work here: it is
   **one state and ~100 respondents**, and it is **not a price level** — so it can corroborate or
   contradict the *direction* of an input-cost story and can never confirm or refute a CPI print.
   The collection window matters for the ordering: October's responses are gathered **~Oct 1–10**, so
   the 10-15 print covers **October**, one day after CPI on 10-14 covers **September**.

3. **The headline is very nearly unforecastable, and the prices line is not — MEASURED, and this is
   the doc's central finding.** Over 302 months the headline's month-over-month change has a standard
   deviation of **11.53** (14.04 since 2021, 13.30 since 2024) with a **median |Δ| of 11.2** since
   2024. Its lag-1 autocorrelation decays hard across regimes — **0.718** full sample, **0.558** since
   2021, **0.269** since 2024. Fit an AR(1) on the 2021+ window (slope **0.571**, residual sd
   **12.6**) and forecast two steps from August's **20.6**: September **12.4**, October **7.7**, with
   a two-step standard error of **14.5** against an unconditional standard deviation of **15.3** —
   **a 5% reduction in uncertainty**. The 90% band is **−16 to +32**, a 48-point window against a
   2026 realized range of −0.2 to 20.6. The same arithmetic on **prices paid** (slope **0.936**,
   residual sd **7.1**) gives October **57.6**, two-step se **9.7** against an unconditional **20.2**
   — **a 52% reduction**, 90% band roughly **42 to 74**. One release, two halves, an order-of-magnitude
   difference in what last month tells you about next month. That asymmetry is the entire reason this
   doc has a reading order rather than a forecast.

4. **2026-10-15 is the worst readable morning of Empire's 2026 schedule — MEASURED from the calendar,
   and it is what makes the stand-aside structural rather than statistical.** The sibling
   [`dallas-fed-mfg`](dallas-fed-mfg-2026-09-28.md) doc measured its release-hour move against a
   two-year distribution and found nothing. That method **cannot be run here**, and the reason is
   more interesting than the result would have been: Empire prints at **8:30 ET**, pre-open, into a
   slot it usually shares. Querying `src/domain/market-events/` for the four months this calendar has
   schedules for:

   | Empire release | Other tracked 8:30 ET majors that morning | Readable alone? |
   |---|---|---|
   | 2026-09-15 | none (PPI 09-10 · CPI 09-11 · retail sales 09-16) | **yes** |
   | **2026-10-15** | **retail sales** (`high`, confirmed) · **PPI** (`medium`, confirmed) · **Philly Fed MBOS** (leg 5) | **no — three stronger prints** |
   | 2026-11-16 | none (CPI 11-10 · PPI 11-13 · retail sales 11-17) | **yes** |
   | 2026-12-15 | PPI (`medium`) | partly |

   So the collision is **not** structural every month — it is 2 of 4, and October is the single month
   where Empire shares 8:30 with **both** a Census and a BLS major. Retail sales lands on the 15th
   only in October (Census's ~16-days-after rule plus weekday alignment); CPI and PPI cluster on the
   10th–13th in the other months. **The consequence is an identification problem, not a weak effect:**
   any 10-15 open gap is jointly caused by a `high`-impact consumption print, a `medium`-impact
   producer-price print, and two regional surveys, and no percentile test can separate them. Where
   Dallas's stand-aside rests on a measured null, this one rests on the release being unattributable
   by construction — a stronger claim on this date and a *weaker* one on 09-15 and 11-16, where the
   same survey is cleanly readable and this doc's finding does not transfer.

5. **The direct peer prints the same minute and the calendar did not carry it — SUPPORTED, and
   proposed in this PR.** The Philadelphia Fed's **Manufacturing Business Outlook Survey** is Empire's
   methodological twin — the only other regional Fed manufacturing survey publishing a prices-paid
   diffusion index at 8:30 ET — and it releases on the **third Thursday** of each month. Its own
   landing page (fetched direct 2026-09-08, HTTP 200) names the next two releases verbatim:
   **"September 17, 2026 at 8:30 a.m."** and **"October 15, 2026 at 8:30 a.m."** The third-Thursday
   rule reproduces both independently (September's Thursdays are the 3rd/10th/17th; October's are the
   1st/8th/15th/22nd/29th). This calendar tracked **zero** Philadelphia Fed entries in any month, so
   `philly-fed-mfg-2026-10-15` is proposed as
   `proposals/philly-fed-mfg-2026-10-15.from-empire-state-mfg-2026-10-15.json` (`estimate`) in this
   PR. Tracking one of a correlated pair and not the other is the same selection bias the
   `dallas-fed-mfg` entry was filed to fix for the growth headline — transposed onto the prices line.

6. **The pair disagrees right now, at the 96th percentile, about the one thing the Fed is anchored to
   — MEASURED, and it is the reason to open the report at all.** Empire and Philly prices-paid
   **levels** correlate at **r = 0.908** over 302 common months (**0.934** since 2021) — they
   normally tell the same story. Their month-over-month *changes* correlate far more loosely
   (r = 0.318 full, 0.429 since 2021), so a one-month disagreement is not per se remarkable; the
   **size** of this one is. August 2026: Empire prices paid **+6.3 to 58.6**, Philly prices paid
   **−13.0 to 40.9** — a **19.3-point** gap in the same month's change, against a **median
   disagreement of 5.2** and a p90 of **15.3**. That is the **96th percentile** of 301 months.
   Empire's **58.6** is the **91st percentile** of its own full history and its third-highest reading
   since 2023 (behind 2026-05's 62.6 and 2026-06's 61.0). Set that against the corridor's live
   question — EIA regular gasoline **$4.071/gal** for the week ending 2026-08-31 against **$3.177** a
   year earlier (**+28.1% y/y**), AAA **$4.15** on 09-04, a second Aramco Jazan strike on 09-07 with
   Brent **$97.29**, all carried from [`cpi-2026-10-14`](cpi-2026-10-14.md) — and the two surveys are
   giving opposite answers on whether the energy shock is reaching goods input costs. **10-15 at 8:30
   ET is when they answer again, simultaneously, two days before the 10-17 blackout.**

7. **Empire's own internals say margin squeeze, and that survives the noise finding — SUPPORTED.**
   August: headline **20.6** (from 15.6; highest since Dec 2021), new orders **17.3**, shipments
   **11.7**, employment **9.3**, prices paid **58.6** (from 52.3), prices received **22.7** (from
   27.6), six-month-ahead business conditions **32.1**. The NY Fed's own narration has supply
   challenges intensifying and delivery times lengthening substantially. The decision-relevant number
   is the **spread**: prices paid minus prices received ran **35.9** in August, the **widest since
   April 2022** and third-widest since 2022 overall (behind 2022-01's 42.4 and 2022-04's 40.3). Input
   costs are rising faster than New York manufacturers can pass them on. Both legs of that spread sit
   in the persistent half of leg 3, so unlike the headline it is a reading that carries forward.

8. **The reversion base rate is real, and it bears on September rather than October — MIXED, and
   graded down for exactly that reason.** Across the full 302-month series, a print **≥20** has
   occurred 56 times; the **next** month is lower in **41/56 (73%)** with a mean change of **−5.5**,
   and **two** months later the level is below 20 in **30/56** with a median of **18.7** (p10 **5.2**,
   p90 **34.0**, below zero only 4/56). Only 15% of months since 2021 print ≥20 at all, and every
   prior reading ≥20.6 is in 2021. So gravity points down. **But the honest limit is the sequencing:**
   August's 20.6 is *two* prints away from 10-15, and the **2026-09-15** September release lands
   between them — by October the conditioning observation is September's number, not August's. This
   base rate is therefore a prior for the 09-15 print that this doc will inherit at its next pulse,
   not a call on 10-15. Recorded so the next session uses it in the right place.

9. **The branch that would have made this the important print of its morning is already closed —
   SUPPORTED, and it is a leg tested and killed rather than one omitted.** The sibling
   [`dallas-fed-mfg`](dallas-fed-mfg-2026-09-28.md) doc identified the general shape: the Reserve
   Banks are Fed-funded and publish through an appropriations lapse where BLS and Census do not (in
   the 2025 lapse BLS skipped the October Employment Situation and cancelled October CPI outright).
   Applied here, a lapse would have emptied the 10-15 morning of retail sales and PPI and left Empire
   and Philly as two of the few hard-ish October reads into the 10-28 FOMC — inverting this doc's
   whole call. **It cannot happen.** H.R. 6500 was signed **2026-09-02** as **P.L. 119-103**, funding
   agencies through **2026-12-11** (see
   [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md), which
   records the House concurrence 370–48 on 09-01). Retail sales and PPI will print on 10-15. The
   branch survives only for the **December 15** edition, four days past the **12-11** CR expiry —
   which is why it is the quarter-horizon call and not this month's.

10. **Tracked-name sensitivity is indirect and thinner than in any sibling doc — SUPPORTED.**
    `symbols: []`. None of the nine tracked names is a New York State manufacturer. The only channels
    are (a) the **rate path**, via prices paid feeding the inflation case the 10-28 FOMC is anchored
    to, reaching every name as a long-duration asset — most sharply **CRWV** (debt-financed buildout:
    discount rate *and* cost of capital), then the high-multiple semis **NVDA / AVGO / MRVL**, then
    **MSFT / GOOG / META**, least **AAPL / AMZN** (an estimated ranking, inherited from the sibling
    CPI doc rather than re-derived); and (b) **capex sentiment**, a quarters-long channel one state's
    ~100-respondent survey cannot evidence. Leg 4 weakens both further on this date specifically:
    whatever the transmission, it is not separable from retail sales and PPI in the same minute.
    Neither channel licenses a position off this print.

### What the conditions support

Nothing directional. What the conditions support is a **reading discipline with two measured
foundations**. First, an order: prices paid and the paid-minus-received spread before anything else,
six-month expectations second, the headline last and only as colour — because the persistence gap is
0.936 against 0.269 and a point forecast of the headline cannot be honest. Second, a **unit of
observation that is not this event**: the Empire/Philly prices-paid pair, read together at 8:30 ET on
10-15, because either one alone is a ~100-respondent single-district diffusion index and the two of
them are currently 19.3 points apart on the question the FOMC is anchored to. And a refusal that is
structural: on this date no move is attributable to this survey, so no size, no hedge, no directional
read attaches to it — while noting honestly that the same survey **is** cleanly readable on 09-15 and
11-16, where this particular objection does not apply.

### Honest limits

The measurement is of the **published series**, not of the tape — this doc deliberately does **not**
run the sibling Dallas release-hour percentile test, because leg 4 shows it would be unidentifiable
on this date, and an unidentifiable null reported as a null would be worse than no test. So the claim
"this release does not move the market" is **not made here**; the claim made is the weaker and more
defensible one, that on 2026-10-15 you could not tell. The AR(1) bands in leg 3 assume a linear
Gaussian process on a bounded diffusion index — the true bands are somewhat tighter at the extremes
than −16/+32 suggests, and the finding they support (headline ≈ unforecastable, prices ≈ persistent)
is robust to that, but the numbers are model output, not history. The 2021+ window is chosen for
regime relevance and is short (n=67); the full-sample autocorrelations (0.718 / 0.921) are higher for
both series, which narrows the gap between them without closing it. The Philly Fed schedule in leg 5
rests on the landing page's next-two-releases block plus the third-Thursday rule — the full 2026
calendar was **not** enumerated from the primary, and the November/December Philly dates are
therefore *not* used anywhere above. October's collection window (~Oct 1–10) is derived from the NY
Fed's stated methodology, not from an October release note that does not yet exist. No October
consensus exists at D-37 and, on this series' pattern, none will until release week. And the
divergence in leg 6 is **one month**; a 96th-percentile observation on n=301 is expected about a dozen
times a century, so it is unusual, not unprecedented.

## Stance & kill switches

**Stance (date `estimate`, NY Fed primary fetched direct 2026-09-08 HTTP 200).** Treat 2026-10-15
08:30 ET as a **low-impact reading exercise and never an event**: no position is opened, closed or
sized off it, no house playbook targets it, and on this date the refusal is **structural** — retail
sales (`high`, confirmed) and PPI (`medium`, confirmed) print in the identical minute, so no move is
attributable to this survey by construction. The standing instruction is a reading order with a
measured basis: **prices paid, then the paid-minus-received spread, then six-month expectations, then
the headline** — because the headline's lag-1 autocorrelation is **0.269** (2024+) against prices
paid's **0.936**, and knowing August cuts October's headline uncertainty by ~5% against ~52% for
prices. **No point forecast of the October headline is offered**, and that is the finding: its honest
90% band is **−16 to +32**, wider than the index's entire 2026 range. The one forecast this doc will
make is on the persistent half — October prices paid centered near **57.6** with a 90% band of
roughly **42–74** (`estimate`-labeled, **Medium** confidence), registered as
`FT-empire-state-mfg-2026-10-15-1`. **The object actually worth watching is not this event alone but
the Empire/Philly prices-paid pair**, whose August disagreement (58.6 vs 40.9, 19.3 points, 96th
percentile of 301 months) is a live contradiction about energy pass-through that 10-15 at 8:30
adjudicates, two days before the 10-17 blackout — which is why `philly-fed-mfg-2026-10-15` is
proposed to the calendar in this PR. The reversion base rate off August's 20.6 (next month lower in
41/56; two months later below 20 in 30/56) is banked as a prior for the **2026-09-15** print, not for
this one.

**Kill switches:**

- **Retail sales or PPI moves off 2026-10-15** — leg 4's identification problem dissolves, the
  morning becomes readable, and the structural half of this stand-aside has to be replaced with an
  actual measurement (the sibling Dallas release-hour test, adapted to an 8:30 pre-open print).
- **September Empire prices paid (2026-09-15) prints below ~45** — the 0.936 persistence leg breaks,
  the AR(1) band and `FT-empire-state-mfg-2026-10-15-1` must be re-fit before 10-15, and the reading
  order loses its measured basis.
- **Empire and Philly September prices paid converge inside ~5 points** (2026-09-15 / 2026-09-17) —
  leg 6's divergence retires itself before October, the pair stops being the reason to open either
  report, and this doc drops to ordinary low-impact context.
- **The paid-minus-received spread narrows below ~20** — the margin-squeeze read in leg 7 is gone and
  with it the only line here a rate desk can use.
- **The Fed stops being inflation-anchored** — a 09-16 or 10-28 repricing from hold-vs-hike toward
  hold-vs-cut, or the energy shock unwinding (Brent sustained below ~$85 with the EIA gasoline y/y
  gap under ~+15%) — at which point the prices lines lose their claim on attention and the reading
  order inverts toward the growth headline this doc just measured as uninformative.
- **A full-year FY2027 appropriations package before 2026-12-11** — leg 9's surviving December branch
  closes, and the 12-15 edition is ordinary context rather than a possible last-data-standing print.
- **A `FED:`-class prefix is added for regional Reserve Bank survey schedules** — the date can be
  promoted out of `estimate` by whoever owns that change (`market-events-data.ts`), which would also
  unblock the sibling Philly proposal and every future Empire/Dallas/Chicago entry. Recorded as the
  one-time governance fix that would stop this taxonomy gap recurring, not as an ask.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-37 | Initial research banked (above). **Canonical entry written this PR** — this id existed only as `proposals/empire-state-mfg-2026-10-15.from-cpi-2026-10-14.json`; per EVENT-RESEARCH's proposal rule that file was read first, its primary re-verified independently (`newyorkfed.org/survey/empire/empiresurvey_overview`, **HTTP 200**, 2026 calendar Sep 15 · **Oct 15** · Nov 16 · Dec 15, *"Released at or shortly after 8:30 a.m."*), and `src/domain/market-events/empire-state-mfg-2026-10-15.json` written. Stays `estimate`: the confirmed-prefix taxonomy has **no member for a regional Reserve Bank survey schedule** and this lane does not self-confirm an in-sweep discovery. **Original measurement #1 — the release is two numbers with opposite information content.** FRED pull of the NY Fed's own series (302 months, 2001-07 → 2026-08): headline lag-1 autocorr **0.718 full / 0.558 2021+ / 0.269 2024+**, mean \|MoM Δ\| **11.5** since 2024; AR(1) 2021+ (slope 0.571, resid sd 12.6) two-step from Aug **20.6** gives Oct **7.7** with se **14.5** against unconditional **15.3** — a **5%** uncertainty reduction, 90% band **−16 to +32**, wider than 2026's whole realized range (−0.2 … 20.6). Prices paid: autocorr **0.936**, AR(1) slope 0.936/resid 7.1, Oct **57.6**, se **9.7** vs unconditional **20.2** — a **52%** reduction, band **~42–74**. Read prices, not the headline; measured, not preferred. **Original measurement #2 — 10-15 is unreadable by construction.** Calendar queried directly: of the four months with schedules (Sep 15 · Oct 15 · Nov 16 · Dec 15), **October is the only one where Empire shares 8:30 ET with both a Census and a BLS major** — retail sales (`high`, confirmed) and PPI (`medium`, confirmed); Sep 15 and Nov 16 it prints alone, Dec 15 with PPI only. So the sibling Dallas release-hour percentile test was **deliberately not run** — it would be unidentifiable here, and an unidentifiable null reported as a null is worse than no test. This doc therefore claims only that you could not tell on this date, not that the release never moves anything. **Original measurement #3 — the pair is the signal, and it is currently in rare disagreement.** Empire vs Philly prices-paid **levels** correlate **r=0.908** over 302 months (0.934 since 2021), MoM changes only 0.318/0.429. August 2026 broke it: Empire **+6.3 → 58.6** (91st pct of full history; 3rd-highest since 2023) against Philly **−13.0 → 40.9** — a **19.3pt** gap at the **96th percentile** of 301 months (median 5.2, p90 15.3). Empire's paid-minus-received spread **35.9** is the widest since **April 2022**. **Base rates banked:** print ≥20 → next month lower **41/56 (73%)**, mean **−5.5**; two months later below 20 in **30/56**, median **18.7** (p10 5.2, p90 34.0) — but **September's 09-15 print intervenes**, so this is a prior for that release, not for 10-15, and is recorded as such. Only 15% of months since 2021 print ≥20; every prior reading ≥20.6 is in 2021. **Leg tested and killed:** the shutdown branch that would have made Empire the important print of its morning is **dead for October** — **P.L. 119-103** signed **2026-09-02** funds through **2026-12-11**, so retail sales and PPI both print; the branch survives only for the **12-15** edition, four days past the CR expiry. **Adjacency sweep.** *Peers:* `symbols: []`, so the peer is the sibling survey — **Philadelphia Fed MBOS**, whose own landing page (fetched direct 2026-09-08, HTTP 200) names **"October 15, 2026 at 8:30 a.m."**, reproduced independently by the third-Thursday rule. *Macro:* CPI **10-14** covers **September** while this survey's ~Oct 1–10 collection window covers **October** — a backward-looking official number followed within 24h by a forward-looking business survey on the month it does not touch; Beige Book same afternoon 10-14; blackout **10-17**; FOMC **10-28** hold-modal per the sibling ledger. *Volatility regime:* **VIX 15.26** (2026-09-08, own Yahoo pull), SPY 767.56, QQQ 719.68, 10y **4.796%** — baseline established, nothing to diff against yet. *Geopolitical/energy:* gasoline **$4.071/gal** wk-end 08-31 vs **$3.177** y/y (**+28.1%**, EIA primary via the sibling CPI ledger), AAA **$4.15** on 09-04, Jazan strike 09-07 with Brent **$97.29** — this is the input the prices-paid line measures and the reason the divergence matters. *Event tape:* **no October consensus exists at D-37** and none will until release week. **Adjacency proposal filed (1):** `proposals/philly-fed-mfg-2026-10-15.from-empire-state-mfg-2026-10-15.json`, `estimate`, `low` — the calendar tracked **zero** Philadelphia Fed entries in any month, and tracking one of an r=0.908 pair is the same selection bias `dallas-fed-mfg` was filed to fix, transposed onto the prices line. **Considered and declined (2):** (a) **`empire-state-mfg-2026-11-16`** — the next edition, and genuinely the *readable* one (it prints alone). Declined today because filing a second `low` row for a series this doc has just shown is unattributable on the date it is proposing to track would need the November argument made on its own merits, and the November case is about readability rather than materiality; the kill-switch list carries the retail-sales/PPI re-dating trigger that would change that calculus. (b) **The NY Fed's Business Leaders Survey** (the services sibling, released around the same date) — declined on the same second-order-survey grounds that kept UMich sentiment off this calendar, and its 2026 schedule was not enumerated from the primary. Named, not guessed. **Process note for the next session:** the **2026-09-15** September Empire print and the **2026-09-17** September Philly print both land *inside* this doc's 30-day `low:15+` interval, so the scheduled 2026-10-08 pulse will meet them 23 and 21 days stale. Not fixable from this lane (`assessment-cadence.json` owns the band) — flagged so the pulse reads them rather than re-deriving. **Registered:** `FT-empire-state-mfg-2026-10-15-1` (October prices paid ≥ 50) and `FT-empire-state-mfg-2026-10-15-2` (the October headline prints outside ±5 of August's 20.6). | — (stance set) | 2026-10-08 per the `low:15+` band (every 30d) — but read the 09-15 Empire and 09-17 Philly prints first; they supersede leg 8's anchor |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay, and a stance *change* earns its sentence in the Stance section with
the row as its receipt. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found
gets proposed as a new `src/domain/market-events/proposals/<id>.from-empire-state-mfg-2026-10-15.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
