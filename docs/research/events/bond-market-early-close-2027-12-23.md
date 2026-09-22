# US fixed income closes early at 2:00 p.m. ET while equities run a full session — the last session before the Christmas closure — bond-market-early-close-2027-12-23

**Kind:** sector · **Date:** 2027-12-23 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US Holiday Recommendations panel, fetched and payload-parsed first-hand 2026-09-09, against NYSE `nyse.com/markets/hours-calendars` for the equity side; `estimate` is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["sp-quarterly-rebalance-effective-2027-12-20","consumer-confidence-2027-12-22","vix-expiration-2027-12-22","sifma-bond-early-close-2027-12-23","christmas-market-closure-2027-12-24","fhfa-hpi-2027-12-28"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and stop crediting the early bond close for a quietness it does not
cause.** The schedule facts reproduce first-hand: SIFMA's own 2027 US panel recommends fixed income
out at **14:00 ET on Thursday 2027-12-23**, and NYSE's four early-close footnotes for 2026–2028
name **no December 2027 date at all**, so equities run a full 09:30–16:00 session (`estimate`). The
session is genuinely thin and calm — across the 15 comparable pre-Christmas-closure sessions since
1993, SPY's volume ran above its trailing-20 median in only **2 of 15** (median 0.767×, p = 0.0074)
and its |move| in only **3 of 15** (median 0.467×, p = 0.035). But **the 14:00 bond close is not
why.** Maundy Thursday has the *identical* configuration — equities full, SIFMA bonds at 14:00 —
and across 33 years it is an **ordinary session**: SPY volume 0.935× (14 of 33 above normal,
p = 0.49), TLT |move| 11 of 23 (p = 1.00). Same hours, no holiday week, no effect. So the
"recommended early close ⇒ quiet tape" reading that runs through this whole class of sibling
entries fails against its own control; what is doing the work is the holiday week. Two further
finds: the pre-Christmas slot is **calm in a way the Dec-24 half day is not** (there, bond |move| is
*un*suppressed — SHY 1.296×, LQD 1.151×, HYG 1.424×), and **2027-12-23 is a Thursday**, the current
4-/8-/17-week bill day, so Treasury's base rate (1 auction in 15 instances) and its current weekday
pattern point opposite ways. Nothing here is tradeable: `symbols: []`, `impact: low`, `estimate`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended bond early close is not a tradeable event | High | D-470, `symbols: []`, `impact: low`. `trade-playbooks.md` + `multi-symbol-sweep.md` grepped this session for `holiday\|christmas\|half.?day\|early.?close\|closure\|santa\|calendar`: **6 hits, all of them the *earnings* calendar**, none a holiday or session-hours key | A calendar- or session-hours-keyed house playbook being written and back-tested before **2027-12-23** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Bank the correction and the duplicate; act on neither** | High | Two deliverables, both written down rather than traded: the hours are not the mechanism (Maundy Thursday is the null), and this id **duplicates `sifma-bond-early-close-2027-12-23`** — one of **three** such pairs in a 494-event calendar that `--validate` passes | Maundy Thursday **2027-03-25** printing SPY volume below 0.85× *and* significant bond \|move\| suppression — the null control turns positive and the correction is wrong. Registered as **FT-bond-market-early-close-2027-12-23-1** |
| This month | **Stand aside** — nothing near-dated is created by this row | Medium | The adjacency sweep found no untracked dated event within ±5 days; all six neighbours are already tracked, and the 2027 US early-close set (03-25, 05-28, 07-02, 11-26, 12-23, 12-31) is fully accounted for by existing ids or sibling proposals | A 2027 US early-close date appearing on SIFMA's panel that is **not** one of those six, checked at the **2026-10-09** pulse |
| This quarter | **Do not carry "SIFMA early close ⇒ quiet session" as a planning assumption** (`estimate` — a planning refusal, never an entry) | Medium | The suppression is a property of the **holiday week**, not of the hours: it is significant on the pre-Christmas and pre-Memorial slots and **absent** on Maundy Thursday, which has the same hours | SPY's **2027-12-23** \|move\| ratio printing **at or above 1.0×** its trailing-20 median — 12 of the 15 historical instances printed below, and every one that printed above (1999, 2000, 2006) predates 2007. Registered as **FT-bond-market-early-close-2027-12-23-3** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-12-23. The date is `estimate`, the source is
  explicitly a recommendation to member firms, and date-keyed action requires `confirmed` regardless.
- **The execution note, stated precisely.** Equities and options run a **full** session to 16:00 ET;
  SIFMA recommends cash and OTC fixed income out at **14:00 ET**. So a cross-asset construction
  loses its bond-side reference **two hours before** the equity close, and the next session
  (2027-12-24) is dark in equities, options and bonds alike.
- **Size for the calendar, not for the closing bell.** The thin/calm profile belongs to the
  holiday week, so it applies to 2027-12-22 and 2027-12-27–30 as well, not uniquely to the
  early-close session. Treating 12-23 as special *because of its hours* is the error this ledger names.
- **The tails are fat even though the median is calm.** Median SPY |move| on this slot is 0.467×,
  but 1999-12-23 printed **2.49×** normal (+1.59%) and 2000-12-22 **2.24×** (+3.00%). Calm is a
  central tendency here, not a bound.
- **Supply is a live question, not a settled one.** Only **1 of 15** historical instances carried a
  Treasury auction (2021-12-23: 4-week and 8-week bills) — but that one is the most recent, and
  **2027-12-23 is a Thursday**, the current 4-/8-/17-week bill day, with the closure falling on the
  Friday *after* it so nothing needs to shift. Registered as **FT-…-2**.
- **Watch (dated)** — next pulse **2026-10-09** · the duplicate-id resolution (unscheduled) ·
  Maundy Thursday control **2027-03-25** (est) · S&P quarterly rebalance effective **2027-12-20**
  (est) · consumer confidence **2027-12-22** (est) · this early close **2027-12-23** (est) ·
  **NYSE closed 2027-12-24** (est) · FHFA HPI **2027-12-28** (confirmed).

## Initial research

### The question, plainly

This id existed only as a proposal, written by the `thanksgiving-half-day-2027-11-26` adjacency
sweep, which argued the row earns its place because it is the *mirror* of the half-day geometry the
calendar already tracks — bonds dark at 14:00 while equities trade two more hours. Three questions
follow. **Do the schedule facts reproduce at the precision the sources support?** **Does the
"bonds out early, equities full" configuration actually change how the session behaves — or is the
quietness every sibling ledger attributes to it really a holiday-week effect?** And, forced by what
the calendar scan turned up: **is this event even one event?**

**One-line verdict:** the schedule facts hold and reproduce; the session is measurably thin and calm
but **the early bond close is not the cause** — its own control session, with identical hours and no
holiday around it, is ordinary; and this id is a **duplicate** of `sifma-bond-early-close-2027-12-23`,
one of three duplicate pairs a 494-event calendar is carrying with a clean `--validate`.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Every primary was fetched this session; nothing is
inherited from either proposal or from the 11-26 sibling.

- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 299,159 bytes. The year and
  region tabs are hidden panels the rendered text drops, so the embedded RSC payload was parsed and
  the 2027 US cards read verbatim in document order, with the surrounding run used to establish
  panel attribution.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200, 109,180 bytes (needs `curl -L`). The full
  2026/2027/2028 holiday grid and all four early-close footnotes were extracted verbatim.
- **US Treasury** `api.fiscaldata.treasury.gov` `auctions_query` — `auction_date` and `issue_date`
  queries on all 15 slot dates, plus the December Thursday slates 2021–2025, all HTTP 200. Dataset
  coverage was checked first (**6,344 auction records back to 1979-10-31**), so a zero is a real
  zero rather than a gap.
- **Measured, Yahoo split/dividend-adjusted daily bars with volume**: SPY, TLT, IEF, SHY, AGG, LQD,
  BND, TIP, HYG, `^VIX`, `^TNX`, 1993–2025. Metric per instance: session volume ÷ trailing-20-session
  median volume, and |close-to-close return| ÷ trailing-20-session median |return|. Significance by
  **two-sided exact binomial sign test** on the count of instances above 1.0×.
- **Slots derived from SPY's own trading calendar, never a typed date list** — the Christmas closure
  is the first weekday in Dec 24–26 absent from the calendar; Good Friday is the sole absent
  March/April Friday; Memorial Day is the last Monday of May. Four slots:
  **PRE-XMAS-FULL** (last session before the Christmas closure when it is *not* Dec 24 → equities
  full, bonds 14:00 — 2027-12-23's exact configuration, n = 15), **PRE-XMAS-HALF** (when it *is*
  Dec 24 → equities 13:00, bonds 14:00, the inverse asymmetry, n = 18), **MAUNDY** (n = 33) and
  **PRE-MEMORIAL** (n = 33), the last two being the same hours as PRE-XMAS-FULL with no holiday
  gap and a holiday gap respectively.
- **Scanned, not assumed:** all 494 distinct calendar events (canonical + proposal-backed) for
  same-date id-similarity pairs.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The date, the 14:00 ET time and the panel attribution reproduce first-hand — SUPPORTED (and it
   stays `estimate`).** The US 2027 Christmas card is three consecutive payload leaves: `Christmas
   Day` / `Friday, December 24, 2027` / `Early Close (2:00 p.m. Eastern Time): Thursday, December 23,
   2027`. Attribution is settled by the run it sits in — `Labor Day / Monday, September 6, 2027`,
   `Columbus Day / Monday, October 11, 2027`, `Veterans Day / Thursday, November 11, 2027` — a
   US-only, Eastern-Time-only sequence, where the UK panel's 2027 Christmas row reads `Christmas
   Day` / `Friday, December 24, 2027` / `Boxing Day` / `None` and every Japan card carries a
   `Tentative – Subject to confirmation by the Bank of Japan` note this one lacks. The complete 2027
   US early-close set is **03-25, 05-28, 07-02, 11-26, 12-23, 12-31**; MLK, Presidents Day,
   Juneteenth, Labor, Columbus and Veterans Day carry no note (the negative control). It stays
   `estimate` on three counts — no confirmed prefix exists for a trade association's recommended
   schedule, this lane may not self-confirm, and the source is non-binding by its own terms.

2. **The equity side is a full session, and this is an argument from a complete footnote set rather
   than from silence — SUPPORTED.** NYSE's grid carries exactly four early-close footnotes across
   2026–2028: `*` (no New Year holiday observed, Saturday 2028-01-01), `**` (Monday 2028-07-03),
   `***` (the three day-after-Thanksgiving dates 2026-11-27, 2027-11-26, 2028-11-24) and `****`
   (Thursday 2026-12-24). **None names any December 2027 date**, and the 2027 Christmas row reads
   `Friday, December 24 (Christmas Day observed)` carrying no marker at all. The 2027 column's only
   marker sits on `Thursday, November 25***`. So the absence is bounded, not inferred from a page
   that might simply be incomplete.

3. **The 14:00 bond close does NOT explain the quiet session — SUPPORTED, and it is this ledger's
   contribution.** Four slots, each session against its own trailing-20 median. Medians, with the
   count above 1.0× and its two-sided sign-test p:

   | | SPY vol | SPY \|move\| | TLT \|move\| | IEF \|move\| | AGG \|move\| | LQD \|move\| |
   |---|---|---|---|---|---|---|
   | **PRE-XMAS-FULL** (n=15) | **0.767× · 2/15 · p=0.0074** | **0.467× · 3/15 · p=0.035** | 0.914× · 4/10 · p=0.75 | 0.813× · 3/10 · p=0.34 | **0.880× · 1/10 · p=0.022** | 0.588× · 2/10 · p=0.11 |
   | **PRE-MEMORIAL** (n=33) | **0.778× · 7/33 · p=0.0013** | 0.805× · 13/33 · p=0.30 | **0.525× · 5/23 · p=0.011** | 0.758× · 8/23 · p=0.21 | 0.565× · 7/22 · p=0.13 | **0.502× · 6/23 · p=0.035** |
   | **MAUNDY** (n=33) | 0.935× · 14/33 · p=0.49 | 0.707× · 13/33 · p=0.30 | 0.931× · 11/23 · p=1.00 | 0.809× · 10/23 · p=0.68 | 0.785× · 9/22 · p=0.52 | 0.737× · 8/23 · p=0.21 |

   All three slots share the *same* schedule: equities full, SIFMA fixed income out at 14:00 ET. Two
   of them sit inside a holiday week; **Maundy Thursday does not, and it is an ordinary session** —
   not one bond |move| test approaches significance, and SPY's volume is statistically
   indistinguishable from a normal day. The mechanism the sibling ledgers implicitly credit is
   present in all three and the effect appears in only the two with a holiday around them.

4. **The pre-Memorial-Day control reproduces the sibling ledger's numbers independently — SUPPORTED.**
   `sifma-bond-early-close-2027-11-26` reports TLT |move| above normal in 6 of 24 (p = 0.023), LQD
   6/24 (p = 0.023) and BND 4/20 (p = 0.012) on this slot. Re-derived here from a slot list built by
   a different rule: **TLT 5/23 (p = 0.011), LQD 6/23 (p = 0.035), BND 4/19 (p = 0.019)**, plus
   `^TNX` 9/33 (p = 0.014). Same direction, same order of magnitude, one instance of disagreement in
   the date list. That agreement is what makes leg 3's *disagreement* on Maundy Thursday load-bearing
   rather than a measurement artifact.

5. **This slot is calm in a way the Dec-24 half day is not — SUPPORTED.** On PRE-XMAS-HALF (n = 18)
   volume collapses far harder (SPY **0.367×**, 1/18, p = 0.0001; TLT 0.463×, **0/14**, p = 0.0001;
   LQD 0.368×, 0/14, p = 0.0001) and SPY is calm (0.645×, 4/18, p = 0.031) — but the **bond** |move|
   distribution is *not* suppressed at all: SHY **1.296×** (9/14), LQD **1.151×** (10/14), HYG
   **1.424×** (7/12), TLT 0.905× (6/14), every p > 0.17. That is the same "thin, not calm" shape the
   11-26 sibling measured on the day-after-Thanksgiving half day — and the pre-Christmas *full*
   session is the opposite. The two pre-Christmas configurations are therefore not interchangeable,
   which is exactly the distinction this row exists to carry.

6. **Nothing here says the belly moves *less* than the medians suggest — REFUTED as a directional
   read, and the tails say so.** Three of the 15 instances printed above-normal SPY |move|, and all
   three are **1999-12-23 (2.49×, +1.59%)**, **2000-12-22 (2.24×, +3.00%)** and **2006-12-22 (2.24×,
   −0.61%)** — every instance since 2010 printed below normal, which is a regime observation on n = 9
   and not a law. The honest claim is a low central tendency with live tails, not a bounded session.

7. **Treasury's treatment of this slot is weekday-driven, and 2027 lands on the auction weekday —
   MIXED, and deliberately left open.** Across the 15 slot dates, `auctions_query` returns **1
   auction** (2021-12-23: 4-week and 8-week bills) and **13 settlements**, against the
   day-after-Thanksgiving's 0-of-27 / 98 settlements. But the 14 zeros are mostly **Fridays**, not a
   policy: Treasury's current weekly slate puts 4-/8-/17-week bills on **Thursday** (verified:
   2022-12-22, 2023-12-21, 2024-12-19 and 2025-12-18 each carried 4-week + 8-week + a 4-year-10-month
   reopening), and it *shifts* that slate only when the Thursday itself is dark (2025-12-24, a
   Wednesday, carried the 17-/4-/8-week + 7-year slate because Christmas fell on the Thursday).
   **2027-12-23 is a Thursday and the closure is the Friday after it**, so nothing needs to move. The
   base rate (1 of 15) and the mechanism point opposite ways; registered rather than asserted.

8. **This id is a duplicate, and it is not the only one in the calendar — SUPPORTED, and it is the
   finding with the widest blast radius.** Two adjacency sweeps found SIFMA's 2027-12-23
   recommendation on the same day (2026-09-08) and named it differently:
   `bond-market-early-close-2027-12-23` (this id, kind `sector`, from the `thanksgiving-half-day-2027-11-26`
   sweep) and `sifma-bond-early-close-2027-12-23` (kind `rates`, from `christmas-market-closure-2027-12-24`).
   Both are `never-assessed` and due today, each with its own matrix job. #1717's proposer-namespaced
   filename rule prevents the add/add **conflict** but not the duplicate **event** — the calendar's
   only dedupe key is the id string. A same-date id-similarity scan over all **494** distinct events
   returns **three** genuine pairs and one true negative it correctly leaves alone:

   | Date | Pair | Verdict |
   |---|---|---|
   | 2027-12-23 | `bond-market-early-close-…` ↔ `sifma-bond-early-close-…` | **duplicate** — one SIFMA recommendation, two ids, two kinds |
   | 2026-09-03 | `fed-waller-outlook-…` ↔ `waller-economic-outlook-…` | **duplicate** — one Reuters NEXT interview, same kind, same impact, two ledgers |
   | 2026-09-28 | `census-benchmark-revision-nsa-…` ↔ `retail-benchmark-revision-…` | **duplicate, already self-declared** — the second one's own title reads `(DUPLICATE of census-benchmark-revision-nsa-2026-09-28; same Census release)` and it is still in the calendar |
   | 2026-09-09 | `treasury-buyback-cash-mgmt-…` ↔ `treasury-buyback-increase-…` | **not a duplicate** — an operation and a size-change effective date (the detector's true negative) |

   All three pairs pass `node scripts/event-scan.mjs --validate`, which reports **zero errors** on
   this branch (504 events, 463 ledgers), all six ids carry their own ledger, and each pair doubles
   every future pulse for one session. The `sifma-*` id is the convention-consistent survivor here — all 11 canonical
   SIFMA-schedule entries carry that prefix and kind `rates` — so **this** row is the one to retire.

9. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified and stated more
   precisely than the siblings state it.** A grep of `docs/plans/trade-playbooks.md` and
   `docs/research/multi-symbol-sweep.md` for `holiday|christmas|half.?day|early.?close|closure|santa|calendar`
   returns **6 hits, not zero** — but all six are the **earnings** calendar (the S1/S2 slice notes at
   `trade-playbooks.md:138,139,183` and the sweep's window caveats at `multi-symbol-sweep.md:56,64,110`).
   None is a holiday or session-hours key. The siblings' "zero hits" claim is right in substance and
   an artifact of a narrower pattern; the conclusion is unchanged and now survives the wider one.

10. **The adjacency sweep found no untracked dated event.** Within ±5 days, all six neighbours are
    already in the calendar: `sp-quarterly-rebalance-effective-2027-12-20` (−3, est),
    `consumer-confidence-2027-12-22` (−1, est), `vix-expiration-2027-12-22` (−1, est, proposal-backed
    from `opex-2027-12-17`), `sifma-bond-early-close-2027-12-23` (0 — the duplicate),
    `christmas-market-closure-2027-12-24` (+1, est) and `fhfa-hpi-2027-12-28` (+5, **confirmed**).
    The remaining 2027 US early closes named by the SIFMA parse — 03-25, 05-28, 07-02, 11-26, 12-31 —
    all already exist as canonical entries or sibling proposals, so **no new file is proposed**.
    Peers n/a (`symbols: []`); macro: no print datable to 2027-12-23 beyond the neighbours above;
    VIX **15.72** (close 2026-09-08); geopolitical: none touching a schedule recommendation.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate` and the source is a recommendation
rather than a rule. The supported outputs are the corrected causal story (holiday week, not hours),
the PRE-XMAS-FULL / PRE-XMAS-HALF distinction, the open supply question, the duplicate-id finding
with its scan, and three registered forward tests.

### Honest limits

- **The bond-side n is 7–10, not 15.** TLT/IEF/SHY/AGG/LQD/TIP begin in 2002–2003 and BND/HYG in
  2007, so every bond result on this slot rests on 7–10 instances. A 1-of-10 or 0-of-7 sign test
  clears p < 0.05 arithmetically and is still fragile; leg 3's weight is carried by the **contrast
  with Maundy Thursday's n = 23–33**, not by the pre-Christmas bond cells on their own.
- **"Same hours" is an assumption before 2026.** Only SIFMA's 2026 and 2027 panels are published
  today. The 14:00 ET recommendation is assumed to have applied to the pre-Christmas, pre-Memorial
  and Maundy Thursday slots in earlier years, from the rule shape those two panels show. This
  qualifies the *label* on all three slots equally — which is why the comparison between them
  survives it even though any single slot's label does not.
- **Confounds are not controlled, they are contrasted.** Maundy Thursday differs from the
  pre-Christmas slot in month, year-end proximity, tax-year effects and vacation patterns as well as
  in holiday-gap length. Leg 3 shows the hours cannot be the explanation *on their own*; it does not
  identify which of the remaining differences is.
- **The cash tape itself was never measured.** No retrieved source gives cash-Treasury or TRACE
  volume, so what actually happens between 14:00 and 16:00 ET is unmeasured. Every number here is an
  exchange-listed proxy, and listed venues keep a late session to 17:00 ET regardless
  (NYSE footnote text, read this session).
- **Daily bars only.** The natural question — what the last two equity hours look like once the bond
  tape is recommended shut — needs intraday data this repo's instruments do not provide.
- **`^VIX` carries a phantom bar on a confirmed closure** (a 2026-09-07 Labor Day bar exists in the
  series while SPY correctly skips it). VIX-keyed holiday statistics in this class must be filtered
  against an equity trading calendar; it does not affect the slots above, whose dates are real
  trading days derived from SPY.
- **CME was not attempted.** `cmegroup.com` has 403'd this runner in every sibling lane; rather than
  spend a fetch to re-record the block, this ledger does not assert what Globex does with rate
  futures that afternoon.
- **The event is `estimate`.** Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-09):** stand aside, permanently and structurally — and **correct the causal story
this class of entries has been carrying**. Concretely: (a) SIFMA's own 2027 US panel recommends US
fixed income out at **14:00 ET on Thursday 2027-12-23** (`estimate`), against a **full** NYSE equity
session to 16:00 ET, established from a complete four-footnote set that names no December 2027 date.
(b) The session is measurably thin and calm — SPY volume above normal in 2 of 15 (median 0.767×,
p = 0.0074), |move| in 3 of 15 (median 0.467×, p = 0.035). (c) **The early bond close is not the
cause**: Maundy Thursday has identical hours and no holiday week, and across 33 years it is an
ordinary session (SPY volume 14/33, p = 0.49; TLT |move| 11/23, p = 1.00), while the pre-Memorial
slot — same hours, holiday week — reproduces the 11-26 sibling's suppression independently
(TLT 5/23, p = 0.011; LQD 6/23, p = 0.035; BND 4/19, p = 0.019). (d) The Dec-24 **half** day is the
opposite shape: far thinner but with bond |move| *un*suppressed (SHY 1.296×, LQD 1.151×,
HYG 1.424×), so the two pre-Christmas configurations must not be read as one. (e) Direction is **not**
claimed and the tails are live: 1999-12-23 printed 2.49× normal |move|. (f) Supply is **open** —
1 auction in 15 instances, but 2027-12-23 is a Thursday, the current 4-/8-/17-week bill day, with the
closure on the Friday after. (g) This id **duplicates `sifma-bond-early-close-2027-12-23`**, one of
three duplicate pairs in a 494-event calendar that `--validate` passes, and it is the one to retire.
Every statement carries the event's **`estimate`** label.

