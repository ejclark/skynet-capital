# Japan Ku-area of Tokyo CPI (February 2027, preliminary), 08:30 JST — japan-cpi-tokyo-flash-2027-02-26

**Kind:** macro-print · **Date:** 2027-02-26 (estimate, EST: stat.go.jp/english/data/cpi/1582.html "Consumer Price Index — Schedule of Release", re-fetched raw direct 2026-09-05 (HTTP 200, 13,839 bytes) and re-parsed cell-by-cell by this session independently of the sweep that seeded the entry; row 15 of the single 17-row table reads exactly `["January, 2027", "February 19", "February", "February 26", ""]`. Filed estimate on three counts: the confirmed-prefix taxonomy has BLS:/BEA:/CENSUS: and no slot for Japan's Statistics Bureau, this lane may not self-confirm an event discovered in-sweep, and the page's own stamp is still "Last Update : 23 January 2026") · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["nerc-computational-load-phase-ii-workplan-2027-03-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — but stop repeating that this release is uninformative, because the
sibling that said so tested the wrong thing.** This event exists in the calendar because
[japan-cpi-2027-03-19](japan-cpi-2027-03-19.md) registered a forward test expecting it to
underperform: over 319 months since 2000, the Tokyo flash's *level* lands closer to the same-month
national core print than last month's national print does only **36%** of the time, and over 27
Februaries only **33%**. Every one of those numbers replicates here exactly, from an independent
re-download of the same two e-Stat files. What no session has run is the standard follow-up: a
level contest is not an information test. Run it, and the answer flips hard. The zero-parameter
rule **"last month's national print, plus the Tokyo flash's own month-over-month change"** cuts
mean absolute error from persistence's **0.182pp to 0.117pp** across those same 319 months
(**0.178 → 0.123pp** over the 27 Februaries), beats persistence in **59%** of months and **67%** of
Februaries, and survives a strict expanding-window out-of-sample run with **no fitted parameter**.
The mechanism is measured, not asserted: the Tokyo-minus-national core gap is a **persistent**
regional wedge (lag-1 autocorrelation **0.834**), so it contaminates the flash's level and cancels
in its change — which is why subtracting a *constant* historical bias fails out of sample
(0.256pp, worse than raw Tokyo) while subtracting *last month's observed* wedge nearly halves the
error. **The practical consequence lands on the BoJ:** the sibling concluded the 2027-03-18 board
is pinned to ±0.178pp by its stale January print and that this flash "adds little." The board holds
all three inputs the rule needs, and using them pins February core to **±0.123pp** — about 31%
tighter. That is still not a trade: `symbols: []`, `impact: low`, no house playbook is keyed to
Japanese prices, and the date is **estimate**, which widens caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no position exists that this release could touch | High | `symbols: []`, `impact: low`, no house playbook keyed to Japanese prices, and at D-174 there is nothing to size | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2027-02-26** that the tape attributes to a Japanese CPI headline — the "no channel" premise fails and this doc is rebuilt |
| This week | **Stand aside; no Japanese CPI release falls in it** | High | The primary schedule re-parsed today puts the next national print at **2026-09-18** (August data) and the next Tokyo flash at **2026-10-02** — nothing lands **2026-09-07 → 2026-09-11** | Any Statistics Bureau CPI release dated inside **2026-09-07 → 2026-09-11**, which would mean the schedule page this entire document rests on is wrong |
| This month | **Watch 2026-09-18 as the first free test of the differenced rule — not as a trade** | Medium | National August core prints **2026-09-18** and Tokyo August core (**+1.79%**) is already published, so the rule below can be scored on a live print at zero cost before this event is ever pulsed again | The differenced rule missing the **2026-09-18** national August core by **more than 0.30pp** — more than double its historical mean error, which would say the recent window has broken the relationship this ledger is built on |
| This quarter | **Carry the differenced rule forward, not the sibling's "the flash loses to doing nothing" framing** | Medium | Benchmarked, not asserted: `national_{m−1} + (Tokyo_m − Tokyo_{m−1})` beats persistence on mean, median and head-to-head in every window tested, including a no-look-ahead expanding-window run and the full 1971-2026 history | **\|national Feb-2027 core − (national Jan-2027 core + Tokyo Feb-2027 core − Tokyo Jan-2027 core)\| ≥ \|national Feb-2027 core − national Jan-2027 core\|** — registered as **FT-japan-cpi-tokyo-flash-2027-02-26-1**, score by 2027-03-20 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to this release, to the 2027-02-26 Tokyo
  session or to the 2027-02-25 US session, in any branch. `impact: low`, `symbols: []`, date
  `estimate`.
- **The finding: the flash's information is in its change, not its level.** Same two e-Stat files
  the sibling ledgers used, same core measure (all items less fresh food), one predictor added.
  Mean absolute error against the national core y/y print — **Tokyo level vs persistence vs the
  rule `national_{m−1} + ΔTokyo`**, with the rule's head-to-head win rate over persistence:
  all months 2000-01 → 2026-07 (n=319) **0.250 · 0.182 · 0.117pp, wins 189/319 = 59%** · all
  months 2018+ (n=103) **0.201 · 0.231 · 0.116pp, wins 75/103 = 73%** · Februaries 2000-2026
  (n=27) **0.288 · 0.178 · 0.123pp, wins 18/27 = 67%** · Februaries 2018-2026 (n=9) **0.253 ·
  0.353 · 0.094pp, wins 9/9** · full history 1971 → 2026-07 (n=666) **0.333 · 0.250 · 0.159pp,
  wins 368/666 = 55%**. The rule is better on every sample and every statistic.
- **No parameter is fitted, and fitting one adds nothing.** The coefficient on ΔTokyo is held at
  **1**. An expanding-window out-of-sample run (train from 1971, evaluate 2000-01 → 2026-07, no
  look-ahead) gives **0.117pp** at b=1 versus **0.118pp** with b re-estimated every month — against
  persistence's 0.182pp. The regression that would justify fitting says the same thing: **ΔY =
  0.901·ΔT** (t=27.0, R²=0.70) over 319 months.
- **The mechanism is a persistent wedge, not noise — and that is testable, so it was tested.** The
  Tokyo-minus-national core gap has lag-1 autocorrelation **0.834** (2000+), mean **−0.153pp**, sd
  0.280pp. Idiosyncratic noise would show ρ≈0 and would not be removable by differencing. A
  *constant* bias correction is not the answer either: out of sample it scores **0.256pp**, worse
  than raw Tokyo's 0.250pp. Only **last month's observed** wedge works, which is exactly what the
  differenced rule uses.
- **Persistence does not encompass the flash.** Regressing national core *m* on both predictors
  over 319 months: **Y = 0.079 + 0.534·T (t=13.6) + 0.477·Y_{m−1} (t=12.6)**, R² = 0.971. Both
  coefficients are large and both are significant; neither predictor is redundant.
- **So the BoJ framing in the sibling ledger is corrected, in its own currency.** The 2027-03-18
  board holds national January (**2027-02-19**), Tokyo January (**2027-01-29**, proposed here) and
  this Tokyo February flash (**2027-02-26**) — every input the rule needs. Sibling: stale January
  alone pins February core to **±0.178pp**. This ledger: all three together pin it to **±0.123pp**.
  Least *freshly* informed, and better informed than the sibling credited.
- **The counterweight, stated up front rather than at scoring.** On the discrete "hits the printed
  one-decimal figure" metric the rule wins on the full sample (**33% vs 24%**) and on 2018+ (**31%
  vs 12%**) but **loses over 27 Februaries (19% vs 30%)**. The honest claim is a **tighter error
  distribution**, not a higher exact-hit rate in February.
