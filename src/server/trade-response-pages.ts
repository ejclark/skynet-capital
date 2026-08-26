import type { ServerResponse } from "node:http";
import { deskHref } from "../observatory/desk-tabs.js";
import { html, type TradeRouteDeps } from "./trade-ticket-route.js";

/**
 * A refusal with no account to render it against — kept plain rather than half-rendering a desk.
 * Shared by trade-routes.ts and option-order-review.ts.
 */
export function refusalPage(
  deps: TradeRouteDeps,
  res: ServerResponse,
  status: number,
  why: string,
): void {
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

/** Shared by trade-routes.ts and option-order-review.ts after a submit attempt. */
export function resultRedirect(res: ServerResponse, snapshotId: string, ok: boolean): void {
  const target = `${deskHref(snapshotId, "positions")}&n=${ok ? "submitted" : "refused"}`;
  res.writeHead(303, { location: target });
  res.end();
}
