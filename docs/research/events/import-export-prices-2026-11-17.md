# U.S. Import and Export Price Indexes (Oct 2026 data) — import-export-prices-2026-11-17

**Kind:** macro-print · **Date:** 2026-11-17 (confirmed, BLS: bls.gov/schedule/news_release/ximpim.htm ("October 2026 | Nov. 17, 2026 | 08:30 AM") + bls.gov/schedule/2026/11_sched.htm ("U.S. Import and Export Price Indexes / October 2026 / 08:30 AM", Tuesday the 17th), both fetched direct 2026-08-31) · **Impact:** low
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":14.43,"daysBand":"low:15+","adjacentIds":["opex-2026-11-20","ppi-2026-11-13"],"screenStreak":0} -->

## At a glance

**TL;DR.** Stand aside — and know that **the number this release normally leads with does not exist.**
BLS permanently suppressed **864 of 1,625** import/export price indexes for the **October 2025**
reference month after the 2025 lapse, *including the all-goods import and export indexes*; the BLS
public database confirms it (series `EIUIR`/`EIUIQ` jump 2025-M09 → 2025-M11 with no M10). This is
the release whose 12-month comparison lands on that hole, so the headline "import prices up X% over
the past year" line has no base observation. What survives — the m/m, the locality indexes, the
levels — is the more useful half anyway, because of a methodology fact that **inverts the naive
read**: BLS import prices **exclude duties**. A rising duty-exclusive index means foreign exporters
are *raising* pre-tariff prices, not absorbing the tax. And they are: nonfuel import prices ran
**+4.5% y/y in July 2026**, the highest since June 2022, with prices for imports **from China +0.8%
m/m — the largest monthly rise since July 2008**. BLS's own 2018–19 trade-war study measured the
opposite (imports from China **−2.3%** over Jun-2018 → Dec-2019). The dollar does not explain it
(DXY ~99.6 today vs ~99.8 in Oct 2025, ~2% *stronger* y/y). Date is **confirmed**; the tier is
honestly **low** — these indexes deflate net trade in **GDP**, not PCE, so there is no channel into
the 12-09 FOMC. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-78) | **Stand aside** | High | `symbols: []`, D-78, no October-data consensus exists, and no house playbook is macro-keyed | Nothing dated today; the read is reassessed, not traded |
| This week | **Watch the CR reconciliation, not the tape** | High | Whether October 2026 gets collected at all is decided by appropriations; the House (Dec 4) and Senate (Dec 11) versions still differ | A single CR enacted before **2026-09-30**, which retires the existence branch |
| This month | **Read the 2026-10-16 print (Sep data) — it is the last clean y/y before the hole** | Medium | Sep 2025 exists (`EIUIR` 140.8), so 10-16 still carries a real 12-month rate; 11-17's cannot | The **2026-10-16** release showing nonfuel import y/y *falling* below ~4.0%, which would end the six-month acceleration this doc is built on |
| This quarter | **Read the m/m and the China locality index, never the y/y** | Medium | The 12-month base is permanently suppressed, and the duty-exclusive m/m is what actually measures pass-through | The **2026-11-17** release publishing a 12-month all-imports percent change anyway — i.e. BLS bridged the suppressed base (registered as **FT-28**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** initiate on this print: `symbols: []`, `low` tier, and no macro-keyed house playbook (S1/S2/E1/S3/S4 + G1 are symbol/earnings-keyed).
- **Never** hold anything whose payoff *requires* this print while no FY2027 CR is signed — for this series a lapse **destroys data**, it does not delay it.
- **The existence branch (dated).** No CR by **2026-09-30** → expect the October-2026 release cancelled and roughly half the October indexes permanently suppressed, exactly as in 2025.
- **The inversion to remember.** Import prices exclude duties → a *falling* index is evidence of foreign absorption; a *rising* one says buyers pay tariff on top of a rising base.
- **The pass-through trigger (estimate).** Nonfuel import y/y above **5.0%** at the 10-16 print would be the highest since **May 2022** (5.95%) and the strongest goods-pass-through read of this cycle.
- **The corridor (dated).** Midterms 11-03 · jobs 11-06 · CPI 11-10 · Veterans Day 11-11 (bonds closed, equities open) · PPI 11-13 · **this print 11-17, 08:30 ET** · opex 11-20 · PCE 11-25 · FOMC + SEP 12-09.
- **Most exposed if it moves anything** — an inherited, estimate-labeled duration ranking, not measured per-symbol: CRWV, then NVDA/AVGO/MRVL, then the mega-caps. AMZN is the one name with a direct channel (imported goods cost, air freight **+23.4% y/y**).

## Initial research

### The question

Will the October-2026 U.S. Import and Export Price Indexes be published on 2026-11-17, what will they
show, and — landing four days after PPI, three sessions before monthly opex, and 22 days before an
FOMC carrying an SEP — does a `low`-tier trade-price release carry any signal for our nine tracked
AI-infra / mega-cap names?

### One-line verdict

The date is confirmed, the tier is correctly `low`, and the release's *headline* 12-month number
almost certainly cannot be printed because the 2025 lapse permanently deleted its base month — but
the surviving m/m series is the single cleanest duty-exclusive measure of tariff pass-through this
calendar tracks, and it is running at a six-month acceleration the sibling ledgers have not noticed.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) (macro-print mode —
no price instruments exist for this kind). Five BLS primaries fetched **direct** this session: the
import/export release schedule, the November-2026 monthly schedule, the July-2026 news release
(Table A and Table 1), the 2025/2026 lapse revised-dates page, and the two MXP shutdown notices. All
403 to plain fetchers and to WebFetch; a full browser header set (UA + `Sec-Fetch-*` + `sec-ch-ua`)
returns 200 — the same tooling artifact [`ppi-2026-11-13`](ppi-2026-11-13.md) recorded today. Index
levels come from the **BLS public data API** (`api.bls.gov/publicAPI/v1`, series `EIUIR`, `EIUIQ`,
`EIUIREXFUELS`), which is how the missing month was verified rather than inferred. Market levels are
Yahoo daily closes pulled with the same probe helper `event-material-scan.mjs` uses. Regime context
(Warsh, the CR) is inherited from the sibling ledgers and re-checked.

