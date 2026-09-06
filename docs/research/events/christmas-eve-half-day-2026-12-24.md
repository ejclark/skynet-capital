# US equity markets close early at 1:00 p.m. ET — Christmas Eve, with the bond tape open an hour longer — christmas-eve-half-day-2026-12-24

**Kind:** sector · **Date:** 2026-12-24 (estimate — NEWS: NYSE `nyse.com/markets/hours-calendars` footnote ****, re-fetched 2026-09-05; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","durable-goods-2026-12-23","gdp-q3-2026-third-2026-12-23","japan-cpi-tokyo-flash-2026-12-25","pce-2026-12-23"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — this is a liquidity event, not a directional one, and the "half a
session" shorthand is wrong in both directions.** Measured this session from SPY daily bars
(1993–2025, n=18 Christmas Eve half sessions): volume runs a **median 0.34× the trailing 20-session
average** (IQR 0.27–0.42) against a **0.94×** all-session baseline — under the **0.54×** that 3.5 of
6.5 hours would predict. **But that gap is closing, and this ledger says so against its own
headline:** the first nine observations median **0.27×**, the last nine **0.41×**, the last five
**0.50×** — statistically indistinguishable from the hours prediction. So the honest 2026
expectation is **0.40–0.55×**, not 0.34×, and the full-sample median is a floor on how thin to
expect rather than a forecast. Direction is a coin flip regardless: **9 of 18 up** on open→close,
median **+0.04%**, median absolute move **0.25%** vs a **0.44%** baseline. The date rests on
**three independent primaries** fetched
today — NYSE (equities 09:30–13:00, "1:15 p.m. for eligible options"), Cboe (`Christmas Early
Close · December 24 · 09:30:00 - 13:00:00`) and SIFMA (fixed income **2:00 p.m. ET**) — and it is
the **only** Christmas Eve early close NYSE publishes anywhere in its 2026–2028 table, so no
year-over-year comparison exists next year. What actually makes the week worth reading is *where
the information sits*: BEA's published 2026 schedule **ends on Wednesday 2026-12-23**, and that one
08:30 ET slot carries **November PCE**, the **Q3 third GDP estimate with corporate profits**, and
Census's **advance durable goods** — after which the tape gets one 3.5-hour equity session (4.5
hours of bonds) and then goes dark until Monday **2026-12-28**. Two things this ledger explicitly
**refuses**: the Santa Claus Rally, which fails its own control (23 of 33 positive, **69.7%** vs a
**58.7%** unconditional 7-session base rate, one-sided binomial **p = 0.134**), and any read of the
half day as informative. Everything here carries the event's **`estimate`** label; `symbols: []`,
impact `low`, and no house playbook is calendar-keyed. Nothing is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-110) | **Stand aside** — there is nothing here to size | High | `symbols: []`, `impact: low`, and `trade-playbooks.md` + `multi-symbol-sweep.md` grepped this session for `holiday\|christmas\|half-day\|early close\|closure\|santa` return **0 hits in both**. An early close moves nothing by itself | A house playbook keyed on holiday-adjacent sessions being written and back-tested before **2026-12-24** — the "nothing is calendar-keyed" leg goes stale and this sheet is rebuilt on measured data |
| This week | **Stand aside; bank the measurement, don't trade it** | High | The live calendar item this week is `fomc-blackout-start-2026-09-05`, not a December half day. The only thing worth doing now is written down: the session's liquidity profile, measured rather than assumed | Any figure in the table below failing to reproduce from Yahoo SPY daily bars on the stated definition (trailing-20-session mean volume) before **2026-10-05** |
| This month | **Treat the corridor's information as front-loaded into Wed 12-23, not spread across the week** | Medium | BEA's own schedule, fetched today, ends at **December 23 · 8:30 AM** and stacks *two* releases there (PCE Nov 2026; Q3 GDP third + corporate profits); Census M3 dates advance durable goods to **12/23/2026**. The half day carries no scheduled US macro this session could source | BEA or Census publishing any US release dated **2026-12-24**, or DOL's claims schedule (unretrievable today, 403 ×3) proving initial claims keeps its 08:30 Thursday slot on **2026-12-24** — the "no fresh macro on the half day" leg falls |
| This quarter | **Do not buy the Santa Claus Rally — it does not clear its own control** | Medium | SPY 1993–2025: the last-5-plus-first-2 window was positive **23 of 33** (69.7%, median +0.80%) against **58.7%** / +0.46% for all 8,451 rolling 7-session windows. One-sided binomial **p = 0.134** — not distinguishable at n=33. And 2026's window anchors on the **12-23** close, i.e. a print-distorted baseline | The 2026-12-23 → 2027-01-05 window returning **≥ +2.47%** (the 90th percentile of the 33 in-sample observations, nearest-rank), observed **2027-01-06** — one such print does not resurrect the seasonal, but it is the observation this refusal would have to answer for |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a trade on this date.** `symbols: []`, no calendar-keyed playbook, and the date is
  `estimate` — date-keyed *action* requires `confirmed` regardless.
