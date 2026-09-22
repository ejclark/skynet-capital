import type { ServerResponse } from "node:http";
import { assetSearch } from "../alpaca/alpaca-asset-cache.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/** A loose in-progress-typing shape — letters only, up to 10 of them. Deliberately NOT
 *  `UNDERLYING_PATTERN`, which is anchored for a COMPLETE symbol and would reject a partial
 *  query mid-keystroke (e.g. "GAT"). */
const IN_PROGRESS_QUERY = /^[A-Za-z]{1,10}$/;

/**
 * Live tier-2 symbol lookup (#2017-adjacent, Phase 0.8b) — the curated directory's fallback on a
 * miss. Same identity/degrade doctrine as `quote-route.ts`: the requester's own linked client only,
 * and every failure (no client, malformed query, a broker-side throw) degrades to an honest empty
 * result, never an error status — this is speculative autocomplete infrastructure, not a validated
 * submission.
 */
export async function serveSymbolSearch(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const q = (params.get("q") ?? "").trim();
  if (!IN_PROGRESS_QUERY.test(q)) {
    sendJson(res, 200, { hits: [] });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!client) {
    sendJson(res, 200, { hits: [] });
    return;
  }
  try {
    const hits = await assetSearch(() => client.getAssets(), q);
    sendJson(res, 200, { hits });
  } catch {
    sendJson(res, 200, { hits: [] });
  }
}
