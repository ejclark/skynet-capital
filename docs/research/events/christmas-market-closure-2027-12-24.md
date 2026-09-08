# US equity and options markets closed — Christmas Day observed (Saturday Christmas, so no half session anywhere in December 2027) — christmas-market-closure-2027-12-24

**Kind:** sector · **Date:** 2027-12-24 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table, fetched direct 2026-09-08; the `estimate` label is a taxonomy question, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.30,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2027-12-22","sifma-bond-early-close-2027-12-23","fhfa-hpi-2027-12-28","fomc-minutes-2027-12-29"],"screenStreak":0,"blocked":[{"url":"https://stooq.com/q/d/l/?s=%5Espx","status":"JS_CHALLENGE","at":"2026-09-08"}]} -->

## At a glance

**TL;DR.** **Stand aside — and stop budgeting December 2027 as a short month.** The closure is real
and triple-sourced: NYSE's own holiday table gives Friday **2027-12-24**, the OCC marks it a
hatched exchange holiday, and across all five Saturday-Christmas years since 1990 (1993, 1999,
2004, 2010, 2021) December 24 is absent from **both** CBOE's VIX history and FRED's Nasdaq series,
5 of 5. What the two sibling proposals that seeded this id got wrong is what comes *after* the
closure. **December 2027 carries 22 sessions — the maximum in the 1990–2025 record (range 19–22)**,
because NYSE footnote `*` says a Saturday New Year is *not* observed, so Friday 2027-12-31 stays
open and offsets the 12-24 closure. And **"Saturday Christmas is structurally special" does not
survive measurement**: the VIX move across the Christmas break is a function of *gap length* alone
(3 non-trading days → mean **+4.32%**, 16 of 20 positive; 1 day → **−0.11%**, 7 of 14), and the
five Saturday years (**+5.08%**, n=5) are indistinguishable from the other fifteen 3-day-gap years
(**+4.07%**, n=15). The genuinely new find, which neither proposal has, is a pair of **cross-asset
schedule asymmetries**: SIFMA's own 2027 US panel recommends a **2:00 p.m. ET bond close on both
Thursday 2027-12-23 and Friday 2027-12-31**, and NYSE runs **full** equity sessions on both — with
2027-12-31 additionally an **OCC quarterly expiration** and the year's last session. Nothing here
is tradeable: the date is `estimate`, `symbols: []`, and a grep of both playbook docs for
calendar/holiday keys returns zero hits. The honest output is two corrections, two execution
guards, two proposed calendar entries and two registered forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position, and there is nothing to size | High | D-472. `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|christmas\|closure\|half-day\|early close` returns **0 hits in both**, run this session rather than cited from a sibling ledger | A house playbook that keys on holiday-adjacent sessions being written and back-tested before **2027-12-23** — the "nothing is calendar-keyed" leg goes stale and this sheet gets rebuilt on measured data |
| This week | **Stand aside; bank the two corrections, don't act on either** | High | The live calendar this week is `sp-quarterly-rebalance-effective-2026-09-21` and the September macro block, not a 2027 holiday. The only thing worth doing now is written down: December 2027 is a **22-session** month, and the Saturday-Christmas configuration carries no signature of its own | Either count in the body failing to reproduce — the 22-session month from NYSE's own 2027 table, or the 3-day/1-day VIX split from CBOE's `VIX_History.csv` — re-derived before **2026-10-08** |
| This month | **Watch the promotion question, not the tape — and it is narrower than the sibling ledgers say** | Medium | Four independent sources now date this event (NYSE table, OCC holiday marker, CBOE session record, FRED session record). It stays `estimate` because this lane confirms only on `IR:`/`BLS:`/`FED:`. But the stock sentence five sibling closure entries each repeat — "the taxonomy has no slot for an exchange's holiday calendar" — is **imprecise**: `market-events-data.ts` *does* carry a confirmed **`OCC:`** prefix, scoped in its header to the "options-expiration calendar (theocc.com / Cboe; 3rd-Friday standard)" | A ruling either way on whether `OCC:` covers that same calendar's **holiday** markers, landed before **2026-11-08** — a yes promotes this and every sibling closure entry at once; a no retires the question and the sentence gets rewritten to name the real gap |
| This quarter | **Carry the two cross-asset asymmetries forward; discard "the closure shortens the corridor"** | Medium | SIFMA's published 2027 US panel puts a **2:00 p.m. ET** bond close on **Thu 2027-12-23** *and* **Fri 2027-12-31**, against full NYSE equity sessions on both — the 12-31 row carrying **no full-close date at all**, exactly as NYSE footnote `*` predicts. Meanwhile December 2027 is a **maximum-length** month, not a shortened one | SIFMA republishing its 2027 US panel without either early close, or NYSE adding any December 2027 early close, observed on or before **2027-12-23**. Registered as **FT-christmas-market-closure-2027-12-24-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-12-24. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Thu 2027-12-23):** equities trade a full session to 16:00 ET; SIFMA recommends
  US fixed income close at **2:00 p.m. ET** (`estimate`, SIFMA 2027 US panel fetched 2026-09-08).
  Any cross-asset construction loses its bond-side reference two hours before the equity close, and
  the next session is dark in equities, options and bonds alike. A timing caution, never a signal.
