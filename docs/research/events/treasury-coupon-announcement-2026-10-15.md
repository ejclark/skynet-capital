# Treasury coupon announcement (20Y reopening + 5Y TIPS new-issue sizes) — treasury-coupon-announcement-2026-10-15

**Kind:** rates · **Date:** 2026-10-15 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-05 — two rows announce that day, `20-Year BOND R` auction 10-21 settle 10-23 and `5-Year TIPS T` auction 10-22 settle 10-30; stays `estimate` because a tentative schedule is tentative and this lane may not self-confirm) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["beige-book-2026-10-14","cpi-2026-10-14","fomc-blackout-start-2026-10-17","g20-fmcbg-bangkok-2026-10-15","imf-world-bank-annual-meetings-2026-10-12","import-export-prices-2026-10-16","opex-2026-10-16","ppi-2026-10-15","retail-sales-2026-10-15","ssa-cola-2027-2026-10-14","treasury-buyback-10y20y-2026-10-15","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0} -->

## At a glance

**TL;DR.** **This announcement carries two securities, not the one the calendar named — and the
second one is the only interesting half.** Treasury's own Tentative Auction Schedule (fetched direct
2026-09-05) puts **two** rows on 2026-10-15: the **20-Year bond reopening** (auction 10-21) and a
**5-Year TIPS *new issue*** (auction 10-22). Both sizes are already published in `sb0590`
(2026-08-05) — 20Y **$13B**, 5Y TIPS **$26B** — so like its predecessor this is a document read, not
a forecast. But the two legs are **not** equally informative, and treating them alike would be the
error. The 20Y number merely continues a grid that has run **37 consecutive auctions without a
deviation**; document and base rate agree, so it tells you nothing. The 5Y TIPS number
**contradicts** its own base rate: that slot has risen **five years running** (2021 $19B → 2025
$26B), and `sb0590` guides it flat at **$26B**. This is the first place in the coupon complex where
the written guidance and the revealed run-rate disagree — which makes the TIPS leg the one worth
registering and the 20Y leg the one already spoken for. Date is `estimate`; nothing here is a trade,
and `symbols: []`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-05, D-40) | Stand aside | High | Saturday — no session; markets reopen Tuesday 09-08 after Labor Day. `symbols: []`, no house playbook is macro-keyed, and both of this event's numbers are already in writing. | Treasury publishing an off-cycle coupon-size change or a coupon CMB touching the 20Y or 5Y TIPS before **2026-10-15** — the "already in writing" claim dies the moment issuance moves off the published grid between refundings |
| This week | Stand aside; let the **2026-09-10** sibling announcement be this event's first free out-of-sample check | High | That announcement publishes 20Y **$13B** / 10Y TIPS **$19B** off the same `sb0590` table. It costs nothing and tests the same premise 35 days early. | Either 09-10 size printing off **$13B** or **$19B** — the deductive channel this whole doc rests on breaks a month before the event it was written for |
| This month | Watch one dated intermediate check — the **2026-10-01** announcement — and hold no position through it | Medium | The Oct-26 row also sizes the 3Y/10Y/30Y block announced 10-01: **58 / 39 / 22**. Those four numbers print two weeks before this event, off the same table row. | Any of **3Y $58B · 10Y $39B · 30Y $22B** printing off-grid on **2026-10-01** — the Oct-26 row would be wrong about its own month before this announcement ever reads it |
| This quarter | The channel's expiry stands at **2026-11-12**, and **do not** read 10-16 as an early warning | Medium | `sb0590`'s table stops at Oct-26. The 10-16 primary-dealer agenda looks like a leading indicator and this repo has measured that it is not — **confirming 1/1, early-warning 0/1** across 15 editions. | The **2026-10-16** agenda's Discussion Topics naming a nominal coupon-size **increase** — that would make [`FT-39`](../forward-tests.md) live 19 days before the 2026-11-04 statement, and refute the agenda's measured 0/1 early-warning record |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, date is `estimate`, no house playbook
  (S1/S2/E1/S3/S4 + G1) is macro-keyed.
- **The two numbers, primary-sourced and quotable today:** 20Y reopening **$13B** (`sb0590` Oct-26
  table row), 5-Year TIPS new issue **$26B** (`sb0590` TIPS FINANCING paragraph, verbatim).
