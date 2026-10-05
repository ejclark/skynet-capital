import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import type { OptionLifecycleType } from "../../../src/trading/option-lifecycle";
import {
  fetchOptionLifecycle,
  type LifecycleRow,
  optionLifecycleKey,
} from "../live/option-lifecycle";
import { ConnectLink } from "./connect-link";

/**
 * WHAT HAPPENED WITHOUT AN ORDER (#3407 slice 4 — the last capability #4330 named) — the Orders
 * pane's third card: contracts that expired, were assigned, were exercised, and the share
 * settlements that pair with the last two.
 *
 * Why it exists: none of these events is an order, so none of them reaches the working-orders list
 * or the review screen, and a member whose written put was assigned overnight watched the position
 * vanish from the book with nothing anywhere saying why. The normalization and the plain-language
 * sentences have been built and specced since #468; this is the screen.
 *
 * EVERY SENTENCE IS THE SERVER'S, VERBATIM. The headline, the consequence, and above all the
 * "counted / not counted, because…" line come from `option-lifecycle-view.ts`, which reads them off
 * `option-lifecycle.ts`'s own P/L rules. Nothing is re-worded here and no number is derived here —
 * an exercise is NOT priced at $0 on purpose (the premium moved into the shares; calling it a total
 * loss would be a false negative), and a card that smoothed that over would be the honesty defect
 * the plan's criteria exist to prevent.
 *
 * Honesty rules, in the order they bind: an unlinked session and a broker that did not answer each
 * say so in words, never as an empty list reading "nothing happened" (`working-orders.tsx` holds
 * the same line); every state is a WORD plus a glyph, never a hue alone (a standing reader is
 * red/green colourblind); whether an event is in the member's P/L is said on the row itself, with
 * the reason when it is not.
 *
 * MOBILE-FIRST: at 390 the row stacks — what happened, then the contract, then the consequence,
 * then the counted line. Wider viewports only get room (`option-lifecycle.css`): the headline and
 * the when/quantity meta share a line. No concept appears that the phone did not already carry.
 * @category trading
 */

/** A glyph per event, redundant with the headline word beside it — shape AND word, never hue. */
const EVENT_GLYPH: Record<OptionLifecycleType, string> = {
  OPEXP: "⌛",
  OPASN: "⇵",
  OPEXC: "⇗",
  OPTRD: "⇄",
};

/**
 * "Today", else "Sep 18" — the event's DAY, never a clock time, and read in UTC.
 *
 * Both halves of that are corrections of the obvious version. A lifecycle activity usually carries
 * a DATE with no time of day, which `parseLifecycleActivity` normalizes to the last instant of that
 * day so it sorts after the fills it closes (`option-lifecycle.ts`). Rendering that stamp as a time
 * would print "11:59 PM" — a time the event never had, and one still in the future for most of the
 * day. Rendering it in the browser's own zone would date a 18 Sep expiry "Sep 19" for every member
 * east of UTC, which is a false claim about a settlement date rather than a formatting nicety.
 */
function whenText(at: string, now: Date): string {
  const stamp = new Date(at);
  if (Number.isNaN(stamp.getTime())) return at;
  const day = (d: Date) => d.toISOString().slice(0, 10);
  return day(stamp) === day(now)
    ? "Today"
    : stamp.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

/** "1 contract", "3 contracts" — the only word on the row this side chooses, and it chooses it for
 *  grammar alone. Every sentence that carries meaning is the server's, rendered verbatim. */
function countText(row: LifecycleRow): string {
  const noun = row.quantity === 1 ? row.unit.replace(/s$/, "") : row.unit;
  return `${row.quantity} ${noun}`;
}

function EventRow({ row, now }: { readonly row: LifecycleRow; readonly now: Date }): ReactElement {
  return (
    <li className={`lc-row lc-${row.type.toLowerCase()}`}>
      <p className="lc-head">
        <span className="lc-what">
          <span aria-hidden="true">{EVENT_GLYPH[row.type]}</span> {row.headline}
        </span>
        <span className="lc-meta">
          {countText(row)} · {whenText(row.at, now)}
        </span>
      </p>
      <p className="lc-sym">{row.display}</p>
      <p className="lc-detail">{row.detail}</p>
      {/* The P/L line, always present and always ONE server sentence: a row that IS counted says
          so, which is what makes the one that isn't read as a stated exception rather than as a
          card that only sometimes mentions P&L. The verdict and its reason arrive together, so no
          rendering here can show one without the other. */}
      <p className={row.priced ? "lc-counted" : "lc-counted lc-uncounted"}>
        <span aria-hidden="true">{row.priced ? "✓" : "◌"}</span> {row.ledger}
      </p>
      {row.price !== undefined ? (
        <p className="lc-price num">Settled at ${row.price.toFixed(2)} a share</p>
      ) : null}
    </li>
  );
}

/** @category trading */
export function OptionLifecycleCard({
  deskId,
  now,
}: {
  readonly deskId: string;
  /** Test seam only — the clock `whenText` places each event against. */
  readonly now?: Date;
}): ReactElement | null {
  // Deliberately NOT on the desk's order bus, and deliberately not polled. None of these four
  // events is an order, so no `order` frame can ever announce one — subscribing would be a second
  // EventSource per desk buying a refetch on reconnect alone. They settle on the broker's overnight
  // clock, so Query's own refetch-on-mount is the right cadence: the member sees today's events
  // when they open the pane.
  const query = useQuery({
    queryKey: optionLifecycleKey(deskId),
    queryFn: () => fetchOptionLifecycle(deskId),
    enabled: deskId !== "",
    staleTime: 60_000,
  });
  if (deskId === "" || !query.data) return null;
  const data = query.data;
  const clock = now ?? new Date();
  return (
    <section className="wr-panel lc-panel" aria-label="Expiries and assignments">
      <h3 className="wr-h">Expiries and assignments</h3>
      {!data.available ? (
        <p className="tkt-note">
          {data.reason === "unlinked" ? (
            <>
              Expiries and assignments load through your own connected account, and this session
              isn't linked to one yet — <ConnectLink />.
            </>
          ) : (
            "Couldn't reach the broker for your expiries and assignments just now — this is a read, so nothing about your positions is affected; try again shortly."
          )}
        </p>
      ) : data.rows.length === 0 ? (
        <p className="tkt-note">
          Nothing has expired, been assigned or been exercised on this account — when a contract
          ends without an order, it shows here with what it did to your position.
        </p>
      ) : (
        <>
          <ul className="wr-list lc-list">
            {data.rows.map((row) => (
              <EventRow key={row.id} row={row} now={clock} />
            ))}
          </ul>
          {data.more ? (
            <p className="tkt-note lc-more">
              The most recent {data.rows.length} are shown — your full history lives on the Activity
              page.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
