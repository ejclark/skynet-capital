# VIX futures & options February 2027 expiration (SOQ settlement) — vix-expiration-2027-02-17

**Kind:** opex · **Date:** 2027-02-17 (confirmed, OCC: two Cboe primaries fetched direct 2026-09-05 — the settlement page (HTTP 200, 536,900 bytes) lists `VX/G7 - 2027-02-17` with real daily settlements 20.4603 (09-04) and 20.6496 (09-03), and the machine-readable CSV `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200, 1,731 bytes) carries the same row as `VX,VX/G7,2027-02-17,20.4603`; `VXM/G7` appears on both surfaces at the same price; 2027-02-17 is a Wednesday exactly 30 days before March's third Friday 2027-03-19) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["japan-cpi-2027-02-19","opex-2027-02-19","washingtons-birthday-market-closure-2027-02-15"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and the finding worth carrying out of this document inverts an intuition
rather than supporting a trade.** A VIX future settles to a Special Opening Quotation struck from a
*single* SPX series expiring exactly 30 days later, so the February contract `VX/G7` settles to a
measure of the window **2027-02-18 → 2027-03-19** — a window that **contains the March FOMC
(2027-03-17), the BoJ (03-18) and the March quarterly triple witching (03-19)**. The March contract
`VX/H7`, the one anybody would reflexively call "the March FOMC contract," settles at 09:00 ET on the
*morning* of that decision and its own window (03-18 → 04-16) **excludes it entirely**. So among
listed VIX futures, **the February line is the March-FOMC line and the March line is not** — a
structural placement fact, not a directional call. The same pairing also makes `VX/G7` the clean
control in the holiday-drag question its March sibling refused: G7's strip is **22 sessions**
(threading between Washington's Birthday 2027-02-15 and Good Friday 2027-03-26) against H7's **21**,
and the two contracts sit exactly **28 days** either side of each other — the cleanest paired
comparison on the curve. Both mechanics predict G7 rich to H7 by **~0.9 points combined**;
this session measured the actual gap at **0.08–0.15**, i.e. the market prices roughly **a tenth** of
it. Verdict: the mechanics are real, **the price does not carry them**, and because both stories
predict the same sign they cannot be separated at n = 9 anyway. The dated evidence that nobody trades
this contract as a policy instrument today: on the hawkish **2026-09-04** payrolls print, `VX/G7`
fell **more than any other listed contract** (−0.1893, **−0.92%**) while cash and the front month
rose. Output: one execution guard, one placement note, one control forward test, one refusal. Date
flipped `estimate` → **`confirmed`** in this PR off two Cboe surfaces. Impact stays **low** on purpose.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing on this sheet is sizeable | High | D-165, `symbols: []`, and the playbook grep re-run this session returns **zero** hits for `opex\|expiration\|witching\|volatility settlement\|SOQ` across `trade-playbooks.md` and `multi-symbol-sweep.md`; a settlement mechanic 165 days out has no read on today's tape | A house vol/opex instrument being built and back-tested before **2027-02-17** — the "no playbook is keyed to this" leg goes stale and this sheet is rebuilt on measured data instead of mechanics |
| This week | **Stand aside; the live vol-settlement question this week is 2026-09-16, not 2027-02-17** | High | The September 2026 VIX expiration is 11 days out with its own ledger and its own registered forward test; nothing in the 2026-09-07 → 2026-09-11 tape is `VX/G7`-keyed | Cboe publishing, before **2026-09-11**, a February-2027 VIX settlement date other than 2027-02-17 — the confirmation flipped in this PR reverts and the corridor re-dates |
| This month | **Do not buy either richness story on `VX/G7`** — this session measured them and the price carries ~a tenth | Medium | The FOMC-in-the-window mechanic (~0.46 pts on an *assumed* double-variance FOMC day) and the business-time holiday drag on H7 (~0.48 pts) both predict G7 rich to H7 by ~0.9 combined; the measured chord-excess gap is **+0.078** (09-04) / **+0.151** (09-03) — right sign, an order of magnitude short, and the two stories are not separable at n = 9 | Re-running this session's chord computation on a later Cboe settlement page and finding H7's chord excess **at or above** G7's — the ordering both mechanics predict would be gone, and the weak form dies rather than merely staying unpromoted. Registered as **FT-vix-expiration-2027-02-17-1**, score by 2027-02-16 |
| This quarter | **Watch one thing only: whether the two FOMC-morning sibling tests get their control** | Medium | Both siblings predict the VRO prints above the same-day cash close *because* the FOMC-day vol decline lands after the 09:00 ET settlement. 2027-02-17 carries no FOMC (the nearest is 2027-01-27, three weeks earlier), so it is the natural control — and without it the siblings' FOMC-specific reading is not identified by their own result | The **2026-09-16** sibling test scoring a clear kill — one FOMC-morning VIX settlement printing *below* its own cash close would make the control registered here a control for a dead mechanic, and it gets re-specified rather than run. Registered as **FT-vix-expiration-2027-02-17-2**, score by 2027-02-17 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-02-17 VIX settlement. The date is
  now `confirmed`, which removes the date objection and changes nothing else: no house playbook is
  opex- or vol-settlement-keyed (grepped this session, zero hits in both docs).
- **Execution guard (the only actionable line here):** nothing trades the **2027-02-17 opening
  auction** — the February VIX/VXM complex AM-settles into it and the vol complex's first prints that
  morning are settlement artifacts, not information. Same guard both siblings carry.
- **Placement note, not a call:** `VX/G7`'s settlement window **contains** the 2027-03-17 FOMC
  (`estimate`); `VX/H7`'s **does not**. If March-2027 policy vol is ever wanted in a VIX future, the
  February line is where it structurally lives — a fact to prevent a wrong instrument choice, never a
  reason to choose one.
- **The refusal this document banks:** the combined FOMC-window + holiday-drag richness of G7 over H7
  (~0.9 points predicted) is **8–16% present** in the curve. Do not build on either without re-testing.
- **Settlement-week structure:** Washington's Birthday **2027-02-15** (NYSE) makes it a **4-session
  week** — Tue 02-16, **Wed 02-17 (VIX SOQ)**, Thu 02-18, **Fri 02-19 (February monthly opex +
  Japan CPI)**. Two auctions of consequence in four sessions; proposed as this sweep's one calendar
  addition.
- **Term structure as of 2026-09-04 (Cboe daily settlements):** U6 **16.2669** · V6 18.1384 ·
  X6 18.7688 · Z6 18.9750 · F7 19.9997 · **G7 20.4603** · H7 20.7295 · J7 21.0267 · K7 21.1500 —
  a monotone contango curve. G7's 20.46 is **+5.93 over VIX cash (14.53)**: the vol risk premium's
  term structure, not a February-2027 forecast.
- **The dated evidence for "nobody trades this as a policy instrument yet":** on the hawkish
  **2026-09-04** payrolls print, Cboe's 09-03 → 09-04 settlement changes were U6 **+0.1288** and
  V6 **+0.0371** while every contract from X6 out fell — and **`VX/G7` fell the most of the nine**
  (**−0.1893, −0.92%**), despite being the only listed contract whose window contains the March FOMC.
- **Corridor (all `estimate`):** Washington's Birthday closure **02-15** (proposed here) → this
  settlement **02-17** → February monthly opex + Japan CPI **02-19**. Detail on the equity expiration
  lives in the sibling [`opex-2027-02-19`](opex-2027-02-19.md) ledger, not here.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At
  D-165 those describe a different expiry entirely; they become quotable from about **2027-02-10**.

## Initial research

### The question

Two sibling ledgers already exist — [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md) and
[`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) — and the seeding entry for this one
filed it as another instance of the same mechanic. If that is all it is, the honest output is a
pointer and nothing else. So: **what does the February 2027 VIX settlement carry that neither sibling
does, and does it survive contact with Cboe's own curve?**

