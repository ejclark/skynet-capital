import type { ServerResponse } from "node:http";
import { deskHref } from "../observatory/desk-tabs.js";
import { html, type TradeRouteDeps } from "./trade-ticket-route.js";

/**
 * The local path a hidden `back` field names, or `/trade` — constructed, never an open redirect.
 * Backslashes are rejected outright (browsers' URL parsers treat a backslash as a slash, so
 * `/\evil.example` would slip a single-slash prefix check and hop off-site), and so are control
 * characters — a decoded `%0a` in a Location value makes `writeHead` throw, which nothing above
 * catches.
 *
 * One copy, because every POST that returns a member to where they were needs the same answer:
 * the wheels toggle, the celebration claim, and the comprehension check.
 */
export function localBack(raw: string | null): string {
  const back = raw ?? "";
  const local =
    // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting them IS the point
    back.startsWith("/") && !back.startsWith("//") && !/[\\\u0000-\u001F\u007F]/.test(back);
  return local ? back : "/trade";
}

/** 303 back to the local path a hidden `back` field names. */
export function redirectBack(res: ServerResponse, form: URLSearchParams): void {
  res.writeHead(303, { location: localBack(form.get("back")) });
  res.end();
}

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
