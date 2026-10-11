import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { DeskActivityEvent } from "../live/desk";
import { ActivityCards } from "./activity-cards";
import { ActivityTable } from "./activity-table";
import { OrderDeepDive } from "./order-deep-dive";
import { useMediaQuery } from "./use-media";
import { BENCH_QUERY, PHONE_QUERY, TABLET_QUERY } from "./widths";

/**
 * AN ACCOUNT'S ORDERS, AT EITHER WIDTH (#5101). At or below the phone width the ledger is one card
 * an order under day headers (`activity-cards.tsx`); above it, the desk table (`activity-table.tsx`)
 * — the desktop adds room, never new concepts. One of the two is mounted, never both, so each
 * order's `id="act-<orderId>"` exists once and a link to it lands on the layout on screen. Where
 * `matchMedia` is missing the table is the default, as everywhere else (`use-media.ts`).
 *
 * THE DEEP DIVE (#5101, R2-deep): with `detail` naming a loaded order, its full detail opens — on a
 * desktop as a non-modal side panel beside the list (the list stays live; from 1280 it docks in the
 * frame's own right-hand column), at tablet width and below as a page in the list's place. Closing it brings the member back to the same row, opened as they
 * left it, with focus on its control. A `detail` the loaded rows do not hold opens nothing: the list
 * stays, and the page's own note says the linked order is older than what is loaded.
 */
export function ActivityLedger({
  events,
  showPlaybook = true,
  deskId,
  detail,
  onDetail,
}: {
  readonly events: readonly DeskActivityEvent[];
  readonly showPlaybook?: boolean;
  readonly deskId?: string;
  /** The order whose full detail is open (the URL's `?order=`). */
  readonly detail?: string | undefined;
  /** Opens (an id) or closes (undefined) an order's full detail; absent, the ledger has no door. */
  readonly onDetail?: (orderId: string | undefined) => void;
}): ReactElement {
  const phone = useMediaQuery(PHONE_QUERY);
  const narrow = useMediaQuery(TABLET_QUERY);
  const bench = useMediaQuery(BENCH_QUERY);
  const opened =
    onDetail && detail ? events.find((e) => e.orderId === detail && !e.lifecycle) : undefined;
  const reopen = useReturnTo(opened?.orderId);
  const shared = { events, showPlaybook, ...(deskId ? { deskId } : {}) };
  const door = onDetail ? { onDetail: (orderId: string) => onDetail(orderId) } : {};
  const back = reopen ? { reopen } : {};
  const list = phone ? (
    <ActivityCards {...shared} {...door} {...back} />
  ) : (
    <ActivityTable
      {...shared}
      {...door}
      {...back}
      {...(opened ? { detail: opened.orderId } : {})}
    />
  );
  const dive =
    opened && onDetail ? (
      <OrderDeepDive
        key={opened.orderId}
        event={opened}
        variant={narrow ? "page" : "panel"}
        showPlaybook={showPlaybook}
        onClose={() => onDetail(undefined)}
      />
    ) : null;
  // One tree whether or not a detail is open, so a panel opening beside the table never remounts
  // it (its opened rows and its place stay); a page takes the list's own slot. From the bench width
  // the frame already keeps a column beside the stage (the tower's, `tower-column.css`), and the
  // panel docks there, so the list keeps its full width; between tablet and bench the list makes
  // room for it.
  // Docked, the panel is portalled to the body: the stage is a size container (`cqw` widths), and a
  // container is the containing block of anything fixed inside it, so it could not reach the column.
  const paged = dive !== null && narrow;
  const split = dive !== null && !narrow && !bench;
  const docked =
    dive && bench && !narrow && typeof document !== "undefined"
      ? createPortal(<div data-docked="">{dive}</div>, document.body)
      : null;
  return (
    <div className={split ? "act-split" : "act-ledger"}>
      <div className="act-split-list">{paged ? dive : list}</div>
      {paged || docked ? null : dive}
      {docked}
    </div>
  );
}

/** The order whose detail just closed — remembered so its row comes back opened, and focus lands
 *  on the row's own control (the card's head, the row's chevron) once the list has rendered. */
function useReturnTo(opened: string | undefined): string | undefined {
  // Derived during render, not in an effect: the list that comes back must mount with the row
  // already opened, since a card reads its opened state once, when it mounts.
  const [seen, setSeen] = useState(opened);
  const [returned, setReturned] = useState<string | undefined>(undefined);
  if (opened !== seen) {
    setSeen(opened);
    setReturned(opened ? undefined : seen);
  }
  useEffect(() => {
    if (!returned) return;
    const row = document.getElementById(`act-${returned}`);
    row?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [returned]);
  return returned;
}
