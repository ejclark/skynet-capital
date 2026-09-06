# Conference Board Consumer Confidence (September 2027) — consumer-confidence-2027-09-28

**Kind:** macro-print · **Date:** 2027-09-28 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session 3-of-3 for September off the editions themselves — 2022-09-27, 2023-09-26, 2024-09-24 — each double-sourced *forward* by its own August predecessor's next-release line and *backward* by the October edition it announced, and the calendar arithmetic independently confirmed 12-of-12 for 2027 by a second publisher's posted forward calendar, FHFA's "2027 HPI Release Dates") · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["fhfa-hpi-2027-09-28"],"screenStreak":0,"blocked":[{"url":"https://www.kansascityfed.org/research/jackson-hole-economic-symposium/","status":"EGRESS_TIMEOUT","at":"2026-09-06"},{"url":"https://www.kansascityfed.org/research/jackson-hole-economic-symposium/jackson-hole-2026/","status":"EGRESS_TIMEOUT","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/*","status":"200-CAPTCHA-421","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **The parent proposal filed this id with three cautions attached; the first one is arithmetically
wrong, and correcting it turned up the structural finding this chain did not know it had.** The proposal
warned that the September print "sits INSIDE the 2027 FOMC blackout (Sep 4-16)." It does not — **2027-09-28
is twelve days after that window closes** and thirteen days after the September 14-15 decision. What is true
is stranger: **the blackout sits inside the print's SURVEY PANEL, not over its release**, and that is new.
**The September FOMC decision day has moved earlier every single year — 09-22, 09-21, 09-20, 09-18, 09-17,
09-16, 09-15 for 2021 through 2027 — while the print stays pinned to the last Tuesday, so the gap flipped
from D+6 (2021–2024) to D+13 (2025–2027).** Under the ~16-day field window the editions' own stated cut-offs
imply, that flip moves the decision **from outside the survey panel to inside it**. **Only 1 of the 5
September prints in the tape window has the shape 2027 will have.** So the September record is n=1 on the
relevant configuration, and this ledger says so rather than averaging across a regime break. **The
configuration is then measured, and it is null at the best power this chain has managed on the question:**
splitting all 51 clean CB days by whether a decision fell inside the print's field window gives **16 heard vs
35 deaf, 0 of 9** (smallest p AAPL 0.0604) — the [August sibling](consumer-confidence-2027-08-31.md) showed
the print-day collision carries nothing; **the panel's content carries nothing either.** Its collision null
also **replicates out of sample**: September CB vs July CB is **0 of 9**. **But its cell rule does not
transfer.** Late August is 6 of 9 *narrower*; **late September is 1 of 9 and that leg is TLT WIDER** —
September is where the summer compression ends (VIX 17.20 vs August's 16.27, p=0.0402). **Two source results
reach past this event.** A **third URL slug form** (`CCI-Sept-<year>`) serves the September editions six
sibling ledgers had recorded as unreachable — and the publisher's origin answers a burst of parallel requests
with a **1,021-byte captcha page under HTTP 200**, which a status-code check would have ingested as data.
Date **estimate**; `symbols: []`; **0** macro-keyed playbooks; **0** tracked events existed anywhere in
September 2027 before this PR.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-387) | **Stand aside** | High | `symbols: []`, D-387, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-09-28** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026, released 08-25**: headline **89.4**, Present Situation **121.2**, Expectations **68.2**, cut-off **August 16**; the page names **2026-09-29** as the next release. Market state **2026-09-04**: VIX **14.53**, SPY **770.19**. | The Conference Board naming a September 2027 date other than **2027-09-28** before **2027-09-07**, which breaks the September rule this doc's date rests on |
| This month | **Stop asking whether the Fed reaches this print — the panel-content control is null at n=16 vs 35** | High | Clean CB days whose survey panel contained an FOMC decision vs those whose did not: **0 of 9**, smallest p AAPL **0.0604**; CB days within 20 days after a decision vs further out **0 of 9** at n=24 vs 27. Both are better powered than the n=6 arms the collision question was settled on. | Panel-heard CB days clearing p<0.05 on 2+ of 9 against panel-deaf CB days on a re-run of the same nine-instrument pipeline after **2027-12-31** |
| This quarter | **Do not read the September tape record as if it described 2027 — 4 of its 5 observations are a retired configuration** | High | The September FOMC drifted earlier every year 2021→2027; the print's gap flipped **D+6 → D+13** in 2025 and the panel went from Fed-deaf to Fed-hearing. Only **2025-09-30** shares 2027's shape. | The Committee moving the September 2027 meeting off **09-14/15** to a date that restores D+6, observable when the 2027-07-27/28 meeting confirms it |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks, and
  the print day is null against every one of the six controls run here.
- **The Conference Board names a September 2027 date** → adopt it verbatim. The rule says **09-28**;
  registered as **FT-consumer-confidence-2027-09-28-1**.
- **The parent's blackout caution is void — the print is 12 days AFTER the window, not inside it.**
  Registered as **FT-consumer-confidence-2027-09-28-2**.
- **Treat the September print as a D+13 event, not a D+6 one** — the configuration changed in 2025 and
  2027 is its third year. Registered as **FT-consumer-confidence-2027-09-28-3**.
- **Stop pricing Fed transmission into a CB print at all** — panel-heard vs panel-deaf is 0 of 9 at
  n=16 vs 35. Registered as **FT-consumer-confidence-2027-09-28-4**.
- **The collision null replicates out of sample** — September vs July CB days is 0 of 9, a second
  independent clean-vs-colliding comparison. Registered as **FT-consumer-confidence-2027-09-28-5**.
- **Do not carry the August cell rule into September** — late September is 1 of 9 and WIDER, not
  narrower. Registered as **FT-consumer-confidence-2027-09-28-6**.
- **Project September's cut-off at 09-20 → 09-21** — lags are **7 / 8 / 7**, the tightest spread in the
  chain. Registered as **FT-consumer-confidence-2027-09-28-7**.
- **Read the 80 threshold through a ±2.0 band, not as a line** — inside it 3 of 5 first prints flipped
  side on revision, outside it 0 of 5. Registered as **FT-consumer-confidence-2027-09-28-8**.
- **Expect September to revise August UP** — 3 of 3 on the headline (+0.4 / +2.6 / +2.3), the mirror of
  August's downward restatement of July. Registered as **FT-consumer-confidence-2027-09-28-9**.
- **Validate a Conference Board fetch by BYTE COUNT, never by HTTP status** — the origin serves a
  1,021-byte captcha page under 200 once you fetch in parallel.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication restrictions —
  structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **2026-09-16** · CB print **2026-09-29** · CPI **2026-10-14** · FOMC
  **2026-10-28** · FOMC **2026-12-09** · CB print + FOMC day one **2027-04-27** (est.) · CB print
  **2027-06-29** (est.) · CB print + FOMC day one **2027-07-27** (est.) · CB print **2027-08-31** (est.) ·
  **blackout begins 2027-09-04** (est., proposed this PR) · **FOMC decision + SEP 2027-09-15** (est.,
  proposed this PR) · **this print + FHFA HPI July-2027 monthly 2027-09-28** (est., FHFA leg proposed this
  PR) · **FOMC minutes 2027-10-06** (projected, not proposed here) · CB print + FOMC day one
  **2027-10-26** (est., proposed this PR).

## Initial research

### The question, plainly

