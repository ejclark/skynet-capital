# Treasury liquidity-support buyback operation (TIPS 1-10Y, $750M cap, 1:40pm ET) — treasury-buyback-tips-1y10y-2026-10-21

**Kind:** rates · **Date:** 2026-10-21 (estimate, EST: treasury.gov Tentative Schedule of Treasury Buyback Operations, masthead "For Publication August 5, 2026", PDF text layer read direct 2026-09-08 — plain curl, HTTP 200, 125,547 bytes, md5 `79b65955e74a59f6bebff3adf8ba7b35`) · **Impact:** low
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.30,"daysBand":"low:15+","adjacentIds":["ecb-quiet-period-start-2026-10-21","fomc-blackout-start-2026-10-17","housing-starts-2026-10-20","import-export-prices-2026-10-16","industrial-production-2026-10-16","mwts-benchmark-revision-2026-10-26","nahb-hmi-2026-10-19","opex-2026-10-16","pending-home-sales-2026-10-20","tic-monthly-2026-10-16","treasury-20y-bond-2026-10-21","treasury-2y-note-2026-10-26","treasury-5y-tips-2026-10-22","treasury-coupon-announcement-2026-10-22","treasury-primary-dealer-agenda-2026-10-16"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** A **$750 million** Treasury buyback of off-the-run short and belly TIPS, 1:40–2:00pm ET,
**estimate**-dated off a tentative schedule whose confirming announcement lands 10/20. Two things
make it worth a document. **First, in this bucket the cap normally binds** — unlike its long-TIPS
sibling, this operation filled **100 / 100 / 100 / 98.0 / 99.3 / 98.0 / 100%** across its first seven
operations, and then took **54.0%** ($405M) on **2026-07-22**, the only miss the label has. **Second,
and this is what this research adds: 10/21 is a structural rerun of that miss.** Treasury's own
per-CUSIP data shows it bars the current on-the-run from the eligible set (**4 of 4** operations
checked), and 07-22 was the last operation before the 07-23 10-Year new issue displaced
**91282CPU9** — it ran on the one day its eligible list was maximally stale, newest member a
**July-2025** line. 10/21 repeats it precisely: the **5-Year TIPS new issue prices 10/22**, this
operation's own settlement date, so **91282CQP9** ($50B, the on-the-run 5Y) stays excluded for one
last day. The **9/29** sibling is the control — same bucket, same cap, no adjacent TIPS auction. What
this research does **not** find is a mechanism: both candidate explanations for the July miss were
tested against Treasury's own real curve (670 sessions) and **failed** — auction-eve concession in
the 5-year real yield averages **+2.2bp** on 14 TIPS new issues against **+0.1bp** on 18 reopenings,
and real-yield momentum does not separate it (**2026-06-24** ran into a **+58bp** 60-session selloff
and filled the cap outright). So the base rate wins: base case is a **fill**, held at **low**
confidence, with the sharper claim carried by the eligible-set projection instead, which is
checkable at **10/20 11:00am ET** and does not depend on the fill at all. Scale is the deflator —
**$750M against $26B** of new 5-Year TIPS the next day is **35:1**. `symbols: []`, the date is
`estimate`, and nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-08, D-43) | **Stand aside** | High | Nothing dated today for this event. Its terms do not exist until the **2026-10-20** 11:00am ET preliminary eligible-CUSIP list, the date itself is `estimate` off a document Treasury calls tentative, and `symbols: []` leaves nothing to express a view in. | A Treasury statement before **2026-10-20** moving, resizing or cancelling the 10/21 row — including the updated buyback schedule sb0607 promised and has still not published |
| This week | **Stand aside here; the 9/15 long-TIPS operation is the one with a print this week** | High | This event is 43 days out and in its 30-day cadence band. The dated TIPS reads in range belong to [the 09-15 sibling](treasury-buyback-tips-10y30y-2026-09-15.md) (2:15pm ET 9/15) and the **9/17** 10-Year TIPS reopening, not to 10/21. | The **2026-09-15** long-TIPS operation printing accepted par **at or above $250M** — its own kill switch — which would say Treasury loosened its price filter across both TIPS buckets and this doc's price-rationing framing needs re-doing before 10/21 |
| This month | **Watch 9/29 — it is the control that decides what 10/21 is testing** | Medium | 9/29 is the same bucket at the same $750M cap with **no adjacent TIPS auction**. A fill there isolates auction-adjacency as the live variable for 10/21; a second miss there says the July print was a regime change and the structural story is dead. | The **2026-09-29** operation printing accepted par **below $700M** — a second consecutive miss with no auction adjacent, which kills the "07-22 was structural" reading outright and reframes 10/21 as a regime read rather than a rerun |
| This quarter | **Read the 10/21 print; do not trade it — and read the accepted prices before 10/22, never after** | Medium | The operation's accepted par and per-CUSIP weighted-average prices publish ~2:15pm ET 10/21, the last clean pre-knot read on the short real curve: [the 5Y TIPS sibling](treasury-5y-tips-2026-10-22.md) measured Treasury's published 5-year real yield falling **7 of 7** October new issues (mean **−11.0bp**) as the knot swaps on 10/22. | Accepted par **at or above $700M** on **2026-10-21** — the base case, which would say the eligible-set staleness shared with 07-22 does no work and the July miss was idiosyncratic (registered as **FT-treasury-buyback-tips-1y10y-2026-10-21-2**) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, and no house playbook
  (S1/S2/E1/S3/S4 + G1) takes a rates input. This is a read-it-don't-trade-it event.
