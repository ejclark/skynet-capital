# S&P Global US Manufacturing PMI (final, Sep 2026 data) — sp-global-manufacturing-pmi-2026-10-01

**Kind:** macro-print · **Date:** 2026-10-01 (**estimate**, `EST:` — read verbatim off S&P Global's own calendar listing, pmi.spglobal.com/Public/Release/ReleaseDates, re-fetched direct by this lane 2026-09-09 HTTP 200, and corroborated by a *realized* release of the same series at the same slot on 2026-09-01 whose PDF masthead reads "Embargoed until 0945 EDT"; the `estimate` label is a **schema gap**, not date doubt — see leg 1) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","apple-eu-dma-terms-2026-10-01","bloomberg-agg-index-rebalance-2026-09-30","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","case-shiller-hpi-2026-09-29","census-benchmark-revision-nsa-2026-09-28","chicago-pmi-2026-09-30","construction-spending-2026-10-01","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","dallas-fed-mfg-2026-09-28","eia-steo-2026-10-06","eurostat-hicp-flash-2026-10-01","fhfa-hpi-2026-09-29","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","google-adtech-final-judgment-2026-10-02","government-funding-deadline-2026-09-30","intl-trade-full-report-2026-10-06","ism-manufacturing-2026-10-01","ism-services-2026-10-05","jgb-40y-auction-2026-09-29","jobs-2026-10-02","jolts-2026-09-29","m3-full-report-2026-10-02","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","pce-2026-09-30","pjm-reliability-backstop-procurement-2026-09-30","retail-benchmark-revision-2026-09-28","russell-style-quarter-end-capping-effective-2026-09-30","sp-global-pmi-commodity-price-supply-2026-10-01","sp-global-services-pmi-2026-10-05","sp-select-sector-secondary-reweight-2026-09-30","treasury-3y-note-2026-10-06","treasury-buyback-10y20y-2026-10-01","treasury-buyback-2y3y-2026-10-06","treasury-buyback-tips-1y10y-2026-09-29","treasury-coupon-announcement-2026-10-01","unsc-iran-panel-mandate-expiry-2026-09-26"],"screenStreak":0,"blocked":[{"url":"https://www.pmi.spglobal.com/Public/Home/PressRelease/04dad02019414e5ebc89ec6a04b300bd","status":"202 (empty body, 3 attempts) — July 2026 Flash US PMI","at":"2026-09-09"},{"url":"https://www.pmi.spglobal.com/Public/Home/PressRelease/c1430bf93dfa42d3bb8927edf49494db","status":"202 (empty body, 3 attempts) — June-data US Manufacturing PMI final","at":"2026-09-09"},{"url":"https://www.pmi.spglobal.com/Public/Home/PressReleases","status":"404 (the sibling ledger recorded this path as a 202; it is simply the wrong path — /Public/Release/PressReleases served 200)","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Read it, don't trade it — and this entry's whole value is that it out-of-sample tested
its services twin and came back with a correction, not a confirmation.** This print was proposed by
the [S&P Global Services 10-05 ledger](sp-global-services-pmi-2026-10-05.md) as *"a free out-of-sample
observation of the identical structure"* — same 09:45 ET slot, same ISM release fifteen minutes
behind it, three sessions earlier. Run: **the twin's conclusion survives and its test statistic does
not.** The sibling registered the *ordering* statistic — the 10:00 ISM window out-moving the 09:45
window in 3 or more of five instruments, in-sample 4/5 and 4/5. On the three **manufacturing** release
days in the same 60-day bar sample that statistic **fails on two of three days** (ISM wins **2/5,
2/5, 3/5** — 7 of 15 instrument-days), and the raw 09:45 window ranks **above** its own median on
**11 of 15** instrument-days, the exact opposite of services' 9-of-10 below. The reason is the
calendar, not the print: this final always lands on the **first working day of a month** (and 10-01 is
the first day of Q4), so its 09:45 window carries month-start flow that an all-sessions percentile
misreads as a release effect. Normalise **within the day** and the finding snaps back — the 09:45
window's share of its own 09:30–10:30 hour sits at or below its median on **20 of 25** instrument-days
across both surveys. And the information point replicates on independent data: the August revision was
**flash 53.2 → final 53.9 (+0.7**, both terms primary**)**, which turned the flash's own *"5-month
low"* headline into *"unchanged at 53.9"* — and it landed on **2026-09-01**, the **deadest** of the
three windows (SPY **p3**, IWM **p0**). Real information; the tape does not pay for it. The date is
`estimate` only because this calendar has no source prefix for a private PMI compiler. Nothing here is
a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-22) | **Stand aside** | High | `symbols: []`, no macro-keyed house playbook, no published consensus for a *final* (the flash has one; the final does not), and a print sharing 10-01 with **seven** other tracked events including a high-impact ISM at 10:00 and construction spending in the same slot. There is nothing here to size, and nothing that could be attributed to this release if it moved. | **2026-10-01:** a published, pre-release consensus appearing for the *final* manufacturing print — the "no surprise-testable moment exists here" claim is the reason this row is High rather than Medium, and a real forecast distribution would reopen it |
| This week | **Mark 09-23 — that is the only surprise-testable moment this survey has all month; and mark 09-15/09-16 for the regime** | High | The flash carries the panel *and* a published consensus (July: flash **53.8** vs a **54.3** estimate). The final carries only the revision and no forecast to be surprised against. The rate regime this all reads into is set at the **09-16 FOMC**, not here. | **2026-09-23:** S&P Global failing to publish a September Flash US PMI, or publishing it off the 09:45 ET slot — the pre-announcement mechanic is the basis of this row and the two below |
| This month | **Do not percentile-rank a first-working-day intraday window against an all-sessions distribution — normalise within the day** | Medium | This is the session's methodological finding and it is measured both ways on the same bars: raw, the 09:45 window reads **p85/p82/p78/p88/p85/p90** loud on manufacturing days; within-day, its share of the 09:30–10:30 hour is at or below median on **10 of 15** (and **9 of 10** on services). **Medium, not High: n=3 release days**, and the share ratio is unstable when the hour's move is near zero. | **2026-10-01:** the 09:45 window's share of that day's 09:30–10:30 \|move\| exceeding its own trailing median in **3 or more** of SPY/QQQ/TLT/IWM/`^TNX` — the within-day statistic breaks on the first day it is used out of sample ([FT-sp-global-manufacturing-pmi-2026-10-01-2](../forward-tests/sp-global-manufacturing-pmi-2026-10-01.md)) |
| This quarter | **Track the flash, not either final — and treat this pair's shared 09:45 slot as measured-to-nil, on the within-day evidence only** | Medium | Two finals (10-01 manufacturing, 10-05 services) revise one flash. The revisions are real — **+0.7** in August, large enough to invert the headline — and both landed in windows their own tape ignored. The slot's standing value is as a pointer to **09-23**. | **A 2026-09-23 flash whose own 09:45–10:00 window is dead quiet on the within-day statistic too** — then pre-announcement is not what makes the finals quiet, the 09:45 slot simply is, and this ledger's causal story is wrong even though its readings hold |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `symbols: []`, no macro-keyed playbook, date is `estimate`. Research is not action; an estimate widens caution and never licenses an entry.
- **The date to diary is 2026-09-23** — the flash carries the panel *and* the only published consensus in this survey's month.
- **Never percentile-rank a first-working-day window against an all-sessions distribution.** Month-start flow inflates it; normalise to that same day's 09:30–10:30 hour. This is a rule for every intraday test in this calendar, not just this one.
- **Do not read the 09:45 print as a 15-minute preview of the 10:00 ISM print** — different panels, and on 10-01 the 10:00 slot also carries construction spending.
- **A September revision beyond ±1.0pt** → the two-pair 0.40pt mean stops being the right prior and the magnitude claim is re-argued from a longer series.
- **A sub-50 headline on 10-01** → the fifteen-month output expansion and 2026's 53.2–53.9 range both break, and every base rate here stops applying.
- **Watch (dated):** GEP supply-chain volatility **09-11** · CPI **09-11** · S&P Global Investment Manager Index **09-15** · **FOMC 09-16** · **S&P Global Flash US PMI 09-23, 09:45 ET** · funding deadline + PCE + Chicago PMI + ADP **09-30** · **this print 09:45 ET + ISM mfg 10:00 ET + construction spending 10:00 ET + S&P Global commodity price & supply 11:00 ET, 10-01** · jobs **10-02** · OPEC+ **10-04** · **ISM Services + S&P Global Services PMI 10-05** · FOMC minutes **10-07** · **FOMC 10-28**.

