# VIX futures & options January 2027 expiration (SOQ settlement) — vix-expiration-2027-01-20

**Kind:** opex · **Date:** 2027-01-20 (confirmed, OCC: two Cboe primaries fetched direct 2026-09-06 — the settlement page (HTTP 200, 536,888 bytes) carries `VX/F7 - 2027-01-20` in plain HTML table markup at 19.9997 (09-04) and 20.1488 (09-03), and the machine-readable CSV `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200, 1,731 bytes) returns `VX,VX/F7,2027-01-20,19.9997`; `VXM/F7` appears on both surfaces at both prices; 2027-01-20 is a Wednesday exactly 30 days before February's third Friday 2027-02-19) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["opex-2027-01-15","fomc-blackout-start-2027-01-16","mlk-market-closure-2027-01-18","boj-decision-2027-01-22","japan-cpi-2027-01-22","norway-gpfg-bond-expert-group-2027-01-25"],"screenStreak":0,"blocked":[{"url":"https://www.nyse.com/markets/hours-calendars","status":"403","at":"2026-09-06"},{"url":"https://www.theocc.com/company-information/schedules","status":"403","at":"2026-09-06"},{"url":"https://cdn.cboe.com/resources/release_notes/2027_Expiration_Calendar.pdf","status":"403","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **Stand aside — and this document's two most useful outputs are both refusals, one of
which kills a *test design* the February sibling was counting on.** The January VIX contract `VX/F7`
settles to a Special Opening Quotation struck from a single SPX series 30 days out, so it measures
**2027-01-21 → 2027-02-19** — a window that **contains the January FOMC (2027-01-27)**, while its
predecessor `VX/Z6` (settling 2026-12-16, window 2026-12-17 → 2027-01-15) **excludes** it. So among
listed VIX futures the **January line is the January-FOMC line and the December line is not** — a
placement fact that prevents a wrong instrument choice and recommends none. `VX/F7` is also the one
contract on the curve where the two mechanics the February sibling could not separate predict
**opposite** signs: holiday drag says cheap by ~0.46 pts, the in-window FOMC says rich by ~0.47 pts,
netting **≈ +0.01**. Measured, `VX/F7`'s curve residual is **−0.008 / +0.022** — the smallest of the
nine. That looks like a hit and **is not one**: a near-zero reading is exactly what *both* "both
priced, cancelling" and "neither priced" predict, so the opposite-sign design **does not identify**
and is refused rather than banked. What did move: regressing residual on predicted drag across all
nine contracts gives a slope of **0.56 / 0.50**, but **ex-`VX/Z6` it collapses to 0.22 / 0.18** — one
leverage point carries it, and the ex-Z6 slope reproduces the **~20%** two earlier sessions found by
two different specifications. The headline structural fact is a calendar one: **MLK Day 2027-01-18
falls in the five-day hole between Z6's strip and F7's**, making it the only US market closure
interior to this curve's span that **no** listed VIX future's window contains — so `VX/F7`'s session
deficit comes from a *February* holiday, not January's. Date flipped `estimate` → **`confirmed`** in
this PR off two Cboe surfaces. Impact stays **low** on purpose.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — nothing on this sheet is sizeable | High | D-136, `symbols: []`, and the playbook grep re-run this session returns **zero** hits for `opex\|expiration\|witching\|volatility settlement\|SOQ` across `trade-playbooks.md` and `multi-symbol-sweep.md`; a settlement mechanic 136 days out has no read on today's tape | A house vol/opex instrument being built and back-tested before **2027-01-20** — the "no playbook is keyed to this" leg goes stale and this sheet is rebuilt on measured data instead of mechanics |
| This week | **Stand aside; the live vol-settlement question this week is 2026-09-16, not 2027-01-20** | High | The September 2026 VIX expiration is 10 days out with its own ledger and its own registered forward test; nothing in the 2026-09-07 → 2026-09-11 tape is `VX/F7`-keyed | Cboe publishing, before **2026-09-11**, a January-2027 VIX settlement date other than 2027-01-20 — the confirmation flipped in this PR reverts and the corridor re-dates |
| This month | **Do not treat `VX/F7`'s near-zero curve residual as evidence for either mechanic** — the opposite-sign design does not identify | Medium | Drag (−0.46 pts) and the in-window FOMC (+0.47 pts, on an *assumed* double-variance day) net to ≈ +0.01, and F7's measured residual is **−0.0083** (09-04) / **+0.0222** (09-03) — but "both priced and cancelling" and "neither priced" make the same prediction, so the reading discriminates nothing | `VX/F7`'s residual moving **outside ±0.20** on any Cboe settlement date before 2027-01-20 — the degeneracy breaks, one mechanic is visibly dominating, and the design becomes identifying after all. Registered as **FT-vix-expiration-2027-01-20-1**, score by 2027-01-19 |
| This quarter | **Watch one thing only: whether business-time drag is priced as a slope or as a threshold** | Medium | Across nine contracts the residual-on-drag slope is **0.56 / 0.50**, but ex-`VX/Z6` it falls to **0.22 / 0.18** — the only two-holiday strip on the curve carries the whole relationship, which is a threshold story (drag prices only once it clears the noise), not a linear one | `VX/Z6`'s residual converging toward the ex-Z6 line (its drag realization falling below **30%** of the predicted 0.88 pts) on any Cboe settlement date before 2026-12-16 — the leverage point stops being one and the threshold reading dies. Registered as **FT-vix-expiration-2027-01-20-2**, score by 2026-12-15 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-01-20 VIX settlement. The date is
  now `confirmed`, which removes the date objection and changes nothing else.
- **Execution guard (the only actionable line here):** nothing trades the **2027-01-20 opening
  auction** — the January VIX/VXM complex AM-settles into it and the vol complex's first prints that
  morning are settlement artifacts, not information. Same guard all four siblings carry.
- **Placement note, not a call:** `VX/F7`'s settlement window **contains** `fomc-2027-01-27`
  (`estimate`); `VX/Z6`'s **does not** — Z6's window instead terminates *on* `opex-2027-01-15`. If
  January-2027 policy vol is ever wanted in a VIX future, the January line is where it structurally
  lives. A fact to prevent a wrong instrument choice, never a reason to choose one.
- **The false inference this document exists to block:** "January has MLK, so the January VIX
  contract is drag-cheapened." **MLK 2027-01-18 sits in no contract's strip at all.** `VX/F7`'s
  21-session deficit comes from **Washington's Birthday 2027-02-15**, a February closure.
- **The refusal on the design:** F7's near-zero residual is **not** evidence for the FOMC-window or
  drag mechanics. Both "priced and cancelling" and "neither priced" predict it.
- **The refusal on the slope:** the 0.5 residual-on-drag slope across nine contracts is a **one-point
  result** — ex-`VX/Z6` it is 0.18–0.22. Do not size on the headline number.
- **Settlement-week structure:** MLK **2027-01-18** (proposed here) makes it a **4-session week** —
  Tue 01-19, **Wed 01-20 (VIX SOQ)**, Thu 01-21, **Fri 01-22 (BoJ decision + Japan CPI)**.
- **Term structure as of 2026-09-04 (Cboe daily settlements):** U6 **16.2669** · V6 18.1384 ·
  X6 18.7688 · Z6 18.9750 · **F7 19.9997** · G7 20.4603 · H7 20.7295 · J7 21.0267 · K7 21.1500 —
  monotone contango. F7's 20.00 is **+5.47 over VIX cash (14.53)**: the vol risk premium's term
  structure, not a January-2027 forecast.
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At
  D-136 those describe a different expiry; they become quotable from about **2027-01-13**.

## Initial research

### The question

Three sibling ledgers already exist — [`vix-expiration-2026-09-16`](vix-expiration-2026-09-16.md),
[`vix-expiration-2027-02-17`](vix-expiration-2027-02-17.md) and
[`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) — and this event arrived only as a
*proposal* written by the `opex-2027-01-15` sweep, which is a sibling lane's finding rather than a
verified entry. So two questions, in order: **does the proposal's own evidence and reasoning survive
independent re-fetching**, and **what does the January 2027 VIX settlement carry that no sibling
does?**