- **Execution guard (Thu 2026-12-24, the asymmetry):** equities stop at **13:00 ET**; SIFMA
  recommends fixed income to **14:00 ET** (`estimate`, SIFMA page fetched today). The bond tape
  **outlives** the equity tape by an hour — the inverse of the usual shape. A cross-asset leg can
  be adjusted for one hour after its equity leg is frozen.
- **Execution guard (slippage, measured, drift-adjusted):** full-sample median **0.34×** normal
  volume (IQR 0.27–0.42, thinnest **0.17×** in 2008), but the **last five observations median
  0.50×** — so plan against **~0.40–0.55×**, and treat 0.34× as the thin tail rather than the
  expectation. Either way it is materially less depth than a normal session.
- **The exact 2026 configuration has n=4.** Dec 25 last fell on a Friday in **1998, 2009, 2015,
  2020** — volume ratios **0.20 / 0.27 / 0.35 / 0.42** (median **0.31**, the thinnest
  configuration of the three). Next-session median **−0.01%**. Four observations decide nothing.
- **The un-hedgeable gap is real but modest.** Median |close 12-24 → next open| = **0.34%** across
  the 18; **0.43%** on the four three-day-weekend precedents; the all-session overnight baseline is
  **0.28%**. Call it 1.2–1.5× a normal overnight, not a cliff.
- **After 13:00 ET Thursday there is no venue.** Cboe's own hours table lists **no** global-trading-
  hours session following the 12-24 close (the row reads `8:15 PM (Wed) to 9:25 AM (Thu)`) and
  `December 25 · None · None` — unlike Thanksgiving Friday, which does carry an evening session.
  First US venue open is Monday **2026-12-28**.
- **Correction to a sibling's phrasing, not its call:** [`pce-2026-12-23`](pce-2026-12-23.md) reads
  "nothing can be hedged after the print until 12-28." The hedging window is not zero — it is **one
  3.5-hour equity session** (and 4.5 hours of bonds). Thin, not absent. Its stand-aside is unaffected.
- **Attribution trap:** a move on Monday **2026-12-28** has a PCE/GDP/durables explanation, a
  four-calendar-day-gap explanation, a year-end-rebalance explanation, an
  `advance-economic-indicators-2026-12-28` explanation and a `boj-summary-of-opinions-2026-12-28`
  explanation before it has any single one.
- **Watch (dated):** opex **12-18** · PCE + GDP-third + durables **12-23** · **this half day 12-24**
  · closed **12-25** · Tokyo CPI flash **12-25** (19:30 ET Thu, into no US session) · reopen
  **12-28** · FOMC minutes **12-30** · SIFMA bond early close **12-31** (proposed this pass) ·
  reopen **2027-01-04**.

## Initial research

### The question

The seeding entry filed this half day on a cross-asset framing: it is one of the few dated sessions
where the bond tape outlives the equity tape. Is that the most useful thing about it — and does a
3.5-hour session earn a calendar row at all?

**One-line verdict:** the cross-asset framing **survives and is now triple-primaried**, but it is
not the load-bearing finding. The session's real character is **liquidity**, and it is measurably
worse than "half a day" — a median **0.34×** normal volume against the **0.54×** its hours predict —
while the week's *information* is stacked entirely onto the preceding Wednesday, which is where BEA's
published 2026 schedule ends.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). The instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any data
pull. Nothing below is quoted from the seeding note; every primary was re-fetched today and every
number was computed this session.

