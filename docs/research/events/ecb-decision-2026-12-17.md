# ECB Governing Council monetary-policy decision + press conference (Frankfurt) — ecb-decision-2026-12-17

**Kind:** macro-print · **Date:** 2026-12-17 (estimate, EST: ecb.europa.eu Governing Council monetary-policy meeting calendar (press/calendars/mgcgc), re-fetched direct 2026-09-05 — the December entries read verbatim "Governing Council of the ECB: monetary policy meeting in Frankfurt (Day 1)" on 16/12/2026 and "Governing Council of the ECB: monetary policy meeting in Frankfurt (Day 2), followed by press conference" on 17/12/2026; filed estimate per this lane's no-self-confirm limit and because CONFIRMED_PREFIX carries no slot for a non-Fed central bank) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["g20-miami-2026-12-14","import-export-prices-2026-12-17","opex-2026-12-18","pjm-capacity-auction-2026-12","ppi-2026-12-15","puct-batch-zero-report-open-meeting-2026-12-17","retail-sales-2026-12-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **December is the venue October was not — and this session finally has a per-meeting
number to describe it with.** The 10-29 sibling found October information-starved by construction:
no staff projections, no fresh inflation print. **12-17 is the exact inverse.** It carries a staff
projection round, the November flash HICP from **01/12/2026**, and — from the ECB's own statistical
calendar — the **full November HICP at 17/12/2026 12:00 CET, two hours fifteen minutes before the
14:15 CET decision**. It is also the **horizon-extending round**: December rounds add a year
(Dec-2025 spanned 2025–2028; June-2026 spans 2026–2028), so 12-17 publishes the **first-ever 2029
HICP cell** — which re-bases the very "mandate is met at 2.0% end-horizon" test the September
sibling's forward test rests on. The headline methodological find: **the per-meeting probability gap
both ECB ledgers declared unfillable is now closed**, from the same page whose *cumulative* table
they retired. `centralbank.watch`'s embedded **Market Implied Rate Path** publishes per-meeting
moments; solving them against the cumulative table's own P(no change) yields a four-outcome
distribution for 12-17 that **cross-checks the page's published standard deviation to within
0.03bp** — 2.25% **3.6%** · 2.50% **~34.0%** · 2.75% **48.1%** · 3.00% **~14.4%** (as of
**2026-09-04**). So **P(deposit rate ≤ 2.50% after 12-17) ≈ 37.6%** — which prices the sibling's
already-registered **FT-ecb-decision-2026-09-10-2** at roughly **38% to pass**. **Nothing here is
tradable for this book** — `symbols: []`, no house playbook is rates-keyed. Date is **estimate**; it
widens caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing here is ours to hold | High | D-103, `symbols: []`, no rates-keyed playbook, and the meeting's content is not knowable until **09-10** and **10-29** resolve | A tracked name moving **>2%** in the **09:45–10:30 ET** window on **2026-10-29** with tape attribution to the ECB (**FT-ecb-decision-2026-10-29-2**, scores 2026-10-30) — that kills the no-price-channel premise all three ECB ledgers rest on |
| This week | **Quote ECB probabilities from the implied-rate path, never from the cumulative table** | High | The path publishes per-meeting `rate` / `meanChangeBps` / `modalChangeBps` / `modalProbability` / `stdDevBps`; the solve reproduces the published sd to **0.03bp** at 12-17 and **0.05bp** at 10-29, so it is an internally consistent object and the cumulative grid never was one | The next refresh's four-outcome solve missing the page's own `stdDevBps` by **>1.0bp** — registered as **FT-ecb-decision-2026-12-17-2**, score by **2026-09-26** |
| This month | **Hold the December view frozen until 2026-09-10 prints** | High | Every leg here is downstream of a meeting that has not happened: the 2.25%→2.50% hike, the September projections' 2028 cell, and whether Lagarde guides a path at all | The **09-10** statement pre-committing to a December move, or the September round putting **2028 HICP above 2.0%** (**FT-ecb-decision-2026-09-10-1**, scores 2026-09-10) — either and this document is rebuilt, not patched |
| This quarter | **Read the 2029 HICP cell on 12-17, not the rate** | Medium | The rate is already owned by a registered test scoring 12-18; the **new** instrument is a projection year that has never been published, and it is where "the mandate is met, so further tightening is unargued" either survives on a fresh horizon or dies | The December round publishing **no 2029 cell** (voids), or a **2029 HICP cell above 2.0%** (kills) — registered as **FT-ecb-decision-2026-12-17-1**, score by **2026-12-18** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-12-17. This book holds nothing with a euro-rates channel and none is proposed.
- **The clock reverts, and the practical shape is pre-market** — decision **08:15 ET**, presser **08:45 ET** (14:15 / 14:45 CET). Both sides are on standard time by mid-December, so the six-hour gap is back and a ~45-minute presser ends **right at the 09:30 ET cash open**.
- **The attribution rule flips back to September's** — on 10-29 the euro leg lands *inside* US cash hours and contaminates; on 12-17 it lands *before* the open, so it is an available *explanation* for a gap, not a contaminant of live tape.
- **The one number to read on the day** — the **2029** HICP cell. Not the rate (already under test), not the statement's tone.
- **The pricing tell has a deadline** — the ECB quiet period runs the seven days before Day 1 (16/12), so the last pre-meeting commentary is **2026-12-08**; `ecb-quiet-period-start-2026-12-09` is proposed to `market-events.ts` in this PR as `estimate`.
- **Re-solve the distribution every pulse, and publish the sd cross-check with it** — a decomposition that stops reproducing is a decomposition that stops being quotable.
- **Watch (dated)** — ECB decision **2026-09-10** (est) · ECB account **2026-10-08** (est) · ECB decision **2026-10-29** (est) · Nov flash HICP **2026-12-01** · **FOMC 2026-12-09** · CPI **2026-12-10** · CR expiry **2026-12-11** · Nov full HICP **2026-12-17 12:00 CET** · December triple witching **2026-12-18** · next ECB meeting **2027-02-04** (ECB calendar, fetched today; not proposed — outside any tracked window).

## Initial research

### The question, plainly

Two siblings have already narrowed this. [`ecb-decision-2026-09-10`](ecb-decision-2026-09-10.md)
established that a euro-area policy decision has **no price channel into this book**, and that the
only live content in the euro cycle is a **~50bp disagreement about the terminal rate**.
[`ecb-decision-2026-10-29`](ecb-decision-2026-10-29.md) then found October is *not* where that gap
gets tested — it is the ECB's information-starved skip meeting — and named **12-17** as the venue
instead. Both ledgers also closed with the same admitted gap: **no per-meeting, non-cumulative ECB
probability existed in any source either session could reach.**

So the question here is two-part: **is 12-17 actually the venue, and what specifically does it
decide that is not already under test elsewhere?** And, because it is the load-bearing weakness both
predecessors named: **can the per-meeting number be found rather than declared unavailable?**

**One-line verdict:** yes on all three. December carries every instrument October lacked — a
projection round, a fresh flash print, and the **full November HICP landing 2h15m before the
decision** — and it is the round that **extends the forecast horizon to 2029**, which is the one
genuinely new thing it decides. The pricing gap is closed by reading a *different object on the same
page*: an implied-rate path whose published moments solve to a four-outcome distribution that
cross-checks its own standard deviation to **0.03bp**.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). ECB
primaries fetched direct today (2026-09-05): the Governing Council meeting calendar, the statistical
release calendar for HICP, the macroeconomic-projections index, the quiet-period explainer, the
2026-07-23 press conference, the accounts index, and the 2025-12-18 press conference (for the
December round's horizon). Pricing is from `centralbank.watch/european-central-bank/` (plain curl,
HTTP 200, 86,660 bytes, page states **"Last updated: September 4, 2026"**) — an **aggregator model**,
not a primary, and its own methodology note says the figures come from the "EUR short term interest
rate curve" with missing points estimated by a "Joint Least-Squares Bootstrap." `morningstar.com`
returned **HTTP 403** to WebFetch again today, the third consecutive ECB session it has. Price
readings (VIX, EUR/USD, Brent, WTI) pulled live this session from Yahoo daily bars. No instrument
scripts run: `symbols: []`, no issuer, and `earnings-cycle.mjs` / `intraday-edges.mjs` have no macro
mode.

