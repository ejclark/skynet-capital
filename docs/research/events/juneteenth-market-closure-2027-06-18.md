# US equity markets closed — Juneteenth observed on what would be June's quarterly expiration — juneteenth-market-closure-2027-06-18

**Kind:** sector · **Date:** 2027-06-18 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday table as parsed by the seeding session; the federal observance date is separately primary-sourced below, and the `estimate` label is a taxonomy gap plus a fetch failure, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["opex-2027-06-17"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and take the one thing this row exists for, which is not a view but a
displaced date now backed by evidence instead of inference.** June's quarterly equity expiration
normally prints on the third Friday; in 2027 that Friday is the Juneteenth closure, so the
expiration falls back to **Thursday 2027-06-17**. The sibling `fomc-2027-06-09` lane wanted to file
that date on 2026-09-05 and could not — two Cboe settlement URLs 404'd on it — so it registered a
forward test instead. Both surfaces answered this session: Cboe lists **`VA/M7 — 2027-06-17`**, the
only S&P 500 Variance futures row on the strip that is not a third Friday, and **`VX/K7 —
2027-05-18`**, the only Tuesday on the VIX strip and exactly 30 days before 06-17. Better still,
**2026 already ran this experiment** — 2026-06-19 was also both Juneteenth and June's third Friday —
and the tape settles it: mean relative volume across eight large caps was **2.25 on Thursday
2026-06-18** against 1.01–1.09 every other session that week, landing at the median of the 45
non-displaced quarterly witchings since 2015. The witching moved wholesale to the Thursday. The
second find is a **four-way schedule split on 2027-06-18** nobody in this repo has recorded: NYSE
shut, SIFMA recommending a full bond close, Cboe's index-options **Global Trading Hours session
running until 11:30 a.m. ET**, and — verbatim from the Fed's own K.8 — the **Federal Reserve Banks
open** while only the Board of Governors is closed. Nothing here is tradeable: the date is
`estimate`, `symbols: []`, and a re-grep of both playbook docs for calendar keying returns zero.
The honest output is two calendar entries, three execution guards, one attribution trap and two
forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position, and there is nothing to size | High | D-286; `symbols: []`, `impact: low`, and a grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `holiday\|juneteenth\|closure\|half-day\|early close\|witching\|expiration week` returns **0 hits** in both, run this session rather than cited from a sibling ledger | A house playbook that keys on holiday-adjacent or expiration-week sessions being written and back-tested before **2027-06-18** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **File the displaced date; don't trade around it** | High | The load-bearing act available now is filing `opex-2027-06-17` (`estimate`) on the two Cboe surfaces that were 404 to the FOMC lane on the same day, closing a gap that lane wrote down as open | Either Cboe surface ceasing to carry `VA/M7 — 2027-06-17` on a re-fetch before **2026-12-31**, without the June expiration being re-dated by a published exchange notice — the entry loses its source and reverts to inference |
| This month | **Watch the promotion; the entry is now triple-primaried and still cannot be confirmed** | Medium | OPM's 2027 schedule dates the federal observance to **Friday, June 18, 2027** under 5 U.S.C. 6103(b), the Fed's K.8 names **June 18, 2027** in its Saturday-holiday footnote, and Cboe's own hours page shows Juneteenth as a full options closure. It stays `estimate` because the event as titled is an *equity-market* closure, no in-taxonomy prefix covers an exchange hours page, and `nyse.com` returned **HTTP 403** to this runner twice today | An exchange-calendar prefix being added to `market-events-data.ts`'s taxonomy, or NYSE's own page becoming fetchable and re-read, before **2026-10-05** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Carry the schedule split and the displacement — do NOT carry a "compressed week" story** | Medium | The 4-session expiration week is *not* the anomaly it looks like: June's expiration week has been 4 sessions every year since 2024, because Juneteenth has fallen inside it every year since. Expiry→quarter-end is **8** sessions in 2027 vs 7/6/5 in 2026/25/24 — mid-to-high, not compressed. What IS unusual is the schedule split on the closed day itself | Cboe publishing a 2027 hours table with **"None" in the Global Trading Hours column** against Juneteenth (the Good Friday / Christmas Day shape), observed on or before **2027-06-17** — the index-options guard inverts. Registered as **FT-juneteenth-market-closure-2027-06-18-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-06-18. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Thu 2027-06-17):** this is the quarterly expiration, not the day before it.
  Treat it as a witching session — closing-auction rebalance flow, AM-settled index series, the
  whole signature — even though the calendar says Thursday. `estimate`; see `opex-2027-06-17`.
