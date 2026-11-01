# The wheel's floor-band strike cap: no edge, and on CRWV it almost never binds

**Kind:** study (price only, options modeled) · **Date:** 2026-11-01 · **Symbols:** CRWV, NVDA, MU, AVGO, AMD · **Impact:** medium
**Last assessed:** 2026-11-01

**Question (#6598 Study A, from #5482):** Eric's AI-dip view fences CRWV-WHEEL: sell puts only at
or under claim 7's floor band median (about $53.67, set 2026-10-16). When a claim behind that fence
passes (claim 1 can on 2026-11-20), `research:refine` proposes keeping the fence on the pair for
good. Should it? The fence was one price for one episode, so this restates it as a rule any sale
day can use, and replays that rule:

> On a sale day, cap the put's strike at close × (1 + the median further low of the cycle
> detector's headline band for that day's weather), the band built only from outcomes already
> finished that day.

Reproduce: `node scripts/research/wheel-cap-study.mjs`. Every number below is printed by it. Paper
only; educational; not investment advice.

## The call

| Name · question | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
| CRWV-WHEEL · make the floor-band cap the pair's own setting after a pass? | **Don't** | medium | 3,493 modeled sales since 2005: the cap changed P/L by −0.03% per sale (90% −0.14%..+0.11%, 87 quarters) and left nothing to sell on 30% of them | **2027-01-29**: a re-run of the command shows the basket's all-sales row with its whole 90% interval above zero |
| Any wheel · adopt it only in a sector-wide pullback, the phase it was written in? | **Don't** | medium | 1,028 sales in that phase: +0.05% (−0.14%..+0.25%, 64 quarters). On NVDA alone it cost 0.21% per sale (−0.36%..−0.03%) | **2027-01-29**: a re-run shows the sector-wide row's whole 90% interval above zero |
| CRWV · does the fence change what the wheel sells? | **Barely. It bound 1 of 52 modeled CRWV sales** | low | At CRWV's ~90% vol a 0.15-delta put already strikes ~79% of spot, under the floor. The live $53.67 fence binds only above a $67.82 close | **2027-01-29**: a re-run shows the cap binding on more than 1 in 4 CRWV sales |
| Any wheel · puts priced under realized vol | **That is a stand-aside, not a cap** | low | At 0.8× the vol proxy the cap added +0.31% per sale (+0.06%..+0.58%), but both arms lost money (−0.48%, −0.17%). `crwv-premium-fit.md` already stands aside when puts are cheap | **2027-01-29**: a re-run at 0.8× shows the capped arm's sector-wide P/L above zero |

**TL;DR.** The cap trades premium for fewer assignments, and over 20 years the two cancel. It
helped only when puts were underpriced, and then the better move is not selling at all. On CRWV the
0.15-delta target already sits below the floor, so the fence does almost nothing.

**What happens next:**

- A passed claim 1, 2a or 7 does **not** carry the fence into CRWV-WHEEL. `research:refine` keeps
  refusing those pass keys; #6598 slice 3 makes the refusal cite this study.
- The fence stays as the view's own narrowing, unchanged: this study judges the pair's setting, not
  Eric's view.
- Note for the view's owner: the rule reads $44.36 today (10-30), $9 under the live fence. Neither
  binds a 0.15-delta put at today's vol, and the wheel is dark until after the 11-10 print anyway.

## Findings

Per sale day, each arm held to expiry, scored per dollar of cash secured. A cycle the cap leaves
nothing to sell scores zero. Premium and assignment are per sale day.

| Phase on the sale day | Sales | Quarters | Cap binds | Leaves no strike | Playbook P/L | Capped P/L | Capped − playbook (90%) |
|---|---:|---:|---:|---:|---:|---:|---:|
| All | 3,493 | 87 | 43% | 30% | +0.50% | +0.47% | −0.03% (−0.14..+0.11) |
| Pullback, sector-wide | 1,028 | 64 | 33% | 23% | +0.43% | +0.48% | +0.05% (−0.14..+0.25) |
| Pullback, single-name | 497 | 77 | 31% | 17% | +0.60% | +0.59% | −0.00% (−0.14..+0.18) |
| Not a pullback | 1,968 | 84 | 51% | 37% | +0.50% | +0.43% | −0.07% (−0.22..+0.11) |

**What the cap does to each sale,** sector-wide pullbacks: premium 1.87% → 1.52%, assigned 16% →
11%, and an assignment that does happen loses a little more (−7.3% → −7.7%), because only the
deeper drops reach the lower strike.

**By name.** NVDA (882 sales): −0.08% overall (−0.16..+0.01); −0.21% in sector-wide pullbacks
(−0.36..−0.03); +0.39% in single-name pullbacks (−0.06..+0.89, 52 sales, 21 quarters), the one row
that leans positive, too thin to act on. CRWV (52 sales, 6 quarters): the cap bound once; the
difference is −0.01%.

**Sensitivity,** sector-wide pullbacks:

| Variant | Cap binds | Capped − playbook (90%) |
|---|---:|---:|
| Vol proxy 0.8× (puts cheap) | 42% | +0.31% (+0.06..+0.58) |
| Vol proxy 1.0× (base) | 33% | +0.05% (−0.14..+0.25) |
| Vol proxy 1.25× (puts rich) | 24% | −0.01% (−0.16..+0.16) |
| Cap at the band's p25 (deeper) | 62% | −0.26% (−0.56..+0.08) |
| Cap at the band's p75 (shallower) | 1% | +0.00% (−0.00..+0.01) |

A deeper cap idles the wheel on 56% of sale days and does worse; a shallower one never binds.

## Method

- **Sales.** Every 5th session on NVDA, MU, AVGO and AMD since 2005 and CRWV since listing; 700
  sale days were dark because no Friday 14 to 45 days out cleared the next print (the wheel's own
  rule, `wheel.ts`). NBIS is in the bands and the sector flag but sells nothing: it files 6-Ks, so
  its prints are unknown.
- **Playbook arm.** The strike at 0.15 put |delta| (CRWV-WHEEL's `putDelta`). **Capped arm.** That
  strike, or the cap when the cap is lower, but only while the cap's |delta| stays at 0.10 or more
  (the picker's ±0.05 window). Below that the picker finds nothing and the cycle is idle.
- **The floor.** `cycle-phase.mjs`'s ladder (own exact → own dd+sector → own dd only → pooled), 8
  independent units required, rebuilt on each sale day from entries whose 63-session window had
  closed. 14% of sales (25% in sector-wide pullbacks) had no band with 8 units yet and sold the
  playbook's strike. Today's rebuild matches the detector's own headline (pooled · exact, 9
  clusters, −19.2%).
- **Intervals** resample whole calendar quarters across every name (2,000 draws, fixed seed), since
  weekly sales overlap and one sell-off moves the basket.

## What this cannot say

- **No real put prices.** Premium is Black–Scholes on 60-session realized vol. The cap's value
  turned on that proxy more than on anything else (the 0.8× row), and real implied vol after a
  crash may sit well above or below it.
- **Marked at expiry.** Assigned shares are valued at the expiry close. The wheel then sells calls
  on them; what the shares did next is not counted for either arm.
- **Continuous strikes, no spread.** Real chains list strikes in steps and CRWV's quotes are wide,
  which shrinks the cap's room further.
- **Survivorship.** Every name is one that exists today. CRWV is one listing year, about $50B of
  debt, and 52 sales: colour, not a sample.
