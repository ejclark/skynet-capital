import type { IncomingMessage, ServerResponse } from "node:http";
import { ladderNeighbor } from "../domain/progression.js";
import { type TradeTypeCode, tradeTypeByCode } from "../domain/trade-types.js";
import { ticketContext } from "../observatory/desk-data.js";
import { isOccSymbol } from "../trading/option-symbols.js";
import {
  previewOrder,
  type TicketAction,
  type TicketOrderType,
  type TicketPreview,
} from "../trading/order-ticket.js";
import { handleCheckPost } from "./comprehension-routes.js";
import { handleOptionPost, OPTION_CODES, optionPreviewFromForm } from "./option-order-review.js";
import { readBody } from "./page-shell.js";
import { redirectBack, refusalPage, resultRedirect } from "./trade-response-pages.js";
import { reviewPage } from "./trade-review-page.js";
import type { DeskTradeResult } from "./trade-service.js";
import {
  playLocked,
  serveTicket,
  type TradeRouteDeps,
  viewerProgression,
} from "./trade-ticket-route.js";

// The deps contract lives with the view half; re-exported so existing importers keep working.
export type { TradeRouteDeps } from "./trade-ticket-route.js";

/**
 * `/trade` — the desk's trade view and its one write route.
 *
 * GET renders the TICKET (guided/raw, chain, payoff) and never touches an account: reads only.
 * POST keeps the two-step contract the share desk established: the first POST renders the
 * review screen, the second (carrying `confirm=1`) executes. An order must never be a link
 * someone can be tricked into following, and must never replay on a refresh or a back button —
 * which is exactly why the review/confirm split lives on POST while everything explorable
 * lives on GET.
 *
 * The route stays a thin shell: it parses forms, asks the pure ticket rules what it may do,
 * and hands anything real to `trade-service.ts` / `option-trade-service.ts`, which re-validate
 * everything server-side against fresh account reads. Nothing the browser posts is trusted
 * here beyond being *shown back*.
 */

function parseAction(raw: string | null): TicketAction {
  return raw === "sell" ? "sell" : "buy";
}

function parseOrderType(raw: string | null): TicketOrderType {
  return raw === "limit" || raw === "stop" ? raw : "market";
}

/** Blank, missing, or non-numeric all mean "no price entered" — `previewOrder` refuses a
 *  limit/stop order with an undefined price rather than treating it as valid input. */
function parsePrice(raw: string | null): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** The one priced field a request needs, keyed by which order type is selected — split out to
 *  keep `handleTrade`'s own complexity in budget. */
function priceFieldFromForm(
  orderType: TicketOrderType,
  price: number | undefined,
): { limitPrice: number | undefined } | { stopPrice: number | undefined } | Record<string, never> {
  if (orderType === "limit") return { limitPrice: price };
  if (orderType === "stop") return { stopPrice: price };
  return {};
}

/** Same idea for the submit call, but reading the already-reviewed preview's price rather than
 *  raw form input — the service re-checks fresh numbers, never the browser's own claim. */
function priceFieldFromPreview(
  preview: TicketPreview,
): { limitPrice: number } | { stopPrice: number } | Record<string, never> {
  if (preview.limitPrice !== undefined) return { limitPrice: preview.limitPrice };
  if (preview.stopPrice !== undefined) return { stopPrice: preview.stopPrice };
  return {};
}

// --- GET: the ticket view ---------------------------------------------------

/** The refusal a locked POST gets — names the rung to fill, sends nothing to the broker. */
function lockedRefusal(deps: TradeRouteDeps, res: ServerResponse, code: TradeTypeCode): void {
  const prev = ladderNeighbor(code, -1);
  refusalPage(
    deps,
    res,
    403,
    `Training wheels are on, and course ${code} hasn't been unlocked yet${
      prev ? ` — it opens after your first filled ${prev.code} (${prev.name})` : ""
    }. Nothing was sent. Turn the wheels off on the ticket to open the full catalog.`,
  );
}

// --- POST: review + execute -------------------------------------------------
//
// The option order pipeline (preview from a posted form, review, execute) lives in
// option-order-review.ts, imported below as `optionPreviewFromForm` / `handleOptionPost`.

// --- dispatch ---------------------------------------------------------------

/**
 * The training-wheels toggle POST — handled before anything order-shaped so a preference write
 * can never double as an order. Mutates only the requester's OWN record, then returns to the
 * ticket it was clicked from (`back` is ours from a hidden field, but validated anyway: a
 * constructed local path or the bare ticket, never an open redirect). True = handled.
 */
async function handleWheelsPost(
  res: ServerResponse,
  form: URLSearchParams,
  deps: TradeRouteDeps,
  requesterId: string,
): Promise<boolean> {
  const wheels = form.get("wheels");
  if (wheels !== "on" && wheels !== "off") return false;
  await deps.progression?.setWheels(requesterId, wheels === "on");
  redirectBack(res, form);
  return true;
}

/**
 * The celebration's Claim POST — marks fresh earns acknowledged so the banner shows once. Ids
 * come from our own hidden field; the service filters them to real curriculum ids regardless.
 * Handled with the wheels toggle, before anything order-shaped. True = handled.
 */
