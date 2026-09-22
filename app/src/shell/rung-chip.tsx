import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { PlayInfo } from "../live/options";

/**
 * THE RUNG CHIP (#3407, Workbench slice 5) — what stays on the ticket when the milestone strip
 * moves to `/learn/trading`. Eric's call (2026-09-22, "B — keep"): overturn the strip's PLACEMENT
 * (#1461 put the rail over the form; the Workbench pick makes the ticket one pane of a bench, and
 * an eight-rung ladder above a bench is a second header), keep its PRINCIPLE — milestones gate,
 * they never drive. So one line names the rung the ticket is on, its state in a WORD (earned ·
 * open · locked — never hue alone, docs/BRAND.md → Accessibility), the count, and the door to the
 * ladder itself. Nothing here decides earned or locked: both arrive from `/api/trade/plays`.
 * @category trading
 */
export function RungChip({
  plays,
  code,
}: {
  readonly plays: readonly PlayInfo[];
  /** The rung the ticket is preset to (`?play=`). */
  readonly code: string;
}): ReactElement | null {
  const play = plays.find((p) => p.code === code);
  if (!play) return null;
  const earned = plays.filter((p) => p.earned).length;
  const state = play.earned ? "earned ✓" : play.locked ? "locked" : "open";
  return (
    <p className="rung-chip">
      <span className="rung-chip-eyebrow">Rung</span>
      <b className="num">{play.code}</b> <span className="rung-chip-name">{play.name}</span>
      <span
        className={`rung-chip-state rung-chip-${play.earned ? "earned" : play.locked ? "locked" : "open"}`}
      >
        {state}
      </span>
      <span className="rung-chip-count num">
        {earned} / {plays.length} earned
      </span>
      <Link to="/learn/trading" className="rung-chip-link">
        Trading ladder →
      </Link>
    </p>
  );
}
