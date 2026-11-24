// Backlog flow and rework (#8037 slice 1): is the pile shrinking, and what does moving fast cost?
//
// Eric, 2026-11-23: "If backlog piles up, it's indication of problems that ... directly impedes
// development", and, of deciding without him when the evidence favours one path, "iterations make
// incremental improvements which effectively brute force us to a better/superior solution over
// time". Plan #8037 lets sessions decide more on their own; these three readings are its meter, so
// the pile and the price of speed are numbers on the weekly page, not a feeling. Its falsifier
// reads `rework.rate` (over 0.15 by 2026-12-21 narrows the plan back to Eric's flip).
//
// PURE, like the rest of build.mjs's inputs: each function reads only what gather.mjs collected, and
// the honesty rule is the meter's — a reading that could not be taken is null or its words, never 0.
import { parkedBy } from "../moneypenny/labels.mjs";
import { prKind } from "./metrics.mjs";

const DAY = 86400000;
/** A fix or revert landing this long after a merge counts against it (#8037's criterion). */
export const REWORK_WINDOW_MS = 48 * 3600000;
/** A plan without `ready` older than this is the plan's "older than 3 weeks" stock. */
const PLAN_OLD_DAYS = 21;
/** A plan without `ready` untouched this long is due a judge (#8037 slices 2 and 3). */
export const PLAN_UNTOUCHED_DAYS = 14;
/** The flip is due when this many `feedback` issues wait for `ready`, or the oldest has waited this
 *  long, even with the lanes fed (#8037 slice 2: scripts/flip-due.mjs reads these, the meter prints
 *  the same pile, so the number a person reads and the number that fires the flip cannot differ). */
export const FEEDBACK_PILE_MAX = 20;
export const FEEDBACK_OLDEST_DAYS = 14;

const names = (issue) => (issue.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));
const days = (ms) => Number((ms / DAY).toFixed(1));

/**
 * The open stock at the moment of the run. `issues` are open issues (no PRs) as
 * `{ number, labels, createdAt, updatedAt }`. The open `needs-eric` count and its oldest age are
 * `metrics.needsEric`, read from when the label went on, so they are not repeated here.
 */
export function backlogStock(issues, asOfMs) {
  const rows = issues.map((i) => ({ ...i, names: names(i) }));
  const unready = (r) => !r.names.includes("ready");
  const age = (at) => asOfMs - Date.parse(at);
  const plans = rows.filter((r) => r.names.includes("plan"));
  const unreadyPlans = plans.filter(unready);
  // The flip's own pool (scripts/flip-due.mjs): feedback not ready, not parked, not being built.
  const feedback = rows.filter(
    (r) =>
      r.names.includes("feedback") &&
      unready(r) &&
      !r.names.includes("in-progress") &&
      parkedBy(r.names).length === 0,
  );
  const feedbackAges = feedback.map((r) => age(r.createdAt));
  return {
    open: rows.length,
    ready: rows.filter((r) => r.names.includes("ready")).length,
    needsInfo: rows.filter((r) => r.names.includes("needs-info")).length,
    plans: {
      open: plans.length,
      unready: unreadyPlans.length,
      unreadyOld: unreadyPlans.filter((r) => age(r.createdAt) > PLAN_OLD_DAYS * DAY).length,
      unreadyUntouched: unreadyPlans.filter((r) => age(r.updatedAt) > PLAN_UNTOUCHED_DAYS * DAY)
        .length,
    },
    feedback: {
      unready: feedback.length,
      oldestDays: feedbackAges.length ? days(Math.max(...feedbackAges)) : null,
    },
    thresholds: { planOldDays: PLAN_OLD_DAYS, planUntouchedDays: PLAN_UNTOUCHED_DAYS },
  };
}

/**
 * Inflow against outflow inside the week. `issues` are every issue updated since the week began
 * (opening or closing one updates it), as `{ number, labels, createdAt, closedAt, stateReason }`.
 * A plan closed as superseded is outflow too, so `closed` counts both reasons and splits them.
 */
export function backlogFlow(issues, w) {
  const within = (at) => at != null && Date.parse(at) >= w.sinceMs && Date.parse(at) < w.untilMs;
  const flow = (rows) => {
    const opened = rows.filter((i) => within(i.createdAt)).length;
    const closed = rows.filter((i) => within(i.closedAt));
    return {
      opened,
      closed: closed.length,
      completed: closed.filter((i) => i.stateReason === "completed").length,
      notPlanned: closed.filter((i) => i.stateReason !== "completed").length,
      net: opened - closed.length,
    };
  };
  const labelled = (label) => issues.filter((i) => names(i).includes(label));
  return { all: flow(issues), plans: flow(labelled("plan")), feedback: flow(labelled("feedback")) };
}

const REVERT = /^revert\b/i;
const FIX = /^fix(\([^)]*\))?!?:/i;

