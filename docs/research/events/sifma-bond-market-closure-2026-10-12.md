# US bond market closed all day for Columbus Day, equities trading a full session — sifma-bond-market-closure-2026-10-12

**Kind:** rates · **Date:** 2026-10-12 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US/UK/Japan Holiday Recommendations panels, fetched and parsed 2026-09-05; corroborated by two Federal Reserve primaries and NYSE's hours grid. The `estimate` label is a source-prefix taxonomy gap plus a recommendation non-binding by its own terms, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","ecb-account-2026-10-08","fomc-blackout-start-2026-10-17","fomc-minutes-2026-10-07","g20-fmcbg-bangkok-2026-10-15","import-export-prices-2026-10-16","imf-world-bank-annual-meetings-2026-10-12","opex-2026-10-16","ppi-2026-10-15","retail-sales-2026-10-15","ssa-cola-2027-2026-10-14","treasury-10y-note-2026-10-07","treasury-30y-bond-2026-10-08","treasury-buyback-10y20y-2026-10-15","treasury-buyback-20y30y-2026-10-08","treasury-coupon-announcement-2026-10-15","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside on the date — and correct the execution guard this event inherited, because
applied to 2026 it points at the wrong instrument.** The closure itself reproduces from four
primaries, not two: SIFMA's US 2026 panel reads exactly `Columbus Day` / `Monday, October 12, 2026`
with **no early-close note**, NYSE's grid lists **nine** holidays per year for 2026–2028 with **zero**
Columbus Day row, and **both** Federal Reserve holiday schedules (Board K.8 and Federal Reserve
Financial Services) list `Columbus Day | October 12` for 2026 — so the federal-holiday leg is a hard
fact even though SIFMA's trading recommendation is not. Equities run 09:30–16:00 ET while the
recommended USD fixed-income tape is dark for **72 hours** (Fri 10-09 close → Tue 10-13 open). What
is new is measured. **(1) The sibling ledger's "bond ETFs at half depth, plan TLT at 0.48×" guard is
a 2002–2013 statistic and it has decayed.** Split by era on Columbus Day: TLT ran **0.235×** its own
trailing-20 median volume in 2002–2013 but **0.730×** in 2014–2025, and **0.976×** in 2025 — the sign
survives (10 of 12 negative vs SPY), the magnitude collapsed by two-thirds. **(2) The thinning
migrated to credit.** LQD went the other way: **0.505× → 0.282×**, with a paired LQD−SPY gap of
**−0.549** negative in **12 of 12** modern years and **10 of 10** of the last decade (p = 0.002). The
2026 guard is **LQD ≈ 0.28×, IEF ≈ 0.57×, TLT ≈ 0.73–0.80×** — not one number for "bond ETFs."
**(3) The 72-hour-gap version of the deferred-repricing story is refuted and inverted.** If a shut
cash market defers price discovery, Columbus's 72-hour gap should defer more than Veterans Day's
24-hour one. Measured, it defers **less**: TLT's next-session |move| runs **0.824×** its trailing
median after Columbus vs **1.107×** after Veterans, against a 0.995× baseline. **(4) This is the
clean instance.** Nothing tracked sits at D-1 and CPI is at **D+2** — where the 11-11 sibling had a
confirmed high-impact CPI at D-1 and downgraded its own refusal for it. Everything carries the
event's **`estimate`** label; `symbols: []`, impact `low`, no house playbook is calendar-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended closure is not a market event and there is nothing to size | High | D-37, `symbols: []`, `impact: low`; `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `holiday\|veterans\|columbus\|closure\|half-day\|early close` return **0 hits in both** | A holiday- or session-hours-keyed house playbook being written and back-tested before **2026-10-12** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Avoid** carrying the inherited "TLT at half depth" number into 2026 — it is stale by two-thirds | Medium | Columbus Day TLT volume ratio by era: **0.235×** (2002–2013, n=12) → **0.730×** (2014–2025, n=12) → **0.797×** (last 5) → **0.976×** in 2025. The paired TLT−SPY gap shrank from **−0.416** to **−0.140**. The direction survives; the size does not | TLT's **2026-10-12** volume printing **at or below 0.60×** its trailing-20-session median — the decay claim fails on the instance that matters. Registered as **FT-sifma-bond-market-closure-2026-10-12-2**, score by 2026-10-19 |
| This month | **Avoid** sizing **credit**-ETF execution into 2026-10-12 — that is where the depth actually goes | High | LQD's Columbus Day thinning **deepened** while TLT's decayed: **0.505× → 0.282×**, paired LQD−SPY gap **−0.549**, negative in **12 of 12** modern years and **10 of 10** of the last decade (sign-test p = 0.002). IEF sits between at **0.565×** / **−0.265** (9 of 10) | LQD's **2026-10-12** volume printing **above 0.50×** its trailing-20-session median — registered as **FT-sifma-bond-market-closure-2026-10-12-1**, score by 2026-10-19 |
| This quarter | **Stand aside** on the deferred-repricing story — the mechanism-directed test refutes it a second time | Medium | The 72-hour cash gap produces a **quieter** next session than the 24-hour one: TLT next-session \|move\| **0.824×** trailing median after Columbus (>1.5× in 8/24) vs **1.107×** after Veterans (4/18), baseline 0.995× / 32.0%. Gap length does not drive catch-up | TLT's **2026-10-13** \|close-to-close\| exceeding **1.5×** its trailing-20-session median \|move\| — registered as **FT-sifma-bond-market-closure-2026-10-12-3**, score by 2026-10-20 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this date.** `symbols: []`, no calendar-keyed playbook, and the date is
  `estimate` — date-keyed *action* requires `confirmed` regardless. Nothing measured below changes that.
