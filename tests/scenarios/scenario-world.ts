import { plainPosition } from "../../src/observatory/position-plain.js";

/**
 * Shared fixtures for the market scenarios (`docs/members/scenarios.md`). A scenario is a real
 * situation a member brings to the app — a pullback, a winner with no exit plan — run through the
 * pure decision engines, so its acceptance lines hold without a live quote (the journeys' crawl
 * cannot reach guidance offline; eric j2 s2).
 *
 * The guidance world is `tests/options/position-guidance-fixture.ts` (CRWV-shaped, spot $80, Fri
 * 2026-09-25). The book world below is the day Eric wrote the scenarios down, 2026-10-18.
 */

export const BOOK_NOW = new Date("2026-10-18T19:00:00Z");

/** One broker position as `decisionsFor` reads it. Option premiums are per contract (×100). */
export function held(symbol: string, quantity: number, avgPrice: number, marketValue: number) {
  const p = { symbol, quantity, avgPrice, marketValue };
  return { ...p, plain: plainPosition(p, BOOK_NOW) };
}
