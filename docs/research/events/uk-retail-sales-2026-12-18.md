# UK retail sales — November 2026, the Black Friday print that is more comparable than it looks — uk-retail-sales-2026-12-18

**Kind:** macro-print · **Date:** 2026-12-18 (estimate, EST: — ons.gov.uk/releases/retailsalesgreatbritainnovember2026, re-fetched direct 2026-09-10, "Release date: 18 December 2026 7:00am" / "This release is not yet published"; the label is a taxonomy gap — `market-events-data.ts` has `CENSUS:` for the US retail print and no slot for the ONS) · **Impact:** low
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"low:15+","adjacentIds":["boj-tankan-2026-12-14","g20-miami-2026-12-14","empire-state-mfg-2026-12-15","pjm-capacity-auction-2026-12","ppi-2026-12-15","sp-global-investment-manager-index-2026-12-15","tic-monthly-2026-12-15","uk-labour-market-2026-12-15","industrial-production-2026-12-16","mtis-2026-12-16","nahb-hmi-2026-12-16","retail-sales-2026-12-16","uk-cpi-2026-12-16","uk-ppi-2026-12-16","boe-decision-2026-12-17","ecb-decision-2026-12-17","housing-starts-2026-12-17","import-export-prices-2026-12-17","pending-home-sales-2026-12-17","philly-fed-mfg-2026-12-17","puct-batch-zero-report-open-meeting-2026-12-17","treasury-coupon-announcement-2026-12-17","boj-decision-2026-12-18","intl-transactions-q3-2026-12-18","japan-cpi-2026-12-18","opex-2026-12-18","sp-quarterly-rebalance-effective-2026-12-21","consumer-confidence-2026-12-22","treasury-5y-tips-2026-12-22","uk-public-sector-finances-2026-12-22","boj-minutes-2026-12-23","durable-goods-2026-12-23","gdp-q3-2026-third-2026-12-23","new-home-sales-2026-12-23","pce-2026-12-23","treasury-20y-bond-2026-12-23","treasury-2y-frn-2026-12-23"],"screenStreak":0,"blocked":[{"url":"https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/november2024","status":"429","at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **The proposal filed this event as a hazard on two counts. Both measure false, and the
truth is the opposite of each.** The proposer called November *"the single noisiest month for
seasonal adjustment in the series"* — over 2010–2025 ex-covid, November's seasonally adjusted volume
month-on-month has a standard deviation of **0.75pp, tenth of twelve months**, against January's
**1.62**, May's **1.36** and December's **1.33** (ONS J5EC, fetched). And it called the print's
landing on US quad-witching an *"attribution hazard"* — the November-edition ONS release has landed
on a US quad-witching Friday in **five of the last six years**, and on those five dates the S&P 500's
overnight gap was **−0.00 / −0.35 / −0.12 / −0.43 / +0.26 %**, a median absolute of **0.264%** against
**0.213%** across all 2,698 sessions since 2015. It is the modal configuration, not an anomaly. **What
this research adds is the mechanic underneath both.** ONS retail-sales months are **4-4-5 week
reporting periods ending on the Saturday nearest 31 December**, so Black Friday is either the
**second-to-last day** of the November period or **six days after it ends** — never anything in
between. That rule reproduces **both** published period strings verbatim (Nov-2019 *"27 October to 23
November"*, Nov-2025 *"2 November to 29 November"*) and **all seven** published Black-Friday in/out
statements from 2018 to 2025. Applied to 2026 it gives a November period of **1–28 November** with
Black Friday on **27 November inside it**, capturing exactly the Friday and the Saturday and never
Cyber Monday — **the identical configuration to the 2025 base year.** So the November 2026 print is
unusually **comparable**, not unusually noisy, and the thing to watch is commentary calling it a
distortion when it isn't. **None of it is ours to trade** — `symbols: []`, and this calendar's tracked
universe is eight US mega-caps. Date is **estimate** on a taxonomy gap, not on the evidence; it widens
caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — there is no instrument here | High | `symbols: []`, and the calendar's tracked universe is AAPL/AMZN/AVGO/CRWV/GOOG/META/MRVL/MSFT — no UK listing, no gilt, no sterling leg. At D-99 there is no position a foreign consumer print could be sized into | Any tracked name moving **>2%** on a session between **2026-09-10** and **2026-12-18** attributable to a UK retail-sales release — the "no price channel" premise is then false and this doc is rebuilt |
| This week | **Watch 2026-09-18 — it is this event's dress rehearsal, eight days out, and it is free** | High | The ONS August-2026 edition publishes **07:00 on Friday 18 September 2026** (release page, fetched), and 2026-09-18 is the **third Friday of September** — US quad-witching. Same 02:00 ET print into the same expiry session, resolving 91 days before the real one | `^GSPC`'s overnight gap into the **2026-09-18** open exceeding **0.60%** — above every prior ONS-print quad-witching (max 0.43%) and every December quad-witching 2016–2025 (max 0.56%) — which puts the "no measurable pairing" claim on the tape as an open question (**FT-uk-retail-sales-2026-12-18-2**) |
| This month | **Stand aside, and do not let the 2026-10-23 print be read as a Budget signal** | Medium | The September-2026 edition lands **five days before** the 2026-10-28 Autumn Budget (already proposed by the `uk-ppi-2026-10-21` lane). It is a pre-Budget volume read with no instrument in this book, and the fiscal event is itself `estimate` | A tracked name gapping **>2%** on **2026-10-23** or **2026-10-28** attributable to UK consumer or fiscal data — the channel premise breaks and the whole UK block is re-tiered |
| This quarter | **Expect a comparable print, and expect commentary to call it a Black Friday distortion anyway** | Medium | The derived reporting-period rule puts Black Friday **inside** the November 2026 period (1–28 Nov, BF 27 Nov) exactly as it was inside the November 2025 period (2–29 Nov, BF 28 Nov). Same capture, same base — the one mechanic known to distort this series is neutral here | The **2026-12-18** bulletin stating a November reporting period that is **not** "1 November to 28 November 2026", or describing Black Friday as falling outside it — the derivation is then wrong and every comparability claim here goes with it (**FT-uk-retail-sales-2026-12-18-1**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-12-18. This is a foreign consumer print
  with no instrument in this book.
- **The rule, stated once** — ONS RSI months are 4-4-5 week periods ending on the **Saturday nearest
  31 December**. November is always a 4-week period. Black Friday is therefore either **+1 day inside**
  it or **−6 days outside** it; there is no third case in 2013–2035.
- **2026 is an inside year** — November period **1–28 Nov 2026**, Black Friday **27 Nov**. It captures
  the Friday and the Saturday; **Cyber Monday (30 Nov) falls into the December period** (29 Nov 2026 –
  2 Jan 2027, five weeks).
- **The base year is also an inside year** — November 2025 period **2–29 Nov**, Black Friday **28 Nov**.
  Same Friday-plus-Saturday capture. That is the whole comparability claim.
- **The next flip is 2030**, not 2027 — outside years are 2013, 2019, 2024, 2030. Nothing about the
  timing mechanic is live again before then.
- **Where the flip actually shows is October, not November** — flagged, not claimed: n=3
  (**FT-…-3**), tested by the 2026-11-20 print.
- **The headline is a 3m/3m number, not the m/m** — every ONS bulletin read leads on *"retail sales
  rose in the three months to \<month\>"*. Any recap quoting a "UK retail sales" figure should say which.
- **It is a first estimate, and first estimates move** — the November 2025 bulletin revised October
  2025 from a **1.1% fall to a 0.9% fall** and September from **+0.7% to +0.8%** in the same release.
- **Watch (dated)** — the rehearsal **09-18** (est, proposed here) · **10-23** (est, proposed by the
  `uk-ppi-2026-10-21` lane) · **Autumn Budget 10-28** (est) · the m/m base **11-20** (est, proposed
  here) · **this print 12-18** (est) · the mirror **2027-01-22** (est, proposed here).

## Initial research

### The question, plainly

This entry arrived as one proposal —
`proposals/uk-retail-sales-2026-12-18.from-uk-public-sector-finances-2026-12-22.json` — read in full
before anything here was written, per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md); the
canonical `src/domain/market-events/uk-retail-sales-2026-12-18.json` was written in this PR from it.

The proposer's date and its series-gap argument are good and are re-verified below. Its two
*analytical* premises are assertions it did not test, and both are load-bearing for how anyone would
read this print:

1. *"The November edition is the Black Friday month's FIRST estimate, the single noisiest month for
   seasonal adjustment in the series."*
2. *"A 02:00 ET UK consumer print opens the same session as the year's densest US derivatives expiry,
   which is an attribution hazard."*

**One-line verdict:** both are false as stated, and in each case the measurement points the other way
— November is one of the **quietest** months in this series, the ONS-print-on-quad-witching pairing is
the **modal** configuration of the last six years, and the reporting-period mechanic that governs all
of it makes the November 2026 print a **like-for-like** comparison with its own base year.

### Method

Sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md); the two instrument
scripts were not run, because `symbols: []` and there is no issuer. Every source below was fetched
**direct on 2026-09-10**, not inherited from the proposer:

- **ONS release calendar** — the November 2026 release page (the date), plus the August 2026,
  September 2026, October 2026 and December 2026 retail-sales release pages (the rehearsal, the
  sibling, the base and the mirror).
- **ONS bulletins** — the November editions for **2018, 2019, 2021, 2022, 2023** and **2025**, read
  for their verbatim reporting-period and Black-Friday statements. (2024's fetch returned **HTTP 429**;
  its Black-Friday placement is taken from the November 2025 bulletin's own statement about it, which
  is a primary for the same fact. Recorded in `probe-ref.blocked`.)
- **ONS bulletin index** — `api.beta.ons.gov.uk` search, `content_type=bulletin`, **137** retail-sales
  bulletins with release timestamps (the cadence band and the quad-witching count).
- **ONS DRSI time series**, pulled as JSON — **J5EC** (all retailers including automotive fuel, volume
  seasonally adjusted, month-on-month % change, 366 monthly observations) and **J5EK** (the matching
  index level).
- **Yahoo** — `^GSPC` daily bars 2015-12-14 → 2026-09-09 (**n = 2,698** overnight gaps) and `^VIX`
  (**17.84**, latest daily bar 2026-09-10; the session may still be live).

One fetch of a cited source failed and is recorded rather than substituted; see *Honest limits*.

### Leg 1 — "The date is 18 December 2026." **SUPPORTED, from the publisher's own calendar.**

`ons.gov.uk/releases/retailsalesgreatbritainnovember2026` reads, verbatim: **"Retail sales, Great
Britain: November 2026"**, **"Release date: 18 December 2026 7:00am"**, **"This release is not yet
published"**, with the summary **"A first estimate of retail sales in volume and value terms,
seasonally and non-seasonally adjusted."** 07:00 London is **02:00 ET** under GMT.

The publisher's own bulletin index corroborates the cadence: the eleven November-edition bulletins
since 2015 printed **2015-12-17, 2016-12-15, 2017-12-14, 2018-12-20, 2019-12-19, 2020-12-18,
2021-12-17, 2022-12-16, 2023-12-22, 2024-12-20, 2025-12-19** — a 14–22 December band that contains
2026-12-18. Note the day-of-week break in it: every edition through 2019 published on a **Thursday**,
every edition from 2020 on a **Friday**. That change is what makes Leg 3 possible at all.

The `estimate` label is a **schema gap**, not a doubt — `market-events-data.ts`'s confirmed-prefix
taxonomy carries `CENSUS:` for the US retail print and has no slot for the ONS, and this lane does not
self-confirm an event it discovered in-sweep.

### Leg 2 — "November is the noisiest month for seasonal adjustment in this series." **REFUTED. It is the tenth-quietest of twelve.**

ONS **J5EC** — all retailers including automotive fuel, volume seasonally adjusted, month-on-month %
change — fetched today, 2010–2025 with the covid years 2020 and 2021 dropped:

| Month | sd of m/m | Month | sd of m/m |
|---|---|---|---|
| January | **1.62** | September | 0.92 |
| May | 1.36 | October | 0.91 |
| December | 1.33 | July | 0.75 |
| April | 1.17 | **November** | **0.75** |
| February | 1.15 | June | 0.74 |
| March | 1.05 | August | 0.63 |

**November ranks tenth of twelve.** On the clean pre-covid window 2012–2019 it ranks tenth of twelve
again (0.69 against April's 1.30). Including 2020 and 2021 does not rescue the claim either — November
2020's **−4.5%** is a lockdown, not a seasonal-adjustment failure, and even with it in, November's
1.32 sits behind April (5.05), May (3.56), June (3.02), January (2.36) and March (2.08).

This is not an accident of the data. It is what a seasonal adjustment that **works** looks like: the
raw November move is enormous — the ONS November 2025 bulletin reports non-seasonally-adjusted volumes
**+11.9%** on the month — and the adjusted series comes out at **−0.1%**. The size of the raw swing is
precisely why ONS models it explicitly, and the bulletin says so: *"We use seasonal adjustment methods
to estimate for these regular impacts, including for recent events, such as promotions as part of
Black Friday sales."*

### Leg 3 — "The print landing on US quad-witching is an attribution hazard." **REFUTED. It is the modal configuration, and it has left no trace.**

Two measurements, both from today's fetches.

**First, the base rate.** Cross the 137 indexed ONS retail-sales release dates against the third Friday
of March, June, September and December:

| November-edition release | Quad-witching? |
|---|---|
| 2020-12-18 · 2021-12-17 · 2022-12-16 · 2024-12-20 · 2025-12-19 | **yes** |
| 2023-12-22 | no |
| 2015–2019 (all Thursdays) | no — the series published on Thursdays until 2020 |

**Five of the last six.** Across all editions, **15** ONS retail-sales releases have landed on a US
quad-witching Friday since 2020. The pairing is not a coincidence the calendar stumbled onto; it is
what happens when a publisher settles on the third-Friday-ish week of the month and the US expiry
calendar is anchored to the third Friday.

**Second, whether it has ever mattered.** The UK print publishes 02:00 ET, so if it reached this book
at all it would reach it through the overnight gap. `^GSPC` prior-close-to-open, fetched today:

| Sample | n | mean gap | median abs gap | largest abs gap |
|---|---|---|---|---|
| **The five ONS-print quad-witchings** | 5 | −0.127% | **0.264%** | **0.43%** |
| All December quad-witchings 2016–2025 | 10 | +0.026% | 0.237% | 0.56% |
| All quad-witchings 2016–2026 | 41 | +0.008% | 0.118% | 0.94% |
| **Every session 2015-12-14 → 2026-09-09** | **2,698** | +0.033% | 0.213% | — (sd **0.53%**) |

The five dates individually: **−0.00 / −0.35 / −0.12 / −0.43 / +0.26 %**. The *largest* of them is
**smaller than one standard deviation of an ordinary session's gap**. There is no hazard to attribute.

**What is true, and is worth one line in a recap:** 2026-12-18 is a genuinely crowded day and the
crowding is domestic. **37** tracked events sit within five days, including `opex-2026-12-18` (high),
`retail-sales-2026-12-16` (the US Census print, high), the **BoE** and **ECB** on 12-17 and the
**BoJ** on 12-18. If something in this book moves that morning, the candidate list is long and this
print is at the bottom of it.

### Leg 4 — "Nothing distinguishes November 2026." **REFUTED — and this is the finding, in the publisher's favour.**

The one mechanic that genuinely distorts this series is *which reporting period Black Friday falls
into*, and ONS says so plainly. From the **November 2025** bulletin, verbatim:

> "Black Friday took place on 28 November 2025. This fell within our November reporting period, which
> covers the four weeks from 2 November to 29 November 2025, whereas in 2024 Black Friday fell into our
> December 2024 reporting period."

And from the **November 2019** bulletin, verbatim:

> "In 2019, the official Black Friday was on 29 November and outside our November reporting period,
> which covers four weeks from 27 October to 23 November."

Those are the only two bulletins in the set that state the period dates outright. They are enough to
recover the rule, because ONS's RSI uses a **4-4-5 week** quarter and the whole grid is pinned by one
anchor. Working backwards from both: the RSI year ends on the **Saturday nearest 31 December**, and
each quarter is 4 + 4 + 5 weeks, so **November is always a four-week period**.

**The rule reproduces both published strings exactly** (2019: 27 Oct – 23 Nov; 2025: 2 Nov – 29 Nov)
and every Black-Friday placement the bulletins state:

| Year | RSI year-end | November period | Black Friday | In? | Bulletin's own words |
|---|---|---|---|---|---|
| 2018 | 29 Dec 2018 | 28 Oct – 24 Nov | 23 Nov | **in** (+1d) | *"included in our reference period"* ✓ |
| 2019 | 28 Dec 2019 | **27 Oct – 23 Nov** | 29 Nov | out (−6d) | *"outside our November reporting period"* ✓ |
| 2021 | 1 Jan 2022 | 31 Oct – 27 Nov | 26 Nov | **in** (+1d) | *"included in our reference period"* ✓ |
| 2022 | 31 Dec 2022 | 30 Oct – 26 Nov | 25 Nov | **in** (+1d) | *"included in our reference period"* ✓ |
| 2023 | 30 Dec 2023 | 29 Oct – 25 Nov | 24 Nov | **in** (+1d) | *"included in our reference period"* ✓ |
| 2024 | 28 Dec 2024 | 27 Oct – 23 Nov | 29 Nov | out (−6d) | *"fell into our December 2024 reporting period"* ✓ |
| 2025 | 3 Jan 2026 | **2 Nov – 29 Nov** | 28 Nov | **in** (+1d) | *"fell within our November reporting period"* ✓ |
| **2026** | **2 Jan 2027** | **1 Nov – 28 Nov** | **27 Nov** | **in (+1d)** | *— the prediction* |

**Seven for seven, and two exact period strings.** Note the structure the table exposes: the margin is
**always +1 day** when Black Friday is in, and **always −6 days** when it is out. Both dates are
Friday/Saturday-anchored, so there is no middle case — Black Friday is either the second-to-last day of
the November period or the Friday of the week after it closed. Across 2013–2035 the outside years are
**2013, 2019, 2024 and 2030**, and nothing else.

**What that gives 2026.** The November period is **1–28 November 2026**; Black Friday is **27
November**. The period captures the Black Friday **Friday and its Saturday** and stops there — Cyber
Monday (30 November) belongs to the December period, which runs **29 November 2026 – 2 January 2027**,
five weeks. **November 2025 had the identical shape:** period 2–29 November, Black Friday the 28th,
Friday-plus-Saturday captured, Cyber Monday (1 December) in the December period.

So the year-on-year comparison the 18 December bulletin prints is **like-for-like on the only timing
mechanic anyone worries about**. The honest headline for this event is the reverse of the proposer's:
it is one of the *cleanest* November prints available, and the risk it carries is that commentary
reaches for "Black Friday distortion" out of habit.

### Leg 5 — "So the flip has no measurable effect anywhere." **MIXED — not in November, and possibly in October, which is flagged and not claimed.**

Split the seasonally adjusted m/m by whether Black Friday was inside that year's November period
(2013–2025, covid years dropped):

| | n | October | November | December |
|---|---|---|---|---|
| Black Friday **inside** | 8 | +0.31% (sd 0.95) | **+0.33% (sd 0.88)** | −0.18% (sd 1.53) |
| Black Friday **outside** | 3 | **−0.77% (sd 0.17)** | **+0.10% (sd 0.45)** | +0.57% (sd 0.37) |

**November is clean.** A 0.23pp gap on n = 8 versus n = 3, against a within-group sd near 0.9, is
nothing. The adjustment absorbs the flip in the month everyone watches — which is Leg 2's result
arriving by a second route.

**October is the interesting cell, and it is n = 3.** The three outside years printed October m/m of
**−1.0% (2013), −0.6% (2019), −0.7% (2024)** — all negative, tightly clustered (sd 0.17), against
+0.31% in the inside years. A mechanism is available: in an outside year the whole period grid sits a
week earlier, so October's period begins in late September. But three observations found by looking
across three months and two groups is exactly the shape of a coincidence, and this ledger declines to
call it. It is **registered** as `FT-uk-retail-sales-2026-12-18-3` and gets its first out-of-sample
read on **2026-11-20** — the October 2026 print, in an inside year, which the flagged pattern says
should *not* look like those three.

### Leg 6 — "It reaches this book somehow." **REFUTED, on the same measurement as its siblings.**

`symbols: []`. The calendar's whole tracked symbol universe is **AAPL, AMZN, AVGO, CRWV, GOOG, META,
MRVL, MSFT** — eight US mega-caps. No UK listing, no retailer, no gilt or sterling instrument, and no
house playbook keyed to consumer volumes, rates or FX. Leg 3 already measured the only plausible
transmission window (the overnight gap on the exact configuration, five times) and found less
movement than an ordinary session carries.

The proposer's *structural* argument for tracking it anyway is the part that survives and is worth
restating: this calendar follows the **US** retail print monthly (`retail-sales-2026-09-16` through
`-2026-12-16`, tiered `high`) and had **no** canonical UK consumer-volume entry at all — the UK block
was prices (CPI, PPI), labour and fiscal, with the demand side invisible. That asymmetry, not a price
channel, is what this entry fixes.

### Honest limits

- **The 2026 reporting period is a derivation, not a publication.** ONS has published the *rule's
  outputs* for 2019 and 2025 and the in/out fact for five other years; it has not published "1 November
  to 28 November 2026." The derivation is registered as **FT-…-1** rather than asserted, and the
  18 December bulletin states its own period in plain text, so it scores itself.
- **The 4-4-5 quarter shape is inferred from two period strings.** Both published Novembers are four
  weeks and both are consistent with 4-4-5 anchored on the Saturday nearest 31 December; no ONS
  methodology page stating the pattern was fetched this session. A different internal convention that
  happens to agree on those two Novembers would break the 2026 projection without breaking anything
  above it.
- **The 2024 bulletin was not read directly** — `bulletins/retailsales/november2024` returned **HTTP
  429** (rate-limited) and is recorded in `probe-ref.blocked`. Its Black-Friday placement comes from the
  **November 2025** bulletin's explicit statement about 2024, which is a primary for that fact but not
  the 2024 document itself.
- **The October cluster is n = 3 and post-hoc.** It was found by scanning three months across two
  groups; that is a multiple-comparison setting and no correction was applied. It is a flag with a
  dated test, never a call.
- **No number is forecast here.** The m/m base is the October 2026 print, which does not exist yet
  (proposed here for 2026-11-20), and no published consensus for the November 2026 UK print was found
  today. Every call above is about **comparability and attribution**, not level or direction —
  deliberately, because the level compounds assumptions this ledger cannot yet make.
- **It is a first estimate.** The November 2025 bulletin revised October 2025 from a **1.1% fall to a
  0.9% fall** and September from **+0.7% to +0.8%** in the same release; every November bulletin read
  this session revised its predecessor. Anything scored off the 18 December first print is provisional.
- **The `^GSPC` gap sample is n = 5 on the exact configuration.** The wider quad-witching sample
  (n = 41) and the all-session sample (n = 2,698) are what give it context; the five-date result alone
  would not carry the leg.
- **VIX 17.84 may be an intraday reading** — it is the latest daily bar as of 2026-09-10 and the
  session may still be open. It is up from **15.30** on 09-07, a 2.5-point move in three sessions, which
  is the sort of shift the deterministic screen is built to catch.
- **The taxonomy gap, again.** ONS, HM Treasury, Ofgem, MOF Japan, S&P Global, NYSE/SIFMA,
  legislation.gov.uk, HMRC, the Bank of England and the EIA have all been filed `estimate` purely
  because `market-events-data.ts` has no confirmed prefix for a credible non-US primary. Flagged for
  the calendar's owner, not self-resolved — the schema is not this lane's to widen.

## Stance & kill switches

**Stance (date: estimate on a taxonomy gap; the underlying release is on the publisher's calendar).**
**Stand aside at every horizon — there is no instrument in this book with a channel to a UK retail
sales print,** and none is claimed. The entry's operational value is three corrections, none of which
is a trade:

1. **November is not this series' noisy month; it is its tenth-quietest.** sd 0.75pp ex-covid against
   January's 1.62. The raw November move is huge (**+11.9%** NSA in 2025) and the adjustment absorbs it
   (**−0.1%** SA). "First estimate of the Black Friday month" is a description, not a warning.
2. **The quad-witching pairing is the modal case and has left no trace.** Five of the last six
   November editions landed on a US quad-witching Friday; the S&P 500's overnight gap on those five
   never exceeded **0.43%**, against a 0.53% all-session standard deviation. Do not carry it into a
   recap as a hazard.
3. **The 18 December print is a like-for-like read, because Black Friday sits inside the November
   period in both 2026 and its base year.** ONS RSI months are 4-4-5 periods ending on the Saturday
   nearest 31 December; that rule reproduces both published period strings and all seven published
   in/out statements, and it puts the November 2026 period at **1–28 November** with Black Friday on
   **27 November**. The next flip year is **2030**.

The one thing genuinely worth watching is **October**, not November — three outside years printed
October m/m of −1.0 / −0.6 / −0.7 with a 0.17 sd, which is flagged as `FT-…-3` and tested on
2026-11-20. Nothing here is sized, and nothing here is tradeable in this book.

**Kill switches** — any one of these and the stance is rebuilt, not adjusted:

- **A tracked name moves >2%** on a session between 2026-09-10 and 2026-12-18 attributable to a UK
  retail-sales release → the "no price channel" premise is false.
- **ONS moves or cancels the 2026-12-18 release** → the date comes off the board and every horizon
  above is re-dated.
- **The 2026-12-18 bulletin states a November reporting period other than "1 November to 28 November
  2026", or places Black Friday outside it** → the derivation in Leg 4 is wrong, the comparability
  claim collapses, and Legs 4 and 5 are rebuilt from the published periods only (**FT-…-1**).
- **`^GSPC`'s overnight gap into the 2026-09-18 open exceeds 0.60%** → the rehearsal has broken the
  band every prior instance sat inside, and Leg 3's "no measurable pairing" goes back on trial
  (**FT-…-2**).
- **The October 2026 print (2026-11-20) comes in at or below −0.6%** → an inside year has printed
  inside the outside-year cluster, the n = 3 flag loses its only distinguishing feature, and Leg 5's
  October cell is dropped rather than carried (**FT-…-3**).
- **ONS publishes a methodology change to the RSI reporting-period convention or re-bases the series**
  → the whole 4-4-5 derivation is re-run before any of it is cited again.

**Registered forward tests:** `FT-uk-retail-sales-2026-12-18-1`, `-2` and `-3`, in
[`forward-tests/uk-retail-sales-2026-12-18.md`](../forward-tests/uk-retail-sales-2026-12-18.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-10 | 99 | **Initial research; canonical `src/domain/market-events/uk-retail-sales-2026-12-18.json` written from the sole proposal (`from-uk-public-sector-finances-2026-12-22`), read in full first.** Date re-verified from the publisher: ONS release page, fetched — *"Release date: 18 December 2026 7:00am"*, *"not yet published"*. **FINDING 1 — THE PROPOSER'S "NOISIEST MONTH" PREMISE IS FALSE.** ONS **J5EC** (all retailers inc fuel, volume SA, m/m), 2010–2025 ex-covid: November sd **0.75pp**, **tenth of twelve**, vs January **1.62**, May **1.36**, December **1.33**; tenth of twelve again on the clean 2012–2019 window. The raw swing is large (NSA **+11.9%** m/m in Nov-2025 per the ONS bulletin) and the adjustment absorbs it (**−0.1%** SA) — that is a seasonal adjustment working, not failing. **FINDING 2 — THE QUAD-WITCHING "ATTRIBUTION HAZARD" IS THE MODAL CASE.** From the publisher's own bulletin index (137 releases, fetched), the November edition landed on a US quad-witching Friday in **5 of the last 6 years** (2020-12-18, 2021-12-17, 2022-12-16, 2024-12-20, 2025-12-19; 2023 missed) — 15 ONS retail releases on quad-witching since the series moved from Thursday to Friday publication in 2020. `^GSPC` overnight gap (Yahoo, n=2,698 sessions) on those five: **−0.00 / −0.35 / −0.12 / −0.43 / +0.26 %**, median abs **0.264%** vs **0.213%** all-days and an all-day sd of **0.53%**. Largest instance is below one ordinary sigma. **FINDING 3 — THE ONS RSI REPORTING-PERIOD RULE, DERIVED AND VERIFIED.** RSI months are **4-4-5 week periods ending on the Saturday nearest 31 December**, so November is always four weeks and Black Friday is either **+1 day inside** or **−6 days outside** — no middle case. The rule reproduces **both** published period strings verbatim (Nov-2019 *"27 October to 23 November"*, Nov-2025 *"2 November to 29 November"*) and **all 7** published in/out statements 2018–2025. **2026: November period 1–28 Nov, Black Friday 27 Nov, INSIDE — identical shape to the Nov-2025 base year** (Friday + Saturday captured, Cyber Monday in the December period). So the print is **like-for-like**, not distorted; next flip year is **2030**. **FINDING 4 (FLAGGED, NOT CLAIMED, n=3):** the flip shows in **October**, not November — outside years 2013/2019/2024 printed October SA m/m **−1.0 / −0.6 / −0.7** (sd 0.17) vs **+0.31** (sd 0.95) in inside years; November's inside-vs-outside gap is +0.33 vs +0.10, inside noise. Post-hoc across 3 months × 2 groups; registered, not called. Adjacency: **peers** — none, `symbols: []`. **Macro** — UK labour market 12-15, US retail sales + UK CPI + UK PPI + IP + MTIS + NAHB 12-16, **BoE + ECB** 12-17, **BoJ + Japan CPI + opex** 12-18, US PCE 12-23. **Volatility** — **VIX 17.84** (Yahoo `^VIX`, latest bar 2026-09-10, possibly intraday), up from **15.30** on 09-07. **Geopolitical** — G20 Miami 12-14. **Event tape** — no published consensus for this print; first estimates revise (the Nov-2025 bulletin moved Oct-2025 from −1.1% to −0.9% and Sep from +0.7% to +0.8%). **37 adjacency ids** within 5 days. **Three dated adjacencies PROPOSED** (`estimate`, own-owner files, all from fetched ONS release pages): `uk-retail-sales-2026-09-18` (the **dress rehearsal** — an ONS retail print on the 2026-09-18 quad-witching Friday, 8 days out), `uk-retail-sales-2026-11-20` (the **m/m base**, and FT-3's test), `uk-retail-sales-2027-01-22` (the **mirror** — the five-week December period that owns Cyber Monday). `uk-retail-sales-2026-10-23` already carries a proposal from the `uk-ppi-2026-10-21` lane and was **not** duplicated. **Honest weaknesses:** the 2026 period is a derivation, not an ONS publication; the 4-4-5 shape is inferred from two period strings with no methodology page fetched; the October cluster is n=3 and post-hoc; no level or direction is forecast at all. **One fetch failed:** `bulletins/retailsales/november2024` returned **HTTP 429** — recorded in `blocked`; the 2024 placement comes from the Nov-2025 bulletin's own statement about it. | — (stance set: stand aside, no position, no play; three analytical commitments — November is this series' **tenth-quietest** month rather than its noisiest, the quad-witching pairing is **modal and traceless**, and the 18 December print is a **like-for-like** read because Black Friday sits inside the November period in both 2026 and its base year) | 2026-10-10 (low band, ≥15d out ⇒ 30d interval) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-<this-event-id>.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