- **2026-09-29, ~2:15pm ET** — the control. Accepted par at or above **$700M** keeps the structural
  reading alive for 10/21; below **$700M** kills it and makes 10/21 a regime read instead.
- **2026-10-20, 11:00am ET** — the preliminary eligible-CUSIP list, the first place this operation's
  terms exist. The projection to check it against: **91282CPU9** (10Y TIPS of 2036-01-15)
  **present**, **91282CQP9** (2031-04-15) **absent**, **91282CRE3** (2036-07-15) **absent**, and
  **91282CFR7** (2027-10-15) **absent** because the window opens 10/22/2027.
- **2026-10-21, ~2:15pm ET** — accepted par. **≥ $700M** is the base case (7 of 8 prior operations);
  **< $700M** is a second auction-eve miss and the first real evidence for the structural read.
- **Total par offered** anchors the interpretation either way: the label's range is **$2,291M–$6,512M**
  and 07-22 came in mid-range at **$3,194M**, so a low fill there was Treasury declining, not sellers
  going missing. Read fill and offers together or not at all.
- **The one reading instruction, so it is not re-derived:** compare 10/21's weighted-average accepted
  prices against the **10/21 or earlier** published real curve. On **10/22** Treasury's 5-year knot
  swaps to the incoming new issue and the published 5-year real yield steps down ~11bp — comparing
  across that boundary compares two different curves.
- **Watch (dated):** 10Y TIPS reopening **9/17** · TIPS 1-10Y buyback **9/29** · FOMC blackout starts
  **10/17** · 20Y bond reopening + ECB quiet period + **this operation 10/21** · 5Y TIPS new issue +
  coupon announcement **10/22** · FOMC **10/28** · Quarterly Refunding **11/4**.

## Initial research

**The question, plainly:** what is a $750M liquidity-support buyback of 1-to-10-year TIPS on
2026-10-21, why does this bucket fill its cap when its long-TIPS sibling never does, what broke that
streak on 2026-07-22, and does landing the day before a 5-Year TIPS new issue mean anything or is it
a scheduling coincidence?

**One-line verdict:** a mechanically trivial operation that is analytically the cleanest natural
experiment on this calendar — because 10/21 shares one specific, primary-verifiable structure with
the only cap miss the bucket has ever had, and because 9/29 is a genuine control for it — worth
*reading* at 2:15pm ET and never worth *trading*.

**Method.** Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — no price
instruments; sourced primary research only. Every number below is read direct this session
(2026-09-08) unless labelled otherwise:

- `home.treasury.gov/system/files/221/Tentative-Buyback-Schedule.pdf` — plain curl HTTP 200, 125,547
  bytes, md5 `79b65955e74a59f6bebff3adf8ba7b35`; text layer decompressed and read.
- `home.treasury.gov/news/press-releases/sb0607` — plain curl HTTP 200, full body read (WebFetch
  times out on treasury.gov; the tool artifact recorded on `treasury-borrowing-estimates-2026-11-02`,
  2026-08-31, still holds).
- `api.fiscaldata.treasury.gov` — `buybacks_operations` (all 32 TIPS operations since 2024-04-17),
  `buybacks_security_details` (per-CUSIP, four 1Y-10Y operations, 111 line-rows),
  `auctions_query` (all 32 TIPS auctions since 2024-01-01, `inflation_index_security = Yes`).
- `home.treasury.gov` Daily Treasury Par **Real** Yield Curve and Par Yield Curve, full-year
  2024/2025/2026 CSVs — **670 sessions**, 2024-01-02 → 2026-09-04.
- `cdn.cboe.com` delayed VIX quote.

No fetch failed this session; `probe-ref.blocked` is empty. This ledger was written from the one
proposal that existed for this id
(`proposals/treasury-buyback-tips-1y10y-2026-10-21.from-treasury-buyback-tips-10y30y-2026-09-15.json`,
filed 2026-09-08 by the long-TIPS lane), whose canonical file is written here.

### Conviction legs, tested

**1. The date, sector and cap are right, and so is the `estimate` label — SUPPORTED.** The tentative
schedule's row reads verbatim: announce **10/20/2026**, operation **10/21/2026 1:40 pm – 2:00 pm**,
settle **10/22/2026**, **Liquidity Support**, **TIPS 1Y to 10Y**, maturity range **10/22/2027 –
10/21/2036**, min **$0**, max **$750 million**. It stays `estimate` on the two counts every buyback
row off this document carries — a tentative schedule is tentative by construction, and the confirming
primary is the 10-20 announcement, not this PDF. The *date* is not in doubt; the label is about
taxonomy. One scheduling fact worth banking: the entire August-refunding document (8/6 → 11/5)
carries exactly **three** TIPS rows — 9/15 (10-30Y, $500M), 9/29 (1-10Y, $750M) and **10/21 (1-10Y,
$750M)**. This is the **last TIPS operation of the refunding quarter**; the next one's date is set at
the **11/4** Quarterly Refunding.

**2. sb0607 does not cover this operation either — SUPPORTED, verbatim off the primary.** The release
fetched direct this session reads: *"increasing, by at least double, the size of liquidity support
buyback operations for longer-dated **nominal coupon securities** (the 10-year to 20-year sector and
the 20-year to 30-year sector) … effective September 9, 2026 and will be in effect for the remainder
of this refunding quarter (through November 4, 2026)."* TIPS appear nowhere. So 10/21 runs at its
unchanged $750M *inside* the doubled window — the same control framing
[the 09-15 long-TIPS ledger](treasury-buyback-tips-10y30y-2026-09-15.md) established, now for the
short bucket. The release also promises that *"an updated tentative Treasury buyback schedule will be
released at a later date"*; that schedule is **still unpublished**, and the PDF re-fetched today is
byte-identical to the August 5 masthead.

**3. In this bucket the cap normally binds, and 2026-07-22 is the one exception — SUPPORTED, off
`buybacks_operations`.** All eight operations under the current **TIPS 1Y to 10Y** label:

| Operation | Cap | Offered | Accepted | Fill of cap | Hit rate on offers | Lines taken / eligible |
|---|---|---|---|---|---|---|
| 2025-08-13 | $750M | $6,512M | $750M | 100.0% | 11.5% | 8 / 29 |
| 2025-09-24 | $750M | $5,775M | $750M | 100.0% | 13.0% | 4 / 29 |
| 2025-11-25 | $750M | $4,947M | $750M | 100.0% | 15.2% | 8 / 29 |
| 2026-01-27 | $750M | $3,316M | $735M | 98.0% | 22.2% | 9 / 27 |
| 2026-02-25 | $750M | $2,291M | $745M | 99.3% | 32.5% | 12 / 28 |
| 2026-05-13 | $750M | $2,339M | $735M | 98.0% | 31.4% | 8 / 28 |
| 2026-06-24 | $750M | $4,545M | $750M | 100.0% | 16.5% | 6 / 28 |
| **2026-07-22** | $750M | $3,194M | **$405M** | **54.0%** | **12.7%** | 6 / 27 |

