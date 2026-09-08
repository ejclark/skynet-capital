# Treasury coupon announcement (20Y new issue + 10Y TIPS reopening + 13/26/6-week bills) — treasury-coupon-announcement-2026-11-12

**Kind:** rates · **Date:** 2026-11-12 (estimate, EST: treasury.gov Tentative Auction Schedule PDF, text layer decompressed direct 2026-09-08, HTTP 200, 17,195 bytes — five rows carry announce date `Thursday, November 12, 2026`; stays `estimate` because a tentative schedule is tentative by construction and this lane may not self-confirm an event discovered in-sweep) · **Impact:** medium
**Last assessed:** 2026-09-08
<!-- probe-ref: {"symbols":{},"vix":15.40,"daysBand":"medium:31+","adjacentIds":["boj-summary-of-opinions-2026-11-10","cpi-2026-11-10","existing-home-sales-2026-11-12","import-export-prices-2026-11-17","industrial-production-2026-11-17","msft-ignite-2026-11-17","mtis-2026-11-17","mts-october-2026-11-12","nahb-hmi-2026-11-17","ppi-2026-11-13","retail-sales-2026-11-17","russell-recon-preliminary-2026-11-13","sifma-bond-market-closure-2026-11-11","treasury-30y-bond-2026-11-12","us-china-tariff-truce-expiry-2026-11-10","wholesale-trade-2026-11-09"],"screenStreak":0,"blocked":[]} -->

## At a glance

**TL;DR.** **This is the first coupon announcement in the cycle whose sizes no current Treasury
document names — and it is two different events wearing one label.** Its **coupon** legs are
deducible today without any published guidance: the 20-Year is the quarterly **new issue**, which has
printed **$16B for 13 consecutive new issues since 2023-08-23** (44 auctions in the window, zero
deviations), and the 10-Year TIPS leg is the **second reopening of CUSIP 91282CRE3**, which sold at
$21B on 2026-07-23 — reopenings run exactly $2B below their own CUSIP's new issue **14 of 14** times,
and a second reopening has equalled the first **7 of 7** times, giving **$19B** twice over. Its
**bill** legs are the opposite: 13-week ($92B) and 26-week ($79B) are pinned, but the 6-week is the
live adjustment lever (95 → 85 → **75** across 08-25/09-01/09-08) and `sb0590` says in writing that
Treasury *"anticipates increasing auction sizes across the bill curve"* for seasonal outflows. **So
this is not the scheduled nil its September and October siblings were** — the genuinely unpublished
numbers here are real, they sit in the bills, and Treasury has pre-announced that they move. One date
can change any of it: the **2026-11-04 refunding**, eight days ahead. Date is `estimate`; nothing
here is a trade, and `symbols: []`.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-08, D-65) | Stand aside | High | Nothing dated between now and **2026-11-04** can reach this event's numbers. `symbols: []`, date `estimate`, no rates-keyed house playbook, and Treasury has published nothing issuance-related since the 08-05 refunding (press index re-read this session; its newest item, **2026-09-08**, is an Iran sanctions action). | Treasury changing a coupon size or running an off-cycle issuance action **before 2026-11-04** — 2026 has seen exactly **one** CMB (2026-05-21, 27-day, $25B) and no coupon change at all |
| This week | Stand aside — this event has no channel open | High | The **09-10** and **09-17** items in this corridor belong to the September cycle `sb0590` already published by name; they carry no November information. The next document that does is 65 days out. | The **2026-09-10** announcement printing off `sb0590`'s published 20Y **$13B** / TIPS **$19B** — the grid would be broken 63 days before this event reads it |
| This month | Watch **2026-10-15** and **2026-10-22**, don't act | Medium | Those are the **last two** announcements `sb0590`'s Oct-26 table covers. A print that matches is near-uninformative; a print that misses is the earliest dated tell that the issuance path is turning ahead of the November refunding — the single cheapest read on this event available before November. | Either October announcement printing a size off `sb0590`'s Oct-26 row (`69 58 70 44 39 13 22 30`) — this doc's coupon calls would be re-derived, not patched |
| This quarter | Read **2026-11-12** as a **two-speed release**: treat the coupon legs as settled (**$16B** / **$19B**) and the **bill** legs as the only genuinely new numbers in it. Still no position. | Medium | No nominal coupon or FRN size has changed anywhere since **April 2024** — ~29 months and ten refundings, each carrying *"maintaining … for at least the next several quarters."* The bills are where `sb0590` explicitly reserves the flexibility, and where it has already said it will use it. | The **2026-11-04** refunding publishing a Nov-26 **20-Year cell other than 16**, or dropping *"for at least the next several quarters"* — registered as [`FT-…-11-12-1`](../forward-tests/treasury-coupon-announcement-2026-11-12.md), scores **2026-11-19**; [`FT-39`](../forward-tests.md) owns the guidance-language leg |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on an announcement.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is rates-keyed.
- **The two coupon numbers, deduced and quotable with their base rates:** 20Y **new issue $16B**
  (13/13 since 2023-08-23), 10Y TIPS **reopening $19B** (14/14 on the −$2B rule, 7/7 on
  second-equals-first). Neither is published today; both become published **2026-11-04**.
