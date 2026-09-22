# SIFMA-recommended US fixed-income early close, 2:00 p.m. ET — the last pre-Christmas session, and 2027 has no half day to hide behind — sifma-bond-early-close-2027-12-23

**Kind:** rates · **Date:** 2027-12-23 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US Holiday Recommendations panel, fetched and payload-parsed first-hand 2026-09-09; `estimate` is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["bond-market-early-close-2027-12-23","christmas-market-closure-2027-12-24","consumer-confidence-2027-12-22","fhfa-hpi-2027-12-28","sp-quarterly-rebalance-effective-2027-12-20","vix-expiration-2027-12-22"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and stop importing the Christmas Eve ghost town into a session that isn't
one.** Christmas 2027 falls on a Saturday, so NYSE observes it Friday 2027-12-24 and **there is no
Christmas Eve half day in 2027 at all**; the role of "last session before the break" falls to a
**full-length Thursday** whose bond side alone shuts at 14:00 ET. Measured across 33 years, the two
things a holiday session does to the tape come apart cleanly and they have **different causes**.
**Volume tracks the hours:** in the 18 years whose last pre-Christmas session *is* a Dec-24 half day,
that half day is thinner than the full session immediately before it in **18 of 18 years**
(p = 0.00001, median difference −0.510×), and the two variants separate decisively (median SPY volume
**0.767× full-hours vs 0.367× half-day**, Mann-Whitney **p = 0.0004**; ^GSPC 1990–2025 reproduces at
p = 0.00001). **Move size tracks the calendar position, not the hours:** the last session before the
gap runs **0.47×–0.65×** its trailing-20 median |move| whether truncated or not, against **0.93×**
for the session before that — and the two variants are statistically indistinguishable on |move|
(p = 0.94). So 2027-12-23 should be **thick-ish and calm**, the exact inverse of the day-after-
Thanksgiving slot the sibling ledger measured as *thin but not calm* — and this decomposition
**predicts** that sibling, because the day after Thanksgiving is *post*-gap. Second finding, from a
primary independent of both holiday calendars: Treasury pulled its competitive bidding deadline to
**10:00 a.m. ET on 30 dates between 2018-12-24 and 2025-12-31**, all of them early closes or
holiday-week reschedules — and **has not done it once in 2026** (0 of 301 auctions), including on the
two early-close Thursdays in exactly this date's shape. Everything here carries the event's
**`estimate`** label, `symbols` is empty, and no house playbook is calendar-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended bond early close is not a tradeable event | High | D−470, `symbols: []`, `impact: low`; `trade-playbooks.md` and `multi-symbol-sweep.md` re-grepped this session for `holiday\|christmas\|closure\|half.?day\|early.?close\|blackout` return **0 hits in both** (three unrelated "seasonality" hits only) | A calendar- or session-hours-keyed house playbook being written and back-tested before **2027-12-23** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Write the decomposition down; do not act on it** | High | The deliverable is that **volume ← hours, \|move\| ← calendar position**, which reconciles this class's two sibling ledgers instead of adding a third opinion; plus the correction that 2027 has **no Christmas Eve half day** | The 18-of-18 within-year paired result failing to reproduce on a second equity series — it does not: ^GSPC 1990–2025 gives Mann-Whitney p = 0.00001 on the same split, checked **2026-09-09** |
| This month | **Stand aside** — nothing near-dated is created by this row | Medium | The ±5-day corridor is fully tracked (6 ids); the sweep found no untracked *dated* event, and the two structurally identical objects it did surface are recorded, not proposed, per the 03-25/05-28/11-26 precedent | A 2027 US early-close date appearing on SIFMA's panel that is **not** one of 03-25 / 05-28 / 07-02 / 11-26 / 12-23 / 12-31, checked at the **2026-10-09** pulse |
| This quarter | **Do not carry "the last pre-Christmas session is a ghost town" as a planning assumption** (`estimate` — a planning refusal, never an entry) | Medium | The ghost town is the *half day* (0.367×), and 2027 does not have one; the full-hours variant runs 0.767× — a ~2.1× difference in the same slot | SPY's **2027-12-23** volume ratio printing **below 0.55×** its trailing-20 median — half-day-thin on a full-hours session, and the hours→volume link fails on the instance that matters. Registered as **FT-sifma-bond-early-close-2027-12-23-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-12-23. The date is `estimate`, the source is
  explicitly a recommendation, and date-keyed action requires `confirmed` regardless.
- **The execution note, stated precisely.** Equities run a **full** 09:30–16:00 session (NYSE
  publishes no December 2027 early close); SIFMA recommends cash and OTC fixed income out at
  **14:00 ET**. So for the last two hours of the equity session there is no recommended cash-Treasury
  reference — the inverse of the half-day geometry, where equities go dark first.
- **Size for a normal-ish book, not a holiday one.** The full-hours variant's median SPY volume is
  **0.767×** normal (0.671× excluding SPY's erratic 1993 inception year), not the **0.367×** the
  Christmas Eve half day runs. Planning 2027-12-23 off a 2024/2025 Christmas Eve template
  under-provisions liquidity by roughly half.
- **Expect a small move, and do not trade the expectation.** |move| runs a median **0.467×** normal
  on this slot (below 0.80× in 11 of 15 years) — but 1999 printed 2.49× and 2000 printed 2.24×, so
  the suppression is a central tendency with a live tail, not a floor.
- **Supply is possible, and the deadline is the live question.** 2027-12-23 is a **Thursday**, and
  Treasury's 4-week/8-week bill slate is Thursday in **70 of 70** 2026 YTD instances; on the exact
  2021 analogue (Thu 2021-12-23) it kept the slate. What is *not* settled is the bidding deadline —
  see the 10:00 a.m. finding below. Registered as **FT-sifma-bond-early-close-2027-12-23-3**.
- **Watch (dated)** — next pulse **2026-10-09** · S&P quarterly rebalance effective **2027-12-20**
  (est) · consumer confidence **2027-12-22** (est) · this early close **2027-12-23** (est) · NYSE and
  bonds fully closed **2027-12-24** (est) · FHFA HPI **2027-12-28** (confirmed) · FOMC minutes
  **2027-12-29** (est) · the sibling early close **2027-12-31** (est).

## Initial research

### The question, plainly

This id existed only as a proposal, written by the `christmas-market-closure-2027-12-24` initial
research, where it was the load-bearing finding rather than an incidental one. Two questions follow.
**Do the schedule facts reproduce first-hand, at the precision the sources support?** And — the
question this class has circled without answering — **the sibling ledgers have measured holiday
sessions and reached opposite-sounding conclusions ("thin and calm" on the pre-Memorial slot, "thin
but NOT calm" on the day after Thanksgiving). Is there one model that produces both?**

**One-line verdict:** the schedule facts hold and reproduce; 2027 has **no Christmas Eve half day**,
which is the fact most likely to be got wrong by inheritance; and there *is* one model — **volume is
caused by the hours, move size by the position relative to the gap** — which reconciles the siblings
and predicts what 2027-12-23 will look like.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Every primary was fetched this session; nothing is
inherited from the proposal or from a sibling ledger.

- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 299,159 bytes. The year/region
  tabs are hidden panels the rendered text drops, so the embedded RSC payload was parsed and node 99
  read verbatim, with nodes 97/98/9a used to fix panel attribution.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200, 109,180 bytes (needs `curl -L`); the 2027
  Christmas row and **all four** `close early at` footnotes extracted in full.
- **US Treasury** `api.fiscaldata.treasury.gov` `auctions_query` — 66 date-filtered queries (auction
  and issue dates on all 33 slot dates), four December-week range pulls, a weekday census of the 2026
  4-week/8-week slate, and a **4,369-row** sweep of every auction since 2015 on `closing_time_comp`.
  All HTTP 200.
- **Measured, Yahoo split/dividend-adjusted daily bars** with volume: **SPY** (1993–2025) and
  **^GSPC** (1990–2025) for the equity slot, plus **TLT, IEF, SHY, AGG, LQD, BND, TIP, HYG, ^VIX,
  ^TNX**. Metric per instance: session volume ÷ trailing-20-session median volume, and
  |close-to-close return| ÷ trailing-20-session median |return|. Significance by **two-sided exact
  sign test** for paired/one-sample counts and **Mann–Whitney U** for the two-variant comparison.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.
- **Not attempted:** `cmegroup.com` (403 on this runner in every sibling lane) and Nasdaq's calendar
  (the 11-26 sibling established it publishes no 2027 rows; re-fetching would re-record a known fact).

### Conviction legs, tested

1. **The date, the 14:00 ET time and the panel attribution reproduce first-hand — SUPPORTED (and it
   stays `estimate`).** Payload node 99 is three fields: `Christmas Day` / `Friday, December 24, 2027`
   / `Early Close (2:00 p.m. Eastern Time): Thursday, December 23, 2027`. Attribution is settled by
   the run it sits in — node 97 `Veterans Day / Thursday, November 11, 2027`, node 98 `Thanksgiving
   Day / Thursday, November 25, 2027`, node 9a `New Year's Day 2027/2028 / Early Close: Friday,
   December 31, 2027` — a US-only sequence, where the Japan panel's cards each carry a `Tentative -
   Subject to confirmation by the Bank of Japan` note this run lacks. The full 2027 US early-close set
   is **03-25, 05-28, 07-02, 11-26, 12-23, 12-31**. It stays `estimate` on three counts: the prefix
   taxonomy has no slot for a trade association's recommended schedule, this lane may not
   self-confirm, and the source is non-binding by its own terms.

2. **2027 has NO Christmas Eve half day, and that is the fact most likely to be inherited wrong —
   SUPPORTED.** NYSE's 2027 Christmas row reads `Friday, December 24 (Christmas Day observed)` with
   **no footnote marker**, and its four early-close footnotes across 2026/2027/2028 name only
   2028-07-03 (`**`), the three day-after-Thanksgiving dates (`***`), and **2026-12-24** (`****`).
   There is no NYSE early close anywhere in December 2027. So the session every year-end planning
   template reaches for — a 13:00 Christmas Eve — **does not exist in 2027**; its role passes to a
   full-length Thursday. Statute and arithmetic agree independently: 2027-12-25 is a Saturday, NYSE's
   own table shows the Saturday-observance rule applied (and the same footnote block states it
   explicitly for New Year's: *"Because the holiday falls on Saturday, January 1, 2028, no New Year's
   Day holiday is observed."*).

3. **Session VOLUME is caused by the hours, not by the calendar position — SUPPORTED, and this is the
   decomposition's first half.** Slot: the last equity session before the NYSE Christmas closure,
   1993–2025, split by whether that session is a Dec-24 half day (n = 18) or an earlier full-hours
   session (n = 15, which is 2027's shape).

   | Measure (SPY, ÷ trailing-20 median) | Full-hours variant (n=15) | Dec-24 half day (n=18) |
   |---|---|---|
   | **median volume** | **0.767×** (above 1.0× in 2/15, p = 0.0074) | **0.367×** (1/18, p = 0.0001) |
   | median \|move\| | 0.467× (3/15 above 1.0×, p = 0.0352) | 0.645× (4/18, p = 0.0309) |
   | up sessions | 11/15 (p = 0.119) | 10/18 (p = 0.815) |

   Volume separates decisively — **Mann–Whitney z = 3.543, p = 0.00040** — and reproduces on an
   independent series, ^GSPC 1990–2025: 0.658× vs 0.367×, **z = 4.444, p = 0.00001**. The clean
   control removes the calendar-position confound entirely: **within the 18 half-day years**, compare
   the half day against the full session immediately before it and the half day is thinner in
   **18 of 18 years, p = 0.00001, median difference −0.510×**. That D−2 full session runs **0.839×** —
   statistically indistinguishable from the full-hours variant's 0.767×. The hours do it.

4. **|MOVE| is caused by the position relative to the gap, not by the hours — SUPPORTED, and this is
   the second half.** On |move| the two variants are indistinguishable: **Mann–Whitney p = 0.942**
   (SPY), p = 0.451 (^GSPC). What *does* separate is where the session sits: the **last** session
   before the multi-day break runs 0.467× (full variant) and 0.645× (half-day variant) its normal
   |move|, while the session **before** that runs **0.925×** — normal. Calm is positional; truncation
   contributes nothing measurable to it.

5. **The decomposition reconciles the two sibling ledgers rather than adding a third opinion —
   SUPPORTED, and it is this ledger's contribution.** [`sifma-bond-early-close-2027-11-26`](sifma-bond-early-close-2027-11-26.md)
   measured the day after Thanksgiving as **thin but not calm** (volume collapse decisive, |move|
   suppression absent, every p > 0.5). Under legs 3–4 that is exactly what must happen: that session
   *is* truncated (→ thin) but sits **after** the gap, not before it (→ no positional calm). The
   pre-Memorial-Day slot the same ledger used as a control is both truncated-adjacent and pre-gap
   (→ thin *and* calm). Neither sibling is wrong; they measured two cells of a 2×2 and read the
   difference as a property of Thanksgiving. **2027-12-23 is the cell nobody had measured** —
   full-hours *and* pre-gap — and the model's prediction for it is **thick-ish and calm**.

6. **The Saturday-Christmas subset is consistent and far too small to lean on — MIXED, deliberately
   not claimed.** The five years with 2027's exact geometry (Christmas on Saturday, observed Friday
   12-24, last session Thursday 12-23) are 1993, 1999, 2004, 2010, 2021: volume 2.45× / 0.99× / 0.54×
   / 0.50× / 0.58×, |move| 0.20× / 2.49× / 0.31× / 0.39× / 0.58×. Median volume 0.575×, median |move|
   0.391× — both on the model's side, neither remotely significant (n = 5, p = 0.375 either way), and
   1993's 2.45× is SPY's first year, when its volume base was erratic and tiny. The subset is
   reported because it is 2027's literal shape; legs 3–4 rest on the 33-year split, not on it.

7. **There is a directional up-tilt on this slot and it is REFUSED as tradeable.** The full-hours
   variant closes up in 11 of 15 years (p = 0.119; 11 of 14 excluding 1993, p = 0.057; ^GSPC 12 of 15,
   p = 0.035), median +0.125% to +0.174%. This is exactly the shape the
   [`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md) sibling refused for the
   same reasons, and they hold here with less excuse: n = 15, the effect is a fraction of a session's
   normal range, it is one cut among several this session ran, and it is perfectly collinear with the
   pre-holiday drift the "Santa Claus rally" literature has already picked over (and which the
   `christmas-eve-half-day-2026-12-24` sibling **refused** at p = 0.134). Recording the refusal is the
   point: the same numbers would have made a much more exciting and much less true ledger.

8. **The 14:00 recommended bond close leaves no footprint in listed bond ETFs — SUPPORTED,
   independently replicating the 05-28 sibling's scope leg.** On the 11 full-variant years since the
   ETFs existed, each bond proxy's volume ratio paired against SPY's same day: TLT below SPY in 6/11,
   IEF 5/11, LQD 7/11, HYG 5/8 — coin flips — while SHY (2/11, p = 0.065), AGG (2/11, p = 0.065) and
   BND (2/8) run *less* thin than the equity tape, not more. Medians: TLT 0.613×, IEF 0.527×, SHY
   0.656×, AGG 1.101×, LQD 0.530×. This is what
   [`sifma-bond-early-close-2027-05-28`](sifma-bond-early-close-2027-05-28.md) leg 2 predicts from
   SIFMA's own published scope — cash and OTC products, no exchange-listed instrument named — reached
   here from a different slot and a different sample.

9. **Treasury auctions INTO this session, unlike the day after Thanksgiving — SUPPORTED, and it
   corrects an assumption the class could easily have generalised.** The 11-26 sibling measured
   **0 auctions in 27 years** on its slot. Here the answer is different: across the 33 slot dates,
   **18 auctions** land on the last pre-Christmas session (2 on the full-hours dates, 16 on the
   half-day dates, including 4 on 2025-12-24 alone), plus **30 settlements**. The exact 2021 analogue
   is decisive: **Thursday 2021-12-23 carried 4-week and 8-week bill auctions** while the week's 2y/5y/7y
   slate went off 12-21/12-22 and 12-27/12-28/12-29 around the closure. And 2027-12-23 is a
   **Thursday**: Treasury's 4-week/8-week slate ran on a Thursday in **70 of 70** 2026 YTD instances,
   and it moves off that Thursday only for a **full closure** (2025-11-26 Wed, 2025-12-24 Wed,
   2024-11-27 Wed, 2024-12-26 Thu), never for an early close. So the extra-supply-free framing the
   Thanksgiving sibling established is a property of *that* slot and must not be carried here.

10. **The 10:00 a.m. holiday bidding deadline is a real, primary-sourced practice that appears to have
    been DISCONTINUED in 2026 — SUPPORTED as a description, registered rather than asserted as a
    forecast.** A sweep of all **4,369** auctions since 2015 on `closing_time_comp` finds the standard
    11:30 a.m. ET bill deadline on 2,929 of 3,165 bills, and exactly **30 dates at 10:00 a.m.**, the
    first 2018-12-24 and the last 2025-12-31. Every one of the 30 is either a SIFMA-recommended early
    close (2018-12-24, 2018-12-31, 2019-04-18, 2019-07-03, 2019-12-24, 2020-12-24, 2020-12-31,
    2021-12-23, 2023-07-03, 2024-07-03, 2024-12-23, 2025-04-17, 2025-07-03, 2025-12-24, 2025-12-31) or
    an auction rescheduled into a holiday-compressed week (the Wednesday-before-Thanksgiving slate,
    2019 through 2025). **And it has not happened once in 2026:** 301 auctions year-to-date, zero at
    10:00 a.m. — including **2026-04-02** and **2026-07-02**, both SIFMA early-close Thursdays in
    exactly 2027-12-23's configuration, both at 11:30 a.m. Two qualifying instances is a thin basis for
    "discontinued", which is precisely why it is a registered forward test and not a stated fact.

11. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep of
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|christmas|closure|half.?day|early.?close|blackout` returns **zero hits in both**; the only
    matches on a widened pattern are three uses of "seasonality" about GOOG's pre-print run-up (G1) and
    mega-cap earnings-season stacking, none of them date- or hours-keyed.

12. **The adjacency sweep found no untracked dated event — and three findings are recorded rather than
    proposed.** Within ±5 days, all six are tracked: `sp-quarterly-rebalance-effective-2027-12-20`
    (−3), `consumer-confidence-2027-12-22` (−1), `vix-expiration-2027-12-22` (−1, standing in as a
    proposal), `bond-market-early-close-2027-12-23` (0, proposal — see leg 13),
    `christmas-market-closure-2027-12-24` (+1), `fhfa-hpi-2027-12-28` (+5). `opex-2027-12-17` (−6) and
    `fomc-minutes-2027-12-29` (+6) sit outside the window. Three dated facts surfaced and are
    deliberately **not** proposed, per the 03-25/05-28/11-26 siblings' stated precedent that
    structurally identical zero-impact objects do not each earn a session: **(a)** NYSE's `**` footnote
    puts an equity early close on **2028-07-03**; **(b)** the 2027 US early-close set includes
    **2027-07-02** and **2027-12-31**, both already tracked ids; **(c)** the negative finding worth
    more than either — NYSE states outright that **no New Year's Day holiday is observed for 2028**,
    so a lane that proposes a `new-years-day-market-closure-2028-01-03` would be proposing a
    non-event. Peer prints n/a (`symbols: []`); macro: nothing datable to 12-23; VIX **15.72** (close
    2026-09-08); geopolitical: none touching a market-structure row.

13. **A duplicate-id hazard exists for this exact session — recorded, not resolved.**
    `proposals/bond-market-early-close-2027-12-23.from-thanksgiving-half-day-2027-11-26.json`
    describes this same real-world session under a different id and a different `kind` (`sector`), and
    it is separately in the scanner's due list. Its schedule facts agree with this ledger's; the risk
    is structural, not factual — if that lane writes its own canonical file, the calendar carries two
    rows for one 2:00 p.m. bond close and every corridor count in this class double-counts it. This
    lane owns only its own id, never deletes or edits another lane's proposal (#1717), and so records
    the collision here for whoever owns calendar dedupe rather than acting on it.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate` and the source is a recommendation
rather than a rule. The supported outputs are the missing-half-day correction, the volume/|move|
decomposition and the sibling reconciliation it produces, the auction-and-deadline findings, the
duplicate-id record, and three registered forward tests.

### Honest limits

- **The decomposition is a two-cell contrast, not an identified mechanism.** Legs 3–4 separate hours
  from position using one slot pair over 33 years. Every other difference between a Dec-24 half day
  and a Dec-22/23 full session (weekday mix, distance to year-end, which years fall in which bucket)
  is confounded with the hours. The 18-of-18 within-year control removes the *position* confound
  specifically; it removes nothing else.
- **n = 15 on the side that matters.** The full-hours variant has 15 SPY observations and 5 in 2027's
  literal Saturday-Christmas geometry. Every claim here is a central tendency on a small sample, and
  1999 (|move| 2.49×) and 2000 (2.24×) are in it.
- **Multiple cuts were run.** Two equity series, two variants, several thresholds, a directional test
  and a bond-ETF panel. Leg 7's directional tilt is refused partly on that basis; the volume result is
  kept because it survives on both series at p ≤ 0.0004 and has an 18-of-18 within-year control.
- **The cash tape itself was never measured.** No retrieved source gives cash-Treasury or TRACE
  volume, so what actually happens between 14:00 and 16:00 ET on the bond side is unmeasured. Every
  number here is an exchange-listed proxy, and leg 8 measures ETFs that do *not* observe the 14:00
  recommendation at all.
- **Daily bars only.** The natural question — what the two-hour equities-only window looks like —
  needs intraday data this repo's instruments do not provide.
- **Leg 10's "discontinued" is n = 2.** Two 2026 qualifying instances at 11:30 a.m. is suggestive, not
  settled; Treasury published no policy statement this session retrieved, and the practice could
  reappear at any December. It is registered, not asserted.
- **The 2027 bill slate does not exist yet.** Leg 9's expectation that 2027-12-23 carries a
  4-week/8-week auction is an extrapolation from a 70-of-70 weekday cadence and one analogue year, not
  a published schedule.
- **CME was not attempted** (403 on this runner in every sibling lane), so what Globex does with rate
  futures that afternoon is not asserted. It remains the one channel that could make any of this
  tradeable.
- **The event is `estimate`** (leg 1). Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-09):** stand aside, permanently and structurally — and **replace the inherited
picture of this session with a two-factor model**. Concretely: (a) the SIFMA-recommended 14:00 ET
fixed-income close on 2027-12-23 reproduces first-hand from SIFMA's own 2027 US panel (`estimate`),
against a **full** NYSE equity session to 16:00 ET. (b) **2027 has no Christmas Eve half day at all** —
Christmas falls on a Saturday, NYSE observes it Friday 12-24 with no early-close footnote anywhere in
December 2027, so the "last session before the break" is full-length. (c) **Volume is caused by the
hours:** median SPY volume 0.767× on the full-hours variant vs 0.367× on the Dec-24 half day
(Mann–Whitney p = 0.0004; ^GSPC p = 0.00001), with the confound-free control being 18-of-18 within
half-day years, p = 0.00001, median difference −0.510×. (d) **Move size is caused by the position
relative to the gap:** the variants are indistinguishable on |move| (p = 0.942), while the last
session before the break runs 0.47×–0.65× against 0.93× for the session before it. (e) That
decomposition **reconciles** the pre-Memorial slot ("thin and calm") with the day-after-Thanksgiving
slot ("thin, not calm") — the latter is truncated but *post*-gap — and predicts 2027-12-23 as
**thick-ish and calm**. (f) The directional up-tilt (11/15, ^GSPC 12/15 p = 0.035) is **refused**.
(g) Unlike the Thanksgiving slot's 0-auctions-in-27-years, Treasury **does** auction into this one —
2021-12-23 carried 4-week and 8-week bills, and 2027-12-23 is a Thursday against a 70-of-70 Thursday
bill cadence. (h) Treasury's 10:00 a.m. holiday bidding deadline ran on 30 dates 2018-2025 and has not
appeared once in 2026 (0 of 301), including on two early-close Thursdays in this exact shape. Every
statement carries the event's **`estimate`** label.

**Kill switches:**

- **SPY's 2027-12-23 volume ratio prints below 0.55× its trailing-20 median** — half-day-thin on a
  full-hours session, and (c)'s hours→volume link fails on the instance that matters. Registered as
  **FT-sifma-bond-early-close-2027-12-23-1**, score by 2027-12-30.
- **SPY's 2027-12-23 |move| ratio prints at or above 1.0× its trailing-20 median** — the positional
  calm in (d) fails on the one pre-gap session this ledger exists to describe. Registered as
  **FT-sifma-bond-early-close-2027-12-23-2**, score by 2027-12-30.
- **Treasury's 2027-12-23 bill auction carries a 10:00 a.m. ET competitive close** — the practice in
  (h) is not discontinued, it was merely absent for a year, and a desk planning an 11:30 deadline
  misses the auction. Registered as **FT-sifma-bond-early-close-2027-12-23-3**, score by 2027-12-30.
- **SIFMA revises, withdraws or re-dates the 2027-12-23 recommendation** — the event's premise changes
  and this ledger re-dates.
- **NYSE adds any December 2027 early close** — (b) falls, 2027-12-23 stops being the full-hours cell
  of the 2×2, and legs 3–5's entire slot assignment for this date has to be redone.
- **The 18-of-18 within-year control fails to reproduce on a third series or a widened sample** — the
  decomposition's confound-free leg is its load-bearing one, and without it legs 3–5 revert to a
  between-variant comparison with a live calendar-position confound.
- **A calendar- or session-hours-keyed house playbook is written and back-tested** — leg 11 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.
- **`bond-market-early-close-2027-12-23` is written as a canonical calendar file** — leg 13's hazard
  becomes real, this event is double-counted in every corridor and adjacency count in the class, and
  the ids must be reconciled by whoever owns calendar dedupe.
- **A retrievable CME source appears** — the one untested channel resolves, and if rate futures keep
  truncated hours that afternoon the session acquires a tradeable instrument and this sheet is rebuilt.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 470 | **Initial research; canonical `<id>.json` written**, shadowing the one proposal (`from-christmas-market-closure-2027-12-24`), read first. SIFMA re-fetched (HTTP 200, 299,159 B): payload node 99 = `Christmas Day` / `Friday, December 24, 2027` / `Early Close (2:00 p.m. ET): Thursday, December 23, 2027`; attribution fixed by the US-only run (Veterans 11-11, Thanksgiving 11-25, New Year's 12-31). NYSE re-fetched (HTTP 200, 109,180 B): 2027 Christmas row `Friday, December 24 (Christmas Day observed)`, **no footnote** — and all four early-close footnotes name only 2028-07-03, the three day-after-Thanksgiving dates and 2026-12-24, so **2027 has no Christmas Eve half day at all**. **Measured (new), last pre-Christmas session 1993–2025 split by hours:** volume separates decisively (full-hours 0.767× vs half-day 0.367×, Mann-Whitney p=0.00040; ^GSPC 1990–2025 p=0.00001), with the confound-free control **18 of 18** within half-day years, p=0.00001, median diff −0.510×; \|move\| does **not** separate (p=0.942) and is positional instead (last-before-gap 0.47×–0.65× vs 0.93× the session prior). **This reconciles the 11-26 sibling** (truncated but post-gap ⇒ thin, not calm) with the pre-Memorial control (truncated-adjacent and pre-gap ⇒ thin and calm); 2027-12-23 is the unmeasured cell — **full-hours and pre-gap ⇒ thick-ish and calm**. Directional tilt (11/15; ^GSPC 12/15 p=0.035) **refused** per the 12-31 sibling's precedent. **Treasury (fiscaldata, 4,369-row sweep + 70 queries):** unlike the Thanksgiving slot's 0-of-27, Treasury **does** auction here — 18 auctions / 30 settlements across the 33 slot dates, incl. 4-week+8-week bills on the exact analogue Thu 2021-12-23; 2026 YTD 4W/8W cadence is Thursday **70 of 70**, moved only for full closures. **New finding:** the 10:00 a.m. ET competitive deadline ran on **30 dates 2018-12-24 → 2025-12-31**, all early closes or holiday reschedules, and **0 of 301 auctions in 2026**, incl. 2026-04-02 and 2026-07-02 (early-close Thursdays in this exact shape) — registered, not asserted. Bond ETFs show **no** footprint of the 14:00 close (TLT 6/11, IEF 5/11 vs SPY; SHY/AGG *less* thin, p=0.065), replicating the 05-28 sibling's scope leg from a new slot. Adjacency — peers n/a (`symbols: []`); macro: none datable to 12-23; VIX **15.72** (close 2026-09-08); geopolitical: none; tape: 6 tracked ids within ±5 days. **No new calendar file proposed:** 2028-07-03 and the 2027-07-02/12-31 closes recorded per the 03-25/05-28/11-26 precedent, plus the negative finding that NYSE observes **no** 2028 New Year holiday. **Hazard recorded:** `proposals/bond-market-early-close-2027-12-23.from-thanksgiving-half-day-2027-11-26.json` is a duplicate id for this same session. CME not attempted (403 in every sibling lane). | Initial stance set: **stand aside**, with the session corrected (no 2027 half day exists) and a **volume←hours / \|move\|←position** decomposition that reconciles two sibling ledgers. Registers **FT-sifma-bond-early-close-2027-12-23-1**, **-2** and **-3**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sifma-bond-early-close-2027-12-23.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
