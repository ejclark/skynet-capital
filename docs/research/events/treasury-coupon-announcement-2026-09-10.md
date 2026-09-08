# Treasury coupon announcement (20Y reopening + 10Y TIPS reopening sizes) — treasury-coupon-announcement-2026-09-10

**Kind:** rates · **Date:** 2026-09-10 (estimate, EST: date now primary-verified three ways — treasurydirect's `TA_WS/securities/upcoming` carries `announcementDate 2026-09-10` for both CUSIPs, treasury.gov's Tentative Auction Schedule PDF carries `20-Year BOND R` and `10-Year TIPS R` announce rows on `Thursday, September 10, 2026`, and `sb0590`'s own September table row prices the 20Y leg; stays `estimate` only because this lane may not self-confirm) · **Impact:** medium
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.73,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","buyback-blackout-start-2026-09-12","cpi-2026-09-11","ecb-decision-2026-09-10","eia-steo-2026-09-09","fomc-blackout-start-2026-09-05","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","iea-omr-2026-09-11","labor-day-market-closure-2026-09-07","missouri-map-ballot-deadline-2026-09-08","mts-august-2026-09-11","opec-momr-2026-09-10","opec-plus-meeting-2026-09-06","ppi-2026-09-10","qss-q2-2026-09-09","sp-rebalance-proforma-capped-2026-09-11","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-10y20y-2026-09-10","treasury-buyback-increase-2026-09-09","umich-sentiment-prelim-2026-09-11"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Both numbers this event will publish are already in writing, and have been for a month —
so this is a reading exercise, not a forecast.** Treasury's 2026-08-05 quarterly refunding statement
(`sb0590`, fetched direct from home.treasury.gov this session) carries an anticipated-auction-size
table whose **Sep-26 row reads 20-Year = 13**, and a separate **TIPS FINANCING** paragraph that says
verbatim: *"Treasury plans to maintain TIPS auction sizes at current levels: … the September 10-year
TIPS reopening auction size at **$19 billion**."* That is not a run-rate inference — it is the two
exact numbers, named by month and by security, published 36 days before the announcement. The base
rates agree and are stronger than any prior ledger recorded: the 20Y grid has run **$16B new issue /
$13B reopening for 37 consecutive auctions** since 2023-08-23 with zero deviations, and every 10Y
TIPS reopening since 2023 has printed **exactly $2B below its own CUSIP's new issue — 14 of 14**
(91282CRE3 was sold 2026-07-23 at $21B, so its reopening is $19B). **The correction this doc exists
to make:** the [`20Y auction ledger`](treasury-20y-bond-2026-09-15.md) has stated at every pulse
through 2026-09-04 that *"Size and WI yield still do not exist"* — half of that is wrong; the size
exists in a Treasury primary and did before that ledger opened. Date is `estimate`; nothing here is
a trade. **Amended 2026-09-08:** the channel does not *expire* on 2026-11-12 as this doc first said
— the **2026-11-04 refunding re-publishes** eight days ahead of it, so publication is continuous and
11-04 is where the grid can change, not where deduction stops.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-08, D-2) | Stand aside | High | Nothing has moved that can reach this event. **No US session has closed since the last row** (09-07 Labor Day), `sb0590` was re-read verbatim this session, Treasury has published nothing since 09-04, and `symbols: []` with no macro-keyed house playbook. | Treasury publishing a coupon-size change, an off-cycle issuance action or a CMB affecting 20Y/TIPS sizes before **2026-09-10** — the "it is already in writing" claim dies the moment issuance moves off the published grid |
| This week | Read **2026-09-10** as a scheduled nil and price the *session*, not the announcement | High | The announcement restates a published table. What is genuinely dated that day is **PPI 08:30 · 30Y reopening auction 13:00 · the 10-20Y buyback 13:40**, with **CPI 08:30 the next morning**. | Either size printing off **$13B** (20Y) or **$19B** (10Y TIPS) on **2026-09-10** — Treasury would be contradicting a named, month-specific written commitment, which has no precedent in this cycle |
| This month | No new unhedged duration through the **09-10 → 09-17** stack; treat **09-15** as a pure demand test, its supply leg settled | Medium | With $13B published, the 20Y reopening on **2026-09-15** carries no supply surprise into the next-day FOMC — softness there would be evidence about demand or policy, never about issuance. | The **2026-09-15** 20Y clearing at a size other than **$13B**, or the **2026-09-17** TIPS at other than **$19B** — a post-announcement revision, which this series has never done |
| This quarter | **The channel has no expiry — it re-publishes on 2026-11-04** (this row replaces the "expires 11-12" call of 2026-09-05) | Medium | The Tentative Auction Schedule, re-parsed 2026-09-08, now runs to **Feb-2027** and dates the next coupon announcement **2026-11-12** (20Y **new issue** + 10Y TIPS reopening). The **11-04 refunding lands eight days first** and publishes the Nov/Dec/Jan table exactly as `sb0590` did on 08-05 — and `sb0590` covers every announcement through **10-22**, so there is **no unpublished gap at all**. 11-04 is where the grid can *change*. | The **2026-11-04** refunding publishing **no forward anticipated-size table**, or dropping *"for at least the next several quarters"* — then 11-12 genuinely goes dark and this correction is itself wrong. Registered as [`FT-…-09-10-2`](../forward-tests/treasury-coupon-announcement-2026-09-10.md), scores **2026-11-13**; [`FT-39`](../forward-tests.md) owns the guidance-language leg |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed.
- **The two numbers, primary-sourced and quotable:** 20Y reopening **$13B** (`sb0590` Sep-26 table
  row), 10Y TIPS reopening **$19B** (`sb0590` TIPS FINANCING paragraph, verbatim).
