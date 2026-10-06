import type { IncomingMessage, ServerResponse } from "node:http";
import type { Bar } from "../alpaca/alpaca-options-client.js";
import { BETA_LOOKBACK_DAYS, betaFromCloses } from "../options/beta.js";
import type { UnderlyingBeta } from "../options/greeks-aggregator.js";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { BENCHMARK, type BetaInputs, optionPositionsView } from "./option-positions-view.js";
import { requireGet, sendJson } from "./page-shell.js";

/**
 * GET /api/trade/option-positions?participantId=…  (#3407 P2 slice 3)
 *
 * The desk's held option contracts with strike / expiry / days / in-the-money / greeks, and the
 * book's netted greeks with coverage — `option-positions-view.ts` over the hub's positions, one
 * contract-snapshot read for every held contract and one last-trade read per underlying, through
 * the REQUESTER'S OWN options client (the same read posture as the chain route). Identity is the
 * session's: the target must be in the owned set, or it does not exist for this caller. Fails
 * soft: no client → `unlinked`; a feed failure → rows without greeks, the book naming them.
 * Beta-weighting (#4327): a year of daily closes per underlying and for SPY, through the same
 * client, fitted by `beta.ts`; a name that can't be fitted stays un-weighted and named.
 */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Measured betas by `SYMBOL|end-day`: a beta fitted on a year of closes does not change within a
 *  day, so each name costs one bars read per day, not one per poll. Public market data, so one
 *  cache serves every member. `undefined` is cached too — a name too new to fit stays un-weighted
 *  without re-asking every 30 seconds. */
const betaCache = new Map<string, UnderlyingBeta | undefined>();
const BETA_CACHE_MAX = 500;

type BarsClient = {
  getBars?: (
    symbol: string,
    start: string,
    end: string,
    limit?: number,
    adjustment?: "raw" | "split" | "all",
  ) => Promise<Bar[] | undefined>;
  getUnderlyingPrice: (symbol: string) => Promise<number | undefined>;
};

/** Betas for `underlyings` against SPY from a year of split- and dividend-adjusted daily closes,
 *  plus SPY's price. Fail-soft: any read that fails leaves that name un-weighted (the view names
 *  it) — never a guessed beta. */
async function loadBetas(
  client: BarsClient,
  underlyings: readonly string[],
  now: Date,
): Promise<BetaInputs> {
  const betas = new Map<string, UnderlyingBeta>();
  const getBars = client.getBars?.bind(client);
  const benchmarkPrice = await client.getUnderlyingPrice(BENCHMARK).catch(() => undefined);
  if (!getBars || underlyings.length === 0) {
    return { betas, ...(benchmarkPrice !== undefined ? { benchmarkPrice } : {}) };
  }
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now.getTime() - BETA_LOOKBACK_DAYS * DAY_MS).toISOString().slice(0, 10);
  const bars = (symbol: string) => getBars(symbol, start, end, 1000, "all").catch(() => undefined);
  const missing = underlyings.filter((u) => !betaCache.has(`${u}|${end}`));
  if (missing.length > 0) {
    const benchmarkBars = await bars(BENCHMARK);
    if (benchmarkBars) {
      await Promise.all(
        missing.map(async (u) => {
          const own = await bars(u);
          // A failed read is not cached: the next poll may reach the feed.
          if (!own) return;
          const measured = betaFromCloses(own, benchmarkBars);
          if (betaCache.size >= BETA_CACHE_MAX) betaCache.clear();
          betaCache.set(
            `${u}|${end}`,
            measured ? { beta: measured.beta, asOf: measured.asOf } : undefined,
          );
        }),
      );
    }
  }
  for (const u of underlyings) {
    const hit = betaCache.get(`${u}|${end}`);
    if (hit) betas.set(u, hit);
  }
  return { betas, ...(benchmarkPrice !== undefined ? { benchmarkPrice } : {}) };
}

/** Test seam: forget every cached beta. */
export function clearBetaCache(): void {
  betaCache.clear();
}

/** All this read needs — narrowed so a background pass (the delivery sweep, #3407 P4 slice 3) can
 *  call it with the pieces it holds instead of a whole server config. */
export type OptionPositionsDeps = Pick<DashboardServerConfig, "hub" | "optionsClientFor" | "now">;

/** The positions view for one owned account, or why there is none — shared with the alerts
 *  route so both read the same rows through the same client (#3407 P4 slice 1). */
export async function loadOptionPositions(
  id: string,
  config: OptionPositionsDeps,
): Promise<
  | { readonly kind: "missing" }
  | { readonly kind: "unlinked" }
  | { readonly kind: "ok"; readonly view: ReturnType<typeof optionPositionsView> }
> {
  const desk = config.hub.getState().participants.find((p) => p.id === id);
  if (!desk) return { kind: "missing" };
  const held = desk.positions.filter((p) => parseOccSymbol(p.symbol) !== undefined);
  const client = config.optionsClientFor?.(id);
  if (!client) return { kind: "unlinked" };
  const underlyings = [
    ...new Set(held.map((p) => parseOccSymbol(p.symbol)?.underlying ?? "")),
  ].filter((u) => u !== "");
  const now = config.now?.() ?? new Date();
  const [snapshots, spotList, betas] = await Promise.all([
    client.getContractSnapshots(held.map((p) => p.symbol)),
    Promise.all(underlyings.map(async (u) => [u, await client.getUnderlyingPrice(u)] as const)),
    loadBetas(client, underlyings, now),
  ]);
  const spots = new Map<string, number>();
  for (const [u, spot] of spotList) if (spot !== undefined) spots.set(u, spot);
  return {
    kind: "ok",
    view: optionPositionsView(held, snapshots, spots, now, betas),
  };
}

export async function serveOptionPositionsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== "/api/trade/option-positions") return false;
  if (!requireGet(req, res)) return true;
  const id = new URL(req.url ?? "/", "http://localhost").searchParams.get("participantId") ?? "";
  const owned = config.auth ? resolveOwnedIds(session, config) : [id];
  if (!(id && owned.includes(id))) {
    sendJson(res, 404, { error: "no such account" });
    return true;
  }
  const positions = await loadOptionPositions(id, config);
  if (positions.kind === "missing") {
    sendJson(res, 404, { error: "no such account" });
    return true;
  }
  if (positions.kind === "unlinked") {
    sendJson(res, 200, { available: false, reason: "unlinked", rows: [], book: undefined });
    return true;
  }
  sendJson(res, 200, { available: true, asOf: new Date().toISOString(), ...positions.view });
  return true;
}