- **The legs are asymmetric — size the attention accordingly.** 20Y: document agrees with a 37/37 base
  rate, near-zero information. 5Y TIPS: document *overrides* a five-year annual ratchet.
- **The TIPS ratchet, measured:** the October 5Y TIPS new issue has risen **five straight years** —
  2021 $19B · 2022 $21B · 2023 $22B · 2024 $24B · 2025 $26B. `sb0590` guides **flat**.
- **Second security correction:** this event's calendar title named only the 20Y. The schedule puts a
  **5-Year TIPS new issue** on the same announcement — fixed in `market-events.ts` in this PR.
- **Transcription correction to a sibling:** the Oct-26 row's FRN column reads **30**, not 28 — the
  09-10 ledger and this entry's own source string both carried `...22 28`. The 20Y **13** is unaffected.
- **Checked and NOT a finding:** the 5Y breakeven sits above the 10Y (2.37 vs 2.35, 09-04). Measured
  across 2026 that holds in **146 of 171** sessions. Routine; it carries nothing.
- **Stale primary, named:** the Tentative Buyback Schedule still shows **$2B** caps for 10-20Y/20-30Y
  operations after 09-09. `sb0607` (2026-08-19) raised them to **≥$4B** through 11-04.
- **Watch (dated):** coupon announcement **10-01** (3Y/10Y/30Y) · 3Y **10-06** · 10Y **10-07** · 30Y
  **10-08** · CPI **10-14** · **PPI + retail sales + 10-20Y buyback + this announcement 10-15** ·
  dealer agenda + opex **10-16** · FOMC blackout opens **10-17** · **20Y reopening 10-21** · **5Y TIPS
  new issue 10-22** · FOMC **10-28** · borrowing estimates **11-02** · refunding **11-04** · first
  unpublished announcement **11-12**.

## Initial research

### The question, plainly

This event was created by the [`09-10 coupon-announcement`](treasury-coupon-announcement-2026-09-10.md)
initial research (2026-09-05) as the **last** announcement whose sizes the current published guidance
covers, and as the dated home for the forward test that session registered. It arrives already
carrying an answer, which is the trap: if the whole doc is "the 20Y prints $13B, as already written,"
it duplicates a registered prediction and adds nothing. So the question this session actually asked
was narrower and more useful: **what does this announcement publish that nobody has looked at yet,
and is any of it a claim the base rates would not have made on their own?**

