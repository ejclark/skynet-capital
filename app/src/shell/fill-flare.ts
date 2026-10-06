import { useEffect, useRef } from "react";
import type { DeskOrderEvent } from "../live/desk-events";
import { flareTower } from "./tower-bus";

/**
 * THE FILL FLARE (#3977 slice 3): an order you placed on the ticket fills, and the tower answers it
 * once, beside the ticket's own "Order … filled — 10 AAPL @ $187.20" line (`fill-headline.ts`). A
 * fill is the member's own plan carried out, so it earns the moment whatever the price did; the
 * words beside it carry the numbers, the tower only says "it happened".
 *
 * WHO MAY SEE IT. The event comes from the desk's own stream (`/api/trade/events`), which the server
 * narrows to the session's own accounts and to the owner's visibility tiers with `forVisibility`
 * (#1211; `src/server/desk-events-route.ts`) — another member's fill never reaches this page. This
 * hook narrows again to the one order this ticket submitted (`useOrderFill`) and to a completed
 * fill: an accepted, partial or cancelled order is not a fill and flares nothing.
 *
 * ONCE PER ORDER. A reconnect or a re-render hands the same fill back; the order id is remembered
 * for the life of the ticket so the Eye answers it one time. Reduced motion, a paused tower and a
 * phone (no tower mounted) all tell no frame — `flareTower` owns those rules.
 */
export function isCompletedFill(fill: DeskOrderEvent | undefined): fill is DeskOrderEvent {
  return fill?.eventType === "order.filled" && fill.outcome === "success";
}

export function useFillFlare(fill: DeskOrderEvent | undefined): void {
  const flared = useRef(new Set<string>());
  const orderId = isCompletedFill(fill) ? fill.orderId : undefined;
  useEffect(() => {
    if (orderId === undefined || flared.current.has(orderId)) return;
    flared.current.add(orderId);
    flareTower("fill");
  }, [orderId]);
}
