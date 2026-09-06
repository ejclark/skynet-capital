# US equity markets closed — Birthday of Martin Luther King, Jr. — mlk-market-closure-2027-01-18

**Kind:** sector · **Date:** 2027-01-18 (estimate — NEWS: NYSE's own holiday table `nyse.com/markets/hours-calendars`, fetched direct 2026-09-06 at HTTP 200; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["opex-2027-01-15","fomc-blackout-start-2027-01-16","vix-expiration-2027-01-20","japan-cpi-2027-01-22","boj-decision-2027-01-22","wef-davos-annual-meeting-2027-01-18"],"screenStreak":0,"blocked":[{"url":"https://www.weforum.org/meetings/","status":"403","at":"2026-09-06"},{"url":"https://www.weforum.org/events/world-economic-forum-annual-meeting-2027/","status":"403","at":"2026-09-06"},{"url":"https://www.bls.gov/schedule/news_release/2027_sched.htm","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **Stand aside — and the useful output of this document is that it deletes three separate
"January 2027 is special" framings, including one this calendar wrote down yesterday.** The date is
right and now rests on three primaries re-fetched at HTTP 200 this session (NYSE's own holiday table,
the Fed's K.8, SIFMA's 2027 US schedule). The **403 that forced the proposal's `EST:` prefix did not
reproduce** — `nyse.com` serves 200 to a browser User-Agent, so that block was a header artifact, not
egress, and the prefix upgrades to `NEWS:`. Everything else here is arithmetic run over 1998–2050.
**MLK is one of exactly three US market closures structurally locked inside the monthly-expiration
window (the 15th–21st)** — with Washington's Birthday and Juneteenth, 53/53 years each; no other US
closure ever lands there. Because both live in that window, MLK is **always** either 3 days after
January expiration or 4 days before it, and nothing else is possible. 2027 draws **+3** (the first
post-expiration session is deleted; the unpin Monday becomes Tuesday 2027-01-19) — which is the
**majority** case at **31/53 years (58.5%)**, not a rarity. The proposing ledger's headline, that MLK
2027-01-18 falls in the hole between two VIX strips, is correct as scoped and **also not an anomaly**:
that hole opens whenever consecutive third Fridays are 35 days apart, and MLK lands in one in **23/53
years (43.4%)** — including **2025, 2026 and 2027 back to back**. Nothing is tradeable: `symbols: []`,
the date is `estimate`, and a re-run playbook grep returns **zero** hits. One new adjacency is worth
the row — **the WEF Annual Meeting opens ON this closure** (Davos, 2027-01-18 → 01-22), inside a Fed
blackout, into a US tape that is shut for its first day.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position, and there is nothing to size | High | D-134; `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|mlk\|martin luther\|closure\|three-day weekend\|half-day\|early close` returns **0 hits in both**, re-run this session rather than inherited from a sibling ledger | A house playbook that keys on holiday-adjacent or expiration-adjacent sessions being written and back-tested before **2027-01-18** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside; the output this week is a correction written down, not a trade** | High | The live calendar item this week is `fomc-blackout-start-2026-09-05`, not a 2027 holiday. What is worth banking now is that three "January 2027 is unusual" claims are all majority cases — 58.5%, 43.4%, and a modal Jan/Feb/Jun triple at 30.2% | Any frequency in the table below failing to reproduce from a plain third-Monday / third-Friday computation before **2026-10-06** — the corrective legs collapse and the proposal's framing stands |
| This month | **Do not read this entry's `estimate` label as doubt about the date — read it as a missing prefix, and fix the prefix, not the entry** | Medium | The proposal's own promotion criterion ("any NYSE or Cboe primary listing 2027-01-18 as a market closure") is **met** — NYSE's table, at HTTP 200, twice on one page. It cannot be acted on because `market-events-data.ts`'s taxonomy has no exchange-calendar prefix, which is why **all seven** sibling closures sit at `estimate` too | An exchange-calendar prefix being added to the source taxonomy, **or** Cboe publishing its 2027 options holiday schedule, before **2026-12-31** — this entry promotes to `confirmed` and the whole closure class follows in one move |
| This quarter | **Carry the Davos-week collision forward, not the January-expiration story** | Medium | The expiration adjacency is the modal January. What is genuinely unusual is the pile-up on one shut day: WEF Davos opens **2027-01-18** (`estimate`), the Fed blackout runs **01-16 → 01-28** (`estimate`), and the US tape is closed for Davos day 1 and reopens Tuesday **01-19** carrying the batch | `weforum.org` publishing Annual Meeting 2027 dates **other than 18–22 January 2027**, observed on or before **2027-01-15** — the proposed entry re-dates and this call retires |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to 2027-01-18. It is a closed session, the
  date is `estimate`, and date-keyed action requires `confirmed` regardless.
- **No cross-asset execution guard exists here, and that is the finding.** SIFMA's 2027 US
  recommendation for MLK Day is a **full** fixed-income close on 2027-01-18 with **no** early close
  on the preceding Friday (`estimate`, sifma.org read at HTTP 200 this session). Both asset classes
  are dark together, so the Thursday-before asymmetry the
  [`good-friday-market-closure-2027-03-26`](good-friday-market-closure-2027-03-26.md) ledger found
  **does not exist on this closure**. Do not copy that guard across.
- **The session map, so it is not re-derived wrong:** Fri **01-15** expiration → *3-day weekend* →
  Tue **01-19** → Wed **01-20** (VIX/VXM SOQ) → Thu 01-21 → Fri **01-22** (BoJ decision + Japan
  national CPI). Expiration week **5** sessions; settlement week **4**; expiration close to next
  session open is **4 calendar days**, not 3.
- **The false inference this document exists to block, #1:** "MLK removes the post-expiration Monday,
  so January 2027 is a compressed expiration cycle." It is the **modal** January — **31 of 53 years
  (58.5%)**, including 2025 and 2026.
- **The false inference this document exists to block, #2:** "MLK 2027-01-18 sits in no VIX strip, so
  that is a 2027 peculiarity." It is **43.4% of years (23/53)**, and 2025, 2026 and 2027 are three in
  a row. The proposing ledger's claim is true as it was scoped — to the nine *currently listed*
  contracts — and is a structural regularity, not an anomaly.
- **The attribution trap (Tuesday 2027-01-19).** A gap that morning has a three-day-weekend
  explanation, a post-expiration unpin explanation, a Davos-day-1 headline explanation and a
  Fed-silence explanation *before* it has any single one. Never let a post-hoc read promote one.
- **Placement note, not a call:** the **only** three US closures that can ever fall inside the
  monthly-expiration window are MLK, Washington's Birthday and Juneteenth. If a holiday-vs-expiration
  study is ever built, those three months are its entire population.
- **VIX cash 14.53** (Cboe `VIX_History.csv`, close 2026-09-04, fetched this session). Quoted as the
  probe baseline, not as a read on a settlement 134 days out.

## Initial research

### The question

This event arrived only as `proposals/mlk-market-closure-2027-01-18.from-vix-expiration-2027-01-20.json`
— a sibling lane's in-sweep finding, not a verified entry — so the `never-assessed`-on-a-proposed-id
rule applies: read the proposal first, then write the canonical file. Two questions, in order.
**Does the proposal's evidence survive independent re-fetching**, given that it filed `EST:` on a 403
it could not get past? And **does a day the market is shut earn a research document at all**, beyond
repeating what six sibling closure ledgers already say?

**One-line verdict:** the date survives on three primaries and the 403 turns out to have been a
User-Agent artifact rather than a block — but the proposal's two *framings* both dissolve under
frequency arithmetic, and the finding that justifies this document is that **MLK's relationship to
January expiration is not a variable at all**: it is one of exactly two possible spacings, drawn from
a window only three US closures can ever occupy, and 2027 draws the common one.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`; `earnings-cycle.mjs` and `intraday-edges.mjs` both
take a ticker) and no closure-shaped instrument exists in `scripts/research/`. Nothing was inherited:
every primary below was re-fetched this session with an explicit HTTP status and byte count, and
every frequency is this session's own computation from weekday arithmetic, not a cited statistic.

- **NYSE** `nyse.com/markets/hours-calendars` → `nyse.com/trade/hours-calendars` (301, **HTTP 200,
  109,180 bytes**) — the holiday table parsed twice, once from rendered text and once from the page's
  embedded JSON cell payload.
- **Federal Reserve** `federalreserve.gov/aboutthefed/k8.htm` (**HTTP 200**, page stamped *Last
  Update: July 8, 2026*) — the K.8 holiday table for 2026–2030, MLK row read across all five year
  columns, plus the Saturday/Sunday in-lieu footnote.
- **SIFMA** `sifma.org/resources/general/holiday-schedule` (**HTTP 200, 298,899 bytes**) — the 2027
  and 2026 US recommendations for MLK Day, read for full-close vs early-close shape.
- **Cboe** `cboe.com/about/hours/us-options/` (**HTTP 200, 386,016 bytes**) — parsed for an options
  holiday schedule; **only a 2026 table exists on the page**, so no Cboe 2027 primary is available.
- **davos.ch** `…/events/world-economic-forum-annual-meeting-2027` (**HTTP 200, 241,201 bytes**) —
  the schema.org `BusinessEvent` JSON-LD, read for `startDate` / `endDate` / `organizer` / `location`.
- **Blocked or absent, recorded rather than substituted** (all 2026-09-06, all in `probe-ref.blocked`):
  `weforum.org/meetings/` **403** (382 bytes) and `weforum.org/events/world-economic-forum-annual-meeting-2027/`
  **403** (445 bytes, `Access Denied`), both with a browser User-Agent;
  `bls.gov/schedule/news_release/2027_sched.htm` **404** — BLS still publishes no 2027 schedule.
- **Statute:** 5 U.S.C. § 6103 (MLK Day = the third Monday in January), applied by hand.
- **Own computation, 1998–2050 (53 years):** the third Monday and third Friday of every January,
  February and June; the in-lieu-observed date of every fixed-date US market holiday; the day-of-month
  distribution of all nine US closures; consecutive third-Friday spacings across all 635 month-pairs;
  and the VIX 30-day strip windows implied by them.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
  for `holiday|mlk|martin luther|closure|three-day weekend|half-day|early close`; the proposal and the
  `vix-expiration-2027-01-20`, `opex-2027-01-15`, `fomc-blackout-start-2027-01-16` and
  `good-friday-market-closure-2027-03-26` ledgers read in full; `src/domain/market-events/` scanned
  for the ±7-day corridor.

### Conviction legs, tested

1. **The date is right on three independent primaries — SUPPORTED.** NYSE's own table, under the
   heading *"All NYSE markets observe U.S. holidays as listed below for 2026, 2027, and 2028"*, gives
   `Martin Luther King, Jr. Day | Monday, January 19 | Monday, January 18 | Monday, January 17`. The
   Fed's K.8 gives January 19 / **18** / 17 / 15 / 21 for 2026–2030. SIFMA's 2027 US schedule gives
   *Monday, January 18, 2027*. The statute reproduces it: January 2027's Mondays are the 4th, 11th,
   **18th** and 25th.

2. **The proposal's 403 was a User-Agent artifact, not an egress block — REFUTED (the proposal's
   reading), and this matters beyond this event.** The proposing ledger recorded
   `nyse.com/markets/hours-calendars` at **HTTP 403, 4,543 bytes** on 2026-09-06 and downgraded its
   prefix to `EST:` on exactly that basis, noting that a sibling had read the same URL at 200 a day
   earlier. Fetched today with a browser `User-Agent`, the URL returns **HTTP 200, 109,180 bytes**
   with the full table. The day-to-day flip the proposal could not explain is explained: it is header
   sensitivity, not intermittent egress. Three sibling ledgers (`vix-expiration-2027-01-20`,
   `opex-2027-01-15`, and this event's proposal) carry `blocked` entries that are probably the same
   artifact. Registered as **FT-mlk-market-closure-2027-01-18-1**.

3. **Only three US market closures can ever fall inside the monthly-expiration window — SUPPORTED,
   and it is the structural fact this document exists for.** The monthly expiration is the third
   Friday, always the 15th–21st. Computing the observed date of every US market closure over
   1998–2050 and asking which ever land in the 15th–21st:

   | Closure | Rule | Lands on the 15th–21st |
   |---|---|---|
   | **MLK Day** | 3rd Monday, January | **53 / 53 years** |
   | **Washington's Birthday** | 3rd Monday, February | **53 / 53 years** |
   | **Juneteenth** | June 19, observed | **53 / 53 years** |
   | New Year's Day | Jan 1, observed | 0 / 53 |
   | Good Friday | movable | 0 / 53 |
   | Memorial Day | last Monday, May | 0 / 53 |
   | Independence Day | Jul 4, observed | 0 / 53 |
   | Labor Day | 1st Monday, September | 0 / 53 |
   | Thanksgiving | 4th Thursday, November | 0 / 53 |
   | Christmas Day | Dec 25, observed | 0 / 53 |

   So January, February and June are the *only* months whose monthly expiration can carry a mandatory
   full closure inside its own week — every year, by rule, not by coincidence.

4. **MLK's spacing to January expiration is binary — SUPPORTED, and 2027 draws the common side.**
   Both dates live in the 15th–21st window, which contains each weekday exactly once, so the Monday
   is either 3 days after the Friday or 4 days before it and **no other value is possible**. Over
   1998–2050:

   | Configuration | What it does to the cycle | Frequency |
   |---|---|---|
   | **MLK = expiration + 3** (2027) | deletes the **first post-expiration session**; the unpin Monday becomes Tuesday | **31 / 53 (58.5%)** |
   | MLK = expiration − 4 | deletes the **Monday of expiration week**; expiration week runs 4 sessions | 22 / 53 (41.5%) |

   2027 is the majority configuration, shared with 2025 and 2026 immediately before it. The same
   arithmetic gives Washington's Birthday 30/53 (56.6%) at +3, and Juneteenth a five-way split
   (−2, −1, **0**, +3, +4) because it is a fixed date with an in-lieu rule rather than an ordinal
   weekday. **2027 draws the modal triple** — Jan +3 / Feb −4 / Jun 0 — in **16 / 53 years (30.2%)**,
   the single most common of the eight triples that occur.

5. **"MLK 2027-01-18 sits in no VIX strip" is true as scoped and is not an anomaly — MIXED, and the
   proposing ledger's own headline needs the frequency attached.** A VIX future settles 30 days
   before the following month's third Friday, so consecutive 30-day strips leave a gap of
   *(spacing between consecutive third Fridays) − 30* days: **+5 when the spacing is 35 days, −2 (an
   overlap) when it is 28**. For 2027: Jan 3rd Friday **01-15**, Feb 3rd Friday **02-19**, spacing
   **35**, so `VX/Z6`'s strip ends 01-15, `VX/F7` settles 01-20 and its strip starts 01-21 — an
   uncovered hole of **2027-01-16 → 2027-01-20**, which contains MLK. That reproduces the proposal
   exactly. What the proposal did not compute: a 35-day spacing occurs in **221 of 635 month-pairs
   (34.8%)**, and MLK lands in the resulting hole in **23 of 53 years (43.4%)** — 1998, 1999, 2003,
   2004, 2009, 2010, 2014, 2015, 2016, 2020, 2021, **2025, 2026, 2027**, 2031, 2032, 2037, 2038,
   2042, 2043, 2044, 2048, 2049. Three consecutive years, including the two just past. So the
   correct reading is a **structural regularity of the +3 configuration**, not a property of 2027 —
   and the refusal the proposal drew from it ("January has MLK, therefore the January VIX contract is
   drag-cheapened" is FALSE) survives intact and is *strengthened*, because it is the usual case
   rather than a one-off.

6. **This is not a Good Friday — SUPPORTED, as a negative.** SIFMA's 2027 US recommendation for MLK
   Day is a **full** fixed-income close on 2027-01-18 with **no** early close recommended on Friday
   2027-01-15, identical in shape to its 2026 MLK entry. That is the opposite of the Good Friday
   sibling's headline find (a full bond close on the holiday *plus* a 2:00 p.m. ET bond early close
   the day before, against a full equity session). Equities and fixed income go dark together here,
   so **there is no cross-asset execution guard to write** and the Good Friday guard must not be
   copied across.

7. **The corridor's real content is a Davos/blackout collision, and it is new to this calendar —
   SUPPORTED (`estimate`).** The WEF Annual Meeting 2027 runs **18–22 January 2027** at the
   Kongresszentrum Davos, per the host destination's own schema.org `BusinessEvent` payload
   (`"startDate":"2027-01-18","endDate":"2027-01-22"`, `eventStatus: EventScheduled`). It therefore
   **opens on the closure**: Davos day 1 prices into no US session, and the tape reopens Tuesday
   **01-19** carrying the batch. Simultaneously the FOMC blackout runs **2027-01-16 → 2027-01-28**
   (`fomc-blackout-start-2027-01-16`, `estimate`), so no Fed official may comment across any Davos
   day, and the January decision (`fomc-2027-01-27`, `estimate`) lands the session *after* Davos
   closes. Proposed as
   `proposals/wef-davos-annual-meeting-2027-01-18.from-mlk-market-closure-2027-01-18.json`.
   **weforum.org itself is 403 to this runner**, so the prefix is `NEWS:` and the status `estimate` —
   recorded, not worked around.

8. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep of
   `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|mlk|martin luther|closure|three-day weekend|half-day|early close` returns **0 hits in
   both files**, run this session. No playbook can fire on this date in either direction — and
   neither file mentions Davos either.

9. **No US statistical release can be shown to land in this corridor — UNRESOLVED, and it will stay
   that way for months.** `bls.gov/schedule/news_release/2027_sched.htm` is a **404**; BLS publishes
   no 2027 schedule yet, reproducing the same limit the Good Friday sibling recorded a day earlier.
   The December 2026 CPI print conventionally falls in this half of January but **cannot be dated**
   from a primary today, so it is left open rather than guessed. The dated releases this calendar
   *does* carry in the corridor are Japanese: `japan-cpi-2027-01-22` and `boj-decision-2027-01-22`
   (both `estimate`), 08:30 JST = **18:30 ET Thursday 2027-01-21**, i.e. after the US close with a
   Friday session available to price them.

10. **The `estimate` label is a taxonomy defect, and it is a class-wide one — SUPPORTED.** The
    proposal set a promotion criterion of "any NYSE or Cboe primary listing 2027-01-18 as a market
    closure." NYSE's own table, at HTTP 200, twice on one page, meets it. It still cannot promote:
    `market-events-data.ts`'s confirmed-prefix set (`IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/
    `OCC:`/`BEA:`/`CENSUS:`/`ISM:`/`CB:`/`UMICH:`/`FHFA:`) has no exchange-holiday-calendar slot, and
    Cboe — the one route the `OCC:` prefix would allow — publishes **only a 2026** options holiday
    schedule today. All **seven** sibling closure entries in this calendar sit at `estimate` for
    exactly this reason. One prefix would promote the whole class; eight ledgers re-arguing it
    one at a time is the recurring-ask shape.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, the date is `estimate`,
