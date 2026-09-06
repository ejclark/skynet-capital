# Conference Board Consumer Confidence (Jan 2027) — consumer-confidence-2027-01-26

**Kind:** macro-print · **Date:** 2027-01-26 (estimate, EST: the publisher's stated "last Tuesday of every month" rule, verified this session against five primary-sourced January editions — 2022-01-25, 2023-01-31, 2024-01-30, 2025-01-28, 2026-01-27 — every one of which is the last Tuesday of its January; the rule that a sibling lane found REFUTED for December holds five-for-five for January) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-01-22","fhfa-hpi-2027-01-26","fomc-2027-01-27","japan-cpi-2027-01-22","japan-cpi-tokyo-flash-2027-01-29","norway-gpfg-bond-expert-group-2027-01-25"],"screenStreak":0,"blocked":[{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Jan-2026","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"},{"url":"https://www.conference-board.org/topics/consumer-confidence/press/CCI-Jan-2022","status":"200-SERVED-CURRENT-EDITION","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **This print's release day is the most confounded day on the calendar, and the session
immediately after it is the least ordinary — which is the whole call.** The proposal that created this
id named the FHFA HPI print (9:00 ET, same day) as the confound. It is the smaller one. The Fed's own
calendar puts its January meeting on the **last Tuesday of January in every year 2021–2027**, which is
the exact slot the Conference Board publishes on — so **every January CB print since 2021 has also been
FOMC day one**, and 2027-01-26 will be too. Two consequences. First, the **date is unusually solid for
an `estimate`**: two independent calendar rules point at 2027-01-26, one of them primary-sourced from
federalreserve.gov, and the January last-Tuesday rule holds on all five sourced editions (the December
sibling found the same rule refuted five-for-five — January is not December). Second, measured here on
2021→2026 daily bars, **FOMC day one is statistically ordinary** (0 of 9 instruments differ from
baseline at p<0.05; nearest XLY p=0.0509) while **decision day — 2027-01-27 — is the most extraordinary
day on this calendar** (8 of 9 at p<0.05; SPY median session range **1.354% vs 0.964%, p=0.0001**). So
the tradable statement belongs to `fomc-2027-01-27`, not here. Third finding, a reading aid: the
January edition **restates December's headline by 0.7 / −2.7 / 4.8 / 5.1 points** across the four
sourced pairs — the same order as the month-over-month change it reports, so the January "drop" is
about half a measurement of December's restatement. Read the **level and Expectations**, never the
delta. Date **estimate**; `symbols: []`; **0** macro-keyed playbooks.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-142) | **Stand aside** | High | `symbols: []`, D-142, the January panel does not open for four months, and a re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for any macro- or sentiment-keyed playbook returns **0 hits** (the one `sentiment` string is a portfolio-weighting input, not a print playbook). Nothing dated exists to act on. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2027-01-26** — none exists today |
| This week | **Stand aside — the series' live question is the 09-29 print** | High | The current edition is **August 2026, released 08-25**: headline **89.4** (from 90.2), Present Situation **121.2**, Expectations **68.2**, field **Aug 3–16**. Market state **2026-09-04**: VIX **14.53**, S&P **7,718.60**, SPY **770.19**, Brent **$96.28**. | The Conference Board naming a January 2027 date other than **2027-01-26** before **2027-01-05**, which breaks the verified January rule this whole doc rests on |
| This month | **Do not model this release day as the survey's — it is FOMC day one, six years running** | High | federalreserve.gov (fetched 2026-09-06): January FOMC day one is the **last Tuesday** in 2021 (01-26), 2022 (01-25), 2023 (01-31), 2024 (01-30), 2025 (01-28), 2026 (01-27) and 2027 (01-26) — the CB's own slot. Measured n=45 FOMC day-ones: **0 of 9 instruments at p<0.05**. Nothing here is attributable to the survey. | The Fed moving the 2027 January meeting off **26-27** (its calendar labels every 2027 date tentative), or any of the nine printing p<0.05 for day one on a re-run after **2027-03-31** |
| This quarter | **The corridor's risk is 01-27, not 01-26 — be flat into the decision, not into the print** | Medium | On the same n=45 pipeline, **decision day** runs SPY **1.354 vs 0.964** (p=**0.0001**), XRT **2.461 vs 1.818** (p<0.0001), XLY **1.862 vs 1.434** (p=0.0002), TLT **1.095 vs 0.838** (p=0.0009) — **8 of 9 at p<0.05**. The print sits the day before that, inside the **01-16 blackout**, so no Fed voice reacts to it before 14:00 ET on 01-27. | Decision day failing to clear p<0.05 on **6 or more** of the nine on a re-run after **2027-03-31**, which would kill the asymmetry this row is built on |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, 0 macro-keyed playbooks,
  and the release day is triply confounded (FHFA 9:00 ET · CB 10:00 ET · FOMC convening).