### Conviction legs, tested

1. **December is the structural inverse of October — every instrument October lacked, it has.**
   SUPPORTED, ECB primaries. The projections index states verbatim that the ECB publishes
   macroeconomic projections **"four times a year (in March, June, September and December)"** — so
   12-17 carries a round and 10-29 did not. The ECB's statistical calendar
   (`press/calendars/statscal/ges/html/sthicp`, fetched today) puts the euro-area flash HICP for
   reference month **Nov-2026 at 01/12/2026 15:00 CET**, sixteen days before the decision, against
   October's nearest flash falling **six days after** its meeting. The 10-29 ledger's whole "skip"
   case was that the Council meets with no new forecast and no new print; on 12-17 it has both.

2. **The definitive November inflation print publishes on the morning of the decision.** SUPPORTED,
   and this is sharper than leg 1 deserves. The same statistical calendar carries the **full**
   Nov-2026 HICP release at **17/12/2026 12:00 CET** — i.e. **two hours fifteen minutes before the
   14:15 CET statement**, on the decision day itself. The Council's own forecast will already
   incorporate the underlying data, so the practical effect is on the *tape* rather than the
   *decision*: the definitive euro inflation breakdown and the policy decision land inside the same
   two-hour window, which is a far denser euro morning than either sibling's date.

