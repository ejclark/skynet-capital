# VIX futures & options March 2027 expiration (SOQ settlement) — vix-expiration-2027-03-17

**Kind:** opex · **Date:** 2027-03-17 (confirmed, OCC: two Cboe primaries fetched direct 2026-09-05 — the settlement page (HTTP 200, 536,634 bytes) lists `VX/H7 - 2027-03-17` with real daily settlements 20.7295 (09-04) and 20.8641 (09-03), and the machine-readable CSV `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200, 1,731 bytes) carries the same row as `VX,VX/H7,2027-03-17,20.7295`; the 30-day rule checks independently, and now reproduces on all nine listed VX contracts once NYSE closures are applied — see leg 2) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-decision-2027-03-18","fomc-2027-03-17","japan-cpi-2027-03-19","opex-2027-03-19","sp-rebalance-reference-close-2027-03-12"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and the most useful thing this document does is kill an edge rather than
find one.** The March 2027 VIX expiration settles to a Special Opening Quotation struck from a
*single* SPX series expiring exactly 30 days later, **2027-04-16** — and that window contains
**Good Friday 2027-03-26**, an NYSE full closure. So the strip spans **21 trading sessions in 30
calendar days** where a holiday-free strip spans **22**. Because VIX annualizes on *calendar* time
while variance accrues on *trading* time, that predicts a mechanical **~0.48-point** downward bias in
the settlement — a clean, testable, apparently free observation. **This session tested it against
Cboe's own curve and the strong form did not survive.** Fitting a business-time correction across all
nine listed VX contracts, the full correction is **strictly worse** than no correction at all (total
curve kink 2.204 vs 1.721; the best fit prices only ~20% of it), and `VX/H7` sits **+0.16 rich** to a
log-fit of the curve, not cheap — the opposite sign. The one contract that *does* look depressed
(`VX/Z6`, two holidays) is over-determined by the year-end vol lull. Verdict: the drag is real in the
VIX *formula* and **not visible in this contract's price**. What survives is unglamorous and already
known: the date is now **confirmed** off two Cboe surfaces (flipped from `estimate` in this PR); the
contract stops trading **09:00 ET, ~5 hours before** the 14:00 ET FOMC decision the same day
(`fomc-2027-03-17`, `estimate`), so FOMC-day vol exposure cannot live in it; and at **D-193** the far
curve is a level, not information — on the hawkish 2026-09-04 payrolls surprise the front two
contracts **rose** while `VX/H7` **fell 0.13**. Output: one execution guard, one replication forward
test, one refusal banked. Impact stays **low** on purpose.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D-193, `symbols: []`, and the playbook grep run this session returns **zero** opex/vol-settlement hits across `trade-playbooks.md` and `multi-symbol-sweep.md`; a settlement mechanic 193 days out has no read on today's tape | A house vol/opex instrument being built and back-tested before **2027-03-17** — the "no playbook is keyed to this" leg goes stale and this sheet is rebuilt on measured data instead of mechanics |
| This week | **Stand aside; the live vol-settlement question this week is 2026-09-16, not 2027-03-17** | High | The September 2026 VIX expiration is 11 days out with its own ledger and its own registered forward test; nothing in the 2026-09-07 → 2026-09-11 tape is `VX/H7`-keyed | Cboe publishing, before **2026-09-11**, a March-2027 VIX settlement date other than 2027-03-17 — the confirmation flipped in this PR reverts and the corridor re-dates |
| This month | **Do not buy the holiday-drag story** — this session tested it and the strong form failed | Medium | The ~0.48-point Good Friday drag is real in the VIX formula but absent from Cboe's curve: the full business-time correction makes the curve *less* smooth (kink 2.204 vs 1.721 uncorrected) and `VX/H7`'s log-fit residual is **+0.16**, i.e. rich | Re-running this session's residual test on a later Cboe settlement page and finding `VX/H7`'s residual at **≤ −0.10** — the drag would then be pricing in as the strip nears, and the refusal converts to a live question. Registered as **FT-vix-expiration-2027-03-17-2**, score by 2027-03-16 |
| This quarter | **Watch one thing only: whether the September 2026 sibling's settlement test scores** | Medium | This event's single non-trivial prediction is a *replication* of `FT-vix-expiration-2026-09-16-1` — VRO prints above the same-day VIX cash close, because the documented FOMC-day vol decline lands after the 09:00 ET settlement. The sibling scores **2026-09-16**; that result is the prior for this one | The **2026-09-16** sibling test scoring a clear kill — one FOMC-morning VIX settlement printing *below* its own cash close would make the replication registered here a test of a dead mechanic, and it gets re-specified rather than repeated |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-03-17 VIX settlement. The date is
  now `confirmed`, which removes the date objection and changes nothing else: no house playbook is
  opex- or vol-settlement-keyed (grepped this session, zero hits).
- **Execution guard (the only actionable line here):** nothing trades the **2027-03-17 opening
  auction** — the March VIX/VXM complex AM-settles into it, and the vol complex's first prints that
  morning are settlement artifacts, not information. Same guard the 2026-09-16 sibling carries.
- **Structural placement, not a call:** `VX/H7` stops trading **09:00 ET** and settles ~5 hours
  before the **14:00 ET** FOMC decision (`estimate`). FOMC-day vol exposure lives in April
  (`VX/J7`, 2027-04-21) or in SPX options — never in the expiring March line.
- **The refusal this document banks:** the Good-Friday-in-the-strip drag (21 sessions vs 22,
  ~0.48 points theoretical) is **not in the price**. Do not build on it without re-testing.
- **Term structure as of 2026-09-04 (Cboe daily settlements):** U6 **16.2669** · V6 18.1384 ·
  X6 18.7688 · Z6 18.9750 · F7 19.9997 · G7 20.4603 · **H7 20.7295** · J7 21.0267 · K7 21.1500 —
  a monotone contango curve. H7's 20.73 is the vol risk premium's far end, not a March-2027 forecast.
- **The dated evidence for "the far end is dead":** on the hawkish **2026-09-04** payrolls print,
  Cboe's own 09-03 → 09-04 settlement changes were U6 **+0.1288** and V6 **+0.0371** while every
  contract from X6 out **fell** (H7 **−0.1346**, −0.65%). Opposite sign to the front.
- **Corridor (all `estimate` except this entry):** S&P Select Sector rebalance reference close
  **03-12** → this settlement + **FOMC 03-17** → **BoJ 03-18** → **Japan CPI + triple witching
  03-19**. Detail lives in the sibling [`opex-2027-03-19`](opex-2027-03-19.md) ledger, not here.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At
  D-193 those describe a different expiry entirely; they become quotable from about **2027-03-10**.

## Initial research

### The question

The seeding entry filed this as "an exact structural rhyme with the September 2026 corridor this
repo already researched." If that is all it is, the honest output is a pointer to the sibling and
nothing else. So: **is there anything about the March 2027 VIX settlement that the September 2026
ledger does not already cover — and if there is, does it survive contact with the data?**

**One-line verdict:** yes, there is exactly one structurally new thing — the SOQ's 30-day strip
contains a market closure, which the September strip did not — and **this session's own test says the
market does not price it**, so the finding is a banked refusal plus a resolved anomaly, not an edge.

### Method

Macro/mechanics mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no earnings-style
instrument applies (`earnings-cycle.mjs` / `intraday-edges.mjs` are symbol-keyed; this event has
`symbols: []`) and no opex- or vol-shaped instrument exists in `scripts/research/`. This session did
not inherit the sibling ledgers' conclusions; it re-fetched and re-parsed the primaries, then
computed against them:

- **Cboe** `cboe.com/us/futures/market_statistics/settlement` (HTTP 200, 536,634 bytes), parsed
  row-by-row into **95** symbol/expiry/price rows across the two published settlement dates
  (2026-09-04 and 2026-09-03), weekdays computed on every row.
- **Cboe** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200,
  1,731 bytes) — the machine-readable second surface, used as the independent confirmation.
- **NYSE** `nyse.com/markets/hours-calendars` (HTTP 200, 109,148 bytes), holiday table parsed
  cell-by-cell for 2026/2027/2028.
- **Own computation:** trading-session counts for all nine listed `VX` contracts' 30-day strips
  against that holiday table; a business-time correction scan; and an OLS fit of settlement on
  `log(days-to-expiry)` with residuals correlated against session deficit. All arithmetic is
  reproducible from the numbers quoted in leg 3.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  grepped for `opex|expiration|witching|volatility settlement|SOQ`; `src/domain/market-events/` for
  the corridor; the [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md) and
  [`opex-2027-03-19`](opex-2027-03-19.md) ledgers for what was already banked.
- **Index levels, and one failed route:** `query1.finance.yahoo.com` — the endpoint this repo's own
  probe (`scripts/event-material-scan.mjs`) reads — returned **HTTP 429** to this runner on every
  attempt across two backoff rounds (eight retries on `^VIX` alone). Recorded as a fetch failure
  rather than worked around, and replaced with a **better** source rather than a substitute: Cboe's
  own daily index history CSVs (`cdn.cboe.com/api/global/us_indices/daily_prices/…`, HTTP 200) for
  **VIX** (472,309 bytes), **VIX9D**, **VIX3M** and **VVIX**. Every index level quoted below is this
  session's own read off that primary, not a borrowed or inferred number.

### Conviction legs, tested

1. **The date is right, and this PR promotes it to `confirmed` — SUPPORTED.** The seeding entry
   filed `estimate` explicitly because "this lane may not self-confirm an event it discovered
   in-sweep," and noted the evidence was already `OCC:`-grade. This is the event's own initial
   research, which is the sanctioned venue for that flip — the same move the
   [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md) sibling made on identical grounds.
   Two independent Cboe surfaces were fetched today: the HTML settlement page lists
   **`VX/H7` expiring 2027-03-17** with real daily settlements against it (**20.7295** on 09-04,
   **20.8641** on 09-03), and the CSV endpoint for the same date returns the row
   **`VX,VX/H7,2027-03-17,20.7295`**. The arithmetic checks independently: **2027-03-17 is a
   Wednesday exactly 30 calendar days before 2027-04-16**, April's third Friday. Two Cboe surfaces
   plus an arithmetic check is the standard that promoted the September sibling; `OCC:` is the
   prefix `market-events-data.ts` defines for exactly this ("theocc.com / Cboe; 3rd-Friday
   standard"). Note what the flip does and does not buy: it removes the date objection and licenses
   nothing, because every call on this sheet is a stand-aside either way.

2. **The 30-day rule now reproduces on all nine listed VX contracts — SUPPORTED, and it resolves an
   anomaly a sibling ledger recorded as unexplained.** [`opex-2027-03-19`](opex-2027-03-19.md)
   logged, honestly, that "the `VX/K7 - 2027-05-18` row is a *Tuesday* whose +30d lands Thursday
   2027-06-17, one day short of June's third Friday (06-18) — the single row of nine that does not
   reproduce the rule… unexplained, not relied on." NYSE's holiday table, fetched today, explains it
   in one line: **Juneteenth 2027 is observed Friday 2027-06-18** (the page's own cell reads
   `Friday, June 18 (Juneteenth National Independence Day observed)`), so the market is **closed on
   June's third Friday** and the June SPX expiration moves back to **Thursday 2027-06-17**. Then
   2027-06-17 − 30 days = **Tuesday 2027-05-18** = `VX/K7`, exactly as listed. Corroborated on the
   same Cboe page without leaving it: the `VA/M7` row is dated **2027-06-17**, a Thursday. The rule
   was never broken — the anchor moved. **Why this matters here and is not just tidying:** it
   demonstrates the 30-day rule anchors to the *actual* SPX expiration date, holidays included, and
   **2027-04-16 is holiday-clean** (Good Friday falls 03-26, three weeks earlier), so nothing moves
   this event's own anchor.

3. **The strip contains a market closure — SUPPORTED — but the drag that implies is REFUTED in its
   strong form by this session's own test.** *The mechanic.* VIX contracts AM-settle to a VRO built
   from the opening auction of a **single** SPX/SPXW series exactly 30 days out — here **2027-04-16**
   — so the settlement measures the window **2027-03-18 → 2027-04-16**. That window contains
   **Good Friday 2027-03-26**, an NYSE full closure (`good-friday-market-closure-2027-03-26`,
   `estimate`; NYSE primary re-fetched today: the Good Friday row reads `Friday, April 3` /
   **`Friday, March 26`** / `Friday, April 14` for 2026/27/28). Counting sessions: **21**, against
   **22** for the September 2026 sibling's holiday-free 2026-09-17 → 2026-10-16 strip. VIX
   annualizes on *calendar* time while variance accrues on *trading* time, so the predicted
   mechanical bias is `1 − √(21/22)` = **2.3%**, or **≈0.48 points** at H7's 20.7295. Plausible,
   quantified, and apparently free — which is why it got tested rather than written up.

   *The test.* Session counts for all nine listed `VX` contracts' strips, against the same NYSE
   table: **U6 22 · V6 22 · X6 21** (Thanksgiving 11-26) **· Z6 20** (Christmas 12-25 + New Year
   01-01) **· F7 21** (Washington's Birthday 02-15) **· G7 22 · H7 21** (Good Friday 03-26) **·
   J7 22 · K7 21** (Memorial Day 05-31). Two independent reads:

   - **Business-time correction scan.** Apply `value × (22/n)^(λ/2)` and minimise total absolute
     chord-kink across the curve. The optimum is **λ ≈ 0.2**, and the curve is **monotonically
     worse** from there to λ = 1: total |kink| runs **1.721** (λ=0, no correction) → **1.482**
     (λ=0.2) → 1.708 (λ=0.5) → **2.204** (λ=1, the full theoretical correction). *The full
     correction is strictly worse than doing nothing.* At most ~20% of the theoretical business-time
     adjustment is in this curve, and that shallow optimum is fitted on nine points.
   - **Residual regression.** OLS of settlement on `log(days-to-expiry)` across all nine contracts.
     `corr(session-deficit, residual)` = **−0.72** (09-04) and **−0.69** (09-03) — the right sign,
     and superficially encouraging. It does not survive inspection: the correlation is carried
     **entirely by one point**, `VX/Z6` (deficit 2, residual **−0.55**), whose December→January strip
     is over-determined by the well-documented year-end volatility lull and the year-end roll.
     Setting Z6 aside, the deficit-0 group mean (**+0.13**) versus the deficit-1 group mean
     (**+0.01**) is a 0.12-point gap sitting inside the deficit-0 group's own spread (−0.10 to
     +0.27). And `VX/H7` itself has residual **+0.16** (09-04) / **+0.14** (09-03) — **above** the
     fitted curve, i.e. rich, the opposite of what the drag predicts.

   *Verdict.* **REFUTED** for the strong form (a ~0.48-point discount is not there and the full
   correction actively degrades the fit); **MIXED** for a weak form (a ~20% partial effect is
   consistent with the λ scan but is not separable from noise at n = 9). Recorded as a finding
   because a plausible edge killed cheaply, before anyone sized it, is worth more than a plausible
   edge described. **The two tests disagree on H7's own sign** — the chord test puts it fractionally
   below its neighbours' midpoint (−0.014 on 09-04), the regression puts it above the fitted curve
   (+0.16) — and that disagreement is itself the tell that neither is a result.

4. **At D-193 the far curve is a level, not information — SUPPORTED, dated and quantified.** VIX
   cash closed **14.53** on 2026-09-04 (Cboe's own index history CSV, read this session) while
   `VX/H7` settled **20.7295** — a **+6.20-point** gap that is the vol risk premium's standing term
   structure, not a forecast of elevated March-2027 volatility. Reading it as one is the single most
   available error on this event. The dated evidence: on **2026-09-04** August payrolls printed
   hawkish (+162k against ~53–55k consensus — BLS, as recorded by the sibling ledgers), and Cboe's
   own 09-03 → 09-04 settlement changes split the curve in half. Cash and front end **up**: VIX
   14.32 → **14.53** (+0.21), `VX/U6` **+0.1288** (16.1381 → 16.2669), `VX/V6` **+0.0371**.
   Everything from November out **down**: X6 **−0.0871**, Z6 **−0.1248**, F7 **−0.1491**,
   G7 **−0.1893**, **H7 −0.1346 (−0.65%)**, J7 **−0.1233**, K7 **−0.1750**. The biggest macro
   surprise of that week moved the March-2027 line by two thirds of one percent, in the *opposite*
   direction to cash and the front month. Anything this ledger's later pulses read off `VX/H7`
   before roughly February 2027 should be treated with that in mind. Configuration on the same date,
   for the next pulse to diff against (all Cboe primary closes, 2026-09-04): **VIX9D 11.97 · VIX
   14.53 · VIX3M 17.61 · VVIX 84.42** — a steeply upward-sloping front, i.e. near-dated calm priced
   against a fuller 3-month window. Named as a configuration, **not** a forecast.

5. **The FOMC-morning structure is an exact rhyme with September 2026 — SUPPORTED, and that makes it
   a replication rather than a claim.** Expiring VIX futures cease trading **09:00 ET** on settlement
   morning; expiring VIX options ceased at the prior close. The FOMC decision
   (`fomc-2027-03-17`, `estimate`, the first SEP of 2027) lands **14:00 ET** — roughly **five hours**
   after settlement. So the March contract settles at the **pre-decision** level and never
   experiences the decision-day volatility decline the literature documents. Two consequences, both
   structural: FOMC-day vol exposure cannot live in the expiring March line (it lives in `VX/J7`,
   2027-04-21, or in SPX options), and the vol complex's own hedges therefore leave the board on the
   *morning* of the decision, two sessions before the 03-19 witching. The September 2026 sibling
   registered precisely this as `FT-vix-expiration-2026-09-16-1` — VRO prints **above** the same-day
   VIX cash close. Registering the same prediction here is deliberate: it converts a
   one-observation, literature-borrowed claim into a **pre-stated two-print series**, which is the
   promotion discipline [`opex-2027-03-19`](opex-2027-03-19.md) explicitly asked for.

6. **Two surface qualifications recorded rather than dropped — SUPPORTED.** First, **VXM (Mini VIX)
   does not yet list the March-2027 contract**: the VXM rows on the same page stop at
   **`VXM/G7` (2027-02-17)**, with no `VXM/H7`. Second, the **09-04 CSV carries the VX list only
   through `VX/J7`** — no `VX/K7` row — though the HTML table for that same settlement date has one.
   Neither touches `VX/H7`, which appears on **both** surfaces with the same price, so neither
   weakens leg 1. They are logged because a surface discrepancy noticed and quietly dropped is
   exactly how a wrong date gets inherited by the next six pulses.

7. **No house playbook is opex- or vol-settlement-keyed — SUPPORTED, re-verified rather than
   inherited.** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
   this session for `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**.
   S1/G1 are earnings-dated run-up plays, S2 is the never-hold-the-print guard, S3 a reaction-day
   fade, S4 a structural close-side preference, E1 a don't-trade-the-open execution rule. The one
   real interaction is that **E1 gains a reason on 2027-03-17** — a VRO auction on an FOMC morning
   stacked on one open. That sharpens an existing execution rule; it is not a new signal.

8. **The calendar carries this settlement but not the strip it is computed from — SUPPORTED, and it
   is this sweep's one proposal.** Within 5 days of 2027-03-17 the calendar is already complete:
   `sp-rebalance-reference-close-2027-03-12`, `fomc-2027-03-17`, `boj-decision-2027-03-18`,
   `japan-cpi-2027-03-19`, `opex-2027-03-19` — all `estimate`, all seeded by the sibling's sweep.
   The gap is 30 days out, not 5: **`opex-2027-04-16` is absent**, and it is the SPX expiration the
   VRO is *literally computed from* — the constitutive input to this event's settlement value, not
   another instance of the same event type. Proposed as an `estimate` file in this PR. Deliberately
   **not** proposed: `vix-expiration-2027-04-21` and the other quarterly VIX expirations (mere
   repetitions — the same call the September sibling made, and for the same reason), and
   `juneteenth-market-closure-2027-06-18`, which leg 2 discovered and which is genuinely dated and
   NYSE-sourced, but which sits three months past this corridor and belongs to whichever ledger owns
   the June 2027 cycle. Filing either here would manufacture research burden this run cannot justify.

### What the conditions support

Nothing directional, and no sizing. Three outputs, in descending order of value:

- **A refusal.** The Good-Friday-in-the-strip drag is not in the price (leg 3). It is the only
  genuinely new thing about this event versus its September sibling, and it does not survive its own
  test. Banking that is the point of the document.
- **An execution guard.** Nothing enters, exits or resizes on the **2027-03-17 opening auction**, and
  the vol complex's first prints that morning read as settlement artifacts. Inherited from the
  September sibling, unchanged.
- **A placement note.** FOMC-day vol exposure cannot sit in the expiring March VIX line
  (leg 5) — structural, not directional.

### Honest limits

The **date** is now confirmed; everything trading-adjacent remains mechanics or `estimate`-grade
context, and every adjacent event in the corridor (`fomc-2027-03-17` included) is `estimate` and
carries its own tentative-until-confirmed caveat. The settlement prices are Cboe **daily
settlements** for 2026-09-04 and 2026-09-03, not live quotes. **One data route failed**: Yahoo — the endpoint
this repo's own probe reads — returned HTTP 429 on every attempt across two backoff rounds, so every
index level here comes from Cboe's own daily index CSVs instead. That is a better primary, but it is
a *different* primary from the one the deterministic screen will use at the next pulse, so a small
source discrepancy at that pulse is expected rather than alarming. Index levels are **closes for
2026-09-04**, a session this runner is a day past; there is no intraday read here. Leg 3's statistics are computed on **nine contracts and two settlement dates**, with
one dominant observation and two tests that disagree on H7's sign — they are enough to refuse a
story, not to establish one, and the λ optimum in particular is a shallow minimum fitted on nine
points. The business-time argument itself is textbook option mechanics, not a house-validated
result. Leg 5's FOMC-day volatility-decline claim is inherited from the September sibling's reading
of literature summaries, not full texts read here, and no house data tests it — which is exactly why
it is being replicated rather than asserted. Nothing about same-day VIX open interest by strike or
SPX gamma is quoted: at D-193 that describes a different expiry and would be false precision.
Educational, paper-standard throughout.

## Stance & kill switches

**Stance (date `confirmed` as of 2026-09-05, Cboe-sourced; every adjacent event `estimate`).** Treat
**2027-03-17, 09:30 ET** as a known-date, **low-impact microstructure marker** and never as a
tradeable event. No position is opened, closed or sized because of it, and the promotion from
`estimate` to `confirmed` in this PR changes that not at all — it removes a date objection to a
stand-aside. One guard applies: **nothing executes on that day's opening auction**, on any name.
Three facts are carried forward rather than acted on. **(a)** The SOQ's strip is the single
**2027-04-16** SPX series, whose window contains **Good Friday 2027-03-26** — 21 trading sessions
where a clean strip has 22. **(b)** That implies a ~0.48-point mechanical drag which **this session
tested and could not find in the price**; the strong form is refused, and the refusal is the
document's main output. **(c)** The contract stops trading **09:00 ET**, ~5 hours before the
**14:00 ET** FOMC decision (`estimate`), so FOMC-day vol exposure lives in April's `VX/J7` or in
SPX options, never in the expiring March line. At **D-193** the far curve is a level and not
information — `VX/H7` fell **0.13** on the week's hawkish payrolls print while the front month rose
— so later pulses should not read `VX/H7` as a March-2027 forecast until it is genuinely front-dated.

**Kill switches:**

- **Cboe publishes a March-2027 VIX settlement date other than 2027-03-17** — the confirmation
  flipped in this PR reverts to `estimate` and the corridor re-dates. Re-check both surfaces (the
  settlement page and the CSV endpoint) at every pulse rather than trusting this row.
- **The NYSE publishes a 2027 calendar without a 2027-03-26 closure** — the strip returns to 22
  sessions, leg 3's whole test loses its subject, and `FT-vix-expiration-2027-03-17-2` is void.
  Re-check `nyse.com/markets/hours-calendars` by **2027-01-04**.
- **`VX/H7`'s log-fit residual against the listed VX curve turns materially negative (≤ −0.10) at any
  pulse before 2027-03-16** — the holiday drag would be pricing in as the strip nears, leg 3's
  refusal becomes a live question, and the sheet is rebuilt on the newer data. This is
  `FT-vix-expiration-2027-03-17-2` and its falsifier is the same observation.
- **The 2026-09-16 sibling test (`FT-vix-expiration-2026-09-16-1`) scores a kill** — one FOMC-morning
  VIX settlement printing *below* its own cash close makes the replication registered here a test of
  a dead mechanic; re-specify rather than repeat. Observe **2026-09-16**.
- **The March 2027 FOMC moves off 03-16/03-17, or the decision is released off its 14:00 ET slot** —
  leg 5's "settles before the news" placement note dies. Observe by **2027-01-27**, when the January
  FOMC confirms the March slot.
- **`VX/H7` trades below VIX cash before 2027-03-17 (front-month backwardation at the March line)** —
  the market has stopped paying for the window, leg 4's "the far end is a level" framing inverts, and
  the guard needs re-reading rather than repeating.
- **A house vol/opex instrument gets built and back-tested** — legs 3, 5 and 7 all stop being
  mechanics-plus-citation and start being data; this sheet is then rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-03-17.md`](../forward-tests/vix-expiration-2027-03-17.md):
`FT-vix-expiration-2027-03-17-1`, the deliberate **replication** of the September sibling's
mechanic test (the 2027-03-17 VRO prints **above** the same day's VIX cash close, because the
documented FOMC-day vol decline lands entirely after the 09:00 ET settlement), scored 2027-03-17
from Cboe's published settlement value; and `FT-vix-expiration-2027-03-17-2`, the **holiday-drag
refusal** made falsifiable (`VX/H7`'s log-fit residual against the listed VX curve never reaches
≤ −0.10 before settlement), scored 2027-03-16 by re-running this session's own computation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-193 | Initial research banked; probe-ref seeded (no symbols, **VIX 14.53** at the 2026-09-04 close read this session off Cboe's own index history CSV after Yahoo — the endpoint this repo's probe uses — returned **HTTP 429** on every attempt across two backoff rounds, recorded as a fetch failure and replaced with a better primary, not worked around; band `low:15+`; 5 adjacents). **Date flipped `estimate` → `confirmed` (`OCC:`)** off two Cboe primaries fetched today: the settlement page (HTTP 200, 536,634b) listing **`VX/H7` expiring 2027-03-17** with settlements **20.7295** (09-04) / **20.8641** (09-03), and the CSV endpoint `?dt=2026-09-04` (HTTP 200, 1,731b) returning **`VX,VX/H7,2027-03-17,20.7295`**; 2027-03-17 is a Wednesday exactly 30 days before April's third Friday 2027-04-16. **Headline: the one structurally new thing about this event versus its September 2026 sibling is that its 30-day strip contains a market closure — and this session tested the drag that implies and could not find it in the price.** Strip = the single **2027-04-16** SPX series, window 03-18 → 04-16, containing **Good Friday 2027-03-26** (NYSE table re-fetched, HTTP 200, 109,148b): **21 trading sessions vs 22** for a clean strip, implying `1−√(21/22)` ≈ **0.48 points** of mechanical bias at 20.73. Tested two ways across all nine listed VX contracts (sessions: U6 22, V6 22, X6 21, Z6 20, F7 21, G7 22, **H7 21**, J7 22, K7 21): a business-time correction scan finds the optimum at **λ≈0.2** with **λ=1 strictly worse than λ=0** (total |kink| 2.204 vs 1.721), and a `log(dte)` residual regression gives corr(deficit, residual) **−0.72**/−0.69 but carried **entirely by `VX/Z6`** (deficit 2, residual −0.55), which is over-determined by the year-end vol lull — while **`VX/H7`'s own residual is +0.16/+0.14, i.e. rich, not cheap**. Verdict **REFUTED (strong form) / MIXED (weak)**; the two tests disagree on H7's sign, which is the tell that neither is a result. **Anomaly resolved:** the [`opex-2027-03-19`](opex-2027-03-19.md) ledger's unexplained `VX/K7 - 2027-05-18` Tuesday row is explained by **Juneteenth observed Friday 2027-06-18** closing June's third Friday, moving the June SPX expiration to **Thu 2027-06-17** (corroborated by the same page's `VA/M7 - 2027-06-17` row); 06-17 − 30d = Tue 05-18. The rule anchors to the actual SPX expiration, and **2027-04-16 is holiday-clean**, so this event's anchor does not move. Adjacency — **peers:** none (`symbols: []`; no tracked-name print in the corridor). **Macro:** FOMC **2027-03-17 14:00 ET** (`estimate`, first SEP of 2027) is ~5h after the 09:00 ET settlement; BoJ **03-18**, Japan CPI + witching **03-19**, S&P rebalance reference close **03-12** — all `estimate`, all already on the calendar. **Volatility regime:** no prior reading to diff (baseline row); Cboe primary closes 09-04 **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; term structure 09-04 U6 **16.2669** → K7 **21.15**, monotone contango, `VX/H7` **20.7295** = **+6.20** over cash. On the hawkish 09-04 payrolls print the curve split — cash and front **up** (VIX 14.32→14.53, U6 +0.1288, V6 +0.0371), everything from X6 out **down** (**H7 −0.1346, −0.65%**): at D-193 the far end is a level, not information. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** `trade-playbooks.md` + `multi-symbol-sweep.md` grepped for `opex\|expiration\|witching\|volatility settlement\|SOQ` → **zero hits**, re-verified not inherited. Surface qualifications logged: **`VXM/H7` is not yet listed** (VXM rows stop at G7) and the 09-04 **CSV omits `VX/K7`** though the HTML table carries it — neither touches H7, which appears on both. **One dated adjacency proposed:** `opex-2027-04-16` (`estimate`) — the SPX expiration the VRO is literally computed from, the constitutive input this calendar was missing. Deliberately **not** proposed: the remaining quarterly VIX expirations (repetitions) and `juneteenth-market-closure-2027-06-18` (dated and NYSE-sourced, but three months out of corridor). **Forward tests `FT-vix-expiration-2027-03-17-1` and `-2` registered.** | — (stance set) | 2026-10-05 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
