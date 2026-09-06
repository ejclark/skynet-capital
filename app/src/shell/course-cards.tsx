import type { ReactElement } from "react";
import { useState } from "react";
import type { Journey, JourneyCourse, JourneyMilestone } from "../live/learn";

/**
 * THE TRADING LADDER'S CARDS (#738 phases 6b + 8b; moved out of the `/learn` route with #1119
 * when that page became the milestones table of contents). The honesty rule is the whole design
 * (Eric, 2026-08-25): a milestone is earned only by a real filled order, and every earned row
 * shows its proof. Courses unlock bottom-up. Grading and the durable record stay server-side.
 * @category plays
 */
export function MilestoneRow({
  milestone,
}: {
  readonly milestone: JourneyMilestone;
}): ReactElement {
  return (
    <li className={`ms-row${milestone.earned ? " ms-done" : ""}`}>
      {/* Earned and unearned rows carried the SAME tick in two colours; the hollow ring is the
          shape that says it, exactly as onboarding's step glyph does (docs/BRAND.md). */}
      <span className="ms-mark" aria-hidden="true">
        {milestone.earned ? "✓" : "○"}
      </span>
      <span className="ms-body">
        <span className="ms-title">{milestone.title}</span>
        <span className="ms-detail">{milestone.detail}</span>
        {milestone.earned ? (
          <span className="ms-proof num">
            filled {milestone.earned.on} · order {milestone.earned.orderId}
          </span>
        ) : null}
      </span>
      {!milestone.earned && milestone.ticket ? (
        <a className="ms-go" href={milestone.ticket}>
          open the ticket →
        </a>
      ) : null}
      <span className="ms-pts num">+{milestone.points}</span>
    </li>
  );
}

export function CourseCard({ course }: { readonly course: JourneyCourse }): ReactElement {
  // Open by default exactly when it's the live frontier: unlocked with work remaining.
  const [open, setOpen] = useState(!course.locked && course.done < course.total);
  const pct = course.total ? Math.round((course.done / course.total) * 100) : 0;
  return (
    <section className={`course${course.locked ? " course-locked" : ""}`}>
      <button
        type="button"
        className="course-head"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="course-badge num">{course.level}</span>
        <span className="course-names">
          <span className="course-title">{course.title}</span>
          <span className="course-sub">{course.subtitle}</span>
        </span>
        <span className="course-prog">
          <span className="course-bar">
            <i style={{ width: `${pct}%` }} />
          </span>
          <span className="num">
            {course.done} / {course.total}
          </span>
        </span>
        {course.locked ? <span className="course-lock">🔒 finish the level below</span> : null}
      </button>
      {open && !course.locked ? (
        <ul className="ms-list">
          {course.milestones.map((m) => (
            <MilestoneRow key={m.id} milestone={m} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Rank + points. `extraPoints`/`extraTotal` fold onboarding's 30 in on the table of contents so
 *  the denominator reads 230 there; the ladder page shows the ladder's own 200. */
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
