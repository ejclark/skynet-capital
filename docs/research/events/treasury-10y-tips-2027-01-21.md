# 10-Year TIPS auction (NEW ISSUE) — treasury-10y-tips-2027-01-21

**Kind:** rates · **Date:** 2027-01-21 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, plain curl 2026-09-09, HTTP 200, 17,195 bytes, text layer decompressed — row reads `10-Year  TIPST / Thursday, January 14, 2027 / Thursday, January 21, 2027 / Friday, January 29, 2027`, and the PDF's own legend reads `T --denotes TIPS` and `R --denotes reopening`, so the absent `R` is Treasury's own new-issue marker; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-09
<!-- probe-ref: {"symbols":{},"vix":15.72,"daysBand":"medium:31+","adjacentIds":["boj-decision-2027-01-22","consumer-confidence-2027-01-26","fhfa-hpi-2027-01-26","fomc-blackout-start-2027-01-16","japan-cpi-2027-01-22","mlk-market-closure-2027-01-18","norway-gpfg-bond-expert-group-2027-01-25","tic-monthly-2027-01-19","treasury-coupon-announcement-2027-01-21","vix-expiration-2027-01-20","wef-davos-annual-meeting-2027-01-18"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** This auction has **exactly one piece of information in it, and it is a digit**: the size of
the 2027 10-Year TIPS new issue, published at the **2027-01-14** announcement. The calendar has been
carrying "$21B, flat" as a foregone conclusion. It is not one. Two primary-sourced base rates point
opposite ways and both are strong. **For $21B:** 2026 is the first year since 2020 in which **no TIPS
tenor's new issue rose at all** — 0 of 4 transitions, against 4 of 5 in 2025 — and a long freeze is
ordinary here, the 30-Year having held $9B for **six consecutive** new issues. **Against it:** the
10-Year series has **never** held one size for four consecutive new issues; its runs are 13Bx3, 14Bx3,
15Bx1, 16Bx2, 17Bx3, 18Bx1, 19Bx1, 20Bx1 and now **21Bx3**, and each of the three prior runs that
reached three was ended by a step-up at the fourth — **3 of 3**. So this is the first test of a
fourth, and the honest reading is a genuine fork, not a formality. **The cheapest resolution arrives
91 days early and costs nothing:** `treasury-5y-tips-2026-10-22` is itself a new issue — $27B there
says the freeze broke, $26B says it held. The second finding is a demand base rate nobody on this
calendar had measured: **the January 10-Year TIPS new issue has out-covered its own year's July new
issue 9 of 9 years since 2018** (mean +0.186 bid-to-cover, never once negative), and it survives a
size control and is absent from both the nominal and the 5-Year TIPS controls. Date `estimate`;
`symbols: []`; nothing here licenses an entry.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-09, D-134) | Stand aside | High | Nothing about this auction exists yet — no CUSIP, no size, no when-issued — and the tape at this range is not evidence: over **92 sessions** (this horizon) the 10-year real yield's median absolute move is **27bp** and it clears 25bp **52% of the time**, a coin flip. `symbols: []`, date `estimate`, no rates-keyed house playbook. | Treasury pre-announcing a 2027 TIPS size before the **2026-11-04** refunding — no off-cycle TIPS size action appears anywhere in the 2018-2026 record |
| This week | Watch **2026-09-10**, not this event | Medium | That announcement sizes the 09-17 reopening and is the nearest live read on TIPS issuance discipline; it is also the cheapest test that the **−$2B reopening rule** the whole size argument rests on is still intact. | The 2026-09-10 announcement printing the September 10Y TIPS reopening at anything other than **$19B**, which would break a rule holding **30 of 30** since 2019 and re-open every size claim in this series |
| This month | Watch **`treasury-5y-tips-2026-10-22`** — it is this event's proxy | Medium | It is the next TIPS **new issue** of any tenor, so it is the only place the 2026 freeze can break before January. A **$27B** print re-weights this auction toward **$22B**; **$26B** leaves $21B the base case. Cost: reading one number already on the calendar. | The 2026-10-15 announcement marking that sale a reopening (`RT`), which would remove the only pre-January test of the freeze and push the whole question to 2027-01-14 |
| This quarter | Base case **$21B**, held at **medium** confidence, not high | Medium | The 2026 TIPS-wide freeze (0 of 4) is regime evidence about the present; the cap-at-three is **n=3 in one tenor** with two live counterexamples in the same complex (5-Year ran four at $17B, 30-Year has run six at $9B). Regime evidence outranks a small-n pattern — but not by enough to call it settled. | The **2026-11-04 refunding statement** naming a 2027 TIPS increase, or `treasury-5y-tips-2026-10-22` printing **$27B**; either makes **$22B** the base case months before the announcement |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet.** `symbols: []`, the date is `estimate`, and no house playbook
  (S1/S2/E1/S3/S4 + G1) is rates-keyed. Every call here is a read, not a position.
- **The one number, with both base rates stated:** **$21B** base case. For it — **0 of 4** TIPS
  new-issue transitions rose in 2026, the first such year since 2020. Against it — the 10-Year series
  has **never** run a size four new issues deep, and **3 of 3** three-deep runs ended in a step-up.
- **The 91-day-early test:** `treasury-5y-tips-2026-10-22`, a **new issue**. $27B = freeze broken.
  $26B = freeze held.
- **Demand tell, and it is January-specific:** the January new issue out-covers its own year's July
  new issue **9 of 9** since 2018 (mean **+0.186**, range +0.07 to +0.47). It survives a size control
  (**4 of 4** in the years the two auctions were the same size, mean +0.23) and is **absent** from
  both controls — nominal 10-Year Feb-vs-Aug is 6/9 mean +0.034, 5-Year TIPS Apr-vs-Oct is 4/7 mean
  +0.023. **The mechanism is unidentified:** indirect-bidder share is higher in January in only
  **6 of 9** years, so the obvious explanation fails and this stays a base rate.
- **This is the pair's POLICY-LOADED print, inverting the November sibling's frame.** It prices
  **inside** the FOMC blackout (opens **2027-01-16**) and **D-6** to `fomc-2027-01-27`. Where
  [11-19](treasury-10y-tips-2026-11-19.md) is the year's policy-clean 10Y real-yield print, this one
  is contaminated by construction — and worse than a decision-day auction, because the Fed is silent.
- **Checked and REFUTED, so do NOT carry it over:** the knot-roll artifact the
  [5-Year TIPS ledger](treasury-5y-tips-2026-10-22.md) measured (a new issue mechanically jumping
  Treasury's published breakeven) **does not transfer here**. On the nine January 10-Year TIPS new
  issues the published real 10Y moves **+2.1bp (t = 1.63, only 2 of 9 negative)** and the 10-year
  breakeven **−0.2bp (t = −0.15)** — nothing. The 10-year breakeven is **readable** on 2027-01-21.
- **The week is four sessions.** `mlk-market-closure-2027-01-18` shifts the entire bill slate to
  Tuesday 01-19; a **20-Year bond reopening** auctions D-1 on 2027-01-20; and Treasury announces the
  whole month-end coupon block (2Y, 5Y, 2Y FRN, 7Y notes + bills) the **morning of this auction**.
- **Watch (dated):** announcement **2026-09-10** · **5Y TIPS new issue 2026-10-22 (the proxy test)** ·
  FOMC **2026-10-28** · **refunding 2026-11-04** · 10Y TIPS reopening **2026-11-19** · FOMC
  **2026-12-09** · blackout opens **2027-01-16** · MLK closure **2027-01-18** · 20Y reopening
  **2027-01-20** · **this auction + the month-end announcement 2027-01-21** · FOMC **2027-01-27**.

## Initial research

### The question, plainly

Three sibling ledgers already cover the 10-Year TIPS series — the
[09-17](treasury-10y-tips-2026-09-17.md) and [11-19](treasury-10y-tips-2026-11-19.md) reopenings and
the [11-12 announcement](treasury-coupon-announcement-2026-11-12.md) that sizes the second of them.
Between them the reopening arithmetic is settled: **30 of 30** reopenings print exactly $2B below
their own CUSIP's new issue, and a second reopening equals the first **15 of 15**. Re-deriving any of
that here would be a duplicate.

What none of them can answer is the question this event *is*. A reopening's size is deducible; a
**new issue's size is a decision**, and the 11-12 ledger's own central finding is that the decision
has only ever been taken at a new issue — which makes **2027-01-21 the single venue where the whole
series' size can change**, and the only content this auction carries. So: **what does the record
actually say about whether $21B holds, and is there anything readable before the 2027-01-14
announcement publishes the answer?**

**One-line verdict:** the calendar has been carrying "$21B, flat" as settled and it is not — the
2026 TIPS-wide freeze and an unbroken 10-Year rule that no size survives a fourth new issue point
opposite ways, so this is a **genuine fork resolved cheaply on 2026-10-22**, three months early, by a
5-Year TIPS new issue already on the calendar. Medium impact, no symbols; this licenses reading, never
an entry.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and the
mandated cache bust has nothing to bust (recorded rather than skipped silently). This event existed
only as a proposal
(`proposals/treasury-10y-tips-2027-01-21.from-treasury-10y-tips-2026-11-19.json`, the only one for
this id); it was read in full first per EVENT-RESEARCH.md and **its stated size expectation is
amended rather than inherited** — this session writes the canonical
`src/domain/market-events/treasury-10y-tips-2027-01-21.json` itself. Everything quantitative below is
**primary and fetched this session (2026-09-09)**:

- **Dates, composition and the new-issue marker** —
  `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`, plain curl (HTTP 200, 17,195
  bytes), text layer decompressed stream-by-stream and re-tokenised into `(security, announce,
  auction, settle)` rows, including the PDF's own legend.
- **The issuance base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, two pulls: all
  `inflation_index_security: Yes` rows back to **2018-01-01** (**105 rows**; 52 on the 10-Year leg,
  **18 new issues**; 16 on the 5-Year new-issue leg, 9 on the 30-Year), and all nominal 10-Year
  `Note` rows back to 2018 (**35 new issues**) as the control population.
- **The tape and the artifact test** — Treasury's own **daily par yield curve** and **daily par real
  yield curve** CSVs for **every year 2018 through 2026** (18 files, all HTTP 200), joined on date
  into **2,171 paired sessions** (2018-01-02 → 2026-09-08). Yahoo `^VIX`.

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).
The latest complete session at write time is **2026-09-08** — Treasury's 2026-09-09 curve and that
day's VIX close do not exist yet at 02:00 UTC, and yesterday's readings are used and labelled as such
rather than a same-day number being invented.

### Conviction legs, tested

**1. The date, composition and NEW-ISSUE status are right — SUPPORTED, verbatim, and the marker is
Treasury's own.** The schedule's row reads `10-Year  TIPST / Thursday, January 14, 2027 / Thursday,
January 21, 2027 / Friday, January 29, 2027`. The same PDF carries its own legend — `T --denotes
TIPS`, `R --denotes reopening` — so the absent `R` is **Treasury's marker for a new issue, not our
inference**. The settlement date is consistent with the series: every January 10-Year TIPS new issue
2018-2026 settled on the last business day of January, and 2027-01-29 is that day (01-31 is a Sunday).
The 1:00pm ET bidding deadline is Treasury convention and is **not separately sourced**.

**2. The size is a genuine fork, not the foregone $21B the calendar carries — SUPPORTED, and this is
the doc's central finding.** The proposal that created this entry recorded "$21B is the base case…
after rising every year 2019-2025." Pulling `inflation_index_security: Yes` back to **2018-01-01**
and reading the 10-Year new-issue leg as a run-length sequence rather than a level:

| Size | New issues at it | Ended by |
|---|---|---|
| $13B | 2018-01, 2018-07, 2019-01 (**3**) | step-up 2019-07 |
| $14B | 2019-07, 2020-01, 2020-07 (**3**) | step-up 2021-01 |
| $15B | 2021-01 (1) | step-up 2021-07 |
| $16B | 2021-07, 2022-01 (2) | step-up 2022-07 |
| $17B | 2022-07, 2023-01, 2023-07 (**3**) | step-up 2024-01 |
| $18B / $19B / $20B | 2024-01 / 2024-07 / 2025-01 (1 each) | step-up each time |
| **$21B** | **2025-07, 2026-01, 2026-07 (3)** | **running — 2027-01-21 is the fourth** |

**The 10-Year TIPS new-issue size has never survived a fourth consecutive new issue.** Three runs
reached three; **3 of 3** were ended by a step-up. That is the case for **$22B**, and it is the reason
this ledger will not restate "$21B, flat" as settled.

**3. …but the counterweight is stronger, and it is why $21B stays the base case — SUPPORTED.** Two
independent checks cut against leg 2. First, **the cap-at-three is a 10-Year artifact, not a TIPS
law**: the 5-Year series ran **four** consecutive new issues at $17B (2019-04, 2019-10, 2020-04,
2020-10) and the 30-Year has run **six** at $9B (2021-02 through 2026-02, still running). Second,
**the present regime is a freeze, and it is TIPS-wide**. Counting new-issue-to-new-issue transitions
across all three tenors by year:

| Year | Transitions that raised the size |
|---|---|
| 2021 | 5 / 5 |
| 2022 | 3 / 5 |
| 2023 | 1 / 5 |
| 2024 | 4 / 5 |
| 2025 | 4 / 5 |
| **2026** | **0 / 4** |

**2026 is the first year since 2020 in which no TIPS new issue of any tenor rose.** Regime evidence
about the present outranks an n=3 pattern with live counterexamples — but only far enough to make
$21B a **medium**-confidence base case, not a 30-of-30 formality like a reopening's size. This is
deliberately the **weakest-conditioned size call on this calendar**, and it is stated as such.

**4. The fork resolves 91 days early, cheaply, and the resolver is already on the calendar —
SUPPORTED, and it is the practical output of legs 2 and 3.** `treasury-5y-tips-2026-10-22` is a
**new issue** (`5-Year  TIPST`, no `R`, verified in the same PDF text this session), so it is the
only place the 2026 freeze can break before January. Its own ledger records the size as **$26B,
primary-verified**. A **$27B** print there is a TIPS-wide un-freeze and re-weights this auction toward
$22B; **$26B** leaves the freeze intact and $21B standing. Reading one number already scheduled
beats waiting for 2027-01-14, and it is free.

**5. The January new issue reliably out-covers the July one, and nobody had measured it —
SUPPORTED, controlled, and it is this doc's second finding.** Pairing each year's two 10-Year TIPS
new issues:

| Year | January b/c | July b/c | Gap |
|---|---|---|---|
| 2018 | 2.69 | 2.22 | +0.47 |
| 2019 | 2.42 | 2.28 | +0.14 |
| 2020 | 2.33 | 2.24 | +0.09 |
| 2021 | 2.68 | 2.50 | +0.18 |
| 2022 | 2.30 | 2.18 | +0.12 |
| 2023 | 2.79 | 2.51 | +0.28 |
| 2024 | 2.62 | 2.38 | +0.24 |
| 2025 | 2.48 | 2.41 | +0.07 |
| 2026 | 2.38 | 2.30 | +0.08 |

**9 of 9, mean +0.186, minimum +0.07 — never once negative or even tied.** Three checks keep it from
being a coincidence of a rising-issuance era. **Size control:** in the four years the two auctions
were the *same size* (2018 $13B, 2020 $14B, 2023 $17B, 2026 $21B) January still won **4 of 4**, mean
**+0.23** — so it is not the mechanical "January is the smaller auction" effect (January is never
larger, and is smaller in 5 of 9 years). **Cross-market control:** the nominal 10-Year note's
Feb-vs-Aug new-issue pairing is **6 of 9, mean +0.034** — noise. **Within-TIPS control:** the 5-Year
TIPS Apr-vs-Oct pairing is **4 of 7, mean +0.023** — noise. So the effect is specific to the
10-Year TIPS January slot rather than a general Treasury or TIPS seasonal.

**6. The obvious mechanism for leg 5 FAILS, and it is recorded so it is not re-proposed — REFUTED.**
The attractive explanation is a January reset of foreign and real-money allocations showing up as
indirect-bidder demand. On the means it looks right (January indirect share **68.2%** vs July
**65.4%**), but year by year January is higher in only **6 of 9** — against 9 of 9 on the cover
itself — and primary-dealer share is effectively identical (11.5% vs 11.8%). A mechanism that
explains the result should be at least as consistent as the result. **The cause is unidentified**, and
leg 5 stands as a base rate rather than a theory.

**7. This is the POLICY-LOADED print of the pair, which inverts the November sibling's framing —
SUPPORTED, calendar arithmetic.** The [11-19 ledger](treasury-10y-tips-2026-11-19.md) grades that
auction the better instrument because it is the year's only 10Y real-yield print with no FOMC
decision inside its window. 2027-01-21 is the opposite case on both counts: `fomc-blackout-start-2027-01-16`
opens **five days before** it and `fomc-2027-01-27` lands **six days after**. That is a worse
signal environment than a decision-day auction, not a better one — the meeting is close enough to be
priced into the session but the Fed is **silent**, so the stop absorbs positioning for a decision no
official commentary can anchor. Practical consequence: **do not read this auction's stop as a clean
supply-and-inflation-expectations signal**, which is exactly what 11-19's stop can be read as.

**8. The knot-roll artifact does NOT transfer to the 10-Year January new issue — REFUTED, and this
leg exists to stop a correct finding being over-generalised.** The
[5-Year TIPS ledger](treasury-5y-tips-2026-10-22.md) established, from Treasury's own words, that
the real curve uses "the most recently auctioned TIPS as knot points," and measured a large artifact
on October 5-Year new issues (published real 5Y **−11.0bp, t = −7.60, 0 of 7 positive**; 5-year
breakeven **+14.6bp, 7 of 7**). Since this event is also a new issue, the same mechanism should apply
to the 10-year knot. **It does not.** Joining all 18 years of par and real curves into **2,171 paired
sessions** and differencing each auction date against its prior session:

| Population | n | Δ real 10Y | Δ breakeven 10Y |
|---|---|---|---|
| **January 10Y TIPS new issues** | 9 | **+2.1bp** (t = 1.63, 2/9 negative) | **−0.2bp** (t = −0.15) |
| July 10Y TIPS new issues | 9 | −3.1bp (t = −2.74, 8/9 negative) | +2.9bp (t = 1.63) |
| 10Y TIPS reopenings (control) | 34 | +2.7bp (t = 3.08) | −1.6bp (t = −2.21) |
| All paired sessions (baseline) | 2,170 | +0.09bp | +0.02bp |

The January cell — the one that governs this event — is **indistinguishable from noise in both
columns**. Two further reasons not to promote the July cell into a finding despite its t-statistic:
it is n=9 with no mechanism that distinguishes January from July (both roll the on-the-run forward by
the same six months), and the **reopening control is also significant**, which a pure knot story does
not predict, since a reopening creates no new on-the-run at all. The whole 10-year effect set reads as
drift. **Practical consequence, and it is the useful half:** the 10-year breakeven is **readable** on
2027-01-21, so the reading instruction the 5-Year ledger wrote for its own auction must **not** be
carried across, and the breakeven-based framing the 11-19 sibling registered a forward test on
survives into January intact.

**9. The tape at D-134 is not evidence, and the horizon is quantified rather than waved at —
SUPPORTED.** From the same 2,171 paired sessions, over a **92-session** forward window (this event's
horizon in trading days), the absolute change in the 10-year **real** yield has a **median of 27bp**,
p75 **50bp**, p90 **79bp**, and exceeds 25bp in **52%** of windows — a coin flip. The 10-year
**breakeven** is roughly half as mobile: median **14bp**, p90 **46bp**, exceeding 25bp only **29%** of
the time. So today's levels — nominal 10Y **4.80%**, real 10Y **2.43%**, breakeven **2.37%** (all
2026-09-08 close, the latest published session) — are worth **recording as an anchor**, and the
breakeven is the half of the pair worth anchoring on, but neither is a forecast of January.

