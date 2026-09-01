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

/** @category gates */
export function DisarmNote(): ReactElement {
  return (
    <p className="gate-note">
      Editing the ticket re-arms this gate, and the desk re-checks the live account at submit —
      approval never outlives the thing it approved.
    </p>
  );
}