**One-line verdict:** it publishes **two** securities rather than the one the calendar named, and the
unexamined one — a **5-Year TIPS new issue**, guided flat at **$26B** against a five-year run of
annual increases — is the only leg where Treasury's written word and its revealed behaviour disagree,
which makes it the only leg worth registering.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). Everything
quantitative below was **fetched from a primary this session (2026-09-05)** and re-derived rather
than inherited from the sibling, including the numbers the sibling already published:

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl,
  HTTP 200, **17,195 bytes**, PDF streams inflated and the text layer reconstructed with per-glyph
  Td/Tm coordinates so rows could be read as rows (the naive string-literal dump loses the column
  alignment and silently detaches a security type from its dates).
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590` (2026-08-05 quarterly refunding
  statement), HTTP 200, 75,576 bytes, tag-stripped and read in full.
- **The one post-`sb0590` issuance action** — `home.treasury.gov/news/press-releases/sb0607`
  (2026-08-19), HTTP 200, read in full.
- **The buyback schedule** — `home.treasury.gov/system/files/221/Tentative-Buyback-Schedule.pdf`,
  HTTP 200, 125,547 bytes, parsed the same way.
- **The base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, three pulls: all
  `original_security_term: 20-Year` since 2023-01-01 (44 rows); all `inflation_index_security: Yes`
  since 2021-01-01 (68 rows); all 5-Year TIPS since 2014-01-01. The
  `inflation_index_security` field is used per the 09-10 sibling's method correction — no real-yield
  level-matching heuristic anywhere in this doc.
- **The tape** — Treasury's own daily par and daily **real** yield-curve CSVs (2026 full-year files)
  and Yahoo `^VIX` daily closes.
- **The upcoming feed** — treasurydirect `TA_WS/securities/upcoming`, HTTP 200, 43,843 bytes, to
  establish what is and is not yet announced.

### Conviction legs, tested

**1. The announcement carries TWO securities, and the calendar named only one — SUPPORTED, and this
is the finding.** The Tentative Auction Schedule's coordinate-reconstructed rows put exactly two
non-bill entries on this announcement date:

| Security | Announce | Auction | Settle | Reopening? |
|---|---|---|---|---|
| `20-Year BOND R` | Thursday, October 15, 2026 | Wednesday, October 21, 2026 | Friday, October 23, 2026 | **Yes** (Treasury's own `R` marker) |
| `5-Year TIPS T` | Thursday, October 15, 2026 | Thursday, October 22, 2026 | Friday, October 30, 2026 | **No** — `T` is the TIPS marker, and the row carries no `R` |

The calendar entry's title read *"(20Y reopening size)"*, so the 5-Year TIPS leg has been invisible to
every doc downstream of it. It is corrected in `market-events.ts` in this PR. Independent check on the
reopening/new-issue reading: `fiscaldata` shows the October 5-Year TIPS slot has been a **new issue**
in every year it has existed — 2019, 2020, 2021, 2022, 2023, 2024, 2025 — with the reopening landing
in December each time, so the missing `R` is the rule and not a typo. A cross-check worth recording:
a web-search summary of this same PDF reported the 20-Year auctioning **Thursday, October 22** — that
is the *TIPS* row's auction date, read off the wrong line. The primary was parsed rather than
paraphrased for exactly this reason.

**2. Both sizes are published in advance, by month and by security — SUPPORTED, and re-read verbatim
rather than inherited.** `sb0590`'s anticipated-size table, read in full this session across the
headers `2-Year · 3-Year · 5-Year · 7-Year · 10-Year · 20-Year · 30-Year · FRN`:

```
May-26  69 58 70 44 42 16 25 28
Jun-26  69 58 70 44 39 13 22 28
Jul-26  69 58 70 44 39 13 22 30
Aug-26  69 58 70 44 42 16 25 28
Sep-26  69 58 70 44 39 13 22 28
Oct-26  69 58 70 44 39 13 22 30
```

**Oct-26 20-Year = 13.** And its TIPS FINANCING paragraph, verbatim: *"Over the August to October 2026
quarter, Treasury plans to maintain TIPS auction sizes at current levels: the August 30-year TIPS
reopening auction size at $8 billion, the September 10-year TIPS reopening auction size at $19
billion, and the **October 5-year TIPS new issue auction size at $26 billion**."* Two of that
sentence's three commitments are already resolved or nearly so — the August 30Y TIPS leg **printed
$8B on 2026-08-20** (fiscaldata, this session), and the September leg is what the 09-10 announcement
publishes. This event owns the third and last.

**3. A transcription error propagated into this event's own calendar entry — REFUTED, small, and worth
fixing before it compounds.** The Oct-26 row's final column reads **30**, not 28. The 09-10 sibling
quoted it as `69 58 70 44 39 13 22 28` and this entry's `source` string inherited that. The column is
**FRN**, and the pattern explains itself: the third month of each refunding quarter carries the FRN
*new issue* at $30B (Jul-26 and Oct-26) while months one and two carry reopenings at $28B — visible in
the table above without any outside knowledge. Nothing downstream depended on it (the 20-Year sits in
column six and is unaffected, and the October FRN is announced **10-22**, not on this date), so this
is a hygiene fix, not a stance change. It is recorded because a mis-transcribed primary that nobody
checks is exactly how the *next* one gets believed.

**4. The 20-Year leg is fully deterministic and therefore carries no information — SUPPORTED, n=37,
re-derived.** From `auctions_query`, every 20-Year auction since the last size change: **15 new issues
(13 at $16B), 29 reopenings (24 at $13B)**, and walking back from today the first deviation from the
$16B/$13B grid is **2023-07-19** — giving **37 consecutive on-grid auctions since 2023-08-23, zero
deviations, three full years.** This reproduces the sibling's 37/37 exactly from an independent pull.
The security is **912810UX4**, sold as a new issue 2026-08-19 at $16B (high yield 5.204%, bid-to-cover
2.53), reopened 09-15 and again 10-21 — the standard three-month 20Y cycle, confirmed on the
predecessor CUSIP 912810UV8 (new 2026-05-20 $16B, reopened 06-16 and 07-22, both $13B). Document and
base rate agree, which is precisely why this leg is not worth a new registration:
[`FT-treasury-coupon-announcement-2026-09-10-1`](../forward-tests.md) already owns it and scores
2026-10-16, and it discloses its own near-uninformative pass rate.

**5. The 5-Year TIPS leg is the opposite case — the document CONTRADICTS the base rate — MIXED, and
this is what gets registered.** The October 5-Year TIPS new-issue slot, from `fiscaldata`, complete
since it began:

| Year | October 5Y TIPS new issue | y/y |
|---|---|---|
| 2019 | $17B | — (first October) |
| 2020 | $17B | **flat** |
| 2021 | $19B | +2 |
| 2022 | $21B | +2 |
| 2023 | $22B | +1 |
| 2024 | $24B | +2 |
| 2025 | $26B | +2 |
| **2026** | **$26B guided** | **flat — would end a five-year run** |

Five consecutive annual increases; a run-rate extrapolation says $27–28B. `sb0590` says $26B. Note
what the longer pull adds that a 2023-start window would have hidden: **2020 was also flat**, so
"first flat October ever" would have been wrong — this is the *second*, and the honest claim is that
it ends a five-year streak rather than that it is unprecedented. Nor would it set a record run at one
size: $26B in October 2026 would be the third consecutive 5Y TIPS new issue at $26B (2025-10, 2026-04,
2026-10), tying the $17B run of 2019-10 → 2020-10 rather than beating it. The same flattening is
visible one tenor over — the July 10-Year TIPS new issue held at **$21B** in 2026 after rising every
year from 2021 — so this reads as a **complex-wide halt in TIPS issuance growth in 2026**, consistent
with "maintain TIPS auction sizes at current levels" and inconsistent with an unannounced increase.
That is a claim the tape can settle, and it is the one this doc registers.

**6. The TIPS reopening rule is tenor-specific, not a universal $2B — MIXED, a refinement of the
sibling's finding, with its one exception named rather than dropped.** The 09-10 sibling established
that 10-Year TIPS reopenings print exactly $2B below their own CUSIP's new issue, 14/14. Extending the
same mechanical `inflation_index_security` test across tenors: **5-Year TIPS, 15 of 16 pairs at
exactly −$2B** since 2019, and **30-Year TIPS at −$1B, 6 of 6 pairs** ($9B new / $8B reopening,
unchanged every year 2021–2026). So the constant is per-tenor, and quoting "$2B below" as a general
TIPS rule would be wrong at the long end. **The one 5-Year exception, disclosed:** CUSIP 912828ZJ2 has
a third row — **2020-07-10, offering $25,000,000, bid-to-cover 6.31** — an off-cycle add-on three
orders of magnitude below any scheduled auction, not a quarterly reopening. On scheduled reopenings
only the record is **15/15**. It is named because a silently-dropped outlier is how a base rate stops
being checkable. This leg does not bear on the 10-15 prediction (that security is a *new issue*, which
the rule says nothing about); it is recorded because the sibling's rule is now the standard TIPS tool
in this calendar and it needed a boundary.

**7. Treasury HAS acted on long-end supply since `sb0590` — but on the buyback lever, not auction
sizes — SUPPORTED, and it cuts in favour of the stance rather than against it.** `sb0607`
(2026-08-19), read in full: Treasury is *"increasing, by at least double, the size of liquidity support
buyback operations for longer-dated nominal coupon securities (the 10-year to 20-year sector and the
20-year to 30-year sector). The current maximum size of $2 billion per operation will be at least $4
billion per operation. This change is effective September 9, 2026 and will be in effect for the
remainder of this refunding quarter (through November 4, 2026)."* Two things follow. First, the
**existence of a between-refundings issuance action that deliberately did not touch coupon sizes** is
positive evidence for the "maintain sizes" guidance holding — Treasury reached for a different lever
when it wanted to support the long end. Second, the 10-21 20Y reopening sells **inside** that doubled
long-end bid, which is still in force on that date. **A stale primary falls out of this and is worth
flagging:** the Tentative Buyback Schedule fetched this session (125,547 bytes — byte-identical in
size to the 09-03 fetch recorded by the [buyback ledger](treasury-buyback-10y20y-2026-09-10.md), i.e.
unrevised) still publishes **$2 billion** maximums for every 10-20Y and 20-30Y operation from 09-10
onward, including the **10-15** one that shares this event's date. `sb0607` supersedes those figures
and says so — *"An updated tentative Treasury buyback schedule will be released at a later date."*
Anyone reading the schedule PDF alone for an October buyback cap gets a number that is already wrong.

**8. The funding-lapse channel that could have delayed this announcement is CLOSED — SUPPORTED,
inherited from a dated sibling resolution, checked not assumed.** An October data blackout was a live
premise across this calendar until 2026-09-02. It is not any more:
[`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md)'s 2026-09-05
pulse records H.R. 6500 signed 2026-09-02 as **PL 119-103**, funding agencies through **2026-12-11**,
verified against three primaries. So no lapse begins 10-01 and nothing in this event's corridor is at
risk from one. Recorded because it is the obvious way an announcement 40 days out could move, and
because the answer is a *retirement* of a risk rather than a new one — the December cliff (12-11) sits
past this event entirely.

