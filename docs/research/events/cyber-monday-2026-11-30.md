# Cyber Monday 2026 — US e-commerce peak day (collides with AWS re:Invent day 1) — cyber-monday-2026-11-30

**Kind:** sector · **Date:** 2026-11-30 (estimate — `EST:` statute + weekday arithmetic, corroborated by this repo's own Thanksgiving closures and three aggregators; the `estimate` label is a taxonomy gap, not doubt about the date) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{"AMZN":256.97},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["adp-employment-2026-12-02","advance-economic-indicators-2026-11-27","aws-reinvent-2026","beige-book-2026-11-25","chicago-pmi-2026-11-30","construction-spending-2026-12-01","dallas-fed-mfg-2026-11-30","dallas-fed-tssos-2026-12-01","durable-goods-2026-11-25","fomc-blackout-start-2026-11-28","gdp-q3-2026-second-2026-11-25","georgia-senate-runoff-2026-12-01","ism-manufacturing-2026-12-01","ism-services-2026-12-03","japan-cpi-tokyo-flash-2026-11-27","jgb-40y-auction-2026-11-25","jgb-liquidity-enhancement-5-11y-2026-11-27","jobs-2026-12-04","jolts-2026-12-01","m3-full-report-2026-12-03","new-home-sales-2026-11-25","pce-2026-11-25","pjm-reliability-backstop-results-2026-12-02","russell-recon-lockdown-2026-11-30","russell-style-month-end-capping-effective-2026-11-30","sifma-bond-early-close-2026-11-27","sp-rebalance-proforma-2026-12-04","thanksgiving-half-day-2026-11-27","thanksgiving-market-closure-2026-11-26","treasury-7y-note-2026-11-25"],"screenStreak":0,"blocked":[{"url":"https://nationaldaycalendar.com/celebrations/cyber-monday-monday-after-thanksgiving","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on AMZN — Cyber Monday is not an AMZN event, and now that is measured
rather than assumed.** Across 26 Cyber Mondays of adjusted closes, AMZN's edge over SPY on the
session is noise in the modern era (2013+: **+0.31pp mean, 7/13 up**), and the Adobe-recap session
after it is a coin flip (**11/26 up, binomial p=0.56**) — which is just as well, since Adobe moved
that recap a full trading session between 2024 (pre-market) and 2025 (post-close). What *is* real is
a **relative-value spread we cannot trade**: AMZN beats the retail ETF XRT by **+1.35pp on the Cyber
Monday session, 16/20 up, t=3.40**, beta-adjusted and placebo-controlled — pre-registered as
`FT-cyber-monday-2026-11-30-1`, never deployed, because it needs a short leg this book does not have
and its raw p=0.012 does not clear the house's family-corrected bar. The one decision-grade output
for a sibling lane: the confound `FT-aws-reinvent-2026-1` names is **small but load-bearing** — AMZN
has cleared +2.0pp over that exact seasonal window in only **2 of the last 13 years**, so a "pass"
there is mostly a seasonal base rate, not evidence for the amplifier thesis. Date is `estimate`, so
it may only widen caution.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/9) | **Stand aside** | High | D-82. Nothing about a marketing convention is tradable today; the live AMZN calendar is macro (**CPI 2026-09-11**, **FOMC 2026-09-16**) then the est. **2026-10-29** print. | Nothing at D-82. The next AMZN inputs are **2026-09-16** (FOMC) and est. **2026-10-29** (print), in that order |
| This week (9/9–9/11) | **Stand aside** | High | No proximity, and no dated Cyber Monday artifact exists yet — Adobe has published no 2026-season forecast as of **2026-09-09** (the 2025 one landed **2025-10-06**). | An Adobe 2026-season holiday forecast published inside 9/9–9/11 that guides online spend **below** 2025's +6.8% actual |
| This month (through ~10/9) | **Stand aside** | High | The only thing due in the window is Adobe's 2026-season forecast (est. early Oct off the **2025-10-06** precedent) — a vendor projection, not a print, and S1 is killed on AMZN (p=0.6854). | Adobe's 2026-season forecast landing with a y/y guide **outside ±3pp of 2025's +6.8%**, which would make the season itself a narrative input rather than background |
| This quarter (through ~12/9) | **Watch (no position)** | Medium | The session enters the window and carries two AMZN narratives at once (re:Invent day 1 + peak retail). The measured spread is AMZN-over-XRT, not AMZN-over-index — and it is unshortable here. | **AMZN − SPY ≥ +2.0pp on the 2026-11-30 session** — that would break the 2013+ finding (mean +0.31pp, 7/13) and make Cyber Monday an outright AMZN catalyst rather than a pair |

