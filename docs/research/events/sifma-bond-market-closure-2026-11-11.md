# US bond market closed all day for Veterans Day, equities trading a full session — sifma-bond-market-closure-2026-11-11

**Kind:** rates · **Date:** 2026-11-11 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US/UK/Japan Holiday Recommendations panels, re-fetched and re-parsed 2026-09-05; the `estimate` label is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-summary-of-opinions-2026-11-10","cpi-2026-11-10","jobs-2026-11-06","mts-october-2026-11-12","ppi-2026-11-13","us-china-tariff-truce-expiry-2026-11-10"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside on the date, but keep two measured findings — one is an execution guard
worth more than the event.** The closure itself reproduces from primaries: SIFMA's US 2026 panel
reads exactly `Veterans Day` / `Wednesday, November 11, 2026` with **no early-close note** (the
full-closure shape), and NYSE's own hours grid lists **nine** holidays per year for 2026–2028 with
**zero** Veterans Day row — equities run 09:30–16:00 ET while the recommended USD fixed-income tape
is dark. What is new is measured, not sourced. **(1) The closure has a real, mechanically-predicted
tape signature, and it survives out-of-sample.** Bond ETFs — which keep trading on NYSE Arca while
the cash market they reference is shut — run about **half** their normal volume: TLT median
**0.483×** its own trailing-20 median (n=18 Veterans Day sessions), LQD **0.487×**, against SPY's
much milder **0.765×** on the same days. The paired gap TLT−SPY is **−0.287** (16 of 18 negative)
where an ordinary Wednesday's gap is **+0.039**. It then **replicates on Columbus Day**, the other
bonds-shut/equities-open holiday (n=24: TLT **0.481×**, 24 of 24 below 1.0×, gap **−0.346**,
21 of 24). Pooled across both: TLT **39 of 42** sessions below 0.80×. This is not a data-mined
calendar slot — the mechanism predicted the ordering before the measurement, and the ordering holds.
**(2) The "deferred repricing" story around the 11-10 CPI is REFUTED by the tape.** TLT's absolute
close-to-close move on the *next* session runs a median **0.946×** its trailing-20 median move —
i.e. **ordinary**, not elevated — and exceeds 1.5× only **12 of 42** times against a **32.0%**
unconditional baseline. The bond market does not visibly "catch up" the day after it was shut.
**(3) This date is not unique, and the calendar says it is.** The identical full-day split recurs on
**Columbus Day, Monday 2026-10-12** — 30 days *earlier*, on the same SIFMA panel, and not tracked;
proposed here as `sifma-bond-market-closure-2026-10-12.json` (`estimate`). Everything carries the
event's **`estimate`** label; `symbols: []`, impact `low`, and no house playbook is calendar-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended closure is not a market event and there is nothing to size | High | D-67, `symbols: []`, `impact: low`; `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for `holiday\|veterans\|columbus\|closure\|half-day\|early close` return **0 hits in both** | A holiday- or session-hours-keyed house playbook being written and back-tested before **2026-11-11** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Avoid** sizing any bond-ETF execution into 2026-11-11 — the liquidity finding is the deliverable | High | Measured: TLT **0.483×** / LQD **0.487×** trailing-20 median volume on Veterans Day (n=18), replicated at **0.481×** / **0.395×** on Columbus Day (n=24); pooled **39 of 42** below 0.80×. Half-normal depth is a slippage fact, not a trade | TLT's **2026-11-11** volume printing **at or above 0.80×** its trailing-20-session median — registered as **FT-sifma-bond-market-closure-2026-11-11-1**, score by 2026-11-18 |
| This month | **Watch** the 11-10 corridor, not the 11-11 date — the closure is the least consequential item in it | High | Six tracked events sit within ±5 days, three of them on **2026-11-10** alone: **confirmed** high-impact `cpi-2026-11-10` (BLS, 08:30 ET), high-impact `us-china-tariff-truce-expiry-2026-11-10` (`estimate`), and `boj-summary-of-opinions-2026-11-10`; `mts-october-2026-11-12` and `ppi-2026-11-13` follow | All three 11-10 items being re-dated or withdrawn before **2026-11-11**, leaving the corridor empty and the closure the only thing on it |
| This quarter | **Stand aside** on the deferred-repricing story — it is refuted, not merely unproven | Medium | Pooled n=42 closure days: TLT's next-session \|move\| runs **0.946×** its trailing-20 median (baseline 0.995×) and exceeds 1.5× only **12 of 42** vs a **32.0%** base rate. The shut day compresses (**0.615×**); the day after is ordinary | TLT's **2026-11-12** \|close-to-close\| exceeding **1.5×** its trailing-20-session median \|move\| — registered at LOW confidence as **FT-sifma-bond-market-closure-2026-11-11-3**, score by 2026-11-19, because that session follows a confirmed high-impact CPI the historical sample mostly lacked |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this date.** `symbols: []`, no calendar-keyed playbook, and the date is
  `estimate` — date-keyed *action* requires `confirmed` regardless. Nothing measured below changes that.