- **This release lands on the US evening before a month-end session, on both sides.** 08:30 JST
  **2027-02-26** = **18:30 EST Thursday 2027-02-25** (US still on EST; DST starts 2027-03-14). And
  2027-02-28 falls on a Sunday, so **Friday 2027-02-26 is the last February trading session in both
  Tokyo and New York**.
- **Then Japanese prices go quiet for 20 days into a policy meeting.** From this flash to the BoJ's
  **2027-03-18** decision is **483.5 hours / 20.1 days**, and per the Bureau's own table **no
  Japanese CPI release falls in between** — the next is **2027-03-19**, one day after. This is the
  last Japanese CPI reading the March board holds.
- **Watch (dated)** — national Aug CPI **2026-09-18** (est; BoJ decision same day — the first free
  test of the rule) · Tokyo Sept flash **2026-10-02** · national Sept **2026-10-23** (est;
  **untracked in this calendar**, flagged not proposed) · Tokyo Oct **2026-10-30** (est; BoJ same
  day) · national Oct **2026-11-20** · Tokyo Nov **2026-11-27** (est) · national Nov **2026-12-18**
  (est) · Tokyo Dec flash + 2026 Tokyo yearly average **2026-12-25** (est) · national Dec + 2026
  Japan annual **2027-01-22** (est) · **Tokyo Jan flash 2027-01-29** (est, **proposed here** — this
  print's own m/m base and the rule's ΔTokyo input) · national Jan **2027-02-19** (est) ·
  **this flash 2027-02-26** (est) · FOMC blackout start **2027-03-06** (derived) · FOMC + first SEP
  **2027-03-17** (est) · **BoJ 2027-03-18** (est) · national Feb **2027-03-19** (est, alongside US
  triple witching) · Tokyo Mar flash + FY2026 Tokyo average **2027-03-26** (est) · food
  consumption-tax cut effective **2027-04-01** (est).

## Initial research

### The question, plainly

This event was discovered in the [japan-cpi-2027-03-19](japan-cpi-2027-03-19.md) initial-research
adjacency sweep and filed with an unusual note: it is **the instrument of a registered forward test
that expects it to underperform**. [FT-japan-cpi-2027-03-19-1](../forward-tests/japan-cpi-2027-03-19.md)
predicts that this flash lands **no closer** to the 2027-03-19 national February core print than
the 2027-02-19 national January print does — a strict inequality, scored 2027-03-20, with a stated
historical base rate of 67% at February.

