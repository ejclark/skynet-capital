# Tokyo cash shut, Osaka open — Respect for the Aged Day opens Silver Week — jpx-market-closure-2026-09-21

**Kind:** sector · **Date:** 2026-09-21 (estimate — EST: JPX `…/about-jpx/calendar/` + `…/derivatives/rules/holidaytrading/` + the exchange's finalized-holiday-trading file + Japan's Cabinet Office holiday CSV, all fetched direct 2026-09-15; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.49,"daysBand":"low:0+","adjacentIds":["bea-international-transactions-q2-2026-09-24","boe-decision-2026-09-17","boj-decision-2026-09-18","bowman-stress-testing-2026-09-18","bund-30y-auction-2026-09-16","costco-q4-fy2026-2026-09-24","dmo-pilot-switch-auction-test-2026-09-24","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","eia-weekly-petroleum-status-2026-09-16","eurostat-hicp-final-2026-09-17","fomc-2026-09-16","google-adtech-opinion-unseal-2026-09-16","house-vote-ratepayer-protection-act-2026-09-17","housing-starts-2026-09-17","import-export-prices-2026-09-16","industrial-production-2026-09-18","intl-transactions-q2-2026-09-24","japan-cpi-2026-09-18","jgb-liquidity-enhancement-5-11y-2026-09-25","jpx-market-closure-2026-09-22","jpx-market-closure-2026-09-23","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","nahb-hmi-2026-09-16","new-home-sales-2026-09-24","opex-2026-09-18","pending-home-sales-2026-09-17","philly-fed-mfg-2026-09-17","retail-sales-2026-09-16","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-global-flash-eurozone-pmi-2026-09-23","sp-global-flash-france-pmi-2026-09-23","sp-global-flash-germany-pmi-2026-09-23","sp-global-flash-us-pmi-2026-09-23","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","tic-monthly-2026-09-16","treasury-10y-tips-2026-09-17","treasury-2y-frn-2026-09-23","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","treasury-buyback-7y10y-2026-09-17","treasury-coupon-announcement-2026-09-17","trump-xi-summit-2026-09-24","uk-cpi-2026-09-16","uk-public-sector-finances-2026-09-22","uk-retail-sales-2026-09-18","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26","unsc-iran-panel-mandate-vote-2026-09-17","vix-expiration-2026-09-16"],"adjacentStrongIds":["fomc-2026-09-16","opex-2026-09-18","retail-sales-2026-09-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside — and delete "Tokyo dark" from how this block gets described.** The entry was
proposed as a five-session Japanese blackout bracketing the US 2Y/5Y/7Y auctions. The **cash** half is
right; the **blackout** is not. JPX's own holiday-trading table carries 2026-09-21, 09-22 *and* 09-23
as **`Open` / Finalized** — Osaka prices Nikkei futures and options through all three days, day session
*and* overnight. Only the Tokyo cash equity market is shut. That is a flip from 2024 and 2025, when
Respect for the Aged Day was `Not Open`, and it flips back in 2027 for the FY2027 BCP test. The
proposal's auction null **replicates exactly** on an independent Fiscal Data pull (indirect **63.35%**
on Japanese holidays, n=37, vs **61.88%**, n=1,072, **t=+0.855** — the wrong sign for the hunch), so
nothing here is tradeable and nothing should be attributed to the closure. What *is* genuinely rare is
the calendar shape: **Silver Week has happened three times since 1955 — 2009, 2015, 2026** — and both
precedents predate JPX holiday trading, making **2026-09-24 the first Silver Week cash bar back in
history with a continuously priced futures market behind it**. Two forward tests, no position.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a foreign cash-equity holiday six days out is not a position | High | D-6; `symbols: []`, `impact: low`, `estimate`, and 0 hits for `holiday\|jpx\|tokyo\|nikkei\|closure\|silver week\|osaka` across `trade-playbooks.md` + `multi-symbol-sweep.md`, re-grepped this session | A house playbook keyed to Japanese sessions or holiday-adjacent bars being written and back-tested before **2026-09-21** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Correct the record, don't trade it** — the write-up is the deliverable | High | The proposing entry calls 09-21/22/23 "Tokyo dark" and "the longest single blackout run in the 2026 calendar". JPX's holiday-trading table and finalized file both read `Open \| Finalized` on all three, and Golden Week (2026-05-02 → 05-06) ties the run at five dark calendar days | JPX republishing any of 2026-09-21/22/23 as `Not Open` before **2026-09-21** — the derivatives leg really is dark, the proposal's framing stands, and every guard below inverts |
| This month | **Expect a wide-ish 2026-09-24 cash bar and attribute it to the gap, not the holiday** | Medium | A Tokyo gap spanning three unmatched US sessions runs \|c2c\| **2.061%** (n=25, se 0.261) against **1.021%** at zero (n=6,221). The prior two Silver Weeks printed **+1.675%** (2009-09-24) and **−2.758%** (2015-09-24) — same magnitude, opposite signs, no directional content | The **2026-09-24** `^N225` cash session printing \|close-to-close\| **at or above 2.061%** — the compression hypothesis dies. Registered as **FT-jpx-market-closure-2026-09-21-1** |
| This quarter | **Treat the auction block as ordinary** — a dark Tokyo does not bid US coupons differently | Medium | Replicated independently: indirect **63.35%** (n=37) vs **61.88%** (n=1,072), **t=+0.855**; dealer takedown 20.87% vs 23.52%, t=−1.409; 2-Year alone 55.22% (n=9) vs 55.44% (n=162), **t=−0.050**; inside a 3+ dark-day block 60.57% (n=15), t=−0.403 | Either the **2026-09-22** 2-Year or the **2026-09-23** 5-Year printing bid-to-cover **below its own last-12 minimum** (2Y **2.44**, 5Y **2.28**) — the one metric that leans (2.52 vs 2.58, t=−1.832) would stop being noise. Registered as **FT-jpx-market-closure-2026-09-21-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2026-09-21. The date is `estimate`, and date-keyed
  action requires `confirmed` regardless.
- **Execution guard — what actually trades (all three days, `estimate`):** eligible and **open**
  08:45–15:45 JST day session plus a 17:00–06:00 night session — **index futures, index options,
  commodity futures, options on commodity futures**. Ineligible and therefore **dark** — **JGB futures,
  options on JGB futures, interest-rate futures, securities options** — plus the whole **cash equity**
  market. A Japanese *equity index* leg is available; a Japanese *rates* or *single-name* leg is not.
- **Execution guard — GTC/GTD, and it INVERTS the sibling's:** because holiday trading *is* executed on
  these days, JPX's rule reads *"Good till Date/Good till Cancel orders (GTC/GTD) will expire between
  the end of holiday trading and the start of the day session on the business day after the holiday,
  **regardless of whether the products are eligible** for holiday trading."* Resting Japanese orders
  should be assumed **cancelled** across this block — the opposite of the carry-across guard
  [`jpx-market-closure-2026-11-23`](jpx-market-closure-2026-11-23.md) correctly wrote for its `Not
  Open` day. JPX adds that a brokerage not supporting holiday trading expires GTC/GTD *immediately
  before* the holiday open.
- **Execution guard — wider halts:** Dynamic Circuit Breaker suspensions run **60 seconds for index
  futures (30 on weekdays)** and **30 seconds for index options (15 on weekdays)**, and expanded price
  limits set on a holiday session persist to the next business day's day session.
- **Attribution trap (Thu 2026-09-24):** the first cash bar back has an FOMC-09-16 explanation, a
  BoJ-09-18 explanation, a Japan-CPI-09-18 explanation, a quarterly-opex-09-18 explanation, a
  `trump-xi-summit-2026-09-24` explanation and a three-holiday-gap explanation before it has any single
  one. The gap effect is a **variance** result with no sign (3-session bucket signed mean **+0.093%**).
- **Corridor note, so nobody re-derives it wrong:** 09-22 and 09-23 are tracked as their own events
  (`jpx-market-closure-2026-09-22`, `-09-23`), both still *proposals* awaiting their own initial
  research. Everything in this ledger about `Open` status applies to all three days; this lane may not
  write their canonical files and did not.

## Initial research

### The question

`jpx-market-closure-2026-09-21` was proposed during the `treasury-2y-note-2026-09-22` adjacency sweep on
a structural claim: Tokyo goes dark for five consecutive sessions, Sat 2026-09-19 through Wed 2026-09-23
— "the longest single blackout run in the 2026 calendar" — and that blackout covers the US 2-Year
(09-22) and 5-Year (09-23) auctions outright. The proposer had already measured, and rejected, the
obvious hunch that a dark Tokyo depresses indirect bidding. **Is the blackout premise true, is it the
longest, and is there anything about this particular block that the sibling closure ledgers have not
already dissolved?**

**One-line verdict:** **the blackout premise is false for derivatives, the "longest" claim is a tie, the
auction null replicates exactly — and the one real finding is a calendar rarity nobody had named.**

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Nothing below is inherited from the proposing entry or the sibling ledgers; every
source was re-fetched and every statistic recomputed in-session.

- **JPX** `jpx.co.jp/english/corporate/about-jpx/calendar/index.html` (HTTP 200, **33,103 bytes**,
  page's own `Update : Feb. 06, 2026`) — the 2026 and 2027 market-holiday panels.
- **JPX** `jpx.co.jp/english/derivatives/rules/holidaytrading/index.html` (HTTP 200, **48,483 bytes**,
  `Update : Jun. 26, 2026`) — **the source of the correction**: the 2026/2027 eligible-holiday tables,
  all footnotes, the eligible-product table, trading hours, DCB table and the GTC/GTD rule, parsed row
  by row.
- **JPX** `…/holidaytrading/b5b4pj0000050353-att/List_of_Finalized_Holiday_Trading_Days_E.xlsx`
  (HTTP 200, **11,884 bytes**) — 77 dated entries, `2022-09-23 → 2027-05-05`, each with the exchange's
  own `Open` / `Not Open` label. Parsed cell by cell from the workbook XML.
- **Cabinet Office of Japan** `www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv` (HTTP 200, **21,538
  bytes**, Shift-JIS) — **1,067 national holidays, 1955-01-01 → 2027-11-23**. Independent of JPX and
  the basis for the Silver Week census.
- **US Treasury Fiscal Data** `auctions_query` (**4,105 rows**, `auction_date ≥ 2016-01-01`, pulled
  direct 2026-09-15) — **1,109 note/bond auctions**, shares computed over *competitive accepted*
  (indirect + direct + primary dealer), which is the proposer's own stated basis.
- **Yahoo Finance** daily bars: `^N225` **6,540 sessions**, 2000-01-04 → 2026-09-14 (exchange timezone
  `Asia/Tokyo`, last close **63,492.99**); `^GSPC` 6,715 sessions to 2026-09-15; `^VIX` 6,717 sessions
  to 2026-09-15 (close **17.49**, the probe reference). No 429s and no retries this session.
- **Grepped, not assumed:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  for `holiday|jpx|tokyo|nikkei|closure|silver week|osaka` — **0 hits in both**.
- **Not fetched, so not asserted:** CME/SGX Nikkei futures holiday calendars, MOF's JGB auction
  results, actual OSE holiday-session volumes (the one number that would turn leg 1 from a *rule* into
  a *measured liquidity* claim). No fetch failed, so `probe-ref.blocked` stays empty.

### Conviction legs, tested

1. **"Tokyo dark" — REFUTED for derivatives, on JPX's own finalized table.** The holiday-trading page
   carries, verbatim:

   | Date | Day | Holiday | Markets | Status |
   |---|---|---|---|---|
   | September 21 | Mon. | Respect for the Aged Day | **Open** | **Finalized** |
   | September 22 | Tue. | Holiday⁵ | **Open** | **Finalized** |
   | September 23 | Wed. | Autumnal Equinox Day | **Open** | **Finalized** |

   The finalized xlsx repeats all three as `Open`. So index futures, index options, commodity futures
   and options on commodity futures trade **08:45–15:45 JST plus a 17:00–06:00 overnight session on
   each of the three days**; only the cash equity market and the always-ineligible rates/securities-
   options complex are shut. Footnote 5 explains 09-22 precisely: *"September 22, 2026, is a holiday in
   accordance with Rule 3, Paragraph 3 of Act on National Holidays"* — the weekday-between-two-holidays
   rule, not a market decision. **The rates leg genuinely is dark all three days**, which is the half of
   the proposal's framing that survives — but JGB futures are ineligible on *every* Japanese holiday,
   so that is ordinary, not a property of this block.

2. **The `Open` treatment is not a property of the holiday — SUPPORTED, and it is the flippable part.**
   On the exchange's own file, Respect for the Aged Day reads `Open` (2023-09-18), **`Not Open`**
   (2024-09-16), **`Not Open`** (2025-09-15), `Open` (**2026-09-21**), and **`Not Open`** again for
   2027-09-20 under footnote 7's FY2027 group-wide BCP test (window September 18–20). Two years of
   `Not Open` immediately precede this one, which is exactly why the proposal's inherited framing was
   plausible — and exactly why it needed checking rather than carrying. This also **independently
   corroborates** [`jpx-market-closure-2026-11-23`](jpx-market-closure-2026-11-23.md)'s finding that
   `Not Open` is a routine state (16 of 77 entries here, same file, same count) rather than a BCP
   one-off.

3. **"The longest single blackout run in the 2026 calendar" — REFUTED; it is a tie.** Enumerating
   consecutive dark calendar days for the Tokyo cash market across all of 2026 (weekends + Cabinet
   Office holidays), the two longest runs are **five days each**: **2026-05-02 → 2026-05-06** (Golden
   Week) and **2026-09-19 → 2026-09-23** (this block). Every other 2026 run is three days or shorter.
   Golden Week 2026 was *also* all-`Open` for derivatives, so it is not merely a tie on length — it is
   the same animal, four months earlier.

4. **Silver Week is genuinely rare — SUPPORTED, and this is the finding worth keeping.** Taking the
   Cabinet Office file whole (1,067 holidays, 1955 → 2027) and asking in which years September 21, 22
   **and** 23 are *all* national holidays, the answer is **three: 2009, 2015, 2026.** It requires the
   third Monday of September to fall on the 21st *and* the autumnal equinox to land on the 23rd, so the
   Tuesday in between becomes a holiday by the sandwich rule. Both precedents carry the **identical**
   `09-18 → 09-24` date shape as 2026, and both **predate JPX holiday trading** (launched 2022-09-23).
   **2026-09-24 is therefore the first Silver Week first-cash-bar-back in history with a continuously
   priced Osaka futures market behind it** — a genuine natural experiment, n=1.

5. **What the gap is worth, measured — a variance effect with no sign.** First `^N225` cash session
   after a gap, bucketed by the number of `^GSPC` sessions falling strictly inside it (2000-01-04 →
   2026-09-14):

   | Unmatched US sessions | n | mean \|c2c\| | se | median | signed mean |
   |---|---|---|---|---|---|
   | 0 | 6,221 | 1.021% | 0.013 | 0.740% | +0.014% |
   | 1 | 268 | 1.457% | 0.086 | 1.105% | +0.351% |
   | 2 | 24 | 1.383% | 0.226 | 1.384% | +0.469% |
   | **3** *(this block)* | **25** | **2.061%** | **0.261** | **1.727%** | **+0.093%** |

   This reproduces [`jpx-market-closure-2026-11-23`](jpx-market-closure-2026-11-23.md)'s
   1.021/1.457/2.061 ladder to the third decimal on an independently built gap table — a replication,
   not a discovery, and it is recorded as such. The **two prior Silver Weeks sit inside that bucket**:
   2009-09-24 printed **+1.675%**, 2015-09-24 printed **−2.758%**. Same magnitude, opposite signs.

6. **Does a traded-through closure compress the bar? — UNTESTABLE TODAY, n=2, registered instead.**
   The natural test is post-launch 3-weekday closure blocks where JPX ran holiday sessions throughout.
   There are exactly **two**: Golden Week **2023** (first bar back 2023-05-08, **0.714%**) and Golden
   Week **2026** (2026-05-07, **5.580%** — the single largest observation anywhere in the 34-block
   series). One well below the 2.061% bucket mean, one enormously above it. **That is not evidence in
   either direction**, and saying so is the honest output; 2026-09-24 becomes the third observation and
   is registered as a forward test rather than claimed as a result.

7. **The auction null — REPLICATED EXACTLY, independently.** Re-pulled Fiscal Data from scratch and
   recomputed the proposer's statistics without looking at its numbers first:

   | Metric | On a Japanese national holiday | Otherwise | Welch t |
   |---|---|---|---|
   | Indirect share (all note/bond) | **63.35%** (n=37) | 61.88% (n=1,072) | **+0.855** |
   | Dealer takedown | 20.87% | 23.52% | −1.409 |
   | Bid-to-cover | **2.52** | **2.58** | **−1.832** |
   | Indirect, 2-Year only | 55.22% (n=9) | 55.44% (n=162) | −0.050 |
   | Indirect, inside a 3+ dark-day block | 60.57% (n=15) | 61.88% | −0.403 |

   Every figure the proposal reported reproduces to two decimals. **The one metric it did not report is
   the only one that leans:** bid-to-cover runs **0.06 lower** on Tokyo-holiday auctions, t = −1.832 —
   short of conventional significance, and pointing the *opposite* way from the indirect and dealer
   results, which both lean "stronger when Tokyo is out." Two of three leaning one way and the third
   the other, none clearing 2, is what noise looks like. It is registered as a forward test rather than
   buried. Direct September precedents, all five since 2016: 2016-09-22 9Y10M indirect 69.71%,
   2018-09-24 2Y **39.96%**, 2020-09-22 2Y 52.53%, 2021-09-23 9Y10M 71.51%, 2025-09-23 2Y 57.75% — a
   spread of 31 points, which is the honest picture of what n=9 buys.

8. **Nothing house-side is calendar- or Japan-keyed — SUPPORTED, re-verified not inherited.** A grep of
   `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|jpx|tokyo|nikkei|closure|silver week|osaka` returns **zero hits in both files**, run this
   session. No playbook can fire on this date in either direction.

9. **No new dated adjacent event to propose — a deliberate empty result.** The corridor already carries
   **57** tracked events within five days, including both sibling closure days, the full 2Y/5Y/7Y
   auction block, `boj-decision-2026-09-18`, `japan-cpi-2026-09-18`, `opex-2026-09-18` and
   `trump-xi-summit-2026-09-24`. The finalized xlsx gives exchange-authoritative dates through
   2027-05-05 and no JPX holiday inside this corridor is untracked. The one dated discovery worth
   recording is **out of corridor and already banked** by the 11-23 sibling: JPX footnote 7 closes
   2027-09-20 (Respect for the Aged Day) for the FY2027 BCP window, `Not Open` / `Scheduled`.

### What plays the conditions support

None. The cash market is shut, the derivatives market is open but `symbols` is empty, impact is `low`,
the date is `estimate`, and no playbook is calendar-keyed. The supported outputs are the four execution
guards in the signals list — of which the **GTC/GTD one inverts the 11-23 sibling's**, because that day
is `Not Open` and these three are `Open`, and JPX writes opposite rules for the two cases — plus the
attribution warning and two registered forward tests. Legs 5 and 6 are **variance** findings with no
directional content (3-session bucket signed mean **+0.093%**); nothing here should be sized to.

### Honest limits

- **Leg 6 is n=2 and 2026-09-24 makes it 3.** Two Golden Weeks straddling the bucket mean by a factor
  of eight cannot settle whether holiday trading compresses the first cash bar. The forward test is a
  record, not a signal — and the bucket's own right skew (median 1.727% against a 2.061% mean; **60% of
  its 25 observations print below the mean**) means a single "below" reading is weak evidence even if
  it lands. That asymmetry is stated *before* the outcome exists, on purpose.
- **"Open" is a rule, not a volume.** JPX says these products trade; this session did **not** fetch
  holiday-session volume or open interest, so nothing is asserted about how *liquid* the Osaka session
  actually is. A holiday session that trades 5% of a weekday's volume would weaken leg 6's premise
  without changing leg 1's fact. That is the single highest-value thing a first pulse could add.
- **The Silver Week census is a holiday-calendar fact, not a market-calendar one.** The Cabinet Office
  file runs to 2027-11-23, so "three times since 1955" is exact for the past and says nothing about
  2028+. The next candidate year is outside the file.
- **n=9 for the 2-Year holiday arm, n=37 overall.** The auction legs rule out a *large* effect and
  nothing smaller; the 31-point spread across the five September precedents is the honest scale of the
  uncertainty.
- **No CME/SGX leg.** Nikkei futures also list offshore and would price these days regardless of OSE,
  which if anything strengthens leg 1's conclusion. Those calendars were not fetched, so nothing is
  asserted about them.
- **Every corridor entry that matters here is `estimate`,** including this one. Estimates widen caution
  and license nothing.

## Stance & kill switches

**Stance (2026-09-15):** stand aside, permanently and structurally — this row exists to correct a
framing, hold four execution guards, and register two tests. Concretely: (a) the proposal's
"Tokyo dark" premise is **false for derivatives** — JPX carries 2026-09-21, 09-22 and 09-23 as
`Open | Finalized` on two primaries, so only the cash equity market and the always-ineligible
rates/securities-options complex are shut; (b) its "longest blackout run in the 2026 calendar" is a
**tie** with Golden Week (2026-05-02 → 05-06), which was also traded through; (c) its auction null
**replicates exactly** on an independent pull (indirect 63.35%/61.88%, t=+0.855; 2Y 55.22%/55.44%,
t=−0.050), with the one unreported metric, bid-to-cover, leaning 2.52 vs 2.58 at t=−1.832 — noise, and
registered as such; (d) the finding actually worth keeping is that **Silver Week has occurred three
times since 1955 (2009, 2015, 2026)** and 2026-09-24 is the first Silver Week cash bar back ever to
have a continuously priced Osaka futures market behind it. Every statement here carries the event's
**`estimate`** label.

**Kill switches:**

- **The 2026-09-24 `^N225` cash session prints |close-to-close| at or above 2.061%** — the
  3-unmatched-US-session bucket mean. The "holiday trading compresses the first bar back" hypothesis
  dies on its first Silver Week observation. Registered as **FT-jpx-market-closure-2026-09-21-1**,
  score by 2026-09-25.
- **Either the 2026-09-22 2-Year or the 2026-09-23 5-Year prints bid-to-cover below its own last-12
  minimum** (2Y **2.44**, 5Y **2.28**) — the t = −1.832 cover lean stops being noise and the auction
  null needs re-arguing. Registered as **FT-jpx-market-closure-2026-09-21-2**, score by 2026-09-24.
- **JPX republishes any of 2026-09-21/22/23 as `Not Open`** — leg 1 collapses, the proposal's framing
  is reinstated, and the GTC/GTD guard inverts back to "orders carry across".
- **OSE holiday-session volume on these days comes in at a small fraction of a weekday's** — leg 6's
  premise ("priced through") weakens even though leg 1's fact holds, and the compression hypothesis
  should be withdrawn rather than scored.
- **A house playbook keyed to Japanese sessions or holiday-adjacent bars is written and back-tested**
  — leg 8 goes stale and the stand-aside is re-argued on measured data rather than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-15 | 6 | **Initial research.** Canonical `src/domain/market-events/jpx-market-closure-2026-09-21.json` written from the sole proposal (`.from-treasury-2y-note-2026-09-22`), now shadowed; the 09-22/09-23 sibling proposals from the same sweep are left to their own lanes. **Finding 1 — "Tokyo dark" REFUTED for derivatives:** JPX's holiday-trading table (HTTP 200, 48,483 B) and its finalized xlsx (11,884 B, 77 entries) both carry 09-21, 09-22 and 09-23 as `Open \| Finalized` — index futures/options and commodity futures trade 08:45–15:45 JST + 17:00–06:00 overnight on all three; only cash equity plus the always-ineligible JGB futures, options on JGB futures, interest-rate futures and securities options are dark. Footnote 5: 09-22 is a holiday by Rule 3 ¶3 of the Act on National Holidays (sandwich rule). A flip from `Not Open` in 2024-09-16 and 2025-09-15, flipping back for 2027-09-20 (FY2027 BCP). **Finding 2 — "longest 2026 blackout run" REFUTED, it's a tie:** Golden Week 2026-05-02→05-06 also runs five dark calendar days and was also all-`Open`. **Finding 3 — Silver Week is rare:** Cabinet Office CSV (21,538 B, 1,067 holidays, 1955→2027) gives Sep 21+22+23 all-holiday in **2009, 2015, 2026 only**; both precedents share the identical 09-18→09-24 shape and both predate holiday trading (launched 2022-09-23), so 2026-09-24 is the first such bar back with Osaka priced through. **Finding 4 — auction null REPLICATES exactly** (Fiscal Data, 4,105 rows, 1,109 note/bond since 2016): indirect 63.35% (n=37) vs 61.88% (n=1,072) **t=+0.855**; dealer 20.87%/23.52% t=−1.409; 2Y 55.22% (n=9)/55.44% (n=162) t=−0.050; 3+ dark block 60.57% (n=15) t=−0.403. **New:** bid-to-cover 2.52/2.58, **t=−1.832** — the only leaning metric, unreported by the proposal. **Replication (not a find):** \|c2c\| ladder by unmatched-US count 1.021% (n=6,221) / 1.457% (n=268) / 1.383% (n=24) / **2.061% (n=25, se 0.261)**, reproducing the 11-23 sibling to three decimals; prior Silver Weeks +1.675% (2009) and −2.758% (2015). Post-launch traded-through 3-weekday blocks: n=2 only, 0.714% (2023-05-08) and 5.580% (2026-05-07) — no evidence either way. Guard that **inverts** the 11-23 sibling's: on an `Open` day JPX states GTC/GTD **do** expire, regardless of product eligibility. Adjacency — peers: n/a (`symbols: []`); macro: 57 tracked corridor events incl. `fomc-2026-09-16`, `retail-sales-2026-09-16`, `opex-2026-09-18`, `boj-decision-2026-09-18`, `japan-cpi-2026-09-18`, the 2Y/5Y/7Y block 09-22→09-24; VIX **17.49** (`^VIX` close 2026-09-15); geopolitical: `trump-xi-summit-2026-09-24`, `unga-81-general-debate-2026-09-22`, nothing dated to the closure itself; tape: `^N225` 63,492.99 (2026-09-14). Playbook grep `holiday\|jpx\|tokyo\|nikkei\|closure\|silver week\|osaka` → **0 hits in both**. **No proposal:** no untracked JPX holiday in corridor on the exchange's own file; 2027-09-20 (FY2027 BCP) stays banked out of corridor as the 11-23 sibling left it. No fetch failed — `probe-ref.blocked` empty. | Initial stance set: **stand aside** (structural row only). Registers **FT-jpx-market-closure-2026-09-21-1** and **-2**. | 2026-09-22 (close-out window) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jpx-market-closure-2026-09-21.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
