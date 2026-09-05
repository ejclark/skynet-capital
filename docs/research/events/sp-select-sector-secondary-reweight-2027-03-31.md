# Select Sector indices — conditional quarter-end secondary reweighting (24%/4.8%/50% breach test) — sp-select-sector-secondary-reweight-2027-03-31

**Kind:** sector · **Date:** 2027-03-31 (estimate — EST: rule-derived, not a scheduled publication. SEC EDGAR, Select Sector SPDR Trust Form 497, accession 0001193125-26-031948, re-fetched direct 2026-09-05 (HTTP 200, 2,388,335 bytes) and re-parsed independently by this session: "if, on the second to last business day of March, June, September, or December a company has a weight greater than 24% or the sum of the companies with weights greater than 4.8% exceeds 50%, a secondary reweighting will be triggered with the reweighting effective date being after the close of the last business day of the month." March 2027's last business day is Wed 2027-03-31 and the second-to-last is Tue 2027-03-30. Stays estimate because the trigger is CONDITIONAL — no primary source can pre-confirm a breach) · **Impact:** low
**Last assessed:** 2026-09-05
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["boj-summary-of-opinions-2027-03-29","ftc-v-amazon-antitrust-trial-2027-03-29","good-friday-market-closure-2027-03-26","japan-cpi-tokyo-flash-2027-03-26","japan-food-tax-cut-2027-04-01"],"screenStreak":0} -->

## At a glance

