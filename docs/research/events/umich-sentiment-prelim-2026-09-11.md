# University of Michigan consumer sentiment — preliminary (Sep 2026) — umich-sentiment-prelim-2026-09-11

**Kind:** macro-print · **Date:** 2026-09-11 (confirmed, UMICH: sca.isr.umich.edu states verbatim "Next data release: Friday, September 11, 2026 for Preliminary September data at 10am ET", fetched 2026-09-04) · **Impact:** low
**Last assessed:** 2026-09-04
<!-- probe-ref: {"symbols":{},"vix":14.32,"daysBand":"low:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","cpi-2026-09-11","eia-steo-2026-09-09","fomc-2026-09-16","import-export-prices-2026-09-16","mts-august-2026-09-11","opec-plus-meeting-2026-09-06","ppi-2026-09-10","retail-sales-2026-09-16","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-10y20y-2026-09-10","treasury-buyback-increase-2026-09-09"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The survey window is the whole story, and it is now knowable from the primary.** The
Surveys of Consumers' own schedule document states its collection rule: preliminary interviews run
from the Tuesday before the prior month's final release through the Monday before the prelim — i.e.
roughly **2026-08-25 → 2026-09-07**. So this print contains the **record $4.1436 national pump
price** (AAA, 9/3, +$0.95 y/y), Brent's run from **$88.58 → ~$95.94** inside the window, Warsh's
hawkish 08-28 keynote and the 09-04 jobs report — and contains **none** of the 09-11 CPI released 90
minutes earlier that morning, nor the 09-16 FOMC. That skews the print **down from August's 51.7**
with **year-ahead inflation expectations reversing back up** from 4.0%. **None of it is tradeable.**
Date is now **confirmed** (primary, fetched today, with a time). Measured this session: the eight
2026 prelim days have a median S&P |move| of **0.627%** against an all-2026 median of **0.510%** —
noise, and the two biggest were a jobs Friday and a retail-sales Friday. This one lands on a **CPI
morning**. Stand aside.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-7) | **Stand aside** | High | `symbols: []`, low impact, and the survey window is still open — nothing it will report has finished being collected. | The **09-04 08:30 ET** jobs print landing far enough outside consensus (+53k / 4.1%) to reprice the Fed path, which would make the whole corridor — not this print — the thing to re-read |
| This week | **Do not read the 10:00 ET tape as a sentiment reaction** | High | CPI prints at **08:30 the same morning** (high-impact, own doc); anything moving at 10:00 is far more likely CPI digestion than a low-tier survey. | A UMich-attributed intraday move on **2026-09-11** larger than the CPI-attributed one — which would break the base rate measured here and registered as **FT-53** |
| This month | **Watch the sub-number, not the headline: year-ahead inflation expectations** | Medium | August's 4.2% → **4.0%** tick-down was collected on a *falling* Brent window; that input has flipped, and pump prices set a Labor Day record inside this window. | Year-ahead expectations printing **at or below 4.0%** on **2026-09-11** despite the record pump price — which kills the gasoline-transmission leg this doc rests on |
| This quarter | **The 09-25 final matters more than this prelim; the 10-09 prelim may matter most of all** | Medium | Final-release interviews run through the Monday before release (**09-21**), so the **09-25 final** is the first UMich that can contain the 09-16 FOMC — and if funding lapses 09-30, this **private** survey survives the blackout that deletes jobs 10-02 and CPI 10-14. | A CR signed before **2026-09-30**, which restores the federal data and drops the October prelim back to second-tier |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this print.** `symbols: []`, low impact, no house playbook is macro-keyed.
- **The number that matters** — year-ahead inflation expectations (Aug **4.0%**, long-run **3.3%**).
- **Headline context** — Aug final **51.7** (prelim 51.0), Jul **55.2**, Aug-2025 **58.2**, May-2026 record low **44.8**.
- **No consensus is published yet** (fxstreet reads "n/a" at D-7); August's 54.5 appeared in release week.
- **Do not confuse prelim with final** — the tape-moving 2026 UMich was March's *final*, during the Iran shock.
- **Watch (dated):** jobs **09-04** · OPEC+ **09-06** · window closes **09-07** · PPI **09-10** · CPI + this print **09-11** · FOMC **09-16** · UMich final **09-25** (estimate, proposed in this PR).

