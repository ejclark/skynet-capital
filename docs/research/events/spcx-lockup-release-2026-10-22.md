# SPCX Q3-results lock-up release — spcx-lockup-release-2026-10-22

**Kind:** lockup-expiry · **Date:** 2026-10-22 (estimate, SEC: 424B4 stage clause read in full 2026-10-20; the date waits on the Q3 release actually landing) · **Impact:** high
**Last assessed:** 2026-10-20
<!-- probe-ref: {"symbols":{"SPCX":147.48},"vix":17.61,"daysBand":"high:0+","adjacentIds":["aapl-iphone-duo-launch-2026-10-23","apec-fmm-hong-kong-2026-10-20","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","ecb-quiet-period-start-2026-10-21","fhfa-hpi-2026-10-27","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","japan-cpi-2026-10-23","jgb-20y-auction-2026-10-20","jgb-liquidity-enhancement-11-39y-2026-10-27","jgb-liquidity-enhancement-5-11y-2026-10-22","meta-2026-10-28-print","meta-nm-privacy-penalty-ruling-2026-10-20","msft-def14a-2026-10-22","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","new-home-sales-2026-10-27","pending-home-sales-2026-10-20","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-buyback-20y30y-2026-10-27","treasury-buyback-tips-1y10y-2026-10-21","treasury-coupon-announcement-2026-10-22","uk-ashe-earnings-2026-10-22","uk-consumer-confidence-2026-10-23","uk-cpi-2026-10-21","uk-gilt-auction-short-2026-10-27","uk-labour-market-2026-10-20","uk-ppi-2026-10-21","uk-public-sector-finances-2026-10-21","uk-retail-sales-2026-10-23","umich-sentiment-final-2026-10-23","vix-expiration-2026-10-21"],"adjacentStrongIds":["meta-2026-10-28-print"],"screenStreak":0,"blocked":[{"url":"https://ir.spacex.com/updates/releases-details/2026/SpaceX-to-Post-Third-Quarter-2026-Results-and-Host-Webcast-on-October-20-2026-2026-QssQGye3im/default.aspx","status":"403","at":"2026-10-20"}]} -->

## At a glance

