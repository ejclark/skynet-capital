# 3-Year Treasury Note auction (new issue) — treasury-3y-note-2026-10-06

**Kind:** rates · **Date:** 2026-10-06 (estimate, EST: treasury.gov Tentative Schedule of Treasury Auctions, PDF re-fetched and its text layer independently re-extracted this session — HTTP 200, 17,195 bytes, row rebuilt from Tm coordinates as `3-Year NOTE` · no `R` · announce `Thursday, October 01, 2026` · auction `Tuesday, October 06, 2026` · settle `Thursday, October 15, 2026`; stays `estimate` because a tentative schedule is tentative and this lane may not self-confirm) · **Impact:** medium
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:31+","adjacentIds":["apple-eu-dma-terms-2026-10-01","ecb-account-2026-10-08","fomc-minutes-2026-10-07","ism-manufacturing-2026-10-01","ism-services-2026-10-05","jobs-2026-10-02","mrvl-investor-day-2026-10-06","opec-jmmc-68th-2026-10-04","treasury-10y-note-2026-10-07","treasury-30y-bond-2026-10-08","treasury-buyback-2y3y-2026-10-06","treasury-coupon-announcement-2026-10-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and note one thing this calendar has been asserting wrongly.** The
September sibling ruled that "the buyback lever does not reach this tenor." For **2026-10-06 it
does**: Treasury's own buyback schedule puts a **2Y–3Y liquidity-support operation, $4 billion cap,
1:40–2:00pm ET, on the auction's own afternoon** — forty minutes after the 1:00pm bidding close, with
the eligible-CUSIP list published **11:00am ET that morning**, two hours *before* bidders commit. So
the same session both sells $58B of new 3-year paper and bids for up to $4B of the off-the-run 2–3
year sector, and the market knows which CUSIPs before it bids. **The honest second half is the more
useful one: this is scheduled plumbing, not a demand signal.** Measured here from Treasury's own
operations dataset — same-day buybacks accompanied **10 of the last 29** 3-Year auctions, and fill
rates track the *bucket*, not the auction day (10Y–20Y fills its cap 25/25 regardless; the one 7Y–10Y
op that shared a 3Y auction day filled **11%** against a **10%** mean). The one 2Y–3Y precedent
(2025-03-11) did fill 100% against a 60% mean — **n=1, with an n=1 counter-example**, so it is an
anecdote this doc registers a test against, not a finding. Underneath, the 3-Year is the **cleanest
demand series on this calendar**: $58B and `reopening: No` for **29 consecutive auctions**, so
bid-to-cover carries none of the new-issue/reopening denominator effect the 20Y sibling measured.
Base rate over those 29: mean **2.608**, sample σ **0.098**, range **2.43–2.85**. Date is `estimate`,
`symbols: []`, no house playbook is macro-keyed. Nothing here is a trade.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (D-31) | **Stand aside** | High | Nothing about this specific auction exists yet — no size, no CUSIP, no when-issued. The 3-Year is a fresh security every month (`reopening: No` on all 52 rows back to 2022-06), so unlike its 10Y/30Y block-mates its CUSIP is unknowable until the **2026-10-01** announcement. | The **2026-09-08** 3-Year printing bid-to-cover **outside 2.43–2.85** — the 29-auction constant-size range every number in this doc rests on, tested out-of-sample three sessions from now |
| This week | **Watch 2026-09-08, not this event** | High | The September 3Y is this auction's exact structure one month early — same $58B, same new-issue slot, same 1:00pm close — so it is a free out-of-sample test of every base rate here, and the sibling's FT-20 scores on it. | A 09-08 result whose **bidder shares** fall outside 2026's ranges (indirect **56.5–74.8%**, dealer **7.7–19.5%**) — demand *composition* turning while the cover holds is the failure this doc's cover-only base rate cannot see |
| This month | **Read the 10-06 print as a policy-path read; no new unhedged duration through the 10-06→10-08 block** | Medium | Three coupon auctions in three sessions ($58B + $39B + $22B guided) all settling **10-15**, with **FOMC minutes 10-07** landing inside the block — and, unlike September, **October CPI (10-14) is still ahead of the auction, not three days behind it**. | The **2026-10-01** announcement moving the 3-Year size off **$58B** — that ends the 29-auction like-for-like series and voids the base rate this call rests on, exactly as it would have voided FT-20 |
| This quarter | **Treat the same-day 2Y–3Y buyback as plumbing, not a signal** | Medium | Measured, not assumed: same-day buybacks accompanied 10 of the last 29 3Y auctions, and per-bucket fill rates explain the fills better than auction-day co-occurrence does. | The **2026-10-06** operation accepting **≥ $2.79B** — above every 2Y–3Y operation on record bar the single one that shared a 3Y auction day. That makes the rotation mechanism two-for-two and worth real work (this is FT-treasury-3y-note-2026-10-06-2) |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a directional bet on this auction.** `symbols: []`, the date is `estimate`, and no house
  playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed. Nothing below licenses an entry.