### Leg 1 — the date. SUPPORTED, and flipped `estimate` → `confirmed` this session.

Two independent BLS views agree. The by-release schedule
(`bls.gov/schedule/news_release/ximpim.htm`) reads "October 2026 | **Nov. 17, 2026** | 08:30 AM", and
the by-month November schedule (`bls.gov/schedule/2026/11_sched.htm`) puts "U.S. Import and Export
Price Indexes / October 2026 / 08:30 AM" on **Tuesday the 17th**. The entry was filed `estimate` on
08-31 by the [`ppi-2026-11-13`](ppi-2026-11-13.md) session that discovered it, purely because the
lane forbids an adjacency sweep from confirming the event it just found; this is that event's own
research session with both primaries in hand — exactly the condition the hard limit names. Promoted
with a `BLS:` prefix.

The same fetch also fixes the release's ordinary rhythm: this series is the **caboose** of each
month's inflation sequence, not a leading read. Aug-2026 data → Sep 16 · Sep-2026 data → **Oct 16** ·
Oct-2026 data → **Nov 17** · Nov-2026 data → Dec 17, each one landing after that cycle's CPI and PPI
have already been traded.

### Leg 2 — THE material finding: the year-ago base does not exist. SUPPORTED (BLS primary + public API).

BLS's MXP shutdown notice (`mxp/notices/2026/2025-federal-government-shutdown-impact-mxpi.htm`,
last modified 2026-01-15, fetched today) is unambiguous:

> "BLS did not publish an all goods import or export price index for October 2025. Of 1625 regularly
> published U.S. Import and Export Price Indexes, **761 are published and 864 are suppressed**."

And the companion notice states the suppression is **permanent**: "October 2025 data for the 864
import and export price indexes listed below will be permanently suppressed from publication."
Verified independently against the BLS public data API rather than taken on the notice's word —
`EIUIR` (all imports) runs `2025-M09: 140.8 → 2025-M11: 141.2` with **no M10 observation**, and
`EIUIQ` (all exports) runs `153.0 → 153.7` the same way. The hole is real and it is in the database,
not just the news release.

**Why that lands on this print specifically.** A 12-month percent change needs the year-ago level.
Reading the release calendar against the hole:

| Release | Reference month | Base month it needs | Base exists? |
|---|---|---|---|
| 2026-10-16 | Sep 2026 | Sep 2025 (`EIUIR` 140.8) | **yes** — last clean y/y |
| **2026-11-17** | **Oct 2026** | **Oct 2025** | **no — permanently suppressed** |
| 2026-12-17 | Nov 2026 | Nov 2025 (`EIUIR` 141.2) | **yes** |

