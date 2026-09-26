import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * ONE CHAPTER ON THE MILESTONES TABLE OF CONTENTS (#1119) — code, state badge, points, progress,
 * and the chapter it opens. State vocabulary is the canvas's: complete · in progress · locked ·
 * WIP. The badge says what is true today; the card never implies an unlock it cannot see.
 *
 * A chapter is a `?chapter=` of the Profile page's Milestones section since #3807 slice 2b, not a
 * route of its own (that was #1119's Claude-derived fork, reversed with docs/PATTERNS.md's
 * "Viewer-level section" row cited): the card keeps the account the page is on and opens its
 * chapter beneath the cards; the open one says so with a word and the pressed edge, never hue.
 * @category navigation
 */
export type ChapterState = "complete" | "progress" | "locked" | "wip";

/** The three chapters `?chapter=` can open (`routes/accounts.tsx` validates it). */
export type MilestoneChapter = "onboarding" | "trading" | "playbooks";

export const MILESTONE_CHAPTERS: readonly MilestoneChapter[] = [
  "onboarding",
  "trading",
  "playbooks",
];

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
  chapter,
  open = false,
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
  readonly chapter: MilestoneChapter;
  /** This chapter is the one open beneath the cards. */
  readonly open?: boolean;
  readonly gateNote?: string;
}): ReactElement {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <Link
      to="/accounts"
      search={(prev) => ({ ...prev, section: "milestones" as const, chapter })}
      replace
      className={`mc mc-${state}${open ? " mc-open" : ""}`}
      aria-current={open ? "page" : undefined}
    >
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
      {open ? <span className="mc-open-word num">▾ Open below</span> : null}
    </Link>
  );
}
