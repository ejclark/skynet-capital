import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { WirePlayItem } from "../live/wire";

/**
 * ONE AUTHORED-PLAYBOOK MILESTONE on the Activity feed (#5457 slice 5, #809 slice 6) — the fifth
 * sibling of the trade, filing, merge and earn rows. A member's play started its shadow test, passed
 * it, began trading, or was paused; the bot that runs it is the name on the row, as on a trade.
 *
 * Same contract as the others: the leading KIND WORD plus icon ("Testing", "Passed", "Trading",
 * "Paused") says what the row is, and the icon never carries it alone (`docs/BRAND.md` →
 * Accessibility). A pass and a first promotion are celebrated with the accent rule (positive
 * reinforcement); a pause is reported plainly. The rule is decoration — the word is the signal.
 *
 * Honest by construction rather than here: the server writes the sentence (`play-feed-words.ts`),
 * never claims a return, and every row carries the "SIM · unvalidated" label in its meta.
 */
export function PlayRow({ play }: { readonly play: WirePlayItem }): ReactElement {
  return (
    <li className={play.cheer ? "wire-play wire-play-cheer" : "wire-play"}>
      <span className="wire-filing-kind">
        <span aria-hidden="true">{play.icon}</span> {play.kindLabel}
      </span>
      <Link to="/u/$id" params={{ id: play.whoId }} className="wire-who">
        {play.who}
      </Link>
      <span className="wire-play-text">{play.text}</span>
      <span className="wire-fdbk-meta num">{play.meta}</span>
    </li>
  );
}