async function handleAckPost(
  res: ServerResponse,
  form: URLSearchParams,
  deps: TradeRouteDeps,
  requesterId: string,
): Promise<boolean> {
  const ack = form.get("ack");
  if (ack === null) return false;
  const ids = ack
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  await deps.progression?.acknowledge(requesterId, ids);
  redirectBack(res, form);
  return true;
}

/**
 * The Open Orders panel's Cancel button — handled with the wheels toggle and the ack claim,
 * before anything order-shaped, for the same reason: a cancel is not itself an order. A
 * cancel that the broker refuses (already filled, unknown id) is swallowed — the order's real
 * current status is whatever the next render's live `listOrders` call says, never a claim this
 * route makes on its own. True = handled.
 */
async function handleCancelOrderPost(
  res: ServerResponse,
  form: URLSearchParams,
  deps: TradeRouteDeps,
  requesterId: string,
): Promise<boolean> {
  const orderId = form.get("cancelOrder");
  if (orderId === null) return false;
  const client = deps.tradingClientFor?.(requesterId);
  if (client) {
    await client.cancelOrder(orderId).catch(() => undefined);
  }
  redirectBack(res, form);
  return true;
}

/** Handle `/trade` — GET renders the ticket, POST reviews/executes. */
export async function handleTrade(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  deps: TradeRouteDeps,
): Promise<void> {
  const method = (req.method ?? "GET").toUpperCase();
  if (method === "GET") {
    await serveTicket(res, url, deps);
    return;
  }
  if (method !== "POST") {
    res.writeHead(405, { allow: "GET, POST", "content-type": "text/plain" });
    res.end("orders are submitted by POST only");
    return;
  }
  if (!deps.requesterId) {
    refusalPage(
      deps,
      res,
      403,
      "This desk can only place orders for the account you're signed in as, and your session isn't linked to one.",
    );
    return;
  }
  const snapshot = deps.snapshotFor(deps.requesterId);
  if (!snapshot) {
    refusalPage(deps, res, 404, "Your account isn't on the board right now.");
    return;
  }

  const form = new URLSearchParams(await readBody(req));
  if (
    (await handleWheelsPost(res, form, deps, deps.requesterId)) ||
    (await handleAckPost(res, form, deps, deps.requesterId)) ||
    (await handleCancelOrderPost(res, form, deps, deps.requesterId)) ||
    (await handleCheckPost(res, form, deps, deps.requesterId))
  ) {
    return;
  }

  // THE LADDER GATE — with wheels on, a locked play is refused before ANY preview or broker
  // read. Every EXIT is exempt by construction: an option close carries no play code, and an
  // equity sell only ever closes shares actually held (this desk never shorts — `previewOrder`
  // refuses the rest), so selling is never locked behind the ladder. The 102 milestone still
  // exists; it just gates nothing — restricting how someone leaves a position would be a
  // safety bug, and a member can hold shares with no journaled fill (assignment, pre-ledger).
  // (An equity BUY is always course 101, the ladder's ever-open first rung — nothing to gate.)
  const progression = await viewerProgression(deps);
  const formPlay = tradeTypeByCode(form.get("play"));
  const isCloseShaped =
    Boolean(form.get("close")) || isOccSymbol((form.get("symbol") ?? "").trim().toUpperCase());
  if (
    formPlay &&
    OPTION_CODES.has(formPlay.code) &&
    !isCloseShaped &&
    playLocked(formPlay.code, progression)
  ) {
    lockedRefusal(deps, res, formPlay.code);
    return;
  }
  const action = parseAction(form.get("action"));

  // Options ride their own preview/confirm pair; everything else is the share desk unchanged.
  const optionReview = await optionPreviewFromForm(form, snapshot, deps);
  if (optionReview) {
    await handleOptionPost(res, form, snapshot, deps, optionReview);
    return;
  }

  const orderType = parseOrderType(form.get("ordertype"));
  const price = parsePrice(form.get("price"));
  const preview = previewOrder(
    {
      symbol: form.get("symbol") ?? "",
      quantity: Number(form.get("quantity") ?? Number.NaN),
      action,
      orderType,
      ...priceFieldFromForm(orderType, price),
    },
    ticketContext(snapshot, { tradingEnabled: deps.tradingEnabled, isSelf: true }),
  );

  const confirmed = form.get("confirm") === "1";
  if (!(confirmed && preview.ok)) {
    await reviewPage(
      res,
      "Review order — Skynet Capital",
      snapshot,
      preview,
      deps,
      deps.requesterId,
    );
    return;
  }

  if (!deps.submitTrade) {
    refusalPage(deps, res, 503, "No execution path is wired up on this deployment.");
    return;
  }
  const result: DeskTradeResult = await deps.submitTrade(
    {
      participantId: snapshot.id,
      symbol: preview.symbol,
      quantity: preview.quantity,
      action: preview.action,
      orderType: preview.orderType,
      ...priceFieldFromPreview(preview),
    },
    deps.requesterId,
  );
  if (!result.ok) {
    // The service refused on fresh numbers the browser never saw — show its reasons, not ours.
    await reviewPage(
      res,
      "Order refused — Skynet Capital",
      snapshot,
      { ...preview, ok: false, refusals: result.refusals },
      deps,
      deps.requesterId,
    );
    return;
  }
  resultRedirect(res, snapshot.id, true);
}
