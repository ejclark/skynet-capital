# VIX futures May 2027 expiration (SOQ settlement) — vix-expiration-2027-05-18

**Kind:** opex · **Date:** 2027-05-18 (confirmed, OCC: Cboe's own VX contract specification fetched direct 2026-09-05 (HTTP 200, 461,261 bytes) states the settlement rule verbatim, and applying that rule reproduces **9 of 9** listed VX settlement dates including this Tuesday; two Cboe settlement surfaces carry the row independently — the HTML page (HTTP 200, 536,888 bytes) rendering `VX/K7 - 2027-05-18` with settlements 21.15 (09-04) / 21.325 (09-03), and the CSV endpoint `?dt=2026-09-04` (HTTP 200, 1,731 bytes) returning `VX,VX/K7,2027-05-18,21.15`) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["pjm-capacity-auction-2027-05"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and take the two things this row exists for: a rulebook, and the
cleanest test of a refused story that this repo has ever been able to run.** The seeding note filed
this Tuesday settlement as displaced by the Juneteenth closure 30 days later, sourced off Cboe's
product listings. This session got the **rule text itself**, which no sibling ledger could: Cboe's VX
specification says the settlement is the Wednesday 30 days before the next month's third Friday, and
*"if that Wednesday **or the Friday that is 30 days following that Wednesday** is a Cboe Options
holiday, the final settlement date … shall be on the business day immediately preceding that
Wednesday."* Juneteenth-observed **2027-06-18** is that Friday. Applying the rule cold reproduces
**all nine** listed VX dates, and a scan of every contract month from 2026-09 to 2028-12 finds
**exactly one** displacement in 28 months — this one. The rule also kills the obvious worry: the
displacement is **tenor-preserving**, both legs moving back one day, so `VX/K7` still measures
**exactly 30 days** (2027-05-18 → 2027-06-17) and is *not* an odd-tenor contract sitting on a
normal-tenor curve. The analytical payoff is a pair the set could not previously form: **`VX/H7` and
`VX/K7` have identical 21-session strips with exactly one closure each and differ *only* on whether
an FOMC is inside** — the session-count confound that muddied the April sibling's H7↔J7 test is gone.
Theory wants `VX/K7` **+0.25 to +0.98 points** rich. Measured on three Cboe settlement dates:
**−0.035, −0.033, −0.121** — the **wrong sign every time**. The FOMC-in-strip premium is refuted
harder here than anywhere else in the set. The date flips **`estimate` → `confirmed`** in this PR.
Impact stays **low**, and nothing here licenses a position.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this event could be sized into | High | D-255, `symbols: []`, `impact: low`, and a re-grep of `trade-playbooks.md` + `multi-symbol-sweep.md` for `opex\|expiration\|witching\|volatility settlement\|SOQ` returns **zero hits in both**, run this session rather than inherited | A house vol/opex instrument being built and back-tested before **2027-05-18** — the "nothing is settlement-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside; the live vol-settlement question this week is 2026-09-16, not 2027-05-18** | High | September 2026's VIX expiration is 11 days out with its own ledger and its own forward test; nothing in the 2026-09-07 → 2026-09-11 tape is `VX/K7`-keyed | Cboe re-listing `VX/K7` on a date other than 2027-05-18 before **2026-09-11** — the confirmation flipped in this PR reverts and the corridor re-dates |
| This month | **Do not buy the FOMC-in-strip premium** — this event supplies the controlled test the April sibling could not, and the story loses its sign on all three dates | Medium | `VX/H7` (21 sessions, Good Friday inside, **no** FOMC) and `VX/K7` (21 sessions, Memorial Day inside, **FOMC 2027-06-09 inside**) hold session count *and* closure count fixed. Theory wants `res(K7) − res(H7)` at **+0.25 / +0.50 / +0.98** for k = 1.5 / 2 / 3× FOMC-day variance; observed **−0.0353** (09-04), **−0.0331** (09-03), **−0.1208** (09-02) | `res(VX/K7) − res(VX/H7) ≥ +0.25` on any Cboe settlement date before **2027-03-17** — the premium would be pricing in as both strips near and the refusal converts to a live question. Registered as **FT-vix-expiration-2027-05-18-1** |
| This quarter | **Watch that the two displaced legs stay locked together** — the 30-day tenor is an inference from two independent rules, only one of which this session read | Medium | Cboe's VX rule moves the *settlement* to 05-18; a separate Cboe Options rule is what moves the *June SPX series* to 06-17, and only `VA/M7 — 2027-06-17` evidences the second. If one moved without the other the tenor would be 29 or 31 days, and every session count in this ledger would be off by one | Either Cboe surface carrying `VX/K7 — 2027-05-18` alongside a June reference expiration of **2027-06-18**, or `VX/K7 — 2027-05-19` alongside **2027-06-17**, at any pulse before settlement. Registered as **FT-vix-expiration-2027-05-18-2**, score by 2027-05-18 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or resize is keyed to the 2027-05-18 VIX settlement. The date is
  now `confirmed`, which removes the date objection and changes nothing else: no house playbook is
  opex- or vol-settlement-keyed (grepped this session, zero hits in both docs).
- **Execution guard (Tue 2027-05-18), and it is the only actionable line here:** nothing trades that
  day's opening auction. Cboe's own spec, fetched today: *"Trading hours for expiring VX futures
  contracts end at 8:00 a.m. (Chicago) on the final settlement date"* — 09:00 ET — and the SOQ is
  struck from the opening prints of the constituent SPX series. Those first prints are settlement
  artifacts, not information. Same guard all four VIX siblings carry.
- **Calendar trap, and this is the one worth remembering:** the naive rule "VIX settles the third
  Wednesday" gives **2027-05-19**. The correct date is **2027-05-18** — one day earlier. Nothing in
  `src/` or `scripts/` computes expiration dates (grepped this session for `third (wed|fri)` and
  weekday arithmetic: zero hits), so no code is wrong today; this is a note for whatever builds the
  first vol/opex instrument.
- **The scan result that bounds the trap:** applying Cboe's rule to every contract month from
  **2026-09 through 2028-12** — 28 months — finds **exactly one** displaced settlement, this one. A
  later sweep does not need to hunt for a second before 2029.
- **Structural placement, not a call:** the 30-day strip runs **2027-05-19 → 2027-06-17**, **21
  trading sessions** (Memorial Day 2027-05-31 closed), and contains the SIFMA bond early close
  (05-28), the FOMC blackout opening (05-29), the **2027-06-09 FOMC**, the **2027-06-11 BoJ
  decision** and its own terminal expiration (**06-17**) — all `estimate`. This contract expires
  **before** all of them while measuring **all** of them.
- **The refusal this document banks:** the FOMC-in-strip premium is not in the price, and the H7↔K7
  pair is the sharpest available statement of that — session count and closure count both held fixed,
  wrong sign on three consecutive settlement dates.
- **Term structure as of 2026-09-04 (Cboe daily settlements):** U6 **16.2669** · V6 18.1384 ·
  X6 18.7688 · Z6 18.9750 · F7 19.9997 · G7 20.4603 · H7 20.7295 · J7 21.0267 · **K7 21.1500** —
  monotone contango. K7's 21.15 is **+6.62 over VIX cash (14.53)**: the far end of the vol risk
  premium, **not** a May-2027 forecast.
- **The dated evidence for "the far end is dead":** on the hawkish 2026-09-04 payrolls print, VIX cash
  rose 14.32 → **14.53** and `VX/U6` rose **+0.1288**, while `VX/K7` **fell 0.175 (−0.82%)** — the
  largest absolute decline on the strip, opposite in sign to cash.
- **Corridor (±5 days):** one tracked event, `pjm-capacity-auction-2027-05` (2027-05-15, `estimate`).
  The May monthly expiration **2027-05-21** is three sessions after this settlement and is **not on
  the calendar** — recorded, deliberately not proposed (leg 8).
- **No same-day settlement positioning, VIX open interest by strike, or SPX gamma is quoted.** At
  D-255 those describe a different expiry; they become quotable from about **2027-05-11**.

## Initial research

### The question

Four VIX expirations are already researched here (2026-09-16, 2027-02-17, 2027-03-17, 2027-04-21) and
this one was seeded by a *fifth* ledger's sweep — the Juneteenth closure's — which filed it on
listings plus arithmetic and wrote down, as an honest limit, that **no expiration rule text was
obtained**. So the question is not "what happens on 2027-05-18." It is: **can the displacement be put
on a rulebook instead of an inference, and does this contract let the set test anything its four
siblings could not?**

**One-line verdict:** yes to both — the rule text exists, quotes cleanly, and reproduces **9 of 9**
listed dates including this one; and because `VX/K7` shares `VX/H7`'s exact session and closure count
while differing only on FOMC membership, it supplies the **controlled** version of a test the April
sibling could only run confounded — and the FOMC-in-strip premium **fails it worse**, carrying the
wrong sign on all three settlement dates rather than flickering between them.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no opex- or vol-shaped instrument exists in
`scripts/research/`. Nothing was inherited from the four sibling ledgers: every primary was re-fetched
and every number below recomputed, which is why this session can add a third settlement date and a
rule the siblings did not have.

- **Cboe VX contract specification** `cboe.com/tradable_products/vix/vix_futures/specifications/`
  (HTTP 200, **461,261** bytes) — the *Final Settlement Date* and SOQ clauses, read verbatim out of
  the page's embedded payload. Corroborated on `cboe.com/tradable_products/vix/` (HTTP 200, 589,904
  bytes), which carries the same clause for `VX` **and** `VXM`. **The headline source, and new to
  this set.**
