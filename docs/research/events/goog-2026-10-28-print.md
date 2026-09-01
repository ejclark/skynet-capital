# GOOG earnings print — goog-2026-10-28-print

**Kind:** earnings · **Date:** 2026-10-28 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-09-01
<!-- probe-ref: {"symbols":{"GOOG":335.41},"vix":14.92,"daysBand":"critical:21+","adjacentIds":["aapl-2026-10-29-print","amzn-2026-10-29-print","consumer-confidence-2026-10-27","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","ism-manufacturing-2026-11-02","meta-2026-10-28-print","msft-2026-10-27-print","pce-2026-10-29","sloos-2026-11-02","treasury-borrowing-estimates-2026-11-02"],"screenStreak":0} -->

## At a glance

**TL;DR.** GOOG is the one name on the roster with a *planned* pre-print play — and it is not open,
and cannot open while the date is an **estimate**. IR confirmation is the unlock; without it there is
no entry, full stop. **The clock is now real: the ~D-20 entry point is ~27 days out (2026-09-28), and
Alphabet IR still has no Q3 date posted.** If it confirms, the run-up hold is small (the pooled
−3.39% p10 is the sizing anchor), exits at the close of D, and never rides through the print. **Four**
overhangs could sour the window itself: the pending ad-tech remedies ruling, capex/equity supply, an AI
talent-flight narrative, and — logged here for the first time — an **FTC consumer-protection probe of
YouTube in the final stages of preparing a lawsuit**. Separately, the corridor around the estimated
print day has densified from 5 tracked events to **11**, and a 2026-10-01 funding lapse would run most
of the run-up window data-dark. Everything below inherits the estimate label.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — D-60 is outside the window and the date is unconfirmed | High | The run-up entry point is ~D-20; an estimated date never keys an entry at any distance | IR confirms the date, moving the ~**2026-09-28** entry point into play |
| This week | **No action; watch abc.xyz/investor** | High | Aggregators still split 10-27 vs 10-28, which is exactly why the label stays estimate | An IR posting that confirms or moves the **2026-10-28** date |
| This month | **Prepare the run-up, don't pre-empt it — ~27 days of confirmation runway left** | Medium | Entry is only live if confirmation lands before the ~D-20 point; no confirmation, no cycle | No IR-confirmed date by ~**2026-09-28** — the play dies for this cycle |
| This quarter | **Flat by the Oct-26 close (S2); exit at D's close if long** | High | Never hold through the print; and if any other pre-print long is live, GOOG takes the slot alone — stacking is one leveraged AI-beta bet | A mid-window break below the pooled −3.39% p10 stops the position out |

**Signals & conditions** — the buy/sell/hold triggers:

- **No confirmation, no entry** — the single hard gate on this play; date-keyed action requires `confirmed`.
- **Size small, one slot** — the pooled p10 **−3.39%** is the sizing anchor, and GOOG takes the pre-print slot alone or not at all.
- **Exit at the close of D** — never through the print, whatever the run-up did.
- **Discretionary early exit** — an adverse ad-tech remedies ruling, an FTC YouTube suit being filed, a fresh equity-supply event, or a further senior-AI-talent exit landing inside the window; logged when taken.
- **Watch (dated)** — IR confirmation (nothing posted as of 2026-09-01) · entry point ~**2026-09-28** · FY2027 funding deadline **2026-09-30**, one day into the window · FOMC **2026-10-28** on the estimated print day itself.

## Initial research

**The question.** Alphabet prints Q3 2026 in ~10 weeks (date **estimate**). What is likely to
happen, how will the market react, and which house playbooks — if any — does this event license?

**One-line verdict.** This is the roster's one live directional candidate — GOOG's pre-print
run-up hold (long close D-20 → close of D) is the sole sweep survivor and today's fresh run still
passes its base-rate control — but the entry stays gated on IR date confirmation, sized small,
never stacked with peers, and this cycle carries two new hazards the instrument cannot see: a
July print that *fell on a beat* (capex), and an estimated print date that lands on FOMC
statement day.

**Method.** Both instruments run fresh 2026-08-17 (cache busted upstream today):
`earnings-cycle.mjs GOOG --bench QQQ --peers MSFT,META,AMZN` (43 prints,
2015-10-22..2026-04-29, history through 2026-08-14) and `intraday-edges.mjs GOOG` (721 sessions,
2023-09-18..2026-08-14). Read against the [`multi-symbol-sweep.md`](../multi-symbol-sweep.md)
matrix and kill list — the sweep red-teamed all of this on 2026-08-12; this doc is the
event-shaped synthesis plus what changed since. Sourced web research for the date, the July
out-of-sample print, and the regulatory tape.