3. **December is the horizon-extending round, so 12-17 publishes the first-ever 2029 cell.**
   SUPPORTED, derived from two ECB primaries rather than asserted. The **2025-12-18** press
   conference statement (fetched today) gives that round's horizon verbatim as **"2.1 per cent in
   2025, 1.9 per cent in 2026, 1.8 per cent in 2027 and 2.0 per cent in 2028"** — **four** years,
   2025–2028. The **June 2026** round (inherited from the September sibling, fetched 2026-09-05)
   spans **three** years, 2026–2028, with 2028 HICP at exactly **2.0%**, core 2.2%, GDP 0.8/1.2/1.5.
   The December round is therefore where the terminal year is added, and December 2026's will span
   **2026–2029**. This matters beyond trivia: **FT-ecb-decision-2026-09-10-1**'s entire mechanism is
   a single published cell — 2028 HICP against 2.0%, the level at which the mandate is met and
   further tightening is unargued. On 12-17 the end of the horizon **moves**, and that argument has
   to be re-made against a number nobody has seen. It is the one genuinely new thing this meeting
   decides, and it is registered as **FT-ecb-decision-2026-12-17-1** rather than asserted.

4. **The per-meeting probability gap is closed — and the fix was a different object on the page both
   siblings already read.** SUPPORTED, and the finding most worth banking. The 10-29 ledger retired
   `centralbank.watch`'s meeting grid as a source of single-meeting odds because its own note says
   the figures are **cumulative** — *"a given meeting's hike probability is the chance the rate is
   higher than today's level by that meeting date, and it already includes any move priced in for
   earlier meetings … these figures should not be added, multiplied, or compared across meetings as
   if each one stood alone"* (fetched verbatim today). Correct, and the retirement stands. But the
   same page carries a **second, distinct payload** — a *Market Implied Rate Path* — publishing, per
   meeting date, an implied `rate`, `meanChangeBps`, `modalChangeBps`, `modalProbability`,
   `stdDevBps` and a `rateLower`/`rateUpper` band, for **today**, **one week ago** and **four weeks
   ago**. Today's path (data as of **2026-09-04**, current deposit rate **2.25%**):

   | Meeting | Implied rate | Mean chg | Modal chg | Modal prob | Band |
   |---|---|---|---|---|---|
   | 2026-09-10 | 2.4714% | +22.1bp | +25bp | 88.6% | 2.3919–2.5510 |
   | 2026-10-29 | 2.5449% | +29.5bp | +25bp | 65.9% | 2.4060–2.6839 |
   | **2026-12-17** | **2.6835%** | **+43.3bp** | **+50bp** | **48.1%** | **2.4970–2.8699** |
   | 2027-02-04 | 2.7517% | +50.2bp | +50bp | 44.2% | 2.5345–2.9688 |

   `modalChangeBps` is cumulative-from-today like the grid, so the 12-17 modal outcome of **+50bp**
   is a **2.75%** deposit rate at **48.1%** — which is an honest per-meeting *level* probability,
   exactly the object both siblings said did not exist. It also independently corroborates the
   press-cited framing they had to lean on: Morningstar's *"almost a 50/50 chance of a further rate
   increase in December, bringing the deposit rate to 2.75%"* is **48.1%**, with a source and a date.

