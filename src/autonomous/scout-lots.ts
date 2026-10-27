import type { OrderSettlement } from "../domain/order-settlement.js";
import { isRecord } from "../storage/parse-guards.js";
import type { IntentOutcome } from "./decision-record.js";

/**
 * THE FORCED DAILY PICK'S OWN LOTS (review of #4642 slice 10). The scout used to track the NAMES it
 * owned, added before its buy was even submitted and sold whole at the next rollover. Three ways
 * that went wrong: a pick that was only observed (observe mode), blocked by a halt, or rejected by
 * the broker stayed "owned" for good; a disarmed scout then sold the account's WHOLE holding of that
 * name — another playbook's shares included — under the BETA-SCOUT label; and the rollover released
 * a lot before its sell was placed, so a halted first cycle stranded it (#4786).
 *
 * A lot is now fill-based and counted: it exists only once a scout buy was actually placed, carries
 * the shares that buy took, and is sold at the first session after its own, never for more than it
 * holds and never for more than the account holds. It is released only once its sell was placed.
 *
 * A buy still WORKING at the broker (a pick staged after the close fills at the open; a share order
 * whose fill the submit did not see) has filled nothing yet. Its lot is kept against the order's id
 * and is never sold on the ordered quantity: the settle loop records how the order ended (#4650,
 * `order_settlements`), and `settleLots` turns the lot into what it filled — or drops it when it
 * filled nothing. Until then it waits, and is looked at again next cycle.
 *
 * The same holds for an order the broker answered PART-filled while it still holds the rest (#4787,
 * `OrderResult.open`): a buy's lot settles to the final fill, and a sale keeps its lots held against
 * the sale's id until the sale ends — released for what it sold, and only the unsold part due
 * again. Before, a part-filled sale left the unsold part due at once, so once the broker filled the
 * rest the scout sold those shares a second time — another playbook's.
 */
export interface ScoutLot {
  readonly symbol: string;
  /** Shares the scout's buy filled — or, while the broker has not confirmed a fill, ordered. */
  readonly quantity: number;
  /** The session day the buy was for; the lot is sold on the first session after it. */
  readonly day: string;
  /** The bot account (persona id) it was bought on, when known. */
  readonly host?: string;
  /** Present while the buy is still working at the broker: its order id, the key its settlement
   *  arrives under. Such a lot is never sold until `settleLots` has confirmed what it filled. */
  readonly workingOrderId?: string;
  /** Present while a sale of this lot is placed but not finished at the broker: the sale's order
   *  id. Such a lot is not offered again until `settleLots` reads how the sale ended. */
  readonly sellingOrderId?: string;
}

/** Whether the broker has finished this placed order, or will still report how it ended. */
const unfinished = (outcome: IntentOutcome): boolean =>
  outcome.result?.status === "working" || outcome.result?.open === true;

/** Shares an outcome actually moved: a placed order the broker took, at what it filled, or at the
 *  whole order while it is still working (it may yet fill). Zero for anything not placed. */
function sharesMoved(outcome: IntentOutcome): number {
  const result = outcome.result;
  if (outcome.action !== "placed" || !result) return 0;
  if (result.status === "rejected" || result.status === "unfilled") return 0;
  if (result.status === "filled" && result.filledQuantity !== undefined) {
    return Math.max(0, result.filledQuantity);
  }
  return outcome.intent.quantity;
}

/** The lot a scout buy's outcome leaves, if any: only a buy the broker actually took. Never one
 *  from an observed, blocked, refused or rejected pick. A buy still working keeps its order id and
 *  is not yet sellable (`settleLots`); one working with no order id cannot be confirmed, so it
 *  leaves no lot at all — the caller says so. */
export function lotFromOutcome(
  outcome: IntentOutcome,
  day: string,
  host?: string,
): ScoutLot | undefined {
  if (outcome.intent.side !== "buy") return undefined;
  const quantity = sharesMoved(outcome);
  if (!(quantity > 0)) return undefined;
  const lot = { symbol: outcome.intent.symbol, quantity, day, ...(host ? { host } : {}) };
  if (!unfinished(outcome)) return lot;
  const orderId = outcome.result?.orderId;
  return orderId ? { ...lot, workingOrderId: orderId } : undefined;
}

/**
 * Each unfinished lot reconciled with how its order ended. A buy: filled → a lot of exactly what
 * filled; filled nothing (rejected, canceled, expired at the open) → no lot. A sale (every lot it
 * was sized from, together): its filled shares released oldest lot first, and what it did not sell
 * left as one lot, due again. No settlement yet → kept as it is, to be looked at again. A failed
 * read is "no settlement yet", never a guess.
 */
