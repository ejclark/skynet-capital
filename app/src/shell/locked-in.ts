import { contractMultiplier } from "../../../src/trading/option-symbols";
import { dollars } from "../live/book-health";
import type { DeskPosition } from "../live/desk";
import type { DeskOrderEvent } from "../live/desk-events";
import { num } from "../live/guidance";
import { atLockInBar, markOf } from "../live/position-mark";
import { held, parseQuantity } from "../live/quantity";
import { isCompletedFill } from "./fill-flare";

/**
 * A LOCKED-IN PROFIT, RECOGNIZED (#4609 slice 1). The app marks a winner **Consider ▲** once its
 * return passes the decision engine's lock-in bar (`position-mark.ts` → `atLockInBar`, the same
 * bars as `src/observatory/decisions-view.ts`), with the reason "winners can give it back". Until
 * now, closing that position read exactly like closing anything else. This is the join: a close
 * the member sent while the badge said Consider, its fill, and the realized dollars — said with
 * the reason in the past tense, beside the close's own receipt line.
 *
 * WHAT IT REMEMBERS, AND WHEN. The flag is read off the whole ROW (`lockInFlag`; the row is where
 * the badge is, so a close of one of its buys carries it too) and rides the `SentClose` from the
 * moment the order is sent, never re-read at the fill: by then the desk has refetched, and a full
 * close has no row left to ask. A written option is judged on its strike first and the opened row
 * has no live stock price, so a sold option is never flagged here (a badge we cannot confirm is a
 * celebration we must not make) — threading the price in is #7383.
 *
 * WHO MAY SEE IT. The fill is the one `useOrderFill` hands the receipt: the desk's own stream,
 * owner-scoped on the server through `forVisibility` (#1211; `src/server/desk-events-route.ts`) and
 * narrowed on the client to the order this row sent — see `fill-flare.ts`. Another order's event,
 * an order still partly filled, or one cancelled recognizes nothing. A close of PART of the
 * position does count, and says plainly that the rest is still open.
 *
 * HONEST BY CONSTRUCTION. Realized is the member's own fill against their own cost — never a claim
 * about the market or about what the rest will do. A close that realized nothing or a loss is not
 * a locked-in profit: `lockedIn` returns undefined and the receipt's plain "Sold …" line stands
 * alone, with no celebration and no penalty (CLAUDE.md → *Positive reinforcement over negative*).
 *
 * THE MOMENT ITSELF (slice 2) is `lock-in-ceremony.tsx`: the full-screen celebration these words
 * sit in, shown by one host in the root shell so a full close emptying the row cannot cut it off.
 */

/** One buy's size and cost: per share, or per contract for an option — the scale a fill price ×
 *  multiplier is in (`src/observatory/broker-positions.ts` scales an option's cost per contract). */
export interface BuyCost {
  readonly qty: number;
  readonly unitCost: number;
}

/** What the close remembers from the moment it was sent. */
export interface LockInFlag {
  /** The badge's own fact when it was sent: "up 55%". */
  readonly fact: string;
  /** Shares or contracts held when it was sent. */
  readonly held: number;
  /** The buys a sell comes out of, oldest first — the ledger pairs a sell with the oldest buy
   *  (`src/trading/round-trips.ts`, FIFO), so a sell sized to one buy still realizes against the
   *  oldest. One entry at the position's average when the desk lists no buys. */
  readonly buys: readonly BuyCost[];
}

/** What a recognized lock-in says. */
export interface LockedIn {
  /** Dollars realized by this fill, always above zero. */
  readonly realized: number;
  /** "Locked in $1,240 on 2 contracts of AMD $180 call" */
  readonly headline: string;
  /** What the fill closed, the headline's tail: "2 contracts of AMD $180 call". */
  readonly what: string;
  /** "The other 2 contracts are still running." on a partial close; "Closed in full." otherwise. */
  readonly rest: string;
  /** The reason the call was right, past tense. */
  readonly why: string;
}