5. **The full distribution solves uniquely, and it cross-checks.** SUPPORTED, arithmetic, verified
   this session. The path gives the mean and the modal probability; the cumulative grid gives
   **P(no change) = 3.6%** for 12-17 (`Cut 0.0% · 0bp 3.6% · hike 96.4%`). Restricting outcomes to
   {0, +25, +50, +75}bp — defensible, since `rateUpper` is 2.8699% and no cut is priced anywhere on
   the strip — two equations in two unknowns close it: 25·p₂₅ + 75·p₇₅ = 43.3 − 50(0.481) and
   p₂₅ + p₇₅ = 0.964 − 0.481. Solving: **2.25% 3.6% · 2.50% ~34.0% · 2.75% 48.1% · 3.00% ~14.4%.**
   The solve is **over-determined**, which is what makes it trustworthy rather than merely
   arithmetic: the standard deviation is never used as an input, and the recovered distribution
   implies **18.63bp** against the page's published **18.6bp** — a **0.03bp** miss. Repeating the
   identical procedure on 10-29 (P(no change) 8.1%, mean +29.5bp, modal +25bp at 65.9%) gives
   **2.25% 8.1% · 2.50% 65.9% · 2.75% ~25.9% · 3.00% ~0.1%** and implies **13.95bp** against a
   published **13.9bp** — a **0.05bp** miss. Two independent cross-checks at two dates is why this
   is promoted to a quotable method rather than left as a one-off calculation; it is registered as
   **FT-ecb-decision-2026-12-17-2** so it must keep reproducing to keep that status.

6. **What the numbers then say — including about a live registration and a sibling's own kill
   switch.** SUPPORTED, follows from leg 5. Three readings, all as of **2026-09-04**:
   - **P(deposit rate ≤ 2.50% after 12-17) ≈ 37.6%** (3.6% + 34.0%). That is precisely the condition
     **FT-ecb-decision-2026-09-10-2** adjudicates — *"the deposit facility rate stands at 2.50% or
     below immediately after the 2026-12-17 Governing Council decision"*, score by **2026-12-18**.
     The strip therefore puts the calendar's one durable euro claim at roughly **38% to pass**. That
     is a quantification of a registration, **not a re-registration**: no rate call is registered
     here, because registering one would double-count a single observation.
   - **P(a second hike by 10-29) ≈ 26.0%** (25.9% + 0.1%). The 10-29 ledger's pricing kill switch
     reads *"a per-meeting (non-cumulative) October probability appearing above ~40%."* At ~26% the
     **skip call survives its first quantified test** — and the gap that made it unquantifiable when
     it was written is now closed.
   - The **increment** from 10-29 to 12-17 is **+13.9bp** of implied rate — the strip adds ~36pp of
     "the second hike has arrived" across that seven-week span. Note the honest limit: an increment
     is not a conditional per-meeting probability, because the joint distribution across two meetings
     is not recoverable from these moments. It is stated as an increment and called one.

