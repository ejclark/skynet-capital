import type { ReactElement } from "react";

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
      Editing the order re-arms this gate, which re-checks the live account at submit — approval
      never outlives the thing it approved.
    </p>
  );
}
