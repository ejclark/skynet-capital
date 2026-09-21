# Japan 10-year JGB auction (¥2,600bn anticipated, opens issue 384) — jgb-10y-auction-2026-10-06

**Kind:** rates · **Date:** 2026-10-06 (estimate, EST: mof.go.jp October calendar `2610e.htm` re-fetched direct 2026-09-21, HTTP 200, 24,852 bytes, row reads `Oct. 6, 2026 | 10-year` with both cells the plain string `Detail` and no href; terms expected **2026-09-29**, size anticipated **¥2,600bn**) · **Impact:** low
**Last assessed:** 2026-09-21
<!-- probe-ref: {"symbols":{},"vix":14.81,"daysBand":"low:15+","adjacentIds":["apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","construction-spending-2026-10-01","ism-manufacturing-2026-10-01","pmms-2026-10-01","sp-global-manufacturing-pmi-2026-10-01","sp-global-pmi-commodity-price-supply-2026-10-01","treasury-buyback-10y20y-2026-10-01","treasury-coupon-announcement-2026-10-01","uk-electricity-vat-zero-rate-2026-10-01","boe-dmp-2026-10-02","eurostat-hicp-flash-2026-10-01","google-adtech-final-judgment-2026-10-02","jobs-2026-10-02","m3-full-report-2026-10-02","opec-jmmc-68th-2026-10-04","opec-plus-meeting-2026-10-04","ism-services-2026-10-05","sp-global-services-pmi-2026-10-05","amzn-prime-big-deal-days-2026-10-06","eia-steo-2026-10-06","intl-trade-full-report-2026-10-06","mrvl-investor-day-2026-10-06","treasury-3y-note-2026-10-06","treasury-buyback-2y3y-2026-10-06","consumer-credit-2026-10-07","fomc-minutes-2026-10-07","treasury-10y-note-2026-10-07","ecb-account-2026-10-08","jgb-30y-auction-2026-10-08","treasury-30y-bond-2026-10-08","treasury-buyback-20y30y-2026-10-08","wholesale-trade-2026-10-08","sudan-sanctions-regime-expiry-2026-10-09"],"adjacentStrongIds":["ism-manufacturing-2026-10-01","jobs-2026-10-02","ism-services-2026-10-05"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** Japan opens a new 10-year line (**issue 384**, expected maturity **2036-09-20**) on
**2026-10-06**, anticipated **¥2,600bn** — but **nothing on this calendar is exposed to it**.
`symbols: []`, no house playbook is rates-keyed, and the auction sits in the maturity bucket the BoJ
has cut hardest on record (5–10y purchases **-64.8%** since 2024-01, per the sibling
`jgb-10y-auction-2026-11-05` ledger's own dated finding) without that taper showing up as measurable
auction-quality damage. This entry exists to keep the calendar complete and to carry three dated,
cheap-to-score identity predictions — not to trade anything.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (9/21, D-15) | **Stand aside** — nothing on this calendar is exposed to it | High | `symbols: []`, no tracked name carries yen-rates exposure, and no house playbook is rates- or FX-keyed | A tracked name (NVDA/AVGO/MRVL/CRWV) moving **>2%** on a session between **2026-09-21** and **2026-10-06** that the tape attributes to a JGB or yen headline |
| This week | **Watch the 2026-09-29 terms, trade nothing on them** | High | MOF's 7-day announcement lead is 3-for-3 confirmed this session (07-02, 08-04, 09-01 auctions); the terms will name the maturity and size before the BoJ's own Q4 purchase schedule (`boj-jgb-purchase-schedule-q4-2026-09-30`) publishes the next day | The terms not publishing on **2026-09-29**, or naming a maturity other than **2036-09-20** (`FT-jgb-10y-auction-2026-10-06-1`) |
| This month | **Read the 10-06 result as an identity check, not a quality signal** | High | It is this quarter's 10-year opening — issue **384**, ¥2,600bn anticipated — and its cover/tail sit in a maturity bucket whose BoJ-taper story does not translate into measured quality deterioration (11-05 ledger's cross-sectional finding: 5-10y and 10-25y show none, untapered 25y+ shows the most) | The settled `2610e.htm` row naming any issue but **384** (`FT-jgb-10y-auction-2026-10-06-3`), or a tracked name moving on the result |
| This quarter | **Do not reach for a BoJ-taper story on this tenor's auction quality** | Medium | The mechanism a taper would predict (rising tail share) is refuted cross-sectionally in the sibling's own analysis; the live channel worth watching is the Q4 purchase-schedule's maturity-zone allocation on 2026-09-30, not this auction | The BoJ's 2026-09-30 Q4 schedule redirecting purchases *toward* the 5-10y bucket, which would reopen the taper question this entry currently treats as closed |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never** — no entry, exit or hedge is keyed to this auction or to the 2026-10-06 session.
- **Watch, don't trade, the 2026-09-29 announcement and the 2026-09-30 BoJ Q4 purchase schedule** —
  both are dated, free, and settle this entry's identity predictions before the auction itself.

## Initial research

### The question, plainly

This event was proposed by `jgb-5y-auction-2026-10-14`'s initial research (2026-09-10) as "the single
untracked coupon auction" on MOF's October slate — a completeness gap, not a proximity find (it sits
D-8 from the proposing event, outside the ±5-day corridor). The question this session answers: *what
is this auction, on its own terms, and does anything on this calendar have exposure to it?*

**One-line verdict:** it is the quarter's 10-year opening — issue 384, maturity 2036-09-20, ¥2,600bn
anticipated — sitting in the BoJ's most-tapered purchase bucket, with no measurable quality channel
and no tracked exposure. Stand aside, permanently.

### Method

Sourced research per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md), rates mode — no price
instruments, `symbols: []`. Every fetch below is direct (plain `curl`) on **2026-09-21** unless
labelled otherwise:

