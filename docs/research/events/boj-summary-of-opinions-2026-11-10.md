# BoJ Summary of Opinions (MPM Oct 29-30, 2026 — the Outlook meeting) — boj-summary-of-opinions-2026-11-10

**Kind:** macro-print · **Date:** 2026-11-10 (estimate, EST: boj.or.jp/en/mopo/mpmsche_minu/ "Monetary Policy Meetings", re-fetched direct 2026-09-05 (HTTP 200, 41,959 bytes) and parsed cell-by-cell by this session; the 2026 table's October row reads exactly `["Oct. 29 (Thurs.), 30 (Fri.)", "Oct. 30 (Fri.)", "Nov. 10 (Tues.)", "Dec. 23 (Wed.)"]` against the header "Date of MPM | Outlook Report (The Bank's View) | Summary of Opinions | MPM Minutes" — so this meeting DOES carry an Outlook Report and its full Minutes do not publish until 2026-12-23 — and the same page states the release time verbatim: "Summary of Opinions It will be released at 8:50 a.m." Filed estimate because the confirmed-prefix taxonomy has `FED:` and no slot for any other central bank, and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-minutes-2026-11-05","cpi-2026-11-10","crwv-2026-11-10-print","jobs-2026-11-06","mts-october-2026-11-12","ppi-2026-11-13","productivity-costs-q3-2026-11-05","sifma-bond-market-closure-2026-11-11","us-china-tariff-truce-expiry-2026-11-10"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and this session's contribution is a measuring stick rather than another
refusal.** Four sibling ledgers have measured the BoJ's Summary of Opinions and refused it; between
them they left exactly two cuts that looked *live*, and this session tested both against the noise
their own sample sizes generate. **Neither survives.** The
[February sibling](boj-summary-of-opinions-2027-02-01.md) found the one channel where the venue
appeared alive — meetings carrying an **Outlook Report** move the yen more than meetings without
one. Re-derived here on a different measure and a different data source, the point estimate
**replicates** (USD/JPY median **0.318%** on the 43 Outlook-meeting accounts vs **0.208%** on the 43
non-Outlook ones, **1.53×**, against the sibling's regime-normalised **1.63×**) — but a 100,000-draw
permutation test on that same split returns **p = 0.119**, so it is an unrejected hypothesis, not a
measured property. **And the equity half of that split, which no sibling had run, is flat and
faintly inverted:** Outlook-meeting accounts are *quieter* on both indices (Nikkei median 0.705% vs
0.741%, S&P **0.372% vs 0.449%**), permutation **p = 0.826** and **p = 0.748**. The second cut is
this venue's own flattering statistic. All **10** October-MPM accounts ever published land in a
four-day window (**Nov 8-11**, lags 8-11 days, six of ten at exactly 11 — 2026's lag), and their
Nikkei median of **1.264%** is **1.89×** the 0.668% baseline and **2.26×** a matched Nov 8-11
control. It does not survive either: a bootstrap says **P(median ≥ 1.264%) = 0.080** for ten random
Nikkei sessions, the eight month-cohorts span **0.59×-2.15×** against a random-draw p05-p95 band of
**0.49×-1.80×** at n≈11, and dropping the single **2016-11-10** bar (+6.725% — the post-US-election
rally, on the identical calendar date, and the largest Nikkei move in the entire 86-release
population) takes the cohort mean from 1.64× to **1.03×**. **Cohort ratios at n≈10 are noise, and
this document now says so with a number.** Separately, **the 11-10 US bar is the most contaminated
of any BoJ meeting-account date on this calendar**: the same session carries a **confirmed
high-impact CPI print**, a **high-impact tariff-truce expiry**, and a **critical-impact tracked-name
earnings print (CRWV)** — three channels ahead of Tokyo. Date is **estimate**; it widens caution and
licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no position this could touch | High | `symbols: []`, `impact: low`, no house playbook is rates- or FX-keyed, and at **D-66** the document does not exist and the meeting it summarises has not happened | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2026-11-09** that the tape attributes to a BoJ Summary of Opinions — the "no channel" premise fails and this doc is rebuilt |
| This week | **Stand aside; the live BoJ question this week is the 2026-09-18 decision** | High | Two decisions stand in front of the meeting this document summarises, and the [09-18 ledger](boj-decision-2026-09-18.md) owns the near question — nothing in the 2026-09-07 → 09-11 tape is keyed to a November account | Any BoJ communication before **2026-09-11** changing what a Summary of Opinions contains or when it publishes — the 86-release scaffold below is re-derived early |
| This month | **Read it, do not trade it — and never read the 11-10 US session for it** | High | The 11-10 US bar carries [CPI](cpi-2026-11-10.md) (confirmed, high, 08:30 ET), the [US-China tariff-truce expiry](us-china-tariff-truce-expiry-2026-11-10.md) (estimate, high) and **CRWV's print** (critical); the release itself lands **18:50 EST Mon 2026-11-09**, ~14 hours before CPI | The **2026-11-10** USD/JPY close-to-close \|move\| exceeding **0.318%**, the Outlook-meeting SoO median the February sibling's live-yen-channel reading would forecast — registered as **FT-boj-summary-of-opinions-2026-11-10-2**, score by 2026-11-11 |
| This quarter | **Treat every single-cohort SoO statistic on this calendar as noise until it beats the band measured here** | Medium | Eight month-cohorts span **0.59×-2.15×** on the Nikkei median against a **0.49×-1.80×** random-draw band at n≈11; this venue's own 1.89× is **p = 0.080** with eight cohorts examined | The **2026-11-10** Nikkei 225 close-to-close \|move\| exceeding **1.264%** (the October-cohort median) — an 11th observation above it pushes the cohort further outside the band and the noise reading weakens. Registered as **FT-boj-summary-of-opinions-2026-11-10-1**, score by 2026-11-11 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-11-10, to the 11-10 Tokyo session or to
  the 11-10 US session, in any branch. `impact: low`, `symbols: []`, date `estimate`.
- **The attribution rule, and it is stricter here than at any sibling venue.** The 11-10 US session
  carries **three** channels ahead of the BoJ: [CPI](cpi-2026-11-10.md) (**confirmed**, high, 08:30
  ET, `BLS:`-sourced), the [US-China tariff-truce expiry](us-china-tariff-truce-expiry-2026-11-10.md)
  (estimate, **high**) and **CRWV's earnings print** (estimate, `critical` as an event). Rule out all
  three before crediting Tokyo with any part of that bar. Compare the December sibling, whose
  competing item was one medium-impact report.
- **The one clean bar is Tokyo's, and it is clean for a mechanical reason.** 08:50 JST is 10 minutes
  before the 09:00 JST cash open, and Tokyo's 11-10 session closes 15:30 JST = **01:30 EST**, seven
  hours *before* the 08:30 ET CPI. So the Nikkei's 11-10 bar contains the Summary and not the CPI;
  the CPI lands in Tokyo's **11-11** bar. Every forward test below that needs a clean bar uses Tokyo.
- **The number a US equity book should carry:** across all 86 accounts the S&P runs **0.649%** mean
  \|move\| against a **0.729%** baseline (**0.89×**), and the October cohort runs **0.528%**
  (**0.72×**). **The document has never been a US equity event and this cohort is the quietest
  version of it.**
- **The February sibling's live channel, replicated in sign and refused on significance.**
  USD/JPY median **0.318%** (43 Outlook-meeting accounts) vs **0.208%** (43 non-Outlook) = **1.53×**,
  against its regime-normalised **1.450 / 0.888 = 1.63×**. Permutation **p = 0.119** (two-sided,
  100k). Registered as **FT-boj-summary-of-opinions-2026-11-10-2**.
- **The equity half of that split is flat — new, and it closes the sibling's open half.** Nikkei
  0.705% vs 0.741% (**p = 0.826**), S&P 0.372% vs 0.449% (**p = 0.748**). The richer document does
  not produce the bigger equity move; if anything it is quieter.
- **The cohort noise band — the number the next session should reuse.** Ten random 2016+ Nikkei
  sessions produce a median ≥ **1.264%** with probability **0.080** and a mean ≥ 1.555% with
  probability 0.044; eleven produce a median anywhere in **0.330%-1.201%** (p05-p95) — i.e. **0.49×
  to 1.80×** the baseline median. **A cohort ratio inside that band is not evidence about the BoJ.**
- **Corridor discovery — the bond market is shut the day after the CPI.** SIFMA's own US 2026 panel
  reads `Veterans Day` / `Wednesday, November 11, 2026` with no early-close note (a full closure),
  while NYSE's 2026-2028 grid carries **no Veterans Day row at all** — equities trade a full session.
  Filed as [`sifma-bond-market-closure-2026-11-11`](sifma-bond-market-closure-2026-11-11.md)
  (estimate) in this PR. The rates read of the 11-10 CPI is deferred to 11-12.
- **The pair rule's live 2026 instance, and it is the modal one.** The Sept-MPM Minutes publish
  **2026-11-05** ([`boj-minutes-2026-11-05`](boj-minutes-2026-11-05.md)) — exactly **5 days** before
  this Summary, the mode (45 of 84) of the schedule law
  [`boj-minutes-2026-12-23`](boj-minutes-2026-12-23.md) settled **84/84**.
- **Watch (dated)** — BoJ decision **2026-09-18** (est) · Sept SoO **2026-10-01** (est) · **BoJ
  decision + Outlook 2026-10-30** (est, [ledger](boj-decision-2026-10-30.md)) — the meeting this
  document summarises · **US midterm elections 2026-11-03** (Tokyo shut, Culture Day) ·
  Sept-MPM **Minutes 2026-11-05** (est) · **Jobs 2026-11-06** (confirmed, high) · **this release
  2026-11-10** (est) + **CPI** (confirmed, high) + **tariff-truce expiry** (est, high) + **CRWV
  print** · **bond market closed 2026-11-11** (est, proposed here) · **PPI 2026-11-13** (confirmed) ·
  Japan Oct national CPI **2026-11-20** (est) · **FOMC + dots 2026-12-09** (confirmed) · **BoJ
  decision 2026-12-17/18** (est) · this meeting's own **Minutes 2026-12-23** (est).

## Initial research

### The question, plainly

Four sibling ledgers already answer the generic question, and this session does not re-litigate any
of them. [March 2027](boj-summary-of-opinions-2027-03-29.md) parsed all **86** Summaries of Opinions
and measured the release as a non-event (S&P **0.84×** an ordinary session, direction a coin flip).
[December 2026](boj-summary-of-opinions-2026-12-28.md) added a matched dead-week control and an
acting/holding split. [February 2027](boj-summary-of-opinions-2027-02-01.md) added the Outlook-meeting
cut on the yen and the monopoly-window framing. [`boj-minutes-2026-12-23`](boj-minutes-2026-12-23.md)
settled the schedule law **84/84**.

What is left is not another refusal. It is that **two of those cuts were reported as live**, both at
sample sizes small enough that the honest next question is *how large a ratio does noise produce at
this n?* — and nobody had asked it. This venue is the right place to ask, because it is itself an
**Outlook**-meeting account (so the February cut applies to it directly) and it belongs to a
**cohort** (October MPMs) whose own headline number is the loudest on the calendar.

**One-line verdict: both live cuts fail their own noise test — the Outlook-meeting yen premium
replicates in sign but returns permutation p = 0.119, its equity half is flat at p = 0.83 / p = 0.75,
and the October cohort's 1.89× Nikkei median is an 0.080 bootstrap draw that collapses to 1.03× on
removing one post-election bar.** The stance is stand aside, as at every sibling. What this session
adds is the **band** — the range a cohort ratio has to beat before it means anything — plus the
sharpest attribution problem on the calendar and one new dated corridor event.

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), plus
measured legs run entirely in this session. Primaries fetched raw and machine-parsed today
(2026-09-05), never through a summariser: the **BoJ Monetary Policy Meetings schedule** (HTTP 200,
41,959 bytes, both year tables); the **BoJ's eleven Summary-of-Opinions year archives, 2016-2026**
(HTTP 200 each, every row parsed to a `(publication date, meeting date)` pair — **86 releases**,
independently reproducing the siblings' count); the **BoJ's Outlook Report archive** (HTTP 200,
60,794 bytes — 59 `"The Bank's View"` publication dates, 2008-2026, which is this session's
Outlook/non-Outlook classifier and is *primary*, not a month heuristic); **JPX's own market calendar**
(HTTP 200, 33,103 bytes); **SIFMA's holiday schedule** (HTTP 200, 298,899 bytes); and **NYSE's
hours-and-calendars grid** (HTTP 200 after its 302, 109,180 bytes). Price work uses the **Yahoo daily
bars `event-material-scan.mjs` itself uses** (`^N225`, `^GSPC`, `JPY=X`, `^VIX`), the same source the
December sibling used; **FRED was again unreachable from this runner** (connection reset, not an HTTP
status). No instrument scripts: `symbols: []`, there is no issuer, and
`earnings-cycle.mjs`/`intraday-edges.mjs` have no macro mode. Adjacency computed mechanically with
`computeAdjacentIds` against the live calendar on the same ±5-day window the probe uses.

### Conviction legs, tested

1. **The population result replicates a third time — SUPPORTED, and it is the licence for the cuts
   below.** All 86 accounts, 2016-01-08 → 2026-08-10, measured on Yahoo bars from 2016-01-01:

   | Series | Baseline 2016+ | SoO days (n=86) | Ratio (mean) | Ratio (median) |
   |---|---|---|---|---|
   | Nikkei 225 | 0.949% mean / 0.668% median (n=2,604) | **1.147% / 0.737%** | **1.21×** | 1.10× |
   | S&P 500 | 0.729% / 0.490% (n=2,679) | **0.649% / 0.409%** | **0.89×** | 0.83× |
   | USD/JPY | 0.407% / 0.305% (n=2,773) | 0.333% (n=76) | 0.82× | — |

   The Nikkei's 1.21× matches the March sibling's FRED figure to two decimals and the December
   sibling's Yahoo re-derivation exactly. **Publication lag: median 10 days, range 7-21.** Nothing
   here is new; the leg exists so the cuts below are cuts of a population three sessions agree on.

2. **The Outlook/non-Outlook split partitions the population exactly in half, and the classifier is
   primary — SUPPORTED, and this is the scaffold for legs 3-4.** The BoJ's Outlook Report archive was
   parsed for every `"(month) YYYY (The Bank's View)"` row (59 dates, 2008-2026) and joined to each
   summarised meeting's **final day**. The join is **43 / 43**, and it separates cleanly by meeting
   month — Outlook meetings are months **1, 4, 7, 10**, non-Outlook are **3, 6, 9, 12**, with no
   crossover in either direction. A primary source and a month heuristic agreeing perfectly is the
   cheapest possible validation of the classifier, and it is worth stating because the December
   sibling's acting/holding classifier had a **named gap** and this one does not.

3. **The February sibling's live yen channel replicates in sign and magnitude — and does not clear a
   permutation test — MIXED, and this is the correction this session books.** The sibling reported
   regime-normalised USD/JPY at **1.450** on Outlook-meeting SoO days against **0.888** on
   non-Outlook ones (**1.63×**), and read that as *"this class retains 41% of the decision's excess
   and the other class retains nothing."* Measured here on raw close-to-close \|move\| — a different
   statistic, a different data source, the same 86 releases:

   | Cut | n | USD/JPY median | USD/JPY mean | vs baseline (mean) |
   |---|---|---|---|---|
   | Outlook-meeting accounts | 39 | **0.318%** | 0.405% | **1.00×** |
   | Non-Outlook accounts | 37 | **0.208%** | 0.257% | **0.63×** |

   **Ratio 1.53× on the median, 1.58× on the mean, against the sibling's 1.63%** — an independent
   replication of the point estimate, which matters and is stated first. But a two-sided permutation
   test on the median difference (100,000 shuffles of the pooled 76 observations) returns
   **p = 0.119**. At this n the split is **not distinguishable from chance**. The honest reading is
   not that the sibling is wrong — it is that its number is an *unrejected hypothesis* and should be
   sized as one. Registered out-of-sample as **FT-boj-summary-of-opinions-2026-11-10-2**.

4. **The equity half of the Outlook split is flat and faintly inverted — SUPPORTED, and no sibling
   had run it.** Same 43/43 partition, same permutation test:

   | Series | Outlook (n=43) | Non-Outlook (n=43) | Difference | Permutation p |
   |---|---|---|---|---|
   | Nikkei 225 median | 0.705% (1.06× baseline) | 0.741% (1.11×) | **−0.036** | **0.826** |
   | S&P 500 median | **0.372%** (0.76×) | **0.449%** (0.92×) | **−0.077** | **0.748** |
   | Nikkei 225 mean | 1.074% (1.13×) | 1.219% (1.28×) | — | — |
   | S&P 500 mean | 0.568% (0.78×) | 0.730% (1.00×) | — | — |

   **The account of a meeting that produced fresh staff projections is not a bigger equity event than
   the account of a meeting that produced none — it is marginally quieter, at p ≈ 0.8.** This closes
   the half of the February sibling's cut it could not run, and it is the leg that makes the
   February ledger's own conclusion (*"the one channel where this venue is measurably live is the
   yen"*) structurally correct even though leg 3 weakens the yen number itself.

5. **The October-MPM cohort is the tightest date cohort in the population — SUPPORTED, n=10,
   complete.** All ten accounts of an October meeting land inside **Nov 8-11**:

   | MPM | SoO | Lag | Weekday | Nikkei | S&P 500 | USD/JPY |
   |---|---|---|---|---|---|---|
   | 2016-10-31/11-01 | 2016-11-10 | 9 | Thu | **+6.725%** | +0.195% | +0.784% |
   | 2017-10-30/31 | 2017-11-09 | 9 | Thu | −0.197% | −0.376% | +0.146% |
   | 2018-10-30/31 | 2018-11-08 | 8 | Thu | +1.816% | −0.251% | +0.162% |
   | 2019-10-30/31 | 2019-11-11 | 11 | Mon | −0.257% | −0.196% | −0.044% |
   | 2020-10-28/29 | 2020-11-09 | 11 | Mon | +2.116% | +1.170% | −0.338% |
   | 2021-10-27/28 | 2021-11-08 | 11 | Mon | −0.353% | +0.089% | −0.318% |
   | 2022-10-27/28 | 2022-11-08 | 11 | Tue | +1.251% | +0.560% | −0.148% |
   | 2023-10-30/31 | 2023-11-09 | 9 | Thu | +1.492% | −0.808% | +0.311% |
   | 2024-10-30/31 | 2024-11-11 | 11 | Mon | +0.083% | +0.097% | −0.180% |
   | 2025-10-29/30 | 2025-11-10 | 11 | Mon | +1.264% | **+1.540%** | +0.568% |

   A **four-calendar-day window across a decade**, against the population's 7-21 day lag range; **six
   of the ten sit at exactly 11 days**, which is 2026's lag (Oct 30 → Nov 10). On the S&P the cohort
   is **0.528% mean / 0.376% median = 0.72× / 0.77×** the baseline — **the quietest US cell of any
   SoO cohort**, and only one of the ten cleared 2× the baseline.

6. **The cohort's Nikkei number looks live and is not — SUPPORTED, and it is this session's
   methodological contribution.** The cohort's Nikkei mean is **1.555%** (1.64× the 0.949% baseline)
   and its median **1.264%** (**1.89×** the 0.668% baseline median). Against a **matched control** —
   all Nov 8-11 sessions 2016+, with the ten cohort dates *excluded* so the samples do not overlap
   (n=19, mean 0.911%, median 0.559%) — it measures **1.71× on the mean and 2.26× on the median**.
   Which looks like the first genuinely loud SoO cell this calendar has found. Three tests kill it:
   - **The trim.** Removing **2016-11-10** — +6.725%, the largest Nikkei move in the entire
     86-release population, and the post-US-presidential-election rally — takes the cohort mean to
     **0.981%**, i.e. **1.03×** the all-year baseline and **1.08×** the matched control. One
     observation carries the whole mean effect.
   - **The bootstrap.** Drawing ten random 2016+ Nikkei sessions 200,000 times,
     **P(median ≥ 1.264%) = 0.080** and **P(mean ≥ 1.555%) = 0.044**. At n=10 an 0.08 draw is not a
     finding, and eight cohorts were examined.
   - **The band.** Across the eight meeting-month cohorts the Nikkei median ratio runs **Jun 0.59× ·
     Apr 0.61× · Dec 0.66× · Jul 0.89× · Jan 1.25× · Sep 1.61× · Oct 1.89× · Mar 2.15×**, while a
     random draw of n=11 produces a median anywhere in **0.330%-1.201%** (p05-p95) — **0.49× to
     1.80×**. **Seven of the eight observed cohorts sit inside the band pure sampling noise
     generates.** Only March is clearly outside; October is marginal.

   The synthesis is the December sibling's finding turned the other way up. There it was *the quiet
   belongs to the week, not the document*. Here: **the apparent noise belongs to the sample size, not
   the document** — and the two cannot both be properties of a Summary of Opinions, because the
   cohorts disagree with each other far more than either disagrees with the baseline.

7. **A definitional note the next session needs, so the two ledgers are not read as contradicting —
   SUPPORTED, stated rather than buried.** The December sibling's December cohort is **n=10**, keyed
   to accounts **published** in December; this session groups by the **meeting's** month, which puts
   **eleven** in the December cell — the extra one being the Dec-2015 meeting's account, published
   **2016-01-08**. Both definitions are defensible and neither is re-stated as the other's. Where
   this ledger cites a December number it is the meeting-month one (Nikkei median 0.440%, 0.66×).

8. **The 11-10 US bar is the most contaminated meeting-account date on this calendar — SUPPORTED,
   from the live calendar.** `computeAdjacentIds` on the probe's own ±5-day window:

   | Date | Event | Impact | Status |
   |---|---|---|---|
   | 2026-11-05 | [Sept-MPM BoJ Minutes](boj-minutes-2026-11-05.md) (08:50 JST) | low | estimate |
   | 2026-11-05 | Productivity & Costs, Q3 preliminary | medium | confirmed |
   | 2026-11-06 | [Employment Situation](jobs-2026-11-06.md) (Oct data) | **high** | **confirmed** |
   | **2026-11-10** | **this release** (08:50 JST = 18:50 EST 11-09) | **low** | **estimate** |
   | 2026-11-10 | [CPI](cpi-2026-11-10.md) (Oct data, 08:30 ET) | **high** | **confirmed** |
   | 2026-11-10 | [US-China tariff-truce expiry](us-china-tariff-truce-expiry-2026-11-10.md) | **high** | estimate |
   | 2026-11-10 | **CRWV earnings print** | **critical** | estimate |
   | 2026-11-11 | **Bond market closed, Veterans Day** (proposed here) | low | estimate |
   | 2026-11-12 | Monthly Treasury Statement (Oct, first month of FY2027) | medium | confirmed |
   | 2026-11-13 | PPI (Oct data) | medium | confirmed |

   **Nothing else on this calendar puts a BoJ meeting account in the same session as a confirmed
   high-impact macro print AND a tracked-name earnings print.** The December sibling's competing item
   was one medium-impact report; the February sibling's was an ISM print and a three-sessions-prior
   FOMC. Here the BoJ is the **fourth** candidate of four on its own date, and the honest consequence
   is that the standard sibling forward test — "the S&P exceeds 2× baseline" — is **uninformative at
   this venue before it is registered**, which is why neither test below is written on the S&P.

9. **The Tokyo bar, by contrast, is clean — and mechanically so — SUPPORTED, primary.** The schedule
   page states the release time verbatim (*"Summary of Opinions It will be released at 8:50 a.m."*)
   and the December sibling extracted the same 08:50 JST from the August-2026 edition's own embargo
   line. Three consequences, all arithmetic. **(a)** 08:50 JST is **10 minutes before** the 09:00 JST
   cash open, so the Nikkei's 11-10 bar contains the release in full — which is why legs 5-6 measure
   it there. **(b)** **08:50 JST Tue 2026-11-10 = 18:50 EST Mon 2026-11-09** (JST UTC+9, EST UTC−5;
   US DST ends 2026-11-01, so this is EST, not EDT) — roughly **50 minutes** into the Monday-evening
   Globex reopen. **(c)** Tokyo's 11-10 session **closes 15:30 JST = 01:30 EST**, seven hours before
   the 08:30 ET CPI, so **the CPI lands in Tokyo's 11-11 bar, not its 11-10 bar.** JPX's own calendar,
   parsed today, lists exactly two November 2026 closures — **Nov. 3 (Tue.) Culture Day** and
   **Nov. 23 (Mon.) Labor Thanksgiving Day** — so 11-10 is an ordinary Tokyo session.

10. **The exact-date precedent is a warning, not a datum — SUPPORTED, n=1, and it is the cleanest
    illustration of leg 8.** **2016-11-10** is an October-cohort Summary of Opinions on the
    *identical calendar date* as 2026's. Its Nikkei bar, **+6.725%**, is the largest in the entire
    86-release population. It had nothing to do with the Bank of Japan: it was the second session
    after the 2016 US presidential election. And 2026's release sits **seven days after the
    2026 US midterm elections** (2026-11-03, tracked, and a Tokyo market holiday). **The single
    loudest observation this venue owns is a US political event wearing a BoJ date** — which is both
    why leg 6 trims it and why leg 8's attribution rule is written as strictly as it is.

11. **This document's monopoly on the October meeting is ordinary, not long — SUPPORTED,
    arithmetic.** It is the only public account of the Oct 29-30 meeting from 2026-11-10 until the
    full Minutes on **2026-12-23**: a **43-day** window. The February sibling measured January's
    monopoly at a median **50 days** against an all-month median of **41** and December's **30**, so
    43 is unremarkable — this Outlook meeting's account does *not* inherit the January-style long
    monopoly that made the February venue "the strongest structural case a BoJ meeting account will
    ever get." The full sequence for the Oct 29-30 MPM: day 0 (Statement + Outlook Report,
    [2026-10-30](boj-decision-2026-10-30.md)), **+11 (this Summary)**, +54
    ([the Minutes, 2026-12-23](boj-minutes-2026-12-23.md)), ~10 years (the transcript).

12. **The schedule law's live 2026 instance holds, at its modal value — SUPPORTED, primary.** The
    Bank's own 2026 table gives the **September MPM its Minutes on Nov. 5 (Thurs.)** — five days
    before this Summary of the *October* meeting. That is exactly the pattern
    [`boj-minutes-2026-12-23`](boj-minutes-2026-12-23.md) settled at **84/84 with zero inversions**
    (median gap 5 days, mode exactly 5 at 45/84). Nothing new is claimed; the leg records that the
    2026 corridor is the law's modal case rather than an exception, which is what the next pulse
    needs to know before it re-checks anything.

13. **One new dated corridor event, from two primaries — SUPPORTED, and it is not decorative.**
    SIFMA's US 2026 panel reads `Veterans Day` / `Wednesday, November 11, 2026` with **no early-close
    note** — the full-closure shape, distinct from the `Early Close (2:00 p.m. Eastern Time)` entries
    elsewhere in the same panel. NYSE's grid, which states *"All NYSE markets observe U.S. holidays
    as listed below for 2026, 2027, and 2028"*, carries **no Veterans Day row in any of the three
    years**. So the recommended cash Treasury tape is dark on 11-11 while equities trade a full
    session — **the day after a confirmed high-impact CPI print**. Filed as
    [`sifma-bond-market-closure-2026-11-11`](sifma-bond-market-closure-2026-11-11.md), estimate, in
    this PR. It is the only *full-day* cross-asset split in the forward window (the three tracked
    `sifma-bond-early-close` entries shorten the bond session; this one removes it), and it means the
    rates confirmation of the 11-10 CPI is deferred to 11-12.

14. **No tracked symbol carries a channel this calendar instruments — SUPPORTED, inherited,
    unchanged, with one sharpening.** `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none is
    rates- or FX-keyed. The sharpening is that **the 11-10 session does carry a tracked-name channel
    — CRWV's print — and the BoJ does not own it.** A same-day CRWV move is an earnings event with
    its own [ledger](crwv-2026-11-10-print.md), and reading it as anything else is the exact error
    leg 10 documents happening in 2016.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-11-10. Four rules:

- **Read-only.** This entry's marginal value is the noise band (leg 6), the equity half of the
  Outlook split (leg 4), the correction to the February sibling's yen number (leg 3), the attribution
  problem (leg 8) and the 11-11 bond closure (leg 13) — not a view.
- **Never price this venue off the 11-10 US bar.** Three higher-impact channels own that session.
  Any threshold written on the S&P for 2026-11-10 is measuring CPI, tariffs and CRWV.
- **If a number is wanted, take Tokyo's.** The 11-10 Nikkei bar is the only clean one, and the
  October cohort's own history says to expect an ordinary session there: **P(median ≥ 1.264%) = 0.080**
  says the cohort's loud median is a draw, not a forecast.
- **Retire single-cohort SoO ratios as evidence.** Seven of eight month-cohorts sit inside the
  random-draw band. A future ledger citing a cohort ratio should cite this band beside it or not
  cite the ratio.

### Honest limits

**Leg 3's replication is a replication of a point estimate, not of a method** — the February sibling
regime-normalised USD/JPY against a rolling all-day mean and this session did not; the two numbers
agree at 1.53-1.58× vs 1.63× because the effect is large in both, not because the statistics are the
same one, and the permutation test applies only to the version measured here. **Every p-value in this
document is a permutation or bootstrap p on same-day association, not a causal identification** —
none of it separates the release from whatever else happened that morning, and legs 3-4 in particular
pool eleven years across three distinct BoJ policy regimes (QQE-with-YCC, the 2024 exit, the current
tightening cycle) without conditioning on any of them. **The bootstrap in leg 6 draws from all 2016+
sessions i.i.d.**, which ignores volatility clustering; clustering would make extreme cohort medians
*more* likely by chance, not less, so the leg's conclusion is conservative in the direction that
matters, but the exact 0.080 should be read as an order of magnitude. **Leg 5's cohort is n=10 and
leg 10 is n=1**, both stated as such. **The CPI-collision claim in leg 8 is about 2026 only** — this
session could not source *historical* US CPI release dates to test whether earlier October-cohort
accounts also shared a session with a CPI print, because **bls.gov returned HTTP 403 to this runner on
every attempt**; the 2026 collision itself rests on our own `BLS:`-sourced **confirmed** calendar
entry and is not in doubt, but "is this cohort systematically CPI-collided?" is an **open question,
not a finding**. **FRED was unreachable again**, so nothing here is directly comparable to the March
sibling's FRED figures — leg 1 exists to show the sources agree where they overlap. **Yahoo stamps
`JPY=X` daily bars at the 23:00 UTC Tokyo roll**, the labelling caveat two sibling ledgers already
recorded, so leg 3's FX cells can be off by one session; that cuts against leg 3's own point estimate
as readily as for it, and nothing positional is built on either. **Every date here is `estimate`**,
including both BoJ ones and the proposed 11-11 closure, because the confirmed-prefix taxonomy has no
slot for the Bank of Japan or for an industry trade association's recommendation. And this is a
**D-66** initial research on the account of a meeting that two decisions stand in front of; nothing
here forecasts what the October board will say, only what the record of it is worth.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely.** No position, no play, no size, in any
branch. Four analytical positions, none of them positional.

First, **the two cuts this calendar had called live both fail their own noise test.** The February
sibling's Outlook-meeting yen premium **replicates in sign and magnitude** on an independent measure
and data source (USD/JPY median **0.318%** vs **0.208%**, **1.53×**, against its regime-normalised
**1.63×**) and returns **permutation p = 0.119** — an unrejected hypothesis, to be sized as one, not
a measured property. Its **equity half, which no sibling had run, is flat and faintly inverted**:
Nikkei 0.705% vs 0.741% (**p = 0.826**), S&P 0.372% vs 0.449% (**p = 0.748**). The richer document is
not the bigger equity event.

Second, **this venue's own flattering statistic is a sampling artefact, and the band is now
measured.** The October cohort's Nikkei median of **1.264%** is 1.89× baseline and 2.26× a matched
Nov 8-11 control — but **P(median ≥ 1.264%) = 0.080** for ten random sessions, the eight month
cohorts span **0.59×-2.15×** against a random-draw band of **0.49×-1.80×** at n≈11, and one trim
(**2016-11-10**, the post-election rally) takes the cohort mean from 1.64× to **1.03×**. **Seven of
eight cohorts are inside the noise band.** Any future SoO ledger citing a cohort ratio should cite
this band beside it.

Third, **the 11-10 US bar is unusable and the 11-10 Tokyo bar is clean, both for mechanical
reasons.** The US session carries a confirmed high-impact [CPI](cpi-2026-11-10.md), a high-impact
[tariff-truce expiry](us-china-tariff-truce-expiry-2026-11-10.md) and a **critical**-impact
tracked-name print (CRWV) — the BoJ is the fourth candidate of four, which is why **no forward test
below is written on the S&P**. Tokyo closes 15:30 JST = **01:30 EST**, seven hours before the CPI,
so the Nikkei's 11-10 bar holds the Summary and not the print. The release itself lands **18:50 EST
Monday 2026-11-09**, ~50 minutes into the Globex reopen. And **2016-11-10 — the identical calendar
date, the same cohort, the population's largest Nikkei bar at +6.725% — was the post-US-election
rally**, which is the attribution problem in one observation.

Fourth, **this ledger books one new dated corridor event and one structural correction.** SIFMA's own
2026 panel and NYSE's own holiday grid together establish that the **US bond market is closed all day
on 2026-11-11 while equities trade a full session** — the day after the CPI, so that print's rates
confirmation is deferred to 11-12; filed as
[`sifma-bond-market-closure-2026-11-11`](sifma-bond-market-closure-2026-11-11.md) (estimate) in this
PR. And this document's monopoly on the October meeting is **43 days**, ordinary against the February
sibling's 41-day all-month median — this Outlook meeting's account does **not** inherit January's
long-monopoly structural case. Estimates widen caution and license nothing.

**Kill switches:**

- **Date kill:** the BoJ moving the Oct 29-30 MPM, or publishing this Summary of Opinions on any date
  other than **2026-11-10**. The cohort's observed window is Nov 8-11 at a lag of 8-11 days, so a
  slip is a *re-dating*, not a surprise. Registered as **FT-boj-summary-of-opinions-2026-11-10-3**,
  score by **2026-11-12**. Re-check every pulse against boj.or.jp/en/mopo/mpmsche_minu/.
- **Corridor kill:** the BoJ publishing the Oct 29-30 Minutes on any date other than **2026-12-23**,
  the Sept-MPM Minutes on any date other than **2026-11-05**, or attaching **no** Outlook Report to
  the Oct 29-30 MPM (the schedule's `Oct. 30 (Fri.)` cell would be wrong). The first two break legs
  11-12; the third breaks legs 2-4's classification of this very event. Re-check every pulse.
- **Cohort-noise kill (registered):** the **2026-11-10 Nikkei 225** close-to-close \|move\| coming in
  **at or below 1.264%**, the October-cohort median — i.e. the cohort's apparent loudness does not
  repeat out of sample. Registered as **FT-boj-summary-of-opinions-2026-11-10-1**, score by
  **2026-11-11**, at **Low** confidence: the threshold is a median and so a ~50% base rate by
  construction (5 of 10 in-sample), and its value is that it is the **11th** observation on a cohort
  built from ten. Tokyo is open that day and the CPI lands after its close, so the bar is clean.
- **Yen-channel kill (registered):** the **2026-11-10 USD/JPY** close-to-close \|move\| coming in
  **at or below 0.318%**, the Outlook-meeting SoO median — the out-of-sample test of leg 3's
  **p = 0.119**. Registered as **FT-boj-summary-of-opinions-2026-11-10-2**, score by **2026-11-11**,
  at **Low** confidence for the same construction reason, and with the caveat that Yahoo's `JPY=X`
  bar is stamped at the 23:00 UTC roll. A breach *plus* a tape that names the BoJ would be the first
  real evidence for the February sibling's channel; a breach on a CPI day is not.
- **Attribution kill:** any 2026-11-10 **US** session move being credited to this release by anyone,
  in this repo or outside it, without first ruling out CPI, the tariff-truce expiry and CRWV. Leg 8
  says that credit cannot be earned on that bar at all; if a future session writes it anyway, this
  ledger is the receipt.
- **Content kill:** the BoJ changing what a Summary of Opinions contains — attributing opinions to
  named members, publishing a vote count, or moving the 08:50 JST embargo. Any of those makes the
  86-release population non-comparable and this document is re-derived. Re-check every pulse.
- **Channel kill:** a tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 →
  2026-11-09** that the tape attributes to a BoJ Summary of Opinions. Leg 14's claim would be false.
  Re-check every pulse. (The 11-10 session itself is excluded by construction — CRWV prints that day.)
- **Relevance kill (upward):** the **2026-10-30** decision changing the guideline for money market
  operations. The December sibling measured acting-meeting accounts at **1.8×** holding on the Nikkei
  median and *below* holding on the S&P; this venue would then be an acting **and** Outlook account,
  the only such combination in the forward window, and legs 5-6's cohort cut would need re-running on
  that subset rather than patched. Observe by **2026-10-31**.

Three forward tests registered in
[`forward-tests/boj-summary-of-opinions-2026-11-10.md`](../forward-tests/boj-summary-of-opinions-2026-11-10.md)
— **-1** (the cohort-noise test on the clean Tokyo bar), **-2** (the out-of-sample yen-channel test)
and **-3** (the schedule/date test). One dated adjacent event proposed as `estimate` in the same PR:
[`sifma-bond-market-closure-2026-11-11`](sifma-bond-market-closure-2026-11-11.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-66 | Initial research banked (above). **This session's contribution is a noise band, and it retires both cuts this calendar had called live.** *Scaffold:* all **86** SoOs re-parsed off the Bank's own year archives (Nikkei **1.21×** an ordinary session, S&P **0.89×**, lag median 10d) — a third source agreeing with the March and December siblings, so the cuts below are cuts of a settled population. **Cut 1 — the Outlook split, classifier PRIMARY and exact.** The BoJ's Outlook Report archive (59 `"The Bank's View"` dates, 2008-2026) joined on meeting end-date partitions the 86 accounts **43/43**, separating perfectly by meeting month (Outlook = 1/4/7/10, non = 3/6/9/12) — no classifier gap, unlike December's title-based acting/holding rule. **The [February sibling](boj-summary-of-opinions-2027-02-01.md)'s live yen channel replicates in sign and fails significance:** USD/JPY median **0.318%** (Outlook, n=39) vs **0.208%** (non, n=37) = **1.53×**, against its regime-normalised 1.450/0.888 = 1.63× — but two-sided permutation (100k) **p = 0.119**. An unrejected hypothesis, not a property. **And its equity half, which no sibling ran, is FLAT and faintly inverted:** Nikkei 0.705% vs 0.741% (**p = 0.826**), S&P **0.372% vs 0.449%** (**p = 0.748**) — the richer document is *quieter*. **Cut 2 — the October cohort, and it is the methodological finding.** All **10** October-MPM accounts land **Nov 8-11** (lags 8-11, six at exactly 11, 2026's lag) — the tightest date cohort in the population. Their Nikkei median **1.264%** is **1.89×** baseline and **2.26×** a matched Nov 8-11 control (n=19, cohort dates excluded). **It is a draw, not a finding:** bootstrap **P(median ≥ 1.264%) = 0.080** and **P(mean ≥ 1.555%) = 0.044** for ten random sessions; the eight month-cohorts span **0.59×-2.15×** against a random-draw p05-p95 band of **0.49×-1.80×** at n≈11, so **seven of eight sit inside the noise**; and one trim — **2016-11-10, +6.725%, the post-US-election rally and the population's largest Nikkei bar** — takes the cohort mean from 1.64× to **1.03×**. On the S&P the cohort is **0.72×**, the quietest US cell measured. *Definitional note so the two ledgers are not read as contradicting:* December's n=10 keys on **publication** month, this session on **meeting** month (n=11 in the December cell, the extra being the Dec-2015 account published 2016-01-08). **The attribution problem, and it is the calendar's worst:** the 11-10 US session carries **[CPI](cpi-2026-11-10.md) (confirmed, high, 08:30 ET) + [US-China tariff-truce expiry](us-china-tariff-truce-expiry-2026-11-10.md) (estimate, high) + CRWV's print (critical)** — the BoJ is the fourth candidate of four, so the standard sibling test ("S&P > 2× baseline") is uninformative before registration and **neither registered test is written on the S&P**. **The Tokyo bar is the clean one, mechanically:** 08:50 JST is 10 min before the cash open and Tokyo closes **15:30 JST = 01:30 EST**, seven hours *before* the CPI — which lands in Tokyo's **11-11** bar. Release timing **08:50 JST Tue 11-10 = 18:50 EST Mon 11-09** (EST — US DST ends 11-01), ~50 min into the Globex reopen. **The exact-date precedent is a warning:** 2016-11-10 was an October-cohort SoO on the identical date, and its +6.725% was the second session after the US presidential election; 2026's sits **7 days after the midterms** (2026-11-03, tracked, a Tokyo holiday). **Monopoly window 43 days** (to the [Minutes 2026-12-23](boj-minutes-2026-12-23.md)) — ordinary against February's 41-day all-month median, so this Outlook account does **not** inherit January's long-monopoly case. **Schedule law's live instance holds at its mode:** Sept-MPM [Minutes 2026-11-05](boj-minutes-2026-11-05.md) precede this by exactly **5 days**, the mode (45/84) of the 84/84 law. Adjacency sweep: **peers** — none, `symbols: []`, but `earnings-calendar.ts` puts **CRWV's print on this exact date** (estimate, `critical` as an event), the only BoJ meeting-account date on this calendar that collides with a tracked name. **Macro** — nine tracked items in the ±5d window incl. **jobs 11-06 (confirmed, high)**, CPI + tariff expiry 11-10, MTS 11-12, PPI 11-13. **Volatility** — VIX **14.53** (2026-09-04 close, Yahoo); Nikkei **65,020.94**, S&P **7,718.60**, USD/JPY **156.22** (all 2026-09-04). **Geopolitical** — the 11-10 tariff-truce expiry is tracked separately and is a US-China channel, not a BoJ one; nothing new beyond the Takaichi-constraint and intervention channels the [10-30 ledger](boj-decision-2026-10-30.md) owns. **Event tape** — **JPX's own calendar (parsed today) lists only Nov. 3 (Culture Day) and Nov. 23 (Labor Thanksgiving) as November 2026 closures**, so 11-10 is an ordinary Tokyo session; and **one new dated corridor event discovered from two primaries** — SIFMA's US panel reads `Veterans Day / Wednesday, November 11, 2026` with **no** early-close note (full closure) while **NYSE's 2026-2028 grid carries no Veterans Day row at all**, so the cash Treasury tape is dark on 11-11 with equities open, deferring the CPI's rates read to 11-12. Filed as `sifma-bond-market-closure-2026-11-11` (estimate). **Own weaknesses:** every p-value is same-day association, not causal, and legs 3-4 pool eleven years across three BoJ regimes without conditioning; the bootstrap draws i.i.d. and so ignores volatility clustering (which would make extreme cohort medians *more* likely by chance — conservative in the right direction, but read 0.080 as an order of magnitude); leg 3 replicates a point estimate, not a method (the sibling regime-normalised, this did not); n=10 on the cohort, n=1 on the 2016 analogue; **bls.gov returned HTTP 403 on every attempt**, so whether *past* October-cohort accounts were also CPI-collided is an **open question, not a finding** — only 2026's collision is sourced (our own `BLS:` confirmed entry); FRED unreachable again so nothing is comparable to the March sibling's FRED figures; Yahoo stamps `JPY=X` at the 23:00 UTC roll so leg 3's FX cells can be off a session; and this is **D-66** on the account of a meeting two decisions stand in front of. | — (stance set: stand aside, no position, no play; **both cuts this calendar had called live fail their own noise test — the Outlook-meeting yen premium replicates at 1.53× but returns permutation p = 0.119, its equity half is flat at p = 0.83 / p = 0.75, and the October cohort's 1.89× Nikkei median is an 0.080 bootstrap draw that collapses to 1.03× on one trim**; at **High** on the null and **Medium** on the noise-band claim, since every date here is `estimate` and the BoJ has no confirmed-prefix slot. Four commitments — never price this venue off the 11-10 **US** bar, which three higher-impact channels own; take Tokyo's bar if a number is wanted, since the CPI lands after its close; cite the **0.49×-1.80×** random-draw band beside any future single-cohort SoO ratio or do not cite the ratio; and read the 11-11 bond closure as deferring the CPI's rates confirmation to 11-12) | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
