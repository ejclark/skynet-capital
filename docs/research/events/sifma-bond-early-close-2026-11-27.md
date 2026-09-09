# SIFMA-recommended US fixed-income early close, 2:00 p.m. ET — the half session an 8:30 a.m. print lands in — sifma-bond-early-close-2026-11-27

**Kind:** rates · **Date:** 2026-11-27 (estimate — NEWS: SIFMA `sifma.org/resources/general/holiday-schedule` US Holiday Recommendations panel, fetched and parsed card-by-card first-hand 2026-09-09; `estimate` is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-12-02","advance-economic-indicators-2026-11-27","aws-reinvent-2026","beige-book-2026-11-25","chicago-pmi-2026-11-30","construction-spending-2026-12-01","consumer-confidence-2026-11-24","cyber-monday-2026-11-30","dallas-fed-mfg-2026-11-30","dallas-fed-tssos-2026-12-01","durable-goods-2026-11-25","fhfa-hpi-2026-11-24","fomc-blackout-start-2026-11-28","gdp-q3-2026-second-2026-11-25","georgia-senate-runoff-2026-12-01","ism-manufacturing-2026-12-01","japan-cpi-tokyo-flash-2026-11-27","jgb-40y-auction-2026-11-25","jolts-2026-12-01","new-home-sales-2026-11-25","pce-2026-11-25","pjm-reliability-backstop-results-2026-12-02","russell-recon-lockdown-2026-11-30","russell-style-month-end-capping-effective-2026-11-30","thanksgiving-half-day-2026-11-27","thanksgiving-market-closure-2026-11-26","treasury-2y-frn-2026-11-24","treasury-2y-note-2026-11-23","treasury-5y-note-2026-11-24","treasury-7y-note-2026-11-25"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and refuse the inference the sibling ledgers set up.**
[`sifma-bond-early-close-2027-11-26`](sifma-bond-early-close-2027-11-26.md) established that this slot
is **thin but not calm**: it strips volume from the fixed-income tape without stripping price movement.
Re-fetched and re-measured independently this session, that reproduces exactly (SPY volume median
**0.429×** its trailing-20 median, TLT **0.480×**, IEF **0.456×**, LQD **0.449×**). The natural next
step — *if the move happens in a half-empty book, it is a liquidity artifact, so fade it* — is what this
ledger tests, and **the answer is no**. Across 10 instruments the day-after-Thanksgiving move is neither
reliably reversed nor reliably followed the next session: the best nominal result is LQD persisting 16
of 23 (69.6% vs a 49.1% base, one-sided p = 0.039), the second-best is HYG **reversing** 12 of 18
(p = 0.104) in the *opposite* direction, and with 10 instruments tested nothing clears a Bonferroni
threshold of 0.005. **Thin, not calm, and not fadeable.** Two things are genuinely new about the 2026
instance against 2027: **Nasdaq's own calendar publishes it** — its 2026 table carries the 11-27 row as
an `Early Close* - U.S.` at `1:00 p.m.` — which closes the 2027 sibling's open note that TLT/IEF/SHY/BND's
actual listing venue had documented nothing; and **an 8:30 a.m. ET macro print lands inside it**, since
Census's own release calendar schedules
the Advance Economic Indicators Report for 2026-11-27, so the bond tape gets **5½ hours** to price
October trade and inventories against the equity closing auction's **3½**. Everything carries the event's
**`estimate`** label, `symbols` is empty, and no house playbook is calendar-keyed (re-grepped to zero).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended bond early close is not a tradeable event | High | D-79, `symbols: []`, `impact: low`, date `estimate`; `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for `holiday\|thanksgiving\|black.?friday\|half.?day\|early.?close\|closure\|blackout\|session.hours` return **0 hits in both** | A calendar- or session-hours-keyed house playbook being written and back-tested before **2026-11-27** — the "nothing can fire on this date" leg dies and this sheet is rebuilt on measured data |
| This week | **Bank the refusal; do not act on it** | High | The deliverable is that thin-and-not-calm does **not** license fading the half-day bond move: 10 instruments, best nominal p = 0.039 (LQD, persistence) against second-best p = 0.104 (HYG, reversal) pointing the other way, Bonferroni threshold 0.005 | Any figure in leg 4 failing to reproduce from Yahoo daily bars on the stated definition (next-session same-sign count vs the instrument's own unconditional same-sign rate) before **2026-10-09** |
| This month | **Stand aside** — no new dated event is created by this row | Medium | The sweep found no untracked dated event; the 2026-12-24 US bond early close and the Wednesday 2026-11-25 bill displacement are recorded below and deliberately **not** proposed, per the 03-25/05-28/2027-11-26 siblings' stated precedent | A 2026 US early-close date appearing on SIFMA's panel that is **not** one of 04-03 / 05-22 / 07-02 / 11-27 / 12-24 / 12-31, or Nasdaq re-publishing its 2026 calendar without the 11-27 row, checked at the **2026-10-09** pulse |
| This quarter | **Read 2026-11-27 as thin, data-bearing and un-fadeable — never as empty** (`estimate` — a planning refusal, never an entry) | Medium | An 8:30 a.m. Census print lands in a session whose volume runs ~½ normal, with the entire monthly coupon slate two-to-four sessions before it and the FOMC blackout opening the day after | TLT's **2026-11-27** volume ratio printing below **0.70×** its trailing-20 median *while* its \|move\| ratio also prints below **0.80×** — thin **and** calm on the instance that matters (7 of 24 historical years), and the whole asymmetry dies. Registered as **FT-sifma-bond-early-close-2026-11-27-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-11-27. `impact: low`, `symbols: []`, the
  date is `estimate` and the source is a recommendation; date-keyed action requires `confirmed` anyway.
- **Do not fade the half-day bond move.** Measured over 16–24 years per instrument, the next session's
  sign is a coin flip against each instrument's own base rate. "Thin" is not a reason to expect a
  give-back, and nothing here is a reason to expect a follow-through either.
- **Size for slippage, not for silence.** Volume is reliably ~half normal (TLT below its trailing-20
  median in **22 of 24** years, LQD 22/24, SHY 22/24); the size of the price move is not suppressed.
  Thin books with an unshifted move distribution is a worse execution environment than a quiet session.
- **Execution note, stated precisely.** Equities and eligible options end their **core** session at
  13:00 / 13:15 ET (NYSE footnote `***`, which names 2026-11-27 by date); SIFMA recommends cash and OTC
  fixed income out at **14:00 ET**. Listed venues keep late sessions to **17:00 ET**, so the honest fact
  is that every listed bond proxy prints its official close an hour before the cash tape it tracks stops
  — *not* that nothing trades in that hour. This narrows the standing claim in
  [`thanksgiving-half-day-2026-11-27`](thanksgiving-half-day-2026-11-27.md), same date, equity side.
- **An 8:30 a.m. ET print lands in it** (`estimate`) — Census's Advance Economic Indicators Report,
  October data, read first-hand from `calendar-listview.html` today. It is a *reading* caution about
  attribution, never a signal: bonds get 5½ hours to price it, the equity closing auction gets 3½.
- **No supply event, ever — but obligations, yes.** Treasury has held **0 auctions in 27 consecutive
  years** on the day after Thanksgiving and **98 settlements** across the same dates; the 4-week/8-week
  bill slate displaces to the Wednesday before in **7 of 7 years, 2019–2025**. SIFMA's own sentence
  predicts it: *"Previously scheduled SIFMA early close recommendations do not affect the closing time
  for settlements."*
- **The corridor is crowded and front-loaded, and that is this instance's distinguishing feature.**
  **30** other tracked events sit within ±5 days (the 2027 instance had 5), including the whole monthly
  coupon slate at D−4 to D−2 (`treasury-2y-note-2026-11-23`, `-5y-` and `-2y-frn-` 11-24, `-7y-` 11-25,
  all `estimate`) and `pce-2026-11-25` + `gdp-q3-2026-second-2026-11-25` (both `high`, `confirmed`).
- **Last session before the Fed goes quiet.** `fomc-blackout-start-2026-11-28` (`confirmed`) gates FOMC
  communication through 2026-12-10, so this 14:00 bond close is the last bell before an 11-day silence.
- **Watch (dated)** — next pulse **2026-10-09** · SIFMA panel re-parse (same pulse) · Nasdaq 2026
  calendar re-fetch (same pulse) · coupon slate **2026-11-23 → 11-25** (est) · **NYSE closed
  2026-11-26** (est) · this early close **2026-11-27** (est) · blackout opens **2026-11-28** (conf).

## Initial research

### The question, plainly

This id existed only as a proposal, written by the `thanksgiving-market-closure-2026-11-26` adjacency
sweep, which argued the row earns its place because the 2026 gap was a hole rather than a decision — the
only US early close in SIFMA's 2026 panel with no matching calendar entry. Two questions follow.
**Do the schedule facts reproduce first-hand for the 2026 instance, and do they differ from the 2027
one a sibling ledger has already worked?** And — the question that sibling's own finding creates and
does not answer — **if this slot is thin but not calm, is the move it produces therefore fadeable?**

**One-line verdict:** the schedule facts reproduce and the 2026 instance is *better documented and more
crowded* than 2027 in two specific ways, and the fade inference the thin-not-calm finding invites is
**refused on measurement** — the next session's sign is a coin flip.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`). Every primary was fetched this session; nothing is
inherited from the proposal or from the 2027 sibling.