- **NYSE** `nyse.com/markets/hours-calendars` (HTTP 200 after its 302, 109,180 bytes) — the holiday
  grid parsed cell-by-cell out of its JSON-ish `"text":"…"` payload, all four footnotes read.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` (HTTP 200, 298,926 bytes) — the
  US 2026 and 2027 panels parsed out of the page's embedded payload.
- **Cboe** `cboe.com/about/hours/us-options/` (HTTP 200, 386,028 bytes) — the US options holiday
  and extended-hours table.
- **BEA** `bea.gov/news/schedule` (HTTP 200, 75,122 bytes) — the full 2026 release grid.
- **Census** `census.gov/manufacturing/m3/release_schedule.html` (HTTP 200, 53,177 bytes).
- **EIA** `eia.gov/petroleum/supply/weekly/schedule.php` (HTTP 200, 52,283 bytes) — the Weekly
  Petroleum Status Report holiday-shift table.
- **Measured, not sourced:** SPY and ^VIX split/dividend-adjusted daily bars from the same Yahoo
  endpoint `scripts/research/market-data.mjs` uses (SPY: 8,458 bars, 1993-01-29 → 2026-09-04;
  ^VIX: 9,238 bars, 1990-01-02 → 2026-09-04). All session counts, volume ratios, return
  distributions and the binomial control below are computed from those bars.
- **Attempted and failed, recorded rather than worked around:** DOL's initial-claims schedule
  (`dol.gov/ui/data.pdf`, `dol.gov/newsroom/releases/eta`, `oui.doleta.gov/press/2026/` — **403 ×3**),
  OCC's holiday schedule (`theocc.com` — Cloudflare interstitial), Cboe's expiration calendar
  (**404**) and its 2026 holiday PDF on `cdn.cboe.com` (**403**), BLS's 2026 schedule (**403**).

### Conviction legs, tested

1. **The date and hours are right, and now rest on three independent primaries — SUPPORTED (and
   still `estimate`).** NYSE footnote **** reads verbatim: *"Each market will close early at 1:00
   p.m. (1:15 p.m. for eligible options) on Thursday, December 24, 2026. NYSE American Equities,
   NYSE Arca Equities, NYSE National, and NYSE Texas late trading sessions will close at 5:00 p.m.
   All times are Eastern Time."* Cboe's US options hours table independently lists `Christmas Early
   Close | December 24 | 09:30:00 - 13:00:00`. SIFMA's US 2026 panel reads `Christmas Day | Friday,
   December 25, 2026 | Early Close (2:00 p.m. Eastern Time): Thursday, December 24, 2026`. **Why it
   stays `estimate`:** the prefix taxonomy in `market-events-data.ts` has no slot for an exchange
   operator's hours page, and this lane may not self-confirm an event it discovered in-sweep. The
   label is about the taxonomy, not the evidence — and since every honest call here is a
   stand-aside, it costs nothing.

2. **An unreconciled 15-minute discrepancy between two primaries — DISCLOSED, not resolved.** NYSE
   says options close at **1:15 p.m.**; Cboe's own table says **13:00:00**. The plain reading is
   that NYSE's 1:15 applies to *eligible options on NYSE's own options venues* and Cboe's 13:00 to
   Cboe's, but no source fetched today states that, so it is **not asserted**. Anyone timing an
   options close on this date should read their own venue's notice, not this ledger.

3. **This is the only Christmas Eve early close in NYSE's published window — SUPPORTED, and it
   kills the obvious follow-up study.** Across 2026 / 2027 / 2028 NYSE publishes exactly three
   early-close footnotes: the day after Thanksgiving (all three years), Monday **2028-07-03**, and
   **Thursday 2026-12-24** — attached to 2026 alone. 2027's Christmas is *observed* Friday
   **2027-12-24** (a full closure, not a half day) and 2028's Christmas Eve is a Sunday. So there
   is no 2027 or 2028 analogue to compare this against, and any "how did last year's go" reading
   next December will be comparing a half day to a full closure.

4. **The session is thin — SUPPORTED. "Thinner than its hours predict" — MIXED, and weakening.**
   Eighteen Christmas Eve half sessions exist in the SPY era. Volume as a fraction of each one's own
   trailing 20-session mean:

   | Statistic | Christmas Eve half day (n=18) | Thanksgiving Friday (n=33) | All SPY sessions |
   |---|---|---|---|
   | Median volume ratio | **0.34×** | 0.40× | 0.94× |
   | IQR | 0.27 – 0.42 | — | — |
   | Min / Max | 0.17× (2008) / 1.07× (2018) | — | — |
   | Median abs. open→close | **0.25%** | — | 0.44% |
   | Open→close up rate | 9 of 18 (**50%**) | — | 58.7% (7-sess. proxy) |

   A 3.5-hour session out of 6.5 would run **0.54×** on hours alone, so the full-sample **0.34×**
   implies per-hour participation around **63%** of normal. **That conclusion does not survive
   splitting the sample, and this ledger reports the split rather than the headline.** First nine
   observations (1996–2009): median **0.27×**. Last nine (2012–2025): median **0.41×**. Last five
   (2018–2025): **1.07 / 0.32 / 0.42 / 0.69 / 0.50**, median **0.50×** — at the hours prediction,
   not below it. Sixteen of eighteen came in at or under 0.55×, but **both exceptions are recent**
   (2018 at 1.07×, 2024 at 0.69×). The honest statement is therefore *the session is thin*, not
   *the session is disproportionately thin*; the second claim was true of the 1990s–2000s tape and
   is no longer clearly true. 2018 is the regime counterexample to the whole "thin and quiet"
   framing — the December 2018 drawdown, in which 12-24 fell **−2.64%** close-to-close and 12-26
   rallied **+5.05%** on above-average volume. A stressed tape does not respect the holiday.

5. **There is no directional edge — SUPPORTED (as a refusal).** Open→close: **9 of 18 up**, median
   **+0.04%**, median absolute **0.25%**. Excluding 2018 changes nothing material (9 of 17, median
   +0.09%). The next session's median is **+0.27%** across all 18 but **−0.01%** on the four
   precedents matching 2026's configuration. Nothing here would survive a fee, let alone a spread
   quoted at a third of normal depth.

6. **The Santa Claus Rally does not clear its own control — REFUTED as a tradeable claim.** Using
   the standard window (last 5 sessions of the year plus the first 2 of the next, measured from the
   close of the 6th-to-last session): **23 of 33 positive (69.7%)**, median **+0.80%**, mean
   **+0.81%**. Control — every rolling 7-session SPY window, 1993–2026: **58.7% positive** (n=8,451),
   median **+0.46%**. A one-sided binomial test of 23/33 against p₀ = 0.587 gives **p = 0.134**. The
   seasonal is *directionally* consistent with the folklore and *statistically* indistinguishable
   from simply being long for seven sessions. Two further 2026-specific reasons to distrust it:
   the window's baseline close is **2026-12-23**, the corridor's stacked-print session, and its
   first session is the half day measured in leg 4.

7. **The week's information is front-loaded into Wednesday 2026-12-23 — SUPPORTED.** BEA's
   published 2026 schedule, fetched today, ends with two 08:30 ET entries on the same date:
   `December 23 · 8:30 AM · GDP (Third Estimate), Industries, Corporate Profits, State GDP, and
   State Personal Income, 3rd Quarter 2026` and `December 23 · 8:30 AM · Personal Income and
   Outlays, November 2026`. Census M3 dates the November advance durable goods report to
   **12/23/2026** (full report TBD). This session could source **no** US statistical release dated
   2026-12-24. The corridor therefore runs: three prints into one full session → a 3.5-hour
   follow-through session → four calendar days dark.

8. **The 2026 session calendar, computed rather than assumed — SUPPORTED.** December 2026 carries
   **22 sessions**. The week of 12-21 runs Mon 12-21 / Tue 12-22 / Wed 12-23 / Thu 12-24 (half) and
   Fri **12-25 closed** — **3.5 sessions**. The last five sessions of 2026 are **12-24, 12-28,
   12-29, 12-30, 12-31**, so the Santa Claus window *opens on the half day* and anchors on the
   **12-23** close. First two of 2027: **01-04, 01-05** (2027-01-01 is a Friday closure).

9. **The cross-asset asymmetry is real, rare, and inverts inside the same corridor — SUPPORTED, and
   this is the sweep's calendar product.** Pairing NYSE's early-close footnotes against SIFMA's US
   panels, the forward window from today contains exactly **three** dated sessions where the bond
   tape outlives the equity tape — **2026-11-27**, **2026-12-24**, **2027-11-26** — and they are
   only two recurring holidays, of which the Christmas one is unrepeatable (leg 3). Six sessions
   after this one the asymmetry **flips**: SIFMA's `New Year's Day 2026/2027` entry recommends
   fixed income close at **2:00 p.m. ET Thursday 2026-12-31**, while NYSE publishes **no** equity
   early close for that date — bonds shut two hours *before* a full equity session, the ordinary
   shape. Proposed this pass as `sifma-bond-early-close-2026-12-31.json` (`estimate`). *(The
   extreme prior instance is already past: Good Friday **2026-04-03**, equities entirely shut with
   SIFMA recommending a bond half-session to noon.)*

10. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A
    grep of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|christmas|half-day|early close|closure|santa` returns **zero hits in both files**, run
    this session. No playbook can fire on this date in either direction.

11. **Weekly petroleum data probably skips the corridor — PLAUSIBLE INFERENCE from a published
    precedent, explicitly not a 2026 fact.** EIA's holiday-shift table (header: *"Data for the week
    ending | Alternate release date | Release day | Release time | Holiday"*) carries verbatim
    `December 19, 2025 | December 29, 2025 | Monday | 5:00 p.m. | Christmas` — the Christmas-week
    report moved out of the shortened week entirely, to the following Monday evening. EIA's
    **published 2026 list ends at Veterans Day, 2026-11-12**; no Christmas 2026 row exists yet. So
    energy-sensitive names *may* get no weekly inventory print in the 12-21 week, but this ledger
    does not assert it.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate`, the direction measures as a coin
flip and the one seasonal attached to the corridor fails its control. The supported outputs are the
guards already in the signals list: the 13:00-vs-14:00 cross-asset asymmetry, the **0.34×** slippage
sizing, the modest-but-real 0.34–0.43% un-hedgeable gap, the corrected description of the post-PCE
hedging window, and the 12-28 attribution trap.

### Honest limits

- **The claims question is open, and it is the one that would change leg 7.** Initial jobless claims
  normally prints 08:30 ET Thursday — which is *inside* this half session. DOL's schedule returned
  **403** on three URL forms today, so whether it keeps the slot, shifts, or is folded is
  **unresolved rather than guessed**. If it holds, the half day has one macro print of its own.
