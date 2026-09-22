# US equity markets closed — Birthday of Martin Luther King, Jr. — mlk-market-closure-2028-01-17

**Kind:** sector · **Date:** 2028-01-17 (estimate — NEWS: NYSE's own holiday table `nyse.com/markets/hours-calendars`, re-fetched direct 2026-09-09 at HTTP 200; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fomc-blackout-start-2028-01-15","vix-expiration-2028-01-19","opex-2028-01-21"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/news_release/2028_sched.htm","status":"403","at":"2026-09-09"},{"url":"https://www.weforum.org/meetings/","status":"403","at":"2026-09-09"},{"url":"https://www.davos.ch/en/events/world-economic-forum-annual-meeting-2028","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — and the reason this document exists is that MLK 2028 lands on the opposite
side of both structural coin-flips its 2027 sibling measured, so neither of that ledger's findings may
be copied forward.** The date rests on two primaries re-fetched at HTTP 200 today (NYSE's 2028 column,
the Fed's K.8) plus 5 U.S.C. 6103. Everything else is arithmetic run over 1998–2050, which reproduced
the sibling's own three headline figures independently before departing from them. **2028-01-01 is a
Saturday, and that single fact drives the whole shape.** It means NYSE observes **no New Year's holiday
in 2028 at all**, so January 2028 carries **exactly one** market closure — and it forces MLK to
**January expiration minus four** (2028-01-21), the **minority 22/53 (41.5%)** configuration where 2027
drew the majority +3. All **8** Saturday-January-1 years in the 53 are −4 years: one cause, two
consequences. So MLK 2028 deletes the **Monday of expiration week**, and that week runs **four
sessions** — something only three US closures can ever do to any month, and which happens in just
**53 of 636 expiration weeks (8.33%)** across 1998–2050. The sibling's VIX-strip-hole finding
**inverts**: January→February 2028 third Fridays are **28** days apart, so the strips **overlap** by two
days and MLK 2028 is a **covered** day, not a hole. The whole short week — expiration and the unpin
Monday included — sits **inside** the FOMC blackout (2028-01-15 → 01-27), which its 2027 counterpart did
not. Nothing is tradeable: `symbols: []`, the date is `estimate`, and a re-run playbook grep returns
**zero**. The corridor held one tracked entry before today; this session proposes the two that make its
own findings checkable.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session 495 days out is not a position, and there is nothing to size | High | D-495; `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|mlk\|martin luther\|closure\|three-day weekend\|half-day\|early close\|shortened week\|expiration week` returns **0 hits in both**, re-run this session on a widened pattern rather than inherited from the 2027 sibling | A house playbook keying on holiday-adjacent, shortened-week or expiration-adjacent sessions being written and back-tested before **2028-01-17** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside; this week's output is two corridor proposals and one measured bottleneck, not a trade** | High | The live load this week is the 2026-09-05 → 09-17 FOMC gate carrying CPI **2026-09-11**, not a 2028 holiday. What is worth banking now is that the ±5 corridor around 2028-01-17 held **exactly one** tracked entry across all canonical events and proposals, and that **37 of 37** closure-class entries sit at `estimate` on one missing prefix | Either proposed corridor entry failing its own rule check before **2026-10-09** — `opex-2028-01-21` not being the third Friday, or `vix-expiration-2028-01-19` not being 30 days before **2028-02-18** |
| This month | **Do not carry [mlk-market-closure-2027-01-18](mlk-market-closure-2027-01-18.md)'s two structural findings into 2028** (`estimate` — a planning refusal, never an entry). Both invert | High | 2027 drew expiration **+3** and an **uncovered** VIX gap; 2028 draws **−4** and a **two-day strip overlap**. Both flips follow from 2028-01-01 being a Saturday, verified on two primaries, and both frequencies were recomputed here rather than quoted | Any frequency in this document failing to reproduce from a plain third-Monday / third-Friday computation before **2026-10-09** — in which case the sibling's readings may transfer after all and this refusal retires |
| This quarter | **Treat the `estimate` label as a measured bottleneck to file, not a fact to re-argue per ledger** | Medium | The promotion route the `OCC:` prefix allows is **closed**: `cboe.com/about/hours/us-options/` at HTTP 200 today carries **only a 2026** options holiday schedule — no 2027 table, no 2028 — and the OCC's own expiration calendar stops at **2027-12-31** with no 2028 date. The 2027 sibling called this "the recurring-ask shape" at **7** entries on 2026-09-06; it is **37** three days later | Cboe publishing a **2028** options holiday schedule listing 2028-01-17, or an exchange-calendar prefix landing in `market-events-data.ts`, before **2027-09-30** — this entry promotes to `confirmed` and the whole 37-entry class follows in one move |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to 2028-01-17. It is a closed session, the date
  is `estimate`, and date-keyed action requires `confirmed` regardless.
- **The session map, so it is not re-derived wrong:** Fri **01-14** (last legal Fed voice) → *3-day
  weekend, MLK 01-17 shut* → Tue **01-18** → Wed **01-19** (VIX/VXM SOQ, proposed) → Thu 01-20 → Fri
  **01-21** (monthly expiration, proposed) → *weekend* → Mon **01-24** (unpin) → FOMC **01-26** → gate
  lifts end of **01-27**. Expiration week is **4** sessions; the whole of it is inside the blackout.
- **The false inference this document exists to block, #1:** "MLK removes the post-expiration Monday,
  as in 2027." It does the **opposite** in 2028 — it removes the Monday *of* expiration week. The two
  spacings are the only two possible (both dates live in the 15th–21st window, which holds each weekday
  once), and 2028 draws the **41.5%** side.
- **The false inference this document exists to block, #2:** "MLK sits in a VIX-strip hole, as in 2027."
  In 2028 there **is no hole** — the Jan→Feb third-Friday spacing is **28** days, so the strips overlap
  **2028-01-19 → 01-21** and MLK falls inside the December-2027 contract's window. The sibling's
  *refusal* ("the January VIX contract is drag-cheapened" is FALSE) survives and now rests on two
  opposite configurations instead of one.
- **The false inference this document exists to block, #3:** "January 2028 is a heavy-holiday month."
  It carries **exactly one** closure. NYSE's 2028 column reads `—*` for New Year's under the footnote
  *"Because the holiday falls on Saturday, January 1, 2028, no New Year's Day holiday is observed."*
  Note the divergence, already tracked: the **Fed Board** does observe it, on Friday **2027-12-31**
  ([`fed-board-closure-2027-12-31`](fed-board-closure-2027-12-31.md), `estimate`).
- **No cross-asset execution guard can be written yet, and that is a stated absence rather than a
  finding.** `sifma.org` at HTTP 200 today publishes **2026 and 2027 only**; its calendar terminates at
  *"New Year's Day 2027/2028 | Saturday, January 1, 2028"* and carries **no 2028 MLK entry**. The
  Thursday-before asymmetry the [`good-friday-market-closure-2027-03-26`](good-friday-market-closure-2027-03-26.md)
  ledger found must not be copied here on a guess — registered instead as
  **FT-mlk-market-closure-2028-01-17-2**.
- **The attribution trap (Tuesday 2028-01-18).** A gap that morning has a three-day-weekend
  explanation, a shortened-expiration-week explanation and a Fed-silence explanation *before* it has
  any single one — and unlike 2027 it has no Davos explanation, because no WEF 2028 meeting page exists
  yet (`davos.ch` **404** today, `weforum.org` **403**). Never let a post-hoc read promote one.
- **VIX cash 15.72** (Cboe `VIX_History.csv`, close 2026-09-08, fetched this session). Quoted as the
  probe baseline, not as a read on a session 495 days out.

## Initial research

### The question

This event arrived only as
`proposals/mlk-market-closure-2028-01-17.from-fomc-blackout-start-2028-01-15.json` — a sibling lane's
in-sweep finding — so the `never-assessed`-on-a-proposed-id rule applies: read every proposal for the
id first, then write the canonical file. There is exactly one, and it is unusually explicit about what
it deliberately did *not* do: *"NOTHING TRADEABLE IS CLAIMED and no re-derivation is attempted of what
the 2027 sibling already measured."* That sets this session's question precisely. **Given that a
near-identical ledger for MLK 2027 was written three days ago, does MLK 2028 have any content of its
own — or is the honest output a pointer to the sibling?**

**One-line verdict:** it has content, and the content is *inversion*. Both of the 2027 sibling's
structural findings flip sign in 2028, both flips follow from the single verified fact that 2028-01-01
is a Saturday, and a ledger that copied the sibling forward would have been wrong twice.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`; `earnings-cycle.mjs` and `intraday-edges.mjs` both take
a ticker), and no closure-shaped instrument exists in `scripts/research/`. Nothing was inherited from
the sibling: every primary below was fetched this session from the GitHub Actions runner with an
explicit HTTP status and byte count, and every frequency is this session's own computation from weekday
arithmetic. Where a sibling had already computed a figure, it was **recomputed rather than quoted** —
which is also the check on the arithmetic.

- **NYSE** `nyse.com/markets/hours-calendars` → `nyse.com/trade/hours-calendars` (301, **HTTP 200,
  109,180 bytes**) — the 2026/2027/2028 holiday table parsed from the page's embedded JSON cell payload
  and from rendered text, plus both disclaimer footnotes.
- **Federal Reserve** `federalreserve.gov/aboutthefed/k8.htm` (**HTTP 200, 82,205 bytes**, stamped
  *Last Update: July 8, 2026*) — the K.8 table for 2026–2030, MLK row read across all five columns.
- **SIFMA** `sifma.org/resources/general/holiday-schedule/` (**HTTP 200, 299,159 bytes**) — every
  holiday/date/note triple extracted from the RSC payload for 2027 and 2028.
- **Cboe** `cboe.com/about/hours/us-options/` (**HTTP 200, 386,116 bytes**) — parsed for an options
  holiday schedule of any year.
- **OCC / OIC** `optionseducation.org/api/expirationcalendar` (**HTTP 200, 34,871 bytes**) — the full
  date span extracted.
- **Cboe** `cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv` (**HTTP 200, 472,411
  bytes**) — the VIX close for the probe baseline.
- **Blocked or absent, recorded rather than substituted** (all 2026-09-09, all in `probe-ref.blocked`):
  `bls.gov/schedule/news_release/2028_sched.htm` **403** (1,325 bytes) even with a browser User-Agent —
  the known Actions-runner blindspot, and a *different* status from the **404** the 2027 sibling met
  from the remote session; `weforum.org/meetings/` **403** (380 bytes), reproducing the sibling exactly;
  `davos.ch/…/world-economic-forum-annual-meeting-2028` **404** (238,126 bytes) — a real 404 page, i.e.
  no 2028 meeting listing exists, which is an absence rather than a block.
- **Statute:** 5 U.S.C. § 6103 (MLK Day = the third Monday in January), applied by hand.
- **Own computation, 1998–2050 (53 years):** MLK's spacing to January expiration; the Jan→Feb
  third-Friday spacing and the implied 30-day VIX strip coverage of MLK; the weekday of every January 1;
  and — new to this calendar — every US market closure's observed date checked against the Monday–Thursday
  of all **636** expiration weeks.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
  on a widened pattern; the proposal and the `mlk-market-closure-2027-01-18` and
  `fomc-blackout-start-2028-01-15` ledgers read in full; every canonical event and proposal scanned for
  the 2028-01 corridor; the closure class enumerated by status.

### Conviction legs, tested

1. **The date is right on two independent primaries plus statute — SUPPORTED.** NYSE's table, under
   *"All NYSE markets observe U.S. holidays as listed below for 2026, 2027, and 2028"*, gives
   `Martin Luther King, Jr. Day | Monday, January 19 | Monday, January 18 | Monday, January 17`. The
   Fed's K.8 gives January 19 / 18 / **17** / 15 / 21 for 2026–2030. The statute reproduces it:
   January 2028's Mondays are the 3rd, 10th, **17th**, 24th and 31st.

2. **NYSE observes no New Year's holiday in 2028, so January 2028 carries exactly one closure —
   SUPPORTED, and it is the root fact of this document.** NYSE's 2028 New Year's cell reads `—*` under
   *"Because the holiday falls on Saturday, January 1, 2028, no New Year's Day holiday is observed."*
   The Fed diverges and observes it (K.8's 2028 row reads `January 1*`, with a page note recording the
   observance date being corrected to December 31, **2027**) — already tracked here as
   [`fed-board-closure-2027-12-31`](fed-board-closure-2027-12-31.md), so nothing new is proposed for it.
   Saturday January 1 occurs in **8 of 53** years (15.1%): 2000, 2005, 2011, 2022, **2028**, 2033, 2039,
   2050. The most recent precedent is **2022**; the next is 2033.

3. **MLK 2028 is January expiration MINUS FOUR — SUPPORTED, and it is the minority configuration.**
   Both MLK and the monthly expiration live in the 15th–21st window, which contains each weekday exactly
   once, so the Monday is either 3 days after the Friday or 4 days before it and no other value is
   possible — the sibling's structural point, reproduced. Recomputing 1998–2050 gives the sibling's own
   split back exactly:

   | Configuration | What it does to the cycle | Frequency |
   |---|---|---|
   | MLK = expiration + 3 (**2027**) | deletes the first post-expiration session | 31 / 53 (58.5%) |
   | **MLK = expiration − 4 (2028)** | deletes the **Monday of expiration week**; the week runs 4 sessions | **22 / 53 (41.5%)** |

   The −4 years are 2000, 2001, 2005, 2006, 2007, 2011, 2012, 2017, 2018, 2022, 2023, 2024, **2028**,
   2029, 2033, 2034, 2035, 2039, 2040, 2045, 2046, 2050.

4. **Legs 2 and 3 are the same fact — SUPPORTED, and this is the finding worth keeping.** Every one of
   the **8** Saturday-January-1 years is a −4 year (checked exhaustively, not sampled): a Saturday
   January 1 puts the first Monday on the 3rd and the first Friday on the 7th, forcing the third Monday
   to the 17th and the third Friday to the 21st. So the January that carries the fewest closures is
   necessarily the January whose single closure lands inside expiration week. They are not two
   coincidences to be counted separately; they are one cause with two consequences, and 2028 is the
   8-of-53 case where both are visible at once.

5. **A four-session expiration week is rare and has exactly three possible causes — SUPPORTED, and this
   number is new to this calendar.** The 2027 sibling established which closures can fall *inside* the
   expiration window; the consequence it did not compute is how often that actually shortens a trading
   week. Checking every US market closure's observed date against the Monday–Thursday of all **636**
   expiration weeks 1998–2050:

   | Cause | Month | Shortened expiration weeks |
   |---|---|---|
   | Washington's Birthday | February | 23 |
   | **MLK** | **January** | **22** |
   | Juneteenth | June | 8 |
   | *everything else* | — | **0** |
   | **total** | — | **53 / 636 (8.33%)** |

   January 2028 is one of the 53. Note the honest reading: 8.33% is uncommon but not exotic — roughly
   one expiration week a year — and this is a calendar count, not a claim about what any of those weeks
   returned.

6. **The 2027 sibling's VIX-strip finding inverts in 2028 — SUPPORTED as an inversion, and copying it
   forward would have been an error.** A VIX future settles 30 days before the following month's third
   Friday, so consecutive 30-day strips leave a gap of *(spacing between consecutive third Fridays) −
   30*: **+5 when the spacing is 35 days, −2 (an overlap) when it is 28**. For 2028: Jan third Friday
   **01-21**, Feb third Friday **02-18**, spacing **28**. The January contract settles **2028-01-19**
   and the December-2027 contract's window runs to **2028-01-21**, so the strips **overlap** 01-19 →
   01-21 and MLK **2028-01-17 is covered** by the December contract. Recomputing the sibling's frequency
   reproduces it exactly — MLK falls in a hole in **23/53 years (43.4%)** and is covered in **30/53
   (56.6%)** — and 2028 is on the covered side, where 2027, 2026 and 2025 consecutively were not.

7. **The blackout containment is genuinely different from 2027 — SUPPORTED (`estimate`), and it is
   a corridor fact rather than a signal.** [`fomc-blackout-start-2028-01-15`](fomc-blackout-start-2028-01-15.md)
   (`estimate`) runs **2028-01-15 → 2028-01-27** and contains the whole four-session expiration week,
   the expiration itself (**01-21**) and the unpin Monday (**01-24**). Its January 2027 counterpart
   opened **2027-01-16**, one day *after* that year's **2027-01-15** expiration, so the expiration sat
   outside. This session states that as a two-case comparison drawn from the calendar's own ledgers and
   deliberately computes **no frequency** for it: doing so would need a sourced series of FOMC meeting
   dates that this session did not fetch, and an unsourced count would be exactly the kind of statistic
   this genre refuses.

8. **The bond side is unstated, and now provably so rather than merely unread — SUPPORTED as a negative.**
   The proposal recorded *"BOND SIDE UNSTATED: no SIFMA 2028 panel was read this session."* SIFMA at
   HTTP 200 today publishes **2026 and 2027 only**; its calendar terminates at *"New Year's Day 2027/2028
   | Saturday, January 1, 2028"* with **no 2028 MLK row**. So the parent's gap is confirmed to be the
   publisher's, not the reader's. What the 2027 panel *does* show is a consistent shape worth registering
   rather than assuming: MLK 2026 and MLK 2027 are both full closes with **no** adjacent early close,
   and on that page an adjacent early close attaches only to New Year's, Good Friday, Memorial Day,
   Independence Day, Thanksgiving and Christmas — never to MLK or Presidents Day. Registered as
   **FT-mlk-market-closure-2028-01-17-2** instead of asserted.

9. **The `OCC:` promotion route is closed, and the taxonomy gap is now a measured bottleneck —
   SUPPORTED, with a number.** `market-events-data.ts`'s confirmed-prefix set has no exchange-holiday
   slot; the one route it allows is `OCC:` (theocc.com / Cboe). Cboe's own page at HTTP 200 today carries
   **only a "2026 Options Holiday Schedule"** — no 2027 table and no 2028 table — and the OCC's
   expiration calendar API spans **2025-01-01 → 2027-12-31** with **no 2028 date at all**. So the 2027
   sibling's own kill switch (*"Cboe publishes its 2027 options holiday schedule"*) has **not** fired as
   of today, three days after it was written. Meanwhile the class has grown: the sibling counted **7**
   affected entries on 2026-09-06, and enumerating the calendar today gives **37 of 37** closure-class
   entries at `estimate`, **zero** confirmed. That is the shape CLAUDE.md names a recurring blessing-ask
   — filed once as `bottleneck` issue **#2552** with this evidence rather than re-argued in a 38th
   ledger.

10. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified on a widened pattern.** A
    grep of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|mlk|martin luther|closure|three-day weekend|half-day|early close|shortened week|expiration
    week` returns **0 hits in both**, run this session. The pattern was widened past the sibling's with
    `shortened week` and `expiration week` precisely because leg 5 would be the thing a playbook keyed
    on, and it still returns nothing.

11. **The corridor was almost empty, and this session fills it — SUPPORTED.** Scanning every canonical
    event and proposal for ±5 days around 2028-01-17 returned exactly one entry,
    `fomc-blackout-start-2028-01-15`. Both of this document's structural legs rest on dates the calendar
    did not carry, so both are proposed as this lane's own files: `opex-2028-01-21` (D+4, the anchor of
    legs 3 and 5) and `vix-expiration-2028-01-19` (D+2, the near edge of leg 6's overlap).

12. **The sibling's NYSE-403 forward test did not fire today — a dated observation, recorded here and
    not scored here.** FT-mlk-market-closure-2027-01-18-1 predicts a browser-UA fetch of NYSE's holiday
    calendar succeeds from a repo lane. From this Actions runner it returned **HTTP 200 at 109,180
    bytes** — byte-identical to the sibling's reading, from a different runner. Scoring belongs to that
    event's own close-out and its fragment is untouched.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, the date is `estimate`,
and no house playbook keys on the calendar. The supported outputs are written, not traded: the three
blocked inferences (legs 3, 6 and 2), the new shortened-expiration-week population (leg 5), the
unification of legs 2 and 3 into one cause, the stated bond-side absence (leg 8), the two corridor
proposals (leg 11), and the measured taxonomy bottleneck (leg 9, filed as **#2552**).

### Honest limits

- **Every frequency here is calendar arithmetic, not a market measurement.** "22 of 53 years draw the
  −4 configuration" and "53 of 636 expiration weeks run four sessions" say nothing about what any of
  those weeks did. This document makes no claim about returns, and none of the arithmetic should be
  read as one.
- **Leg 7 is a two-case comparison, not a rate.** Whether an expiration inside the January FOMC gate is
  unusual is unanswered, deliberately — it needs a sourced FOMC meeting series this session did not
  fetch.
- **No 2028 schedule exists anywhere this session could reach.** SIFMA stops at 2027, Cboe at 2026, the
  OCC calendar at 2027-12-31, BLS 403s. The bond side, the options holiday schedule and the US
  statistical corridor are all open and will stay open for months.
- **The corridor is thin by construction at D-495.** One tracked entry plus two rule-derived proposals
  is not a full picture of January 2028; it is what a calendar 16 months out can honestly carry.
- **Both proposed entries are extrapolations past every published primary** and are labelled `estimate`
  for that reason, not merely by convention.
- **Every event named in this corridor is `estimate`,** including this one, the blackout, and both
  proposals. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-09):** stand aside, permanently and structurally. This document exists to hold one
positive finding and three refusals, not a view. Concretely: (a) **2028-01-01 is a Saturday**, verified
on two primaries, and that one fact both empties January 2028 of every closure but MLK and forces MLK
to **expiration − 4** — all 8 Saturday-January-1 years in 53 are −4 years; (b) consequently January 2028
**expiration week runs four sessions**, one of only **53 of 636 (8.33%)** such weeks 1998–2050, a
population only Washington's Birthday, MLK and Juneteenth can ever create; (c) the 2027 sibling's
**+3 spacing** and its **uncovered VIX strip** both **invert** here — 2028 is −4 and the Jan→Feb strips
**overlap** two days, so MLK 2028 is a covered day — and either finding copied forward would have been
wrong; (d) the bond side is **unstated by the publisher**, not merely unread, so no cross-asset guard is
written and the prediction is registered instead; (e) the `estimate` label is a **missing prefix** on a
now-measured **37-of-37** class, with the `OCC:` route verified closed today. Every statement here
carries the event's **`estimate`** label.

**Kill switches:**

- **Cboe publishes a 2027 or 2028 options holiday schedule, or an exchange-calendar prefix is added to
  `market-events-data.ts`** — the `OCC:` route opens, this entry promotes to `confirmed`, and so should
  the other 36. Registered as **FT-mlk-market-closure-2028-01-17-1**, score by 2027-02-01.
- **SIFMA's 2028 US recommendation gives MLK anything other than a full close with no adjacent early
  close** — leg 8 inverts and a cross-asset execution guard has to be written after all. Registered as
  **FT-mlk-market-closure-2028-01-17-2**, score by 2027-12-31.
- **Any frequency in this document fails to reproduce from a plain third-Monday / third-Friday
  computation** — legs 3, 5 and 6 collapse together and the sibling's readings may transfer after all.
- **NYSE revises its 2028 column**, or observes a New Year's holiday in 2028 after all — leg 2 falls, and
  with it the single-cause unification in leg 4.
- **The January 2028 FOMC meeting moves off 2028-01-26** — the blackout re-dates, and leg 7's
  containment of the whole expiration week dissolves.
- **A house playbook keyed on holiday-adjacent, shortened-week or expiration-adjacent sessions is
  written and back-tested** — leg 10 goes stale and the stand-aside is re-argued on measured data rather
  than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 495 | **Initial research**; canonical `<id>.json` written after reading the sole `from-fomc-blackout-start-2028-01-15` proposal. Date double-primaried at HTTP 200 (NYSE 2028 column 109,180 b; Fed K.8) + 5 U.S.C. 6103 — stays `estimate` on the **taxonomy gap alone**, now measured at **37 of 37** closure-class entries, zero confirmed. **The `OCC:` route is verified closed**: Cboe carries only a **2026** table (HTTP 200), and the OCC expiration API spans 2025-01-01 → **2027-12-31** with no 2028 date — so the 2027 sibling's Cboe kill switch has **not** fired. **Computed 1998–2050, reproducing the sibling's figures then departing from them:** 2028-01-01 is a **Saturday**, so NYSE observes **no New Year's holiday** in 2028 and January carries **one** closure; all **8/53** Saturday-Jan-1 years are **−4** years, so MLK 2028 = expiration (01-21) **− 4**, the **22/53 (41.5%)** minority side vs 2027's +3. Expiration week therefore runs **4 sessions** — **53 of 636 (8.33%)** such weeks 1998–2050, caused only by Washington's Birthday (23), MLK (22), Juneteenth (8). **The sibling's VIX-hole finding inverts**: Jan→Feb third Fridays are **28** days apart, strips **overlap 01-19 → 01-21**, MLK 2028 is **covered** (hole recomputed at the same 23/53). Adjacency — peers: n/a (`symbols: []`); macro: BLS 2028 schedule **403** from this runner (sibling saw 404 elsewhere), no US statistical date available; VIX **15.72** (close 2026-09-08, Cboe CSV); geopolitical: **no WEF 2028 collision** — `davos.ch` 2028 page is a real **404** and `weforum.org` **403**, so 2027's Davos overlay does not recur; bond: SIFMA (HTTP 200) publishes 2026–2027 only, terminating at *New Year's Day 2027/2028*, **no 2028 MLK row**; tape: corridor ±5 held **one** entry (`fomc-blackout-start-2028-01-15`, 01-15 → 01-27), which now contains the **whole** short expiration week — its 2027 counterpart opened one day after that year's expiration. Proposes `opex-2028-01-21.json` (D+4) and `vix-expiration-2028-01-19.json` (D+2), both `estimate`. Playbook grep re-run on a widened pattern: **0 hits in both** files. | Initial stance set: **stand aside** (structural row only). Registers **FT-mlk-market-closure-2028-01-17-1** and **-2**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-mlk-market-closure-2028-01-17.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