**One-line verdict:** it carries two things — a settlement window that *contains* the March FOMC that
its March sibling settles *before*, and the clean-strip control for the holiday-drag question that
sibling refused — and this session's measurement says **the market prices about a tenth** of what
both mechanics jointly predict, so the output is a placement note plus a second banked refusal.

### Method

Macro/mechanics mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no earnings-style
instrument applies (`earnings-cycle.mjs` / `intraday-edges.mjs` are symbol-keyed; this event has
`symbols: []`) and no opex- or vol-shaped instrument exists in `scripts/research/`. This session did
not inherit the sibling ledgers' numbers: every primary was re-fetched and re-parsed, and the
sibling's session counts were recomputed from scratch before being compared.

- **Cboe** `cboe.com/us/futures/market_statistics/settlement` (HTTP 200, 536,900 bytes) — the page is
  an escaped React-payload, not HTML table markup; unescaped and parsed into **100** symbol/expiry/
  price rows across the two published settlement dates (**2026-09-04** and **2026-09-03**).
- **Cboe** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200,
  1,731 bytes) — the machine-readable second surface, used as independent confirmation.
- **NYSE** `nyse.com/markets/hours-calendars` (HTTP 200, 109,180 bytes), holiday table parsed
  cell-by-cell for 2026/2027/2028.