- **Cboe settlement page** `cboe.com/us/futures/market_statistics/settlement/` (HTTP 200, **536,888**
  bytes) — `VX/K7 - 2027-05-18` at 21.15 (09-04) and 21.325 (09-03).
- **Cboe settlement CSV** `www-api.cboe.com/us/futures/market_statistics/settlement/csv?dt=…` for
  **three** dates: 2026-09-04 (HTTP 200, 1,731 b), 2026-09-03 (200, 1,733 b) and **2026-09-02**
  (200, 1,717 b). The third date is new — the siblings had two.
- **Cboe US options hours** `cboe.com/about/hours/us-options/` (HTTP 200, **386,016** bytes) — the
  holiday table, parsed row-by-row, establishing that Juneteenth and Memorial Day are Cboe Options
  holidays (`Regular Trading Hours: None`).
- **NYSE** `nyse.com/markets/hours-calendars` (HTTP 200, **109,180** bytes) — **fetched successfully
  this session**, where the Juneteenth sibling recorded HTTP 403 twice. The 2027 column is parsed
  cell-by-cell below (leg 6).
- **Cboe index history CSVs** (`cdn.cboe.com/api/global/us_indices/daily_prices/…`, all HTTP 200) for
  **VIX** (472,309 b), **VIX9D** (200,183), **VIX3M** (217,642), **VVIX** (108,498).
