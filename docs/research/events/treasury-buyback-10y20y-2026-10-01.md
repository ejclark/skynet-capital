# Treasury liquidity-support buyback operation (10-20Y nominal, 1:40pm ET) — treasury-buyback-10y20y-2026-10-01

**Kind:** rates · **Date:** 2026-10-01 (estimate, EST: treasury.gov Tentative Schedule of Treasury Buyback Operations, August 2026 refunding, masthead "For Publication August 5, 2026" — PDF re-fetched and text-layer decompressed direct 2026-09-06, HTTP 200, 125,547 bytes, md5 79b65955e74a59f6bebff3adf8ba7b35; row reads announce 9/30, operation 10/1 1:40–2:00pm ET, settle 10/2, Nominal Coupons 10Y to 20Y, 10/02/2036–10/01/2046, min $0, max $2B **superseded** by sb0607) · **Impact:** medium
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"medium:8+","adjacentIds":["unsc-iran-panel-mandate-expiry-2026-09-26","dallas-fed-mfg-2026-09-28","consumer-confidence-2026-09-29","crwv-fully-connected-2026-09-29","jolts-2026-09-29","adp-employment-2026-09-30","advance-economic-indicators-2026-09-30","chicago-pmi-2026-09-30","g20-trade-ministerial-milwaukee-2026-09-30","gdp-q2-2026-third-2026-09-30","government-funding-deadline-2026-09-30","pce-2026-09-30","sp-select-sector-secondary-reweight-2026-09-30","apple-eu-dma-terms-2026-10-01","boj-summary-of-opinions-2026-10-01","boj-tankan-2026-10-01","ism-manufacturing-2026-10-01","treasury-coupon-announcement-2026-10-01","jobs-2026-10-02","opec-jmmc-68th-2026-10-04","ism-services-2026-10-05","intl-trade-full-report-2026-10-06","mrvl-investor-day-2026-10-06","treasury-3y-note-2026-10-06","treasury-buyback-2y3y-2026-10-06"],"screenStreak":0} -->

## At a glance

**TL;DR.** Still **a read, not a trade** — no position, no attribution of 10-01's tape to a 1:40pm
plumbing operation. But this session breaks the inherited base case that every sibling ledger has
been repeating. The claim "Treasury accepts the full announced maximum, **25 of 25** in this
sector" is true, and it is an artifact of a **$2B** cap covered 3.2–18.0x. Measured across **all
41** liquidity-support operations Treasury has ever run **at a $4B cap** (any sector,
`fiscaldata`, pulled direct 2026-09-06), the full-take rate is **13 of 41 — 32%**, median fill
**57%**. The variable that separates them is **cover**: at $4B, cover **≥3.5x → 11 of 11 took the
full cap**; cover **<2.5x → 0 of 22 did**. Doubling the cap halves cover, so the doubling converts
a mechanical outcome into a conditional one, and the condition is a single published number.
**The threshold is $14.0B of offers.** Replay 2026's own eleven 10-20Y operations at a $4B cap and
ten clear it comfortably — but the eleventh is the most recent one (**2026-08-11, $7.40B → cover
1.85x**), which lands in the zone where no $4B operation has ever filled, and where the median fill
of **39%** implies **~$1.6B bought — less than the old $2B cap delivered mechanically**. Base case
stays a full $4B take because ten of eleven clear; what changes is that it is now a conditional with
a number attached. Date and cap are `estimate`; `symbols: []`; the 09-30 shutdown premise is dead
(CR enacted 2026-09-02).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today (2026-09-06, D-25) | Stand aside | High | Sunday, no session. `symbols: []`, no house playbook is macro-keyed, and the whole enlarged programme is worth ~1bp of 10Y support through year-end (BofA, 8/26, via press). Nothing about 10-01 has happened. | Treasury acting past `sb0607` before **2026-09-30** — a cap above $4B, added sectors or frequency, or the promised updated schedule finally publishing with different parameters; that is a materially bigger lever than anything dated here |
| This week | Read the **2026-09-09** announcement and the **2026-09-10** operation as this event's free out-of-sample test | High | The 09-10 operation is the **first 10-20Y operation ever run at a $4B cap**, four days out and costing nothing. It publishes the two numbers that decide 10-01: the offer total against the **$14.0B** threshold, and whether acceptance obeys the cover rule ([`FT-…-1`](../forward-tests/treasury-buyback-10y20y-2026-10-01.md)). | The 09-09 announcement not posting, or posting a maximum below $4B — `sb0607`'s supersession premise would be wrong and every long-end ledger in the corridor inherits it |
| This month | Expect the **2026-10-01** operation to accept the full announced maximum **only if offers clear $14.0B**; hold nothing through it either way | Medium | 10 of 2026's 11 same-sector operations clear that bar at a $4B cap, but the one that does not is 8/11, the most recent. Confidence is medium not high because the threshold is transferred from other sectors — 10-20Y has never operated at $4B. | Offers on **2026-10-01** landing at **$14B+** and Treasury still accepting **less** than the announced maximum — the cover rule fails in the direction that matters and the 20-30Y outliers (2025-11-20, 2026-03-19) become the long end's real behaviour |
| This quarter | Stand aside on the programme as a yield driver; the **2026-11-04** refunding is where sizing is actually decided | Medium | `sb0607` expires 11-04 by its own text. Long-end yields are **higher** than when the doubling was announced (10Y 4.784, 30Y 5.246 on 09-04) — deficits and the Fed path drive the long end, not $2–4B a fortnight. | Long-end yields easing durably across the 09-10, 10-01 and 10-15 operations with no macro explanation, or the 11-04 refunding statement making the enlarged size permanent and larger |

