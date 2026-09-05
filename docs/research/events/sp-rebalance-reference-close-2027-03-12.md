# S&P Select Sector Indices March rebalance — reference close — sp-rebalance-reference-close-2027-03-12

**Kind:** sector · **Date:** 2027-03-12 (estimate — EST: date derived by applying an SEC-filed rule to the 2027 calendar. Select Sector SPDR Trust Form 497, accession 0001193125-26-031948, re-fetched direct 2026-09-05 (HTTP 200, 2,388,335 bytes) and re-parsed by this session independently of the opex ledger that seeded this entry: "The rebalancing of the Select Sector Indices … occurs at the closing prices of the second Friday of March, June, September and December." The second Friday of March 2027 is 2027-03-12 by weekday arithmetic computed mechanically here. Stays estimate because the filing dates the RULE, not this instance, and because this lane may not self-confirm an event it discovered in-sweep) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["fomc-2027-03-17","vix-expiration-2027-03-17"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and stop expecting this to be an XLK story.** 2027-03-12 is the close whose
prices set the capped weights that eleven Select Sector SPDRs must trade into the 2027-03-19 witching
auction. This session pulled **State Street's own daily holdings files** for all eleven funds (issuer
primary, "As of 03-Sep-2026") instead of the stale vendor pages the September siblings had to use, and
the picture changed in three ways. **(1) Only three of eleven sectors have a cap binding today, and
XLK is not one of them** — its over-4.8% cohort is **38.10%** against a 50% trigger, wider headroom
than the ~42% the 09-11 sibling read off a month-old vendor page, because AVGO has since fallen to
4.56% and dropped out of the cohort entirely. **(2) The one name currently over the hard single-name
limit is AMZN in XLY at 24.36%**, not anything in technology; XLE's cohort at **57.53%** is the
largest cohort breach and XLC's **51.13%** the marginal one. **(3) The whole capping trade is small:
≈$1.10B one-way across **$391B** of Select Sector SPDR assets — 0.28% — and its largest
liquidity-relative leg is **PSX at ~0.6 days of its own ADV**, a mid-cap refiner, not a household
name. Separately, this session resolved a rule ambiguity two sibling ledgers stumbled over: the SEC
filing's step 2 reads literally as a *proportionate* cut of the whole cohort to 45% (which would make
the trade **$5.3B in XLE alone**), but backing implied weights out of post-June-2026 price drift puts
XOM at **20.27%** right after the June rebalance, not the ~16% that reading requires — so the
**iterative** reading (trim the smallest cohort member to 4.5%, repeat) is the one the tape supports.
Both readings are registered as a forward test that scores on the **2026-09-22** holdings file. The
date is `estimate`; that widens caution and licenses nothing, and no house playbook is index-flow-keyed.

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-188, `symbols: []`, no house playbook is rebalance-keyed (re-grepped this session: zero hits), and today's cap readings describe September 2026, not March 2027 | A house index-flow instrument being built and back-tested before **2027-03-12** — the "no playbook exists, nothing to size" leg would be stale and this sheet gets rebuilt on measured data |
| This week | **Watch the dress rehearsal, trade nothing** | High | The September analogue of this exact close is **2026-09-11**, six days out — same rule, same eleven funds. It is the cheapest possible read on how the March mechanic behaves | Any S&P DJI or SPDR publication before **2026-09-11** showing the September Select Sector reference close on a date other than 2026-09-11 — the second-Friday rule this entry is derived from would be wrong |
| This month | **Go score the rule fork on the 2026-09-22 holdings file** | Medium | The 09-18 effective close re-caps everything; State Street's next daily file settles whether step 2 is proportionate or iterative — a 14× difference in trade size that this event's own read depends on | State Street's first XLE holdings file dated **on or after 2026-09-22** printing XOM **below 18.0%** — the proportionate reading would be right and every size figure here is ~8× too small. Registered **FT-sp-rebalance-reference-close-2027-03-12-1** |
| This quarter | **Stand aside** | Medium | December's pair (reference **2026-12-11**, effective **2026-12-18**) stacks on year-end witching, and the conditional **2026-09-30** secondary reweighting is a backstop with its own entry — neither is actionable and neither is March | An S&P DJI or SEC-filed methodology change published before **2026-12-11** moving the second-Friday reference, the third-Friday effective date, or the 24% / 4.8% / 50% thresholds |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` (`EST:`, rule-derived) — it widens caution about the 2027-03-19 close and licenses no date-keyed action.
- **Never trade the capping.** The pro-forma goes to S&P DJI clients; the public sees weights only after the fact.
- **Two independent tests, not one.** Single name > **24%** → cut to 23%; sum of names each > **4.8%** > **50%** → cut the cohort.
- **The live single-name breach is AMZN in XLY at 24.36%** (State Street file, 2026-09-03) — ≈$311M, ≈0.04 days of AMZN ADV.
- **XLE is the chronic cohort breach: 57.53%.** Trim falls on VLO and PSX — **PSX ≈0.6 days ADV**, the tightest leg on the board.
- **XLK does not bind and is not close.** Cohort **38.10%**; AVGO at 4.56% has fallen *out* of the >4.8% group.
- **The 2024 XLK/AAPL shape is the tail risk to watch, not the base case** — a cohort crossing 50% dumps the entire trim on its *smallest* member.
- Watch item for every pulse: whether a fourth XLK name re-crosses **4.8%**, which is what makes that cohort discontinuous.
- Dated watch list: Sep dress rehearsal **2026-09-11** → effective **2026-09-18** → scoring file **2026-09-22** · Dec pair **2026-12-11 / 2026-12-18** · March **2027-03-12 / 2027-03-19** · conditional secondary reweighting **2027-03-31** (proposed `estimate`, this PR).