- **SIFMA** `sifma.org/resources/general/holiday-schedule` — HTTP 200, 299,159 bytes. All **66** rendered
  holiday cards extracted in DOM order with a card-shaped regex, so panel attribution is read rather
  than assumed. The scope and settlement paragraph was read verbatim, not summarised.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200, 109,180 bytes (needs `curl -L`); every
  `close early at` footnote extracted in full, including the late-session sentence.
- **Nasdaq** `nasdaqtrader.com/trader.aspx?id=Calendar` — HTTP 200, 54,661 bytes; the full 2026 US
  equity/options holiday table read row by row.
- **US Census** `census.gov/economic-indicators/calendar-listview.html` — HTTP 200, 91,396 bytes; the
  release rows around 2026-11-27 read cell by cell.
- **US Treasury** `api.fiscaldata.treasury.gov` `auctions_query` — 54 date queries (27 `auction_date`,
  27 `issue_date`, one per day-after-Thanksgiving 2000–2026), plus 14 Thanksgiving-week Thursday/Wednesday
  queries 2019–2025 and one forward-slate query for 2026-11-01 → 12-05. All HTTP 200.
- **Measured, Yahoo split/dividend-adjusted daily bars** with volume, fetched fresh (not from the
  instrument cache): **SPY, TLT, IEF, SHY, AGG, LQD, BND, TIP, HYG, MUB, ^VIX, ^TNX**, on the
  **day-after-Thanksgiving** slot (fourth Thursday of November + 1) and the **pre-Memorial-Day Friday**
  as control, 1990–2025 wherever an instrument existed. Metrics per instance: session volume ÷
  trailing-20-session median volume; |close-to-close return| ÷ trailing-20-session median |return|; and
  — new here — whether the **next** session's return shares the slot session's sign, against that
  instrument's own unconditional next-session same-sign rate over its whole history.