**Signals & conditions** — the buy/sell/hold triggers:

- **No entry at any horizon.** S1 is killed on AMZN (p=0.6854, `multi-symbol-sweep.md`); an `estimate` date licenses nothing.
- **Do not trade the Adobe recap.** Its publication time moved a full session between 2024 (09:00 ET) and 2025 (17:00 ET) — there is no reliable session to express it in.
- **Watch, do not deploy:** AMZN-minus-XRT on the 2026-11-30 session (`FT-cyber-monday-2026-11-30-1`). Zero capital; scored 2026-12-08.
- **Hand-off to the re:Invent lane:** treat a `FT-aws-reinvent-2026-1` pass as weak — only 2/13 recent years cleared +2.0pp over that window anyway.
- **Guard only:** any paper AMZN exposure stays S2 (flat across the est. 2026-10-29 print) + E1 (defer the open). This event adds no instrument.
- **Kill for the whole watch:** a capex-guide-down or "digestion" language at the est. **2026-10-29** print de-risks the sleeve and makes this session background noise.

## Initial research

### The question, plainly

2026-11-30 is Cyber Monday *and* AWS re:Invent day 1 — the one session where AMZN's retail and cloud
narratives collide. Does the retail half carry any measurable edge of its own, and how much of the
combined session is actually attributable to Cyber Monday rather than the keynote?

### One-line verdict

**Cyber Monday is a sector rotation, not an AMZN catalyst** — AMZN's index-relative edge on the
session is noise in the modern era, but AMZN's edge over the *retail sector* is large, old and
placebo-controlled; since that spread needs a short leg this book cannot take, the event's deployable
output is zero and its decision-grade output is a correction handed to the sibling re:Invent lane.

### Method

Sourced web research for the date and the season's expectations (primary over aggregator per
[`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)), plus an event study run today against
split/dividend-adjusted daily closes from `scripts/research/market-data.mjs` with the instrument
cache busted first (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`).
Cyber Monday dates were generated from statute — fourth Thursday of November (5 U.S.C. 6103) plus
four days — for **2000–2025**, giving **n=26** for AMZN/SPY/QQQ and **n=20** for XRT (whose history
starts 2006). Every session return is close-to-close on the adjusted series. Read against the house
playbooks and the kill list in [`multi-symbol-sweep.md`](../multi-symbol-sweep.md).

### Legs tested

**1. "Cyber Monday 2026 is Monday 2026-11-30."** SUPPORTED, and one aggregator is wrong. November
2026 opens on a Sunday, so its Thursdays are the 5th/12th/19th/26th; the fourth is **2026-11-26** and
the Monday after is **2026-11-30**. This repo corroborates the anchor without circularity — it
already tracks `thanksgiving-market-closure-2026-11-26` (full closure) and
`thanksgiving-half-day-2026-11-27` (13:00 ET early close), neither of which exists unless Thanksgiving
is the 26th. `awarenessdays.com`, `calendardate.com` and `wikidates.org` all print 30 November 2026
(searched 2026-09-09). A `nationaldaycalendar.com` search-result title reads *"CYBER MONDAY -
December 1, 2026"* — **2026-12-01 is a Tuesday**, which the site's own stated rule cannot produce; a
direct fetch returned **HTTP 403** (recorded in `probe-ref.blocked`), so the discrepancy could not be
run down at source and the arithmetic stands as the ruling.

