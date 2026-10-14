import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { ActivityReasoning, DeskActivityEvent } from "../live/desk";
import { pivotLine } from "../live/order-pivots";
import { orderPlay } from "../live/order-play";
import { landingFor } from "../live/playbook-landing";
import { quoteQuery } from "../live/quote-query";
import { cycleAnchor } from "./cycle-anchor";
import { PivotLine } from "./pivot-line";

/**
 * AN ORDER, OPENED IN PLACE (#5262; settled on #5160, rounds 8–16) — the same view under a phone's
 * card and under a desk table's row; the desk puts the picture left and the table right.
 *  - the picture: the pivots, the price line, the outcome at expiry split by the strike
 *    (`pivot-line.tsx`) — for any order with a play (`orderPlay`: a single option or bought shares
 *    that opened a position); a spread, a closing fill or a report draws none;
 *  - the table, in round 16's order ("Which strategy triggered the trade feels like the first
 *    information to show, followed up by the why"): Placed by — who, the playbook (the owner's
 *    alone, #885), the round — then Why, then the broker's words or the guards' change when there
 *    are any. The order in words, its cost, the strategy, the plan and what proves it wrong left
 *    this view; Full detail keeps them (`order-deep-dive.tsx`).
 * No P/L here (#5160's IA call): the row above already says what a closing fill booked.
 */
export function OpenedOrder({
  event,
  showPlaybook,
  deskId,
  onDetail,
  wide = false,
}: {
  readonly event: DeskActivityEvent;
  readonly showPlaybook: boolean;
  readonly deskId?: string | undefined;
  readonly onDetail?: ((orderId: string) => void) | undefined;
  /** The desk's row: the picture beside the table rather than above it. */
  readonly wide?: boolean;
}): ReactElement {
  const play = orderPlay(event);
  const underlying =
    play?.kind === "option" ? play.occ.underlying : play?.kind === "shares" ? play.symbol : "";
  const quote = useQuery(quoteQuery(underlying));
  const now = quote.data && "last" in quote.data ? quote.data.last : undefined;
  const why = event.reasoning;
  return (
    <div className={`oo${wide && play ? " oo-wide" : ""}`}>
      {play ? <PivotLine line={pivotLine(play)} {...(now === undefined ? {} : { now })} /> : null}
      {why ? (
        <OrderTable
          why={why}
          showPlaybook={showPlaybook}
          orderId={event.orderId}
          {...(deskId ? { deskId } : {})}
        />
      ) : null}
      {onDetail && !event.lifecycle ? (
        <button type="button" className="act-full" onClick={() => onDetail(event.orderId)}>
          Full detail <span aria-hidden="true">›</span>
        </button>
      ) : null}
    </div>
  );
}

function OrderTable({
  why,
  showPlaybook,
  deskId,
  orderId,
}: {
  readonly why: ActivityReasoning;
  readonly showPlaybook: boolean;
  readonly deskId?: string;
  /** The order this why belongs to — its playbook link's way back lands on its row. */
  readonly orderId: string;
}): ReactElement {
  const playbook = showPlaybook ? why.playbookId : undefined;
  return (
    <dl className="more-grid why-grid oo-table">
      <div>
        <dt>Placed by</dt>
        <dd className="oo-placed">
          <span>{why.personaId}</span>
          {playbook ? (
            <PlaybookLine
              why={why}
              playbookId={playbook}
              orderId={orderId}
              {...(deskId ? { deskId } : {})}
            />
          ) : null}
          <RoundLine why={why} {...(deskId ? { deskId } : {})} />
        </dd>
      </div>
      <div>
        <dt>Why</dt>
        <dd>“{why.reason}”</dd>
      </div>
      {/* Only on an order that never traded (the server's `brokerWordsFor`), and the owner's alone
          like the playbook (#4650): a broker's message can name the account's specifics. */}
      {showPlaybook && why.brokerReason ? (
        <div>
          <dt>Broker said</dt>
          <dd>{why.brokerReason}</dd>
        </div>
      ) : null}
      {why.guardDelta ? (
        <div>
          <dt>Risk guards</dt>
          <dd>{why.guardDelta}</dd>
        </div>
      ) : null}
    </dl>
  );
}

/** THE PLAYBOOK, AS A WAY IN (#5073 slice 4a — #5037 round 2, R2-act). On one account's ledger the
 *  playbook that placed the order links to its card on Playbooks: that card arrives open, this
 *  order's mark ringed on its lane, with one way back to this row. A merged ledger (All accounts)
 *  has no account to send the reader to, so the name stays plain words, like the round's link. */
function PlaybookLine({
  why,
  playbookId,
  deskId,
  orderId,
}: {
  readonly why: ActivityReasoning;
  readonly playbookId: string;
  readonly deskId?: string;
  readonly orderId: string;
}): ReactElement {
  const words = `${playbookId}${why.playbookMode ? ` · ${why.playbookMode}` : ""}`;
  if (!deskId) return <span>{words}</span>;
  const { card, mode, fill, from } = landingFor({ ...why, playbookId }, orderId);
  return (
    <Link
      className="door-link"
      to="/accounts"
      search={{ account: deskId, section: "playbooks", card, mode, fill, from }}
      aria-label={`${words} — open its card on Playbooks`}
    >
      {words} ›
    </Link>
  );
}

/** THE REST OF THE ROUND (#3961) — a fill is one decision out of a pass that usually weighed
 *  several: siblings it rejected or skipped, ideas the risk guards refused outright. The count
 *  rides here because it is the one number that says how much was weighed; the round itself stays
 *  one link away on Heartbeat rather than being copied into this row (`docs/IA.md` §8.1 — one home
 *  per fact, a joint renders as a row or a link). Both halves are absent for a fill whose decision
 *  predates the round being addressable, never faked. The link wears `door-link` — the house's
 *  "these words are the way in" style, accent AND underline, never the hue alone (docs/BRAND.md). */
function RoundLine({
  why,
  deskId,
}: {
  readonly why: ActivityReasoning;
  readonly deskId?: string;
}): ReactElement | null {
  const anchor = why.cycleAt ? cycleAnchor(why.cycleAt) : undefined;
  const counted =
    why.rawCount !== undefined && why.guardedCount !== undefined
      ? `${why.rawCount} idea${why.rawCount === 1 ? "" : "s"} → ${why.guardedCount} past the guards`
      : undefined;
  if (!(counted || (anchor && deskId))) return null;
  return (
    <span className="oo-round">
      {counted}
      {counted && anchor && deskId ? " · " : null}
      {anchor && deskId ? (
        <Link className="door-link" to="/u/$id/playbooks" params={{ id: deskId }} hash={anchor}>
          the whole pass
        </Link>
      ) : null}
    </span>
  );
}