**TL;DR.** **Stand aside — and note that this quarter's version of the backstop is the weakest of the
four, for a reason no sibling ledger had computed.** The trade, if it fires, is struck at the
**2027-03-30** close and clears after the **2027-03-31** close, with no announcement. Three findings
came out of going back to the SEC primary rather than inheriting sibling arithmetic. **(1) March 2027
has the shortest reset-to-test drift window of any quarter — six sessions, not seven** — because Good
Friday **2027-03-26** removes one. The 2027-03-19 rebalance re-caps everything, and a breach then has
to re-open inside those six sessions; on ten years of tape, the one live single-name path (AMZN
regaining 24% of XLY from a 23.00% cap, needing **+4.35% relative**) prints in **8.7%** of six-session
windows versus **10.3%** of seven-session ones. **(2) The two sibling ledgers contradict each other on
the capping rule, and the tape refutes the evidence both used.** Backing XLE's weights out of price
drift to the June-2026 effective close puts its over-4.8% cohort at **41.23%** — comfortably under the
50% trigger, with **no name sitting at 4.50%** — so the cohort cap **never fired last quarter** and
XOM's much-cited 20.28% says nothing about how step 2 is applied. The single-name cap *did* fire:
AMZN back-solves to **22.90%** against the filing's own 23.00% target. **(3) That unresolved fork is
not a sizing detail here — it is this event's entire probability.** Post-cap, the filing-literal
reading leaves XLE's cohort **17.70pp** below the trigger and the iterative reading leaves it
**2.88pp** below, one refiner's ordinary week away. September 2026 settles it. The date is `estimate`
and the trigger conditional; nothing here licenses a position, and no house playbook is
index-flow-keyed (re-grepped: zero hits).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-207, `symbols: []`, no house playbook is index-flow-keyed, and today's weights describe September 2026 — the 2027-03-19 rebalance re-strikes every input between now and the test | A house index-flow instrument being built and back-tested before **2027-03-31** — "nothing to size this with" stops being a grep result and this sheet is rebuilt on measured data |
| This week | **Stand aside** | High | Nothing about 2027-03-30 is knowable this week; the only Select Sector date in it is the **2026-09-11** September reference close, which is a different event with its own ledger | Any S&P DJI or SEC publication before **2026-09-11** announcing an *off-cycle* Select Sector reweighting — the quarterly-plus-secondary frame in the 2026-01-30 filing would not be the whole rule |
| This month | **Go read one file, take no position** | Medium | State Street's first post-rebalance holdings file (dated on/after **2026-09-22**) settles the proportionate-vs-iterative fork, which is the difference between this event being 17.70pp out of reach and 2.88pp out of reach | XLE's over-4.8% cohort failing to exceed 50% at the **2026-09-11** reference close — no capping trade prints, the fork stays unobserved for another quarter, and this event's next pulse inherits an untested rule |
| This quarter | **Stand aside** | Medium | The nearer analogues (**2026-09-30** test 09-29, **2026-12-30** test) are separately tracked backstops with the same conditional shape; none is actionable and none is March | An S&P DJI or SEC-filed methodology change published before **2026-12-30** moving the 24% / 4.8% / 50% thresholds or the second-to-last-business-day test |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` and the trigger **conditional** — it widens caution about the 2027-03-30/03-31 closes and licenses no date-keyed action.
- **Never trade the test.** No pre-announcement exists; the result is visible only after the 03-31 close.
- **Six drift sessions, not seven** — Good Friday **2027-03-26** makes March the shortest of the four quarters (Sep 7 · Dec 7 · **Mar 6** · Jun 7).
- **One session of execution runway**, against the quarterly rebalance's five (reference 03-12 → effective 03-19). Same mechanic, one-fifth the time.
- **The single-name path is AMZN in XLY**, the only name over 24% across all eleven funds (**24.36%**, issuer file 2026-09-03). From a 23.00% cap it needs **+4.35% relative in six sessions** — a measured **8.7%** of six-session windows over ten years.
- **The cohort path depends entirely on an unresolved rule fork**: post-cap headroom is **17.70pp** (filing-literal) or **2.88pp** (iterative) in XLE; **21.02pp** or **3.67pp** in XLC.
- **The cohort breach is a refiner story, not a mega-cap one** — 100% of XLE's +16.30pp cohort move since June came from MPC/PSX/VLO crossing 4.8% on +27–32% relative moves over eleven weeks.
- **The FTC v. Amazon trial opens 2027-03-29, one session before the test** — but our own measured comparable puts the effect at ≈zero (see leg 8), so it is a named path, not a live one.
- Dated watch list: Sep reference **2026-09-11** → effective **2026-09-18** → fork-scoring file **2026-09-22** → Sep test **2026-09-29** · Dec pair **2026-12-11 / 2026-12-18**, test **2026-12-30** · March reference **2027-03-12** → effective **2027-03-19** → **test 2027-03-30** → effective after **2027-03-31**.

## Initial research

### The question

`sp-select-sector-secondary-reweight-2027-03-31` was filed by the `sp-rebalance-reference-close-2027-03-12`
adjacency sweep as "a backstop, not a base case," on the reasoning that the 2027-03-19 rebalance
re-caps everything so a 03-30 trigger is unlikely. Is that right, *how* unlikely, and does the
arithmetic this event inherits from two sibling ledgers survive a direct read of the primary?

**One-line verdict:** the backstop framing survives and gets stronger — March is mechanically the
least likely of the four quarters — but the inherited arithmetic does not: the two siblings reach
**opposite** conclusions about the capping rule, the tape evidence one of them used is drawn from a
quarter where the cohort cap never fired, and the unresolved fork turns out to set this event's
firing probability rather than merely its trade size.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry
carries `symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow
instrument. Nothing below is taken from a sibling ledger on faith:

- **SEC EDGAR** — Select Sector SPDR Trust Form 497, accession `0001193125-26-031948`, index and
  document both re-fetched direct (HTTP 200, 2,388,335 bytes) and the **complete four-step** capping
  methodology extracted verbatim. Both siblings quoted step 2 alone; **steps 3 and 4 appear in no
  ledger in this repo** and they change the arithmetic.
- **State Street's own daily holdings files** — `holdings-daily-us-en-<etf>.xlsx` for all eleven
  Select Sector SPDRs (HTTP 200), unzipped and parsed cell-by-cell from the OOXML by this session,
  independently of the fetch that seeded this entry. All eleven self-date **"As of 03-Sep-2026"**.