- **The Conference Board names a January 2027 date** → adopt it verbatim. The rule says **01-26**;
  registered as **FT-consumer-confidence-2027-01-26-1**.
- **The Fed moves the January 2027 meeting off 26-27** → the day-one framing dies and this becomes an
  ordinary second-tier print; `fomc-2027-01-27` and `fomc-blackout-start-2027-01-16` both need redating.
- **Read the level and Expectations, never the month-over-month delta** — December's restatement has
  run **+0.7 / −2.7 / +4.8 / +5.1** points, the same order as the change being reported.
- **Expectations back above 80** → the Board's own recession threshold, breached since Feb 2025 and at
  **68.2** in August 2026, clears; the late-cycle framing this whole series carries dies.
- **Expectations below ~62** → deterioration accelerating in the last consumer panel the Committee sees
  before it votes; escalate ahead of the banded pulse.
- **A federal funding lapse running through the ~01-15→01-20 field window** → the Dec-2025 edition is
  the precedent (the Oct 1–Nov 12 2025 shutdown drove an explicit upward revision once it ended), and
  the collection-period split becomes the thing to read, not the headline.
- **Do not spend sessions hunting a consensus.** Withheld under Conference Board publication
  restrictions — structural, established by the 09-29 sibling, not re-spent here.
- **Watch (dated):** FOMC **09-16** · CB print **09-29** · CPI **10-14** · FOMC **10-28** · CB print
  **11-24** (est.) · FOMC **12-09** · CR expiry **12-11** (est.) · CB print **12-22** (est., window) ·
  FHFA HPI **12-29** · FOMC minutes **12-30** · **the Board names this date ~late Dec 2026** ·
  **blackout 2027-01-16** (est.) · BoJ **01-22** (est.) · **this print 01-26** (est.) · **FOMC decision
  01-27** (est.) · Tokyo CPI flash **01-29** (est.).

## Initial research

### The question, plainly

The FHFA lane proposed this id and left a pointed note: 2027-01-26 is **FOMC day one**, and the print is
its proposer's own central confound because both publishers key to the last Tuesday. So: **is the date
right, given that a sibling lane just refuted the same last-Tuesday rule for December?** Is the FOMC
overlap a coincidence of one year or a property of the calendar? Does the series' inherited "release
day is quiet" reasoning survive on *this* slot? And what should a paper book holding NVDA MRVL AVGO
CRWV MSFT GOOG META AAPL AMZN do about it?