This is the mirror image of the long bucket, where the same dataset shows **18.2–28.4%** fills across
four operations on offers that exceeded the cap every time. **Here the ceiling is the constraint;
there it is decoration.** The July print is the only crack in that, and note what it is *not*: offers
came in at **$3,194M**, mid-range for the label — Treasury declined, sellers did not vanish.

**4. Both candidate explanations for the July miss fail — REFUTED, and this is the honest core of the
document.** Two mechanisms were testable against Treasury's own daily curves and neither survives.

*Auction-eve concession.* If the short real curve cheapens into a TIPS auction, D-1 offers would sit
above Treasury's price filter. Measured across all **32** TIPS auctions since 2024-01-01 against the
par real curve, the 5-year real yield's D-3 → D-1 change averages **+2.2bp** on the **14 new issues**
and **+0.1bp** on the **18 reopenings** — far too small and too noisy to price a $750M operation out.
On 2026-07-22 itself it was **+6.0bp**, inside the ordinary range (2024-01-18 saw +16.0bp with no
buyback anywhere near it).

*Real-yield momentum.* If a fast selloff strands offers at stale prices, low fills would cluster with
big preceding moves. They do not. Across all **17** short-bucket operations, **2026-06-24** ran into a
**+32bp** 20-session and **+58bp** 60-session selloff in the 5-year real yield and filled the cap
outright; **2026-07-22** came in at **+8bp** over 20 sessions and missed. The 60-session move into
07-22 (**+80bp**) is the largest in the series, which is suggestive and nothing more at n=1.

**So the July miss has no cause this ledger can establish.** That is why 9/29 and 10/21 are worth
tracking rather than assumed away, and why the base case below is the base rate rather than a story.

**5. Treasury bars the current on-the-run from the eligible set, and that makes 10/21 a structural
rerun of 07-22 — SUPPORTED as an observation, derived as a projection.** This is the finding the
calendar did not previously carry. `buybacks_security_details` returns the full eligible list for
2026-07-22: **27 lines**, front **91282CFR7** (1.625% of 2027-10-15), back **91282CNS6** (1.875% of
2035-07-15). Two lines sat *inside* the stated maturity window (07/23/2027 – 07/22/2036) and were
still absent — **91282CQP9** (2031-04-15, then the on-the-run 5Y, ~$50B outstanding) and
**91282CPU9** (2036-01-15, then the on-the-run 10Y, ~$59B). The same pattern holds on 2026-02-25,
2026-05-13 and 2026-06-24: the eligible back end is pinned at 2035-07-15 while CPU9 sits in-window
and out of the list. **Four for four, Treasury excludes the current on-the-run.**

That makes 07-22 special in a specific way: it was the **last operation before the 07-23 10-Year new
issue (91282CRE3) displaced CPU9**, so it ran on the one day its eligible set was maximally stale —
newest member CNS6, auctioned **July 2025**, a full year old. **10/21 repeats that exactly.** The
5-Year TIPS **new issue** prices **10/22** — this operation's own settlement date — so on 10/21
**91282CQP9 is still the on-the-run 5Y and still excluded, for the last time.** Projected eligible
set, checkable at 10/20 11:00am ET: **91282CPU9 present** (first eligible at the 9/29 operation, once
CRE3 took over as the on-the-run 10Y), **91282CQP9 absent**, **91282CRE3 absent**, and **91282CFR7
absent** because the window opens 10/22/2027 and it matures 2027-10-15. Registered as
**FT-treasury-buyback-tips-1y10y-2026-10-21-1**. Stated plainly: the *exclusion rule* is observed,
the *projection* is a derivation from four lists plus window arithmetic, and the causal step from
"stale eligible set" to "low fill" is **n=1 and unproven** — leg 4 is why.

