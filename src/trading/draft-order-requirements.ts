import { cappingLeg, type DraftOrder } from "./draft-order.js";
import { SHARES_PER_CONTRACT } from "./option-economics.js";

/** What a leg set demands from the account before it can be approved — cash to secure puts (bare
 *  or the capped width of a spread), and shares to cover calls a long leg doesn't cap. */
export interface DraftRequirements {
  readonly cash: number;
  readonly sharesByUnderlying: ReadonlyMap<string, number>;
}

/**
 * SLICE 2's pure half: what does this leg set demand, in dollars and shares — still no account,
 * still total. `draft-order-account.ts` is the seam that compares this against a real one. Split
 * out of `draft-order.ts` itself once this arithmetic pushed that file over the house's 300-line
 * cap — the state machine and its account-facing extensions are siblings, not one file.
 *
 * SAME ETHOS AS THE SINGLE-LEG TICKET (`option-ticket.ts`): no naked calls, ever, and a sold put
 * is never a bare promise. A short call capped by a long call needs shares from no one — the long
 * leg IS its cover — so only an uncapped short call ever adds to `sharesByUnderlying`. A short put
 * capped by a lower long put needs cash for the spread's width; a bare short put needs cash for
 * the whole strike, exactly like a single-leg cash-secured put.
 *
 * V1 SIMPLIFICATION, stated once so it isn't rediscovered as a bug later: a capped spread's cash
 * requirement is the full strike width, never width-minus-credit. Netting a credit needs a real
 * fill price, which this desk only has once an order actually fills — crediting a premium this
 * account hasn't been paid yet against what it must be able to cover would understate risk for
 * any limit order that fills away from its quoted price. Revisit once slice 3 wires real premiums
 * through the draft, if a narrower (and still honest) number is wanted.
 */
export function draftRequirements(draft: DraftOrder): DraftRequirements {
  let cash = 0;
  const sharesByUnderlying = new Map<string, number>();

  for (const leg of draft.legs) {
    if (leg.action !== "sell") continue;
    const scale = leg.contracts * SHARES_PER_CONTRACT;
    const cap = cappingLeg(draft.legs, leg);

    if (leg.optionType === "call") {
      if (cap) cash += (cap.strike - leg.strike) * scale;
      else
        sharesByUnderlying.set(
          leg.underlying,
          (sharesByUnderlying.get(leg.underlying) ?? 0) + scale,
        );
      continue;
    }
    cash += cap ? (leg.strike - cap.strike) * scale : leg.strike * scale;
  }

  return { cash, sharesByUnderlying };
}
