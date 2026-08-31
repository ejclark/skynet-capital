# ISM Services PMI (Oct 2026 data) — ism-services-2026-11-04

**Kind:** macro-print · **Date:** 2026-11-04 (estimate, EST: ISM third-business-day cadence, verified with its two exceptions this session — ismworld.org's ROB calendar re-fetched direct 2026-08-31 and still 302s to ecommerce.ismworld.org/SSO/Login.aspx) · **Impact:** high
**Last assessed:** 2026-08-31
<!-- probe-ref: {"symbols":{},"vix":15.39,"daysBand":"high:61+","adjacentIds":["ism-manufacturing-2026-11-02","jobs-2026-11-06","midterm-elections-2026-11-03","sloos-2026-11-02","treasury-refunding-2026-11-04"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and this session retires a claim this repo has been repeating rather than
restating it.** Three ledgers and this event's own calendar note assert that the ISM Services Prices
Index is "the single biggest non-CPI rate-path mover" we track. Measured across **all eight 2026
releases**, it moves nothing: **TLT 3/8 up, mean +0.020%** against an unconditional −0.012%; **^TNX
4/8 up, mean −0.009%**; SPY 4/8 with every release-day move at or below the **76th percentile** of
its own 2026 |move| distribution. The claim's most-cited receipt — "July's 70.3 Prices reading drove
the 10Y up ~9bps on 2026-08-05" — **inverts on a price check**: the 10Y closed **4.617** that day,
*down* from 4.627, and TLT closed *up* 0.22%. Chasing that discrepancy found a second one. The
[manufacturing sibling](ism-manufacturing-2026-11-02.md)'s loud bond leg (TLT down **8/8**, p=0.007)
is **TLT's monthly distribution**: its 2026 ex-dividend dates are 02-02 · 03-02 · 04-01 · 05-01 ·
06-01 · 07-01 · 08-03 — *seven of that study's eight release dates*, because both are the first
business day of the month. On dividend-adjusted closes the same eight days are **3/8 up, mean
−0.184%**, and the result is gone. Finally, the thing that actually distinguishes **11-04**: the
**Treasury Quarterly Refunding Announcement lands 08:30 ET that same morning**, 90 minutes ahead of
ISM — proposed to the calendar in this PR, and the same collision that contaminated 08-05. Date is
**estimate**.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-65) | **Stand aside** | High | `symbols: []`, an `estimate` date 65 days out, no October consensus in existence, no macro-keyed house playbook — and now a measured reaction function of nil across six instruments. | ismworld.org serving an ungated ROB calendar showing a November services date other than **2026-11-04** — re-fetched **2026-08-31**, still SSO-gated |
| This week | **Watch 2026-09-03, and score the null on it** | High | The August-data print is a clean 9th out-of-sample observation of this release's measured non-reaction, registered **FT-37**. | **TLT or ^TNX printing a \|move\| above the 90th percentile** of its own 2026 distribution (1.04% / 1.52%) on **2026-09-03** — the null breaks at its first out-of-sample test |
| This month | **Never attribute a 11-04 bond move to this print** | Medium | Treasury's Quarterly Refunding Announcement is **08:30 ET on 2026-11-04**; ISM is 10:00. Supply, not the survey, is the scheduled duration event that morning. | Treasury moving or cancelling the **2026-11-04** refunding announcement on home.treasury.gov before that date |
| This quarter | **Stand aside — the corridor's positioning dates are 11-03 and 11-06, not this** | Medium | It reads into a decided FOMC (10-28), a priced PCE (10-29) and a resolved election (11-03), two days before October payrolls. Its informational share is capped from both sides. | An October services headline **outside 2026's 53.6–56.1 range** on **2026-11-04** — the base rates stop being the right prior and this doc is re-read from the national tape |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy and no sell signal exists off this event.** `estimate`-dated, `symbols: []`, no macro-keyed playbook. Research is not action.
- **The "biggest non-CPI rate-path mover" claim is retired as unmeasured.** Six instruments, eight releases, nothing above the 82nd percentile.
- **Attribution discipline on 11-04:** an 08:30 refunding announcement precedes the 10:00 print. Bond moves that morning are unattributable to ISM.
- **The manufacturing sibling's TLT finding should not be relied on** — it is a dividend artifact; its equity leg reproduces exactly and stands.
- **Prices ≥ 70** (five of eight 2026 prints) → the hawkish services-inflation line; read it, size nothing to it.
- **Employment sub-50 again** (45.2 Mar · 47.9 May · 47.4 Jul) → the stagflation-shaped divergence; reads into 11-06 payrolls, not into a trade.
- **A sub-50 headline** on 09-03, 10-06 or this print → 2026's expansion streak breaks and the base rates stop applying.
- **Watch (dated):** ISM services **09-03** · jobs **09-04** · CPI **09-11** · FOMC **09-16** · funding deadline **09-30** (est) · **FOMC 10-28** · GDP+PCE **10-29** · ISM mfg + SLOOS + Treasury estimates **11-02** · **midterms 11-03** (est) · **refunding + this print 11-04** (est) · jobs **11-06** · CPI **11-10**.

## Initial research

### The question, plainly

What should we expect from the October 2026 ISM Services PMI on 2026-11-04, is the date right, and —
the question every sibling assumed rather than answered — **is this release actually the biggest
non-CPI rate-path mover we track**, as three ledgers and this event's own calendar note assert? And
given that it is the first national activity read published *after* the midterms, what should a
paper-trading book holding long-duration tech (NVDA MRVL AVGO CRWV MSFT GOOG META AAPL AMZN) do
about it?

**One-line verdict:** the claim is **not supported by any measurement** — across all eight 2026
releases this print has no equity reaction and no bond reaction, its single most-cited receipt
inverts when checked against prices, and the sibling result that looked like an ISM bond effect
turns out to be an ETF's monthly dividend; what genuinely distinguishes 2026-11-04 is not the survey
but the **Treasury refunding announcement 90 minutes ahead of it**.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies and `earnings-cycle.mjs` / `intraday-edges.mjs` have no target; the
cache was busted anyway (`rm -rf node_modules/.cache/earnings-cycle node_modules/.cache/intraday-edges`)
because this session re-fetches Yahoo bars through the same layer. Two strands.

**(a) A price measurement run this session.** Yahoo **split/dividend-adjusted** daily closes
(`scripts/research/market-data.mjs` → `bars()`, whose `close` field is the adjusted series) for
**SPY, QQQ, TLT, ^TNX, XLF, IWM**, 2026-01-01 → 2026-08-28, **n=165 sessions**, against the eight
2026 ISM Services release dates, with an unconditional-drift control, percentile ranking against each
instrument's own 2026 |move| distribution, a one-sided binomial test, a T−2…T+2 placebo, and Spearman
rank correlations of the Prices and headline readings against release-day returns. This is the
technique the [SLOOS ledger](sloos-2026-11-02.md) established and the
[manufacturing sibling](ism-manufacturing-2026-11-02.md) applied; adding the raw-vs-adjusted
comparison is this session's own extension.

**(b) Sourced web research, primary-first.** Every one of the eight release dates was **fetched, not
derived** — PRNewswire datelines and ISM report pages, each cited in leg 1. ismworld.org's ROB
calendar was fetched directly today (302 → SSO, recorded not worked around). Treasury's refunding
schedule came from home.treasury.gov's own pages. The VIX futures curve and the tracked-name
sensitivity ranking are **carried** from sibling ledgers and labelled as carried where used. Spot VIX
**15.39** is this session's own Yahoo `^VIX` fetch and is an **in-session 2026-08-31 bar**, not a
close. Every figure is dated in-line; the event's date is **estimate** and that label rides on every
trading-adjacent line below.

### Conviction legs, tested

1. **The date is right — SUPPORTED, and the cadence rule turns out to carry two exceptions the
   calendar entry does not record.** ISM's own release text states the rule verbatim: the Services
   report "is posted on ISM's website … on the third business day of every month after 10:00 a.m.
   ET. The one exception is in January, the report is released on the fourth business day of the
   month" (PRNewswire, March-2026 report, dateline **TEMPE, Ariz., April 6, 2026, 10:00 ET**). A
   *second*, unwritten exception showed up in the dates themselves: **market holidays displace the
   count**. March data released **2026-04-06**, not 04-03 — Good Friday; June data released
   **2026-07-06**, not 07-03 — the observed Independence Day holiday. Applied to November 2026: Nov 1
   is a Sunday, so the business days are **Mon 11-02 · Tue 11-03 · Wed 11-04**; Election Day is
   neither a federal nor a market holiday, and there is no January exception. **11-04 stands** — but
   it now rests on a rule verified *with its exceptions* against eight fetched datelines, rather than
   on the bare "third business day" the calendar entry asserted. `EST:` remains the honest prefix:
   ismworld.org's ROB calendar was re-fetched directly today and returned a **302 to
   `ecommerce.ismworld.org/SSO/Login.aspx`**, so the specific November line item is not fetched and
   this lane cannot promote it.

2. **The release's reaction function, measured for the first time in this book — and it REFUTES the
   house's own "biggest non-CPI rate-path mover" claim.** The eight 2026 releases and their readings,
   every date from a fetched dateline:

   | Released | Data | PMI | Prices | Released | Data | PMI | Prices |
   |---|---|---|---|---|---|---|---|
   | 2026-01-07 | Dec 2025 | 54.4 | 64.3 | 2026-05-05 | Apr 2026 | 53.6 | 70.7 |
   | 2026-02-04 | Jan 2026 | 53.8 | 66.6 | 2026-06-03 | May 2026 | 54.5 | 71.3 |
   | 2026-03-04 | Feb 2026 | 56.1 | 63.0 | 2026-07-06 | Jun 2026 | 54.0 | 67.7 |
   | 2026-04-06 | Mar 2026 | 54.0 | 70.7 | 2026-08-05 | Jul 2026 | 54.1 | 70.3 |

   Release-day close-to-close returns, in that order, against each instrument's own 2026 distribution:

   | Leg | Release-day readings (%) | \|move\| percentiles | Control | Read |
   |---|---|---|---|---|
   | **TLT** | +0.58 · −0.25 · −0.31 · −0.16 · +0.55 · −0.40 · −0.07 · +0.22 | 68 · 35 · 42 · 20 · 65 · 49 · 10 · 28 (median 0.40%, p90 1.04%) | **3/8 up** vs a 48.2% unconditional rate; mean **+0.020%** vs an unconditional **−0.012%**; one-sided binomial **p = 0.40** | **Nothing.** The load-bearing instrument for the entire rate-path claim shows no sign consistency, no magnitude, and a mean indistinguishable from drift. Every observation at or below the 68th percentile. |
   | **^TNX** | −0.98 · +0.02 · +0.59 · +0.51 · −0.67 · +0.81 · −0.13 · −0.22 | 70 · 2 · 45 · 37 · 55 · 61 · 10 · 15 | 4/8 up vs 52.4%; mean **−0.009%** vs +0.078% | Nothing, and the yield leg is if anything *lower* than an ordinary session. |
   | **SPY** | −0.32 · −0.48 · +0.71 · +0.47 · +0.80 · −0.70 · +0.87 · −0.20 | 37 · 48 · 65 · 45 · 71 · 64 · 76 · 21 (median 0.51%, p90 1.45%) | 4/8 up vs 53.0%; mean +0.143%; **p = 0.70** | No equity reaction. **Not one of the eight exceeds the 76th percentile.** |
   | **QQQ** | +0.10 · −1.75 · +1.52 · +0.60 · +1.30 · −0.26 · +1.43 · −0.90 | 5 · 82 · 75 · 37 · 66 · 15 · 71 · 51 | 5/8 up vs 53.7%; mean +0.255%; **p = 0.45** | Our own duration proxy shows nothing. The 82nd percentile (02-04) is the largest reading in the whole 48-observation grid. |
   | **XLF** | −1.40 · +0.80 · +0.57 · +0.71 · +0.02 · −1.15 · +0.93 · +0.21 | 88 · 66 · 47 · 58 · 2 · 80 · 74 · 20 | 6/8 up vs 54.3%; mean +0.086%; **p = 0.21** | Added as the rate-sensitive sector cross-check. Nothing survives it either. |
   | **IWM** | −0.23 · −0.86 · +0.97 · +0.43 · +1.68 · −1.37 · +0.44 · −0.64 | 11 · 55 · 65 · 25 · 84 · 76 · 26 · 45 | 4/8 up vs 57.3%; mean +0.053% | Domestic-cyclical cross-check — the one that *should* care most about a services survey. Nothing. |

   **2a. The ordering gives the Prices story nothing, and ranks it below the headline.**
   Spearman(Prices, TLT return) = **−0.132** and Spearman(Prices, ^TNX return) = **+0.216** — both the
   *right* sign for "hot services prices lift yields" (unlike the manufacturing sibling, whose
   ordering came out backwards), but nowhere near the ~0.74 critical value at n=8. Meanwhile
   Spearman(**headline**, TLT) = **−0.395** and Spearman(**headline**, ^TNX) = **+0.431** — also
   insignificant, but consistently *better ordered* than Prices. So the specific claim under test —
   that the **Prices subcomponent** is this release's rate lever — is the weaker of the two orderings
   in our own data. It refutes nothing at n=8; it supplies the claim no support at all.

   **2b. The placebo is flat, which is the point.** TLT around each release: **T−2: 4/8, −0.104% ·
   T−1: 4/8, +0.082% · T+0: 3/8, +0.020% · T+1: 3/8, −0.060% · T+2: 4/8, −0.033%**. No calendar
   signature anywhere in the window — unlike the manufacturing slot, which sits on the month turn.
   That flatness is what makes this release a clean control on the sibling's finding (leg 4).

   **Verdict — REFUTED, specifically and narrowly.** What is refuted is the *asserted* claim that this
   release is the biggest non-CPI rate-path mover we track. What is *not* claimed is that services
   inflation is unimportant to the Fed — that is an economic argument this measurement does not touch.
   The finding is about the **release**, not the **economics**: on the day it prints, our instruments
   do not move. Registered forward — **FT-37**, scored on the **2026-09-03** print.

3. **The claim's most-cited receipt inverts on a price check — REFUTED.** The
   [09-03 sibling](ism-services-2026-09-03.md) banked as leg 4 SUPPORTED that on the July release day
   (2026-08-05) "the 10-year Treasury yield gained ~9bps to ~4.17%, its highest since early November
   2022," sourced to release-day press narration and hedged as "level figures carry aggregator risk,
   the direction is the reliable part." The direction was the unreliable part. Yahoo `^TNX` closes:
   **07-31 4.745 → 08-03 4.686 → 08-04 4.627 → 08-05 4.617 → 08-06 4.670.** Yields **fell** on the
   release, closing a three-session decline that ran straight through it; TLT went **82.82 → 83.00,
   +0.22%**. And the cited *level*, ~4.17%, is ~45bps below the actual 4.617 close — a gap large
   enough that the figure was almost certainly a stale-vintage aggregation, which is exactly the trap
   that ledger's own method section warned about. **The honest caveat:** these are close-to-close
   measurements, and it remains possible that yields rose on the 10:00 print and faded into the
   close. That would rescue the narration but not the claim — a move that does not survive to the
   close is not a rate-path repricing, and it is not something a book can act on.

4. **Chasing that discrepancy found a second one, and it dissolves the manufacturing sibling's bond
   finding — the session's largest result.** That ledger, merged today, reported TLT falling on **all
   8** manufacturing release days, mean **−0.513%** vs an unconditional −0.029%, one-sided binomial
   **p = 0.007** — its only statistically loud leg. My T−2 column is the natural cross-check, because
   two sessions before the third business day **is** the first business day in 7 of 8 cases. On
   **SPY it reproduces the sibling exactly** — +0.50 · +0.06 · +0.75 · +0.28 · +0.27 · −0.14 · +1.42
   for 02-02 through 08-03, matching its published figures digit for digit, which independently
   confirms its equity conclusion. **On TLT it did not match at all.** The cause, run both ways on
   the same bars:

   | Mfg release day | TLT dividend-adjusted | TLT raw close-to-close | Wedge |
   |---|---|---|---|
   | 2026-01-02 | −0.149% | −0.149% | 0.0 bps |
   | 2026-02-02 | −0.286% | **−0.666%** | 38.0 bps |
   | 2026-03-02 | −1.004% | **−1.332%** | 32.8 bps |
   | 2026-04-01 | −0.098% | **−0.496%** | 39.8 bps |
   | 2026-05-01 | **+0.358%** | −0.012% | 36.9 bps |
   | 2026-06-01 | **+0.054%** | −0.338% | 39.2 bps |
   | 2026-07-01 | −0.676% | **−1.041%** | 36.5 bps |
   | 2026-08-03 | **+0.330%** | −0.073% | 40.3 bps |
   | | **3/8 up, mean −0.184%** | **0/8 up, mean −0.513%** | |

   The sibling's published column is the **raw** one, to three decimals. And the wedge is not noise:
   Yahoo's dividend events for TLT give ex-dates **2026-02-02 (0.332) · 03-02 (0.301) · 04-01 (0.345)
   · 05-01 (0.315) · 06-01 (0.336) · 07-01 (0.318) · 08-03 (0.330)** — **seven of the eight ISM
   manufacturing release dates, one for one**, because TLT distributes monthly and goes ex on the
   first business day, which is precisely when ISM Manufacturing prints. (2026-01-02 is the eighth,
   and it is the one date with a 0.0 bps wedge: that distribution went ex on 2025-12-19.) So "TLT
   fell on all 8 release days, p = 0.007" is **TLT paying its dividend**, mechanically, on a schedule
   that coincides with the release by construction. On total returns the effect is 3/8 up and
   −0.184%, and nothing survives. The sibling's own placebo half-saw this — it flagged T−1 as
   similarly negative and honestly reported that it could not separate a month-turn effect — but the
   cause is simpler and fully mechanical. This does **not** overturn that ledger's conclusion, which
   was already *stand aside*; it removes the one piece of evidence in it that looked significant, and
   it means its **FT-36** kill switch ("TLT closes higher on 2026-09-01") is testing an artifact.
   Registered forward — **FT-38**. The sibling's ledger is append-only and is not edited here; its
   next pulse should read this leg.

5. **The distinguishing fact about 11-04 is a Treasury supply announcement, not a survey —
   SUPPORTED, and it is the same confound that contaminated 08-05.** Treasury holds its **Quarterly
   Refunding** on the first Wednesday of February, May, August and November, releasing the policy
   statement, TBAC report and auction/buyback schedules at **08:30 ET**. Treasury's own pages put the
   August 2026 refunding documents at **08:30 a.m. on Wednesday, 2026-08-05**, and name the next one
   **2026-11-04** — the buyback-sizing release (sb0607) states outright that more information on
   future buyback sizes comes "at the next Quarterly Refunding, scheduled for November 4, 2026,"
   with the borrowing estimates and TBAC materials on **2026-11-02**. Now cross the two calendars:
   the ISM Services release is the third business day; the refunding is the first Wednesday. In 2026
   they collide on **02-04**, **08-05** and **2026-11-04**. So the single release day whose bond
   reaction the 09-03 sibling attributed entirely to ISM Prices (leg 3) had a **Treasury supply
   announcement 90 minutes earlier**, and two of this study's eight observations are contaminated the
   same way. On 11-04 the collision repeats with the largest stakes of the three: it is the first
   refunding after the midterms, setting coupon sizes and buyback schedules into a post-election
   fiscal picture. **The operational consequence is an attribution rule, not a trade:** any bond move
   on the morning of 11-04 is unattributable to this print. Proposed to the calendar in this PR as
   `treasury-refunding-2026-11-04`, `status: estimate`.

6. **Corridor position — this is the structurally weakest slot in the November cluster —
   SUPPORTED.** Five tracked events sit inside the mechanical ±5-day window (`computeAdjacentIds`,
   run this session): **11-02 ISM manufacturing 10:00 + SLOOS 14:00 · 11-03 midterms · 11-04
   refunding 08:30 + this print 10:00 · 11-06 jobs**, with the 10-28 FOMC, 10-29 GDP-advance + PCE
   and 11-10 CPI just outside it. That geometry caps this print's informational share from *both*
   sides: it reads into an FOMC that already decided, a PCE that already priced inflation and an
   election that has already resolved, and it is two days ahead of the October payrolls report that
   will own the week's labor read. Its one genuine distinction — the mirror of the
   [manufacturing sibling](ism-manufacturing-2026-11-02.md)'s, which is the last hard national
   activity read *before* the vote — is that it is the **first published *after* it**. That is a
   statement about sequence, not power; leg 2 measured the power and found none.

7. **Base rates hold and are unusually tight — SUPPORTED, and it caps what this doc can claim.**
   2026 headline readings: **53.8 · 56.1 · 54.0 · 53.6 · 54.5 · 54.0 · 54.1** — a **2.5-point range**
   with six of seven inside 53.6–54.5, i.e. a survey that has barely moved all year. Prices ran
   **66.6 · 63.0 · 70.7 · 70.7 · 71.3 · 67.7 · 70.3** — persistently elevated, five of seven at or
   above 67.7, with March's 70.7 the highest in nearly four years at the time. Employment has been
   the weak leg: **50.3 (Jan) · 45.2 (Mar) · 47.9 (May) · 47.4 (Jul)** — in contraction on every
   reading after January, the stagflation-shaped divergence the 09-03 sibling named. No **October**
   consensus, whisper or prediction-market bin exists at D-65 and none will for weeks; the **August**
   print resolves on 09-03 against a **54.0** consensus with prediction-market mass clustered 53–56
   (carried from the [09-03 sibling](ism-services-2026-09-03.md)'s 08-30 row, not re-derived). Base
   case for October (**estimate**-labelled, **Low** confidence, trend extrapolation only): continued
   expansion in the low-to-mid 50s, Prices elevated, Employment at or below 50. Any "surprise"
   framing here is extrapolation against history, not a measured gap.

8. **Tracked-name sensitivity — inherited, and now qualified by the measurement — SUPPORTED.**
   `symbols: []`; the channel is the rate path, and the ranking is unchanged because nothing here
   moves it: **CRWV** most exposed (debt-financed buildout — a hawkish repricing hits its discount
   rate *and* its cost of capital), then the high-multiple semis **NVDA / AVGO / MRVL**, then **MSFT
   / GOOG / META**, least **AAPL / AMZN**; sympathy transmits at the QQQ level per the
   [sweep](../multi-symbol-sweep.md). Leg 2 adds the qualifier: **QQQ's measured release-day reaction
   to this print is nil** (5/8, p=0.45), so the transmission is a duration mechanism we believe, not
   one we have observed on this release. Ranking carried from siblings, not re-derived.

9. **Volatility is priced for 11-03, and that verdict carries over unchanged — SUPPORTED.** Spot VIX
   **15.39** (Yahoo `^VIX`, in-session 2026-08-31 bar, fetched this session) against a futures curve
   of **Sep 17.4 · Oct 19.0 · Nov 19.7**, carried from the
   [midterm ledger](midterm-elections-2026-11-03.md)'s 08-29 reading and not re-derived here. The
   **November contract expires 11-18** and therefore spans this print, the refunding and the
   election. An options structure put on "for the ISM print" pays roughly a **4.3-point** election
   premium for a release whose measured equity reaction does not clear the 82nd percentile in any
   instrument tested. Same trap the manufacturing sibling named, one day later on the calendar.

### What the conditions support

Nothing directional. The output of this session is **three measured refusals and one attribution
rule**, not a call. Concretely: (a) **stop repeating that this release is the biggest non-CPI
rate-path mover we track** — six instruments across eight 2026 releases show no reaction, and the
Prices ordering ranks below the headline's; (b) **stop citing the 08-05 yield move as its proof** —
yields closed *down* that day; (c) **stop relying on the manufacturing sibling's bond leg** — it is
TLT's dividend, though that ledger's equity leg reproduces exactly and its stand-aside conclusion is
untouched; and (d) **on 11-04, attribute nothing in the bond market to this print**, because
Treasury's refunding announcement precedes it by 90 minutes. Two dated things to watch: the
**09-03** print as the ninth observation of the null (**FT-37**), and the **11-02** borrowing
estimates as the first half of the refunding that owns 11-04's morning. None of that licenses an
entry.

### Honest limits

**n=8 is small and one year is one regime.** Six instruments were tested with no multiple-comparison
correction — which cuts *toward* this doc's conclusion rather than against it (failing to reject
across six uncorrected tests is a stronger null than a single one would be), but it also means the
one large reading in the grid, QQQ's 82nd percentile on 02-04, deserves no weight either.
**Two of the eight release days (02-04, 08-05) share their morning with a Treasury refunding
announcement** (leg 5) and three (01-07, 04-06, 07-06) are holiday-displaced, so the sample is less
clean than its size suggests. Leg 3's inversion is a **close-to-close** measurement and cannot rule
out an intraday move that faded — stated, not resolved. Leg 4 is the most consequential claim here
and is the one to check hardest: it rests on Yahoo's dividend-event data and on the sibling's
published figures matching the raw column, both of which are reproducible from
`scripts/research/market-data.mjs`, but it is an inference about how another session computed its
numbers, not a statement that session made about itself. The date is `estimate` and is structurally
unpromotable from this lane — ISM's calendar is SSO-gated (leg 1), so an `ISM:` prefix needs a
credentialed fetch. **No October consensus exists** (leg 7), so there is no measured surprise gap and
the base case is trend extrapolation only. The VIX futures curve (leg 9), the tracked-name ranking
(leg 8) and the August consensus (leg 7) are **carried** from sibling ledgers against a spot reading
fetched today — a date mismatch of one to two days, not re-derived. The refunding dates (leg 5) come
from Treasury's own pages via search rather than a directly-fetched primary page (home.treasury.gov
timed out twice this session), and the February and May 2026 refunding dates are **rule-derived**
from the first-Wednesday convention, not fetched. An **ADP National Employment Report on 2026-11-04
at 08:15 ET** is a likely third same-morning print — the tracked `adp-employment-2026-09-02` entry
follows the same first-Wednesday cadence — but no source confirming it was obtained this session, so
it is noted here and deliberately **not proposed** to the calendar.

## Stance & kill switches

**Stance (date `estimate`, ISM third-business-day cadence verified this session with its January and
holiday exceptions against eight fetched datelines, primary ROB calendar still SSO-gated).** Treat
2026-11-04 10:00 ET as a **high-impact known-date read with no tradeable edge and no measured
market reaction**: no position opened, closed or sized off it, and no house playbook targets it.
Specifically, the claim that this release is the **biggest non-CPI rate-path mover** in the tracked
set is **retired as unmeasured** — across all eight 2026 releases TLT ran 3/8 up at a mean of
+0.020%, ^TNX 4/8 at −0.009%, and no instrument's release-day move exceeded the 82nd percentile of
its own 2026 distribution. This is a finding about the **release**, not about services inflation's
importance to the Fed, which this measurement does not test. Additionally, and specific to this date:
**attribute no bond move on the morning of 11-04 to this print**, because Treasury's Quarterly
Refunding Announcement lands at 08:30 ET, 90 minutes earlier — the same collision that contaminated
the 08-05 release whose yield move a sibling ledger attributed to ISM Prices. Base case for the
October reading (**estimate**-labelled, **Low** confidence, trend extrapolation only at D-65):
continued expansion in the low-to-mid 50s consistent with 2026's tight 53.6–56.1 range, Prices
elevated above 67, Employment at or below 50. What would change this print's *importance* — never its
tradeability — is external to it: whether the election on 11-03 reprices the fiscal path that the
11-04 refunding then has to fund.

**Kill switches:**

- **TLT or ^TNX prints a release-day |move| above its own 2026 p90 (1.04% / 1.52%) on 2026-09-03** —
  the measured null breaks at its first out-of-sample test and this release's reaction function has
  to be re-derived rather than patched. Registered as **FT-37**, scored 2026-09-04.
- **A published Prices-subcomponent forecast appears before a release** — the gap the 09-03 sibling
  judged permanent closes, and the surprise framing can finally be measured against a number instead
  of a trend.
- **Treasury moves or cancels the 2026-11-04 refunding announcement** — leg 5's attribution trap
  disappears and this print gets its morning to itself; re-read the corridor without it.
- **The 11-02 borrowing estimates land materially above expectations** — the refunding becomes the
  week's duration story outright, further shrinking this print's already-capped share (leg 6).
- **ISM prints sub-50 on 09-03, 10-06 or 11-04** — 2026's expansion run ends, leg 7's unusually tight
  base rates stop being the right prior, and this doc is re-read from the national tape.
- **Spot VIX converges to within ~1 point of the November future by 2026-10-16 opex** — the election
  premium is gone and leg 9's options caveat can be dropped.
- **A published October consensus emerges** — resolves leg 7; re-run the framing against a real
  number instead of trend extrapolation.
- **The manufacturing sibling's next pulse re-runs its bond leg on adjusted closes and reproduces the
  8/8** — leg 4 is wrong, and the dividend explanation has to be withdrawn. Registered as **FT-38**.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-08-31 | D-65 | Initial research banked (above). **Date:** stays `estimate`; ismworld.org's ROB calendar re-fetched direct today, still 302 → `ecommerce.ismworld.org/SSO/Login.aspx`. Cadence rule verified with **two exceptions** the calendar entry did not record — ISM's own release text says third business day "with the one exception … in January, the fourth business day," and market holidays displace it (Mar data → **04-06** not 04-03, Good Friday; Jun data → **07-06** not 07-03, observed July 4). Nov 2026 has neither; **11-04 stands**. All eight 2026 release dates **fetched** from PRNewswire datelines / ISM pages, not derived. **Session's main output — three measured refusals.** Method: Yahoo **dividend-adjusted** closes, 2026-01-01→08-28, n=165, six instruments vs the 8 releases (01-07 · 02-04 · 03-04 · 04-06 · 05-05 · 06-03 · 07-06 · 08-05). **(1) The "biggest non-CPI rate-path mover" claim is REFUTED as unmeasured.** TLT +0.58/−0.25/−0.31/−0.16/+0.55/−0.40/−0.07/+0.22% = the 68/35/42/20/65/49/10/28th percentile of its own 2026 \|move\| distribution — **3/8 up** vs a 48.2% unconditional rate, mean **+0.020%** vs −0.012%, p=0.40. ^TNX 4/8, mean −0.009%. SPY 4/8, **no observation above the 76th percentile**. QQQ 5/8 (p=0.45), XLF 6/8 (p=0.21), IWM 4/8. Spearman(Prices, TLT) **−0.132** / (Prices, ^TNX) **+0.216** — right sign, far short of the ~0.74 critical value at n=8, and *worse ordered* than the headline (−0.395 / +0.431). Placebo flat throughout (TLT T−2 4/8 −0.104% · T−1 4/8 +0.082% · T+0 3/8 +0.020% · T+1 3/8 −0.060% · T+2 4/8 −0.033%). Registered **FT-37**, scored on 09-03. **(2) The claim's most-cited receipt inverts.** The [09-03 sibling](ism-services-2026-09-03.md)'s leg 4 banked "July's 70.3 Prices drove the 10Y up ~9bps to ~4.17%" from press narration; `^TNX` closes run **07-31 4.745 → 08-03 4.686 → 08-04 4.627 → 08-05 4.617 → 08-06 4.670** — yields **fell** on the release, TLT **82.82→83.00 (+0.22%)**, and the cited level is ~45bps off the actual close. Close-to-close only; an intraday spike that faded is possible and stated. **(3) The [manufacturing sibling](ism-manufacturing-2026-11-02.md)'s bond leg is TLT's dividend.** My T−2 column is the mfg release day in 7/8 cases and reproduces its **SPY** figures digit-for-digit (+0.50/+0.06/+0.75/+0.28/+0.27/−0.14/+1.42), confirming its equity conclusion — but not its TLT. Run both ways: adjusted **3/8 up, mean −0.184%** vs raw **0/8, −0.513%**, a wedge of **32.8–40.3 bps on 7 of 8 dates**; the sibling's published column is the raw one to three decimals. Yahoo dividend ex-dates for TLT: **02-02 0.332 · 03-02 0.301 · 04-01 0.345 · 05-01 0.315 · 06-01 0.336 · 07-01 0.318 · 08-03 0.330** — seven of its eight release dates, because both are the first business day of the month. Its p=0.007 is mechanical; its stand-aside conclusion is untouched; its **FT-36** kill switch tests an artifact. Not edited (append-only); registered **FT-38**. Adjacency sweep — **peers:** n/a, `symbols: []`. **Macro surprises:** none since the calendar's last read; the Warsh 08-28 repricing (Sep hike odds ~35%→57–59%) is carried from the [jackson-hole close-out](jackson-hole-2026-08-28.md), not re-derived. **Volatility regime:** spot VIX **15.39** (Yahoo `^VIX`, in-session 08-31 bar) vs 14.43 at the 08-28 close — +0.96pt, inside noise, no regime break; futures **Sep 17.4 · Oct 19.0 · Nov 19.7** carried from the [midterm ledger](midterm-elections-2026-11-03.md); the Nov contract expires 11-18 and spans this print, the refunding and the election. **Geopolitical/policy:** carried, not re-derived — the 08-30 US strike on Larak Island re-escalated Hormuz (Brent back above $90), the crude → Prices-paid channel this survey's inflation line runs through; the Senate CR to Dec 11 (passed 08-08, 90–6) is with the House, which returned 08-31. **Event tape:** no October consensus, whisper or bin exists at D-65; the August print resolves 09-03 against a 54.0 consensus with mass clustered 53–56 (carried from the 09-03 sibling). 2026 base rates: headline **53.8/56.1/54.0/53.6/54.5/54.0/54.1** (a 2.5-pt range), Prices **66.6/63.0/70.7/70.7/71.3/67.7/70.3**, Employment **50.3/45.2/47.9/47.4** — sub-50 on every reading after January. **New dated adjacency found → proposed in this PR:** the **Treasury Quarterly Refunding Announcement, 2026-11-04 at 08:30 ET** — Treasury's own pages put the August refunding documents at 08:30 on **2026-08-05** and name the next at **2026-11-04** (sb0607: buyback sizing comes "at the next Quarterly Refunding, scheduled for November 4, 2026"), with borrowing estimates + TBAC on **11-02**. Added as `treasury-refunding-2026-11-04`, `status: estimate` (`EST:`), rule-and-secondary-sourced with home.treasury.gov timing out on direct fetch, stated as such. It closes a structural gap — the calendar tracks 13 Treasury auctions and buybacks but not the announcement that sets their sizes — and it lands **90 minutes before this print**, the same collision that contaminated 08-05 and 02-04. **Noted but NOT proposed:** an ADP report on 11-04 08:15 ET is likely on the tracked 09-02 entry's first-Wednesday cadence, but no confirming source was obtained today. | — (stance set) | 2026-09-14 (high, ≥61d band: every 14d) |

**Rules.** Rows append only — editing a past row is falsification. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
