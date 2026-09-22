# US markets closed — Independence Day observed 2027-07-05 — independence-day-market-closure-2027-07-05

**Kind:** sector · **Date:** 2027-07-05 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday grid, SIFMA 2027 US panel and 5 U.S.C. §6103 + E.O. 11582, all three fetched HTTP 200 and parsed first-hand this session. The `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["fomc-minutes-2027-06-30","jobs-2027-07-02","russell-style-quarter-end-capping-effective-2027-06-30","sifma-bond-early-close-2027-07-02","sp-select-sector-secondary-reweight-2027-06-30"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/schedule/news_release/2027_sched.htm","status":"403","at":"2026-09-09"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/%5EGSPC","status":"429","at":"2026-09-09"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC","status":"429","at":"2026-09-09"},{"url":"https://stooq.com/q/d/l/?s=%5Espx&i=d","status":"JS_CHALLENGE","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside on the holiday, and put Friday 2027-07-02 in the diary instead.** The closed
Monday is not a position. What this session found is that **July 4 is the one long weekend that does
not carry the reopening premium every other Monday closure does** — across the 15 Independence-Day
closures since 1975 that produce a Friday→Tuesday gap, the reopening runs **0.560%** mean absolute
S&P move against a **0.654%** July baseline (**0.86×**), and is larger than the pre-holiday Friday in
a coin-flip **8 of 15** — while Memorial Day runs **1.33×**, Labor Day **1.38×**, Presidents Day
**1.25×** and MLK **1.16×** on identical construction. That is a **refusal to import** the sibling
ledger's long-weekend pattern into July, not a tradeable inversion: a year-control shows those same
holidays run **0.87×** when restricted to the seven July-4-on-Sunday years, so a large part of the
apparent effect is a quiet-year draw, and n=15 cannot separate 0.86× from 1.00×. The **operative
date is 07-02, not 07-05** — and that half of the corridor was settled hours earlier today by
[`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md), which this session
reproduced independently from the same primaries and therefore **credits rather than claims**: a
full 09:30–16:00 ET equity session, a **14:00 ET** recommended bond close, and the **June Employment
Situation** that morning. Two source facts *are* this ledger's own. The Sunday→Monday shift is
**E.O. 11582 §3(a)**, not 5 U.S.C. §6103, which the superseded proposal cited. And July 4 falls on a
Sunday in **exactly** the years Memorial Day falls on May 31 — so this closure and its May sibling
are the same calendar object, never independent evidence about long weekends. Nothing here is
tradeable — date `estimate`, `symbols: []`, both house playbooks grep to **zero** calendar-keyed
rules.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position and there is nothing to size | High | D-299; `symbols: []`, `impact: low`, and `docs/plans/trade-playbooks.md` + `docs/research/multi-symbol-sweep.md` grepped this session for `holiday\|independence\|july 4\|closure\|half-day\|early close` return **0 hits in both** | A house playbook keying on holiday-adjacent sessions being written and back-tested before **2027-07-05** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured performance |
| This week | **Stand aside; bank the two source facts, do not trade them** | High | Nothing 2027-dated is live this week. What this session uniquely produced is documentary: the statutory mechanism is **E.O. 11582 §3(a)**, not §6103, and July-4-on-Sunday is arithmetically identical to Memorial-Day-on-May-31, which makes the two ledgers one sample | Any figure in the conviction-leg tables failing to reproduce from Cboe's own `SPX_History.csv` / `VIX_History.csv` before **2026-10-09** — every number here is this session's arithmetic on those two files and nothing else |
| This month | **Watch the promotion, not the tape — the date is triple-primaried and still cannot self-confirm** | Medium | NYSE's grid (`Monday, July 5 (Independence Day observed)`), SIFMA's 2027 US panel and E.O. 11582 §3(a) all give the same Monday, and the closure reproduces **7 of 7** against the tape in the years the data covers | A `NYSE:`-class (or equivalent exchange-calendar) prefix being added to the source taxonomy in `market-events-data.ts` before **2026-10-09** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Do NOT carry a July-4 reopening premium into 2027-07-06** (`estimate` — a planning refusal, never an entry) | Medium | Measured: the July-4 reopening runs **0.86×** the July baseline on n=15 and **0.80×** on the seven matching years, against **1.16×–1.38×** for the four other Monday closures. The pre-holiday side is [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md)'s row, not this one's | The **2027-07-06** reopening printing an absolute S&P close-to-close move **above** the July baseline. Registered as **FT-independence-day-market-closure-2027-07-05-1** (base rates disclosed: 9 of 15 pooled, 5 of 7 in the matching configuration) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-07-05. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Fri 2027-07-02) — read the sibling's row, which owns this session.**
  [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md), published hours before
  this one today, establishes it: a **full** 09:30–16:00 ET equity session, SIFMA's **14:00 ET**
  recommended fixed-income close, and the **June Employment Situation** at 08:30 ET
  (`jobs-2027-07-02`, `estimate`, derived — proposed by that lane, not duplicated here). This
  session reached the equity leg independently off the same NYSE footnote list and **agrees**; the
  finding is theirs, the replication is this ledger's contribution to it. A timing caution, never a
  signal.