- **Yahoo daily total-return bars** — for the drift back-solve, and for a ten-year base rate on the
  re-breach move (2016-09-12 → 2026-09-04, n=2,510 overlapping windows).
- **This repo** — `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped
  for `rebalanc|index effect|select sector|capping|secondary reweight` → **zero hits**; the two
  sibling ledgers, [`ftc-v-amazon-antitrust-trial-2027-03-29`](ftc-v-amazon-antitrust-trial-2027-03-29.md)
  and [`good-friday-market-closure-2027-03-26`](good-friday-market-closure-2027-03-26.md) read in full;
  the calendar's own adjacency computed with `computeAdjacentIds`' ±5-day rule.

### Conviction legs, tested

1. **The dates are right, and the mechanism is primary-sourced — SUPPORTED.** The 497 states the
   secondary trigger verbatim as quoted in the header, and continues: *"This secondary reweighing will
   use the Select Sector Index constituent capped index weights as of the second to last business day
   of March, June, September, or December, utilizing the current additional weight factors and
   membership, shares outstanding, and investable weight factors as of the reweighting effective
   date."* March 2027's Fridays are 03-05 / 03-12 / 03-19 / **03-26 (Good Friday, closed)**; the last
   business day is **Wed 2027-03-31** and the second-to-last **Tue 2027-03-30**, computed mechanically
   here against the NYSE 2027 closure list. The entry stays `estimate` because the *trigger* is
   conditional, not because the date is doubtful — the same honest reason the September sibling gave.

2. **The filing has FOUR steps, not two, and no ledger in this repo had quoted the last two —
   SUPPORTED, and it partially reconciles the sibling conflict.** Verbatim: step 1, *"each Component
   Stock that exceeds 24% … will be reduced to 23%"*; step 2, *"if the sum of Component Stocks that
   each exceed 4.8% … exceeds 50% …, the weight of such Component Stocks will be reduced
   proportionately so that the sum of such Component Stocks represent 45%"*; **step 3**, *"if any
   Component Stocks represent less than 4.5% … as a result of the application of the second step …,
   the excess weight from the first and second steps … will first be applied to such Component Stocks
   so that they each represent 4.5%"*; **step 4**, *"if a Component Stock represents between 4.5% and
   4.8% … prior to the first three steps, the weight of such Component Stock shall be reduced to
   4.5%."* Step 3 matters because it **partially reverses** step 2 for the small cohort members —
   which is why the "iterative trim-the-smallest-to-4.5%" description and the filing's proportionate
   text produce the *same* end state for small names and differ **only** on the large ones. The two
   readings are therefore separated by exactly one observable: XOM's post-cap weight.

3. **The June 2026 cohort cap never fired, so the tape evidence both siblings leaned on does not
   discriminate — SUPPORTED, and this is the session's load-bearing correction.** Back-solving XLE's
   2026-09-03 issuer weights to the June effective close (2026-06-18; the third Friday 2026-06-19 was
   Juneteenth) on total-return closes gives XOM **20.28**, CVX **14.92**, COP **6.04**, MPC **4.22**,
   PSX **4.29**, VLO **3.99** — an over-4.8% cohort of **41.23%**, **8.77pp below the 50% trigger**,
   and the same computation to the 06-12 *reference* close gives **41.36%**. Two independent
   fingerprints confirm the non-trigger: the cohort is nowhere near either reading's target (45% or
   just-under-50%), and **not one name sits at 4.50%**, which both step 3 and step 4 would have
   produced. So [`sp-rebalance-reference-close-2027-03-12`](sp-rebalance-reference-close-2027-03-12.md)'s
   leg 4 — *"XOM at 20.27% … not the ~16% that reading requires — so the iterative reading is the one
   the tape supports"* — reproduces (I get 20.28%) but does not carry its conclusion: XOM is 20.28%
   because **step 2 never ran**, which is equally consistent with both readings. It is a false
   dichotomy, not a wrong measurement. **The sibling's forward test remains a good one**:
   `FT-sp-rebalance-reference-close-2027-03-12-1` scores off the *September* cycle, where the cohort
   is 57.53% and genuinely does breach — only the corroborating inference in its hypothesis text is
   unsound, and rows are append-only, so this is recorded here rather than edited there.

4. **The single-name cap, by contrast, is confirmed operative — SUPPORTED.** The same back-solve puts
   AMZN's post-June XLY weight at **22.90%** (22.46% to the 06-12 reference close) against the
   filing's own 23.00% step-1 target — within 0.1pp, about as clean a fingerprint as a client-only
   process leaves. So the pair is asymmetric and both halves are useful: **step 1 fires and lands on
   its filed number; step 2's form is still unobserved.**

5. **The fork is not a sizing detail for this event — it is the whole probability — SUPPORTED, and
   this is the finding specific to 2027-03-31.** Running both readings over today's issuer weights,
   the post-rebalance **headroom to the 50% trigger** is:

   | Fund | Pre-cap cohort | Filing-literal post-cap | Headroom | Iterative post-cap | Headroom |
   |---|---|---|---|---|---|
   | XLE | 57.83% | 32.30% | **17.70pp** | 47.12% | **2.88pp** |
   | XLC | 56.03% | 28.98% | **21.02pp** | 46.33% | **3.67pp** |
   | XLY | 47.44% | 46.06% | 3.94pp | 46.06% | 3.94pp |
   | XLK | 38.12% | 38.12% | 11.88pp | 38.12% | 11.88pp |

   The 03-12 sibling framed the fork as an **8× difference in trade size**. For a *secondary* test run
   six sessions after the reset, it is bigger than that: under the filing-literal reading a March
   cohort breach needs roughly four marginal names to cross 4.8% at once and is effectively dead;
   under the iterative reading XLE sits **2.88pp** short with PSX and VLO parked at 4.50%, one
   ordinary refiner week (+6.7% relative — a **2.1%** and **3.9%** ten-year six-session base rate
   respectively) from re-opening it. **The same unresolved sentence therefore decides whether this
   event is a formality or a live risk**, and September 2026 settles it before the next pulse.

6. **March 2027 is mechanically the least likely quarter of the four — SUPPORTED, and it is new.**
   Computed against the NYSE closure list: reference close → effective close → test → effective-after,
   with the count of trading sessions between the reset and the test:

   | Quarter | Reference | Effective | Test (2nd-to-last) | Effective after | Drift sessions |
   |---|---|---|---|---|---|
   | 2026-09 | 09-11 | 09-18 | 09-29 | 09-30 | 7 |
   | 2026-12 | 12-11 | 12-18 | 12-30 | 12-31 | 7 |
   | **2027-03** | 03-12 | 03-19 | **03-30** | **03-31** | **6** |
   | 2027-06 | 06-11 | 06-17 (3rd Fri 06-18 is Juneteenth) | 06-29 | 06-30 | 7 |

   **Good Friday 2027-03-26 removes exactly one drift session.** This entry's own calendar note says
   the holiday "moves neither date," which is true and incomplete — it does not move the dates, it
   shortens the window in which a breach can re-open, by 14%. Priced on the single-name path: AMZN
   needs **+4.35% relative** to XLY to regain 24% from a 23.00% cap, which printed in **219 of 2,510**
   six-session windows (**8.7%**; 8.5% over the last three years) versus **258 of 2,509** seven-session
   windows (**10.3%**; 10.6% recent). Juneteenth pulls June's *effective* date back a day but leaves
   its drift window at seven, so March is alone in this.

7. **Execution runway, not dollar size, is what distinguishes the secondary from the quarterly —
   SUPPORTED.** The quarterly rebalance strikes prices at the 03-12 close and executes after the 03-19
   close: **five sessions**. The secondary strikes at the 03-30 close and executes after the 03-31
   close: **one session**, with no pro-forma file to the public. That is the precise form of the
   asymmetry the September sibling could only gesture at ("its per-minute intensity is higher than its
   dollar size suggests") — same mechanic, one-fifth the runway. It is an execution note for the
   03-31 closing auction, not a signal, and it is the honest reason a ~$300M–$1B trade deserves a
   calendar entry at all.

8. **The scariest-looking adjacency is dated, specific, and measured to be small — SUPPORTED.**
   [`ftc-v-amazon-antitrust-trial-2027-03-29`](ftc-v-amazon-antitrust-trial-2027-03-29.md) — the FTC's
   monopolization bench trial — opens **one session before** the 03-30 test, and AMZN is the only name
   across eleven funds above the hard 24% limit. The mechanism is real: an AMZN repricing on 03-29 or
   03-30 lands directly on the single-name leg. But that ledger already measured the comparable rather
   than assuming one — the US v. Google search-trial **opening** (2023-09-12) moved GOOGL **−1.15%**
   against QQQ **−1.11%**, an excess of **−0.04%** — and it is a bifurcated, liability-only bench trial
   whose remedy phase is years out. Against a required **+4.35%**, and with the wrong sign, the
   measured effect is ~1% of what the leg needs. **Named as a watch item, not a probability.**

9. **The eleven-fund screen, reproduced independently — SUPPORTED.** Issuer files, all self-dated
   2026-09-03; cohort = sum of weights strictly above 4.8%. XLE **57.53%** (XOM 19.84) · XLC **51.13%**
   (META 17.62) · XLY 47.39% (**AMZN 24.36**, the one single-name breach) · XLV 44.59% (LLY 14.67) ·
   XLRE 43.11% (WELL 11.62) · XLF 41.31% (JPM 11.74) · XLP 39.69% (WMT 10.13) · XLU 39.44% (NEE 13.07)
   · XLK **38.10%** (NVDA 14.90) · XLB 32.30% (LIN 12.97) · XLI 18.03% (CAT 6.72). This matches the
   03-12 sibling to the second decimal on every fund, from a fetch and parse done independently — the
   September sibling's stale-vendor six-fund table (XLK 42.02% etc.) is superseded, not by my
   preference but because the issuer file supersedes a month-old vendor page.

10. **Step 4 makes the sibling's binds / does-not-bind binary incomplete — MIXED, and registered
    rather than asserted.** Step 4 reduces any name between 4.5% and 4.8% *"prior to the first three
    steps"* to 4.5%, with no reference to a breach. Read plainly, that fires in **XLK** — AVGO at
    **4.56%**, in a fund whose cohort is 38.10% and whose top name is 14.90%, nowhere near either
    limit — for a ~0.06pp trim of $119.67B ≈ **$70M**. But the whole four-step paragraph is prefaced
    *"If on the second Friday … a Component Stock … approaches the maximum allowable value limits …
    the percentage … will be reduced … in accordance with the following methodology"*, and the filing
    never defines "approaches." So step 4 either fires unconditionally or only inside a breaching
    fund, and the filing cannot settle it. **MIXED, and cheap to observe:** registered as
    `FT-sp-select-sector-secondary-reweight-2027-03-31-2`, scoring on the same September file the
    sibling's fork test uses.

11. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` grepped this session for
    `rebalanc|index effect|select sector|capping|secondary reweight`: **zero hits**. S1/G1 are
    earnings-dated run-ups, S2 the never-hold-the-print guard, S3 an earnings reaction-day fade
    (blocked on shorting), S4 an overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open
    execution rule. The only contact point is **execution hygiene** on the 03-31 closing auction.