- **The bill legs are the honest unknown** — and the one part of this release that can carry
  information. 13-week $92B and 26-week $79B pinned since the 2026-06-29 quarter turn; **6-week $75B
  and falling**, with an October step-up stated in writing.
- **The TIPS leg is the *more* certain of the two coupons, not the less** — the inverse of the
  09-10 event, where both were published. A TIPS size change has **never** expressed at a reopening:
  every step in the series (17→18→19→20→21) landed on a January or July **new issue**. Even a TIPS
  increase announced 11-04 would structurally surface in **January 2027**, not here.
- **2026-11-04 is the whole risk, and it is one date.** Watch the borrowing estimates **11-02** into
  the refunding **11-04**; the first post-midterm (**11-03**) refunding is the natural place for a
  guidance change to be signalled, and Reuters (via Yahoo, **2026-05-06**, four months stale and
  labelled as such) reported dealers expecting nominal increases *"early next year."*
- **No reaction to this announcement will ever be measurable** — its session also carries the 30-Year
  refunding auction (1:00pm ET), the 4/8/17-week bill auctions, the October MTS and Existing-Home
  Sales, one day after a **full Veterans Day bond closure**. The honest measurable is the sizes.
- **Watch (dated):** announcements **09-10** · **10-15** · **10-22** (last two `sb0590` covers) ·
  bills-only **10-29** · borrowing estimates **11-02** · midterms **11-03** · **refunding 11-04 (the
  table can change)** · 3Y **11-09** · CPI + 10Y **11-10** · **bond market closed 11-11** · **this
  announcement + 30Y auction + MTS 11-12** · PPI **11-13** · 20Y **11-18** · 10Y TIPS **11-19**.

## Initial research

### The question, plainly

Every coupon-announcement ledger before this one could answer its question by reading a document.
`sb0590` — Treasury's 2026-08-05 quarterly refunding statement — publishes an anticipated-auction-size
table and a TIPS paragraph that between them name every size announced through **2026-10-22**. That
table's last row is **Oct-26**. So: **2026-11-12 is the first announcement in this series whose
numbers no current Treasury primary publishes.** The question is therefore genuinely different from
its siblings': *with the document exhausted, what is actually deducible, what is not, and what does
the split imply about how to read the release?*

**One-line verdict:** the release splits cleanly — its **coupon** legs are deducible from base rates
strong enough to stand without guidance (**20Y $16B**, **10Y TIPS $19B**), its **bill** legs are not
deducible at all and are the only part carrying real information, and the entire risk to the first
half sits on **one date eight days earlier**, 2026-11-04.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). This event
existed only as a proposal (`proposals/treasury-coupon-announcement-2026-11-12.from-treasury-coupon-announcement-2026-09-10.json`,
2026-09-08); that proposal was read in full first, and this session writes the canonical
`src/domain/market-events/treasury-coupon-announcement-2026-11-12.json` itself. Everything
quantitative below is **primary and fetched this session (2026-09-08)**, never from memory or from
the proposing sweep's summary:

- **The dates and composition** — `home.treasury.gov/system/files/221/Tentative-Auction-Schedule.pdf`,
  plain curl (HTTP 200, 17,195 bytes), text layer decompressed stream-by-stream and re-tokenised into
  `(type, announce, auction, settle)` rows. treasurydirect's `TA_WS/securities/upcoming` was **not**
  used: it does not reach November, which is stated rather than glossed.
- **The guidance** — `home.treasury.gov/news/press-releases/sb0590`, fetched direct (HTTP 200, 75,579
  bytes), tag-stripped and read in full — specifically to establish what it does **not** cover.
- **The base rates** — `api.fiscaldata.treasury.gov` `auctions_query`, four pulls: all `Bond` rows
  since 2023-01-01 (97 rows, 44 of them 20-Year); all `inflation_index_security: Yes` rows since
  2023-01-01 (44); all 2026 auctions (301); and all Note/Bond rows 2023-06→2025-12 (for the
  last-size-change search). Sorted `-auction_date` explicitly.
- **The tape** — Treasury's own 2026 daily par-yield-curve CSV (HTTP 200, 171 rows) and Yahoo `^VIX`.
- **The press check** — `home.treasury.gov/news/press-releases` index (HTTP 200, 71,182 bytes).

All sources returned HTTP 200; **nothing was blocked this session** (`probe-ref.blocked` is empty).

### Conviction legs, tested

**1. The event fires 2026-11-12 and publishes FIVE securities, not two — SUPPORTED, and this
corrects the proposal that created it.** The proposing sweep named the 20Y and the 10Y TIPS. The
tentative schedule carries **five** rows on `Thursday, November 12, 2026`:

| Security | Auction | Settlement |
|---|---|---|
| `13-Week BILL` | Monday, November 16, 2026 | Thursday, November 19, 2026 |
| `26-Week BILL` | Monday, November 16, 2026 | Thursday, November 19, 2026 |
| `6-Week BILL` | Tuesday, November 17, 2026 | Thursday, November 19, 2026 |
| `20-Year BOND` — **no `R`, a new issue** | Wednesday, November 18, 2026 | Monday, November 30, 2026 |
| `10-Year TIPS R T` — reopening | Thursday, November 19, 2026 | Monday, November 30, 2026 |

Same class of correction the [`10-22 sibling`](treasury-coupon-announcement-2026-10-22.md) made
(*"EIGHT securities … not the four this title originally named"*), and it is load-bearing here rather
than cosmetic, because legs 2–4 show the two halves have **opposite** information content.

**2. The 20Y coupon leg is deducible without any guidance — SUPPORTED, n=44, zero deviations.**
Every 20-Year auction since 2023-01-01 (`auctions_query`, 44 rows): **15 new issues** — the first two
(2023-02-15, 2023-05-17) at $15B and **13 consecutive at $16B since 2023-08-23** — and **29
reopenings**, one at $12B and the rest at **$13B since 2023-09-19**. The November slot is a **new
issue** on a Feb/May/Aug/Nov cycle that has held four years: **2023-11-20, 2024-11-20, 2025-11-19**
were all November new issues at $16B, and 2026-11-18 is the fourth. `sb0590`'s own table displays the
same structure twice — its 20-Year column reads `16 · 13 · 13 · 16 · 13 · 13` across May→Oct, so the
new-issue months are $16B and the reopening months $13B, and **November is a new-issue month**. The
number is not published; the *shape* that generates it is, in the same document, twice.

**3. The TIPS leg is the MORE certain of the two coupons — SUPPORTED, and it is this doc's finding.**
Using `inflation_index_security` (the field the [09-10 sibling](treasury-coupon-announcement-2026-09-10.md)
established, re-confirmed here), the 10-Year TIPS series since 2023 is perfectly regular:

| CUSIP | New issue | 1st reopening (Sep) | 2nd reopening (Nov) |
|---|---|---|---|
| 91282CHP9 | 2023-07-20 **$17B** | 09-21 $15B | 11-21 $15B |
| 91282CLE9 | 2024-07-18 **$19B** | 09-19 $17B | 11-21 $17B |
| 91282CNS6 | 2025-07-24 **$21B** | 09-18 $19B | 11-20 $19B |
| **91282CRE3** | **2026-07-23 $21B** | 09-17 → $19B | **11-19 → $19B predicted** |