- **Cboe index history CSVs** (`cdn.cboe.com/api/global/us_indices/daily_prices/…`, HTTP 200) for
  **VIX** (472,309 bytes), **VIX9D**, **VIX3M**, **VVIX** — every index level quoted below is this
  session's own read off that primary. Yahoo was not used; the March sibling recorded it returning
  HTTP 429 to this runner and Cboe's own history is the better primary regardless.
- **Own computation:** trading-session counts for all nine listed `VX` contracts' 30-day strips
  against that holiday table; an OLS fit of settlement on `log(days-to-expiry)` with residuals; a
  **local chord test** (each interior contract against the linear and log-space interpolation of its
  two neighbours) — a different specification from the sibling's global fit, chosen because the
  F7/G7/H7 spacing is exactly 28 days on both sides, which makes the local chord unusually
  well-specified here. All arithmetic is reproducible from the numbers quoted below.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  grepped for `opex|expiration|witching|volatility settlement|SOQ`; `src/domain/market-events/` read
  in full (224 entries) for the corridor and the strip window; both sibling ledgers read for what was
  already banked.

### Conviction legs, tested

1. **The date is right, and this PR promotes it to `confirmed` — SUPPORTED.** The seeding entry filed
   `estimate` explicitly because "this lane may not self-confirm an event it discovered in-sweep,"
   and said in the same breath that the evidence was already `OCC:`-grade and "confirm-ready at its
   own initial research." This is that initial research, the sanctioned venue — the same move the
   [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) sibling made on identical grounds. Two
   independent Cboe surfaces fetched today: the settlement page lists **`VX/G7` expiring 2027-02-17**
   with real settlements (**20.4603** on 09-04, **20.6496** on 09-03), and the CSV endpoint for the
   same date returns **`VX,VX/G7,2027-02-17,20.4603`**. The arithmetic checks independently:
   **2027-02-17 is a Wednesday exactly 30 calendar days before 2027-03-19**, March's third Friday.
   This entry clears the bar by one margin its March sibling did not have: **`VXM/G7` (Mini VIX) is
   listed on both surfaces at the same price**, where `VXM/H7` was absent from the page altogether.
   `OCC:` is the prefix `market-events-data.ts` defines for exactly this ("theocc.com / Cboe;
   3rd-Friday standard"). The flip removes a date objection and licenses nothing — every call on this
   sheet is a stand-aside either way.

2. **The February contract's settlement window contains the March FOMC; the March contract's does
   not — SUPPORTED, and this is the finding that justifies a separate document.** VIX futures
   AM-settle to a VRO built from the opening auction of a **single** SPX/SPXW series exactly 30 days
   out. For `VX/G7` that series is **2027-03-19**, so the settlement measures **2027-02-18 →
   2027-03-19**. Reading the calendar's own entries over that window: `japan-cpi-2027-02-19`,
   `opex-2027-02-19`, `japan-cpi-tokyo-flash-2027-02-26`,
   `nerc-computational-load-phase-ii-workplan-2027-03-01`, `fomc-blackout-start-2027-03-06`,
   `sp-rebalance-reference-close-2027-03-12`, **`fomc-2027-03-17`**, `vix-expiration-2027-03-17`,
   **`boj-decision-2027-03-18`**, `japan-cpi-2027-03-19` and **`opex-2027-03-19`** — eleven tracked
   events, all `estimate`, with the entire March policy cluster at the window's far edge. Now the
   inversion: `VX/H7` stops trading **09:00 ET on 2027-03-17**, ~5 hours before the 14:00 ET decision,
   and *its* strip runs **2027-03-18 → 2027-04-16** — so the value it settles to measures a window
   that begins the day **after** the FOMC. A VIX future's price is an expectation of its own VRO, and
   H7's VRO can never contain March-FOMC volatility. **`VX/G7` is the only listed VIX contract whose
   settlement window contains the 2027-03-17 decision.** Two honest qualifications, both material.
   First, every date in that cluster is `estimate`, so this is a structural statement about the
   calendar as currently filed, not a confirmed configuration. Second, and more limiting: the FOMC
   sits at **day 27 of 30**, one event day among 22 sessions, so its contribution to a 30-day
   variance measure is heavily diluted — see leg 4 for the magnitude, which is small.

3. **`VX/G7` is the clean control in the holiday-drag natural experiment — SUPPORTED as a setup.**
   Session counts recomputed from scratch this session against the NYSE table, for all nine listed
   contracts' strips: **U6 22 · V6 22 · X6 21** (Thanksgiving 2026-11-26) **· Z6 20** (Christmas +
   New Year) **· F7 21** (Washington's Birthday 2027-02-15) **· G7 22 · H7 21** (Good Friday
   2027-03-26) **· J7 22 · K7 21** (Memorial Day 2027-05-31). These reproduce the March sibling's
   counts exactly, computed independently — a small but real cross-check on the number its whole
   leg 3 rests on. `VX/G7`'s window is **holiday-clean**, and it is clean by a margin of days on both
   sides: Washington's Birthday **2027-02-15** falls three days *before* the window opens, Good
   Friday **2027-03-26** one week *after* it closes. So the adjacent pair **G7 (22 sessions) / H7
   (21 sessions)**, spaced exactly **28 days**, is the cleanest controlled comparison the listed
   curve offers for the drag hypothesis — better specified than a nine-point global fit, because the
   even spacing makes a two-sided chord an exact interpolation.

