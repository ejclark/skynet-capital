# SIFMA-recommended full closure of the London session of the USD bond market — on a day London is statutorily shut anyway — sifma-uk-bond-market-closure-2026-12-28

**Kind:** rates · **Date:** 2026-12-28 (estimate — NEWS: SIFMA `sifma.org/resources/guides-playbooks/holiday-schedule` U.K. Holiday Recommendations panel, re-fetched and re-parsed 2026-09-05; the causing bank holiday independently statutory from `gov.uk/bank-holidays.json`. The `estimate` label is a taxonomy gap plus a source non-binding by its own terms, not a doubt about the published date) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-minutes-2026-12-23","durable-goods-2026-12-23","gdp-q3-2026-third-2026-12-23","pce-2026-12-23","christmas-eve-half-day-2026-12-24","japan-cpi-tokyo-flash-2026-12-25","advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","sifma-japan-early-close-2026-12-28","fomc-minutes-2026-12-30","china-retaliation-suspension-expiry-2026-12-31","georgia-psc-data-center-cost-shift-2026-12-31","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","sifma-bond-early-close-2026-12-31"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and note that this card, unlike its Japan sibling, tells you nothing you
did not already have.** The scope correction the
[Japan lane](sifma-japan-early-close-2026-12-28.md) made applies here verbatim: SIFMA's page states
its recommendations cover *"the trading of **U.S. dollar-denominated**"* paper, so the **U.K. panel
is a time zone, not an asset class** — this is the London session of the **dollar** bond market,
and **gilts are out of scope**. But the consequence is the opposite of Tokyo's. On 2026-12-28
London is a **statutory** bank holiday (`gov.uk/bank-holidays.json`: `2026-12-28 | Boxing Day |
Substitute day`, 12-26 falling on a Saturday), so London is dark whatever SIFMA recommends —
measured: `^FTSE` printed **no bar on 37 of 37** gov.uk weekday bank holidays that were New York
sessions since 2019. **The U.K. card is the cause of the calendar's Japan entry, not news of its
own.** Two structural facts are new. **The U.K. panel is the strictest of the three: 18 cards in
2026, 18 in 2027, and zero early closes in either year** — the same Good Friday that is a 12:00 ET
*half day* on the U.S. panel is a *full* London closure. And **exactly half of London's panel is
American**: 9 of the 18 2026 cards are US-only holidays, so SIFMA shuts London's dollar desk for
**Martin Luther King Day**. **The measured answer is a triple null.** Three independent attributions
were tried on the US-listed proxies and **all three fail**: the EWU−SPY volume gap does not clear a
matched control (**permutation p = 0.096**), EWU's volatility compression is not specific to its
dark underlying (paired against EWJ, **p = 0.337**; FXB — whose FX market never closes — compresses
*most*), and EWU adds **nothing** over SPY about where the FTSE reopens (**t = 0.48**, R² 0.131 →
0.133). That is the exact inverse of the [11-11 sibling](sifma-bond-market-closure-2026-11-11.md),
where the same design found a real effect: **a US bond closure leaves an execution footprint; a
foreign equity closure does not.** `estimate`, `symbols: []`, `impact: low`, both playbook docs
grep **0 hits**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a non-binding recommendation to close a foreign desk on a day that foreign market is statutorily shut is not a position | High | D-114; `symbols: []`, `impact: low`, and `trade-playbooks.md` + `multi-symbol-sweep.md` grepped this session for `holiday\|gilt\|london\|boxing\|sifma\|closure\|ewu\|ftse\|year-end` return **0 hits in both**; `earnings-calendar.ts` carries **no print after 2026-11-10** | A house playbook keyed to session hours, foreign holidays or fixed income being written and back-tested before **2026-12-28** — the "nothing is calendar-keyed" leg dies and this sheet is rebuilt on measured data |
| This week | **Bank the correction, and amend this entry's own title and note** | High | SIFMA's scope line is verbatim **"U.S. dollar-denominated"**, so the U.K. panel governs London's *dollar* desk and not the gilt market; and the closure is **redundant with statute** — gov.uk dates a Boxing Day substitute on 2026-12-28 and `^FTSE` has printed no bar on **37 of 37** such weekday holidays since 2019 | SIFMA publishing a U.K.-panel scope statement naming **sterling-denominated** instruments, or a primary showing the recommendation reaches gilt trading, before **2026-10-05** — the correction is withdrawn |
| This month | **Do NOT carry the 11-11 execution guard across to this date** | High | Same design, same data, opposite result: there TLT−SPY was **−0.287** (16 of 18, replicated on Columbus Day). Here every attribution fails — volume gap **p = 0.096** vs a matched control, EWU−EWJ move compression **p = 0.337**, EWU's increment over SPY on the FTSE reopen **t = 0.48**. There is no measured depth warning to give | Any one of the three attributions clearing on the **2026-12-28** tape *and* on the next London-shut session after it (**2027-03-29**) — one instance is noise; two in the same direction re-opens the question |
| This quarter | **Watch the recommendation itself — SIFMA's 2027 U.K. panel already contradicts gov.uk, and is not flagged tentative** | Medium | The 2027 U.K. panel reads `Christmas Day` / **`Friday, December 24, 2027`** and `Boxing Day` / **`None`**, while gov.uk dates statutory substitutes on **2027-12-27 and 2027-12-28**. It also lists `Juneteenth` / **Saturday** June 19 and `U.S. Independence Day` / **Sunday** July 4 unshifted, where the U.S. panel shifts both — a loosely-maintained panel, but the only one of the three carrying **no** tentative flag | The 2026-12-28 U.K. card being removed, re-dated or changed to `None` on a re-fetch by **2026-12-24** — registered as **FT-sifma-uk-bond-market-closure-2026-12-28-4** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-12-28. `impact: low`, `symbols: []`,
  date `estimate`, source non-binding by its own terms, and date-keyed action requires `confirmed`.
