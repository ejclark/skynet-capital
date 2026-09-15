# Tokyo cash shut, Osaka open — the Rule 3(3) in-between day, live overnight when the 2-Year prices — jpx-market-closure-2026-09-22

**Kind:** sector · **Date:** 2026-09-22 (estimate — EST: JPX `…/about-jpx/calendar/` + `…/derivatives/rules/holidaytrading/` + the exchange's finalized-holiday-trading xlsx + Japan's Cabinet Office holiday CSV, all fetched direct 2026-09-15; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-15
<!-- probe-ref: {"symbols":{},"vix":17.51,"daysBand":"low:0+","adjacentIds":["bea-international-transactions-q2-2026-09-24","boe-decision-2026-09-17","boj-decision-2026-09-18","bowman-stress-testing-2026-09-18","costco-q4-fy2026-2026-09-24","dmo-pilot-switch-auction-test-2026-09-24","durable-goods-2026-09-25","ecb-economic-bulletin-2026-09-24","eurostat-hicp-final-2026-09-17","housing-starts-2026-09-17","industrial-production-2026-09-18","intl-transactions-q2-2026-09-24","japan-cpi-2026-09-18","jgb-liquidity-enhancement-5-11y-2026-09-25","jpx-market-closure-2026-09-21","jpx-market-closure-2026-09-23","meta-connect-2026-09-23","missouri-map-tro-expiry-2026-09-22","missouri-uocava-ballot-mailing-2026-09-19","new-home-sales-2026-09-24","opex-2026-09-18","pending-home-sales-2026-09-17","philly-fed-mfg-2026-09-17","russell-quarterly-ipo-review-effective-2026-09-21","scoos-2026-09-24","sp-global-flash-eurozone-pmi-2026-09-23","sp-global-flash-france-pmi-2026-09-23","sp-global-flash-germany-pmi-2026-09-23","sp-global-flash-us-pmi-2026-09-23","sp-quarterly-rebalance-effective-2026-09-21","steel-imports-preliminary-2026-09-24","treasury-10y-tips-2026-09-17","treasury-2y-frn-2026-09-23","treasury-2y-note-2026-09-22","treasury-5y-note-2026-09-23","treasury-7y-note-2026-09-24","treasury-buyback-20y30y-2026-09-24","treasury-buyback-7y10y-2026-09-17","treasury-coupon-announcement-2026-09-17","trump-xi-summit-2026-09-24","uk-consumer-confidence-2026-09-25","uk-public-sector-finances-2026-09-22","uk-retail-sales-2026-09-18","umich-sentiment-final-2026-09-25","unga-81-general-debate-2026-09-22","unsc-iran-panel-mandate-expiry-2026-09-26","unsc-iran-panel-mandate-vote-2026-09-17"],"adjacentStrongIds":["opex-2026-09-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **Stand aside. The one thing worth knowing about 09-22 specifically is a clock, not a price:
the US 2-Year note auction prints at 02:00 JST on 09-23, inside the 09-22 holiday *night* session, so a
Japanese equity-index hedge is live across the auction while every Japanese rates instrument is dark.**
The sibling [`jpx-market-closure-2026-09-21`](jpx-market-closure-2026-09-21.md) landed hours before this
one and already corrected the proposal's "Tokyo dark" framing; every one of its findings re-verified
here from independent fetches, and this ledger does not re-litigate them. What is **new** is two things
the sibling explicitly left open. First, it named OSE holiday-session volume as *"the single
highest-value thing a first pulse could add"* — that number **does not exist in JPX's daily statistics**,
because the exchange's own trading-day rule folds 09-21/22/23 into the trading day ending with the
09-24 day session, and its daily-report index proves it (May 2026 lists no 05-04/05/06 report; the
volume lands on 05-07). Second, the sibling could only test "does trading through compress the first
cash bar?" at **n=2**. Reframed as *where* the move happens rather than how big it is, the same question
has **n=39 vs 8 vs 118**, and it is a clean null: mean \|overnight gap\| **0.748%** after a traded-through
closure vs **0.769%** after a shut one (**t = −0.110**), difference-in-differences against the pre-launch
era **−0.078pp, t = −0.831**. Osaka pricing through the holiday does **not** move discovery into the
Tokyo open. Nothing here is tradeable: `estimate`, `impact: low`, `symbols: []`, 0 playbook hits.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a foreign cash-equity holiday seven days out is not a position | High | D-7; `symbols: []`, `impact: low`, `estimate`, and 0 hits for `holiday\|jpx\|tokyo\|nikkei\|closure\|silver week\|equinox` across `trade-playbooks.md` + `multi-symbol-sweep.md`, re-grepped this session rather than inherited | A house playbook keyed to Japanese sessions or holiday-adjacent bars being written and back-tested before **2026-09-22** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Note the clock, not the closure** — if any Japanese leg is held into the 2-Year, know which half of it is awake | Medium | The auction prices 1:00pm ET 09-22 = **02:00 JST 09-23**, inside the 09-22 holiday night session (17:00–06:00 JST). Index futures/options and commodity futures are `Open`; **JGB futures, options on JGB futures, interest-rate futures and securities options are ineligible** for holiday trading and dark all three days, as is cash equity (`estimate`) | JPX republishing any of 2026-09-21/22/23 as `Not Open` before **2026-09-22** — the equity-index leg goes dark too and the asymmetry this row is built on disappears |
| This month | **Expect the 2026-09-24 move to split gap/intraday like any other holiday bar** | Medium | Treatment-labelled on JPX's own `Open`/`Not Open` file: \|gap\| **0.748%** (n=39) traded-through vs **0.769%** (n=8) shut, **t = −0.110**; \|intraday\| 0.853% vs 0.769%, t = +0.292; DiD vs pre-launch, netting out ordinary sessions, **−0.078pp (t = −0.831)** on the gap. The relocation signature (\|gap\| ≥ 2×\|intraday\|) fires on **31%** of traded-through, **34%** of pre-launch and **28%** of ordinary sessions — the same rate either way | The **2026-09-24** `^N225` overnight gap printing **at or above 1.73%** — the traded-through arm's mean + 2 sd, **never once exceeded in its 39 observations**. Registered as **FT-jpx-market-closure-2026-09-22-1** |
| This quarter | **Stop asking for OSE holiday-session volume — JPX does not publish it** | Medium | The exchange's trading-day rule states holiday trading *"shall be the same [trading day] as … the day session which begins from the weekday following"*. Its daily-report index for 202605 carries **no** `20260504`/`05`/`06` entry; the Golden Week sessions are inside `Daily_Report_OSE_20260507.zip`. So a per-session volume number is structurally unavailable from daily statistics | JPX's 202609 daily-report index listing a `20260921`, `20260922` or `20260923` TradeDate, observed by **2026-09-26** — holiday sessions would be separately reported after all and the number the 09-21 sibling wanted becomes gettable. Registered as **FT-jpx-market-closure-2026-09-22-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2026-09-22. The date is `estimate`, and date-keyed
  action requires `confirmed` regardless.
- **Execution guard — the auction clock (09-22 → 09-23, `estimate`):** `treasury-2y-note-2026-09-22`
  is **confirmed** at 1:00pm ET, which is **02:00 JST on 09-23**. That falls inside the 09-22 holiday
  **night** session (17:00–06:00 JST), and the 09-23 holiday **day** session opens 6h45m later at 08:45
  JST. A Nikkei/TOPIX futures or index-options leg is therefore continuously quotable across the print;
  a JGB-futures, interest-rate-futures or single-name-options leg is not, and neither is cash equity.
- **Execution guard — what actually trades (all three days, `estimate`):** eligible and **open** —
  index futures, index options, commodity futures, options on commodity futures, 08:45–15:45 JST plus
  17:00–06:00 JST. Ineligible and **dark** — JGB futures, options on JGB futures, interest-rate
  futures, securities options — plus the whole cash equity market.
- **Execution guard — GTC/GTD orders expire.** Because holiday trading *is* executed on these days,
  JPX's rule reads *"Good till Date/Good till Cancel orders (GTC/GTD) will expire between the end of
  holiday trading and the start of the day session on the business day after the holiday, **regardless
  of whether the products are eligible** for holiday trading."* Resting Japanese orders should be
  assumed **cancelled** across this block — the opposite of the carry-across guard
  [`jpx-market-closure-2026-11-23`](jpx-market-closure-2026-11-23.md) correctly wrote for its `Not
  Open` day. This restates the 09-21 sibling's guard because it applies identically to 09-22; it is
  not an independent finding.
- **Reporting guard (data, not trading):** nothing dated 09-21, 09-22 or 09-23 will appear in JPX's
  OSE/TOCOM daily reports. Those three sessions settle into the **2026-09-24** trading day. A future
  session reading "no report on 09-22" as an outage would be reading the trading-day rule wrong.
- **Attribution trap (Thu 2026-09-24):** the first cash bar back has an `opex-2026-09-18` explanation,
  a `boj-decision-2026-09-18` explanation, a `japan-cpi-2026-09-18` explanation, a
  `trump-xi-summit-2026-09-24` explanation and a three-holiday-gap explanation before it has any
  single one. Every gap finding in this file and its siblings is a **variance** result with no
  directional content.
- **Corridor note:** 09-21 has its own canonical entry and ledger; **09-23 is still only a proposal**
  (`proposals/jpx-market-closure-2026-09-23.from-treasury-2y-note-2026-09-22.json`) awaiting its own
  lane. This session may not write another event's canonical file and did not.

## Initial research

### The question

`jpx-market-closure-2026-09-22` was proposed during the `treasury-2y-note-2026-09-22` adjacency sweep as
the middle day of a claimed five-session Tokyo blackout landing on the US 2-Year auction date itself.
Between that proposal and this session, the **09-21 sibling ledger landed** and refuted the blackout
framing outright. So the honest question this lane inherited is narrower and better:
**given that the sibling already corrected the framing, is there anything true about 09-22 in
particular — and can the two open items it left be closed?**

**One-line verdict:** **yes to both, and neither is a price.** The 09-22-specific fact is a clock — the
2-Year prices inside the 09-22 holiday night session, so the equity-index leg is awake and the rates leg
is not. The sibling's "get OSE holiday volume" item is closed structurally: **JPX never publishes it**.
Its n=2 compression question is closed statistically: reframed as *where* the move lands rather than how
big it is, it is a **well-powered null**.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Every source below was fetched in this session; nothing is carried from the
proposal or the sibling ledgers, and where a number reproduces theirs it is labelled a replication.

- **JPX** `…/corporate/about-jpx/calendar/index.html` (HTTP 200, **33,103 bytes**, `Update : Feb. 06,
  2026`) — the 2026 and 2027 market-holiday panels and both footnotes.
- **JPX** `…/derivatives/rules/holidaytrading/index.html` (HTTP 200, **48,483 bytes**, `Update : Jun.
  26, 2026`) — eligible-holiday tables, all seven footnotes, the eligible-product table, trading hours,
  the trading-day rule, reference-price rule, DCB table and the GTC/GTD rule.
- **JPX** `…/holidaytrading/b5b4pj0000050353-att/List_of_Finalized_Holiday_Trading_Days_E.xlsx`
  (HTTP 200, **11,884 bytes**) — **77 entries, 2022-09-23 → 2027-05-05**, parsed cell by cell out of the
  workbook XML into a date → `Open`/`Not Open` map used as the treatment label in leg 4. 16 are
  `Not Open`, matching the 11-23 and 09-21 ledgers exactly.
- **JPX** `…/automation/markets/statistics-derivatives/daily/json/daily_report_monthlylist.json` and
  `daily_report_202605.json` (HTTP 200) — **new to this repo**, and the source of leg 2. The per-trade-date
  index of OSE/TOCOM daily reports. `Daily_Report_OSE_20260507.zip` (HTTP 200, **4,318,153 bytes**, 11
  PDFs) was downloaded and its index-futures report text-extracted to confirm it is a real trading-day
  report, not a stub.
- **Cabinet Office of Japan** `www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv` (HTTP 200, **21,538
  bytes**, Shift-JIS) — **1,067 holidays, 1955-01-01 → 2027-11-23**, classified row by row into
  Rule 3(3) citizens' holidays vs Sunday substitutes for leg 3.
- **US Treasury Fiscal Data** `auctions_query` (**4,105 rows**, `auction_date ≥ 2016-01-01`, pulled
  direct 2026-09-15) — **1,109 note/bond auctions**, shares over competitive accepted.
- **Yahoo Finance** daily bars, pulled fresh: `^N225` **9,006 sessions** 1990-01-04 → 2026-09-14
  (`Asia/Tokyo`, last close **63,492.99**); `^GSPC` 9,243 sessions to 2026-09-15; `^VIX` 9,245 sessions
  to 2026-09-15, close **17.51** — the probe reference. *(The 09-21 sibling recorded 17.49 from an
  earlier pull the same day; this is an intraday refresh of a live series, not a discrepancy to
  reconcile.)* No 429s and no retries.
- **Grepped, not assumed:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  for `holiday|jpx|tokyo|nikkei|closure|silver week|equinox` — **0 hits in both**.
- **Not fetched, so not asserted:** CME/SGX Nikkei futures holiday calendars, MOF JGB auction results,
  and the per-contract volume columns inside the OSE daily-report PDFs (see honest limits). No fetch
  failed, so `probe-ref.blocked` stays empty.

### Conviction legs, tested

1. **The date, the day type and the `Open` label — SUPPORTED from four primaries, and still
   `estimate`.** The market-holiday panel reads `Sep. 22 (Tue.) Holiday 2`, footnote 2 reading verbatim
   *"September 22, 2026, is a holiday in accordance with Rule 3, Paragraph 3 of Act on National
   Holidays."* The holiday-trading table carries `September 22 | Tue. | Holiday⁵ | **Open** |
   **Finalized**`, and the finalized xlsx independently carries serial **46287 = 2026-09-22**, Name
   **"Holiday"**, Markets **"Open"**. The Cabinet Office CSV carries `2026/9/22 休日` between
   `2026/9/21 敬老の日` and `2026/9/23 秋分の日`. It stays `estimate` only because
   `market-events-data.ts` has no prefix slot for an exchange holiday calendar and this lane may not
   self-confirm an in-sweep discovery — a taxonomy fact, not a date doubt, and it costs nothing when
   every call is a stand-aside.

2. **OSE holiday-session volume is not published — SUPPORTED, and this closes the sibling's open
   item by answering it rather than filling it.** [`jpx-market-closure-2026-09-21`](jpx-market-closure-2026-09-21.md)
   named this *"the single highest-value thing a first pulse could add"*, and reasonably assumed it was
   a fetch away. It is not. JPX's own trading-rules section states: *"The trading day of holiday trading
   shall be the same as that of the night session which begins on the weekday preceding the holiday
   trading day … and the day session which begins from the weekday following the holiday trading day."*
   So a holiday session has **no trading day of its own**. The daily-report index confirms the
   consequence directly — May 2026's 18 trade dates are `20260501, 20260507, 20260508, …`: **there is no
   `20260504`, `20260505` or `20260506` report**, and the three Golden Week holiday sessions settle
   inside the `20260507` report. Applied here: **nothing dated 09-21, 09-22 or 09-23 will ever appear in
   JPX daily statistics; those sessions are inside the 2026-09-24 trading day.** The bound that *is*
   obtainable — how much the absorbing trading day's volume exceeds an ordinary one — needs per-contract
   columns out of the report PDFs, which this session did not extract reliably (see honest limits).

3. **The Rule 3(3) day type is rare, and 2026-09-22 is its first appearance in the holiday-trading era —
   SUPPORTED.** Classifying all **1,067** Cabinet Office holidays by *mechanism* rather than by label
   (a `休日` row whose neighbours on both sides are named holidays is a Rule 3(3) citizens' holiday; a
   `休日` row following a Sunday holiday is a substitute) gives **24 citizens' holidays since 1955**.
   Nineteen are May 4 between 1981 and 2006 — a category that vanished when May 4 became Greenery Day
   outright in 2007 — and two are the 2019 abdication pair. **Exactly three fall in September: 2009-09-22,
   2015-09-22, 2026-09-22**, all Tuesdays, all bracketed by Respect for the Aged Day and the Autumnal
   Equinox. This is the *mechanism* behind the 09-21 sibling's Silver Week census (same three years,
   reached from the other direction — a useful independent confirmation) and it adds one fact the census
   did not: the **last citizens' holiday of any kind was 2019-05-02**, so 2026-09-22 is the first in over
   seven years and the first since JPX holiday trading launched on 2022-09-23. JPX's finalized file
   reflects that — **"Holiday" is the only entry of that name among all 77**, every other row naming a
   holiday. **Honest reading:** that is a taxonomy first, not a mechanism. No rule in the holiday-trading
   regime keys on day *type*, and the `Open` label is identical to its two neighbours'.

4. **Does trading through a closure relocate price discovery into the cash open? — NO, and this is a
   well-powered null, not the sibling's n=2.** The sibling asked whether holiday trading *compresses*
   the first bar back and could only find two post-launch multi-day blocks. Ask instead **where inside
   the bar the move happens** — the mechanism the holiday-trading regime was explicitly created for
   (*"provision of hedging opportunities during national holidays"*) — and every post-launch closure
   qualifies, labelled by JPX's own `Open`/`Not Open` file:

   | First `^N225` cash session back | n | mean \|overnight gap\| | mean \|intraday\| | mean \|c2c\| |
   |---|---|---|---|---|
   | after a block JPX labelled **`Open`** (Osaka traded through) | **39** | **0.748%** (se 0.078) | **0.853%** (se 0.133) | 1.404% |
   | after a block JPX labelled **`Not Open`** (Osaka shut too) | 8 | 0.769% (se 0.178) | 0.769% (se 0.256) | 1.503% |
   | pre-launch holiday closure (2013-01-01 → 2022-09-22) | 118 | 0.832% (se 0.050) | 0.731% (se 0.055) | 1.263% |
   | ordinary session, post-launch | 921 | 0.600% (se 0.014) | 0.715% (se 0.027) | 1.018% |
   | ordinary session, pre-launch (2013+) | 2,258 | 0.605% (se 0.010) | 0.642% (se 0.015) | 0.931% |

   `Open` vs `Not Open`: **t = −0.110** on the gap, **+0.292** on the intraday. Against the pre-launch
   era, **difference-in-differences netting out ordinary sessions** gives **−0.078pp (t = −0.831)** on
   the gap and **+0.049pp (t = +0.333)** intraday — the **wrong sign** for the "futures priced it
   through, so the cash market opens at fair value" story on both halves. The DiD frame earns its place
   here: the raw pre/post intraday comparison would have looked suggestive (0.642% → 0.715% on ordinary
   sessions, **t = 2.377**), but that rise is an **era effect** present on days with no holiday at all,
   and differencing removes it. Finally the shape test, which needs no means: the relocation signature
   **\|gap\| ≥ 2 × \|intraday\|** fires on **12/39 (31%)** of traded-through sessions, **40/118 (34%)** of
   pre-launch ones and **254/921 (28%)** of ordinary sessions. Same rate, three arms.

5. **The `Not Open` \|c2c\| null replicates — a replication, credited, not a find.**
   [`jpx-market-closure-2026-11-23`](jpx-market-closure-2026-11-23.md) leg 4 reported 1.536% (n=12) vs
   1.404% (n=39), t = 0.39. On an independently built block table this session gets **1.503% (n=8) vs
   1.404% (n=39)** — the `Open` arm identical to theirs, the `Not Open` arm four observations smaller
   because this construction requires *every* closed weekday in a gap to carry a finalized label and
   drops the pre-launch-boundary blocks theirs retained. Same conclusion, arrived at differently. The
   \|c2c\| ladder by unmatched-US-session count also reproduces to three decimals on a 1990-start series
   (**1.021% / 1.457% / 2.061%** at 0/1/3 unmatched sessions since 2000, n = 6,221 / 268 / 25), which is
   now three independent constructions agreeing.

6. **The auction null replicates exactly, and the blackout-length arm is empty at n=5 — SUPPORTED.**
   Re-pulled Fiscal Data and recomputed: indirect share **63.35%** (n=37) on Japanese-holiday auctions
   vs **61.88%** (n=1,072), **Welch t = +0.855** — the wrong sign for the "dark Tokyo thins the bid"
   hunch; dealer takedown 20.87% vs 23.52%, t = −1.409; 2-Year alone **55.22%** (n=9) vs **55.44%**
   (n=162), **t = −0.050**; inside a Tokyo dark run of three or more days **60.57%** (n=15), t = −0.403.
   Every figure matches the proposal and the 09-21 sibling to two decimals. **What is new, and it is a
   caution not a finding:** enumerating the dark-run length around each of those 15 auctions, the
   longest is **4** consecutive dark days. **2026-09-22 sits inside a run of 5** (Sat 09-19 → Wed 09-23)
   — so **no auction in the 2016+ sample has ever been held inside a run this long**, and the n=15 arm
   is not evidence about it, only the nearest available. The nearest *exact* precedent is a different
   comparison and the honest one: **2025-09-23**, an Autumnal Equinox Day 2-Year, printed indirect
   57.7% / dealer 11.5%, both on that series' own norm.

7. **The 09-22 clock — SUPPORTED, and it is the one thing specific to this date.**
   `treasury-2y-note-2026-09-22` is **`confirmed`** in this calendar at **1:00pm ET** on Treasury's own
   tentative auction schedule. 1:00pm EDT is 17:00 UTC is **02:00 JST on 2026-09-23** — inside the
   **09-22 holiday night session**, which JPX's own hours table runs **17:00–06:00 JST**. The 09-23
   holiday day session then opens at 08:45 JST, 6h45m after the print. So across the auction: Nikkei/
   TOPIX index futures and index options **quotable**; JGB futures, options on JGB futures, interest-rate
   futures and securities options **ineligible and dark**; Tokyo cash equity **shut**. Neither sibling
   states this, because neither sibling's date is the auction date. **What it is not:** a channel. Leg 6
   says the auction itself does not care, and `symbols: []` means this repo holds nothing to hedge.

8. **Nothing house-side is calendar- or Japan-keyed — SUPPORTED, re-verified not inherited.** A grep of
   `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|jpx|tokyo|nikkei|closure|silver week|equinox` returns **zero hits in both**, run this
   session. No playbook can fire on this date in either direction.

9. **No new dated adjacent event to propose — a deliberate empty result.** The corridor already carries
   **47** tracked entries within five days, including both sibling closure days, the full 2Y/5Y/7Y block,
   `boj-decision-2026-09-18`, `japan-cpi-2026-09-18`, `opex-2026-09-18` (the corridor's only *confirmed*
   high-impact entry) and `trump-xi-summit-2026-09-24`. The finalized xlsx gives exchange-authoritative
   dates through 2027-05-05 and no JPX holiday inside this corridor is untracked. The one dated discovery
   worth recording is out of corridor and already banked twice: footnote 7 closes **2027-09-20** for the
   FY2027 BCP window, `Not Open` / `Scheduled`.

### What plays the conditions support

None. Cash equity is shut, derivatives are open but `symbols` is empty, impact is `low`, the date is
`estimate`, and no playbook is calendar-keyed. The supported outputs are the execution guards in the
signals list — of which the **auction-clock guard is this ledger's own** and the GTC/GTD one is the
09-21 sibling's, restated because it applies identically — plus the reporting guard from leg 2, the
attribution warning, and two registered forward tests. Legs 4, 5 and 6 are all **variance or null**
results with no directional content; nothing here should be sized to.

### Honest limits

- **Leg 2 closes the question but not the number.** "JPX does not publish per-session holiday volume"
  is established. The obtainable *bound* — how far the absorbing trading day's volume exceeds an
  ordinary day's — was attempted and **abandoned on purpose**: the OSE daily reports are PDFs with
  subsetted fonts, and while this session decoded their Latin text it could **not** reconstruct the
  numeric columns to a standard worth putting in a research ledger. A wrong volume figure is worse
  than none. The two paths a future pulse could take are named: column-wise extraction from
  `sif_dyr_<date>.pdf` inside `Daily_Report_OSE_<date>.zip`, or the legacy-BIFF monthly time series
  `…/trading-volume/…/tv_ts<YYYYMM>.xls` (HTTP 200, 1,658,368 bytes for 202608, unparsed here).
- **Leg 4's treated arm is n=39 and mostly single-day closures.** It rules out a *large* relocation
  effect and nothing smaller. Only **4** post-launch traded-through blocks span two or more closed
  weekdays — all four are Golden Week (2023-05-08, 2024-05-07, 2025-05-07, 2026-05-07) — so the
  multi-day case rests on the single-day case generalising. **2026-09-24 is the fifth such block and
  the first outside May.**
- **The `Not Open` arm is n=8.** Leg 5's replication carries the sibling's own caveat: two to four
  `Not Open` days a year means that arm grows slowly no matter who measures it.
- **Leg 6's blackout arm does not cover this case.** Its longest run is 4 days; 09-22's is 5. Stating
  that is the finding; pretending n=15 speaks to a run of 5 would not be.
- **Leg 3 is a label, not a mechanism.** The citizens'-holiday census is exact for 1955 → 2027 and says
  nothing about 2028+. No JPX rule keys on day type.
- **n=9 for the 2-Year Japanese-holiday arm.** The five September precedents since 2016 span 31 points
  of indirect share. That spread is the honest scale of the uncertainty.
- **No CME/SGX leg.** Nikkei futures also list offshore and would price these days regardless of OSE —
  which if anything strengthens leg 7's asymmetry. Those calendars were not fetched, so nothing is
  asserted about them.
- **Every corridor entry that matters here is `estimate`,** including this one, with the single
  exception of `treasury-2y-note-2026-09-22` (`confirmed`) whose time leg 7 relies on. Estimates widen
  caution and license nothing.

## Stance & kill switches

**Stance (2026-09-15):** stand aside, permanently and structurally — this row exists to hold one guard
the siblings cannot hold, close two of their open items, and register two tests. Concretely: (a) the
09-21 sibling's correction is **confirmed independently** — JPX carries 2026-09-21/22/23 as
`Open | Finalized` on two primaries, so only cash equity and the always-ineligible rates/securities-
options complex are shut; (b) **the one fact specific to 09-22** is the clock: `treasury-2y-note-2026-09-22`
(`confirmed`, 1:00pm ET) prints at **02:00 JST on 09-23, inside the 09-22 holiday night session**, so a
Japanese equity-index hedge is live across the auction while every Japanese rates instrument is dark;
(c) **OSE holiday-session volume does not exist as a published figure** — JPX's trading-day rule folds
holiday sessions into the next business day's report, proven on the 202605 daily-report index, which
answers the sibling's named highest-value open item rather than filling it; (d) **trading through a
closure does not relocate price discovery into the cash open** — \|gap\| 0.748% (n=39) vs 0.769% (n=8),
**t = −0.110**, DiD **−0.078pp, t = −0.831**, and the relocation signature fires at 31% / 34% / 28%
across traded-through, pre-launch and ordinary sessions alike; (e) the auction null and the \|c2c\|
ladder **replicate**, and are credited to the siblings rather than claimed. Every statement here carries
the event's **`estimate`** label.

**Kill switches:**

- **The 2026-09-24 `^N225` overnight gap prints at or above 1.73%** — the traded-through arm's mean +
  2 sd (0.748% + 2×0.489%), a level **0 of its 39 observations** reached. Discovery really did relocate
  into the open and leg 4's null was underpowered. Registered as **FT-jpx-market-closure-2026-09-22-1**,
  score by 2026-09-25. *(Distinct from [`FT-jpx-market-closure-2026-09-21-1`](../forward-tests/jpx-market-closure-2026-09-21.md),
  which tests the same session's total \|c2c\| against 2.061%; this one tests where inside the bar the
  move lands, and the two can resolve independently.)*
- **JPX's 202609 daily-report index lists a `20260921`, `20260922` or `20260923` TradeDate** — holiday
  sessions would have their own trading day after all, leg 2 collapses, and the volume number becomes
  gettable. Registered as **FT-jpx-market-closure-2026-09-22-2**, score by 2026-09-26.
- **JPX republishes any of 2026-09-21/22/23 as `Not Open`** — the equity-index leg goes dark, leg 7's
  asymmetry disappears, and the GTC/GTD guard inverts back to "orders carry across".
- **The 2026-09-22 2-Year prints indirect share below 39.96%** — the weakest Japanese-holiday 2-Year in
  the 2016+ sample (2018-09-24) — with the 5-day dark run offered as the explanation. Leg 6 says the
  run length is untested at 5, so a print through that floor is the one reading that would make the
  blackout worth re-examining rather than dismissing.
- **A house playbook keyed to Japanese sessions or holiday-adjacent bars is written and back-tested**
  — leg 8 goes stale and the stand-aside is re-argued on measured data rather than on absence.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-15 | 7 | **Initial research.** Canonical `src/domain/market-events/jpx-market-closure-2026-09-22.json` written from the sole proposal (`.from-treasury-2y-note-2026-09-22`), now shadowed. The 09-21 sibling ledger landed hours earlier and refuted the "Tokyo dark" framing; **re-verified independently, not re-litigated** — JPX's holiday-trading table and its finalized xlsx (serial **46287 = 2026-09-22**, Name **"Holiday"**, Markets **`Open`**) both carry all three days `Open \| Finalized`. **Finding 1 (new) — the 09-22 clock:** `treasury-2y-note-2026-09-22` (`confirmed`, 1:00pm ET) prints **02:00 JST 09-23**, inside the 09-22 holiday **night** session (17:00–06:00 JST); index futures/options quotable across it, **JGB futures / interest-rate futures / securities options ineligible and dark**, cash equity shut. **Finding 2 (new, closes the 09-21 sibling's named highest-value open item) — OSE holiday-session volume is not published:** JPX's trading-day rule folds holiday sessions into the *following* business day, and the daily-report index for 202605 (`daily_report_202605.json`, new to this repo) carries **no `20260504`/`05`/`06` entry** — Golden Week volume sits inside `Daily_Report_OSE_20260507.zip` (4,318,153 B, 11 PDFs, downloaded). Nothing dated 09-21/22/23 will ever appear in JPX daily statistics. **Finding 3 (new) — discovery does NOT relocate into the cash open:** treatment-labelled on the exchange's own file, first `^N225` session back runs \|gap\| **0.748%** (n=39, traded through) vs **0.769%** (n=8, shut), **t=−0.110**; \|intraday\| 0.853% vs 0.769%, t=+0.292; **DiD vs pre-launch netting out ordinary sessions −0.078pp (t=−0.831)** gap, +0.049pp (t=+0.333) intraday — wrong sign both halves. The raw pre/post intraday rise (0.642%→0.715%, t=2.377) is an **era effect on ordinary sessions**, which is why the DiD frame is used. Relocation signature (\|gap\|≥2×\|intraday\|) fires **31% / 34% / 28%** across traded-through / pre-launch / ordinary. **Finding 4 (new) — the auction blackout arm does not cover this case:** longest Tokyo dark run around any of the 15 blackout auctions since 2016 is **4 days**; 09-22's is **5** (Sat 09-19 → Wed 09-23). **Finding 5 (new, taxonomy) —** classifying all 1,067 Cabinet Office holidays by mechanism gives **24 Rule 3(3) citizens' holidays since 1955**, 19 of them May 4 (1981–2006); **only 2009-09-22, 2015-09-22, 2026-09-22 in September**, and the last of any kind was **2019-05-02**, so this is the first in the holiday-trading era — "Holiday" is the only entry of that name among the file's 77. **Replications, credited not claimed:** auction null reproduces exactly (indirect 63.35% n=37 vs 61.88% n=1,072, **t=+0.855**; 2Y 55.22% n=9 vs 55.44% n=162, **t=−0.050**; 3+ dark block 60.57% n=15, t=−0.403); \|c2c\| ladder 1.021%/1.457%/2.061% (n=6,221/268/25) reproduces the 11-23 sibling to three decimals; `Not Open` vs `Open` \|c2c\| 1.503% (n=8) vs 1.404% (n=39) — same conclusion as 11-23 leg 4, smaller `Not Open` arm because this construction requires a finalized label on every closed weekday in the gap. Adjacency — peers: n/a (`symbols: []`); macro: **47** corridor entries incl. `boj-decision-2026-09-18`, `japan-cpi-2026-09-18`, `opex-2026-09-18` (the only *confirmed* high-impact one), the 2Y/5Y/7Y block 09-22→09-24; VIX **17.51** (`^VIX` close 2026-09-15; the 09-21 sibling logged 17.49 from an earlier same-day pull); geopolitical: `trump-xi-summit-2026-09-24`, `unga-81-general-debate-2026-09-22`, nothing dated to the closure; tape: `^N225` 63,492.99 (2026-09-14). Playbook grep `holiday\|jpx\|tokyo\|nikkei\|closure\|silver week\|equinox` → **0 hits in both**. **No proposal:** no untracked JPX holiday in corridor; 2027-09-20 (FY2027 BCP) stays banked out of corridor. Volume-bound extraction from the OSE report PDFs attempted and **abandoned rather than guessed** — recorded in honest limits. No fetch failed; `probe-ref.blocked` empty. | Initial stance set: **stand aside** (structural row only). Registers **FT-jpx-market-closure-2026-09-22-1** and **-2**. | 2026-09-23 (close-out window) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jpx-market-closure-2026-09-22.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
