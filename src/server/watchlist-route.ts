import type { IncomingMessage, ServerResponse } from "node:http";
import {
  addToWatchlist,
  normalizeWatchSymbol,
  removeFromWatchlist,
  WATCHLIST_BAD_SYMBOL,
  WATCHLIST_LIMIT,
  type WatchedSymbol,
} from "../trading/watchlist.js";
import type { Session } from "./auth/session.js";
import { resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { parseJsonRecord, readJsonPost, requireGet, sendJson } from "./page-shell.js";

/**
 * THE MEMBER'S WATCHLIST (#3407 P4, #4332) — the names they keep an eye on, and the only list on
 * the trade surface that is theirs rather than one of their desks'.
 *
 *   GET  /api/trade/watchlist                     → `{ available, limit, watching }`
 *   POST /api/trade/watchlist { symbol, watching } → `{ ok, watching }` or `{ ok:false, refusals }`
 *
 * IDENTITY IS THE SESSION'S, AND THERE IS NO PARAMETER FOR IT. `quote-stream-route.ts`'s rule,
 * kept for the same reason: a watchlist keyed by member needs no `participantId`, so there is
 * nothing for a caller to point at somebody else's list. A member with no linked identity reads an
 * empty list and a sentence, never an error.
 *
 * ONE VERB, TWO DIRECTIONS. `watching: true | false` rather than two paths: the surface's control
 * is a toggle, and a toggle that sends its desired STATE is idempotent under a double tap, where
 * an `add`/`remove` pair of endpoints makes the second tap of a fumbled double-tap undo the first.
 *
 * THE ANSWER IS THE WHOLE LIST, EVERY TIME. The list is at most {@link WATCHLIST_LIMIT} short
 * rows, so echoing it costs nothing and the client never has to apply a change locally and hope it
 * matches — the same doctrine `desk-events.ts` holds for the fill stream ("every number comes
 * from a read").
 *
 * WITHOUT A STORE IT SAYS SO. An unwired deployment answers `available: false` with a sentence and
 * an empty list rather than accepting adds into memory that vanish on the next deploy — the
 * failure mode `tests/arch/volume-persistence.spec.ts` and `ports/watchlist.ts` both name.
 */

export const WATCHLIST_PATH = "/api/trade/watchlist";
const WATCHLIST_BODY_CAP_BYTES = 2_048;

const NOT_STORED =
  "Watchlists aren't stored on this deployment yet, so there's nothing to keep a name in.";
const NOT_LINKED =
  "Your watchlist lives with your account, and your session isn't linked to one yet.";

/** The wire shape — the list, its ceiling (so the surface can say "18 of 20" without a second
 *  copy of the number), and whether a change would actually stick. */
interface WatchlistAnswer {
  readonly available: boolean;
  readonly limit: number;
  readonly watching: readonly WatchedSymbol[];
  readonly reason?: string;
}

function unavailable(reason: string): WatchlistAnswer {
  return { available: false, limit: WATCHLIST_LIMIT, watching: [], reason };
}

/** The member whose list this is, or nothing. An unauthenticated deployment (local, offline) has
 *  exactly one reader, so it gets one list — `desk-alerts-route.ts`'s own rule for the same case,
 *  rather than the quote stream's decline, because a list that refuses to save anything offline
 *  would make the pane untestable by hand. */
function memberFor(
  config: DashboardServerConfig,
  session: Session | undefined,
): string | undefined {
  return config.auth ? resolveCurrentId(session, config.resolveOwnerId) : "local";
}

async function serveList(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const store = config.watchlist;
  if (!store) {
    sendJson(res, 200, unavailable(NOT_STORED));
    return;
  }
  const memberId = memberFor(config, session);
  if (!memberId) {
    sendJson(res, 200, unavailable(NOT_LINKED));
    return;
  }
  const watching = await store.load(memberId);
  sendJson(res, 200, {
    available: true,
    limit: WATCHLIST_LIMIT,
    watching,
  } satisfies WatchlistAnswer);
}

async function serveToggle(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, WATCHLIST_BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  const symbol = body?.symbol;
  const watching = body?.watching;
  if (typeof symbol !== "string" || symbol.length === 0 || symbol.length > 12) {
    sendJson(res, 400, { error: "malformed watchlist body" });
    return;
  }
  if (typeof watching !== "boolean") {
    sendJson(res, 400, { error: "malformed watchlist body" });
    return;
  }
  const store = config.watchlist;
  if (!store) {
    sendJson(res, 200, { ok: false, refusals: [NOT_STORED], watching: [] });
    return;
  }
  const memberId = memberFor(config, session);
  if (!memberId) {
    sendJson(res, 200, { ok: false, refusals: [NOT_LINKED], watching: [] });
    return;
  }

  const normalized = normalizeWatchSymbol(symbol);
  if (!normalized) {
    sendJson(res, 200, { ok: false, refusals: [WATCHLIST_BAD_SYMBOL], watching: [] });
    return;
  }

  // The rules decide against the list as it stands NOW, re-read per change rather than trusted
  // from the client: two tabs on one account are two writers, and the cap has to hold across both.
  const current = await store.load(memberId);
  const at = (config.now?.() ?? new Date()).toISOString();
  const change = watching
    ? addToWatchlist(current, normalized, at)
    : removeFromWatchlist(current, normalized);
  if (!change.ok) {
    sendJson(res, 200, { ok: false, refusals: [change.reason], watching: current });
    return;
  }
  // Nothing to write when nothing changed — a second tap on a name already watched (or already
  // gone) is the state the member asked for, so it answers `ok` and appends no line.
  if (change.changed) {
    if (watching) await store.add(memberId, normalized);
    else await store.remove(memberId, normalized);
  }
  sendJson(res, 200, { ok: true, watching: change.list });
}

/** Handle `/api/trade/watchlist`. Returns true when answered. */
export async function serveWatchlistApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== WATCHLIST_PATH) return false;
  if (req.method === "POST") {
    await serveToggle(req, res, config, session);
    return true;
  }
  if (requireGet(req, res)) await serveList(res, config, session);
  return true;
}