**One-line verdict:** the proposal's *date* survives and promotes to `confirmed`; its two headline
*framings* do not — one is arithmetically wrong and one is a common feature it read as a rarity —
and the finding that actually justifies a separate document is a **negative** one, that `VX/F7` is
the contract where the siblings' two inseparable mechanics oppose and that this **still does not
identify them**.

### Method

Macro/mechanics mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no earnings-style
instrument applies (`earnings-cycle.mjs` / `intraday-edges.mjs` are symbol-keyed; this event has
`symbols: []`) and no opex- or vol-shaped instrument exists in `scripts/research/`. Nothing was
inherited: every primary was re-fetched this session, every number below is this session's own
computation, and the sibling ledgers' session counts were recomputed from scratch before comparison.

- **Cboe** `cboe.com/us/futures/market_statistics/settlement` (302 → `/markets/us/futures/
  market-statistics/settlement/futures/daily`; HTTP 200, **536,888 bytes**) — parsed for `VX/F7`.
- **Cboe** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=2026-09-04` (HTTP 200,
  1,731 bytes) and `?dt=2026-09-03` (HTTP 200, 1,733 bytes) — the machine-readable second surface,
  parsed into all 42 / 42 contract rows each.
- **Federal Reserve** `federalreserve.gov/aboutthefed/k8.htm` (HTTP 200, **82,205 bytes**, page
  stamped *Last Update: July 8, 2026*) — the K.8 holiday table for 2026–2030, parsed row by row.
  Used because the NYSE's own calendar was **403 to this runner** (see limits).
- **Cboe index history CSVs** (`cdn.cboe.com/api/global/us_indices/daily_prices/…`, HTTP 200) for
  **VIX** (472,309 b), **VIX9D** (200,183 b), **VIX3M** (217,642 b), **VVIX** (108,498 b) — every
  index level quoted below is this session's own read off that primary.
- **Blocked, recorded not substituted** (all 2026-09-06, all in `probe-ref.blocked`):
  `nyse.com/markets/hours-calendars` **403**, `theocc.com/company-information/schedules` **403**,
  `cdn.cboe.com/resources/release_notes/2027_Expiration_Calendar.pdf` **403**.
- **Own computation:** trading-session counts for all nine listed `VX` 30-day strips against the K.8
  table plus Good Friday; strip **tiling** (gap/overlap for all eight adjacent pairs); a **local
  chord test** (each interior contract vs the linear and log-`dte` interpolation of its neighbours);
  an OLS fit of settlement on `log(dte)` with residuals; and — new to this lane — a **cross-curve
  regression of residual on predicted business-time drag**, with and without `VX/Z6`.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  grepped for `opex|expiration|witching|volatility settlement|SOQ`; `src/domain/market-events/` read
  in full (**325** files) for the corridor, the strip windows and the blackout set; the proposal
  `proposals/vix-expiration-2027-01-20.from-opex-2027-01-15.json` and all three sibling ledgers read
  first, as the `never-assessed`-on-a-proposed-id rule requires.

### Conviction legs, tested

1. **The date is right, and this PR promotes it to `confirmed` — SUPPORTED, and it meets the
   proposal's own criterion verbatim.** The proposal filed `estimate` and stated a **PROMOTION
   CRITERION**: "a second Cboe surface (the settlement page's React payload, or an OCC/Cboe
   expiration calendar) listing 2027-01-20 directly." That is exactly what this session fetched. The
   settlement page (HTTP 200, 536,888 b) carries `VX/F7 - 2027-01-20` **four times**: twice as
   **plain HTML table markup** — `<td …>VX/F7<!-- --> - <!-- -->2027-01-20</td><td …>19.9997</td>`,
   and the same row at **20.1488** — and twice inside the escaped React payload. Worth logging as a
   **non-reproduction** of the February sibling's warning: that ledger recorded the page as "an
   escaped React payload, not HTML table markup" such that "a naive table parse returns zero rows."
   Today the plain markup is present and a naive parse would have worked; either the surface changed
   or the earlier parse missed it, and this session cannot tell which from here. Independently, the
   CSV endpoint returns `VX,VX/F7,2027-01-20,19.9997` (`dt=2026-09-04`) and
   `VX,VX/F7,2027-01-20,20.1488` (`dt=2026-09-03`) — two surfaces × two dates agreeing to the fourth
   decimal — and **`VXM/F7` (Mini VIX) is listed on both surfaces at both prices**, the same extra
   margin that promoted the February sibling. Arithmetic, computed independently: **2027-01-20 is a
   Wednesday exactly 30 calendar days before 2027-02-19**, which is February 2027's third Friday.
   `OCC:` is the prefix `market-events-data.ts` defines for exactly this. This is the sanctioned
   venue for the flip — the proposal said the discovering lane "may not self-confirm an event it
   discovered in-sweep," and this is the event's own initial research, the same move all three
   siblings made. The flip licenses nothing: every call on this sheet is a stand-aside either way.

2. **The proposal's "day 7 of 30 is the inverse of day 27 of 30" framing is arithmetically wrong —
   REFUTED, and the correction matters for how the next session reads all four ledgers.** The
   proposal wrote that F7's FOMC at "day 7 of 30 is the inverse of the February/March pair … where
   the decision sits at day 27 of 30 and is heavily diluted by the strip that follows it." A 30-day
   variance measure is **additive across days**: expected variance over the window is the sum of the
   daily contributions, so an event day's **position** inside the strip contributes nothing to the
   settlement level. `VX/G7` carries one FOMC day in 22 sessions; `VX/F7` carries one in 21. The
   dilution is not merely similar, it is **the same mechanic at the same order**, and there is no
   "inverse" of anything. What *is* true and worth keeping is the binary: **inclusion vs exclusion**.
   Recorded plainly because the proposal is the file a later session will read first, and an
   attractive-sounding position argument is exactly the kind of thing that gets inherited unchecked.

3. **`VX/F7`'s window contains the January FOMC; `VX/Z6`'s does not — SUPPORTED, and this is the
   placement fact that survives.** VIX futures AM-settle to a VRO built from the opening auction of
   a **single** SPX/SPXW series exactly 30 days out. For `VX/F7` that series is **2027-02-19**, so
   the settlement measures **2027-01-21 → 2027-02-19**. Reading the calendar's own 325 entries over
   that window: `boj-decision-2027-01-22`, `japan-cpi-2027-01-22`,
   `norway-gpfg-bond-expert-group-2027-01-25`, `consumer-confidence-2027-01-26`,
   `fhfa-hpi-2027-01-26` (the one **`confirmed`** entry in the window),
   **`fomc-2027-01-27`**, `japan-cpi-tokyo-flash-2027-01-29`, `boj-summary-of-opinions-2027-02-01`,
   `ism-manufacturing-2027-02-01`, `ism-services-2027-02-03`, the 02-15 closure pair,
   `vix-expiration-2027-02-17`, `japan-cpi-2027-02-19` and `opex-2027-02-19` — fifteen tracked
   events, fourteen of them `estimate`. `VX/Z6` settles 2026-12-16 and its window **2026-12-17 →
   2027-01-15** ends **twelve days before** the decision; it instead terminates *on*
   `opex-2027-01-15`, which is the proposing event itself. A VIX future's price is an expectation of
   its own VRO, so Z6's VRO can never contain January-FOMC volatility: **`VX/F7` is the only listed
   VIX contract whose settlement window contains the 2027-01-27 decision.** Two honest
   qualifications: `fomc-2027-01-27` is itself `estimate`, so this is a statement about the calendar
   as currently filed; and per leg 2 the effect is one event day among 21 sessions either way.

4. **MLK Day 2027-01-18 is invisible to the entire listed VIX term structure — SUPPORTED, and it is
   this document's headline.** Consecutive VIX strips do not tile, and the January hole is where
   that bites. Computed for all eight adjacent pairs on the listed curve:

   | Pair | This ref date | Next strip start | Result |
   |---|---|---|---|
   | U6→V6 | 2026-10-16 | 2026-10-22 | **gap 5d** |
   | V6→X6 | 2026-11-20 | 2026-11-19 | overlap 2d |
   | X6→Z6 | 2026-12-18 | 2026-12-17 | overlap 2d |
   | **Z6→F7** | **2027-01-15** | **2027-01-21** | **gap 5d** |
   | F7→G7 | 2027-02-19 | 2027-02-18 | overlap 2d |
   | G7→H7 | 2027-03-19 | 2027-03-18 | overlap 2d |
   | H7→J7 | 2027-04-16 | 2027-04-22 | **gap 5d** |
   | J7→K7 | 2027-05-21 | 2027-05-19 | overlap 3d |

   **MLK 2027-01-18 lands inside the Z6→F7 gap.** Checking every closure in the curve's span
   (2026-09-17 → 2027-06-17) against all nine strips: Thanksgiving 2026-11-26 → X6; Christmas
   2026-12-25 **and** New Year 2027-01-01 → both Z6; Washington's Birthday 2027-02-15 → F7; Good
   Friday 2027-03-26 → H7; Memorial Day 2027-05-31 → K7; **MLK 2027-01-18 → none.** (Labor Day
   2026-09-07 is also uncovered but only because it *precedes* the front contract's strip — not the
   same phenomenon, and named so the count is honest.) So MLK 2027 is **the only interior US market
   closure this curve does not measure**, and the operative consequence is a refusal: the
   business-time drag mechanic this lane has now measured three times **cannot attach to it**.
   Anyone reasoning "January has MLK, so the January contract is drag-cheapened" is wrong — `VX/F7`'s
   21-session strip comes from **Washington's Birthday 2027-02-15**, a February holiday. Session
   counts recomputed from scratch against the K.8 table plus Good Friday: **U6 22 · V6 22 · X6 21 ·
   Z6 20 · F7 21 · G7 22 · H7 21 · J7 22 · K7 21** — reproducing both siblings' counts exactly by an
   independent route (they read NYSE's table; this session was 403 there and used the Fed's).

5. **The proposal's "strips do not tile" note is arithmetic, not a finding — DOWNGRADED.** The
   proposal recorded the five-day hole as something "a later session should not assume." Measured, it
   is **three of eight** adjacent pairs, and the pattern is fully determined by third-Friday spacing:
   a five-week gap between consecutive third Fridays gives a 5-day hole (35 − 30), a four-week gap
   gives a 2-day overlap (28 − 30). It recurs three or four times a year, in every year. Kept as
   arithmetic so no future session re-discovers it as news; the *January* instance still matters, but
   only because of what falls in it (leg 4), never because the hole is unusual.

6. **The proposal's blackout observation is not distinctive either — DOWNGRADED.** This settlement
   does fall inside the January FOMC communications blackout (`fomc-blackout-start-2027-01-16` →
   `fomc-2027-01-27`). Checked against every tracked blackout: **five of the nine** listed
   settlements do — U6 (2026-09-16, itself the decision day), V6 (2026-10-21), **F7 (2027-01-20)**,
   H7 (2027-03-17, itself the decision day) and J7 (2027-04-21). Three of those five, including this
   one, sit inside a blackout *without* being the decision day. A majority property is not a
   distinguishing one, and this leg is recorded to stop it being written up as one later.

7. **`VX/F7` is the opposite-sign contract the February sibling lacked — and it still does not
   identify the two mechanics. MIXED as a setup, REFUTED as a design, and this is the most useful
   thing here.** The February sibling's central limitation, in its own words: the FOMC-window and
   holiday-drag mechanics "predict the same sign so they are not separable at n = 9." At `VX/F7`
   they predict **opposite** signs, which is exactly the configuration that ought to break the tie:

   - *Holiday drag*: F7's strip is **21 sessions** against a 22-session norm, so `√(21/22) − 1` =
     **−2.30%**, ≈ **−0.46 pts** at F7's 19.9997 — F7 **cheap**.
   - *FOMC in the window*: adding one event day carrying **twice** normal variance to a 21-session
     strip gives `√(22/21) − 1` = **+2.36%**, ≈ **+0.47 pts** — F7 **rich**. (The 2× multiplier is
     **assumed**, inherited as a sensitivity from the February sibling and tested by no house data.)
   - *Net predicted dislocation*: **≈ +0.01 pts.** F7 should sit **on** the curve.

   *The measurement.* OLS of settlement on `log(dte)` across all nine contracts, residuals:

   | Contract | sessions | predicted drag (pts) | resid 09-04 | resid 09-03 |
   |---|---|---|---|---|
   | U6 | 22 | 0.0000 | +0.2734 | +0.2513 |
   | V6 | 22 | 0.0000 | −0.0991 | −0.1228 |
   | X6 | 21 | −0.4315 | −0.2369 | −0.1904 |
   | **Z6** | **20** | **−0.8830** | **−0.5521** | **−0.5077** |
   | **F7** | **21** | **−0.4598** | **−0.0083** | **+0.0222** |
   | G7 | 22 | 0.0000 | +0.1487 | +0.1946 |
   | H7 | 21 | −0.4766 | +0.1617 | +0.1318 |
   | J7 | 22 | 0.0000 | +0.1863 | +0.1223 |
   | K7 | 21 | −0.4863 | +0.1264 | +0.0987 |

   F7's residual is **−0.0083 / +0.0222** — the smallest absolute value on the curve on 09-04, and
   within a third of a tenth of the ≈ +0.01 the two mechanics jointly predict. **That looks like a
   hit and is not one.** If *neither* mechanic is priced, F7's residual is ordinary curve noise,
   which is centred on zero by construction of the fit. If *both* are priced, they cancel and the
   residual is zero. **Both hypotheses predict the same observation**, so the reading discriminates
   nothing, and the "find the opposite-sign contract" design is **refused rather than banked**. The
   design only identifies where the two mechanics oppose with *different* magnitudes; here they are
   within **0.01 pts** of each other, which makes F7 degenerate rather than informative. That is a
   real result for the siblings: `VX/F7` cannot rescue `FT-vix-expiration-2027-02-17-1`.

8. **Business-time drag across the whole curve: the headline slope is a one-point result — MIXED,
   and it converges with two prior sessions once the leverage point is removed.** Rather than one
   pair, regress each contract's `log(dte)` residual on its **predicted** drag (a genuinely new
   specification for this lane, using session-count variation across all nine contracts):

   | Sample | slope (09-04) | slope (09-03) | r (09-04) | r² (09-04) |
   |---|---|---|---|---|
   | All nine | **0.563** | **0.503** | 0.686 | 0.470 |
   | **Ex-`VX/Z6`** | **0.221** | **0.181** | 0.324 | 0.105 |

   A slope of 1.0 would mean the drag is fully priced. The nine-contract answer of ~0.5 is the kind
   of number that gets quoted; **dropping the single contract with a two-holiday strip cuts it to
   ~0.2 and the r² to 0.11.** The relationship is carried by `VX/Z6` alone, whose realized drag is
   **−0.5521 / −0.8830 = 63%** (09-04) of prediction against a curve where every other holiday-short
   contract shows essentially none — H7, J7 and K7's residuals are *positive* despite predicted drag
   of −0.48 to −0.49. Two readings, and this session cannot separate them at n = 9: either the drag
   prices **linearly at ~20%** (the ex-Z6 slope, which is also the **λ ≈ 0.2** the March sibling's
   global scan found and inside the **16–31%** the February sibling measured — three specifications,
   three sessions, one number), or it prices as a **threshold**, invisible until the deficit is large
   enough to clear the noise, in which case only Z6's two-holiday strip qualifies. **Convergence on
   ~20% across three independent methods is worth recording; it is still a refusal**, because 20% of
   a 0.46-point effect is **0.09 pts** on a contract 136 days out — inside a single session's
   settlement move (F7 fell **0.1491** on 09-03 → 09-04).

9. **At D-136 the far curve is a level, not information — SUPPORTED, dated, and pointed at this
   contract.** VIX cash closed **14.53** on 2026-09-04 (Cboe's own index history CSV, read this
   session) against `VX/F7`'s **19.9997** — a **+5.47-point** gap that is the standing vol risk
   premium, not a forecast of elevated January-2027 volatility. The dated evidence: on **2026-09-04**
   August payrolls printed hawkish, and Cboe's 09-03 → 09-04 settlement changes split the curve —
   cash and front **up** (VIX 14.32 → **14.53**, `VX/U6` **+0.1288 / +0.80%**, `VX/V6` **+0.0371**),
   everything from November out **down** (X6 −0.0871, Z6 −0.1248, **F7 −0.1491 / −0.74%**, G7
   −0.1893, H7 −0.1346, J7 −0.1233, K7 −0.1750). The only listed contract whose window contains the
   January FOMC fell three-quarters of a percent on the week's biggest macro surprise. Whatever leg
   3's placement is worth structurally, **it is not being traded at D-136**, and any later pulse
   reading `VX/F7` as a January-policy gauge before roughly **December 2026** is reading a level.
   Configuration on the same date, for the next pulse to diff against (all Cboe primary closes,
   2026-09-04): **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42** — a steeply upward-sloping
   front. Named as a configuration, **not** a forecast.

10. **No house playbook is opex- or vol-settlement-keyed — SUPPORTED, re-verified rather than
    inherited.** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
    this session for `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**
    (case-insensitive count, run fresh). The one real interaction is that **E1 — the
    don't-trade-the-open execution rule — gains a reason on 2027-01-20**: a VRO auction on the second
    session of a holiday-shortened week. That sharpens an existing rule; it is not a new signal.

