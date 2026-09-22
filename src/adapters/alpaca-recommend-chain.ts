import { type AlpacaOptionsClient, rowPremium } from "../alpaca/alpaca-options-client.js";
import { daysUntil } from "../domain/earnings-calendar.js";
import type { ChainContract } from "../options/outlook.js";
import { impliedVolatility } from "../options/pricing.js";

/**
 * THE RECOMMENDER'S CHAIN — assembles the multi-expiration, both-sides `ChainContract[]` that
 * `options/recommend.ts`'s `rankStructures` (and `structure-candidates.ts` under it) rank against,
 * out of an `AlpacaOptionsClient` that only ever answers one expiration × one type per call.
 *
 * Every premium comes off `rowPremium` (the same mid-else-last-close the chain route quotes) and
 * every per-contract IV is SOLVED here from that premium by `pricing.ts`'s `impliedVolatility` —
 * Alpaca's indicative snapshot feed carries greeks but no IV, so this is the only honest source.
 * A contract whose premium is absent, or whose premium sits outside the no-arbitrage band the
 * solver accepts, keeps `volatility: undefined` and is reported ABSENT downstream with that reason,
 * never priced off a substituted number.
 *
 * Read-only, and fail-soft like `alpaca-options-flow.ts` beside it: `undefined` when spot can't be
 * read, when the broker refuses the listing, or when NOT ONE contract in the whole assembly could
 * have its IV solved — because `UnderlyingContext.volatility` is required and there is no honest
 * value to hand back. Never a throw, never a fabricated volatility.
 */

/** The three read-only lookups this assembly needs — a real client satisfies it structurally. */
export type RecommendChainReader = Pick<
  AlpacaOptionsClient,
  "getUnderlyingPrice" | "getExpirations" | "getChain"
>;

export interface AssembledChain {
  readonly spot: number;
  /** Annualized volatility proxy for the underlying — the average of every contract's own solved
   *  IV across the assembled chain. This is NOT any one leg's IV (`ChainContract.volatility`
   *  stays per-contract); it's what `UnderlyingContext.volatility` needs to build the terminal
   *  distribution `expectedMove`/`outlookTarget` run on. */
  readonly volatility: number;
  readonly chain: readonly ChainContract[];
}

const KINDS = ["call", "put"] as const;

/**
 * Assemble calls + puts across the nearest `maxExpirations` listed expirations into one chain the
 * recommender can rank against. Fail-soft like every other adapter in this file's neighborhood:
 * `undefined` when spot can't be read, or when NOT ONE contract in the whole assembly could have
 * its IV solved (never a fabricated volatility) — never a throw.
 */
export async function assembleChain(
  client: RecommendChainReader,
  underlying: string,
  today: string, // YYYY-MM-DD
  maxExpirations = 6,
): Promise<AssembledChain | undefined> {
  try {
    const spot = await client.getUnderlyingPrice(underlying);
    if (spot === undefined) return undefined;
    const expirations = await client.getExpirations(underlying, today, maxExpirations);
    // Every expiration × side at once — this is already several network calls; chaining them
    // serially would only add latency to a turn the member is waiting on.
    const pages = await Promise.all(
      expirations.flatMap((expiration) =>
        KINDS.map(async (kind) => ({
          kind,
          expiration,
          daysToExpiry: daysUntil(today, expiration),
          rows: await client.getChain(underlying, expiration, kind),
        })),
      ),
    );
    const chain: ChainContract[] = pages.flatMap(({ kind, expiration, daysToExpiry, rows }) =>
      rows.map((row) => {
        const price = rowPremium(row);
        const volatility =
          price === undefined
            ? undefined
            : impliedVolatility({
                spot,
                strike: row.strike,
                daysToExpiry,
                type: kind,
                marketPrice: price,
              });
        return {
          kind,
          strike: row.strike,
          daysToExpiry,
          expiration,
          ...(price === undefined ? {} : { price }),
          ...(volatility === undefined ? {} : { volatility }),
        };
      }),
    );
    const solved = chain.flatMap((c) => (c.volatility === undefined ? [] : [c.volatility]));
    if (solved.length === 0) return undefined;
    const volatility = solved.reduce((sum, v) => sum + v, 0) / solved.length;
    return { spot, volatility, chain };
  } catch {
    return undefined;
  }
}