- **A size printing off those numbers is the signal**, in either direction — and it is a *bigger*
  signal than a broken base rate, because it would mean Treasury contradicted a specific written
  commitment 36 days old, not merely ended a streak.
- **Correction to a live sibling:** the 20Y auction ledger's *"size … still do[es] not exist"* line
  is wrong; only the **when-issued yield** is genuinely unavailable. Use `$13B` from today.
- **Correction to the 09-03 sibling's own limits:** its close-out called the TIPS leg *"the weakest
  number here … n=3 … a judgment call"* because fiscaldata *"carries no TIPS flag."* The dataset
  **does** — field `inflation_index_security` — and the clean series gives 14/14 on a mechanical
  rule, so the TIPS leg is the *better*-evidenced of the two, not the worse.
- **Checked and NOT a finding:** the 20Y par yield sits **1bp above** the 30Y (5.25 vs 5.24, 09-04).
  That looked like a long-end kink worth flagging until measured — the 20Y has been at or above the
  30Y in **76 of 171** 2026 sessions. Routine; it carries nothing.
- **The grid does not respond to the tape — measured 2026-09-08, not asserted.** All **67** nominal
  coupon and FRN auctions of 2026 (fiscaldata `auctions_query`) printed one of eight fixed sizes —
  3Y $58B · 10Y $42/$39B · 30Y $25/$22B · 20Y $16/$13B · 2Y $69B · 5Y $70B · 7Y $44B · FRN $30/$28B
  — **zero deviations**, across a 10Y par-yield range of **3.97 → 4.79** (82bp). `sb0590` names why
  in its own words: variations are absorbed "through changes in regular bill auction sizes and/or
  CMBs", and 2026 has run exactly **one** CMB. A rates selloff cannot reach 09-10's numbers.
- **Watch (dated):** FOMC blackout live **09-05→09-17** · OPEC+ **09-06** · 3Y **09-08** · 10Y
  reopening **09-09** · **PPI + 30Y reopening + buyback + this announcement 09-10** · CPI + MTS
  **09-11** · **20Y reopening 09-15** · **FOMC 09-16** · 10Y TIPS reopening **09-17** · next coupon
  announcement **10-15** (last one `sb0590` covers) · **10-22** (also `sb0590`) · refunding **11-04**
  (the table can change) · **11-12** announcement — 20Y **new issue** + 10Y TIPS reopening, read off
  the 11-04 table.

## Initial research

### The question, plainly

This event is the moment the last two September coupon sizes — the **20-Year bond reopening**
(CUSIP 912810UX4, auction 09-15) and the **10-Year TIPS reopening** (CUSIP 91282CRE3, auction
09-17) — stop being unknown. It was created in the [`3Y ledger`](treasury-3y-note-2026-09-08.md)'s
2026-09-05 adjacency sweep to give a date to a gap the [`20Y ledger`](treasury-20y-bond-2026-09-15.md)
had been naming without one. So: **what will Treasury announce, how confident can we actually be,
and what does the answer change about how the 09-10 → 09-17 stack should be read?**

**One-line verdict:** both numbers are **already published by name in a Treasury primary** — 20Y
**$13B**, 10Y TIPS **$19B** — so this is not a forecast at all but a read of `sb0590`, and the
announcement is a scheduled nil whose only real output is to close a factual error two sibling
ledgers are currently carrying.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target here
and the mandated cache bust has nothing to bust (recorded rather than skipped silently). Everything
quantitative below is **primary and fetched this session (2026-09-05)**, never from memory:

