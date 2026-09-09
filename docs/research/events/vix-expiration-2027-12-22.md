# VIX futures and options December 2027 expiration (SOQ settlement) — vix-expiration-2027-12-22

**Kind:** opex · **Date:** 2027-12-22 (estimate, EST: Cboe's VX specification read direct this session and adjudicated against Cboe's own per-contract history files — all **seven** realized instances of December 2027's exact calendar geometry settled the monthly on this date's shape, and **nine of nine** currently-listed forward monthlies sit on the rule's date. Stays `estimate` because **`VX/Z7` is not listed** — the strip stops at `VX/K7`, 2027-05-18 — and because the OCC's published calendar names **2027-12-15** instead) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["opex-2027-12-17","sp-quarterly-rebalance-effective-2027-12-20","consumer-confidence-2027-12-22","bond-market-early-close-2027-12-23","sifma-bond-early-close-2027-12-23","christmas-market-closure-2027-12-24"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/resources/release_notes/2027_Expiration_Calendar.pdf","status":"403","at":"2026-09-09"},{"url":"https://www.theocc.com/company-information/schedules","status":"403","at":"2026-09-09"},{"url":"https://cdn.cboe.com/data/us/futures/market_statistics/historical_data/VX/VX_2010-12-22.csv","status":"403","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on the event, and take the date — the disagreement this ledger exists to settle
is now settled on the venue's own records rather than on an argument about which publisher to trust.**
Two lanes proposed the same December 2027 VIX settlement on two different days: **2027-12-22** (Cboe's
rule) and **2027-12-15** (the OCC's published calendar). The prior framing was probabilistic — *a rule
the publisher obeys 35 of 36 times beats the once* — and this session found that argument **weaker than
it looked**: of the 13 "35-day-gap" months in the OCC's file (where settlement lands **five days after**
its own month's opex instead of two days before), the publisher renders **12 of 12 non-December** ones
correctly and gets the file's **only 35-gap December** wrong, which a December-specific defect fits just
as well as a random slip. What breaks the tie is that **Cboe has no December exception**, tested rather
than argued: all **7 of 7** realized 35-gap Decembers since 2008 settled the monthly on the later date —
five of them separated by contract length on Cboe's own per-contract files (**187–193-row monthlies**
against **29–30-row weeklies** at the alternative date), two by the pre-weekly settlement file. Forward,
the rule reproduces **9 of 9** listed monthlies, and **`VX_2027-05-18` is listed while `VX_2027-05-19`
is not** — Cboe applying the holiday clause's *Friday* leg on a live contract. Also corrected: the
OCC's two artifacts are **one dataset republished**, not a second derivation. Date stays **`estimate`**
— `VX/Z7` is unlisted and both contested dates 403 symmetrically on the surface that will decide it.
**Nothing here licenses a position at D-469.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D-469, `symbols: []`, `impact: low`, and a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session rather than inherited | A house vol/opex instrument built and back-tested before **2027-12-22** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Carry the date as 2027-12-22, not 2027-12-15** — and treat the OCC calendar as the erring leg | High | Cboe's own per-contract files separate the two on **7 of 7** realized instances of this geometry and **9 of 9** live listings; the OCC's PDF and JSON are one authored dataset ("accurate as of 12/18/2025" vs "1/2/2026", PDF `ModDate` 2026-08-05), so its agreement with itself adds nothing | Cboe listing **`VX/Z7` dated 2027-12-15** on any surface, at any time before **2027-12-15** — the publisher would be the venue's record and this whole ledger re-dates |
| This month | **Do not let the `estimate` label narrow to "the date is doubtful"** — it is a taxonomy and listing refusal, not an evidentiary one | Medium | The confirmed-prefix set has no slot for an exchange rulebook, and `VX/Z7` is on no surface (`VX_2027-12-22.csv` and `VX_2027-12-15.csv` both **403**, symmetrically — that surface does not yet adjudicate); the arithmetic itself is 217-of-218 against eighteen years of prints | The **2026-10-21** settlement — the next 35-gap month, 42 days out — printing its monthly at **2026-10-14** instead, which would break the rule on a live contract. Registered as **FT-vix-expiration-2027-12-22-2** |
| This quarter | **Expect the OCC's 2028 calendar to render its own 35-gap December correctly — and treat the opposite as the real warning** | Medium | 2028-12 is the next 35-gap December (rule **2028-12-20**, naive 2028-12-13); the 2027 file's note is dated 12/18/2025, so the 2028 file should publish around **2026-12**. A second December error would mean the publisher has a December rule, not a slip, and would put 2027-12-15 back in play | The OIC/OCC 2028 Expiration Calendar publishing **2028-12-13** as its December volatility row. Registered as **FT-vix-expiration-2027-12-22-1**, score by **2027-02-28** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-12-22 VIX settlement. The date is
  `estimate`, and `estimate` widens caution rather than licensing anything.
- **Execution guard (Wed 2027-12-22), the only actionable line here:** nothing trades that day's opening
  auction. From Cboe's spec, read this session: *"Trading hours for expiring VX futures contracts end at
  8:00 a.m. Chicago time on the final settlement date"* — **09:00 ET** — and the SOQ is *"calculated from
  the sequence of 'opening trade prices' … of the constituent SPX options during the special opening
  auction."* Those prints are settlement artifacts, not information. Same guard all nine VIX siblings carry.
- **The deliverable, and it is a method upgrade not just an answer:** the date question was previously
  argued from *which publisher to believe*. It is answerable from **Cboe's own per-contract history
  files**, keyed by expiration date, where a monthly and a weekly are separated by series length. That
  surface is new to this class and it decides the case **7 of 7**.
- **The prior argument, weakened on purpose:** "35 of 36" is not the discriminating statistic. **13** of
  the OCC's 36 months are 35-gap months; the publisher is right on **12 of 12 non-December** ones and
  wrong on its **only** 35-gap December. Random-slip and December-defect fit that record equally.
- **What actually rules out the December defect:** Cboe's realized record. 2016-12-21 · 2017-12-20 ·
  2021-12-22 · 2022-12-21 · 2023-12-20 each return a **187–193-row monthly**; 2016-12-14 · 2017-12-13 ·
  2021-12-15 · 2022-12-14 · 2023-12-13 each return a **29–30-row weekly**. 2010-12-22 and 2011-12-21 are
  in `VRO_History.csv`; 2010-12-15 and 2011-12-14 are not, in a file that carried **only** monthlies then.
- **Live corroboration of the full clause, including the leg nobody tests:** `VX_2027-05-18.csv` is
  listed and `VX_2027-05-19.csv` is **not** — the unadjusted Wednesday is 05-19, and Cboe moved it
  because the *Friday* 30 days later (2027-06-18, Juneteenth observed) is a holiday. The clause's second
  leg is real and Cboe applies it 20 months ahead.
- **A publisher correction the last two ledgers in this class should carry:** the OIC/OCC calendar's
  **PDF and JSON are the same authored dataset**, not two derivations. Treating them as corroborating
  sources would double-count one publisher.
- **A calendar-hygiene conflict, recorded and not resolved here:**
  `proposals/vix-expiration-2027-12-15.from-fomc-minutes-2027-12-29.json` proposes this same settlement on
  the publisher's date and was due for its own initial research the same day as this one. Two canonical
  entries for one settlement double-count it. This lane writes only its own id's file.
- **Structural placement, not a call:** the 30-day reference window runs **2027-12-22 → 2028-01-21**,
  **21 trading sessions with two closures** — 2027-12-24 (Christmas observed) and 2028-01-17 (MLK). It is
  the only tracked VIX window in this calendar that **spans a year boundary**. 2027-12-31 is a trading
  day: NYSE observes a Saturday holiday on the preceding Friday *except* New Year's Day, and 2028-01-01
  is a Saturday.
- **Configuration for the next pulse to diff against** (Cboe primary closes, 2026-09-08): **VIX1D 10.43 ·
  VIX9D 14.81 · VIX 15.72 · VIX3M 18.39 · VVIX 88.69** — contango through the front. The listed VX strip
  runs **`U6` → `K7` (2027-05-18)**; **`VX/Z7` is not on it**, so no term-structure statement about this
  contract is available or made.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At D-469
  those describe a different expiry; they become quotable from roughly **2027-12-15**.

## Initial research

### The question

This id arrived as a **proposal from the December opex lane** —
[`opex-2027-12-17`](opex-2027-12-17.md)'s initial research — with an unusually explicit instruction to
the lane that would take it: *"THE DATE IS THE CONTESTED PART AND A TAKING LANE MUST NOT RESOLVE IT BY
PICKING THE EASIER SOURCE."* On the same day a second lane, `fomc-minutes-2027-12-29`, proposed **the
same settlement on a different day** — `vix-expiration-2027-12-15`, following the OCC's published row and
recording the seven-day discrepancy rather than smoothing it.

So the question is not "is there an interesting December settlement." It is: **which of two dates is the
December 2027 monthly VIX settlement, and can that be decided on evidence rather than on a preference
between publishers?** And underneath it, a method question this class has not asked: every lane so far has
adjudicated the rule against *calendars*. **Is there a Cboe surface that identifies a specific contract
by tenor, on realized data?**

**One-line verdict:** **2027-12-22**, and the prior argument for it was the weaker one. Cboe's own
per-contract history files separate a monthly from a weekly by series length, and on all **seven**
realized instances of December 2027's exact geometry the monthly settled on the later date — while the
"35 of 36" statistic that had been carrying this claim turns out not to discriminate at all.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`,
so no symbol-keyed instrument applies, and `scripts/research/` carries no settlement-shaped instrument
(`expiration-displacement.mjs` measures *equity-expiration volume*, a different mechanic, correctly not
run). Nothing was inherited: every primary was fetched raw this session and every number recomputed,
including both proposals' own claims.

**Primaries fetched raw and parsed by machine today (2026-09-09):**

- **Cboe VX contract specification** `cboe.com/tradable_products/vix/vix_futures/specifications/`
  (HTTP 200, **461,361 bytes**) — the *Final Settlement Date*, holiday-clause, *Termination of Trading*
  and *SOQ* text read verbatim out of the page's embedded payload. **The proposer explicitly could not do
  this** and cited the rule from a sibling ledger; this session read it.
- **Cboe VIX final-settlement series** `cdn.cboe.com/api/global/us_indices/daily_prices/VRO_History.csv`
  (HTTP 200, **26,597 bytes**, **1,268 rows**, 2008-07-16 → 2026-09-02).
- **Cboe per-contract VX history files** `cdn.cboe.com/data/us/futures/market_statistics/historical_data/VX/VX_<expiry>.csv`
  — **new to this class**, and the surface that decides the case. Twenty-nine dates probed; each returns
  the contract's full trading history keyed by its expiration date, or **403** if no such contract exists.
- **Cboe settlement CSV** `www.cboe.com/us/futures/market_statistics/settlement/csv` (HTTP 200,
  **1,731 bytes**, 56 rows) — the live strip.
- **Cboe index histories** (all HTTP 200): **VIX** (472,411 b), **VIX9D** (200,234), **VIX3M** (217,693),
  **VVIX** (108,519), **VIX1D** (54,020), through the 2026-09-08 close.
- **OIC / OCC expiration calendar JSON** `www.optionseducation.org/api/expirationcalendar` (HTTP 200,
  **34,871 bytes**, 155 dated rows) — **36** "Monthly Volatility Products Expiration date" rows.
- **OIC / OCC printed 2027 Expiration Calendar (PDF)** `optionseducation.org/getmedia/210094f5-…`
  (HTTP 200, **98,956 bytes**) — **new to this class**. It has **no text layer**: a single 1169×1077
  DeviceRGB image. It was inflated out of the PDF, re-encoded to PNG and **read as an image** in-session.

**Failed and recorded, not worked around:** `cdn.cboe.com/resources/release_notes/2027_Expiration_Calendar.pdf`
**HTTP 403** (three URL forms tried), `theocc.com/company-information/schedules` **HTTP 403**, and the
per-contract archive **403s for pre-2014 expiries** (2010-12-22, 2010-12-15, 2011-12-21, 2011-12-14). All
logged in `probe-ref.blocked`. The first two were blocked for the `vix-expiration-2027-10-20` lane too.

**Own computation.** A settlement-rule engine implementing Cboe's clause over a statute-derived US
market-holiday set; a gap-structure decomposition separating months by whether the next month's third
Friday is 28 or 35 days after their own; and a probe harness over the per-contract endpoint. Every figure
below is reproducible from the sources named.

**House sources:** both proposals for this id and for `vix-expiration-2027-12-15`;
[`vix-expiration-2027-10-20`](vix-expiration-2027-10-20.md) for the rule text's provenance and this
class's precedents; `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped.
Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The rule was read, not cited — SUPPORTED.** Verbatim from today's fetch:

   > "The final settlement date for a contract with the "VX" ticker symbol is on the Wednesday that is
   > 30 days prior to the third Friday of the calendar month immediately following the month in which
   > the contract expires."
   >
   > "If that Wednesday **or the Friday that is 30 days following that Wednesday** is a Cboe Options
   > holiday, the final settlement date for the contract shall be on the business day immediately
   > preceding that Wednesday."

   Applied to `VX/Z7`: third Friday of January 2028 = **2028-01-21** (a Friday); minus 30 days =
   **2027-12-22** (a Wednesday). Neither leg is a Cboe Options holiday — MLK 2028 is Monday **2028-01-17**,
   and the 2027-12-24 Christmas-observed closure is **neither leg**. The clause does not fire. Validated
   against eighteen years of prints: **218** rule-derived monthly settlements 2008-07 → 2026-08,
   **217** present in `VRO_History.csv`, the one absentee **2013-05-22** carrying no May-2013 row at any
   date — reproducing the two sibling implementations exactly.

2. **The publisher says 2027-12-15 in *both* of its artifacts — and they are one dataset, not two.
   MIXED, and the correction matters.** This session read the OCC's **printed 2027 calendar** as an
   image, which no prior lane had. Its December panel places the purple *Monthly Volatility Products
   Expiration date* square on **15** (with the blue A.M.-settled marker on 16 and the monthly equity
   diamond on 17); **22 is unmarked**. That agrees with the JSON.

   The tempting reading — two artifacts, therefore corroboration — is **wrong**, and it would have
   strengthened the case for 12-15. The PDF's own note reads *"While these dates are accurate as of
   **12/18/2025**"*; the JSON's reads *"as of **1/2/2026**"*; the PDF's `ModDate` is **2026-08-05**, i.e.
   re-saved eight months after its stated as-of without the as-of moving. This is **one authored dataset
   republished in two formats**. It does not raise the publisher's weight, and the last two ledgers in
   this class — which introduced the OIC/OCC calendar as "a second publisher" against *Cboe* — should
   carry the narrower reading.

3. **"35 of 36" does not discriminate — this REFUTES the proposal's own argument for the date it
   proposed, which is the uncomfortable half of this leg.** The proposal reasoned that *a rule a
   publisher obeys 35 times and breaks once is better evidence than the once*. Decompose the 36 months by
   geometry. Let `F_M` be a month's third Friday; settlement is `F_{M+1} − 30`, so it lands at **`F_M − 2`
   when the gap is 28 days** and at **`F_M + 5` when the gap is 35**. The 35-gap months are the only ones
   where the rule and a naive "Wednesday before this month's opex" heuristic differ:

   | | months in the OCC's file | publisher = rule | publisher = naive |
   |---|---|---|---|
   | 28-day gap (rule and naive agree) | 23 | 23 | 23 |
   | **35-day gap, non-December** | **12** | **12** | 0 |
   | **35-day gap, December** | **1** (2027-12) | **0** | **1** |

   So the publisher's 35 correct rows include only **12** that test anything, and **every one of them is a
   non-December month**. Its record is therefore **equally consistent** with a random one-row slip and
   with a December-specific defect — and under the second reading, 2027-12-15 would be *right* and the
   rule's naive-looking answer wrong. The proposal's argument does not close, and neither does the
   sibling's mirror-image *"follow the file, the OCC is the primary."*

4. **Cboe has no December exception — SUPPORTED, and this is the leg that decides the ledger.** The
   discriminating test needs a surface that identifies a contract **by tenor**, not by date. Cboe's
   per-contract history endpoint is one: it is keyed by expiration date and returns the contract's whole
   trading life, so a **monthly** (listed ~9 months out) and a **weekly** (listed ~6 weeks out) are
   separated by row count. Probed for every realized 35-gap December since 2008:

   | December | rule date `F+5` | rows | naive date `F−2` | rows | verdict |
   |---|---|---|---|---|---|
   | 2010 | 2010-12-22 | *403* — in `VRO` at 16.01 | 2010-12-15 | *403* — **not in `VRO`** | rule |
   | 2011 | 2011-12-21 | *403* — in `VRO` at 21.36 | 2011-12-14 | *403* — **not in `VRO`** | rule |
   | 2016 | 2016-12-21 | **193** | 2016-12-14 | 30 | rule |
   | 2017 | 2017-12-20 | **188** | 2017-12-13 | 30 | rule |
   | 2021 | 2021-12-22 | **193** | 2021-12-15 | 29 | rule |
   | 2022 | 2022-12-21 | **192** | 2022-12-14 | 29 | rule |
   | 2023 | 2023-12-20 | **187** | 2023-12-13 | 29 | rule |

   **Seven of seven.** The 2010 and 2011 files 403 (the archive does not serve pre-2014), but they need no
   row count: before weekly VX existed, `VRO_History.csv` carried **only** monthlies — **77 of its 78
   pre-2015 rows** are rule-derived monthly settlements, the single extra being 2008-10-17 — and it holds
   the rule's date in both years and the naive date in **neither**. Generalising beyond Decembers, across
   the **27** pre-weekly 35-gap months the rule's date is in `VRO` **26 of 27** (the missing one is the
   2013-05 absentee) and the naive date is in `VRO` **0 of 27**.

