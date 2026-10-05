import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { WireMilestoneItem } from "../live/wire";

/**
 * ONE MEMBER'S EARNED MILESTONE on the Activity feed (#784 slice 5) — the fourth sibling of the
 * trade, filing and merge rows, and the last kind #784 set out to put on one list.
 *
 * Same contract as the other three: the row leads with its KIND WORD plus icon ("Earned"), so the
 * feed's left edge says what each row is without reading across, and the icon never carries that
 * alone (`docs/BRAND.md` → Accessibility). The member's name links to their standing exactly as a
 * trade row's does — an earn is about a person, unlike a merge.
 *
 * The one thing it does that the others do not is CELEBRATE, and on purpose: an earned milestone is
 * the behavior this league exists to reward (`CLAUDE.md` → positive reinforcement — the fanfare budget
 * goes to what goes right). The celebration is a left accent rule on the card, which is decoration,
 * never the signal: the word says "Earned" whether or not a reader can see the accent.
 *
 * Honest by construction rather than by this component: the server only sends an earn a fill (or a
 * fill's expiry or close) proved, for a member on the roster (`milestone-event-feed.ts`). The row
 * shows points only when the course score counts them.
 */
export function MilestoneRow({ earn }: { readonly earn: WireMilestoneItem }): ReactElement {
  return (
    <li className="wire-earn">
      <span className="wire-filing-kind">
        <span aria-hidden="true">{earn.icon}</span> {earn.kindLabel}
      </span>
      <Link to="/u/$id" params={{ id: earn.whoId }} className="wire-who">
        {earn.who}
      </Link>
      <span className="wire-earn-title">{earn.title}</span>
      <span className="wire-fdbk-meta num">{earn.meta}</span>
    </li>
  );
}