and no house playbook keys on the calendar. The supported outputs are written, not traded: the two
blocked inferences (legs 4 and 5), the negative cross-asset finding (leg 6), the Tuesday 2027-01-19
attribution trap, the proposed Davos entry, and the class-wide prefix defect (leg 10).

### Honest limits

- **The WEF leg is `NEWS:`, not primary.** `weforum.org` is 403 to this runner on two URLs with a
  browser User-Agent. The dates come from the host destination's official site and its machine-
  readable JSON-LD, which is good evidence and is not the organiser's own listing.
- **Cboe's 2027 options holiday schedule does not exist yet**, so the leg that would let the whole
  closure class promote under the existing `OCC:` prefix is unavailable rather than blocked. Its
  publication is a watch item, not a fetch failure.
- **Leg 9 is open and cannot be closed here.** No US statistical agency has published a 2027 calendar.
- **Every frequency here is a calendar computation, not a market measurement.** "31 of 53 years draw
  the +3 configuration" says nothing about what any of those Januaries did — this document makes no
  claim about returns, and none of the arithmetic should be read as one.
- **Six of the events in this corridor are `estimate`,** including this one and the Davos proposal.
  Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-06):** stand aside, permanently and structurally. This row exists to hold three
corrections, one negative finding and one new adjacency — not a view. Concretely: (a) MLK's spacing to
January expiration is **binary by construction**, and 2027's `+3` is the **majority** case
(31/53, 58.5%), so no "compressed January cycle" framing is available; (b) the proposing ledger's
VIX-strip-hole observation is correct as scoped but is a **43.4%-of-years regularity** (2025, 2026 and
2027 consecutively), which strengthens its refusal and removes its novelty; (c) unlike Good Friday,
SIFMA gives MLK a **full** bond close with no adjacent early close, so **no cross-asset execution
guard exists** and the Good Friday guard must not be copied here; (d) the corridor's genuinely new
content is that **WEF Davos 2027 opens on this closure** inside a Fed blackout, which is an
attribution trap rather than a signal; (e) the entry's `estimate` label is a **missing prefix**, not
doubt — the proposal's own promotion criterion is met on NYSE's table at HTTP 200. Every statement
here carries the event's **`estimate`** label.

