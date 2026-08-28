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
 * Skipped whenever it can't help: an order the ticket rules turned away isn't going anywhere, a
 * priced order type is struck off the trader's own limit/stop price, and a held symbol already
 * has its mark.
 */
async function reviewQuote(
  preview: TicketPreview,
  deps: TradeRouteDeps,
  requesterId: string,
  quotable: boolean,
): Promise<number | undefined> {
  if (!quotable || preview.estPrice !== undefined || preview.orderType !== "market") {
    return undefined;
  }
  const client = deps.optionsClientFor?.(requesterId);
  if (!client) return undefined;
  return await client.getUnderlyingPrice(preview.symbol).catch(() => undefined);
}

export interface ReviewPageOptions {
  readonly title: string;
  readonly snapshot: ParticipantSnapshot;
  /** What to render — on the post-submit path this carries the service's refusals. */
  readonly preview: TicketPreview;
  readonly deps: TradeRouteDeps;
  readonly requesterId: string;
  /**
   * Whether the ORDER is worth pricing — a property of the order, not of this render. Defaults
   * to the preview's own verdict; the post-submit refusal path passes `true` explicitly, because
   * that order DID pass the ticket rules and only the broker's fresh numbers turned it down.
   * Without that, a member who was just shown "≈ $51,250" would see the refusal screen quote the
   * same order as "unknown until it fills" — the two renders disagreeing about one order.
   */
  readonly quotable?: boolean;
}

/** Render the review screen, quoting the symbol first when that's the only way to price it. */
export async function reviewPage(res: ServerResponse, options: ReviewPageOptions): Promise<void> {
  const { title, snapshot, preview, deps, requesterId } = options;
  const quotePrice = await reviewQuote(preview, deps, requesterId, options.quotable ?? preview.ok);
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
