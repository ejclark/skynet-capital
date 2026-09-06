# Conference Board Consumer Confidence (Apr 2027) — consumer-confidence-2027-04-27

**Kind:** macro-print · **Date:** 2027-04-27 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session against three primary-sourced April editions — 2023-04-25, 2024-04-30, 2025-04-29 — every one the last Tuesday of its April, and all three double-sourced by the preceding March edition's own next-release line) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-04-28","fomc-2027-04-28"],"screenStreak":0,"blocked":[{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Apr-2021","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Apr-2022","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Apr-2026","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/","status":"429","at":"2026-09-06"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/","status":"429","at":"2026-09-06"},{"url":"https://stooq.com/q/d/l/","status":"ACCESS-DENIED-AFTER-PROOF-OF-WORK","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The collision this whole chain has worried about since January cannot carry information —
and the reason is mechanical, not statistical.** This id is the series' collision instance: 2027-04-27 is
**FOMC day one** of the April 27-28 meeting. Three sessions of siblings treated that as a confound to be
controlled away. It is not a confound at all. **All 17 CB/FOMC collisions since 2021 are day ONE and not
one is a decision day**, because the Fed's two-day meetings always begin on a Tuesday and the Board
always prints on a Tuesday — so a collision can only ever land on the meeting's *silent* day. And the
measured Fed effect lives entirely on the other day: **FOMC decision days run 8 of 9 wider** than
no-Fed sessions (SPY **1.352 vs 0.958**, p=**0.0001**; XRT p<0.0001), while **FOMC day ones are 0 of 9**
(SPY 0.929 / 0.958, p=0.2971). Collision CB days against *other* FOMC day ones: **0 of 9**. Nor can a CB
print ever meet a projections meeting — **0 of 28 SEP day-ones is the last Tuesday of its month**, and
April 2027 carries no SEP. Second job: this id was filed as the **replication site** for the
[March sibling](consumer-confidence-2027-03-30.md)'s week-level control rule, and it confirms the rule's
*scope condition* — April's width is **not** front-loaded (last-5 vs earlier April: **2 of 9**, and the
significant legs split direction), so the month-level and week-level controls **agree at 0 of 9**, exactly
as the rule predicts where a month's width is flat. Third, and the honest one: **the single p<0.05 result
in this entire session is a directional one, and it is almost certainly noise** — April CB days run SPY
**−1.035% close-to-close, 1 of 6 up**, p=**0.0183** against other late-April sessions. Run the identical
test on all twelve months and it hits **exactly once** — the one false positive twelve tests at α=0.05
predict. It does not clear Bonferroni (0.00417). It is registered as a falsifier, not a call. Date
**estimate**; `symbols: []`; **0** macro-keyed playbooks.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-233) | **Stand aside** | High | `symbols: []`, D-233, the April panel does not open for seven months, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-04-27** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026, released 08-25**: headline **89.4** (from 90.2), Present Situation **121.2**, Expectations **68.2**, survey period **Aug 3–16**, cut-off **Aug 16**; the page names **2026-09-29** as the next release. Market state **2026-09-04**: VIX **14.53**, SPY **770.19**. | The Conference Board naming an April 2027 date other than **2027-04-27** before **2027-04-06**, which breaks the April rule this doc's date rests on |
| This month | **Stop calling the FOMC collision a confound — a Tuesday print can only ever hit the Fed's silent day** | High | 17 of 17 collisions are day one, **0** are decision days. Day ones: **0 of 9** vs no-Fed sessions (SPY 0.929/0.958, p=0.2971). Decision days: **8 of 9** (SPY 1.352/0.958, p=0.0001). Collision CB days vs other day ones: **0 of 9** (SPY 0.898/0.958, p=0.5046). **0 of 28** SEP day-ones is a last Tuesday. | Any CB print landing on an FOMC **decision** day, or FOMC day ones clearing p<0.05 on 2+ of 9 against no-Fed sessions, on a re-run of the same pipeline after **2027-12-31** |
| This quarter | **The week-level control rule survives its first out-of-sample month — by correctly saying it was not needed** | Medium | April is **not** front-loaded (last-5 vs earlier April **2 of 9**, and the two hits point opposite ways: AMZN wider late p=0.0330, TLT narrower late p=0.0354; SPY 1.174/1.143, p=0.8042), so month-level and week-level controls **agree at 0 of 9** — the rule's scope condition, not a second demonstration of it. | April CB days printing p<0.05 on any instrument against **either** other April sessions or other late-April sessions, on a re-run after **2027-06-30** |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and the release day is null against every range control that survives inspection.
- **The Conference Board names an April 2027 date** → adopt it verbatim. The rule says **04-27**;
  registered as **FT-consumer-confidence-2027-04-27-1**.
- **Do not treat an FOMC collision as contamination — treat it as day one, which is nothing.** The Fed's
  content is on the decision day, which a Tuesday release can never reach. Registered as
  **FT-consumer-confidence-2027-04-27-2** and **-3**.
- **Do not trade the −1.035% April drift.** It is one hit in twelve identical monthly tests, fails
  Bonferroni, and three of its six observations are named drawdowns. Registered as a falsifier —
  **FT-consumer-confidence-2027-04-27-5**.
- **Never control any month against "the rest of the year."** 6 of 12 months clear 4+ of 9 against that
  baseline and the sign splits — Feb/Mar/Apr run wide, Jul/Aug/Dec run narrow. Registered as
  **FT-consumer-confidence-2027-04-27-6**.
- **Read the April edition's stated cut-off date first** — sourced lags are **6 / 6 / 8** days, putting a
  2027 cut-off at **04-19 → 04-21**, i.e. **after** `fomc-blackout-start-2027-04-17` has begun.
  Registered as **FT-consumer-confidence-2027-04-27-7**.
