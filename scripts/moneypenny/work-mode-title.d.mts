// Type surface for work-mode-title.mjs — same arrangement as work-mode.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

import type { Position, WorkMode } from "./work-mode.d.mts";

/** What `gatherAuditDeps` hands the audit about the dial: the issue, its current title, the mode. */
export interface WorkModeState {
  readonly trackingIssue: number;
  readonly title: string | null;
  readonly mode: WorkMode;
}

/** The audit intent that rewrites the tracking issue's title (#3960 criterion 4). */
export interface RetitleIntent {
  readonly kind: "retitle-work-mode";
  readonly issueNumber: number;
  /** The title the issue carries now — named `title` like every other intent's target title. */
  readonly title: string;
  readonly newTitle: string;
  readonly position: Position;
  readonly reason: string;
}

/** `Work mode: CONSERVE until 2026-09-29` — the plan's "status at a glance" format. */
export function workModeTitle(mode: Pick<WorkMode, "position" | "until">): string;

/** Pure: the retitle intent for a stale dashboard, or null when the title is already right, the
 *  dial was unreadable (a `warning`), or there is no current title to compare. */
export function workModeRetitle(
  state?: { trackingIssue?: number; title?: string | null; mode?: Partial<WorkMode> } | null,
): RetitleIntent | null;