- **The guidance** — `home.treasury.gov/news/press-releases/sb0590`, the 2026-08-05 quarterly
  refunding statement, fetched direct (HTTP 200, 75,578 bytes) and its tag-stripped text read in
  full. This is the document the whole finding rests on.
- **The dates** — treasurydirect.gov `TA_WS/securities/upcoming` (HTTP 200, 43,843 bytes) and
  treasury.gov's `Tentative-Auction-Schedule.pdf` (HTTP 200, 17,195 bytes), PDF text layer
  decompressed directly. Two independent Treasury endpoints agreeing on CUSIP, announce, auction
  and settle dates.
- **The base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, two pulls: all
  `original_security_term: 20-Year` auctions since 2023-01-01 (44 rows), and all
  `inflation_index_security: Yes` auctions since 2023-01-01 (44 rows). Sorted `-auction_date`
  explicitly, per the [09-03 sibling](treasury-coupon-announcement-2026-09-03.md)'s method note that
  the default sort returns 2024-dated rows first.
- **The tape** — Treasury's own daily par yield curve and daily **real** yield curve CSVs (2026
  full-year files, both same-day publishers), and Yahoo `^VIX` daily closes, the series the repo's
  own probe reads.
- **Dealer expectations** are **press-sourced and labelled as such**, and carry a stated staleness.

### Conviction legs, tested

**1. The event fires 2026-09-10 and publishes exactly these two securities — SUPPORTED, two
primaries.** treasurydirect's `upcoming` feed (fetched today) returns five non-bill rows: the three
already-announced September coupons carrying `announcementDate 2026-09-03` and their sizes
(**91282CRL7 $58B** / **91282CRF0 $39B** / **912810UW6 $22B**), plus two rows with
`announcementDate 2026-09-10` and **`offeringAmount` still empty** — `912810UX4`, 19-Year 11-Month,
`reopening: Yes`, auction 09-15, issue 09-18; and `91282CRE3`, 9-Year 10-Month, `reopening: Yes`,
auction 09-17, issue 09-30. The Tentative Auction Schedule PDF independently carries
`20-Year BOND R  Thursday, September 10, 2026 · Tuesday, September 15, 2026 · Friday, September 18,
2026` and `10-Year TIPS R  Thursday, September 10, 2026 · Thursday, September 17, 2026 · Wednesday,
September 30, 2026`. Every field agrees across both. Status stays `estimate` regardless — **this
lane may not self-confirm** — and the ~11:00 ET *time* remains Treasury convention, not a sourced
fact, exactly as the calendar entry discloses.

**2. Both sizes are published in advance, by month and by security — SUPPORTED, and this is the
finding.** `sb0590` (2026-08-05), read in full this session, contains two independent statements:

- Its **nominal coupon and FRN** section publishes an anticipated-size table for the August-to-October
  quarter. Reading the September row across the tenor headers `2-Year · 3-Year · 5-Year · 7-Year ·
  10-Year · 20-Year · 30-Year · FRN`: **`Sep-26  69  58  70  44  39  13  22  28`** — so the
  **20-Year at $13 billion**, alongside the 10Y $39B and 30Y $22B that the 09-03 announcement has
  already printed exactly. The same table's `Oct-26` row also reads 20-Year **13**.
- Its **TIPS FINANCING** section is more specific still, and needs no table-reading at all:
  *"Over the August to October 2026 quarter, Treasury plans to maintain TIPS auction sizes at current
  levels: the August 30-year TIPS reopening auction size at $8 billion, the **September 10-year TIPS
  reopening auction size at $19 billion**, and the October 5-year TIPS new issue auction size at $26
  billion."*

The August 30-year TIPS leg of that same sentence has **already been scored by the tape**: it printed
**$8B on 2026-08-20** (fiscaldata, this session). One of the three commitments in the sentence is
therefore verified, and the September one is the next.

**3. The 20Y grid is the most deterministic in the nominal complex — SUPPORTED, n=37.** From
`auctions_query`, every 20-Year auction since the last size change (2023-08-23, when new issues went
$15B → $16B and reopenings $12B → $13B): **13 new issues, all $16B; 24 reopenings, all $13B; 37
consecutive auctions, zero deviations, three full years.** The predecessor CUSIP is `912810UX4`
itself, sold as a new issue **2026-08-19 at $16B** (high yield 5.204%, bid-to-cover 2.53), so 09-15
reopens a bond whose own grid slot is unambiguous. The prior sibling recorded this leg as "7/7 back
to 2025-10"; the correct run is more than three times longer.