**9. The 10-16 primary-dealer agenda is NOT the early warning it looks like — REFUTED, and this
matters more than it sounds.** The natural framing is that 10-15 reads the expiring document and 10-16
gives the first look at its successor, one day later. This repo has already measured that and it is
wrong: [`treasury-primary-dealer-agenda-2026-10-16`](treasury-primary-dealer-agenda-2026-10-16.md)'s
own initial research found that across **all 15 agendas since 2023**, the agenda *confirms* issuance
changes Treasury has already put in a prior refunding statement and **has never front-run one** —
confirming **1/1**, early-warning **0/1**. Its release day is likewise nil on that ledger's own
measurement (TLT 7/15 up, permutation p=0.907). So the agenda earns exactly one line of attention:
whether its Discussion Topics name an **increase** in nominal coupon auction sizes. That is the tell,
and it is a falsifier of the agenda's own 0/1 record as much as a signal about issuance. This leg is
inherited rather than re-derived, and is cited as such.

**10. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury par curve, 08-31 → **09-04**: 2Y 4.34 → **4.37** · 5Y 4.55 → **4.54** · 10Y 4.75 → **4.78** ·
20Y 5.24 → **5.25** · 30Y 5.25 → **5.24**. Real curve, same publisher: 5Y real **2.17**, 10Y real
**2.43**. The relevant demand backdrop for a **5-Year** TIPS new issue is the 5-year breakeven (par
nominal less par real — a curve-derived approximation, not a traded breakeven), and it has firmed:
**2.26 (07-31) → 2.24 (08-14) → 2.34 (08-21) → 2.30 (08-28) → 2.37 (09-04)**, +11bp over five weeks,
against a 2026 range of 2.16–2.72 — so mid-to-low in its own year and rising, which is a mildly
constructive backdrop for real-yield supply and nothing more. **VIX 14.53** (09-04 close). **Today is
a Saturday** — 2026-09-05 has no session, Labor Day is Monday 09-07, and the next print is Tuesday
09-08, so 09-04 is the freshest close available and no reading here is stale by neglect. **Checked and
discarded as a non-finding:** the 5-year breakeven sitting *above* the 10-year (2.37 vs 2.35) looked
like a front-loaded inflation-expectation curve worth flagging — measured across the 2026 files it
holds in **146 of 171** sessions, so it is the norm, not a signal. Same shape as the sibling's 20Y/30Y
check, and discarded for the same reason.

