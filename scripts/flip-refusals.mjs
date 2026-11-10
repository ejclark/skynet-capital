// WHICH ISSUES A CLEAR-PATH FLIP REFUSED, AND WHEN (#7311 slice 3) — the memory that keeps the
// starved-queue check (scripts/flip-due.mjs) from re-judging the same issue every hour.
//
// The flip workflow (.claude/workflows/clear-path-flip.js) returns `refuted` and `notClear` lists and
// writes nothing, so until now a refusal left no trace: the next run would spend a judge and two
// refuters on an issue that failed a check the day before (2026-11-10: 36 of 62 judged issues were
// refused, and each cost ~3 agents). scripts/clear-path-post.mjs now appends one row per refusal to
// `flip/refusals.jsonl` on the `data/pr-review` ledger branch, beside the audit marker, and
// flip-due.mjs leaves anything refused inside the window out of its list. Seven days is the plan's
// number: long enough that a thread which has not changed is not re-read, short enough that an
// issue someone fixed gets another look within a week.
import { parseJsonl } from "./pr-review/ledger.mjs";

/** The ledger-branch file the refusals ride in: JSONL, one `{at, issue, kind}` row per refusal. */
export const FLIP_REFUSALS_PATH = "flip/refusals.jsonl";
/** How long a refusal keeps an issue out of the next flip list. */
export const REFUSAL_DAYS = 7;

const DAY_MS = 86_400_000;

/**
 * Pure. A flip workflow result → the rows to record: every `refuted` and `notClear` entry that names
 * an issue, once each. Survivors are not refusals (the post step labels them `ready`).
 */
export function refusalRows(result, at) {
  const seen = new Set();
  const rows = [];
  for (const kind of ["refuted", "notClear"]) {
    for (const entry of Array.isArray(result?.[kind]) ? result[kind] : []) {
      const issue = entry?.issue;
      if (!Number.isInteger(issue) || issue <= 0 || seen.has(issue)) continue;
      seen.add(issue);
      rows.push({ at, issue, kind });
    }
  }
  return rows;
}

/** Pure. The refusals file's text → the issue numbers refused within `days` of `now`. */
export function recentlyRefused(body, now, days = REFUSAL_DAYS) {
  const since = now - days * DAY_MS;
  return new Set(
    parseJsonl(body)
      .filter((r) => Number.isInteger(r?.issue) && Date.parse(r.at) >= since)
      .map((r) => r.issue),
  );
}
