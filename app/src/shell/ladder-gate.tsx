import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * THE FEEDBACK GATE'S CARD (#1119) — what the desk and the ladder show while training wheels are
 * on and no feedback has been filed: one sentence from the server and the one action that lifts
 * it. Rendering only; the server refuses a gated buy or option open regardless of this card.
 * @category trading
 */
export function LadderGateCard({
  note,
  compact = false,
}: {
  readonly note: string;
  /** The one-line form for the ladder page; the desk gets the full card. */
  readonly compact?: boolean;
}): ReactElement {
  return (
    <section
      className={`ladder-gate${compact ? " ladder-gate-compact" : ""}`}
      aria-label="Ladder gate"
    >
      {compact ? null : <h2 className="ladder-gate-h">◷ The ladder is waiting on you</h2>}
      <p className="ladder-gate-p">
        {note}{" "}
        <Link to="/feedback" search={{ starter: "onboarding" }}>
          File your first note ›
        </Link>
      </p>
    </section>
  );
}
