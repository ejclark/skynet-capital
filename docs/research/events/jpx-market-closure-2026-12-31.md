# Tokyo markets closed — year-end Market Holiday; Japan fixed income fully shut while US bonds run a half session — jpx-market-closure-2026-12-31

**Kind:** sector · **Date:** 2026-12-31 (estimate — NEWS: JPX `jpx.co.jp/english/corporate/about-jpx/calendar/`, re-fetched 2026-09-05, corroborated by JPX's own derivatives holiday-trading page and by SIFMA's Japan panel; the `estimate` label is a taxonomy gap, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","china-retaliation-suspension-expiry-2026-12-31","fomc-minutes-2026-12-30","georgia-psc-data-center-cost-shift-2026-12-31","nerc-computational-load-standards-2026-12-31","sifma-bond-early-close-2026-12-31","sifma-japan-early-close-2026-12-28"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and this time Tokyo really is dark, which is the opposite of what the
sibling ledger would lead you to expect.** [`jpx-market-closure-2027-03-22`](jpx-market-closure-2027-03-22.md)
made a headline correction — Osaka Exchange runs a finalized derivatives holiday session through
Japanese national holidays, so "Tokyo is shut" is true only of the cash market. **That correction
does not generalize to this date.** JPX's own holiday-trading page lists `December 31 | Thu. |
New Year's Eve | **Not Open** | **Finalized**`, under a standing carve-out stated verbatim:
*"December 31 and January 2 will not be eligible for holiday trading for the time being."* The
year-end is the one recurring annual Tokyo blackout the 2022 holiday-trading reform deliberately
left alone — **99h15m fully dark** (05:30 JST 12-31 → 08:45 JST 01-04), roughly **2×** an ordinary
Tokyo weekend and the longest scheduled 2026–27 Tokyo blackout. **The second finding is a refusal,
and it corrects a sibling.** The reopening bar looks dramatic — first-session-of-year `|c2c|`
**1.711% vs 1.008%**, Welch **t = 3.70**, n=36 — but that is *arithmetic, not structure*: a
year-end break spans 2–4 unmatched US sessions instead of 1, and once matched on that count the
premium **vanishes** (t = **0.04 / 0.12 / 0.84** at 2 / 3 / 4 sessions). Applying the same control
to the 2027-03-22 sibling's leg 5 — after reproducing its numbers exactly — collapses its **+61%,
t = 4.24** to **t = 0.86**. Both of this repo's "holiday bars are wider" findings are one confound.
The 2026-27 turn is the *mildest* shape available (**2** unmatched US sessions, the floor of the
range). Nothing is tradeable: `estimate`, `symbols: []`, `impact: low`, and both house playbook docs
grep **0 hits** for `holiday|jpx|tokyo|nikkei|closure|year-end|new year`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a foreign-exchange closure 117 days out is not a position | High | D-117; `symbols: []`, `impact: low`, and `trade-playbooks.md` + `multi-symbol-sweep.md` grepped this session for `holiday\|jpx\|tokyo\|nikkei\|closure\|year-end\|new year` return **0 hits in both** | A house playbook keyed to Japanese sessions or holiday-adjacent bars being written and back-tested before **2026-12-31** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Bank the correction to the sibling, do not trade it** | High | The deliverable is written, not traded: the "first cash session after a JPX closure is materially wider" result in [`jpx-market-closure-2027-03-22`](jpx-market-closure-2027-03-22.md) leg 5 is **confounded by unmatched US-session count** — reproduced at 1.492%/0.928%/t=4.24, then t=**0.86** against a same-count control | Any figure in leg 5 or 6 failing to reproduce from Yahoo `^N225`/`^GSPC` daily bars on the stated definitions (unmatched US session = a `^GSPC` bar dated ≥ Tokyo's prior bar and < Tokyo's next) before **2026-10-05** |
| This month | **Watch the taxonomy, not the tape** — the date is not in doubt and still cannot be confirmed | Medium | Three independent primaries date it (JPX calendar 2026 panel, JPX holiday-trading table, SIFMA Japan `Bank Holiday`), and JPX's 2027 panel carries the identical `Dec. 31 (Fri.) Market Holiday`, so it recurs. It stays `estimate` only because `market-events-data.ts`'s prefix taxonomy has no slot for an exchange's own holiday calendar and this lane may not self-confirm an in-sweep discovery | An exchange-calendar prefix (`JPX:`/`NYSE:`-class) being added to the source taxonomy before **2026-10-05** — the entry promotes to `confirmed` and this call retires |
| This quarter | **Carry the blackout geometry forward, not a "wide reopening" expectation** | Medium | The corridor's live risk is timing, not size: **FOMC minutes land 14:00 ET Wed 12-30 = 04:00 JST Thu 12-31**, inside the last OSE night session by only **90–120 minutes**, after which Tokyo is dark 99h and the *cash* market cannot price them until **Mon 2027-01-04** | `^N225`'s 2027-01-04 session printing `\|close-to-close\|` **at or above 1.711%** (the unconditional first-session-of-year mean; 8 of 11 matched analogues printed below it) — the "it's just arithmetic, and this is the mild configuration" read takes its first out-of-sample miss. Registered as **FT-jpx-market-closure-2026-12-31-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2026-12-31. Tokyo is shut in every product, the
  date is `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Thu 2026-12-31, and this is the inverse of the 03-22 sibling):** there is **no
  OSE holiday session**. Index futures, index options, commodity futures, JGB futures, securities
  options — **all** unavailable, not merely the cash market (`estimate`; JPX holiday-trading page,
  `Not Open` / `Finalized`). A Japanese leg of any kind is absent for the whole session.
- **Execution guard (the dark window, dated to the hour):** Tokyo's last 2026 liquidity is the
  **Wed 2026-12-30 night session**, which the calendar page says runs to **05:30 JST Thu 12-31**
  (its own holiday-trading page says night sessions end 06:00 — the two JPX pages disagree and
  neither was resolved here; the earlier figure is used, making every window below a floor). Next
  Tokyo liquidity: **08:45 JST Mon 2027-01-04**. That is **99h15m**, against **51h15m** for an
  ordinary Tokyo weekend and **75h15m** for a BCP-closed Monday.
- **Execution guard (the FOMC-minutes squeeze, the corridor's one real timing risk):** the
  **confirmed** `fomc-minutes-2026-12-30` release at 14:00 ET Wed 12-30 = **04:00 JST Thu 12-31**
  falls *inside* the final OSE night session, leaving Nikkei futures **90 minutes** (120 at the
  06:00 reading) to price it before Tokyo goes dark for four days. The Tokyo **cash** market gets
  its first look at the December minutes on **Mon 2027-01-04**.
- **Do not expect a wide reopening bar from the closure itself.** Measured: the year-end premium is
  fully explained by unmatched US-session count, and the 2026-27 turn carries the **minimum 2**
  (US trades 12-30 and a full session 12-31; NYSE is shut 01-01; the US 01-04 open comes *after*
  Tokyo's). The 11 matched historical analogues ran `|c2c|` **1.449%**, up **6 of 11** — a coin flip.
- **There is no New Year seasonal to trade.** First session of the year: up **21 of 36 (58.3%)**
  against a 51.1% base rate, one-sided binomial **p = 0.243** — and the **last ten run 4/10** with a
  median of **−0.601%**. Not significant, and fading.
- **Attribution trap (Mon 2027-01-04):** the first Tokyo bar back has an FOMC-minutes explanation, a
  China-tariff-expiry explanation, a turn-of-year-flow explanation and a four-day-gap explanation
  before it has any single one. The measured result is a **variance** finding with no direction.
- **Watch (dated):** Fri **12-25** Tokyo CPI flash, JPX open but SIFMA Japan recommends fixed income
  closed · Mon **12-28** BoJ Summary of Opinions + US advance indicators, SIFMA Japan early close
  15:00 JST (*newly found, proposed this PR*) · Tue **12-29** · Wed **12-30** Tokyo's last 2026
  session; FOMC minutes 14:00 ET · Thu **12-31** Tokyo fully shut, US equities full session, US
  bonds 14:00 ET, China exclusion expiry · Fri **2027-01-01** all shut · reopen Mon **2027-01-04**.

## Initial research

### The question

This entry was discovered by the [`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md)
lane, which found it by parsing SIFMA's holiday schedule with correct region attribution and filed
it on one claim: 2026-12-31 is the date where SIFMA's three regions sit in three different states,
and **a Japan-duration leg is not shortened, it is unavailable all day.** Meanwhile a second sibling,
[`jpx-market-closure-2027-03-22`](jpx-market-closure-2027-03-22.md), had just corrected the repo's
whole mental model of a JPX closure: Tokyo is *not* dark on a Japanese holiday, because OSE runs a
finalized derivatives holiday session through it.