**10. The session is structurally crowded, and three of the four crowders are new to this doc —
SUPPORTED.** Read from the same PDF text: `mlk-market-closure-2027-01-18` compresses the week to four
sessions and pushes the entire Monday bill slate to **Tuesday 01-19**; a **20-Year bond reopening**
(`20-Year  BONDR`) auctions **D-1** on 2027-01-20; and Treasury announces the whole month-end coupon
block — `2-Year NOTE`, `5-Year NOTE`, `2-Year FRN`, `7-Year NOTE` plus the 13/26/6-week bills — on the
**morning of 2027-01-21**, ~11:00 ET, two hours before this auction's 1:00pm deadline. That last
overlap is the same structure the 11-19 sibling measured to 6 of 7 years for the November slot,
recurring in January; both announcement sessions are proposed as new entries in this PR. **Honest
calibration, inherited from that sibling:** the four coupons will already be sized by the 2026-11-04
refunding, so the 11:00 print is normally a confirmation — the live part is the bill block.

**11. The CUSIP does not exist, and nothing in this doc pretends otherwise — SUPPORTED as a limit.**
A new issue's CUSIP is created at announcement, so there is no security to look up and none is
guessed. treasurydirect's `TA_WS/securities/upcoming` reached only 2026-09-17 when the 11-19 sibling
pulled it a day ago and cannot reach 2027 by construction. Every claim above is about the **series**,
never about a specific security.

