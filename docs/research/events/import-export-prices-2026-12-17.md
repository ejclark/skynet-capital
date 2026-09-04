# U.S. Import and Export Price Indexes (Nov 2026 data) — import-export-prices-2026-12-17

**Kind:** macro-print · **Date:** 2026-12-17 (confirmed, BLS: bls.gov/schedule/news_release/ximpim.htm + bls.gov/schedule/2026/12_sched.htm — 08:30 ET, both fetched direct 2026-08-31) · **Impact:** low
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"low:15+","adjacentIds":["ppi-2026-12-15","pjm-capacity-auction-2026-12","opex-2026-12-18"],"screenStreak":0} -->

## At a glance

**TL;DR.** Stand aside at every horizon — this is a tier-3 print that has never moved this calendar's
tape on its own, and nothing here is tradeable. What makes it worth tracking is *what it measures*,
not what it prints: BLS states verbatim that the prices behind these indexes **"exclude duties"**
(bls.gov/mxp questions-and-answers, fetched today). That makes it the one official read on **who is
eating the tariff** — and the November reference month is the **fourth full month** under the tariff
regime that took effect **2026-07-24 12:01 ET**, when the Section 122 10% global surcharge expired by
statute and USTR's new **Section 301 duties of 10–12.5% on 60 jurisdictions** replaced it the same
minute. The early evidence says exporters are *not* absorbing: import prices from **China rose 0.8%
in July 2026 — the largest monthly increase since July 2008** — and 2.7% over the year, a sign-flip
from 2018–19, when prices for imports from China fell just 2.3% across eighteen months. Two honest
deflators keep this from being a thesis: the aggregate index is a **contaminated** pass-through gauge
(BLS's own "substitution effect"; an IMF paper dated 2026-07-17 finds duty-exclusive *aggregate*
prices fall on tariff hikes purely through reallocation to cheaper sources), and measured pass-through
into consumer prices is only **~26%** (NBER w35561, Amiti/Heise/Weinstein, July 2026), the indirect leg
taking 9–12 months. The hardest risk is not the number but **existence**: in the 2025 lapse this exact
release slipped **Oct 17 → Dec 3, 2025 (47 days)** — the worst measured slip on this calendar — and
October 2025's all-goods import and export indexes were **permanently suppressed**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-108; no consensus, whisper or implied move exists for a November reference month, and none will until December | Nothing at this distance |
| This week | **No action** | High | Three import/export prints (**09-16, 10-16, 11-17**) and two FOMC meetings sit between here and this date | A BLS reschedule, or an appropriations lapse announced, before **2026-09-06** |
| This month | **Watch 2026-09-16 as the first clean read on tariff incidence; treat 09-30 as an existence risk, not a macro event** | Medium | August 2026 is the first reference month entirely after the **07-24** Section 301 changeover; July's data straddles it | The **2026-09-16** print showing China locality prices at or below **0.0% m/m** — exporters absorbing after all. Separately, a CR or full-year bills enacted before **2026-09-30** retires the lapse branch |
| This quarter | **No new unhedged overnights across Dec 15 → Dec 18; read 12-17 as a tariff-incidence and PCE-goods cross-check, never a tradeable print** | Medium | PPI **12-15** → this print **12-17** → December triple witching **12-18** is one corridor | The **09-16 / 10-16 / 11-17** prints averaging **below ~0.2% m/m** on nonfuel imports — the pass-through impulse is spent and this doc's only live content goes with it |

**Signals & conditions** — the buy/sell/hold triggers:

