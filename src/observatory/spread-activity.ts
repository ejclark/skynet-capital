import type { OptionOrderLeg } from "../autonomous/decision-db-leg-orders.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import type { OrderIntent, Side } from "../domain/types.js";
import { humanizeOptionSymbol, isOccSymbol } from "../trading/option-symbols.js";
import type { TradeActivityRecord } from "./activity-record.js";
import { formatPrice } from "./desk-data.js";
import { spreadContractName } from "./option-contract-line.js";
import {
  type OptionFillCost,
  optionFillCost,
  optionFillCostWords,
  optionLegCost,
} from "./option-fill-cost.js";
import { type OrderOrigin, type OrderOriginIndex, orderOrigin } from "./order-origin.js";
import { formatSigned, plClass } from "./render-atoms.js";

/**
 * A bot's spread on Activity. The broker takes a spread as ONE order, but the account reports its
 * fills one per leg, each under the leg's own order id — so the ledger holds two lines that no
 * decision's order id matches, and Activity showed them as trades nobody explained.
 *
 * Here those leg lines fold into one row for the spread: the decision's own order id (so the exact
 * reasoning join in `wire-reasoning.ts` finds it, playbook and invalidator included), the spread in
 * words, and its net cash once — read off the decision's own fill by `optionFillCost`, never netted
 * a second time from the legs. Each leg rides beneath it with what it alone paid or received.
 *
 * A leg is folded only when the decision store recorded that exact order id as a leg of a spread it
 * placed, on the same contract and the same side; anything else renders exactly as before. A leg's
 * own realized P/L is not shown: half a spread "winning" while the other half pays for it is not a
 * result. The spread row carries their sum, and only once every leg has closed something.
 */

/** The spread a leg order belongs to, as the decision that placed it describes it. */
interface SpreadFacts {
  readonly orderId: string;
  /** The underlying. */
  readonly symbol: string;
  readonly display: string;
  readonly side: Side;
  /** The whole spread's cash, netted once — absent while its fill is unconfirmed. */
  readonly net?: OptionFillCost;
}

interface SpreadLegMatch {
  readonly leg: Pick<OptionOrderLeg, "occSymbol" | "side" | "ratio">;
  readonly spread: SpreadFacts;
}

/** A fill's order id → the spread it is a leg of, or undefined for any other order. */
export type SpreadOf = (orderId: string) => SpreadLegMatch | undefined;

export interface SpreadLookupDeps {
  readonly findSpreadLeg: (legOrderId: string) => OptionOrderLeg | undefined;
  readonly findByOrderId: (
    orderId: string,
  ) => { readonly record: DecisionRecord; readonly intent: OrderIntent } | undefined;
}

function spreadFacts(parentOrderId: string, deps: SpreadLookupDeps): SpreadFacts | undefined {
  const found = deps.findByOrderId(parentOrderId);
  const option = found?.intent.option;
  if (!(found && option && option.legs.length > 1)) return undefined;
  const { record, intent } = found;
  // The store hands back the outcome's own intent, so its result is found by identity.
  const net = optionFillCost(intent, record.outcomes.find((o) => o.intent === intent)?.result);
  return {
    orderId: parentOrderId,
    symbol: intent.symbol,
    display:
      spreadContractName(option.legs.map((leg) => leg.occSymbol)) ??
      `${intent.symbol} option spread`,
    side: intent.side,
    ...(net ? { net } : {}),
  };
}

/** The store's two exact joins composed: leg order id → spread order id → its decision. One
 *  decision read per spread, however many legs (and pages) ask for it. */
export function spreadLookup(deps: SpreadLookupDeps): SpreadOf {
  const spreads = new Map<string, SpreadFacts | undefined>();
  return (orderId) => {
    const leg = deps.findSpreadLeg(orderId);
    if (!leg) return undefined;
    if (!spreads.has(leg.parentOrderId)) {
      spreads.set(leg.parentOrderId, spreadFacts(leg.parentOrderId, deps));
    }
    const spread = spreads.get(leg.parentOrderId);
    return spread ? { leg, spread } : undefined;
  };
}

interface SpreadLegLine {
  readonly record: TradeActivityRecord;
  readonly ratio: number;
}

export type ActivityItem =
  | { readonly kind: "order"; readonly at: string; readonly record: TradeActivityRecord }
  | {
      readonly kind: "spread";
      readonly at: string;
      readonly spread: SpreadFacts;
      readonly legs: readonly SpreadLegLine[];
    };

interface SpreadGroup {
  readonly spread: SpreadFacts;
  readonly legs: SpreadLegLine[];
}

/** Every leg line of the ledger, grouped by the spread it belongs to. */
function spreadGroups(
  sortedDesc: readonly TradeActivityRecord[],
  spreadOf: SpreadOf,
): Map<string, SpreadGroup> {
  const groups = new Map<string, SpreadGroup>();
  for (const record of sortedDesc) {
    if (!isOccSymbol(record.symbol)) continue;
    const match = spreadOf(record.orderId);
    // Joined only to the leg the decision itself placed: the same contract, the same side.
    if (!match || match.leg.occSymbol !== record.symbol || match.leg.side !== record.side) continue;
    const group = groups.get(match.spread.orderId) ?? { spread: match.spread, legs: [] };
    group.legs.push({ record, ratio: match.leg.ratio > 0 ? match.leg.ratio : 1 });
    groups.set(match.spread.orderId, group);
  }
  return groups;
}