**12. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`. The
duration channel that reaches this calendar's names is the long-end *yield*, and the
[09-17 sibling](treasury-10y-tips-2026-09-17.md) already carries the sensitivity tier (CRWV highest,
then NVDA/AVGO/MRVL, then mega-cap). Re-deriving it would be a duplicate.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What they
support is a **watch order with a date on it**, and it differs from every sibling in this series
because this event's content is a decision rather than a deduction:

1. **Read `treasury-5y-tips-2026-10-22`'s size as this event's proxy**, on 2026-10-22, three months
   early. It is the only pre-January test of the 2026 TIPS freeze and it costs one number.
2. **Read the 2026-11-04 refunding statement's TIPS FINANCING paragraph for 2027 language**, not just
   for the November reopening size the 11-12 sibling already owns.
3. **When the print lands, benchmark the cover against the January base rate, not the series
   average** — January new issues have run 2.30 to 2.79 against July's 2.18 to 2.51.
4. **Do not read the stop as a clean supply signal** (leg 7), and **do read the breakeven** (leg 8).

### Honest limits

**The date is `estimate` and the schedule is tentative by Treasury's own label**; this lane may not
self-confirm it. **The size is a forecast of a decision, not a deduction from a rule** — unlike every
reopening size in this series, and it is the first size call on this calendar where the governing cell
is empty (no 10-Year TIPS size has ever faced a fourth new issue). **The cap-at-three rule is n=3**,
inside one tenor, in a period of secular TIPS expansion, with two counterexamples in adjacent tenors —
it is reported because it is real and because ignoring it would have been the comfortable error, not
because it is strong. **The 9-of-9 January result is n=9 and one of many pairings a researcher could
have run**; the two controls and the size control are what make it worth stating, and the mechanism
failing (leg 6) is what keeps it a base rate. **Bid-to-cover is a coarse demand measure** and says
nothing about the tail to when-issued, which fiscaldata does not publish. **The knot-roll refutation
is a null result on n=9** — it cannot prove no artifact exists, only that none is detectable at a size
that would matter, and the July cell is a loose end named rather than buried. **The ~11:00 ET
announcement time is unsourced convention.** **Today's tape is the 2026-09-08 close**, the latest
published session at write time, not a same-day reading. Medium impact and `symbols: []` mean nothing
here licenses a trade.

## Stance & kill switches

**Stance (date `estimate`; the size is FORECAST not deduced; every figure from primary data re-pulled
this session).** Watch-only, no standalone play — as with every rates event on this calendar. The
doc's durable outputs are four, each derived here rather than inherited:

**(a) The size is a fork, and the calendar was carrying it as settled.** For **$21B**: 2026 is the
first year since 2020 with **0 of 4** TIPS new-issue increases across all tenors, and the 30-Year has
held $9B for six consecutive new issues, so a long freeze is ordinary. Against it: the 10-Year series
has **never** run one size four new issues deep, and **3 of 3** three-deep runs ended in a step-up.
$21B is the base case at **medium** confidence — deliberately the weakest-conditioned size call in
this series.

**(b) The fork resolves 91 days early on `treasury-5y-tips-2026-10-22`**, itself a new issue: $27B
means the freeze broke, $26B means it held. This is the practical output of (a) and it costs nothing.

**(c) The January demand asymmetry, previously unmeasured here:** the January 10-Year TIPS new issue
out-covers its own year's July new issue **9 of 9** since 2018 (mean **+0.186**, never negative),
surviving a size control (4 of 4 in equal-size years) and absent from both the nominal Feb-vs-Aug
control (6/9) and the 5-Year TIPS Apr-vs-Oct control (4/7). **Mechanism unidentified** — the
indirect-share explanation fails at 6 of 9.

**(d) Two reading instructions that point opposite ways to the siblings'.** This is the pair's
**policy-loaded** print — inside the blackout from 2027-01-16, D-6 to `fomc-2027-01-27` — where 11-19
is the clean one, so its **stop** is not a clean supply signal. But the 5-Year ledger's knot-roll
artifact **does not transfer**: January 10-Year new issues move the published 10-year breakeven
**−0.2bp (t = −0.15)** across nine observations, so the **breakeven is readable**.

**One thing this doc deliberately does NOT re-register.**
[`FT-treasury-coupon-announcement-2026-11-12-2`](../forward-tests/treasury-coupon-announcement-2026-11-12.md)
already tests the *asymmetry mechanism* — that a TIPS size change never expresses at a reopening — and
its own text names this January new issue as where an increase would surface instead. That test is
about the **November reopening's** $19B. The test registered below is about the **January new issue's
own digit**, which no open test touches, and the two score in opposite directions on the same regime:
a $19B November plus a $22B January would confirm both.

**Forward tests registered** in
[`forward-tests/treasury-10y-tips-2027-01-21.md`](../forward-tests/treasury-10y-tips-2027-01-21.md):

- **`FT-treasury-10y-tips-2027-01-21-1`**, scoreable **2027-01-22** — the 2027 10-Year TIPS new issue
  prints **$21B**, the freeze surviving a fourth consecutive new issue that no size in this series has
  ever survived. The size fork, taken on the regime side, at medium confidence.
- **`FT-treasury-10y-tips-2027-01-21-2`**, scoreable **2027-01-22** — the auction's bid-to-cover is
  **≥ 2.30**, the level its own preceding July new issue printed. The January asymmetry tested out of
  sample; uncorrelated with the first, which is an issuance-policy test with no demand content.

**Kill switches:**

- **A 2027-01-21 size other than $21B** — the freeze broke and the cap-at-three rule was the better
  guide. Every "the TIPS grid is frozen" line in this series' ledgers gets re-derived rather than
  patched, and the 2026-11-04 refunding is re-read as having signposted it.
- **`treasury-5y-tips-2026-10-22` printing $27B** — kills the base case **91 days early** and is the
  cheapest observation in this doc. $22B becomes the January base case before any January document
  exists.
- **A bid-to-cover below 2.30** — the January asymmetry's first out-of-sample failure. Nine of nine
  January new issues have cleared 2.30, and no January print has ever landed in July's lower half.
- **A TIPS size change printing at a reopening** — anywhere. Never observed since 2018; it would
  break the asymmetry that makes this event the sole venue for a size change and demote it from
  "the only place the number can move" to one auction among several.
- **The 2027-01-21 row acquiring an `R`** on a later schedule — it becomes a reopening, the size
  becomes deducible from the −$2B rule, and this doc's entire subject dissolves.
- **A policy event landing inside 2027-01-19 → 2027-01-22**, or the January FOMC moving — voids
  rather than kills the policy-loaded framing in (d).
- **Treasury moving the 2027-01-14 announcement or the 2027-01-21 auction off those dates** — voids
  rather than kills; announced-elsewhere is a different question than announced-here.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-09 | D-134 | **Initial research.** **Canonical file written by this session** — the event existed only as `proposals/treasury-10y-tips-2027-01-21.from-treasury-10y-tips-2026-11-19.json`, the only proposal for this id, read in full first per EVENT-RESEARCH.md, and **its size expectation amended rather than inherited**. **Date verified verbatim** from the Tentative Auction Schedule PDF (plain curl, HTTP 200, 17,195 bytes, text layer decompressed this session): `10-Year  TIPST / Thursday, January 14, 2027 / Thursday, January 21, 2027 / Friday, January 29, 2027`, with the PDF's own legend `T --denotes TIPS` / `R --denotes reopening` also read verbatim — so **NEW ISSUE is Treasury's marker, not our inference**. **FINDING 1 — the size is a genuine fork and the calendar was carrying it as settled.** The proposal recorded "$21B is the base case." Re-pulling fiscaldata `auctions_query` (`inflation_index_security: Yes`, back to **2018-01-01**, 105 rows, 52 on the 10-Year leg, **18 new issues**) as a run-length sequence: 13Bx3 → step, 14Bx3 → step, 15Bx1, 16Bx2, 17Bx3 → step, 18Bx1, 19Bx1, 20Bx1, and now **21Bx3 running**. **The 10-Year TIPS new-issue size has never survived a fourth consecutive new issue — 3 of 3 three-deep runs ended in a step-up** — which is the live case for **$22B**. **FINDING 2 — the counterweight is stronger, so $21B stays the base case at MEDIUM confidence.** The cap-at-three is a **10-Year artifact, not a TIPS law**: the 5-Year ran **four** at $17B (2019-04 → 2020-10) and the 30-Year has run **six** at $9B (2021-02 → 2026-02, still running). And the present regime is a freeze: counting new-issue transitions across all three tenors, **2026 is 0 of 4 — the first year since 2020 with no TIPS increase anywhere** (2021 5/5, 2022 3/5, 2023 1/5, 2024 4/5, 2025 4/5). Regime evidence beats an n=3 pattern, but not by enough to call it settled; stated as the **weakest-conditioned size call on this calendar**. **FINDING 3 — the fork resolves 91 days early and free.** `treasury-5y-tips-2026-10-22` is itself a **new issue** (`5-Year  TIPST`, no `R`, verified in the same PDF text), so it is the only place the freeze can break before January: **$27B = broken** and January re-weights to $22B; **$26B = held**. **FINDING 4 — the January demand asymmetry, previously unmeasured on this calendar.** The January 10-Year TIPS new issue out-covers **its own year's July new issue 9 of 9 years since 2018** — 2018 +0.47, 2019 +0.14, 2020 +0.09, 2021 +0.18, 2022 +0.12, 2023 +0.28, 2024 +0.24, 2025 +0.07, 2026 +0.08 — **mean +0.186, minimum +0.07, never negative**. **Size-controlled:** in the four equal-size years (2018 $13B, 2020 $14B, 2023 $17B, 2026 $21B) January still won **4 of 4**, mean **+0.23**. **Not a general seasonal:** the nominal 10-Year Feb-vs-Aug control is **6/9 mean +0.034** (n=35 new issues) and the 5-Year TIPS Apr-vs-Oct control is **4/7 mean +0.023** — both noise. **Checked and REFUTED — the mechanism, recorded so it is not re-proposed:** indirect-bidder share is higher in January in only **6 of 9** years (means 68.2% vs 65.4%) and primary-dealer share is flat (11.5% vs 11.8%), so the allocation-reset explanation fails and this stays a base rate, not a theory. **FINDING 5 — this is the pair's POLICY-LOADED print, inverting the 11-19 sibling's frame.** It prices **inside the FOMC blackout** (`fomc-blackout-start-2027-01-16`, five days earlier) and **D-6** to `fomc-2027-01-27` — worse than a decision-day auction, because the meeting is close enough to be priced but the Fed is silent. Where 11-19 is the year's clean real-yield print, this stop is **not** a clean supply-and-inflation signal. **FINDING 6 — the 5-Year ledger's knot-roll artifact does NOT transfer, and that is the useful half.** Joining Treasury's par and real curves for **every year 2018-2026** (18 CSVs, all HTTP 200) into **2,171 paired sessions** and differencing each auction date against its prior session: **January 10Y TIPS new issues move the published real 10Y +2.1bp (t = 1.63, only 2/9 negative) and the 10-year breakeven −0.2bp (t = −0.15)** — noise, against the 5-Year October artifact of −11.0bp real / +14.6bp breakeven, 7/7. July 10Y new issues show −3.1bp real (t = −2.74) but are **not promoted to a finding**: n=9, no mechanism distinguishes January from July (both roll the on-the-run six months), and the **reopening control is also significant (+2.7bp, t = 3.08)**, which a pure knot story cannot produce since a reopening creates no new on-the-run. **So the 10-year breakeven is READABLE on 2027-01-21** and the 5-Year ledger's "do not read the breakeven" instruction must not be carried across. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro / event tape:** nominal 10Y **4.80%**, real 10Y **2.43%** (2026 max 2.47), **breakeven 2.37%** — 76th percentile of 172 2026 sessions, 2026 range 2.18–2.50 — all the **2026-09-08 close**, the latest published session at write time (Treasury's 09-09 curve does not exist at 02:00 UTC; labelled, not invented). **Horizon quantified rather than asserted:** over a **92-session** forward window the 10-year real yield's median absolute move is **27bp** (p75 50, p90 79) and it clears 25bp **52%** of the time, while the breakeven's is **14bp** (p90 46, >25bp only 29%) — so the real yield at D-134 is a coin flip and the breakeven is the half worth anchoring. **Volatility:** **VIX 15.72** (2026-09-08 close) vs 14.53 on 09-04 — +1.19, inside the 3-point threshold. **Geopolitical:** the energy leg driving the 2026 breakeven is carried from the 09-17 and 11-19 siblings as their finding, not re-fetched. **Session structure:** `mlk-market-closure-2027-01-18` makes it a **four-session week** and pushes the whole Monday bill slate to Tuesday 01-19; a **20-Year bond reopening auctions D-1** on 2027-01-20; and Treasury announces the entire month-end coupon block (2Y, 5Y, 2Y FRN, 7Y notes + 13/26/6-week bills) the **morning of this auction**, ~11:00 ET, two hours before the 1:00pm deadline — the same overlap the 11-19 sibling measured to 6 of 7 years for November, recurring in January. **Corridor: 11 tracked entries within ±5 days**, including this session's own same-day announcement proposal. **TWO dated adjacent events PROPOSED as `estimate` in this PR:** `treasury-coupon-announcement-2027-01-14` (the venue where this auction's whole information content — the size — becomes public, and the first 2027 instance of a class the calendar already tracks for every 2026 block) and `treasury-coupon-announcement-2027-01-21` (finding 5's shared session). **Deliberately NOT filed, with the reason recorded:** the 20-Year bond reopening 2027-01-20 and the four month-end coupons (2Y 01-25, 5Y 01-26, 2Y FRN 01-27, 7Y 01-28) — their natural owner is the 01-14 or 01-21 announcement respectively, exactly the discipline the 11-19 sibling applied when it declined the Thanksgiving-week legs. **CUSIP not guessed:** a new issue's CUSIP is created at announcement, so there is no security to look up and every claim here is about the series. **No re-registration of `FT-treasury-coupon-announcement-2026-11-12-2`**, which tests the asymmetry *mechanism* at the November reopening; this doc tests the January *digit*. **`FT-treasury-10y-tips-2027-01-21-1`** ($21B prints, scores 2027-01-22) and **`FT-treasury-10y-tips-2027-01-21-2`** (bid-to-cover ≥ 2.30, scores 2027-01-22) **registered**. **All sources returned HTTP 200; nothing blocked this session.** | **Stance set** — watch-only. The size is a **genuine fork**, not the settled $21B the calendar carried: the 2026 TIPS-wide freeze (**0 of 4**) says flat, the 10-Year's never-four-deep rule (**3 of 3**) says step, and `treasury-5y-tips-2026-10-22` resolves it **91 days early**. January out-covers July **9 of 9**. **Policy-loaded**, not clean; **breakeven readable**, knot artifact refuted | 2026-09-30 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-10y-tips-2027-01-21.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory — after which this doc goes quiet.