**2. "AMZN outperforms on Cyber Monday."** REFUTED for the modern era. All 26 years the session looks
strong (AMZN−SPY mean **+1.97pp**, 18/26 up), but that is an artifact: **2001 alone contributed
+34.26pp** in the dot-com-bust tape. Ex-2001 the mean falls to **+0.68pp** (17/25, t=1.69,
binomial p≈0.11 uncorrected). Split by era it dissolves — **2013+: +0.31pp mean, 7/13 up, t=0.68.**
The 2018+ subsample looks better (+1.05pp, 6/8, t=2.23) but n=8 and 2018's +3.66pp is a market-wide
bounce off the November-2018 selloff. Against an AMZN−SPY daily base rate of **49.4% up / +0.048pp
per day since 2013**, there is nothing here.

**3. "The Adobe recap moves AMZN the next session."** REFUTED, twice over. Statistically the next
session is a coin flip and if anything negative: **AMZN−SPY mean −0.71pp, 11/26 up (42.3%),
binomial p=0.56**; 2013+ it is −0.22pp and 2018+ it is −0.01pp. Mechanically it could not be traded
even if it were real, because Adobe does not publish the recap at a fixed time: the **2025** recap
went out **2025-12-02 at 17:00 ET** — after the cash close, making it a CM+2 input — while the
**2024** recap went out **2024-12-03 at 09:00 ET**, pre-market and therefore a CM+1 input. A one-session
ambiguity in the artifact's arrival destroys any single-session read.

**4. "Cyber Monday is good for retail."** REFUTED — it is the opposite, and this is the leg that
turned into the finding. **XRT falls on the Cyber Monday session in 15 of 20 years** (mean −1.10%,
median −0.93%), and against SPY it is **−0.52pp mean, 6/20 up (30%), t=−2.69, binomial p=0.041**,
robust to dropping the 2008 outlier (−0.48pp, t=−2.41). The natural pair follows: **AMZN − XRT on
the Cyber Monday session runs +1.35pp mean / +1.27pp median, 16/20 up (80%), t=3.40**, binomial
p=0.012. It survives every control run:

| Control | Result |
|---|---|
| Drop 2008 (the −10.15% XRT crash session) | +1.16pp, 15/19, t=3.16 |
| 2013+ only | +0.74pp, 10/13, t=2.17 |
| 2018+ only | +1.22pp, 7/8, t=3.03 |
| Beta-adjusted residual (AMZN−XRT regressed on SPY, β=0.102 over n=5,083 sessions) | **+1.34pp, 16/20, t=3.27** |
| Base rate (all AMZN−XRT sessions) | 50.7% up, +0.076pp/day |
| Placebo — all Mondays | −0.066pp, 449/954 up (47.1%) |
| Placebo — the Monday five sessions earlier | −0.35pp, 9/20 up |

The mechanism is plausible (the single largest online day is a share-shift day, and XRT is
equal-weight and bricks-and-mortar-heavy) — but plausibility is not evidence, and the number is what
carries this.

**5. "The Cyber Monday confound materially threatens `FT-aws-reinvent-2026-1`."** MIXED, and the
resolution is useful in both directions. That forward test predicts **AMZN − QQQ ≤ +2.0pp over the
2026-11-27 → 2026-12-04 closes**, and names Cyber Monday as its asymmetric confound. Measuring the
exact seasonal analogue — Black-Friday close to the following Friday's close, AMZN vs QQQ, 2000–2025
— gives median **−0.82pp**, and the threshold was cleared in only **7/26 years (27%)**, falling to
**2/13 (15%) since 2013** and 2/8 since 2018. So: Cyber Monday does **not** inflate AMZN through that
window, which is good news for the test's *validity* — but it means the prediction already carries a
**73–85% seasonal prior** before any keynote reasoning, so a pass is much weaker evidence for
"amplifier, not source" than the registration implies. That is stated here rather than edited into
the sibling lane's file, which this lane never touches.