4. **Both mechanics predict the same sign and the market prices ~a tenth of their sum — MIXED, and
   the weak form stays unpromoted.** *The two predictions.* (a) *Holiday drag on H7*: VIX annualizes
   on calendar time while variance accrues on trading time, so a 21-session strip against a
   22-session norm implies `1−√(21/22)` = **2.30%**, **≈0.48 points** at H7's 20.7295 — H7 cheap,
   i.e. G7 rich relative to it. (b) *FOMC in G7's window*: adding one event day carrying **twice**
   normal variance to a 22-session strip lifts the measure by `√(23/22)−1` = **2.25%**, **≈0.46
   points** at G7's 20.4603 — G7 rich. **The 2× multiplier is assumed, not measured here**; it is a
   sensitivity, and the leg's conclusion does not depend on its exact value, only on it being of
   this order. Combined prediction: **G7 rich to H7 by ~0.9 points.**

   *The measurement.* Local chord test — each interior contract minus the interpolation of its two
   neighbours, in both linear and log-`dte` space, on both settlement dates:

   | Contract | 09-04 linear | 09-04 log-space | 09-03 linear | 09-03 log-space |
   |---|---|---|---|---|
   | V6 | +0.4816 | +0.0076 | +0.4533 | −0.0615 |
   | X6 | +0.2121 | +0.1321 | +0.2553 | +0.1598 |
   | Z6 | −0.3409 | −0.4342 | −0.3307 | −0.4288 |
   | F7 | +0.1995 | +0.1143 | +0.1880 | +0.0991 |
   | **G7** | **+0.0957** | **+0.0648** | **+0.1431** | **+0.1128** |
   | **H7** | **+0.0175** | **−0.0052** | **−0.0079** | **−0.0279** |
   | J7 | +0.0598 | +0.0457 | +0.0257 | +0.0102 |

   The **G7 − H7 gap** is **+0.078** (09-04 linear) / **+0.151** (09-03) — and **+0.070** / **+0.141**
   in log space. Right sign, four readings out of four. Magnitude: **8–16%** of the ~0.9-point
   combined prediction, or **16–31%** of the business-time part taken alone — which brackets the
   **λ ≈ 0.2 (~20%)** optimum the March sibling's differently-specified global scan landed on. Two
   independent methods agreeing on a weak partial effect is worth recording.

   *Why it is still not an edge, and this is the part that matters.* **The two mechanics are not
   separable.** Both predict G7 rich to H7; the same two contracts differ on both dimensions at once,
   and there is no third contract that isolates either. The global OLS agrees the effect is not
   distinctive: G7's `log(dte)` residual is **+0.1487** (09-04) / **+0.1968** (09-03), sitting
   mid-pack beside H7 **+0.1617 / +0.1392** and J7 **+0.1863 / +0.1355** — on the global fit G7 is
   *not* the standout the paired test suggests, and the disagreement between the local and global
   specifications is itself the tell that neither is a result at n = 9. Verdict: **REFUTED** for any
   strong form (0.9 points is not there), **MIXED** for the weak form, and **no promotion** — a
   partial effect corroborated by a second method is a reason to keep measuring, not to size.