- **Execution guard (Fri 2027-06-18):** on the 2026 pattern, Cboe runs **Global Trading Hours for
  SPX / VIX / XSP / RUT from 8:15 p.m. ET Thursday to 11:30 a.m. ET Friday** while every US cash
  equity venue is shut. An index-options quote exists that morning with **no underlying cash
  market and no ETF hedge** behind it — one session after those same products' quarterly
  settlement. Read prices there as thin, not as information. Cboe has not published a 2027 table;
  this is the 2026 row, and it is the second forward test.
- **Execution guard (Fri 2027-06-18, cross-asset):** the **Federal Reserve Banks are open** and only
  the Board of Governors is closed (FED: K.8, verbatim below), while SIFMA recommends a **full**
  US fixed-income close. Central-bank payment infrastructure runs on a day with no US equity or
  bond tape.
- **The negative result worth keeping:** unlike Good Friday 2027, SIFMA attaches **no early close**
  to the day before Juneteenth. Thursday 2027-06-17 is a full session in equities *and* fixed
  income — the cross-asset asymmetry the `good-friday-market-closure-2027-03-26` ledger found does
  **not** repeat here. Do not port that guard across by analogy.
- **Attribution trap (Mon 2027-06-21):** the first session after the expiration is three calendar
  days later. A move there has an unpin explanation, a three-day-weekend explanation, a
  post-FOMC-week explanation and a pre-Russell-reconstitution explanation before it has any single
  one. In 2026 the equivalent Monday was the *quietest* session of its month (8-name relvol 1.10,
  SPY 0.91, SPY −0.31%) — the unpin did not arrive with force.
- **The corrected counts, to stop them being re-derived wrong:** June 2027 has **21** sessions.
  Expiration week (06-14 → 06-17) = **4 sessions**, which is the same as 2024, 2025 and 2026.
  Expiry → quarter-end = **8 sessions** (2026 = 7, 2025 = 6, 2024 = 5, 2023 = 9). Q2 2027 ends
  Wednesday **2027-06-30**; the FTSE Russell reconstitution Friday is **2027-06-25**, unmoved.

## Initial research

### The question

The calendar entry was filed on a claim about displacement, not about a holiday: that June's
quarterly expiration cannot print on 2027-06-18 and therefore falls to Thursday 2027-06-17 — a claim
the `fomc-2027-06-09` lane could not source on 2026-09-05 and consciously left as a forward test
(`FT-fomc-2027-06-09-2`). Is the displacement real and sourceable? And does a day the market is shut
earn a calendar row beyond that one fact?

**One-line verdict:** the displacement is **SUPPORTED on two Cboe surfaces and independently
confirmed in the 2026 tape**, which ran the identical collision one year earlier; the compression
framing a reader would reach for is **REFUTED** (a 4-session June expiration week is now the norm,
not the exception); and the finding that justifies the row beyond the date is a **four-way schedule
split on the closed day** — NYSE shut, bonds shut, Cboe index options trading a global session to
11:30 a.m. ET, and the Federal Reserve Banks open.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Nothing was taken from the seeding note on faith; primaries were fetched and
every count and ratio below was computed this session.