## Initial research

### The question, plainly

The [S&P Global Services 10-05 ledger](sp-global-services-pmi-2026-10-05.md) proposed this event two
hours of repo-time ago, and it proposed it *for a purpose*, in its own words: **"the identical
09:45-then-ISM geometry three sessions earlier — a free out-of-sample test of this row's finding,
available before the finding gets used."** That finding was that the 09:45 ET S&P Global window is
measurably *quieter* than an ordinary window, which refuted the ISM ledger's "structural contaminant"
framing; it was registered as
[FT-sp-global-services-pmi-2026-10-05-1](../forward-tests/sp-global-services-pmi-2026-10-05.md),
scoring 10-06.

So the questions are inherited and sharp. **(1)** Is the date right, on this lane's own fetch rather
than a carried one? **(2)** Does the twin's finding replicate on manufacturing release days — and if
not, is the failure in the *conclusion* or in the *statistic*? **(3)** Does the manufacturing side
have any structural property the services side does not, that changes what either entry is for?

**One-line verdict:** the date holds on a primary listing *plus a realized release at the same slot*;
the twin's **conclusion survives and its registered test statistic does not**, because the
manufacturing final always lands on the **first working day of a month** and its 09:45 window is
confounded with month-start flow — a within-day normalisation separates them and replicates the
finding across both surveys; and the manufacturing side's one genuinely new property is that the
**flash carries a published consensus and the final does not**, which sharpens the twin's
"diary the flash" conclusion into a reason.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies; caches were busted anyway
(`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`) because this session
re-fetches Yahoo bars through the same layer. Four strands.

