import { type CoverLeg, coverNeeds } from "../domain/option-book.js";
import { coverLegOf, type DraftOrder, type DraftVerdict, draftSymbols } from "./draft-order.js";
import { draftRequirements } from "./draft-order-requirements.js";
import { heldShares } from "./option-economics.js";
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

/**
 * JUDGED ON THE BOOK THE DRAFT LEAVES, the way the bots' `needsAfterClose` judges a close (#4684
 * review): the options already held plus this draft's legs, run through the one cover rule. A sold
 * call can be covered by shares or by a long call, so a draft that sells a long call to close, or
 * buys back a short one, can uncover a call it never names — only the whole book shows that. Every
 * sold call left without a long to cap it needs 100 held shares; shares a buy-back frees are freed
 * only if shares, not a long call, stood behind it, and a held short a held long already caps
 * promises no shares at all.
 *
 * NO WORSE IS NOT REFUSED: an order is refused only when it raises what the book needs past what
 * the account holds — an account already short of cover is never blocked from an order that leaves
 * it no worse (buying a put, closing part of the gap).
 *
 * Cash keeps the desk's rule — the draft's own demand against the account's whole cash, as the
 * single-leg ticket does — and adds what closing a long put asks of the short put it capped.
 */
export function validateDraftAccount(
  draft: DraftOrder,
  context: DraftAccountContext,
): DraftVerdict {
  const refusals: string[] = [];
  const book = heldCoverLegs(context);
  const legs = draft.legs.map(coverLegOf);
  const before = coverNeeds(book);
  const after = coverNeeds([...book, ...legs]);
  const cash = Math.max(
    draftRequirements(draft, heldContracts(context)).cash,
    putCash([...book, ...legs]) - putCash(book),
  );

  if (cash > context.cash) {
    refusals.push(
      `This order needs $${cash.toLocaleString("en-US")} set aside and you have $${Math.floor(context.cash).toLocaleString("en-US")}. Fewer contracts, a narrower spread, or more cash.`,
    );
  }
  for (const [underlying, needed] of after.sharesByUnderlying) {
    const held = heldShares(context, underlying);
    const already = before.sharesByUnderlying.get(underlying) ?? 0;
    if (needed <= held || needed <= already) continue;
    const promised = Math.min(held, already);
    refusals.push(
      `A sold call needs shares or a long call behind it: ${underlying} needs ${needed} held and you hold ${held}${promised > 0 ? `, ${promised} of them already covering calls you've sold` : ""}.${sellsCappingCall(draft, context, underlying) ? " Selling a long call you hold leaves the call it capped uncovered." : ""} This desk never sells naked calls.`,
    );
  }

  return { ok: refusals.length === 0, refusals, warnings: [] };
}

/** Options held, as the cover arithmetic reads them — shares are compared separately. */
function heldCoverLegs(context: DraftAccountContext): CoverLeg[] {
  return context.positions.flatMap((position): CoverLeg[] => {
    const parts = parseOccSymbol(position.symbol);
    return parts && position.quantity !== 0 ? [{ ...parts, contracts: position.quantity }] : [];
  });
}

/** The cash a book sets aside for sold puts alone. A call's cash is a capped width, which only ever
 *  trades places with shares (a long call bought above a covered call caps it), so it stays with the
 *  draft's own demand rather than charging a member for protection they just added. */
function putCash(legs: readonly CoverLeg[]): number {
  return coverNeeds(legs.filter((leg) => leg.type === "put")).cash;
}

/** Whether the draft sells a call on `underlying` that the account holds long — a close that can
 *  take away the cap a sold call was resting on. */
function sellsCappingCall(
  draft: DraftOrder,
  context: DraftAccountContext,
  underlying: string,
): boolean {
  const held = heldContracts(context);
  const symbols = draftSymbols(draft);
  return draft.legs.some(
    (leg, i) =>
      leg.action === "sell" &&
      leg.optionType === "call" &&
      leg.underlying === underlying &&
      (held.get(symbols[i] ?? "") ?? 0) > 0,
  );
}

/** OCC symbol → contracts held, signed (+ long, − short), so a sell that closes a long is not read
 *  as a new short, nor a buy that closes a short as a new long that caps one. */
function heldContracts(context: DraftAccountContext): ReadonlyMap<string, number> {
  const held = new Map<string, number>();
  for (const position of context.positions) {
    if (position.quantity === 0 || !parseOccSymbol(position.symbol)) continue;
    held.set(position.symbol.toUpperCase(), position.quantity);
  }
  return held;
}