12. **Adjacency — a quiet corridor with one AMZN-shaped exception — SUPPORTED.** Within ±5 days of
    2027-03-31 the calendar tracks five events, all `estimate`:
    [`good-friday-market-closure-2027-03-26`](good-friday-market-closure-2027-03-26.md) and
    [`japan-cpi-tokyo-flash-2027-03-26`](japan-cpi-tokyo-flash-2027-03-26.md) (03-26),
    [`boj-summary-of-opinions-2027-03-29`](boj-summary-of-opinions-2027-03-29.md) and
    [`ftc-v-amazon-antitrust-trial-2027-03-29`](ftc-v-amazon-antitrust-trial-2027-03-29.md) (03-29),
    and [`japan-food-tax-cut-2027-04-01`](japan-food-tax-cut-2027-04-01.md). **This is a far quieter
    corridor than the September analogue**, whose 09-30 effective close carried PCE, the third GDP
    estimate, ADP, Chicago PMI, a G20 ministerial and a government-funding deadline — eighteen tracked
    events inside five days against five here. No US macro print is currently scheduled on either
    03-30 or 03-31. **Peers:** none (`symbols: []`); no tracked-name earnings in the 03-19 → 03-31
    corridor (mega-caps report late January and late April). **Vol regime:** baseline row, no prior to
    diff — VIX **14.53** at the 2026-09-04 close, five-session path 14.43 / 14.92 / 16.34 / 15.20 /
    14.32 / 14.53; SPY **770.19**, XLE **64.06**, XLY **114.91**, XLK **187.28**, XLC **112.03**.
    **Geopolitical:** nothing touching index-capping mechanics; the SIFMA bond early close 2027-03-25
    sits six days out, outside the window, and is fixed-income only. **No new dated adjacent event is
    proposed.** The June 2027 sibling test (**2027-06-29** test, effective after the **2027-06-30**
    close) follows from the same rule and is dated, but sits a quarter outside this corridor — filed
    here as a watch-list item, the same deliberate call the September sibling made for the December
    one, not an omission.

