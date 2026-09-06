# Select Sector indices — conditional quarter-end secondary reweighting (24%/4.8%/50% breach test) — sp-select-sector-secondary-reweight-2027-06-30

**Kind:** sector · **Date:** 2027-06-30 (estimate — EST: rule-derived, not a scheduled publication. SEC EDGAR, Select Sector SPDR Trust Form 497, accession 0001193125-26-031948, re-fetched direct 2026-09-06 (HTTP 200, 2,388,335 bytes) and re-parsed from raw HTML by this session: "if, on the second to last business day of March, June, September, or December a company has a weight greater than 24% or the sum of the companies with weights greater than 4.8% exceeds 50%, a secondary reweighting will be triggered with the reweighting effective date being after the close of the last business day of the month." June 2027's last business day is Wed 2027-06-30 and the second-to-last is Tue 2027-06-29, computed against the NYSE 2027 closure list (nyse.com, HTTP 200, 109,180 bytes, fetched direct the same session). Stays estimate because the trigger is CONDITIONAL — no primary source can pre-confirm a breach) · **Impact:** low
**Last assessed:** 2026-09-06
<!-- probe-ref: {"symbols":{},"vix":14.53,"daysBand":"low:15+","adjacentIds":["consumer-confidence-2027-06-29","fomc-minutes-2027-06-30","russell-reconstitution-2027-06-25"],"screenStreak":0,"blocked":[{"url":"https://www.lseg.com/en/ftse-russell/index-reconstitution","status":"404","at":"2026-09-06"},{"url":"https://www.lseg.com/content/dam/ftse-russell/en_us/documents/ftse-russell/russell-us-indexes-reconstitution-2027.pdf","status":"404","at":"2026-09-06"},{"url":"https://www.lseg.com/en/ftse-russell/russell-reconstitution","status":"200_CLIENT_RENDERED","at":"2026-09-06"},{"url":"https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX","status":"429","at":"2026-09-06"}]} -->

## At a glance

**TL;DR.** **Stand aside — this is the quarter where the backstop is weakest on the tape and loudest on
the calendar, and those two facts are independent.** The trade, if it fires, is struck at the
**2027-06-29** close and clears after the **2027-06-30** close, with no announcement. Four things came
out of going back to the SEC primary rather than inheriting sibling arithmetic. **(1) The filing has a
FIFTH clause no ledger here had quoted** — after the four capping steps, *"the remaining excess weight …
will be distributed proportionally across all remaining Component Stocks that individually represent
less than 4.5% … provided that the maximum weight of each such remaining Component Stock cannot exceed
4.5%."* Its recipients are defined as sub-4.5% names, which is coherent only with the *proportionate*
step-2 reading — textual evidence on a fork two sibling ledgers argued from tape and neither closed.
**(2) June is the only quarter with a FOUR-session rebalance runway**, because Juneteenth **2027-06-18**
pulls the effective close back to Thursday **2027-06-17**; its drift window stays at the normal seven,
so June's holiday hits the opposite half of the mechanic from March's Good Friday. **(3) That
displacement was assumed by two entries and is now measured** — June 2026 was the identical collision,
and AMZN's back-solved XLY weight lands **22.90%** on the prior business day against the filing's own
**23.00%** target, versus **22.19%** on the next one. **(4) The corridor is the loudest of the four, and
its biggest member was untracked** — FTSE Russell's June reconstitution implements at the **2027-06-25**
close, two sessions before the test; proposed this session. But measured, not assumed: the
recon-containing June drift window cleared the single-name re-breach in **1 of 10** years (**10.0%**)
against a **10.3%** unconditional rate — a loud corridor, not a hotter one. The date is `estimate` and
the trigger conditional; nothing here licenses a position, and no house playbook is index-flow-keyed
(re-grepped: zero hits).

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Today | **Stand aside** | High | D-297, `symbols: []`, no house playbook is index-flow-keyed, and today's weights describe September 2026 — the 2027-06-17 rebalance re-strikes every input between now and the test | A house index-flow instrument being built and back-tested before **2027-06-30** — "nothing to size this with" stops being a grep result and this sheet is rebuilt on measured data |
| This week | **Stand aside** | High | Nothing about 2027-06-29 is knowable this week; the only Select Sector date in it is the **2026-09-11** September reference close, a different event with its own ledger | Any S&P DJI or SEC publication before **2026-09-11** announcing an *off-cycle* Select Sector reweighting — the quarterly-plus-secondary frame in the 2026-01-30 filing would not be the whole rule |
| This month | **Go read one file, take no position** | Medium | State Street's first post-rebalance XLE file (dated on/after **2026-09-22**) is the first quarter where step 2 actually runs, so it settles both the proportionate-vs-iterative fork and whether the 4.5% recipient cap binds | No XLE constituent crossing from below 4.5% to above it on that file *and* the cohort landing near 47% rather than 45% — the fifth clause is not read the way leg 1 reads it, and this ledger's textual argument fails |
| This quarter | **Stand aside** | Medium | The nearer analogues (**2026-09-29** test, **2026-12-30** test) are separately tracked backstops with the same conditional shape; none is actionable and none is June | An S&P DJI or SEC-filed methodology change published before **2026-12-30** moving the 24% / 4.8% / 50% thresholds, the second-to-last-business-day test, or the five-clause capping sequence |

**Signals & conditions** — the buy/sell/hold triggers:

- Date is `estimate` and the trigger **conditional** — it widens caution about the 2027-06-29/06-30 closes and licenses no date-keyed action.
- **Never trade the test.** No pre-announcement exists; the result is visible only after the 06-30 close.
- **Four runway sessions, not five** — Juneteenth **2027-06-18** makes June the only quarter whose primary rebalance gets 06-14→06-17 instead of a full week (Sep 5 · Dec 5 · Mar 5 · **Jun 4**).
- **Seven drift sessions**, the normal count — March's Good Friday cuts *that* window to six; June's holiday leaves it alone and cuts the runway instead. Different halves of one mechanic.
- **The displacement direction is measured, not assumed**: June 2026's identical collision back-solves AMZN to **22.90%** on Thu 2026-06-18 vs **22.19%** on Mon 2026-06-22, against a 23.00% target.
- **The single-name path is AMZN in XLY**, the only name over 24% across all eleven funds (**24.36%**, issuer file 2026-09-03). From a 23.00% cap it needs **+4.35% relative in seven sessions** — **10.3%** of seven-session windows over ten years.
- **Russell reconstitution implements 2027-06-25**, inside the drift window, two sessions before the test — but the recon-containing June window cleared that move in **1 of 10** years (**10.0%**), so it is a flow event to know about, not a raised probability.
- **The corridor is crowded where March's was empty**: consumer confidence **on** the test date, FOMC minutes **on** the effective close, a **1.149×**-volume June quarter-end (the minutes ledger's own measurement).
- **The trigger has no "approaches" ambiguity** — the four-step remedy is prefaced by an undefined "approaches the maximum allowable value limits", but the secondary sentence states a bright line (>24%, or cohort >50%). March's open step-4 question is about the *remedy*, not about whether 06-29 fires.
- Dated watch list: Sep reference **2026-09-11** → effective **2026-09-18** → fork-scoring file **2026-09-22** → Sep test **2026-09-29** · Dec pair **2026-12-11 / 2026-12-18**, test **2026-12-30** · June reference **2027-06-11** → effective **2027-06-17** → recon **2027-06-25** → **test 2027-06-29** → effective after **2027-06-30**.