**Signals & conditions** — the buy/sell/hold triggers:

- **Never a position keyed to this operation**, and never an attribution of 10-01's tape to it. `symbols: []`, date and cap `estimate`, no house playbook (S1/S2/E1/S3/S4 + G1) is macro-keyed.
- **The one number to read: total par offered, against $14.0B.** Above it, the full announced maximum has always been taken at a $4B cap (11/11). Below **$10.0B**, it never has (0/22).
- **2026 base rate, this exact sector:** median offer **$18.39B**, range **$7.40–36.05B**, n=11 (`fiscaldata`, primary) — so the threshold is usually cleared, not usually missed.
- **The perverse case, stated plainly:** at 8/11's $7.40B a $4B cap implies ~**$1.6B** bought (median fill 39% in that cover bin) versus the **$2.00B** a $2B cap delivered mechanically. A bigger cap can buy less.
- **The long-end caveat that cuts against this doc's own finding:** high cover is *not* sufficient in the 20-30Y sector — **2025-11-20** (cover 12.7x, fill 39%) and **2026-03-19** (cover 18.0x, fill 10%) both broke it. Long-end high-cover full-take is **49 of 51**, not 51 of 51.
- **Acceptance is announced-maximum-relative, and the maximum is unknown until 2026-09-30.** `sb0607` says *"at least $4 billion"*; the schedule PDF's $2B is superseded and must not be quoted.
- **The 09-30 shutdown premise is retired**, not pending: the CR was enacted **2026-09-02** (PL 119-103, funds through 12-11), so 10-01 is an ordinary session and 10-02 payrolls print.
- **Watch (dated):** 10-20Y operations **09-10** · **10-01** (this) · **10-15** · **11-04** · 20-30Y **09-24** · **10-08** · **10-27** · PCE **09-30** · coupon announcement + ISM manufacturing + this operation **10-01** · payrolls **10-02** · FOMC **10-28** · refunding **11-04**, where `sb0607` expires.

## Initial research

### The question, plainly

This event was filed on 2026-09-06 by the
[`treasury-buyback-increase-2026-09-09`](treasury-buyback-increase-2026-09-09.md) adjacency sweep,
which noticed the calendar tracked the 09-10, 09-24, 10-08, 10-15 and 10-27 long-end operations
inside `sb0607`'s doubled-size window and had **skipped this one**, leaving a hole in exactly the
series that matters to the increase. It arrives with two sibling ledgers that already reached a
verdict — the [09-10 doc](treasury-buyback-10y20y-2026-09-10.md) calls the operation *"a data
release, not a catalyst"*, and the [10-15 doc](treasury-buyback-10y20y-2026-10-15.md) measured this
sector's offer-volume base rate and found its most recent observation collapsed. Restating either
would add nothing.

What this session asked instead: **both siblings carry the same base case — "Treasury accepts the
full announced maximum, 25 of 25 in this sector." That record was set entirely at a $2B cap.
`sb0607` doubles it. Does the record survive a $4B cap, and is there anywhere to check that
out-of-sample *before* 10-01?**

