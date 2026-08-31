# CoreWeave Fully Connected 2026 (Moscone South, SF) — crwv-fully-connected-2026-09-29

**Kind:** product-launch · **Date:** 2026-09-29 (confirmed, IR: coreweave.com/fully-connected-2026 — Sep 29–Oct 1, Moscone South, 747 Howard St SF; corroborated by the venue operator's own calendar, moscone.com/events/coreweave-fully-connected-2026, both fetched 2026-08-31) · **Impact:** medium
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{"CRWV":84.23},"vix":14.43,"daysBand":"medium:8+","adjacentIds":["chicago-pmi-2026-09-30","consumer-confidence-2026-09-29","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","ism-manufacturing-2026-10-01","jobs-2026-10-02","jolts-2026-09-29","pce-2026-09-30","treasury-7y-note-2026-09-24","trump-xi-summit-2026-09-24"],"screenStreak":0} -->

## At a glance

**TL;DR.** The date is now **primary-verified and flipped estimate→confirmed in this PR** —
CoreWeave's own site and the Moscone venue calendar both state **Sep 29–Oct 1, 2026, Moscone
South** (both fetched 2026-08-31). Two facts change how the event should be watched. First, the
**keynote is Day 2 — Wed Sep 30, 10:00–11:30 ET** (Intrator/Salanki/Goldberg + NVIDIA's Ian Buck +
Fei-Fei Li), not the Sep 29 point-date the calendar keys on. Second, that keynote day is the single
most macro-loaded session of the quarter's corridor: **PCE (confirmed) + GDP 3rd estimate
(confirmed) + the FY27 government-funding deadline (estimate) + Chicago PMI**, with MU's print and
two confirmed macro prints on Day 1 and ISM Manufacturing/jobs on Days 3–4. So even if the
conference moved CRWV, **we could not attribute the move** — and that, not the agenda, is the
finding. On substance this is a customer/developer conference (3 tracks, 30+ breakouts, 2,000+
attendees, BattleBots and a concert), the **first CoreWeave-branded edition** of a conference brand
it inherited with the Weights & Biases acquisition — so there is **no CoreWeave-hosted precedent to
event-study at all**. No CRWV playbook survives (S1 killed); the deployable set is the universal
guards, and confirming the date licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (8/31) | Stand aside · E1 | High | 29 days out, no CRWV catalyst in the session; today's re-run puts 34.6% of CRWV's daily volatility in the 09:30 hour at −0.159% mean return. | A dated CRWV-specific catalyst inside the session — none exists before **2026-09-29** |
| This week (8/31–9/4) | Stand aside; watch the rate channel | High | CRWV is this calendar's most rate-sensitive name (−12.1% on the 08-18 auction day); AVGO **09-02**, ISM services **09-03** and jobs **09-04** set the front end that prices a debt-funded capex story. | The front end repricing ≥8bp across **09-02/09-04** with CRWV *not* following — the rate-duration read weakens |
| This month (through ~9/30) | Watch the keynote, do not position | Medium | The news-bearing session is **09-30**, not the 09-29 point-date — and it is buried under PCE + GDP + the funding deadline, so the window is attribution-hostile by construction (confirmed date; the corridor mixes confirmed and estimate entries). | CoreWeave pre-announcing conference content via an 8-K/PR **before 2026-09-29**, which would move the news out of the confounded window and make the event separately readable |
| This quarter (through ~11/30) | Watch; guards only (S2 · E1) | Medium | The conference sits **D-41 to D-39** ahead of the est. Nov 9–16 Q3 print window — the only company-controlled venue before it, but the guide lands at the print, so this reads as a narrative amplifier, not the source (the house prior from [aws-reinvent-2026](aws-reinvent-2026.md)). | The est. **2026-11-10** print (honest window Nov 9–16) repricing the name regardless of what the keynote says — or a keynote announcement large enough to move the revenue curve, which would kill the amplifier read |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal exists** — S1 pre-print positioning is kill-listed on CRWV and today's re-run agrees (P=0.6626; NVDA +6.13%/75% and AMZN +3.08% rally over CRWV's *own* pre-print windows).
- **Watch (thesis, not trade):** the **09-30 keynote** for capacity/next-gen-silicon content — the agenda's "Run AI workloads on NVIDIA Vera Rubin NVL72" session and Ian Buck's keynote slot are the NVIDIA-partnership channel; a *financing* or capex disclosure is the negative-surprise vector, not the positive one.
- **Guard only:** any paper CRWV exposure is **S2** (flat through the est. Nov 9–16 print window — the real overnight risk) + **E1** (defer the open); the conference carries no overnight-gap instrument of its own.
- **Caution/kill:** no pre-conference long (no measured reaction function exists — n=0 CoreWeave-hosted editions); no reading of any 09-29..10-02 CRWV move as conference-driven while PCE/GDP/the funding deadline/ISM/jobs sit inside it.
- **Confirming the date licenses nothing here** — the date policy's `confirmed` gate is necessary for date-keyed action, never sufficient, and no CRWV play clears the playbook bar.

