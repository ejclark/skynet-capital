# MSFT earnings print — msft-2026-10-27-print

**Kind:** earnings · **Date:** 2026-10-27 (estimate, 8-K cadence) · **Impact:** critical
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{"MSFT":499.62},"vix":14.53,"daysBand":"critical:21+","adjacentIds":["aapl-2026-10-29-print","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boj-decision-2026-10-30","chicago-pmi-2026-10-30","consumer-confidence-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","meta-2026-10-28-print","pce-2026-10-29","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-5y-tips-2026-10-22","treasury-7y-note-2026-10-29","treasury-buyback-20y30y-2026-10-27","treasury-coupon-announcement-2026-10-22"],"screenStreak":0} -->

## At a glance

**TL;DR.** No MSFT position and no pre-print entry at any horizon — S1 and the D-10 run-up are killed
on this symbol and stay killed. The guards are the whole stance: flat by the Oct-26 close and stay
flat until the date is IR-confirmed. The S3 fade is blocked twice over (the shorting lock, plus a
queue item on hold until the July 2026 reaction session is measured), and this cycle would be a poor
test regardless — the confirmed FOMC statement owns the afternoon of Oct 28. Azure ≥45% cc is the
guided bar; consensus drift above it argues for *more* caution, never an entry. **New on 2026-09-02
(primary, 8-K): this print is Microsoft's first under a two-segment structure, with quarterly Azure
revenue disclosed in dollars for the first time on a narrowed definition** — a disclosure-regime
change stacked on top of the FOMC contamination, which widens the reaction-day distribution and
strengthens the no-hold guard rather than opening anything. Date is an **estimate** (D-51) and every
line inherits that label.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no pre-print play exists | High | S1 and the D-10 run-up are both killed on MSFT; nothing since re-opens them | ≥3 new prints showing a repriced gap regime |
| This week | **No action; don't chase IR yet** | High | Aggregators split 10-27 vs 10-28; MSFT announces by press release ~3 weeks ahead, so silence before ~Oct 6 is uninformative | An IR posting confirming or moving the **2026-10-27** date |
| This month | **Watch the Azure bar, don't trade it — and check which definition it is quoted on** | Medium | The ≥45% cc guide was issued on the old Azure definition; the Oct-27 print reports a narrowed one (recast FY26-Q1 comp **$22,384M**, 40%/39% cc). Drift above the bar is a caution input, not an entry | Consensus settling above 45% cc **on the recast (post-8-K) definition** before ~2026-10-06 |
| This quarter | **Flat by the Oct-26 close (S2); S3 stays on hold** | High | A no-alpha guard needs no edge to justify it; and two independent contaminants now own the reaction window — the Oct-28 FOMC statement, and the first print under the new segment structure | A re-run showing the 2026-07-30 session leg was green, then a second consecutive green October reaction session |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — hold unhedged MSFT exposure through the print; flat by the **2026-10-26** close and stay flat until confirmation narrows the window.
- **Never** — read consensus drift above Azure ≥45% cc as bullish; a higher whisper bar is a caution input.
- **Never** — compare the first standalone Azure dollar print against the ~45% cc guide without checking the definition: the guide is old-basis, the print is recast-basis (GitHub cloud, dev cloud, Security Copilot and healthcare removed).
- **S3 stays on hold** — blocked on the shorting lock, and separately until the July 2026 reaction-session leg is measured from re-run instrument data.
- **Watch (dated)** — IR date confirmation expected ~**2026-10-06** (nothing posted as of 2026-08-31; ~3-weeks-ahead precedent) · estimated print **2026-10-27** · FOMC statement **2026-10-28** 14:00 ET, which owns the D+1 afternoon · ECB **10-29** and BoJ **10-30** decisions in the same corridor · Microsoft Ignite **2026-11-17..20** (estimate), the next MSFT-specific catalyst after the print.
- **Re-keys everything if** — IR confirms any date other than 2026-10-27.

## Initial research

**The question.** MSFT prints fiscal Q1 FY27 in ~10 weeks (date **estimate**). What is likely to
happen, how will the market react, and which house playbooks — if any — does this event license?

