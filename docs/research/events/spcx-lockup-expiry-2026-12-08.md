# SPCX 180-day lock-up cohort's last release — spcx-lockup-expiry-2026-12-08

**Kind:** lockup-expiry · **Date:** 2026-12-08 (confirmed, SEC: SpaceX 424B4 filed 2026-06-11, read in full 2026-10-20) · **Impact:** high
**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{"SPCX":147.96},"vix":17.71,"daysBand":"high:21+","adjacentIds":["cpi-2026-12-10","cr-expiry-2026-12-11","ecb-quiet-period-start-2026-12-09","eia-steo-2026-12-08","ercot-data-center-audit-filing-2026-12-10","eroc-lockup-expiry-2026-12-06","existing-home-sales-2026-12-09","fomc-2026-12-09","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","intl-trade-full-report-2026-12-08","ism-services-2026-12-03","japan-balance-of-payments-2026-12-08","japan-cgpi-2026-12-10","jobs-2026-12-04","livingston-survey-2026-12-11","m3-full-report-2026-12-03","msft-annual-meeting-2026-12-08","mts-november-2026-12-10","ndx-annual-reconstitution-announcement-2026-12-11","pbls-lockup-expiry-2026-12-06","productivity-costs-q3-revised-2026-12-08","qss-q3-2026-12-10","russell-reconstitution-2026-12-11","sp-rebalance-proforma-2026-12-04","sp-rebalance-reference-close-2026-12-11","treasury-10y-note-2026-12-08","treasury-30y-bond-2026-12-10","treasury-3y-note-2026-12-07","treasury-coupon-announcement-2026-12-03","wholesale-trade-2026-12-09"],"adjacentStrongIds":["cpi-2026-12-10","fomc-2026-12-09","jobs-2026-12-04"],"screenStreak":0,"blocked":[{"url":"https://www.cnbc.com/2026/08/10/spacex-spcx-stock-ipo-price.html","status":"403","at":"2026-10-20"}]} -->

## At a glance

**TL;DR.** Dec 8 is a real, filing-confirmed date but a *smaller* unlock than its title suggests: it is the last stage of
the 180-day cohort (up to 797.6M shares, ~17% of that cohort), after the 911.5M and ~1.3B stages, and the founder plus
an extended cohort (>60% of shares) stay locked into 2027. Six earlier stages moved the stock between −4.1% and +6.1% with
no consistent pullback, and the Dec-18 options carry no extra premium for the date. Stand aside; the Oct 22 release
(~1.3B shares, estimate) is the better read of how this supply trades, and it lands first.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | Stand aside | high | Q3 results land after the close today and the 1.3B-share stage follows in two sessions; Dec 8 is 49 days out | n/a — a stand-aside has no entry to be wrong about |
| This week | Stand aside | high | Q3 print + ~Oct 22 release (estimate) dominate; implied one-week move is ~108% IV on the Oct 23 expiry | Oct 22–23 closes: a ≥8% excess drop vs SPY on the release makes supply pressure the working read |
| This month | Stand aside | medium | Dec 8 is a smaller stage than three already absorbed; no edge either side until the Oct 22 reaction is on the tape | 2026-11-20: Nov-20 IV staying >65% while realized vol falls would mean the market prices something this note does not |
| This quarter | Stand aside; no pre-positioning ahead of Dec 8 | medium | Mean tranche-day return across six stages ≈ −0.1%; 22–28% of eligible shares actually traded on the days measured | 2026-12-09 close: Dec 8–9 excess return ≤ −6% vs SPY (registered as FT-1) |

**Call:** wait until 2026-12-08

**Signals & conditions** — the buy/sell/hold triggers:

- **Buy signal:** no — a lock-up release is supply, never a reason to buy ahead; no position on the listing day or the release day.
- Re-open the stance after the Oct 22 session (estimate until the Q3 release is out): its reaction is the only direct read of how a stage this size trades.
- Re-open on any 8-K or underwriter consent moving the Dec 8 stage earlier or later (the date is `confirmed` only as filed).
- Dec 9 FOMC, Dec 10 CPI and Dec 11 events (Nasdaq-100 reconstitution notice, Russell reconstitution, `cr-expiry`) all land inside the 3 sessions after Dec 8 and will blur any read.

## Initial research

### The question

Does the Dec 8 lock-up date, as filed on the calendar, create a tradeable supply shock in SPCX — and is the date even the one the title implies?

**One-line verdict:** the date holds (SEC, confirmed), the shock does not look special: it is the last stage of the 180-day cohort and ~18% of the then-tradable pool; the options market prices no premium for it; the default call is stand aside.

### Method