Three independent regularities agree: reopenings sit **exactly $2B below their own CUSIP's new issue,
14 of 14** across 8 CUSIPs; a **second reopening equals the first, 7 of 7**; and every July new issue
since 2023 has been reopened exactly twice, in September and November, **3 of 3**. **The asymmetry
that makes this the safer leg:** a TIPS size change has never expressed at a reopening. Every step in
the series (17 → 18 → 19 → 20 → 21) landed on a **January or July new issue** — so even a TIPS
increase announced on 2026-11-04 would structurally surface at the **January 2027** new issue, not
here. The ratchet has in any case been flat for **three consecutive new issues** ($21B: 2025-07,
2026-01, 2026-07) and **five consecutive reopenings** ($19B), having risen every year 2023→2025.

**4. The bill legs are NOT deducible, and Treasury has said in writing that they move — SUPPORTED,
and this is what stops the release being a scheduled nil.** 2026 bill sizes (`auctions_query`, 301
rows): **13-week $92B** and **26-week $79B** unchanged for every auction back through 2026-07-20;
**6-week** running **95 → 95 → 95 → 95 → 95 → 85 → 75** across 07-21 → 09-08. `sb0590`'s BILL
ISSUANCE paragraph pre-announces both moves verbatim — *"Treasury expects to implement reductions to
shorter-dated bill auction sizes during the month of September"* and *"In October, Treasury
anticipates increasing auction sizes across the bill curve based on expected seasonal fiscal
outflows."* So by November the bill grid will have been deliberately moved twice, in opposite
directions, by an issuer that has told us only the direction. That is a real unknown, and it is
**three of this announcement's five securities**.

**5. The channel does not expire — it re-publishes, and the risk is one date — SUPPORTED,
inheriting a sibling's correction rather than re-deriving it.** `sb0590`'s table ends at **Oct-26**
(verified in the fetched text this session: the final row reads `Oct-26  69 58 70 44 39 13 22 30`).
The [09-10 ledger](treasury-coupon-announcement-2026-09-10.md) first called 2026-11-12 the channel's
*expiry* and corrected itself on 2026-09-08: the **2026-11-04 refunding lands eight days earlier**
and publishes the Nov/Dec/Jan table exactly as `sb0590` did on 08-05 for Aug/Sep/Oct — the same
eight-to-thirty-six-day lead. That correction is registered as `FT-…-09-10-2` and is **not
re-registered here**; this doc takes it as given and asks the question it leaves open: not *will the
table exist*, but *what will be in it*.

**6. The base rate on "will 11-04 move the grid" is much stronger than any prior ledger recorded —
SUPPORTED, derived this session.** Walking every Note/Bond size series from 2023-06 forward and
marking each change: the 2023–24 increase cycle ran **2023-08 → 2024-04** and then stopped dead. Last
increases anywhere: **10-Year new issue 2024-02-07** (40→42), **30-Year new issue 2024-02-08**
(24→25), **10Y/30Y reopenings 2024-03-12/13**, **5-Year 2024-04-24** (67→70), **7-Year 2024-04-25**
(43→44), **2-Year FRN new issue 2024-04-24** (28→30). The 20-Year new issue never moved in the window
at all. **That is ~29 months and ten quarterly refundings without a single nominal coupon or FRN size
change**, every one of them carrying `sb0590`'s sentence: *"Based on current projected borrowing
needs, Treasury anticipates maintaining nominal coupon and FRN auction sizes for at least the next
several quarters."* Method caveat, independently reproduced here: `original_security_term` is
unreliable — **2026-01-26 CUSIP 91282CGH8, a 2-Year note at $69B, is tagged `5-Year`** — so tenor
series must be read with `security_term` and size, not the label alone.

