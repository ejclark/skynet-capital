# US markets closed — Memorial Day 2027-05-31 — memorial-day-market-closure-2027-05-31

**Kind:** sector · **Date:** 2027-05-31 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` holiday grid, re-fetched HTTP 200 this session; SIFMA 2027 US panel; 5 U.S.C. §6103 verbatim. The `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-blackout-start-2027-05-29","sifma-bond-early-close-2027-05-28"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and this session went looking for a reason not to, and did not find one.**
The [ledger that discovered this closure](fomc-blackout-start-2027-05-29.md) refused to build on it,
having measured the session *before* the holiday as inert. That refusal covered only half the
closure, so this session measured the half nobody had: the **reopening session**. It looked like a
find — across 56 years the session after Memorial Day runs **0.865%** mean absolute S&P move,
**1.27×** the May baseline and **1.41×** the pre-holiday Friday, bigger in **34 of 56** years. Then
the control killed it. Run identically on the other Monday closures, **Labor Day is 1.36× its
baseline, Presidents Day 1.20×, MLK 1.09×** — Memorial Day is mid-pack in a **generic three-day
weekend effect**, and the VIX rebound across the weekend (**+5.4%**) is within a whisker of all
three (+5.2% to +5.9%). It also **fades**: on 2012–2026 the reopening premium is **1.02×**, i.e.
gone. So the extended refusal is the finding. What survives is **structural and needs no
statistics**: Memorial Day 2027 falls on **May 31, the last calendar day of May**, so Friday
**2027-05-28** is simultaneously the **last NYSE session of May**, a SIFMA-recommended **14:00 ET
bond close**, and the **last legal FOMC speaking day** — three deadlines stacked on one session,
with the rates leg shutting two hours before the equity leg. That configuration occurs in **8 of 56
years** since 1971. Nothing here is tradeable: date is `estimate`, `symbols: []`, and a re-run grep
of both house playbook docs returns **zero** calendar-keyed rules. One limit is also **closed**: the
NYSE cell the discovering ledger had to inherit after three 403s was re-read first-hand today.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a closed session is not a position, and there is nothing to size | High | D-268; `symbols: []`, `impact: low`, and `docs/plans/trade-playbooks.md` + `docs/research/multi-symbol-sweep.md` grepped this session for `holiday\|memorial\|closure\|half-day\|early close\|blackout` return **0 hits in both** | A house playbook keying on holiday-adjacent sessions being written and back-tested before **2027-05-31** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside; bank the extended refusal, do not trade it** | High | The live item this week is `fomc-blackout-start-2026-09-05`, not a 2027 holiday. The one thing worth doing now is written down: the reopening session is measured and refused, so the next pulse does not rediscover it | Any figure in the conviction-leg tables failing to reproduce from `^GSPC` daily bars before **2026-10-05** — the refusal rests on this session's own arithmetic and nothing else |
| This month | **Watch the promotion, not the tape — the date is now triple-primaried and still cannot self-confirm** | Medium | NYSE's own grid (re-read HTTP 200 today), SIFMA's 2027 US panel, and 5 U.S.C. §6103 verbatim ("Memorial Day, the last Monday in May") all give **Monday 2027-05-31**, and the rule reproduces **56 of 56** non-trading days 1971–2026 against the tape | A `NYSE:`-class (or equivalent exchange-calendar) prefix being added to the source taxonomy in `market-events-data.ts` before **2026-10-05** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Carry the 2027-05-28 triple deadline forward; do NOT carry a reopening premium** (`estimate` — an execution note, never an entry) | Medium | Measured: the reopening premium is generic (Memorial 1.27× vs Labor 1.36×, Presidents 1.20×) and absent since 2012 (1.02×); the 8 same-configuration years run **0.535%**, *below* the 0.680% May baseline. The stacked Friday is a scheduling fact that no measurement is needed to establish | The reopening session **2027-06-01** printing a larger absolute S&P move than **2027-05-28**. Registered as **FT-memorial-day-market-closure-2027-05-31-1** (base rates disclosed and in conflict: 34 of 56 pooled, 3 of 8 in same-configuration years) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-05-31. It is a closed session; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Fri 2027-05-28) — three deadlines, one session, two different closing bells.**
  Equities run a full 09:30–16:00 ET session (NYSE publishes **no** Memorial-Day-adjacent early
  close — its footnote list, re-read today, covers only July 3 2028, the day after Thanksgiving and
  Christmas Eve 2026). On the same session SIFMA recommends fixed income close at **14:00 ET**
  (`estimate`), and it is the **last day an FOMC participant may speak** before the blackout gate
  ([`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md)). Anything cross-asset
  loses its bond-side reference two hours before the equity mark. A timing caution, never a signal.
- **…and that same session is the May month-end mark.** Because Memorial Day 2027 *is* May 31,
  **2027-05-28 is the last NYSE session of May 2027** — so any month-end mark, index reweight or
  rebalance close lands on the session whose bond tape shuts early. In a normal year these are two
  different sessions. Registered as **FT-memorial-day-market-closure-2027-05-31-2**.
- **Explicitly refused (measured, then controlled).** There is no Memorial-Day reopening edge. The
  premium is real pooled (1.27× baseline, n=56) but **generic** (Labor Day 1.36×, Presidents Day
  1.20×, MLK 1.09×, identical construction), **faded** (1.02× on 2012–2026 ex-2020), and **inverted
  in the 8 years that match 2027's configuration** (0.535% vs a 0.680% May baseline). Do not build
  on it.
- **Also refused — the VIX weekend rebound.** VIX rises **+5.43%** mean from the pre-holiday Friday
  close to the reopening close, up in **30 of 37** years — but Labor Day is +5.84%, MLK +5.85%,
  Presidents Day +5.16%. Nothing about this holiday; a long-weekend artifact, and its cause is not
  established (see Honest limits).
- **Attribution trap (Tue 2027-06-01):** a gap on the reopening session has a three-day-weekend
  explanation, a new-month explanation, and a *"we are five sessions into an FOMC blackout with a
  derived payrolls print on 06-04"* explanation ([`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md)
  leg 4) before it has any single one. Never let a post-hoc read promote a hypothesis.
