# US markets closed — Thanksgiving Day 2027-11-25 — thanksgiving-market-closure-2027-11-25

**Kind:** sector · **Date:** 2027-11-25 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday grid, fetched HTTP 200 this session; OCC 2027 expiration calendar; SIFMA 2027 US panel; 5 U.S.C. §6103 verbatim. The `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.46,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2027-11-30","fhfa-hpi-2027-11-30","fomc-blackout-start-2027-11-27","sifma-bond-early-close-2027-11-26","thanksgiving-half-day-2027-11-26"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — but stop reading the half-day Friday as the session that prices the
closure. It measurably is not.** Thanksgiving is structurally unique on the NYSE calendar and the
grid says so without any statistics: of ten listed holidays it is the only one fixed to a **Thursday**,
and of the three early closes in the footnote list it is **the only closure FOLLOWED by a scheduled
early close** — every other early close *precedes* its holiday. So the first session back is 3.5 hours
long by rule, and the next full session is the Monday. Measured on `^GSPC` 1970–2025 (n=56) and `^VIX`
1990–2025 (n=36), that shows up exactly where you would expect: **the reopening premium every other US
closure carries on its FIRST session lands one session late here.** The half-day Friday runs **0.73×**
the November baseline; the Monday runs **1.44×** — while **Labor Day is 1.35× then 0.88×, Memorial
1.27× then 1.03×, Presidents 1.22× then 0.88×**. Rank-based so 2008 cannot drive it: session 2
out-moves session 1 in **35 of 56** Thanksgivings (62.5%) against **83 of 194** (42.8%) pooled across
the four Monday closures — **z = 2.60, p = 0.0092** — and on VIX, an independent instrument, the larger
step lands on session 2 in **25 of 36** (69.4%) against 49.3% pooled, **p = 0.031**. The **total**
repricing is generic (span **1.60×** vs Memorial 1.61×, Labor 1.50×); only its **timing** differs.
**The level claim is refused:** against ordinary November Mondays the post-Thanksgiving Monday's
*median* is just **1.09×**, permutation **p = 0.36**. This is an ordering result, not a big-session
result. For 2027 the displaced Monday — **2027-11-29** — sits inside the December FOMC blackout, is
November's **penultimate** session, and precedes a month-end Tuesday carrying two prints: a
four-story attribution trap. Nothing here is tradeable — date `estimate`, `symbols: []`, and a re-grep
of both house playbooks returns **0 hits**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session 443 days out is not a position | High | D-443; `symbols: []`, `impact: low`, date `estimate`, and `docs/plans/trade-playbooks.md` + `docs/research/multi-symbol-sweep.md` grepped this session for `holiday\|thanksgiving\|black friday\|half.day\|early close\|closure\|blackout` return **0 hits in both** | A house playbook keying on holiday-adjacent or half-day sessions being written and back-tested before **2027-11-25** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured performance |
| This week | **Stand aside; bank the displacement result, do not trade it** | High | The live calendar items this week are dated 2026-09, not 2027-11. The one thing worth doing now is written down: which session absorbs a Thanksgiving closure is measured, so the next pulse does not rediscover it | Any figure in the conviction-leg tables failing to reproduce from `^GSPC`/`^VIX` daily bars before **2026-10-08** — every number here is this session's own arithmetic and nothing else |
| This month | **Watch the promotion, not the tape — the date is now quadruple-primaried and still cannot self-confirm** | Medium | NYSE's own 2027 grid, the OCC's 2027 expiration calendar (`hatched` full-closure flag), SIFMA's 2027 US panel and 5 U.S.C. §6103 all give **Thursday 2027-11-25**, and the fourth-Thursday rule reproduces **0 of 56** trading days against the tape 1970–2026 | A `NYSE:`-class (or equivalent exchange-calendar) prefix being added to the source taxonomy in `market-events-data.ts` before **2026-10-08** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Carry "the half day does not vent; the Monday does" — as a reading rule, never an entry** (`estimate`) | Medium | Ordinal and instrument-independent: S&P session 2 > session 1 in **35/56** vs **83/194** pooled (p = 0.0092); VIX's larger step on session 2 in **25/36** vs **67/136** (p = 0.031). The **level** claim is explicitly refused (median 1.09× an ordinary November Monday, p = 0.36) | The **2027-11-26** half session printing an absolute S&P close-to-close move **at or above** the **2027-11-29** session's. Registered as **FT-thanksgiving-market-closure-2027-11-25-1** (base rates disclosed and in conflict: 35 of 56 pooled *for*, 3 of 8 in same-configuration years *against*) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2027-11-25 in any branch. It is a closed
  session; `impact: low`, `symbols: []`, and date-keyed action requires `confirmed` regardless.
- **Reading rule (the finding) — do not score the closure on the Friday.** The half session is too
  short to absorb five calendar days of accumulated news, and the tape says the repricing waits for
  **Monday 2027-11-29**. Anyone reading 2027-11-26 as "the market's verdict on the holiday week" is
  reading the wrong session, in the one direction the other four US closures never fail.
- **Execution guard (Fri 2027-11-26) — two closing bells, and the bond tape outlives the equity
  tape.** NYSE footnote \*\*\* (re-read today) puts equities out at **13:00 ET**, eligible options at
  **13:15**; SIFMA's 2027 US panel recommends fixed income out at **14:00 ET**. From 13:00 → 14:00 ET
  the Treasury tape is the only US price discovery running, so a cross-asset leg loses its **equity**
  reference first — the inverse of [`good-friday-market-closure-2027-03-26`](good-friday-market-closure-2027-03-26.md).
  Proposed as `sifma-bond-early-close-2027-11-26` in this PR.
- **Execution guard (Wed 2027-11-24) — a full session, verified, not assumed.** NYSE's early-close
  footnote list names exactly three occasions across 2026–2028 (Mon July 3 2028, the day after
  Thanksgiving, Christmas Eve 2026). **No Wednesday-before-Thanksgiving early close exists in any of
  the three years**, so 2027-11-24 trades 09:30–16:00 ET.
- **Attribution trap (Mon 2027-11-29) — four stories before it has one.** A move that day has a
  displaced-closure story (this document), a *"we are two days into the December FOMC blackout"* story
  ([`fomc-blackout-start-2027-11-27`](fomc-blackout-start-2027-11-27.md), `estimate`), a
  November-month-end story (it is the **penultimate** NYSE session of the month) and an
  ordinary-Monday story. Never let a post-hoc read promote a hypothesis.
- **Explicitly refused — that the Monday is a *large* session.** Its **median** absolute move is
  **1.09×** an ordinary November Monday (0.618% vs 0.569%, n=56 vs n=200), permutation **p = 0.36**,
  and ex-2008 the mean premium falls from 1.44× to 1.34×. The claim that survives is *relative* —
  which of the two sessions absorbs the gap — and nothing more.
- **Explicitly refused — that the closure prices *more* than other closures.** The span from the
  Wednesday close to the Monday close runs **1.60×** the November baseline, indistinguishable from
  Memorial Day's 1.61× and Labor Day's 1.50×. Same total, different distribution.
- **Watch (dated):** SIFMA bond full close **2027-11-11** (est, equities open — proposed here) ·
  NYSE full session **2027-11-24** · **NYSE closed 2027-11-25** (est) · equities 13:00 / bonds 14:00
  **2027-11-26** (est) · FOMC blackout gate opens **2027-11-27** (est) · the displaced session
  **2027-11-29** · month-end **2027-11-30** with `consumer-confidence-2027-11-30` (est) and
  `fhfa-hpi-2027-11-30` (confirmed) · FOMC **2027-12-07/08** (tentative, per the Fed's own calendar).

## Initial research

### The question, plainly

This calendar carried full-closure entries for Labor Day, Good Friday, Memorial Day, Juneteenth, MLK,
Presidents' Day and Washington's Birthday, and **no Thanksgiving closure entry in any year** — only
the *Friday* half day ([`thanksgiving-half-day-2026-11-27`](thanksgiving-half-day-2026-11-27.md)).
[`fomc-minutes-2027-11-17`](fomc-minutes-2027-11-17.md) proposed this one because its entire
publication-date argument rests on the Thursday.

Two siblings have already worked the Friday hard. The half-day ledger measured the day-after session
in detail and refuted nearly all of its folklore, leaving exactly one survivor — *the Friday vol
crush does not arrive*. [`memorial-day-market-closure-2027-05-31`](memorial-day-market-closure-2027-05-31.md)
established the method for a closure ledger: measure the far side, then **kill it with a control** —
its apparent 1.27× reopening premium turned out to be a generic three-day-weekend effect.

So the question this document exists to answer is the one neither could ask: **Thanksgiving is the
only US closure whose reopening session is truncated by rule. Does that 3.5-hour session actually
absorb the closure, or does it defer it?** And if it defers, is that specific to Thanksgiving or just
another way of saying "half sessions are short"?

**One-line verdict.** It **defers**, the deferral is the only place Thanksgiving separates from the
other four closures, and the separation is ordinal and reproduced on two independent instruments — but
the *magnitude* claim that would make it interesting to a trader does **not** survive its own control,
so the output is a reading rule and a refusal, not an edge.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols:
[]`, so no symbol-keyed instrument applies and neither `earnings-cycle.mjs` nor `intraday-edges.mjs`
has a macro mode. Their discipline (*re-source, don't recall*) was honoured literally: every price
figure below was computed this session from raw bars, and no number was inherited from a sibling
ledger without being labelled as such.

**Primaries fetched raw and parsed this session (2026-09-08):**

- **NYSE** `nyse.com/markets/hours-calendars` — **HTTP 200 after its 302, 109,180 bytes** with
  `curl -L` and a browser user-agent. Its holiday data is JSON-ish `"text":"…"` cells, **133** of
  them, parsed cell-by-cell into the full ten-row × three-year grid.
- **OCC** `www.optionseducation.org/api/expirationcalendar` — **HTTP 200, 34,871 bytes**, JSON, read
  as an independent non-exchange primary.
- **SIFMA** `sifma.org/resources/general/holiday-schedule` — **HTTP 200, 299,159 bytes**. The 2027
  panels are tabs the rendered text drops, so they were parsed out of the page's embedded RSC payload
  after unescaping it; **panel attribution was verified, not assumed** (leg 3).
- **Office of Law Revision Counsel** `uscode.house.gov` 5 U.S.C. §6103 — **HTTP 200, 170,743 bytes**,
  the holiday clause extracted verbatim.
- **Federal Reserve** `federalreserve.gov/monetarypolicy/fomccalendars.htm` — **HTTP 200, 164,831
  bytes**, the 2027 meeting grid read directly.
- **Yahoo** `^GSPC` (**14,292** daily bars, 1970-01-02 → 2026-09-08) and `^VIX` (**9,571** bars,
  1990-01-02 → 2026-09-08), both HTTP 200 from `query1` with the repo's own research user-agent.
  *`query2` returned **429** on the first attempt with a browser user-agent, and a `range=max` request
  silently returned **169 monthly** points rather than daily — both recorded because either would have
  produced a plausible-looking wrong answer.*
- **Fetched and found empty rather than worked around:** `census.gov/economic-indicators/calendar-listview.html`
  (HTTP 200, 91,396 bytes) and `federalreserve.gov/monetarypolicy/beige-book-default.htm` (HTTP 200,
  86,202 bytes) **carry no 2027 dates at all**, so no Census release and no Beige Book date can be
  proposed into this corridor. That is an absence this session established, not one it assumed.

### Conviction legs, tested

1. **The date rests on four independent primaries and validates against the tape — SUPPORTED (and
   still `estimate`).** NYSE's grid states *"All NYSE markets observe U.S. holidays as listed below for
   2026, 2027, and 2028"*; under the header `Holiday | 2026 | 2027 | 2028` the Thanksgiving row parses
   exactly as `Thursday, November 26***` / **`Thursday, November 25***`** / `Thursday, November 23***`.
   The OCC's 2027 calendar marks **2027-11-25** `Exchange/OCC holiday` with `hatched: true` — its
   full-closure flag — and marks no other November 2027 date that way. SIFMA's 2027 US panel gives
   `Thanksgiving Day | Thursday, November 25, 2027`. 5 U.S.C. §6103 reads verbatim: *"Thanksgiving Day,
   the fourth Thursday in November."* **And the rule was checked against the tape, not just quoted:**
   computing the fourth Thursday of November for **1970–2026** and looking each date up in `^GSPC`
   returns **0 of 56** that are trading days. The same arithmetic returns 2026-11-26 and 2028-11-23,
   matching the exchange's own row for both. **Why it stays `estimate`:** the prefix taxonomy in
   `market-events-data.ts` has no slot for an exchange holiday calendar, a clearing house's calendar or
   a trade association's recommendations, and this lane may not self-confirm. The label is about the
   taxonomy, not the evidence — and since every honest call here is a stand-aside, it costs nothing.

2. **Thanksgiving is structurally unique on the NYSE calendar, and this needs no statistics —
   SUPPORTED.** The full 2027 grid is ten rows: New Year's Day, MLK Day, Washington's Birthday, Good
   Friday, Memorial Day, Juneteenth, Independence Day, Labor Day, **Thanksgiving Day**, Christmas Day.
   Four are Mondays by rule, Good Friday is a Friday by rule, three are fixed dates that drift, and
   **Thanksgiving is the only one fixed to a Thursday.** The early-close footnotes name exactly three
   occasions — `Monday, July 3, 2028`; `Friday, November 27, 2026, Friday, November 26, 2027, and
   Friday, November 24, 2028 (the day after Thanksgiving)`; `Thursday, December 24, 2026` — and of the
   three, **only the day after Thanksgiving FOLLOWS its closure**; July 3 and Christmas Eve precede
   theirs. So Thanksgiving is the single US closure whose first session back is short **by rule**, in
   every year, and that is a property of the calendar rather than of any sample.

3. **SIFMA's 2027 US panel is now readable first-hand, closing a limit a sibling proposal left open —
   SUPPORTED.** [`thanksgiving-half-day-2027-11-26`'s proposal](../../../src/domain/market-events/proposals/thanksgiving-half-day-2027-11-26.from-fomc-blackout-start-2027-11-27.json)
   states *"BOND SIDE NOT CLAIMED … its rendered markup carries only the 2026 panel."* Unescaping the
   page's own RSC payload returns all three 2027 panels. **Attribution was verified rather than
   inferred by offset** — the method the Memorial Day ledger recorded as *failing*: this entry sits in
   a US-only run (`U.S. Independence Day` / `Labor Day` / `Columbus Day` / `Veterans Day` /
   `Thanksgiving Day` / `Christmas Day`), the UK panel that follows carries `Spring Bank Holiday` and
   `Summer Bank Holiday` with no early-close notes, and the Japan panel after it stamps every card
   *"Tentative – Subject to confirmation by the Bank of Japan."* **Cross-validated against a string
   this repo already holds:** `sifma-bond-early-close-2027-05-28`'s source quotes
   `Memorial Day | Monday, May 31, 2027 | Early Close (2:00 p.m. Eastern Time): Friday, May 28, 2027`,
   and this session's parse returns exactly that. The 2027 US early-close list reads Thu 03-25, Fri
   05-28, Fri 07-02, **Fri 11-26**, Thu 12-23, Fri 12-31; MLK and Presidents Day carry no note — the
   negative control.

4. **The half-day Friday does not absorb the closure — SUPPORTED, and this is the headline.** Across
   **1970–2025**, with the November baseline at **0.764%** mean absolute close-to-close move (n=1,141
   sessions):

   | Session | Mean abs. S&P move | vs November baseline | Median | vs median baseline |
   |---|---|---|---|---|
   | Wednesday before (full) | 0.593% | 0.78× | 0.393% | 0.75× |
   | **Friday half day** (session 1) | **0.560%** | **0.73×** | 0.342% | 0.65× |
   | **Monday** (session 2) | **1.098%** | **1.44×** | 0.618% | 1.18× |

   The whole corridor is quiet **except the Monday**, and the Monday is the only session in it that
   exceeds an ordinary November session at all.

5. **…and the control says that ordering is Thanksgiving's alone — SUPPORTED, and this is the
   document's contribution.** The same construction on every other NYSE closure that produces a
   session-1 / session-2 pair:

   | Closure | n | Session 1 (mean ×) | Session 2 (mean ×) | Session 1 (median ×) | Session 2 (median ×) | Session 2 out-moves session 1 |
   |---|---|---|---|---|---|---|
   | **Thanksgiving** | 56 | **0.73×** | **1.44×** | **0.65×** | **1.18×** | **35/56 = 62.5%** |
   | Memorial Day | 55 | 1.27× | 1.03× | 1.34× | 1.25× | 27/55 = 49.1% |
   | Labor Day | 56 | 1.35× | 0.88× | 1.39× | 0.86× | 19/56 = 33.9% |
   | Presidents Day | 55 | 1.22× | 0.88× | 1.22× | 0.88× | 24/55 = 43.6% |
   | MLK Day (NYSE from 1998) | 28 | 1.02× | 1.03× | 0.88× | 1.30× | 13/28 = 46.4% |

   Every Monday closure front-loads; Thanksgiving back-loads, and it is the **only** one that does.
   **Tested rank-based so the 2008 tail cannot drive it:** 35 of 56 (62.5%) is itself significant
   against a coin (binomial one-sided **p = 0.041**), and against the pooled Monday-closure rate of
   **83 of 194 (42.8%)** the two-proportion test gives **z = 2.604, two-sided p = 0.0092**. This is the
   test the Memorial Day ledger's method demands and it goes the other way here: the control does not
   kill the finding, it *is* the finding.

6. **VIX, an independent instrument, says the same thing — SUPPORTED.** Measuring the VIX step from
   the pre-closure close to each of the two sessions after:

   | Closure | n | pre → session 1 | pre → session 2 | Larger step on session 2 |
   |---|---|---|---|---|
   | **Thanksgiving** | 36 | **+0.45 pt (+2.70%)**, up 20/36 | **+1.15 pt (+5.99%)**, up 26/36 | **25/36 = 69.4%** |
   | Memorial Day | 36 | +0.81 pt (+5.52%) | +0.68 pt (+4.81%) | 19/36 = 52.8% |
   | Labor Day | 36 | +0.94 pt (+5.84%) | +0.70 pt (+5.18%) | 17/36 = 47.2% |
   | Presidents Day | 36 | +0.95 pt (+5.34%) | +0.90 pt (+5.13%) | 15/36 = 41.7% |
   | MLK Day | 28 | +1.10 pt (+5.11%) | +0.76 pt (+4.91%) | 16/28 = 57.1% |

   Every Monday closure's VIX pops on session 1 and decays; Thanksgiving's barely moves on session 1
   (+2.70%, up in **20 of 36** — a coin flip) and only reaches the other holidays' *session-1* band
   (**+5.99%**) by session 2. Ordinally, **25 of 36 = 69.4%** (binomial **p = 0.014**) against a pooled
   **67 of 136 = 49.3%**: **z = 2.159, two-sided p = 0.031**. Two instruments, one conclusion, and this
   one **explains** rather than contradicts the half-day ledger's single surviving finding — *the
   Friday vol crush does not arrive* — because the repricing it would have to crush has not happened yet.

7. **The total repricing is generic — SUPPORTED, and it is the correct deflation of legs 4–6.**
   Measured across the whole closure span (last pre-closure close → session-2 close): **Thanksgiving
   1.221% = 1.60×** its November baseline (median 1.61×), against **Memorial 1.61×** (median 1.87×),
   **Labor 1.50×** (1.73×), **Presidents 1.39×** (1.13×), **MLK 1.16×** (1.41×). A Thanksgiving closure
   prices the same amount as any other US closure. **Only the distribution across the two sessions
   differs**, which is exactly what leg 2's structural fact predicts and is the whole of the claim.

8. **The level claim on the Monday is REFUTED — and it is the claim a trader would actually want.**
   Against ordinary November Mondays (n=200, post-Thanksgiving ones excluded), the post-Thanksgiving
   Monday's **median** absolute move is **0.618% vs 0.569% — 1.09×**, and a 20,000-draw permutation
   test on the median difference returns **p = 0.36**. The 1.44× mean is a **tail** phenomenon: the
   three largest are **2008-12-01 (−8.93%)**, **1987-11-30 (−4.18%)** and **2011-11-28 (+2.92%)**, and
   dropping 2008 alone takes the mean premium from 1.44× to **1.34×**. So the honest statement is
   ordinal: *of the two sessions, the Monday is the one that carries it.* Not: *the Monday is big.*

9. **The 2011–2025 window does not fade the finding — SUPPORTED, weakly (n=15).** Unlike the Memorial
   Day reopening premium, which vanished on recent data (1.02×), the ordering holds on the last fifteen
   instances: half-day Friday **0.72×**, Monday **1.17×** mean / **1.34×** median, and **1.42×** an
   ordinary recent November Monday on medians — session 2 out-moves session 1 in **10 of 15**. n=15
   proves nothing on its own; recorded because the *fade* that killed the sibling's finding is the
   first thing a reader will check, and it is not present.

10. **The eight years that match 2027's configuration point the OTHER way — MIXED, and disclosed
    rather than dropped.** Thanksgiving falls on **November 25** in **8 of 56** years — **1971, 1976,
    1982, 1993, 1999, 2004, 2010, 2021**. In exactly those, the half-day Friday runs **0.816%** (1.18×
    baseline) and the Monday **0.683%** (0.99×), and the Monday out-moves the Friday in only **3 of 8**.
    The subsample is dominated by two sessions: **1971-11-26 (+1.78%)** and **2021-11-26 (−2.27%,
    the omicron Friday — the largest half-day move in the whole record, and the session the half-day
    ledger already flags as its worst case)**. **n=8 is far too small to be a rule in either
    direction** — which is why the 2027 instance is registered as a forward test rather than asserted.

11. **The 2027 corridor is stacked onto the displaced session — SUPPORTED, and it is why the finding is
    a caution rather than a curiosity.** Wednesday **2027-11-24** is a full 09:30–16:00 ET session (leg
    2's footnote list carries no Wednesday-before-Thanksgiving early close). Friday **2027-11-26**
    closes at 13:00 ET for equities, 13:15 for eligible options, **14:00 ET** for SIFMA-recommended
    fixed income. The FOMC blackout gate opens 12:00 a.m. ET Saturday **2027-11-27**
    ([`fomc-blackout-start-2027-11-27`](fomc-blackout-start-2027-11-27.md), `estimate`) for a
    **2027-12-07/08** meeting — read first-hand off `fomccalendars.htm` this session, which marks every
    2027 date *"tentative until confirmed at the meeting immediately preceding it."* And **2027-11-29 is
    November 2027's penultimate NYSE session**, with month-end **2027-11-30** carrying
    `consumer-confidence-2027-11-30` (`estimate`) and `fhfa-hpi-2027-11-30` (`confirmed`). So the one
    session this document names is simultaneously the displaced repricing session, an early blackout
    session, and the month-end run-in. **Four explanations, one bar.**

12. **The November 2027 session structure is arithmetic, and it is the maximum — SUPPORTED.** November
    2027 has 22 weekdays (2027-11-01 is a Monday); removing Thanksgiving leaves **21 NYSE sessions**,
    the **top of the 1970–2025 range** (18–21, mean 20.38, and 30 of 56 years reach 21) — the opposite
    of the minimum-length May the Memorial Day ledger recorded. One of those 21 is 3.5 hours long, and
    only **three** fall after the holiday (11-26 half, 11-29, 11-30). The position is fully determined
    by the day of month, verified against the bars: with Thanksgiving on the 25th the Monday is
    **always** November's penultimate session (true in **8 of 8** such years), while on the 27th or 28th
    it falls in **December** instead (**16 of 56** years overall).

13. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep of
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|thanksgiving|black friday|half.day|early close|closure|blackout` returns **zero hits in
    both**, run this session. No playbook can fire on this date in either direction. Regime anchors read
    today: **VIX 15.46**, **S&P 7,671.76** (2026-09-08 closes) against the **14.53 / 7,718.60** the
    Memorial Day ledger recorded four sessions earlier — **+0.93 VIX points, −0.61% on the index**, both
    inside the screen's materiality thresholds, so **no regime shift**, and the probe baseline above is
    set with real readings.

### What the conditions support (date `estimate` — caution only, never an entry)

**No direction, no size, no level.** One reading rule, three execution facts, two refusals:

- **Read the Monday, not the Friday.** For a Thanksgiving closure the session that prices the gap is
  session 2. This is the only US closure of which that is true, and it holds on two instruments.
- **2027-11-26 has two closing bells** — equities 13:00 ET, recommended fixed income 14:00 ET — with
  the bond tape outliving the equity tape by an hour.
- **2027-11-24 is a full session**, and **2027-11-29 is November's penultimate session**, two days into
  the December FOMC blackout.
- **Refused: that the post-Thanksgiving Monday is a big session** (median 1.09× an ordinary November
  Monday, p = 0.36; the mean premium is a 2008/1987 tail).
- **Refused: that a Thanksgiving closure prices more than any other closure** (span 1.60× vs Memorial
  1.61×, Labor 1.50×).

### Honest limits

- **The mechanism and the finding are the same sentence, which is a weakness as well as a strength.**
  A 3.5-hour session mechanically has less time to move than a 6.5-hour one, so part of the Friday's
  0.73× is arithmetic rather than behavioural. This document does **not** separate the two, and the
  ordinal test cannot: it compares two sessions of unequal length by construction. What the test *does*
  establish is that the four Monday closures — whose two sessions are both full length — show the
  opposite ordering, so "long weekends front-load" is not a universal the half day merely dilutes.
  **No claim is made that a Thanksgiving closure is *more* eventful; leg 7 says explicitly it is not.**
- **Leg 10's n is 8, and it disagrees with legs 4–6.** The years matching 2027's configuration invert
  the pooled result, and one of the eight (2021, omicron) is a genuine tail. It is registered, not
  believed — and the forward test deliberately backs the pooled sample this time, unlike the Memorial
  Day ledger's -1, which backed its n=8. Both cannot be right as a general rule; each is a single
  observation on its own event.
- **Leg 9's n is 15.** "The effect has not faded" is a much weaker statement than "the effect is
  present," and it is stated that way.
- **Leg 5's MLK row starts in 1998** (NYSE began observing it then), so its n is half the others'. It
  is the weakest row in the control table; the pooled comparison does not depend on it (dropping MLK
  entirely leaves 70/166 = 42.2%, which moves nothing).
- **The 2027 corridor's other three legs are inherited or revisable.** The blackout gate is
  [`fomc-blackout-start-2027-11-27`](fomc-blackout-start-2027-11-27.md)'s `estimate`, resting on a
  meeting the Fed itself calls tentative; the SIFMA 14:00 ET close is a recommendation SIFMA states
  members may ignore; the month-end and session-count legs are the only pure arithmetic among them.
- **No US statistical release can be shown to land in this corridor.** Census's release calendar and
  the Fed's Beige Book page were both fetched successfully today and **carry no 2027 dates**, so unlike
  the 2026 instance — where the half-day ledger found an 8:30 a.m. print landing on the half day — the
  2027 Wednesday and Friday are **unresearched rather than empty**. A later pulse should re-fetch both
  once Census publishes 2027; that is the single highest-value thing the next session can do.
- **CME futures hours across 2027-11-25/26 are not asserted.** `cmegroup.com` has 403'd this runner in
  every sibling lane and was not re-attempted, so the futures leg of the two-closing-bells guard is
  unresearched.

## Stance & kill switches

**Stance (2026-09-08; date `estimate`, and every trading-adjacent statement below carries that
label).** **Stand aside, permanently and structurally** — and the contribution is a *reading rule*
that neither sibling could reach. [`thanksgiving-half-day-2026-11-27`](thanksgiving-half-day-2026-11-27.md)
measured the Friday and found it thin, data-bearing and — its one survivor — **missing the ordinary
vol crush**. This session measured the session nobody had, the **Monday**, and the two results turn out
to be the same result: **the Thanksgiving closure's repricing is displaced one session, onto the
Monday, and Thanksgiving is the only US closure of which that is true.** Ordinally, S&P session 2
out-moves session 1 in **35 of 56** (62.5%) against **83 of 194** (42.8%) pooled across the four Monday
closures (**p = 0.0092**), and VIX's larger step lands on session 2 in **25 of 36** (69.4%) against
**49.3%** pooled (**p = 0.031**). The structural cause needs no statistics: NYSE's own grid makes
Thanksgiving the only closure **followed** by a scheduled early close, so its first session back is
3.5 hours by rule.

**And the interesting-to-a-trader version is refused.** The **total** repricing is generic (span
**1.60×** the November baseline, against Memorial 1.61× and Labor 1.50×), and the Monday's *level* does
not separate from an ordinary November Monday on medians (**1.09×**, permutation **p = 0.36**); the
1.44× mean is a 2008/1987 tail. What survives is an **ordering** claim and an **attribution** caution,
not an edge. **No directional call, no size, `symbols: []`.**

**What is operative for 2027 is execution and reading, not position.** Wednesday **2027-11-24** is a
full session (verified against NYSE's own early-close footnote list); Friday **2027-11-26** closes at
**13:00 ET** for equities and **14:00 ET** for SIFMA-recommended fixed income, so the bond tape
outlives the equity tape by an hour; and the displaced session **2027-11-29** is simultaneously two
days into the December FOMC blackout and November's **penultimate** session, one bar before a month-end
Tuesday carrying two prints. Any move that day has four explanations before it has one.

**Kill switches:**

- **Date kill:** NYSE republishing its holiday grid with a different 2027 Thanksgiving, the OCC
  un-flagging 2027-11-25, or Congress amending 5 U.S.C. §6103. No mechanism for any of the three exists
  (the fourth Thursday in November is computable and reproduces **0 of 56** non-trading days against the
  tape); listed for completeness.
- **Displacement kill (the load-bearing one):** the **2027-11-26** half session printing an absolute
  S&P close-to-close move **at or above** the **2027-11-29** session's. The pooled base rate (35 of 56)
  and the same-configuration base rate (3 of 8) disagree, and this instance adjudicates them.
  Registered as **FT-thanksgiving-market-closure-2027-11-25-1**, score by **2027-11-30**.
- **Genericness kill:** a re-run of leg 5's control on a later data cut in which the Monday closures'
  session-2 rate rises to meet Thanksgiving's 62.5%, or Thanksgiving's falls to the pooled 42.8%. The
  claim is *relative* and dies if the relation moves — it does not need Thanksgiving's own rate to fall.
- **Mechanism kill (the one that would sharpen it):** a future year in which the NYSE schedules a
  **full** session on the day after Thanksgiving, or schedules an early close on the day after some
  *other* closure. Either would separate "the vent is short" from "it is Thanksgiving," which this
  document explicitly cannot do (see Honest limits).
- **Structure kill:** **2027-11-24** failing to be a full NYSE session, **2027-11-29** failing to be
  November 2027's penultimate session, or SIFMA amending its 2027 US panel to drop the 14:00 ET close
  on 2027-11-26. Registered as **FT-thanksgiving-market-closure-2027-11-25-2**, score by **2027-11-29**;
  re-check each pulse, since the failure path is a *republication*, not the passage of time.
- **Corridor kill:** the blackout gate moving off **2027-11-27** (its own date is `estimate` until the
  2027-10-26/27 meeting confirms the December one), which would remove one of the four competing
  stories on 2027-11-29 and weaken the attribution caution without touching the measurement.
- **Relevance kill (the good one):** a house playbook that keys on holiday-adjacent or half-day
  sessions being written and back-tested. Leg 13 goes stale and the stand-aside must be re-argued on
  measured performance rather than on absence.

**Two forward tests registered** in
[`forward-tests/thanksgiving-market-closure-2027-11-25.md`](../forward-tests/thanksgiving-market-closure-2027-11-25.md)
— **-1** (the displacement: 2027-11-29 out-moves 2027-11-26, both base rates disclosed and in conflict,
score by 2027-11-30) and **-2** (the structural claim: a full Wednesday, two closing bells on the
Friday, a penultimate-session Monday and 21 NYSE sessions in November 2027, score by 2027-11-29). No
price-direction test is registered: `symbols: []`, the stance takes no position, and an ordering claim
is not a prediction about level.

**Two calendar entries proposed** from this sweep, both parsed first-hand from the SIFMA panel above:
[`sifma-bond-early-close-2027-11-26`](../../../src/domain/market-events/proposals/sifma-bond-early-close-2027-11-26.from-thanksgiving-market-closure-2027-11-25.json)
(D+1, in corridor — the 14:00 ET bond close that outlives the 13:00 ET equity close) and
[`sifma-bond-market-closure-2027-11-11`](../../../src/domain/market-events/proposals/sifma-bond-market-closure-2027-11-11.from-thanksgiving-market-closure-2027-11-25.json)
(**D-14, outside the ±5-day corridor**, flagged as such in its own notes — Veterans Day, bonds dark
and equities open, corroborated by the OCC's `Bank holiday` flag, and the missing 2027 successor to
this calendar's own `sifma-bond-market-closure-2026-11-11`). The equity half day **2027-11-26** is
deliberately **not** proposed here — a sibling lane already owns that proposal, and one file per
finding is the rule.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-443 | **Initial research; canonical `<id>.json` written by this lane** (the id existed only as `proposals/…from-fomc-minutes-2027-11-17.json`, read first). **Date quadruple-primaried today:** NYSE grid **HTTP 200, 109,180 bytes**, Thanksgiving row `Thursday, November 26*** / **Thursday, November 25*** / Thursday, November 23***`; OCC 2027 calendar (**HTTP 200, 34,871 bytes**) marks 2027-11-25 `Exchange/OCC holiday`, `hatched: true`; SIFMA 2027 US panel `Thanksgiving Day \| Thursday, November 25, 2027 \| Early Close (2:00 p.m. ET): Friday, November 26, 2027`; 5 U.S.C. §6103 verbatim *"the fourth Thursday in November"*. Rule validated against the tape: **0 of 56** computed Thanksgivings 1970–2026 are `^GSPC` trading days. **Structural leg needs no statistics:** of ten NYSE holidays Thanksgiving is the only **Thursday**, and of three early closes it is the only closure **followed** by one — July 3 2028 and Christmas Eve 2026 precede theirs. **Headline (the session nobody had measured — the Monday):** half-day Friday **0.560% = 0.73×** the November baseline (0.764%, n=1,141), Monday **1.098% = 1.44×**; Wednesday before 0.78×. **Control CONFIRMS rather than kills:** every Monday closure front-loads (Labor 1.35×→0.88×, Memorial 1.27×→1.03×, Presidents 1.22×→0.88×, MLK 1.02×→1.03×) and only Thanksgiving back-loads. **Rank-based so 2008 cannot drive it:** session 2 out-moves session 1 in **35/56 (62.5%,** binom p=0.041**)** vs **83/194 (42.8%)** pooled — **z=2.604, p=0.0092**. **VIX agrees independently:** larger step on session 2 in **25/36 (69.4%,** p=0.014**)** vs 67/136 (49.3%), z=2.159, p=0.031; TG pre→s1 **+2.70%** (up 20/36) vs pre→s2 **+5.99%**, while all four Monday closures run +5.1–5.8% on s1 and decay. This **explains** [`thanksgiving-half-day-2026-11-27`](thanksgiving-half-day-2026-11-27.md)'s one surviving finding (no Friday vol crush) rather than contradicting it. **Deflated honestly:** the **span** is generic (**1.60×** vs Memorial 1.61×, Labor 1.50×) and the Monday's **level** is REFUTED — median **1.09×** an ordinary November Monday (n=200), permutation **p=0.36**; the 1.44× mean is a 2008-12-01 (−8.93%) / 1987-11-30 (−4.18%) tail, and ex-2008 it is 1.34×. **Not faded** on 2011–2025 (Mon 1.34× median, 10/15) but n=15. **Same-config (Nov 25, 8 of 56 years: 1971/76/82/93/99/04/10/21) INVERTS** — Fri 1.18×, Mon 0.99×, Mon>Fri only **3/8**, dominated by 2021's omicron Friday (−2.27%) — disclosed, and the forward test backs the pooled sample against it. **2027 structure:** Nov 2027 = **21 NYSE sessions** (max of the 18–21 range, mean 20.38); 2027-11-24 a **full** session (no Wednesday-before early close in any of the three years); 2027-11-26 equities **13:00** / options 13:15 / SIFMA bonds **14:00** — bonds outlive equities; **2027-11-29 is November's penultimate session** (true in 8/8 Nov-25 years; in 16/56 years overall the Monday falls in December instead) and two days into the blackout. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** `census.gov` calendar (HTTP 200, 91,396 B) and the Fed's Beige Book page (HTTP 200, 86,202 B) **carry no 2027 dates at all** — the corridor is *unresearched*, not empty; re-fetch next pulse. `fomccalendars.htm` (HTTP 200, 164,831 B) read first-hand: **Dec 2027 FOMC = 12-07/08**, "tentative until confirmed". **Volatility:** VIX **15.46**, S&P **7,671.76** (2026-09-08) vs the Memorial Day ledger's 14.53 / 7,718.60 four sessions earlier — **+0.93 pt, −0.61%**, inside screen thresholds, **no regime shift**; probe baseline set with real readings. **Geopolitical:** none touching a `symbols: []` closure. **Corridor (±5 d):** `thanksgiving-half-day-2027-11-26` (D+1, proposal), `fomc-blackout-start-2027-11-27` (D+2), `consumer-confidence-2027-11-30` + `fhfa-hpi-2027-11-30` (D+5). **Two entries proposed:** `sifma-bond-early-close-2027-11-26` (D+1) and `sifma-bond-market-closure-2027-11-11` (**D-14, outside the corridor, flagged as such**) — the SIFMA 2027 US panel was parsed out of the page's RSC payload with **attribution verified** (US-only run; cross-validated against the Memorial Day 2027 card this repo already quotes), which **closes the "BOND SIDE NOT CLAIMED" limit** the `thanksgiving-half-day-2027-11-26` proposal recorded. Equity half day deliberately **not** re-proposed — a sibling owns it. Playbook grep re-run: **0 hits in both**. **Fetch traps recorded:** Yahoo `query2` **429**'d, and `range=max` silently returned **169 monthly** bars rather than daily. | Initial stance set: **stand aside** (structural row only) — and the finding is a **reading rule**: the Thanksgiving closure's repricing is **displaced onto the Monday**, uniquely among US closures, on two instruments; the **total** repricing and the Monday's **level** are both explicitly refused. Registers **FT-…-1** and **FT-…-2**. | 2026-10-08 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome`
below from re-run instrument data (cache busted first), never from memory — after which this doc
goes quiet.