- **The corridor is five sessions and front-loaded.** Wed **2027-06-30** carries three tracked
  events at once — [`fomc-minutes-2027-06-30`](fomc-minutes-2027-06-30.md),
  [`russell-style-quarter-end-capping-effective-2027-06-30`](russell-style-quarter-end-capping-effective-2027-06-30.md)
  and [`sp-select-sector-secondary-reweight-2027-06-30`](sp-select-sector-secondary-reweight-2027-06-30.md)
  — then Thu 07-01 and Fri 07-02 are Q3's first two sessions before the tape shuts for three days.
- **Explicitly refused (measured, then year-controlled).** There is no tradeable July-4 reopening
  effect in *either* direction. The absence of a premium is real on the widest sample available
  (**0.86×**, n=15) but the same seven July-4-on-Sunday years depress **every** long weekend's
  reopening (**0.87×** pooled across Memorial/Labor/Presidents/MLK, n=25), so the effect is
  underpowered and partly a year draw. Do not build on it, and do not import Memorial Day's
  **1.33×** into July either.
- **Also refused — the VIX weekend rebound.** Fri→Tue VIX rises a mean **+9.76%** across the five
  July-4-Sunday weekends with VIX data, up in 4 of 5 — nominally the largest of any long weekend the
  sibling ledger measured (Memorial +5.43%, Labor +5.84%, MLK +5.85%, Presidents +5.16%). **n=5.**
  Recorded so the next session does not rediscover it as a signal.
- **Watch (dated):** quarter-end triple **2027-06-30** (est) · June payrolls **2027-07-02** (est,
  derived) · SIFMA bond close 14:00 ET **2027-07-02** (est) · **NYSE closed 2027-07-05** (est) ·
  reopening **2027-07-06**.

## Initial research

### The question, plainly

This closure reached the calendar as a single proposal filed in-sweep by
[`sifma-bond-market-closure-2027-11-11`](sifma-bond-market-closure-2027-11-11.md), which was candid
that 2027-07-05 sat **D-129 outside its own corridor** and left four limits open. So there are two
questions, and the second is the one worth the session:

1. Is the date right, and can the proposal's open limits be closed?
2. **Does a July-4 closure behave like the other long weekends this calendar has already measured?**
   The sibling [`memorial-day-market-closure-2027-05-31`](memorial-day-market-closure-2027-05-31.md)
   established a **generic three-day-weekend reopening premium** (Memorial 1.27×, Labor 1.36×,
   Presidents 1.20×, MLK 1.09× on its data) and refused to trade it. The obvious next move is to
   assume it transfers to July. That assumption is exactly what this session tested.

**One-line verdict.** The date is right on three first-hand primaries (and the proposal's cited
*mechanism* was wrong — it is **E.O. 11582 §3(a)**, not 5 U.S.C. §6103); the assumption does **not**
transfer — **July 4 is the one Monday closure with no reopening premium** (0.86× the July baseline
on n=15, versus 1.16×–1.38× for the other four) — and a year-control shows the effect is too
underpowered to trade in either direction.

