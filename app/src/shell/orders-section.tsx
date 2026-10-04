import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { DeskAlerts } from "./desk-alerts";
import { OptionLifecycleCard } from "./option-lifecycle-card";
import { OptionPositionsCard, type PositionFocus } from "./option-positions";
import { WorkingOrders } from "./working-orders";

/**
 * THE ORDERS SECTION (#3407, Workbench slice 3) — the bench's fourth tool: what the account has
 * in flight and what it holds, as one pane. Working orders (cancel · modify), the Alerts strip
 * (what the positions and the orders are saying), and the option positions card (close · roll)
 * used to stack under whichever ticket was up; they are one shape of data — the account's book —
 * so they are one section, `?section=orders`. #674 "open orders live on the Trade page" holds:
 * same page, its own pane, one rail tap from the ticket at 390 and docked below it at the bench
 * width (slice 4).
 * @category trading
 */
export function OrdersSection({
  deskId,
  focus,
}: {
  readonly deskId: string;
  /** A held contract the position guidance handed off — see `PositionFocus`. */
  readonly focus?: PositionFocus;
}): ReactElement {
  const desk = useQuery({
    queryKey: ["desk", deskId],
    queryFn: () => fetchDesk(deskId),
    enabled: deskId !== "",
  });
  return (
    <div className="orders-section">
      <WorkingOrders deskId={deskId} />
      <DeskAlerts deskId={deskId} />
      {desk.data ? (
        <OptionPositionsCard
          deskId={deskId}
          positions={desk.data.desk.positions}
          {...(focus ? { focus } : {})}
        />
      ) : null}
      {/* Last in the pane, and deliberately after the holdings (#3407 slice 4): what the account
          HAS leads, what has already happened to it follows. The card is what closes the loop the
          positions card opens — a contract that leaves the book without an order now has a line
          saying why it left and what that did to the P/L. */}
      <OptionLifecycleCard deskId={deskId} />
    </div>
  );
}
