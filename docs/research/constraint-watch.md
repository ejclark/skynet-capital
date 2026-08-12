# Constraint watch — the repeatable method

**Date:** 2026-08-12 · **Provenance:** distilled from four completed AI-constraint trades
(HBM/Micron, networking-optics/CRDO-COHR, storage/STX-WDC-SNDK, power-IPPs/VST-CEG) and
stress-tested by eight adversarial red teams during the [AI-energy study](ai-energy-constraint.md).

**What this is.** Eric's research thesis, made into a process: AI buildout keeps hitting
successive binding constraints (chips → HBM → networking → storage → energy → *next*), capital
floods each one, and the sector's stocks multiply. The edge is not knowing the theme — it is
dating **where a layer sits on the clock** and refusing the phases that no longer pay. This doc
is written to be run on the *next* constraint, whatever it is.

**Standing caveat, first and always:** the template was fit *ex post* on winners, and the
false-positive filter was calibrated on failures after they had already round-tripped. It is a
taxonomy with an unquantified error rate, not a validated predictor. Every activation still
needs its own dated falsifier.

## The constraint clock — five phases

**Phase 0 — physical signal** *(6–12 months before equities move)*
Lead times stretch; spot-vs-contract premiums appear; "allocation" language shows up in trade
press. A lead time that doubles is the earliest signal (TrendForce HBM premiums mid-2023; 800G
optics lead times 2023; WoodMac transformer surveys; HDD lead times >52 wks Sep-2025).
*Guard:* trace every lead-time number to a primary survey — several load-bearing figures in the
energy study traced only to SEO/vendor slop.

**Phase 1 — corporate confirmation** *("sold out through 20XX" on an earnings call)*
History says this is **not late**: Micron said HBM was sold out on Mar 20 2024 → +14% next day,
+43% more in 3 months — because price hikes reach *reported* margins 2–3 quarters later, the
sold-out call starts the biggest leg.
*Guard — parse WHAT is sold out.* Firm PO backlog ≠ slot-reservation agreements (cancellable
options — 63 of GEV's 116 GW) ≠ contingent commitments (~$3B of LEU's $4.5B) ≠ queue requests
(5–10× phantom — Vistra's own management calls ERCOT's 400+ GW queue ~97% phantom) ≠ LOIs
(Oklo's 14 GW). Only the first class is revenue.

**Phase 2 — monetization proof** *(one signed deal at premium economics reprices the layer)*
Talen–AWS (Mar-2024) lit the IPP group; CEG–Microsoft TMI (Sep-2024) was +22% in a day; CRDO's
hyperscaler print (Dec-2024) +48% in a day.
*Guard — the 8-quarter filter:* the deal's revenue must **start inside ~8 quarters**. A 2031
in-service date is not a Phase-2 event however novel the pricing. Constraints that cannot
monetize in-window round-trip on schedule — the confirmed false-positive class: OKLO −65%,
NuScale −78%, LEU −48% from the Oct-2025 hype peak, PSIX, NET Power −85%. All were
*correctly-identified constraints* whose monetization sat outside the window. **The trade pays
the layer already booking the scarcity in current revenue.**

**Phase 3 — margin cash-in** *(consensus chases reported numbers; steepest leg)*
The instrument is the contract-price QoQ series (DRAM +90–95% QoQ in Q1-26 drove MU ~10x,
SNDK ~43x). Ride it with the exhaustion tells armed.

**Phase 4 — exhaustion** *(any ONE tell suffices)*
1. **Second derivative of pricing turns down** — deceleration, not decline, is the trigger:
   Q3-26 DRAM hike guidance decelerated to +13–18% from +60%, and the memory names fell 25–45%
   within weeks.
2. **The rent gets capped** politically/contractually — PJM's $325/MW-day collar. A cap backed
   by every governor plus the White House is a *policy equilibrium*, i.e. the base case; never
   underwrite cap-expiry as a catalyst.
3. **Capacity response becomes credible** — count announced plants and online dates, and watch
   ramp costs eat margins *before* volumes deliver (PSIX GM 29.7%→22.9%; SARO −270bps; AAON's
   guide-down). "Sold out = pricing power" breaks at the ramp edge first.

## False-positive guards (each one caught real errors in the energy study)

- **Priced-in test.** Before calling anything unpriced, check the forward curve/strip (the gas
  "unpriced" claim died on a $4.20–4.65 winter strip) and recompute the stock's run from correct
  base dates off **daily** closes — monthly-close peaks understated drawdowns by 10–15 points.
- **Crowding census.** Measure the name's actual drawdown on the last efficiency-shock session
  (Jan 27 2025 is the reference): >10% down means the market already files it as an AI name
  whatever its sector label; the genuinely un-crowded printed under 4% (ITRI −1.2%, SARO +0.3%).
  Re-run the census on every new shock.
- **Staleness test.** Re-verify every load-bearing number against a primary source dated within
  two weeks — three energy theses were stale at their own filing date.
- **Priced-and-disputed ≠ unpriced.** A flat stock that already rallied on the thesis and got
  sold back is a live market *disagreement*; the honest trade there is a variant view with a
  dated catalyst, sized smaller.
- **Story vs revenue.** Announcement-driven names with no revenue leverage round-trip. Always.

## Entry & sizing discipline

- Enter on the layer's **shock-day drawdowns**, never on theme-headline strength.
- Size every position for a measured −20/−30% single-day gap — the AI complex has done it twice
  and round-tripped twice.
- The whole theme is **one trade in N costumes**: cross-layer "diversification" within a
  constraint theme is an illusion (measured: eight energy lenses fell together on one headline).
  Cap the sleeve.

## Master tripwires

1. **The demand anchor's own capex guidance** (for AI: hyperscaler quarterly calls) — the first
   guide-down or "digestion" language ends every phase in every layer at once.
2. **The funding mix of that capex** — debt-financed share went 9% (FY24) → 32% (mid-2026);
   externally funded capex breaks faster than cash-funded capex.

## Running it on the next constraint

Quarterly (or on any candidate signal): (1) scan Phase-0 sources — lead-time surveys, spot
premiums, allocation language — for *any* input to the current buildout; (2) date each candidate
layer on the clock with the guards applied; (3) for anything Phase 1–2 with in-window
monetization, build the priced-in + crowding census before proposing a name; (4) log proposals
with dated falsifiers and pre-registered kill switches; (5) re-run the crowding census on every
shock day. The standing indicator dashboard for the *current* (energy) instance lives in
[`ai-energy-constraint.md`](ai-energy-constraint.md); automation of this loop is parked in
[`../IDEAS.md`](../IDEAS.md) pending Eric's call.