**And one thing this session set out to claim, it instead corroborated.** The pre-holiday side of
the corridor — Friday 2027-07-02's full equity session, 14:00 ET bond close and payrolls print — was
published **hours earlier the same day** by [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md),
whose canonical file and ledger landed on `main` while this session was measuring. Both sessions read
the same NYSE footnote list first-hand and reached the same answer independently, and that lane
derived the payrolls date on a **7-for-7** validation against this one's 4-for-4. The finding is
theirs; this ledger records the replication, drops the duplicate proposal it had drafted, and keeps
only the far side of the closure, which nobody had measured.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols:
[]`, so no symbol-keyed instrument applies and neither `earnings-cycle.mjs` nor `intraday-edges.mjs`
has a macro mode. Their discipline (*re-source, don't recall*) was honoured literally: every figure
below is this session's own arithmetic on raw daily bars, and the pipeline was validated against the
sibling ledger's published numbers before anything new was believed.

**Primaries fetched raw and parsed this session (2026-09-09):**

- **NYSE** `nyse.com/markets/hours-calendars` — **HTTP 200 after its 302, 109,180 bytes** with
  `curl -L` and a browser user-agent. 133 `"text"` cells extracted and read cell-by-cell.
- **SIFMA** `sifma.org/resources/general/holiday-schedule` — **HTTP 200, 299,159 bytes**; the 2027
  US panel is a hidden tab the rendered text drops, so 109 holiday cards were decoded out of the
  page's own RSC payload, the method the sibling entries document.
- **Office of Law Revision Counsel** `uscode.house.gov` 5 U.S.C. §6103 — **HTTP 200, 170,883
  bytes**; subsection (a), subsection (b) and the page's **Executive Documents** section (E.O.
  11582) all extracted verbatim.
- **Cboe** `cdn.cboe.com/api/global/us_indices/daily_prices/SPX_History.csv` (**HTTP 200, 13,029
  daily closes, 1975-01-02 → 2026-09-08**) and `.../VIX_History.csv` (**HTTP 200, 9,268 bars,
  1990-01-02 → 2026-09-08**). These are the **index publisher's own** files, a primary rather than
  the vendor mirror the sibling used — see leg 3 for why that matters here.
- **Attempted and failed, recorded rather than worked around:** `bls.gov/schedule/news_release/2027_sched.htm`
  (**403** with a browser user-agent — the same block [`ppi-2026-11-13.md`](ppi-2026-11-13.md) and
  the Memorial Day sibling each recorded); Yahoo `query1` **and** `query2` chart endpoints for
  `^GSPC` (**429 on all 8 attempts across both hosts, with backoff**) — the sibling's data route is
  simply unavailable to this runner today; `stooq.com` CSV (**served a JavaScript proof-of-work
  challenge instead of data**, not defeated). All four are in `probe-ref.blocked`.

### Conviction legs, tested

1. **The date is right, rests on three first-hand primaries, and validates against the tape —
   SUPPORTED (and still `estimate`).** NYSE's grid states *"All NYSE markets observe U.S. holidays
   as listed below for 2026, 2027, and 2028"*; under the header `Holiday | 2026 | 2027 | 2028` the
   Independence Day row parses exactly as `Friday, July 3 (Independence Day observed)` /
   **`Monday, July 5 (Independence Day observed)`** / `Tuesday, July 4**`. SIFMA's 2027 US panel
   independently carries `U.S. Independence Day | Monday, July 5, 2027 | Early Close (2:00 p.m.
   Eastern Time): Friday, July 2, 2027`. **Checked against the tape:** in the seven July-4-on-Sunday
   years Cboe's SPX file covers (1976, 1982, 1993, 1999, 2004, 2010, 2021), **7 of 7** have no
   July 5 bar, and all seven have July 1, July 2 and July 6 bars — the closure is exactly one
   session and the Friday and Tuesday around it trade. **Why it stays `estimate`:** the prefix
   taxonomy in `market-events-data.ts` has no slot for an exchange holiday calendar or a trade
   association's recommendations, and this lane may not self-confirm. The label is about the
   taxonomy, not the evidence — and since every honest call here is a stand-aside, it costs nothing.

2. **The proposal's cited statutory mechanism is WRONG, and the correct one is narrower —
   REFUTED, with the receipt on the same page.** The superseded proposal wrote that the observance
   *"follows mechanically from 5 U.S.C. 6103, which moves a Sunday federal holiday to the following
   Monday."* §6103(a), read verbatim today, says only: *"Independence Day, July 4."* §6103(b)(1)
   moves a **Saturday** holiday to *"the Friday immediately before"*; §6103(b)(2) moves a holiday
   falling on a non-Mon–Fri worker's regular non-workday to *"the workday immediately before"*.
   **There is no Sunday→Monday rule anywhere in §6103.** It is **Executive Order 11582, Feb. 11,
   1971, 36 F.R. 2957**, set out in the OLRC page's own Executive Documents section, §3(a): *"Any
   employee whose basic workweek does not include Sunday … shall be excused from work on the next
   workday of his basic workweek whenever a holiday falls on Sunday."* And the sharper half: that
   EO binds **federal employees**, not exchanges. The NYSE is shut on 2027-07-05 because the NYSE
   says so, and the statute is corroboration for *why the observance shifts*, never the reason the
   tape is dark. Leg 1's evidence is unaffected; only the citation changes.

3. **The pipeline is validated against the sibling before use, on a different vendor — SUPPORTED,
   and this is the reason to believe legs 4–8.** Yahoo 429'd, so this session used Cboe's own index
   files. Two independent checks that the substitution is safe. **(a) Level:** Cboe's SPX close for
   **2026-09-04 is 7,718.60** and its VIX close **14.53** — *identical to the cent* to the readings
   [`memorial-day-market-closure-2027-05-31`](memorial-day-market-closure-2027-05-31.md) pulled from
   Yahoo. **(b) Construction:** re-running the sibling's Memorial Day control on Cboe bars for
   **1975–2026 (n=52)** returns pre-holiday Friday **0.608%**, reopening **0.903%**, May baseline
   **0.681%** — against its Yahoo/1971–2026 figures of 0.612%, 0.865% and **0.680%**. Two vendors,
   two start years, a May baseline agreeing **to a thousandth of a percentage point**. The decoder
   is validated; what follows is new measurement on a validated pipeline.

4. **July 4 does not carry the long-weekend reopening premium — SUPPORTED as a measurement, and it
   is this document's contribution.** Restricting to the seven July-4-on-Sunday years, and using the
   July all-session baseline of **0.654%** (n=1,099, 1975–2026):

   | Session | Mean abs. S&P move | vs July baseline |
   |---|---|---|
   | Pre-holiday Friday (07-02) | **0.637%** | 0.97× |
   | **Post-holiday reopening (07-06)** | **0.521%** | **0.80×** |

   The reopening is **0.82×** the pre-holiday Friday and larger than it in only **4 of 7** years.
   Set beside the same construction on Cboe bars for the other four Monday closures — **Memorial
   1.33×, Labor 1.38×, Presidents 1.25×, MLK 1.16×** — July 4 is not mid-pack; it is the only one
   **below** its own month's baseline. That is the opposite of what importing the sibling's finding
   would have predicted.

5. **…and the year-control takes most of it back — MIXED, and disclosed rather than buried.**
   Applying the identical construction to the other four holidays **restricted to those same seven
   years** collapses their premium too:

   | Closure, in the 7 July-4-Sunday years | n | Pre-Fri | Reopening | Reopening / month baseline |
   |---|---|---|---|---|
   | Memorial Day | 7 | 0.707% | 0.530% | **0.78×** |
   | Labor Day | 7 | 1.005% | 0.722% | **0.97×** |
   | MLK Day | 4 | 1.263% | 0.715% | **0.96×** |
   | Presidents Day | 7 | 0.644% | 1.013% | 1.42× |
   | **Pooled (other four)** | **25** | **0.862%** | **0.749%** | reopening / pre = **0.87×** |

   Against an all-years reopening/pre of **1.41×–1.50×** for those same holidays, the pooled 0.87×
   says plainly: **in these particular years, long-weekend reopenings were quiet generally.** (The
   seven years' full-year mean absolute move is **0.672%** against a **0.733%** full-sample mean —
   0.92×, quiet but not dramatically so, so the year effect is about reopenings more than about
   volatility overall.) Leg 4 therefore cannot be read as a July-4 property on its own evidence.

6. **Widening the sample past the quiet years leaves the absence standing — SUPPORTED, weakly.**
   The Friday→Tuesday gap shape does not require July 4 to be a Sunday: it also arises when July 4
   *is* a Monday. Pooling both gives **15 closures (1976, 1977, 1982, 1983, 1988, 1993, 1994, 1999,
   2004, 2005, 2010, 2011, 2016, 2021, 2022)**, eight of them outside leg 5's depressed set:
   pre-holiday Friday **0.622%**, reopening **0.560%** — **0.86×** the July baseline, **0.90×** the
   Friday, and larger than the Friday in **8 of 15**, a coin flip. So the absence survives the year
   control; what it does not survive is a power test. **n=15 cannot distinguish 0.86× from 1.00×**,
   and this document does not pretend otherwise. The honest output is a **refusal to import** the
   sibling's premium into July, not a claim that July inverts it.

7. **The apparent effect is not an early-July seasonal artefact — SUPPORTED (negative control).**
   July is the year's quietest month by mean absolute move (Jan 0.747, Feb 0.714, Mar 0.822, Apr
   0.758, May 0.681, Jun 0.659, **Jul 0.654**, Aug 0.703, Sep 0.745, Oct 0.887, Nov 0.763, Dec
   0.663), which is why every ratio above is taken against July's own baseline rather than the
   annual one. Within July there is no further hole: **July 1–10 runs 0.663%** (n=320) against
   **July 11–31 at 0.650%** (n=779). The reopening's shortfall is not the calendar month doing the
   work.

8. **The VIX weekend rebound is the largest measured and the least believable — REFUTED as a
   finding.** Fri→Tue: 1993 **+22.42%**, 1999 **+11.09%**, 2004 **+7.76%**, 2010 **−1.56%**, 2021
   **+9.09%** — mean **+9.76%**, up in **4 of 5**. Nominally that is roughly double every figure the
   sibling measured (Memorial +5.43% over 37 years, Labor +5.84%, MLK +5.85%, Presidents +5.16%).
   **It rests on five observations, one of which (+22.42%, 1993) is a third of the mean**, and VIX
   data begins in 1990 so the sample cannot be extended backwards. Recorded, refused, not built on.

9. **This closure and the Memorial Day closure are the same calendar object — SUPPORTED, by
   arithmetic.** July 4 and May 31 are **34 days apart = 4 weeks + 6 days**, so July 4 falls on a
   Sunday in exactly the years Memorial Day (the last Monday in May) falls on **May 31**. Computed
   for **1971–2035** the two year-sets are **identical**: 1971, 1976, 1982, 1993, 1999, 2004, 2010,
   2021, **2027**, 2032. That is why leg 5's control is available at all — the sibling's "8 of 56
   collision years" and this ledger's seven are the same years — and it means **any future finding
   about one of these two closures is a finding about the same sample as the other**. Worth stating
   plainly so no later session treats them as independent evidence.

10. **The 07-02 stack is real, and it is a SIBLING'S finding this session independently replicated —
    SUPPORTED, credited, not claimed.** Three things land on Friday **2027-07-02**. *(a)* **A full
    equity session.** NYSE's early-close footnotes, extracted here today, name exactly three
    occasions across 2026–2028: *"Monday, July 3, 2028"*, the day after Thanksgiving in *"2026 …
    2027 … 2028"*, and *"Thursday, December 24, 2026"*. **No July-2-2027 early close exists** — and
    the rule this implies is consistent: NYSE shortens the day *before* July 4 only when that day
    **is July 3**, which in 2027 it is not. *(b)* **A 14:00 ET recommended bond close**, from
    SIFMA's own 2027 US card. *(c)* **The June Employment Situation**, derived to 2027-07-02 — BLS
    403s to this runner, so the date is computed from BLS's published convention (third Friday after
    the Sun–Sat reference week containing the 12th; June 2027's is 06-06…06-12, giving 06-18, 06-25,
    **07-02**), a rule this session validated **4 of 4** against `jobs-2026-09-04`,
    `jobs-2026-10-02`, `jobs-2026-11-06` and `jobs-2026-12-04` before using it.
    **Attribution, plainly.** All three legs were published earlier the same day by
    [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md) — which merged to
    `main` mid-session — on the identical NYSE footnote read, the identical SIFMA card, and a
    payrolls derivation validated **7 of 7** (it added the three historical Sunday-July-4 releases
    this session did not check). Its work is strictly stronger, and it had already filed
    `proposals/jobs-2027-07-02.from-sifma-bond-early-close-2027-07-02.json`. **This session
    therefore deleted the competing proposal it had drafted** rather than file a second path for one
    event. What survives here is the **replication**: two lanes, same day, same primaries, no shared
    intermediate, same conclusion — which is worth more to the next reader than a second copy of the
    claim would have been. It also closes the superseded proposal's open limit 2 twice over.

11. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
    of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|independence|july 4|closure|half-day|early close` returns **zero hits in both**, run
    this session. No playbook can fire on this date in either direction. Regime anchors read today:
    **SPX 7,673.52**, **VIX 15.72** (2026-09-08 closes, Cboe) — against the sibling's 2026-09-04
    readings of 7,718.60 and 14.53 that is **−0.58%** on the index and **+1.19** VIX points, **no
    regime shift**, and the probe baseline above is set with real readings.

