import type { ReactElement } from "react";
import { useLayoutEffect, useRef } from "react";
import type { MpMessage } from "../live/moneypenny";
import type { Move } from "../live/moneypenny-moves";
import { Message } from "./mp-message";

/**
 * A PARKED CARD AND ITS OWN BUTTONS, AS ONE OBJECT (#7614). A card she drafts (a filing, a view, a
 * follow-up, a research question) waits on the member's answer. Its exits used to sit in the dock's
 * moves row, under the conversation and above the box, a scroll away from the card they act on;
 * with two cards in the history it was not clear which one "Submit" would file. Now the buttons are
 * the bottom edge of the card itself: one border, one fill, nothing between them.
 *
 * Proximity carries the link, never a tint alone (BRAND.md → Accessibility): the shared border and
 * the card's own fill wrap both. The buttons stick to the pane's bottom while any of the card is in
 * view (`mp-card.css`), so a card taller than the compact pane still shows them; and when the card
 * gets its buttons while scrolled wholly out of view, the list scrolls just far enough to show it.
 * @category feedback
 */

/** Where the list should sit to show a card it cannot see, or undefined when some of it shows.
 *  Above the view: its top goes to the pane's top. Below: its bottom goes to the pane's bottom,
 *  unless it is taller than the pane, when its top leads (the sticky buttons still show). */
export function revealCard(
  card: { readonly top: number; readonly height: number },
  view: { readonly scrollTop: number; readonly height: number },
): number | undefined {
  const bottom = card.top + card.height;
  const viewBottom = view.scrollTop + view.height;
  if (bottom > view.scrollTop && card.top < viewBottom) return undefined;
  const topFirst = Math.max(0, card.top - 8);
  if (card.top < view.scrollTop) return topFirst;
  return Math.min(topFirst, bottom + 8 - view.height);
}

/** The newest card in the conversation on screen: the one a parked answer acts on. */
export function cardIndex(messages: readonly MpMessage[]): number {
  return messages.findLastIndex((m) => m.role === "draft");
}

export function ParkedCard({
  m,
  moves,
  onMove,
}: {
  readonly m: MpMessage;
  readonly moves: readonly Move[];
  readonly onMove: (m: Move) => void;
}): ReactElement {
  const card = useRef<HTMLDivElement>(null);
  const live = moves.length > 0;

  // The card just got its buttons: if the member cannot see it, bring it into the pane.
  useLayoutEffect(() => {
    const el = card.current;
    const list = el?.closest<HTMLElement>(".mp-list");
    if (!(live && el && list)) return;
    const to = revealCard(
      { top: el.offsetTop, height: el.offsetHeight },
      { scrollTop: list.scrollTop, height: list.clientHeight },
    );
    if (to !== undefined) list.scrollTop = to;
  }, [live]);

  return (
    <div className="mp-card" data-live={live ? "" : undefined} ref={card}>
      <Message m={m} />
      {live ? (
        <ul className="mp-card-moves" aria-label="This card's choices">
          {moves.map((mv) => (
            <li key={mv.label}>
              <button type="button" className="mp-move" onClick={() => onMove(mv)}>
                {mv.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