7. **The pricing drifted hawkish over four weeks, and the modal December outcome flipped.**
   SUPPORTED, from the same payload's three vintages. The 12-17 implied rate reads **2.5896%** (four
   weeks ago) → **2.6560%** (one week ago) → **2.6835%** (today): **+9.4bp** of drift, monotonic.
   More pointedly, `modalChangeBps` for 12-17 went **+25bp → +50bp → +50bp** — i.e. the **modal
   December outcome flipped from 2.50% to 2.75% inside four weeks**, and the same flip is visible
   further out (2027-04-29 modal moved to **+75bp** on today's path alone). Direction runs **against**
   the "peak at 2.50%" case the September sibling registered. It is dated, it is not yet decisive,
   and it is recorded rather than argued away.

8. **The clock reverts to the September shape — and the presser ends at the US cash open.**
   SUPPORTED, arithmetic, verified this session. EU summer time ended **2026-10-25** and US daylight
   time **2026-11-01**, so by mid-December both sides are on standard time and the gap is back to
   **six hours** (CET UTC+1, EST UTC−5). The ECB's standing **14:15 / 14:45 CET** slots therefore
   land at **08:15 / 08:45 ET**, against 09:15 / 09:45 ET on 10-29. A press conference of the usual
   ~45 minutes runs **08:45 → ~09:30 ET**, ending essentially at the **cash open**, and the US
   import/export price index at **08:30 ET** lands in the gap between statement and presser. So the
   10-29 ledger's attribution warning **inverts back**: on 12-17 the euro leg is an available
   *explanation* for a gap at the open, not a contaminant of live tape. Inherited caveat, unchanged
   and load-bearing: the 14:15/14:45 CET slots are the ECB's **convention** and are **not** printed
   on the meeting-calendar page. Weak new corroboration only — an economic-calendar aggregator
   reached by search states the 14:15 CET announcement and 14:45 CET press conference for **17
   December 2026** specifically; that is an aggregator, not the ECB, and does not upgrade the input.

9. **What December actually adjudicates is Lagarde's own July sentence.** SUPPORTED, ECB primary
   fetched today. At the **2026-07-23** press conference she was categorical: *"There are direct
   effects. It goes without saying that there are indirect effects, when you look at the price of,
   say, transportation, for instance, pretty obvious. **Second-round effects: we are not seeing
   it.**"* The supporting datum in the same statement is a decelerating wage track — compensation per
   employee *"went from 3.8 to 3.5"* — with the indicators *"not giving us second-round effects
   indications."* She also named the test: *"we will be particularly attentive to any risk of
   second-round effects."* By 12-17 there are five further months of prints, a full projection round,
   and a horizon extended into 2029. That sentence either still holds — in which case the 2029 cell
   comes in at or below 2.0% and the "insurance hike, then done" frame is re-affirmed on fresh
   ground — or it does not, and the December round manufactures its own justification for the strip's
   2.75%. That is the meeting, stated as narrowly as it can honestly be stated.

10. **The date sits in a dense window, and one item in it is a genuine tail.** SUPPORTED, from our
    own entries. Within five days: **G20 Miami 12-14**, **PJM capacity auction 12-15**, **PPI
    12-15**, **retail sales 12-16**, **import/export prices 12-17**, **PUCT batch-zero open meeting
    12-17**, and **`opex-2026-12-18`** — December triple witching, the largest expiry of the year,
    the very next session. Just outside the five-day ring and more consequential than anything
    inside it: **FOMC 12-09**, **CPI 12-10**, and **`cr-expiry-2026-12-11` / `government-funding-
    deadline-2026-12-11`**. A funding lapse on 12-11 would degrade the US data the tape reads around
    this date, six days before the fact — the same federal-release exposure
    [`pce-2026-10-29`](pce-2026-10-29.md) already researched for the October window. None of this
    changes the stance; it is the context any 12-17 pulse must sweep.

11. **No price channel — unchanged, not re-argued, and deliberately not re-tested here.**
    SUPPORTED, inherited. `symbols: []`; the house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed, and the
    two second-order channels — dollar translation and global term premium — are owned by the FOMC
    entries. **FT-ecb-decision-2026-10-29-2** already tests this premise on 10-29, the only presser
    in the tracked window that overlaps US cash hours. Per leg 8, 12-17 is **pre-market** and is
    therefore a strictly **weaker** test of the same claim, so **no channel test is registered
    here**: registering one would double-count a claim already under test on better terms, and the
    result would be uninterpretable against a pre-open tape.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-12-17. Three rules and one branch:

- **Read-only, and cheaply.** The base case is that 12-17 is a real policy meeting with real
  content — and that none of that content is a price event for anything this book holds.
- **Search order when it lands** — (1) the **2029** HICP cell against 2.0%; (2) whether the statement
  ties the energy shock to **wages**, i.e. whether Lagarde's *"we are not seeing it"* survives; (3)
  the rate, which is last because a registered test already owns it.
- **The quoting rule, now enforceable.** Any ECB probability written anywhere in this calendar comes
  from the implied-rate path with its as-of date and its sd cross-check attached — never from the
  cumulative grid, which the 10-29 ledger retired and this one does not rehabilitate.
- **The branch to pre-decide** — if **09-10** or **10-29** surprises, legs 4–7 are stale within the
  session and the pricing section is re-derived from a fresh path rather than patched. Leg 3 (the
  2029 horizon) and leg 8 (the clock) survive any such surprise; they are calendar arithmetic.

### Honest limits

The load-bearing weakness is unchanged from the October sibling and is worse here by 49 days:
**this event is D-103 and two meetings that shape its content have not happened.** Everything in
legs 4–7 is a snapshot of a strip that moves daily, and leg 7 shows it moving — **+9.4bp in four
weeks**, with the modal December outcome flipping mid-window. The pricing source is an
**aggregator's model**, not a primary: `centralbank.watch` derives its path from the EUR short-term
rate curve with a "Joint Least-Squares Bootstrap" filling gaps, and **no futures curve was fetched
directly** — the same gap both siblings flagged, still open, and now carrying *more* weight than
before because this ledger promotes that page's payload to a quotable method. That promotion is the
honest risk of this document, which is exactly why leg 5's cross-check is registered as a forward
test rather than treated as settled. The decomposition also rests on a stated restriction — outcomes
in {0, +25, +50, +75}bp — that the data supports (`rateUpper` 2.8699%, no cut priced) but does not
prove; a materially bimodal or cut-inclusive distribution would break it. Leg 6's increment is
explicitly **not** a conditional per-meeting probability and is not offered as one. Leg 3's
horizon-extension claim is an **inference from two rounds' published year ranges**, not an ECB
statement of policy — the projections index says only "four times a year (in March, June, September
and December)," and the pattern would break if the ECB re-based its horizon. Leg 8's conversion is
exact arithmetic on a **conventional** input, and the only new corroboration this session found for
the 14:15/14:45 CET slots on this specific date is an aggregator listing. The adjacent entries in
leg 10 are a mix of `confirmed` and `estimate`, so the window's exact shape can still move. The date
itself stays **estimate** despite being read off the ECB primary directly, per this lane's
no-self-confirm limit; it widens caution and licenses nothing. And leg 11 is once again an argument
that *nothing* connects — a null whose honest failure mode is an uninstrumented channel, left under
the sibling's better-designed test rather than re-registered here on weaker terms.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely — and treat 12-17 as the euro cycle's
decision date, with the 2029 projection cell as the thing to read.** The 09-10 sibling framed the
cycle's open question as a ~50bp terminal disagreement; the 10-29 sibling found October could not
test it. This ledger finds December can, and says why structurally rather than by sentiment: a staff
projection round, the November flash HICP on **12-01**, the **full** November HICP at **12-17 12:00
CET** — 2h15m before the decision — and, uniquely, a **forecast horizon extended to 2029**. This
book holds nothing with a euro-rates channel and none is proposed.