**One-line verdict:** the date is the strongest `estimate` this series has carried — two independent
calendar rules, one primary-sourced, land on 2027-01-26 — and precisely because of the second rule the
release day tells you nothing: it is FOMC day one, measurably the most *ordinary* day on this calendar,
sitting immediately before measurably the least ordinary one, so the stand-aside here is not "the
survey is quiet" but "the survey's day is unreadable and the day that matters belongs to another id."

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run and the
cache-busting rule has no target. **Sources fetched direct 2026-09-06**, all HTTP 200 and each verified
against its own `Source: <Month> <Year> Consumer Confidence Survey` line rather than trusted by slug:
`conference-board.org/topics/consumer-confidence` (the cadence sentence, the named next release, the
August 2026 values and cut-off); the publisher's `CCI-Jan-2023`, `CCI-Jan-2024`, `CCI-Jan-2025`,
`CCI-Dec-2022`, `CCI-Dec-2023`, `CCI-Dec-2024` pages; and the Board's own PRNewswire distributions for
January 2022 (`consumer-confidence-fell-in-january-301467668`, dateline *"Jan. 25, 2022 … 10:00 ET"*),
January 2025 (`us-consumer-confidence-retreated-in-january-302362076`, *"Jan. 28, 2025 … 10:00 ET"*),
January 2026 (`us-consumer-confidence-fell-sharply-in-january-302671278`, *"Jan. 27, 2026 … 10:00 ET"*)
and December 2025 (`us-consumer-confidence-fell-again-in-december-302648784`). **The FOMC dates are
primary:** `federalreserve.gov/monetarypolicy/fomccalendars.htm`, HTTP 200, 164,831 bytes, which lists
2021 through 2027 and states *"Each meeting date is tentative until confirmed at the meeting immediately
preceding it."* **Two slugs failed the way the 12-22 sibling warned they would:** `CCI-Jan-2022` and
`CCI-Jan-2026` returned **HTTP 200 while serving the current August 2026 edition** — byte-identical to
the topics page at 332,031 bytes — a silent substitution, not an error. Both are recorded in
`probe-ref.blocked` as `200-SERVED-CURRENT-EDITION` and both dates rest on wire datelines instead.
**The tape study is this session's own work and was built to be falsifiable against the series':** daily
OHLC for SPY, QQQ, XLY, XRT, AMZN, AAPL, XLF, TLT and ^VIX from the Yahoo chart endpoint for
2020-12-01 → 2026-09-05, session range `(high − low) / open`, two-sided Mann-Whitney U with tie
correction. Run first on the 11-24 sibling's own set (the last Tuesday of every month, 2021-01 →
2026-08) it **reproduces that ledger's published figures**: SPY 0.904 / 0.982 at p=**0.1842** against
its 0.1843, QQQ 1.353, XLY 1.291, XRT 1.669, AMZN 2.169, AAPL 1.762, VIX 17.760. That replication is
what licenses legs 4–5 as a like-for-like comparison rather than a different pipeline disagreeing.
Market readings are Yahoo daily closes for **2026-09-04**, fetched independently this session: VIX
**14.53**, S&P 500 **7,718.60**, SPY **770.19**, Brent (BZ=F) **$96.28**.

### Conviction legs, tested

1. **The last-Tuesday rule HOLDS for January — SUPPORTED five-for-five, which is the opposite of what
   the December sibling found.** The publisher states, fetched today: *"The Conference Board publishes
   the Consumer Confidence Index® at 10 a.m. ET on the last Tuesday of every month."* For December that
   is refuted on five consecutive editions ([12-22 sibling](consumer-confidence-2026-12-22.md) leg 1).
   For January it is exact:

   | Edition | Released | Weekday | Last Tuesday of that January | Source |
   |---|---|---|---|---|
   | Jan 2022 | 2022-01-25 | Tue | 01-25 | PRNewswire dateline, HTTP 200 |
   | Jan 2023 | 2023-01-31 | Tue | 01-31 | publisher's own `CCI-Dec-2022` next-release line |
   | Jan 2024 | 2024-01-30 | Tue | 01-30 | publisher's own `CCI-Dec-2023` next-release line |
   | Jan 2025 | 2025-01-28 | Tue | 01-28 | `CCI-Dec-2024` next-release line + PRNewswire dateline |
   | Jan 2026 | 2026-01-27 | Tue | 01-27 | PRNewswire dateline, HTTP 200 |

   **2027-01-26 is the last Tuesday of January 2027.** One honest wrinkle worth recording because it is
   the kind of thing that quietly poisons a derived calendar: `CCI-Dec-2022` reads *"The next release is
   **Wednesday**, January 31 at 10 AM ET"* — and 2023-01-31 was a **Tuesday**. The publisher's own
   weekday word is wrong; the date is right (its own `CCI-Jan-2023` page confirms the edition, and the
   Jan-24 cut-off gives a coherent 7-day lag). **Take the publisher's dates, never its weekday labels.**
   Registered as **FT-consumer-confidence-2027-01-26-1**.

2. **The FOMC's January meeting also lands on the last Tuesday, every year 2021–2027 — SUPPORTED, and
   this is the finding the proposal did not have.** From federalreserve.gov, fetched today:

   | Year | January FOMC | Day one | Last Tuesday of January | CB print that day? |
   |---|---|---|---|---|
   | 2021 | Jan 26-27 | 2021-01-26 | 01-26 | yes (rule; not separately sourced) |
   | 2022 | Jan 25-26 | 2022-01-25 | 01-25 | **yes, sourced** |
   | 2023 | Jan 31–Feb 1 | 2023-01-31 | 01-31 | **yes, sourced** |
   | 2024 | Jan 30-31 | 2024-01-30 | 01-30 | **yes, sourced** |
   | 2025 | Jan 28-29 | 2025-01-28 | 01-28 | **yes, sourced** |
   | 2026 | Jan 27-28 | 2026-01-27 | 01-27 | **yes, sourced** |
   | 2027 | **Jan 26-27** | **2027-01-26** | **01-26** | **predicted** |

   Seven-for-seven. This is not a coincidence to note in passing — it is **a second, independent
   calendar rule pointing at the same day**, and it is primary-sourced where the CB rule is only
   restated prose. It is the reason this `estimate` deserves more weight than the December sibling's.
   **The stated caveat is the Fed's own:** *"Each meeting date is tentative until confirmed at the
   meeting immediately preceding it."* Neither date is `confirmed`, and nothing here licenses an entry.