## Initial research

### The question

2027-03-12 is on this calendar because the `opex-2027-03-19` adjacency sweep found an SEC filing that
dates it. That sweep's claim was that this close "sizes the largest mechanical component" of the
witching auction. Is that true, how large is the component actually, and does anything about a
reference close support a play?

**One-line verdict:** the mechanism is real and better-sourced than the witching's own date, but the
sweep overstated it — on issuer-primary holdings the whole capping trade is **≈$1.1B across $391B of
assets**, concentrated in XLE, XLY and XLC rather than XLK, and the honest output is a corrected
size, a resolved rule ambiguity, two registered predictions and a stand-aside.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) —
`symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` carries no index-flow
instrument. This session did **not** take the two September sibling ledgers' arithmetic on faith:

- **SEC EDGAR** — Select Sector SPDR Trust Form 497, accession `0001193125-26-031948`
  (filed 2026-01-30), re-fetched direct (HTTP 200, 2,388,335 bytes) and the full capping
  methodology extracted verbatim, not just the two-sentence timing quote the opex ledger carried.
- **EDGAR submissions index** (`data.sec.gov/submissions/CIK0001064641.json`) — checked for a
  superseding filing. Two exist and neither moves the rule: a **485BPOS** (2026-04-24) whose
  document carries no rebalancing language, and a **497** (2026-06-12) that is a redemption-procedure
  supplement. The January 497 remains the operative primary.
- **State Street's own daily holdings files** — `holdings-daily-us-en-<etf>.xlsx` for all eleven
  Select Sector SPDRs (HTTP 200), unzipped and parsed cell-by-cell from the OOXML. Every file
  self-dates **"As of 03-Sep-2026"**. This is the upgrade over both September siblings, which used
  vendor pages stale by up to a month.
- **Yahoo daily total-return bars** — used to back-solve implied post-June-2026-rebalance weights
  from price drift, which is how the rule fork below gets decided against the tape rather than
  against prose.
