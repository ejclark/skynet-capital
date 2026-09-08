import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { type DeskActivityEvent, fetchDeskActivity } from "../live/desk";
import { EventLine } from "./timeline-drawer";

/**
 * THE RECENT-ORDERS STRIP (#2017 Phase 1 slice 13, task 3a) — a compact, non-modal "here's what
 * you've done" intel strip on the trade ticket itself, reusing `TimelineDrawer`'s exact data path
 * (`["desk-activity", deskId]` / `fetchDeskActivity`) and its exported `EventLine` row component
 * verbatim — no re-derivation of fill-history markup, same DRY discipline the earnings badge and
 * the wire-row slice both followed. Sharing the query key means a desk that has both this strip
 * and the drawer mounted shares one cached fetch instead of duplicating the network call.
 *
 * EXACT-SYMBOL MATCH, NOT UNDERLYING-AWARE: unlike `WireRow` (who-else-traded, #2017 Phase 1 slice
 * 12), which matches by underlying via `parseOccSymbol` because it answers "who else traded ANY
 * NVDA contract", this strip answers a narrower question — "what did *I* just do with the EXACT
 * instrument in front of me" — so `e.symbol === symbol` (the raw broker symbol, an OCC symbol for
 * an option) is the correct, narrower match here. Do not import the wire-row's underlying-matching
 * logic into this component; it solves a different problem.
 *
 * 3B IS OUT OF SCOPE: joining `decisionContextFor` (src/observatory/decision-context.ts) to explain
 * *why* an order fired is explicitly gated on the filed audit-dir hosting decision
 * (`docs/GAPS-2026-08.md`) and is not part of this slice — this renders the bare order list only.
 * @category trading
 */

const DISPLAY_CAP = 3;

export function RecentOrdersStrip({
  deskId,
  symbol,
}: {
  readonly deskId: string;
  readonly symbol: string;
}): ReactElement | null {
  const query = useQuery({
    queryKey: ["desk-activity", deskId],
    queryFn: () => fetchDeskActivity(deskId),
    enabled: deskId !== "" && symbol !== "",
    staleTime: 30_000,
  });

  if (deskId === "" || symbol === "" || !query.data) return null;

  if (!query.data.available) {
    return (
      <section className="wr-panel">
        <h3 className="wr-h">Your recent orders</h3>
        <p className="tkt-note">No durable activity ledger is wired in this deployment.</p>
      </section>
    );
  }

  const events: readonly DeskActivityEvent[] = query.data.activity.filter(
    (e) => e.symbol === symbol,
  );
  const shown = events.slice(0, DISPLAY_CAP);
  const remaining = events.length - shown.length;

  return (
    <section className="wr-panel">
      <h3 className="wr-h">Your recent orders</h3>
      {events.length === 0 ? (
        // This component gets only the raw `symbol` (an OCC symbol for an option, not a humanized
        // display name) — shown as-is rather than threading a separate humanized string through,
        // keeping the caller contract simple.
        <p className="tkt-note">No recorded orders for {symbol} in the ledger's window.</p>
      ) : (
        <>
          <ul className="wr-list">
            {shown.map((event) => (
              <EventLine key={`${event.orderId}-${event.at}`} event={event} />
            ))}
          </ul>
          {remaining > 0 ? <p className="wr-more">+{remaining} more</p> : null}
        </>
      )}
    </section>
  );
}
