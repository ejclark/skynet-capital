# S&P Cotality Case-Shiller Home Price Indices (October 2026 data) — case-shiller-hpi-2026-12-29

**Kind:** macro-print · **Date:** 2026-12-29 (estimate, EST: the publisher's own stated rule — "published on the last Tuesday of each month at 9:00 am ET", press.spglobal.com re-read direct 2026-09-09 HTTP 200 — corroborated on realized dates by PR Newswire's twelve consecutive Case-Shiller editions 2025-09-30 → 2026-08-25, every one a last Tuesday) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["christmas-eve-half-day-2026-12-24","treasury-coupon-announcement-2026-12-24","christmas-market-closure-2026-12-25","japan-cpi-tokyo-flash-2026-12-25","advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28","treasury-2y-note-2026-12-28","treasury-5y-note-2026-12-28","dallas-fed-mfg-2026-12-28","consumer-confidence-2026-12-29","fhfa-hpi-2026-12-29","treasury-7y-note-2026-12-29","dallas-fed-tssos-2026-12-29","fomc-minutes-2026-12-30","china-retaliation-suspension-expiry-2026-12-31","georgia-psc-data-center-cost-shift-2026-12-31","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","russell-style-quarter-end-capping-effective-2026-12-31","sifma-bond-early-close-2026-12-31","sp-select-sector-secondary-reweight-2026-12-31","tic-quarterly-external-debt-2026-12-31","new-years-day-market-closure-2027-01-01","sifma-uk-bond-market-closure-2027-01-01","uk-fuel-duty-rise-2027-01-01"],"screenStreak":0,"blocked":[{"url":"https://fred.stlouisfed.org/data/CSUSHPINSA.txt","status":"TIMEOUT","at":"2026-09-09"},{"url":"https://fred.stlouisfed.org/data/CSUSHPISA.txt","status":"TIMEOUT","at":"2026-09-09"},{"url":"https://fred.stlouisfed.org/graph/fredgraph.csv","status":"TIMEOUT","at":"2026-09-09"},{"url":"https://fred.stlouisfed.org/releases/calendar?rid=199","status":"200_NO_ROWS_RENDERED","at":"2026-09-09"},{"url":"https://alfred.stlouisfed.org/series?seid=CSUSHPINSA","status":"HTTP2_INTERNAL_ERROR","at":"2026-09-09"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/","status":"429","at":"2026-09-09"},{"url":"https://www.spglobal.com/spdji/en/index-family/indicators/sp-cotality-case-shiller/","status":"403","at":"2026-09-09"},{"url":"https://www.cmegroup.com/markets/real-estate/housing/case-shiller-home-price-index.html","status":"403","at":"2026-09-09"},{"url":"https://api.db.nomics.world/v22/series/FRED/CSUSHPISA","status":"404","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside — and take one thing off the shelf that two sibling ledgers put there: the
clean pre-open channel this print was supposed to own does not exist on the wire record.** The
publisher's stated 9:00 a.m. ET is when the *index* publishes. The *press release* — headline, y/y,
the Detroit notice, the quotes anyone actually reacts to — reaches PR Newswire between **09:45 and
11:09 ET in eleven of eleven datable editions, median ~10:03, none before 09:30**. That lands it
after the bell and within minutes of Conference Board Consumer Confidence at 10:00, which is exactly
the premise [case-shiller-hpi-2026-10-27](case-shiller-hpi-2026-10-27.md)'s overnight-gap design and
[fhfa-hpi-2026-12-29](fhfa-hpi-2026-12-29.md)'s "9:00–10:00 window" kill switch both rest on. It does
not overturn their nulls — both found nothing — it removes the *hope* attached to them. **The second
finding is arithmetic and it belongs to this date alone.** The last Tuesday of December falls between
the **25th and the 31st in every year** (verified 1990–2050), so the publisher's own rule puts its
December edition inside Christmas week *every year*, and December is the only month where that rule
can collide with a market holiday at all — **in 5 of the 37 years 1990–2026 the last Tuesday of
December WAS Christmas Day** (1990, 2001, 2007, 2012, 2018). 2026 is not one of them: Dec 25 is a
Friday and **2026-12-29 is an ordinary full session**. That arithmetic has a sharp side effect the
sibling could not see: **the two years it names as breaking the year-end vol compression — 2012's
fiscal cliff and 2018's shutdown — are two of the five years this release date does not exist**, so
every "the December release day is calm" number is measured on a sample that structurally drops the
worst cases. Measured on CBOE's own history anyway, the December last Tuesday is quieter but mostly
not significantly: **SPX |c2c| 0.4005% vs 0.5530%, p=0.2996** (n=26, 1996+), **VIX9D/VIX 0.913 vs
0.942, p=0.3536** (n=13) — and the one real hit, **VIX intraday range 0.845 vs 1.280 points,
p=0.0432**. Date is **`estimate`**, the label is taxonomy. Nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-111) | **Stand aside** | High | `symbols: []`, D-111, October data does not exist and neither does any of the July / August / September data that will frame it. A re-grep of `trade-playbooks.md` and `multi-symbol-sweep.md` for `housing` / `home price` / `house price` / `case-shiller` / `hpi` returns **0 hits** today. This session's job was to write the canonical file for an id that existed only as a proposal, and to test what is true of the December edition specifically. | A macro-keyed house playbook landing in `docs/plans/trade-playbooks.md` before **2026-12-29** — none exists today |
| This week | **Stand aside — the series has nothing in the week and the standing edition is fifteen days old** | High | The current release is still **2026-08-25, June-2026 data** (re-fetched today, HTTP 200, 90,693 bytes, byte-for-byte the edition the 10-27 sibling read): national NSA **+1.5% y/y**, 20-City **+2.1%**, 10-City **+2.9%**, Chicago **+6.9%** strongest against Seattle **−2.0%** weakest, and the publisher's own line that this was the **13th consecutive month** of falling real home values. Three editions land before this one — **09-29** (July), **11-24** (September, proposed in this PR) and the tracked **10-27** (August). VIX **15.72** (CBOE close 2026-09-08). | The **2026-09-29** July-data edition failing to appear, which would break a twelve-of-twelve realized last-Tuesday record read off PR Newswire today |
| This month | **Do not build an intraday design around the 9:00 a.m. stamp — on the wire record the headline is a 10:00 event** | Medium | Eleven datable editions on PR Newswire, `datePublished` in ET: **10:37 · 11:09 · 09:57 · 09:45 · 10:00 · 10:16 · 10:57 · 10:10 · 09:54 · 10:02 · 10:03**. Zero before 09:30; the median is ~10:03; the two 2026-04-28 stamps are the re-dated pair. `Medium` and not `High` for a stated reason: PR Newswire's `datePublished` is a **distribution** timestamp, and whether S&P's index files themselves post at 9:00 could not be verified — spglobal.com returned **403** for the sixth lane running. | Any dated, sourced record of the Case-Shiller **press release** hitting the tape before **09:30 ET** — a wire timestamp, an embargo notice, or a terminal headline stamp — on any edition through **2027-06-30** |
| This quarter | **Hold the date as the calendar's one structurally-exposed house-price slot, and read its "calm" numbers as survivorship** | Medium | The last Tuesday of December is always **Dec 25–31**; five times in 37 years it was **Christmas Day itself** and the release could not have happened on the rule's own date. Those excluded years include **2012 and 2018** — precisely the two the FHFA sibling names as the years the year-end VIX9D/VIX compression **inverted**. So this print's release-day sample cannot contain a broken year-end by construction, and **n=13** of VIX9D/VIX readings gives **p=0.3536** where the sibling's 70-session window gave p=0.0076. | The **2029-12-25** collision being resolved in the publisher's favour by a dated, sourced statement of what it does when its own rule names a market holiday — or any December edition through 2028 landing on a day that is not the last Tuesday |

**Signals & conditions** — the buy/sell/hold triggers:

- **No buy signal and no sell signal exists off this event.** `symbols: []`, no macro-keyed house
  playbook (0 hits, re-grepped today), and — the form the 10-27 sibling proved — **no attributable
  release day has ever existed** for this index, because all of them are shared with FHFA and
  Consumer Confidence. The date being `estimate` widens nothing: research is not action.
- **The pre-open channel is not clean, and that is this session's load-bearing finding.** Registered
  as `-2` in its checkable form: the 2026-12-29 press release reaches PR Newswire **at or after
  09:30 ET**. Base rate **11 of 11** datable editions at ≥ 09:45, median ~10:03.
- **The correction is a qualification of two siblings, not a refutation of either.** Neither found a
  release-day effect; what this removes is the design both left open — the 10-27 ledger's *"the one
  channel this print owns"* and the FHFA ledger's kill switch *"an intraday study of the 9:00–10:00
  ET window finds an attributable move."* On the wire record that window contains no Case-Shiller
  headline in any observed edition. **This lane does not edit either file** (#1449); the correction
  belongs on their next pulses and is flagged in the row below.
- **December is the only month where the publisher's own rule can name a market holiday.** Verified
  arithmetically 1990–2050: the last Tuesday of December is always in **[Dec 25, Dec 31]**, and
  Dec 25 is the only fixed-date US market holiday that can ever be a last Tuesday. Five collisions in
  37 years; the next is **2029-12-25**. Registered as `-1` against this date, where the collision
  does *not* apply.
- **The "calm December release day" numbers are survivorship-shaped.** 2012 and 2018 — the two years
  the FHFA sibling identifies as inverting the year-end curve — are two of the five years with no
  last-Tuesday-of-December session at all. Any statement about this print's release-day tape is
  conditioned on Christmas not falling on a Tuesday.
- **One real tape result, and it is about the session, not the print:** VIX intraday range on the 26
  December last Tuesdays since 1996 is **0.845 pts vs 1.280 all-session, p=0.0432**. SPX |c2c| is
  **0.4005% vs 0.5530%, p=0.2996** — not significant, and every tail in that sample is pre-2009 (max
  since 2009 is **1.063%**, 2015). Registered as `-3` and `-4` as ceilings, never as claims about
  this print.
- **The wire record of this series' release dates is wrong for at least one edition, from a second
  independent source.** PR Newswire stamps the **January-2026-data** release at
  **2026-04-28T10:16 ET**, 41 minutes before the February-data edition at **10:57** — while the
  January body itself names *"the March 31, 2026, release date."* The 10-27 lane blamed the
  publisher's newsroom CMS; the distributor carries the same error. **Score the close-out from the
  release body or a data vintage, never from a newsroom or wire date.**
- **The Detroit outage is longer than the sibling could see: at least ten consecutive editions.**
  Verified in every reachable release from **September-2025 data (2025-11-25)** through
  **June-2026 data (2026-08-25)**. Registered as `-5`; by 2026-12-29 an unbroken run would be
  fourteen.
- **Watch (dated)** — July-data edition **09-29** · Oct OPEX **10-16** · August-data edition
  **10-27** (FOMC day 1) · **September-data edition 11-24 (proposed in this PR)** ·
  `cr-expiry-2026-12-11` · Dec OPEX **12-18** · Christmas Eve half day **12-24** · **market closed
  12-25** · the six-item **12-28** · **this print 12-29** at 09:00 with FHFA HPI, Consumer Confidence
  at 10:00 and a 7Y auction · `fomc-minutes-2026-12-30` · the eight-item **12-31** cluster ·
  November-data edition **2027-01-26** (considered and declined below).

## Initial research

### The question, plainly

This id existed only as `proposals/case-shiller-hpi-2026-12-29.from-treasury-2y-note-2026-12-28.json`
— filed on a coverage argument that is sound and, by itself, not a finding: the calendar tracked
`fhfa-hpi-2026-12-29` and `consumer-confidence-2026-12-29` but not the third publisher keyed to the
same last Tuesday. Two ledgers have already taken most of this apart. The
[case-shiller-hpi-2026-10-27](case-shiller-hpi-2026-10-27.md) lane established what is true of *this
index* — pre-chewed by construction, never attributable on a daily bar — and the
[fhfa-hpi-2026-12-29](fhfa-hpi-2026-12-29.md) lane established what is true of *this date* — a thin
holiday session whose front vol curve compresses mechanically, exposed to `cr-expiry-2026-12-11`.

So the honest question is neither:

**What is true of the December edition of THIS index that is true of no other edition and of no other
publisher on this date — and does the one clean measurement channel the 10-27 lane left open
actually exist?**

**One-line verdict:** the channel does not exist as designed — on eleven of eleven datable editions
the press release reaches the wire *after* the open, median 10:03 ET — and what is uniquely true of
the December edition is arithmetic rather than statistical: the publisher's own rule places it inside
Christmas week every year, five times in 37 years on Christmas Day itself, and the years it excludes
are exactly the year-ends that misbehaved.

### Method

Macro-print mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so
neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies and the cache-busting rule has no
target. Inputs, all fetched direct **2026-09-09**:

1. **`press.spglobal.com`, the June-2026-data release** (HTTP 200, 90,693 bytes) — the schedule rule
   verbatim, the current headline figures, and the Wayne County notice. It is still the standing
   edition; nothing has published since the 10-27 lane read it.
2. **`prnewswire.com`'s Case-Shiller search listing** (HTTP 200, 220,741 bytes) plus **eleven
   individual release pages** (HTTP 200, 265,878–271,317 bytes each) — the distributor's own
   `datePublished` stamps and each release's body text. **This source is new to this calendar** and
   it is what produces Legs 2 and 4.
3. **CBOE's own daily index history** — `VIX_History.csv` (9,268 sessions OHLC, 1990-01-02 →
   2026-09-08), `VIX9D_History.csv` (3,942, 2011-01-04 →), `SPX_History.csv` (13,029 closes,
   1975-01-02 →). These are the primaries the FHFA 12-29 lane fell back to, and they are the only
   tape source reachable today.
4. **Calendar arithmetic** over 1990–2050, computed rather than looked up, for Leg 1.
5. **`docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md`** — re-grepped for
   `housing`, `home price`, `house price`, `case-shiller`, `hpi`: **0 hits**.

Statistics: two independent designs run on every tape claim — a 20,000-iteration two-sample
permutation test on medians, and a 20,000-iteration randomization test comparing the group median to
the distribution of same-sized random draws from the session pool. Where both are quoted they agree
(SPX |c2c| on December last Tuesdays: **p=0.2996** and **p=0.3038**), which is the check that the
result is not an artifact of one design.

**Nine blocked fetches are recorded in `probe-ref.blocked` rather than papered over**, and the
consequences are stated rather than absorbed:

| Source | Status | What it cost |
|---|---|---|
| `fred.stlouisfed.org/data/*.txt`, `/graph/fredgraph.csv` | **TIMEOUT**, zero bytes, both hosts, repeated | No re-measurement of the series itself. Every content number here is quoted from the publisher's release or cited to the 10-27 lane's 2026-09-08 FRED work at its date |
| `fred.stlouisfed.org/releases/calendar?rid=199` | **HTTP 200 but no release rows rendered** | The 10-27 lane's *second* date source could not be refreshed. Recorded as a failure, not a pass, because a 200 that carries none of the data cited from it is not corroboration |
| `alfred.stlouisfed.org` | **HTTP/2 INTERNAL_ERROR** | No vintage-date check, which is the one record that would settle the January-2026 re-dating from the data side rather than the text |
| `query1.finance.yahoo.com` | **429** | The nine-instrument ETF/builder bundle could **not** be re-measured. Every number about ITB/XHB/DHI/LEN/PHM/TOL/XLRE/SPY/QQQ here is cited to the 10-27 lane at its date and never restated as current |
| `spglobal.com/spdji/...` | **403** (sixth consecutive lane) | No methodology page, so the "how does the 20-City composite treat a suppressed city" question stays open, and no independent confirmation of the 9:00 index-publication time |
| `cmegroup.com` (two paths) | **403** | The listed-derivative question the 10-27 lane left open stays open |
| `api.db.nomics.world` FRED mirror | **404** | The one non-primary substitute tried, and it did not work either — so no aggregator was silently used |

**Deliberately not re-derived.** The 10-27 lane's forecastability study (Leg 4 there), its revision
study, and the FHFA 12-29 lane's Dec 24–31 window tables are **cited at their dates, not re-run**.
Re-running a settled measurement under a second name is the shape of a finding without the substance
of one, and with FRED and Yahoo both down it would have been a re-typing rather than a measurement.

### Leg 1 — the December edition is the only one whose date the publisher's own rule can break · **SUPPORTED**, and it is arithmetic

The rule is unambiguous and was re-read from the current release today:

> The S&P Cotality Case-Shiller Indices are published on the **last Tuesday of each month at 9:00 am
> ET**.

December 2026's Tuesdays are the 1st, 8th, 15th, 22nd and 29th, so the last is **2026-12-29**, and
the two-month lag puts **October 2026** data on it.

**Now apply the rule to December in general.** The last Tuesday of December, computed for every year
1990–2050, always falls between the **25th and the 31st** — never earlier. That is not a base rate;
it is a property of the rule. Three consequences follow, and none of them is true of any other month:

1. **This series' December edition lands inside the Christmas–New Year week every single year.** It
   is the only one of the twelve editions with that guarantee. (The January edition's last Tuesday is
   also Jan 25–31, but no holiday sits there.)
2. **December is the only month in which the rule can name a market holiday.** The fixed-date US
   market holidays are Jan 1, Jun 19, Jul 4 and Dec 25; of those only **Dec 25** can fall in a
   last-Tuesday window. The moving holidays (Presidents Day and Memorial Day on Mondays, Thanksgiving
   on a Thursday, Labor Day on a Monday, Good Friday) can never be a Tuesday at all.
3. **It has happened five times in 37 years.** The last Tuesday of December was Christmas Day in
   **1990, 2001, 2007, 2012 and 2018**. The next collision is **2029-12-25**.

| Year | Last Tue of Dec | Year | Last Tue of Dec | Year | Last Tue of Dec |
|---|---|---|---|---|---|
| 2012 | **Dec 25 — closed** | 2018 | **Dec 25 — closed** | 2024 | Dec 31 |
| 2013 | Dec 31 | 2019 | Dec 31 | 2025 | Dec 30 |
| 2014 | Dec 30 | 2020 | Dec 29 | **2026** | **Dec 29** |
| 2015 | Dec 29 | 2021 | Dec 28 | 2027 | Dec 28 |
| 2016 | Dec 27 | 2022 | Dec 27 | 2028 | Dec 26 |
| 2017 | Dec 26 | 2023 | Dec 26 | 2029 | **Dec 25 — collides** |

**What this does and does not say about 2026-12-29.** It does not raise date risk for this print:
Dec 25 2026 is a **Friday**, the 29th is an ordinary full session, and PR Newswire's record shows
**2025-12-30** — the last Tuesday of December 2025 — published on time at 09:57 ET. What it does is
explain, from the rule rather than from a base rate, the mechanism the
[fhfa-hpi-2026-12-29](fhfa-hpi-2026-12-29.md) lane observed empirically for the *other* publisher on
this date: FHFA's pre-2019 December releases were pulled forward into Dec 20–24 to clear Christmas
week, and the year FHFA moved to a Thursday — 2018 — was the year the last Tuesday **was** Christmas.
The same collision is in Case-Shiller's rule; it simply has not been exercised inside the window this
session can reach.

**And it is an honest limit, not a resolved question.** What S&P DJI actually did in 1990, 2001,
2007, 2012 and 2018 could not be established today: PR Newswire's searchable window covers roughly
twelve months, the publisher's own newsroom archive is 369 pages deep and is a **known-unreliable**
record of realized dates (Leg 4), and ALFRED — the one source that would settle it from the data side
— returned an HTTP/2 error. The years are named here so a lane with working egress can close it in
one pass.

### Leg 2 — the pre-open channel does not exist on the wire record · **REFUTED as a design**, and this is the session's load-bearing finding

The [case-shiller-hpi-2026-10-27](case-shiller-hpi-2026-10-27.md) lane's Leg 3 rests on one premise,
stated there plainly: *"Case-Shiller is the only one of the three last-Tuesday publishers with a
stated release time before the open: 9:00 ET, thirty minutes ahead of the bell… So the overnight gap
is a channel available to this print and to neither of the others."* The
[fhfa-hpi-2026-12-29](fhfa-hpi-2026-12-29.md) lane banked the mirror image as a kill switch: *"An
intraday study of the 9:00–10:00 ET window finds an attributable FHFA move."*

**Both assume the Case-Shiller news is in the market before 9:30. Measured, it is not.** Every
Case-Shiller release PR Newswire carries a datable stamp for:

| Edition (data month) | Wire `datePublished` (ET) | Release date the body names |
|---|---|---|
| July 2025 | 2025-09-30 **10:37** | — |
| September 2025 | 2025-11-25 **11:09** | November 25, 2025 |
| October 2025 | 2025-12-30 **09:57** | December 30, 2025 |
| November 2025 | 2026-01-27 **09:45** | January 27, 2026 |
| December 2025 | 2026-02-24 **10:00** | February 24, 2026 |
| January 2026 | 2026-04-28 **10:16** | **March 31, 2026** |
| February 2026 | 2026-04-28 **10:57** | April 28, 2026 |
| March 2026 | 2026-05-26 **10:10** | May 26, 2026 |
| April 2026 | 2026-06-30 **09:54** | June 30, 2026 |
| May 2026 | 2026-07-28 **10:02** | July 28, 2026 |
| June 2026 | 2026-08-25 **10:03** | August 25, 2026 |

**Eleven of eleven at or after 09:45. None before 09:30. Median ≈ 10:03.** The distribution is tight
around 10:00 with one two-hour outlier (2025-11-25 at 11:09).

**Read it precisely, because the strong reading is not the one the evidence supports.** PR Newswire's
`datePublished` is the **distributor's** timestamp. It is entirely consistent with S&P publishing the
index files to spglobal.com at 9:00 ET on the dot and the narrative release crossing the wire an hour
later — and spglobal.com returned **403** today, so that half is unverified. What the table does
establish is the thing the two sibling designs actually need:

- **The headline — the y/y number, the composite, the quotes, the Detroit notice — is a ~10:00 event**,
  not a 09:00 one. An overnight gap measured to the 09:30 open therefore does not contain it.
- **10:00 is Conference Board Consumer Confidence's stated minute.** So the one slot where the
  Case-Shiller narrative reliably lands is the *most* contaminated minute of the morning, not the
  cleanest.
- **The FHFA lane's "9:00–10:00 window is the clean design" is right about FHFA and wrong about
  this print**, because on this record there is no Case-Shiller headline in that window to find.

This does not overturn either sibling's *result* — both measured a null and this session has no
reason to doubt either. It removes the *hope*: the 10-27 ledger's nine-instrument pre-open test was
not a coarse measurement of a real channel, it was a measurement of a window the news does not
reliably occupy. Registered as `-2` in the only form that can be checked on the day.

**This lane does not edit either sibling's file** (issue #1449). The correction belongs on their next
pulses and is flagged in this session's ledger row.

### Leg 3 — the December release day, measured on CBOE primaries · **MIXED**, and the sample is survivorship-shaped

The FHFA 12-29 lane measured a **window** — all sessions dated Dec 24–31, n=70 — and found the front
of the vol curve compresses (VIX9D/VIX 0.906 vs 0.942, **p=0.0076**) while the level does not
(p=0.5402). That is a seasonal result about the *week*. The set this print actually occupies is
narrower and has never been measured: the **last Tuesdays of December**, derived arithmetically and
intersected with CBOE's own session history.

| Class | Window | n | Dec last-Tue median | All-session baseline | p |
|---|---|---|---|---|---|
| SPX \|close-to-close\| % | 1996+ | 26 | **0.4005%** | 0.5530% | 0.2996 |
| VIX close | 1996+ | 26 | 17.530 | 18.470 | 0.5661 |
| VIX intraday range (pts) | 1996+ | 26 | **0.845** | 1.280 | **0.0432** |
| VIX9D / VIX ratio | 2011+ | 13 | 0.9132 | 0.9416 | 0.3536 |

**One hit in four, and it is the vol-of-vol one.** The December last Tuesday is a measurably narrower
VIX session (p=0.0432); it is *not* a significantly quieter SPX session, *not* a lower VIX session,
and — the interesting one — **not a significantly compressed front curve on the release days
themselves**, where the sibling's window result was p=0.0076.

**The reason for that gap is the finding, not the p-value.** Leg 1's arithmetic says the last Tuesday
of December cannot exist in a year when Christmas falls on a Tuesday. The excluded years are 1990,
2001, 2007, **2012** and **2018** — and 2012 and 2018 are *precisely* the two years the FHFA lane
identifies as the ones that broke the year-end compression (the fiscal cliff and the shutdown, both
running the whole Dec 24–31 window inverted above 1.00). So:

- **This print's release-day sample structurally excludes the two worst year-ends in the VIX9D era.**
  It is not that December release days happen to be calm; it is that the sample cannot contain the
  two known non-calm cases.
- Of the 13 December last Tuesdays with VIX9D data, **12 printed a ratio below 1.00**; the single
  exception is **2013 at 1.002**. That is a real base rate — for a sample that drops its own worst
  observations.
- Any forward test on this session's vol behaviour is therefore a **ceiling on a conditioned
  sample**, and is registered as such rather than as a claim about the print.

**The SPX record, raw, because the median hides a regime split.** The 26 December last Tuesdays since
1996 carry every one of their large moves before 2009 — 1996 **1.739%**, 1997 **1.835%**, 1998
**1.332%**, 2000 **3.163%**, 2008 **2.441%**. From 2009 on the fifteen observations are 0.140, 0.077,
0.008, 0.396, 0.489, **1.063** (2015), 0.225, 0.106, 0.295, 0.223, 0.101, 0.405, 0.423, 0.428,
0.138 — **max 1.063%, fourteen of fifteen under 0.5%**. The last five (2021–2025) reproduce the FHFA
12-29 lane's own five-session table **exactly** (0.101 / 0.405 / 0.423 / 0.428 / 0.138), which is the
check that all three ledgers on this date read one tape.

The ceiling this session uses is the **last-Tuesday p75 since 2021, 1.1052%** (n=68) — computed
independently here and reconciling to the FHFA lane's **1.1122%** to within a quantile-interpolation
difference on the same 68 sessions.

### Leg 4 — the public record of this series' release dates is wrong, and now from two independent sources · **SUPPORTED**

The 10-27 lane resolved the disputed March-2026 slot and banked a caution: *"this publisher's
newsroom archive is not a record of realized release dates."* It attributed the error to a CMS
platform change visible in S&P's own listing. **The error is not confined to the publisher's
newsroom.** PR Newswire — a different company, with its own sequential release ids and its own
timestamps — carries it too:

- The **January-2026-data** release is stamped **2026-04-28T10:16:00-04:00**, dateline *"NEW YORK,
  April 28, 2026"*, PRN id **302755832**.
- The **February-2026-data** release is stamped **2026-04-28T10:57:00-04:00**, PRN id **302755887** —
  **55 ids and 41 minutes later**, where every other consecutive pair in the set is 22,000–33,000 ids
  apart.
- The January release's **own body** reads: *"…no valid January 2026 update of the Detroit S&P
  Cotality Case-Shiller Index will be provided for **the March 31, 2026, release date**."*

So two independent public records of this series — the publisher's newsroom and its wire distributor
— both place a release on a date its own text contradicts, and they agree with each other. The 10-27
lane's resolution stands (the ALFRED 2026-03-31 vintage carrying January-2026 data is the
data-side proof, cited at its date since ALFRED was unreachable today); what changes is the *scope*
of the caution and therefore the *instruction*:

> **Score "did the release land on 2026-12-29?" from the release body text or a data vintage. Never
> from a newsroom listing, a wire dateline, or a `datePublished` stamp** — all three are known to be
> wrong for at least one edition of this exact series inside the last twelve months.

That is written into forward test `-1` rather than left as prose, because it is the one instruction a
close-out session will actually need.

### Leg 5 — content, and the Detroit outage is longer than anyone has recorded

**The standing edition has not changed.** `press.spglobal.com`'s June-2026-data release, re-fetched
today at HTTP 200 / 90,693 bytes, is byte-for-byte the edition the 10-27 lane read on 2026-09-08:
national NSA **+1.5% y/y** (up from +1.2%), 10-City **+2.9%**, 20-City **+2.1%**, NSA m/m **+0.4%**
on both national and 20-City, SA m/m **+0.1%** national and **+0.3%** 20-City, Chicago **+6.9%**
strongest against Seattle **−2.0%** weakest, and the publisher's own framing that for the **13th
consecutive month** US home values fell **in real terms**. Nothing has published in the fifteen days
since; the next edition is **2026-09-29**.

**How old this print will be, stated precisely.** The national index is a three-month moving average
at a two-month lag, so the 12-29 edition averages **August, September and October 2026** closings —
transactions signed roughly June through September. It is the **last edition of 2026** and it still
contains almost nothing signed after the **2026-09-16 FOMC**, whose effect on contract signing would
reach closings in October–November and print in **January–February 2027**. Whatever the December
print says about the September rate decision, it says by accident.