- **Execution guard (Mon 2026-10-12), instrument-specific, not one number.** Plan **LQD/credit at
  roughly a quarter** of normal depth (0.28× modern median), **IEF ≈ 0.57×**, and **TLT only
  ≈ 0.73–0.80×** — the long-Treasury leg is no longer the thin one. SPY's own last five Columbus
  ratios are 0.75 / 0.78 / 0.94 / 0.82 / 1.12, i.e. barely thinned at all.
- **Do not carry the 11-11 sibling's `0.483×` TLT number to this date.** It is a pooled 2002–2025
  median dominated by an era when TLT was a young ETF; the last ten Columbus sessions median
  **0.731×** and 2025 printed **0.976×**. This ledger contradicts its sibling deliberately and
  registers the contradiction as a scored forward test rather than asserting it.
- **No reliable pre-holiday liquidity window on Friday 2026-10-09.** SIFMA recommends **no early
  close** on 10-09 (the panel attaches early-close notes explicitly, and this card has none), and
  the measured D-1 TLT−SPY gap is **+0.075**, negative in only 10 of 24 (p = 0.54) — indistinguishable
  from noise. Veterans Day *does* front-load (+0.239, 16 of 18, p = 0.0013); Columbus Day does not.
- **The closure is USD-denominated-wide, and all three SIFMA panels are dark on 10-12 — but for two
  different reasons.** The US and UK panels both read `Columbus Day` / `Monday, October 12, 2026`;
  the **Japan** panel reads `Health and Sports Day` / `Monday, October 12, 2026` — Japan's own
  national holiday, which also falls on the second Monday of October. So unlike 2026-11-11 (one
  holiday, three panels, currency scope), 10-12 is a **coincidence of two calendars**, and Tokyo is
  additionally shut domestically (`estimate`).
- **Reading guard: the IMF/World Bank Annual Meetings open in Bangkok on this exact date**
  (`imf-world-bank-annual-meetings-2026-10-12`, Oct 12–18, `estimate`). Any policy or communiqué
  headline out of that opening day **cannot be priced by the cash Treasury market until 10-13** —
  anything rates-shaped visible on 10-12 is ETF-only price discovery.
- **Direction is a non-signal and is stated as one.** SPY on Columbus Day: up **20 of 33 (60.6%)**
  against a **54.1%** all-session base rate, sign-test **p = 0.296**; median +0.097% vs +0.068%. TLT:
  up **12 of 24 (50.0%)**, median **−0.018%**. No directional call exists on this date.
- **Watch (dated):** jobs **10-02** (confirmed, high) · ISM services **10-05** (confirmed, high) ·
  the **3Y/10Y/30Y auction week 10-06 → 10-08** plus two buybacks (`estimate`) · FOMC minutes
  **10-07** (`estimate`) · **this closure 10-12** (equities full session; USD fixed income dark) +
  IMF/World Bank opens · CPI **10-14** (**confirmed**, high) + Beige Book **10-14** · retail sales +
  PPI **10-15** (**confirmed**) · opex **10-16** (**confirmed**) · FOMC blackout **10-17**.

## Initial research

### The question

This event exists because the [`sifma-bond-market-closure-2026-11-11`](sifma-bond-market-closure-2026-11-11.md)
research disproved that entry's own claim to be "the ONLY full-day cross-asset schedule split in the
forward window" and proposed this date as the correction. That sibling then measured Columbus Day as
its **out-of-sample replication** and concluded, pooled across both holidays, that bond ETFs run at
roughly **half** normal depth — banking "plan TLT/LQD/HYG depth at roughly half normal (0.46×–0.49×
median)" as its one carried-forward deliverable.