- **Cboe** `cboe.com/us/futures/market_statistics/settlement/` (HTTP 200, 536,888 bytes) and the
  machine-readable `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04`
  (HTTP 200, 1,731 bytes) — the two surfaces that were 404 to the FOMC lane. Source of the
  headline find; both parsed, and every VX and VA row's weekday checked by arithmetic.
- **Cboe** `cboe.com/about/hours/us-options/` (HTTP 200, 386,016 bytes) — the US options hours and
  holiday table, parsed row-by-row out of its rendered markup.
- **Federal Reserve** `federalreserve.gov/aboutthefed/k8.htm` (HTTP 200, 82,205 bytes) — *Holidays
  Observed — K.8*, read for the 2027 column and both footnotes verbatim.
- **OPM** `opm.gov/policy-data-oversight/pay-leave/federal-holidays/` (HTTP 200, 152,589 bytes) —
  the 2027 Holiday Schedule and its Saturday-holiday footnote.
- **SIFMA** `sifma.org/resources/general/holiday-schedule/` (HTTP 200, 298,899 bytes), parsed out
  of the page's embedded payload because the 2027 panel is a hidden tab the rendered text drops —
  the same technique the `good-friday-market-closure-2027-03-26` ledger recorded.
- **Yahoo** daily bars with volume for SPY and eight S&P 500 large caps (AAPL, MSFT, JPM, XOM, JNJ,
  PG, KO, WMT), 2005/2015 → 2026-09-04, for the displacement measurement and the session-return
  history. `^VIX` close 2026-09-04 = **14.53** for the probe reference.
- **Attempted and failed, recorded rather than worked around:** `nyse.com/markets/hours-calendars`
  (HTTP **403** to this runner, twice, with and without a browser User-Agent — so the event's own
  headline source could not be re-read today); `theocc.com/company-information/expiration-calendar`
  (403); `cdn.cboe.com` 2027 expiration-calendar PDF (403); `optionseducation.org` expiration
  calendar (200, but renders its dates client-side — no 2027 date in the HTML);
  `spglobal.com/spdji` rebalance methodology PDF (403).
- **Computed, not sourced:** every session count, weekday and relative-volume figure below.

### Conviction legs, tested

1. **The June 2027 expiration is Thursday 2027-06-17 — SUPPORTED, on evidence a sibling lane
   wanted and could not get.** Cboe's settlement surfaces carry `VA/M7 — 2027-06-17` (S&P 500
   Variance futures, settlement price 319.25). Cboe Variance futures are third-Friday-dated, and
   every other listed VA row proves it: U6 2026-09-18, V6 2026-10-16, X6 2026-11-20, Z6 2026-12-18,
   F7 2027-01-15, G7 2027-02-19, Z7 2027-12-17 — all verified third Fridays by weekday arithmetic
   this session. **VA/M7 is the single exception on the strip**, and it is one session early,
   against the Juneteenth closure. The same two surfaces carry `VX/K7 — 2027-05-18`, a **Tuesday**
   where every other VX contract is a Wednesday, and 2027-05-18 + 30 days = **2027-06-17** — VIX
   futures settle exactly 30 days before their reference SPX expiration, a rule that reproduces
   VX/H7 → 2027-04-16 and VX/J7 → 2027-05-21 against unadjusted third Fridays. Two product families,
   one date, no way to read them as anything else.

2. **The 2026 tape already ran this experiment, and the witching moved — SUPPORTED, measured.**
   2026-06-19 was also both Juneteenth and June's third Friday, and it is absent from the price
   series (the closure is directly observable). Mean relative volume across the eight large caps —
   each session's volume over the median of its prior 20 — for that week:

   | Session | | 8-name mean relvol |
   |---|---|---|
   | 2026-06-15 | Mon | 1.08 |
   | 2026-06-16 | Tue | 1.05 |
   | 2026-06-17 | Wed | 1.09 |
   | **2026-06-18** | **Thu** | **2.25** |
   | 2026-06-19 | Fri | *closed — not in the tape* |
   | 2026-06-22 | Mon | 1.10 |

   The 45 non-displaced quarterly witchings from 2015-03 to 2026-03 run **min 1.40 / p25 1.91 /
   median 2.20 / p75 2.53 / max 3.63**, and the session *before* a witching runs near 1.10.
   2026-06-18's 2.25 sits at the median of the witching distribution while its Wednesday sits at the
   median of the ordinary-day distribution. The signature transferred whole; nothing was left behind
   on the Wednesday.