**TL;DR.** Up to ~1.3B shares (28% of the 180-day cohort, **estimate** until Q3 results are public) become sellable on
Thu Oct 22, the second full session after the Oct 20 after-close results. It is the largest single stage left, but
relative to the shares already tradable it is smaller than the Aug 6 stage was, the four prior stages moved the stock
−4.0% to +1.2% on the day, and the options price Oct 22–23 at roughly the stock's ordinary vol. The Q3 print (reaction
session Oct 21) will drown the supply signal. Stand aside through the print and the release; read the tape, don't pre-position.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | Stand aside | high | Results land after today's close; the release is two sessions out and the date is still an estimate | n/a — a stand-aside has no entry to be wrong about |
| This week | Stand aside | high | Oct 21 is the print reaction, Oct 22 the 1.3B-share release; Oct 23 expiry straddle ~8.2% prices both with no release premium | 2026-10-23 close: Oct 21→23 excess return vs SPY ≤ −8% makes supply the working read (FT-1) |
| This month | Stand aside | medium | No edge until the release trades; Oct 26 (328.4M) and Dec 8 (up to 797.6M) are smaller stages | 2026-11-20: Nov-20 IV staying >65% as realized vol falls means the market prices something this note does not see |
| This quarter | Stand aside; no pre-positioning | medium | Cohort-wide take-up so far is 22–28% of eligible shares and day returns show no reliable pullback | 2026-12-09 close: Dec 8–9 excess ≤ −6% vs SPY (the sibling event's FT-1) |

**Call:** wait until 2026-10-22

**Signals & conditions** — the buy/sell/hold triggers:

- **Buy signal:** no — a lock-up release is supply, never a reason to buy ahead; no position on the print or release day.
- Re-assess after the Oct 21 close: the print's size and direction decide whether Oct 22 is read as supply or as continuation.
- The date flips to confirmed when the Q3 results are public (8-K Item 2.02 / IR release); a slip to Oct 21 after-close moves the stage to Oct 23.
- Re-open on any 8-K, waiver or amended lock-up changing the stage's size or date.
- Oct 22 is also the 5Y TIPS auction day and the day after UK CPI; Meta reports Oct 28, so no major macro print sits on the release session itself.

## Initial research

### The question

Does the ~1.3B-share stage on Oct 22 create a tradeable supply shock in SPCX — and is Oct 22 the date it actually opens?

**One-line verdict:** the stage is real and filing-defined, but its date is conditional on a results release that had not yet happened, and the evidence (prior stages, options, relative size) does not support a position; default call is stand aside.

### Method

- Re-read the 424B4 (11.95 MB, HTTP 200) with `htmlToText` from `scripts/research/lockup-math.mjs`: the "Shares Eligible for Future Sale" table and the lock-up agreement clause (d).
- Yahoo daily bars (SPCX, SPY, ^VIX) fetched 2026-10-20 ~11:20 ET for realized vol, volume and stage-day returns; the 2026-10-20 bar is partial and excluded from every statistic.
- Cboe delayed chain (`cdn.cboe.com`, 2026-10-20 ~11:05 ET, one snapshot, not order-grade) for the short-dated straddles.
- EDGAR submissions feed for the Q2 8-K timestamp (the precedent for how a release maps to a stage date).
- Press for the Q3 schedule (SpaceX IR announcement title and wire coverage). `npm run research:dossier` is symbol-keyed for earnings events and does not apply here.
- The sibling ledger [`spcx-lockup-expiry-2026-12-08`](spcx-lockup-expiry-2026-12-08.md) (same filing, same day) proposed this event; its stage table and six-stage returns are reused where noted and re-checked against the bars.

### Leg 1 — the earliest date it can fire. SUPPORTED as Oct 22, conditional

- Clause (d) of the lock-up agreement: "on or after the second full trading day on Nasdaq immediately following the public release of our quarterly financial results (which for this purpose does not include 'flash' numbers or preliminary, partial earnings) for the quarter ended September 30, 2026, up to an additional 28% of the shares may be Transferred."
- SpaceX scheduled results for Tue Oct 20 after the close with a 3:30 p.m. CT webcast (IR announcement dated Oct 16, per wire coverage; the IR page itself was 403 and the PDF text font-encoded). First full session Wed Oct 21, second **Thu Oct 22**.
- Precedent: the Q2 8-K landed 2026-08-04 16:01 ET (EDGAR) and the first earnings stage opened Aug 6 under the same wording, so the arithmetic has been used once already.
- Why it stays `estimate`: at research time (~11:30 ET Oct 20) the release had not been published. A release slipping past Oct 20's close moves the stage a day; a preliminary-only release would not count under the clause. The flip to `confirmed` is one line, due the moment results are public.
- It is not Dec 8 (the last stage, tracked separately) and not Oct 24/26 (a smaller 328.4M stage; Oct 24 is a Saturday, so first sale session Mon Oct 26).

### Leg 2 — supply. MIXED (largest single stage left, smaller relative to the pool than Aug 6)

| Measure | Value |
|---|---|
| Stage | up to ~1.3B Class A shares (28% of the 180-day cohort) |
| …as % of Class A outstanding (7,380M) | ~17.6% (~9.9% of Class A + B 13,076M) |
| …vs IPO float (555.6M) | ~2.3× |
| …in days of 20-day average volume (81.7M) | ~16 days (60-day ADV 96.4M: ~13.5 days) |
| Tradable pool before it (IPO float + stages through Oct 9, my sum) | ~2.82B → this stage adds ~46% |
| Same measure at the Aug 6 stage | 911.5M on a 555.6M float → +164% |

"Eligible" is an upper bound: the filing excludes affiliates from some stages and Rule 144 volume limits cap insiders' sales. Observed take-up when the cohort sold: 255.2M of 911.5M traded on Aug 6 (28%), 72.7M of 328.4M on Sep 24 (22%). Applying 22–28% to 1.3B gives ~290–365M shares of volume if take-up repeats, against an 81.7M 20-day ADV — large for the stock, though much of it would be the print's volume anyway.

### Leg 3 — price and run-up. MIXED

- IPO $135 (Jun 11); last close $147.96 (Oct 19), **+9.6% over the IPO price**; Nasdaq's quote page put it near $162 on Oct 9, so the stock is −8.7% in the six sessions since the last stage.
- Realized vol 52% over 20 days, 69% over 60. The lock-up literature's larger pullback follows a big run-up from the IPO price; the run-up is now small.

### Leg 4 — stages already traded. REFUTES a reliable pullback

Close-to-close SPCX day returns on the earlier stage days, re-checked against fetched bars: Aug 6 +6.1%, Aug 20 −4.0%, Sep 9 −3.9%, Sep 24 −0.2%, Oct 9 +1.2% (the sibling ledger also counts a Sep 10 affiliates stage, +0.4%). Mean ≈ −0.2%; n is thin and stages of one cohort are not independent events.

The one analogue that also coincided with an earnings print is Aug 4–7. Excess returns vs SPY: Aug 5 (print reaction) −13.4%, Aug 6 (stage day) +6.3%, Aug 7 +15.2%. The two sessions after the print's reaction (Aug 5 close → Aug 7 close) gained +22.9% in raw terms. One observation; it shows the print, not the stage, set the direction. That is the window FT-1 below reads this time, anchored at the Oct 21 close to strip the print reaction out.

### Leg 5 — options. SUPPORTED as "no priced release catalyst"

Cboe delayed, spot 147.52: ATM straddles ~$10.63 (Oct 21 expiry, ~7.2%), ~$12.05 (Oct 23, ~8.2%), ~$14.40 (Oct 30, ~9.8%); ATM IV ~155% / ~108% / ~73%. Backing the straddles out, Oct 22–23 add roughly a 5% one-sigma move for the two sessions, against ~4.6% from 52% realized vol over two days. The market is paying for the print; the release adds about the stock's ordinary two-day vol. Skew and the Oct 22 single-day implied move were not measured.

### What the conditions support

No defined-risk play is supported: short vol sells a premium that is already the print's, a bearish structure has no repeated pullback to ride, and a long structure fights up to 1.3B shares of supply. Default per the lockup playbook (#5912): stand aside until the lockup study says otherwise, never a position on the listing day.

### Honest limits

- The Q3 results are not out as of this writing; every number is pre-print, and the Oct 22 date is an estimate until the release lands.
- The SpaceX IR announcement was read only by title and wire coverage (ir.spacex.com 403, PDF text font-encoded); the filing is the only primary read in full.
- Cboe quotes are delayed, a single mid-morning snapshot.
- Nasdaq-100 membership since 2026-07-07 contaminates QQQ as a benchmark; SPY is used.
- Tesla's Q3 date and other peer prints were not checked this pass; the mandatory adjacency sweep begins with the next pulse.
- Insider selling is unobservable until Form 4 / 144 filings.

## Stance & kill switches

**Stance (estimate date, filing-defined stage; pre-print analysis):** stand aside through the print and the release. Not a short, not a long.

Kill switches (what makes this stance wrong):
1. 2026-10-23 close: SPCX excess return vs SPY from the Oct 21 close to the Oct 23 close ≤ −8% — the stage is trading as a pullback; re-read the Dec 8 stage (up to 797.6M) with more weight.
2. A filed 8-K, waiver or amended lock-up changing the stage's size or date, or a Q3 release landing after Oct 20's close.
3. Oct 22 share volume ≥ 255.2M (Aug 6's) — more selling pressure than the first stage drew (FT-2).
4. 2026-11-20: Nov-20 IV above ~65% with 20-day realized vol falling — the market prices a catalyst this note does not see.

Registered forward tests: `docs/research/forward-tests/spcx-lockup-release-2026-10-22.md` (FT-1, FT-2, score by 2026-10-26).

**Noted beyond this event, not filed:** the 328.4M stage first tradable Mon Oct 26 (same size as the Sep 24 and Oct 9 stages, which moved the stock −0.2% / +1.2%), and the Dec 8 final stage, which has its own ledger. The Q4-results stage (351.9M, extended cohort) and further 2027 stages are past the calendar horizon.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-10-20 | 2 | Initial. Read 424B4 clause (d): 28% (~1.3B sh) opens 2nd full session after Q3 results; Q3 results set for Oct 20 after close (IR, title + wires; page 403) → Oct 22, still estimate (results unpublished at ~11:30 ET). Q2 precedent: 8-K 08-04 16:01 ET → stage 08-06. Stage ≈ +46% of tradable pool (Aug 6 was +164%). Stage days: +6.1/−4.0/−3.9/−0.2/+1.2%. Options: Oct 23 straddle ~8.2% vs Oct 21 ~7.2%, no release premium. SPCX 147.96 (10-19 close), VIX 17.63 (down from 19.99 on 10-16), only strong adjacent in the corridor is the META print 10-28. | — (initial; stand aside) | 2026-10-21 (high:0+, 1d) |

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