- **Read, not fetched:** Yahoo chart metadata `fullExchangeName` for each ETF's listing venue.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The date, the 14:00 ET time and the panel attribution reproduce first-hand — SUPPORTED (and it
   stays `estimate`).** The 2026 US panel is the page's **default** tab, so unlike the 2027 case no RSC
   payload parse was needed. Card 11 of 66 reads `Thanksgiving Day` / `Thursday, November 26, 2026` /
   `Early Close (2:00 p.m. Eastern Time): Friday, November 27, 2026`. Attribution is settled by
   position: cards 1–13 are the US panel (New Year's 2025/2026 through New Year's 2026/2027, Eastern
   Time throughout), 14–31 the UK panel, 32–66 Japan — and **the UK and Japan panels carry their own
   `Thanksgiving Day / Thursday, November 26, 2026` cards (28 and 62) with no early-close note**, which
   is a first-hand negative control the 2027 sibling did not have in this form. The full 2026 US
   early-close set is **04-03 (12:00 p.m. ET), 05-22, 07-02, 11-27, 12-24, 12-31**; MLK, Presidents Day,
   Juneteenth, Labor Day, Columbus Day and Veterans Day carry no note. Statute and arithmetic agree
   independently: 5 U.S.C. 6103 fixes the fourth Thursday, November 2026's Thursdays are 5/12/19/26, so
   the day after is Friday 2026-11-27. It stays `estimate` on three counts — the prefix taxonomy has no
   slot for a trade association's recommended schedule, this lane may not self-confirm, and the source
   is non-binding by its own terms (*"SIFMA recommends a holiday schedule…"*).