**7. The grid does not respond to the tape — SUPPORTED, re-derived, n=67.** All **67** nominal coupon
and FRN auctions of 2026 took one of eight fixed sizes (3Y $58B · 10Y $42/$39B · 30Y $25/$22B · 20Y
$16/$13B · 2Y $69B · 5Y $70B · 7Y $44B · FRN $30/$28B) with **zero deviations**, across a 2026 10-Year
par-yield range of **3.97 → 4.79** (82bp, Treasury's own 2026 CSV, 171 sessions). `sb0590` names the
shock absorber in its own words — variations are met *"through changes in regular bill auction sizes
and/or CMBs"* — and 2026 has run **exactly one CMB** (the single 27-Day row in 301 auctions;
2026-05-21). A rates selloff between now and November cannot reach the coupon legs. It **can** reach
the bill legs, which is the same sentence read the other way.

**8. The August 2026 cycle is this event's structural twin, and it already scored — SUPPORTED, and
it is the cleanest out-of-sample evidence available.** The tentative schedule's `Thursday, August 13,
2026` block is row-for-row the same shape: `13-Week BILL` + `26-Week BILL` + `6-Week BILL` + `20-Year
BOND` (no `R`, new issue, auction 08-19) + `30-Year TIPS R T` (auction 08-20), on the same day as the
**30-Year refunding auction**. Both of its coupon legs printed on the grid: the 20Y sold **$16B on
2026-08-19** (high yield 5.204%, b/c 2.53) and the 30Y TIPS reopening **$8B on 2026-08-20** — the
latter matching `sb0590`'s named commitment exactly. So the analogue is not a theory; it is a
three-months-ago observation with both legs on the tape.

**9. No reaction to this announcement will be attributable — SUPPORTED, stated up front rather than
attempted.** 2026-11-12 carries: the **30-Year refunding new issue at 1:00pm ET** (announced 11-04,
settles 11-16), the **4-week and 8-week bill auctions**, a **17-week bill auction displaced from
Wednesday** by the 2026-11-11 Veterans Day bond closure, the **October Monthly Treasury Statement**
and **Existing-Home Sales** — in the **first bond session after a full-day closure**, with CPI two
days before (11-10) and PPI the next morning (11-13). **Checked and discarded as a non-finding:** the
30Y auction sharing this session looked like a Veterans Day artifact and is not — the same pairing
held on **2026-02-12** and **2026-08-13**, the two other 2026 refunding cycles whose auction blocks
ran Tue/Wed/Thu; only May-26 missed it, because its block started on a Monday. **Genuinely a holiday
artifact, and measured:** the 17-week bill auctioned on a **Wednesday in 36 of 36** 2026 auctions;
2026-11-12 is the single exception in the year.

**10. Current tape, recorded as the baseline the next pulse diffs against — no directional read.**
Treasury's 2026 par CSV still ends **09/04** at 2Y **4.37** · 10Y **4.78** · 20Y **5.25** · 30Y
**5.24** (fetched 2026-09-08 mid-session; the 09-08 row had not posted, and 09-07 was a full
closure). **VIX 15.40**, live 2026-09-08 (meta stamp 18:40Z), against **14.53** on the 09-04 close —
**+0.87**, inside the 3-point threshold. The feed's **15.30** bar dated **09-07** is a Labor Day
closure artifact; **flagged and not adopted**, same as the sibling. At D-65 none of this is
information about November; it is the reference block's starting point.

**11. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`. An
announcement of auction sizes has no equity transmission path; the duration channel that reaches this
calendar's names is the long-end *yield*, which the 11-12 **auctions** inform and this announcement
does not.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What
the conditions do support is a **reading discipline that differs from this event's siblings**. For
09-10 and 10-15 the instruction was *use the number instead of waiting for it*, because `sb0590`
published it. Here the instruction splits: **use the coupon numbers** ($16B, $19B) with their base
rates stated, because three years of grid and a 14/14 TIPS rule are stronger evidence than most
published guidance; and **do not pretend the bill numbers are known**, because they are not and
Treasury has said it will move them. Second, the event's real decision date is **2026-11-04**, not
2026-11-12 — every rates ledger in this corridor that reasons from *"supply is settled in writing"*
should treat 11-04 as the day that sentence is re-underwritten for the whole Nov/Dec/Jan quarter.
Third, the **cheapest available read arrives early**: 2026-10-15 and 2026-10-22 are the last two
announcements `sb0590` covers, so a deviation there would be the first dated evidence the path is
turning, 28 and 21 days before the refunding.

