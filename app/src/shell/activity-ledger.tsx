import type { ReactElement } from "react";
import type { DeskActivityEvent } from "../live/desk";
import { ActivityCards } from "./activity-cards";
import { ActivityTable } from "./activity-table";
import { useMediaQuery } from "./use-media";
import { PHONE_QUERY } from "./widths";

/**
 * AN ACCOUNT'S ORDERS, AT EITHER WIDTH (#5101). At or below the phone width the ledger is one card
 * an order under day headers (`activity-cards.tsx`); above it, the desk table (`activity-table.tsx`)
 * — the desktop adds room, never new concepts. One of the two is mounted, never both, so each
 * order's `id="act-<orderId>"` exists once and a link to it lands on the layout on screen. Where
 * `matchMedia` is missing the table is the default, as everywhere else (`use-media.ts`).
 */
export function ActivityLedger(props: {
  readonly events: readonly DeskActivityEvent[];
  readonly showPlaybook?: boolean;
  readonly deskId?: string;
}): ReactElement {
  const phone = useMediaQuery(PHONE_QUERY);
  return phone ? <ActivityCards {...props} /> : <ActivityTable {...props} />;
}