**(a) The date, from the publisher's own calendar and from a realized release.** Two direct fetches
this session: `pmi.spglobal.com/Public/Release/ReleaseDates?language=en` (**HTTP 200, 23,858 bytes**)
and `pmi.spglobal.com/Public/Release/PressReleases?language=en` (**HTTP 200, 92,883 bytes**), each
parsed to text. The second is the strand the sibling could not run — it recorded the press-release
index as blocked.

**(b) The intraday window study — the session's load-bearing measurement, run twice.** Yahoo
**5-minute** bars for **SPY, QQQ, TLT, IWM, `^TNX`**, `range=60d` (delivered 2026-06-12 → 2026-09-08;
**n=60** sessions, **51** for `^TNX`). Window construction is **identical to the sibling's**, on
purpose — *open of the bar starting at A → close of the bar starting at B−5m* — over **09:30–09:45**
(opening control) · **09:45–10:00** (the S&P Global window) · **10:00–10:15** (the ISM window) ·
**10:15–10:30** (post control), plus an **11:00–11:15** placebo. Release days: **2026-07-01**,
**2026-08-03**, **2026-09-01** — the first working day of each month, **n=3** against the sibling's
n=2. Two statistics were computed on the same bars: the sibling's **raw** percentile rank of a
window's \|move\| against that window's own all-sessions distribution, and a **within-day share** —
the 09:45 window's \|move\| as a fraction of that same day's 09:30–10:30 \|move\|, itself
percentile-ranked against its own distribution. The second exists because the first cannot tell a
loud *release* from a loud *session*, and manufacturing release days are structurally loud sessions.

**(c) A flash→final revision series, primary where reachable.** Both terms of the August pair were
fetched direct as PDFs and text-extracted this session: the **08-21 Flash US PMI**
(`552d682e…`, HTTP 200, 132,394 bytes) and the **09-01 US Manufacturing PMI final** (`bfb270a4…`,
HTTP 200, 121,394 bytes). Older releases **202'd** and are secondary or absent (see limits).

**(d) Calendar-structure computation, from the repo.** Corridor density using the same ±5-day window
`computeAdjacentIds` (`scripts/event-material-decide.mjs`) uses, over canonical files plus
non-shadowed proposals.