So this is a **one-month blackout in the headline year-over-year rate**, and it falls on exactly this
release. BLS's stated publication rule points the same way — "One-month percent changes for October
and November 2025 are not available… Twelve-month percent changes for October 2025 are not
available… where data are missing" — and Table A of the current release already shows the mechanism
working, with `-` in the October and November 2025 rows for all imports, fuel, nonfuel, all exports
and nonagricultural exports (only *agricultural* exports carries values, because it is built from
nonsurvey data BLS could acquire retroactively).

**The honest uncertainty, stated up front.** BLS *does* hold internal October-2025 estimates: the
notice says missing prices were imputed by cell-mean imputation and then recalculated by **linear
interpolation** once November prices arrived, precisely so "the usually published data series
[can] continue forward." Those estimates are suppressed from publication, not deleted. So BLS
*could* publish an Oct-2025→Oct-2026 change without disclosing the suppressed level. Their stated
rule says they will not. That fork is genuinely open, it is mechanical, and it is dated — which is
why it is registered as **FT-28** rather than asserted.

**The contrast with the neighbours, which cuts three different ways.** This calendar now holds three
measured lapse outcomes for the same October 2025 reference month, and they are not the same
outcome: [`cpi-2026-11-10`](cpi-2026-11-10.md) records CPI's data **destroyed** (in-person
collection, unrecoverable); [`ppi-2026-11-13`](ppi-2026-11-13.md) records PPI's release **cancelled
but its data collected late and published** two months on; and this series sits **in between** — BLS
recovered the nonsurvey half (761 indexes) and permanently lost the survey half (864), including
every headline. Copying either sibling's framing here would be wrong.

### Leg 3 — the interpretive key: these indexes exclude duties, which inverts the naive read. SUPPORTED (BLS primary).

The single most useful thing in this document. From BLS's own *Beyond the Numbers* study, "How
tariffs relate to BLS import and export price indexes" (Kevin M. Camp, vol. 9 no. 6, May 2020,
fetched today):

> "**Tariffs are not included in the prices used to calculate the U.S. Import and Export Price
> Indexes.**"

The reason is national-accounts consistency: these indexes deflate the **net trade component of
GDP**, taxes are not part of net trade, so duty must be excluded to match. The consequence for
reading the print is the inversion:

| What the index does | What it actually means |
|---|---|
| **Falls** after a tariff | Foreign exporters cut pre-duty prices — they are **absorbing** the tax |
| **Flat** | Neither side moved the pre-duty price; the buyer eats the whole duty |
| **Rises** | Exporters are **raising** pre-duty prices — the buyer pays the duty **on top of a rising base** |

BLS spells the arithmetic out: "if a 10-percent duty were placed on an imported item and the foreign
company absorbed half of the tariff… the duty-exclusive indexes produced by BLS would show
approximately a 5-percent price decline." So a *rising* nonfuel import price index during a tariff
regime is a **hawkish** goods-pass-through datapoint, not a neutral one — and it is the opposite of
the headline most readers will take from "import prices up."

### Leg 4 — and the index is rising, hard, with six straight months of acceleration. SUPPORTED (BLS primary).

From the July-2026 release (USDL-26-1410, published 2026-08-18, fetched today) and the public API:

| Measure | Jul 2026 m/m | 12-mo (Jul 25 → Jul 26) |
|---|---|---|
| All imports | −0.4% | **+5.9%** |
| Fuel imports | −7.2% | +25.2% |
| **Nonfuel imports** | **+0.4%** | **+4.5%** — highest since **June 2022** (4.6%) |
| All exports | −1.3% | +8.2% |
| Nonagricultural exports | −1.5% | +8.5% |

The nonfuel 12-month rate, computed from `EIUIREXFUELS`: **1.46 → 2.15 → 2.46 → 3.07 → 3.76 → 4.24 →
4.46** for Jan through Jul 2026. Six consecutive months of acceleration off a ~0.3–0.8% base through
2025. Read through Leg 3, that is a duty-exclusive series saying exporters are not absorbing.

