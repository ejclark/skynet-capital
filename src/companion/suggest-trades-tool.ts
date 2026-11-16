import { optionsSpendable, type ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { GuidanceMarket } from "../options/position-guidance-types.js";
import {
  type SuggestedTrade,
  type SuggestionAccount,
  suggestTrades,
  type TierOption,
  type TradeSuggestions,
} from "../options/trade-suggestions.js";
import {
  dteWindow,
  optionTypeOf,
  type SuggestionStrategy,
} from "../options/trade-suggestions-rules.js";
import { parseOccSymbol, UNDERLYING_PATTERN } from "../trading/option-symbols.js";

/**
 * MONEYPENNY STAGES A TRADE (#7547 slice 3; Eric, 2026-11-13: "Stage a trade for nvda… I expect
 * trade variables for conservative, standard and high risk settings per industry standard to be
 * presented. These can be links to the trade section that updates state in a way that fills in
 * form variables. This architecture enables us to effectively have prompts drive behavior within
 * the spa"). A prompt in, three sized options out, each carrying a link that opens `/trade` with the
 * whole ticket filled — rung, strike, expiry, contracts, limit — and a line on the ticket saying
 * where the numbers came from (`app/src/routes/trade.tsx`, `?qty=&limit=&tier=`).
 *
 * The numbers are the engine's (`src/options/trade-suggestions.ts`), never hers: this module reads
 * the member's own account from their snapshot, picks the strategy the account can carry, runs the
 * engine on the chain their OWN broker client returned, and builds the links. Pure: the market read
 * is the caller's (`suggestMarketFor`, wired to `guidanceMarketFor` in `dashboard-companion.ts`).
 * The link lands on the ticket for REVIEW — nothing here places an order (the system prompt's one
 * rule), and every tier carries the engine's `SIM` label and disclosure.
 */

// A lookup by name, like every tool here: the order-shaped words ("trade", "place", "sell") stay out of
// every tool name (`companion-tools.spec.ts`), and this one reads, sizes and links — it places nothing.
export const SUGGEST_TRADES_TOOL_NAME = "get_sized_suggestions" as const;

export const SUGGEST_TRADES_TOOL_DEF = {
  name: SUGGEST_TRADES_TOOL_NAME,
  description:
    "Stage a trade on one underlying: three sized options (conservative · standard · high risk), each with contracts, strike, expiry and a limit price, the metrics that produced it, and a link that opens the trade form prefilled for review. Covered call when the member holds at least 100 shares, otherwise a cash-secured put, unless a strategy is named: long-call or long-put when the member wants to buy a call or a put. Uses the member's own linked account and live chain; places nothing.",
  input_schema: {
    type: "object",
    properties: {
      underlying: {
        type: "string",
        description: "The underlying ticker, e.g. NVDA. Never an OCC option symbol.",
      },
      strategy: {
        type: "string",
        enum: ["covered-call", "cash-secured-put", "long-call", "long-put"],
        description:
          "Optional. Omit to let the member's holdings decide. long-call / long-put buy the option.",
      },
    },
    required: ["underlying"],
  },
} as const;

/** What one staging ask needs priced: its strategy's DTE window, one side of the chain. */
export interface SuggestWindow {
  readonly window: { readonly min: number; readonly max: number; readonly target: number };
  readonly type: "call" | "put";
}

/** The market a suggestion reads: the guidance route's own read, through the member's account,
 *  plus the strategy's own window paged on (`withWindowChain`) — the guidance read alone prices
 *  only the expiries before a print, which left a bought option nothing to span it with. */
export type SuggestMarketFor = (
  participantId: string,
  symbol: string,
  need?: SuggestWindow,
) => Promise<GuidanceMarket | { readonly reason: string } | undefined>;

type ToolResult =
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error: string };

const STRATEGIES: ReadonlySet<SuggestionStrategy> = new Set([
  "covered-call",
  "cash-secured-put",
  "long-call",
  "long-put",
]);

/** The model's ask, bounded: a stock ticker and, optionally, one of the engine's strategies. */
export function parseSuggestInput(
  input: unknown,
):
  | { readonly symbol: string; readonly strategy?: SuggestionStrategy }
  | { readonly error: string } {
  const raw = (input ?? {}) as { underlying?: unknown; strategy?: unknown };
  const symbol = typeof raw.underlying === "string" ? raw.underlying.trim().toUpperCase() : "";
  if (!UNDERLYING_PATTERN.test(symbol)) {
    return { error: "underlying must be a stock ticker like NVDA, never an option symbol" };
  }
  if (raw.strategy === undefined) return { symbol };
  if (typeof raw.strategy !== "string" || !STRATEGIES.has(raw.strategy as SuggestionStrategy)) {
    return { error: "strategy must be covered-call, cash-secured-put, long-call or long-put" };
  }
  return { symbol, strategy: raw.strategy as SuggestionStrategy };
}