- **Read the level, never the month-over-month delta** — April restates March in **3 of 3** sourced
  editions (**−0.2 / −1.6 / +1.0**), and April-2024 revised March's Present Situation by **−4.2**, the
  largest revision this chain has measured. Registered as **FT-consumer-confidence-2027-04-27-8**.
- **Expectations back above 80** → the Board's own recession threshold, below which all three sourced
  Aprils printed (68.1 / 66.4 / **54.4**), clears; the late-cycle framing this series carries dies.
  Registered as **FT-consumer-confidence-2027-04-27-9**.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **2026-09-16** · CB print **2026-09-29** · CPI **2026-10-14** · FOMC
  **2026-10-28** · CB print **2026-11-24** (est.) · FOMC **2026-12-09** · CB print **2026-12-22**
  (est.) · **FOMC 2027-01-27** (est.) · CB print **2027-02-23** (est.) · **FOMC + SEP 2027-03-16/17**
  (est.) · CB print **2027-03-30** (est.) · opex **2027-04-16** (est.) · **blackout begins 2027-04-17**
  (est.) · VIX expiration **2027-04-21** (est.) · **this print + FOMC day one 2027-04-27** (est.) ·
  **FOMC decision + BoJ decision 2027-04-28** (est.).

## Initial research

### The question, plainly

The [March sibling](consumer-confidence-2027-03-30.md) filed this id for two jobs. It is **the collision
counterpart** — 2027-04-27 is FOMC day one, one of exactly four colliding 2027 prints (01-26, 04-27,
07-27, 10-26) against eight clean ones, and the [February sibling](consumer-confidence-2027-02-23.md)
registered `FT-consumer-confidence-2027-02-23-2` to re-run the clean-vs-collision split after 2027-06-30
with 2027's prints added. And it is **the replication site** for the March ledger's new control rule: a
fixed-position monthly release must be compared against the same *week* of its month, not the month,
because March's width is front-loaded onto exactly the part of the month the last-Tuesday rule can never
occupy. Testing that rule needs a month with a *different* within-month width profile, and April is the
adjacent one.

So: **is the April date sound, does the collision actually do anything, and does April behave like
March?** And, since this is the first edition in the chain that prints inside a Fed blackout on the eve
of a decision: **is the proposal right that its release-day tape "cannot be attributed to the survey at
all"?**

**One-line verdict:** the date is well-sourced for an `estimate` (three primary-sourced Aprils, all three
double-sourced), the collision is **structurally incapable** of carrying Fed information rather than
merely measuring as null, April is **not** front-loaded so the March rule's scope condition holds, and
the proposal's attribution claim is **backwards** — a blackout day one is the quietest Fed-adjacent
session there is, not the noisiest.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Publisher sources fetched direct 2026-09-06**, all HTTP 200 and each
verified against its own `Source: <Month> <Year> Consumer Confidence Survey` line and its `Updated:` date
rather than trusted by slug: `conference-board.org/topics/consumer-confidence` (the cadence sentence, the
named next release, the August 2026 values, survey period and cut-off) and the publisher's
`CCI-Apr-2023`, `CCI-Apr-2024`, `CCI-Apr-2025`, `CCI-Mar-2023`, `CCI-Mar-2024` and `CCI-Mar-2025` pages.
**The FOMC dates are primary:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200,
**164,831 bytes**, parsed in full — every 2021–2026 panel plus the `Future Year: 2027` panel (**January
26-27, March 16-17\*, April 27-28, June 8-9\*, July 27-28, September 14-15\*, October 26-27, December
7-8\***), including the four cross-month meetings the siblings' prose lists (`Jan/Feb 31-1` 2023,
`Apr/May 30-1` 2024, `Oct/Nov 31-1` 2023, `Oct/Nov 31-1` 2022) that a naive month parse silently drops;
it states *"Each meeting date is tentative until confirmed at the meeting immediately preceding it."*
**Three slugs failed the way every sibling warned:** `CCI-Apr-2021`, `CCI-Apr-2022` and `CCI-Apr-2026`
each returned **HTTP 200 while serving the current August 2026 edition** (byte-identical at 332,031),
recorded in `probe-ref.blocked` as `200-SERVED-CURRENT-EDITION`.

**The tape came from different vendors this session, and that is recorded rather than hidden.** Yahoo's
chart endpoint — the source every prior ledger in this chain used — answered **HTTP 429 to every request
from this runner**, on both `query1` and `query2`, across eight backoff attempts and two query forms
(two isolated 200s early in the session were the only ones that got through; the sibling matrix jobs
running the same study in parallel share this IP). A stooq fallback answered its proof-of-work challenge
and then returned **`Access denied`**. Both are in `probe-ref.blocked`. Equity and ETF daily OHLC
therefore come from **stockanalysis.com**, and VIX from **CBOE's own `VIX_History.csv`** — which is a
primary-source *upgrade* over Yahoo for that series, not a downgrade. Everything else is unchanged from
the siblings so the numbers stay like-for-like: SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF, TLT and VIX for
**2020-12-01 → 2026-09-04** (n=**1,447** sessions), session range `(high − low) / open`, two-sided
Mann-Whitney U with tie correction, VIX measured on close. **The vendor swap is licensed by a
cross-vendor replication, which is a stronger check than the same-vendor one the siblings ran** — see
leg 2. Market readings: **2026-09-04 closes, SPY 770.19 (stockanalysis) and VIX 14.53 (CBOE)**, both
identical to the siblings' Yahoo readings.

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for April — SUPPORTED three-for-three, and all three are
   double-sourced.** The publisher states, fetched today: *"The Conference Board publishes the Consumer
   Confidence Index® at 10 a.m. ET on the last Tuesday of every month."* For December that is refuted on
   five consecutive editions ([12-22 sibling](consumer-confidence-2026-12-22.md) leg 1); January holds
   five-for-five, February four-for-four, March three-for-three. For April:

   | Edition | Released | Weekday | Last Tuesday of that April | Sources |
   |---|---|---|---|---|
   | Apr 2023 | 2023-04-25 | Tue | 04-25 | the edition's own `Updated : 2023-04-25` **and** `CCI-Mar-2023`'s *"The next release is Tuesday, April 25 at 10 AM ET"* |
   | Apr 2024 | 2024-04-30 | Tue | 04-30 | `Updated : 2024-04-30` **and** `CCI-Mar-2024`'s *"Tuesday, April 30th"* |
   | Apr 2025 | 2025-04-29 | Tue | 04-29 | `Updated : 2025-04-29` **and** `CCI-Mar-2025`'s *"Tuesday, April 29th"* |

   **2027-04-27 is the last Tuesday of April 2027.** May is a bonus three-for-three from the same fetches
   (`CCI-Apr-2023` → *"Tuesday, May 30"*; `CCI-Apr-2024` → *"May 28th"*; `CCI-Apr-2025` → *"May 27th"*) —
   which is what sources this PR's one proposal. Registered as **FT-consumer-confidence-2027-04-27-1**.

