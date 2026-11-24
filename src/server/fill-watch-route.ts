import type { IncomingMessage, ServerResponse } from "node:http";
import type { FillWatch } from "../alerts/fill-watch.js";
import type { Session } from "./auth/session.js";
import { baseUrlFrom } from "./dashboard-auth-gate.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { parseJsonRecord, readJsonPost, requireGet, sendJson } from "./page-shell.js";

/**
 * "EMAIL ME WHEN IT FILLS" — one order, one email (#8251), armed from the order receipt.
 *
 *   GET  /api/trade/alerts/fill-watch?participantId=…&orderId=…
 *        → `{ available, reason?, watching, destination? }`
 *   POST /api/trade/alerts/fill-watch { participantId, orderId }            → arm
 *   POST /api/trade/alerts/fill-watch { participantId, orderId, replaces }  → a modify's new id
 *        → `{ ok, watching, destination? }` or `{ ok: false, refusals }`
 *
 * What it guards, the same way the account-wide switch beside it does (`alert-delivery-route.ts`):
 * - THE ADDRESS IS NEVER IN THE REQUEST. It is the signed-in session's own, so a tap can only ever
 *   mail the person who tapped — and only for an account their session owns.
 * - THE LINK IS NEVER GUESSED. It is built now, from `config.publicUrl` or else this request's own
 *   origin, and stored with the watch; the send never invents a host.
 * - A watch changes nothing else: the Alerts panel's channel and floor read the same after.
 * - Unavailable (no transport — production until #6501 closes — no store, or no address on the
 *   session) answers the route's own sentence, which the receipt shows instead of the button.
 */

export const FILL_WATCH_PATH = "/api/trade/alerts/fill-watch";
const BODY_CAP_BYTES = 1_024;
/** A broker order id: Alpaca's are UUIDs; the fixture transport's are short slugs. */
const ORDER_ID = /^[A-Za-z0-9-]{1,64}$/;
/** An address this app will send to — the member's own, as their provider gave it to us. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** Open watches one account may hold — a bound on the file, far above any real ticket's need. */
export const MAX_WATCHES = 50;

function owned(id: string, config: DashboardServerConfig, session: Session | undefined): boolean {
  const ids = config.auth ? resolveOwnedIds(session, config) : [id];
  return id !== "" && ids.includes(id);
}

function destinationFor(session: Session | undefined): string | undefined {
  const email = session?.email;
  return email && EMAIL.test(email) ? email : undefined;
}

/** Why this caller cannot arm a watch, in the words the receipt shows; undefined when they can. */
function unavailableReason(
  config: DashboardServerConfig,
  session: Session | undefined,
): string | undefined {
  if (!config.alertDeliveryStore) {
    return "This deployment can't send email yet, so watch the Orders list for the fill.";
  }
  if (!config.alertDelivery) {
    return "Email isn't set up on this deployment yet, so watch the Orders list for the fill.";
  }
  if (!destinationFor(session)) {
    return "Your sign-in didn't give us an email address, so there's nowhere to send it.";
  }
  return undefined;
}

/** The one link the email carries: this account's Orders section on the trade page. */
function ordersLink(req: IncomingMessage, config: DashboardServerConfig, id: string): string {
  const origin = (config.publicUrl ?? baseUrlFrom(req)).replace(/\/+$/, "");
  return `${origin}/app/trade?desk=${encodeURIComponent(id)}&section=orders`;
}

async function serveRead(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const params = new URL(req.url ?? "/", "http://localhost").searchParams;
  const id = params.get("participantId") ?? "";
  const orderId = params.get("orderId") ?? "";
  if (!owned(id, config, session)) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  const reason = unavailableReason(config, session);
  const watches = (await config.alertDeliveryStore?.load(id))?.watches ?? [];
  const destination = destinationFor(session);
  sendJson(res, 200, {
    available: reason === undefined,
    ...(reason ? { reason } : {}),
    watching: watches.some((w) => w.orderId === orderId),
    ...(destination && !reason ? { destination } : {}),
  });
}

function refuse(res: ServerResponse, sentence: string): void {
  sendJson(res, 200, { ok: false, refusals: [sentence] });
}

async function serveWrite(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const raw = await readJsonPost(req, res, BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseJsonRecord(raw);
  const participantId = body?.participantId;
  const orderId = body?.orderId;
  const replaces = body?.replaces;
  if (
    typeof participantId !== "string" ||
    typeof orderId !== "string" ||
    !ORDER_ID.test(orderId) ||
    (replaces !== undefined && (typeof replaces !== "string" || !ORDER_ID.test(replaces)))
  ) {
    sendJson(res, 400, { error: "malformed fill-watch body" });
    return;
  }
  if (!owned(participantId, config, session)) {
    refuse(res, "You can only watch orders on your own account.");
    return;
  }
  const store = config.alertDeliveryStore;
  const destination = destinationFor(session);
  const reason = unavailableReason(config, session);
  if (!(store && destination) || reason) {
    refuse(res, reason ?? "Email isn't available on this account.");
    return;
  }
  const { watches } = await store.load(participantId);
  if (typeof replaces === "string") {
    // A modify answered with a new order id: the watch follows it, or there was none to follow.
    if (!watches.some((w) => w.orderId === replaces)) {
      sendJson(res, 200, { ok: true, watching: false });
      return;
    }
    await store.dropWatch(participantId, replaces);
  } else if (watches.length >= MAX_WATCHES && !watches.some((watch) => watch.orderId === orderId)) {
    refuse(res, `You're already watching ${MAX_WATCHES} orders — that's the most at once.`);
    return;
  }
  const watch: FillWatch = {
    orderId,
    destination,
    link: ordersLink(req, config, participantId),
    at: (config.now?.() ?? new Date()).toISOString(),
  };
  await store.saveWatch(participantId, watch);
  // The order may already have ended between the receipt's last read and this tap: run one
  // delivery pass now rather than waiting for the account's next order event.
  config.alertDeliveryNudge?.(participantId);
  sendJson(res, 200, { ok: true, watching: true, destination });
}

/** Handle `/api/trade/alerts/fill-watch`. Returns true when answered. */
export async function serveFillWatchApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path !== FILL_WATCH_PATH) return false;
  if ((req.method ?? "GET") === "GET") {
    if (requireGet(req, res)) await serveRead(req, res, config, session);
    return true;
  }
  await serveWrite(req, res, config, session);
  return true;
}
