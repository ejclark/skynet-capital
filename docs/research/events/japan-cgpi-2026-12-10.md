# Japan Corporate Goods Price Index (November 2026) — japan-cgpi-2026-12-10

**Kind:** macro-print · **Date:** 2026-12-10 (estimate, EST: boj.or.jp/en/statistics/outline/tkohyos.xlsx "Schedule for Releases of Statistical Data (From July 2026 to June 2027)", re-fetched direct 2026-09-05 (HTTP 200, 48,500 bytes), unzipped and parsed cell-by-cell out of its `Statistics data` sheet by this session: row 237 labels the "(For Nov.)" column of the Corporate Goods Price Index, row 239 gives its time as **"Around 8:50 a.m."** — the sheet's own hedged wording, not a flat 08:50 — and rows 238/240 give that column's Excel serial **46366 = 2026-12-10**, with the same row's June serial 46213 = 2026-07-10 matching an already-published release. Filed estimate because the confirmed-prefix taxonomy has `FED:` and no slot for the Bank of Japan, and this lane may not self-confirm an event it discovered in-sweep) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-tankan-2026-12-14","cpi-2026-12-10","cr-expiry-2026-12-11","ecb-quiet-period-start-2026-12-09","ercot-data-center-audit-filing-2026-12-10","fomc-2026-12-09","g20-miami-2026-12-14","g20-sherpa-iv-miami-2026-12-10","government-funding-deadline-2026-12-11","intl-trade-full-report-2026-12-08","japan-balance-of-payments-2026-12-08","pjm-capacity-auction-2026-12","ppi-2026-12-15","productivity-costs-q3-revised-2026-12-08"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and pre-commit now that the 2026-12-10 Tokyo bar is the Fed's, not the
Bank of Japan's.** This session harvested **247 contiguous CGPI releases (2006-01 data → 2026-07
data)** off the Bank's own release list and measured them against **5,039 Nikkei sessions**. The
release is a **clean, well-powered null**: Nikkei median \|opening gap\| **0.520% vs 0.517%** on the
non-CGPI pool — **1.01×, p = 0.93** — with \|close-to-close\| **1.00×**, USD/JPY **1.02× (p = 0.85)**
and the S&P **0.92× (p = 0.41)**. Nothing in 21 years says this print moves anything. **The reason it
still needs a ledger is the date.** The CGPI publishes at ~08:50 JST on **2026-12-10**, ten minutes
before the Tokyo open — which is **the first Tokyo bar after the December FOMC** (2026-12-09,
confirmed, off the Fed's own calendar). Across all **164** post-FOMC Tokyo bars since 2006, the S&P's
FOMC-day move and the next Tokyo opening gap correlate at **r = +0.687** (slope 0.443, sign agreement
**132/164 = 0.805**). This has happened to a CGPI only **three times in 21 years** — 2007-12-12,
2010-08-11, 2011-08-10 — and all three gaps took the sign of the Fed's own session (S&P −2.53% →
Nikkei −1.35%; −0.60% → −1.34%; +4.74% → **+1.86%**). Two corrections fall out. **The December cut is
a denominator artifact**: December CGPIs run 1.55× (p = 0.041) against *all* December sessions but
only **1.40× (p = 0.23)** against **mid-December** ones — because December in Tokyo is quiet
(**0.79×, p = 0.002**), independently replicating the [December Tankan ledger](boj-tankan-2026-12-14.md)'s
seasonal on a different release. **And "post-FOMC means a louder Tokyo open" is not supported**: that
gap runs **1.06×, p = 0.50**; what is elevated is the *session* range (**1.25×, p = 0.021**). Date is
**estimate**; it widens caution and licenses nothing.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — no position exists for this to touch | High | `symbols: []`, no house playbook is rates- or FX-keyed, and at **D-96** the November index is not yet compiled | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any session **2026-09-05 → 2026-12-09** that the tape attributes to Japan's CGPI |
| This week | **Stand aside; the live BoJ question is the 2026-09-18 decision** | High | The [09-18 ledger](boj-decision-2026-09-18.md) owns the near BoJ question; this is a producer-price index 96 days out with no policy instrument attached | Any Bank of Japan notice before **2026-09-30** moving the November CGPI off **2026-12-10 / ~08:50 JST**. Registered as **FT-japan-cgpi-2026-12-10-1**, score by 2026-12-11 |
| This month | **Build no Japan read on this date — the release is a measured null at n=247** | High | \|gap\| **1.01× (p = 0.93)**, \|c2c\| **1.00% ratio (p = 0.95)**, USD/JPY **1.02× (p = 0.85)**, S&P **0.92× (p = 0.41)**; no weekday cell reaches p = 0.19 | **Both** the **2026-11-12** and **2026-12-10** CGPI sessions printing a Nikkei \|opening gap\| **≥ 1.0%** — a 0.231 per-release base rate on CGPI days, so ~0.05 if the two are independent |
| This quarter | **Pre-commit: whatever the 12-10 Tokyo bar does is the Fed's** | Medium | r = **+0.687** on n=164 post-FOMC bars, sign agreement **0.805**; the CGPI adds **1.01×** to that bar and 3/3 historical coincidences tracked the S&P's sign | The **2026-12-10** Nikkei opening gap taking the **opposite** sign to the S&P 500's 2026-12-09 close-to-close move (0.805 base rate on this cell, 0.748 unconditional). Registered as **FT-japan-cgpi-2026-12-10-2**, score by 2026-12-11 |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit, hedge or size is keyed to 2026-12-10 or to that Tokyo session, in any
  branch. `impact: low`, `symbols: []`, date `estimate`.