**One-line verdict:** there is, the answer is already in the data, and **the record does not
survive** — Treasury has run 41 liquidity-support operations at a $4B cap and taken the full cap in
only 13 of them, with **cover** cleanly separating the two outcomes; so the base case has to be
restated as a conditional with a published threshold rather than an expectation.

### Method

Rates mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md). `symbols: []`, so no
symbol-keyed instrument applies — `earnings-cycle.mjs` and `intraday-edges.mjs` have no target and
the mandated cache bust has nothing to bust (recorded rather than skipped silently). Everything
quantitative below was fetched this session (2026-09-06):

- **The schedule** — `home.treasury.gov/system/files/221/Tentative-Buyback-Schedule.pdf`, plain
  curl, **HTTP 200, 125,547 bytes, md5 `79b65955e74a59f6bebff3adf8ba7b35`**, PDF streams inflated
  and the text layer reconstructed to read the 10-01 row and the masthead verbatim.
- **The operation history** — `api.fiscaldata.treasury.gov` `buybacks_operations`, **219 rows**
  (2000-03-09 → 2026-09-03), HTTP 200 on plain curl. Every fill statistic below is computed from
  these rows and nothing else.
- **The tape** — Yahoo daily closes for `^VIX`, `^TNX`, `^TYX`.
- **`sb0607`** — quoted from the primary text already read verbatim into this event's own
  `market-events` entry on 2026-09-06, cited rather than re-fetched.
- **The CR** — inherited from the
  [`government-funding-deadline-2026-09-30`](government-funding-deadline-2026-09-30.md) ledger's own
  2026-09-05 pulse (three primaries: clerk.house.gov, whitehouse.gov, govinfo), dated where used.

### Conviction legs, tested