- **The scope guard, inherited and re-verified.** SIFMA's recommendations cover **USD-denominated**
  paper. The U.K. panel is **London's session of the US dollar bond market**, not the gilt market —
  SIFMA has no writ over gilts. Anyone reading this entry as "the UK bond market is closed" has the
  right *outcome* (London is shut) for the wrong *reason* (statute, not SIFMA).
- **The redundancy guard, and it is what separates this card from its siblings (`estimate`).**
  2026-12-28 is a statutory England-and-Wales bank holiday. London equities and gilts are dark
  regardless. Contrast the U.S.-panel closures — **Veterans Day 11-11** and **Columbus Day 10-12** —
  where NYSE trades a full session and the SIFMA card *is* the information. Here there is no
  cross-asset split inside London at all; the only split is cross-border.
- **The three-region state on 2026-12-28, parsed card-by-card:** **UK fully shut** (U.K. panel,
  `Boxing Day (Substitute)` / `Monday, December 28, 2026`, no early-close note) · **Japan early close
  15:00 JST** ([`sifma-japan-early-close-2026-12-28`](sifma-japan-early-close-2026-12-28.md)) ·
  **US a full session** (no 12-28 card on the U.S. panel; its December entries are the 12-24 early
  close, the 12-25 closure and the 12-31 early close). The exact inverse of
  [`sifma-bond-early-close-2026-12-31`](sifma-bond-early-close-2026-12-31.md)'s triple three days later.
- **London never gets a half day — 36 of 36 cards, both published years.** Every U.K. card is a full
  closure; the panel contains zero `Early Close` strings, where the U.S. 2026 panel carries **8** and
  the Japan 2026 panel **2**. So Good Friday 2026-04-03 is a **12:00 ET early close** in New York and
  a **full closure** in London, on one dollar market. Three time zones, three strictness regimes.
