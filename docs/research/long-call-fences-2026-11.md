# The long call's two fences: the expiry floor costs, the post-print wait is unproven

**Kind:** study (price only, options modeled) · **Date:** 2026-11-02 · **Symbols:** CRWV, NVDA, MU, AVGO, AMD · **Impact:** medium
**Last assessed:** 2026-11-02

**Question (#6598 Study B, from #5482):** Eric's AI-dip view puts two fences on CRWV-LONG-CALL:
no buys or adds from CRWV's blackout until 6 sessions after the print, and no expiry before
2027-03-18. When a claim behind them passes (2b and 9 can on 2026-11-25), `research:refine`
proposes keeping both on the pair for good. Should it? Each fence is restated as a rule any buy day
can use, then replayed:

> **Quiet.** No buy from the print's session until 6 sessions after it, so the first buy is the 7th
> session after (the playbook's own first is the 2nd).
>
> **Expiry floor.** Buy only an expiry whose 45-day exit lands on or after the day the cycle
> detector's recovery band (sessions back to the entry price) reaches its 75th percentile, the band
> built only from outcomes already finished that day.

Read on 2026-10-16, that rule gives 2027-03-21, three days from the live fence's 2027-03-18.

Reproduce: `node scripts/research/long-call-fence-study.mjs --print-window=2026-11-09..2026-11-16`.
Every number below is printed by it. Paper only; educational; not investment advice.

## The call

| Name · question | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| CRWV-LONG-CALL · make the expiry floor the pair's own setting after a pass? | **Don't** | medium | 3,990 modeled buys since 2005: the floor left nothing to buy on 52% of them and cost 19.3% per buy (90% −25.9%..−13.1%, 86 quarters). The calls it skipped did *better* than the ones it kept (+37.0% vs +28.4%) | **2027-01-29**: a re-run of the command shows the basket's all-entries floor row with its whole 90% interval above zero |
| Any long call · adopt the floor only in a sector-wide pullback, the phase it was written in? | **Don't** | medium | 1,148 buys in that phase: −12.1% (−21.4%..−3.5%). Skipped +26.6%, kept +8.0% | **2027-01-29**: a re-run shows the sector-wide row's whole 90% interval above zero |
| CRWV-LONG-CALL · make the 6-session post-print wait the pair's own setting? | **Don't, yet** | low | 292 prints: buying on the 7th session after beat the 2nd by +3.1% (−1.2%..+7.4%), and won on 50% of prints. Priced as claim 9 says (print moves larger than priced, 0.8×): +2.7% (−1.9%..+7.4%) | **2027-01-29**: a re-run shows the basket's D+7 − D+2 row with its whole 90% interval above zero |
| Any long call · the wait only in a pullback? | **Don't, yet** | low | Sector-wide pullback on D+2: +5.9% (−1.5%..+12.7%, 95 prints); not a pullback +0.5% (−5.2%..+6.1%) | **2027-01-29**: a re-run shows the sector-wide row's interval above zero |
| Any long call · buy after the print instead of just before it? (#5482 open question 2) | **Leans yes at modeled prices. Not a rule** | low | D+7 beat D−1 by +7.6% (+1.0%..+14.2%). With no crush in the model it is +4.8% (−2.1%..+11.9%), so about a third of the gap is the modeled crush | **2027-01-29**: a re-run shows the D+7 − D−1 row's 90% interval reaching below zero |
| CRWV · do the fences change what it buys now? | **Not the floor. The wait moves the first buy a week** | low | The playbook buys 2027-04-16 (168 days); the rule reads 2027-02-04 and the live fence 2027-03-18, so neither binds. After the 11-09..11-16 window the first buy moves from about 11-18 to about 11-25 | **2026-11-25**: a CRWV-LONG-CALL buy is recorded from 11-18 to 11-24 while the view steers it |

**TL;DR.** The floor can't buy a longer call, because the playbook already takes the latest expiry
in its window. All it can do is sit out, and the days it sits out were the better days to buy. The
post-print wait leans the right way, but its edge is inside the noise. On CRWV's 4 finished prints
it looks strong, and 4 prints are colour, not a sample.

**What happens next:**

- A passed claim 2b, 8 or 9 does **not** carry either fence into CRWV-LONG-CALL. `research:refine`
  keeps refusing those pass keys; #6598 slice 3 makes the refusal cite this study.
- Both fences stay the view's own narrowings, unchanged. This study judges the pair's setting, not
  Eric's view: CRWV's own short history leans toward both fences.

## Findings

**Question 1, the wait.** Around every print, the playbook's call bought at each offset (sessions
from the print's filing session) and held under its exits. Paired per print, so every arm sees one
print's tape.

| Bought at | Mean return | Won | Lost over half | Sold at double |
|---|---:|---:|---:|---:|
| D−10 | +30.1% | 59% | 35% | 50% |
| D−5 | +30.5% | 57% | 32% | 49% |
| D−1 | +30.2% | 56% | 34% | 52% |
| D+2 (the playbook's first) | +34.7% | 60% | 30% | 52% |
| D+7 (the fence's first) | +37.8% | 61% | 30% | 53% |
| D+12 | +33.0% | 59% | 32% | 51% |

D+7 is the best row, but D+12 falls back under D+2, so there is no steady gain from waiting longer.
That pattern looks like noise around a small post-print edge. An ordinary buy (every 5th session,
the Question 2 sample) returned +32.9%.

| Difference, paired per print (90%, 86 quarters) | Base | Prints at 0.8× | Prints at 1.25× | No crush |
|---|---:|---:|---:|---:|
| D+7 − D+2, what the wait changes | +3.1% (−1.2..+7.4) | +2.7% (−1.9..+7.4) | +4.6% (+0.4..+8.9) | +1.8% (−2.9..+6.4) |
| D+7 − D−1, after the crush vs just before | +7.6% (+1.0..+14.2) | +8.0% (+1.2..+14.9) | +9.8% (+3.3..+16.3) | +4.8% (−2.1..+11.9) |

**By name.** NVDA (85 prints): D+7 − D+2 +7.5% (−2.0..+16.5). CRWV (4 prints): the pre-print buys lost
91–93% on average, D+2 −33.9%, D+7 +17.3%. The wait added +51.2% per print, with 75% of prints better.
That is the shape the view saw, on four prints in one falling year.

**Question 2, the floor.** Every 5th session the playbook may buy. An entry the floor blocks scores
zero (nothing bought), never drops out.

| Phase on the buy day | Buys | Floor leaves nothing | Playbook | Skipped calls | Kept calls | Floor − playbook (90%) |
|---|---:|---:|---:|---:|---:|---:|
| All | 3,990 | 52% | +32.9% | +37.0% | +28.4% | −19.3% (−25.9..−13.1) |
| Pullback, sector-wide | 1,148 | 45% | +16.4% | +26.6% | +8.0% | −12.1% (−21.4..−3.5) |
| Pullback, single-name | 565 | 65% | +19.7% | +27.5% | +5.1% | −17.9% (−28.1..−7.3) |
| Not a pullback | 2,277 | 52% | +44.4% | +44.4% | +44.4% | −23.3% (−30.9..−15.9) |

Most of the blocking (47 of the 52 points) is a band where over a quarter of past episodes never got
back to entry within 126 sessions. The rule then asks for an expiry no listed call has. The
variants agree:

| Variant | Floor leaves nothing | Floor − playbook (90%) |
|---|---:|---:|
| Thin chain (March cycle + January only) | 58% | −19.7% (−26.2..−13.8) |
| Floor at the band's median (shallower) | 6% | −1.8% (−3.4..−0.4) |
| Floor at the band's p90 (deeper) | 73% | −25.4% (−34.1..−17.2) |

**By name.** NVDA (1,040 buys): −25.6% (−35.0..−17.1). CRWV (46 buys, 5 quarters): +24.4% (−3.7..
+57.6). The floor skipped buys that lost 56% on average, but most of CRWV's sample is its 2025 slide
from the high.

## Method

- **The call.** Each name is bought by CRWV-LONG-CALL's own settings (`long-call.ts`): the latest
  third-Friday expiry 120 to 200 days out, the strike at 0.60 delta (standard mode), sold the first
  close it is worth double, or with 45 days left (time wins a tie). Entries only; adds follow the
  same fences and are not replayed. No buy on a print's session or the one after.
- **Premium, and the crush.** Black–Scholes at zero rate, 2% paid over the model in and given up
  out (`leap-dip-study.mjs`'s cost). Implied variance is a print-free base (60 sessions of realized
  vol with every print reaction left out) plus, for each print still ahead inside the call's life,
  the name's own past reaction. That reaction is the RMS of its last 8 two-session print moves, net
  of two ordinary sessions; the basket's is used when a name has fewer than 2. The term drops out
  the session after the print, so a call bought before a print pays for a move the one bought after
  does not. A plain realized-vol proxy would run this backwards: the print-day move lifts trailing
  realized vol just as real implied vol falls.
- **The floor.** `cycle-phase.mjs`'s headline ladder (own exact → own dd+sector → own dd only →
  pooled, 8 independent units), read on each buy day from entries whose 126-session recovery window
  had closed. A censored recovery stays in as "never", so a band where over a quarter never came
  back reads "never". 15% of buys had no band yet and bought the playbook's call.
- **Samples.** Question 1: 292 prints on NVDA, MU, AVGO, AMD and CRWV since 2005 where all six
  offsets finished on the tape. Question 2: every 5th session the playbook could buy. NBIS is in
  the bands and sector flag but buys nothing: it files 6-Ks, so its prints are unknown.
- **Intervals** resample whole calendar quarters (2,000 draws, fixed seed), since one sell-off moves
  the basket. Splitting Question 1 by phase uses D+2's phase, which both of its buys could see; a
  pre-print arm could not, so those rows carry only the wait's difference.

## What this cannot say

- **No real call prices.** The crush is modeled from past print moves, not read from quotes. The
  wait's result moves with that model (+1.8% with no crush, +4.6% with prints priced 1.25×).
- **The floor's restatement is one reading.** The live fence is one date from one band read. A
  floor that capped itself at 200 days would buy the same call, the same as no floor, so either way
  the floor adds nothing the playbook keeps.
- **Monthly expiries assumed listed.** CRWV's real chain may skip months; the thin-chain row is the
  bound.
- **Survivorship.** Every name exists today. CRWV is one listing year and 4 finished prints: colour,
  not a sample.
