# After a broad sell-off: the put pays double for the same risk, the shares and the long call show no edge

**Kind:** study (price only, options modeled) · **Date:** 2026-11-08 · **Symbols:** SPY, QQQ · **Impact:** medium
**Last assessed:** 2026-11-08

**Question (#7028 slice 2, from Eric's note of 2026-11-07):** when a broad index closes 10% or more
under its year high and VIX is at 25 or more, what did three moves return: buy the shares, sell a
cash-secured put, buy a long-dated call? Those numbers are the "base rate" a quest carries. The
thresholds (10%, 25), the control, the cluster rule, the declared power and the three moves were
written into `drawdown-quest-math.mjs` and committed before the first run; nothing was tuned after.

> **The condition.** The index's close is 10% or more under the highest close of its last 252
> sessions (the read in `src/domain/daily-high.ts`), **and** VIX closes at 25 or more.
>
> **The moves.** Shares held 63 sessions (a second row holds 252). A 0.15-delta put 30 sessions
> out, held to expiry (the house wheel's setting). A 24-month 0.80-delta call, half sold at double
> and the rest out with 6 months left (the contract `long-leap-dip-2026-10.md` settled on).
>
> **The control.** Every 21st session where the condition did not hold.

Reproduce: `node scripts/research/drawdown-quest-study.mjs` (add `--json=<path>` for the table
slice 3 reads). Every number below is printed by it. Paper only; educational; not investment advice.

## The call

| Move · question | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| Sell a cash-secured put on SPY · offer it in the condition? | **Offer it, with its worst case in the copy** | low | The premium doubled (1.02% vs 0.53% of cash secured per 30 sessions) while assignment held at 7% in both. Mean +0.55% vs +0.21%, gap +0.35% (90% +0.06%..+0.68%). Worst single sale −13.9%, worst decile +0.75%. QQQ: gap +0.20% (−0.68%..+1.16%), and the 2000 dot-com sale lost 27% | **2027-05-31**: a real SPY 30-day 0.15-delta put bid read on a condition day is under 0.6% of strike |
| Buy SPY shares · what does a quest say? | **Show the base rate; claim no edge** | medium | 63 sessions: +5% vs control +3%, won 66%, worst decile −7% (gap +2%, −1%..+5%). 252 sessions: +12% vs +12%, worst decile −20%. The 18 episodes are fewer than the 32 the declared power needs, so the verdict is `underpowered` | **2027-03-31**: a pooled run over 5 or more broad indexes reaches 32 episodes and its gap interval sits wholly above zero |
| Buy a 24-month call · offer it in the condition? | **Don't make it a default move** | low | Below the control on both indexes: SPY +43% vs +69% (gap −26%, −64%..+13%), QQQ +61% vs +75%. Worst decile −74% (SPY) and −98% (QQQ). Stays positive at 0.8× and 1.25× the vol read (+53%..+33%), but its sign flips by era (−20 points over all 18 episodes, +27 over the 5 since 2018) | **2027-06-30**: a real 24-month 0.80-delta ask read at the next condition entry sits more than 25% under the model's price |
| The condition itself · does the drawdown carry it? | **No. VIX does the work; the drawdown alone lost** | low | Drawdown without VIX 25: shares −1% over 63 sessions, 0% over 252 (48 entries). VIX 25 without the drawdown: +5% and +13%. Both together: +5% and +12%. An after-the-fact split, so a lead for slice 3, not a finding | **2027-03-31**: the pooled run shows drawdown-only entries beating the control by more than its interval |

**TL;DR.** After a broad sell-off the market paid a short put twice the usual premium and did not
assign it any more often. The shares did a little better than ordinary days and the long call did
worse; neither gap is separable from zero with 18 to 20 episodes, and the long call's worst tenth lost
three-quarters of its premium or more. No move earns the word "good". Each carries its numbers.

**What happens next (slice 3, conditions quests):**

- **Fill the quest record's base-rate field from this table.** For SPY: sample size 73 entries over
  18 episodes, plus the mean, win share and worst decile above. Every row's verdict reads
  `underpowered`, so no quest says "take it"; each says its edge is untested (criterion 5).
- **Offer the put and the shares, not the long call,** as the conditions table's moves. The put's
  copy names its worst case: an assigned put marks to the strike, and the worst sale lost 14% of the
  cash it secured (27% on QQQ).
- **Key the quest on the condition as the plan wrote it, and let the copy say VIX carries it.** A
  drawdown with calm VIX has no quest.
- **Today (2026-11-06 close) the condition holds for QQQ, not SPY:** QQQ sits 13.6% under its high
  with VIX at 25.64 (an entry since 2026-11-05, not yet matured). SPY sits 5.6% under. So the first
  conditions quest to draw would be QQQ's, and slice 3 chooses the index its table keys on.

## Findings

**SPY, 1993-01 to 2026-11, 8,502 sessions.** The condition held on 981 sessions (12%). One entry
every 21 sessions gives 73 entries in 18 episodes. An episode is a run of entries less than 63
sessions apart, because entries inside one sell-off share one market factor.

| Move | Group | Entries | Mean | Won | Worst decile | Worst single |
|---|---|---:|---:|---:|---:|---:|
| Shares, 63 sessions | **Condition** | 73 | +5% | 66% | −7% | −26% |
| | Control | 363 | +3% | 70% | −6% | −31% |
| | Drawdown only | 48 | −1% | 42% | −12% | −30% |
| | VIX only | 70 | +5% | 79% | −3% | −10% |
| Shares, 252 sessions | **Condition** | 73 | +12% | 71% | −20% | −42% |
| | Control | 354 | +12% | 81% | −13% | −40% |
| Put, 30 sessions, per dollar secured | **Condition** | 73 | +0.55% | 93% | +0.75% | −13.86% |
| | Control | 364 | +0.21% | 95% | +0.30% | −26.31% |
| | Drawdown only | 48 | −0.04% | 88% | −1.49% | −14.40% |
| | VIX only | 70 | +0.52% | 93% | +0.75% | −9.22% |
| Call, half sold at double | **Condition** | 73 | +43% | 70% | −74% | −91% |
| | Control | 348 | +69% | 80% | −60% | −98% |
| | Drawdown only | 48 | +14% | 50% | −85% | −94% |
| | VIX only | 66 | +46% | 70% | −67% | −98% |

Gaps to the control, 90% intervals resampling whole calendar years (18 of them): shares 63 sessions
+2% (−1%..+5%); shares 252 sessions +0% (−8%..+10%); put +0.35% (+0.06%..+0.68%); call −26%
(−64%..+13%). Put assigned 7% in the condition and 7% in the control; its mean premium was 1.02%
and 0.53% of cash secured.

**Why the verdicts read `underpowered`.** The declared bar was a 5-point effect against a 10-point
spread between episodes at z 1.96 and 0.84, which needs 32 episodes. SPY has 18, QQQ 19 to 20, at
about one new episode every two years. The put's interval does exclude zero across years, but years
are not episodes and the declared test is on episodes, so the call stays at low confidence.

**The episodes decide the tail.** The 2000–02 entries (episodes 4 to 7) returned −1% to +10% on
shares over 63 sessions and −79% to +70% on the call; the 2008 entries +2% to +3% on shares. The
shallow, fast ones (1998, 2010, 2011, 2015, 2018, 2020, 2025) returned +6% to +16%. Nothing in the
condition tells a member which kind they are in.

**The verdict's own unit is the episode, and the long call's sign flips by era.** Each episode's mean
minus the control's mean, averaged across episodes (SPY): shares over 63 sessions +5.3 points, put
+0.6 points, call −19.7 points. Since 2018 (5 episodes, the pre-registered latest era) they read +6.9,
+0.75 and **+27.2**. Shares and the put keep their sign; the call does not. That is the same lesson
`long-leap-dip-2026-10.md` drew ("the era decides it"), now with a number: the 2000–02 entries took
the call down, and the five since 2018 lifted it.

**The long call leans on its vol read but not past zero.** SPY, condition entries, half sold at
double: blend +43%, blend ×0.8 +53%, blend ×1.25 +33%, flat VIX +37%. Selling everything at double
+38%; holding all to 6 months left +47%. Double was reached on 34% of entries (SPY) and 61% (QQQ).

**QQQ, 1999-03 to 2026-11, 6,960 sessions.** 76 entries in 20 episodes.

| Move | Condition | Control | Gap (90%) |
|---|---:|---:|---|
| Shares, 63 sessions | +5%, won 63%, worst decile −13% | +2% | +3% (−1%..+9%) |
| Shares, 252 sessions | +14%, won 69%, worst decile −37% | +11% | +3% (−12%..+18%) |
| Put, 30 sessions | −0.16%, won 89%, worst single −27.02% | −0.36% | +0.20% (−0.68%..+1.16%) |
| Call, half sold at double | +61%, won 73%, worst decile −98% | +75% | −14% (−59%..+30%) |

QQQ's put assigned 12% in the condition and 13% in the control, with the same 1.0% premium as SPY's.
Its worst episode (2000-10, 35% under the high) lost 6.7% of the cash secured on average, which is why the mean sits near zero.

## What this cannot say

- **No real option prices.** Premium is Black-Scholes at VIX (the put and the 30-day legs) or at a
  blend of VIX and its own year average (the 24-month call), zero rate and dividend, 2% slippage each
  way. VIX is flat across strikes, which understates an out-of-the-money put's premium; the put's
  falsifier above is the check. The call's rows at 0.8× and 1.25× show how far it leans.
- **Closes only.** An intraday break below a put's strike that closes back above it is not seen.
  A sold put is marked at expiry, so a member who is assigned and then holds the shares sees a
  different path than the table's.
- **18 to 20 episodes, one dominated by a few years.** Fewer than 32, and several are the same
  macro story (2000–02 is four of them). A pooled run over more indexes is the way to power, not
  a longer wait on SPY.
- **Entries every 21 sessions** in the condition, not every day. An entry too recent to have run a
  move's hold is left out of that move's rows (QQQ's 2026-11 entry has none; its 2026-03 entry has
  no call yet).
- **The drawdown-versus-VIX split is a diagnostic, run after the pre-registered table.** It points,
  it does not decide.