The ledger's substantive commitments are analytical, not positional, and there are three. First, it
**relocates the scoreable instrument**: the September sibling's "mandate met at 2.0% end-horizon"
argument re-anchors from a 2028 cell to a **2029** cell that has never been published, registered as
**FT-ecb-decision-2026-12-17-1**. Second, it **closes the per-meeting pricing gap both siblings
declared unfillable**, by reading the implied-rate path rather than the cumulative grid, and by
solving an over-determined system that reproduces the page's own standard deviation to **0.03bp** at
12-17 and **0.05bp** at 10-29 — yielding **2.25% 3.6% · 2.50% ~34.0% · 2.75% 48.1% · 3.00% ~14.4%**
(as of **2026-09-04**), hence **P(≤2.50% after 12-17) ≈ 37.6%** and **P(a second hike by 10-29)
≈ 26.0%**. Those two numbers do real work elsewhere: the first prices
**FT-ecb-decision-2026-09-10-2** at roughly **38% to pass**, and the second clears
**FT-ecb-decision-2026-10-29-1**'s own ~40% pricing kill. Third, it **corrects the clock back**:
**08:15 / 08:45 ET**, both sides on standard time, so the presser ends at the cash open and the euro
leg is an explanation available before the bell rather than a contaminant of live tape.
Estimates widen caution and license nothing.