**6. Season expectations, and a correction.** The proposal that created this id attributed a
*"2026 season forecast crossed $250B online, +5.3% y/y"* to Adobe. That is Adobe's **2025**-season
forecast — **$253.4B, +5.3% y/y** for Nov 1 – Dec 31 2025, published **2025-10-06** — and the 2025
season actually printed **$257.8B, +6.8% y/y**, i.e. the forecast was beaten. **Adobe has published
no 2026-season forecast as of 2026-09-09.** Cyber Monday 2025 itself printed **$14.25B, +7.1% y/y**,
inside Cyber Week's **$44.2B, +7.7%** (Adobe, 2025-12-02). NRF's Nov–Dec 2026 holiday forecast is
also unpublished today; its full-year 2026 view is **+4.4% to $5.6T**. The season is therefore
*expected up and unremarkable* — which is precisely the condition under which a peak-day print is
background rather than catalyst.

### What the conditions support

Nothing directional, at any horizon. The one measured effect is a long-AMZN / short-XRT session
pair, and **shorting is blocked in this book** (`multi-symbol-sweep.md` — the S3 family sits inert
for the same reason), so it is registered as a zero-capital forward test and nothing else. For paper
AMZN exposure the deployable set is unchanged from the [Oct-29 print ledger](amzn-2026-10-29-print.md):
S2 flat across the estimated print, E1 defer the open. This event adds no instrument of its own.

### Honest limits

- **n=20 for the XRT pair, and ~12 tests were run this session.** Raw p=0.012 is nowhere near this
  house's ~0.001 family-corrected bar. Registration, not promotion — promotion needs the pre-stated
  count of out-of-sample observations.
- **XRT is not in the event's `symbols`.** That field is the tracked-name roster (AAPL AMZN AVGO CRWV
  GOOG META MRVL MSFT — no ETFs), so the deterministic screen will not watch XRT for this event.
  Widening the calendar's symbol vocabulary is a calendar-wide decision and not a research lane's to
  take unilaterally; the next session should read the XRT leg by hand.
- **2026-11-30 is confounded by construction.** re:Invent day 1, month-end, `chicago-pmi-2026-11-30`,
  `russell-recon-lockdown-2026-11-30` and the Russell style-capping effective date all land on it.
  No single-session study can separate them ex ante; the historical n=26 average over them is the
  best available answer and it is an average, not this year's.
- **A convention, not a release.** No `IR:`/`CENSUS:`-class primary publishes a Cyber Monday date,
  which is why the entry stays `estimate` even though the arithmetic is not in doubt.
- **Adobe measures online spend, not AMZN revenue.** Nothing here reads through to a company number;
  AMZN's holiday quarter is priced at its Q4 print, not on 2026-11-30.

## Stance & kill switches

**Stance (date `estimate`; the arithmetic is certain, the taxonomy is the gap — so caution may widen
and nothing may be entered).** Watch-only, no position, no play proposed. Base case: 2026-11-30 runs
as a strong-but-expected e-commerce peak day inside an up-and-unremarkable season, contributing a
**sector rotation** (AMZN over bricks-and-mortar retail) rather than an index-relative AMZN move.
The session's AMZN tape will be dominated by the re:Invent narrative and by month-end/index mechanics
rather than by Cyber Monday, and the Adobe recap that measures the day is not a tradable artifact.

**Kill switches.**

- **The "not an AMZN catalyst" read** dies if **AMZN − SPY ≥ +2.0pp on the 2026-11-30 session** —
  that clears anything the 2013+ sample (mean +0.31pp, 7/13) supports and makes the day an outright
  catalyst. It would still not license a pre-event entry (S1 killed, p=0.6854).
- **The AMZN-over-XRT spread** dies on `FT-cyber-monday-2026-11-30-1` scoring a kill (AMZN − XRT
  ≤ 0 on the 2026-11-30 session), which would be the 5th miss in 21 observations and break the
  2018+ run (7/8).
