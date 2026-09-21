import type { IncomingMessage, ServerResponse } from "node:http";
import { parseOccSymbol } from "../trading/option-symbols.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { optionPositionsView } from "./option-positions-view.js";
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
 */
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
  const desk = config.hub.getState().participants.find((p) => p.id === id);
  if (!desk) {
    sendJson(res, 404, { error: "no such account" });
    return true;
  }
  const held = desk.positions.filter((p) => parseOccSymbol(p.symbol) !== undefined);
  const client = config.optionsClientFor?.(id);
  if (!client) {
    sendJson(res, 200, { available: false, reason: "unlinked", rows: [], book: undefined });
    return true;
  }
  const underlyings = [
    ...new Set(held.map((p) => parseOccSymbol(p.symbol)?.underlying ?? "")),
  ].filter((u) => u !== "");
  const [snapshots, spotList] = await Promise.all([
    client.getContractSnapshots(held.map((p) => p.symbol)),
    Promise.all(underlyings.map(async (u) => [u, await client.getUnderlyingPrice(u)] as const)),
  ]);
  const spots = new Map<string, number>();
  for (const [u, spot] of spotList) if (spot !== undefined) spots.set(u, spot);
  const view = optionPositionsView(held, snapshots, spots, config.now?.() ?? new Date());
  sendJson(res, 200, { available: true, asOf: new Date().toISOString(), ...view });
  return true;
}