That sibling's arithmetic is not in doubt and is not being re-litigated. The question this ledger
owns is narrower and it is the one nobody has asked: **a level contest between two forecasts is not
a test of whether either carries information.** Two estimators can both be biased and one can still
carry all the news. So: *does the Tokyo flash carry information the previous national print does
not?*

**One-line verdict: yes, decisively, and it sits in the flash's month-over-month change rather than
its level — which is why a level contest missed it and why both the sibling's conclusion and this
one can be true at the same time.**

The stance is unchanged and was never in doubt — stand aside, `impact: low`, `symbols: []`. What
changes is that the next session inherits a usable estimator instead of a refusal.

**Method:** sourced primary research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md),
every fetch made and parsed by this session on **2026-09-05**, independently of the sweep that
seeded this entry:

- **stat.go.jp "Schedule of Release"** (`/english/data/cpi/1582.html`, HTTP 200, 13,839 bytes) —
  its single 17-row table re-parsed cell-by-cell; row 15 reads
  `["January, 2027", "February 19", "February", "February 26", ""]`.
- **Japan Cabinet Office public-holiday CSV** (`www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv`,
  HTTP 200, 21,538 bytes, Shift-JIS) — all 17 of 2027's holidays listed; the February pair is
  **2027-02-11** and **2027-02-23**, and **2027-02-26 is clear**.
- **e-Stat**, the Bureau's own portal: `Table 1-1 Subgroup Index for Japan, Monthly` and its Tokyo
  counterpart, downloaded as XLSX (`stat-search/file-download?statInfId=000040491314&fileKind=4`
  and `…317`) and parsed locally out of the OOXML — **679 national monthly observations 1970-01 →
  2026-07** and **680 Tokyo 1970-01 → 2026-08**, 2025-base. Every CPI figure here is computed from
  those two files. Column `J` is the BoJ's core measure (all items less fresh food).
- **VIX** from CBOE's daily-history CSV (`cdn.cboe.com/api/global/us_indices/daily_prices`), close
  **14.53** on **2026-09-04**.

No instrument scripts: `symbols: []`, there is no issuer, and `earnings-cycle.mjs` /
`intraday-edges.mjs` have no macro mode. Adjacency computed against the live calendar with the same
±5-day window `event-material-decide.mjs` uses.

### Conviction legs, tested

1. **The sibling's numbers replicate exactly, on an independent re-download — SUPPORTED.** Before
   disputing a framing it is worth confirming the arithmetic under it. Recomputed here from files
   fetched fresh today: Tokyo level vs persistence at predicting national core y/y — all months
   2000-01 → 2026-07 (n=319) **0.250 vs 0.182pp, Tokyo wins 114/319 = 36%**; 2018+ (n=103) **0.201
   vs 0.231, 54/103 = 52%**; Februaries 2000-2026 (n=27) **0.288 vs 0.178, 9/27 = 33%**; Februaries
   2018+ (n=9) **0.253 vs 0.353, 6/9 = 67%**. Every figure matches
   [japan-cpi-2027-03-19](japan-cpi-2027-03-19.md) to three decimals, and the series lengths
   (679/680) and the 2026 prints match too. **Nothing below is a dispute about the data.**

2. **The flash's change predicts the national change, and it is not close — SUPPORTED, and it is
   this session's finding.** The level contest asks "which number is nearer?" The information
   question asks "does knowing the flash improve the forecast?" Regressing the national core y/y
   *change* (ΔY = Y_m − Y_{m−1}) on the Tokyo core y/y *change* (ΔT = T_m − T_{m−1}):

   | Sample | slope on ΔT | t | R² | corr(ΔT, ΔY) | sign agreement |
   |---|---|---|---|---|---|
   | All 2000-01 → 2026-07 (n=319) | 0.901 | 27.0 | 0.697 | 0.835 | 221/279 = 79% |
   | 2018-01 → 2026-07 (n=103) | 0.819 | 17.4 | 0.749 | 0.866 | 86/96 = 90% |
   | Februaries 2000-2026 (n=27) | 0.794 | 8.3 | 0.732 | 0.855 | 20/23 = 87% |
   | Full 1971 → 2026-07 (n=666) | 0.926 | 46.8 | 0.767 | 0.876 | 449/590 = 76% |

   The slope sits near 1 in every window and is measured to many standard errors from zero. So the
   estimator that follows needs **no fitted parameter**: take last month's national print and add
   the flash's own month-over-month change.

