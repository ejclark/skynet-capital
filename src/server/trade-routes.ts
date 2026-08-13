import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { ticketContext } from "../observatory/desk-data.js";
import { deskHref } from "../observatory/desk-tabs.js";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { renderTradeReviewBody } from "../observatory/trade-review-view.js";
import { previewOrder, type TicketAction } from "../trading/order-ticket.js";
import { readBody } from "./page-shell.js";
import type { DeskTradeResult, SubmitDeskTrade } from "./trade-service.js";

/**
 * `/trade` — the desk's one write route, and deliberately the only one.
 *
 * Two POSTs, one URL: the first renders the review screen, the second (carrying `confirm=1`)
 * executes. GET does nothing at all — an order must never be a link someone can be tricked into
 * following, and must never replay on a refresh or a back button.
 *
 * The route is a thin shell on purpose: it parses a form, asks the pure ticket rules what it may
 * do, and hands anything real to `trade-service.ts`, which re-validates everything server-side
 * against a fresh account read. Nothing the browser posts is trusted here beyond being *shown back*.
 */

export interface TradeRouteDeps {
  /** The board snapshot for a participant id, from the live hub. */
  readonly snapshotFor: (id: string) => ParticipantSnapshot | undefined;
  /** Who the caller's session resolves to. Undefined = no identity = no trading. */
  readonly requesterId: string | undefined;
  readonly tradingEnabled: boolean;
  /** Absent when the deployment wires no execution path at all (offline/export builds). */
  readonly submitTrade?: SubmitDeskTrade;
  readonly nav: NavContext;
  readonly document: (title: string, body: string) => string;
}

function html(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
  res.end(body);
}

function parseAction(raw: string | null): TicketAction {
  return raw === "sell" ? "sell" : "buy";
}

/** A refusal with no account to render it against — kept plain rather than half-rendering a desk. */
function refusalPage(deps: TradeRouteDeps, res: ServerResponse, status: number, why: string): void {
  html(
    res,
    status,
    deps.document(
      "Order refused — Skynet Capital",
      `<section style="max-width:560px;margin:0 auto;padding:48px 20px;font-family:system-ui,sans-serif;color:#E6EDF3">
      <h1 style="font-size:20px;margin-bottom:12px">Order refused</h1>
      <p style="color:#8B9AAB;line-height:1.6">${why}</p>
      <p style="margin-top:20px"><a style="color:#35D0BA" href="/">← Back to the board</a></p>
    </section>`,
    ),
  );
}

function resultRedirect(res: ServerResponse, snapshotId: string, result: DeskTradeResult): void {
  const target = `${deskHref(snapshotId, "positions")}&n=${result.ok ? "submitted" : "refused"}`;
  res.writeHead(303, { location: target });
  res.end();
}

/**
 * Handle `POST /trade`. Returns true when the request was this route's to answer, so the caller
 * can fall through to its own 404 for everything else.
 */
export async function handleTrade(
  req: IncomingMessage,
  res: ServerResponse,
  deps: TradeRouteDeps,
): Promise<void> {
  if ((req.method ?? "GET").toUpperCase() !== "POST") {
    res.writeHead(405, { allow: "POST", "content-type": "text/plain" });
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
  const preview = previewOrder(
    {
      symbol: form.get("symbol") ?? "",
      quantity: Number(form.get("quantity") ?? Number.NaN),
      action: parseAction(form.get("action")),
    },
    ticketContext(snapshot, { tradingEnabled: deps.tradingEnabled, isSelf: true }),
  );

  const confirmed = form.get("confirm") === "1";
  if (!(confirmed && preview.ok)) {
    html(
      res,
      200,
      deps.document(
        "Review order — Skynet Capital",
        renderTradeReviewBody(snapshot, preview, { nav: deps.nav, isSelf: true }),
      ),
    );
    return;
  }

  if (!deps.submitTrade) {
    refusalPage(deps, res, 503, "No execution path is wired up on this deployment.");
    return;
  }
  const result = await deps.submitTrade(
    {
      participantId: snapshot.id,
      symbol: preview.symbol,
      quantity: preview.quantity,
      action: preview.action,
    },
    deps.requesterId,
  );
  if (!result.ok) {
    // The service refused on fresh numbers the browser never saw — show its reasons, not ours.
    html(
      res,
      200,
      deps.document(
        "Order refused — Skynet Capital",
        renderTradeReviewBody(
          snapshot,
          { ...preview, ok: false, refusals: result.refusals },
          { nav: deps.nav, isSelf: true },
        ),
      ),
    );
    return;
  }
  resultRedirect(res, snapshot.id, result);
}
