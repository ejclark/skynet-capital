import type { ReactElement } from "react";
import type { Journey } from "../live/learn";

/**
 * THE JOURNEY'S HUD AND LADDER COUNT (#738 phases 6b + 8b). The level cards that once lived here
 * retired into the trading chapter's one ladder list (`ladder-list.tsx`, #5242); what stays is the
 * rank-and-points HUD the Milestones overview shows and the ladder's done/total.
 *
 * Rank + points. `extraPoints`/`extraTotal` fold onboarding's 30 in on the table of contents so
 * the denominator reads 230 there; the ladder page shows the ladder's own 200.
 * @category plays
 */
export function Hud({
  journey,
  extraPoints = 0,
  extraTotal = 0,
}: {
  readonly journey: Journey;
  readonly extraPoints?: number;
  readonly extraTotal?: number;
}): ReactElement {
  const points = journey.points + extraPoints;
  const total = journey.totalPoints + extraTotal;
  const pct = total ? Math.round((points / total) * 100) : 0;
  return (
    <div className="hud">
      <div className="hud-stat">
        <span className="hud-k">Rank</span>
        <span className="hud-v">{journey.rank}</span>
      </div>
      <div className="hud-stat">
        <span className="hud-k">Points</span>
        <span className="hud-v num">
          {points} / {total}
        </span>
      </div>
      <div className="hud-track">
        <span className="course-bar hud-bar">
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>
    </div>
  );
}

/** How many ladder milestones are earned, of how many — the table of contents' M·02 progress. */
export function ladderProgress(journey: Journey): {
  readonly done: number;
  readonly total: number;
} {
  return journey.courses.reduce(
    (acc, c) => ({ done: acc.done + c.done, total: acc.total + c.total }),
    { done: 0, total: 0 },
  );
}
