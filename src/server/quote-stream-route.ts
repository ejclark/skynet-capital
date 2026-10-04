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
 *
 * ONE STREAM CARRIES A SET (#4332, the watchlist). `?symbol=` takes one ticker or a comma-separated
 * list, because the watchlist is rows of moving prices and a browser allows only six `EventSource`
 * connections per origin — one per row would starve the seventh name and everything else on the
 * page. The hub needed nothing for this: it has been ref-counted per symbol with a `resubscribe`
 * on every join since it was written, so a desk watching eight names is 8 of its 30 on one socket.
 *
 * A PARTIAL SET IS AN HONEST ANSWER, not a refusal. Each symbol is subscribed on its own; the
 * `hello` frame names the ones that are genuinely live, and a symbol that didn't make it simply
 * never receives a frame — so it keeps the price its surface read over REST and, having no `asOf`,
 * shows no live stamp (`quote-header.tsx`'s rule). Only a set where NOTHING could be subscribed
 * declines in JSON, which keeps the single-symbol case answering exactly as it did before.
 */

export const QUOTE_STREAM_PATH = "/api/trade/quote-stream";
/** The most tickers one request may name. The watchlist's own ceiling is 20 (`watchlist.ts`), and
 *  the socket's is 30 — this bounds the URL and the per-request work without ever being the limit
 *  a member meets, which the list's own cap reaches first and explains in words. */
export const MAX_STREAM_REQUEST_SYMBOLS = 30;
/** A comment frame every so often keeps proxies from closing an idle stream (desk-events' rule). */
export const HEARTBEAT_MS = 25_000;

const NOT_WIRED =
  "Live quotes aren't wired up on this deployment — the price here is the one read when you picked the symbol.";
const NOT_LINKED =
  "Live quotes stream through your own connected account, and your session isn't linked to one yet.";

/**
 * The tickers a request names, deduped and in the order asked, or `undefined` when the parameter
 * is absent, empty, over the cap, or carries anything that isn't a ticker. Strict rather than
 * lenient on a bad member of the set: silently dropping one would open a stream that looks
 * complete and is missing a row, which is the dishonesty this surface's criteria forbid.
 */
export function parseSymbols(raw: string | null): readonly string[] | undefined {
  const parts = (raw ?? "")
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter((part) => part !== "");
  if (parts.length === 0 || parts.length > MAX_STREAM_REQUEST_SYMBOLS) return undefined;
  if (!parts.every((part) => UNDERLYING_PATTERN.test(part))) return undefined;
  return [...new Set(parts)];
}

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
  const asked = parseSymbols(params.get("symbol"));
  if (!asked) {
    sendJson(res, 400, {
      error: "the quote stream wants ?symbol=<ticker> or a comma-separated set",
    });
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
  const live: string[] = [];
  const unsubscribes: (() => void)[] = [];
  let refusal: string | undefined;
  for (const symbol of asked) {
    const subscription = hub.subscribe(requesterId, symbol, (quote) => {
      write(sseFrame(JSON.stringify(quote), "quote"));
    });
    if (subscription.ok) {
      live.push(symbol);
      unsubscribes.push(subscription.unsubscribe);
    } else refusal = subscription.reason;
  }
  // Nothing subscribed at all is the one case that declines in JSON — identical to the
  // single-symbol behaviour this route has always had, which is what the surface's fallback note
  // was written against.
  if (live.length === 0) {
    sendJson(res, 200, { available: false, reason: refusal ?? NOT_WIRED });
    return true;
  }

  openSseStream(res);
  open = true;
  // `symbol` stays singular for a set of one so nothing that reads the old frame changes; `symbols`
  // is the whole live set, which is how a surface tells a row that didn't make it from one that did.
  res.write(
    sseFrame(
      JSON.stringify({ symbol: live[0], symbols: live, at: new Date().toISOString() }),
      "hello",
    ),
  );
  for (const frame of held) res.write(frame);
  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);
  const close = () => {
    clearInterval(heartbeat);
    for (const unsubscribe of unsubscribes) unsubscribe();
  };
  req.on("close", close);
  res.on("close", close);
  return true;
}
