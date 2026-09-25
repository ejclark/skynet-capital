import { type DraftOrder, type DraftVerdict, draftSymbols } from "./draft-order.js";
import { draftRequirements } from "./draft-order-requirements.js";
import { freeShares, heldShares } from "./option-economics.js";
import { parseOccSymbol } from "./option-symbols.js";
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
  const { cash, sharesByUnderlying } = draftRequirements(draft, heldContracts(context));

  if (cash > context.cash) {
    refusals.push(
      `This order needs $${cash.toLocaleString("en-US")} set aside and you have $${Math.floor(context.cash).toLocaleString("en-US")}. Fewer contracts, a narrower spread, or more cash.`,
    );
  }
  for (const [underlying, needed] of sharesByUnderlying) {
    const held = heldShares(context, underlying);
    const free = freeShares(context, underlying) + sharesFreedByDraft(draft, context, underlying);
    if (free < needed) {
      const promised = held - free;
      refusals.push(
        `A short call needs the shares behind it: ${underlying} needs ${needed} held and you hold ${held}${promised > 0 ? `, ${promised} of them already covering calls you've sold` : ""}. This desk never sells naked calls.`,
      );
    }
  }

  return { ok: refusals.length === 0, refusals, warnings: [] };
}

/**
 * Shares this same draft frees on `underlying` by buying back calls already sold — a roll closes
 * the old short call and writes a new one, and the new one may use the shares the old one held.
 */
function sharesFreedByDraft(
  draft: DraftOrder,
  context: DraftAccountContext,
  underlying: string,
): number {
  const symbols = draftSymbols(draft);
  return draft.legs.reduce((freed, leg, i) => {
    if (leg.action !== "buy" || leg.optionType !== "call" || leg.underlying !== underlying) {
      return freed;
    }
    const symbol = (symbols[i] ?? "").toUpperCase();
    const short = context.positions.find((p) => p.symbol.toUpperCase() === symbol);
    const closing = short && short.quantity < 0 ? Math.min(leg.contracts, -short.quantity) : 0;
    return freed + closing * 100;
  }, 0);
}

/** OCC symbol → long contracts held, so a sell that closes one is not read as a new short. */
function heldContracts(context: DraftAccountContext): ReadonlyMap<string, number> {
  const held = new Map<string, number>();
  for (const position of context.positions) {
    if (position.quantity <= 0 || !parseOccSymbol(position.symbol)) continue;
    held.set(position.symbol.toUpperCase(), position.quantity);
  }
  return held;
}