- House sources: `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
  for `rebalanc|index effect|select sector|capping` → **zero hits**; the two September sibling
  ledgers and [`opex-2027-03-19`](opex-2027-03-19.md) read in full.

### Conviction legs, tested

1. **The 2027-03-12 date is right, and the rule behind it is the best-sourced fact in the March
   corridor — SUPPORTED.** The 497 states the rebalancing "occurs at the closing prices of the second
   Friday of March, June, September and December. Changes will become effective after the market
   close on the third Friday." March 2027's Fridays are 03-05 / **03-12** / 03-19 / 03-26; the second
   is 03-12, an ordinary unadjusted trading day (Good Friday is 03-26). Note the asymmetry the opex
   ledger named and this session reproduces independently: the *witching session* 2027-03-19 is
   `estimate` on convention, while the rule putting this rebalance's MOC on it is SEC-filed and
   unconditional. The entry stays `estimate` anyway — the filing dates the rule, not the 2027
   instance, and no 2027-dated S&P DJI schedule was fetched.

2. **There are two independent cap tests, and the folklore version of both is wrong — SUPPORTED.**
   Verbatim from the 497: "(i) the market capitalization-based weighted value of any single Component
   Stock measured with prices as of the reference date and membership, shares outstanding and
   investable weight factors as of the rebalancing effective date may not exceed **24%** … and (ii)
   the sum of the constituent stocks with weight greater than **4.8%** cannot exceed **50%**." The
   commonly quoted "25/50 RIC rule" is not this index family's rule. **This also resolves the
   Morningstar "23/4.5/50" vs SEC "24/4.8/50" conflict the 09-11 sibling flagged as unreconciled and
   could not settle:** they are the same rule described from opposite ends. 24 / 4.8 / 50 are the
   **trigger thresholds**; 23 / 4.5 / 45 are the **reduce-to targets** named in the same paragraph
   ("reduced to 23%" … "represent 45%" … "so that they each represent 4.5%"). Neither source is wrong
   and nothing needs averaging.

3. **The reference-date / effective-date split is the mechanic, and it is what makes this a separate
   event from 03-19 — SUPPORTED.** Test (i) measures **prices as of the reference date** but
   **membership, shares outstanding and investable weight factors as of the effective date**. So the
   capped weights are struck on a hybrid basis: the 2027-03-12 close fixes the price input and
   nothing after it changes the cap arithmetic, while the trade a fund must actually print grows or
   shrinks with whatever the capped names do over 03-15 → 03-19 relative to their sector. That is why
   a reference close deserves its own entry rather than a footnote in the witching ledger — it is the
   date the *size* is set, one week before the date the size is *executed*.

4. **The literal reading of the SAI's step 2 is refuted by the tape — SUPPORTED, and this is the
   session's load-bearing finding.** Step 2 reads: "the weight of such Component Stocks will be
   reduced **proportionately** so that the sum of such Component Stocks represent 45%." Applied to
   today's XLE that means cutting the whole >4.8% cohort by 12.53pp — **XOM from 19.84% to ~16.08%**,
   a **$5.31B** trade in one fund. The competing reading, which S&P DJI's own Indexology text
   describes and the 09-11 sibling used, is iterative: trim the *smallest* cohort member to 4.5% and
   repeat until the cohort clears 50% — **$700M**, XOM untouched. Prose cannot settle this; drift
   can. Between the June-2026 effective date and 2026-09-03, XOM's XLE weight ratio moved **×0.9787**
   on total-return closes, so its post-June weight was **20.27%** — not the ~16% the proportionate
   reading requires, and 4pp is far outside any plausible measurement error. The same back-solve puts
   META's post-June XLC weight at **17.30%** against a proportionate ~13.6%. **Corroborating
   history:** the June 2024 XLK event the 09-11 sibling banked — AAPL cut to 4.5% while MSFT and NVDA
   stayed large — is only explicable under the iterative reading; a proportionate cut would have
   trimmed all three roughly equally and left AAPL near 18%, not 4.5%. Every size figure in this
   document therefore uses the **iterative** reading, and the fork is registered rather than
   asserted (leg 8).

5. **Only three of eleven sectors bind today, and the concentration story is not where the folklore
   puts it — SUPPORTED.** From State Street's own files, "As of 03-Sep-2026" (weights %, AUM from
   vendor overview pages, trims computed under the iterative reading of leg 4):

   | ETF | AUM | Largest name | Σ of names > 4.8% | Binds? | Illustrative trim |
   |---|---|---|---|---|---|
   | **XLE** | $42.35B | XOM 19.84 | **57.53%** | cohort | VLO 5.19→4.50, PSX 5.46→4.50 = **1.65pp ≈ $700M** |
   | **XLY** | $22.94B | **AMZN 24.36** | 47.39% | single name | AMZN 24.36→23.00 = **1.36pp ≈ $311M** |
   | **XLC** | $22.67B | META 17.62 | **51.13%** | cohort | NFLX 4.88→4.50 = **0.38pp ≈ $87M** |
   | XLV | $44.50B | LLY 14.67 | 44.59% | no | — |
   | XLRE | $8.26B | WELL 11.62 | 43.11% | no | — |
   | XLF | $54.16B | JPM 11.74 | 41.31% | no | — |
   | XLP | $14.47B | WMT 10.13 | 39.69% | no | — |
   | XLU | $22.08B | NEE 13.07 | 39.44% | no | — |
   | **XLK** | **$119.67B** | NVDA 14.90 | **38.10%** | **no** | — |
   | XLB | $8.62B | LIN 12.97 | 32.30% | no | — |
   | XLI | $31.71B | CAT 6.72 | 18.03% | no | — |

   Three readings fall out. **XLK, the largest fund by a factor of two, has the third-widest headroom
   of the eleven** — 11.90pp — and it is wider than the 09-11 sibling's ~8pp because AVGO has fallen
   to **4.56%** and left the cohort; that sibling's 42.02% came off a 2026-08-07 vendor page and the
   issuer file supersedes it. **The one live breach of the hard single-name limit is AMZN in XLY**, a
   fact neither September ledger looked for because neither examined XLY. And **the total is small**:
   ≈$1.10B one-way against **$391.43B** of Select Sector SPDR assets, **0.28%**.

6. **Liquidity, not dollars, is where a capping trade could bite — and the tightest leg is a mid-cap
   refiner — SUPPORTED.** Trim sizes against each name's own 20-session dollar ADV (Yahoo, through
   the 2026-09-04 close): **PSX $407M vs $0.67B ADV = ~0.61 days**; **VLO $292M vs $0.82B = ~0.36
   days**; NFLX $86M vs $2.22B = ~0.04 days; **AMZN $312M vs $8.58B = ~0.04 days**. So the largest
   *dollar* leg (AMZN) is the most trivially absorbed, and the binding constraint sits on PSX and
   VLO. This is the same flow-relative-to-liquidity frame the 09-11 sibling used to reconcile "the
   index effect is dead" with "rebalance flows move prices," reproduced here on issuer data. **These
   are the SPDR funds only** — other products track the same indices, so every days-of-ADV figure is
   a floor, not a total.

7. **The seeding entry overstated this event, and the correction is worth carrying — MIXED.** The
   calendar note calls this close "the largest mechanical component" of the 2027-03-19 auction. On
   these numbers the *capping* component is ~$1.1B, which is not large next to the ~$250B whole-index
   rebalance the 09-04 sibling banked as press color. What is genuinely large in the Select Sector
   family is the routine share-count and investable-weight-factor housekeeping across $391B of
   assets, which carries no cap breach and no names — the same ~90%-is-housekeeping finding the 09-04
   sibling took from S&P DJI's own Indexology. So the honest statement is: **this close sets the size
   of a concentrated, single-name, ~$1B-scale trade sitting inside a much larger and much duller
   housekeeping trade.** MIXED rather than REFUTED because the capping leg *is* the part with
   single-name price impact, which is what the seeding note was reaching for.

8. **The rule fork is cheaply decidable before this event, and it is registered — SUPPORTED.** The
   September 2026 rebalance runs the identical rule on the identical funds: reference close
   **2026-09-11**, effective after the **2026-09-18** close. State Street republishes holdings daily,
   so the first file dated on or after **2026-09-22** carries the post-capping weights. The two
   readings make incompatible predictions about it — proportionate puts XOM near 16%, iterative
   leaves it near 20% — and a single fetch scores it. Registered as
   **FT-sp-rebalance-reference-close-2027-03-12-1**. A second, conditional prediction tests step 1
   directly: **FT-sp-rebalance-reference-close-2027-03-12-2**, that AMZN's post-capping XLY weight
   prints 23.0% ± 0.3 if it is above 24% at the 09-11 close. Backing that up, the same drift
   back-solve puts AMZN's post-June-2026 weight at **22.90%** — within 0.1pp of the rule's own 23.00%
   target, which is about as clean a fingerprint as an unobservable process leaves.

9. **No house playbook is index-flow-keyed — SUPPORTED, re-verified not inherited.**
   `trade-playbooks.md` and `multi-symbol-sweep.md` grepped this session for
   `rebalanc|index effect|select sector|capping`: **zero hits**. S1/G1 are earnings-dated run-ups, S2
   the never-hold-the-print guard, S3 an earnings reaction-day fade (blocked on shorting), S4 an
   overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open execution rule. The only
   contact is **S4 execution hygiene**: S4's close-side preference runs into this rebalance's MOC on
   2027-03-19, a guard [`opex-2027-03-19`](opex-2027-03-19.md) already carries.

10. **Adjacency — this close sits at the head of the corridor, not inside it — SUPPORTED.** Within
    five days of 2027-03-12 the calendar tracks exactly two events, both on 2027-03-17:
    [`fomc-2027-03-17`](fomc-2027-03-17.md) (first SEP of 2027, `estimate`) and
    [`vix-expiration-2027-03-17`](vix-expiration-2027-03-17.md) (`estimate`). The witching itself is
    seven days out and outside the window. So unlike the September analogue — whose reference close
    landed on a CPI-and-UMich day — **2027-03-12 currently has no macro print scheduled on it at
    all**, which means the prices that set the caps are struck on an ordinary tape. That is a
    difference worth carrying: the September mechanism was "a CPI surprise resizes the trade," and
    here there is nothing on the day to resize it. No tracked-name earnings sit in the 03-12 → 03-31
    corridor (mega-caps report late January and late April). **One dated adjacency proposed as a new
    `estimate` file in this PR:** `sp-select-sector-secondary-reweight-2027-03-31`, the conditional
    quarter-end backstop the same 497 dates, which this event's own calendar note deliberately left
    for a later session to source properly.

### What the conditions support

Nothing directional, at any horizon. What the conditions support is **a corrected size, a resolved
ambiguity, and two measurements**:

- **Discipline.** The 2027-03-19 close carries this rebalance's MOC on top of single-stock option
  settlement. That is an execution guard on high-open-interest names, inherited unchanged from
  `opex-2027-03-19`, and this ledger does not add a second one for 2027-03-12 — a reference close
  strikes prices, it does not print a trade.
- **Measurement.** Two predictions registered on a 17-day horizon that between them fix how the
  central sentence of the governing filing should be read, six months before this event needs it.

### Honest limits

Every weight here is dated **2026-09-03** and describes September 2026, not the 2027-03-12 reference
close 188 days away; they are used to size the *mechanism*, and no reading of them forecasts which
names bind in March. The holdings files are State Street's ETF holdings, which are the capped index
weights drifted by price plus a cash residual — the tests themselves apply to float-adjusted index
weights recomputed at the reference date with effective-date share counts, a basis this lane cannot
see; a name that was capped down carries an uncapped weight *higher* than its printed one, so the
cohort sums above are floors. AUM figures are vendor (stockanalysis.com), not issuer. The implied
post-June weights are back-solved from total-return closes over 11 weeks and carry accumulated
dividend-adjustment noise — good to a few tenths of a point, which is enough to separate 20.27% from
16% and not enough to adjudicate 4.50% from 4.66%; note also that the June 2026 third Friday
(2026-06-19) was Juneteenth, so the drift baseline used is the 2026-06-18 close. The `$391.43B`
family total covers the eleven SPDR ETFs only, not every product tracking these indices, so all
dollar and days-of-ADV figures are floors. The June 2024 XLK/AAPL history in leg 4 is press-sourced
via the 09-11 sibling ledger and was not re-fetched this session. GOOGL and GOOG are treated as
separate Component Stocks throughout, which is how the holdings file lists them; whether the cap
aggregates share classes at the company level is unresolved and does not bind at current weights
(18.39% combined). Nothing above is a position: shorting is blocked house-wide, no house playbook is
index-flow-keyed, and the date is `estimate`.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived).** Treat 2027-03-12 as a **known-mechanism,
low-impact market-structure close** — the date the capped weights are priced, one week before they
are traded. No position, paper or otherwise, is licensed by it; the `estimate` label bars date-keyed
action independently and no house playbook is index-flow-keyed regardless. Three things are carried
forward. **(a) The size is ~$1B, not "the largest mechanical component"** — on issuer-primary
holdings the whole eleven-fund capping trade is ≈**$1.10B** against **$391.43B** of assets, a
correction to this entry's own seeding note. **(b) The binding names are not the ones folklore
names** — the live single-name breach is **AMZN in XLY at 24.36%**, the chronic cohort breach is
**XLE at 57.53%**, and **XLK does not bind and is not close** (38.10%, AVGO having fallen out of the
cohort). **(c) The rule reads two ways and the iterative one is right** — the SAI's literal
"reduced proportionately … represent 45%" is refuted by XOM sitting at an implied 20.27% straight
out of the June 2026 rebalance, and every size figure here depends on that. The tail risk worth a
line at every pulse is the **2024 XLK shape**: when a cohort crosses 50%, its *smallest* member
absorbs the entire trim in one step, so a fourth XLK name re-crossing 4.8% is the discontinuity to
watch — not a smooth drift.

**Kill switches:**

- **State Street's first XLE holdings file dated on or after 2026-09-22 prints XOM below 18.0%** —
  the proportionate reading of step 2 is right, every dollar figure in this document is roughly 8×
  too small, and legs 4/5/6/7 all rebuild. Registered as `FT-sp-rebalance-reference-close-2027-03-12-1`.
- **AMZN's XLY weight on that same file is not 23.0% ± 0.3, having been above 24% at the 2026-09-11
  close** — the single-name cap does not fire the way leg 2 reads it, which is the one leg that is
  identical under both readings and therefore the one that should be hardest to break. Registered as
  `FT-sp-rebalance-reference-close-2027-03-12-2`.
- **An S&P DJI or SEC-filed methodology change moves the second-Friday reference, the third-Friday
  effective date, or the 24% / 4.8% / 50% thresholds** — re-check EDGAR CIK `0001064641` for a new
  497 or 485BPOS at every pulse; two superseding filings were checked on 2026-09-05 and neither
  touched the rule. Observe by **2026-12-11**, the December reference close.
- **A fourth XLK constituent re-crosses 4.8% and the cohort approaches 50%** — the 2024 single-name
  shape becomes live in the largest fund of the eleven, and this event stops being a ~$1B footnote.
  AVGO at 4.56% is the marginal name; check the issuer file at every pulse.
- **A macro print gets scheduled onto 2027-03-12** — leg 10's "the caps are priced on an ordinary
  tape" reading fails and this close inherits the September analogue's CPI-resizes-the-trade
  mechanism. Re-run the adjacency scan every pulse.
- **A 2027-dated S&P DJI or SPDR rebalance schedule is fetched** — the entry promotes off `estimate`
  if it lists 2027-03-12, or the whole corridor re-dates if it does not. Neither `sectorspdrs.com`
  nor S&P DJI's methodology PDF has served a fetchable schedule to this runner yet; re-attempt each
  pulse.
- **A house index-flow instrument gets built** — leg 9's "no playbook is index-flow-keyed" stops
  being a grep result and starts being a measurement, and this sheet is rebuilt on house data.

**Registered forward tests.** `FT-sp-rebalance-reference-close-2027-03-12-1` and `-2` — see
[`forward-tests/sp-rebalance-reference-close-2027-03-12.md`](../forward-tests/sp-rebalance-reference-close-2027-03-12.md).
Both score **2026-09-25**, six months before this event, which is the point: they settle how to read
the governing filing while there is still time for the answer to matter.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D188 | Initial research banked; probe-ref baseline set (no symbols, **VIX 14.53** at the 2026-09-04 close, band `low:15+`, 2 adjacents). **Method upgrade over both September siblings: State Street's own daily holdings files for all eleven Select Sector SPDRs (`holdings-daily-us-en-*.xlsx`, HTTP 200, each self-dated "As of 03-Sep-2026") parsed cell-by-cell from OOXML, replacing vendor pages stale by up to a month.** SEC 497 acc. `0001193125-26-031948` re-fetched (2,388,335b) and the FULL capping methodology extracted, not just the timing quote: two independent tests — single name > **24%** → cut to 23%; Σ of names each > **4.8%** > **50%** → cut the cohort. **This resolves the Morningstar "23/4.5/50" vs SEC "24/4.8/50" conflict the 09-11 sibling flagged unreconciled: same rule, thresholds vs reduce-to targets, nothing to average.** EDGAR submissions checked for supersession — 485BPOS 2026-04-24 (no rebalance language) and 497 2026-06-12 (redemption procedures only); January 497 remains operative. **Headline correction to this entry's own seeding note:** the whole eleven-fund capping trade is **≈$1.10B one-way against $391.43B of assets (0.28%)**, not "the largest mechanical component" of the 03-19 auction. **Only 3 of 11 sectors bind, and XLK is not one:** XLE cohort **57.53%** (trim VLO+PSX ≈ $700M), XLY **AMZN 24.36% over the hard 24% limit** (≈$311M — neither September ledger examined XLY), XLC **51.13%** (NFLX ≈ $87M); XLK cohort **38.10%**, wider than the sibling's stale ~42% because AVGO fell to **4.56%** and left the cohort. Liquidity, not dollars, is the constraint: **PSX ≈0.61 days ADV**, VLO ≈0.36, AMZN ≈0.04. **Load-bearing find — a rule ambiguity no ledger had surfaced:** step 2 reads literally as a *proportionate* cut of the cohort to 45% (XLE alone **$5.31B**, XOM 19.84→16.08) vs Indexology's *iterative* trim-the-smallest-to-4.5% ($700M, XOM untouched). Decided against the tape, not the prose: back-solving weight drift 2026-06-18→2026-09-03 puts XOM's post-June weight at **20.27%** and META's at **17.30%**, both incompatible with the proportionate reading, and AMZN's at **22.90%** — within 0.1pp of the rule's own 23.00% single-name target. June 2024's XLK/AAPL cut to 4.5% corroborates (proportionate would have left AAPL ~18%). All sizes here use the iterative reading. **Adjacency sweep — peers:** none, `symbols: []`, no tracked-name print in 03-12 → 03-31. **Macro:** only two tracked events within 5 days, both 2027-03-17 (`fomc-2027-03-17`, first SEP of 2027; `vix-expiration-2027-03-17`) — so unlike the September analogue struck on a CPI day, **2027-03-12 currently carries no macro print at all**, and the caps price on an ordinary tape. **Volatility regime:** baseline row, no prior to diff; VIX **14.53** (09-04 close) vs 16.34 on 09-01 — calm end of the 2026 range and uninformative at D-188. **Geopolitical:** nothing touching index-capping mechanics. **Event tape:** `trade-playbooks.md` + `multi-symbol-sweep.md` grepped for `rebalanc\|index effect\|select sector\|capping` → **zero hits**; no house playbook is index-flow-keyed, re-verified not inherited. **One dated adjacency proposed as `estimate` in this PR:** `sp-select-sector-secondary-reweight-2027-03-31` — the conditional quarter-end backstop the same 497 dates (test on the second-to-last business day, Tue 2027-03-30; effective after the close of the last, Wed 2027-03-31; Good Friday 2027-03-26 falls in the prior week and moves neither), which this event's own note deliberately left for a later session to source. Registered **FT-...-1** (XLE/XOM ≥18.0% on the first post-2026-09-22 file, killing the proportionate reading) and **FT-...-2** (AMZN prints 23.0% ± 0.3 if above 24% at the 09-11 close), both scoring **2026-09-25** — six months before this event needs the answer. | — (stance set: stand aside on all four horizons; the output is a corrected size, a resolved rule ambiguity and two measurements) | 2026-10-05 (low, ≥15d band: every 30d) |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`)
in the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