**Kill switches:**

- **Horizon kill (registered):** the **2026-12-17** staff round publishing a **2029 HICP cell above
  2.0%** — the ECB would be endorsing the strip's 2.75%+ on its own fresh end-horizon, and the
  "insurance hike, then done" frame across all three ECB ledgers dies with it. **Void** (not killed)
  if the round publishes no 2029 cell or re-bases the horizon. Registered as
  **FT-ecb-decision-2026-12-17-1**, score by **2026-12-18**.
- **Method kill (registered):** the four-outcome solve missing the path's own published `stdDevBps`
  by **>1.0bp** on the next refresh. The decomposition stops being a quotable method and every
  probability this ledger exports is withdrawn. Registered as **FT-ecb-decision-2026-12-17-2**,
  score by **2026-09-26**.
- **Pricing kill:** the 12-17 implied rate moving outside **2.55%–2.82%** (today's ±1σ ≈ 2.497–2.870
  narrowed to the band this stance is comfortable inside), or `modalChangeBps` reverting to **+25bp**
  — the first says the December question has been resolved by events, the second says leg 7's
  hawkish drift reversed. Re-check every pulse.
- **Structural kill:** the ECB moving the December projection round, or the statistical calendar
  moving the Nov full HICP off **17/12/2026**. Legs 1–3 are the whole "December is the venue" case
  and would be re-derived, not patched. Re-check every pulse.
- **Precondition kill:** **09-10** or **10-29** delivering something other than the priced path — no
  hike on 09-10, or any rate change on 10-29. Legs 4–7 are stale the same session. Score at each
  meeting.
- **Supply-side kill:** Lagarde's *"second-round effects: we are not seeing it"* (2026-07-23) being
  retracted — services HICP re-accelerating above its August **3.0%**, or compensation per employee
  turning back up from **3.5%**. Re-check at each HICP full release, next **2026-10-16**.
- **Clock kill:** the ECB publishing a decision or press-conference time for 12-17 other than
  14:15 / 14:45 CET. Leg 8's 08:15 / 08:45 ET conversion moves with it. Re-check every pulse.
- **Date kill:** the ECB moving the 12-16/17 meeting, or the meeting producing no decision. Breaks
  the header, and **voids** (not kills) **FT-ecb-decision-2026-09-10-2**, which names this date.
  Re-check every pulse.