**4. The TIPS leg is NOT the weak leg the 09-03 close-out called it — REFUTED, with the method error
named.** That close-out's honest limits read: *"the TIPS base rate is the weakest number here:
fiscaldata's dataset carries no TIPS flag … so TIPS rows were identified by real-yield level … a
judgment call, on n=3."* **The dataset does carry the flag** — `inflation_index_security`, filterable
server-side — and using it returns a clean 44-row TIPS series back to 2023 with no heuristics. That
series yields a mechanical rule the level-based method could not see: **every 10-Year TIPS reopening
prints exactly $2B below its own CUSIP's new issue, 14 of 14, across 8 CUSIPs and 4 years, zero
mismatches** —

| CUSIP | New issue | Reopenings |
|---|---|---|
| 91282CGK1 | 2023-01-19 **$17B** | 03-23 $15B · 05-18 $15B |
| 91282CHP9 | 2023-07-20 **$17B** | 09-21 $15B · 11-21 $15B |
| 91282CJY8 | 2024-01-18 **$18B** | 03-21 $16B · 05-23 $16B |
| 91282CLE9 | 2024-07-18 **$19B** | 09-19 $17B · 11-21 $17B |
| 91282CML2 | 2025-01-23 **$20B** | 03-20 $18B · 05-22 $18B |
| 91282CNS6 | 2025-07-24 **$21B** | 09-18 $19B · 11-20 $19B |
| 91282CPU9 | 2026-01-22 **$21B** | 03-19 $19B · 05-21 $19B |
| **91282CRE3** | **2026-07-23 $21B** | **09-17 → $19B predicted** |

The rule and `sb0590`'s sentence give the same answer independently. Note also what the longer series
shows that n=3 hid: TIPS sizes **do** ratchet — the grid rose every year from 2023 to 2025 — so
"unchanged" is a real claim here rather than an inert one, and it is the claim Treasury made in
writing. 2026 is the first year the July new issue did **not** step up ($21B → $21B), which is
consistent with the maintain-at-current-levels guidance and inconsistent with an unannounced increase.

**5. Two live sibling ledgers are carrying a factual error this closes — REFUTED, and it is the
correction with the most reach.** The [`20Y ledger`](treasury-20y-bond-2026-09-15.md) (impact
`high`, last assessed 2026-09-04, D-11) states in its own decision header: *"Size and WI yield still
do not exist."* The **when-issued yield** genuinely does not — searched again this session across
auction-preview publishers, nothing dated for 09-15. **The size does**, and has since 2026-08-05.
Same shape as the error the 09-03 sibling caught and fixed ($42B new-issue bar applied to a $39B
reopening): a rates ledger reasoning from a fact recorded as missing that is in fact published. The
consequence is the same too, and it favours calm rather than caution — with $13B settled, the 09-15
sale into the next-day FOMC is a **demand** test with its supply leg removed, not a compound
supply-plus-policy risk. This doc does not edit those ledgers (append-only); it states the number so
their next pulses can use it.

**6. The registered forward test is framed inductively and is actually deductive — MIXED, recorded,
not edited.** [`FT-treasury-coupon-announcement-2026-09-03-1`](../forward-tests.md) predicts exactly
this announcement's two numbers and discloses its own base rate as *"7/7 on the 20Y leg and 3/3 on
the TIPS leg, so a pass is weakly informative and only a fail carries real signal."* That framing was
honest on the evidence that session had, and both halves shift on this session's evidence: the
inductive support is much stronger (37/37 and 14/14, per legs 3–4), and — more importantly — the
prediction does not actually rest on induction at all, because `sb0590` names both numbers. So a
**pass is weaker information than registered** (it confirms Treasury did what it said it would), and
a **fail is stronger information than registered** — not "an issuance convention broke" but "Treasury
contradicted a specific, dated, month-and-security commitment inside its own guidance quarter."
Ledger rows and registered predictions are append-only, so **FT-…-09-03-1 is left exactly as
written**; this leg is the re-framing on the record, and its score on 2026-09-11 stands with the
sibling that registered it.

**7. The announcement's own tape effect will not be measurable on 09-10 either — SUPPORTED, and
stated up front rather than attempted and glossed.** The 09-03 close-out's principal limit was that
it could not separate the announcement from its session (five scheduled items shared the day; the
press named Waller). **2026-09-10 is worse, not better:** PPI at 08:30, the 30-Year reopening at
13:00, the first post-`sb0607` long-end buyback at 13:40, an ECB decision the same morning, and CPI
at 08:30 the following day. No intraday attribution to an ~11:00 ET announcement of two published
numbers is defensible in that session, and none will be attempted at close-out. The honest measurable
is the *sizes*, not the *reaction*.