3. **That zero-parameter rule beats persistence on every sample, statistic and window tested —
   SUPPORTED.** Mean absolute error against the realised national core print, with the level and
   persistence columns from leg 1 for reference:

   | Sample | Tokyo level | Persistence | **Y_{m−1} + ΔTokyo** | median | rule wins |
   |---|---|---|---|---|---|
   | All 2000+ (n=319) | 0.250 | 0.182 | **0.117** | 0.112 | **189/319 = 59%** |
   | 2018+ (n=103) | 0.201 | 0.231 | **0.116** | 0.110 | **75/103 = 73%** |
   | Februaries 2000-2026 (n=27) | 0.288 | 0.178 | **0.123** | 0.113 | **18/27 = 67%** |
   | Februaries 2018-2026 (n=9) | 0.253 | 0.353 | **0.094** | 0.104 | **9/9 = 100%** |
   | Full 1971+ (n=666) | 0.333 | 0.250 | **0.159** | 0.115 | **368/666 = 55%** |

   A simple average of the two level forecasts — the other obvious combination — does *not* do
   this: it scores 0.180pp over 2000+, essentially tying persistence and winning only 46% of
   months. **The gain is specifically from differencing, not from combining.**

4. **It survives a strict out-of-sample run with no look-ahead — SUPPORTED, and this is the leg
   that makes leg 3 more than curve-fitting.** Expanding window: train on 1971 → *m−1* only,
   forecast month *m*, evaluate over 2000-01 → 2026-07 (n=319). Results, all out of sample: raw
   Tokyo **0.250**, persistence **0.182**, **Y_{m−1} + ΔTokyo at b=1: 0.117**, and with b
   re-estimated every month from history alone: **0.118**. Fitting the coefficient makes it
   marginally *worse*, which is the expected signature of a rule whose parameter did not need
   estimating. The rule beats persistence in **189/319 = 59%** of out-of-sample months.

5. **The mechanism is a persistent regional wedge — SUPPORTED, and it REFUTES the mechanism the
   sibling ledger inferred.** [japan-cpi-2027-03-19](japan-cpi-2027-03-19.md) explains its result
   as "Japanese core y/y is highly persistent … while Tokyo is a regional subsample carrying its
   own idiosyncratic noise." Idiosyncratic noise is testable and it is not what the data show. The
   Tokyo-minus-national core gap has **lag-1 autocorrelation 0.834** (2000+; 0.807 for 2018+, 0.894
   at February) with mean **−0.153pp** and sd 0.280pp — a slow-moving wedge, not noise. Noise would
   show ρ≈0, would not persist month to month, and could not be cancelled by differencing.

   The wedge is not a *constant* either, and separating those two cases is the whole test:

   | Correction applied to the Tokyo level | MAE 2000+ (in-sample) | MAE out-of-sample |
   |---|---|---|
   | none (raw Tokyo level) | 0.250 | 0.250 |
   | minus a constant historical bias | 0.224 | **0.256 — worse than raw** |
   | minus **last month's observed** wedge (= Y_{m−1} + ΔTokyo) | **0.117** | **0.117** |

   A constant correction barely helps in sample and *hurts* out of sample. Only the local,
   time-varying correction works. **That is the honest mechanism: the flash is a good signal
   wearing a persistent level offset, and last month's national print is the free instrument that
   measures the offset.**

6. **Persistence does not encompass the flash — SUPPORTED, and this is the formal version of legs
   2-4.** Forecast encompassing asks whether one predictor makes the other redundant. Regressing
   national core *m* on both, 319 months from 2000: **Y = 0.079 + 0.534·T_m (t=13.6) + 0.477·Y_{m−1}
   (t=12.6)**, R² = **0.9707**. Over 2018+ the flash's weight rises to **0.703 (t=10.9)**. Neither
   coefficient is near zero on any sample; the two predictors carry genuinely separate information,
   and the near-equal weights are why an unweighted differenced rule works so well.

7. **The BoJ's 2027-03-18 board is better informed than the sibling credited — SUPPORTED, and the
   correction is stated in the sibling's own units.** [japan-cpi-2027-03-19](japan-cpi-2027-03-19.md)
   concluded that the March board's stale January print pins February core to **0.178pp mean
   absolute / 0.116pp median** over 27 Februaries, and that the Tokyo February flash "adds little
   and in February has historically subtracted." The first half is right and replicates. The second
   half is what legs 2-6 refute. The board holds every input the differenced rule needs, and all
   three publish before it sits:

   | Input | Release | Status |
   |---|---|---|
   | national January 2027 core (Y_{m−1}) | 2027-02-19 | estimate |
   | Tokyo January 2027 core (T_{m−1}) | 2027-01-29 | estimate, **proposed in this PR** |
   | Tokyo February 2027 core (T_m) — **this event** | 2027-02-26 | estimate |

   Combined, they pin February national core to **0.123pp mean absolute** over 27 Februaries
   against the stale print's 0.178pp — roughly **31% tighter**. The sibling's headline conclusion
   ("least freshly informed, and that is nearly costless") survives; its supporting claim that the
   flash subtracts does not.