- **Execution guard (Fri 2027-12-31):** the *year's last session* is a full equity day **and** an
  **OCC quarterly expiration**, against a bond tape SIFMA recommends closing at **2:00 p.m. ET** —
  with **no** holiday behind it, because Saturday New Year is not observed. This is the inverse of
  2026, whose year-end early close sits in front of an observed Friday 2027-01-01.
- **The corrected session budget, to stop it being re-derived wrong:** December 2027 = **22
  sessions**, the record maximum. Sessions from 2027-12-22 to year-end inclusive = **7**
  (12-22, 12-23, 12-27, 12-28, 12-29, 12-30, 12-31). The last five sessions of 2027 = **12-27
  through 12-31**, none of them an early close.
- **Do not file a `christmas-eve-half-day-2027-12-24`.** The *absence* of the half session is the
  finding; such a row would be a false calendar entry. Contrast `christmas-eve-half-day-2026-12-24`,
  which is real because Christmas 2026 is a Friday.
- **Attribution trap:** a move on Monday **2027-12-27** has a 3-day-gap vol-remark explanation, a
  year-end-positioning explanation, a post-`consumer-confidence-2027-12-22` explanation and a
  thin-liquidity explanation before it has any single one.

## Initial research

### The question

This id reached the calendar as **two sibling proposals**, not as a seeded entry — discovered
independently by the `consumer-confidence-2027-12-22` and `fhfa-hpi-2027-12-28` initial-research
sweeps on the same day. Per `EVENT-RESEARCH.md`, this session read both first and then wrote the
canonical file. Both assert the closure and the missing half session; both then build *structural*
claims on top of it that their own lanes depend on. The question is therefore two-part: **is the
date right, and do the downstream claims the two proposals make about the 2027 year-end corridor
survive being measured rather than asserted?**

**One-line verdict:** the date is right and now rests on **four** independent sources; the
downstream claims **do not survive** — December 2027 is a maximum-length month rather than a
shortened one, and the Saturday-Christmas configuration has no measurable signature of its own —
while the fact that actually earns this row is a **pair of cross-asset schedule asymmetries** in
the year-end week that neither proposal saw.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Nothing was inherited from either proposal; every primary was re-fetched and
every count recomputed:

- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302 (the page needs `curl -L`),
  109,180 bytes. The holiday table and **all four footnotes** parsed cell by cell.
- **OCC** `www.optionseducation.org/api/expirationcalendar` — HTTP 200, 34,871 bytes. Holiday
  markers and the expiration-type legend decoded by GUID.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 299,272 bytes. The
  2027 panels are hidden tabs the rendered text drops, so they were parsed out of the page's own
  embedded payload; the US panel is identified by content (only it quotes Eastern Time), not by a
  heading.