## Initial research

### The question, plainly

CoreWeave hosts Fully Connected 2026 in San Francisco in late September, ~6 weeks before its
estimated Q3 print. Is the date real, is a company-controlled conference a repricing venue for
CRWV, and does anything in the house playbooks license a position around it?

### One-line verdict

The date **verifies against two primaries** and is flipped `confirmed` here — but the event is an
**unstudiable narrative venue**: zero CoreWeave-hosted precedent, no published instrument, a
keynote day (09-30, not the 09-29 point-date) buried under four macro releases plus a funding
deadline, and no surviving CRWV playbook — so the honest output is a dated watch-item and two
guards, not a trade.

### Method

Sourced primary research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) for the
date/agenda legs (company site + venue-operator calendar fetched directly, aggregators used only
for corroboration), plus both symbol instruments re-run today with the cache busted 2026-08-31:
`earnings-cycle.mjs CRWV --bench QQQ --peers NVDA,MSFT,AMZN` and `intraday-edges.mjs CRWV` (351
hourly sessions). Read against the kill list in [`multi-symbol-sweep.md`](../multi-symbol-sweep.md)
and the sibling [`crwv-2026-11-10-print`](crwv-2026-11-10-print.md) ledger, whose D-71 row
discovered and proposed this event. The base rate registered below was computed this session from
Yahoo adjusted daily bars, not quoted.

### Conviction legs, tested

1. **"Fully Connected 2026 is Sep 29–Oct 1 at Moscone South" — SUPPORTED, primary-verified,
   flipped to `confirmed`.** coreweave.com/fully-connected-2026 (fetched 2026-08-31) states
   **"September 29–October 1, 2026"** at **"Moscone South, 747 Howard Street, San Francisco, CA
   94103"**; the venue operator's own calendar, moscone.com/events/coreweave-fully-connected-2026
   (same fetch date), independently lists **"September 29 – October 1, 2026"** at **"Moscone Center
   | San Francisco, CA, USA"**. That is a company primary plus an independent operator
   corroboration — the `IR:` bar in `market-events-data.ts`'s source-prefix contract. The entry was
   filed `estimate` on 08-31 purely because this lane never self-confirms an event in the PR that
   *discovers* it; that constraint does not bind a separate research pass with a second source, and
   the precedent is [aws-reinvent-2026](aws-reinvent-2026.md), which flipped on exactly this
   evidence. Flip executed in this PR. It changes no stance: `confirmed` is necessary for date-keyed
   action, never sufficient.
2. **"The Sep 29 point-date is when the news lands" — REFUTED, and this is the operationally
   useful finding.** The published agenda (coreweave.com/fully-connected-2026/agenda, fetched
   2026-08-31) puts the **Opening Keynote on Wednesday, September 30, 10:00–11:30** and a **Main
   Stage session Thursday, October 1, 10:00–11:30**. Day 1 (09-29) is the arrival/expo day whose
   headline item is a **BattleBots** event; the concert is Wed 09-30 and the closing reception Thu
   10-01. The calendar row correctly keys on the first day of the window (house convention), but any
   future window measurement must center **09-30**, not 09-29.