5. **Anchoring the strip on a quarterly triple-witching series buys nothing measurable — REFUTED.**
   `VX/G7`'s SOQ is struck from the **2027-03-19** series, which is a **quarterly** SPX expiration
   (March triple witching) rather than an ordinary monthly. The mechanical story is plausible: a
   quarterly series carries far deeper open interest and a wider valid-strike ladder, so the VIX
   formula's "two consecutive zero bids" truncation bites later, and truncation biases the measure
   *down* — hence a quarterly-anchored settlement should be *less* downward-biased. Testable directly:
   of the nine listed contracts, exactly three anchor on quarterlies (**X6** → 2026-12-18, **G7** →
   2027-03-19, **K7** → 2027-06-17) and six on monthlies. Mean `log(dte)`-fit residual, quarterly
   versus monthly: **+0.0127 vs −0.0063** (09-04) and **+0.0343 vs −0.0172** (09-03). Right sign,
   and meaningless: the gap is **0.019–0.052 points** while the quarterly group's own spread runs
   **−0.2369 to +0.1487** — an order of magnitude wider than the effect it is supposed to show. No
   quarterly-anchor premium is visible. Recorded because a plausible mechanic killed cheaply, before
   anyone leaned on it, is the cheapest thing this lane produces.

6. **At D-165 the far curve is a level, not information — SUPPORTED, dated, and pointed exactly at
   this contract.** VIX cash closed **14.53** on 2026-09-04 (Cboe's own index history CSV, read this
   session) against `VX/G7`'s **20.4603** — a **+5.93-point** gap that is the standing vol risk
   premium, not a forecast of elevated February-2027 volatility. The dated evidence, and it is
   pointed: on **2026-09-04** August payrolls printed hawkish, and Cboe's 09-03 → 09-04 settlement
   changes split the curve — cash and front **up** (VIX 14.32 → **14.53**, `VX/U6` **+0.1288**,
   `VX/V6` **+0.0371**), everything from November out **down** (X6 −0.0871, Z6 −0.1248, F7 −0.1491,
   **G7 −0.1893**, H7 −0.1346, J7 −0.1233, K7 −0.1750). **`VX/G7` was the single largest decliner on
   the curve, −0.92%** — the biggest macro surprise of that week moved the only listed contract whose
   window contains the March FOMC *down* by nearly a percent, harder than any contract whose window
   does not. Whatever leg 2's placement fact is worth structurally, **it is not being traded at D-165**,
   and any later pulse reading `VX/G7` as a March-policy gauge before roughly January 2027 is reading
   a level. Configuration on the same date, for the next pulse to diff against (all Cboe primary
   closes, 2026-09-04): **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42** — a steeply
   upward-sloping front. Named as a configuration, **not** a forecast.

7. **This settlement is the natural control for both siblings' FOMC-morning test — SUPPORTED, and it
   is this document's most useful contribution to the other two.** Both
   [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md) and
   [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) registered the same prediction: the
   VRO prints **above** the same day's VIX cash close, *because* the documented FOMC-day volatility
   decline lands after the 09:00 ET settlement. Both settle on FOMC mornings — which means both are
   treatment observations with no control, and a pass on either is consistent with the effect being
   an ordinary settlement-morning artifact that has nothing to do with the FOMC. **2027-02-17 carries
   no FOMC** (the nearest tracked decision is `fomc-2027-01-27`, three weeks earlier), so it supplies
   the missing cell. Registering it as a forward test costs nothing and makes both siblings'
   results interpretable: VRO-above-cash here would mean their FOMC-specific explanation is *not
   identified* by their own tests; VRO-at-or-below here would materially strengthen it. Deliberately
   designed so **either outcome is informative**, which is why its stated confidence is low and it is
   a control rather than a bet.

