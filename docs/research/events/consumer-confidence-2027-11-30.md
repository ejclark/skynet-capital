# Conference Board Consumer Confidence (November 2027) — consumer-confidence-2027-11-30

**Kind:** macro-print · **Date:** 2027-11-30 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session 3-of-3 for November off the editions themselves — 2022-11-29, 2023-11-28, 2024-11-26 — each double-sourced *backward* by its October predecessor's next-release line and *forward* by the December edition it names, all three of which this chain reached for the first time here, with the calendar arithmetic independently confirmed 12-of-12 for 2027 by a second publisher's posted forward calendar, FHFA's "2027 HPI Release Dates") · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["fhfa-hpi-2027-11-30","fomc-blackout-start-2027-11-27"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **The one apparent signal in this entire study was a half-session artifact, and catching it is
the most useful thing here.** Post-Thanksgiving-week sessions look **4 of 9** narrower than the rest of the
tape — SPY 0.642 vs 0.973 (**p=0.0045**) and XLY 1.053 vs 1.442 (**p=0.0016**), both clearing even a
Bonferroni 0.00556, which would have been the chain's **first multi-instrument crossing in eight months of
refusals.** Remove the five **Black Fridays** and it collapses to **1 of 9**; the five Black Fridays *alone*
are **5 of 9**. The compression is the **1:00 p.m. ET half session**, not the week — and **2027-11-30 is a
full Tuesday three sessions past it**, so none of it reaches this print. **The reading rule that survives is
about revisions.** December restates November **+1.2 / −1.0 / +1.1**: the *magnitude* spread is **0.2**
against **1.1 to 3.2** for every other month the chain has, while the *sign* is a coin flip. **November's
first print is reliably about 1.1 points wrong and unreliably in which direction** — the exact inverse of
October's large-and-reliably-downward. **And the November edition turns out to be a scheduling instrument,
not just a data one:** it is the document that announces December's break from the last-Tuesday rule, **3 of
3**, about four weeks ahead — which gives a December estimate a cheap dated promotion trigger it did not
have. **Two channels were built and both are null** (month-end **1 of 9** against a tape with **no month-end
effect at all**; SEP proximity **0 of 9** at n=14 vs 54). **Two of the proposal's four cautions need
amending:** "clean print" is right about collision and **wrong about the Fed** (no November 2027 meeting
exists, but the print sits **four days inside** the December blackout), and "the cell is quiet" is **mixed**
— quiet in VIX level and financials, **wider** in rates. Date **estimate**; `symbols: []`; **0** macro-keyed
playbooks; **0** tracked events existed anywhere in November *or* December 2027 before this PR.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-450) | **Stand aside** | High | `symbols: []`, D-450, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-11-30** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026**: the landing page names **2026-09-29** as the next release. Market state **2026-09-04**: VIX **14.53**, SPY **770.19**. | The Conference Board naming a November 2027 date other than **2027-11-30** before **2027-11-09**, which breaks the November rule this doc's date rests on |
| This month | **Stop attributing the post-Thanksgiving calm to the week — it is Black Friday, and it does not touch this print** | High | With Black Fridays in, the window is **4 of 9** (SPY p=0.0045, XLY p=0.0016); with them out, **1 of 9**; Black Fridays alone, **5 of 9** at n=5. 2027-11-30 is a full session **three sessions past** Black Friday. | Post-Thanksgiving-week sessions **excluding Black Friday** clearing p<0.05 on 2+ of 9 on a re-run of the same nine-instrument pipeline after **2027-12-31** |
| This quarter | **Do not read the November headline as final either — but expect it wrong by ~1.1 points in an unknown direction** | Medium | December restates November **+1.2 / −1.0 / +1.1**: \|Δ\| spread **0.2**, five times tighter than the next-tightest month, sign **2 of 3** up. | The December 2027 edition restating November 2027's headline by more than **±1.7** or by less than **±0.5**, observable on **2027-12-22** (est.) |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks, and
  the print day is null against every control constructed here.
- **The Conference Board names a November 2027 date** → adopt it verbatim. The rule says **11-30**;
  registered as **FT-consumer-confidence-2027-11-30-1**.
- **This print is the venue that dates the December edition** — November names December's non-last-Tuesday
  release 3 of 3, ~4 weeks ahead. Registered as **FT-consumer-confidence-2027-11-30-2**.