- **The guard is the only deployable content (date confirmed)** — no new unhedged overnights across **2026-12-15 → 2026-12-18**; defer entries past the 12-17 open per E1.
- **Never** — a directional lean on this print. Low impact, duty-exclusive, and no measurable same-day reaction exists in this calendar's record.
- **The one series that matters** — import prices by **locality of origin** for China (release Table 7): **+0.8% m/m, +2.7% y/y** as of July 2026. Continued rises = exporters not absorbing Section 301.
- **Read nonfuel, not headline** — nonfuel imports **+4.5% y/y** (largest since June 2022) is the tariff-relevant number; headline **+5.9%** is fuel (**+25.2% y/y**) wearing a costume.
- **The contamination caveat, always attached** — an aggregate ex-duty *decline* can be reallocation to cheaper sources rather than absorption (BLS "substitution effect"; IMF WP, 2026-07-17).
- **Existence risk (dated)** — FY2026 funds lapse **2026-09-30**; the measured 2025 precedent for *this* release is a **47-day** slip plus a permanently suppressed October.
- **Recheck the primary each pulse** — bls.gov 403s to plain fetchers *and* to a bare UA header this session; a full browser header set (Accept / Accept-Language / Sec-Fetch-\*) returned 200.

## Initial research

**The question, plainly:** what will the November 2026 U.S. Import and Export Price Indexes show when
they print at 08:30 ET on **2026-12-17**, and does a low-impact release two days after PPI and one
morning before triple witching carry anything worth acting on?

**One-line verdict:** nothing tradeable and nothing that moves the tape — but the print is the
cleanest official measurement of **tariff incidence** the calendar carries, because BLS prices imports
*without* duties, and the November reference month is the fourth full month under a tariff regime that
only began on 2026-07-24; the honest output is a corridor guard, one series to watch, and a loud
existence risk.

**Method.** Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md)
(macro-print mode — no price instrument exists for it). Primary sources fetched **direct** this
session: bls.gov's import/export release schedule, its December-2026 monthly schedule, the full July-2026
news release and its technical note, the MXP questions-and-answers page, the January-2026 archived
release (November 2025 data), and the BLS lapse revised-dates page. A bare UA header was **not**
sufficient — every bls.gov page 403'd until a full browser header set was sent; that is a tooling
artifact, not a source problem, and the working recipe is banked in the kill switches. Academic and
policy sources (IMF, NBER, Penn Wharton, USTR-reporting) used for pass-through magnitudes and the
tariff timeline, each dated. Regime context inherited from the sibling [`ppi-2026-12-15`](ppi-2026-12-15.md)
and [`cpi-2026-12-10`](cpi-2026-12-10.md) ledgers.

### Leg 1 — the date. SUPPORTED, and flipped to `confirmed` this session.

Two independent BLS views agree. The by-release schedule (`bls.gov/schedule/news_release/ximpim.htm`)
lists "November 2026 | **Dec. 17, 2026** | 08:30 AM" as the last row of its 2026 table; the by-month
December schedule (`bls.gov/schedule/2026/12_sched.htm`) shows "U.S. Import and Export Price Indexes /
November 2026 / 08:30 AM" on Thursday the 17th. Both fetched today. The entry was filed `estimate` on
08-31 during the [`ppi-2026-12-15`](ppi-2026-12-15.md) research session, because the lane forbids an
adjacency sweep from confirming the event it just discovered; this is that event's own session with the
BLS primary in hand, which is exactly the condition the hard limit names, so the entry moves to
`confirmed` with a `BLS:` prefix. The same fetch pinned the whole 2026 series (Aug data → **Sep 16**,
Sep data → **Oct 16**, Oct data → **Nov 17**); the Oct-data print is proposed in this PR as
`import-export-prices-2026-11-17`, `estimate`, because it is the last observation this doc's read gets
before the print and every falsifier below leans on it. The Sep-16 and Oct-16 prints are cited as dated
observations without being added — a monthly tier-3 series does not earn four calendar entries.

### Leg 2 — the index excludes duties, and that is the whole reason to care. SUPPORTED (BLS primary, twice).

BLS states it plainly on its MXP questions-and-answers page, fetched today: *"The prices for the items
used to calculate the Import/Export Price Indexes **exclude duties**."* And again in its limitations
section: *"import price data exclude charges for duties."* The technical note gives the mechanism —
import prices are f.o.b. foreign port or c.i.f. U.S. port, export prices f.a.s. — and the *reason* is
national-accounting, not economics: the indexes deflate the net-trade component of GDP, and taxes are
excluded from net trade (BLS, "How tariffs relate to BLS import and export price indexes", Beyond the
Numbers Vol. 9 No. 6). The consequence is the useful part. A duty-inclusive index would just re-report
the tariff schedule. A duty-**exclusive** index reports what the *foreign seller* is charging, so its
movement is a direct read on **who bears the tariff**: if ex-duty prices hold or rise while duties go
up, the exporter is conceding nothing and the full wedge lands on U.S. importers and, eventually,
consumers. No other release on this calendar measures that.

