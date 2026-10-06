# Dallas Fed Trimmed Mean PCE (Sep 2026 data) — the energy-shock month read on a gauge that trims energy out — dallas-fed-trimmed-mean-2026-10-29

**Kind:** macro-print · **Date:** 2026-10-29 (estimate, EST: dallasfed.org/research/pce "Next Release Date: Sept. 30" + the BEA-schedule rule, verbatim, re-fetched direct 2026-09-29; bea.gov/news/schedule "Personal Income and Outlays, September 2026" 8:30 AM 10-29, re-fetched direct 2026-09-29) · **Impact:** medium
**Last assessed:** 2026-09-29
<!-- probe-ref: {"symbols":{},"vix":16.07,"daysBand":"medium:8+","adjacentIds":["dallas-fed-mfg-2026-10-26","mwts-benchmark-revision-2026-10-26","treasury-2y-note-2026-10-26","case-shiller-hpi-2026-10-27","consumer-confidence-2026-10-27","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-monetary-developments-2026-10-27","fhfa-hpi-2026-10-27","jgb-liquidity-enhancement-11-39y-2026-10-27","msft-2026-10-27-print","new-home-sales-2026-10-27","treasury-5y-note-2026-10-27","treasury-buyback-20y30y-2026-10-27","advance-economic-indicators-2026-10-28","fomc-2026-10-28","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","meta-2026-10-28-print","treasury-2y-frn-2026-10-28","uk-autumn-budget-2026-10-28","aapl-2026-10-29-print","amzn-2026-10-29-print","ecb-decision-2026-10-29","gdp-q3-2026-advance-2026-10-29","jgb-2y-auction-2026-10-29","nar-metro-home-prices-2026-10-29","pce-2026-10-29","treasury-7y-note-2026-10-29","boj-decision-2026-10-30","chicago-pmi-2026-10-30","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","g20-foreign-ministers-atlanta-2026-10-30","russell-style-month-end-capping-effective-2026-10-30","uk-blue-book-2026-10-30","uk-pink-book-2026-10-30","opec-plus-meeting-2026-11-01","construction-spending-2026-11-02","ism-manufacturing-2026-11-02","jgb-climate-transition-5y-auction-2026-11-02","sloos-2026-11-02","treasury-borrowing-estimates-2026-11-02","jolts-2026-11-03","m3-full-report-2026-11-03","midterm-elections-2026-11-03"],"adjacentStrongIds":["gdp-q3-2026-advance-2026-10-29","pce-2026-10-29","fomc-2026-10-28","eci-q3-2026-10-30"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Never a trade, and the useful content is a pre-committed measurement, not a level.**
On **2026-10-29 at 08:30 ET** the Dallas Fed publishes the Trimmed Mean PCE for **September
2026** — the first calendar month whose data the gauge computes entirely under the methodology
BEA's 2026-09-30 annual update puts in place (the sibling ledger
[`dallas-fed-trimmed-mean-2026-09-30`](dallas-fed-trimmed-mean-2026-09-30.md) covers the
*revision*; this one covers the first clean new month after it) — and it lands the month the
energy tail actually moved: EIA weekly regular gasoline ran **$4.071 (08-31) → $4.157 (09-07) →
$4.319 (09-14) → $4.478 (09-21)**, +10.0% in three weeks, while Brent spiked to **$108.75 (09-15)**
before retreating to **$99.39 (09-29)** — a genuine energy impulse that has **already diverged
from Brent's own path** by month-end. The trimmed mean is constructed to discard whichever PCE
components move furthest in either direction each month, so this is the cleanest three-way spread
this calendar can compute on one reference month: **headline** (gasoline fully in), **core**
(gasoline out, its pass-through partly in), **trimmed** (whatever moved furthest, out — usually,
but not provably yet for September specifically, gasoline). Measured fresh this session from FRED
(583 months, 1978–2026-07): the **headline-minus-trim wedge is 1.42pp in July, the 92.5th
percentile of 48 years**, clustering with 1980 and 2021–22 — both energy-shock episodes — and it
correlates at **r=0.822** with the headline-minus-core (food-and-energy) spread over the same
history. That correlation is the mechanism's own base rate, not a September-specific read: nobody
has published a September trimmed-mean estimate (checked today), and the reference month is
already half over with gasoline still climbing on the last data EIA has posted. **Stand aside every
horizon** — `symbols: []`, no macro-keyed playbook, and it publishes into an 08:30 minute shared
with confirmed **GDP advance** and **PCE** itself.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-30) | **Stand aside** | High | `symbols: []`, no macro-keyed house playbook, and the release is a derived statistic of a print 30 days out with a reference month not yet closed. | Nothing dated today — no instrument keys to this release |
| This week | **Stand aside — nothing between now and next week changes this print's content** | High | Its reference month (September) already closed 09-30; this week's tape (FOMC blackout, no meeting) adds nothing to what happened in September. | A Dallas Fed or BEA publication pre-announcing September's trim reading or the energy components' treatment |
| This month | **Pre-commit the read: a wide headline-trim wedge is the trim mechanism working, not evidence inflation is contained** | High | r=0.822 (n=583) between the headline-core spread and the headline-trim spread says a large chunk of the wedge is exactly the energy/food volatility the trim is designed to exclude — so a low trimmed-mean print alongside hot headline/core prints is the expected shape this month, not a contradiction to explain away. Registered as `FT-dallas-fed-trimmed-mean-2026-10-29-1`. | The September print showing the headline-trim wedge **narrower than 1.20pp** — i.e., the trim did NOT discard September's energy move the way the base rate predicts |
| This quarter | **Read alongside the sibling's finding: this gauge has been running abnormally low even net of the usual food/energy discount** | Medium | The sibling ledger's leg 2 found the **core**-minus-trim wedge (which nets out food and energy already) at the **95.7th percentile** of 48 years in July — higher than this doc's headline-core spread percentile (71.4th) for the same month. That gap-within-a-gap means the trim is reading unusually low for reasons beyond ordinary energy pass-through. | Core-minus-trim and headline-minus-trim wedges **both** falling back inside their 1978–2026 interquartile range by the **2026-12-23** PCE release, with no BEA methodology change — the current reading would be ordinary noise, not a regime |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this release.** `symbols: []`, no macro-keyed house playbook, and it shares its
  08:30 ET minute with confirmed high-impact `pce-2026-10-29` and `gdp-q3-2026-advance-2026-10-29`
  — its own tape contribution is unattributable by construction.