### What the conditions support (date `estimate` — caution only, never an entry)

**No direction, no size, no level.** Two operative items and three refusals:

- **One session is named, and it is neither the holiday nor this ledger's to own.** **2027-07-02**
  carries a derived 08:30 ET payrolls print, a 14:00 ET recommended bond close and a full equity
  session, with a three-day weekend behind it — established by
  [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md) and replicated here.
- **The corridor is front-loaded on 06-30**, which already holds three tracked events (FOMC minutes,
  Russell style-capping effective, S&P select-sector secondary reweight) on a quarter-end Wednesday.
- **Refused: importing the long-weekend reopening premium into July** — measured at 0.86× the July
  baseline on the widest sample, versus 1.16×–1.38× elsewhere.
- **Refused: trading the absence** — the year-control (0.87× pooled across the other four holidays
  in these same years) and n=15 both forbid it.
- **Refused: the VIX weekend rebound** (+9.76%, n=5, one observation carrying a third of the mean).

### Honest limits

- **Leg 6's n is 15 and no power calculation is offered.** A 14% shortfall against baseline on 15
  observations of a high-variance quantity is not a result; it is an absence of evidence for the
  premium, which is a weaker and different thing from evidence of absence. This document's call is
  the refusal to import, and nothing stronger.
- **Legs 4 and 5 share their sample with the Memorial Day ledger by construction (leg 9).** The two
  documents are not independent confirmations of anything about long weekends. Any later session
  pooling them is double-counting the same seven years.
