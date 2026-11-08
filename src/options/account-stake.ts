import { parseOccSymbol } from "../trading/option-symbols.js";
import type { GuidanceStake, HeldLongOption, OpenCall } from "./position-guidance-types.js";

/**
 * A member's stake in one symbol, read from their own account's positions (#7028 slice 1) — the
 * server-side twin of the Guidance tab's starting stake (`app/src/live/guidance.ts`: `heldStake`,
 * `openCallsOf`, `longCallsOf`), for the quests read that judges every position at once.
 *
 * Account facts only: shares and their average cost, calls sold, calls held, each contract's live
 * quote. A stake the member typed into the Guidance tab (goal, cash, a what-if basis) stays in their
 * browser and never reaches here, so a quest judges the account as it stands. The broker reports an
 * option's average price PER CONTRACT (`broker-positions.ts` scales it), so a share's is ÷ 100.
 * PURE: no I/O.
 */

/** One broker position: signed quantity (a sold contract is negative), average price as stored. */
interface AccountPosition {
  readonly symbol: string;
  readonly quantity: number;
  readonly avgPrice: number;
}

/** A contract's live quote, per share. */
interface ContractQuote {
  readonly bid?: number;
  readonly ask?: number;
}

const quoteOf = (q: ContractQuote | undefined) => ({
  ...(q?.bid !== undefined ? { bid: q.bid } : {}),
  ...(q?.ask !== undefined ? { ask: q.ask } : {}),
});

export function accountStake(
  positions: readonly AccountPosition[],
  symbol: string,
  quotes: ReadonlyMap<string, ContractQuote>,
  carried: ReadonlySet<string> = new Set(),
): GuidanceStake {
  const stock = positions.find((p) => p.symbol === symbol);
  const shares = stock ? Math.floor(stock.quantity) : 0;
  const openCalls: OpenCall[] = [];
  const heldCalls: HeldLongOption[] = [];
  for (const p of positions) {
    const parts = parseOccSymbol(p.symbol);
    if (!(parts?.underlying === symbol && parts.type === "call")) continue;
    const perShare = p.avgPrice / 100;
    if (!(perShare > 0)) continue;
    if (p.quantity < 0) {
      openCalls.push({
        occ: p.symbol,
        strike: parts.strike,
        expiration: parts.expiration,
        contracts: -p.quantity,
        premium: perShare,
        ...quoteOf(quotes.get(p.symbol)),
      });
    } else if (p.quantity > 0) {
      heldCalls.push({
        type: "call",
        strike: parts.strike,
        expiration: parts.expiration,
        contracts: Math.floor(p.quantity),
        costPerContract: perShare,
        ...quoteOf(quotes.get(p.symbol)),
        ...(carried.has(p.symbol) ? { planCarried: true as const } : {}),
      });
    }
  }
  const callsSold = openCalls.reduce((n, c) => n + c.contracts, 0);
  return {
    ...(shares > 0 ? { shares } : {}),
    ...(shares > 0 && stock && stock.avgPrice > 0 ? { costBasis: stock.avgPrice } : {}),
    ...(callsSold > 0 ? { callsSold, openCalls } : {}),
    ...(heldCalls.length > 0 ? { heldCalls } : {}),
  };
}