## Initial research

### The question

`sp-select-sector-secondary-reweight-2027-06-30` was proposed by the `fomc-minutes-2027-06-30`
adjacency sweep, which filed it as a base-case-does-not-fire backstop and noted the point that made it
worth proposing: 2027-06-30 is the one session where a minutes release could plausibly be amplified by
flow, and this entry *is* the flow. Does the backstop framing survive a direct read of the primary; and
is there anything about **June** — as opposed to the September, December and March instances already on
the shelf — that changes the answer?

**One-line verdict:** the backstop framing survives, and June turns out to be the mirror image of March
rather than a copy of it — its holiday shortens the *execution runway* instead of the *drift window*,
its corridor is the busiest of the four rather than the quietest, and the primary filing carries a
fifth clause that nobody here had quoted and that argues against the reading one sibling ledger settled
on.

### Method

Macro / market-structure mode per [`EVENT-RESEARCH.md`](../../process/EVENT-RESEARCH.md) — the entry
carries `symbols: []`, so no symbol-keyed instrument applies and `scripts/research/` has no index-flow
instrument. Nothing below is taken from a sibling ledger on faith:

- **SEC EDGAR** — Select Sector SPDR Trust Form 497, accession `0001193125-26-031948`, document
  `d85739d497.htm`, re-fetched direct (HTTP 200, **2,388,335 bytes**) and the capping paragraph
  extracted verbatim from the raw HTML by this session.
