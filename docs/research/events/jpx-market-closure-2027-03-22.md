# Tokyo markets closed — Vernal Equinox (Mar. 21) observed; the only March 2027 JPX holiday — jpx-market-closure-2027-03-22

**Kind:** sector · **Date:** 2027-03-22 (estimate — NEWS: JPX `jpx.co.jp/english/corporate/about-jpx/calendar/`, re-fetched 2026-09-05; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-2027-03-17","vix-expiration-2027-03-17","boj-decision-2027-03-18","japan-cpi-2027-03-19","opex-2027-03-19","boj-minutes-2027-03-24","sifma-bond-early-close-2027-03-25","good-friday-market-closure-2027-03-26","japan-cpi-tokyo-flash-2027-03-26"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and stop calling 2027-03-22 a dark day in Tokyo.** This entry was filed on
the framing that the Tokyo cash market shutting on Monday 03-22 leaves a three-day information gap
that the Tuesday 03-23 Nikkei bar has to absorb in one go. Two primary fetches and a 6,656-session
measurement this session split that in half. **The find:** JPX's own derivatives page lists
2027-03-22 as a **finalized "Open" holiday-trading day** — Osaka Exchange runs Nikkei 225 futures
and index options 08:45–15:45 JST plus a 17:00–06:00 night session while the cash market is shut,
a scheme live since 2022-09-23 that **no ledger in this repo has cited before**. So the gap is
*cash-only*, and a continuously-priced futures reference runs straight through it. **What survives:**
the cash bar really is wider — the first cash session after a Monday JPX holiday moves
**|close-to-close| 1.49% vs 0.93% on an ordinary Tuesday** (n=151 vs 1,169, Welch t = 4.24,
unchanged if the 2011 quake week is dropped). **What does not survive:** the amplification claim.
The 30 historical cases where the Friday before the Tokyo holiday was a US quarterly triple witching
average **1.11%** — *below* the 1.59% of the other 121 — which is the exact configuration
(opex-2027-03-19 → 03-22 closure) the seeding note leaned on. Nothing here is tradeable: the date is
`estimate`, `symbols: []`, `impact: low`, and a grep of both house playbook docs for
`holiday|jpx|tokyo|nikkei|closure|equinox` returns **0 hits in both**, run this session. The honest
output is one corrected framing, four execution guards, and two registered forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a foreign-exchange holiday 198 days out is not a position | High | D-198; `symbols: []`, `impact: low`, and 0 playbook hits for `holiday\|jpx\|tokyo\|nikkei\|closure\|equinox` across `trade-playbooks.md` + `multi-symbol-sweep.md`, re-grepped this session rather than inherited | A house playbook keyed to Japanese sessions or holiday-adjacent bars being written and back-tested before **2027-03-22** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Stand aside; correct the sibling framing, don't trade it** | High | The live calendar item this week is `fomc-blackout-start-2026-09-05`. The one thing worth doing now is written, not traded: `boj-minutes-2027-03-24`'s "Tokyo is shut, so 03-23 absorbs three days" is true of cash and false of derivatives | JPX republishing 2027-03-22 as **"Not Open"** for holiday trading (the treatment 2026-11-23 and 2027-09-20 already got for BCP testing), observed before **2027-03-19** — Tokyo really is dark and the original framing was right. Registered as **FT-jpx-market-closure-2027-03-22-2** |
| This month | **Watch the taxonomy, not the tape** — the date is not in doubt and still cannot be confirmed | Medium | JPX's holiday panel and its separate derivatives holiday-trading page both date it independently, and the substitution rule (Vernal Equinox falls Sunday 03-21 → observed Monday) is stated verbatim on the page. It stays `estimate` only because `market-events-data.ts`'s prefix taxonomy has no slot for a securities exchange's own calendar and this lane may not self-confirm an in-sweep discovery | An exchange-calendar prefix (`JPX:`/`NYSE:`-class) being added to the source taxonomy before **2026-10-05** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Carry the cross-asset asymmetry forward, not the "dark Tokyo" story** | Medium | On 2027-03-22 index futures and options trade; **JGB futures, options on JGB futures, interest-rate futures and securities options are ineligible** — so in a corridor bracketed by a BoJ decision (03-18) and BoJ Minutes (03-24), the rates leg is the one Tokyo instrument actually shut | The first cash session back (**2027-03-23**) printing |close-to-close| **below 0.881%** — the post-launch ordinary-Tuesday baseline — which is what "holiday trading has absorbed the gap" would look like. Registered as **FT-jpx-market-closure-2027-03-22-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-03-22. The Tokyo cash market is shut, the
  date is `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Mon 2027-03-22, cross-asset):** OSE index futures/options trade 08:45–15:45 and
  17:00–06:00 JST (`estimate`; JPX holiday-trading page, "Finalized"). **JGB futures, options on JGB
  futures, interest-rate futures and securities options do not.** A Japanese equity-vs-rates spread
  loses one leg for the day; a Nikkei-only position does not.
- **Execution guard (order handling):** JPX states that on a holiday-trading day, **GTC/GTD orders
  expire between the end of holiday trading and the open of the next business day's day session —
  "regardless of whether the products are eligible"**, and immediately before the holiday open if a
  broker does not support holiday trading. Resting Japanese orders across 2027-03-22 should be
  assumed cancelled, not carried.
- **Execution guard (price limits):** the reference price for Tue 2027-03-23's day session is the
  **night session of Fri 2027-03-19**, not the holiday session — limits are not updated during
  holiday trading, and a static-circuit-breaker expansion triggered on 03-19 night or 03-22 carries
  through to 03-23. Dynamic-circuit-breaker halts run **60 s on a holiday vs 30 s on a weekday**.
- **Attribution trap (Tue 2027-03-23):** the first cash bar back has an FOMC-03-17 explanation, a
  triple-witching-03-19 explanation, a Japan-CPI-03-19 explanation, a BoJ-decision-03-18 explanation
  and a three-day-weekend explanation before it has any single one. The measured widening is a
  **variance** result, not a direction; never let a post-hoc read promote a hypothesis.
- **The corrected count, to stop it being re-derived wrong:** 2027-03-22 is the only March 2027 JPX
  closure. Tokyo trades **every other March session, including Good Friday 2027-03-26 and Monday
  2027-03-29**, while the NYSE is shut on 03-26 — the four-day US Easter gap is American only.

## Initial research

### The question

`jpx-market-closure-2027-03-22` was filed during the `boj-minutes-2027-03-24` adjacency sweep on a
specific structural claim: because Tokyo is shut Monday 03-22, its week starts Tuesday 03-23, so
"the 03-23 Nikkei bar absorbs a three-day gap of US news — the 2027-03-17 FOMC aftermath and the
2027-03-19 quarterly triple witching — while Wednesday 03-24, the BoJ Minutes session, is an
ordinary second session with nothing Japanese ahead of it." Is Tokyo actually dark on 03-22, and is
the absorbed bar measurably different?

**One-line verdict:** **half the framing is wrong and the half that survives is smaller than
claimed.** Tokyo is not dark — Osaka Exchange runs a finalized derivatives holiday-trading session
on 2027-03-22, so Nikkei 225 futures and index options price the US weekend continuously while the
cash market is shut. The cash bar's widening is real and statistically solid (|c2c| 1.49% vs 0.93%,
t = 4.24), but it is **not** amplified by a preceding triple witching — that 30-case subset runs
*below* the rest of the bucket.

### Method

Macro/market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. This session did not take the seeding note on faith:

- **JPX** `jpx.co.jp/english/corporate/about-jpx/calendar/index.html` (HTTP 200, 33,103 bytes,
  page's own `Update : Feb. 06, 2026`) — the 2027 panel re-parsed date-by-date, footnotes included.
- **JPX** `jpx.co.jp/english/derivatives/rules/holidaytrading/index.html` (HTTP 200, 48,483 bytes,
  page's own `Update : Jun. 26, 2026`) — **the source of the headline find; new to this repo.** The
  2026/2027 eligible-holiday table, the eligible-product table, and the trading-rules section were
  read in full.
- **Yahoo Finance** `^N225` daily bars — **6,656 sessions, 2000-01-04 → 2026-09-04**, exchange
  timezone `Asia/Tokyo`. Tokyo holidays were identified by **missing weekday bars** (a Tuesday whose
  previous bar is four calendar days earlier = a Monday closure), the same absence technique
  `juneteenth-market-closure-2027-06-18` used on `^GSPC`. All statistics below are computed from
  this series in-session, not quoted.
- **Yahoo Finance** `^VIX` — regime reading for the probe reference (close 14.53, 2026-09-04).
- **Grepped, not assumed:** `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`
  for `holiday|jpx|tokyo|nikkei|closure|equinox` — **0 hits in both**.
- **Not fetched, so not asserted:** JPX's "List of Finalized Holiday Trading Days" file, CME/SGX
  Nikkei futures holiday hours, and any OSE holiday-session volume data.

### Conviction legs, tested

1. **The date and its mechanism — SUPPORTED (and still `estimate`).** The 2027 panel lists, in
   order, `Mar. 21 (Sun.) Vernal Equinox` and `Mar. 22 (Mon.) Vernal Equinox (Mar. 21) observed`,
   and its footnote states the rule verbatim: *"National holidays that fall on a Sunday are observed
   on the closest following day that is not a national holiday."* March 22 is the only March 2027
   trading-day closure. **Why this stays `estimate`:** the prefix taxonomy in `market-events-data.ts`
   (`IR:`/`CAL:`/`BLS:`/`FED:`/`PJM:`/`SEC:`/`TSY:`/`OCC:`/`BEA:`/`CENSUS:`/`ISM:`/`CB:`/`UMICH:`)
   has no slot for an exchange holiday calendar, and this lane may not self-confirm an in-sweep
   discovery. The label is about the taxonomy, not the evidence — and since every honest call here
   is a stand-aside, it costs nothing.

2. **Tokyo derivatives TRADE on 2027-03-22 — SUPPORTED, and this is the find.** JPX's holiday-trading
   page states that *"Osaka Exchange, Inc. (OSE) and Tokyo Commodity Exchange, Inc. (TOCOM) launched
   holiday trading in our derivatives market on September 23, 2022 (Autumnal Equinox Day)… Derivatives
   products such as Nikkei 225 Futures and Platts Dubai crude oil Futures can be traded on holidays."*
   Its eligible-holidays table carries the row `March 22 | Mon. | Substitute Holiday of Vernal Equinox
   Day | Open | **Finalized**` — finalized, not merely scheduled, consistent with the page's own rule
   that the following year's first half is finalized each June (page updated 2026-06-26). **The
   seeding note's "Tokyo is shut" premise is therefore true of the cash market and false of the
   derivatives market**, and no prior ledger in this repo records the distinction.

3. **The closure is a rates-side blackout, not an equity-side one — SUPPORTED.** JPX's
   eligible-products table is explicit: **eligible** = Index Futures, Index Options, Commodity
   Futures, Options on Commodity Futures; **ineligible** = JGB Futures, Options on JGB Futures,
   Interest Rate Futures, Securities Options. In a corridor bracketed by `boj-decision-2027-03-18`
   and `boj-minutes-2027-03-24`, the one Tokyo instrument that actually goes dark on 03-22 is the
   JGB complex — the *inverse* of the sibling `good-friday-market-closure-2027-03-26` asymmetry,
   where equities run a full session against a bond tape that shuts early.

4. **03-22 is not a separate trading day — SUPPORTED, and it has four concrete consequences.** JPX
   states verbatim that *"the trading day of holiday trading shall be the same as that of the night
   session which begins on the weekday preceding the holiday trading day … and the day session which
   begins from the weekday following the holiday trading day."* For 2027 that welds **Fri 03-19's
   night session + Mon 03-22's holiday session + Tue 03-23's day session into one trading day.**
   Hence: (a) the price-limit reference for Tue 03-23's day session is Fri 03-19's *night* session,
   and limits are not updated during holiday trading; (b) an SCB-expanded limit from 03-19 night or
   03-22 persists into 03-23; (c) DCB halts run 60 s instead of 30 s; (d) GTC/GTD orders expire
   between the end of holiday trading and the 03-23 open **"regardless of whether the products are
   eligible"** — and immediately before the holiday open at a broker that does not support it.
   JPX's own rule also guarantees no expiry collision: *"Holiday trading days will not fall on the
   trade-starting day, the last trading day or the SQ day of each contract month."* (This ledger
   states that rule; it does **not** assert the March 2027 Nikkei SQ date, which was not fetched.)

5. **The first cash session back really is wider — SUPPORTED, measured.** Across 2000-01-04 →
   2026-09-04, the Tuesday cash session following a Monday JPX closure vs the two natural controls:

   | Bucket | n | mean \|gap\| (open vs prior close) | mean \|open→close\| | mean \|close-to-close\| |
   |---|---|---|---|---|
   | **Tue after a Monday JPX holiday** | **151** | **0.731%** | **0.983%** | **1.492%** |
   | Ordinary Monday (3-day weekend) | 1,153 | 0.634% | 0.777% | 1.136% |
   | Ordinary Tuesday (1-day gap) | 1,169 | 0.533% | 0.723% | 0.928% |

   Holiday-Tuesday vs ordinary-Tuesday |c2c|: **1.492% (se 0.130) vs 0.928% (se 0.029), Welch
   t = 4.24** — a +61% widening that is not an artifact of one week (dropping the post-Tōhoku
   2011-03-22 bar, +4.36%, moves the bucket mean only to **1.473%**). Note *where* the extra move
   lands: the overnight gap widens by only ~15% over an ordinary Monday (0.731 vs 0.634) while the
   intraday leg widens ~26% (0.983 vs 0.777). **The absorbed news is traded through the session, not
   gapped in at the open** — which matters for anyone who imagined the whole adjustment printing at
   09:00 JST.

6. **"…and a triple witching makes it worse" — NOT SUPPORTED; the point estimate runs the other
   way.** Of the 151 holiday Tuesdays, **30** follow a Friday that was a US quarterly triple witching
   (third Friday of March/June/September/December) — the precise 2027 configuration
   (`opex-2027-03-19` → 03-22 closure). Their mean |c2c| is **1.109% (se 0.218)** against **1.586%
   (se 0.152)** for the other 121, a Welch t of **1.79** in the *opposite* direction to the seeding
   thesis. That is not significant either, so the honest reading is: **the witching subset is at
   worst indistinguishable from the rest of the bucket and shows no sign of amplification.** The
   seeding note stacked "three-day gap" and "triple witching" as if they compounded; the tape does
   not show it.

7. **Holiday trading has NOT compressed the cash gap — NOT SUPPORTED, and underpowered by
   construction.** Splitting the holiday-Tuesday bucket at the 2022-09-23 launch:

   | Period | n | mean \|gap\| | mean \|close-to-close\| |
   |---|---|---|---|
   | Pre-launch (2000 → 2022-09) | 126 | 0.722% (se 0.046) | 1.495% (se 0.150) |
   | Post-launch (2022-09 → 2026-09) | 25 | 0.774% (se 0.090) | 1.474% (se 0.212) |
   | *Control:* ordinary Tuesdays, post-launch only | 170 | 0.529% (se 0.031) | 0.881% (se 0.089) |

   Four years of OSE holiday sessions have moved neither number, and the holiday premium against a
   contemporaneous control is **1.474% vs 0.881% (+67%)** — as large as ever. The plain reading is
   that a thin holiday futures session does not clear the cash market's information backlog. **The
   honest caveat is n = 25** and roughly ten eligible Monday holidays a year, so this will stay
   underpowered for years; it is registered as a forward test rather than claimed as a result.

8. **The Good Friday asymmetry, corroborated from this source — SUPPORTED.** Japan observes no
   Easter holiday, and the 2027 panel confirms it: after 03-22 the next JPX closure is
   **Apr. 29 (Showa Day)**. Tokyo trades 2027-03-26 and 2027-03-29 as ordinary sessions while the
   NYSE is shut 03-26. This reproduces, from the same primary,
   `boj-summary-of-opinions-2027-03-29`'s finding that the Easter-week gap is American only.

9. **Nothing house-side is calendar- or Japan-keyed — SUPPORTED, re-verified not inherited.** A grep
   of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
   `holiday|jpx|tokyo|nikkei|closure|equinox` returns **zero hits in both files**, run this session.
   No playbook can fire on this date in either direction.

10. **A dated non-corridor discovery, deliberately NOT proposed.** The same JPX page states verbatim
    that *"Markets will not be opened on September 20, 2027 (Respect for the Aged Day) due to a JPX
    Group-wide BCP testing (disaster recovery testing) of FY 2027 which is planned to be implemented
    for September 18 through 20"* — i.e. **2027-09-20 is the one 2027 national holiday where even
    the derivatives market stays shut**, a genuinely different animal from this event. It sits six
    months outside this event's five-day corridor, so it is banked here and left for the lane whose
    corridor it is in, exactly as `vix-expiration-2027-03-17` left Juneteenth unproposed.

### What plays the conditions support

None. The Tokyo cash market is shut, `symbols` is empty, impact is `low`, and the date is `estimate`.
The supported outputs are the four execution guards and the corrected count already in the signals
list, plus one attribution warning: leg 5's result is a **variance** finding with no directional
content whatsoever (the holiday-Tuesday *signed* mean is +0.380% against +0.011% on an ordinary
Tuesday, on sd 2.15 — noise, and nothing anyone should size to).

### Honest limits

- **The holiday-classification is inferred, not sourced.** Tokyo closures were detected as missing
  weekday bars in a Yahoo `^N225` series, not read off a JPX historical holiday list. A stray data
  outage would be misread as a holiday. JPX publishes a "List of Finalized Holiday Trading Days"
  file that was **not** fetched this session — a first-pulse item that would let the buckets be
  rebuilt on the exchange's own dates.
- **The existence of the OSE holiday session is sourced; its liquidity is not.** This ledger claims
  Nikkei futures *trade* on 2027-03-22 and makes no claim at all about depth, spread or volume.
  "Thin holiday session" is a widely-repeated belief with no source fetched here, so it is left
  unstated rather than asserted — and it is the obvious mechanism for leg 7, untested.
- **Leg 7 is n = 25 and will stay small.** It is registered as a forward test precisely because a
  single 2027-03-23 observation cannot settle it either; one print is a tally row, not a promotion.
- **No CME/SGX leg.** Nikkei futures also list offshore, which would price 2027-03-22 regardless of
  OSE. Those calendars were not fetched (the sibling Good Friday ledger hit HTTP 403 twice on CME),
  so nothing is asserted about them — the OSE finding stands on its own and does not need them.
- **All ten of the corridor's calendar entries but one are `estimate`,** including this one
  (`vix-expiration-2027-03-17` is the exception). Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally — this row exists to hold a
corrected framing and four execution guards, not a view. Concretely: (a) the premise this entry was
seeded on, that Tokyo goes dark for three days, is **true of the cash market and false of the
derivatives market** — OSE's finalized holiday-trading session on 2027-03-22 prices Nikkei index
futures and options straight through the closure, while **JGB futures, interest-rate futures and
securities options are ineligible**, making 03-22 a rates-side blackout inside a BoJ-bracketed
corridor. (b) The cash-side widening is real and measured (**|c2c| 1.492% vs 0.928%, n = 151,
t = 4.24**) but carries **no directional content** and shows **no amplification** from the preceding
triple witching (the 30-case subset runs at 1.109%, below the other 121's 1.586%). (c) Four years of
holiday trading have not narrowed that gap (post-launch 1.474% vs a 0.881% contemporaneous control),
which is the open question this ledger registers rather than answers. Every statement here carries
the event's **`estimate`** label.

**Kill switches:**

- **JPX republishes 2027-03-22 as "Not Open" for holiday trading** — the treatment 2026-11-23 and
  2027-09-20 already received for BCP testing. Legs 2, 3 and 4 collapse and the seeding note's
  original framing is reinstated. Registered as **FT-jpx-market-closure-2027-03-22-2**, score by
  2027-03-19.
- **The 2027-03-23 cash session prints |close-to-close| below 0.881%** (the post-launch
  ordinary-Tuesday baseline) — one observation against leg 7, in the direction that holiday trading
  does clear the backlog. Registered as **FT-jpx-market-closure-2027-03-22-1**, score by 2027-03-24.
- **JPX changes the observed date** under the Act on National Holidays, which its own note warns is
  possible — everything here re-dates.
- **A house playbook keyed to Japanese sessions or holiday-adjacent bars is written and
  back-tested** — leg 9 goes stale and the stand-aside is re-argued on measured data rather than on
  absence.
- **JPX's finalized-holiday-trading list, fetched, contradicts the missing-bar holiday
  classification** — the leg 5/6/7 buckets are rebuilt on exchange dates and every number above is
  re-derived.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 198 | **Initial research.** Date + substitution rule re-verified verbatim off JPX's 2027 panel (HTTP 200, 33,103 B); stays `estimate` on the taxonomy gap alone. **Headline find, new to this repo:** JPX's derivatives holiday-trading page (HTTP 200, 48,483 B) lists 2027-03-22 `Open`/**Finalized** — OSE trades Nikkei index futures/options 08:45–15:45 + 17:00–06:00 JST while cash is shut, so the seeding note's "three-day dark gap" is **cash-only**. **Ineligible:** JGB futures, options on JGB futures, interest-rate futures, securities options — 03-22 is a rates-side blackout inside a BoJ-bracketed corridor. 03-22 shares one trading day with Fri 03-19 night + Tue 03-23 day: 03-23's price-limit reference is 03-19's night session, DCB halts 60 s not 30 s, GTC/GTD orders expire before the 03-23 open for all products. **Measured (^N225, 6,656 bars, 2000→2026):** holiday-Tue \|c2c\| **1.492%** vs ordinary-Tue **0.928%** (n=151/1,169, t=4.24; 1.473% ex-2011 quake week) — but the 30 triple-witching-preceded cases run **1.109%** vs the other 121's **1.586%**, so **no amplification**. Post-2022 launch: **no narrowing** (1.474%, n=25, vs 0.881% control). Adjacency — peers: n/a (`symbols: []`); macro: corridor holds FOMC 03-17, BoJ 03-18, Japan CPI + triple witching 03-19, BoJ Minutes 03-24; VIX **14.53** (close 2026-09-04); geopolitical: none dated to this corridor; tape: Tokyo trades Good Friday 03-26 and 03-29 (next JPX closure is Apr. 29), corroborating `boj-summary-of-opinions-2027-03-29`. Banked but **not proposed** (six months out of corridor): 2027-09-20 is closed to derivatives too, for JPX BCP testing. No new calendar file; own entry's `notes` amended. | Initial stance set: **stand aside** (structural row only). Registers **FT-jpx-market-closure-2027-03-22-1** and **-2**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