**Where the forecast will stand on the day, borrowing the 10-27 lane's measurement rather than
re-running it:** persistence — repeating the previously published m/m — forecasts this series to
**0.119pp** one step out and **0.201pp** two steps out, against a median monthly move of **0.312pp**
(FRED `CSUSHPISA` vs `HPIPONM226S`, 2015+, n=138, measured 2026-09-08). Three editions land before
this one, so by 2026-12-29 the published series will run through **September** and this print is
exactly **one step out** — the tightest this series ever gets. Today, at D-111 with the series
published only through June, it is **four steps out**, and no October consensus exists or can.

**The Detroit outage runs at least ten consecutive editions, and the start is earlier than this
session can see.** The 10-27 lane recorded *"at least six consecutive editions (January-data through
June-data)."* Every release reachable on PR Newswire carries it:

| Data month | Released | Notice |
|---|---|---|
| September 2025 | 2025-11-25 | *"September 2025 transaction records for Wayne County, MI, are delayed at the local recording office… not able to generate a valid September 2025 update"* |
| October 2025 → June 2026 | 2025-12-30 → 2026-08-25 | the standing paragraph, month swapped, in **all nine** |

That is **ten consecutive editions** with no valid Detroit update for a city inside the headline
20-City Composite, and 2025-11-25 is where PR Newswire's search window ends, not where the outage
starts. If unbroken, 2026-12-29's edition would be the **fourteenth**. How the composite is computed
when a constituent has no valid update is still **not stated** in any release and the methodology
page returned **403** for the sixth lane running.