**The sharpest single observation, and it is BLS's own comparison to invert.** In July 2026, prices
for **imports from China rose 0.8% m/m — the largest monthly increase since July 2008** (+2.7%
y/y). BLS's tariff study measured the *first* trade war directly: "From June 2018 to December 2019,
prices for imports from China to the United States **decreased 2.3 percent**… Prices for imports
from China recorded only one monthly increase over the period." Same duty-exclusive index, same
country, opposite sign. Whatever else is true, the 2018–19 absorption pattern is not repeating.

Two details worth carrying for our own book: import **capital goods +0.9%** in July, driven by
"computers, peripherals and semiconductors" — the AI-infra input line — and import **air freight
+23.4% y/y**, which is AMZN's cost curve.

### Leg 5 — the dollar is not the explanation. SUPPORTED (measured this session).

The standard objection to any import-price move is currency. It does not survive here. DXY monthly
closes: **Oct 2025 ~99.80**, **Aug 2025 ~97.77**, **today ~99.61** (08-31 intraday, Yahoo
`DX-Y.NYB`). The dollar is **flat** against the base month of this print's comparison and roughly
**2% stronger** year-over-year — which, if anything, *depresses* dollar-denominated import prices.
The +4.5% nonfuel rise happened despite a mild FX headwind, not because of a tailwind. Caveat
stated: DXY is a six-currency basket and most US imports are invoiced in dollars, so this eliminates
FX as the *primary* driver rather than measuring an elasticity.

### Leg 6 — base arithmetic: unlike PPI, there is no wedge. SUPPORTED as arithmetic, MIXED as a forecast.

[`ppi-2026-11-13`](ppi-2026-11-13.md)'s central mechanical finding was a 0.6pp base-effect wedge
opening between two headline measures. **That framing does not transfer**, and checking rather than
assuming is the point of this leg. The 2025 months rolling out here were nearly flat: nonfuel
`EIUIREXFUELS` ran Aug **129.8** · Sep **129.8** · (Oct suppressed; linear interpolation between Sep
and Nov gives **~130.15**, which is the same method BLS used internally) · Nov **130.5**. A flat base
means the 12-month rate tracks incoming monthlies close to one-for-one — no mechanical wedge to
anticipate, in either direction.

Running the three paths from Jul-2026's 135.8, against a ~130.15 base:

| Aug–Oct 2026 pace | Oct 2026 level | Implied nonfuel 12-mo |
|---|---|---|
| 0.00%/mo (flat) | 135.8 | **+4.3%** |
| +0.37%/mo (last 3 months' average) | 137.3 | **+5.5%** |
| +0.51%/mo (2026 six-month average) | 137.9 | **+6.0%** |

Central read ~**+5.0–5.5%**, which would be the highest nonfuel import inflation since **May 2022**
(the last month above 5.0%, at 5.95%). Two caveats, stated because they matter: the base is an
interpolation of a month that does not exist, and — the recursive part — **if BLS dashes the 12-month
line per Leg 2, this projection can only be scored off index levels, never off the printed rate.**
That is why the registered forward test is the publication question, not the level.

### Leg 7 — existence risk, and for this series it is the destroy-class. SUPPORTED (BLS primary).

Same structure as the neighbours: the FY2027 deadline is **2026-09-30**, and October 2026's
collection window opens **10-01**, the first day of any lapse. The measured 2025 outcome for *this
series* is on the BLS lapse page:

| Reference month | Originally scheduled | What happened |
|---|---|---|
| September 2025 | Fri 2025-10-17 | Delayed to **2025-12-03** (47 days) |
| **October 2025** | **Tue 2025-11-18** | **Canceled** — and ~half the indexes permanently suppressed |
| November 2025 | Tue 2025-12-16 | Delayed to **2026-01-15** (30 days) |
| December 2025 | Thu 2026-01-15 | Delayed to **2026-02-10** (26 days) |
| January 2026 | Wed 2026-02-18 | Delayed to **2026-03-05** (15 days) |
| February 2026 | Tue 2026-03-17 | Delayed to **2026-03-25** (8 days) |

Recovery ran **five months** — the March-2026 reference month (Apr 15) was the first back on ordinary
cadence. A lapse is not a one-print event for this series either. The dated consequence if funds
lapse again: **two consecutive Octobers with no all-goods index**, which would extend the y/y
blackout through the 2027-11 release and leave a two-year gap in the cleanest duty-exclusive
pass-through series the calendar has.

**Funding status, carried and re-checked (`NEWS:`-grade).** House passed H.R.9770, a clean CR to
**Dec 4**, 220–205 on 07-21; Senate passed its own to **Dec 11**, 90–6 on 08-08; the House took up
the Senate text on **08-31**. Base case is that a lapse is averted, but the two chambers still carry
different expiration dates and nothing is signed.

### Leg 8 — the tariff architecture itself is NEWS-grade and deliberately not built on. MIXED.

Press and trade-advisory reporting describes a large 2026 restructuring: SCOTUS striking the IEEPA
tariffs **2026-02-20**; a 10% global Section 122 tariff effective **2026-02-24** for its 150-day
statutory maximum; that authority lapsing **2026-07-24** with a Section 301 action replacing it;
Section 232 and pre-existing 301 duties untouched throughout. **No primary was verified this
session** — the Federal Register API returned live 2026 trade actions (a Section 232 unmanned-aircraft
proclamation 08-19, a Canadian alcohol duty suspension 08-24) but no clean confirmation of the
122→301 transition, and the transition's secondary sources are commercial tariff-advisory sites, the
exact aggregator class this calendar was burned by once already. So it is recorded as an **open
question for the next pulse**, not a leg anything rests on.

It does, however, sharpen one testable structure. The July 2026 reference month **straddles
2026-07-24**. If the record China jump is a one-off level shift from a duty coming off — exporters
reclaiming pre-duty price room while the buyer's landed cost stays flat — then Aug/Sep/Oct m/m
should normalise. If it is persistent pass-through, they keep rising. The **October reference month
is the third full month after that transition**, which is the cleanest window this calendar has for
telling the two apart.

### Leg 9 — the reaction function, and why `low` is the right tier. SUPPORTED (structural).

This is where copying the PPI sibling's "the tier is understated" flag would have been wrong.
Import/export price indexes have **no channel into PCE** — BLS states their role plainly: deflating
the **net trade component of GDP**. So this print does not feed the 11-25 PCE, and the 12-09 FOMC's
inflation picture (CPI 11-10 → PPI 11-13 → PCE 11-25) is closed before it without reference to it.
Its real transmission is to **real net exports in Q4 GDP**, whose advance estimate lands in late
January 2027 — a quarter past the events this calendar is watching.

Add the queue position from Leg 1 — it is the last inflation-adjacent release of each monthly cycle,
arriving after CPI and PPI have set the narrative — and the honest conclusion is that **`low` is
correct and should stay**. What the print carries is *informational* value for a specific question
(is the tariff being absorbed abroad?), not *repricing* value. Rarity is not impact.

One micro-structure note: the print is a **Tuesday**, three sessions before monthly opex **11-20**,
inside the same 11-06 → 11-20 known-date variance window the sibling ledgers already guard.

### Leg 10 — which tracked names carry the sensitivity. Inherited, estimate-labeled.

`symbols: []` — market-wide, so the ranking is the same duration-reasoned one the CPI/PPI/FOMC
siblings carry, not measured per-symbol: **CRWV** most exposed, then **NVDA / AVGO / MRVL**, then
**MSFT / GOOG / META**, then **AAPL / AMZN**. This print inverts the last pair's ordering on its own
narrow terms: **AMZN** is the one tracked name with a *direct* line item here (imported goods cost,
and import air freight **+23.4% y/y**), and the import **capital goods +0.9%** line — computers,
peripherals and semiconductors — is the AI-infra build cost. That is a cost-curve observation, not a
trade.

### What the conditions support

Nothing directional. No house playbook is macro-keyed
([`multi-symbol-sweep.md`](../multi-symbol-sweep.md): S2 and E1 were the only universal survivors),
and this is a `low`-tier print with no channel to the decision downstream of it. What travels is S2's
*shape* applied to the already-guarded **2026-11-06 → 2026-11-20** corridor, which this print sits
inside. The deliverable content of this research is three items, all of them subtractions from what a
reader would otherwise assume: **the headline y/y almost certainly will not print** (Leg 2); **a
rising index is hawkish, not neutral, because duties are excluded** (Leg 3); and **the tier is right
and the PPI sibling's "understated tier" flag does not transfer**, because this series deflates GDP
net trade rather than feeding PCE (Leg 9). The one addition is a calendar entry: the **2026-10-16**
print, proposed in this PR, is the last release before the base-month hole.

### Honest limits

- **No October-data consensus, whisper or implied move exists at D-78**, and none will until
  November. A fact about the calendar, not a research gap.
- **Leg 2's central claim is an inference from a stated rule, not a BLS commitment.** BLS said
  12-month changes *for October 2025* are unavailable; it has not said what it will do with the
  Oct-2025→Oct-2026 comparison, and it holds suppressed interpolated estimates that would let it
  publish one. That is exactly why FT-28 exists.
- **Leg 6 is arithmetic on an interpolated base month that does not exist**, testing direction only.
- **Leg 5 eliminates FX as a primary driver; it does not measure an elasticity**, and DXY is a
  six-currency basket against a mostly dollar-invoiced import bill.
- **Leg 8 is unverified `NEWS:`-grade** and nothing rests on it.
- **The reaction function is asserted structurally, not measured.** No event study of import-price
  release days exists in this repo, and this print has never been tracked here before.
- **VIX 14.43 and the equity indices are 08-28 closes** (08-31 was mid-session at fetch);
  Brent/WTI/DXY are 08-31 marks.
- **Three CPI prints, an election, two FOMC meetings and a funding deadline intervene**, any of which
  can rewrite this doc wholesale.

## Stance & kill switches

**Stance (date `confirmed`; two BLS primaries fetched direct 2026-08-31).** No position and no
directional lean at any horizon; the tier is `low` and correctly so. The deployable content is
**three reading rules**, not a trade. First, **expect no 12-month headline** — the base month is
permanently suppressed, so read the m/m, the index levels and the locality indexes. Second, **read a
rising duty-exclusive index as hawkish**: BLS excludes tariffs, so a rise means exporters are not
absorbing and US buyers pay duty on top of a rising base. Third, **the corridor guard already in
force** — no new unhedged overnights across **2026-11-06 → 2026-11-20** — covers this print; it adds
nothing of its own. Working read (**estimate**, no consensus exists at D-78): nonfuel import prices
continue accelerating, with the 12-month rate implied at **+4.3% to +6.0%** depending on the Aug–Oct
pace and centred ~**+5.0–5.5%**, which would be the highest since May 2022 — scoreable only from
index levels if the printed rate is dashed.

**Kill switches:**

- **The existence branch** — no CR signed by **2026-09-30** → expect this release cancelled and ~half
  the October-2026 indexes permanently suppressed, per the measured 2025 outcome. Retired by a single
  CR or full-year bills enacted before 09-30. Check on 09-30.
- **The publication read is wrong if** the **2026-11-17** release prints a 12-month all-imports or
  all-exports percent change — BLS would have bridged the suppressed base, and the "the headline does
  not exist" framing collapses. Registered as **FT-28**, scored 2026-11-18.
- **The pass-through read dies if** the **2026-10-16** print (Sep 2026 data) shows nonfuel import
  y/y **falling below ~4.0%**, ending the six-month acceleration — the whole Leg-4 story is that
  streak, and one clean reversal breaks it. Check on 10-16.
- **The duty-exclusive inversion (Leg 3) is methodology, not opinion** — it dies only if BLS changes
  the treatment of duties in these indexes, which would appear as an MXP notice at
  `bls.gov/mxp/notices/`. Check each pulse.
- **The "one-off level shift" alternative** — if Aug and Sep 2026 nonfuel m/m come in at or below
  **+0.1%**, July's record China jump was the 07-24 duty transition reclaiming price room rather than
  persistent pass-through, and Leg 4 needs re-argument rather than extension.
- **The tier read (Leg 9) is wrong if** an import/export release day in this cycle produces an NDX
  move ≥1% or a >5bp front-end repricing — which would say the tape is trading it as a first-tier
  print. Check at the **10-16** release.
- **Corridor guard** — a calendar fact, not a market read; stands unless the 11-13, 11-17 or 11-20
  dates move.

Registered as **FT-28** in [`forward-tests.md`](../forward-tests.md): the 12-month publication
question, scored 2026-11-18.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-78 | Initial research banked (above). **Date flipped `estimate` → `confirmed`:** two independent BLS primaries fetched direct — `schedule/news_release/ximpim.htm` ("October 2026 \| Nov. 17, 2026 \| 08:30 AM") and `schedule/2026/11_sched.htm` (Tuesday the 17th, 08:30). **The material finding:** BLS's MXP shutdown notice (mod. 2026-01-15) says **864 of 1,625** indexes have October 2025 **permanently suppressed**, *including the all-goods import and export indexes*; verified independently in the BLS public API — `EIUIR` runs 2025-M09 **140.8** → 2025-M11 **141.2** with no M10, same for `EIUIQ` and `EIUIREXFUELS`. This release is the one whose 12-month comparison needs that month, so its headline y/y likely cannot print (10-16 and 12-17 are unaffected). Honest fork: BLS holds *suppressed interpolated* Oct-2025 estimates and could bridge — registered as **FT-28**, scored 2026-11-18. **Three-way lapse contrast now on the record for the same reference month:** CPI data destroyed · PPI release cancelled but data published late · MXP **half recovered, half permanently lost**. **The interpretive key (BLS primary, *Beyond the Numbers* vol. 9 no. 6):** these indexes **exclude duties**, so a rising index means exporters are *not* absorbing — buyers pay tariff on top of a rising base. And it is rising: nonfuel import y/y **+4.5%** (Jul 2026), highest since Jun 2022, after six straight months of acceleration (1.46 → 4.46); imports **from China +0.8% m/m, largest since July 2008**, against BLS's own 2018–19 measurement of **−2.3%** over Jun-2018→Dec-2019. **FX eliminated:** DXY ~99.6 today vs ~99.80 Oct-2025 and ~97.77 Aug-2025 — flat-to-2%-stronger, a headwind not a tailwind. **Tier: `low` is CORRECT and was checked, not copied** — these indexes deflate GDP **net trade**, not PCE, so there is no channel into the 12-09 FOMC; the PPI sibling's "understated tier" flag does **not** transfer. **Adjacency sweep.** *Peers:* n/a (`symbols: []`); AMZN is the one tracked name with a direct line (import air freight **+23.4% y/y**), and import capital goods +0.9% (computers/peripherals/semis) is the AI-infra cost line. *Macro:* Warsh's 08-28 Jackson Hole keynote is the standing regime, September hike odds ~57.5% (CME FedWatch, carried). *Vol:* **VIX 14.43** (08-28 close), SPX 7711.76, NDX 29433.43, 10Y **4.72%** — baseline set, nothing to diff against yet. *Geopolitical/energy:* Brent **$89.95**, WTI **$84.99** (08-31) — up from Brent $87.84 on 08-26; fuel imports are +25.2% y/y so energy is the headline swing factor, while nonfuel is the signal. *Policy (`NEWS:`-grade, NOT built on):* SCOTUS struck IEEPA tariffs 02-20; a 10% Section 122 global duty ran 02-24 → its 150-day limit on **07-24**, reportedly replaced by a Section 301 action. No primary verified — Federal Register API returned live 2026 trade actions (Sec-232 UAS 08-19, Canada alcohol suspension 08-24) but not this transition. Open question for the next pulse. Note the July reference month **straddles 07-24**, so Aug/Sep/Oct m/m distinguish a one-off duty-transition level shift from persistent pass-through. *Existence risk:* FY2027 deadline **09-30**; House CR to Dec 4 (220–205, 07-21), Senate CR to Dec 11 (90–6, 08-08), House took up the Senate text 08-31 — base case averted, branch live. 2025 precedent for this series: Sep-2025 slipped 47 days, **Oct-2025 canceled**, recovery ran five months to the Mar-2026 reference month. *Event tape:* no October-data consensus or whisper at D-78 (checked, not asserted). **One dated adjacency found and proposed same-PR as `estimate`:** **`import-export-prices-2026-10-16`** (Sep-2026 data, 08:30 ET Friday — the **last clean 12-month read before the base-month hole**, and the check date for two of this doc's kill switches). Also read off the November primary but **not** proposed, as outside the 5-day corridor or not market-moving: Productivity & Costs (P) Q3 **11-05**, JOLTS Sep-data **11-03**, Employer-Reported Injuries **11-18**, State Employment **11-20**, JOLTS Oct-data **12-01**. **Flagged for a human, not actioned:** `forward-tests.md` now carries **three FT-25 rows, two FT-26 and two FT-27**, collided by parallel matrix legs registering on the same day — an append-only ledger with non-unique ids; this session used **FT-28** and the same collision risk applies. Worth a `/retro`, out of scope here (the [`ppi-2026-11-13`](ppi-2026-11-13.md) row flagged it too — two independent sightings now). | — (stance set) | 2026-09-30 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