- **Watch (dated):** SIFMA bond early close 14:00 ET **2027-05-28** (est) · last legal Fed voice
  **2027-05-28** · blackout gate opens **2027-05-29** (est) · **NYSE closed 2027-05-31** (est) ·
  reopening **2027-06-01** · May payrolls **2027-06-04** (derived by the sibling, not read) ·
  FOMC **2027-06-09** (est).

## Initial research

### The question, plainly

This closure was discovered mid-sweep by [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md),
which filed it **and refused to build on it in the same breath** — measuring the pre-holiday Friday
at **0.556%** against a **0.698%** May baseline and calling the whole framing "a calendar first that
moves nothing." That refusal is well-argued, but it is a refusal about **one session**: the one
*before* the closure. A closure has two sides, and the far side — the reopening after a three-day
weekend — is the side where accumulated news flow actually gets priced.

So: **does the closure's far side carry anything the near side does not, and does a day the market is
shut earn a row at all?**

**One-line verdict.** The far side *looks* like it carries something and does not survive a control:
the post-Memorial-Day reopening runs **1.27×** the May baseline across 56 years, but Labor Day runs
**1.36×** and Presidents Day **1.20×** on identical construction, the effect is **absent since
2012**, and it **inverts** in the eight years that share 2027's exact configuration. The refusal
therefore extends to the whole closure. What genuinely distinguishes 2027 needs no statistics at
all: Memorial Day falls on **May 31**, which collapses the month-end mark, the SIFMA 14:00 ET bond
close and the final pre-blackout Fed voice onto **one session, Friday 2027-05-28**.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols:
[]`, so no symbol-keyed instrument applies and neither `earnings-cycle.mjs` nor `intraday-edges.mjs`
has a macro mode. Their discipline (*re-source, don't recall*) was honoured literally: every number
the discovering ledger asserted about this closure was **recomputed here from raw bars before being
used**, and the pipeline was validated against its figures before anything new was believed.

**Primaries fetched raw and parsed this session (2026-09-05):**

- **NYSE** `nyse.com/markets/hours-calendars` — **HTTP 200, 109,180 bytes** with `curl -L` and a
  browser user-agent. **This is the fetch the discovering ledger recorded as 403 on three attempts
  with three user-agents**, so the equity leg is now first-hand rather than inherited. Its holiday
  data is JSON-ish `"text":"…"` cells, 133 of them, parsed cell-by-cell.
- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 298,899 bytes; the 2027 US
  panel is a hidden tab the rendered text drops, so it was parsed out of the page's own embedded
  payload, the method the sibling entries document.
- **Office of Law Revision Counsel** `uscode.house.gov` 5 U.S.C. §6103 — HTTP 200, 170,803 bytes,
  the holiday clause extracted verbatim.
- **Yahoo** `^GSPC` (**19,291** daily bars, 1950-01-03 → 2026-09-04) and `^VIX` (**9,569** bars,
  1990-01-02 → 2026-09-04). `query1` returned **429**; `query2` served both at HTTP 200.
- **Attempted and failed, recorded rather than worked around:** `govinfo.gov`'s USCODE §6103
  granule (**HTTP 502**); `bls.gov/schedule/news_release/2027_sched.htm` and
  `bls.gov/schedule/2027/home.htm` (**403 each, with a browser user-agent**) — so BLS's block is
  confirmed as a genuine block for this runner, not the user-agent problem NYSE's turned out to be.

**Every price figure below is this session's own**, computed locally from those bars. Nothing is
inherited except where labelled.

### Conviction legs, tested

1. **The date is right, now rests on three independent primaries, and validates against the tape —
   SUPPORTED (and still `estimate`).** NYSE's grid states *"All NYSE markets observe U.S. holidays as
   listed below for 2026, 2027, and 2028"*; under the header `Holiday | 2026 | 2027 | 2028` the
   Memorial Day row parses exactly as `Monday, May 25` / **`Monday, May 31`** / `Monday, May 29`.
   SIFMA's 2027 US panel independently carries `Memorial Day | Monday, May 31, 2027`. 5 U.S.C. §6103
   reads verbatim: *"Memorial Day, the last Monday in May."* **And the rule was checked against the
   tape, not just quoted:** computing the last Monday in May for **1971–2026** and looking each date
   up in `^GSPC` returns **0 of 56** that are trading days. **Why it stays `estimate`:** the prefix
   taxonomy in `market-events-data.ts` has no slot for an exchange holiday calendar or a trade
   association's recommendations, and this lane may not self-confirm an in-sweep discovery. The
   label is about the taxonomy, not the evidence — and since every honest call here is a
   stand-aside, it costs nothing.

2. **The equity session before the holiday is full, and that is now a re-read negative control, not
   an inheritance — SUPPORTED.** NYSE's early-close footnotes, extracted today, name exactly three
   occasions: *"Monday, July 3, 2028"*, *"Friday, November 27, 2026, Friday, November 26, 2027, and
   Friday, November 24, 2028 (the day after Thanksgiving)"*, and *"Thursday, December 24, 2026"*.
   **No Memorial-Day-adjacent early close exists in any of the three years.** Friday 2027-05-28 is a
   full 09:30–16:00 ET equity session.

3. **The pipeline reproduces the discovering ledger's numbers before being trusted — SUPPORTED, and
   this is the reason to believe legs 4–6.** Rebuilding its construction (pre-holiday Friday =
   last session before the closure, close-to-close absolute move) on the window it used —
   **2005–2026 ex-2020, n=21** — returns **0.556%** for the pre-holiday Friday against a **0.698%**
   May baseline (n=445 sessions). Those are its two published figures to three decimals. The
   decoder is validated; what follows is new measurement on a validated pipeline.

4. **The far side looked like the find — SUPPORTED as a measurement.** Nobody had measured the
   reopening session. Across **1971–2026**:

   | Session | Mean abs. S&P move | vs May baseline (0.680%) |
   |---|---|---|
   | Pre-holiday Friday | **0.612%** | 0.90× |
   | **Post-holiday reopening** | **0.865%** | **1.27×** |
   | Last May session | 0.644% | 0.95× |

   The reopening is **1.41×** the pre-holiday Friday and larger than it in **34 of 56** years. On
   the discovering ledger's own recent window (2005–2026 ex-2020) it is **0.828%**, 1.19× baseline,
   1.49× the Friday, larger in 14 of 21. So the near side really is quiet and the far side really
   is not — which is exactly the asymmetry a refusal built on the near side alone would miss.

5. **…and the control kills it — REFUTED, and this is the document's contribution.** The same
   construction, applied to every other NYSE Monday closure that produces a Friday→Tuesday gap:

   | Closure | n | Pre-Fri | Reopening | Reopening / pre | Month baseline | Reopening / baseline |
   |---|---|---|---|---|---|---|
   | **Memorial Day** | 56 | 0.612% | 0.865% | 1.41× | 0.680% | **1.27×** |
   | Labor Day | 55 | 0.734% | 1.019% | 1.39× | 0.746% | **1.36×** |
   | Presidents Day | 56 | 0.638% | 0.844% | 1.32× | 0.702% | **1.20×** |
   | MLK Day (NYSE from 1998) | 29 | 0.775% | 0.867% | 1.12× | 0.797% | 1.09× |

   Memorial Day is **mid-pack**. Every Monday closure carries a reopening premium of roughly the
   same size, so leg 4 measures *a three-day weekend*, not *this holiday*. Two further cuts finish
   it: the premium **fades to nothing recently** — on **2012–2026 ex-2020** the reopening runs
   **0.639%** against a **0.628%** May baseline (**1.02×**, n=14) — and it **inverts in the years
   that match 2027** (leg 7). There is no Memorial-Day edge to hold.

6. **The VIX weekend rebound is equally generic — REFUTED as a finding.** From the pre-holiday
   Friday close to the reopening close, VIX rises a mean **+5.43%** across Memorial Day weekends and
   is higher in **30 of 37** years (1990–2026). That is a striking number in isolation and it means
   nothing here: **Labor Day +5.84% (29 of 36), MLK +5.85% (21 of 29), Presidents Day +5.16% (27 of
   37)**. The spread across four holidays is under a percentage point. Recorded so the next session
   does not rediscover it as a signal.

7. **The one thing genuinely specific to 2027 is structural, not statistical — SUPPORTED.**
   Memorial Day is the last Monday in May, so it can fall on the 25th through the 31st. When it
   falls on the **31st**, nothing in May remains after it and the pre-holiday Friday *becomes* the
   month's last session. Computed over 1971–2026 that happens in **8 of 56** years — **1971, 1976,
   1982, 1993, 1999, 2004, 2010, 2021** — and in exactly those 8, and only those, the pre-holiday
   Friday and the last May session are the same bar (a cross-check the arithmetic and the tape
   agree on). **2027 is the ninth.** So Friday **2027-05-28** carries three deadlines at once: the
   **May month-end mark**, a SIFMA-recommended **14:00 ET** fixed-income close, and the **last legal
   FOMC voice** before the gate. Two of the three resolve at 16:00 ET and one at 14:00 ET.
   **And the collision does not make the session loud:** across those 8 years the pre-holiday Friday
   runs **0.648%** against the **0.680%** May baseline — still at or below it. This is an
   **execution** fact, not a volatility one, and it is stated that way deliberately.

8. **The same-configuration years point the *opposite* way from leg 4 — MIXED, and disclosed rather
   than dropped.** In those 8 collision years the reopening session runs **0.535%**, well *below*
   the 0.680% May baseline, and out-moves the pre-holiday Friday in only **3 of 8**. Every one of
   them is a June 1st. Against the pooled 34-of-56, that is a direct conflict between the sample
   that is large and the sample that actually matches 2027's shape. **n=8 is far too small to be a
   rule in either direction** — which is why it is registered as a forward test (the ordering of
   2027-05-28 vs 2027-06-01) rather than asserted as a call.

9. **May 2027 is a minimum-length month — SUPPORTED, and it is a footnote.** May 2027 has 21
   weekdays; removing Memorial Day leaves **20 NYSE sessions**, the low end of the 1971–2026 range
   (mean 21.14, min 20, max 22). Two other May months in the sample are equally short. Worth one
   line for anyone normalizing a monthly figure, and nothing more.

10. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
    of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|memorial|closure|half-day|early close|blackout` returns **zero hits in both**, run this
    session. No playbook can fire on this date in either direction. Regime anchors read today:
    **VIX 14.53**, **S&P 7,718.60** (2026-09-04 closes) — identical to the readings in
    [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md), so **no regime shift**,
    and the probe baseline above is set with real readings.