### Leg 3 — the regime the November reference month sits inside. SUPPORTED (dated timeline).

The 2026 tariff structure was rebuilt twice this year, and both resets are inside the window this print
measures against:

- **2026-02-20** — the Supreme Court declares the IEEPA tariffs unconstitutional. Roughly **$166bn** of
  IEEPA collections became refundable; ~$100bn was certified for refund through July 2026 (Penn Wharton
  Budget Model, update dated 2026-08-10).
- **2026-02-24** — a **10% global surcharge under Section 122** of the Trade Act of 1974 takes effect.
  Section 122 caps at 15% and at **150 days** without Congressional extension. The U.S. Court of
  International Trade ruled against the administration's use of it in **May 2026**.
- **2026-07-24, 12:01 a.m. EDT** — Section 122 expires by operation of law; Congress did not extend.
  The same minute, **Section 301 duties of 10% to 12.5% ad valorem on 60 jurisdictions** (including all
  27 EU member states) take effect, with Brazil separately at 25%.
- **Still open** — USTR initiated Section 301 investigations on **2026-03-11** into structural excess
  capacity in 16 economies (China, EU, Singapore, Switzerland, Norway, Indonesia, Malaysia, Cambodia,
  Thailand, Korea, Vietnam, Taiwan, Bangladesh, Mexico, Japan, India); public hearings ran **May 5–8,
  2026**. No dated determination deadline was findable this session, so no calendar entry is proposed —
  but any action from these lands *inside* the reference window and is the largest undated wildcard here.

The measured effective tariff rate: **7.1%** as of June 2026, versus **2.3%** in January 2025 and a
2025 peak near 7.7% (Penn Wharton, 2026-08-10). The November print is therefore the fourth full month
(Aug · Sep · Oct · Nov) under the Section 301 structure, and the **2026-09-16** release covering August
is the first reference month entirely after the changeover — July's data straddles it.

### Leg 4 — are foreign exporters absorbing? MIXED, and it leans hard toward *no*.

From the July-2026 release (BLS primary, published 08-18, fetched in full today):

| Series | Jul 2026 m/m | Jul 2025 → Jul 2026 |
|---|---|---|
| All imports | **−0.4%** | **+5.9%** |
| Fuel imports | −7.2% | +25.2% |
| **Nonfuel imports** | **+0.4%** | **+4.5%** — largest since the year ended June 2022 |
| All exports | −1.3% | +8.2% |
| Imports **from China** | **+0.8%** — largest monthly rise since July 2008 | **+2.7%** |

Read the nonfuel line, not the headline: the −0.4% month is fuel (petroleum −7.5%), and the y/y +5.9%
is fuel too. Underneath, ex-duty prices charged by foreign sellers are rising at the fastest annual pace
in four years, and the China locality index — the one most directly exposed to the tariff wedge — just
posted its largest monthly gain in eighteen years. The contrast with the prior trade war is the finding:
BLS's own Beyond the Numbers chart records prices for imports from China falling **2.3%** across the
whole of June 2018 → December 2019, with exactly one monthly increase in the period. That is the shape
of exporters conceding. 2026 is the opposite shape.

It is also **not** an exchange-rate artifact. The dollar index sat at **99.62** on 08-31 against 97.77
twelve months earlier (~+1.9%), inside a 95.55–101.80 range — a firmer dollar should be pushing import
prices *down*. Econbrowser's 08-18 write-up of the same release makes the point sharply: with typical
exchange-rate pass-through of 0.30–0.35 and the dollar appreciating ~5.2% annualized over three months,
the model predicts near-zero import inflation, and non-petroleum import prices instead ran **+2.6%
annualized** over the three months to July. Their explanation is a shrug — changing foreign production
costs, or shifting U.S. demand. This doc adds the third candidate the timing fits: sellers pricing into
a tariff wedge they expect the buyer to eat.