3. **SPY is the wrong instrument for leg 2, and a later session must not repeat the mistake —
   SUPPORTED.** Run on SPY alone, 2026-06-18 scores relvol **1.57** against a June-witching history
   whose expiry-day median (1.28) and day-before median (1.26) are indistinguishable — SPY simply
   does not separate the two, so the same test on SPY looks inconclusive. The closing-auction
   rebalance flow that makes a witching visible lands in index *constituents*, not in the index ETF.
   Recorded because the cheap version of this test gives the wrong answer.

4. **"The 4-session expiration week is a compression anomaly" — REFUTED.** Juneteenth has fallen
   inside June's expiration week every year since 2024, so a 4-session week is the recent norm:

   | Year | 3rd Fri Jun | Expiry session | Expiry week | Expiry → quarter-end |
   |---|---|---|---|---|
   | 2022 | 06-17 | 06-17 | 5 | 9 |
   | 2023 | 06-16 | 06-16 | 5 | 9 |
   | 2024 | 06-21 | 06-21 | **4** | 5 |
   | 2025 | 06-20 | 06-20 | **4** | 6 |
   | 2026 | 06-19 | **06-18** | **4** | 7 |
   | **2027** | **06-18** | **06-17** | **4** | **8** |
   | 2028 | 06-16 | 06-16 | 5 | 9 |

   2027's expiry→quarter-end corridor of **8 sessions is the longest since 2023**, not a squeeze.
   The only genuinely distinctive calendar fact is that in 2026 and 2027 the holiday sits *between*
   the expiration and the weekend rather than after it — and even the resulting 3-calendar-day gap to
   the next session is not novel: 2022 and 2023 had the same gap with the holiday on the Monday.