- **The correction worth carrying forward:** the buyback lever *does* reach this tenor on 10-06 —
  `2Y to 3Y`, `$0`–`$4 billion`, 1:40–2:00pm ET, announce 10-05, settle 10-07. The September ledger's
  "no technical support at this tenor" was right for September and is wrong for October.
- **The eligible-CUSIP list is pre-auction information, and it is dated.** Treasury's own footnote:
  a preliminary list at **11:00am ET on 10-05**, the final list at **11:00am ET on 10-06** — two hours
  before the 1:00pm competitive close. The operation's maturity range **10/07/2028 – 10/06/2029**
  *includes* the September 3Y's **2029-09-15** maturity and *excludes* this auction's own
  **2029-10-15**, so bidders can learn before bidding whether Treasury is buying the note this one
  replaces. Whether that CUSIP is actually eligible is unknown today; the list settles it.
- **A weak print** — bid-to-cover below **2.43** (the 29-auction floor) or dealer takedown well above
  the 2026 mean of **13.7%** — says front-end demand is responding to whatever the 09-16 FOMC did,
  not merely to the yield.
- **A strong print** — bid-to-cover at/above **2.85** (the era high) with indirects near/above 64% —
  says the front end is attracting the bid rather than needing a concession.
- **Read the tail alongside the cover.** Not computable from Treasury's dataset (no when-issued
  level); the September sibling established that third-party trackers publish it and that the last
  two 3Ys **stopped through** (Jul **−0.6bp**, Aug **−0.5bp**, both graded STRONG). Inherited, not
  re-fetched, and secondary-sourced.
- **The band FT-20 uses is narrower than the series justifies** — `2.54–2.71` holds in only **19 of
  29** constant-size auctions (**66%**), and in **12 of the last 18**. A test written on 2026's eight
  observations is materially likelier to fail than "inside the range" makes it sound; this doc
  registers against the 29-auction range instead.
- **The October seat has printed soft, on n=4** — 2.66 (2025-10-07) · 2.45 (2024-10-08) · 2.56
  (2023-10-10) · 2.57 (2022-10-11), mean **2.560** against the era mean of 2.608. Four observations
  is noise; it is logged so a future row can test it, never leaned on.
- **This auction is outside the FOMC blackout** (which starts **2026-10-17**), unlike its September
  sibling, which cleared into Fed silence. Officials can speak into the 10-06 stop, and the **10-07
  minutes** land the morning after it.
- **Watch (dated):** ISM Manufacturing + **the 10-01 coupon announcement** (the size and CUSIP tell)
  · jobs **10-02** · OPEC+ JMMC **10-04** · ISM Services **10-05** + the buyback's preliminary CUSIP
  list 11:00am ET · **this auction 10-06** 1:00pm ET, the **2Y–3Y buyback** 1:40pm ET, MRVL Investor
  Day · 10Y reopening + **FOMC minutes 10-07** · 30Y reopening + ECB account **10-08** · Columbus Day
  **10-12** · **CPI 10-14** · settlement + the next coupon announcement **10-15** · blackout **10-17**
  · **FOMC 10-28**.

## Initial research

### The question, plainly

The October 3-year note auction (1:00pm ET) opens the October coupon block. Its September sibling
already established the reframe — a 3Y is a **policy-path** auction, not a term-premium one. So the
question for *this* one is what is different: what does the October seat carry that September's did
not, does the base rate the siblings built still hold when it is measured over the whole constant-size
era rather than one calendar year, and is there anything about 2026-10-06 specifically that a reader
of the September doc would get wrong?