2. **Every operative listing venue documents this instance — SUPPORTED, and it closes an open note the
   2027 sibling left.** That ledger recorded that TLT, IEF, SHY and BND list on **Nasdaq**, not NYSE
   Arca, and that Nasdaq's calendar then published nothing for 2027 — so the 13:00 close for the three
   Treasury ETFs was undocumented by their own venue. Both halves re-verified today: Yahoo chart
   metadata gives **TLT, IEF, SHY, BND → NasdaqGM**; AGG, LQD, TIP, HYG, MUB, SPY → NYSEArca. And
   Nasdaq's 2026 table carries the row verbatim — `November 27, 2026 | Early Close* - U.S. | 1:00 p.m.`
   — alongside `November 26, 2026 | Thanksgiving Day - U.S. | Closed` and `December 24, 2026 | Early
   Close* - U.S. | 1:00 p.m.` NYSE's footnote `***` names the date explicitly and independently:
   *"Each market will close early at 1:00 p.m. (1:15 p.m. for eligible options) on Friday, November 27,
   2026, Friday, November 26, 2027, and Friday, November 24, 2028 (the day after Thanksgiving)."*
   **For 2026 there is no venue-documentation gap.**

3. **The one-hour split is real, and the same-date sibling overstates it — MIXED, and this is the
   narrowing.** NYSE's `***` footnote continues: *"NYSE American Equities, NYSE Arca Equities, NYSE
   National, and NYSE Texas late trading sessions will close at 5:00 p.m."*
   [`thanksgiving-half-day-2026-11-27`](thanksgiving-half-day-2026-11-27.md) — canonical on this very
   date, last assessed 2026-09-05 — carries the execution guard *"From 13:00 → 14:00 ET the Treasury
   tape is the only US price discovery still running."* The footnote's second sentence refutes that as
   written. What ends at 13:00 is the **core session and the closing auction**. The accurate statement
   is narrower and more useful: on 2026-11-27 every listed bond proxy stamps its **official closing
   price an hour before the cash market it tracks stops trading**, and that hour has late-session prints
   at minimal depth and no auction to mark against. Recorded here rather than by editing a sibling's
   ledger, per the one-file-per-owner rule.