### The adjacency sweep

- **Peer prints** — n/a, `symbols: []`.
- **Macro surprises** — none since the last row; there is no last row. The corridor within five days
  holds **27 tracked or proposed events**, and it is the sparsest-in-scheduled-news, densest-in-
  closure corridor on this calendar: **12-24** Christmas Eve half day and the Treasury coupon
  announcement; **12-25 the market is closed**; **12-28** advance economic indicators, the BoJ
  summary of opinions, two SIFMA closures, the 2Y and 5Y notes and a proposed Dallas Fed
  manufacturing survey; **12-29 this print at 09:00** with `fhfa-hpi-2026-12-29` (the only
  `confirmed` entry in the corridor besides the FOMC minutes), Consumer Confidence at 10:00, a 7Y
  note and a proposed Dallas Fed services survey; **12-30** `fomc-minutes-2026-12-30`, the corridor's
  only scheduled market-moving item; **12-31** an eight-item cluster including the Russell
  style-capping effective date, the S&P select-sector secondary reweight, the SIFMA bond early close
  and the China retaliation-suspension expiry; **2027-01-01** the New Year closure. Twenty-four of
  the twenty-seven are `estimate`.
- **Volatility regime** — baseline reading, nothing to diff against yet. VIX **15.72**, VIX9D
  **14.81**, ratio **0.9421**, SPX **7,673.52** — CBOE closes for **2026-09-08**, the latest session.
  The VIX reading reconciles **exactly** to the `case-shiller-hpi-2026-10-27` ledger's 09-08 figure,
  which is the check that this lane and the series sibling read one tape. The ETF/builder prices
  either sibling recorded could **not** be refreshed (Yahoo 429) and are not restated.
