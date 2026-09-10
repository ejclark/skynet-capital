# Treasury coupon announcement (20Y reopening + 10Y TIPS reopening sizes) — treasury-coupon-announcement-2026-09-10

**Kind:** rates · **Date:** 2026-09-10 (**confirmed** as of 2026-09-10, TSY: the announcement fired — Treasury's own announcement documents `treasurydirect.gov/xml/A_20260910_4.xml` and `A_20260910_1.xml` carry `AnnouncementDate 2026-09-10` with `OfferingAmount 13.000` and `19.000`; corroborated by `TA_WS/securities/upcoming` and fiscaldata `auctions_query`. Was `estimate` through D-2 on a forward schedule entry) · **Impact:** medium
**Last assessed:** 2026-09-10
<!-- probe-ref: {"symbols":{},"vix":17.84,"daysBand":"medium:0+","adjacentIds":["aapl-iphone-18-launch-2026-09-09","buyback-blackout-start-2026-09-12","canada-counter-tariffs-effective-2026-09-08","cpi-2026-09-11","ecb-decision-2026-09-10","eia-steo-2026-09-09","empire-state-mfg-2026-09-15","existing-home-sales-2026-09-10","fomc-blackout-start-2026-09-05","g20-energy-abundance-ministerial-houston-2026-09-14","gastech-2026-09-14","iea-omr-2026-09-11","jgb-20y-auction-2026-09-15","jgb-liquidity-enhancement-1-5y-2026-09-10","labor-day-market-closure-2026-09-07","missouri-map-ballot-deadline-2026-09-08","mts-august-2026-09-11","opec-momr-2026-09-10","opec-plus-meeting-2026-09-06","ppi-2026-09-10","qss-q2-2026-09-09","sp-global-investment-manager-index-2026-09-15","sp-rebalance-proforma-capped-2026-09-11","treasury-10y-note-2026-09-09","treasury-20y-bond-2026-09-15","treasury-30y-bond-2026-09-10","treasury-3y-note-2026-09-08","treasury-buyback-10y20y-2026-09-10","treasury-buyback-cash-mgmt-2026-09-09","treasury-buyback-increase-2026-09-09","treasury-buyback-tips-10y30y-2026-09-15","uk-labour-market-2026-09-15","umich-sentiment-prelim-2026-09-11"],"screenStreak":0,"blocked":[{"url":"https://www.bls.gov/news.release/ppi.nr0.htm","status":"403","at":"2026-09-10"}]} -->

## At a glance

**TL;DR.** **It happened, and it printed on the number.** At **11:01 ET on 2026-09-10** Treasury
announced the 20-Year reopening at **$13B** (CUSIP 912810UX4, auction 09-15) and the 10-Year TIPS
reopening at **$19B** (91282CRE3, auction 09-17) — the two figures this ledger has quoted since
2026-09-05 out of `sb0590`, the 2026-08-05 refunding statement, verbatim and 36 days early. Read
today from the official announcement XMLs themselves (`OfferingAmount 13.000` and `19.000`), not
from a feed. **What makes the print worth more than a box-tick:** it landed two hours into the
**largest rates session of the corridor** — the 10-Year rose 12bp to **4.95%**, a fresh 2026 high,
on a hot PPI — and the sizes did not move. This ledger's "the grid does not respond to the tape"
leg was a measurement across 67 past auctions; today it was tested live and held. The date flips
`estimate` → **`confirmed`** with this pulse — it is observed history now, sourced to the issuing
agency's own document, not a schedule entry. Nothing here is a trade, and the stance for every
successor announcement is unchanged. **What is still open:** supply for 09-15 and 09-17 is now
settled twice over, so both are pure **demand** tests, and the honest new number for them is that
today's 30-Year reopening took the corridor's largest supply at the **highest yield (5.308%) and
the strongest cover (2.61)** of the observed window — demand showed up at the price. **This is the
pulse, not the close-out:** `## Outcome` is deliberately unwritten and the scanner will surface
this event as `event-passed-unscored` for the session that scores it.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-10, D-0, post-print) | **Stand aside — the call resolved as written; there is nothing left to do on the announcement** | High | Both sizes printed exactly as quoted, sourced from the announcement XMLs and corroborated by two further Treasury endpoints. `symbols: []`, no macro-keyed house playbook, and the announcement's own tape effect is unmeasurable in a session carrying PPI, a 30Y auction, a buyback and an ECB decision. | Treasury **revising** either announced size before the 09-15 / 09-17 auctions — a post-announcement revision this series has never made in the observed window |
| This week | **Read 09-15 as a demand test and 09-17 as a real-yield test; no new unhedged duration through the stack** | Medium | Supply is settled in writing *and* in the announcement, so what remains is appetite into a fresh 2026-high yield. Today answered part of it: the 30Y reopening cleared at **5.308%** with cover **2.61** — the best cover of the window at its highest yield. The TIPS leg is the less friendly half: of today's 12bp nominal move, ~9bp was **real** (10Y real 2.46 → **2.55**). | The **2026-09-15** 20Y reopening covering below **2.63** — the floor of every 20Y reopening since 2025-01 (13 of 13). Registered as [`FT-…-09-10-3`](../forward-tests/treasury-coupon-announcement-2026-09-10.md), scores **2026-09-16** |
| This month | **Watch the 2026-10-15 announcement, not the auctions** | Medium | `sb0590`'s Oct-26 table row already reads 20-Year **13**, so 10-15 is the **last** announcement current guidance covers — the out-of-sample point where deduction stops and forecasting starts. The 09-15/09-17 sales carry no issuance question left to resolve. | The **2026-10-15** announcement publishing the 20Y reopening at other than **$13B** — [`FT-…-09-10-1`](../forward-tests/treasury-coupon-announcement-2026-09-10.md), scores **2026-10-16** |
| This quarter | **The channel has no expiry — it re-publishes on 2026-11-04, and 2026-11-02 is the earliest tell** | Medium | The Tentative Auction Schedule, re-parsed today, runs to **Feb-2027** and dates the next coupon announcement **2026-11-12** (20Y **new issue** + 10Y TIPS reopening). The **11-04 refunding lands eight days first** and publishes the Nov/Dec/Jan table exactly as `sb0590` did on 08-05; `sb0590` covers every announcement through **10-22**, so there is **no unpublished gap**. Sharpened today: [`treasury-borrowing-estimates-2026-11-02`](treasury-borrowing-estimates-2026-11-02.md) publishes the quarter's financing need **two days before** the statement, so it is the first dated read on whether the grid is under pressure. | The **2026-11-04** refunding publishing **no forward anticipated-size table**, or dropping *"for at least the next several quarters"* — then 11-12 genuinely goes dark. Registered as [`FT-…-09-10-2`](../forward-tests/treasury-coupon-announcement-2026-09-10.md), scores **2026-11-13**; [`FT-39`](../forward-tests.md) owns the guidance-language leg |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, and no house playbook
  (S1/S2/E1/S3/S4 + G1) is macro-keyed. The date is now `confirmed`, which changes the label and
  nothing else — a passed announcement of published numbers keys no action either way.