**11. No tracked name is exposed through this channel — SUPPORTED, inherited, not re-derived.**
`symbols: []`. The duration channel that hit CRWV −12.1% and SOX −5% on 2026-08-18 was a *long-end
yield* move; an announcement publishing numbers already published cannot transmit into it. The live
equity risk in this corridor is the policy path — CPI 10-14 into FOMC 10-28 — which the auctions
inform and this announcement does not.

**12. The announcement's own tape effect will not be measurable, and that is stated now rather than
attempted at close-out — SUPPORTED.** 2026-10-15 already carries **PPI 08:30 · advance retail sales
08:30 · a 10-20Y liquidity-support buyback 13:40**, with **CPI the previous morning**, the **G20 FMCBG
in Bangkok** the same date, and **monthly opex plus the dealer agenda** the next day. No intraday
attribution to an ~11:00 ET announcement of two pre-published numbers is defensible in that session,
and none will be attempted. The honest measurable is the **sizes**, not the reaction — the same
conclusion the 09-03 and 09-10 siblings reached, reached again here on this date's own crowding.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event, and
stronger than usual because the content is a restatement. What the conditions do support is three
things.

**Use both numbers now, not on 10-15.** 20Y reopening **$13B**, 5-Year TIPS new issue **$26B**, both
citable to `sb0590` today. Any rates ledger in the October corridor can retire "the size is unknown"
from its reasoning 40 days early — and the 5-Year TIPS one is new information to this calendar, since
no doc had noticed that security was on this announcement at all.