**Kill switches:**

- **Maundy Thursday 2027-03-25 prints SPY volume below 0.85× its trailing-20 median together with
  significant bond |move| suppression across TLT/IEF/AGG** — the null control turns positive, the
  hours become a candidate mechanism after all, and (c) is wrong. Registered as
  **FT-bond-market-early-close-2027-12-23-1**, score by 2027-04-01.
- **Treasury announces or holds no auction dated 2027-12-23** — the weekday-pattern reading in (f)
  loses to the 1-of-15 base rate, and the slot is auction-free after all. Registered as
  **FT-bond-market-early-close-2027-12-23-2**, score by 2027-12-30.
- **SPY's 2027-12-23 |move| ratio prints at or above 1.0× its trailing-20 median** — the calm half of
  (b) fails on the one instance that matters. Registered as
  **FT-bond-market-early-close-2027-12-23-3**, score by 2027-12-30.
- **SIFMA revises, withdraws or re-dates the 2027-12-23 recommendation** — the event's premise
  changes and this ledger re-dates.
- **NYSE adds any December 2027 early close** — (a) inverts, the cross-asset asymmetry vanishes or
  reverses, and legs 2 and 5's whole slot definition needs rewriting.
- **A calendar- or session-hours-keyed house playbook is written and back-tested** — leg 9 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.
- **Either id of the 2027-12-23 pair is retired** — (g) resolves; whichever survives inherits this
  research, and the ledger for the retired one goes quiet.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 470 | **Initial research; canonical `<id>.json` written**, shadowing the one proposal (`from-thanksgiving-half-day-2027-11-26`), read first. SIFMA fetched (HTTP 200, 299,159 B): US 2027 Christmas card = `Christmas Day` / `Friday, December 24, 2027` / `Early Close (2:00 p.m. ET): Thursday, December 23, 2027`, attribution fixed by the surrounding US/Eastern-only run; full 2027 US set 03-25, 05-28, 07-02, 11-26, 12-23, 12-31. NYSE (HTTP 200, 109,180 B): all **four** early-close footnotes extracted, **none names a December 2027 date** — equities run 09:30–16:00. **Measured (new), four slots derived from SPY's own calendar, 1993–2025:** the pre-Christmas-closure full session is thin and calm (SPY vol 0.767×, 2/15, p=0.0074; \|move\| 0.467×, 3/15, p=0.035) — **but the 14:00 bond close is not the cause**: Maundy Thursday, identical hours without a holiday week, is ordinary (SPY vol 14/33, p=0.49; TLT \|move\| 11/23, p=1.00), while pre-Memorial (same hours, holiday week) independently reproduces the 11-26 sibling's suppression (TLT 5/23 p=0.011, LQD 6/23 p=0.035, BND 4/19 p=0.019). The Dec-24 **half** day is the opposite shape — far thinner (SPY 0.367×, 1/18, p=0.0001) with bond \|move\| **un**suppressed (SHY 1.296×, LQD 1.151×, HYG 1.424×). Direction refused: all 3 above-normal instances are 1999/2000/2006. **Treasury (fiscaldata, coverage checked back to 1979-10-31):** 1 auction across the 15 slot dates (2021-12-23, 4wk+8wk) and 13 settlements — the zeros are weekday-driven, and 2027-12-23 is a **Thursday**, the current 4-/8-/17-week bill day, with the closure the Friday after. **DUPLICATE FOUND:** this id and `sifma-bond-early-close-2027-12-23` are one session; a same-date scan of all **494** events returns **3** duplicate pairs (this one, `fed-waller-outlook-2026-09-03`↔`waller-economic-outlook-2026-09-03`, `census-benchmark-revision-nsa-2026-09-28`↔`retail-benchmark-revision-2026-09-28` — the last self-declared in its own title) and 1 true negative, all passing `--validate` with zero errors. Adjacency — peers n/a (`symbols: []`); 6 tracked events within ±5 days, **no new file proposed**; VIX **15.72** (close 2026-09-08); geopolitical none. CME not attempted (403 in every sibling lane). | Initial stance set: **stand aside**, with the causal story corrected — the holiday week, not the early bond close, is what makes the session quiet — and the duplicate id recorded. Registers **FT-bond-market-early-close-2027-12-23-1**, **-2** and **-3**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-bond-market-early-close-2027-12-23.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