- **CBOE** `cdn.cboe.com/api/global/us_indices/daily_prices/VIX_History.csv` — HTTP 200, 472,360
  bytes, **9,267 sessions** 1990-01-02 → 2026-09-07. Used for the session record *and* for the
  break-move measurement.
- **FRED** `fredgraph.csv?id=NASDAQCOM` — HTTP 200, **9,238 sessions** over the same window. Used
  as an *independent* session record, because a one-source session calendar cannot distinguish a
  closure from a data gap.
- **Attempted and failed, recorded rather than worked around:** `stooq.com` daily S&P series
  returned a JavaScript proof-of-work challenge, not data (logged in `probe-ref.blocked`). It was
  the first attempt at the independent session record; FRED replaced it, and the ledger says so.
- **Computed, not sourced:** every session count by weekday arithmetic with 2027-12-24 removed, and
  every break statistic from the CBOE file.

### Conviction legs, tested

1. **The date is right, and now rests on four independent sources — SUPPORTED (and still
   `estimate`).** NYSE's Christmas Day row parses as `["Friday, December 25****", "Friday,
   December 24 (Christmas Day observed)", "Monday, December 25"]` for 2026 / 2027 / 2028 — so 2027
   is a full closure on Friday December 24. The OCC's own calendar marks 2027-12-24
   `{"holiday":{"description":"Exchange/OCC holiday","hatched":true}}` and marks no other
   late-December 2027 date that way. And the rule reproduces from *session records* rather than
   calendars: across all five Saturday-Christmas years since 1990 — **1993, 1999, 2004, 2010,
   2021** — December 24 is absent while December 23, 27 and 31 are all present, **5 of 5 on both**
   the CBOE and FRED series.

2. **The sibling proposal's session record has one bad cell, and it is corrected here — a NEW
   finding.** The `from-fhfa-hpi-2027-12-28` proposal counted Saturday-Christmas Decembers off
   CBOE's `VIX_History.csv` alone. Cross-checking every December date 1990–2025 against FRED's
   Nasdaq series, the two agree on **all but exactly one date in 36 years**: **1999-12-31**, which
   FRED has (Nasdaq Composite 4,069.31) and the CBOE file does not. That is a **CBOE series gap,
   not a closure** — 1999-12-31 was a session. It does not change the Dec-24 conclusion, but a lane
   counting *year-end* sessions off the VIX file alone would have read 1999 as a 4-of-5 case and
   inferred a rule that does not exist.

3. **"The closure leaves the year-end corridor short one session on each side" — REFUTED.**
   December 2027 has 23 weekdays with exactly one removed, giving **22 sessions**. Set against the
   record:

   | December sessions | Years (1990–2025), counted on the FRED series | Count |
   |---|---|---|
   | **22** (the maximum) | 1992, **1993**, 1997, 1998, **1999**, 2003, **2004**, 2008, 2009, **2010**, 2014, 2015, 2020, **2021**, 2025 | 15 |
   | 21 | 1991, 1994, 1996, 2002, 2005, 2011, 2013, 2016, 2019, 2022, 2024 | 11 |
   | 20 | 1990, 1995, 2000, 2001, 2006, 2007, 2012, 2017, 2023 | 9 |
   | 19 | 2018 | 1 |

   **All five Saturday-Christmas years — bolded — sit at the 22-session maximum, 5 of 5.** (Counted
   on the FRED series precisely because of leg 2: off the CBOE file alone 1999 reads 21, and the
   missing cell is the series gap, not a session.) The mechanism is NYSE footnote `*` — *"Because
   the holiday falls on Saturday, January 1, 2028, no New Year's Day holiday is observed"* — so a
   Saturday **Christmas** is observed on the preceding Friday but a Saturday **New Year** is not,
   and the two effects cancel inside December. A lane budgeting December 2027 from a decremented
   2024/2025 template is off in the wrong direction.