**6. 9/29 is a real control, which is what makes the pair informative — SUPPORTED.** The 9/29
operation is the same bucket at the same $750M cap, and the nearest TIPS auction is the **9/17**
10-Year **reopening**, twelve calendar days earlier. It shares the CPU9-now-eligible change with
10/21 and shares **none** of the auction adjacency. So the sequence reads cleanly: a 9/29 fill leaves
auction-eve staleness as the live variable for 10/21; a 9/29 miss says July was a regime change and
the structural story is dead before 10/21 arrives. Either way the answer arrives before this
operation, which is the rare case of one calendar entry genuinely de-risking another.

**7. The pair with 10/22, and the reading trap the sibling already priced — SUPPORTED (cited).** The
5-Year TIPS auction on 10/22 is a **new issue** at an expected **$26B** (primary-verified on
[its own ledger](treasury-5y-tips-2026-10-22.md)). That ledger measured, from Treasury's own data,
that on **7 of 7** October 5-Year TIPS new issues the published 5-year real yield **fell** (mean
**−11.0bp**, 0/7 positive) and the published 5-year breakeven **rose** (mean **+14.6bp**), because
Treasury reads its 5-year knot off *"the most recently auctioned TIPS"* and a new issue swaps the
security under it. The consequence **for this document** is a reading instruction, not a trade:
**10/21's weighted-average accepted prices are the last clean pre-knot read on the short real
curve.** Comparing them against the 10/22 published curve compares two different curves.

**8. Scale — the honest deflator. SUPPORTED.** $750M cap against **$26B** of new 5-Year TIPS sold the
next day is **35:1**; against **$147B** of gross TIPS issuance in 2026 through 8/20 (`auctions_query`,
eight auctions) the cap is **0.5%**. The median take across the label's eight operations is
**$742.5M**. Treasury is an overwhelming net *issuer* of short and belly TIPS; this operation is
plumbing — rotating illiquid off-the-runs out of dealer and investor books — not supply management.

**9. The 5-year selloff is a real-yield event too, and the breakeven behaves differently from the 30Y
— SUPPORTED.** From Treasury's own two daily curves, 2026 year-to-date (171 sessions,
2026-01-02 → 2026-09-04):

| | 2026-01-02 | 2026-09-04 | Change |
|---|---|---|---|
| 5Y real yield | 1.46% | **2.17%** | **+71bp** |
| 5Y breakeven | 2.28% | **2.37%** | +9bp |
| 5Y nominal | 3.74% | **4.54%** | +80bp |

**89% of the 5-year selloff (71 of 80bp) is real yield**, matching the 87% the 09-15 sibling measured
at the 30-year point. One difference worth writing down rather than assuming away: the **5-year
breakeven's 2026 range is 2.16% – 2.72%** (low 07-28, high 05-04), far wider than the 30-year's
**2.15–2.34%**, so a short-end breakeven excursion is ordinary where a long-end one is not. The
5-year real yield's 2026 high is **2.22%** (07-27) and it sits **5bp** below it today.

**10. Tracked-name sensitivity — none direct.** `symbols: []`. Our roster (NVDA MRVL AVGO CRWV MSFT
GOOG META AAPL AMZN) carries no TIPS exposure and no instrument that prices off a $750M off-the-run
buyback. The transmission runs through the same real-yield/duration channel every macro print in this
window feeds; leg 8's arithmetic forecloses any claim that this operation moves it.

### What the conditions support

Nothing directional. The house playbooks (S1/S2/E1/S3/S4 + G1) are symbol- and earnings-keyed and
none takes a rates input, so there is no play to fit. What travels is a **reading discipline** with a
dated sequence attached: 9/29 (control) → 10/20 11:00am ET (eligible list) → 10/21 ~2:15pm ET
(accepted par and prices, pre-knot). Two forward tests are registered below so that sequence is
scored rather than narrated — one on the mechanical projection, one on the fill. The event is
`estimate`-dated; per the date policy that widens caution and licenses no entry, which is the same
answer leg 8's arithmetic gives anyway.