- **Leg 10 is a replication, not a discovery, and the timing was luck.**
  [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md) merged to `main`
  partway through this session; had it merged an hour later, this ledger would have filed a
  duplicate `jobs-2027-07-02` proposal and presented the 07-02 stack as its own. Two lanes reading
  the same primaries on the same day is the system working, but the near-miss is worth recording:
  a session's "finding" is only new relative to `main` **as of the moment it checks**, and this one
  checked late.
- **The data starts in 1975, so 1971 is missing** — the sibling's samples reach back four years
  further, which is why its Memorial Day figures and this session's differ slightly (leg 3).
  Neither is more correct; they are different windows.
- **Cboe's `VIX_History.csv` carries rows on days the SPX file has none** — 28 of them since 2023,
  every one a market holiday (2026-09-07 among them). Every VIX figure here is keyed off SPX session
  dates for that reason; a study that keyed off the VIX file's own dates would silently read
  holiday rows.
- **The payrolls date is derived, not read.** BLS 403s to this runner with a browser user-agent and
  publishes no 2027 schedule reachable here. The rule reproduces 4 of 4 on 2026, which is the
  strongest check available and not a substitute for the published schedule. It is filed `estimate`
  and licenses nothing.
- **Two of SIFMA's own cards disagree about the date, and only one is a recommendation.** The 2027
  panel decoded today carries both `U.S. Independence Day | Monday, July 5, 2027 | Early Close …
  Friday, July 2, 2027` and a separate card reading `U.S. Independence Day | Sunday, July 4, 2027`
  with no note. Card-to-panel attribution by payload offset fails on this page (the sibling recorded
  the same), so cards are identifiable by holiday name only; the Monday card is the one carrying a
  recommendation and is the one used. Recorded rather than silently resolved.