- **The expiration question is untouched.** Whether weekly options that would expire Friday
  **2026-12-25** roll to Thursday **2026-12-24** is **not asserted**: Cboe's expiration calendar
  404'd, its holiday PDF 403'd and OCC's schedule sat behind a Cloudflare interstitial. A weekly
  expiry landing inside a 3.5-hour session would be a materially different day from the one
  measured here.
- **The CME leg is missing**, as it is in both sibling closure ledgers — this session did not
  attempt it after five documented 403s in prior runs, and asserts nothing about futures hours.
- **n=4 for the exact configuration**, n=18 overall, and the volume ratios are SPY's, not NYSE
  composite or consolidated tape. The sibling [`pce-2026-12-23`](pce-2026-12-23.md) cites a
  **45–70%** band for the same week on an undisclosed definition; once leg 4's drift is taken into
  account the two are close to agreeing — the recent-subsample **0.41–0.50×** sits at the bottom of
  that band, and the full-sample 0.34× below it. This ledger's definition is stated so it can be
  reproduced or refuted: SPY share volume against its own trailing-20-session mean.
- **The drift in leg 4 is described, not explained.** Decimalisation, ETF share growth, the rise of
  off-exchange and closing-auction volume and the 2018/2024 regime episodes are all candidate
  causes; this session tested none of them and asserts no mechanism. It is why the forward test is
  registered as a two-sided bracket rather than a one-sided prediction.
- **Leg 11 is one precedent row, not a 2026 schedule**, and leg 2 is a disclosed contradiction
  between two primaries that this session did not resolve.
- **Every trading-adjacent statement carries the `estimate` label.** Estimates widen caution and
  license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally. This row exists to hold a
measurement, three execution guards and one refusal — not a view. Concretely: (a) the session is a
**liquidity** event with **no** directional edge (9 of 18 up, median +0.04%), running a full-sample
median **0.34×** normal volume but a **0.50×** median across the last five observations — thin, and
no longer clearly thinner than its 3.5-of-6.5 hours predict; (b) the week's information is
**front-loaded into Wednesday 2026-12-23**, where BEA's published 2026 schedule ends and three
prints share one 08:30 slot, leaving a 3.5-hour equity follow-through session and then four dark
calendar days; (c) the **Santa Claus Rally is refused** — 69.7% vs a 58.7% control, p = 0.134, on a
window whose 2026 baseline is that same stacked-print close; (d) the cross-asset asymmetry is real
(equities 13:00, bonds 14:00) and **inverts six sessions later** on 2026-12-31. Every statement
carries the event's **`estimate`** label.