**8. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve, 08-31 → **09-04**: 2Y 4.34 → **4.37** · 10Y 4.75 → **4.78** · 20Y 5.24 →
**5.25** · 30Y 5.25 → **5.24**. Real curve (same publisher): 10Y real 2.44 → **2.43**, 20Y real 2.78
→ **2.77** — so the approximate 10Y breakeven (par nominal less par real, a curve-derived
approximation, not a traded breakeven) sits ~**2.35%**, essentially flat over the interval, which is
the relevant demand backdrop for a TIPS reopening and says nothing urgent. **VIX 14.53** (09-04
close; the 09-05 session had not closed when this ran). **Checked and discarded:** the 20Y sitting
1bp *above* the 30Y on 09-04 looked like a long-end kink worth a line — measured across the 2026 par
file it holds in **76 of 171** sessions, so it is the norm, not a signal.

**9. No tracked name is exposed through this channel — SUPPORTED, inherited, not re-derived.**
`symbols: []`. The duration channel that hit CRWV −12.1% and SOX −5% on 2026-08-18 was a *long-end
yield* move; an announcement that publishes numbers already published cannot transmit anything to it.
The live equity risk in this corridor is the policy path — CPI 09-11 into FOMC 09-16 — which the
auctions inform and this announcement does not.

### What the conditions support

Nothing directional, which is the standard answer for a `symbols: []`, `estimate`-dated rates event
and is stronger than usual here because the event's content is a restatement. What the conditions do
support is **using the number instead of waiting for it**: the 20Y reopening is $13B and the 10Y TIPS
reopening is $19B, both citable to `sb0590` today, so every rates ledger in this corridor can retire
"the size is unknown" from its reasoning five days early. Second, **the 09-15 sale is a demand test**
— its supply leg is settled in writing, exactly as the 09-03 announcement settled the 09-08→09-10
block's. Third, and the only forward-looking item: **the deductive channel expires on a date.**
`sb0590`'s table and TIPS paragraph both stop at **Oct-26**, so 2026-09-10 and 2026-10-15 are reads
of a document while **2026-11-12** is the first September-cycle-style announcement no current primary
publishes — and **2026-11-04** is where the grid itself can move. Press context, dated and stale by
construction: Reuters (via Yahoo Finance, **2026-05-06**, on the May refunding) reported primary
dealers expecting nominal coupon sizes to rise *"early next year"* with Treasury adjusting forward
guidance several quarters ahead. Four months old and about a different refunding — it bounds the risk
loosely rather than pricing it, and it is not treated as current.

### Honest limits

**No Treasury press release for the 2026-09-10 announcement exists yet** — it has not happened; the
prediction is a document read, not an observation. **`sb0590`'s language is "anticipates" and
"plans to", not a guarantee**, and its nominal-coupon table is explicitly *anticipated* sizes; the
TIPS paragraph is the firmer of the two because it names the security and the month directly. **The
whole finding is single-document-dependent** on the nominal leg — if `sb0590`'s table were misread,
leg 2's 20Y number falls back on leg 3's 37/37 base rate, which is why both are carried rather than
one. **The ~11:00 ET time is unsourced convention**, inherited from the 09-03 sibling and not
independently established here. **Base rates sit inside one policy regime** (Fed on hold at
3.50–3.75% across the whole 2023–2026 window used); "the grid is deterministic" is a
within-guidance claim, and the guidance's own expiry is leg-by-leg dated above. **The breakeven in
leg 8 is curve-derived**, not a traded instrument, and is offered as context only. **The dealer
expectation is May-dated**, four months stale, and is labelled as such rather than treated as a
current survey.

## Stance & kill switches

**Stance (date `estimate`, primary-verified three ways; both sizes primary-sourced from Treasury's
own refunding statement, fetched 2026-09-05).** This event is a **scheduled nil, and unusually so —
its content is not merely predictable from a run-rate but literally already published**. Expect
**20Y reopening $13B** and **10Y TIPS reopening $19B** on 2026-09-10 at ~11:00 ET. No position is or
should be taken on it, and none on its successors while `sb0590`'s guidance stands. The doc's durable
outputs are three: (a) **the two numbers, citable today**, which retire the "size unknown" line the
[`20Y ledger`](treasury-20y-bond-2026-09-15.md) is still carrying and make **2026-09-15 a demand test
with its supply leg removed**; (b) **the `inflation_index_security` field**, which converts the TIPS
base rate from an n=3 level-matching judgment call into a 14/14 mechanical rule and should be used by
every future TIPS pull; and (c) **the channel's dated expiry — 2026-11-12**, the first coupon
announcement whose size no current Treasury primary publishes, with **2026-11-04** as the date the
grid itself can change.