5. **The rule also reproduces every contract Cboe has *already listed* forward — SUPPORTED, and new.**
   Prior lanes validated the rule on history and on calendars. The per-contract endpoint validates it on
   **live listings**:

   | Listed monthly | gap | rows | naive date | result |
   |---|---|---|---|---|
   | 2026-09-16 `U6` | 28 | 177 | — | — |
   | **2026-10-21 `V6`** | **35** | 155 | 2026-10-14 | **2 rows — a weekly** |
   | 2026-11-18 `X6` | 28 | 136 | — | — |
   | 2026-12-16 `Z6` | 28 | 116 | — | — |
   | **2027-01-20 `F7`** | **35** | 97 | 2027-01-13 | **403 — unlisted** |
   | 2027-02-17 `G7` | 28 | 72 | — | — |
   | 2027-03-17 `H7` | 28 | 54 | — | — |
   | **2027-04-21 `J7`** | **35** | 30 | 2027-04-14 | **403 — unlisted** |
   | **2027-05-18 `K7`** | 28, **clause fires** | 10 | — | **2027-05-19 → 403** |

   **Nine of nine** on the rule's date. The last row is the sharpest: the unadjusted Wednesday for the May
   2027 contract is **2027-05-19**, and it is **not listed** — Cboe moved settlement to 05-18 because the
   *Friday 30 days later* (2027-06-18, Juneteenth observed) is a holiday. That is the clause's **second
   leg**, the one no prior ledger had seen applied, confirmed on a contract listed **twenty months ahead**.

