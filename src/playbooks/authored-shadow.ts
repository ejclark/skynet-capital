/**
 * THE SHADOW LEDGER FOR AN AUTHORED PLAY (#5457 slice 2) — what a member's draft WOULD have bought
 * and sold, written down without an order ever being built for the account.
 *
 * It reuses COND-SCOUT's shadow ledger (`cond-scout-ledger.ts`, #3651) where that ledger's ideas
 * carry over, and says where they do not. Shared: the FILL RULE (a would-be buy fills at the ask and
 * a would-be sell at the bid of the quote in hand, with the whole quote kept beside the fill so the
 * spread paid is auditable — a fill at the mid would hand every test half the spread), the posture
 * (no account's cash, positions, activity or rank moves because of a test), and the shapes it is
 * pure and clock-free in. Not shared: COND-SCOUT's probe is a scanner's hypothesis with its own stop
 * and horizon; an authored play's entry AND exit come from its own window (`desiredState`), so the
 * ledger here is a would-be position and a list of would-be fills, not a probe lifecycle.
 *
 * NO PATH TO AN ORDER. This module imports nothing but types; it names no order, broker or guard,
 * and `tests/playbooks/authored-shadow.spec.ts` holds that by reading its own source. The pass that
 * feeds it (`authored-shadow-runner.ts`) is the only thing that decides what is recorded.
 */
import type { AuthoredPlaySpec } from "./authored-play.js";
import type { FillQuote } from "./cond-scout-ledger.js";

/** Bounds, so a long test can never grow its own row without limit. */
export const MAX_SHADOW_TRADES = 100;
export const MAX_SHADOW_SESSIONS = 120;
export const MAX_SHADOW_REFUSALS = 30;

export type ShadowSide = "buy" | "sell";

/** One would-be fill — never sent anywhere. */
export interface ShadowTrade {
  readonly at: number;
  readonly side: ShadowSide;
  readonly symbol: string;
  readonly quantity: number;
  /** The ask for a buy, the bid for a sell. */
  readonly price: number;
  readonly quote: FillQuote;
  /** Present on a sell: (price − average cost) × quantity. */
  readonly realized?: number;
}

/** A guard that would have stopped the play, once per day and reason — a 15-second pass that is
 *  refused the same way all afternoon is one fact, not a thousand. */
export interface ShadowRefusal {
  readonly day: string;
  readonly symbol: string;
  readonly side: ShadowSide;
  readonly reason: string;
}

interface ShadowHolding {
  readonly quantity: number;
  readonly avgPrice: number;
  readonly openedAt: number;
}

export interface ShadowRun {
  /** The play's id (`U-<account>-<slug>`). */
  readonly id: string;
  /** When this test began (ISO): a different value is a different test. */
  readonly since: string;
  readonly spec: AuthoredPlaySpec;
  /** Session days (YYYY-MM-DD) on which a pass ran against the author's book, oldest first. */
  readonly sessions: readonly string[];
  /** The newest fills, oldest first; `tradeCount` counts every one ever recorded. */
  readonly trades: readonly ShadowTrade[];
  readonly tradeCount: number;
  /** Dollars won or lost on the would-be round trips closed so far (never capped, unlike `trades`). */
  readonly realized: number;
  /** Would-be round trips closed (every sell). */
  readonly roundTrips: number;
  readonly holding?: ShadowHolding;
  readonly refusals: readonly ShadowRefusal[];
}

export function startRun(order: {
  readonly id: string;
  readonly since: string;
  readonly spec: AuthoredPlaySpec;
}): ShadowRun {
  return {
    id: order.id,
    since: order.since,
    spec: order.spec,
    sessions: [],
    trades: [],
    tradeCount: 0,
    realized: 0,
    roundTrips: 0,
    refusals: [],
  };
}

/** Is `order` the test `run` is already running? A different start, or an edited spec, is a new one. */
export function isSameTest(
  run: ShadowRun,
  order: { readonly since: string; readonly spec: AuthoredPlaySpec },
): boolean {
  return run.since === order.since && JSON.stringify(run.spec) === JSON.stringify(order.spec);
}

/** Count a session day once. */
export function noteSession(run: ShadowRun, day: string): ShadowRun {
  if (run.sessions.includes(day)) return run;
  return { ...run, sessions: [...run.sessions, day].slice(-MAX_SHADOW_SESSIONS) };
}

/** The price a would-be fill takes, or undefined with no usable side of the quote. */
export function fillPrice(side: ShadowSide, quote: FillQuote): number | undefined {
  const price = side === "buy" ? quote.ask : quote.bid;
  return price > 0 ? price : undefined;
}

export interface WouldBeFill {
  readonly side: ShadowSide;
  readonly symbol: string;
  readonly quantity: number;
  readonly quote: FillQuote;
  readonly at: number;
}

/**
 * Record a fill against the would-be position. A buy adds to it at the ask; a sell takes shares off
 * at the bid and books the difference from average cost. A sell larger than the position is cut to
 * it, and a fill with no price or no shares records nothing.
 */
export function recordFill(run: ShadowRun, fill: WouldBeFill): ShadowRun {
  const price = fillPrice(fill.side, fill.quote);
  if (price === undefined || !(fill.quantity > 0)) return run;
  const held = run.holding;
  if (fill.side === "buy") {
    const quantity = (held?.quantity ?? 0) + fill.quantity;
    const avgPrice =
      ((held?.quantity ?? 0) * (held?.avgPrice ?? 0) + fill.quantity * price) / quantity;
    const trade: ShadowTrade = { ...tradeOf(fill, price, fill.quantity) };
    return withTrade(run, trade, { quantity, avgPrice, openedAt: held?.openedAt ?? fill.at });
  }
  if (!held) return run;
  const quantity = Math.min(fill.quantity, held.quantity);
  const trade: ShadowTrade = {
    ...tradeOf(fill, price, quantity),
    realized: (price - held.avgPrice) * quantity,
  };
  const left = held.quantity - quantity;
  return withTrade(run, trade, left > 0 ? { ...held, quantity: left } : undefined);
}

function tradeOf(fill: WouldBeFill, price: number, quantity: number): ShadowTrade {
  return {
    at: fill.at,
    side: fill.side,
    symbol: fill.symbol,
    quantity,
    price,
    quote: fill.quote,
  };
}

function withTrade(
  run: ShadowRun,
  trade: ShadowTrade,
  holding: ShadowHolding | undefined,
): ShadowRun {
  const { holding: _was, ...rest } = run;
  return {
    ...rest,
    trades: [...run.trades, trade].slice(-MAX_SHADOW_TRADES),
    tradeCount: run.tradeCount + 1,
    realized: run.realized + (trade.realized ?? 0),
    roundTrips: run.roundTrips + (trade.side === "sell" ? 1 : 0),
    ...(holding ? { holding } : {}),
  };
}

/** Note a refusal once per (day, symbol, side, reason). */
export function recordRefusal(run: ShadowRun, refusal: ShadowRefusal): ShadowRun {
  const seen = run.refusals.some(
    (r) =>
      r.day === refusal.day &&
      r.symbol === refusal.symbol &&
      r.side === refusal.side &&
      r.reason === refusal.reason,
  );
  if (seen) return run;
  return { ...run, refusals: [...run.refusals, refusal].slice(-MAX_SHADOW_REFUSALS) };
}
