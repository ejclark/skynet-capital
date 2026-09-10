# UK GDP monthly estimate, November 2026 — the last activity read the February MPR gets, and the quietest month of the twelve — uk-gdp-monthly-2027-01-15

**Kind:** macro-print · **Date:** 2027-01-15 (estimate, EST: — ons.gov.uk/releases/gdpmonthlyestimateuknovember2026, re-fetched direct 2026-09-10, "Release date: 15 January 2027 7:00am" / "This release is not yet published"; the label is a taxonomy gap — `market-events-data.ts` has `BLS:`/`BEA:`/`CENSUS:` and no slot for the ONS) · **Impact:** low
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"low:15+","adjacentIds":["eia-steo-2027-01-12","fomc-blackout-start-2027-01-16","mlk-market-closure-2027-01-18","opex-2027-01-15","tic-monthly-2027-01-19","treasury-10y-note-2027-01-12","treasury-20y-bond-2027-01-20","treasury-30y-bond-2027-01-13","treasury-3y-note-2027-01-11","treasury-coupon-announcement-2027-01-14","uk-cpi-2027-01-20","uk-labour-market-2027-01-19","uk-ppi-2027-01-20","vix-expiration-2027-01-20","wef-davos-annual-meeting-2027-01-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside, and the interesting part is why.** This is the first canonical UK
monthly-GDP entry on the calendar, and the research says two things that pull against each other.
The **placement is unusually load-bearing**: six ONS release pages fetched today fix the ladder —
October data on 11 December, November data on 15 January, December data plus the Q4 first
*quarterly* estimate on 12 February — and the Bank of England's own dates page puts its February
Monetary Policy Report on **4 February 2027**. So the Q4 outturn arrives **eight days after** the
forecast round, this is the **only** monthly GDP print between the December and February
announcements, and the MPR's Q4 number is a nowcast with this print as its last input. But
**what the print adds is small and measurable**: reconstructing the Q4 read available at each
stage across eleven post-2013 ex-COVID Q4s, knowing October gets you R² **+0.549** / MAE
**0.161pp**, and knowing November as well gets you R² **+0.810** / MAE **0.124pp** — it roughly
halves the remaining error *variance* while moving the central estimate by about **0.04pp**. It is
confirmatory, not directional. And November is structurally the **quietest month of the twelve**
in this series: m/m standard deviation **0.195pp**, rank 1 of 12, against October's 0.396 and
December's 0.401, the two widest. Add zero exposure — `symbols: []`, no UK listing among the ten
tracked names, no gilt or sterling leg in any house playbook — and the honest call at every
horizon is a refusal. The date is `estimate` on taxonomy grounds, not date doubt, and an estimate
widens caution; it never licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | high | 127 days out, `symbols: []`, and the only tracked names are ten US mega-caps with no sterling leg — there is nothing here to express | A UK-listed or sterling-keyed name enters the tracked roster before 2027-01-15, or a house playbook gains a gilt/GBP leg (grep of `trade-playbooks.md` and `multi-symbol-sweep.md` returned zero on 2026-09-10) |
| This week | **Stand aside** | high | The week's actual UK activity datum is the **July 2026** monthly print on **2026-09-11** (ONS page fetched 2026-09-10), not this one; it changes nothing about a January release | The 2026-09-11 bulletin is not titled "GDP monthly estimate, UK: July 2026", which would break the release-ladder rule this ledger's whole placement argument rests on |
| This month | **Stand aside** | high | The next real fork is the **5 November 2026** MPC and Monetary Policy Report round (BoE dates page, fetched 2026-09-10) — nothing before it reprices a 15 January print | The Bank moves Bank Rate off **3.75%** at the **17 September 2026** announcement with guidance that makes the February 2027 forecast round live, which would raise this print's tier above `low` |
| This quarter | **Watch, do not size** | medium | The one thing worth tracking is whether the **11 December 2026** October print lands far enough from trend that the Q4 nowcast is already in play before this release; the measured ladder says October carries most of the information | The 2026-12-11 October m/m prints outside **±0.40pp** (only 2 of 11 post-2013 ex-COVID Octobers did), which would make the January print a genuine swing factor rather than a confirmation |

**Signals & conditions** — the buy/sell/hold triggers:

- **No entry at any size, at any horizon, on this event.** `symbols: []` and the date is `estimate`.
- **Tier review trigger:** a UK-listed or sterling-keyed name entering the tracked roster, or any house playbook gaining a gilt/GBP leg — until then `low` is not conservatism, it is the absence of a transmission path.
- **Placement kill:** the ONS moving the Q4 first quarterly estimate off **12 February 2027** (it is the one date here the publisher itself labels *provisional*) to on-or-before **4 February 2027** — that alone retires the "the MPR's Q4 number is a nowcast" claim.
- **Distribution kill:** the November 2026 m/m printing outside **±0.45pp** on 2027-01-15 — eleven of eleven post-2013 ex-COVID Novembers stayed inside it.
- **Revision discipline:** treat the 15 January number as provisional in every later row. 43 of 44 monthly values first estimated since January 2023 have already been revised, median 19.0 months out.

## Initial research

**The question.** This is the first canonical UK monthly-GDP entry this calendar has carried. Two
things need settling before any later pulse can be terse: *what is this release, mechanically* —
its reference period, its release rule, what else ships beside it — and *is there any reading of
it that reaches a position we could hold*. The proposer ([`uk-cpi-2027-01-20`](uk-cpi-2027-01-20.md),
2026-09-09) framed it as "the activity half of the February MPR's data run-in." That framing is
right and it is also weaker than what the release calendar actually supports.

**One-line verdict.** The placement claim is stronger than proposed and the market claim is
weaker: this is the **only** monthly GDP print between the Bank's December and February
announcements and the last input to a Q4 figure whose outturn publishes eight days *after* the
February Monetary Policy Report — but the print itself adds R² and almost no level, lands in the
statistically quietest month of the twelve, and touches nothing we hold. **Stand aside; research
it for the calendar, not for a position.**

**Method.** Six ONS release pages and the Bank of England's upcoming-MPC-dates page fetched direct
on 2026-09-10 (HTTP 200 each, no blocked sources). Series work on two independent precisions of
the same ONS data so a rounding artefact cannot carry a finding: the **1dp** `ECY2` monthly GDP
index via the ONS timeseries API (`MGDP` dataset, 1997 JAN → 2026 JUN, last updated 2026-08-12),
and the **4dp** workbook *Monthly GDP and main sectors to four decimal places*
(`monthlygdpto4dp.xlsx`, 1997 JAN → 2026 FEB). Every statistic below is post-2013 and drops
2020–2021 entirely; COVID months would dominate any dispersion measure and tell us nothing about a
2026 November. No instrument scripts were run — `symbols: []`, so `earnings-cycle.mjs` and
`intraday-edges.mjs` have no ticker to take.

### Leg 1 — the release ladder, and what publishes beside this print — **SUPPORTED**

Six ONS release pages, all fetched direct 2026-09-10, all HTTP 200, all reading "This release is
not yet published":

| Reference month | Release page reads | Days after month end |
|---|---|---|
| July 2026 | "Release date: 11 September 2026 7:00am" | 42 |
| August 2026 | "Release date: 15 October 2026 7:00am" | 45 |
| September 2026 | "Release date: 12 November 2026 7:00am" | 43 |
| October 2026 | "Release date: 11 December 2026 7:00am" | 41 |
| **November 2026** | **"Release date: 15 January 2027 7:00am"** | **45** |
| December 2026 | "Release date: 12 February 2027 7:00am" | 43 |

The rule is stable and worth stating once so no later pulse re-derives it: **UK monthly GDP for
reference month M publishes on the 11th–15th of M+2, at 07:00 London / 02:00 ET.** There is no
Christmas distortion to allow for — November's 45-day gap is the same as August's.

Two further pages settle what ships alongside. `gdpfirstquarterlyestimateukjulytoseptember2026`
reads "Release date: 12 November 2026 7:00am" — the same morning as the September monthly print.
`gdpfirstquarterlyestimateukoctobertodecember2026` reads **"Provisional release date: 12 February
2027"** — the same morning as the December monthly print. So the ONS pairs the quarter's first
estimate with the third month's monthly bulletin, and note the publisher's own distinction in
wording: every monthly page above carries a plain *"Release date"*, while the Q4 quarterly page
carries *"Provisional release date"*. The monthly slot is firm on the ONS's own labelling; the
quarterly one is not.

### Leg 2 — the placement against the February MPR is tighter than "the activity half" — **SUPPORTED**

`bankofengland.co.uk/monetary-policy/upcoming-mpc-dates`, fetched direct 2026-09-10 (HTTP 200),
lists under **2026 confirmed dates** "Thursday 5 November — November MPC Summary and minutes and
November Monetary Policy Report" and "Thursday 17 December — December MPC Summary and minutes",
and under **2027 provisional dates** "Thursday 4 February — February MPC Summary and minutes and
February Monetary Policy Report". The same page states current Bank Rate **3.75%**, next due
17 September 2026.

Laying leg 1's ladder against those dates gives three facts, none of them inference:

1. The **11 December 2026** October print lands **before** the 17 December announcement — the
   December MPC has it.
2. The **15 January 2027** November print is the **only** monthly GDP release between the
   17 December and 4 February announcements.
3. The **12 February 2027** Q4 first quarterly estimate lands **eight days after** the February
   Monetary Policy Report.

Point 3 is the one the proposer did not have, and it is what upgrades the framing. The February
2027 MPR is a *forecast round*, and at the moment it publishes **no ONS outturn for 2026 Q4
exists**. Whatever Q4 GDP figure that Report carries is a nowcast built on two monthly readings —
October's and this one's. That is a statement about publication order, which these pages settle
outright; it is *not* a claim about how the MPC weights the datum, which they cannot settle and
which [FT-uk-gdp-monthly-2027-01-15-1](../forward-tests/uk-gdp-monthly-2027-01-15.md) registers
rather than asserts, scored on the day-for-day replica seventy days from now.

### Leg 3 — what the print actually adds to that nowcast is small, and it is measurable — **MIXED**

The 4dp workbook lets the nowcast be reconstructed at each stage. For each post-2013 ex-COVID Q4
(n = 11), the quarter's q/q growth is the average of its three monthly index levels over the
previous quarter's; the estimate *available* at a given date replaces the months not yet published
with a flat carry of the last one known. Comparing each stage's estimate against the eventual
outturn:

| What is known | Corresponds to | R² vs actual Q4 q/q | MAE |
|---|---|---|---|
| Nothing of Q4 (September carried forward) | before 11 Dec 2026 | **−0.561** | 0.332pp |
| October | after the 11 Dec 2026 print | **+0.549** | 0.161pp |
| October **and November** | **after the 15 Jan 2027 print** | **+0.810** | 0.124pp |

Actual Q4 q/q has standard deviation 0.317pp across those eleven quarters; the worst two-month
error was 0.255pp. So the November print takes R² from +0.549 to +0.810 — it removes roughly
**half the remaining error variance** — while cutting mean absolute error by only **0.037pp**.
Both readings are true and they are why this leg is MIXED rather than SUPPORTED: the print
genuinely *tightens* the Q4 nowcast the February MPR is built on, and it almost never *moves* it.
A datum that halves your uncertainty around a number you had already broadly right is
confirmatory. It is a good reason to read the release and a bad reason to size anything.

**Honest limit, stated rather than buried.** This is computed on the *current* vintage of the
monthly series, not on the real-time vintages that existed at each release. In real time October
and November are themselves provisional (leg 5), so the live uncertainty is strictly wider than
0.124pp. The ranking of the three stages is robust to that; the absolute MAEs are a floor.

### Leg 4 — November is the quietest month of the twelve, and the pairwise version of that fails — **MIXED**

Monthly m/m growth by calendar month, 4dp workbook, post-2013 ex-COVID (n = 11 or 12 per month;
overall n = 134, mean +0.149pp, sd 0.314pp), sorted by dispersion:

| Month | sd of m/m | mean m/m | Month | sd of m/m | mean m/m |
|---|---|---|---|---|---|
| **NOV** | **0.195** | +0.076 | SEP | 0.317 | +0.134 |
| AUG | 0.197 | +0.040 | APR | 0.323 | +0.204 |
| FEB | 0.243 | +0.379 | JUN | 0.363 | +0.190 |
| MAR | 0.255 | +0.024 | **OCT** | **0.396** | +0.155 |
| MAY | 0.267 | +0.140 | **DEC** | **0.401** | +0.081 |
| JUL | 0.274 | +0.122 | JAN | 0.280 | +0.213 |

November is **rank 1 of 12** — the tightest month in the UK monthly GDP calendar — and it sits
directly between the two widest. Mean absolute m/m is **0.166pp** in November against **0.328pp**
in October and **0.371pp** in December: a typical November move is about *half* its neighbours'.
The 1dp `ECY2` series reproduces the ranking independently (NOV 0.217, OCT 0.396, DEC 0.404), so
this is not a rounding artefact of either precision. The eleven Novembers: 2013 −0.048, 2014
−0.023, 2015 −0.100, 2016 +0.448, 2017 +0.174, 2018 +0.101, 2019 −0.322, 2022 +0.051, 2023 +0.281,
2024 +0.087, 2025 +0.185 — **all eleven inside ±0.45pp**.

**And here is where the leg goes MIXED, because the obvious next step does not survive.** The
tempting reading is "November is quieter than its own October." That is a coin flip: |Nov m/m| <
|Oct m/m| in **5 of 11** years. The hits cluster where October was large (2013, 2014, 2015, 2022,
2023) and the misses where October was already small (2017, 2018, 2024, 2025) — mean reversion,
not a November property. Against December the pairwise test does hold, 9 of 11, but that print is
outside this event's close-out window and cannot be scored here. So the honest form of this
finding is **distributional and never a per-year forecast**, and the only version registered as a
forward test is the ±0.45pp band, which the whole sample satisfies.

Services (the ~80% weight) tell the same story a little more weakly: November is third-tightest at
sd 0.239 behind August 0.188 and May 0.233, with October (0.398) and December (0.356) again the
noisiest pair. Whatever is quiet about November survives at the sector level; it is not one
volatile component being netted out.

### Leg 5 — the number published on 15 January is provisional by construction — **SUPPORTED**

Every observation in the `ECY2` timeseries carries an `updateDate`. Taking each month's first
estimate as roughly the 15th of M+2 (leg 1's rule) and comparing: of the **44** months first
estimated since January 2023, **43 (98%)** carry a later revision in the current vintage. Median
lag from first estimate to the *last recorded* update is **577 days (19.0 months)**; the maximum
in the window is 1,004 days. The update dates themselves cluster on 15 January, 15 April, 15 July
and 12 August — the quarterly national-accounts and Blue Book cycle, not the monthly one.

The practical consequence for every later row on this ledger: the m/m and 3m/3m figures printed on
2027-01-15 are an early estimate that will move, most of it more than a year later. Any pulse that
quotes the number should quote it as of a vintage date.

### Leg 6 — is there any position here? — **REFUTED**

Ten symbols are tracked in `src/domain/earnings-calendar.ts`: AAPL, AMZN, AVGO, CRWV, GOOG, META,
MRVL, MSFT, MU, NVDA. All ten are US-listed and US-reporting. A case-insensitive search for
`gilt`, `sterling`, `GBPUSD` and `GBP` across `docs/plans/trade-playbooks.md` and
`docs/research/multi-symbol-sweep.md` returned **nothing** — no house playbook has a rates or FX
leg of any kind, let alone a UK one. There is no instrument in this book through which a UK
monthly GDP surprise reaches a position, and none of the five house playbooks (S1/S2/E1/S3/S4 or
G1) takes a macro input at all.

This is the leg that fixes the tier. `low` here is not caution about a UK print's importance — in
its own market it is the most timely activity read there is. It is the **absence of a transmission
path**, and it would change the day a sterling- or gilt-keyed name entered the roster.

### The corridor around 15 January 2027

Fifteen tracked events fall within five days. The shape worth noting is that **2027-01-15 is
itself US opex** (`opex-2027-01-15`), the US week is shortened by `mlk-market-closure-2027-01-18`,
the Fed's pre-meeting blackout opens `2027-01-16`, and the UK stacks **three** releases into the
following week — labour market on the 19th, CPI and PPI on the 20th. This print opens that UK run
rather than closing it. `vix-expiration-2027-01-20` and the 3y/10y/30y/20y Treasury slate complete
the corridor. None of it changes this ledger's call; it is recorded so the next pulse's adjacency
sweep starts from a known baseline.

### Adjacency sweep and the calendar this lane fed back

Two dated releases discovered in this research are load-bearing for the findings above and were
not on the calendar in any form. Both are proposed in this PR as `estimate`, proposer-owned:

- **`uk-gdp-quarterly-first-2027-02-12`** — the Q4 2026 first quarterly estimate (ONS page reads
  *"Provisional release date: 12 February 2027"*), shipping the same morning as the December
  monthly print. It is the **outturn that adjudicates** leg 3's nowcast and the reason leg 2's
  eight-day gap exists.
- **`uk-gdp-monthly-2026-12-11`** — the October 2026 monthly print. It is the **prior state** in
  leg 3's ladder and the last UK GDP read the 17 December 2026 MPC sees.

**One naming divergence, flagged and deliberately not resolved.** A sibling lane proposed the same
release family one day later under the opposite prefix:
`proposals/uk-monthly-gdp-2026-10-15.from-uk-blue-book-2026-10-30.json` (the August 2026 print,
15 October 2026). This lane's id was fixed as `uk-gdp-monthly-*` by its own proposer on 2026-09-09
and matches the `uk-cpi-`/`uk-ppi-`/`uk-labour-market-` convention; the sibling's file is not this
lane's to rename or delete (docs/process/EVENT-RESEARCH.md: *never write another event's canonical
file, and never delete another lane's proposal*). Both ids and both dates are recorded here and in
this event's `notes` so whoever reconciles the family has the evidence in one place. The two
proposals above use `uk-gdp-*` for internal consistency with this canonical entry.

### Honest limits

- **The 4dp workbook served on 2026-09-10 ends at 2026 FEB**, while the 1dp timeseries runs to
  2026 JUN. Every dispersion and nowcast statistic above is therefore computed through 2025 at
  worst, which covers all eleven Novembers and all eleven Q4s in the window — but it means the
  4dp results carry no 2026 data. The 1dp cross-check, which does include 2026 H1, agrees on every
  ranking.
- **Leg 3's R² ladder uses current-vintage data**, not real-time vintages. Its stage *ordering* is
  robust; its absolute MAEs are a lower bound (see leg 5).
- **No consensus, whisper or implied-move data was sought.** For a `low`-tier print with
  `symbols: []` there is no options surface to read and no sell-side consensus this book would act
  on; claiming one would be decoration.
- **Nothing here says the MPC *weights* this print.** Legs 1–2 establish publication order only.
  The incorporation question is registered as FT-1, not asserted.
- **The date is `estimate`.** The ONS labels the slot firm; the label here is a taxonomy gap plus
  this lane's no-self-confirm limit. It widens caution and licenses nothing.

## Stance & kill switches

**Stance (2026-09-10, D-127).** **Stand aside at every horizon, and carry this event for its
calendar value rather than for a position.** The `estimate`-dated 2027-01-15 print is the only
monthly GDP release between the Bank of England's 17 December 2026 and 4 February 2027
announcements, and the Q4 outturn that would settle it publishes 12 February 2027 — eight days
after the February Monetary Policy Report — so the Report's Q4 figure is a nowcast with this print
as its last input (legs 1–2, six ONS pages and the BoE dates page, all fetched 2026-09-10). That
placement is real and it still does not produce a trade: the print adds R² and almost no level to
that nowcast (leg 3: R² +0.549 → +0.810, MAE 0.161pp → 0.124pp), November is the statistically
quietest month of the twelve (leg 4: sd 0.195pp, rank 1 of 12), the first estimate is provisional
by construction (leg 5: 43 of 44 revised, median 19.0 months), and there is no instrument in this
book through which a UK activity surprise reaches a position (leg 6: ten US-listed tracked names,
zero gilt/sterling references in any playbook). The one horizon graded above *stand aside* is the
quarter, at **watch, medium** — and what is being watched is the **11 December 2026** October
print, not this one.

**Kill switches — what would change this stance:**

1. **The transmission path appears.** A UK-listed or sterling-keyed name enters the tracked roster,
   or a house playbook gains a gilt/GBP leg. This is the only kill that raises the tier; everything
   else below changes the analysis, not the call.
2. **The placement collapses.** The ONS moves the Q4 first quarterly estimate off 12 February 2027
   — the one date here its own page labels *provisional* — to on or before 4 February 2027. The
   February MPR would then have an outturn and the "last input to a nowcast" framing is dead.
3. **The ladder breaks.** Any release in leg 1's table publishes on a date other than the one its
   ONS page carried on 2026-09-10, which would mean the M+2 rule is not the publisher's habit and
   every placement claim here needs re-deriving. Scored earliest at the **2026-09-11** July print.
4. **October runs hot.** The 2026-12-11 October m/m prints outside ±0.40pp (2 of 11 post-2013
   ex-COVID Octobers did). The Q4 nowcast is then genuinely unsettled going into January and the
   *This quarter* call moves from watch toward a real read.
5. **The distribution breaks.** The November 2026 m/m prints outside ±0.45pp on 2027-01-15, against
   eleven of eleven in sample. Leg 4's central finding fails and this event is not the quiet print
   this ledger says it is.
6. **The Bank goes live.** Bank Rate moves off 3.75% at the 17 September 2026 announcement with
   guidance that makes the February 2027 forecast round a genuine fork. That raises what the MPR's
   Q4 nowcast is worth and, with it, this print's tier.

Three predictions carry score-by dates and are registered in
[`forward-tests/uk-gdp-monthly-2027-01-15.md`](../forward-tests/uk-gdp-monthly-2027-01-15.md):
FT-1 (incorporation, scored **2026-11-06** on a near day-for-day replica — the 15 October 2026
print at D-21 into the 5 November 2026 Report round, with the Q3 outturn 7 days behind it, against
this event's D-20 and 8 days), FT-2 (the two-month nowcast band, scored **2026-11-13** on that
same Q3 replica) and FT-3 (the ±0.45pp November band, scored on this event's own date). Both
replicas score **57 and 64 days from registration** rather than 127, and well inside this event's
own close-out window, so no Outcome cell is left for nobody to fill. Every one of them makes a
statement about a publication or a statistic and none licenses an action: `symbols: []`.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | D-127 | **Initial research** (`never-assessed`); canonical `src/domain/market-events/uk-gdp-monthly-2027-01-15.json` written from `proposals/…from-uk-cpi-2027-01-20.json`, read in full first. Six ONS release pages + BoE upcoming-MPC-dates fetched direct, HTTP 200, none blocked. **Placement:** only monthly GDP print between the 2026-12-17 and 2027-02-04 BoE announcements; Q4 first quarterly estimate 2027-02-12 (ONS: *provisional*), **8 days after** the February MPR. **Nowcast ladder** (4dp workbook, n=11 post-2013 ex-COVID Q4s): R² −0.561 → **+0.549** (Oct known) → **+0.810** (Oct+Nov), MAE 0.332 → 0.161 → **0.124pp**. **Dispersion:** November m/m sd **0.195pp, rank 1 of 12**; Oct 0.396, Dec 0.401 the widest; 11/11 Novembers inside ±0.45pp; pairwise |Nov|<|Oct| only **5 of 11** — distributional, not per-year. **Revisions:** 43/44 months first estimated since 2023-01 already revised, median **19.0 months**. **Exposure:** ten tracked names all US-listed; zero gilt/sterling/GBP hits across the playbooks → tier `low` on absence of a transmission path. Adjacency: 15 tracked events within 5 days (opex same day, MLK closure, UK labour/CPI/PPI the following week); VIX **17.84**. **Proposed:** `uk-gdp-quarterly-first-2027-02-12` and `uk-gdp-monthly-2026-12-11`, both `estimate`. **Flagged, not resolved:** sibling proposal `uk-monthly-gdp-2026-10-15.from-uk-blue-book-2026-10-30.json` uses the opposite prefix for the same release family. | **Opened: stand aside** at Today/This week/This month (high), **watch** at This quarter (medium). FT-1, FT-2, FT-3 registered | 2026-10-10 (low band, `low:15+`, 30-day interval) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-uk-gdp-monthly-2027-01-15.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
