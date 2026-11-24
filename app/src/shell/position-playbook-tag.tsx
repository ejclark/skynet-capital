import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { botPlaybooks, CARD_WORDS, type PlaybookCard } from "../live/bot-playbooks";
import type { DeskPosition } from "../live/desk";
import { landingCard, landingForPosition } from "../live/playbook-landing";
import { playbookName } from "../live/playbook-name";
import { useHeartbeat } from "./heartbeat";

/**
 * WHICH PLAYBOOK OPENED THIS POSITION (#5073 slice 4b — #5037 round 2, R2-pos: "a position's footer
 * names its playbook… landing on the playbook's card open with one way back"). One line in the
 * row's footer, under the guidance line: "Opened by ◷ the wheel on CRWV · waiting ›". The name and one
 * state word, nothing more (Eric's 0e71d5f8: progressive reveal) — the card it opens says the rest.
 *
 * The server sends the playbook only when one playbook's orders account for the whole position
 * (`position-opened-by.ts`), and since #8254 on every signed-in member's copy of a bot, not just the
 * owner's. The card landing is the owner's alone: `/accounts` resolves only accounts the viewer
 * owns, so anyone else's tap there landed on their own Overview (#8396). A member who does not own
 * the bot follows the tag to its Playbooks page instead (`/u/$id/playbooks`), which any member can
 * read, each card named by its strategy, its landing still the owner's. The state word is the card's own,
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
  owned,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  /** The playbook's card on this bot now, for its state word; absent when it has none. */
  readonly card?: PlaybookCard;
  /** Does the viewer own this bot? Only the owner's tag lands on the card on `/accounts` (#8396). */
  readonly owned: boolean;
}): ReactElement | null {
  const landing = landingForPosition(position);
  if (!landing) return null;
  const words = card ? CARD_WORDS[card.state] : undefined;
  const said = `Opened by ${playbookName(landing.card)}${words ? `, ${words.word.toLowerCase()}` : ""}`;
  const face = (
    <>
      {words ? <span aria-hidden="true">{words.glyph} </span> : null}
      <span className="pos-pb-name">{playbookName(landing.card)}</span>
      {words ? <span className="pos-pb-word"> · {words.tag}</span> : null}
      <span className="pos-pb-chev" aria-hidden="true">
        {" ›"}
      </span>
    </>
  );
  return (
    <p className="pos-pb">
      <span className="pos-pb-label">Opened by</span>{" "}
      {owned ? (
        <Link
          className="pos-pb-tag"
          data-state={card?.state}
          to="/accounts"
          search={{ account: deskId, section: "playbooks", ...landing }}
          aria-label={`${said} — open its card on Playbooks`}
        >
          {face}
        </Link>
      ) : (
        <Link
          className="pos-pb-tag"
          data-state={card?.state}
          to="/u/$id/playbooks"
          params={{ id: deskId }}
          aria-label={`${said} — open this bot's Playbooks`}
        >
          {face}
        </Link>
      )}
    </p>
  );
}