- **Geopolitical / policy** — the FHFA lapse frame (12 U.S.C. § 4516(f)(2)–(3), PL 119-103 through
  **2026-12-11**) **does not apply to this publisher**, exactly as the 10-27 lane said, and it is not
  borrowed. The contrast is worth one line, though, because it is specific to this date: on
  2026-12-29 the calendar carries two house-price indices published within an hour of each other,
  one immune to a funding lapse **by statute** and one immune **by not being a government agency at
  all** — while the Census housing quantities that frame them are immune to neither. If
  `cr-expiry-2026-12-11` lapses, this morning is where the house-price picture survives and the
  house-quantity picture does not. That is an information-availability observation and nothing more;
  `symbols: []` and there is nothing to express it in. This print's own live risk is unchanged and is
  a different kind of thing: a **county recording office**.
- **Event tape** — no October consensus exists at D-111 and none can before the 09-29, 10-27 and
  11-24 editions land. Every content statement in Leg 5 is a published figure or a cited base rate.
- **One dated event proposed in this PR**, its own file owned by this lane:
  **`case-shiller-hpi-2026-11-24`** — the September-data edition, the last one before this print, on
  exactly the precedent the 10-27 lane set when it proposed its own predecessor and declined the
  rest of the series. Leg 5 gives it the number: it moves this print from a two-step to a one-step
  forecast, 0.201pp → 0.119pp. It is also a coverage asymmetry rather than a preference —
  `fhfa-hpi-2026-11-24` and `consumer-confidence-2026-11-24` are both already tracked and all three
  publishers key on that same last Tuesday.