Two forward tests registered in [`forward-tests.md`](../forward-tests.md) —
**FT-ecb-decision-2026-12-17-1** (the 2029 cell) and **FT-ecb-decision-2026-12-17-2** (the
decomposition reproduces). **No rate test and no price-channel test is registered here**, on
purpose: **FT-ecb-decision-2026-09-10-2** already scores the rate on **2026-12-18** and
**FT-ecb-decision-2026-10-29-2** already tests the channel on the one date that overlaps US cash
hours. Registering either again would double-count one observation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-103 | Initial research banked (above). **Headline finding: the per-meeting ECB probability both siblings declared unfillable exists — on the same page whose cumulative grid they retired.** `centralbank.watch/european-central-bank/` (plain curl, HTTP 200, 86,660 bytes, "Last updated: September 4, 2026") carries a second payload, a **Market Implied Rate Path**, publishing per-meeting `rate`/`meanChangeBps`/`modalChangeBps`/`modalProbability`/`stdDevBps` for today, 1wk and 4wk ago. Today's 12-17 row: implied **2.6835%**, mean **+43.3bp**, modal **+50bp at 48.1%**, sd **18.6bp**, band 2.497–2.870. Solving those moments against the grid's own P(no change)=3.6% over {0,+25,+50,+75}bp closes an **over-determined** system: **2.25% 3.6% · 2.50% ~34.0% · 2.75% 48.1% · 3.00% ~14.4%**, implying **18.63bp** vs the published **18.6bp** (**0.03bp** miss); repeating on 10-29 gives **8.1% / 65.9% / ~25.9% / ~0.1%**, implying **13.95** vs published **13.9** (**0.05bp**). Consequences elsewhere: **P(≤2.50% after 12-17) ≈ 37.6%**, so **FT-ecb-decision-2026-09-10-2** is priced at ~**38% to pass**; **P(second hike by 10-29) ≈ 26.0%**, clearing **FT-ecb-decision-2026-10-29-1**'s own ~40% pricing kill. Also corroborates Morningstar's press-cited "almost 50/50 … to 2.75%" with a number and a date. **Second finding — December is October's structural inverse:** projections run "four times a year (in March, June, September and December)" (ECB projections index, verbatim); Nov flash HICP **01/12/2026 15:00 CET** and — the sharp one — the **full Nov HICP at 17/12/2026 12:00 CET, 2h15m before the 14:15 CET decision** (ECB statistical calendar, fetched today). **Third finding — the horizon extends to 2029:** the 2025-12-18 statement's round spans **2025–2028** (four years, verbatim) against June-2026's **2026–2028** (three), so December is the horizon-extending round and 12-17 publishes a **first-ever 2029 HICP cell** — which re-bases **FT-ecb-decision-2026-09-10-1**'s "mandate met at 2.0%" instrument. **Fourth — the clock reverts:** both sides on standard time by mid-December, six-hour gap, so 14:15/14:45 CET = **08:15 / 08:45 ET**; the presser runs to ~**09:30 ET**, ending at the cash open, with import/export prices at 08:30 ET in the gap — the euro leg is an *explanation* available pre-open, the inverse of its 10-29 contaminant role. Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — within 5d: G20 Miami 12-14, PJM capacity auction + PPI 12-15, retail sales 12-16, import/export prices + PUCT batch-zero 12-17, **December triple witching 12-18**; just outside and larger: **FOMC 12-09**, **CPI 12-10**, **CR expiry / funding deadline 12-11** (a lapse would degrade the US data read around this date). **Volatility** — VIX **14.53** (09-04 close, Yahoo; 09-03 14.32, 09-02 15.20, 09-01 16.34, 08-31 14.92). **Geopolitical** — energy shock still widening: Brent **90.49 (08-31) → 95.83 (09-04)**, WTI **85.76 → 91.22**; EUR/USD **1.1621** (09-04). **Event tape** — pricing drifted hawkish: 12-17 implied **2.5896 (4wk) → 2.6560 (1wk) → 2.6835 (today)**, +9.4bp, and `modalChangeBps` flipped **+25bp → +50bp**, i.e. the modal December outcome moved from 2.50% to 2.75% inside four weeks — against the "peak at 2.50%" case, dated and recorded. **Primary quote for what December adjudicates:** Lagarde, **2026-07-23** presser (fetched today) — *"Second-round effects: we are not seeing it,"* with compensation per employee *"went from 3.8 to 3.5."* **One dated adjacency proposed to `market-events.ts` as `estimate`:** **`ecb-quiet-period-start-2026-12-09`** — the ECB quiet-period explainer (fetched today) binds Governing Council members "and their alternates" for "the seven days before a scheduled meeting," which against Day 1 on 16/12 gives **12-09**, the same day as the FOMC decision; it dates the deadline on the last pre-meeting ECB commentary (12-08). | — (stance set: stand aside, no position, no play; three analytical commitments — relocate the scoreable instrument to the 2029 cell, close the per-meeting pricing gap via the implied-rate path with an sd cross-check, and correct the clock back to 08:15 / 08:45 ET) | 2026-09-26 (medium, 31+d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
