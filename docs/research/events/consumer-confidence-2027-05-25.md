# Conference Board Consumer Confidence (May 2027) — consumer-confidence-2027-05-25

**Kind:** macro-print · **Date:** 2027-05-25 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session against three primary-sourced May editions — 2023-05-30, 2024-05-28, 2025-05-27 — every one the last Tuesday of its May, and all three double-sourced by the preceding April edition's own next-release line) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["fomc-blackout-start-2027-05-29","opex-2027-05-21","sifma-bond-early-close-2027-05-28"],"screenStreak":0,"blocked":[{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-May-2021","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-May-2022","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-May-2026","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/","status":"429","at":"2026-09-06"},{"url":"https://www.theocc.com/","status":"403","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The thing that makes the May print different is not the Fed — it is Memorial Day, and 2027 is
the year the geometry breaks.** This id was filed as the clean counterpart to the
[April collision print](consumer-confidence-2027-04-27.md), and it is clean: the Fed's posted 2027
calendar runs April 27-28 then June 8-9, so **May 2027 carries no FOMC meeting at all** — this print
sits 27 days after the April decision, 14 days before the June day one, and its rule-derived field
window closes 11-12 days before the next blackout opens. That is the cleanest Fed geometry in the
whole chain. But cleaning the Fed out reveals what was underneath: **in 5 of the 6 May prints on the
tape (2022-2026) the last Tuesday of May IS the session immediately after Memorial Day.** 2027 is not
— Memorial Day falls on **2027-05-31**, six days *after* the print, a geometry that occurs in only
**11 of 71 years (15.5%)**, and 2021 was the last one. So the historical May sample is 83% a session
type 2027 will not be. **The good news, measured rather than assumed: that composition difference has
no channel.** Tuesday-after-a-Monday-holiday sessions run **0 of 9** against ordinary Tuesdays
(n=31 vs 269, smallest p **0.3355**) and 0 of 9 against all other sessions. Second job: **May is the
calendar's cleanest null** — the only month of twelve that is 0 of 9 on *both* the month-level control
(SPY **0.984/0.969**, p=**0.9445**, smallest p across the nine **0.0902**, 4.6× the next-flattest
month) and the position-in-month control (last-5 vs earlier May, 0 of 9). Which is exactly why, **contra
the proposal that filed this id, May is the WEAKEST remaining test of the March week-level control rule,
not the sharpest** — a month with no width signature cannot discriminate "the rule is right" from "both
arms are underpowered." The rule's real outstanding test is **December (7 of 9, all narrowing late)**.
Date **estimate**; `symbols: []`; **0** macro-keyed playbooks.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-261) | **Stand aside** | High | `symbols: []`, D-261, the May panel does not open for eight months, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-05-25** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026, released 08-25**: headline **89.4**, Present Situation **121.2**, Expectations **68.2**, survey period **Aug 3–16**; the page names **2026-09-29** as the next release. Market state **2026-09-04**: VIX **14.53**, SPY **770.19**. | The Conference Board naming a May 2027 date other than **2027-05-25** before **2027-05-04**, which breaks the May rule this doc's date rests on |
| This month | **Stop reading the May CB null as a description of 2027 — 5 of its 6 observations are post-Memorial-Day reopens and 2027 is not one** | Medium | 2022-05-31, 2023-05-30, 2024-05-28, 2025-05-27 and 2026-05-26 all follow Memorial Day; only 2021-05-25 shares 2027's shape. The geometry flips only when May 31 is a Monday — **11 of 71 years**. The saving grace is measured: the reopen class is **0 of 9** vs ordinary Tuesdays (n=31/269). | Tuesday-after-a-Monday-holiday sessions clearing p<0.05 on 2+ of 9 against ordinary Tuesdays, on a re-run of the same pipeline after **2027-12-31** |
| This quarter | **May confirms the week-level control rule's scope condition but cannot test it — send the real test to December** | Medium | May is 0 of 9 on both controls because it is 0 of 9 on *everything*; agreement between two null arms is not evidence. December carries the sample's strongest position signature — **7 of 9 all narrowing late** (AAPL p=0.0007, AMZN p=0.0013, XLF p=0.0013) — ahead of March's 6 of 9. | December's last-5-vs-earlier scan falling below 4 of 9, or May CB days clearing p<0.05 against **either** other May or other late-May sessions, on a re-run after **2027-07-31** |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and the release day is null against every control run here.
- **The Conference Board names a May 2027 date** → adopt it verbatim. The rule says **05-25**;
  registered as **FT-consumer-confidence-2027-05-25-1**.
- **Do not carry the May CB "null" forward to 2027 without the holiday caveat.** The sample is 5-of-6
  post-Memorial-Day; 2027 is an ordinary Tuesday. Registered as **FT-consumer-confidence-2027-05-25-2**.
- **Classify a holiday reopen by a calendar gap of ≥ 4 days, never ≥ 3.** A normal Fri→Mon weekend *is*
  a 3-day gap, so a `≥3` filter returns the **Monday effect** (4 of 9, SPY 0.880/0.991, p=0.0066…0.0081)
  wearing a holiday costume. Registered as **FT-consumer-confidence-2027-05-25-3**.
- **Send the week-level control rule's next test to December, not to another flat month.** Registered as
  **FT-consumer-confidence-2027-05-25-4**.