So the question here is not *does the closure have a tape signature* — that is settled and this
session reproduces it exactly. It is: **does the inherited execution guard actually hold for the
2026 instance of THIS date, and does the mechanism survive the tests that only a Monday closure can
run?** Two of those tests exist only here. A Columbus Day closure creates a **72-hour** cash-market
gap where Veterans Day 2026 creates a 24-hour one — the direct test of whether gap length drives
deferred repricing. And the correct placebo for a Monday event is **all Mondays**, not the
all-Wednesday control the sibling applied to both.

**One-line verdict:** the closure and its mechanism reproduce cleanly, but the inherited *magnitude*
does not survive an era split — TLT's thinning has decayed by two-thirds while credit's has
deepened, so the honest 2026 guard names LQD, not TLT; and the deferred-repricing story is refuted a
second time by a test that predicted its ordering in advance and got the inverse.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
Nothing below is inherited from the sibling ledger; every source was re-fetched and every statistic
recomputed this session, which is why the reproductions are reported as reproductions.

- **SIFMA** `sifma.org/resources/general/holiday-schedule/` — HTTP 200, 298,899 bytes transferred,
  fetched 2026-09-05. Parsed by region using the page's own `U.S.` / `U.K.` / `Japan` `<h2>` section
  headings as the attribution boundary (offsets 36,537 / 47,499 / 60,383), then card by card. The
  full US 2026 panel was extracted as text and read in sequence; the 2027 tab and the scope sentence
  were extracted verbatim.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,148 bytes. Its holiday
  data is `"text":"…"` cells rather than table markup; all **133** cells were extracted and the
  strings `Columbus`, `Indigenous`, `October 12`, `Veterans` and `November 11` each searched across
  the whole payload.
- **Federal Reserve, two primaries the sibling did not have.** `federalreserve.gov/aboutthefed/k8.htm`
  — HTTP 200, 82,205 bytes, page titled "K.8 — Holidays Observed by the Federal Reserve System
  2026-2030", own "Last Update: July 8, 2026". And `frbservices.org/about/holiday-schedules` — HTTP
  200, 94,776 bytes, titled "Federal Reserve System Holiday Schedule | Federal Reserve Financial
  Services". Both were parsed row by row.
- **Measured, not sourced:** split/dividend-adjusted daily bars **with volume** for SPY, TLT, LQD,
  HYG, AGG, MUB, **IEF, SHY** and ^VIX, from the same Yahoo endpoint `scripts/research/market-data.mjs`
  uses (`bars()` itself drops the volume field, so the raw payloads were read directly). SPY 8,458
  bars 1993-01-29 → 2026-09-04; TLT/LQD/IEF/SHY 6,065 from 2002-07-30; AGG 5,771 from 2003-09-29;
  HYG 4,883 from 2007-04-11; MUB 4,778 from 2007-09-10; ^VIX close **14.53** on 2026-09-04. IEF and
  SHY are added here specifically to test whether the effect is graded by duration.
- **Definitions, stated so they can be refuted.** Volume ratio = session volume ÷ the **median**
  volume of its own trailing 20 sessions. Move ratio = |close-to-close| ÷ the median |close-to-close|
  of its own trailing 20 sessions. **Columbus Day session** = the second Monday of October with a SPY
  bar, 1993–2025 (n=33 for SPY, n=24 for the 2002-inception ETFs). **Veterans Day session** = a
  November 11 falling Mon–Fri with a SPY bar, same span (n=24 / n=18). Era split at 2014-01-01 gives
  exactly 12 and 12 Columbus sessions for the 2002-inception names — a pre-stated midpoint, not a
  searched breakpoint.
- **Not attempted this session:** `cmegroup.com` (403 to this runner across every prior sibling
  attempt) and `treasurydirect.gov`. The futures leg is left **unstated** rather than assumed, which
  matters more here than usual — see leg 5.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The full-closure shape reproduces from four primaries, two of them new — SUPPORTED (and it
   still stays `estimate`).** SIFMA's US 2026 panel renders the sequence
   `Labor Day` / `Monday, September 7, 2026` → **`Columbus Day` / `Monday, October 12, 2026`** →
   `Veterans Day` / `Wednesday, November 11, 2026`, with an **empty** note paragraph on the Columbus
   card — structurally distinct from the early-close cards in the same panel (`Thanksgiving Day` /
   `Thursday, November 26, 2026` / `Early Close (2:00 p.m. Eastern Time): Friday, November 27, 2026`).
   NYSE's grid states "All NYSE markets observe U.S. holidays as listed below for 2026, 2027, and
   2028" and lists nine holidays per year, with **zero** occurrences of `Columbus`, `Indigenous`,
   `October 12`, `Veterans` or `November 11` in the payload. New this session: **both** Federal
   Reserve schedules carry the row `Columbus Day | October 12 | October 11 | October 9 | October 8 |
   October 14` for 2026–2030, and K.8's own preamble reads "For holidays falling on Sunday, all
   Federal Reserve offices will be closed the following Monday" — i.e. the Reserve Banks observe
   2026-10-12. That converts the *federal holiday* leg from an assumption into a primary-sourced
   fact. It stays `estimate` regardless, on three counts: the prefix taxonomy in
   `market-events-data.ts` scopes `FED:` to "federalreserve.gov **FOMC calendar**" and has no slot
   for a holiday schedule or for a trade association's recommendation; this lane may not self-confirm
   an event it discovered in-sweep; and the *trading* claim rests on SIFMA, which is non-binding by
   its own terms.