**Kill switches:**

- **SPY volume on 2026-12-24 comes in above 0.70× its trailing 20-session mean** — the session is
  not meaningfully thin, the slippage guard is wrong, and the liquidity framing the whole stance
  rests on fails. Registered as **FT-christmas-eve-half-day-2026-12-24-1**, score by 2026-12-28.
- **…or below 0.34×** — the drift identified in leg 4 reverses and the *old* base rate was right
  after all, which would mean this ledger over-corrected against its own headline. Registered as
  **FT-christmas-eve-half-day-2026-12-24-2**, score by 2026-12-28. The two tests bracket the
  prediction from both sides on purpose: a stance that can only be wrong in one direction is not a
  stance.
- **DOL's schedule, once reachable, places initial claims at 08:30 ET on 2026-12-24** — leg 7's
  "no scheduled US macro on the half day" falls and the day stops being purely structural.
- **Cboe or OCC publishes a rule placing a weekly options expiry on Thursday 2026-12-24** — the
  session acquires an expiry mechanic the measured base rate does not contain, and legs 4/5 must be
  re-cut against expiry-day precedents only.
- **NYSE withdraws or amends footnote ****** — the hours re-date and every guard here is rewritten.
- **A house playbook that keys on holiday-adjacent sessions is written and back-tested** — leg 10
  goes stale and the stand-aside is re-argued on measured data rather than on absence.
- **A VIX regime shift (≥ 3 points from 14.53) before the next check** — 2018 is the in-sample proof
  that a stressed tape ignores the holiday liquidity profile entirely (1.07× volume, −2.64% then
  +5.05%), so the measurement's applicability, not just its size, is regime-conditional.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 110 | **Initial research.** Date/hours triple-primaried today — NYSE footnote **** (equities 13:00, "1:15 p.m. for eligible options"), Cboe `09:30:00 - 13:00:00`, SIFMA fixed income **14:00** — stays `estimate` on the taxonomy gap alone; a **15-minute NYSE-vs-Cboe options discrepancy is disclosed, not resolved**. **Measured (SPY 1993–2025, n=18 half sessions):** volume median **0.34×** trailing-20 mean (IQR 0.27–0.42; baseline 0.94×; hours alone predict 0.54×) — **but drifting up: first 9 median 0.27×, last 9 0.41×, last 5 0.50×**, so "thinner than its hours" is graded MIXED, not supported. Open→close **9 of 18 up**, median **+0.04%**, median abs **0.25%** vs 0.44% baseline; the 2026 configuration (Dec 25 = Friday) has n=4 (1998/2009/2015/2020, vol 0.20–0.42). **Santa Claus Rally REFUTED as tradeable:** 23/33 = 69.7% vs a 58.7% rolling-7-session control (n=8,451), binomial **p = 0.134**. **Structural:** NYSE publishes this as its **only** Christmas Eve early close in 2026–2028; BEA's 2026 schedule **ends 12-23**, stacking PCE + GDP-third + (Census) durables into one 08:30 slot; Cboe lists **no** post-close global session. Adjacency — peers: n/a (`symbols: []`); macro: 12-23 stack, Tokyo CPI flash 12-25 into no US session, 12-28 advance indicators + BoJ opinions; VIX **14.53** (^VIX close 2026-09-04); geopolitical: none dated to this corridor; tape: opex 12-18, FOMC minutes 12-30. EIA's 2025 precedent moved the Christmas-week WPSR to Mon 12-29 5:00 p.m.; no 2026 row published. DOL claims schedule **403 ×3**, OCC/Cboe expiration calendars **403/404** — the claims and expiry questions are left open. Proposes `sifma-bond-early-close-2026-12-31.json` (`estimate`). | Initial stance set: **stand aside** (measurement + guards only). Registers **FT-christmas-eve-half-day-2026-12-24-1** and **-2**, bracketing the 2026 volume ratio from both sides. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
