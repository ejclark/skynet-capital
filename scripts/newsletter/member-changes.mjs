// The newsletter's two playthrough-and-reaction counters (#7031, slice 3, criterion 4): how many
// scripted playthrough steps are still expected to fail (`known_gap`), and how many member-facing
// changes merged in the week and drew a reaction. PURE, like the rest of metrics: gather reads
// (member-reads.mjs), these turn what it read into numbers.
//
// WHY THESE TWO. #7031's plan makes each build's acceptance line a scripted member step that must
// pass before merge. A `known_gap` step is the plan's escape hatch (the step is expected to fail),
// so its count is how much of that net is switched off; a falling count is the ratchet working.
// The reaction counts are the baseline the plan's member-facing halves (#7029 slice 4, #7031 slice
// 5) are judged against, so they must be honest about what can be read today.
//
// THE HONESTY RULE IS THE METER'S: what could not be read is null (or its own words), never 0.
//
// WHAT COUNTS (every definition is a plain rule on one record, so a week can be rebuilt):
// - a member-facing change: a merged `feat`/`fix`/`perf` PR that touches a member surface file,
//   the paths `.claude/rules/member-surfaces.md` scopes: `app/src/**` and `src/ui/**`.
// - Eric's reaction: a "Revisit #<pr>:" issue, which the decisions page's Revisit tap files.
// - a member's reaction: an in-app filing (it carries a `member-<id>` label) that names the PR as
//   `#<pr>`. The app has no per-change reaction yet, so this is a floor, and the note says so.
const within = (ms, w) => ms >= w.sinceMs && ms < w.untilMs;

/** The types a member can see the effect of; `refactor`, `test`, `docs` and `chore` are not. */
export const VISIBLE_TYPE = /^(feat|fix|perf)(\([^)]*\))?!?:/i;
/** The member-surface paths (`.claude/rules/member-surfaces.md`). */
export const isMemberSurface = (path) => /^(app\/src|src\/ui)\//.test(String(path ?? ""));

/** Journey steps expected to fail today, from `e2e/journeys/*.journey.json`, by member. */
export function knownGaps(gaps) {
  if (!Array.isArray(gaps)) return gaps ?? null;
  const byMember = {};
  for (const g of gaps) byMember[g.member] = (byMember[g.member] ?? 0) + 1;
  return {
    count: gaps.length,
    byMember,
    steps: gaps.map((g) => `${g.member}/${g.step}`).sort(),
  };
}

/**
 * Member-facing changes merged in the week, and the reactions they drew by the time of the run.
 * `prs` rows are `{ number, mergedAt, surfaceFiles }` (member-surface files the PR touched, or null
 * if its files could not be read); `issues` rows are `{ number, createdAt, revisit, member, refs }`.
 */
export function memberChanges(prs, issues, w) {
  if (!Array.isArray(prs)) return prs ?? null;
  const merged = prs.filter((p) => within(Date.parse(p.mergedAt), w));
  const facing = merged.filter((p) => p.surfaceFiles > 0).map((p) => p.number);
  const named = new Set(facing);
  const reactions = Array.isArray(issues)
    ? {
        eric: new Set(issues.filter((i) => named.has(i.revisit)).map((i) => i.revisit)).size,
        members: new Set(
          issues.filter((i) => i.member).flatMap((i) => i.refs.filter((n) => named.has(n))),
        ).size,
      }
    : (issues ?? null);
  return {
    merged: facing.length,
    unread: merged.filter((p) => p.surfaceFiles === null).length,
    reactions,
    memberFilings: Array.isArray(issues)
      ? issues.filter((i) => i.member && within(Date.parse(i.createdAt), w)).length
      : (issues ?? null),
    note: "reactions count changes, not taps: Eric's is a Revisit filing, a member's an in-app filing that names the PR. A floor until the app has a per-change reaction (#7029 slice 4)",
  };
}