- **The null, stated once.** 247 releases (2006-02-10 → 2026-08-13), every one with a Nikkei bar:
  \|opening gap\| **0.520% vs 0.517%** (**1.01×, p = 0.933**, pool n=4,792) · \|close-to-close\|
  0.734% vs 0.737% (**1.00×, p = 0.949**) · Tokyo \|intraday\| 0.557% vs 0.489% (**1.14×, p = 0.112**,
  the only non-flat reading and not significant).
- **Nor the yen, nor the S&P.** USD/JPY \|c2c\| **0.329% vs 0.324% = 1.02×, p = 0.854** (n=246);
  S&P \|c2c\| **0.470% vs 0.513% = 0.92×, p = 0.406** (n=243). This has never been an FX event.
- **The date is the whole story.** ~08:50 JST on **2026-12-10** = **18:50 EST 2026-12-09**, i.e. the
  Tokyo auction opens ~4h50m after the **FOMC** statement (confirmed, high) and closes **7.5 hours
  before** the [US CPI](cpi-2026-12-10.md) prints (08:30 ET = 22:30 JST). **This bar prices the Fed
  and does not price the CPI** — the CPI reaches Tokyo's **12-11** session.
- **How much of that bar is the Fed.** All 164 post-FOMC Tokyo bars 2006-2026: corr(S&P FOMC-day
  \|c2c\| signed move, next Tokyo signed gap) = **+0.687**, slope **0.443**, sign agreement
  **132/164 = 0.805** against a 0.748 unconditional Tokyo-follows-Wall-Street rate.
- **…but not that the open is *louder*.** Post-FOMC Tokyo \|gap\| **0.549% vs 0.516% = 1.06×,
  p = 0.504**; \|intraday\| **0.611% vs 0.490% = 1.25×, p = 0.021**. Direction transfers strongly;
  magnitude barely does, and it shows up in the session rather than the auction.
- **The n=3 coincidence, reported as an anecdote and not a base rate.** CGPI days that were also the
  first Tokyo bar after an FOMC: **2007-12-12 (−1.35%)** · **2010-08-11 (−1.34%)** · **2011-08-10
  (+1.86%)** — median \|gap\| 1.347%, **2.61×** other CGPI days (p = 0.031), and **3/3 above every
  threshold tested**, which is what n=3 looks like. Pre-registered against, not on.
- **The December cut dissolves on a matched pool.** December CGPIs (n=20) **0.643%**: vs *all*
  December sessions (0.416%) **1.55×, p = 0.041**; vs **mid-December (days 8-16)** sessions (0.460%)
  **1.40×, p = 0.234**; ex the two largest gaps **1.45×, p = 0.118**. All December Tokyo sessions run
  **0.416% vs 0.524% = 0.79×, p = 0.002**.