**Instrument integrity caveat (material this cycle).** The sweep's known forward-window-guard
debt applies to GOOG: the study's newest print is **2026-04-29** — it is blind to the
**2026-07-22 Q2 print** (CNBC live coverage dated 2026-07-22; IR transcript filed under
`doc_events/2026/Jul/22`). That print is the modern sample's most important stress case: revenue
$119.8B (+24%), Cloud +82%, EPS beat — and the stock *fell* (~3.65% after hours per Investing.com
recap) on a 2026 capex guide raised to $195–205B and negative Q2 free cash flow (−$5.9B). Every
modern-era (2023–26, n=14) cell below excludes it. Numbers are quoted honestly with that hole
named, not repaired here.

**Conviction legs, tested.**

- **"GOOG pre-print run-up pays" (the sweep's lone surviving long) — SUPPORTED, with sharpened
  caveats.** Fresh run: D-20 → D modern era n=14 mean +7.77%, win 93%, excess vs QQQ +5.31%;
  pooled 43 prints mean +4.99%, win 86%, p10 −3.39%. The base-rate control still passes:
  P(13/14 positive | the era's own 65% every-20d base) = 0.0191 → SURVIVES, matching the sweep's
  2026-08-12 read (pooled p=0.0008, degrading to 0.003–0.012 under overlapping-window
  uncertainty — evidence AT the corrected bar, not past it). The attribution caveat also
  reproduces: peers run hard over GOOG's own windows (META +6.81%/79% win, AMZN +5.81%/79%,
  MSFT +3.14%) — a large share is mega-cap earnings-season seasonality, so this is **never
  stacked** with any other pre-print long. New this cycle, unseen by the instrument: the July
  capex-punished reaction and the ~$84.75B equity raise (Simply Wall St / tradingkey coverage,
  Aug 2026 — largest US equity raise on record; stock ~−11% over the past month into ~$345).
  A month-long supply/capex overhang is exactly the regime in which a seasonality-heavy run-up
  can fail; it does not kill the leg (the kill list's bar is unmet), it argues for the sweep's
  own instruction: deploy **small**, sized to the pooled −3.39% p10.
- **"Never hold the print" (S2) — SUPPORTED, universal.** Fresh run: gap modern win 57%, mean
  +0.67%, p10 −7.03 / p90 +6.89 — a fat-tailed coin flip. The unseen July print (beat → fell on
  capex) is one more demonstration that the overnight verdict is not predictable from the
  fundamentals. The run-up hold's exit at the **close of D** is designed around exactly this.
  Flat through the print (date **estimate**, so the no-hold window widens to cover Oct 27–29).
- **"Reaction-day fade" (S3) — SUPPORTED as a measurement, blocked as a trade.** Fresh run
  reproduces the sweep: modern fade mean −0.59%, win 29% (pooled win 30%, sweep p=0.0014 — at
  the family-corrected line, behind MSFT). Shorting is locked, so this stays observation-only.
  This cycle's D+1 is additionally a poor test: if the print lands 10/28 (**estimate**), day D
  itself is **FOMC statement day** (confirmed, federalreserve.gov calendar: meeting Oct 27–28,
  statement 14:00 ET — already in this calendar as `fomc-2026-10-28`) and D+1 carries AMZN/AAPL
  est. prints — any reaction move is contaminated in both directions.
- **"S4 / intraday structure" — REFUTED for round-trips, SUPPORTED as execution shape.** Fresh
  intraday run: every timing strategy loses to buy-and-hold net of 5bps (best b/e 4.6bps);
  kill-list item 9 stands — S4 was outright value-destroying on GOOG. E1 holds *as a cost rule
  only*: the 09:30 bar carries 30.0% of daily volatility, **but** on GOOG the first hour carries
  most of the return (+0.081%/bar, 58.1 of the 67.0 total session points) — the sweep's explicit
  caveat that E1 on GOOG is never a systematic skip-the-open, just don't pay the open's spread
  for a non-urgent entry.
- **"The fundamental bar" — SUPPORTED as context (not a trade).** The July print self-raised the
  bar: 24% revenue growth and 82% Cloud growth *was not enough* against a $195–205B capex guide
  and negative FCF. October's likely fight is the same one — Cloud acceleration vs. the capex /
  equity-supply narrative — now with the DOJ ad-tech **remedies ruling still pending** from Judge
  Brinkema (closing arguments were 2025-11-21; Digiday/AdExchanger coverage confirms no ruling as
  of Aug 2026; no date → not a calendar event, but it can land any day, including inside the
  D-20 window). The search-case final judgment (Dec 2025, behavioral remedies) is the settled
  half.

**What the conditions support.** One small conditional long plus guards: the GOOG D-20 run-up
hold (entry ~close of D-20, ≈ late Sep, exit close of D) — **licensed only after the date is
IR-confirmed** per the date policy, sized small per the sweep, never stacked with other pre-print
longs; S2 flat through the estimate-widened Oct 27–29 window; E1 as execution hygiene. **Honest
limits:** modern cells are n=14 *minus the July print*; the date is a cadence estimate with
aggregators split 10/27 vs 10/28; one intraday regime (2023–26 bull); the run-up's attribution
is part sector seasonality; and this cycle's event week (FOMC + four mega-cap prints in three
days) makes single-name reads suspect.

## Stance & kill switches

**Stance (date is an estimate — every statement below inherits that label).** The pre-print
run-up hold is the *planned* play, not an open one: no entry today (D-72 is outside the window
and the date is unconfirmed), and no date-keyed entry ever occurs while the date stays
**estimate** — IR confirmation is the unlock, small size (pooled p10 −3.39% is the sizing
anchor), exit at the close of D, never through the print (estimate). If the date confirms and
other pre-print longs are live anywhere on the roster, GOOG takes the slot alone or not at all —
stacking is one leveraged AI-beta bet (estimate). S2 with the estimate-widened window: any paper
GOOG exposure flat by the Oct-26 close, flat through Oct 29 until confirmation narrows it
(estimate). S3 fade stays blocked on the shorting lock and this cycle would be a contaminated
test regardless (FOMC on est. day D, AMZN/AAPL on D+1) (estimate). The capex/equity-supply
overhang and the pending ad-tech remedies ruling are the two watch items that could sour the
run-up window itself (estimate).

**Watch-list amendment 2026-08-29 (receipt: the D-60 ledger row below) — not a stance change.** The
call is unchanged (no entry without IR confirmation), but the overhang list widens from two to
**three**. The third is an **AI talent-flight narrative**, which this doc had never logged: Jeff
Dean's departure announced **2026-08-05** (chief scientist, 27 years, leaving with Sanjay Ghemawat,
Oriol Vinyals and Quoc Le to co-found Discovery Loop; Demis Hassabis simultaneously stepping down as
DeepMind CEO), which took the stock **~4%** lower — on top of the late-June Shazeer/Jumper exits
that cost ~7%. Both dates predate this doc's last two rows, so they are recorded as **previously
unlogged, not as new information**. It matters to the run-up leg specifically because it is a third
*narrative* channel the earnings-cycle instrument cannot see, in the same family as the capex and
equity-supply overhangs the D-72 row already named — and the run-up thesis has never been tested
against any of them (estimate).