- **MOF October 2026 auction calendar** `calendar/2610e.htm` (HTTP 200, 24,852 bytes) — the Oct. 6
  row, confirmed still `Detail`/`Detail` with no href on either the Announcement or Result cell, i.e.
  nothing about this auction has published yet.
- **MOF September 2026 auction calendar** `calendar/2609e.htm` — confirms the Sep. 1 10-year row
  settles as `10-year(383)`.
- **Three MOF announcement pages for issue 383's auctions** — `calendar/announcement/auct20260625e.htm`
  (published for the 07-02 auction), `auct20260728e.htm` (08-04) and `auct20260825e.htm` (09-01), all
  HTTP 200. Each parsed field-by-field: Auction Date, Issue Date, Maturity Date, Offering Amount.
- **MOF JGB par yield curve** `reference/interest_rate/jgbcme.csv` (current month, HTTP 200) — through
  **2026-09-17**.
- **US Treasury daily par yield curve** (home.treasury.gov CSV, HTTP 200) — through **2026-09-18**.
- **Yahoo Finance chart API** (direct `curl`, not the WebFetch tool — see the honest limits below) for
  VIX and USD/JPY, through **2026-09-18** (VIX) and **2026-09-21** (USD/JPY intraday). Labelled
  secondary wherever cited.
- **This repo's own calendar** (`node scripts/event-scan.mjs --dump`) for the ±5-day corridor.
- The **`jgb-10y-auction-2026-11-05`** ledger's own dated findings (BoJ monthly operation workbooks,
  34-issue classification, checked 2026-09-09) are cited, not re-derived — see the honest limits.

### Conviction legs, tested

**1. This auction opens a new issue at maturity 2036-09-20 — SUPPORTED, independently corroborated.**
The `jgb-10y-auction-2026-11-05` ledger established from a 34-issue classification (2018-03 → 2026-07)
that the 10-year opens a new maturity in Jan/Apr/Jul/Oct (33 of 34) and steps its issue +3 months
issue-to-issue (33 of 33). This session did not re-run that classification, but independently confirms
its immediate prediction with fresh primary reads: issue 383 opened **2026-07-02** and its two
reopenings (08-04, 09-01) both confirm **Maturity Date: June 20, 2036** on MOF's own announcement
pages. Three months on from a June 2036 maturity is **September 2036** — so 2026-10-06, the next
quarterly opening slot, is predicted to open maturity **2036-09-20**. Registered as
`FT-jgb-10y-auction-2026-10-06-1`, scored off the 2026-09-29 announcement rather than the auction
itself, the same "the terms settle it before the auction does" logic the 5-year family has used twice.

**2. The anticipated size is ¥2,600bn — SUPPORTED, three-for-three on the current issue.** All three of
issue 383's auctions (07-02, 08-04, 09-01) offered "About 2,600 billion yen" per direct reads of their
own announcement pages this session. No opening-vs-reopening size split is asserted or claimable from
three data points on one issue; the anticipated base case for 10-06 is the unbroken ¥2,600bn run.
Registered as `FT-jgb-10y-auction-2026-10-06-2`.