### What the conditions support (date `estimate` — caution only, never an entry)

**No direction, no size, no level.** Two operative items and two refusals:

- **One session is named, and it is not the holiday.** **2027-05-28** carries the May month-end
  mark, a 14:00 ET recommended bond close and the last pre-blackout Fed voice. Anything cross-asset
  or month-end-shaped resolves against a bond tape that is already shut.
- **The reopening is an attribution trap, not an opportunity.** 2027-06-01 has three competing
  explanations for any gap before it has one.
- **Refused: a Memorial-Day reopening premium** (generic across all four Monday closures, absent
  since 2012, inverted in the matching years).
- **Refused: the VIX weekend rebound** (+5.4%, and within a percentage point of every other long
  weekend).

### Honest limits

- **The controls share the confound they are controlling for.** Legs 5 and 6 show Memorial Day is
  unremarkable *among long weekends*; they do not establish what causes the long-weekend premium
  itself. A three-day gap accumulates more news than a one-day gap, so part of the reopening's
  1.27× may be mechanical (more calendar time, more variance) rather than behavioural — and the
  same argument applies to the VIX rebound, whose pre-holiday Friday reading is itself depressed by
  weekend decay being priced out. **No mechanism is proposed here**, and none should be inferred.
- **Leg 8's n is 8.** The disagreement between the pooled sample and the same-configuration sample
  is the most interesting number in this document and the least reliable one. It is registered, not
  believed.