**One-line verdict.** Guards only: MSFT is a killed-alpha symbol (S1 and the D-10 run-up are on
the kill list; S3 is blocked and now carries a fresh out-of-sample warning from the July print the
instrument cannot see), and this cycle's reaction window is uniquely contaminated — the estimated
print date sits inside the densest event cluster of the quarter (FOMC decision Oct 28, GOOG/META
est. Oct 28, AMZN/AAPL est. Oct 29).

**Method.** Both instruments re-run fresh 2026-08-17 (cache busted upstream today):
`earnings-cycle.mjs MSFT --bench QQQ --peers GOOG,AMZN,META` (87 prints, 2004-10-21..2026-04-29,
history through 2026-08-14) and `intraday-edges.mjs MSFT` (721 sessions, 2023-09-18..2026-08-14).
Read against the [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) matrix and kill list — the
sweep red-teamed all of this on 2026-08-12; this doc is the event-shaped synthesis plus what
changed since. Sourced web research for the date, consensus, and the July out-of-sample print.

**Instrument integrity caveat (material this cycle).** The sweep's known forward-window-guard
debt applies to MSFT: the study's newest print is **2026-04-29** — it is blind to the
**2026-07-29 FY26-Q4 print**, which was the most dramatic in the modern sample (reported
2026-07-29 AMC; shares +15.5% the next day, the largest one-day market-cap gain on record, per
CNBC/TIKR coverage dated 2026-07-29/30). Every modern-era (2023–26, n=14) cell below therefore
excludes the single largest observation. Numbers are quoted honestly with that hole named, not
repaired here.

**Conviction legs, tested.**

- **"Pre-print positioning pays on MSFT" — REFUTED (kill list, standing).** S1 killed on MSFT in
  the 2026-08-12 sweep; the D-10 run-up is kill-list item 8 (modern net-of-QQQ a literal 7/14
  coin flip; win rate decays 76%→57%→58%→50% by era). Today's fresh run reproduces the surface
  numbers that seduced the original study (D-10 modern win 79%, excess +0.90%) and the same
  controls that killed it: the D-20 window fails the base-rate binomial (P=0.2088, NOT
  significant), and peers run harder over MSFT's own windows (GOOG +6.49%/93% win, AMZN +4.46%,
  META +4.19%) — sector seasonality, not MSFT edge. One new print since the kill (July, unseen by
  the instrument) does not meet the re-proposal bar. No pre-print positioning (date **estimate**).
- **"Never hold the print" (S2) — SUPPORTED, universal.** Fresh run: modern gap win 36%, mean
  +0.19%, p10 −5.33 / p90 +8.18 — a fat-tailed coin flip, exactly the sweep's read. The unseen
  July print (+15.5% next day) is one more fat tail; a tail landing green does not change the
  policy, it *is* the policy's premise. Flat through the print window (date **estimate**, so the
  no-hold window widens to cover Oct 27–29).