4. **Thin does not mean fadeable — REFUTED as a tradeable inference, and this ledger's contribution.**
   The 2027 sibling's finding is that this slot removes volume without removing movement. The inference
   a reader will draw next is that a move made in a half-empty book is noise to be faded. Tested
   directly: for each instrument, does the **next** session's return share the slot session's sign,
   against that instrument's own unconditional next-session same-sign rate?

   | Instrument | n | Same-sign next session | Slot rate | Own base rate | One-sided p | Median \|r<sub>next</sub>\| / \|r<sub>slot</sub>\| |
   |---|---|---|---|---|---|---|
   | **TLT** | 24 | 15 | 62.5% | 48.1% | 0.113 | 1.39 |
   | **IEF** | 24 | 11 | 45.8% | 48.0% | 0.661 | 0.91 |
   | **SHY** | 19 | 8 | 42.1% | 46.1% | 0.717 | 0.87 |
   | **AGG** | 22 | 12 | 54.5% | 47.8% | 0.338 | 1.28 |
   | **LQD** | 23 | 16 | **69.6%** | 49.1% | **0.039** | 1.58 |
   | **BND** | 16 | 7 | 43.8% | 48.3% | 0.728 | 1.14 |
   | **TIP** | 22 | 14 | 63.6% | 49.5% | 0.134 | 0.80 |
   | **HYG** | 18 | 6 | **33.3%** | 50.9% | 0.959 (0.104 the other way) | 0.79 |
   | **MUB** | 18 | 7 | 38.9% | 51.8% | 0.909 (0.195 the other way) | 1.34 |
   | **SPY** | 33 | 15 | 45.5% | 49.2% | 0.727 | 1.59 |

   Ten instruments, and **nothing survives**. The best nominal result (LQD, p = 0.039) points at
   *persistence*; the second-best (HYG, p = 0.104) points at *reversal*; a Bonferroni threshold across
   10 tests is 0.005 and neither is close. The magnitude column is equally patternless — the next
   session's move runs 0.79×–1.59× the slot session's with no ordering by duration, credit or breadth.
   **The half-day bond move is neither reliably given back nor reliably followed.** So the honest chain
   is: thin (measured, decisive), not calm (measured, the 2027 sibling's leg), **and not fadeable**.

5. **The 2027 sibling's volume finding reproduces on an independent fetch — SUPPORTED.** Same-slot,
   same definition, re-fetched today rather than inherited: SPY **0.429×** its trailing-20 median volume
   (published 0.429×), TLT **0.480×** (0.480×), IEF **0.456×** (0.456×), SHY **0.441×** (0.441×), AGG
   **0.509×** (0.509×), LQD **0.449×** (0.449×), BND **0.501×** (0.501×), TIP **0.548×** (0.548×) — an
   exact match on all eight. The |move| ratios reproduce to within ~0.05× (TLT 0.991× here vs 0.953×
   published; IEF 1.076× vs 1.126×; BND 1.215× vs 1.235×), a trailing-window convention difference, not
   a disagreement: the control slot's significant suppression is present in this fetch too (TLT
   above-normal in 5 of 23 pre-Memorial Fridays, LQD 6/23, BND 4/19) and absent on the half day (TLT
   11/24, IEF 13/24, BND 10/19). **The asymmetry is not an artifact of one session's code.**

6. **An 8:30 a.m. ET macro print lands inside the truncated session — SUPPORTED, and it is the sharpest
   difference from the 2027 instance.** Census's own release calendar, read cell by cell today, carries
   *"Advance Economic Indicators Report (International Trade, Retail, & Wholesale) | November 27, 2026 |
   8:30 AM | October 2026"*, with nothing else between 2026-11-25 (new residential sales and steel
   imports, 10:00) and 2026-12-01 (construction spending, 10:00). So advance goods trade plus retail and
   wholesale inventories — direct inputs to the growth arithmetic the curve prices — print into a
   session where the bond tape runs **5½ hours** (08:30 release → 14:00 close) against the equity
   closing auction's **3½** (09:30 → 13:00). 2027-11-26 carried no scheduled release at all. This is a
   structural description, not a signal: `impact: low`, `symbols: []`, and the read on the print belongs
   to [`advance-economic-indicators-2026-11-27`](advance-economic-indicators-2026-11-27.md).

7. **The issuer treats the session as unusable for supply but not for cash — SUPPORTED, from a primary
   independent of every calendar above.** `auctions_query` filtered on `auction_date` returns **0 rows
   for all 27 day-after-Thanksgiving dates 2000–2026**. Filtered on `issue_date`, the same 27 dates
   return **98 settlements** — bills every year plus note reopenings. The slate moves *around* the
   closure rather than through it: Thanksgiving Thursday itself carries **0 auctions in 7 of 7 years
   2019–2025**, while the Wednesday before carries the 4-week and 8-week bills every one of those years,
   the 17-week from 2022, and the 7-year note in 2019, 2024 and 2025. Consistent with SIFMA's verbatim
   sentence: *"Previously scheduled SIFMA early close recommendations do not affect the closing time for
   settlements."*