8. **The counterweight that cuts the other way — MIXED, and it is stated here rather than
   discovered at scoring.** Measured on whether the forecast *rounds to the printed one-decimal
   figure*, rather than on distance:

   | Sample | persistence hits | rule hits | flash moves the rounded forecast | of decisive moves, improvements |
   |---|---|---|---|---|
   | All 2000+ (n=319) | 78/319 = 24% | **104/319 = 33%** | 239/319 = 75% | 151/236 = **64%** |
   | 2018+ (n=103) | 12/103 = 12% | **32/103 = 31%** | 90/103 = 87% | 69/90 = **77%** |
   | Februaries (n=27) | **8/27 = 30%** | 5/27 = 19% | 22/27 = 81% | 12/20 = **60%** |

   The rule wins the exact-hit metric handily on the two large samples and **loses it on the 27
   Februaries**, even though its mean error over those same 27 months is materially lower (0.123 vs
   0.178pp). That is what a small sample on a discrete metric looks like, and the defensible claim
   is the continuous one: **a tighter error distribution, not a higher exact-hit rate in February**.
   The February direction signal is meanwhile strong — the flash's change agrees in sign with the
   national change in **20 of 23** non-tied Februaries.

9. **The date, the holiday check and the empty Remarks cell — SUPPORTED, re-verified
   independently.** Row 15 of the schedule table parses as `["January, 2027", "February 19",
   "February", "February 26", ""]` on a raw re-fetch today: this flash releases **2027-02-26** and
   its **Remarks cell is empty**, so unlike the 2026-12-25 flash (2026 Tokyo yearly average) and
   the 2027-03-26 flash (FY2026 Tokyo average) it carries **no supplementary headline**.
   2027-02-26 is a **Friday**; the Cabinet Office CSV lists 2027's February holidays as
   **2027-02-11** (建国記念の日) and **2027-02-23** (天皇誕生日, a Tuesday), leaving the release date
   clear but giving Tokyo a **four-session week**. The generic staleness caveat still applies — the
   page is stamped `Last Update : 23 January 2026`, ~19½ months old at fetch.

10. **The clock, and a month-end coincidence the calendar does not record — SUPPORTED,
    arithmetic.** With the US still on EST (DST begins 2027-03-14) and JST fixed at UTC+9:

    | Event | Local | UTC |
    |---|---|---|
    | **This flash** | **08:30 JST 2027-02-26** | **2027-02-25 23:30** |
    | US equivalent | **18:30 EST Thursday 2027-02-25** | — |
    | Tokyo cash close | 15:00 JST 2027-02-26 | 2027-02-26 06:00 |
    | US cash open | 09:30 EST 2027-02-26 | 2027-02-26 14:30 |

    The release lands on the US **evening before**, so New York gets a full session to price it —
    the reverse of the 2027-03-19 corridor, where Tokyo closes 7.5h *before* New York opens.
    Separately: **2027-02-28 is a Sunday**, so **Friday 2027-02-26 is the final February trading
    session in both Tokyo and New York**. Any US tape move that day has a month-end rebalancing
    story available alongside the CPI one — which is an attribution caution, not a channel.

11. **Then a 20-day Japanese price vacuum into the BoJ — SUPPORTED.** From this release to the
    BoJ's 2027-03-18 decision is **483.5 hours = 20.1 days**, and the Bureau's table places **no
    Japanese CPI release inside that window**; the next is the national February print on
    **2027-03-19**, one day *after* the meeting. So this flash is the **last Japanese CPI reading
    the March board holds**, which is precisely what makes leg 7's arithmetic the interesting
    reading of this event rather than a footnote.

12. **A missing calendar entry, found by walking the schedule against the calendar — SUPPORTED, and
    proposed.** Checking all 14 future release dates on the parsed table against
    `src/domain/market-events/` shows the **Tokyo January 2027 flash, 2027-01-29** (schedule row 14)
    is **not tracked**. It is this print's own month-over-month base and the **ΔTokyo input of every
    number in legs 2-8** — without it the rule cannot be computed at all. Proposed in this PR as
    [`japan-cpi-tokyo-flash-2027-01-29`](japan-cpi-tokyo-flash-2027-01-29.md), `status: "estimate"`.
    The same walk shows the **national September 2026 print (2026-10-23)** is also untracked; it is
    four months from this event and outside any honest reading of this event's adjacency, so it is
    **flagged here and deliberately not proposed** — it belongs to whoever pulses that corridor.

13. **Realised Japanese inflation is where the siblings left it — SUPPORTED, re-derived rather than
    cited.** From the same e-Stat files, 2025-base, year-on-year core (less fresh food): national
    2026 **+1.92 / +1.52 / +1.72 / +1.40 / +1.50 / +1.50 / +1.79** (Jan→Jul); Tokyo 2026 **+1.93 /
    +1.83 / +1.72 / +1.50 / +1.30 / +1.60 / +1.69 / +1.79** (Jan→Aug). The freshest Japanese reading
    anywhere remains **Tokyo August 2026** (released 2026-08-28), core **+1.79%**, all-items
    **+1.99%**. The latest observable wedge is **Tokyo July minus national July = −0.10pp**, inside
    one sd of its 2000+ mean. **No projection of the February 2027 flash is made here** — seven of
    the intervening months are unpublished, and a number would be invention.

14. **No tracked symbol carries a channel to this release — SUPPORTED, inherited, unchanged.**
    `symbols: []`, `impact: low`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed. Nothing
    in legs 1-13 creates one; a sharper forecast of a print no position touches is calibration.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size, in any branch. Four instructions for the next session:

- **Read-only, and cheaply.** At `impact: low` with `symbols: []` this event's whole value is
  calibration. A pulse should cost a schedule re-check and a data refresh.
- **Carry the rule, not the refusal.** `national_{m−1} + (Tokyo_m − Tokyo_{m−1})` is the free
  estimator to reach for. The sibling's "the flash loses to doing nothing" is true of the flash's
  *level* and false of the flash's *information*; quoting the first half alone is the error this
  ledger exists to prevent.
- **Score it on 2026-09-18 for free.** Tokyo August core (+1.79%) is already published and national
  July core (+1.79%) is the base, so the rule's forecast for the national August print is
  computable today and is settled by a release five months before this event's first real pulse
  matters. Two more free tests follow on 2026-10-23 and 2026-11-20.
- **Re-check the vintage question before promoting anything.** The honest limits below name the one
  weakness that could undo legs 2-8, and it is the cheapest thing a future session could actually
  resolve.

### Honest limits

**The single largest threat is a vintage mismatch this session could not measure.** e-Stat serves
one **revised** vintage of the Tokyo series. The real-time version of the rule would mix a *final*
Tokyo January reading (published alongside the national January print) with a *preliminary* Tokyo
February reading — and the differenced rule uses **two** Tokyo observations where the level
comparison uses one, so any revision noise bites it harder. Nothing this session fetched measures
the size of the Tokyo preliminary-to-final revision. This caveat applies equally to the sibling's
level statistics, so it does not favour one conclusion over the other, but it is the reason legs
2-8 are stated at Medium and not High, and it is the obvious next piece of primary work.
**The slope on ΔT is reliably a little below 1** (0.901 with se 0.033 over 2000+; ~3 standard
errors from 1), so b=1 is marginally aggressive — but the fitted-b out-of-sample run scores 0.118
against b=1's 0.117, so nothing operational rests on it. **The exact-hit metric contradicts the
mean-error metric at February** (leg 8), on n=27; both are reported rather than the flattering one.
**The February sample is n=27 (n=9 post-2018)** and nothing month-specific here is statistically
separable from the other eleven months. **Both series splice the 2019 consumption-tax hike and the
2020-base → 2025-base change**, and the Bureau's own rule is that rates of change are not
recomputed across a base change — so every historical average here is a real average over a spliced
series, not a stationary property. **Persistence is a weak benchmark by construction** and beating
it is not the same as beating a professional forecaster; no consensus, whisper or survey estimate
for this print exists in this document — a deliberate non-spend at D-174 on a `low`-impact release
with no tracked symbol. **The 08:30 JST release time is the Bureau's standing convention and is
still not read off any fetched page**, unchanged from the entry that seeded this ledger and still
the weakest element of the header; leg 10's clock inherits that weakness, though a ±few-hour error
would not change which US session the release precedes. **The schedule page's own stamp remains
"Last Update : 23 January 2026"**, ~19½ months stale at fetch. And **no forecast of this flash
itself is offered** — seven intervening months are unpublished.

**Access notes for the next session:** all three sibling access findings held on independent
re-fetch — e-Stat XLSX via `stat-search/file-download?statInfId=<id>&fileKind=4` (ids
`000040491314` national, `000040491317` Tokyo) serves to a browser-UA curl and parses out of plain
OOXML (`xl/worksheets/sheet1.xml` + `xl/sharedStrings.xml`; column `B` is `YYYYMM`, `I` all items,
`J` core, `M` core-core, data from row 14); the Cabinet Office holiday CSV needs
`iconv -f SHIFT_JIS`; CBOE's own CDN returned VIX first try. Byte counts matched the sibling
session's exactly (13,839 / 21,538), which is itself a small corroboration that neither page moved.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely.** No position, no play, no size, in any
branch — `impact: low`, `symbols: []`, no house playbook keyed to Japanese prices. What this ledger
takes are three analytical positions, none of them positional.

First, **the Tokyo flash carries real, incremental information, and it lives in the flash's change
rather than its level.** The zero-parameter rule `national_{m−1} + (Tokyo_m − Tokyo_{m−1})` scores
**0.117pp** mean absolute error against the realised national core print over 319 months since 2000
— against persistence's **0.182pp** and the raw Tokyo level's **0.250pp** — and beats persistence
in **59%** of months, **73%** of months since 2018, **67%** of the 27 Februaries and **9 of 9**
Februaries since 2018. It survives an expanding-window out-of-sample run with no look-ahead
(**0.117pp**), and re-estimating its coefficient every month makes it marginally worse (0.118pp),
which is the signature of a parameter that did not need estimating. Formally, persistence does not
encompass the flash: **Y = 0.079 + 0.534·T (t=13.6) + 0.477·Y_{m−1} (t=12.6)**, R² 0.971. Stated at
**Medium** rather than High for one reason and it is named in the limits: the Tokyo vintage
question is unresolved.

