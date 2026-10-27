import type { ReactElement } from "react";
import type { DeskOrderEvent } from "../live/desk-events";
import { doneNote } from "../live/fill-headline";
import { marketSession } from "../live/market-session";
import { useNow } from "./market-session";

/**
 * The pre-trade gate's shared frame (#738 phase 10b) — the merge-box status head and the
 * disarm doctrine note, extracted from `trade-gate.tsx` so the share ticket and the options
 * ticket render the SAME gate anatomy: approval never outlives the thing it approved.
 * @category gates
 */

export function GateHead({
  tone,
  children,
}: {
  readonly tone: string;
  readonly children: string;
}): ReactElement {
  return (
    <div className={`gate-head gate-${tone}`}>
      <span className="gate-icon" aria-hidden="true" />
      {children}
    </div>
  );
}

/**
 * Keep focus where it is when a gate button is pressed (#3407 P0, found while shooting P2 slice
 * 2): the strike and symbol fields commit to the URL on blur, and that `navigate()` re-renders
 * the ticket under the pointer — the mousedown blurred the field, the click landed on a node that
 * no longer existed, and the member's FIRST press of Review did nothing. Preventing the default
 * on mousedown stops the focus change, so the click fires; the gate's own review handler then
 * commits the field's value explicitly, so the URL still ends up right. Keyboard activation is
 * untouched (Enter / Space never go through mousedown).
 * @category gates
 */
export function keepFocus(event: { preventDefault: () => void }): void {
  event.preventDefault();
}

/** @category gates */
export function DisarmNote(): ReactElement {
  return (
    <p className="gate-note">
      Editing the order re-arms this gate, which re-checks your paper account's buying power and
      positions at submit — approval never outlives the thing it approved.
    </p>
  );
}

/** The done state's note (#6257): queued until the stream carries a fill for this order, with the
 *  open it waits for when the market is closed — "simulated fill" only once one exists. `children`
 *  is the ticket's own trailing sentence (where the order shows up next). */
export function DoneNote({
  fill,
  now,
  children,
}: {
  readonly fill?: DeskOrderEvent;
  /** Pins the clock in specs; the wall clock otherwise. */
  readonly now?: Date;
  readonly children: string;
}): ReactElement {
  const ticking = useNow();
  return (
    <p className="gate-note">
      {doneNote(fill, marketSession(now ?? ticking))} {children}
    </p>
  );
}