### Honest limits

**No Treasury document names either coupon size for November**, and that is the honest core of this
doc — legs 2, 3 and 6 are base rates and structure, not a quotation, which is a genuinely weaker
epistemic position than the 09-10 ledger occupied and is stated as such. **treasurydirect's
`upcoming` feed does not reach November**, so unlike the September siblings there is no second
Treasury endpoint corroborating CUSIPs, and **91282CRE3 as the 11-19 security is an inference from a
three-year cycle, not a fetched field.** **The tentative schedule is tentative** — Treasury's own
label — and this lane may not self-confirm it. **Base rates sit inside one policy regime** (Fed on
hold at 3.50–3.75% across the whole window); *"the grid holds"* is a within-guidance claim whose
guidance has a dated review at 11-04. **The 11-03 midterms sit one day before that refunding** and
this doc makes no attempt to model a fiscal-outlook change through them; it names the date and
stops. **The dealer expectation is May-dated** (Reuters via Yahoo Finance, 2026-05-06, reporting
primary dealers expecting nominal coupon increases *"early next year"*), four months stale, about a
different refunding, and is used to bound the risk loosely rather than to price it. **The ~11:00 ET
time is unsourced convention**, inherited from the sibling ledgers. **The bill-leg call is
deliberately not a number** — an honest "unknown" rather than a spuriously precise guess.

## Stance & kill switches

**Stance (date `estimate`; both coupon numbers DEDUCED, not published — the distinction is the
point).** This event is a **two-speed release**, and the first in this series that is not a scheduled
nil. Expect **20Y new issue $16B** and **10Y TIPS reopening (91282CRE3) $19B** on 2026-11-12 at
~11:00 ET, on base rates of 13/13 and 14/14 respectively; expect the **13-week and 26-week bills to
be genuinely new numbers** whose direction Treasury has pre-announced (October increases) and whose
magnitude nobody has published, and the **6-week to be wherever the live adjustment lever has
landed** from $75B. No position is or should be taken on any of it. The doc's durable outputs are
three: (a) **the composition correction** — five securities, not two, with the bill legs carrying the
only real information; (b) **the TIPS-leg asymmetry** — a TIPS size change has never expressed at a
reopening, so the *unpublished* TIPS number is more secure than the *unpublished* 20Y number, which
inverts the usual ranking; and (c) **the 29-month, ten-refunding base rate** on nominal coupon sizes
being unchanged since April 2024, which is the strongest quantitative support this calendar has for
any "supply is settled" claim and is derived here rather than inherited.

**`FT-treasury-coupon-announcement-2026-09-10-2` is not touched and not duplicated.** It tests the
publication **mechanism** — that 11-04 publishes a forward table and that this announcement's 20Y
cell matches it — and explicitly discloses that *"the $16B implied by the grid is … not what is being
tested."* The two tests registered below take the number question it left open, and each names why it
is not a re-registration.

**Forward tests registered** in
[`forward-tests/treasury-coupon-announcement-2026-11-12.md`](../forward-tests/treasury-coupon-announcement-2026-11-12.md):

- **`FT-treasury-coupon-announcement-2026-11-12-1`**, scoreable **2026-11-19** — the 2026-11-12
  announcement publishes the **20-Year new issue at $16B**. The grid-holds question *across the
  guidance boundary*, which no current document answers.
- **`FT-treasury-coupon-announcement-2026-11-12-2`**, scoreable **2026-11-20** — the same
  announcement publishes the **10-Year TIPS reopening at $19B**. Independently guided (TIPS FINANCING
  is its own paragraph with its own language) and independently structured, so it is not a
  correlated restatement of the first.

**Kill switches:**

- **The 2026-11-04 refunding publishing a Nov-26 20-Year cell other than 16** — the first nominal
  coupon size change since April 2024. Every "supply is settled in writing" line in this calendar's
  rates ledgers gets re-derived rather than patched, and `FT-…-11-12-1` is killed eight days before
  the announcement it predicts.
- **Treasury dropping or qualifying *"for at least the next several quarters"*** at 11-04 or before —
  the whole deducibility frame is conditional on that sentence. [`FT-39`](../forward-tests.md) owns
  the guidance-language channel; this doc defers to it and does not re-register it.
