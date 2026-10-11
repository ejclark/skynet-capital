import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { botPlaybooks, CARD_WORDS, type PlaybookCard } from "../live/bot-playbooks";
import type { DeskPosition } from "../live/desk";
import { landingCard, landingForPosition } from "../live/playbook-landing";
import { useHeartbeat } from "./heartbeat";

/**
 * WHICH PLAYBOOK OPENED THIS POSITION (#5073 slice 4b — #5037 round 2, R2-pos: "a position's footer
 * names its playbook… landing on the playbook's card open with one way back"). One line in the
 * row's footer, under the guidance line: "Opened by ◷ CRWV-WHEEL · waiting ›". The name and one
 * state word, nothing more (Eric's 0e71d5f8: progressive reveal) — the card it opens says the rest.
 *
 * The server sends the playbook only on the bot owner's copy, and only when one playbook's orders
 * account for the whole position (`position-opened-by.ts`). The state word is the card's own,
 * read from the same heartbeat query the head line already keeps warm; a playbook with no card on
 * this bot now (switched off, or gone) is named without one, and its card's landing says why.
 */

/** Each position's playbook card, by symbol — read only when some position names a playbook. */
export function usePlaybookCards(
  deskId: string,
  positions: readonly DeskPosition[],
): (position: DeskPosition) => PlaybookCard | undefined {
  const named = positions.some((p) => p.playbookId);
  const heartbeat = useHeartbeat(deskId, named);
  const cards = heartbeat.data?.available ? botPlaybooks(heartbeat.data.heartbeat).cards : [];
  return (position) => {
    const landing = landingForPosition(position);
    return landing ? landingCard(cards, landing) : undefined;
  };
}

export function PositionPlaybookTag({
  deskId,
  position,
  card,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  /** The playbook's card on this bot now, for its state word; absent when it has none. */
  readonly card?: PlaybookCard;
}): ReactElement | null {
  const landing = landingForPosition(position);
  if (!landing) return null;
  const words = card ? CARD_WORDS[card.state] : undefined;
  return (
    <p className="pos-pb">
      <span className="pos-pb-label">Opened by</span>{" "}
      <Link
        className="pos-pb-tag"
        data-state={card?.state}
        to="/accounts"
        search={{ account: deskId, section: "playbooks", ...landing }}
        aria-label={`Opened by ${landing.card}${words ? `, ${words.word.toLowerCase()}` : ""} — open its card on Playbooks`}
      >
        {words ? <span aria-hidden="true">{words.glyph} </span> : null}
        <span className="pos-pb-name">{landing.card}</span>
        {words ? <span className="pos-pb-word"> · {words.tag}</span> : null}
        <span className="pos-pb-chev" aria-hidden="true">
          {" ›"}
        </span>
      </Link>
    </p>
  );
}
