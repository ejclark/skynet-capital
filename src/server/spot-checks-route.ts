import type { ServerResponse } from "node:http";
import { summarizeSpotChecks } from "../research/spot-checks.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/**
 * GET /api/trade/guidance/spot-checks — the spot cross-check count, summarized (#3729). Read-only,
 * members only (the same session the guidance itself needs), and aggregate: shares and gaps, never
 * a per-symbol or per-member breakdown. The raw lines stay on the volume for whoever settles the
 * question; this is what they read first.
 */
export async function serveSpotChecks(
  res: ServerResponse,
  _url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  if (!requesterId) {
    sendJson(res, 401, { error: "sign in to read the spot cross-check count" });
    return;
  }
  if (!config.spotChecks) {
    sendJson(res, 200, {
      reason: "off",
      note: "The count is off — it is kept beside the IV history, which is not configured here.",
    });
    return;
  }
  const checks = await config.spotChecks.list().catch(() => undefined);
  if (!checks) {
    sendJson(res, 200, { reason: "failed", note: "Couldn't read the count just now." });
    return;
  }
  sendJson(res, 200, { summary: summarizeSpotChecks(checks) });
}
