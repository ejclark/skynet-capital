import type { LadderRow } from "../../../src/options/position-guidance-types";
import type { PlayInfo } from "../live/options";
import type { TradeSection } from "./trade-bench";

/**
 * THE TRADE ROUTE'S SEARCH-PARAM REDUCERS — each takes the previous `/trade` search and returns the
 * next, so the shape of a `?symbol=`/`?strike=`/`?exp=` write is readable on its own, away from the
 * route's hooks (`routes/trade.tsx` wires them into `navigate({ search })`). Pure: no router, no
 * state — the route keeps every `replace`/`resetScroll` choice and its guard against the current
 * value, because those are about the navigation, not the shape of the params.
 */

/** The `/trade` search as `validateSearch` produces it — every param optional and typed. */
export interface TradeSearch {
  desk?: string;
  play?: PlayInfo["code"];
  symbol?: string;
  strike?: string;
  exp?: string;
  manage?: string;
  rollTo?: string;
  section?: TradeSection;
}

/** The ticket a guidance strike presets: covered call → rung 202, put → 201, strike + expiry
 *  together, and the section back to the ticket so the member lands on the preset form. */
export function guidanceSearch<T extends { section?: TradeSection }>(prev: T, row: LadderRow) {
  const next = {
    ...prev,
    play: (row.lever === "covered-calls" ? "202" : "201") as PlayInfo["code"],
    strike: String(row.strike),
    exp: row.expiration,
  };
  delete next.section;
  return next;
}

/** Writes `?symbol=` (or drops it when empty). A new symbol also drops any `?strike=` already in
 *  the URL — a strike picked against the OLD underlying's chain is meaningless once the symbol
 *  changes; guarded on `prev.strike` actually being present so the search object isn't churned on
 *  every symbol edit for nothing. `leaveSection` also drops `?section=` (a Watchlist pick). */
export function symbolSearch(
  prev: TradeSearch,
  symbol: string | undefined,
  leaveSection = false,
): TradeSearch {
  const next = { ...prev };
  if (symbol) next.symbol = symbol;
  else delete next.symbol;
  if (prev.strike !== undefined) delete next.strike;
  if (leaveSection) delete next.section;
  return next;
}

/** Writes `?strike=` (or drops it when empty/invalid). */
export function strikeSearch(prev: TradeSearch, strike: string | undefined): TradeSearch {
  const next = { ...prev };
  if (strike) next.strike = strike;
  else delete next.strike;
  return next;
}

/** Writes `?exp=` (or drops it when empty/invalid). */
export function expSearch(prev: TradeSearch, exp: string | undefined): TradeSearch {
  const next = { ...prev };
  if (exp) next.exp = exp;
  else delete next.exp;
  return next;
}

/** A chain tap's URL: the expiration travels with the strike (slice 4a — a 180 tapped on the
 *  Oct 16 chain is the Oct 16 180, not whichever expiry the ticket happened to be on), the section
 *  goes back to the ticket, and the rung moves only when the tap names an unlocked one. */
export function chainTapSearch(
  prev: TradeSearch,
  strike: string,
  exp: string,
  play: PlayInfo["code"] | undefined,
): TradeSearch {
  const next = { ...prev, strike, exp };
  delete next.section;
  return play ? { ...next, play } : next;
}