- **Half the London panel is American — 9 of 18.** MLK, Presidents Day, Memorial Day, Juneteenth,
  US Independence Day (observed), Labor Day, Columbus Day, Veterans Day and Thanksgiving all shut
  London's dollar desk; the other 9 are gov.uk statutory. **2026-05-25 appears twice** (`Memorial
  Day` and `Spring Bank Holiday`, one date, two cards). A panel that closes London for Martin Luther
  King Day is not a schedule for the gilt market.
- **Do NOT import the 11-11 half-depth warning.** It was measured, replicated and real *for a US
  bond closure*. Every analogue of it fails here (legs 8-11). Stating a depth guard on this date
  would be an unearned transfer of somebody else's finding.
- **The one apparent directional signal is a mined calendar slot and is refused.** EWU closed **down
  8 of 8** on the Dec-28 analogues (p = 0.0039 taken alone) — but across all **143** London-shut
  sessions EWU is up **51.7%**, and 1 of the only **3** month-day slots with n ≥ 6 shows a perfect
  run. That is what noise at n = 8 looks like. Registered as a forward test to burn its
  out-of-sample n, **not** carried as a view.
- **Attribution trap (Mon 2026-12-28).** The US session that day carries the **Advance Economic
  Indicators Report** and a three-session Christmas backlog; the Tokyo session carries the **BoJ
  Summary of Opinions** at 08:50 JST. **Nothing on this date should ever be credited to a SIFMA
  recommendation**, least of all this one, which changes who is at a London desk on a day London is
  already closed.
- **Watch (dated):** Wed **12-23** PCE (confirmed, high) + GDP Q3 third + durable goods + BoJ Oct-MPM
  Minutes · Thu **12-24** NYSE 13:00 ET half day, SIFMA US 14:00 ET, **London a full normal session**
  (no U.K. card, no statutory holiday) · Fri **12-25** all three regions shut · Mon **12-28** **this
  closure** + SIFMA Japan 15:00 JST + BoJ Summary of Opinions + US Advance Economic Indicators;
  **New York normal** · Tue **12-29** London reopens · Wed **12-30** FOMC minutes (confirmed) · Thu
  **12-31** SIFMA US 14:00 ET, Tokyo fully dark, **UK normal** · Fri **2027-01-01** all shut.

## Initial research

### The question, plainly

This entry was discovered in-sweep by the
[`sifma-japan-early-close-2026-12-28`](sifma-japan-early-close-2026-12-28.md) lane, which found that
every `3:00 p.m. Japan Standard Time` early close SIFMA publishes is caused by a **UK-only** bank
holiday, and proposed the cause as its own row — the **first U.K.-panel entry this calendar has ever
carried**. Its `notes` field left two things open in writing: it asserted nothing about London equity
hours (*"the London Stock Exchange's own calendar was not fetched this session"*), and it inherited
the Japan lane's measurement (a `^N225` study) rather than measuring anything from a US-listed
instrument.

So the question is: **does a London closure leave any footprint an instrument we can actually see
would register — and is this card worth a calendar row on its own terms, or only as the Japan
entry's cause?**

**One-line verdict: it is worth the row for what it corrects, not for what it predicts.** The card
is redundant with statute — London is shut on 2026-12-28 by act of Parliament, not by SIFMA — and
every attempt to find a London-closure footprint in a US-listed instrument fails a control. The
finding is the **contrast**: the [11-11 sibling](sifma-bond-market-closure-2026-11-11.md)'s
mechanism (an ETF whose cash market is shut *and* whose own users are on holiday) leaves a
half-depth signature; this one (a foreign cash market shut while the ETF's users are at work) leaves
nothing measurable at all.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no session-hours instrument exists in
`scripts/research/`. Instrument caches were busted
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) before any pull.
Nothing was taken on the discovering lane's word; every primary was re-fetched and re-parsed today.

- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, **298,926 bytes**,
  reproducing the discovering lane's byte count exactly. Parsed **twice, independently**:
  card-by-card off the rendered DOM (`h3` name / date / note), with region attribution fixed to the
  page's own `<h2>` headings at byte offsets **36,537 (U.S.) / 47,499 (U.K.) / 60,383 (Japan)** —
  yielding **13 US / 18 UK / 35 Japan** 2026 cards — and then a second pass over the page's embedded
  **Next.js flight payload**, where the 2027 panels live behind a tab the DOM parse never sees
  (**127 cards** recovered across all six panels). The scope paragraph is quoted verbatim below.
- **gov.uk** `gov.uk/bank-holidays.json` — HTTP 200, **22,207 bytes**. The statutory
  England-and-Wales division (83 events, 2019-01-01 → 2028-12-26). Used both to establish the causing
  holiday and to **validate the price-side detector**.
- **London Stock Exchange** `londonstockexchange.com/equity-trading/business-days` — **fetched, HTTP
  200, 54,995 bytes, and unusable**: the page is a client-rendered Angular shell whose entire body
  strips to **5 text cells**, none of them a date. The Japan lane's open item ("the LSE calendar was
  not fetched") is therefore closed as *not fetchable by this runner*, and the equity-hours question
  is answered **empirically** instead (leg 4) rather than left unstated.
- **Measured, not sourced:** Yahoo daily bars **with volume** from the same endpoint
  `scripts/research/market-data.mjs` uses (`bars()` itself drops the volume field, so raw payloads
  were read directly). `^FTSE` **9,264** valid bars and `^GSPC` **9,237** (1990-01-02 → 2026-09-04) —
  both reproducing the [Japan sibling](sifma-japan-early-close-2026-12-28.md)'s counts exactly, which
  is the credential for comparing numbers across the two ledgers; `^VIX` (close **14.53** on
  2026-09-04); **SPY** 8,458 from 1993-01-29; **EWU** and **EWJ** 7,667 each from 1996-03-18;
  **FXB** 5,081 from 2006-06-26; **FLGB** 2,219 from 2017-11-06; **TLT**/**LQD** 6,065 from
  2002-07-30. `^FTSE` last close **10,831.10**, also reproducing the sibling's figure.
- **Definitions, stated so they can be refuted:** *London shut* = a weekday with a `^GSPC` bar and
  **no** `^FTSE` bar (note this is a **different set** from the Japan sibling's `^N225`-anchored one
  — it excludes UK holidays on which New York is also shut, so n = 170 here against their 244).
  *Volume ratio* = session volume ÷ the **median** volume of its own trailing 20 sessions. *Move
  ratio* = |close-to-close| ÷ the median |close-to-close| of its own trailing 20 sessions. *Dead
  week* = any session dated Dec 26-31.
- **Not fetched, so not asserted:** SIFMA's holiday-schedule **archive** (so what SIFMA recommended
  for London on 2020-12-28 is unknown here), its linked *Policy on Early Close Recommendations*, any
  gilt cash or MTS tape, the UK DMO's calendar, and `cmegroup.com` (403 to this runner across every
  prior sibling attempt; not re-tried).
- **Re-grepped, not inherited:** `docs/plans/trade-playbooks.md`, `docs/research/multi-symbol-sweep.md`,
  `src/domain/earnings-calendar.ts`, and all 254 files of `src/domain/market-events/`.

### Conviction legs, tested

1. **The card exists, is U.K.-attributed, and is a full closure — SUPPORTED, two independent
   parses.** The U.K. 2026 panel's **17th** card reads exactly `Boxing Day (Substitute)` /
   `Monday, December 28, 2026`, with **no** early-close paragraph. Region attribution is fixed by the
   page's own `U.K. Holiday Recommendations` `<h2>` at byte 47,499 and independently confirmed by the
   flight payload's panel order. It stays `estimate` on three counts: the prefix taxonomy in
   `market-events-data.ts` has no slot for a trade association's recommended schedule; this lane may
   not self-confirm an in-sweep discovery; and the source is non-binding by its own terms —
   *"SIFMA **recommends** a holiday schedule."*

2. **The scope is USD-denominated paper, so the U.K. panel is a time zone — SUPPORTED, verbatim.**
   *"All SIFMA holiday recommendations apply to the trading of **U.S. dollar-denominated** government
   securities, mortgage- and asset-backed securities, over-the-counter investment-grade and
   high-yield corporate bonds, municipal bonds and secondary money market trading in bankers'
   acceptances, commercial paper and Yankee and Euro certificates of deposit. Previously scheduled
   SIFMA early close recommendations do not affect the closing time for settlements."* Extracted from
   the page body this session, not inherited. **Gilts are outside the recommendation entirely.**

3. **The causing holiday is statutory — SUPPORTED, from the primary.** `gov.uk/bank-holidays.json`
   lists `2026-12-28 | Boxing Day | "Substitute day"` for England and Wales; 2026-12-26 falls on a
   Saturday, so the bank holiday moves to the Monday. The same file dates 2026-12-25 Christmas Day
   and nothing on 2026-12-24.

4. **This card is REDUNDANT with statute, and that is what separates it from its US-panel siblings —
   SUPPORTED, measured.** The [11-11](sifma-bond-market-closure-2026-11-11.md) and
   [10-12](sifma-bond-market-closure-2026-10-12.md) entries earn their rows because NYSE trades a
   full session while the recommended USD tape is dark — a genuine cross-asset split. Here there is
   no split inside London: 2026-12-28 is a bank holiday, so LSE equities and the gilt market are shut
   whatever SIFMA says. The LSE's own calendar is not machine-readable to this runner (Method), so
   the claim is measured instead. Weekdays with a `^GSPC` bar and no `^FTSE` bar, 2019-01-01 onward:
   **38 detected**, of which **37** are on gov.uk's statutory list and **one** (2020-12-22) is a
   known Yahoo data gap — the same gap the Japan sibling identified from a different index pair.
   Conversely, of the **37** gov.uk weekday bank holidays that were New York sessions, the detector
   missed **zero**. **37/38 precision, 37/37 recall against the primary.** London has not traded on a
   statutory bank holiday in the observable record.

5. **The U.K. panel is the strictest of the three — SUPPORTED, 36 of 36 cards.** The U.K. panel
   contains **zero** `Early Close` strings in either published year (18 cards for 2026, 18 for 2027);
   the U.S. 2026 panel carries **8** early closes and the Japan 2026 panel **2**. So one dollar
   market runs three different strictness regimes by time zone, and the clearest instance is
   **Good Friday 2026-04-03**: a `12:00 p.m. Eastern Time` early close on the U.S. panel, a **full**
   closure on the U.K. panel. Tokyo gets a 15:00 JST half day for a UK-only holiday; London gets no
   half days at all.

6. **Half of London's panel is American — SUPPORTED, and it corroborates leg 2 by composition.** Of
   the 18 U.K. 2026 cards, **9 are US-only holidays** (Martin Luther King Day, Presidents Day,
   Memorial Day, Juneteenth, U.S. Independence Day observed, Labor Day, Columbus Day, Veterans Day,
   Thanksgiving Day) and **9 are gov.uk statutory** (New Year's Day, Good Friday, Easter Monday, May
   Day, Spring Bank Holiday, Summer Bank Holiday, Christmas Day, **Boxing Day (Substitute)**, and
   New Year's Day 2027). **2026-05-25 is rendered as two cards** — `Memorial Day` and `Spring Bank
   Holiday` — one date where the two regimes coincide. A schedule that closes London for MLK Day is
   a dollar-desk schedule, not a gilt-market one.

7. **The 2027 U.K. panel contradicts gov.uk and carries no tentative flag — MIXED, and it is the
   live uncertainty.** From the flight payload: `Christmas Day` / **`Friday, December 24, 2027`** and
   `Boxing Day` / **`None`**. gov.uk dates statutory substitutes on **2027-12-27** (Christmas, 12-25
   being a Saturday) and **2027-12-28** (Boxing Day). So one year out SIFMA recommends closing London
   on a day that is **not** a UK bank holiday and **not** closing on two days that are. Two further
   observations cut against reading much into it: the same panel lists `Juneteenth` /
   **`Saturday, June 19, 2027`** and `U.S. Independence Day` / **`Sunday, July 4, 2027`** — weekend
   dates left **unshifted**, where the U.S. 2027 panel shifts them to Friday 06-18 and Monday 07-05 —
   so the U.K. panel reads as a loosely-maintained mirror of US statutory dates. But unlike the Japan
   panel, where **every** 2027 card reads `Tentative – Subject to confirmation by the Bank of Japan`,
   **no U.K. card in either year carries a tentative flag.** This ledger does not pick between "the
   Boxing Day treatment is genuinely year-by-year" and "the 2027 year-end panel is unfinished." It is
   a live falsifier for the 2026 card either way, and it is registered as one.

8. **A London closure leaves no measurable footprint on the US index tape — NOT SUPPORTED as an
   effect; a null.** `^GSPC`, 1990-01-02 → 2026-09-04:

   | Bucket | n | mean \|c2c\| | se | up % | Welch t |
   |---|---|---|---|---|---|
   | All sessions | 9,236 | 0.757% | — | 53.7% | — |
   | **London shut, New York open** | **170** | **0.702%** | 0.066 | 57.1% | **−0.83** vs rest |
   | Month-matched control (same months, London open) | 6,826 | 0.745% | — | — | **−0.64** |

   The set is heavily seasonal — 44 of the 170 fall in December, 38 in May, 37 in August, 34 in
   April, and **130 of 170 are Mondays** — which is why the month-matched control matters. It moves
   the answer barely at all. **Flat.**

9. **The "sole venue" story — that with London dark, EWU becomes the price-discovery venue for UK
   equities — is REFUTED, and this is the leg that changes a reader's behaviour.** The mechanism
   predicts EWU's move on a London-shut day should carry information about where the FTSE reopens,
   *over and above* the global risk signal SPY already carries. Regressing the FTSE's next-session
   close-to-close return on both same-day US returns, n = 143:

   | Model | Coefficient | t | R² |
   |---|---|---|---|
   | SPY alone | 0.362 (corr) | — | **0.131** |
   | **SPY + EWU** | b(SPY) = **0.334** · b(EWU) = **0.064** | **2.89** · **0.48** | **0.133** |

   EWU's increment is **two thousandths of R²** and statistically indistinguishable from zero. Sign
   agreement with the FTSE reopen: **EWU 55.9%** (80 of 143, p = 0.090) against **SPY 58.7%** — the
   supposedly UK-specific instrument predicts London *worse* than the S&P does. On a London-shut day
   **EWU is a US-beta wrapper, not a sole venue.** (The cleaner test — whether EWU predicts the FTSE
   *opening gap* — is **unmeasurable with this data**: Yahoo reports `^FTSE`'s open as the prior
   close on **6,661 of 9,263** sessions, 71.9%, so no true index open exists in the series. Stated as
   a limit, not worked around.)

10. **The volatility-compression story is REFUTED by its own control — MIXED, reported in full.** The
    unpaired cut looks like the mechanism working: EWU's move ratio on London-shut days is
    **0.864×** against a 0.993× all-session median (**Welch t = −2.85**, 84 of 142 below 1.0×,
    p = 0.018) — an ETF with a dark underlying pricing less news. Then the controls:

    | Symbol | underlying on a London-shut day | n | median move ratio | all-session median | Welch t |
    |---|---|---|---|---|---|
    | **EWU** | **dark (LSE shut)** | 142 | **0.864×** | 0.993× | **−2.85** |
    | EWJ | open (Tokyo trades) | 142 | 0.960× | 0.995× | −1.76 |
    | SPY | open | 157 | 0.879× | 0.990× | −0.62 |
    | **FXB** | **never closes (spot FX)** | 93 | **0.802×** | 0.988× | **−4.43** |

    Paired per session, **EWU − EWJ** is **−0.086** with **74 of 142** negative — **p = 0.337**, a
    coin flip. And the instrument that compresses *most* is **FXB**, whose market has no closing bell
    at all. **The compression is a thin-holiday effect, not a closed-underlying effect**, and the
    honest reading is that the dark underlying explains none of it.

11. **The volume story does not clear a matched control either — MIXED.** Raw, it looks like a real
    substitution effect: EWU holds **0.961×** its trailing-20 median volume on London-shut days while
    **SPY** drops to **0.777×** — a paired **EWU−SPY gap of +0.162** (n = 140) against a **−0.036**
    all-other-session placebo, with FLGB at **+0.326** (n = 40) and EWJ, the open-underlying control,
    flat at **+0.020**. The direction is the interesting one — the ETF whose home market is dark
    holds *relatively more* volume, not less, because its users are at work. But against a
    month-**and**-weekday-matched control (Mondays in the same months, London open), the median-gap
    difference is **+0.118** at a **permutation p = 0.096** (5,000 resamples, n = 140 vs 971). Not
    significant, and the means run the *other* way (0.417 vs 0.974) because volume-spike days
    dominate them. **A suggestive point estimate with no significance, reported as such.**

12. **This is the exact inverse of the 11-11 sibling, and the contrast is the deliverable —
    SUPPORTED.** [`sifma-bond-market-closure-2026-11-11`](sifma-bond-market-closure-2026-11-11.md)
    ran the same paired-median design on the same data source and found a **real** effect: TLT at
    0.483× its trailing median volume against SPY's 0.765×, a **TLT−SPY gap of −0.287** (16 of 18,
    p = 0.0007) against a **+0.039** all-Wednesday placebo, **replicated** on Columbus Day
    (−0.346, 21 of 24). Here, three attributions and **all three fail**. The structural difference is
    identifiable and worth stating: on 11-11 the ETF's cash market is shut **and its own users are on
    holiday**; on 12-28 a *foreign* cash market is shut while the ETF's users are **at their desks in
    New York**. Only the first configuration thins the wrapper. As a same-session check, TLT and LQD
    on London-shut days show paired gaps of **−0.008** and **+0.067** — i.e. nothing.

13. **The one directional-looking result is a mined calendar slot and is refused — REFUTED, and
    burying it would be dishonest.** EWU closed **down on 8 of 8** Dec-28 analogues (1998, 1999,
    2004, 2009, 2010, 2015, 2020, 2021; mean **−0.29%**), which taken alone is a one-sided exact
    p = **0.0039**. Three things kill it. Across all **143** London-shut sessions EWU is up
    **51.7%** (mean +0.12%) against a 50.6% unconditional rate. Across the **36** dead-week
    London-shut sessions it is up **52.8%**. And the London-shut set contains **49** distinct
    month-day slots, of which only **3** reach n ≥ 6 — **1 of those 3** shows a perfect
    one-directional run, which is precisely the rate noise produces. The moves are also tiny
    (−0.06% to −0.60%). **No view is carried**; the slot is registered as a forward test purely to
    start accumulating its out-of-sample n.

14. **Nothing house-side can fire on this date — SUPPORTED, re-verified not inherited.** A grep of
    `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` for
    `holiday|gilt|london|boxing|sifma|closure|ewu|ftse|year-end` returns **zero hits in both** — a
    wider keyword set than the sibling lanes used, including the two US-listed UK proxies this
    session measured, and still zero. `src/domain/earnings-calendar.ts` carries **no print dated
    after 2026-11-10**. `symbols: []`, `impact: low`. **This repo tracks no UK-listed symbol.**

15. **The corridor is dense and this entry is the least of it — SUPPORTED, from the live calendar.**
    Fifteen other tracked events sit within ±5 days of 2026-12-28: PCE (**confirmed, high**), GDP Q3
    third (confirmed), durable goods and the BoJ Oct-MPM Minutes on 12-23; the Christmas Eve half day
    12-24; the Tokyo CPI flash 12-25; **the Advance Economic Indicators Report, the BoJ Summary of
    Opinions and the Japan early close all on 12-28**; **FOMC minutes 12-30 (confirmed)**; and five
    items on 12-31. **On its own date this is the only one of four that moves nothing** — and unlike
    the other three, it does not even change a session's hours anywhere a US instrument can see.

16. **A same-configuration adjacent event is discovered and proposed — SUPPORTED.** SIFMA's U.K. 2027
    panel carries `Easter Monday` / `Monday, March 29, 2027`, a gov.uk statutory bank holiday
    (`2027-03-29 | Easter Monday`) on which New York trades a full session (Good Friday falls
    2027-03-26 and is already tracked as `good-friday-market-closure-2027-03-26`). That is this
    event's exact configuration recurring, and the calendar **already tracks its two consequences** —
    [`sifma-japan-early-close-2027-03-29`](sifma-japan-early-close-2027-03-29.md) and
    `boj-summary-of-opinions-2027-03-29` — **without their cause**. Proposed in this PR as
    `sifma-uk-bond-market-closure-2027-03-29.json` (`estimate`, low). **Recorded but not proposed:**
    the U.K. 2027 May Day closure (2027-05-03) — real, same shape, but nothing tracked is co-dated.

### What plays the conditions support (date `estimate`)

**None.** No entry, exit, hedge or size is keyed to 2026-12-28 in any branch. What this row banks is
three corrections, one refusal and one null:

- **The scope correction** — SIFMA's U.K. panel is the **USD** bond market in London hours, not the
  gilt market. This entry's own title and note are amended in this PR to say so.
- **The redundancy correction** — unlike the 11-11 and 10-12 US-panel closures, this card creates no
  cross-asset split. London is shut by statute; the recommendation adds nothing.
- **The structural correction** — the U.K. panel is the strictest of the three (36 of 36 cards full
  closures, zero early closes) and **half of it is American**.
- **The refusal that matters most** — do **not** import the 11-11 half-depth execution guard to this
  date. Three attributions were tried and all three failed a control.
- **The null itself** — a London closure has no measurable footprint on `^GSPC` (t = −0.83), on EWU's
  volume against a matched control (p = 0.096), on EWU's volatility against its own placebo
  (p = 0.337), or on EWU's ability to price the FTSE reopen (t = 0.48).

### Honest limits

- **Every measured leg is about US-listed *equity* proxies, and the event is about *dollar bonds* in
  London.** No gilt cash tape, no MTS data, no London USD-bond volume series was reachable. EWU,
  EWJ, FXB and FLGB measure whether a London closure changes anything visible *from New York* — not
  whether London's dollar desks trade less. That gap is real, and it is why this stance rests on
  legs 1-7 (sourced, structural) rather than on legs 8-13 (measured, proxied).
- **The FTSE opening gap is unmeasurable in this data.** Yahoo reports `^FTSE`'s open as the prior
  close on 71.9% of sessions, so leg 9 had to use the reopening *full-day* return instead of the
  gap — a noisier and less mechanism-specific test. A true index open, or a gilt future, would be a
  better instrument and neither is available here.
- **Leg 11's permutation p = 0.096 is a near miss, not a proven zero.** The matched control fixes
  weekday and month but cannot separate "London shut" from "a globally thin date"; with n = 140 the
  test is not powerful. A second season of observations could move it either way, which is exactly
  why it is registered as a forward test rather than dismissed.
- **The detector infers London closures from missing bars**, validated against gov.uk for 2019+
  (37/38, one data gap) but **not** before 2019, where a data outage would be misread as a closure.
- **The historical sample assumes the recommendation held**, and SIFMA's archive was not fetched —
  so what it recommended for London on 2020-12-28 is unknown. This matters less here than in the
  siblings, because leg 4 shows the *statutory* closure is what actually shuts London.
- **The 2027 U.K. panel is used only as a falsifier** (leg 7), never as evidence about 2027 itself.
  Its unshifted weekend dates argue it is loosely maintained; its missing tentative flag argues the
  opposite. Both readings are stated.
- **The LSE's own calendar could not be read** (client-rendered page, 5 text cells), so leg 4's
  equity-hours claim is empirical rather than sourced from the exchange.
- **Every date in this corridor is `estimate` except PCE, GDP Q3 third and the FOMC minutes** —
  including this one, whose source is explicitly a non-binding recommendation to member firms.
  Estimates widen caution and license nothing.

## Stance & kill switches

**Stance (2026-09-05, date `estimate`):** **stand aside, permanently and structurally.** No position,
no play, no size, in any branch — this row exists to hold three corrections, one refusal and one
null, not a view.

First, **the scope correction, inherited from the Japan lane and re-verified here.** SIFMA's page
states verbatim that its recommendations cover *"the trading of **U.S. dollar-denominated**
government securities…"*, so the **U.K. panel is a time zone, not an asset class**: this is the
London session of the **US dollar** bond market, and **gilts are out of scope entirely**. The panel's
composition corroborates it — **9 of its 18 2026 cards are US-only holidays**, so SIFMA shuts
London's dollar desk for Martin Luther King Day, and 2026-05-25 gets two cards for one date.

Second, **the redundancy correction, which is what this row uniquely earns.** Unlike
[`sifma-bond-market-closure-2026-11-11`](sifma-bond-market-closure-2026-11-11.md) and
[`sifma-bond-market-closure-2026-10-12`](sifma-bond-market-closure-2026-10-12.md), where NYSE trades
a full session and the card *is* the information, **2026-12-28 is a statutory England-and-Wales bank
holiday** (`gov.uk`: `Boxing Day | Substitute day`) and London is dark regardless — `^FTSE` printed
**no bar on 37 of 37** gov.uk weekday bank holidays that were New York sessions since 2019. **The
U.K. card is the cause of this calendar's Japan entry, not news of its own.** Adjacent structure:
the U.K. panel is the strictest of the three, **36 of 36 cards full closures with zero early
closes**, so Good Friday is a 12:00 ET half day in New York and a full closure in London.

Third, **the measured answer is a triple null, and the contrast with the 11-11 sibling is the
deliverable.** Three independent attributions were tried on US-listed proxies and **all three
fail**: the EWU−SPY volume gap (+0.162 raw, +0.118 against a month-and-weekday-matched control,
**permutation p = 0.096**); EWU's volatility compression (0.864×, t = −2.85 unpaired — but
**−0.086, p = 0.337** paired against EWJ, whose Tokyo underlying is open, while **FXB**, whose
market never closes, compresses *most* at 0.802×); and EWU's incremental information about the FTSE
reopen (**b = 0.064, t = 0.48**, R² 0.131 → 0.133, with SPY's sign agreement of 58.7% *beating*
EWU's 55.9%). `^GSPC` itself is flat (0.702% vs 0.745% month-matched, **t = −0.64**). The same
design on the 11-11 date produced a TLT−SPY gap of **−0.287** (16 of 18, replicated on Columbus Day)
— so the correct reading is structural: **a closure thins an ETF when the ETF's own users are also
on holiday, and not when a foreign market is dark while New York works.** Do **not** carry the
11-11 execution guard here.

Fourth, **the one directional-looking result is refused as a mined slot.** EWU closed down **8 of 8**
on the Dec-28 analogues (p = 0.0039 alone) — but across all 143 London-shut sessions it is up
**51.7%**, across the 36 dead-week ones **52.8%**, and 1 of only 3 month-day slots with n ≥ 6 shows a
perfect run. It is registered to accumulate out-of-sample n, never sized.

Every statement here carries the event's **`estimate`** label, and its source is non-binding by its
own terms.

**Kill switches:**

- **Scope kill:** SIFMA publishing a U.K.-panel scope statement naming **sterling-denominated**
  instruments, or a primary showing the recommendation reaches gilt trading. Legs 2, 5 and 6
  collapse and the entry's original "UK fixed-income market" reading is restored. Re-check every pulse.
- **Redundancy kill (registered):** `^FTSE` printing a bar on **2026-12-28**, or gov.uk moving or
  removing the Boxing Day substitute. Leg 4 — the load-bearing correction — dies, and this card
  becomes a genuine cross-asset split like its US-panel siblings. Registered as
  **FT-sifma-uk-bond-market-closure-2026-12-28-1**, score by **2026-12-30**.
- **Volume-null kill (registered):** EWU's **2026-12-28** volume ratio coming in **below** SPY's.
  Leg 11's point estimate — the one attribution with a consistent direction (7 of 8 analogues, 92 of
  140 pooled) — reverses on the instance that matters. Registered as
  **FT-sifma-uk-bond-market-closure-2026-12-28-2**, score by **2026-12-31**, at **Medium** because
  the matched control never cleared significance.
- **Mined-slot kill (registered):** EWU closing **down** again on **2026-12-28**, taking the Dec-28
  run to 9 of 9. Leg 13's refusal takes its first out-of-sample hit. Registered at **Low**
  confidence as **FT-sifma-uk-bond-market-closure-2026-12-28-3**, score by **2026-12-31** — the base
  rate is 51.7% and this row exists to burn the slot's n, not to call a coin flip.
- **Recommendation kill (registered):** the U.K.-panel card being **removed, re-dated, or changed to
  `None`** on a re-fetch before **2026-12-24** — the treatment SIFMA's own 2027 U.K. panel already
  gives this exact holiday (leg 7). Registered as **FT-sifma-uk-bond-market-closure-2026-12-28-4**.
- **Strictness-rule kill:** SIFMA publishing an `Early Close` note on any U.K. card, in either year.
  Leg 5's 36-of-36 rule breaks and the "London never gets a half day" framing needs re-deriving.
  Re-check every pulse.
- **Proxy kill:** a gilt cash tape, an MTS schedule, or a London USD-bond volume series becoming
  reachable and showing a measurable 12-28-shaped effect. Legs 8-13 are a US-listed **equity proxy**
  for a London dollar-bond question and would be superseded rather than patched.
- **Contrast kill:** the 11-11 sibling's own forward tests (**FT-sifma-bond-market-closure-2026-11-11-1/-2**)
  scoring as kills. Leg 12's structural explanation rests on that finding being real; if the
  half-depth signature fails out of sample, the contrast drawn here has nothing to contrast against.
- **Relevance kill (upward):** a house playbook keyed to session hours, foreign holidays or fixed
  income being written and back-tested, or this repo tracking a UK-listed symbol. Leg 14 goes stale
  and the stand-aside must be re-argued on measured data rather than on absence.

Four forward tests registered in
[`forward-tests/sifma-uk-bond-market-closure-2026-12-28.md`](../forward-tests/sifma-uk-bond-market-closure-2026-12-28.md)
— **-1** (the redundancy correction), **-2** (the volume point estimate), **-3** (the mined slot's
out-of-sample n) and **-4** (the recommendation's own durability). One dated adjacent event
discovered in-sweep is proposed as `estimate` in the same PR:
`sifma-uk-bond-market-closure-2027-03-29` — this event's exact configuration recurring on a date the
calendar already tracks two of its *consequences* for, without their cause. Recorded but **not**
proposed: the 2027-05-03 U.K. May Day closure (real, same shape, nothing co-dated).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-114 | **Initial research.** **Scope (verbatim, re-extracted from SIFMA HTTP 200, 298,926 B, parsed twice — DOM by `<h2>` offsets 36,537/47,499/60,383 giving 13 US / 18 UK / 35 JP 2026 cards, then 127 cards out of the embedded flight payload where the 2027 panels live):** *"All SIFMA holiday recommendations apply to the trading of **U.S. dollar-denominated** government securities…"* — the **U.K. panel is a time zone, not an asset class**; **gilts are out of scope**. Card 17 reads exactly `Boxing Day (Substitute)` / `Monday, December 28, 2026`, **no** early-close note. **Headline correction — this card is REDUNDANT with statute, unlike its US-panel siblings.** gov.uk (HTTP 200, 22,207 B) dates `2026-12-28 | Boxing Day | Substitute day`; measured, `^FTSE` printed **no bar on 37 of 37** gov.uk weekday bank holidays that were NY sessions since 2019 (detector = `^GSPC` bar, no `^FTSE` bar: **37/38 precision, 37/37 recall**; the one false positive, 2020-12-22, is the same Yahoo gap the [Japan sibling](sifma-japan-early-close-2026-12-28.md) found from a different index pair). So London is dark by act of Parliament; SIFMA adds nothing. **LSE's own calendar closed as NOT FETCHABLE** — `londonstockexchange.com/equity-trading/business-days` HTTP 200, 54,995 B, client-rendered Angular, body strips to **5 text cells, zero dates** — answering the Japan lane's open note empirically instead. **Structure, new:** the U.K. panel is the **strictest of the three — 36 of 36 cards across both years are full closures, zero `Early Close` strings** (US 2026: 8; Japan 2026: 2), so Good Friday 2026-04-03 is a **12:00 ET half day in NY and a full closure in London**. And **9 of the 18 U.K. 2026 cards are US-only holidays** (MLK…Thanksgiving) against 9 gov.uk statutory; **2026-05-25 gets two cards** (Memorial Day + Spring Bank Holiday). **Measured (Yahoo daily bars w/ volume: `^FTSE` 9,264 and `^GSPC` 9,237 valid bars, both reproducing the Japan sibling exactly; SPY 8,458; EWU/EWJ 7,667; FXB 5,081; FLGB 2,219; TLT/LQD 6,065) — a TRIPLE NULL, all three attributions failing a control:** (1) **`^GSPC`** on 170 London-shut/NY-open sessions **0.702%** mean \|c2c\| vs 0.745% month-matched, **t = −0.64**; (2) **volume** — EWU **0.961×** trailing-20 median vs SPY **0.777×** (paired gap **+0.162**, placebo −0.036; FLGB +0.326; EWJ, open-underlying control, +0.020) but against month+weekday-matched Mondays the median-gap difference is **+0.118, permutation p = 0.096** (5,000 resamples, n=140 vs 971) and the means run the other way; (3) **volatility** — EWU move-ratio **0.864×** vs 0.993× (t = −2.85) looks like the dark-underlying story, but **EWU−EWJ paired = −0.086, 74/142, p = 0.337**, and **FXB — whose FX market never closes — compresses MOST (0.802×, t = −4.43)**; (4) **price discovery REFUTED** — FTSE_next = a + **0.334**·SPY (t = 2.89) + **0.064**·EWU (**t = 0.48**), R² **0.131 → 0.133**; SPY's sign agreement **58.7%** beats EWU's **55.9%**. (The cleaner opening-gap test is **unmeasurable**: Yahoo reports `^FTSE` open = prior close on **6,661/9,263** sessions.) **The contrast IS the deliverable:** the [11-11 sibling](sifma-bond-market-closure-2026-11-11.md) ran this same design and found TLT−SPY **−0.287** (16/18, p = 0.0007, replicated on Columbus Day at −0.346). **A closure thins the wrapper when the ETF's own users are also on holiday; not when a foreign market is dark while New York works.** TLT/LQD gaps here: −0.008 / +0.067, i.e. nothing. **Mined slot REFUSED:** EWU down **8 of 8** on Dec-28 analogues (p = 0.0039 alone, mean −0.29%) — but up **51.7%** across all 143 London-shut sessions, **52.8%** across the 36 dead-week ones, and **1 of only 3** month-day slots with n ≥ 6 shows a perfect run. **Live falsifier on the page itself:** the **2027 U.K.** panel reads `Christmas Day` / **`Friday, December 24, 2027`** and `Boxing Day` / **`None`** while gov.uk dates statutory substitutes on **2027-12-27 and 2027-12-28** — but it also lists Juneteenth on a **Saturday** and July 4 on a **Sunday** unshifted (the U.S. panel shifts both), so it reads loosely maintained; **no U.K. card in either year carries a tentative flag**, where every 2027 Japan card does. Adjacency — **peers:** none (`symbols: []`); `earnings-calendar.ts` has **no print after 2026-11-10**. **Macro:** 15 other tracked events within ±5d — PCE (confirmed, high) + GDP Q3 third + durable goods + BoJ Oct Minutes 12-23 · half day 12-24 (**London a full normal session**) · Tokyo CPI flash 12-25 · **12-28 this + SIFMA Japan + BoJ SoO + Advance Economic Indicators** · **FOMC minutes 12-30 (confirmed)** · five items 12-31. **Volatility:** VIX **14.53** (2026-09-04 close); `^FTSE` 10,831.10, `^GSPC` 7,718.60, SPY 770.19, EWU 48.59. **Geopolitical:** nothing touching this event. **Tape:** London reopens Tue 12-29. **Proposes** `sifma-uk-bond-market-closure-2027-03-29.json` (`estimate`) — this exact configuration recurring on a date the calendar already tracks two *consequences* of (`sifma-japan-early-close-2027-03-29`, `boj-summary-of-opinions-2027-03-29`) without their cause. Recorded not proposed: the 2027-05-03 U.K. May Day closure (nothing co-dated). **Own weaknesses:** every measured leg is a US-listed **equity** proxy for a **London dollar-bond** question — no gilt/MTS/London-USD-volume series reachable; the FTSE opening gap is unmeasurable in this data; leg 11's p = 0.096 is a near miss at n=140, not a proven zero; pre-2019 closures inferred from missing bars; SIFMA's **archive not fetched**, so its 2020-12-28 London recommendation is unknown; CME not re-attempted (403s across every prior sibling). Own entry's title and `notes` amended in this PR. | Initial stance set: **stand aside** (structural row only). Three corrections banked — **scope** (USD-denominated, so the U.K. panel is a time zone and gilts are out of scope), **redundancy** (London is shut by statute on 12-28, so unlike the 11-11/10-12 US closures this card creates no cross-asset split and is the Japan entry's *cause*, not news), and **strictness/composition** (36 of 36 U.K. cards are full closures, zero early closes; 9 of 18 are US-only holidays) — plus a **triple measured null** (`^GSPC` t = −0.64; volume p = 0.096 matched; volatility p = 0.337 paired vs EWJ, with FXB compressing most; EWU's FTSE-reopen increment t = 0.48) and a **refused mined slot** (EWU 8/8 down on Dec-28 vs 51.7% up across all 143 London-shut sessions). **Explicitly declines to import the 11-11 half-depth execution guard.** Registers **FT-sifma-uk-bond-market-closure-2026-12-28-1/-2/-3/-4**. | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