/**
 * The ledger (newest first) as Activity's rows: each recorded spread once, at its newest leg's
 * place, its legs ordered by contract; every other line exactly where it was. A line carrying the
 * spread's own order id is folded in too, so the spread is never listed twice. No `spreadOf`, or no
 * spread in the ledger, returns one item per line in the same order.
 */
export function foldSpreadLegs(
  sortedDesc: readonly TradeActivityRecord[],
  spreadOf?: SpreadOf,
): ActivityItem[] {
  const groups = spreadOf ? spreadGroups(sortedDesc, spreadOf) : new Map<string, SpreadGroup>();
  const legOf = new Map<string, string>();
  for (const [id, group] of groups) for (const leg of group.legs) legOf.set(leg.record.orderId, id);
  const items: ActivityItem[] = [];
  const placed = new Set<string>();
  for (const record of sortedDesc) {
    const id =
      legOf.get(record.orderId) ?? (groups.has(record.orderId) ? record.orderId : undefined);
    if (id === undefined) {
      items.push({ kind: "order", at: record.at, record });
      continue;
    }
    const group = groups.get(id);
    if (placed.has(id) || !group) continue;
    placed.add(id);
    const legs = [...group.legs].sort((a, b) => a.record.symbol.localeCompare(b.record.symbol));
    items.push({ kind: "spread", at: record.at, spread: group.spread, legs });
  }
  return items;
}

/** One leg beneath its spread's row: the contract, its side, its per-share fill and its dollars. */
export interface DeskActivityLeg {
  readonly orderId: string;
  readonly symbol: string;
  /** The contract in words — `"NVDA $185 CALL · 13 NOV 26"`. */
  readonly display: string;
  readonly side: "buy" | "sell";
  readonly quantity: number;
  readonly filled: number;
  /** Per share, as the broker filled this leg. */
  readonly price: string;
  /** What this leg alone paid or received, and how it adds up — absent until it fills at a price. */
  readonly cost?: string;
  readonly status: string;
  readonly at: string;
}

/** One ledger line's own fields, as every Activity row shows them — an order's row, and a leg's. */
export function ledgerLineFields(record: TradeActivityRecord) {
  return {
    orderId: record.orderId,
    symbol: record.symbol,
    display: humanizeOptionSymbol(record.symbol),
    side: record.side,
    quantity: record.quantity,
    filled: record.filledQuantity,
    price: record.price === undefined ? "—" : formatPrice(record.price),
    status: record.status,
    at: record.at,
  };
}

function legEvent({ record }: SpreadLegLine): DeskActivityLeg {
  const cost = optionLegCost(record.side, record.price, record.filledQuantity);
  return { ...ledgerLineFields(record), ...(cost ? { cost: optionFillCostWords(cost) } : {}) };
}

/** A spread is as far along as its least-filled leg: mid-update, that leg's status is the honest one. */
function spreadStatus(legs: readonly SpreadLegLine[]): string {
  const [least] = [...legs].sort(
    (a, b) => a.record.filledQuantity / a.ratio - b.record.filledQuantity / b.ratio,
  );
  return least?.record.status ?? "unknown";
}

/** The legs' realized P/L summed, only when every leg closed something — a partial sum is not the
 *  spread's result. */
function spreadRealized(
  legs: readonly SpreadLegLine[],
  realizedByOrder: ReadonlyMap<string, { readonly realized: number }> | undefined,
): number | undefined {
  let sum = 0;
  for (const { record } of legs) {
    const pl = realizedByOrder?.get(record.orderId);
    if (!pl) return undefined;
    sum += pl.realized;
  }
  return legs.length > 0 ? sum : undefined;
}

/** The spread's row, in `DeskActivityEvent`'s shape (`desk-json-view.ts` types it at its one use):
 *  quantities counted in whole spreads, Price the net per share, `net` the spread's cash once. */
export function spreadActivityEvent(
  item: Extract<ActivityItem, { kind: "spread" }>,
  origins: OrderOriginIndex,
  realizedByOrder?: ReadonlyMap<string, { readonly realized: number }>,
) {
  const { spread, legs } = item;
  const per = (pick: (leg: SpreadLegLine) => number) =>
    Math.min(...legs.map((leg) => Math.floor(pick(leg) / leg.ratio)));
  const realized = spreadRealized(legs, realizedByOrder);
  const first = legs[0]?.record;
  const origin: OrderOrigin = first ? orderOrigin(first, origins) : "unknown";
  return {
    orderId: spread.orderId,
    symbol: spread.symbol,
    display: spread.display,
    side: spread.side,
    quantity: per((leg) => leg.record.quantity),
    filled: per((leg) => leg.record.filledQuantity),
    price: spread.net ? formatPrice(spread.net.perShare) : "—",
    status: spreadStatus(legs),
    at: item.at,
    backfilled: legs.some((leg) => leg.record.source === "backfill"),
    origin,
    ...(realized !== undefined
      ? { realizedPl: formatSigned(realized), realizedTone: plClass(realized) }
      : {}),
    ...(spread.net ? { net: `${formatPrice(spread.net.dollars)} ${spread.net.direction}` } : {}),
    legs: legs.map(legEvent),
  };
}