- **Nasdaq, CME and Treasury settlement behaviour on 2027-07-05 are still not asserted** — the
  proposal's limit 3 stays open. Only NYSE and SIFMA were read.
- **Volume was not measured.** Cboe's index files carry no volume column and Yahoo was unavailable,
  so the intuitive "thin pre-holiday tape" claim is **not** tested here in either direction.

## Stance & kill switches

**Stance (2026-09-09; date `estimate`, and every trading-adjacent statement below carries that
label).** **Stand aside on the closure, and treat Friday 2027-07-02 as the only session in the
corridor worth writing down.** The contribution is a **refusal to import**: the sibling ledger
established a generic three-day-weekend reopening premium and refused to trade it, and the natural
next step — assuming it holds in July — is wrong. Across the **15** Independence-Day closures since
1975 that produce a Friday→Tuesday gap, the reopening runs **0.560%** against a **0.654%** July
baseline (**0.86×**) and out-moves the pre-holiday Friday in **8 of 15**, while Memorial Day runs
**1.33×**, Labor Day **1.38×**, Presidents Day **1.25×** and MLK **1.16×** on identical construction
and the same vendor. **But the absence is not tradeable either:** restricted to the seven
July-4-on-Sunday years, the other four holidays' own reopening premium also collapses (**0.87×**
pooled, n=25), so part of leg 4 is a quiet-year draw, and n=15 has no power to separate 0.86× from
1.00×. Both directions are refused, deliberately.