11. **The corridor's one real gap is MLK, and it is this sweep's single proposal — SUPPORTED.**
    Within ±5 days of 2027-01-20 the calendar already carries `opex-2027-01-15`,
    `fomc-blackout-start-2027-01-16`, `boj-decision-2027-01-22`, `japan-cpi-2027-01-22` and
    `norway-gpfg-bond-expert-group-2027-01-25`. Missing: **MLK Day, 2027-01-18** — an NYSE full
    closure at **D-2**, and precisely the entry the February sibling **named and declined** ("out of
    corridor"). It is in corridor here, so this lane files it, as
    `proposals/mlk-market-closure-2027-01-18.from-vix-expiration-2027-01-20.json` (`estimate`). It is
    structural, not decorative: it makes the settlement week a **4-session week** — Tue 01-19,
    **Wed 01-20 (VIX SOQ)**, Thu 01-21, **Fri 01-22 (BoJ + Japan CPI)** — and it is the closure at
    the centre of leg 4. Deliberately **not** proposed: the remaining 2027 NYSE closures (out of
    corridor), and `vix-expiration-2026-12-16` (still untracked, still directly dated on the same
    Cboe file at `VX,VX/Z6,2026-12-16,18.975`, but 101 days out and far outside this corridor —
    recorded again so it is not lost a second time). **Separately observed, not fixed here:** the
    calendar carries **both** `presidents-day-market-closure-2027-02-15` **and**
    `washingtons-birthday-market-closure-2027-02-15` for the same single NYSE closure. Two ids, one
    day; neither is this lane's file to touch, and it is flagged rather than repaired.

### What the conditions support

Nothing directional, and no sizing. Five outputs, in descending order of value:

- **A design refusal.** The opposite-sign contract does **not** identify the FOMC-window and
  holiday-drag mechanics (leg 7). `VX/F7` cannot rescue `FT-vix-expiration-2027-02-17-1`, and the
  next session that reaches for "find the contract where they oppose" should stop here.
- **A calendar fact with a false inference attached to it.** MLK 2027-01-18 is measured by no listed
  VIX contract (leg 4), so the January closure is invisible to the whole term structure and F7's
  session deficit is a February holiday's.
- **A quantified convergence, still a refusal.** Three specifications across three sessions now put
  business-time drag at **~20% priced** (leg 8) — 0.09 pts here, inside one session's noise.
- **A placement note.** `VX/F7`'s window contains `fomc-2027-01-27`; `VX/Z6`'s does not (leg 3).
  Prevents a wrong instrument choice; does not recommend one.
- **An execution guard.** Nothing enters, exits or resizes on the **2027-01-20 opening auction**.
  Inherited from all three siblings, unchanged.

### Honest limits

The **date** is now confirmed; everything trading-adjacent remains mechanics or `estimate`-grade
context. Fourteen of the fifteen tracked events inside leg 3's window are `estimate` — including
`fomc-2027-01-27` itself — so leg 3 is a statement about the calendar as currently filed. **The
NYSE's own holiday calendar was 403 to this runner**, so every session count and the MLK proposal
rest on the **Federal Reserve's** K.8 table plus the third-Monday statute plus the known NYSE
observance — one step removed from the exchange's own publication, which is exactly why the proposal
is filed `estimate` and why all three 403s are recorded in `probe-ref.blocked` rather than papered
over. Settlement prices are Cboe **daily settlements** for 2026-09-04 and 2026-09-03, not live
quotes; index levels are **closes for 2026-09-04**; there is no intraday read here. Leg 7's FOMC
magnitude rests on an **assumed 2× event-day variance multiplier** that no house data tests, and the
22-session "norm" it is measured against is a convention, not a result — a different multiplier moves
the predicted cancellation without changing the leg's conclusion, which depends only on the two terms
being close. Leg 8's regression is **nine contracts on two consecutive settlement dates**, the two
dates are not independent observations, and its headline slope is driven by **one** point; the
threshold-vs-linear question it raises is not answerable at this n and is registered as a forward
test rather than asserted. Nothing about same-day VIX open interest by strike or SPX gamma is quoted:
at D-136 that describes a different expiry and would be false precision. Educational,
paper-standard throughout.

## Stance & kill switches

**Stance (date `confirmed` as of 2026-09-06, Cboe-sourced; fourteen of fifteen in-window events
`estimate`).** Treat **2027-01-20, 09:30 ET** as a known-date, **low-impact microstructure marker**
and never as a tradeable event. No position is opened, closed or sized because of it, and the
promotion from `estimate` to `confirmed` in this PR changes that not at all — it removes a date
objection to a stand-aside. One guard applies: **nothing executes on that day's opening auction**, on
any name. Four things are carried forward rather than acted on. **(a)** `VX/F7`'s SOQ strip is the
single **2027-02-19** SPX series, so its window **2027-01-21 → 2027-02-19 contains
`fomc-2027-01-27`**, while `VX/Z6`'s window (2026-12-17 → 2027-01-15) **excludes** it and terminates
on `opex-2027-01-15`: among listed VIX futures the January line is the January-FOMC line.
**(b)** `VX/F7` is the one contract where drag (**−0.46 pts**) and the in-window FOMC (**+0.47 pts**)
oppose, netting **≈ +0.01**, and its measured residual is **−0.0083 / +0.0222** — the smallest on the
curve. **This is refused as evidence**: "both priced and cancelling" and "neither priced" predict the
same reading, so the opposite-sign design does not identify. **(c)** Across nine contracts the
residual-on-drag slope is **0.563 / 0.503**, but **ex-`VX/Z6` it is 0.221 / 0.181** — one leverage
point carries it, and the ex-Z6 number reproduces the ~20% two prior sessions found by two other
specifications. **(d)** **MLK 2027-01-18** falls in the five-day Z6→F7 hole and is measured by **no**
listed VIX contract, so the January closure is invisible to the term structure and F7's 21-session
strip is **Washington's Birthday 2027-02-15**'s doing. At **D-136** the far curve is a level and not
information — `VX/F7` fell **0.1491 (−0.74%)** on the week's hawkish payrolls print while cash rose —
so later pulses must not read `VX/F7` as a January-policy gauge until it is genuinely front-dated.

**Kill switches:**

- **Cboe publishes a January-2027 VIX settlement date other than 2027-01-20** — the confirmation
  flipped in this PR reverts to `estimate` and the corridor re-dates. Re-check both surfaces (the
  settlement page and the CSV endpoint) at every pulse rather than trusting this row.
- **`VX/F7`'s `log(dte)` residual moves outside ±0.20 on any Cboe settlement date before
  2027-01-20** — the degeneracy in leg 7 breaks, one mechanic is visibly dominating the other, and
  the opposite-sign design becomes identifying after all. This is
  `FT-vix-expiration-2027-01-20-1` and its falsifier is the same observation.
- **`VX/Z6`'s realized drag falls below 30% of its predicted −0.88 pts on any Cboe settlement date
  before 2026-12-16** — the leverage point stops being one, leg 8's threshold reading dies and the
  linear ~20% reading is what survives. `FT-vix-expiration-2027-01-20-2`.
- **The January 2027 FOMC moves off 01-27, or the blackout off 01-16** — leg 3's placement note
  loses its subject and the "January line is the January-FOMC line" framing is re-derived rather than
  repeated. Observe by **2026-12-09**, when the December FOMC confirms the January slot.
- **The NYSE publishes a 2027 calendar that puts a closure inside 2027-01-21 → 2027-02-19 other than
  02-15, or moves MLK off 2027-01-18** — leg 4's "invisible closure" fact collapses, leg 7's session
  count changes and the proposed closure entry re-dates. Re-check
  `nyse.com/markets/hours-calendars` (403 to this runner today) by **2026-12-07**.
- **`VX/F7` trades below VIX cash before 2027-01-20 (backwardation at the January line)** — the
  market has stopped paying for the window, leg 9's "the far end is a level" framing inverts, and the
  guard needs re-reading rather than repeating.
- **A house vol/opex instrument gets built and back-tested** — legs 7, 8 and 10 all stop being
  mechanics-plus-citation and start being data; this sheet is then rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-01-20.md`](../forward-tests/vix-expiration-2027-01-20.md):
`FT-vix-expiration-2027-01-20-1`, the **degeneracy of the opposite-sign design** made falsifiable
(F7's curve residual stays inside ±0.20 through settlement, so the reading keeps discriminating
nothing), scored 2027-01-19; and `FT-vix-expiration-2027-01-20-2`, the **leverage-point test**
separating the threshold and linear readings of business-time drag (Z6's realized drag stays at or
above 30% of prediction), scored 2026-12-15 from Cboe's published settlements.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-136 | Initial research on an id that existed only as `proposals/vix-expiration-2027-01-20.from-opex-2027-01-15.json`; that proposal was read first and the **canonical `vix-expiration-2027-01-20.json` is written in this PR**, shadowing it. Probe-ref seeded (no symbols; **VIX 14.53** at the 2026-09-04 close read off Cboe's own index CSV; band `low:15+`; 6 adjacents incl. the entry proposed here; 3 blocked URLs recorded). **Date flipped `estimate` → `confirmed` (`OCC:`)** — meets the proposal's own stated PROMOTION CRITERION verbatim, off two Cboe primaries fetched today: the settlement page (HTTP 200, 536,888b) carrying `VX/F7 - 2027-01-20` at **19.9997** (09-04) / **20.1488** (09-03) in **plain HTML table markup** (a **non-reproduction** of the February sibling's "escaped React payload only" note — logged, cause undeterminable here), and the CSVs `?dt=2026-09-04` / `?dt=2026-09-03` returning the same rows; `VXM/F7` on both surfaces at both prices; 2027-01-20 is a Wednesday exactly 30d before Feb's third Friday 2027-02-19. **Three legs of the proposal corrected.** (i) Its "day 7 of 30 vs day 27 of 30" inversion is **REFUTED** — a 30-day variance measure is additive, so an event day's *position* in the strip contributes nothing; only inclusion vs exclusion matters. (ii) "Strips do not tile" **DOWNGRADED to arithmetic** — 3 five-day gaps and 5 overlaps across 8 adjacent pairs, fully determined by third-Friday spacing (35−30 vs 28−30). (iii) Blackout containment **DOWNGRADED** — **5 of 9** listed settlements sit inside a tracked FOMC blackout (U6, V6, F7, H7, J7); a majority property is not a distinguishing one. **Placement leg SURVIVES:** F7's strip 01-21→02-19 **contains `fomc-2027-01-27`**; Z6's (12-17→01-15) **excludes** it and terminates on `opex-2027-01-15` — among listed VIX futures the January line is the January-FOMC line. **HEADLINE:** **MLK 2027-01-18 falls in the five-day Z6→F7 hole and is measured by NO listed VIX contract** — the only interior US closure in the curve's span (2026-09-17→2027-06-17) that no strip covers (Thanksgiving→X6, Christmas + New Year→Z6, Washington's Birthday→F7, Good Friday→H7, Memorial Day→K7). So "January has MLK ⇒ the January contract is drag-cheapened" is **FALSE**; F7's 21 sessions come from **Feb 15**. Session counts recomputed from scratch off the **Fed's K.8** table (NYSE was 403): U6 22, V6 22, X6 21, Z6 20, **F7 21**, G7 22, H7 21, J7 22, K7 21 — reproducing both siblings by an independent route. **The design refusal, this doc's most useful output.** F7 is the one contract where the siblings' two inseparable mechanics **oppose**: drag `√(21/22)−1` = **−0.46 pts**, one assumed-2× FOMC day in 21 sessions = **+0.47**, net **≈ +0.01**. Measured `log(dte)` residual **−0.0083** (09-04) / **+0.0222** (09-03), smallest on the curve — and **refused**, because "both priced, cancelling" and "neither priced" predict the same reading. The opposite-sign design **does not identify**; F7 cannot rescue `FT-vix-expiration-2027-02-17-1`. **New specification (cross-curve, n=9):** residual regressed on predicted drag → slope **0.563/0.503**, r²=0.47; **ex-Z6 slope 0.221/0.181**, r²=0.11 — one leverage point (Z6, the only two-holiday strip, 63% realized) carries it, and the ex-Z6 number reproduces the March sibling's λ≈0.2 and the February sibling's 16–31%. Three methods, three sessions, **~20%** — still a refusal at 0.09 pts. Adjacency — **peers:** none (`symbols: []`). **Macro:** `fomc-2027-01-27` (estimate, high) sits inside the strip, not the corridor; nearest to the settlement itself is `fomc-blackout-start-2027-01-16` at D-4. **Volatility regime:** no prior reading to diff (baseline row); Cboe primary closes 09-04 **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; term structure U6 **16.2669** → K7 **21.15**, monotone contango, `VX/F7` **19.9997** = **+5.47** over cash. On the hawkish 09-04 payrolls print cash and front rose (VIX 14.32→14.53, U6 +0.1288) while everything from X6 out fell — **`VX/F7` −0.1491 (−0.74%)** despite being the only contract whose window holds the January FOMC: at D-136 the far end is a level. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** `trade-playbooks.md` + `multi-symbol-sweep.md` grepped for `opex\|expiration\|witching\|volatility settlement\|SOQ` → **zero hits**, re-verified not inherited. **Blocked and recorded, never substituted:** `nyse.com/markets/hours-calendars` **403**, `theocc.com/company-information/schedules` **403**, `cdn.cboe.com/.../2027_Expiration_Calendar.pdf` **403** — all 2026-09-06, all in probe-ref; the holiday leg falls back to `federalreserve.gov/aboutthefed/k8.htm` (HTTP 200, 82,205b) plus the third-Monday statute, which is why the proposal below is `EST:`. **One dated adjacency proposed:** `mlk-market-closure-2027-01-18` (`estimate`) — at D-2, the closure the February sibling named and declined as out of *its* corridor. Not proposed: the rest of the 2027 NYSE closures (out of corridor) and `vix-expiration-2026-12-16` (101d out, still untracked, still directly dated at `VX,VX/Z6,2026-12-16,18.975` — recorded so it is not lost twice). **Observed, not fixed:** the calendar carries **two** ids for the single 2027-02-15 closure (`presidents-day-…` and `washingtons-birthday-…`). **Forward tests `FT-vix-expiration-2027-01-20-1` and `-2` registered.** | — (stance set) | 2026-10-06 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-vix-expiration-2027-01-20.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
