import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * ONE CHAPTER ON THE MILESTONES TABLE OF CONTENTS (#1119) — code, state badge, points, progress,
 * and the route the chapter lives at. State vocabulary is the canvas's: complete · in progress ·
 * locked · WIP. The badge says what is true today; the card never implies an unlock it cannot see.
 * @category navigation
 */
export type ChapterState = "complete" | "progress" | "locked" | "wip";

const BADGE: Record<ChapterState, string> = {
  complete: "✓ COMPLETE",
  progress: "● IN PROGRESS",
  locked: "◷ LOCKED",
  wip: "◷ WIP · SEASON 1",
};

export function MilestoneCard({
  code,
  title,
  desc,
  state,
  done,
  total,
  points,
  to,
  gateNote,
}: {
  readonly code: string;
  readonly title: string;
  readonly desc: string;
  readonly state: ChapterState;
  readonly done: number;
  readonly total: number;
  /** "+30 pts" or "pts TBD" — the chapter's worth, as text. */
  readonly points: string;
  readonly to: "/onboarding" | "/learn/trading" | "/playbooks";
  readonly gateNote?: string;
}): ReactElement {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Link to={to} className={`mc mc-${state}`}>
      <span className="mc-head">
        <span className={`chip mc-chip-${state}`}>{code}</span>
        <span className={`mc-badge mc-badge-${state} num`}>{BADGE[state]}</span>
        <span className="mc-pts num">{points}</span>
      </span>
      <span className="mc-title">{title}</span>
      <span className="mc-desc">{desc}</span>
      <span className="mc-prog">
        <span className="course-bar mc-bar">
          <i style={{ width: `${pct}%` }} />
        </span>
        <span className="num">
          {done} / {total}
        </span>
      </span>
      {gateNote ? <span className="mc-gate num">◷ {gateNote}</span> : null}
    </Link>
  );
}
