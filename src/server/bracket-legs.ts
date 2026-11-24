import type { AlpacaOrder } from "../alpaca/alpaca-trading-client.js";

/**
 * A BRACKET'S EXITS, AS THE BROKER ECHOES THEM (#8249). A bracket is one Alpaca order whose two
 * child legs the broker holds: a take-profit (a limit) and a stop. What the desk shows about them
 * — on the receipt and in the orders list — comes from the broker's own echo, never the draft the
 * member typed, so a price the broker rounded or refused can never be shown as working.
 *
 * Which leg is which is read from the legs themselves (a limit leg is the take-profit, a stop leg
 * the stop), and only under a parent whose `order_class` is "bracket". Nothing is guessed from a
 * flat row: a flat read carries no parent link, so a row is named an exit only when a nested read
 * put it under a bracket.
 */

export type ExitRole = "take-profit" | "stop";

export interface EchoedExits {
  readonly takeProfit: number;
  readonly stop: number;
}

const price = (raw: string | null | undefined): number | undefined => {
  const n = raw === null || raw === undefined ? Number.NaN : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const roleOf = (leg: AlpacaOrder): ExitRole | undefined => {
  const type = (leg.type ?? "").toLowerCase();
  if (type === "limit") return "take-profit";
  if (type === "stop") return "stop";
  return undefined;
};

/** The two exit prices a submit echo carries, or undefined when it is not a bracket with both. */
export function echoedExits(order: AlpacaOrder): EchoedExits | undefined {
  if (order.order_class !== "bracket" || !order.legs) return undefined;
  let takeProfit: number | undefined;
  let stop: number | undefined;
  for (const leg of order.legs) {
    const role = roleOf(leg);
    if (role === "take-profit") takeProfit = price(leg.limit_price);
    if (role === "stop") stop = price(leg.stop_price);
  }
  return takeProfit !== undefined && stop !== undefined ? { takeProfit, stop } : undefined;
}

/** Each exit leg's id → its role, from a NESTED read (legs under their bracket parent). */
export function exitRoles(nested: readonly AlpacaOrder[]): ReadonlyMap<string, ExitRole> {
  const roles = new Map<string, ExitRole>();
  for (const parent of nested) {
    if (parent.order_class !== "bracket") continue;
    for (const leg of parent.legs ?? []) {
      const role = roleOf(leg);
      if (role) roles.set(leg.id, role);
    }
  }
  return roles;
}

/** Whether a flat read holds any bracket piece — the one case worth a second, nested read. */
export const hasBracket = (orders: readonly AlpacaOrder[]): boolean =>
  orders.some((o) => o.order_class === "bracket");
