# US markets closed — Labor Day (compresses the September coupon block into a four-session week — the instance immediately after 2026, not 2031) — labor-day-market-closure-2027-09-06

**Kind:** sector · **Date:** 2027-09-06 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` 2027 column + SIFMA's 2027 US panel, both fetched direct this session, reproduced by 5 U.S.C. 6103; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-blackout-start-2027-09-04"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and take one correction with you, because it changes when a live question
gets answered rather than what to do today.** The [2026 twin](labor-day-market-closure-2026-09-07.md)
established that Labor Day compresses the September Treasury coupon block into a four-session week
whenever the holiday falls on Sep 6 or 7, measured its five prior instances, found **no demand
degradation**, and closed by saying the structure "returns … next in **2031** and **2032**."
Computed cold here for 1993–2040, **2031's Labor Day is September 1** — not a compressed year at all
— and **the true next instance is 2027, this event**, 12 months later rather than five years. That
matters because the twin's own null was registered at **n=5** and explicitly limited by it; the
sample reaches **n=7 by September 2027**, in back-to-back years. **The second finding is a
subtraction from the twin's headline.** Its $304B single-session stack was read as a compression
effect; measured here against a same-year Tuesday control, the Tuesday-after-Labor-Day slate runs
**1.77× a median Tuesday in the twelve NON-compressed years** against **2.11× in the six compressed
ones**, and the coupon leg was **$58B of $304B (19%)** — so the displacement is a *Monday-holiday*
effect that fires every Labor Day, and compression adds one coupon on top of it, not the stack.
Nothing here is tradeable: `symbols: []`, `impact: low`, date is `estimate`, the playbook grep
returns **0 and 0** re-run today, and the session itself is closed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-365) | **Stand aside** — a closed session 365 days out has nothing to size | High | `symbols: []`, `impact: low`, and `grep -icE 'holiday\|labor day\|closure\|half-day\|early close'` over `trade-playbooks.md` + `multi-symbol-sweep.md` returns **0 and 0**, run this session | A house playbook keyed on holiday-adjacent sessions written and back-tested before **2027-09-06** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **No action — this week's load is the 2026-09-16 FOMC, and the twin's own live instance on 2026-09-08** | High | A D-365 closed session on an `estimate` date cannot compete with an SEP meeting ten days out; the only thing this week that touches *this* doc is the 2026 twin's forward tests scoring | Nothing at this distance. The first input that could move this ledger is the twin's **FT-labor-day-market-closure-2026-09-07-2** scoring on **2026-09-10** |
| This month | **Watch the twin score, because this event is its next instance and not a distant one** | Medium | The twin's compression null (n=5) scores its first live counter-check on **2026-09-09** (10Y reopening bid-to-cover vs 2.35). A kill there makes 2027 the confirming or refuting sixth instance twelve months later, not a 2031 problem | The **2026-09-09** 10Y reopening printing bid-to-cover **below 2.35** — the null acquires its first counter-instance and this ledger's "n reaches 7 by 2027" framing becomes a live re-argument rather than a bookkeeping note |
| This quarter | **Do not carry the "$304B because of compression" reading forward** (`estimate` — a planning refusal, never an entry) | Medium | Measured: the Tuesday-after-Labor-Day stack is **1.77×** a same-year median Tuesday in the 12 non-compressed years and **2.11×** in the 6 compressed ones; the coupon leg was **19%** of 2026's $304B. Most of the stack is Monday bills moving, which happens with or without compression | Treasury's **2027-09-07** slate publishing with a coupon share **at or above 30%** of the session's total offering, which would put the compression leg back at the centre of the stack. Registered as **FT-labor-day-market-closure-2027-09-06-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never on the date itself.** No entry, exit or hedge keys to 2027-09-06: it is a closed session,
  and the entry is `estimate`, which licenses nothing regardless.
- **The correction to carry, stated so it is not re-derived wrong a third time:** compressed
  Septembers are **2009, 2010, 2015, 2020, 2021, 2026, 2027, 2032, 2037, 2038**. 2031 is not one
  (Labor Day falls **September 1**), and 2026→2027 is a back-to-back pair, as 2009/2010 and
  2020/2021 were.
- **Project the 2027 block to Tue 09-07 / Wed 09-08 / Thu 09-09, not the following week.** In all
  **6 of 6** compressed years the 3Y priced on the Tuesday after the holiday; in all **12** normal
  years the block sat in the *following* week (Sep 9–12). Rule-derived — no 2027 Treasury schedule
  exists.
- **Explicitly refused (measured, not argued) — the supply-stack framing.** The displaced Monday
  bill slate lands on the Tuesday after **every** Labor Day. Compression adds a coupon, not a stack.
- **Explicitly refused (measured, not argued) — the "Sep-6 Labor Days are different" split.** The
  five Sep-6 instances (1993, 1999, 2004, 2010, 2021) are **5/5 VIX-up on reopen** with median
  **+1.740** against **+0.680** for all 33 Labor Days. It is noise: at the ordinary-weekend base
  rate of **61%**, five-for-five happens **8.6%** of the time by chance (**13.7%** at the VIX<15
  conditional rate of 67%). Do not size it.
- **Also already refused upstream, and not re-manufactured here** — the blackout framings. Labor Day
  sits inside the **2027-09-04 → 09-16** gate, whose first three calendar days therefore hold zero
  sessions and whose length is **8** sessions;
  [`fomc-blackout-start-2027-09-04`](fomc-blackout-start-2027-09-04.md) measured both as routine
  (5 of 21 September gates contain Labor Day; 4 of 19 run 8 sessions).
- **No cross-asset schedule asymmetry, verified rather than assumed.** SIFMA's 2027 panel gives
  Labor Day an **empty** note where Good Friday and Memorial Day 2027 both carry explicit
  `Early Close (2:00 p.m. ET)` notes on the same page, and NYSE lists **no** September early close
  in 2026, 2027 or 2028. Friday **2027-09-03** is a full session in both markets.
- **Watch (dated)** — twin's FT-1 scores **2026-09-09** · twin's FT-2 scores **2026-09-10** ·
  FOMC + SEP **2026-09-16** · FOMC **2027-07-27/28** (est — the trigger that confirms the September
  2027 meeting and with it this corridor) · Treasury's August 2027 refunding statement (est. early
  **2027-08**, the first document that can date the 2027 block) · gate opens **2027-09-04** ·
  **NYSE closed 2027-09-06** · projected block **2027-09-07/08/09** · decision **2027-09-15** (est).

## Initial research

### The question, plainly

This event arrived as a proposal from the [`fomc-blackout-start-2027-09-04`](fomc-blackout-start-2027-09-04.md)
adjacency sweep, framed on the blackout: Labor Day sits inside the gate, so the gate's first three
calendar days hold no trading sessions and it runs 8 sessions rather than 9. That framing was
already refused by the ledger that raised it — both facts measured routine. So the honest question
for this file is different: **is there anything left once the blackout angle is subtracted, and does
the 2026 twin's compressed-coupon-week analysis transfer to 2027 or not?**

**One-line verdict:** the blackout angle is genuinely empty, but the twin's analysis transfers with
**two corrections that matter more than the transfer** — the twin's stated recurrence is wrong
(2027, not 2031, is the next instance, so its own n=5 null resolves in months rather than years),
and the twin's headline supply figure is mostly a Monday-holiday displacement effect rather than a
compression effect.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Nothing was inherited from the proposal or from
the twin: every date claim was re-fetched and every statistic recomputed.

- **NYSE holiday calendar, primary:** `nyse.com/markets/hours-calendars`, fetched direct
  2026-09-06, **HTTP 200, 109,180 bytes**. Note for the family: this endpoint served this runner
  cleanly, where [`memorial-day-market-closure-2027-05-31`](memorial-day-market-closure-2027-05-31.md)
  recorded three consecutive 403s on 2026-09-05 — the block is intermittent, not permanent.
- **SIFMA holiday recommendations, primary:** `sifma.org/resources/general/holiday-schedule`,
  fetched direct 2026-09-06, **HTTP 200, 298,899 bytes**, read out of the page's embedded payload.
- **Treasury auction record, primary:** `api.fiscaldata.treasury.gov` `auctions_query`, fetched
  direct 2026-09-06, **HTTP 200**, **6,020 rows** spanning 2009-01-05 → 2026-09-10. Used for every
  September coupon-block date, for the Tuesday-after-Labor-Day offering totals, and for the
  same-year Tuesday control.
- **Yahoo split/dividend-adjusted daily bars** via this repo's `scripts/research/market-data.mjs`,
  **instrument cache busted first** per the process doc: `SPY` 8,458 bars → 2026-09-04, `^VIX`
  9,238, `^TNX` 9,206, `^GSPC` 9,237. Every reopen statistic is computed from those bars.
- **Provenance check, run before anything was claimed:** this session's reconstruction reproduces
  the twin's headline numbers exactly — 33 Labor Days, **82% (27/33)** VIX-up, median ΔVIX
  **+0.680**, mean |Δ10Y| **6.50bp** vs **3.77bp** for an ordinary Friday→Monday (n=1,650). The
  corrections below are therefore corrections to the *reasoning*, not artefacts of a different
  dataset.
- **Computed, not sourced:** every Labor Day 1993–2040 by first-Monday arithmetic; the 2027 gate's
  session count; all binomial probabilities.
- **Re-grepped this session:** `docs/plans/trade-playbooks.md` and
  `docs/research/multi-symbol-sweep.md` for holiday/closure keying.
- **Not obtainable, and stated rather than guessed:** there is no published 2027 Treasury auction
  schedule. Every 2027 auction statement below is rule-derived and labelled as such.

### Conviction legs, tested

1. **The date is exactly as filed — SUPPORTED from two primaries, both fetched here.** NYSE's table
   states "All NYSE markets observe U.S. holidays as listed below for 2026, 2027, and 2028" and its
   Labor Day row reads across those columns verbatim `Monday, September 7 | Monday, September 6 |
   Monday, September 4`. SIFMA's 2027 US panel gives `Labor Day | Monday, September 6, 2027 | note
   EMPTY`. **5 U.S.C. 6103** fixes the first Monday in September, which for 2027 is 09-06.

2. **Friday 2027-09-03 is a full session in both markets — SUPPORTED, and the null result was
   verified rather than assumed.** SIFMA's empty note is meaningful, not a parsing artefact: the
   same extractor on the same fetch returns `Good Friday | Friday, March 26, 2027 | Early Close
   (2:00 p.m. Eastern Time): Thursday, March 25, 2027` and `Memorial Day | Monday, May 31, 2027 |
   Early Close (2:00 p.m. Eastern Time): Friday, May 28, 2027`. `September 3, 2027` appears **zero**
   times on the page. NYSE's four early-close disclaimers name only Monday July 3 2028, the day
   after Thanksgiving in each of 2026/2027/2028, and Thursday December 24 2026 — **no September
   early close in any covered year.** So where
   [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md) found a 14:00 ET rates
   cut-off before its holiday, here the operative deadline is the 16:00 ET equity close.

3. **The twin's recurrence claim is wrong, and this is the load-bearing find — REFUTED.** The
   [2026 twin](labor-day-market-closure-2026-09-07.md) states the compressed structure "returns on
   the same rule — Labor Day on Sep 6 or 7 — next in **2031** and **2032**." Computing every Labor
   Day 1993–2040 by first-Monday arithmetic: **2031's Labor Day is September 1**, so 2031 fails the
   twin's own rule outright, and **2027 is skipped entirely**. The correct set for 2009–2040 is
   **2009, 2010, 2015, 2020, 2021, 2026, 2027, 2032, 2037, 2038**. The consequence is not
   bookkeeping: the twin's null was registered at **n=5** and its stated limit was "n=5 is not a
   sample." The sixth instance was **2026** and the seventh is **2027** — back-to-back, exactly as
   2009/2010 and 2020/2021 were. The sample reaches **n=7 within thirteen months of the twin's own
   filing date**, which is a materially different research posture from waiting until 2031.

4. **The compressed-week structure itself is real, and validated 6/6 against Treasury's own record
   — SUPPORTED.** Reading every September 3Y/10Y/30Y auction 2009–2026 out of `auctions_query`:

   | Labor Day | Years | 3Y prices | Block sits in Labor Day week? |
   |---|---|---|---|
   | Sep 6 or 7 | 2009, 2010, 2015, 2020, 2021, 2026 | the **Tuesday after** (09-07 or 09-08) | **YES, 6 of 6** |
   | Sep 1–5 | the other 12 | Sep 9–12 | no, 0 of 12 — the *following* week |

   Both Sep-6 instances behave identically to the Sep-7 ones (2010: 3Y 09-07, 30Y 09-09; 2021: 3Y
   09-07, 10Y 09-08, 30Y 09-09). So **2027's block projects to Tuesday 09-07 / Wednesday 09-08 /
   Thursday 09-09** — rule-derived, since no 2027 Treasury schedule is published, and registered as
   a forward test rather than asserted.

5. **The twin's $304B headline is mostly NOT a compression effect — REFUTED, the second
   load-bearing find.** The twin quantified 2026-09-08's stack as top-0.8% of all auction days and
   read it as the compression's cost. It never ran the control that separates *compression* from
   *Monday-holiday displacement* — bills move off Monday to Tuesday whenever the market is shut,
   compressed year or not. Measuring each Labor Day Tuesday's total offering against the **median
   Tuesday of its own year** (era and program growth controlled):

   | | n | mean ratio (Labor Day Tue ÷ median Tue, same year) |
   |---|---|---|
   | Compressed (Labor Day Sep 6–7) | 6 | **2.11×** |
   | Non-compressed (Labor Day Sep 1–5) | 12 | **1.77×** |

   The displacement is **1.77× even with no coupon in the session at all**. And decomposing the
   twin's own number: of 2026-09-08's **$304B**, the 3-Year note is **$58B — 19%**. The honest
   statement is that ~four-fifths of the headline stack is the ordinary Monday-bill shift plus a
   decade of bill-program growth (the raw Labor Day Tuesday total runs $290B in **2025**, a
   *non*-compressed year), and compression contributes one coupon.

6. **The "Sep-6 Labor Days are their own cohort" split is a manufactured edge — REFUTED, and it is
   recorded because it is exactly the trap this event invites.** Splitting the twin's 33-instance
   reopen sample by day-of-month (Friday close → Tuesday close, SPY/^VIX/^TNX bars 1993 →
   2026-09-04):

   | Cohort | n | VIX up on reopen | median ΔVIX | mean \|Δ10Y\| |
   |---|---|---|---|---|
   | All Labor Days | 33 | 82% (27/33) | +0.680 | 6.50bp |
   | **Labor Day on Sep 6** (2027's case) | **5** | **100% (5/5)** | **+1.740** | 6.52bp |
   | Labor Day on Sep 7 | 4 | 50% (2/4) | −1.270 | 4.05bp |
   | Labor Day on Sep 1–5 | 24 | 83% (20/24) | +0.675 | 6.90bp |

   A 5/5 record with a median more than double the pooled figure reads like a finding. It is not:
   against the ordinary-weekend base rate of **61.3%** (1,011/1,650), five-for-five arrives by
   chance **8.6%** of the time, and against the VIX<15 conditional rate of **67.2%** (362/539),
   **13.7%**. The instances are **1993, 1999, 2004, 2010, 2021** — spanning four regimes with
   Friday VIX between 11.2 and 21.3, i.e. no shared mechanism either. The Sep-7 cohort's inverse
   result at n=4 is the same noise from the other side. **Neither is claimed.**

7. **The blackout angle is empty, and was not re-manufactured — SUPPORTED by deferring.** Labor Day
   2027 sits inside the **2027-09-04 → 09-16** gate; recomputed here, the gate holds **8** trading
   sessions (09-07 through 09-10, then 09-13 through 09-16), with its first three calendar days
   closed. [`fomc-blackout-start-2027-09-04`](fomc-blackout-start-2027-09-04.md) already measured
   both as routine — Labor Day inside 5 of 21 September gates, 8-session gates 4 of 19 — and this
   ledger adds nothing to either. Two adjacent framings were checked and also came back empty: the
   projected block (09-07/08/09) sits four sessions before the 09-15 decision, which is the **same**
   spacing as 2026's (09-10 block → 09-16 decision), so the unusually early September 2027 meeting
   does not change the block's relationship to it.

8. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.**
   `grep -icE 'holiday|labor day|closure|half-day|early close'` over `docs/plans/trade-playbooks.md`
   and `docs/research/multi-symbol-sweep.md` returns **0 and 0**, run this session. No playbook can
   fire on this date in either direction.

9. **The corridor is one event, and that is a statement about our coverage, not about the tape —
   SUPPORTED, and it is a limit rather than a finding.** Exactly **one** other tracked event sits
   within ±5 days of 2027-09-06: `fomc-blackout-start-2027-09-04`. The 2026 twin had **29**. That
   difference is calendar depth at D-365 versus D-1, not a quiet week — September 2027 will carry
   payrolls, CPI, the coupon block, an FOMC decision and quad-witching, none of which are seeded
   yet. Read the sparse corridor as *unpriced by this system*, never as *uneventful*.

### What plays the conditions support

None. A closed session cannot be traded, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the corrections in the signals list — chiefly the recurrence
set (2027 next, not 2031), the projected block dates, and the two measurements that take a
supply-stress reading and a day-of-month cohort *off* the table before anyone builds on them.

### Honest limits

- **Two of the three headline results are corrections to a sibling, not new market knowledge.** Legs
  3 and 5 improve how this family reasons; neither tells anyone what anything is worth.
- **No 2027 Treasury schedule exists.** Leg 4's block projection is a rule validated 6/6 on history,
  not a listing. It is registered as a forward test precisely because it is rule-derived.
- **The compressed/normal cohorts are era-confounded by construction**, and the twin said so first.
  Leg 5's same-year median-Tuesday ratio controls for program growth better than a raw dollar
  comparison does, but 6 vs 12 observations spanning 2009–2026 controls for nothing else.
- **Leg 6 refutes a split at n=5 and n=4.** Refusing an edge at that size is the correct call, but
  it is not the same as showing the cohorts are identical — the honest statement is "no effect
  distinguishable from chance," and a Sep-6 effect could exist and be invisible here.
- **^VIX is an index, not a tradeable,** and **^TNX is a yield proxy, not the cash 10Y.** Every
  figure above is close-to-close on those series; none is an execution price.
- **The twin's own null (n=5) is still open** and scores its first live counter-check on 2026-09-09.
  This ledger inherits its status, not its conclusion.
- **The event is `estimate`,** as is the one adjacent entry. Estimates widen caution and license
  nothing.

## Stance & kill switches

**Stance (2026-09-06):** stand aside, permanently and structurally — this row exists to correct two
readings the family would otherwise compound, not to hold a view. Concretely: (a) **the compressed
September coupon week's next instance is 2027, not 2031** — 2031's Labor Day is September 1 and
fails the twin's own rule, and the compressed set is 2009/2010/2015/2020/2021/2026/**2027**/2032/
2037/2038, so the twin's n=5 null reaches **n=7 in back-to-back years** rather than in five. (b) The
structure itself is real and validated **6 of 6** against Treasury's record — the 3Y prices on the
Tuesday after the holiday in every compressed year and in none of the twelve normal ones — so 2027's
block projects to **09-07 / 09-08 / 09-09**, rule-derived and unpublished. (c) **The twin's $304B
headline is mostly displacement, not compression**: the Labor Day Tuesday stack runs **1.77×** a
same-year median Tuesday in non-compressed years against **2.11×** in compressed ones, and the
coupon leg was **19%** of 2026's total. (d) The two edges this event most invites are both refused
on measurement — the Sep-6 day-of-month cohort (5/5 VIX-up, **p ≈ 0.086** against the
ordinary-weekend base rate) and the blackout framings (already measured routine upstream). Every
statement carries the event's **`estimate`** label, and none of it is an entry: `symbols: []`,
`impact: low`, playbook grep **0/0**.

**Kill switches:**

- **The block does not compress** — Treasury's September 2027 3-Year note prices **after
  2027-09-08**, putting the coupon block in the following week as a normal year does. Leg 4's 6-of-6
  rule breaks on its seventh test and legs 3 and 5 lose the structure they describe. Registered as
  **FT-labor-day-market-closure-2027-09-06-1**, score by 2027-09-10.
- **Compression turns out to be the stack after all** — the coupon leg is **≥30%** of the total
  offering auctioned on **2027-09-07**. Leg 5's "displacement, not compression" reading acquires its
  first counter-instance and the twin's original framing is reinstated. Registered as
  **FT-labor-day-market-closure-2027-09-06-2**, score by 2027-09-08.
- **The reopen vol pattern fails on its next instance** — ^VIX closes at or below its **2027-09-03**
  close on **2027-09-07**. The twin's supported leg 7 loses a live instance, and the Sep-6 cohort
  this ledger refused (5/5) gets its first miss. Registered as
  **FT-labor-day-market-closure-2027-09-06-3**, score by 2027-09-08.
- **The twin's compression null is killed on 2026-09-09** — a 10Y reopening bid-to-cover below
  **2.35**. This ledger's "the sample reaches n=7" framing becomes a live re-argument and the
  2027 instance is re-scoped from confirmation to adjudication.
- **A house playbook that keys on holiday-adjacent sessions is written and back-tested** — leg 8
  goes stale and the stand-aside is re-argued on measured data rather than on absence.
- **A `NYSE:`-class prefix is added to the source taxonomy** — the entry promotes to `confirmed`
  and the taxonomy caveat in the source field retires.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | 365 | **Initial research.** Canonical `<id>.json` written from the single proposal (`from-fomc-blackout-start-2027-09-04`, read first; no competitor). Date re-fetched from **both** primaries, not inherited: NYSE (HTTP 200, 109,180 B) 2027 column `Monday, September 6`, and **no September early close in 2026/2027/2028**; SIFMA (HTTP 200, 298,899 B) `Labor Day \| Monday, September 6, 2027 \| note EMPTY`, verified meaningful because the same extractor returns explicit `Early Close (2:00 p.m. ET)` notes for Good Friday and Memorial Day 2027 on the same page, and `September 3, 2027` appears 0×. **Correction to the [2026 twin](labor-day-market-closure-2026-09-07.md), load-bearing:** its "returns next in **2031** and **2032**" is wrong — **2031's Labor Day is Sep 1** and **2027 is the next instance**; compressed set 2009/2010/2015/2020/2021/2026/**2027**/2032/2037/2038, so its n=5 null reaches **n=7 in back-to-back years**. **Structure validated 6/6** from `auctions_query` (6,020 rows, HTTP 200): 3Y prices the Tuesday after in all 6 compressed years, the *following* week in all 12 normal ones → 2027 block projects **09-07/08/09** (rule-derived; no 2027 schedule exists). **Second correction:** the twin's $304B is mostly displacement — Labor Day Tue runs **1.77×** a same-year median Tue in NON-compressed years vs **2.11×** compressed, and the coupon leg was **$58B of $304B (19%)**. **Refused on measurement:** the Sep-6 cohort (5/5 VIX-up, med +1.740 vs +0.680 pooled) — **p ≈ 0.086** at the 61.3% ordinary-weekend base rate, 0.137 at the VIX<15 rate of 67.2%; and both blackout framings, already measured routine upstream (gate recomputed: **8 sessions**, first 3 calendar days closed). Provenance check: this session reproduces the twin's 33 / 82% / +0.680 / 6.50bp vs 3.77bp exactly. Adjacency — peers: n/a (`symbols: []`); macro: none dated in the 2027 corridor yet; VIX **14.53**, SPY **770.19**, ^TNX **4.78** (all 2026-09-04 closes, cache busted); geopolitical: no channel specific to a closed US session; tape: **1** tracked id within ±5d (`fomc-blackout-start-2027-09-04`) vs 29 for the twin — coverage depth at D-365, read as unpriced, not uneventful. Playbook grep **0/0**. **No new dated adjacent event found** — no calendar proposal filed. | Initial stance set: **stand aside** (structural row only). Registers **FT-…-1**, **FT-…-2**, **FT-…-3**. | 2026-10-06 (low:15+ → 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-labor-day-market-closure-2027-09-06.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
