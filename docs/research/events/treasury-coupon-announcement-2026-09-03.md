# Treasury September coupon-block announcement (3Y / 10Y / 30Y sizes) — treasury-coupon-announcement-2026-09-03

**Kind:** rates · **Date:** 2026-09-03 (estimate, EST: date now primary-verified twice — treasurydirect.gov's `TA_WS/securities/announced` feed carries `announcementDate 2026-09-03` for all three coupons and fiscaldata's `upcoming_auctions` carries the same `announcemt_date`, both fetched 2026-09-04; stays `estimate` only because this lane may not self-confirm) · **Impact:** medium
**Last assessed:** 2026-09-04
<!-- probe-ref: {"symbols":{},"vix":14.07,"daysBand":"medium:0+","adjacentIds":["adp-employment-2026-09-02","beige-book-2026-09-02","challenger-job-cuts-2026-09-03","fed-waller-outlook-2026-09-03","fomc-blackout-start-2026-09-05","ism-manufacturing-2026-09-01","ism-services-2026-09-03","jobs-2026-09-04","jolts-2026-09-01","hammack-remarks-2026-09-03","opec-plus-meeting-2026-09-06","sp-rebalance-proforma-2026-09-04","treasury-3y-note-2026-09-08","vmware-explore-2026-08-31","waller-economic-outlook-2026-09-03"],"screenStreak":0} -->

## At a glance

**TL;DR.** **The announcement happened, and it was a non-event by construction — which is the finding.**
At ~11:00 ET on 2026-09-03 Treasury published the September coupon block at **3Y $58B · 10Y reopening
$39B · 30Y reopening $22B** (both Treasury primaries, re-fetched 2026-09-04). Every one of those is
*exactly* the run-rate, and the run-rate was already in writing: the 2026-08-05 refunding statement
committed to "maintaining nominal coupon and FRN auction sizes for at least the next several quarters."
**The one thing this doc corrects is a sibling's falsifier.** The [`10Y ledger`](treasury-10y-note-2026-09-09.md)
has framed 09-09 as "a size above the **$42B** run-rate turns a demand test into a supply test" — but
$42B is the **new-issue** size and 09-09 is a **reopening**, whose run-rate is **$39B** and has been for
every 2026 reopening. The falsifier was comparing two different securities; at $39B nothing moved, so
**09-08→09-10 is a pure demand test with the supply leg removed.** The tape agrees: the long end
*rallied* 2bp on announcement day rather than conceding, and the day's front-end-led move (2Y −5bp) is
press-attributed to Waller turning dovish at 08:30, not to the sizes. Then payrolls **+162K vs ~53K**
today reversed it (2Y +8bp to 4.416%, a Jan-2025 high; hike odds ~52%). Date is `estimate`; nothing
here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-04) | Stand aside | High | The event is behind us and printed at guidance; `symbols: []`. Today's actual mover is payrolls **+162K vs ~53K** — a policy shock, not a supply one. | Treasury announcing an off-cycle size change or a CMB before **2026-09-08** — the "sizes are settled" claim dies the moment issuance moves off schedule |
| This week | Read **09-08 / 09-09 / 09-10** as a **pure demand test** — the supply leg is published and unchanged | High | The numbers are no longer forecast, they are announced: $58B / $39B / $22B, two Treasury primaries. A soft print cannot be blamed on supply. | Any of the three auctions on **2026-09-08/09/10** clearing at a size other than $58B / $39B / $22B — a post-announcement revision has no precedent in this series |
| This month | No new unhedged duration through the **09-08→09-11** stack into the 09-16 FOMC; read the block as policy-path information | Medium | Four dated risks in four sessions (3Y · 10Y · 30Y+PPI · CPI) into a two-sided FOMC, and the policy leg round-tripped inside 24 hours (Waller dovish 09-03 → payrolls hawkish 09-04). | The **2026-09-10** announcement moving the 20Y reopening off **$13B** — supply becomes a live variable again and this doc's determinism read breaks (this is `FT-treasury-coupon-announcement-2026-09-03-1`) |
| This quarter | Treat announcement days as scheduled nil; the date carrying issuance information is **2026-11-04** | Medium | An announcement can only restate the refunding statement's grid while the guidance holds. The refunding is where the grid itself can change. | A Treasury statement **before 2026-11-04** pre-announcing a coupon-size change or dropping "at least the next several quarters" — the channel [`FT-39`](../forward-tests.md) already tests |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an auction or an announcement.** `symbols: []`, no house playbook
  (S1/S2/E1/S3/S4 + G1) is macro-keyed, and the date is `estimate`.