- **NYSE** — `nyse.com/markets/hours-calendars` fetched direct (HTTP 200, **109,180 bytes**); the 2026,
  2027 and 2028 closure columns read off the page itself, not from a rule I applied.
- **FTSE Russell** — *Russell US Equity Indexes* construction and methodology, **v7.2, August 2026**
  (HTTP 200, **746,491 bytes**, 50 pages), text-extracted; Appendix F read in full.
- **State Street's own daily holdings files** — `holdings-daily-us-en-<etf>.xlsx` for all eleven Select
  Sector SPDRs (HTTP 200), unzipped and parsed cell-by-cell from the OOXML by this session,
  independently of the fetch that seeded the March sibling. All eleven self-date **"As of
  03-Sep-2026"** — one session stale against Friday 2026-09-04's close, which is noted in the limits.
- **Yahoo daily adjusted bars** (`query2`; `query1` returned **429** and is recorded in `probe-ref`) —
  for the displacement back-solve and a ten-year base rate (2016-09-06 → 2026-09-04, n=2,514 sessions).
- **This repo** — `docs/plans/trade-playbooks.md` and `docs/research/multi-symbol-sweep.md` grepped for
  `rebalanc|index effect|select sector|capping|secondary reweight|reconstitution` → **zero hits**; the
  three sibling entries ([`2027-03-31`](sp-select-sector-secondary-reweight-2027-03-31.md),
  [`opex-2027-06-17`](opex-2027-06-17.md), [`fomc-minutes-2027-06-30`](fomc-minutes-2027-06-30.md))
  read in full; the proposal file that carried this id read before anything was written.

### Conviction legs, tested

1. **The filing has a FIFTH clause, and it is textual evidence on the fork two siblings could not
   settle — SUPPORTED, and it is new to this repo.** After the four numbered steps the 497 continues,
   verbatim: *"The remaining excess weight after the application of each step described above will be
   distributed proportionally across all remaining Component Stocks that individually represent less
   than 4.5% of the total value of the Select Sector Index, provided that the maximum weight of each
   such remaining Component Stock cannot exceed 4.5% of the total value of the Select Sector Index."*
   Grepped this session: neither *"remaining excess weight"* nor *"distributed proportionally across all
   remaining"* appears anywhere in `docs/` or `src/`, so the March sibling's "steps 3 and 4 appear in no
   ledger in this repo" was itself incomplete. Why it bears on the fork: the clause presupposes an
   *excess* pool and a class of *recipients* defined as sub-4.5% names. That is the shape of the
   proportionate reading — trim the cohort to 45%, then push the freed weight down the tail. The
   "iterative trim-the-smallest-to-4.5%" reading generates no such pool and no such recipient class, so
   it has nothing for this sentence to describe. **This is an argument from text, not a proof**, and it
   does not retire the sibling's tape test; it is registered as
   `FT-sp-select-sector-secondary-reweight-2027-06-30-2` on a distinct observable — the recipient cap.

2. **The recipient cap introduces a capacity constraint, which is real but dormant — SUPPORTED
   (negative result).** If excess weight may only land on names below 4.5%, and none may exceed 4.5%,
   the method can in principle be over-constrained. Tested on all eleven funds' 2026-09-03 issuer
   weights (normalised to 100), excess = step 1 + step 2 + step 4, capacity = Σ(4.5 − w) over
   sub-4.5% names:

   | Fund | Cohort >4.8% | Excess to place | Recipient capacity | Slack |
   |---|---|---|---|---|
   | XLE | 57.70% | 12.83pp | 39.85pp | **+27.02pp** |
   | XLC | 51.15% | 6.96pp | 46.88pp | **+39.92pp** |
   | XLY | 47.43% | 1.38pp | 159.02pp | +157.64pp |
   | XLK | 38.11% | 0.06pp | 266.70pp | +266.64pp |

   Even XLE — the most concentrated fund, with 24 names — has more than twice the capacity it needs.
   **So the clause binds today only through its recipient *definition*, never through its arithmetic.**
   That is worth writing down precisely because it is a null: a later session that rediscovers the
   clause should not spend a session re-testing capacity without a much more concentrated fund.

