# SIFMA-recommended 3:00 p.m. JST early close — a UK Boxing Day substitute reaching Tokyo's USD bond desks, while JGBs and JPX run normal hours — sifma-japan-early-close-2026-12-28

**Kind:** rates · **Date:** 2026-12-28 (estimate — NEWS: SIFMA `sifma.org/resources/guides-playbooks/holiday-schedule` Japan Holiday Recommendations panel, re-fetched and re-parsed 2026-09-05; the causing UK bank holiday independently corroborated from `gov.uk/bank-holidays.json`. The `estimate` label is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-minutes-2026-12-23","durable-goods-2026-12-23","gdp-q3-2026-third-2026-12-23","pce-2026-12-23","christmas-eve-half-day-2026-12-24","japan-cpi-tokyo-flash-2026-12-25","advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","fomc-minutes-2026-12-30","china-retaliation-suspension-expiry-2026-12-31","georgia-psc-data-center-cost-shift-2026-12-31","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","sifma-bond-early-close-2026-12-31"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and the first thing to fix is this entry's own name.** SIFMA's page states
its scope verbatim: *"All SIFMA holiday recommendations apply to the trading of **U.S.
dollar-denominated** government securities, mortgage- and asset-backed securities, over-the-counter
investment-grade and high-yield corporate bonds, municipal bonds and secondary money market
trading…"* — so the "Japan" panel is a **time zone, not an asset class**. This is the Tokyo session of
the **USD** bond market closing early; **JGBs are not in scope and JPX is untouched.** That kills the
calendar note's framing that the 08:50 JST BoJ Summary of Opinions gets *"roughly a half session for
the reaction"*: JPX's own hours page puts the **OSE JGB futures day session at 08:45–15:02 with a
night session 15:30–05:55** — the reaction venue runs its full normal day *and* 14½ more hours, and
15:00 JST is where the JGB futures day session already ends. **The name mismatch is also solved, and
it is a rule rather than an error.** All three 2026 Japan-panel early closes — Easter Monday 04-06,
Summer Bank Holiday 08-31, Boxing Day 12-28 — are **UK-only bank holidays**, and the 2027 panel
repeats it (03-29, 08-30). SIFMA files the Tokyo card under the *foreign* holiday that causes it: a
US holiday shuts Tokyo's USD desk **fully**, a UK-only one **half**. So 12-28 is the exact mirror of
[`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md) three days later — there
**US early · Japan shut · UK normal**, here **UK shut · Japan early · US normal**. **Measured, and the
answer is a null.** Tokyo sessions with London shut (n=244, `^FTSE` gap detector validated 51/51
against gov.uk) run `|c2c|` **0.964% vs 1.008%** ordinary — **Welch t = −0.78**; on the exact 12-28
shape (NY also open) **0.997%, t = −0.16**. Nothing is tradeable: `estimate`, `symbols: []`,
`impact: low`, both playbook docs grep **0 hits** on `holiday|jpx|tokyo|nikkei|closure|jgb|gilt|sifma|boxing`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a non-binding early-close recommendation in a foreign time zone is not a position | High | D-114; `symbols: []`, `impact: low`, and `trade-playbooks.md` + `multi-symbol-sweep.md` grepped this session for `holiday\|jpx\|tokyo\|nikkei\|closure\|year-end\|jgb\|gilt\|sifma\|boxing` return **0 hits in both**; `earnings-calendar.ts` carries **no print after 2026-11-10** | A house playbook keyed to session hours, foreign holidays or fixed income being written and back-tested before **2026-12-28** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Bank the scope correction, and amend this entry's own title and note** | High | SIFMA's scope line is verbatim **"U.S. dollar-denominated"**; JPX's hours page puts JGB futures at 08:45–15:02 + a 15:30–05:55 night session and its calendar lists **no December 2026 closure but 12-31** — so no Japanese instrument is shortened and the note's "shortened Tokyo bond session" reading is wrong | SIFMA publishing a Japan-panel scope statement that names **yen-denominated** instruments, or JPX announcing an early close for 2026-12-28, before **2026-10-05** — the correction is withdrawn |
| This month | **Watch whether the recommendation survives at all — the 2027 card already says `None`** | Medium | SIFMA's **2027** Japan panel carries `Boxing Day` / **`None`**, and its 2027 UK panel does too, while gov.uk lists **2027-12-28** as a Boxing Day substitute. The 2026 card is not marked tentative and every 2027 Japan card is — but a `None` precedent for this exact holiday exists one year out | The 2026-12-28 card being removed, re-dated, or changed to `None` on a re-fetch by **2026-12-24** — registered as **FT-sifma-japan-early-close-2026-12-28-3** |
| This quarter | **Expect a dampened Tokyo bar, not an amplified one — and treat that as a measurement, not an edge** | Medium | London-shut Mondays run `\|c2c\|` **0.972%** against a month-matched London-open Monday control of **1.195%** (n=148 vs 901, **Welch t = −2.81**, holding at −2.84 on 2000+ only). A foreign-desk closure **thins** Tokyo; it does not amplify it | The **2026-12-28** `^N225` close-to-close `\|move\|` printing **at or above 1.185%** (the Nikkei's unconditional Monday mean) — 6 of the 10 Dec-28 analogues came in below it. Registered as **FT-sifma-japan-early-close-2026-12-28-2** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-12-28. `impact: low`, `symbols: []`,
  date `estimate`, source non-binding by its own terms, and date-keyed action requires `confirmed`.
- **The scope guard, and it is the whole point of this row.** SIFMA's recommendations cover
  **USD-denominated** paper. A 15:00 JST early close is the **Tokyo session of the US dollar bond
  market** going home early — **not** the JGB market, which SIFMA has no writ over. Anyone reading
  this entry as "Japan's bond market half-closes" has the asset class wrong.
- **Execution guard — the reaction venue is NOT shortened (`estimate`).** JPX's own hours page:
  OSE **JGB futures** run Zaraba **08:45–11:00** and **12:30–15:00**, closing auction **15:02**, then
  a **night session 15:30–05:55** with a 06:00 closing auction. TSE cash equities run their ordinary
  session. **15:00 JST is where the JGB futures day session already ends** — the recommendation's
  clock and the exchange's clock coincide, so nothing listed loses a minute.
- **The three-region state on 2026-12-28, parsed card-by-card:** **UK fully shut** (UK panel,
  `Boxing Day (Substitute)` / `Monday, December 28, 2026`, no early-close note) · **Japan early close
  15:00 JST** · **US a full session** (the US panel has no 12-28 card; its December entries are the
  12-24 early close, 12-25 closure and 12-31 early close). Exactly inverted from
  [`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md)'s triple three days later.
- **The rule that explains the "Boxing Day" name — 3 of 3 in 2026, 2 of 2 in 2027.** Every Japan-panel
  `Early Close Only (3:00 p.m. Japan Standard Time)` card is a **UK-only** bank holiday: 2026-04-06
  Easter Monday, 2026-08-31 Summer Bank Holiday, 2026-12-28 Boxing Day; 2027-03-29 and 2027-08-30 the
  same two. The two UK-only holidays that get *no* Japan card (2026-05-04 May Day, 2026-05-25 Spring
  Bank Holiday) are exactly the two where Tokyo is **already fully closed** — Greenery Day and US
  Memorial Day. **US holidays shut the Tokyo USD desk fully; UK-only holidays halve it.**
- **The measured null, stated as a null.** London-shut Tokyo sessions: `|c2c|` **0.964%** (n=244, se
  0.056) vs **1.008%** ordinary 1-day-gap, **t = −0.78**. Restricted to the 12-28 shape — London shut,
  New York open — **0.997%** (n=140), **t = −0.16**. **A London closure leaves no magnitude footprint
  on the Tokyo tape.**
- **The one apparent directional finding, and the control that removes it.** London-shut sessions
  closed **up 142 of 244 (58.2%)** against a 51.2% base rate, one-sided **p = 0.0163** — but **148 of
  the 244 are Mondays**. Against the Nikkei's own Monday population (50.6% up) the tilt falls to
  **56.1%, p = 0.105**. Not significant; do not carry it.
- **The exact analogue set, and it points the other way at n=10.** The ten Dec-28 sessions where
  Tokyo traded and London was shut (1992, 1993, 1998, 1999, 2004, 2009, 2010, 2015, 2020, 2021) ran
  `|c2c|` **1.102%** (se 0.179), up **7 of 10**, signed **+0.431%** — **wider** than the Dec 26-31
  dead week's 0.776%, but at **t = 1.71** it does not clear, and it contradicts the pooled dampening
  result. **Two cuts pointing opposite ways at these n is what noise looks like.**
- **The single most on-point observation is 2020-12-28, and it was quiet.** Monday, UK Boxing Day
  substitute (gov.uk, *"Substitute day"*), London shut, New York open, Tokyo open, dead week — **and a
  BoJ Summary of Opinions published that morning**. Nikkei **+0.741%** close-to-close, gap +0.130%,
  below its own all-session mean. Every structural feature of 2026-12-28 in one bar. n=1, said as n=1.
- **2026-12-28 is not a holiday in Japan by any measure.** The Cabinet Office's own
  `syukujitsu.csv` lists **zero national holidays in December 2026** (18 in the year; Emperor's
  Birthday sits at 02-23), and JPX's calendar lists **`Dec. 31 (Thu.) Market Holiday`** as the only
  December closure. Tokyo trades an ordinary full session.
- **Attribution trap (Mon 2026-12-28).** The Tokyo bar has a BoJ Summary of Opinions explanation
  ([`boj-summary-of-opinions-2026-12-28`](boj-summary-of-opinions-2026-12-28.md), 08:50 JST) and a
  year-end-flow explanation before it has anything to do with a bond desk's staffing; the US session
  carries the Advance Economic Indicators Report and a three-session Christmas backlog. **Nothing on
  this date should ever be credited to a SIFMA recommendation.**
- **Watch (dated):** Wed **12-23** PCE (confirmed, high) + GDP Q3 third + durable goods + BoJ Oct-MPM
  Minutes · Thu **12-24** NYSE 13:00 ET half day, SIFMA US 14:00 ET · Fri **12-25** NYSE shut, Tokyo
  CPI flash, **Tokyo trades and SIFMA Japan recommends closed** · Mon **12-28** this recommendation +
  BoJ Summary of Opinions 08:50 JST + US Advance Economic Indicators; **London shut, New York
  normal** · Wed **12-30** FOMC minutes (confirmed), Tokyo's last 2026 session · Thu **12-31** Tokyo
  fully dark 99h, SIFMA US 14:00 ET, SIFMA Japan shut, **UK normal** · Fri **2027-01-01** all shut.

## Initial research

### The question, plainly

This entry was discovered in-sweep by the [`jpx-market-closure-2026-12-31`](jpx-market-closure-2026-12-31.md)
lane (leg 10), which re-parsed all 35 cards of SIFMA's Japan panel and found an early-close card the
[`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md) lane had missed. It was
filed with an honest flag attached: SIFMA files the card under **"Boxing Day"**, a UK/Commonwealth
holiday with **no standing in Japan**, on a date that is an ordinary JPX business day.

So the question is the flag: **why does a Japanese fixed-income schedule carry a British holiday —
and does the resulting early close shorten anything that matters?** The calendar note's working
answer was "cross-border settlement convenience," and its stated consequence was that the 08:50 JST
BoJ Summary of Opinions would print into *"roughly a half session for the reaction."*

**One-line verdict: the name is not a quirk and the consequence is wrong.** SIFMA's Japan panel is
the Tokyo-hours schedule for the **US dollar** bond market, so a foreign holiday is exactly what
belongs on it; the Japanese instruments the note had in mind — JGB cash, JGB futures, TSE equities —
are outside SIFMA's stated scope and run their **normal** hours, with the OSE futures day session
already ending at the very 15:00 JST the recommendation names. And measured against the one Japanese
instrument with a long tape, a London closure does nothing to the Tokyo bar.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no session-hours instrument exists in
`scripts/research/`. Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
Nothing was taken on the discovering lane's word; every primary was re-fetched and re-parsed today.

- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, 298,926 bytes.
  Parsed **twice, independently**: card-by-card off the rendered DOM (`h3` name / date / note, region
  fixed to the page's own `U.S.` / `U.K.` / `Japan` `<h2>` headings) — 13 US, 18 UK, **35 Japan**
  cards for 2026, reproducing the discovering lane's count exactly — and then a second pass over the
  page's **embedded Next.js flight payload**, which is where the **2027** panels live behind a tab
  the DOM parse never sees. **121 cards** recovered across all six panels. The scope paragraph and
  every early-close string are quoted verbatim below.
- **gov.uk** `gov.uk/bank-holidays.json` — HTTP 200, 22,207 bytes. The statutory England-and-Wales
  list, 83 events 2019-01-01 → 2028-12-26. Used both to corroborate the causing holiday and to
  **validate the price-side detector** (below).
- **JPX** `jpx.co.jp/english/derivatives/rules/trading-hours/` — HTTP 200, 44,985 bytes. The JGB
  Futures / Options on JGB Futures / Interest Rate Futures row parsed session-by-session.
- **JPX** `jpx.co.jp/english/corporate/about-jpx/calendar/` — HTTP 200, 33,103 bytes (page's own
  `Update : Feb. 06, 2026`), both year panels re-parsed.
- **Cabinet Office of Japan** `www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv` — HTTP 200, 21,538
  bytes, Shift_JIS, decoded and parsed row-by-row. The statutory 国民の祝日 list; this is the
  authoritative answer to "is 2026-12-28 a Japanese holiday."
- **Measured, not sourced:** Yahoo daily bars via the endpoint `event-material-scan.mjs` itself
  uses — `^N225` **9,000 bars** (1990-01-04 → 2026-09-04), `^GSPC` **9,237**, `^FTSE` **9,264**,
  `^VIX` **9,238** (close **14.53** on 2026-09-04), `JPY=X` **7,741**. The three index counts
  reproduce the [12-31 sibling](jpx-market-closure-2026-12-31.md)'s exactly, which is the credential
  for comparing numbers across the two ledgers.
- **Definitions, stated so they can be refuted:** *London shut* = a weekday with an `^N225` bar and
  **no** `^FTSE` bar. *c2c* = prior close → close; *gap* = prior close → open. *Ordinary 1-day-gap
  session* = an `^N225` bar exactly one calendar day after the previous one. *Dead week* = any
  session dated Dec 26-31.
- **Not fetched, so not asserted:** SIFMA's linked *Policy on Early Close Recommendations*,
  *Overview of Market Close Recommendation Process* and holiday-schedule **archive** (so what SIFMA
  recommended for Tokyo on **2020-12-28** is unknown here); any JGB cash (JSDA/OTC) tape or its
  conventional closing time; BOJ-NET operating hours; CME/SGX Nikkei calendars (`cmegroup.com` has
  returned 403 to this runner across nine documented sibling attempts and was not re-tried).
- **Re-grepped, not inherited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`,
  `src/domain/earnings-calendar.ts`.

### Conviction legs, tested

1. **The card exists, is Japan-attributed, and is not marked tentative — SUPPORTED, two independent
   parses.** The Japan 2026 panel's 33rd card reads exactly `Boxing Day` /
   `Early Close Only (3:00 p.m. Japan Standard Time): Monday, December 28, 2026`. Region attribution
   is self-evidencing — the note names **Japan Standard Time**, where every US card says *Eastern
   Time* — and independently confirmed by the page's own `<h2>` boundaries and by the flight
   payload's panel order. **Every 2027 Japan card carries `Tentative – Subject to confirmation by the
   Bank of Japan`; no 2026 Japan card does.** The 2026 recommendation is SIFMA's settled one.

2. **The scope is USD-denominated paper, and this is the leg everything else turns on — SUPPORTED,
   verbatim from the page.** *"All SIFMA holiday recommendations apply to the trading of **U.S.
   dollar-denominated** government securities, mortgage- and asset-backed securities, over-the-counter
   investment-grade and high-yield corporate bonds, municipal bonds and secondary money market trading
   in bankers' acceptances, commercial paper and Yankee and Euro certificates of deposit. Previously
   scheduled SIFMA early close recommendations do not affect the closing time for settlements."*
   The panel headings are **U.S. / U.K. / Japan**, and the product is the same in all three. **The
   region is a time zone, not an asset class** — the Japan panel governs when Tokyo-based desks stop
   trading *dollars*, which is why it can be, and is, keyed to American and British holidays. It says
   nothing about JGBs, and the second sentence carves settlement out of scope as well.

3. **The "Boxing Day" name is a rule, not an error — SUPPORTED, 3 of 3 in 2026 and 2 of 2 in 2027.**
   The complete set of `Early Close Only (3:00 p.m. Japan Standard Time)` strings on the whole page:

   | Date | SIFMA's card name | What the day is | UK | US |
   |---|---|---|---|---|
   | 2026-04-06 | Easter Monday | UK bank holiday | shut | open |
   | 2026-08-31 | Summer Bank Holiday | UK bank holiday | shut | open |
   | **2026-12-28** | **Boxing Day** | **UK bank holiday (substitute)** | **shut** | **open** |
   | 2027-03-29 | Easter Monday (*tentative*) | UK bank holiday | shut | open |
   | 2027-08-30 | Summer Bank Holiday (*tentative*) | UK bank holiday | shut | open |

   **All five are UK-only bank holidays; there are no others of any kind.** The two UK-only 2026
   holidays that get **no** Japan card at all — `May Day` (2026-05-04) and `Spring Bank Holiday`
   (2026-05-25), both rendered with an empty date cell — are precisely the two on which Tokyo is
   **already fully closed**: 05-04 is みどりの日 (Greenery Day) per the Cabinet Office CSV and 05-25 is
   US Memorial Day, which the Japan panel carries as a full close. The 2027 panel reproduces the
   pattern with the same two cards reading `None`. **The rule, stated so it can be broken: a US
   holiday closes Tokyo's USD desk in full; a UK-only bank holiday that is not already a Japanese
   market holiday halves it at 15:00 JST.** SIFMA names the Tokyo card after the *foreign* holiday
   that causes it — which is exactly why "Boxing Day" appears on a Japanese schedule.

4. **The Japan panel is mostly not Japanese — SUPPORTED, and it corroborates leg 2 by composition.**
   Of the 35 cards: **19** are Japanese market holidays (the 17 weekday 国民の祝日 plus the Jan 2 and
   Dec 31 bank holidays; the Cabinet Office's 18th, Sunday 2026-05-03, is absent because it is a
   Sunday), **9** are US holidays (MLK, Presidents, Memorial, Juneteenth, Independence, Labor,
   Veterans, Thanksgiving, Christmas), **6** are UK holidays, and 1 is the 2027 New Year card.
   **More than two fifths of Tokyo's recommended closures are foreign.** A panel that shuts Tokyo for
   Martin Luther King Day is not a schedule for the Japanese government bond market.

5. **Nothing Japanese is actually shortened — SUPPORTED, and it corrects this entry's own note.**
   JPX's hours page, parsed session-by-session for JGB Futures / Options on JGB Futures / Interest
   Rate Futures:

   | Session | Opening auction | Zaraba | Closing auction |
   |---|---|---|---|
   | Morning | 8:45 | 8:45–11:00 | 11:02 |
   | Afternoon | 12:30 | **12:30–15:00** | **15:02** |
   | **Night** | **15:30** | **15:30–5:55** | **6:00** |

   Two consequences. **(a)** SIFMA's 15:00 JST and the OSE JGB futures day-session close are **the
   same clock time** — the recommendation does not cut into the listed day session at all. **(b)**
   The **night session runs 15:30 → 05:55 the next morning**, and JPX's calendar lists **no December
   2026 market holiday but 12-31**, so on 12-28 the listed Japanese rates market trades a full day
   *and* a further 14½ hours. The note's *"roughly a half session for the reaction"* to the 08:50 JST
   BoJ Summary of Opinions is therefore **wrong**: the document prints ten minutes before the cash
   open into a futures market that stays open for another 21 hours.

6. **2026-12-28 is an ordinary Japanese business day — SUPPORTED, from the statutory primary.** The
   Cabinet Office's `syukujitsu.csv` lists **18** national holidays for 2026 and **none in
   December** (the December date the file once carried, 12-23 Emperor's Birthday, moved to 02-23 on
   accession). JPX's own calendar independently lists `Dec. 31 (Thu.)` as the only remaining 2026
   closure. **There is no Japanese basis for this early close whatsoever** — which is the point: its
   basis is British.

7. **The causing holiday is statutory and independently sourced — SUPPORTED.** `gov.uk/bank-holidays.json`
   lists `2026-12-28 | Boxing Day | "Substitute day"` for England and Wales — 2026-12-26 falls on a
   Saturday, so the bank holiday moves to the Monday. SIFMA's **UK** panel carries the matching card
   `Boxing Day (Substitute)` / `Monday, December 28, 2026` with **no** early-close note, i.e. a full
   recommended UK close. This is the mechanism in one line: **London is shut, New York is open, and
   Tokyo's dollar desk splits the difference.**

8. **The three-region triple is the exact inverse of the 12-31 sibling's — SUPPORTED, and it is worth
   the sentence.** [`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md) made a
   finding of 12-31 sitting in three states at once: **US early close · Japan fully shut · UK
   normal.** Three days earlier the same page gives **UK fully shut · Japan early close · US
   normal.** The US panel has no 12-28 card at all; its December entries are the 12-24 early close,
   the 12-25 closure and the 12-31 early close. Neither date is a special case — they are the two
   halves of one calendar that follows three national holiday regimes at once.

9. **A London closure has no measurable magnitude effect on the Tokyo tape — NOT SUPPORTED as an
   effect; this is the measured leg and it is a null.** First the detector, because everything rests
   on it. Weekdays with an `^N225` bar and no `^FTSE` bar, 2019-01-01 onward: **52**, of which **51**
   are on gov.uk's statutory England-and-Wales list and **one** (2020-12-22) is a Yahoo data gap.
   Conversely, of the **51** gov.uk holidays that are Tokyo sessions, the detector missed **zero**.
   **51/52 precision, 51/51 recall against the primary** — and it extends back to 1990, where gov.uk
   does not. Then the measurement, `^N225` 1990-01-04 → 2026-09-04:

   | Bucket | n | mean \|c2c\| | se | up % | Welch t vs ordinary |
   |---|---|---|---|---|---|
   | All sessions | 8,999 | 1.060% | 0.011 | 51.2% | — |
   | Ordinary 1-day-gap session | 6,953 | 1.008% | 0.012 | 51.1% | — |
   | **London shut, Tokyo open** | **244** | **0.964%** | 0.056 | 58.2% | **−0.78** |
   | …and New York open (**the 12-28 shape**) | 140 | 0.997% | 0.069 | 56.4% | **−0.16** |
   | …and New York shut | 104 | 0.920% | 0.092 | 60.6% | — |

   **Flat, and if anything marginally narrower.** On the exact configuration this event produces the
   difference is 0.011 percentage points — a null to three decimals.

10. **The one directional signal is a Monday artifact — MIXED, and the control is the honest half.**
    London-shut sessions closed **up 142 of 244 (58.2%)** against the `^N225`'s 51.2% base rate,
    one-sided exact binomial **p = 0.0163** — which would read as a real tilt. But **148 of the 244
    are Mondays** (composition: Mon 148, Fri 49, Tue 23, Thu 13, Wed 11), and the Nikkei's own Monday
    population is up only **50.6%** (n=1,684). Against that matched base rate the tilt is **56.1%,
    one-sided p = 0.105** — **not significant**, and this ledger does not carry it. Same shape of
    correction the [12-31 sibling](jpx-market-closure-2026-12-31.md) made to the reopening-bar
    statistic, arrived at independently.

11. **What survives the matched control is a *dampening*, not an amplification — SUPPORTED, and it is
    this session's one positive measured result.** Comparing like with like on both weekday and
    season — Mondays with London shut, against Mondays with London open **in the same seven months**
    those closures fall in (Mar, Apr, May, Jun, Jul, Aug, Dec):

    | Bucket | n | mean \|c2c\| | se | up % |
    |---|---|---|---|---|
    | Mondays, **London shut** | 148 | **0.972%** | 0.069 | 56.1% |
    | Mondays, London open, same months | 901 | **1.195%** | 0.039 | 49.5% |

    **Welch t = −2.81**, and it survives an era split (2000+: 0.928% vs 1.188%, n = 108/651,
    **t = −2.84**). A Tokyo Monday with London shut is roughly **19% narrower** than a matched Tokyo
    Monday with London open. The direction matters more than the size: the intuitive story — *thin
    holiday tape amplifies news* — is **backwards**. Fewer desks means a **quieter** bar. This is a
    variance result with no directional content, and its honest limit is leg 13.

12. **The exact analogue set contradicts leg 11 at n=10, and neither cut clears — MIXED, reported in
    full because burying it would be dishonest.** The ten Dec-28 sessions where Tokyo traded and
    London was shut are exactly the ten years where 12-26 fell on a weekend, which is exactly the
    rule that produces a UK substitute:

    | | 1992 | 1993 | 1998 | 1999 | 2004 | 2009 | 2010 | 2015 | 2020 | 2021 |
    |---|---|---|---|---|---|---|---|---|---|---|
    | c2c | −2.098% | +1.851% | −0.644% | +1.276% | +0.544% | +1.329% | −0.612% | +0.556% | +0.741% | +1.369% |

    Mean `|c2c|` **1.102%** (se 0.179), up **7 of 10**, signed mean **+0.431%**. That is **wider**
    than the Dec 26-31 dead week (0.776%, n=128; 0.749% once these ten are removed) — but **Welch
    t = 1.71** (1.84 against the cleaned control) and the up-rate is **p = 0.192**. Neither clears,
    and the point estimate runs *opposite* to leg 11's. **Two small cuts pointing opposite ways is
    what noise looks like**, and the correct summary is that no effect is established in either
    direction on the observable Japanese instrument.

13. **The most on-point observation in the whole population is 2020-12-28 — SUPPORTED, n=1.** Monday;
    UK Boxing Day substitute (gov.uk, *"Substitute day"*); London shut and New York open per the
    detector; Tokyo an ordinary session; the Dec 26-31 dead week; **and a BoJ Summary of Opinions
    published that morning** (the 2020-12-18 MPM's, per the
    [12-28 BoJ ledger](boj-summary-of-opinions-2026-12-28.md)'s own table). Every structural feature
    2026-12-28 carries. The bar: **`^N225` +0.741% close-to-close, +0.130% gap** — below the Nikkei's
    all-session mean and below the matched Monday control. Its close-to-close figure reproduces the
    BoJ sibling's to three decimals from a separately-fetched series, which is a small credential for
    both. One observation is not a base rate; it is the only one that holds all six features fixed.

14. **The recommendation's own durability is the live uncertainty, and the page supplies the
    counter-example — MIXED.** SIFMA's **2027** Japan panel carries `Boxing Day` /
    **`None - Tentative – Subject to confirmation by the Bank of Japan`**, and its 2027 **UK** panel
    carries `Boxing Day` / `None` — while gov.uk lists **2027-12-28** as a Boxing Day substitute
    (2027-12-25 is a Saturday) and 2027-12-27 as the Christmas substitute. So one year out, SIFMA has
    published **no** recommendation for the same holiday it half-closes Tokyo for in 2026. Two
    readings, and this ledger does not pick between them: either the Boxing-Day treatment is
    genuinely year-by-year, or the 2027 year-end panel is simply unfinished — its UK Christmas card
    reads `Friday, December 24, 2027`, a US-style observance that diverges from gov.uk's Monday
    substitute, and every 2027 Japan card is flagged tentative while no 2026 card is. **Either way it
    is a live falsifier for the 2026 card**, and it is registered as one.

15. **Nothing house-side can fire on this date — SUPPORTED, re-verified not inherited.** A grep of
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|jpx|tokyo|nikkei|closure|year-end|new year|jgb|gilt|boxing|sifma` returns **zero hits in
    both** — a wider keyword set than the sibling lanes used, and still zero.
    `src/domain/earnings-calendar.ts` carries **no print dated after 2026-11-10**, so there is no
    earnings reaction anywhere in this corridor either. `symbols: []`, `impact: low`.

16. **The corridor is dense and this entry is the least of it — SUPPORTED, from the live calendar.**
    Fifteen tracked events sit within ±5 days of 2026-12-28: PCE (**confirmed, high**), GDP Q3 third
    (confirmed), durable goods and the BoJ Oct-MPM Minutes all on 12-23; the Christmas Eve half day
    12-24; the Tokyo CPI flash 12-25; **this recommendation, the BoJ Summary of Opinions and the
    Advance Economic Indicators Report all on 12-28**; **FOMC minutes 12-30 (confirmed)**; and five
    items on 12-31 including the year-end Tokyo blackout. **On its own date this entry is the only one
    of three that moves nothing** — it changes who is at a desk, not what anything is worth.

### What plays the conditions support (date `estimate`)

**None.** No entry, exit, hedge or size is keyed to 2026-12-28 in any branch. What this row banks is
four corrections and one null:

- **The scope correction** — SIFMA's Japan panel is the **USD** market in Tokyo hours, not the JGB
  market. This entry's own title and note are amended in this PR to say so.
- **The execution correction** — nothing Japanese is shortened. JGB futures run 08:45–15:02 plus a
  15:30–05:55 night session; 15:00 JST is the day session's *existing* close. The BoJ Summary of
  Opinions has a full day and a night session to be priced in, not "half a session."
- **The naming rule** — a UK-only bank holiday that is not already a Japanese market holiday gets a
  15:00 JST Tokyo card named after the British holiday. 5 of 5 across both published years.
- **The measured null** — a London closure does not move the Tokyo bar's magnitude (t = −0.78; −0.16
  on the exact configuration). What survives a matched control is a mild *dampening* (t = −2.81),
  which the n=10 exact-analogue cut then contradicts. Call it no effect, and size nothing off it.

### Honest limits

- **The measured legs are about Japanese *equities*, and the event is about *dollar bonds*.** `^N225`
  is the only Japanese instrument with a 36-year daily tape available to this runner; no JGB cash
  tape, no BOJ-NET data and no USD-in-Tokyo volume series was fetched. Legs 9-13 are therefore a
  **proxy** — they measure whether a London closure changes the Tokyo *session* at all, not whether
  Tokyo's dollar desks trade less. That is a real gap and it is the reason this stance is built on
  legs 2-8 (sourced, structural) rather than on legs 9-13 (measured, proxied).
- **Leg 11 cannot separate "London shut" from "the world is on holiday."** The control matches
  weekday and month, not the fact that Easter Monday, the May and August bank holidays and Boxing Day
  are globally thin dates. The dampening is real in the data; its *cause* is not identified.
- **Leg 12 is n=10 and leg 13 is n=1**, and they disagree with leg 11's direction. Nothing in
  legs 9-13 should be sized off; they exist to refuse an amplification story, not to assert its
  opposite.
- **What SIFMA recommended for Tokyo on 2020-12-28 is unknown.** The page's `View Archive` link was
  not followed, so leg 13's "exact analogue" is exact on **market structure** (London shut, NY open,
  Tokyo open, Monday, dead week, BoJ SoO) and **assumed** on the recommendation itself.
- **The normal Japanese close that 15:00 JST shortens is not sourced.** SIFMA states no baseline
  Tokyo closing time anywhere on the page, and no JSDA/OTC convention was fetched. So the *magnitude*
  of the shortening — how many hours a Tokyo dollar desk actually loses — is **unquantified here**.
  The only anchored fact is the 15:00 JST time and its coincidence with the OSE day-session close.
- **The 2027 panel is tentative and internally inconsistent at year-end** (leg 14), so it is used
  only as a falsifier for the 2026 card and never as evidence about 2027 itself.
- **`^N225` levels are dominated by the 1990s post-bubble crash**, which is why its ordinary-session
  baseline (1.008%) is wider than the 2016+ baselines the BoJ siblings quote (0.949%). Every contrast
  here is computed **within** one series, so this affects levels rather than comparisons.
- **Tokyo and London closures are inferred from missing bars**, not read off exchange holiday lists.
  The detector was validated against gov.uk for 2019+ (51/52, one data gap) but **not** before 2019,
  where a data outage would be misread as a closure.
- **Every date in this corridor is `estimate` except PCE, GDP, and the FOMC minutes** — including
  this one, whose source is explicitly a non-binding recommendation to members. Estimates widen
  caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05, date `estimate`):** **stand aside, permanently and structurally.** No position,
no play, no size, in any branch — this row exists to hold four corrections and one null, not a view.

First, **the scope correction, which is the reason this row is worth reading.** SIFMA's page states
verbatim that its recommendations cover *"the trading of **U.S. dollar-denominated** government
securities…"* — so the **Japan** panel is a **time zone, not an asset class**. This event is the Tokyo
session of the **US dollar** bond market closing early. **JGBs are out of scope entirely**, and the
composition of the panel corroborates it: 9 of its 35 cards are US holidays and 6 are British.

Second, **the execution correction, which retires this entry's own note.** JPX's hours page puts OSE
**JGB futures** at 08:45–11:00 and 12:30–15:00 (closing auction 15:02) plus a **night session
15:30–05:55**, and JPX's calendar lists **no December 2026 closure but 12-31**. **15:00 JST is where
the futures day session already ends**, and the market then trades another 14½ hours. The note's
claim that the 08:50 JST BoJ Summary of Opinions gets *"roughly a half session for the reaction"* is
**wrong** — the reaction venue is not shortened by a single minute.

Third, **the naming rule, which turns a flagged anomaly into a mechanism.** Every one of the five
`Early Close Only (3:00 p.m. Japan Standard Time)` cards SIFMA publishes across 2026 and 2027 is a
**UK-only bank holiday** (2026-04-06, 2026-08-31, **2026-12-28**, 2027-03-29, 2027-08-30), and the two
UK-only holidays with no Japan card are exactly the two on which Tokyo is already fully closed. **A
US holiday shuts Tokyo's dollar desk in full; a UK-only one halves it.** So 2026-12-28 is the mirror
of [`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md) three days later: there
US early · Japan shut · UK normal; here **UK shut · Japan early · US normal.**

Fourth, **the measured answer is a null, and the honest version says so twice.** Across 244 Tokyo
sessions with London shut, `|c2c|` runs **0.964% vs 1.008%** ordinary (**t = −0.78**); on the exact
12-28 configuration, **0.997%, t = −0.16**. An apparent 58.2% up-rate (p = 0.0163) is a **Monday
artifact** — 148 of the 244 are Mondays and the matched tilt is p = 0.105. What *does* survive a
month-matched control is a **dampening** (0.972% vs 1.195%, **t = −2.81**, holding at −2.84 post-2000)
— the opposite of the "thin tape amplifies news" intuition — but the ten Dec-28 analogues run
**1.102%, wider** than the dead week at **t = 1.71**, contradicting it. **No effect is established in
either direction**, and the single most on-point observation, **2020-12-28** (Monday, UK substitute,
London shut, NY open, Tokyo open, dead week, BoJ Summary of Opinions), printed a quiet **+0.741%**.

Every statement here carries the event's **`estimate`** label, and its source is non-binding by its
own terms.

**Kill switches:**

- **Scope kill:** SIFMA publishing a Japan-panel scope statement that names **yen-denominated**
  instruments, or a primary showing the recommendation reaches JGB trading. Legs 2, 4 and 5 collapse
  and the calendar note's original reading is restored. Re-check every pulse.
- **Execution kill (registered):** JPX announcing a closure or early close for **2026-12-28**, or
  `^N225` failing to print an ordinary session bar on that date. Leg 5's "nothing Japanese is
  shortened" claim — the load-bearing correction — dies. Registered as
  **FT-sifma-japan-early-close-2026-12-28-1**, score by **2026-12-29**.
- **Dampening kill (registered):** the **2026-12-28** `^N225` close-to-close `|move|` printing **at or
  above 1.185%**, the Nikkei's unconditional Monday mean. Six of the ten Dec-28 analogues came in
  below it. Registered as **FT-sifma-japan-early-close-2026-12-28-2**, score by **2026-12-29**, at
  **Medium** — legs 11 and 12 disagree, so this is an out-of-sample tiebreak, not a confident call.
- **Recommendation kill (registered):** the Japan-panel card being **removed, re-dated, or changed to
  `None`** on a re-fetch before **2026-12-24** — the treatment SIFMA's own 2027 panel already gives
  this exact holiday (leg 14). Registered as **FT-sifma-japan-early-close-2026-12-28-3**.
- **Naming-rule kill:** SIFMA publishing a `3:00 p.m. Japan Standard Time` early close on a date that
  is **not** a UK-only bank holiday, or a **full** Japan close on a UK-only one. Leg 3's 5-of-5 rule
  breaks and the "Boxing Day" name needs a different explanation. Re-check every pulse.
- **Statutory kill:** the UK moving or removing the 2026-12-28 substitute bank holiday
  (`gov.uk/bank-holidays.json`), or Japan legislating a December national holiday — the cause and the
  "ordinary Japanese business day" premise respectively. Re-check every pulse.
- **Proxy kill:** a JGB cash tape, a BOJ-NET schedule, or a Tokyo USD-bond volume series becoming
  reachable and showing a measurable 12-28-shaped effect. Legs 9-13 are an equity **proxy** for a
  dollar-bond question and would be superseded rather than patched.
- **Relevance kill (upward):** a house playbook keyed to session hours, foreign holidays or fixed
  income being written and back-tested. Leg 15 goes stale and the stand-aside must be re-argued on
  measured data rather than on absence.

Three forward tests registered in
[`forward-tests/sifma-japan-early-close-2026-12-28.md`](../forward-tests/sifma-japan-early-close-2026-12-28.md)
— **-1** (the execution correction), **-2** (the dampening tiebreak) and **-3** (the recommendation's
own durability). Two dated adjacent events discovered in-sweep are proposed as `estimate` in the same
PR: [`sifma-uk-bond-market-closure-2026-12-28`](sifma-uk-bond-market-closure-2026-12-28.md) — the
causing holiday, and the first UK-panel entry this calendar has ever carried — and
[`sifma-japan-early-close-2027-03-29`](sifma-japan-early-close-2027-03-29.md), the same configuration
recurring on a date this calendar already tracks a BoJ Summary of Opinions for. Recorded but **not**
proposed: the 2027-08-30 Japan early close (real, but tentative and with nothing co-dated).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-114 | **Initial research.** **Headline — the scope, verbatim from SIFMA (HTTP 200, 298,926 B, parsed twice: 35 Japan DOM cards reproducing the discovering lane, then 121 cards out of the embedded flight payload where the 2027 panels live):** *"All SIFMA holiday recommendations apply to the trading of **U.S. dollar-denominated** government securities…"* — the **Japan panel is a time zone, not an asset class**, and **JGBs are out of scope**. Composition corroborates: of 35 cards, **19** Japanese market holidays, **9 US**, **6 UK**. **Execution correction, and it retires this entry's own note:** JPX hours page (HTTP 200, 44,985 B) puts OSE **JGB futures** at 08:45–11:00 / **12:30–15:00, closing auction 15:02**, then **night session 15:30–05:55**; JPX calendar (HTTP 200, 33,103 B) lists **no Dec-2026 closure but 12-31**. **15:00 JST is the futures day session's existing close** — the note's *"roughly a half session for the reaction"* to the 08:50 JST BoJ SoO is **wrong**; nothing listed loses a minute. **Naming rule — 5 of 5, both years:** every `Early Close Only (3:00 p.m. Japan Standard Time)` card is a **UK-only** bank holiday (2026-04-06, 2026-08-31, **2026-12-28**, 2027-03-29, 2027-08-30); the two UK-only holidays with **no** Japan card (05-04 May Day, 05-25 Spring BH) are exactly where Tokyo is already shut (みどりの日 per Cabinet Office CSV; US Memorial Day). **US holiday → full Tokyo close; UK-only → 15:00 JST half.** **Three-region triple, the exact inverse of the [12-31 sibling](sifma-bond-early-close-2026-12-31.md)'s:** here **UK fully shut** (UK card `Boxing Day (Substitute)` / `Monday, December 28, 2026`, no note) · **Japan 15:00 JST** · **US normal** (no 12-28 US card). **No Japanese basis exists:** Cabinet Office `syukujitsu.csv` (HTTP 200, 21,538 B, Shift_JIS) lists **18** 2026 holidays and **zero in December**. Cause independently statutory: `gov.uk/bank-holidays.json` (HTTP 200, 22,207 B) `2026-12-28 Boxing Day "Substitute day"`. **Measured (^N225 9,000 / ^GSPC 9,237 / ^FTSE 9,264 bars, 1990→2026; counts reproduce the [12-31 JPX sibling](jpx-market-closure-2026-12-31.md) exactly):** detector = weekday with an N225 bar and no FTSE bar, validated **51/52 precision, 51/51 recall** vs gov.uk 2019+ (one Yahoo gap, 2020-12-22). **London shut, Tokyo open: \|c2c\| 0.964% (n=244) vs 1.008% ordinary — Welch t = −0.78**; **NY-open subset (the 12-28 shape) 0.997% (n=140), t = −0.16** — a null to three decimals. **The 58.2% up-rate (142/244, p=0.0163) is a Monday artifact** — 148 of 244 are Mondays and the matched tilt is 56.1%, **p = 0.105**. **What survives a month-matched control is DAMPENING, not amplification:** London-shut Mondays **0.972%** vs same-month London-open Mondays **1.195%** (n=148/901, **t = −2.81**; 2000+ only 0.928%/1.188%, t = −2.84). **But the n=10 exact analogues contradict it:** the ten Dec-28 London-shut Tokyo sessions (1992/93/98/99/2004/09/10/15/20/21) run **1.102%** (se 0.179), up 7/10, signed +0.431% — **wider** than the dead week (0.776%, n=128) at **t = 1.71**, p = 0.192. **No effect established either way.** **Most on-point observation: 2020-12-28** — Monday, UK substitute, London shut, NY open, Tokyo open, dead week, **BoJ SoO published** — **+0.741% c2c**, reproducing the [BoJ 12-28 ledger](boj-summary-of-opinions-2026-12-28.md)'s figure to three decimals from a separate fetch. **Live falsifier found on the page itself:** SIFMA's **2027** Japan panel reads `Boxing Day` / **`None`** (its 2027 UK panel too) though gov.uk dates a 2027-12-28 substitute — but every 2027 Japan card is `Tentative – Subject to confirmation by the Bank of Japan` and **no 2026 card is**, and the 2027 UK Christmas card (`Friday, December 24, 2027`) diverges from gov.uk, so the panel may simply be unfinished. Adjacency — **peers:** none (`symbols: []`); `earnings-calendar.ts` has **no print after 2026-11-10**. **Macro:** 15 tracked events within ±5d — PCE (confirmed, high) + GDP Q3 third + durable goods + BoJ Oct Minutes 12-23 · half day 12-24 · Tokyo CPI flash 12-25 · **12-28 this + BoJ SoO + Advance Economic Indicators** · **FOMC minutes 12-30 (confirmed)** · five items 12-31. **Volatility:** VIX **14.53** (2026-09-04 close); N225 65,020.94, GSPC 7,718.60, FTSE 10,831.10, USD/JPY 156.22. **Geopolitical:** nothing touching this event; `china-retaliation-suspension-expiry-2026-12-31` sits 3d later and is unrelated to session hours. **Tape:** JPX open and normal on 12-28; Tokyo's last 2026 session is 12-30. **Proposes** `sifma-uk-bond-market-closure-2026-12-28.json` (the cause; first UK-panel entry on this calendar) and `sifma-japan-early-close-2027-03-29.json` (same configuration, co-dated with `boj-summary-of-opinions-2027-03-29`), both `estimate`. Recorded not proposed: the 2027-08-30 Japan early close (tentative, nothing co-dated). **Own weaknesses:** legs 9-13 measure Japanese **equities** as a proxy for a **dollar-bond** question — no JGB/BOJ-NET/USD-Tokyo-volume series was reachable; the dampening control matches weekday and month but cannot separate "London shut" from "globally thin date"; n=10 and n=1 on the analogues, which disagree with the pooled cut; SIFMA's **archive was not fetched**, so what it recommended for Tokyo on 2020-12-28 is unknown; **no source for the normal Tokyo close**, so the shortening's magnitude is unquantified; pre-2019 closures are inferred from missing bars. CME not re-attempted (9 prior 403s). Own entry's title and `notes` amended in this PR. | Initial stance set: **stand aside** (structural row only). Four corrections banked — **scope** (USD-denominated, so the Japan panel is a time zone and JGBs are out of scope), **execution** (nothing Japanese is shortened; 15:00 JST *is* the OSE JGB futures day close and a night session follows to 05:55, so the note's "half session for the reaction" is wrong), **naming** (5 of 5 JST early closes are UK-only bank holidays; US holiday → full close, UK-only → half), and the **inverse triple** to the 12-31 sibling — plus one **measured null** (t = −0.78 pooled, −0.16 on the exact shape; the up-rate tilt is a Monday artifact; a matched dampening at t = −2.81 is contradicted by the n=10 analogues at t = 1.71). Registers **FT-sifma-japan-early-close-2026-12-28-1/-2/-3**. | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