- **The reopening grid, primary-sourced — use these, not the new-issue numbers:** 10Y reopening
  **$39B** (6/6 in 2026), 30Y reopening **$22B** (5/5), 20Y reopening **$13B** (7/7 since Oct-2025),
  10Y TIPS reopening **$19B** (3/3). New-issue months (Feb/May/Aug/Nov) run $42B / $25B / $16B / $21B.
- **A size printing off that grid is the signal**, in either direction — it means Treasury broke
  month-old published guidance, and every "supply is settled" line in this calendar's rates ledgers
  needs re-deriving rather than patching.
- **`FT-20` is NOT void.** Its void condition was the 09-03 announcement moving the 3Y off $58B; it
  did not. The 3Y bid-to-cover test stays live and scoreable **2026-09-08** by its own ledger.
- **The policy leg is what moves these auctions now, and it is genuinely two-sided** — Waller said
  09-03 he is "inclined to support holding," payrolls printed +162K on 09-04, hike odds ~52%. The
  **09-05 blackout** means no Fed voice can adjudicate that before the block clears.
- **Watch (dated):** FOMC blackout **09-05** · OPEC+ **09-06** · 3Y **09-08** · 10Y reopening
  **09-09** · 30Y reopening + PPI + buyback **09-10** · **the next coupon announcement 09-10**
  (20Y + 10Y TIPS sizes) · CPI **09-11** · 20Y **09-15** · **FOMC 09-16** · refunding **11-04**.

## Initial research

<!-- This event passed (2026-09-03) before any assessment ran, so the scanner reached this session as
     `event-passed-unscored` with no ledger file at all. Initial research and the close-out are
     therefore written together, from the same primary re-fetch, and the distinction is kept honest:
     everything below is retrospective, and nothing in it is presented as having been predicted. -->

### The question, plainly