**The pre-holiday side is a sibling's row, and this ledger defers to it.** Friday **2027-07-02** —
a **full** NYSE session, SIFMA's **14:00 ET** recommended fixed-income close, and the **June
Employment Situation** at 08:30 ET — was established earlier the same day by
[`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md), which merged mid-session.
This session reached the equity and payrolls legs independently from the same primaries and **agrees**;
it deleted the duplicate `jobs-2027-07-02` proposal it had drafted, and records the replication
instead of restating the claim. For what it is worth on the volatility question, which that ledger
did not ask: the pre-holiday Friday measures **0.637%** against a 0.654% July baseline, **0.97×** —
unremarkable, so the stack stays an **execution** note.

**Two source facts are this ledger's own.** The Sunday→Monday observance is **E.O. 11582 §3(a)**,
not 5 U.S.C. §6103 — and it binds federal employees rather than exchanges, so the NYSE grid is the
load-bearing source and the statute is only the reason the date moves. And July 4 falls on a Sunday
in **exactly** the years Memorial Day falls on May 31 (identical year-sets 1971–2035), which makes
this closure and [`memorial-day-market-closure-2027-05-31`](memorial-day-market-closure-2027-05-31.md)
one sample rather than two. **No directional call, no size, `symbols: []`.**

**Kill switches:**

- **Date kill:** NYSE republishing its holiday grid with a different 2027 Independence Day, or the
  revocation of E.O. 11582 §3(a). No mechanism for either exists (the closure reproduces 7 of 7
  against the tape in the covered years); listed for completeness.
- **Structure kill (narrowed to this ledger's own leg):** **NYSE publishing an early close on
  2027-07-02**, or making 2027-07-05 a trading session. Registered as
  **FT-independence-day-market-closure-2027-07-05-2**, score by **2027-07-02**; re-check each pulse,
  since the failure path is a *republication*, not the passage of time. The bond-close and payrolls
  legs are deliberately **not** re-registered here —
  [`FT-sifma-bond-early-close-2027-07-02-2`](../forward-tests/sifma-bond-early-close-2027-07-02.md)
  already tests the BLS date, and duplicating it would inflate the register's n on one fact.
- **Refusal kill (the measured one):** the reopening session **2027-07-06** printing an absolute S&P
  close-to-close move **above** the July baseline. Registered as
  **FT-independence-day-market-closure-2027-07-05-1**, score by **2027-07-07**; base rates disclosed
  (9 of 15 pooled, 5 of 7 in the matching configuration).
- **Genericness kill:** a re-run of leg 6 on a later data cut showing the July-4 reopening ratio
  converging on the 1.16×–1.38× band the other four closures occupy. Leg 6 is a *relative* claim
  and dies if the relation closes.
- **Sample-independence kill (leg 9):** any future finding that treats this closure and
  [`memorial-day-market-closure-2027-05-31`](memorial-day-market-closure-2027-05-31.md) as
  independent samples. They are the same years by arithmetic, permanently.
- **Corridor kill:** `jobs-2027-07-02` failing to land on 07-02, or
  [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md) moving — the stack
  loses two of its three legs and only the full equity session survives. Tracked on that lane's own
  ledger, not re-tested here.
- **Relevance kill (the good one):** a house playbook that keys on holiday-adjacent sessions being
  written and back-tested. Leg 11 goes stale and the stand-aside must be re-argued on measured
  performance rather than on absence.

**Two forward tests registered** in
[`forward-tests/independence-day-market-closure-2027-07-05.md`](../forward-tests/independence-day-market-closure-2027-07-05.md)
— **-1** (the measured refusal: 2027-07-06 prints at or below the July baseline, base rates
disclosed and mildly in favour, score by 2027-07-07) and **-2** (narrowed to the NYSE equity leg
alone: a full, un-shortened 2027-07-02 session, score by 2027-07-02). No price-direction test is
registered: `symbols: []`, the stance takes no position, and a refusal is not a prediction about
level. **No new calendar entry is proposed.** The corridor's one untracked dated item —
`jobs-2027-07-02` — was derived independently here and found already proposed by
[`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md) on a stronger 7-of-7
validation; this session's drafted duplicate was deleted rather than filed as a competing path.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-299 | **Initial research; canonical file written from the single proposal on file** ([`sifma-bond-market-closure-2027-11-11`](sifma-bond-market-closure-2027-11-11.md)'s, read in full first). **Date triple-primaried first-hand today:** NYSE grid **HTTP 200, 109,180 B** — Independence Day row = `Friday, July 3 / **Monday, July 5** / Tuesday, July 4**` (2026/27/28); SIFMA 2027 US card `U.S. Independence Day \| Monday, July 5, 2027 \| Early Close (2:00 p.m. ET): Friday, July 2, 2027`; tape check **7 of 7** covered years have no 07-05 bar. **CORRECTION to the proposal:** the Sunday→Monday shift is **E.O. 11582 §3(a)** (36 F.R. 2957), *not* 5 U.S.C. §6103, whose (a) reads only *"Independence Day, July 4."* and whose (b)(1) covers Saturday→Friday — and the EO binds federal employees, not exchanges. **Pipeline re-vendored and validated:** Yahoo **429 ×8** (both hosts), stooq served a JS challenge → Cboe's own `SPX_History.csv` (13,029 bars, 1975→) and `VIX_History.csv`; Cboe's 2026-09-04 SPX **7,718.60** / VIX **14.53** match the Memorial Day sibling's Yahoo readings to the cent, and its Memorial Day control (1975–2026, n=52) returns **0.608% / 0.903% / 0.681%** vs the sibling's 0.612% / 0.865% / **0.680%**. **Headline:** **July 4 is the one Monday closure with no reopening premium** — the seven 07-04-on-Sunday years run reopening **0.521%** = **0.80×** a **0.654%** July baseline (0.82× the pre-Friday, bigger in 4/7) against **Memorial 1.33×, Labor 1.38×, Presidents 1.25×, MLK 1.16×**. **Year-control takes most of it back:** those same four holidays run **0.87×** reopening/pre when restricted to these seven years (n=25) vs 1.41–1.50× all-years, and the seven years' full-year mean is 0.672% vs a 0.733% sample mean. **Widening survives it, weakly:** all 15 Fri→Tue July-4 closures 1975–2026 give reopening **0.560% = 0.86×** baseline, bigger than the Friday in **8/15** — so the output is a **refusal to import**, not an inversion to trade. **Not a seasonal artefact:** July 1–10 **0.663%** vs July 11–31 **0.650%**. **VIX Fri→Tue +9.76%, up 4/5** — nominally double every long weekend the sibling measured, **n=5**, refused. **Leg 9 (new, arithmetic):** July 4 falls on a Sunday in exactly the years Memorial Day falls on May 31 (34 days = 4wk+6d) — identical year-sets 1971–2035 — so this closure and [`memorial-day-market-closure-2027-05-31`](memorial-day-market-closure-2027-05-31.md) are **the same calendar object** and never independent evidence. **07-02 stack REPLICATED, NOT CLAIMED:** full NYSE session (early-close footnotes name only 2028-07-03, the day after Thanksgiving, 2026-12-24) + SIFMA **14:00 ET** bond close + **June payrolls**, derived here from BLS's published rule after validating it **4/4** against `jobs-2026-09-04/10-02/11-06/12-04` — all three legs were published earlier today by [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md), which merged to `main` mid-session on the same primaries and a **7/7** payrolls validation. **This session deleted the duplicate `jobs-2027-07-02` proposal it had drafted**; two lanes agreeing independently on the same day is recorded as a replication and nothing is re-filed. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** `bls.gov` 2027 schedule **403** with a browser UA (recorded, not worked around) → payrolls derived, `EST:`. **Volatility:** SPX **7,673.52**, VIX **15.72** (2026-09-08, Cboe) vs the Memorial Day ledger's 7,718.60 / 14.53 → **−0.58% / +1.19 pts, no regime shift**; probe baseline set with real readings. **Geopolitical:** none touching a `symbols: []` closure. **Corridor (±5d):** [`fomc-minutes-2027-06-30`](fomc-minutes-2027-06-30.md), [`russell-style-quarter-end-capping-effective-2027-06-30`](russell-style-quarter-end-capping-effective-2027-06-30.md), [`sp-select-sector-secondary-reweight-2027-06-30`](sp-select-sector-secondary-reweight-2027-06-30.md) (all D-5), [`sifma-bond-early-close-2027-07-02`](sifma-bond-early-close-2027-07-02.md) and `jobs-2027-07-02` (both D-3) — **no new entry proposed**, every dated item found is already tracked. Playbook grep re-run: **0 hits in both** files. | Initial stance set: **stand aside** (structural row only) — the Memorial Day ledger's long-weekend premium **does not transfer to July**, and the absence is **not tradeable either** after the year-control. Registers **FT-…-1** (the refusal) and **FT-…-2** (narrowed to the NYSE equity leg, the bond/payrolls legs left to the sibling's register). | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-independence-day-market-closure-2027-07-05.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
