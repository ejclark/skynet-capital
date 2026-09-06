/**
 * THE TICKET'S OWN NAVIGATION, AS ARITHMETIC (#1461, slice 2). The play code used to do two jobs
 * — curriculum position AND "which ticket renders". This file is the seam that splits them: a
 * ticket state (instrument · side · put/call) maps to a play code and back, so `?play=` can
 * PRESET the ticket and the ticket's own controls can move the rail — two views of one state,
 * neither owning the other (Eric, 2026-09-05: "a pre-configured preset that assists the user,
 * but doesn't drive").
 */

export type PlayCode = "101" | "102" | "201" | "202" | "301" | "302" | "401";

export interface TicketNavState {
  readonly instrument: "stock" | "option" | "spread";
  readonly side: "buy" | "sell";
  /** Meaningful for options only; every other state carries the default so a switch to Option lands on a rung. */
  readonly optionType: "call" | "put";
}

const NAV: Record<PlayCode, TicketNavState> = {
  "101": { instrument: "stock", side: "buy", optionType: "put" },
  "102": { instrument: "stock", side: "sell", optionType: "put" },
  "201": { instrument: "option", side: "sell", optionType: "put" },
  "202": { instrument: "option", side: "sell", optionType: "call" },
  "301": { instrument: "option", side: "buy", optionType: "put" },
  "302": { instrument: "option", side: "buy", optionType: "call" },
  // Side/type are unused for a spread — the builder's own leg form carries buy/sell/put/call per
  // leg — but every PlayCode needs a full TicketNavState to round-trip through `playForNav`.
  "401": { instrument: "spread", side: "buy", optionType: "put" },
};

export const PLAY_CODES: readonly PlayCode[] = ["101", "102", "201", "202", "301", "302", "401"];

export function isPlayCode(value: string): value is PlayCode {
  return (PLAY_CODES as readonly string[]).includes(value);
}

/** The ticket state a play presets. An unknown code lands on the first rung, never on nothing. */
export function navForPlay(code: string): TicketNavState {
  return isPlayCode(code) ? NAV[code] : NAV["101"];
}

/** The rung a ticket state IS — the same table read the other way. */
export function playForNav(nav: TicketNavState): PlayCode {
  if (nav.instrument === "stock") return nav.side === "buy" ? "101" : "102";
  if (nav.instrument === "spread") return "401";
  if (nav.side === "sell") return nav.optionType === "put" ? "201" : "202";
  return nav.optionType === "put" ? "301" : "302";
}
