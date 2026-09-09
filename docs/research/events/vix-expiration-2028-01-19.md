# VIX futures and options January 2028 expiration (SOQ settlement) — vix-expiration-2028-01-19

**Kind:** opex · **Date:** 2028-01-19 (estimate, EST: rule-derived, and the first date in this class whose two holiday legs are checked against a **published primary that reaches 2028** — NYSE's own 2028 holiday column, fetched direct this session — rather than against statute arithmetic. Stays `estimate` because no Cboe or OCC surface names a 2028 contract: `VX_2028-01-19.csv` 403s while the 2027 control 200s, and the OIC/OCC calendar stops at 2027-12-15) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fomc-blackout-start-2028-01-15","mlk-market-closure-2028-01-17","opex-2028-01-21"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside on the event, take the date, and take three corrections this lane found by
re-deriving instead of inheriting.** The date is **2028-01-19** — third Friday of February 2028 is
**2028-02-18**, minus 30 days is that Wednesday, and neither leg is a holiday. What is new is *how* that
is known: **NYSE publishes a 2028 holiday column**, fetched direct this session, so both legs are read off
a publisher rather than computed from statute — the first time this class has had that. Three findings
follow. **(1)** The MLK "uncovered gap" regularity the 2027 sibling measured at **23/53 (43.4%)** is not
about MLK: over **1990–2300** the set of years where MLK is uncovered and the set where January is a
**35-gap** month are **identical**, 133 of 311. The third Monday is a passenger; the third Friday of
January decides, and the 53-year computation collapses to *MLK on the 18th, 19th or 20th*. **2028 and 2027
are the two extremes** — third Friday of January 2028 is the **21st**, the latest possible; 2027's was the
**15th**, the earliest. **(2)** Scoring the clause over **3,732** monthly settlements, only **three** of
twelve contract months can be displaced with any regularity — **March, May, June** — with February a
distant fourth at 4 of 311. **Nine of twelve are 0 of 311, January among them.** That **supersedes** the
February sibling's "February is the structurally safest month": it is the fourth-safest. **(3)** This
session's own holiday engine was **wrong first**, and the tape caught it — a false displacement at
2021-12-01 from observing a Saturday New Year's Day backward onto 2021-12-31. Corrected, it reproduces the
sibling's **296/296** independently. Date stays **`estimate`**; `VX/F8` is unlisted. **Nothing here
licenses a position at D−497.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D−497, `symbols: []`, `impact: low`, and a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session rather than inherited | A house vol/opex instrument built and back-tested before **2028-01-19** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Carry 2028-01-19, and carry it as publisher-checked rather than statute-computed** | High | `nyse.com/markets/hours-calendars` (HTTP 200, 109,180 B) carries a **2028 column**: MLK **Mon 2028-01-17**, Washington's Birthday **Mon 2028-02-21**, Good Friday **2028-04-14**, and New Year's Day as an em-dash — *"Because the holiday falls on Saturday, January 1, 2028, no New Year's Day holiday is observed."* Nothing lands on **2028-01-19** or **2028-02-18** | NYSE revising its 2028 column to put a closure on either leg — the clause fires, settlement moves to Tuesday **2028-01-18**, and this document re-dates |
| This month | **Retire "MLK sits in no VIX strip" as an MLK fact — it is a third-Friday-of-January fact** | High | Over **1990–2300** the years where MLK is uncovered and the years where January is **35-gap** are the **same 133 of 311**; the 1998–2050 restriction reproduces the sibling's **23/53** exactly. Uncovered ⟺ **MLK on Jan 18/19/20** ⟺ third Friday of January on the **15/16/17** | Any year where MLK is uncovered and consecutive third Fridays are **28** days apart, or the reverse — the equivalence is set-identity, so **one** counterexample kills it |
| This quarter | **Expect the OCC's 2028 calendar to agree with the rule on all four *discriminating* months, and treat a naive row as the real warning** | Medium | 2028's 35-gap months are **March, June, September, December**, where the rule and the naive `F_M − 2` heuristic differ by **7 days**. The publisher's three January rows (2025-01-22, 2026-01-21, 2027-01-20) are all 35-gap Januaries where naive would be 7 days wrong, and it took the **rule** all three times | Any 2028 discriminating row published at the naive date (**2028-03-15 / 06-14 / 09-13 / 12-13**) — the contested 2027-12-15 residual becomes a recurring method, not an isolated slip. Registered as **FT-vix-expiration-2028-01-19-1**, score by **2027-02-28** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2028-01-19 VIX settlement. The date is
  `estimate`, and `estimate` widens caution rather than licensing anything.
- **Execution guard (Wed 2028-01-19), the only actionable line here:** nothing trades that day's opening
  auction. From Cboe's spec, read direct this session: *"Trading hours for expiring VX futures contracts
  end at 8:00 a.m. Chicago time on the final settlement date"* — **09:00 ET** — and the SOQ is calculated
  from the constituent SPX options' opening trade prices in the special opening auction. Those prints are
  settlement artifacts, not information. Same guard all fifteen VIX siblings carry.
- **The date now rests on a publisher, not on statute.** NYSE's 2028 column is the first published primary
  reaching 2028 this class has cited. It does **not** promote the status — it names holidays, not
  contracts — but it removes the holiday set from the list of things taken on arithmetic.
- **Correction #1, and the one worth remembering:** *"MLK falls in an uncovered gap between two 30-day
  strips"* is **identically** the statement *"January is a 35-gap month."* Not correlated —
  **set-identical**, 133/311 over 1990–2300, 23/53 over 1998–2050. The one-line test is **MLK on Jan
  18/19/20**.
- **Correction #2:** **nine of twelve** contract months can **never** be displaced. The displacement
  surface for monthlies is **March (66/311), May (79/311), June (39/311)** and **February (4/311)**, and
  nothing else. **January is 0 of 311**, permanently.
- **Correction #3, aimed at whoever writes the next engine:** a statute-derived holiday set that observes a
  **Saturday New Year's Day** backward onto the preceding Friday generates a **false** displacement. It
  fired here at settlement Wednesday **2021-12-01** (Friday leg 2021-12-31); `VRO_History.csv` carries the
  Wednesday and not the Tuesday, and NYSE states the rule in words. **That is the whole delta between 14
  and 13.**
- **An independent reproduction, not a citation:** with that one defect fixed, a separately written engine
  scores the February sibling's window at **296 of 296**, **13 predicted displacements = 13 realized**,
  sets identical. The result is now confirmed by two implementations.
- **Structural placement, not a call:** the 30-day reference window runs **2028-01-19 → 2028-02-18** —
  **23 trading sessions, zero closures**. MLK 2028-01-17 falls **two days before** it opens; Washington's
  Birthday 2028-02-21 falls **three days after** it closes. Only **48 of 111** January windows 1990–2100
  are closure-free.
- **The blackout containment the proposer flagged, confirmed:** `fomc-blackout-start-2028-01-15`
  (estimate) runs **2028-01-15 → 2028-01-27**, so the SOQ prints on a morning when no Fed official may
  speak, and `fomc-2028-01-26` (estimate) is **seven days after** settlement, not before it. Unlike the
  February sibling, there is **no same-day Fed release** to sequence against.
- **Configuration for the next pulse to diff against** (Cboe primaries, 2026-09-08 close): **VIX1D 10.43 ·
  VIX9D 14.81 · VIX 15.72 · VIX3M 18.39 · VVIX 88.69** — contango through the front, unchanged from the
  February sibling's read.
- **A method note for the class, learned the hard way today:** the live settlement CSV
  (`cboe.com/us/futures/market_statistics/settlement/csv`) returned **67 bytes, one row** —
  `VX,VX36/U6,2026-09-09,16.01` — because **2026-09-09 is itself a settlement Wednesday** and the endpoint
  publishes that day's final settlement rather than the listed strip. Do not read the strip on a
  settlement Wednesday and conclude the strip shrank; use the per-contract endpoint with a control.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At D−497
  those describe a different expiry; they become quotable from roughly **2028-01-12**.

## Initial research

### The question

This id arrived as a **proposal from the MLK closure lane** —
[`mlk-market-closure-2028-01-17`](mlk-market-closure-2028-01-17.md)'s initial research — because that lane
needed to know whether MLK 2028 sits inside a VIX strip or in the hole between two. Its sibling one year
earlier, [`mlk-market-closure-2027-01-18`](mlk-market-closure-2027-01-18.md), had made that hole its
headline: MLK 2027 fell in an uncovered gap, and the lane measured the regularity at **23 of 53 years
(43.4%)**, 1998–2050. The 2028 proposal found the opposite configuration — consecutive third Fridays **28**
days apart, strips that **overlap** rather than leaving a hole — and proposed this settlement as that
overlap's near edge.

So the questions are: **is the date right, is the "MLK gap" regularity actually about MLK, and is January's
settlement date exposed to the holiday clause at all?** Underneath, the same method question the February
sibling asked and answered for its own month: **what is still being taken on faith here?**

**One-line verdict:** **2028-01-19**, with both holiday legs read off **NYSE's published 2028 column**
rather than computed — and the MLK regularity is not an MLK regularity, January is in the
**permanently-immune** class of contract months, and this session's first holiday engine was **wrong** in a
way the tape caught.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
no symbol-keyed instrument applies, and `scripts/research/` carries no settlement-shaped instrument
(`expiration-displacement.mjs` measures *equity-expiration volume*, a different mechanic, correctly not
run). Nothing was inherited: every primary was fetched raw this session, and every sibling number this
ledger leans on was **recomputed by an independently written engine** rather than cited.

**Primaries fetched raw and parsed by machine today (2026-09-09), all HTTP 200:**

- **NYSE holiday & hours calendar** `nyse.com/markets/hours-calendars` (**109,180 bytes**, browser UA) —
  the **2026 / 2027 / 2028** holiday table and its four footnotes, extracted verbatim. **This is the first
  published primary reaching 2028 that this class has cited.**
- **Cboe VX contract specification** `cboe.com/tradable_products/vix/vix_futures/specifications/`
  (**461,361 bytes**, following the site's 302) — *Final Settlement Date*, the holiday clause, *Termination
  of Trading* and *Final Settlement Value*, read out of the page's embedded payload.
- **Cboe VIX final-settlement series** `cdn.cboe.com/api/global/us_indices/daily_prices/VRO_History.csv`
  (**26,597 bytes**, **1,268 rows**, 2008-07-16 → 2026-09-02) — the test bed.
- **Cboe per-contract VX history files**
  `cdn.cboe.com/data/us/futures/market_statistics/historical_data/VX/VX_<expiry>.csv` — probed for
  2028-01-19, 2028-01-21, 2028-02-16 and 2027-12-22, plus **`VX_2027-05-18` as a positive control**.
- **Cboe settlement CSV** `www.cboe.com/us/futures/market_statistics/settlement/csv` (**67 bytes**, one
  row — see the method note above).
- **Cboe index histories:** **VIX** (472,411 B), **VIX9D** (200,234), **VIX3M** (217,693), **VVIX**
  (108,519), **VIX1D** (54,020), through the 2026-09-08 close.
- **OIC / OCC expiration calendar JSON** `www.optionseducation.org/api/expirationcalendar` (**34,871
  bytes**, 155 dated rows) — **36** *Monthly Volatility Products Expiration date* rows, spanning
  2025-01-22 → 2027-12-15.

**No fetch failed**, so `probe-ref.blocked` is empty. The 403s seen were the per-contract endpoint
answering *"no such contract"* for unlisted 2028 expiries — a designed response and a finding, not a
blocked source; `VX_2027-05-18.csv` returned 200 on the same endpoint in the same run, which is the control
that proves reachability.

**Own computation.** A clause engine written fresh for this session — Gregorian Easter computus for Good
Friday, Juneteenth from 2022, the weekend-observation rules — applied to every monthly settlement
1990–2300 and to every settlement Wednesday in the February sibling's 2021–2026 window. **It was wrong on
its first run**, and leg 5 records exactly how.

**House sources:** the one proposal for this id;
[`mlk-market-closure-2027-01-18`](mlk-market-closure-2027-01-18.md) for the 23/53 regularity, **recomputed
rather than cited**; [`vix-expiration-2028-02-16`](vix-expiration-2028-02-16.md) for the 296/296 clause
result, **independently reproduced rather than cited**;
[`vix-expiration-2027-12-22`](vix-expiration-2027-12-22.md) for the OCC publisher dispute;
`docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped. Genre model:
[`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The rule yields 2028-01-19 — SUPPORTED.** Verbatim from today's spec fetch:

   > "The final settlement date for a contract with the "VX" ticker symbol is on the Wednesday that is 30
   > days prior to the third Friday of the calendar month immediately following the month in which the
   > contract expires."
   >
   > "If that Wednesday or the Friday that is 30 days following that Wednesday is a Cboe Options holiday,
   > the final settlement date for the contract shall be on the business day immediately preceding that
   > Wednesday."

   Applied to `VX/F8`: third Friday of February 2028 = **2028-02-18** (a Friday); minus 30 days =
   **2028-01-19** (a Wednesday). Re-validated against eighteen years of prints: **218** rule-derived
   monthly settlements 2008-07 → 2026-08, **217** present in `VRO_History.csv`, the one absentee
   **2013-05-22** carrying no May-2013 row at any date — reproducing all four sibling implementations
   exactly.

2. **Both holiday legs are clear, and this is the first time that is read off a publisher — SUPPORTED, and
   it is the date's biggest upgrade.** Every prior ledger in this class established the 2028 holiday set by
   statute (5 U.S.C. 6103) plus the Easter computus, because "no published primary reaches 2028." That is
   no longer true. NYSE's calendar page carries a **2026 / 2027 / 2028** table:

   | Holiday | 2028 |
   |---|---|
   | New Year's Day | **—\*** |
   | Martin Luther King, Jr. Day | **Monday, January 17** |
   | Washington's Birthday | **Monday, February 21** |
   | Good Friday | **Friday, April 14** |
   | Memorial Day | Monday, May 29 |
   | Juneteenth | Monday, June 19 |
   | Independence Day | Tuesday, July 4 |
   | Labor Day | Monday, September 4 |
   | Thanksgiving Day | Thursday, November 23 |
   | Christmas Day | Monday, December 25 |

   \* verbatim footnote: *"Because the holiday falls on Saturday, January 1, 2028, no New Year's Day
   holiday is observed."*

   Nothing in that column falls on **2028-01-19** or **2028-02-18**, so the clause does not fire and the
   settlement is the unadjusted Wednesday. Two side facts fall out: **2028 has no New Year's closure at
   all**, and **MLK 2028-01-17 is January 2028's only market closure**.

3. **"MLK sits in no VIX strip" is a third-Friday fact, not an MLK fact — SUPPORTED, and this AMENDS the
   sibling that made it a headline.** The 2027 lane wrote both halves but kept them apart: it named the
   mechanism (*"that hole opens whenever consecutive third Fridays are 35 days apart"*) and, separately,
   measured MLK landing in one at **23 of 53 years (43.4%)** — alongside an all-month 35-gap rate of
   **34.8%**, which this session reproduces at **34.9%** (222/636, 1998–2050). Two numbers, presented as
   two facts.

   They are **one fact**. Computing both sets independently over **1990–2300**: the years where MLK is
   uncovered and the years where January is a **35-gap** month are **the same 133 of 311 (42.8%)** —
   set-identical, not merely correlated — and restricting to 1998–2050 reproduces **23 of 53** exactly.

   The mechanism is two lines. In a **35-gap** January the December contract's window ends at the third
   Friday of January and the January contract's opens five days later, leaving a hole of exactly four
   calendar days — Saturday, Sunday, **Monday**, Tuesday — and MLK, always the third Monday, is always that
   Monday. In a **28-gap** January the windows **overlap** by two days, so no hole exists anywhere for MLK
   to fall into.

   So the 53-year computation collapses to a **one-line test**: MLK is uncovered **iff it falls on January
   18, 19 or 20**; covered iff it falls on the 15th, 16th, 17th or 21st. Equivalently, iff the third Friday
   of January is the 15th, 16th or 17th. **2027 and 2028 are the two extremes of that test** — 2027's third
   Friday of January is the **15th**, the earliest it can ever be; 2028's is the **21st**, the latest.

4. **January's settlement date can never be displaced, and only three months can — SUPPORTED, and this
   SUPERSEDES the February sibling's headline.** That ledger concluded *"February is the structurally
   safest month,"* on the true observation that Washington's Birthday is always a Monday and so can never
   occupy a February settlement Wednesday, plus the finding that its Friday leg is *rare rather than
   impossible* (third Friday of March = Good Friday in **2008, 2160, 2228, 2285** — reproduced here
   exactly, 4 of 311).

   Scoring the **full clause over every monthly contract 1990–2300** — 3,732 settlements — shows February
   is not the safest month. It is the **fourth**-safest:

   | Contract month | Wednesday leg fires | Friday leg fires | of 311 |
   |---|---|---|---|
   | **Jan** | 0 | **0** | **never** |
   | Feb | 0 | 4 | Good Friday on the third Friday of March (2008, 2160, 2228, 2285) |
   | Mar | 0 | **66** | Good Friday on the third Friday of April |
   | **Apr** | 0 | **0** | **never** |
   | May | 0 | **79** | Juneteenth on the third Friday of June |
   | Jun | **39** | 0 | Juneteenth on the settlement Wednesday itself |
   | **Jul · Aug · Sep · Oct · Nov · Dec** | 0 | **0** | **never** |

   **Nine of twelve months are 0 of 311.** January's immunity has a two-line proof: its settlement
   Wednesday can only fall **01-16 … 01-22** and its Friday leg only **02-15 … 02-21**, and the only US
   market closures that ever reach those ranges are **MLK and Washington's Birthday, both always Mondays**.
   Neither can occupy a Wednesday or a Friday, ever.

   Realized data agrees without being asked to: of the **13** displacements in the February sibling's
   2021–2026 window, the **four monthlies** are 2022-03-15, 2024-06-18, 2025-03-18 and 2026-05-19 — March,
   June, March, May. Nothing outside the predicted three months. Prospectively, the classification says the
   next monthly displacement is **2027-05-18** (May contract, Juneteenth observed 2027-06-18) and then
   **nothing until 2030-03-19** — a **34-month drought** it is on the hook for.

5. **This session's holiday engine was wrong, and the tape caught it — SUPPORTED, and it is the most
   transferable thing here.** Re-running the February sibling's exact test on a **separately written**
   engine returned **295 of 296** with **14** predicted displacements against the sibling's 13. The extra
   one: settlement Wednesday **2021-12-01**, whose Friday leg is **2021-12-31**, which the engine had
   marked a holiday by observing a **Saturday New Year's Day** (2022-01-01) backward onto the preceding
   Friday — the ordinary weekend-observation rule, applied where it does not hold.

   `VRO_History.csv` refutes it directly: there **is** a settlement on Wednesday 2021-12-01 and **none** on
   Tuesday 2021-11-30. And NYSE states the governing rule in words, in the very footnote this ledger's date
   depends on: *"Because the holiday falls on Saturday, January 1, 2028, no New Year's Day holiday is
   observed."* A Saturday New Year's Day produces **no** closure — not on the preceding Friday, not on the
   following Monday.

   Corrected, the engine returns **296 of 296**, **13 predicted displacements**, **13 realized non-Wednesday
   settlements** (all Tuesdays), the two sets **identical**, zero residual — **an independent reproduction
   of the sibling's load-bearing result from a second implementation**, plus the specific defect the next
   one must not have. The next Saturday New Year's Days are **2028, 2033, 2039**; the nearest place the
   defect could bite again is settlement Wednesday **2027-12-01**, whose Friday leg is 2027-12-31. That is
   registered as a forward test.

6. **The publisher uses the rule, not the naive heuristic — SUPPORTED, and January is where it proves it.**
   The [2027-12-22 sibling](vix-expiration-2027-12-22.md) contests one OCC row: the publisher names
   **2027-12-15** where the rule gives **2027-12-22**, and 2027-12-15 is exactly the naive
   *Wednesday-before-this-month's-opex* heuristic (`F_M − 2`).

   January is the cleanest available discriminator, and the publisher passes it. Its three January rows are
   **2025-01-22, 2026-01-21, 2027-01-20** — and all three are **35-gap** Januaries, where the naive
   heuristic would give 2025-01-15, 2026-01-14, 2027-01-13, wrong by **seven days** each time. The
   publisher took the **rule** three times out of three. So the 2027-12-15 residual is an **isolated error**,
   not a rival method — which is the strongest thing said for that sibling's position so far, and it comes
   from a different month.

   One honest limit on this ledger's own row: **2028-01-19 is a 28-gap January**, the first the publisher's
   forward window would carry, and in a 28-gap month the rule and the naive heuristic **agree** (both give
   2028-01-19). So the OCC's January 2028 row will **confirm** this date and **discriminate nothing**. The
   discriminating 2028 rows are the **35-gap** months — **March (rule 2028-03-22 vs naive 03-15), June
   (06-21 vs 06-14), September (09-20 vs 09-13), December (12-20 vs 12-13)** — and that is what the forward
   test registers.

7. **`VX/F8` is unlisted, and the surface that will decide this is silent — SUPPORTED, and it is why the
   status does not promote.** On the per-contract endpoint, **`VX_2028-01-19.csv` returns 403**, as do
   `VX_2028-01-21`, `VX_2028-02-16` and `VX_2027-12-22`, while the control **`VX_2027-05-18.csv` returns
   200**. The live settlement CSV could not be read as a strip today (67 bytes, one row — see leg 9), so
   the strip's endpoint is **not** quoted here; the February sibling's read one day earlier had it ending
   at `VX/K7` **2027-05-18**, and nothing in today's data contradicts that. Given the observed listing
   cadence of roughly nine months, `F8` should appear around **2027-04**. **Promotion trigger:** `VX/F8`
   listed dated 2028-01-19, or an OCC 2028 calendar naming it.

8. **The blackout containment the proposal flagged is real, and it is *less* eventful than February's —
   SUPPORTED.** `fomc-blackout-start-2028-01-15` (estimate) runs **2028-01-15 → 2028-01-27**, so the SOQ
   prints on a morning when no Fed official may speak. But unlike the February sibling — where the January
   minutes land on the settlement day itself at 14:00 ET — the meeting here (`fomc-2028-01-26`, estimate) is
   **seven days after** settlement. There is **no same-day Fed release to sequence against**, which is a
   negative finding and is recorded as one.

9. **The 30-day reference window is closure-free — SUPPORTED, and it is the 28-gap structure seen from the
   other side.** The window runs **2028-01-19 → 2028-02-18**: **23 trading sessions, zero closures**. MLK
   2028-01-17 falls two days *before* it opens (it is inside the **December 2027** contract's window,
   2027-12-22 → 2028-01-21, which is the proposal's overlap finding restated); Washington's Birthday
   2028-02-21 falls three days *after* it closes. Across 1990–2100, January windows split
   **48 closure-free / 48 containing Washington's Birthday / 15 containing MLK**, so 2028 is in the
   43%-of-Januaries minority. Against the February sibling's window (22 sessions, one closure) this one is
   **one session longer and one closure lighter** — a structural note, not a claim about realized
   volatility, which no data here measures.

10. **Nothing in the house system is settlement-keyed — SUPPORTED, re-verified rather than inherited.**
    `trade-playbooks.md` and `multi-symbol-sweep.md` grepped for
    `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**, matching every sibling
    result since 2026-09-05.

11. **The sweep proposes nothing, and the refusal is computed — SUPPORTED.** The ±5-day corridor
    (**2028-01-14 → 2028-01-24**) contains **three** entries, **all already owned**:
    [`fomc-blackout-start-2028-01-15`](fomc-blackout-start-2028-01-15.md) at −4 (canonical),
    [`mlk-market-closure-2028-01-17`](mlk-market-closure-2028-01-17.md) at −2 (canonical, and this event's
    proposer), and `opex-2028-01-21.from-mlk-market-closure-2028-01-17.json` at +2. Two candidates were
    **declined**: **(a)** `opex-2028-02-18`, this contract's own 30-day reference expiry — already
    canonical, and declined on the precedent this class has now set six times, after `opex-2027-04-16`'s
    research corrected the "constitutive input" framing; **(b)** `fomc-2028-01-26` at **D+7**, already
    canonical and outside the corridor this sweep is defined over.

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A regularity re-attributed, and it is the point of this ledger.** *"MLK falls in an uncovered gap
  between two 30-day VIX strips"* is **identically** *"January is a 35-gap month"* — the same **133 of
  311** years over 1990–2300, the same **23 of 53** over 1998–2050. MLK is a passenger. The test is one
  line: **MLK on the 18th, 19th or 20th**.
- **A structural classification that supersedes a sibling headline.** Only **March, May and June** carry a
  real displacement risk for monthly VX settlements; February is a distant fourth at 4 of 311, and **nine
  of twelve months — January included — are 0 of 311**. February is the fourth-safest month, not the
  safest.
- **A calibration defect, and an independent reproduction that only landed once it was fixed.** Observing a
  **Saturday New Year's Day** backward onto the preceding Friday produces a false displacement; it fired at
  **2021-12-01**, the tape refuted it, and NYSE states the rule. Corrected, a second implementation
  reproduces **296/296** and **13-for-13**.
- **A date, on a publisher rather than on statute.** **2028-01-19**, with both clause legs checked against
  **NYSE's own 2028 column** — the first published primary reaching 2028 this class has cited.

### Honest limits

The **date is `estimate`** and stays so until `VX/F8` lists or an OCC 2028 calendar publishes; NYSE's 2028
column settles the *holidays*, not the *contract*, and the taxonomy's confirmed prefixes need a publisher
naming the settlement. The **structural classification (leg 4) is arithmetic over a statute-plus-computus
holiday set**, so it is exactly as good as that set — which leg 5 shows is not automatic — and it has **no
slot for an ad-hoc closure**: a national day of mourning of the kind that shut the market on 2018-12-05 and
2025-01-09 would move a date with no warning arithmetic can give, and neither of those fell on a settlement
Wednesday, so that case is untested here too. **Leg 3's equivalence is proved over 1990–2300 only**; it
rests on the third-Monday and third-Friday definitions being stable, which is a statutory assumption, not a
measured one. **Leg 5's reproduction inherits the February sibling's window choice** (2021–2026, where
`VRO_History.csv` carries a clean 52-per-year weekly grid) and makes no claim about the 2017–2020 stretch,
which that ledger excluded and this one did not re-open. The test scores **presence and absence in a
settlement file**, which establishes *when* a settlement occurred, not *which contract* settled. **Leg 6's
publisher argument is three January rows** — a small sample, and it is evidence about method, not proof.
The **strip endpoint could not be read today** (leg 9's method note), so no term-structure statement is
made. No house instrument tests any of this, which is why the outputs are a date, three corrections and a
set of refusals rather than anything tradeable. Educational, paper-standard throughout.

## Stance & kill switches

**Stance (date `estimate` as of 2026-09-09, on Cboe specification text read direct with both holiday legs
checked against NYSE's published 2028 column, the underlying rule 217-of-218 against the venue's own monthly
prints, and the holiday clause independently reproduced at 296-of-296 after one engine defect was found and
corrected; `VX/F8` unlisted and no 2028 publisher row existing).** Treat **2028-01-19, 09:30 ET** as a
known-date, **low-impact microstructure marker** and never as a tradeable event. No position is opened,
closed or sized because of it. One guard applies: **nothing executes on that day's opening auction**, on
any name — the expiring VX contract's last trade is 09:00 ET and the SOQ's first prints are settlement
artifacts. Four findings are carried forward rather than acted on. **(a)** The 2027 sibling's MLK
"uncovered gap" regularity is **not about MLK**: over 1990–2300 the uncovered years and the 35-gap
Januaries are **the same 133 of 311**, and the 1998–2050 restriction reproduces its 23/53 exactly — the
third Friday of January decides, and the test is *MLK on the 18th, 19th or 20th*. 2028 (third Friday the
**21st**) and 2027 (the **15th**) are the two extremes. **(b)** The February sibling's "structurally safest
month" is **superseded**: scoring the clause over 3,732 monthly settlements, only **March (66/311), May
(79/311) and June (39/311)** carry real displacement risk, February is fourth at 4/311, and **nine of
twelve months including January are 0 of 311**, with a two-line proof for January. **(c)** A statute-derived
holiday set that observes a **Saturday New Year's Day** backward onto the preceding Friday produces a
**false** displacement — it fired at 2021-12-01, `VRO_History.csv` refuted it, and NYSE states the rule;
corrected, this session's independent engine reproduces the sibling's 296/296 and 13-for-13 exactly.
**(d)** The OCC **uses the rule, not the naive heuristic** — its three January rows are all 35-gap
Januaries where naive would be seven days wrong, and it took the rule three for three, which makes the
contested 2027-12-15 row an isolated error rather than a rival method. The one thing this ledger will not
do is promote to `confirmed` on arithmetic, however well-sourced: NYSE's 2028 column names holidays, not
contracts.

**Kill switches:**

- **Cboe lists `VX/F8` with an expiration date other than 2028-01-19** — the whole document re-dates. Probe
  `VX_2028-01-19.csv` at every pulse; the listing is expected around **2027-04**.
- **`VX/F8` appears on a Cboe settlement or per-contract surface dated 2028-01-19** — the promotion trigger;
  the entry flips `estimate` → `confirmed` under `OCC:` and nothing else changes.
- **NYSE revises its 2028 column to put a closure on 2028-01-19 or 2028-02-18** — the clause fires,
  settlement moves to Tuesday **2028-01-18**, and this ledger re-dates. Re-fetch
  `nyse.com/markets/hours-calendars` by **2027-06-30**.
- **Any year is found where MLK is uncovered and consecutive third Fridays are 28 days apart, or the
  reverse** — leg 3's claim is **set identity**, so a single counterexample kills it and the 2027 sibling's
  framing is restored.
- **A monthly VX settlement outside March, May or June is displaced** — leg 4's classification breaks. It
  is on the hook for a specific prospective shape: the next monthly displacement is **2027-05-18** (May
  contract, Juneteenth observed 2027-06-18) and then **none until 2030-03-19**.
- **Settlement Wednesday 2027-12-01 prints on Tuesday 2027-11-30** — the Saturday-New-Year's correction in
  leg 5 was wrong, the engine that dates this ledger is wrong with it, and 296/296 becomes 295/296 again.
  This is **`FT-vix-expiration-2028-01-19-2`**, scored by **2027-12-08**.
- **The OIC/OCC 2028 Expiration Calendar publishes any of its four discriminating rows at the naive date**
  (2028-03-15, 2028-06-14, 2028-09-13, 2028-12-13) — the publisher is applying a rival heuristic after all,
  the 2027-12-15 residual stops being isolated, and leg 6 falls. This is
  **`FT-vix-expiration-2028-01-19-1`**, scored by **2027-02-28**.
- **An ad-hoc market closure is announced for 2028-01-19 or 2028-02-18** — a national day of mourning is
  outside every statute-derived holiday set *and* outside NYSE's forward table, and would move the date with
  no warning the arithmetic can give.
- **A house vol/opex instrument gets built and back-tested** — leg 10 stops being mechanics-plus-citation
  and starts being data; this sheet is rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2028-01-19.md`](../forward-tests/vix-expiration-2028-01-19.md):
`FT-vix-expiration-2028-01-19-1`, the **discriminating** version of the February sibling's publisher test —
its `-2` asks whether the OCC's 2028 calendar names 2028-02-16, a **28-gap** row where the rule and the
naive heuristic agree and nothing can be learned from agreement; this one asks about the **four 35-gap 2028
rows** where they differ by seven days, which is where a rival method would show; and
`FT-vix-expiration-2028-01-19-2`, the **first prospective test of a holiday-set defect** this class has
registered — the 2027-12-01 repeat of the exact case that broke this session's engine, scored by the tape.
Two candidates were **declined**: predicting `VX/F8` eventually lists at 2028-01-19 duplicates the
promotion trigger rather than testing anything (the standing call since the 2027-12-22 sibling), and
re-registering the weekly-clause test the February sibling already owns (2026-11-25 / 2026-12-02) would
double-count one prediction. Nothing here scores any sibling's row.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-497 | Initial research on an id that existed only as `proposals/vix-expiration-2028-01-19.from-mlk-market-closure-2028-01-17.json`; that proposal was read first and the **canonical `vix-expiration-2028-01-19.json` is written in this PR**, shadowing it. probe-ref seeded (no symbols; **VIX 15.72** at the 2026-09-08 Cboe close; band `low:15+`; 3 adjacents; **no blocked URLs — every fetch returned 200**). **(i) DATE:** spec read direct (HTTP 200, **461,361 B**); `VX/F8` = third Friday of Feb-2028 **2028-02-18** −30d = Wed **2028-01-19**; rule reproduces **217 of 218** monthlies 2008-07→2026-08 (absentee 2013-05-22), matching all four sibling implementations. **(ii) FIRST PUBLISHED PRIMARY REACHING 2028 IN THIS CLASS:** `nyse.com/markets/hours-calendars` (HTTP 200, **109,180 B**, browser UA) carries a **2028 column** — MLK **Mon 01-17**, Washington's Birthday **Mon 02-21**, Good Friday **04-14**, New Year's Day an **em-dash** with the verbatim footnote *"Because the holiday falls on Saturday, January 1, 2028, no New Year's Day holiday is observed."* Neither clause leg is a closure, **read rather than computed**. Side facts: **2028 has no New Year's closure at all**; **MLK 01-17 is January 2028's only closure**. **(iii) THE MLK REGULARITY IS NOT ABOUT MLK — AMENDS `mlk-market-closure-2027-01-18`.** That lane gave the 35-day mechanism and the 23/53 (43.4%) MLK frequency as two facts. They are **one**: over **1990-2300** the uncovered-MLK years and the 35-gap Januaries are **the same 133 of 311 (42.8%)** — **set-identical** — and 1998-2050 reproduces **23/53** exactly (its 34.8% all-month 35-gap rate also reproduces, at **34.9%**, 222/636). Mechanism: a 35-gap January leaves a 4-day hole Sat-Sun-**Mon**-Tue and MLK is always that Monday; a 28-gap January's windows **overlap** so no hole exists. **One-line test: MLK uncovered iff it falls Jan 18/19/20** (third Friday of Jan on the 15/16/17). **2027 and 2028 are the two extremes** — F_Jan 2027 = the **15th** (earliest possible), F_Jan 2028 = the **21st** (latest possible). **(iv) STRUCTURAL CLASSIFICATION — SUPERSEDES `vix-expiration-2028-02-16`'s "February is the structurally safest month".** Clause scored over every monthly contract **1990-2300 (3,732 settlements)**: **Mar 66/311** (Good Friday on 3rd Fri of Apr), **May 79/311** (Juneteenth on 3rd Fri of Jun), **Jun 39/311** (Juneteenth on the settlement Wednesday), **Feb 4/311** (reproducing that sibling's 2008/2160/2228/2285 exactly) — and **Jan, Apr, Jul, Aug, Sep, Oct, Nov, Dec all 0/311**. **February is the FOURTH-safest month; January is permanently immune**, proof: its settlement Wednesday spans **01-16..01-22**, its Friday leg **02-15..02-21**, and the only closures reaching those ranges (MLK, Washington's Birthday) are **always Mondays**. Realized check: all **4 monthlies** among the 13 displacements of 2021-2026 are **Mar/Jun/Mar/May**. Prospective: next monthly displacement **2027-05-18**, then **nothing until 2030-03-19** (34-month drought). **(v) THIS SESSION'S ENGINE WAS WRONG FIRST, AND THE TAPE CAUGHT IT.** A separately written engine scored the Feb sibling's window at **295/296 with 14 predicted displacements**, not 13 — false positive at settlement Wed **2021-12-01**, Friday leg **2021-12-31**, from observing a **Saturday New Year's Day backward onto the preceding Friday**. `VRO_History.csv` carries the Wednesday and **not** Tue 2021-11-30; NYSE's own footnote states the rule. Corrected → **296/296, 13 predicted = 13 realized, sets identical** — **an INDEPENDENT REPRODUCTION of that sibling's load-bearing result**, plus the defect the next engine must not have. Next Saturday NYDs: **2028, 2033, 2039**; nearest bite is Wed **2027-12-01**. **(vi) THE PUBLISHER USES THE RULE — evidence for `vix-expiration-2027-12-22`'s position, from a different month.** OCC's three January rows **2025-01-22 / 2026-01-21 / 2027-01-20** are all **35-gap** Januaries where the naive `F_M−2` heuristic would be **7 days wrong**; it took the rule **3 for 3**. So the contested 2027-12-15 row is an **isolated error**, not a rival method. **Honest limit:** 2028-01-19 is a **28-gap** January where rule and naive **agree**, so the OCC's 2028 January row confirms and **discriminates nothing** — the discriminating 2028 rows are **Mar (03-22 vs 03-15), Jun (06-21 vs 06-14), Sep (09-20 vs 09-13), Dec (12-20 vs 12-13)**. **(vii) STATUS STAYS `estimate`:** **`VX_2028-01-19.csv` 403** (as do 2028-01-21, 2028-02-16, 2027-12-22) with control **`VX_2027-05-18.csv` 200**; `F8` expected ~**2027-04**. NYSE's 2028 column names holidays, **not contracts**, so it does not promote. **(viii) BLACKOUT CONTAINMENT CONFIRMED, AND LESS EVENTFUL THAN FEBRUARY'S:** `fomc-blackout-start-2028-01-15` runs **01-15→01-27** (SOQ inside it), but `fomc-2028-01-26` is **D+7 after settlement** — **no same-day Fed release to sequence against**, a negative finding recorded as one. **(ix) WINDOW:** **2028-01-19→2028-02-18 = 23 sessions, ZERO closures** — MLK 01-17 is **2 days before** it opens (inside the Dec-2027 contract's window 2027-12-22→2028-01-21, the proposal's overlap restated), Washington's Birthday 02-21 is **3 days after** it closes. January windows 1990-2100 split **48 free / 48 with Washington's Birthday / 15 with MLK**. **(x) METHOD NOTE FOR THE CLASS:** the live settlement CSV returned **67 bytes, one row** (`VX,VX36/U6,2026-09-09,16.01`) because **today is itself a settlement Wednesday** — the endpoint publishes that day's settlement, not the listed strip. Do not read the strip on a settlement Wednesday; no term-structure statement is made here. Adjacency — **peers:** none (`symbols: []`). **Macro:** blackout above; no CPI/FOMC surprise bears on a D-497 settlement date. **Volatility regime:** baseline row, nothing to diff; Cboe closes 2026-09-08 **VIX1D 10.43 · VIX9D 14.81 · VIX 15.72 · VIX3M 18.39 · VVIX 88.69**, contango. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** playbooks re-grepped → **zero hits in both**. **Blocked:** none; the 2028 403s are the endpoint answering "no such contract", proven by the 200 control. **NOTHING PROPOSED, refusal computed:** all three corridor entries (2028-01-14→01-24) already owned — `fomc-blackout-start-2028-01-15` (−4), `mlk-market-closure-2028-01-17` (−2), `opex-2028-01-21` proposal (+2); `opex-2028-02-18` declined on the six-times-set constitutive-input precedent (and already canonical), `fomc-2028-01-26` declined as **D+7, outside the corridor**. **`FT-vix-expiration-2028-01-19-1` and `-2` registered; two declined** (an `F8`-lists prediction duplicates the promotion trigger; the weekly-clause test is the Feb sibling's). **Own weaknesses:** legs 3-4 are arithmetic over a statute-plus-computus holiday set — exactly as good as that set, which leg 5 shows is not automatic — with **no slot for an ad-hoc closure** (2018-12-05, 2025-01-09); leg 5 inherits the Feb sibling's **2021-2026** window and makes no claim about 2017-2020; presence/absence establishes **when** a settlement occurred, not **which contract**; leg 6 rests on **three** January rows. | Initial stance set: **stand aside** (structural row only); date **`estimate`** at **2028-01-19** — rule-derived, both holiday legs read off NYSE's published 2028 column; `VX/F8` unlisted. | 2026-10-09 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2028-01-19.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