### Honest limits

- **The operation's own terms do not exist yet.** Everything above is off a document Treasury calls
  tentative, plus history. The **10/20 11:00am ET** preliminary CUSIP list is the first authoritative
  statement of the cap, sector and eligible set — and sb0607's promised updated schedule, still
  unpublished, could restate the cap before then.
- **Leg 5's causal step is unproven and stated as such.** The on-the-run exclusion is observed 4/4;
  the projected 10/21 eligible set follows from it plus window arithmetic. But "maximally stale
  eligible set → low fill" rests on **one observation** (07-22), and leg 4 refuted the two mechanisms
  that would have explained it. FT-1 tests the projection (mechanical); FT-2 tests the fill (base
  rate). They are deliberately independent — FT-1 can pass while FT-2 fails, and that combination is
  the informative one.
- **9/29 has not happened.** The control this document leans on prints three weeks before 10/21, and
  its own lane owns it. If 9/29 resolves the question, this ledger's next pulse should say so and
  narrow rather than repeat.
- **Attribution on 10/21 is impossible by construction.** The 20-year bond reopening prices at 1:00pm
  ET the same day — forty minutes before this operation opens — the FOMC blackout has been running
  since 10/17, and the 5-Year TIPS auction and coupon announcement land the next morning. Both
  forward tests therefore score the operation's **own published numbers** and never a yield move.
- **The tape is stale.** Labor Day closed markets 9/7 and the 9/8 session had not settled at write
  time, so Treasury's par curves still end **2026-09-04**. VIX is the 09-08 delayed quote of
  **15.30** against the **14.53** 09-04 close (+0.77, under the 3pt regime bar).
- **No independent read on the 10/22 auction size.** The **$26B** is carried from the 5Y TIPS
  sibling's primary verification, not re-derived here; the last three October 5Y TIPS new issues
  priced $24B / $26B / $26B (`auctions_query`), which is consistent but not confirmation.

## Stance & kill switches

**Stance (set 2026-09-08 at D-43, `estimate`-dated).** **Read it, do not trade it.** No position, no
size, no rate-sensitive exposure keyed to this operation — leg 8's arithmetic ($750M against $26B of
new 5-Year TIPS the next day) forecloses any market impact worth acting on, and the `estimate` label
widens that caution rather than narrowing it. **Base case (estimate-labeled, this doc's own forecast,
low confidence):** accepted par returns to the cap band, **$700M–$750M**, on the strength of the base
rate (7 of 8) rather than on any mechanism — because leg 4 refuted both candidate explanations for
the one miss. **The sharper claim, which is where this document actually adds something:** 10/21 is a
structural rerun of 07-22 — the last operation before an incoming TIPS new issue displaces the
on-the-run, so the eligible set carries no line newer than January 2026 — and that is checkable
**mechanically** at 10/20 11:00am ET without waiting for the fill. Registered as
FT-treasury-buyback-tips-1y10y-2026-10-21-**1** (the eligible-set projection) and **-2** (the fill).
**The reading instruction that outlives both:** compare 10/21's accepted prices against the 10/21 or
earlier real curve, never the 10/22 one — Treasury's 5-year knot swaps on auction day.

**Kill switches:**

- **The 2026-09-29 operation printing accepted par below $700M** — a second consecutive miss with no
  TIPS auction adjacent. That kills the structural reading outright: the July print would be a regime
  change in Treasury's price filter, not an auction-eve artifact, and 10/21 becomes a regime read.
  Reassess the base case *down*, not up.
- **The 2026-10-20 preliminary CUSIP list containing 91282CQP9 (2031-04-15) or 91282CRE3
  (2036-07-15)** — the on-the-run exclusion rule leg 5 rests on would be wrong, and with it the
  entire "stale eligible set" framing. Kills FT-1 directly.
- **Accepted par at or above $700M on 2026-10-21** — the base case confirming, which is a *pass* for
  FT-2 and a quiet death for the structural story: two auction-eve operations, one miss, one fill,
  n=2 and no signal. Say so plainly at close-out rather than keeping the hypothesis alive.