- Read the full 424B4 (11.95 MB; WebFetch cannot take it, so `curl` + `htmlToText` from `scripts/research/lockup-math.mjs`) — "Underwriting — Lock-up Agreements" and "Shares Eligible for Future Sale".
- Yahoo daily bars for SPCX since the 2026-06-12 first trade (90 sessions) for run-up, realized vol, volume and the tranche-day returns.
- Cboe delayed chain (`cdn.cboe.com`, 2026-10-20 ~10:50 ET; delayed, one snapshot, not order-grade) for IV term structure and skew.
- Press for the Q3 date and tranche-day narrative (Yahoo Finance, Quartz, Motley Fool, KuCoin/OpeningBell mirrors — secondary; where they disagree with the filing, the filing wins).
- `npm run research:dossier` is symbol-keyed for earnings events and does not apply to a lockup-expiry; no house pair or conviction claim names SPCX in the calendar files read.

### Leg 1 — which date, and does it settle? SUPPORTED (Dec 8, as the 180-day cohort's final stage)

The discovery lane filed this as `estimate` because the filing names 180, 280, 340 and 366-day periods and early-release triggers. Reading the clauses:

- **180-day cohort** (everything not below): staged — 20% (911.5M) two full trading days after the Q2 release (Aug 4 → Aug 6, done); +10% (455.8M) only if the close was ≥30% over the $135 IPO price (≥$175.50) on 5 of the 10 sessions to Aug 4; 7% (319.0M / 328.4M) each on Aug 20, Sep 9, Sep 24, Oct 9 and Oct 24 (a Saturday → Oct 26); 28% (~1.3B) two full trading days after the Q3 release; the remainder on **Dec 8**.
- **The +10% test lapsed.** SPCX's closes for Jul 20–Aug 4 peak at $125.33, so the remainder on Dec 8 is the larger figure: **up to 797.6M shares** (the filing's own alternative: 328.4M).
- **Extended cohort and the founder are not Dec 8.** Mr. Musk's shares: 366 days (Jun 12 2027), no early release. Other holders: staged from Q4-2026 results through Q2-2027 results. Together ~7.8B shares, >60% of shares outstanding.
- **One-day wording gap:** the lock-up definition ends the period "immediately after the close of the trading day on the 180th day"; the sale-availability table says Dec 8 is the earliest date. First full sale session is Dec 8 or Dec 9; the forward tests read both.
- **Why `confirmed` is honest here:** no remaining trigger can move this tranche earlier (earnings-linked stages precede it and are dated; the price test has lapsed), and the date is arithmetic from a filed prospectus date. It is confirmed *as the cohort's last stage*; it is not "the lockup ends".
- **Secondary-source mismatch:** one article quotes the post-Q3 remainder as 857M; 797.6M + 59.1M (the Sep-10 affiliates stage) = 856.7M, so it likely bundles two stages. The filing's 797.6M is used.

### Leg 2 — supply. MIXED (large in absolute terms, smaller than the stages already absorbed)

| Measure | Value |
|---|---|
| Dec 8 stage | up to 797.6M shares |
| …as % of Class A outstanding (7,380M) | ~10.8% (~6.1% of Class A + B 13,076M) |
| …vs IPO float (555.6M) | ~1.4× |
| …in days of average volume | ~9.9 (20-day ADV 80.2M) / ~8.3 (60-day ADV 95.9M) |
| Tradable pool before it (IPO float + Aug 6 → Oct 26 + ~Oct 22 stages, my sum) | ~4.45B → Dec 8 adds ~18% |
| Earlier stages | Aug 6 911.5M · Oct 22 ~1.3B (est.) are both larger |

Affiliate shares are excluded from some stages' counts in the filing and its volume limits (Rule 144) cap what insiders can sell, so "eligible" overstates supply. Observed take-up: 255.2M traded on Aug 6 against 911.5M eligible (28%); 72.7M on Sep 24 against 328.4M (22%).

### Leg 3 — price/run-up. MIXED

- IPO $135 (Jun 11); first-day close $160.95; high close $211.39 (Jun 16, Yahoo; a news mirror prints $201.80 — unreconciled); low close $108.27 (Aug 5); last close $147.96 (Oct 19), **+9.6% over the IPO price**, −30% from the high.
- The lock-up literature's larger pullback follows a big run-up; the run-up from IPO is now small, though the stock is +37% off its August low.
- Realized vol: 20-day 52%, 60-day 69%, since IPO 82%.

### Leg 4 — the six stages already traded. REFUTES a reliable pullback

Close-to-close, SPCX (not excess, so market drift is in it):