2. **It is an annual fixture, not a 2026 quirk — SUPPORTED.** The same panel's 2027 tab carries
   `Columbus Day` / `Monday, October 11, 2027`, also with an empty note paragraph. Both Federal
   Reserve schedules list it through **2030**. Five published years, all full closures.

3. **All three SIFMA regions are dark on 10-12, but for two different reasons — SUPPORTED, and it is
   a real distinction from the 11-11 sibling.** Parsed by region from the page's own section
   headings: the **US** and **UK** panels both render `Columbus Day` / `Monday, October 12, 2026`;
   the **Japan** panel renders **`Health and Sports Day`** / `Monday, October 12, 2026` — Japan's own
   national holiday, which also lands on the second Monday of October. The page's scope sentence,
   extracted verbatim, explains why a US holiday reaches the UK panel at all: "All SIFMA holiday
   recommendations apply to the trading of U.S. dollar-denominated government securities, mortgage-
   and asset-backed securities, over-the-counter investment-grade and high-yield corporate bonds,
   municipal bonds and secondary money market trading in bankers' acceptances, commercial paper and
   Yankee and Euro certificates of deposit." On 2026-11-11 the sibling found one holiday propagating
   across three panels by currency scope; here two independent calendars coincide. The honest
   inference, marked as an inference: a Tokyo desk is shut for its *own* domestic holiday on 10-12,
   not merely observing a US recommendation — so offshore USD coverage is thinner than on a US-only
   holiday. Nothing is asserted about JGB or gilt trading, which sit outside the recommendation's
   stated scope.

4. **The closure's tape signature reproduces exactly — SUPPORTED, and the sibling's Columbus numbers
   are confirmed independently.** Bond ETFs keep trading on NYSE Arca while the cash market they
   reference is shut. Measured this session, each session against its own trailing-20 median volume:

   | Symbol | Columbus n | Median vol ratio | below 1.0× | sign-test p | All-session baseline |
   |---|---|---|---|---|---|
   | **LQD** | 24 | **0.395×** | 24 of 24 | <0.0001 | 1.006× |
   | **TLT** | 24 | **0.481×** | 24 of 24 | <0.0001 | 1.002× |
   | **IEF** | 24 | 0.565× | 22 of 24 | <0.0001 | 1.006× |
   | AGG | 22 | 0.586× | 20 of 22 | 0.0001 | 1.007× |
   | MUB | 19 | 0.593× | 17 of 19 | 0.0007 | 0.994× |
   | HYG | 19 | 0.618× | 17 of 19 | 0.0007 | 1.004× |
   | SHY | 24 | 0.767× | 19 of 24 | 0.0066 | 0.994× |
   | **SPY** | 33 | **0.712×** | 28 of 33 | 0.0001 | 0.995× |

   Paired **bond-ETF ratio minus SPY ratio**, the attribution statistic: TLT **−0.346** (21 of 24,
   p = 0.0003), LQD **−0.329** (21 of 24, p = 0.0003), IEF **−0.196** (19 of 24, p = 0.0066), MUB
   −0.144 (p = 0.064), HYG −0.161 (p = 0.36), AGG −0.098 (p = 0.053), **SHY −0.051 (13 of 24,
   p = 0.84)**. Every figure the sibling published for Columbus Day reproduces to three decimals.

5. **The paired gap survives a correctly-matched placebo — SUPPORTED, and this fixes a small
   method flaw inherited from the sibling.** The sibling controlled both holidays against an
   **all-Wednesday** placebo of **+0.039**. For a Monday event the matched control is all Mondays.
   Recomputed, excluding the two holiday sets: TLT's all-Monday gap is **−0.004** (n=1,105, negative
   in 51.1%) — a true zero — against all-Wednesdays **+0.040** (n=1,238). LQD: Mondays **+0.033**,
   Wednesdays +0.042. So the honest Columbus effect size is **−0.346 against ≈0**, not against
   +0.039; the mismatched placebo slightly flattered the finding, and the finding does not need it.
   **SHY is the load-bearing counter-observation and is kept:** its cash market is shut identically,
   yet its gap is −0.051 and indistinguishable from SPY's. The effect is **concentrated, not
   universal across bond ETFs** — which the simple "the cash market is shut" story does not by itself
   predict. The most likely explanation is that the closure bites hardest where there is no exchange-
   traded fallback for hedging, and least where the instrument is used as a cash-parking vehicle
   whose flow is calendar-driven rather than price-discovery-driven. That is a **hypothesis, and it
   is unverified** — the CME futures leg that would test it was not obtainable (403), so it is stated
   as a candidate rather than a conclusion.