Second, **this does not contradict the sibling ledger — it completes it, and the mechanism is now
measured rather than inferred.** [japan-cpi-2027-03-19](japan-cpi-2027-03-19.md)'s arithmetic
replicates to three decimals on an independent re-download; the Tokyo *level* genuinely does lose
to doing nothing. The reason is a **persistent regional wedge** — Tokyo-minus-national core has
lag-1 autocorrelation **0.834**, mean −0.153pp — that contaminates the level and cancels in the
change. The sibling attributed the result to Tokyo's "idiosyncratic noise"; noise would show ρ≈0
and would not be removable, and a *constant* bias correction indeed fails out of sample (0.256pp,
worse than raw Tokyo). Only the local correction works. **Both conclusions are true at once**: bad
level, good signal.

Third, **the BoJ's 2027-03-18 board is meaningfully better informed than the sibling credited, and
this flash is why.** The board holds national January (2027-02-19), Tokyo January (2027-01-29,
proposed here) and this flash (2027-02-26) — all three of the rule's inputs — and there is **no
Japanese CPI release in the 20.1 days between this print and the meeting**. Combining them pins
national February core to **0.123pp** against the stale January print's **0.178pp**, roughly 31%
tighter. The sibling's headline — least *freshly* informed, and nearly costlessly so — survives;
its supporting claim that the flash "adds little and in February has historically subtracted" does
not.

**Kill switches:**

- **Rule kill (registered):** the differenced rule landing **no closer** to the 2027-03-19 national
  February core print than the 2027-02-19 national January print does. Registered as
  **FT-japan-cpi-tokyo-flash-2027-02-26-1**, score by **2027-03-20**. A kill says the first stance
  above is re-derived, not patched — and it is deliberately the *complement* of
  [FT-japan-cpi-2027-03-19-1](../forward-tests/japan-cpi-2027-03-19.md) rather than its opposite:
  over 27 Februaries both pass together in 9, at least one passes in **all 27**, and neither
  outcome forces the other.
- **Date kill (registered):** the Statistics Bureau moving this flash off **Friday 2027-02-26**.
  Registered as **FT-japan-cpi-tokyo-flash-2027-02-26-2**, score by **2027-02-27**.
- **Adjacency kill (registered):** the Tokyo **January 2027** flash not releasing on **2027-01-29**,
  which would void the entry proposed in this PR and remove the rule's ΔTokyo input. Registered as
  **FT-japan-cpi-tokyo-flash-2027-02-26-3**, score by **2027-01-30**.
- **Free-test kill:** the differenced rule missing the **2026-09-18** national August core print by
  **more than 0.30pp** — more than double its historical mean error, computable today from
  already-published numbers (Tokyo August core +1.79%, national July core +1.79%). Two further free
  tests follow on **2026-10-23** and **2026-11-20**. Three misses of that size in a row would say
  the relationship has broken in the recent window and legs 2-8 are recomputed on it.
- **Vintage kill:** any primary source showing the Tokyo *preliminary* series is revised by more
  than **~0.1pp** on average before its final publication. That would mean legs 2-8 were computed
  on numbers no real-time forecaster held, and the whole finding is re-run on preliminary vintages
  or withdrawn. This is the cheapest open question and the next session should look for it first.
- **Wedge-regime kill:** the Tokyo-minus-national core wedge exceeding **±0.6pp** (about twice its
  2000+ sd) at any release between **2026-09-18** and **2027-02-26**. The whole mechanism rests on
  a slow-moving wedge; a jump breaks legs 5-7 together. Note the **2027-04-01** food
  consumption-tax cut ([japan-food-tax-cut-2027-04-01](japan-food-tax-cut-2027-04-01.md), **−1.19pp**
  on core) is a national-weight shock landing *after* this event and outside the window, but it is
  exactly the sort of event that would trip this switch if any regional pre-effect appeared.
- **Channel kill:** a tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05
  → 2027-02-26** that the tape attributes to a Japanese CPI headline. Leg 14's "no channel" claim
  would be false. Re-check every pulse.
- **Holiday kill:** Japan's Cabinet Office republishing its 2027 list with a public holiday on or
  adjacent to **2027-02-26** — the one mechanism that has actually moved a release in this table.
  Free to re-check from the CSV every pulse.