- **Read the wedge as the mechanism, not the level.** A trimmed mean far below headline/core in an
  energy-shock month is the trim discarding the shock as designed — the base rate (r=0.822 against
  the food-and-energy spread, n=583 months) says so, and treating a low trimmed print as "inflation
  is actually fine" repeats the same error the sibling ledger's leg 3 already documented the
  publisher warning against.
- **September closed 09-30, so nothing between now and 10-29 changes the print's content** — only
  its publication does. The one thing that could move it is a Dallas Fed methodology note (see kill
  switches).
- **Gasoline and Brent have already diverged within the reference month itself.** Retail gasoline's
  last three EIA readings (09-07/09-14/09-21) accelerated; Brent, after peaking 09-15, gave back
  most of the move by 09-29. The eventual September PCE energy contribution nets both, and this
  ledger does not yet know which dominates.
- **Watch (dated):** BEA's 09-30 annual PCE revision (sibling event) · FOMC 10-27–28 (no SEP) ·
  Q3 GDP advance + PCE + this release, all 08:30 ET **10-29** · ECI Q3 **10-30**.

## Initial research

### The question, plainly

On **2026-10-29 at 08:30 ET**, the Dallas Fed publishes the Trimmed Mean PCE for **September
2026** — the first month computed natively (not restated) under the methodology BEA's 2026-09-30
annual update establishes, for the reference month in which the energy tail this calendar has been
tracking since August actually moved. Does the trim discard that move the way the gauge is
designed to, and is there anything in the tape today that lets a session say more than "wait for
the print"?