6. **The inherited "half depth" magnitude has DECAYED for Treasuries and DEEPENED for credit —
   SUPPORTED, and this is the leg that changes a reader's behavior.** The sibling's guard is a
   2002–2025 pooled median. Split at 2014-01-01 (12 Columbus sessions either side):

   | Symbol | 2002–2013 ratio | 2014–2025 ratio | last 5 | 2002–2013 gap | 2014–2025 gap | last 10 gap (neg / p) |
   |---|---|---|---|---|---|---|
   | **TLT** | **0.235×** | **0.730×** | 0.797× | −0.416 (11/12) | **−0.140** (10/12) | −0.140 (9/10, p = 0.021) |
   | **LQD** | 0.505× | **0.282×** | 0.282× | −0.137 (9/12) | **−0.549** (12/12) | −0.549 (**10/10**, p = 0.002) |
   | **IEF** | 0.521× | 0.593× | 0.583× | −0.100 (9/12) | −0.265 (10/12) | −0.265 (9/10, p = 0.021) |

   TLT's last five Columbus ratios read **0.37 / 0.77 / 0.80 / 0.80 / 0.98** — 2025 printed
   **0.976×**, i.e. no thinning at all. LQD's last ten read 0.42 / 0.25 / 0.20 / 0.22 / 0.49 / 0.28 /
   0.28 / 0.29 / 0.16 / 0.38 — **every one below 0.50×**. The *sign* survives everywhere and is still
   significant; the *magnitude* has migrated from long Treasuries to credit. The mechanism reading is
   consistent: corporate bonds trade OTC with no exchange-traded substitute, so an OTC closure is a
   hard constraint on LQD's arbitrage; TLT has meanwhile become a heavily-optioned macro expression
   whose flow does not require the cash Treasury tape. The 11-11 sibling's Veterans Day series shows
   the same credit migration (LQD 0.749× → 0.368×) with a much milder TLT decay (0.419× → 0.513×),
   so this is a real cross-holiday trend and not a Columbus artifact.

7. **The 72-hour-gap version of "deferred repricing" is REFUTED, and inverted — SUPPORTED as a
   refusal.** The sibling refuted the story on pooled data. This date permits the sharper,
   mechanism-directed form: a Columbus closure leaves the cash market dark for **72 hours** (Friday
   close to Tuesday open) where Veterans Day 2026 leaves it dark for 24. If a shut cash market defers
   price discovery, the longer gap must defer more. Measured, TLT's |close-to-close| as a multiple of
   its own trailing-20 median |move|:

   | Session | Columbus (n=24) | Veterans (n=18) | All-session baseline |
   |---|---|---|---|
   | The closure day itself | 0.961× (>1.5× in 4/24) | 0.432× (0/18) | 0.995× (32.0%) |
   | **The next session** | **0.824×** (8/24, 33.3%) | **1.107×** (4/18, 22.2%) | 0.995× (32.0%) |
   | The session after that | 0.856× (5/24) | 1.292× (8/18) | 0.995× |

   The **longer** gap produces the **quieter** next session. The ordering is the inverse of the
   prediction, so gap length does not drive catch-up and the refusal is strengthened rather than
   merely repeated. **Stated against my own finding:** the Columbus next-session pass rate for "no
   outsized move" is 16 of 24 = **66.7%**, essentially the 68.0% unconditional rate — the prediction
   is that the day is *ordinary*, and ordinary is the base rate. The test's information is in the
   inverted ordering, not in an impressive hit rate, and FT-…-3 is sized at zero accordingly.

8. **Closure-day compression replicates in absolute terms only — MIXED, and both metrics are
   reported.** TLT's median |close-to-close| on the closure day is **0.327%** on Columbus and 0.328%
   on Veterans, against a **0.529%** all-session median: the absolute compression replicates almost
   exactly. The trailing-normalized ratio does **not** (0.961× vs 0.432×), because the trailing-20
   window running into the second Monday of October is itself unusually quiet, so the denominator is
   small. The honest read is that the closure day carries a **normal-sized move for its own recent
   regime on materially reduced volume** — which is the execution problem stated precisely, and it is
   a sharper warning than the sibling's "compressed" framing, not a softer one.