- **Execution guard (Wed 2026-11-11), the one finding worth carrying forward.** Bond ETFs keep
  trading while their underlying cash market does not. Plan TLT/LQD/HYG depth at roughly **half**
  normal (0.46×–0.49× median), and SPY at **~0.77×**. A size that is routine on an ordinary
  Wednesday is not routine here.
- **The closure is USD-denominated-wide, not US-venue-wide.** SIFMA's page states verbatim that its
  recommendations "apply to the trading of U.S. dollar-denominated government securities, mortgage-
  and asset-backed securities, over-the-counter investment-grade and high-yield corporate bonds,
  municipal bonds and secondary money market trading in bankers' acceptances, commercial paper and
  Yankee and Euro certificates of deposit" — and **all three** regional panels (US, UK, Japan) carry
  a `Veterans Day` / `Wednesday, November 11, 2026` card. Treasuries, MBS, credit, munis and money
  markets are all inside the recommendation, in every jurisdiction SIFMA publishes for (`estimate`).
- **Do not read the 11-11 tape as a rates confirmation of the 11-10 CPI.** There is no cash
  Treasury print that day; anything rates-shaped you see is ETF-only price discovery on half depth.
  That is a **reading** guard, not a prediction — the deferred-repricing prediction is refused below.
- **Do not treat this date as unique.** The same bonds-shut/equities-open shape lands on
  **Columbus Day, Monday 2026-10-12** (SIFMA US panel: `Columbus Day` / `Monday, October 12, 2026`,
  no early-close note; NYSE grid: no Columbus Day row). Proposed as
  `sifma-bond-market-closure-2026-10-12.json` (`estimate`).
- **Direction is a non-signal and is stated as one.** SPY on Veterans Day: up **13 of 24 (54.2%)**
  against a **54.1%** all-session base rate — the flattest possible result. No directional call
  exists on this date in either direction.
- **Watch (dated):** jobs **11-06** (confirmed, high) · CPI **11-10** (confirmed, high, 08:30 ET) +
  US–China truce expiry **11-10** (`estimate`, high) + BoJ opinions **11-10** · **this closure
  11-11** (equities full session; USD fixed income dark) · MTS **11-12** (confirmed) · PPI **11-13**
  (confirmed) · next tracked item **11-17** (retail sales, import/export prices).

## Initial research

### The question