- **The "season is background" read** dies if Adobe's 2026-season forecast (est. early Oct) guides
  online spend **outside ±3pp of 2025's +6.8% actual** in either direction — a genuinely weak or
  genuinely blowout season is a macro-consumer input, not background.
- **The whole watch de-risks** if the est. **2026-10-29** AMZN print guides capex down or uses
  "digestion" language — the sleeve-wide tripwire from
  [`ai-energy-constraint.md`](../ai-energy-constraint.md), owned upstream by the
  [print ledger](amzn-2026-10-29-print.md).
- **Re-opening any AMZN directional hypothesis** needs the sweep's ≥3-new-print bar. A calendar
  convention does not meet it and never will.

**Registered forward test.** `FT-cyber-monday-2026-11-30-1` — the AMZN-over-XRT session spread,
score-by **2026-12-08**, in [`forward-tests/cyber-monday-2026-11-30.md`](../forward-tests/cyber-monday-2026-11-30.md).
Zero capital by design; it exists to generate out-of-sample n, not to be traded.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-82 | **Initial research banked (above); canonical `src/domain/market-events/cyber-monday-2026-11-30.json` written from the single proposal `.from-aws-reinvent-2026` (now inert).** *Date:* 2026-11-30 by statute + arithmetic (4th Thursday = 11-26), corroborated by this repo's own 11-26/11-27 closures and three aggregators; `nationaldaycalendar.com`'s "December 1, 2026" is a Tuesday and its page 403'd (logged in `probe-ref.blocked`). Stays `estimate` — no primary publishes a marketing convention. *Event study, 26 Cyber Mondays, adjusted closes, cache busted:* **no AMZN edge** (2013+ AMZN−SPY +0.31pp, 7/13; all-years +1.97pp is 2001's +34pp outlier), **no recap edge** (next session 11/26 up, p=0.56 — and Adobe moved the recap from 09:00 ET pre-market in 2024 to 17:00 ET post-close in 2025). **The finding is a pair:** AMZN−XRT on the session **+1.35pp, 16/20, t=3.40**; β-adjusted residual +1.34pp (t=3.27); placebos flat (all Mondays 47.1% up; the Monday 5 sessions earlier 9/20); base rate 50.7%/+0.076pp. Unshortable here → registered as **FT-cyber-monday-2026-11-30-1**, not deployed. **For the sibling lane:** `FT-aws-reinvent-2026-1`'s +2.0pp threshold was cleared in only **7/26 years (2/13 since 2013)** over the identical seasonal window — the Cyber Monday confound is small, but the test now reads as ~73–85% seasonal prior. **Correction to the proposal:** Adobe's "$253.4B/+5.3%" is the **2025**-season forecast (published 2025-10-06; actual $257.8B/+6.8%); no 2026-season forecast exists as of today. **Adjacency** — *peer prints:* none for a convention; AMZN's own est. **2026-10-29** print is the upstream catalyst. *Macro:* Sept-hike odds ~59–60% after Jackson Hole (08-28) and the 09-04 jobs print (+162k vs +55k); CPI 09-11 and FOMC 09-16 are the live AMZN inputs. *VIX:* **15.72** (09-08 close), low regime. *Geopolitical:* no new AMZN-specific tariff/export action bearing on consumer e-commerce. *Event tape:* AMZN **256.97** (09-08), −3.3% vs QQQ +0.3% since 08-19; XRT 85.70. **No new dated adjacency proposed** — Black Friday (already `thanksgiving-half-day-2026-11-27`), Adobe's 2026 forecast (cadence only, no primary date), the Adobe recap (the measurement of this event, unstable time), Census Q4-2026 e-commerce (release PDF unparseable) and Green Monday 2026-12-14 all considered and declined, recorded in the event file's notes. | — (stance set) | 2026-09-30 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-cyber-monday-2026-11-30.json` (`status: "estimate"`) in
the same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc goes
quiet.