3. **The January field cut-off floats; it is not December's near-fixed date — SUPPORTED, and it puts the
   panel inside the blackout.** Sourced cut-offs: **Jan 19** (2022) · **Jan 24** (2023) · **Jan 22**
   (2024) · **Jan 20** (2025) · **Jan 16** (2026), i.e. lags of **6 / 7 / 8 / 8 / 11** days before
   release. Applied to a 2027-01-26 release that gives a cut-off in the **2027-01-15 → 2027-01-20**
   band, so the panel runs roughly **2027-01-01 → 2027-01-18**: the first three weeks of the new year,
   the post-holiday hangover, and nothing of December. Two structural consequences. It closes at or just
   after **`fomc-blackout-start-2027-01-16`** (estimate), so the print lands **inside** the Fed's
   communication blackout — **no Fed official can react to it before 14:00 ET on 01-27**, which is
   exactly why the reaction, if any, is displaced onto decision day rather than release day. And it is
   the **last consumer datapoint the Committee sees before it votes**, which is the proposal's own
   framing and survives intact.

4. **FOMC day one — the slot this print occupies — is statistically ordinary. SUPPORTED, 0 of 9.**
   n=45 day-one sessions, 2021-01 → 2026-07, against every other session in the window:

   | Instrument | Day one (median rel / base) | p |
   |---|---|---|
   | SPY | 0.929 / 0.980 | 0.2219 |
   | QQQ | 1.360 / 1.375 | 0.3611 |
   | XLY | 1.179 / 1.452 | **0.0509** |
   | XRT | 1.655 / 1.839 | 0.4003 |
   | AMZN | 2.152 / 2.270 | 0.5247 |
   | AAPL | 1.831 / 1.857 | 0.8771 |
   | XLF | 1.164 / 1.236 | 0.4906 |
   | TLT | 0.887 / 0.848 | 0.7230 |
   | VIX close | 17.780 / 17.995 | 0.6961 |

   Zero hits at p<0.05; XLY's 0.0509 is the near-miss and is reported rather than rounded into a claim.
   SPY close-to-close on day one runs a **−0.094% median, 19 of 45 up** — a drift so small it is
   indistinguishable from nothing. **The honest reading:** the day the January survey prints is a day
   with no measurable character at all, which is a *stronger* stand-aside than the series' inherited
   "release day is quiet," because it is measured on n=45 rather than assumed from a mislabeled set.

5. **The next session is the most extraordinary day on this calendar — SUPPORTED, 8 of 9, and it is
   where the corridor's whole risk sits.** Same pipeline, same window, n=45 decision days:

   | Instrument | Decision day (median rel / base) | p | p75 rel / base |
   |---|---|---|---|
   | SPY | **1.354 / 0.964** | **0.0001** | 2.186 / 1.406 |
   | XRT | **2.461 / 1.818** | **0.0000** | 3.485 / 2.525 |
   | XLY | **1.862 / 1.434** | **0.0002** | 2.632 / 2.053 |
   | XLF | **1.566 / 1.220** | **0.0001** | 1.961 / 1.668 |
   | TLT | **1.095 / 0.838** | **0.0009** | 1.462 / 1.154 |
   | QQQ | **1.680 / 1.368** | **0.0013** | 2.854 / 1.922 |
   | AMZN | **2.717 / 2.249** | **0.0013** | 4.041 / 3.055 |
   | AAPL | **2.351 / 1.845** | **0.0046** | 3.108 / 2.518 |
   | VIX close | 18.310 / 17.960 | 0.7239 | — |

   Eight of nine clear p<0.05 and six clear p<0.005 — comfortably past any Bonferroni correction over
   nine tests. **Direction is not predicted and is not predictable**: SPY close-to-close on decision day
   is a **−0.015% median, 21 of 45 up**, a coin flip. What is established is **dispersion**, not
   direction. **The consequence for this event is a hand-off, not a trade:** the tradable statement
   about 2027-01-27 belongs to [`fomc-2027-01-27`](fomc-2027-01-27.md) — this ledger's job is to say
   that the print on 01-26 is *not* the thing to be positioned for, and that being flat into 01-27 is a
   dispersion fact, not a view. Registered as **FT-consumer-confidence-2027-01-26-2**.

