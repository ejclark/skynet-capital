# London's USD bond session recommended closed all day for New Year's Day — the corridor's synchronizing day, not one of its desyncs — sifma-uk-bond-market-closure-2027-01-01

**Kind:** rates · **Date:** 2027-01-01 (estimate — NEWS: SIFMA's `sifma.org/resources/guides-playbooks/holiday-schedule` U.K. panel, re-fetched and re-parsed direct 2026-09-09, corroborated by `gov.uk/bank-holidays.json` statute in all three UK divisions; the `estimate` label is a taxonomy question, not a doubt about the date) · **Impact:** low
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"low:15+","adjacentIds":["advance-economic-indicators-2026-12-28","boj-summary-of-opinions-2026-12-28","sifma-japan-early-close-2026-12-28","sifma-uk-bond-market-closure-2026-12-28","consumer-confidence-2026-12-29","fhfa-hpi-2026-12-29","fomc-minutes-2026-12-30","china-retaliation-suspension-expiry-2026-12-31","georgia-psc-data-center-cost-shift-2026-12-31","jpx-market-closure-2026-12-31","nerc-computational-load-standards-2026-12-31","russell-style-quarter-end-capping-effective-2026-12-31","sifma-bond-early-close-2026-12-31","sp-select-sector-secondary-reweight-2026-12-31","new-years-day-market-closure-2027-01-01","ism-manufacturing-2027-01-05"],"screenStreak":0,"blocked":[{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EFTSE","status":"429","at":"2026-09-09"},{"url":"https://query2.finance.yahoo.com/v8/finance/chart/%5EGSPC","status":"429","at":"2026-09-09"},{"url":"https://stooq.com/q/d/l/?s=^ukx&i=d","status":"JS_CHALLENGE","at":"2026-09-09"}]} -->

## At a glance

**TL;DR.** **Stand aside, and downgrade what the proposal that filed this event said it was.** The
card is real — SIFMA's U.K. panel was re-fetched and parsed twice by independent paths today, and it
carries **Friday, January 1, 2027 with an empty note**, the full-closure shape; `gov.uk` makes the
same date statutory in **all three** UK divisions. The `estimate` label is a taxonomy artifact, not
a doubt. What does **not** survive measurement is the framing. The proposal called this *"the one day
of the turn-of-year corridor on which London, Tokyo and New York are all shut together."* Measured on
two central-bank primaries — the Bank of England's **SONIA** as the London business-day record and the
Fed's **H.15 DGS10** as the New York bond-session record — the corridor's divergence is carried
**entirely by 2026-12-28**, a date this calendar already tracks. Across **29 of 29** turns of the year
since 1997/98, New York works at least as many days as London in the Dec-24→Jan-5 window (mean **+1.17**
sessions, gap distribution 1:25 · 2:3 · 3:1, never zero, never negative), and 2026/27 projects to the
modal shape exactly: **6 London business days, 7 New York bond sessions, one desync day, and it is not
this one.** 2027-01-01 is where the two desks re-synchronize. Second, the entry's information content is
**measurably zero**: of the U.K. panel's **29 full-close business days** across 2026–2027, **zero** are
unexplained by either the U.S. panel or gov.uk statute — its only three otherwise-unexplained cards all
fall on **weekends**. A `sifma-uk-*` entry is a cross-reference, never news, which is what makes `low`
a verdict here rather than an assumption. Third, and this is the one new fact this lane adds to the
corridor: **Monday 2027-01-04, the reopen, is a Scottish statutory bank holiday no SIFMA panel lists** —
and it does **not** shut London. SONIA printed on **24 of 24** Scotland-only statutory weekdays on
gov.uk's record while printing on **0 of 65** England-and-Wales ones. Three sibling forward tests score
on that date; none of them is at risk from it. Nothing here is tradeable: `symbols: []`, `impact: low`,
and both playbook docs grep to zero on every calendar term. Output is one downgrade, one zero-information
proof, one trap defused, and three registered forward tests.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** — a recommended closure 114 days out, on a date the whole dollar market is shut anyway, is not a position | High | D-114. `symbols: []`, `impact: low`, and a grep of `docs/plans/trade-playbooks.md` + `docs/research/multi-symbol-sweep.md` for `holiday\|closure\|london\|sifma\|gilt\|sonia\|new year\|year-end\|turn of the year` returns **0 hits in both**, run this session rather than inherited from either sibling U.K. ledger | A house playbook that keys on holiday-adjacent, cross-venue or turn-of-year sessions being written and back-tested before **2026-12-31** — the "nothing is calendar-keyed" leg goes stale and this sheet gets rebuilt on measured data |
| This week | **Stop calling this the corridor's desync day; 2026-12-28 is** | High | Measured on BoE SONIA (7,498 obs, 1997-01-02→2026-09-04) against Fed H.15 DGS10: New York ≥ London on session count in **29 of 29** turns, mean **+1.17**. The 2026/27 window projects **London 6 / New York 7** with exactly one divergent day, **2026-12-28** — already tracked as `sifma-uk-bond-market-closure-2026-12-28`. This closure shuts both desks and therefore adds no divergence at all | The 2026-12-24→2027-01-05 window resolving to anything other than 6 London business days and 7 NY bond sessions — checkable from SONIA and DGS10 on **2027-01-06**. Registered as **FT-sifma-uk-bond-market-closure-2027-01-01-2** |
| This month | **Read a `sifma-uk-*` card as a cross-reference, never as news — including this one** | High | Of the U.K. panel's **29 full-close business days** across 2026 and 2027, **0** are unexplained by the U.S. panel or by gov.uk England-and-Wales statute; the only three cards neither explains (Sat 2027-06-19, Sun 2027-07-04, Sat 2028-01-01) are **weekends**. This date is doubly explained — the U.S. panel full-closes it *and* it is statutory in all three UK divisions | The 2028 U.K. panel, when SIFMA publishes it, carrying a full-close card on a **business day** that is neither a U.S.-panel full close nor a gov.uk statutory holiday — score by **2027-12-31**. Registered as **FT-sifma-uk-bond-market-closure-2027-01-01-3** |
| This quarter | **Do not read Monday 2027-01-04 as a UK holiday — London is open, and three sibling forward tests score that day** | Medium | `gov.uk/bank-holidays.json` dates a **Scotland-only** statutory bank holiday on 2027-01-04 (the "2nd January" substitute; 01-02 is a Saturday) that no SIFMA panel lists. It does not shut the London desk: SONIA printed on **24 of 24** Scotland-only statutory weekdays 2019→2026 and on **0 of 65** England-and-Wales ones — exact in both directions against a 96.85% unconditional weekday print rate. Confidence is medium, not high, because gov.uk's machine-readable record only starts in 2019, so n = 24 rather than three decades | No SONIA observation published for **2027-01-04** — which would mean a Scottish bank holiday does shut the London money market, and would put the sibling ledger's three 01-04 scorings on a half-staffed tape. Registered as **FT-sifma-uk-bond-market-closure-2027-01-01-1** |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to 2027-01-01. Both desks are shut; the date is
  `estimate`, and date-keyed action requires `confirmed` regardless.
- **Execution guard (Mon 2026-12-28), and it is the corridor's real one:** this is the single day in
  the whole 2026/27 turn where New York's bond desk trades and London's does not. It already has its
  own entry (`sifma-uk-bond-market-closure-2026-12-28`), whose own research measured the price effect
  to a **triple null** and explicitly declined to import a depth guard. Anything needing London
  liquidity in the turn is a 12-29/30/31 problem, not a 12-28 one.
- **Attribution guard (Mon 2027-01-04):** a Scottish bank holiday sits on the reopen and no SIFMA
  panel lists it. **London is open** (24/24). Read thin conditions on 2027-01-04 as the New Year gap,
  positioning, or the 2027-01-05 ISM front-run — never as a UK closure.
- **The corridor's shape, so it is not re-derived wrong:** London is dark 2026-12-25 and 2026-12-28,
  runs a **three-day week** (12-29, 12-30, 12-31), is dark 2027-01-01, and returns 2027-01-04. New
  York adds 12-28 and takes a 2:00 p.m. ET early close on both 12-24 and 12-31.
- **Do not treat a `sifma-uk-*` card as independent evidence about who is dark.** Zero of 29 U.K.-panel
  business-day closures in two years are unexplained by the U.S. panel or by statute. The panel is a
  restatement; gov.uk and the U.S. panel are the sources.
- **The panel is not uniformly reliable, and this date is in its good half.** `December 27, 2027` and
  `December 28, 2027` appear **zero times** in the whole 299,272-byte page, against gov.uk's statutory
  England-and-Wales substitutes on exactly those dates. Trust the 01-01 card; do not trust the panel's
  own year-end.
- **SONIA is the cheap London-session detector, and it is exact.** 0 prints on 65 England-and-Wales
  statutory weekday bank holidays, 96.85% on all weekdays. A future lane needing "was London open?"
  should reach for it before an equity index — and should note it evidences the **calendar**, never
  the volume.

## Initial research

### The question

This id reached the calendar as **one sibling proposal**, not as a seeded entry — filed 2026-09-09 by
the [`new-years-day-market-closure-2027-01-01`](new-years-day-market-closure-2027-01-01.md) initial
research while it parsed all three SIFMA panels for its own U.S. card. Per
[`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), this session read that proposal first, then
wrote the canonical `src/domain/market-events/sifma-uk-bond-market-closure-2027-01-01.json`. The
proposal is well-sourced and its date is not in question, so the useful question was the one it
asserted rather than measured:

> the proposal's title calls this **"the one day of the turn-of-year corridor on which London, Tokyo
> and New York are all shut together"**, and its notes argue the corridor is where the single dollar
> market *"visibly desynchronizes and then re-synchronizes."* Does a per-region entry on a day
> **everyone** is shut carry any information at all — and if not, is there anything in the corridor
> that does?

**One-line verdict:** the card is real and now rests on a re-fetch parsed two independent ways plus a
statutory government primary, but the framing inverts — this is the corridor's **synchronizing** day,
its entire divergence is carried by the already-tracked 2026-12-28, the U.K. panel is measurably
**zero-information** across two full years, and the one thing in the corridor nobody had noticed is a
**Scottish** bank holiday sitting on the reopen that does not shut London.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no
symbol-keyed instrument applies (`symbols: []`) and no closure-shaped instrument exists in
`scripts/research/`. **Nothing was inherited from the proposal**; every primary was re-fetched and
every statistic computed from raw series:

- **SIFMA** `sifma.org/resources/guides-playbooks/holiday-schedule` — HTTP 200, **299,272 bytes**,
  the same byte count the proposing lane reported. Parsed **twice by independent paths**: the
  rendered DOM (`<h3>` name / `<span>` date / `<p>` note triples, which reaches the 2026 tab only)
  and the embedded Next.js flight payload (which carries all six panels, 2026 and 2027). Region
  attribution taken from the page's own `Holiday Recommendations` `<h2>` headings.
- **gov.uk** `www.gov.uk/bank-holidays.json` — HTTP 200, 22,207 bytes. All three divisions
  (england-and-wales, scotland, northern-ireland) read; the record runs 2019 → 2028.
- **Bank of England / FRED** `IUDSOIA` (SONIA) — HTTP 200, 137,917 bytes, **7,498 observations**
  1997-01-02 → 2026-09-04, used as the **London banking business-day record**. The BoE's own
  endpoint (`bankofengland.co.uk/boeapps/iadb/fromshowcolumns.asp`) was also fetched and served
  after its 302 (HTTP 200, 83,291 bytes, 2010→); FRED was used for the longer history and its
  values agree on the overlap.
- **Federal Reserve H.15 / FRED** `DGS10` — HTTP 200, **268,619 bytes**, used as the **New York
  bond session record**.
- **CBOE** `VIX_History.csv` — HTTP 200, 472,411 bytes, for the probe-ref reading only (VIX 15.72,
  2026-09-08 close).
- **This repo's own calendar** — all canonical entries in `src/domain/market-events/` read to
  compute the corridor rather than assert it.
- **Computed, not sourced:** every card classification, every session count, every base rate below.
- **Two sources were blocked.** `query1`/`query2.finance.yahoo.com` returned **HTTP 429** on four
  attempts across two hosts and two user agents — expected, since 38 sibling event-research jobs
  are running against the same runner pool today. `stooq.com` served a **796-byte JavaScript
  proof-of-work challenge**, matching what the co-dated sibling ledger recorded. Both are in
  `probe-ref.blocked`. **The substitution is an upgrade, not a fallback:** the London leg runs on
  the Bank of England's own SONIA publication calendar rather than a Yahoo `^FTSE` bar record, and
  the New York leg on the Fed's H.15 rather than `^GSPC` — two central-bank primaries in place of
  two vendor equity feeds, and both are closer in scope to a *bond desk's* calendar than an index is.

### Conviction legs, tested

**1. The card is real, and it is a full closure — SUPPORTED, on two independent parses of one
re-fetch.** The rendered DOM's U.K. panel carries **18 cards** on its 2026 tab, and the last of them
is exactly `["New Year's Day 2026/2027", "Friday, January 1, 2027", ""]` — an **empty** note element.
That empty note is the load-bearing part: 12 U.S.-panel cards and 5 Japan-panel cards on the same page
carry `Early Close (…)` strings in that slot, and **the U.K. panel carries zero of them in either
year**, so the shape is unambiguous. The flight payload, which is the only way to reach the 2027 tab
(a rendered-DOM parse never sees it), carries an 18-card U.K. 2027 panel whose **first** card is the
same triple. The date is double-listed by design — it is the 2026/2027 straddle card, present on both
tabs of all three panels.

**2. The date is statutory in all three UK divisions — SUPPORTED, on a government primary.**
`gov.uk/bank-holidays.json` lists `2027-01-01 | New Year's Day` in **england-and-wales**, **scotland**
and **northern-ireland**. Only six 2027 dates are statutory across all three (01-01, 03-26, 05-03,
05-31, 12-27, 12-28). So London is dark on 2027-01-01 whatever SIFMA recommends. The status stays
`estimate` for the taxonomy reason alone — `market-events-data.ts` has no confirmed prefix for an
industry trade association's recommended schedule, and understating the label only widens caution.

**3. The U.K. panel's information content is zero — SUPPORTED, by exhaustive classification.** Every
U.K.-panel full-close card across 2026 and 2027 was classified against two independent explanations:
does the **U.S. panel** also full-close that date (which shuts the whole dollar market, London
included), and is it a **gov.uk England-and-Wales** statutory bank holiday (which shuts London by law)?

| Class | Cards | Meaning |
|---|---|---|
| **BOTH** (US panel *and* statute) | 7 | doubly redundant — includes **2027-01-01** |
| **US panel only** | 15 | the London desk is shut because the dollar market is |
| **statute only** | 9 | London is shut by law; SIFMA is restating gov.uk |
| **neither — additive** | **3** | *all three fall on a **Saturday or Sunday*** |

The three "additive" cards are Juneteenth **Sat** 2027-06-19, U.S. Independence Day **Sun** 2027-07-04
and New Year's Day **Sat** 2028-01-01 — non-business days, listed unshifted. So of the panel's **29
full-close business days** in two years, **zero** tell a reader anything the U.S. panel and gov.uk do
not already say. This is the measured basis for `impact: low`, and it generalises: a `sifma-uk-*`
entry is a cross-reference, not news. (This *sharpens* the 2026-12-28 sibling's finding rather than
contradicting it — that ledger observed its own card was redundant with statute; the same test run
across the whole panel finds no exception anywhere.)

**4. The proposal's tri-market claim extends to two years, with two exceptions it could not see —
SUPPORTED and refined.** The proposal measured that all 12 U.S.-panel full closes in 2026 plus
2027-01-01 are also full closes on the U.K. and Japan panels. Across **both** published years the
U.S. panel carries **22** full-close dates, and **20 of 22** are full closes on both other panels. The
exceptions are **2027-06-18** and **2027-07-05** — the U.S. panel's *observed* Juneteenth and
Independence Day, which the U.K. panel does not shift (it lists the unshifted Sat 06-19 and Sun 07-04
instead). Those are the **only two US full-close business days in two years with no U.K. card at all**,
and they are a panel defect rather than a market state. 2027-01-01 is squarely inside the 20.

**5. The panel is unreliable at the other end of the same year, and this date is in its good half —
SUPPORTED, mechanically.** The strings `December 27, 2027` and `December 28, 2027` occur **zero
times** in the entire 299,272-byte page, against gov.uk's statutory England-and-Wales Christmas and
Boxing Day substitutes on exactly those dates; the panel instead carries `Christmas Day / Friday,
December 24, 2027` and `Boxing Day / None`. That is the year-end defect the
[`sifma-uk-bond-market-closure-2027-03-29`](sifma-uk-bond-market-closure-2027-03-29.md) ledger
located, re-verified here by absence rather than inference. **A correction to that ledger's own
count:** it also implies the panel misses `2027-05-03`; it does not. May Day / Monday, May 3, 2027
**is** on the U.K. 2027 panel — its note is a React stream placeholder (`"$L9b"`) rather than an
inline string, which a naïve triple-regex drops. Recorded because the same parser artifact would
manufacture a missing-card finding for any future lane that repeats the parse.

**6. SONIA is an exact London-business-day detector — SUPPORTED, in both directions.** Against
gov.uk's own record:

| Test | Result |
|---|---|
| SONIA prints on an England-and-Wales statutory **weekday** bank holiday | **0 of 65** |
| SONIA prints on a **Scotland-only** statutory weekday bank holiday | **24 of 24** |
| SONIA prints on an arbitrary weekday (1997-01-02 → 2026-09-04) | 7,498 of 7,742 (**96.85%**) |

Zero false positives and zero false negatives on the closure test. This is a better instrument for
"was the London desk working?" than the `^FTSE`-no-bar detector the 2026-12-28 sibling had to build
(37/38 precision), and it is a central-bank publication rather than a vendor bar — which matters here
because Yahoo was rate-limited out of reach today anyway.

**7. Monday 2027-01-04 is a Scottish bank holiday, and London opens anyway — SUPPORTED, and it is
this lane's new finding.** gov.uk's **scotland** division dates a `2nd January` statutory substitute
on **2027-01-04** (2027-01-02 falls on a Saturday); england-and-wales and northern-ireland do not, and
**no SIFMA panel lists it in any region**. The 24-of-24 result in leg 6 covers exactly this class —
`2nd January` substitutes, the Scottish Summer bank holiday, St Andrew's Day, and the one-off
2026-06-15 World Cup bank holiday — and London's money market published on every one. This matters
outside this ledger: three of
[`new-years-day-market-closure-2027-01-01`](new-years-day-market-closure-2027-01-01.md)'s forward
tests score on the 2026-12-31 → **2027-01-04** move, and a reader who found the Scottish holiday in
gov.uk without this test would reasonably discount that print as half-staffed. It is not.

**8. This closure is the corridor's synchronizing day, not one of its desyncs — REFUTES the
proposal's framing.** Counting the Dec-24 → Jan-5 window on both session records, for all 29 turns
1997/98 → 2025/26:

| Measure | Result |
|---|---|
| Turns where NY bond sessions ≥ London business days | **29 of 29** |
| Mean gap (NY − London) | **+1.17** sessions |
| Gap distribution | 1 session: **25** · 2: **3** · 3: **1** — never 0, never negative |
| Mean London business days / NY bond sessions | 6.24 / 7.41 |

The 2026/27 window projects to the modal shape exactly — **London 6** (12-24, 12-29, 12-30, 12-31,
01-04, 01-05) against **New York 7** (the same plus 12-28) — with **exactly one** divergent day,
**2026-12-28**, which this calendar already carries as its own entry. 2027-01-01 shuts both desks and
therefore contributes **nothing** to the divergence the proposal named. The honest reading is the
inverse of the title it was filed under: this is the wall the desync runs into, and the wall is
shared.

**9. The divergence is near-one-directional, but not perfectly, and the exception has a shape —
MIXED, stated precisely.** Inside those same windows there are **38** New-York-open / London-shut
days against **4** London-open / New-York-shut days. All four of the latter are **December 24** —
1999, 2004, 2010 and 2021, every one a year in which Christmas fell on a Saturday and New York took
the full holiday on the 24th while London worked. **2026/27 does not have that shape**: Christmas 2026
is a Friday, so New York closes on 12-25 itself and runs a 2:00 p.m. ET early close on 12-24, with
London open. So the day-level claim is "one-directional *in this turn*", not "always" — and the leg-8
window-count result (29/29) is the one that holds unconditionally.

**10. This event's own class is the rarest of the four, and its base rate is 100% — SUPPORTED.**
Cross-tabulating both session records over 7,742 weekdays since 1997:

| State | Weekdays | Share |
|---|---|---|
| Both desks open | 7,279 | 94.0% |
| London open, New York bond shut | 219 | 2.8% |
| New York open, London shut | 145 | 1.9% |
| **Both shut** | **99** | **1.28%** |

**21 of those 99 are January 1** and 21 are December 25 — together 42% of the entire class. And every
January-1 weekday in the window for which both series carry data was a both-shut day: **21 of 21**
(the 22nd, 1997-01-01, precedes the SONIA series by one day and is a data-start artifact, not an
exception). There is no historical instance of either desk working on a weekday January 1.

### What plays this supports

**None.** `symbols: []`, `impact: low`, and the grep in the *Today* row returns zero calendar-,
closure-, London- or turn-of-year-keyed hypotheses in either `docs/plans/trade-playbooks.md` or
`docs/research/multi-symbol-sweep.md`. This repo tracks no UK-listed symbol and no gilt instrument.
The date is `estimate`, and date-keyed action requires `confirmed`. Every output above is a
**correction or a guard** — something that stops a wrong inference — rather than a trade.

### Honest limits

- **SONIA is a sterling overnight rate.** Its publication calendar is an exact proxy for a London
  *banking business day*; it says nothing about USD bond volumes, depth or spreads on that calendar.
  Every liquidity-flavoured statement here is about **who is at their desk**, never about how much
  they traded.
- **DGS10 is a close-of-business quote.** It cannot distinguish a 2:00 p.m. ET early close from a
  full session, so the "New York bond sessions" counts in legs 8–10 count *days open*, not hours.
  The 12-24 and 12-31 early closes are inside those counts as whole days.
- **gov.uk's machine-readable record starts in 2019**, so the Scotland-only test is n = 24 across
  eight years, not three decades. The England-and-Wales side (0 of 65) is drawn from the same window.
- **SIFMA's schedule is a recommendation** to member firms by its own words, not an exchange halt.
  The *statutory* leg is what actually shuts London on this date; the card restates it.
- **LSE's own calendar remains not machine-readable** — the sibling ledgers probed
  `londonstockexchange.com/…/business-days` on 2026-09-05 and got a JavaScript shell. Nothing here is
  asserted about LSE equity or gilt hours beyond the gov.uk statutory holiday.
- **Yahoo was rate-limited (HTTP 429) on all four attempts**, so no equity-index leg was run at all.
  That is a genuine gap against the 2026-12-28 sibling, which measured `^FTSE`/`^GSPC`/`EWU` directly;
  this ledger's London evidence is a *calendar* record, not a price one. The substitution is recorded
  in `probe-ref.blocked` and is not silent.
- **The zero-information result (leg 3) is measured over two published years**, 2026 and 2027. It is
  registered as a forward test against the 2028 panel precisely because two years is not proof of a
  rule.

## Stance & kill switches

**Stand aside on the date; carry the downgrade and the guard.** (The event is `estimate` — the label
is a taxonomy artifact, and even a `confirmed` closure would license nothing here.)

The position has three parts, in descending order of how much they should change behaviour:

1. **Treat 2026-12-28, not 2027-01-01, as the turn's cross-venue event.** New York works at least as
   many days as London in 29 of 29 turns since 1997/98, and the 2026/27 window's single divergent day
   is 12-28. This closure shuts both desks. *Killed by:* the 2026-12-24 → 2027-01-05 window resolving
   to other than 6 London business days and 7 NY bond sessions, checkable from SONIA and DGS10 on
   2027-01-06.
2. **Read Monday 2027-01-04 as a normal London session.** A Scotland-only statutory bank holiday sits
   on it and no SIFMA panel lists it; 24 of 24 prior Scotland-only weekdays saw SONIA publish.
   *Killed by:* no SONIA observation for 2027-01-04 — which would also put the co-dated sibling's
   three 01-04 scorings on a half-staffed tape and is the reason this is registered rather than
   merely noted.
3. **Do not treat any `sifma-uk-*` card as independent evidence about who is dark.** Zero of 29
   U.K.-panel business-day closures across two years are unexplained by the U.S. panel or gov.uk
   statute. *Killed by:* the 2028 U.K. panel carrying a business-day full close that neither
   explains.

Three predictions carry score-by dates and are registered in
[`forward-tests/sifma-uk-bond-market-closure-2027-01-01.md`](../forward-tests/sifma-uk-bond-market-closure-2027-01-01.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | 114 | **Initial research.** Canonical `src/domain/market-events/sifma-uk-bond-market-closure-2027-01-01.json` written from the one prior proposal (`from-new-years-day-market-closure-2027-01-01`, 2026-09-09) after re-fetching and re-parsing every primary. Card verified two independent ways off one 299,272-byte SIFMA fetch — rendered DOM (U.K. 2026 tab, last of 18 cards, empty note) and flight payload (U.K. 2027 tab, first of 18) — plus `gov.uk/bank-holidays.json`, which makes 2027-01-01 statutory in **all three** UK divisions. **Adjacency sweep:** no peer-print concept applies (`symbols: []`); no macro surprise bears on a 114-day-out closure; VIX 15.72 (2026-09-08 close), a quiet regime; no geopolitical item touches a scheduled venue closure; event tape is the corridor — 16 tracked entries within 5 days, 7 of them on 2026-12-31. **Findings:** (a) the proposal's framing is **refuted** — across 29 of 29 turns 1997/98→2025/26 New York's bond desk works ≥ London's in the Dec-24→Jan-5 window (mean +1.17, distribution 1:25 · 2:3 · 3:1), and 2026/27 projects **London 6 / NY 7** with one desync day, **2026-12-28**, already tracked; this date shuts both and adds no divergence; (b) the U.K. panel is **zero-information** — of 29 full-close business days across 2026–27, **0** are unexplained by the U.S. panel or gov.uk E&W statute, and its only 3 otherwise-unexplained cards all fall on weekends; (c) the proposal's 12/12 tri-panel claim extends to **20 of 22** over two years, the exceptions 2027-06-18 / 2027-07-05 being the panel's failure to shift US observances; (d) **NEW** — Mon **2027-01-04**, the reopen and the score-by date of three sibling forward tests, is a **Scotland-only** statutory bank holiday no SIFMA panel lists, and it does not shut London: SONIA printed 24/24 on Scotland-only weekdays and 0/65 on England-and-Wales ones; (e) the both-shut state is 99 of 7,742 weekdays since 1997 (1.28%), of which **21 are January 1** — and 21 of 21 Jan-1 weekdays with data were both-shut; (f) **correction to `sifma-uk-bond-market-closure-2027-03-29`**: May Day / Mon 2027-05-03 **is** on the U.K. 2027 panel; a naïve triple-regex drops it because its note is a React stream placeholder. **Blocked:** Yahoo `query1`/`query2` HTTP 429 on four attempts (38 sibling jobs share the runner pool), `stooq.com` JS proof-of-work — substituted with BoE/FRED `IUDSOIA` and Fed H.15 `DGS10`, two central-bank primaries, recorded in `probe-ref.blocked`; no equity-index leg was run. **Proposed:** nothing — the sweep surfaced no dated event this calendar does not already track. | Stance opened: stand aside, carry the downgrade and the 01-04 guard. Registered FT-…-1, -2, -3 | 2026-10-09 (low band, 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes
any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change*
earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sifma-uk-bond-market-closure-2027-01-01.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