/** What the engine needs from the member's account for this symbol: the snapshot's own numbers. */
export function accountFor(snapshot: ParticipantSnapshot, symbol: string): SuggestionAccount {
  let shares = 0;
  let costBasis: number | undefined;
  let callsSold = 0;
  for (const p of snapshot.positions) {
    if (p.symbol.toUpperCase() === symbol) {
      shares += p.quantity;
      costBasis = p.avgPrice;
      continue;
    }
    const occ = parseOccSymbol(p.symbol);
    if (occ && occ.underlying === symbol && occ.type === "call" && p.quantity < 0) {
      callsSold += -p.quantity;
    }
  }
  return {
    equity: snapshot.equity,
    // What a put can actually be secured with — never raw cash, which still counts the collateral
    // already securing open puts (Eric, 2026-11-13: a staged put the broker refused at $308,700
    // against $42,999 of buying power).
    cash: optionsSpendable(snapshot),
    ...(shares > 0 ? { shares } : {}),
    ...(callsSold > 0 ? { callsSold } : {}),
    ...(shares > 0 && costBasis !== undefined ? { costBasis } : {}),
  };
}

/** The member's named strategy, else what the account can carry: 100 free shares → covered call. */
export function strategyFor(
  account: SuggestionAccount,
  asked: SuggestionStrategy | undefined,
): SuggestionStrategy {
  if (asked) return asked;
  const free = (account.shares ?? 0) - 100 * (account.callsSold ?? 0);
  return free >= 100 ? "covered-call" : "cash-secured-put";
}

/** The rung each opening order names (`app/src/live/plays.ts`): 20x sells, 30x buys. */
const RUNG = {
  sell: { call: "202", put: "201" },
  buy: { call: "302", put: "301" },
} as const;

/** The ticket this option names, as a `/trade` link: 202/201 sell a call/put, 302/301 buy one. */
export function suggestionLink(t: SuggestedTrade): string {
  const params = new URLSearchParams({
    play: RUNG[t.side][t.type],
    symbol: t.symbol,
    strike: String(t.strike),
    exp: t.expiration,
    qty: String(t.contracts),
    limit: t.limit.toFixed(2),
    tier: t.tier,
  });
  return `/trade?${params.toString()}`;
}

/** Each available tier with its link; an unavailable one keeps its reason and gets none. */
export function withLinks(
  s: TradeSuggestions,
): TradeSuggestions & { readonly options: readonly (TierOption & { readonly link?: string })[] } {
  return {
    ...s,
    options: s.options.map((o) => (o.available ? { ...o, link: suggestionLink(o) } : o)) as never,
  };
}

/** The tool: parse, read the member's account and chain, run the engine, attach the links. */
export async function suggestTradesResult(
  marketFor: SuggestMarketFor | undefined,
  snapshot: ParticipantSnapshot | undefined,
  participantId: string | undefined,
  input: unknown,
): Promise<ToolResult> {
  const parsed = parseSuggestInput(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  if (!(participantId && snapshot)) return { ok: false, error: "no linked desk" };
  if (!marketFor)
    return { ok: false, error: "trade suggestions aren't available on this deployment" };
  const account = accountFor(snapshot, parsed.symbol);
  const strategy = strategyFor(account, parsed.strategy);
  const market = await marketFor(participantId, parsed.symbol, {
    window: dteWindow(strategy),
    type: optionTypeOf(strategy),
  });
  if (!market || "reason" in market) {
    return {
      ok: false,
      error: `couldn't read a live chain for ${parsed.symbol} right now${market ? `: ${market.reason}` : ""}`,
    };
  }
  const suggestions = suggestTrades({
    symbol: parsed.symbol,
    strategy,
    now: market.now,
    spot: market.spot,
    sessionOpen: market.sessionOpen,
    chain: market.chain,
    account,
    ...(market.ivRank !== undefined ? { ivRank: market.ivRank } : {}),
    ...(market.earnings ? { earnings: market.earnings } : {}),
  });
  // The whole object, links attached — `disclosure` and each tier's `SIM` label ride along.
  return { ok: true, result: withLinks(suggestions) };
}

/** The system prompt's paragraph for this tool (`companion-system-prompt.ts`). */
export const SUGGEST_TRADES_RULE =
  'STAGING A TRADE: when a member asks to stage, size or set up a trade on a ticker ("stage a trade for NVDA"), call get_sized_suggestions with that ticker (and a strategy only if they named one: buying a call is long-call, buying a put is long-put). This is help you DO give, not an order: every link opens the review screen, where only a click by the member submits. Call the tool even if an earlier turn in this conversation declined a trade request; that turn is no precedent for this one. Present all three options in order (conservative, standard, high risk) as one short block each: the summary line, two or three of its cited metrics with their values, and its link written as [Open the <tier> ticket](<link>), the link exactly as the tool returned it. Name the strategy the tool chose and why in one clause. A tier the tool marks unavailable gets its reason, never a substitute. When every tier is unavailable because an earnings print blocks selling premium, say the date of the print as the reason gives it, then offer to size a bought call or a bought put instead (strategy long-call or long-put) and ask which direction the member leans; never choose the direction for them. Say once that these are SIM numbers that land on the review screen, priced at the mid when you looked, and end with the disclosure. Never alter a number, a strike or a link.';