8. **No house playbook is opex- or vol-settlement-keyed — SUPPORTED, re-verified rather than
   inherited.** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
   this session for `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**
   (case-insensitive count, run fresh). S1/G1 are earnings-dated run-up plays, S2 the
   never-hold-the-print guard, S3 a reaction-day fade, S4 a structural close-side preference, E1 a
   don't-trade-the-open execution rule. The one real interaction is that **E1 gains a reason on
   2027-02-17** — a VRO auction inside a holiday-shortened week. That sharpens an existing execution
   rule; it is not a new signal.

9. **The constitutive input is already on the calendar; the corridor gap is a closure — SUPPORTED,
   and it is this sweep's one proposal.** Unlike its March sibling, this event has **no constitutive
   gap**: `opex-2027-03-19` — the SPX series the VRO is literally computed from — is already tracked
   (`estimate`), as are all four other events within 5 days of 2027-02-17's own corridor
   (`japan-cpi-2027-02-19`, `opex-2027-02-19`). What is missing is **Washington's Birthday,
   2027-02-15**: an NYSE full closure two days before this settlement, read off the same NYSE table
   used above (`Washington's Birthday` row parses as `['Monday, February 16', 'Monday, February 15',
   'Monday, February 21']` for 2026/2027/2028). It matters here structurally rather than
   decoratively: it makes the settlement week a **4-session week** — Tue 02-16, **Wed 02-17 (VIX
   SOQ)**, Thu 02-18, **Fri 02-19 (February monthly opex)** — putting two auctions of consequence
   into four sessions, and it is simultaneously the closure that puts `VX/F7`'s strip at 21 sessions
   (leg 3). Proposed as an `estimate` file in this PR, in the class
   `good-friday-market-closure-2027-03-26` already established. Deliberately **not** proposed:
   `mlk-market-closure-2027-01-18` and the remaining 2027 closures (out of corridor, and filing the
   whole NYSE year here would manufacture research burden this run cannot justify), and the other
   quarterly VIX expirations (mere repetitions — the same call both siblings made).

10. **Two surface qualifications, one of them a non-reproduction — SUPPORTED, logged rather than
    dropped.** First, the March sibling recorded that the 09-04 CSV "carries the VX list only through
    `VX/J7` — no `VX/K7` row." **That does not reproduce on today's fetch**: the same URL with the
    same `dt=2026-09-04` returns **`VX,VX/K7,2027-05-18,21.15`**, matching the HTML table. Logged as
    a non-reproduction, not a contradiction — either the surface was refreshed between fetches or the
    earlier parse clipped, and this session cannot tell which from here. Neither reading touches
    `VX/G7`. Second, the settlement page is served as an **escaped React payload**, not HTML table
    markup; a naive table parse returns zero rows and could easily be mistaken for "the contract is
    not listed." Recorded so the next pulse does not re-derive it. `VX/G7` appears on **both**
    surfaces at the same price on both dates, and `VXM/G7` does too — which is what leg 1 rests on.

### What the conditions support

Nothing directional, and no sizing. Four outputs, in descending order of value:

- **A placement note.** `VX/G7`'s settlement window contains the 2027-03-17 FOMC; `VX/H7`'s does not
  (leg 2). If March-2027 policy vol is ever expressed in a VIX future, the February line is where it
  structurally lives. This prevents a wrong instrument choice; it does not recommend one.
- **A refusal.** The combined FOMC-window + holiday-drag richness of G7 over H7 (~0.9 points
  predicted) is 8–16% present in the curve, and the two mechanics are not separable at n = 9
  (leg 4). Plus a second, cleaner kill: no quarterly-anchor premium is visible at all (leg 5).
- **A control.** This settlement supplies the missing non-FOMC cell for both siblings' registered
  mechanic test (leg 7) — the highest-leverage thing this document does for the other two.
- **An execution guard.** Nothing enters, exits or resizes on the **2027-02-17 opening auction**.
  Inherited from both siblings, unchanged.

### Honest limits

The **date** is now confirmed; everything trading-adjacent remains mechanics or `estimate`-grade
context, and **every** event in leg 2's window — `fomc-2027-03-17`, `boj-decision-2027-03-18`,
`opex-2027-03-19` included — is `estimate` and carries its own tentative-until-confirmed caveat, so
leg 2 is a statement about the calendar as currently filed. The settlement prices are Cboe **daily
settlements** for 2026-09-04 and 2026-09-03, not live quotes, and index levels are **closes for
2026-09-04**, a session this runner is a day past; there is no intraday read here. Leg 4's FOMC
magnitude rests on an **assumed 2× event-day variance multiplier** that no house data tests — it is a
sensitivity, and a different multiplier moves the predicted number without changing the leg's
conclusion. Leg 4's statistics are computed on **nine contracts and two settlement dates**, its local
and global specifications disagree about whether G7 is distinctive, and the paired test is
structurally confounded by design — enough to refuse two stories, nowhere near enough to establish
one. Leg 5's truncation mechanic is textbook option-index construction, not a house-validated result.
Leg 7's FOMC-day volatility-decline claim is inherited from the siblings' reading of literature
summaries, not full texts read here — which is exactly why this document adds a control instead of
another assertion. The 30-day-rule arithmetic and the session counts are this session's own
computation against the NYSE table and reproduce the March sibling's independently; they are not
borrowed. Nothing about same-day VIX open interest by strike or SPX gamma is quoted: at D-165 that
describes a different expiry and would be false precision. Educational, paper-standard throughout.

## Stance & kill switches

**Stance (date `confirmed` as of 2026-09-05, Cboe-sourced; every adjacent and in-window event
`estimate`).** Treat **2027-02-17, 09:30 ET** as a known-date, **low-impact microstructure marker**
and never as a tradeable event. No position is opened, closed or sized because of it, and the
promotion from `estimate` to `confirmed` in this PR changes that not at all — it removes a date
objection to a stand-aside. One guard applies: **nothing executes on that day's opening auction**, on
any name. Three facts are carried forward rather than acted on. **(a)** The SOQ's strip is the single
**2027-03-19** SPX series — the March quarterly triple witching — so this contract's settlement
window **contains** the 2027-03-17 FOMC, the 03-18 BoJ and the witching itself, while the March
contract `VX/H7`, settling 09:00 ET that same FOMC morning, has a window that **excludes** the
decision entirely. Among listed VIX futures the February line is the March-FOMC line. **(b)** That
placement, plus the fact that G7's strip is holiday-clean at 22 sessions against H7's 21, predicts
G7 rich to H7 by **~0.9 points combined** — and this session measured the actual chord-excess gap at
**+0.078 to +0.151**, roughly a tenth, with the two mechanics not separable at n = 9. Both stories
are refused in their strong form; the weak form is recorded, unpromoted. **(c)** Washington's
Birthday **2027-02-15** makes this a **4-session settlement week** carrying both the VIX SOQ (02-17)
and the February monthly opex (02-19). At **D-165** the far curve is a level and not information —
`VX/G7` fell **0.1893 (−0.92%)**, the most of any listed contract, on the week's hawkish payrolls
print — so later pulses must not read `VX/G7` as a February-2027 or March-policy forecast until it is
genuinely front-dated.

**Kill switches:**

- **Cboe publishes a February-2027 VIX settlement date other than 2027-02-17** — the confirmation
  flipped in this PR reverts to `estimate` and the corridor re-dates. Re-check both surfaces (the
  settlement page and the CSV endpoint) at every pulse rather than trusting this row.
- **H7's chord excess reaches or exceeds G7's on any Cboe settlement date before 2027-02-17** — the
  ordering both mechanics predict is gone, leg 4's weak form dies outright rather than staying
  unpromoted, and the sheet is rebuilt on the newer data. This is
  `FT-vix-expiration-2027-02-17-1` and its falsifier is the same observation.
- **The March 2027 FOMC moves off 03-17, or off its 14:00 ET slot, or the BoJ moves off 03-18** —
  leg 2's placement note loses its subject and the "February line is the March-FOMC line" framing is
  re-derived rather than repeated. Observe by **2027-01-27**, when the January FOMC confirms the
  March slot.
- **The NYSE publishes a 2027 calendar that puts a closure inside 2027-02-18 → 2027-03-19, or moves
  Washington's Birthday off 2027-02-15** — leg 3's "G7 is the clean control" setup collapses, leg 4's
  paired test loses its contrast, and the proposed closure entry re-dates. Re-check
  `nyse.com/markets/hours-calendars` by **2027-01-04**.
- **The 2026-09-16 sibling test (`FT-vix-expiration-2026-09-16-1`) scores a kill** — one FOMC-morning
  VIX settlement printing *below* its own cash close makes the control registered here a control for
  a dead mechanic; re-specify rather than run. Observe **2026-09-16**.
- **`VX/G7` trades below VIX cash before 2027-02-17 (backwardation at the February line)** — the
  market has stopped paying for the window, leg 6's "the far end is a level" framing inverts, and the
  guard needs re-reading rather than repeating.
- **A house vol/opex instrument gets built and back-tested** — legs 4, 5, 7 and 8 all stop being
  mechanics-plus-citation and start being data; this sheet is then rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-02-17.md`](../forward-tests/vix-expiration-2027-02-17.md):