### What the conditions support

Nothing directional, on any horizon. Four outputs: **a correction** (the June 2026 cohort cap never
fired, so the tape evidence the sibling used to settle the rule fork does not settle it); **a
sharpening** (the fork sets this event's firing probability, not just its trade size — 17.70pp of
headroom versus 2.88pp); **a measurement** (the first base rate anyone here has put on the re-breach
move — 8.7% of six-session windows, and the six-vs-seven session difference Good Friday causes); and
**two registered predictions** that between them make the next pulse cheaper than this one.

### Honest limits

Every weight is dated **2026-09-03** and describes September 2026, not the 2027-03-30 test 207 days
away; they size the *mechanism*, and nothing here forecasts which names bind in March. The holdings
files are State Street's ETF weights — capped index weights drifted by price plus a cash residual —
not the float-adjusted index weights the test actually applies to, so every cohort sum is a floor and
the post-cap tables in leg 5 are my application of a rule to a proxy, not S&P DJI's published
pro-formas. The back-solve assumes no share-count or membership change between the June effective
close and 2026-09-03 and rests on total-return closes carrying eleven weeks of dividend-adjustment
noise — good to a few tenths of a point, enough to separate 41.23% from 45% or 50% and not enough to
adjudicate 4.50% from 4.56%. The base rates in leg 6 are **unconditional overlapping windows**, not
independent draws, and the post-rebalance window is not a random one; they are conditional on AMZN
being capped at the 03-12 reference close at all, which itself is not knowable now. `FANG`-style
constituents, other products tracking these indices, and the ten funds' AUM figures are not
re-sourced here. Leg 10's step-4 reading is unresolved by the filing's own text and is registered, not
claimed. The FTC-trial comparable in leg 8 is one observation from a different company, inherited from
a sibling ledger and not re-fetched. Every trading-adjacent statement carries this entry's `estimate`
label and its conditional trigger; shorting is blocked house-wide and no house playbook is
index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived; mechanism `SEC:`-primary).** Treat 2027-03-31 as an
**unannounced, conditional, low-impact backstop — and the weakest of the four quarterly instances.**
No position is licensed by it on any horizon. The refusal rests on three legs that are measured rather
than asserted. **(a) The window is the shortest of the year.** Good Friday 2027-03-26 leaves **six**
drift sessions between the 03-19 reset and the 03-30 test where every other quarter has seven, and on
ten years of tape that moves the single-name re-breach from a **10.3%** to an **8.7%** base rate.
**(b) The corridor is quiet.** Five tracked events within five days against the September analogue's
eighteen, and no US macro print currently scheduled on either the test or the effective close — so
unlike September, there is nothing on the day to resize the trade. **(c) Even a fired reweighting is
small and, in the one name that could fire it, trivially absorbed** — AMZN trimmed 1.36pp of a $22.94B
fund ≈ **$311M**, ≈0.04 days of its own dollar ADV. What is *not* settled, and is carried forward as
this event's central open question: **the proportionate-vs-iterative fork decides whether the cohort
leg is 17.70pp out of reach or 2.88pp out of reach**, and until September's post-rebalance file is
read, this ledger cannot honestly rank the two paths. Carry forward one correction that outlives this
event: **XOM's ~20.3% post-June-2026 weight is not evidence for either reading**, because XLE's cohort
was 41.23% at that rebalance and step 2 never ran.