const isDecision = (pr, w) => {
  const at = Date.parse(pr.mergedAt);
  const kind = prKind(pr);
  return at >= w.sinceMs && at < w.untilMs && kind !== "dependabot" && kind !== "research";
};

/**
 * The candidate pairs: a decision merged in the week, and a later revert or `fix` merged within
 * 48h (and by the moment of the run) that names it. gather.mjs reads the changed files of these
 * PRs only, so `rework` can keep the pairs that share one; a handful of calls a week.
 */
export function reworkCandidates(prs, w, asOfMs) {
  const merged = prs.filter((pr) => pr.mergedAt && Date.parse(pr.mergedAt) <= asOfMs);
  const followers = merged.filter((pr) => REVERT.test(pr.title ?? "") || FIX.test(pr.title ?? ""));
  return merged
    .filter((d) => isDecision(d, w))
    .flatMap((d) => {
      const at = Date.parse(d.mergedAt);
      return followers
        .filter((f) => {
          const fAt = Date.parse(f.mergedAt);
          const late = fAt - at;
          return (
            f.number !== d.number &&
            late > 0 &&
            late <= REWORK_WINDOW_MS &&
            f.refs?.includes(d.number)
          );
        })
        .map((f) => ({ decision: d.number, by: f.number, revert: REVERT.test(f.title) }));
    });
}

/** The PR numbers whose changed files `rework` needs, once each. */
export const candidatePrs = (pairs) =>
  [...new Set(pairs.flatMap((p) => [p.decision, p.by]))].sort((a, b) => a - b);

/**
 * Reverts and fix-forwards within 48h, per autonomous decision merged in the week.
 *
 * A DECISION, until slice 4 logs decisions on evidence as ledger rows, is a merged PR that is not
 * dependabot's or a research lane's: under the merge posture (CLAUDE.md) each shipped on a session's
 * call with no pre-merge review. Research calls are left out because the research scorecard
 * (`metrics.research`) already grades them, and on 2026-W47 they were 243 of 281 merges, enough to
 * dilute the rate sevenfold. Its class is its PR kind (prKind).
 *
 * REWORK is a later merged PR, within 48h, that is a revert or a `fix`, names the decision in its
 * title or body, AND changes a file the decision changed. The file test is what keeps a fix that
 * names a PR only as the push that exposed a bug out of the count: on W47, #7773 named #7762 (a
 * research pulse whose push hit a spent API budget) and #7902 named #7900 (a digest whose commit
 * turned a flaky e2e red), and neither touched the other's files.
 *
 * A decision whose 48h has not run out at the moment of the run is `open`, not clean: the rate is
 * over the decisions whose window has closed. `files` maps a PR number to its changed paths, read
 * for the candidate pairs only. Inputs saved before #8037 lack PR references, and a failed file read
 * arrives as its words: either reads unknown, never zero rework.
 */
export function rework(prs, w, asOfMs, files) {
  const merged = prs.filter((pr) => pr.mergedAt && Date.parse(pr.mergedAt) <= asOfMs);
  if (merged.length && !merged.some((pr) => Array.isArray(pr.refs)))
    return "unavailable: these inputs predate the PR references rework reads (#8037)";
  if (typeof files === "string") return files;
  if (files == null || typeof files !== "object")
    return "unavailable: no changed files were read for the rework pairs (#8037)";
  const shares = ({ decision, by }) => {
    const mine = new Set(files[decision] ?? []);
    return (files[by] ?? []).some((path) => mine.has(path));
  };
  const pairs = reworkCandidates(prs, w, asOfMs).filter(shares);
  const decisions = merged.filter((d) => isDecision(d, w));
  const items = [];
  let open = 0;
  const byKind = {};
  for (const d of decisions) {
    const kind = prKind(d);
    byKind[kind] ??= { decisions: 0, reworked: 0 };
    byKind[kind].decisions += 1;
    const hits = pairs.filter((p) => p.decision === d.number);
    if (hits.length) {
      const by = hits.find((p) => p.revert) ?? hits[0];
      items.push({ number: d.number, kind, how: by.revert ? "revert" : "fix-forward", by: by.by });
      byKind[kind].reworked += 1;
    } else if (Date.parse(d.mergedAt) + REWORK_WINDOW_MS > asOfMs) open += 1;
  }
  const reverted = items.filter((i) => i.how === "revert").length;
  const scored = decisions.length - open;
  return {
    decisions: decisions.length,
    open,
    reverted,
    fixedForward: items.length - reverted,
    rate: scored > 0 ? Number((items.length / scored).toFixed(2)) : null,
    byKind,
    items: items.sort((a, b) => a.number - b.number),
  };
}

/** The issue and PR numbers a PR's title and body name (`#N`, or `owner/repo#N` in a revert). */
export function refsOf(title, body) {
  const text = `${title ?? ""}\n${body ?? ""}`;
  return [...new Set([...text.matchAll(/#(\d+)\b/g)].map((m) => Number(m[1])))].sort(
    (a, b) => a - b,
  );
}