**`FT-treasury-coupon-announcement-2026-09-03-1` is not touched.** It already predicts this event's
two numbers and scores **2026-09-11**, owned by the sibling that registered it. Registering the same
prediction here would double-count one observation. Leg 6 records that its stated framing understates
a fail and overstates a pass, as a note to whoever scores it — the registered text stands unedited.

**Amendment, 2026-09-08 (D-2) — the quarter-horizon call is replaced, with its receipt in the ledger
row of that date.** The stance above said the deductive channel *expires* on **2026-11-12**. It does
not. The Tentative Auction Schedule, re-parsed this session, now runs to Feb-2027 and dates 11-12
(20Y **new issue** + 10Y TIPS reopening) — and the **2026-11-04 refunding precedes it by eight
days**, publishing that quarter's anticipated-size table exactly as `sb0590` did on 08-05. There is
no unpublished gap anywhere in the cycle: `sb0590` covers every announcement through **10-22** and
11-04 covers 11-12 onward. **2026-11-04 is where the grid can change, not where publication stops** —
which is the claim the original stance should have made. Registered as
`FT-treasury-coupon-announcement-2026-09-10-2`, scoreable **2026-11-13**. The same session added the
strongest support this doc carries for the near call: **67 of 67** nominal coupon and FRN auctions in
2026 printed a fixed grid size, zero deviations, across an 82bp range in the 10Y — and `sb0590` names
bills and CMBs, not coupons, as the shock absorber.

**Forward test `FT-treasury-coupon-announcement-2026-09-10-1` registered** in
[`forward-tests.md`](../forward-tests.md), scoreable **2026-10-16**: the **2026-10-15** coupon
announcement publishes the 20Y reopening at **$13B**, per `sb0590`'s own Oct-26 table row. It is the
last announcement the published guidance covers, so it is the out-of-sample point that dates where
deduction stops and forecasting starts.

**Kill switches:**

- **Either size printing off $13B (20Y) or $19B (10Y TIPS) on 2026-09-10** — Treasury would have
  contradicted a named, month-specific written commitment inside its own guidance quarter. Every
  "supply is settled in writing" line in this calendar's rates ledgers gets re-derived, not patched,
  and the 09-15 auction reverts to a compound supply-plus-policy risk the day before the FOMC.
- **The 2026-09-15 or 2026-09-17 auction clearing at a size other than the announced one** — a
  post-announcement revision, which this series has never done in the observed window.
- **Treasury dropping or qualifying *"for at least the next several quarters"***, at the 2026-11-04
  refunding or in any statement before it — the whole "announcement = scheduled nil" frame is
  conditional on that sentence, and [`FT-39`](../forward-tests.md) already measures that channel.
- **An off-cycle issuance action** — a CMB or a coupon size changed between refundings — which would
  make supply a live variable again for the first time in 2026. Note `sb0590` explicitly reserves
  bill-size and CMB flexibility, so a *bill* action does not fire this; only a coupon one does.