- **The two numbers are no longer a prediction — they are announced.** 20Y reopening **$13B**, 10Y
  TIPS reopening **$19B**, from Treasury's own announcement XMLs (`OfferingAmount 13.000` and
  `19.000`, fetched 2026-09-10), matching `sb0590`'s Sep-26 table row and TIPS FINANCING sentence.
- **The remaining live kill switch is a *revision*, not a print** — either auction clearing at a size
  other than the announced one on **09-15** / **09-17**. Never observed in this series.
- **The grid does not respond to the tape — now tested live, not only measured.** The 2026 record was
  **67 of 67** nominal coupon and FRN auctions on one of eight fixed sizes, zero deviations. Today
  added the hard case: the announcement printed on the grid **two hours into a 12bp 10Y selloff to a
  fresh 2026 high of 4.95%**. `sb0590` names the absorber — bills and CMBs, not coupons — and 2026
  has run exactly **one** CMB. The 2026 10Y par range is now **3.97 → 4.95** (98bp).
- **New, and it is what 09-15 should be judged against:** 20Y **reopenings and new issues do not
  overlap on cover**. Every 20Y reopening since 2025-01 covered **2.63–2.86** (n=13, avg 2.728);
  every 20Y new issue covered **2.36–2.55** (n=7, avg 2.469) — **20 of 20 separate cleanly**, across
  a 4.51–5.20 high-yield range. 09-15 is a reopening, so its floor is **2.63**, not the new-issue
  average. Registered as `FT-…-09-10-3`.
- **The ~11:00 ET slot is sourced now, and the method is reusable.** This ledger flagged it as
  unsourced convention at D-5 and D-2. treasurydirect's `updatedTimestamp` is **ET**: the 3Y, 10Y and
  30Y auction-result rows stamp **13:03:18 / 13:03:22 / 13:03:28** on their own auction days against a
  `CompetitiveClosingTime` of **13:00** published in the announcement document. Today's announcement
  rows stamp **11:01:20** and **11:01:29**.