- **Leg 5's MLK row starts in 1998** (NYSE began observing the holiday then), so its n is half the
  others'. It is the weakest row in the control table and the one furthest from Memorial Day — the
  argument does not rest on it.
- **Leg 7 rests on a trade association's recommendation** for the 14:00 ET bond close, which SIFMA
  itself states members may ignore, and the third deadline (the Fed voice) is inherited from
  [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md), whose own date is
  `estimate` pending the 2027-04-27/28 meeting. The month-end leg is the only one of the three
  that is pure arithmetic.
- **No US statistical release can be shown to land in this corridor.** BLS 403s to this runner with
  a browser user-agent, and publishes no 2027 schedule reachable here; the sibling's May-payrolls
  date (2027-06-04) is *derived from a published rule*, not read, and is not re-asserted here.
- **A UK coincidence is noted and deliberately not filed.** SIFMA's page carries a
  `Spring Bank Holiday | Monday, May 31, 2027` card — the UK is dark the same day. It is **not**
  proposed as a calendar entry: this session could attribute the card to the UK panel only by
  holiday *name*, since the page's embedded payload streams out of rendered order and section
  attribution by offset failed; SIFMA's UK panel is a fixed-income recommendation rather than an
  exchange closure; and the calendar carries no UK entry of any kind to set a precedent. Recorded
  as an observation, refused as a proposal.