- **"Reaction-day fade" (S3, MSFT's strongest sweep result) — MIXED, downgraded from SUPPORTED.**
  Fresh run reproduces the sweep stat: modern fade mean −1.13%, win 7% (1/14 green), pooled
  p=3.4e-4 — still the only alpha clearing the family-corrected bar. **But** the July 2026
  reaction day (+15.5% close-to-close, then +3.02% more on D+2) is out-of-sample and unmeasured:
  the instrument cannot show the open→close leg, and a day that closes +15.5% is at real risk of
  having been a green session — which would be the first break in the post-2024 red streak.
  Unverifiable until the guard is fixed or close-out re-runs with the print in-window; treated as
  a live caution, not a kill. S3 stays **blocked** (shorting locked) regardless — so this costs
  nothing today, but the "deploy small on MSFT when shorting unblocks" queue item should not be
  acted on until the July point is scored. Additionally this cycle: if the print is 10/27 AMC
  (**estimate**), D+1 is **FOMC statement day** (Oct 28, 14:00 ET) — the reaction session would
  be macro-contaminated and a poor test of the fade either way.
- **"S4 / intraday structure" — REFUTED for round-trips, SUPPORTED as execution shape.** Fresh
  intraday run: every timing strategy loses to buy-and-hold net of 5bps (best b/e 2.7bps —
  someone else's infrastructure); kill-list item 9 stands. E1 holds: the 09:30 bar carries 30.2%
  of daily volatility at −0.003% mean return — defer non-urgent entries past the open.
- **"The fundamental bar" — SUPPORTED as context (not a trade).** July print: EPS $4.74 vs $4.33
  est., revenue $90.0B vs $89.4B est., Azure +43% and past $100B annual revenue; management
  guided FY27-Q1 to revenue $89.85–90.95B, EPS ~$4.70 mid, capex ~$50B, and **Azure +45% cc —
  above the ~41.4% StreetAccount consensus** (CNBC 2026-07-29, Investing.com preview). The
  October bar is therefore self-raised: Azure ≥45% cc plus a calm capex narrative is the
  expectation, not the upside case. A stock that just repriced +18% in two sessions on that guide
  has already paid for a chunk of the October beat.

**What the conditions support.** Guards only, sized zero: S2 (flat through the est. Oct 27–29
window), E1 (execution hygiene), and observation — this print is a scoring opportunity for the
S3-fade regime question, not a trade. **Honest limits:** modern cells are n=14 *minus the most
important print*; the date is a cadence estimate with aggregators split 10/27 vs 10/28; one
intraday regime (2023–26 bull); the reaction-week cluster (FOMC + four mega-cap prints in three
days) makes any single-name attribution this cycle suspect.

## Stance & kill switches

**Stance (date is an estimate — every statement below inherits that label).** No position, no
pre-print entry at any horizon: S1 and the D-10 run-up are killed on MSFT and stay killed
(estimate). S2 with the estimate-widened window — any paper MSFT exposure flat by the Oct-26
close and stays flat through Oct 29 until the date is IR-confirmed (estimate). S3 fade remains
blocked on the shorting lock; independent of the lock, the "deploy small when unblocked" queue
item is **on hold** until the July 2026 reaction-session leg is measured — and this cycle's D+1
is a poor test anyway if the print lands 10/27, because the FOMC statement (confirmed,
federalreserve.gov calendar: meeting Oct 27–28, statement 14:00 ET Oct 28) owns that afternoon
(estimate). Fundamental bar: Azure ≥45% cc guided; consensus drift above that raises the whisper
bar and only argues for *more* caution, never an entry (estimate).

**Amended 2026-09-06 — the reporting-regime leg (no directional change; receipt is the D-51 row).**
Microsoft's 2026-09-02 8-K (primary, SEC accession 0001193125-26-380280) moves FY27 to **two**
reportable segments — *Agents and Infra* (Azure, M365 Cloud, Industry solutions) and *Devices and
Consumer* — publishes **quarterly Azure revenue in dollars for the first time**, drops
operating-margin disclosure for the three retired segments, and **narrows Azure's definition**
(GitHub cloud services, developer cloud services, Security Copilot and healthcare/life-sciences
move out). Two consequences for this doc, both cautionary and neither a trade. **First, the bar has
a units problem.** The ~45% cc guide was issued 2026-07-29 on the old definition; the Oct-27 print
reports the new one. On the recast table the change is growth-rate-*neutral* for three of four FY26
quarters (Q1 40%/39% cc, Q2 39%/38% cc, Q3 40%/39% cc — identical to as-reported) and **1pt
unfavourable in the fourth** (Q4 recast 42% vs 43% as-reported). So the drag is 0–1pt, not a
constant, and its one non-zero observation is the most recent quarter — meaning an on-guide quarter
could still print a headline that *reads* as a miss. The "this month" falsifier is restated to name
the recast definition, because as originally written it could not be evaluated. **Second, the
reaction window now carries two independent contaminants**, not one: the FOMC statement on D+1, and
a first-quarter-of-a-new-regime print whose dollar Azure line has no forecasting track record. Both
widen the D+1 distribution, which strengthens S2 and further degrades this cycle as an S3 test
(estimate). No forward test registers this pulse: the natural prediction — how much of any Azure
shortfall is definitional — stops being scoreable the moment the old series is retired, and an
unscoreable registration is worse than none.

**Kill switches.**

- *Date leg:* IR confirmation (microsoft.com/en-us/investor — nothing posted as of 2026-08-17)
  on any date other than 10-27 re-derives every D-count here; aggregators already split
  (TipRanks/Investing 10-27 vs WallStreetHorizon 10-28-unconfirmed), which is exactly why the
  estimate label stays.
- *S3-caution leg:* if the re-run instrument (guard fixed, or close-out) shows the 2026-07-30
  session leg was **red** despite the +15.5% day, the caution downgrade reverses and S3 returns
  to its sweep-strength standing; if it was **green**, that is one streak-break — a second
  consecutive green reaction session (October) kills MSFT S3 pending a new registered study.
- *Definition leg (new 2026-09-06):* if Microsoft restates the FY27-Q1 Azure guide onto the recast
  definition before the print — or if a Q1 recast disclosure shows the wedge is a stable 0pt — the
  units problem above dies and the "this month" row reverts to the plain ≥45% cc bar. If instead
  the wedge widens past ~1pt on any further recast disclosure, the caution hardens.
- *S2/no-position leg:* nothing kills it — it is a no-alpha guard; the only revision path is the
  kill list's own new-evidence bar (≥3 new prints showing a repriced gap regime), which one
  July tail does not meet.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-17 | D-71 | Initial research banked. Instruments fresh but blind to the 2026-07-29 print (event list ends 2026-04-29 — known forward-window-guard debt); July print itself is the headline new info: beat + Azure +45%-cc FY27-Q1 guide → +15.5% D+1, largest one-day cap gain on record — unmeasured out-of-sample stress on the S3 red streak. Date hunt: MSFT IR has no FY27-Q1 date posted; aggregators split 10/27 (TipRanks, Investing.com) vs 10/28 (WallStreetHorizon, unconfirmed) — stays **estimate**. Adjacency: reaction window collides with FOMC Oct 27–28 (statement 14:00 ET 10/28; already in calendar as `fomc-2026-10-28`) and peer prints GOOG/META est. 10/28, AMZN/AAPL est. 10/29 (already in earnings-calendar) — densest cluster of the quarter, no new dated events to propose. Near-term peers: NVDA 8/26 confirmed, MRVL 8/27 confirmed, AVGO announced 9/2 (proposed in the NVDA doc's same-day row). No macro prints since 8/15 (weekend). VIX 14.56 Fri 8/15 (2026 low) but SKEW +6.6% m/m and Brent +6.0%/wk — calm index, rising tail-hedge demand. No MSFT-specific export-control/policy action noted; capex-policy narrative benign since July. | — (stance set) | 2026-08-24 (critical, 61+d band: every 7d) |
| 2026-08-24 | D-64 | Adjacency sweep. Event tape: date split unchanged — TipRanks still labels 10/27 "confirmed" (third-party, not IR-primary), Wall Street Horizon still lists 10/28 "unconfirmed," MarketChameleon still gives an estimate-range 10/28–30; MSFT's own IR still has no FY27-Q1 date posted this session — stays **estimate**, no flip. Peers: NVDA/MRVL both report this week (own docs); AVGO's XPV overhang deepened, MRVL's implied move jumped on its Google deal (own docs) — near-term AI-capex sentiment context, not MSFT-specific. Macro: no CPI/jobs surprise since 8/17; Sep-16 FOMC read is 68.4% hold/31.6% hike as of 8/20 (FOMC sibling doc). Volatility regime: VIX 15.13, calm, no shift. Geopolitical: Brent -1.38% to $93.09 on 8/24, first pause in the two-week escalation (new Iran sanctions pending) — same finding as sibling docs. No new dated adjacency found — the Oct 27–28 FOMC / GOOG-META 10/28 / AMZN-AAPL 10/29 cluster is unchanged. | — (no change; too far out for a substantive stance shift) | 2026-08-31 (critical, 61+d band: every 7d) |
| 2026-08-28 | D-60 | Adjacency sweep (band shortened as days-until crossed the 61-day boundary into the 21-60d/3d cadence). Peers: no mega-cap cloud/software print since 8/24 — GOOG/META (est. 10/28) and AMZN/AAPL (est. 10/29) unchanged. Nearer-term AI-capex read-through: NVDA reported 8/26 AC — beat (rev $96.2B vs ~$93-95B consensus, +106% y/y, no China data-center sales assumed) but only +4-5% AH, below its own ~5-7% priced implied move — a muted reception to a clean beat, relevant to Azure's GPU-supply/demand read but not MSFT-specific data. MRVL reported 8/27 AMC; its own ledger has not yet scored the outcome (event-passed-unscored, pending close-out) — no result to carry here. Macro surprises: GDP 2nd estimate unrevised +1.5%; core PCE +0.2% m/m/3.3% y/y in-line; headline PCE +3.7% y/y ~0.1pt hot (all 2026-08-26, sibling PRs #683/#684) — CNBC's own framing was that this "wasn't enough to shift the balance" for the Sep FOMC; nothing MSFT-specific. Jackson Hole's Warsh keynote lands today (8/28); outcome not yet available within this pulse (sibling doc still open, not yet closed out). Volatility regime: VIX 15.21 (8/26-27 close, per FOMC/jobs sibling docs) vs 15.13 at D-64 — flat, calm 14-16 range holds, no shift. Geopolitical: Brent eased to ~$86-87 (from $93.09 at D-64) on Iran-Oman Hormuz de-escalation talks — the first genuine de-escalation signal in the saga (prior rows logged only a pause); no new MSFT/Azure-specific export-control or supply-chain action found (Jan-2026 chip-export framework unchanged). Event-specific tape: MSFT IR (microsoft.com/en-us/investor) still has no FY27-Q1 date posted this session; TipRanks/WallStreetHorizon/MarketChameleon split unchanged from D-64 — stays **estimate**, no flip; no consensus-drift or implied-move data chased at D-60 (routine far-out pulse, per process guidance — that workup belongs closer to the print). No new dated adjacency found — the Oct 27-29 FOMC/GOOG-META/AMZN-AAPL cluster is unchanged; nothing else surfaced with a date. Genuinely nothing material this pulse beyond the macro/vol/geopolitical drift already logged above. | — (no change; a mildly cooler macro/vol/geopolitical backdrop (in-line PCE, easing Brent) doesn't touch a stance built on kill-listed alpha and universal guards) | 2026-08-31 (critical, 21-60d band: every 3d) |
| 2026-08-31 | D-57 | Adjacency sweep. **This pulse reached a session only because the ledger carried no `probe-ref` block (`no-reference-baseline`) — baseline now set (MSFT 513.53, VIX 14.43, band `critical:21+`), so the next quiet pulse is screenable.** **Event-specific tape — the substantive finding.** MSFT ran **six straight sessions to 8/28, +6.7%**, its longest winning streak of 2026, closing **$513.53** (vs $496.37 on 8/26) *while the indices slid*; the attributed drivers are fading AI-software-disruption fear plus a new **8/27 multi-year HUMAIN (Saudi) agreement** — Azure Foundry + M365 Copilot for Arabic-language models — against the July print's record **$678B** commercial backlog (primexbt/congress.net syndications dated 8/28). Two honest caveats: the same syndications quote a "~+47% off a **$349** June low / +30% in a month" framing that does **not** reconcile with this doc's own price series, so the streak and the close are carried and that framing is not; and the HUMAIN compute leg sits under an export-license regime — the **2026-07-10** rule moved the **UAE** to Country Group A:5 with G42 as an approved end user, and **Saudi got no such rule** (Commerce/MEI coverage), so HUMAIN is still license-gated. Nothing here is revenue-material by the October print; it is sentiment. **The reasoning note this deserves:** a 6.7% run-up into D-57 is precisely the shape the killed D-10 hypothesis would "predict" — it is not evidence reviving it (the kill-list bar is ≥3 new prints showing a repriced gap regime), and it cuts the *other* way on the fundamentals leg: a stock this far into a recovery has pre-paid more of the October beat. **Consensus: no drift above the bar yet.** FY27-Q1 consensus sits on the guide — revenue **$90.4B** mid ($89.85–90.95B), EPS **~$4.70**, **Azure 45% cc** — with FY27 full-year EPS consensus **+1.6% over 30 days to $19.57** (Zacks). The "This month" falsifier (consensus settling above 45% cc before ~2026-10-06) is **not** triggered. **Date leg — new calibration, not a new date.** MSFT IR still lists no FY27-Q1 event (both `/investor/events` and `/events-upcoming` render empty to this lane's fetcher; recorded as no-date-obtainable, not as a fetch success), and the aggregator split is unchanged (TipRanks 10/27 "confirmed" third-party, WallStreetHorizon 10/28 unconfirmed) — stays **estimate**, no flip. New: MSFT's own announcement precedent is a **PR Newswire release ~3 weeks ahead** (FY26-Q2 announced **2026-01-07** for the **2026-01-28** print, per barchart citing the PR) — so IR silence at D-57 carries **no information**, and confirmation should be expected around **2026-10-06**, the same date the month-horizon falsifier already keys on. Chasing IR before then is wasted pulse effort. **Peers:** no mega-cap cloud/software print since 8/24; GOOG/META (est. 10/28) and AMZN/AAPL (est. 10/29) unchanged; AVGO prints 9/2. MRVL is now **scored** (its D+1 close-out): **−7.6% AH on 8/27** on a margin miss, and NVDA's clean 8/26 beat still unwound — so semis wobbled in the same week MSFT ran, a divergence worth naming but not a tradable read here. **Macro:** the 8/28 Warsh keynote is now closed out — Sep hike odds repriced **~35% → 57-59%**, 2y **+8bp**, 10y **4.72%**; Chicago PMI **47.1** vs ~58 consensus the same day and the tape still repriced hawkish (figures carried from the [`jackson-hole`](jackson-hole-2026-08-28.md) close-out, not re-derived). Its durable finding is directly relevant to this doc's D+1 problem: **on this chair a hawkish surprise prices into the front end, not into equity vol** (8/28: near-doubled hike odds, 2y +8bp, VIX at a YTD low). That *mildly* softens how badly the confirmed **10/28 FOMC** contaminates an S3 reaction-day test — but it rests on one observation, carries its own falsifier (a 9/16 FOMC with an S&P move ≥1.5% and the 2y <5bp kills it), and a rate *decision* is not a speech. Logged as context; it changes nothing while S3 is blocked. **Volatility regime:** VIX **14.43** (8/28 close, probe) vs **15.21** at D-60 — **−0.78**, well under the 3-pt threshold, but it is the **lowest close of 2026**; a year-low vol tape eight weeks ahead of a four-print-plus-FOMC corridor is an anomaly to name, not comfort. **Geopolitical:** Hormuz de-escalation holding, Brent **~$86-87**, direction unchanged from D-60; no MSFT/Azure-specific export-control action beyond the Saudi/UAE divergence above. **No new dated adjacency found or proposed** — the Oct 27-29 cluster (`fomc-2026-10-28`, `goog`/`meta` 10/28, `amzn`/`aapl` 10/29, plus `consumer-confidence-2026-10-27`, `pce-2026-10-29`, `gdp-q3-2026-advance-2026-10-29`) is unchanged; the HUMAIN deal carries no future date to file. | — (no change. The stance is built on kill-listed alpha plus universal guards, and nothing this pulse touches either: the run-up is not new-print evidence, consensus has not cleared the Azure bar, and the date is still an **estimate**. Two reasoning notes banked, neither stance-moving: the pre-paid-beat argument is *stronger* after +6.7%, and the FOMC-contamination worry on a future S3 test is *mildly* weaker on one dated observation.) | 2026-09-03 (critical, 21-60d band: every 3d) |
| 2026-09-03 | D-54 | **Deterministic screen (no Claude session).** Readings — MSFT $496.82 (-3.3% since last), VIX 15.2 (+0.8pt since last), band unchanged (critical:21+), 8 adjacent event(s) tracked. Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-09-06 |
| 2026-09-06 | D-51 | Adjacency sweep. **Event-specific tape — the substantive finding, and it is primary-sourced.** Microsoft filed an **8-K on 2026-09-02** (SEC accession 0001193125-26-380280, both the 8-K body and Exhibit 99.1 "FY27 Segments and Investor Metrics" fetched direct today) collapsing three reportable segments into **two — *Agents and Infra* (Azure, M365 Cloud, Industry solutions) and *Devices and Consumer* (Windows, Xbox, advertising)** — effective FY27, i.e. **the 2026-10-27 print is the first report under it**. Three mechanics matter here. (1) **Azure prints in dollars for the first time**, quarterly, with two years recast: FY26 Q1 **$22,384M** (40%, 39% cc) · Q2 **$24,129M** (39%, 38% cc) · Q3 **$26,008M** (40%, 39% cc) · Q4 **$29,417M** (42%) · FY26 **$101,938M** (+40% on FY25's $72,610M). The Oct-27 comp is therefore a published **$22,384M**, not a percentage anyone has to reverse-engineer. (2) **Azure's definition narrowed** — GitHub cloud services, developer cloud services, Security Copilot and healthcare/life-sciences products move out (to M365 commercial cloud). **The wedge is small and not constant, which is the honest read:** recast growth is *identical* to as-reported for Q1/Q2/Q3 (40/39/40 nominal, 39/38/39 cc — MSFT's own FY26 Q1–Q3 IR pages, re-fetched today) and **1pt unfavourable in Q4 (42% recast vs 43% as-reported)** — so a 0–1pt drag whose single non-zero observation is the *most recent* quarter and the one adjacent to the guide. (3) **Segment operating margins for the three retired segments stop being disclosed**, and Microsoft restated only segment-level revenue guidance (Agents and Infra **$75.15–75.75B**, Devices and Consumer **$14.7–15.2B**) while stating total revenue / cost of revenue / opex guidance is **unchanged** — i.e. **the ~45% cc Azure guide was not publicly re-based onto the new definition** (Yahoo Finance 9/3, digitimes 9/3, CNBC 9/2 headline; the CNBC body returned 403 to this lane's fetcher and is carried as a headline only). **Also MSFT-specific:** OpenAI's **GPT-6 Astra** launched and Nadella confirmed Thursday **9/3** that early customers are already running it on Azure ("Excited to see early customers already using Astra on Azure") — sentiment and a distribution proof point, not revenue-material by October. The **$250B incremental Azure commitment / AGI-exclusivity** terms circulating this week are the *prior* partnership restructuring, not news this pulse, and are not counted as new information. **Price:** MSFT **$499.62** (9/4) vs $496.82 at the 9/3 screen and **$513.53** on 8/28 — the six-session streak logged at D-57 broke; −2.7% off that high across the week the 8-K landed. **Peers — a second consecutive "clean beat, sold anyway."** AVGO printed 9/2 AMC: revenue **$29.591B** (+86% y/y) and non-GAAP EPS **$3.32** both beat, the stock fell **−7.76% within the hour**, then bought it all back on the FY27 AI target raise to **~$115B** (plus FY28 ~$230B) and settled AH at **$364.23, −0.82%** (its own close-out doc). Stacked on NVDA's 8/26 beat drawing only +4–5% against a 5–7% implied move, that is two mega-cap AI beats in eight days met with a flat-to-negative tape — direct corroboration of this doc's "pre-paid beat" leg, and a reason the Azure bar being *raised* is a caution rather than a setup. GOOG/META (est. 10/28) and AMZN/AAPL (est. 10/29) unchanged. **Macro — three prints, ~18pts of two-way repricing, zero vol response.** Waller's 9/3 08:30 interview took September hike odds from ~67% to ~50% "in minutes" (*"give disinflation a chance"*); ISM Services the same morning printed **55.4** with **prices paid 72.6**, highest since mid-2022; August payrolls 9/4 printed **+162k vs ~53–55k consensus** with u3 held at **4.1%**, AHE **+0.3% m/m / +3.1% y/y**, and June+July revised **+55k** — the July **−23k** shock revised away to **+21k**. Net: hike odds **~59–60%**, 2y yield the highest since January 2025, SPX **−0.38% to 7,718.60** on 9/4. FOMC blackout began 9/5; Waller made the September vote explicitly conditional on **CPI 9/11**. None of this is MSFT-specific, but a live hike path is the discount-rate channel for a long-duration name and it is running hot into the print corridor. **Volatility regime:** VIX **14.53** (9/4) vs **15.2** at the 9/3 screen — **−0.67**, far inside the 3pt threshold, and the 25th straight session inside 14–17. Eighteen points of hike-odds repricing bought zero vol repricing; a year-low tape seven weeks ahead of a decision-dense print corridor is an anomaly to name, not comfort. **Geopolitical:** the de-escalation logged at D-57 reversed — Brent **~$95.23** on 9/4, roughly **+9% on the week** after an intraday **~$99.38**, on Hormuz throughput disruption; OPEC+ meets Vienna today (9/6), reported likely to hold October output flat. An oil-led inflation impulse feeds PPI 9/10 and CPI 9/11 and therefore the same rate channel above. No new MSFT/Azure export-control action found. **Adjacency — the corridor roughly tripled.** Tracked events within 5 days of 10-27 went **8 → 23** since the last full session: added are the **ECB decision 10/29** and **BoJ decision 10/30**, **ECI Q3 10/30** (the Fed's preferred wage read), Chicago PMI 10/30, durable goods 10/27, advance economic indicators 10/28, two ECB data releases 10/27, and five Treasury supply/buyback/announcement events (10/22–10/29). The print now sits inside a window carrying **three central-bank decisions, four mega-cap peers, ECI and PCE**. The "densest cluster of the quarter" claim from the initial research is not just intact — it understated it. **One dated adjacency PROPOSED this PR:** **Microsoft Ignite 2026, 2026-11-17..20, Moscone Center San Francisco** — filed as `msft-ignite-2026-11-17.json`, **estimate**, `EST:` (the venue's own event page quotes "November 17–20 \| Moscone Center \| San Francisco, CA, USA" and registration-open coverage corroborates, but `ignite.microsoft.com/en-US/home` rendered no date text to this lane's fetcher, so no primary flip). It is the next MSFT-specific catalyst after the print. **One dated adjacency found and NOT filed:** Oracle's Q1 FY27 print lands **2026-09-10 AMC** (investor.oracle.com release dated 9/2, surfaced by the [`fomc-blackout`](fomc-blackout-start-2026-09-05.md) doc) — a same-week AI-capex read-through for Azure, but `kind: "earnings"` derives from `earnings-calendar.ts`, which this lane's hard limits forbid editing; carried here and routed, not filed. **Date leg — unchanged.** TipRanks still labels 10/27 "confirmed" (third-party, not IR-primary), Wall Street Horizon still 10/28 "unconfirmed"; MSFT IR still posts no FY27-Q1 date, which at D-51 carries **no information** given the ~3-weeks-ahead PR precedent (expect ~2026-10-06). Stays **estimate**. **Consensus:** revenue $89.85–90.95B, EPS ~$4.70, Azure ~45% cc — the guide, restated unchanged by the 8-K at the total-company level; the "this month" falsifier is **not** triggered. | **No directional change — one falsifier made measurable, one supporting leg added.** The calls are untouched: stand aside, S2 flat through the estimate-widened Oct 27–29 window, S3 blocked. But the "this month" falsifier as written ("consensus settling above 45% cc") could no longer be evaluated once the reported Azure definition changed, so it is restated to name the **recast** definition — a falsifier that cannot be checked is not a falsifier. And the "this quarter" row now rests on **two** independent reaction-window contaminants (FOMC D+1; first print under a new segment/disclosure regime) rather than one. Nothing here opens a position: the definitional wedge, if real, biases the *headline* Azure number downward against the bar everyone memorised, which is a caution input in exactly the direction the stance already leans. See the Stance section's amendment for the full reasoning. | 2026-09-09 (critical, 21-60d band: every 3d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