- **Correction to a live sibling, now doubly settled:** the 20Y auction ledger's *"size … still
  do[es] not exist"* line was wrong on 09-05 and is unarguable today. Only the **when-issued yield**
  was ever genuinely unavailable.
- **Checked and NOT a finding:** the 20Y par yield sits **2bp above** the 30Y (5.39 vs 5.37, 09-10).
  Measured across the 2026 par file the 20Y has been at or above the 30Y in **79 of 174** sessions.
  Routine; it carries nothing.
- **Watch (dated):** FOMC blackout live **09-05→09-17** · **20Y reopening 09-15** (demand test,
  supply settled) · **FOMC 09-16** · 10Y TIPS reopening **09-17** and the 09-17 coupon announcement
  (2Y/5Y/7Y/FRN) · next 20Y announcement **10-15** — the last one `sb0590` covers · **10-22** (also
  `sb0590`) · borrowing estimates **11-02** (earliest tell on the grid) · refunding **11-04** (the
  table can change) · **11-12** announcement — 20Y **new issue** + 10Y TIPS reopening, read off the
  11-04 table.

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

**Amendment, 2026-09-10 (D-0, post-print) — the event fired and the stance resolved as written; what
is left is demand, and it gets its own registered number.** At **11:01 ET** Treasury announced the
20Y reopening at **$13B** and the 10Y TIPS reopening at **$19B**, read from the announcement XMLs
themselves. Three things this changes in the stance, none of them the direction of it:

1. **The near-horizon prediction is no longer a prediction.** Kill switch 1 did not fire. The stance
   stays a scheduled nil for every successor announcement while `sb0590`'s guidance stands, and the
   only kill switch still live on *this* event is a post-announcement **revision** at 09-15 / 09-17.
2. **"The grid ignores the tape" graduated from a base rate to a live test.** The print landed two
   hours into the largest rates session of the corridor — 10Y **+12bp to 4.95%**, a fresh 2026 high,
   on a **+0.40% m/m** PPI headline — and neither size moved. That is a materially stronger form of
   the same claim than 67 historical auctions across a quiet range, and it is the leg a rates selloff
   was always most likely to break.
3. **The "09-15 is a demand test" framing now carries a falsifiable number.** New this session, from
   fiscaldata: every 20Y **reopening** since 2025-01 covered **2.63–2.86** (n=13) and every 20Y **new
   issue** covered **2.36–2.55** (n=7) — 20 of 20 with zero overlap. So the honest floor for 09-15 is
   **2.63**, and today's 30Y reopening (**5.308%** high yield, cover **2.61**, the best of its own
   window at its highest yield) says a rising yield has not been suppressing cover in this corridor.
   Registered as `FT-treasury-coupon-announcement-2026-09-10-3`, scoreable **2026-09-16**. It is a
   measurement of auction demand, never a rate view or a price template — `symbols: []` still holds.

**The calendar entry's status flips `estimate` → `confirmed`, and the reasoning is on the record
rather than implied.** Every prior row filed this event `estimate` because its date rested on a
*forward* schedule entry, and the D-5 leg worded that as "this lane may not self-confirm." That
limit was about predicting a date. It no longer applies to a date that has passed and been
documented by the issuing agency: `treasurydirect.gov/xml/A_20260910_4.xml` and `A_20260910_1.xml`
are Treasury's own announcement documents for these two CUSIPs, and `TSY:` is precisely the
taxonomy's confirmed prefix for treasury.gov / treasurydirect.gov (`market-events-data.ts`). Keeping
`estimate` on an observed event would misstate the calendar's own audit trail in the *cautious*
direction, which is still a misstatement. The flip narrows nothing that could key an action —
`symbols: []`, the event has passed, and its stance is a scheduled nil.

**One honest limit closed and one method banked.** The ledger disclosed at D-5 and D-2 that the
**~11:00 ET** announcement slot was Treasury convention and *not* separately sourced. It is sourced
now: treasurydirect's `updatedTimestamp` is ET — the 3Y, 10Y and 30Y auction-result rows stamp
**13:03:18 / 13:03:22 / 13:03:28** on their own auction days against the `CompetitiveClosingTime` of
**13:00** published inside the announcement document — so today's **11:01:20** and **11:01:29**
announcement stamps are a real reading, not a convention. Any future rates ledger can time a Treasury
announcement or auction result this way without a press release.

