/**
 * WHICH OF A MEMBER'S MATCHED FILINGS ARE FIXED (#8005 slice 7, "try it"). A filing Moneypenny
 * matched to a known problem is evidence on that problem, not a build of its own, so the member's
 * own issue may stay open while the fix lands elsewhere: through the plan that owns the row, or a
 * row marked fixed in `docs/IA.md` §10. This reads both, so the Feedback section and Moneypenny's
 * member context can tell the member who asked and offer the fixed screen.
 *
 * One read for every plan the member's matched filings point at, through `plan-fix-built.ts`,
 * which asks whether each plan was BUILT, not merely closed (#8077: a plan closed as a duplicate or
 * with its remainder relayed on read "shipped" to the badge and told the member "Fixed — try it").
 * Nothing is read when no filing carries a match. A failed read leaves a plan unbuilt, so nothing
 * reads as fixed that is not.
 */
import { fixFor, fixPlansFor, type ProblemFix } from "../domain/known-problems.js";
import type { FeedbackLogEntry } from "./feedback-log.js";
import type { FetchBuiltPlans } from "./plan-fix-built.js";

export async function knownProblemFixes(
  filings: readonly Pick<FeedbackLogEntry, "issueNumber" | "match">[],
  fetchBuiltPlans: FetchBuiltPlans | undefined,
): Promise<ReadonlyMap<number, ProblemFix>> {
  const matched = filings.filter((f) => f.match);
  if (matched.length === 0) return new Map();
  const plans = [...new Set(matched.flatMap((f) => (f.match ? fixPlansFor(f.match) : [])))];
  const built =
    fetchBuiltPlans && plans.length > 0
      ? await fetchBuiltPlans(plans).catch(() => new Set<number>())
      : new Set<number>();
  const fixes = new Map<number, ProblemFix>();
  for (const f of matched) {
    const fix = fixFor(f.match, (plan) => built.has(plan));
    if (fix) fixes.set(f.issueNumber, fix);
  }
  return fixes;
}