**One-line verdict.** Nothing here is tradeable (`symbols: []`), and the honest content today is a
**pre-committed reading rule plus a measured base rate**, not a forecast of the level. The base
rate (r=0.822 between the headline-core spread and the headline-trim spread, 583 months) says a
wide headline-trim wedge in September is the trim mechanism functioning correctly under an energy
shock — not evidence of "underlying" calm the headline number is somehow overstating. What the
mechanism cannot yet say is the *number*, because September's reference month closed with gasoline
still accelerating on the last EIA reading available and Brent already reversing — the two inputs
that would let anyone estimate the net energy contribution have not agreed with each other in three
weeks.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies; `earnings-cycle.mjs` / `intraday-edges.mjs` were not run. Everything
below was fetched or computed fresh on **2026-09-29** unless cited otherwise.

**Primaries fetched directly today:** `dallasfed.org/research/pce` (July readings + release-date
rule, verbatim, unchanged from the 09-15 read this event's proposal cited), `bea.gov/news/schedule`
(the 10-29 08:30 "Personal Income and Outlays, September 2026" line plus the same-slot Q3 GDP
advance, verbatim), `eia.gov/petroleum/gasdiesel/` (weekly U.S. regular gasoline, three readings:
09/07 $4.157, 09/14 $4.319, 09/21 $4.478 — the page's own release date is 09-22, so 09/28 is not yet
posted as of this session), `federalreserve.gov/newsevents/2026-speeches.htm` (09-22 through 09-28,
three speeches — Jefferson 09-22 discount window/Treasury market functioning, Barr 09-23 cost of
shelter, Cook 09-28 AI and the economy — none touch inflation measurement).

**Computed this session, not quoted:** FRED CSV `PCETRIM12M159SFRBDAL` + `PCEPI` (headline index) +
`PCEPILFE` (core index), fetched direct, **583 paired monthly observations 1978-01 → 2026-07**.
Headline y/y is computed from index levels; it reproduces **3.70%** for July 2026, consistent with
the ~3.7% figure the sibling ledger records Warsh citing at Jackson Hole. Core y/y reproduces the
sibling's own **3.344%** (cross-check: independent computation, same join, same answer).

- **Headline-minus-trim wedge, July 2026: 1.42pp** (headline 3.70% − trim 2.28%) — **92.5th
  percentile** of 583 months. The ten widest wedges in the series cluster in **2021-11 → 2022-06**
  (max 2021-22 reading 2.58pp, headline 7.24%/trim 4.66%) and **1980-02/1980-03** (2.75–3.00pp,
  headline ~11.1–11.6%/trim ~8.35–8.6%) — the two oil-shock-adjacent episodes in the 48-year
  history, plus the current reading as the only 2020s-decade entry outside 2021-22.
- **Headline-minus-core spread, July 2026: 0.36pp** — only the **71.4th percentile** of the same
  583 months. This is the food-and-energy contribution measured directly, and it sits well below
  the headline-trim wedge's 92.5th-percentile reading for the identical month.
- **Correlation between the two series across all 583 months: r = 0.822.** A large headline-core
  spread predicts a large headline-trim wedge most of the time (r² ≈ 0.68) but not all of it — the
  trim also cuts volatile *core* components, and July 2026 is a month where the wedge runs wider
  than the food/energy contribution alone would predict, echoing the sibling ledger's independent
  finding (leg 2 there) that the core-minus-trim wedge itself sits at the 95.7th percentile.

**Secondaries fetched directly:** `clevelandfed.org` inflation nowcasting page — September 2026
nowcast, last updated **09-28**: headline PCE **+0.44% m/m / 3.97% y/y**, core PCE **+0.28% m/m /
3.49% y/y**; headline CPI +0.50% m/m / 3.57% y/y, core CPI +0.20% m/m / 2.39% y/y. Two weeks earlier
(per [`pce-2026-10-29`](pce-2026-10-29.md)'s 09-15 read of the same nowcast) headline PCE m/m stood
at **0.37%**; it has since risen to **0.44%** while core PCE m/m has held flat at **0.28%** — the
gap widening in exactly the direction an intensifying energy month would produce.

Oil: Yahoo Finance `BZ=F` (Brent front-month), daily closes fetched direct: **$89.31 (08-28) →
$94.65 (09-01) → $107.63 (09-10) → $108.75 (09-15, session peak) → $100.34 (09-21) → $99.25 (09-22)
→ $106.60 (09-24) → $99.39 (09-29)**. Volatility (VIX, Yahoo chart endpoint): **14.21 (09-22) →
15.18 (09-23) → 15.67 (09-24) → 14.87 (09-25) → 16.07 (09-28, last close before this session)** —
mid-range throughout, no regime break against the sibling ledger's 14.87–17.52 range this month.

**Siblings read as inputs and cited, never silently restated:**
[`pce-2026-10-29`](pce-2026-10-29.md) (the parent release this print is a derived statistic of, and
the source of the earlier gasoline/Brent readings this doc extends),
[`dallas-fed-trimmed-mean-2026-09-30`](dallas-fed-trimmed-mean-2026-09-30.md) (the revision-check
sibling — its leg 2/leg 3 findings on the core-trim wedge and the publisher's own skewness caveats
are the direct precedent this doc's headline-trim analysis extends to a second, independent wedge),
[`fomc-2026-10-28`](fomc-2026-10-28.md).

Attempted and not read: the Dallas Fed's linked "components included and excluded" trim workbook —
its URL resolves relative to the site root and a direct guess (`dallasfed.org/research/pce/2026/2607`)
404'd this session; the sibling ledger's own fetch of the equivalent page succeeded via a link
followed from the live PCE page rather than a guessed path. Not re-attempted here because the
workbook can only ever show a **past** month's classification (currently July's), and September's
component-level trim decisions do not exist until the 10-29 print — the thing this leg would want
to check is definitionally unavailable today. Flagged as the next session's first move (Honest
limits).

### Conviction legs, tested

1. **The date and slot are right — SUPPORTED at two primaries, re-verified today — and the status
   stays `estimate` for the same taxonomy-gap reason the sibling ledger already recorded.**
   `dallasfed.org/research/pce`, fetched fresh, is unchanged from the proposal's 09-15 read: July
   data, next release "Sept. 30," and the verbatim rule *"Updates to the Trimmed Mean PCE Inflation
   Rate follow BEA's release schedule for Personal Income and Outlays data."* `bea.gov/news/schedule`,
   fetched fresh, lists **"Personal Income and Outlays, September 2026"** at **8:30 AM** on
   **October 29**, in the same slot as **"GDP (Advance Estimate), 3rd Quarter 2026."** Two
   primaries, one date, no conflict, no change since the proposal. `CONFIRMED_PREFIXES` in
   `scripts/event-scan-validation.mjs` now includes `FRB:` (added by #3117, used to promote the
   sibling `dallas-fed-tssos-2026-09-29` event) — but that prefix anchors to a **dated Dallas Fed
   calendar table row**, and this event's date is still **derived** from a stated rule (Dallas Fed's
   PCE page names no dated calendar of its own release dates the way TSSOS does) rather than read
   off one, so the derivation-shape gap the proposal filed under stands independently of the
   taxonomy gap and this entry stays `estimate` on both grounds.

