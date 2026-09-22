# VIX futures and options October 2027 expiration (SOQ settlement) — vix-expiration-2027-10-20

**Kind:** opex · **Date:** 2027-10-20 (estimate, EST: Cboe's own VX specification applied cold — November 2027's third Friday is 2027-11-19, the Wednesday 30 days prior is 2027-10-20, and neither leg is a holiday on **NYSE's own 2027 column**, read direct this session — and the OIC/OCC expiration calendar independently marks 2027-10-20 "Monthly Volatility Products Expiration date". Stays `estimate` because **`VX/V7` is not listed** (Cboe's settlement curve stops at `VX/K7`, 2027-05-18) and because that calendar carries a **demonstrated off-by-a-week error one row later**, at its own 2027-12-15) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["opex-2027-10-15","fomc-blackout-start-2027-10-16"],"screenStreak":0,"blocked":[{"url":"https://cdn.cboe.com/resources/release_notes/2027_Expiration_Calendar.pdf","status":"403","at":"2026-09-06"},{"url":"https://www.theocc.com/company-information/schedules","status":"403","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **Stand aside — and take the correction, which is the whole point of this row.** The
proposal that seeded this id called 2027-10-20 "the first tracked expiration to settle inside an FOMC
blackout" and asked a later lane to *measure* that rather than inherit it. Measured, the premise is
false three ways. **In this calendar**, 6 of the 8 tracked VIX expirations settle inside a blackout —
three on the decision day, three (including this one) before it — and two siblings had already said so.
**In history**, 84 of 217 realized monthly settlements (**38.7%**) fall inside a blackout window, 42 of
them in exactly this pre-decision configuration; reclassifying under the narrower pre-2011-style
blackout rule moves **zero of 217**. **And the configuration is inert.** Against 133 non-blackout
settlements the 42 are null on all four price measures (**P = 0.61 – 0.86**), and null again on the
35-case subsample matching this event's exact five-sessions-ahead geometry. New to this class: the
settlement's *forward* accuracy is identical too — `VRO` minus realized SPX vol over the contract's own
30-day window runs **+3.61 points** on blackout cases against **+3.58** elsewhere (**P = 0.99**), and
`VRO` overprices realized in **81%** of them against **86%** otherwise, *less* often, the opposite sign
to the extra-uncertainty story. What does move is the decision **day**, not the blackout (+0.46% vs
−1.30%, P = 0.042). Date stays **`estimate`**: `VX/V7` is unlisted, and the one calendar naming the date
is **off by a week one row later**. **Nothing here licenses a position at D-409.**

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D-409, `symbols: []`, `impact: low`, and a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session rather than inherited | A house vol/opex instrument built and back-tested before **2027-10-20** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside on 2027-10-20; this week's load is the 2026-09-16 FOMC, ten days out** | High | Nothing in the 2026-09-07 → 2026-09-11 tape is `VX/V7`-keyed, and `VX/V7` is not even listed; the 2026-09-16 settlement is a *different* configuration (decision-day) with its own ledger, [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md) | Cboe listing `VX/V7` on a date other than 2027-10-20 before **2026-09-11**, which would re-date this whole ledger |
| This month | **Do not price a blackout premium into the 2026-10-21 settlement** — the next instance of this exact geometry, 45 days out | Medium | On 42 historical instances the pre-decision-in-blackout settlement is null on `VRO` vs prior close (P = 0.86), the open gap (P = 0.79), the SOQ basis (P = 0.61) and the close (P = 0.70); the exact five-sessions-ahead subsample (n = 35) is null on all four | The **2026-10-21** SOQ printing a basis to that session's VIX open **above +0.38%**, the non-blackout mean — a blackout premium showing up on the first out-of-sample instance. Registered as **FT-vix-expiration-2027-10-20-2** |
| This quarter | **Treat the date as rulebook-grade and the publisher as the weak leg** — the opposite of how this class has been reading it | Medium | Cboe's rule applied cold reproduces **217 of 218** settlements in Cboe's own `VRO` series and **35 of 36** of the OIC/OCC calendar's published volatility rows; the one disagreement is the **publisher's** 2027-12-15, which is internally inconsistent with the rule its other 35 rows obey | The OIC/OCC calendar reissuing 2027-12-15 as **2027-12-22**, or Cboe listing `VX/Z7` on 2027-12-15 — either would flip which source is wrong. Re-check both surfaces at every pulse |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-10-20 VIX settlement. The date is
  `estimate`, and `estimate` widens caution rather than licensing anything.
- **Execution guard (Wed 2027-10-20), the only actionable line here:** nothing trades that day's opening
  auction. Cboe's own spec, fetched today: *"Trading hours for expiring VX futures contracts end at 8:00
  a.m. Chicago time on the final settlement date"* — **09:00 ET** — and the SOQ is struck from the
  constituent SPX series' opening prints. Those prints are settlement artifacts, not information. Same
  guard all seven VIX siblings carry.
- **The correction this document banks, and it is the deliverable:** "settles inside a blackout" is a
  **majority property**, not a distinguishing one — **6 of 8** tracked expirations and **38.7%** of 217
  realized settlements — and it has **no measured price consequence**, on four contemporaneous measures
  and on the settlement's own forward accuracy.
- **The forward-accuracy leg, new to this class:** `VRO` at settlement minus realized SPX vol over the
  contract's own 30-day window is **+3.61 pts** on 42 blackout cases against **+3.58** on 133 others
  (P = 0.99); the overprice hit-rate is **81%** vs **86%**. A settlement struck with an unresolved
  decision in its window is *not* struck rich, and is very slightly *less* often too high.
- **What actually carries the effect, and it is the sibling's finding not a new one:** the pre-FOMC
  morning. Pre-decision-in-blackout settlements open **+0.46%** against decision-day settlements at
  **−1.30%** (P = 0.042); the 2×2 over all 4,592 sessions puts the blackout effect *off* settlements at
  **−0.14 pts, P = 0.34**. Blackout membership does nothing; the decision day does the work.
- **The status refusal, and it is measured:** six siblings promoted to `confirmed` under `OCC:` off a
  Cboe **listing** of the specific contract. `VX/V7` is on **no** Cboe surface (`VX` stops at `K7`, `VXM`
  at `G7`, zero `V7` rows anywhere). The one calendar that names 2027-10-20 is **off by a week at
  2027-12-15**. Arithmetic plus a publisher with a dated error is `estimate`.
- **Two findings that belong to sibling lanes and are recorded, not acted on** (this lane never edits
  another event's file): the OIC/OCC calendar **does** publish `2027-09-15` as a volatility expiration,
  which [`vix-expiration-2027-09-15`](vix-expiration-2027-09-15.md) called unlisted today; and
  `opex-2027-09-17` is `confirmed` off this same artifact, whose far end now has a demonstrated error.
- **Structural placement, not a call:** the 30-day reference window runs **2027-10-20 → 2027-11-19**,
  **22 trading sessions, zero closures** (Thanksgiving 2027-11-25 falls after it). It contains
  [`fomc-2027-10-26`](fomc-2027-10-26.md) at +6, `fomc-2027-10-27` at +7,
  [`consumer-confidence-2027-10-26`](consumer-confidence-2027-10-26.md) and
  [`fhfa-hpi-2027-10-26`](fhfa-hpi-2027-10-26.md) at +6, and `fomc-minutes-2027-11-17` at +28 (outside).
  All `estimate` except the FHFA print.
- **Configuration for the next pulse to diff against** (Cboe primary closes, 2026-09-04): **VIX1D 12.03 ·
  VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; the listed VX strip runs **U6 16.2669 → K7
  21.15**, monotone contango. **`VX/V7` is not on it** — no term-structure statement about this contract
  is available or made.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At D-409
  those describe a different expiry; they become quotable from roughly **2027-10-13**.

## Initial research

### The question

This id arrived as a **proposal from the blackout lane** —
[`fomc-blackout-start-2027-10-16`](fomc-blackout-start-2027-10-16.md)'s initial research, which titled it
*"the first tracked expiration to settle inside an FOMC blackout"* and then, unusually and usefully, told
the next lane not to trust its own framing: *"A lane taking this id should treat the in-blackout
settlement as a QUESTION to measure against the other tracked expirations, not as an edge it has
inherited."*

So the question is not "when does `VX/V7` settle." It is: **is settling inside a blackout distinctive at
all — in this calendar, in history, or in the price?** And underneath it, one method question this class
has never asked: every sibling validates Cboe's settlement rule against Cboe. **Is there a second,
independent publisher to check it against?**

**One-line verdict:** the premise is **false three ways and the price effect is nothing** — 6 of 8
tracked expirations and 38.7% of 217 realized settlements sit inside a blackout, the 42 pre-decision
cases are null on four contemporaneous measures *and* on the settlement's own forward accuracy, and the
apparent effect belongs to the decision day the sibling already isolated. And yes, there is a second
publisher — the OIC/OCC expiration calendar, which agrees with the rule **35 of 36** times and is
**wrong at its own far end**.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`,
so no symbol-keyed instrument applies, and `scripts/research/` carries no vol- or settlement-shaped
instrument (`expiration-displacement.mjs` measures *equity-expiration volume*, a different mechanic, and
was not run). Nothing was inherited: every primary was re-fetched and every number recomputed, including
the proposal's own claims and the sibling ledgers' figures.

**Primaries fetched raw and parsed by machine today (2026-09-06):**

- **Cboe VX contract specification** `cboe.com/tradable_products/vix/vix_futures/specifications/`
  (HTTP 200, **461,261 bytes**) — the *Final Settlement Date*, holiday-clause and *Termination of
  Trading* text read verbatim out of the page's embedded payload.
- **Cboe VIX final-settlement series** `cdn.cboe.com/api/global/us_indices/daily_prices/VRO_History.csv`
  (HTTP 200, **26,597 bytes**, **1,268 rows**, 2008-07-16 → 2026-09-02) — the actual SOQ prints.
- **Cboe index histories** (`cdn.cboe.com/api/global/us_indices/daily_prices/…`, all HTTP 200):
  **VIX** (472,309 b, 9,266 bars), **SPX** (292,573 b, 13,028 bars), **VIX1D** (53,971), **VIX9D**
  (200,183), **VIX3M** (217,642), **VVIX** (108,498).
- **Cboe settlement CSV** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04`
  (HTTP 200, **1,731 bytes**, 56 rows).
- **OIC / OCC expiration calendar** `www.optionseducation.org/api/expirationcalendar` (HTTP 200,
  **34,871 bytes**, 155 dated rows, 2025-01-01 → 2027-12-31) — **the second publisher, and new to this
  class**: its legend resolves each row's GUID, and it carries **36** "Monthly Volatility Products
  Expiration date" rows.
- **Federal Reserve Board FOMC calendars** — `federalreserve.gov/monetarypolicy/fomccalendars.htm`
  (HTTP 200, **164,831 bytes**, panels 2021–2027) plus the fourteen historical pages **2007–2020**
  (HTTP 200 each). Parsed heading by heading, excluding `(notation vote)` and conference calls, expanding
  the cross-month forms. Returns **167 scheduled meetings, 8 in every year 2007–2027 except 2020's 7** —
  reproducing [`vix-expiration-2027-09-15`](vix-expiration-2027-09-15.md)'s parse exactly by an
  independent implementation.
- **NYSE holidays & trading hours** `nyse.com/markets/hours-calendars` (HTTP 200, **109,180 bytes**) —
  **read successfully this session**, where the 2027-09-15 sibling met a 403 the same day. Its 2027
  column: Jan 1 · Jan 18 · Feb 15 · Mar 26 · May 31 · Jun 18 · Jul 5 · Sep 6 · Nov 25 · Dec 24.

**Failed and recorded, not worked around:** `cdn.cboe.com/resources/release_notes/2027_Expiration_Calendar.pdf`
**HTTP 403** and `theocc.com/company-information/schedules` **HTTP 403**, both logged in
`probe-ref.blocked`. Both were blocked for the `vix-expiration-2027-01-20` lane on the same day.

**Own computation.** A settlement-rule engine implementing Cboe's clause over a US market-holiday set
derived from statute and rule; a **blackout engine** implementing the Fed's own rule (open of the second
Saturday preceding the meeting, through the Thursday following it) over the 167 parsed meetings; then the
configuration census, the four contemporaneous difference-in-means measures with 100,000-draw two-sided
permutation tests, a blackout × settlement 2×2 over all 4,592 sessions, a realized-vol computation over
each contract's own 30-day window, and a rule-version robustness re-run. Every figure below is
reproducible from the sources named.

**House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped;
`src/domain/market-events/` and its `proposals/` for the corridor, the window and the census; the
[`vix-expiration-2027-09-15`](vix-expiration-2027-09-15.md),
[`vix-expiration-2027-04-21`](vix-expiration-2027-04-21.md),
[`vix-expiration-2027-01-20`](vix-expiration-2027-01-20.md) and
[`fomc-blackout-start-2027-10-16`](fomc-blackout-start-2027-10-16.md) ledgers for what was already
banked. Genre model: [`nvda-aug-2026-print.md`](../nvda-aug-2026-print.md).

### Conviction legs, tested

1. **The date is rule-derived, and this session found a SECOND publisher to check the rule against —
   SUPPORTED, and this is the method contribution.** Cboe's VX specification, verbatim from today's
   fetch:

   > "The final settlement date for a contract with the "VX" ticker symbol is on the Wednesday that is
   > 30 days prior to the third Friday of the calendar month immediately following the month in which
   > the contract expires."
   >
   > "If that Wednesday **or the Friday that is 30 days following that Wednesday** is a Cboe Options
   > holiday, the final settlement date for the contract shall be on the business day immediately
   > preceding that Wednesday."

   Applied cold to the October 2027 contract: third Friday of November 2027 = **2027-11-19**; the
   Wednesday 30 days prior = **2027-10-20**. Neither leg is a holiday — and here that is **read off the
   exchange's own 2027 table** rather than inferred, which the 2027-09-15 sibling could not do (403).
   NYSE's 2027 column lists ten closures, **none in October** and none on 2027-11-19; the engine's
   statute-derived 2027 set reproduces all **10 of 10** exactly. The clause does not fire.

   Two validations, one of which is new to this class:

   | Check | Result |
   |---|---|
   | Rule-derived monthly settlements 2008-07 → 2026-08 | **218** |
   | Present in Cboe's `VRO_History.csv` | **217** — reproducing the 2027-09-15 sibling by an independent implementation |
   | Absent | **1** — 2013-05-22; Cboe's file carries **no May-2013 row at any date** |
   | Displacements the holiday clause produced in range | **6** — 2014-03-18, 2019-03-19, 2022-03-15, **2024-06-18** (Wednesday leg), 2025-03-18, 2026-05-19 |
   | **NEW: rule vs the OIC/OCC calendar's own volatility rows, 2025-01 → 2027-12** | **35 of 36** |
   | …and the one disagreement | **the publisher's**, not the rule's — see leg 2 |

2. **The `estimate` status survives, and the reason is now a measured publisher error rather than a
   taxonomy note — SUPPORTED.** Six siblings in this class promoted to `confirmed` under `OCC:`; every
   one of them had the specific contract **listed** on a Cboe settlement surface. `VX/V7` is not:
   today's settlement CSV stops at **`VX/K7` (2027-05-18)**, `VXM` stops at **`VXM/G7` (2027-02-17)**,
   and a grep for `V7` across all 56 rows returns **zero**.

   The one surface that *does* name 2027-10-20 is the OIC/OCC calendar — and this session found it
   **wrong one row later**. Its 36 published volatility-expiration dates match the rule 35 times; the
   exception is its own **2027-12-15**, where the rule gives **2027-12-22**. The publisher's row is
   internally inconsistent with the rule its other 35 rows obey: 2027-12-15 + 30 days is **2028-01-14**,
   the **second** Friday of January 2028, not the third (**2028-01-21**). An off-by-one week at the far
   end of the series. The document also footnotes itself: *"While these dates are accurate as of
   1/2/2026, they are subject to change."*

   So the honest reading inverts this class's habit: the **rule** is the strong leg (217/218 against
   eighteen years of prints) and the **publisher** is the weak one. Arithmetic plus a publisher with a
   dated error is `estimate`. **Promotion trigger:** `VX/V7` on a Cboe settlement or expiration-calendar
   surface dated 2027-10-20.

   **Two findings for sibling lanes, recorded and not acted on** — this lane writes no other event's
   file. (a) The same calendar **does** publish `2027-09-15` as a volatility expiration, where
   [`vix-expiration-2027-09-15`](vix-expiration-2027-09-15.md) concluded today that `VX/U7` appears on no
   surface and stayed `estimate` for that reason; that lane has a listing it did not see, and a publisher
   whose far end is now known to err. (b) `opex-2027-09-17` is `confirmed` off this same artifact.
   Neither is this lane's to change.

3. **"Settles inside a blackout" is a majority property in this calendar — REFUTES the proposal's
   framing, and two siblings already said so.** Applying the blackout engine to every VIX expiration
   this repo tracks:

   | Tracked expiration | Blackout state | Gate |
   |---|---|---|
   | 2026-09-16 | **decision-day** | 2026-09-05 → 2026-09-17 |
   | 2027-01-20 | **pre-decision** | 2027-01-16 → 2027-01-28 |
   | 2027-02-17 | outside | — |
   | 2027-03-17 | **decision-day** | 2027-03-06 → 2027-03-18 |
   | 2027-04-21 | **pre-decision** | 2027-04-17 → 2027-04-29 |
   | 2027-05-18 | outside | — |
   | 2027-09-15 | **decision-day** | 2027-09-04 → 2027-09-16 |
   | **2027-10-20** | **pre-decision** | 2027-10-16 → 2027-10-28 |

   **6 of 8**, and this is not even the first *pre-decision* one — `2027-01-20` and `2027-04-21` are both
   earlier and both tracked. A settlement on a decision day is inside the window **by construction**,
   since the gate runs through the Thursday *after* the meeting, which is why the three decision-day
   siblings are in-blackout without any of them saying so. And the observation was already banked twice:
   [`vix-expiration-2027-01-20`](vix-expiration-2027-01-20.md) downgraded it verbatim (*"5 of 9 listed
   settlements sit inside a tracked FOMC blackout … a majority property is not a distinguishing one"*),
   and [`vix-expiration-2027-04-21`](vix-expiration-2027-04-21.md) carries **this exact geometry** as its
   own headline — inside the blackout, **five sessions before** the decision, with the decision inside
   its strip — and refuted an event premium in it on term-structure grounds. The engine independently
   reproduces the parent's gate (**2027-10-16 → 2027-10-28**) and the 2026 October gate
   (**2026-10-17 → 2026-10-29**) that ledger cites.

4. **Nor is it distinctive in history — REFUTED.** Intersecting 217 realized settlements with the
   blackout windows of 167 parsed meetings:

   | Settlement's blackout state | n | Share |
   |---|---|---|
   | Outside any blackout | 133 | 61.3% |
   | **Pre-decision, inside** (this event's configuration) | **42** | 19.4% |
   | Decision-day (the 2027-09-15 sibling's configuration) | 37 | 17.1% |
   | Overhang, inside | 5 | 2.3% |

   **84 of 217 — 38.7% — settle inside a blackout.** And the geometry is near-deterministic: **35 of the
   42** pre-decision cases sit exactly **five sessions** before the decision, which is 2027-10-20's own
   spacing; the other seven are the displaced or one-session cases. Forward, 2026-09 → 2028-03, **5 of
   19** settlements are pre-decision-in-blackout and 3 are decision-day.

   **Rule-version robustness, because the sample predates the current policy.** Today's "second Saturday
   preceding" form was not in force for the whole window. Re-running the census under the narrower
   pre-2011-style rule (Tuesday of the week preceding, through the Thursday following) reclassifies
   **zero of 217** cases — a Wednesday settlement five sessions before a Tuesday/Wednesday meeting is
   inside *both* forms. The anachronism does not touch a single observation.

5. **The price consequence — REFUTED on four contemporaneous measures, and this is the leg the ledger
   exists for.** *The setup.* Cboe's spec ends trading in the expiring contract at **08:00 Chicago
   (09:00 ET)** and strikes the SOQ from opening prints at **09:30 ET**. On this configuration the
   contract cash-settles with an FOMC decision **unresolved, inside its own 30-day reference window,
   five sessions away, and with the official interpretation channel closed** in both directions. The
   natural claim is that the SOQ prints rich.

   *The test.* 42 pre-decision-in-blackout settlements against 133 non-blackout ones, log points of VIX,
   100,000-draw two-sided permutation:

   | Measure | Pre-decision, in blackout (n = 42) | Outside a blackout (n = 133) | Diff | P |
   |---|---|---|---|---|
   | `VRO` vs prior close | +0.50% (med +0.93) | +0.67% (med −0.06) | −0.17 | **0.86** |
   | VIX **open** vs prior close | +0.46% (med −0.06) | +0.29% (med +0.14) | +0.17 | **0.79** |
   | **SOQ basis** (`VRO` vs same-session open) | +0.04% (med +0.04) | +0.38% (med +0.07) | −0.34 | **0.61** |
   | VIX close vs `VRO` | −0.90% (med −1.31) | −0.50% (med −0.43) | −0.40 | **0.70** |

   Null on every one, on mean and on median (median P = 0.47 / 0.55 / 0.96 / 0.38). Restricting to the
   **35** cases with this event's exact five-sessions-ahead geometry does not rescue it: P = **0.96 /
   0.62 / 0.60 / 0.82**. If anything the SOQ basis is *smaller* inside the blackout, the wrong sign for
   the premium story.

   *The control.* Over all 4,592 sessions 2008-07 → 2026-08, VIX open vs prior close:

   | | outside a blackout | inside a blackout |
   |---|---|---|
   | **not a settlement** | +0.84% (n = 3,154) | +0.70% (n = 1,221) |
   | **settlement** | +0.29% (n = 133) | −0.41% (n = 84) |

   The blackout effect **off** settlements is **−0.14 pts at P = 0.34** — nothing. The in-blackout
   settlement cell is dragged by the 37 decision-day cases inside it, and separating them is decisive:
   pre-decision settlements open **+0.46%** against decision-day settlements at **−1.30%**, a gap of
   **+1.76 pts at P = 0.042**. That is [`vix-expiration-2027-09-15`](vix-expiration-2027-09-15.md)'s
   pre-FOMC morning drift, seen from a new angle and corroborated: **the decision day carries it; the
   blackout carries nothing.**

6. **The settlement's FORWARD accuracy is also identical — REFUTED, and no sibling has run this.** Every
   prior measurement in this class is contemporaneous. The sharper question about a settlement struck
   with an unresolved decision in its window is whether the level it fixes turns out to be **too high**.
   For all 217 settlements, realized close-to-close SPX vol was computed over the contract's own 30-day
   reference window (settlement → the reference third Friday, 19–22 sessions) and differenced against
   `VRO`:

   | Group | `VRO` | realized | premium | `VRO` > realized |
   |---|---|---|---|---|
   | Pre-decision, in blackout (n = 42) | 20.59 | 16.98 | **+3.61** (med +4.69) | **34 / 42 = 81%** |
   | Decision-day (n = 37) | 19.18 | 15.16 | +4.02 (med +3.84) | 31 / 37 = 84% |
   | Outside a blackout (n = 133) | 19.40 | 15.82 | **+3.58** (med +4.70) | **114 / 133 = 86%** |

   **+3.61 vs +3.58 points, P = 0.99** — and the same null on any-blackout vs none (+0.04, P = 0.98) and
   on the exact-geometry subsample (+0.35, P = 0.83). The overprice hit-rate is **lower** inside the
   blackout, not higher. A settlement struck with a closed communication channel and an unresolved
   decision ahead is not struck rich, and does not go on to be *more* often too high. **REFUTED.**

7. **What the configuration *does* change is an execution fact, not a price fact — SUPPORTED.** The
   expiring contract's last trade is **09:00 ET** and it cash-settles from opening prints, so a holder
   is settled at a level struck **five sessions before** a decision they can no longer trade the
   contract around. That is a liquidity and control fact, and it belongs where E1 (the don't-trade-the-open
   rule) already lives. It sharpens an existing guard rather than adding a signal — the same conclusion
   the 2027-09-15 sibling reached for its own configuration.

8. **The 30-day window is holiday-clean and its contents are the loaded part — SUPPORTED, structural
   only.** `VX/V7`'s reference window runs **2027-10-20 → 2027-11-19**: 30 calendar days, **22 trading
   sessions, zero exchange closures** — Thanksgiving 2027-11-25 falls *after* it, and NYSE's own 2027
   column puts no closure inside. Contents: [`fomc-2027-10-26`](fomc-2027-10-26.md) at **+6** and
   `fomc-2027-10-27` at **+7** (the decision), [`consumer-confidence-2027-10-26`](consumer-confidence-2027-10-26.md)
   and [`fhfa-hpi-2027-10-26`](fhfa-hpi-2027-10-26.md) at +6; `fomc-minutes-2027-11-17` at +28 is
   outside. All `estimate` except the FHFA print. The parent ledger's own finding bears on this and is
   **cited, not re-derived**: the October gate is an *earnings* gate whose boundary sessions run
   **below** their own month's baseline (overhang 0.641× median across 10 realized October gates), and
   the family's only direct test of a release landing inside a blackout returned **0 of 9**.

9. **Nothing in the house system is settlement-keyed — SUPPORTED, re-verified rather than inherited.**
   `trade-playbooks.md` and `multi-symbol-sweep.md` grepped for
   `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**, matching every sibling
   result since 2026-09-05. `scripts/research/`'s one expiration-shaped instrument,
   `expiration-displacement.mjs`, measures *equity-expiration volume* on single names — a different
   mechanic, correctly not run.

10. **The sweep proposes nothing, and the refusal is computed — SUPPORTED.** The ±5-day corridor
    (2027-10-15 → 2027-10-25) contains exactly two ids, both already owned: `opex-2027-10-15` at −5 (a
    sibling lane's proposal, due for its own initial research right now) and
    [`fomc-blackout-start-2027-10-16`](fomc-blackout-start-2027-10-16.md) at −4 (canonical). Three
    candidates were **declined**: **(a)** re-proposing `opex-2027-10-15` — legal under the
    one-file-per-owner rule and pure noise, since the lane researching it writes the canonical file.
    **(b)** `opex-2027-11-19`, this contract's own reference series — declined on the precedent this
    class has now set three times, after `opex-2027-04-16`'s research corrected the "constitutive input"
    framing. **(c)** The **eight untracked** monthly VIX settlements between 2026-09 and 2027-12
    (2026-10-21 · 2026-11-18 · 2026-12-16 · 2027-06-16 · 2027-07-21 · 2027-08-18 · 2027-11-17 ·
    2027-12-22) — a coverage-policy decision no single lane should take. This is the **third** ledger in
    this class to record it; the 2027-09-15 sibling called two "the signal."

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A correction, computed rather than asserted.** "The first tracked expiration to settle inside an FOMC
  blackout" is false in the calendar (**6 of 8**, and not even the first pre-decision one), false in
  history (**38.7%** of 217), and immaterial in the price.
- **A measured refusal on four contemporaneous measures** — the 42 pre-decision-in-blackout settlements
  are null against 133 non-blackout ones at **P = 0.61 – 0.86**, null again on the 35-case exact-geometry
  subsample, and what *does* move belongs to the decision day the 2027-09-15 sibling already isolated.
- **A forward-accuracy null, new to this class** — `VRO` minus realized SPX vol over the contract's own
  window is **+3.61 vs +3.58 pts (P = 0.99)**, with an overprice rate of **81% vs 86%**.
- **A second publisher, and the discovery that it is the weak leg** — the OIC/OCC calendar matches the
  rule **35 of 36** and is off by a week at its own **2027-12-15**, which is why this entry stays
  `estimate` where six siblings promoted, and which two sibling lanes should know about.

### Honest limits

The **date is `estimate`** and stays so until `VX/V7` is listed; the arithmetic is strong (217/218 and
35/36) and the listing is the missing thing. Leg 5's sample is **42 against 133**, and its exact-geometry
arm **35 against 133**; a null on those numbers is a **failure to reject**, not proof of absence — it can
exclude an effect roughly the size of the differences it measured, and nothing smaller. Leg 6's realized
vol is **close-to-close SPX**, not intraday, and treats the 30-day window as its trading sessions only;
`VRO` is a **daily** series, so the SOQ basis compares two prints struck minutes apart, not
simultaneously. The **blackout windows are computed from the Fed's stated rule, not decoded from the
Board's shaded PDF** — that decode belongs to the `fomc-blackout-start-2027-04-17` lane and was not
re-run here; the arithmetic reproduces the parent's 2027 and 2026 October gates exactly, and the
rule-version robustness re-run moves zero cases, but this is inference for the pre-2011 half of the
sample rather than a read of a published calendar. **Two Cboe/OCC surfaces returned 403** and are logged.
The publisher-error finding rests on **one row** (2027-12-15) and on the assumption that Cboe's rule text
governs the OIC calendar's volatility column — internally consistent across its other 35 rows, but an
inference. No house instrument tests any of this, which is exactly why these are refusals rather than
inversions into trades. Nothing about same-day VIX open interest by strike or SPX gamma is quoted: at
D-409 that describes a different expiry. Educational, paper-standard throughout.

## Stance & kill switches

**Stance (date `estimate` as of 2026-09-06 on Cboe rule text validated 217-of-218 against the venue's own
settlement prints and 35-of-36 against a second publisher; `VX/V7` unlisted; every event in the reference
window `estimate` except `fhfa-hpi-2027-10-26`).** Treat **2027-10-20, 09:30 ET** as a known-date,
**low-impact microstructure marker** and never as a tradeable event. No position is opened, closed or
sized because of it. One guard applies: **nothing executes on that day's opening auction**, on any name —
the expiring VX contract's last trade is 09:00 ET and the SOQ's first prints are settlement artifacts.
Three findings are carried forward rather than acted on. **(a)** The proposal's framing is **corrected**:
settling inside a blackout is a majority property — **6 of 8** tracked expirations, **38.7%** of 217
realized settlements, and **zero of 217** cases reclassify under the narrower historical blackout rule.
**(b)** The configuration is **measured inert twice over**: null on four contemporaneous measures against
133 non-blackout settlements (**P = 0.61 – 0.86**, and P ≥ 0.60 on the exact-geometry subsample), and
null on the settlement's own forward accuracy (**+3.61 vs +3.58 pts, P = 0.99**; overprice rate **81% vs
86%**). What moves is the decision day (**+0.46% vs −1.30%, P = 0.042**), which is the 2027-09-15
sibling's finding, corroborated. **(c)** The **publisher is the weak leg, not the rule** — the OIC/OCC
calendar is off by a week at its own 2027-12-15, which is why this entry does not promote. The one thing
this ledger will not do is treat "unresolved decision inside the window, channel closed" as a reason to
expect a rich SOQ; that is exactly what leg 6 measured and refused.

**Kill switches:**

- **Cboe lists `VX/V7` with an expiration date other than 2027-10-20** — leg 1's rule fails on the one
  contract this ledger is about, and the entire document re-dates. Re-check both Cboe surfaces at every
  pulse rather than trusting the arithmetic.
- **`VX/V7` appears on a Cboe settlement or expiration-calendar surface dated 2027-10-20** — the
  promotion trigger; the entry flips `estimate` → `confirmed` under `OCC:` and nothing else changes.
- **The 2026-10-21 settlement's SOQ basis to its own VIX open prints above +0.38%** — the next instance
  of this exact geometry, **45 days out**, would put the leg-5 null back in play on out-of-sample data.
  This is **`FT-vix-expiration-2027-10-20-2`**.
- **The pre-decision-in-blackout comparison reaches P < 0.05 once the upcoming instances are added** —
  2026-10-21, 2027-01-20, 2027-04-21, 2027-07-21 and 2027-10-20 itself are the next five; if the effect
  is real it should strengthen, not stay at 0.61. This is **`FT-vix-expiration-2027-10-20-1`**, scored at
  close-out.
- **The OIC/OCC calendar reissues 2027-12-15 as 2027-12-22, or Cboe lists `VX/Z7` on 2027-12-15** —
  leg 2's publisher-error finding flips, and the status refusal loses its measured half. Re-check the
  calendar at every pulse.
- **NYSE or Cboe publishes a revised 2027 calendar putting a closure on 2027-10-20 or 2027-11-19** — the
  holiday clause fires, settlement moves to the preceding business day, and this ledger re-dates.
  Re-fetch `nyse.com/markets/hours-calendars` by **2027-01-04**.
- **The October 2027 FOMC moves off 2027-10-26/27, or the blackout off 2027-10-16** — the configuration
  this document is about ceases to exist; the settlement date is unaffected but every framing above is.
  Observe by **2027-09-15**, when the September meeting confirms the October slot.
- **A house vol/opex instrument gets built and back-tested** — legs 5, 6, 7 and 9 stop being
  mechanics-plus-citation and start being data; this sheet is rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-10-20.md`](../forward-tests/vix-expiration-2027-10-20.md):
`FT-vix-expiration-2027-10-20-1`, the **pre-decision-in-blackout null** re-scored with the upcoming
instances added, scored at close-out 2027-10-26; and `FT-vix-expiration-2027-10-20-2`, a **near-term,
genuinely uncertain single observation** — the 2026-10-21 settlement, 45 days out and the next instance
of this exact five-sessions-ahead geometry. A third candidate was **declined**: predicting that `VRO`
exceeds realized vol at 2026-10-21 has an **81–86% base rate in both arms**, so it cannot plausibly
discriminate — a test that near-certainly passes is not a test. Nothing here scores any sibling's row.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-409 | Initial research on an id that existed only as `proposals/vix-expiration-2027-10-20.from-fomc-blackout-start-2027-10-16.json`; that proposal was read first and the **canonical `vix-expiration-2027-10-20.json` is written in this PR**, shadowing it. probe-ref seeded (no symbols; **VIX 14.53** at the 2026-09-04 Cboe close; band `low:15+`; 2 adjacents; **2 blocked URLs logged**). **THE PROPOSAL'S CENTRAL FRAMING IS CORRECTED, exactly as it asked.** "First tracked expiration to settle inside an FOMC blackout" is false three ways. **(i) Calendar: 6 of 8** tracked VIX expirations settle in-blackout — 2026-09-16 / 2027-03-17 / 2027-09-15 on the decision day (inside **by construction**, the gate runs through the Thursday *after*), 2027-01-20 / 2027-04-21 / this one before it; only 02-17 and 05-18 are outside. Two siblings already banked it: `-2027-01-20` ("5 of 9 … a majority property is not a distinguishing one") and **`-2027-04-21`, which carries THIS EXACT GEOMETRY as its headline** and refuted an event premium on term-structure grounds. **(ii) History: 84 of 217** realized settlements (**38.7%**) are in-blackout — 42 pre-decision, 37 decision-day, 5 overhang — and **35 of the 42** sit exactly **5 sessions** before the decision, this event's own spacing. Robustness: re-running under the **narrower pre-2011-style rule** (Tuesday of the preceding week) reclassifies **0 of 217**. **(iii) Price: REFUTED, twice.** 42 pre-decision-in-blackout vs 133 non-blackout, 100k-draw permutation: `VRO` vs prior close +0.50 vs +0.67 (**P=0.86**), open vs prior close +0.46 vs +0.29 (**P=0.79**), **SOQ basis +0.04 vs +0.38 (P=0.61)**, close vs `VRO` −0.90 vs −0.50 (**P=0.70**); exact-geometry subsample (n=35) **P=0.96/0.62/0.60/0.82**. 2×2 over 4,592 sessions: blackout effect **off** settlements **−0.14, P=0.34**. Separating the cells is decisive — pre-decision **+0.46%** vs decision-day **−1.30%**, **+1.76 at P=0.042**: the **pre-FOMC drift**, corroborating `-2027-09-15` from a new angle. **LEG 6, NEW TO THIS CLASS — forward accuracy:** `VRO` minus realized close-to-close SPX vol over each contract's own 30-day window is **+3.61 pts (n=42)** vs **+3.58 (n=133)**, **P=0.99**; overprice rate **81% vs 86%** — *lower* inside the blackout, wrong sign for the premium story. **LEG 1 — a SECOND PUBLISHER, the method contribution:** the OIC/OCC calendar (HTTP 200, 34,871B) publishes **36** volatility-expiration rows 2025-01→2027-12 and matches Cboe's rule **35 of 36**; the rule separately reproduces **217 of 218** `VRO` prints (independent implementation of `-2027-09-15`'s result) and all 6 displacements. **LEG 2 — stays `estimate`, and the reason is now MEASURED:** `VX/V7` is on no Cboe surface (`VX` stops at **K7**, `VXM` at **G7**, zero `V7` rows in 56), **and the one calendar naming 2027-10-20 is off by a week one row later** — its own **2027-12-15** vs the rule's **2027-12-22**, internally inconsistent since 12-15+30d = **2028-01-14**, January's *second* Friday. The rule is the strong leg; the publisher is the weak one. **Recorded for sibling lanes, not acted on** (never another event's file): that calendar **does** list **2027-09-15**, which `-2027-09-15` called unlisted today, and `opex-2027-09-17` is `confirmed` off this same artifact. **Holidays read, not inferred:** `nyse.com/markets/hours-calendars` **HTTP 200** this run (403 for the 09-15 sibling the same day) — 2027's ten closures reproduce the engine's statute-derived set **10 of 10**, none in October, none on 11-19. **Window:** 2027-10-20 → 2027-11-19, **22 sessions, ZERO closures** (Thanksgiving 11-25 falls after); contains `fomc-2027-10-26` (+6), `fomc-2027-10-27` (+7), `consumer-confidence-` and `fhfa-hpi-2027-10-26` (+6). Adjacency — **peers:** none (`symbols: []`). **Macro:** parent's October-gate findings **cited not re-derived** (earnings gate; overhang 0.641× median over 10 realized gates; in-blackout release test 0 of 9). **Volatility regime:** baseline row, nothing to diff; Cboe closes 09-04 **VIX1D 12.03 · VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; strip U6 **16.2669** → K7 **21.15**, contango, **no `V7`**. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** playbooks grepped → **zero hits**. **Blocked:** cboe 2027 expiration PDF **403**, theocc schedules **403**. **NOTHING PROPOSED, refusal computed:** corridor holds only `opex-2027-10-15` (−5, a sibling lane's live proposal) and `fomc-blackout-start-2027-10-16` (−4, canonical); `opex-2027-11-19` declined on the thrice-set constitutive-input precedent; the **eight untracked** monthly VIX settlements are a coverage-policy question — **third** ledger in this class to record it. **`FT-vix-expiration-2027-10-20-1` and `-2` registered; a third declined** (81–86% base rate in both arms cannot discriminate). **Own weaknesses:** 42 vs 133 is a failure to reject, not proof of absence; realized vol is close-to-close SPX and `VRO` is daily; blackout windows are **computed from the Fed's stated rule, not decoded from the shaded PDF**; the publisher-error finding rests on one row. | Initial stance set: **stand aside** (structural row only); date **`estimate`** — `VX/V7` unlisted **and** the naming publisher shown to err. | 2026-10-06 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2027-10-20.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