- **Own computation:** the settlement rule applied cold to 28 contract months (2026-09 → 2028-12);
  trading-session counts, closure counts and FOMC membership for all nine listed `VX` strips; an OLS
  of settlement on `log(days-to-expiry)` with residuals on **each of the three** settlement dates,
  re-fit three ways; the full 2×2 of residual means by closure × FOMC; and two duration-adjusted
  pairwise gaps. Every figure is reproducible from the numbers quoted below.
- **House sources:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  grepped; `src/domain/market-events/` for the corridor and strip contents; `src/` and `scripts/`
  grepped for expiration-date arithmetic; the [`vix-expiration-2027-04-21`](vix-expiration-2027-04-21.md)
  and [`juneteenth-market-closure-2027-06-18`](juneteenth-market-closure-2027-06-18.md) ledgers for
  what was already banked.
- **Failed and recorded, not worked around:** `cdn.cboe.com` futures-specifications PDF (HTTP 403).
  Yahoo was not used at all this session; every index level is a Cboe primary read.

### Conviction legs, tested

1. **The displacement now rests on rule text, not inference — SUPPORTED, and this is the leg the
   ledger exists for.** Cboe's VX specification, verbatim, in two paragraphs:

   > "The final settlement date for a contract with the "VX" ticker symbol is on the Wednesday that
   > is 30 days prior to the third Friday of the calendar month immediately following the month in
   > which the contract expires."
   >
   > "If that Wednesday **or the Friday that is 30 days following that Wednesday** is a Cboe Options
   > holiday, the final settlement date for the contract shall be on the business day immediately
   > preceding that Wednesday."

   Apply it to the May 2027 contract with no knowledge of the answer: third Friday of June 2027 =
   **2027-06-18**; the Wednesday 30 days prior = **2027-05-19**, not a holiday; the Friday 30 days
   after that Wednesday = **2027-06-18**, which **is** a Cboe Options holiday (Juneteenth observed —
   Cboe's own hours table shows `Juneteenth Holiday | Regular Trading Hours: None`, and NYSE's 2027
   column reads `Friday, June 18 (Juneteenth National Independence Day observed)`). The **second**
   clause fires, and the settlement moves to the business day immediately preceding — **Tuesday
   2027-05-18**. That is exactly what Cboe lists. The Juneteenth ledger's honest limit — *"No
   expiration rule text was obtained… The evidence is strong and convergent; it is still
   listings-and-tape rather than rulebook"* — **closes here**.