**Kill switches:**

- **State Street's first XLE holdings file dated on or after 2026-09-22 prints XOM below 18.0%** — the
  filing-literal reading is operative, XLE's March headroom is ~17.7pp, and the cohort leg of this
  event is effectively dead for the quarter. (The sibling's `FT-sp-rebalance-reference-close-2027-03-12-1`
  scores this; not re-registered here.)
- **AVGO prints at its drifted market weight, not 4.50%, on the first XLK file dated on or after
  2026-09-22** — step 4 fires only inside a breaching fund, leg 10's reading is wrong, and marginal
  names enter every drift window closer to 4.8% than this ledger assumes. Registered as
  `FT-sp-select-sector-secondary-reweight-2027-03-31-2`.
- **A secondary reweighting actually triggers on 2026-09-29 or 2026-12-30** — the "backstop, not a
  base case" frame this event inherited is wrong at a 1-in-2 or better rate, and the March instance
  needs re-pricing from an observed trigger rather than from mechanism. Registered as
  `FT-sp-select-sector-secondary-reweight-2027-03-31-1`.
- **A US macro print or a tracked-name earnings date gets scheduled onto 2027-03-30 or 2027-03-31** —
  leg 12's "quiet corridor" reading fails and this event inherits the September analogue's
  crowded-close problem. Re-run the adjacency scan every pulse.