2. **The headline-minus-trim wedge is at a 48-year extreme, computed fresh this session —
   SUPPORTED.** See *Method* above: **1.42pp in July 2026, the 92.5th percentile** of 583 months
   since 1978, clustering with the two prior oil-shock-adjacent episodes (1980, 2021-22). This
   extends the sibling ledger's core-minus-trim finding (1.06pp, 95.7th percentile) to the headline
   side and cross-checks it: both wedges are near-extreme in the same month, which is consistent
   rather than coincidental — the trim is discarding a similar share of both the food/energy
   contribution and whatever volatile core components are also moving.

3. **The wedge correlates strongly, but not perfectly, with the literal food-and-energy
   contribution — SUPPORTED, computed fresh.** r = 0.822 (n=583) between headline-minus-core and
   headline-minus-trim. The imperfection is itself informative: July's headline-core spread (0.36pp,
   71.4th percentile) is measurably calmer than July's headline-trim wedge (1.42pp, 92.5th
   percentile) would predict from that correlation alone, meaning **some of what the trim is
   discarding this year is not food-and-energy at all** — the same conclusion the sibling ledger
   reached independently from the core-trim angle (the trim-list fetch there found legal services
   retained and moving inflation *up*, with the components that would lower it excluded from the
   trim). Composed together, two independently-computed wedges from two different ledgers now agree
   the trimmed mean is reading low for more than one reason.