- **Two considered and declined, so their absence reads as a decision.** The **2027-01-26**
  November-data edition is equally derivable and equally missing, but a successor changes nothing
  about this event's uncertainty where a predecessor halves it; proposing both would be the backfill
  the 10-27 lane declined. And **CME's listed Case-Shiller derivatives** — still the one open
  question that could overturn `symbols: []` — returned **403** on two paths today, the same answer
  the 10-27 lane got. A 403 is not an answer and this ledger does not treat it as one.

### Honest limits

- **The wire-timestamp finding is about distribution, not about index publication.** PR Newswire
  stamps when *it* posted. It is fully consistent with the index files hitting spglobal.com at 9:00
  ET as the rule states. The claim made here is narrow and is the one the sibling designs need: the
  *headline* is a ~10:00 event on eleven of eleven observations. spglobal.com returned 403, so the
  9:00 half is unverified, and the `This month` call is graded `Medium` for that reason alone.
- **n=11 is eleven.** PR Newswire's searchable window is roughly twelve months. A longer record could
  contain pre-open editions; nothing here says it could not, only that none of the eleven visible
  ones is.
- **Leg 1's collision years are named, not resolved.** What S&P DJI published in 1990, 2001, 2007,
  2012 and 2018 could not be established from any source reachable today. The arithmetic is certain;
  the publisher's response to it is unknown.
- **The December tape sample is small and conditioned.** n=26 for SPX and VIX, n=13 for VIX9D — and
  Leg 3 spells out that the conditioning is not random: the sample cannot contain a year in which
  Christmas fell on a Tuesday, which is two of the three worst year-ends in the modern record. Read
  every number in that table as a ceiling on a filtered sample.
- **The tape work could not touch a housing instrument.** Yahoo returned 429, so ITB / XHB / DHI /
  LEN / PHM / TOL / XLRE / SPY / QQQ were **not** re-measured and every figure about them here is
  cited to the 10-27 lane's 2026-09-08 measurement at its date. The one channel that could carry a
  house-price-specific effect is therefore untested by this session — which is a smaller loss than it
  looks, since Leg 2 argues the channel is not where the news arrives.
- **No content number was re-derived from a primary.** FRED and ALFRED were both unreachable, so the
  forecastability, revision and y/y base-rate figures are the 10-27 lane's, cited at their date. That
  is why the y/y-positive claim is carried here as a **kill switch and not as a registered forward
  test** — registering a prediction whose base rate this session could not re-measure would be
  borrowing conviction.
- **`symbols: []` is doing real work, a fourth time.** Even a clean, significant, right-signed result
  on any of these tests would have no instrument in this app to express it. The stand-aside is
  over-determined.
- **The date is `estimate` and every statement above honors that.** Nothing here is date-keyed
  action; the estimate widens caution and licenses nothing.

## Stance & kill switches

**Stance (date is `estimate`; the label is a taxonomy gap, not date doubt).** Stand aside on
2026-12-29, as on every edition of this report — and take one design off the shelf. Four frames.
**On identity:** the proposal's coverage argument was right and the canonical file is written, but
coverage is not a finding; what this edition adds is one correction and one piece of arithmetic.
**On the channel — the load-bearing one:** the pre-open window this print was supposed to own is not
where its news arrives. Eleven of eleven datable editions reach PR Newswire between **09:45 and
11:09 ET, median ~10:03, none before 09:30** — after the bell, and within minutes of Conference Board
Consumer Confidence. That qualifies the 10-27 sibling's *"the one channel this print owns"* and the
FHFA 12-29 sibling's *"a 9:00–10:00 intraday window is the clean design"*: neither result changes,
but the open design behind both does. Graded `Medium`, because PR Newswire timestamps distribution
and spglobal.com's 403 leaves the 9:00 index-publication half unverified. **On the date:** the
publisher's own rule places its December edition inside Christmas week **every year** — the last
Tuesday of December is always Dec 25–31 — and December is the **only** month where that rule can
name a market holiday, which it did in **five of the 37 years 1990–2026**. 2026 is not one of them.
The side effect matters more than the risk: because 2012 and 2018 are two of those five, **this
print's release-day sample structurally excludes the two year-ends the FHFA sibling names as the ones
that broke** — so the December session's calm (VIX range **0.845 vs 1.280 pts, p=0.0432**; SPX |c2c|
**0.4005% vs 0.5530%, p=0.2996**; VIX9D/VIX **0.913 vs 0.942, p=0.3536**, n=13 where the sibling's
70-session window gave p=0.0076) is a conditioned number, not a property. **On the record-keeping:**
two independent public records of this series' release dates — the publisher's newsroom and PR
Newswire — both mis-date the January-2026 edition to 2026-04-28, 41 minutes before the February one,
while its own body names *"the March 31, 2026, release date."* The close-out must score the schedule
from **body text or a data vintage**, never from a listing. And the **Detroit outage is at least ten
consecutive editions**, September-2025 data through June-2026 data, longer than any ledger has
recorded, on a city inside the headline composite. Nothing here licenses an entry, and there is no
instrument to enter.

**Kill switches** — any one of these ends the stance above and earns a ledger row:

- **The release does not land on 2026-12-29.** Registered as `-1`. Unlike the FHFA sibling — statutorily
  outside appropriations, 222 of 222 months — this publisher is a private provider dependent on county
  recording offices and is already publishing with a live data outage. A miss would validate the risk
  channel both Case-Shiller ledgers name as the live one.
- **Any dated, sourced record of a Case-Shiller press release crossing the tape before 09:30 ET**, on
  any edition through 2027-06-30. Registered as `-2`. That would restore the pre-open channel and
  re-open the 10-27 lane's nine-instrument design as a live question rather than a closed one.
- **The 2026-12-29 session's SPX absolute close-to-close move exceeds 1.1052%**, the last-Tuesday p75
  since 2021 (n=68). Registered as `-3`. Fifteen December last Tuesdays since 2009 have a maximum of
  1.063%. A crossing would most plausibly be the FOMC minutes the next morning or the funding fork,
  and only implausibly this print.
- **VIX's intraday range on 2026-12-29 exceeds 1.127 points**, the December last-Tuesday p75 (n=26).
  Registered as `-4`. This is the only tape class that measured significant on this sample, and a
  crossing would say the one real result does not survive out of sample.
- **The 2026-12-29 release carries no Wayne County / Detroit delay notice.** Registered as `-5`. The
  outage clearing after fourteen editions would remove the only data-integrity item on this print.
- **The October-2026 national NSA y/y prints negative.** Carried as a kill switch and deliberately
  **not** registered as a forward test: FRED was unreachable today, so the 169-of-174 base rate is the
  10-27 lane's measurement at its date and not this session's. A negative print would be the first
  nominal regime signal this index has produced this cycle.
- **S&P DJI states, or is shown by a past December, what it does when its own last-Tuesday rule names
  a market holiday.** Leg 1 proves the collision exists and recurs (next: **2029-12-25**) and could
  not establish the response. Either answer settles a standing question about a rule this calendar now
  derives four Case-Shiller dates from.