**Why MIXED and not SUPPORTED:** July straddles the 07-24 regime change, so it is one month, half of it
under a different tariff structure, and the mechanism is inferred rather than measured. Leg 5 is the
reason it may never become SUPPORTED.

### Leg 5 — the index is a *contaminated* gauge of pass-through. SUPPORTED, and it is the honest limit on Leg 4.

BLS names the problem itself, in the same Beyond the Numbers article, as the **substitution effect**:
when a tariff takes effect, "the non-tariff component of a product's price may fall" — either because
the exporter cuts price *or* because "buyers switch to a lower cost replacement." Those two are
observationally identical in the aggregate index and mean opposite things about incidence. An IMF
working paper dated **2026-07-17** ("Tariff Pass-Through and Import Reallocation") separates them and
finds both live at once: at the **variety** level (country × product) duty-exclusive prices do *not*
adjust to tariffs — full pass-through at the border — while at the **product** level aggregate
duty-exclusive prices fall significantly, driven by within-product reallocation toward cheaper sources,
through the entry of low-priced varieties and the exit of high-priced ones.

The operational consequence for reading the 12-17 print: **a falling aggregate ex-duty index is not
evidence that exporters are absorbing**, and this doc will not read it that way. The locality-of-origin
series (Table 7) is the less contaminated cut — reallocation *between* countries shows up as a
composition shift across localities rather than inside one — which is why the China line and not the
all-goods line is the signal named in the header. BLS also flags a second confound in the other
direction: **stockpiling** ahead of an announced tariff raises prices before it takes effect.

### Leg 6 — what actually reaches CPI and PCE. MIXED (magnitudes are estimates, and small).

Imports are a small slice of consumption, so even a large ex-duty move arrives diluted. The measured
estimate: **~26% of a tariff increase passes through to consumer prices** (NBER w35561, Amiti, Heise
and Weinstein, July 2026), with the direct effect arriving fast — tariffs raise import prices almost
immediately — and the indirect effect taking **nine to twelve months** to travel supply chains.
Econbrowser's 08-18 verdict on the same data is blunt: "even with fast import price inflation,
estimates suggest a very muted pass through into either CPI or PCE." Both readings are consistent with
the sibling ledgers' picture of a wholesale-vs-consumer gap that has not closed — PPI final demand
**4.7%** y/y (July data) against CPI **3.4%** and core PCE **3.3%**
([`ppi-2026-12-15`](ppi-2026-12-15.md), 08-31).

The 9–12 month lag is the part with a date attached. The 2025 tariff round's indirect effect is landing
across late 2026; the 07-24 Section 301 round's indirect effect is a **mid-2027** phenomenon, well past
this print. So the 12-17 release is a *leading* read on 2027 goods inflation and at most a
same-quarter cross-check on the **12-23** Personal Income and Outlays release — never a nowcast of it
the way PPI is.

### Leg 7 — the reaction function is, honestly, nothing. Estimate.

No import/export price release in this calendar's record has produced a measurable same-day index
reaction, and the mechanism explains why: it prints at 08:30 ET *after* CPI and PPI have already set the
month's inflation narrative, it is not a Fed-cited series in the way PCE is, its headline is dominated
by fuel prices the market already observed in real time, and its tariff content is structural rather
than surprise-shaped. The filed `low` impact is correct and this session does not argue for raising it.
One overlay, and it is calendar mechanics rather than a market read: the print lands the morning before
**December triple witching (12-18)**, so anything it *did* move would arrive into stacked expiries and
index-rebalance flow. That is an argument for the corridor guard, not for expecting a reaction.

### Leg 8 — production risk, and this release carries the worst precedent on the calendar. SUPPORTED (BLS primary).

BLS's revised-dates page for the 2025 and 2026 lapses, fetched today, is specific about *this* release:
**U.S. Import and Export Price Indexes, September 2025 — previously scheduled Friday, October 17, 2025;
revised to Wednesday, December 3, 2025.** A **47-day** slip, worse than the 40 days the September-2025
PPI took (Oct 16 → Nov 25) and the worst measured on this calendar. The 2026 lapse was mild by
comparison and did not touch this release at all (its damage stopped at January-data CPI, Feb 11 → 13).