5. **A four-way schedule split on 2027-06-18 — SUPPORTED, and it is the new material here.**
   Read across four primaries fetched today:
   - **Federal observance.** OPM's *2027 Holiday Schedule* lists `Friday, June 18 ** | Juneteenth
     National Independence Day`, footnote `**` verbatim: *"If a holiday falls on a Saturday, for
     most Federal employees, the preceding Friday will be treated as a holiday for pay and leave
     purposes. (See 5 U.S.C. 6103(b).)"* 2027-06-19 is a Saturday — the observance is statutory.
   - **Federal Reserve, and this is the sharp one.** K.8 lists Juneteenth as `June 19` in every year
     column, marks 2027 `June 19*`, and its footnote reads verbatim: *"Saturday - the Federal
     Reserve Banks are open, but the Board of Governors is closed on July 3, 2026, June 18, 2027,
     December 24, 2027, December 31, 2027, and November 10, 2028."* The page's header note is
     equally explicit: *"For holidays falling on Saturday, Federal Reserve Banks and Branches will
     be open the preceding Friday; however, the Board of Governors will be closed."* So on
     2027-06-18 the **Reserve Banks operate** while no US equity or bond market does.
   - **Fixed income.** SIFMA's 2027 US panel carries `Juneteenth | Friday, June 18, 2027` with **no
     early-close note attached** (the neighbouring Memorial Day row in the same panel does carry
     one: *"Early Close (2:00 p.m. Eastern Time): Friday, May 28, 2027"*). A recommended full close,
     and — the negative result — **no Thursday early close**, unlike Good Friday 2027.
   - **Index options.** Cboe's own hours page gives its 2026 holiday table, where the Juneteenth row
     reads `Juneteenth Holiday | June 19 | None | 8:15 PM (Thu) to 11:30 AM (Fri)` — no regular
     trading hours, but a **Global Trading Hours session in SPX / VIX / XSP / RUT running into
     11:30 a.m. ET on the holiday itself**. Good Friday and Christmas Day are the contrast:
     `None | None`, fully dark. Cboe has published no 2027 table, so this is the 2026 shape carried
     forward as a hypothesis, not an assertion — hence the forward test.

6. **The date stays `estimate`, and the reason is now two reasons — SUPPORTED.** Three independent
   primaries date the observance (OPM statutory, FED: K.8, Cboe's 2026 analogue) and the tape
   corroborates the mechanic. It is still not `confirmed` because (a) the event as titled is an
   **equity-market** closure, and no source obtained today asserts that in the taxonomy's terms —
   the Fed row in fact says the *Banks* are open, so promoting on `FED:` would be a category error;
   and (b) the entry's own headline source, `nyse.com/markets/hours-calendars`, returned **HTTP 403**
   to this runner on both attempts, so it could not even be re-read. Since every honest call here is
   a stand-aside, the label costs nothing.

7. **The "June expiration closes red" regularity — MIXED, and deliberately not promoted to a
   signal.** SPY's June expiration session closed **negative in 15 of the 16 years 2010–2025**
   (median −0.46%, only 2012 positive at +0.50%). The one displaced year on record, 2026-06-18,
   closed **+0.78%** — the streak broke on the first Thursday expiry. That is n=1 and a single-month
   seasonal with obvious multiple-comparison exposure, so it is recorded as an observation and an
   attribution trap, **not** as a play and not as a forward test. It is noted here so that a future
   session reading a green 2027-06-17 does not treat it as a discovery.

8. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|juneteenth|closure|half-day|early close|witching|expiration week` returns **zero hits in
   both files**, run this session. No playbook can fire on either date in either direction.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the two calendar entries (`opex-2027-06-17`,
`vix-expiration-2027-05-18`), the three execution guards, the SIFMA negative result, the Monday
2027-06-21 attribution trap, and the corrected session counts — all already in the signals list.

### Honest limits

- **NYSE's own page is unread this session.** Two 403s mean the closure's headline source was not
  re-verified; it rests on the seeding session's recorded cell-by-cell parse plus three independent
  corroborations. First pulse with a working NYSE fetch closes it.
- **The Cboe Global Trading Hours guard is a 2026 row, not a 2027 one.** Cboe has published no 2027
  hours table. The guard is stated as the 2026 shape and registered as a forward test rather than
  asserted for 2027.
