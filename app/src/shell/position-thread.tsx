import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { positionRow } from "../../../src/companion/places";
import type { DeskPosition } from "../live/desk";
import type { MpThread } from "../live/moneypenny-threads";
import { fetchSettings } from "../live/settings";
import { positionAnchor } from "./position-anchor";
import { RowAsk, RowThread } from "./row-thread";

/**
 * A SIDE THREAD ON A POSITION'S ROW (#7167 criterion 11, the slice after #7275). A question about
 * one holding opens a side conversation with Moneypenny that belongs to that row, the way a story's
 * or a calendar event's does. It reuses #7275's parts unchanged (`RowAsk`, `RowThread`, the store's
 * threads): the thread is named by the row's own anchor, `pos-<symbol>`, the key her links already
 * land on (`positionRow`, #7207). That is the issue's falsifier passing — a new kind of row joins
 * with its key and nothing else.
 *
 * Offered on the member's own trading account only. Her `get_my_positions` reads the member's linked
 * account, so a thread on a bot's row, or on another member's, would be answered from the wrong
 * book: an honest answer about it isn't available, so the ask isn't drawn there.
 */

/** A position's side thread: keyed by its row, titled by its readable name, linking back to it. */
export function positionThread(position: DeskPosition): MpThread {
  return {
    key: positionAnchor(position.symbol),
    title: position.display,
    path: positionRow(position.symbol),
  };
}

/** The member's question, naming the holding — and an option's exact contract, so her link to the
 *  row (`/accounts#pos-<symbol>`) matches the symbol `get_my_positions` gives her. */
export function positionQuestion(position: DeskPosition, question: string): string {
  const contract = position.symbol === position.display ? "" : ` (${position.symbol})`;
  return `About my ${position.display} position${contract}: ${question.trim()}`;
}

/** Is `deskId` the member's own trading account — the one her positions tool reads? */
export function useOwnTradingAccount(deskId: string): boolean {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  return settings.data?.accounts.some((a) => a.id === deskId && a.kind === "human") === true;
}

/** The one-line ask, inside the position's opened guidance. */
export function PositionAsk({ position }: { readonly position: DeskPosition }): ReactElement {
  return (
    <section className="story-ask pos-ask" aria-label="Ask about this position">
      <RowAsk
        thread={positionThread(position)}
        question={(text) => positionQuestion(position, text)}
      />
    </section>
  );
}

/** The thread itself, collapsed on the row; nothing until the member has asked. */
export function PositionThreadLine({
  position,
}: {
  readonly position: DeskPosition;
}): ReactElement | null {
  return <RowThread thread={positionThread(position)} />;
}