- **Read the May edition's stated cut-off date first** — May's own sourced lags are **8 / 7 / 8** days
  (longer than April's 6/6/8), putting a 2027 cut-off at **05-17 → 05-18**, entirely clear of
  `fomc-blackout-start-2027-05-29`. Registered as **FT-consumer-confidence-2027-05-25-5**.
- **Read the level, never the month-over-month delta** — May restates April in **3 of 3** sourced
  editions, and `CCI-May-2023` revised April's headline **101.3 → 103.7, +2.4 points**, the largest
  headline revision this chain has measured. Registered as **FT-consumer-confidence-2027-05-25-6**.
- **Check whether the panel straddled a dated policy event before reading the month-over-month move.**
  `CCI-May-2025` is the only edition in the chain where the publisher splits its own panel on one
  ("about half of the responses were collected after the May 12 announcement of a pause on some tariffs
  on imports from China") — and that edition carries the largest Expectations jump in the sourced record,
  **+17.4**. Registered as **FT-consumer-confidence-2027-05-25-7**.
- **Expectations back above 80** → the Board's own recession threshold, below which all three sourced
  Mays printed (71.5 / 74.6 / 72.8), clears; the late-cycle framing this series carries dies.
  Registered as **FT-consumer-confidence-2027-05-25-8**.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **2026-09-16** · CB print **2026-09-29** · CPI **2026-10-14** · FOMC
  **2026-10-28** · CB print **2026-11-24** (est.) · FOMC **2026-12-09** · CB print **2026-12-22**
  (est.) · **FOMC 2027-01-27** (est.) · **FOMC + SEP 2027-03-16/17** (est.) · CB print + FOMC day one
  **2027-04-27** (est.) · **FOMC decision 2027-04-28** (est.) · VIX expiration **2027-05-18** (conf.) ·
  opex **2027-05-21** (est., proposed this PR) · **this print 2027-05-25** (est.) · SIFMA early close
  **2027-05-28** (est.) · **blackout begins 2027-05-29** (est.) · Memorial Day closure **2027-05-31**
  (est.) · **FOMC + SEP 2027-06-08/09** (est.) · CB print **2027-06-29** (est., proposed this PR).

## Initial research

### The question, plainly

The [April sibling](consumer-confidence-2027-04-27.md) filed this id for two jobs. It is **the clean
counterpart**: 2027-04-27 was FOMC day one, 2027-05-25 has no Fed meeting anywhere near it, and two
consecutive editions four weeks apart in one regime is the tightest within-year collision control this
chain has had. And it is **the position-in-month rule's flat-month test**: the proposal argued that
because May is the flattest month in the sample, it is "the strongest remaining test" of the
[March sibling](consumer-confidence-2027-03-30.md)'s rule that a fixed-position monthly release must be
controlled against the same *week* of its month.

So: **is the May date sound, is the print really clean, and is a flat month actually a test of anything?**
And — the question neither sibling thought to ask, because April has no holiday in it — **what else is
structurally true of the last Tuesday of May?**

**One-line verdict:** the date is well-sourced for an `estimate` (three primary-sourced Mays, all three
double-sourced), the print is clean by a wider margin than the proposal claimed, the flat-month test is
**backwards** — May is the *least* discriminating site, not the sharpest — and the structural feature
nobody had looked for is **Memorial Day**: five of the six May prints on the tape are the session
immediately after it, 2027 is one of the 15.5% of years where it is not, and that difference is
measurably immaterial.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Publisher sources fetched direct 2026-09-06**, all HTTP 200 and each
verified against its own `Source: <Month> <Year> Consumer Confidence Survey` line and its `Updated:` date
rather than trusted by slug: `conference-board.org/topics/consumer-confidence` (the cadence sentence, the
named next release, the August 2026 values) and the publisher's `CCI-May-2023`, `CCI-May-2024`,
`CCI-May-2025`, `CCI-Apr-2023`, `CCI-Apr-2024` and `CCI-Apr-2025` pages. **The FOMC dates are primary:**
`federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, **164,831 bytes** — byte-identical to
the April sibling's fetch — parsed in full including the `Future Year: 2027` panel. **The expiration
dates are primary:** Cboe's `www-api.cboe.com/us/futures/market_statistics/settlement/csv`, fetched for
two separate settlement dates (2026-09-04 and 2026-09-03, HTTP 200, 1,731 and 1,733 bytes). **Three May
slugs failed the way every sibling warned:** `CCI-May-2021`, `CCI-May-2022` and `CCI-May-2026` each
returned **HTTP 200 while serving the current August 2026 edition** (byte-identical at 332,031), recorded
in `probe-ref.blocked` as `200-SERVED-CURRENT-EDITION`.

**The tape.** Yahoo's chart endpoint answered a single manual probe at HTTP 200 and then **429'd every
programmatic request** across six backoffs per symbol (the sibling matrix jobs share this runner's IP) —
recorded in `probe-ref.blocked`. Equity and ETF daily OHLC therefore come from **stockanalysis.com** and
VIX from **CBOE's own `VIX_History.csv`**, the identical vendor pair the April sibling was forced onto,
which makes this session's numbers directly comparable to that one rather than to the Yahoo-era siblings.
Everything else is unchanged: SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF, TLT and VIX for **2020-12-01 →
2026-09-04** (n=**1,447** sessions — the April sibling's count exactly), session range
`(high − low) / open`, two-sided Mann-Whitney U with tie correction, VIX measured on close. Market
readings: **2026-09-04 closes, SPY 770.19 and VIX 14.53.**

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for May — SUPPORTED three-for-three, and all three are
   double-sourced.** The publisher states, fetched today: *"The Conference Board publishes the Consumer
   Confidence Index® at 10 a.m. ET on the last Tuesday of every month."* For December that is refuted on
   five consecutive editions ([12-22 sibling](consumer-confidence-2026-12-22.md) leg 1); January holds
   five-for-five, February four-for-four, March and April three-for-three. For May:

   | Edition | Released | Weekday | Last Tuesday of that May | Sources |
   |---|---|---|---|---|
   | May 2023 | 2023-05-30 | Tue | 05-30 | the edition's own `Updated : 2023-05-30` **and** `CCI-Apr-2023`'s *"The next release is Tuesday, May 30 at 10 AM ET"* |
   | May 2024 | 2024-05-28 | Tue | 05-28 | `Updated : 2024-05-28` **and** `CCI-Apr-2024`'s *"Tuesday, May 28th"* |
   | May 2025 | 2025-05-27 | Tue | 05-27 | `Updated : 2025-05-27` **and** `CCI-Apr-2025`'s *"Tuesday, May 27th"* |

   **2027-05-25 is the last Tuesday of May 2027.** June is a bonus three-for-three from the same fetches
   (`CCI-May-2023` → *"Tuesday, June 27"*; `CCI-May-2024` → *"June 25th"*; `CCI-May-2025` → *"June
   24th"*) — which is what sources one of this PR's two proposals. Registered as
   **FT-consumer-confidence-2027-05-25-1**.

2. **The pipeline replicates the April sibling EXACTLY, 9 of 9 — and this is what licenses everything
   below.** On the identical window the 68 rule-derived CB days split **51 clean / 17 colliding**, the
   collisions are **17 day-ones and 0 decision days**, and the clean set's medians reproduce the April
   sibling's published table **to three decimals on all nine instruments**: SPY **0.911**, QQQ **1.379**,
   XLY **1.397**, XRT **1.687**, AMZN **2.154**, AAPL **1.731**, XLF **1.119**, TLT **0.961**, VIX close
   **18.560** — **0 of 9**, smallest p XLF **0.2712** (published 0.2713). Clean-day SPY close-to-close is
   **+0.090% median, 29 of 51 up**, character-for-character the February and April siblings' figure. The
   April sibling's own 108-test month-vs-rest-of-year scan (its leg 8) also reproduces row for row:
   Mar 9, Aug 9, Apr 6, Dec 6, Jul 5, Feb 4, Jan/Sep/Nov 3, May/Jun/Oct 0-1.

   **A method trap caught in passing, and worth the chain's time.** The Fed calendar renders its three
   cross-month meetings with **abbreviated** labels — `Jan/Feb 31-1`, `Apr/May 30-1`, `Oct/Nov 31-1`. A
   full-month-name regex does not fail on these; it silently matches only the second half, which drops
   the three real collisions (2023-01-31, 2023-10-31, 2024-04-30) **and fabricates a nonexistent
   2024-05-30 FOMC meeting**. This session's first pass did exactly that and produced a plausible-looking
   51→54 clean / 17→14 collision split with medians a full third-decimal off. The tell was the
   replication check, not the code. Any lane parsing that page should assert the collision count is 17
   before trusting anything downstream.

3. **THE FINDING — the May print's structural feature is Memorial Day, not the Fed, and 2027 breaks the
   geometry.** Every sibling in this chain has asked what the *Fed* is doing on a CB print day. For May
   the answer is "nothing" (leg 4). What nobody checked is the holiday, and the arithmetic is stark:
   Memorial Day is the **last Monday** of May, and the print is the **last Tuesday** — so unless the last
   Monday is May 31 itself, the print is the very next session.

   | Year | Memorial Day (last Mon) | CB print (last Tue) | Relationship |
   |---|---|---|---|
   | 2021 | 2021-05-31 | **2021-05-25** | print **precedes** the holiday by 6 days |
   | 2022 | 2022-05-30 | 2022-05-31 | the session **immediately after** Memorial Day |
   | 2023 | 2023-05-29 | 2023-05-30 | the session **immediately after** Memorial Day |
   | 2024 | 2024-05-27 | 2024-05-28 | the session **immediately after** Memorial Day |
   | 2025 | 2025-05-26 | 2025-05-27 | the session **immediately after** Memorial Day |
   | 2026 | 2026-05-25 | 2026-05-26 | the session **immediately after** Memorial Day |
   | **2027** | **2027-05-31** | **2027-05-25** | **print precedes the holiday by 6 days** |

   **Five of six.** The exception happens exactly when May 31 is a Monday, which over **1990–2060 occurs
   in 11 of 71 years (15.5%)** — 1993, 1999, 2004, 2010, 2021, **2027**, 2032, 2038, 2049, 2055, 2060.
   So the entire measured history of this print is 83% drawn from a session type 2027-05-25 will not be,
   and the one prior observation that shares 2027's shape is **2021-05-25** — a single session, which is
   an anecdote, not a control.

4. **And the composition difference has NO measured channel — SUPPORTED, 0 of 9.** The finding above
   would be alarming if the session type mattered. It does not. Isolating the exact class — a Tuesday
   session opening after a Monday holiday, n=**31** across the window:

   | Comparison | Result | SPY | smallest p |
   |---|---|---|---|
   | Tuesday-after-a-Monday-holiday vs **ordinary Tuesdays** (n=31 vs 269) | **0 of 9** | 0.874 / 0.951, p=0.9486 | AAPL 0.3355 |
   | Tuesday-after-a-Monday-holiday vs **all other sessions** (n=31 vs 1,416) | **0 of 9** | 0.874 / 0.973, p=0.6256 | XLY 0.4113 |
   | Any post-long-weekend reopen vs all other sessions (n=43 vs 1,404) | **0 of 9** | 0.911 / 0.976, p=0.5354 | AAPL 0.2495 |
   | The 5 post-Memorial May CB days vs other Tuesday-holiday reopens (n=5 vs 26) | **0 of 9** | 0.911 / 0.853, p=1.0000 | TLT 0.1470 |
   | The 5 post-Memorial May CB days vs ordinary Tuesdays (n=5 vs 269) | **0 of 9** | 0.911 / 0.951, p=0.9070 | TLT 0.3547 |

   **So the honest statement is a widening of uncertainty, not a warning:** the sample composition does
   change in 2027, and the best available measurement says it does not matter. What must not happen is
   the May null being quoted forward as though the two session types were interchangeable *by assumption*
   — it is interchangeable **by measurement**, at n=31, which is a real but not a large sample. Registered
   as **FT-consumer-confidence-2027-05-25-2**.

5. **A near-miss the chain should not repeat — a `≥3 calendar-day gap` is not a long weekend, it is a
   Monday.** This session's first cut of leg 4 classified holiday reopens as any session following a gap
   of ≥ 3 calendar days and found a large, well-powered, correctly-signed result: **5 of 9 narrower**
   (SPY **0.877 / 0.995**, p=**0.0066**; TLT 0.0076; QQQ 0.0107; XRT 0.0368; XLY 0.0454) at n=300. It
   would have been written up as "the May CB sample is drawn from a measurably quieter session type."
   **It is the Monday effect.** A normal Friday→Monday weekend *is* a three-calendar-day gap, so 269 of
   those 300 sessions are ordinary Mondays, and Mondays alone run **4 of 9 narrower** (SPY 0.880 / 0.991,
   p=**0.0081**; QQQ 0.0093; TLT 0.0108; XRT 0.0393). Requiring **≥ 4 days** cuts the class to n=43 and
   the result to **0 of 9**. The standing rule: classify a holiday reopen by a gap of **at least four**
   calendar days, and always report the weekday mix of the resulting set. Registered as
   **FT-consumer-confidence-2027-05-25-3**.

6. **The print is clean by a wider margin than the proposal claimed — SUPPORTED.** Per the Fed's posted
   calendar, 2027 runs **January 25-26, March 16-17\*, April 27-28, June 8-9\*, July 27-28,
   September 14-15\*, October 26-27, December 7-8\*** — **no May meeting at all**. Nor has a May CB print
   ever collided: all six on the tape are no-Fed sessions, because when a May meeting exists the FOMC
   places it in the month's first week (2022-05-03/04, 2023-05-02/03, 2024-04-30/05-01, 2025-05-06/07)
   while the last Tuesday sits in the fourth or fifth. The 2027 spacing:

   | | 2027 |
   |---|---|
   | April decision → print | **27 days** after |
   | Print → June day one (SEP meeting) | **14 days** before |
   | Print → `fomc-blackout-start-2027-05-29` | **4 days** before |
   | Field window (rule-derived, leg 7) | ~**05-03 → 05-17/18**, closing **11-12 days before** blackout |

   So where the April sibling's edition fielded *through* a blackout and printed on FOMC **day one**,
   this one fields and prints entirely inside an **open Fed communication window** with no decision in the
   corridor either side. That is the cleanest Fed geometry in the chain, and it is what makes this the
   series' honest baseline edition.

7. **May's own cut-off lags are LONGER than April's — SUPPORTED, and this refines the proposal rather
   than correcting it.** The proposal projected a 2027 field window from *April's* sourced lags (6/6/8).
   May's own, read off the three sourced editions:

   | Edition | Released | Stated cut-off | Lag |
   |---|---|---|---|
   | May 2023 | 2023-05-30 | *"cutoff date for the preliminary results was May 22"* | **8 days** |
   | May 2024 | 2024-05-28 | *"cutoff date for the preliminary results was May 21"* | **7 days** |
   | May 2025 | 2025-05-27 | *"cutoff date for preliminary results was May 19, 2025"* | **8 days** |

   Applied to 2027-05-25 that puts the cut-off at **05-17 or 05-18** and, using the sixteen-day field
   length `CCI-Apr-2023` states explicitly, the window at roughly **05-03 → 05-17/18**. The proposal's
   endpoint was right by coincidence (it applied an 8-day lag it had sourced from April); the number is
   now May's own. Either way the conclusion strengthens: the panel closes **11-12 days before** the
   blackout opens. Registered as **FT-consumer-confidence-2027-05-25-5**.

8. **May is the calendar's cleanest null — SUPPORTED, 0 of 9 on every control run.** Against the rest of
   the year, all **126** May sessions print **0 of 9** (SPY **0.984 / 0.969**, p=**0.9445**), and the
   smallest p across the nine is **0.0902** (TLT). That is not merely "no hits": running the same test on
   all twelve months, **May is the only month with zero hits AND no instrument even approaching
   significance** — the next-flattest month, February, has a smallest p of 0.0197, and every other month
   carries at least one leg under 0.05. The six May CB days then land null against every control:

   | Control | Result | SPY | smallest p |
   |---|---|---|---|
   | vs **other May** sessions (month-level, n=6 vs 120) | **0 of 9** | 0.823 / 0.997, p=0.8099 | TLT 0.4030 |
   | vs **other late-May** sessions (week-level, n=6 vs 24) | **0 of 9** | 0.823 / 0.783, p=0.6783 | XLF 0.1776 |
   | vs all other sessions (n=6 vs 1,441) | **0 of 9** | 0.823 / 0.970, p=0.7750 | QQQ 0.4164 |

   **And the directional test is null too** — the one that produced the April sibling's declined
   p=0.0183. May CB days run SPY **+0.054% close-to-close, 4 of 6 up**, against other late-May sessions
   at +0.224% (**p=1.0000**) and other May sessions at +0.113% (**p=0.8010**). That is an independent
   corroboration of the April lane's multiple-comparisons refusal from a sibling month: if April's
   −1.035% were a real seasonal artifact of the release, May would be the first place to look for a
   cousin, and there is nothing there.

   | | 2021-05-25 | 2022-05-31 | 2023-05-30 | 2024-05-28 | 2025-05-27 | 2026-05-26 |
   |---|---|---|---|---|---|---|
   | SPY range % | 0.735 | 1.555 | 0.911 | 0.641 | **2.198** | 0.501 |
   | SPY close-to-close % | −0.222 | −0.561 | +0.038 | +0.070 | **+2.079** | +0.664 |
   | VIX close | 18.84 | **26.19** | 17.46 | 12.92 | 18.96 | 17.01 |
   | Post-Memorial? | **no** | yes | yes | yes | yes | yes |

9. **THE PROPOSAL CORRECTION — a flat month is the WEAKEST test of the week-level control rule, not the
   strongest.** The proposal that filed this id argued that because May has no width signature, it is
   *"where the two controls should be indistinguishable if the rule is right, and where a divergence
   would be the rule's clearest falsifier."* The first clause is correct and confirmed — May's last-5
   sessions vs earlier May is **0 of 9** (SPY 0.783 / 1.037, p=0.1710; smallest p AAPL 0.1426), so the
   month-level and week-level controls agree, exactly as the rule predicts. The inference is what fails.
   **In a month with no position signature, both control arms return 0 of 9 whether the rule is right or
   wrong**, because there is no difference for them to disagree about; the test's power to produce the
   claimed falsifier is close to nil. Confirming a scope condition is worth doing — the April sibling did
   it on a flat month too — but it is not a test of the rule, and this ledger declines to bank it as one.

   **Where the real test lives, measured.** Running last-5-vs-earlier across all twelve months:

   | Month | Hits (of 9) | Direction | SPY last-5 / earlier | p |
   |---|---|---|---|---|
   | **December** | **7** | all narrowing late | 0.777 / 0.922 | 0.0681 |
   | **March** | **6** | all narrowing late | **1.019 / 1.366** | **0.0033** |
   | Jan · Feb · Apr | 2 | **sign splits** | — | 0.10 → 0.80 |
   | Jun · Aug · Nov | 1 | — | — | 0.20 → 0.47 |
   | **May · Jul · Sep · Oct** | **0** | — | May 0.783 / 1.037 | 0.17 → 0.88 |

   **December carries the strongest position signature in the sample — 7 of 9, all narrowing late
   (AAPL p=0.0007, AMZN p=0.0013, XLF p=0.0013, XRT p=0.0083, VIX p=0.0177, QQQ p=0.0268, XLY p=0.0483)
   — ahead of the March month the rule was derived on.** That is where a week-level control could
   actually diverge from a month-level one, and it is the chain's outstanding test. It is also, piquantly,
   the one month where the last-Tuesday release rule is itself refuted (the 12-22 sibling, five
   consecutive editions), so the December lane has to derive its release date before it can run the test.
   Registered as **FT-consumer-confidence-2027-05-25-4**.

10. **The revision rule extends to a fifth consecutive month, and May holds the chain's largest HEADLINE
    revision — SUPPORTED, 3 of 3.** January's sibling measured it on January, February's on February,
    March's on March, April's on April. May restates April just as reliably:

    | April, as first printed | Restated in the May edition | Revision |
    |---|---|---|
    | Apr 2023 **101.3 / 151.1 / 68.1** | `CCI-May-2023`: *"down from an upwardly revised 103.7 in April"*, PS *"from 151.8 last month"*, Exp *"from 71.7"* | **+2.4** / +0.7 / **+3.6** |
    | Apr 2024 **97.0 / 142.9 / 66.4** | `CCI-May-2024`: *"from 97.5 in April (a slight upward revision)"*, PS *"from 140.6 in April"*, Exp *"from 68.8 last month"* | +0.5 / **−2.3** / **+2.4** |
    | Apr 2025 **86.0 / 133.5 / 54.4** | `CCI-May-2025`: *"up from 85.7 in April"*; PS *"rose 4.8 points to 135.9"*; Exp *"surged 17.4 points to 72.8"* | −0.3 / **−2.4** / +1.0 (last two derived) |

    **The `CCI-May-2023` headline revision, 101.3 → 103.7, is +2.4 points — the largest headline revision
    this chain has measured**, half again the previous largest (the March sibling's −1.9) and larger than
    a typical month-over-month change. April's sibling still holds the largest *sub-index* revision
    (Present Situation −4.2); May's +3.6 on Expectations is second. Registered as
    **FT-consumer-confidence-2027-05-25-6**.

11. **May is the edition most likely to straddle a dated policy event, and the publisher has said so
    itself — SUPPORTED, 1 of 3 and it is the sourced one.** `CCI-May-2025` states, unprompted:
    *"The cutoff date for preliminary results was May 19, 2025. About half of the responses were
    collected after the May 12 announcement of a pause on some tariffs on imports from China."* That is
    the **only edition in this whole chain where the Board discloses an intra-panel split on a dated
    event** — and it is also the edition carrying the largest single-month Expectations move in the
    sourced record, **+17.4 points to 72.8**, which the Board's own commentary attributes to the same
    announcement (*"the rebound was already visible before the May 12 US-China trade deal but gained
    momentum afterwards"*). The mechanism is May's longer field window (leg 7: 8/7/8-day lags against
    April's 6/6/8), which gives a mid-window shock more room to land. **The reading rule this produces:**
    before treating any May month-over-month move as a change in sentiment, check the edition's own text
    for a collection-period split — in the one sourced instance, most of the move was a dated policy
    event the panel priced mid-field, not a drift in consumer mood. Registered as
    **FT-consumer-confidence-2027-05-25-7**.

12. **May-on-May levels, and the Expectations threshold — SUPPORTED.** Sourced May headline / Present
    Situation / Expectations: **2023** 102.3 / 148.6 / 71.5 · **2024** 102.0 / 143.1 / 74.6 · **2025**
    98.0 / 135.9 / 72.8. Expectations sat **below the Board's own 80.0 recession threshold in all
    three**, and `CCI-May-2023` notes it had then been below 80 *"every month since February 2022, with
    the exception of a brief uptick in December 2022"*, while `CCI-May-2024` calls out *"the fourth
    consecutive month"* below it. Present Situation has fallen monotonically across the three sourced
    Mays — **148.6 → 143.1 → 135.9** — and the August 2026 edition reads **89.4 / 121.2 / 68.2**.
    **The narrow reading, stated:** this describes what the survey has been, not what it will print, and
    at D-261 the May 2027 panel has not opened. Registered as **FT-consumer-confidence-2027-05-25-8**.

13. **Tracked-name sensitivity is nil, and the corridor is a holiday-week cluster — SUPPORTED.**
    `symbols: []`. Only **AAPL** and **AMZN** carry direct consumer exposure; neither reports near
    05-25, and both sit inside leg 2's clean-day null (AAPL p=0.4353, AMZN p=0.5312). A re-grep of
    `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any
    macro- or sentiment-keyed playbook returns **0 hits** — the single `sentiment` string at
    `trade-playbooks.md:115` is a portfolio weighting input, not a macro-print playbook. Three tracked
    events sit within five days: **`opex-2027-05-21`** (proposed this PR, 4 days before),
    **`sifma-bond-early-close-2027-05-28`** (3 days after) and
    **`fomc-blackout-start-2027-05-29`** (4 days after); `memorial-day-market-closure-2027-05-31` sits
    6 days out, just past the window that the deterministic screen watches — which is precisely why
    leg 3's holiday geometry had to be found by hand rather than by the corridor probe.

### What the conditions support

**A refusal, a corrected inference, and a redirected test.** The refusal is unchanged and load-bearing:
**nothing is opened, closed or sized off this print** — `symbols: []`, zero macro-keyed playbooks,
D-261. What is *new* is that this ledger closes the collision question from the clean side while opening
the one that was hiding under it. The Fed is genuinely absent here — no May 2027 meeting, 27 days after
one decision and 14 before the next, panel closed 11-12 days before blackout — which makes this the
series' honest baseline edition, and the April sibling's structural argument now has its control. But
**the May print has never been an ordinary session in the way the chain assumed**: five of its six
observations are Memorial Day reopens, 2027 is not, and only measurement (0 of 9 at n=31) rescues the
sample from being non-comparable. The corrected inference is the proposal's: **a flat month cannot test
the week-level control rule**, so the chain should stop sending replication work to quiet months and send
it to **December**, which carries a 7-of-9 position signature and an unresolved release-date rule at the
same time. The reading order when the print lands: the **cut-off date** first (leg 7 — May's own lags are
8/7/8, and a cut-off after 05-18 would put the panel inside the blackout), the **collection-period split**
second (leg 11 — the one sourced instance moved Expectations 17.4 points on a dated policy event),
**April's restated values** third (leg 10 — the delta is partly a revision, and one of those revisions
moved the headline 2.4 points), the **Expectations** level against 80.0 fourth, and the headline last.

### Honest limits

**The date is `estimate`.** The CB has not announced May 2027; three double-sourced Mays and a stated
rule are strong for an estimate and are not an announcement. **Three of the six May CB dates in the tape
set are the rule applied backward** — 2021-05-25, 2022-05-31 and 2026-05-26 were not separately sourced,
because `CCI-May-2021`, `CCI-May-2022` and `CCI-May-2026` all returned HTTP 200 while serving the current
August 2026 edition. That is the same sourcing rate as March's and April's. **The tape vendor is
stockanalysis.com plus CBOE**, not Yahoo, which 429'd this runner; the 9-of-9 exact replication in leg 2
is what licenses it, and it makes this session directly comparable to the April sibling but one vendor
removed from the earlier ones. **Leg 4's null is n=31 against 269** — it supports the *negative* claim
(no detectable difference between a post-holiday Tuesday and an ordinary one) and cannot support a
positive claim that they are identical; a small effect would not be visible at that size, and that is the
honest ceiling on how much comfort leg 3's finding should be given. **Leg 3's forward projection assumes
the federal Memorial Day observance and the exchange calendar both hold their current form** — a
last-Monday-of-May federal holiday is statute, but the 2027 closure itself is tracked here as an
`estimate`. **Leg 6's claim that a May meeting always sits in the first week is an observation over
2021–2027, not a rule the Fed publishes**, and the calendar states *"each meeting date is tentative until
confirmed at the meeting immediately preceding it."* **Legs 8 and 9 rest on n=6 treated days**; what
survives is the negative claim, never a positive claim that the print is quiet. **Leg 9's December
redirect is a claim about where power exists, not a prediction about December's outcome** — 7 of 9 in a
six-year window with the 2022 bear market inside it is a description of this sample. **Leg 10's Apr-2025
revisions are derived** from stated point-changes rather than quoted. **Leg 11 is 1 sourced instance of
3** and is a reading aid, not a rate. **The whole study is at daily-bar resolution and says nothing about
the 10:00–10:30 ET window**, which is the only place a 10:00 macro print could plausibly live; only an
intraday design could look there, and none was run. **No May consensus exists and structurally will not**
(Conference Board publication restrictions), so there is no measurable surprise gap to model. And
**everything about the May 2027 economy is unknown at D-261** — no part of this doc depends on what the
survey prints.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the May 2027 Conference Board edition as a
**medium-impact second-tier print that is regime information and never a trading event**. **No position
is opened, closed or sized off it.** This ledger's two assigned jobs are discharged, one confirmed and
one corrected. **The clean-counterpart job confirms and strengthens:** May 2027 carries no FOMC meeting
at all, the print sits 27 days after the April decision and 14 before the June SEP day one, and its
rule-derived panel closes 11-12 days before `fomc-blackout-start-2027-05-29` — the cleanest Fed geometry
in the chain, and the control the April collision study needed. **The flat-month job is corrected:** May's
month-level and week-level controls do agree at 0 of 9, which confirms the March rule's *scope condition*,
but a month with no width signature has almost no power to produce the divergence the proposal called
"the rule's clearest falsifier," so this is not a test of the rule and is not banked as one; the
outstanding test is **December, 7 of 9 all narrowing late**, the strongest position signature in the
sample. **The finding this ledger adds is structural and nobody had looked for it:** the last Tuesday of
May is the session immediately after Memorial Day in **5 of the 6** prints on the tape, and 2027 is one
of the **11 of 71 years (15.5%)** where it is not — so the May null is measured on a session type 2027
will not be. That composition difference is measurably immaterial (**0 of 9** at n=31 vs 269), and the
statement is a widening of uncertainty rather than a warning. **One method rule is banked and it applies
to every holiday event on this calendar:** classify a holiday reopen by a calendar gap of **≥ 4 days**,
never ≥ 3 — a normal weekend is a 3-day gap, and the ≥3 filter returns the **Monday effect** (4 of 9,
SPY 0.880/0.991, p=0.0081) dressed as a holiday effect, which is what this session's own first pass
produced before the replication check caught it. **A second trap is recorded for any lane parsing the Fed
calendar:** its three cross-month meetings use abbreviated labels, and a full-month-name regex silently
drops all three and fabricates a 2024-05-30 meeting. Base case for the print itself (**Low** confidence —
no consensus exists or will): **Expectations stays below the Board's own 80.0 recession threshold**
(below it in all three sourced Mays, at 68.2 in August 2026) and the edition **restates April 2027's
headline by a nonzero amount** (3 of 3: +2.4 / +0.5 / −0.3). Eight predictions are registered in
[`forward-tests/consumer-confidence-2027-05-25.md`](../forward-tests/consumer-confidence-2027-05-25.md).

**Kill switches:**

- **The Conference Board names a May 2027 date other than 2027-05-25** — the May last-Tuesday rule
  breaks despite three double-sourced contrary editions, and this doc's date confidence collapses to the
  December sibling's. Registered as **FT-consumer-confidence-2027-05-25-1**.
- **Tuesday-after-a-Monday-holiday sessions clear p<0.05 on 2+ of 9 against ordinary Tuesdays on a
  re-run after 2027-12-31** — leg 4's rescue of the May sample fails, the 5-of-6 post-Memorial
  composition becomes a real confound, and every May CB statistic in this chain needs re-deriving on the
  ordinary-Tuesday subset alone. Registered as **FT-consumer-confidence-2027-05-25-2**.
- **A `≥3`-day-gap holiday classification reproduces its 5-of-9 result while the `≥4`-day one also
  clears p<0.05 on 2+ of 9, on a re-run after 2027-12-31** — the Monday-effect explanation in leg 5 was
  wrong and there is a genuine holiday-reopen effect after all. Registered as
  **FT-consumer-confidence-2027-05-25-3**.
- **December's last-5-vs-earlier scan falls below 4 of 9 on a re-run after 2027-07-31, or May CB days
  clear p<0.05 against either other May or other late-May sessions** — leg 9's redirect points at the
  wrong month, or the flat-month scope condition this ledger confirmed was itself sampling noise.
  Registered as **FT-consumer-confidence-2027-05-25-4**.
- **The May 2027 edition states a cut-off date on or after 2027-05-29** — leg 7's geometry dies, the
  panel is still in the field when the Fed's blackout opens, and this edition stops being the chain's
  clean baseline. Registered as **FT-consumer-confidence-2027-05-25-5**.
- **The May 2027 edition cites an April 2027 headline identical to April's first print, or states no
  revision** — leg 10's extension of the reading aid weakens and the month-over-month delta becomes
  readable as news. Registered as **FT-consumer-confidence-2027-05-25-6**.
- **The May 2027 edition discloses a collection-period split on a dated policy event** — leg 11's
  reading rule fires, and the month-over-month move must be read as partly that event rather than as
  sentiment drift. Registered as **FT-consumer-confidence-2027-05-25-7**.
- **Expectations back above 80** — the Board's own recession-signal threshold, below which every sourced
  May has printed, clears; the late-cycle framing this whole series carries dies. Registered as
  **FT-consumer-confidence-2027-05-25-8**.
- **Expectations below ~54** — deterioration past the April-2025 reading the Board itself called the
  lowest since October 2011; escalate ahead of the banded pulse.
- **The Fed schedules a 2027 meeting in May, or moves the June meeting off 08-09** — the "no Fed in the
  corridor" premise under legs 6 and 7 disappears and `fomc-blackout-start-2027-05-29` needs redating by
  whichever lane owns it.
- **Congress moves or the exchange re-observes Memorial Day 2027** — leg 3's arithmetic changes and the
  print's session type has to be re-derived; `memorial-day-market-closure-2027-05-31` is itself an
  `estimate`.
- **A federal funding lapse runs through the ~05-03 → 05-17 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1 – Nov 12 2025 shutdown ended), and the
  collection-period split becomes the thing to read.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits"
  premise under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-261 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-05-25.json` written this PR** after reading the one prior proposal (`from-consumer-confidence-2027-04-27`), now inert. **Last-Tuesday rule HOLDS for May, 3 of 3, ALL double-sourced** — `CCI-May-2023` (`Updated : 2023-05-30`) + `CCI-Apr-2023`'s "next release is Tuesday, May 30"; `CCI-May-2024` (2024-05-28) + `CCI-Apr-2024`'s "May 28th"; `CCI-May-2025` (2025-05-27) + `CCI-Apr-2025`'s "May 27th". 2027-05-25 is the last Tuesday of May 2027. **REPLICATION EXACT, 9 OF 9** — Yahoo 429'd this runner programmatically so equities came from stockanalysis.com and VIX from CBOE (the April sibling's vendor pair); on the identical 51/17 split of 68 rule-derived days (17 day-ones, 0 decision days) the clean set reproduces the April sibling's published medians **to three decimals on all nine** (SPY 0.911, QQQ 1.379, XLY 1.397, XRT 1.687, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT 0.961, VIX 18.560), 0 of 9, smallest p XLF 0.2712; clean-day SPY c2c **+0.090%, 29 of 51 up**; its 108-test month-vs-year scan reproduces row for row. **THE FINDING — the May print's structure is MEMORIAL DAY, not the Fed, and 2027 breaks it.** Memorial Day is the last Monday of May and the print is the last Tuesday, so unless the last Monday is 05-31 the print is the very next session: **5 of 6** tape prints (2022-05-31, 2023-05-30, 2024-05-28, 2025-05-27, 2026-05-26) are post-Memorial reopens; **2021-05-25 and 2027-05-25 are not**, a geometry occurring in only **11 of 71 years, 15.5%** (1993/1999/2004/2010/2021/2027/2032/2038/2049/2055/2060). So 83% of this print's measured history is a session type 2027 will not be, and the sole matching prior is n=1. **AND IT HAS NO CHANNEL — 0 of 9 five ways:** Tue-after-Monday-holiday vs ordinary Tuesdays (n=31/269, SPY 0.874/0.951 p=0.9486, smallest p AAPL 0.3355); vs all other sessions (0 of 9); any ≥4-day-gap reopen vs all others (n=43, 0 of 9); the 5 post-Memorial CB days vs other Tue-reopens (0 of 9) and vs ordinary Tuesdays (0 of 9). Stated as a **widening of uncertainty, not a warning**. **NEAR-MISS CAUGHT AND BANKED:** this session's first cut classified reopens as ≥3-day gaps and got a big, well-powered **5 of 9 narrower** (SPY 0.877/0.995 **p=0.0066**, TLT 0.0076, QQQ 0.0107, XRT 0.0368, XLY 0.0454, n=300) — **it is the Monday effect**, since a normal Fri→Mon weekend IS a 3-day gap and 269 of the 300 are ordinary Mondays (Mondays alone: 4 of 9, SPY 0.880/0.991 p=0.0081). Rule banked: classify a holiday reopen at **≥4 days**, always report the weekday mix. **SECOND TRAP, for any lane parsing the Fed calendar:** its three cross-month meetings use ABBREVIATED labels (`Jan/Feb 31-1`, `Apr/May 30-1`, `Oct/Nov 31-1`); a full-month-name regex silently drops all three real collisions AND fabricates a nonexistent 2024-05-30 meeting — this session's first pass produced 54/14 with third-decimal-off medians before the replication check caught it. Assert collisions==17. **CLEAN BY A WIDER MARGIN THAN PROPOSED:** the Fed's posted 2027 calendar (164,831 bytes, byte-identical to the April sibling's fetch) runs 01-25/26, 03-16/17*, 04-27/28, 06-08/09*, 07-27/28, 09-14/15*, 10-26/27, 12-07/08* — **no May meeting at all**; no May CB print has ever collided (when a May meeting exists the FOMC puts it in week one: 2022-05-03/04, 2023-05-02/03, 2024-04-30/05-01, 2025-05-06/07). Spacing: **27d after the April decision, 14d before the June SEP day one, 4d before blackout**. **PROPOSAL REFINED — May's own cut-off lags are 8/7/8** (2023-05-22, 2024-05-21, 2025-05-19), longer than April's 6/6/8 the proposal borrowed; 2027 cut-off **05-17/18**, field window ~05-03→05-17/18, closing **11-12 days BEFORE** blackout — an entirely open Fed communication window. **PROPOSAL CORRECTED — a flat month is the WEAKEST test of the 03-30 week-level rule, not the sharpest.** May IS the calendar's cleanest null: **0 of 9 vs the rest of the year** (SPY 0.984/0.969 **p=0.9445**, smallest p 0.0902 — the only month of twelve with no leg even approaching 0.05; next-flattest Feb at 0.0197) and **0 of 9** on last-5-vs-earlier May (SPY 0.783/1.037 p=0.1710). Both controls agree — but in a month with no position signature both arms return 0 of 9 whether the rule holds or not, so the claimed falsifier has near-zero power. **Where the real test lives: DECEMBER, 7 of 9 all narrowing late** (AAPL p=0.0007, AMZN 0.0013, XLF 0.0013, XRT 0.0083, VIX 0.0177, QQQ 0.0268, XLY 0.0483), ahead of March's 6 of 9 — and December is also the one month whose release rule is refuted (12-22 sibling). **May CB days null on every control:** vs other May 0 of 9 (SPY 0.823/0.997 p=0.8099), vs other late-May 0 of 9 (0.823/0.783 p=0.6783), vs all sessions 0 of 9. **Directional null too** — c2c **+0.054%, 4 of 6 up**, p=**1.0000** vs late-May and 0.8010 vs May, independently corroborating the April lane's refusal of its own p=0.0183. **Revision rule extends to a FIFTH month with the chain's largest HEADLINE revision:** May restates April **3 of 3** — 101.3→**103.7 (+2.4, stated "upwardly revised")** · 97.0→97.5 (+0.5, stated) · 86.0→85.7 (−0.3, stated); PS 151.1→151.8 · 142.9→140.6 · 133.5→131.1 (derived); Exp 68.1→**71.7 (+3.6)** · 66.4→68.8 (+2.4) · 54.4→55.4 (derived). The +2.4 headline beats the 03-30 sibling's −1.9. **NEW READING RULE — check for a collection-period split:** `CCI-May-2025` is the ONLY edition in the chain where the Board discloses one ("about half of the responses were collected after the May 12 announcement of a pause on some tariffs on imports from China"), and it carries the largest Expectations move in the sourced record (**+17.4 to 72.8**), which its own commentary attributes to that announcement; May's longer field window is the mechanism. **May levels:** 2023 102.3/148.6/71.5 (cut-off 05-22) · 2024 102.0/143.1/74.6 (05-21) · 2025 98.0/135.9/72.8 (05-19) — Expectations below 80 in all three, Present Situation monotonically 148.6→143.1→135.9. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53** (CBOE close), SPY **770.19** (2026-09-04) — baseline set, identical to the April sibling's. **Geopolitical:** unchanged from siblings. **Event tape:** no May consensus exists or is publishable (CB publication restrictions); current edition is August 2026 (89.4/121.2/68.2, survey Aug 3–16), next release named 2026-09-29. **Sourcing failures:** `CCI-May-2021`, `CCI-May-2022`, `CCI-May-2026` each returned **HTTP 200 serving the current August 2026 edition** (332,031 bytes) — same substitution class every sibling logged; three of six May CB dates are therefore rule-derived. Yahoo (429) and theocc.com (403) recorded in `probe-ref.blocked`. **New dated adjacencies → TWO proposals filed:** (1) `proposals/opex-2027-05-21.from-consumer-confidence-2027-05-25.json` — a **gap fill**, not a discovery: the repo tracks opex 02-19/03-19/04-16/06-17 and May 2027 is the one month missing; sourced off Cboe's settlement CSV (HTTP 200 for two separate settlement dates, `VX,VX/J7,2027-04-21`) plus the 30-day VIX-futures rule, which reproduces all four existing entries and invents none. (2) `proposals/consumer-confidence-2027-06-29.from-consumer-confidence-2027-05-25.json` — the next edition, sourced three-for-three for June from this session's own May fetches, and the chain's first edition whose panel would field almost entirely AFTER a SEP meeting (06-08/09*, 21 days before it). **Corridor (3 tracked events within 5 days):** `opex-2027-05-21` (proposed, 4d before), `sifma-bond-early-close-2027-05-28` (3d after), `fomc-blackout-start-2027-05-29` (4d after); `memorial-day-market-closure-2027-05-31` sits 6d out, **just past the screen's ±5-day window — which is exactly why leg 3's holiday geometry had to be found by hand**. Eight forward tests registered: **FT-consumer-confidence-2027-05-25-1** through **-8**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-05-25.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
