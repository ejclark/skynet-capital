# After a 7% drop, which exit pays? The 11-05 AI drop and the 11-06 bounce, against each rule's base rate

**Kind:** study (price only) · **Date:** 2026-11-06 · **Symbols:** NVDA, SMH, CRWV · **Impact:** medium
**Last assessed:** 2026-11-06

**Question (#6950, the first encounter of #6948):** NVDA and CRWV fell about 9–10% on Thursday 11-05
and popped 7–9% in Friday's first 30 minutes, then faded. If you had bought Thursday's close, which
exit rule set at that close would have paid, and how often? Eric's read (2026-11-06): *"Today swung
back hard in the morning which should've been a good point to take quick profits if we locked in a
trade yesterday… 3-6 months from now, NVDA/CRWV will have opportunities to sell at significant
profit."*

This study is about **exits after an entry**. It does not reopen the entry question:
[`dip-entries-nvda-crwv.md`](dip-entries-nvda-crwv.md) already called that *"Record dips; don't trade
them,"* and nothing here changes it.

Reproduce: `node scripts/research/drop-exit-study.mjs --as-of=2026-11-06` (bust
`node_modules/.cache/earnings-cycle` and `node_modules/.cache/intraday-edges` first for fresh bars;
add `--all` for the full grid at 5% and 10%). Every number below is printed by it. Paper only;
educational; a base rate, not a recommendation to any member.

## The call

| Exit rule · symbol | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| **NVDA · +5% take-profit set at the drop's close, else sell the next close** | **Record it; size zero.** The one rule left standing | low | 65 drops since 1999: the take-profit filled 38% of the time (12% on any day), but the rule paid 52% vs 53% any day. +0.82 points a trade over same-month down days; 65 of the 69 episodes needed, so underpowered | Of the next three NVDA closes down ≥ 7% (scored **2026-12-31** on those that have happened), two miss the take-profit and close the next session below **−4.6%**, the rule's worst tenth |
| **NVDA · hold six months from the drop** | **Don't count the drop as the reason.** | low | Paid 66% vs 73% any day; median +19.6% vs +20.7%; worst tenth −46.9% vs −36.7%. The 65 entries are 13 independent six-month windows (288 needed). The scratch's +39.6% counted 167 overlapping drop days | A re-run on or after **2027-05-10** (the 11-05 entry's 126th session) shows the ≥ 7% six-month row paying 10 points or more above any day |
| **NVDA, CRWV · a −5% or −8% stop set at the drop's close** | **Don't.** A tight stop after a drop mostly pays for volatility | medium | NVDA: the −5% stop hit within 63 sessions on 85% of drops (the rule paid 15% vs 28% any day). −8%: hit 72%. CRWV: all 15, at both levels | The 11-05 NVDA entry and the next two NVDA ≥ 7% drops all stay above −8% for 63 sessions (first scored about **2027-02-08**; 2% likely if the base rate holds) |
| **CRWV · the +5% next-morning take-profit** | **Don't.** | low | 15 drops: the take-profit filled 13% (37% any day); the rule paid 5 of 15, median −1.5% vs +0.5% any day. 193 episodes needed, so this is a record, not a test | A re-run on or after **2027-05-06** with 20 or more drops shows the rule paying more often than any day |
| **SMH · the same take-profit on the chip basket** | **Don't.** | medium | At ≥ 5% (57 drops) the pre-registered verdict is **kill**: +0.17 points, t 0.41. At ≥ 7%, underpowered (22 of 29), paid 45% vs 52% any day | A re-run on or after **2027-11-06** turns the ≥ 5% verdict to pass |
| **The 11-05 encounter itself** | **It paid. This was the 38% case** | high (measured) | NVDA opened +5.2% on 11-06 and touched +7.3% in the first 30 minutes; CRWV opened +7.5% and touched +9.3%. Every take-profit, set at Thursday's close, filled | — measured; a Yahoo bar revision is the only thing that moves it, and a re-run reads it |

**TL;DR.** The next-morning pop after a big NVDA drop is a volatility fact: a +5% take-profit fills
about three times as often as on an ordinary day. But when it misses, the next close is weak, so the
rule pays about as often as on any day. Its small edge (+0.8 points a trade) is not proven yet. A
six-month hold after the drop does no better than a six-month hold from any day, and a tight stop
gets hit most of the time. The 11-05 trade paid; the base rate says that happens a bit over a third
of the time.

**Signals & conditions:**

- **Buy signal:** no. This study prices exits; the entry call stays "Record dips; don't trade them."
- A ticket after an NVDA close down ≥ 7% shows this first: +5% take-profit fills 38%, pays 52% (n 65).
- No stop tighter than 8% at the drop's close: NVDA's −8% stop still hit 72% within a quarter.
- Nothing moves to `src/playbooks/candidates.ts`: the take-profit enters only after it reads pass at 7%.

## The scene (for the narrator)

Every figure here is from the reproduce command unless marked **reported**. **Measured** means a
price this study read; **reported** means press or a sibling ledger said it and this study did not
verify it.

**Thursday 11-05: the drop.** *(measured)* NVDA closed **181.60, −9.26%** (from 200.13). CRWV closed
**43.66, −9.83%** (from 48.42). The chip ETF SMH fell **−11.2%**, the S&P 500 **−4.36%**, and VIX
jumped from **16.61 to 28.18**. NVDA's earnings print is not until about 11-18 and CRWV's about
11-10, so neither drop was a print reaction.

*(reported)* Press tied the day to the midterm results: voters rejected data-center construction in
40 of 41 local ballot measures, and Democrats won key races (CNBC, 2026-11-05, as cited in
[`crwv-2026-11-10-print.md`](events/crwv-2026-11-10-print.md)). AP called it the worst S&P day since
April 2025 (as cited in [`jobs-2026-11-06.md`](events/jobs-2026-11-06.md)). Press disagrees on
whether a company guide also set it off. CoreWeave filed nothing that day except a Form 144.

**Was it the election?** Still **reported**, not measured. The midterm ledger
([`midterm-elections-2026-11-03.md`](events/midterm-elections-2026-11-03.md)) set its own test:
the AI-power basket (CEG, NRG, TLN, VST, equal weight) must beat the S&P 500 at beta 1.03 by more
than **4.39 points** on a session whose named driver is political news. On 11-05, the session press
blamed on the election, the excess was **+0.71 points**: inside the line. On 11-06 it crossed
(**+7.56 points**), but no ledger names a political driver for 11-06, so that crossing is recorded,
not attributed.

**Friday 11-06: the bounce.** *(measured)* NVDA opened **191.10, +5.2%** over Thursday's close,
reached **194.90 (+7.3%)** in the first 30 minutes (also the day's high), and closed **186.64
(+2.8%)**. CRWV opened **46.92 (+7.5%)**, reached **47.70 (+9.3%)**, and closed **46.40 (+6.3%)**.
SMH opened +5.7%, reached +6.4%, closed +3.6%. VIX eased to **25.64**. *(reported)* October
payrolls printed +165k that morning against a ~+65k consensus (BLS figure and secondary consensus, as
cited in [`umich-sentiment-final-2026-11-20.md`](events/umich-sentiment-final-2026-11-20.md)); this
study does not establish what drove the bounce.

**The house call.** On entries: record dips, don't trade them
([`dip-entries-nvda-crwv.md`](dip-entries-nvda-crwv.md)). On exits, this study: if you did buy the
close, a +5% take-profit placed that night is the rule that captures a pop like Friday's. It fills
about 38% of the time on NVDA (n 65 drops since 1999), and the rule as a whole pays about as often
as on any day. A stop at −5% or −8% gets hit most of the time. A six-month hold after the drop has
done no better than a six-month hold from any day.

**The base rate, one line for a scene card:** *After NVDA closed down 7% or more (65 times since
1999, own earnings days left out), a +5% take-profit set at the close filled the next session 38%
of the time; on an ordinary day, 12%.*

## Findings

Entry is the close of a day down at least the threshold. A level touched on the same day as the
other one counts as the stop; a gap through a level fills at the open. *Paid* = return above zero;
*worst tenth* = the 10th percentile. The 11-05 drop is scored apart and never counted in its own
base rate.

### NVDA, close down ≥ 7% (main threshold)

167 drop days since 1999-01-22 → 77 episodes (drops within 10 sessions are one) → 11 on NVDA's own
print, listed by the script and left out → **65 traded** before 11-05. 29 had VIX ≥ 25 at entry.

| Exit rule | Levels hit (TP / stop / time) | Paid | Median | Worst tenth | Same-month down days: paid · median | Any day: paid · median · worst tenth · TP fills |
|---|---|---:|---:|---:|---|---|
| no TP / no stop / 1 day | — / — / 100% | 51% | +0.6% | −4.6% | 48% · −0.3% | 52% · +0.1% · −3.7% |
| **+5% / no stop / 1 day (R1)** | 38% / — / 62% | **52%** | +0.7% | −4.6% | 49% · −0.2% | 53% · +0.2% · −3.6% · **12%** |
| +3% / no stop / 5 days | 68% / — / 32% | 71% | +3.0% | −7.9% | 66% · +3.0% | 69% · +3.0% · −6.6% · 62% |
| **no TP / no stop / 63 days (R2)** | — / — / 100% | 58% | +7.4% | −31.9% | 58% · +8.4% | 67% · +9.9% · −26.1% |
| **no TP / no stop / 126 days (R3)** | — / — / 100% | 66% | +19.6% | −46.9% | 64% · +20.1% | 73% · +20.7% · −36.7% |
| no TP / −5% / 63 days | — / 85% / 15% | 15% | −5.0% | −5.0% | 14% · −5.0% | 28% · −5.0% · −5.0% |
| no TP / −8% / 63 days | — / 72% / 28% | 28% | −8.0% | −9.6% | 20% · −8.0% | 39% · −8.0% · −8.0% |
| +5% / −8% / 63 days | 60% / 40% / 0% | 60% | +5.0% | −8.0% | 54% · +5.0% | 67% · +5.0% · −8.0% · 67% |

The script prints all 48 rules (take-profit none / 3 / 5 / 7% × stop none / 5 / 8% × hold 1 / 5 / 63
/ 126 sessions). The rows above are the ones the calls rest on; the other 40 are descriptive only
and were never judged, so none of them is a finding.

### The three declared rules, judged

The rules and the edge each must show were fixed in the script before the conditional numbers were
read. The verdict is against the same-month down days, with power judged first from the cluster
count, so a thin sample reads *underpowered*, never *kill*
([`backtest-verdict-math.mjs`](../../scripts/research/backtest-verdict-math.mjs)). Holds that overlap
in time are one cluster.

| Symbol · threshold | R1 +5% next morning | R2 hold 63 sessions | R3 hold 126 sessions |
|---|---|---|---|
| NVDA · ≥ 7% | underpowered: 65 of 69, +0.82 pts | underpowered: 26 of 259, +4.34 pts | underpowered: 13 of 288, +12.22 pts |
| NVDA · ≥ 5% | **pass: 119 clusters, +0.68 pts, t 2.01** | underpowered: 32 of 259 | underpowered: 11 of 288 |
| NVDA · ≥ 10% | underpowered: 21 of 69, +3.17 pts (TP filled 71%) | underpowered: 12 of 259 | underpowered: 8 of 288 |
| SMH · ≥ 7% | underpowered: 22 of 29, +0.60 pts | underpowered: 8 of 56 | underpowered: 5 of 50 |
| SMH · ≥ 5% | **kill: 57 clusters, +0.17 pts, t 0.41** | underpowered: 21 of 56 | underpowered: 12 of 50 |
| CRWV · ≥ 7% | underpowered: 14 of 193, −1.97 pts | underpowered: 1 of 915 | underpowered: 1 of 471 |

**Read the one pass with care.** It is at the side threshold (5%), not the main one, and it is one of
27 verdicts in this table. One t of 2.01 among 27 is about what chance alone would produce. It is why
R1 is *recorded*, not *killed*; it is not a reason to trade it.

**Against the scratch base rate in the issue.** The issue's ad-hoc run counted every drop day (n 167)
and found the next-day high reaching +5% 44% of the time and a six-month median of +39.6%. Counting
each sell-off once, leaving out NVDA's own print days, and filling a gap at the open gives 38% and
+19.6%. The six-month figure halves because 2000–02, 2008–09 and 2020 each contributed many
overlapping drop days to one recovery.

### CRWV and SMH

- **CRWV** (2025-03-28 onward): 45 drop days → 16 episodes → 1 on its own print (2026-05-08) → 15
  traded. Next-morning take-profit filled 13% vs 37% any day; paid 33% vs 53%. A 5-session hold
  with no levels paid 67% (median +4.7%), the one CRWV row that leans the other way, on 15 drops.
  Both stops were hit on every one of the 15 within 63 sessions. CRWV's whole history is one
  long-hold cluster, so R2 and R3 cannot be judged at all.
- **SMH** (2000-06-05 onward): 31 drop days → 23 episodes → 22 traded. Take-profit filled 27% vs 3%
  any day, but paid 45% vs 52%. A 63-session hold paid 41% vs 64% any day. The 11-05 drop (−11.2%)
  is SMH's third ≥ 10% day, and the first two are a single 2020 episode.

### Every drop since 2020 (NVDA)

Fourteen of the 65 NVDA entries are from 2020 onward, and their next-morning excess has the same
sign as the whole sample. The latest era agrees; it is just too small to decide anything alone.

## Method

- **Data:** `bars()` in [`market-data.mjs`](../../scripts/research/market-data.mjs), Yahoo daily,
  split- and dividend-adjusted, now carrying the day's high and low (added for this study). VIX is
  `^VIX` from the same source. Bars cut at `--as-of=2026-11-06`, read after Friday's close.
- **First-30-minute high:** Yahoo 5-minute bars for 11-06, 9:30–10:00 ET
  ([`intraday-bars.mjs`](../../scripts/research/intraday-bars.mjs)).
- **Prints:** SEC EDGAR 8-K Item 2.02 filing dates via `earningsDates()`. A filing on the drop day
  or the session before makes it a print reaction. NVDA's record starts 2004-10-27, so drops before
  that cannot be filtered and are counted. SMH is an ETF and has no print.
- **The five research steps** ([`EVENT-RESEARCH.md`](../process/EVENT-RESEARCH.md) → *Candidate
  playbooks*):
  1. Fixed threshold: 7%, set before looking; 5% and 10% reported beside it, never picked between.
  2. Power: R1–R3 declared with an edge each (1 / 5 / 8 points); the clusters needed come from that
     edge and the rule's any-day spread, never from the drop-day outcomes.
  3. Controls: every session (any day) and every down day in the same calendar month that is not
     itself a qualifying drop. Averaging all of them is the expected value of the issue's "random
     down day matched by month", without a random seed to argue about.
  4. Confound filter: own-print drops left out and listed in the script's output.
  5. Date clustering: drops within 10 sessions are one episode; overlapping holds are one cluster;
     the 2020+ era must agree in sign.
- **Not modeled:** options (this is the share price only), slippage, and after-hours fills. A
  take-profit is assumed to rest as a limit order from the next open.

## Prior work checked

- [`dip-entries-nvda-crwv.md`](dip-entries-nvda-crwv.md): the entry call. This study keeps it and
  answers the exit question that call left open.
- [`multi-symbol-sweep.md`](multi-symbol-sweep.md) kill list: no row covers an exit rule after a
  drop. The nearest, AMD's "a de-risked chip tape rebounds into the print" (killed 2026-11-04), is a
  print-window bet, not this test.
- [`convictions/ai-dip-2026-10.md`](convictions/ai-dip-2026-10.md): Eric's 6-to-18-month view. The
  six-month column tests its **horizon** (does a drop make the hold better?), not its **thesis**
  (AI demand). The answer on horizon is: not measurably.
- NVDA's next print is about 11-18 and CRWV's about 11-10, both inside any hold longer than a week
  from 11-05. The six-month rows here include past prints the same way.