So the question is a collision between two siblings: **does the 03-22 correction apply here — and
if the closure really is total, is the reopening bar measurably different?**

**One-line verdict:** the correction **does not apply** — 2026-12-31 is one of the handful of dates
JPX explicitly excludes from holiday trading, so Tokyo is genuinely, totally dark for 99 hours —
**and the reopening bar is not special at all.** Its apparent widening is arithmetic (more missed US
sessions), and the same control demolishes the 03-22 sibling's own headline statistic.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
Nothing was taken on the discovering lane's word; all three primaries were re-fetched this session.

- **JPX** `jpx.co.jp/english/corporate/about-jpx/calendar/index.html` — HTTP 200, 33,103 bytes
  (page's own `Update : Feb. 06, 2026`). Both year panels re-parsed date-by-date, notes included.
- **JPX** `jpx.co.jp/english/derivatives/rules/holidaytrading/index.html` — HTTP 200, 48,483 bytes
  (page's own `Update : Jun. 26, 2026`). **The source of the headline find.** The 2026/2027
  eligible-holiday table (32 rows), all seven footnotes, and the eligible-product table read in full.
- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 298,926 bytes,
  re-parsed card-by-card (`h3` name / date / note) with region fixed to the page's own `U.S.` /
  `U.K.` / `Japan` `<h2>` headings. 35 cards in the Japan panel.
- **NYSE** `nyse.com/markets/hours-calendars` — HTTP 200 after its 302, 109,180 bytes. Re-verified
  independently rather than inherited.
- **Measured, not sourced:** Yahoo `^N225` daily bars — **9,000 sessions, 1990-01-04 → 2026-09-04**
  — and `^GSPC` — **9,237 sessions, 1990-01-02 → 2026-09-04** — via `scripts/research/market-data.mjs`.
  `^VIX`: 9,238 bars, close **14.53** on 2026-09-04. Every statistic below is computed in-session.
- **Definitions, stated so they can be refuted:** *first session of the year* = the first `^N225` bar
  whose year differs from the previous bar's (n=36, 1991–2026). *Unmatched US sessions* = `^GSPC`
  bars dated **≥ Tokyo's prior bar date and < Tokyo's next bar date** — Tokyo closes 15:00 JST =
  01:00 ET, before the same-dated US session opens, so a same-dated US bar is genuinely unseen.
  *Gap* = prior Tokyo close → Tokyo open; *c2c* = prior close → close.
- **Not fetched, so not asserted:** JPX's "List of Finalized Holiday Trading Days" file; CME/SGX
  Nikkei futures holiday hours (`cmegroup.com` has returned 403 to this runner across eight
  documented sibling attempts and was not re-tried); OSE holiday-session volume data; any JGB cash
  tape.
- **Re-grepped, not cited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`.

### Conviction legs, tested

1. **The date — SUPPORTED by three independent primaries, and it stays `estimate`.** JPX's 2026
   panel ends `Dec. 31 (Thu.)` / `Market Holiday`, immediately before the 2027 panel's
   `Jan. 1 (Fri.) New Year's Day`, `Jan. 2 (Sat.) Market Holiday`, `Jan. 3 (Sun.) Market Holiday`.
   JPX's *derivatives* page independently carries `December 31 | Thu. | New Year's Eve`. SIFMA's
   **Japan** panel carries the card `Bank Holiday` / `Thursday, December 31, 2026` with no
   early-close note — a full recommended fixed-income close. JPX's 2027 panel carries the identical
   `Dec. 31 (Fri.) Market Holiday`, so the year-end closure recurs annually. **Why it stays
   `estimate`:** `market-events-data.ts`'s prefix taxonomy has no slot for a securities exchange's
   own holiday calendar, and this lane may not self-confirm an in-sweep discovery. The label is
   about the taxonomy, not the evidence.

2. **The 2027-03-22 sibling's correction does NOT generalize — SUPPORTED, and this is the find.**
   JPX's holiday-trading table lists `December 31 | Thu. | New Year's Eve | **Not Open** |
   **Finalized**` for 2026, and `December 31 | Fri. | New Year's Eve | **Not Open** | Scheduled` for
   2027. Its footnote states the rule verbatim: *"December 31 and January 2 will not be eligible for
   holiday trading for the time being."* This is a **standing policy carve-out**, categorically
   different from the BCP-testing one-offs (2026-11-23, 2027-09-20) the sibling identified as the
   only mechanism that flips a day to `Not Open`. The page's general rule — *"In principle, all
   current non-business days (excluding Saturdays, Sundays, and January 1) will be eligible for
   holiday trading"* — makes Dec 31 and Jan 2 the **named exceptions to the reform itself**. Counted
   from the table: of 17 listed 2026 eligible-holiday rows, 14 are `Open`; the three `Not Open` are
   Jan 2, Nov 23 (BCP) and Dec 31. **So on this date "Tokyo is dark" is literally true**, in a way it
   was not on 2027-03-22.

3. **The blackout is total across products, and long — SUPPORTED, measured to the hour.** The
   eligible-products table (Index Futures, Index Options, Commodity Futures, Options on Commodity
   Futures eligible; JGB Futures, Options on JGB Futures, Interest Rate Futures, Securities Options
   ineligible) is **moot here**, because no holiday session runs at all. Combining with the calendar
   page's night-session note — *"The Night Session … is conducted after business hours on all
   business days until 5:30 a.m. the next day, including cases where the next day is … a day on
   which the market is closed. Conversely, there is no Night Session on non-business days"* — gives:

   | Scheduled Tokyo blackout | Window (JST) | Duration |
   |---|---|---|
   | **Year-end 2026→27** | 05:30 Thu 12-31 → 08:45 Mon 01-04 | **99h15m** |
   | BCP-closed Monday (2026-11-23) | 05:30 Sat 11-21 → 08:45 Tue 11-24 | 75h15m |
   | Golden Week 2027 (May 3/4/5 all `Open`) | 05:30 Sat 05-01 → 08:45 Mon 05-03 | 51h15m |
   | Ordinary weekend | 05:30 Sat → 08:45 Mon | 51h15m |

   The year-end break is the **longest scheduled Tokyo blackout of 2026–27, by ~1.3× over the next
   longest and ~1.9× over a normal weekend** — and it is the only long one that recurs every year.
   Post-2022 Golden Week no longer produces a long blackout at all, precisely because its holidays
   *are* eligible. **Honest caveat:** the two JPX pages disagree on the night-session end (05:30 on
   the calendar page, 06:00 on the holiday-trading page); the earlier figure is used throughout, so
   every duration above is a floor and the 06:00 reading shortens each by 30 minutes.

4. **The reopening bar IS wider, unconditionally — SUPPORTED, measured.** `^N225`, 1990-01-04 →
   2026-09-04:

   | Bucket | n | mean \|gap\| | mean \|open→close\| | mean \|close-to-close\| | signed c2c mean |
   |---|---|---|---|---|---|
   | **First session of the year** | **36** | **0.772%** (se 0.089) | **1.083%** | **1.711%** (se 0.190) | +0.367% |
   | Ordinary 1-day-gap session | 6,953 | 0.460% | 0.799% | 1.008% | +0.020% |
   | 3-day-gap (Monday) session | 1,613 | 0.506% | 0.889% | 1.173% | −0.054% |
   | Other ≥4-day breaks | 268 | 0.629% | 1.043% | 1.477% | +0.273% |

   `|c2c|` runs **+70%** over an ordinary session, **Welch t = 3.70**; `|gap|` **+68%, t = 3.50**.
   Note *where* it lands, which inverts the 03-22 sibling's split: there the extra move was intraday;
   here the **open** carries it (`|gap|` t = 3.50 vs `|open→close|` **t = 1.78**, not significant).
   With no futures session to price four days of news, the adjustment must arrive at the 08:45
   auction — which is exactly the mechanism leg 2 predicts.

5. **…but the widening is ARITHMETIC, not structure — NOT SUPPORTED as a holiday effect, and this
   is the decisive leg.** A year-end break spans 2–4 unmatched US sessions; an ordinary Tokyo
   session spans about one. Matching on that count:

   | Unmatched US sessions | First-of-year \|c2c\| | Ordinary \|c2c\| | Welch t |
   |---|---|---|---|
   | 2 | 1.449% (n=11) | 1.436% (n=346) | **0.04** |
   | 3 | 1.514% (n=14) | 1.466% (n=19) | **0.12** |
   | 4 | 2.222% (n=11) | 1.838% (n=21) | **0.84** |

   The t = 3.70 headline collapses to noise at every level. Corroborating: the correlation between
   the missed US move and Tokyo's reopening gap is **0.609 (R² = 0.371)** at year-end against
   **0.637 (R² = 0.406)** across all 8,673 ordinary sessions — the transmission is, if anything,
   *marginally worse* on ordinary days. OLS beta of the gap on the missed US return is **0.299**:
   Tokyo prices in ~30% of the accumulated US move at the open, and it does so at year-end exactly
   as it does any other day. **Losing four days of futures reference does not visibly degrade price
   discovery.** That is the honest, and mildly surprising, result.

6. **The same control demolishes the 03-22 sibling's leg 5 — SUPPORTED, after reproducing it
   exactly.** The sibling's headline was `|c2c|` **1.492% vs 0.928%, n = 151/1,169, t = 4.24** for a
   Tuesday after a Monday JPX closure. Re-running its stated definition on this session's data
   returns **1.492% / 0.928% / n = 151 / 1,169 / t = 4.24** — identical to three decimals, which is
   the credential for what follows. The confound: a holiday-Tuesday averages **2.00** unmatched US
   sessions against an ordinary Tuesday's **0.89**. Against *all other* sessions carrying the same
   2 unmatched sessions, the holiday-Tuesday bucket runs **1.492% vs 1.332%, Welch t = 0.86** —
   the +61% becomes +12% and not significant. **Both of this repo's "a bar after a JPX closure is
   wider" findings are one uncontrolled variable.** This ledger does not edit the sibling (rows are
   append-only and cross-lane edits never happen); it records the correction here and leaves the
   sibling's next pulse to adopt it.

7. **The 2026-27 turn is the MILDEST configuration available — SUPPORTED.** Tokyo's last 2026
   session is Wed 12-30. Unmatched US sessions before the Mon 01-04 Tokyo open: **12-30** and
   **12-31**. NYSE is shut Fri 01-01 (its holiday grid parses `New Year's Day` → `Thursday,
   January 1` / `Friday, January 1` / `—*` for 2026/2027/2028), and the US 01-04 open at 09:30 ET
   is 23:30 JST — *after* Tokyo has already opened. NYSE trades a **full** session 12-31: its
   payload contains **zero** occurrences of `December 31`, and its only 2026–28 early-close
   footnotes are the day after Thanksgiving (all three years), 2026-12-24 and 2028-07-03.
   **nUS = 2 is the floor of the 36-year range (2–4).** The 11 matched analogues (1993, 1995, 1999,
   2006, 2007, 2010, 2012, 2016, 2017, 2021, 2023) ran `|c2c|` **1.449%** (se 0.307), median 1.239%,
   signed mean **−0.089%**, **up 6 of 11**.

8. **There is no New Year seasonal — NOT SUPPORTED.** First session of the year, close-to-close: up
   **21 of 36 = 58.3%** against a **51.1%** `^N225` base rate, one-sided exact binomial
   **p = 0.243**; mean +0.367%, median +0.423%. It also fails the recency check that would matter
   most: **the last ten run 4/10 up with a −0.601% median.** The mirror-image slot is weakly
   negative — the *last* session of the year is up **14 of 36 (38.9%)**, one-sided p = 0.096 — which
   rhymes with, but does not confirm, [`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md)
   leg 4's US finding (11/33, p = 0.0132). Neither Japanese slot clears a bar worth acting on.

9. **The FOMC-minutes squeeze is real and dated — SUPPORTED.** `fomc-minutes-2026-12-30` is
   **confirmed** at 14:00 ET Wed 12-30 = **04:00 JST Thu 12-31**. The final OSE night session runs
   17:00 JST 12-30 → 05:30 JST 12-31, so Nikkei futures have **90 minutes** (120 at the page's other
   reading) of trading after the release, and then nothing for 99 hours. The Tokyo **cash** market
   sees the December minutes for the first time at the 08:45 JST **Mon 2027-01-04** auction. This is
   the corridor's one genuinely date-specific structural fact, and it is a *timing* observation, not
   a directional one.

10. **A dated adjacency found in-corridor and PROPOSED — SIFMA's Japan panel carries an early close
    on 2026-12-28.** Parsed card-by-card this session: `Boxing Day` /
    `Early Close Only (3:00 p.m. Japan Standard Time): Monday, December 28, 2026`. The discovering
    lane reported the Japan panel's *12-31* card but not this one. It lands **D-3**, on a date the
    calendar already tracks two events for (`boj-summary-of-opinions-2026-12-28` at 08:50 JST and
    `advance-economic-indicators-2026-12-28`) — so the BoJ Summary of Opinions prints into a Japanese
    fixed-income session that SIFMA recommends closing at 15:00 JST. Proposed as
    `src/domain/market-events/sifma-japan-early-close-2026-12-28.json` (`estimate`, `NEWS:`).

11. **SIFMA's Japan recommendations are not JPX's calendar — SUPPORTED, worth one line.** The Japan
    panel also carries `Christmas Day` / `Friday, December 25, 2026`, a date on which **JPX is
    open** (it is absent from both JPX panels) and on which this calendar already tracks
    `japan-cpi-tokyo-flash-2026-12-25`. SIFMA's regional panels are non-binding recommendations to
    its members' fixed-income desks; they are not exchange hours, and the two disagree on this date.
    Nothing is proposed off it — the divergence is recorded so a later lane does not read a SIFMA
    Japan card as a JPX closure.

12. **Nothing house-side is calendar- or Japan-keyed — SUPPORTED, re-verified not inherited.** A
    grep of `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|jpx|tokyo|nikkei|closure|year-end|new year` returns **zero hits in both**, run this
    session. No playbook can fire on this date in either direction.

### What plays the conditions support

None. Tokyo is shut in every product, `symbols` is empty, impact is `low`, and the date is
`estimate`. The supported outputs are the four execution guards in the signals list — the total
(not cash-only) blackout, the 99h15m window dated to the hour, the FOMC-minutes squeeze, and the
corrected reopening expectation — plus one proposed calendar entry and one cross-ledger correction.
Leg 4's widening is a **variance** result with no directional content whatsoever (signed c2c mean
+0.367% on a sample whose ordinary-session comparator is +0.020%, and 21/36 at p = 0.243 — noise).

### Honest limits

- **The 99h figure rests on an unreconciled source conflict.** JPX's calendar page says night
  sessions run to 05:30 JST; its holiday-trading page says 06:00. Neither was resolved and no third
  source was fetched. Every duration is quoted at the 05:30 reading, making it a floor.
- **Leg 5 is the load-bearing claim and its matched cells are small.** n = 11 / 14 / 11 for the
  first-of-year buckets. A null at t = 0.04 on n = 11 is *not* proof of no effect — it is failure to
  detect one, and the sample cannot rule out a widening smaller than roughly its own standard error
  (se 0.307 on the nUS=2 cell). The strong claim this ledger makes is narrower: **the published
  +70% and +61% headlines are not evidence of a holiday effect**, because a control that costs one
  line removes them both.
- **Leg 6 corrects a sibling from outside it.** The reproduction is exact, but the sibling's lane
  has not seen this argument and may have a defence; its next pulse owns the adjudication, not this
  ledger.
- **The 1990s dominate the `^N225` sample's volatility.** The series opens in the post-bubble crash
  and the ordinary-session `|c2c|` baseline (1.008%) is materially wider than the 2000-onward one
  the 03-22 sibling used (0.928%). Bucket *contrasts* are computed within one series, so this
  affects levels rather than the comparisons — but it is why the two ledgers' absolute numbers differ.
- **Tokyo holidays are inferred from missing bars**, not read off a JPX historical holiday list
  (which was not fetched). A data outage would be misread as a closure. This limit is inherited
  unchanged from the 03-22 sibling and remains a first-pulse item.
- **No CME/SGX leg.** Nikkei futures list offshore and would price 2026-12-31 regardless of OSE
  being shut, which would materially soften leg 3's "totally dark" framing **for a trader with
  offshore access**. Those calendars were not fetched (eight documented 403s across sibling lanes),
  so nothing is asserted — leg 3's claim is about *JPX venues* and is scoped to them.
- **No JGB cash tape was examined.** The rates-side claim is about exchange-listed products only.
- **Every corridor entry but `fomc-minutes-2026-12-30` is `estimate`,** including this one.
  Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05):** stand aside, permanently and structurally — this row exists to hold one
corrected framing, one cross-ledger correction, and four execution guards, not a view. Concretely:
(a) the [`jpx-market-closure-2027-03-22`](jpx-market-closure-2027-03-22.md) correction that "Tokyo
is never really dark" **does not apply here** — JPX's holiday-trading page carries
`December 31 | Not Open | Finalized` under the standing carve-out *"December 31 and January 2 will
not be eligible for holiday trading for the time being"*, making the year-end the one recurring
annual Tokyo blackout the 2022 reform deliberately excluded, at **99h15m**, roughly double an
ordinary weekend. (b) The reopening bar's apparent widening (`|c2c|` **1.711% vs 1.008%, t = 3.70**,
n = 36) is **arithmetic, not structure**: matched on unmatched-US-session count it vanishes
(**t = 0.04 / 0.12 / 0.84**), and the missed-move → gap transmission at year-end (R² 0.371, beta
0.299) is no worse than on an ordinary session. (c) **The same control collapses the 03-22 sibling's
leg 5** from **t = 4.24** to **t = 0.86**, after this session reproduced its numbers to three
decimals. (d) The 2026-27 turn is the **mildest** configuration on record (2 unmatched US sessions,
the floor of a 2–4 range; matched analogues 1.449%, up 6/11). (e) There is **no New Year seasonal**
(21/36, p = 0.243; last ten 4/10). (f) The corridor's one date-specific risk is *timing*: the
confirmed FOMC minutes land 90–120 minutes before Tokyo's last liquidity, and its cash market cannot
price them until **2027-01-04**. Every statement here carries the event's **`estimate`** label.

**Kill switches:**

- **JPX republishes 2026-12-31 as `Open` for holiday trading**, or drops the *"for the time being"*
  carve-out — legs 2 and 3 collapse, the blackout stops being total, and this ledger converges on
  the 03-22 sibling's framing after all. Registered as **FT-jpx-market-closure-2026-12-31-1**, score
  by 2026-12-30.
- **`^N225`'s 2027-01-04 session prints `|close-to-close|` at or above 1.711%** — the first
  out-of-sample observation against leg 5/7's "it is arithmetic, and this is the mild
  configuration" read. Eight of eleven matched analogues printed below it; one print is a tally row,
  never a settlement. Registered as **FT-jpx-market-closure-2026-12-31-2**, score by 2027-01-05.
- **The 03-22 sibling's lane rebuts leg 6** with a defence of its uncontrolled comparison — the
  cross-ledger correction is withdrawn and this ledger's leg 5 must be re-argued on its own sample
  alone.
- **JPX changes the date** under the Act on National Holidays, which its own note warns is possible,
  or moves the year-end closure — everything here re-dates.
- **NYSE adds an equity closure or early close on 2026-12-31** — leg 7's unmatched-session count
  drops from 2 toward 1, the "mildest configuration" call needs restating, and the US-vs-Japan
  asymmetry this entry's title asserts weakens.
- **`fomc-minutes-2026-12-30` is re-dated or its release time moves** — leg 9's 90-minute squeeze,
  the corridor's one genuinely date-specific fact, dissolves.
- **A holiday-, session-hours- or Japan-keyed house playbook is written and back-tested** — leg 12
  goes stale and the stand-aside must be re-argued on measured data rather than on absence.
- **A CME/SGX calendar becomes fetchable and shows offshore Nikkei futures trading 2026-12-31** —
  leg 3's "totally dark" framing is correct for JPX venues but misleading in practice, and the
  execution guards need an offshore-access caveat.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | 117 | **Initial research.** Date re-verified off **three** primaries: JPX 2026 panel `Dec. 31 (Thu.) Market Holiday` (HTTP 200, 33,103 B), JPX derivatives table `December 31 \| Thu. \| New Year's Eve`, SIFMA **Japan** card `Bank Holiday` / `Thursday, December 31, 2026` (HTTP 200, 298,926 B); stays `estimate` on the taxonomy gap alone. **Headline find — the 2027-03-22 sibling's correction does NOT generalize:** the holiday-trading page (HTTP 200, 48,483 B) lists 2026-12-31 **`Not Open` / `Finalized`** under the standing carve-out *"December 31 and January 2 will not be eligible for holiday trading for the time being"* — a policy exclusion, not a BCP one-off. Of 17 listed 2026 rows, 14 are `Open`. Tokyo is **totally** dark: **99h15m** (05:30 JST 12-31 → 08:45 JST 01-04) vs 75h15m for a BCP Monday and 51h15m for an ordinary weekend or Golden Week 2027 — the longest scheduled 2026-27 Tokyo blackout. **Measured (^N225 9,000 bars + ^GSPC 9,237 bars, 1990→2026):** first-session-of-year \|c2c\| **1.711%** vs ordinary **1.008%** (n=36, t=**3.70**), excess loading on the **open** (\|gap\| t=3.50) not intraday (t=1.78) — **but it is arithmetic**: matched on unmatched-US-session count the premium vanishes (t=**0.04/0.12/0.84** at 2/3/4), and missed-move→gap R²=0.371 / beta 0.299 is no better than the 0.406 all-session control. **Cross-ledger correction:** reproduced `jpx-market-closure-2027-03-22` leg 5 exactly (1.492%/0.928%/n=151/1,169/t=4.24), then the same control gives **t=0.86** — both "wider after a JPX closure" findings are one confound. **2026-27 is the mildest shape:** nUS=**2** (floor of a 2–4 range; NYSE full session 12-31, zero `December 31` strings in its payload, shut 01-01); 11 analogues ran 1.449%, up 6/11. **No New Year seasonal:** 21/36 up, p=0.243, last ten 4/10 (median −0.601%). **Timing find:** confirmed `fomc-minutes-2026-12-30` at 14:00 ET = 04:00 JST 12-31 sits **90–120 min** inside the last OSE night session; Tokyo cash prices it 2027-01-04. Adjacency — peers: n/a (`symbols: []`); macro: 12-28 BoJ Summary + US advance indicators, **12-30 FOMC minutes (confirmed)**; VIX **14.53** (^VIX close 2026-09-04); geopolitical: `china-retaliation-suspension-expiry-2026-12-31`, same date; tape: 7 tracked events in corridor, 5 on 12-31 itself. **Proposes `sifma-japan-early-close-2026-12-28.json`** (`estimate`) — SIFMA Japan card `Boxing Day` / `Early Close Only (3:00 p.m. JST): Monday, December 28, 2026`, missed by the discovering lane. Noted not proposed: SIFMA Japan recommends 12-25 closed while JPX trades. CME not re-attempted (8 prior 403s). Own entry's `notes` amended. | Initial stance set: **stand aside** (structural row only), correcting the 03-22 sibling in two directions — its "Tokyo is never dark" framing fails here, and its leg 5 statistic fails a one-line control. Registers **FT-jpx-market-closure-2026-12-31-1** and **-2**. | 2026-10-05 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
