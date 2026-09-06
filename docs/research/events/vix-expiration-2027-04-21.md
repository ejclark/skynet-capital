# VIX futures April 2027 expiration (SOQ settlement) — vix-expiration-2027-04-21

**Kind:** opex · **Date:** 2027-04-21 (confirmed, OCC: two Cboe primaries fetched direct 2026-09-05 — the settlement page (HTTP 200, 536,888 bytes) lists `VX/J7 - 2027-04-21` with real daily settlements 21.0267 (09-04) and 21.1500 (09-03), and the machine-readable CSV `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200, 1,731 bytes) carries the same row as `VX,VX/J7,2027-04-21,21.0267`; 2027-04-21 is a Wednesday exactly 30 calendar days before 2027-05-21, May's third Friday, an unadjusted Friday with no NYSE closure) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["opex-2027-04-16","fomc-blackout-start-2027-04-17"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and this event's job in the set is to be the control that kills a second
mechanical story.** April 2027's VIX settlement is the **exact mirror image** of its March sibling.
March settled **on** an FOMC decision morning and measured a **decision-free** 30-day window; April
settles **inside** the April FOMC blackout (opens 2027-04-17, `estimate`) and measures a window —
**2027-04-22 → 2027-05-21**, holiday-clean, **22 trading sessions** — that **contains** the
**2027-04-28** FOMC decision (`estimate`). That is a real, quantifiable claim: if an FOMC session
carries ~2× an ordinary session's variance, `VX/J7` should sit **~0.47 points rich**. Stack it against
the sibling's Good-Friday drag, which says `VX/H7` should sit **~0.48 points cheap**, and the two
stories jointly demand about **0.95 points** of separation between two neighbouring contracts. **This
session measured it on Cboe's own curve: 0.025 points** (2026-09-04), and **−0.004 — the wrong sign —**
a day earlier. Duration alone explains 0.2725 of their 0.2972 raw gap. Broaden it and the FOMC story
does not even hold its sign: `corr(FOMC-in-strip, residual)` is **+0.11** across all nine listed VX
contracts but **−0.54** once `VX/Z6` is dropped. The synthesis, and the one line worth carrying
forward: **the far VX curve prices duration, not contents** — `log(days-to-expiry)` alone explains
**97.4%** of its cross-sectional level (**99.5%** excluding the year-end and front contracts).
Output: one execution guard, one refusal made falsifiable, one sibling statistic decomposed, one
surface anomaly resolved. The date is flipped **`estimate` → `confirmed`** in this PR. Impact stays
**low** on purpose, and nothing here licenses a position.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D-228, `symbols: []`, and the playbook grep re-run this session returns **zero** opex/vol-settlement hits across `trade-playbooks.md` and `multi-symbol-sweep.md`; a settlement mechanic 228 days out has no read on today's tape | A house vol/opex instrument being built and back-tested before **2027-04-21** — the "no playbook is keyed to this" leg goes stale and this sheet is rebuilt on measured data instead of mechanics |
| This week | **Stand aside; the live vol-settlement question this week is 2026-09-16, not 2027-04-21** | High | The September 2026 VIX expiration is 11 days out with its own ledger and its own registered forward test; nothing in the 2026-09-07 → 2026-09-11 tape is `VX/J7`-keyed | Cboe publishing, before **2026-09-11**, an April-2027 VIX settlement date other than 2027-04-21 — the confirmation flipped in this PR reverts and the corridor re-dates |
| This month | **Do not buy the FOMC-in-strip premium story** — this session tested it and it failed on sign as well as size | Medium | Theory wants **+0.24 to +0.94** points in `VX/J7` (k = 1.5–3× FOMC-day variance); the observed FOMC-vs-no-FOMC residual gap is **+0.058** points, inside the no-FOMC group's own **−0.55 → +0.27** spread, and the correlation flips to **−0.54** when one point is removed | Re-running this session's computation on a later Cboe settlement page and finding `VX/J7`'s residual exceeding `VX/H7`'s by **≥ +0.50** — the two mechanical stories would then be pricing in and the refusal converts to a live question. Registered as **FT-vix-expiration-2027-04-21-1**, score by 2027-03-16 |
| This quarter | **Watch one thing: whether the sibling's −0.72 holiday-drag correlation survives `VX/Z6` leaving the board on 2026-12-16** | Medium | This session decomposed that number rather than inheriting it — drop `VX/Z6` and it halves to **−0.37**; drop `VX/U6` too and the sign returns (**−0.73**) but on residuals whose entire range is **0.24 points**, against the 0.48 the theory demands. The sign survives every specification; the magnitude never does | The first pulse after **2026-12-16** measuring `corr(session-deficit, residual)` at **≤ −0.60** across the then-listed VX monthlies — the drag would be a curve-wide effect rather than one over-determined December point. Registered as **FT-vix-expiration-2027-04-21-2**, score by 2027-01-05 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-04-21 VIX settlement. The date is
  now `confirmed`, which removes the date objection and changes nothing else: no house playbook is
  opex- or vol-settlement-keyed (grepped this session, zero hits in both docs).
- **Execution guard (the only actionable line here):** nothing trades the **2027-04-21 opening
  auction** — the April VIX complex AM-settles into it and the vol complex's first prints that
  morning are settlement artifacts, not information. Same guard both siblings carry.
- **Structural placement, not a call:** this contract stops trading **09:00 ET on 2027-04-21**,
  inside the FOMC blackout (`fomc-blackout-start-2027-04-17`, `estimate`) and with the **04-28**
  decision (`estimate`) **5 sessions later** — so it expires before the meeting while its own
  settlement window *contains* it. Post-decision vol exposure lives in `VX/K7` (2027-05-18) or in SPX
  options, never in the expiring April line.
- **The refusal this document banks:** the FOMC-in-strip premium is **not in the price** (+0.058
  observed against +0.24…+0.94 theoretical, and not sign-stable). Paired with the sibling's
  Good-Friday refusal, the generalisation is that the far curve does not price strip *contents* at all.
- **Term structure as of 2026-09-04 (Cboe daily settlements):** U6 **16.2669** · V6 18.1384 ·
  X6 18.7688 · Z6 18.9750 · F7 19.9997 · G7 20.4603 · H7 20.7295 · **J7 21.0267** · K7 21.1500 —
  monotone contango. J7's 21.03 is **+6.50 over VIX cash (14.53)**: the vol risk premium's far end,
  not an April-2027 forecast.
- **The dated evidence for "the far end is dead":** on the hawkish **2026-09-04** payrolls print,
  Cboe's 09-03 → 09-04 settlement changes were U6 **+0.1288** and V6 **+0.0371** while everything from
  X6 out **fell** (**J7 −0.1233, −0.58%**). Opposite sign to cash and the front month.
- **Corridor (all `estimate`):** monthly expiration **04-16** → FOMC blackout opens **04-17** → this
  settlement **04-21** → FOMC + BoJ **04-28**. Only the first two are inside the ±5-day window.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At
  D-228 those describe a different expiry entirely; they become quotable from about **2027-04-14**.

## Initial research

### The question

Three VIX expirations are already researched in this repo (2026-09-16, 2027-02-17, 2027-03-17) and the
seeding note for this one was written by a *fourth* ledger's sweep. So the honest question is not
"what happens on 2027-04-21" — it is: **does this event carry anything the set does not already own,
and if it does, does that thing survive contact with the data?**

**One-line verdict:** yes — this is the only VIX settlement in the tracked set whose 30-day strip
**contains an FOMC decision**, which makes it the natural experiment for a second mechanical
strip-contents story, and **that story fails harder than the first one did**: it loses its sign, not
just its size.

### Method

Macro/mechanics mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no earnings-style
instrument applies (`earnings-cycle.mjs` / `intraday-edges.mjs` are symbol-keyed; this event has
`symbols: []`) and no opex- or vol-shaped instrument exists in `scripts/research/`. Nothing was
inherited from the sibling ledgers: every primary was re-fetched and every number below recomputed
from it, which is why leg 4 can decompose a sibling's statistic instead of quoting it.

- **Cboe** `cboe.com/us/futures/market_statistics/settlement` (HTTP 200, **536,888** bytes), parsed
  into **104** symbol/expiry/price rows across 14 product roots and the two published settlement
  dates (2026-09-04 and 2026-09-03), weekdays computed on every row.
- **Cboe** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200,
  **1,731** bytes) — the machine-readable second surface, used as independent confirmation.
- **NYSE** `nyse.com/markets/hours-calendars` (HTTP 200, **109,180** bytes), holiday table parsed
  cell-by-cell for 2026/2027/2028.
- **Cboe index history CSVs** (`cdn.cboe.com/api/global/us_indices/daily_prices/…`, HTTP 200) for
  **VIX** (472,309 bytes), **VIX9D** (200,183), **VIX3M** (217,642) and **VVIX** (108,498).
- **Own computation:** trading-session counts and FOMC-membership for all nine listed `VX` contracts'
  30-day strips; an OLS fit of settlement on `log(days-to-expiry)` with residuals, re-fit three ways
  (all nine, ex-`Z6`, ex-`Z6`+`U6`); group means and correlations against both session deficit and
  FOMC-in-strip. All arithmetic is reproducible from the numbers quoted in legs 2–4.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
  for `opex|expiration|witching|volatility settlement|SOQ`; `src/domain/market-events/` for the
  corridor and the strip's contents; the [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md)
  and [`opex-2027-04-16`](opex-2027-04-16.md) ledgers for what was already banked.
- **One failed route, recorded not worked around:** `query1.finance.yahoo.com` — the endpoint this
  repo's own probe (`scripts/event-material-scan.mjs`) reads — returned **HTTP 429** to this runner,
  as it did to the March sibling. Every index level here is this session's own read off Cboe's
  primary CSVs instead. Today is **Saturday 2026-09-05**, so the 2026-09-04 close is the freshest
  close that exists, not a stale one.

### Conviction legs, tested

1. **The date is right, and this PR promotes it to `confirmed` — SUPPORTED.** The seeding entry filed
   `estimate` explicitly because "this lane may not self-confirm an event it discovered in-sweep," and
   said in as many words that the entry was "confirm-ready at its own initial research." This is that
   research, the sanctioned venue for the flip, and the same move both the
   [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md) and
   [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) siblings made on identical grounds. Two
   independent Cboe surfaces were fetched today: the HTML settlement page lists **`VX/J7` expiring
   2027-04-21** with real daily settlements against it (**21.0267** on 09-04, **21.1500** on 09-03),
   and the CSV endpoint for the same date returns **`VX,VX/J7,2027-04-21,21.0267`**. The arithmetic
   checks independently: **2027-04-21 is a Wednesday exactly 30 calendar days before 2027-05-21**,
   May's third Friday, which NYSE's own 2027 column leaves unadjusted (nearest closures: Good Friday
   03-26 and Memorial Day 05-31). `OCC:` is the prefix `market-events-data.ts` defines for exactly
   this class. The flip removes a date objection and licenses nothing — every call here is a
   stand-aside either way.

2. **This is the mirror image of the March settlement, and it is the only strip in the set that
   contains an FOMC — SUPPORTED, and it is what makes this ledger more than a pointer.** VIX contracts
   AM-settle to a VRO struck from the opening auction of a **single** SPX/SPXW series exactly 30 days
   out — here **2027-05-21** — so this settlement measures the window **2027-04-22 → 2027-05-21**.
   Three properties, each computed this session:

   - **The window is holiday-clean: 22 trading sessions**, the full count. Good Friday 2027-03-26 is
     three weeks before it and Memorial Day 2027-05-31 ten days after. So the sibling's Good-Friday
     drag has **no subject here** — which is precisely what makes `VX/J7` the control for it.
   - **The window contains the 2027-04-28 FOMC decision** (`fomc-2027-04-28`, `estimate`), and the BoJ
     decision the same day (`boj-decision-2027-04-28`, `estimate`). Running FOMC-membership across all
     nine listed VX strips: **six contain one** (V6, X6, F7, G7, **J7**, K7) and **three do not** (U6,
     Z6, **H7**). This event is in the majority class — but its neighbour is not, which is the pair
     leg 3 exploits.
   - **The settlement itself is Fed-silent.** The contract stops trading **09:00 ET on 2027-04-21**,
     inside the April blackout (`fomc-blackout-start-2027-04-17`, `estimate`, which opens 00:00 ET on
     the second Saturday before the meeting). The settlement day and the decision day are the
     endpoints of a **6-session span** (04-21, 22, 23, 26, 27, 28), i.e. **5 sessions after** this
     settlement — reconciling this session's own count with the seeding note's "6 sessions," which
     counts the endpoints rather than the gap. So: **March settled on the news with no news in its
     window; April settles in silence with the news inside its window.**

3. **The FOMC-in-strip premium — REFUTED, and it fails on sign as well as magnitude.** *The mechanic.*
   If an FOMC session carries `k` times an ordinary session's variance, a 22-session strip containing
   one is worth `√((21+k)/22) − 1` more in vol terms: at **k = 1.5, +1.13% (+0.238 pts)**; at
   **k = 2, +2.25% (+0.473)**; at **k = 3, +4.45% (+0.935)**, all against `VX/J7`'s 21.0267. Same
   order of magnitude as the sibling's holiday drag (`1 − √(21/22)` = 2.30%, ≈0.48 points) and,
   crucially, **opposite in sign across the H7/J7 pair**.

   *The pairwise test — the sharpest read available, because duration is nearly controlled.* `VX/H7`
   (D-194, 21 sessions, no FOMC, Good Friday inside) and `VX/J7` (D-229, 22 sessions, FOMC inside,
   holiday-clean) are adjacent listings 35 days apart. The two stories jointly predict roughly
   **0.95 points** of separation (0.48 of drag on H7 + 0.47 of premium on J7 at k = 2). Observed: the
   raw gap is **0.2972** points (20.7295 → 21.0267), of which the `log(dte)` fit's own slope
   (**1.6437**) attributes **0.2725** to duration alone — `1.6437 × ln(229/194)`. That leaves
   **+0.0247 points** for two stories demanding thirty-eight times as much. On the previous settlement
   date the leftover is **−0.0037** — the **wrong sign**.

   *The cross-sectional test.* OLS of settlement on `log(dte)` across all nine contracts, residuals
   grouped by FOMC-membership: mean **+0.0195** (n = 6, range −0.237 → +0.186) against **−0.0390**
   (n = 3, range −0.552 → **+0.273**). The 0.058-point gap is the right sign and **4–16× too small**,
   and it sits well inside the no-FOMC group's own spread. `corr(FOMC-in-strip, residual)` is
   **+0.112** (09-04) / +0.109 (09-03) — but **−0.544** once `VX/Z6` is dropped and **−0.241** once
   `VX/U6` goes too. **A correlation that flips sign when one of nine points leaves is not a result.**

   *Verdict.* **REFUTED.** The holiday drag at least kept its sign under every specification the March
   sibling tried; this one does not. Recorded because a plausible edge killed cheaply, before anyone
   sized it, is worth more than a plausible edge described.

4. **The far VX curve prices duration, not contents — SUPPORTED, and it decomposes a sibling's
   statistic rather than inheriting it.** The `log(dte)` fit (slope **1.6437**, intercept **11.9091**)
   explains **R² = 0.9739** of the nine-contract cross-section, with residual sd **0.2789** — which is
   itself the reason neither contents story is testable here: **the effects being hunted are the same
   size as the noise the fit leaves.** Re-fitting is more informative than the level:

   | Fit | n | R² | corr(session-deficit, res) | corr(FOMC-in-strip, res) | residual range |
   |---|---|---|---|---|---|
   | all listed VX | 9 | 0.9739 | **−0.719** | +0.112 | −0.552 → +0.273 |
   | ex `VX/Z6` (year-end lull) | 8 | 0.9902 | **−0.370** | −0.544 | −0.306 → +0.207 |
   | ex `VX/Z6`, `VX/U6` (front) | 7 | 0.9947 | **−0.729** | −0.241 | −0.144 → +0.096 |

   Read the deficit column across the row, which is what the March sibling could not do from inside
   its own frame: **the sign survives every specification and the magnitude never does.** Dropping the
   one over-determined December point halves the correlation; dropping the front month restores it —
   but by then the *entire* residual range is **0.240 points**, so a −0.73 correlation is describing an
   effect of at most ~0.1 points where the theory demands 0.48. And R² climbing to **0.9947** as the
   two special contracts leave says the plain truth about this curve: **duration explains it, and
   what each strip contains does not measurably.** That is the generalisation the two refusals
   support, and it is a stronger statement than either one alone.

5. **At D-228 the far curve is a level, not information — SUPPORTED, dated and quantified.** VIX cash
   closed **14.53** on 2026-09-04 (Cboe's own index history CSV, read this session) while `VX/J7`
   settled **21.0267** — a **+6.50-point** basis that is the standing vol risk premium, not a forecast
   of elevated April-2027 volatility. Reading it as one is the single most available error on this
   event. The dated evidence: on **2026-09-04**, August payrolls printed hawkish (+162k against
   ~53–55k consensus — BLS, as recorded by the sibling ledgers), and Cboe's 09-03 → 09-04 settlement
   changes split the curve. Cash and front end **up**: VIX 14.32 → **14.53** (+0.21), `VX/U6`
   **+0.1288**, `VX/V6` **+0.0371**. Everything from November out **down**: X6 −0.0871, Z6 −0.1248,
   F7 −0.1491, G7 −0.1893, H7 −0.1346, **J7 −0.1233 (−0.58%)**, K7 −0.1750. The week's biggest macro
   surprise moved the April-2027 line by **under six tenths of one percent**, in the *opposite*
   direction to cash. Configuration on the same date for the next pulse to diff against (all Cboe
   primary closes, 2026-09-04): **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42** — a steeply
   upward-sloping front. Named as a configuration, **not** a forecast.

6. **A sibling's unexplained surface anomaly resolves — SUPPORTED, and the resolution is unglamorous.**
   The March ledger logged that the `?dt=2026-09-04` CSV "carries the VX list only through `VX/J7`" —
   no `VX/K7` row — while the HTML table for the same date had one; the `opex-2027-04-16` ledger then
   recorded that its own fetch *did* carry `VX/K7`, marking the discrepancy "unexplained." This
   session's fetch of the same URL is **1,731 bytes — byte-identical to the size both siblings
   recorded** — and contains `VX,VX/K7,2027-05-18,21.15`. An identical byte count on an unchanged URL
   is not a source that changed; it is **the same payload parsed two ways**. The omission was a parse
   artifact, not a Cboe surface gap. Worth one line because a "surface discrepancy" left open is
   exactly the kind of thing a later pulse inherits as evidence of instability that was never there.
   The genuinely open qualification is unchanged and re-verified: **`VXM/J7` is not listed** — the
   Mini-VIX rows on both surfaces stop at **`VXM/G7` (2027-02-17)** — so nothing here may be asserted
   about a Mini-VIX leg, and this entry rests on the `VX` row alone.

7. **No house playbook is opex- or vol-settlement-keyed — SUPPORTED, re-verified rather than
   inherited.** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped this
   session for `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**. S1/G1 are
   earnings-dated run-up plays, S2 the never-hold-the-print guard, S3 a reaction-day fade, S4 a
   structural close-side preference, E1 a don't-trade-the-open execution rule. The one real
   interaction is that **E1 gains a reason on 2027-04-21** — a VRO auction stacked on one open. That
   sharpens an existing execution rule; it is not a new signal.

8. **The corridor is complete and this sweep proposes nothing — SUPPORTED, and the refusal is
   deliberate.** Within ±5 days of 2027-04-21 the calendar already carries
   `opex-2027-04-16` and `fomc-blackout-start-2027-04-17` (both `estimate`); the strip window beyond it
   carries `fomc-2027-04-28`, `boj-decision-2027-04-28` and `pjm-capacity-auction-2027-05`
   (2027-05-15). The one dated item this analysis touches that the calendar lacks is
   **`opex-2027-05-21`**, the SPX series the VRO is literally computed from — and it is **deliberately
   not proposed**. The March sibling filed `opex-2027-04-16` on exactly that "constitutive input"
   rationale, and **that entry's own initial research then refuted the rationale**: the +30-day rule
   lands on a third-Friday SPX expiration nine times out of nine, so "the strip a VIX settlement is
   computed from" is *what a monthly expiration is*, not a distinguishing feature. Re-using a framing
   the calendar has already corrected, to file a `medium`-impact entry that would trigger its own
   research cycle, would manufacture burden this run cannot justify. What is worth recording instead,
   and routing rather than acting on: the monthly-opex series has **gaps** (`2027-01-15` and
   `2027-05-21` are both absent while 2026-08 through 2027-04 are otherwise continuous), so whether
   this calendar wants complete monthly coverage is a **seeding decision for the calendar**, not a
   call one VIX ledger should make unilaterally.

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A refusal, and the generalisation it completes.** The FOMC-in-strip premium is not in the price —
  and it fails worse than the Good-Friday drag did, losing its sign under respecification. With two
  independent contents stories now refuted on the same curve, the defensible statement is the general
  one: **the far VX curve prices duration (R² 0.974 → 0.995), not strip contents.**
- **A decomposition.** The sibling's `corr(deficit, residual) = −0.72` is sign-stable and
  magnitude-unstable; at the specification where the sign is strongest the residuals span 0.24 points
  against a theory demanding 0.48. Registered as a forward test rather than left as a reading.
- **An execution guard.** Nothing enters, exits or resizes on the **2027-04-21 opening auction**.
  Inherited from both siblings, unchanged.
- **A placement note.** This contract expires **5 sessions before** the FOMC whose decision sits
  *inside* its own settlement window — structural, not directional.

### Honest limits

The **date** is now confirmed; everything trading-adjacent remains mechanics or `estimate`-grade
context, and every adjacent event in the corridor (`fomc-2027-04-28` included) is `estimate` and
carries its own tentative-until-confirmed caveat. The settlement prices are Cboe **daily settlements**
for 2026-09-04 and 2026-09-03, not live quotes, and index levels are **closes for 2026-09-04** — the
freshest that exist on a Saturday, but there is no intraday read here. **One data route failed**:
Yahoo, the endpoint this repo's own probe reads, returned HTTP 429, so the probe's next pulse will
diff a Cboe-sourced VIX against a Yahoo-sourced one; a small source discrepancy there is expected
rather than alarming. Leg 3's statistics are **nine contracts and two settlement dates** — enough to
refuse a story, never to establish one — and the `k` in the FOMC-variance formula is an *assumption*
(1.5–3× is a plausible range, not a house-measured number), so the refutation rests on the observed
gap being far too small for **any** plausible `k`, not on a fitted one. Leg 4's three fits share eight
of nine points, so their R² progression is descriptive, not an out-of-sample result. The
business-time and event-premium arguments are both textbook option mechanics, not house-validated
results, and no house instrument tests either — which is exactly why they are being refused rather
than inverted into trades. Nothing about same-day VIX open interest by strike or SPX gamma is quoted:
at D-228 that describes a different expiry and would be false precision. Educational,
paper-standard throughout.

## Stance & kill switches

**Stance (date `confirmed` as of 2026-09-05, Cboe-sourced; every adjacent event `estimate`).** Treat
**2027-04-21, 09:30 ET** as a known-date, **low-impact microstructure marker** and never as a
tradeable event. No position is opened, closed or sized because of it, and the promotion from
`estimate` to `confirmed` in this PR changes that not at all. One guard applies: **nothing executes on
that day's opening auction**, on any name. Three facts are carried forward rather than acted on.
**(a)** This settlement is the **mirror image** of the March one: it is struck **inside** the April
FOMC blackout, **5 sessions before** the 04-28 decision (`estimate`), and its 30-day strip
(**2027-04-22 → 2027-05-21**, holiday-clean, 22 sessions) **contains** that decision — where March
settled on the decision morning with a decision-free strip. **(b)** The event premium that implies
(**+0.24 to +0.94** points at k = 1.5–3) is **not in the price**: the H7↔J7 residual gap is
**+0.025** points where the two contents stories jointly demand ~0.95, and it is **−0.004** a day
earlier. Refused, and refused harder than the sibling's drag because the correlation flips sign
(+0.11 → −0.54) when one point leaves. **(c)** The generalisation both refusals now support:
`log(days-to-expiry)` explains **97.4%** of this curve's cross-section (**99.5%** ex-`Z6`/`U6`), so
**the far VX curve prices duration, not contents** — later pulses should not read `VX/J7` as an
April-2027 forecast until it is genuinely front-dated, and should note that on the week's hawkish
payrolls print it fell **0.12** while the front month rose.

**Kill switches:**

- **Cboe publishes an April-2027 VIX settlement date other than 2027-04-21** — the confirmation
  flipped in this PR reverts to `estimate` and the corridor re-dates. Re-check both surfaces (the
  settlement page and the CSV endpoint) at every pulse rather than trusting this row.
- **`VX/J7`'s `log(dte)`-fit residual exceeds `VX/H7`'s by ≥ +0.50 at any pulse before 2027-03-16** —
  the contents stories would be pricing in as both strips near, leg 3's refusal becomes a live
  question, and the sheet is rebuilt on the newer data. This is `FT-vix-expiration-2027-04-21-1`.
- **The first pulse after 2026-12-16 measures `corr(session-deficit, residual) ≤ −0.60`** with
  `VX/Z6` off the board — the holiday drag would be a curve-wide effect rather than one
  over-determined point, and leg 4's "sign survives, magnitude never does" framing needs rebuilding.
  This is `FT-vix-expiration-2027-04-21-2`; observe by **2027-01-05**.
- **The April 2027 FOMC moves off 04-27/04-28, or lands outside this strip's 04-22 → 05-21 window** —
  leg 2's mirror-image framing and leg 3's whole test lose their subject. Observe by **2027-02-24**,
  when the January FOMC's minutes and the Fed's own calendar confirm the April slot.
- **The NYSE publishes a 2027 calendar with any closure between 2027-04-22 and 2027-05-21** — the
  strip stops being the clean 22-session control that makes the H7↔J7 pair readable. Re-check
  `nyse.com/markets/hours-calendars` by **2027-01-04**.
- **`VX/J7` trades below VIX cash before 2027-04-21 (backwardation at the April line)** — the market
  has stopped paying for the window, leg 5's "the far end is a level" framing inverts, and the guard
  needs re-reading rather than repeating.
- **A house vol/opex instrument gets built and back-tested** — legs 3, 4 and 7 all stop being
  mechanics-plus-citation and start being data; this sheet is then rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-04-21.md`](../forward-tests/vix-expiration-2027-04-21.md):
`FT-vix-expiration-2027-04-21-1`, the **contents refusal made falsifiable** on the pair this event
uniquely enables (`VX/J7`'s residual never exceeds `VX/H7`'s by ≥ +0.50 before H7 expires), scored
2027-03-16; and `FT-vix-expiration-2027-04-21-2`, the **decomposition of the sibling's −0.72
correlation** (with `VX/Z6` off the board the deficit correlation is weaker than −0.60), scored
2027-01-05. A third candidate was **declined rather than registered**: predicting `VX/J7`'s basis to
VIX cash at D-1 is near-trivially true by convergence — cash on 2027-04-20 measures almost the same
window this contract does — and a test that cannot fail is not a test.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-228 | Initial research banked; probe-ref seeded (no symbols, **VIX 14.53** at the 2026-09-04 close read off Cboe's own index-history CSV after Yahoo — this repo's probe endpoint — returned **HTTP 429**, recorded as a fetch failure and replaced with a better primary; band `low:15+`; 2 adjacents). **Date flipped `estimate` → `confirmed` (`OCC:`)** off two Cboe primaries fetched today: the settlement page (HTTP 200, 536,888b) listing **`VX/J7` expiring 2027-04-21** with settlements **21.0267** (09-04) / **21.1500** (09-03), and the CSV `?dt=2026-09-04` (HTTP 200, 1,731b) returning **`VX,VX/J7,2027-04-21,21.0267`**; 2027-04-21 is a Wednesday exactly 30 days before May's third Friday **2027-05-21**, unadjusted (NYSE 2027 column re-fetched, HTTP 200, 109,180b). **Headline: this settlement is the mirror image of the March one — it settles INSIDE the FOMC blackout with the 04-28 decision INSIDE its strip, where March settled ON the decision with a decision-free strip — and the event premium that implies is not in the price either.** Strip = the single **2027-05-21** SPX series, window 04-22 → 05-21, **holiday-clean, 22 sessions**; of the nine listed VX strips, **six contain an FOMC** (V6, X6, F7, G7, **J7**, K7) and three do not (U6, Z6, **H7**). Theory wants `√((21+k)/22)−1` = **+0.24 / +0.47 / +0.94** pts at k = 1.5 / 2 / 3. **Pairwise test (the sharp one):** H7 (21 sessions, Good Friday, no FOMC) vs J7 (22, clean, FOMC) — the two contents stories jointly demand **~0.95 pts** of separation; the raw gap is **0.2972**, of which the `log(dte)` slope **1.6437** attributes **0.2725** to duration, leaving **+0.0247** (09-04) and **−0.0037** — wrong sign — (09-03). **Cross-section:** FOMC-group mean residual **+0.0195** (n=6) vs **−0.0390** (n=3), a 0.058 gap inside the no-FOMC group's own −0.552 → +0.273 spread; `corr(FOMC, res)` **+0.112** but **−0.544** ex-Z6 and **−0.241** ex-Z6/U6 — **not sign-stable**. Verdict **REFUTED**, harder than the sibling's drag. **Sibling statistic decomposed (leg 4):** re-fitting three ways gives R² **0.9739 → 0.9902 → 0.9947** and `corr(deficit, res)` **−0.719 → −0.370 → −0.729**, the last on residuals spanning only **0.240 pts** against a theory demanding 0.48 — **the sign survives every specification, the magnitude never does**; generalisation: **the far VX curve prices duration, not contents**. **Anomaly resolved:** the CSV's "missing `VX/K7`" recorded unexplained by two sibling ledgers is a **parse artifact** — today's fetch is **1,731 bytes, byte-identical** to both siblings' and carries `VX,VX/K7,2027-05-18,21.15`. Adjacency — **peers:** none (`symbols: []`). **Macro:** FOMC + BoJ **2027-04-28** (`estimate`) sit 5 sessions after this settlement and inside its strip; blackout opens **04-17**, monthly opex **04-16**. **Volatility regime:** no prior reading to diff (baseline row); Cboe closes 09-04 **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; term structure U6 **16.2669** → K7 **21.15**, monotone contango, **`VX/J7` 21.0267 = +6.50 over cash**. On the hawkish 09-04 payrolls print cash and front rose (VIX 14.32→14.53, U6 +0.1288) while everything from X6 out fell (**J7 −0.1233, −0.58%**). **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** `trade-playbooks.md` + `multi-symbol-sweep.md` grepped for `opex\|expiration\|witching\|volatility settlement\|SOQ` → **zero hits**, re-verified. **`VXM/J7` still not listed** (VXM rows stop at G7), so nothing rests on a Mini-VIX leg. **No adjacency proposed:** the corridor is complete, and `opex-2027-05-21` is **declined** — the `opex-2027-04-16` ledger already refuted the "constitutive input" rationale that would file it (the +30-day rule hits a third Friday 9/9, so that property is what a monthly expiration IS), and filing a medium-impact entry on a corrected framing would manufacture research burden; the monthly-opex series' gaps (**2027-01-15**, **2027-05-21**) are recorded as a calendar-seeding question, not acted on. **Forward tests `FT-vix-expiration-2027-04-21-1` and `-2` registered; a third declined** as near-trivially true by convergence. | — (stance set) | 2026-10-05 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