8. **November 2026's own slate is not yet corroborable from the issuer — MIXED, and stated so the
   corridor claim is not overread.** `auctions_query` returns **0 rows** for `auction_date` between
   2026-11-01 and 2026-12-05, and the dataset's most recent row is **2026-09-10**: the endpoint publishes
   auction *results*, not the forward calendar. So the four tracked coupon entries at D−4 to D−2
   (`treasury-2y-note-2026-11-23`, `treasury-5y-note-2026-11-24`, `treasury-2y-frn-2026-11-24`,
   `treasury-7y-note-2026-11-25`) remain `estimate` and are cited here as calendar entries, never as
   confirmed supply. The 7-of-7 displacement pattern in leg 7 is a strong prior for where the bill slate
   lands; it is not a Treasury statement about 2026.

9. **The corridor is dense and front-loaded — SUPPORTED, and it inverts the 2027 instance's picture.**
   Within ±5 days, **30** other events are tracked (canonical or standing proposal), against **5** for
   2027-11-26. The mass sits *before* the half day: `pce-2026-11-25` and `gdp-q3-2026-second-2026-11-25`
   (both `high`, `confirmed`), `beige-book-2026-11-25`, `durable-goods-2026-11-25`,
   `new-home-sales-2026-11-25`, `consumer-confidence-2026-11-24`, `fhfa-hpi-2026-11-24` and the coupon
   slate, then the closure on 11-26. After it: `fomc-blackout-start-2026-11-28` (`confirmed`) at D+1,
   then a month-end/ISM stack on 11-30 → 12-02. The consequence for reading, not trading: **a move on
   2026-11-27 has a Wednesday-print story, an 8:30-Friday-print story, a post-auction-concession story,
   a Tokyo-CPI story and a half-day-liquidity story before it has a bond-hours story.** Attribution here
   is a trap, and leg 4 is why it cannot be resolved by assuming the move is noise.