9. **There is no reliable pre-holiday front-load on the Friday — SUPPORTED, and it differs from
   Veterans Day.** Veterans Day's D-1 TLT−SPY gap is **+0.239**, positive in **16 of 18**
   (p = 0.0013): bond ETFs trade materially *more* than SPY the session before. Columbus Day's D-1
   (the preceding Friday) gap is **+0.075**, negative in 10 of 24 (**p = 0.541**) — leaning positive
   but indistinguishable from noise. SIFMA also recommends **no early close** on Friday 2026-10-09
   (the panel attaches early-close notes explicitly and this card has none), so 10-09 is a full cash
   session. Practical consequence: the pre-holiday liquidity window that reliably exists before
   Veterans Day cannot be assumed here.

10. **The 2026 instance is the CLEAN one, where 2026-11-11 is contaminated — SUPPORTED.** Nothing
    tracked sits on Friday **2026-10-09** at all. The nearest prior items are the quarterly-cycle
    auction week — `treasury-3y-note-2026-10-06`, `treasury-10y-note-2026-10-07`,
    `treasury-30y-bond-2026-10-08` plus two buyback operations, and `fomc-minutes-2026-10-07` — all
    D-4 or earlier. The heavy macro sits **after**: **confirmed** high-impact `cpi-2026-10-14` at
    **D+2** with `beige-book-2026-10-14`, then **confirmed** high-impact `retail-sales-2026-10-15`
    and `ppi-2026-10-15`, `opex-2026-10-16`, and `fomc-blackout-start-2026-10-17`. The sibling
    registered its deferred-repricing refusal at **LOW** confidence explicitly because a confirmed
    CPI landed at its D-1; here that contamination is absent, which is why FT-…-3 is registered at
    MEDIUM rather than LOW despite the modest base rate in leg 7.

11. **The corridor's one same-day item is a reading trap, not a driver — SUPPORTED.**
    `imf-world-bank-annual-meetings-2026-10-12` (Bangkok, Oct 12–18, `estimate`, low) opens on this
    exact date, and `g20-fmcbg-bangkok-2026-10-15` follows inside the window. A policy headline out
    of the opening day cannot be priced by the cash Treasury market until 10-13; anything
    rates-shaped visible on 10-12 is ETF-only price discovery on reduced depth. This is a **reading**
    guard, not a prediction.

12. **Direction is flat and is reported as flat — SUPPORTED (a null result, deliberately kept).**
    SPY on Columbus Day sessions: up **20 of 33 = 60.6%** against a **54.1%** all-session base rate
    over 8,457 sessions — sign-test **p = 0.296**, i.e. not distinguishable from chance; median
    return +0.097% vs +0.068%. TLT: up **12 of 24 = 50.0%**, median **−0.018%**, against a 52.1% base
    rate. No directional edge exists here in either direction, and the mildly-positive SPY tilt is
    named as noise rather than dropped or promoted.

13. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
    of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|veterans|columbus|closure|half-day|early close` returns **zero hits in both**, run this
    session. No playbook can fire on this date in either direction.

14. **The futures and settlement legs remain UNRESOLVED, and leg 5 now depends on one of them.**
    `cmegroup.com` was not re-attempted (403s to this runner across every prior sibling lane) and
    `treasurydirect.gov` was not fetched. Two Federal Reserve pages were obtained this session, but
    neither carries an extractable sentence about Fedwire operating hours — the only `Fedwire` hits
    in either payload are navigation menu items, and K.8 itself defers to "the Federal Reserve Banks
    Financial Services holiday page for additional details on the operations of the Federal Reserve
    Banks." So the Reserve Banks' *observance* of 2026-10-12 is sourced; the payment-rail and
    settlement consequences are **not**, and are left unstated. This matters more than it did for the
    sibling because leg 5's candidate explanation for the SHY anomaly is an exchange-traded-fallback
    argument that CME hours would test directly.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, and the source is a
recommendation. The supported outputs are guards, not trades: the **instrument-specific** depth
warning (legs 4–6 — credit at ~0.28×, intermediate Treasuries ~0.57×, long Treasuries only
~0.73–0.80×), the correction of the inherited pooled number (leg 6), the withdrawal of any assumed
Friday front-load (leg 9), the reading guard that the 10-12 tape carries no cash-Treasury
information about a Bangkok headline (leg 11), and the second refusal of the catch-up story (leg 7).

### Honest limits

- **The era split is the whole basis of the headline and it is n=12 vs n=12.** A pre-stated midpoint
  is better than a searched one, but twelve observations per bucket is thin, and TLT's 2025 print
  (0.976×) is a single session doing a lot of rhetorical work. The forward test is registered at
  MEDIUM for exactly this reason.
- **TLT's decay is confounded with its own maturation.** In 2002–2005 TLT was a young ETF with
  trailing-20 volumes small enough that a quiet holiday collapses the ratio mechanically. The decay
  may be "TLT grew up" rather than "the closure stopped mattering" — those are not separable in this
  data, and the second reading is the one the guard depends on.
- **LQD's deepening is the mirror-image concern.** Its modern 10-of-10 record is strong, but LQD's
  own liquidity profile changed enormously over the same period (bond-ETF portfolio trading, the
  2020 Fed facility). The measured fact is solid; the causal attribution to the closure rests on the
  paired gap alone.
- **SHY refutes the simple version of the mechanism and the replacement is unverified.** SHY's cash
  market is shut identically and its gap is −0.051 (p = 0.84). The exchange-traded-fallback
  explanation offered in leg 5 was not tested, because CME hours were unobtainable.
- **The Columbus Day sample assumes the recommendation held historically.** SIFMA's published panels
  cover 2026 and 2027 only; the Federal Reserve pages cover 2026–2030. That every second Monday of
  October back to 1993 was also a recommended full *trading* closure is an assumption this session
  did **not** verify against SIFMA's archive (the page carries a "View Archive" link that was not
  followed). If some of those 24 sessions were normal bond sessions, the measured effect is
  understated, not overstated — but the assumption is real and unchecked.
- **The ETF-liquidity finding is about ETFs, not the cash market**, and about **share volume only** —
  nothing here measures spreads, depth, or market impact, which are what an execution guard would
  ideally be stated in.
- **Leg 7's refusal predicts "ordinary," and ordinary is the base rate.** Its in-sample pass rate
  (66.7%) barely differs from the unconditional 68.0%. The inverted Columbus-vs-Veterans ordering is
  the real evidence; the pass rate is not.
- **Every reading here is a calm-tape measurement** (^VIX 14.53 on 2026-09-04). The VIX≥20 subset of
  Columbus sessions shows a *larger* gap (−0.430, 8 of 8 negative, n=8) than the calm subset
  (−0.241, 13 of 16) — but that subset is dominated by the same early years that drive the era
  effect, so it is reported and not leaned on.
- **Volume ratios are single-listing, not consolidated tape**, and pre-2000 SPY bars come from a
  period of far thinner trading.
- **Every trading-adjacent statement carries the `estimate` label.** Estimates widen caution and
  license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside on the date, and **correct the execution guard this event was
created to validate** rather than inherit it. Concretely: (a) the closure reproduces from **four**
primaries — SIFMA's US panel, NYSE's hours grid, and both Federal Reserve holiday schedules, which
newly establish the federal-holiday leg as sourced fact — and is an annual fixture published through
2030, while remaining `estimate` on a taxonomy gap and a non-binding trading recommendation; (b) all
three SIFMA panels are dark on 10-12 but for **two different reasons** (US/UK `Columbus Day`, Japan
`Health and Sports Day`), unlike 11-11's single-holiday currency-scope propagation; (c) the tape
signature reproduces exactly (TLT 0.481×, LQD 0.395×, paired gaps −0.346 / −0.329) and now survives a
**correctly-matched all-Monday placebo of −0.004** rather than the sibling's all-Wednesday +0.039;
(d) **the inherited magnitude does not survive an era split** — TLT 0.235× → 0.730× (2025: 0.976×)
while LQD 0.505× → 0.282× with a −0.549 gap negative in 10 of 10 of the last decade, so the 2026
guard is **credit at ~0.28×, IEF ~0.57×, TLT ~0.73–0.80×**, not one number; (e) the
deferred-repricing story is **refuted a second time by an inverted prediction** — the 72-hour gap
produces a quieter next session (0.824×) than the 24-hour one (1.107×); (f) there is **no reliable
Friday front-load** here (+0.075, p = 0.541) where Veterans Day has a strong one (+0.239, 16 of 18);
(g) **direction is flat** (SPY 20 of 33 up, p = 0.296) and no directional call exists. Every
statement carries the event's **`estimate`** label, and `symbols: []` with no calendar-keyed playbook
means nothing can act on any of it.

**Kill switches:**

- **LQD's 2026-10-12 volume prints above 0.50× its trailing-20-session median** — leg 6's credit
  finding fails on the instance that matters and the primary execution guard is withdrawn.
  Registered as **FT-sifma-bond-market-closure-2026-10-12-1**, score by 2026-10-19.
- **TLT's 2026-10-12 volume prints at or below 0.60× its trailing-20-session median** — the decay
  claim fails, the sibling's pooled 0.48× guard is vindicated over this ledger's era split, and leg 6
  must be re-cut. Registered as **FT-sifma-bond-market-closure-2026-10-12-2**, score by 2026-10-19.
- **TLT's 2026-10-13 |close-to-close| exceeds 1.5× its trailing-20-session median |move|** — leg 7's
  refusal takes an out-of-sample hit on the *clean* instance, where the sibling's could be excused by
  a D-1 CPI. Registered as **FT-sifma-bond-market-closure-2026-10-12-3**, score by 2026-10-20.
- **TLT's or LQD's 2026-10-12 volume ratio comes in at or above SPY's** — leg 4's attribution
  collapses; the thinning would then be "a federal holiday," not "the bond market is shut."
- **SIFMA revises, moves or withdraws the 2026-10-12 recommendation, or NYSE adds a 2026-10-12
  equity closure or early close** — the premise changes and legs 1, 3, 8 and 9 all need re-deriving
  (a shortened equity session is not comparable to the 33 full ones the base rates are built from).
- **`cpi-2026-10-14` is re-dated to 10-12 or 10-13** — leg 10's "clean instance" claim dies, FT-…-3
  loses the reason it is registered above LOW, and the corridor framing must be rebuilt.
- **CME hours for 2026-10-12 become obtainable and show Treasury futures also halted** — leg 5's
  exchange-traded-fallback hypothesis for the SHY anomaly is refuted and the concentration of the
  effect needs a different explanation.
- **A holiday- or session-hours-keyed house playbook is written and back-tested** — leg 13 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.
- **A VIX regime shift (≥ 3 points from 14.53) before the next check** — every liquidity reading here
  is a calm-tape measurement, and the VIX≥20 Columbus subset behaves differently (gap −0.430, 8 of 8).
- **SIFMA's archive shows Columbus Day was not a recommended full closure across the 1993–2025
  sample** — the fifth honest limit becomes a defect and legs 4–8 must be re-cut on the subset of
  years the recommendation actually covered.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 37 | **Initial research.** Shape reproduces from **four** primaries: SIFMA US 2026 card `Columbus Day` / `Monday, October 12, 2026` with an **empty** note paragraph (full closure); NYSE grid nine holidays/yr 2026–2028, **zero** `Columbus`/`October 12` strings in 133 cells; **new** — `federalreserve.gov` K.8 and `frbservices.org` both list `Columbus Day \| October 12` for 2026–2030, sourcing the federal-holiday leg. Annual fixture (2027: `Monday, October 11, 2027`). **All three SIFMA panels dark, two reasons**: US/UK `Columbus Day`, **Japan `Health and Sports Day`** — a calendar coincidence, unlike 11-11's currency-scope propagation. **Measured (Yahoo daily bars w/ volume, ratio = session vol ÷ trailing-20 median):** Columbus n=24/33 — LQD **0.395×**, TLT **0.481×**, IEF 0.565×, SHY 0.767×, SPY **0.712×**; paired gaps TLT **−0.346** (21/24, p=0.0003), LQD −0.329, IEF −0.196, **SHY −0.051 (p=0.84 — the effect is concentrated, not universal)**. Sibling's Columbus figures reproduce to 3dp. **Placebo corrected**: all-**Monday** TLT gap **−0.004** (n=1,105), not the all-Wednesday +0.039 the sibling used — effect survives a matched control. **Headline: the inherited magnitude decayed.** Era split (12/12): TLT **0.235× → 0.730×** (2025: **0.976×**), gap −0.416 → −0.140; **LQD deepened 0.505× → 0.282×**, gap **−0.549**, 12/12 and **10/10** last decade (p=0.002); IEF 0.521× → 0.593×. 2026 guard = credit ~0.28×, IEF ~0.57×, TLT ~0.73–0.80×. **72h-gap test inverted**: TLT next-session \|move\| **0.824×** after Columbus vs **1.107×** after Veterans (baseline 0.995×) — the longer cash gap is the quieter one; deferred repricing refuted again. No Friday front-load (D-1 gap +0.075, p=0.541) where Veterans has +0.239 (16/18). Direction flat: SPY up **20/33 (60.6%)**, p=0.296. Adjacency — peers n/a (`symbols: []`); macro: **nothing at D-1**, auction week 10-06/07/08 + FOMC minutes 10-07 before, **confirmed** high `cpi-2026-10-14` at **D+2**, `retail-sales`/`ppi` 10-15, opex 10-16, blackout 10-17 → **this is the clean instance; 11-11 was contaminated by a D-1 CPI**; VIX **14.53** (^VIX 2026-09-04); geopolitical/policy: `imf-world-bank-annual-meetings-2026-10-12` opens same day (Bangkok) + `g20-fmcbg-bangkok-2026-10-15` — a reading trap, unpriceable by cash Treasuries until 10-13. CME + treasurydirect not attempted; no Fedwire sentence extractable from either Fed page — futures/settlement legs unstated. No new dated adjacent event discovered; no calendar proposal. | Initial stance set: **stand aside**, and **correct rather than inherit** the sibling's execution guard — the depth risk is in credit, not long Treasuries. Registers **FT-sifma-bond-market-closure-2026-10-12-1**, **-2** (which contradicts the sibling on purpose) and **-3**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