**One-line verdict:** three things are different and one of them matters — the auction shares its
afternoon with a **2Y–3Y buyback operation** the September doc explicitly ruled out for this tenor,
it clears **outside** the FOMC blackout with October CPI still ahead of it rather than behind, and its
base rate is **wider** than the siblings have been quoting; but the buyback's fill is explained by its
bucket rather than by the auction, so the doc's output is still a stand-aside plus two registrations.

### Method

Rates/Treasury-auction mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — `symbols:
[]`, so no symbol-keyed instrument applies, `earnings-cycle.mjs` / `intraday-edges.mjs` were not run,
and the cache-busting rule has no target. Four primaries were fetched directly this session and every
figure below traces to one of them:

1. **`fiscaldata.treasury.gov` `auctions_query`** — all **52** 3-Year note rows back to 2022-06,
   with `reopening`, CUSIP, offering amount, high yield, coupon, bid-to-cover and the three
   bidder-class accepted-dollar fields. Bidder shares are computed here from the raw dollars over
   the competitive base (dealer + direct + indirect), which reproduces the September sibling's
   published shares to the decimal on all eight 2026 rows — that agreement is what licenses reusing
   its two secondary-sourced tail figures.
2. **`fiscaldata.treasury.gov` `buybacks_operations`** — the full operations history (200 rows,
   2000-12-14 → 2026-09-03) with `maturity_bucket`, `operation_type`, `max_par_amt_redeemed` and
   `total_par_amt_accepted`. This dataset appears not to have been used anywhere in
   `docs/research/` before; it is what turns leg 2's claim from a story into a measurement.
3. **Tentative Schedule of Treasury Auctions** (`home.treasury.gov/system/files/221/`), HTTP 200,
   **17,195 bytes**, FlateDecode streams inflated and table rows rebuilt from `Tm` coordinates.
4. **Tentative Schedule of Treasury Buyback Operations** (same host), HTTP 200, **125,547 bytes**,
   rows recovered from `TJ` arrays.

Rates are Treasury's own daily par yield curve CSV (2026 file, fetched direct); VIX is Yahoo's daily
close series. Fed-path context is carried from [`fomc-2026-09-16`](fomc-2026-09-16.md) and the
[September 3Y](treasury-3y-note-2026-09-08.md) rather than re-researched. The date is `estimate` and
that label rides on every trading-adjacent line below.

### Conviction legs, tested

1. **The date and the new-issue status are right, and the CUSIP is genuinely unknowable —
   SUPPORTED, primary, independently re-extracted.** The tentative-auction PDF's 3-Year row reads
   `3-Year NOTE` with **no `R` marker**, announce `Thursday, October 01, 2026`, auction `Tuesday,
   October 06, 2026`, settle `Thursday, October 15, 2026`. The absence of `R` is corroborated
   structurally: **all 52** 3-Year rows in `auctions_query` back to 2022-06 carry `reopening: "No"`,
   each with its own CUSIP. The block-mates behave differently — the 10-07 10Y and 10-08 30Y are both
   reopenings whose CUSIPs the
   [coupon-announcement sibling](treasury-coupon-announcement-2026-10-01.md) has already predicted
   from cycle structure. **No such prediction is possible here**, and that is a fact about the
   instrument, not a gap in the work: a fresh monthly security has no predecessor to reopen. The
   Tuesday slot also matches every October 3Y on record (2025-10-07 · 2024-10-08 · 2023-10-10 ·
   2022-10-11, all Tuesdays). Status stays **`estimate`**: the schedule is tentative by construction
   and this lane may not self-confirm.

