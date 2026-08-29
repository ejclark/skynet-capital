# Chicago PMI / Chicago Business Barometer (Sep 2026 data) — chicago-pmi-2026-09-30

**Kind:** macro-print · **Date:** 2026-09-30 (estimate, NEWS: mnimarkets.com Chicago Business Barometer publication calendar — 09:45 ET, checked 2026-08-29) · **Impact:** medium
**Last assessed:** 2026-08-29
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"medium:31+","adjacentIds":["consumer-confidence-2026-09-29","ism-manufacturing-2026-10-01","jobs-2026-10-02","jolts-2026-09-29","mu-2026-09-29-print"],"screenStreak":0} -->

## At a glance

**TL;DR.** This series joined the calendar because on **2026-08-28** it collapsed to **47.1** against
a 58.3 consensus and a 57.6 prior — a 10.5-point plunge, the year's biggest single macro surprise —
and we could not see it coming because nobody was tracking it. The September reading lands
**2026-09-30, 09:45 ET** (date **estimate**, MNI's own publication calendar). Two things matter more
than the headline. **First, the August "collapse" was not a broad one:** new orders fell 15.4pt and
production 8.8pt, but *employment rose 4.3pt into positive territory for the first time in five
months* and supplier deliveries stayed in expansion for a 19th straight month. It was a demand-side
air pocket in one region, not a recession signal. **Second, the number that actually mattered went
unreported:** **Prices Paid jumped 3.8pt to its highest since February 2022**, on metal costs. Under
a Fed that Warsh has just pinned explicitly to inflation, that is the hawkish half of a report
everyone filed as dovish — and it is why the tape's non-reaction on 8/28 makes more sense than
"growth misses get ignored" alone. **The call for 9/30 is mean-reversion, held at low confidence
because this series does not deserve better:** the 2026 tape reads 54.0 · 57.7 · 52.8 · 49.2 · 62.7
· 56.7 · 57.6 · 47.1, its trailing-12-month σ is **7.59** (up from 3.43 the prior year), and the only
other sub-50 print of 2026 (April, 49.2) was followed immediately by the strongest print in four
years (May, 62.7). Nothing here is a trade — this is a medium-impact regional survey on an
`estimate` date, and its value to us is as a **two-business-day leading probe on national ISM
Manufacturing**, not as an event in its own right.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-32) | Stand aside | High | A medium-impact regional survey 32 days out on an `estimate` date, with no September consensus in existence. | Nothing dated today; no September consensus exists and the date is not primary-confirmed |
| This week | Watch **ISM Manufacturing 2026-09-01** — it adjudicates August's 47.1 | High | The national print three days out is the cleanest available test of whether Chicago's collapse was signal or regional noise, and it decides how much weight the 9/30 print deserves. | The **2026-09-01** ISM Manufacturing print landing sub-50, which would make 47.1 a national signal rather than a Chicago air pocket |
| This month | Expect mean-reversion toward the low-to-mid 50s | Low | 2026's only other sub-50 print (April 49.2) was followed by 62.7; the August drop was concentrated in new orders while employment *improved*. Low confidence is the honest grade — trailing σ is 7.59, so a 47.1 and a 60 are both inside one standard deviation of noise. | A second consecutive sub-50 print on **2026-09-30**, which would convert a one-month air pocket into a trend and kill the mean-reversion read |
| This quarter | Track the **Prices Paid** subcomponent, not the headline | Medium | This Fed is explicitly inflation-anchored (Warsh, 2026-08-28) and ignored the year's sharpest growth miss two days later; Chicago's prices line is at a four-and-a-half-year high and is the part of this report a rate desk can act on. | Growth data visibly repricing the Fed again — e.g. the **2026-09-04** payroll print pulling hike odds down hard — which would restore the headline as the market-relevant line |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this print.** Medium impact, regional sample, `estimate` date, no house playbook
  is macro-keyed (S1/S2/E1/S3/S4 + G1 are all symbol/earnings-keyed). It is an input, not an event.
- **Prices Paid ≥ its August level** (highest since Feb 2022) — the hawkish read; corroborates the
  inflation-anchored Fed case two days before the national ISM and three before the October payrolls.
- **A second consecutive sub-50 headline** — the air pocket becomes a trend; re-read the whole
  series' leading-indicator claim against the national ISM that follows two business days later.
- **New orders recovering while employment holds its August gain** — the mean-reversion base case
  confirming; treat August as noise and downgrade this series' weight accordingly.