3. **"A CoreWeave conference has a reaction function we can measure" — REFUTED; n=0.** "Fully
   Connected" is **Weights & Biases'** conference brand, which CoreWeave acquired with W&B — the
   deal was announced 2025-03-04 and **completed 2025-05-05** for ~$1.7B (investors.coreweave.com
   PR / PRNewswire 2025-05-05). W&B ran **FC 2025 on June 17–18, 2025**; the 2026 edition is the
   first **CoreWeave-branded, CoreWeave-hosted** one. So there is no prior instance of the event
   this calendar is actually tracking. The one pseudo-precedent is unusable: over the June-2025 W&B
   dates CRWV went **158.50 (06-16) → 171.93 (06-17, +8.5%) → 170.00 (06-18)** and on to **183.58
   (06-20)** — **+15.8%** from 06-16 while QQQ went **534.29 → 526.83, −1.4%**. That is n=1, three
   months after the March-2025 IPO, inside CoreWeave's post-IPO re-rating and its own M&A news
   flow, on a *subsidiary's developer conference held six weeks after the acquisition closed* — not
   a CoreWeave capital-markets venue. It is an anecdote about June 2025, not a conference effect.
4. **"The corridor lets us attribute a conference move" — REFUTED, decisively.** The tracked
   events inside ±3 days of this one: **09-29** `jolts-2026-09-29` (confirmed) and
   `consumer-confidence-2026-09-29` (confirmed), plus MU's **09-29** print (see
   [mu-2026-09-29-print](mu-2026-09-29-print.md)); **09-30 — the keynote day** `pce-2026-09-30`
   (confirmed, high), `gdp-q2-2026-third-2026-09-30` (confirmed),
   `government-funding-deadline-2026-09-30` (estimate, high) and `chicago-pmi-2026-09-30`
   (estimate); **10-01** `ism-manufacturing-2026-10-01` (estimate, high); **10-02**
   `jobs-2026-10-02` (confirmed, high). Five days earlier sits `trump-xi-summit-2026-09-24`
   (estimate, high). A conference keynote sharing a session with PCE, the GDP third estimate and a
   possible federal funding lapse cannot be isolated by any measurement this repo has. The forward
   test below is registered *with* that confound as an explicit void clause, which is the only
   honest way to register it at all.
5. **S1 pre-print positioning — REFUTED, unchanged** (kill list, sweep 2026-08-12). Today's fresh
   run: D-5→D is +8.14%/75% win, but the base-rate control gives **P(2/4 | own base rate) =
   0.6626 — not significant**, D-30→D excess is **−18.48%** against a +27.52% non-earnings
   baseline, and the peer control is decisive: **NVDA +6.13%/75% win** and **AMZN +3.08%** rally
   over CRWV's *own* pre-print windows. AI-beta on n=4, not a CRWV edge. No re-proposal; the kill
   list's new-evidence bar is unmet.
6. **E1 defer the open — SUPPORTED, freshly measured.** 351 hourly sessions: the 09:30 hour carries
   **34.6% of daily volatility** and **29.4% of daily range** at **−0.159% mean return, 45% win**;
   at 5-minute resolution the 09:30 half-hour runs **2.48× the day-average range** (n=60, sanity
   check only). Cost rule for any non-urgent entry, conference week or not.
7. **S4 overnight carry — still gated, and not about this event.** Fresh run: overnight-only
   Sharpe **1.89** vs buy-and-hold **1.07**, break-even **28.1 bps/side** — comfortably above the
   sweep's measured ~13.4 bps kill line, but the gate is unchanged (MOC/MOO execution + measured
   slippage instrumentation, the blocked queue for Eric). It excludes print nights by construction
   and says nothing about conference nights.
8. **The tape and the expectation set — MIXED, and the tape is hostile.** CRWV closed **$84.23**
   on 08-28, down from **$106.00** on 08-17 — the entire Q2 pop retraced and below the pre-print
   level. VIX **14.43** (08-28), a 2026 low. Sell-side is far above the tape: 38-analyst consensus
   **~$144.46** (stockanalysis, NEWS-grade, checked 2026-08-31), Goldman **$139** (Neutral, 08-21),
   Oppenheimer **$150** Outperform; aggregators also carry a Truist **$165 Buy** upgrade whose
   dating the sibling ledger could not verify — it stays NEWS-grade and unverified here too. No
   published implied move exists for a conference (there is no instrument), and **no analyst
   commentary found this session frames Fully Connected as a catalyst** — the watched items are all
   print-keyed (margin ramp on newly activated power capacity, the ~25% price increase flowing
   through H2, the ~$104B backlog). The macro backdrop is the unfriendly half: Warsh's 08-28
   Jackson Hole keynote flipped September to **hike-modal (~56–57%)**, which is the exact channel
   that took this name down 12.1% on the 08-18 auction day.

