import type { ReactElement } from "react";
import type { BoardFlow } from "../live/board";

/**
 * A standings row's capital-flow mark (#4563 slice 2) — the line that says a member's equity
 * includes a paper-balance top-up (or reset down) rather than trading. The words are the server's
 * (`capital-flow-mark.ts`), placed verbatim. It sits after the rank and the equity, takes the row's
 * full width, and is drawn in the row's own quiet ink: no gain or loss tone, no warning colour —
 * the record says what happened and does not judge it. Added and removed differ by a glyph, so a
 * red/green colourblind reader never needs hue to tell them apart. No flow, no element at all.
 */
export function RankFlow({ flow }: { readonly flow?: BoardFlow }): ReactElement | null {
  if (!flow) return null;
  return (
    <span className="rank-flow" data-direction={flow.direction} title={flow.title}>
      <span className="rank-flow-glyph" aria-hidden="true">
        {flow.direction === "added" ? "+" : "−"}
      </span>
      <span>{flow.text}</span>
    </span>
  );
}