10. **Nothing in the house system is calendar-keyed — SUPPORTED, re-verified not inherited.** A grep of
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|thanksgiving|black.?friday|half.?day|early.?close|closure|blackout|session.hours` returns
    **zero hits in both**, run this session.

11. **The sweep found no untracked dated event — and two known ones are deliberately not proposed.**
    Every event within ±5 days is already tracked (leg 9). Two items are recorded here instead of filed,
    so the next sweep does not re-derive them. **(a) The 2026-12-24 US bond early close** — 2:00 p.m. ET
    on the same SIFMA panel, with `christmas-eve-half-day-2026-12-24` already canonical on the equity
    side and `sifma-bond-early-close-2026-12-31` canonical a week later. Not proposed, following the
    precedent `sifma-bond-early-close-2027-03-25`, `-2027-05-28` and `-2027-11-26` each state: a
    structurally identical object with zero measured impact, where a proposal spends a session
    re-deriving the same nulls. **(b) The Wednesday 2026-11-25 bill-auction displacement** (leg 7) — left
    unfiled because this calendar tracks coupon auctions and carries no bill-auction entry of any kind,
    so filing one is a schema decision this lane declines to take in passing, exactly as the proposal
    that seeded this id said.

### What plays the conditions support

None. `symbols` is empty, impact is `low`, the date is `estimate` and the source is a recommendation
rather than a rule. The supported outputs are the refusal in leg 4, the venue-documentation close in
leg 2, the same-date sibling's narrowing in leg 3, the print-inside-the-session structure in leg 6, the
issuer's supply-free/settlement-heavy treatment in legs 7–8, and three registered forward tests.

### Honest limits

- **Leg 4 tests a fade, not every fade.** It asks whether the *next session's close-to-close* shares the
  slot session's sign. A same-day intraday mean reversion, or a multi-day drift, would not show up.
  The claim is exactly the tested one: the next session is a coin flip.
- **Ten instruments is ten tests.** LQD's p = 0.039 is reported as nominal precisely because it is one
  of ten and points the opposite way to the second-best result. It is not evidence of persistence, and
  the ledger takes no position that it is.
- **The cash tape itself was never measured.** No retrieved source gives cash-Treasury or TRACE volume,
  so what happens to *cash* liquidity between 13:00 and 14:00 ET is unmeasured. Every number here is an
  exchange-listed proxy.
- **Daily bars only.** The natural question — what the 13:00–14:00 ET hour looks like — needs intraday
  data this repo's instruments do not provide.
- **The historical bond schedule was not verified year by year.** Only SIFMA's 2026 and 2027 panels are
  published today; the day-after-Thanksgiving 14:00 ET close is assumed to have applied in earlier
  years. This qualifies the *label* on the sample, not leg 4's or leg 5's paired arithmetic.
- **How often a Census print lands on this slot is unmeasured.** Leg 6 reads Census's forward calendar,
  which is the only year published; whether an 8:30 release on the day after Thanksgiving is routine or
  a 2026 quirk has no base rate here.
- **The corridor count in leg 9 counts standing proposals as tracked**, matching the scanner's own
  fallback rule. Four of the coupon entries are proposals and all are `estimate` (leg 8).
- **CME was not attempted.** `cmegroup.com` has 403'd this runner in every sibling lane; rather than
  spend a fetch to re-record the same block, this ledger does not assert what Globex does with rate
  futures that afternoon.
- **Estimates widen caution and license nothing** (leg 1).

## Stance & kill switches

**Stance (2026-09-09):** stand aside, permanently and structurally — and **refuse the fade inference**
the sibling ledgers set up. Concretely: (a) the SIFMA-recommended 14:00 ET fixed-income close on
2026-11-27 reproduces first-hand from SIFMA's own 2026 US panel with a UK/Japan negative control
(`estimate`), against a 13:00 ET equity core close and 13:15 for eligible options. (b) Unlike the 2027
instance, **every operative listing venue documents it** — TLT/IEF/SHY/BND list on NasdaqGM and Nasdaq's
own 2026 calendar carries `November 27, 2026 | Early Close* - U.S. | 1:00 p.m.` (c) What ends at 13:00
is the **core session and closing auction**, not all listed trading — late sessions run to 17:00 ET — so
the same-date sibling's "only US price discovery still running" guard is narrowed to: every listed bond
proxy prints its official close an hour before the cash tape it tracks stops. (d) The 2027 sibling's
volume finding reproduces **exactly** on an independent fetch (SPY 0.429×, TLT 0.480×, IEF 0.456×, LQD
0.449×) and its |move| finding to within ~0.05×. (e) **The move is not fadeable:** across 10 instruments
the next session's sign is indistinguishable from each instrument's own base rate, best nominal p =
0.039 (LQD, persistence) against second-best p = 0.104 (HYG, reversal) in the opposite direction, with a
Bonferroni threshold of 0.005. (f) An **8:30 a.m. ET Census print lands inside the session**, giving
bonds 5½ hours to price it against the equity auction's 3½; 2027 had none. (g) Treasury holds **0
auctions in 27 years** on this date and **98 settlements**, with the bill slate displaced to the
Wednesday before in **7 of 7 years 2019–2025** — but November 2026's own slate is not yet in
`auctions_query`, so the corridor's supply stack stays `estimate`. Every statement carries the event's
**`estimate`** label.

**Kill switches:**

- **TLT's 2026-11-27 volume ratio prints below 0.70× its trailing-20 median while its |move| ratio also
  prints below 0.80×** — thin *and* calm on the instance that matters, and the asymmetry in (d) dies on
  the very year this ledger owns. That joint case occurred in **7 of 24** historical years, against
  **10 of 24** for the thin-and-not-calm case the test predicts. Registered as
  **FT-sifma-bond-early-close-2026-11-27-1**, score by 2026-12-04.
- **Treasury announces or holds an auction dated 2026-11-27** — the 0-of-27 structural fact in (g)
  breaks and the extra cash hour acquires a supply event. Registered as
  **FT-sifma-bond-early-close-2026-11-27-2**, score by 2026-12-04.
- **LQD's 2026-11-27 → 2026-11-30 pair prints the same sign in three consecutive years (2026, 2027,
  2028)** — the 16-of-23 in-sample result this ledger refuses as data-mined would then be out-of-sample
  confirmed, and (e) has to be rebuilt with a persistence term. Registered as
  **FT-sifma-bond-early-close-2026-11-27-3**, first observation scored by 2026-12-04.
- **SIFMA revises, withdraws or re-dates the 2026-11-27 recommendation** — the event's premise changes
  and this ledger re-dates.
- **NYSE removes or re-times the `***` early close for 2026-11-27, or Nasdaq re-publishes its 2026
  calendar without the 11-27 row** — the one-hour split inverts or vanishes, (b) and (c) need rewriting,
  and the ETF-hours premise behind legs 4–5's proxies has to be re-argued.
- **Census moves the Advance Economic Indicators Report off 2026-11-27** — leg 6, the sharpest
  difference from the 2027 instance, loses its date and the session reverts to structurally empty.
- **A calendar- or session-hours-keyed house playbook is written and back-tested** — leg 10 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.
- **The adjacent blackout's premise moves** — if the December 2026 FOMC is re-dated,
  `fomc-blackout-start-2026-11-28` moves and the "last bell before an 11-day silence" framing loses
  its date.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 79 | **Initial research; canonical `<id>.json` written**, shadowing the one proposal (`from-thanksgiving-market-closure-2026-11-26`), read first and re-fetched rather than copied. SIFMA (HTTP 200, 299,159 B): 2026 US panel is the **default** tab, all 66 cards parsed in DOM order; card 11 = `Thanksgiving Day` / `Thursday, November 26, 2026` / `Early Close (2:00 p.m. ET): Friday, November 27, 2026`; **UK and Japan panels carry their own Thanksgiving cards with no note** (negative control). 2026 US early-close set = 04-03 (12:00), 05-22, 07-02, 11-27, 12-24, 12-31. **Two 2027-sibling gaps closed for 2026:** Nasdaq's calendar (HTTP 200, 54,661 B) **does** publish `November 27, 2026 \| Early Close* - U.S. \| 1:00 p.m.`, and TLT/IEF/SHY/BND re-verified as **NasdaqGM** — no venue-documentation gap. NYSE `***` (HTTP 200, 109,180 B) names 2026-11-27 by date; its late-session sentence **narrows the same-date sibling's** "only US price discovery" guard. **New (Census, HTTP 200, 91,396 B):** Advance Economic Indicators Report scheduled **2026-11-27 08:30 ET** — bonds get 5½ h to price it, the equity auction 3½; 2027-11-26 had none. **Measured (new), next-session sign vs each instrument's own base rate, day-after-Thanksgiving 1990–2025:** TLT 15/24 (p=0.113), LQD 16/23 (p=0.039), TIP 14/22 (0.134), AGG 12/22, IEF 11/24, BND 7/16, SHY 8/19, MUB 7/18, HYG 6/18 (p=0.104 the *other* way), SPY 15/33 — **nothing clears Bonferroni 0.005; the move is not fadeable.** 2027 sibling's volume finding reproduces **exactly** (SPY 0.429×, TLT 0.480×, IEF 0.456×, LQD 0.449×), \|move\| within ~0.05×. **Treasury (fiscaldata, 69 queries):** 0 auctions on all 27 day-after-Thanksgiving dates 2000–2026; **98 settlements**; bill slate displaced to the Wednesday before **7 of 7 years 2019–2025**; **November 2026's slate not yet in the dataset** (latest `auction_date` 2026-09-10), so the corridor's coupon entries stay `estimate`. Adjacency — peers n/a (`symbols: []`); macro: the corridor is front-loaded onto 11-24/11-25 (PCE + GDP-Q3-second, both `high`/`confirmed`); VIX **15.72** (close 2026-09-08); geopolitical: none touching this row; tape: **30** tracked events within ±5 days vs the 2027 instance's 5, blackout opens D+1 (`confirmed`). CME not attempted (403 in every sibling lane). **No new calendar file proposed:** 2026-12-24's bond early close and the Wed 2026-11-25 bill displacement recorded, not proposed, per the 03-25/05-28/2027-11-26 precedent. | Initial stance set: **stand aside**, with the fade inference **refused on measurement** and the session re-described as thin, data-bearing and un-fadeable. Registers **FT-sifma-bond-early-close-2026-11-27-1**, **-2** and **-3**. | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sifma-bond-early-close-2026-11-27.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