**Kill switches:**

- **A browser-UA fetch of NYSE's holiday calendar from a repo lane returns 403** — leg 2 is wrong, the
  block is real and intermittent rather than header-driven, and three sibling ledgers' `blocked`
  entries stand as recorded. Registered as **FT-mlk-market-closure-2027-01-18-1**, score by 2026-10-06.
- **SIFMA revises its 2027 MLK recommendation** to anything other than a full close with no adjacent
  early close — leg 6 inverts and a cross-asset guard has to be written after all. Registered as
  **FT-mlk-market-closure-2027-01-18-2**, score by 2027-01-15.
- **An exchange-calendar prefix is added to the source taxonomy, or Cboe publishes its 2027 options
  holiday schedule** — this entry promotes to `confirmed`, and so should the other seven closures.
- **`weforum.org` publishes Annual Meeting 2027 dates other than 18–22 January 2027** — the proposed
  entry re-dates and leg 7's collision dissolves.
- **A house playbook that keys on holiday-adjacent or expiration-adjacent sessions is written and
  back-tested** — leg 8 goes stale and the stand-aside is re-argued on measured data rather than on
  absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | 134 | **Initial research**; canonical `<id>.json` written after reading the `from-vix-expiration-2027-01-20` proposal. Date triple-primaried at HTTP 200 (NYSE table 109,180 b; Fed K.8; SIFMA 2027) + 5 U.S.C. 6103 — stays `estimate` on the **taxonomy gap alone**, which all 7 sibling closures share; prefix upgraded `EST:` → `NEWS:`. **The proposal's NYSE 403 did not reproduce** — browser-UA returns 200, so it was a header artifact, not egress. **Computed 1998–2050:** MLK, Washington's Birthday and Juneteenth are the **only** US closures ever inside the expiration window (15th–21st), 53/53 each; MLK's spacing to January expiration is **binary** (+3 or −4), and 2027's +3 is **31/53 (58.5%)** — the modal case, not a rarity. The proposal's VIX-strip-hole headline reproduces exactly (hole 01-16 → 01-20) but recurs in **23/53 years (43.4%)**, incl. 2025/26/27 consecutively. **Negative find:** SIFMA gives MLK a full bond close, **no** adjacent early close — the Good Friday cross-asset guard does **not** transfer. Adjacency — peers: n/a (`symbols: []`); macro: BLS 2027 schedule still **404**, Japan CPI + BoJ 01-22 print 18:30 ET Thu 01-21 into an available Friday session; VIX **14.53** (close 2026-09-04, Cboe CSV); geopolitical: **WEF Davos opens ON this closure**, 2027-01-18 → 01-22, inside the 01-16 → 01-28 Fed blackout — `weforum.org` **403**, dates from davos.ch JSON-LD; tape: `opex-2027-01-15` is the preceding session, `vix-expiration-2027-01-20` the second session after. Proposes `wef-davos-annual-meeting-2027-01-18.json` (`estimate`). | Initial stance set: **stand aside** (structural row only). Registers **FT-mlk-market-closure-2027-01-18-1** and **-2**. | 2026-10-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-mlk-market-closure-2027-01-18.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