| Stage | Eligible | Day return | Next 5 sessions |
|---|---|---|---|
| Aug 6 | 911.5M | +6.1% | +23.0% |
| Aug 20 | 319.0M | −4.1% | +5.1% |
| Sep 9 | 319.0M | −3.9% | +2.3% |
| Sep 10 | 59.1M | +0.4% | +4.5% |
| Sep 24 | 328.4M | −0.2% | 0.0% |
| Oct 9 | 328.4M | +1.3% | −10.2% |

Mean day return −0.1%; three of six down. n=6 is thin and six overlapping stages of one cohort are not six independent events. The Oct 9 five-day figure shows the other tail.

### Leg 5 — options. SUPPORTED as "no priced catalyst"

Cboe ATM IV, Oct 20: Oct 23 ~108% · Oct 30 ~73–75% · Nov 20 ~58% · **Dec 18 ~53%** · Jan 15 ~51%. Dec-18 skew is flat (130 put 54.8% vs 170 call 52.2%). The forward vol between the Nov 20 and Dec 18 expiries, which contains Dec 8, backs out to ~47% — below spot's 20-day realized vol. A downward term structure with no bump across Dec 8 means the market is paying for the Q3 print and Oct 22, not for Dec 8.

### What the conditions support

No defined-risk play is supported: a short-vol or bearish structure has no priced catalyst to harvest and no repeated pullback to ride; a long structure fights supply. Default per the lockup playbook (#5912): stand aside until the lockup study (slice 2) says otherwise. A pulse after Oct 22 may upgrade this if that release trades as a clear supply event.

### Honest limits

- Q3 results are not out as of this writing (after the close Oct 20); every number here is pre-print.
- Cboe quotes are delayed and one intraday snapshot; no order-grade claim.
- Secondary press for the Q3 date and for tranche-day returns beyond what Yahoo bars show; the filing is the only primary for the schedule.
- Nasdaq-100 membership since Jul 7 means QQQ is contaminated as a benchmark; the forward tests use SPY (SPCX is not in the S&P 500).
- The 10.8% / ~18% figures count shares *eligible*, not shares sold; insiders' real selling is unobservable until Form 4 / 144 filings.

## Stance & kill switches

**Stance (confirmed date, as filed; analysis is a pre-print estimate):** stand aside on the Dec 8 stage. Not a short, not a long — no priced catalyst, no reliable pullback, and a smaller stage than three already absorbed.

Kill switches (what makes this stance wrong):
1. Oct 22–23 SPCX excess return vs SPY ≤ −8% on the ~1.3B-share release — supply is trading as a pullback; re-read Dec 8 as at least half that size.
2. A filed 8-K, amended lock-up or underwriter waiver changing the Dec 8 stage's size or date.
3. Nov 20 IV above ~65% with 20-day realized vol falling — the market is pricing a catalyst this note does not see.
4. Dec 8–9 excess return ≤ −6% vs SPY (FT-1).

Registered forward tests: `docs/research/forward-tests/spcx-lockup-expiry-2026-12-08.md` (FT-1, FT-2, score by 2026-12-16).

**Noted beyond this event, not filed:** ~Oct 22 (1.3B shares, proposed as `spcx-lockup-release-2026-10-22.from-spcx-lockup-expiry-2026-12-08.json`); Oct 26 (328.4M, a smaller stage of the same schedule); the 351.9M extended-cohort stage after Q4-2026 results (early 2027); Mar 18, May 17 and Jun 12 2027 further stages — all past this event or beyond the calendar horizon.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-10-20 | 49 | Initial. Read 424B4: Dec 8 = last stage of 180-day cohort, up to 797.6M sh (price test lapsed, high 125.33 vs 175.50 needed); founder + extended cohort (>60%) locked to 2027. Date flipped estimate→confirmed (SEC). Six prior stages: day returns +6.1/−4.1/−3.9/+0.4/−0.2/+1.3%. IV Dec-18 53%, no bump across Dec 8. Adjacency: Q3 results after close today, ~1.3B stage ~Oct 22 (proposed); VIX 17.7; FOMC 12-09, CPI 12-10, NDX/Russell/CR 12-11 inside D+3. | — (initial; stand aside) | 2026-10-27 (high:21+, 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found **inside the research horizon**
(`assessment-cadence.json`'s `horizon`: nothing past `maxDaysOut`, and past `allImpactsWithinDays`
only critical/high) gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). One past the horizon is named
in the row instead (#2946): it can never become due, so a calendar file for it is clutter, while
prose in a row is free. Close-out fills `## Outcome` below from re-run instrument data (cache busted
first), never from memory. After that the assessment is closed; the doc reopens only to score a
registered forward test whose `Score by` has arrived (`forward-test-due`).
