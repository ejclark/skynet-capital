# Conference Board Consumer Confidence (June 2027) — consumer-confidence-2027-06-29

**Kind:** macro-print · **Date:** 2027-06-29 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session 4-of-4 for June — 2022-06-28, 2023-06-27, 2024-06-25 off their own editions and 2025-06-24 off the May-2025 next-release line — with two of the three editions double-sourced by the preceding May) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["fomc-minutes-2027-06-30"],"screenStreak":0,"blocked":[{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-June-2021","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-June-2025","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-June-2026","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-May-2026","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.lseg.com/en/ftse-russell/index-reconstitution","status":"404","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This print was filed to test whether the Fed talks to the consumer, and the honest answer is
that the tape cannot answer it — but the session found something better on the way.** The proposal's
geometry survives in substance and fails in its strict form: the June 2027 dot plot lands **06-08/09**, the
**earliest June FOMC in the record** and 20 days before this print against a modal 13, so **76% of the
panel (13 of 17 days) post-dates it** versus **35%** in five of the six tape years and **0%** in 2025 — but
the window **opens two to three days *before* the decision**, not after, because June's own sourced cut-off
lags are **6/7/6 days**, the *shortest* in the chain, not the ~8 the proposal borrowed from May. **The
transmission test itself is content-level and cannot be run from price data:** clean CB days split by
post-decision panel share are **0 of 9**, and split by SEP-vs-non-SEP prior decision **0 of 9**. It is
registered as a reading rule on the June 2027 edition's own text instead. **The finding that does carry —
and it applies to this whole calendar, not just this print — is that QUARTER-END IS A REAL REGIME AND
MONTH-END IS NOT.** The last four sessions of a quarter-end month run **6 of 9 narrower** against all
non-month-end sessions (XRT **p=0.0011**, XLF 0.0064, QQQ 0.0125, SPY 0.0179, XLY 0.0254, AMZN 0.0295;
**n=96 vs 1,167**) and **5 of 9** against the last four of an *ordinary* month — while ordinary month-end
against everything else is **0 of 9**. **2027-06-29 sits one session before quarter end, inside that
window** — the first print in this chain placed in a *measured* regime rather than a null one. It also
**confounds the chain's December redirect**: December's 7-of-9 signature collapses to **0 of 9** once the
quarter-end sessions are removed. Date **estimate**; `symbols: []`; **0** macro-keyed playbooks; the print
day itself is **0 of 9** on every control.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-296) | **Stand aside** | High | `symbols: []`, D-296, the June panel does not open for nine months, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits**. Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-06-29** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026, released 08-25**: headline **89.4**, Present Situation **121.2**, Expectations **68.2**, survey period **Aug 3–16**, cut-off **Aug 16**; the page names **2026-09-29** as the next release. Market state **2026-09-04**: VIX **14.53**, SPY **770.19**. | The Conference Board naming a June 2027 date other than **2027-06-29** before **2027-06-01**, which breaks the June rule this doc's date rests on |
| This month | **Stop scanning "last five sessions of the month" — the variable is QUARTER-end, and month-end alone is nothing** | Medium | Quarter-end last-4 vs all non-month-end: **6 of 9 narrower** (n=96, XRT p=0.0011). Ordinary month-end last-4 vs the same: **0 of 9** (n=184). Head to head, quarter-end vs ordinary month-end: **5 of 9** (AMZN p=0.0057). | Ordinary-month-end last-4 sessions clearing p<0.05 on 2+ of 9 against non-month-end sessions, or quarter-end last-4 falling below 3 of 9, on a re-run of the same pipeline after **2027-12-31** |
| This quarter | **Re-aim the week-level control rule at quarter-end, not at December's calendar position** | Medium | December's **7 of 9** last-5-vs-earlier signature drops to **0 of 9** with the quarter-end sessions removed (n=6); March's holds at **4 of 9** (AMZN p=0.0095). The pooled quarter-end result at n=96 is what carries the claim; the n=6 exclusion arms are weak both ways. | Dec last-5-excluding-last-4 clearing p<0.05 on 3+ of 9, or the quarter-end-vs-ordinary-month-end control falling to 0 of 9, on a re-run after **2027-12-31** |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and the print day is null against every control run here (0 of 9, three ways).
- **The Conference Board names a June 2027 date** → adopt it verbatim. The rule says **06-29**;
  registered as **FT-consumer-confidence-2027-06-29-1**.
- **Control for quarter-end, not for month-end**, on every calendar study this repo runs. Registered as
  **FT-consumer-confidence-2027-06-29-2**.
- **December's position signature is a quarter-end signature** — re-aim the 03-30 week-level rule's
  outstanding test. Registered as **FT-consumer-confidence-2027-06-29-3**.
- **Do not read June as a month; read it as summer.** Jun+Jul+Aug vs the rest of the year is **9 of 9**
  narrower; June vs Jul+Aug is **2 of 9**. Registered as **FT-consumer-confidence-2027-06-29-4**.
- **Read the June edition's stated cut-off date first** — June's own lags are **6 / 7 / 6** days, the
  shortest in the chain, putting a 2027 cut-off at **06-22 → 06-23**. Registered as
  **FT-consumer-confidence-2027-06-29-5**.
- **The Fed-to-sentiment channel is a text test, not a tape test.** No sourced edition in this chain has
  ever attributed a month-over-month move to an FOMC decision, while `CCI-May-2025` does exactly that for
  a dated tariff announcement. Registered as **FT-consumer-confidence-2027-06-29-6**.
- **Read the level, never the month-over-month delta** — June restates May in 2 of 2 fully-sourced
  editions, and `CCI-June-2023` carries the chain's **first zero revision** (Expectations 71.5 → 71.5).
  Registered as **FT-consumer-confidence-2027-06-29-7**.
- **Expectations back above 80** → the Board's own recession threshold clears. June 2023's **79.3** is the
  closest approach any sourced edition in this chain has made. Registered as
  **FT-consumer-confidence-2027-06-29-8**.
- **The FOMC minutes land the next session, 2027-06-30** — the first time this chain has a tracked event
  one day after a CB print. Registered as **FT-consumer-confidence-2027-06-29-9**.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **2026-09-16** · CB print **2026-09-29** · CPI **2026-10-14** · FOMC
  **2026-10-28** · CB print **2026-11-24** (est.) · FOMC **2026-12-09** · CB print **2026-12-22** (est.) ·
  **FOMC 2027-01-27** (est.) · **FOMC + SEP 2027-03-17** (est.) · CB print + FOMC day one **2027-04-27**
  (est.) · CB print **2027-05-25** (est.) · blackout begins **2027-05-29** (est.) · **FOMC + SEP day one
  2027-06-08, decision 06-09** (est.) · opex **2027-06-17** (est.) · Juneteenth closure **2027-06-18**
  (est.) · **this print 2027-06-29** (est.) · **FOMC minutes 2027-06-30** (est., proposed this PR) ·
  **CB print + FOMC day one 2027-07-27** (est., proposed this PR).

## Initial research

### The question, plainly

The [May sibling](consumer-confidence-2027-05-25.md) filed this id for two jobs. The first is the
headline one: this is meant to be **the chain's first clean SEP-collision test** — the first edition whose
field window "opens AFTER a dot-plot release and closes well before the next meeting," and therefore
"where a Fed-to-sentiment transmission channel would show up if one exists." The second is a
position-in-month job: June was offered as **May's opposite case**, 1 of 9 against May's 0 of 9, so that
the pair "brackets the flat end of the rule's scope condition."

So: **is the June date sound, is the geometry really what the proposal described, can the transmission
claim be tested at all, and is June actually the bracket it was filed as?** And — the question the
proposal did not ask, because every sibling before it has asked about the Fed — **what else is
structurally true of the last Tuesday of June?**

**One-line verdict:** the date is the best-sourced in the chain (4 of 4, two double-sourced), the geometry
is real but **2.2× rather than near-total** and its strict form is refuted, the transmission test **cannot
be run from price data at all** and is re-registered as a reading rule on the edition's own text, the
bracket framing is **wrong on both sides** — June is not a flat month, it is a member of a 9-of-9 summer
block — and the structural feature nobody had looked for is **quarter-end**, which is a real, well-powered
regime, which this print sits inside, and which turns out to be carrying the December signature the chain
was about to go test as a position-in-month effect.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Publisher sources fetched direct 2026-09-06**, all HTTP 200 and each
verified against its own `Source: <Month> <Year> Consumer Confidence Survey` line and its `Updated:` stamp
rather than trusted by slug: `conference-board.org/topics/consumer-confidence` (the cadence sentence, the
named next release, the August 2026 values, 332,031 bytes) and the publisher's `CCI-June-2022`,
`CCI-June-2023`, `CCI-June-2024`, `CCI-May-2023`, `CCI-May-2024` and `CCI-May-2025` pages. **The FOMC
dates and the minutes convention are primary:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`,
HTTP 200, **164,831 bytes** — byte-identical to the April and May siblings' fetches — parsed in full
including the `Future Year: 2027` panel and all 45 published minutes-release dates. **Four Conference
Board slugs failed the way every sibling warned:** `CCI-June-2021`, `CCI-June-2025`, `CCI-June-2026` and
`CCI-May-2026` each returned **HTTP 200 while serving the current August 2026 edition** (byte-identical at
332,031), recorded in `probe-ref.blocked` as `200-SERVED-CURRENT-EDITION`. One reconnaissance fetch of
LSEG's FTSE Russell reconstitution page returned **404** and is recorded; **no Russell event is proposed
from this session, because no primary source for its date was obtained.**

**The tape.** Equity and ETF daily OHLC from **stockanalysis.com** and VIX from **CBOE's own
`VIX_History.csv`** — the same vendor pair the April and May siblings were forced onto after Yahoo
rate-limited this runner, which makes this session's numbers directly comparable to theirs. SPY, QQQ, XLY,
XRT, AMZN, AAPL, XLF, TLT and VIX for **2020-12-01 → 2026-09-04** (n=**1,447** sessions — the April and
May siblings' count exactly), session range `(high − low) / open`, two-sided Mann-Whitney U with tie
correction, VIX measured on close. CB days are the **68** rule-derived last Tuesdays from 2021-01 to
2026-08, the siblings' window. Market readings: **2026-09-04 closes, SPY 770.19 and VIX 14.53.**

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for June — SUPPORTED four-for-four, and this is the best-sourced month
   in the chain.** The publisher states, fetched today: *"The Conference Board publishes the Consumer
   Confidence Index® at 10 a.m. ET on the last Tuesday of every month."* For December that is refuted on
   five consecutive editions ([12-22 sibling](consumer-confidence-2026-12-22.md) leg 1); January holds
   five-for-five, February four-for-four, March and April three-for-three, May three-for-three. For June:

   | Edition | Released | Weekday | Last Tuesday of that June | Sources |
   |---|---|---|---|---|
   | June 2022 | 2022-06-28 | Tue | 06-28 | the edition's own `Updated : 2022-06-28` (May-2022 is blocked, so single-sourced) |
   | June 2023 | 2023-06-27 | Tue | 06-27 | `Updated : 2023-06-27` **and** `CCI-May-2023`'s *"The next release is Tuesday, June 27 at 10 AM ET"* |
   | June 2024 | 2024-06-25 | Tue | 06-25 | `Updated : 2024-06-25` **and** `CCI-May-2024`'s *"Tuesday, June 25th"* |
   | June 2025 | 2025-06-24 | Tue | 06-24 | `CCI-May-2025`'s *"Tuesday, June 24th"* only — the June-2025 edition served the current edition |

   **2027-06-29 is the last Tuesday of June 2027.** July is a bonus three-for-three from the same fetches
   (`CCI-June-2022` → *"Tuesday, July 26"*; `CCI-June-2023` → *"Tuesday, July 25"*; `CCI-June-2024` →
   *"Tuesday, July 30th"*) — which is what sources one of this PR's two proposals. Registered as
   **FT-consumer-confidence-2027-06-29-1**.

2. **The pipeline replicates the April and May siblings EXACTLY, 9 of 9 — and this is what licenses
   everything below.** On the identical window the 68 rule-derived CB days split **51 clean / 17
   colliding**, the collisions are **17 day-ones and 0 decision days**, and the clean set's medians
   reproduce the published table **to three decimals on all nine instruments**: SPY **0.911**, QQQ
   **1.379**, XLY **1.397**, XRT **1.687**, AMZN **2.154**, AAPL **1.731**, XLF **1.119**, TLT **0.961**,
   VIX close **18.560** — **0 of 9**, smallest p XLF **0.2713**. Clean-day SPY close-to-close is
   **+0.090% median, 29 of 51 up**, character-for-character the February, April and May siblings' figure.

   **A THIRD parser trap, and it is nastier than the two already banked.** The May sibling warned that the
   Fed calendar's cross-month meetings carry **abbreviated** labels (`Jan/Feb 31-1`, `Apr/May 30-1`,
   `Oct/Nov 31-1`) and that a full-month-name regex fabricates a nonexistent 2024-05-30 meeting. This
   session reproduced that exactly — and then hit a second, independent failure on the same page. The
   calendar renders consecutive meetings as `…|September|15-16*|October|27-28|…`, **sharing one delimiter
   between them**, so a non-overlapping scan consumes the `|` that the next entry needs as its own opening
   boundary and **silently drops every second meeting**: 49 of 56 parsed, every January missing, and a
   collision split of **58 clean / 11 colliding** that looks entirely plausible on its own. Requiring a
   *lookahead* rather than a consumed trailing delimiter restores all 56. **The standing rule for any lane
   parsing that page: assert 8 meetings per year and 17 collisions before trusting anything downstream** —
   both traps produce a wrong answer that does not look wrong.

   **A correction to a sibling's prose, recorded rather than edited.** The May sibling's ledger lists the
   Fed's 2027 January meeting as **01-25/26**. The page says **January 26-27**; the string `January 25-26,
   2028` appears on the same page in the trailing note about the *following* year, which is the likely
   source. This repo's own `src/domain/market-events/fomc-2027-01-27.json` already carries the correct
   decision day, so nothing downstream is wrong — and ledger rows are append-only, so the May row stands
   as written and this is the receipt.

3. **THE GEOMETRY — the proposal's substance is SUPPORTED at 2.2×, and its strict form is REFUTED.** The
   Fed's posted 2027 calendar runs **January 26-27, March 16-17\*, April 27-28, June 8-9\*, July 27-28,
   September 14-15\*, October 26-27, December 7-8\***. The June 2027 meeting is the **earliest June FOMC
   in the whole 2021-2027 record**, and that is the entire source of this print's unusual geometry:

   | Year | June decision day | June CB print | Gap | Rule-derived panel | Post-decision share |
   |---|---|---|---|---|---|
   | 2021 | 06-16\* | 2021-06-29 | 13d | 06-06 → 06-22 | 6/17 = **35%** |
   | 2022 | 06-15\* | 2022-06-28 | 13d | 06-05 → 06-21 | 6/17 = **35%** |
   | 2023 | 06-14\* | 2023-06-27 | 13d | 06-04 → 06-20 | 6/17 = **35%** |
   | 2024 | 06-12\* | 2024-06-25 | 13d | 06-02 → 06-18 | 6/17 = **35%** |
   | 2025 | 06-18\* | 2025-06-24 | 6d | 06-01 → 06-17 | 0/17 = **0%** |
   | 2026 | 06-17\* | 2026-06-30 | 13d | 06-07 → 06-23 | 6/17 = **35%** |
   | **2027** | **06-09\*** | **2027-06-29** | **20d** | **06-06 → 06-22** | **13/17 = 76%** |

   **So the proposal was right that 2027 is the sharpest instance and wrong about its shape.** It claimed
   the field window "opens AFTER a dot-plot release." It does not: the window opens **06-06**, two to
   three days *before* the 06-09 decision, which lands *inside* it. The reason is leg 5 — the proposal
   projected the window from *May's* 8-day lag, and June's own lags are shorter, which moves the window
   **later** and therefore back across the decision. The honest number is **76% against a modal 35%**,
   the highest in the sample by a factor of 2.2, and **2025 is the natural low control at 0%**. That is a
   three-level natural experiment with **n=1 at each extreme**, which is an observation series, not a test.

4. **AND THE TRANSMISSION CHANNEL CANNOT BE TESTED FROM THE TAPE AT ALL — 0 of 9, both ways.** The
   proposal's claim is about what the *panel reports*, not about what the market does on release day, and
   the two proxies price data can offer are both null:

   | Comparison | Result | SPY | smallest p |
   |---|---|---|---|
   | Clean CB days, panel ≥75% post-decision vs <75% (n=29 vs 22) | **0 of 9** | 1.010 / 0.747, p=0.3368 | AAPL 0.2578 |
   | Clean CB days, nearest prior decision was a SEP meeting vs not (n=28 vs 23) | **0 of 9** | 0.843 / 0.911, p=0.7983 | AAPL 0.1529 |

   **The measurement that would settle it is the edition's own text, and it is checkable.** In the whole
   sourced record of this chain, **no Conference Board edition has ever attributed a month-over-month move
   to an FOMC decision** — while `CCI-May-2025` attributes one, explicitly and with a date, to the May 12
   tariff announcement, and discloses the intra-panel split that produced it. That asymmetry is the actual
   prior on Fed-to-sentiment transmission, and 2027's 76% panel is the sharpest chance the chain will have
   to overturn it. Registered as **FT-consumer-confidence-2027-06-29-6**, as a reading rule rather than a
   bet. `CCI-June-2022` does discuss the Fed (*"as the Fed aggressively raises interest rates"*) — that is
   forward commentary about the rate path, not an attribution of the panel's move to a dated decision, and
   the forward test is worded to keep the two apart.

5. **June's cut-off lags are the SHORTEST in the chain — SUPPORTED, and this is what corrects leg 3.**
   The proposal projected 2027's field window from May's sourced lags. June's own, read off the three
   sourced editions:

   | Edition | Released | Stated cut-off | Lag |
   |---|---|---|---|
   | June 2022 | 2022-06-28 | *"cutoff date for the preliminary results was June 22"* | **6 days** |
   | June 2023 | 2023-06-27 | *"cutoff date for the preliminary results was June 20"* | **7 days** |
   | June 2024 | 2024-06-25 | *"cutoff date for the preliminary results was June 19"* | **6 days** |

   Against May's **8/7/8** and April's **6/6/8**, that settles a method question the chain had been
   answering by convenience: **the lag varies by month and must not be borrowed across months.** Applied
   to 2027-06-29 the cut-off is **06-22 or 06-23**, and with the sixteen-day field length `CCI-Apr-2023`
   states explicitly, the window is **06-06 → 06-22/23**. Registered as
   **FT-consumer-confidence-2027-06-29-5**.

6. **THE FINDING — quarter-end is a real, well-powered regime, and ordinary month-end is nothing.** Every
   sibling in this chain has controlled a CB print against *its month* and *its week of the month*. Nobody
   asked what a **quarter boundary** does. It does a great deal, and month-end alone does not:

   | Comparison | Result | SPY | smallest p |
   |---|---|---|---|
   | Last 4 sessions of a **quarter-end month** vs all non-month-end sessions (n=96 vs 1,167) | **6 of 9 narrower** | 0.830 / 0.972, p=**0.0179** | XRT **0.0011** |
   | Last 4 sessions of an **ordinary month** vs the same (n=184 vs 1,167) | **0 of 9** | 1.014 / 0.972, p=0.7670 | AMZN 0.1313 |
   | Quarter-end last-4 vs **ordinary-month** last-4 (n=96 vs 184) | **5 of 9 narrower** | 0.830 / 1.014, p=**0.0410** | AMZN **0.0057** |

   The full quarter-end row: XRT **0.0011**, XLF **0.0064**, QQQ **0.0125**, SPY **0.0179**, XLY
   **0.0254**, AMZN **0.0295**; AAPL 0.1787, TLT 0.6901, VIX 0.1377. **XRT survives a Bonferroni
   correction across the nine instruments (0.05/9 = 0.0056) and XLF sits on its edge** — the rest do not,
   and are reported as a consistent direction rather than as nine independent findings. **And this print
   sits inside that window:** June 2027's sessions run 06-24, 25, 28, 29, 30, so **2027-06-29 is one
   session before quarter end**, in the last four. That makes it the first print in this chain placed in a
   regime the tape actually measures, rather than in a null. Registered as
   **FT-consumer-confidence-2027-06-29-2**.

7. **AND IT CONFOUNDS THE CHAIN'S DECEMBER REDIRECT — the variable is the quarter boundary, not the
   position in the month.** The [May sibling](consumer-confidence-2027-05-25.md) measured last-5-vs-earlier
   across all twelve months, found December at **7 of 9 all narrowing late**, and sent the
   [March rule](consumer-confidence-2027-03-30.md)'s outstanding test there. This session reproduces that
   scan exactly — Dec 7, Mar 6, Jan/Feb/Apr 2, Jun/Aug/Nov 1, May/Jul/Sep/Oct 0, with June's single hit
   being **XRT p=0.0172** (the proposal quoted 0.0170 from its own run). Then it removes the quarter-end
   sessions:

   | Scan | Result | smallest p |
   |---|---|---|
   | December last-5 vs earlier December (n=30 vs 98) | **7 of 9 narrowing late** | XLF **0.0010** |
   | December last-5 **excluding the last 4** vs earlier December (n=6 vs 98) | **0 of 9** | AMZN 0.0608 |
   | March last-5 **excluding the last 4** vs earlier March (n=6 vs 102) | **4 of 9 narrowing late** | AMZN **0.0095** |

   **December's signature is carried entirely by the quarter-end sessions; March's is not.** The honest
   reading is narrow: the exclusion arms are **n=6**, so a null there is weak evidence on its own — what
   carries the claim is the **n=96 pooled quarter-end result** in leg 6, which is independent of December
   and of any single month. Together they say the chain has been scanning the wrong variable: **the
   control the 03-30 rule needs is quarter-end-vs-ordinary-month-end, not last-5-vs-earlier**, and
   December is a good site for it only because December is a quarter. Registered as
   **FT-consumer-confidence-2027-06-29-3**.

8. **June is not a flat month and not a June effect — it is SUMMER, and the bracket framing fails on both
   sides.** The proposal offered June as May's opposite case. Neither half of that survives:

   | Comparison | Result | SPY | smallest p |
   |---|---|---|---|
   | **June vs rest of year** (n=124 vs 1,323) | 1 of 9 | 0.880 / 0.985, p=0.0724 | **VIX 0.0001** |
   | **Jun+Jul+Aug vs rest of year** (n=383 vs 1,064) | **9 of 9 narrower** | 0.873 / 1.031, p=**0.0000** | VIX **0.0000** |
   | **June vs July+August** (n=124 vs 259) | 2 of 9 | 0.880 / 0.871, p=0.3089 | AMZN 0.0418 |

   June's lone month-level hit is a **VIX level** reading (median 16.695 vs 18.310) — and July (16.500)
   and August (16.260) are lower still, so it is not a June property, it is the summer block leaking
   through a badly-drawn boundary. Inside that block June is indistinguishable from its neighbours.
   Meanwhile May, the month the proposal paired it with, is **0 of 9 and sits outside the block** — so the
   two are not opposite ends of one scale, they are on different scales. Registered as
   **FT-consumer-confidence-2027-06-29-4**.

9. **The June print day itself is null on every control — SUPPORTED, 0 of 9 three ways, and the
   directional result is declined.** The six June CB days on the tape:

   | Control | Result | SPY | smallest p |
   |---|---|---|---|
   | vs **other June** sessions (month-level, n=6 vs 118) | **0 of 9** | 0.848 / 0.880, p=0.7665 | AMZN 0.2419 |
   | vs **other late-June** sessions (week-level, n=6 vs 24) | **0 of 9** | 0.848 / 0.757, p=0.8969 | AMZN 0.0824 |
   | vs all other sessions (n=6 vs 1,441) | **0 of 9** | 0.848 / 0.970, p=0.4941 | XRT 0.2135 |

   Month-level and week-level agree, as the March rule predicts. **The directional result is the one to
   refuse:** June CB days run SPY **+0.582% close-to-close, 5 of 6 up**, against +0.135% on other
   late-June sessions — a number that would read well in a headline and does not survive its own test
   (**p=0.4522** vs late-June, 0.2867 vs other June, 0.2947 vs all). This is the third month in a row the
   chain has produced a large-looking directional figure and declined it — April's −1.035% at p=0.0183,
   May's +0.054% at p=1.0000, June's +0.582% at p=0.4522 — and the pattern of *signs* across them
   (negative, flat, positive) is itself the argument that none of the three is a seasonal artifact.

   | | 2021-06-29 | 2022-06-28 | 2023-06-27 | 2024-06-25 | 2025-06-24 | 2026-06-30 |
   |---|---|---|---|---|---|---|
   | SPY range % | 0.334 | **3.237** | 1.140 | 0.507 | 0.735 | 0.962 |
   | SPY close-to-close % | +0.054 | **−2.043** | +1.096 | +0.385 | +1.105 | +0.779 |
   | VIX close | 16.02 | **28.36** | 13.74 | 12.84 | 17.48 | 16.45 |
   | Post-decision panel share | 35% | 35% | 35% | 35% | **0%** | 35% |

10. **The revision rule extends to a sixth consecutive month — SUPPORTED 2 of 2, and it produces the
    chain's first ZERO revision.** January's sibling measured it on January, February's on February, and
    so on through May. June restates May:

    | May, as first printed | Restated in the June edition | Revision |
    |---|---|---|
    | May 2022 (first print not sourced this session — `CCI-May-2022` is blocked) | `CCI-June-2022`: *"down 4.5 points from 103.2 in May"*, PS *"from 147.4 last month"*, Exp *"from 73.7"* | not computable |
    | May 2023 **102.3 / 148.6 / 71.5** | `CCI-June-2023`: *"up from 102.5 in May"*, PS *"from 148.9 last month"*, Exp *"from 71.5 in May"* | +0.2 / +0.3 / **0.0** |
    | May 2024 **102.0 / 143.1 / 74.6** | `CCI-June-2024`: *"down from 101.3 in May"*, PS *"from 140.8 last month"*, Exp *"from 74.9 in May"* | **−0.7** / **−2.3** / +0.3 |

    The headline is restated by a nonzero amount in both computable cases, so the reading rule holds. But
    **`CCI-June-2023` restates May's Expectations at 71.5 — identical to May's first print, the first
    zero revision this chain has measured** on any component. The May sibling's framing ("restates by a
    nonzero amount") therefore survives at the headline and **fails at the sub-index**, which matters
    because Expectations is the component every kill switch in this series keys on. Registered as
    **FT-consumer-confidence-2027-06-29-7**.

11. **June-on-June levels, and the closest approach to the 80 threshold in the chain — SUPPORTED.**
    Sourced June headline / Present Situation / Expectations: **2022** 98.7 / 147.1 / 66.4 · **2023**
    109.7 / 155.3 / 79.3 · **2024** 100.4 / 141.5 / 73.0. Expectations sat **below the Board's own 80.0
    recession threshold in all three** — but `CCI-June-2023`'s **79.3** is the nearest any sourced
    edition in this whole chain has come, and the Board said so itself: *"June's reading was just a shade
    below 80 and up sharply from last month's print."* That edition also carried the highest headline in
    the sourced record (**109.7**, *"its highest level since January 2022"*), and `CCI-June-2024` notes
    Expectations had then been below 80 *"for five consecutive months."* The August 2026 edition reads
    **89.4 / 121.2 / 68.2**. **The narrow reading, stated:** this describes what the survey has been, not
    what it will print, and at D-296 the June 2027 panel has not opened. Registered as
    **FT-consumer-confidence-2027-06-29-8**.

12. **The corridor is empty of tracked events today and should not be — SUPPORTED, and the fix is one of
    this PR's proposals.** No event in `src/domain/market-events/` sits within five days of 2027-06-29;
    the nearest are `opex-2027-06-17` (12 days before) and `juneteenth-market-closure-2027-06-18` (11
    before). But the Fed's own page states the convention — *"The minutes of regularly scheduled meetings
    are released three weeks after the date of the policy decision"* — and **42 of the 45 published
    minutes dates it lists sit exactly 21 days after their own decision day**, the three exceptions all
    holiday-shifted in late November or December (2023-11-01 → 11-21, 2024-11-07 → 11-26, 2025-12-10 →
    12-30). The rule reproduces every `fomc-minutes-*` entry this calendar already carries. **2027-06-09 +
    21 days = Wednesday 2027-06-30 — the session immediately after this print**, and also the quarter's
    last session. That is the first time in this chain that a tracked event lands one day after a CB
    edition, and it is proposed in this PR. Registered as **FT-consumer-confidence-2027-06-29-9**.

13. **Tracked-name sensitivity is nil — SUPPORTED.** `symbols: []`. Only **AAPL** and **AMZN** carry
    direct consumer exposure; neither reports near 06-29, and both sit inside leg 2's clean-day null
    (AAPL p=0.4354, AMZN p=0.5313). A re-grep of `docs/plans/trade-playbooks.md` and
    [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any macro- or sentiment-keyed playbook returns
    **0 hits** — the single `sentiment` string at `trade-playbooks.md:115` is a portfolio weighting input,
    not a macro-print playbook.

### What the conditions support

**A refusal, a test that had to be re-specified, and one finding that reaches past this event.** The
refusal is unchanged and load-bearing: **nothing is opened, closed or sized off this print** — `symbols:
[]`, zero macro-keyed playbooks, D-296, and the print day null on every control. What is new is that this
ledger discharges its assigned job by **failing it honestly**. The SEP-collision test the proposal filed
this id for is not a tape test and never could have been: the claim is about what a survey panel reports
after a dot plot, and price data answers 0 of 9 on both proxies available to it. Re-specified as a reading
rule on the June 2027 edition's own text, it becomes checkable and cheap — and it has a real prior, since
no edition in this chain's sourced record has ever attributed a move to an FOMC decision while one
attributes a move to a dated tariff announcement in detail. The geometry survives at **76% versus a modal
35%**, which is worth having, and the strict form is corrected. **The finding that reaches past this event
is quarter-end.** It is well-powered (n=96), it is directionally consistent across six of nine
instruments, it is absent from ordinary month-end, this print sits inside it, and it explains a signature
the chain had already decided to go chase under a different name. The reading order when the print lands:
the **cut-off date** first (leg 5 — June's own lags are 6/7/6, and a cut-off before 06-20 would mean the
panel was drawn earlier than the record supports), **whether the edition's text names the June 8-9 FOMC**
second (leg 4 — the transmission test, and the reason this id exists), **May's restated values** third
(leg 10 — the delta is partly a revision, and Expectations came back unrevised once already), the
**Expectations** level against 80.0 fourth, and the headline last.

### Honest limits

**The date is `estimate`.** The CB has not announced June 2027; four verified Junes and a stated rule are
strong for an estimate and are not an announcement. **Two of the six June CB dates in the tape set are the
rule applied backward** — 2021-06-29 and 2026-06-30 were not separately sourced, because `CCI-June-2021`
and `CCI-June-2026` returned HTTP 200 while serving the current August 2026 edition; 2025-06-24 is
single-sourced off the May edition. **The tape vendor is stockanalysis.com plus CBOE**, not Yahoo, and the
9-of-9 exact replication in leg 2 is what licenses it. **Leg 3's panel windows are rule-derived, not
stated** — only three June cut-off dates are sourced, and the 16-day field length comes from an April
edition; the 2027 window is arithmetic on top of that, and a single sentence in the June 2027 edition can
move it. **Leg 4 supports a negative claim only** — that price data shows no detectable difference — and
n=29 vs 22 could not see a small effect; it is not evidence that no channel exists, which is exactly why
the test was re-specified rather than closed. **Leg 6's quarter-end result is the strongest number in this
session and still rests on 23 quarters** in one unusual macro window (2021-2026 contains a bear market, a
rate-hiking cycle and a pandemic reopening); only XRT clears a Bonferroni bar across nine instruments, and
the six-instrument agreement is reported as one direction, not six findings. **Leg 7's exclusion arms are
n=6** — a null at that size is weak, and the claim it supports is carried by leg 6's pooled result, not by
the December arm alone. **Leg 8's VIX comparisons are level comparisons, not width**, and summer-calm in
this window may be sample rather than season. **Legs 9 and 11 rest on n=6 and n=3 respectively**; what
survives is the negative claim, never a positive claim that the print is quiet. **Leg 10 is 2 computable
cases of 3.** **Leg 12's minutes date inherits the meeting's own tentativeness** — the Fed's page states
*"each meeting date is tentative until confirmed at the meeting immediately preceding it,"* so a moved
June meeting moves both the minutes and `fomc-blackout-start-2027-05-29`. **No Russell reconstitution
event is proposed** even though the last Friday of June is a plausible corridor member, because the one
source fetched for it returned 404 and a date with no primary source does not get filed. **The whole study
is at daily-bar resolution and says nothing about the 10:00–10:30 ET window**, which is the only place a
10:00 macro print could plausibly live. **No June consensus exists and structurally will not** (Conference
Board publication restrictions). And **everything about the June 2027 economy is unknown at D-296** — no
part of this doc depends on what the survey prints.

## Stance & kill switches

**Stance (date `estimate`; not primary-confirmed).** Treat the June 2027 Conference Board edition as a
**medium-impact second-tier print that is regime information and never a trading event**. **No position is
opened, closed or sized off it.** This ledger's assigned job was the chain's SEP-collision test, and the
honest outcome is that **the test as specified cannot be run from price data** — the two proxies the tape
can offer are 0 of 9 — so it is re-specified as a reading rule on the June 2027 edition's own text, where
it has a real and checkable prior: no edition in this chain's sourced record attributes a
month-over-month move to an FOMC decision, while `CCI-May-2025` attributes one in detail to a dated
tariff announcement. **The geometry itself survives, sharpened and partly corrected:** the June 2027
meeting is the earliest June FOMC in the record, the print sits 20 days after the decision against a modal
13, and **76% of the rule-derived panel (13 of 17 days) post-dates the dot plot against 35% in five of six
tape years and 0% in 2025** — but the window **opens two to three days before** the decision rather than
after it, because **June's own cut-off lags are 6/7/6, the shortest in the chain**, not the ~8 the proposal
borrowed from May. **The bracket framing is refuted on both sides:** June is not a flat month, it is a
member of a **9-of-9 summer block** (Jun+Jul+Aug vs the rest of the year, VIX and SPY p<0.0001) inside
which it is indistinguishable from July and August (2 of 9), while May sits outside that block — so the two
months are not opposite ends of one scale. **The finding this ledger adds is structural and reaches past
this event: quarter-end is a real regime and ordinary month-end is not.** The last four sessions of a
quarter-end month run **6 of 9 narrower** against all non-month-end sessions (XRT p=0.0011, XLF 0.0064,
QQQ 0.0125, SPY 0.0179, XLY 0.0254, AMZN 0.0295; n=96 vs 1,167) and **5 of 9** against the last four of an
ordinary month, while ordinary month-end is **0 of 9**. **This print sits one session before quarter
end**, inside that window — the first in the chain placed in a measured regime. **And it re-aims the
chain's outstanding test:** December's 7-of-9 last-5-vs-earlier signature falls to **0 of 9** once the
quarter-end sessions are removed while March's holds at 4 of 9, so the control the
[March rule](consumer-confidence-2027-03-30.md) needs is **quarter-end-vs-ordinary-month-end**, not
position-in-month — with the caveat, stated plainly, that the exclusion arms are n=6 and the pooled n=96
result is what carries the claim. **One method rule is banked for every lane that parses the Fed
calendar:** on top of the May sibling's abbreviated-cross-month trap, a non-overlapping regex **shares one
delimiter between consecutive meetings and silently drops every second one** (49 of 56 parsed, every
January missing, a plausible-looking 58/11 split); assert **8 meetings per year and 17 collisions** before
trusting anything downstream. Base case for the print itself (**Low** confidence — no consensus exists or
will): **Expectations stays below the Board's own 80.0 recession threshold** (below it in all three
sourced Junes, and at 68.2 in August 2026) and the edition **restates May 2027's headline by a nonzero
amount** (2 of 2 computable). Nine predictions are registered in
[`forward-tests/consumer-confidence-2027-06-29.md`](../forward-tests/consumer-confidence-2027-06-29.md).

**Kill switches:**

- **The Conference Board names a June 2027 date other than 2027-06-29** — the June last-Tuesday rule
  breaks despite four verified contrary editions, and this doc's date confidence collapses to the
  December sibling's. Registered as **FT-consumer-confidence-2027-06-29-1**.
- **Ordinary-month-end last-4 sessions clear p<0.05 on 2+ of 9 against non-month-end sessions, or
  quarter-end last-4 falls below 3 of 9, on a re-run after 2027-12-31** — leg 6's central finding was a
  month-end effect all along, or sampling noise, and every calendar study in this repo that starts
  controlling for quarter-end has to stop. Registered as **FT-consumer-confidence-2027-06-29-2**.
- **December last-5-excluding-last-4 clears p<0.05 on 3+ of 9 against earlier December on a re-run after
  2027-12-31** — leg 7's confound explanation is wrong, December carries a genuine position-in-month
  signature independent of the quarter boundary, and the May sibling's redirect stands as written.
  Registered as **FT-consumer-confidence-2027-06-29-3**.
- **June clears p<0.05 on 3+ of 9 against July+August, or the Jun+Jul+Aug block falls below 6 of 9
  against the rest of the year, on a re-run after 2027-12-31** — leg 8 is wrong and June is a month
  effect after all, which would restore the proposal's bracket framing. Registered as
  **FT-consumer-confidence-2027-06-29-4**.
- **The June 2027 edition states a cut-off date before 2027-06-20 or after 2027-06-24** — leg 5's lag
  measurement does not generalize, the panel window in leg 3 is wrong, and the 76% post-decision share
  has to be re-derived from the stated date. Registered as **FT-consumer-confidence-2027-06-29-5**.
- **The June 2027 edition attributes a month-over-month move to the June 8-9 FOMC decision or its
  projections** — the transmission channel this id was filed to test is real and visible in the
  publisher's own text, and the chain's prior (no edition has ever done so) dies on its sharpest test
  case. Registered as **FT-consumer-confidence-2027-06-29-6**.
- **The June 2027 edition cites a May 2027 headline identical to May's first print, or states no
  revision** — leg 10's extension of the reading aid weakens and the month-over-month delta becomes
  readable as news. Registered as **FT-consumer-confidence-2027-06-29-7**.
- **Expectations back above 80** — the Board's own recession-signal threshold, below which every sourced
  June has printed and which June 2023 approached to within 0.7 points, clears; the late-cycle framing
  this whole series carries dies. Registered as **FT-consumer-confidence-2027-06-29-8**.
- **The FOMC minutes for the June 8-9 meeting are published on any date other than 2027-06-30** — the
  three-week convention that sources this PR's proposal broke on a meeting with no holiday near it, and
  the corridor entry needs redating by whichever lane owns it. Registered as
  **FT-consumer-confidence-2027-06-29-9**.
- **Expectations below ~54** — deterioration past the April-2025 reading the Board itself called the
  lowest since October 2011; escalate ahead of the banded pulse.
- **The Fed moves the June 2027 meeting off 06-08/09** — the entire geometry in leg 3 disappears, and
  both `fomc-blackout-start-2027-05-29` and this PR's `fomc-minutes-2027-06-30` proposal need redating.
- **A federal funding lapse runs through the ~06-06 → 06-22 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1 – Nov 12 2025 shutdown ended), and the
  collection-period split becomes the thing to read.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits"
  premise under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-296 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-06-29.json` written this PR** after reading the one prior proposal (`from-consumer-confidence-2027-05-25`), now inert. **Last-Tuesday rule HOLDS for June, 4 of 4** — `CCI-June-2022` (`Updated : 2022-06-28`), `CCI-June-2023` (2023-06-27) + `CCI-May-2023`'s "Tuesday, June 27", `CCI-June-2024` (2024-06-25) + `CCI-May-2024`'s "June 25th", and 2025-06-24 off `CCI-May-2025`'s "June 24th" alone. 2027-06-29 is the last Tuesday of June 2027. **REPLICATION EXACT, 9 OF 9** — same vendor pair as the April/May siblings (stockanalysis.com + CBOE), n=1,447 sessions, 68 rule-derived days splitting **51 clean / 17 colliding** (17 day-ones, 0 decision days), clean medians reproducing the published table to three decimals (SPY 0.911, QQQ 1.379, XLY 1.397, XRT 1.687, AMZN 2.154, AAPL 1.731, XLF 1.119, TLT 0.961, VIX 18.560), 0 of 9, smallest p XLF 0.2713; clean-day SPY c2c **+0.090%, 29 of 51 up**. **THIRD PARSER TRAP BANKED, worse than the two already known:** the Fed calendar renders consecutive meetings sharing one delimiter (`|September|15-16*|October|27-28|`), so a non-overlapping regex consumes the boundary the next entry needs and **silently drops every second meeting** — 49 of 56 parsed, every January missing, and a plausible-looking **58 clean / 11 colliding** split. A lookahead restores all 56. Assert **8 meetings/year and 17 collisions** before trusting anything downstream. The May sibling's abbreviated-cross-month trap was also reproduced exactly (a fabricated 2024-05-30 meeting). **SIBLING PROSE CORRECTION, recorded not edited:** the 05-25 ledger lists the Fed's 2027 January meeting as 01-25/26; the page says **January 26-27** and `fomc-2027-01-27.json` already carries the right decision day — `January 25-26, 2028` appears on the same page in the following-year note, the likely source. **THE GEOMETRY — substance SUPPORTED at 2.2x, strict form REFUTED.** The June 2027 FOMC is **06-08/09\***, the **earliest June meeting in the 2021-2027 record**, 20 days before this print against a modal 13 (2021 13d, 2022 13d, 2023 13d, 2024 13d, 2025 6d, 2026 13d). Post-decision share of the rule-derived 17-day panel: **76% (13/17) in 2027** vs **35% in five of six tape years and 0% in 2025**. But the window **opens 06-06, two-to-three days BEFORE the decision**, so the proposal's "opens after a dot-plot release" is wrong; the decision lands inside it. **TRANSMISSION CANNOT BE TAPE-TESTED — 0 of 9 both ways:** clean CB days by post-decision share >=75% vs <75% (n=29/22, SPY 1.010/0.747 p=0.3368, smallest AAPL 0.2578) and by SEP-vs-non-SEP prior decision (n=28/23, smallest AAPL 0.1529). Re-specified as a text test with a real prior: **no edition in this chain's sourced record attributes a month-over-month move to an FOMC decision**, while `CCI-May-2025` attributes one in detail to the May 12 tariff announcement. **JUNE'S CUT-OFF LAGS ARE THE SHORTEST IN THE CHAIN — 6/7/6** (2022-06-22, 2023-06-20, 2024-06-19) vs May's 8/7/8 and April's 6/6/8; 2027 cut-off **06-22/23**, window **06-06 -> 06-22/23**. Method rule: **the lag varies by month and must not be borrowed across months** — which is precisely how the proposal's window came out wrong. **THE FINDING — QUARTER-END IS A REAL REGIME AND MONTH-END IS NOT.** Last 4 sessions of a quarter-end month vs all non-month-end: **6 of 9 narrower** (XRT **0.0011**, XLF 0.0064, QQQ 0.0125, SPY 0.0179, XLY 0.0254, AMZN 0.0295; n=96 vs 1,167). Last 4 of an **ordinary** month vs the same: **0 of 9** (n=184, smallest AMZN 0.1313). Head to head: **5 of 9** (AMZN **0.0057**, XRT 0.0224, XLF 0.0261, SPY 0.0410, QQQ 0.0433). Only XRT clears Bonferroni (0.05/9); the six-instrument agreement is reported as one direction, not six findings. **2027-06-29 sits ONE SESSION before quarter end** (June 2027 runs ...06-28, 06-29, 06-30), inside that window — the first print in this chain placed in a measured regime rather than a null. **AND IT CONFOUNDS THE 05-25 DECEMBER REDIRECT:** Dec last-5 vs earlier Dec reproduces at **7 of 9** (XLF 0.0010), but Dec last-5 **excluding the last 4** is **0 of 9** (n=6, smallest AMZN 0.0608) while Mar last-5 excluding last-4 holds at **4 of 9** (AMZN 0.0095) — the right control for the 03-30 week-level rule is **quarter-end-vs-ordinary-month-end**, not position-in-month. Caveat stated: exclusion arms are n=6; the n=96 pooled result carries the claim. **JUNE IS SUMMER, NOT A MONTH — the bracket framing fails both sides:** Jun+Jul+Aug vs rest of year **9 of 9 narrower** (SPY 0.873/1.031 p<0.0001, VIX 16.480/18.865 p<0.0001); June vs Jul+Aug **2 of 9** (AMZN 0.0418, TLT 0.0439); June vs rest of year 1 of 9 and that hit is a **VIX level** (16.695 vs 18.310, p=0.0001) that July (16.500) and August (16.260) beat. May, the proposed counterpart, is 0 of 9 and outside the block. The 12-month last-5-vs-earlier scan reproduces the sibling row for row (Dec 7, Mar 6, Jan/Feb/Apr 2, Jun/Aug/Nov 1, May/Jul/Sep/Oct 0), June's single hit being **XRT p=0.0172** (proposal quoted 0.0170). **PRINT DAY NULL ON EVERY CONTROL:** vs other June 0 of 9 (n=6/118, SPY 0.848/0.880 p=0.7665), vs other late-June 0 of 9 (n=6/24, p=0.8969), vs all sessions 0 of 9 (p=0.4941). **DIRECTIONAL DECLINED:** SPY c2c **+0.582%, 5 of 6 up** vs +0.135% late-June — **p=0.4522** (0.2867 vs June, 0.2947 vs all). Third month running the chain has declined a large-looking directional figure, and the signs across April/May/June (−1.035% / +0.054% / +0.582%) argue none is seasonal. **REVISION RULE EXTENDS TO A SIXTH MONTH AND PRODUCES THE CHAIN'S FIRST ZERO REVISION:** June restates May 2 of 2 computable — 102.3->**102.5 (+0.2)**, PS 148.6->148.9, Exp 71.5->**71.5 (0.0, the first zero)**; 102.0->**101.3 (−0.7)**, PS 143.1->140.8 (−2.3), Exp 74.6->74.9 (+0.3). `CCI-June-2022` restates May at 103.2/147.4/73.7 but May-2022's first print is unsourced (blocked), so it is not computable. Headline rule holds; the **sub-index** version fails, which matters because Expectations is what every kill switch keys on. **JUNE LEVELS:** 2022 98.7/147.1/66.4 (cut-off 06-22) · 2023 **109.7**/155.3/**79.3** (06-20) · 2024 100.4/141.5/73.0 (06-19) — all Expectations below 80, but June 2023's **79.3** is the closest approach in the chain ("just a shade below 80") and its headline the highest ("highest level since January 2022"). Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53** (CBOE close), SPY **770.19** (2026-09-04) — baseline set, identical to the April/May siblings'. **Geopolitical:** unchanged from siblings. **Event tape:** no June consensus exists or is publishable (CB publication restrictions); current edition is August 2026 (89.4/121.2/68.2, survey Aug 3–16, cut-off Aug 16), next release named 2026-09-29. **Sourcing failures:** `CCI-June-2021`, `CCI-June-2025`, `CCI-June-2026` and `CCI-May-2026` each returned **HTTP 200 serving the current August 2026 edition** (332,031 bytes) — same substitution class every sibling logged; LSEG's FTSE Russell reconstitution page returned **404**, so **no Russell event is proposed** despite the last Friday of June being a plausible corridor member. All recorded in `probe-ref.blocked`. **New dated adjacencies → TWO proposals filed:** (1) `proposals/fomc-minutes-2027-06-30.from-consumer-confidence-2027-06-29.json` — **the very next session**, and the first time this chain has a tracked event one day after a CB print; sourced off the Fed's own convention sentence plus a measurement of it (**42 of the 45 published minutes dates are exactly 21 days after their decision day**; the three exceptions are holiday-shifted Nov/Dec releases, and the rule reproduces every `fomc-minutes-*` entry already tracked). (2) `proposals/consumer-confidence-2027-07-27.from-consumer-confidence-2027-06-29.json` — the next edition, sourced three-for-three for July off this session's own June fetches, and **an FOMC day-one collision** (the Fed's 2027 July meeting is 07-27/28), which makes 2027 the first year in the record with two collisions from one release rule and gives the 04-27 collision study its within-year replication. **Corridor:** **0** tracked events within 5 days today (nearest `opex-2027-06-17` at 12 days, `juneteenth-market-closure-2027-06-18` at 11); **1 after this PR** — `fomc-minutes-2027-06-30`, D+1. Nine forward tests registered: **FT-consumer-confidence-2027-06-29-1** through **-9**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-06-29.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