- **The FTC v. Amazon trial date moves off 2027-03-29, or its own ledger revises the measured
  opening-day effect materially above ±1%** — leg 8's "named path, not a live one" call needs
  rebuilding; that date has already slipped twice.
- **An S&P DJI or SEC-filed methodology change moves the 24% / 4.8% / 50% thresholds, the
  second-to-last-business-day test, or the four-step sequence** — re-check EDGAR CIK `0001064641` at
  every pulse (two superseding filings were checked by the 03-12 sibling on 2026-09-05 and neither
  touched the rule).
- **A house index-flow instrument gets built** — leg 11's "no playbook is index-flow-keyed" stops
  being a grep result and this sheet is rebuilt on house data.

**Registered forward tests.** `FT-sp-select-sector-secondary-reweight-2027-03-31-1` and `-2` — see
[`forward-tests/sp-select-sector-secondary-reweight-2027-03-31.md`](../forward-tests/sp-select-sector-secondary-reweight-2027-03-31.md).
Observations, never templates.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-05 | D-207 | Initial research banked; probe-ref baseline set (no symbols, **VIX 14.53** at the 2026-09-04 close, band `low:15+`, 5 adjacents). SEC 497 acc. `0001193125-26-031948` re-fetched direct (2,388,335b) and the **complete FOUR-step** capping methodology extracted — **steps 3 and 4 appear in no ledger here**; step 3 floors step-2 casualties back to 4.5%, which is why the "iterative" and "proportionate" descriptions agree on small names and differ only on large ones. All eleven issuer holdings files (`holdings-daily-us-en-*.xlsx`, self-dated **2026-09-03**) parsed independently: screen reproduces the 03-12 sibling to 2dp (XLE **57.53%**, XLC **51.13%**, **AMZN 24.36%** in XLY, XLK **38.10%**). **Load-bearing correction:** back-solving XLE to the June-2026 effective close (**2026-06-18**; 3rd Fri 06-19 was Juneteenth) gives cohort **41.23%** — 8.77pp *under* the trigger — with **no name at 4.50%**, so the cohort cap **never fired last quarter**. XOM's 20.28% (I reproduce it) is therefore consistent with BOTH readings, and the 03-12 sibling's leg-4 inference to "iterative" is a false dichotomy; its FT-1 still scores fine off September, where the cohort does breach. **Step 1 IS confirmed operative:** AMZN back-solves to **22.90%** vs the filing's 23.00% target. **Finding specific to this event:** the fork sets this event's *probability*, not its size — post-cap headroom to the 50% trigger is **17.70pp** (filing-literal) vs **2.88pp** (iterative) in XLE, **21.02pp** vs **3.67pp** in XLC. **Second finding:** **March has 6 drift sessions between reset and test, not 7** (Sep 7 · Dec 7 · **Mar 6** · Jun 7) because **Good Friday 2027-03-26** removes one — the entry's own note that the holiday "moves neither date" is true but incomplete. Priced: AMZN needs **+4.35% rel** from a 23.00% cap, which printed in **8.7%** of 6-session windows vs **10.3%** of 7-session ones (10y, n=2,510; 8.5%/10.6% last 3y) — **the first base rate this repo has on the re-breach move**, a gap the September sibling recorded as unfillable. **Third:** reference→effective is **1 session** for the secondary vs **5** for the quarterly — the execution-runway asymmetry, quantified. XLE's whole +16.30pp cohort move since June was **100%** MPC/PSX/VLO crossing 4.8% on +27–32% relative moves over 11 weeks — a refiner story, not a mega-cap one. **Adjacency — peers:** none (`symbols: []`), no tracked-name print 03-19→03-31. **Macro:** only 5 tracked events within ±5 days (Good Friday + Tokyo CPI flash 03-26, BoJ Summary + **FTC v. Amazon trial open** 03-29, Japan food tax cut 04-01) vs the September analogue's 18 — a **quiet corridor**, no US print on 03-30 or 03-31. The FTC trial lands **one session before the test** on the only name over 24%, but that ledger's own measured comparable (US v. Google opening: GOOGL excess **−0.04%** vs QQQ) is ~1% of the +4.35% needed and the wrong sign — named, not priced. **Vol:** baseline, no prior; VIX path 14.43/14.92/16.34/15.20/14.32/**14.53**; SPY 770.19, XLE 64.06, XLY 114.91, XLK 187.28, XLC 112.03. **Geopolitical:** nothing touching capping mechanics. **Event tape:** playbooks + sweep re-grepped `rebalanc\|index effect\|select sector\|capping\|secondary reweight` → **zero hits**. **No new dated adjacency filed** — the June 2027 sibling (test 06-29 / effective after 06-30) is dated but a quarter outside this corridor; watch-list, the same deliberate call the September sibling made. Registered **FT-…-1** (neither the 2026-09-29 nor the 2026-12-30 secondary test triggers) and **FT-…-2** (AVGO prints 4.50% on the first post-rebalance XLK file, i.e. step 4 fires without a breach). | — (stance set: stand aside on all four horizons; the refusal now has a measured leg — 6 drift sessions and an 8.7% single-name base rate — and one honest open question, the rule fork that decides whether cohort headroom is 17.70pp or 2.88pp) | 2026-10-05 (low, ≥15d band: every 30d). Close-out by 2027-04-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new `src/domain/market-events/<id>.json` (`status: "estimate"`)
in the same PR. Close-out fills `## Outcome` below from re-run instrument data (cache busted first),
never from memory — after which this doc goes quiet.