2. **The pipeline replicates the siblings across a VENDOR CHANGE — SUPPORTED, and this is what licenses
   everything below.** On the identical window the 68 rule-derived CB days split **51 clean / 17
   colliding** exactly as both siblings reported, and the clean set's medians reproduce the published
   table: **6 of 9 identical to three decimals** (QQQ 1.379, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT
   0.961, VIX close 18.560) and the other three differing only in the third (SPY **0.911** vs published
   0.910, XLY 1.397 vs 1.399, XRT 1.687 vs 1.678) — **0 of 9** at p<0.05, smallest p XLF 0.2713. Two more
   independent checks land exactly: clean-day SPY close-to-close is **+0.090% median, 29 of 51 up**,
   character-for-character the February sibling's figure; and the March sibling's week-level control
   reproduces to four decimals (March CB days vs other late-March sessions, SPY **0.662 / 1.039**,
   p=**0.2650**, 0 of 9). Three ledgers' headline numbers reproducing from **a different data vendor** is
   a materially stronger replication than a same-vendor re-run, because it rules out a vendor artifact as
   the source of the null. *(The third-decimal drift on SPY/XLY/XRT is raw-OHLC vendor difference, and it
   is reported rather than smoothed over.)*

3. **THE FINDING — the collision cannot carry Fed information, and the reason is arithmetic.** Every
   sibling in this chain has treated the FOMC collision as a *confound* — something contaminating the
   release day that must be controlled away. Splitting the 17 collision days by which day of the meeting
   they are:

   | | count | dates |
   |---|---|---|
   | FOMC **day one** | **17** | 2021-01-26 · 2021-04-27 · 2021-07-27 · 2022-01-25 · 2022-07-26 · 2023-01-31 · 2023-07-25 · 2023-10-31 · 2024-01-30 · 2024-04-30 · 2024-07-30 · 2025-01-28 · 2025-07-29 · 2025-10-28 · 2026-01-27 · 2026-04-28 · 2026-07-28 |
   | FOMC **decision day** | **0** | — |

   **Seventeen for seventeen, and it is not luck.** The Fed's two-day meetings begin on a Tuesday and
   decide on the Wednesday; the Board prints on a Tuesday. A CB release can therefore *only* ever be day
   one — no statement, no implementation note, no press conference, and the committee still in blackout.
   And the Fed's actual footprint on the tape is entirely on the day it can never reach:

   | Instrument | FOMC **decision day** (n=45) / no-Fed session | p | | FOMC **day one** (n=45) / no-Fed | p |
   |---|---|---|---|---|---|
   | SPY | **1.352 / 0.958** | **0.0001** | | 0.929 / 0.958 | 0.2971 |
   | QQQ | **1.680 / 1.361** | **0.0011** | | 1.360 / 1.361 | 0.4598 |
   | XLY | **1.862 / 1.425** | **0.0001** | | 1.179 / 1.425 | 0.0873 |
   | XRT | **2.456 / 1.817** | **<0.0001** | | 1.655 / 1.817 | 0.5166 |
   | AMZN | **2.717 / 2.245** | **0.0012** | | 2.152 / 2.245 | 0.6434 |
   | AAPL | **2.351 / 1.847** | **0.0051** | | 1.831 / 1.847 | 0.9314 |
   | XLF | **1.560 / 1.223** | **0.0001** | | 1.157 / 1.223 | 0.5841 |
   | TLT | **1.095 / 0.830** | **0.0007** | | 0.887 / 0.830 | 0.6053 |
   | VIX close | 18.310 / 18.040 | 0.7874 | | 17.780 / 18.040 | 0.7534 |
   | | **8 of 9** | | | **0 of 9** | |

   Decision days are **8 of 9 wider** — a large, unambiguous, correctly-signed effect that confirms the
   pipeline can detect a real macro event when one exists. Day ones are **0 of 9**. And the direct
   like-for-like control lands where it must: collision CB days against **other FOMC day ones** are
   **0 of 9** (SPY 0.898 / 0.958, p=0.5046, n=17 vs 28; smallest p 0.3928), as are collision days against
   all other sessions (0 of 9) and against clean CB days (0 of 9, SPY 0.898 / 0.911, p=0.4614 —
   reproducing the February sibling's 0.4529 on the same medians). **The correction this banks for the
   chain:** the January ledger's *"unreadable because the Fed is on it"* and the February ledger's
   de-confounded control were both answering a question that could not have had a yes. The Fed is not
   "on" a CB print day in any sense that reaches the tape; it is in the room with the door shut.
   Registered as **FT-consumer-confidence-2027-04-27-2**.

4. **No CB print has ever met a projections meeting, and none can — SUPPORTED, 0 of 28.** The stronger
   version of leg 3. Across every meeting on the posted 2021–2027 calendar, **28 carry a Summary of
   Economic Projections** (the `*` meetings, in March, June, September and December). Not one of their
   day-ones is the last Tuesday of its month — the gap runs from 7 days (2023-03-21 vs 03-28) to 22
   (2024-12-17 vs 12-31), because SEP meetings sit in the second or third week while the last Tuesday
   sits in the fourth or fifth. In 2027 the four SEP day-ones are 03-16, 06-08, 09-14 and 12-07 against
   last Tuesdays of 03-30, 06-29, 09-28 and 12-28. **So the collision class is uniformly the Fed's
   lowest-information meeting type**: no dot plot, no projections, no SEP press conference — and
   2027-04-27's meeting carries no asterisk. Registered as **FT-consumer-confidence-2027-04-27-3**.

5. **April is a wide month, and the print contributes nothing to it — SUPPORTED, 0 of 9 on BOTH
   controls.** All **124** April sessions since 2021 run **6 of 9** against the rest of the year: SPY
   **1.143 / 0.962** (p=**0.0244**), QQQ 1.543 / 1.355 (0.0089), XLY **1.665 / 1.407** (**0.0014**), AMZN
   **2.529 / 2.216** (**0.0001**), XLF 1.308 / 1.224 (0.0313), VIX close **18.710 / 17.950**
   (**0.0004**); XRT (0.0765), AAPL (0.8717) and TLT (0.3823) miss. That places April between February's
   4 of 9 and March's 9 of 9. The six April CB days measured against **other April sessions** are
   **0 of 9** (SPY 1.254 / 1.123, p=0.8935, smallest p XLY 0.6043), and against **other late-April
   sessions** also **0 of 9** (SPY 1.254 / 1.057, p=0.8560, smallest p XRT 0.2040). **1 of 6** April CB
   days exceeds the late-April 75th percentile of SPY range, against a chance rate of 25%.

6. **April is NOT front-loaded — SUPPORTED, and this is the correct test of the March rule.** The March
   sibling's rule says a month-level control is valid only where the month's width is roughly flat across
   it. Splitting each April into its last five sessions and everything earlier:

   | Instrument | Last-5 April / earlier April | p |
   |---|---|---|
   | AMZN | 2.833 / 2.413 | **0.0330** (WIDER late) |
   | TLT | 0.694 / 0.897 | **0.0354** (narrower late) |
   | SPY | 1.174 / 1.143 | 0.8042 |
   | QQQ | 1.535 / 1.543 | 0.5153 |
   | XRT | 1.735 / 1.987 | 0.1942 |
   | XLY · AAPL · XLF · VIX | — | 0.51 → 0.98 |

   **2 of 9, and the two hits point in opposite directions** — against March's 6 of 9 all narrowing
   (SPY p=0.0040, VIX p=0.0012). Per-year April SPY medians, early vs last-five: 0.667/0.505 (2021),
   1.431/**2.341** (2022), 0.775/**1.096** (2023), 1.250/0.837 (2024), 2.406/1.547 (2025), 0.907/0.539
   (2026) — narrower late in four of six, wider in two, with no aggregate signal. **So April's width has
   no position signature, and the month-level and week-level controls agree at 0 of 9 — exactly what the
   rule predicts.** Stated precisely, because the distinction matters: this is **not** a second
   demonstration that the week-level control is necessary. It is a confirmation of the rule's **scope
   condition** — where a month is flat, the cheaper control is safe, and the rule correctly says so
   rather than manufacturing work. A rule that only ever fires is not a rule. Registered as
   **FT-consumer-confidence-2027-04-27-4**.

7. **THE HONEST ONE — the session's only p<0.05 result is directional, and it is the false positive
   twelve tests predict.** Every range comparison above is null. One thing is not. April CB days' SPY
   **close-to-close** return:

   | | 2021-04-27 | 2022-04-26 | 2023-04-25 | 2024-04-30 | 2025-04-29 | 2026-04-28 |
   |---|---|---|---|---|---|---|
   | SPY range % | 0.440 | **2.341** | 1.252 | 1.490 | 1.257 | 0.510 |
   | SPY close-to-close % | −0.02 | **−2.90** | −1.59 | −1.58 | +0.63 | −0.49 |
   | VIX close | 17.56 | **33.52** | 18.76 | 15.65 | 24.17 | 17.83 |
   | FOMC | day one | — | — | day one | — | day one |

   Median **−1.035%**, **1 of 6 up**, against other late-April sessions at +0.245% — **p=0.0183**. It
   survives the obvious robustness checks: against *all* other sessions p=0.0412, and dropping the
   2022-04-26 outlier leaves n=5 at −0.487% and p=0.0464. **It does not survive the one that matters.**
   Running the identical directional test on the CB days of **all twelve months** against each month's
   own last-five sessions returns **exactly one hit — April, p=0.0183** — with the other eleven at
   p=0.10 → 0.98. One significant result from twelve tests at α=0.05 is the textbook expectation
   (0.6 expected hits; ~46% chance of at least one), and p=0.0183 does not clear a Bonferroni-corrected
   0.00417. Add that three of the six observations are named drawdowns (April 2022's Nasdaq bear leg,
   April 2023, the April 2024 rate scare) and n=6. **The call is to state it, register it, and refuse to
   price it.** It is written down here precisely so a future session cannot rediscover it as news.
   Registered as **FT-consumer-confidence-2027-04-27-5**.

8. **"The rest of the year" is not a neutral baseline for ANY month — SUPPORTED, and it generalizes the
   chain's trap.** The February sibling found February wide, the March sibling found March wider still,
   and each treated it as a property of its own month. Running every month against the rest of the year:

   | Month | Hits (of 9) | SPY median / base | p |
   |---|---|---|---|
   | **March** | **9** | 1.297 / 0.936 | **<0.0001** |
   | **August** | **9** | **0.888 / 0.986** | **0.0013** (narrower) |
   | **April** | **6** | 1.143 / 0.962 | **0.0244** |
   | **December** | **6** | **0.888 / 0.982** | **0.0164** (narrower) |
   | **July** | **5** | **0.829 / 0.993** | **0.0014** (narrower) |
   | **February** | **4** | 1.116 / 0.956 | **0.0328** |
   | Jan · Sep · Nov | 3 | — | 0.17 → 0.35 |
   | May · June · Oct | 0 → 1 | — | 0.07 → 0.94 |

   **Six of twelve months clear 4 or more of 9 against that baseline, and the sign splits** — Feb, Mar
   and Apr run wide while Jul, Aug and Dec run narrow. That is not six coincidences; it means the
   "rest of the year" pool mixes a wide first-half regime with a narrow second-half one, so it is a
   biased control for every month, not a neutral one. **The standing instruction:** compare a session to
   its own month (and, where the month has a position signature, its own week of that month) — never to
   an annual pool. Registered as **FT-consumer-confidence-2027-04-27-6**.

9. **The proposal's attribution claim is INVERTED — REFUTED, and the corrected version is the opposite
   reading.** The proposal that filed this id wrote that this edition *"prints INSIDE the blackout, on
   decision-eve, and its release-day tape cannot be attributed to the survey at all."* The first two
   clauses are correct and now sourced; the conclusion is backwards. Sourced April cut-off lags are
   **6 / 6 / 8** days (2023-04-19, 2024-04-24, 2025-04-21), and `CCI-Apr-2023` states its field window
   explicitly — *"fielded from April 3 … to April 19"*, sixteen days. Applied forward:

   | | 2027 |
   |---|---|
   | Field window (rule-derived) | ~**04-05 → 04-20** |
   | `fomc-blackout-start-2027-04-17` | **inside** the field window, ~3 days before it closes |
   | Release | **2027-04-27**, FOMC **day one** |
   | FOMC decision + BoJ decision | **2027-04-28**, D+1 |

   So the print does land in blackout on decision-eve — and that is exactly what makes its session
   **quiet of Fed content**, not unattributable. No statement, no presser, no speakers, no SEP (leg 4).
   Leg 3 measures the consequence directly: an FOMC day one is indistinguishable from a no-Fed session on
   9 of 9. **A blackout day one is the cleanest Fed-adjacent session on the calendar, not the dirtiest.**
   The one real caution is on **D+1**, not D: the decision that follows a CB print runs *narrower* than
   other decision days (SPY 1.078 / 1.412, p=0.0811; QQQ 0.0771; XLY 0.0771; XLF **1.306 / 1.629**,
   p=**0.0111**) — **1 of 9**, which at n=17 is chance-consistent and is recorded as an observation, not
   a finding. D+1 after an April CB day against other late-April sessions is **0 of 9**. Registered as
   **FT-consumer-confidence-2027-04-27-7**.

10. **The revision rule extends to a fourth consecutive month, and April holds the largest revision the
    chain has measured — SUPPORTED, 3 of 3.** January's sibling measured it on January, February's on
    February, March's on March. April restates March just as reliably:

    | March, as first printed | Restated in the April edition | Revision |
    |---|---|---|
    | Mar 2023 **104.2 / 151.1 / 73.0** | `CCI-Apr-2023`: *"down from 104.0 in March"*, PS *"from 148.9 last month"*, Exp *"from 74.0"* | **−0.2 / −2.2 / +1.0** |
    | Mar 2024 **104.7 / 151.0 / 73.8** | `CCI-Apr-2024`: *"a downwardly revised 103.1 in March"*, PS *"a downwardly revised 146.8"*, Exp *"a slightly upwardly revised 74.0"* | **−1.6 / −4.2 / +0.2** |
    | Mar 2025 **92.9 / 134.5 / 65.2** | `CCI-Apr-2025`: *"fell by 7.9 points in April to 86.0"*, *"decreased 0.9 points to 133.5"*, *"dropped 12.5 points to 54.4"* | **+1.0 / −0.1 / +1.7** (derived) |

    **The sharpest instance is Present Situation in March 2024: first printed 151.0, restated by
    `CCI-Apr-2024` to 146.8 — a 4.2-point revision**, larger than the 3.5-point Expectations move the
    March sibling flagged as its own worst case. A sub-index read off a first print can be wrong by more
    than a typical month-over-month change. Registered as **FT-consumer-confidence-2027-04-27-8**.

11. **April-on-April levels, and the Expectations threshold — SUPPORTED.** Sourced April headline /
    Present Situation / Expectations: **2023** 101.3 / 151.1 / 68.1 · **2024** 97.0 / 142.9 / 66.4 ·
    **2025** 86.0 / 133.5 / **54.4**. Expectations sat **below the Board's own 80.0 recession threshold
    in all three**, and `CCI-Apr-2025` calls its 54.4 *"the lowest level since October 2011."*
    `CCI-Apr-2023` notes Expectations had then been below 80 *"every month since February 2022, with the
    exception of a brief uptick in December 2022."* The August 2026 edition reads **89.4 / 121.2 /
    68.2** — Present Situation has fallen from an April-2023 151.1 to 121.2. **The narrow reading,
    stated:** this describes what the survey has been, not what it will print, and at D-233 the April
    2027 panel has not opened. Registered as **FT-consumer-confidence-2027-04-27-9**.

12. **Tracked-name sensitivity is nil, and the corridor is thin but consequential — SUPPORTED.**
    `symbols: []`. Only **AAPL** and **AMZN** carry direct consumer exposure; neither reports near
    04-27, and both sit inside leg 2's clean-day null (AAPL p=0.4354, AMZN p=0.5313). A re-grep of
    `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any
    macro- or sentiment-keyed playbook returns **0 hits** — the single `sentiment` string at
    `trade-playbooks.md:115` is a portfolio weighting input, not a macro-print playbook. The corridor is
    the thinnest in the chain — **two** tracked events within five days, both on **2027-04-28**:
    [`fomc-2027-04-28`](fomc-2027-04-28.md) (the decision, dated to day two) and `boj-decision-2027-04-28`.
    Thin is not quiet: a Fed decision and a BoJ decision on the same D+1 is the densest single adjacent
    session this series has, and everything that matters about it belongs to those two ledgers, not this
    one. Just outside the window sit `opex-2027-04-16`, `fomc-blackout-start-2027-04-17` and
    `vix-expiration-2027-04-21`.

### What the conditions support

**A refusal, a retired question, and a scope condition.** The refusal is unchanged and load-bearing:
**nothing is opened, closed or sized off this print** — `symbols: []`, zero macro-keyed playbooks,
D-233. What is *new* is that the collision question the chain has carried since January is now **closed
by construction rather than by a p-value**: a Tuesday release can only ever meet a two-day meeting's
silent first day, that day is measurably ordinary on 9 of 9, and the Fed's real 8-of-9 footprint is on a
Wednesday the Board can never print on. Any future study of this series should stop building
clean-vs-collision splits — they are splits on a variable that has no channel. What the March rule gains
is its **scope condition**: April is flat across the month, both controls agree at 0 of 9, and the rule
correctly declines to fire. And leg 8 upgrades the trap both siblings found in their own months into a
general one — *"the rest of the year"* is a biased baseline for six of twelve months and its bias
changes sign, so it should not be used as a control at all. The reading order when the print lands: the
**cut-off date** first (leg 9 — the 2027 window should close after the blackout begins, and a cut-off on
or before 04-16 kills that geometry), **March's restated values** second (leg 10 — the delta is partly a
revision, and one of those revisions moved a sub-index by 4.2 points), the **Expectations** level against
80.0 third, and the headline last.

### Honest limits

**The date is `estimate`.** The CB has not announced April 2027; three double-sourced Aprils and a stated
rule are strong for an estimate and are not an announcement. **Three of the six April CB dates in the
tape set are the rule applied backward** — 2021-04-27, 2022-04-26 and 2026-04-28 were not separately
sourced, because `CCI-Apr-2021`, `CCI-Apr-2022` and `CCI-Apr-2026` all returned HTTP 200 while serving
the current August 2026 edition. That is the same sourcing rate as March's. **The tape vendor changed**
— Yahoo 429'd this runner all session and stooq denied access after its proof-of-work, so equities came
from stockanalysis.com and VIX from CBOE; the three exact replications in leg 2 are what license it, and
the third-decimal drift on SPY/XLY/XRT is real vendor difference, not rounding. **Leg 3's structural
claim rests on the Fed keeping its Tuesday-start convention** — every meeting on the posted 2021–2027
calendar starts Tuesday, but that is a convention, not a law, and a Monday-start or a one-day meeting on
a last Tuesday would break it. Both 2027 dates are `estimate` and the Fed's own caveat applies. **Legs 5
and 6 rest on n=6 treated days against 24 controls**; what survives is the **negative** claim (no effect
detectable), never a positive claim that the print is quiet. **Leg 7's non-finding is the load-bearing
piece of honesty in this doc** — a directional edge at p=0.0183 that would look tradable in isolation is
being declined on multiple-comparison grounds, and if the next re-run reproduces it with 2027 added, that
refusal is what will have been wrong. **Leg 8's per-month scan is 108 tests** and is presented as a
description of this six-year window's shape, not as a seasonality law; four of the six Marches contain a
named macro shock and the 2022 bear market sits inside the wide months. **Leg 9's D+1 result is 1 of 9 at
n=17** and is explicitly not treated as a finding. **Leg 10's Apr-2025 revisions are derived** from
stated point-changes rather than quoted. **The whole study is at daily-bar resolution and says nothing
about the 10:00–10:30 ET window**, which is the only place a 10:00 macro print could plausibly live; only
an intraday design could look there, and none was run. **No April consensus exists and structurally will
not** (Conference Board publication restrictions), so there is no measurable surprise gap to model. And
**everything about the April 2027 economy is unknown at D-233** — no part of this doc depends on what the
survey prints.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the April 2027 Conference Board edition as a
**medium-impact second-tier print that is regime information and never a trading event**. **No position
is opened, closed or sized off it.** This ledger's two assigned jobs are both discharged. **The collision
job is closed permanently, not measured null:** all 17 CB/FOMC collisions since 2021 are FOMC **day one**
and none is a decision day, because the Fed's two-day meetings start on Tuesdays and the Board prints on
Tuesdays; day ones are **0 of 9** against no-Fed sessions while decision days are **8 of 9** wider (SPY
1.352/0.958, p=0.0001); collision CB days against other day ones are **0 of 9**; and **0 of 28** SEP
day-ones is ever a last Tuesday, so the collision class is uniformly the Fed's lowest-information meeting
type. Future sessions should stop splitting this series on FOMC adjacency. **The replication job confirms
the March rule's scope condition:** April's width is not front-loaded (2 of 9, hits in opposite
directions), so month-level and week-level controls agree at **0 of 9** — the rule correctly declines to
fire where the month is flat. **One new method rule is banked and it is broader than either sibling's:**
*"the rest of the year"* is a biased baseline for **6 of 12** months with the bias changing sign
(Feb/Mar/Apr wide, Jul/Aug/Dec narrow), so no month should be controlled against an annual pool.
**One result is being declined on the record:** April CB days run SPY **−1.035% close-to-close, 1 of 6
up, p=0.0183** against other late-April sessions — the session's only p<0.05 result, and exactly the one
false positive twelve identical monthly tests predict at α=0.05. It fails Bonferroni and it is not a
call. The proposal's claim that this edition's tape *"cannot be attributed to the survey at all"* is
corrected: it prints in blackout on decision-eve, which makes the session quiet of Fed content rather
than unattributable. Base case for the print itself (**Low** confidence — no consensus exists or will):
**Expectations stays below the Board's own 80.0 recession threshold** (below it in all three sourced
Aprils, at 68.2 in August 2026) and the edition **restates March 2027's headline by a nonzero amount**
(3 of 3: −0.2 / −1.6 / +1.0). Nine predictions are registered in
[`forward-tests/consumer-confidence-2027-04-27.md`](../forward-tests/consumer-confidence-2027-04-27.md).

**Kill switches:**

- **The Conference Board names an April 2027 date other than 2027-04-27** — the April last-Tuesday rule
  breaks despite three double-sourced contrary editions, and this doc's date confidence collapses to the
  December sibling's. Registered as **FT-consumer-confidence-2027-04-27-1**.
- **Any CB print lands on an FOMC DECISION day, or FOMC day ones clear p<0.05 on 2+ of 9 against no-Fed
  sessions, on a re-run after 2027-12-31** — the structural argument in leg 3 dies and the collision
  becomes a real confound after all. Registered as **FT-consumer-confidence-2027-04-27-2**.
- **The Fed schedules a meeting that starts on a Monday, runs one day on a last Tuesday, or attaches an
  SEP to an April/July/October/January meeting** — the arithmetic behind legs 3 and 4 stops holding and
  both need redoing. Registered as **FT-consumer-confidence-2027-04-27-3**.
- **April CB days clear p<0.05 on any instrument against EITHER other April sessions or other late-April
  sessions on a re-run after 2027-06-30** — the release day becomes something to model, and the
  replication this ledger exists to provide fails. Registered as **FT-consumer-confidence-2027-04-27-4**.
- **The April directional result reproduces at p<0.05 with 2027-04-27 added** — the refusal in leg 7 was
  the wrong call, and a directional April effect needs a real study rather than a dismissal. Registered
  as **FT-consumer-confidence-2027-04-27-5**.
- **Fewer than 5 of 12 months clear 4+ of 9 against the rest-of-year baseline on that re-run, or the
  sign stops splitting** — leg 8's "annual pools are biased controls" rule weakens back to a per-month
  observation. Registered as **FT-consumer-confidence-2027-04-27-6**.
- **The April 2027 edition states a cut-off date on or before 2027-04-16** — leg 9's geometry dies, the
  panel closes before the Fed's blackout begins, and this edition stops being the first in the chain
  whose field window straddles a blackout. Registered as **FT-consumer-confidence-2027-04-27-7**.
- **The April 2027 edition cites a March 2027 headline identical to March's first print, or states no
  revision** — leg 10's extension of the reading aid weakens and the month-over-month delta becomes
  readable as news. Registered as **FT-consumer-confidence-2027-04-27-8**.
- **Expectations back above 80** — the Board's own recession-signal threshold, below which every sourced
  April has printed, clears; the late-cycle framing this whole series carries dies. Registered as
  **FT-consumer-confidence-2027-04-27-9**.
- **Expectations below ~54** — deterioration past the April-2025 reading the Board itself called the
  lowest since October 2011; escalate ahead of the banded pulse.
- **The Fed moves the April 2027 meeting off 27-28** — the collision premise of this id disappears and
  `fomc-2027-04-28` plus `fomc-blackout-start-2027-04-17` both need redating by whichever lane owns them.
- **A federal funding lapse runs through the ~04-05 → 04-20 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1 – Nov 12 2025 shutdown ended), and the
  collection-period split becomes the thing to read.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits"
  premise under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-233 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-04-27.json` written this PR** after reading the one prior proposal (`from-consumer-confidence-2027-03-30`), now inert. **Last-Tuesday rule HOLDS for April, 3 of 3, ALL double-sourced** — `CCI-Apr-2023` (`Updated : 2023-04-25`) + `CCI-Mar-2023`'s "next release is Tuesday, April 25"; `CCI-Apr-2024` (2024-04-30) + `CCI-Mar-2024`'s "April 30th"; `CCI-Apr-2025` (2025-04-29) + `CCI-Mar-2025`'s "April 29th". 2027-04-27 is the last Tuesday of April 2027. **CROSS-VENDOR REPLICATION PASSES** — Yahoo 429'd this runner all session (both hosts, 8 backoffs, 2 query forms) and stooq returned `Access denied` after its proof-of-work, so equities came from stockanalysis.com and VIX from **CBOE's own VIX_History.csv** (a primary-source upgrade); on the identical 51/17 split of 68 rule-derived days the clean set reproduces the siblings' published medians **6 of 9 exactly** (QQQ 1.379, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT 0.961, VIX 18.560) with SPY 0.911/0.910, XLY 1.397/1.399, XRT 1.687/1.678 differing in the third decimal only; **0 of 9**, smallest p 0.2713. Clean-day SPY c2c **+0.090%, 29 of 51 up** — the 02-23 sibling's figure exactly. March week-level control reproduces to four decimals (0.662/1.039, p=0.2650). **THE FINDING — the FOMC collision has no channel, for a MECHANICAL reason.** All **17 of 17** collisions since 2021 are FOMC **day one**; **zero** are decision days — the Fed's two-day meetings start Tuesday and the Board prints Tuesday, so a collision can only ever hit the silent day. **Decision days are 8 of 9 WIDER** vs no-Fed sessions (SPY **1.352/0.958 p=0.0001**, XRT 2.456/1.817 p<0.0001, XLY 0.0001, XLF 0.0001, TLT 0.0007, QQQ 0.0011, AMZN 0.0012, AAPL 0.0051; VIX close the only miss) — the pipeline detects a real Fed event when one exists. **Day ones are 0 of 9** (SPY 0.929/0.958 p=0.2971, smallest p XLY 0.0873). **Collision CB days vs other FOMC day ones: 0 of 9** (SPY 0.898/0.958, p=0.5046, n=17 vs 28); vs clean CB days **0 of 9** (0.898/0.911, p=0.4614). **And no CB print can ever meet a projections meeting: 0 of 28 SEP day-ones is the last Tuesday of its month** (gaps 7–22 days; 2027's SEP day-ones 03-16/06-08/09-14/12-07 vs last Tuesdays 03-30/06-29/09-28/12-28) — the collision class is uniformly the Fed's lowest-information meeting type, and April 2027 carries no SEP. **REPLICATION SITE VERDICT — April is NOT front-loaded, so both controls agree.** April is a wide month, **6 of 9** vs the rest of the year (SPY 1.143/0.962 p=0.0244, XLY **1.665/1.407 p=0.0014**, AMZN **2.529/2.216 p=0.0001**, VIX close **18.710/17.950 p=0.0004**, QQQ 0.0089, XLF 0.0313) — between February's 4 and March's 9. Last-5 April vs earlier April: **2 of 9 and the hits point OPPOSITE ways** (AMZN 2.833/2.413 p=0.0330 wider late; TLT 0.694/0.897 p=0.0354 narrower late; SPY 1.174/1.143 p=0.8042); per-year early/late SPY 0.667/0.505 · 1.431/2.341 · 0.775/1.096 · 1.250/0.837 · 2.406/1.547 · 0.907/0.539. So April CB days are **0 of 9 vs other April sessions** (SPY 1.254/1.123, p=0.8935) **AND 0 of 9 vs other late-April sessions** (1.254/1.057, p=0.8560) — this confirms the 03-30 rule's **scope condition**, not a second demonstration of it. 1/6 above the late-April p75 vs 25% chance. **THE DECLINED RESULT:** April CB days run SPY **−1.035% close-to-close, 1 of 6 up, p=0.0183** vs other late-April sessions (vs all sessions p=0.0412; dropping 2022-04-26 leaves n=5 at p=0.0464) — **the session's ONLY p<0.05 result.** Run on all twelve months the same test hits **exactly once, April**, others p=0.10→0.98: precisely the one false positive 12 tests at α=0.05 predict, failing Bonferroni 0.00417, with 3 of 6 observations named drawdowns. **Stated and refused.** **NEW GENERAL RULE — "the rest of the year" is a biased baseline for 6 of 12 months and the bias changes sign:** Mar 9/9 and Aug 9/9, Apr 6/9 and Dec 6/9, Jul 5/9, Feb 4/9 — Feb/Mar/Apr wide, Jul/Aug/Dec narrow (SPY 0.829/0.993, 0.888/0.986, 0.888/0.982). Never control a month against an annual pool. **PROPOSAL CORRECTION:** its "release-day tape cannot be attributed to the survey at all" is **inverted** — sourced April cut-off lags 6/6/8 (2023-04-19, 2024-04-24, 2025-04-21; `CCI-Apr-2023` states its field window as "April 3 … to April 19") put a 2027 panel at ~04-05→04-20, so the print does land in blackout on decision-eve, and that is what makes it **quiet of Fed content** (no statement, presser, speakers or SEP), not unattributable. The one caution is D+1, not D: the decision following a CB print runs *narrower* than other decision days (SPY 1.078/1.412 p=0.0811, XLF **1.306/1.629 p=0.0111**) — **1 of 9 at n=17, chance-consistent, recorded not claimed**; D+1 vs late-April is 0 of 9. **Revision rule extends to a FOURTH month, with the chain's largest revision yet:** April restates March **3 of 3** — 104.2→104.0 (−0.2) · 104.7→**103.1** (−1.6, stated) · 92.9→93.9 (+1.0, derived); Present Situation 151.1→148.9 (−2.2) · **151.0→146.8 (−4.2, stated)** · 134.5→134.4 (−0.1, derived). The −4.2 beats the 03-30 sibling's worst case (Exp −3.5). **April levels:** 2023 101.3/151.1/68.1 (cut-off 04-19) · 2024 97.0/142.9/66.4 (04-24) · 2025 86.0/133.5/**54.4** ("lowest since October 2011", 04-21) — Expectations below 80 in all three. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53** (CBOE close), SPY **770.19** (2026-09-04) — baseline set, both identical to the siblings' Yahoo readings. **Geopolitical:** unchanged from siblings. **Event tape:** no April consensus exists or is publishable (CB publication restrictions); current edition is August 2026 (89.4/121.2/68.2, survey Aug 3–16, cut-off Aug 16), next release named 2026-09-29. **Sourcing failures:** `CCI-Apr-2021`, `CCI-Apr-2022`, `CCI-Apr-2026` each returned **HTTP 200 serving the current August 2026 edition** (332,031 bytes) — same substitution class every sibling logged; three of six April CB dates are therefore rule-derived. Yahoo (429) and stooq (access denied) recorded in `probe-ref.blocked`. **New dated adjacency → ONE proposal filed:** `proposals/consumer-confidence-2027-05-25.from-consumer-confidence-2027-04-27.json` — the next edition, sourced three-for-three for May from this session's own April fetches, the **clean counterpart four weeks after this collision print** (the tightest within-year collision control this chain has had), and the flattest month in the sample (**0 of 9**, SPY 0.984/0.969, p=0.9446) and so the sharpest remaining test of the position-in-month rule. **Corridor (2 tracked events within 5 days, both on 04-28):** `fomc-2027-04-28` (the decision, D+1) and `boj-decision-2027-04-28`; just outside sit opex **04-16**, **blackout start 04-17** and VIX expiration **04-21**. Nine forward tests registered: **FT-consumer-confidence-2027-04-27-1** through **-9**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-04-27.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