- **The 2026-10-15 announcement moving the 20Y off $13B** — the registered forward test's own kill,
  and the earliest dated tell that the issuance path is turning ahead of the November refunding.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-5 | **Initial research.** **The finding: both sizes are already published.** `sb0590` (2026-08-05 refunding statement, fetched direct this session, HTTP 200) carries a Sep-26 anticipated-size row reading `69 58 70 44 39 13 22 28` — **20-Year $13B** — and a TIPS FINANCING sentence reading verbatim *"the September 10-year TIPS reopening auction size at $19 billion."* Its August 30Y TIPS leg ($8B) already printed on 08-20, so one of the sentence's three commitments is tape-verified. **Dates, three primaries:** treasurydirect `upcoming` carries `announcementDate 2026-09-10` for **912810UX4** (20Y reop, auction 09-15, `offeringAmount` empty) and **91282CRE3** (10Y TIPS reop, auction 09-17, empty); the Tentative Auction Schedule PDF carries both announce rows on `Thursday, September 10, 2026` with matching auction/settle dates. **Base rates, re-derived and much stronger than recorded:** 20Y grid **$16B new / $13B reopening for 37 consecutive auctions** since 2023-08-23, zero deviations (prior sibling had "7/7"); 10Y TIPS reopenings print **exactly $2B below their own CUSIP's new issue, 14/14** across 8 CUSIPs and 4 years — 91282CRE3 sold 2026-07-23 at $21B → **$19B**. **Method correction:** the 09-03 close-out called the TIPS leg its weakest number because "fiscaldata carries no TIPS flag" — it carries **`inflation_index_security`**, filterable server-side, which removes the level-matching heuristic entirely. **Correction to a live sibling:** [`treasury-20y-bond-2026-09-15`](treasury-20y-bond-2026-09-15.md) (impact `high`, D-11) states *"Size and WI yield still do not exist"* — the WI yield genuinely doesn't (searched again, nothing dated), the **size does and has since 08-05**; with $13B settled, 09-15 is a **demand test with its supply leg removed** going into the next-day FOMC. Not edited there (append-only); stated here for its next pulse. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** payrolls **+162K vs ~53K** (09-04) reversed Waller's 09-03 dovish turn; 2Y intraday **4.4246%**, a Jan-2025 high; hike odds ~52–61% (sources disagree, range quoted). **FOMC blackout opens today (09-05)** — no Fed voice can adjudicate before the 09-10→09-17 stack clears. **Rates (Treasury par, primary):** 08-31 → 09-04, 2Y 4.34 → **4.37** · 10Y 4.75 → **4.78** · 20Y 5.24 → **5.25** · 30Y 5.25 → **5.24**; real curve 10Y 2.44 → **2.43**, approximate 10Y breakeven ~**2.35%**, flat. **VIX 14.53** (09-04 close; 09-05 not yet closed). **Checked and discarded as a non-finding:** the 20Y sitting 1bp above the 30Y — true on 09-04, and true in **76 of 171** 2026 sessions, so it is the norm. **Geopolitical:** OPEC+ 09-06 and the Hormuz/Brent premium belong to the auction ledgers; no supply-side channel reaches an announcement of published numbers. **Adjacency — 19 tracked entries inside the ±5-day corridor, all already on the calendar; one genuinely new dated event PROPOSED:** `treasury-coupon-announcement-2026-10-15` — the Tentative Auction Schedule (fetched this session) carries `20-Year BOND R` announce **Thursday, October 15, 2026** (auction 10-21) and `sb0590`'s table publishes its size (**Oct-26 20-Year = 13**), so it is the last announcement the current guidance covers and the dated home this session's forward test scores against. **`FT-treasury-coupon-announcement-2026-09-03-1` left unedited** — it already predicts this event's two numbers and scores 09-11 with its own ledger; leg 6 records that its stated framing understates a fail and overstates a pass. **`FT-treasury-coupon-announcement-2026-09-10-1` registered**, scoreable 2026-10-16. | **Stance set** — scheduled nil, and stronger than a run-rate call: the content is published, not merely predictable. Expect 20Y **$13B** / 10Y TIPS **$19B** | 2026-09-07 (medium, 0–7d band: every 2d — the last pulse before the 09-08→09-10 stack opens) |