const validCost = (c: BuyCost): boolean =>
  Number.isFinite(c.qty) && c.qty > 0 && Number.isFinite(c.unitCost) && c.unitCost > 0;

/** The buys oldest first, or the whole position at its average; undefined if any cost is unread. */
function buyCosts(position: DeskPosition, count: number): BuyCost[] | undefined {
  const costs = position.lots?.length
    ? position.lots.map((lot) => ({
        qty: parseQuantity(lot.quantity),
        unitCost: Math.abs(num(lot.costPerShare)),
      }))
    : [{ qty: count, unitCost: Math.abs(num(position.costPerShare)) }];
  return costs.every(validCost) ? costs : undefined;
}

/** The flag a close of this ROW's position carries — the row is where the badge is, so a close of
 *  one of its buys carries the row's flag too. Undefined when it is not marked Consider for its
 *  gain, or its cost cannot be read (no dollars, no claim). */
export function lockInFlag(position: DeskPosition, spot?: number): LockInFlag | undefined {
  const { count, short } = held(position.quantity);
  if (count <= 0 || (short && position.isOption && spot === undefined)) return undefined;
  if (!atLockInBar(position, spot)) return undefined;
  const buys = buyCosts(position, count);
  return buys ? { fact: markOf(position, spot).fact, held: count, buys } : undefined;
}

/** What `qty` units cost, taken from the buys oldest first; undefined past what was held. */
function fifoCost(buys: readonly BuyCost[], qty: number): number | undefined {
  let left = qty;
  let cost = 0;
  for (const buy of buys) {
    if (left <= 0) break;
    const take = Math.min(buy.qty, left);
    cost += take * buy.unitCost;
    left -= take;
  }
  return left > 0 ? undefined : cost;
}

const field = (fill: DeskOrderEvent, key: string): number | undefined => {
  const value = fill.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const units = (n: number, option: boolean): string =>
  `${n.toLocaleString("en-US")} ${option ? "contract" : "share"}${n === 1 ? "" : "s"}`;

/**
 * The close as a locked-in profit, or undefined: the position was not flagged, the order has not
 * filled, the fill carries no price (no dollars, no claim), or it realized nothing or a loss.
 * `side` is the close's: a sell closes a long, a buy closes a short.
 */
export function lockedIn(
  sent: {
    readonly orderId: string;
    readonly symbol: string;
    readonly display: string;
    readonly side: "buy" | "sell";
    readonly count: number;
    readonly lockIn?: LockInFlag;
  },
  fill: DeskOrderEvent | undefined,
): LockedIn | undefined {
  const flag = sent.lockIn;
  if (!(flag && isCompletedFill(fill)) || fill.orderId !== sent.orderId) return undefined;
  const price = field(fill, "price");
  if (price === undefined) return undefined;
  const qty = Math.min(field(fill, "filledQuantity") ?? sent.count, flag.held);
  if (qty <= 0) return undefined;
  const cost = fifoCost(flag.buys, qty);
  if (cost === undefined) return undefined;
  const mult = contractMultiplier(sent.symbol);
  const option = mult !== 1;
  const proceeds = price * mult * qty;
  const realized = sent.side === "sell" ? proceeds - cost : cost - proceeds;
  if (Math.round(realized) <= 0) return undefined;
  const left = flag.held - qty;
  const partial = left > 0;
  const what = `${units(qty, option)} of ${sent.display}`;
  return {
    realized,
    headline: `Locked in ${dollars(realized)} on ${what}`,
    what,
    rest: partial
      ? left === 1
        ? `The other ${option ? "contract" : "share"} is still running.`
        : `The other ${units(left, option)} are still running.`
      : "Closed in full.",
    why: `✦ it was marked Consider, ${flag.fact}, and winners can give it back. you closed ${partial ? "part of it, so that part" : "it, so the gain"} is locked in.`,
  };
}