6. **The six January CB days themselves show nothing, and n=6 is why — MIXED, deliberately not
   claimed.** Every instrument prints p ≥ 0.35 (SPY 0.976 vs 0.977, p=0.6654; QQQ 1.165 vs 1.375,
   p=0.6149; XLY 1.031 vs 1.447, p=0.3541). The per-day detail is the point:

   | | 2021-01-26 | 2022-01-25 | 2023-01-31 | 2024-01-30 | 2025-01-28 | 2026-01-27 |
   |---|---|---|---|---|---|---|
   | SPY range % | 0.599 | **2.903** | 1.436 | **0.308** | 1.352 | 0.426 |
   | SPY close-to-close % | −0.16 | −1.22 | +1.47 | −0.08 | +0.86 | +0.40 |
   | VIX close | 23.02 | 31.16 | 19.40 | 13.31 | 16.41 | 16.35 |

   A **9.4× spread** between the widest and narrowest, tracking the VIX regime of the day (31.2 vs 13.3)
   and nothing about the survey. **n=6 supports no test and this doc runs none**; only five of the six
   are separately sourced release dates (2021-01-26 is the rule applied backward). This is reported
   because a reader who assumed either "quiet" or "wide" would be assuming something nobody has
   measured — and because leg 4's n=45 is the *right* set for this slot anyway.

7. **The January headline delta is roughly half a measurement of December's restatement — SUPPORTED,
   and it is the most useful reading aid in this doc.** Each January edition restates the December
   number it is compared against. All four pairs are sourced from the publisher's own pages:

   | December, as first printed | Restated in the January edition | Revision |
   |---|---|---|
   | Dec 2022 **108.3** | Jan-2023 cites **109.0** ("an upward revision") | **+0.7** |
   | Dec 2023 **110.7** | Jan-2024 cites **108.0** ("a revised 108.0") | **−2.7** |
   | Dec 2024 **104.7** | Jan-2025 cites **109.5** ("revised up by 4.8 points") | **+4.8** |
   | Dec 2025 **89.1** | Jan-2026 cites **94.2** ("a 5.1-point upward revision") | **+5.1** |

   Against January month-over-month changes of **−1.4 · −1.9 · +6.8 · −5.4 · −9.7**, the revision is the
   **same order of magnitude as the change being reported**, and three of four ran upward — which
   mechanically *enlarges* the reported January decline. Jan-2026's headline fell 9.7 points, but
   against December's originally-published 89.1 the level actually **rose 0.6**. Anyone reading
   "confidence fell sharply in January" as news about January is reading a revision. **The rule that
   follows:** read the **level** and the **Expectations line** against the Board's own 80.0 threshold,
   never the delta. Registered as **FT-consumer-confidence-2027-01-26-3**.

