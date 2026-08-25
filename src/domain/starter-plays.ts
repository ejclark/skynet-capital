/**
 * THE STARTER PLAYS — three pre-filled first trades the Trade view leads with (consolidation
 * study, 2026-08-25). Each is a plain link that pre-fills the stock-buy ticket (course 101,
 * market order, day) with a symbol and size a first-timer can reason about; nothing fires
 * without the review screen, same as every other order.
 *
 * Addressed by their own `?starter=` param — NEVER by `?play=`, whose codes are the desk's
 * course catalog in `trade-types.ts` (Eric's call, 2026-08-25: a new disjoint param, so every
 * existing academy `?play=` link keeps working untouched).
 */

export interface StarterPlay {
  /** URL token — `/trade?starter=<id>`. */
  readonly id: "spy100" | "qqq25" | "aapl50";
  /** The chip's lead line, e.g. "Your first stock". */
  readonly title: string;
  /** The chip's size-and-symbol tail, e.g. "100 SPY". */
  readonly detail: string;
  readonly symbol: string;
  readonly qty: number;
}

export const STARTER_PLAYS: readonly StarterPlay[] = [
  { id: "spy100", title: "Your first stock", detail: "100 SPY", symbol: "SPY", qty: 100 },
  { id: "qqq25", title: "A slice of the index", detail: "25 QQQ", symbol: "QQQ", qty: 25 },
  { id: "aapl50", title: "A name you know", detail: "50 AAPL", symbol: "AAPL", qty: 50 },
];

export function starterPlayById(raw: string | null | undefined): StarterPlay | undefined {
  return STARTER_PLAYS.find((p) => p.id === raw);
}