2. **The rule reproduces the whole strip, 9 of 9 — SUPPORTED, and it is what licenses the
   `confirmed` flip.** Run cold against Cboe's listings:

   | Contract | 3rd Friday (next month) | Wednesday −30d | Trigger | Rule says | Cboe lists |
   |---|---|---|---|---|---|
   | U6 | 2026-10-16 | 2026-09-16 | — | 2026-09-16 | 2026-09-16 ✓ |
   | V6 | 2026-11-20 | 2026-10-21 | — | 2026-10-21 | 2026-10-21 ✓ |
   | X6 | 2026-12-18 | 2026-11-18 | — | 2026-11-18 | 2026-11-18 ✓ |
   | Z6 | 2027-01-15 | 2026-12-16 | — | 2026-12-16 | 2026-12-16 ✓ |
   | F7 | 2027-02-19 | 2027-01-20 | — | 2027-01-20 | 2027-01-20 ✓ |
   | G7 | 2027-03-19 | 2027-02-17 | — | 2027-02-17 | 2027-02-17 ✓ |
   | H7 | 2027-04-16 | 2027-03-17 | — | 2027-03-17 | 2027-03-17 ✓ |
   | J7 | 2027-05-21 | 2027-04-21 | — | 2027-04-21 | 2027-04-21 ✓ |
   | **K7** | **2027-06-18** | **2027-05-19** | **Friday is a holiday** | **2027-05-18** | **2027-05-18 ✓** |

   `OCC:` is the prefix `market-events-data.ts` defines for exactly this class (*"options-expiration
   calendar (theocc.com / Cboe; 3rd-Friday standard)"*), and it is what promoted
   `vix-expiration-2026-09-16`, `-2027-03-17` and `-2027-04-21`. The seeding note said in as many
   words that this entry was confirm-ready at its own initial research; this is that research, with a
   strictly stronger evidence base than any sibling had — a listing on two surfaces *plus* the rule
   that generates it. Flipped. It removes a date objection and licenses nothing.

3. **The displacement is tenor-preserving, which kills the obvious worry — SUPPORTED.** The natural
   fear about an odd-weekday contract is that it measures an odd tenor and is therefore not
   comparable to its neighbours. It does not. Both legs move back one day: the reference SPX series
   goes 2027-06-18 → **2027-06-17** and the settlement goes 2027-05-19 → **2027-05-18**, so the
   tenor stays **exactly 30 calendar days**, identical to all eight undisplaced contracts (computed
   above, right-hand column). The contrast is instructive and comes from Cboe's own SOQ text, quoted
   verbatim: *"when Cboe Options is closed on a Wednesday due to an Exchange holiday, the amount of
   time until expiration used to calculate the final settlement value would be **increased** to
   reflect the extra calendar day."* That is the **other** branch of the rule — a Wednesday holiday
   moves the settlement without moving the Friday, producing a **31-day** contract. `VX/K7` is on the
   tenor-preserving branch. This matters practically: it means every session count, every duration
   fit and every residual in legs 4–6 treats `VX/K7` on equal terms with the rest of the strip,
   which would be wrong on the other branch.

4. **The controlled FOMC pair — REFUTED, and this is the sharpest version of the test this repo can
   run.** *The setup.* The April sibling tested the FOMC-in-strip premium on `VX/H7` ↔ `VX/J7` and
   had to concede that the pair confounded two things: H7 had 21 sessions and a Good Friday, J7 had
   22 and none, so the holiday drag and the FOMC premium were tangled. This event unties them.
   `VX/H7` and `VX/K7` have **identical 21-session strips with exactly one closure each** (Good
   Friday 2027-03-26 and Memorial Day 2027-05-31 respectively) and differ **only** on FOMC
   membership — H7's window 2027-03-18 → 04-16 contains none; K7's window 2027-05-19 → 06-17
   contains the **2027-06-09** decision (`estimate`).

   *The prediction.* If an FOMC session carries `k` times an ordinary session's variance, a
   21-session strip containing one is worth `√((20+k)/21) − 1` more in vol terms — against `VX/K7`'s
   21.15 that is **+0.250** (k = 1.5), **+0.498** (k = 2), **+0.984** (k = 3). Because closure counts
   match, **the holiday drag cancels out of the difference entirely**; this is a clean read on the
   FOMC term alone.

   *The measurement.* Duration-adjusting via the `log(dte)` fit's own slope, on three consecutive
   Cboe settlement dates:

   | As-of | raw K7 − H7 | attributed to duration | leftover (= res K7 − res H7) |
   |---|---|---|---|
   | 2026-09-04 | +0.4205 | +0.4558 | **−0.0353** |
   | 2026-09-03 | +0.4609 | +0.4940 | **−0.0331** |
   | 2026-09-02 | +0.3500 | +0.4708 | **−0.1208** |

   *Verdict.* **REFUTED**, on sign and on size, on every date. Theory demands **at least +0.25**; the
   observation is negative all three times and its own range (0.087) is a quarter of the smallest
   effect the theory permits. The April sibling's version straddled zero (+0.025 / −0.004); this one
   never touches it. A story that is negative on a controlled pair three days running is not a story
   waiting for more data.

5. **The 2×2 this event completes shows the FOMC effect is not even sign-stable across strata —
   SUPPORTED, and it is a stronger framing than either sibling's univariate cut.** With K7 on the
   board the nine contracts populate a full closure × FOMC design. Mean `log(dte)`-fit residuals,
   as of 2026-09-04:

   | | no FOMC in strip | FOMC in strip |
   |---|---|---|
   | **holiday-clean** | **+0.273** (n = 1: U6) | **+0.079** (n = 3: V6, G7, J7) |
   | **≥1 closure** | **−0.195** (n = 2: Z6, H7) | **−0.040** (n = 3: X6, F7, **K7**) |

   Read the columns: adding an FOMC **lowers** the residual by 0.194 in the clean row and **raises**
   it by 0.155 in the deficit row. The effect the theory says must be positive and constant is
   negative in one stratum and positive in the other — **an interaction of the wrong shape, on a
   design with n = 1 in one cell**. Read the rows: the drag is −0.468 in the no-FOMC column, almost
   exactly the 0.486 theory predicts — but that cell-difference rests entirely on U6 (the front
   month) and Z6 (the two-closure year-end contract), which the April sibling already showed dominate
   every correlation on this curve. **The one number that matches theory is the one carried by the
   two contracts already known to be special.** The design is not identified, and saying so precisely
   is worth more than a fourth correlation.

6. **Three settlement dates instead of two, and the duration story is what survives — SUPPORTED.**
   The siblings fit on 09-04 and 09-03; this session adds **2026-09-02**. `log(days-to-expiry)`
   against settlement, all nine contracts:

   | As-of | slope | R² | corr(closures, res) | corr(FOMC, res) | `VX/K7` residual |
   |---|---|---|---|---|---|
   | 2026-09-04 | 1.6437 | **0.9739** | **−0.719** | +0.112 | +0.126 |
   | 2026-09-03 | 1.7893 | **0.9807** | **−0.708** | +0.131 | +0.099 |
   | 2026-09-02 | 1.7131 | **0.9778** | **−0.731** | +0.104 | +0.066 |

   Duration explains **97–98%** of the cross-section on every date; the closure correlation is
   strikingly stable at **−0.71 to −0.73**; the FOMC correlation is stable, tiny and — as leg 4
   shows — an artifact of the confound rather than an effect. Re-fitting **ex `VX/Z6`** (the natural
   experiment the April sibling registered as `FT-vix-expiration-2027-04-21-2`, since Z6 leaves the
   board 2026-12-16) gives corr(closures, res) = **−0.370 / −0.338 / −0.373** across the same three
   dates. Recorded as a **preview only**: that forward test is scored by its own lane at the first
   pulse after 2026-12-16, on the board as it exists then, and nothing here scores it.

7. **The 27-day gap is the displacement's fingerprint on the term structure — SUPPORTED, structural
   only.** Adjacent VX settlement spacings on the listed strip: U6→V6 **35**, V6→X6 **28**, X6→Z6
   **28**, Z6→F7 **35**, F7→G7 **28**, G7→H7 **28**, H7→J7 **35**, **J7→K7 27**. Every undisplaced
   gap is 28 or 35 (four or five weeks); **27 is unique on the strip** and is exactly the one-day
   pull-back. Recorded because anyone building a constant-maturity roll off these dates will meet a
   27-day leg once and should know it is the rule working, not a data error. Nothing is inferred
   from it about price.

8. **The corridor is complete and this sweep proposes nothing — SUPPORTED, and the refusal is
   computed rather than assumed.** Within ±5 days of 2027-05-18 the calendar carries exactly one
   entry, `pjm-capacity-auction-2027-05` (2027-05-15, `estimate`); the strip window beyond it already
   carries `sifma-bond-early-close-2027-05-28`, `fomc-blackout-start-2027-05-29`,
   `memorial-day-market-closure-2027-05-31`, `fomc-2027-06-09`, `boj-decision-2027-06-11` and
   `opex-2027-06-17` — all `estimate`, all tracked. Two candidates were considered and declined.
   **(a)** Applying leg 1's rule to all **28** contract months from 2026-09 to 2028-12 yields
   **exactly one** displaced settlement — this one — so there is no second displaced VIX expiration
   to file before 2029. That is a negative result from a computation, not an absence of looking.
   **(b)** `opex-2027-05-21` (the May monthly, three sessions after this settlement, and `VX/J7`'s
   reference series) is **not proposed**: the `vix-expiration-2027-04-21` ledger declined the same
   entry after `opex-2027-04-16`'s own research refuted the "constitutive input" rationale that would
   file it, and re-using a framing this calendar has already corrected would manufacture research
   burden. The monthly-opex gaps that observation implies (**2027-01-15** and **2027-05-21** are both
   absent while 2026-08 → 2027-04 and 2027-06 are continuous) are **re-recorded unchanged** as a
   calendar-seeding question for whoever owns coverage policy — one VIX ledger should not settle it
   unilaterally, and two ledgers now noting it is the signal.

9. **At D-255 the far curve is a level, not information — SUPPORTED, dated and quantified.** VIX cash
   closed **14.53** on 2026-09-04 while `VX/K7` settled **21.15** — a **+6.62-point** basis that is
   the standing vol risk premium at the very back of the strip, not a forecast of elevated May-2027
   volatility. Reading it as one is the single most available error on this event. The dated
   evidence: on 2026-09-04 August payrolls printed hawkish (+162k against ~53–55k consensus — BLS, as
   recorded by the sibling ledgers) and the curve split. Cash and front month **up**: VIX 14.32 →
   **14.53**, `VX/U6` **+0.1288**. Everything from November out **down**, and `VX/K7` fell **0.175
   (−0.82%)** — the largest absolute decline anywhere on the strip, opposite in sign to cash.
   Configuration for the next pulse to diff against (Cboe primary closes, 2026-09-04): **VIX9D
   11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42** — a steeply upward-sloping front. A configuration,
   **not** a forecast.

10. **Nothing in the house system is settlement-keyed, and no code computes expiration dates —
    SUPPORTED, both re-verified this session.** `trade-playbooks.md` and `multi-symbol-sweep.md`
    grepped for `opex|expiration|witching|volatility settlement|SOQ`: **zero hits in both**. A grep
    of `src/` and `scripts/` for third-Wednesday / third-Friday arithmetic returns **zero hits** —
    every expiration date in this repo is a literal in a calendar file, sourced rather than computed,
    so the leg-1 trap cannot currently fire in code. The one real interaction is that **E1 (the
    don't-trade-the-open execution rule) gains a reason on 2027-05-18**. That sharpens an existing
    rule; it is not a new signal.

11. **`VXM` is still not listed at this expiry — SUPPORTED, and the qualification is unchanged.** The
    Mini-VIX rows on both Cboe surfaces stop at **`VXM/G7` (2027-02-17)**, on all three settlement
    dates. Nothing here may be asserted about a Mini-VIX leg; the entry rests on the `VX` row alone.
    Cboe's specification does state the same settlement clause for `VXM`, so when a `VXM/K7` is
    listed it will carry the same 2027-05-18 date — an expectation, not an observation.

### What the conditions support

Nothing directional, and no sizing. Five outputs, in descending order of value:

- **A rulebook, replacing an inference.** Cboe's own VX specification, quoted verbatim, generates
  2027-05-18 from first principles and reproduces **9 of 9** listed dates. This closes the Juneteenth
  ledger's stated limit and is what licenses the `estimate` → `confirmed` flip.
- **The controlled refusal.** The FOMC-in-strip premium fails on the one pair where session count and
  closure count are both held fixed — wrong sign on three consecutive settlement dates, against a
  theory whose smallest permissible effect is +0.25.
- **A bounded trap.** "VIX settles the third Wednesday" is wrong exactly once in 28 contract months,
  and it is this one. No code in the repo computes it, so nothing is broken today.
- **An execution guard.** Nothing enters, exits or resizes on the **2027-05-18 opening auction**;
  Cboe's own spec puts final VX trading at 09:00 ET that morning.
- **A structural note.** A tenor-preserving displacement, and the unique 27-day J7→K7 gap it creates.

### Honest limits

The **date** is now confirmed on rule text plus two listing surfaces; everything trading-adjacent
remains mechanics or `estimate`-grade context, and every event inside the strip (`fomc-2027-06-09`
included) is `estimate` with its own tentative-until-confirmed caveat. **The tenor-preservation claim
is half-sourced:** this session read the rule that moves the *VX settlement*, but the rule that moves
the *June SPX series* to 2027-06-17 was not obtained — that leg still rests on `VA/M7 — 2027-06-17`
and the 2026 tape, exactly as the Juneteenth ledger left it, and it is registered as a forward test
rather than asserted. **Cboe has published no 2027 options-hours table**; the "Juneteenth is a Cboe
Options holiday" trigger is read off Cboe's **2026** row, corroborated by NYSE's 2027 column and OPM's
statutory observance — convergent, but the 2027 Cboe row itself is unread. The rule-scan across 28
contract months uses this session's parse of NYSE's 2027/2028 holiday columns as the Cboe Options
holiday set; the two calendars agree everywhere checked, but they are not the same document. The
settlement prices are Cboe **daily settlements** for three dates in one week, not live quotes, and
index levels are **closes for 2026-09-04** — the freshest that exist on a Saturday. Leg 4's `k` is an
**assumption** (1.5–3× is plausible, not house-measured), so the refutation rests on the observed gap
being negative where **any** plausible `k` demands positive, not on a fitted value. Leg 5's 2×2 has
**n = 1 in one cell** and is explicitly reported as unidentified rather than as a result. Legs 4–6
share nine contracts across three consecutive days, which is three correlated snapshots, not three
independent samples. No house instrument tests any of this — which is exactly why these are
refusals rather than inversions into trades. Nothing about same-day VIX open interest by strike or
SPX gamma is quoted: at D-255 that describes a different expiry. Educational, paper-standard
throughout.

## Stance & kill switches

**Stance (date `confirmed` as of 2026-09-05 on Cboe rule text plus two listing surfaces; every
adjacent event `estimate`).** Treat **2027-05-18, 09:30 ET** as a known-date, **low-impact
microstructure marker** and never as a tradeable event. No position is opened, closed or sized
because of it, and the promotion from `estimate` to `confirmed` in this PR changes that not at all.
One guard applies: **nothing executes on that day's opening auction**, on any name — Cboe's own
specification ends VX trading at 09:00 ET that morning and the SOQ's first prints are artifacts.
Four facts are carried forward rather than acted on. **(a)** The Tuesday is **rulebook-derived, not
inferred**: Cboe's second settlement clause fires because Juneteenth-observed 2027-06-18 is a Cboe
Options holiday, and applying the rule cold reproduces all nine listed VX dates. **(b)** The
displacement is **tenor-preserving** — both legs move back one day, `VX/K7` still measures exactly 30
days, and it is therefore comparable to the rest of the strip on equal terms. **(c)** The
FOMC-in-strip premium is **refuted on a controlled pair**: `VX/H7` and `VX/K7` hold session count and
closure count fixed and differ only on FOMC membership, theory demands **+0.25 to +0.98** points, and
the measured leftover is **−0.035 / −0.033 / −0.121** on 2026-09-04 / 09-03 / 09-02. **(d)** The
generalisation the set now supports on three settlement dates rather than two: `log(days-to-expiry)`
explains **97.4–98.1%** of this curve's cross-section, so **the far VX curve prices duration, not
contents** — later pulses should not read `VX/K7` as a May-2027 forecast until it is genuinely
front-dated, and should note that on the week's hawkish payrolls print it fell **0.175**, the
strip's largest decline, while the front month rose.

**Kill switches:**

- **Cboe publishes a May-2027 VIX settlement date other than 2027-05-18** — the confirmation flipped
  in this PR reverts to `estimate` and the corridor re-dates. Re-check both surfaces at every pulse
  rather than trusting this row.
- **`res(VX/K7) − res(VX/H7) ≥ +0.25` at any pulse before 2027-03-17** — the FOMC premium would be
  pricing in on the one pair where nothing else can explain it, leg 4's refusal becomes a live
  question, and the sheet is rebuilt on the newer data. This is
  `FT-vix-expiration-2027-05-18-1`.
- **Either Cboe surface pairs `VX/K7 — 2027-05-18` with a June reference expiration of 2027-06-18, or
  pairs `VX/K7 — 2027-05-19` with 2027-06-17** — the two displaced legs would have come apart, the
  tenor would be 31 or 29 days, and every session count in this ledger is off by one. This is
  `FT-vix-expiration-2027-05-18-2`; observe by **2027-05-18**.
- **NYSE or Cboe publishes a 2027 calendar without a 2027-06-18 closure** — leg 1's rule trigger
  disappears, the settlement reverts to Wednesday 2027-05-19, and this entire ledger re-dates.
  Re-check `nyse.com/markets/hours-calendars` and `cboe.com/about/hours/us-options/` by
  **2027-01-04**.
- **Cboe publishes a 2027 options-hours table showing Juneteenth with regular trading hours** — same
  consequence as above by a different route, and it also inverts the Juneteenth ledger's own
  index-options guard.
- **The June 2027 FOMC moves off 2027-06-09, or lands outside the 2027-05-19 → 06-17 window** — leg
  4's controlled pair loses its treatment and the whole test needs re-specifying rather than
  re-running. Observe by **2027-04-19**, when the March FOMC's minutes and the Fed's own calendar
  confirm the June slot.
- **NYSE publishes a 2027 calendar with any closure inside 2027-05-19 → 2027-06-17 other than
  Memorial Day 2027-05-31, or removes that one** — the closure counts stop matching between H7 and
  K7 and leg 4's control is gone.
- **`VX/K7` trades below VIX cash before 2027-05-18 (backwardation at the May line)** — the market
  has stopped paying for the window, leg 9's "the far end is a level" framing inverts, and the guard
  needs re-reading rather than repeating.
- **A house vol/opex instrument gets built and back-tested** — legs 4, 5, 6 and 10 all stop being
  mechanics-plus-citation and start being data; this sheet is then rebuilt on measured results.

**Registered forward tests.** Two rows in
[`forward-tests/vix-expiration-2027-05-18.md`](../forward-tests/vix-expiration-2027-05-18.md):
`FT-vix-expiration-2027-05-18-1`, the **controlled FOMC refusal** on the H7↔K7 pair this event
uniquely enables, scored 2027-03-16; and `FT-vix-expiration-2027-05-18-2`, the **tenor-preservation
claim** made falsifiable on the one leg this session could not source from a rulebook, scored
2027-05-18. A third candidate was **declined**: predicting that `VX/K7` settles above VIX cash at
D-1 is near-trivially true by convergence, and the April sibling declined the identical test for the
identical reason. Nothing here scores `FT-vix-expiration-2027-04-21-2`, whose ex-`Z6` correlation
this session previewed at **−0.34 to −0.37**; that row belongs to its own lane and its own board.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-255 | Initial research banked; probe-ref seeded (no symbols, **VIX 14.53** at the 2026-09-04 Cboe close; band `low:15+`; 1 adjacent). **Date flipped `estimate` → `confirmed` (`OCC:`)** on evidence no sibling had: Cboe's **VX contract specification** (HTTP 200, 461,261b) states verbatim that settlement is the Wednesday 30 days before the next month's third Friday, and *"if that Wednesday **or the Friday that is 30 days following that Wednesday** is a Cboe Options holiday … the business day immediately preceding that Wednesday."* Juneteenth-observed **2027-06-18** is that Friday (Cboe hours: `Regular Trading Hours: None`; NYSE 2027 column, fetched **HTTP 200** where the Juneteenth ledger got 403×2, reads `Friday, June 18 (… observed)`). Applying the rule cold reproduces **9 of 9** listed VX dates including this Tuesday. **This closes the Juneteenth ledger's stated limit that no rule text was obtained.** **Tenor-preserving:** both legs move back a day (ref 06-18→**06-17**, settle 05-19→**05-18**), so K7 measures exactly **30 days** like every other contract — the opposite branch (a Wednesday holiday) would give 31, per Cboe's own SOQ example. **Headline test — the controlled FOMC pair:** `VX/H7` and `VX/K7` both have **21-session strips with exactly one closure** (Good Friday / Memorial Day) and differ **only** on FOMC membership (K7's 05-19→06-17 window holds **fomc-2027-06-09**), so the drag cancels out of the difference — the confound the April sibling's H7↔J7 pair carried is gone. Theory wants `res(K7)−res(H7)` at **+0.25/+0.50/+0.98** (k=1.5/2/3); measured **−0.0353** (09-04), **−0.0331** (09-03), **−0.1208** (09-02) — **wrong sign on all three**. **REFUTED**, harder than either sibling. **2×2 completed** (closure × FOMC): clean/noFOMC **+0.273** (n=1) · clean/FOMC **+0.079** · closure/noFOMC **−0.195** · closure/FOMC **−0.040** — the FOMC effect flips sign between rows, and the one row-difference matching theory (−0.468 vs 0.486 predicted) rests entirely on U6 and Z6, the two contracts already known to dominate this curve. Not identified; said so. **Third settlement date added** (2026-09-02, CSV 200/1,717b): R² **0.9739/0.9807/0.9778**, corr(closures,res) **−0.719/−0.708/−0.731**, corr(FOMC,res) **+0.112/+0.131/+0.104**, K7 residual **+0.126/+0.099/+0.066**. Ex-`Z6` corr(closures,res) **−0.370/−0.338/−0.373** — logged as a **preview** of `FT-vix-expiration-2027-04-21-2`, explicitly **not** scored (another lane's row, another board). **Structural:** J7→K7 gap is **27 days**, unique on a strip whose every other gap is 28 or 35. Adjacency — **peers:** none (`symbols: []`). **Macro:** strip contains SIFMA early close 05-28, blackout 05-29, Memorial Day 05-31, **FOMC 06-09**, BoJ 06-11, terminal opex 06-17 (all `estimate`); K7 expires before all of them while measuring all of them. **Volatility regime:** no prior reading to diff (baseline row); Cboe closes 09-04 **VIX9D 11.97 · VIX 14.53 · VIX3M 17.61 · VVIX 84.42**; strip U6 **16.2669** → K7 **21.15**, monotone contango, **K7 = +6.62 over cash**. On the hawkish 09-04 payrolls print cash and front rose (VIX 14.32→14.53, U6 +0.1288) while **K7 fell 0.175 (−0.82%), the strip's largest decline**. **Geopolitical:** nothing settlement-mechanics-specific. **Event tape:** playbooks grepped → **zero hits**; `src/`+`scripts/` grepped for third-Wednesday arithmetic → **zero hits**, so the "VIX settles the third Wednesday" trap (which gives 05-19) cannot fire in code today. `VXM` still stops at G7 on all three dates. **No adjacency proposed, and the refusal is computed:** applying leg 1's rule to all **28** contract months 2026-09→2028-12 finds **exactly one** displacement — this one — so no second displaced VIX expiration exists to file before 2029; `opex-2027-05-21` is declined on the sibling's already-corrected "constitutive input" grounds, and the monthly-opex gaps (**2027-01-15**, **2027-05-21**) are re-recorded unchanged as a calendar-seeding question. **`FT-vix-expiration-2027-05-18-1` and `-2` registered; a third declined** as near-trivially true by convergence. | Initial stance set: **stand aside** (structural row only); date `confirmed`. | 2026-10-05 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