6. **`VX/Z7` is unlisted, and the surface that will decide this is currently silent in *both* directions —
   SUPPORTED, and it is why the status does not promote.** The live settlement strip, re-fetched today,
   still stops at **`VX/K7` (2027-05-18)** — unchanged from the 2026-09-04 read the 10-20 sibling
   recorded — with `VX/U6 · V6 · X6 · Z6 · F7 · G7 · H7 · J7 · K7` and no `Z7` anywhere. On the
   per-contract endpoint, **`VX_2027-12-22.csv` and `VX_2027-12-15.csv` both return 403**. That symmetry
   is the honest finding: the surface has nothing to say about December 2027 yet, so it neither promotes
   this entry nor rescues the publisher's. Given the observed cadence — `K7` first traded 2026-08-24,
   roughly nine months ahead — `Z7` should list around **2027-03**, at which point exactly one of those
   two URLs returns a monthly-length series. **Promotion trigger:** `VX/Z7` listed dated **2027-12-22**.

7. **Nothing in the house system is settlement-keyed — SUPPORTED, re-verified rather than inherited.**
   `trade-playbooks.md` and `multi-symbol-sweep.md` grepped for
   `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**, matching every sibling
   result since 2026-09-05.

8. **The window is the only year-spanning one this calendar tracks — SUPPORTED, structural only.**
   `VX/Z7`'s 30-day reference window runs **2027-12-22 → 2028-01-21**: **21 trading sessions** with
   **two closures inside it**, 2027-12-24 (Christmas observed, since 2027-12-25 is a Saturday) and
   2028-01-17 (MLK). Every other tracked VIX window sits inside one year. **2027-12-31 is a trading day**
   — NYSE observes a Saturday holiday on the preceding Friday *except* for New Year's Day, and
   2028-01-01 is a Saturday; the calendar's own `sifma-bond-early-close-2027-12-31` proposal (an *early
   close*, not a closure) is consistent with that. Contents: `fhfa-hpi-2027-12-28` at +6 (`confirmed`),
   `fomc-minutes-2027-12-29` at +7 (`estimate`), plus the two 12-23 bond-market early-close proposals and
   `christmas-market-closure-2027-12-24`. `fomc-2028-01-26` falls **outside** the window, at +35.

9. **The sweep proposes nothing, and the refusal is computed — SUPPORTED.** The ±5-day corridor
   (2027-12-17 → 2027-12-27) contains six ids, **all already owned**: [`opex-2027-12-17`](opex-2027-12-17.md)
   at −5 (canonical, `confirmed`, and this event's proposer), `sp-quarterly-rebalance-effective-2027-12-20`
   at −2 (canonical), `consumer-confidence-2027-12-22` at 0 (canonical), `bond-market-early-close-2027-12-23`
   and `sifma-bond-early-close-2027-12-23` at +1 (proposals), and `christmas-market-closure-2027-12-24` at
   +2 (canonical). Two candidates were **declined**: **(a)** `opex-2028-01-21`, this contract's own
   reference series — declined on the precedent this class has now set four times, after
   `opex-2027-04-16`'s research corrected the "constitutive input" framing; **(b)** re-proposing anything
   already in the corridor, which is legal under the one-file-per-owner rule and pure noise.

10. **A conflict this lane records and does not resolve — SUPPORTED as a hygiene finding.**
    `proposals/vix-expiration-2027-12-15.from-fomc-minutes-2027-12-29.json` proposes the **same
    settlement** on the publisher's date, and its id was due for its own `never-assessed` research on the
    same day as this one. If both lanes write canonical files the calendar carries **two entries for one
    settlement**. This lane writes only the file its own id names and never edits or deletes another
    lane's — the reconciliation is a coverage decision no single lane should take, and it is recorded
    here so whoever takes it has the evidence in one place. Nothing in the proposing lane's own
    conclusions turns on it: that ledger states plainly that 2027-12-29 is an off-settlement release
    under **both** candidate dates.

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A decided date, on evidence rather than publisher preference.** **2027-12-22**, from **7 of 7**
  realized instances of the exact geometry and **9 of 9** live listings, on a Cboe surface that
  identifies contracts by tenor.
- **A retired argument, including the one that pointed the right way.** "35 of 36" does not
  discriminate: only **12** of the publisher's correct rows test the rule, and **all 12 are
  non-December**, so its record fits a December defect as well as a slip. The right answer was reached
  by the wrong route, and the route mattered.
- **A publisher correction for two sibling ledgers.** The OIC/OCC **PDF and JSON are one dataset**, not
  two; counting them as corroborating sources double-counts one publisher.
- **A method upgrade this class keeps.** Cboe's per-contract history endpoint, keyed by expiration date,
  answers *"is there a monthly on this date?"* directly — including the holiday clause's Friday leg,
  confirmed live at `2027-05-18` vs `2027-05-19`.

### Honest limits

The **date is `estimate`** and stays so until `VX/Z7` lists; the evidence is strong and the listing is the
missing thing. Leg 4's discrimination rests on **row count as a proxy for tenor** — a monthly lists ~9
months out and a weekly ~6 weeks, so 187–193 vs 29–30 is unambiguous here, but it is an inference from
listing cadence rather than a field labelled "monthly". The 2010 and 2011 legs rest on **absence** in
`VRO_History.csv` rather than on a contract file, which is sound only because that file carried no
weeklies then (77 of 78 rows). Leg 3's December-defect hypothesis is **not ruled out by the publisher's
own file** — it is ruled out by Cboe's record, so if Cboe's per-contract archive were ever shown to
mislabel expiries the argument would need rebuilding. The **holiday set is statute-derived**, and while
NYSE's own 2027 column was read by the 10-20 sibling and reproduces it 10 of 10, this session did not
re-read it; the 2028 legs (MLK 2028-01-17, the New Year's carve-out) are **inference from NYSE's stated
rule**, not a read of a published 2028 calendar, which does not yet exist. **Three surfaces returned 403**
and are logged. No house instrument tests any of this, which is why the outputs are a date and a set of
refusals rather than anything tradeable. Educational, paper-standard throughout.

## Stance & kill switches

**Stance (date `estimate` as of 2026-09-09 on Cboe rule text read direct, validated 217-of-218 against the
venue's own settlement prints, 9-of-9 against its live listings and 7-of-7 against the realized instances
of this event's exact geometry; `VX/Z7` unlisted; the OCC's published calendar dissenting at 2027-12-15).**
Treat **2027-12-22, 09:30 ET** as a known-date, **low-impact microstructure marker** and never as a
tradeable event. No position is opened, closed or sized because of it. One guard applies: **nothing
executes on that day's opening auction**, on any name — the expiring VX contract's last trade is 09:00 ET
and the SOQ's first prints are settlement artifacts. Three findings are carried forward rather than acted
on. **(a)** The date is **decided for 2027-12-22 and against 2027-12-15**, on Cboe's per-contract files:
all seven realized 35-gap Decembers settled the monthly five days *after* the December opex, five of them
separated by series length (187–193 rows against 29–30) and two by the pre-weekly settlement file. **(b)**
The argument that had been carrying this date — *the publisher obeys the rule 35 of 36 times* — is
**retired as non-discriminating**: only 12 of those rows test the rule and all 12 are non-December, so the
publisher's record fits a December-specific defect just as well. **(c)** The OIC/OCC **PDF and JSON are
one authored dataset**, so the publisher's agreement with itself is not corroboration. The one thing this
ledger will not do is promote to `confirmed` on arithmetic, however strong: `VX/Z7` is on no Cboe surface,
and both contested dates 403 symmetrically on the endpoint that will eventually decide it.

**Kill switches:**

- **Cboe lists `VX/Z7` with an expiration date other than 2027-12-22** — the whole document re-dates, and
  if that date is **2027-12-15** the publisher was right and legs 3–5 need rebuilding. Re-check
  `VX_2027-12-22.csv` and `VX_2027-12-15.csv` at every pulse; the listing is expected around **2027-03**.
- **`VX/Z7` appears on a Cboe settlement or per-contract surface dated 2027-12-22** — the promotion
  trigger; the entry flips `estimate` → `confirmed` under `OCC:` and nothing else changes.
- **The OIC/OCC 2028 Expiration Calendar publishes 2028-12-13 as its December volatility row** — 2028-12
  is the next 35-gap December (rule **2028-12-20**), so a second December error means the publisher has a
  December *rule*, not a slip, and 2027-12-15 goes back in play. Expected to publish around **2026-12**.
  This is **`FT-vix-expiration-2027-12-22-1`**, scored by **2027-02-28**.
- **The 2026-10-21 monthly settlement fails to appear at 2026-10-21** — the next 35-gap month, **42 days
  out**, and the nearest live test of the `F+5` geometry the whole ledger rests on. This is
  **`FT-vix-expiration-2027-12-22-2`**, scored by **2026-10-22**.
- **Cboe revises the VX specification, or publishes a 2027/2028 calendar putting a Cboe Options holiday on
  2027-12-22 or 2028-01-21** — the clause fires, settlement moves to the preceding business day, and this
  ledger re-dates. Re-fetch the specification and `nyse.com/markets/hours-calendars` by **2027-01-04**.
- **A canonical `vix-expiration-2027-12-15.json` is written** — the calendar then double-counts one
  settlement, and the reconciliation this lane declined to take becomes live. Check the corridor at every
  pulse.
- **A house vol/opex instrument gets built and back-tested** — leg 7 stops being mechanics-plus-citation
  and starts being data; this sheet is rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-12-22.md`](../forward-tests/vix-expiration-2027-12-22.md):
