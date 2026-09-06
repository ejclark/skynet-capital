# Conference Board Consumer Confidence (Feb 2027) — consumer-confidence-2027-02-23

**Kind:** macro-print · **Date:** 2027-02-23 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session against four primary-sourced February editions — 2023-02-28, 2024-02-27, 2025-02-25, 2026-02-24 — every one the last Tuesday of its February, three of them double-sourced by the preceding January edition's own next-release line) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["fhfa-hpi-2027-02-23","japan-cpi-2027-02-19","japan-cpi-tokyo-flash-2027-02-26","opex-2027-02-19"],"screenStreak":0,"blocked":[{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Feb-2022","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Feb-2026","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/press/consumer-confidence-february-2022","status":"200-SERVED-PRESS-INDEX","at":"2026-09-06"},{"url":"https://www.prnewswire.com/news-releases/us-consumer-confidence-declined-in-february-301489556.html","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This id exists to be a control, the control has now been run, and it came back empty —
which retires a question rather than opening one.** The January sibling handed this event forward on a
specific argument: every January Conference Board print since 2021 is also FOMC day one, so nothing
about that release day can be attributed to the survey, and February 2027 — which has no FOMC meeting
at all — keeps the same 9:00/10:00 ET FHFA pairing while dropping the Fed layer. Running it:
**the CB release day is null with the confound and null without it.** Of 68 rule-derived CB days since
2021, **17 collide with an FOMC day** (January 6 of 6 and July 6 of 6, not January alone) and **51 are
clean**; the clean set differs from baseline on **0 of 9** instruments, and clean-versus-collision head
to head is **0 of 9** (SPY median session range **0.910% vs 0.898%, p=0.4529**). Dropping the five
December dates the rule is known to get wrong leaves 0 of 9 with **every p ≥ 0.35**. So the confound was
never load-bearing — the release day has no character to trade either way, which is a stronger and
cheaper stand-aside than "it is unreadable." Second finding, and it is a trap: **February is a wide
month and the print is not why.** All February sessions run **4 of 9** at p<0.05 against the rest of the
year (SPY **1.115 vs 0.968**, p=0.0426; VIX close **19.860 vs 17.875**, p=0.0208), but February CB days
measured against *other February sessions* are **0 of 9** (SPY 1.310 vs 1.115, p=0.5172) — an
independent confirmation, on a different release series and a different instrument set, of exactly the
trap the [FHFA sibling](fhfa-hpi-2027-02-23.md) documented. Third, a correction banked for the January
sibling: its "read the level, never the delta" aid is **not** a January artifact — February restates
January in **4 of 4** sourced editions (**−1.1 / −3.9 / +1.2 / +4.5**), so the rule applies to every
edition. What is genuinely different here is informational, not tradable: unlike January's, this print
lands **in an open Fed communication window** (11 days before `fomc-blackout-start-2027-03-06`) and is
the **only** CB edition between the January 26-27 and March 16-17 meetings. Date **estimate**;
`symbols: []`; **0** macro-keyed playbooks.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-170) | **Stand aside** | High | `symbols: []`, D-170, the February panel does not open for five months, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-02-23** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026, released 08-25**: headline **89.4** (from 90.2), Present Situation **121.2**, Expectations **68.2**, survey period **Aug 3–16**. Market state **2026-09-04**: VIX **14.53**, SPY **770.19**. | The Conference Board naming a February 2027 date other than **2027-02-23** before **2027-02-02**, which breaks the February rule this doc's date rests on |
| This month | **Do not model this release day — the de-confounded control has been run and it is null** | High | n=51 clean (no-FOMC) CB days: **0 of 9** at p<0.05. Clean vs collision head to head: **0 of 9**, SPY **0.910 / 0.898**, p=**0.4529**. December-excluded re-run (n=46): 0 of 9, every p **≥ 0.35**. 14 of 51 clean days exceed the all-session 75th percentile — chance is 25%. | Any of the nine printing p<0.05 for clean CB days on a re-run of the same pipeline after **2027-06-30** |
| This quarter | **If you study a February session, control against February — the month is wide, the print is not** | Medium | All February sessions (n=115) clear p<0.05 on **4 of 9** vs the rest of the year: SPY **1.115 / 0.968** (0.0426), QQQ (0.0473), XRT (0.0241), VIX close **19.860 / 17.875** (0.0208). February CB days vs **other February sessions**: **0 of 9**, SPY 1.310 / 1.115, p=**0.5172**, n=6. | February CB days clearing p<0.05 against other February sessions on a re-run after **2027-06-30**, which would mean the print does contribute after all |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and the release day is measurably null whether or not the Fed is on it.
- **The Conference Board names a February 2027 date** → adopt it verbatim. The rule says **02-23**;
  registered as **FT-consumer-confidence-2027-02-23-1**.