4. **"There is no Christmas Eve half session in 2027" — SUPPORTED, and it generalises further than
   the proposals claimed.** NYSE footnote `****` names exactly **one** December early close across
   all three published years: *"Thursday, December 24, 2026"*. So December 2027 has **no early
   close anywhere in it** — not merely no Christmas Eve half day. (2027's only Q4 early close is
   footnote `***`'s day-after-Thanksgiving, **Friday 2027-11-26**.) The tape reproduces the
   underlying pattern in both directions: Dec 24 is a session in every year it is a weekday and
   Dec 25 is not a Saturday, and is not a session in 1993, 1999, 2004, 2010, 2021.

5. **"Saturday Christmas is a structurally distinct configuration" — NOT SUPPORTED; gap length
   carries all of it.** Measuring VIX close-to-close from the last session on or before Dec 24 to
   the first session on or after Dec 26, every year 1992–2025:

   | Cohort | n | Mean | Median | Positive |
   |---|---|---|---|---|
   | 3 non-trading days over the break | 20 | **+4.32%** | +4.01% | 16 / 20 |
   | 1 non-trading day over the break | 14 | **−0.11%** | +0.08% | 7 / 14 |
   | …of which **Saturday-Christmas** | 5 | +5.08% | +7.29% | 4 / 5 |
   | …of which **3-day, non-Saturday** | 15 | +4.07% | +3.74% | 12 / 15 |
   | All years | 34 | +2.50% | +2.34% | 23 / 34 |

   The Saturday subset (+5.08%, n=5) sits inside the other 3-day-gap years' spread (+4.07%,
   sd 3.77, n=15); there is no Saturday-specific effect to find at this n. What *is* clean is the
   3-day-vs-1-day split. **2027's break is a 3-day gap** (Thu 12-23 close → Mon 12-27 open), which
   is the *common* case — 20 of the last 34 years — so 2027 inherits an ordinary long-gap re-mark,
   not an exotic one.

6. **The direction of that effect is counter-intuitive and is stated as a measurement, not a
   mechanism — PARTIALLY UNRESOLVED.** The naive "holiday vol decay" story predicts VIX *falls*
   into a long closure. Measured, it **rises** across the break: +4.32% mean on a 3-day gap. A
   plausible reading is that the decay is marked *into* the pre-break close and re-marked *out* on
   reopen once the calendar days are consumed — but no source stating that convention was fetched,
   so it is labelled inference and is the reason the forward test measures the *sign*, not the
   story.

7. **A genuine pair of cross-asset asymmetries in the 2027 year-end week — SUPPORTED, and new.**
   SIFMA's own 2027 US panel, read out of the page's payload this session:

   | Holiday row | Full close | Recommended early close (2:00 p.m. ET) |
   |---|---|---|
   | Thanksgiving Day | Thursday, November 25, 2027 | Friday, November 26, 2027 |
   | **Christmas Day** | **Friday, December 24, 2027** | **Thursday, December 23, 2027** |
   | **New Year's Day 2027/2028** | *(no date — the field is absent)* | **Friday, December 31, 2027** |

   Both 12-23 and 12-31 are **full** NYSE equity sessions (footnote `****`, leg 4). The 12-31 row's
   **missing full-close field** is itself corroboration: there is no New Year holiday to name,
   exactly as NYSE footnote `*` states, and SIFMA still recommends the early close in front of it.
   Contrast the same panel's 2026/2027 row, which is the normal three-field shape —
   `["New Year's Day 2026/2027", "Friday, January 1, 2027", "Early Close (2:00 p.m. Eastern Time):
   Thursday, December 31, 2026"]`.

8. **Friday 2027-12-31 carries an OCC quarterly expiration — SUPPORTED.** Decoding the OCC
   calendar's legend by GUID, type `812CD242-…` is *"Quarterly Expiration date"*, and it appears on
   `2025-12-31, 2026-03-31, … 2027-09-30, 2027-12-31` — the last business day of each quarter. So
   the year's final session is simultaneously a full equity day, a quarterly expiration, and a
   2:00 p.m. ET recommended bond close. December 2027's monthly chain is unaffected by the closure:
   VIX expiration **12-15**, A.M.-settled index cease **12-16**, monthly equity/index expiration
   **12-17** — all a full week ahead of it.

9. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|christmas|closure|half-day|early close` returns **zero hits in both**, run this session.
   No playbook can fire on any date in this corridor, in either direction.

10. **The promotion blocker is narrower than five sibling ledgers say — a NEW finding, and a
    question rather than a claim.** Each of `labor-day-market-closure-2026-09-07`,
    `good-friday-market-closure-2027-03-26`, `memorial-day-market-closure-2027-05-31`,
    `thanksgiving-market-closure-2027-11-25` and both proposals for this id records some form of
    *"the confirmed-prefix taxonomy has no slot for an exchange's own holiday calendar."* Read
    against the source, that is imprecise. `market-events-data.ts`'s header **does** list a
    confirmed **`OCC:`** prefix — *"options-expiration calendar (theocc.com / Cboe; 3rd-Friday
    standard)"* — and the OCC calendar this session fetched carries **holiday markers on the same
    endpoint as the expirations**. So the open item is a **scoping question with one answer**
    (does `OCC:` cover that calendar's holiday markers?), not an absent slot. This lane does not
    take it: its hard limit confirms only on `IR:`/`BLS:`/`FED:` and its escalation ceiling is a
    PR. It is named here so the next session asks the one question instead of re-copying the
    sentence — and because answering it once would promote every sibling closure entry at once
    rather than one blessing-ask at a time.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the six already in the signals list: the two execution
guards, the corrected session budget, the do-not-file warning, the Monday 12-27 attribution trap,
and the standing stand-aside.

### Honest limits

- **The CME leg is missing.** No CME source was fetched this session, so this ledger does **not**
  assert what Globex does on 2027-12-23, 12-24 or 12-31. Equity-index futures are widely understood
  to be shut on Christmas, but "widely understood" is not a source and it is left unstated rather
  than asserted. The sibling `good-friday-market-closure-2027-03-26` ledger hit HTTP 403 twice on
  the same domain; this session did not retry it.
- **Leg 5 is n=5 on the Saturday subset.** "No Saturday-specific effect" is a failure to detect one
  at that n, not a proof of absence. The 3-day-vs-1-day split (n=20 vs n=14) is the better-powered
  claim and is the one carried forward.
- **Leg 6's mechanism is inference,** explicitly not sourced — see above.
- **SIFMA recommendations are advisory.** They govern member firms' fixed-income desks by
  recommendation, not by halt, and SIFMA states its schedule is subject to change. Both proposed
  entries are `estimate` on that count among others.
- **The UK panel is recorded but not proposed.** SIFMA's UK 2027 rows parse as
  `["Christmas Day", "Friday, December 24, 2027", "Boxing Day", "None"]`, which does not cleanly
  reconcile with the UK's own substitute-day convention. Rather than propose a calendar entry off
  an ambiguous parse, it is written down here and left for a session that can read the panel
  directly.
- **Everything in this corridor is `estimate`,** including this event. Estimates widen caution and
  license nothing.

## Stance & kill switches

**Stance (2026-09-08):** stand aside, permanently and structurally — this row exists to hold two
corrections and two execution guards, not a view. Concretely: (a) **December 2027 is a 22-session
month, the record maximum**, not a shortened one; the Saturday-Christmas closure is offset inside
the month by the unobserved Saturday New Year, and any lane budgeting sessions from a decremented
2024/2025 template is wrong in the wrong direction. (b) The Saturday-Christmas configuration
carries **no measurable signature of its own**; what the tape shows is a **gap-length** effect
(3-day break: VIX +4.32% mean, 16/20 positive; 1-day: −0.11%, 7/14), and 2027's break is an
ordinary 3-day one. (c) The load-bearing new facts are two **cross-asset asymmetries** — SIFMA
recommends a 2:00 p.m. ET US fixed-income close on **Thursday 2027-12-23** *and* **Friday
2027-12-31**, both of which are full NYSE equity sessions, with 12-31 additionally an OCC quarterly
expiration and the year's last session, and with **no** New Year holiday behind it. Every statement
here carries the event's **`estimate`** label.

**Kill switches:**

- **SIFMA republishes its 2027 US panel without either early close, or NYSE adds any December 2027
  early close** — guard (c) is rewritten and both proposed entries retire. Registered as
  **FT-christmas-market-closure-2027-12-24-1**, score by 2027-12-23.
- **VIX rises less than 0% across the 2027 Christmas break** (Thu 2027-12-23 close → Mon 2027-12-27
  close) — the 3-day-gap regularity in leg 5 takes its first out-of-sample miss. Registered as
  **FT-christmas-market-closure-2027-12-24-2**, score by 2027-12-27.
- **The `OCC:`-prefix scoping question is answered** either way (leg 10) — a yes promotes this
  entry and every sibling closure entry to `confirmed`; a no retires the question and the sibling
  ledgers' stock sentence gets rewritten to name the real gap.
- **NYSE republishes its holiday table with a different 2027 Christmas date** — everything here
  re-dates. (No mechanism for this exists; the Saturday-observance rule reproduces 5 of 5 on two
  independent session records. Listed for completeness.)
- **A house playbook that keys on holiday-adjacent sessions is written and back-tested** — leg 9
  goes stale and the stand-aside is re-argued on measured data rather than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | 472 | **Initial research; canonical `<id>.json` written after reading BOTH sibling proposals** (`from-consumer-confidence-2027-12-22`, `from-fhfa-hpi-2027-12-28`). Date now quadruple-sourced — NYSE table, OCC hatched holiday marker, and 5-of-5 absence of Dec 24 in Saturday-Christmas years on **two independent** session records (CBOE VIX 9,267 sessions; FRED NASDAQCOM 9,238) — stays `estimate` on the taxonomy question alone. **Two proposal claims refuted:** December 2027 = **22 sessions, the 1990–2025 maximum** (NYSE footnote `*`: Saturday New Year is not observed, so 12-31 stays open and offsets the closure), not a shortened corridor; and Saturday-Christmas shows **no signature of its own** — the break move is gap-length-driven (3-day: +4.32% mean, 16/20 up, n=20; 1-day: −0.11%, 7/14, n=14; Saturday subset +5.08%, n=5, inside the 3-day spread). **Correction to the sibling's instrument:** CBOE's VIX file and FRED disagree on exactly one December date in 36 years — **1999-12-31**, a CBOE series gap, not a closure. **New find:** SIFMA's 2027 US panel recommends a 2:00 p.m. ET bond close on **Thu 12-23** *and* **Fri 12-31** (the latter on a row with no full-close date at all), against full NYSE equity sessions on both; OCC marks 12-31 a **Quarterly Expiration date**. Footnote `****` names only one December early close across 2026–2028 → **no early close anywhere in December 2027**. Adjacency — peers: n/a (`symbols: []`); macro: `consumer-confidence-2027-12-22`, `fhfa-hpi-2027-12-28`, `fomc-minutes-2027-12-29` all in the corridor; VIX **15.30** (close 2026-09-07); geopolitical: none dated here; tape: Dec 2027 option chain (12-15 / 12-16 / 12-17) sits a full week ahead of the closure. `stooq.com` returned a JS challenge — logged in `probe-ref.blocked`, replaced by FRED. Proposes `sifma-bond-early-close-2027-12-23.json` and `sifma-bond-early-close-2027-12-31.json` (both `estimate`). Records that the sibling ledgers' "no taxonomy slot" sentence is imprecise — `OCC:` exists and is a scoping question. | Initial stance set: **stand aside** (structural row only). Registers **FT-christmas-market-closure-2027-12-24-1** and **-2**. | 2026-10-08 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-christmas-market-closure-2027-12-24.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