## Stance & kill switches

**Stance (2026-09-05; date `estimate`, and every trading-adjacent statement below carries that
label).** **Stand aside, permanently and structurally**, and the contribution is an *extended*
refusal rather than a new one. The [discovering ledger](fomc-blackout-start-2027-05-29.md) refused
this closure on the strength of the session before it; this session measured the session *after* it
— the side where a three-day weekend actually prices — found an apparent **1.27×** premium, and
then killed it with a control: **Labor Day 1.36×, Presidents Day 1.20×, MLK 1.09×** on identical
construction, **1.02×** on 2012–2026, and **inverted** (0.535% vs a 0.680% baseline) in the 8 years
sharing 2027's configuration. The VIX weekend rebound (+5.43%, 30 of 37) is generic to within a
percentage point across all four holidays. **There is no Memorial-Day edge on either side of the
closure**, and that is now measured on both sides rather than one.

**What survives is a scheduling fact.** Memorial Day 2027 falls on **May 31**, the last calendar day
of May — the case in **8 of 56** years since 1971 — so Friday **2027-05-28** is simultaneously the
**last NYSE session of May**, a SIFMA-recommended **14:00 ET** fixed-income close, and the **last
legal FOMC speaking day** before the blackout gate. Three deadlines, one session, two different
closing bells. That is an **execution** note: the collision years' pre-holiday Friday runs **0.648%**
against a **0.680%** May baseline, so the stack does not make the session loud. **One honest limit
is closed:** the NYSE cell the discovering ledger had to inherit after three 403s was re-read
first-hand today (HTTP 200, 109,180 bytes), together with its early-close footnote list, which
carries **no** Memorial-Day-adjacent entry. **No directional call, no size, `symbols: []`.**