- **Never compare a February session to the annual baseline** — February runs 4 of 9 wide on its own,
  so any February study needs a February control or it will manufacture an effect.
- **Read the level and Expectations, never the month-over-month delta** — February restates January in
  4 of 4 sourced editions (**−1.1 / −3.9 / +1.2 / +4.5**); Feb-2026's "up 2.2 points" was a **+6.7**
  rise against January as first printed.
- **Expectations back above 80** → the Board's own recession threshold, breached since February 2025 and
  at **68.2** in August 2026, clears; the late-cycle framing this series carries dies.
- **Present Situation prints above 120.0** → the four-February slide (**152.8 → 147.2 → 136.5 → 120.0**)
  breaks; registered as **FT-consumer-confidence-2027-02-23-5**.
- **A Fed speaker cites this print between 02-23 and 03-06** → unlike January's, this edition lands in an
  **open** communication window and is the only CB edition between the two meetings; that is the one
  channel by which it could reach the tape, and it belongs to [`fomc-2027-03-17`](fomc-2027-03-17.md).
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **09-16** · CB print **09-29** · CPI **10-14** · FOMC **10-28** · CB print
  **11-24** (est.) · FOMC **12-09** · CB print **12-22** (est., window) · **FOMC 01-27** (est.) ·
  Presidents' Day closure **2027-02-15** (est.) · opex **02-19** (est.) · **FHFA HPI 9:00 ET + this
  print 10:00 ET 02-23** · Tokyo CPI flash **02-26** (est.) · blackout **03-06** (est.) · FOMC
  **03-16/17** (est.).

## Initial research

### The question, plainly

Two sibling lanes proposed this id on the same day for the same structural reason and a different
purpose each. The [January CB ledger](consumer-confidence-2027-01-26.md) called it **the control**: its
central finding is that every January CB print since 2021 is also FOMC day one, so the January release
day cannot be attributed to the survey, and February 2027 has no FOMC meeting while keeping the FHFA
9:00 ET pairing. The [February FHFA ledger](fhfa-hpi-2027-02-23.md) called it **the last confound
standing**: with the Fed gone from its own session, the 10:00 ET CB print becomes the largest remaining
thing on the tape. So: **is the February date sound, does the de-confounded control actually show
anything, and does the CB print deserve the FHFA lane's worry?**