`FT-vix-expiration-2027-02-17-1`, the **paired richness ordering** made falsifiable (G7's chord
excess over the F7–H7 chord stays above H7's over the G7–J7 chord at every pulse through
settlement), scored 2027-02-16 by re-running this session's own computation; and
`FT-vix-expiration-2027-02-17-2`, the **control** for both siblings' FOMC-morning mechanic test (the
2027-02-17 VRO prints above the same day's VIX cash close on a settlement morning carrying no FOMC),
scored 2027-02-17 from Cboe's published settlement value.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-165 | Initial research banked; probe-ref seeded (no symbols; **VIX 14.53** at the 2026-09-04 close read this session off Cboe's own index history CSV; band `low:15+`; 3 adjacents incl. the entry proposed here). **Date flipped `estimate` → `confirmed` (`OCC:`)** off two Cboe primaries fetched today: the settlement page (HTTP 200, 536,900b, an escaped React payload not HTML tables) listing **`VX/G7` expiring 2027-02-17** at **20.4603** (09-04) / **20.6496** (09-03), and the CSV `?dt=2026-09-04` (HTTP 200, 1,731b) returning **`VX,VX/G7,2027-02-17,20.4603`**; `VXM/G7` on both at the same price (`VXM/H7` was absent for the March sibling); 2027-02-17 is a Wednesday exactly 30 days before March's third Friday 2027-03-19. **Headline: `VX/G7`'s settlement window (02-18 → 03-19) CONTAINS the 2027-03-17 FOMC, the 03-18 BoJ and the 03-19 quarterly witching, while `VX/H7` — settling 09:00 ET that same FOMC morning, window 03-18 → 04-16 — EXCLUDES the decision entirely. Among listed VIX futures the February line is the March-FOMC line.** All eleven in-window calendar entries are `estimate`; the FOMC sits at day 27 of 30, so its contribution is heavily diluted. **Paired test.** G7's strip is holiday-clean at **22 sessions** (Washington's Birthday 02-15 falls 3d before it opens, Good Friday 03-26 a week after it closes) vs H7's **21**; the two are spaced exactly 28d, the cleanest controlled pair on the curve. Session counts recomputed from scratch (U6 22, V6 22, X6 21, Z6 20, F7 21, **G7 22**, H7 21, J7 22, K7 21) — reproduce the March sibling's independently. Holiday drag predicts ~**0.48** pts (H7 cheap); one assumed double-variance FOMC day in a 22-session strip predicts ~**0.46** (G7 rich); combined ~**0.9**. Measured local chord excess: **G7 +0.0957/+0.1431** vs **H7 +0.0175/−0.0079** (linear, 09-04/09-03) → gap **+0.078/+0.151**, i.e. **8–16%** of the combined prediction (16–31% of the drag alone, bracketing the sibling's λ≈0.2). Right sign 4/4, but the global `log(dte)` fit puts G7 **+0.1487/+0.1968** mid-pack beside H7 (+0.1617/+0.1392) and J7 (+0.1863/+0.1355) — local and global disagree on whether G7 is distinctive, and **the two mechanics predict the same sign so they are not separable at n=9**. Verdict **REFUTED (strong) / MIXED (weak), no promotion**. **Second kill: the quarterly-anchor story is REFUTED outright** — of nine contracts, three anchor on quarterlies (X6, **G7**, K7); mean residual **+0.0127 vs −0.0063** (09-04) and **+0.0343 vs −0.0172** (09-03), a 0.02–0.05 gap inside a group spread of −0.2369 to +0.1487. Adjacency — **peers:** none (`symbols: []`). **Macro:** FOMC **2027-03-17 14:00 ET** and BoJ **03-18** sit inside this contract's strip, not its corridor; nearest decision to the settlement itself is `fomc-2027-01-27`, 3 weeks earlier. **Volatility regime:** no prior reading to diff (baseline row); Cboe primary closes 09-04 **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; term structure U6 **16.2669** → K7 **21.15**, monotone contango, `VX/G7` **20.4603** = **+5.93** over cash. On the hawkish 09-04 payrolls print the curve split — cash and front **up** (VIX 14.32→14.53, U6 +0.1288, V6 +0.0371), everything from X6 out **down**, and **`VX/G7` fell the MOST of the nine (−0.1893, −0.92%)** despite being the only contract whose window holds the March FOMC: at D-165 the far end is a level, not information. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** `trade-playbooks.md` + `multi-symbol-sweep.md` grepped for `opex\|expiration\|witching\|volatility settlement\|SOQ` → **zero hits**, re-verified not inherited. **Surface note:** the March sibling's "09-04 CSV omits `VX/K7`" **does not reproduce** — the same URL/`dt` returns `VX,VX/K7,2027-05-18,21.15` today; logged as a non-reproduction, cause undeterminable from here, and it touches neither G7 nor leg 1. **One dated adjacency proposed:** `washingtons-birthday-market-closure-2027-02-15` (`estimate`, NYSE-sourced) — the closure that makes this a 4-session settlement week carrying both the VIX SOQ (02-17) and the February monthly opex (02-19). Deliberately **not** proposed: the remaining 2027 NYSE closures (out of corridor) and the other quarterly VIX expirations (repetitions). No constitutive gap: `opex-2027-03-19`, the series the VRO is computed from, is already tracked. **Forward tests `FT-vix-expiration-2027-02-17-1` and `-2` registered** — `-2` is the non-FOMC **control** both siblings' FOMC-morning test lacks. | — (stance set) | 2026-10-05 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