4. **September is the reference month, and its two energy inputs have already diverged within the
   month — SUPPORTED, and this is the leg with no resolved sign.** EIA weekly retail gasoline
   accelerated for three straight readings (09/07 → 09/14 → 09/21: $4.157 → $4.319 → $4.478, +7.7%
   over two weeks) with the fourth week's reading not yet posted as of this session. Brent crude,
   the upstream input, peaked 09-15 at $108.75 and gave back most of that by month-end ($99.39,
   09-29) — a round trip the retail series has not (yet) reflected, consistent with the ordinary
   lag between crude and pump prices but leaving genuine uncertainty about September's *average*
   energy contribution to headline PCE. **No consensus, whisper, or September-specific nowcast for
   the trimmed mean itself was found** (checked today) — the Cleveland Fed nowcast covers headline
   and core only.

5. **The reading rule this doc pre-commits is the direct extension of the sibling ledger's
   difference-of-differences, applied to a new month instead of a revision — SUPPORTED,
   procedural.** Because September is the first month computed under the post-09-30 methodology
   with no restatement to net out, the clean comparison here is simpler than the sibling's: **read
   the headline-minus-trim wedge on the September print directly against July's 1.42pp anchor**,
   rather than needing a before/after split. A wedge that holds or widens is the trim doing what
   58 years of the food/energy relationship says it should during an energy month; a wedge that
   narrows materially (see kill switches) would be the genuine surprise, because it would mean
   September's price distribution was *not* dominated by an energy-tail outlier despite the retail
   gasoline data — worth investigating rather than dismissing.

### What the conditions support

**A pre-committed reading rule and a caution, not a forecast.** The rule (leg 5): read the
September headline-trim wedge against the 1.42pp July anchor, and treat a wide or widening wedge as
the trim mechanism correctly discarding an energy shock — not as evidence the "true" inflation rate
is calmer than headline or core suggest. The caution (legs 2–3, composed with the sibling ledger's
independent core-trim finding): this gauge has been running low for more than one reason this year,
so neither a market narrative built on "trimmed mean says inflation is under control" nor one built
on "headline says the shock is real, ignore the calm trimmed print" is fully supported without
reading the mechanism first. No position is opened, closed, or sized off this event — `symbols: []`,
no macro-keyed playbook, `estimate`-dated, and an 08:30 ET minute shared with confirmed GDP advance
and PCE itself.

### Honest limits

**The single highest-value thing this session did not do: read September's actual trim-component
classification.** It cannot be read before it exists — the Dallas Fed's "components included and
excluded" workbook only ever shows a past month, and September's trim decisions are computed at the
10-29 print. The next session on this ledger (the D-8 pulse, per cadence) should attempt the fetch
again once the URL is confirmed live from the site itself rather than guessed, and by then the
sibling ledger's own method (follow the link from the live PCE page rather than construct a path)
is the one to copy.

**September's own energy-contribution number is not computed here.** This doc has three of
(plausibly) four or five weekly EIA gasoline readings for the month and a Brent series that reversed
mid-month; averaging them into a single September energy read would be arithmetic this session chose
not to do, because the missing week(s) could move it either direction and a partial average stated
as if final would overstate precision. The 10-06 or next pulse should complete the average once
September's EIA weeks are all posted (expected by ~10-05).

**No trimmed-mean-specific consensus or nowcast exists.** The Cleveland Fed and every other nowcast
checked covers headline/core PCE and CPI, never the Dallas Fed's own measure — this is a standing
limit on every ledger in this family, not new here.

**The FRB: prefix precedent (leg 1) does not resolve this entry's taxonomy status**, because the
gap here is about date *derivation* (a stated rule, not a dated table row), which is a different
gap than the one #3117 closed. Recorded so the next session, or whoever revisits
`scripts/event-scan-validation.mjs`, has two named instances of two distinct gaps rather than
conflating them.