**One-line verdict:** the date is well-sourced for an `estimate` (four primary-sourced Februaries, three
of them double-sourced), and the control comes back **empty in both directions** — the CB release day is
statistically ordinary with the FOMC collision and equally ordinary without it, so the confound the
January lane flagged was never load-bearing, the FHFA lane can stop treating the 10:00 print as a
threat, and this ledger's contribution is a **retired question** plus one trap (February's own width)
that would have fooled the next study.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Sources fetched direct 2026-09-06**, all HTTP 200 and each verified
against its own `Source: <Month> <Year> Consumer Confidence Survey` line and its `Updated:` date rather
than trusted by slug: `conference-board.org/topics/consumer-confidence` (the cadence sentence, the named
next release, the August 2026 values and survey period); the publisher's `CCI-Feb-2023`, `CCI-Feb-2024`,
`CCI-Feb-2025`, `CCI-Jan-2023`, `CCI-Jan-2024`, `CCI-Jan-2025` and `CCI-Mar-2025` pages; and the Board's
own PRNewswire distributions for February 2026 (`us-consumer-confidence-inched-up-in-february-302695754`,
dateline *"NEW YORK, Feb. 24, 2026 /PRNewswire/"*, *"Feb 24, 2026, 10:00 ET"*) and January 2026
(`us-consumer-confidence-fell-sharply-in-january-302671278`, *"Jan. 27, 2026 … 10:00 ET"*). **The FOMC
dates are primary:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, 164,831 bytes,
whose 2021–2026 panels and its `Future Year: 2027` panel (**January 26-27, March 16-17\*, April 27-28,
June 8-9\*, July 27-28, September 14-15\*, October 26-27, December 7-8\***) supply every meeting date
used below; it states *"Each meeting date is tentative until confirmed at the meeting immediately
preceding it."* **Three slugs failed the way the January sibling warned:** `CCI-Feb-2022` and
`CCI-Feb-2026` returned **HTTP 200 while serving the current August 2026 edition** (byte-identical at
332,031), and every `/press/consumer-confidence-february-*` slug returned **HTTP 200 serving the generic
press index** (~437KB regardless of the slug asked for) — a second silent-substitution class, recorded in
`probe-ref.blocked` as `200-SERVED-PRESS-INDEX`. **The tape study is this session's own work and was
built to be falsifiable against the series':** daily OHLC for SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF, TLT
and ^VIX from the Yahoo chart endpoint for 2020-12-01 → 2026-09-05, session range `(high − low) / open`,
two-sided Mann-Whitney U with tie correction. Run first on the 11-24 sibling's own set (the last Tuesday
of every month, 2021-01 → 2026-08, n=68) it **reproduces that ledger's published medians exactly** — SPY
**0.904**, QQQ **1.353**, XLY **1.291**, XRT **1.669**, AMZN **2.169**, AAPL **1.762**, VIX **17.760** —
at p=**0.1785** against its published 0.1843 (a continuity-correction difference on the same medians,
reported rather than smoothed over). That replication is what licenses legs 3–5 as a like-for-like split
of the same set. Market readings are Yahoo daily closes for **2026-09-04**: VIX **14.53**, SPY
**770.19**.

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for February — SUPPORTED four-for-four, and three of the four are
   double-sourced.** The publisher states, fetched today: *"The Conference Board publishes the Consumer
   Confidence Index® at 10 a.m. ET on the last Tuesday of every month."* For December that is refuted on
   five consecutive editions ([12-22 sibling](consumer-confidence-2026-12-22.md) leg 1); for January it
   holds five-for-five ([01-26 sibling](consumer-confidence-2027-01-26.md) leg 1). For February:

   | Edition | Released | Weekday | Last Tuesday of that February | Sources |
   |---|---|---|---|---|
   | Feb 2023 | 2023-02-28 | Tue | 02-28 | the edition's own `Updated: 2023-02-28` **and** `CCI-Jan-2023`'s *"next release is Tuesday, February 28"* |
   | Feb 2024 | 2024-02-27 | Tue | 02-27 | `Updated: 2024-02-27` **and** `CCI-Jan-2024`'s *"Tuesday, February 27th"* |
   | Feb 2025 | 2025-02-25 | Tue | 02-25 | `Updated: 2025-02-25` **and** `CCI-Jan-2025`'s *"Tuesday, February 25th"* |
   | Feb 2026 | 2026-02-24 | Tue | 02-24 | PRNewswire dateline *"Feb 24, 2026, 10:00 ET"*, HTTP 200 |

   **2027-02-23 is the last Tuesday of February 2027.** March is a bonus three-for-three from the same
   fetches (`CCI-Feb-2023` → *"Tuesday, March 28"*; `CCI-Feb-2024` → *"March 26th"*; `CCI-Feb-2025` →
   *"March 25th"*, corroborated by `CCI-Mar-2025`'s own `Updated: 2025-03-25`) — which is what sources
   this PR's one proposal. Registered as **FT-consumer-confidence-2027-02-23-1**.

2. **February 2027 has no FOMC meeting, and February is structurally FOMC-free — SUPPORTED.** The
   Board's `Future Year: 2027` panel runs **January 26-27** then **March 16-17**; there is no February
   meeting. The [FHFA sibling](fhfa-hpi-2027-02-23.md) established the general case from the same
   calendar (zero February day-ones across all 56 posted meeting pairs, exactly one February decision day
   ever, none after February 10, on the arithmetic identity `lastTue(Feb) + 21 days == thirdTue(Mar)`);
   this session verified the 2027 panel independently and reproduces its consequence for the CB series:
   **0 of 6 February CB days since 2021 collide with an FOMC day**, against 17 of 68 overall. Both dates
   are `estimate` and the Fed's own caveat applies; nothing here licenses an entry.

3. **The FOMC collision is a property of four months, not of January — SUPPORTED, and it corrects the
   framing this id inherited.** Splitting the 68 rule-derived CB days against every 2021–2026 FOMC day
   one and decision day:

   | Month | CB days | Colliding | Which |
   |---|---|---|---|
   | January | 6 | **6** | 2021-01-26 · 2022-01-25 · 2023-01-31 · 2024-01-30 · 2025-01-28 · 2026-01-27 |
   | July | 6 | **6** | 2021-07-27 · 2022-07-26 · 2023-07-25 · 2024-07-30 · 2025-07-29 · 2026-07-28 |
   | April | 6 | 3 | 2021-04-27 · 2024-04-30 · 2026-04-28 |
   | October | 5 | 2 | 2023-10-31 · 2025-10-28 |
   | **February** | 6 | **0** | — |
   | all others | 39 | 0 | — |

   **17 of 68, or 25%.** The January sibling's claim is exactly right about January and it is not unique
   to January — **July collides six-for-six as well**, which matters because any future study that
   controls only for January will still be reading a confounded July. In 2027 the colliding prints are
   **01-26, 04-27, 07-27 and 10-26**; **02-23, 03-30, 05-25, 06-29, 08-31, 09-28, 11-30 and 12-28** are
   clean.

4. **The de-confounded control is NULL — SUPPORTED, 0 of 9, and this is the finding.** n=51 clean
   (no-FOMC) CB days, 2021-01 → 2026-08, against every other session in the window:

   | Instrument | Clean CB day (median rel / base) | p |
   |---|---|---|
   | SPY | 0.910 / 0.982 | 0.4083 |
   | QQQ | 1.379 / 1.375 | 0.4930 |
   | XLY | 1.399 / 1.448 | 0.5021 |
   | XRT | 1.678 / 1.841 | 0.3812 |
   | AMZN | 2.154 / 2.276 | 0.4733 |
   | AAPL | 1.731 / 1.862 | 0.4580 |
   | XLF | 1.119 / 1.236 | 0.2613 |
   | TLT | 0.961 / 0.847 | 0.4252 |
   | VIX close | 18.560 / 17.995 | 0.9458 |

   Zero hits, and **no near-miss** — the smallest p is 0.26, where the January sibling's day-one set at
   least produced an XLY 0.0509. SPY close-to-close on a clean CB day runs **+0.090% median, 29 of 51
   up**; **14 of 51** clean days exceed the all-session 75th percentile of SPY range, against a chance
   rate of 25%. **Two robustness checks.** Head to head, clean days versus the 17 collision days are
   **0 of 9** (SPY **0.910 / 0.898**, p=0.4529; largest gap TLT 0.961 / 0.713, p=0.5056) — so the
   collision does not even separate the sets it was supposed to contaminate. And dropping the five
   December dates the rule is **known** to get wrong (the 12-22 sibling's refutation) leaves n=46 at 0 of
   9 with **every p ≥ 0.35** — the null gets cleaner, not weaker, when the bad dates leave.
   **The honest reading:** the January sibling's stand-aside said *the survey's day is unreadable because
   the Fed is on it*. The control says something simpler and stronger — **the day carries no signal to be
   read, Fed or no Fed**. Registered as **FT-consumer-confidence-2027-02-23-2**.

5. **February is a wide month and the print contributes nothing to it — SUPPORTED, and it is the trap
   worth documenting.** Taken naively, February CB days look dramatic: SPY median range **1.310%**
   against an all-session **0.978%**, AMZN 3.224 vs 2.265, VIX close 20.125 vs 17.990. None of it clears
   p<0.05 at n=6 (nearest AAPL 0.0881) — but the reason is not just sample size. **All 115 February
   sessions since 2021** run **4 of 9** significant against the rest of the year:

   | Instrument | February (median rel / base) | p |
   |---|---|---|
   | SPY | **1.115 / 0.968** | **0.0426** |
   | QQQ | **1.589 / 1.370** | **0.0473** |
   | XRT | **2.058 / 1.820** | **0.0241** |
   | VIX close | **19.860 / 17.875** | **0.0208** |
   | XLY · AMZN · XLF · AAPL · TLT | — | 0.0781 → 0.3613 |

   Against **other February sessions**, February CB days are **0 of 9**: SPY 1.310 / 1.115 (p=0.5172),
   QQQ 1.720 / 1.589 (0.6282), VIX close 20.125 / 19.860 (0.6238), nearest AAPL 0.0860. Per-day, the
   width is the regime and not the survey:

   | | 2021-02-23 | 2022-02-22 | 2023-02-28 | 2024-02-27 | 2025-02-25 | 2026-02-24 |
   |---|---|---|---|---|---|---|
   | SPY range % | **2.275** | **2.232** | 0.788 | **0.476** | 1.395 | 1.225 |
   | SPY close-to-close % | +0.12 | −1.07 | −0.37 | +0.19 | −0.50 | +0.73 |
   | VIX close | 23.11 | 28.81 | 20.70 | **13.43** | 19.43 | 19.55 |

   A **4.8× spread** tracking the VIX regime of the day (28.8 vs 13.4), and **2 of 6** days exceed the
   February 75th percentile — chance is 25%. This independently reproduces, on a different release series
   and a different instrument set, the trap the [FHFA sibling](fhfa-hpi-2027-02-23.md) documented for its
   own February release days (VIX range 2.740 vs 1.560, p=0.0445, dying against its February control at
   p=0.3675). Two lanes finding it separately is the reason it belongs in the signals list rather than a
   footnote. Registered as **FT-consumer-confidence-2027-02-23-3**.

6. **The next session shows nothing either — SUPPORTED, and it closes the displacement hypothesis for
   the clean case.** The January sibling's whole hand-off rests on the reaction being *displaced* onto
   FOMC decision day. For a clean print there is nothing to displace onto, and the tape agrees: D+1 after
   the 51 clean CB days is **0 of 9** at p<0.05 (SPY 0.822 / 0.987, p=0.1048; QQQ 1.192 / 1.387,
   p=0.1186; VIX close p=0.8275). One asterisk reported rather than claimed: `|SPY close-to-close|` on
   D+1 runs **0.384% vs 0.562%, p=0.0117** — a *narrower*-than-baseline drift, which is the opposite of
   an event effect and, as one unpre-registered comparison among many, is noted as noise until something
   pre-registers it.

7. **The "read the level, not the delta" aid is a monthly property, not a January artifact — SUPPORTED,
   4 of 4, and it is a correction banked for the January sibling.** That ledger's leg 7 measured
   January's restatement of December (+0.7 / −2.7 / +4.8 / +5.1) and framed it as what makes the *January*
   headline unreadable. The February editions restate January just as reliably:

   | January, as first printed | Restated in the February edition | Revision |
   |---|---|---|
   | Jan 2023 **107.1** (`CCI-Jan-2023`) | Feb-2023 cites **106.0** ("a downward revision") | **−1.1** |
   | Jan 2024 **114.8** (`CCI-Jan-2024`) | Feb-2024 cites **110.9** ("revised downward from the preliminary reading of 114.8") | **−3.9** |
   | Jan 2025 **104.1** (`CCI-Jan-2025`) | Feb-2025's "declined by 7.0 points to 98.3" implies **105.3** | **+1.2** (derived) |
   | Jan 2026 **84.5** (PRNewswire) | Feb-2026 cites **"an upwardly revised 89.0"** | **+4.5** |

   And it does not stop in February: `CCI-Mar-2025`'s *"fell by 7.2 points in March to 92.9"* implies a
   restated February of **100.1** against a first-printed 98.3, **+1.8**. **The consequence is the same
   sentence with a wider scope:** every edition's month-over-month change is partly a measurement of the
   prior month's restatement, so read the **level** and the **Expectations line** against the Board's own
   80.0 threshold in *every* month, not just January. Feb-2026's headline "increased by 2.2 points" was a
   **+6.7** rise against January as first printed. Registered as
   **FT-consumer-confidence-2027-02-23-4**.

8. **The February-on-February level series is a monotone slide, and that is the survey's actual story —
   SUPPORTED.** Sourced February headline / Present Situation / Expectations: **2023** 102.9 / 152.8 /
   69.7 · **2024** 106.7 / 147.2 / 79.8 · **2025** 98.3 / 136.5 / 72.9 · **2026** 91.2 / 120.0 / 72.0.
   Present Situation has fallen in **4 of 4** consecutive Februaries for a cumulative **−32.8 points**,
   and Expectations sat below the Board's own **80.0 recession threshold** in every one of them. The
   August 2026 edition reads **89.4 / 121.2 / 68.2**. **The narrow reading, stated:** this is a
   description of a survey, not a forecast of one, and at D-170 the February 2027 panel has not opened.
   Registered as **FT-consumer-confidence-2027-02-23-5**.

9. **The field window is tight and lands entirely inside an open Fed communication window —
   SUPPORTED, and it is the one place this edition outranks January's.** Sourced cut-offs: **Feb 22**
   (2023) · **Feb 19** (2024) · **Feb 19** (2025) · **Feb 17** (2026), i.e. lags of **6 / 8 / 6 / 7** days
   before release — far tighter than January's 6–11. Applied to a 2027-02-23 release that gives a cut-off
   of **2027-02-15 → 2027-02-17** and a panel of roughly **2027-02-01 → 2027-02-16**, which contains the
   **Presidents' Day** closure (`presidents-day-market-closure-2027-02-15`, estimate) and nothing of
   January. Two structural consequences, both the mirror of January's. The print lands **11 days before**
   `fomc-blackout-start-2027-03-06` (estimate), so unlike the January edition — which prints *inside* the
   blackout and cannot be publicly discussed before 14:00 ET on decision day — **Fed officials can and
   routinely do react to this one**. And it is the **only** CB edition between the January 26-27 and
   March 16-17 meetings, making it the sole consumer read of the intermeeting window. **That raises its
   informational weight and not its tradable weight** — legs 4–6 say the release day is null, and any
   channel to the tape runs through a speaker, which belongs to [`fomc-2027-03-17`](fomc-2027-03-17.md).

10. **Tracked-name sensitivity is nil, and the FHFA lane's worry is answered — SUPPORTED.**
    `symbols: []`. Only **AAPL** and **AMZN** carry direct consumer exposure; neither reports near 02-23,
    and both sit inside leg 4's clean-day null (p=0.4580, p=0.4733). A re-grep of
    `docs/plans/trade-playbooks.md` and [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any macro-
    or sentiment-keyed playbook returns **0 hits** — the single `sentiment` string in
    `trade-playbooks.md:115` is a portfolio weighting input, not a macro-print playbook. **The hand-back:**
    the FHFA proposal called this print "the LARGEST remaining confound" on its own session once the Fed
    is removed. Leg 4 measures that confound at **0 of 9 with no near-miss**, so at daily-bar resolution
    the 10:00 ET CB print is not a threat to the FHFA study — only an intraday 9:00–10:00 ET design could
    ever separate them, and on this evidence there is nothing to separate.

### What the conditions support

**A refusal, a retired question, and a control rule.** The refusal is unchanged and load-bearing:
**nothing is opened, closed or sized off this print** — `symbols: []`, zero macro-keyed playbooks,
D-170. What is *new* is that the refusal got cheaper. The January sibling had to reason around a triple
confound to reach "stand aside"; this ledger measured the de-confounded case directly and found **0 of 9
with no near-miss** (leg 4), **0 of 9** head to head against the collision set, and **0 of 9** on the
following session (leg 6). So the question "what does the CB release day do once the Fed is off it?" is
answered — **nothing** — and no future session needs to re-open it; the standing instruction is simply
that this series' release days are not events. The control rule is the reusable part: **a February
session must be compared to February**, because the month clears p<0.05 on 4 of 9 by itself (leg 5), and
two lanes have now independently walked into that trap. The reading order when the print lands: the
**cut-off date** first (it validates leg 9's window), the **Expectations** level against 80.0 second,
**January's restated value** third — because leg 7 says the delta is partly a revision — and the
headline last.

### Honest limits

**The date is `estimate`.** The CB has not announced February 2027; four sourced Februaries and a stated
rule are strong for an estimate and are not an announcement. **Two Februaries in the tape set are the
rule applied backward** — 2021-02-23 and 2022-02-22 were not separately sourced, because `CCI-Feb-2022`
and `CCI-Feb-2026` served the current edition at HTTP 200 and every `/press/consumer-confidence-february-*`
slug served the press index; Feb-2026's date was recovered from the wire, Feb-2022's was not, so leg 5's
n=6 inherits one unsourced date. **Leg 4 is a null, and a null is not proof of absence** — n=51 with a
Mann-Whitney on daily ranges could miss an effect smaller than roughly a tenth of the baseline median,
and it says nothing whatsoever about the 10:00–10:30 ET window, which no daily bar can see. **Leg 5's
February CB set is n=6** and supports no test; the claim that survives is the *negative* one — the
month is wide, so a February effect must be shown against February. **Leg 6's D+1 close-to-close
p=0.0117 is one unpre-registered comparison among ~20 run here** and is reported as noise on purpose;
had it gone the other way it would have been a finding, which is exactly why it is not one. **Leg 7's
Feb-2025 revision is derived** from stated point-changes rather than quoted, and its Present Situation
implication (**134.3 → 139.9, +5.6**) is the largest single restatement seen in this series and rests on
that derivation. **No February consensus exists and structurally will not** (Conference Board publication
restrictions), so there is no measurable surprise gap to model. And **everything about the February 2027
economy is unknown at D-170** — legs 8 and 9 are about what the series has *been* and what the panel will
have *seen*, and no part of this doc depends on what it prints.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the February 2027 Conference Board edition as
a **medium-impact second-tier print that is regime information and never a trading event**. **No
position is opened, closed or sized off it.** Three things distinguish this stance from its siblings'.
First, **the refusal no longer depends on a confound**: this event was proposed as the de-confounded
control, the control was run, and the CB release day is statistically ordinary **with** the FOMC
collision (17 of 68 days, 0 of 9) and **without** it (51 days, 0 of 9, smallest p 0.26), head to head
(0 of 9, SPY 0.910 / 0.898, p=0.4529), on the following session (0 of 9), and after the five known-bad
December dates are dropped (0 of 9, every p ≥ 0.35). Second, **the collision is a four-month property,
not January's alone** — July collides six-for-six too, so any study controlling only for January is
still reading confounded data. Third, **February's width is the month, not the print**: all February
sessions clear p<0.05 on 4 of 9 against the rest of the year while February CB days against other
February sessions clear **0 of 9**, independently reproducing the [FHFA sibling](fhfa-hpi-2027-02-23.md)'s
own February trap. The one respect in which this edition outranks January's is **informational**: it
lands 11 days before the 03-06 blackout in an open communication window, and is the only CB edition
between the January and March meetings — which is a reason for a Fed speaker to cite it, not a reason to
be positioned for it. Base case for the print itself (**Low** confidence — no consensus exists or will):
**Expectations stays below the Board's own 80.0 recession threshold** (unbroken since February 2025, at
68.2 in August 2026) and **Present Situation prints at or below 120.0**, continuing a four-February slide
of 152.8 → 147.2 → 136.5 → 120.0. Read the level and Expectations; the month-over-month delta is partly a
measurement of January's restatement, which ran −1.1 / −3.9 / +1.2 / +4.5 across the four sourced pairs.
Five predictions are registered in
[`forward-tests/consumer-confidence-2027-02-23.md`](../forward-tests/consumer-confidence-2027-02-23.md).

**Kill switches:**

- **The Conference Board names a February 2027 date other than 2027-02-23** — the February last-Tuesday
  rule breaks despite four contrary editions, and this doc's date confidence collapses to the December
  sibling's. Registered as **FT-consumer-confidence-2027-02-23-1**.
- **Clean (no-FOMC) CB days print any of the nine instruments at p<0.05 on a re-run after 2027-06-30** —
  leg 4's null breaks, the release day becomes something to model after all, and the whole "the confound
  was never load-bearing" claim goes with it. Registered as **FT-consumer-confidence-2027-02-23-2**.
- **The Fed schedules a February 2027 meeting, or moves the March meeting off 16-17** — leg 2's premise
  dies, this event stops being the control it was proposed as, and `fomc-2027-03-17` plus
  `fomc-blackout-start-2027-03-06` both need redating by whichever lane owns them.
- **February CB days clear p<0.05 against OTHER February sessions on that same re-run** — leg 5's
  "the month, not the print" reading breaks and the trap becomes a real effect.
  Registered as **FT-consumer-confidence-2027-02-23-3**.
- **The February 2027 edition restates January 2027's headline by less than 1.0 index point, or states
  no revision at all** — leg 7's generalization of the reading aid weakens and the delta becomes
  readable as news. Registered as **FT-consumer-confidence-2027-02-23-4**.
- **Present Situation prints above 120.0** — the four-February slide breaks and the late-cycle framing
  weakens. Registered as **FT-consumer-confidence-2027-02-23-5**.
- **Expectations back above 80** — the Board's own recession-signal threshold, breached since February
  2025, clears; the late-cycle framing this whole series carries dies.
- **Expectations below ~62** — deterioration accelerating in the only consumer panel between the January
  and March meetings, in a window where Fed officials can speak to it; escalate ahead of the banded pulse.
- **A federal funding lapse runs through the ~02-01→02-16 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1–Nov 12 2025 shutdown ended), and the
  collection-period split becomes the thing to read.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits"
  premise under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-170 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-02-23.json` written this PR** after reading BOTH prior proposals (`from-consumer-confidence-2027-01-26`, `from-fhfa-hpi-2027-02-23`), now inert. **The last-Tuesday rule HOLDS for February, 4 of 4** — 2023-02-28 · 2024-02-27 · 2025-02-25 · 2026-02-24, three double-sourced by the preceding January edition's own next-release line; 2027-02-23 is the last Tuesday of Feb 2027. Fed's `Future Year: 2027` panel verified independently (Jan 26-27, **Mar 16-17**, Apr 27-28, Jun 8-9, Jul 27-28, Sep 14-15, Oct 26-27, Dec 7-8) — **no February meeting**. **Pipeline first reproduced the 11-24 sibling's n=68 medians exactly** (SPY 0.904, QQQ 1.353, XLY 1.291, XRT 1.669, AMZN 2.169, AAPL 1.762, VIX 17.760; p=0.1785 vs its 0.1843). **THE FINDING — the de-confounded control is NULL.** Of 68 rule-derived CB days, **17 collide with an FOMC day and 51 are clean**; collisions are **January 6/6 and July 6/6**, April 3/6, October 2/5, **February 0/6** — so the confound is a four-month property, not January's alone, and any study controlling only for January still reads a confounded July. **Clean CB days (n=51): 0 of 9 at p<0.05, no near-miss** — SPY 0.910/0.982 (0.4083), QQQ 1.379/1.375 (0.4930), XLY 1.399/1.448 (0.5021), XRT 1.678/1.841 (0.3812), AMZN 2.154/2.276 (0.4733), AAPL 1.731/1.862 (0.4580), XLF 1.119/1.236 (0.2613), TLT 0.961/0.847 (0.4252), VIX 18.560/17.995 (0.9458); SPY c2c +0.090% median, 29/51 up; 14/51 above the all-session p75 vs 25% chance. **Head to head clean vs collision: 0 of 9** (SPY 0.910/0.898, p=0.4529). **December-excluded (n=46): 0 of 9, every p ≥ 0.35** — the null cleans up when the five known-bad dates leave. **D+1 after a clean print: 0 of 9** (SPY 0.822/0.987, p=0.1048); one unpre-registered asterisk reported as noise — `|SPY c2c|` 0.384/0.562, p=0.0117, i.e. NARROWER than baseline. **So the January sibling's confound was never load-bearing, and the FHFA lane's "largest remaining confound" worry is answered at 0 of 9.** **THE TRAP — February is a wide MONTH and the print is not why:** all 115 Feb sessions run **4 of 9** vs the rest of the year (SPY **1.115/0.968 p=0.0426**, QQQ 1.589/1.370 (0.0473), XRT 2.058/1.820 (**0.0241**), VIX close **19.860/17.875 p=0.0208**), but Feb CB days vs **other Feb sessions** are **0 of 9** (SPY 1.310/1.115, p=0.5172, n=6) — independently reproducing the FHFA sibling's own February control failure on a different series and instrument set. Per-day Feb CB SPY ranges 2.275/2.232/0.788/0.476/1.395/1.225, a 4.8× spread tracking VIX regime (28.81 → 13.43). **Revision finding generalizes the January sibling's leg 7:** February restates January **4 of 4** — Jan-2023 107.1→106.0 (−1.1) · Jan-2024 114.8→110.9 (−3.9, stated) · Jan-2025 104.1→105.3 (+1.2, derived) · Jan-2026 84.5→**89.0** (+4.5) — and March-2025 restates February by +1.8, so the "read the level, never the delta" aid is a MONTHLY property, not a January artifact; Feb-2026's "up 2.2 points" was **+6.7** against January as first printed. **Feb-on-Feb levels:** 102.9/152.8/69.7 · 106.7/147.2/79.8 · 98.3/136.5/72.9 · 91.2/120.0/72.0 — Present Situation down 4 of 4 for **−32.8 points**, Expectations below 80.0 in all four. **Cut-offs are tight** — Feb 22/19/19/17, lags 6/8/6/7 → a 2027 window of ~02-01→02-16 closing 02-15/17, containing Presidents' Day 02-15 and **11 days before blackout 03-06**, so unlike January this print lands in an OPEN communication window and is the ONLY CB edition between the Jan 26-27 and Mar 16-17 meetings — informational weight up, tradable weight unchanged. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53**, SPY **770.19** (2026-09-04 closes) — baseline set. **Geopolitical:** unchanged from siblings. **Event tape:** no February consensus exists or is publishable (CB publication restrictions). **Sourcing failures:** `CCI-Feb-2022` and `CCI-Feb-2026` returned **HTTP 200 serving the current August 2026 edition** (332,031 bytes) and every `/press/consumer-confidence-february-*` slug returned **HTTP 200 serving the generic press index** (~437KB) — a second substitution class, recorded as `200-SERVED-PRESS-INDEX`; Feb-2026's date rests on the PRNewswire dateline, Feb-2022's is unsourced. **New dated adjacency → ONE proposal filed:** `proposals/consumer-confidence-2027-03-30.from-consumer-confidence-2027-02-23.json` — the next edition, sourced three-for-three for March from this session's own fetches, and the replication instance for leg 4 (the second consecutive clean print). **Corridor:** Presidents' Day **02-15** · VIX expiry **02-17** · Japan CPI + opex **02-19** · **FHFA HPI 9:00 ET + this print 10:00 ET 02-23** · Tokyo CPI flash **02-26** · blackout **03-06** · **FOMC 03-16/17**. Five forward tests registered: **FT-consumer-confidence-2027-02-23-1/-2/-3/-4/-5**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-02-23.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
