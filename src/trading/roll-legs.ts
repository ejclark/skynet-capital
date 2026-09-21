import type { NewLeg } from "./draft-order.js";
import type { OptionContractParts } from "./option-symbols.js";

/**
 * A ROLL AS ONE TICKET (#3407 P3 slice 3; the study's row 11 — Fidelity's Roll ticket, 1:1):
 * close the contract held and open the next one, as the two legs of one multi-leg draft, so the
 * draft route's own machinery (validate on the live account, review, one `mleg` submit) carries
 * it end to end and the seam reads `*_to_close` / `*_to_open` off the live book. Pure: the
 * caller supplies the held contract (signed contracts — negative is short), the target, and the
 * prices it wants each leg at.
 *
 * Direction follows the holding. A long is sold to close and the new one bought; a short is
 * bought back and the new one sold. Sizes match 1:1 — a partial roll is a different ticket.
 */
export interface RollTarget {
  readonly strike: number;
  readonly expiration: string;
}

export interface RollPrices {
  /** Premium per share for the closing leg (a short's ask, a long's bid). */
  readonly close?: number;
  /** Premium per share for the opening leg (a short's new bid, a long's new ask). */
  readonly open?: number;
}

export interface HeldContract extends OptionContractParts {
  /** Signed: positive long, negative short. */
  readonly contracts: number;
}

export function rollLegs(
  held: HeldContract,
  target: RollTarget,
  prices: RollPrices = {},
): readonly [NewLeg, NewLeg] {
  const size = Math.abs(held.contracts);
  const short = held.contracts < 0;
  const base = { underlying: held.underlying, optionType: held.type, contracts: size };
  return [
    {
      ...base,
      strike: held.strike,
      expiration: held.expiration,
      action: short ? "buy" : "sell",
      ...(prices.close !== undefined ? { limitPrice: prices.close } : {}),
    },
    {
      ...base,
      strike: target.strike,
      expiration: target.expiration,
      action: short ? "sell" : "buy",
      ...(prices.open !== undefined ? { limitPrice: prices.open } : {}),
    },
  ];
}

/** Which quoted price each leg should take to cross the spread honestly: a short is bought back
 *  at the ask and re-sold at the bid; a long is sold at the bid and re-bought at the ask. */
export function rollPriceSides(short: boolean): { close: "bid" | "ask"; open: "bid" | "ask" } {
  return short ? { close: "ask", open: "bid" } : { close: "bid", open: "ask" };
}