Spot VIX **15.72** (2026-09-08 close, this session's own `^VIX` fetch; 14.32 on 09-03, so the regime
firmed ~1.4 points over the week). The date is `estimate` and that label rides every trading-adjacent
line below.

### Conviction legs, tested

1. **The date is 2026-10-01 at 09:45 ET — SUPPORTED on a primary listing *and* on a realized release,
   which is one rung stronger than the sibling could reach; the `estimate` label is a schema gap.**
   The calendar row reads verbatim **`October 01 … 13:45 UTC S&P Global US Manufacturing PMI`**, and
   13:45 UTC is **09:45 ET** under EDT. The page's own stated rule, quoted verbatim on the same fetch,
   is **"Manufacturing PMI: first working day"**, and October 2026 opens Thursday 10-01. The new
   evidence is strand (a)'s second fetch: S&P Global's press-release index carries
   **`September 01 2026 13:45 UTC | S&P Global US Manufacturing PMI`**, and *that release's own PDF*
   opens **"Embargoed until 0945 EDT 1 September 2026 / 1345 UTC 1 September 2026."** So the slot is
   not inferred from a schedule page alone — it is observed in a shipped release. It stays `estimate`
   because `market-events-data.ts` defines **no** confirmed-source prefix covering a private PMI
   compiler (`CAL:` is *"automated aggregator cross-ref"*; this is the publisher's own primary, so
   claiming it would be dishonest), and this lane's hard limits permit a flip only on
   `IR:`/`BLS:`/`FED:`. **Fourth lane to hit the same standing gap**; named, not re-argued.

2. **The sibling's registered ordering statistic FAILS out of sample — REFUTED, and this is the
   session's main measurement.** [FT-sp-global-services-pmi-2026-10-05-1](../forward-tests/sp-global-services-pmi-2026-10-05.md)
   predicts the 10:00–10:15 ISM window out-moving the 09:45–10:00 window in **≥3 of 5** instruments;
   its in-sample support was **4/5** on 08-05 and **4/5** on 09-03. On the manufacturing twin's three
   release days, computed identically:

   | Date | SPY | QQQ | TLT | IWM | `^TNX` | ISM wins |
   |---|---|---|---|---|---|---|
   | 2026-07-01 | S&P G | S&P G | **ISM** | S&P G | **ISM** | **2 of 5** |
   | 2026-08-03 | S&P G | S&P G | **ISM** | S&P G | **ISM** | **2 of 5** |
   | 2026-09-01 | **ISM** | S&P G | S&P G | **ISM** | **ISM** | **3 of 5** |

   **7 of 15** instrument-days, and the ≥3-of-5 threshold **is not met on two of the three days**. The
   raw window ranks tell the same story from the other side — the 09:45 window on manufacturing days:

   | Instrument | 2026-07-01 | 2026-08-03 | 2026-09-01 |
   |---|---|---|---|
   | SPY | +0.283% **p85** | +0.267% **p82** | +0.007% **p3** |
   | QQQ | +0.477% **p78** | +0.456% p75 | +0.087% p22 |
   | TLT | +0.082% p60 | −0.079% p58 | +0.152% **p90** |
   | IWM | +0.488% **p88** | +0.446% **p85** | +0.007% **p0** |
   | `^TNX` | −0.089% p53 | +0.043% p14 | −0.168% p65 |

   **11 of 15 above the window's own median** and **6 of 15 at or above p78** against a 22% base rate —
   the mirror image of services' 9-of-10 below median and 1-of-10 above p78. Taken at face value this
   would *reinstate* the contaminant framing the sibling refuted.

