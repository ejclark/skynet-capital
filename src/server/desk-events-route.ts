import type { IncomingMessage, ServerResponse } from "node:http";
import type { ActivityEvent } from "../observatory/activity-event.js";
import { forVisibility } from "../observatory/activity-event.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { requireGet, sendJson } from "./page-shell.js";
import { openSseStream, sseFrame } from "./sse.js";

/**
 * THE DESK'S OWN EVENT STREAM (#3407 P4 slice 1; the study's "live order-status updates —
 * missing; the only SSE channel is the leaderboard"). `GET /api/trade/events?participantId=…`
 * is a Server-Sent Events stream of one account's order lifecycle, fed by the activity event bus
 * the board already publishes fills and submits onto (`activity-publishing.ts`): a fill the
 * `trade_updates` stream delivered, an order the desk audited, a cancel — each arrives as one
 * `order` frame the moment the bus sees it, so Working orders, the positions card and the
 * ticket's done state re-read on the broker's clock instead of a 15-second poll.
 *
 * Identity is the session's and nowhere else, checked exactly as the orders route checks it
 * (`trade-orders-routes.ts`): the account must be in the session's owned set or it does not
 * exist as far as this caller is concerned. The subscription is filtered to that one actor and
 * to the tiers an owner may see (`forVisibility`), so a member's stream never carries another's
 * line. Every frame carries the event's own id, so a reconnecting browser sends it back — the
 * bus keeps no replay buffer today, so `Last-Event-ID` is honoured only by re-reading (the
 * client invalidates on `hello`), never by pretending nothing was missed.
 *
 * Absent the bus (offline / test wiring) the route answers JSON `{ available: false }` rather than
 * an empty stream, so the client falls back to polling in words, not in silence.
 */

export const DESK_EVENTS_PATH = "/api/trade/events";
/** A comment frame every so often keeps proxies from closing an idle stream. */
export const HEARTBEAT_MS = 25_000;

const OWNER_TIERS = forVisibility(["public", "owner-only"]);

/** The wire shape of one `order` frame — the event's envelope fields a desk surface reads. */
export interface DeskOrderEvent {
  readonly id: string;
  readonly eventType: string;
  readonly orderId: string;
  readonly at: string;
  readonly outcome: ActivityEvent["outcome"];
  readonly payload: ActivityEvent["payload"];
}

export function deskOrderEvent(event: ActivityEvent): DeskOrderEvent {
  return {
    id: event.id,
    eventType: event.eventType,
    orderId: event.target.id,
    at: event.at,
    outcome: event.outcome,
    payload: event.payload,
  };
}

function ownsAccount(
  id: string,
  config: DashboardServerConfig,
  session: Parameters<typeof resolveOwnedIds>[0],
): boolean {
  if (!config.auth) return true;
  return resolveOwnedIds(session, config).includes(id);
}

/** Handle `GET /api/trade/events`. Returns true when answered (or the stream was opened). */
export function serveDeskEventsApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Parameters<typeof resolveOwnedIds>[0],
): boolean {
  if (path !== DESK_EVENTS_PATH) return false;
  if (!requireGet(req, res)) return true;
  const id = new URL(req.url ?? "/", "http://localhost").searchParams.get("participantId") ?? "";
  if (!(id && ownsAccount(id, config, session))) {
    sendJson(res, 404, { error: "no such account" });
    return true;
  }
  const bus = config.activityEvents;
  if (!bus) {
    sendJson(res, 200, { available: false, reason: "unwired" });
    return true;
  }

  openSseStream(res);
  res.write(sseFrame(JSON.stringify({ participantId: id, at: new Date().toISOString() }), "hello"));
  const subscription = bus.subscribe((event) => {
    if (event.actor.participantId !== id || !OWNER_TIERS(event)) return;
    res.write(sseFrame(JSON.stringify(deskOrderEvent(event)), "order", event.id));
  });
  const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);
  const close = () => {
    clearInterval(heartbeat);
    subscription.unsubscribe();
  };
  req.on("close", close);
  res.on("close", close);
  return true;
}