**This is the `interval-elapsed` pulse, not the close-out.** `## Outcome` is deliberately not
written, and [`FT-treasury-coupon-announcement-2026-09-03-1`](treasury-coupon-announcement-2026-09-03.md)
— which owns the prediction of today's two numbers and scores **2026-09-11** — is left untouched, as
it has been at every pulse. The scanner will surface this event as `event-passed-unscored`, and that
session scores it from re-run data.

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
| 2026-09-10 | D-0 | Pulse run **after the close (~18:45 ET)**, so the announcement, the PPI print, the 30Y auction and the full cash session are all inside this row. **THE EVENT FIRED AND PRINTED ON THE NUMBER.** Read from Treasury's own announcement documents, not a feed: `treasurydirect.gov/xml/A_20260910_4.xml` (HTTP 200) carries `CUSIP 912810UX4 · OfferingAmount **13.000** · SecurityType BOND · InterestRate 5.125 · MaturityDate 2046-08-15 · AuctionDate 2026-09-15 · IssueDate 2026-09-18 · ReOpeningIndicator Y`, and `A_20260910_1.xml` (HTTP 200) carries `CUSIP 91282CRE3 · OfferingAmount **19.000** · InterestRate 2.375 · MaturityDate 2036-07-15 · AuctionDate 2026-09-17 · IssueDate 2026-09-30 · InflationIndexSecurity Y`. **Corroborated on two further Treasury endpoints:** `TA_WS/securities/upcoming` (HTTP 200) now shows `offeringAmount` **13000000000** / **19000000000** where it was empty at D-2, and fiscaldata `auctions_query` carries both rows with `announcemt_date 2026-09-10` and the same amounts. **Kill switch 1 did not fire.** These are the figures this ledger has quoted from `sb0590` since 2026-09-05, 36 days early. **Calendar entry amended in this PR: `status` flips `estimate` → `confirmed`, prefix `EST:` → `TSY:`.** Every prior row filed it `estimate` because the date rested on a *forward* schedule entry and D-5 worded that as "this lane may not self-confirm" — a limit about predicting a date, not about one that has passed and been documented by the issuing agency. `TSY:` is the taxonomy's confirmed prefix for treasury.gov / treasurydirect.gov (`market-events-data.ts`), and the lane's hard limit forbids flipping *without* a primary source, which is not this case. Nothing keys off it: `symbols: []`, the event has passed, the stance is a scheduled nil. **The strongest live test the "grid ignores the tape" leg could have received — and it passed.** Treasury par curve, 09-09 → **09-10**: 2Y 4.43 → **4.56** (+13bp) · 10Y 4.83 → **4.95** (+12bp) · 20Y 5.28 → **5.39** (+11bp) · 30Y 5.28 → **5.37** (+9bp). **10Y 4.95 is a fresh 2026 high**, 12bp above yesterday's prior high; the 2026 par range widens from D-2's `3.97 → 4.79` to **3.97 → 4.95** (98bp), and today's +12bp is the **joint-second-largest 1-day 10Y move of 2026** (largest 0.14, 03-20). The announcement went out at 11:01 ET, two hours into that, on the published grid. D-2's 67-of-67 measurement is now an out-of-sample observation as well as a base rate. **Driver, primary-sourced and secondary to this event:** PPI final demand (BLS API `WPSFD4`) Aug-26 **157.411** vs Jul 156.784 = **+0.40% m/m**, **+5.41% y/y** — the hottest m/m since May; core ex food & energy (`WPSFD49104`) **+0.16% / +4.62%**; ex food, energy & trade (`WPSFD49116`) **+0.27% / +4.66%**. Belongs to [`ppi-2026-09-10`](ppi-2026-09-10.md); recorded here only as the session's cause. **CPI 08:30 tomorrow.** **The 30Y reopening cleared — highest yield AND strongest cover of its observed window.** fiscaldata: 912810UW6, $22B, **high yield 5.3080%**, **bid-to-cover 2.61**. Against all seven 30Y reopenings back to 2025-01, prior high yield was **5.058** (2026-07-09) and prior best cover **2.52** (2025-01-08). The long end took the corridor's largest supply 25bp cheaper than anything in the window and got its best cover. **NEW FINDING, and it puts a number on this doc's own "09-15 is a demand test" call:** 20Y reopenings and new issues **do not overlap on cover**. All 20Y auctions 2025-01-01 → today (fiscaldata, n=20 scored): **13 reopenings 2.63–2.86, avg 2.728** (last six avg 2.727); **7 new issues 2.36–2.55, avg 2.469** — **zero overlap, 20 of 20**, across a 4.51–5.20 high-yield range. 09-15 is a reopening, so its floor is **2.63**, not the new-issue average — a sharper bar than "watch the auction". **`FT-treasury-coupon-announcement-2026-09-10-3` registered**, scoreable **2026-09-16**. **HONEST LIMIT CLOSED — the ~11:00 ET slot is sourced now.** D-5 and D-2 both disclosed it as unsourced convention. The announcement XMLs publish `CompetitiveClosingTime 13:00`, and `TA_WS/securities/announced` stamps the 3Y, 10Y and 30Y **auction-result** rows at **13:03:18 / 13:03:22 / 13:03:28** on their own auction days — a 13:03 stamp against a published 13:00 ET close can only be ET, so the feed's `updatedTimestamp` is ET and today's **11:01:20** (20Y) / **11:01:29** (TIPS) are real readings. Reusable by any rates ledger. **TIPS demand backdrop — the less friendly decomposition.** Real curve 09-09 → 09-10: 10Y real 2.46 → **2.55** (+9bp), 20Y real 2.79 → **2.87**; curve-derived 10Y breakeven ~**2.40%** vs ~2.35% at D-2, so **~9bp of the 12bp nominal move was real**. A real-yield-led selloff into a 09-17 TIPS reopening is the harder of the two, and it is stated rather than glossed. Settlement mechanic, not an inflation read: the TIPS XML carries `IndexRatioOnIssueDate` **0.99985** and `RefCPIIssueDate` **333.91913**, so the $19B par reopening settles at ~**$18.997B** adjusted principal. **Kill switches 3 and 4 checked and clear:** home.treasury.gov's press index (HTTP 200) has published **ten** releases since 09-04 — sb0617–sb0626, all sanctions, health-care fraud, a G20 chair's statement, a BoJ readout, TIC portfolio holdings and a tax-exempt action — **nothing issuance-related**; no CMB, no coupon-size change, no schedule move. **VIX 17.84** (09-10 close, Yahoo `^VIX`, meta stamp 20:15Z) vs **15.73** at the last probe-ref — **+2.11**, inside the 3-point threshold, though **+3.52 off 09-03's 14.32** would have crossed on a weekly reference. **Adjacency sweep — nothing new to propose, and the null is earned.** **Corridor: 34** tracked entries within ±5 days, up from 24 at D-2 (new, all filed by sibling lanes: `canada-counter-tariffs-effective-2026-09-08`, `empire-state-mfg-2026-09-15`, `existing-home-sales-2026-09-10`, `jgb-20y-auction-2026-09-15`, `jgb-liquidity-enhancement-1-5y-2026-09-10`, `sp-global-investment-manager-index-2026-09-15`, `treasury-buyback-cash-mgmt-2026-09-09`, `treasury-buyback-tips-10y30y-2026-09-15`, `uk-labour-market-2026-09-15`). The Tentative Auction Schedule was re-fetched and re-parsed (HTTP 200, 17,195 bytes, still to Feb-2027): **all 14 coupon-announcement dates it carries, 09-03 through 2027-01-21, are already canonical `<id>.json` files** — D-2 declined to batch-file eight of them and siblings have since filed every one. Both quarter-horizon anchors are tracked (`treasury-borrowing-estimates-2026-11-02`, `treasury-refunding-2026-11-04`), as is every buyback operation through 11-05. **So no proposal file is written this pulse** — the sweep found no dated event this calendar does not already carry. **Peers:** n/a, `symbols: []`. **Sharpening carried up to the header:** 11-02's borrowing estimates land two days before the 11-04 refunding and are the earliest dated read on whether the grid is under pressure. **Checked and still not a finding:** 20Y 2bp above the 30Y — true in **79 of 174** 2026 sessions. **Blocked:** `bls.gov/news.release/ppi.nr0.htm` returned **403**; substituted the same agency's own `api.bls.gov/publicAPI/v2` (HTTP 200), so no source downgrade — recorded in the probe-ref. Two exploratory fetches also failed and carry no cited claim (`Buyback-Schedule.pdf` 404, `annceresult.htm` 302). **`FT-…-09-03-1` untouched** — it scores 09-11 with its own ledger. **`## Outcome` deliberately unwritten:** this is the pulse, not the close-out. | **The near-horizon stance resolved as written and is now history — $13B and $19B are announced, not predicted.** The forward stance is unchanged: a scheduled nil for every successor while `sb0590`'s guidance stands. Two upgrades: "the grid ignores the tape" is now a **live** test rather than a base rate, and "09-15 is a demand test" now carries a **falsifiable cover floor of 2.63**. One honest limit closed — the ~11:00 ET slot is sourced. One new forward test registered | 2026-09-11 — but as `event-passed-unscored`: the next session is the **close-out**, which fills `## Outcome` and scores `FT-…-09-03-1`'s sibling observation from re-run data |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed to `market-events.ts` as an `estimate` in the same PR. Close-out fills `## Outcome` below
from re-run instrument data (cache busted first), never from memory.