## Initial research

### The question, plainly

What will the September preliminary University of Michigan sentiment print say, is the 2026-09-11
date real, what is actually inside its survey window, how does the tape historically react to a
prelim — and does any of it change how a paper book holding NVDA MRVL AVGO CRWV MSFT GOOG META AAPL
AMZN should sit?

**One-line verdict:** the date is now primary-confirmed with a time, the window is derivable from the
publisher's own collection rule and is loaded with record pump prices and a hawkish Fed repricing
(so the honest lean is *down*, with inflation expectations *up*), and the print is still untradeable
— it is a low-tier survey released 90 minutes after a CPI print on a day the calendar already owns.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Three primaries were fetched or decompressed today:** the
Surveys of Consumers' own site (`sca.isr.umich.edu`) for the next-release line, the August table and
the inflation-expectation lines, read back **verbatim-only** on a second pass; the Surveys' 2026
release-dates document (`data.sca.isr.umich.edu/fetchdoc.php?docid=79628`), whose PDF text layer was
decompressed locally after the fetcher could not read the binary; and AAA's own national fuel-price
page. Market readings are **measured, not quoted**: VIX, S&P, Brent and WTI closes come from the
same Yahoo daily-bar endpoint `scripts/event-material-scan.mjs` uses, and the release-day base rate
in leg 6 was computed this session from 168 S&P sessions. Corridor and Fed-path context is carried
from the siblings [`cpi-2026-09-11`](cpi-2026-09-11.md), [`jobs-2026-09-04`](jobs-2026-09-04.md) and
[`retail-sales-2026-09-16`](retail-sales-2026-09-16.md) — the doc that discovered this event — and is
labelled as carried rather than re-derived. Every figure is dated in-line.

### Conviction legs, tested

1. **The date is real, primary-sourced twice today, and carries a time — SUPPORTED, and it promotes
   the calendar entry.** `sca.isr.umich.edu` states verbatim: **"Next data release: Friday, September
   11, 2026 for Preliminary September data at 10am ET."** Independently, the Surveys' own 2026
   release-dates document lists **"September 11 · September Prelim"** and **"September 25 · September
   Final"** — its PDF text layer decompressed locally today, because the fetcher returned the binary
   unread (recorded so the next session skips that dead end). The entry was filed `estimate` by the
   [`retail-sales`](retail-sales-2026-09-16.md) sweep that discovered it, explicitly deferring the
   promotion to this session under the lane's no-self-confirm limit. That limit is met: the publisher
   is the primary, and it now supplies a **time** the schedule document does not. Flipped `estimate`
   → **`confirmed`** with a new **`UMICH:`** prefix in this PR (the `CB:` precedent — a publisher
   whose own schedule page is the primary gets its own prefix rather than being forced into `EST:`).

2. **The survey window is 2026-08-25 → 2026-09-07, derived from the publisher's own collection rule —
   SUPPORTED, and it is the finding this whole doc turns on.** The release-dates document states the
   rule verbatim: *"The normal pattern of data collection is interviewing begins the Tuesday before
   the final release of the previous month. Interviews included in preliminary releases are conducted
   through the Monday before the prelim data release."* August's final released **08-28** (Friday), so
   interviewing opened **Tuesday 08-25**; this prelim releases **09-11**, so its interviews close
   **Monday 09-07**. This is materially better than the sibling
   [`consumer-confidence`](consumer-confidence-2026-09-29.md) doc could do for the Conference Board,
   whose cut-off is not published and has moved a full week between months. **Two honest caveats:**
   it is the *normal* pattern, not a per-month published window (the document itself carves out
   November and December for holidays), and **09-07 is Labor Day**, which plausibly thins or shifts
   the final day of collection.

