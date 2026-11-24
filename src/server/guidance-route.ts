import type { ServerResponse } from "node:http";
import { EdgarFilings } from "../adapters/edgar-filings.js";
import type { AlpacaOptionsClient } from "../alpaca/alpaca-options-client.js";
import { daysBetween, etDateOf } from "../options/position-guidance-rules.js";
import type { GuidanceMarket } from "../options/position-guidance-types.js";
import { daysToExpiryFrom } from "../options/single-leg-odds.js";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { toGuidanceQuote } from "./guidance-market.js";
import {
  chainFor,
  type GuidanceMarketClients,
  type GuidanceMarketMiss,
  readGuidanceMarket,
} from "./guidance-market-read.js";
import { sendJson } from "./page-shell.js";

/**
 * GET /api/trade/guidance — the MARKET half of position guidance over live data (#3729).
 *
 * `?symbol=CRWV[&refresh=1]` → `{ market }` (a `GuidanceMarket`).
 *
 * The member's stake — shares, cost basis, cash — never comes here: the browser runs
 * `positionGuidance({ ...market, stake })` itself (the app already runs `src/` code client-side), so
 * a real-portfolio number never lands in a URL or a server log. One market read also serves every
 * stake, which is what makes the coalesce below safe to share.
 *
 * Every market input is fetched LIVE per request through the member's own connected account, then
 * pulse-checked against its source's own timestamps — the read itself is `guidance-market-read.ts`,
 * which takes its clients as inputs so a bot can build the same market on its own keys (#3798
 * slice 1). The one sharing is a 15-second coalesce of identical in-flight reads (a double-tap costs
 * one Alpaca pull, not two); `refresh=1` bypasses it.
 */

const COALESCE_MS = 15_000;

/** What the route reads besides the member's broker — injectable so specs run offline and on a fixed clock. */
export interface GuidanceDeps {
  readonly edgar: Pick<EdgarFilings, "eightKs">;
  readonly now: () => string;
}
const LIVE: GuidanceDeps = { edgar: new EdgarFilings(), now: () => new Date().toISOString() };

interface MarketRead {
  readonly at: number;
  readonly inputs: Promise<GuidanceMarket | GuidanceMarketMiss>;
}
const inflight = new Map<string, MarketRead>();

/** At most this many extra expiries a staging read pages: the ones nearest the window's target. */
const WINDOW_PAGES = 3;

/**
 * THE STAGING WINDOW'S CHAIN (#7547; Eric, 2026-11-13: "Stage a trade for nvda" came back empty
 * four days before NVDA's print). The guidance read prices only expiries BEFORE the print, which
 * is right for its own advice and wrong for a staging ask: a bought call or put is meant to span
 * the print (`trade-suggestions.ts` → `earnings`), and the engine filters a sale's window itself.
 * So the staging path pages the strategy's own DTE window — the few expiries nearest its target,
 * one side only — onto a copy of the read. The coalesced read is never mutated.
 */
export async function withWindowChain(
  client: AlpacaOptionsClient,
  market: GuidanceMarket,
  window: { readonly min: number; readonly max: number; readonly target: number },
  type: "call" | "put",
): Promise<GuidanceMarket> {
  const today = etDateOf(market.now);
  const have = new Set(market.chain.filter((q) => q.type === type).map((q) => q.expiration));
  const want = (market.expirations ?? [])
    .filter((e) => {
      const dte = daysBetween(today, e);
      return dte >= window.min && dte <= window.max && !have.has(e);
    })
    .sort(
      (a, b) =>
        Math.abs(daysBetween(today, a) - window.target) -
        Math.abs(daysBetween(today, b) - window.target),
    )
    .slice(0, WINDOW_PAGES);
  if (want.length === 0) return market;
  const pages = await Promise.all(
    want.map(async (expiration) => ({
      expiration,
      rows: await chainFor(client, market.symbol, expiration, type),
    })),
  );
  const days = (e: string) =>
    daysToExpiryFrom(e, new Date(market.now)) ?? Math.max(1, daysBetween(today, e));
  const added = pages.flatMap(({ expiration, rows }) =>
    rows.map((row) => toGuidanceQuote(row, expiration, type, market.spot, days(expiration))),
  );
  return { ...market, chain: [...market.chain, ...added] };
}

/**
 * The member's clients, handed to the shared read. Async on purpose: a `tradingClientFor` that
 * throws becomes a rejected read (forgotten, then "failed" in words), never a synchronous throw past
 * a caller's `.catch` — the quests route and the staging path both lean on that.
 */
async function memberRead(
  client: AlpacaOptionsClient,
  config: DashboardServerConfig,
  requesterId: string,
  symbol: string,
  deps: GuidanceDeps,
  refresh: boolean,
): Promise<GuidanceMarket | GuidanceMarketMiss> {
  const clients: GuidanceMarketClients = {
    options: client,
    edgar: deps.edgar,
    now: () => deps.now(),
    ...(config.ivHistory ? { ivHistory: config.ivHistory } : {}),
    ...(config.spotChecks ? { spotChecks: config.spotChecks } : {}),
  };
  const trading = config.tradingClientFor?.(requesterId);
  return await readGuidanceMarket(trading ? { ...clients, trading } : clients, symbol, refresh);
}

/**
 * One symbol's market read through `requesterId`'s own account, coalesced: identical reads inside
 * 15 seconds share one pull, and `refresh` forces a new one. The guidance route and the quests route
 * (#7028) both read through here, so a member opening both pays for one read. A read that throws is
 * forgotten at once, so the next ask tries again.
 */
export function guidanceMarketFor(
  client: AlpacaOptionsClient,
  config: DashboardServerConfig,
  requesterId: string,
  symbol: string,
  deps: GuidanceDeps = LIVE,
  refresh = false,
): MarketRead["inputs"] {
  const key = `${requesterId}:${symbol}`;
  const cached = inflight.get(key);
  if (cached && Date.now() - cached.at < COALESCE_MS && !refresh) return cached.inputs;
  for (const [k, v] of inflight) if (Date.now() - v.at >= COALESCE_MS) inflight.delete(k);
  const inputs = memberRead(client, config, requesterId, symbol, deps, refresh);
  const read: MarketRead = { at: Date.now(), inputs };
  inflight.set(key, read);
  inputs.catch(() => {
    if (inflight.get(key) === read) inflight.delete(key);
  });
  return inputs;
}

export async function serveGuidance(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
  deps: GuidanceDeps = LIVE,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  if (!UNDERLYING_PATTERN.test(symbol)) {
    sendJson(res, 400, { error: "guidance wants ?symbol=<underlying>" });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!(client && requesterId)) {
    sendJson(res, 200, {
      reason: "unlinked",
      note: "The guidance reads live quotes through your own connected account, and your session isn't linked to one yet.",
    });
    return;
  }
  // The stake never reaches the server, not even as a coarse fact: shares, basis and cash stay in
  // the member's browser, where the engine applies them to this market read. Both sides are always
  // priced — a "calls only" flag would itself say "holds 100+ shares, no cash" — and one read then
  // serves every stake, so changing the stake never re-fetches.
  const refresh = params.get("refresh") === "1";
  try {
    const market = await guidanceMarketFor(client, config, requesterId, symbol, deps, refresh);
    if ("reason" in market) {
      sendJson(res, 200, market);
      return;
    }
    sendJson(res, 200, { market });
  } catch {
    // A fixed sentence, never the exception text — a raw error can carry internals (desk-gate.ts).
    sendJson(res, 200, {
      reason: "failed",
      note: "Couldn't build the guidance right now — try again shortly.",
    });
  }
}