- **Treasury extending sb0607's doubling to TIPS, or adding TIPS operations, at or before the
  2026-11-04 Quarterly Refunding** — a materially different program from the one dated here. Propose
  it as its own dated entry; do not fold it into this stance.
- **The 10/20 announcement moving, resizing or cancelling this operation** — voids both forward tests
  rather than killing them; they would be measuring a schedule change, not a price filter.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-43 | **Initial research banked (above); canonical event file written from the one proposal that existed for this id** (`from-treasury-buyback-tips-10y30y-2026-09-15`, filed the same day) — its stacking read upheld and given the mechanism it lacked. **Schedule primary re-verified:** md5 `79b65955…`, 125,547 bytes, HTTP 200, masthead still "For Publication August 5, 2026"; row verbatim announce 10/20, operation 10/21 1:40–2:00pm, settle 10/22, TIPS 1Y-10Y, 10/22/2027–10/21/2036, max $750M. Exactly **three TIPS rows on the whole 8/6→11/5 document** (9/15, 9/29, **10/21 is the last**). **sb0607 fetched direct (HTTP 200, full body):** "nominal coupon securities … through November 4, 2026" — TIPS uncovered, so $750M is unchanged inside the doubled window; its promised updated schedule still unpublished. **`buybacks_operations`, all 32 TIPS ops:** under the 1Y-10Y label the cap filled **100/100/100/98.0/99.3/98.0/100%** then **54.0%** ($405M) on **2026-07-22**, on **$3,194M** offered (mid-range) — Treasury declined, sellers did not vanish; exact inverse of the 10Y-30Y bucket's 18–28%. **Both explanations for the miss REFUTED** against Treasury's par real curve (670 sessions, 2024-01-02→2026-09-04): auction-eve 5Y-real concession D-3→D-1 is **+2.2bp** on 14 TIPS new issues vs **+0.1bp** on 18 reopenings (07-22 itself +6.0bp), and momentum does not separate it (06-24 filled 100% into a +58bp 60-session selloff; 07-22 missed on +8bp/20d). **`buybacks_security_details` — the load-bearing find:** Treasury excludes the current on-the-run **4/4** ops checked (07-22's 27 eligible lines run 2027-10-15 → 2035-07-15, with in-window **91282CQP9** and **91282CPU9** both absent), so 07-22 was the last op before the 07-23 10Y new issue displaced CPU9 — its newest eligible line was July-2025 paper. **10/21 repeats it:** the 5Y TIPS new issue prices 10/22 (this op's settle date), so QP9 stays excluded one last day. Projected 10/20 list: CPU9 in, QP9 out, CRE3 out, CFR7 out (window opens 10/22/2027). **9/29 is the control** — same bucket, same cap, nearest TIPS auction the 9/17 reopening. **Adjacency — peers:** n/a (`symbols: []`). **Macro:** 5Y real **1.46→2.17** (+71bp) vs 5Y nominal +80bp = **89% real**, 5bp off the 07-27 high of 2.22; 5Y breakeven 2.37, 2026 range **2.16–2.72**, much wider than the 30Y's 2.15–2.34. **VIX 15.30** (09-08 delayed quote) vs the 09-04 close of 14.53, +0.77, under the 3pt bar. **Geopolitics:** nothing touching this instrument; `symbols: []`. **Event tape:** terms do not exist until 10/20 11:00am ET. **Adjacency set: 15 tracked ids within 5 days** — 10/21 also carries the 20Y bond reopening (1:00pm, 40 min earlier) and the ECB quiet-period start, 10/22 the 5Y TIPS new issue + coupon announcement, with the FOMC blackout running from 10/17, so attribution on the day is impossible by construction. **No new dated events discovered** — every adjacent event found is already tracked, including `treasury-refunding-2026-11-04`; no proposal filed. Registered FT-treasury-buyback-tips-1y10y-2026-10-21-**1** (eligible-set projection) and **-2** (fill ≥ $700M). | — (stance set) | 2026-10-08 (low, 15+d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-treasury-buyback-tips-1y10y-2026-10-21.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
