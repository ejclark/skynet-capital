# Dallas Fed Trimmed Mean PCE (Aug 2026 data) — the first trimmed mean computed off BEA's revised components — dallas-fed-trimmed-mean-2026-09-30

**Kind:** macro-print · **Date:** 2026-09-30 (estimate, EST: dallasfed.org/research/pce "Next Release Date: September 30" + "Updates … follow BEA's release schedule for Personal Income and Outlays data", cross-checked against bea.gov/news/schedule's confirmed 08:30 ET slot, both fetched 2026-09-15) · **Impact:** medium
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.52,"daysBand":"medium:8+","adjacentIds":["durable-goods-2026-09-25","jgb-liquidity-enhancement-5-11y-2026-09-25","umich-sentiment-final-2026-09-25","unsc-iran-panel-mandate-expiry-2026-09-26","census-benchmark-revision-nsa-2026-09-28","dallas-fed-mfg-2026-09-28","retail-benchmark-revision-2026-09-28","case-shiller-hpi-2026-09-29","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","fhfa-hpi-2026-09-29","jgb-40y-auction-2026-09-29","jolts-2026-09-29","treasury-buyback-tips-1y10y-2026-09-29","adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","bloomberg-agg-index-rebalance-2026-09-30","chicago-pmi-2026-09-30","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","jgb-2y-auction-2026-09-30","pce-2026-09-30","pjm-reliability-backstop-procurement-2026-09-30","russell-style-quarter-end-capping-effective-2026-09-30","sp-select-sector-secondary-reweight-2026-09-30","tic-quarterly-external-debt-2026-09-30","uk-quarterly-national-accounts-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","construction-spending-2026-10-01","ism-manufacturing-2026-10-01","sp-global-manufacturing-pmi-2026-10-01","sp-global-pmi-commodity-price-supply-2026-10-01","treasury-buyback-10y20y-2026-10-01","treasury-coupon-announcement-2026-10-01","uk-electricity-vat-zero-rate-2026-10-01","boe-dmp-2026-10-02","eurostat-hicp-flash-2026-10-01","google-adtech-final-judgment-2026-10-02","jobs-2026-10-02","m3-full-report-2026-10-02","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","ism-services-2026-10-05","sp-global-services-pmi-2026-10-05"],"adjacentStrongIds":["pce-2026-09-30","ism-manufacturing-2026-10-01","jobs-2026-10-02","ism-services-2026-10-05"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Never a trade — but read the restated history, not the headline, and do not treat 2.3%
as the clean number.** On **2026-09-30 at 08:30 ET** (`estimate`-dated; two primaries agree, the
status is held by a taxonomy gap, not date doubt) the Dallas Fed republishes the trimmed mean off
BEA's revised components *and* restates its own 2021–2026 history. That restatement makes one
measurement available within minutes: **how far the revision moves July-2026 core y/y versus how far
it moves the July-2026 trimmed mean** — same reference month, no August news mixed in. That
difference is the direct answer to a question nobody has published an estimate of (checked
2026-09-15). The substantive finding is separate and bigger: measured this session from FRED (583
months, 1978-01 → 2026-07), the **core-minus-trimmed wedge is 1.06pp — the 95.7th percentile of 48
years**, reached by the trimmed mean *falling* 2.70% → 2.28% while core *rose* 2.81% → 3.34% over
thirteen months. The last two times it opened this wide were 1980–83 and 2021–22, and in 2021 the
trimmed mean was the measure that was wrong. The Dallas Fed has said so itself, twice in 2026.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-15) | **Stand aside** | High | `symbols: []`, no macro-keyed playbook, and the release is a derived statistic of another release 15 days out. Nothing is priceable off it. | Nothing dated today — no instrument is keyed to this release |
| This week | **Stand aside; the week's inflation information is the 09-16 FOMC, not this** | High | This print contributes no information before 09-30, and the sibling [`fomc-2026-09-16`](fomc-2026-09-16.md) owns the live decision. | A Dallas Fed publication between now and **2026-09-30** pre-announcing the revision's effect on the trimmed mean — which would move this event's content forward and fire [`pce-2026-09-30`](pce-2026-09-30.md)'s standing switch early |
| This month | **Read the difference-of-differences on the July restatement, and expect the wedge to survive** | High | A −13 to −30bp core revision cannot close a **1.06pp** wedge; closing it would need core revised down >31bp *more* than the trimmed mean, above the top of the entire street range. Registered as **`FT-dallas-fed-trimmed-mean-2026-09-30-1`**. | The **2026-09-30** release putting the restated July-2026 core-minus-trimmed wedge **below 0.75pp** |
| This quarter | **Do not treat the trimmed mean as the clean read just because the chair prefers it** | Medium | Its own publisher says this is when it under-reads: 2026-04-16 — positive skewness makes "the signal from the trimmed mean … misleading"; 2026-08-13 — a recalibrated 19/20-trim alternative "better tracked" the 2021 surge and reads **2.6%** against the official **2.2%** for the 12 months ended June. | Trimmed mean and core **converging** by ≥50bp by the **2026-12-23** PCE release with no BEA methodology change — the wedge would be transitory composition, not a measurement disagreement |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this release.** `symbols: []`, no macro-keyed house playbook, and it publishes
  into the same 08:30 ET minute as PCE, the GDP third estimate, ADP and the advance economic
  indicators — its own tape contribution is unattributable by construction.
- **Compare July, not August.** The August number mixes the revision with a month of real news
  (Brent ~$88 → ~$107, gasoline $4.07 → $4.32, sibling-sourced). The restated **July** figure isolates
  the revision.
- **State every post-09-30 trimmed-mean reading as a restated series.** The trimmed mean's own
  2021–2026 history moves on 09-30, so the printed 12-month figure is not comparable to the 2.3%
  currently on the tape — the same comparability break [`pce-2026-09-30`](pce-2026-09-30.md)
  pre-committed a reading rule for, applied to this gauge.
- **Do not assume the revision spares the trimmed mean.** The mechanism is two-sided and the sign is
  not inferable — see leg 4. The proposal that created this event inferred otherwise; that inference
  is graded MIXED here, not adopted.
- **A trimmed mean that falls as much as core did is the informative surprise** — it would say BEA
  re-deflated the *centre* of the distribution, not its tails.
- **Watch (dated):** FOMC **09-16** · blackout lifts **09-17** · UMich final **09-25** · JOLTS +
  consumer confidence **09-29** · **this release + PCE + GDP 3rd est. + ADP + funding deadline,
  09-30** · jobs **10-02** · CPI **10-14** · FOMC **10-28** (no SEP) · next trimmed mean **10-29**.

## Initial research

### The question, plainly

On **2026-09-30 at 08:30 ET**, in the same minute as the August PCE print, the Dallas Fed republishes
the Trimmed Mean PCE — the gauge Chair **Warsh has stated he prefers** — computed for the first time
off BEA's re-deflated components, with its own 2021–2026 history restated. What does it tell a paper
book that the PCE release itself cannot, and is the number it prints one to trust?

**One-line verdict.** Nothing here is tradeable (`symbols: []`), and the release's *headline* is the
least useful thing in it. Two things in it are useful: the **restated July figure**, which makes the
revision's effect on the trimmed mean directly measurable against its effect on core within minutes
of 08:30; and the **wedge** that restatement will almost certainly leave standing — 1.06pp in July
2026, the 95.7th percentile of 48 years, and a level the Dallas Fed's own 2026 research says is
exactly when its measure under-reads.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. Its analog — *re-source, don't recall* — was honoured: everything
below was fetched, searched or computed fresh on **2026-09-15**.

**Primaries fetched directly today:** `dallasfed.org/research/pce` (the July readings and the
release-schedule rule, verbatim), `bea.gov/news/schedule` (the 09-30 08:30 lines, verbatim),
`dallasfed.org/research/economics/2026/0416` ("Skewness warrants caution as Trimmed Mean PCE
inflation eases"), `dallasfed.org/research/economics/2026/0813` ("Alternative Trimmed Mean PCE
inflation measure better tracked price surge").

**Computed this session, not quoted:** FRED CSV `PCETRIM12M159SFRBDAL` (Dallas Fed 12-month trimmed
mean) + `PCEPILFE` (core PCE index), fetched direct, **583 paired monthly observations 1978-01 →
2026-07**. Core y/y is computed from index levels; it reproduces the published July figure to a basis
point (**3.344%** against a published 3.3%), which is the check that the join is right.

**Secondaries fetched directly:** Brookings (**2026-04-30**, the Warsh quotes and the criticisms),
Employ America (**2026-04-28**, the methodology critique), Richmond Fed *Macro Minute*
(**2026-05-05**, measure selection), Mises (**2026-05-14**, the Warsh-preference framing).

**Siblings read as inputs and cited, never silently restated:**
[`pce-2026-09-30`](pce-2026-09-30.md) (whose adjacency sweep proposed this event, and whose standing
kill switch this release resolves), [`pce-2026-10-29`](pce-2026-10-29.md),
[`jackson-hole-2026-08-28`](jackson-hole-2026-08-28.md),
[`fomc-2026-09-16`](fomc-2026-09-16.md).

**Market reading:** VIX **17.52** (2026-09-15, Yahoo chart endpoint — the same source
`event-material-scan.mjs` probes). No source fetch failed this session; `probe-ref.blocked` is empty.

### Conviction legs, tested

1. **The date and slot are right — SUPPORTED at two primaries — and the status stays `estimate` on a
   taxonomy gap, not on date doubt.** `dallasfed.org/research/pce` fetched today carries **July 2026**
   data (1-month **2.2%**, 6-month **2.3%**, 12-month **2.3%**), gives its **next release date as
   September 30**, and states verbatim: *"Updates to the Trimmed Mean PCE Inflation Rate follow BEA's
   release schedule for Personal Income and Outlays data."* `bea.gov/news/schedule`, re-fetched today,
   lists verbatim **"Personal Income and Outlays, August 2026"** at **8:30 AM** on **September 30**
   (and in the same slot the GDP third estimate). Two primaries, one date, no conflict. The entry
   nevertheless stays `estimate`: `market-events-data.ts`'s confirmed-prefix taxonomy defines `FED:`
   narrowly as *"federalreserve.gov FOMC calendar"*, and a **regional Reserve Bank research release**
   has no prefix in it. This is the **third** ledger to record that same gap — the others hit it for a
   non-US sovereign debt office and for foreign central banks
   (`jgb-20y-auction-2026-09-15`, `ecb-decision-2026-09-10`, `boj-decision-2026-09-18`). Named in
   *Honest limits* as a mechanical fix, not worked around here.

2. **The core-minus-trimmed wedge is at a 48-year extreme, and it is measured, not asserted —
   SUPPORTED, computed this session.** From the FRED join described in *Method*:

   | Data month | Core PCE y/y | Trimmed mean 12-mo | Wedge |
   |---|---|---|---|
   | 2025-06 | 2.81% | 2.70% | **0.11pp** |
   | 2025-09 | 2.83% | 2.70% | 0.13pp |
   | 2025-12 | 2.97% | 2.44% | 0.53pp |
   | 2026-03 | 3.25% | 2.36% | 0.89pp |
   | 2026-05 | 3.46% | 2.43% | 1.03pp |
   | 2026-06 | 3.34% | 2.26% | 1.08pp |
   | **2026-07** | **3.34%** | **2.28%** | **1.06pp** |

   Over thirteen months the wedge went **0.11pp → 1.06pp**, and it did so the hard way: the trimmed
   mean **fell** (2.70% → 2.28%) while core **rose** (2.81% → 3.34%). Against the full 1978–2026
   history the current reading sits at the **95.7th percentile** (p50 −0.08pp, p90 0.71pp, p99
   1.66pp). Only **30 of 583** months print a wedge ≥1.00pp, and they fall in exactly three clusters:
   **1980-10 → 1983-10** (the Volcker disinflation), **2021-04 → 2022-04** (the pandemic surge, max
   1.85pp), and **2026-05 → 2026-07** (now). Independently cross-checked: the Richmond Fed's
   *Macro Minute* (2026-05-05) reports March 2026 core **3.2%** against trimmed **2.4%** — the same
   0.8pp gap this join computes as 0.89pp before rounding.

3. **The last time the wedge opened this wide, the trimmed mean was the measure that was wrong — and
   the Dallas Fed has published that finding twice this year — SUPPORTED, publisher primary.** Two
   2026 Dallas Fed pieces, both fetched direct today, say the same thing from different angles:
   - **2026-04-16, "Skewness warrants caution as Trimmed Mean PCE inflation eases."** *"When the
     skewness of the price change distribution shifts from the usual negative to positive, the signal
     from the trimmed mean can be misleading."* The mechanism is the **asymmetric trim** — the measure
     excludes components below the **24th percentile** and above the **69th percentile** of the price
     change distribution across **177** PCE categories, so it keeps cutting more from the top than the
     bottom, *"which produces a downwardly biased result when distributions lack typical negative
     skew."* The piece dates 12-month average skewness at *"roughly zero through February 2026"* —
     i.e. already out of the regime the asymmetric trim is calibrated for.
   - **2026-08-13, "Alternative Trimmed Mean PCE inflation measure better tracked price surge."** A
     recalibration on **1967–June 2009** (against the original's 1977–2009) yields a lighter, roughly
     symmetric trim at the *"19th lower percentile … and at 20th upper percentile … lighter than the
     24/31 trims used in the original,"* and it *"accelerated somewhat earlier than headline and
     core"* in 2021 where the official measure lagged badly. Its current reading: **2.6% for the 12
     months ended June, against 2.2% for the original.** The Dallas Fed presents this as research, not
     as an adoption.

   Compose them with leg 2: the publisher of the gauge has, in the same year, (a) named the
   distributional regime in which its measure under-reads, (b) shown its measure failed the last
   comparable episode, and (c) published an alternative reading **34bp higher** on the same month —
   in the direction of core. That is not a reason to discard the trimmed mean; it is a reason to
   refuse to treat 2.3% as the clean number.

4. **The revision does *not* spare the trimmed mean by construction — MIXED, and this corrects the
   proposal that created this event.** The proposal
   (`proposals/dallas-fed-trimmed-mean-2026-09-30.from-pce-2026-09-30.json`, and its 10-29 sibling
   more explicitly) inferred that *"the trimmed mean absorbs the 09-30 revision LESS than core does
   because portfolio management at 21.6% annual price growth is exactly what a trimmed mean
   discards."* That is half of the mechanism. Stated properly, with the missing half:
   - The trim retains roughly **45%** of basket weight (24% cut from the bottom, 31% from the top, per
     the 04-16 piece's own wording). Core PCE's basket is roughly **84%** of PCE with food and energy
     removed. A component that *is* retained therefore carries a renormalized weight roughly
     **0.84 / 0.45 ≈ 1.9×** its core weight. **This is arithmetic from the published trim fractions,
     not a Dallas Fed statement** — and it only applies in the months a component is actually retained.
   - Of BEA's three re-deflated legs: **portfolio management and investment advice** is the volatile
     one (it tracks equity prices; at 21.6% y/y it plausibly sits in the upper tail most months) →
     likely **trimmed** → the **−13bp** on core that Bloomberg Economics attributes to it (May data,
     reaching this doc through [`pce-2026-09-30`](pce-2026-09-30.md), not from a note read here)
     passes through to the trimmed mean at roughly **zero**.
   - **Legal services** and **computer software and accessories** are low-volatility, mid-distribution
     components → likely **retained** → their effects pass through at roughly **1.9×** — and per UBS's
     decomposition (same sibling) they point in **opposite directions**: legal services revises
     inflation **up**, software about **−0.1pp**.
   - **Net: the sign is not inferable and the magnitude could exceed core's.** The one leg that would
     lower the trimmed mean is the one most likely to be trimmed out; the two that survive the trim
     are amplified and offset each other. This doc refuses the direction and registers the measurement
     instead (leg 5, `FT-…-2`).

5. **The cleanest measurement of the whole revision is a difference-of-differences, computable within
   minutes of 08:30 — SUPPORTED, procedural.** Because BEA restates **2021Q1–2026Q1** and the Dallas
   Fed recomputes off the revised components, the 09-30 release republishes the trimmed mean's own
   history alongside the new month. So both of these are readable on the same reference month:
   - **Δcore** = published July-2026 core y/y (**3.344%**, computed this session) − the restated figure.
   - **Δtrim** = published July-2026 12-month trimmed mean (**2.28%**) − the restated figure.
   - **Δcore − Δtrim** answers, as a measurement rather than an estimate, whether BEA's revision moved
     the **centre** of the price-change distribution or only its **tails**.

   Do it on **July**, not August: the August figure mixes the revision with a month of real news
   (Brent ~$88 → ~$107, gasoline $4.07 → $4.32 over September, sibling-sourced), which is precisely
   the confound the restated-history comparison avoids. This is also the direct resolution of
   [`pce-2026-09-30`](pce-2026-09-30.md)'s standing kill switch — *"a published estimate of the
   revision's effect on trimmed mean appears."* **Two targeted searches today (2026-09-15) found no
   such estimate published anywhere**, which confirms that ledger's 09-10 judgment that the switch is
   likely unfireable before the fact and self-resolving at this release.

6. **The measure-selection stakes are live, and the chair's stated preference is not binding —
   SUPPORTED at secondary fidelity.** Warsh at his **April 2026** confirmation hearing: *"the measures
   I prefer are looking at things called trimmed averages"* and *"what I'm most interested in is
   what's the underlying inflation rate, not what's the one-time change in prices because of a change
   in geopolitics or a change in beef"* (Brookings, **2026-04-30**, fetched). The criticisms are on the
   record and equally sourced: Brookings lists the constant-distribution assumption, the systematic
   disregard of tariff and energy shocks that *"influence inflation expectations"*, and that switching
   metrics after five years above target *"risks undermining central bank credibility"*; Employ America
   (**2026-04-28**, fetched) argues *"cutting off 55% of the weight of the basket makes the Dallas
   Fed's measure closer to a median than a true trimmed mean"* and warns the switch *"looks too much
   like goalpost-shifting"*; the Richmond Fed (**2026-05-05**) declines to choose, concluding *"it can
   be helpful to consider a broad constellation of inflation measures."* **The operative asymmetry is
   behavioural, not analytical:** Warsh argued the *hawkish* case at Jackson Hole on **2026-08-28**
   from **headline** PCE 3.7% / 4.1% ([`jackson-hole-2026-08-28`](jackson-hole-2026-08-28.md)) — not
   from the gauge he says he prefers, which read **2.3%** at the time. Record that; do not model it.

7. **Its own tape contribution is unattributable — SUPPORTED, calendar-checked today.** **47** tracked
   events sit within ±5 days of this date. On **09-30** alone: [`pce-2026-09-30`](pce-2026-09-30.md)
   (high, confirmed — of which this release is a derived statistic),
   [`gdp-q2-2026-third-2026-09-30`](gdp-q2-2026-third-2026-09-30.md),
   [`adp-employment-2026-09-30`](adp-employment-2026-09-30.md),
   [`advance-economic-indicators-2026-09-30`](advance-economic-indicators-2026-09-30.md),
   [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) (high),
   [`chicago-pmi-2026-09-30`](chicago-pmi-2026-09-30.md) at 09:45, plus quarter-end index and sector
   reweights. The four confirmed high-impact neighbours in the corridor are `pce-2026-09-30`,
   `ism-manufacturing-2026-10-01`, `jobs-2026-10-02` and `ism-services-2026-10-05`. There is no minute
   in which this release is the marginal information, which is why impact is filed **medium** rather
   than high despite the content being load-bearing. VIX **17.52** today — mid-range, and not a level
   that changes what any options-shaped play would cost, which is moot anyway at `symbols: []`.

### What the conditions support

**A measurement procedure, a caution about the gauge, and a refusal.** The procedure is leg 5 and is
worth pre-committing now because it is far harder to run after the fact: on 09-30, compute
**Δcore − Δtrim on the restated July-2026 figures**, and treat that number — not the August headline
— as this release's content. The caution is legs 2–3 composed: the trimmed mean is at a 48-year
extreme *relative to core*, it got there by falling while core rose, the last comparable episode is
one its own publisher says it failed, and that publisher's recalibrated alternative currently reads
**40bp higher**. So a 09-30 trimmed mean near 2.3% is **not** evidence that inflation is at target;
it is evidence that inflation is concentrated in the tails, which is a different claim with different
policy consequences. The refusal is unchanged and absolute: **no position is opened, closed or sized
off this event** — `symbols: []`, no macro-keyed playbook exists, the event is `estimate`-dated, and
it publishes into a minute it shares with four other releases.

### Honest limits

**The single highest-value thing this session did not do: fetch the trim list.** The Dallas Fed
publishes a monthly spreadsheet of all **178** components showing which were included and excluded
from that month's trimmed mean (linked from its own PCE page as *"Components included and excluded
from this month's trimmed mean"*). It was **not fetched here**. Leg 4's mechanism is therefore an
inference from component volatility, not a read of the actual trim list — and fetching it would
convert leg 4 from MIXED to a **sign**, because it would settle directly whether portfolio management,
legal services and computer software were in or out in recent months. That is the explicit instruction
to the next session on this ledger.

**The trim fractions are cited from the Dallas Fed's own 04-16 wording** (below the 24th percentile,
above the 69th — i.e. 55% of weight removed, ~45% retained). A search snippet this session offered
*"19.4 percent of the weight from the lower tail and 25.4 percent in the upper tail"*, which sums to
44.8% trimmed and contradicts the publisher's own 55% figure; it was **not corroborated at a primary
and is not used**. The **1.9×** renormalization factor in leg 4 is this doc's arithmetic from the
published fractions, not a Dallas Fed statement, and it overstates the effect for any component that
is only retained in some months.

**The revision-sizing numbers are sibling-sourced, not read here.** Bloomberg Economics' −13bp, UBS's
component decomposition (software ≈−0.1pp, investment-management fees −0.1 to −0.2pp, legal services
up), Goldman's ≈−20bp and JPMorgan's ≈−10bp all reach this doc through
[`pce-2026-09-30`](pce-2026-09-30.md), which fetched or snippet-sourced them itself and labels its own
fidelity. Nothing here re-derives them.

**The Warsh material is secondary throughout.** The confirmation-hearing quotes come via Brookings and
Mises, not from a transcript fetched here; the Jackson Hole reading is deferred wholesale to
[`jackson-hole-2026-08-28`](jackson-hole-2026-08-28.md).

**The status is held by a taxonomy gap that a one-line change would close.** Two primaries agree on
the date; the entry is `estimate` only because `market-events-data.ts` has no confirmed prefix for a
regional Reserve Bank research release. This is the third ledger to hit it. Adding such a prefix is a
mechanical fix to a shared contract and is out of this lane's one-event scope — recorded here so the
next session that meets it has three instances rather than one.

**No instruments were run** — macro-print mode carries none and `symbols: []`. No base case is stated
for the **August** trimmed-mean level: no consensus, whisper or nowcast for it was findable today, and
this doc will not invent one. The FRED series carry their own revision risk; every figure above is the
vintage published as of **2026-09-15**, and the entire point of this event is that those vintages
change on 09-30.

## Stance & kill switches

**Stance (event `estimate`-dated; two primaries agree on 2026-09-30 08:30 ET, status held by a
prefix-taxonomy gap).** **Stand aside on every horizon — `symbols: []`, no macro-keyed house playbook,
and nothing in this release is priceable.** The operative content is a **reading procedure**,
pre-committed before the number exists: on 09-30, compute **Δcore − Δtrim on the restated July-2026
figures** (published anchors, measured this session: core y/y **3.344%**, 12-month trimmed mean
**2.28%**) and treat *that* as the release's information. Do the comparison on **July**, not August,
so the revision is isolated from a month in which Brent moved ~$88 → ~$107.

**The substantive position is a caution, and it cuts against the chair's preferred gauge.** The
core-minus-trimmed wedge is **1.06pp**, the **95.7th percentile of 583 months since 1978**, reached by
the trimmed mean falling while core rose. Its publisher has said, twice in 2026, that this is when the
measure under-reads — *"the signal from the trimmed mean can be misleading"* under positive skewness
(04-16), and a recalibrated alternative that *"better tracked"* 2021 currently reads **2.6% against
the official 2.2%** (08-13). So **a 09-30 trimmed mean near 2.3% is not evidence that inflation is at
target**; it is evidence that inflation is concentrated where this gauge does not look. Held at
**Medium** confidence because the competing reading — that the tails genuinely are one-off and the
centre genuinely is near target — is the reading the gauge was built to support, and 2021 is a single
episode.

**This doc refuses one inference it inherited.** The proposal that created this event held that the
trimmed mean absorbs the revision *less* than core does. Leg 4 grades that **MIXED**: the leg most
likely to be trimmed out (portfolio management) is the one that would lower the trimmed mean, while
the two legs that survive the trim are weight-amplified and point in opposite directions. **No
direction is stated**; the measurement is registered instead.

**Kill switches.**

- **A Dallas Fed or BEA publication before 2026-09-30 giving the revision's effect on the trimmed
  mean** — fires [`pce-2026-09-30`](pce-2026-09-30.md)'s standing switch early, converts leg 5 from a
  procedure into a read, and this ledger's month call becomes a check rather than a prediction.
- **The restated July-2026 wedge printing below 0.75pp on 09-30** — the revision would have closed
  more than the entire street range allows, and legs 2 and 4 both need re-deriving.
- **The Dallas Fed adopting the recalibrated 19/20-trim alternative as the headline series** — leg 3's
  whole argument changes character, because the published number would already carry the correction.
- **Trimmed mean and core converging by ≥50bp by the 2026-12-23 PCE release with no further
  methodology change** — the wedge was transitory composition, not a measurement disagreement, and the
  quarter call is wrong.
- **The 2026-09-30 release being suspended, re-dated, or published without restated history** — voids
  leg 5's procedure outright (it depends on the restatement being published, not merely computed).

**Forward tests registered today:** `FT-dallas-fed-trimmed-mean-2026-09-30-1` (the wedge survives the
revision) and `FT-dallas-fed-trimmed-mean-2026-09-30-2` (the difference-of-differences sign, no edge
claimed) — see
[`forward-tests/dallas-fed-trimmed-mean-2026-09-30.md`](../forward-tests/dallas-fed-trimmed-mean-2026-09-30.md).
Zero capital by construction.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-15 | D-15 | **Initial research.** Canonical `src/domain/market-events/dallas-fed-trimmed-mean-2026-09-30.json` written this PR, superseding the inert `proposals/….from-pce-2026-09-30.json`. Date agreed at two primaries fetched today (dallasfed.org/research/pce "Next Release Date: September 30" + the BEA-schedule rule, verbatim; bea.gov/news/schedule "Personal Income and Outlays, August 2026" 8:30 AM 09-30); status held `estimate` by a prefix-taxonomy gap, not date doubt. **Core finding, computed from FRED (583 months 1978-01→2026-07):** core-minus-trimmed wedge **1.06pp** in July 2026 = **95.7th percentile**; 13-month path 0.11pp→1.06pp with the trimmed mean *falling* 2.70%→2.28% while core *rose* 2.81%→3.34%; only 30 months ≥1.00pp, clustered 1980-83, 2021-22, now. **Adjacency sweep:** no peer prints (macro, `symbols: []`); macro — Aug CPI 09-11 and Aug PPI 09-10 both read via `pce-2026-09-30`, no re-derivation; VIX **17.52** (mid-range, no regime claim); geopolitical — energy impulse (Brent ~$88→~$107) noted as the reason to compare July not August; event tape — **no published estimate of the revision's effect on trimmed mean found in two targeted searches**, confirming `pce-2026-09-30`'s 09-10 judgment that its switch is unfireable before the fact. 47 adjacent events within ±5d; 4 confirmed high-impact. **No new dated event discovered → no proposal filed.** | **Initial stance set:** stand aside every horizon; read the restated **July** difference-of-differences, not the August headline; do not treat ~2.3% as the clean read (publisher's own 04-16 and 08-13 papers). **Inherited inference graded MIXED** — the proposal's "trimmed mean absorbs the revision less than core" is not supported: the trimmed-out leg is the one that lowers core, and the retained legs are ~1.9× weight-amplified and offsetting. FT-1 and FT-2 registered. | 2026-09-22 (medium, D-8+ band → 7d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-dallas-fed-trimmed-mean-2026-09-30.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