- **Either October announcement (10-15, 10-22) printing a size off `sb0590`'s Oct-26 row** — the
  earliest dated tell available, inside the published window, that the path is turning.
- **A TIPS size printed at a reopening rather than at a new issue** — at 11-19 or anywhere. It has
  never happened in the observed window, and it would retire leg 3's asymmetry, which is the specific
  reason the TIPS leg is graded above the 20Y leg here.
- **An off-cycle issuance action** — a CMB or a coupon size changed between refundings — making
  supply a live variable for the first time in 2026. Note `sb0590` explicitly reserves **bill**-size
  and CMB flexibility, so a bill action does **not** fire this; only a coupon one does.
- **Treasury moving the 11-04 refunding or the 11-12 announcement off those dates** — voids rather
  than kills; announced-elsewhere is a different question than announced-here.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-08 | D-65 | **Initial research**, run mid-session ~14:40 ET. **Canonical file written by this session** — the event existed only as `proposals/treasury-coupon-announcement-2026-11-12.from-treasury-coupon-announcement-2026-09-10.json`, which was read in full first per EVENT-RESEARCH.md. **Composition CORRECTED against that proposal: FIVE securities, not two.** The Tentative Auction Schedule PDF (fetched direct, HTTP 200, 17,195 bytes, text layer decompressed and re-tokenised this session) carries on `Thursday, November 12, 2026`: `13-Week BILL` and `26-Week BILL` (auction Mon 11-16), `6-Week BILL` (auction Tue 11-17), `20-Year BOND` — **no `R`, a new issue** — (auction Wed 11-18, settle Mon 11-30), and `10-Year TIPS R T` (auction Thu 11-19, settle Mon 11-30). **The correction is load-bearing: the two halves have opposite information content.** **Coupon legs — deducible with no document naming them.** 20Y: `auctions_query` all 20-Year rows since 2023-01-01 (n=44) gives **13 consecutive new issues at $16B since 2023-08-23** and 29 reopenings at $13B, zero deviations; November is a **new-issue** month on a four-year Feb/May/Aug/Nov cycle (2023-11-20, 2024-11-20, 2025-11-19 all new issues), and `sb0590`'s own 20-Year column displays the structure twice (`16 13 13 16 13 13`, May→Oct). TIPS: filtering `inflation_index_security` (n=44) gives **14/14 on the −$2B reopening rule**, **7/7 on second-reopening-equals-first**, and **3/3 on July-CUSIP-reopened-twice** — 91282CRE3 sold 2026-07-23 at $21B → **$19B**. **The finding: the TIPS leg is the MORE certain coupon, inverting the usual ranking.** A TIPS size change has **never** expressed at a reopening; every step (17→18→19→20→21) landed on a January or July **new issue**, and the ratchet is flat for 3 new issues and 5 reopenings. So an 11-04 TIPS increase would surface in **January 2027**, not here. **Bill legs — genuinely unknown, and this is what stops it being a scheduled nil.** 13-week **$92B** and 26-week **$79B** pinned back through 07-20; **6-week 95 → 85 → 75** across 08-25/09-01/09-08. `sb0590` pre-announces both moves verbatim (September *"reductions to shorter-dated bill auction sizes"*, October *"increasing auction sizes across the bill curve"*), so three of five securities carry real unpublished numbers whose direction alone is stated. **New base rate, derived this session and stronger than anything recorded:** walking every Note/Bond size series from 2023-06, the 2023–24 increase cycle stopped dead at **April 2024** — last changes 10Y new 2024-02-07 (40→42), 30Y new 2024-02-08 (24→25), 10Y/30Y reopenings 2024-03-12/13, 5Y 2024-04-24 (67→70), 7Y 2024-04-25 (43→44), FRN new 2024-04-24 (28→30); the **20Y new issue never moved at all**. That is **~29 months and ten quarterly refundings with zero nominal coupon or FRN size changes**. **Grid-vs-tape re-derived:** all **67** 2026 nominal coupon and FRN auctions took one of eight fixed sizes, zero deviations, across a 2026 10Y par range of **3.97 → 4.79** (Treasury's own CSV, 171 rows); **exactly one CMB** in 301 2026 auctions (the single 27-Day row). **Structural twin found and already scored:** the schedule's `Thursday, August 13, 2026` block is row-for-row identical (3 bills + 20Y new issue + a TIPS reopening, on the 30Y refunding auction day) and **both its coupon legs printed on the grid** — 20Y **$16B on 08-19** (hy 5.204%, b/c 2.53), 30Y TIPS **$8B on 08-20**. **Method caveat independently reproduced:** `original_security_term` is unreliable — **2026-01-26 CUSIP 91282CGH8, a 2-Year note at $69B, is tagged `5-Year`**. **Adjacency sweep — peers:** n/a, `symbols: []`. **Macro:** none of the 09-08 corridor (3Y auction today, PPI/CPI 09-10/09-11, FOMC 09-16) reaches a November announcement; the only macro dates that do are **11-02 borrowing estimates → 11-03 midterms → 11-04 refunding**. **Volatility:** **VIX 15.40** live 09-08 (meta stamp 18:40Z) vs **14.53** on the 09-04 close, **+0.87**, inside threshold; the feed's **15.30** bar dated **09-07** is a Labor Day closure artifact, **flagged and not adopted**. **Rates:** Treasury's 2026 par CSV still ends **09/04** — 2Y **4.37** · 10Y **4.78** · 20Y **5.25** · 30Y **5.24** (the 09-08 row had not posted mid-session; 09-07 was a full closure). **Geopolitical / kill switch 4 checked and clear:** Treasury's press index (HTTP 200, 71,182 bytes) has published nothing issuance-related since the 08-05 refunding — its newest item, dated **2026-09-08**, is an Iran sanctions action. **Corridor: 16 tracked entries within ±5 days**, including this session's own 30Y proposal. **THREE dated adjacent events PROPOSED as `estimate` in this PR:** `treasury-30y-bond-2026-11-12` (the refunding new issue at 1:00pm ET **in this event's own session**, expected $25B — $25B in every refunding month since 2024-02-08), `treasury-20y-bond-2026-11-18` and `treasury-10y-tips-2026-11-19` (the two auctions this announcement exists to size). The 3Y **11-09** and 10Y **11-10** refunding legs were seen in the same parse and **deliberately not filed** — they are sized and announced by `treasury-refunding-2026-11-04`, their natural owner. **Checked and discarded as a non-finding:** the 30Y auction sharing this session looked like a Veterans Day artifact and is not — the same pairing held **2026-02-12** and **2026-08-13**; only May-26 missed it (block started Monday). **Genuinely a holiday artifact, measured:** the 17-week bill auctioned on a **Wednesday in 36 of 36** 2026 auctions, and 2026-11-12 is the year's single exception — the Veterans Day closure on 11-11 puts an extra bill auction in this event's session. **Independent corroboration for a sibling:** the PDF carries its own line `Holiday - Wednesday, November 11, 2026 - Veterans Day`, a Treasury primary confirming `sifma-bond-market-closure-2026-11-11`, whose own source is the egress-fragile sifma.org. **`FT-…-09-10-2` left untouched and not duplicated** — it tests the publication *mechanism* and discloses that the $16B is not what it tests; the two tests registered here take the *number* question it left open. **`FT-…-11-12-1`** (20Y $16B, scores 2026-11-19) and **`FT-…-11-12-2`** (10Y TIPS $19B, scores 2026-11-20) **registered**. **All sources returned HTTP 200; nothing blocked this session.** | **Stance set** — a **two-speed release**, not a scheduled nil: coupon legs deducible (**20Y $16B**, **10Y TIPS $19B**) on 13/13 and 14/14 base rates, **bill legs genuinely unknown** and pre-announced to move. Whole risk sits on **2026-11-04** | 2026-09-29 (medium, 31+ band: every 21d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse: it is a note to
the next session, not an essay. The adjacency sweep (peer prints · macro surprises · VIX regime ·
geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated adjacent event found gets
proposed as a new `src/domain/market-events/proposals/<id>.from-treasury-coupon-announcement-2026-11-12.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument data
(cache busted first), never from memory.
