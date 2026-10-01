import type { IncomingMessage, ServerResponse } from "node:http";
import { UNDERLYING_PATTERN } from "../trading/option-symbols.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";
import { openSseStream, sseFrame } from "./sse.js";

/**
 * THE UNDERLYING QUOTE, PUSHED (#3407 P4, the last capability slice).
 * `GET /api/trade/quote-stream?symbol=NVDA` is a Server-Sent Events stream of one symbol's quote
 * for the signed-in member, so the trade surface's price moves on the market's clock. Before this,
 * it did not move at all: `quote-query.ts` fetches once when the symbol commits and sets no refetch
 * interval, so the number a member read while filling in a ticket was the number from whenever they
 * typed the ticker. Same answer shape as `/api/trade/quote` — the frame IS a `QuoteView` — so the
 * client writes it straight into the query every ticket surface already reads, and no component
 * learns a second model.
 *
 * Identity is the session's and nowhere else, exactly as `quote-route.ts` resolves it: there is no
 * `participantId` parameter to pass, so there is nothing for a caller to point at someone else's
 * account. The upstream socket runs on that member's own credential (`quote-stream-hub.ts` has the
 * whole reason why, and the outage a shared one would cause).
 *
 * Every way this route declines is a sentence, never an empty stream: no hub wired, no linked
 * session, no key/secret pair (an OAuth session cannot authenticate a market-data socket), or the
 * stated symbol budget already full. The surface then shows what it showed before this route
 * existed — the price read at commit, said to be that — which is why declining has to stay JSON,
 * decided BEFORE the stream head goes out.
 *
 * Scope is the UNDERLYING only. Per-row option bid/ask is a different feed (indicative on the free
 * plan) and a different question; the chain pane keeps its poll and its own as-of stamp.
 */

export const QUOTE_STREAM_PATH = "/api/trade/quote-stream";
/** A comment frame every so often keeps proxies from closing an idle stream (desk-events' rule). */
export const HEARTBEAT_MS = 25_000;

const NOT_WIRED =
  "Live quotes aren't wired up on this deployment — the price here is the one read when you picked the symbol.";
const NOT_LINKED =
  "Live quotes stream through your own connected account, and your session isn't linked to one yet.";

/** Handle `GET /api/trade/quote-stream`. Returns true when answered (or the stream was opened). */
export function serveQuoteStream(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): boolean {
  if (path !== QUOTE_STREAM_PATH) return false;
  if (!requireGet(req, res)) return true;

  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const symbol = (params.get("symbol") ?? "").trim().toUpperCase();
  if (!UNDERLYING_PATTERN.test(symbol)) {
    sendJson(res, 400, { error: "the quote stream wants ?symbol=<ticker>" });
    return true;
  }

  const hub = config.quoteStream;
  if (!hub) {
    sendJson(res, 200, { available: false, reason: NOT_WIRED });
    return true;
  }
  const requesterId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  if (!requesterId) {
    sendJson(res, 200, { available: false, reason: NOT_LINKED });
    return true;
  }

  // Subscribing is synchronous, so a refusal is still a JSON answer — the stream head only goes
  // out once there is genuinely a stream behind it. The hub hands a joiner the state it already
  // holds during that same call, before the head is written, so those frames are held and flushed
  // rather than dropped (on a quiet name the alternative is a blank header until the next print).
  let open = false;
  const held: string[] = [];
  const write = (frame: string) => {
    if (open) res.write(frame);
    else held.push(frame);
  };
  const subscription = hub.subscribe(requesterId, symbol, (quote) => {
    write(sseFrame(JSON.stringify(quote), "quote"));
  });
  if (!subscription.ok) {
    sendJson(res, 200, { available: false, reason: subscription.reason });
    return true;
  }

  openSseStream(res);
  open = true;
  res.write(sseFrame(JSON.stringify({ symbol, at: new Date().toISOString() }), "hello"));
  for (const frame of held) res.write(frame);
  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);
  const close = () => {
    clearInterval(heartbeat);
    subscription.unsubscribe();
  };
  req.on("close", close);
  res.on("close", close);
  return true;
}