**Market reading is a single day's close for VIX and Brent** (2026-09-29 and 2026-09-28
respectively — the two feeds' last-available timestamps differed by one session at fetch time); no
source fetch failed this session and `probe-ref.blocked` is empty.

## Stance & kill switches

**Stance (event `estimate`-dated on a derivation-rule gap, not date doubt).** **Stand aside on every
horizon** — `symbols: []`, no macro-keyed house playbook, and nothing in this release is priceable.
The operative content is a **reading rule**, pre-committed before the number exists: on 10-29,
compare the published September headline-minus-trim wedge against **July's 1.42pp anchor**
(computed this session from FRED, 92.5th percentile of 583 months since 1978) and treat a wide or
widening wedge as the trim mechanism discarding an energy shock as designed, not as a signal the
"true" inflation rate is calmer than headline/core.

**The substantive caution composes with the sibling ledger's independent finding.**
[`dallas-fed-trimmed-mean-2026-09-30`](dallas-fed-trimmed-mean-2026-09-30.md) found the
**core**-minus-trim wedge at the 95.7th percentile in July; this ledger finds the **headline**-minus-trim
wedge at the 92.5th percentile the same month, correlating at r=0.822 with the literal food/energy
spread but running wider than that correlation alone predicts. Two independently-computed wedges
agreeing the gauge reads low for more than ordinary energy-tail reasons is stronger evidence than
either alone. Held at **Medium** confidence because the competing reading — that this is simply what
a trim is supposed to do in an energy-shock year, full stop — is the reading the gauge was designed
to support, and two data points (July, prospectively September) is not yet a trend independent of
the shock itself.

**The one leg with no resolved sign:** whether September's *net* energy contribution to headline PCE
ends up larger or smaller than July's, given gasoline's continued climb (through the last available
EIA reading, 09/21) against Brent's month-end reversal (09-29). This doc refuses to guess the
direction and registers the measurable wedge comparison instead (see forward tests).

**Kill switches.**

- **The September headline-minus-trim wedge printing below 1.20pp on 10-29** — narrower than this
  doc's base rate predicts; would mean September's price distribution was not dominated by an
  energy-tail outlier despite the retail gasoline data, and legs 2–5 need re-deriving.
- **A Dallas Fed or BEA publication before 10-29 giving a September-specific trim estimate or
  component preview** — would convert this doc's reading rule from a procedure into an early read.