**Kill switches:**

- **Date kill:** NYSE republishing its holiday grid with a different 2027 Memorial Day, or Congress
  amending 5 U.S.C. §6103. No mechanism for either exists (the last Monday in May is computable and
  reproduces 56 of 56 non-trading days against the tape); listed for completeness.
- **Structure kill (the load-bearing one):** **2027-05-28 failing to be the last NYSE session of
  May 2027**, or SIFMA amending its 2027 US panel to drop the 14:00 ET early close on that date.
  Either breaks the triple-deadline framing that is this document's only surviving finding.
  Registered as **FT-memorial-day-market-closure-2027-05-31-2**, score by **2027-05-28**;
  re-check each pulse, since the failure path is a *republication*, not the passage of time.
- **Refusal kill (the measured one):** the reopening session **2027-06-01** printing a *larger*
  absolute S&P close-to-close move than **2027-05-28**. The pooled long-weekend base rate (34 of 56)
  and the same-configuration base rate (3 of 8) disagree, and this is the session that adjudicates
  them. Registered as **FT-memorial-day-market-closure-2027-05-31-1**, score by **2027-06-02**.
- **Genericness kill:** a re-run of leg 5's control on a later data cut showing Memorial Day's
  reopening premium separating from Labor Day's and Presidents Day's by more than the ~0.15×
  spread measured here. The refusal in leg 5 is a *relative* claim and dies if the relation moves.
- **Corridor kill:** the blackout gate moving off **2027-05-29** (its own date is `estimate` until
  the **2027-04-27/28** meeting), or SIFMA dropping the 05-28 bond close — the third and second
  legs of the 05-28 stack lose their subjects and only the month-end leg survives.
- **Relevance kill (the good one):** a house playbook that keys on holiday-adjacent sessions being
  written and back-tested. Leg 10 goes stale and the stand-aside must be re-argued on measured
  performance rather than on absence.

