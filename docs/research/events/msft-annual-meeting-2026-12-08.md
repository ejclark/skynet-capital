# Microsoft 2026 Annual Shareholders Meeting — msft-annual-meeting-2026-12-08

**Kind:** sector · **Date:** 2026-12-08 (confirmed, SEC: Microsoft FY2026 Form 10-K, accession 0001193125-26-323660, re-fetched direct from sec.gov and text-extracted by this lane 2026-09-09) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{"MSFT":493.95},"vix":15.72,"daysBand":"low:15+","adjacentIds":["cpi-2026-12-10","cr-expiry-2026-12-11","ecb-quiet-period-start-2026-12-09","eia-steo-2026-12-08","ercot-data-center-audit-filing-2026-12-10","existing-home-sales-2026-12-09","fomc-2026-12-09","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","intl-trade-full-report-2026-12-08","ism-services-2026-12-03","japan-balance-of-payments-2026-12-08","japan-cgpi-2026-12-10","jobs-2026-12-04","m3-full-report-2026-12-03","mts-november-2026-12-10","ndx-annual-reconstitution-announcement-2026-12-11","productivity-costs-q3-revised-2026-12-08","qss-q3-2026-12-10","russell-reconstitution-2026-12-11","sp-rebalance-proforma-2026-12-04","sp-rebalance-reference-close-2026-12-11","treasury-3y-note-2026-12-07","wholesale-trade-2026-12-09"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** Do nothing about this meeting, at any horizon — and this ledger can refuse with a
measurement rather than with the usual "governance items don't move stocks" story. Every one of
Microsoft's last sixteen annual meetings was located from its own proxy filing on sec.gov, and on
meeting day MSFT minus QQQ has a mean of **−0.07%**, a median of **−0.15%**, a win rate of **6 of
16**, and a **total sixteen-year range of [−0.96pp, +0.76pp]** — a band that **78.4% of ordinary
2010+ sessions also sit inside**, against a median ordinary |MSFT − QQQ| of 0.48%. The meeting is not
merely un-tradable; it is *quieter* than a coin-flip session. It convenes at 08:30 Pacific / 11:30 ET,
which `intraday-edges.mjs` puts in the **third-quietest hourly bar of MSFT's day** (0.273% mean
absolute move, 10.8% of daily volatility, versus the 09:30 bar's 0.633% and 30.4%) — and no intraday
strategy on that instrument beats buy-and-hold anyway, every one of the nine net-negative.
**The one thing this session did change is the date's label:** the proposal that seeded this entry
filed `estimate` because a proposal always must, so this lane re-fetched the FY2026 10-K itself
(HTTP 200, 356,946 chars extracted) — it names 2026-12-08 twice and no other December-2026 date —
and then tested the 10-K-stated date against the date the eventual DEF 14A actually carried for the
last eight years: **eight matches out of eight**. The entry is now **confirmed** on a `SEC:` prefix.
Confirmation licenses nothing; it just stops the calendar implying a doubt the filing does not
support. The real trap is attribution: **2026-12-08 is a Tuesday one day before the confirmed
FOMC and two before confirmed CPI**, with the government-funding deadline closing that week and
**24 tracked events inside five days** — any MSFT move that session has a macro explanation long
before it has a governance one, which is why every number above is benchmark-relative.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-90 on a governance calendar item with no consensus number, no release time and no house playbook; MSFT's own alpha is separately killed (S1 and the D-10 run-up, re-confirmed on today's fresh run: P=0.1679, peers out-run MSFT over MSFT's own windows) | ≥3 new observations of an MSFT annual meeting moving MSFT ≥1pp vs QQQ — one would not reopen a 16-year null |
| This week | **Watch the proxy calendar, not the meeting** | Medium | The DEF 14A carries the information the meeting only ratifies, and the filing-to-meeting lag is far tighter than the filing's calendar date: 47-day median over 16 years (range 43–50), putting the 2026 filing at **est. 2026-10-22 ± 2 sessions** (proposed this session as `msft-def14a-2026-10-22`, **estimate**) | Microsoft filing its DEF 14A outside 2026-10-19..2026-10-26, which breaks the lag cadence the proposal is built on |
| This month (through ~2026-10-09) | **No position; the est. 2026-10-27 print owns this window** | High | The FY27-Q1 print — first under the two-segment recast, first standalone dollar Azure line — is the only MSFT repricing event in range, and the proxy lands inside its window. The meeting is six weeks downstream of it and releases no numbers | Microsoft pre-releasing meeting content material enough to move the Azure growth curve, which no annual meeting in this sample has done |
| This quarter (through ~2026-12-09) | **Flat into meeting day; no position opened or closed *for* it** | High | The full 16-year meeting-day range vs QQQ is under ±1pp and the D→D+5 drift fails its own test (mean −0.67pp, win 5/16, t=−1.66, P(≤5\|p=0.49)=0.12; drop the two macro-contaminated outliers and the mean collapses to −0.15pp). Registered as [FT-msft-annual-meeting-2026-12-08-1](../forward-tests/msft-annual-meeting-2026-12-08.md), score by 2026-12-16 | \|MSFT − QQQ\| **≥ 1.0pp** close-to-close on **2026-12-08** — outside the entire observed 2010–2025 range on either side |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — open, close or size an MSFT position *because of* the annual meeting. Sixteen years of meeting days are inside ±1pp vs QQQ; there is nothing to trade in either direction.
- **Never** — read a shareholder-proposal headline (AI governance, capex disclosure, compensation) as a dated catalyst. The proposals are public in the DEF 14A ~47 days earlier and the meeting only votes them.
- **Never** — attribute a 2026-12-08 MSFT move to the meeting. FOMC is 12/09 and CPI is 12/10, both **confirmed**; the pre-FOMC session belongs to the macro tape, and only the QQQ-relative figure says anything at all.
- **Guards are inherited, not new** — S2 (flat through the estimate-widened Oct 27–29 print window) and E1 (defer the open; 09:30 is 30.4% of MSFT's daily volatility at +0.004% mean first-hour return) live on [`msft-2026-10-27-print`](msft-2026-10-27-print.md). This event adds no guard of its own because it needs none.
- **Watch (dated)** — DEF 14A filing **est. 2026-10-22** (window 10-19..10-26, **estimate**; it is also the date falsifier) · est. print **2026-10-27** · FOMC **2026-10-28** · Microsoft Ignite **2026-11-17..20** (estimate) · meeting **2026-12-08 11:30 ET, confirmed** · FOMC **2026-12-09**, CPI **2026-12-10**, government funding deadline **2026-12-11**, all confirmed or tracked.
- **Re-keys everything if** — the DEF 14A names a meeting date other than 2026-12-08, breaking an 8-for-8 record.

## Initial research

### The question, plainly

Microsoft holds its 2026 annual shareholders meeting on 2026-12-08 — the first one held after the
two-segment reporting recast, so the first at which the board answers to shareholders having seen a
standalone dollar Azure line and an "over $50 billion" quarterly capex guide. Does that governance
venue give MSFT a tradable edge? And separately: is the date actually as uncertain as the calendar's
`estimate` label was claiming?

### One-line verdict

No edge in either direction, refused with an n=16 measurement rather than an argument — the meeting
day's relative move has never left ±1pp in sixteen years and sits inside a band 78% of ordinary
sessions occupy — and the date was **not** uncertain: it is stated twice in a primary SEC filing
whose stated date has matched the eventual proxy eight years out of eight, so this session promoted
the entry to **confirmed**.

### Method

- **Provenance of the entry.** This id existed only as `proposals/msft-annual-meeting-2026-12-08.from-msft-2026-10-27-print.json`, filed by the MSFT print lane's 2026-09-09 pulse. Per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), the owning lane reads every proposal first and then writes the canonical file itself. That proposal was read in full, and its one load-bearing fact — the date — was re-derived from the primary source rather than inherited. The proposal file stays where it is, now inert.
- **Both repo instruments re-run fresh 2026-09-09 with the cache busted first**, per the cache-discipline rule: `earnings-cycle.mjs MSFT --bench QQQ --peers GOOG,AMZN,META` (**88 prints, 2004-10-21..2026-07-29**, price history through 2026-09-08) and `intraday-edges.mjs MSFT` (**723 sessions**, hourly bars).
- **Two event studies built here rather than taken from an instrument**, and labelled as such throughout. Both use Yahoo split/dividend-adjusted daily closes via `scripts/research/market-data.mjs`, benchmarked to QQQ per this repo's convention.
- **Primary sources only, all fetched direct from sec.gov on 2026-09-09**: Microsoft's FY2026 Form 10-K; every DEF 14A filed 2010-2025 (16 filings, meeting date extracted from each document's own text); the last eight 10-Ks (2018-2025), for the 10-K-vs-proxy cross-check. No aggregator was used for any date in this document. No fetch failed — `probe-ref.blocked` is empty.

### Legs tested

**1. "2026-12-08 is the meeting date, and it deserves `confirmed`" — SUPPORTED; status promoted.**

The FY2026 10-K (accession 0001193125-26-323660, filed 2026-07-29, `msft-20260630.htm`) was
re-fetched independently by this lane — HTTP 200, 360,299 bytes, 356,946 chars after text
extraction. It states the date twice, on the cover page under DOCUMENTS INCORPORATED BY REFERENCE
("…Annual Meeting of Shareholders to be held on December 8, 2026…") and again in Part III Item 10.
`December 8, 2026` is the only December-2026 meeting date string in the document.

The proposal filed `estimate` and argued the `SEC:` prefix was unavailable. That reading was correct
*for a proposal* — proposals are always `estimate` (#1717) — and does not bind the canonical file the
owning lane writes. `SEC:` is a member of `scripts/event-scan-validation.mjs`'s `CONFIRMED_PREFIX`
list, and a signed annual report is the company's own primary statement about its own meeting.

What made the promotion a measurement rather than a judgement call was asking the deciding question:
*has the 10-K-stated date ever been wrong?* Each of the last eight 10-Ks was fetched and its stated
meeting date compared against the date the following DEF 14A actually carried:

| 10-K filed | 10-K states | DEF 14A actual | |
|---|---|---|---|
| 2018-08-03 | November 28, 2018 | 2018-11-28 | match |
| 2019-08-01 | December 4, 2019 | 2019-12-04 | match |
| 2020-07-30 | December 2, 2020 | 2020-12-02 | match |
| 2021-07-29 | November 30, 2021 | 2021-11-30 | match |
| 2022-07-28 | December 13, 2022 | 2022-12-13 | match |
| 2023-07-27 | December 7, 2023 | 2023-12-07 | match |
| 2024-07-30 | December 10, 2024 | 2024-12-10 | match |
| 2025-07-30 | December 5, 2025 | 2025-12-05 | match |

Eight for eight, no misses. The falsifier is dated and specific: a DEF 14A (est. 2026-10-22) naming
any other date. Note what the promotion does *not* do — it licenses no action, because legs 2 and 3
say there is no action to license. It only stops the calendar implying a doubt the evidence does not
support.

**2. "The annual meeting day carries MSFT-specific movement" — REFUTED, and by an unusually clean margin.**

Every MSFT annual meeting date 2010-2025 was read from that year's own DEF 14A on sec.gov (n=16;
the 2023-2025 proxies use a different cover layout, so their dates were extracted from the notice
block: `December 5, 2025`, `December 10, 2024`, `December 7, 2023`). MSFT minus QQQ, close-to-close
on meeting day:

| | mean | median | win | min | max |
|---|---|---|---|---|---|
| Meeting day vs QQQ (n=16) | **−0.07%** | **−0.15%** | **6/16 = 38%** | **−0.96pp** | **+0.76pp** |
| D-5 → D vs QQQ (n=16) | −0.02% | −0.06% | 8/16 = 50% | −2.80pp | +3.26pp |
| Every 2010+ session vs QQQ (n=4,195) | +0.01% | −0.02% | 49% | −10.36pp | +12.21pp |

Two facts do the work here. First, the win rate: 6 of 16 against a 49% base rate has
**P(≤6) = 0.25** — indistinguishable from a coin. Second, and more telling, the *dispersion*: the
widest relative move any of these sixteen meeting days produced is 0.96pp, and **78.4% of ordinary
2010+ sessions also fall inside ±0.96pp** (median ordinary |MSFT − QQQ| is 0.48%). A day on which
something happens leaves a fat tail. This one has no tail at all. The run-up into the meeting is the
same story — 8 of 16, mean −0.02pp.

The intraday instrument corroborates from a completely different direction. The meeting convenes at
08:30 Pacific / 11:30 ET (virtual since 2020, per the proxies' own notice blocks). Over 723 sessions
the 11:30 ET hourly bar is MSFT's **third-quietest**, at 0.273% mean absolute move and 10.8% of
daily volatility — against the 09:30 bar's 0.633% and 30.4%. The meeting convenes into the flattest
part of Microsoft's trading day. And every intraday strategy on that instrument is net-negative
after 5bps/side, all nine of them, versus buy-and-hold's +0.070%/day and Sharpe 0.67 — so there is
no execution shape that could express a meeting-day view even if one existed.

**3. "The week after the meeting drifts against QQQ" — REFUTED as tradable; it is an outlier artifact.**

This was the only cell in the study that looked like anything: MSFT − QQQ over D → D+5 runs
mean −0.67pp, median −0.43pp, win **5 of 16 = 31%**. It does not survive its controls:

- **t = −1.66** on n=16 (sd 1.61) — under the conventional bar, on a sample this small.
- **P(≤5 of 16 positive | p=0.49) = 0.12** — not significant.
- The mean is carried by two observations, 2010's −3.88pp and 2023's −4.67pp. **Drop those two and the mean collapses to −0.15pp**, i.e. nothing.
- 2023's window is macro, not governance: the 2023-12-07 meeting's D→D+5 window contains the December 12 CPI print and the December 13 FOMC decision.

Which is exactly the failure mode 2026 would reproduce at maximum strength — the 2026 D→D+5 window
(12/09–12/15) contains **confirmed** FOMC (12/09), **confirmed** CPI (12/10) and the government
funding deadline (12/11). Even had this cell been significant, 2026 would be the worst year in the
sample to try to express it.

**4. "The proxy filing, not the meeting, is where the information is — so maybe *it* moves the stock" — MIXED: the premise is right, the trade is not.**

The DEF 14A carries the shareholder-proposal slate, executive compensation and the director
nominees; the meeting only votes them, ~47 days later. So the premise holds — but the filing day is
a non-event too. All sixteen filing dates 2010-2025, MSFT minus QQQ: **mean +0.07%, median −0.10%,
win 7/16**. The D→D+5 cell shows mean **+0.86%** against a median of **−0.32%**, a spread that gives
the artifact away: the mean is one observation, 2015's **+10.14pp**, and that window contains the
FY16-Q1 earnings print of 2015-10-22, not anything about a proxy. Drop it and the cell is noise.

The genuinely useful finding in this leg is a **calendar** one, not a trading one. The filing's
calendar date wanders across four weeks (2010-09-30 through 2022-10-27), but the **filing-to-meeting
lag does not**: 16-year median **47 days**, range 43–50; last-five median **47 days**, range 45–49.
Anchored on the now-confirmed 2026-12-08, that puts the 2026 proxy at **2026-10-22, a Thursday** —
which is also the weekday of four of the last five filings. Proposed this session as
`src/domain/market-events/proposals/msft-def14a-2026-10-22.from-msft-annual-meeting-2026-12-08.json`
(`status: "estimate"`, since no filing date is ever announced), with the honest 2026-10-19..10-26
window written into its source string and the measurement above written into its notes, so the
sibling lane that researches it inherits the answer instead of re-deriving it.

### What the conditions support

Nothing to open and nothing to close. The refusal is the deliverable, and it now has three
independent legs behind it: a 16-year meeting-day null with no tail, an 11:30 ET convening time
sitting in MSFT's quietest hours, and no house playbook — `docs/plans/trade-playbooks.md` and
[`multi-symbol-sweep.md`](../multi-symbol-sweep.md) carry no governance-keyed hypothesis — that
could fire on a governance event even if one wanted it to. MSFT's own symbol-level alpha is
separately killed and stays killed: today's fresh run reproduces it (pre-earnings 20d P=0.1679 vs
base rate; GOOG/AMZN/META all out-run MSFT over MSFT's own pre-print windows, 87%/73%/73% win).

The one thing worth *doing* in this corridor is watching a date, not a price: the DEF 14A around
2026-10-22, because it is simultaneously the document with the actual content and the mechanical
falsifier for this entry's newly-confirmed date.

### Honest limits

- **n=16 is a small sample, and the study is hand-built.** It is not a repo instrument and carries no controls beyond the ones stated. What makes it usable is that it is being read as a *null* — a claim that nothing is there is far cheaper to support on 16 observations than a claim that something is.
- **The dispersion argument is the strong one; the win rate is not.** 6/16 at P=0.25 proves nothing on its own. The ±0.96pp ceiling across sixteen years is what carries leg 2.
- **Pre-2020 meetings were in-person, post-2020 virtual.** The regime changed mid-sample. It does not appear to matter (the two halves are equally flat), but it is a real inhomogeneity.
- **2026 is the first meeting under the two-segment structure**, so the prior is drawn from a disclosure regime that no longer applies — the same caveat the Ignite ledger carries. It cuts toward *more* caution about the null, not less.
- **December 8 2026 is unusually contaminated even by this calendar's standards** — 24 tracked events within five days, including two `high`/`critical` macro prints in the two sessions after. Nothing about that session will be cleanly attributable.

## Stance & kill switches

**Stance (2026-09-09, D-90).** No MSFT position is opened, closed or sized because of the annual
shareholders meeting, at any horizon. The date is **confirmed** (`SEC:`, FY2026 10-K, verified twice
in-document and cross-checked 8-for-8 against the last eight years' proxies) — and confirmation
changes nothing operationally, because the measured verdict is that the meeting day is a non-event:
MSFT − QQQ has stayed inside **[−0.96pp, +0.76pp]** across sixteen consecutive meetings, a band
78.4% of ordinary sessions also occupy, and the meeting convenes into MSFT's third-quietest hourly
bar. The apparent post-meeting drift is two macro-contaminated outliers and dies when they are
removed. Guards on MSFT exposure remain owned by [`msft-2026-10-27-print`](msft-2026-10-27-print.md)
(S2 flat through the print window, E1 defer-the-open); this event adds none because it needs none.
The only live watch item is the **DEF 14A, est. 2026-10-22** (`estimate`, window 10-19..10-26) —
watched for its content and because it is this entry's date falsifier, never as a trade.

**Kill switches.**

- **The date** — the DEF 14A names any meeting date other than 2026-12-08. That breaks an 8-for-8 record, re-keys this entry and every adjacency built on it, and forces the status back to `estimate`.
- **The null** — |MSFT − QQQ| ≥ 1.0pp close-to-close on 2026-12-08 (registered below as [FT-msft-annual-meeting-2026-12-08-1](../forward-tests/msft-annual-meeting-2026-12-08.md)). One breach does not make an edge; it makes the sixteen-year band no longer a band, which is the thing this whole stance rests on.
- **The premise** — Microsoft moving material disclosure (a guidance revision, a capex re-base, an M&A announcement) *onto* the meeting itself rather than into the proxy or a print. No annual meeting in this sample has done that; if one does, the venue stops being a governance formality and this document is void, not merely wrong.
- **The proxy cadence** — the DEF 14A filed outside 2026-10-19..2026-10-26, which kills the 47-day lag the proposed `msft-def14a-2026-10-22` entry is built on and demands that entry be re-dated.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-90 | **Initial research.** Wrote the canonical `market-events/msft-annual-meeting-2026-12-08.json` after reading the single prior proposal (`from-msft-2026-10-27-print`, now inert) and re-deriving its load-bearing fact. **Date promoted `estimate` → `confirmed` (`SEC:`)**: FY2026 10-K re-fetched direct (HTTP 200, 356,946 chars), names 2026-12-08 twice and no other Dec-2026 date; the 10-K-stated date matched the eventual DEF 14A **8 of 8** years 2018-2025. **Meeting day measured a non-event (n=16, dates from each year's own proxy):** MSFT − QQQ mean −0.07% / med −0.15% / win 6/16 (P=0.25) / **full range [−0.96pp, +0.76pp]**, vs 78.4% of ordinary 2010+ sessions inside the same band. `intraday-edges.mjs` (723 sessions): the 11:30 ET convening bar is MSFT's 3rd-quietest, 10.8% of daily vol vs 09:30's 30.4%; all 9 strategies net-negative. D→D+5 drift (−0.67pp, win 5/16) **refuted** — t=−1.66, P(≤5)=0.12, and dropping 2010/2023 (2023's window held Dec-12 CPI + Dec-13 FOMC) collapses it to −0.15pp. Proxy-filing day also null (mean +0.07pp, win 7/16; its +0.86pp D+5 mean is 2015's +10.14pp, an earnings print inside the window). **Adjacency sweep:** peers — GOOG/AMZN/META out-run MSFT over MSFT's own pre-print windows (87/73/73% win), MSFT alpha stays killed; macro — 24 tracked events within 5 days of 12/08, incl. confirmed FOMC 12/09 and CPI 12/10 and the 12/11 funding deadline; VIX 15.72 (2026-09-08 close), up from 14.53 at the sibling Ignite ledger's 09-06 row; geopolitical — none touching MSFT dated in the corridor; tape — DEF 14A filing-to-meeting lag is 47d median (range 43–50, last-five 45–49), so **proposed `msft-def14a-2026-10-22` (estimate, window 10-19..10-26)** with the measurement embedded. No fetch failed. | **New stance: stand aside at all horizons**, plus the date's status flip. Registered FT-msft-annual-meeting-2026-12-08-1 | 2026-10-09 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-msft-annual-meeting-2026-12-08.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