**Watch-list amendment 2026-09-01 (receipt: the D-57 ledger row below) — not a stance change.** The
call is unchanged (no entry without IR confirmation). Two additions. **(1) A fourth overhang: the FTC's
consumer-protection probe of YouTube**, reported by Bloomberg **2026-08-27** as being in the *final
stages of preparing a potential lawsuit* over whether YouTube misled users about its content policies
when suspending their accounts — a probe running since 2025, with no charge filed and no date, so it is
tracked here like the DOJ ad-tech matter rather than on the calendar. It joins the ad-tech ruling, the
capex/equity-supply overhang and the talent-flight narrative; all four are undated tail risks that can
land *inside* the run-up window, and none is visible to the earnings-cycle instrument (estimate).
**(2) The corridor around estimated day D has densified from 5 tracked events to 11** — six macro
entries filed by sibling research since the last row now sit within ±5 days of 2026-10-28. This does
not touch the entry gate or the exit rule (the hold is flat by D's close regardless), but it does two
things honestly worth stating: it moves the S3-fade contamination point from *contaminated* to
*unattributable* (GDP **and** PCE both 08:30 on D+1, alongside the AMZN/AAPL estimated prints), and it
puts **government-funding-deadline-2026-09-30** one day inside the run-up window — a 10-01 lapse would
delete `jobs-2026-10-02` and `cpi-2026-10-14` on 2025 precedent, running most of D-20→D **data-dark on
federal prints**. That is a regime with no analogue in the 43-print sample the run-up leg was measured
on; it widens the honest limits, and it is not a kill (estimate).

**Kill switches.**

- *Date leg:* IR confirmation (abc.xyz/investor — nothing posted as of 2026-08-17) on any date
  other than 10-28 re-derives every D-count here; aggregators already split (TipRanks 10-27 vs
  WallStreetHorizon 10-28-unconfirmed), which is exactly why the estimate label stays.
- *Run-up leg:* dies for this cycle without an IR-confirmed date before the D-20 entry point
  (~Sep 28, estimate) — no confirmation, no entry, full stop. Dies structurally per the sweep's
  own terms if the window fails its base-rate control on fresh prints (the close-out re-run is
  observation #1); an adverse ad-tech remedies ruling or a fresh equity-supply event landing
  inside the window is a discretionary early-exit trigger, logged when taken, and a mid-window
  break below the pooled p10 (−3.39% from entry) is the sizing stop.
- *S2/no-hold leg:* nothing kills it — it is a no-alpha guard; the only revision path is the
  kill list's new-evidence bar (≥3 new prints showing a repriced gap regime).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-72 | Initial research banked. Instruments fresh but blind to the 2026-07-22 Q2 print (event list ends 2026-04-29 — known forward-window-guard debt); that print is the headline new info: big beat (rev $119.8B +24%, Cloud +82%) yet fell ~3.65% AH on the capex raise to $195–205B and negative FCF — plus the ~$84.75B equity raise and a ~−11% month into ~$345, an overhang the run-up thesis has never been tested against. Run-up control still SURVIVES on fresh data (13/14, P=0.0191). Date hunt: Alphabet IR has no Q3 date posted; aggregators split 10/27 (TipRanks) vs 10/28 (WallStreetHorizon, unconfirmed) — stays **estimate**. Adjacency: est. day D collides with the FOMC statement (confirmed, 14:00 ET 10/28, already in calendar as `fomc-2026-10-28`); peer prints MSFT est. 10/27, META est. 10/28, AMZN/AAPL est. 10/29 already in earnings-calendar; near-term NVDA 8/26 confirmed, MRVL 8/27, AVGO 9/2 (proposed in the NVDA doc's 8/17 row) — no new dated events to propose. DOJ ad-tech remedies ruling still pending, undated (Brinkema; closings 2025-11-21) — tail risk inside the run-up window, tracked here not on the calendar. No macro prints since 8/15 (weekend). VIX 14.56 Fri 8/15 (2026 low) but SKEW +6.6% m/m and Brent +6.0%/wk — calm index, rising tail-hedge demand. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-65 | Adjacency sweep. Event tape: date split unchanged (TipRanks "confirmed" 10/27 vs Wall Street Horizon "unconfirmed" 10/28) — Alphabet IR still has no Q3 date posted, stays **estimate**. DOJ ad-tech remedies ruling **still pending** — checked SEC 10-Q filings (Q1/Q2 2026) and press, no ruling issued since the September 2025 remedy hearings; tail risk stays undated and untracked on the calendar, as before. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened (own doc). Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found. | — (no change; too far out, DOJ ruling remains the live undated tail risk) | 2026-08-31 (critical, 61+d band: every 7d) |
| 2026-08-29 | D-60 | Adjacency sweep; band shortened as days-until crossed into the 21–60d/3d cadence. **Event tape — date split unchanged, and the confirmation clock is now the story.** TipRanks lists GOOG/GOOGL 2026-10-27 AMC "confirmed"; Wall Street Horizon still shows 2026-10-28 AMC **unconfirmed** (both checked today) — and **Alphabet IR's events page still lists no Q3 2026 earnings call** (abc.xyz/investor/events, fetched today). An aggregator's "confirmed" label is not an IR posting, so the status stays **estimate** per house policy. What changed is the runway, not the facts: the ~D-20 entry point (~**2026-09-28**) is now **~30 days out**, so the "no IR-confirmed date by ~9/28 kills the play for this cycle" falsifier is inside a month for the first time. **Two GOOG-specific overhangs logged here for the first time — both predate the last row, so they are *previously unlogged*, not new.** (1) **Jeff Dean's departure, announced 2026-08-05** (CNBC/Qz/seroundtable): chief scientist leaving after 27 years to co-found Discovery Loop with Sanjay Ghemawat, Oriol Vinyals and Quoc Le, while Demis Hassabis steps down as DeepMind CEO to become Alphabet chief scientist and Koray Kavukcuoglu takes Gemini; **stock fell ~4%** on the announcement, following the late-June Shazeer-to-OpenAI / Jumper-to-Anthropic exits that cost ~7%. Alphabet is a founding investor and cloud partner in the new venture. (2) **French publishers' antitrust complaint filed 2026-08-11** with the Autorité de la concurrence by APIG (~300 publishers) over AI Overviews / AI Mode, launched in France 2026-07-22 — alleged 33–38% publisher traffic loss; Google was previously fined €750M combined (2021, 2024) over publisher negotiations. Undated as to outcome, so it is tracked here like the DOJ matter, not on the calendar. **DOJ ad-tech remedies: still no ruling.** Re-checked today — the remedies phase and closing arguments remain the newest coverage found (AdExchanger, Digiday, TechPolicy.Press); no Brinkema decision has issued. Unchanged from 8/24, still the live undated tail risk inside the run-up window. **Price:** GOOG closed **$342.37** on 8/28 (`event-material-scan` probe reads **$342.88** — small source divergence, not reconciled), against a 52-week high of **$404.47** — **~15% off the high**, deeper than the "~−11% over the past month into ~$345" logged at D-72, but essentially flat versus that level, so the drawdown is *stable, not extending*. **Macro:** Warsh's 2026-08-28 Jackson Hole keynote repriced September hike odds **35.5% → 59.5%** (CME FedWatch, CNBC/mishtalk) and produced a first ~50% October read (single source; full detail in the sibling [`fomc-2026-10-28`](fomc-2026-10-28.md) row filed today). **This slightly *reduces* the D-day contamination attributed to the Fed:** 8/28 was a clean natural experiment showing this chair's hawkish surprises price into the front end (2y +~8bp) rather than equity vol (S&P −0.13%/−0.25%, VIX 14.43 at a 2026 low). It does **not** touch the S2/no-hold rule or the S3-contamination point — both rest on the print itself and on the AMZN/AAPL est. prints at D+1, not on the statement. Chicago PMI collapsed to **47.1** (Aug data, 8/28) vs ~58 consensus and was ignored. **Peers:** NVDA beat 8/26 (rev $96.2B, EPS $2.22, +106% y/y) on only ~+4–5% AH; MRVL beat 8/27 and fell **~7.6% AH** on Q3 margin compression; semis gave back on 8/28 (NVDA −3.40%). Mega-cap cluster unchanged — MSFT est. 10/27, META est. 10/28, AMZN/AAPL est. 10/29, all still **estimate**. **Volatility regime:** VIX **14.43** (8/28 close, probe) vs 15.13 at the 8/24 row — calm, drifting to the year's low; for a run-up entry still ~30 days away, cheap vol is a note, not a trigger. **Geopolitical:** Brent below **$87** on a fourth straight down session after an Iran–Oman Hormuz agreement Tehran says does not reopen the strait; no GOOG-specific export-control or tariff action found. **No new dated adjacency to propose.** Probe-ref block added (this doc had none, which is why the pulse could not be screened). | — (no change to the call; the overhang watch list widens from two to three with the previously-unlogged talent-flight narrative, and the confirmation deadline is now ~30 days out) | 2026-09-01 (critical, 21–60d band: every 3d) |
| 2026-09-01 | D-57 | Adjacency sweep. **Why this pulse got a session, and the row's headline: the corridor densified.** `event-material-scan` returned `material` on six `new-adjacent-event` reasons — six calendar entries filed by sibling research since the last row now sit within ±5 days of est. day D: `consumer-confidence-2026-10-27` (est), `gdp-q3-2026-advance-2026-10-29` (**confirmed**), `pce-2026-10-29` (**confirmed**), `ism-manufacturing-2026-11-02` (est), `sloos-2026-11-02` (**confirmed**), `treasury-borrowing-estimates-2026-11-02` (**confirmed**). With `fomc-2026-10-28` (confirmed) and the four est. mega-cap prints, the corridor goes **5 → 11 tracked events**. None of it touches the entry gate or the exit rule, but two consequences are honest: S3-fade contamination moves from *contaminated* to **unattributable** (GDP *and* PCE both 08:30 on D+1, next to AMZN/AAPL est. prints), and `government-funding-deadline-2026-09-30` sits **one day inside** the run-up window — a 10-01 lapse deletes `jobs-2026-10-02` and `cpi-2026-10-14` (2025 precedent), running most of D-20→D data-dark on federal prints, a regime with no analogue in the 43-print sample. **Event tape — date unchanged, runway ~27 days.** Alphabet IR's events page still lists **no Q3 2026 earnings call** (abc.xyz/investor/events, fetched today); Wall Street Horizon still reads verbatim "GOOGL's next earnings date is UNCONFIRMED for Wednesday 10/28/2026 After Market" (fetched today); TipRanks still lists 10/27 AMC "confirmed". An aggregator label is not an IR posting — stays **estimate**. **A fourth overhang, new: the FTC's consumer-protection probe of YouTube.** Bloomberg 2026-08-27 (corroborated Detroit News 8/28, Insurance Journal 8/31, Benzinga): the FTC has probed YouTube since last year over whether it misled users about content policies when suspending accounts, and is in the **final stages of preparing a potential lawsuit**; no charge filed, no date, so tracked here like the DOJ matter, not on the calendar. Related coverage of the same 8/31 session (FXLeaders; Simply Wall St 8/30) adds two items the instrument cannot see: **YouTube's AI-related creator revenue pushed out to ~2029**, and **Gemini 3.5 Pro launch delays**. That coverage quotes 2026 capex at **$175–185B** against the **$195–205B** July guide logged at D-72 — a source divergence, flagged, not reconciled, and not relied on. **DOJ ad-tech remedies: still no ruling** (re-checked; AdExchanger/TechPolicy.Press closing-argument coverage remains newest). Separately noted, not new: the DOJ has cross-appealed Mehta's search remedy to the D.C. Circuit seeking Chrome divestiture, argument expected "late 2026 or early 2027" — undated, so not proposable. **Price:** GOOG **$335.41** (probe, today) vs $342.37/$342.88 at D-60 — **~−2.2%**, inside the 5% screen threshold; ~17% below the $404.47 52-week high, so the drawdown is now *extending slightly*, not merely stable. 8/31 was a **−2.40%** session to $334.65 on the YouTube/AI-delay tape. **Macro:** the Warsh repricing extended a fourth straight step — Sep hike odds **60.4%** (CNBC 8/31) to **66%** (Forbes 8/31) vs 59.5% at D-60; 10y ~**4.716%**. Rising real yields are discount-rate pressure on the longest-duration mega-cap over exactly the run-up window — a note against the leg, never a trigger. **Volatility:** VIX **14.92** (8/31, +3.39%) vs 14.43 — +0.49pt, inside the 3-pt threshold, still near the 2026 low; a run-up entry ~27 days out still faces cheap vol. **Geopolitical — the 8/29 de-escalation reversed.** US forces struck Iranian launchers preparing to mine Hormuz on 8/30; Iran retaliated against the UAE and Jordan, the first exchange in ~a month. Brent **$90.69** (+2.93%) on 8/31 after trading below $87 at the last row — oil-led inflation firmness feeds the same hawkish channel above. No GOOG-specific export-control or tariff action found. **Peers:** no mega-cap print since the last row (AVGO 9/2, own doc); August gains MSFT +9%, NVDA +7%, MU +14%. Mega-cap dates unchanged and all still **estimate** (MSFT 10/27, META 10/28, AMZN/AAPL 10/29). **AAPL leadership handover completed today** — John Ternus succeeded Tim Cook as CEO effective **2026-09-01** (announced 2026-04-20, Apple newsroom), so AAPL's est. 10/29 print is a new CEO's first earnings call; this *adds* to the D+1 contamination already logged rather than reducing it. **No new dated adjacency to propose** — all six corridor entries are already tracked, and the FTC / ad-tech / appeal items are undated. Probe-ref refreshed. | — (no change to the call; the overhang watch list widens from three to four with the FTC YouTube probe, and the corridor around est. day D densifies 5 → 11 tracked events) | 2026-09-04 (critical, 21–60d band: every 3d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