8. **The level trend is the series' actual story and it is late-cycle — SUPPORTED.** Sourced January
   headline / Present Situation / Expectations: **2022** 113.8 / 148.2 / 90.8 · **2023** 107.1 / 150.9 /
   77.8 · **2024** 114.8 / 161.3 / 83.8 · **2025** 104.1 / 134.3 / 83.9 · **2026** 84.5 / 113.7 / 65.1.
   The August 2026 edition sits at **89.4 / 121.2 / 68.2**. Expectations has been below the Board's own
   **80.0 recession threshold** since February 2025 (the 11-24 sibling's finding, inherited and cited),
   and Present Situation has given back **48 points** from its January-2024 peak. **The narrow reading,
   stated:** this is a description of a survey, not a forecast of one, and at D-142 the January 2027
   panel has not opened.

9. **The release day is triply confounded, and no daily-bar design can ever fix it — SUPPORTED.** On
   2027-01-26 the tape carries **FHFA HPI at 9:00 ET** (`fhfa-hpi-2027-01-26`, `confirmed`), **this
   print at 10:00 ET**, and **the FOMC convening**. The proposer named the first pair and correctly
   observed that a 9:00–10:00 ET window is the only design that could separate them; leg 2 adds a third
   layer that no intraday window separates at all, because a meeting convening is not a timestamped
   event. **The de-confounded control exists and is one month later:** February 2027 has no FOMC meeting
   (the 2027 schedule runs January 26-27 then March 16-17), so the February edition keeps the FHFA
   pairing and drops the Fed layer. It is proposed in this PR as
   `proposals/consumer-confidence-2027-02-23.from-consumer-confidence-2027-01-26.json`, for that reason
   and not for bookkeeping.

10. **Tracked-name sensitivity is nil — SUPPORTED.** `symbols: []`. Only **AAPL** and **AMZN** carry
    direct consumer exposure; neither reports near 01-26, and both sit inside leg 4's day-one null
    (p=0.8771, p=0.5247). A re-grep of `docs/plans/trade-playbooks.md` and
    [`multi-symbol-sweep.md`](../multi-symbol-sweep.md) for any macro- or sentiment-keyed playbook
    returns **0 hits** — the single `sentiment` string in `trade-playbooks.md:115` is a portfolio
    weighting input (`|sentiment| + |momentum|`), not a macro-print playbook. The other seven names feel
    this corridor only through the rate-path channel, which **01-27** owns.

### What the conditions support

**A refusal, a hand-off, and a reading order.** The refusal is unchanged from the series and is
load-bearing: **nothing is opened, closed or sized off this print** — `symbols: []`, zero macro-keyed
playbooks, D-142. What is *new* is the reason. The series' older stand-asides leaned on "the release day
is quiet"; this one rests on **n=45 evidence that the day has no character at all** (leg 4) plus **n=45
evidence that the next session does** (leg 5). That is a hand-off, not a trade: the corridor's real risk
is `fomc-2027-01-27`, and the standing instruction is to be **flat into the decision**, on dispersion
grounds — SPY's decision-day median range is 40% wider than baseline at p=0.0001 while its direction is
a 21-of-45 coin flip. The reading order when the print lands: the **cut-off date** first (it validates
leg 3 and the blackout framing), the **Expectations** level against 80.0 second, **December's restated
value** third — because leg 7 says the headline delta is half a revision — and the headline last.

### Honest limits

**Both dates are `estimate`.** The CB has not announced January 2027 and the Fed labels every 2027
meeting tentative; the two rules agreeing is what makes this strong, not either alone. **Leg 2's 2021
row is the rule applied backward** — the 2021-01-26 CB release date was not separately sourced, so the
sourced streak is five, not six, and leg 6's n=6 tape set inherits that one soft point. **Legs 4 and 5
are correlational and say nothing about mechanism** — decision-day dispersion is presumably the decision
itself, not the survey printed 28 hours earlier, and this doc does not claim the print contributes
anything to it. **The day-one/day-two split is not a strategy**: direction is a coin flip in both sets,
and a dispersion fact is a statement about *cost*, never about entry. **Two January editions rest on
wire datelines** because `CCI-Jan-2022` and `CCI-Jan-2026` returned HTTP 200 serving the current August
2026 edition — the same silent substitution the 12-22 sibling caught, recorded under its own status in
`probe-ref.blocked` rather than folded in with a 403. **Leg 3's cut-off band is five points with an
11-day outlier** (2026), so the 2027 field window is a range, not a date. **Leg 7 is four pairs**, and
one of the four ran the other way. **No January consensus exists and structurally will not** (Conference
Board publication restrictions), so there is no measurable surprise gap to model. And **everything about
the January 2027 economy is unknown at D-142** — legs 3 and 8 are about what the panel will have *seen*
and what the series has *been*, and no part of this doc depends on what it prints.

## Stance & kill switches

**Stance (both dates `estimate`; not primary-confirmed).** Treat the January 2027 Conference Board
edition as a **medium-impact second-tier print that is regime information and never a trading event**.
**No position is opened, closed or sized off it.** Three things distinguish this stance from its
siblings'. First, **the date is the strongest estimate the series has carried**: the last-Tuesday rule
holds five-for-five in January (where it fails five-for-five in December), and the Fed's own calendar
independently lands day one of its January meeting on the same last Tuesday every year 2021–2027. Second,
**the refusal is measured, not inherited**: on n=45, FOMC day one — this print's slot — differs from
baseline on **0 of 9** instruments, so the release day has no character to trade, and it is triply
confounded (FHFA 9:00 ET · CB 10:00 ET · FOMC convening) besides. Third, **the corridor's risk is
displaced by one session**: decision day clears p<0.05 on **8 of 9** with SPY's median range 40% wider
than baseline at p=0.0001, so the standing instruction is to be **flat into 2027-01-27** — a dispersion
statement owned by [`fomc-2027-01-27`](fomc-2027-01-27.md), with direction explicitly not predicted.
Base case for the print itself (**Low** confidence — no consensus exists or will): the January panel is
dominated by the post-holiday consumer and the rate path the Committee is about to vote on rather than
by anything seasonal, and **Expectations stays below the Board's own 80.0 recession threshold**,
unbroken since February 2025 and at **65.1** in January 2026 and **68.2** in August 2026. Read the level
and Expectations; the month-over-month delta is roughly half a measurement of December's restatement.
Three predictions are registered in
[`forward-tests/consumer-confidence-2027-01-26.md`](../forward-tests/consumer-confidence-2027-01-26.md).

**Kill switches:**

- **The Conference Board names a January 2027 date other than 2027-01-26** — the January last-Tuesday
  rule breaks despite five contrary editions, and this doc's date confidence collapses to the December
  sibling's. Registered as **FT-consumer-confidence-2027-01-26-1**.
- **The Fed moves its January 2027 meeting off 26-27** — leg 2's whole framing dies, the print becomes
  an ordinary second-tier release, and `fomc-2027-01-27` plus `fomc-blackout-start-2027-01-16` both need
  redating by whichever lane owns them.
- **FOMC day one prints any of the nine instruments at p<0.05 on a re-run after 2027-03-31** — leg 4's
  "no character" null breaks and the release day becomes something to model after all. Registered as
  **FT-consumer-confidence-2027-01-26-2**.
- **Decision day fails to clear p<0.05 on six or more of the nine on that same re-run** — leg 5's
  asymmetry breaks, and the flat-into-01-27 instruction loses its evidence.
- **The January 2027 edition restates December 2026 by less than 2.0 index points** — leg 7's
  reading aid weakens and the headline delta becomes readable as news. Registered as
  **FT-consumer-confidence-2027-01-26-3**.
- **A federal funding lapse runs through the ~01-15→01-20 field window** — the Dec-2025 edition is the
  precedent (an explicit upward revision once the Oct 1–Nov 12 2025 shutdown ended), and the
  collection-period split becomes the thing to read.
- **Expectations back above 80** — the Board's own recession-signal threshold, breached since February
  2025, clears; the late-cycle framing this whole series carries dies.
- **Expectations below ~62** — deterioration accelerating in the last consumer panel the Committee sees
  before it votes; escalate ahead of the banded pulse rather than waiting.
- **A macro- or sentiment-keyed playbook lands in `docs/plans/trade-playbooks.md`** — the "0 hits"
  premise under every stand-aside call here stops being true, and the calls need re-derivation.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-142 | Initial research banked (above); **canonical `src/domain/market-events/consumer-confidence-2027-01-26.json` written this PR** after reading the one prior proposal (`proposals/consumer-confidence-2027-01-26.from-fhfa-hpi-2027-01-26.json`), now inert. **The last-Tuesday rule HOLDS for January** — 2022-01-25 · 2023-01-31 · 2024-01-30 · 2025-01-28 · 2026-01-27, all last Tuesdays, all primary-sourced — the exact opposite of the 12-22 sibling's December finding; 2027-01-26 is the last Tuesday of Jan 2027. Publisher's own weekday labels are unreliable (`CCI-Dec-2022` says "**Wednesday**, January 31" for a Tuesday); take its dates only. **THE FINDING: the FOMC's January day one is the last Tuesday too, 2021→2027** (federalreserve.gov, HTTP 200: 01-26 · 01-25 · 01-31 · 01-30 · 01-28 · 01-27 · **01-26**) — so every January CB print since 2021 is also FOMC day one, giving the date two independent rules and the release day a third confound on top of FHFA's 9:00 ET. **Tape study, own work, pipeline first reproduced the 11-24 sibling's n=68 figures** (SPY 0.904/0.982 p=**0.1842** vs its 0.1843; QQQ 1.353; XLY 1.291; XRT 1.669; AMZN 2.169; AAPL 1.762; VIX 17.760). **FOMC day one (n=45) is ORDINARY — 0 of 9 at p<0.05:** SPY 0.929/0.980 (0.2219), QQQ 1.360/1.375 (0.3611), XLY 1.179/1.452 (**0.0509**, the near-miss), XRT 1.655/1.839 (0.4003), AMZN 2.152/2.270 (0.5247), AAPL 1.831/1.857 (0.8771), XLF 1.164/1.236 (0.4906), TLT 0.887/0.848 (0.7230), VIX 17.780/17.995 (0.6961); SPY c2c −0.094% median, 19/45 up. **Decision day (n=45) is EXTRAORDINARY — 8 of 9 at p<0.05, 6 at p<0.005:** SPY **1.354/0.964 p=0.0001**, XRT **2.461/1.818 p<0.0001**, XLY 1.862/1.434 (0.0002), XLF 1.566/1.220 (0.0001), TLT 1.095/0.838 (0.0009), QQQ 1.680/1.368 (0.0013), AMZN 2.717/2.249 (0.0013), AAPL 2.351/1.845 (0.0046); VIX close unmoved (0.7239); direction a coin flip (SPY c2c −0.015% median, 21/45 up). **So the corridor's risk is 01-27, owned by `fomc-2027-01-27`, not this print.** The six January CB days themselves: SPY ranges 0.599/2.903/1.436/0.308/1.352/0.426, a 9.4× spread tracking VIX regime (31.16 → 13.31), all p ≥ 0.35 — n=6, reported not tested. **Revision finding:** January restates December by **+0.7 / −2.7 / +4.8 / +5.1** (Dec-2022 108.3→109.0 · Dec-2023 110.7→108.0 · Dec-2024 104.7→109.5 · Dec-2025 89.1→94.2), the same order as the MoM change reported (−1.4/−1.9/+6.8/−5.4/−9.7) — Jan-2026's "fell 9.7" was a **+0.6 rise** against December as first printed. **Cut-offs float** — Jan 19/24/22/20/16, lags 6/7/8/8/11 → a 2027 field window of ~01-01→01-18 closing at/just after **blackout start 01-16**, so no Fed voice reacts before 14:00 ET on 01-27. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none new this session. **Volatility regime:** VIX **14.53**, S&P **7,718.60**, SPY **770.19**, Brent **$96.28** (2026-09-04 closes, fetched independently) — baseline set. **Geopolitical:** unchanged from siblings; Brent elevated, pass-through belongs to nearer prints. **Event tape:** no January consensus exists or is publishable (CB publication restrictions). **Sourcing failures:** `CCI-Jan-2022` and `CCI-Jan-2026` returned **HTTP 200 serving the current August 2026 edition** (byte-identical, 332,031) — recorded as `200-SERVED-CURRENT-EDITION`; both dates rest on PRNewswire datelines instead. **New dated adjacency → ONE proposal filed:** `proposals/consumer-confidence-2027-02-23.from-consumer-confidence-2027-01-26.json` — the de-confounded control, since February 2027 has no FOMC meeting but keeps the FHFA pairing. **Corridor:** BoJ + Japan CPI **01-22** · Norway GPFG expert group **01-25** · **FHFA HPI 9:00 ET + this print 10:00 ET + FOMC convenes 01-26** · **FOMC decision 01-27** · Tokyo CPI flash **01-29**. **Correction banked for a sibling lane, not applied (#1449):** `consumer-confidence-2026-12-22` leg 3 calls the December cut-off a fixed Dec 16 because only three editions state one — five do. `CCI-Dec-2022` (self-identified "Source: December 2022 Consumer Confidence Survey") states **December 15** and `CCI-Dec-2023` states **December 14**, so the December cut-off is a 6–7 day lag landing Dec 14–16, not a fixed date; that ledger's dependent claims survive (a Dec 14 close still post-dates FOMC 12-09, CPI 12-10 and CR expiry 12-11) but its own non-12-16 kill switch has effectively fired. Three forward tests registered: **FT-consumer-confidence-2027-01-26-1/-2/-3**. | — (stance set) | 2026-09-27 (medium, ≥31d band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-consumer-confidence-2027-01-26.json` (`status: "estimate"`)
in the same PR — your own file, never another event's canonical one (#1717). Close-out fills
`## Outcome` below from re-run instrument data (cache busted first), never from memory — after which
this doc goes quiet.