**3. MOF's 7-day announcement lead holds for the 10-year, same as the 5-year family** — SUPPORTED.
Announcements for the 07-02, 08-04 and 09-01 auctions published 06-25, 07-28 and 08-25 respectively —
seven calendar days ahead in all three cases. Applied forward, the 2026-10-06 terms are expected
**2026-09-29**, one day before the BoJ's own Q4 purchase-schedule release
(`boj-jgb-purchase-schedule-q4-2026-09-30`) — a corridor fact worth naming, not a claimed
relationship between the two.

**4. The issue number step is a construction, not a forecast — SUPPORTED, by the same logic the 5-year
sibling used for its own opening auction.** MOF writes the settled issue number into the calendar row
once an auction runs (`2609e.htm` reads `10-year(383)`); an opening auction carries a new number by
construction under the post-2018Q3 convention the 11-05 ledger established (33 of 33 openings step
+1). This auction is not on the non-opening fork the same ledger found genuinely uncallable (its own
53/51 split among reopenings). Predicted: **issue 384**. Registered as
`FT-jgb-10y-auction-2026-10-06-3`, scored at settlement (2026-10-08) rather than at announcement, since
MOF does not print the issue number until the row settles.

**5. This tenor sits in BoJ's most-tapered purchase bucket, and the mechanism that would predict
auction damage from that is already refuted — inherited from `jgb-10y-auction-2026-11-05`, not
re-derived this session.** That ledger's dated finding (BoJ monthly operation workbooks, checked
2026-09-09): the "More than 5 years and up to 10 years" purchase bucket ran **-64.8%** since 2024-01,
the deepest cut of BoJ's six maturity buckets, against roughly flat MOF issuance at this tenor — net
supply to private hands up **+142.0%**, the largest increase of any tenor. The same ledger tested
whether that predicts quality deterioration and found it does not, cross-sectionally: tail share ≥2bp
2007-2023 → 2024+ runs 5Y 1.5%→0.0% and 10Y 3.4%→19.4%, but the two most-tapered buckets (5-10y,
10-25y) show **zero** deterioration while the **undosed** 25y+ bucket shows the steepest rise —
deterioration splits at 10 years, not at any BoJ bucket boundary. This session takes that finding as
established rather than re-running the 32-workbook analysis, because nothing about it is specific to
the 11-05 auction — it describes the bucket, and 10-06 sits in the same one.

**6. The corridor is dense but the loading is same-week, not same-day — SUPPORTED.** The ±5-day window
(`node scripts/event-scan.mjs --dump`, 2026-09-21) carries **35 tracked ids**, **3 of them
confirmed/high**: `ism-manufacturing-2026-10-01` (D-5), `jobs-2026-10-02` (D-4) and
`ism-services-2026-10-05` (D-1) — none on the auction date itself. Same-day (10-06): `mrvl-investor-day`
(confirmed, medium), `treasury-3y-note` and `treasury-buyback-2y3y` (both estimate, medium),
`amzn-prime-big-deal-days`, `eia-steo`, `intl-trade-full-report` (all estimate, low). D+1 carries
`fomc-minutes-2026-10-07` (confirmed, medium) and, notably, a **US 10-Year Treasury Note auction**
(`treasury-10y-note-2026-10-07`, estimate) the day after this one — a same-tenor cross-market pair
worth naming in any future pulse, not a claimed relationship. `jgb-30y-auction-2026-10-08` (own
sibling) follows at D+2.

### What plays the conditions support

**None.** No tracked symbol has yen-rates exposure and no house playbook is rates-keyed. What this
entry leaves behind: **three dated, cheap-to-score identity predictions** (maturity, size, issue
number) that settle before or shortly after the auction, and an explicit inheritance of the sibling
ledger's BoJ-taper-does-not-predict-quality finding rather than a silent re-assumption of it.

### Honest limits

- **No auction-quality calibration exists for the 10-year in this ledger family.** The 5-year family
  has pooled live-regime cover/tail thresholds (weak/strong); this session does not derive an
  equivalent for the 10-year from the 320-plus-auction workbook, because impact is low and no house
  playbook would use it. A future pulse or a higher-impact 10-year entry is where that work belongs.
