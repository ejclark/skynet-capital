// "Your part this week" (#6872): the human steps due, within a budget of at most 5 asks.
//
// One table drives it: docs/process/LEARNING-LOOP.md → *Loops running now*, whose "Human step" and
// "Cadence" columns say what a person decides for each loop and how often. A row with no step
// ("—", blank or "none: …"), whose loop has ended, or that is still `planned` asks nothing: a
// loop that has not started has nothing for a person to decide yet.
//
// RANKED BY VALUE UNLOCKED, DECLARED, NOT INFERRED. Which answer unlocks most is a judgment, so it
// is written where the rows are: among rows with a human step, a row higher in the table is worth
// more. Code only adds the rule that keeps a low row from starving: an ask that already rolled over
// goes ahead of one due for the first time, oldest first. A weekly ask that rolled over is the same
// ask as this week's, counted once, from the week it first waited.
//
// What doesn't fit rolls to next week, and the newsletter's plan block carries it
// (docs/newsletters/TEMPLATE.md), so the next run reads it back. The rollover count is reported
// because the plan's own check is "if rollover grows for three weeks, the budget or the ranking is
// wrong".
import { cadenceOf, isDue, weeksBetween } from "./week.mjs";

export const ASK_BUDGET = 5;
/** Ended states (loop-list-decide.mjs's) plus `planned`, which has not started. */
const SILENT = new Set(["closed", "killed", "pivoted", "replaced", "planned"]);
const NONE = /^(|—|-|–|none\b.*|n\/a)$/i;

/**
 * The decisions he holds right now, beside the loop chores (#6953 section 3): how many, and the
 * oldest by how long it has carried `needs-eric`. Read from the same selector as the digest's
 * Needs you (`plan().needsYou`, via decision-reads.mjs), never a second list. A held PR has no
 * label age, so it counts but cannot be the oldest. `null` when the snapshot could not be read.
 */
export function openAsks(snapshot, needsEricRows, asOfMs) {
  if (!snapshot || typeof snapshot !== "object") return null;
  const labelled = new Map(
    (Array.isArray(needsEricRows) ? needsEricRows : [])
      .filter((r) => r.labeledAt)
      .map((r) => [r.number, r.labeledAt]),
  );
  const aged = snapshot.needsYou
    .filter((n) => labelled.has(n.number))
    .map((n) => ({
      number: n.number,
      days: Math.round(((asOfMs - Date.parse(labelled.get(n.number))) / 864e5) * 10) / 10,
    }))
    .sort((a, b) => b.days - a.days);
  return { count: snapshot.needsYou.length, oldest: aged[0] ?? null };
}

/** Registry rows that carry a human step, in table order; unreadable cadences are named, not guessed. */
export function humanSteps(rows) {
  const steps = [];
  const unreadable = [];
  for (const row of rows ?? []) {
    const step = String(row.humanStep ?? "").trim();
    if (NONE.test(step) || SILENT.has(row.state)) continue;
    const cadence = cadenceOf(row.cadence);
    if (!cadence) unreadable.push({ loop: row.loop, cadence: row.cadence ?? "" });
    else steps.push({ loop: row.loop, step, cadence, issue: row.issue || null });
  }
  return { steps, unreadable };
}

/**
 * The asks for `week`: every step due by its cadence, plus every ask carried in, ranked (oldest
 * wait first, then table order) and cut at the budget.
 */
export function asksDue({ rows, week, carriedIn = [], budget = ASK_BUDGET }) {
  const { steps, unreadable } = humanSteps(rows);
  const rank = new Map(steps.map((s, i) => [s.loop, i]));
  const since = new Map();
  for (const c of carriedIn) {
    if (!rank.has(c.loop)) continue; // a loop whose row ended or lost its step asks nothing
    const prior = since.get(c.loop);
    if (!prior || weeksBetween(c.since, prior) > 0) since.set(c.loop, c.since);
  }
  for (const s of steps) if (isDue(s.cadence, week) && !since.has(s.loop)) since.set(s.loop, week);
  const ranked = steps
    .filter((s) => since.has(s.loop))
    .map((s) => ({
      ...s,
      since: since.get(s.loop),
      waitedWeeks: weeksBetween(since.get(s.loop), week),
    }))
    .sort((a, b) => b.waitedWeeks - a.waitedWeeks || rank.get(a.loop) - rank.get(b.loop));
  const asks = ranked.slice(0, budget);
  const rolledOver = ranked.slice(budget).map(({ loop, since: s }) => ({ loop, since: s }));
  return {
    budget,
    due: ranked.length,
    asks,
    rolledOver,
    carriedIn: carriedIn.filter((c) => rank.has(c.loop)).length,
    unreadableCadence: unreadable,
  };
}
