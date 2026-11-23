/**
 * WHICH OF A MEMBER'S MATCHED FILINGS ARE FIXED (#8005 slice 7, "try it"). A filing Moneypenny
 * matched to a known problem is evidence on that problem, not a build of its own, so the member's
 * own issue may stay open while the fix lands elsewhere: through the plan that owns the row, or a
 * row marked fixed in `docs/IA.md` §10. This reads both, so the Feedback section and Moneypenny's
 * member context can tell the member who asked and offer the fixed screen.
 *
 * One status read for every plan the member's matched filings point at, through the same cached
 * fetcher the Feedback badges use (five minutes, `feedback-status.ts`); nothing is read when no
 * filing carries a match. A failed read leaves a plan unread, so nothing reads as fixed that is
 * not.
 */
import { fixFor, fixPlansFor, type ProblemFix } from "../domain/known-problems.js";
import type { FeedbackLogEntry } from "./feedback-log.js";
import type { FetchFeedbackStatuses } from "./feedback-status.js";

export async function knownProblemFixes(
  filings: readonly Pick<FeedbackLogEntry, "issueNumber" | "match">[],
  fetchStatuses: FetchFeedbackStatuses | undefined,
): Promise<ReadonlyMap<number, ProblemFix>> {
  const matched = filings.filter((f) => f.match);
  if (matched.length === 0) return new Map();
  const plans = [...new Set(matched.flatMap((f) => (f.match ? fixPlansFor(f.match) : [])))];
  const statuses =
    fetchStatuses && plans.length > 0
      ? await fetchStatuses(plans).catch(() => new Map<number, string>())
      : new Map<number, string>();
  const fixes = new Map<number, ProblemFix>();
  for (const f of matched) {
    const fix = fixFor(f.match, (plan) => statuses.get(plan) === "shipped");
    if (fix) fixes.set(f.issueNumber, fix);
  }
  return fixes;
}