### What the conditions support

Nothing directional. The deployable set is the universal pair — **S2** (flat through the est.
Nov 9–16 print window) and **E1** (no open-auction entries) — neither of which this event changes.
The event's real output is three pieces of housekeeping that make the next sessions cheaper: the
date is now `confirmed`, the measurement window is re-centered on **09-30**, and the corridor's
confound is written down before the window opens rather than discovered inside it.

### Honest limits

n=0 CoreWeave-hosted editions — there is no reaction function, and the June-2025 pseudo-precedent
is a confounded anecdote from a different owner's conference. Earnings cells are n=4 ending
**2026-05-07** and still blind to the 08-11 print (the `toEvents` follow-through guard admits it
~**2026-09-16**). One intraday regime (IPO-era 2025–26). Consensus, price-target and
implied-move figures are press-reported (NEWS-grade), not exchange-derived by us. Agenda content is
a published schedule, not a disclosure — what actually gets announced on 09-30 is unknowable today,
and the corridor means it may be unmeasurable afterward.

## Stance & kill switches

**Stance (event date: `confirmed` as of this PR — two primaries, 2026-08-31; the est. Nov 9–16 Q3
print window it precedes remains an `estimate`).** Watch-only. No position, no play proposed. Base
case: Fully Connected runs Sep 29–Oct 1 as a customer/developer conference whose keynote (Wed
**09-30**) is a narrative amplifier for the AI-cloud story the Q3 print will actually price — the
same amplifier-not-source structure the [aws-reinvent-2026](aws-reinvent-2026.md) ledger established
for a vendor conference, here with the additional handicap that the keynote shares a session with
PCE, the GDP third estimate and a possible funding lapse.

- **No pre-conference or pre-print directional entry** (print window estimate; conference date
  confirmed) — S1 is killed on CRWV and today's re-run fails its own base-rate (P=0.6626) and peer
  controls. *Killed by:* only the kill list's stated bar — new prints with clean controls; no
  September setup can meet it.
- **No conference-window position of any kind** (confirmed) — there is no measured reaction
  function to size against (n=0 CoreWeave-hosted editions), and the window is attribution-hostile.
  *Killed by:* CoreWeave moving material content out of the confounded window — a pre-announcing
  8-K/PR before 09-29 — which would make the event separately readable; that reopens measurement,
  not a position.
- **Guards only for any paper CRWV exposure: S2 flat through the honest Nov 9–16 print window, E1
  defer the open** (print window estimate) — unchanged from the sibling print ledger, restated here
  because this event does not alter them. *Killed by:* the kill-list bar (≥3 new prints showing a
  repriced gap regime) for S2; nothing for E1, which claims no edge.
- **No reading of a 09-29..10-02 CRWV move as conference-driven** (confirmed) — PCE, GDP-3rd, the
  funding deadline, Chicago PMI, ISM Manufacturing and jobs are all inside or adjacent to the
  window, and CRWV is this calendar's most rate-sensitive name. *Killed by:* nothing available to
  us — this is a refusal to attribute, not a view, and it is what FT-25's void clause encodes.
- **The amplifier-not-source read** (print window estimate) dies if the 09-30 keynote carries a
  disclosure large enough to move the revenue or capex curve — a named, sized capacity or customer
  commitment rather than product content. That would make the conference a standalone catalyst for
  *next* year's edition; it would still not license a pre-event entry, since the edge would be
  unmeasured.