3. **The dates are right, computed mechanically against a primary closure list — SUPPORTED.** June
   2027's Fridays are 06-04 / 06-11 / **06-18 (Juneteenth observed, closed)** / 06-25. The 497 dates the
   primary rebalance to *"the closing prices of the second Friday"* effective *"after the market close
   on the third Friday"*, and the secondary test to the second-to-last business day. NYSE's own page
   lists exactly one June 2027 closure — *"Friday, June 18 (Juneteenth National Independence Day
   observed)"* — so the last business day is **Wed 2027-06-30**, the second-to-last **Tue 2027-06-29**,
   and the third Friday has no market close to be effective after. The entry stays `estimate` because
   the *trigger* is conditional, not because the date is doubtful.

4. **June is the only quarter with a four-session rebalance runway — SUPPORTED, and it is the finding
   specific to this event.** Computed against the NYSE 2026/2027 closure lists:

   | Quarter | Reference (2nd Fri) | 3rd Fri | Effective | **Runway** | Test (2nd-to-last) | Effective after | **Drift** |
   |---|---|---|---|---|---|---|---|
   | 2026-09 | 09-11 | 09-18 | 09-18 | 5 | 09-29 | 09-30 | 7 |
   | 2026-12 | 12-11 | 12-18 | 12-18 | 5 | 12-30 | 12-31 | 7 |
   | 2027-03 | 03-12 | 03-19 | 03-19 | 5 | 03-30 | 03-31 | **6** |
   | **2027-06** | 06-11 | **06-18 (closed)** | **06-17** | **4** | **06-29** | **06-30** | 7 |

   The March sibling measured that Good Friday 2027-03-26 removes one *drift* session. June's holiday
   does the opposite: it removes one *runway* session (06-14 / 06-15 / 06-16 / 06-17, against a normal
   Mon–Fri five) and leaves the drift window at the standard seven — 06-21 through 06-29. **Two
   holidays, two quarters, opposite halves of the same mechanic**, and only the March half had been
   written down. The practical read is the inverse of March's: this quarter's *secondary* test is
   ordinary, and it is the *primary* rebalance on 06-17 that is compressed.

