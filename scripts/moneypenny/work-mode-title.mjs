// THE DIAL'S DASHBOARD, KEPT HONEST (#3960 slice 4 — criterion 4's write half).
//
// Criterion 4 has two halves and only the READ half shipped in slice 1: an expired position already
// resolves to `normal`, so no lane over-throttles. What was missing is the write — the tracking
// issue's title is the spigot's whole dashboard ("Work mode: CONSERVE until 2026-09-29"), and
// nothing rewrote it, so the title could read CONSERVE for days after every lane had gone back to
// normal. A dashboard that lies is worse than none: the next session reads it and believes it.
//
// WHY IT LIVES BESIDE work-mode.mjs RATHER THAN INSIDE IT. That file is a READER — pure resolution
// plus one read-only `gh issue view` — and work-gate.mjs's header already settled the shape for
// this family: the dial and the breaker compose from OUTSIDE, so a third concern belongs beside
// them, not folded into the reader. Keeping the only mutating step out of the reader also means no
// lane can retitle the issue as a side effect of asking what the position is.
//
// WHAT IT IS NOT: a second place the position is decided. The desired title is a pure function of
// the mode `resolveWorkMode` already returned, and the only actor is the audit lane (the push-driven
// one that already rides every merge to `main` — "the next lane run", in the criterion's words).
//
// TWO DELIBERATE SILENCES — this never fires when it cannot be sure the title is wrong:
//   - a mode carrying a `warning` is a FAIL-CLOSED READ, not a reading of the dial: an unreadable
//     tracking issue resolves to `conserve`, and retitling on that would turn a GitHub blip into a
//     dashboard that says the repo is throttled when nobody throttled it. The `::warning::` the
//     lane already prints is that state's signal; a title rewrite is not.
//   - a missing or empty current title means `gh` gave us nothing to compare, so there is nothing
//     to correct.

/** The title the tracking issue should carry for a resolved mode — the plan's own format
 *  ("Status at a glance": `Work mode: CONSERVE until 2026-09-29`). The expiry is part of the title
 *  only when the position actually holds one, so `normal` reads as a bare `Work mode: NORMAL`. */
export function workModeTitle(mode) {
  const position = String(mode?.position ?? "").toUpperCase();
  return `Work mode: ${position}${mode?.until ? ` until ${mode.until}` : ""}`;
}

/**
 * Pure: does the tracking issue's title need rewriting, and to what?
 *
 * Deliberately a general title SYNC rather than an expiry-only special case — a strict superset of
 * criterion 4 for the same work. The criterion's case (an expiry passed, so the position now reads
 * `normal`) is covered, and so is the other way a title goes stale: someone flips the dial's label
 * and does not edit the title. One rule, no second code path.
 *
 * Idempotent by construction: once the title matches, the next run finds nothing to do, so this
 * needs no `flagged`-style memory the way the audit's comment intents do.
 *
 * @param state `{ trackingIssue, title, mode }` as `gatherAuditDeps` assembles it, or null/undefined
 *   when the dial could not be read at all.
 * @returns a `retitle-work-mode` intent, or null when the title is already right (the common case).
 */
export function workModeRetitle(state) {
  const { trackingIssue, title, mode } = state ?? {};
  if (!Number.isInteger(trackingIssue) || trackingIssue <= 0) return null;
  if (!mode?.position || mode.warning) return null;
  if (typeof title !== "string" || !title.trim()) return null;
  const current = title.trim();
  const desired = workModeTitle(mode);
  if (current === desired) return null;
  return {
    kind: "retitle-work-mode",
    issueNumber: trackingIssue,
    title: current,
    newTitle: desired,
    position: mode.position,
    reason: mode.reason ?? "",
  };
}