- **The release date is mechanically predictable.** **209 of 247** releases fall on the **8th Tokyo
  trading day** of the month (9th ×36, 7th ×2), never before the 10th calendar day. **2026-12-10 is
  the 8th Tokyo trading day of December 2026**, matching the schedule sheet's serial 46366; the same
  two methods agree on the next one (sheet serial 46401 = **2027-01-14** = January 2027's 8th).
- **One dated adjacent event proposed** from the same sheet's 12-05…12-15 corridor: Japan's
  **Balance of Payments (Oct 2026 preliminary), serial 46364 = 2026-12-08, ~08:50 JST** →
  [`japan-balance-of-payments-2026-12-08`](../../../src/domain/market-events/japan-balance-of-payments-2026-12-08.json)
  (`estimate`, low) — the mirror bar, the last full Tokyo session **before** the FOMC.
- **Watch (dated)** — **BoJ decision 2026-09-18** (est) · **September Tankan 2026-10-01** (est) ·
  **BoJ decision 2026-10-30** (est) · **CGPI for Oct. 2026-11-12** (est, same sheet — the dress
  rehearsal for this ledger's null) · **Japan BoP 2026-12-08** (est, proposed here) · **FOMC
  2026-12-09** (confirmed) · **this release 2026-12-10** (est) · **US CPI 2026-12-10** (confirmed) ·
  **December Tankan 2026-12-14** (est, [ledger](boj-tankan-2026-12-14.md)) · **BoJ decision +
  Japan CPI 2026-12-18** (est) · **CGPI for Nov. 2027-01-14** (est).

## Initial research

### The question, plainly

This event was created on 2026-09-05 by the [December Tankan ledger](boj-tankan-2026-12-14.md)'s
adjacency sweep, off the same Bank of Japan release-schedule sheet. Its notes filed it as *"the
missing member of a set this calendar already tracks in full on the US side"* — [US PPI](ppi-2026-12-15.md)
and [Japan national CPI](japan-cpi-2026-12-18.md) were entries; Japan's producer-price print was not.
Nothing was measured about it.

So there are two questions, and the second is the one that matters:

1. **Does Japan's CGPI move anything this calendar can see?**
2. **Given that 2026-12-10's Tokyo auction opens ~4h50m after the December FOMC statement, could a
   move on that bar ever be attributed to the CGPI at all?**

**One-line verdict: no, and no — and the second is the one worth banking before the fact. The CGPI
is the cleanest null this calendar has measured on a Japanese macro print (n=247: Nikkei opening
gap 1.01× at p = 0.93, close-to-close 1.00×, USD/JPY 1.02×, S&P 0.92×), while the bar it prints
into on 2026-12-10 is the first Tokyo session after an FOMC decision, a cell in which the S&P's own
FOMC-day move correlates +0.687 with the Tokyo gap across 164 observations. Two further corrections
fall out of the same data: the loud-looking December CGPI cell (1.55×, p = 0.041) is a denominator
artifact that fades to 1.40× at p = 0.23 against a mid-December pool, and the sibling ledger's
premise that a post-FOMC weekend loads the Tokyo open "toward a breach" does not survive
measurement — that gap is 1.06× at p = 0.50; only the intraday range is elevated, at 1.25×,
p = 0.021.**

**Method:** sourced web research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) plus
measured legs run entirely in this session, all primaries fetched raw and machine-parsed today
(2026-09-05), never through a summariser:

- the **Bank of Japan's own "List of Releases of Corporate Goods Price Index"**
  (`boj.or.jp/en/statistics/pi/cgpi_release/index.htm`, HTTP 200, 50,376 bytes), whose table pairs
  each release **date** with its reference month — plus **three Wayback captures of that same BoJ
  page** (2014-03-19, 2017-05-06, 2022-07-04, HTTP 200 each) to reach back before the Bank's 2022
  site restructure. Merged and deduplicated → **247 releases, 2006-01 data (published 2006-02-10) →
  2026-07 data (published 2026-08-13)**, **zero missing reference months**, overlapping captures
  agreeing on every shared row;
- the **forward release schedule** `tkohyos.xlsx` (HTTP 200, 48,500 bytes) unzipped and read
  cell-by-cell out of its `Statistics data` sheet — rows 237-240 for the CGPI, rows 255-256 for the
  Balance of Payments, and a full decode of every serial in the sheet falling in 2026-12-05…12-15;
- the **Federal Reserve's own FOMC calendars** — the live page (HTTP 200, 164,831 bytes) for
  2021-2027 and the 15 `fomchistorical<year>.htm` pages (HTTP 200 each) for 2006-2020 — parsed to
  **175 scheduled decision dates, 8 per year, 2006-2027**, including **2026-12-09** and the
  "December 8-9\*" row it comes from;
- the **BLS release time** for the 2026-12-10 CPI (08:30 ET), taken from this calendar's own
  `confirmed` entry.

Price work uses the same **Yahoo daily bars `event-material-scan.mjs` itself uses** (`^N225`,
`^GSPC`, `JPY=X`, `^VIX`), pulled today as full OHLC from 2003 so 2006+ has a prior close; the
latest bars (**2026-09-04**: VIX **14.53**, Nikkei **65,020.94**, S&P **7,718.60**, USD/JPY
**156.22**) reconcile exactly with the December Tankan ledger's readings. No instrument scripts:
`symbols: []`, there is no issuer, and `earnings-cycle.mjs`/`intraday-edges.mjs` have no macro mode.
Every p-value is a Monte-Carlo permutation p (20,000 draws unless a cut names fewer) computed here
against the stated pool.

### Conviction legs, tested

1. **The sample is primary, contiguous and complete — SUPPORTED, and it licenses everything below.**
   247 releases across 247 consecutive reference months, every one carrying a Nikkei bar; the
   day-of-month distribution is `{10: 64, 11: 28, 12: 68, 13: 39, 14: 20, 15: 10, 16: 16, 17: 2}` —
   never earlier than the 10th. **This is the largest single-release sample this calendar has
   assembled**, and roughly 11× the December Tankan study's.

2. **The CGPI does not move the Tokyo open — SUPPORTED, and it is the headline.**

   | Measure (Nikkei) | CGPI (n=247) | Pool (n=4,792) | Ratio | p |
   |---|---|---|---|---|
   | \|opening gap\| | 0.520% | 0.517% | **1.01×** | 0.933 |
   | \|close-to-close\| | 0.734% | 0.737% | **1.00×** | 0.949 |
   | \|intraday\| (\|close ÷ open − 1\|) | 0.557% | 0.489% | 1.14× | 0.112 |

   A 1.01× at p = 0.93 on n=247 is not "too small to tell" — it is a **null with power**, which is a
   materially stronger statement than the Tankan study could make on n=22.

3. **Nor the yen, nor the S&P — SUPPORTED.** USD/JPY \|c2c\| **0.329% vs 0.324% = 1.02×, p = 0.854**
   (n=246); S&P \|c2c\| on the same calendar date **0.470% vs 0.513% = 0.92×, p = 0.406** (n=243).
   A producer-price print that leaves the currency untouched is not a policy-expectations event.

4. **No weekday cell survives — SUPPORTED, and the Tankan's failure mode does not reproduce.**

   | Weekday | n | CGPI \|gap\| | Matched pool | Ratio | p |
   |---|---|---|---|---|---|
   | Mon | 39 | 0.643% | 0.603% | 1.07× | 0.794 |
   | Tue | 31 | 0.435% | 0.480% | 0.91× | 0.654 |
   | Wed | 74 | 0.442% | 0.489% | 0.90× | 0.425 |
   | Thu | 63 | 0.457% | 0.554% | 0.82× | 0.196 |
   | Fri | 40 | 0.633% | 0.517% | 1.22× | 0.267 |

   The sibling found December Tankan **Mondays** running 2.31× (p = 0.005) on n=8. Nothing of the
   kind exists here at 3-8× the sample size. **2026-12-10 is a Thursday** — the quietest cell in the
   table, at 0.82×.

5. **The December cut looks loud and is a denominator artifact — SUPPORTED, and it replicates the
   sibling's error class on an independent release.**

   | Cut | n | Median \|gap\| | Baseline | Ratio | p |
   |---|---|---|---|---|---|
   | December CGPI vs **all-December** pool | 20 | 0.643% | 0.416% | **1.55×** | **0.041** |
   | December CGPI vs **mid-December (8-16)** pool | 20 | 0.643% | 0.460% (n=108) | 1.40× | 0.234 |
   | December CGPI **ex its two largest gaps** | 18 | 0.605% | 0.416% | 1.45× | 0.118 |
   | **All December sessions** vs non-December | 397 | 0.416% | 0.524% | **0.79×** | **0.002** |

   The bottom row is **the most significant result in this study, and it is a seasonal.** The
   [December Tankan ledger](boj-tankan-2026-12-14.md) measured the same thing on a 2004+ pool
   (0.85×, p = 0.010) and used it to strike its own sibling's 0.80× headline. **Two independent
   Bank of Japan releases now show the identical artifact**, which promotes it from an observation
   about the Tankan to a **method rule for this calendar**: a December cut is matched against
   mid-December, never against the year. Era split, reported for completeness and not for weight:
   1.91× (2006-2015, n=10) vs 1.36× (2016-2025, n=10). Jackknife on the December median is stable
   at 0.637-0.649, which says no single year carries it — and does not rescue it from the control.

6. **2026-12-10 is the first Tokyo bar after the December FOMC — SUPPORTED, primary, and it is the
   whole reason this ledger exists.** The Fed's own calendar row reads **"December | 8-9\*"** for
   2026, so the statement lands 14:00 ET Wed 2026-12-09. The CGPI publishes ~08:50 JST Thu
   2026-12-10 = **18:50 EST Wed 12-09**, and the Tokyo cash auction opens ten minutes later. The
   prior Nikkei close (15:00 JST 12-09 = 01:00 ET 12-09) is **13 hours before the statement**, so
   the FOMC sits entirely inside this bar's gap.

7. **And that bar is quantitatively the Fed's — SUPPORTED, and it is the leg that sets the stance.**
   Across all **164** first-Tokyo-bars-after-a-scheduled-FOMC, 2006-2026:
   **corr(S&P FOMC-day signed close-to-close, next Tokyo signed opening gap) = +0.687**, slope
   **0.443**, sign agreement **132/164 = 0.805** — against a **0.748** unconditional rate for "Tokyo
   opens in the direction of the prior US session." Whatever the CGPI contributes to that bar has to
   be found inside a term that leaves 1.01× of the variation it started with.

8. **But "post-FOMC = a louder Tokyo open" is REFUTED as stated, and it corrects the sibling.**
   Post-FOMC Tokyo bars vs all others: \|gap\| **0.549% vs 0.516% = 1.06×, p = 0.504**;
   \|intraday\| **0.611% vs 0.490% = 1.25×, p = 0.021**. P(intraday > gap) is **0.494** post-FOMC
   against 0.497 elsewhere, so the shape of the day is not re-ordered — both legs simply scale, the
   session one more than the auction. The [December Tankan ledger](boj-tankan-2026-12-14.md)'s leg 9
   states that the 12-14 open's FOMC/CPI/funding loading *"runs toward a breach"*. On the FOMC
   component, measured on n=164, **it does not** — the effect that survives is the session range,
   not the gap. Its conclusion (stand aside, no channel) is untouched; the mechanism inside it is
   amended.

9. **The n=3 coincidence is an anecdote and is pre-registered against — SUPPORTED as a limit.**
   Only three CGPI releases in 21 years landed on a post-FOMC bar:

   | CGPI date | FOMC | S&P that day | Nikkei gap | Nikkei intraday |
   |---|---|---|---|---|
   | 2007-12-12 | 2007-12-11 | **−2.53%** | **−1.35%** | 0.65% |
   | 2010-08-11 | 2010-08-10 | −0.60% | **−1.34%** | 1.38% |
   | 2011-08-10 | 2011-08-09 | **+4.74%** | **+1.86%** | 0.79% |

   Median \|gap\| 1.347% = **2.61×** other CGPI days (p = 0.031), and **3/3** clear every threshold
   tested (≥0.3% … ≥1.34%). **Three observations produce a 1.000 base rate by construction** — the
   same n-too-small failure the sibling named for its own December Monday cell, arrived at
   independently. What the table does show is **sign**: 3/3 followed the Fed's session, and the
   largest S&P move produced the largest Nikkei gap. That is the claim registered
   (**FT-japan-cgpi-2026-12-10-2**), not the magnitude.

10. **The US CPI is not in this bar — SUPPORTED, from the clock.** [CPI 2026-12-10](cpi-2026-12-10.md)
    is `confirmed` at **08:30 ET** (BLS) = **22:30 JST**, seven and a half hours after Tokyo's 15:00
    JST cash close. The CGPI's Tokyo session therefore prices the FOMC and **no** US statistical
    release; the CPI reaches Tokyo on **12-11**. This is the structural difference between this
    event and the sibling's 12-14, whose Monday open prices a weekend carrying FOMC **and** CPI
    **and** the funding deadline.

11. **The release date is mechanically predictable — SUPPORTED, and it validates the schedule sheet
    independently.** **209 of 247** releases (85%) fall on the **8th Tokyo trading day** of their
    month; 36 on the 9th, 2 on the 7th. Calendar-business-day indexing fits far worse (8th ×131,
    9th ×65, 10th ×23, 11th ×18, 12th ×10), so the rule tracks the **Tokyo exchange calendar**, not
    the Gregorian one. **2026-12-10 is the 8th Tokyo trading day of December 2026** (JPX lists no
    December 2026 closure before Dec 31), matching serial 46366 exactly; **2027-01-14** is the 8th
    Tokyo trading day of January 2027 — with Jan 1-3 and Coming-of-Age Day (Jan 11) closed — matching
    serial 46401 exactly. Two independent methods, two agreements.

12. **No directional drift on release days — SUPPORTED, descriptive only.** Up-gaps **119/247 =
    0.482** against a 0.534 pool rate; mean signed gap **−0.0004%** against **+0.044%**. Reported
    because a reader will ask; **not** tested, **not** a claim, and far too small to be one.

13. **The corridor around this date is loaded, and none of it is Japanese — SUPPORTED, from the live
    calendar.** **14** tracked entries sit within ±5 days: [FOMC 12-09](fomc-2026-12-09.md)
    (confirmed, high) · [CPI 12-10](cpi-2026-12-10.md) (confirmed, high) · the
    [CR expiry](cr-expiry-2026-12-11.md) / [funding deadline](government-funding-deadline-2026-12-11.md)
    12-11 (est, high) · [PPI 12-15](ppi-2026-12-15.md) (confirmed) ·
    [December Tankan 12-14](boj-tankan-2026-12-14.md) (est) · [G20 Miami](g20-miami-2026-12-14.md)
    (est) and its [sherpa session](g20-sherpa-iv-miami-2026-12-10.md) sharing 12-10, plus the
    Balance of Payments proposed here. **The Japanese content of that corridor is this print, the
    BoP two days earlier, and a business survey four days later** — nothing with a policy instrument
    attached until [12-18](boj-decision-2026-12-18.md).

14. **No tracked symbol carries a channel this calendar instruments — SUPPORTED, inherited.**
    `symbols: []`. The house playbooks (S1/S2/E1/S3/S4 + G1,
    [`trade-playbooks.md`](../../plans/trade-playbooks.md)) are equity- and earnings-keyed; none is
    rates- or FX-keyed, and none reads a producer-price index of any country.

### What plays the conditions support (date estimate)

**None.** No entry, exit, hedge or size is keyed to 2026-12-10. Four rules:

- **Read-only.** This entry's marginal value is a **pre-commitment about attribution**, delivered
  ~96 days before the observation exists — plus a null strong enough that the next three CGPI
  pulses can be screened rather than researched.
- **Never score 2026-12-10 as a verdict on this release**, in either direction. Leg 6 puts the FOMC
  statement inside this bar's gap; leg 7 measures how much of such a bar the Fed's own session
  explains. A Tokyo move on 12-10 is evidence about the Fed until proven otherwise, and this ledger
  is the receipt for having said so first.
- **Match December cuts against mid-December.** Leg 5 is now the second independent replication of
  this artifact on a Bank of Japan release. Any future session cutting a December cell against an
  all-year or all-December pool is making a known error.
- **The dress rehearsal is 2026-11-12** — the October-data CGPI, an ordinary Thursday with no FOMC
  attached. If the null is real, that bar is unremarkable; it is the cheap out-of-sample look this
  ledger gets for free before the one that matters.

### Honest limits

**This is a release-day null, not a surprise null — and that is the single biggest limit here.** No
consensus or whisper series for the CGPI was available to this session, so every leg pools large and
small surprises together. A release that moves markets only when it surprises by a lot would look
exactly like this. The honest claim is *"the average CGPI day is an ordinary Tokyo day,"* never
*"the CGPI cannot matter."* **Roughly 35 cuts were run and every p is unadjusted**; a Bonferroni
haircut over 35 turns p = 0.021 into 0.7 and p = 0.002 into 0.07 — the December seasonal (leg 5,
n=397) is the only result robust to that, and it is a seasonal rather than a signal. Nothing in this
ledger depends on a small p: **the headline is a null, and multiplicity cannot manufacture one.**
**The post-FOMC cell (leg 7) is an association, not an identification** — it says the two moves
covary, not that the Fed causes the Tokyo gap, and its 164 observations span several Fed regimes.
**The n=3 intersection identifies nothing** (leg 9) and is registered against rather than on.
**The 8th-Tokyo-trading-day rule fits 85%, not 100%** — the 38 exceptions are unexplained, and the
date claim rests on the schedule sheet, with the rule as corroboration only. **Release dates before
2021 come from Wayback captures of the Bank's own page**, which is the Bank's HTML but not a live
fetch; the three captures agree with each other and with the live page on every overlapping row,
which is the check available. **The Nikkei-bar dates come from Yahoo's `^N225` daily series**, whose
session calendar is assumed to be the Tokyo exchange's. **The CGPI was rebased (2015 → 2020 base)
inside this sample**, and a 2025-base revision is due within a few years — pooling across bases is
fine for a release-day event study and would not be fine for a level study. **The date is
`estimate`** despite a primary source, per the taxonomy. And this is **D-96** initial research on an
index whose reference month has not begun: nothing here forecasts the print, only what it is worth
to a book that does not trade it.

## Stance & kill switches

**Stance (date `estimate`):** **stand aside completely**, and **pre-commit the interpretation of the
2026-12-10 Tokyo session before the observation exists.** No position, no play, no size, in any
branch. Three analytical positions, none of them positional.

First, **the release is a null with power, which is a stronger result than this calendar usually
gets.** 247 contiguous releases over 21 years; Nikkei \|opening gap\| **1.01× at p = 0.933**,
\|close-to-close\| **1.00×**, USD/JPY **1.02× (p = 0.854)**, S&P **0.92% ratio (p = 0.406)**, and no
weekday cell reaching p = 0.19. **High** confidence, and the confidence is in the *absence* of an
effect — that is what n=247 buys over the n=8 and n=22 cells this calendar's BoJ ledgers have had to
work with so far.

Second, **the date is contaminated by construction, and the contamination is measurable.** The
Tokyo auction on 2026-12-10 opens ~4h50m after the December FOMC statement (Fed calendar,
"December 8-9\*", confirmed) and closes 7.5 hours before the US CPI prints, so this bar holds the
Fed and nothing else from the US calendar. Across 164 such bars the S&P's FOMC-day move correlates
**+0.687** with the Tokyo gap and agrees in sign **80.5%** of the time; the three prior CGPI
releases that landed in this cell followed the Fed's sign **3/3**. **Medium** confidence on the
mechanism, **High** on the structural fact — and the consequence is the same either way: a 12-10
Tokyo move is not evidence about Japanese producer prices.

Third, **two corrections to how this calendar cuts data, both from the same run.** The December CGPI
cell is a **denominator artifact** — 1.55× (p = 0.041) against all December sessions, **1.40×
(p = 0.234)** against mid-December ones, because December in Tokyo runs **0.79× at p = 0.002**;
this independently replicates the [December Tankan ledger](boj-tankan-2026-12-14.md)'s finding on a
second, unrelated Bank of Japan release, which promotes it from an observation to a **method rule**.
And that ledger's stated mechanism — a post-FOMC weekend loading the Tokyo open "toward a breach" —
does not survive measurement: the post-FOMC **gap** is 1.06× at p = 0.504, while the post-FOMC
**intraday range** is 1.25× at p = 0.021. **Its conclusion stands; its mechanism is amended.**

**Kill switches:**

- **Date kill (registered):** the Bank publishing the November 2026 CGPI on any date other than
  **2026-12-10**, or at any time other than ~**08:50 JST**. Registered as
  **FT-japan-cgpi-2026-12-10-1**, score by **2026-12-11**. Re-check every pulse against
  `boj.or.jp/en/statistics/outline/`.
- **Attribution kill (registered):** the **2026-12-10** Nikkei opening gap taking the **opposite**
  sign to the S&P 500's **2026-12-09** close-to-close move. The cell's base rate is 0.805 (0.748
  unconditional), so a single miss is one observation and not a refutation — it is registered
  because the *claim being made in public* is "this bar is the Fed's," and that claim must be
  scorable. Registered as **FT-japan-cgpi-2026-12-10-2**, score by **2026-12-11**.
- **Small-n kill (registered):** the **2026-12-10** Nikkei \|opening gap\| landing **at or above
  1.34%** — the smallest of the three historical CGPI-on-a-post-FOMC-bar gaps, all of which cleared
  it. This ledger predicts it does **not**, on a 0.159 post-FOMC base rate (0.117 on CGPI days,
  0.097 pool-wide); a breach means the n=3 cell deserved more weight than "anecdote." **Low**
  confidence in the direction of surprise — which is why it is a stand-aside, never a small bet.
  Registered as **FT-japan-cgpi-2026-12-10-3**, score by **2026-12-11**.
- **Rule kill:** the December-2026-data CGPI publishing on any date other than **2027-01-14** — the
  schedule sheet's serial 46401 and the 8th-Tokyo-trading-day rule agree on it, and a divergence
  breaks the corroboration leg 11 rests on. Re-check every pulse.
- **Surprise-leg kill:** a usable CGPI consensus series becoming available to this repo. The null in
  leg 2 pools all surprise sizes; the moment a surprise measure exists, the test must be re-run
  conditional on it, and this ledger's "no channel" claim is provisional until then.
- **Denominator kill:** any future session in this repo cutting a December cell against an all-year
  or all-December pool without the mid-December control. Leg 5 is the second replication; a third
  would make it a gate rather than a rule.
- **Channel kill (tracked names):** a tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on any
  session **2026-09-05 → 2026-12-09** that the tape attributes to Japan's CGPI. Leg 14's claim would
  be false. Re-check every pulse.
- **Base-revision kill:** the Bank announcing a 2025-base CGPI revision effective before this event,
  changing the index's construction mid-sample. The pooled 2006-2026 study would need re-cutting by
  base era. Re-check every pulse.

Three forward tests registered in
[`forward-tests/japan-cgpi-2026-12-10.md`](../forward-tests/japan-cgpi-2026-12-10.md) — **-1** (the
release date and minute), **-2** (the Fed owns the bar, tested on sign) and **-3** (the n=3 cell
does not repeat). One dated adjacent event proposed as `estimate` in the same PR:
[`japan-balance-of-payments-2026-12-08`](../../../src/domain/market-events/japan-balance-of-payments-2026-12-08.json).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-96 | Initial research banked (above). **This event was filed yesterday off the December Tankan ledger's sweep with nothing measured about it; this session measured it on the largest single-release sample this calendar has assembled.** *Scaffold:* the Bank's own **List of Releases of the CGPI** (HTTP 200, 50,376 bytes) plus **three Wayback captures of that same BoJ page** (2014-03-19 / 2017-05-06 / 2022-07-04, HTTP 200 each) merged → **247 releases, 2006-01 data → 2026-07 data, zero missing reference months**, every one with a Nikkei bar; `tkohyos.xlsx` (HTTP 200, 48,500 bytes) unzipped, rows 237-240 giving serial **46366 = 2026-12-10** at "**Around** 8:50 a.m." (the sheet hedges the minute; the event's own notes did not) and **46401 = 2027-01-14**; the Fed's live calendar + **15 `fomchistorical<year>` pages** (HTTP 200 each) → **175 scheduled FOMC decision dates, 2006-2027**, including the **"December 8-9\*"** row that fixes **2026-12-09**. **Finding 1 — a null with power.** Nikkei \|opening gap\| on CGPI days **0.520% vs 0.517% = 1.01×, p = 0.933** (n=247 vs 4,792); \|c2c\| **1.00×, p = 0.949**; \|intraday\| 1.14×, p = 0.112; USD/JPY \|c2c\| **1.02×, p = 0.854**; S&P \|c2c\| **0.92×, p = 0.406**. No weekday cell reaches p = 0.19 (Mon 1.07 · Tue 0.91 · Wed 0.90 · **Thu 0.82** · Fri 1.22) — **2026-12-10 is a Thursday**, the quietest cell. **Finding 2 — the date is the story.** ~08:50 JST 12-10 = **18:50 EST 12-09**, so the Tokyo auction opens **~4h50m after the FOMC statement** and closes **7.5h before** the [US CPI](cpi-2026-12-10.md) (08:30 ET = 22:30 JST) — **this bar prices the Fed and no US statistical release**; the CPI reaches Tokyo on 12-11. **Finding 3 — and that bar is quantitatively the Fed's.** Across **164** post-FOMC Tokyo bars 2006-2026, corr(S&P FOMC-day signed move, next Tokyo signed gap) = **+0.687**, slope 0.443, sign agreement **132/164 = 0.805** vs a 0.748 unconditional rate. **Finding 4 — but "post-FOMC = louder open" is refuted as stated**, which amends [the December Tankan ledger](boj-tankan-2026-12-14.md)'s leg 9: post-FOMC \|gap\| **0.549% vs 0.516% = 1.06×, p = 0.504**, while \|intraday\| runs **0.611% vs 0.490% = 1.25×, p = 0.021**. Direction transfers; magnitude shows up in the session, not the auction. Its conclusion is untouched. **Finding 5 — the December cell is a denominator artifact, replicating the sibling's error class on an independent release.** December CGPIs (n=20) **0.643%**: vs all-December **1.55×, p = 0.041**; vs **mid-December (8-16) 1.40×, p = 0.234**; ex top-2 gaps 1.45×, p = 0.118 — because **all December sessions run 0.416% vs 0.524% = 0.79×, p = 0.002** (the sibling measured 0.85×, p = 0.010 on a 2004+ pool). **Two BoJ releases now show it: match December against mid-December, never the year.** **Finding 6 — the n=3 coincidence, registered against not on.** Only **2007-12-12 (−1.35%, S&P −2.53%)**, **2010-08-11 (−1.34%, S&P −0.60%)** and **2011-08-10 (+1.86%, S&P +4.74%)** printed into a post-FOMC bar; median 1.347% = 2.61× other CGPI days (p = 0.031) and **3/3 above every threshold** — which is what n=3 looks like. All three followed the Fed's **sign**, which is the claim registered. **Finding 7 — the date is mechanically predictable.** **209/247** releases fall on the **8th Tokyo trading day** (9th ×36, 7th ×2; calendar-business-day indexing fits far worse), never before the 10th calendar day; **2026-12-10 and 2027-01-14 are each their month's 8th**, matching serials 46366 and 46401. Adjacency sweep: **peers** — none, `symbols: []`, no tracked-name print on this bar. **Macro** — **14** tracked entries within ±5d; [FOMC 12-09](fomc-2026-12-09.md) (confirmed, high) and [CPI 12-10](cpi-2026-12-10.md) (confirmed, high) dominate, with the [funding deadline 12-11](government-funding-deadline-2026-12-11.md) (est, high), [PPI 12-15](ppi-2026-12-15.md) (confirmed) and the [December Tankan 12-14](boj-tankan-2026-12-14.md) (est) behind them. **Volatility** — VIX **14.53**, Nikkei **65,020.94**, S&P **7,718.60**, USD/JPY **156.22** (2026-09-04 closes, Yahoo; reconcile exactly with the Tankan ledger's probe). **Geopolitical** — nothing new beyond the channels the [09-18 decision ledger](boj-decision-2026-09-18.md) owns. **Event tape** — the 09-18 BoJ decision is priced ~80-84% to hike 1.0%→1.25%; a hiking cycle raises the stakes on the 12-18 MPM this print feeds, which is an argument for watching the **decision**, not this index. **Proposed:** Japan's **Balance of Payments (Oct 2026 preliminary)**, same sheet rows 255-256, serial **46364 = 2026-12-08** at ~08:50 JST → [`japan-balance-of-payments-2026-12-08`](../../../src/domain/market-events/japan-balance-of-payments-2026-12-08.json) (`estimate`, low) — the mirror bar, the last full Tokyo session **before** the FOMC, and a cell measured quiet here (Tokyo sessions at FOMC−1d: **0.402% vs 0.520% = 0.77×, p = 0.026**, n=152). **Own weaknesses:** this is a **release-day null, not a surprise null** — no consensus series was available, so all surprise sizes are pooled and the honest claim is "the average CGPI day is an ordinary Tokyo day"; ~**35** cuts run, every p unadjusted (Bonferroni over 35 turns 0.021 into 0.7 and 0.002 into 0.07 — but the headline is a **null**, which multiplicity cannot manufacture); the post-FOMC cell is an association across several Fed regimes, not an identification; the n=3 intersection identifies nothing; the 8th-trading-day rule fits **85%**, not 100%, and corroborates the sheet rather than replacing it; pre-2021 release dates come from Wayback captures of the Bank's own page (three captures, agreeing on every overlapping row); Nikkei session dates assume Yahoo's `^N225` calendar is the exchange's; the index was rebased 2015→2020 inside the sample; the date is `estimate`. | — (stance set: stand aside, no position, no play; **the release is a null with power — 1.01× at p = 0.933 on n=247, the strongest no-effect result this calendar has on a Japanese macro print** — and **the 2026-12-10 Tokyo bar is the first one after the December FOMC, a cell where the S&P's own FOMC-day move correlates +0.687 with the Tokyo gap across 164 observations**, so the attribution is pre-committed before the observation exists. **High** on the null and on the structural fact, **Medium** on the post-FOMC mechanism. Two method corrections banked: the December cell is a **denominator artifact** (1.55× → 1.40×, p = 0.23 on a mid-December pool; all December sessions 0.79×, p = 0.002), independently replicating [the December Tankan ledger](boj-tankan-2026-12-14.md) on a second BoJ release, and that ledger's *"the post-FOMC weekend loads the open toward a breach"* is **amended** — the gap is 1.06× at p = 0.504; only the intraday range is elevated, at 1.25×, p = 0.021) | 2026-10-05 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