The [August sibling](consumer-confidence-2027-08-31.md) filed this id and attached three cautions: project
September's cut-off lag from a **wider sample** than its single sourced observation; note that the print
**"sits INSIDE the 2027 FOMC blackout (Sep 4-16 is the decoded window and the 09-14/15 meeting follows it)"**,
unlike the blackout-free August print; and re-run the August null control against **September, clean 5 of 5**,
for the out-of-sample n it said it lacked. It also named September as the scoring venue for its own
80-threshold finding and as the first edition that can hear Jackson Hole.

So: **is the blackout caution right? what are September's own lags? and does the null survive a second clean
month?**

**One-line verdict:** the blackout caution is **arithmetically wrong** — 2027-09-28 is twelve days *after*
the window closes — and correcting it exposed the thing worth knowing: **the September print changed shape in
2025**, because the September FOMC has drifted earlier every year while the print stayed on the last Tuesday,
so the gap flipped **D+6 → D+13** and the decision moved from *outside* the survey panel to *inside* it;
**only 1 of the 5 September prints in the tape window has 2027's configuration**; the new configuration is
then measured and comes back **null at n=16 vs 35, the best-powered Fed-transmission test this chain has
run**; the August collision null **replicates out of sample** (September vs July, 0 of 9) while the August
*cell* rule **does not transfer** (late September 1 of 9, and WIDER); September's lags are **7 / 8 / 7**, the
tightest spread in the chain; the 80-threshold record resolves into a **±2.0-point band** rather than a
refutation; and a **third URL slug form** unlocks a month six sibling ledgers had written off.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Publisher sources fetched direct 2026-09-06**, serially, each verified
against its own `Source: <Month> <Year> Consumer Confidence Survey` line **and** its own `Updated: <date>`
stamp rather than trusted by slug: `conference-board.org/topics/consumer-confidence` (**332,031 bytes**,
byte-identical to the June, July and August siblings' fetches) plus nine editions —
`CCI-Sept-2022` (884,195), `CCI-Sept-2023` (1,040,855), `CCI-Sep-2024` (517,680), `CCI-August-2022`
(883,112), `CCI-August-2023` (1,254,077), `CCI-Aug-2024` (883,880), `CCI-Oct-2022` (887,350), `CCI-Oct-2023`
(1,247,171), `CCI-Oct-2024` (894,379). **The forward-calendar corroboration was re-fetched, not inherited:**
`fhfa.gov/data/hpi`, HTTP 200, **89,663 bytes**, parsed in full. **The FOMC dates are primary:**
`federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, **166,936 bytes** — and that number is *not*
the 164,831 five sibling ledgers record for this same page on this same date, which is noted in leg 3 rather
than smoothed over. **The Jackson Hole dates are primary and came from a reachable substitute:**
`federalreserve.gov/newsevents/speech/<year>-speeches.htm` for 2021–2025.

**The tape.** Equity and ETF daily OHLC from **stockanalysis.com** and VIX from **CBOE's own
`VIX_History.csv`** (472,309 bytes) — the same vendor pair the April through August siblings used, which
makes this session's numbers directly comparable. SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF, TLT and VIX for
**2020-12-01 → 2026-09-04** (n=**1,447** sessions — the siblings' count exactly), session range
`(high − low) / open`, two-sided Mann-Whitney U with tie correction, VIX measured on close. CB days are the
**68** rule-derived last Tuesdays from 2021-01 to 2026-08. Market readings: **2026-09-04 closes, SPY 770.19
and VIX 14.53.**

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for September — SUPPORTED three-for-three, and each one is double-sourced
   in BOTH directions, which no sibling has managed.** The proposal that filed this id could cite only the
   preceding August editions, because no September edition was reachable. All three are now in hand:

   | Edition | Released | Weekday | Last Tuesday of that September | Announced in advance by | Confirmed forward by |
   |---|---|---|---|---|---|
   | September 2022 | 2022-09-27 | Tue | 09-27 | `CCI-August-2022`: *"The next release is Tuesday, September 27 at 10 AM ET"* | its own *"next release is Tuesday, October 25"* → `CCI-Oct-2022`, released 2022-10-25 |
   | September 2023 | 2023-09-26 | Tue | 09-26 | `CCI-August-2023`: *"Tuesday, September 26"* | *"Tuesday, October 31"* → `CCI-Oct-2023`, released 2023-10-31 |
   | September 2024 | 2024-09-24 | Tue | 09-24 | `CCI-Aug-2024`: *"Tuesday, September 24th"* | *"Tuesday, October 29th"* → `CCI-Oct-2024`, released 2024-10-29 |

   The forward leg is worth more than it looks: **2023-10-31 is the FIFTH Tuesday of its month**, so the
   sourced record distinguishes "last Tuesday" from "fourth Tuesday" — a distinction the chain has asserted
   for fourteen ledgers without an instance behind it. **2027-09-28 is the last Tuesday of September 2027**
   and a full NYSE session (Labor Day 2027 is 09-06). Registered as **FT-consumer-confidence-2027-09-28-1**.

2. **THE MONTH WAS NEVER BLOCKED — A THIRD SLUG FORM SERVES IT, AND THE PUBLISHER'S ORIGIN SERVES A CAPTCHA
   UNDER HTTP 200.** Two method findings, both of which reach every sibling in this chain.

   The August sibling banked that the publisher uses full month names for 2022–2023 and abbreviated ones for
   2024. That is not the rule. September takes a **third form**: `CCI-Sept-2022` and `CCI-Sept-2023` serve
   real editions while `CCI-September-*` and `CCI-Sep-*` redirect to the topic landing page for those years,
   and 2024 inverts it — `CCI-Sep-2024` serves and `CCI-Sept-2024` redirects. October is abbreviated in all
   three years (`CCI-Oct-*`) even though August 2022 and 2023 are spelled out. **The convention is
   per-month-per-year and must be probed, not derived.** Six sibling ledgers have logged September editions
   under the standing `200-SERVED-CURRENT-EDITION` class; at least for 2022–2024 that class was a naming
   guess, not a block.

   The second finding cost this session the ability to keep probing. A parallel sweep of 144 candidate slugs
   tripped the origin's bot defence, which answers with a **1,021-byte page under HTTP 200** reading *"User
   validation required to continue"* and *"error code: 421"*. **A fetcher checking `res.ok` would have
   ingested it as an edition.** The nine editions above were all fetched serially *before* the sweep and are
   unaffected; the block is recorded in `probe-ref.blocked` and the rule is: **fetch this publisher serially,
   and validate by byte count and the `Source:` line, never by status.**

3. **The pipeline replicates the April through August siblings EXACTLY, 9 of 9 — which is what licenses
   everything below.** On the identical window the 68 rule-derived CB days split **51 clean / 17 colliding**,
   the collisions are 17 day-ones and **0 decision days**, and the clean set's medians reproduce the
   published table **to three decimals on all nine instruments**: SPY **0.911**, QQQ **1.379**, XLY
   **1.397**, XRT **1.687**, AMZN **2.154**, AAPL **1.731**, XLF **1.119**, TLT **0.961**, VIX close
   **18.560** — **0 of 9**, smallest p XLF **0.2713**. Clean-day SPY close-to-close is **+0.090% median, 29
   of 51 up**, character-for-character the February, April, May, June, July and August siblings' figure. The
   FOMC parser's three banked assertions all held (**56** meetings, **8** in every year 2021–2027, **17**
   collisions), including the August sibling's phantom-match trap.

   **One replication did NOT hold, and it is a source, not a statistic.** Five sibling ledgers record
   `fomccalendars.htm` at **164,831 bytes**, all on 2026-09-06. This session's fetch of the same URL on the
   same date returned **166,936**. The 2027 meeting panel is character-identical and the page's own stamp
   still reads *"Last Update: August 19, 2026"*, so nothing downstream moves — but **the chain should stop
   describing this fetch as byte-identical**, because it demonstrably is not stable within a single day.

4. **THE PROPOSAL'S BLACKOUT CAUTION IS WRONG, AND THE CORRECTION IS NOT A DETAIL — REFUTED.** The proposal
   states the September print *"sits INSIDE the 2027 FOMC blackout (Sep 4-16 is the decoded window and the
   09-14/15 meeting follows it)"*. Both halves of the parenthesis are right and the conclusion does not
   follow. The Board's own rule — *"the blackout period will begin at the start of the Saturday that falls
   ten days earlier … and end at the end of Thursday"* — applied to a Tuesday-start 2027-09-14 meeting gives
   **Saturday 2027-09-04 through Thursday 2027-09-16**, reproducing the `fomc-blackout-start-2027-04-17`
   lane's decode to the day. **The print is 2027-09-28: twelve days after the window closes, thirteen days
   after the decision, and in the middle of a 28-day clear-air gap that runs 09-17 to 10-15.**

   What the caution was reaching for is real and better: **the blackout falls inside the print's survey
   panel, not over its release.** Under the field window the editions' own cut-offs imply (leg 7), the 2027
   panel runs about **09-05 → 09-21** — so roughly its first eleven days are Fed-silent and its last six are
   not, and the decision plus its SEP land in the middle. Registered as
   **FT-consumer-confidence-2027-09-28-2**.

5. **AND THAT IS ONLY TRUE BECAUSE THE SEPTEMBER PRINT CHANGED SHAPE IN 2025 — the finding this ledger
   exists for.** The September FOMC decision day has moved earlier in **every single year** of the record,
   while the Conference Board print stays pinned to the last Tuesday:

   | Year | FOMC (decision) | SEP? | CB print | Gap | Panel ≈ | Panel contains the decision? |
   |---|---|---|---|---|---|---|
   | 2021 | 09-22 | yes | 09-28 | **D+6** | 09-05 → 09-21 | no |
   | 2022 | 09-21 | yes | 09-27 | **D+6** | 09-04 → 09-20 | no |
   | 2023 | 09-20 | yes | 09-26 | **D+6** | 09-03 → 09-19 | no |
   | 2024 | 09-18 | yes | 09-24 | **D+6** | 09-01 → 09-17 | no |
   | 2025 | 09-17 | yes | 09-30 | **D+13** | 09-07 → 09-23 | **yes** |
   | 2026 | 09-16 | yes | 09-29 | **D+13** | 09-06 → 09-22 | **yes** |
   | **2027** | **09-15** | **yes** | **09-28** | **D+13** | **09-05 → 09-21** | **yes** |

   The mechanism is two calendars sliding past each other: the meeting drifts one day earlier a year while
   the last Tuesday oscillates within 09-24…09-30, and the 2024→2025 print jump (09-24 → 09-30) pushed the
   gap past the panel boundary. **The September edition is now a different document than it was**: through
   2024 its panel closed *before* the decision; from 2025 it closes *after*. **Four of the five September CB
   days in the tape window are the retired shape.** Any inference about 2027 drawn from "September CB days"
   is therefore drawn mostly from a configuration that no longer applies — which is the single most
   important limit on everything in this ledger. Registered as **FT-consumer-confidence-2027-09-28-3**.

6. **SO THE CONFIGURATION WAS MEASURED DIRECTLY, ACROSS ALL CB DAYS, AND IT IS NULL AT THE BEST POWER THIS
   CHAIN HAS ACHIEVED ON THE FED QUESTION.** Rather than test 2027's shape on n=1, every clean CB day was
   classified by whether an FOMC decision fell inside its own field window:

   | Control | n | Result | SPY | smallest p |
   |---|---|---|---|---|
   | **Clean CB days whose panel HEARD a decision vs those that did not** | 16 vs 35 | **0 of 9** | 0.914 / 0.911, p=0.3557 | AAPL **0.0604** |
   | Panel-heard CB days vs all non-CB sessions | 16 vs 1,379 | **0 of 9** | 0.914 / 0.973, p=0.2048 | AAPL 0.0612 |
   | Clean CB within 20 days after a decision vs further out | 24 vs 27 | **0 of 9** | 0.760 / 1.010, p=0.2949 | AAPL 0.1108 |
   | CB days at D+10…D+16 after a decision vs all other CB days | 13 vs 55 | **0 of 9** | 0.914 / 0.898, p=0.7551 | AMZN 0.0983 |

   **The August sibling proved the print-day collision carries nothing; this proves the panel's Fed content
   carries nothing either** — and it does so at 16-vs-35 and 24-vs-27 rather than the 6-vs-6 the collision
   question rested on. Between the two results, the chain can now retire the Fed-transmission framing
   entirely rather than one instance of it. Registered as **FT-consumer-confidence-2027-09-28-4**.

7. **THE AUGUST SIBLING'S COLLISION NULL REPLICATES OUT OF SAMPLE — SUPPORTED, and it is the second clean
   month it asked for.** September CB days are **clean 5 of 5** (2021-09-28, 2022-09-27, 2023-09-26,
   2024-09-24, 2025-09-30), so they are an independent clean arm against July's 0-of-6 colliding one:

   | Control | n | Result | SPY | smallest p |
   |---|---|---|---|---|
   | **September CB (clean) vs July CB (colliding)** | 5 vs 6 | **0 of 9** | 1.119 / 0.921, p=0.5228 | TLT 0.2353 |
   | September CB vs **August** CB (the other clean month) | 5 vs 6 | **0 of 9** | 1.119 / 0.668, p=0.2353 | AMZN 0.0828 |
   | September CB vs other **clean** CB days | 5 vs 46 | **0 of 9** | 1.119 / 0.911, p=0.3033 | AMZN 0.1169 |
   | September CB vs other **September** sessions | 5 vs 102 | **1 of 9** — AMZN 0.0424 **WIDER** | 1.119 / 0.903, p=0.3960 | — |
   | September CB vs other **late-September** (≥22nd) sessions | 5 vs 28 | **0 of 9** | 1.119 / 0.950, p=0.7065 | AMZN 0.0747 |
   | September CB vs all non-CB sessions | 5 vs 1,379 | **0 of 9** | 1.119 / 0.973, p=0.5265 | TLT 0.1119 |
   | September CB vs other quarter-end last-4 sessions | 5 vs 88 | **0 of 9** | 1.119 / 0.837, p=0.2365 | AMZN 0.0671 |

   Seven controls, and the single α-crossing is **AMZN at 0.0424 in the wrong direction** on the arm with the
   most tests behind it — one hit in sixty-three instrument-comparisons, which is fewer than chance predicts.
   **The honest read is that it is noise, and it is stated rather than dropped.** Registered as
   **FT-consumer-confidence-2027-09-28-5**.

8. **BUT THE AUGUST SIBLING'S CELL RULE DOES NOT TRANSFER — REFUTED, and this is where the two months
   genuinely differ.** Its finding was *"read the cell, ignore the day"*: late August runs **6 of 9
   narrower** than the rest of the year. Run identically on September:

   | Comparison | n | Result | SPY | VIX |
   |---|---|---|---|---|
   | **Late September (22nd onward) vs the rest of the year** | 33 vs 1,414 | **1 of 9 — TLT 0.0396 WIDER** | 0.950 / 0.970, p=0.6881 | 17.52 / 18.09 |
   | September (all sessions) vs the rest of the year | 107 vs 1,340 | **3 of 9 narrower** — XRT 0.0163, QQQ 0.0177, AMZN 0.0241 | 0.903 / 0.973, p=0.3543 | 17.20 / 18.17 |
   | **September vs August** | 107 vs 132 | **3 of 9 — all WIDER**: AAPL 0.0121, XLF 0.0300, VIX 0.0402 | 0.903 / 0.892, p=0.1770 | **17.20 / 16.27** |
   | **September vs the summer block Jun+Jul+Aug** | 107 vs 383 | **1 of 9 — VIX 0.0072 WIDER** | 0.903 / 0.873, p=0.1803 | **17.20 / 16.48** |

   Monthly VIX medians make the shape plain: **Jun 16.73 · Jul 16.50 · Aug 16.27 · Sep 17.20 · Oct 19.34.**
   **September is where the summer compression ends** — it is measurably wider than August and wider than the
   whole summer block on VIX, and its late-month cell is not quiet at all. The August sibling's advice was
   right *for August*; carried one edition forward it inverts. **The generalizable rule is that a
   fixed-position release inherits its cell's regime, and the regime is monthly** — the same correction the
   [March sibling](consumer-confidence-2027-03-30.md) made when it found the month was not enough and the
   week was. Registered as **FT-consumer-confidence-2027-09-28-6**.

9. **SEPTEMBER'S CUT-OFF LAGS ARE THE TIGHTEST IN THE CHAIN — the proposal's caution was right in principle
   and the spread it feared is not there.** Read off the stated cut-off lines:

   | Edition | Released | Stated cut-off | Lag |
   |---|---|---|---|
   | September 2022 | 2022-09-27 | *"cutoff date for the preliminary results was September 20"* | **7 days** |
   | September 2023 | 2023-09-26 | *"…was September 18"* | **8 days** |
   | September 2024 | 2024-09-24 | *"…was September 17, 2024"* | **7 days** |

   Against August's **7/9/6** (spread 3), July's **5/6/8** (3), June's **6/7/6**, May's **8/7/8** and April's
   **6/6/8**, September's **1-day spread** is the narrowest any month in this chain has shown. Applied to
   2027-09-28 with the sixteen-day field length `CCI-Apr-2023` states: cut-off **09-20 to 09-21**, window
   **09-04/05 → 09-20/21**. The proposal was correct that one observation cannot carry a projection; having
   three, the projection is unusually tight rather than unusually wide. Registered as
   **FT-consumer-confidence-2027-09-28-7**.

10. **THE 80 THRESHOLD RESOLVES INTO A BAND — the August sibling's refutation is neither confirmed nor dead,
    it is quantified.** Its registered kill switch was *"three consecutive sourced editions whose
    first-printed Expectations and its next-month restatement fall on the same side of 80.0"*. The three
    sourced Augusts do exactly that (75.1→75.8, 80.2→83.3, 82.5→86.3). But reading only the Augusts hides
    the structure. All **ten** first-print→restatement pairs this chain can source, with the flips marked:

    | First print (Expectations) | Restated to | Δ | Distance of first print from 80.0 | Flipped side? |
    |---|---|---|---|---|
    | Jun 2023 **79.3** | 80.0 | +0.7 | 0.7 | **yes (up)** |
    | Jul 2022 65.3 | 65.6 | +0.3 | 14.7 | no |
    | Jul 2023 88.3 | 88.0 | −0.3 | 8.3 | no |
    | Jul 2024 **78.2** | 81.1 | +2.9 | 1.8 | **yes (up)** |
    | Aug 2022 75.1 | 75.8 | +0.7 | 4.9 | no |
    | Aug 2023 80.2 | 83.3 | +3.1 | 0.2 | no |
    | Aug 2024 82.5 | 86.3 | +3.8 | 2.5 | no |
    | **Sep 2022 80.3** | **79.5** | **−0.8** | 0.3 | **yes (DOWN)** |
    | Sep 2023 73.7 | 76.4 | +2.7 | 6.3 | no |
    | Sep 2024 81.7 | 82.8 | +1.1 | 1.7 | no |

    **Three findings.** (a) `CCI-Oct-2022`'s restatement of September 2022 from **80.3 down to 79.5** is the
    chain's **first downward threshold flip** — every flip the August sibling had was upward, which had made
    the mechanism look like a systematic upward bias rather than a proximity effect. (b) **The flips are a
    function of distance, not of luck:** of the five first prints within **2.0 points** of 80.0, **three
    flipped**; of the five further away, **none did**. (c) Revisions run **8 up / 2 down**, median **+0.75**,
    largest **+3.8** — so a ±2.0 band captures the flip risk at roughly the 70th percentile of revision
    magnitude, and a reader wanting certainty needs ±3.8. **The usable rule is a band, not a refusal:** a
    first-printed Expectations reading **outside 78.0–82.0 may be read against the threshold immediately;
    inside it, wait for the restatement.** The August sibling's kill switch fires *as literally worded* on
    its own three Augusts — that fragment is that lane's to score and is deliberately untouched here — but
    the finding it protects survives in sharper form. Registered as **FT-consumer-confidence-2027-09-28-8**.

11. **SEPTEMBER IS THIS CHAIN'S UPWARD-REVISING MONTH, AND AUGUST IS ITS DOWNWARD ONE — SUPPORTED 3 of 3, a
    contrast no sibling could see with one month in hand.** September restates August in every sourced case:

    | August, as first printed | Restated in the September edition | Revision |
    |---|---|---|
    | Aug 2022 **103.2 / 145.4 / 75.1** | `CCI-Sept-2022`: *"up from 103.6 in August"*, PS *"from 145.3 last month"*, Exp *"from 75.8"* | **+0.4** / −0.1 / +0.7 |
    | Aug 2023 **106.1 / 144.8 / 80.2** | `CCI-Sept-2023`: *"from an upwardly revised 108.7 in August"*, PS *"from 146.7"*, Exp *"after falling to 83.3 in August"* | **+2.6** / +1.9 / +3.1 |
    | Aug 2024 **103.3 / 134.4 / 82.5** | `CCI-Sep-2024`: *"from an upwardly revised 105.6 in August"*, PS derived 134.6, Exp derived 86.3 | **+2.3** / +0.2 / +3.8 |

    **Headline 3 of 3 UP**, mean **+1.77**. The August sibling's own table has August restating July at
    **−0.4 / −3.0 / +1.6** — 2 of 3 *down*, and holding this chain's two largest downward revisions. So the
    two adjacent editions revise in opposite directions, consistently, and **"expect a nonzero restatement"
    can be sharpened to "expect an upward one" for September specifically.** The Expectations column is the
    same story amplified: **+0.7 / +3.1 / +3.8**, the largest and most one-sided revision set anywhere in the
    chain, which is also why leg 10's flip risk concentrates here. Registered as
    **FT-consumer-confidence-2027-09-28-9**.

12. **THE QUARTER-END REGIME GETS A THIRD DEFINITION AND A THIRD NUMBER — which strengthens the August
    sibling's caution rather than resolving it.** That sibling found the June and July siblings' **6 of 9**
    quarter-end result became **4 of 9** once a single 4-session partial month-instance was excluded. This
    session, filtering month-instances at **≥10 sessions**, gets **5 of 9** — XRT 0.0023, XLF 0.0062, QQQ
    0.0316, SPY 0.0401, AMZN 0.0499, every significant leg narrower, SPY 0.848 / 0.974. **Three defensible
    definitions, three answers: 4, 5 and 6 of 9.** The regime is real and its headline count is not a fact
    about the market, it is a fact about the month-instance filter — which is exactly what the August sibling
    said, now with a number attached to the sensitivity. **This print's own position is unaffected either
    way:** 2027-09-28 sits in the quarter-end last-4 cell (September 2027's final sessions are 09-27 through
    09-30), and September CB days are **0 of 9** against other quarter-end last-4 sessions.

13. **JACKSON HOLE — the August sibling registered a dated question at n=1 because its source was blocked;
    this session answers it at n=6 from a source that is not.** `kansascityfed.org` timed out again here
    (twice, recorded in `probe-ref.blocked`), but the Board's **own speech indexes** date the chair's
    symposium keynote directly:

    | Year | Keynote | Weekday | Speaker / title |
    |---|---|---|---|
    | 2021 | **08-27** | Fri | Powell, *"Monetary Policy in the Time of COVID"* |
    | 2022 | **08-26** | Fri | Powell, *"Monetary Policy and Price Stability"* |
    | 2023 | **08-25** | Fri | Powell, *"Inflation: Progress and the Path Ahead"* |
    | 2024 | **08-23** | Fri | Powell, *"Review and Outlook"* |
    | 2025 | **08-22** | Fri | Powell, *"Monetary Policy and the Fed's Framework Review"* |
    | 2026 | **08-28** | Fri | Warsh, *"In Our Time"* (this repo's existing `jackson-hole-2026-08-28` entry) |

    **Six for six a Friday inside 08-22…08-28.** Two consequences follow without further data. The **August**
    edition has never been able to hear it: its stated cut-offs are 08-23 / 08-20 / 08-21 / 08-16 and every
    keynote post-dates its year's cut-off, **4 of 4** — which converts the August sibling's structural claim
    from an argument into a measurement. And the **September** panel always opens after it (earliest opening
    in the record, 09-01), so **the September edition is the first document each year whose entire panel
    post-dates the symposium** — the premise the proposal filed this id on, now sourced. For 2027 the band
    projects to Friday **2027-08-27**, comfortably before the 09-04/05 panel opening.

14. **The directional result is declined for the sixth month running — SUPPORTED as a refusal.** September CB
    days run SPY **−0.255% close-to-close median, 2 of 5 up**, against **+0.040%** on other late-September
    sessions — **p=0.3796** (0.2023 vs all non-CB sessions). Re-running the identical test on all twelve
    months clears p<0.05 **exactly once**, April at **p=0.0150** — character-for-character the July sibling's
    figure — failing Bonferroni at 0.05/12 = 0.00417, **the one false positive twelve tests at α=0.05
    predict.** Six consecutive months measured, six refusals.

15. **Tracked-name sensitivity is nil and the corridor was empty — SUPPORTED.** `symbols: []`. A re-grep of
    `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any macro- or
    sentiment-keyed playbook returns **0 hits**. **Before this PR this calendar held no event anywhere in
    September 2027.** Four are proposed here: `fhfa-hpi-2027-09-28` (the same morning, 9:00 ET, a *monthly*
    index covering July 2027 — not the quarterly edition the August sibling proposed for its own date),
    `fomc-2027-09-15` (the decision + SEP that leg 5 rests on), `fomc-blackout-start-2027-09-04` (leg 4's
    anchor), and `consumer-confidence-2027-10-26` (the next edition, and 2027's fourth collision print). A
    fifth, `fomc-minutes-2027-10-06` — the Sep 14-15 meeting plus the Board's three-week rule, verified 42 of
    45 by the `fomc-minutes-2027-08-18` lane — is **deliberately not proposed**, routed instead to whichever
    lane takes `fomc-2027-09-15`, following the August sibling's own precedent.

### What the conditions support

**A refusal, plus one correction and one structural discovery that outlives it.** The refusal first, because
it is the only trading-adjacent line here: **nothing is opened, closed or sized off this print** —
`symbols: []`, zero macro-keyed playbooks, D-387, and the print day null on six of the seven controls
constructed here with the seventh a single wrong-signed hit in sixty-three tests. **The correction is that
the caution this id was filed with is arithmetically wrong**: 2027-09-28 is not inside the 09-04→09-16
blackout, it is twelve days past it. **The discovery is what chasing that error found.** The September FOMC
has drifted earlier every year for seven years while the print stayed on the last Tuesday, so the gap flipped
**D+6 → D+13** in 2025 and the decision moved from outside the survey panel to inside it — **2027 is the
third year of a configuration that 4 of the 5 September prints in the tape window do not share.** That is a
warning about reading this chain's own history, and it is the reason this ledger tested the *configuration*
across all 51 clean CB days instead of testing 2027's shape on n=1. **The configuration is null, at the best
power the chain has managed:** panel-heard vs panel-deaf CB days, **0 of 9 at 16 vs 35**. Set beside the
August sibling's print-day result, the Fed-transmission framing can now be retired rather than re-litigated.
**Two of that sibling's results travel and one does not.** Its collision null **replicates out of sample** —
September vs July, 0 of 9 — and its "read the cell" rule **inverts**: late September is 1 of 9 and that leg
is *wider*, because September is where the summer compression ends (VIX 17.20 vs August's 16.27, p=0.0402).
**Three reading rules are sharpened.** September's cut-off lags are **7 / 8 / 7**, the tightest spread in the
chain, projecting **09-20 → 09-21**. The 80 threshold becomes a **band**: inside ±2.0 points of 80.0, 3 of 5
first prints flipped side on revision; outside it, 0 of 5 — and the chain's first *downward* flip
(Sep 2022, 80.3 → 79.5) is what makes it a proximity effect rather than an upward bias. And **September
revises August up 3 of 3** (+0.4 / +2.6 / +2.3 headline) where August revises July down 2 of 3, so "expect a
nonzero restatement" becomes "expect an upward one." **Two method results are worth more than any statistic
here:** a third slug form (`CCI-Sept-<year>`) unlocks a month six ledgers had written off, and the
publisher's origin serves a **1,021-byte captcha under HTTP 200** to parallel fetchers — validate by bytes,
never by status. The reading order when this print lands is: **the edition's own stated cut-off date first**
(leg 9 — 09-20 to 09-21), **then August's restated values** (leg 11 — expect them higher), **then
Expectations against 80.0, read as a band** (leg 10), **then whether the panel's post-decision third diverges
from its pre-decision two-thirds** (leg 5), and **the headline last.**

### Honest limits

**The date is `estimate`.** The Board has not announced September 2027; three doubly-double-sourced
Septembers, a stated rule, and a second publisher's matching forward calendar are strong for an estimate and
are not an announcement. FHFA publishing on 2027-09-28 is evidence that 2027-09-28 is a last Tuesday, not
evidence about the Conference Board's intentions. **Two of the five September CB dates in the tape set are
the rule applied backward** — 2021-09-28 and 2025-09-30 were not separately sourced, because those editions
were unreachable under all three slug forms and further probing was cut off by the captcha in leg 2. **Leg
5's field windows are DERIVED, not stated.** The `[release − 23, release − 7]` window comes from three
sourced September cut-offs plus the sixteen-day field length one April edition states; the Board publishes a
cut-off date, never a field-opening date, so every "panel contains the decision" claim in this ledger is an
inference from a stated endpoint and an assumed length. A field window two days shorter would move the 2021
and 2024 classifications. **Leg 6's controls are the best-powered in this chain and are still observational**
— 16 vs 35 is enough to exclude a large effect and not a small one, and the classification uses the same
derived window, so leg 5's assumption propagates into leg 6's result. **Leg 7's arms are n=5 and n=6**, so
what survives is the *negative* claim, never a positive claim of equivalence. **Leg 8's September cell is
n=33 late-September sessions** in one unusual macro window (2021–2026 contains a bear market, a hiking cycle
and a pandemic reopening), and the September-vs-August and September-vs-summer arms overlap it by
construction. **Leg 10's ten pairs come from nine sourced editions across three years**, the ±2.0 band is
fitted to those ten points and was chosen after seeing them, and **three of the twenty restated values are
DERIVED from stated deltas rather than quoted levels** (`CCI-Sep-2024`'s *"fell by 10.3 points"* and
*"declined by 4.6 points"*, `CCI-Oct-2024`'s *"increased by 14.2 points"* and *"increased by 6.3 points"*) —
arithmetic on the Board's own numbers, but not the Board's own restated figures. **Leg 11 is 3 computable
cases.** **Leg 13's keynote dates are the chair's speech dates, not the symposium's opening dates** — the
symposium runs roughly two days longer and the KC Fed's own calendar remains unreachable, so a claim about
*when the symposium convenes* is one step weaker than the keynote table implies. **Leg 12's three
definitions are three defensible filters, not a ranking** — this session does not claim 5 of 9 is more
correct than 4 or 6. **The whole study is at daily-bar resolution and says nothing about the 10:00–10:30 ET
window**, the only place a 10:00 macro print could plausibly live — and on this date that window also
contains the 9:00 FHFA monthly release's aftermath. **No September consensus exists and structurally will
not** (Conference Board publication restrictions). And **everything about the September 2027 economy is
unknown at D-387** — no part of this doc depends on what the survey prints.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the September 2027 Conference Board edition as a
**medium-impact second-tier print that is regime information and never a trading event**. **No position is
opened, closed or sized off it.** This ledger was filed by the [August
sibling](consumer-confidence-2027-08-31.md) with three cautions, and **the first is wrong: 2027-09-28 does
not sit inside the 2027-09-04→09-16 FOMC blackout, it lands twelve days after that window closes and
thirteen days after the September 14-15 decision.** Correcting it produced the finding this ledger exists
for: **the September FOMC decision day has moved earlier in every year 2021→2027 (09-22, 09-21, 09-20, 09-18,
09-17, 09-16, 09-15) while the print stayed on the last Tuesday, so the gap flipped D+6 → D+13 in 2025 and
the decision moved from OUTSIDE the survey panel to INSIDE it. Only 1 of the 5 September prints in the tape
window (2025-09-30) shares 2027's configuration** — so the September record must not be averaged across the
break. **The configuration was therefore measured across all 51 clean CB days rather than on n=1, and it is
null at the best power this chain has reached: panel-heard vs panel-deaf is 0 of 9 at n=16 vs 35** (smallest
p AAPL 0.0604), with CB days within 20 days of a decision vs further out **0 of 9 at 24 vs 27**. **Set beside
the August sibling's print-day collision null, the Fed-transmission framing is retired, not re-litigated.**
**That sibling's collision result replicates out of sample** — September CB (clean 5 of 5) vs July CB
(colliding 0 of 6) is **0 of 9**, as are five further September controls; the single α-crossing in
sixty-three instrument-comparisons is **AMZN 0.0424 in the WIDER direction**, stated rather than dropped.
**Its cell rule, however, does not transfer: late September is 1 of 9 and that leg is TLT WIDER**, against
late August's 6 of 9 narrower — **September is where the summer compression ends**, measurably wider than
August (VIX 17.20 vs 16.27, p=0.0402) and than the Jun+Jul+Aug block (16.48, p=0.0072). **Read the cell, but
read THIS cell.** **Three reading rules sharpen.** September's cut-off lags are **7 / 8 / 7** — the tightest
spread in the chain, projecting cut-off **09-20 → 09-21** and window **09-04/05 → 09-20/21**. The 80
threshold becomes a **band rather than a line**: across all ten sourceable first-print→restatement pairs,
**3 of the 5 first prints within 2.0 points of 80.0 flipped side on revision and 0 of the 5 further away
did**, and `CCI-Oct-2022`'s restatement of September 2022 from **80.3 down to 79.5** is the chain's first
*downward* flip, which is what makes this a proximity effect rather than the upward bias the August sibling
inferred from two upward cases. And **September revises August UP 3 of 3 on the headline** (+0.4 / +2.6 /
+2.3, mean +1.77) where August revises July DOWN 2 of 3 — the two adjacent editions revise in opposite
directions, consistently. **Two method results reach every sibling in this chain:** a **third slug form**,
`CCI-Sept-<year>`, serves the September editions six ledgers had logged as unreachable (the convention is
per-month-per-year and must be probed), and the publisher's origin answers parallel requests with a
**1,021-byte "User validation required" captcha page under HTTP 200** — **validate by byte count and the
`Source:` line, never by status.** Two smaller corrections are on the record: `fomccalendars.htm` returned
**166,936 bytes** here against the **164,831** five siblings record for the same URL on the same date, so
that page is not the stable artifact the chain has treated it as; and the quarter-end regime takes a **third
value, 5 of 9**, under a third defensible month-instance filter, confirming the August sibling's sensitivity
caution with a number. Base case for the print itself (**Low** confidence — no consensus exists or will): the
edition **restates August 2027's headline upward** (3 of 3 computable) and **its Expectations reading is
decision-relevant only if it lands outside 78.0–82.0.** Nine predictions are registered in
[`forward-tests/consumer-confidence-2027-09-28.md`](../forward-tests/consumer-confidence-2027-09-28.md).

**Kill switches:**

- **The Conference Board names a September 2027 date other than 2027-09-28** — the September last-Tuesday
  rule breaks despite three editions double-sourced in both directions, and this doc's date confidence
  collapses to the December sibling's. Registered as **FT-consumer-confidence-2027-09-28-1**.
- **The 2027-09-14/15 meeting moves, or the Board's blackout rule changes** — leg 4's correction is void and
  the print's relationship to the window has to be re-derived. Registered as
  **FT-consumer-confidence-2027-09-28-2**.
- **The Committee schedules a September 2028 meeting that restores a D+6 gap to that year's last Tuesday** —
  leg 5's regime change was a three-year coincidence of two calendars rather than a drift, and the retired
  configuration is not retired. Registered as **FT-consumer-confidence-2027-09-28-3**.
- **Panel-heard CB days clear p<0.05 on 2 or more of 9 against panel-deaf CB days on a re-run of the same
  pipeline after 2027-12-31** — leg 6's null is an artifact of the derived field window, and the Fed's
  content in the panel does reach the tape. Registered as **FT-consumer-confidence-2027-09-28-4**.
- **September CB days clear p<0.05 on 2 or more of 9 against July CB days on the same re-run** — leg 7's
  out-of-sample replication fails and the August sibling's collision null was a one-month result.
  Registered as **FT-consumer-confidence-2027-09-28-5**.
- **Late September prints 3 or more of 9 NARROWER against the rest of the year on the same re-run** — leg
  8's non-transfer was small-sample noise and the August cell rule does generalize after all. Registered as
  **FT-consumer-confidence-2027-09-28-6**.
- **The September 2027 edition states a cut-off date before 2027-09-17 or after 2027-09-24** — leg 9's
  lag measurement does not generalize and the panel window must be re-derived from the stated date.
  Registered as **FT-consumer-confidence-2027-09-28-7**.
- **Two further sourced editions whose first-printed Expectations lands outside 78.0–82.0 and still flips
  side on revision** — leg 10's band is too narrow and the August sibling's stronger "not readable off a
  first print at all" was right. Conversely, **an Expectations crossing above 80 that IS followed by a US
  recession within twelve months** makes the threshold informative and the whole band framing dies.
  Registered as **FT-consumer-confidence-2027-09-28-8**.
- **The September 2027 edition restates August 2027's headline DOWNWARD, or states no revision** — leg 11's
  directional asymmetry between adjacent editions fails at its first forward test. Registered as
  **FT-consumer-confidence-2027-09-28-9**.
- **Expectations below ~54** — deterioration past the April-2025 reading the Board itself called the lowest
  since October 2011; escalate ahead of the banded pulse.
- **The 2027 Jackson Hole symposium falls outside the 08-22…08-28 Friday band** — leg 13's six-year keynote
  rule breaks and the September panel's "always fields after the symposium" premise needs re-sourcing.
- **A federal funding lapse runs through the ~09-04 → 09-21 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1 – Nov 12 2025 shutdown ended), and the
  collection-period split becomes the thing to read.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits" premise
  under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-387 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-09-28.json` written this PR** after reading the one prior proposal (`from-consumer-confidence-2027-08-31`), now inert. **THE PROPOSAL'S BLACKOUT CAUTION IS ARITHMETICALLY WRONG AND IS CORRECTED HERE.** It claims the print "sits INSIDE the 2027 FOMC blackout (Sep 4-16)"; the print is **2027-09-28**, twelve days AFTER that window closes and thirteen days after the 09-14/15 decision, inside a 28-day clear-air gap (09-17 → 10-15). The window itself is right: the Board's stated "Saturday that falls ten days earlier" rule on a Tuesday-start 09-14 meeting gives **Sat 09-04 → Thu 09-16**, reproducing the `fomc-blackout-start-2027-04-17` decode to the day. **WHAT THE CAUTION WAS REACHING FOR IS REAL AND BETTER: the blackout sits inside the print's SURVEY PANEL, not over its release.** **AND THAT IS ONLY TRUE BECAUSE THE SEPTEMBER PRINT CHANGED SHAPE IN 2025 — the finding this ledger exists for.** The September FOMC decision day has moved earlier in EVERY year: **09-22 / 09-21 / 09-20 / 09-18 / 09-17 / 09-16 / 09-15** for 2021→2027 (all seven carry a SEP), while the CB print stays on the last Tuesday (09-28 / 09-27 / 09-26 / 09-24 / 09-30 / 09-29 / 09-28). **Gap flipped D+6 (2021-2024) → D+13 (2025-2027)**, and under the ~16-day field window the editions' own cut-offs imply the decision moved from OUTSIDE the panel to INSIDE it. **Only 1 of the 5 September CB days in the tape window (2025-09-30) has 2027's configuration** — do not average the September record across the break. **SO THE CONFIGURATION WAS MEASURED ACROSS ALL 51 CLEAN CB DAYS AND IS NULL AT THE BEST POWER THIS CHAIN HAS REACHED:** panel-HEARD vs panel-DEAF **0 of 9** (n=16 vs 35, SPY 0.914/0.911 p=0.3557, smallest AAPL **0.0604**); panel-heard vs all non-CB **0 of 9** (16/1,379, AAPL 0.0612); within-20-days-of-a-decision vs further out **0 of 9** (n=24 vs 27, SPY 0.760/1.010 p=0.2949); D+10…D+16 vs all other CB days **0 of 9** (13/55). **The 08-31 sibling killed the print-day collision; this kills the panel's Fed content — retire the transmission framing.** **THE COLLISION NULL REPLICATES OUT OF SAMPLE, which is the out-of-sample n that sibling asked for.** September CB days are **clean 5 of 5** (2021-09-28, 2022-09-27, 2023-09-26, 2024-09-24, 2025-09-30). vs July CB (colliding) **0 of 9** (5v6, SPY 1.119/0.921 p=0.5228, smallest TLT 0.2353); vs August CB **0 of 9** (5v6, AMZN 0.0828); vs other clean CB **0 of 9** (5v46, AMZN 0.1169); vs other late-Sep sessions **0 of 9** (5v28, AMZN 0.0747); vs all non-CB **0 of 9** (5v1,379, TLT 0.1119); vs other quarter-end last-4 sessions **0 of 9** (5v88, AMZN 0.0671); vs other September sessions **1 of 9 — AMZN 0.0424 WIDER** (5v102), one α-crossing in 63 instrument-comparisons and wrong-signed, stated not dropped. **THE 08-31 SIBLING'S CELL RULE DOES NOT TRANSFER — IT INVERTS.** Late September (≥22nd) vs rest of year **1 of 9, TLT 0.0396 WIDER** (n=33/1,414, SPY 0.950/0.970 p=0.6881) against late August's 6 of 9 NARROWER. September vs rest of year only **3 of 9 narrower** (XRT 0.0163, QQQ 0.0177, AMZN 0.0241) vs August's 9 of 9. **September vs August: 3 of 9, ALL WIDER** (AAPL 0.0121, XLF 0.0300, VIX 0.0402; VIX 17.20/16.27). **September vs summer block: VIX 0.0072 WIDER** (17.20/16.48). Monthly VIX medians Jun **16.73** / Jul **16.50** / Aug **16.27** / **Sep 17.20** / Oct **19.34** — **September is where the summer compression ends.** **DATE RULE HOLDS FOR SEPTEMBER 3 of 3, DOUBLE-SOURCED IN BOTH DIRECTIONS** (no sibling has managed the forward leg): 2022-09-27 (`CCI-Sept-2022`, **884,195 bytes**, announced by `CCI-August-2022`'s "Tuesday, September 27", and itself announcing "Tuesday, October 25" → `CCI-Oct-2022` 887,350); 2023-09-26 (`CCI-Sept-2023`, **1,040,855**, announced "Tuesday, September 26", announcing "Tuesday, October 31" → `CCI-Oct-2023` 1,247,171); 2024-09-24 (`CCI-Sep-2024`, **517,680**, announced "Tuesday, September 24th", announcing "Tuesday, October 29th" → `CCI-Oct-2024` 894,379). **2023-10-31 is the FIFTH Tuesday of its month** — the chain's first sourced instance distinguishing "last Tuesday" from "fourth Tuesday". **TWO METHOD FINDINGS THAT REACH EVERY SIBLING.** (1) **A THIRD SLUG FORM:** `CCI-Sept-2022` and `CCI-Sept-2023` serve real editions while `CCI-September-*` and `CCI-Sep-*` redirect to the landing page for those years; 2024 inverts it (`CCI-Sep-2024` serves, `CCI-Sept-2024` redirects); October is abbreviated in all three years even though August 2022/2023 are spelled out. **The convention is per-month-per-year — probe it, don't derive it**, and at least for 2022-2024 the standing `200-SERVED-CURRENT-EDITION` class was a naming guess, not a block. (2) **THE ORIGIN SERVES A CAPTCHA UNDER HTTP 200:** a parallel sweep of 144 candidate slugs tripped it — every response became a **1,021-byte** page reading "User validation required to continue" / "error code: 421". **A `res.ok` check ingests it as an edition. Fetch serially; validate by byte count and the `Source:` line.** Recorded in `probe-ref.blocked`; the nine editions above were fetched serially beforehand and are unaffected. **80 THRESHOLD RESOLVES INTO A BAND, and the chain's FIRST DOWNWARD FLIP is here.** All ten sourceable first-print→restatement pairs: Jun23 79.3→80.0 (+0.7, FLIP up) · Jul22 65.3→65.6 · Jul23 88.3→88.0 · Jul24 78.2→81.1 (+2.9, FLIP up) · Aug22 75.1→75.8 · Aug23 80.2→83.3 · Aug24 82.5→86.3 · **Sep22 80.3→79.5 (−0.8, FLIP DOWN — `CCI-Oct-2022`)** · Sep23 73.7→76.4 · Sep24 81.7→82.8. **Of the 5 first prints within 2.0 pts of 80.0, 3 flipped; of the 5 further away, 0 did.** Revisions 8 up / 2 down, median **+0.75**, max **+3.8**. **Usable rule: outside 78.0–82.0 read the first print against the threshold; inside it, wait for the restatement.** The 08-31 sibling's kill switch fires as literally worded on its own three Augusts (75.1→75.8, 80.2→83.3, 82.5→86.3, all same-side) — **that fragment is that lane's to score and is untouched here.** **SEPTEMBER IS THE CHAIN'S UPWARD-REVISING MONTH, AUGUST ITS DOWNWARD ONE — 3 of 3:** September restates August 103.2→**103.6** (+0.4) / 145.4→145.3 / 75.1→75.8; 106.1→**108.7** (+2.6) / 144.8→146.7 (+1.9) / 80.2→83.3 (+3.1); 103.3→**105.6** (+2.3) / 134.4→134.6 / 82.5→86.3 (+3.8). Headline mean **+1.77**, 3 of 3 UP — against the 08-31 sibling's August-restates-July at −0.4 / −3.0 / +1.6, 2 of 3 DOWN. **SEPTEMBER LEVELS (first print):** 2022 **108.0 / 149.6 / 80.3** (cut-off 09-20) · 2023 **103.0 / 147.1 / 73.7** (09-18) · 2024 **98.7 / 124.3 / 81.7** (09-17). **CUT-OFF LAGS 7 / 8 / 7 — the TIGHTEST spread in the chain** (1 day) vs August 7/9/6, July 5/6/8, June 6/7/6, May 8/7/8, April 6/6/8. 2027 cut-off **09-20 → 09-21**, window **09-04/05 → 09-20/21**. **JACKSON HOLE ANSWERED AT n=6 FROM A REACHABLE PRIMARY** (the 08-31 sibling had n=1 and a blocked source): federalreserve.gov's own speech indexes date the chair's keynote **2021-08-27 / 2022-08-26 / 2023-08-25 / 2024-08-23 / 2025-08-22**, plus this repo's `jackson-hole-2026-08-28` — **6 of 6 a Friday inside 08-22…08-28**. **The August edition has never been able to hear it (4 of 4 keynotes post-date its stated cut-off)** and the September panel always opens after it (earliest 09-01), confirming the premise this id was filed on. 2027 projects to Fri **2027-08-27**. `kansascityfed.org` timed out twice again and is recorded in `probe-ref.blocked`. **REPLICATION EXACT, 9 OF 9** — same vendor pair (stockanalysis.com + CBOE `VIX_History.csv`, 472,309 bytes), n=**1,447**, 68 CB days splitting **51 clean / 17 colliding** (17 day-ones, 0 decision days), clean medians reproducing the published table to three decimals (SPY 0.911, QQQ 1.379, XLY 1.397, XRT 1.687, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT 0.961, VIX 18.560), **0 of 9**, smallest p XLF 0.2713; clean SPY c2c **+0.090%, 29 of 51 up**; parser assertions held (56 meetings, 8/year, 17 collisions) including the 08-31 sibling's phantom-match trap. **ONE REPLICATION FAILED, AND IT IS A SOURCE:** `fomccalendars.htm` returned **166,936 bytes** here against the **164,831** five siblings record for the same URL on the same date (2026-09-06). Panel text and the "Last Update: August 19, 2026" stamp are identical, so nothing downstream moves — **but stop calling this fetch byte-identical.** **QUARTER-END TAKES A THIRD DEFINITION AND A THIRD NUMBER: 5 of 9** (≥10-session month-instance filter — XRT 0.0023, XLF 0.0062, QQQ 0.0316, SPY 0.0401, AMZN 0.0499, SPY 0.848/0.974), against the 08-31 sibling's 4 of 9 (partial-excluded) and the 06-29/07-27 siblings' 6 of 9. **Three defensible filters, three answers — the headline count is a fact about the filter, not the market**, exactly as that sibling warned. This print sits in the quarter-end last-4 cell and is **0 of 9** against it. **DIRECTIONAL DECLINED, sixth month running:** September CB SPY c2c **−0.255% median, 2 of 5 up** vs +0.040% late-September, **p=0.3796** (0.2023 vs all non-CB). Twelve-month scan hits **exactly once**, April **p=0.0150** — character-for-character the 07-27 sibling's figure — failing Bonferroni 0.00417. Adjacency sweep — **peers:** `symbols: []`; no mega-cap earnings adjacency (AAPL/AMZN Q3 reports land late October). **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53** (CBOE close), SPY **770.19** (2026-09-04) — baseline set, identical to the April-August siblings'. **Geopolitical:** unchanged from siblings. **Event tape:** no September consensus exists or is publishable (CB publication restrictions); current edition is August 2026 (**89.4 / 121.2 / 68.2**, cut-off **Aug 16**), next release named **2026-09-29**. **Corridor: ZERO tracked events existed anywhere in September 2027** before this PR; **1 within 5 days after it** (same-day). **FOUR proposals filed:** (1) `proposals/fhfa-hpi-2027-09-28.from-consumer-confidence-2027-09-28.json` — same morning, 9:00 ET, a **MONTHLY** index (July 2027 data), not the quarterly edition the 08-31 sibling proposed for its own date; sourced off FHFA's re-fetched 2027 table (89,663 bytes, 12 of 12 against this chain's last Tuesdays on a second independent fetch). (2) `proposals/fomc-2027-09-15.from-...json` — the decision + SEP leg 5 rests on. (3) `proposals/fomc-blackout-start-2027-09-04.from-...json` — leg 4's anchor. (4) `proposals/consumer-confidence-2027-10-26.from-...json` — the next edition and 2027's fourth collision print, sourced 3-of-3 for October off this session's own fetches (2022-10-25, 2023-10-31, 2024-10-29) with lags 6/7/6 and a Sep→Oct next-release line for each. **A fifth, `fomc-minutes-2027-10-06`, is deliberately NOT proposed** — routed to whichever lane takes `fomc-2027-09-15`, following the 08-31 sibling's own precedent. Nine forward tests registered: **FT-consumer-confidence-2027-09-28-1** through **-9**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-09-28.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