export function settleLots(
  lots: readonly ScoutLot[],
  settlementOf: ((orderId: string) => OrderSettlement | undefined) | undefined,
): { readonly lots: ScoutLot[]; readonly changed: boolean } {
  const read = (orderId: string): OrderSettlement | undefined => {
    try {
      return settlementOf?.(orderId);
    } catch {
      return undefined;
    }
  };
  let changed = false;
  const bought = lots.flatMap((lot): ScoutLot[] => {
    if (!lot.workingOrderId) return [lot];
    const settlement = read(lot.workingOrderId);
    if (!settlement) return [lot];
    changed = true;
    if (!(settlement.filledQuantity > 0)) return [];
    const { workingOrderId: _settled, ...confirmed } = lot;
    return [{ ...confirmed, quantity: settlement.filledQuantity }];
  });
  const out: ScoutLot[] = [];
  const done = new Set<string>();
  for (const lot of bought) {
    const saleId = lot.sellingOrderId;
    if (!saleId) {
      out.push(lot);
      continue;
    }
    if (done.has(saleId)) continue;
    const sale = read(saleId);
    const group = bought.filter((l) => l.sellingOrderId === saleId);
    if (!sale) {
      out.push(...group);
      done.add(saleId);
      continue;
    }
    changed = true;
    done.add(saleId);
    const held = group.reduce((sum, l) => sum + l.quantity, 0);
    const unsold = held - Math.max(0, sale.filledQuantity);
    const { sellingOrderId: _ended, ...first } = group[0] as ScoutLot;
    if (unsold > 0) out.push({ ...first, quantity: unsold });
  }
  return { lots: out, changed };
}

/**
 * The lots left after an exit's outcome. A sale the broker has not finished (working, or part
 * filled with the rest still live) keeps the lots it was sized from, held against its order id
 * until `settleLots` reads how it ended (#4787). A finished one releases them — all when it sold
 * everything it asked for, else one lot of what it did not sell. An exit not placed (observed,
 * blocked, refused, rejected) leaves every lot as it was, for the next try.
 */
export function afterExit(
  lots: readonly ScoutLot[],
  outcome: IntentOutcome,
  isDue: (lot: ScoutLot) => boolean,
): ScoutLot[] {
  const sold = sharesMoved(outcome);
  if (outcome.intent.side !== "sell" || !(sold > 0)) return [...lots];
  const mine = lots.filter((lot) => lot.symbol === outcome.intent.symbol && isDue(lot));
  const rest = lots.filter((lot) => !mine.includes(lot));
  const saleId = outcome.result?.orderId;
  // A sale with no order id can never be settled; it is released as before rather than held for
  // good — the broker refuses to sell shares it does not hold, so this can never oversell.
  if (unfinished(outcome) && saleId) {
    return [...rest, ...mine.map((lot) => ({ ...lot, sellingOrderId: saleId }))];
  }
  const unsold = outcome.intent.quantity - sold;
  const first = mine[0];
  return unsold > 0 && first ? [...rest, { ...first, quantity: unsold }] : rest;
}

/** Shares the scout may sell per symbol: its due lots summed. */
export function lotShares(lots: readonly ScoutLot[]): Map<string, number> {
  const shares = new Map<string, number>();
  for (const lot of lots) shares.set(lot.symbol, (shares.get(lot.symbol) ?? 0) + lot.quantity);
  return shares;
}

/**
 * The persisted `owned_json`, read safely: today's lots, and the bare symbols a state saved before
 * lots carried a quantity still names. Those are never sold — how many shares were the scout's is
 * unknown, and the whole holding may be another playbook's — so the caller says so once and drops
 * them. Anything malformed is dropped too, never guessed.
 */
export function parseOwned(value: unknown): {
  readonly lots: ScoutLot[];
  readonly legacySymbols: string[];
} {
  const lots: ScoutLot[] = [];
  const legacySymbols: string[] = [];
  for (const entry of Array.isArray(value) ? value : []) {
    if (typeof entry === "string") {
      legacySymbols.push(entry);
      continue;
    }
    if (!isRecord(entry)) continue;
    const { symbol, quantity, day, host, workingOrderId, sellingOrderId } = entry;
    if (typeof symbol !== "string" || typeof day !== "string") continue;
    if (typeof quantity !== "number" || !(quantity > 0)) continue;
    lots.push({
      symbol,
      quantity,
      day,
      ...(typeof host === "string" ? { host } : {}),
      ...(typeof workingOrderId === "string" ? { workingOrderId } : {}),
      ...(typeof sellingOrderId === "string" ? { sellingOrderId } : {}),
    });
  }
  return { lots, legacySymbols };
}