The calendar seeded this row with a strong claim in its own `notes` field: that 2026-11-11 is "the
ONLY full-day cross-asset schedule split in the forward window," and that because the cash Treasury
market is shut one session after a confirmed CPI print, "the rates read of that print is deferred to
11-12." Both are testable. So the question is not *what is a bond market holiday* — the sibling
ledgers [`sifma-bond-early-close-2027-03-25`](sifma-bond-early-close-2027-03-25.md) and
[`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md) already settled the
early-close shape — it is **does a full closure leave a measurable signature the early closes did
not, and do the seeding note's two claims survive contact with the tape?**

**One-line verdict:** the closure *does* leave a real, mechanically-predicted and out-of-sample
replicated signature — bond ETFs trade at roughly half normal depth while equities barely thin —
and **both** of the seeding note's claims fail: the date is not unique (Columbus Day 2026-10-12 has
the identical shape and is untracked), and the deferred-repricing story is refuted by 42 pooled
observations showing an entirely ordinary next session.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.

- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 298,899 bytes, fetched
  2026-09-05. Parsed by region using the page's own `U.S.` / `U.K.` / `Japan`
  `<h2>` section headings as the attribution boundary (offsets 36,537 / 47,499 / 60,383), then by
  card (`h3` name / `span` date / `p` early-close note). The scope sentence and the settlement
  sentence were extracted verbatim from the page body, not inherited.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302 to `/trade/hours-calendars`,
  109,180 bytes. Its holiday data is `"text":"…"` cells rather than table markup; all 127 cells were
  extracted and the strings `Veterans`, `Columbus`, `Indigenous`, `November 11` and `October 12`
  each searched across the whole payload.
- **Measured, not sourced:** split/dividend-adjusted daily bars **with volume** for SPY, TLT, LQD,
  HYG, AGG, MUB and ^VIX, from the same Yahoo endpoint `scripts/research/market-data.mjs` uses
  (`bars()` itself drops the volume field, so the raw payloads were read directly). SPY 8,458 bars
  1993-01-29 → 2026-09-04; TLT/LQD from 2002-07-30; HYG from 2007-04-11; AGG from 2003-09-29; MUB
  from 2007-09-10; ^VIX close **14.53** on 2026-09-04. Every ratio, up-rate, sign test and placebo
  below is computed this session.
- **Definitions, stated so they can be refuted.** Volume ratio = session volume ÷ the **median**
  volume of its own trailing 20 sessions. Direction = close-to-close. **Veterans Day session** = a
  November 11 falling Mon–Fri with a SPY bar on it, 1993–2025 (n=24; there is no November-11 weekday
  in that span *without* a SPY bar, so the equity market was open on every one). **Columbus Day
  session** = the second Monday of October with a SPY bar, 1993–2025 (n=33). "Pooled" = both sets.
- **Not attempted this session:** `cmegroup.com` (403 to this runner across every prior sibling
  attempt) and `treasurydirect.gov`. The futures leg and any auction-settlement question are left
  **unstated** rather than assumed.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The full-closure shape reproduces from two independent primaries — SUPPORTED (and it stays
   `estimate`).** SIFMA's US 2026 panel renders the card as `Veterans Day` /
   `Wednesday, November 11, 2026` with **no** `Early Close` paragraph — structurally distinct from
   the early-close cards in the same panel (`Thanksgiving Day` / `Thursday, November 26, 2026` /
   `Early Close (2:00 p.m. Eastern Time): Friday, November 27, 2026`). NYSE's grid states "All NYSE
   markets observe U.S. holidays as listed below for 2026, 2027, and 2028" and lists nine holidays
   per year — New Year's Day, MLK, Washington's Birthday, Good Friday, Memorial Day, Juneteenth,
   Independence Day, Labor Day, Thanksgiving, Christmas — with **zero** occurrences of `Veterans`,
   `Columbus`, `Indigenous`, `November 11` or `October 12` anywhere in the payload. Equities
   therefore run the full core session 09:30–16:00 ET (plus early from 04:00 and late to 20:00). It
   stays `estimate` on three counts: the prefix taxonomy in `market-events-data.ts` has no slot for
   a trade association's recommended schedule; this lane may not self-confirm an in-sweep discovery;
   and the source is non-binding by its own terms.

2. **It is an annual fixture, not a 2026 quirk — SUPPORTED.** The same panel's 2027 tab carries
   `Veterans Day` / `Thursday, November 11, 2027`. Two published years, both full closures.

3. **The closure is USD-denominated-wide, and all three SIFMA regions agree — SUPPORTED, and it
   inverts the 12-31 sibling's headline finding.** Parsed by region from the page's own section
   headings, **each** of the US, UK and Japan panels carries a `Veterans Day` /
   `Wednesday, November 11, 2026` card. The page's own scope sentence explains why, verbatim: "All
   SIFMA holiday recommendations apply to the trading of U.S. dollar-denominated government
   securities, mortgage- and asset-backed securities, over-the-counter investment-grade and
   high-yield corporate bonds, municipal bonds and secondary money market trading in bankers'
   acceptances, commercial paper and Yankee and Euro certificates of deposit." So the recommendation
   follows the *currency*, not the venue — which is the exact opposite of `sifma-bond-early-close-2026-12-31`,
   where the three regions sat in three different states. Note the boundary honestly: this says
   nothing about JGB or gilt trading on 2026-11-11, which are outside the recommendation's stated
   scope and were not researched here.

4. **The closure has a measurable tape signature, and the mechanism predicted it — SUPPORTED, the
   central finding.** Bond ETFs keep trading on NYSE Arca while the cash market they reference is
   shut, so creation/redemption and underlying price discovery are impaired *for them specifically*
   and not for equities. Prediction before measurement: bond-ETF volume should thin **more** than
   SPY's on these days. Measured, each session against its own trailing-20 median volume:

   | Symbol | Veterans Day n | Median vol ratio | Columbus Day n | Median vol ratio | All-session baseline |
   |---|---|---|---|---|---|
   | **TLT** | 18 | **0.483×** | 24 | **0.481×** | 1.002× |
   | **LQD** | 18 | **0.487×** | 24 | **0.395×** | 1.005× |
   | **HYG** | 14 | 0.465× | 19 | 0.618× | 1.004× |
   | AGG | 17 | 0.651× | 22 | 0.586× | 1.007× |
   | MUB | 14 | 0.754× | 18 | 0.627× | 0.994× |
   | **SPY** | 24 | **0.765×** | 33 | **0.712×** | 0.995× |

   Sign tests against 1.0×: TLT **17 of 18** below (p = 0.0001), LQD 16 of 18 (p = 0.0007), HYG
   12 of 14 (p = 0.0065), SPY 20 of 24 (p = 0.0008). Pooled across both holidays, TLT is below
   **0.80×** on **39 of 42** sessions.

5. **The thinning is attributable to the closure, not merely to "a federal holiday" — SUPPORTED via
   a paired control.** SPY thins too (leg 4), so the raw ratios cannot separate "bonds are shut"
   from "people are off." The paired gap can. Per-session **bond-ETF ratio minus SPY ratio**:

   | Set | TLT−SPY median gap | negative | LQD−SPY | negative |
   |---|---|---|---|---|
   | **Veterans Day** | **−0.287** | 16 of 18 (p = 0.0007) | −0.206 | 12 of 18 (p = 0.119) |
   | **Columbus Day** | **−0.346** | 21 of 24 (p = 0.0001) | **−0.329** | 21 of 24 (p = 0.0001) |
   | Pooled | **−0.302** | 37 of 42 | — | — |
   | **All Wednesdays (placebo, n=1,731)** | **+0.039** | — | +0.040 | — |

   On an ordinary session bond ETFs trade *slightly more* than SPY relative to their own norms; on a
   bond-closure day they trade **~0.30 of a ratio-unit less**. The placebo is flat, and the effect
   replicates on a holiday in a different month with a different day-of-week — which is what
   distinguishes this from the data-mined year-end slot the 12-31 sibling refused.

6. **The seeding note's "deferred repricing to 11-12" is REFUTED — this is the leg that changes a
   reader's behavior.** If a shut cash market defers price discovery, the session *after* a closure
   should carry an outsized move. It does not. TLT, pooled n=42 closure days, each session's
   |close-to-close| expressed as a multiple of its own trailing-20 median |move|:

   | Session | Median ratio | Above 1.5× |
   |---|---|---|
   | The closure day itself | **0.615×** | 4 of 42 (9.5%) |
   | **The next session** | **0.946×** | **12 of 42 (28.6%)** |
   | All TLT sessions (baseline) | 0.995× | 1,933 of 6,040 (**32.0%**) |

   The shut day is genuinely compressed (0.615×, and only ~1-in-10 produces a large move); the day
   after is **indistinguishable from an ordinary session**, and if anything slightly quieter than
   baseline. Absolute figures agree: pooled next-session median |move| **0.530%** against a 0.528%
   TLT baseline, and next-session volume **0.944×** against 0.995×. No catch-up burst exists in this
   sample. **The honest boundary:** the 2026 instance is not a clean member of that sample — a
   confirmed high-impact CPI lands at D-1 here, which most of the 42 historical closures did not
   have. That is exactly why the refusal is registered as a LOW-confidence forward test rather than
   asserted (FT-…-3), and why the reading guard in the signals list survives even though the
   *prediction* is refused.

7. **The date is not the only full-day cross-asset split — REFUTED, and it produces a calendar
   proposal.** The seeding note calls 2026-11-11 "the ONLY full-day cross-asset schedule split in
   the forward window." The same SIFMA US panel, four cards earlier, reads `Columbus Day` /
   `Monday, October 12, 2026` — also with no early-close note — and NYSE lists no Columbus Day in
   any of 2026/2027/2028. That is the identical shape, **30 days before** this one, currently
   untracked (the calendar carries `imf-world-bank-annual-meetings-2026-10-12` on that date, not the
   closure). Proposed in this PR as `sifma-bond-market-closure-2026-10-12.json` (`estimate`, low).

8. **The corridor is loaded and the closure is its least consequential member — SUPPORTED.** Six
   tracked events sit within ±5 days: `jobs-2026-11-06` (**confirmed**, high),
   `boj-summary-of-opinions-2026-11-10` (`estimate`, low), **`cpi-2026-11-10`** (**confirmed**,
   high, 08:30 ET), `us-china-tariff-truce-expiry-2026-11-10` (`estimate`, **high**),
   `mts-october-2026-11-12` (**confirmed**, medium) and `ppi-2026-11-13` (**confirmed**, medium).
   Three land on 2026-11-10 alone, two of them high-impact. Any attribution of an 11-11 move to the
   bond closure has to clear a CPI print, a tariff-truce expiry and a BoJ publication first.

9. **Direction is flat and is reported as flat — SUPPORTED (a null result, deliberately kept).**
   SPY on Veterans Day sessions: up **13 of 24 = 54.2%**, against a **54.1%** all-session base rate
   over 8,436 sessions; median return +0.02%. The two smaller-sample outliers are noise and are
   named rather than dropped: HYG 5 of 14 up (35.7%) and MUB 10 of 14 (71.4%), both n < 15, in
   opposite directions, with no mechanism proposed for either. There is no directional edge here.

10. **Move magnitude is compressed on the day — SUPPORTED, consistent with legs 4–6.** SPY's median
    |close-to-close| on Veterans Day is **0.355%** against a 0.533% all-session median (Columbus Day:
    0.533%, i.e. normal — so this part does *not* replicate and is reported as Veterans-Day-only).
    TLT is 0.328% against 0.528% on Veterans Day and 0.327% on Columbus Day — that part **does**
    replicate, and it is the bond side, which is the side the mechanism speaks to.

11. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep
    of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|veterans|columbus|closure|half-day|early close` returns **zero hits in both**, run this
    session. No playbook can fire on this date in either direction.

12. **The futures and settlement legs are UNRESOLVED.** CME Globex hours on 2026-11-11 were not
    re-attempted (403s to this runner across every prior sibling lane), and no Treasury auction or
    settlement question was researched. This ledger asserts nothing about either. SIFMA's page does
    state, verbatim and re-extracted this session, that "Previously scheduled SIFMA early close
    recommendations do not affect the closing time for settlements" — but that sentence is about
    *early closes*, and it is not evidence about a full closure. Left unstated.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, and the source is a
recommendation. The supported outputs are guards, not trades: the half-depth bond-ETF execution
warning (legs 4–5, the one finding with real out-of-sample support), the reading guard that the
11-11 tape carries no cash-Treasury information (leg 3), the refusal of the next-day catch-up story
(leg 6), and the corridor's attribution trap (leg 8).

### Honest limits

- **The ETF-liquidity finding is about ETFs, not about the cash market.** It measures what happens
  to the listed proxies while the underlying is shut. It says nothing about cash Treasury or credit
  liquidity on 2026-11-11, and nothing about spreads, depth or impact — only share volume.
- **SPY thins too**, so the closure-attributable part is the *gap* (leg 5), not the raw ratio. The
  gap is the load-bearing statistic and it is a paired median with n=18 / n=24, not a regression
  with controls.
- **The Veterans Day sample assumes the recommendation held historically.** SIFMA's published panels
  cover 2026 and 2027 only; that every November-11 weekday back to 1993 was also a recommended full
  closure is an assumption this session did **not** verify against the archive. If some of those 24
  sessions were normal bond sessions, the measured effect is understated, not overstated — but the
  assumption is real and unchecked.
- **The Columbus Day replication is a different holiday**, not a second draw from this one. It is
  strong evidence for the *mechanism* and only indirect evidence about 2026-11-11 specifically.
- **Leg 6's refusal is weakest exactly where it matters.** The 2026 instance follows a confirmed
  high-impact CPI at D-1; most of the 42 historical closures did not. The refusal is registered at
  LOW confidence for that reason and should not be read as "nothing can happen on 11-12."
- **HYG, AGG and MUB are inconsistent** across the two holidays and across the paired test (MUB's
  Veterans Day gap is *positive*, +0.091, n=14). Only TLT and LQD support the finding cleanly. That
  disagreement is reported rather than dropped.
- **Volume ratios are single-listing, not consolidated tape**, and pre-2000 SPY bars come from a
  period of far thinner trading.
- **Legs 1–3 and 7 rest on SIFMA's and NYSE's published pages only**; the futures and
  settlement legs are missing entirely (leg 12).
- **Every trading-adjacent statement carries the `estimate` label.** Estimates widen caution and
  license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside on the date and **correct the seeding note in two places**,
while banking one execution guard that is worth more than the event. Concretely: (a) the closure
reproduces from two primaries and is an annual fixture, and it is **USD-denominated-wide** — all
three SIFMA regional panels carry the same 2026-11-11 card, the inverse of the 12-31 sibling's
three-way divergence; (b) the closure leaves a **real, mechanically-predicted tape signature** —
bond ETFs at roughly half normal depth (TLT 0.483×, LQD 0.487×) against SPY's 0.765×, with a paired
TLT−SPY gap of **−0.287** against a **+0.039** all-Wednesday placebo, **replicated** on Columbus Day
(gap −0.346, 21 of 24); (c) the seeding note's **"deferred repricing to 11-12" is refuted** —
pooled n=42, the next session runs 0.946× its trailing median |move| and clears 1.5× only 28.6% of
the time against a 32.0% base rate; (d) the seeding note's **"only full-day split in the forward
window" is false** — Columbus Day 2026-10-12 is the same shape, 30 days earlier, and is proposed
here as a new calendar file; (e) **direction is flat** (SPY 13 of 24 up, 54.2%, vs a 54.1% base
rate) and no directional call exists on this date. Every statement carries the event's **`estimate`**
label, and `symbols: []` with no calendar-keyed playbook means nothing can act on any of it.

**Kill switches:**

- **TLT's 2026-11-11 volume prints at or above 0.80× its trailing-20-session median** — leg 4's
  central finding fails on the instance that matters, and the execution guard is withdrawn.
  Registered as **FT-sifma-bond-market-closure-2026-11-11-1**, score by 2026-11-18.
- **TLT's 2026-11-11 volume ratio comes in at or above SPY's** — leg 5's attribution collapses; the
  thinning would then be "a federal holiday," not "the bond market is shut," and the whole mechanism
  argument goes with it. Registered as **FT-sifma-bond-market-closure-2026-11-11-2**, score by
  2026-11-18.
- **TLT's 2026-11-12 |close-to-close| exceeds 1.5× its trailing-20-session median |move|** — leg 6's
  refusal takes its first out-of-sample hit, and the "shut market defers the CPI read" story
  returns. Registered at LOW confidence as **FT-sifma-bond-market-closure-2026-11-11-3**, score by
  2026-11-19.
- **SIFMA revises, moves or withdraws the 2026-11-11 recommendation, or NYSE adds a 2026-11-11
  equity closure or early close** — the event's premise changes and legs 1, 3 and 10 all need
  re-deriving (a shortened equity session cannot be compared against the 24 full ones).
- **The 2026-11-10 CPI is re-dated or the US–China truce expiry resolves early** — leg 8's
  attribution trap loses its heaviest items and the corridor framing weakens.
- **A holiday- or session-hours-keyed house playbook is written and back-tested** — leg 11 goes
  stale and the stand-aside must be re-argued on measured data rather than on absence.
- **A VIX regime shift (≥ 3 points from 14.53) before the next check** — every liquidity reading
  here is a calm-tape measurement; a stressed tape overrides holiday liquidity profiles entirely,
  and the 2008 Veterans Day session (SPY −3.09% on a 0.94× volume ratio) is the in-sample proof.
- **SIFMA's archive shows Veterans Day was not a recommended full closure across the 1993–2025
  sample** — the third honest limit becomes a defect, and legs 4–6 must be re-cut on the subset of
  years the recommendation actually covered.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 67 | **Initial research.** Shape reproduces from two primaries: SIFMA US 2026 card `Veterans Day` / `Wednesday, November 11, 2026` with **no** early-close note; NYSE grid lists nine holidays per year 2026–2028 and contains **zero** `Veterans`/`Columbus`/`November 11`/`October 12` strings — equities full 09:30–16:00 ET. Annual fixture (2027 card: `Thursday, November 11, 2027`). **All three SIFMA regions** (US/UK/Japan) carry the same card; the page's scope sentence explains it — recommendations follow **USD-denominated** fixed income (Treasuries, MBS/ABS, IG/HY, munis, money markets), not a venue. **Measured this session (Yahoo daily bars w/ volume, ratio = session vol ÷ trailing-20 median):** Veterans Day n=18/24 — TLT **0.483×**, LQD **0.487×**, HYG 0.465×, SPY **0.765×** vs ~1.00× baselines; sign tests TLT 17/18 (p=0.0001), SPY 20/24 (p=0.0008). **Replicates on Columbus Day** (n=24/33): TLT 0.481× (24/24 below 1.0×), LQD 0.395×, SPY 0.712×. **Paired attribution:** TLT−SPY gap **−0.287** (16/18) Veterans, **−0.346** (21/24) Columbus, vs **+0.039** all-Wednesday placebo (n=1,731) — the thinning is the closure, not the holiday. Pooled TLT **39/42** below 0.80×. **Seeding note refuted twice:** (1) no deferred repricing — pooled next-session TLT \|move\| **0.946×** trailing median, >1.5× only **12/42 (28.6%)** vs a **32.0%** base rate, closure day itself 0.615×; (2) not the only full-day split — `Columbus Day` / `Monday, October 12, 2026` is identical and untracked. Direction flat: SPY up **13/24 (54.2%)** vs 54.1% base. Adjacency — peers n/a (`symbols: []`); macro: **confirmed** `cpi-2026-11-10` (high, 08:30 ET), `jobs-2026-11-06` (high), `mts-october-2026-11-12`, `ppi-2026-11-13`; VIX **14.53** (^VIX close 2026-09-04); geopolitical: `us-china-tariff-truce-expiry-2026-11-10` (high, `estimate`); tape: three tracked items on 11-10 alone. CME + treasurydirect not attempted — futures/settlement legs unstated. Proposes `sifma-bond-market-closure-2026-10-12.json` (`estimate`). | Initial stance set: **stand aside**, banking the half-depth bond-ETF execution guard and correcting the seeding note's uniqueness and deferred-repricing claims. Registers **FT-sifma-bond-market-closure-2026-11-11-1**, **-2** and **-3**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