- **Leg 5 is inherited, not independently re-verified this session.** The BoJ purchase-bucket cut and
  its cross-sectional refutation are the `jgb-10y-auction-2026-11-05` ledger's own dated finding
  (checked 2026-09-09, twelve days before this session). It is cited with its date rather than
  presented as this session's own primary work, and it is not re-run against any BoJ data published
  since.
- **The maturity/size/issue predictions rest on three data points, all from one issue (383).** They
  establish that 383's own auctions were consistent, not that MOF cannot revise terms; the kill
  switches below are the honest hedge against that.
- **VIX and USD/JPY are Yahoo, i.e. secondary, and fetched by direct `curl` rather than the WebFetch
  tool** — the WebFetch tool's own summarization returned stale, wrong-year data (Jan 2025) for both
  series on this session's first attempt, which direct `curl` against the same Yahoo chart endpoint
  did not reproduce (returned correct 2026-dated series). Recorded here rather than silently
  discarded: a future session hitting the same WebFetch/Yahoo mismatch should not assume the tool is
  reliable for this specific endpoint without cross-checking.
- **The auction does not exist yet, and neither does its announcement, its coupon, its issue number or
  its result.** Everything here is prior.
- **The date is `estimate`.** MOF is a primary and the date is not in doubt; the label reflects an
  unannounced size plus the standing gap in `market-events-data.ts`'s prefix taxonomy, which has no
  slot for a non-US sovereign debt office — the same gap every sibling JGB entry records.

## Stance & kill switches

**Stance (2026-09-21, D-15; date and size both `estimate`).** **Stand aside, permanently.** No entry,
exit or hedge is keyed to the 2026-10-06 auction or to the 10-06 session. The entry is kept for three
diagnostic jobs:

1. **It closes the October completeness gap** the 5-year sibling identified — this is now the only
   untracked October coupon auction that has become a canonical file.
2. **It registers three dated, cheap-to-score identity predictions** (maturity 2036-09-20, size
   ¥2,600bn, issue 384) that resolve at the 2026-09-29 announcement and the 2026-10-08 settlement,
   well ahead of anything a house playbook would need.
3. **It carries forward, with attribution, the sibling ledger's finding that this tenor's BoJ taper
   does not translate into measurable auction-quality damage** — so a later pulse does not have to
   re-derive that before reading a weak or strong print correctly.

**Kill switches.**

1. **The no-price-channel premise breaks** — a tracked name (NVDA/AVGO/MRVL/CRWV) moves **>2%** on a
   session between **2026-09-21** and **2026-10-06** that the tape attributes to a JGB or yen headline.
   This document is rebuilt, not patched.
2. **The maturity prediction breaks** — the 2026-09-29 announcement, or the 10-06 result page, names
   any maturity other than **2036-09-20** (`FT-jgb-10y-auction-2026-10-06-1`).
3. **The size prediction breaks** — the announcement offers anything other than **¥2,600bn**, ending a
   three-auction run at that level (`FT-jgb-10y-auction-2026-10-06-2`).
4. **The issue-number prediction breaks** — the settled `2610e.htm` row reads anything but
   **`10-year(384)`**, including a reopening of 383, which would put a quarterly opening auction on the
   non-opening fork for the first time in the post-2018Q3 convention (`FT-jgb-10y-auction-2026-10-06-3`).
5. **The inherited BoJ-taper finding breaks** — the 2026-09-30 Q4 purchase schedule redirects purchases
   *toward* the 5-10y bucket, reversing the -64.8% cut trend the 11-05 ledger measured; or a future
   pulse re-running that ledger's cross-sectional quality test on fresher data finds the 5-10y bucket
   has started deteriorating after all.