Three forward tests registered in
[`forward-tests/japan-cpi-tokyo-flash-2027-02-26.md`](../forward-tests/japan-cpi-tokyo-flash-2027-02-26.md)
— **-1** (the differenced rule beats persistence), **-2** (this flash releases on Friday
2027-02-26) and **-3** (the Tokyo January flash releases 2027-01-29). One dated adjacent event
proposed as `estimate` in the same PR from the same primary table:
[`japan-cpi-tokyo-flash-2027-01-29`](japan-cpi-tokyo-flash-2027-01-29.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-174 | Initial research banked (above). **The sibling's level contest was not an information test, and running the information test flips the answer.** [japan-cpi-2027-03-19](japan-cpi-2027-03-19.md)'s figures replicate to three decimals on an independent re-download (Tokyo level vs persistence: 2000+ n=319 **0.250 vs 0.182**, wins 36%; Februaries n=27 **0.288 vs 0.178**, wins 33%). But the zero-parameter rule **`national_{m−1} + (Tokyo_m − Tokyo_{m−1})`** scores **0.117pp** (2000+), **0.116** (2018+), **0.123** (27 Februaries), **0.094** (9 Februaries since 2018) and **0.159** (full 1971+ n=666) — beating persistence in **59% / 73% / 67% / 100% / 55%** of months. **Out of sample**, expanding window with no look-ahead: **0.117pp at b=1** vs 0.118 with b re-fitted monthly vs persistence's 0.182. Underneath: **ΔY = 0.901·ΔT (t=27.0, R²=0.70)**, sign agreement 79% (90% since 2018, 20/23 Februaries); **encompassing Y = 0.079 + 0.534·T (t=13.6) + 0.477·Y_{m−1} (t=12.6), R²=0.971** — persistence does not encompass the flash. **Mechanism measured, and it REFUTES the sibling's inferred one:** the Tokyo-minus-national wedge has **lag-1 autocorrelation 0.834** (mean −0.153pp, sd 0.280) — a persistent regional offset, not "idiosyncratic noise" (ρ≈0). Confirmed by elimination: a *constant* bias correction scores **0.256 out of sample, worse than raw Tokyo's 0.250**, while last month's *observed* wedge gives 0.117. A plain average of the two levels gives 0.180 — **the gain is differencing, not combining**. **Consequence: the BoJ 2027-03-18 board is better informed than credited.** It holds all three inputs (national Jan 2027-02-19, Tokyo Jan 2027-01-29, this flash 2027-02-26); combined they pin national February core to **0.123pp** vs the stale print's **0.178pp**, ~31% tighter. Least *freshly* informed survives; "the flash adds little and in February has subtracted" does not. **Counterweight stated up front:** on the discrete rounds-to-the-printed-figure metric the rule wins 33% vs 24% (2000+) and 31% vs 12% (2018+) but **loses 19% vs 30% over 27 Februaries** — small-sample discreteness; the honest claim is a tighter distribution, not a higher exact-hit rate. **Clock:** 08:30 JST 2027-02-26 = **18:30 EST Thu 2027-02-25** (US on EST, DST starts 2027-03-14), so NY gets a full session — the reverse of the 2027-03-19 corridor. **2027-02-28 is a Sunday, so 2027-02-26 is the last February session in both Tokyo and NY** (month-end attribution caution, not a channel). Then **483.5h / 20.1 days** to BoJ 2027-03-18 with **no Japanese CPI release in between** — this is the last reading the March board holds. **Date re-verified independently:** schedule row 15 re-parses as `["January, 2027","February 19","February","February 26",""]` (HTTP 200, 13,839 B) — **Remarks empty**, so unlike 2026-12-25 and 2027-03-26 this flash carries no annual headline. Cabinet Office CSV (HTTP 200, 21,538 B, Shift-JIS): 2027 February holidays are **02-11** and **02-23** (a Tuesday, giving Tokyo a four-session week); **2027-02-26 clear**. Adjacency sweep: **peers** — none, `symbols: []`. **Macro** — national 2026 core y/y +1.92/+1.52/+1.72/+1.40/+1.50/+1.50/+1.79 (Jan→Jul), Tokyo +1.93/+1.83/+1.72/+1.50/+1.30/+1.60/+1.69/+1.79 (Jan→Aug); latest observable wedge **−0.10pp**; **no projection of this flash made** (7 intervening months unpublished). **Volatility** — VIX **14.53** (2026-09-04 close, CBOE CDN). **Geopolitical/policy** — 2027-04-01 food consumption-tax cut (−1.19pp on core) lands *after* this event, inherited not re-sourced. **Event tape** — only tracked event within ±5d is `nerc-computational-load-phase-ii-workplan-2027-03-01`; February 2027 is otherwise empty in this calendar. **One dated adjacency proposed as `estimate`:** `japan-cpi-tokyo-flash-2027-01-29` (schedule row 14; untracked; it is this print's own m/m base and the rule's ΔTokyo input). Also **flagged, deliberately not proposed** — the national Sept-2026 print **2026-10-23** is untracked but four months away and outside this event's adjacency. **Own weaknesses:** the e-Stat Tokyo series is a single *revised* vintage while the real-time rule mixes a final T_{m−1} with a preliminary T_m, and the revision size is unmeasured by anything fetched — the largest threat, and why this is Medium not High; the ΔT slope is ~3 se below 1 (fitting it changes nothing operationally); exact-hit and mean-error metrics disagree at February on n=27; both series splice the 2019 tax hike and the 2020→2025 base change; persistence is a weak benchmark and no consensus/whisper was sourced (deliberate non-spend at D-174); the 08:30 JST time remains unsourced convention; the schedule page is unrefreshed since **2026-01-23**. | — (stance set: stand aside completely, no position in any branch; **the flash's information is in its change, not its level — bad level predictor, good signal**, at **Medium** because the Tokyo preliminary-vintage question is unresolved; three commitments — carry the differenced rule rather than the sibling's refusal, score it free on **2026-09-18**/10-23/11-20 before this event's first real pulse, and hunt the preliminary-to-final revision size first) | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