- **The Dallas Fed adopting the recalibrated 19/20-trim alternative as its headline series** (the
  sibling ledger's leg 3 alternative measure) — changes what "the trimmed mean" means before this
  print exists.
- **Core-minus-trim and headline-minus-trim wedges both falling back inside the 1978–2026
  interquartile range by the 2026-12-23 PCE release with no methodology change** — the current
  reading would be ordinary noise, not a regime, and this quarter's call is wrong.
- **The 2026-10-29 release being suspended, re-dated, or published without a September reading** —
  voids the reading rule outright.

**Forward tests registered today:**
`FT-dallas-fed-trimmed-mean-2026-10-29-1` (the headline-trim wedge holds ≥1.20pp on the September
print) and `FT-dallas-fed-trimmed-mean-2026-10-29-2` (trimmed mean's own 1-month annualized reading
prints at or below 3.0% even as the Cleveland Fed's September headline PCE nowcast, 0.44% m/m,
implies a materially higher headline annualized rate) — see
[`forward-tests/dallas-fed-trimmed-mean-2026-10-29.md`](../forward-tests/dallas-fed-trimmed-mean-2026-10-29.md).
Zero capital by construction.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-29 | D-30 | **Initial research.** Canonical `src/domain/market-events/dallas-fed-trimmed-mean-2026-10-29.json` written this PR, superseding the inert `proposals/….from-pce-2026-10-29.json`. Date re-confirmed at two primaries fetched today (dallasfed.org/research/pce, bea.gov/news/schedule), unchanged from the 09-15 proposal; status stays `estimate` on a derivation-rule gap distinct from the `FRB:`-prefix gap #3117 closed for dated-table releases. **Core finding, computed fresh from FRED (583 months, 1978-01→2026-07):** headline-minus-trim wedge **1.42pp** in July 2026 = **92.5th percentile**; correlates r=**0.822** with the headline-minus-core (food/energy) spread, which itself sits only at the 71.4th percentile the same month — the gap-within-a-gap composes with the sibling ledger's independently-found 95.7th-percentile core-minus-trim wedge. **Adjacency sweep:** no peer prints (macro, `symbols: []`); macro — Cleveland Fed Sept nowcast (09-28) shows headline PCE m/m rising 0.37%→0.44% over two weeks while core PCE m/m holds flat at 0.28%; VIX **16.07** (09-28, mid-range, +1.20pt vs sibling's 09-22 read of 14.87, under the 3pt screen threshold); geopolitical/energy — EIA weekly gasoline $4.157(09-07)→$4.319(09-14)→$4.478(09-21), Brent peaked $108.75(09-15) then reversed to $99.39(09-29), the two inputs diverging within the reference month; Fed speeches 09-22→09-28 (Jefferson, Barr, Cook) — none touch inflation measurement. Corridor recomputed via `--on-date` across 10-24→11-03: **47 adjacent events**, 4 confirmed high-impact (`gdp-q3-2026-advance-2026-10-29`, `pce-2026-10-29`, `fomc-2026-10-28`, `eci-q3-2026-10-30`). **No new dated event discovered → no proposal filed.** | **Initial stance set:** stand aside every horizon; pre-commit the reading rule (compare September's headline-trim wedge against July's 1.42pp anchor; a wide/widening wedge is the mechanism working, not evidence of contained inflation). FT-1 and FT-2 registered. | 2026-10-06 (medium, 8+ band → 7d) |
| 2026-10-06 | D-23 | **Deterministic screen (no Claude session).** Readings — VIX 15.5 (-0.6pt since last), band unchanged (medium:8+), 47 adjacent event(s) tracked. Nothing tracked crossed its threshold. | — (screen; no assessment made) | 2026-10-13 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-dallas-fed-trimmed-mean-2026-10-29.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.

**Last assessed:** 2026-10-06
<!-- probe-ref: {"symbols":{},"vix":15.52,"daysBand":"medium:8+","adjacentIds":["aapl-2026-10-29-print","advance-economic-indicators-2026-10-28","amzn-2026-10-29-print","boj-decision-2026-10-30","case-shiller-hpi-2026-10-27","chicago-pmi-2026-10-30","construction-spending-2026-11-02","consumer-confidence-2026-10-27","dallas-fed-mfg-2026-10-26","dallas-fed-tssos-2026-10-27","durable-goods-2026-10-27","ecb-bank-lending-survey-2026-10-27","ecb-decision-2026-10-29","ecb-monetary-developments-2026-10-27","ecb-spf-q4-2026-10-30","eci-q3-2026-10-30","fhfa-hpi-2026-10-27","fomc-2026-10-28","g20-foreign-ministers-atlanta-2026-10-30","gdp-q3-2026-advance-2026-10-29","goog-2026-10-28-print","housing-vacancies-q3-2026-10-28","ism-manufacturing-2026-11-02","jgb-2y-auction-2026-10-29","jgb-climate-transition-5y-auction-2026-11-02","jgb-liquidity-enhancement-11-39y-2026-10-27","jolts-2026-11-03","m3-full-report-2026-11-03","meta-2026-10-28-print","midterm-elections-2026-11-03","msft-2026-10-27-print","mwts-benchmark-revision-2026-10-26","nar-metro-home-prices-2026-10-29","new-home-sales-2026-10-27","opec-plus-meeting-2026-11-01","pce-2026-10-29","russell-style-month-end-capping-effective-2026-10-30","sloos-2026-11-02","treasury-2y-frn-2026-10-28","treasury-2y-note-2026-10-26","treasury-5y-note-2026-10-27","treasury-7y-note-2026-10-29","treasury-borrowing-estimates-2026-11-02","treasury-buyback-20y30y-2026-10-27","uk-autumn-budget-2026-10-28","uk-blue-book-2026-10-30","uk-pink-book-2026-10-30"],"adjacentStrongIds":["eci-q3-2026-10-30","fomc-2026-10-28","gdp-q3-2026-advance-2026-10-29","pce-2026-10-29"],"screenStreak":1} -->