Three predictions carry score-by dates and are registered in
[`forward-tests/jgb-10y-auction-2026-10-06.md`](../forward-tests/jgb-10y-auction-2026-10-06.md).

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-21 | D-15 | Initial research banked (above); canonical `src/domain/market-events/jgb-10y-auction-2026-10-06.json` written from the single sibling proposal (`from-jgb-5y-auction-2026-10-14`), now shadowed. **IDENTITY ESTABLISHED, THREE PRIMARIES CONFIRMED THIS SESSION:** MOF October calendar (`2610e.htm`, HTTP 200) still shows the Oct. 6 row as `Detail`/`Detail` with no href — nothing published. September calendar (`2609e.htm`) settles issue 383 on Sep. 1 (`10-year(383)`). Three announcement pages for issue 383's own auctions (`auct20260625e`, `auct20260728e`, `auct20260825e`, all HTTP 200) each read Maturity Date **June 20, 2036** and Offering Amount **About 2,600 billion yen** — issue 383 opened 2026-07-02 and ran two unchanged reopenings. **PREDICTED FOR 10-06: opens issue 384, maturity 2036-09-20 (+3 months), ¥2,600bn anticipated** (`FT-1`, `FT-2`, `FT-3`), leaning on the `jgb-10y-auction-2026-11-05` ledger's own 34-issue classification (33/33 post-2018-03 openings step +3mo/+1) rather than re-deriving it. **TERMS DUE 2026-09-29** — MOF's 7-day announcement lead confirmed 3-for-3 on issue 383's own auctions (06-25→07-02, 07-28→08-04, 08-25→09-01), one day before `boj-jgb-purchase-schedule-q4-2026-09-30` publishes. **BOJ TAPER CONTEXT INHERITED, NOT RE-DERIVED:** the 11-05 sibling's dated finding (checked 2026-09-09) has the 5-10y purchase bucket at **-64.8%** since 2024-01, the deepest BoJ cut, net supply to private hands **+142.0%**, and its own cross-sectional test found no measurable quality deterioration at this tenor (splits at 10 years, not at the BoJ bucket boundary) — cited with its date rather than presented as fresh work. **CURVE (MOF par, primary, through 2026-09-17):** 10Y **2.993%**, 2s5s **+45.4bp** (up from the 5-year sibling's 09-09 reading of +41.0bp), 5s10s **+67.1bp**. **MACRO (US Treasury par, primary, through 2026-09-18):** US 10Y **5.01%**, up from the 5-year sibling's 09-10 reading of 4.95%, consistent with that ledger's flagged one-session rate shock continuing rather than reversing. **VIX/FX (Yahoo, secondary, direct `curl`):** VIX **17.10 (09-14) → 17.20 → 17.71 (09-16) → 15.44 → 14.81 (09-18)** — a sharp de-risk over three sessions, well past this repo's 3-point regime threshold in the calming direction; USD/JPY **154.385 (09-14) → 156.854 (09-21, intraday)**, yen weakening further from the 5-year sibling's 154.431 (09-10) reading. **PEERS:** n/a, `symbols: []`. **ADJACENCY:** **35 tracked ids** in the ±5d corridor (`node scripts/event-scan.mjs --dump`), **3 confirmed/high** — `ism-manufacturing-2026-10-01` (D-5), `jobs-2026-10-02` (D-4), `ism-services-2026-10-05` (D-1) — none on the auction date itself. Same-day: `mrvl-investor-day-2026-10-06` (confirmed, medium), `treasury-3y-note-2026-10-06` + `treasury-buyback-2y3y-2026-10-06` (estimate, medium), `amzn-prime-big-deal-days`, `eia-steo`, `intl-trade-full-report` (estimate, low). D+1: `fomc-minutes-2026-10-07` (confirmed, medium) and a **same-tenor US 10-Year Note auction** (`treasury-10y-note-2026-10-07`, estimate) — a cross-market pair worth watching, not yet a claimed relationship. `jgb-30y-auction-2026-10-08` (own sibling) at D+2. Read against `--on-date=2026-10-06`: 7 entries already on the date, none a re-slug of this one. **NO NEW DATED EVENT PROPOSED** — the October completeness gap this event itself was proposed to fill is now closed; no further gap found this session. **BLOCKED:** none — every cited fetch returned HTTP 200 via direct `curl` (the WebFetch tool's own Yahoo fetch returned stale Jan-2025 data on this session's first attempt and was discarded in favor of `curl`, recorded in the honest limits above rather than in `probe-ref.blocked`, since no *cited* source failed — the discarded attempt cited nothing). | Initial stance set — **stand aside, permanently**; the entry closes the October completeness gap, registers three dated identity predictions, and inherits (with attribution) the sibling ledger's BoJ-taper-does-not-predict-quality finding rather than re-deriving it | 2026-09-28 (low band; already inside the 15-day threshold as of today, so the next interval is 7d, not the nominal 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-jgb-10y-auction-2026-10-06.json` (`status: "estimate"`) in the
same PR — your own file, never another event's canonical one (#1717). Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