3. **What is inside that window pushes sentiment down — SUPPORTED, on measured fuel and energy
   prices.** AAA's own page today: national average regular **$4.1436 (9/3/26)**, versus **$4.0997** a
   week ago, **$4.0946** a month ago and **$3.1903** a year ago — a **+30% y/y** pump price, and the
   sibling docs record it as a **record Labor Day** average (prior record $3.82, 2012). Brent,
   measured from the same endpoint this session: **$88.58** (08-25, the window's opening day) →
   $87.84 → $89.70 → $89.31 (08-28) → $90.49 (08-31) → **$94.65** (09-01, the session of the CENTCOM
   strike on IRGC coastal targets) → **$95.63** (09-02) → **$95.94** latest. So crude rose **~8%
   inside the window**, with the increase concentrated in its most recent and most salient week. This
   also **reconciles** the [`retail-sales`](retail-sales-2026-09-16.md) row's unresolved "~$96–99"
   spread: the settlement series says **$95.63 (09-02)**, and the higher aggregator figures are not
   reproduced.

4. **The same window pushes inflation expectations *up*, reversing August's tick-down — SUPPORTED,
   and it is the sub-number to read first.** The primary's August lines: *"Year-ahead inflation
   expectations ticked down from 4.2% in July to 4.0%"* and *"Long-run inflation expectations held
   steady at 3.3% for the third consecutive month."* **The tick-down was collected on a falling
   energy tape** — Brent fell from ~$94 to ~$88 across the August window — while director Joanne Hsu's
   August commentary explicitly flagged that consumers *"anticipate rising gasoline prices due to the
   Iran conflict."* September's window inverts that input. **A discrepancy is recorded rather than
   reconciled:** one aggregator summary reports year-ahead at **4.3%, "up from 4.2%"**; the
   publisher's own page says **4.0%, down from 4.2%**. The most likely explanation is prelim-vs-final
   (August prelim revised 51.0 → 51.7 on the headline), but that is inference — **the primary's 4.0%
   is what this doc uses**, and the aggregator figure is discarded, not averaged.

5. **August's baseline is already near a record low, which caps how much a further fall means —
   MIXED.** From the primary's own table: sentiment **51.7** (Aug) vs **55.2** (Jul) vs **58.2**
   (Aug-2025); Current Conditions **51.9 / 54.8 / 61.7**; Expectations **51.5 / 55.4 / 55.9**. The
   prelim was **51.0** against a **54.5** consensus — a 3.5-point miss. Context that cuts *against*
   over-reading another soft print: this series hit an all-time low of **44.8 in May 2026** and has
   spent the year in a band no historical reaction function was calibrated on. A print of, say, 49–51
   would be genuinely bad news and also almost indistinguishable from the last two months. **The
   level is nearly exhausted as information; the sub-components and expectations are not.**

6. **A UMich prelim day is an ordinary session, and where it looks otherwise another print owns the
   day — SUPPORTED, measured this session.** All eight 2026 prelim releases (Jan 9 · Feb 6 · Mar 13 ·
   Apr 10 · May 8 · Jun 12 · Jul 17 · Aug 14) produced S&P close-to-close moves of **+0.648 · +1.970 ·
   −0.606 · −0.114 · +0.843 · +0.503 · −1.010 · −0.170 %** — median |move| **0.627%** against an
   all-2026 baseline of **median 0.510% / p75 0.843% / p90 1.459%** across **168** sessions, with
   **5 of 8** above the all-day median (null 4.0). That is noise at n=8. And the two largest are
   confounded by design: **02-06 was the first Friday of February — a jobs report day**, and
   **08-14 carried the July retail-sales print** the same morning (the press attributed that session's
   −0.17% to *both*, plus rising oil). Registered as **FT-53** in
   [`forward-tests.md`](../forward-tests.md), deliberately scored on the **clean 2026-10-09** prelim
   rather than on this event's own CPI-contaminated date — the same discipline FT-51 used.

7. **The one 2026 counterexample is a *final*, not a prelim, and it is confounded — SUPPORTED, and it
   corrects a claim this repo was carrying.** The [`consumer-confidence`](consumer-confidence-2026-09-29.md)
   doc cites "the March UMich sentiment collapse" as the counterexample to the muted-reaction base
   rate. Checked: the **March 13 prelim** read **55.5 and slightly beat estimates**; the collapse was
   the **March 27 final** (−5.8% m/m), with about two-thirds of interviews taken after the start of
   the US military conflict with Iran, and the same sessions carried rising yields and an energy
   shock. So the counterexample survives as a statement about *final* releases inside a war shock, not
   about prelims — and this doc does not inherit it as a reason to expect a reaction on 09-11.

8. **The corridor removes whatever tradability was left — SUPPORTED.** Fifteen tracked events sit
   within five days of this one. The decisive neighbour is **CPI at 08:30 ET on the same morning**
   (`confirmed`, high impact) — a print whose own doc calls the day a known-date variance event with
   live 0.2%-vs-0.3% core disagreement. UMich publishes **90 minutes later**, into a market still
   digesting it, and inside the **FOMC blackout (09-05 → 09-17)** where no official may reinterpret
   either. Add PPI 09-10, three Treasury auctions and two buybacks in the same week, the 10Y at
   **~4.78–4.82%** (multi-year highs, carried from the CPI doc), VIX at **14.32** (09-03 close,
   measured) and the S&P at **7,747.71** — a corridor that is neither cheap nor quiet, and in which
   a low-tier consumer survey is not the thing that moves anything.

9. **Tracked-name sensitivity is thin and indirect — SUPPORTED, inherited.** `symbols: []`. Only
   **AAPL** (discretionary device demand) and **AMZN** (e-commerce volumes) carry a direct consumer
   channel; the other seven feel this only through the shared rate-path / recession-odds channel. One
   genuinely in-window curiosity, flagged and explicitly **not** used as a signal: **AAPL's 09-09
   iPhone event** falls inside the collection window, and it is press-reported (leak-sourced, not
   Apple-confirmed) to raise prices **$200–300**. A consumer survey collecting through 09-07 mostly
   closes before it; nothing measurable connects the two, and this doc does not pretend otherwise.

### What the conditions support

A **reading order**, not a position. (a) Read **year-ahead inflation expectations** first — leg 4
makes it the one sub-number with a fresh, identifiable driver, and it is what feeds the rate-path
channel the tracked names actually sit in. (b) Read the **headline as near-exhausted** (leg 5): after
44.8 in May and 51.0/51.7 in August, another soft handle is confirmation, not news. (c) Read the
**10:00 ET tape as CPI**, not as sentiment (legs 6 and 8). (d) Carry leg 2 forward, because it
changes what the *next* two releases are worth: the **09-25 final** is the first UMich that can
contain the 09-16 FOMC, and — if funding lapses on 09-30 — the **10-09 prelim** lands inside a
federal-data blackout as one of the few forward-looking consumer reads still publishing, exactly the
argument the Conference Board sibling makes for its own October print.

### Honest limits

**No September consensus is published** as of D-7 (fxstreet's calendar reads "n/a"), so the
directional lean in legs 3–4 is mechanism-based extrapolation, not a measured surprise gap; unlike
the Conference Board case this is a **timing** gap, not a structural one — August's 54.5 appeared in
release-week previews — so the next pulse should re-check rather than treat it as settled. The
survey window in leg 2 is derived from a *"normal pattern"* sentence, not a published per-month
window, and Labor Day sits on its final day. **This doc was written pre-jobs-print** (banked ~23:10
ET on 09-03; the 09-04 08:30 ET Employment Situation had not published), and that print lands
*inside* the survey window — its outcome belongs to the next row and to
[`jobs-2026-09-04`](jobs-2026-09-04.md). The base rate in leg 6 is **n=8, daily bars only**: it
cannot separate a 10:00 ET release from the rest of a session, and FT-53 is registered with that
limit stated. Energy and pump figures are the fastest-moving facts here and are a single-day
snapshot. Finally, the promotion in leg 1 is a judgement call worth naming: the lane forbids
promoting a date **without** a primary source, and two were read today — but the
`treasury-3y-note-2026-09-08` entry reads that limit more strictly and stayed `estimate` despite
primary sourcing. If the stricter reading is intended, this flip and its `UMICH:` prefix are a
one-line revert.

## Stance & kill switches

**Stance (date confirmed, primary-fetched 2026-09-04).** Treat 2026-09-11 10:00 ET as a
**low-impact, non-tradeable release whose value is diagnostic, not directional.** No position opened,
closed or sized off it; no AAPL/AMZN discretionary-adjacent entry keyed to it; no reading of the
10:00 ET tape as a sentiment reaction while CPI owns the morning. Base case (**Low** confidence — no
consensus exists yet, and the level is near-exhausted as information): the headline prints **at or
below August's 51.7 final**, and **year-ahead inflation expectations reverse up from 4.0%**, on a
survey window carrying a record $4.14 pump price and an ~8% Brent run. Confidence is low by
construction and therefore sizes nothing — it is a stand-aside with a stated expectation, not a small
bet. The doc's forward job is leg 2's consequence: the **09-25 final** (proposed in this PR) is the
first UMich that can contain the 09-16 FOMC, and the **10-09 prelim** is the one to promote if the
funding deadline lapses.

**Kill switches:**

- **Year-ahead inflation expectations print at or below 4.0% on 2026-09-11** — the
  gasoline-transmission leg (3→4) fails despite a record pump price, and the whole directional lean
  here is wrong for a reason worth understanding.
- **The headline prints above 55.2 (July's level)** — the "level is near-exhausted" read (leg 5) dies;
  the series has re-entered a range where the headline carries information again.
- **A UMich-attributed intraday move on 09-11 exceeds the CPI-attributed one** — legs 6 and 8 both
  fail, this event is mis-tiered at `low`, and FT-53 is scored against rather than deferred.
- **AAA's national average falls back below ~$3.90 before 09-07** — the window's defining input
  reverses before collection closes, and leg 3's direction goes with it.
- **A published September consensus appears** — the leg-6/limits framing gains a measured surprise
  gap; re-run the direction against a real number instead of a mechanism.
- **The 09-04 jobs print lands far outside consensus (+53k / 4.1%)** — the corridor's Fed path
  re-prices inside the survey window, and the sentiment read becomes a second-order artefact of that
  rather than of energy.
- **A CR is signed before 2026-09-30** — the October-prelim promotion argument collapses; the 10-09
  release stays routine.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-04 | D-7 | Initial research banked (above). **Date: flipped `estimate` → `confirmed`** — `sca.isr.umich.edu` fetched today states verbatim *"Next data release: Friday, September 11, 2026 for Preliminary September data at 10am ET"*, and the Surveys' 2026 release-dates document (PDF text layer decompressed locally after the fetcher returned unreadable binary — recorded so the next session skips that dead end) lists *"September 11 · September Prelim"* and *"September 25 · September Final"*. New **`UMICH:`** prefix added alongside `CB:`. **The material finding — the survey window is derivable from the publisher's own rule:** *"interviewing begins the Tuesday before the final release of the previous month… Interviews included in preliminary releases are conducted through the Monday before the prelim data release"* → **2026-08-25 → 2026-09-07** (caveats: "normal pattern", not a published per-month window; 09-07 is Labor Day). That window contains the record pump price, the Brent run, Warsh 08-28 and the 09-04 jobs print — and **excludes** the 09-11 CPI and the 09-16 FOMC. **Baseline from the primary:** sentiment **51.7** Aug (prelim 51.0, consensus 54.5) / **55.2** Jul / **58.2** Aug-2025; Current Conditions **51.9 / 54.8 / 61.7**; Expectations **51.5 / 55.4 / 55.9**; year-ahead inflation **4.0%** (from 4.2% Jul), long-run **3.3%** (third month). All-time low **44.8**, May 2026. **Discrepancy recorded, not reconciled:** one aggregator reports year-ahead **4.3%, "up from 4.2%"** — likely prelim-vs-final, but that is inference; the primary's 4.0% is used and the aggregator figure discarded. Adjacency sweep — **peers:** n/a, `symbols: []`; **AAPL's 09-09 iPhone event falls inside the collection window** (leak-sourced $200–300 price increases), flagged as an in-window curiosity and explicitly not used as a signal. **Macro surprises:** none since the event was created (2026-09-04); the **09-04 08:30 ET jobs print had not published** when this was banked (~23:10 ET 09-03) — consensus +53k / 4.1%, its outcome belongs to the next row and to [`jobs-2026-09-04`](jobs-2026-09-04.md). Warsh's 08-28 keynote (hike odds ~35% → 57–59%) is carried from the siblings, not re-derived, and matters here only because it sits **inside** the window. **Volatility regime:** VIX **14.32** (09-03 close, Yahoo daily bars, same endpoint as the probe) — baseline set, nothing to diff against yet; noted that the [`cpi`](cpi-2026-09-11.md) and [`retail-sales`](retail-sales-2026-09-16.md) rows label **15.20** as "the 9/3 close" where the settlement series puts 15.20 on **09-02** and 14.32 on **09-03** — a one-day labelling drift, flagged not corrected (rows are append-only). S&P **7,747.71** (09-03). **Geopolitical / energy — the leg that drives this print:** AAA national average **$4.1436 (9/3)** vs $4.0997 a week ago, $4.0946 a month ago, **$3.1903 a year ago (+30% y/y)**; Brent measured **$88.58 (08-25, window open) → $89.31 (08-28) → $94.65 (09-01, CENTCOM strike) → $95.63 (09-02) → $95.94 latest**, i.e. **~+8% inside the window** — which also **reconciles** the retail-sales row's unresolved "~$96–99" to the settlement series' **$95.63**. **Event tape:** **no September consensus published at D-7** (fxstreet reads "n/a"); unlike the Conference Board's structural withholding this is a timing gap — August's 54.5 appeared in release-week previews — so re-check next pulse rather than banking it as structural. **Base rate measured this session (not quoted):** the eight 2026 prelim days moved the S&P **+0.648 · +1.970 · −0.606 · −0.114 · +0.843 · +0.503 · −1.010 · −0.170 %**, median |move| **0.627%** vs an all-2026 **median 0.510% / p75 0.843% / p90 1.459%** over 168 sessions, 5 of 8 above the median (null 4.0) — noise, with the two largest confounded (02-06 was a jobs Friday; 08-14 carried July retail sales). Registered as **FT-53**, scored on the clean **10-09** prelim, not on this CPI-contaminated date. **Correction to a claim this repo was carrying:** the [`consumer-confidence`](consumer-confidence-2026-09-29.md) doc's "March UMich collapse" counterexample was the **March 27 final**, not a prelim — the **March 13 prelim printed 55.5 and beat estimates** — and the final's session was confounded by the Iran conflict; that doc is not edited (append-only) and the correction lives here. **New dated adjacency found → proposed in this PR:** `umich-sentiment-final-2026-09-25`, `status: estimate` (`EST:`), from the same primary schedule document — the reason it earns an entry rather than being a routine revision is leg 2: final-release interviews run through Monday **09-21**, making it the first UMich that can contain the **09-16 FOMC**. **Cost named on the record:** adding it will flip several 09-24 → 09-29 neighbours to "new adjacent event" on their next probe, i.e. a few extra material pulses — accepted knowingly. The **10-09 prelim** is *not* added yet; it becomes the higher-value entry only in the funding-lapse branch, and the next pulse should add it if that branch is live. | — (stance set) | 2026-09-11 (low, 0–14d band: every 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