The September coupon-block announcement is the moment the 3Y/10Y/30Y auction sizes stop being unknown.
The [`10Y ledger`](treasury-10y-note-2026-09-09.md) had flagged a missing size in every row since
2026-08-19, and this event was created (in that ledger's 2026-09-02 adjacency sweep) to give the gap a
date. So: **what did Treasury actually announce, was it a surprise, and what does the answer change
about how the 09-08→09-10 block should be read?**

**One-line verdict:** all three sizes printed at their existing run-rates, exactly as the 2026-08-05
refunding statement guided — so the announcement carried **no information**, and its whole value is
that it removes the supply leg from the auction block and exposes a **unit error** in a sibling
ledger's falsifier, which compared a reopening against a new issue's size.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols: []`, so no
symbol-keyed instrument applies; `earnings-cycle.mjs` / `intraday-edges.mjs` have no target here and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). Everything
quantitative below is **primary and re-fetched this session (2026-09-04)**, never from memory:

- **The announcement itself** — treasurydirect.gov `TA_WS/securities/announced` (returns
  `announcementDate` per security) and `api.fiscaldata.treasury.gov` `upcoming_auctions`. Two
  independent Treasury endpoints, agreeing on CUSIP, size, announcement date and auction date.
- **The size base rates** — fiscaldata `auctions_query`, all Note/Bond auctions with
  `auction_date >= 2025-09-01`, reading `original_security_term`, `reopening` and `offering_amt`.
- **The market reaction** — Treasury's own daily par yield curve CSV (2026 full-year file), which
  publishes same-day and therefore carries **2026-09-03**; the Fed's H.15 only ran through 09-02 when
  this session fetched it, so the par curve is the primary here and H.15 is the cross-check.
- **Volatility** — Yahoo `^VIX` daily closes, the same series the repo's own probe reads.
- **Narrative attribution** (Waller, ISM Services, payrolls reaction, hike odds) is **press-sourced
  and labelled as such** in every line that uses it.

### Conviction legs, tested

1. **The announcement landed on 2026-09-03 and published all three sizes — SUPPORTED, two primaries.**
   treasurydirect's `announced` feed returns, dated `2026-09-03`: 3-Year **91282CRL7 $58,000,000,000**
   (auction 09-08), 9-Year 11-Month reopening **91282CRF0 $39,000,000,000** (auction 09-09), 29-Year
   11-Month reopening **912810UW6 $22,000,000,000** (auction 09-10) — plus the 6/13/26-week bills.
   fiscaldata's `upcoming_auctions` returns the identical three rows with `announcemt_date 2026-09-03`
   and the same offering amounts, where on 09-01 and 09-03 the sibling ledgers recorded
   `offering_amt: null`. The `estimate` date was right and the event fired on it. Status stays
   `estimate` regardless — **this lane may not self-confirm**, and the ~11:00 ET *time* remains
   convention rather than sourced, exactly as the calendar entry disclosed.

2. **Every size is the run-rate — SUPPORTED, and this is why the event carried no information.**
   From `auctions_query`, nominal coupons since 2025-09-01, with the new-issue/reopening cycle made
   explicit (Feb/May/Aug/Nov are new issues; the other months reopen them):

   | Tenor | New issue | Reopening | 2026 reopenings observed |
   |---|---|---|---|
   | 3Y | **$58B** (new issue every month) | n/a | 01-12 … 08-11, all $58B (11 straight incl. 2025) |
   | 10Y | $42B (02-11, 05-12, 08-12) | **$39B** | 01-12 · 03-11 · 04-08 · 06-10 · 07-08 → **6/6** |
   | 30Y | $25B (02-12, 05-13, 08-13) | **$22B** | 01-13 · 03-12 · 04-09 · 06-11 · 07-09 → **5/5** |
   | 20Y | $16B (02-18, 05-20, 08-19) | **$13B** | 01-21 · 03-17 · 04-22 · 06-16 · 07-22 → **5/5** |

   The September announcement printed **$58B / $39B / $22B** — the run-rate on all three, with zero
   deviations anywhere in the table. This is not a lucky guess by Treasury; `sb0590` (2026-08-05)
   states verbatim that it "anticipates maintaining nominal coupon and FRN auction sizes for at least
   the next several quarters."

3. **The sibling 10Y ledger's falsifier compares two different securities — REFUTED, and it is the
   correction this doc exists to make.** That ledger (and this event's own calendar note) frames 09-09
   as: *"a size above the $42B run-rate would turn a demand test into a supply test, and a size at or
   below it removes the supply leg entirely."* But **$42B is the 2026-08-12 new issue**, and 09-09 is a
   **reopening of that same CUSIP** (`91282CRF0`). A reopening is never sized to its own new issue in
   this series — it is $39B, six times out of six in 2026. So the $42B bar was unfalsifiable in the
   hawkish direction (a $39B print "passes" trivially) and misleading in the dovish one (it reads
   $39B as a $3B *cut* when it is the unchanged number). **The correct bar was $39B, and $39B is what
   printed.** Same error shape in the 30Y comparison ($25B vs the $22B reopening rate).

4. **The tape shows no supply concession — SUPPORTED, with the causal claim deliberately kept weak.**
   Treasury's own par yield curve, 09-02 → **09-03**: 1Y 4.16 → **4.11** · 2Y 4.39 → **4.34** · 3Y
   4.45 → **4.41** · 5Y 4.54 → **4.52** · 7Y 4.66 → **4.63** · 10Y 4.79 → **4.77** · 20Y 5.27 →
   **5.25** · 30Y 5.27 → **5.25**. The whole curve *rallied*, led by the front end (−5bp at 2Y vs
   −2bp at 30Y) — the opposite shape a supply surprise produces, which would concede at the tenors
   being sold. **What this does NOT establish:** the announcement's own contribution. Five scheduled
   items shared that session (Challenger 07:30 · Waller 08:30 · ISM Services 10:00 · the announcement
   ~11:00 · Hammack 15:00), and the press attributes the move to **Waller**, who told Reuters NEXT
   that recent data "suggest we are finally seeing some signs of disinflation" and that he would be
   "inclined to support holding" — with September hike odds falling below a coin flip on it
   (Capital Street FX / CFO Dive, 09-03). ISM Services printed **55.4** (+1.3, above forecast) and did
   not stop the rally. **The defensible claim is the weaker one:** an at-guidance announcement carries
   no surprise, and the absence of any long-end concession is consistent with that and inconsistent
   with the "supply test" framing leg 3 refutes.

5. **The policy leg round-tripped within 24 hours — SUPPORTED, press-sourced, and it is what actually
   matters into 09-08.** Today (2026-09-04, 08:30 ET) August payrolls printed **+162K against a ~53K
   consensus**, unemployment **4.1%**, average hourly earnings **+0.3% to $37.75**, with June revised
   **+11K to +31K** and July **+44K to +21K** (UPI/CNBC, 09-04). Treasuries sold off, "led by an
   eight-basis-point climb in the two-year, which breached **4.416%**, the highest since January 2025,"
   and hike odds went to **~52%** (Bloomberg/TradingEconomics, 09-04). So the labor-cooling read that
   the [`3Y ledger`](treasury-3y-note-2026-09-08.md) built its D-5 row on (ADP +38K, JOLTS 7.27M,
   Beige Book "rose very slightly") was contradicted by the establishment survey two days later. The
   auction block now clears into a hawkish-repriced front end **inside the 09-05 blackout**, with no
   Fed speaker able to adjudicate. That is a policy story end to end; supply contributes nothing to it.

6. **The next announcement's sizes are already derivable — SUPPORTED, and it is the registrable
   prediction.** fiscaldata's `upcoming_auctions` already carries the following block, announced
   **2026-09-10** with `offering_amt: null`: 19-Year 11-Month reopening **912810UX4** (auction 09-15)
   and 9-Year 10-Month reopening **91282CRE3** (auction 09-17, a reopening of the 2026-07-23 10Y TIPS).
   By leg 2's grid those are **$13B** and **$19B**. If leg 2's determinism claim is right, that is a
   free, dated, falsifiable prediction — registered below. Honest asymmetry: the 20Y leg rests on
   7/7 observations, the TIPS leg on 3/3 and on a judgment call (see limits).

7. **No tracked name is exposed through this channel — SUPPORTED, inherited, not re-derived.**
   `symbols: []`. The duration channel that hit CRWV −12.1% and SOX −5% on 2026-08-18 was a *long-end
   yield* move; an announcement that changes no size cannot transmit anything. The live equity risk in
   this corridor is the hike probability (leg 5), which the auctions inform and the announcement does not.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event, and here
it is stronger than usual because the event's own content was nil. What the conditions support is a
**reading correction**, which is worth more than the event was: (a) the 09-08→09-10 block is a **pure
demand test**, and any softness in it is evidence about the *policy* leg (leg 5), never about fiscal
supply; (b) the reopening grid in leg 2 — $39B / $22B / $13B / $19B — replaces the new-issue numbers
wherever a rates ledger in this calendar reasons about "the run-rate"; and (c) announcement days should
be modelled as scheduled nil while the refunding guidance holds, with **2026-11-04** as the date that
actually carries issuance information ([`FT-39`](../forward-tests.md) already owns that test).

### Honest limits

**The event's own effect is not separable from its session**, and leg 4 says so rather than claiming an
announcement-window measurement it cannot make: no intraday series was fetched, four other scheduled
items shared 09-03, and the press names Waller as the driver. **No Treasury press release for this
announcement was located** — a web search returned only the August refunding (`sb0590`) and stale
aggregator pages, one of them asserting the September block at the *August* sizes. Two agreeing
Treasury APIs are stronger evidence than a press summary, but the missing citation is stated as
missing, not glossed. **The ~11:00 ET time is still unsourced convention.** **The TIPS base rate is the
weakest number here:** fiscaldata's dataset carries no TIPS flag — it types them `Note`/`Bond` with
`original_security_term` "10-Year" — so TIPS rows were identified by real-yield level (2.44% vs 4.68%
nominal on the same day) and CUSIP continuity, a judgment call, on n=3. **Method note for the next
session:** `upcoming_auctions` returns **2024-dated rows first** under its default sort — the exact
failure the 3Y ledger's D-10 row hit and attributed to the endpoint being stale; it is not stale,
it needs `sort=-record_date`. **All 2026 base rates sit inside one policy regime** (Fed on hold at
3.50–3.75%), so "sizes are deterministic" is a within-guidance claim, and leg 5 is precisely the
argument that the regime may be changing.

## Stance & kill switches

**Stance (date `estimate`, primary-verified twice; all sizes and yields primary-sourced from Treasury,
re-fetched 2026-09-04).** This event is **closed as a confirmed nil** and should be modelled that way
going forward: while the refunding statement's guidance holds, a coupon-block announcement can only
restate a grid that is already public, and its information content is zero. No position was opened,
closed or sized off it, and none should be off its successors. The doc's durable output is the leg-2
**reopening grid** and the leg-3 **correction** — the 09-09 10Y falsifier belongs at **$39B**, not
$42B, and at $39B the supply leg of the 09-08→09-10 block is removed rather than merely benign. The
live risk in this corridor is the policy leg, which round-tripped from dovish (Waller, 09-03) to
hawkish (payrolls +162K, 09-04) inside 24 hours and now clears inside the 09-05 blackout.

**`FT-20` status recorded, not scored.** Its void condition — "the ~09-03 announcement moves the size
off $58B" — **was not met**; the 3Y printed $58B. FT-20 therefore stays open and scoreable
**2026-09-08** by [`treasury-3y-note-2026-09-08`](treasury-3y-note-2026-09-08.md), which owns it. This
row is the receipt that the void check ran, nothing more.

**Forward test `FT-treasury-coupon-announcement-2026-09-03-1` registered** in
[`forward-tests.md`](../forward-tests.md), scoreable **2026-09-11**: the 2026-09-10 announcement
publishes the 20Y reopening at **$13B** and the 10Y TIPS reopening at **$19B**.

**Kill switches:**

- **Any of the 09-08 / 09-09 / 09-10 auctions clearing at a size other than $58B / $39B / $22B** — a
  post-announcement revision, which has no precedent in this series; the "sizes are settled in
  writing" reading dies immediately.
- **The 2026-09-10 announcement moving the 20Y off $13B or the 10Y TIPS off $19B** — leg 2's
  determinism claim breaks at the first out-of-sample test, and announcement days stop being nil.
  This is the registered forward test's own kill.
- **Treasury dropping or qualifying "at least the next several quarters"**, at the 2026-11-04
  refunding or in any statement before it — the whole "announcement = scheduled nil" frame is
  conditional on that sentence, and this is the channel `FT-39` measures at TLT −1.09% when it moved.
- **An off-cycle issuance action** (a CMB, or a coupon size changed between refundings) — supply
  becomes a live variable again for the first time in 2026.
- **The 09-08→09-10 block clearing soft anyway** — bid-to-cover at or below the 2026 lows with the
  supply leg demonstrably unchanged would mean *demand* is deteriorating on the policy repricing,
  which is FT-20's question at the 3Y and the 10Y ledger's at the belly; it would not resurrect the
  supply story this doc closes.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-04 | D+1 | **Initial research and close-out written together** — the event passed unassessed, so the scanner reached this session as `event-passed-unscored` with no ledger file; everything here is retrospective and labelled as such. **The announcement (two Treasury primaries, re-fetched today):** 3Y **91282CRL7 $58B** (09-08) · 10Y reopening **91282CRF0 $39B** (09-09) · 30Y reopening **912810UW6 $22B** (09-10), all `announcementDate 2026-09-03`. **All three at the run-rate** — 10Y reopenings ran $39B 6/6 in 2026, 30Y reopenings $22B 5/5, 3Y $58B every month — matching `sb0590`'s 08-05 guidance verbatim. **The correction (leg 3):** the 10Y ledger's "$42B run-rate" falsifier compares a **new issue** to a **reopening**; the right bar was $39B, so 09-08→09-10 is a **pure demand test**. **Tape (Treasury par curve, primary):** 09-02→09-03 the whole curve rallied, front-end-led — 2Y 4.39→**4.34**, 3Y 4.45→**4.41**, 10Y 4.79→**4.77**, 30Y 5.27→**5.25** — the opposite of a supply concession; causal credit withheld, since Waller's dovish 08:30 Reuters NEXT remarks ("inclined to support holding") are the press-named driver and ISM Services printed 55.4. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** today's payrolls **+162K vs ~53K**, u-rate 4.1%, AHE +0.3%, Jun/Jul revised +11K/+44K; 2Y **+8bp to 4.416%**, a Jan-2025 high, hike odds **~52%** — the policy leg round-tripped inside 24 hours and the block now clears inside the 09-05 blackout. **VIX:** 14.92 (08-31) · 16.34 (09-01) · **15.20** (09-02) · 14.32 (09-03) · **14.07** (09-04, intraday at 14:40 ET) — recorded because the 3Y ledger's D-5 row logged 17.17 as Yahoo's 09-02 close and treated the repo probe's 15.2 as a ~2-point discrepancy; Yahoo's own chart API returns **15.20** for 09-02 today, matching the probe. Noted, not edited — rows are append-only. **Geopolitical:** OPEC+ 09-06 and the Hormuz premium are the 3Y/10Y ledgers' to carry; no supply-side channel reaches an announcement that changed nothing. **Adjacency — nothing new to propose:** all 15 tracked entries in the 08-29→09-08 corridor were already on the calendar. **Declined deliberately:** a sibling `treasury-coupon-announcement-2026-09-10` entry — this close-out's own finding is that an at-guidance announcement is deterministic, so the useful output is the *predicted numbers* handed forward as a test, not another calendar row that is nil by construction. **Calendar defect flagged, not fixed:** `waller-economic-outlook-2026-09-03` and `fed-waller-outlook-2026-09-03` are the same Reuters NEXT interview registered twice by parallel sweeps — same date, same `estimate`/`medium`, two ledger files. **`FT-20` void condition checked and NOT met** ($58B held); it stays open, scoreable 09-08 by its own ledger. **`FT-treasury-coupon-announcement-2026-09-03-1` registered**, scoreable 09-11. | **Closed — stance set and final.** Modelled as a confirmed nil while refunding guidance holds; the durable output is the reopening grid and the $42B→$39B falsifier correction | — (closed out; the scanner goes quiet on this event) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed to `market-events.ts` as an `estimate` in the same PR.

## Outcome

**Scored 2026-09-04 (D+1, inside the 6-day close-out window) — the event fired on its `estimate` date
and carried no information. Verdict: a confirmed nil, with one real correction extracted from it.**

**What happened, from primary data re-fetched this session** (the mandated instrument-cache bust has
no target here — `symbols: []`, so neither `earnings-cycle.mjs` nor `intraday-edges.mjs` applies;
recorded rather than skipped silently). Treasury announced the September coupon block on
**2026-09-03**, per both `treasurydirect.gov/TA_WS/securities/announced` and fiscaldata's
`upcoming_auctions`:

| Security | CUSIP | Reopening | Size | Auction | Run-rate | Surprise |
|---|---|---|---|---|---|---|
| 3-Year Note | 91282CRL7 | No | **$58B** | 2026-09-08 | $58B (11 straight) | **none** |
| 10-Year Note | 91282CRF0 | Yes | **$39B** | 2026-09-09 | $39B (6/6 in 2026) | **none** |
| 30-Year Bond | 912810UW6 | Yes | **$22B** | 2026-09-10 | $22B (5/5 in 2026) | **none** |

**Against what a stance would have said.** There was no prior stance to score — the event passed
before its first assessment, which is itself the honest finding of record, and no prediction is
back-dated here. What *can* be scored is the framing this event was created to serve. The calendar
entry (written 2026-09-02) said a size *"above the $42B run-rate would turn a demand test into a
supply test."* **That test was mis-specified**, not merely unmet: $42B is the new-issue size and 09-09
is a reopening. The like-for-like bar was $39B and the print was $39B. Both readings agree the supply
leg is removed — but only by accident, and the reverse case would have gone badly wrong: a $39B print
read against a $42B bar looks like a **$3B cut** when it is the unchanged number.

**What the tape paid.** Nothing attributable. Treasury's own par curve rallied into the announcement
day (2Y −5bp, 10Y −2bp, 30Y −2bp) — the wrong sign for a supply event and the right sign for the
dovish Waller headline the press names. No intraday series was fetched, four other scheduled items
shared the session, and this close-out declines to claim an announcement-window measurement it did not
make. Within 24 hours the policy leg reversed entirely on **+162K** payrolls (2Y +8bp to 4.416%, hike
odds ~52%), which is a far larger move than anything the announcement could have produced and is the
right frame for the 09-08→09-10 block.

**Forward tests.** `FT-20`'s void condition (the 09-03 announcement moving the 3Y off $58B) was
checked against primary data and **not met** — it stays open, scoreable 2026-09-08, owned by the 3Y
ledger. One new test, `FT-treasury-coupon-announcement-2026-09-03-1`, is registered on this doc's own
determinism claim and scores 2026-09-11.

**What this event leaves behind, for the ledgers that outlive it.** The reopening grid — **10Y $39B ·
30Y $22B · 20Y $13B · 10Y TIPS $19B**, against new-issue months at $42B / $25B / $16B / $21B — and the
rule that generated it: while `sb0590`'s "at least the next several quarters" stands, a coupon-block
announcement is scheduled nil and the date carrying issuance information is the **2026-11-04**
refunding. This doc now goes quiet.