- **CME (or anyone) is confirmed to list a live, quoted Case-Shiller derivative.** 403 again today, on
  two paths. A live contract keyed to this index would make it the only entry on this calendar with a
  directly-attached instrument, and `symbols: []` would have to be re-argued rather than inherited.
- **A macro-keyed house playbook lands in `docs/plans/trade-playbooks.md` before 2026-12-29.** 0 hits
  re-grepped today — though on either Case-Shiller ledger's own measurement there would still be
  nothing attributable to trade.

**Registered predictions** (zero capital by design, scored from re-run data, never from memory) — see
[`forward-tests/case-shiller-hpi-2026-12-29.md`](../forward-tests/case-shiller-hpi-2026-12-29.md):

- `FT-case-shiller-hpi-2026-12-29-1` — the **release lands on 2026-12-29**, scored from the release
  body or a data vintage and never from a listing date. Score by 2027-01-05.
- `FT-case-shiller-hpi-2026-12-29-2` — the **2026-12-29 press release reaches PR Newswire at or after
  09:30 ET**. Base rate 11 of 11 at ≥ 09:45. The checkable form of this session's central finding.
  Score by 2026-12-30.
- `FT-case-shiller-hpi-2026-12-29-3` — the **2026-12-29 SPX absolute close-to-close move is below
  1.1052%**, the last-Tuesday p75 since 2021. Score by 2026-12-30.
- `FT-case-shiller-hpi-2026-12-29-4` — **VIX's 2026-12-29 intraday range is below 1.127 points**, the
  December last-Tuesday p75 since 1996 — the out-of-sample test of the one significant result here.
  Score by 2026-12-30.