`FT-vix-expiration-2027-12-22-1`, the **December-defect discriminator** — the OCC's 2028 calendar rendering
its own 35-gap December, which is the single observation that separates the two hypotheses leg 3 could not;
and `FT-vix-expiration-2027-12-22-2`, a **near-term, genuinely uncertain single observation** — the
2026-10-21 settlement, 42 days out and the next 35-gap month. A third candidate was **declined**:
predicting that `VX/Z7` eventually lists at 2027-12-22 is the ledger's own thesis with a **close-out**
score date and no intermediate information, which duplicates the promotion trigger rather than testing
anything. Nothing here scores any sibling's row.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-469 | Initial research on an id that existed only as `proposals/vix-expiration-2027-12-22.from-opex-2027-12-17.json`; that proposal was read first and the **canonical `vix-expiration-2027-12-22.json` is written in this PR**, shadowing it. probe-ref seeded (no symbols; **VIX 15.72** at the 2026-09-08 Cboe close; band `low:15+`; 6 adjacents; **3 blocked URLs logged**). **THE CONTESTED DATE IS DECIDED FOR 2027-12-22, AND THE ARGUMENT THAT CARRIED IT IS RETIRED.** **(i) The rule was READ, not cited** — the proposer could not extract Cboe's spec body; this session pulled it from the page's embedded payload (HTTP 200, **461,361 B**). `VX/Z7`: Jan-2028 third Friday **2028-01-21**, −30d = Wed **2027-12-22**; neither leg a holiday (MLK 2028 is Mon **01-17**; the 12-24 Christmas-observed closure is neither leg). Clause does not fire. Rule reproduces **217 of 218** monthlies 2008-07→2026-08. **(ii) NEW PRIMARY — the publisher's PRINTED 2027 calendar**, a raster PDF with **no text layer** (HTTP 200, 98,956 B), inflated to a 1169×1077 image and read in-session: December's purple volatility square sits on **15**, 22 unmarked. **But the PDF and the JSON are ONE authored dataset, not two** — PDF note "accurate as of **12/18/2025**", JSON "**1/2/2026**", PDF `ModDate` **2026-08-05**. The last two ledgers in this class introduced this calendar as "a second publisher"; that reading must not extend to its own two formats. **(iii) "35 OF 36" DOES NOT DISCRIMINATE — this REFUTES the proposal's own reasoning for the date it proposed.** Decomposing the 36 months by gap (`F_{M+1}−F_M` = 28 or 35; settlement is `F_M−2` or `F_M+5`): **23** are 28-gap and test nothing, **12** are 35-gap non-December and the publisher gets **12/12** right, **1** is a 35-gap **December** and it gets **0/1**. A random slip and a December-specific defect fit that record equally — and under the second, 12-15 would be correct. **(iv) THE DECIDING LEG — Cboe has no December exception, tested on a surface NEW TO THIS CLASS.** `cdn.cboe.com/data/us/futures/market_statistics/historical_data/VX/VX_<expiry>.csv` is keyed by expiration date and returns a contract's whole life, so a monthly (listed ~9mo out) and a weekly (~6wk) separate by row count. Every realized 35-gap December: **2016-12-21 (193 rows) / 2017-12-20 (188) / 2021-12-22 (193) / 2022-12-21 (192) / 2023-12-20 (187)** against **2016-12-14 (30) / 2017-12-13 (30) / 2021-12-15 (29) / 2022-12-14 (29) / 2023-12-13 (29)** — monthly vs weekly, five for five. **2010 and 2011 403** (archive stops at 2014) but need no row count: pre-weekly `VRO_History.csv` carried **only** monthlies (**77 of 78** rows) and holds **2010-12-22 / 2011-12-21** and **neither** 2010-12-15 nor 2011-12-14. **SEVEN OF SEVEN.** Generalised: across **27** pre-weekly 35-gap months the rule's date is in `VRO` **26/27** and the naive date **0/27**. **(v) FORWARD VALIDATION, also new:** the rule reproduces **9 of 9** currently-listed monthlies `U6→K7`, and the 35-gap ones among them list at `F+5` while the naive date is a **2-row weekly** (2026-10-14) or **unlisted** (2027-01-13, 2027-04-14 → 403). Sharpest row: **`VX_2027-05-18` is listed and `VX_2027-05-19` is NOT** — Cboe applying the clause's **Friday leg** (Juneteenth-observed 2027-06-18) on a contract listed 20 months ahead, which no prior ledger had seen. **(vi) STATUS STAYS `estimate`:** the live strip still stops at **`VX/K7` 2027-05-18** (unchanged from 2026-09-04) and **`VX_2027-12-22.csv` AND `VX_2027-12-15.csv` BOTH 403** — symmetric, so that surface adjudicates neither yet; `Z7` should list ~**2027-03**. **Window:** 2027-12-22 → 2028-01-21, **21 sessions, TWO closures** (12-24 Christmas-observed, 2028-01-17 MLK) — the **only year-spanning** VIX window this calendar tracks; **2027-12-31 trades** (NYSE's New-Year's-on-Saturday carve-out). Contains `fhfa-hpi-2027-12-28` (+6, confirmed) and `fomc-minutes-2027-12-29` (+7); `fomc-2028-01-26` is **outside** at +35. Adjacency — **peers:** none (`symbols: []`). **Macro:** proposer's finding cited not re-derived (December quarterlies inert vs the other three: VIX P=0.198, \|S&P\| P=0.693, fwd realized vol P=0.372). **Volatility regime:** baseline row, nothing to diff; Cboe closes 2026-09-08 **VIX1D 10.43 · VIX9D 14.81 · VIX 15.72 · VIX3M 18.39 · VVIX 88.69**, contango. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** playbooks re-grepped → **zero hits in both**. **Blocked:** cboe 2027 expiration PDF **403** (3 URL forms), theocc schedules **403**, per-contract archive **403 for pre-2014**. **NOTHING PROPOSED, refusal computed:** all six corridor ids already owned; `opex-2028-01-21` declined on the four-times-set constitutive-input precedent. **HYGIENE CONFLICT RECORDED, NOT RESOLVED:** `proposals/vix-expiration-2027-12-15.from-fomc-minutes-2027-12-29.json` proposes this same settlement on the publisher's date and was due for its own initial research the same day; two canonical entries would double-count one settlement, and the reconciliation is a coverage decision no single lane should take. **`FT-vix-expiration-2027-12-22-1` and `-2` registered; a third declined** (predicting `VX/Z7` lists at 12-22 duplicates the promotion trigger). **Own weaknesses:** row count is a **proxy for tenor**, not a labelled field; 2010/2011 rest on **absence** in a file that happened to carry no weeklies; the December-defect hypothesis is ruled out by **Cboe's** record, not the publisher's own file; the 2028 holiday legs are **inference from NYSE's stated rule**, no 2028 calendar existing yet. | Initial stance set: **stand aside** (structural row only); date **`estimate`** at **2027-12-22** — rule-derived, adjudicated 7-of-7 on the venue's realized record, `VX/Z7` unlisted. | 2026-10-09 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2027-12-22.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
