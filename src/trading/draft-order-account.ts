import type { DraftOrder, DraftVerdict } from "./draft-order.js";
import { draftRequirements } from "./draft-order-requirements.js";
import { heldShares } from "./option-economics.js";
import type { TicketHolding } from "./order-ticket.js";

/**
 * SLICE 2's account-facing half — the seam `draft-order.ts`'s `validate()` was built to take
 * rather than compute. `draftRequirements()` already knows what a leg set DEMANDS; this is the
 * one small piece that can see a real account and turn that demand into a verdict.
 *
 * Total and pure once `context` exists — the live fetch that builds it belongs to whoever calls
 * this from a route (slice 4), the same split `option-ticket.ts`'s `OptionTicketContext` already
 * uses for the single-leg desk.
 */
export interface DraftAccountContext {
  readonly cash: number;
  readonly positions: readonly TicketHolding[];
}

export function validateDraftAccount(
  draft: DraftOrder,
  context: DraftAccountContext,
): DraftVerdict {
  const refusals: string[] = [];
  const { cash, sharesByUnderlying } = draftRequirements(draft);

  if (cash > context.cash) {
    refusals.push(
      `This order needs $${cash.toLocaleString("en-US")} set aside and you have $${Math.floor(context.cash).toLocaleString("en-US")}. Fewer contracts, a narrower spread, or more cash.`,
    );
  }
  for (const [underlying, needed] of sharesByUnderlying) {
    const held = heldShares(context, underlying);
    if (held < needed) {
      refusals.push(
        `A short call needs the shares behind it: ${underlying} needs ${needed} held and you hold ${held}. This desk never sells naked calls.`,
      );
    }
  }

  return { ok: refusals.length === 0, refusals, warnings: [] };
}