- **Watch (dated):** ISM Manufacturing **2026-09-01** (adjudicates August) · FOMC **2026-09-16** ·
  JOLTS **2026-09-29** · **MU print 2026-09-29 AMC** (estimate — a real memory manufacturer's order
  book, the day before this survey, and the better demand read of the two) · Conference Board
  consumer confidence **2026-09-29** (estimate) · **this print 2026-09-30** (estimate) · ISM
  Manufacturing **2026-10-01** (estimate, proposed in this PR — the national print this survey leads
  by two business days) · jobs **2026-10-02** · FOMC **2026-10-28**.

## Initial research

### The question, plainly

What is the Chicago Business Barometer, how much does its August 2026 collapse to 47.1 actually tell
us, what should we expect from the September reading on 2026-09-30, and how should a
paper-trading book that holds long-duration tech (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) use
a regional manufacturing survey at all?

**One-line verdict:** the headline is the least useful number in the report — August's plunge was a
one-region, new-orders-only air pocket inside a series whose own trailing σ is 7.59, while the
genuinely market-relevant line (Prices Paid, highest since February 2022) went unremarked; the honest
output is a low-confidence mean-reversion base case for 9/30, a high-confidence instruction to let
the 9/1 national ISM adjudicate August, and a standing redirection of attention from the headline to
the prices subcomponent for as long as this Fed is inflation-anchored.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no symbol-keyed
instrument applies (`symbols: []`), so `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and
the cache-busting rule has no target. Sourced web research, primary-first: MNI's own publication
calendar fetched directly (2026-08-29) for the release date and time; tradingeconomics' report page
fetched directly for the August subcomponent detail; methodology and correlation figures from
MNI/ISM-Chicago material and Haver/Gryphon summaries; the 2026 monthly series cross-read across
tradingeconomics, Advisor Perspectives (dshort) and Sigmanomics. Fed-path and volatility context is
carried from the sibling [`jackson-hole-2026-08-28`](jackson-hole-2026-08-28.md) close-out and the
`event-material-scan` probe (VIX **14.43**, 2026-08-28 close), not re-derived. Every figure is dated
in-line; the event's own date is **estimate**, and that label rides on every trading-adjacent line
below.

### Conviction legs, tested

1. **The date and time are right, and they stay `estimate` on purpose — SUPPORTED, with a process
   note.** MNI's Chicago Business Barometer publication calendar (fetched 2026-08-29) lists the full
   2026 schedule at **09:45 ET** — Jan 30, Feb 27, Mar 31, Apr 30, May 29, Jun 30, Jul 31, **Aug 28**,
   **Sep 30**, Oct 30, Nov 30, Dec 30 — each release carrying that month's own data, on the last
   business day. Aug 28 matches the print that actually landed, which is the strongest available
   check on the calendar's accuracy. That is the publisher's own schedule, so the date is about as
   good as a date gets — **but the entry stays `estimate`**, for two compounding reasons: this lane
   never self-promotes an adjacency it proposed, and the source-prefix table in
   `market-events-data.ts` has no confirmed-tier prefix for MNI/ISM-Chicago at all (`ISM:` is scoped
   to ismworld.org's national PMI calendar). So a publisher-primary date is structurally stuck at
   `estimate` here. Named as a schema gap, deliberately not fixed from inside this lane.

2. **The August print was a genuine outlier by any measure — SUPPORTED.** The Chicago Business
   Barometer fell **10.5 points to 47.1** in August (released 2026-08-28), against a **58.3**
   consensus and a **57.6** July prior — the lowest reading of 2026, the first sub-50 since April,
   and described in the report as "a renewed contraction in business activity and the steepest since
   December 2025" (tradingeconomics report page, fetched 2026-08-29; Investing.com and Cryptobriefing
   corroborate the 47.1 and the >10-point miss). One unreconciled detail: the consensus is quoted as
   **58.3** on the report page and **57.9** elsewhere; the miss is >10 points either way and this doc
   does not resolve it.

3. **But the collapse was narrow, not broad — SUPPORTED, and it is the leg that changes the reading.**
   The composite is a weighted blend of five sub-indexes — **New Orders (0.35), Production (0.25),
   Order Backlog (0.15), Supplier Deliveries (0.15), Employment (0.10)** — so the two heaviest legs
   drive nearly everything. In August they did exactly that, and the rest went the other way:

   | Subcomponent | Weight | August move | Read |
   |---|---|---|---|
   | New Orders | 0.35 | **−15.4pt** (still above April's low) | the whole story; a demand air pocket |
   | Production | 0.25 | **−8.8pt**, first sizeable contraction since Dec 2025 | follows orders |
   | Order Backlog | 0.15 | not separately reported | — |
   | Supplier Deliveries | 0.15 | −2.6pt, **19th straight month in expansion** | no supply stress |
   | Employment | 0.10 | **+4.3pt, positive for the first time in five months** | *improving* |

   A print where employment improves to a five-month high and supplier deliveries hold a 19-month
   expansion streak is not what a recession signal looks like. The two demand legs carrying 0.60 of
   the weight fell hard in a single month, in a single region. That is an air pocket, and it is the
   main reason this doc's September base case is mean-reversion rather than continuation.

4. **The number that actually mattered was Prices Paid, and nobody reported it — SUPPORTED, and it is
   the highest-value finding here.** **Prices Paid jumped 3.8 points to its highest level since
   February 2022**, attributed in the report to higher metal costs. Set that against the same week's
   Fed news: Warsh's 2026-08-28 keynote pinned the hawkish case explicitly to inflation (PCE 3.7%
   12-month, 4.1% 6-month), judged financial conditions accommodative, abolished forward guidance,
   and drove September hike odds from ~35% to **56–59%** (sibling
   [`jackson-hole`](jackson-hole-2026-08-28.md) close-out). For a Fed anchored on inflation, the
   hawkish line in the Chicago report is worth more than the dovish headline — and the sibling
   [`ism-services`](ism-services-2026-09-03.md) doc independently reached the same structural
   conclusion about its own Prices Index the same day. **A refinement to the sibling framing, offered
   rather than asserted:** the `ism-manufacturing` row read 8/28 as "the tape only listened to one" of
   two opposing surprises. The subcomponents suggest a simpler explanation is also available — the
   Chicago report was *internally* mixed (collapsing orders, improving employment, four-and-a-half-year-high
   prices), so it was never a cleanly dovish print to trade in the first place. Both readings survive
   the evidence; this doc does not claim to settle it.

5. **The leading-indicator claim is real but weaker than its reputation — MIXED.** The Barometer is
   produced by MNI (Market News International) with the ISM-Chicago chapter, from a Chicagoland
   purchasing-manager panel giving diffusion-style relative assessments (better / worse / unchanged),
   and is published two business days before the national ISM Manufacturing PMI. Its reported
   correlation with that national index is **68%**, and roughly **60%** with quarter-over-quarter real
   GDP over the last 15 years. Sixty-eight percent is a real relationship and better than most
   regional surveys — it is also ~54% of the variance unexplained, i.e. exactly enough room for the
   kind of single-month divergence that makes reading one regional print as a national forecast a
   mistake. This doc therefore uses Chicago as a **probe**, never a prediction, and the 9/1 national
   ISM is treated as the adjudicator rather than the confirmation.

6. **The series' own volatility makes any point forecast dishonest — SUPPORTED.** 2026 monthly
   readings: **54.0 · 57.7 · 52.8 · 49.2 · 62.7 · 56.7 · 57.6 · 47.1** (Jan→Aug). Trailing-12-month
   standard deviation is **σ 7.59**, more than double the prior year's **3.43**. Within this single
   year the series has produced a **+13.5-point** month (Apr 49.2 → May 62.7, a four-year high) and a
   **−10.5-point** month (Jul 57.6 → Aug 47.1). Against a σ of 7.59, August's 47.1 is roughly a
   1.4-sigma event — surprising, not extraordinary. The one directly analogous precedent, April's
   sub-50 print, reverted violently the very next month; that is n=1 and is carried as a base rate,
   not a mechanism.

7. **Market impact is unmeasurable from the one observation we have — REFUTED as a knowable, and this
   is an honest limit rather than a finding.** 2026-08-28 should have been the ideal natural
   experiment: the biggest Chicago miss of the year, and the tape did essentially nothing (Dow −0.02%,
   S&P −0.13% to −0.25%, Nasdaq −0.30% to −0.52%). But it is **confounded beyond rescue** — the same
   morning carried Warsh's Jackson Hole keynote, which nearly doubled September hike odds. No
   inference about this indicator's standalone market impact can be drawn from that session. The
   vendor and forex-education pages that describe the release as having "strong potential to move
   markets significantly" are promotional boilerplate attached to an economic-calendar product, not
   evidence, and are not used here. The defensible position: treat Chicago PMI as a second-tier
   release whose market impact we have **not** measured, and let the 9/30 print — landing on a quiet
   quarter-end rather than beside a Fed chair's keynote — be the first clean observation.

8. **Tracked-name sensitivity is indirect and thin — SUPPORTED.** `symbols: []`; the nine tracked
   names are software, semis and mega-cap platforms, none of them Chicagoland manufacturers. There is
   no direct channel. The two indirect ones are (a) the **rate path** — via Prices Paid feeding the
   inflation case that this Fed is anchored to, which reaches every name as long-duration assets, most
   sharply **CRWV** (debt-financed buildout) then the high-multiple semis; and (b) **capex sentiment**
   — a genuine national manufacturing contraction would eventually touch industrial semiconductor
   demand, but that is a quarters-long channel and one regional survey is nowhere near evidence for
   it. Neither channel licenses a position off this print.

9. **A better manufacturing-demand read lands the day before this one — SUPPORTED, and it outranks
   this print.** **MU reports 2026-09-29 AMC** (`estimate`, `NEWS:` — TipRanks/WSH/MarketBeat
   triangulation 2026-08-22, IR blocked; `earnings-calendar.ts`), surfaced by this event's own
   deterministic probe as an adjacency rather than found by hand. Micron is an actual memory
   manufacturer reporting hard revenue, bookings and capex guidance one session before a regional
   survey asks purchasing managers whether things feel better or worse. On the specific question
   August's print raised — is manufacturing demand rolling over? — MU's order book is the stronger
   evidence and it arrives first. MU is not one of the nine tracked names, so this book takes no
   position from it; but for *reading* the 9/30 print, MU's guidance is the prior and Chicago is the
   confirmation, not the other way round.

### What the conditions support

Nothing directional, and less than most events in this calendar. No house playbook is macro-keyed,
the impact tier is medium, and the date is `estimate`. What this doc supports is a **reading
discipline**: when the 9/30 print lands, read Prices Paid first and the headline second for as long
as the Fed's case is pinned to inflation; treat the headline as a probe on the national ISM two
business days later rather than as information in itself; and do not let a single regional survey —
in either direction — move the weight given to the 9/4 and 10/2 payroll prints, which are the reads
this book actually sits in front of.

### Honest limits

The date is `estimate`, not primary-confirmed, and structurally cannot be promoted from inside this
lane (leg 1). No September consensus exists at D-32 and none will until roughly the final week. The
August consensus figure itself is unreconciled across sources (58.3 vs 57.9). Order Backlog's August
move was not separately reported, so one of the five weighted legs is missing from leg 3's table. The
68% ISM correlation and the 60% GDP correlation are secondary-sourced summary statistics, not
figures this repo has computed — and no house instrument exists to compute them, since both
`earnings-cycle.mjs` and `intraday-edges.mjs` are symbol-keyed. The mean-reversion base case rests on
a single analogous precedent (April→May) plus a dispersion statistic, which is a base rate rather
than a mechanism; it is graded **Low** for exactly that reason. And the one clean test of this
indicator's market impact was destroyed by sharing a session with a Fed chair's keynote.

## Stance & kill switches

**Stance (date `estimate`, MNI publication calendar re-checked 2026-08-29).** Treat 2026-09-30 09:45
ET as a **medium-impact input, not an event**: no position is opened, closed or sized off it, and no
house playbook targets it. The standing instruction is a reading order — **Prices Paid before the
headline**, because this Fed's case is pinned to inflation and Chicago's prices line is at a
four-and-a-half-year high, while the same report's headline collapse was a one-region, new-orders-only
air pocket alongside *improving* employment. Base case for the September reading (**estimate**-labeled,
Low confidence): mean-reversion toward the low-to-mid 50s, resting on the April→May precedent and a
trailing σ of 7.59 that makes any point forecast noise. The series' real job in this calendar is as a
two-business-day probe on national ISM Manufacturing (proposed here as `ism-manufacturing-2026-10-01`,
`estimate`) and as an early read into the 10/2 payrolls — and the **2026-09-01** national ISM
adjudicates August's 47.1 before any of that matters.

**Kill switches:**

- **ISM Manufacturing on 2026-09-01 prints sub-50** — August's 47.1 was a national signal, not a
  Chicago air pocket; the mean-reversion base case dies, and this series' weight in the calendar goes
  up rather than down. Reassess from the national print, not from this doc.
- **A second consecutive sub-50 Chicago headline on 2026-09-30** — one month is noise, two is a
  trend; re-read leg 3's "narrow collapse" finding against the new subcomponents before repeating it.
- **Prices Paid reverses hard** (back below its recent range as metal costs unwind, plausibly on the
  same Brent de-escalation now running — Brent below $87, fourth straight down session as of 8/28) —
  removes the hawkish read that is this doc's main reason to look at the report at all.
- **The Fed stops being inflation-anchored** — e.g. the **2026-09-04** payroll print pulling hike odds
  down hard, or the FOMC question repricing from hold-vs-hike to hold-vs-cut — at which point the
  headline reclaims primacy over Prices Paid and this doc's reading order inverts.
- **A primary-tier source for the MNI release schedule becomes citable** (or the source-prefix table
  gains an MNI/ISM-Chicago prefix) — the date can then be promoted out of `estimate` by whoever owns
  that change, which is not this lane.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-29 | D-32 | Initial research banked (above). Date verified against MNI's own publication calendar, fetched today: 2026 releases run last-business-day at 09:45 ET, with **Sep 30** carrying September data — and the calendar's **Aug 28** entry matches the print that actually landed, the strongest accuracy check available. Entry stays `estimate`: this lane does not self-promote an adjacency it proposed, and no confirmed-tier prefix exists for MNI/ISM-Chicago (schema gap, named not fixed). Adjacency sweep — **peers:** no tracked name has a print in this window (nearest cluster MSFT 10/27, GOOG+META 10/28, AAPL+AMZN 10/29), but this event's own deterministic probe surfaced one this doc would otherwise have missed: **MU reports 2026-09-29 AMC** (`estimate`, `NEWS:` triangulation, IR blocked) — an actual memory manufacturer's order book and capex guidance landing the session *before* a regional sentiment survey asks the same question. Untracked by this book, but it reorders the reading: MU is the prior, Chicago is the confirmation (leg 9). **Macro:** the August print itself (8/28, **47.1** vs 58.3 consensus / 57.6 prior, −10.5pt, lowest of 2026) is this doc's founding datum; subcomponents fetched today materially change how it reads — New Orders **−15.4**, Production **−8.8** (first sizeable contraction since Dec 2025), but Employment **+4.3 into positive territory for the first time in five months**, Supplier Deliveries −2.6 yet expanding for a **19th** straight month, and **Prices Paid +3.8 to its highest since February 2022** on metal costs. Same session: Warsh's Jackson Hole keynote pinned the hawkish case to inflation and drove September hike odds ~35% → **56–59%** (sibling [`jackson-hole`](jackson-hole-2026-08-28.md) close-out) — so the hawkish subcomponent of this report matters more to a rate desk than its dovish headline, and the tape's non-reaction is better explained by an internally mixed print than by "growth misses get ignored." Offered as a refinement to the [`ism-manufacturing`](ism-manufacturing-2026-09-01.md) row's framing, not a correction of it. **Volatility regime:** VIX **14.43** at the 8/28 close (`event-material-scan` probe), intraday **14.1**, the lowest of 2026 — baseline established, nothing to diff against yet. **Geopolitical:** Brent below **$87**, a fourth straight down session on the Iran–Oman Hormuz agreement — directly relevant here as the input most likely to unwind the metal/energy cost pressure behind the Prices Paid spike. **Event tape:** no September consensus exists at D-32 and none is expected until the final week; 2026 series banked for base rates (54.0 · 57.7 · 52.8 · 49.2 · 62.7 · 56.7 · 57.6 · 47.1; trailing σ **7.59** vs 3.43 the prior year; April's 49.2 was followed by 62.7). **New dated adjacency found → proposed in this PR:** the national **ISM Manufacturing PMI for September data lands 2026-10-01** — the print this entire series exists to lead by two business days — and it is **not on the calendar** (the calendar carries `ism-manufacturing-2026-09-01` and then nothing until CPI 10/14). Added as `ism-manufacturing-2026-10-01`, `status: estimate` (`EST:`, ISM's first-business-day cadence; 2026-10-01 is a Thursday). | — (stance set) | 2026-09-19 (medium, ≥31d band: every 21d — moving to every 7d once inside 30 days out) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