3. **It should not be taken at face value — the confound is the first working day, and a within-day
   normalisation separates them. SUPPORTED, and it rescues the sibling's conclusion while retiring
   its statistic.** The manufacturing final lands on the **first working day of a month**, always; the
   services final lands on the third. Month-start sessions are loud in the whole 09:30–10:30 hour:
   measured, the hour's \|move\| ranked **10 of 15** above its own median and **7 of 15 at or above
   p78** on manufacturing release days, against **5 of 10** and **1 of 10** on the sibling's services
   days. So the raw percentile is scoring the *session*, not the release. Dividing out that same day's
   hour:

   | Instrument | median 09:45 share of hour | 07-01 | 08-03 | 09-01 |
   |---|---|---|---|---|
   | SPY | 46.3% | 115.7% p70 | 39.6% **p42** | 3.1% **p2** |
   | QQQ | 53.4% | 310.4% p85 | 49.9% **p43** | 52.2% **p47** |
   | TLT | 50.8% | 33.3% **p32** | 68.5% p70 | 32.4% **p30** |
   | IWM | 47.4% | 93.1% p78 | 47.4% p50 (tie) | 6.7% **p3** |
   | `^TNX` | 50.1% | 25.0% **p17** | 33.3% **p30** | 30.8% **p23** |

   **10 of 15 below median, one exactly at it.** Recomputed on the sibling's own two services days the
   same statistic gives **9 of 10 below median** (SPY p13/p28 · QQQ p3/p10 · TLT p48/p0 · IWM p98/p13
   · `^TNX` p43/p6). **Combined: 20 of 25 instrument-days at or below the median share**, against a
   50% null — one statistic that replicates across both surveys where the raw one flips sign. **The
   general rule, and it is reusable beyond this event:** never percentile-rank a first-working-day
   intraday window against an all-sessions distribution.

4. **The revision is larger on the manufacturing side and it inverted the headline — MIXED, and it is
   the strongest single observation in this ledger.** Both terms of the August pair are primary,
   fetched and extracted this session:

   | Reference month | Flash | Final | Revision | Provenance |
   |---|---|---|---|---|
   | July 2026 | 53.8 | 53.9 | **+0.1** | **secondary** — investinglive, dated 2026-08-03; the S&P Global archive PDFs 202'd (see limits) |
   | August 2026 | **53.2** | **53.9** | **+0.7** | **both primary** — flash PDF `552d682e…` (rel 08-21) and final PDF `bfb270a4…` (rel 09-01), each fetched direct HTTP 200 |

   Mean \|revision\| **0.40pt** on n=2 pairs. The August one is not a decimal adjustment — the flash
   PDF reads verbatim **"Flash US Manufacturing PMI: 53.2 (July: 53.9). 5-month low."** and the final,
   same reference month, reads **"unchanged at 53.9 in August, signaling a solid expansion."** A
   five-month low became *unchanged*. **And it landed on 2026-09-01, the deadest of the three windows
   in leg 2 — SPY p3, IWM p0, QQQ p22.** This is the sibling's synthesis reproduced on wholly
   independent data and in a harder form: not "the print is empty" but **"the print carried a
   narrative inversion and the tape did not pay for it."**

5. **The flash has a published consensus and the final does not — SUPPORTED (secondary), and it is
   the one structural property the services twin could not name.** Its ledger recorded that
   *"nobody forward-publishes a forecast for a revision,"* which is true of both finals. The
   manufacturing *flash* is different: it is forecast and reported against a consensus — July's flash
   printed **53.8 against a 54.3 estimate**, a −0.5 miss (investinglive headline, secondary). So the
   survey's only surprise-versus-expectation moment all month is **2026-09-23**, and "diary the flash"
   stops being an inference from pre-announcement and becomes a statement about where the only
   testable term is.

