import type { SafeguardState } from "../live/desk";

/** What a safeguard stage does today, as the word the page prints (#3194 slice 6a). Shared by the
 *  Safeguards list and the drawn play's own rows (#5327), so the two never word a state apart. */
export const SAFEGUARD_STATE_LABEL: Record<SafeguardState, string> = {
  off: "Off",
  watching: "Watching",
  "alert-only": "Alert only",
  enforcing: "Enforcing",
};

/** Four genuinely different SHAPES, not four fill levels of one — a quarter-filled circle has no
 *  glyph in several common stacks and fell back to a smudge in the 390px frame. Hollow circle,
 *  diamond, warning triangle, filled circle all render in core fonts and read apart at 12px. The
 *  state never depends on hue (CLAUDE.md: a standing reader is red/green colourblind); this is the
 *  third signal, after the word beside it and the stage's own border pattern. */
export const SAFEGUARD_STATE_GLYPH: Record<SafeguardState, string> = {
  off: "○",
  watching: "◆",
  "alert-only": "▲",
  enforcing: "●",
};

/** When the pass a safeguard reading came from ran, as the page prints it — or undefined for an
 *  absent or unreadable time. Nothing bounds how old that pass is, so a reading is never undated. */
export function ladderStamp(asOf: string | undefined): string | undefined {
  const when = asOf ? new Date(asOf) : undefined;
  return when && !Number.isNaN(when.getTime())
    ? when.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;
}
