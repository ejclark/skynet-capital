import { coverNeeds } from "../domain/option-book.js";
import { coverLegOf, type DraftLeg, type DraftOrder, draftSymbols } from "./draft-order.js";

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
 * leg IS its cover — so only an uncapped short call ever adds to `sharesByUnderlying`. A capped
 * short needs cash for the strikes' width when the long sits on the far side of it (a call above, a
 * put below) and nothing when it sits on the near side (a debit spread, whose worst case is the
 * debit); a bare short put needs cash for the whole strike, exactly like a single-leg
 * cash-secured put.
 *
 * WHICH LONG CAPS WHICH SHORT is the bots' rule, not a copy of it (#4684): this is `option-book.ts`'s
 * `coverNeeds` over the draft's legs — one-to-one, so a long caps at most as many shorts as it has
 * contracts, and only shorts expiring no later than it. The desk's unlimited-loss warning
 * (`undefinedRiskLegs`) reads the same assignment, so it names exactly the calls charged shares here.
 *
 * V1 SIMPLIFICATION, stated once so it isn't rediscovered as a bug later: a capped spread's cash
 * requirement is the full strike width, never width-minus-credit. Netting a credit needs a real
 * fill price, which this desk only has once an order actually fills — crediting a premium this
 * account hasn't been paid yet against what it must be able to cover would understate risk for
 * any limit order that fills away from its quoted price. Revisit once slice 3 wires real premiums
 * through the draft, if a narrower (and still honest) number is wanted.
 *
 * A SELL THAT CLOSES demands nothing (#3407 P3 slice 3, the roll): `heldContracts` maps OCC
 * symbol → contracts the account already holds, signed (+ long, − short); a sell leg on a contract
 * held long in at least that size is a sell-to-close, not a new short, so it neither needs shares
 * behind it nor cash set aside. A BUY THAT CLOSES caps nothing: the contracts it buys back against a
 * held short end that short rather than open a long. Without the map (the pure, account-less read)
 * every leg opens.
 *
 * THIS IS THE DRAFT'S OWN DEMAND, NOT THE ACCOUNT'S VERDICT. Dropping a closing leg says nothing
 * about what the close leaves behind — selling the long call of a bull call spread leaves its short
 * call bare, and a buy-back frees shares only if shares stood behind it. `draft-order-account.ts`
 * judges shares on the whole book once the draft fills; only the cash floor is read from here.
 */
export function draftRequirements(
  draft: DraftOrder,
  heldContracts: ReadonlyMap<string, number> = new Map(),
): DraftRequirements {
  const symbols = draftSymbols(draft);
  const opening = draft.legs.flatMap((leg, i): DraftLeg[] => {
    const held = heldContracts.get(symbols[i] ?? "") ?? 0;
    if (leg.action === "sell") return held >= leg.contracts ? [] : [leg];
    const left = leg.contracts - Math.min(leg.contracts, Math.max(0, -held));
    return left > 0 ? [{ ...leg, contracts: left }] : [];
  });
  const { cash, sharesByUnderlying } = coverNeeds(opening.map(coverLegOf));
  return { cash, sharesByUnderlying };
}
