import type { ServerResponse } from "node:http";
import {
  EQUITY_CURVE_RANGES,
  type EquityCurveRange,
  equityCurveView,
} from "../observatory/equity-curve-json-view.js";
import type { Session } from "./auth/session.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/** Alpaca `period` for the fixed-length ranges; YTD/ALL go through the explicit date-range call
 *  instead (`period` has no such token — see `AlpacaTradingClient.getPortfolioHistoryByRange`). */
const PERIOD: Partial<Record<EquityCurveRange, string>> = {
  "7D": "1W",
  "1M": "1M",
  "3M": "3M",
  "1Y": "1A",
};

function isRange(value: string | null): value is EquityCurveRange {
  return (EQUITY_CURVE_RANGES as readonly string[]).includes(value ?? "");
}

/**
 * `GET /api/accounts/:id/equity-curve?range=7D|1M|3M|1Y|YTD|ALL` — the hero chart's own equity
 * series (#3186 slice 2), scoped to ONE of the session's own accounts (same ownership doctrine as
 * `/api/accounts/networth`) — never a client-supplied id taken on faith. An unlinked/unreachable
 * account degrades to an empty `points` array, the same honest-emptiness posture `/api/desk/:id`
 * takes, rather than an error the chart would have to special-case.
 */
export async function serveEquityCurveJson(
  res: ServerResponse,
  id: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const ownedIds = config.auth ? resolveOwnedIds(session, config) : [];
  if (config.auth && !ownedIds.includes(id)) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }

  const rangeParam = new URL(url, "http://localhost").searchParams.get("range");
  const range: EquityCurveRange = isRange(rangeParam) ? rangeParam : "1M";

  const client = config.tradingClientFor?.(id);
  if (!client) {
    sendJson(res, 200, { range, points: [] });
    return;
  }

  try {
    const period = PERIOD[range];
    const history = period
      ? await client.getPortfolioHistory(period)
      : await client.getPortfolioHistoryByRange(range === "YTD" ? ytdStart(config) : "2000-01-01");
    sendJson(res, 200, { range, ...equityCurveView(history) });
  } catch {
    sendJson(res, 200, { range, points: [] });
  }
}

/** January 1st of the current year, `YYYY-MM-DD` — `config.now()` when supplied, for tests. */
function ytdStart(config: DashboardServerConfig): string {
  const now = config.now?.() ?? new Date();
  return `${now.getUTCFullYear()}-01-01`;
}
