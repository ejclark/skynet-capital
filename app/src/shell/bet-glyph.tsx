import type { ReactElement } from "react";
import type { BetShape } from "../live/order-facts";

/**
 * THE BET AS A SHAPE (#5101, round 2 of #5037). Each glyph always rides with its words ("Stays above
 * $80"), so the shape is a second channel, never the only one, and it is drawn rather than typed: the
 * nearest characters (⏏, ▲) render as colour emoji on some phones. One hue for every shape — the
 * shape carries which bet it is, and hue never carries a meaning on its own (a standing reader is
 * red/green colourblind, docs/BRAND.md).
 *  - rises ▲ · falls ▼ — a bought share, call or put, or a debit spread;
 *  - above (▲ over a floor) · below (a ceiling over ▼) — a sold put or call: the stock only has to
 *    stay on its side of the strike;
 *  - closed ■ — a fill that closed what an earlier one opened; sold □ — a share sale whose opening
 *    buy is outside the ledger, so no direction is claimed.
 */
const PATHS: Record<BetShape, ReactElement> = {
  rises: <path d="M7 2.5 12.5 11.5h-11z" />,
  falls: <path d="M7 11.5 1.5 2.5h11z" />,
  above: (
    <>
      <path d="M7 1.5 12 8.5H2z" />
      <rect x="1.5" y="10.5" width="11" height="2" rx="0.5" />
    </>
  ),
  below: (
    <>
      <rect x="1.5" y="1.5" width="11" height="2" rx="0.5" />
      <path d="M7 12.5 2 5.5h10z" />
    </>
  ),
  closed: <rect x="2.5" y="2.5" width="9" height="9" rx="1" />,
  sold: (
    <rect
      x="3"
      y="3"
      width="8"
      height="8"
      rx="1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  ),
};

export function BetGlyph({ shape }: { readonly shape: BetShape }): ReactElement {
  return (
    <svg
      className="bet-glyph"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[shape]}
    </svg>
  );
}
