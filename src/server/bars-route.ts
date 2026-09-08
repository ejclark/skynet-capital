import type { ServerResponse } from "node:http";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/** The lookback window's ceiling in calendar days (~5 years) and its default (~6 months). */
const MAX_DAYS = 1825;
const DEFAULT_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The chart section's data (#2017 cockpit plan, Phase 1 chart build-out): daily OHLC+volume bars
 * for one symbol, through the REQUESTER'S OWN options client only — same identity doctrine as
 * `quote-route.ts` and `option-chain-route.ts`. Enrichment, never the order path: an unlinked
 * session, an unreachable feed, or a broker hiccup all degrade to an honest one-line `barsNote`
 * rather than an error, so the chart renders nothing alarming when the feed can't answer.
 *
 * `?days=` is a lookback in calendar days ending today, clamped to [1, 1825] here — the client
 * method takes explicit dates and stays a thin wrapper. An empty `bars` array passes through as
 * the real answer it is (the feed had nothing for this window), never rewritten into a note.
 */
export async function serveBars(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  if (!UNDERLYING_PATTERN.test(symbol)) {
    sendJson(res, 400, { error: "the chart wants ?symbol=<ticker>" });
    return;
  }
  const daysParam = Number(params.get("days"));
  const days =
    Number.isFinite(daysParam) && daysParam > 0
      ? Math.min(Math.trunc(daysParam), MAX_DAYS)
      : DEFAULT_DAYS;
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!client) {
    sendJson(res, 200, {
      barsNote:
        "Live charts load through your own connected account, and your session isn't linked to one yet.",
    });
    return;
  }
  try {
    const end = config.now?.() ?? new Date();
    const start = new Date(end.getTime() - days * DAY_MS);
    const bars = await client.getBars(
      symbol,
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10),
    );
    if (bars === undefined) {
      sendJson(res, 200, { barsNote: `Couldn't load price history for ${symbol} right now.` });
      return;
    }
    sendJson(res, 200, { symbol, bars });
  } catch {
    sendJson(res, 200, { barsNote: "Couldn't load price history right now." });
  }
}