**Spend the attention on the TIPS leg, not the 20Y one.** They are not symmetric. The 20Y prediction is
a document and a 37/37 base rate saying the same thing, which is why its registered test discloses a
near-uninformative pass. The 5Y TIPS prediction is a document **overruling** a five-year annual
ratchet — a genuine test of whether "maintain at current levels" binds where the run-rate says
otherwise. If TIPS issuance growth really has halted complex-wide in 2026 (leg 5: the July 10Y new
issue held flat too), that is a fact about the inflation-linked supply channel worth carrying into
11-04, and it is worth a registration in a way "the grid continued" is not.

**Sequence the dated checks, and do not over-read the one that looks best.** The order is: **10-01**
(the same table row's other four numbers — the free intermediate falsifier) → **10-15** (this event) →
**10-16** (the dealer agenda, measured at 0/1 as an early warning; read it for one thing only) →
**11-02** borrowing estimates → **11-04** refunding, where the grid itself can change and where
[`FT-39`](../forward-tests.md) lives → **11-12**, the first coupon announcement in this cycle whose
size no current Treasury primary publishes. Press context, dated and stale by construction: primary
dealers have been reported (Reuters, via Yahoo Finance, **2026-05-06**, on the *May* refunding)
expecting nominal coupon sizes to rise *"early next year"*. Four months old and about a different
refunding — it bounds the risk loosely rather than pricing it, and it is not treated as current.

### Honest limits

**No Treasury press release for the 2026-10-15 announcement exists yet** — it has not happened; every
prediction here is a document read, not an observation. **`sb0590`'s nominal-coupon table is explicitly
*anticipated* sizes** and its verbs are "anticipates" and "plans to", not a guarantee; the TIPS
paragraph is the firmer of the two because it names the security, the month and the number directly.
**The 5Y TIPS registration is the weaker of the two legs by construction** — it is registered
*because* document and base rate disagree, which means one of them is wrong and this doc is betting on
the document; a five-year ratchet is real evidence and is not dismissed, only outweighed. **The
`R`/`T` marker reading is a convention inference**: Treasury's schedule legend was not separately
fetched, and the new-issue reading rests on the marker plus seven years of October 5Y TIPS all being
new issues in `fiscaldata` — two independent supports, neither of them a legend. **The ~11:00 ET time
is unsourced convention**, inherited from the sibling chain and not established here; the calendar
entry discloses it. **Base rates sit inside one policy regime** (Fed on hold at 3.50–3.75% across the
whole window used), so "the grid is deterministic" is a within-guidance claim whose guidance has a
dated expiry. **The breakevens in leg 10 are curve-derived**, not traded instruments, and are context
only. **Leg 9 is inherited, not re-measured** — the agenda's 15-edition record is that ledger's work,
cited rather than reproduced. **The 5Y TIPS exception in leg 6 is characterised, not explained**: the
2020-07-10 $25M add-on is disclosed as an off-cycle event, but this session did not establish *why*
Treasury ran it.

## Stance & kill switches

**Stance (date `estimate`, two-security composition primary-sourced from Treasury's own tentative
schedule; both sizes primary-sourced from `sb0590`, all fetched 2026-09-05).** This is a **scheduled
nil whose content is already published** — expect **20Y reopening $13B** and **5-Year TIPS new issue
$26B** on 2026-10-15 at ~11:00 ET. No position is or should be taken on it. The doc's durable outputs
are four: (a) **the second security** — a 5-Year TIPS *new issue* shares this announcement, which no
doc in this calendar had noticed, and its size is published too; (b) **the asymmetry between the two
legs** — the 20Y is a document agreeing with a 37/37 base rate and carries no information, while the
5Y TIPS is a document *contradicting* a five-year ratchet and is the only registrable claim here; (c)
**the tenor-specific TIPS reopening constant** (−$2B at 5Y and 10Y, −$1B at 30Y), which bounds the
sibling's rule before it gets misapplied at the long end; and (d) **two corrections to live siblings**
— the Oct-26 FRN column is 30 not 28, and the Tentative Buyback Schedule's post-09-09 $2B caps are
superseded by `sb0607`'s ≥$4B.

**`FT-treasury-coupon-announcement-2026-09-10-1` is not touched, and the 20Y number is deliberately
NOT re-registered here.** That test already predicts this event's 20-Year reopening at $13B and scores
2026-10-16; registering it again would double-count one observation, exactly as the 09-10 session
declined to re-register the 09-03 sizes. This event inherits it rather than duplicating it.

**Forward test `FT-treasury-coupon-announcement-2026-10-15-1` registered** in
[`forward-tests.md`](../forward-tests.md), scoreable **2026-10-16**: the 2026-10-15 announcement
publishes the **5-Year TIPS new issue at $26 billion** — the leg where `sb0590`'s written guidance
overrides a five-year annual ratchet, and the third and last commitment in that statement's TIPS
FINANCING sentence.

**Kill switches:**

- **The 5-Year TIPS new issue printing off $26B on 2026-10-15** — the registered test's own kill. Above
  $26B means the ratchet won and "maintain TIPS auction sizes at current levels" does not bind against
  a live run-rate; below means an unannounced *cut*, which nothing in the record anticipates. Either
  way the TIPS complex stops being readable off the refunding statement and gets re-derived, not
  patched.
- **The 20-Year reopening printing off $13B on 2026-10-15** — Treasury contradicting a named,
  month-specific written commitment inside its own guidance quarter, and a 37-auction grid breaking in
  the same act. Owned and scored by `FT-treasury-coupon-announcement-2026-09-10-1`; listed here because
  it kills this doc's stance too.
- **Any of 3Y $58B · 10Y $39B · 30Y $22B printing off-grid at the 2026-10-01 announcement** — the
  earliest dated tell available, two weeks ahead of this event, off the same Oct-26 table row. It would
  falsify the row before this announcement ever reads it.
- **The 2026-10-21 or 2026-10-22 auction clearing at a size other than the announced one** — a
  post-announcement revision, which neither series has done in the observed window.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at or before the
  2026-11-04 refunding — the whole "announcement = scheduled nil" frame is conditional on that
  sentence, and [`FT-39`](../forward-tests.md) already measures that channel.
- **An off-cycle coupon issuance action** — a coupon size changed between refundings, or a coupon CMB.
  Note `sb0590` explicitly reserves bill-size and CMB flexibility, so a *bill* action does not fire
  this; and `sb0607` shows Treasury acting on the **buyback** lever without touching auction sizes,
  which is the non-firing case made concrete.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-40 | **Initial research.** **The finding: this announcement carries TWO securities, not one.** Treasury's Tentative Auction Schedule (fetched direct, HTTP 200, 17,195 bytes; PDF streams inflated and rows reconstructed from Td/Tm coordinates) puts both `20-Year BOND R` (auction **10-21**, settle 10-23) and `5-Year TIPS T` (auction **10-22**, settle 10-30, **no `R` → new issue**) on **Thursday, October 15, 2026**. The calendar entry named only the 20Y, so the TIPS leg has been invisible to every downstream doc — title and source corrected in `market-events.ts` in this PR. **Both sizes published:** `sb0590` Oct-26 row **20-Year = 13**, and its TIPS FINANCING sentence verbatim *"the October 5-year TIPS new issue auction size at $26 billion"* — the third and last commitment in a sentence whose August leg already printed ($8B, 2026-08-20). **The legs are asymmetric, which is the substantive point.** 20Y: re-derived independently from `auctions_query` — **37 consecutive on-grid auctions since 2023-08-23**, zero deviations (first deviation walking back is 2023-07-19), so document and base rate agree and the leg carries no information; already owned by `FT-treasury-coupon-announcement-2026-09-10-1`, deliberately **not** re-registered. 5Y TIPS: the October slot has risen **five straight years** — 2019 $17B · 2020 $17B (flat) · 2021 $19B · 2022 $21B · 2023 $22B · 2024 $24B · 2025 **$26B** — and `sb0590` guides **flat at $26B**, the first place in the coupon complex where written guidance contradicts a live run-rate. Corroborating: the July 10Y TIPS new issue also held flat at $21B in 2026, so TIPS growth appears halted complex-wide. **`FT-treasury-coupon-announcement-2026-10-15-1` registered** on that leg, scoreable 2026-10-16. **TIPS rule refined:** the sibling's "$2B below own new issue" is **tenor-specific** — 5Y **15/16** (the one exception a $25M off-cycle add-on to 912828ZJ2 on 2020-07-10, named not dropped → 15/15 on scheduled reopenings), 30Y **−$1B, 6/6**. **Correction to a sibling and to this entry's own source string:** the Oct-26 row reads `69 58 70 44 39 13 22 **30**`, not `...22 28` — the column is FRN and the third month of each quarter carries the FRN new issue at $30B; the 20-Year 13 is unaffected. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** payrolls **+162K vs ~53K** (09-04) reversed Waller's 09-03 dovish turn; FOMC blackout live 09-05→09-17. **Rates (Treasury par, primary), 08-31 → 09-04:** 2Y 4.34 → **4.37** · 5Y 4.55 → **4.54** · 10Y 4.75 → **4.78** · 20Y 5.24 → **5.25** · 30Y 5.25 → **5.24**; 5Y real **2.17**, so the **5-year breakeven ~2.37%**, up +11bp over five weeks (2.26 on 07-31) against a 2026 range of 2.16–2.72 — mildly constructive for real-yield supply, nothing more. **VIX 14.53** (09-04 close; 2026-09-05 is a **Saturday** and 09-07 is Labor Day, so 09-04 is the freshest close and the next session is 09-08). **Checked and discarded as a non-finding:** the 5Y breakeven sitting above the 10Y (2.37 vs 2.35) — true in **146 of 171** 2026 sessions, so it is the norm. **Policy/geopolitical:** `sb0607` (2026-08-19) doubled 10-20Y and 20-30Y buyback caps $2B → **≥$4B**, effective 09-09 **through 11-04** — a between-refundings issuance action that pointedly did **not** touch coupon sizes, which supports the guidance holding; the 10-21 20Y reopening sells inside that bid. **Second correction:** the Tentative Buyback Schedule (fetched this session, 125,547 bytes, unrevised) still publishes **$2B** caps for every post-09-09 10-20Y/20-30Y operation including **10-15**, superseded by `sb0607` — reading that PDF alone gives a stale number. **Funding channel closed:** PL 119-103 (signed 2026-09-02) funds through 12-11, so no 10-01 lapse touches this corridor. **Inherited, not re-derived:** the 10-16 dealer agenda is **not** an early warning — 15 editions measured at confirming 1/1, early-warning 0/1. **Adjacency — 11 tracked entries already inside the ±5-day corridor; four genuinely new dated events PROPOSED** as `estimate` in this PR: `treasury-coupon-announcement-2026-10-01` (the same table row's 3Y/10Y/30Y block — the free intermediate falsifier this doc's month-horizon call needs), `treasury-buyback-10y20y-2026-10-15` (shares this event's date; carries the stale-cap finding), `treasury-20y-bond-2026-10-21` and `treasury-5y-tips-2026-10-22` (the two sales this announcement sizes, neither previously on the calendar). **Discovered and deliberately NOT filed**, named here so a later sweep can: the October 3Y/10Y/30Y auctions (10-06/10-07/10-08), the 10-21 TIPS 1Y-10Y buyback and the 10-27 20-30Y buyback — all outside this event's corridor and none load-bearing for it. | **Stance set** — scheduled nil, both sizes published; expect 20Y **$13B** / 5Y TIPS **$26B**. The registrable claim is the TIPS leg, not the 20Y one | 2026-09-15 (medium; D-40 sits in the 31+/21d band → 09-26, but the band tightens to 7d the moment days-out crosses 30 on 09-15, which makes 09-15 the real first due date) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed to `market-events.ts` as an `estimate` in the same PR. Close-out fills `## Outcome` below
from re-run instrument data (cache busted first), never from memory.
