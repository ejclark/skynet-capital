import type { ServerResponse } from "node:http";
import { assembleChain } from "../adapters/alpaca-recommend-chain.js";
import type { Outlook, OutlookDirection, OutlookMagnitude } from "../options/outlook.js";
import { rankStructures } from "../options/recommend.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/**
 * THE OUTLOOK ROUTE (#3407, slice 4) — state a view, get back the ranked ways this chain can
 * express it. `GET /api/trade/structures?symbol=NVDA&direction=bullish&magnitude=moderate&horizon=30`.
 *
 * Every piece under this has existed and been specced since the recommender landed
 * (`options/recommend.ts` ranks, `adapters/alpaca-recommend-chain.ts` assembles); the only consumer
 * was the companion's `rankFor` tool, so a member could reach it by ASKING but never by picking.
 * This is the missing seam, and it is deliberately thin: parse, assemble, rank, send. No judgment
 * of its own — a rendering that disagreed with the engine would be a second opinion nobody specced.
 *
 * Identity: the REQUESTER'S OWN options client and no other, same doctrine as `quote-route.ts` and
 * `option-chain-route.ts`. Enrichment, never the order path — an unlinked session, a name the broker
 * won't list, or a chain with not one solvable IV all degrade to an honest one-line `note`, so the
 * pane says what is missing rather than throwing.
 *
 * THE CALL BUDGET, STATED (the plan's own criterion for the chain work): one spot read, one
 * expirations read, then calls × puts for each expiration assembled — `2 + 2 × pages`, and `pages`
 * is capped at `MAX_PAGES`, so a load never exceeds 22 broker calls however long a horizon is
 * asked for. The horizon drives `pages` because `structure-candidates.ts` needs a listed expiry AT
 * OR AFTER the horizon: asking for six expirations and then reporting `no-expiry-at-horizon` on a
 * 45-day view would be our own page size masquerading as a fact about the listing.
 */

const DIRECTIONS: readonly OutlookDirection[] = ["bullish", "bearish", "neutral"];
const MAGNITUDES: readonly OutlookMagnitude[] = ["slight", "moderate", "strong"];

/** The horizons the pane offers, in calendar days. A value outside this set is refused rather than
 *  clamped — a 400-day "horizon" silently served as 45 days would answer a view nobody stated. */
export const HORIZON_DAYS: readonly number[] = [7, 14, 30, 45];

/** Expiration pages, floored so a one-week view still sees a spread's choices and ceilinged so the
 *  call budget above is a real ceiling rather than a typical case. */
const MIN_PAGES = 4;
const MAX_PAGES = 10;

/** How many expirations to assemble for a horizon: enough listed expiries to reach past it, plus
 *  two so a candidate is choosing an expiry rather than taking the only one that qualifies. */
export function pagesForHorizon(horizonDays: number): number {
  const weeks = Math.ceil(horizonDays / 7);
  return Math.min(MAX_PAGES, Math.max(MIN_PAGES, weeks + 2));
}

/** The view a query string states, or `undefined` when it doesn't state one this engine accepts. */
export function parseOutlook(params: URLSearchParams): Outlook | undefined {
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  if (!UNDERLYING_PATTERN.test(symbol)) return undefined;
  const direction = params.get("direction") ?? "";
  const magnitude = params.get("magnitude") ?? "";
  const horizonDays = Number(params.get("horizon") ?? "");
  if (!DIRECTIONS.includes(direction as OutlookDirection)) return undefined;
  if (!MAGNITUDES.includes(magnitude as OutlookMagnitude)) return undefined;
  if (!HORIZON_DAYS.includes(horizonDays)) return undefined;
  return {
    symbol,
    direction: direction as OutlookDirection,
    magnitude: magnitude as OutlookMagnitude,
    horizonDays,
  };
}

export async function serveStructures(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  const outlook = parseOutlook(new URL(url, "http://localhost").searchParams);
  if (!outlook) {
    sendJson(res, 400, {
      error:
        "the outlook wants ?symbol=<ticker>&direction=bullish|bearish|neutral" +
        `&magnitude=slight|moderate|strong&horizon=${HORIZON_DAYS.join("|")}`,
    });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!client) {
    sendJson(res, 200, {
      note: "Structures are built from your own connected account's chain, and your session isn't linked to one yet.",
    });
    return;
  }
  const now = config.now?.() ?? new Date();
  const today = now.toISOString().slice(0, 10);
  try {
    const assembled = await assembleChain(
      client,
      outlook.symbol,
      today,
      pagesForHorizon(outlook.horizonDays),
    );
    if (!assembled) {
      // `assembleChain` is fail-soft and does not say WHICH of its three causes fired (no spot, a
      // broker that refused or threw, or not one contract whose premium solved to an IV) — it
      // swallows the throw itself, so this route's own catch below never sees a 429 raised inside
      // the assembly. So the note names the possibilities and asserts none of them: telling a
      // member their chain has no solvable implied volatility when the broker simply rate-limited us
      // would be a false claim about the listing, which outranks a tidier sentence.
      sendJson(res, 200, {
        note: `We couldn't build a chain for ${outlook.symbol} that can be marked honestly right now — the broker may not have answered, or no contract's premium solved to an implied volatility.`,
      });
      return;
    }
    sendJson(res, 200, {
      asOf: now.toISOString(),
      spot: assembled.spot,
      recommendation: rankStructures(
        outlook,
        { spot: assembled.spot, volatility: assembled.volatility },
        assembled.chain,
      ),
    });
  } catch {
    sendJson(res, 200, { note: "Couldn't read the chain for that view right now." });
  }
}