6. **The 10-01 corridor makes attribution hopeless — SUPPORTED, computed.** **42** tracked events sit
   within ±5 days: **22 before**, **7 same-day**, **13 after**. The same-day seven are
   `ism-manufacturing-2026-10-01` (**high** impact, 10:00 ET), `construction-spending-2026-10-01`
   (**also 10:00 ET, sharing ISM's slot**), `boj-tankan-2026-10-01`,
   `boj-summary-of-opinions-2026-10-01`, `treasury-coupon-announcement-2026-10-01`,
   `treasury-buyback-10y20y-2026-10-01` and `apple-eu-dma-terms-2026-10-01` — with the funding
   deadline the day before and payrolls the day after. The sibling's 10-05 had **one** same-day
   member. Even if this print moved the tape, nothing on 10-01 could be attributed to it.

7. **The publisher's archive is reachable for recent releases and 202s for older ones — SUPPORTED as
   a pattern, held as a hypothesis.** The sibling recorded S&P Global's press-release surface as
   blocked (202, empty body, eight attempts). This session the **index** served **HTTP 200 /
   92,883 bytes** at `/Public/Release/PressReleases?language=en` (the path the sibling tried,
   `/Public/Home/PressReleases`, is a plain **404**), and every PDF **linked from that live index**
   served 200 first try, while both PDFs reachable only via search — the July flash and the June-data
   final — returned **202 empty on three attempts each**. Operational rule for the next PMI lane:
   **harvest hashes from the live index, not from search**, and expect anything older than ~two weeks
   to be gone.

### What the conditions support

Nothing directional. The useful output is a **method correction**, a **rescued conclusion**, and a
**relocation** — in that order. **(a)** The sibling's ordering statistic should not be trusted as the
test of "is the 09:45 slot quiet"; it fails on two of three out-of-sample days for reasons that have
nothing to do with either PMI release, and the within-day share is the version that replicates
(20 of 25 across both surveys). This ledger does **not** touch
[FT-sp-global-services-pmi-2026-10-05-1](../forward-tests/sp-global-services-pmi-2026-10-05.md) — it
is the sibling's row and scores on 10-06 — but it registers the discriminating pair below so that
10-01 adjudicates the method four days *before* 10-05 adjudicates the sibling. **(b)** The twin's
actual conclusion stands and is now stronger: two surveys, five release days, and the largest
revision in each sample landing in that sample's quietest window. **(c)** Diary **2026-09-23** — the
flash carries the panel *and* the month's only published consensus. **(d)** On 10-01 itself, read the
print and attribute nothing: seven same-day tracked events, two of them in the 10:00 slot. Three
dated items: **09-23** (the flash), **10-01** (this print, which scores both tests below) and
**10-05** (the sibling's). None of that licenses an entry.

### Honest limits

**n=3 release days, and the two statistics disagree — which is the finding, not a defect, but it caps
confidence.** Sixty days of Yahoo 5-minute bars is the whole sample available at 15-minute
resolution and it holds exactly three first-working-days. Fifteen instrument-days across five
*correlated* instruments is an effective n well under fifteen; that is why leg 3 is Medium and why the
rule it proposes is registered rather than banked. **The share ratio is unstable near zero.** Its
denominator is that day's 09:30–10:30 \|move\|, and on 2026-08-05 IWM's hour moved **0.008%**,
producing a share of **4046%** — a real data point arithmetically and a meaningless one
statistically. It is left in the services tally above (where it counts *against* the finding) and is
excluded by an explicit guard in the forward test below. **The July revision pair is secondary.** The
July flash and the June-data final PDFs both returned **HTTP 202 with an empty body on three attempts
each**, logged in `probe-ref.blocked` rather than worked around; only the August pair is primary on
both terms, so leg 4's "mean" is two numbers. **Leg 5's consensus figure is a secondary headline**
(investinglive), not a forecast distribution from a survey house — it establishes *that* the flash is
forecast, which is the load-bearing part, and nothing about the quality of the forecast. **One
secondary was discarded, not averaged:** a site reporting the August final as **53.4** contradicts
S&P Global's own PDF and is not carried. **Leg 6 is a statement about the checked-in calendar, not
about the world**, and several corridor members — including both proposals filed here — are
themselves `estimate`-dated. **The percentile ranks include the release days themselves**, which
biases mildly toward rejecting the null rather than toward the finding; in leg 3 that direction cuts
*against* the conclusion this ledger reaches, so it does not flatter it. **Nothing here tests whether
the survey's content is right** — only where its information lands and whether the tape pays for it.

## Stance & kill switches

**Stance (date `estimate`; read verbatim off S&P Global's own October calendar listing by this lane's
direct fetch and corroborated by a realized 09-01 release at the same slot, and `estimate` only
because this calendar's source-prefix schema has no slot for a private PMI compiler).** Treat
**2026-10-01 09:45 ET** as a **low-impact, pre-announced revision print with no tradeable edge, on a
day where nothing could be attributed to it anyway**. No position is opened, closed or sized off it,
and no house playbook targets it. Three claims, held separately.

**Tradeability: nil, and the reason is now measured on two surveys rather than one.** The 09:45
window's share of its own 09:30–10:30 hour sits at or below median on **20 of 25** instrument-days
across five release days spanning both the manufacturing and services finals. **Method: the sibling's
raw-percentile ordering statistic is retired for first-working-day events**, having failed on two of
three out-of-sample days while the session-normalised version held — the confound is month-start
flow, and the general rule is that a first-working-day window is never comparable to an all-sessions
distribution. This is a correction to a method, not to the sibling's conclusion, which survives.
**Informational location:** the survey's information lands on the **flash, 2026-09-23** — which
carries the panel *and* the month's only published consensus — while the final carries a revision
that averaged **0.40pt** over the two pairs available, one of which (**+0.7**, August) inverted the
flash's own headline and still printed the quietest window in the sample. Base case for the September
final (**estimate**-labelled, **Low** confidence, trend extrapolation only at D-22): a revision inside
±0.7pt of the 09-23 flash, leaving the index in 2026's 53.2–53.9 range with the fifteen-month output
expansion intact. Operationally: **diary the flash; skim the final; attribute nothing on 10-01.**

**Kill switches:**

- **The 09:45–10:00 window's share of its own 09:30–10:30 \|move\| on 2026-10-01 exceeds its trailing
  median in 3 or more of SPY/QQQ/TLT/IWM/`^TNX`** — the within-day statistic breaks on the first day
  it is used out of sample, leg 3's rescue of the sibling's conclusion fails, and both statistics are
  re-measured on a longer window rather than patched. Registered as
  **FT-sp-global-manufacturing-pmi-2026-10-01-2**.
- **The 10:00–10:15 window out-moves the 09:45–10:00 window in 3 or more of the five instruments on
  2026-10-01** — the sibling's ordering statistic holds on the manufacturing twin after all, leg 2's
  refutation was a two-day accident, and the confound story in leg 3 loses its motivation. Registered
  as **FT-sp-global-manufacturing-pmi-2026-10-01-1**.
- **The September revision exceeds ±1.0pt** — the two-pair 0.40pt mean stops being the right prior and
  the magnitude claim is re-argued from a longer series.
- **A published pre-release consensus appears for the *final*** — leg 5's asymmetry is the reason the
  "This week" call is High, and a real forecast distribution for 10-01 would make the final
  surprise-testable for the first time.
- **S&P Global moves the release off the first working day, or the 13:45 UTC slot changes** — every
  geometry claim in legs 2, 3 and 6 is keyed to the 09:45-before-10:00 ordering *and* to the
  first-working-day confound; both die with the schedule.
- **A sub-50 headline on 10-01** — the fifteen-month output expansion and 2026's 53.2–53.9 range both
  break, and every base rate in this doc stops applying.
- **The July 53.8 flash proves wrong** — it is the one secondary term in leg 4 and both archive
  fetches 202'd; a primary showing a different figure changes one revision cell and cannot touch legs
  2 or 3, which read the tape rather than the survey.
- **`market-events-data.ts` gains a confirmed-source prefix covering a private PMI compiler** — this
  entry and both proposals filed with it should be promoted to `confirmed` on the listing and the
  realized release already cited, because the date was never the doubt.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-22 | Initial research banked (above); **canonical `src/domain/market-events/sp-global-manufacturing-pmi-2026-10-01.json` written this PR** from the one proposal that existed (`…from-sp-global-services-pmi-2026-10-05.json`), per EVENT-RESEARCH.md. **DATE — one rung above the sibling's.** Own fetch of the S&P Global calendar (HTTP 200, 23,858 B) gives **`October 01 … 13:45 UTC S&P Global US Manufacturing PMI`** = 09:45 ET, matching the page's rule *"Manufacturing PMI: first working day"*; and the press-release index (HTTP 200, 92,883 B) plus that release's PDF (HTTP 200, 121,394 B) show a **realized** 09-01 release whose masthead reads *"Embargoed until 0945 EDT."* Stays `estimate` on the schema gap (no confirmed prefix for a private PMI compiler) — **fourth lane to hit it**. **SESSION'S MAIN MEASUREMENT — the sibling's REGISTERED STATISTIC fails out of sample and its CONCLUSION survives.** Same bars, same window construction (Yahoo 5-min, `range=60d`, 2026-06-12..09-08, n=60 / 51 `^TNX`), release days **07-01 · 08-03 · 09-01** (first working days, n=3). [FT-sp-global-services-pmi-2026-10-05-1](../forward-tests/sp-global-services-pmi-2026-10-05.md) predicts ISM out-moving the 09:45 window in **≥3 of 5**; here it went **2/5 · 2/5 · 3/5** (7 of 15) — **failing on two of three days**. Raw 09:45 ranks ran **above** their own median on **11 of 15** and ≥p78 on **6 of 15** (22% base) — the mirror of services' 9-of-10 below. **The confound is the calendar, not the print:** manufacturing finals always land on the **first working day**, whose whole 09:30–10:30 hour ranked above median **10 of 15** and ≥p78 **7 of 15** (vs 5/10 and 1/10 on services days). Normalising the 09:45 window to that same day's hour, its share sits **at or below its own median on 10 of 15** manufacturing and **9 of 10** services instrument-days — **20 of 25 combined**, one statistic that replicates where the raw one flips sign. **Reusable rule: never percentile-rank a first-working-day window against an all-sessions distribution.** **INFORMATION POINT REPLICATES, harder than on services.** August pair fully primary from PDFs fetched direct this session: **flash 53.2 (rel 08-21) → final 53.9 (rel 09-01) = +0.7**, turning the flash's verbatim *"5-month low"* into the final's verbatim *"unchanged at 53.9"* — and it landed on **09-01, the deadest window in the sample** (SPY **p3**, IWM **p0**). July **53.8 → 53.9 (+0.1)** is secondary. Mean \|rev\| **0.40pt**, n=2 pairs. **New structural property the twin could not name:** the **flash** carries a published consensus (July flash 53.8 vs a **54.3** estimate, secondary) and the **final** does not — so 09-23 is the survey's only surprise-testable moment all month. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** payrolls 09-04 **+162k vs +55k**, September hike odds ~58% into the 09-16 FOMC — carried from the [jobs close-out](jobs-2026-09-04.md), not re-derived. **Volatility regime:** spot VIX **15.72** (09-08 close, own `^VIX` fetch), up from **14.32** on 09-03; no prior row, so this establishes the baseline. **Geopolitical:** the Middle East supply/price channel is live in the publisher's own words — the 09-01 final PDF reports difficulties *"sourcing and receiving raw materials because of supply delays and price rises… commonly linked to the war in the Middle East"*; OPEC+ meets **10-04**, carried from the [ISM sibling](ism-services-2026-10-05.md). **Event tape:** no consensus exists for the final (leg 5), so only a magnitude test is available on 10-01. **Corridor:** **42** tracked events within ±5 days — **22 before / 7 same-day / 13 after**; the same-day seven include **high-impact `ism-manufacturing-2026-10-01` and `construction-spending-2026-10-01` sharing the 10:00 slot**, so attribution on 10-01 is hopeless even if this print moved. **Two adjacencies PROPOSED in this PR**, both read verbatim off today's primary listing: **`sp-global-pmi-commodity-price-supply-2026-10-01`** (11:00 ET same day — the only calendar candidate carrying the fuel/supply channel the ISM mfg ledger flagged, and a clean placebo slot outside 09:30–10:30) and **`sp-global-investment-manager-index-2026-09-15`** (10:00 ET, an institutional positioning survey the morning before the 09-16 FOMC — a class this calendar tracks nothing of). **Blocked, recorded not worked around:** the July flash and June-data final PDFs each returned **202 empty on 3 attempts**, while every PDF linked from the *live* index served 200 first try — **harvest hashes from the index, not from search**. The sibling's `…/Public/Home/PressReleases` block was a **404 path**; `…/Public/Release/PressReleases` works. **Registered FT-sp-global-manufacturing-pmi-2026-10-01-1 and -2**, a designed pair scored 10-02: -1 predicts the sibling's ordering statistic fails again, -2 predicts the within-day statistic holds — only together do they separate "the confound story is right" from "all of this is noise." | — (stance set) | 2026-10-05 (low, 15+d band: every 30d — but the event lands 10-01, so the next assessment is the close-out) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sp-global-manufacturing-pmi-2026-10-01.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