- `FT-case-shiller-hpi-2026-12-29-5` — the **2026-12-29 release again carries a Wayne County /
  Detroit delay notice**, which would be the fourteenth consecutive edition. Score by 2026-12-30.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-111 | **Initial research on an id that existed only as `proposals/case-shiller-hpi-2026-12-29.from-treasury-2y-note-2026-12-28.json`, now shadowed by the canonical `src/domain/market-events/case-shiller-hpi-2026-12-29.json` written this session — the calendar's third Case-Shiller entry and its first December one.** Two ledgers already own most of this date: `case-shiller-hpi-2026-10-27` (this index: pre-chewed, never attributable) and `fhfa-hpi-2026-12-29` (this date: thin holiday session, front-curve compression, exposed to `cr-expiry-2026-12-11`). So this session asked only what is true of the DECEMBER edition of THIS index, and found one correction and one piece of arithmetic. **LEG 2 — THE LOAD-BEARING FINDING: the pre-open channel does not exist on the wire record.** From a distributor new to this calendar — prnewswire.com, search HTTP 200 220,741 bytes plus eleven item pages HTTP 200 — every datable Case-Shiller edition's `datePublished` in ET: **10:37 · 11:09 · 09:57 · 09:45 · 10:00 · 10:16 · 10:57 · 10:10 · 09:54 · 10:02 · 10:03**. **Eleven of eleven at or after 09:45; none before 09:30; median ~10:03.** The 9:00 a.m. ET in the publisher's rule is INDEX publication; the narrative release — headline, y/y, quotes, Detroit notice — lands after the bell and within minutes of Conference Board Consumer Confidence at 10:00. **This qualifies TWO siblings' open designs without touching either result:** `case-shiller-hpi-2026-10-27` Leg 3 (*"the overnight gap is a channel available to this print and to neither of the others"*) and `fhfa-hpi-2026-12-29`'s kill switch (*"an intraday study of the 9:00–10:00 ET window"*) both assume the news is in the market before 9:30. Graded Medium and not High for a stated reason: PRN's stamp is DISTRIBUTION, and spglobal.com returned **403** (sixth lane running) so the 9:00 index-publication half is unverified. **This lane does not edit another event's file (#1449); the correction is for their next pulses.** **LEG 1 — ARITHMETIC, not a base rate: December is the only month whose date the publisher's own rule can break.** Computed 1990–2050: the last Tuesday of December is **always Dec 25–31**, so this series' December edition lands inside Christmas week EVERY year, and Dec 25 is the only fixed-date US market holiday that can ever be a last Tuesday (Jan 1 / Jun 19 / Jul 4 cannot; every moving holiday is a Mon/Thu/Fri). **It was Christmas Day in 5 of 37 years — 1990, 2001, 2007, 2012, 2018 — next collision 2029-12-25.** 2026 is NOT one: Dec 25 2026 is a Friday and 12-29 is an ordinary full session (PRN shows 2025-12-30, the prior December last Tuesday, published on time at 09:57). This is the mechanism behind the FHFA sibling's empirical finding that December is the one slot FHFA moved — 2018's last Tuesday WAS Christmas. What S&P DJI did in those five years could not be established (PRN's window is ~12 months, ALFRED HTTP/2 error, the newsroom is 369 pages and known-unreliable) and the years are named for a lane with egress. **LEG 3 — the December last-Tuesday tape, measured on CBOE primaries and never measured before: SPX \|c2c\| 0.4005% vs 0.5530% p=0.2996 (n=26, 1996+) · VIX close 17.53 vs 18.47 p=0.5661 · VIX intraday range 0.845 vs 1.280 pts p=0.0432 · VIX9D/VIX 0.9132 vs 0.9416 p=0.3536 (n=13, 2011+).** One hit in four, the vol-of-vol one. Two designs run on each (20k permutation AND 20k randomization) and they agree (0.2996 / 0.3038). **AND THE SAMPLE IS SURVIVORSHIP-SHAPED, which is the real finding:** Leg 1 means no December last Tuesday exists in 2012 or 2018 — exactly the two years the FHFA sibling names as inverting the year-end compression — so this print's release-day sample **cannot contain the two worst year-ends in the VIX9D era**, which is why n=13 gives p=0.3536 where its 70-session Dec 24–31 window gave p=0.0076. 12 of 13 ratios below 1.00 (sole exception 2013 at 1.002). SPX tails are all pre-2009 (1996 1.739 · 1997 1.835 · 1998 1.332 · 2000 3.163 · 2008 2.441); **2009+ max is 1.063% (2015), 14 of 15 under 0.5%**, and the last five reproduce the FHFA lane's table exactly (0.101 / 0.405 / 0.423 / 0.428 / 0.138). Last-Tuesday p75 since 2021 computed independently at **1.1052%**, reconciling to that lane's 1.1122% on the same 68 sessions. **LEG 4 — the public record of this series' release dates is wrong from a SECOND independent source.** PRN stamps the **January-2026-data** release **2026-04-28T10:16 ET** (id 302755832) and the **February-2026-data** one **2026-04-28T10:57** (id 302755887) — **55 ids and 41 minutes apart** where every other consecutive pair is 22,000–33,000 ids apart — while the January body reads *"…for **the March 31, 2026, release date**."* The 10-27 lane blamed S&P's newsroom CMS; the wire distributor carries the identical error. **Instruction written into `-1`: score the schedule from body text or a data vintage, NEVER from a newsroom listing, a wire dateline or a `datePublished` stamp.** **LEG 5 — content and the outage.** Standing edition unchanged at **2026-08-25 (June data)**, re-fetched HTTP 200 90,693 bytes, 15 days old: national NSA **+1.5% y/y**, 10-City **+2.9%**, 20-City **+2.1%**, SA m/m +0.1% / +0.3%, Chicago **+6.9%** vs Seattle **−2.0%**, **13th consecutive month** of real declines. This print carries **October 2026** = a 3-month MA of Aug/Sep/Oct closings signed ~Jun–Sep, so the LAST edition of 2026 still contains almost nothing signed after the **2026-09-16 FOMC** (that transmission prints Jan–Feb 2027). By 12-29 the series runs through September, making this print exactly **one step out** — persistence MAE **0.119pp** against a 0.312pp median move (the 10-27 lane's FRED measurement, cited at its date, NOT re-run); today at D-111 it is **four** steps out. **THE DETROIT OUTAGE IS AT LEAST TEN CONSECUTIVE EDITIONS, not the six on record** — verified in every PRN-reachable release from **September-2025 data (2025-11-25)** through **June-2026 data (2026-08-25)**, and 2025-11-25 is where PRN's window ends, not where the outage starts. Unbroken, 12-29 would be the **fourteenth**. How the 20-City composite treats a suppressed constituent is still unstated; methodology page 403. **ADJACENCY SWEEP — peers:** n/a, `symbols: []`. **Macro:** **27 tracked/proposed events within 5 days**, the densest-in-closures corridor on this calendar — 12-24 half day + coupon announcement, **12-25 closed**, 12-28 (AEIR, BoJ opinions, two SIFMA closures, 2Y + 5Y notes, proposed Dallas Fed mfg), **12-29 this print 09:00 + `fhfa-hpi-2026-12-29` + Consumer Confidence 10:00 + 7Y note + proposed Dallas Fed services**, 12-30 `fomc-minutes-2026-12-30` (the corridor's only scheduled market-mover), an eight-item 12-31 cluster (Russell style capping, S&P select-sector reweight, SIFMA early close, China retaliation expiry, JPX closure, NERC, Georgia PSC, proposed TIC), 2027-01-01 closed. **24 of 27 are `estimate`.** **Volatility:** VIX **15.72**, VIX9D **14.81**, ratio **0.9421**, SPX **7,673.52** (CBOE closes 2026-09-08). Baseline; nothing to diff yet. Reconciles EXACTLY to the `case-shiller-hpi-2026-10-27` ledger's 09-08 VIX. ETF/builder prices NOT refreshed (Yahoo 429) and not restated. **Geopolitical:** the FHFA lapse frame (§ 4516(f)(2)–(3), PL 119-103 through 12-11) **does not apply** to a private provider and is not borrowed — but one line is specific to this date: 12-29 carries two house-price indices an hour apart, one lapse-immune **by statute** and one **by not being a government agency**, while the Census quantities that frame them are immune to neither. Information-availability only; `symbols: []`. This print's live risk stays a **county recording office**. **Event tape:** no October consensus at D-111, none possible before 09-29 / 10-27 / 11-24. **NINE BLOCKED FETCHES, none silently substituted, all in `probe-ref.blocked`:** FRED `/data/*.txt` and `fredgraph.csv` **TIMEOUT** (zero bytes, repeated), FRED `releases/calendar?rid=199` **HTTP 200 WITH NO ROWS RENDERED** (recorded as a failure — a 200 carrying none of the cited data is not corroboration, and this was the 10-27 lane's second date source), ALFRED **HTTP2_INTERNAL_ERROR**, Yahoo **429**, spglobal.com **403**, cmegroup.com **403** on two paths, DBnomics' FRED mirror **404** (the one non-primary substitute tried, so no aggregator was silently used). Consequences stated: **no content number was re-derived from a primary** and all are cited to the 10-27 lane at its date, which is why the y/y claim is a kill switch and **not** a registered forward test; and the nine-instrument ETF/builder bundle **could not be re-measured**. **ONE DATED EVENT PROPOSED** (own file, `estimate`): **`case-shiller-hpi-2026-11-24`** — the September-data edition, this print's immediate predecessor, on exactly the precedent the 10-27 lane set proposing its own predecessor; it moves this print from a two-step to a one-step forecast (0.201pp → 0.119pp), and `fhfa-hpi-2026-11-24` + `consumer-confidence-2026-11-24` are both already tracked on that same last Tuesday, so it is a coverage asymmetry rather than a preference. **TWO DECLINED ON THE RECORD:** the **2027-01-26** successor (a successor changes nothing about this event's uncertainty where a predecessor halves it — proposing both is the backfill the 10-27 lane declined) and **CME's listed derivatives** (403 on two paths again; a 403 is not an answer). **Five forward tests registered:** `-1` (lands 12-29, scored from body text or vintage and never from a listing date), `-2` (**the press release reaches PRN at or after 09:30 ET** — the checkable form of the central finding), `-3` (SPX \|c2c\| below the 1.1052% last-Tuesday p75), `-4` (**VIX range below the 1.127pt December last-Tuesday p75** — out-of-sample test of the only significant result), `-5` (the Detroit notice recurs, edition fourteen). | **Initial stance set: stand aside, and take one design off the shelf. The pre-open channel this print was supposed to own is not where its news arrives — 11 of 11 datable editions reach PR Newswire between 09:45 and 11:09 ET, median ~10:03, none before 09:30, i.e. after the bell and within minutes of Consumer Confidence. That qualifies the 10-27 sibling's overnight-gap design and the FHFA 12-29 sibling's 9:00–10:00 kill switch without changing either null; graded Medium because PRN timestamps distribution and spglobal.com's 403 leaves the 9:00 index-publication half unverified. The date's own truth is arithmetic: the last Tuesday of December is always Dec 25–31, so this edition sits inside Christmas week every year, and December is the only month whose rule can name a market holiday — it did five times in 37 years (1990, 2001, 2007, 2012, 2018; next 2029). 2026 is not one. The side effect beats the risk: 2012 and 2018 are two of those five, so this print's release-day sample structurally EXCLUDES the two year-ends the FHFA sibling names as broken, and its calm (VIX range 0.845 vs 1.280 p=0.0432 the only hit; SPX \|c2c\| p=0.2996; VIX9D/VIX p=0.3536 at n=13 against that lane's p=0.0076 at n=70) is conditioned, not a property. Two independent public records — the newsroom AND the wire — mis-date the January-2026 edition, so the close-out must score the schedule from body text or a data vintage. The Detroit outage is at least ten consecutive editions, not six.** | 2026-10-09 (low, 15+ band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-case-shiller-hpi-2026-12-29.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