5. **The prior-business-day displacement is measured, not assumed — SUPPORTED, and it closes an
   inherited assumption.** Two entries ([`2027-03-31`](sp-select-sector-secondary-reweight-2027-03-31.md)
   leg 6, and this event's own proposal) state that Juneteenth pulls the June effective close *back* to
   Thursday, and neither sourced it — the 497 says "after the market close on the third Friday" and is
   silent on a holiday. **June 2026 is the identical collision**: 2026-06-19 was both Juneteenth and
   June's third Friday, and nyse.com's 2026 column lists it closed. Back-solving AMZN's XLY weight from
   the 2026-09-03 issuer file (24.36%) on total-return closes, against the filing's own 23.00% step-1
   target:

   | Candidate effective close | Implied AMZN weight | Distance from 23.00% |
   |---|---|---|
   | 2026-06-17 (Wed) | 22.58% | 0.42pp |
   | **2026-06-18 (Thu, prior business day)** | **22.90%** | **0.10pp** |
   | 2026-06-19 (Fri, 3rd Friday) | — | market closed |
   | 2026-06-22 (Mon, next business day) | 22.19% | 0.81pp |

   The prior day fits **8× better** and no other candidate in the window is closer. Direction, not
   magnitude, is what this establishes — and it agrees with the independent evidence
   [`opex-2027-06-17`](opex-2027-06-17.md) banked for the *expiration* displacement (mean single-name
   relative volume 2.25 on Thu 2026-06-18 versus 1.01–1.09 on the rest of that week). Those are two
   different mechanics that share a date; the expiration one was measured, the **rebalance** one was
   not, and now is. That ledger's warning is honoured here: the SPY-level volume check I ran
   (1.72× / 1.62× on 06-17 / 06-18 against **0.93×** on 06-22) points the same way but is explicitly the
   weak instrument, and it is reported as corroboration, never as the evidence.

6. **The eleven-fund screen reproduces the March sibling exactly, from an independent fetch and parse —
   SUPPORTED.** Cohort = sum of weights strictly above 4.8%, all files self-dated 2026-09-03: XLE
   **57.53%** (XOM 19.84) · XLC **51.13%** (META 17.62) · XLY 47.39% (**AMZN 24.36**, the one
   single-name breach) · XLV 44.59% (LLY 14.67) · XLRE 43.11% (WELL 11.62) · XLF 41.31% (JPM 11.74) ·
   XLP 39.69% (WMT 10.13) · XLU 39.44% (NEE 13.07) · XLK **38.10%** (NVDA 14.90) · XLB 32.30% (LIN
   12.97) · XLI 18.03% (CAT 6.72). Two-decimal agreement on all eleven from a separate download. The
   post-cap headroom tables in the March sibling's leg 5 are computed off these same weights and are
   **not re-run here** — they would reproduce number-for-number, and re-narrating them would spend space
   this event's own findings need.

7. **The secondary trigger carries no "approaches" ambiguity — SUPPORTED, and it scopes March's open
   question.** The four-step remedy is prefaced *"If on the second Friday of any calendar quarter-end
   month … a Component Stock … **approaches** the maximum allowable value limits …"*, and the filing
   never defines "approaches" — which is exactly why the March sibling's leg 10 could not settle whether
   step 4 fires inside a non-breaching fund. But the *secondary* sentence is a separate one with its own
   explicit condition: *"a company has a weight greater than 24% or the sum of the companies with
   weights greater than 4.8% exceeds 50%."* That is a bright line with no undefined term in it. **So the
   unresolved step-4 question is about the remedy applied after a trigger, not about whether 2027-06-29
   fires** — a distinction neither sibling drew, and one that keeps a real open fork from being
   mis-filed as uncertainty about this event's probability.

8. **The corridor is the loudest of the four quarters — SUPPORTED, and it inverts the March finding.**
   Within ±5 days of 2027-06-30 the calendar tracks
   [`consumer-confidence-2027-06-29`](consumer-confidence-2027-06-29.md) (medium, estimate) **on the
   test date** and [`fomc-minutes-2027-06-30`](fomc-minutes-2027-06-30.md) (medium, estimate) **on the
   effective close**, plus the reconstitution proposed in leg 9. Just outside it sit
   [`opex-2027-06-17`](opex-2027-06-17.md) — the displaced quad-witching, which is the *same session* as
   this quarter's rebalance effective close — and
   [`juneteenth-market-closure-2027-06-18`](juneteenth-market-closure-2027-06-18.md). The minutes ledger
   supplies the measurement that matters: June quarter-end runs **1.149×** trailing-60d median `^GSPC`
   volume against a 1.027× all-session mean, where the December dead week runs 0.676×. **March's
   quiet-corridor reading does not transfer.** For an event whose only real-world contact point is
   execution hygiene in a closing auction, a thicker auction is the favourable direction — this is a
   note about depth, not about probability.

9. **The corridor's largest member was untracked, and it is now proposed — SUPPORTED.** FTSE Russell's
   Ground Rules, Appendix F, state the June semi-annual reconstitution's Implementation as the **"4th
   Friday of June"**, defined as *"the day changes are made after the close of the market and become
   effective at the open on the Monday following."* June 2027's fourth Friday is **2027-06-25**, a full
   NYSE session, with changes effective at the open Monday **2027-06-28**. That is the fifth of this
   event's seven drift sessions and two sessions before the test. Proposed as
   `proposals/russell-reconstitution-2027-06-25.from-sp-select-sector-secondary-reweight-2027-06-30.json`,
   `status: "estimate"` — no FTSE Russell 2027 recon calendar was reachable (two 404s and a
   client-rendered page that extracted to 838 characters of nothing; all three recorded in `probe-ref`),
   so this is the owner's standing rule applied forward, not a posted date.

10. **The recon-containing drift window is not hotter — SUPPORTED (negative result), and it is the
    reason leg 9 is filed as a calendar entry rather than as a risk.** The tempting story is that the
    year's heaviest forced-trade day, landing inside the measurement window, raises the odds a capped
    name drifts back through its limit. Measured instead of asserted, on the one live single-name path:
    AMZN needs **+4.35% relative to XLY** to regain 24% from a 23.00% cap. Over ten years
    (2016-09-06 → 2026-09-04, n=2,514) that printed in **259 of 2,507** seven-session windows
    (**10.3%**; 10.7% over the last three years) — reproducing the March sibling's figure exactly from
    an independent pull, and its six-session **8.7%** with it. Restricting to the **10 actual June drift
    windows** (seven sessions ending on June's second-to-last business day, each containing that year's
    recon): 2024 alone cleared it, at +5.52%. **1 of 10 = 10.0%**, against 10.3% unconditional. The
    other nine run −4.72% to +2.58%. n=10 is far too small to call the conditional rate *lower*; it is
    ample to refuse the claim that it is meaningfully higher.

11. **No house playbook fits — SUPPORTED, re-verified not inherited.** `trade-playbooks.md` and
    `multi-symbol-sweep.md` grepped this session for
    `rebalanc|index effect|select sector|capping|secondary reweight|reconstitution`: **zero hits**.
    S1/G1 are earnings-dated run-ups, S2 the never-hold-the-print guard, S3 an earnings reaction-day
    fade (blocked on shorting), S4 an overnight-vs-buy-and-hold structural note, E1 a don't-trade-the-open
    execution rule. The only contact point is **execution hygiene** on the 06-30 closing auction.

### What the conditions support

Nothing directional, on any horizon. Five outputs: **a primary-source finding** (the fifth capping
clause, absent from every ledger here, and textual evidence for the proportionate reading); **a
measurement that closes an inherited assumption** (the Juneteenth displacement moves the rebalance to
the prior business day — 22.90% against a 23.00% target, versus 22.19% the other way); **a calendar
finding** (June is the only quarter with a four-session runway, the mirror of March's six-session drift
window); **a proposed calendar entry** (Russell reconstitution 2027-06-25, primary-sourced to the
owner's ground rules); and **a null that stops a plausible story** (the recon-containing June window
clears the re-breach move at 10.0% against 10.3% unconditional).

### Honest limits

Every weight is dated **2026-09-03** — one session stale against Friday 2026-09-04's close, and 299 days
away from the 2027-06-29 test; they size the *mechanism*, and nothing here forecasts which names bind in
June. The holdings files are State Street's ETF weights — capped index weights drifted by price plus a
cash residual — not the float-adjusted index weights the test actually applies to, so every cohort sum
in leg 6 is a floor and leg 2's capacity table is my application of a rule to a proxy, never S&P DJI's
published pro-formas. Leg 5's back-solve assumes no share-count or membership change between the June
2026 effective close and 2026-09-03, and rests on total-return closes carrying eleven weeks of
dividend-adjustment noise: **0.10pp against 0.81pp separates the two candidates comfortably, and the
same instrument could not separate 06-18 from 06-11's 22.80%** — it establishes a direction, not a
convention. It also assumes the cap binds at the *effective* close; the filing's "prices as of the
reference date" wording admits a reading under which it binds at the reference close instead, which
fits the 2026 numbers less well and is not resolved here. Leg 1's argument is from the filing's text
alone — it is registered, not claimed, and the sibling's September tape test remains the stronger
instrument. Leg 10's base rates are **unconditional overlapping windows**, not independent draws; the
June subset is n=10; and both are conditional on AMZN being capped at the 06-11 reference close at all,
which is not knowable now. The Russell entry is rule-derived with no published 2027 calendar reachable
(three failures recorded in `probe-ref`), and its "largest forced-trade day of the year" framing is
received wisdom this session did not measure. Every trading-adjacent statement carries this entry's
`estimate` label and its conditional trigger; shorting is blocked house-wide and no house playbook is
index-flow-keyed.

## Stance & kill switches

**Stance (date `estimate`, `EST:` rule-derived; mechanism `SEC:`-primary).** Treat 2027-06-30 as an
**unannounced, conditional, low-impact backstop** — the June analogue of three siblings, and the one
whose distinguishing features cut in opposite directions. No position is licensed by it on any horizon.
Three legs, measured rather than asserted. **(a) The compression is on the wrong side of the mechanic to
matter here.** Juneteenth 2027-06-18 leaves the drift window at the standard seven sessions and instead
cuts the *primary* rebalance's runway to four, the only quarter of the four where that happens — so the
06-17 effective close is the compressed one, and the 06-29 test inherits an ordinary window with a
**10.3%** ten-year single-name base rate, above March's 8.7% and equal to September's and December's.
**(b) The corridor is crowded, and that is favourable, not adverse.** Consumer confidence sits on the
test date and FOMC minutes on the effective close, with the minutes ledger's own **1.149×** June
quarter-end volume measure — for an event whose only real contact point is closing-auction execution, a
thicker auction helps. **(c) The scariest-looking adjacency measures to nothing.** Russell
reconstitution implements two sessions before the test, and the ten actual June drift windows that
contained it cleared the re-breach move in **1 of 10** (10.0%) against 10.3% unconditional. What is
**not** settled, and is carried forward as this event's central open question: **the fifth capping
clause argues for the proportionate reading on text, and the September 2026 file is the first quarter
where step 2 actually runs** — until it is read, this ledger cannot rank the two paths on evidence.
Carry forward one correction that outlives this event: **the capping methodology has five clauses, not
four**, and the fifth defines who receives the excess.

**Kill switches:**

- **The first XLE holdings file dated on or after 2026-09-22 shows a constituent crossing from below
  4.5% to above it** — the fifth clause's recipient cap is not operative as written, leg 1's textual
  argument for the proportionate reading loses its footing, and the fork reverts entirely to the
  sibling's tape test. Registered as `FT-sp-select-sector-secondary-reweight-2027-06-30-2`.
- **State Street's first post-rebalance XLY file after the 2027-06-17 effective close is dated
  2027-06-22 or later, or shows no share-count change until then** — leg 5's prior-business-day reading
  is wrong, June 2027's effective close is Monday 2027-06-21, and the drift window is six sessions, not
  seven. Registered as `FT-sp-select-sector-secondary-reweight-2027-06-30-1`.
- **A secondary reweighting actually triggers on 2026-09-29 or 2026-12-30** — the "backstop, not a base
  case" frame this whole family inherits is wrong at a 1-in-2 or better rate, and the June instance
  needs re-pricing from an observed trigger rather than from mechanism. (The March sibling's
  `FT-sp-select-sector-secondary-reweight-2027-03-31-1` scores this; not re-registered here.)
- **FTSE Russell publishes a 2027 reconstitution calendar naming a date other than 2027-06-25** — leg 9's
  proposal is mis-dated, its position inside the drift window changes, and the corridor needs recomputing.
  Re-check at every pulse; promote the proposal to `confirmed` if it names 06-25.
- **A US macro print or a tracked-name earnings date gets scheduled onto 2027-06-29 or 2027-06-30 beyond
  the two already there** — leg 8's crowded-corridor reading gets louder still and the execution note in
  the stance needs re-sizing. Re-run the adjacency scan every pulse.
- **An S&P DJI or SEC-filed methodology change moves the 24% / 4.8% / 50% thresholds, the
  second-to-last-business-day test, or the five-clause capping sequence** — re-check EDGAR CIK
  `0001064641` at every pulse.
- **A house index-flow instrument gets built** — leg 11's "no playbook is index-flow-keyed" stops being a
  grep result and this sheet is rebuilt on house data.

**Registered forward tests.** `FT-sp-select-sector-secondary-reweight-2027-06-30-1`, `-2` and `-3` — see
[`forward-tests/sp-select-sector-secondary-reweight-2027-06-30.md`](../forward-tests/sp-select-sector-secondary-reweight-2027-06-30.md).
Observations, never templates.

## Assessment ledger

| Date | Days out | New info / adjacency findings | Stance change | Next check due |
|---|---|---|---|---|
| 2026-09-06 | D-297 | Initial research banked; canonical `src/domain/market-events/<id>.json` written this session (the id existed only as `proposals/…from-fomc-minutes-2027-06-30.json`, read in full first). probe-ref baseline set (no symbols, **VIX 14.53** at the 2026-09-04 close, band `low:15+`, 3 adjacents, 4 blocked fetches). SEC 497 acc. `0001193125-26-031948` re-fetched direct (2,388,335b): the capping methodology has **FIVE clauses, not four** — the fifth, *"remaining excess weight … distributed proportionally across all remaining Component Stocks that individually represent less than 4.5% … maximum weight … cannot exceed 4.5%"*, appears **nowhere in `docs/` or `src/`** (grepped). It defines recipients as sub-4.5% names, which is the proportionate reading's shape and not the iterative one's — **textual evidence on the fork two siblings argued from tape**. Its capacity constraint is real but **dormant**: XLE needs 12.83pp placed against 39.85pp of recipient room (**+27.02pp slack**); XLC +39.92pp. **June-specific finding:** June is the **only quarter with a 4-session rebalance runway** (Sep 5 · Dec 5 · Mar 5 · **Jun 4**) because Juneteenth **2027-06-18** pulls the effective close to **06-17**; its drift window stays at the normal **7** (06-21→06-29) where March's Good Friday cut *that* to 6 — **two holidays, opposite halves of one mechanic**, only March's written down. **Inherited assumption closed:** two entries asserted the prior-business-day displacement without sourcing it; June 2026 was the identical collision (2026-06-19 closed, nyse.com's own 2026 column) and AMZN back-solves to **22.90%** on Thu 06-18 vs **22.19%** on Mon 06-22 against the filing's 23.00% target — **8× better fit**, agreeing with `opex-2027-06-17`'s independent single-name-volume evidence for the *expiration* displacement (a different mechanic sharing the date). **Scoping result:** the four-step remedy's "approaches the maximum allowable value limits" is undefined, but the *secondary* sentence states a bright line (>24%, cohort >50%) — March's open step-4 question is about the **remedy**, not about whether 06-29 fires. **Adjacency — peers:** none (`symbols: []`). **Macro:** the corridor **inverts March's** — consumer confidence **on** the 06-29 test, FOMC minutes **on** the 06-30 effective close, and that ledger's own measure of June quarter-end at **1.149×** trailing-60d median volume (vs the Dec dead week's 0.676×): a thicker auction, favourable for an execution-only exposure. **New dated adjacency FILED:** FTSE Russell Ground Rules v7.2 (Aug 2026, 746,491b, Appendix F) — June recon Implementation is the **"4th Friday of June"** = **2027-06-25**, effective at the open 06-28, the 5th of 7 drift sessions and 2 before the test; proposed as `proposals/russell-reconstitution-2027-06-25.from-<this-id>.json` (`estimate`; three source fetches failed, recorded in probe-ref). **Measured, not asserted:** the recon-containing window is **not** hotter — 1 of the 10 actual June drift windows 2017-2026 cleared AMZN's required **+4.35% rel** (**10.0%**) vs **10.3%** unconditional 7-session (n=2,507, 10y), reproducing the March sibling's 10.3%/8.7% exactly from an independent pull. **Vol:** baseline, no prior; VIX path 14.43/14.92/16.34/15.20/14.32/**14.53**; SPY 770.19, XLE 64.06, XLY 114.91, XLK 187.28, XLC 112.03. **Screen** reproduced independently to 2dp on all eleven issuer files (self-dated 2026-09-03, one session stale): XLE **57.53%**, XLC **51.13%**, **AMZN 24.36%**, XLK 38.10%. **Geopolitical:** nothing touching capping mechanics. **Event tape:** playbooks + sweep re-grepped incl. `reconstitution` → **zero hits**. Registered **FT-…-1** (the 2027 rebalance effective close is 06-17, not 06-21), **FT-…-2** (no XLE name crosses 4.5% upward on the first post-September-rebalance file — the fifth clause's recipient cap), **FT-…-3** (the 2027-06-29 secondary test does not trigger). | — (stance set: stand aside on all four horizons; the refusal now rests on a 7-session/10.3% ordinary drift window, a crowded-but-favourable corridor, and a Russell adjacency measured to 10.0% — with one open question, whether the fifth clause's reading survives September's file) | 2026-10-06 (low, ≥15d band: every 30d). Close-out by 2027-07-06 |

**Rules.** Rows append only — editing a past row is falsification. Keep a row terse (the lint notes any
row past ~1,200 chars): it is a note to the next session, not an essay, and a stance *change* earns its
sentence in the Stance section with the row as its receipt. The adjacency sweep (peer prints · macro
surprises · VIX regime · geopolitical · event tape; see EVENT-RESEARCH.md) runs in every row; a dated
adjacent event found gets proposed as a new
`src/domain/market-events/proposals/<id>.from-sp-select-sector-secondary-reweight-2027-06-30.json`
(`status: "estimate"`) in the same PR — your own file, never another event's canonical one (#1717).
Close-out fills `## Outcome` below from re-run instrument data (cache busted first), never from
memory — after which this doc goes quiet.