**Two forward tests registered** in
[`forward-tests/memorial-day-market-closure-2027-05-31.md`](../forward-tests/memorial-day-market-closure-2027-05-31.md)
— **-1** (the measured refusal: 2027-06-01 does *not* out-move 2027-05-28, both base rates disclosed
and in conflict, score by 2027-06-02) and **-2** (the structural claim: 2027-05-28 is May 2027's
last NYSE session and carries a SIFMA 14:00 ET bond close, score by 2027-05-28). No price-direction
test is registered: `symbols: []`, the stance takes no position, and a refusal is not a prediction
about level. **No new calendar entry is proposed** — the ±5-day corridor already holds both adjacent
events, and the one dated item this sweep discovered (the UK Spring Bank Holiday) is refused on
attribution grounds (see Honest limits).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-268 | **Initial research.** **Date triple-primaried today:** NYSE grid re-fetched **HTTP 200, 109,180 bytes** — *the fetch [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md) recorded as 403 ×3, so the equity leg is now first-hand* — Memorial Day row = `Monday, May 25 / **Monday, May 31** / Monday, May 29` (2026/27/28); SIFMA 2027 US panel `Memorial Day \| Monday, May 31, 2027 \| Early Close (2:00 p.m. ET): Friday, May 28, 2027`; 5 U.S.C. §6103 verbatim (uscode.house.gov, HTTP 200) *"the last Monday in May"*. Rule validated against the tape: **0 of 56** computed Memorial Days 1971–2026 are `^GSPC` trading days. NYSE early-close footnotes re-read — **no** Memorial-Day-adjacent early close in any of the three years, so 05-28 is a full equity session. **Pipeline validated before use:** reproduces the discovering ledger's **0.556%** pre-holiday Friday and **0.698%** May baseline (2005–2026 ex-2020, n=21) exactly. **Headline (the far side, never previously measured):** reopening session **0.865%** vs a **0.680%** May baseline (1971–2026, n=56) = **1.27× baseline, 1.41× the pre-holiday Friday**, larger in **34 of 56** years. **Then REFUTED by control:** Labor Day **1.36×**, Presidents Day **1.20×**, MLK **1.09×** on identical construction → a **generic three-day-weekend effect**, not this holiday; it also **fades** (2012–2026 ex-2020: **1.02×**, n=14) and **inverts** in the 8 same-configuration years (**0.535%**, below baseline; out-moves the Friday in only **3 of 8**). **VIX weekend rebound also generic:** Memorial **+5.43%** (30/37) vs Labor +5.84%, MLK +5.85%, Presidents +5.16%. **What survives is structural:** Memorial Day 2027 = **May 31**, so **2027-05-28 is the last NYSE session of May** *and* the SIFMA **14:00 ET** bond close *and* the **last legal Fed voice** — three deadlines, two closing bells; configuration occurs in **8 of 56** years (1971/76/82/93/99/04/10/21), and in exactly those the Friday and the last May session are the same bar. Collision-year Friday **0.648%** vs 0.680% baseline → an execution fact, not a volatility one. May 2027 = **20 sessions** (range 20–22, mean 21.14). **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** no US release datable to this corridor; `bls.gov` 2027 endpoints **403 even with a browser UA** (a real block, unlike NYSE's, which was a UA/redirect issue) — the sibling's derived 2027-06-04 payrolls date is not re-asserted. **Volatility:** VIX **14.53**, S&P **7,718.60** (2026-09-04 closes, Yahoo; `query1` 429'd, `query2` served) — identical to the sibling, **no regime shift**; probe baseline set with real readings. **Geopolitical:** none touching a `symbols: []` closure. **Corridor:** ±5 days holds only [`sifma-bond-early-close-2027-05-28`](sifma-bond-early-close-2027-05-28.md) (D-3) and [`fomc-blackout-start-2027-05-29`](fomc-blackout-start-2027-05-29.md) (D-2), both `estimate` — **no new calendar entry proposed**; the one dated item found (SIFMA UK `Spring Bank Holiday \| Monday, May 31, 2027`) is **refused** — section attribution by payload offset failed, the card is identifiable by holiday name only, SIFMA's UK panel is a fixed-income recommendation not an exchange closure, and no UK precedent exists on this calendar. Playbook grep re-run: **0 hits in both** files. **govinfo §6103 granule 502** — the OLRC copy was used instead. | Initial stance set: **stand aside** (structural row only) — the discovering ledger's refusal **extended to the far side of the closure and confirmed by control**; the surviving finding is the **2027-05-28 triple deadline**. Registers **FT-…-1** and **FT-…-2**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