2. **The buyback lever reaches this tenor on this date — SUPPORTED, primary, and it corrects a
   sibling.** The buyback schedule's row reads verbatim: announce **`10/5/2026`**, operation
   **`10/6/2026`**, **`1:40 pm`–`2:00 pm`**, settle **`10/7/2026`**, **`Liquidity Support`**,
   **`Nominal Coupons 2Y to 3Y`**, maturity range **`10/07/2028 - 10/06/2029`**, minimum **`$0`**,
   maximum **`$4 billion`**. The [September 3Y ledger](treasury-3y-note-2026-09-08.md) recorded, in
   every row, that "the buyback lever does not reach this tenor — Bessent's doubled operations are
   10–30Y; the 3Y gets no technical support from it." That was correct for September (the nearest
   ops were a 1Mo–2Y cash-management operation on 09-09 and a 10Y–20Y liquidity op on 09-10) and it
   is **wrong for October**, where the 2Y–3Y bucket lands on the auction's own afternoon. Two
   details make it more than trivia. **(a)** The `$4 billion` cap is the *standing* liquidity-support
   cap for short nominal buckets — it is **not** the figure press release `sb0607` (2026-08-19)
   doubled, which raised the 10–20Y and 20–30Y caps that this same 2026-08-05 schedule still shows
   at `$2 billion`. So the `$2B` rows here are stale and the `$4B` row is current, which is the
   opposite of the caveat the [10-15 buyback ledger](treasury-buyback-10y20y-2026-10-15.md) carries.
   **(b)** The maturity range **includes** the September 3Y's 2029-09-15 maturity and **excludes**
   this auction's own 2029-10-15, so the operation can bid for the note this issue displaces but
   never for the issue itself.

