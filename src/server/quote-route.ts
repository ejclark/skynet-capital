import type { ServerResponse } from "node:http";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import { quoteView } from "../trading/quote-view.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { sendJson } from "./page-shell.js";

/**
 * The quote header's data (#2017 cockpit plan, Phase 0.9): last price + day $/% change for one
 * symbol, through the REQUESTER'S OWN options client only — same identity doctrine as
 * `option-chain-route.ts`. Enrichment, never the order path: an unlinked session, a missing quote,
 * or a broker hiccup all degrade to an honest one-line `quoteNote` rather than an error, so the
 * header renders nothing alarming when the feed can't answer.
 */
export async function serveQuote(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  requesterId: string | undefined,
): Promise<void> {
  const params = new URL(url, "http://localhost").searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  if (!UNDERLYING_PATTERN.test(symbol)) {
    sendJson(res, 400, { error: "the quote wants ?symbol=<ticker>" });
    return;
  }
  const client =
    requesterId && config.optionsClientFor ? config.optionsClientFor(requesterId) : undefined;
  if (!client) {
    sendJson(res, 200, {
      quoteNote:
        "Live quotes load through your own connected account, and your session isn't linked to one yet.",
    });
    return;
  }
  try {
    const quote = await client.getUnderlyingQuote(symbol);
    if (!quote) {
      sendJson(res, 200, { quoteNote: `No quote for ${symbol} right now.` });
      return;
    }
    sendJson(res, 200, quoteView(symbol, quote));
  } catch {
    sendJson(res, 200, { quoteNote: "Couldn't load a quote right now." });
  }
}
