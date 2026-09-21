import type { IncomingMessage, ServerResponse } from "node:http";
import { AlpacaApiError } from "../alpaca/alpaca-api-error.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { deskOrdersView } from "./desk-orders-view.js";
import { parseJsonRecord, readJsonPost, requireGet, sendJson } from "./page-shell.js";

/**
 * THE ORDER LIFECYCLE API (#3407, P1 slice 1) — the two calls a working order needs after the
 * ticket has sent it, missing from the shell until now (the study's audit: a Limit was offered
 * with no way to see or cancel it; `cancelOrder` had zero callers).
 *
 *   GET  /api/trade/orders?participantId=…  → `{ available, asOf, working, recent }` straight off
 *                                             the broker (`desk-orders-view.ts`). Alpaca is the
 *                                             store of record for a pending order.
 *   POST /api/trade/cancel  { participantId, orderId }
 *                                           → `{ ok:true, orderId }` once the broker accepted
 *                                             the cancel, else `{ ok:false, refusals }` — a
 *                                             rendered explanation, never an error, same as the
 *                                             ticket.
 *
 * Identity is the session's and nowhere else, checked the way every read route on a member's
 * own credentials checks it (`equity-curve-routes.ts`): the target must be in the session's
 * owned set, or the account does not exist as far as this caller is concerned. The client is the
 * OWN account's (`config.tradingClientFor`), so a cancel can only ever reach an order that
 * account placed — the broker scopes order ids per account. A cancel writes the same per-order
 * audit line a submit does, tagged `intent: "cancel"`, so "who cancelled this" is answerable
 * from the same trail as "who placed it" (`order-audit-log.ts`).
 *
 * Deliberately not here: replace. It is its own slice (P1 1b) because a replaced order changes id
 * and the ledger needs the lineage before the UI can offer it honestly.
 */

const CANCEL_BODY_CAP_BYTES = 2_048;
/** Enough history for `recent` to show a full day's settled orders behind the working ones. */
const ORDERS_FETCH_LIMIT = 100;

interface CancelBody {
  readonly participantId: string;
  readonly orderId: string;
}

function parseCancelBody(raw: string): CancelBody | undefined {
  const body = parseJsonRecord(raw);
  if (!body) return undefined;
  const { participantId, orderId } = body;
  if (typeof participantId !== "string" || participantId.length === 0 || participantId.length > 100)
    return undefined;
  if (typeof orderId !== "string" || orderId.length === 0 || orderId.length > 100) return undefined;
  return { participantId, orderId };
}

/** Only the broker's own sentence is the member's to act on; anything else collapses to a fixed
 *  line so no transport internals reach the page (the same rule `desk-gate.ts` applies). */
function cancelRefusal(error: unknown): string {
  if (error instanceof AlpacaApiError) {
    const reason = (error.body as { message?: unknown } | null)?.message;
    if (error.status === 404) return "That order isn't on the broker any more.";
    if (error.status === 422) {
      return `The broker couldn't cancel this order${
        typeof reason === "string" && reason.length > 0
          ? `: ${reason}`
          : " — it may already be filled."
      }`;
    }
    return typeof reason === "string" && reason.length > 0
      ? `The broker refused the cancel: ${reason}`
      : "The broker refused the cancel.";
  }
  return "Couldn't reach the broker to cancel this order. Try again shortly.";
}

function ownsAccount(
  id: string,
  config: DashboardServerConfig,
  session: Parameters<typeof resolveOwnedIds>[0],
): boolean {
  if (!config.auth) return true;
  return resolveOwnedIds(session, config).includes(id);
}

async function serveOrdersList(
  res: ServerResponse,
  url: string,
  config: DashboardServerConfig,
  session: Parameters<typeof resolveOwnedIds>[0],
): Promise<void> {
  const id = new URL(url, "http://localhost").searchParams.get("participantId") ?? "";
  if (!(id && ownsAccount(id, config, session))) {
    sendJson(res, 404, { error: "no such account" });
    return;
  }
  const client = config.tradingClientFor?.(id);
  if (!client) {
    // The same honest absence the chain route renders: no linked credentials, no list — never an
    // empty list that reads as "nothing working".
    sendJson(res, 200, { available: false, reason: "unlinked", working: [], recent: [] });
    return;
  }
  try {
    const orders = await client.listOrders({ status: "all", limit: ORDERS_FETCH_LIMIT });
    sendJson(res, 200, {
      available: true,
      asOf: new Date().toISOString(),
      ...deskOrdersView(orders),
    });
  } catch {
    sendJson(res, 200, { available: false, reason: "unreachable", working: [], recent: [] });
  }
}

async function serveCancel(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Parameters<typeof resolveOwnedIds>[0],
): Promise<void> {
  const raw = await readJsonPost(req, res, CANCEL_BODY_CAP_BYTES);
  if (raw === undefined) return;
  const body = parseCancelBody(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed cancel body" });
    return;
  }
  if (!ownsAccount(body.participantId, config, session)) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["You can only cancel orders on your own account."],
    });
    return;
  }
  const client = config.tradingClientFor?.(body.participantId);
  if (!client) {
    sendJson(res, 200, {
      ok: false,
      refusals: ["This session isn't linked to a trading account, so there is nothing to cancel."],
    });
    return;
  }
  try {
    await client.cancelOrder(body.orderId);
  } catch (error) {
    sendJson(res, 200, { ok: false, refusals: [cancelRefusal(error)] });
    return;
  }
  await config.recordOrderAudit?.({
    participantId: body.participantId,
    ...(session?.email ? { ownerEmail: session.email } : {}),
    orderId: body.orderId,
    at: new Date().toISOString(),
    intent: "cancel",
  });
  sendJson(res, 200, { ok: true, orderId: body.orderId });
}

/** Handle `/api/trade/orders` and `/api/trade/cancel`. Returns true when the request was answered. */
export async function serveTradeOrdersApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Parameters<typeof resolveOwnedIds>[0],
): Promise<boolean> {
  if (path === "/api/trade/orders") {
    if (requireGet(req, res)) await serveOrdersList(res, req.url ?? "/", config, session);
    return true;
  }
  if (path === "/api/trade/cancel") {
    await serveCancel(req, res, config, session);
    return true;
  }
  return false;
}