| 2026-09-08 | D-2 | Pulse, run **pre-open ~07:55 ET**, so the 3Y (1:00pm) and today's cash session both price after this row. **First thing to say: no US session has closed since the last row.** 09-05 was a Saturday, 09-07 a full Labor Day closure — so Treasury's par-yield CSV (fetched direct, HTTP 200, 171 rows) still ends **09/04** at 2Y **4.37** / 10Y **4.78** / 20Y **5.25** / 30Y **5.24**, and the real-curve CSV at 10Y **2.43** / 20Y **2.77** (curve-derived 10Y breakeven ~**2.35%**). Those are D-5's readings inherited, not restated as new. **Event tape — re-verified, unchanged.** treasurydirect `TA_WS/securities/upcoming` (HTTP 200, 43,843 bytes) still returns **912810UX4** (20Y reopening, ann 09-10, auc 09-15, issue 09-18, `offeringAmount` **empty**, record stamp **2026-09-04T10:31:03**) and **91282CRE3** (10Y TIPS reopening, ann 09-10, auc 09-17, issue 09-30, empty, **2026-09-04T14:31:27**) — no revision, no early publication, both stamps unmoved for four days. **Kill switch 4 (off-cycle issuance action) checked and clear:** home.treasury.gov's press-release index (HTTP 200) has published nothing since **2026-09-04**, and nothing issuance-related; fiscaldata records **exactly one CMB in all of 2026** (2026-05-21, 27-day, $25B). **`sb0590` re-fetched and re-read verbatim this session** (HTTP 200, 75,576 bytes) rather than quoted from the last row: Sep-26 table row `69 58 70 44 39 13 22 28` (**20-Year 13**), the TIPS sentence *"the September 10-year TIPS reopening auction size at $19 billion"*, and *"for at least the next several quarters"* all intact. **New leg — the grid is insensitive to the tape, measured rather than assumed.** All **67** nominal coupon and FRN auctions of 2026 (`auctions_query`) took exactly one of eight sizes — 3Y $58B · 10Y $42/$39B · 30Y $25/$22B · 20Y $16/$13B · 2Y $69B · 5Y $70B · 7Y $44B · FRN $30/$28B — **zero deviations**, across a 2026 10Y par range of **3.97 → 4.79** (82bp). `sb0590`'s own bill paragraph names the shock absorber: variations are met *"through changes in regular bill auction sizes and/or CMBs"*. That is the leg the corridor's rate selloff would otherwise threaten, and it holds. **Adjacency — the load-bearing find, and it retires this doc's own quarter call.** The Tentative Auction Schedule PDF, re-fetched and text-layer re-parsed (HTTP 200, 17,195 bytes), now runs to **February 2027** and carries `20-Year BOND` — **no R, so a new issue** — announce **Thursday, November 12, 2026** (auction 11-18), and `10-Year TIPS RT` announce the same day (auction 11-19). D-5 called 11-12 *"the first announcement whose size no current primary publishes"* and treated it as the deductive channel's **expiry**. Wrong: the **2026-11-04 refunding lands eight days first** and publishes the Nov/Dec/Jan table exactly as `sb0590` did on 08-05 for Aug/Sep/Oct. Checked for a gap and there is none — `sb0590` covers every announcement through **10-22**, 11-04 covers 11-12 onward. The channel is **continuous by construction**; 11-04 is where the table can *change*, never where publication stops. **PROPOSED as `estimate` in this PR:** `treasury-coupon-announcement-2026-11-12`, primary-dated and not on the calendar. The same parse also yields 11-19, 12-03, 12-17, 12-24, 01-07, 01-14 and 01-21 announce dates; deliberately **not** filed as a batch — eight entries off one pulse is noise, not information. **Method note for the next TIPS pull:** fiscaldata's `original_security_term` is unreliable — the 2026-01-26 2Y note ($69B) is tagged `5-Year` — so group by size and `security_type`, and use `inflation_index_security` for TIPS (D-5's finding, re-confirmed). **Volatility:** **VIX 15.73** pre-open 09-08 (Cboe global-hours session via the Yahoo feed, meta stamp 11:40Z) against **14.53** on 09-04 — **+1.20**, inside the 3-point threshold. Same artifact the 10Y ledger flagged: the feed shows a **15.30** bar dated **09-07**, a full closure; **flagged and not adopted**. **Macro / geopolitical — inherited from sibling ledgers, labelled secondary, and none of it reaches this event.** 10Y quoted **4.81** on 09-08 (above the entire 2026 par range, whose max is **4.79** — a fresh high if it settles); CME September hike odds **58.7%** on 09-07 vs 52.6% on 09-04, moved with no Fed voice legal since blackout opened 09-05; Brent ~**$98.65** intraday on Houthi strikes at southern Saudi facilities. All three are demand-and-policy; this announcement publishes supply fixed on 2026-08-05. **Corridor:** **24** tracked entries within ±5 days, up from 19 at D-5 (new: `iea-omr-2026-09-11`, `labor-day-market-closure-2026-09-07` now canonical, `missouri-map-ballot-deadline-2026-09-08`, `opec-momr-2026-09-10`, `qss-q2-2026-09-09`). **Peers:** n/a, `symbols: []`. **`FT-treasury-coupon-announcement-2026-09-10-2` registered**, scoreable **2026-11-13**. **`FT-…-09-03-1` still untouched** — it scores 09-11 with its own ledger. **All sources returned HTTP 200; nothing blocked this session.** | **Near horizons unchanged; the quarter horizon is corrected.** Still a scheduled nil — expect 20Y **$13B** and 10Y TIPS **$19B** on 09-10, now with a second, stronger support: the 2026 grid did not move once across 67 auctions and an 82bp yield range, and `sb0590` says why. The **quarter call is replaced**: the deductive channel does not expire on 11-12, it re-publishes on **11-04**, with no unpublished gap anywhere in the cycle. One new forward test registered on that mechanism | 2026-09-10 (medium, 0–7d band: every 2d — the event's own morning) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed to `market-events.ts` as an `estimate` in the same PR. Close-out fills `## Outcome` below
from re-run instrument data (cache busted first), never from memory.
