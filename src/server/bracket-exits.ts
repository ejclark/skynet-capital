import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";

/**
 * A BRACKET'S EXITS, AS THE BROKER STATES THEM (#8249 PR 2). A whole-share limit buy may carry a
 * take-profit and a stop the broker holds (`src/trading/order-exit.ts`); the receipt and the orders
 * list name them in words, "Take-profit" and "Stop", at the prices the BROKER echoed — never the
 * draft's, so a price the broker rounded or refused can't read as held.
 *
 * Two reads, two jobs:
 *   - `echoedExits` — the submit's own answer. Alpaca returns a bracket entry with its two legs, so
 *     the receipt states what the broker took the moment it took it.
 *   - `bracketExitRoles` — the orders list. It is read flat (`trade-orders-routes.ts`), so each leg
 *     is a row of its own and no row points at its entry. Alpaca's bracket rules name them anyway:
 *     an entry is a market or limit order, so a bracket's one stop-type piece (`stop`, or
 *     `stop_limit` when the stop leg carries a limit) is its stop; and
 *     both exits sit on the side opposite the entry, so a limit on the stop's side is the
 *     take-profit. When a symbol's brackets disagree on that side (a long bracket and a short one
 *     at once), a limit piece is left unnamed rather than guessed.
 */

export type ExitRole = "take-profit" | "stop";

export interface EchoedExits {
  readonly takeProfit: number;
  readonly stop: number;
}

const price = (raw: string | number | null | undefined): number | undefined => {
  if (raw === null || raw === undefined) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : undefined;
};

const isStopType = (type: string | undefined): boolean => {
  const t = (type ?? "").toLowerCase();
  return t === "stop" || t === "stop_limit";
};

type LegEcho = Pick<AlpacaOrder, "type" | "limit_price" | "stop_price">;

/** The two exit prices off a bracket entry's echoed legs; undefined unless both are there. */
export function echoedExits(legs: readonly LegEcho[] | null | undefined): EchoedExits | undefined {
  if (!legs) return undefined;
  const takeProfit = price(legs.find((l) => (l.type ?? "").toLowerCase() === "limit")?.limit_price);
  const stop = price(legs.find((l) => isStopType(l.type))?.stop_price);
  return takeProfit !== undefined && stop !== undefined ? { takeProfit, stop } : undefined;
}

type BracketPiece = Pick<AlpacaOrder, "id" | "symbol" | "side" | "type" | "order_class">;

const isBracket = (o: BracketPiece): boolean => o.order_class === "bracket";

/** Each bracket exit in a flat order list, by id → its role. Entries and simple orders are absent. */
export function bracketExitRoles(orders: readonly BracketPiece[]): ReadonlyMap<string, ExitRole> {
  const exitSides = new Map<string, Set<string>>();
  for (const o of orders) {
    if (!(isBracket(o) && isStopType(o.type))) continue;
    const sides = exitSides.get(o.symbol) ?? new Set<string>();
    sides.add(o.side);
    exitSides.set(o.symbol, sides);
  }
  const roles = new Map<string, ExitRole>();
  for (const o of orders) {
    if (!isBracket(o)) continue;
    if (isStopType(o.type)) {
      roles.set(o.id, "stop");
      continue;
    }
    const sides = exitSides.get(o.symbol);
    if ((o.type ?? "").toLowerCase() === "limit" && sides?.size === 1 && sides.has(o.side)) {
      roles.set(o.id, "take-profit");
    }
  }
  return roles;
}