- **Read the DATE in a next-release line, never the WEEKDAY** — 1 of the 7 forward lines read here was
  mislabelled (`CCI-Dec-2022`'s "Wednesday, January 31"; it was a Tuesday).
- **Expect November's first print wrong by ~1.1 points, direction unknown** — \|Δ\| 1.2 / 1.0 / 1.1.
  Registered as **FT-consumer-confidence-2027-11-30-3**.
- **Outside ±2.0 points of 80.0, read Expectations against the threshold immediately** — now **0 of 10**.
  Registered as **FT-consumer-confidence-2027-11-30-4**.
- **Project November's cut-off from the DAY OF MONTH (15–18), not the lag** — registered as
  **FT-consumer-confidence-2027-11-30-5**.
- **Month-end is not a channel** — 1 of 9, on a tape with no month-end effect at all. Registered as
  **FT-consumer-confidence-2027-11-30-6**.
- **The post-Thanksgiving compression is Black Friday** — 4 of 9 → 1 of 9 once removed. Registered as
  **FT-consumer-confidence-2027-11-30-7**.
- **Eighth month, eighth directional refusal — and not close** — November CB days are 3 of 5 up at
  **p=0.5957**, *below* their comparator. Registered as **FT-consumer-confidence-2027-11-30-8**.
- **The December blackout opens 2027-11-27, so this "clean" print sits inside one** — registered as
  **FT-consumer-confidence-2027-11-30-9**.
- **Do not carry October's cut-off method here** — the anchor is month-specific: October projects from its
  lag (6/7/6), November from its day of month (15/18/18).
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication restrictions —
  structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** CB print **2026-09-29** · CB print **2026-11-24** (the scoring venue for FT-8) · CB
  print **2026-12-22** (est.) · FOMC **2026-12-09** · CB print **2027-10-26** (est.) · **blackout begins
  2027-11-27** (est., proposed this PR) · **this print + FHFA quarterly HPI 2027-11-30** (est.) · **FOMC
  decision + SEP 2027-12-08** (est.) · **CB print 2027-12-22** (est., proposed this PR).

## Initial research

### The question, plainly

The [October sibling](consumer-confidence-2027-10-26.md) filed this id with a stated purpose and four
cautions. The purpose: November is *"the document that scores this session's single most usable finding"* —
October's first print being the chain's least trustworthy. The cautions: **November is a clean print, not a
collision**, so do not carry October's framing; **November's cut-off lags are the longest and widest in the
chain** (11/13/8), so do not borrow October's; **the month's cell is quiet, not wide**, so expect October's
VIX widening to reverse; and **do not re-fetch the publisher concurrently**.

So: **do the four cautions hold, and does November have a finding of its own, or is it only a scoring
venue?**

**One-line verdict:** two cautions hold, **one is mixed and one is incomplete in a way that would mislead a
reader** — and November does have a finding of its own, but it is not the one anybody expected. It is a
**caught false positive**: the post-Thanksgiving week looks like the first genuine multi-instrument signal
in eight months of refusals, at p-values that survive Bonferroni, and it **is entirely the Black Friday half
session.** Alongside it: **December restates November at a magnitude five times more tightly bounded than
any other month while flipping sign**, the **November edition is the chain's forward-announcement venue for
December's rule-break**, a **publisher weekday-label error** was found and closed, the **cut-off projection
is narrowed and moved earlier by changing the anchor**, and **two new channels — month-end and SEP
proximity — were built and are null.**

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Publisher sources fetched direct 2026-09-06, all 7 requests serial**,
each verified against its own `Source: <Month> <Year> Consumer Confidence Survey` line **and** its own
`Updated:` stamp rather than trusted by slug: `conference-board.org/topics/consumer-confidence`
(**332,031 bytes**, byte-identical to the June through October siblings' fetches) plus six editions —
`CCI-Nov-2022` (888,059), `CCI-Nov-2023` (1,041,462), `CCI-Nov-2024` (890,772), `CCI-Dec-2022` (889,114),
`CCI-Dec-2023` (1,264,748), `CCI-Dec-2024` (898,445). **The three December editions are new to this chain**
(a seventh fetch, `CCI-Jan-2023`, 880,155 bytes, was made to close leg 3). The three November byte counts
match the 10-26 sibling's fetches of the same documents exactly. **The forward-calendar corroboration was
re-fetched, not inherited:** `fhfa.gov/data/hpi`, HTTP 200, **89,663 bytes**, parsed in full. **The FOMC
dates are primary:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, **164,831 bytes** —
matching the six ledgers that record that figure. **Nothing was blocked this session** and
`probe-ref.blocked` is empty.

**The tape.** Equity and ETF daily OHLC from **stockanalysis.com** and VIX from **CBOE's own
`VIX_History.csv`** (472,309 bytes) — the same vendor pair the April through October siblings used, which
makes this session's numbers directly comparable. SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF, TLT and VIX for
**2020-12-01 → 2026-09-04** (n=**1,447** sessions — the siblings' count exactly), session range
`(high − low) / open`, two-sided Mann-Whitney U with tie correction, VIX measured on close. CB days are the
**68** rule-derived last Tuesdays from 2021-01 to 2026-08. Market readings: **2026-09-04 closes, SPY 770.19
and VIX 14.53.**

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for November — SUPPORTED three-for-three, now double-sourced in both
   directions.** The proposal cited the three November editions and their October predecessors' next-release
   lines. This session reached the *December* editions those Novembers name, closing the forward leg:

   | Edition | Released | Weekday | Last Tuesday of that November | Cut-off stated | Confirmed forward by |
   |---|---|---|---|---|---|
   | November 2022 | 2022-11-29 | Tue | 11-29 | *"November 18"* | its own *"next release is Wednesday, December 21"* → `CCI-Dec-2022`, stamped 2022-12-21 |
   | November 2023 | 2023-11-28 | Tue | 11-28 | *"November 15"* | *"Wednesday, December 20"* → `CCI-Dec-2023`, stamped 2023-12-20 |
   | November 2024 | 2024-11-26 | Tue | 11-26 | *"November 18, 2024"* | *"Monday, December 23rd"* → `CCI-Dec-2024`, stamped 2024-12-23 |

   **2027-11-30 is the last Tuesday of November 2027** and a full NYSE session. FHFA's re-fetched 2027 table
   reads *"Tuesday, November 30 | Quarterly Index (with Monthly Tables) | September 2027 and 2027Q3"*, one of
   twelve rows all matching this chain's rule-derived last Tuesdays. Registered as
   **FT-consumer-confidence-2027-11-30-1**.

2. **AND THE FORWARD LEG CARRIES THE FINDING: THE NOVEMBER EDITION IS THIS CHAIN'S ANNOUNCEMENT VENUE FOR
   DECEMBER'S RULE-BREAK.** Look again at what those three next-release lines say — **none of them names a
   last Tuesday.** December has never published on its rule-derived date:

   | Year | Rule-derived last Tuesday | Actually released | Weekday | Pulled forward | Days before Christmas | Christmas falls on |
   |---|---|---|---|---|---|---|
   | 2021 | 12-28 | **2021-12-22** | Wed | 6 | 3 | **Sat** |
   | 2022 | 12-27 | **2022-12-21** | Wed | 6 | 4 | Sun |
   | 2023 | 12-26 | **2023-12-20** | Wed | 6 | 5 | Mon |
   | 2024 | 12-31 | **2024-12-23** | Mon | 8 | 2 | Wed |
   | 2025 | 12-30 | **2025-12-23** | Tue | 7 | 2 | Thu |

   **This calendar already knew that**, from the [`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md)
   and [`-12-29`](consumer-confidence-2026-12-29.md) pair, which sourced all five December editions and a
   2020 publisher advisory abandoning the last-Tuesday slot. **This session reproduces three of the five
   independently, from the December editions' own `Updated:` stamps — so the finding is replicated, not
   discovered.** What *is* new is the **direction of discovery**: the November edition names December's date
   **3 of 3, about four weeks ahead.** That converts a December CB estimate from "wait for December" to a
   single dated fetch, and it is the promotion trigger written into the
   `consumer-confidence-2027-12-22` proposal filed with this PR. Registered as
   **FT-consumer-confidence-2027-11-30-2**.

3. **A PUBLISHER WEEKDAY-LABEL ERROR WAS FOUND AND CLOSED — and it matters because this chain's whole date
   method reads these lines.** `CCI-Dec-2022`'s forward line reads *"The next release is Wednesday, January
   31 at 10 AM ET."* **2023-01-31 was a Tuesday.** A seventh serial fetch settled which half was wrong:
   `CCI-Jan-2023` (880,155 bytes) carries `Updated : 2023-01-31`. **The date was right and the weekday label
   was wrong** — 1 error in the 7 forward lines read this session. The other six weekday labels check out
   (Dec 21 2022, Dec 20 2023 and Jan 31 2023's successor line "Tuesday, February 28" are all correct). **The
   rule for every future lane: trust the date, never the weekday.** This is not a hypothetical hazard — the
   chain's December dates are all read off exactly these lines, and a lane that resolved a conflict in the
   weekday's favour would have landed on 2023-02-01.

4. **DECEMBER RESTATES NOVEMBER +1.2 / −1.0 / +1.1 — THE MAGNITUDE IS THE TIGHTEST IN THE CHAIN AND THE SIGN
   IS A COIN FLIP.** November's first prints, and what the December edition restates them to:

   | November, as first printed | Restated in the December edition | Revision |
   |---|---|---|
   | Nov 2022 **100.2 / 137.4 / 75.4** | `CCI-Dec-2022`: *"up sharply from 101.4 in November"*, PS *"from 138.3 last month"*, Exp *"from 76.7"* | **+1.2** / +0.9 / +1.3 |
   | Nov 2023 **102.0 / 138.2 / 77.8** | `CCI-Dec-2023`: *"up from a downwardly revised 101.0 in November"*, PS *"from 136.5 last month"*, Exp *"downwardly revised reading of 77.4"* | **−1.0** / −1.7 / −0.4 |
   | Nov 2024 **111.7 / 140.9 / 92.3** | `CCI-Dec-2024`: headline derived from *"declined by 8.1 points in December to 104.7"* → 112.8; PS from *"fell 1.2 points to 140.2"* → 141.4; Exp from *"tumbled 12.6 points to 81.1"* → 93.7 | **+1.1** / +0.5 / +1.4 |

   **2 of 3 up, mean +0.43.** But the number worth keeping is the **absolute** revision — **1.2 / 1.0 /
   1.1** — against every other month the chain has sourced:

   | Restatement | Headline revisions | Up | Mean | **\|Δ\| range** | **spread** |
   |---|---|---|---|---|---|
   | August restates July | −0.4 / −3.0 / +1.6 | 1 of 3 | −0.60 | 0.4 – 3.0 | 2.6 |
   | September restates August | +0.4 / +2.6 / +2.3 | 3 of 3 | +1.77 | 0.4 – 2.6 | 2.2 |
   | October restates September | −0.2 / +1.3 / +0.5 | 2 of 3 | +0.53 | 0.2 – 1.3 | 1.1 |
   | November restates October | −0.3 / −3.5 / +0.9 | 1 of 3 | −0.97 | 0.3 – 3.5 | 3.2 |
   | **December restates November** | **+1.2 / −1.0 / +1.1** | **2 of 3** | **+0.43** | **1.0 – 1.2** | **0.2** |

   **November's spread is five times tighter than the next-tightest month.** The usable form is not "expect
   it revised up" or "down" — it is **"expect the November headline to move about 1.1 points, and do not
   guess the direction."** That is the exact inverse of the 10-26 sibling's October rule (large, and
   reliably downward), and the two together say the same deeper thing both the 09-28 and 10-26 lanes reached
   from different sides: **revision behaviour is a property of the month.** Registered as
   **FT-consumer-confidence-2027-11-30-3**.

5. **THE 80-THRESHOLD BAND IS SCORED OUT OF SAMPLE A SECOND TIME, AND ITS ACTIONABLE HALF IS NOW 0 OF 10.**
   The 09-28 sibling's rule: a first-printed Expectations reading **outside 78.0–82.0** may be read against
   the 80.0 recession threshold immediately; **inside** it, wait for the restatement. Three new pairs come
   from the December editions this session reached:

   | First print (Expectations) | Restated to | Δ | Distance from 80.0 | Flipped side? |
   |---|---|---|---|---|
   | Nov 2022 **75.4** | 76.7 (`CCI-Dec-2022`) | +1.3 | 4.6 (outside) | no |
   | Nov 2023 **77.8** | 77.4 (`CCI-Dec-2023`, *"downwardly revised"*) | −0.4 | 2.2 (outside) | no |
   | Nov 2024 **92.3** | 93.7 (`CCI-Dec-2024`, derived from *"tumbled 12.6 points to 81.1"*) | +1.4 | 12.3 (outside) | no |

   Pooled with the 10-26 sibling's thirteen, **sixteen pairs**: **outside ±2.0, 0 of 10** (was 0 of 7);
   **inside ±2.0, unchanged at 3 of 6** — no new pair landed inside the band, so the descriptive half is
   untouched rather than re-measured. Overall **11 up / 5 down**. *(The pooled median is deliberately not
   recomputed: the earliest ten pairs' individual values live in the 09-28 lane's working and not in any
   ledger this session read, so a median here would be a number this document cannot source.)* **The
   actionable half is now three-for-three on out-of-sample additions and 0 for 10 overall.** Registered as
   **FT-consumer-confidence-2027-11-30-4**.

6. **THE PROPOSAL'S CUT-OFF CAUTION IS SUPPORTED TO THE DAY — AND ITS PROJECTION IS NARROWED AND MOVED
   EARLIER BY CHANGING THE ANCHOR.** The stated cut-offs are **November 18** (against a 11-29 release),
   **November 15** (against 11-28) and **November 18, 2024** (against 11-26) — lags of **11 / 13 / 8**,
   exactly the proposal's figures, and the longest and widest in the chain. But the proposal projected 2027's
   cut-off *from the lag*, giving **11-17 → 11-22**. Look at the two anchors side by side:

   | Month | Lags | lag spread | Cut-off day of month | day spread | **Project from** |
   |---|---|---|---|---|---|
   | October | 6 / 7 / 6 | **1** | 19 / 24 / 23 | 5 | the **lag** |
   | **November** | 11 / 13 / 8 | 5 | **15 / 18 / 18** | **3** | the **day of month** |

   **November's day-of-month anchor is nearly twice as tight as its lag anchor, and October's is the
   opposite.** So the honest 2027 projection is **2027-11-15 → 2027-11-18**, earlier and narrower than the
   proposal's, giving a lag of **12 to 15 days** — which would be the longest in the chain. The mechanism is
   visible in the data and explains both months: all three November cut-offs close **before Thanksgiving**
   (6, 8 and 10 days before it), so the field window is pinned to the holiday while the *release* floats to
   the last Tuesday — which is why November's lag is unstable and its day of month is not. **The general
   lesson, and it is the one worth carrying: a neighbouring month's projection METHOD must not be borrowed
   any more than its numbers.** Registered as **FT-consumer-confidence-2027-11-30-5**.

7. **TWO NEW CHANNELS WERE BUILT AND BOTH ARE NULL — month-end, and proximity to a SEP meeting.** Neither
   has been tested anywhere in this chain, and 2027-11-30 is in the interesting arm of both.

   **Month-end.** 2027-11-30 is the last calendar day of its month *and* the last trading session. Only
   **11 of the 68** CB days in the record are — it happens exactly when the month ends on a Tuesday
   (2021-08-31, **2021-11-30**, 2022-05-31, 2023-01-31, 2023-02-28, 2023-10-31, 2024-04-30, 2024-12-31,
   2025-09-30, 2026-03-31, 2026-06-30):

   | Control | n | Result | SPY | smallest p |
   |---|---|---|---|---|
   | **month-end CB days vs other CB days** | 11 vs 57 | **1 of 9** | 1.054 / 0.735, p=0.1618 | TLT **0.0374** |
   | **ALL month-end sessions vs all other sessions** | 70 vs 1,377 | **0 of 9** | 1.084 / 0.966, p=0.2864 | XRT 0.2233 |

   The second row is what settles it: **there is no month-end effect in this tape at all** for a CB print to
   ride on, so the single TLT crossing at n=11 is the false positive nine tests predict. **Declined.**

   **SEP proximity.** The 10-26 sibling proved a CB print can never *collide* with a SEP meeting; nobody had
   asked whether it can *approach* one. CB days within 15 sessions of a SEP decision (n=14 vs 54) are **0 of
   9**, smallest p VIX 0.3749. **But the null does not cover this print, and that limit is the finding.**
   The minimum gap anywhere in the 68 is **10 sessions**, and the five November prints run **11 / 11 / 11 /
   15 / 10**. 2027-11-30 sits about **6 sessions** before the 2027-12-08 decision — **closer than any CB
   print in the record.** Registered as **FT-consumer-confidence-2027-11-30-6**.

8. **NOVEMBER HOLDS BOTH ARMS OF THE THANKSGIVING QUESTION, AND THE SPLIT IS DETERMINISTIC RATHER THAN
   LUCKY.** October is the only month that holds both arms of the *collision* question (the 10-26 sibling's
   finding); November is the only one that holds both arms of a *holiday* question:

   | November CB day | Thanksgiving | Arm |
   |---|---|---|
   | 2021-11-30 | 11-25 | **after**, +5d |
   | 2022-11-29 | 11-24 | **after**, +5d |
   | 2023-11-28 | 11-23 | **after**, +5d |
   | 2024-11-26 | 11-28 | **before**, −2d |
   | 2025-11-25 | 11-27 | **before**, −2d |
   | 2026-11-24 | 11-26 | **before**, −2d |
   | **2027-11-30** | **11-25** | **after, +5d** |

   **3 after / 3 before, and it is not a coincidence:** Thanksgiving is the 4th Thursday (Nov 22–28) and the
   last Tuesday is Nov 24–30, so **the print precedes Thanksgiving exactly when November 1 falls on a
   Friday, Saturday or Sunday** — three weekdays of seven. **2027 is an "after" year.** Within-November
   after-vs-before is **0 of 9** (n=3 vs 2 in the tape window, smallest p TLT 0.1489) and is, like October's
   equivalent, **hopelessly underpowered and offered as corroboration, not proof.**

9. **AND THIS IS WHERE THE STUDY ALMOST WENT WRONG — the one crossing in eight months of refusals is a half
   session.** Widening leg 8 from the print to its whole window produced the strongest result this chain has
   ever seen:

   | Control | n | Result | SPY | XLY |
   |---|---|---|---|---|
   | **post-Thanksgiving week vs the rest of the tape** | 16 vs 1,431 | **4 of 9** | 0.642 / 0.973, **p=0.0045** | 1.053 / 1.442, **p=0.0016** |
   | post-Thanksgiving week **excluding Black Friday** | 11 vs 1,436 | **1 of 9** | 0.659 / 0.971, p=0.0562 | 1.143 / 1.439, p=0.0372 |
   | **the five Black Fridays alone** | 5 vs 1,442 | **5 of 9** | 0.465 / 0.971, p=0.0254 | 0.806 / 1.437, **p=0.0107** |

   The first row's SPY and XLY both clear a **Bonferroni-corrected 0.05/9 = 0.00556**, which no leg in this
   chain has done. **It is the 1:00 p.m. ET half session.** Take the five Black Fridays out and four
   crossings become one; put them on their own at n=5 and they carry five. The per-session ranges make it
   visible without a test — the Black Fridays run SPY **0.169 / 0.342 / 0.465 / 0.662 / 1.326** against a
   full-session median of 0.973. **A shortened session mechanically cannot print a full day's range, so this
   was never a market fact.** And it does not reach this event: **2027-11-30 is a full Tuesday session,
   three sessions after Black Friday 2027-11-26.** Registered as **FT-consumer-confidence-2027-11-30-7**.

10. **THE PROPOSAL'S "QUIET CELL" CAUTION IS MIXED — right on VIX, wrong as a blanket claim, and it partly
    rehabilitates a rule the 10-26 sibling told the chain to retire.** Monthly VIX medians: **Jan 18.14 ·
    Feb 19.63 · Mar 21.84 · Apr 18.71 · May 18.12 · Jun 16.70 · Jul 16.50 · Aug 16.26 · Sep 17.20 · Oct
    19.33 · Nov 17.25 · Dec 17.65.**

    | Comparison | n | Result | notable |
    |---|---|---|---|
    | **November vs October** | 102 vs 110 | **2 of 9** | **VIX 17.25 / 19.33, p=0.0001**; XLF 1.080 / 1.285, p=0.0033 |
    | November vs the rest of the year | 102 vs 1,345 | **3 of 9** | XLF **0.0030 narrower**; TLT **0.0184 WIDER**; AAPL 0.0405 narrower |
    | November **excluding the post-Thanksgiving week** vs rest | 91 vs 1,340 | **3 of 9** | XLF 0.0097 narrower; TLT 0.0158 wider; AMZN 0.0368 wider |
    | late November (22nd onward) vs rest of year | 27 vs 1,420 | **2 of 9** | AAPL 0.0281; XLF 0.0250 |

    **October's +2.16 VIX step is given back in full — the proposal is right about that.** But "the cell is
    quiet" is not what the tape says as a blanket claim: November is **quiet in VIX level and in
    financials, and WIDER in rates** (and in AMZN), and the mixed picture **survives removing the
    post-Thanksgiving week**, so it is not leg 9's artifact. **The consequence for the 08-31 sibling's cell
    rule matters.** The 10-26 sibling, having watched "the late cell is narrower" invert two months running,
    told the chain to **retire it as a seasonal claim**. That is right, and the fix is narrower than
    abandonment: the sequence **Aug narrow → Sep wider → Oct widest → Nov back down** is real and
    non-monotone. **Retire the seasonal generalisation; keep the monthly cell read** — which is what the
    09-28 and March siblings both concluded independently.

11. **THE PROPOSAL'S "CLEAN PRINT" IS RIGHT ABOUT COLLISION AND INCOMPLETE ABOUT THE FED — the caution most
    likely to mislead the next lane.** The 2027 FOMC panel, re-parsed here, reads **January 26-27 · March
    16-17\* · April 27-28 · June 8-9\* · July 27-28 · September 14-15\* · October 26-27 · December 7-8\***.
    **There is no November 2027 meeting**, so the proposal is correct: this is genuinely collision-free, the
    opposite configuration to the October print. **But collision is not the only Fed channel, and this print
    is inside two of the others.** Deriving all 56 blackout windows from the Board's stated rule (the second
    Saturday before day one, through the Thursday after the conclusion) reproduces the
    `fomc-blackout-start-2027-04-17` lane's decoded 2027 shading **8 of 8** — 01-16, 03-06, 04-17, 05-29,
    07-17, 09-04, 10-16 and **11-27** — so the December meeting's window is **2027-11-27 → 2027-12-09** and
    **the print sits four days inside it.** It is also **~6 sessions before a SEP decision** (leg 7).

    | Control | n | Result | SPY | smallest p |
    |---|---|---|---|---|
    | CB days inside a blackout vs outside | 23 vs 45 | **0 of 9** | 0.921 / 0.788, p=0.8764 | AMZN 0.3574 |
    | clean CB inside a blackout vs clean CB outside | 6 vs 45 | **0 of 9** | 1.254 / 0.788, p=0.1933 | VIX 0.0872 |

    **Both rows reproduce the 10-26 sibling character-for-character**, so the blackout channel stays
    measured and empty and this lane spends nothing re-litigating it. **What this print adds is a
    configuration the null does not cover** — a blackout instance that is *not* also a collision *and* sits
    closer to a SEP decision than anything in the record. That is a stated limit, not a claim. Registered as
    **FT-consumer-confidence-2027-11-30-9**.

12. **THE PIPELINE REPLICATES THE APRIL THROUGH OCTOBER SIBLINGS EXACTLY, 9 OF 9, AND THE DIRECTIONAL SCAN
    12 OF 12.** On the identical window the 68 rule-derived CB days split **51 clean / 17 colliding**, the
    collisions are **17 day-ones and 0 decision days**, and the clean set's medians reproduce the published
    table **to three decimals on all nine instruments**: SPY **0.911**, QQQ **1.379**, XLY **1.397**, XRT
    **1.687**, AMZN **2.154**, AAPL **1.731**, XLF **1.119**, TLT **0.961**, VIX close **18.560** — **0 of
    9**, smallest p XLF **0.2713**. The FOMC parser's banked assertions all held (**56** meetings, **8** in
    every year 2021–2027, **28** SEP), including both traps: the cross-month labels (`Jan/Feb 31-1`,
    `Apr/May 30-1`, `Oct/Nov 31-1`) and the 2027 panel's own footnote *"Note: A two-day meeting is scheduled
    for January 25-26, 2028."*, which a year-scoped parse turns into a phantom ninth 2027 meeting.

    **Three second-decimal discrepancies are recorded rather than smoothed.** This session's monthly VIX
    medians differ from the 10-26 sibling's on three of twelve months — **Jun 16.70 vs 16.73, Sep 17.20 vs
    17.17, Nov 17.25 vs 17.21** — while the other nine match exactly and every cross-month comparison in
    both ledgers returns the same verdict. The likely cause is a session-alignment difference in which VIX
    rows enter a month's set; **no result in either document turns on it**, and it is banked here so a third
    lane meeting a 0.03 gap knows it is expected. That is the same trade the 09-28 sibling made with the
    `fomccalendars.htm` byte count — record the discrepancy, do not build on it.

13. **DIRECTIONAL: EIGHTH MONTH, EIGHTH REFUSAL — AND UNLIKE OCTOBER, NOT CLOSE.** Re-running the twelve-month
    scan under the identical comparator (each month's CB days vs that month's other sessions from the 22nd
    onward):

    | | Jan | Feb | Mar | **Apr** | May | Jun | Jul | Aug | Sep | **Oct** | **Nov** | Dec |
    |---|---|---|---|---|---|---|---|---|---|---|---|---|
    | up / n | 3/6 | 3/6 | 3/6 | 1/6 | 4/6 | 5/6 | 2/6 | 4/6 | 2/5 | **5/5** | **3/5** | 1/5 |
    | p | .6532 | .9005 | .4834 | **.0150** | .8154 | .3603 | .1458 | .6793 | .3796 | .1643 | **.5957** | .2615 |

    **All twelve reproduce the 09-28 and 10-26 siblings character-for-character**, which is the check that
    this is the same test. November's CB days are **3 of 5 up, SPY close-to-close median +0.099% against
    +0.325% on other late-November sessions, p=0.5957** — the CB median is **below** its comparator, so
    unlike October's 5-of-5 there is nothing here even to decline reluctantly. Registered as
    **FT-consumer-confidence-2027-11-30-8**.

14. **Tracked-name sensitivity is nil and the corridor was empty — SUPPORTED.** `symbols: []`. A re-grep of
    `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any macro- or
    sentiment-keyed playbook returns **0 hits**. **Before this PR this calendar held no event anywhere in
    November *or* December 2027.** Two are proposed here: `fomc-blackout-start-2027-11-27` (leg 11's anchor,
    and the window this "clean" print sits inside) and `consumer-confidence-2027-12-22` (the December
    edition, dated from leg 2's pull-forward and the 2021 Saturday-Christmas twin). **Two more were found
    and deliberately not filed**, because sibling lanes proposed the same ids the same day with equal or
    better sourcing: `fhfa-hpi-2027-11-30` (from `fhfa-hpi-2027-10-26`, which cites a second FHFA primary
    this session did not read) and `fomc-2027-12-08` (from `fomc-2027-10-26`). Adding competing duplicates
    would have been calendar noise, so what this lane found about those two events is recorded here instead:
    the FHFA release is the **quarterly** edition (September 2027 and 2027Q3), not October's monthly one;
    and **2027-12-07 is the earliest SEP day-one anywhere in the 2021–2027 panel** — the observed range is
    the 7th to the 21st and this is the unique instance at the floor, which is precisely the one-day margin
    `FT-consumer-confidence-2027-10-26-2`'s kill switch watches.

### What the conditions support

**A refusal, a caught false positive, and one reading rule worth keeping.** The refusal first, because it is
the only trading-adjacent line here: **nothing is opened, closed or sized off this print** — `symbols: []`,
zero macro-keyed playbooks, D-450, and the print day null on every control constructed here.

**The caught false positive is what this ledger will be remembered for.** The post-Thanksgiving week is the
first configuration in eight months of refusals to cross multiple instruments at Bonferroni-surviving
p-values — **4 of 9, SPY p=0.0045, XLY p=0.0016** — and it is **entirely the Black Friday half session**
(1 of 9 without them; 5 of 9 for the five of them alone). A shortened session cannot print a full day's
range. The chain has spent eight months declining weak signals; this is the first time it declined a
*strong-looking* one, and the mechanism was found rather than assumed. **It does not touch 2027-11-30**,
which is a full Tuesday three sessions later.

**The reading rule worth keeping is about revisions, and it is the inverse of October's.** December restates
November **+1.2 / −1.0 / +1.1** — an absolute-revision spread of **0.2** against 1.1 to 3.2 for every other
month, with the sign 2 of 3 up. **Expect the November headline to move about 1.1 points and do not guess the
direction.** Beside it, the 09-28 sibling's **80-threshold band gains three more clean out-of-sample pairs
and stands at 0 of 10 outside ±2.0** — the actionable half is now the best-evidenced claim in this chain.

**Two channels were built and both are null**, and one of them is null in an unusually complete way:
month-end is 1 of 9 *and* there is no month-end effect in the tape at all (0 of 9 across all 70 month-end
sessions), so the single crossing has nothing to be a shadow of. SEP proximity is 0 of 9 at n=14 vs 54 —
**but the record's minimum CB-to-SEP gap is 10 sessions and this print sits at ~6, so that null does not
cover it.** Stated as a limit, not smoothed away.

**Two of the proposal's cautions need amending before the next lane inherits them.** "Clean print" is right
about collision — there is no November 2027 FOMC meeting — and **wrong if read as clean of the Fed**: the
print sits four days inside the **2027-11-27 → 2027-12-09** blackout. And "the cell is quiet" is **mixed**:
right on VIX level (17.25 vs October's 19.33, p=0.0001) and on financials, **wrong on rates**, where
November is significantly *wider*. **Its cut-off caution is right to the day and its projection is
improved:** project November's cut-off from the **day of month (15–18)**, giving **2027-11-15 → 11-18**, not
from the lag — and carry the general lesson that a neighbour's *method* travels no better than its numbers.

**The reading order when this print lands** is: **the edition's own stated cut-off date first** (leg 6 —
expect 11-15 to 11-18), **then October's restated values** (leg 4 of the 10-26 sibling — expect them
markedly lower, that lane's own forward test), **then Expectations against 80.0 read as a band** (leg 5),
**then the headline, remembering it will move about 1.1 points in an unknown direction** (leg 4), **then the
next-release line for December's date — the date, not the weekday** (legs 2 and 3), and **the blackout and
the SEP approach not at all** (leg 11).

### Honest limits

**The date is `estimate`.** The Board has not announced November 2027; three doubly-sourced Novembers, a
stated rule, and a second publisher's matching forward calendar are strong for an estimate and are not an
announcement. FHFA publishing on 2027-11-30 is evidence that 2027-11-30 is a last Tuesday, not evidence
about the Conference Board's intentions. **Two of the five November CB dates in the tape set are the rule
applied backward** — 2021-11-30 and 2025-11-25 were not separately sourced. **Leg 2's December record is
five dates, three of which this session verified and two of which are inherited** from the
`consumer-confidence-2026-12-22` lane; the *forward-announcement* claim rests on the three this session read.
**Leg 3 is a single error in seven lines** — enough to establish that the hazard is real, not enough to
estimate how often it occurs. **Leg 4 is 3 computable cases**, and **five of the six Nov-2024 restated values
are DERIVED from stated deltas rather than quoted levels** (`CCI-Dec-2024` gives −8.1, −1.2 and −12.6 rather
than November's restated levels) — arithmetic on the Board's own numbers, but not the Board's own restated
figures. **Leg 5's sixteen pairs** inherit a band that was **fitted to the first ten after seeing them**, and
the three new pairs all landed *outside* it, so this session tested only the half that was already winning;
the inside-band claim is unchanged at 3 of 6 because nothing new tested it. **Leg 6's mechanism is inferred**
— the Board publishes a cut-off date, never a field-opening date, so "the window is pinned to Thanksgiving"
is an inference from three stated endpoints. **Leg 7's month-end arm is n=11 and its SEP arm is n=14**, and
the SEP arm explicitly does not reach this print's configuration. **Leg 8 is n=3 vs 2.** **Leg 9's
correction is the strongest result here and it rests on n=5 half sessions** — the *direction* is mechanical
and certain (a 3.5-hour session cannot print a 6.5-hour range), the *magnitude* is not estimated. **Leg 10's
cells are n≈100 sessions in one unusual macro window** (2021–2026 contains a bear market, a hiking cycle and
a pandemic reopening), and three of its crossings sit between p=0.003 and p=0.04 on nine simultaneous tests,
which is at best suggestive. **Leg 11's blackout windows are DERIVED from the Board's stated rule, not read
off the shading** — this session did not re-decode the blackout PDF; it re-applied the rule and matched the
`fomc-blackout-start-2027-04-17` lane's existing decode 8 of 8 for 2027. **Leg 12's three VIX discrepancies
are unexplained**, not merely unimportant. **The whole study is at daily-bar resolution and says nothing
about the 10:00–10:30 ET window**, the only place a 10:00 macro print could plausibly live — and on this
date that window also follows a 9:00 FHFA *quarterly* release. **No November consensus exists and
structurally will not** (Conference Board publication restrictions). And **everything about the November
2027 economy is unknown at D-450** — no part of this doc depends on what the survey prints.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the November 2027 Conference Board edition as a
**medium-impact second-tier print that is regime information and never a trading event**. **No position is
opened, closed or sized off it.** **The finding this ledger exists for is a false positive that was caught
rather than published.** The post-Thanksgiving week is **4 of 9** narrower than the rest of the tape — SPY
0.642 vs 0.973 (**p=0.0045**) and XLY 1.053 vs 1.442 (**p=0.0016**), both surviving a Bonferroni-corrected
0.00556, which no leg in eight months of this chain has done — and **removing the five Black Fridays
collapses it to 1 of 9 while the five Black Fridays alone carry 5 of 9.** It is the **1:00 p.m. ET half
session**, and it does not reach this print, which is a **full Tuesday three sessions past Black Friday
2027-11-26.**

**The reading rule that survives is the inverse of October's.** December restates November **+1.2 / −1.0 /
+1.1**: 2 of 3 up, mean +0.43, but the **absolute** revision runs **1.0 to 1.2 — a spread of 0.2 against
1.1, 2.2, 2.6 and 3.2 for the four months the chain already had.** So **expect the November headline to move
about 1.1 points and do not guess the direction**, where October's rule is large-and-reliably-downward. The
five-month sequence now reads **−0.60 / +1.77 / +0.53 / −0.97 / +0.43**, and what both months agree on is
the 09-28 and 10-26 lanes' shared conclusion that **revision behaviour is a property of the month.** **The
09-28 sibling's 80-threshold band gains three more out-of-sample pairs** (Nov 2022 Expectations 75.4 → 76.7,
Nov 2023 77.8 → 77.4, Nov 2024 92.3 → 93.7), all outside ±2.0 and none flipping side: **0 of 10 outside the
band** (was 0 of 7), inside unchanged at 3 of 6, overall 11 up / 5 down. That fragment is the 09-28 lane's to
score and is untouched here.

**The November edition turns out to be a scheduling instrument as well as a data one.** December has never
published on its rule-derived last Tuesday (2021-12-22, 2022-12-21, 2023-12-20, 2024-12-23, 2025-12-23 — 6
to 8 days early, three different weekdays), which this calendar already held from the
[`consumer-confidence-2026-12-22`](consumer-confidence-2026-12-22.md) lane and this session **replicated**
from three December editions' own stamps. **What is new is that the November edition names December's date
3 of 3, about four weeks ahead** — a cheap dated promotion trigger, written into the
`consumer-confidence-2027-12-22` proposal filed with this PR. **Read the date in those lines, never the
weekday:** `CCI-Dec-2022`'s reads *"Wednesday, January 31"* and 2023-01-31 was a **Tuesday**
(`CCI-Jan-2023`'s own stamp settles it) — 1 error in 7 forward lines.

**Two of the proposal's four cautions are amended.** Its **cut-off caution is right to the day** (lags
**11 / 13 / 8**, the longest and widest in the chain) but its projection method is not: **November's
cut-off day of month spans only 15–18 against the lag's 8–13**, so project from the day of month —
**2027-11-15 → 11-18**, not 11-17 → 11-22 — while October is the opposite (lag spread 1, day spread 5).
**A neighbour's method travels no better than its numbers.** Its **"clean print" is right about collision
and incomplete about the Fed**: there is genuinely no November 2027 FOMC meeting (the panel runs Oct 26-27
then Dec 7-8 with a SEP), but the print sits **four days inside the 2027-11-27 → 2027-12-09 blackout**, and
**about 6 sessions before a SEP decision — closer than any of the 68 CB days in the record**, whose minimum
is 10. Its **"quiet cell" is MIXED**: right on VIX level (November 17.25 vs October 19.33, **p=0.0001**,
October's +2.16 step fully given back) and on financials (XLF p=0.0030), **wrong on rates**, where November
is significantly **wider** (TLT p=0.0184) — and the mixed picture survives removing the post-Thanksgiving
week. So **retire the 08-31 cell rule's seasonal generalisation, as the 10-26 sibling argued, but keep the
monthly cell read**: Aug narrow → Sep wider → Oct widest → Nov back down is real and non-monotone. Its
**serial-fetch caution holds** — 7 serial fetches, zero captchas, `probe-ref.blocked` empty.

**Two new channels were built and both are null.** **Month-end** (this print is one of only 11 CB days in
the record that are their month's last trading session): **1 of 9** against other CB days, on a tape where
**all 70 month-end sessions are 0 of 9** against the rest — no effect to be a shadow of, so the single TLT
crossing is declined. **SEP proximity**: **0 of 9** at n=14 vs 54, but explicitly not covering this print's
~6-session gap. **November also holds both arms of the Thanksgiving question** — 3 after / 3 before, and
deterministically so (the print precedes Thanksgiving exactly when November 1 is a Fri/Sat/Sun); 2027 is an
"after" year, and within-November after-vs-before is 0 of 9 at n=3 vs 2. **Directionally this is the eighth
consecutive monthly refusal and the least close of them**: November CB days are 3 of 5 up, SPY median
**+0.099%** against **+0.325%** on other late-November sessions, **p=0.5957** — the CB median is *below* its
comparator, unlike October's 5 of 5. Base case for the print itself (**Low** confidence — no consensus
exists or will): the edition **restates October 2027's headline lower** (the 10-26 lane's own forward test,
not this one's) and **its own headline should be expected to move ~1.1 points in an unknown direction.**
Nine predictions are registered in
[`forward-tests/consumer-confidence-2027-11-30.md`](../forward-tests/consumer-confidence-2027-11-30.md).

**Kill switches:**

- **The Conference Board names a November 2027 date other than 2027-11-30** — the November last-Tuesday
  rule breaks despite three editions double-sourced in both directions, and this doc's date confidence
  collapses. Registered as **FT-consumer-confidence-2027-11-30-1**.
- **The November 2027 edition's next-release line names 2027-12-28, or no date at all** — leg 2's
  forward-announcement mechanism fails at its first forward test and the December estimate loses its cheap
  promotion trigger. Registered as **FT-consumer-confidence-2027-11-30-2**.
- **The December 2027 edition restates November 2027's headline by more than ±1.7 or less than ±0.5** —
  leg 4's tight-magnitude finding was a three-case coincidence. Registered as
  **FT-consumer-confidence-2027-11-30-3**.
- **Either of the next two first-print Expectations readings outside ±2.0 of 80.0 flips side on
  restatement** — the band's actionable half breaks after 10 clean cases. Registered as
  **FT-consumer-confidence-2027-11-30-4**.
- **The November 2027 edition states a cut-off date before 2027-11-13 or after 2027-11-20** — leg 6's
  day-of-month anchor is no better than the lag anchor it replaced. Registered as
  **FT-consumer-confidence-2027-11-30-5**.
- **Month-end CB days clear p<0.05 on 2 or more of 9 against other CB days** on a re-run of the same
  nine-instrument pipeline after 2027-12-31 — leg 7's null was a small-sample accident. Registered as
  **FT-consumer-confidence-2027-11-30-6**.
- **Post-Thanksgiving-week sessions EXCLUDING Black Friday clear p<0.05 on 2 or more of 9** on that re-run,
  or the Black Fridays alone fall below 3 of 9 — leg 9's attribution to the half session is wrong.
  Registered as **FT-consumer-confidence-2027-11-30-7**.
- **November's directional scan clears p<0.05 once 2026-11-24 is added** — the eighth refusal breaks at the
  first new instance, eleven weeks out. Registered as **FT-consumer-confidence-2027-11-30-8**.
- **The Board's published blackout calendar names a December 2027 window starting other than 2027-11-27** —
  leg 11's derivation is wrong and this print is not inside a blackout after all. Registered as
  **FT-consumer-confidence-2027-11-30-9**.
- **Expectations below ~54** — deterioration past the April-2025 reading the Board itself called the lowest
  since October 2011; escalate ahead of the banded pulse.
- **A federal funding lapse runs through the ~11-01 → 11-18 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1 – Nov 12 2025 shutdown ended), and a lapse beginning
  at the 10-01 fiscal-year start would still be running through November's panel.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits" premise
  under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-450 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-11-30.json` written this PR** after reading the one prior proposal (`from-consumer-confidence-2027-10-26`), now inert. **THE HEADLINE IS A CAUGHT FALSE POSITIVE.** Post-Thanksgiving-week sessions vs the rest of the tape are **4 of 9** — SPY **0.642/0.973 p=0.0045**, XLY **1.053/1.442 p=0.0016**, QQQ 0.0290, XRT 0.0345 — with SPY and XLY clearing even **Bonferroni 0.05/9=0.00556**, which no leg in eight months of this chain has done. **Excluding the five Black Fridays it collapses to 1 of 9** (XLY 0.0372 only); **the five Black Fridays ALONE are 5 of 9** (SPY 0.465/0.971 p=0.0254, XLY **0.0107**, XRT 0.0141, QQQ 0.0291, XLF 0.0376). Per-session SPY ranges on those five: 0.169 / 0.342 / 0.465 / 0.662 / 1.326 vs a 0.973 full-session median. **It is the 1:00 p.m. ET half session, not the week — a 3.5-hour session mechanically cannot print a 6.5-hour range.** **2027-11-30 is a FULL Tuesday three sessions past Black Friday 2027-11-26, so none of it reaches this print.** **DECEMBER RESTATES NOVEMBER +1.2 / −1.0 / +1.1 — MAGNITUDE TIGHTEST IN THE CHAIN, SIGN A COIN FLIP.** First prints 100.2/137.4/75.4, 102.0/138.2/77.8, 111.7/140.9/92.3 restated to **101.4** (+1.2), **101.0** (−1.0, "downwardly revised") and **112.8** (+1.1, derived from CCI-Dec-2024's "declined by 8.1 points to 104.7"). 2 of 3 up, mean **+0.43**, but **\|Δ\| = 1.2/1.0/1.1, a spread of 0.2** against Aug-restates-Jul 2.6, Sep-restates-Aug 2.2, Oct-restates-Sep 1.1, Nov-restates-Oct 3.2. **Expect November's headline wrong by ~1.1 points and do not guess direction** — the exact inverse of October's large-and-reliably-down. Five-month sequence: **−0.60 / +1.77 / +0.53 / −0.97 / +0.43**. **80-THRESHOLD BAND SCORED OUT OF SAMPLE A SECOND TIME — ACTIONABLE HALF NOW 0 OF 10.** Three new pairs, all OUTSIDE ±2.0, none flipping: Nov 2022 Exp **75.4→76.7** (dist 4.6), Nov 2023 **77.8→77.4** (2.2), Nov 2024 **92.3→93.7** (12.3). Pooled 16: **outside ±2.0 = 0 of 10** (was 0/7); **inside unchanged at 3 of 6** (no new pair landed inside); overall **11 up / 5 down**. Pooled median deliberately NOT recomputed — the first ten pairs' values are not in any ledger this session read. **THE NOVEMBER EDITION IS THE CHAIN'S FORWARD-ANNOUNCEMENT VENUE FOR DECEMBER'S RULE-BREAK, 3 OF 3.** CCI-Nov-2022 "The next release is **Wednesday, December 21**" → CCI-Dec-2022 (**889,114 B, Updated 2022-12-21**); CCI-Nov-2023 "**Wednesday, December 20**" → CCI-Dec-2023 (**1,264,748 B, 2023-12-20**); CCI-Nov-2024 "**Monday, December 23rd**" → CCI-Dec-2024 (**898,445 B, 2024-12-23**). **None is a last Tuesday.** December record 2021-12-22 / 2022-12-21 / 2023-12-20 / 2024-12-23 / 2025-12-23 = **6/6/6/8/7 days early on three different weekdays**. **This calendar ALREADY HELD that** (`consumer-confidence-2026-12-22` + `-12-29`, five editions + a 2020 advisory) — **3 of 5 independently replicated here; the DISCOVERY is that November announces it ~4 weeks ahead**, giving a December estimate a cheap dated promotion trigger. **A PUBLISHER WEEKDAY-LABEL ERROR FOUND AND CLOSED:** CCI-Dec-2022's forward line reads "**Wednesday**, January 31"; **2023-01-31 was a TUESDAY**, and a seventh serial fetch (CCI-Jan-2023, **880,155 B**) carries `Updated : 2023-01-31`. **Date right, weekday wrong — 1 error in 7 forward lines. Trust the date, never the weekday.** **CUT-OFF CAUTION SUPPORTED TO THE DAY, PROJECTION IMPROVED BY CHANGING THE ANCHOR.** Stated cut-offs **November 18 / November 15 / November 18, 2024** → lags **11/13/8** (the proposal's figures exactly; longest and widest in the chain). But **day-of-month spans only 15–18 (spread 3) vs the lag's 8–13 (spread 5)**, so project from the day of month: **2027-11-15 → 11-18**, not the proposal's 11-17 → 11-22. **October is the OPPOSITE** (lags 6/7/6 spread 1, days 19/24/23 spread 5). All three November cut-offs close **before Thanksgiving** (−6/−8/−10d), which is the mechanism. **A neighbour's METHOD travels no better than its numbers.** **TWO NEW CHANNELS BUILT, BOTH NULL.** **Month-end** — 11 of 68 CB days are their month's last trading session (incl. **2021-11-30**; 2027-11-30 is one): **1 of 9** vs other CB days (TLT 0.0374, SPY 1.054/0.735 p=0.1618) — but **ALL 70 month-end sessions vs the rest are 0 of 9**, so there is no month-end effect to be a shadow of; declined as the expected false positive. **SEP proximity** — CB days ≤15 sessions before a SEP decision, **0 of 9** at n=14 vs 54. **BUT THE NULL DOES NOT COVER THIS PRINT:** the record's minimum CB→SEP gap is **10 sessions** (the five November prints run 11/11/11/15/10) and **2027-11-30 sits ~6 sessions before the 2027-12-08 decision — closer than anything in the record.** Stated as a limit. **NOVEMBER HOLDS BOTH ARMS OF THE THANKSGIVING QUESTION, DETERMINISTICALLY.** After: 2021-11-30, 2022-11-29, 2023-11-28 (+5d). Before: 2024-11-26, 2025-11-25, 2026-11-24 (−2d). **The print precedes Thanksgiving exactly when November 1 is a Fri/Sat/Sun.** **2027 is an AFTER year.** Within-November after-vs-before **0 of 9** (n=3 vs 2, smallest TLT 0.1489) — underpowered, corroboration only. **"CLEAN PRINT" IS RIGHT ABOUT COLLISION AND INCOMPLETE ABOUT THE FED.** The 2027 panel has **no November meeting** (Oct 26-27, then **Dec 7-8 with a SEP**), so collision-free is correct. **But the print sits FOUR DAYS INSIDE the December blackout, 2027-11-27 → 2027-12-09** — derived from the Board's ten-days-earlier rule, and this session's derivation of all 56 windows reproduces the `fomc-blackout-start-2027-04-17` decode **8 of 8 for 2027** (01-16, 03-06, 04-17, 05-29, 07-17, 09-04, 10-16, **11-27**). Blackout channel **replicated character-for-character**: inside vs outside **23 vs 45, 0 of 9** (SPY 0.921/0.788 p=0.8764, smallest AMZN 0.3574); **clean-in-window 6 vs 45, 0 of 9** (SPY 1.254/0.788 p=0.1933, smallest VIX 0.0872). **"QUIET CELL" IS MIXED — AND IT PARTLY REHABILITATES THE 08-31 CELL RULE.** VIX medians **Jan 18.14 · Feb 19.63 · Mar 21.84 · Apr 18.71 · May 18.12 · Jun 16.70 · Jul 16.50 · Aug 16.26 · Sep 17.20 · Oct 19.33 · Nov 17.25 · Dec 17.65**. **November vs October 2 of 9 — VIX 17.25/19.33 p=0.0001** (October's +2.16 step fully given back, proposal SUPPORTED) **and XLF 1.080/1.285 p=0.0033**. But **November vs rest of year is 3 of 9 and MIXED IN SIGN**: XLF **0.0030 narrower**, AAPL 0.0405 narrower, **TLT 0.0184 WIDER** — and it **survives excluding the post-Thanksgiving week** (XLF 0.0097, TLT 0.0158, AMZN 0.0368), so it is not leg 9's artifact. **Quiet in VIX level and financials, WIDER in rates.** The 10-26 sibling said retire the cell rule; the narrower fix is **retire the SEASONAL generalisation, keep the monthly read** — Aug narrow → Sep wider → Oct widest → Nov back down is real and non-monotone. **DIRECTIONAL: EIGHTH MONTH, EIGHTH REFUSAL, AND THE LEAST CLOSE.** November CB days **3 of 5 up**, SPY c2c median **+0.099%** vs **+0.325%** other late-November, **p=0.5957** — the CB median is **BELOW** its comparator, unlike October's 5-of-5. Twelve-month scan reproduces the 09-28 and 10-26 siblings **character-for-character** (Apr **.0150**, Sep .3796, Oct .1643, Nov **.5957**). Scoring venue **2026-11-24**, eleven weeks out. **REPLICATION EXACT, 9 OF 9** — same vendor pair (stockanalysis.com + CBOE `VIX_History.csv`, **472,309 B**), n=**1,447**, 68 CB days **51 clean / 17 colliding** (17 day-ones, **0** decision days), clean medians to three decimals (SPY **0.911**, QQQ 1.379, XLY 1.397, XRT 1.687, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT 0.961, VIX **18.560**), **0 of 9**, smallest XLF **0.2713**; SPY close **770.19**, VIX **14.53** (2026-09-04). FOMC parser assertions held (**56** meetings, **8**/year 2021-2027, **28** SEP), both traps cleared (cross-month `Jan/Feb 31-1`, `Apr/May 30-1`, `Oct/Nov 31-1`; and the 2027 panel's "January 25-26, 2028" footnote that a year-scoped parse turns into a phantom ninth meeting). `fomccalendars.htm` **164,831 B**, matching the six ledgers that record it. **THREE SECOND-DECIMAL VIX DISCREPANCIES RECORDED, NOT SMOOTHED:** this session's monthly medians differ from the 10-26 sibling's on **Jun 16.70 vs 16.73, Sep 17.20 vs 17.17, Nov 17.25 vs 17.21** while the other nine match exactly; likely a session-alignment difference in which VIX rows enter a month; **no comparison in either ledger turns on it**, and it is banked so a third lane meeting a 0.03 gap knows it is expected. Adjacency sweep — **peers:** `symbols: []`; unlike October there is no earnings cluster confound (AAPL is not the smallest-p instrument in any November control). **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53** (CBOE close), SPY **770.19** (2026-09-04) — baseline set, identical to the April–October siblings'. **Geopolitical:** unchanged from siblings. **Event tape:** no November consensus exists or is publishable (CB publication restrictions); current edition is August 2026, next release named **2026-09-29** on the 332,031-byte landing page. **NO CAPTCHA: 7 serial fetches, zero hits**, every one validated by byte count and its `Source:` line; `probe-ref.blocked` empty. **Corridor: ZERO tracked events existed anywhere in November OR December 2027** before this PR. **TWO proposals filed:** (1) `proposals/fomc-blackout-start-2027-11-27.from-consumer-confidence-2027-11-30.json` — leg 11's anchor and the window this "clean" print sits inside. (2) `proposals/consumer-confidence-2027-12-22.from-consumer-confidence-2027-11-30.json` — the December edition, whose date is **the weakest in this chain and says so**: derived from the 6–8-day pull-forward and from **2021, the only Saturday-Christmas year in the record**, which released **Wed 2021-12-22**, six days before its rule date and three days before Christmas — the same two offsets applied to 2027 both return **Wed 2027-12-22**; honest band **12-20 → 12-23**, weekday not derivable. **TWO MORE FOUND AND DELIBERATELY NOT FILED** because sibling lanes proposed the same ids the same day with equal or better sourcing: `fhfa-hpi-2027-11-30` (from-`fhfa-hpi-2027-10-26`, citing a second FHFA primary this session did not read — note it is the **QUARTERLY** edition, September 2027 + 2027Q3, not October's monthly) and `fomc-2027-12-08` (from-`fomc-2027-10-26`). A duplicate would have been calendar noise; what this lane found about them is recorded here instead — **2027-12-07 is the EARLIEST SEP day-one anywhere in the 2021–2027 panel**, the unique instance at the observed 7th-to-21st floor, which is exactly the one-day margin `FT-consumer-confidence-2027-10-26-2`'s kill switch watches. Nine forward tests registered: **FT-consumer-confidence-2027-11-30-1** through **-9**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-11-30.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