Registered this session: **FT-25** in [`forward-tests.md`](../forward-tests.md) — the conference
window's excess-vs-QQQ test, with its base rate measured today and its macro-corridor void clause
stated up front.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-29 | Initial research banked. **Date primary-verified → `estimate`→`confirmed` executed in this PR:** coreweave.com/fully-connected-2026 states "September 29–October 1, 2026", "Moscone South, 747 Howard Street, San Francisco, CA 94103"; moscone.com's own event calendar independently lists the same window (both fetched 08-31) — company primary + venue-operator corroboration meets the `IR:` bar; the 08-31 `estimate` filing was only this lane's no-self-confirm rule in the discovering PR. **Agenda finding (re-centers the window):** Opening Keynote **Wed 09-30 10:00–11:30**, Main Stage Thu 10-01 10:00–11:30 (Intrator/Salanki/Goldberg + NVIDIA's Ian Buck + Fei-Fei Li); Day 1 09-29 is expo/BattleBots — the news-bearing session is **09-30**, not the 09-29 point-date. 3 tracks, 30+ breakouts, 8 labs, 2,000+ attendees; "Run AI workloads on NVIDIA Vera Rubin NVL72" is the product-announcement-shaped session. **n=0 precedent:** "Fully Connected" is W&B's brand, acquired with W&B (announced 2025-03-04, **completed 2025-05-05**, ~$1.7B — investors.coreweave.com/PRNewswire); W&B ran FC 2025 on 06-17/18 2025 and this is the first CoreWeave-hosted edition — the June-2025 pseudo-precedent (CRWV 158.50 06-16 → 171.93 06-17 → 183.58 06-20, **+15.8%** vs QQQ **−1.4%**) is a confounded post-IPO-era anecdote, not a reaction function. **Instruments re-run, cache busted 08-31:** earnings-cycle still n=4 ending 2026-05-07 (08-11 print enters ~09-16) — S1 fails controls (D-5→D +8.14%/75% but P=**0.6626**, D-30→D excess **−18.48%** vs a +27.52% baseline; peers NVDA +6.13%/75%, AMZN +3.08% rally the same windows); intraday-edges 351 sessions — 09:30 hour **34.6%** of daily vol at **−0.159%**/45% win, 09:30 half-hour 2.48×, overnight-only Sharpe 1.89 vs B&H 1.07 at **28.1 bps** b/e (S4 gate unchanged). **Adjacency** — *peer prints:* AVGO 09-02 next, MU **09-29** on Day 1; NVDA 08-26 and MRVL 08-27 both beat and both sold, the regime read that matters. *Macro:* Warsh's 08-28 Jackson Hole keynote flipped Sept to **hike-modal ~56–57%** (2y +8bp, 10Y ~4.72%), Chicago PMI 47.1 vs ~58 consensus, PCE 08-26 in line — the least friendly mix for a debt-funded capex story. *VIX:* **14.43** (08-28) vs 14.51 prior session, 2026 low, no regime shift. *Geopolitical:* Brent ~$88–90, export-control/tariff regime unchanged, nothing new touching GPU supply; `trump-xi-summit-2026-09-24` (estimate) sits 5 days before Day 1. *Event tape:* no published implied move (no conference instrument) and **no analyst commentary found framing FC as a catalyst** — watched items are print-keyed (margin ramp on activated power capacity, ~25% price increase flowing through H2, ~$104B backlog); CRWV **$84.23** (08-28) vs $106.00 on 08-17, the whole Q2 pop retraced, against a 38-analyst consensus ~$144.46 / GS $139 / Oppenheimer $150 (all NEWS-grade; the aggregator-dated Truist $165 stays unverified per the sibling ledger's correction). **Corridor confound recorded before the window opens:** keynote day 09-30 carries PCE (confirmed) + GDP-3rd (confirmed) + the funding deadline (estimate) + Chicago PMI, with JOLTS/consumer-confidence on 09-29 and ISM Manufacturing 10-01 / jobs 10-02 after — no conference move is attributable. **FT-25 registered** (excess-vs-QQQ test, base rate measured today: 252 overlapping 3-session windows 2025-08-25..2026-08-28, \|excess\| median 6.51%, p75 11.47%, **p90 16.02%**, p95 19.39%). No new dated adjacency found to propose. Probe-ref block populated with real readings (CRWV 84.23, VIX 14.43, band medium:8+). | — (stance set) | 2026-09-07 (medium, 8+ band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