- **The second SIFMA panel is uninterpreted.** The page's 2027 payload also carries `Juneteenth |
  Saturday, June 19, 2027` in a different panel from the one quoted above. This session did not
  establish which market that panel governs and therefore says nothing about it, rather than
  guessing.
- **No expiration *rule text* was obtained.** The displacement rests on Cboe's own product listings
  and the 2026 tape, not on a quoted exchange rule — OCC's calendar (403), Cboe's PDF (403) and
  OIC's client-rendered page all failed. The evidence is strong and convergent; it is still
  listings-and-tape rather than rulebook, and that distinction is kept.
- **Leg 7 is n=1 on the thing that matters.** One displaced year is not a sample.
- **Every event in this corridor is `estimate`,** including this one, `opex-2027-06-17`,
  `fomc-2027-06-09` and `boj-decision-2027-06-11`. Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally — this row holds a displaced date,
a schedule map and three execution guards, not a view. Concretely: (a) June 2027's quarterly
equity expiration is **Thursday 2027-06-17**, now filed as `opex-2027-06-17` (`estimate`) on two
Cboe surfaces and corroborated by the 2026 tape, which closes the gap `FT-fomc-2027-06-09-2` was
opened to cover; (b) the closed Friday is **not uniformly closed** — SIFMA recommends a full bond
close and NYSE is shut, but Cboe's index-options Global Trading Hours session ran to 11:30 a.m. ET
on the 2026 analogue and the **Federal Reserve Banks are open** per K.8 verbatim; (c) the
compression reading is wrong — a 4-session June expiration week is the norm since 2024 and the
expiry→quarter-end corridor is the *longest* since 2023 at 8 sessions. Every statement here carries
the event's **`estimate`** label.

**Kill switches:**

- **Either Cboe surface stops carrying `VA/M7 — 2027-06-17`** on a re-fetch, without a published
  exchange notice re-dating the June expiration — leg 1 loses its source and `opex-2027-06-17`
  reverts to inference. Registered as **FT-juneteenth-market-closure-2027-06-18-1**, score by
  2027-06-21.
- **Cboe publishes a 2027 hours table with "None" in the Global Trading Hours column against
  Juneteenth** — the index-options guard inverts and the closed day becomes uniformly dark.
  Registered as **FT-juneteenth-market-closure-2027-06-18-2**, score by 2027-06-18.
- **SIFMA adds an early-close recommendation against Thursday 2027-06-17** — the "no cross-asset
  asymmetry" negative result flips and the Good Friday guard ports across after all.
- **The Fed revises K.8 to close the Reserve Banks on 2027-06-18** — the sharpest leg of the
  schedule split disappears.
- **NYSE republishes its holiday table with a different 2027 Juneteenth date** — everything here
  re-dates. (No mechanism exists; 5 U.S.C. 6103(b) is statutory. Listed for completeness.)
- **A house playbook that keys on holiday-adjacent or expiration-week sessions is written and
  back-tested** — leg 8 goes stale and the stand-aside is re-argued on measured data rather than on
  absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 286 | **Initial research.** Displacement **SOURCED**, closing the gap `FT-fomc-2027-06-09-2` covers: Cboe's settlement page + CSV both carry `VA/M7 — 2027-06-17` (the only non-third-Friday VA row on the strip) and `VX/K7 — 2027-05-18` (the only Tuesday VX row, = 06-17 − 30d). **Corroborated in the tape:** 2026 ran the identical collision; 8-name mean relvol **2.25 on Thu 2026-06-18** vs 1.01–1.09 that week, against a 45-witching band of 1.40/1.91/2.20/2.53/3.63 — the witching moved whole. SPY alone scores 1.57 and cannot separate expiry from the day before; use single names. **Compression framing REFUTED:** a 4-session June expiry week is the norm since 2024, and expiry→quarter-end is **8** sessions (2026 = 7, 2025 = 6, 2024 = 5) — the longest since 2023. **New find — four-way split on the closed day:** OPM dates the observance Fri 2027-06-18 under 5 U.S.C. 6103(b); FED: K.8 says verbatim the **Reserve Banks are open**, only the Board closed; SIFMA recommends a full bond close with **no** Thursday early close (unlike Good Friday 2027); Cboe's 2026 row runs **GTH to 11:30 a.m. ET** on Juneteenth where Good Friday is `None | None`. Leg 7 logged not promoted: SPY's June expiry session closed red 15 of 16 years 2010–2025, and the one displaced year (2026) closed **+0.78%** — n=1, an attribution trap, not a play. Adjacency — peers: n/a (`symbols: []`); macro: nothing tracked within 5 days (`fomc-2027-06-09` at 9, `boj-decision-2027-06-11` at 7); VIX **14.53** (close 2026-09-04); geopolitical: none dated to this corridor; tape: Russell recon Fri 2027-06-25 unmoved, Q2 ends Wed 2027-06-30. `nyse.com` **403 ×2** — the headline source is unread today. Proposes `opex-2027-06-17.json` and `vix-expiration-2027-05-18.json` (both `estimate`). | Initial stance set: **stand aside** (structural row only). Registers **FT-juneteenth-market-closure-2027-06-18-1** and **-2**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