The delay is not the hard part. The **data loss** is. Because the indexes mix survey and non-survey
inputs, and BLS could not collect survey data during the 2025 lapse, "many U.S. Import and Export Price
Index values for October 2025 using primarily survey data will be suppressed for publication,
**including the all goods import and export index values**, and will not be available in the BLS
database" (BLS, November-2025 release, published 2026-01-15). That release consequently reported a
**two-month change** (September → November 2025) in place of the usual one-month change, and the
July-2026 release's Table A still carries the scar: blanks for October and November 2025 across all
imports, fuel, nonfuel, all exports and non-agricultural exports. Twelve-month comparisons survived —
the November 2025 y/y (+0.1%) did publish, so a November-2026 y/y has a base.

FY2026 funds lapse **2026-09-30**, and the chambers remain unreconciled (House CR to Dec 4, 220-205 on
07-23; Senate CR to Dec 11, 90-6 on 08-08 — re-checked 08-31 by the sibling PPI session, still
unreconciled). The 2025 lapse ran October 1 → November 12, 43 days. A repeat of that shape starting
09-30 would most likely suppress **October 2026** and force the 12-17 release to report a two-month
change — degrading the exact monthly series Leg 4 depends on, without deleting the print.

### Leg 9 — which tracked names carry the sensitivity. SUPPORTED (mechanism); magnitudes are estimates.

`symbols: []` — market-wide, so this is about our own book rather than a name-keyed trade. This print
has one genuinely name-specific line the other macro docs do not: **import capital goods prices rose
0.9% in July, driven by "computers, peripherals and semiconductors"** alongside industrial machinery
and civilian aircraft (BLS, July release). That is a direct read on the landed, pre-duty cost of
datacenter hardware. Ranked by exposure: **CRWV** first (debt-financed datacenter capex eats both the
hardware cost and the discount rate, and the **PJM capacity auction closes 12-15** in the same
corridor, making that a two-signal week for it), then the semis **NVDA / AVGO / MRVL** on imported
wafers and packaging, then **AAPL** (hardware COGS, Chinese and Indian assembly) and **AMZN** (retail
COGS across the whole 60-jurisdiction Section 301 list), then **MSFT / GOOG / META**, whose balance
sheets damp the channel.

**What the conditions support.** Guards only. No macro playbook exists in the house set — S1/S2/E1/S3/S4
and G1 are symbol- and earnings-keyed ([`multi-symbol-sweep.md`](../multi-symbol-sweep.md)). What
travels is S2's *shape* applied to a corridor: **2026-12-15 → 2026-12-18** is one known-date variance
window (PPI → import/export → triple witching), and E1 applies to the 12-17 open. Nothing directional.
The date is **confirmed**, so the guard is date-keyed; every incidence and pass-through read below is an
**estimate** and only widens caution.

**Honest limits.** No consensus, whisper or implied move exists for a November reference month at
D-108, and none will until December — this release rarely draws a published consensus at all. Leg 4
rests on **one** month of locality data that straddles the regime change, and Leg 5 explains why the
aggregate series may never settle the question. The ~26% pass-through figure is one paper's central
estimate, not a range this doc has interrogated. The tariff timeline in Leg 3 is assembled from
secondary reporting of USTR actions rather than from Federal Register notices read directly; the
Section 122 and Section 301 dates are consistent across four independent sources but were not verified
against the primary notices this session. Three prints (**09-16, 10-16, 11-17**), the midterms
(**11-03**), a possible lapse (**09-30**) and any Section 301 determination all intervene and can
rewrite this wholesale. Market readings: VIX **14.43** (08-28 close), DXY **99.62** and WTI **$85.03**
(08-31 mid-session, indicative).

## Stance & kill switches