**1. The operation exists with these parameters — SUPPORTED, verbatim off the primary.** The
August-2026-refunding *Tentative Schedule of Treasury Buyback Operations* (masthead: *"For
Publication August 5, 2026"*) carries the row **announce 9/30/2026 · operation 10/1/2026
1:40 pm–2:00 pm · settle 10/2/2026 · Liquidity Support · Nominal Coupons 10Y to 20Y ·
10/02/2036–10/01/2046 · min $0 · max $2 billion.** The entry stays `estimate`: a tentative schedule
is tentative by construction, the $2B is known stale, and the confirming primary is the **09-30
announcement**, not this document.

**2. `sb0607`'s promised updated schedule is still unpublished, now 18 days on — SUPPORTED, and
verified independently today.** The re-fetch returned **125,547 bytes, md5
`79b65955e74a59f6bebff3adf8ba7b35`** — byte-identical in size to the 09-03, 09-05 and 09-06 fetches
on record, masthead unchanged. `sb0607` (2026-08-19) promised *"An updated tentative Treasury
buyback schedule will be released at a later date."* It has not been. Practical consequence: the
only document naming this operation still prints a superseded cap, and anyone reading it alone gets
$2B.

**3. The inherited "25 of 25" base case is real but is a $2B-cap statistic — SUPPORTED, and this is
the session's finding.** All 25 10Y-20Y liquidity-support operations ever run accepted **exactly
the announced maximum**, every one of them at a **$2B** cap with cover between **3.22x** (2024-07-02)
and **18.02x** (2026-03-26). Now take every liquidity-support operation Treasury has run at a **$4B**
cap, any sector, and the record inverts:

| Cap | Operations | Took the full cap | Median fill |
|---|---|---|---|
| $2B | 57 | **51 (89%)** | 100% |
| **$4B** | **41** | **13 (32%)** | **57%** |

**4. Cover, not cap, is what separates them — SUPPORTED, and the split is clean at both ends.**
Binning the 41 $4B operations by cover (offered ÷ cap):

| Cover | n | Took the full cap | Fills observed |
|---|---|---|---|
| <1.5x | 10 | **0** | 1% 5% 5% 8% 9% 11% 14% 25% 27% 31% |
| 1.5–2.0x | 6 | **0** | 11% 35% 39% 39% 55% 57% |
| 2.0–2.5x | 6 | **0** | 30% 42% 48% 57% 70% 85% |
| 2.5–3.0x | 7 | 2 | 5% 47% 62% 72% 93% 100% 100% |
| 3.0–3.5x | 1 | 0 | 57% |
| **≥3.5x** | **11** | **11** | 100% ×11 |

Widened to **every** liquidity-support operation at any cap: **cover ≥3.5x → 67 of 73 full takes
(92%)**; **cover <2.5x → 1 of 36 (3%)**, the sole exception being 2024-06-05 (20-30Y, $2B, cover
1.93x). At a $4B cap specifically, **cover <2.5x has produced 0 full takes in 22 attempts.**

**5. The threshold survives a time control at the top end, and does not in the middle — MIXED, and
the mixed half is disclosed rather than buried.** The obvious alternative explanation is that
Treasury simply got stingier over time. Testing it: $4B full-take rates by half-year are **3/7,
5/10, 2/9, 2/11, 1/4** — noisy, not a monotone collapse, and mean cover does not track them. More
decisively, the 1Mo-2Y bucket (cover always ≥6.95x) has filled **8 of 8 at 100%**, most recently
**2026-08-06**, so high cover still delivers a full take in the current regime. But within the
3Y-5Y bucket — constant eligible universe (~48 CUSIPs), cover a narrow 2.30–3.70x — fills went
**100% for the first four operations through 2025-07-23 and partial in all five since 2025-10-01**
(72%, 93%, 62%, 42%, 47%). So there **is** a real drift, and it lives in the middle cover band. Read
honestly: the ≥3.5x and <2.5x conclusions hold under the control; anything in between is contaminated
by it, and this doc does not lean on the middle band.

**6. Applied to 10-01, the threshold is a single number: $14.0B of offers — SUPPORTED by
arithmetic.** Cover 3.5x at a $4B cap requires **$14.0B** offered; cover 2.5x requires **$10.0B**.
Replaying 2026's own eleven 10-20Y operations at a $4B cap:

| Operation | Offered | Cover @ $4B | Zone |
|---|---|---|---|
| 01-08 · 01-22 · 02-10 · 03-05 · 03-26 | $17.84–36.05B | 4.46–9.01x | full-take (11/11 zone) |
| 04-15 · 05-06 · 06-09 · 07-01 · 07-23 | $15.72–19.69B | 3.93–4.92x | full-take (11/11 zone) |
| **08-11** | **$7.40B** | **1.85x** | **0-of-22 zone** |

**Ten of eleven clear $14.0B comfortably** — which is why the base case remains a full $4B take, and
why this finding sharpens the call rather than reversing it. The eleventh is the most recent one.

**7. The perverse case is worth stating out loud: a bigger cap can buy less — SUPPORTED.** In the
cover 1.5–2.0x bin at a $4B cap, observed fills are 11/35/39/39/55/57%, median **39%** — about
**$1.6B**. The old $2B cap, at 8/11's identical $7.40B of offers, delivered **$2.00B** mechanically
(cover 3.70x). So if 8/11's offer volume repeats on 10-01, `sb0607`'s doubling plausibly results in
Treasury buying **less** long-end paper than it would have under the cap it replaced. That is not a
prediction of what will happen — it is what the base rates say about the one tail the sector has
actually visited, and it is the sharpest reason the offer total is the number to read.

**8. High cover is not sufficient in the long end specifically — SUPPORTED, and it cuts against
this doc's own finding.** The six high-cover operations that did *not* take the full cap include
**two 20-30Y operations**, the closest structural analogue to 10-20Y: **2025-11-20** ($25.44B
offered, cover 12.72x, **fill 39%**) and **2026-03-19** ($36.00B offered, cover 18.00x, **fill
10%**). Neither is explained by this session. Combined long-end record at cover ≥3.5x is therefore
**49 of 51 (96%)**, not perfect. This is the honest ceiling on leg 6's confidence: clearing $14.0B
makes a full take the strong base case, not a certainty, and the failures on record are both
CUSIP-selection decisions inside a well-covered book rather than demand shortfalls.

**9. The quarter-turn story is REFUTED — an appealing hypothesis specific to this date, killed.**
2026-10-01 is the first business day of Q4, so dealer balance-sheet window-dressing is a plausible
reason offers could thin exactly here. Testing it on all 43 long-end (10-20Y + 20-30Y) liquidity
support operations since 2025-01-01: quarter-start operations (first 8 calendar days of Jan/Apr/
Jul/Oct, n=7) median offer **$18.74B** versus **$22.06B** for the other 36 — a gap the size of
ordinary noise on n=7, with the individual readings spanning $10.3–30.0B. Month-start shows nothing
at all (**$21.46B** vs **$21.93B**). **No quarter-turn adjustment is applied to the $14.0B
threshold**, and the story is recorded as tested-and-dropped so the next session does not re-derive
it.

**10. The 09-30 shutdown premise is dead, and inheriting it would have been the error — SUPPORTED.**
`government-funding-deadline-2026-09-30` sits one day before this operation and is titled *"shutdown
begins 2026-10-01 absent a CR"*, which reads as this date's largest risk. It is resolved: the CR was
**enacted 2026-09-02** (H.R. 6500, PL 119-103, funding through 2026-12-11), verified against three
primaries by that event's own 2026-09-05 pulse. So 10-01 is an ordinary session, payrolls print
10-02, and — separately worth noting — Treasury debt-management operations are an excepted function
that has historically continued through lapses anyway, so even the un-averted branch would not have
moved this operation. **The live cliff is 12-11, not 09-30**, and it is outside this event's window.

**11. The maturity-window shift from the 10-15 sibling changes nothing material — SUPPORTED.** This
operation's range is **10/02/2036–10/01/2046** against the 10-15 operation's 10/16/2036–10/15/2046 —
the same rolling window two weeks earlier at both ends. Nominal coupons in this part of the curve
mature on quarterly 15ths and month-ends, and nothing in the 10/02–10/15 boundary strips changes
hands, so the eligible set should be the **same 39** the 10-15 sibling predicts, on the same
"two subsequent new issues" eligibility model. That model is registered as
**`FT-treasury-buyback-10y20y-2026-10-15-1`** and scores **2026-09-11** — this doc **inherits it and
does not re-register it**, per the one-fragment-per-event rule.

**12. This operation's own tape effect will not be measurable — SUPPORTED, stated now.** 2026-10-01
already carries **ISM manufacturing 10:00 · a Treasury coupon announcement ~11:00 (3Y / 10Y
reopening / 30Y reopening sizes) · the BoJ Tankan and Summary of Opinions overnight · Apple's EU DMA
terms taking effect**, with **PCE, GDP-third, ADP, Chicago PMI and the quarter-end index reweight the
day before** and **September payrolls the day after**. No intraday attribution to a 1:40–2:00pm
window is defensible in that session and none will be attempted at close-out. The honest measurables
are four published numbers: **the announced maximum, the eligible list, the offer total and the
accepted total.**

**13. Scale, inherited and unchanged — SUPPORTED.** Bank of America puts the whole enlarged
programme at **~1bp of 10-year support through end-2026** (note ~2026-08-26, via press narration,
not the note). Corroborating from the same primary this session: the schedule's **10-06 2Y-3Y**
operation already carries a **$4 billion** cap, and the **2026-09-03 cash-management** buyback ran a
**$12.5B** cap (offered $28.27B, accepted the full $12.50B) — three times the entire long-end
step-up in one routine front-end operation. `sb0607` brings the long end to parity with the rest of
the curve; it does not privilege it.

**14. No tracked name is exposed through this channel — SUPPORTED, inherited.** `symbols: []`;
market-wide, through the rate-duration channel. At ~1bp of programme effect no tracked name's
exposure to *this operation* is distinguishable from noise. The inherited ranking (CRWV most
exposed, then NVDA/AVGO/MRVL, then MSFT/GOOG/META, least AAPL/AMZN) is context, not a live signal.

**15. Current tape, as the baseline the next pulse diffs against — no directional read.** **VIX
14.53** (2026-09-04 close, Yahoo, fetched this session; the month's range is 14.32–16.34). **10Y
4.784 · 30Y 5.246** (`^TNX`/`^TYX`, 09-04). **2026-09-06 is a Sunday**, 09-05 was a Saturday and
Labor Day is 09-07, so 09-04 is the freshest close available and nothing here is stale by neglect;
the next session is **2026-09-08**. Long-end yields sit **above** where they were when `sb0607` was
announced — the doubling has not visibly bought a lower long end, which is leg 13's ~1bp finding
showing up in the tape rather than in a model.

### What the conditions support

Nothing directional — the standard answer for a `symbols: []`, `estimate`-dated rates event. What
the conditions do support is three things.

**Replace the corridor's inherited base case with a conditional and a number.** Every long-end
ledger in this calendar currently carries "Treasury takes the full announced maximum" as a near-law,
sourced to a 25-of-25 record. That record is a $2B-cap statistic and does not transfer. The
replacement is one line any future session can apply without re-deriving it: **at a $4B cap, offers
above $14.0B → full take (11/11); offers below $10.0B → never a full take (0/22); in between,
genuinely uncertain and drifting toward partial since late 2025.**

**Take the free out-of-sample test on 2026-09-10, four days from now.** That operation is the
**first 10-20Y operation ever run at a $4B cap**, and it publishes both inputs — the announced
maximum on 09-09 and the offer/accepted totals on 09-10 — three weeks before this event needs them.
Registered as `FT-…-1`, scoring 2026-09-11. The sequence after it is **10-01** (this event) →
**10-15** → **11-04** (refunding, where `sb0607` expires and sizing is actually decided).

**Keep the calendar honest about what a basis point deserves.** The remaining dated operations —
20-30Y **09-24**, **10-08**, **10-27**; TIPS **09-15**, **09-29**, **10-21**; 2Y-3Y **10-06**;
10-20Y **10-15** and **11-04** — are known and are deliberately **not** proposed as new calendar
entries, on the 09-10 sibling's rule that tracking each ~1bp operation would bloat the calendar
against this doc's own finding. They sit in the dated watch list above.

### Honest limits

**Nothing about 10-01 has happened**; every number here is a schedule read or a base rate. **The
$4B cover threshold is transferred across sectors, and 10-20Y has never operated at $4B** — the 41
observations come from 1Mo-2Y (66–74 eligible CUSIPs), 2Y-3Y, 3Y-5Y (~48), 5Y-7Y (~26) and 7Y-10Y
(**10** eligible, which structurally cannot fill a $4B cap and supplies five of the ten lowest-cover
readings). This sector's 37–38 eligible CUSIPs sit between those extremes; the transfer is an
assumption, named, not a demonstration. **The bins are bins, not a fitted model** — 3.5x and 2.5x
are boundaries chosen to show where the outcome column becomes unanimous, with no significance
testing attempted and no claim that the true break sits exactly there. **Leg 5's time drift is real
and unresolved** in the 2.5–3.5x band. **Leg 8's two long-end counter-examples are characterised,
not explained**, and they are the closest analogues this doc has. **The announced maximum stays
unknown until 09-30** — `sb0607` says *"at least $4 billion"* and Bessent said on 2026-08-20 it
*"could be more than the 4 billion per issue"*, so $4B is a floor with an open ceiling and every
cover figure here scales inversely with whatever prints. **The eligibility count is inherited**
from the 10-15 sibling's model (registered there, scoring 09-11), not re-derived here; its disclosed
weakness — the eligible list's floor sitting at 912810SR0 while pre-2011 30Y bonds inside the stated
range have never appeared — carries over unchanged. **The ~1bp scale figure is press narration of a
BofA note, not the note.** **The CR facts are inherited** from a sibling ledger's 09-05 pulse, dated
where used, not re-fetched. **`sb0607` is quoted from text read into this repo on 2026-09-06, not
re-fetched today.**

## Stance & kill switches

**Stance (date and cap `estimate`-labeled — tentative schedule, published cap superseded, confirming
primary is the 09-30 announcement).** The 2026-10-01 10-20Y liquidity-support buyback is a **data
release, not a catalyst**: no position keyed to it, no attribution of that day's tape to it — the
verdict both siblings reached, inherited unchanged. Base case (**estimate**-labeled): the 09-30
announcement prints a maximum of **at least $4B**, the eligible list holds **39 CUSIPs**, offers
clear **$14.0B** as they did in 10 of 2026's 11 same-sector operations, and Treasury therefore
accepts **the full announced maximum** — but as a *conditional* outcome, not the mechanical one the
25-of-25 record implied.

**What this initial research changes versus the siblings' stance, which it otherwise inherits.**
Both siblings carry "Treasury accepts the full announced maximum, 25 of 25" as a near-law and the
10-15 doc registers it as a forward test. That record is a **$2B-cap** statistic. At a **$4B** cap
the full-take rate across all 41 operations Treasury has ever run is **13 of 41**, and **cover**
separates them cleanly (≥3.5x → 11/11; <2.5x → 0/22). `sb0607` halves cover by construction, so the
base case has to be restated as a threshold on the offer total — **$14.0B** — with the explicit tail
that at 8/11's volume the doubled cap plausibly buys **~$1.6B, less than the $2B cap it replaced**.

**Two forward tests registered** in
[`forward-tests/treasury-buyback-10y20y-2026-10-01.md`](../forward-tests/treasury-buyback-10y20y-2026-10-01.md):

- **`FT-treasury-buyback-10y20y-2026-10-01-1`**, scoreable **2026-09-11** — the cover threshold,
  out-of-sample on the **2026-09-10** operation, the first 10-20Y operation ever run at a $4B cap:
  offers ≥ $14.0B → the full announced maximum is accepted; offers < $10.0B → less than the maximum.
- **`FT-treasury-buyback-10y20y-2026-10-01-2`**, scoreable **2026-10-02** — the same rule on this
  event itself, registered separately because a second observation in the same sector is what turns
  a transferred base rate into a sector-native one.

**Deliberate non-proposal.** No new calendar entries are proposed by this session's sweep. Every
dated adjacency found — the 09-15, 09-24, 09-29, 10-06, 10-08, 10-15, 10-21, 10-27 and 11-04 buyback
operations — is a ~1bp liquidity-support operation of exactly the kind this doc concludes is not
worth a calendar slot, and the **25 tracked events already inside this event's ±5-day corridor**
cover the date heavily. The 09-10 sibling's rule is followed rather than re-litigated: a specific
warrant (a hole in the doubled-cap series, which is why *this* event was filed) earns an entry;
sector cadence alone does not.

**Kill switches:**

- **The 2026-09-10 operation drawing ≥$14.0B of offers and Treasury still accepting less than the
  announced maximum** — the cover threshold fails in the direction that matters, this doc's central
  finding is wrong out-of-sample on its first test, and the 20-30Y outliers (leg 8) are the long
  end's real behaviour rather than exceptions.
- **The 2026-09-10 operation drawing <$10.0B and Treasury accepting the full maximum anyway** — the
  opposite failure; the $2B-era 25-of-25 record was never cap-dependent and the whole leg-3/4
  finding collapses to a sector effect.
- **The 09-09 or 09-30 announcement printing a maximum below $4B, or the operation being pulled or
  moved** — `sb0607`'s supersession premise is wrong, and
  [`treasury-buyback-increase-2026-09-09`](treasury-buyback-increase-2026-09-09.md) plus both 10-20Y
  siblings carry the same premise and need flagging.
- **A second consecutive sub-$12B offer total (09-10 or 10-01)** — 8/11 was a regime change, not an
  outlier; the doubled cap is then operating in its perverse zone (leg 7) and the demand-side case
  for the enlarged programme weakens materially. Worth a sentence in every rates ledger in the
  corridor.
- **Offers reverting to $15–36B while long-end yields keep making highs** — size was never the
  binding constraint; the structural-supply read holds and caution stays wide on high-duration names
  into the 10-28 FOMC.
- **The 1:40–2:00pm ET window on 2026-10-01 moving 10-20Y yields >5bp with no ISM / coupon-
  announcement explanation** — refutes the "too small to matter" read; a single operation moving the
  tape would make each one a genuinely tracked event rather than plumbing.
- **Treasury escalating past $4B/op, adding sectors or frequency, publishing the promised updated
  schedule, or making the increase permanent at the 2026-11-04 refunding** — a materially bigger
  fiscal lever than anything dated here; propose it as its own dated calendar entry rather than
  folding it into this stance.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-25 | **Initial research. The finding: the corridor's inherited "Treasury accepts the full announced maximum, 25 of 25" is a $2B-cap statistic that does not survive `sb0607`'s doubling.** From `fiscaldata` `buybacks_operations` (219 rows, pulled direct, HTTP 200): across **all 41** liquidity-support operations ever run at a **$4B** cap, full-take is **13/41 (32%)**, median fill **57%** — versus **51/57 (89%)** at $2B. **Cover separates them cleanly:** at $4B, cover **≥3.5x → 11/11 full**; **<2.5x → 0/22**. Widened to any cap: **≥3.5x 67/73**, **<2.5x 1/36**. **Time control run and disclosed as MIXED** — $4B full-take by half-year is 3/7, 5/10, 2/9, 2/11, 1/4 (no monotone collapse) and 1Mo-2Y has filled **8/8 at 100%** including 2026-08-06, so high cover still works today; but within 3Y-5Y (constant ~48 eligible, cover 2.30–3.70x) fills ran 100% through 2025-07-23 and **partial in all five since 2025-10-01** — the drift is real and lives in the middle band, which this doc does not lean on. **Applied: the threshold is $14.0B of offers** (cover 3.5x @ $4B; $10.0B = 2.5x). Replaying 2026's eleven 10-20Y operations at $4B, **10 of 11 clear it** ($15.72–36.05B, cover 3.93–9.01x) — the exception is the most recent, **2026-08-11 at $7.40B → cover 1.85x**, in the 0-of-22 zone, where median fill 39% implies **~$1.6B — less than the $2.00B the old $2B cap delivered mechanically at the same offer volume**. **Counter-evidence recorded against this doc's own finding:** high cover is not sufficient in the long end — 20-30Y **2025-11-20** (cover 12.72x, fill 39%) and **2026-03-19** (18.00x, fill 10%) both broke it; long-end high-cover full-take is **49/51**, not perfect, and neither failure is explained here. **Quarter-turn hypothesis REFUTED:** long-end quarter-start operations since 2025 median **$18.74B** (n=7, range $10.3–30.0B) vs **$22.06B** otherwise; month-start $21.46B vs $21.93B — no adjustment applied. **Shutdown premise retired, not inherited:** the 09-30 funding deadline resolved — CR enacted **2026-09-02** (PL 119-103, funds through 12-11), so 10-01 is an ordinary session and 10-02 payrolls print; the live cliff is 12-11. **Two forward tests registered** — `FT-…-1` (cover rule out-of-sample on the 2026-09-10 operation, the first 10-20Y op ever run at $4B; scores 2026-09-11) and `FT-…-2` (same rule on 10-01 itself; scores 2026-10-02). Eligibility count **inherited** from the 10-15 sibling's `FT-…-1` (39 CUSIPs), not re-registered. **Event tape (primary):** schedule PDF re-fetched HTTP 200, **125,547 bytes, md5 79b65955e74a59f6bebff3adf8ba7b35 — unrevised**, masthead still "For Publication August 5, 2026", so `sb0607`'s promised updated schedule is **still unpublished 18 days on**; row verbatim announce 9/30 · operation 10/1 1:40–2:00pm · settle 10/2 · 10Y-20Y · 10/02/2036–10/01/2046 · max **$2B (superseded)**. Same PDF shows the **10-06 2Y-3Y operation already at $4B**, and the 2026-09-03 cash-management buyback ran a **$12.5B** cap (offered $28.27B, accepted $12.50B). **Adjacency — peers:** n/a (`symbols: []`). **Rates:** 10Y **4.784** · 30Y **5.246** (`^TNX`/`^TYX`, 09-04) — **above** where they sat when the doubling was announced. **Volatility:** VIX **14.53** (09-04 close), month range 14.32–16.34; calm. **2026-09-06 is a Sunday**, Labor Day 09-07, next session 09-08. **Adjacency — 25 tracked entries inside the ±5-day corridor** (PCE/GDP-third/ADP/Chicago PMI + quarter-end reweight 09-30 · ISM manufacturing + coupon announcement + BoJ Tankan 10-01 · payrolls 10-02); **NOTHING new proposed** — every dated buyback operation found is a ~1bp operation this doc concludes is not worth a slot. | **Stance set** — read-not-trade, inherited from both siblings; what is new is that their shared "full maximum accepted" base case becomes a **conditional on a $14.0B offer threshold**, with a named tail where the doubled cap buys less than the cap it replaced | 2026-09-13 (medium; D-25 sits in the 8+/7d band) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint
notes any row past ~1,200 chars): it is a note to the next session, not an essay, and a stance
*change* earns its sentence in the Stance section with the row as its receipt. The adjacency sweep (peer
prints · macro surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in
every row; a dated adjacent event found gets proposed as a new `src/domain/market-events/<id>.json`
(`status: "estimate"`) in the same PR. Close-out fills `## Outcome` below from re-run instrument
data (cache busted first), never from memory — after which this doc goes quiet.
