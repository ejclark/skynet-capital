import type { ServerResponse } from "node:http";
import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import { renderTradeReviewBody } from "../observatory/trade-review-view.js";
import type { TicketPreview } from "../trading/order-ticket.js";
import { html, type TradeRouteDeps } from "./trade-ticket-route.js";

/**
 * Rendering the share desk's REVIEW screen — the one step between intent and execution, and the
 * only place `/trade` fetches a price of its own.
 *
 * Split out of `trade-routes.ts` (2026-08-28) because the route is a dispatcher and this is a
 * render, and because both of the route's review renders — the pre-confirm one and the "the
 * service refused on fresh numbers" one — need the identical quote fallback. One home means the
 * two can never drift into showing a member different numbers for the same order.
 */

/**
 * The review screen's fallback price for a symbol the account doesn't hold. `previewOrder` reads
 * its mark off an existing position, so a FIRST buy has no price at all and the screen used to
 * say the cost was unknown — the one thing a review step exists to tell you. This is a read-only
 * latest-trade lookup on the member's own connected account (the same call the options ticket
 * already makes for spot), and every failure path — no linked account, a bad symbol, a broker
 * hiccup — degrades to undefined so the screen keeps saying "unknown" rather than inventing one.
 *
 * Skipped whenever it can't help: a refused order isn't going anywhere, a priced order type is
 * struck off the trader's own limit/stop price, and a held symbol already has its mark.
 */
async function reviewQuote(
  preview: TicketPreview,
  deps: TradeRouteDeps,
  requesterId: string,
): Promise<number | undefined> {
  if (!preview.ok || preview.estPrice !== undefined || preview.orderType !== "market") {
    return undefined;
  }
  const client = deps.optionsClientFor?.(requesterId);
  if (!client) return undefined;
  return await client.getUnderlyingPrice(preview.symbol).catch(() => undefined);
}

/** Render the review screen, quoting the symbol first when that's the only way to price it. */
export async function reviewPage(
  res: ServerResponse,
  title: string,
  snapshot: ParticipantSnapshot,
  preview: TicketPreview,
  deps: TradeRouteDeps,
  requesterId: string,
): Promise<void> {
  const quotePrice = await reviewQuote(preview, deps, requesterId);
  html(
    res,
    200,
    deps.document(
      title,
      renderTradeReviewBody(snapshot, preview, {
        nav: deps.nav,
        isSelf: true,
        ...(quotePrice !== undefined ? { quotePrice } : {}),
      }),
    ),
  );
}
