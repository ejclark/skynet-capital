import type { ReactElement } from "react";
import { meetMoneypenny } from "../live/moneypenny";

/**
 * THE FEEDBACK GATE'S CARD (#1119) — what the desk and the ladder show while training wheels are
 * on and no feedback has been filed: one sentence from the server and the one action that lifts
 * it — telling Moneypenny (her rail opens with the intro; the first filing is what opens trading).
 * Rendering only; the server refuses a gated buy or option open regardless of this card.
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
        <button type="button" className="ladder-gate-link" onClick={() => void meetMoneypenny()}>
          Tell Moneypenny ›
        </button>{" "}
        and trading opens.
      </p>
    </section>
  );
}