**Stance (date confirmed, BLS primary, two independent views 2026-08-31).** No position, no directional
lean, and no expectation of a tradeable reaction at any horizon — the `low` impact tier is correct. The
deployable content is the **corridor guard**: no new unhedged overnights held across **2026-12-15 →
2026-12-18** (PPI → this print → triple witching), entries deferred past the 12-17 open per E1. This
guard is the tail of the wider Dec 4–18 window the sibling [`ppi-2026-12-15`](ppi-2026-12-15.md) doc
sets, not a second one.

The analytic content, all **estimate**: this is the calendar's only official measurement of **tariff
incidence**, because BLS prices imports ex-duty, and the November reference month is the fourth full
month under the **07-24 Section 301** structure (10–12.5% on 60 jurisdictions). The working read is
that foreign exporters are **not** absorbing — China locality prices +0.8% m/m in July, the largest
since July 2008, versus a 2.3% *decline* across the entire 2018–19 episode; nonfuel imports +4.5% y/y,
the most since June 2022; and a firmer dollar arguing the other way. That read is deliberately held as
a working hypothesis rather than a conclusion, because Leg 5's reallocation confound means the
aggregate index cannot distinguish absorption from source-switching. What follows for the book is
small and slow either way: ~26% reaches consumer prices, the indirect leg on a 9–12 month lag, which
puts the 07-24 round's consumer effect in **mid-2027**, not in this print.

The nearest-term risk is not the number. It is **whether the reference month survives** a 2026-09-30
appropriations lapse — the precedent for this exact release is a 47-day delay *and* a permanently
suppressed month.

**Kill switches:**

- **Date/source** — a BLS reschedule, or the two schedule views disagreeing on a later fetch, kills the
  header date. Re-fetch each pulse with a full browser header set; a bare UA header 403s on bls.gov as
  of 08-31, and a 403 is a tooling failure, never evidence.
- **Date/production** — an appropriations lapse from **2026-09-30** threatens the reference month, not
  just the release day: the measured precedent is Sep-2025 data slipping **Oct 17 → Dec 3, 2025 (47
  days)** with October 2025's all-goods indexes permanently suppressed and a two-month change published
  in place of a one-month. Retired by a CR or full-year bills enacted before 09-30.
- **The no-absorption read** — killed if the **09-16, 10-16 or 11-17** prints show China locality prices
  at or below 0.0% m/m for two consecutive months, or nonfuel import prices averaging below ~0.2% m/m
  across the three. Weakened, not killed, by a single soft month.
- **The incidence framing itself** — dies if BLS changes the duty treatment, or if a court action
  unwinds the Section 301 duties the way SCOTUS unwound IEEPA on 2026-02-20; the CIT's adverse May-2026
  ruling on Section 122 shows this regime's legal base is not settled.
- **The regime-continuity assumption** — a Section 301 determination out of the 2026-03-11 excess-capacity
  investigations (16 economies) landing before November changes what the reference month measures. No
  dated deadline was findable, so this is watched, not scheduled.
- **The "no reaction" read** — killed if any of the 09-16 / 10-16 / 11-17 prints produces an NDX move
  ≥0.5% or a >3bp front-end repricing attributable to it, which would say the tier is filed too low.
- **Corridor guard** — a calendar fact, not a market read; stands unless the 12-15 or 12-18 dates move.