3. **But the co-occurrence is scheduled routine, and there is no evidence it lifts the fill —
   SUPPORTED, and this is the leg that stops leg 2 becoming a bad trade idea.** Two measurements
   from `buybacks_operations`. **First, the co-occurrence is common:** buyback operations landed on
   a 3-Year auction date **10 times in the 29-auction constant-size era** — 2026-08-11, 2026-06-09,
   2026-03-10, 2026-02-10, 2025-10-07, 2025-06-10, 2025-04-08, 2025-03-11, 2024-12-10 and
   2024-09-10. A calendar collision that happens roughly every third auction is not a signal.
   **Second, fills track the bucket, not the auction day** (all operations since 2024-05, fill =
   accepted ÷ cap):

   | Bucket (Liquidity Support unless noted) | n | Mean fill | Full-cap | The auction-day one(s) |
   |---|---|---|---|---|
   | Nominal 10Y–20Y | 25 | **100%** | 25/25 | 4 ops, all 100% — uninformative by construction |
   | Nominal 1Mo–2Y (Cash Management) | 26 | 95% | 22/26 | 3 ops at 98/100/100% |
   | Nominal 20Y–30Y | 26 | 94% | 24/26 | — |
   | Nominal 1Mo–2Y | 10 | 100% | 10/10 | — |
   | **Nominal 2Y–3Y** | **9** | **60%** | **2/9** | **2025-03-11 at 100%** |
   | Nominal 3Y–5Y | 10 | 76% | 4/10 | — |
   | Nominal 5Y–7Y | 10 | 44% | 0/10 | — |
   | Nominal 7Y–10Y | 9 | 10% | 0/9 | **2024-09-10 at 11%** |

   The buckets that always fill tell you nothing on an auction day, because they always fill. The
   two buckets with real variance that *did* share an auction day split: 2Y–3Y filled its whole cap
   against a 60% mean, and 7Y–10Y filled **11%** against a **10%** mean — dead on its base rate. So
   the evidence is **one observation each way**, and the honest summary is that the rotation story
   (dealers clearing 2–3 year inventory into Treasury's bid to make room for the new 3Y) is a
   plausible mechanism with no measured support. The nine 2Y–3Y operations accepted, sorted:
   **0.36 · 1.55 · 1.90 · 2.00 · 2.27 · 2.29 · 2.29 · 2.79 · 4.00** ($B; mean 2.16, median 2.27,
   eight at a $4B cap and one at $2B). Registered as **FT-…-2** precisely because a single
   observation on 10-06 discriminates it.

4. **The 3-Year is the cleanest demand series on this calendar — SUPPORTED, and it is a
   methodological point the siblings can reuse.** The [20Y ledger](treasury-20y-bond-2026-10-21.md)
   measured that bid-to-cover there is driven by a **denominator effect**: reopenings beat new issues
   24 of 28 paired times, not because demand was better but because the offering falls further than
   the bids do. That confound **cannot exist here**. Every 3-Year is a new issue, and the offering has
   been **$58,000,000,000 for 29 consecutive completed auctions** since 2024-04-09 (before that, a
   nine-month ramp from $40B). Constant numerator regime, constant denominator, homogeneous security
   type: bid-to-cover on this series is as close to a pure demand read as this calendar has.

5. **The base rate is wider than the siblings have been quoting — SUPPORTED, and it changes how a
   forward test should be written.** All 29 constant-size auctions, computed here:

   | Window | n | Mean B/C | Sample σ | Range |
   |---|---|---|---|---|
   | 2026 year-to-date | 8 | 2.624 | 0.059 | 2.54–2.71 |
   | Trailing 12 completed | 12 | 2.656 | 0.083 | 2.54–2.85 |
   | **Constant $58B era (2024-04-09→)** | **29** | **2.608** | **0.098** | **2.43–2.85** |

   The `2.54–2.71` band the September doc's FT-20 is written against contains only **19 of the 29**
   (**66%**), and **12 of the last 18**. That does not make FT-20 wrong — it is registered and scores
   on its own terms — but "inside the range" reads like a near-certainty and is closer to a two-in-three
   proposition. Two smaller notes for the record. The September doc reports 2026's σ as **0.055** and
   this doc as **0.059** on the same eight numbers; both are right — 0.055 is the population form,
   0.059 the sample (n−1) form — and this doc states the convention rather than letting the
   discrepancy sit. And the **October seat specifically** has printed 2.66 · 2.45 · 2.56 · 2.57 over
   four years, mean **2.560**, all four at or below the era mean; n=4 is noise and is logged for a
   future row to test, not used.

6. **Corridor position — this auction sits after the FOMC and *before* the CPI, which inverts
   September — SUPPORTED.** Order of the window: ISM Manufacturing + **the coupon announcement
   10-01** · **jobs 10-02** · OPEC+ JMMC 10-04 · ISM Services 10-05 · **3Y + 2Y–3Y buyback + MRVL
   Investor Day 10-06** · **10Y reopening + FOMC minutes 10-07** · **30Y reopening + ECB account
   10-08** · Columbus Day 10-12 · **CPI 10-14** · settlement + the next coupon announcement 10-15 ·
   **blackout 10-17** · **FOMC 10-28**. Three consequences. First, this is the **first 3-Year auction
   to price whatever the 2026-09-16 FOMC did** — a decision that ledger still records as
   cross-venue-split (CME ~66% hike vs Kalshi ~41–48% as of 09-02). Second, **October CPI is ahead of
   the auction, not behind it**: in September the 3Y went three sessions *before* CPI, so a hot print
   could only punish the reopenings; in October the auction clears with the month's inflation read
   still eight days out, which removes a known catalyst from the pre-auction window and puts it
   entirely in the settlement window. Third, the blackout does not start until **10-17**, so unlike
   September there is no Fed silence into the stop — and the **10-07 minutes** arrive the morning
   after, meaning the auction is the last front-end supply event before the Committee's own reasoning
   becomes public.

7. **Settlement concentration is real but is a 10-15 story, not a 10-06 one — SUPPORTED.** All three
   October coupons settle **2026-10-15** — $58B + $39B + $22B guided = **$119B** on one date, which is
   also the date of the next coupon announcement and of a 10Y–20Y buyback operation. Recorded so a
   later row does not mistake settlement-date congestion for auction-day demand pressure; they are
   nine days apart and the [10-15 announcement ledger](treasury-coupon-announcement-2026-10-15.md)
   owns that date.

8. **Tracked-name sensitivity runs through the policy path, not the auction — SUPPORTED,
   inherited.** `symbols: []`. Nothing in this doc re-derives the September sibling's ranking
   (**CRWV** most exposed via debt-financed buildout, then **NVDA / AVGO / MRVL**, then **MSFT /
   GOOG / META**, least **AAPL / AMZN**), and nothing here licenses acting on it. Current tape for
   context only, Treasury's own par curve at 2026-09-04: 2Y **4.37** · **3Y 4.45** · 5Y 4.54 · 10Y
   **4.78** · 20Y 5.25 · 30Y 5.24, with the 3Y sitting **~16bp** through the 4.291% at which the
   August 3Y stopped. VIX **14.53** (09-04 close). Today is a Saturday; 09-07 is Labor Day, so the
   next session is 09-08 — the September auction itself.

### What the conditions support

Nothing directional, for the ordinary reasons: `symbols: []`, the date is `estimate`, and no house
playbook is macro-keyed. What the conditions support is a **reading discipline**, three items of it.
**(a)** Do not read the 10-06 buyback as support for the auction — leg 3 measured the co-occurrence
as routine and the fill as bucket-driven, and the one precedent that suggests otherwise is matched by
one that does not. **(b)** Do not carry the September doc's `2.54–2.71` band into October as though it
were the base rate; the constant-size series says **2.43–2.85**, and the difference is the gap between
a 66% claim and a near-certain one. **(c)** Hold no new unhedged duration through the 10-06→10-08
three-session block, and read the 3Y's result as evidence about the *policy* leg rather than about
fiscal supply — the reframe is inherited from the September sibling and is not re-argued here. The two
genuinely new things this doc can be scored on are registered below.

### Honest limits

**Leg 3 is the load-bearing one and it is thin.** The 2Y–3Y bucket has **nine** operations total, one
of which shared a 3Y auction date; the counter-evidence from the 7Y–10Y bucket is also n=1. Neither
side of that comparison would survive a significance test, and none was applied. **The tail is not
computable from the primary** — Treasury's dataset carries the high yield but no when-issued level, so
the Jul/Aug stop-throughs quoted above are the September sibling's secondary-sourced figures carried
forward, not re-fetched here. **The buyback maturity-range claim is arithmetic, not eligibility** —
10/07/2028–10/06/2029 contains 2029-09-15, but whether Treasury's final list actually includes a
one-month-old note is a rule this session did not establish; the 11:00am ET list on 10-06 settles it,
and the doc says so rather than assuming. **The base-rate series is 29 observations spanning a single
issuance regime** (constant $58B, and a Fed that has not hiked in it), so it is being asked to forecast
into a condition — a September hike, if that is what happened — it has never seen. **Nothing about this
auction's own supply or pricing exists yet**: no size, no CUSIP, no when-issued, no dealer forecast,
none of it possible before the 10-01 announcement, so every forward statement is a base-rate
extrapolation stated as such. **Two figures are inherited rather than fetched**: the `$58B` October
guidance from `sb0590` and the `sb0607` cap doubling, both taken from sibling ledgers that read the
primaries directly. And the 09-16 FOMC outcome is **unknown at the time of writing** — this doc is
written eleven days before it, so every "prices the policy path" statement is about a path whose
latest observation has not happened.

## Stance & kill switches

**Stance (date `estimate`; all auction and buyback figures primary-sourced from Treasury's own
datasets and schedule PDFs, fetched 2026-09-05).** Treat 2026-10-06 1:00pm ET as a **medium-impact
known-date read with no tradeable edge**: no position opened, closed or sized off it, and no new
unhedged duration carried through the 10-06→10-08 block. Base case (**Medium** confidence,
base-rate extrapolation — no size, CUSIP or when-issued exists at D-31): an ordinary print at
**$58B**, bid-to-cover inside the constant-size era's **2.43–2.85**, indirect share near the 2026
mean of 63.3% and dealer takedown near 13.7%.

This doc's two actual contributions are corrections rather than calls. **First, the buyback lever
does reach this tenor on this date** — a `2Y to 3Y` liquidity-support operation, `$0`–`$4 billion`,
1:40–2:00pm ET on the auction's own afternoon — which the September sibling ruled out for the 3Y and
which no ledger in this calendar had noticed for October. **Second, and immediately walking the first
back to its evidence**, the co-occurrence is scheduled routine (10 of the last 29 3Y auctions) and
buyback fills track their bucket rather than the auction day, so the plumbing is *not* a demand
signal — one supporting observation, one contradicting one. The stand-aside is unchanged by both.

Forward tests **FT-treasury-3y-note-2026-10-06-1** and **-2** registered in
[`forward-tests.md`](../forward-tests.md), scoreable 2026-10-07.

**Kill switches:**

- **The 2026-10-01 announcement moves the size off $58B** — the 29-auction like-for-like series ends,
  every base rate in this doc stops applying, and **FT-…-1 is void, not failed**. This is the single
  cleanest falsifier the doc carries and it resolves five sessions before the auction.
- **Bid-to-cover outside 2.43–2.85 on 2026-10-06** — front-end demand has broken out of the
  constant-size sample, and the base rate stops being usable for the November and December 3Ys. This
  is FT-…-1's kill.
- **The 2026-10-06 buyback operation accepts ≥ $2.79B** — the rotation mechanism leg 3 declines to
  endorse becomes two-for-two, and the "plumbing, not signal" reading needs re-argument rather than a
  patch. This is FT-…-2's kill, and it cuts *against* this doc's own stated call.
- **The 10-06 eligible-CUSIP list excludes the 2029-09-15 September note** — leg 2's "can bid for the
  note this issue displaces" claim is arithmetic about a maturity range, not a statement about
  Treasury's eligibility rules; an exclusion refutes the mechanism cleanly at 11:00am ET that day.
- **A long-end-style move showing up in the front end** — a >10bp single-session 2Y/3Y move on
  *fiscal* rather than policy news would mean term premium has reached this tenor, merging the
  September sibling's two stories back into one. Inherited unchanged.
- **The 2026-09-16 FOMC producing a cut, or moving cut odds off 0%** — the front end would be pricing
  a different question entirely, and per [`fomc-2026-09-16`](fomc-2026-09-16.md) that is a
  rebuild-from-scratch signal, not a patch. It also inverts what a strong October 3Y bid would mean.
- **The buyback schedule being revised before 10-05** — the tentative buyback schedule is tentative
  on the same terms as the auction schedule, and legs 2 and 3 and FT-…-2 all rest on a row in it. A
  revision voids FT-…-2 rather than killing it.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-31 | Initial research banked (above). **Date (primary, re-extracted independently this session):** the Tentative Auction Schedule PDF (HTTP 200, **17,195 bytes**, FlateDecode streams inflated, rows rebuilt from `Tm` coordinates) reads `3-Year NOTE` with **no `R`**, announce **Thursday, October 01, 2026**, auction **Tuesday, October 06, 2026**, settle **Thursday, October 15, 2026**. Status stays **`estimate`** — schedule is tentative, and this lane may not self-confirm. `reopening: "No"` on **all 52** 3-Year rows in `auctions_query` back to 2022-06 confirms the new-issue read a third way and makes the CUSIP **unpredictable by construction**, unlike the 10-07/10-08 reopenings whose CUSIPs the 10-01 sibling has already forecast. Tuesday matches every October 3Y on record (2025-10-07 · 2024-10-08 · 2023-10-10 · 2022-10-11). **Base rates re-derived over the whole constant-size era, not one year (primary, bidder shares computed from raw accepted dollars over the competitive base, reproducing the September sibling's published shares to the decimal on all eight 2026 rows):** **$58,000,000,000 for 29 consecutive completed auctions** since 2024-04-09, after a nine-month ramp from $40B; B/C mean **2.608**, sample σ **0.098**, range **2.43–2.85** (2026-only: n=8, mean 2.624, σ 0.059 sample / 0.055 population — the September doc's 0.055 and this doc's 0.059 are the same eight numbers under different conventions, stated rather than left as a discrepancy). **The `2.54–2.71` band FT-20 is written against holds in only 19 of 29 (66%) and 12 of the last 18** — not a defect in that test, but "inside the range" reads far stronger than a two-in-three proposition, and this doc registers against **2.43–2.85** instead. 2026 indirect mean **63.3%** (56.5–74.8), dealer mean **13.7%** (7.7–19.5). **October seat, n=4:** 2.66 · 2.45 · 2.56 · 2.57, mean **2.560**, all four at or below the era mean — logged as noise for a future row, not used. **Methodological point the siblings can reuse:** the 20Y ledger measured a new-issue/reopening **denominator effect** driving bid-to-cover there (reopenings won 24 of 28 paired); that confound cannot exist on the 3Y, which is always a new issue at a constant $58B — making this the **cleanest demand series on this calendar**. **THE MATERIAL FINDING, and it corrects a sibling.** Treasury's Tentative Buyback Schedule (HTTP 200, **125,547 bytes**, rows recovered from `TJ` arrays) carries verbatim: announce **10/5/2026**, operation **10/6/2026**, **1:40 pm–2:00 pm**, settle **10/7/2026**, **Liquidity Support**, **Nominal Coupons 2Y to 3Y**, maturity range **10/07/2028 – 10/06/2029**, min **$0**, max **$4 billion** — i.e. a buyback in this auction's own tenor, on this auction's own afternoon, 40 minutes after the 1:00pm close. The September 3Y ledger recorded in every row that "the buyback lever does not reach this tenor"; that was right for September and is **wrong for October**. Two refinements: the **$4B is the standing short-bucket cap, not a superseded one** (`sb0607`'s doubling applies to the 10–20Y/20–30Y rows this same schedule still shows at $2B, which is the opposite of the caveat the 10-15 buyback ledger carries), and the maturity range **includes** the September 3Y's 2029-09-15 while **excluding** this issue's own 2029-10-15. Per Treasury's own footnotes the **preliminary eligible-CUSIP list publishes 11:00am ET on 10-05 and the final list 11:00am ET on 10-06** — two hours before bidders commit. **AND THE FINDING IS THEN WALKED BACK TO ITS EVIDENCE, which is the more useful half.** From `buybacks_operations` (200 rows, **a primary this repo's research corpus had not used before**): buyback ops landed on a 3-Year auction date **10 times in the 29-auction era**, so the collision is routine; and fills track the **bucket**, not the auction day — 10Y–20Y fills its cap **25/25** regardless, 1Mo–2Y CM 95%, 20Y–30Y 94%, 3Y–5Y 76%, 5Y–7Y 44%, 7Y–10Y **10%**. Of the two variance-carrying buckets that shared an auction day, **2Y–3Y filled 100% against a 60% mean (2025-03-11)** and **7Y–10Y filled 11% against a 10% mean (2024-09-10)** — **one observation each way, no significance test applied, and the rotation mechanism is therefore a hypothesis this doc registers against rather than a finding it asserts.** The nine 2Y–3Y ops accepted 0.36 · 1.55 · 1.90 · 2.00 · 2.27 · 2.29 · 2.29 · 2.79 · 4.00 ($B; mean 2.16, median 2.27). **Corridor difference from September, which inverts one input:** this auction clears **after** the 09-16 FOMC and **before** October CPI (10-14), where September's went three days *before* CPI; it is **outside** the FOMC blackout (starts 10-17) where September's cleared into Fed silence; and **FOMC minutes land 10-07**, the morning after. All three coupons settle **10-15** ($119B), which is a settlement story and not an auction-day one. **Adjacency sweep — peers:** n/a, `symbols: []`; MRVL Investor Day shares the date but is a symbol event with no rates channel and its own ledger. **Macro:** the 09-16 FOMC has not happened; `fomc-2026-09-16` records it cross-venue split (CME ~66% hike vs Kalshi ~41–48%, 09-02) with cut odds at 0%. Payrolls **+162K vs ~53–56K** and Waller's 09-03 dovish turn are inherited from the September 3Y's D-3 row, not re-fetched. **Rates (primary, Treasury par curve CSV, 09-04):** 2Y **4.37** · **3Y 4.45** · 5Y 4.54 · 10Y **4.78** · 20Y 5.25 · 30Y 5.24 — the 3Y ~**16bp** through the August 3Y's 4.291% stop. **Volatility regime:** VIX **14.53** (09-04 close, Yahoo daily) — baseline set, nothing to diff against on a first assessment. **Geopolitical/policy:** nothing new researched; the oil→inflation channel and the Hormuz impairment are inherited from the September sibling and OPEC+ JMMC 10-04 sits in the corridor as the next dated test. **Adjacency — eleven tracked entries inside the ±5-day corridor, and ONE genuinely new dated event PROPOSED as `estimate` in this PR: `treasury-buyback-2y3y-2026-10-06`**, the operation above — untracked until now, materially this event's own, and the only calendar entry that shares both its date and its tenor. **Discovered and deliberately NOT filed, named so a sibling's sweep can:** the **10-02** 10Y–20Y and **10-08** 20Y–30Y liquidity-support operations from the same schedule — the second lands on the 30-Year bond auction's own day and belongs to [`treasury-30y-bond-2026-10-08`](treasury-30y-bond-2026-10-08.md)'s sweep, not this one. **Free out-of-sample check three sessions away:** the **2026-09-08** 3Y is this auction's identical structure one month early, and it tests every base rate here before this doc's first pulse. **Two forward tests registered** (both scoreable 2026-10-07): **`-1`** the cover inside the 29-auction **2.43–2.85**; **`-2`** the same-day buyback accepting **≥ $2.79B**, registered against this doc's own stated call so a pass costs the stance rather than confirming it. | — (stance set) | 2026-09-26 (medium, D-31 → the `31+` band, 21-day interval) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed to `market-events.ts` as an `estimate` in
the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