Registered as **FT-27** in [`forward-tests.md`](../forward-tests.md): the no-absorption read, scored
2026-12-18.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-108 | Initial research banked (above). **Date flipped `estimate` → `confirmed`:** two independent BLS views fetched direct — `schedule/news_release/ximpim.htm` ("November 2026 \| Dec. 17, 2026 \| 08:30 AM") and `schedule/2026/12_sched.htm` (import/export prices, November 2026, 08:30 AM on the 17th). Filed `estimate` on 08-31 by the [`ppi-2026-12-15`](ppi-2026-12-15.md) sweep only because the lane forbids self-confirming a just-discovered event; this is its own session with the primary in hand. **Framing set — this is a tariff-incidence gauge, not an inflation print:** BLS states verbatim that the prices "exclude duties" (MXP Q&A + limitations section, both fetched today), and the reason is national-accounting (the indexes deflate net trade in GDP, which excludes taxes — BLS *Beyond the Numbers* Vol. 9 No. 6). A duty-**exclusive** index measures what the foreign seller charges, i.e. **who bears the tariff**. **Regime the reference month sits in:** SCOTUS struck the IEEPA tariffs **2026-02-20** (~$166bn refundable, ~$100bn certified through July — Penn Wharton 08-10); a Section 122 10% global surcharge ran **02-24 → 07-24** and expired by statute at its 150-day cap (CIT had already ruled against it in May); **Section 301 duties of 10–12.5% on 60 jurisdictions** took effect **07-24 12:01 ET**, Brazil 25% separately. Effective rate **7.1%** (Jun-2026) vs 2.3% (Jan-2025). November is the **4th full month** under Section 301; the **09-16** print (Aug data) is the first clean one. **Evidence, BLS July release (fetched in full):** all imports −0.4% m/m / **+5.9% y/y**; fuel −7.2% / +25.2%; **nonfuel +0.4% / +4.5% y/y — largest since Jun-2022**; exports −1.3% / +8.2%; **imports from China +0.8% m/m, largest monthly rise since July 2008, +2.7% y/y**. Contrast: BLS's own BTN chart has China import prices *falling* **2.3%** across Jun-2018 → Dec-2019. Not an FX artifact — DXY **99.62** (08-31) vs 97.77 a year ago; Econbrowser 08-18 notes 0.30–0.35 normal FX pass-through and a ~5.2% annualized dollar gain, yet non-petroleum import prices ran +2.6% annualized over 3 months. **Held as MIXED because of the contamination caveat:** BLS's "substitution effect" and an IMF WP dated **2026-07-17** both show aggregate duty-exclusive prices can fall purely via reallocation to cheaper sources (full pass-through at the variety level, reallocation at the product level) — so a falling all-goods index is *not* evidence of absorption; the locality-of-origin cut is the less contaminated read. **Transmission is small and slow:** ~**26%** of a tariff increase reaches consumer prices, indirect leg **9–12 months** (NBER w35561, Amiti/Heise/Weinstein, Jul-2026), putting the 07-24 round's consumer effect in mid-2027 — this is a 2027 leading read, not a 12-23 PCE nowcast. **Production risk — the hardest finding, and worse than PPI's:** BLS's lapse page has Sep-2025 import/export slipping **Oct 17 → Dec 3, 2025 (47 days)**, the worst on this calendar; the Jan-2026 release records that October 2025's **all-goods import and export index values were permanently suppressed** and published a **two-month** (Sep→Nov) change instead, with Table A still blank for Oct/Nov 2025. Nov-2025 y/y (+0.1%) did publish, so a Nov-2026 y/y has a base. **Adjacency sweep.** Peers: n/a (`symbols: []`). Macro: Warsh's 08-28 Jackson Hole framing is the standing regime (better-than-expected prints explicitly discounted); wholesale-vs-consumer gap unclosed — PPI 4.7% vs CPI 3.4% / core PCE 3.3%. Vol: **VIX 14.43** (08-28 close) — 2026 low, no regime shift. Geopolitical: the tariff timeline above *is* this event's geopolitics; WTI **$85.03** (08-31), Hormuz still shut, mildly disinflationary for the goods leg. Event tape: none formable at D-108; this release rarely draws a published consensus at all. **Watched but not scheduled:** USTR's **2026-03-11** Section 301 excess-capacity investigations into 16 economies (hearings May 5–8) — no dated determination deadline findable, so no calendar entry proposed. **One dated adjacency found and proposed same-PR as `estimate`:** **`import-export-prices-2026-11-17`** (Oct-data print, 08:30 ET) — the last observation before this one and the date every falsifier here leans on. Sep-16 and Oct-16 cited as dated observations without entries; a tier-3 monthly series does not earn four. **Tooling note for the next pulse:** bls.gov 403s to a bare UA header now — a full browser header set (Accept / Accept-Language / Sec-Fetch-\*) is required. **FT-27 registered** on the no-absorption read, score-by 2026-12-18. | — (stance set) | 2026-09-30 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
